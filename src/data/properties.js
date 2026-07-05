// =============================================================================
// PROPERTY DATA ACCESS LAYER
// =============================================================================
// This is the ONLY module that touches the raw listing data. The raw records
// live in ./properties.json (one flat array); the listing and detail pages call
// getProperties()/getPropertyById() and never import that JSON directly. When the
// WordPress CMS is ready, replace the bodies of those two functions with a
// fetch() to the REST/GraphQL endpoint (mapping the response into the same shape
// as the JSON) — nothing else in the app needs to change.
//
// Both getters are async on purpose so the CMS swap is a drop-in: the pages
// already handle loading state and await the result.
//
// Taxonomy (mirrors how listings are organised on the site):
//   category    — "residential" | "commercial"        (top-level split)
//   transaction — "rent" | "buy" | "pre-lease"         (what you can do with it)
//   listingType — "rental" | "owned" | "pre-lease" | "land"  (card badge / accent)
// =============================================================================

import PROPERTIES from "./properties.json";

/**
 * @typedef {"residential" | "commercial"} Category
 * @typedef {"rent" | "buy" | "pre-lease"} Transaction
 * @typedef {"rental" | "owned" | "pre-lease" | "land"} ListingType
 */

// --- Small helper: simulate async so the CMS swap is a drop-in ---------------
const asAsync = (value) => Promise.resolve(value);

// -----------------------------------------------------------------------------
// PUBLIC API — the only functions the rest of the app should call.
// -----------------------------------------------------------------------------

/**
 * Return listings, optionally narrowed by filters. All filtering is done here so
 * the pages stay dumb; when the CMS lands, translate `filters` into query params
 * and replace the body with a fetch().
 *
 * @param {object} [filters]
 * @param {Category[]}    [filters.categories]     e.g. ["residential"]
 * @param {Transaction[]} [filters.transactions]   e.g. ["rent","buy"]
 * @param {ListingType[]} [filters.listingTypes]  e.g. ["rental","land"]
 * @param {string[]}      [filters.configs]        BHK/plot labels, matched loosely
 * @param {string[]}      [filters.localities]
 * @param {string[]}      [filters.stages]         project stages
 * @param {number}        [filters.budgetMin]      absolute ₹ (rent = ₹/month)
 * @param {number}        [filters.budgetMax]      absolute ₹ (rent = ₹/month)
 * @param {boolean}       [filters.featured]       only listings flagged featured
 * @returns {Promise<object[]>}
 */
export async function getProperties(filters = {}) {
  const {
    categories, transactions, listingTypes, configs, localities, stages,
    budgetMin, budgetMax, featured,
  } = filters;

  const results = PROPERTIES.filter((p) => {
    if (categories?.length && !categories.includes(p.category)) return false;
    if (transactions?.length && !transactions.includes(p.transaction)) return false;
    if (listingTypes?.length && !listingTypes.includes(p.listingType)) return false;
    if (localities?.length && !localities.includes(p.locality)) return false;
    if (stages?.length && !(p.projectStage && stages.includes(p.projectStage))) return false;
    if (featured && !p.featured) return false;

    if (configs?.length) {
      const hasConfig = p.configurations?.some((c) =>
        configs.some((wanted) => c.config.toLowerCase().includes(wanted.toLowerCase()))
      );
      if (!hasConfig) return false;
    }

    // Budget is compared in absolute rupees so mixed display units (Cr / Lac /
    // per-month) all sit on one axis. We test for overlap with the listing's own
    // rupee range. Rentals are ₹/month, sales are the total price — pairing a
    // budget with a transaction (as the hero search does) keeps the two apart.
    if (budgetMin != null || budgetMax != null) {
      const { min, max } = listingRupeeRange(p);
      if (budgetMin != null && max < budgetMin) return false;
      if (budgetMax != null && min > budgetMax) return false;
    }

    return true;
  });

  return asAsync(results);
}

