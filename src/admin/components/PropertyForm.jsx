import { useEffect, useRef, useState } from "react";
import { propertyCategoryOptions, configurationOptions } from "../../data/content";
import { getNames, addListItem, propertyIdExists, LISTS } from "../../firebase/firestore";
import ImageUploader, { GALLERY_TYPES, BROCHURE_TYPES } from "./ImageUploader";
import AdminSelect from "./AdminSelect";
import PropertyPreview from "./PropertyPreview";

// --- Fixed enums (taxonomy mirrors src/data/properties.js) -------------------
const CATEGORIES = ["residential", "commercial"];
const TRANSACTIONS = ["rent", "buy", "pre-lease"];
const LISTING_TYPES = ["rental", "owned", "pre-lease", "land"];
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
  status: "draft", // new listings start unpublished
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
  brochure: null, // {url, path, name, contentType} — downloadable PDF
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

/**
 * Short, human-readable stand-in for a gallery item's URL. Firebase Storage
 * URLs percent-encode the full object path, so decode it and keep the last
 * segment — "properties%2Fgreen-legacy%2F123-mobile.jpg" → "123-mobile.jpg".
 */
const fileLabel = (g) => {
  if (g.name) return g.name;
  if (!g.url) return "no file";
  try {
    const path = decodeURIComponent(new URL(g.url).pathname);
    return path.split("/").filter(Boolean).pop() || g.url;
  } catch {
    return g.url;
  }
};

