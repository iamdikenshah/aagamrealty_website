// =============================================================================
// FIRESTORE DATA ACCESS — one section per collection
// =============================================================================
// Low-level Firestore reads/writes for `properties`, `testimonials` and
// `enquiries`. The public property pages don't call this module directly — they
// go through ../data/properties.js, which keeps the existing getProperties()/
// getPropertyById() contract and applies the same filtering it always has. This
// module just fetches the raw documents (and powers the admin CRUD).
//
// Documents are stored in the FULL existing property shape (see
// ../data/properties.json); the Firestore doc id becomes the `id` field, so the
// object handed back is shape-identical to the old bundled JSON records.
// =============================================================================

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { app, isConfigured } from "./config";

// Firestore handle, or null when Firebase isn't configured for this build. This
// module is loaded on demand (dynamic import from the public data layer, static
// import from the admin chunk), which is what keeps the Firestore SDK off the
// public site's critical bundle.
const db = app ? getFirestore(app) : null;

const PROPERTIES = "properties";
const TESTIMONIALS = "testimonials";
const ENQUIRIES = "enquiries";
const FAQS = "faqs";

// CMS-managed reference lists (dropdown sources), each a simple {name} collection.
export const LISTS = {
  developers: "developers",
  localities: "localities",
  amenities: "amenities",
  keyFeatures: "keyFeatures",
};

// Attach the Firestore doc id as `id` (matches the old JSON records) and drop
// Firestore Timestamp objects' methods by leaving them as-is — callers that need
// a Date can call .toDate(); the public UI never reads createdAt/updatedAt.
const withId = (snap) => ({ id: snap.id, ...snap.data() });

// Newest-first comparator tolerant of Firestore Timestamps, Dates, or missing
// values (docs written before serverTimestamp resolved, or seeded without one).
const millis = (ts) => (ts?.toMillis ? ts.toMillis() : ts instanceof Date ? ts.getTime() : 0);
const byNewest = (a, b) => millis(b.createdAt) - millis(a.createdAt);
const byOldest = (a, b) => millis(a.createdAt) - millis(b.createdAt);

function assertDb() {
  if (!db) {
    throw new Error(
      "Firebase is not configured (missing VITE_FB_* env). Cannot reach Firestore."
    );
  }
}

// -----------------------------------------------------------------------------
// PROPERTIES
// -----------------------------------------------------------------------------

/**
 * Fetch all publicly-visible listings (everything except drafts). Ordered
 * newest-first. Returns records in the existing property shape.
 * @returns {Promise<object[]>}
 */
export async function fetchProperties() {
  assertDb();
  // The where("status","!=","draft") constraint is required — not just a filter:
  // Firestore security rules reject a public *list* query that could match a
  // draft, so the query itself must exclude them. Ordering is done client-side to
  // avoid a composite index (a `!=` inequality can't be combined with orderBy on
  // a different field without one).
  const q = query(collection(db, PROPERTIES), where("status", "!=", "draft"));
  const snap = await getDocs(q);
  return snap.docs.map(withId).sort(byNewest);
}

/**
 * Fetch a single listing by id, or null if missing / draft / unreadable.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function fetchPropertyById(id) {
  assertDb();
  try {
    const snap = await getDoc(doc(db, PROPERTIES, id));
    if (!snap.exists()) return null;
    const data = withId(snap);
    return data.status === "draft" ? null : data;
  } catch {
    // A rules-denied read on a draft surfaces as an error — treat as not found.
    return null;
  }
}

/** Admin: every listing including drafts, newest-first. */
export async function getAllProperties() {
  assertDb();
  const snap = await getDocs(collection(db, PROPERTIES));
  return snap.docs.map(withId).sort(byNewest);
}

/** Admin: does a listing already exist with this id? (uniqueness check) */
export async function propertyIdExists(id) {
  assertDb();
  const snap = await getDoc(doc(db, PROPERTIES, id));
  return snap.exists();
}

