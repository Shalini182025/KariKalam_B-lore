import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Clock3, MapPin, Minus, Plus, Ticket, Phone, Check, Upload, Image, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { menuSections, restaurantAddress, eventDates, eventDateOptions, eventSlotTimings } from "@/lib/karikalam";
import { SiteLayout, useReservation } from "@/components/SiteLayout";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

const PRICE_PER_PERSON = 1499;
const MAX_SEATS = 80;

type BookingStep = "form" | "payment" | "confirmed";
type PaymentType = "partial" | "full";

interface SlotAvailability {
  [date: string]: { [slot: string]: number };
}

export default function KedaVirundhu() {
  const [quantity, setQuantity] = useState(1);
  const totalAmount = quantity * PRICE_PER_PERSON;
  const discountedTotal = Math.round(totalAmount * 0.9);
  const partialAmount = Math.round(discountedTotal * 0.5);
  const { openReservation } = useReservation();

  // Date & slot state
  const [selectedDate, setSelectedDate] = useState(eventDateOptions[0].date);
  const [selectedSlot, setSelectedSlot] = useState(eventSlotTimings[0].time);
  const [availability, setAvailability] = useState<SlotAvailability>({});
  const [availLoading, setAvailLoading] = useState(true);

  // Multi-step flow
  const [step, setStep] = useState<BookingStep>("form");
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  const payableAmount = paymentType === "partial" ? partialAmount : discountedTotal;
  const balanceDue = paymentType === "partial" ? discountedTotal - partialAmount : 0;

  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false, phone: false });

  // Booking state
  const [bookingRef, setBookingRef] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Screenshot upload state
  const [screenshot, setScreenshot] = useState<string>("");
  const [screenshotName, setScreenshotName] = useState("");
  const [screenshotError, setScreenshotError] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nameError = touched.name && customerName.trim() === "" ? "Full name is required." : "";
  const emailError = touched.email && (customerEmail.trim() === "" ? "Email address is required." : !validateEmail(customerEmail) ? "Please enter a valid email address." : "");
  const phoneError = touched.phone && (customerPhone.trim() === "" ? "Phone number is required." : !validatePhone(customerPhone) ? "Enter a valid 10-digit Indian mobile number." : "");

  // Load availability on mount and after booking
  const fetchAvailability = async () => {
    setAvailLoading(true);
    try {
      const res = await fetch("/api/slot-availability");
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.availability || {});
      }
    } catch (e) {
      console.warn("Could not fetch slot availability", e);
    } finally {
      setAvailLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const getRemaining = (date: string, slot: string): number => {
    return availability[date]?.[slot] ?? MAX_SEATS;
  };

  const isSlotFull = (date: string, slot: string) => getRemaining(date, slot) <= 0;
  const isSlotAlmostFull = (date: string, slot: string) => {
    const r = getRemaining(date, slot);
    return r > 0 && r <= 15;
  };

  // Handle screenshot file pick
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setScreenshotError("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError("File too large. Please upload a screenshot under 5MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setScreenshotError("Only image files are accepted (JPG, PNG, etc.).");
      return;
    }
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 1 → Step 2
  const handleProceedToPayment = () => {
    setSubmitError("");
    setTouched({ name: true, email: true, phone: true });
    const isValid = customerName.trim() !== "" && validateEmail(customerEmail) && validatePhone(customerPhone);
    if (!isValid) return;
    if (isSlotFull(selectedDate, selectedSlot)) {
      setSubmitError("This slot is fully booked. Please choose another slot or date.");
      return;
    }
    if (quantity > getRemaining(selectedDate, selectedSlot)) {
      setSubmitError(`Only ${getRemaining(selectedDate, selectedSlot)} seats remaining in this slot.`);
      return;
    }
    setStep("payment");
    document.getElementById("tickets")?.scrollIntoView({ behavior: "smooth" });
  };

  // Step 2 → Step 3: confirm payment and save booking
  const handleConfirmPayment = async () => {
    if (!screenshot) {
      setScreenshotError("Please attach your payment screenshot before confirming.");
      return;
    }
    setIsSaving(true);
    const generatedRef = "KV-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const payload = {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      bookingRef: generatedRef,
      ticketQuantity: quantity || 1,
      eventDate: selectedDate,
      preferredSlot: selectedSlot,
      totalAmount: discountedTotal,
      paymentType: paymentType,
      amountPaid: payableAmount,
      balanceDue: balanceDue,
      paymentStatus: paymentType === "full" ? "Paid" : "Partial",
      paymentScreenshot: screenshot,
      status: paymentType === "full" ? "Confirmed" : "Partial Payment"
    };

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = response.ok ? await response.json() : null;
      setBookingRef(generatedRef);
      if (data?._id) setBookingId(data._id);
      setStep("confirmed");
      fetchAvailability(); // Refresh seat count after booking
    } catch (err) {
      console.warn("Network error, registering locally:", err);
      setBookingRef(generatedRef);
      setStep("confirmed");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Step indicator ──
  const StepIndicator = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "28px" }}>
      {(["form", "payment", "confirmed"] as BookingStep[]).map((s, i) => {
        const labels = ["Details", "Payment", "Confirmed"];
        const isDone = (step === "payment" && i === 0) || (step === "confirmed" && i <= 1);
        const isActive = step === s;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: isDone ? "var(--green)" : isActive ? "var(--maroon)" : "#e8e0d0",
                color: isDone || isActive ? "white" : "var(--muted-ink)",
                fontSize: 12, fontWeight: 700, transition: "all 0.3s"
              }}>
                {isDone ? <Check size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", color: isActive ? "var(--maroon)" : isDone ? "var(--green)" : "var(--muted-ink)" }}>{labels[i]}</span>
            </div>
            {i < 2 && <div style={{ width: 50, height: 2, background: isDone ? "var(--green)" : "#e0d8c8", margin: "0 6px", marginBottom: "18px", transition: "all 0.3s" }} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <SiteLayout>
      <main className="event-page">
        <section className="event-hero">
          <img src="/dishes/full-meals.jpg" alt="An abundant traditional feast served on a banana leaf" />
          <div className="event-hero-shade" />
          <div className="event-hero-content wrap"><span className="eyebrow eyebrow-light"><span className="eyebrow-line" /> KARIKALAM PRESENTS</span><h1>Keda<br /><em>Virundhu</em></h1><p>An Authentic Tamil Culinary Celebration</p><div className="event-hero-line" /><span className="event-hero-meta">TRADITION · TOGETHERNESS · A FEAST TO REMEMBER</span></div>
          <Link className="event-scroll" to="#event-intro"><ArrowDown size={15} /> DISCOVER THE FEAST</Link>
        </section>

        <section className="event-intro section-pad" id="event-intro"><div className="event-intro-title"><span className="eyebrow"><span className="eyebrow-line" /> AN INVITATION TO THE TABLE</span><h2>A feast shaped by<br /><em>generations of flavour.</em></h2></div><div className="event-intro-copy"><p>Celebrate the authentic flavours of Tamil culinary heritage through Keda Virundhu — a traditional feast featuring rich mutton specials, flavourful chicken dishes, fresh fish preparations, classic South Indian accompaniments and traditional desserts.</p><p>Gather around a banana leaf and enjoy a thoughtfully curated dining experience at Karikalam.</p><div className="event-facts"><div><CalendarDays size={18} /><span><small>EVENT DATE</small>{eventDates.range}</span></div><div><Clock3 size={18} /><span><small>EVENT TIME</small>6 Dining Batches (11 AM – 11 PM)</span></div><div><MapPin size={18} /><span><small>VENUE</small>Karikalam Restaurant</span></div></div></div></section>

        <section className="event-menu section-pad" id="menu"><div className="center-heading"><span className="eyebrow">THE OFFICIAL FEAST MENU</span><h2>Six chapters.<br /><em>One generous table.</em></h2><p>Traditional favourites brought together for Keda Virundhu.</p></div><div className="event-menu-grid">{menuSections.map((section, index) => <article className={`event-menu-card menu-card-${index + 1}`} key={section.title}><div className="event-menu-image"><img src={section.image} alt={`${section.title} from Keda Virundhu menu`} /><span>0{index + 1}</span></div><div className="event-menu-content"><h3>{section.title}</h3><ul>{section.items.map((item) => <li key={item}><span className="menu-bullet">✤</span>{item}</li>)}</ul></div></article>)}</div></section>

        <section className="gift-section"><div className="gift-symbol">✤</div><div><span className="eyebrow eyebrow-light">A LITTLE SOMETHING TO REMEMBER</span><h2>A special return gift,<br /><em>from Karikalam.</em></h2></div><span className="gift-side-note">A KEDA VIRUNDHU KEEPSAKE</span></section>

        <section className="ticket-section section-pad" id="tickets"><div className="ticket-intro"><span className="eyebrow"><span className="eyebrow-line" /> SAVE YOUR PLACE</span><h2>Your seat at<br /><em>the feast.</em></h2><p>Register your interest today and receive an exclusive <strong>10% discount</strong> on your final booking when official ticket sales go live!</p><div className="ticket-status"><span className="status-dot" style={{ background: "var(--maroon)" }} /> EXCLUSIVE 10% DISCOUNT APPLIED</div></div><div className="ticket-selection">

          <StepIndicator />

          {/* ═══════════════════════ STEP 1: CUSTOMER FORM ═══════════════════════ */}
          {step === "form" && (
            <>
              <div className="customer-details-form">
                <div className="customer-details-heading"><span className="eyebrow">CUSTOMER DETAILS</span></div>
                <div className={`customer-field${nameError ? " customer-field-error" : ""}`}>
                  <label htmlFor="cd-name">Full Name <span aria-hidden="true">*</span></label>
                  <input id="cd-name" type="text" placeholder="e.g. Aarav Kumar" value={customerName} autoComplete="name" onChange={e => setCustomerName(e.target.value)} onBlur={() => setTouched(t => ({ ...t, name: true }))} />
                  {nameError && <span className="customer-field-msg" role="alert">{nameError}</span>}
                </div>
                <div className={`customer-field${emailError ? " customer-field-error" : ""}`}>
                  <label htmlFor="cd-email">Email Address <span aria-hidden="true">*</span></label>
                  <input id="cd-email" type="email" placeholder="e.g. aarav@email.com" value={customerEmail} autoComplete="email" onChange={e => setCustomerEmail(e.target.value)} onBlur={() => setTouched(t => ({ ...t, email: true }))} />
                  {emailError && <span className="customer-field-msg" role="alert">{emailError}</span>}
                </div>
                <div className={`customer-field${phoneError ? " customer-field-error" : ""}`}>
                  <label htmlFor="cd-phone">Phone Number <span aria-hidden="true">*</span></label>
                  <input id="cd-phone" type="tel" placeholder="10-digit mobile, e.g. 9876543210" value={customerPhone} autoComplete="tel" maxLength={10} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ""))} onBlur={() => setTouched(t => ({ ...t, phone: true }))} />
                  {phoneError && <span className="customer-field-msg" role="alert">{phoneError}</span>}
                </div>

                {/* ── Number of Guests ── */}
                <div className="customer-field" style={{ marginTop: "14px" }}>
                  <label>No. of Guests <span aria-hidden="true">*</span></label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", width: "fit-content", marginTop: "6px" }}>
                    <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}
                      style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", background: quantity <= 1 ? "#f5f0e8" : "white", border: "none", cursor: quantity <= 1 ? "not-allowed" : "pointer", color: quantity <= 1 ? "#c0b8a8" : "var(--maroon)", transition: "all 0.15s" }} aria-label="Decrease guests"><Minus size={15} /></button>
                    <span style={{ width: 52, textAlign: "center", fontSize: 16, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--serif)", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", lineHeight: "42px" }}>{quantity}</span>
                    <button type="button" onClick={() => setQuantity(q => Math.min(20, q + 1))} disabled={quantity >= 20}
                      style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", background: quantity >= 20 ? "#f5f0e8" : "white", border: "none", cursor: quantity >= 20 ? "not-allowed" : "pointer", color: quantity >= 20 ? "#c0b8a8" : "var(--maroon)", transition: "all 0.15s" }} aria-label="Increase guests"><Plus size={15} /></button>
                  </div>
                </div>

                {/* ── Live Price Summary ── */}
                <div style={{ margin: "14px 0", padding: "14px 16px", background: "#fdf8f0", border: "1px solid #e8d8b8", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ fontSize: "12px", color: "var(--muted-ink)" }}>
                    <span style={{ fontWeight: 700, color: "var(--ink)" }}>{quantity} guest{quantity !== 1 ? "s" : ""}</span>{" "} × ₹{PRICE_PER_PERSON.toLocaleString("en-IN")}
                    <span style={{ marginLeft: "8px", padding: "2px 7px", background: "#fff0e0", color: "#b06c10", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>10% OFF ONLINE</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted-ink)", textDecoration: "line-through" }}>₹{totalAmount.toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: "20px", fontFamily: "var(--serif)", fontWeight: 700, color: "var(--maroon)", lineHeight: 1 }}>₹{discountedTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* ── Event Date Picker ── */}
                <div className="customer-field" style={{ marginTop: "0" }}>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Select Event Date <span aria-hidden="true">*</span></span>
                    <small style={{ color: "var(--muted-ink)", fontSize: "10px" }}>3 days · Oct 23–25, 2026</small>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "8px" }}>
                    {eventDateOptions.map((opt) => {
                      const isChosen = selectedDate === opt.date;
                      return (
                        <button key={opt.date} type="button" onClick={() => { setSelectedDate(opt.date); setSelectedSlot(eventSlotTimings[0].time); }}
                          style={{ padding: "12px 8px", border: isChosen ? "2px solid var(--maroon)" : "1px solid var(--border)", background: isChosen ? "#fbf3f2" : "#ffffff", borderRadius: "8px", textAlign: "center", cursor: "pointer", transition: "all 0.15s ease" }}>
                          <span style={{ display: "block", fontSize: "8px", fontWeight: 700, color: isChosen ? "var(--maroon)" : "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{opt.label}</span>
                          <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: isChosen ? "var(--maroon)" : "var(--ink)", fontFamily: "var(--serif)" }}>{opt.short}</span>
                          <span style={{ display: "block", fontSize: "9px", color: isChosen ? "#c06050" : "var(--muted-ink)", marginTop: "2px" }}>2026</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Dining Slot Picker ── */}
                <div className="customer-field" style={{ marginTop: "10px" }}>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Preferred Dining Slot <span aria-hidden="true">*</span></span>
                    <small style={{ color: "var(--muted-ink)", fontSize: "10px" }}>80 seats per slot</small>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px", marginTop: "6px" }}>
                    {eventSlotTimings.map((slot) => {
                      const isChosen = selectedSlot === slot.time;
                      const remaining = getRemaining(selectedDate, slot.time);
                      const isFull = remaining <= 0;
                      const almostFull = !isFull && remaining <= 15;
                      return (
                        <button key={slot.id} type="button"
                          onClick={() => !isFull && setSelectedSlot(slot.time)}
                          disabled={isFull}
                          style={{
                            padding: "10px 12px", border: isChosen ? "1.5px solid var(--maroon)" : isFull ? "1px solid #e0d8c8" : "1px solid var(--border)",
                            background: isChosen ? "#fbf3f2" : isFull ? "#f8f5f0" : "#ffffff",
                            borderRadius: "8px", textAlign: "left", cursor: isFull ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease", display: "flex", flexDirection: "column", gap: "3px", opacity: isFull ? 0.5 : 1
                          }}>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: isChosen ? "var(--maroon)" : "var(--gold)", textTransform: "uppercase" }}>{slot.label}</span>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: isChosen ? "var(--maroon)" : isFull ? "#999" : "var(--ink)" }}>{slot.time}</span>
                          {availLoading ? (
                            <span style={{ fontSize: "9px", color: "#bbb" }}>checking…</span>
                          ) : isFull ? (
                            <span style={{ fontSize: "9px", fontWeight: 700, color: "#c02020" }}>FULL</span>
                          ) : (
                            <span style={{ fontSize: "9px", fontWeight: 700, color: almostFull ? "#c6852a" : "#2a6044" }}>
                              {remaining} seat{remaining !== 1 ? "s" : ""} left
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" className="button button-maroon" onClick={handleProceedToPayment}>
                  Proceed to Payment <ArrowUpRight size={16} />
                </button>
                <button type="button" className="button" style={{ background: "#173d2b", color: "#ffffff", borderRadius: "0", minHeight: "48px", border: "1px solid #173d2b" }} onClick={() => openReservation(selectedSlot)}>
                  <Phone size={15} /> Reserve via Call
                </button>
              </div>
              {submitError && <p role="alert" style={{ marginTop: "10px", color: "var(--maroon)", fontSize: "12px", fontWeight: 600 }}>⚠ {submitError}</p>}
              <small className="ticket-disclaimer">Reserve online or call directly. No upfront payments required until confirmation.</small>
            </>
          )}

          {/* ═══════════════════════ STEP 2: PAYMENT QR ═══════════════════════ */}
          {step === "payment" && (
            <div style={{ maxWidth: "520px", margin: "0 auto" }}>
              {/* Payment type selector */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--muted-ink)", display: "block", marginBottom: "10px" }}>CHOOSE PAYMENT TYPE</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {(["partial", "full"] as PaymentType[]).map((type) => {
                    const isActive = paymentType === type;
                    const label = type === "partial" ? "Partial Payment" : "Full Payment";
                    const subtitle = type === "partial" ? `50% Advance · ₹${partialAmount.toLocaleString("en-IN")}` : `Full Amount · ₹${discountedTotal.toLocaleString("en-IN")}`;
                    const badge = type === "partial" ? "PAY REST AT VENUE" : "BEST VALUE";
                    return (
                      <button key={type} type="button" onClick={() => setPaymentType(type)}
                        style={{
                          padding: "16px", borderRadius: "10px", textAlign: "left", cursor: "pointer",
                          border: isActive ? "2px solid var(--maroon)" : "1.5px solid var(--border)",
                          background: isActive ? "#fef7f5" : "white",
                          transition: "all 0.2s ease", position: "relative", overflow: "hidden"
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", border: isActive ? "2px solid var(--maroon)" : "2px solid #c8c0b0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {isActive && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--maroon)" }} />}
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: isActive ? "var(--maroon)" : "var(--ink)" }}>{label}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted-ink)", marginLeft: "26px" }}>{subtitle}</div>
                        <span style={{
                          position: "absolute", top: "8px", right: "8px",
                          fontSize: "8px", fontWeight: 700, letterSpacing: "0.08em",
                          padding: "3px 7px", borderRadius: "4px",
                          background: type === "full" ? "#e8f5e9" : "#fff8ec",
                          color: type === "full" ? "#2e7d32" : "#b06c10"
                        }}>{badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Booking summary */}
              <div style={{ background: "var(--ivory)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", fontSize: "12px" }}>
                <div style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.1em", color: "var(--muted-ink)", marginBottom: "8px" }}>BOOKING SUMMARY</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>Date</span>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>{selectedDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>Slot</span>
                  <span style={{ fontWeight: 700, color: "var(--green)" }}>{selectedSlot}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>{quantity} guest{quantity !== 1 ? "s" : ""} × ₹{PRICE_PER_PERSON.toLocaleString("en-IN")}</span>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#2e7d32", fontWeight: 600 }}>Online Discount (10%)</span>
                  <span style={{ color: "#2e7d32", fontWeight: 600 }}>−₹{(totalAmount - discountedTotal).toLocaleString("en-IN")}</span>
                </div>
                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>Total Amount</span>
                  <span style={{ fontSize: "16px", fontFamily: "var(--serif)", fontWeight: 700, color: "var(--ink)" }}>₹{discountedTotal.toLocaleString("en-IN")}</span>
                </div>
                {paymentType === "partial" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "6px" }}>
                      <span style={{ color: "var(--maroon)", fontWeight: 700 }}>Pay Now (50%)</span>
                      <span style={{ color: "var(--maroon)", fontWeight: 700, fontSize: "16px", fontFamily: "var(--serif)" }}>₹{partialAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "4px" }}>
                      <span style={{ color: "var(--muted-ink)" }}>Balance Due at Venue</span>
                      <span style={{ color: "var(--muted-ink)", fontWeight: 600 }}>₹{balanceDue.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                )}
                {paymentType === "full" && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "6px" }}>
                    <span style={{ color: "var(--maroon)", fontWeight: 700 }}>Pay Now</span>
                    <span style={{ color: "var(--maroon)", fontWeight: 700, fontSize: "16px", fontFamily: "var(--serif)" }}>₹{discountedTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>

              {/* BharatPe payment QR */}
              <div style={{ textAlign: "center", background: "white", border: "1px solid var(--border)", borderRadius: "14px", padding: "28px 20px", marginBottom: "20px", boxShadow: "0 6px 24px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "var(--muted-ink)", marginBottom: "16px" }}>SCAN QR TO PAY VIA UPI</div>
                <div style={{ display: "inline-block", width: "min(100%, 340px)", background: "white", border: "2px solid var(--border)", borderRadius: "12px", overflow: "hidden", lineHeight: 0 }}>
                  <img
                    src="/bharatpe-payment-qr.jpeg"
                    alt="BharatPe UPI QR code for Jagadeesh"
                    style={{ display: "block", width: "100%", height: "auto" }}
                  />
                </div>
                <div style={{ marginTop: "14px", fontSize: "22px", fontFamily: "var(--serif)", fontWeight: 700, color: "var(--maroon)" }}>
                  ₹{payableAmount.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted-ink)", marginTop: "4px", fontWeight: 600 }}>
                  {paymentType === "partial" ? "PARTIAL PAYMENT (50% ADVANCE)" : "FULL PAYMENT"}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "18px", flexWrap: "wrap" }}>
                  {["Google Pay", "PhonePe", "Paytm", "BHIM"].map(app => (
                    <span key={app} style={{ fontSize: "10px", color: "var(--muted-ink)", fontWeight: 600, padding: "4px 10px", background: "#f8f4ec", borderRadius: "20px" }}>{app}</span>
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: "var(--muted-ink)", marginTop: "16px", lineHeight: 1.6 }}>
                  Open any UPI app → Scan this QR code → Complete payment.<br />
                  After payment, <strong>upload your screenshot below</strong> and click confirm.
                </p>
              </div>

              {/* ── Screenshot Upload ── */}
              <div style={{ marginBottom: "20px", background: "white", border: "1.5px dashed var(--border)", borderRadius: "12px", padding: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--muted-ink)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Upload size={14} /> ATTACH PAYMENT SCREENSHOT <span style={{ color: "var(--maroon)" }}>*</span>
                </div>

                {screenshot ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1.5px solid #c8e6c9", maxHeight: "200px" }}>
                      <img src={screenshot} alt="Payment screenshot" style={{ width: "100%", maxHeight: "200px", objectFit: "contain", background: "#fafafa" }} />
                      <div style={{ position: "absolute", top: "8px", right: "8px", background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 700, color: "#2e7d32", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Check size={10} /> Attached
                      </div>
                    </div>
                    <button type="button" onClick={() => { setScreenshot(""); setScreenshotName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      style={{ alignSelf: "flex-start", fontSize: "11px", fontWeight: 600, color: "var(--maroon)", background: "transparent", border: "1px solid var(--maroon)", borderRadius: "6px", padding: "5px 12px", cursor: "pointer" }}>
                      Change Screenshot
                    </button>
                  </div>
                ) : (
                  <div>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      style={{ width: "100%", padding: "20px", background: "#fdf8f0", border: "1.5px dashed #d4b896", borderRadius: "10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
                      <Image size={28} color="var(--gold)" />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>Tap to upload payment screenshot</span>
                      <span style={{ fontSize: "11px", color: "var(--muted-ink)" }}>JPG, PNG · Max 5MB</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleScreenshotChange} />
                  </div>
                )}

                {screenshotError && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#c02020", fontWeight: 600 }}>
                    <AlertCircle size={13} /> {screenshotError}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" style={{ flex: "0 0 auto", padding: "12px 20px", background: "white", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--muted-ink)" }} onClick={() => setStep("form")}>
                  ← Back to Details
                </button>
                <button type="button" className="button button-maroon" style={{ flex: 1, borderRadius: "6px", minHeight: "48px", opacity: !screenshot ? 0.7 : 1 }} onClick={handleConfirmPayment} disabled={isSaving}>
                  {isSaving ? "Processing…" : "I've Completed Payment"} <Check size={16} />
                </button>
              </div>
              {!screenshot && (
                <p style={{ marginTop: "8px", fontSize: "11px", color: "#c06030", textAlign: "center", fontWeight: 600 }}>
                  ⚠ Please attach your payment screenshot to proceed.
                </p>
              )}
            </div>
          )}

          {/* ═══════════════════════ STEP 3: CONFIRMED ═══════════════════════ */}
          {step === "confirmed" && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#e8f5e9", color: "#2e7d32", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
                <Check size={30} />
              </div>
              <h3 style={{ fontSize: 26, fontFamily: "var(--serif)", marginBottom: 6, color: "var(--green)" }}>Booking Confirmed!</h3>
              <div style={{ fontSize: 13, letterSpacing: "0.15em", color: "var(--gold)", fontWeight: 700, marginBottom: "18px" }}>REF: {bookingRef}</div>

              {/* Verification QR */}
              <div style={{ padding: "18px", display: "inline-block", background: "white", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "22px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <QRCodeSVG value={`https://karikalam.com/verify/${bookingRef}`} size={140} fgColor="var(--maroon)" />
              </div>

              {/* Booking summary */}
              <div style={{ display: "inline-flex", flexDirection: "column", gap: "8px", background: "var(--ivory)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 24px", textAlign: "left", minWidth: "300px", maxWidth: "380px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>Guest</span>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>{customerName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>Guests</span>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>{quantity}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>Event Date</span>
                  <span style={{ fontWeight: 700, color: "var(--green)" }}>{selectedDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>Dining Slot</span>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>{selectedSlot}</span>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>Total Amount</span>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>₹{discountedTotal.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>Paid ({paymentType === "partial" ? "50% Advance" : "Full"})</span>
                  <span style={{ fontWeight: 700, color: "#2e7d32" }}>₹{payableAmount.toLocaleString("en-IN")}</span>
                </div>
                {balanceDue > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "var(--muted-ink)" }}>Balance Due at Venue</span>
                    <span style={{ fontWeight: 700, color: "var(--maroon)" }}>₹{balanceDue.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                  <span style={{ color: "var(--muted-ink)" }}>Payment Status</span>
                  <span style={{
                    padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
                    background: paymentType === "full" ? "#e8f5e9" : "#fde8e8",
                    color: paymentType === "full" ? "#2e7d32" : "#c02020"
                  }}>
                    {paymentType === "full" ? "✓ FULLY PAID" : "⚠ PARTIAL PAID"}
                  </span>
                </div>
                {screenshot && (
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ fontSize: "10px", color: "var(--muted-ink)", fontWeight: 700, letterSpacing: "0.07em" }}>PAYMENT SCREENSHOT</span>
                    <img src={screenshot} alt="Payment proof" style={{ width: "100%", borderRadius: "6px", marginTop: "6px", border: "1px solid var(--border)", maxHeight: "100px", objectFit: "contain", background: "#f9f6f0" }} />
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: "var(--muted-ink)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto 20px" }}>
                Thank you, {customerName}! Your booking is confirmed. Present this QR code at the venue for check-in.
                {balanceDue > 0 && ` Please pay the remaining ₹${balanceDue.toLocaleString("en-IN")} at the venue.`}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" className="btn-call-to-book" onClick={() => openReservation(selectedSlot)}>
                  <Phone size={13} /> Contact Reception
                </button>
              </div>
            </div>
          )}
        </div></section>

        <section className="booking-steps section-pad"><div className="center-heading"><span className="eyebrow">WHEN BOOKINGS OPEN</span><h2>Simple, thoughtful,<br /><em>made for you.</em></h2></div><div className="booking-steps-grid"><article><span>01</span><h3>Explore</h3><p>Discover the Keda Virundhu menu and event details.</p></article><article><span>02</span><h3>Choose</h3><p>Select the ticket option that suits your gathering.</p></article><article><span>03</span><h3>Book</h3><p>Share your details and complete your booking securely.</p></article><article><span>04</span><h3>Gather</h3><p>Receive your digital ticket and join us at the table.</p></article></div></section>

        <section className="faq-section section-pad"><div className="faq-heading"><span className="eyebrow"><span className="eyebrow-line" /> A FEW THINGS TO KNOW</span><h2>Questions, <em>answered.</em></h2></div><div className="faq-list"><details><summary>When will Keda Virundhu take place?<Plus size={17} /></summary><p>Keda Virundhu runs for 3 days: October 23, 24 & 25, 2026. There are 6 dining batches per day from 11 AM to 11 PM.</p></details><details><summary>How much do tickets cost?<Plus size={17} /></summary><p>₹1,499 per person with an exclusive 10% online discount. Pay ₹1,349 per person when booking online.</p></details><details><summary>Where will the event be held?<Plus size={17} /></summary><p>Keda Virundhu will take place at Karikalam Restaurant: {restaurantAddress.join(" ")}</p></details><details><summary>What is included in the feast?<Plus size={17} /></summary><p>The complete official menu is listed above. Please contact Karikalam for event updates at +91 6364-667772.</p></details><details><summary>How many seats are available per slot?<Plus size={17} /></summary><p>Each dining slot has a maximum of 80 seats. Slots are filled on a first-come, first-served basis. Book early to secure your preferred time!</p></details></div></section>

        <section className="event-location">
          <div className="event-location-inner wrap">
            <div style={{ maxWidth: "480px" }}>
              <span className="eyebrow eyebrow-light"><span className="eyebrow-line" /> THE PLACE</span>
              <h2>A table awaits<br /><em>at Karikalam.</em></h2>
              <p>KARIKALAM RESTAURANT</p>
              <address>{restaurantAddress.map((line) => <span key={line}>{line}</span>)}</address>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "18px" }}>
                <a href="tel:+916364667772" className="button button-ivory">+91 6364-667772 <ArrowUpRight size={16} /></a>
                <a href="https://maps.google.com/?q=No29+Doddamara+road+Choodasandra+Hosa+Road+Bangalore+560100" target="_blank" rel="noreferrer" className="text-button" style={{ color: "#e4c681" }}>
                  Open in Google Maps <ArrowRight size={15} />
                </a>
              </div>
            </div>
            <div className="event-location-map-wrap" style={{ flex: "1", maxWidth: "520px", minWidth: "300px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(198, 161, 91, 0.45)", boxShadow: "0 12px 36px rgba(0,0,0,0.3)" }}>
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.751213348825!2d77.6705135!3d12.8791936!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae6d001d4c2aa5%3A0xf3cc561195f02cd4!2sKari%20Kalam!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%" height="320" style={{ border: 0, display: "block" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Karikalam Location Map" />
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
