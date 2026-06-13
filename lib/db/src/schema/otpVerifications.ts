import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const otpVerificationsTable = pgTable("otp_verifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contact: text("contact").notNull(),
  type: text("type").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OtpVerification = typeof otpVerificationsTable.$inferSelect;
