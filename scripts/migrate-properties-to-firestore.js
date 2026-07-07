// =============================================================================
// ONE-OFF MIGRATION — src/data/properties.json → Firestore `properties`
// =============================================================================
// Seeds the Firestore `properties` collection from the bundled JSON so the site
// (which now reads from Firestore) has data to show. NOT part of the app bundle.
//
// Usage:
//   FIREBASE_SERVICE_ACCOUNT=/abs/path/to/serviceAccountKey.json \
//     node scripts/migrate-properties-to-firestore.js
//
// The service-account key is read from an env var and must NEVER be committed
// (download it from Firebase console → Project settings → Service accounts →
// Generate new private key). GOOGLE_APPLICATION_CREDENTIALS is also honoured if
// FIREBASE_SERVICE_ACCOUNT is not set.
//
// Idempotent: each listing is written with merge:true keyed on its existing id,
// so re-running updates in place rather than duplicating.
// =============================================================================

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../src/data/properties.json");

// Core fields we expect on every listing — a missing one is worth flagging but
// not fatal (the full record is stored as-is either way).
const RECOMMENDED = ["title", "category", "transaction", "listingType", "locality", "priceUnit"];

async function initFirebase() {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (keyPath) {
    const serviceAccount = JSON.parse(await readFile(resolve(keyPath), "utf8"));
    return initializeApp({ credential: cert(serviceAccount) });
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ credential: applicationDefault() });
  }
  throw new Error(
    "No credentials. Set FIREBASE_SERVICE_ACCOUNT (path to a service-account key JSON) " +
      "or GOOGLE_APPLICATION_CREDENTIALS and try again."
  );
}

async function main() {
  const raw = await readFile(DATA_PATH, "utf8");
  const properties = JSON.parse(raw);
  if (!Array.isArray(properties)) throw new Error("properties.json is not an array.");

  await initFirebase();
  const db = getFirestore();
  const col = db.collection("properties");

  let written = 0;
  for (const entry of properties) {
    const { id, ...rest } = entry;
    if (!id) {
      console.warn("⚠️  Skipping a listing with no `id`:", rest.title || "(untitled)");
      continue;
    }

    const missing = RECOMMENDED.filter((f) => rest[f] == null || rest[f] === "");
    if (missing.length) {
      console.warn(`⚠️  "${id}" is missing recommended field(s): ${missing.join(", ")}`);
    }

    const existing = await col.doc(id).get();
    await col.doc(id).set(
      {
        ...rest,
        status: rest.status || "active",
        // Preserve createdAt on re-runs; always refresh updatedAt.
        createdAt: existing.exists ? existing.get("createdAt") || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    written += 1;
    console.log(`✓ ${existing.exists ? "Updated" : "Created"} ${id}`);
  }

  console.log(`\nDone. ${written}/${properties.length} listings written to Firestore.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
