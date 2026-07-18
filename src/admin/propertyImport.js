// Parsing + validation for the "Import JSON" flow in PropertiesManager.
//
// The rules here deliberately mirror PropertyForm's `validate()`/`buildData()`
// so an imported record behaves exactly like one typed into the form. Two
// severities are reported per record:
//   - errors   → block the import of that record (required field missing/invalid)
//   - warnings → import proceeds, value coerced or dropped (unknown enum, etc.)
import { propertyCategoryOptions, configurationOptions } from "../data/content";

// Taxonomy — kept in sync with PropertyForm.jsx.
export const CATEGORIES = ["residential", "commercial"];
export const TRANSACTIONS = ["rent", "buy", "pre-lease"];
export const LISTING_TYPES = ["rental", "owned", "pre-lease", "land"];
export const PRICE_UNITS = ["Cr", "Lac", "per month", "per sqft"];
export const AREA_UNITS = ["sqft", "sq.yd", "sq.m", "acre"];
export const PURCHASE_TYPES = ["New Booking", "Resale", "Pre-Leased"];
export const PROJECT_STAGES = ["New Launch", "Under Construction", "Ready to Move", "Resale"];
export const NEARBY_CATEGORIES = ["Landmark", "School", "Hospital", "Connectivity", "Shopping", "Business", "Other"];

const MAX_DESC_WORDS = 500;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_RECORDS = 200;

export const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const wordCount = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const stripUndefined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

/** Trimmed string, or undefined when absent/blank/non-scalar. */
const str = (v) => {
  if (v == null || typeof v === "object") return undefined;
  const s = String(v).trim();
  return s || undefined;
};

/**
 * Number from a JSON value that may arrive as a string ("3.15") — the shape
 * hand-authored files usually take. Returns null for values that aren't
 * numeric, so the caller can tell "absent" from "present but garbage".
 */
const num = (v) => {
  if (v === "" || v == null) return undefined;
  if (typeof v === "boolean" || typeof v === "object") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const bool = (v) => {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
};

// Hand-authored files spell these differently from the form's canonical values
// ("Flat" for "Flat/Apartment", "sqyrd" for "sq.yd"). Keys are loose-compared,
// so punctuation and case in the key don't matter.
const ALIASES = {
  // propertyType
  flat: "Flat/Apartment",
  apartment: "Flat/Apartment",
  flatapartment: "Flat/Apartment",
  commercialoffice: "Commercial/Office",
  office: "Commercial/Office",
  showroom: "Commercial/Office",
  retail: "Commercial/Office",
  land: "Plot/Land",
  plot: "Plot/Land",
  plotland: "Plot/Land",
  rowhouse: "Row House",
  // purchaseType
  prelease: "Pre-Leased",
  preleased: "Pre-Leased",
  newbooking: "New Booking",
  // areaUnit
  sqyrd: "sq.yd",
  sqyard: "sq.yd",
  sqyards: "sq.yd",
  squareyard: "sq.yd",
  sqyd: "sq.yd",
  sqm: "sq.m",
  squaremetre: "sq.m",
  sqft: "sqft",
  squarefeet: "sqft",
  acres: "acre",
};

/** Lowercase, strip everything that isn't a letter or digit. */
const loose = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Resolve a value to one of `allowed`, tolerating case, punctuation and the
 * common spellings in ALIASES. Returns undefined when nothing matches.
 */
const matchEnum = (v, allowed) => {
  const s = str(v);
  if (!s) return undefined;
  const exact = allowed.find((a) => a.toLowerCase() === s.toLowerCase());
  if (exact) return exact;
  const l = loose(s);
  const fuzzy = allowed.find((a) => loose(a) === l);
  if (fuzzy) return fuzzy;
  const alias = ALIASES[l];
  return alias && allowed.includes(alias) ? alias : undefined;
};

/** Array of non-blank strings, de-duplicated, order preserved. */
const strList = (v) => {
  if (!Array.isArray(v)) return undefined;
  const out = [];
  v.forEach((item) => {
    const s = str(item);
    if (s && !out.includes(s)) out.push(s);
  });
  return out;
};

const isHttpUrl = (v) => {
  const s = str(v);
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

/**
 * Read + parse an uploaded file into a list of raw records.
 * Accepts either a single property object or an array of them.
 * @returns {Promise<{records: object[]}>} throws Error with a readable message
 */
export async function parseImportFile(file) {
  if (!file) throw new Error("No file selected.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 5 MB.`);
  }
  if (file.size === 0) throw new Error("That file is empty.");

  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`That isn't valid JSON — ${err.message}`);
  }

  const records = Array.isArray(parsed) ? parsed : [parsed];
  if (records.length === 0) throw new Error("The file contains no properties.");
  if (records.length > MAX_RECORDS) {
    throw new Error(`The file has ${records.length} records — the limit is ${MAX_RECORDS} per import.`);
  }
  if (!records.every(isObj)) {
    throw new Error("Every entry must be a property object. Found a value that isn't (a string or number).");
  }
  return { records };
}

