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
  users,
  laborerProfiles,
  jobs,
  sobrietyChecks,
  payments,
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;

  // Laborer Profile methods
  getLaborerProfile(userId: string): Promise<LaborerProfile | undefined>;
  createLaborerProfile(profile: InsertLaborerProfile): Promise<LaborerProfile>;
  updateLaborerProfile(userId: string, updates: Partial<LaborerProfile>): Promise<LaborerProfile | undefined>;
  getLaborersBySkill(skill: string): Promise<(LaborerProfile & { user: User })[]>;

  // Job methods
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getJobsByCustomer(customerId: string): Promise<Job[]>;
  getJobsByLaborer(laborerId: string): Promise<Job[]>;
  getAvailableJobsForLaborer(laborerId: string): Promise<Job[]>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
  getPendingJobs(): Promise<Job[]>;

  // Sobriety Check methods
  createSobrietyCheck(check: InsertSobrietyCheck): Promise<SobrietyCheck>;
  getLatestSobrietyCheck(laborerId: string): Promise<SobrietyCheck | undefined>;
  updateSobrietyCheck(id: string, updates: Partial<SobrietyCheck>): Promise<SobrietyCheck | undefined>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByLaborer(laborerId: string): Promise<Payment[]>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
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

  // Sobriety Check methods
  async createSobrietyCheck(check: InsertSobrietyCheck): Promise<SobrietyCheck> {
    const result = await db.insert(sobrietyChecks).values(check).returning();
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

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const result = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
