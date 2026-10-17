import { createContext, useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, Phone, Ticket, X } from "lucide-react";
import { restaurantAddress, eventDates } from "@/lib/karikalam";
import { CallToBookModal } from "@/components/CallToBookModal";

interface ReservationContextType {
  openReservation: (slot?: string) => void;
}

const ReservationContext = createContext<ReservationContextType>({
  openReservation: () => { },
});

export const useReservation = () => useContext(ReservationContext);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<string | undefined>(undefined);

  const openReservation = (slot?: string) => {
    setModalSlot(slot);
    setIsModalOpen(true);
  };

  return (
    <ReservationContext.Provider value={{ openReservation }}>
      {children}
      <CallToBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedSlot={modalSlot}
      />
    </ReservationContext.Provider>
  );
}

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link to="/" className={`brand ${inverse ? "brand-inverse" : ""}`} aria-label="Karikalam home">
      <img className="brand-logo" src="/logo.png" alt="Karikalam Logo" />
      <span className="brand-name-wrap">
        <span className="brand-name">KARIKALAM</span>
        <span className="brand-subtitle">TAMIL HERITAGE RESTAURANT</span>
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { openReservation } = useReservation();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_role");
    window.location.href = "/";
  };

  const authBlock = localStorage.getItem("auth_token") ? (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "13px", color: "var(--muted-ink)" }}>
        {localStorage.getItem("auth_role")?.toUpperCase()}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--maroon)",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Logout
      </button>
    </div>
  ) : null;

  return (
    <>
      <div className="topline">
        <span>KEDA VIRUNDHU · {eventDates.days}</span>
        <span className="topline-dot">✳</span>
        <span>KARIKALAM · BANGALORE</span>
      </div>
      <header className="site-header">
        <div className="nav-shell">
          <Brand />
          <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav className={`main-nav ${open ? "nav-open" : ""}`}>
            <Link to="/" onClick={close}>Home</Link>
            <Link to="/#about" onClick={close}>About Us</Link>
            <Link to="/#menu" onClick={close}>Our Menu</Link>
            <Link to="/#event" onClick={close}>Events</Link>
            <Link to="/keda-virundhu" onClick={close}>Keda Virundhu</Link>
            <div className="mobile-auth">{authBlock}</div>
            <Link className="btn-register-event mobile-book" to="/event-registration" onClick={close}>
              <Ticket size={14} /> REGISTER FOR EVENT
            </Link>
            <button
              type="button"
              className="btn-call-to-book mobile-book"
              style={{ width: "100%", justifyContent: "center", minHeight: "44px", margin: "8px 0" }}
              onClick={() => {
                close();
                openReservation();
              }}
            >
              <Phone size={14} /> CALL TO BOOK
            </button>
            <button className="mobile-book" type="button" onClick={() => { close(); openReservation(); }}>
              Reserve a Table <Phone size={15} />
            </button>
          </nav>
          <div className="nav-actions">
            <Link className="btn-register-event" to="/event-registration" title="Register for Keda Virundhu">
              <Ticket size={14} />
              <span>REGISTER FOR EVENT</span>
            </Link>
            <button
              type="button"
              className="btn-call-to-book"
              onClick={() => openReservation()}
              title="Call Karikalam to book a table"
            >
              <span className="phone-pulse"><Phone size={12} /></span>
              <span>CALL TO BOOK</span>
            </button>
            <div className="desktop-auth">{authBlock}</div>
          </div>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main wrap">
        <div className="footer-brand-col">
          <Brand inverse />
          <p>Honouring the flavours, stories and generous spirit of Tamil culinary heritage.</p>
          <div className="social-placeholders">
            <span>Instagram</span>
            <span>Facebook</span>
          </div>
        </div>
        <div className="footer-col">
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/#about">Our Story</Link>
          <Link to="/keda-virundhu">Keda Virundhu</Link>
        </div>
        <div className="footer-col">
          <h3>Visit Karikalam</h3>
          {restaurantAddress.map((line) => (
            <span key={line}>{line}</span>
          ))}
          <a href="tel:+916364667772">+91 6364-667772</a>
        </div>
        <div className="footer-col">
          <h3>Event</h3>
          <span>Keda Virundhu</span>
          <span>Date: {eventDates.range}</span>
          <span>Time: To be announced</span>
          <Link to="/keda-virundhu#menu">Explore the menu</Link>
        </div>
      </div>
      <div className="footer-bottom wrap">
        <span>© {new Date().getFullYear()} KARIKALAM. All rights reserved.</span>
        <div>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
        </div>
        <a className="footer-phone" href="tel:+916364667772">
          <Phone size={13} /> +91 6364-667772
        </a>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" })
      );
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="placeholder-page wrap">
      <span className="eyebrow">KARIKALAM · COMING SOON</span>
      <h1>{title}</h1>
      <p>This part of the Karikalam experience is being prepared. Continue exploring Keda Virundhu in the meantime.</p>
      <Link className="button button-maroon" to="/keda-virundhu">
        Discover Keda Virundhu <ArrowUpRight size={16} />
      </Link>
    </main>
  );
}
