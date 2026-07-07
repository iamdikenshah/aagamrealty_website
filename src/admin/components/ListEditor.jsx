import { useEffect, useState } from "react";
import { getListItems, addListItem, updateListItem, deleteListItem } from "../../firebase/firestore";

/**
 * Generic add/edit/delete manager for one reference list (developers, localities,
 * amenities, keyFeatures). Reused per tab in ListsManager.
 *
 * @param {object} props
 * @param {string} props.coll      Firestore collection key (LISTS.*)
 * @param {string} props.singular  e.g. "developer" (used in prompts/placeholder)
 */
export default function ListEditor({ coll, singular }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const load = () => {
    setItems(null);
    getListItems(coll)
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load."));
  };

  useEffect(load, [coll]);

  const add = async (e) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setBusy(true);
    try {
      await addListItem(coll, value);
      setDraft("");
      load();
    } catch (err) {
      alert(err.message || "Could not add.");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id) => {
    const value = editValue.trim();
    if (!value) return;
    try {
      await updateListItem(coll, id, value);
      setEditingId(null);
      load();
    } catch (err) {
      alert(err.message || "Could not save.");
    }
  };

  const remove = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteListItem(coll, item.id);
      load();
    } catch (err) {
      alert(err.message || "Could not delete.");
    }
  };

  return (
    <div className="admin-listeditor">
      <form className="admin-listeditor__add" onSubmit={add}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Add a ${singular}…`}
        />
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy || !draft.trim()}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> Add
        </button>
      </form>

      {error && <p className="admin-error">{error}</p>}
      {!items && !error && <p className="admin-muted">Loading…</p>}
      {items && items.length === 0 && <p className="admin-muted">No {singular}s yet — add one above.</p>}

      {items && items.length > 0 && (
        <ul className="admin-listeditor__list">
          {items.map((item) => (
            <li key={item.id} className="admin-listeditor__row">
              {editingId === item.id ? (
                <>
                  <input
                    type="text"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(item.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button className="admin-btn admin-btn--sm admin-btn--primary" onClick={() => saveEdit(item.id)}>Save</button>
                  <button className="admin-btn admin-btn--sm" onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="admin-listeditor__name">{item.name}</span>
                  <button
                    className="admin-btn admin-btn--sm"
                    onClick={() => { setEditingId(item.id); setEditValue(item.name); }}
                  >
                    Edit
                  </button>
                  <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => remove(item)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
