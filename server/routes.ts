import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertLaborerProfileSchema, insertJobSchema, insertSobrietyCheckSchema } from "@shared/schema";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

// WebSocket clients map: userId -> WebSocket
const clients = new Map<string, WebSocket>();

// Set up multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    console.log("WebSocket client connected");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "register" && data.userId) {
          clients.set(data.userId, ws);
          console.log(`[WebSocket Register] ✅ User ${data.userId} registered for notifications (Total clients: ${clients.size})`);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      // Remove client on disconnect
      for (const [userId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(userId);
          console.log(`[WebSocket Disconnect] User ${userId} disconnected (Total clients: ${clients.size})`);
          break;
        }
      }
    });
  });

  // Helper function to notify laborers
  function notifyLaborers(laborerIds: string[], job: any) {
    console.log(`[WebSocket Notify] Attempting to notify ${laborerIds.length} laborers:`, laborerIds);
    
    laborerIds.forEach((laborerId) => {
      const ws = clients.get(laborerId);
      
      if (!ws) {
        console.log(`[WebSocket Notify] ❌ Laborer ${laborerId} not found in clients map (not connected)`);
        return;
      }
      
      if (ws.readyState !== WebSocket.OPEN) {
        console.log(`[WebSocket Notify] ❌ Laborer ${laborerId} socket not OPEN (state: ${ws.readyState})`);
        return;
      }
      
      console.log(`[WebSocket Notify] ✅ Sending notification to laborer ${laborerId}`);
      ws.send(JSON.stringify({
        type: "new_job",
        job,
      }));
    });
  }

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const user = await storage.createUser(validatedData);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Laborer profile routes
  app.post("/api/laborer/profile", async (req, res) => {
    try {
      const validatedData = insertLaborerProfileSchema.parse(req.body);
      const profile = await storage.createLaborerProfile(validatedData);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/laborer/profile/:userId", async (req, res) => {
    try {
      const profile = await storage.getLaborerProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/laborer/profile/:userId", async (req, res) => {
    try {
      const profile = await storage.updateLaborerProfile(req.params.userId, req.body);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Job routes
  app.post("/api/jobs", async (req, res) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(validatedData);

      // Find matching laborers and notify them via WebSocket
      const skillsNeeded = validatedData.skillsNeeded as any[];
      const uniqueSkills = [...new Set(skillsNeeded.map(s => s.skill))];
      
      console.log(`[Job Matching] Looking for laborers with skills:`, uniqueSkills);
      
      const matchingLaborers: string[] = [];
      for (const skill of uniqueSkills) {
        const laborers = await storage.getLaborersBySkill(skill);
        console.log(`[Job Matching] Found ${laborers.length} laborers with skill '${skill}'`);
        laborers.forEach(laborer => {
          console.log(`[Job Matching] Laborer ${laborer.userId}: available=${laborer.availabilityStatus}`);
          if (laborer.availabilityStatus === "available" && !matchingLaborers.includes(laborer.userId)) {
            matchingLaborers.push(laborer.userId);
          }
        });
      }

      console.log(`[Job Matching] Total matching laborers: ${matchingLaborers.length}`, matchingLaborers);
      console.log(`[WebSocket] Connected clients:`, Array.from(clients.keys()));
      
      // Notify all matching laborers
      notifyLaborers(matchingLaborers, job);

      res.json(job);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/jobs/customer/:customerId", async (req, res) => {
    try {
      const jobs = await storage.getJobsByCustomer(req.params.customerId);
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/jobs/laborer/:laborerId", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      let jobs = await storage.getJobsByLaborer(req.params.laborerId);
      
      // Filter by status if provided (e.g., "completed")
      if (status) {
        jobs = jobs.filter(job => job.status === status);
      }
      
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/jobs/:jobId", async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.jobId, req.body);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Job acceptance route (first laborer to accept gets the job)
  app.post("/api/jobs/:jobId/accept", async (req, res) => {
    try {
      const { laborerId } = req.body;
      const job = await storage.getJob(req.params.jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.status !== "pending") {
        return res.status(400).json({ error: "Job already assigned" });
      }

      // Update job status to assigned
      const updatedJob = await storage.updateJob(req.params.jobId, {
        status: "assigned",
        assignedLaborerId: laborerId,
        assignedAt: new Date(),
      });

      // Update laborer availability
      await storage.updateLaborerProfile(laborerId, {
        availabilityStatus: "busy",
      });

      res.json(updatedJob);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Job completion route - marks job as complete and creates payment
  app.post("/api/jobs/:jobId/complete", async (req, res) => {
    try {
      const { customerId } = req.body;
      const job = await storage.getJob(req.params.jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.status !== "assigned") {
        return res.status(400).json({ error: "Job is not assigned or already completed" });
      }

      if (!job.assignedLaborerId) {
        return res.status(400).json({ error: "No laborer assigned to this job" });
      }

      // Mark job as completed
      const completedJob = await storage.updateJob(req.params.jobId, {
        status: "completed",
        completedAt: new Date(),
      });

      // Create payment record
      const payment = await storage.createPayment({
        jobId: job.id,
        laborerId: job.assignedLaborerId,
        customerId: job.customerId,
        amount: job.totalAmount,
        platformFee: job.platformFee,
        status: "completed",
      });

      // Update laborer profile: increment earnings and completed jobs
      const laborerProfile = await storage.getLaborerProfile(job.assignedLaborerId);
      if (laborerProfile) {
        await storage.updateLaborerProfile(job.assignedLaborerId, {
          totalEarnings: (laborerProfile.totalEarnings || 0) + job.totalAmount,
          completedJobs: (laborerProfile.completedJobs || 0) + 1,
          availabilityStatus: "available", // Make laborer available again
        });
      }

      res.json({ job: completedJob, payment });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sobriety check routes
  app.post("/api/sobriety-check", async (req, res) => {
    try {
      const validatedData = insertSobrietyCheckSchema.parse(req.body);
      
      // Check for cooldown
      const latestCheck = await storage.getLatestSobrietyCheck(validatedData.laborerId);
      if (latestCheck?.cooldownUntil && new Date() < new Date(latestCheck.cooldownUntil)) {
        return res.status(403).json({ 
          error: "Cooldown period active",
          cooldownUntil: latestCheck.cooldownUntil 
        });
      }

      // Initialize Gemini AI
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Analyze image with Gemini Vision
      const prompt = `Analyze this image for signs of impairment or intoxication. Check for:
1. Eye movement patterns (redness, dilation, unusual patterns)
2. Head stability and posture
3. Skin color abnormalities
4. Overall alertness and focus

Respond with a JSON object: { "status": "passed" | "failed", "analysis": "detailed findings" }`;

      const imageParts = [{
        inlineData: {
          data: validatedData.imageDataUrl?.split(',')[1] || '',
          mimeType: "image/jpeg",
        },
      }];

      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();
      
      // Parse AI response
      let aiResult;
      try {
        aiResult = JSON.parse(responseText);
      } catch {
        // Fallback if AI doesn't return proper JSON
        aiResult = {
          status: responseText.toLowerCase().includes("passed") ? "passed" : "failed",
          analysis: responseText,
        };
      }

      // Set cooldown if failed (5-6 hours)
      const cooldownUntil = aiResult.status === "failed" 
        ? new Date(Date.now() + (5.5 * 60 * 60 * 1000)) // 5.5 hours
        : undefined;

      const check = await storage.createSobrietyCheck({
        ...validatedData,
        status: aiResult.status,
        analysisResult: aiResult.analysis,
        cooldownUntil,
      });

      res.json(check);
    } catch (error: any) {
      console.error("Sobriety check error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sobriety-check/latest/:laborerId", async (req, res) => {
    try {
      const check = await storage.getLatestSobrietyCheck(req.params.laborerId);
      res.json(check || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Payment routes
  app.post("/api/payments", async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      
      // Update laborer earnings
      const profile = await storage.getLaborerProfile(payment.laborerId);
      if (profile) {
        await storage.updateLaborerProfile(payment.laborerId, {
          totalEarnings: (profile.totalEarnings || 0) + payment.amount,
          completedJobs: (profile.completedJobs || 0) + 1,
        });
      }

      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/payments/laborer/:laborerId", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByLaborer(req.params.laborerId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/payments/customer/:customerId", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByCustomer(req.params.customerId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/payments/:paymentId", async (req, res) => {
    try {
      const payment = await storage.updatePayment(req.params.paymentId, req.body);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // File upload route for address proof
  app.post("/api/upload/address-proof", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const privateDir = process.env.PRIVATE_OBJECT_DIR;
      if (!privateDir) {
        throw new Error("Object storage not configured");
      }

      // Generate unique filename
      const ext = path.extname(req.file.originalname);
      const filename = `address-proof-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const filePath = path.join(privateDir, filename);

      // Write file to object storage
      await fs.writeFile(filePath, req.file.buffer);

      // Return the file path
      res.json({ 
        url: filePath,
        filename: filename
      });
    } catch (error: any) {
      console.error("File upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
