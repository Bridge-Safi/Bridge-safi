import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  ref: text("ref").notNull().unique(),
  service: text("service").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  items: jsonb("items").notNull(),
  total: integer("total").notNull(),
  deliveryMode: text("delivery_mode").notNull().default("delivery"),
  paymentMethod: text("payment_method").notNull().default("cash"),
  restaurantName: text("restaurant_name"),
  status: text("status").notNull().default("pending"),
  driverName: text("driver_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const selectOrderSchema = createSelectSchema(ordersTable);

export type InsertOrder = typeof ordersTable.$inferInsert;
export type Order = typeof ordersTable.$inferSelect;
