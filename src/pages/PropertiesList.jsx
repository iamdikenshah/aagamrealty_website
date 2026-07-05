import { useEffect, useMemo, useState } from "react";
import PropertyCard from "../components/property/PropertyCard";
import BudgetRange from "../components/property/BudgetRange";
import {
  getProperties,
  getFilterFacets,
  formatBudgetLabel,
  formatRupeesShort,
  CATEGORY_LABELS,
  TRANSACTION_LABELS,
  LISTING_TYPE_LABELS,
} from "../data/properties";

// Budget slider domains — rentals are ₹/month, everything else is a sale price.
const RENT_DOMAIN = { min: 0, max: 200000, step: 1000 };
const SALE_DOMAIN = { min: 0, max: 60000000, step: 100000 };

const CATEGORIES = ["residential", "commercial"];
const TRANSACTIONS = ["rent", "buy", "pre-lease"];

// Stage filtering only makes sense for buy / pre-lease style listings.
const stageApplies = (transactions) =>
  transactions.length === 0 || transactions.some((t) => t === "buy" || t === "pre-lease");

const EMPTY_FILTERS = {
  categories: [],
  transactions: [],
  listingTypes: [],
  configs: [],
  localities: [],
  stages: [],
  budgetMin: null,
  budgetMax: null,
};

// Seed the initial filter state from the URL
// (?category=&transaction=&locality=&budgetMin=&budgetMax=), so deep-links from
// the hero search / home showcase / footer land pre-filtered.
function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const pick = (key) => {
    const v = params.get(key);
    return v ? [v] : [];
  };
  const num = (key) => {
    const v = params.get(key);
    return v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;
  };
  return {
    ...EMPTY_FILTERS,
    categories: pick("category"),
    transactions: pick("transaction"),
    listingTypes: pick("listingType"),
    localities: pick("locality"),
    budgetMin: num("budgetMin"),
    budgetMax: num("budgetMax"),
  };
}

