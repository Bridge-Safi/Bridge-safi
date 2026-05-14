import { pgTable, text, integer, timestamp, boolean, serial } from "drizzle-orm/pg-core";

export const couponsTable = pgTable("coupons", {
  code:          text("code").primaryKey(),
  discountType:  text("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  maxUses:       integer("max_uses"),
  usedCount:     integer("used_count").notNull().default(0),
  expiresAt:     timestamp("expires_at"),
  active:        boolean("active").notNull().default(true),
  note:          text("note"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
});

export const couponRedemptionsTable = pgTable("coupon_redemptions", {
  id:         serial("id").primaryKey(),
  code:       text("code").notNull(),
  userId:     text("user_id").notNull(),
  orderRef:   text("order_ref"),
  redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
});

export type CouponRecord = typeof couponsTable.$inferSelect;
export type CouponRedemptionRecord = typeof couponRedemptionsTable.$inferSelect;
