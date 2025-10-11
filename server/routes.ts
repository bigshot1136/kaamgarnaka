import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertLaborerProfileSchema, insertJobSchema, insertSobrietyCheckSchema } from "@shared/schema";
import { GoogleGenAI } from "@google/genai";

// WebSocket clients map: userId -> WebSocket
const clients = new Map<string, WebSocket>();

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
          console.log(`User ${data.userId} registered for WebSocket notifications`);
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
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  // Helper function to notify laborers
  function notifyLaborers(laborerIds: string[], job: any) {
    laborerIds.forEach((laborerId) => {
      const ws = clients.get(laborerId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "new_job",
          job,
        }));
      }
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
      
      const matchingLaborers: string[] = [];
      for (const skill of uniqueSkills) {
        const laborers = await storage.getLaborersBySkill(skill);
        laborers.forEach(laborer => {
          if (laborer.availabilityStatus === "available" && !matchingLaborers.includes(laborer.userId)) {
            matchingLaborers.push(laborer.userId);
          }
        });
      }

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
      const jobs = await storage.getJobsByLaborer(req.params.laborerId);
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

  return httpServer;
}
