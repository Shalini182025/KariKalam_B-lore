import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";

export default function MyBookings() {
    return (
        <main className="bookings-page section-pad" style={{ minHeight: "65vh" }}>
            <div className="wrap">
                <div style={{ textAlign: "center", maxWidth: 500, margin: "auto", padding: "60px 20px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, background: "var(--ivory)", borderRadius: "50%", color: "var(--green)", marginBottom: 20 }}>
                        <Ticket size={28} />
                    </div>
                    <h1 style={{ fontFamily: "var(--serif)", fontSize: 36, lineHeight: 1.2, marginBottom: 15, color: "var(--ink)" }}>My Bookings</h1>
                    <p style={{ color: "var(--muted-ink)", fontSize: 15, lineHeight: 1.6, marginBottom: 30 }}>
                        You haven't made any reservations yet. Once official bookings open for Keda Virundhu or other events, your tickets will appear securely here.
                    </p>
                    <Link to="/keda-virundhu" className="button button-maroon">
                        Explore Keda Virundhu
                    </Link>
                </div>
            </div>
        </main>
    );
}
