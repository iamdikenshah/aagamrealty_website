// =============================================================================
// FIREBASE AUTH — single admin account (email/password)
// =============================================================================
// Imported only from the code-split admin app, so firebase/auth never lands in
// the public bundle. There is no self-signup / registration flow by design: the
// one admin account is created once in the Firebase console, and admin write
// access is gated by a custom claim (admin == true) in firestore.rules.
// =============================================================================

import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "./config";

const auth = app ? getAuth(app) : null;

function assertAuth() {
  if (!auth) {
    throw new Error("Firebase is not configured (missing VITE_FB_* env). Cannot authenticate.");
  }
}

/**
 * Sign the admin in with email + password.
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export function signIn(email, password) {
  assertAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

/** Sign the admin out. */
export function signOutAdmin() {
  assertAuth();
  return signOut(auth);
}

/**
 * Subscribe to auth-state changes. Calls `callback(user|null)` immediately with
 * the current state and on every change. Returns an unsubscribe function.
 * @param {(user: import("firebase/auth").User|null) => void} callback
 * @returns {() => void}
 */
export function subscribeToAuthState(callback) {
  if (!auth) {
    // Unconfigured build: treat as signed-out, no listener to clean up.
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
