import nodemailer from "nodemailer";

export interface BookingEmailDetails {
  name: string;
  email: string;
  phone: string;
  bookingRef: string;
  ticketQuantity: number;
  eventDate: string;
  preferredSlot: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: string;
}

const requiredSmtpVariables = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]!));
}

function isSmtpConfigured() {
  return requiredSmtpVariables.every((variable) => Boolean(process.env[variable]));
}

function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function bookingTable(booking: BookingEmailDetails) {
  const rows = [
    ["Booking reference", booking.bookingRef], ["Guest name", booking.name], ["Mobile", booking.phone],
    ["Guests", String(booking.ticketQuantity)], ["Event date", booking.eventDate], ["Dining slot", booking.preferredSlot],
    ["Total", formatCurrency(booking.totalAmount)], ["Payment received", formatCurrency(booking.amountPaid)],
    ["Balance due", formatCurrency(booking.balanceDue)], ["Payment status", booking.paymentStatus],
  ];
  return rows.map(([label, value]) => `<tr><td style="padding:8px 14px 8px 0;color:#6E6760;font-weight:600">${escapeHtml(label)}</td><td style="padding:8px 0;color:#221E1B">${escapeHtml(value)}</td></tr>`).join("");
}

export async function sendBookingEmails(booking: BookingEmailDetails) {
  if (!isSmtpConfigured()) {
    console.warn("SMTP is not configured; booking email was not sent.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM!;
  const adminRecipient = process.env.SMTP_TO || from;
  const table = bookingTable(booking);
  const guestName = escapeHtml(booking.name);

  await Promise.all([
    transporter.sendMail({ from, to: booking.email, subject: `Keda Virundhu registration received — ${booking.bookingRef}`, html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px"><h1 style="color:#8B1A10;margin:0 0 12px">Registration received</h1><p>Thank you, ${guestName}. Your Keda Virundhu booking has been received.</p><table style="border-collapse:collapse;width:100%;margin:20px 0">${table}</table><p>Our Karikalam team will contact you if any further confirmation is needed.</p></div>` }),
    transporter.sendMail({ from, to: adminRecipient, replyTo: booking.email, subject: `New Keda Virundhu booking — ${booking.bookingRef}`, html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px"><h1 style="color:#8B1A10;margin:0 0 12px">New event registration</h1><p>A new booking has been submitted.</p><table style="border-collapse:collapse;width:100%;margin:20px 0">${table}</table></div>` }),
  ]);

  return true;
}
