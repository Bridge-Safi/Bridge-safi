import { pgTable, text, integer, timestamp, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const missionsTable = pgTable("missions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'video' | 'social' | 'offerwall' | 'survey' | 'fortune'
  title: text("title").notNull(),
  description: text("description").notNull(),
  rewardDiamonds: integer("reward_diamonds").notNull(),
  dailyLimit: integer("daily_limit").notNull().default(1), // -1 = unlimited
  durationSeconds: integer("duration_seconds"), // for video missions
  externalUrl: text("external_url"), // for social/offerwall missions
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const missionCompletionsTable = pgTable("mission_completions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  missionId: integer("mission_id").notNull(),
  diamondsAwarded: integer("diamonds_awarded").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertMissionSchema = createInsertSchema(missionsTable);
export const selectMissionSchema = createSelectSchema(missionsTable);
export const insertMissionCompletionSchema = createInsertSchema(missionCompletionsTable);

export type Mission = typeof missionsTable.$inferSelect;
export type MissionCompletion = typeof missionCompletionsTable.$inferSelect;
