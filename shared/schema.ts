import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "laborer"]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "assigned", "in_progress", "completed", "cancelled"]);
export const sobrietyStatusEnum = pgEnum("sobriety_status", ["passed", "failed", "pending_review"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed"]);
export const skillTypeEnum = pgEnum("skill_type", ["mason", "carpenter", "plumber", "painter", "helper"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Laborer profiles table
export const laborerProfiles = pgTable("laborer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skills: text("skills").array().notNull(), // array of skill types
  upiId: text("upi_id").notNull(),
  aadhaarNumber: text("aadhaar_number").notNull(),
  addressProofUrl: text("address_proof_url"),
  isVerified: boolean("is_verified").default(false).notNull(),
  availabilityStatus: text("availability_status").default("available").notNull(), // available, busy, unavailable
  totalEarnings: integer("total_earnings").default(0).notNull(),
  completedJobs: integer("completed_jobs").default(0).notNull(),
  rating: integer("rating").default(5).notNull(), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: jobStatusEnum("status").default("pending").notNull(),
  skillsNeeded: jsonb("skills_needed").notNull(), // [{skill: string, quantity: number, rate: number}]
  location: text("location").notNull(),
  totalAmount: integer("total_amount").notNull(), // in rupees
  platformFee: integer("platform_fee").default(10).notNull(),
  assignedLaborerId: varchar("assigned_laborer_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  assignedAt: timestamp("assigned_at"),
  completedAt: timestamp("completed_at"),
});

// Sobriety checks table
export const sobrietyChecks = pgTable("sobriety_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  laborerId: varchar("laborer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: varchar("job_id").references(() => jobs.id, { onDelete: "set null" }),
  status: sobrietyStatusEnum("status").notNull(),
  analysisResult: text("analysis_result"), // AI analysis details
  imageDataUrl: text("image_data_url"), // base64 image for verification
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  cooldownUntil: timestamp("cooldown_until"), // if failed, cooldown period
});

// Payments/Earnings table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  laborerId: varchar("laborer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // laborer's earnings
  platformFee: integer("platform_fee").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  laborerProfile: one(laborerProfiles, {
    fields: [users.id],
    references: [laborerProfiles.userId],
  }),
  jobsAsCustomer: many(jobs, { relationName: "customer_jobs" }),
  jobsAsLaborer: many(jobs, { relationName: "laborer_jobs" }),
  sobrietyChecks: many(sobrietyChecks),
  paymentsAsLaborer: many(payments, { relationName: "laborer_payments" }),
  paymentsAsCustomer: many(payments, { relationName: "customer_payments" }),
}));

export const laborerProfilesRelations = relations(laborerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [laborerProfiles.userId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  customer: one(users, {
    fields: [jobs.customerId],
    references: [users.id],
    relationName: "customer_jobs",
  }),
  assignedLaborer: one(users, {
    fields: [jobs.assignedLaborerId],
    references: [users.id],
    relationName: "laborer_jobs",
  }),
  sobrietyChecks: many(sobrietyChecks),
  payments: many(payments),
}));

export const sobrietyChecksRelations = relations(sobrietyChecks, ({ one }) => ({
  laborer: one(users, {
    fields: [sobrietyChecks.laborerId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [sobrietyChecks.jobId],
    references: [jobs.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  job: one(jobs, {
    fields: [payments.jobId],
    references: [jobs.id],
  }),
  laborer: one(users, {
    fields: [payments.laborerId],
    references: [users.id],
    relationName: "laborer_payments",
  }),
  customer: one(users, {
    fields: [payments.customerId],
    references: [users.id],
    relationName: "customer_payments",
  }),
}));

// Insert schemas and types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLaborerProfileSchema = createInsertSchema(laborerProfiles).omit({
  id: true,
  createdAt: true,
  totalEarnings: true,
  completedJobs: true,
  rating: true,
  isVerified: true,
  availabilityStatus: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  assignedAt: true,
  completedAt: true,
  status: true,
  assignedLaborerId: true,
});

export const insertSobrietyCheckSchema = createInsertSchema(sobrietyChecks).omit({
  id: true,
  checkedAt: true,
  reviewedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

// Infer types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type LaborerProfile = typeof laborerProfiles.$inferSelect;
export type InsertLaborerProfile = z.infer<typeof insertLaborerProfileSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type SobrietyCheck = typeof sobrietyChecks.$inferSelect;
export type InsertSobrietyCheck = z.infer<typeof insertSobrietyCheckSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Government labor rates (in INR per day)
export const LABOR_RATES = {
  mason: 700,
  carpenter: 650,
  plumber: 600,
  painter: 550,
  helper: 400,
} as const;

// Skill types
export type SkillType = keyof typeof LABOR_RATES;

// Job skill requirement type
export type JobSkillRequirement = {
  skill: SkillType;
  quantity: number;
  rate: number;
};
