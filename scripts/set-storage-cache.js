// =============================================================================
// ONE-OFF — backfill Cache-Control on existing Storage images
// =============================================================================
// New uploads from the admin CMS already set a long, immutable Cache-Control
// (see src/firebase/storage.js), so browsers and the Storage CDN cache them for
// a year. Images uploaded BEFORE that change have no such header and won't be
// cached hard. This script stamps the same header onto every existing object so
// they load instantly on repeat visits too.
//
// Safe to re-run: it skips objects that already have the target header.
// Objects are immutable (unique, timestamped paths), so caching them is safe.
//
// Usage (key path defaults to ./serviceAccountKey.json):
//   node scripts/set-storage-cache.js
//   FIREBASE_STORAGE_BUCKET=my-app.appspot.com node scripts/set-storage-cache.js
//   node scripts/set-storage-cache.js --dry-run
// =============================================================================

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const dryRun = process.argv.includes("--dry-run");

async function initFirebase() {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT || resolve(__dirname, "../serviceAccountKey.json");
  let serviceAccount = null;
  try {
    serviceAccount = JSON.parse(await readFile(resolve(keyPath), "utf8"));
  } catch (err) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error(
        `Could not read a service-account key at "${keyPath}". Set FIREBASE_SERVICE_ACCOUNT ` +
          `to the key path, or place it at ./serviceAccountKey.json. (${err.message})`
      );
    }
  }

  // Bucket: explicit env wins, else derive from the project id in the key.
  const projectId = serviceAccount?.project_id;
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.VITE_FB_STORAGE_BUCKET ||
    (projectId ? `${projectId}.appspot.com` : undefined);

  if (!storageBucket) {
    throw new Error("No storage bucket. Set FIREBASE_STORAGE_BUCKET (e.g. my-app.appspot.com).");
  }

  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    storageBucket,
  });
  return storageBucket;
}

async function main() {
  const bucketName = await initFirebase();
  const bucket = getStorage().bucket();
  console.log(`Scanning gs://${bucketName} …${dryRun ? " (dry run)" : ""}`);

  const [files] = await bucket.getFiles();
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const [meta] = await file.getMetadata();
    if (meta.cacheControl === CACHE_CONTROL) {
      skipped++;
      continue;
    }
    if (dryRun) {
      console.log(`  would update  ${file.name}  (was: ${meta.cacheControl || "none"})`);
    } else {
      await file.setMetadata({ cacheControl: CACHE_CONTROL });
      console.log(`  ✓ ${file.name}`);
    }
    updated++;
  }

  console.log(
    `\nDone. ${dryRun ? "Would update" : "Updated"} ${updated} object(s), ${skipped} already cached.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err.message || err);
  process.exit(1);
});
