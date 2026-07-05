import Reveal from "./Reveal";
import { Link } from "../router.jsx";
import { dealCategories } from "../data/content";

export default function Services() {
  return (
    <section className="services" id="services">
      <div className="container">
        <Reveal as="h2" className="section-heading">What We Deal In</Reveal>
        <Reveal as="p" className="section-subheading">
          Residential or commercial — rent, buy, pre-lease or a plot. Pick a path and jump
          straight to matching listings.
        </Reveal>

        <div className="deal-grid">
          {dealCategories.map((cat) => (
            <Reveal as="article" className="deal-card" key={cat.key}>
              <i className={`fa-solid ${cat.icon} deal-card__watermark`} aria-hidden="true" />

              <div className="deal-card__head">
                <div className="deal-card__icon">
                  <i className={`fa-solid ${cat.icon}`} aria-hidden="true" />
                </div>
                <div>
                  <span className="deal-card__eyebrow">
                    {cat.key === "commercial" ? "For business & returns" : "For living & investing"}
                  </span>
                  <h3 className="deal-card__title">{cat.label}</h3>
                  <p className="deal-card__blurb">{cat.blurb}</p>
                </div>
              </div>

              <div className="deal-card__offerings">
                {cat.offerings.map((o) => (
                  <Link key={o.label} to={o.to} className="deal-offering">
                    <span className="deal-offering__icon">
                      <i className={`fa-solid ${o.icon}`} aria-hidden="true" />
                    </span>
                    <span className="deal-offering__label">{o.label}</span>
                    <i className="fa-solid fa-arrow-right deal-offering__arrow" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
