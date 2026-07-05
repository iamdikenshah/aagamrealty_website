import { Link } from "../../router.jsx";
import {
  LISTING_TYPE_LABELS,
  formatPriceRange,
  formatConfigSummary,
} from "../../data/properties";

/**
 * A single listing card for the properties grid. Whole card is a link to the
 * detail page. Fields that don't apply to a listing type are simply omitted.
 */
export default function PropertyCard({ property }) {
  const {
    id, images, title, locality, city, listingType, projectStage,
    propertyType, purchaseType,
  } = property;

  const hero = images?.[0];
  const configSummary = formatConfigSummary(property);
  // Show a stage tag only where it's meaningful (hidden for plain rentals/land
  // where it adds noise).
  const showStage = projectStage && listingType !== "rental" && listingType !== "land";

  return (
    <Link to={`/property/${id}`} className="prop-card" aria-label={`${title}, ${locality}`}>
      <div className="prop-card__media">
        {hero ? (
          <img src={hero} alt={title} loading="lazy" />
        ) : (
          <div className="prop-card__media-fallback" aria-hidden="true">
            <i className="fa-solid fa-building" />
          </div>
        )}
        <span className={`prop-badge prop-badge--${listingType}`}>
          {LISTING_TYPE_LABELS[listingType]}
        </span>
        {showStage && <span className="prop-card__stage">{projectStage}</span>}
      </div>

      <div className="prop-card__body">
        <h3 className="prop-card__title">{title}</h3>
        <p className="prop-card__loc">
          <i className="fa-solid fa-location-dot" aria-hidden="true" />
          {locality}, {city}
        </p>

        {configSummary && <p className="prop-card__config">{configSummary}</p>}

        <div className="prop-card__foot">
          <span className="prop-card__price">{formatPriceRange(property)}</span>
          <span className="prop-card__type">{purchaseType || propertyType}</span>
        </div>
      </div>
    </Link>
  );
}
