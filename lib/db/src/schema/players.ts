import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  number: integer("number"),
  position: text("position"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
