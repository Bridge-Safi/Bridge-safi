import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const restaurantsTable = pgTable("restaurants", {
  name:        text("name").primaryKey(),
  phone:       text("phone"),
  address:     text("address"),
  lat:         real("lat"),
  lng:         real("lng"),
  webhookUrl:   text("webhook_url"),
  webhookToken: text("webhook_token"),
  ownerId:      text("owner_id"),
  ownerEmail:   text("owner_email"),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
});

export const insertRestaurantSchema = createInsertSchema(restaurantsTable);
export const selectRestaurantSchema = createSelectSchema(restaurantsTable);

export type RestaurantRecord = typeof restaurantsTable.$inferSelect;
