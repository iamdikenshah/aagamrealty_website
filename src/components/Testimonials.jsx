import { useState } from "react";
import Reveal from "./Reveal";
import { testimonials } from "../data/content";

function TestimonialCard({ item, ariaHidden }) {
  return (
    <article className="testimonial-card" aria-hidden={ariaHidden || undefined}>
      <i className="fa-solid fa-quote-left quote-icon" aria-hidden="true" />
      <p className="testimonial-text">&ldquo;{item.text}&rdquo;</p>
      <div className="testimonial-author">
        <span className="name">{item.name}</span>
        <span className="role">{item.role}</span>
        <span
          className="stars"
          aria-label={ariaHidden ? undefined : "5 out of 5 stars"}
        >
          ★★★★★
        </span>
      </div>
    </article>
  );
}

export default function Testimonials() {
  const [paused, setPaused] = useState(false);

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
          {testimonials.map((item) => (
            <TestimonialCard key={`a-${item.name}`} item={item} />
          ))}
          {/* Set 2 — duplicate for a seamless loop */}
          {testimonials.map((item) => (
            <TestimonialCard key={`b-${item.name}`} item={item} ariaHidden />
          ))}
        </div>
      </div>
    </section>
  );
}
