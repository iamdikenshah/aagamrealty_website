// =============================================================================
// FIREBASE STORAGE — image uploads for the admin CMS
// =============================================================================
// Imported only from the code-split admin app, so firebase/storage never lands
// in the public bundle. Images are stored under:
//   properties/{propertyId}/{filename}
//   testimonials/{testimonialId}/{filename}
// and the public site references the returned download URLs directly.
// =============================================================================

import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "./config";

const storage = app ? getStorage(app) : null;

function assertStorage() {
  if (!storage) {
    throw new Error("Firebase is not configured (missing VITE_FB_* env). Cannot upload images.");
  }
}

// Keep the original name but strip characters that make for awkward Storage
// paths, and prefix a short timestamp so re-uploading a same-named file doesn't
// clobber the previous one.
function safeName(file) {
  const clean = file.name.replace(/[^\w.\-]+/g, "_");
  return `${Date.now()}-${clean}`;
}

/**
 * Upload a file to `{folder}/{ownerId}/{filename}`, reporting progress.
 * @param {string} folder     "properties" | "testimonials"
 * @param {string} ownerId    property or testimonial id
 * @param {File} file
 * @param {(pct:number)=>void} [onProgress]  0–100
 * @returns {Promise<{url:string, path:string}>}
 */
// Every upload lands at a unique, timestamped path and is never overwritten, so
// the stored objects are effectively immutable. Tell browsers + the Storage CDN
// to cache them hard (one year) so repeat visits load from cache instantly.
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

function uploadTo(folder, ownerId, file, onProgress) {
  assertStorage();
  const path = `${folder}/${ownerId}/${safeName(file)}`;
  const task = uploadBytesResumable(ref(storage, path), file, {
    cacheControl: IMMUTABLE_CACHE,
    contentType: file.type || undefined,
  });
  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      }
    );
  });
}

/** Upload a property image; resolves to { url, path }. */
export function uploadPropertyImage(file, propertyId, onProgress) {
  return uploadTo("properties", propertyId, file, onProgress);
}

/** Upload a testimonial image; resolves to { url, path }. */
export function uploadTestimonialImage(file, testimonialId, onProgress) {
  return uploadTo("testimonials", testimonialId, file, onProgress);
}

/**
 * Delete an image by its Storage path (e.g. "properties/abc/123-photo.jpg").
 * Swallows not-found errors so cleaning up an already-removed file is safe.
 * @param {string} path
 */
export async function deleteImage(path) {
  assertStorage();
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    if (err?.code !== "storage/object-not-found") throw err;
  }
}
