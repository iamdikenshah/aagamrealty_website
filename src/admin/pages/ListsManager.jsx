import { useState } from "react";
import { LISTS } from "../../firebase/firestore";
import ListEditor from "../components/ListEditor";

// Each tab maps to a managed reference-list collection.
const TABS = [
  { coll: LISTS.developers, label: "Developers", singular: "developer" },
  { coll: LISTS.localities, label: "Localities", singular: "locality" },
  { coll: LISTS.amenities, label: "Amenities", singular: "amenity" },
  { coll: LISTS.keyFeatures, label: "Key Features", singular: "key feature" },
  { coll: LISTS.galleryCategories, label: "Image Categories", singular: "image category" },
];

export default function ListsManager() {
  const [active, setActive] = useState(TABS[0].coll);
  const tab = TABS.find((t) => t.coll === active);

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-h1">Lists</h1>
      </div>
      <p className="admin-muted" style={{ marginTop: -8, marginBottom: 18 }}>
        These values power the dropdowns in the property form (and localities also feed the public site).
      </p>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.coll}
            className={`admin-tab${active === t.coll ? " is-active" : ""}`}
            onClick={() => setActive(t.coll)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* key forces a fresh mount per tab so state resets cleanly. */}
      <ListEditor key={tab.coll} coll={tab.coll} singular={tab.singular} />
    </div>
  );
}
