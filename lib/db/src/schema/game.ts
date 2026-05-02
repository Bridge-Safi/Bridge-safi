import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const gameDiamondsTable = pgTable("game_diamonds", {
  userId: text("user_id").primaryKey(),
  diamonds: integer("diamonds").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGameDiamondsSchema = createInsertSchema(gameDiamondsTable);
export const selectGameDiamondsSchema = createSelectSchema(gameDiamondsTable);

export type GameDiamonds = typeof gameDiamondsTable.$inferSelect;
