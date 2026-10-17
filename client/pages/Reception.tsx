import { Link } from "react-router-dom";
import { ConciergeBell, CheckCircle, Search, Clock, Image, X, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function Reception() {
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [screenshotModal, setScreenshotModal] = useState<{ url: string; name: string; ref: string } | null>(null);

    const fetchGuestList = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                setAllBookings(data);
            }
        } catch (e) {
            console.error("Failed to fetch guest list", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuestList();
        const interval = setInterval(fetchGuestList, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleCheckIn = async (id: string, refId: string) => {
        if (!confirm(`Confirm check-in for QR Reference: ${refId}?`)) return;
        try {
            const res = await fetch(`/api/bookings/${id}/checkin`, { method: "PATCH" });
            if (res.ok) {
                fetchGuestList();
            } else {
                alert("Check-in validation failed via backend.");
            }
        } catch (e) {
            alert("Network error trying to process check-in.");
        }
    };

    // Quick search by ref, name, or phone
    const handleQuickSearch = () => {
        const q = searchQuery.trim().toUpperCase();
        if (!q) return;
        const found = allBookings.find(b =>
            (b.bookingRef || "").toUpperCase().includes(q) ||
            (b.name || "").toUpperCase().includes(q) ||
            (b.phone || "").includes(searchQuery.trim())
        );
        if (found && !found.checkInStatus) {
            if (confirm(`Found: ${found.name} — Ref: ${found.bookingRef}\n${found.ticketQuantity || 1} guest(s) · ${found.preferredSlot}\n\nConfirm check-in?`)) {
                handleCheckIn(found._id, found.bookingRef);
                setSearchQuery("");
            }
        } else if (found && found.checkInStatus) {
            alert(`${found.name} (${found.bookingRef}) has already been checked in.`);
        } else {
            alert("No matching booking found. Please verify the QR reference or name.");
        }
    };

    // Pending (not checked in) guests
    const pendingBookings = allBookings.filter(b => !b.checkInStatus);
    const checkedInCount = allBookings.filter(b => b.checkInStatus).length;

    // Filtered
    const filteredBookings = pendingBookings.filter(b => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (b.name || "").toLowerCase().includes(q) ||
            (b.bookingRef || "").toLowerCase().includes(q) ||
            (b.phone || "").includes(searchQuery.trim()) ||
            (b.preferredSlot || "").toLowerCase().includes(q);
    });

    return (
        <main style={{ minHeight: "100vh", background: "#f8f9fa", paddingBlock: "60px", padding: "60px 20px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

                {/* Header */}
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{ width: 48, height: 48, background: "var(--maroon)", color: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ConciergeBell size={24} />
                        </div>
                        <div>
                            <h1 style={{ fontFamily: "var(--serif)", fontSize: 32, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>Front Desk</h1>
                            <p style={{ color: "var(--muted-ink)", margin: 0, fontSize: 14 }}>Karikalam Restaurant · Keda Virundhu Check-in</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ textAlign: "center", background: "white", borderRadius: "10px", border: "1px solid var(--border)", padding: "10px 18px" }}>
                            <div style={{ fontSize: "22px", fontFamily: "var(--serif)", fontWeight: 700, color: "var(--maroon)", lineHeight: 1 }}>{pendingBookings.length}</div>
                            <div style={{ fontSize: "10px", color: "var(--muted-ink)", fontWeight: 700, letterSpacing: "0.08em", marginTop: "2px" }}>EXPECTED</div>
                        </div>
                        <div style={{ textAlign: "center", background: "white", borderRadius: "10px", border: "1px solid var(--border)", padding: "10px 18px" }}>
                            <div style={{ fontSize: "22px", fontFamily: "var(--serif)", fontWeight: 700, color: "var(--green)", lineHeight: 1 }}>{checkedInCount}</div>
                            <div style={{ fontSize: "10px", color: "var(--muted-ink)", fontWeight: 700, letterSpacing: "0.08em", marginTop: "2px" }}>CHECKED IN</div>
                        </div>
                        <Link to="/" className="button button-outline" style={{ background: "white" }}>Log Out</Link>
                    </div>
                </header>

                {/* QR Search */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Search size={18} style={{ position: "absolute", left: 15, top: 15, color: "var(--muted-ink)" }} />
                        <input type="text" placeholder="Scan QR or Search by Ref ID / Name / Phone…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleQuickSearch()}
                            style={{ width: "100%", padding: "14px 15px 14px 45px", borderRadius: "8px", border: "1.5px solid var(--border)", fontSize: "15px", boxSizing: "border-box" }} />
                    </div>
                    <button className="button button-maroon" onClick={handleQuickSearch} style={{ whiteSpace: "nowrap" }}>
                        Quick Check-in
                    </button>
                </div>

                {/* Guest List Table */}
                <section style={{ background: "white", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.04)" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: "var(--ivory)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                            <h2 style={{ fontSize: "18px", margin: 0, color: "var(--ink)" }}>Guest Arrival Queue</h2>
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted-ink)", marginTop: "4px" }}>
                                Awaiting check-in · Customer must scan QR at reception to enter
                            </p>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--maroon)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={15} /> Live Updates
                        </span>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "900px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)", background: "#fafafa", color: "var(--muted-ink)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    <th style={{ padding: "14px 20px", fontWeight: 600 }}>Date & Slot</th>
                                    <th style={{ padding: "14px 20px", fontWeight: 600 }}>Guest Name</th>
                                    <th style={{ padding: "14px 20px", fontWeight: 600 }}>Ref ID</th>
                                    <th style={{ padding: "14px 20px", fontWeight: 600 }}>Pax</th>
                                    <th style={{ padding: "14px 20px", fontWeight: 600 }}>Payment</th>
                                    <th style={{ padding: "14px 20px", fontWeight: 600 }}>Screenshot</th>
                                    <th style={{ padding: "14px 20px", fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--muted-ink)" }}>
                                            Loading guest list...
                                        </td>
                                    </tr>
                                ) : filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: "50px", textAlign: "center", color: "var(--muted-ink)" }}>
                                            <div style={{ fontSize: "32px", marginBottom: "10px" }}>✅</div>
                                            <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)", marginBottom: "4px" }}>
                                                {searchQuery ? "No matching guests found" : "No pending guests"}
                                            </div>
                                            <div style={{ fontSize: "13px" }}>
                                                {searchQuery ? "Try a different search term." : "All expected guests have checked in!"}
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredBookings.map((b: any) => {
                                    const isPartial = (b.paymentStatus || "").toLowerCase() === "partial";
                                    const isPaid = !isPartial && (b.paymentStatus || "").toLowerCase() === "paid";
                                    const rowBg = isPartial ? "rgba(255, 240, 240, 0.6)" : "transparent";
                                    return (
                                        <tr key={b._id || b.id}
                                            style={{ borderBottom: "1px solid var(--border)", background: rowBg }}>
                                            {/* Date & Slot */}
                                            <td style={{ padding: "16px 20px" }}>
                                                <div style={{ fontWeight: 700, color: "var(--green)", fontSize: "12px", marginBottom: "2px" }}>
                                                    {b.eventDate || "23 October 2026"}
                                                </div>
                                                <div style={{ fontWeight: 600, color: "var(--maroon)", fontSize: "13px" }}>
                                                    {b.preferredSlot || "11:00 AM – 12:30 PM"}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "var(--muted-ink)", marginTop: "2px" }}>
                                                    Reg: {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            {/* Guest Name */}
                                            <td style={{ padding: "16px 20px", fontWeight: "700", color: "var(--ink)", fontSize: "15px" }}>
                                                {b.name}
                                                <div style={{ fontSize: "12px", color: "var(--muted-ink)", fontWeight: "normal", marginTop: "2px" }}>{b.phone}</div>
                                            </td>
                                            {/* Ref */}
                                            <td style={{ padding: "16px 20px", fontFamily: "monospace", fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                                                {b.bookingRef || b.ref}
                                            </td>
                                            {/* Pax */}
                                            <td style={{ padding: "16px 20px", fontWeight: "700", color: "var(--muted-ink)", fontSize: "14px" }}>
                                                {b.ticketQuantity || 1} Guests
                                            </td>
                                            {/* Payment status */}
                                            <td style={{ padding: "16px 20px" }}>
                                                {isPartial ? (
                                                    <div>
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "#fde8e8", color: "#c02020", borderRadius: "20px", fontSize: "10px", fontWeight: 700, border: "1px solid #f5c2c2" }}>
                                                            ⚠ PARTIAL
                                                        </span>
                                                        <div style={{ fontSize: "10px", color: "#c02020", fontWeight: 700, marginTop: "4px" }}>
                                                            Due: ₹{(Number(b.balanceDue) || 0).toLocaleString("en-IN")}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "#e8f5e9", color: "#1a7a45", borderRadius: "20px", fontSize: "10px", fontWeight: 700, border: "1px solid #c8e6c9" }}>
                                                        ✓ PAID
                                                    </span>
                                                )}
                                            </td>
                                            {/* Screenshot */}
                                            <td style={{ padding: "16px 20px" }}>
                                                {b.paymentScreenshot ? (
                                                    <button onClick={() => setScreenshotModal({ url: b.paymentScreenshot, name: b.name, ref: b.bookingRef })}
                                                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#edf4ff", border: "1px solid #b0caee", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: "#1a4fa0" }}>
                                                        <Image size={13} /> View Proof
                                                    </button>
                                                ) : (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#c02020", fontWeight: 600 }}>
                                                        <AlertCircle size={12} /> No screenshot
                                                    </div>
                                                )}
                                            </td>
                                            {/* Action */}
                                            <td style={{ padding: "16px 20px" }}>
                                                <button onClick={() => handleCheckIn(b._id, b.bookingRef || b.ref)}
                                                    style={{ background: "transparent", border: "1.5px solid var(--green)", color: "var(--green)", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                                                    <CheckCircle size={14} /> Check In
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* ── Screenshot Modal ── */}
            {screenshotModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}
                    onClick={() => setScreenshotModal(null)}>
                    <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", maxWidth: "560px", width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ivory)" }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>Payment Screenshot · Verify Before Check-in</div>
                                <div style={{ fontSize: "12px", color: "var(--muted-ink)" }}>{screenshotModal.name} · {screenshotModal.ref}</div>
                            </div>
                            <button onClick={() => setScreenshotModal(null)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <div style={{ padding: "20px", background: "#f0f0f0" }}>
                            <img src={screenshotModal.url} alt="Payment proof" style={{ width: "100%", borderRadius: "8px", maxHeight: "480px", objectFit: "contain", background: "white" }} />
                        </div>
                        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <a href={screenshotModal.url} download={`payment-${screenshotModal.ref}.png`} style={{ fontSize: "12px", fontWeight: 700, color: "var(--maroon)", textDecoration: "underline" }}>
                                Download
                            </a>
                            <button onClick={() => setScreenshotModal(null)} style={{ padding: "8px 20px", background: "var(--green)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
                                Close & Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
