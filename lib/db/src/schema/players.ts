import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  number: integer("number"),
  position: text("position"),
  email: text("email"),
  phone: text("phone"),
  isCaptain: boolean("is_captain").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
