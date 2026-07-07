import { useEffect, useMemo, useState } from "react";
import {
  getAllProperties,
  addProperty,
  updateProperty,
  deleteProperty,
} from "../../firebase/firestore";
import { formatPriceRange } from "../../data/properties";
import PropertyForm from "../components/PropertyForm";

const STATUS_LABELS = {
  active: "Published",
  draft: "Unpublished",
  sold: "Sold",
  rented: "Rented",
};

// Status filter tabs shown above the grid. "all" is the default view.
const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Published" },
  { key: "draft", label: "Unpublished" },
  { key: "featured", label: "Featured" },
];

export default function PropertiesManager() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = list; {} = new; {id,...} = edit
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const load = () => {
    setItems(null);
    getAllProperties()
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load properties."));
  };

  useEffect(load, []);

  const handleSave = async (id, data) => {
    setSaving(true);
    try {
      if (editing?.id) {
        // Editing an existing listing → save and return to the list.
        await updateProperty(editing.id, data);
        setEditing(null);
        load();
      } else {
        // New listing → create it as a draft, then stay on the form in EDIT mode
        // so the gallery uploader (which needs the saved id as its Storage folder)
        // unlocks and the admin can add images. Uploads auto-save from here.
        await addProperty(id, data);
        load();
        setEditing({ id, ...data });
        alert("Property created as a draft. Upload at least one image, then Save or Publish it.");
      }
    } catch (err) {
      alert(`Could not save: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  // Persist gallery changes immediately (called by the form on upload/remove in
  // edit mode) so images aren't lost if the admin forgets to press Save.
  const persistGallery = async (gallery) => {
    if (!editing?.id) return;
    try {
      await updateProperty(editing.id, { gallery });
      setEditing((e) => (e ? { ...e, gallery } : e));
    } catch (err) {
      console.error("Could not auto-save gallery:", err);
    }
  };

  // Publish (show on site) / unpublish (hide but keep). Publishing needs ≥1 image.
  const togglePublish = async (item) => {
    const publish = item.status !== "active";
    if (publish && !(item.gallery && item.gallery.length)) {
      alert("Add at least one image before publishing this property.");
      return;
    }
    try {
      await updateProperty(item.id, { status: publish ? "active" : "draft" });
      load();
    } catch (err) {
      alert(`Could not update: ${err.message || err}`);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    try {
      await deleteProperty(item.id);
      load();
    } catch (err) {
      alert(`Could not delete: ${err.message || err}`);
    }
  };

  // Counts for the filter tabs (badge next to each label).
  const counts = useMemo(() => {
    const list = items || [];
    return {
      all: list.length,
      active: list.filter((p) => p.status === "active").length,
      draft: list.filter((p) => (p.status || "active") !== "active").length,
      featured: list.filter((p) => p.featured).length,
    };
  }, [items]);

  // Apply the active status filter + free-text search.
  const visible = useMemo(() => {
    let list = items || [];
    if (filter === "active") list = list.filter((p) => p.status === "active");
    else if (filter === "draft") list = list.filter((p) => (p.status || "active") !== "active");
    else if (filter === "featured") list = list.filter((p) => p.featured);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.title, p.locality, p.developer, p.city]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, filter, query]);

  if (editing !== null) {
    return (
      <div>
        <div className="admin-page-head">
          <h1 className="admin-h1">{editing.id ? "Edit property" : "New property"}</h1>
          <button className="admin-btn" onClick={() => setEditing(null)}>Cancel</button>
        </div>
        <PropertyForm
          initial={editing.id ? editing : null}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
          onGalleryPersist={persistGallery}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-h1">Properties</h1>
        <button className="admin-btn admin-btn--primary" onClick={() => setEditing({})}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> New property
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {!items && !error && <p className="admin-muted">Loading…</p>}

      {items && items.length > 0 && (
        <div className="admin-toolbar">
          <div className="admin-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`admin-chip${filter === f.key ? " is-active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="admin-chip__count">{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <div className="admin-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search title, locality, developer…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {items && items.length === 0 && (
        <div className="admin-empty">
          <i className="fa-solid fa-building" aria-hidden="true" />
          <p>No properties yet.</p>
          <button className="admin-btn admin-btn--primary" onClick={() => setEditing({})}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Add your first property
          </button>
        </div>
      )}

      {items && items.length > 0 && visible.length === 0 && (
        <p className="admin-muted">No properties match this filter.</p>
      )}

      {visible.length > 0 && (
        <div className="admin-prop-grid">
          {visible.map((p) => {
            const cover = p.gallery && p.gallery.length ? p.gallery[0].url : null;
            const status = p.status || "active";
            const published = status === "active";
            return (
              <article key={p.id} className="admin-prop-card">
                <div className="admin-prop-card__media">
                  {cover ? (
                    <img src={cover} alt={p.title} loading="lazy" />
                  ) : (
                    <div className="admin-prop-card__noimg">
                      <i className="fa-regular fa-image" aria-hidden="true" />
                    </div>
                  )}
                  <span className={`admin-badge admin-badge--${status} admin-prop-card__status`}>
                    {STATUS_LABELS[status] || status}
                  </span>
                  {p.featured && (
                    <span className="admin-prop-card__featured" title="Featured">
                      <i className="fa-solid fa-star" aria-hidden="true" /> Featured
                    </span>
                  )}
                  {p.gallery && p.gallery.length > 1 && (
                    <span className="admin-prop-card__count">
                      <i className="fa-regular fa-images" aria-hidden="true" /> {p.gallery.length}
                    </span>
                  )}
                </div>

                <div className="admin-prop-card__body">
                  <h3 className="admin-prop-card__title" title={p.title}>{p.title}</h3>
                  <p className="admin-prop-card__loc">
                    <i className="fa-solid fa-location-dot" aria-hidden="true" />
                    {[p.locality, p.city].filter(Boolean).join(", ") || "—"}
                  </p>
                  {(p.priceMin != null && p.priceMin !== "") && (
                    <p className="admin-prop-card__price">{formatPriceRange(p)}</p>
                  )}
                  <div className="admin-prop-card__tags">
                    <span className="admin-tag admin-cap">{p.category}</span>
                    <span className="admin-tag admin-cap">{p.transaction}</span>
                    {p.developer && <span className="admin-tag">{p.developer}</span>}
                  </div>
                </div>

                <div className="admin-prop-card__actions">
                  <button className="admin-btn admin-btn--sm" onClick={() => setEditing(p)}>
                    <i className="fa-solid fa-pen" aria-hidden="true" /> Edit
                  </button>
                  {published ? (
                    <button className="admin-btn admin-btn--sm admin-btn--danger-solid" onClick={() => togglePublish(p)}>
                      Unpublish
                    </button>
                  ) : (
                    <button className="admin-btn admin-btn--sm admin-btn--success" onClick={() => togglePublish(p)}>
                      Publish
                    </button>
                  )}
                  <button
                    className="admin-btn admin-btn--sm admin-btn--danger admin-prop-card__del"
                    onClick={() => handleDelete(p)}
                    title="Delete"
                    aria-label={`Delete ${p.title}`}
                  >
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
