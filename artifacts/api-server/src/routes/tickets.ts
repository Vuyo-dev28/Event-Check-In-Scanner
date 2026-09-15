import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import QRCode from "qrcode";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { issuedTickets, ticketOrders } from "@workspace/db/schema";
import { sendTicketEmail } from "../lib/ticket-email";

const router: IRouter = Router();

const event = {
  id: "northstar-product-summit-2024",
  name: "Northstar Product Summit",
  date: "18 June 2024",
  venue: "Pier 48 · San Francisco",
};

const tiers = {
  general: { name: "General admission", price: 89 },
  vip: { name: "VIP pass", price: 249 },
  speaker: { name: "Speaker circle", price: 399 },
} as const;

type TicketTierId = keyof typeof tiers;

function getUserId(request: Request) {
  const auth = getAuth(request);
  return auth.userId;
}

function isTicketTierId(value: unknown): value is TicketTierId {
  return typeof value === "string" && value in tiers;
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatTicketNumber() {
  return `NS-${Math.floor(10000 + Math.random() * 90000)}`;
}

router.post("/tickets/orders", async (request, response) => {
  const userId = getUserId(request);

  const { buyerName, buyerEmail, items } = request.body as {
    buyerName?: unknown;
    buyerEmail?: unknown;
    items?: unknown;
  };

  if (typeof buyerName !== "string" || buyerName.trim().length < 2 || buyerName.length > 120) {
    response.status(400).json({ error: "Enter a valid attendee name." });
    return;
  }
  if (!isValidEmail(buyerEmail)) {
    response.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    response.status(400).json({ error: "Choose at least one ticket." });
    return;
  }

  const normalizedItems: Array<{ tierId: TicketTierId; quantity: number }> = [];
  for (const item of items) {
    if (!item || typeof item !== "object") {
      response.status(400).json({ error: "Invalid ticket selection." });
      return;
    }
    const candidate = item as { tierId?: unknown; quantity?: unknown };
    if (!isTicketTierId(candidate.tierId) || typeof candidate.quantity !== "number" || !Number.isInteger(candidate.quantity) || candidate.quantity < 1 || candidate.quantity > 8) {
      response.status(400).json({ error: "Invalid ticket quantity." });
      return;
    }
    normalizedItems.push({ tierId: candidate.tierId, quantity: candidate.quantity });
  }

  const ticketCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  if (ticketCount > 24) {
    response.status(400).json({ error: "A single order can contain at most 24 tickets." });
    return;
  }

  const subtotalCents = normalizedItems.reduce((sum, item) => sum + tiers[item.tierId].price * item.quantity * 100, 0);
  const serviceFeeCents = Math.round(subtotalCents * 0.035);
  const totalCents = subtotalCents + serviceFeeCents;
  const orderId = randomUUID();

  try {
    const createdTickets = await db.transaction(async (transaction) => {
      const now = new Date();
      await transaction.insert(ticketOrders).values({
        id: orderId,
        userId: userId ?? null,
        buyerName: buyerName.trim(),
        buyerEmail,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        venue: event.venue,
        subtotalCents,
        serviceFeeCents,
        totalCents,
        emailStatus: "pending",
        createdAt: now,
      });

      const tickets: Array<typeof issuedTickets.$inferInsert> = [];
      for (const item of normalizedItems) {
        for (let index = 0; index < item.quantity; index += 1) {
          const ticketId = randomUUID();
          const qrToken = randomUUID();
          tickets.push({
            id: ticketId,
            orderId,
            userId: userId ?? null,
            ticketNumber: formatTicketNumber(),
            qrToken,
            ticketType: tiers[item.tierId].name,
            attendeeName: buyerName.trim(),
            attendeeEmail: buyerEmail,
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date,
            venue: event.venue,
            status: "VALID",
            createdAt: now,
          });
        }
      }

      return transaction.insert(issuedTickets).values(tickets).returning();
    });

    const emailTickets = await Promise.all(createdTickets.map(async (ticket) => ({
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.ticketType,
      qrSvg: await QRCode.toString(JSON.stringify({
        version: 1,
        ticket: ticket.ticketNumber,
        token: ticket.qrToken,
        event: ticket.eventId,
      }), { type: "svg", margin: 1, width: 180, color: { dark: "#18213c", light: "#ffffff" } }),
    })));

    let emailStatus = "sent";
    try {
      await sendTicketEmail({
        orderNumber: orderId.slice(0, 8).toUpperCase(),
        buyerName: buyerName.trim(),
        buyerEmail,
        eventName: event.name,
        eventDate: event.date,
        venue: event.venue,
        tickets: emailTickets,
      });
      await db.update(ticketOrders).set({ emailStatus: "sent" }).where(eq(ticketOrders.id, orderId));
    } catch (emailError) {
      emailStatus = "failed";
      await db.update(ticketOrders).set({ emailStatus: "failed" }).where(eq(ticketOrders.id, orderId));
      request.log?.error({ err: emailError, orderId }, "Ticket email delivery failed");
    }

    response.status(201).json({
      orderNumber: orderId.slice(0, 8).toUpperCase(),
      emailStatus,
      event,
      totalCents,
      tickets: createdTickets.map((ticket, index) => ({
        ticketNumber: ticket.ticketNumber,
        ticketType: ticket.ticketType,
        attendeeName: ticket.attendeeName,
        eventName: ticket.eventName,
        eventDate: ticket.eventDate,
        venue: ticket.venue,
        qrDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(emailTickets[index].qrSvg)}`,
      })),
    });
  } catch (error) {
    request.log?.error({ err: error, userId }, "Ticket order creation failed");
    response.status(500).json({ error: "We could not issue the tickets. Please try again." });
  }
});

export default router;