// --- per-section normalisers -------------------------------------------------
// Each returns the cleaned value and pushes any problems onto errors/warnings.

function readConfigurations(raw, errors, warnings) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    warnings.push("`configurations` isn't a list — ignored.");
    return [];
  }
  const out = [];
  raw.forEach((c, i) => {
    const at = `configurations[${i}]`;
    if (!isObj(c)) {
      warnings.push(`${at} isn't an object — skipped.`);
      return;
    }
    const config = str(c.config);
    if (!config) {
      warnings.push(`${at} has no \`config\` label — skipped.`);
      return;
    }
    if (!configurationOptions.includes(config)) {
      // Free-text configs are legal in the form ("Custom…"), so this is a note.
      warnings.push(`${at}: "${config}" isn't a standard configuration — kept as custom.`);
    }
    const areaUnit = matchEnum(c.areaUnit, AREA_UNITS);
    if (c.areaUnit != null && !areaUnit) {
      warnings.push(`${at}: unknown areaUnit "${str(c.areaUnit)}" — defaulted to sqft.`);
    }
    const row = { config, areaUnit: areaUnit || "sqft" };
    ["superBuiltupArea", "carpetArea", "usableArea", "otherArea", "price"].forEach((k) => {
      const n = num(c[k]);
      if (n === null) errors.push(`${at}.${k} must be a number.`);
      else if (n !== undefined && n < 0) errors.push(`${at}.${k} can't be negative.`);
      else if (n !== undefined) row[k] = n;
    });
    out.push(row);
  });
  return out;
}

function readTowers(raw, errors, warnings) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    warnings.push("`towers` isn't a list — ignored.");
    return [];
  }
  const out = [];
  raw.forEach((t, i) => {
    const at = `towers[${i}]`;
    if (!isObj(t)) {
      warnings.push(`${at} isn't an object — skipped.`);
      return;
    }
    const name = str(t.name);
    if (!name) {
      warnings.push(`${at} has no \`name\` — skipped.`);
      return;
    }
    const row = stripUndefined({ name, bedroomType: str(t.bedroomType) });
    ["unitsOnFloor", "lifts", "storeys"].forEach((k) => {
      const n = num(t[k]);
      if (n === null) errors.push(`${at}.${k} must be a number.`);
      else if (n !== undefined && n < 0) errors.push(`${at}.${k} can't be negative.`);
      else if (n !== undefined) row[k] = n;
    });
    out.push(row);
  });
  return out;
}

function readNearby(raw, errors, warnings) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    warnings.push("`nearby` isn't a list — ignored.");
    return [];
  }
  const out = [];
  raw.forEach((n, i) => {
    const at = `nearby[${i}]`;
    if (!isObj(n)) {
      warnings.push(`${at} isn't an object — skipped.`);
      return;
    }
    // The form treats a nearby row without a label as a hard error, so match it.
    const label = str(n.label);
    if (!label) {
      errors.push(`${at} needs a \`label\`.`);
      return;
    }
    const category = matchEnum(n.category, NEARBY_CATEGORIES);
    if (n.category != null && !category) {
      warnings.push(`${at}: unknown category "${str(n.category)}" — defaulted to Landmark.`);
    }
    const row = { label, category: category || "Landmark" };
    const km = num(n.distanceKm);
    if (km === null) errors.push(`${at}.distanceKm must be a number.`);
    else if (km !== undefined && km < 0) errors.push(`${at}.distanceKm can't be negative.`);
    else if (km !== undefined) row.distanceKm = km;
    out.push(row);
  });
  return out;
}

