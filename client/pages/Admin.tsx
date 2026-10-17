import { Link } from "react-router-dom";
import { ShieldAlert, RefreshCw, Users, CheckCircle2, Clock, Image, X, IndianRupee, TrendingUp, Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export default function Admin() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [screenshotModal, setScreenshotModal] = useState<{ url: string; name: string } | null>(null);
    const [filterDate, setFilterDate] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchBookings = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await fetch("/api/bookings");
            if (res.ok) {
                const data = await res.json();
                const formatted = data.map((b: any) => ({
                    ...b,
                    createdAt: new Date(b.createdAt).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                    }),
                }));
                setBookings(formatted);
                setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
            }
        } catch (err) {
            console.error("Error fetching admin bookings:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);
    useEffect(() => {
        const interval = setInterval(() => fetchBookings(), 10000);
        return () => clearInterval(interval);
    }, [fetchBookings]);

    const pendingCount = bookings.filter(b => ["pending", "partial payment"].includes((b.status || "").toLowerCase())).length;
    const checkedInCount = bookings.filter(b => (b.status || "").toLowerCase() === "checked in").length;
    const partialCount = bookings.filter(b => (b.paymentStatus || "").toLowerCase() === "partial").length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0);

    const eventDates = ["23 October 2026", "24 October 2026", "25 October 2026"];

    const filteredBookings = bookings.filter(b => {
        const dateMatch = filterDate === "all" || b.eventDate === filterDate;
        const statusMatch = filterStatus === "all" ||
            (filterStatus === "partial" && (b.paymentStatus || "").toLowerCase() === "partial") ||
            (filterStatus === "paid" && (b.paymentStatus || "").toLowerCase() === "paid") ||
            (filterStatus === "checkedin" && (b.checkInStatus || b.status?.toLowerCase() === "checked in"));
        if (!dateMatch || !statusMatch) return false;
        // Text search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (b.name || "").toLowerCase().includes(q) ||
                (b.email || "").toLowerCase().includes(q) ||
                (b.phone || "").includes(searchQuery.trim()) ||
                (b.bookingRef || "").toLowerCase().includes(q) ||
                (b.preferredSlot || "").toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <main style={{ minHeight: "100vh", background: "#f4f5f7", padding: "48px 20px" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto" }}>

                {/* ── Header ── */}
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{ width: 48, height: 48, background: "var(--maroon)", color: "white", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(139,26,16,0.3)" }}>
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h1 style={{ fontFamily: "var(--serif)", fontSize: 30, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>Admin Portal</h1>
                            <p style={{ color: "var(--muted-ink)", margin: 0, fontSize: 13 }}>Karikalam Ticketing System · Keda Virundhu 2026</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        {lastUpdated && (
                            <span style={{ fontSize: "11px", color: "var(--muted-ink)", fontWeight: 600 }}>Updated {lastUpdated}</span>
                        )}
                        <button onClick={() => fetchBookings(true)} disabled={refreshing}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "white", border: "1px solid var(--border)", borderRadius: "8px", cursor: refreshing ? "wait" : "pointer", fontSize: "12px", fontWeight: 700, color: "var(--ink)", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", transition: "all 0.2s" }}>
                            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                            Refresh
                        </button>
                        <Link to="/" className="button button-outline" style={{ background: "white", fontSize: "12px" }}>Exit Dashboard</Link>
                    </div>
                </header>

                {/* ── Stats Cards ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "18px", marginBottom: "32px" }}>
                    <StatCard label="TOTAL REGISTRATIONS" value={loading ? "…" : String(bookings.length)} icon={<Users size={20} />} color="var(--maroon)" />
                    <StatCard label="PARTIAL PAYMENTS" value={loading ? "…" : String(partialCount)} icon={<Clock size={20} />} color="#c02020" sub="Balance due at venue" />
                    <StatCard label="CHECKED IN" value={loading ? "…" : String(checkedInCount)} icon={<CheckCircle2 size={20} />} color="var(--green)" />
                    <StatCard label="TOTAL COLLECTED" value={loading ? "…" : `₹${totalRevenue.toLocaleString("en-IN")}`} icon={<IndianRupee size={20} />} color="#1a6e30" sub="Online payments received" />
                    <div style={{ background: "white", padding: "22px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <div style={{ color: "var(--muted-ink)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "12px" }}>UPCOMING EVENT</div>
                        <div style={{ fontSize: "22px", fontFamily: "var(--serif)", fontWeight: 600, color: "var(--green)", lineHeight: 1.2 }}>Keda Virundhu</div>
                        <div style={{ fontSize: "11px", color: "var(--muted-ink)", marginTop: "6px", fontWeight: 600 }}>23 – 25 OCTOBER 2026</div>
                        <div style={{ fontSize: "11px", color: "var(--muted-ink)", marginTop: "4px" }}>3 Days · 6 Slots/Day · 80 Seats/Slot</div>
                    </div>
                </div>

                {/* ── Search Bar ── */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Search size={18} style={{ position: "absolute", left: 15, top: 15, color: "var(--muted-ink)" }} />
                        <input type="text" placeholder="Search by Ref ID / Name / Phone / Email…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: "100%", padding: "14px 15px 14px 45px", borderRadius: "8px", border: "1.5px solid var(--border)", fontSize: "15px", boxSizing: "border-box", transition: "border-color 0.2s" }}
                        />
                    </div>
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")}
                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", background: "white", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "var(--muted-ink)", whiteSpace: "nowrap" }}>
                            <X size={14} /> Clear
                        </button>
                    )}
                </div>

                {/* ── Filters ── */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted-ink)" }}>FILTER:</span>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <FilterChip label="All Dates" active={filterDate === "all"} onClick={() => setFilterDate("all")} />
                        {eventDates.map(d => <FilterChip key={d} label={d.split(" ")[0] + " Oct"} active={filterDate === d} onClick={() => setFilterDate(d)} />)}
                    </div>
                    <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <FilterChip label="All Status" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
                        <FilterChip label="Partial ⚠" active={filterStatus === "partial"} onClick={() => setFilterStatus("partial")} color="#c02020" />
                        <FilterChip label="Paid ✓" active={filterStatus === "paid"} onClick={() => setFilterStatus("paid")} color="#1a7a45" />
                        <FilterChip label="Checked In" active={filterStatus === "checkedin"} onClick={() => setFilterStatus("checkedin")} color="#2460c8" />
                    </div>
                </div>

                {/* ── Bookings Table ── */}
                <section style={{ background: "white", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                    <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--border)", background: "var(--ivory)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                            <h2 style={{ fontSize: "17px", margin: 0, color: "var(--ink)", fontWeight: 700 }}>Customer Registration Database</h2>
                            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted-ink)", marginTop: "3px" }}>All Keda Virundhu registrations — live updated every 10 seconds.</p>
                        </div>
                        {filteredBookings.length > 0 && (
                            <span style={{ background: "var(--maroon)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>
                                {filteredBookings.length} record{filteredBookings.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ padding: "60px", textAlign: "center", color: "var(--muted-ink)" }}>
                            <div style={{ fontSize: "28px", marginBottom: "12px" }}>⏳</div>
                            <p style={{ margin: 0, fontWeight: 600 }}>Loading registrations…</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div style={{ padding: "70px 40px", textAlign: "center", color: "var(--muted-ink)" }}>
                            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📋</div>
                            <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--ink)" }}>No registrations found</p>
                            <p style={{ margin: "8px 0 0", fontSize: "13px" }}>Try changing your filters, or wait for new bookings to arrive.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "1100px" }}>
                                <thead>
                                    <tr style={{ background: "#fafafa", borderBottom: "2px solid var(--border)", color: "var(--muted-ink)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>#</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Customer</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Contact</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Pax</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Date & Slot</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Amount</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Payment</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Screenshot</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Ref ID</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Status</th>
                                        <th style={{ padding: "14px 16px", fontWeight: 700 }}>Registered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((b: any, idx: number) => {
                                        const isPartial = (b.paymentStatus || "").toLowerCase() === "partial";
                                        const isPaid = (b.paymentStatus || "").toLowerCase() === "paid";
                                        const rowBg = isPartial ? "rgba(255, 235, 235, 0.4)" : isPaid ? "rgba(235, 255, 240, 0.3)" : "transparent";
                                        return (
                                            <tr key={b._id || b.id || idx}
                                                style={{ borderBottom: "1px solid #f0ece4", background: rowBg, transition: "background 0.15s" }}
                                                onMouseEnter={e => (e.currentTarget.style.background = isPartial ? "rgba(255,220,220,0.5)" : isPaid ? "rgba(220,255,230,0.5)" : "#fdf9f5")}
                                                onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                                                <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--muted-ink)", fontWeight: 600 }}>{idx + 1}</td>
                                                <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--ink)", fontSize: "14px" }}>{b.name}</td>
                                                <td style={{ padding: "14px 16px", fontSize: "12px" }}>
                                                    <div style={{ color: "var(--ink)", fontWeight: 600 }}>{b.email}</div>
                                                    <div style={{ color: "var(--muted-ink)", marginTop: "2px" }}>{b.phone}</div>
                                                </td>
                                                <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "var(--ink)", textAlign: "center" }}>
                                                    {b.ticketQuantity || 1}
                                                </td>
                                                <td style={{ padding: "14px 16px", fontSize: "12px" }}>
                                                    <div style={{ fontWeight: 700, color: "var(--green)", marginBottom: "2px" }}>{b.eventDate || "23 October 2026"}</div>
                                                    <div style={{ color: "var(--muted-ink)" }}>{b.preferredSlot || "11:00 AM – 12:30 PM"}</div>
                                                </td>
                                                <td style={{ padding: "14px 16px", fontSize: "12px" }}>
                                                    <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "3px" }}>₹{(Number(b.totalAmount) || 0).toLocaleString("en-IN")}</div>
                                                    <div style={{ color: "#2a9044", fontWeight: 600 }}>Paid: ₹{(Number(b.amountPaid) || 0).toLocaleString("en-IN")}</div>
                                                    {Number(b.balanceDue) > 0 && (
                                                        <div style={{ color: "#c02020", fontWeight: 600 }}>Due: ₹{Number(b.balanceDue).toLocaleString("en-IN")}</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: "14px 16px" }}>
                                                    <PaymentBadge paymentStatus={b.paymentStatus} paymentType={b.paymentType} />
                                                </td>
                                                <td style={{ padding: "14px 16px" }}>
                                                    {b.paymentScreenshot ? (
                                                        <button onClick={() => setScreenshotModal({ url: b.paymentScreenshot, name: b.name })}
                                                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#edf4ff", border: "1px solid #b0caee", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: "#1a4fa0" }}>
                                                            <Image size={13} /> View
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: "11px", color: "#c02020", fontWeight: 600 }}>⚠ Not uploaded</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: "12px", color: "var(--ink)", fontWeight: 700, letterSpacing: "0.05em" }}>
                                                    {b.bookingRef || b.ref}
                                                </td>
                                                <td style={{ padding: "14px 16px" }}>
                                                    <StatusBadge status={b.status} />
                                                </td>
                                                <td style={{ padding: "14px 16px", fontSize: "11px", color: "var(--muted-ink)", whiteSpace: "nowrap" }}>{b.createdAt}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {/* ── Screenshot Modal ── */}
            {screenshotModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
                    onClick={() => setScreenshotModal(null)}>
                    <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", maxWidth: "600px", width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ivory)" }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>Payment Screenshot</div>
                                <div style={{ fontSize: "12px", color: "var(--muted-ink)" }}>{screenshotModal.name}</div>
                            </div>
                            <button onClick={() => setScreenshotModal(null)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <div style={{ padding: "20px", background: "#f8f8f8" }}>
                            <img src={screenshotModal.url} alt={`Payment screenshot for ${screenshotModal.name}`} style={{ width: "100%", borderRadius: "8px", maxHeight: "500px", objectFit: "contain", background: "white" }} />
                        </div>
                        <div style={{ padding: "12px 20px", textAlign: "center" }}>
                            <a href={screenshotModal.url} download={`payment-${screenshotModal.name}.png`}
                                style={{ fontSize: "12px", fontWeight: 700, color: "var(--maroon)", textDecoration: "underline" }}>
                                Download Screenshot
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </main>
    );
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
    return (
        <button onClick={onClick} style={{
            padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, cursor: "pointer",
            border: active ? `1.5px solid ${color || "var(--maroon)"}` : "1px solid var(--border)",
            background: active ? (color ? color + "18" : "#fef2f2") : "white",
            color: active ? (color || "var(--maroon)") : "var(--muted-ink)",
            transition: "all 0.15s"
        }}>{label}</button>
    );
}

function StatCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string }) {
    return (
        <div style={{ background: "white", padding: "22px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ color: "var(--muted-ink)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em" }}>{label}</div>
                <div style={{ color, opacity: 0.7 }}>{icon}</div>
            </div>
            <div style={{ fontSize: "38px", fontFamily: "var(--serif)", fontWeight: 600, color, lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: "11px", color: "var(--muted-ink)" }}>{sub}</div>}
        </div>
    );
}

function PaymentBadge({ paymentStatus, paymentType }: { paymentStatus: string; paymentType: string }) {
    const s = (paymentStatus || "").toLowerCase();
    if (s === "paid" || paymentType === "full") {
        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 11px", background: "#e8f5e9", color: "#1a7a45", borderRadius: "20px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", border: "1px solid #c8e6c9" }}>
                ✓ FULL PAID
            </span>
        );
    }
    if (s === "partial") {
        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 11px", background: "#fde8e8", color: "#c02020", borderRadius: "20px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", border: "1px solid #f5c2c2" }}>
                ⚠ PARTIAL
            </span>
        );
    }
    return (
        <span style={{ padding: "5px 11px", background: "#fff8ec", color: "#c6852a", borderRadius: "20px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
            PENDING
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = (status || "pending").toLowerCase();
    const styles: Record<string, { bg: string; color: string; border: string }> = {
        pending: { bg: "#fff8ec", color: "#c6852a", border: "#f0d099" },
        "partial payment": { bg: "#fde8e8", color: "#c02020", border: "#f5c2c2" },
        confirmed: { bg: "#edf4ff", color: "#2460c8", border: "#b0caee" },
        "checked in": { bg: "#ecfaf2", color: "#1a7a45", border: "#a3d9b8" },
        cancelled: { bg: "#fef2f2", color: "#c02020", border: "#f5c2c2" },
    };
    const style = styles[s] || styles["pending"];
    return (
        <span style={{ padding: "5px 11px", background: style.bg, color: style.color, borderRadius: "20px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", border: `1px solid ${style.border}` }}>
            {status || "Pending"}
        </span>
    );
}
