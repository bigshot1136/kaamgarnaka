import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "laborer", "admin"]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "assigned", "in_progress", "ready_for_review", "completed", "cancelled"]);
export const sobrietyStatusEnum = pgEnum("sobriety_status", ["passed", "failed", "pending_review"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "pending_approval", "approved", "rejected", "completed"]);
export const skillTypeEnum = pgEnum("skill_type", ["mason", "carpenter", "plumber", "painter", "helper"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["pending", "processing", "completed", "failed", "cancelled"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["earning", "withdrawal", "platform_fee"]);

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
  totalAmount: integer("total_amount").notNull(), // in rupees (service cost only)
  customerConvenienceFee: integer("customer_convenience_fee").default(10).notNull(), // ₹10 paid by customer
  workerConvenienceFee: integer("worker_convenience_fee").default(10).notNull(), // ₹10 deducted from worker
  platformFee: integer("platform_fee").default(20).notNull(), // total platform revenue (₹10 + ₹10)
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
  amount: integer("amount").notNull(), // laborer's earnings (after worker convenience fee)
  customerConvenienceFee: integer("customer_convenience_fee").default(10).notNull(),
  workerConvenienceFee: integer("worker_convenience_fee").default(10).notNull(),
  platformFee: integer("platform_fee").notNull(), // total platform revenue (customer + worker fees)
  status: paymentStatusEnum("status").default("pending").notNull(),
  transactionNumber: text("transaction_number"), // UPI transaction number/UTR
  paymentScreenshotUrl: text("payment_screenshot_url"), // Screenshot proof
  approvedAt: timestamp("approved_at"), // When admin approved payment
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Worker Wallets table
export const workerWallets = pgTable("worker_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  laborerId: varchar("laborer_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  availableBalance: integer("available_balance").default(0).notNull(),
  totalEarnings: integer("total_earnings").default(0).notNull(),
  totalPlatformFees: integer("total_platform_fees").default(0).notNull(),
  totalWithdrawn: integer("total_withdrawn").default(0).notNull(),
  bankAccountNumber: text("bank_account_number"),
  bankIfscCode: text("bank_ifsc_code"),
  bankAccountHolderName: text("bank_account_holder_name"),
  bankName: text("bank_name"),
  kycVerified: boolean("kyc_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Withdrawals table
export const withdrawals = pgTable("withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  laborerId: varchar("laborer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  utrNumber: text("utr_number"), // Unique Transaction Reference
  razorpayPayoutId: text("razorpay_payout_id"),
  failureReason: text("failure_reason"),
});

// Platform Revenue table
export const platformRevenue = pgTable("platform_revenue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().unique(), // daily entry
  totalRevenue: integer("total_revenue").default(0).notNull(),
  customerConvenienceFees: integer("customer_convenience_fees").default(0).notNull(),
  workerConvenienceFees: integer("worker_convenience_fees").default(0).notNull(),
  transactionCount: integer("transaction_count").default(0).notNull(),
  totalServiceAmount: integer("total_service_amount").default(0).notNull(),
  totalWorkerPayouts: integer("total_worker_payouts").default(0).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  laborerProfile: one(laborerProfiles, {
    fields: [users.id],
    references: [laborerProfiles.userId],
  }),
  workerWallet: one(workerWallets, {
    fields: [users.id],
    references: [workerWallets.laborerId],
  }),
  jobsAsCustomer: many(jobs, { relationName: "customer_jobs" }),
  jobsAsLaborer: many(jobs, { relationName: "laborer_jobs" }),
  sobrietyChecks: many(sobrietyChecks),
  paymentsAsLaborer: many(payments, { relationName: "laborer_payments" }),
  paymentsAsCustomer: many(payments, { relationName: "customer_payments" }),
  withdrawals: many(withdrawals),
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

export const workerWalletsRelations = relations(workerWallets, ({ one }) => ({
  laborer: one(users, {
    fields: [workerWallets.laborerId],
    references: [users.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  laborer: one(users, {
    fields: [withdrawals.laborerId],
    references: [users.id],
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
}).extend({
  status: z.enum(["passed", "failed", "pending_review"]).optional(),
  cooldownUntil: z.date().optional(),
  analysisResult: z.string().optional(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export const insertWorkerWalletSchema = createInsertSchema(workerWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  availableBalance: true,
  totalEarnings: true,
  totalPlatformFees: true,
  totalWithdrawn: true,
  kycVerified: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
});

export const insertPlatformRevenueSchema = createInsertSchema(platformRevenue).omit({
  id: true,
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

export type WorkerWallet = typeof workerWallets.$inferSelect;
export type InsertWorkerWallet = z.infer<typeof insertWorkerWalletSchema>;

export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;

export type PlatformRevenue = typeof platformRevenue.$inferSelect;
export type InsertPlatformRevenue = z.infer<typeof insertPlatformRevenueSchema>;

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
