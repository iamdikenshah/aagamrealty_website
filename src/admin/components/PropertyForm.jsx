import { useEffect, useState } from "react";
import { propertyCategoryOptions, configurationOptions } from "../../data/content";
import { getNames, addListItem, propertyIdExists, LISTS } from "../../firebase/firestore";
import ImageUploader, { GALLERY_TYPES } from "./ImageUploader";
import AdminSelect from "./AdminSelect";

// --- Fixed enums (taxonomy mirrors src/data/properties.js) -------------------
const CATEGORIES = ["residential", "commercial"];
const TRANSACTIONS = ["rent", "buy", "pre-lease"];
const LISTING_TYPES = ["rental", "owned", "pre-lease", "land"];
const STATUSES = ["active", "sold", "rented", "draft"];
const PRICE_UNITS = ["Cr", "Lac", "per month", "per sqft"];
const AREA_UNITS = ["sqft", "sq.yd", "sq.m", "acre"];
const PURCHASE_TYPES = ["New Booking", "Resale", "Pre-Leased"];
const PROJECT_STAGES = ["New Launch", "Under Construction", "Ready to Move", "Resale"];
const NEARBY_CATEGORIES = ["Landmark", "School", "Hospital", "Connectivity", "Shopping", "Business", "Other"];
const CUSTOM = "__custom__";
const ADD_NEW = "__add__";
const MAX_DESC_WORDS = 500;

const EMPTY = {
  id: "",
  title: "",
  category: "residential",
  transaction: "buy",
  listingType: "owned",
  status: "active",
  featured: false,
  developer: "",
  locality: "",
  city: "Ahmedabad",
  priceMin: "",
  priceMax: "",
  priceUnit: "Cr",
  propertyType: "",
  purchaseType: "",
  totalArea: "",
  possessionDate: "",
  projectStage: "",
  totalUnits: "",
  launchDate: "",
  description: "",
  videoUrl: "",
  configurations: [],
  gallery: [],
  amenities: [],
  keyFeatures: [],
  towers: [],
  nearby: [],
  rera: { id: "", authority: "", qrUrl: "" },
  location: { address: "", mapUrl: "" },
};

const toNum = (v) => (v === "" || v == null ? undefined : Number(v));
const stripUndefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const wordCount = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

