import Reveal from "./Reveal";

export default function About() {
  return (
    <section className="about" id="about">
      <div className="container">
        <div className="about-grid">
          <Reveal className="about-text">
            <h2>About Aagam Realty</h2>
            <p>
              Aagam Realty was founded with a simple yet powerful vision — to{" "}
              <strong>simplify real estate</strong> for everyone. What began as one individual's
              passion for helping people find the right home has grown into a trusted name built on
              relationships, not just transactions.
            </p>
            <p>
              With <strong>9+ years of hands-on experience</strong> in the field, we specialize in{" "}
              <strong>rentals, owned properties, pre-lease investments, and land &amp; plots</strong>.
              Whether you're a first-time renter, a growing family, or a seasoned investor, we bring
              the same dedication to every deal.
            </p>
            <p>
              Our foundation rests on{" "}
              <strong>transparency, trust, and genuine client satisfaction</strong>. No hidden
              charges, no jargon, no pressure — just honest advice and properties that truly fit your
              needs.
            </p>
          </Reveal>

          <Reveal as="aside" className="vision-box">
            <div className="vision-icon">
              <i className="fa-solid fa-bullseye" aria-hidden="true" />
            </div>
            <h3>Our Vision</h3>
            <p>
              To make every property dealing{" "}
              <strong>stress-free, transparent, and accessible</strong> for everyone. We believe
              finding the right space should feel exciting — not overwhelming. Our goal is to guide
              each client with clarity and care, turning big decisions into confident moves.
            </p>
          </Reveal>
        </div>

        <Reveal className="value-pills">
          <span className="pill">
            <i className="fa-solid fa-award" aria-hidden="true" /> Trusted Expertise
          </span>
          <span className="pill">
            <i className="fa-solid fa-handshake" aria-hidden="true" /> Transparent Deals
          </span>
          <span className="pill">
            <i className="fa-solid fa-user-check" aria-hidden="true" /> Client-First Approach
          </span>
        </Reveal>
      </div>
    </section>
  );
}
