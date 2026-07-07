import { useEffect, useState } from "react";
import {
  getAllProperties,
  addProperty,
  updateProperty,
  deleteProperty,
} from "../../firebase/firestore";
import PropertyForm from "../components/PropertyForm";

const STATUS_LABELS = {
  active: "Published",
  draft: "Unpublished",
  sold: "Sold",
  rented: "Rented",
};

export default function PropertiesManager() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = list; {} = new; {id,...} = edit
  const [saving, setSaving] = useState(false);

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
      {items && items.length === 0 && <p className="admin-muted">No properties yet.</p>}

      {items && items.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Locality</th>
                <th>Category</th>
                <th>Transaction</th>
                <th>Status</th>
                <th>Featured</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.locality}</td>
                  <td className="admin-cap">{p.category}</td>
                  <td className="admin-cap">{p.transaction}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${p.status || "active"}`}>
                      {STATUS_LABELS[p.status] || p.status || "Active"}
                    </span>
                  </td>
                  <td>{p.featured ? "★" : "—"}</td>
                  <td className="admin-row-actions">
                    <button className="admin-btn admin-btn--sm" onClick={() => setEditing(p)}>Edit</button>
                    {p.status === "active" ? (
                      <button className="admin-btn admin-btn--sm admin-btn--danger-solid" onClick={() => togglePublish(p)}>Unpublish</button>
                    ) : (
                      <button className="admin-btn admin-btn--sm admin-btn--success" onClick={() => togglePublish(p)}>Publish</button>
                    )}
                    <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
