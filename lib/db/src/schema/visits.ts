import { pgTable, text, timestamp, serial, index } from "drizzle-orm/pg-core";

export const siteVisitsTable = pgTable("site_visits", {
  id:        serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  path:      text("path"),
  referrer:  text("referrer"),
  userAgent: text("user_agent"),
  ip:        text("ip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  sessionIdx: index("site_visits_session_idx").on(t.sessionId),
  createdIdx: index("site_visits_created_idx").on(t.createdAt),
}));

export type SiteVisitRecord = typeof siteVisitsTable.$inferSelect;
