import "dotenv/config";
// Node 18 polyfill: MongoDB driver needs globalThis.crypto
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) (globalThis as any).crypto = webcrypto;

import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { sendBookingEmails } from "./mailer";

// ─── Event Configuration ──────────────────────────────────────────────────────
const EVENT_DATES = ["23 October 2026", "24 October 2026", "25 October 2026"];
const SLOTS_PER_DAY = [
  "11:00 AM – 12:30 PM",
  "2:00 PM – 3:30 PM",
  "3:00 PM – 5:00 PM",
  "7:00 PM – 8:30 PM",
  "8:30 PM – 10:00 PM",
  "10:00 PM – 11:00 PM",
];
const MAX_SEATS_PER_SLOT = 80;

// ─── In-Memory Store (always works, no DB required) ──────────────────────────
interface BookingRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  bookingRef: string;
  ticketType: string;
  ticketQuantity: number;
  eventDate: string;
  preferredSlot: string;
  totalAmount: number;
  paymentType: string;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: string;
  paymentScreenshot: string; // base64 data URL or empty string
  checkInStatus: boolean;
  status: string;
  createdAt: string;
}

const inMemoryBookings: BookingRecord[] = [];

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// ─── Seat availability helper ─────────────────────────────────────────────────
function getSlotAvailability(bookings: BookingRecord[]) {
  const availability: Record<string, Record<string, number>> = {};
  for (const date of EVENT_DATES) {
    availability[date] = {};
    for (const slot of SLOTS_PER_DAY) {
      const booked = bookings
        .filter(b => b.eventDate === date && b.preferredSlot === slot)
        .reduce((sum, b) => sum + (b.ticketQuantity || 1), 0);
      availability[date][slot] = Math.max(0, MAX_SEATS_PER_SLOT - booked);
    }
  }
  return availability;
}

// ─── Optional MongoDB (used if available) ────────────────────────────────────
let mongoAvailable = false;
let Booking: any = null;

async function tryConnectMongo() {
  try {
    const mongoose = await import("mongoose");
    const bookingSchema = new mongoose.default.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      bookingRef: { type: String, required: true },
      ticketType: { type: String, default: "General" },
      ticketQuantity: { type: Number, default: 1 },
      eventDate: { type: String, default: "23 October 2026" },
      preferredSlot: { type: String, default: "11:00 AM – 12:30 PM" },
      totalAmount: { type: Number, default: 0 },
      paymentType: { type: String, default: "full" },
      amountPaid: { type: Number, default: 0 },
      balanceDue: { type: Number, default: 0 },
      paymentStatus: { type: String, default: "Pending" },
      paymentScreenshot: { type: String, default: "" },
      checkInStatus: { type: Boolean, default: false },
      status: { type: String, default: "pending" },
      createdAt: { type: Date, default: Date.now },
    });

    if (mongoose.default.models.Booking) {
      Booking = mongoose.default.models.Booking;
    } else {
      Booking = mongoose.default.model("Booking", bookingSchema);
    }

    await mongoose.default.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/karikalam",
      { serverSelectionTimeoutMS: 3000 }
    );

    mongoAvailable = true;
    console.log("✅ Connected to MongoDB — data will persist to database.");
  } catch {
    mongoAvailable = false;
    console.log("⚠️  MongoDB not available — using in-memory store (data lives for this session).");
  }
}