export default function PropertiesList() {
  const [facets, setFacets] = useState(null);
  const [filters, setFilters] = useState(readFiltersFromUrl);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load filter options once.
  useEffect(() => {
    getFilterFacets().then(setFacets);
  }, []);

  // Re-query whenever filters change (client-side against the data module).
  useEffect(() => {
    let active = true;
    setLoading(true);
    getProperties(filters).then((list) => {
      if (active) {
        setResults(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [filters]);

  const toggle = (key, value) => {
    setFilters((prev) => {
      const set = new Set(prev[key]);
      set.has(value) ? set.delete(value) : set.add(value);
      const next = { ...prev, [key]: [...set] };
      // Changing the transaction shifts the budget domain (₹/month vs sale) and
      // stage relevance — clear both so a stale value can't linger.
      if (key === "transactions") {
        if (!stageApplies(next.transactions)) next.stages = [];
        next.budgetMin = null;
        next.budgetMax = null;
      }
      return next;
    });
  };

  // Budget is a scalar min/max pair (in rupees), driven by the range slider.
  const setBudget = ({ budgetMin, budgetMax }) =>
    setFilters((prev) => ({ ...prev, budgetMin, budgetMax }));
  const clearBudget = () => setFilters((prev) => ({ ...prev, budgetMin: null, budgetMax: null }));

  const clearAll = () => setFilters(EMPTY_FILTERS);

  const showStageFilter = stageApplies(filters.transactions);
  // A ₹/month suffix only makes sense when the view is scoped to rentals.
  const budgetPerMonth =
    filters.transactions.length === 1 && filters.transactions[0] === "rent";

  // Flatten active filters into removable chips.
  const chips = useMemo(() => {
    const list = [];
    filters.categories.forEach((v) =>
      list.push({ key: "categories", value: v, label: CATEGORY_LABELS[v] })
    );
    filters.transactions.forEach((v) =>
      list.push({ key: "transactions", value: v, label: TRANSACTION_LABELS[v] })
    );
    filters.listingTypes.forEach((v) =>
      list.push({ key: "listingTypes", value: v, label: LISTING_TYPE_LABELS[v] })
    );
    filters.configs.forEach((v) => list.push({ key: "configs", value: v, label: v }));
    filters.localities.forEach((v) => list.push({ key: "localities", value: v, label: v }));
    filters.stages.forEach((v) => list.push({ key: "stages", value: v, label: v }));
    if (filters.budgetMin != null || filters.budgetMax != null) {
      list.push({
        key: "budget",
        value: "budget",
        label: formatBudgetLabel(filters.budgetMin, filters.budgetMax, budgetPerMonth),
      });
    }
    return list;
  }, [filters, budgetPerMonth]);

  const filterPanel = facets && (
    <div className="prop-filters" role="group" aria-label="Filter properties">
      <FilterGroup title="Category">
        {CATEGORIES.map((c) => (
          <CheckRow
            key={c}
            label={CATEGORY_LABELS[c]}
            checked={filters.categories.includes(c)}
            onChange={() => toggle("categories", c)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Looking to">
        {TRANSACTIONS.map((t) => (
          <CheckRow
            key={t}
            label={TRANSACTION_LABELS[t]}
            checked={filters.transactions.includes(t)}
            onChange={() => toggle("transactions", t)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={`Budget${budgetPerMonth ? " (₹/month)" : ""}`}>
        <BudgetRange
          {...(budgetPerMonth ? RENT_DOMAIN : SALE_DOMAIN)}
          valueMin={filters.budgetMin}
          valueMax={filters.budgetMax}
          onChange={setBudget}
          format={formatRupeesShort}
        />
      </FilterGroup>

      <FilterGroup title="Configuration">
        {facets.configs.map((c) => (
          <CheckRow
            key={c}
            label={c}
            checked={filters.configs.includes(c)}
            onChange={() => toggle("configs", c)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Locality">
        {facets.localities.map((l) => (
          <CheckRow
            key={l}
            label={l}
            checked={filters.localities.includes(l)}
            onChange={() => toggle("localities", l)}
          />
        ))}
      </FilterGroup>

      {showStageFilter && (
        <FilterGroup title="Project stage">
          {facets.stages.map((s) => (
            <CheckRow
              key={s}
              label={s}
              checked={filters.stages.includes(s)}
              onChange={() => toggle("stages", s)}
            />
          ))}
        </FilterGroup>
      )}
    </div>
  );

  return (
    <section className="prop-listing">
      <div className="container">
        <header className="prop-listing__head">
          <div>
            <h1 className="prop-listing__title">Properties in Ahmedabad</h1>
            <p className="prop-listing__sub">
              Rentals, resale &amp; new-launch homes, pre-leased offices and plots — all in one place.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline prop-listing__filter-toggle"
            onClick={() => setDrawerOpen(true)}
          >
            <i className="fa-solid fa-sliders" aria-hidden="true" /> Filters
            {chips.length > 0 && <span className="prop-listing__filter-count">{chips.length}</span>}
          </button>
        </header>

        {chips.length > 0 && (
          <div className="prop-chips" aria-label="Applied filters">
            {chips.map((chip) => (
              <button
                key={`${chip.key}-${chip.value}`}
                type="button"
                className="prop-chip"
                onClick={() => (chip.key === "budget" ? clearBudget() : toggle(chip.key, chip.value))}
              >
                {chip.label}
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="prop-chip prop-chip--clear" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}

        <div className="prop-listing__layout">
          {/* Desktop sidebar */}
          <aside className="prop-listing__sidebar">{filterPanel}</aside>

          {/* Results */}
          <div className="prop-listing__results">
            <p className="prop-listing__count">
              {loading ? "Loading…" : `${results.length} ${results.length === 1 ? "property" : "properties"}`}
            </p>

            {!loading && results.length === 0 ? (
              <div className="prop-empty">
                <i className="fa-solid fa-house-circle-xmark" aria-hidden="true" />
                <h3>No properties match your filters</h3>
                <p>Try removing a filter or two to see more options.</p>
                <button type="button" className="btn btn-primary" onClick={clearAll}>
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="prop-grid">
                {results.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div className={`prop-drawer${drawerOpen ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="Filters">
        <div className="prop-drawer__backdrop" onClick={() => setDrawerOpen(false)} />
        <div className="prop-drawer__panel">
          <div className="prop-drawer__head">
            <h2>Filters</h2>
            <button type="button" aria-label="Close filters" onClick={() => setDrawerOpen(false)}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
          {filterPanel}
          <div className="prop-drawer__foot">
            <button type="button" className="btn btn-outline" onClick={clearAll}>Clear</button>
            <button type="button" className="btn btn-primary" onClick={() => setDrawerOpen(false)}>
              Show {results.length} results
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="prop-filter-group">
      <h4 className="prop-filter-group__title">{title}</h4>
      <div className="prop-filter-group__body">{children}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="prop-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
