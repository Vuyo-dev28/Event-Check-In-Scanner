import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const ticketOrders = pgTable("ticket_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  eventId: text("event_id").notNull(),
  eventName: text("event_name").notNull(),
  eventDate: text("event_date").notNull(),
  venue: text("venue").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  serviceFeeCents: integer("service_fee_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  emailStatus: text("email_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const issuedTickets = pgTable(
  "issued_tickets",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => ticketOrders.id, { onDelete: "cascade" }),
    userId: text("user_id"),
    ticketNumber: text("ticket_number").notNull(),
    qrToken: text("qr_token").notNull(),
    ticketType: text("ticket_type").notNull(),
    attendeeName: text("attendee_name").notNull(),
    attendeeEmail: text("attendee_email").notNull(),
    eventId: text("event_id").notNull(),
    eventName: text("event_name").notNull(),
    eventDate: text("event_date").notNull(),
    venue: text("venue").notNull(),
    status: text("status").notNull().default("VALID"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("issued_tickets_ticket_number_unique").on(table.ticketNumber),
    uniqueIndex("issued_tickets_qr_token_unique").on(table.qrToken),
  ],
);

export type TicketOrder = typeof ticketOrders.$inferSelect;
export type IssuedTicket = typeof issuedTickets.$inferSelect;