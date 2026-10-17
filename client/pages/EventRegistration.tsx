import { ArrowLeft, Check, CheckCircle2, Image, Minus, Plus, Ticket, Upload } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { eventDateOptions, eventSlotTimings } from "@/lib/karikalam";
import { SiteLayout } from "@/components/SiteLayout";

const MAX_SEATS = 80;
const PRICE_PER_GUEST = 1499;
const ONLINE_PRICE_PER_GUEST = Math.round(PRICE_PER_GUEST * 0.9);

type Availability = Record<string, Record<string, number>>;
type RegistrationStep = "details" | "payment";
type PaymentType = "partial" | "full";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPhone = (value: string) => /^[6-9]\d{9}$/.test(value.trim());

export default function EventRegistration() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(1);
  const [eventDate, setEventDate] = useState(eventDateOptions[0].date);
  const [slot, setSlot] = useState(eventSlotTimings[0].time);
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<Availability>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [step, setStep] = useState<RegistrationStep>("details");
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [screenshotError, setScreenshotError] = useState("");
  const uploadInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/slot-availability")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setAvailability(data?.availability ?? {}))
      .catch(() => undefined);
  }, []);

  const remaining = availability[eventDate]?.[slot] ?? MAX_SEATS;
  const totalAmount = ONLINE_PRICE_PER_GUEST * guests;
  const payableAmount = paymentType === "partial" ? Math.round(totalAmount / 2) : totalAmount;
  const balanceDue = totalAmount - payableAmount;

  const proceedToPayment = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim() || !isEmail(email) || !isPhone(phone)) {
      setError("Please enter your name, a valid email address, and a 10-digit mobile number.");
      return;
    }
    if (guests > remaining) {
      setError(`Only ${remaining} seat${remaining === 1 ? "" : "s"} remain for this dining slot.`);
      return;
    }

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScreenshot = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setScreenshotError("");
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setScreenshotError("Please upload a JPG or PNG payment screenshot under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPaymentScreenshot(String(reader.result));
    reader.readAsDataURL(file);
  };

  const confirmPayment = async () => {
    setError("");
    if (!paymentScreenshot) {
      setScreenshotError("Please attach your payment screenshot before confirming.");
      return;
    }
    setSubmitting(true);
    const bookingRef = `KV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), phone, bookingRef,
          ticketType: "Event Registration", ticketQuantity: guests,
          eventDate, preferredSlot: slot, totalAmount,
          paymentType, amountPaid: payableAmount, balanceDue,
          paymentStatus: paymentType === "full" ? "Paid" : "Partial", paymentScreenshot,
          status: paymentType === "full" ? "Confirmed" : "Partial Payment", notes: notes.trim(),
        }),
      });
      if (!response.ok) throw new Error("Registration could not be saved.");
      setReference(bookingRef);
    } catch {
      setError("We could not complete your registration. Please try again or call the restaurant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <main className="section-pad" style={{ minHeight: "72vh", background: "#fbf8f2" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span className="eyebrow">KARIKALAM PRESENTS</span>
            <h1 style={{ fontFamily: "var(--serif)", color: "var(--ink)", fontSize: "clamp(36px, 6vw, 58px)", margin: "10px 0" }}>Register for <em>Keda Virundhu</em></h1>
            <p style={{ color: "var(--muted-ink)", margin: 0 }}>{step === "payment" ? "Complete payment to confirm your event registration." : "Reserve your preferred dining date and time in two simple steps."}</p>
          </div>

          {reference ? (
            <section style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "48px 28px", textAlign: "center", boxShadow: "0 12px 35px rgba(0,0,0,.05)" }}>
              <CheckCircle2 size={52} color="#2a6044" style={{ marginBottom: 14 }} />
              <h2 style={{ fontFamily: "var(--serif)", color: "var(--green)", margin: "0 0 8px" }}>Registration received</h2>
              <p style={{ color: "var(--muted-ink)", marginBottom: 18 }}>Thank you, {name}. We will contact you with the next steps.</p>
              <strong style={{ display: "inline-block", padding: "10px 16px", borderRadius: 8, background: "var(--ivory)", color: "var(--maroon)", letterSpacing: ".08em" }}>REFERENCE: {reference}</strong>
            </section>
          ) : step === "details" ? (
            <form onSubmit={proceedToPayment} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "clamp(22px, 5vw, 40px)", boxShadow: "0 12px 35px rgba(0,0,0,.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, color: "var(--maroon)" }}><Ticket size={20} /><strong style={{ letterSpacing: ".08em", fontSize: 12 }}>EVENT REGISTRATION</strong></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <Field label="Full name *"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" /></Field>
                <Field label="Mobile number *"><input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" autoComplete="tel" /></Field>
                <Field label="Email address *"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" /></Field>
                <Field label="Number of guests *"><div style={{ display: "flex", border: "1px solid var(--border)", width: "fit-content" }}><button type="button" onClick={() => setGuests((value) => Math.max(1, value - 1))} style={counterButton}><Minus size={15} /></button><span style={{ width: 50, textAlign: "center", lineHeight: "42px", fontWeight: 700 }}>{guests}</span><button type="button" onClick={() => setGuests((value) => Math.min(20, value + 1))} style={counterButton}><Plus size={15} /></button></div></Field>
              </div>
              <div style={{ marginTop: 22, padding: "16px 18px", background: "#fdf8f0", border: "1px solid #e8d8b8", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--muted-ink)" }}>EVENT REGISTRATION AMOUNT</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: "var(--ink)" }}>{guests} guest{guests === 1 ? "" : "s"} × ₹{ONLINE_PRICE_PER_GUEST.toLocaleString("en-IN")}</div>
                  <div style={{ marginTop: 3, fontSize: 11, color: "#2a6044", fontWeight: 700 }}>10% online discount applied (regular price ₹{PRICE_PER_GUEST.toLocaleString("en-IN")} per guest)</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--muted-ink)" }}>TOTAL</div>
                  <strong style={{ fontFamily: "var(--serif)", fontSize: 28, color: "var(--maroon)" }}>₹{totalAmount.toLocaleString("en-IN")}</strong>
                </div>
              </div>
              <div style={{ marginTop: 22 }}><label style={labelStyle}>Select event date *</label><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>{eventDateOptions.map((option) => <button key={option.date} type="button" onClick={() => { setEventDate(option.date); setSlot(eventSlotTimings[0].time); }} style={choiceStyle(eventDate === option.date)}><b>{option.label}</b><span>{option.short}</span></button>)}</div></div>
              <div style={{ marginTop: 22 }}><label style={labelStyle}>Preferred dining slot *</label><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10 }}>{eventSlotTimings.map((option) => { const seats = availability[eventDate]?.[option.time] ?? MAX_SEATS; const full = seats <= 0; return <button key={option.id} type="button" disabled={full} onClick={() => setSlot(option.time)} style={{ ...choiceStyle(slot === option.time), opacity: full ? .45 : 1 }}><b>{option.label}</b><span>{option.time}</span><small>{full ? "Full" : `${seats} seats left`}</small></button>; })}</div></div>
              <div style={{ marginTop: 22 }}><Field label="Special requests (optional)"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dietary needs or other notes" rows={3} /></Field></div>
              {error && <p role="alert" style={{ color: "var(--maroon)", fontSize: 13, fontWeight: 600, marginTop: 18 }}>{error}</p>}
              <button className="button button-maroon" type="submit" style={{ width: "100%", marginTop: 26, borderRadius: 8 }}>Process Payment</button>
            </form>
          ) : (
            <section style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "clamp(22px, 5vw, 40px)", boxShadow: "0 12px 35px rgba(0,0,0,.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div><span className="eyebrow">STEP 2 OF 2</span><h2 style={{ fontFamily: "var(--serif)", margin: "7px 0 0", color: "var(--ink)" }}>Payment details</h2></div>
                <button type="button" onClick={() => setStep("details")} style={{ background: "transparent", border: "none", color: "var(--maroon)", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><ArrowLeft size={15} /> Edit details</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginBottom: 18 }}>
                {(["full", "partial"] as PaymentType[]).map((type) => { const active = paymentType === type; const amount = type === "full" ? totalAmount : Math.round(totalAmount / 2); return <button key={type} type="button" onClick={() => setPaymentType(type)} style={{ padding: 14, borderRadius: 10, textAlign: "left", border: active ? "2px solid var(--maroon)" : "1px solid var(--border)", background: active ? "#fdf3f1" : "white", cursor: "pointer", color: active ? "var(--maroon)" : "var(--ink)" }}><b>{type === "full" ? "Full payment" : "50% advance"}</b><span style={{ display: "block", marginTop: 5, fontSize: 13 }}>Pay now: ₹{amount.toLocaleString("en-IN")}</span></button>; })}
              </div>
              <div style={{ padding: "16px 18px", background: "var(--ivory)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 18, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span>{guests} guest{guests === 1 ? "" : "s"} · {eventDate}</span><b>{slot}</b></div>
                <div style={{ borderTop: "1px dashed var(--border)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700 }}>Amount to pay now</span><strong style={{ color: "var(--maroon)", fontFamily: "var(--serif)", fontSize: 24 }}>₹{payableAmount.toLocaleString("en-IN")}</strong></div>
                {balanceDue > 0 && <div style={{ marginTop: 5, color: "var(--muted-ink)" }}>Balance due at venue: ₹{balanceDue.toLocaleString("en-IN")}</div>}
              </div>
              <div style={{ textAlign: "center", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 14px", marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "var(--muted-ink)", marginBottom: 12 }}>SCAN QR TO PAY VIA UPI</div>
                <img src="/bharatpe-payment-qr.jpeg" alt="BharatPe UPI QR code for payment" style={{ display: "block", width: "min(100%, 330px)", margin: "0 auto", border: "1px solid var(--border)", borderRadius: 10 }} />
                <p style={{ margin: "13px 0 0", fontSize: 12, color: "var(--muted-ink)" }}>Use any UPI app to scan and complete your ₹{payableAmount.toLocaleString("en-IN")} payment.</p>
              </div>
              <div style={{ border: "1.5px dashed var(--border)", borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--ink)", marginBottom: 12 }}><Upload size={15} /> ATTACH PAYMENT SCREENSHOT *</div>
                {paymentScreenshot ? <div><img src={paymentScreenshot} alt="Payment screenshot" style={{ width: "100%", maxHeight: 210, objectFit: "contain", border: "1px solid #c8e6c9", borderRadius: 8, background: "#fafafa" }} /><button type="button" onClick={() => { setPaymentScreenshot(""); if (uploadInput.current) uploadInput.current.value = ""; }} style={{ marginTop: 9, background: "transparent", border: "none", color: "var(--maroon)", fontWeight: 700, cursor: "pointer" }}>Change screenshot</button></div> : <button type="button" onClick={() => uploadInput.current?.click()} style={{ width: "100%", padding: "20px", background: "#fdf8f0", border: "1.5px dashed #d4b896", borderRadius: 8, cursor: "pointer", color: "var(--ink)" }}><Image size={25} color="var(--gold)" /><span style={{ display: "block", marginTop: 7, fontWeight: 700 }}>Upload payment screenshot</span><small>JPG or PNG · Max 5MB</small></button>}
                <input ref={uploadInput} type="file" accept="image/*" onChange={handleScreenshot} style={{ display: "none" }} />
                {screenshotError && <p role="alert" style={{ color: "var(--maroon)", fontSize: 12, fontWeight: 700, margin: "9px 0 0" }}>{screenshotError}</p>}
              </div>
              {error && <p role="alert" style={{ color: "var(--maroon)", fontSize: 13, fontWeight: 600, marginTop: 16 }}>{error}</p>}
              <button className="button button-maroon" type="button" onClick={confirmPayment} disabled={submitting} style={{ width: "100%", marginTop: 22, borderRadius: 8 }}>{submitting ? "Confirming payment…" : "I've Completed Payment"} <Check size={16} /></button>
            </section>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="customer-field"><label style={labelStyle}>{label}</label>{children}</div>;
}

const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--ink)", marginBottom: 7 } as const;
const counterButton = { width: 42, height: 42, border: "none", borderRight: "1px solid var(--border)", background: "white", color: "var(--maroon)", cursor: "pointer", display: "grid", placeItems: "center" } as const;
const choiceStyle = (selected: boolean) => ({ padding: "12px 10px", textAlign: "left" as const, display: "flex", flexDirection: "column" as const, gap: 3, borderRadius: 8, border: selected ? "2px solid var(--maroon)" : "1px solid var(--border)", background: selected ? "#fdf3f1" : "white", color: selected ? "var(--maroon)" : "var(--ink)", cursor: "pointer" });
