import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type LaborerProfile,
  type InsertLaborerProfile,
  type Job,
  type InsertJob,
  type SobrietyCheck,
  type InsertSobrietyCheck,
  type Payment,
  type InsertPayment,
  type WorkerWallet,
  type InsertWorkerWallet,
  type Withdrawal,
  type InsertWithdrawal,
  type PlatformRevenue,
  type InsertPlatformRevenue,
  users,
  laborerProfiles,
  jobs,
  sobrietyChecks,
  payments,
  workerWallets,
  withdrawals,
  platformRevenue,
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  verifyPassword(email: string, password: string): Promise<User | null>;

  // Laborer Profile methods
  getLaborerProfile(userId: string): Promise<LaborerProfile | undefined>;
  createLaborerProfile(profile: InsertLaborerProfile): Promise<LaborerProfile>;
  updateLaborerProfile(userId: string, updates: Partial<LaborerProfile>): Promise<LaborerProfile | undefined>;
  getLaborersBySkill(skill: string): Promise<(LaborerProfile & { user: User })[]>;
  getAllLaborers(): Promise<(LaborerProfile & { user: User })[]>;

  // Job methods
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getJobsByCustomer(customerId: string): Promise<Job[]>;
  getJobsByLaborer(laborerId: string): Promise<Job[]>;
  getAvailableJobsForLaborer(laborerId: string): Promise<Job[]>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
  getPendingJobs(): Promise<Job[]>;
  getAllJobs(): Promise<Job[]>;

  // Sobriety Check methods
  createSobrietyCheck(check: InsertSobrietyCheck): Promise<SobrietyCheck>;
  getSobrietyCheck(id: string): Promise<SobrietyCheck | undefined>;
  getLatestSobrietyCheck(laborerId: string): Promise<SobrietyCheck | undefined>;
  getAllSobrietyChecks(): Promise<SobrietyCheck[]>;
  updateSobrietyCheck(id: string, updates: Partial<SobrietyCheck>): Promise<SobrietyCheck | undefined>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByLaborer(laborerId: string): Promise<Payment[]>;
  getPaymentsByCustomer(customerId: string): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;

  // Worker Wallet methods
  getWorkerWallet(laborerId: string): Promise<WorkerWallet | undefined>;
  createWorkerWallet(wallet: InsertWorkerWallet): Promise<WorkerWallet>;
  updateWorkerWallet(laborerId: string, updates: Partial<WorkerWallet>): Promise<WorkerWallet | undefined>;
  
  // Withdrawal methods
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawalsByLaborer(laborerId: string): Promise<Withdrawal[]>;
  getWithdrawal(id: string): Promise<Withdrawal | undefined>;
  updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined>;
  getPendingWithdrawals(): Promise<Withdrawal[]>;
  
  // Platform Revenue methods
  getPlatformRevenue(date: Date): Promise<PlatformRevenue | undefined>;
  createOrUpdatePlatformRevenue(revenue: InsertPlatformRevenue): Promise<PlatformRevenue>;
  getTotalPlatformRevenue(): Promise<{ total: number; transactions: number }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Laborer Profile methods
  async getLaborerProfile(userId: string): Promise<LaborerProfile | undefined> {
    const result = await db
      .select()
      .from(laborerProfiles)
      .where(eq(laborerProfiles.userId, userId))
      .limit(1);
    return result[0];
  }

  async createLaborerProfile(profile: InsertLaborerProfile): Promise<LaborerProfile> {
    const result = await db.insert(laborerProfiles).values(profile).returning();
    return result[0];
  }

  async updateLaborerProfile(
    userId: string,
    updates: Partial<LaborerProfile>
  ): Promise<LaborerProfile | undefined> {
    const result = await db
      .update(laborerProfiles)
      .set(updates)
      .where(eq(laborerProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async getLaborersBySkill(skill: string): Promise<(LaborerProfile & { user: User })[]> {
    const result = await db
      .select()
      .from(laborerProfiles)
      .leftJoin(users, eq(laborerProfiles.userId, users.id))
      .where(sql`${laborerProfiles.skills} @> ARRAY[${skill}]::text[]`);

    return result.map((row) => ({
      ...row.laborer_profiles,
      user: row.users!,
    }));
  }

  async getAllLaborers(): Promise<(LaborerProfile & { user: User })[]> {
    const result = await db
      .select()
      .from(laborerProfiles)
      .leftJoin(users, eq(laborerProfiles.userId, users.id))
      .orderBy(desc(laborerProfiles.createdAt));

    return result.map((row) => ({
      ...row.laborer_profiles,
      user: row.users!,
    }));
  }

  // Job methods
  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(job).returning();
    return result[0];
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }

  async getJobsByCustomer(customerId: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.customerId, customerId))
      .orderBy(desc(jobs.createdAt));
  }

  async getJobsByLaborer(laborerId: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.assignedLaborerId, laborerId))
      .orderBy(desc(jobs.createdAt));
  }

  async getAvailableJobsForLaborer(laborerId: string): Promise<Job[]> {
    // Get laborer's profile to check their skills
    const profile = await this.getLaborerProfile(laborerId);
    if (!profile || !profile.skills || profile.skills.length === 0) {
      return [];
    }

    // Get all pending jobs
    const pendingJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, "pending"))
      .orderBy(desc(jobs.createdAt));

    // Filter jobs that match laborer's skills
    return pendingJobs.filter(job => {
      const skillsNeeded = job.skillsNeeded as any[];
      return skillsNeeded.some((skillReq: any) => 
        profile.skills?.includes(skillReq.skill)
      );
    });
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const result = await db.update(jobs).set(updates).where(eq(jobs.id, id)).returning();
    return result[0];
  }

  async getPendingJobs(): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, "pending"))
      .orderBy(desc(jobs.createdAt));
  }

  async getAllJobs(): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt));
  }

  // Sobriety Check methods
  async createSobrietyCheck(check: InsertSobrietyCheck): Promise<SobrietyCheck> {
    const result = await db.insert(sobrietyChecks).values(check).returning();
    return result[0];
  }

  async getSobrietyCheck(id: string): Promise<SobrietyCheck | undefined> {
    const result = await db
      .select()
      .from(sobrietyChecks)
      .where(eq(sobrietyChecks.id, id))
      .limit(1);
    return result[0];
  }

  async getLatestSobrietyCheck(laborerId: string): Promise<SobrietyCheck | undefined> {
    const result = await db
      .select()
      .from(sobrietyChecks)
      .where(eq(sobrietyChecks.laborerId, laborerId))
      .orderBy(desc(sobrietyChecks.checkedAt))
      .limit(1);
    return result[0];
  }

  async getAllSobrietyChecks(): Promise<SobrietyCheck[]> {
    const result = await db
      .select()
      .from(sobrietyChecks)
      .orderBy(desc(sobrietyChecks.checkedAt));
    return result;
  }

  async updateSobrietyCheck(
    id: string,
    updates: Partial<SobrietyCheck>
  ): Promise<SobrietyCheck | undefined> {
    const result = await db
      .update(sobrietyChecks)
      .set(updates)
      .where(eq(sobrietyChecks.id, id))
      .returning();
    return result[0];
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return result[0];
  }

  async getPaymentsByLaborer(laborerId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.laborerId, laborerId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.customerId, customerId))
      .orderBy(desc(payments.createdAt));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const result = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return result[0];
  }

  // Worker Wallet methods
  async getWorkerWallet(laborerId: string): Promise<WorkerWallet | undefined> {
    const result = await db
      .select()
      .from(workerWallets)
      .where(eq(workerWallets.laborerId, laborerId))
      .limit(1);
    return result[0];
  }

  async createWorkerWallet(wallet: InsertWorkerWallet): Promise<WorkerWallet> {
    const result = await db.insert(workerWallets).values(wallet).returning();
    return result[0];
  }

  async updateWorkerWallet(laborerId: string, updates: Partial<WorkerWallet>): Promise<WorkerWallet | undefined> {
    const result = await db
      .update(workerWallets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workerWallets.laborerId, laborerId))
      .returning();
    return result[0];
  }

  // Withdrawal methods
  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const result = await db.insert(withdrawals).values(withdrawal).returning();
    return result[0];
  }

  async getWithdrawalsByLaborer(laborerId: string): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.laborerId, laborerId))
      .orderBy(desc(withdrawals.requestedAt));
  }

  async getWithdrawal(id: string): Promise<Withdrawal | undefined> {
    const result = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, id))
      .limit(1);
    return result[0];
  }

  async updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const result = await db
      .update(withdrawals)
      .set(updates)
      .where(eq(withdrawals.id, id))
      .returning();
    return result[0];
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.status, "pending"))
      .orderBy(desc(withdrawals.requestedAt));
  }

  // Platform Revenue methods
  async getPlatformRevenue(date: Date): Promise<PlatformRevenue | undefined> {
    const result = await db
      .select()
      .from(platformRevenue)
      .where(eq(platformRevenue.date, date))
      .limit(1);
    return result[0];
  }

  async createOrUpdatePlatformRevenue(revenue: InsertPlatformRevenue): Promise<PlatformRevenue> {
    const existing = await this.getPlatformRevenue(revenue.date);
    
    if (existing) {
      const result = await db
        .update(platformRevenue)
        .set({
          totalRevenue: existing.totalRevenue + (revenue.totalRevenue || 0),
          customerConvenienceFees: existing.customerConvenienceFees + (revenue.customerConvenienceFees || 0),
          workerConvenienceFees: existing.workerConvenienceFees + (revenue.workerConvenienceFees || 0),
          transactionCount: existing.transactionCount + (revenue.transactionCount || 0),
          totalServiceAmount: existing.totalServiceAmount + (revenue.totalServiceAmount || 0),
          totalWorkerPayouts: existing.totalWorkerPayouts + (revenue.totalWorkerPayouts || 0),
        })
        .where(eq(platformRevenue.date, revenue.date))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(platformRevenue).values(revenue).returning();
      return result[0];
    }
  }

  async getTotalPlatformRevenue(): Promise<{ total: number; transactions: number }> {
    const result = await db
      .select({
        total: sql<number>`sum(${platformRevenue.totalRevenue})`,
        transactions: sql<number>`sum(${platformRevenue.transactionCount})`,
      })
      .from(platformRevenue);
    
    return {
      total: Number(result[0]?.total || 0),
      transactions: Number(result[0]?.transactions || 0),
    };
  }
}

export const storage = new DatabaseStorage();
