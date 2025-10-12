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

  // Get available jobs for a laborer (pending jobs matching their skills)
  app.get("/api/jobs/available/:laborerId", async (req, res) => {
    try {
      const jobs = await storage.getAvailableJobsForLaborer(req.params.laborerId);
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

  // Laborer marks job as ready for review
  app.post("/api/jobs/:jobId/ready-for-review", async (req, res) => {
    try {
      const { laborerId } = req.body;
      const job = await storage.getJob(req.params.jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.status !== "assigned") {
        return res.status(400).json({ error: "Job is not in assigned status" });
      }

      if (job.assignedLaborerId !== laborerId) {
        return res.status(403).json({ error: "You are not assigned to this job" });
      }

      // Mark job as ready for review
      const updatedJob = await storage.updateJob(req.params.jobId, {
        status: "ready_for_review",
      });

      // TODO: Send notification to customer that job is ready for review

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

      if (job.status !== "assigned" && job.status !== "ready_for_review") {
        return res.status(400).json({ error: "Job is not ready for completion" });
      }

      if (!job.assignedLaborerId) {
        return res.status(400).json({ error: "No laborer assigned to this job" });
      }

      // Calculate amounts with dual convenience charges
      const customerConvenienceFee = job.customerConvenienceFee || 10;
      const workerConvenienceFee = job.workerConvenienceFee || 10;
      const workerNetEarnings = job.totalAmount - workerConvenienceFee; // Worker gets service amount minus their fee
      const platformRevenue = customerConvenienceFee + workerConvenienceFee; // ₹20 total

      // Mark job as completed
      const completedJob = await storage.updateJob(req.params.jobId, {
        status: "completed",
        completedAt: new Date(),
      });

      // Create payment record with dual convenience charges
      const payment = await storage.createPayment({
        jobId: job.id,
        laborerId: job.assignedLaborerId,
        customerId: job.customerId,
        amount: workerNetEarnings, // Worker's net earnings after fee deduction
        customerConvenienceFee,
        workerConvenienceFee,
        platformFee: platformRevenue, // Total platform revenue
        status: "completed",
      });

      // Update laborer profile: increment earnings and completed jobs
      const laborerProfile = await storage.getLaborerProfile(job.assignedLaborerId);
      if (laborerProfile) {
        await storage.updateLaborerProfile(job.assignedLaborerId, {
          totalEarnings: (laborerProfile.totalEarnings || 0) + job.totalAmount, // Total before fee
          completedJobs: (laborerProfile.completedJobs || 0) + 1,
          availabilityStatus: "available", // Make laborer available again
        });
      }

      // Update or create worker wallet
      let wallet = await storage.getWorkerWallet(job.assignedLaborerId);
      if (!wallet) {
        wallet = await storage.createWorkerWallet({
          laborerId: job.assignedLaborerId,
        });
      }

      // Update wallet with new earnings
      await storage.updateWorkerWallet(job.assignedLaborerId, {
        availableBalance: wallet.availableBalance + workerNetEarnings,
        totalEarnings: wallet.totalEarnings + job.totalAmount,
        totalPlatformFees: wallet.totalPlatformFees + workerConvenienceFee,
      });

      // Update platform revenue for today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for consistent date comparison

      await storage.createOrUpdatePlatformRevenue({
        date: today,
        totalRevenue: platformRevenue,
        customerConvenienceFees: customerConvenienceFee,
        workerConvenienceFees: workerConvenienceFee,
        transactionCount: 1,
        totalServiceAmount: job.totalAmount,
        totalWorkerPayouts: workerNetEarnings,
      });

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

      // System instruction for Gemini 2.5 Pro
      const systemPrompt = `You are a workplace safety AI specialist analyzing worker selfies for fitness for duty assessment.

Your task is to evaluate whether a worker appears to be under the influence of alcohol or substances that would make them unsafe to work.

Analyze the image for the following safety indicators:
1. Eye Movement & Focus - Look for bloodshot eyes, unusual dilation, difficulty focusing, or glazed appearance
2. Facial Expression - Check for signs of confusion, disorientation, or altered mental state
3. Head Position - Assess stability, ability to hold head steady, signs of swaying or instability
4. Skin Color Analysis - Look for flushing, pallor, or other color changes that might indicate impairment

Provide a comprehensive safety assessment with:
- Overall status: "passed" or "failed"
- Confidence score (0-100)
- Individual criteria scores and status
- List of any detected issues
- Risk level assessment
- Detailed analysis

Be thorough but fair in your assessment. Only fail cases where there are clear indicators of potential impairment that could affect workplace safety.`;

      // Extract base64 image data
      const imageData = validatedData.imageDataUrl?.split(',')[1] || '';

      // Use Gemini 2.5 Pro with structured JSON schema (proven WorkSafeVision approach)
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              overallStatus: {
                type: "string",
                enum: ["passed", "failed"]
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 100
              },
              criteria: {
                type: "object",
                properties: {
                  eyeMovement: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      status: { type: "string", enum: ["normal", "abnormal"] }
                    },
                    required: ["score", "status"]
                  },
                  facialExpression: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      status: { type: "string", enum: ["normal", "abnormal"] }
                    },
                    required: ["score", "status"]
                  },
                  headPosition: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      status: { type: "string", enum: ["stable", "unstable"] }
                    },
                    required: ["score", "status"]
                  },
                  skinColor: {
                    type: "object",
                    properties: {
                      score: { type: "number" },
                      status: { type: "string", enum: ["normal", "abnormal"] }
                    },
                    required: ["score", "status"]
                  }
                },
                required: ["eyeMovement", "facialExpression", "headPosition", "skinColor"]
              },
              detectedIssues: {
                type: "array",
                items: { type: "string" }
              },
              riskLevel: {
                type: "string",
                enum: ["low", "medium", "high"]
              },
              analysis: {
                type: "string"
              }
            },
            required: ["overallStatus", "confidence", "criteria", "detectedIssues", "riskLevel", "analysis"]
          },
        },
        contents: [
          {
            inlineData: {
              data: imageData,
              mimeType: "image/jpeg",
            },
          },
          "Analyze this worker selfie for workplace safety compliance and fitness for duty assessment.",
        ],
      });

      // Extract response text
      const responseText = result.text;
      
      if (!responseText) {
        throw new Error("Empty response from Gemini AI model");
      }

      console.log("Gemini AI Response:", responseText);

      // Parse structured JSON response
      let aiResult;
      try {
        aiResult = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        throw new Error("Invalid JSON response from AI");
      }

      // Validate the response structure and set defaults if missing
      if (!aiResult.overallStatus) {
        console.error("Missing overallStatus in AI response:", aiResult);
        throw new Error("AI did not return a valid status");
      }

      // Ensure all required fields are present
      if (!aiResult.criteria) {
        aiResult.criteria = {
          eyeMovement: { score: 0, status: "normal" },
          facialExpression: { score: 0, status: "normal" },
          headPosition: { score: 0, status: "stable" },
          skinColor: { score: 0, status: "normal" }
        };
      }

      if (typeof aiResult.confidence !== 'number') {
        aiResult.confidence = 50; // Default confidence
      }

      // Ensure confidence is within valid range
      aiResult.confidence = Math.max(0, Math.min(100, aiResult.confidence));
      
      // Ensure detectedIssues is an array
      if (!Array.isArray(aiResult.detectedIssues)) {
        aiResult.detectedIssues = [];
      }

      // Ensure riskLevel exists
      if (!aiResult.riskLevel) {
        aiResult.riskLevel = aiResult.overallStatus === "failed" ? "medium" : "low";
      }

      // Ensure analysis text exists
      if (!aiResult.analysis) {
        aiResult.analysis = `Worker appears to be ${aiResult.overallStatus === "passed" ? "fit for duty" : "potentially impaired"}.`;
      }
      
      console.log("Sobriety Check Result:", aiResult);

      // Map overallStatus to status enum values ("passed", "failed", "pending_review")
      const status = aiResult.overallStatus as "passed" | "failed";

      // Set cooldown if failed (5-6 hours)
      const cooldownUntil = status === "failed" 
        ? new Date(Date.now() + (5.5 * 60 * 60 * 1000)) // 5.5 hours
        : undefined;

      const check = await storage.createSobrietyCheck({
        ...validatedData,
        status,
        analysisResult: JSON.stringify(aiResult),
        cooldownUntil,
      });

      res.json(check);
    } catch (error: any) {
      console.error("Sobriety check error:", error);
      res.status(500).json({ error: error.message || "Sobriety check failed" });
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

  // Request manual review for failed sobriety check
  app.post("/api/sobriety-check/request-review", async (req, res) => {
    try {
      const { laborerId } = req.body;
      
      if (!laborerId) {
        return res.status(400).json({ error: "Laborer ID required" });
      }

      const latestCheck = await storage.getLatestSobrietyCheck(laborerId);
      
      if (!latestCheck) {
        return res.status(404).json({ error: "No sobriety check found" });
      }

      if (latestCheck.status !== "failed") {
        return res.status(400).json({ error: "Can only request review for failed checks" });
      }

      // Update check status to pending_review
      const updatedCheck = await storage.updateSobrietyCheck(latestCheck.id, {
        status: "pending_review",
      });

      res.json(updatedCheck);
    } catch (error: any) {
      console.error("Request review error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin routes for sobriety check management
  app.get("/api/admin/sobriety-checks", async (req, res) => {
    try {
      // TODO: Add admin authentication check here
      const checks = await storage.getAllSobrietyChecks();
      res.json(checks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/sobriety-check/:checkId/approve", async (req, res) => {
    try {
      // TODO: Add admin authentication check here
      const { checkId } = req.params;
      
      const check = await storage.getSobrietyCheck(checkId);
      if (!check) {
        return res.status(404).json({ error: "Sobriety check not found" });
      }

      if (check.status !== "pending_review") {
        return res.status(400).json({ error: "Can only approve pending reviews" });
      }

      const updatedCheck = await storage.updateSobrietyCheck(checkId, {
        status: "passed",
        reviewedAt: new Date(),
        cooldownUntil: null, // Clear cooldown
      });

      // Update laborer availability if they were on cooldown
      await storage.updateLaborerProfile(check.laborerId, {
        availabilityStatus: "available",
      });

      res.json(updatedCheck);
    } catch (error: any) {
      console.error("Approve check error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/sobriety-check/:checkId/reject", async (req, res) => {
    try {
      // TODO: Add admin authentication check here
      const { checkId } = req.params;
      const { reason } = req.body;
      
      const check = await storage.getSobrietyCheck(checkId);
      if (!check) {
        return res.status(404).json({ error: "Sobriety check not found" });
      }

      if (check.status !== "pending_review") {
        return res.status(400).json({ error: "Can only reject pending reviews" });
      }

      // Extend cooldown by another 5.5 hours for rejected manual reviews
      const newCooldownUntil = new Date(Date.now() + (5.5 * 60 * 60 * 1000));

      const updatedCheck = await storage.updateSobrietyCheck(checkId, {
        status: "failed",
        reviewedAt: new Date(),
        cooldownUntil: newCooldownUntil,
        analysisResult: check.analysisResult ? 
          JSON.stringify({ 
            ...JSON.parse(check.analysisResult), 
            manualReviewReason: reason || "Manual review rejection" 
          }) : 
          JSON.stringify({ manualReviewReason: reason || "Manual review rejection" }),
      });

      res.json(updatedCheck);
    } catch (error: any) {
      console.error("Reject check error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Payment routes
  // NOTE: This endpoint is for generic payment creation.
  // For job completion payments with dual convenience fees, use POST /api/jobs/:jobId/complete instead
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

  // Worker Wallet routes
  app.get("/api/wallet/:laborerId", async (req, res) => {
    try {
      let wallet = await storage.getWorkerWallet(req.params.laborerId);
      
      // Create wallet if it doesn't exist
      if (!wallet) {
        wallet = await storage.createWorkerWallet({
          laborerId: req.params.laborerId,
        });
      }
      
      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/wallet/:laborerId/bank-details", async (req, res) => {
    try {
      const { bankAccountNumber, bankIfscCode, bankAccountHolderName, bankName } = req.body;
      
      const wallet = await storage.updateWorkerWallet(req.params.laborerId, {
        bankAccountNumber,
        bankIfscCode,
        bankAccountHolderName,
        bankName,
      });
      
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Withdrawal routes
  app.post("/api/withdrawals", async (req, res) => {
    try {
      const { laborerId, amount } = req.body;
      
      // Get wallet to check balance
      const wallet = await storage.getWorkerWallet(laborerId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      // Validate withdrawal amount
      if (amount < 100) {
        return res.status(400).json({ error: "Minimum withdrawal amount is ₹100" });
      }
      
      if (amount > wallet.availableBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Check if bank account is added
      if (!wallet.bankAccountNumber) {
        return res.status(400).json({ error: "Bank account not added" });
      }
      
      // Create withdrawal request
      const withdrawal = await storage.createWithdrawal({
        laborerId,
        amount,
        status: "pending",
      });
      
      // Deduct from available balance
      await storage.updateWorkerWallet(laborerId, {
        availableBalance: wallet.availableBalance - amount,
      });
      
      res.json(withdrawal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/withdrawals/laborer/:laborerId", async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawalsByLaborer(req.params.laborerId);
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/withdrawals/pending", async (req, res) => {
    try {
      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/withdrawals/:withdrawalId", async (req, res) => {
    try {
      const withdrawal = await storage.updateWithdrawal(req.params.withdrawalId, req.body);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      
      // If withdrawal is completed, update wallet total withdrawn
      if (req.body.status === "completed" && withdrawal.status !== "completed") {
        const wallet = await storage.getWorkerWallet(withdrawal.laborerId);
        if (wallet) {
          await storage.updateWorkerWallet(withdrawal.laborerId, {
            totalWithdrawn: wallet.totalWithdrawn + withdrawal.amount,
          });
        }
      }
      
      // If withdrawal failed or cancelled, refund to available balance
      if ((req.body.status === "failed" || req.body.status === "cancelled") && withdrawal.status === "pending") {
        const wallet = await storage.getWorkerWallet(withdrawal.laborerId);
        if (wallet) {
          await storage.updateWorkerWallet(withdrawal.laborerId, {
            availableBalance: wallet.availableBalance + withdrawal.amount,
          });
        }
      }
      
      res.json(withdrawal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Platform Revenue routes
  app.get("/api/platform-revenue", async (req, res) => {
    try {
      const totalRevenue = await storage.getTotalPlatformRevenue();
      res.json(totalRevenue);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/platform-revenue/daily", async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      const revenue = await storage.getPlatformRevenue(targetDate);
      res.json(revenue || { totalRevenue: 0, transactionCount: 0 });
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