// ─── Server ──────────────────────────────────────────────────────────────────
export function createServer() {
  const app = express();

  app.use(cors());
  // Increase limit for base64 screenshot uploads
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Try connecting to MongoDB without blocking server startup
  tryConnectMongo();

  // GET all bookings
  app.get("/api/bookings", async (_req, res) => {
    try {
      if (mongoAvailable && Booking) {
        const dbBookings = await Booking.find().sort({ createdAt: -1 });
        const dbRefs = new Set(dbBookings.map((b: any) => b.bookingRef));
        const memOnly = inMemoryBookings.filter(b => !dbRefs.has(b.bookingRef));
        return res.json([...dbBookings, ...memOnly]);
      }
      const sorted = [...inMemoryBookings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return res.json(sorted);
    } catch (e) {
      console.error("GET /api/bookings error:", e);
      return res.json(inMemoryBookings);
    }
  });

  // GET slot availability
  app.get("/api/slot-availability", async (_req, res) => {
    try {
      let allBookings: BookingRecord[] = [...inMemoryBookings];
      if (mongoAvailable && Booking) {
        const dbBookings = await Booking.find({}, "eventDate preferredSlot ticketQuantity");
        const dbRefs = new Set(dbBookings.map((b: any) => b.bookingRef));
        const memOnly = inMemoryBookings.filter(b => !dbRefs.has(b.bookingRef));
        allBookings = [...dbBookings, ...memOnly];
      }
      return res.json({
        availability: getSlotAvailability(allBookings),
        maxSeats: MAX_SEATS_PER_SLOT,
        eventDates: EVENT_DATES,
        slots: SLOTS_PER_DAY,
      });
    } catch (e) {
      console.error("GET /api/slot-availability error:", e);
      return res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  // POST upload payment screenshot (base64) for a booking
  app.post("/api/bookings/:id/screenshot", async (req, res) => {
    try {
      const { screenshot } = req.body; // base64 data URL
      if (!screenshot) return res.status(400).json({ error: "No screenshot provided" });

      // Try MongoDB first
      if (mongoAvailable && Booking) {
        const updated = await Booking.findByIdAndUpdate(
          req.params.id,
          { paymentScreenshot: screenshot },
          { new: true }
        );
        if (updated) return res.json(updated);
      }

      // Fallback: update in-memory
      const mem = inMemoryBookings.find(b => b._id === req.params.id);
      if (mem) {
        mem.paymentScreenshot = screenshot;
        return res.json(mem);
      }

      return res.status(404).json({ error: "Booking not found" });
    } catch (e) {
      return res.status(500).json({ error: "Failed to save screenshot" });
    }
  });

  // POST create booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const body = req.body;

      // Always save to in-memory first (instant, never fails)
      const memBooking: BookingRecord = {
        _id: generateId(),
        name: body.name || "",
        email: body.email || "",
        phone: body.phone || "",
        bookingRef: body.bookingRef || "KV-UNKNOWN",
        ticketType: body.ticketType || "General",
        ticketQuantity: Number(body.ticketQuantity) || 1,
        eventDate: body.eventDate || "23 October 2026",
        preferredSlot: body.preferredSlot || "11:00 AM – 12:30 PM",
        totalAmount: Number(body.totalAmount) || 0,
        paymentType: body.paymentType || "full",
        amountPaid: Number(body.amountPaid) || 0,
        balanceDue: Number(body.balanceDue) || 0,
        paymentStatus: body.paymentStatus || "Pending",
        paymentScreenshot: body.paymentScreenshot || "",
        checkInStatus: false,
        status: body.status || "pending",
        createdAt: new Date().toISOString(),
      };
      inMemoryBookings.push(memBooking);
      console.log(`📋 Registration saved [in-memory]: ${memBooking.name} — Ref: ${memBooking.bookingRef}`);

      // A temporary SMTP failure must not discard a completed registration.
      sendBookingEmails(memBooking).catch((mailError) => {
        console.error("Booking email delivery failed:", mailError);
      });

      // Also try MongoDB (fire and forget)
      if (mongoAvailable && Booking) {
        try {
          const saved = await new Booking(body).save();
          return res.json(saved);
        } catch (dbErr) {
          console.warn("MongoDB save failed, using in-memory record:", dbErr);
        }
      }

      return res.json(memBooking);
    } catch (e) {
      console.error("POST /api/bookings error:", e);
      return res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Authentication Login Route
  app.post("/api/login", async (req, res) => {
    const { email, password, role } = req.body;
    // Admin login
    if (role === "admin" && email === "admin@karikalam.com" && password === "admin123") {
      return res.json({ token: "admin_secure_token_123", role: "admin" });
    }
    // Receptionist login
    if (role === "receptionist" && email === "reception@karikalam.com" && password === "reception123") {
      return res.json({ token: "reception_secure_token_123", role: "receptionist" });
    }
    if (role === "customer") {
      return res.status(403).json({ error: "Customer login is no longer available." });
    }
    // Customer login – verify email exists in bookings
    if (role === "customer") {
      // Check in-memory store first
      const foundInMemory = inMemoryBookings.find(b => b.email.toLowerCase() === (email || "").toLowerCase());
      if (foundInMemory) {
        return res.json({ token: "customer_token_" + foundInMemory._id, role: "customer" });
      }
      // If MongoDB is available, query there
      if (mongoAvailable && Booking) {
        try {
          const dbBooking = await Booking.findOne({ email: email }).select("_id");
          if (dbBooking) {
            return res.json({ token: "customer_token_" + dbBooking._id, role: "customer" });
          }
        } catch (e) {
          console.error("MongoDB customer login error:", e);
        }
      }
      // No matching booking found
      return res.status(401).json({ error: "Unauthorized: No booking found for this email." });
    }
    // Fallback unauthorized
    return res.status(401).json({ error: "Unauthorized: Invalid credentials provided." });
  });

  // Check-In Route
  app.patch("/api/bookings/:id/checkin", async (req, res) => {
    try {
      if (mongoAvailable && Booking) {
        const updated = await Booking.findByIdAndUpdate(
          req.params.id,
          { checkInStatus: true, status: "Checked In" },
          { new: true }
        );
        if (updated) return res.json(updated);
      }

      const mem = inMemoryBookings.find(b => b._id === req.params.id);
      if (mem) {
        mem.checkInStatus = true;
        mem.status = "Checked In";
        return res.json(mem);
      }

      return res.status(404).json({ error: "Booking not found" });
    } catch (e) {
      return res.status(500).json({ error: "Failed to process check-in" });
    }
  });

  app.get("/api/demo", handleDemo);

  return app;
}
