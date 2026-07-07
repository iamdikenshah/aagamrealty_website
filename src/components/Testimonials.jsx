import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import { testimonials as fallbackTestimonials } from "../data/content";
import { isConfigured } from "../firebase/config";

// Normalise a testimonial from either source into one render shape.
// Firestore docs use { quote, rating, ... }; the bundled fallback uses { text }.
const normalise = (t) => ({
  name: t.name,
  role: t.role,
  text: t.text ?? t.quote ?? "",
  rating: Math.max(1, Math.min(5, Math.round(t.rating ?? 5))),
});

function Stars({ rating, ariaHidden }) {
  return (
    <span className="stars" aria-label={ariaHidden ? undefined : `${rating} out of 5 stars`}>
      {"★".repeat(rating)}
    </span>
  );
}

function TestimonialCard({ item, ariaHidden }) {
  return (
    <article className="testimonial-card" aria-hidden={ariaHidden || undefined}>
      <i className="fa-solid fa-quote-left quote-icon" aria-hidden="true" />
      <p className="testimonial-text">&ldquo;{item.text}&rdquo;</p>
      <div className="testimonial-author">
        <span className="name">{item.name}</span>
        <span className="role">{item.role}</span>
        <Stars rating={item.rating} ariaHidden={ariaHidden} />
      </div>
    </article>
  );
}

export default function Testimonials() {
  const [paused, setPaused] = useState(false);
  // Seed with the bundled testimonials so the marquee is never blank on first
  // paint; swap in the CMS-managed list once Firestore responds with any rows.
  const [items, setItems] = useState(() => fallbackTestimonials.map(normalise));

  useEffect(() => {
    if (!isConfigured) return;
    let active = true;
    // Loaded on demand (post-paint) so the Firestore SDK stays off the critical
    // bundle; the bundled list already renders until this resolves.
    import("../firebase/firestore")
      .then(({ fetchTestimonials }) => fetchTestimonials())
      .then((rows) => {
        if (active && rows.length) setItems(rows.map(normalise));
      })
      .catch((err) => console.error("[testimonials] Firestore read failed — using bundled list.", err));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <Reveal as="h2" className="section-heading">What Our Clients Say</Reveal>
        <Reveal as="p" className="section-subheading">
          Real experiences from families and investors who found their perfect match with Aagam
          Realty.
        </Reveal>
      </div>

      <div
        className={`marquee${paused ? " paused" : ""}`}
        id="marquee"
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div className="marquee-track" id="marqueeTrack">
          {/* Set 1 */}
          {items.map((item, i) => (
            <TestimonialCard key={`a-${item.name}-${i}`} item={item} />
          ))}
          {/* Set 2 — duplicate for a seamless loop */}
          {items.map((item, i) => (
            <TestimonialCard key={`b-${item.name}-${i}`} item={item} ariaHidden />
          ))}
        </div>
      </div>
    </section>
  );
}
