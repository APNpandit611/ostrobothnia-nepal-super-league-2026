import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tournamentImagesTable = pgTable("tournament_images", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTournamentImageSchema = createInsertSchema(tournamentImagesTable).omit({ id: true, createdAt: true });
export type InsertTournamentImage = z.infer<typeof insertTournamentImageSchema>;
export type TournamentImage = typeof tournamentImagesTable.$inferSelect;
