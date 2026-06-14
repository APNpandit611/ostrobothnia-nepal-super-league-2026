import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const clubSettingsTable = pgTable("club_settings", {
  id: serial("id").primaryKey(),
  storyParagraphs: text("story_paragraphs").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ClubSettings = typeof clubSettingsTable.$inferSelect;
