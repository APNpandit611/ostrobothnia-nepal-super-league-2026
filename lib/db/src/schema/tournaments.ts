import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tournamentsTable = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  date: text("date").notNull(),
  venue: text("venue").notNull(),
  city: text("city"),
  format: text("format").notNull().default("7-a-side"),
  maxTeams: integer("max_teams").default(5),
  kickoffTime: text("kickoff_time").default("10:00"),
  description: text("description"),
  rules: text("rules").array(),
  prizes: text("prizes").array(),
  status: text("status").notNull().default("upcoming"),
  isActive: boolean("is_active").default(false),
  tieSheetUrl: text("tie_sheet_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTournamentSchema = createInsertSchema(tournamentsTable).omit({ id: true, createdAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournamentsTable.$inferSelect;