/**
 * Admin: create a listing under an explicit, human-meaningful id (used as the
 * Firestore doc id AND the Storage folder for its images). Returns the id.
 * @param {string} id    slug, e.g. "shantigram-skyline"
 * @param {object} data
 */
export async function addProperty(id, data) {
  assertDb();
  const { id: _omit, ...rest } = data;
  await setDoc(doc(db, PROPERTIES, id), {
    status: "active",
    ...rest,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

/** Admin: update a listing. `id` (and any createdAt) are never overwritten. */
export async function updateProperty(id, data) {
  assertDb();
  const { id: _omit, createdAt: _omit2, ...rest } = data;
  await updateDoc(doc(db, PROPERTIES, id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

/** Admin: delete a listing. */
export async function deleteProperty(id) {
  assertDb();
  await deleteDoc(doc(db, PROPERTIES, id));
}

// -----------------------------------------------------------------------------
// TESTIMONIALS
// -----------------------------------------------------------------------------

/** Public: all testimonials, newest-first. */
export async function fetchTestimonials() {
  assertDb();
  const snap = await getDocs(collection(db, TESTIMONIALS));
  return snap.docs.map(withId).sort(byNewest);
}

/** Admin alias — same data, kept explicit for symmetry with properties. */
export const getTestimonials = fetchTestimonials;

export async function addTestimonial(data) {
  assertDb();
  const ref = await addDoc(collection(db, TESTIMONIALS), {
    featured: false,
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTestimonial(id, data) {
  assertDb();
  const { id: _omit, createdAt: _omit2, ...rest } = data;
  await updateDoc(doc(db, TESTIMONIALS, id), rest);
}

export async function deleteTestimonial(id) {
  assertDb();
  await deleteDoc(doc(db, TESTIMONIALS, id));
}

// -----------------------------------------------------------------------------
// ENQUIRIES
// -----------------------------------------------------------------------------

/**
 * Public: record a website enquiry. Called (best-effort) alongside the existing
 * Google Form submission so the admin inbox and the sheet stay in sync. The
 * `source` field lets a future WhatsApp/CRM integration write into the same
 * collection with a different value without a schema change.
 * @param {{name:string, phone:string, email?:string, message?:string, propertyId?:string|null}} data
 */
export async function addEnquiry(data) {
  if (!isConfigured || !db) return; // no-op when Firebase isn't configured
  await addDoc(collection(db, ENQUIRIES), {
    name: data.name ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    message: data.message ?? "",
    propertyId: data.propertyId ?? null,
    source: "website",
    status: "new",
    createdAt: serverTimestamp(),
  });
}

/**
 * Admin: manually log a lead that arrived off the website (phone, walk-in,
 * WhatsApp, referral…). Same collection + shape as website enquiries so it shows
 * up in the inbox alongside them, plus a few optional CRM fields (budget,
 * follow-up date) that older/website docs simply don't carry.
 * @param {{
 *   name:string, phone:string, email?:string, message?:string,
 *   propertyId?:string|null, source?:string,
 *   status?:"new"|"contacted"|"closed", budget?:string, followUpAt?:Date|null
 * }} data
 */
export async function addEnquiryAdmin(data) {
  assertDb();
  const doc = {
    name: (data.name ?? "").trim(),
    phone: (data.phone ?? "").trim(),
    email: (data.email ?? "").trim(),
    message: (data.message ?? "").trim(),
    propertyId: data.propertyId || null,
    source: data.source || "manual",
    status: data.status || "new",
    createdAt: serverTimestamp(),
  };
  // Only persist the optional CRM fields when they carry a value, so docs stay
  // clean and the inbox can treat their absence as "not set".
  const budget = (data.budget ?? "").trim();
  if (budget) doc.budget = budget;
  if (data.followUpAt instanceof Date && !isNaN(data.followUpAt)) {
    doc.followUpAt = Timestamp.fromDate(data.followUpAt);
  }
  const ref = await addDoc(collection(db, ENQUIRIES), doc);
  return ref.id;
}

/** Admin: all enquiries, newest-first. */
export async function getEnquiries() {
  assertDb();
  const snap = await getDocs(collection(db, ENQUIRIES));
  return snap.docs.map(withId).sort(byNewest);
}

/**
 * Admin: move an enquiry through its lifecycle.
 * @param {string} id
 * @param {"new"|"contacted"|"closed"} status
 */
export async function markEnquiryHandled(id, status) {
  assertDb();
  await updateDoc(doc(db, ENQUIRIES, id), { status });
}

// -----------------------------------------------------------------------------
// REFERENCE LISTS — developers / localities / amenities / keyFeatures
// -----------------------------------------------------------------------------
// Generic CRUD reused for every managed dropdown list. `coll` is one of LISTS.*.
// Public callers use getNames() (dynamic-imported) to populate dropdowns; the
// admin "Lists" hub uses the full CRUD.

/** Admin: all items in a list ({id, name, createdAt}), alphabetical by name. */
export async function getListItems(coll) {
  assertDb();
  const snap = await getDocs(collection(db, coll));
  return snap.docs.map(withId).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

/**
 * Public: just the names in a list, sorted. Returns [] (never throws) when
 * Firebase is unconfigured or the read fails, so callers can fall back cleanly.
 * @param {string} coll  one of LISTS.*
 * @returns {Promise<string[]>}
 */
export async function getNames(coll) {
  if (!isConfigured || !db) return [];
  try {
    const snap = await getDocs(collection(db, coll));
    return snap.docs
      .map((d) => d.get("name"))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/** Admin: add an item. Rejects blanks and (case-insensitive) duplicates. */
export async function addListItem(coll, name) {
  assertDb();
  const value = String(name || "").trim();
  if (!value) throw new Error("Name can't be empty.");
  const existing = await getListItems(coll);
  if (existing.some((i) => i.name.toLowerCase() === value.toLowerCase())) {
    throw new Error(`"${value}" is already in the list.`);
  }
  const ref = await addDoc(collection(db, coll), { name: value, createdAt: serverTimestamp() });
  return ref.id;
}

/** Admin: rename an item. */
export async function updateListItem(coll, id, name) {
  assertDb();
  const value = String(name || "").trim();
  if (!value) throw new Error("Name can't be empty.");
  await updateDoc(doc(db, coll, id), { name: value });
}

/** Admin: delete an item. */
export async function deleteListItem(coll, id) {
  assertDb();
  await deleteDoc(doc(db, coll, id));
}

// -----------------------------------------------------------------------------
// FAQS — { question, answer, createdAt }, shown on the homepage & property pages
// -----------------------------------------------------------------------------

/** Public: all FAQs in creation order. Returns [] (never throws) on failure. */
export async function fetchFaqs() {
  if (!isConfigured || !db) return [];
  try {
    const snap = await getDocs(collection(db, FAQS));
    return snap.docs.map(withId).sort(byOldest);
  } catch {
    return [];
  }
}

/** Admin: all FAQs in creation order. */
export async function getFaqs() {
  assertDb();
  const snap = await getDocs(collection(db, FAQS));
  return snap.docs.map(withId).sort(byOldest);
}

/** Admin: create a FAQ. */
export async function addFaq(data) {
  assertDb();
  const ref = await addDoc(collection(db, FAQS), {
    question: data.question ?? "",
    answer: data.answer ?? "",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Admin: update a FAQ. */
export async function updateFaq(id, data) {
  assertDb();
  const { id: _omit, createdAt: _omit2, ...rest } = data;
  await updateDoc(doc(db, FAQS, id), rest);
}

/** Admin: delete a FAQ. */
export async function deleteFaq(id) {
  assertDb();
  await deleteDoc(doc(db, FAQS, id));
}
