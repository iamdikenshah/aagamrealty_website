// =============================================================================
// ONE-OFF — seed the `faqs` collection with the site's existing generic FAQs
// =============================================================================
// Usage (key path defaults to ./serviceAccountKey.json):
//   node scripts/seed-faqs.js
// Idempotent: keyed on a slug of the question, so re-running merges.
// =============================================================================

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const FAQS = [
  {
    question: "Do you help with buying, renting and pre-leasing?",
    answer:
      "Yes. Aagam Realty handles residential and commercial deals across Ahmedabad — resale, new bookings, rentals and pre-leased assets — end to end.",
  },
  {
    question: "Can I schedule a site visit?",
    answer:
      "Absolutely. Submit the enquiry form or message us on WhatsApp and our team will arrange a site visit at a time that suits you.",
  },
  {
    question: "Do you assist with home loans and documentation?",
    answer:
      "Yes. Aagam Realty provides end-to-end support — from loan tie-ups to title verification and registration — at no extra cost to you.",
  },
  {
    question: "Are the prices negotiable?",
    answer:
      "Indicative pricing is shown on each listing. Final pricing depends on the unit, floor and payment plan — our team shares the exact quote on enquiry.",
  },
];

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
  const col = getFirestore().collection("faqs");

  for (let i = 0; i < FAQS.length; i += 1) {
    const f = FAQS[i];
    // Stagger createdAt so they keep this order (list is sorted oldest-first).
    const createdAt = new Date(Date.now() - (FAQS.length - i) * 60000);
    await col.doc(slug(f.question)).set({ ...f, createdAt }, { merge: true });
    console.log(`✓ ${f.question}`);
  }
  console.log(`\nDone. ${FAQS.length} FAQs written.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
