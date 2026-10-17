import React, { useState, useEffect } from "react";
import { Phone, Copy, Check, X, Clock, Users } from "lucide-react";
import { restaurantPhone, restaurantPhoneDial, eventSlotTimings, eventDates, eventDateOptions } from "@/lib/karikalam";

interface CallToBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSlot?: string;
}

export function CallToBookModal({ isOpen, onClose, selectedSlot }: CallToBookModalProps) {
    const [copied, setCopied] = useState(false);
    const [activeSlot, setActiveSlot] = useState(selectedSlot || "");
    const [activeDay, setActiveDay] = useState(0);

    useEffect(() => {
        if (selectedSlot) setActiveSlot(selectedSlot);
    }, [selectedSlot]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(restaurantPhone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const dayNames = ["Thursday", "Friday", "Saturday"];

    return (
        <div className="reservation-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="reservation-modal-container" onClick={(e) => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="reservation-modal-header">
                    <button type="button" className="reservation-modal-close" onClick={onClose} aria-label="Close reservation modal">
                        <X size={18} />
                    </button>
                    <div className="reservation-phone-badge">
                        <Phone size={22} className="phone-icon-svg" />
                    </div>
                    <h2 className="reservation-modal-title">Make a Reservation</h2>
                    <p className="reservation-modal-subtitle">Contact our admin team to book your table.</p>
                </div>

                {/* ── Body ── */}
                <div className="reservation-modal-body">

                    {/* Direct Line */}
                    <div className="reservation-direct-card">
                        <span className="direct-line-label">DIRECT LINE</span>
                        <div className="direct-phone-number">{restaurantPhone}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="reservation-actions">
                        <a href={`tel:${restaurantPhoneDial}`} className="button reservation-btn-dialer">
                            <Phone size={17} /><span>Open Phone Dialer</span>
                        </a>
                        <button type="button" onClick={handleCopy} className="button reservation-btn-copy">
                            {copied ? (
                                <><Check size={17} /><span style={{ color: "#1b3e2b", fontWeight: 700 }}>Copied to Clipboard!</span></>
                            ) : (
                                <><Copy size={17} /><span>Copy Phone Number</span></>
                            )}
                        </button>
                    </div>

                    {/* ── Date-wise Slots ── */}
                    <div className="reservation-slots-section">

                        {/* Section header */}
                        <div className="slots-header">
                            <span className="slots-title">
                                <Clock size={14} /> FEAST DINING SLOTS · {eventDates.range}
                            </span>
                            <span className="slots-hint">Mention your preferred date &amp; slot when calling</span>
                        </div>

                        {/* Capacity notice banner */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "9px 13px",
                            background: "linear-gradient(90deg, #fef2f2 0%, #fdf8f0 100%)",
                            border: "1px solid #f5c2a8", borderRadius: "8px",
                            marginBottom: "14px", fontSize: "11px", fontWeight: 700, color: "#8B1A10",
                            letterSpacing: "0.04em"
                        }}>
                            <Users size={14} style={{ flexShrink: 0 }} />
                            <span>
                                3 DAYS &nbsp;·&nbsp; 6 SLOTS/DAY &nbsp;·&nbsp; <span style={{ color: "#1E4A28" }}>80 SEATS PER SLOT</span> &nbsp;·&nbsp; FIRST COME FIRST SERVED
                            </span>
                        </div>

                        {/* Day Tabs */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "7px", marginBottom: "14px" }}>
                            {eventDateOptions.map((opt, i) => {
                                const isActive = activeDay === i;
                                return (
                                    <button key={opt.date} type="button" onClick={() => setActiveDay(i)}
                                        style={{
                                            padding: "10px 6px", borderRadius: "10px", textAlign: "center", cursor: "pointer",
                                            border: isActive ? "2px solid #8B1A10" : "1.5px solid #e0d8c8",
                                            background: isActive ? "#fef2f2" : "white",
                                            transition: "all 0.15s ease", boxShadow: isActive ? "0 2px 8px rgba(139,26,16,0.12)" : "none"
                                        }}>
                                        <span style={{ display: "block", fontSize: "9px", fontWeight: 700, color: isActive ? "#8B1A10" : "#c8903a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                            {opt.label}
                                        </span>
                                        <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: isActive ? "#8B1A10" : "#221E1B", fontFamily: "var(--serif)", marginTop: "3px", lineHeight: 1 }}>
                                            {opt.short}
                                        </span>
                                        <span style={{ display: "block", fontSize: "9px", color: isActive ? "#b05040" : "#6E6760", marginTop: "3px" }}>
                                            {dayNames[i]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Day label + slot count */}
                        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#8B1A10", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span>{eventDateOptions[activeDay].day.toUpperCase()}</span>
                            <span style={{ color: "#1E4A28", background: "#e8f5e9", padding: "2px 8px", borderRadius: "20px", fontSize: "9px" }}>
                                6 SLOTS · 80 SEATS EACH
                            </span>
                        </div>

                        {/* 6 Slot Pills */}
                        <div className="reservation-slots-grid">
                            {eventSlotTimings.map((slot) => {
                                const isSelected = activeSlot === slot.time;
                                return (
                                    <button key={slot.id} type="button" onClick={() => setActiveSlot(slot.time)}
                                        className={`slot-pill ${isSelected ? "slot-pill-selected" : ""}`}>
                                        <span className="slot-batch">{slot.label}</span>
                                        <span className="slot-time">{slot.time}</span>
                                        <span style={{
                                            display: "flex", alignItems: "center", gap: "3px",
                                            fontSize: "9px", fontWeight: 600, marginTop: "4px",
                                            color: isSelected ? "#8B1A10" : "#6E6760"
                                        }}>
                                            <Users size={9} /> Max 80 seats
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {activeSlot && (
                            <div style={{ marginTop: "10px", padding: "8px 12px", background: "#edf4ff", border: "1px solid #b0caee", borderRadius: "8px", fontSize: "11px", fontWeight: 700, color: "#1a4fa0" }}>
                                ✓ Selected: <strong>{eventDateOptions[activeDay].short} Oct</strong> · {activeSlot} — mention this when calling.
                            </div>
                        )}
                    </div>

                    {/* Location footer */}
                    <div className="reservation-note">
                        <span>📍 Karikalam, Choodasandra, Hosa Road, Bangalore 560100</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
