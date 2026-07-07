import { useEffect, useMemo, useState } from "react";
import { getEnquiries, markEnquiryHandled, addEnquiryAdmin, getAllProperties } from "../../firebase/firestore";
import { timeAgo, formatDateTime, toDate, initials, avatarGradient } from "../format";
import EnquiryForm from "../components/EnquiryForm";

const STATUSES = ["new", "contacted", "closed"];
const FILTERS = ["all", ...STATUSES];

// Channel → label + icon for the "via …" chip. "website" covers public-form
// leads; the rest come from the admin's manual entry.
const SOURCE_META = {
  website: { label: "Website", icon: "fa-globe" },
  manual: { label: "Manual", icon: "fa-pen" },
  phone: { label: "Phone call", icon: "fa-phone" },
  "walk-in": { label: "Walk-in", icon: "fa-person-walking" },
  whatsapp: { label: "WhatsApp", icon: "fa-whatsapp", brand: true },
  referral: { label: "Referral", icon: "fa-user-group" },
  instagram: { label: "Instagram", icon: "fa-instagram", brand: true },
  other: { label: "Other", icon: "fa-ellipsis" },
};
const sourceMeta = (s) => SOURCE_META[s] || { label: s || "—", icon: "fa-tag" };

// A follow-up is "due" once its day has arrived and the lead isn't closed yet.
function followUpState(ts, status) {
  const d = toDate(ts);
  if (!d) return null;
  const endOfDay = new Date(d);
  endOfDay.setHours(23, 59, 59, 999);
  const overdue = status !== "closed" && endOfDay.getTime() < Date.now();
  const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return { label, overdue };
}

export default function EnquiriesInbox() {
  const [items, setItems] = useState(null);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    getEnquiries()
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load enquiries."));
  };

  useEffect(() => {
    load();
    // Properties power the "interested in" picker and let cards show a title
    // instead of a raw id. Non-fatal if it fails — the form still works.
    getAllProperties().then(setProperties).catch(() => {});
  }, []);

  const propTitle = useMemo(() => {
    const m = new Map(properties.map((p) => [p.id, p.title]));
    return (id) => m.get(id) || id;
  }, [properties]);

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

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await addEnquiryAdmin(data);
      setAdding(false);
      load();
    } catch (err) {
      alert(`Could not save: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div>
        <div className="admin-page-head">
          <h1 className="admin-h1">New enquiry</h1>
          <button className="admin-btn" onClick={() => setAdding(false)}>Cancel</button>
        </div>
        <EnquiryForm properties={properties} saving={saving} onSubmit={handleCreate} onCancel={() => setAdding(false)} />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-h1">Enquiries</h1>
        <button className="admin-btn admin-btn--primary" onClick={() => setAdding(true)}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> New enquiry
        </button>
      </div>

      <div className="admin-filters">
        {FILTERS.map((s) => (
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
      {items && visible.length === 0 && (
        <div className="admin-empty">
          <i className="fa-solid fa-inbox" aria-hidden="true" />
          <p>{filter === "all" ? "No enquiries yet." : `No ${filter} enquiries.`}</p>
          {filter === "all" && (
            <button className="admin-btn admin-btn--primary" onClick={() => setAdding(true)}>
              <i className="fa-solid fa-plus" aria-hidden="true" /> Log your first enquiry
            </button>
          )}
        </div>
      )}

      <div className="admin-enq-list">
        {visible.map((e) => {
          const status = e.status || "new";
          const src = sourceMeta(e.source);
          const followUp = followUpState(e.followUpAt, status);
          return (
            <article key={e.id} className={`admin-enq admin-enq--${status}`}>
              <span className="admin-avatar" style={{ background: avatarGradient(e.name || e.email) }}>
                {initials(e.name)}
              </span>

              <div className="admin-enq__body">
                <header className="admin-enq__head">
                  <span className="admin-enq__name">
                    {status === "new" && <span className="admin-enq__unread" title="Unread" />}
                    {e.name || "Unknown"}
                  </span>
                  <span className="admin-enq__src">
                    <i className={`fa-${src.brand ? "brands" : "solid"} ${src.icon}`} aria-hidden="true" /> {src.label}
                  </span>
                  <span className={`admin-badge admin-badge--${status}`}>{status}</span>
                  <time className="admin-enq__time" title={formatDateTime(e.createdAt)}>{timeAgo(e.createdAt)}</time>
                </header>

                <div className="admin-enq__contact">
                  {e.phone && <a href={`tel:${e.phone}`}><i className="fa-solid fa-phone" aria-hidden="true" /> {e.phone}</a>}
                  {e.email && <a href={`mailto:${e.email}`}><i className="fa-solid fa-envelope" aria-hidden="true" /> {e.email}</a>}
                  {e.propertyId && (
                    <a href={`/property/${e.propertyId}`} target="_blank" rel="noopener noreferrer">
                      <i className="fa-solid fa-building" aria-hidden="true" /> {propTitle(e.propertyId)}
                    </a>
                  )}
                </div>

                {(e.budget || followUp) && (
                  <div className="admin-enq__meta">
                    {e.budget && (
                      <span className="admin-enq__chip"><i className="fa-solid fa-indian-rupee-sign" aria-hidden="true" /> {e.budget}</span>
                    )}
                    {followUp && (
                      <span className={`admin-enq__chip${followUp.overdue ? " is-due" : ""}`}>
                        <i className="fa-solid fa-bell" aria-hidden="true" /> Follow-up {followUp.label}
                        {followUp.overdue && " · due"}
                      </span>
                    )}
                  </div>
                )}

                {e.message && <p className="admin-enq__msg admin-prewrap">{e.message}</p>}

                <footer className="admin-enq__actions">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`admin-btn admin-btn--sm${e.status === s ? " admin-btn--primary" : ""}`}
                      onClick={() => setStatus(e, s)}
                      disabled={e.status === s}
                    >
                      {s === "new" ? "Mark new" : s === "contacted" ? "Contacted" : "Close"}
                    </button>
                  ))}
                </footer>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
