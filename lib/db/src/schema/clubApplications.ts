import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const CLUB_APPLICATION_STATUSES = ["pending", "accepted", "rejected"] as const;
export type ClubApplicationStatus = typeof CLUB_APPLICATION_STATUSES[number];

export const clubApplicationsTable = pgTable("club_applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  dob: text("dob"),
  position: text("position"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClubApplicationSchema = createInsertSchema(clubApplicationsTable).omit({
  id: true, createdAt: true, updatedAt: true, status: true, adminNote: true,
});
export type InsertClubApplication = z.infer<typeof insertClubApplicationSchema>;
export type ClubApplication = typeof clubApplicationsTable.$inferSelect;
