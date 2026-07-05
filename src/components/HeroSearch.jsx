import { useEffect, useState } from "react";
import { navigate } from "../router.jsx";
import {
  getFilterFacets,
  budgetBandsFor,
  CATEGORY_LABELS,
  TRANSACTION_LABELS,
} from "../data/properties";

// Transaction options change subtly by category: commercial adds Pre-Lease,
// residential leans on Rent/Buy. We show all three and let the data decide.
const CATEGORIES = ["residential", "commercial"];
const CATEGORY_ICONS = { residential: "fa-house-chimney", commercial: "fa-building" };
const TRANSACTIONS = ["rent", "buy", "pre-lease"];

/**
 * Modern hero search bar: pick a category (Residential/Commercial), a transaction
 * (Rent/Buy/Pre-Lease) and a locality, then deep-link into /properties with those
 * choices pre-applied as query params. Purely a navigation shortcut — all real
 * filtering happens on the listing page against the data layer.
 */
export default function HeroSearch() {
  const [category, setCategory] = useState("residential");
  const [transaction, setTransaction] = useState("buy");
  const [locality, setLocality] = useState("");
  const [budget, setBudget] = useState(""); // index into the current band list
  const [localities, setLocalities] = useState([]);

  useEffect(() => {
    getFilterFacets().then((f) => setLocalities(f.localities));
  }, []);

  // Budget bands differ by transaction (monthly vs sale) — reset on switch so a
  // stale rent band can't leak into a buy search.
  const bands = budgetBandsFor(transaction);
  const pickTransaction = (t) => {
    setTransaction(t);
    setBudget("");
  };

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("category", category);
    params.set("transaction", transaction);
    if (locality) params.set("locality", locality);
    if (budget !== "") {
      const band = bands[Number(budget)];
      if (band?.min != null) params.set("budgetMin", String(band.min));
      if (band?.max != null) params.set("budgetMax", String(band.max));
    }
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <form className="hero-search" onSubmit={search} aria-label="Search properties">
      <div className="hero-search__body">
        {/* Category segmented control + transaction pills on one bar */}
        <div className="hero-search__bar">
          <div className="hero-search__tabs" role="tablist" aria-label="Property category">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                className={`hero-search__tab${category === c ? " active" : ""}`}
                onClick={() => setCategory(c)}
              >
                <i className={`fa-solid ${CATEGORY_ICONS[c]}`} aria-hidden="true" />
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          <div className="hero-search__pills" role="group" aria-label="Looking to">
            {TRANSACTIONS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={transaction === t}
                className={`hero-search__pill${transaction === t ? " active" : ""}`}
                onClick={() => pickTransaction(t)}
              >
                {TRANSACTION_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Location + budget + submit */}
        <div className="hero-search__row">
          <div className="hero-search__field">
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            <select
              aria-label="Locality"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
            >
              <option value="">All localities in Ahmedabad</option>
              {localities.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="hero-search__field">
            <i className="fa-solid fa-indian-rupee-sign" aria-hidden="true" />
            <select
              aria-label="Budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            >
              <option value="">Any budget</option>
              {bands.map((b, i) => (
                <option key={b.label} value={i}>{b.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary hero-search__submit">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" /> Search
          </button>
        </div>
      </div>
    </form>
  );
}
