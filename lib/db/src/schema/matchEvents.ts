import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { matchesTable } from "./matches";
import { teamsTable } from "./teams";

export const matchEventsTable = pgTable("match_events", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  teamId: integer("team_id").references(() => teamsTable.id),
  eventType: text("event_type").notNull(),
  minute: integer("minute").notNull(),
  description: text("description"),
  playerName: text("player_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("match_events_match_id_idx").on(table.matchId),
  index("match_events_team_id_idx").on(table.teamId),
]);

export const insertMatchEventSchema = createInsertSchema(matchEventsTable).omit({ id: true, createdAt: true });
export type InsertMatchEvent = z.infer<typeof insertMatchEventSchema>;
export type MatchEvent = typeof matchEventsTable.$inferSelect;
