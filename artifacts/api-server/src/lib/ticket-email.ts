import { ReplitConnectors } from "@replit/connectors-sdk";

type EmailTicket = {
  ticketNumber: string;
  ticketType: string;
  qrSvg: string;
};

type EmailOrder = {
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  eventName: string;
  eventDate: string;
  venue: string;
  tickets: EmailTicket[];
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

export async function sendTicketEmail(order: EmailOrder) {
  const connectors = new ReplitConnectors();
  const ticketCards = order.tickets.map((ticket) => `
    <section style="border:1px solid #d9d8d2;border-radius:18px;padding:20px;margin:18px 0;background:#fff;">
      <div style="font:700 12px Arial,sans-serif;color:#6c7284;text-transform:uppercase;letter-spacing:.14em;">${escapeHtml(ticket.ticketType)}</div>
      <h2 style="font:800 24px Arial,sans-serif;color:#18213c;margin:8px 0 14px;">${escapeHtml(order.eventName)}</h2>
      <div style="display:flex;gap:20px;align-items:center;">
        <div>${ticket.qrSvg}</div>
        <div style="font:12px Arial,sans-serif;color:#6c7284;line-height:1.7;">
          <strong style="color:#18213c;">${escapeHtml(ticket.ticketNumber)}</strong><br />
          ${escapeHtml(order.eventDate)}<br />
          ${escapeHtml(order.venue)}<br />
          Present this QR code at the entrance.
        </div>
      </div>
    </section>
  `).join("");

  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "Event Check-In <onboarding@resend.dev>",
      to: [order.buyerEmail],
      subject: `Your ${order.eventName} tickets`,
      html: `
        <div style="background:#f7f6f1;padding:28px;font-family:Arial,sans-serif;color:#18213c;">
          <div style="max-width:640px;margin:0 auto;">
            <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">Event Check-In</div>
            <h1 style="font-size:34px;line-height:1.05;margin:24px 0 10px;">You’re on the list.</h1>
            <p style="font-size:15px;line-height:1.6;color:#6c7284;">Hi ${escapeHtml(order.buyerName)}, your digital tickets are ready. Keep this email handy at the door.</p>
            <div style="border-radius:16px;background:#18213c;color:#fff;padding:18px;margin:22px 0;">
              <strong>${escapeHtml(order.eventName)}</strong><br />
              <span style="color:#c9cedb;">${escapeHtml(order.eventDate)} · ${escapeHtml(order.venue)}</span>
            </div>
            ${ticketCards}
            <p style="font-size:12px;color:#6c7284;">Order ${escapeHtml(order.orderNumber)} · Each QR code is unique and can only be used for its assigned ticket.</p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${responseText}`);
  }
}