/**
 * Return a single listing by id, or null if not found.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getPropertyById(id) {
  return asAsync(PROPERTIES.find((p) => p.id === id) ?? null);
}

/**
 * Distinct filter options derived from the current dataset. Useful for building
 * filter controls without hard-coding values (also CMS-friendly).
 * @returns {Promise<{listingTypes:string[], localities:string[], stages:string[], configs:string[]}>}
 */
export async function getFilterFacets() {
  const localities = [...new Set(PROPERTIES.map((p) => p.locality))].sort();
  const stages = [...new Set(PROPERTIES.map((p) => p.projectStage).filter(Boolean))];
  const configs = [
    ...new Set(
      PROPERTIES.flatMap((p) => p.configurations?.map((c) => c.config) ?? [])
    ),
  ];
  return asAsync({
    categories: ["residential", "commercial"],
    transactions: ["rent", "buy", "pre-lease"],
    listingTypes: ["rental", "owned", "pre-lease", "land"],
    localities,
    stages,
    configs,
  });
}

// --- Presentation helpers (pure, no data access) -----------------------------

/**
 * Map an amenity label to a Font Awesome icon class (Font Awesome is already
 * loaded site-wide via CDN). Falls back to a generic check icon.
 */
const AMENITY_ICONS = [
  [/pool/i, "fa-person-swimming"],
  [/club/i, "fa-champagne-glasses"],
  [/gym/i, "fa-dumbbell"],
  [/garden|landscap|green|common area/i, "fa-tree"],
  [/kids|play/i, "fa-child-reaching"],
  [/indoor/i, "fa-table-tennis-paddle-ball"],
  [/jog|track/i, "fa-person-running"],
  [/yoga|amphi/i, "fa-spa"],
  [/power|backup/i, "fa-plug-circle-bolt"],
  [/security/i, "fa-shield-halved"],
  [/parking/i, "fa-square-parking"],
  [/lift|elevator/i, "fa-elevator"],
  [/cctv|surveil/i, "fa-video"],
  [/cafe|cafeteria/i, "fa-mug-hot"],
  [/kitchen/i, "fa-kitchen-set"],
  [/terrace|deck/i, "fa-umbrella-beach"],
  [/road|drainage|street|gate|entrance/i, "fa-road"],
  [/water/i, "fa-faucet"],
];

export function amenityIcon(label) {
  const match = AMENITY_ICONS.find(([re]) => re.test(label));
  return match ? match[1] : "fa-circle-check";
}

/** Human label for a listingType (used for the card badge / accent). */
export const LISTING_TYPE_LABELS = {
  rental: "Rental",
  owned: "For Sale",
  "pre-lease": "Pre-Leased",
  land: "Land / Plot",
};

/** Top-level category labels. */
export const CATEGORY_LABELS = {
  residential: "Residential",
  commercial: "Commercial",
};

/** Transaction (what you can do with the property) labels. */
export const TRANSACTION_LABELS = {
  rent: "Rent",
  buy: "Buy",
  "pre-lease": "Pre-Lease",
};

// --- Money helpers (canonical rupees) ----------------------------------------

const CRORE = 10000000; // 1 Cr = ₹1,00,00,000
const LAKH = 100000; // 1 Lac = ₹1,00,000

/** Convert a display value + unit into an absolute rupee amount. */
export function priceToRupees(value, unit) {
  if (unit === "Cr") return value * CRORE;
  if (unit === "Lac") return value * LAKH;
  return value; // "per month" / "per sqft" are already in rupees
}

/** A listing's price range expressed in absolute rupees. */
export function listingRupeeRange(p) {
  return {
    min: priceToRupees(p.priceMin, p.priceUnit),
    max: priceToRupees(p.priceMax ?? p.priceMin, p.priceUnit),
  };
}

