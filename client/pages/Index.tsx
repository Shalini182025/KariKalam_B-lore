import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Utensils,
  X,
} from "lucide-react";
import { menuSections, restaurantAddress, eventDates } from "@/lib/karikalam";
import { SiteLayout, useReservation } from "@/components/SiteLayout";

const heroImage = "/standee-orange.png";

export default function Index() {
  const { openReservation } = useReservation();
  const [selectedMenu, setSelectedMenu] = useState<
    (typeof menuSections)[number] | null
  >(null);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLAnchorElement>(".food-card");
    const showDishes = (event: MouseEvent) => {
      event.preventDefault();
      const card = event.currentTarget as HTMLAnchorElement;
      const title = card.querySelector("h3")?.textContent;
      setSelectedMenu(
        menuSections.find((section) => section.title === title) ?? null,
      );
    };

    cards.forEach((card) => card.addEventListener("click", showDishes));
    return () =>
      cards.forEach((card) => card.removeEventListener("click", showDishes));
  }, []);

  return (
    <SiteLayout>
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" /> TAMIL HERITAGE RESTAURANT
            </span>
            <h1>
              Tradition on
              <br />
              every plate.
              <br />
              <em>Warmth in every welcome.</em>
            </h1>
            <p className="hero-description">
              Karikalam brings the richness of Tamil culinary heritage to
              Bengaluru, with soulful flavours and generous hospitality.
            </p>
            <div className="hero-meta">
              <span>
                <Utensils size={16} /> AUTHENTIC TAMIL CUISINE
              </span>
              <span>
                <MapPin size={16} /> CHOODASANDRA, BENGALURU
              </span>
            </div>
            <div className="hero-buttons">
              <a className="button button-maroon" href="#menu">
                Explore Our Menu <ArrowDown size={17} />
              </a>
              <button
                type="button"
                className="button"
                style={{
                  background: "#173d2b",
                  color: "#ffffff",
                  borderRadius: "9999px",
                  padding: "0 22px",
                }}
                onClick={() => openReservation()}
              >
                <Phone size={15} /> Reserve via Call <ArrowRight size={15} />
              </button>
            </div>
            <div className="hero-note">
              <span className="note-rule" /> A TABLE ROOTED IN TAMIL TRADITION
            </div>
          </div>
          <div className="hero-visual">
            <img
              src={heroImage}
              alt="A traditional Tamil feast served on a banana leaf"
            />
            <div className="hero-visual-shade" />
            <div className="hero-stamp">
              <span>THE</span>
              <strong>
                TAMIL
                <br />
                TABLE
              </strong>
              <i>✤</i>
            </div>
            <div className="hero-image-caption">
              <span>AN EXPERIENCE TO SAVOUR</span>
              <b>Karikalam · Tamil Heritage Restaurant</b>
            </div>
            <div className="hero-vertical">
              ROOTED IN HERITAGE · SERVED WITH HEART
            </div>
          </div>
          <div className="hero-scroll">
            <ArrowDown size={14} /> SCROLL TO DISCOVER
          </div>
        </section>
        <section className="announcement-band">
          <div className="announcement-icon">✤</div>
          <p>
            <b>Featured event.</b> Keda Virundhu — {eventDates.days}.
          </p>
          <Link to="/keda-virundhu">
            Discover the event <ArrowRight size={15} />
          </Link>
        </section>
        <section className="intro-section section-pad" id="about">
          <div className="intro-image-wrap">
            <img
              src="/dishes/dish_16.jpg"
              alt="Authentic Karikalam Tamil dish preparation"
            />
            <span className="image-index">
              01 <i>/</i> KARIKALAM
            </span>
            <div className="intro-seal">
              ✤<br />
              <span>Tradition</span>
            </div>
          </div>
          <div className="intro-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" /> OUR TABLE, OUR HERITAGE
            </span>
            <h2>
              Rooted in Tradition.
              <br />
              <em>Served with Passion.</em>
            </h2>
            <p>
              Karikalam brings the essence of Tamil culinary heritage to your
              table, celebrating traditional flavours and memorable dining
              experiences.
            </p>
            <p className="intro-small">
              Every gathering begins with a generous welcome, recipes shaped by
              memory, and the joy of sharing a meal together.
            </p>
            <a className="text-button" href="#visit">
              Visit Karikalam <ArrowRight size={16} />
            </a>
          </div>
        </section>
        <section className="menu-preview section-pad" id="menu">
          <div className="center-heading">
            <span className="eyebrow">FROM OUR KITCHEN</span>
            <h2>
              Flavours worth
              <br />
              <em>gathering around.</em>
            </h2>
            <p>
              From comforting classics to bold Tamil favourites, every dish is
              prepared to be shared.
            </p>
          </div>
          <div className="food-grid">
            {menuSections.slice(0, 5).map((section, index) => (
              <a
                href="#visit"
                className={`food-card food-card-${index + 1}`}
                key={section.title}
              >
                <img
                  src={section.image}
                  alt={`${section.title} food selection`}
                />
                <span className="food-card-overlay" />
                <span className="food-card-number">0{index + 1}</span>
                <div className="food-card-copy">
                  <span>KARIKALAM FAVOURITES</span>
                  <h3>{section.title}</h3>
                  <div className="food-card-items">
                    {section.items.slice(0, 3).join(" · ")}
                  </div>
                  <span className="food-explore">
                    PLAN YOUR VISIT <ArrowRight size={14} />
                  </span>
                </div>
              </a>
            ))}
          </div>
          <div className="menu-link-wrap">
            <button
              type="button"
              className="button button-outline"
              onClick={() => openReservation()}
            >
              Reserve a table <Phone size={16} />
            </button>
          </div>
        </section>
        <section className="event-feature section-pad" id="event">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" /> FEATURED EVENT
              </span>
              <h2>
                A gathering of
                <br />
                <em>generous flavours.</em>
              </h2>
            </div>
            <Link className="text-button" to="/keda-virundhu">
              Discover the event <ArrowRight size={16} />
            </Link>
          </div>
          <div className="feature-card">
            <div className="feature-image">
              <img
                src={heroImage}
                alt="Traditional Tamil feast arranged on a banana leaf"
              />
              <span className="feature-tag">KARIKALAM PRESENTS</span>
            </div>
            <div className="feature-content">
              <span className="eyebrow">A TAMIL CULINARY CELEBRATION</span>
              <h3>
                Keda
                <br />
                <em>Virundhu</em>
              </h3>
              <p>
                Our signature celebration brings together Tamil specialities,
                traditional banana-leaf dining and the spirit of a generous
                shared table.
              </p>
              <div className="feature-details">
                <div>
                  <CalendarDays size={17} />
                  <span>
                    <small>DATE</small>
                    {eventDates.range}
                  </span>
                </div>
                <div>
                  <Clock size={17} />
                  <span>
                    <small>DINING SLOTS</small>Six batches, 11 AM – 11 PM
                  </span>
                </div>
                <div>
                  <MapPin size={17} />
                  <span>
                    <small>LOCATION</small>Karikalam, Choodasandra
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                }}
              >
                <Link className="button button-maroon" to="/keda-virundhu">
                  Explore Keda Virundhu <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="values-section section-pad">
          <div className="center-heading">
            <span className="eyebrow">THE KARIKALAM PROMISE</span>
            <h2>
              More than a meal.
              <br />
              <em>A sense of belonging.</em>
            </h2>
          </div>
          <div className="values-grid">
            <article>
              <span className="value-icon">✤</span>
              <span className="value-number">01</span>
              <h3>
                Authentic Tamil
                <br />
                Culinary Heritage
              </h3>
              <p>
                Flavours inspired by tradition and the richness of Tamil
                cuisine.
              </p>
            </article>
            <article>
              <span className="value-icon">✦</span>
              <span className="value-number">02</span>
              <h3>
                Traditional Banana
                <br />
                Leaf Serving
              </h3>
              <p>A time-honoured way to gather around a generous feast.</p>
            </article>
            <article>
              <span className="value-icon">✺</span>
              <span className="value-number">03</span>
              <h3>
                A Curated Culinary
                <br />
                Experience
              </h3>
              <p>Thoughtfully prepared for a memorable occasion.</p>
            </article>
            <article>
              <span className="value-icon">✤</span>
              <span className="value-number">04</span>
              <h3>
                Warm Restaurant
                <br />
                Hospitality
              </h3>
              <p>Service that makes every guest feel welcomed home.</p>
            </article>
          </div>
        </section>
        <section className="steps-section section-pad">
          <div className="steps-title">
            <span className="eyebrow">DINE WITH US</span>
            <h2>
              A warm table,
              <br />
              <em>waiting for you.</em>
            </h2>
            <p>
              Bring your family, friends, and appetite. We will take care of the
              welcome.
            </p>
          </div>
          <div className="steps-list">
            <div>
              <span>01</span>
              <p>Explore our flavours</p>
              <ArrowRight size={17} />
            </div>
            <div>
              <span>02</span>
              <p>Call to reserve your table</p>
              <ArrowRight size={17} />
            </div>
            <div>
              <span>03</span>
              <p>Arrive at Karikalam</p>
              <ArrowRight size={17} />
            </div>
            <div>
              <span>04</span>
              <p>Share a memorable meal</p>
              <ArrowRight size={17} />
            </div>
          </div>
        </section>
      <section className="location-section section-pad" id="visit">
        <div className="location-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" /> COME TO OUR TABLE
            </span>
            <h2>
              Find your way
              <br />
              <em>to Karikalam.</em>
            </h2>
            <p className="location-name">KARIKALAM RESTAURANT</p>
            <address>
              {restaurantAddress.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
            <a className="location-phone" href="tel:+916364667772">
              +91 6364-667772 <ArrowUpRight size={15} />
            </a>
          <a
            href="https://www.google.com/maps/place/Kari+Kalam/@12.8791884,77.6730884,17z/data=!4m14!1m7!3m6!1s0x3bae6d001d4c2aa5:0xf3cc561195f02cd4!2sKari+Kalam!8m2!3d12.8791884!4d77.6730884!16s%2Fg%2F11zxjgqc93!3m5!1s0x3bae6d001d4c2aa5:0xf3cc561195f02cd4!8m2!3d12.8791884!4d77.6730884!16s%2Fg%2F11zxjgqc93?entry=ttu"
              target="_blank"
              rel="noreferrer"
              className="text-button"
            >
            Open in Google Maps <ArrowRight size={16} />
          </a>
        </div>
        <div className="location-map">
          <iframe
            title="Karikalam Restaurant location"
            src="https://www.google.com/maps?q=12.8791884,77.6730884&z=17&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>
        <section className="closing-cta">
          <div className="cta-pattern" />
          <div className="closing-content">
            <span className="eyebrow">A PLACE IS BEING SET FOR YOU</span>
            <h2>
              Come hungry.
              <br />
              <em>Leave with a story.</em>
            </h2>
            <p>Join us at Karikalam for a true taste of Tamil hospitality.</p>
            <button
              type="button"
              className="button button-ivory"
              onClick={() => openReservation()}
            >
              Reserve via Call <Phone size={16} />
            </button>
          </div>
          <div className="cta-ornament">✤</div>
        </section>
        {selectedMenu && (
          <div
            className="menu-modal-backdrop"
            role="presentation"
            onMouseDown={() => setSelectedMenu(null)}
          >
            <section
              className="menu-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="menu-modal-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="menu-modal-close"
                aria-label="Close dish list"
                onClick={() => setSelectedMenu(null)}
              >
                <X size={20} />
              </button>
              <img src={selectedMenu.image} alt="" />
              <div className="menu-modal-content">
                <span className="eyebrow">KARIKALAM FAVOURITES</span>
                <h2 id="menu-modal-title">{selectedMenu.title}</h2>
                <p>Our dishes in this selection</p>
                <ul>
                  {selectedMenu.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}
      </main>
    </SiteLayout>
  );
}
