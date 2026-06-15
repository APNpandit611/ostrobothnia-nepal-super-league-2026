import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seasonArchivesTable = pgTable("season_archives", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  seasonYear: text("season_year").notNull(),
  winnerTeamId: integer("winner_team_id"),
  winnerTeamName: text("winner_team_name"),
  winnerTeamShortName: text("winner_team_short_name"),
  winnerTeamLogo: text("winner_team_logo"),
  finalScore: text("final_score").notNull(),
  finalHomeTeam: text("final_home_team").notNull(),
  finalAwayTeam: text("final_away_team").notNull(),
  topScorerName: text("top_scorer_name"),
  topScorerGoals: text("top_scorer_goals"),
  topScorerTeam: text("top_scorer_team"),
  standings: jsonb("standings"),
  matches: jsonb("matches"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSeasonArchiveSchema = createInsertSchema(seasonArchivesTable).omit({ id: true, createdAt: true });
export type InsertSeasonArchive = z.infer<typeof insertSeasonArchiveSchema>;
export type SeasonArchive = typeof seasonArchivesTable.$inferSelect;
