// =============================================================================
// ONE-OFF — grant the admin custom claim to the single admin account
// =============================================================================
// The security rules (firestore.rules / storage.rules) allow writes only when
// request.auth.token.admin == true. Creating the user in Firebase Auth is not
// enough — you must stamp that claim on the account once with this script.
//
// Prereq: create the admin user first in Firebase console → Authentication →
// Users → Add user (email + password).
//
// Usage (key path defaults to ./serviceAccountKey.json):
//   node scripts/set-admin-claim.js admin@aagamrealty.com
//   node scripts/set-admin-claim.js admin@aagamrealty.com --remove   # revoke
//
// After running, the admin must SIGN OUT and back IN once so their new ID token
// carries the claim.
// =============================================================================

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const __dirname = dirname(fileURLToPath(import.meta.url));

const email = process.argv[2];
const remove = process.argv.includes("--remove");

if (!email || email.startsWith("--")) {
  console.error("Usage: node scripts/set-admin-claim.js <email> [--remove]");
  process.exit(1);
}

async function initFirebase() {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT || resolve(__dirname, "../serviceAccountKey.json");
  try {
    const serviceAccount = JSON.parse(await readFile(resolve(keyPath), "utf8"));
    return initializeApp({ credential: cert(serviceAccount) });
  } catch (err) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return initializeApp({ credential: applicationDefault() });
    throw new Error(
      `Could not read a service-account key at "${keyPath}". Set FIREBASE_SERVICE_ACCOUNT ` +
        `to the key path, or place it at ./serviceAccountKey.json. (${err.message})`
    );
  }
}

async function main() {
  await initFirebase();
  const auth = getAuth();

  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, remove ? { admin: false } : { admin: true });

  console.log(
    `✓ ${remove ? "Removed admin claim from" : "Granted admin claim to"} ${email} (uid: ${user.uid}).`
  );
  if (!remove) console.log("→ Have that user sign out and back in so the new token carries admin: true.");
  process.exit(0);
}

main().catch((err) => {
  if (err?.code === "auth/user-not-found") {
    console.error(
      `No Auth user with email "${email}". Create it first in Firebase console → Authentication → Users → Add user.`
    );
  } else {
    console.error("Failed:", err.message || err);
  }
  process.exit(1);
});