/** Compact rupee label, auto-picking Cr / Lac / grouped (e.g. 31500000 -> "₹3.15 Cr"). */
export function formatRupeesShort(n) {
  if (n == null) return "";
  if (n >= CRORE) return `₹${+(n / CRORE).toFixed(2)} Cr`;
  if (n >= LAKH) return `₹${+(n / LAKH).toFixed(2)} Lac`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Human label for a budget range (open-ended on either side). */
export function formatBudgetLabel(min, max, perMonth = false) {
  const suffix = perMonth ? "/mo" : "";
  if (min != null && max != null) return `${formatRupeesShort(min)} – ${formatRupeesShort(max)}${suffix}`;
  if (max != null) return `Up to ${formatRupeesShort(max)}${suffix}`;
  if (min != null) return `${formatRupeesShort(min)}+${suffix}`;
  return "Any budget";
}

// Budget bands (in rupees) for the hero search dropdown. Rentals use monthly
// bands; buy & pre-lease share the sale-price bands. Derived to comfortably
// cover the current dataset (₹24k–₹1.85L/mo rents, ₹85 Lac–₹5.9 Cr sales).
const RENT_BANDS = [
  { label: "Up to ₹25,000/mo", min: null, max: 25000 },
  { label: "₹25,000 – ₹50,000/mo", min: 25000, max: 50000 },
  { label: "₹50,000 – ₹1 Lac/mo", min: 50000, max: 100000 },
  { label: "Above ₹1 Lac/mo", min: 100000, max: null },
];
const SALE_BANDS = [
  { label: "Under ₹1 Cr", min: null, max: CRORE },
  { label: "₹1 – 3 Cr", min: CRORE, max: 3 * CRORE },
  { label: "₹3 – 5 Cr", min: 3 * CRORE, max: 5 * CRORE },
  { label: "Above ₹5 Cr", min: 5 * CRORE, max: null },
];

/** Budget bands appropriate for a given transaction. */
export function budgetBandsFor(transaction) {
  return transaction === "rent" ? RENT_BANDS : SALE_BANDS;
}

/** Indian-style number grouping (e.g. 185000 -> "1,85,000"). */
function groupIndian(n) {
  return n.toLocaleString("en-IN");
}

/**
 * Format a listing's headline price / price range for display.
 * Handles Cr/Lac (values are already in those units) and monthly/sqft rates.
 * @param {object} p
 * @returns {string}
 */
export function formatPriceRange(p) {
  const { priceMin, priceMax, priceUnit } = p;
  const isRange = priceMax != null && priceMax !== priceMin;

  if (priceUnit === "per month") {
    return isRange
      ? `₹${groupIndian(priceMin)} – ₹${groupIndian(priceMax)}/mo`
      : `₹${groupIndian(priceMin)}/mo`;
  }
  if (priceUnit === "per sqft") {
    return `₹${groupIndian(priceMin)}/sqft`;
  }
  // Cr / Lac — values are already expressed in that unit.
  return isRange
    ? `₹${priceMin} – ${priceMax} ${priceUnit}`
    : `₹${priceMin} ${priceUnit}`;
}

/** Format a single configuration/variant price. */
export function formatConfigPrice(config, p) {
  if (p.priceUnit === "per month") return `₹${groupIndian(config.price)}/mo`;
  if (p.priceUnit === "per sqft") return `₹${groupIndian(config.price)}/sqft`;
  return `₹${config.price} ${p.priceUnit}`;
}

/**
 * Short "3 BHK · 2450–3620 sqft" style summary for cards.
 * @param {object} p
 * @returns {string}
 */
export function formatConfigSummary(p) {
  const configs = p.configurations ?? [];
  if (!configs.length) return "";
  const labels = [...new Set(configs.map((c) => c.config))].join(", ");
  const areas = configs.map((c) => c.superBuiltupArea).filter(Boolean);
  const unit = configs[0].areaUnit || "sqft";
  if (!areas.length) return labels;
  const min = Math.min(...areas);
  const max = Math.max(...areas);
  const areaStr = min === max ? `${groupIndian(min)} ${unit}` : `${groupIndian(min)}–${groupIndian(max)} ${unit}`;
  return `${labels} · ${areaStr}`;
}
