import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const userProfilesTable = pgTable("user_profiles", {
  userId:     text("user_id").primaryKey(),
  phone:      text("phone").unique(),
  name:       text("name"),
  address:    text("address"),
  avatarData: text("avatar_data"),
  updatedAt:  timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable);
export const selectUserProfileSchema = createSelectSchema(userProfilesTable);

export type UserProfileRecord = typeof userProfilesTable.$inferSelect;