function Field({ label, error, children, wide }) {
  return (
    <label className={`admin-field${wide ? " admin-field--wide" : ""}${error ? " admin-field--invalid" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small className="admin-field__err">{error}</small>}
    </label>
  );
}

export default function PropertyForm({ initial, saving, onSubmit, onCancel, onGalleryPersist }) {
  const isEdit = !!initial?.id;
  const [values, setValues] = useState(() => ({ ...EMPTY, ...(initial || {}), rera: { ...EMPTY.rera, ...(initial?.rera || {}) }, location: { ...EMPTY.location, ...(initial?.location || {}) } }));
  const [errors, setErrors] = useState({});
  const [previewing, setPreviewing] = useState(false);
  const [urlOpen, setUrlOpen] = useState({}); // gallery index → raw URL field revealed

  // Managed reference lists → dropdown options.
  const [lists, setLists] = useState({ developers: [], localities: [], amenities: [], keyFeatures: [], galleryCategories: [] });
  useEffect(() => {
    let active = true;
    Promise.all([
      getNames(LISTS.developers),
      getNames(LISTS.localities),
      getNames(LISTS.amenities),
      getNames(LISTS.keyFeatures),
      getNames(LISTS.galleryCategories),
    ]).then(([developers, localities, amenities, keyFeatures, galleryCategories]) => {
      if (active) setLists({ developers, localities, amenities, keyFeatures, galleryCategories });
    });
    return () => { active = false; };
  }, []);

  // Auto-save the gallery to Firestore in edit mode, so uploaded/removed images
  // persist even if the admin doesn't press "Save changes". Skips the initial
  // load (only writes once the gallery actually differs from what was loaded).
  const loadedGallery = useRef(JSON.stringify(initial?.gallery || []));
  useEffect(() => {
    if (!isEdit || !onGalleryPersist) return;
    if (JSON.stringify(values.gallery) === loadedGallery.current) return;
    const t = setTimeout(() => onGalleryPersist(values.gallery), 500);
    return () => clearTimeout(t);
  }, [values.gallery]);

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  const setNested = (obj, key, value) => setValues((v) => ({ ...v, [obj]: { ...v[obj], [key]: value } }));
  const clearErr = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  // The id is derived from the title for new listings (it's a backend key, never
  // shown to the admin) and is fixed once the property exists.
  const onTitleChange = (title) => {
    setValues((v) => ({ ...v, title, ...(isEdit ? {} : { id: slugify(title) }) }));
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
  // Functional update: the gallery category picker writes after an await, where
  // a `values`-closure read could be stale.
  const setGallery = (i, key, value) =>
    setValues((v) => ({ ...v, gallery: v.gallery.map((g, idx) => (idx === i ? { ...g, [key]: value } : g)) }));
  const removeGallery = (i) => {
    set("gallery", values.gallery.filter((_, idx) => idx !== i));
    // `urlOpen` is keyed by index, so a removal would otherwise leave the toggle
    // attached to whichever card slid into that slot.
    setUrlOpen({});
  };

  // The cover image is simply gallery[0] (both the admin grid and the public
  // PropertyCard read it that way), so "make cover" moves the image to the
  // front rather than introducing a separate coverUrl field to keep in sync.
  const makeCover = (i) => {
    if (i === 0) return;
    setValues((v) => {
      const next = [...v.gallery];
      const [picked] = next.splice(i, 1);
      return { ...v, gallery: [picked, ...next] };
    });
    setUrlOpen({});
  };

  // Image category is a managed list (Lists → Image Categories), with the same
  // inline "+ Add new" affordance as the developer/locality dropdowns.
  const handleGalleryCategory = async (i, val) => {
    if (val === ADD_NEW) {
      const name = window.prompt("New image category:")?.trim();
      if (!name) return;
      try {
        await addListItem(LISTS.galleryCategories, name);
        setLists((l) => ({ ...l, galleryCategories: [...l.galleryCategories, name].sort((a, b) => a.localeCompare(b)) }));
        setGallery(i, "category", name);
      } catch (err) {
        alert(err.message || "Could not add.");
      }
      return;
    }
    setGallery(i, "category", val);
  };

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

  const validate = () => {
    const e = {};
    if (!values.title.trim()) e.title = "Title is required.";
    if (!values.locality) e.locality = "Locality is required.";
    if (values.priceMin === "" || values.priceMin == null) e.priceMin = "Minimum price is required.";
    else if (Number(values.priceMin) < 0) e.priceMin = "Must be 0 or more.";
    if (values.priceMax !== "" && values.priceMax != null && Number(values.priceMax) < Number(values.priceMin))
      e.priceMax = "Max can't be less than min.";
    if (descWords > MAX_DESC_WORDS) e.description = `Description is ${descWords} words — max ${MAX_DESC_WORDS}.`;
    values.nearby.forEach((n, i) => { if (!n.label.trim()) e[`nearby-${i}`] = "Title required."; });
    return e;
  };

  // Derive a unique backend id from the title (append -2, -3… on collision).
  const makeUniqueId = async (base) => {
    const root = base || "property";
    let id = root;
    let n = 2;
    // eslint-disable-next-line no-await-in-loop
    while (await propertyIdExists(id)) { id = `${root}-${n}`; n += 1; }
    return id;
  };

  const buildData = (status) => stripUndefined({
      title: values.title.trim(),
      category: values.category,
      transaction: values.transaction,
      listingType: values.listingType,
      status,
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
      brochure: values.brochure?.url
        ? stripUndefined({
            url: values.brochure.url,
            path: values.brochure.path || undefined,
            name: values.brochure.name || undefined,
            contentType: values.brochure.contentType || undefined,
          })
        : undefined,
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

  // Lifecycle: create (draft, no image needed) → save/publish (need ≥1 image) →
  // unpublish (hidden from the site but kept). Save keeps the current publish
  // state; Publish sets it live; Unpublish hides it.
  const submitForm = async (action) => {
    const e = validate();
    if ((action === "save" || action === "publish") && values.gallery.length === 0) {
      e.gallery = "Please upload at least one image before saving or publishing.";
    }
    setErrors(e);
    if (Object.keys(e).some((k) => e[k])) {
      document.querySelector(".admin-field__err")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    let id = values.id.trim();
    if (!isEdit) {
      id = await makeUniqueId(slugify(values.title));
      setValues((v) => ({ ...v, id, status: "draft" })); // keep the id for the gallery uploader in edit mode
    }
    const status = action === "publish" ? "active" : action === "unpublish" ? "draft" : (isEdit ? values.status : "draft");
    onSubmit(id, buildData(status));
  };

  // Preview renders the live public page off the *current* form state, so it
  // reflects unsaved edits. `id` is only cosmetic here (preview mode never
  // fetches or tracks), but keep it real when we have one.
  if (previewing) {
    return (
      <PropertyPreview
        property={{ id: values.id || "preview", ...buildData(values.status || "draft") }}
        onClose={() => setPreviewing(false)}
        publishing={saving}
        // Publishing straight from preview only makes sense once the listing
        // exists; new ones must be created as drafts first.
        onPublish={isEdit ? () => { setPreviewing(false); submitForm("publish"); } : undefined}
      />
    );
  }

  return (
    <form className="admin-form" onSubmit={(e) => { e.preventDefault(); submitForm(isEdit ? "save" : "create"); }} noValidate>
      {/* --- Basics --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">Basics</h2>
        <div className="admin-grid">
          <Field label="Title *" error={errors.title} wide>
            <input type="text" value={values.title} onChange={(e) => onTitleChange(e.target.value)} />
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
        {isEdit && <p className="admin-muted admin-form__hint" style={{ margin: "0 0 12px" }}>Uploaded images are saved automatically.</p>}
        <ImageUploader
          folder="properties"
          ownerId={values.id}
          accept={GALLERY_TYPES}
          disabled={!isEdit}
          disabledHint="Create the property first, then upload at least one image here."
          onUploaded={onImageUploaded}
        />
        {errors.gallery && <p className="admin-field__err" style={{ margin: "10px 0 0" }}>{errors.gallery}</p>}
        {values.gallery.length > 0 && (
          <p className="admin-muted admin-form__hint admin-gallery__count">
            {values.gallery.length} file{values.gallery.length === 1 ? "" : "s"} — the first one is used as the cover image.
          </p>
        )}
        <div className="admin-gallery-grid">
        {values.gallery.map((g, i) => {
          const isImage = g.contentType ? g.contentType.startsWith("image/") : !/\.pdf$/i.test(g.url || "");
          const showUrl = urlOpen[i];
          return (
            <div key={i} className="admin-gallery-card">
              <div className="admin-gallery-card__media">
                {isImage && g.url
                  ? <img src={g.url} alt="" />
                  : <span className="admin-gallery-card__file"><i className="fa-solid fa-file" aria-hidden="true" /></span>}
                {i === 0 && <span className="admin-gallery-card__cover">Cover</span>}
                {i !== 0 && isImage && (
                  <button
                    type="button"
                    className="admin-gallery-card__setcover"
                    onClick={() => makeCover(i)}
                    title="Use this image as the cover"
                  >
                    <i className="fa-regular fa-star" aria-hidden="true" /> Make cover
                  </button>
                )}
                <button
                  type="button"
                  className="admin-gallery-card__del"
                  onClick={() => removeGallery(i)}
                  aria-label={`Remove image ${i + 1}`}
                  title="Remove"
                >
                  <i className="fa-solid fa-trash" aria-hidden="true" />
                </button>
              </div>

              <div className="admin-gallery-card__body">
                <label className="admin-gallery-card__field">
                  <span>Category</span>
                  <AdminSelect
                    value={g.category || ""}
                    onChange={(v) => handleGalleryCategory(i, v)}
                    placeholder="Category…"
                    options={[
                      ...lists.galleryCategories.map((o) => ({ value: o, label: o })),
                      // Keep a category already saved on this image selectable even
                      // if it has since been removed from the managed list.
                      ...(g.category && !lists.galleryCategories.includes(g.category)
                        ? [{ value: g.category, label: g.category }]
                        : []),
                      { value: ADD_NEW, label: "+ Add new category…" },
                    ]}
                  />
                </label>
                <label className="admin-gallery-card__field">
                  <span>Caption</span>
                  <input type="text" value={g.caption || ""} placeholder="e.g. Grand entrance lobby" onChange={(e) => setGallery(i, "caption", e.target.value)} />
                </label>
                <label className="admin-gallery-card__field">
                  <span>Tag</span>
                  <input type="text" value={g.tag || ""} placeholder="e.g. Artistic Impression" onChange={(e) => setGallery(i, "tag", e.target.value)} />
                </label>

                {/* Storage URLs are long and almost never edited by hand, so the
                    file name stands in for them until "edit" is clicked. */}
                <div className="admin-gallery-card__url">
                  <span className="admin-gallery-card__filename" title={g.url}>
                    <i className="fa-regular fa-image" aria-hidden="true" /> {fileLabel(g)}
                  </span>
                  <button type="button" onClick={() => setUrlOpen((o) => ({ ...o, [i]: !o[i] }))}>
                    {showUrl ? "done" : "edit"}
                  </button>
                </div>
                {showUrl && (
                  <input
                    type="url"
                    className="admin-gallery-card__urlinput"
                    value={g.url || ""}
                    placeholder="File URL"
                    onChange={(e) => setGallery(i, "url", e.target.value)}
                  />
                )}
              </div>
            </div>
          );
        })}
        </div>
      </section>

      {/* --- Brochure --- */}
      <section className="admin-form__section">
        <h2 className="admin-form__legend">
          Brochure <span className="admin-muted">(optional — PDF)</span>
        </h2>
        <p className="admin-muted admin-form__hint" style={{ margin: "0 0 12px" }}>
          Visitors must submit an enquiry before the download starts.
        </p>
        {values.brochure?.url ? (
          <div className="admin-brochure">
            <i className="fa-solid fa-file-pdf admin-brochure__icon" aria-hidden="true" />
            <a
              className="admin-brochure__name"
              href={values.brochure.url}
              target="_blank"
              rel="noopener noreferrer"
              title={values.brochure.url}
            >
              {values.brochure.name || fileLabel(values.brochure)}
            </a>
            <button
              type="button"
              className="admin-btn admin-btn--sm admin-btn--danger"
              onClick={() => set("brochure", null)}
            >
              Remove
            </button>
          </div>
        ) : (
          <ImageUploader
            folder="properties"
            ownerId={values.id}
            accept={BROCHURE_TYPES}
            disabled={!isEdit}
            disabledHint="Create the property first, then upload a brochure here."
            onUploaded={({ url, path, name, contentType }) =>
              set("brochure", { url, path, name, contentType })
            }
          />
        )}
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
        <button type="button" className="admin-btn" onClick={() => setPreviewing(true)} disabled={saving}>
          <i className="fa-solid fa-eye" aria-hidden="true" /> Preview
        </button>
        {isEdit && (values.status === "active" ? (
          <button type="button" className="admin-btn admin-btn--danger-solid" onClick={() => submitForm("unpublish")} disabled={saving}>
            <i className="fa-solid fa-eye-slash" aria-hidden="true" /> Unpublish
          </button>
        ) : (
          <button type="button" className="admin-btn admin-btn--success" onClick={() => submitForm("publish")} disabled={saving}>
            <i className="fa-solid fa-globe" aria-hidden="true" /> Publish
          </button>
        ))}
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create property"}
        </button>
      </div>
    </form>
  );
}