function Field({ label, error, children, wide }) {
  return (
    <label className={`admin-field${wide ? " admin-field--wide" : ""}${error ? " admin-field--invalid" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small className="admin-field__err">{error}</small>}
    </label>
  );
}

export default function PropertyForm({ initial, saving, onSubmit, onCancel }) {
  const isEdit = !!initial?.id;
  const [values, setValues] = useState(() => ({ ...EMPTY, ...(initial || {}), rera: { ...EMPTY.rera, ...(initial?.rera || {}) }, location: { ...EMPTY.location, ...(initial?.location || {}) } }));
  const [errors, setErrors] = useState({});
  const [idEdited, setIdEdited] = useState(isEdit); // once user types an id, stop auto-slugging
  const [checkingId, setCheckingId] = useState(false);

  // Managed reference lists → dropdown options.
  const [lists, setLists] = useState({ developers: [], localities: [], amenities: [], keyFeatures: [] });
  useEffect(() => {
    let active = true;
    Promise.all([
      getNames(LISTS.developers),
      getNames(LISTS.localities),
      getNames(LISTS.amenities),
      getNames(LISTS.keyFeatures),
    ]).then(([developers, localities, amenities, keyFeatures]) => {
      if (active) setLists({ developers, localities, amenities, keyFeatures });
    });
    return () => { active = false; };
  }, []);

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  const setNested = (obj, key, value) => setValues((v) => ({ ...v, [obj]: { ...v[obj], [key]: value } }));
  const clearErr = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  // Auto-suggest the id from the title until the admin edits the id themselves.
  const onTitleChange = (title) => {
    setValues((v) => ({ ...v, title, ...(idEdited || isEdit ? {} : { id: slugify(title) }) }));
    clearErr("title");
  };

  const descWords = wordCount(values.description);

  // --- inline "add new" for developer/locality dropdowns --------------------
  const handleListSelect = async (field, listKey, coll, val) => {
    if (val === ADD_NEW) {
      const name = window.prompt(`New ${field}:`)?.trim();
      if (!name) return;
      try {
        await addListItem(coll, name);
        setLists((l) => ({ ...l, [listKey]: [...l[listKey], name].sort((a, b) => a.localeCompare(b)) }));
        set(field, name);
      } catch (err) {
        alert(err.message || "Could not add.");
      }
      return;
    }
    set(field, val);
    clearErr(field);
  };

  // --- configurations -------------------------------------------------------
  const addConfig = () => set("configurations", [...values.configurations, { config: "", areaUnit: "sqft" }]);
  const setConfig = (i, key, value) =>
    set("configurations", values.configurations.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)));
  const removeConfig = (i) => set("configurations", values.configurations.filter((_, idx) => idx !== i));

  // --- towers ---------------------------------------------------------------
  const addTower = () => set("towers", [...values.towers, { name: "" }]);
  const setTower = (i, key, value) => set("towers", values.towers.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));
  const removeTower = (i) => set("towers", values.towers.filter((_, idx) => idx !== i));

  // --- nearby ---------------------------------------------------------------
  const addNearby = () => set("nearby", [...values.nearby, { label: "", category: "Landmark", distanceKm: "" }]);
  const setNearby = (i, key, value) => set("nearby", values.nearby.map((n, idx) => (idx === i ? { ...n, [key]: value } : n)));
  const removeNearby = (i) => set("nearby", values.nearby.filter((_, idx) => idx !== i));

  // --- gallery --------------------------------------------------------------
  const onImageUploaded = ({ url, path, name, contentType }) =>
    setValues((v) => ({ ...v, gallery: [...v.gallery, { url, path, name, contentType, category: "", caption: "", tag: "" }] }));
  const setGallery = (i, key, value) => set("gallery", values.gallery.map((g, idx) => (idx === i ? { ...g, [key]: value } : g)));
  const removeGallery = (i) => set("gallery", values.gallery.filter((_, idx) => idx !== i));

  // --- amenities / keyFeatures chip pickers ---------------------------------
  const addChip = (field, value) => { if (value && !values[field].includes(value)) set(field, [...values[field], value]); };
  const removeChip = (field, value) => set(field, values[field].filter((x) => x !== value));

  const renderChipPicker = (field, options, label) => {
    const remaining = options.filter((o) => !values[field].includes(o));
    return (
      <div className="admin-field admin-field--wide">
        <span>{label}</span>
        {values[field].length > 0 && (
          <div className="admin-chips">
            {values[field].map((item) => (
              <span key={item} className="admin-chip-tag">
                {item}
                <button type="button" onClick={() => removeChip(field, item)} aria-label={`Remove ${item}`}>✕</button>
              </span>
            ))}
          </div>
        )}
        <AdminSelect
          value=""
          onChange={(v) => addChip(field, v)}
          disabled={remaining.length === 0}
          placeholder={remaining.length ? `+ Add ${label.toLowerCase()}…` : "All added"}
          options={remaining}
        />
        {options.length === 0 && (
          <small className="admin-muted">No options yet — add some under <strong>Lists</strong>.</small>
        )}
      </div>
    );
  };

  // --- config select helpers ------------------------------------------------
  // `_custom` marks a row in free-text mode (so choosing "Custom…" keeps the text
  // input visible even before anything is typed). It's stripped out on submit.
  const configSelectValue = (c) => {
    if (c._custom) return CUSTOM;
    if (!c.config) return "";
    return configurationOptions.includes(c.config) ? c.config : CUSTOM;
  };
  const setConfigType = (i, v) =>
    set("configurations", values.configurations.map((c, idx) =>
      idx === i ? (v === CUSTOM ? { ...c, _custom: true } : { ...c, _custom: false, config: v }) : c
    ));

  const validate = async () => {
    const e = {};
    if (!values.title.trim()) e.title = "Title is required.";
    const id = values.id.trim();
    if (!id) e.id = "Property ID is required.";
    else if (!/^[a-z0-9-]+$/.test(id)) e.id = "Use lowercase letters, numbers and hyphens only.";
    if (!values.locality) e.locality = "Locality is required.";
    if (values.priceMin === "" || values.priceMin == null) e.priceMin = "Minimum price is required.";
    else if (Number(values.priceMin) < 0) e.priceMin = "Must be 0 or more.";
    if (values.priceMax !== "" && values.priceMax != null && Number(values.priceMax) < Number(values.priceMin))
      e.priceMax = "Max can't be less than min.";
    if (descWords > MAX_DESC_WORDS) e.description = `Description is ${descWords} words — max ${MAX_DESC_WORDS}.`;
    values.nearby.forEach((n, i) => { if (!n.label.trim()) e[`nearby-${i}`] = "Title required."; });

    // Uniqueness check for a new id (only if format is otherwise valid).
    if (!isEdit && id && !e.id) {
      setCheckingId(true);
      try {
        if (await propertyIdExists(id)) e.id = `A property with id "${id}" already exists.`;
      } catch { /* ignore — surfaces on save */ } finally { setCheckingId(false); }
    }
    return e;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const e = await validate();
    setErrors(e);
    if (Object.keys(e).some((k) => e[k])) {
      const first = document.querySelector(".admin-field__err");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const data = stripUndefined({
      title: values.title.trim(),
      category: values.category,
      transaction: values.transaction,
      listingType: values.listingType,
      status: values.status,
      featured: !!values.featured,
      developer: values.developer.trim() || undefined,
      locality: values.locality,
      city: values.city.trim() || undefined,
      priceMin: toNum(values.priceMin),
      priceMax: toNum(values.priceMax),
      priceUnit: values.priceUnit,
      propertyType: values.propertyType || undefined,
      purchaseType: values.purchaseType || undefined,
      totalArea: values.totalArea.trim() || undefined,
      possessionDate: values.possessionDate.trim() || undefined,
      projectStage: values.projectStage || undefined,
      totalUnits: toNum(values.totalUnits),
      launchDate: values.launchDate.trim() || undefined,
      description: values.description.trim(),
      videoUrl: values.videoUrl.trim() || undefined,
      configurations: values.configurations
        .filter((c) => c.config.trim())
        .map((c) => stripUndefined({
          config: c.config.trim(),
          areaUnit: c.areaUnit || "sqft",
          superBuiltupArea: toNum(c.superBuiltupArea),
          carpetArea: toNum(c.carpetArea),
          usableArea: toNum(c.usableArea),
          otherArea: toNum(c.otherArea),
          price: toNum(c.price),
        })),
      towers: values.towers
        .filter((t) => t.name.trim())
        .map((t) => stripUndefined({
          name: t.name.trim(),
          bedroomType: t.bedroomType?.trim() || undefined,
          unitsOnFloor: toNum(t.unitsOnFloor),
          lifts: toNum(t.lifts),
          storeys: toNum(t.storeys),
        })),
      nearby: values.nearby
        .filter((n) => n.label.trim())
        .map((n) => stripUndefined({ label: n.label.trim(), category: n.category || "Landmark", distanceKm: toNum(n.distanceKm) })),
      amenities: values.amenities,
      keyFeatures: values.keyFeatures,
      gallery: values.gallery.map((g) => stripUndefined({
        url: g.url, path: g.path || undefined, name: g.name || undefined, contentType: g.contentType || undefined,
        category: g.category || undefined, caption: g.caption || undefined, tag: g.tag || undefined,
      })),
      rera: (values.rera.id || values.rera.authority || values.rera.qrUrl)
        ? stripUndefined({ id: values.rera.id.trim() || undefined, authority: values.rera.authority.trim() || undefined, qrUrl: values.rera.qrUrl.trim() || undefined })
        : undefined,
      location: (values.location.address || values.location.mapUrl)
        ? stripUndefined({ address: values.location.address.trim() || undefined, mapUrl: values.location.mapUrl.trim() || undefined })
        : undefined,
    });

    onSubmit(values.id.trim(), data);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      {/* --- Basics --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Basics</h2>
        <div className="admin-grid">
          <Field label="Title *" error={errors.title} wide>
            <input type="text" value={values.title} onChange={(e) => onTitleChange(e.target.value)} />
          </Field>

          <Field label="Property ID *" error={errors.id} wide>
            <input
              type="text"
              value={values.id}
              disabled={isEdit}
              placeholder="e.g. shantigram-skyline"
              onChange={(e) => { setIdEdited(true); set("id", e.target.value); clearErr("id"); }}
            />
            <small className="admin-muted">
              {isEdit ? "The ID can't be changed after creation." : "Used in the URL and as the image folder. Lowercase, hyphens."}
              {checkingId && " · checking…"}
            </small>
          </Field>

          <Field label="Category">
            <AdminSelect value={values.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
          </Field>
          <Field label="Transaction">
            <AdminSelect value={values.transaction} onChange={(v) => set("transaction", v)} options={TRANSACTIONS} />
          </Field>
          <Field label="Listing type">
            <AdminSelect value={values.listingType} onChange={(v) => set("listingType", v)} options={LISTING_TYPES} />
          </Field>
          <Field label="Status">
            <AdminSelect value={values.status} onChange={(v) => set("status", v)} options={STATUSES} />
          </Field>

          <Field label="Property type">
            <AdminSelect value={values.propertyType} onChange={(v) => set("propertyType", v)} options={propertyCategoryOptions} placeholder="Select…" />
          </Field>
          <Field label="Purchase type">
            <AdminSelect value={values.purchaseType} onChange={(v) => set("purchaseType", v)} options={PURCHASE_TYPES} placeholder="Select…" />
          </Field>

          <Field label="Developer">
            <AdminSelect
              value={values.developer}
              onChange={(v) => handleListSelect("developer", "developers", LISTS.developers, v)}
              placeholder="Select…"
              options={[
                ...lists.developers.map((o) => ({ value: o, label: o })),
                ...(values.developer && !lists.developers.includes(values.developer) ? [{ value: values.developer, label: values.developer }] : []),
                { value: ADD_NEW, label: "+ Add new developer…" },
              ]}
            />
          </Field>
          <Field label="Locality *" error={errors.locality}>
            <AdminSelect
              value={values.locality}
              onChange={(v) => handleListSelect("locality", "localities", LISTS.localities, v)}
              placeholder="Select…"
              options={[
                ...lists.localities.map((o) => ({ value: o, label: o })),
                ...(values.locality && !lists.localities.includes(values.locality) ? [{ value: values.locality, label: values.locality }] : []),
                { value: ADD_NEW, label: "+ Add new locality…" },
              ]}
            />
          </Field>
          <Field label="City">
            <input type="text" value={values.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Featured">
            <label className="admin-checkline">
              <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} />
              <span>Show in featured sections</span>
            </label>
          </Field>
        </div>
      </section>

      {/* --- Pricing & project --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Pricing &amp; project</h2>
        <div className="admin-grid">
          <Field label="Price min *" error={errors.priceMin}>
            <input type="number" step="any" value={values.priceMin} onChange={(e) => { set("priceMin", e.target.value); clearErr("priceMin"); }} />
          </Field>
          <Field label="Price max" error={errors.priceMax}>
            <input type="number" step="any" value={values.priceMax} onChange={(e) => { set("priceMax", e.target.value); clearErr("priceMax"); }} />
          </Field>
          <Field label="Price unit">
            <AdminSelect value={values.priceUnit} onChange={(v) => set("priceUnit", v)} options={PRICE_UNITS} />
          </Field>
          <Field label="Project stage">
            <AdminSelect value={values.projectStage} onChange={(v) => set("projectStage", v)} options={PROJECT_STAGES} placeholder="Select…" />
          </Field>
          <Field label="Total area"><input type="text" value={values.totalArea} onChange={(e) => set("totalArea", e.target.value)} placeholder="18 acres" /></Field>
          <Field label="Total units"><input type="number" value={values.totalUnits} onChange={(e) => set("totalUnits", e.target.value)} /></Field>
          <Field label="Possession date"><input type="text" value={values.possessionDate} onChange={(e) => set("possessionDate", e.target.value)} placeholder="December 2027" /></Field>
          <Field label="Launch date"><input type="text" value={values.launchDate} onChange={(e) => set("launchDate", e.target.value)} /></Field>
          <Field label="Video URL" wide><input type="url" value={values.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://www.youtube.com/embed/…" /></Field>
          <Field label={`Description (${descWords}/${MAX_DESC_WORDS} words)`} error={errors.description} wide>
            <textarea
              rows="5"
              className={descWords > MAX_DESC_WORDS ? "admin-json is-invalid" : undefined}
              value={values.description}
              onChange={(e) => { set("description", e.target.value); clearErr("description"); }}
            />
          </Field>
        </div>
      </section>

      {/* --- Configurations --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Configurations</h2>
        {values.configurations.map((c, i) => {
          const selVal = configSelectValue(c);
          return (
            <div key={i} className="admin-subrow">
              <label className="admin-subfield">
                <span>Config</span>
                <AdminSelect
                  value={selVal}
                  onChange={(v) => setConfigType(i, v)}
                  placeholder="Select…"
                  options={[...configurationOptions.map((o) => ({ value: o, label: o })), { value: CUSTOM, label: "Custom…" }]}
                />
                {selVal === CUSTOM && (
                  <input type="text" placeholder="e.g. 4.5 BHK" value={c.config} onChange={(e) => setConfig(i, "config", e.target.value)} />
                )}
              </label>
              <label className="admin-subfield">
                <span>Super built-up</span>
                <input type="number" step="any" value={c.superBuiltupArea ?? ""} onChange={(e) => setConfig(i, "superBuiltupArea", e.target.value)} />
              </label>
              <label className="admin-subfield">
                <span>Carpet</span>
                <input type="number" step="any" value={c.carpetArea ?? ""} onChange={(e) => setConfig(i, "carpetArea", e.target.value)} />
              </label>
              <label className="admin-subfield">
                <span>Usable</span>
                <input type="number" step="any" value={c.usableArea ?? ""} onChange={(e) => setConfig(i, "usableArea", e.target.value)} />
              </label>
              <label className="admin-subfield">
                <span>Other</span>
                <input type="number" step="any" value={c.otherArea ?? ""} onChange={(e) => setConfig(i, "otherArea", e.target.value)} />
              </label>
              <label className="admin-subfield">
                <span>Area unit</span>
                <AdminSelect value={c.areaUnit || "sqft"} onChange={(v) => setConfig(i, "areaUnit", v)} options={AREA_UNITS} />
              </label>
              <label className="admin-subfield">
                <span>Price ({values.priceUnit})</span>
                <input type="number" step="any" value={c.price ?? ""} onChange={(e) => setConfig(i, "price", e.target.value)} />
              </label>
              <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => removeConfig(i)}>Remove</button>
            </div>
          );
        })}
        <button type="button" className="admin-btn admin-btn--sm" onClick={addConfig}>+ Add configuration</button>
        <p className="admin-muted admin-form__hint">Price is this variant's price, in the listing's price unit (above).</p>
      </section>

      {/* --- Gallery --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Gallery</h2>
        <ImageUploader
          folder="properties"
          ownerId={values.id}
          accept={GALLERY_TYPES}
          disabled={!isEdit}
          disabledHint="Save the property first, then upload files here (they're stored under its ID)."
          onUploaded={onImageUploaded}
        />
        {values.gallery.map((g, i) => {
          const isImage = g.contentType ? g.contentType.startsWith("image/") : !/\.pdf$/i.test(g.url || "");
          return (
            <div key={i} className="admin-gallery-row">
              {isImage && g.url
                ? <img src={g.url} alt="" className="admin-gallery-thumb" />
                : <span className="admin-file-chip"><i className="fa-solid fa-file" aria-hidden="true" /> {g.name || "file"}</span>}
              <input type="url" value={g.url || ""} placeholder="File URL" onChange={(e) => setGallery(i, "url", e.target.value)} />
              <input type="text" value={g.category || ""} placeholder="Category (e.g. Interior)" onChange={(e) => setGallery(i, "category", e.target.value)} />
              <input type="text" value={g.caption || ""} placeholder="Caption" onChange={(e) => setGallery(i, "caption", e.target.value)} />
              <input type="text" value={g.tag || ""} placeholder="Tag" onChange={(e) => setGallery(i, "tag", e.target.value)} />
              <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => removeGallery(i)}>✕</button>
            </div>
          );
        })}
      </section>

      {/* --- Amenities & features --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Amenities &amp; features</h2>
        <div className="admin-grid">
          {renderChipPicker("amenities", lists.amenities, "Amenities")}
          {renderChipPicker("keyFeatures", lists.keyFeatures, "Key features")}
        </div>
      </section>

      {/* --- Towers --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Towers <span className="admin-muted">(optional — for multi-building projects)</span></h2>
        {values.towers.map((t, i) => (
          <div key={i} className="admin-subrow">
            <label className="admin-subfield"><span>Name</span><input type="text" value={t.name} onChange={(e) => setTower(i, "name", e.target.value)} placeholder="Tower A" /></label>
            <label className="admin-subfield"><span>Bedroom type</span><input type="text" value={t.bedroomType || ""} onChange={(e) => setTower(i, "bedroomType", e.target.value)} placeholder="3 & 4 BHK" /></label>
            <label className="admin-subfield"><span>Units/floor</span><input type="number" value={t.unitsOnFloor ?? ""} onChange={(e) => setTower(i, "unitsOnFloor", e.target.value)} /></label>
            <label className="admin-subfield"><span>Lifts</span><input type="number" value={t.lifts ?? ""} onChange={(e) => setTower(i, "lifts", e.target.value)} /></label>
            <label className="admin-subfield"><span>Storeys</span><input type="number" value={t.storeys ?? ""} onChange={(e) => setTower(i, "storeys", e.target.value)} /></label>
            <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => removeTower(i)}>Remove</button>
          </div>
        ))}
        <button type="button" className="admin-btn admin-btn--sm" onClick={addTower}>+ Add tower</button>
      </section>

      {/* --- Nearby --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Nearby</h2>
        {values.nearby.map((n, i) => (
          <div key={i} className="admin-subrow">
            <label className="admin-subfield" style={{ flex: "2 1 180px" }}>
              <span>Title *</span>
              <input type="text" value={n.label} aria-invalid={!!errors[`nearby-${i}`]} onChange={(e) => setNearby(i, "label", e.target.value)} placeholder="Adani Vidya Mandir" />
              {errors[`nearby-${i}`] && <small className="admin-field__err">{errors[`nearby-${i}`]}</small>}
            </label>
            <label className="admin-subfield">
              <span>Category</span>
              <AdminSelect value={n.category || "Landmark"} onChange={(v) => setNearby(i, "category", v)} options={NEARBY_CATEGORIES} />
            </label>
            <label className="admin-subfield">
              <span>Distance (km)</span>
              <input type="number" step="any" value={n.distanceKm ?? ""} onChange={(e) => setNearby(i, "distanceKm", e.target.value)} />
            </label>
            <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => removeNearby(i)}>Remove</button>
          </div>
        ))}
        <button type="button" className="admin-btn admin-btn--sm" onClick={addNearby}>+ Add nearby place</button>
      </section>

      {/* --- RERA & Location --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">RERA &amp; location</h2>
        <div className="admin-grid">
          <Field label="RERA ID"><input type="text" value={values.rera.id} onChange={(e) => setNested("rera", "id", e.target.value)} /></Field>
          <Field label="RERA authority"><input type="text" value={values.rera.authority} onChange={(e) => setNested("rera", "authority", e.target.value)} placeholder="GujRERA" /></Field>
          <Field label="RERA QR URL"><input type="url" value={values.rera.qrUrl} onChange={(e) => setNested("rera", "qrUrl", e.target.value)} /></Field>
          <Field label="Address" wide><input type="text" value={values.location.address} onChange={(e) => setNested("location", "address", e.target.value)} /></Field>
          <Field label="Google Maps link" wide><input type="url" value={values.location.mapUrl} onChange={(e) => setNested("location", "mapUrl", e.target.value)} placeholder="Paste the Google Maps share link" /></Field>
        </div>
      </section>

      <div className="admin-form__actions">
        <button type="button" className="admin-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving || checkingId}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create property"}
        </button>
      </div>
    </form>
  );
}
