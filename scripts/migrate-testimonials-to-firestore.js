// =============================================================================
// ONE-OFF MIGRATION — content.js testimonials → Firestore `testimonials`
// =============================================================================
// Seeds the existing hardcoded testimonials into Firestore so they're managed
// through /admin and rendered from there on the homepage. NOT part of the app
// bundle.
//
// Usage (key path defaults to ./serviceAccountKey.json):
//   node scripts/migrate-testimonials-to-firestore.js
//
// Idempotent: each testimonial is keyed on a slug of the person's name, so
// re-running updates in place rather than duplicating.
// =============================================================================

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { testimonials } from "../src/data/content.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

async function main() {
  await initFirebase();
  const col = getFirestore().collection("testimonials");

  let written = 0;
  for (let i = 0; i < testimonials.length; i += 1) {
    const t = testimonials[i];
    const id = slug(t.name);
    // Stagger createdAt so the homepage marquee (sorted newest-first) keeps the
    // same order the array is written in — first entry stays first.
    const createdAt = new Date(Date.now() - i * 60000);
    await col.doc(id).set(
      {
        name: t.name,
        role: t.role || "",
        quote: t.text,
        photoUrl: "",
        rating: 5,
        featured: false,
        createdAt,
      },
      { merge: true }
    );
    written += 1;
    console.log(`✓ ${id} — ${t.name}`);
  }

  console.log(`\nDone. ${written}/${testimonials.length} testimonials written to Firestore.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
