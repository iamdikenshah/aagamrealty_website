// =============================================================================
// ONE-OFF — seed CMS-managed reference lists from existing data
// =============================================================================
// Populates the developers / localities / amenities / keyFeatures collections so
// the admin dropdowns (and the public locality controls) have sensible values
// from day one. NOT part of the app bundle.
//
// Usage (key path defaults to ./serviceAccountKey.json):
//   node scripts/seed-reference-lists.js
//
// Idempotent: items are keyed on a slug of their name, so re-running merges.
// =============================================================================

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { locationOptions } from "../src/data/content.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../src/data/properties.json");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const uniqSorted = (arr) => [...new Set(arr.filter((s) => s && s.trim()))].sort((a, b) => a.localeCompare(b));

async function initFirebase() {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT || resolve(__dirname, "../serviceAccountKey.json");
  try {
    const serviceAccount = JSON.parse(await readFile(resolve(keyPath), "utf8"));
    return initializeApp({ credential: cert(serviceAccount) });
  } catch (err) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return initializeApp({ credential: applicationDefault() });
    throw new Error(
      `Could not read a service-account key at "${keyPath}". Set FIREBASE_SERVICE_ACCOUNT ` +
        `or place the key at ./serviceAccountKey.json. (${err.message})`
    );
  }
}

async function seedList(db, coll, names) {
  const batch = db.batch();
  for (const name of names) {
    batch.set(
      db.collection(coll).doc(slug(name)),
      { name, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
  console.log(`✓ ${coll}: ${names.length} item(s)`);
}

async function main() {
  const properties = JSON.parse(await readFile(DATA_PATH, "utf8"));

  const developers = uniqSorted(properties.map((p) => p.developer));
  const localities = uniqSorted([...locationOptions.filter((l) => l !== "Other"), ...properties.map((p) => p.locality)]);
  const amenities = uniqSorted(properties.flatMap((p) => p.amenities || []));
  const keyFeatures = uniqSorted(properties.flatMap((p) => p.keyFeatures || []));

  await initFirebase();
  const db = getFirestore();

  await seedList(db, "developers", developers);
  await seedList(db, "localities", localities);
  await seedList(db, "amenities", amenities);
  await seedList(db, "keyFeatures", keyFeatures);

  console.log("\nDone seeding reference lists.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
