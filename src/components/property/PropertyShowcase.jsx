import { useEffect, useState } from "react";
import { Link } from "../../router.jsx";
import { getProperties } from "../../data/properties";
import PropertyCard from "./PropertyCard";

/**
 * A home-page section that pulls a small set of listings from the data layer and
 * renders them as a card grid, with a heading and a "View all" deep-link into the
 * full listing page. Used for the Featured (residential) and Commercial sections.
 *
 * @param {object}  props
 * @param {string}  props.id          Anchor id for the <section>.
 * @param {string}  props.eyebrow     Small label above the heading.
 * @param {string}  props.title       Section heading.
 * @param {string}  props.subtitle    Supporting line under the heading.
 * @param {object}  props.filter      Passed straight to getProperties().
 * @param {number}  [props.limit=3]   Max cards to show.
 * @param {string}  props.viewAllTo   Link target for the "View all" button.
 * @param {string}  [props.viewAllLabel="View all"]
 */
export default function PropertyShowcase({
  id, eyebrow, title, subtitle, filter, limit = 3, viewAllTo, viewAllLabel = "View all",
}) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let active = true;
    getProperties(filter).then((list) => {
      if (active) setItems(list.slice(0, limit));
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // Nothing to show (e.g. filter matched no records) — skip the section entirely.
  if (items && items.length === 0) return null;

  return (
    <section className="prop-showcase" id={id}>
      <div className="container">
        <div className="prop-showcase__head">
          <div>
            {eyebrow && <span className="prop-showcase__eyebrow">{eyebrow}</span>}
            <h2 className="prop-showcase__title">{title}</h2>
            {subtitle && <p className="prop-showcase__sub">{subtitle}</p>}
          </div>
          <Link to={viewAllTo} className="btn btn-outline prop-showcase__all">
            {viewAllLabel} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>

        {items === null ? (
          <div className="prop-showcase__grid" aria-hidden="true">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="prop-card-skeleton" />
            ))}
          </div>
        ) : (
          <div className="prop-showcase__grid">
            {items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}

        <Link to={viewAllTo} className="btn btn-primary prop-showcase__all-mobile">
          {viewAllLabel}
        </Link>
      </div>
    </section>
  );
}
