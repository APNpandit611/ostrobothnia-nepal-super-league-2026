import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const clubSettingsTable = pgTable("club_settings", {
  id: serial("id").primaryKey(),
  storyParagraphs: text("story_paragraphs").array().notNull().default([]),
  tagline: text("tagline"),
  email: text("email"),
  phone: text("phone"),
  homeGround: text("home_ground"),
  values: jsonb("values").$type<{ title: string; description: string }[]>(),
  primaryColor: text("primary_color").notNull().default("#16a34a"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ClubSettings = typeof clubSettingsTable.$inferSelect;
