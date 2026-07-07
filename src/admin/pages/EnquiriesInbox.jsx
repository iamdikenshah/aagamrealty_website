import { useEffect, useMemo, useState } from "react";
import { getEnquiries, markEnquiryHandled } from "../../firebase/firestore";

const STATUSES = ["new", "contacted", "closed"];

// Firestore Timestamp | Date | undefined → readable string.
function formatDate(ts) {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
  if (!d) return "";
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function EnquiriesInbox() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = () => {
    getEnquiries()
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load enquiries."));
  };

  useEffect(load, []);

  const counts = useMemo(() => {
    const c = { all: items?.length || 0, new: 0, contacted: 0, closed: 0 };
    (items || []).forEach((e) => { c[e.status] = (c[e.status] || 0) + 1; });
    return c;
  }, [items]);

  const visible = useMemo(
    () => (items || []).filter((e) => filter === "all" || e.status === filter),
    [items, filter]
  );

  const setStatus = async (item, status) => {
    // Optimistic update, then persist.
    setItems((list) => list.map((e) => (e.id === item.id ? { ...e, status } : e)));
    try {
      await markEnquiryHandled(item.id, status);
    } catch (err) {
      alert(`Could not update: ${err.message || err}`);
      load();
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-h1">Enquiries</h1>
      </div>

      <div className="admin-filters">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            className={`admin-chip${filter === s ? " is-active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s} <span className="admin-chip__count">{counts[s] || 0}</span>
          </button>
        ))}
      </div>

      {error && <p className="admin-error">{error}</p>}
      {!items && !error && <p className="admin-muted">Loading…</p>}
      {items && visible.length === 0 && <p className="admin-muted">No enquiries here.</p>}

      <div className="admin-cards">
        {visible.map((e) => (
          <article key={e.id} className="admin-card">
            <header className="admin-card__head">
              <div>
                <strong>{e.name || "—"}</strong>
                <span className="admin-muted"> · {formatDate(e.createdAt)}</span>
              </div>
              <span className={`admin-badge admin-badge--${e.status}`}>{e.status}</span>
            </header>

            <div className="admin-card__contact">
              {e.phone && <a href={`tel:${e.phone}`}><i className="fa-solid fa-phone" aria-hidden="true" /> {e.phone}</a>}
              {e.email && <a href={`mailto:${e.email}`}><i className="fa-solid fa-envelope" aria-hidden="true" /> {e.email}</a>}
              {e.propertyId && (
                <a href={`/property/${e.propertyId}`} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-building" aria-hidden="true" /> {e.propertyId}
                </a>
              )}
              {e.source && <span className="admin-muted">via {e.source}</span>}
            </div>

            {e.message && <p className="admin-card__quote admin-prewrap">{e.message}</p>}

            <footer className="admin-row-actions">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  className={`admin-btn admin-btn--sm${e.status === s ? " admin-btn--primary" : ""}`}
                  onClick={() => setStatus(e, s)}
                  disabled={e.status === s}
                >
                  {s}
                </button>
              ))}
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