function readGallery(raw, errors, warnings) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    warnings.push("`gallery` isn't a list — ignored.");
    return [];
  }
  const out = [];
  raw.forEach((g, i) => {
    const at = `gallery[${i}]`;
    // Allow a bare URL string as shorthand for { url }.
    const item = typeof g === "string" ? { url: g } : g;
    if (!isObj(item)) {
      warnings.push(`${at} isn't an object or URL — skipped.`);
      return;
    }
    const url = str(item.url);
    if (!url) {
      warnings.push(`${at} has no \`url\` — skipped.`);
      return;
    }
    if (!isHttpUrl(url)) {
      errors.push(`${at}.url must be an http(s) URL.`);
      return;
    }
    out.push(stripUndefined({
      url,
      path: str(item.path),
      name: str(item.name),
      contentType: str(item.contentType),
      category: str(item.category),
      caption: str(item.caption),
      tag: str(item.tag),
    }));
  });
  return out;
}

/**
 * Validate + normalise one raw record into the exact shape addProperty expects.
 * @returns {{id: string, title: string, data: object, errors: string[], warnings: string[]}}
 */
export function validateRecord(raw) {
  const errors = [];
  const warnings = [];

  const title = str(raw.title);
  if (!title) errors.push("`title` is required.");

  const locality = str(raw.locality);
  if (!locality) errors.push("`locality` is required.");

  // --- pricing ---
  const priceMin = num(raw.priceMin);
  if (priceMin === null) errors.push("`priceMin` must be a number.");
  else if (priceMin === undefined) errors.push("`priceMin` is required.");
  else if (priceMin < 0) errors.push("`priceMin` must be 0 or more.");

  const priceMax = num(raw.priceMax);
  if (priceMax === null) errors.push("`priceMax` must be a number.");
  else if (priceMax !== undefined && priceMax < 0) errors.push("`priceMax` must be 0 or more.");
  else if (priceMax !== undefined && typeof priceMin === "number" && priceMax < priceMin) {
    errors.push("`priceMax` can't be less than `priceMin`.");
  }

  const priceUnit = matchEnum(raw.priceUnit, PRICE_UNITS);
  if (raw.priceUnit != null && !priceUnit) {
    warnings.push(`Unknown priceUnit "${str(raw.priceUnit)}" — defaulted to Cr.`);
  }

  // --- enums that have a form default ---
  const category = matchEnum(raw.category, CATEGORIES);
  if (raw.category != null && !category) warnings.push(`Unknown category "${str(raw.category)}" — defaulted to residential.`);
  const transaction = matchEnum(raw.transaction, TRANSACTIONS);
  if (raw.transaction != null && !transaction) warnings.push(`Unknown transaction "${str(raw.transaction)}" — defaulted to buy.`);
  const listingType = matchEnum(raw.listingType, LISTING_TYPES);
  if (raw.listingType != null && !listingType) warnings.push(`Unknown listingType "${str(raw.listingType)}" — defaulted to owned.`);

  // --- optional enums: dropped rather than defaulted when unrecognised ---
  // Resolve, then report: unmatched values are dropped, matched-but-respelled
  // values are kept with a note so the admin can see what changed.
  const optionalEnum = (key, allowed) => {
    if (raw[key] == null) return undefined;
    const given = str(raw[key]);
    if (!given) return undefined;
    const matched = matchEnum(given, allowed);
    if (!matched) {
      warnings.push(`${key} "${given}" isn't a standard option — left blank.`);
    } else if (matched !== given) {
      warnings.push(`${key} "${given}" was matched to "${matched}".`);
    }
    return matched;
  };
  const propertyType = optionalEnum("propertyType", propertyCategoryOptions);
  const purchaseType = optionalEnum("purchaseType", PURCHASE_TYPES);
  const projectStage = optionalEnum("projectStage", PROJECT_STAGES);

  const totalUnits = num(raw.totalUnits);
  if (totalUnits === null) errors.push("`totalUnits` must be a number.");
  else if (totalUnits !== undefined && totalUnits < 0) errors.push("`totalUnits` can't be negative.");

  // --- description ---
  const description = str(raw.description) || "";
  const words = wordCount(description);
  if (words > MAX_DESC_WORDS) {
    errors.push(`Description is ${words} words — the limit is ${MAX_DESC_WORDS}.`);
  }

  const videoUrl = str(raw.videoUrl);
  if (videoUrl && !isHttpUrl(videoUrl)) errors.push("`videoUrl` must be an http(s) URL.");

  // --- nested sections ---
  const configurations = readConfigurations(raw.configurations, errors, warnings);
  const towers = readTowers(raw.towers, errors, warnings);
  const nearby = readNearby(raw.nearby, errors, warnings);
  const gallery = readGallery(raw.gallery, errors, warnings);
  if (gallery.length === 0) {
    // Not fatal: the record imports as a draft and can't be published until an
    // image exists, which the manager enforces on publish.
    warnings.push("No images — this will import as a draft and can't be published until you add one.");
  }

  // --- brochure (single downloadable PDF) ---
  let brochure;
  if (raw.brochure != null) {
    // Accept a bare URL string as shorthand for { url }.
    const b = typeof raw.brochure === "string" ? { url: raw.brochure } : raw.brochure;
    if (!isObj(b)) {
      warnings.push("`brochure` isn't an object or URL — ignored.");
    } else {
      const url = str(b.url);
      if (!url) warnings.push("`brochure` has no `url` — ignored.");
      else if (!isHttpUrl(url)) errors.push("`brochure.url` must be an http(s) URL.");
      else {
        brochure = stripUndefined({
          url,
          path: str(b.path),
          name: str(b.name),
          contentType: str(b.contentType),
        });
      }
    }
  }

  const amenities = strList(raw.amenities);
  if (raw.amenities != null && !amenities) warnings.push("`amenities` isn't a list — ignored.");
  const keyFeatures = strList(raw.keyFeatures);
  if (raw.keyFeatures != null && !keyFeatures) warnings.push("`keyFeatures` isn't a list — ignored.");

  // --- rera / location ---
  let rera;
  if (raw.rera != null) {
    if (!isObj(raw.rera)) warnings.push("`rera` isn't an object — ignored.");
    else {
      const qrUrl = str(raw.rera.qrUrl);
      if (qrUrl && !isHttpUrl(qrUrl)) errors.push("`rera.qrUrl` must be an http(s) URL.");
      const r = stripUndefined({ id: str(raw.rera.id), authority: str(raw.rera.authority), qrUrl });
      if (Object.keys(r).length) rera = r;
    }
  }

  let location;
  if (raw.location != null) {
    if (!isObj(raw.location)) warnings.push("`location` isn't an object — ignored.");
    else {
      const mapUrl = str(raw.location.mapUrl);
      if (mapUrl && !isHttpUrl(mapUrl)) errors.push("`location.mapUrl` must be an http(s) URL.");
      const l = stripUndefined({ address: str(raw.location.address), mapUrl });
      if (Object.keys(l).length) location = l;
    }
  }

  // An explicit id is honoured (so re-importing a file targets the same docs);
  // otherwise it's derived from the title exactly as the form does.
  const rawId = str(raw.id);
  const id = slugify(rawId || title || "");
  if (rawId && id !== rawId) warnings.push(`id "${rawId}" was normalised to "${id}".`);

  const data = stripUndefined({
    title,
    category: category || "residential",
    transaction: transaction || "buy",
    listingType: listingType || "owned",
    status: "draft", // imports always land unpublished
    featured: bool(raw.featured) ?? false,
    developer: str(raw.developer),
    locality,
    city: str(raw.city) || "Ahmedabad",
    priceMin: typeof priceMin === "number" ? priceMin : undefined,
    priceMax: typeof priceMax === "number" ? priceMax : undefined,
    priceUnit: priceUnit || "Cr",
    propertyType,
    purchaseType,
    totalArea: str(raw.totalArea),
    possessionDate: str(raw.possessionDate),
    projectStage,
    totalUnits: typeof totalUnits === "number" ? totalUnits : undefined,
    launchDate: str(raw.launchDate),
    description,
    videoUrl,
    configurations,
    towers,
    nearby,
    gallery,
    brochure,
    amenities: amenities || [],
    keyFeatures: keyFeatures || [],
    rera,
    location,
  });

  return { id, title: title || "(untitled)", data, errors, warnings };
}

/**
 * Validate a whole file's worth of records and flag duplicate ids within it —
 * two records sharing an id would otherwise silently overwrite each other.
 */
export function validateRecords(records) {
  const results = records.map((raw, i) => ({ index: i, ...validateRecord(raw) }));
  const seen = new Map();
  results.forEach((r) => {
    if (!r.id) return;
    if (seen.has(r.id)) {
      r.errors.push(`Duplicate id "${r.id}" — also used by record #${seen.get(r.id) + 1}.`);
    } else {
      seen.set(r.id, r.index);
    }
  });
  return results;
}

/** Turn a validated result back into form-shaped values for PropertyForm. */
export function toFormValues(result) {
  return { ...result.data, id: result.id };
}
