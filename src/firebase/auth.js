// =============================================================================
// FIREBASE AUTH — single admin account (email/password)
// =============================================================================
// Imported only from the code-split admin app, so firebase/auth never lands in
// the public bundle. There is no self-signup / registration flow by design: the
// one admin account is created once in the Firebase console, and admin write
// access is gated by a custom claim (admin == true) in firestore.rules.
// =============================================================================

import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { app } from "./config";

const auth = app ? getAuth(app) : null;

function assertAuth() {
  if (!auth) {
    throw new Error("Firebase is not configured (missing VITE_FB_* env). Cannot authenticate.");
  }
}

// Fan-out registry over Firebase auth state. We keep our own listener set (fed by
// a single onAuthStateChanged) so we can ALSO push profile changes — updateProfile
// does not re-fire onAuthStateChanged, yet the top bar / greeting must update.
const listeners = new Set();
let currentUser = null;
let resolved = false; // true once Firebase has reported the initial state
let started = false;

function emit(user) {
  currentUser = user;
  resolved = true;
  listeners.forEach((cb) => cb(user));
}

function ensureStarted() {
  if (started || !auth) return;
  started = true;
  onAuthStateChanged(auth, emit);
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
  ensureStarted();
  listeners.add(callback);
  // Replay the known state to late subscribers, but not a premature `null`
  // before Firebase has restored the session (that would bounce to /login).
  if (resolved) callback(currentUser);
  return () => listeners.delete(callback);
}

/**
 * Update the signed-in admin's profile (currently just their display name) and
 * notify all auth subscribers so the UI reflects it immediately.
 * @param {{ displayName?: string }} profile
 */
export async function updateAdminProfile({ displayName }) {
  assertAuth();
  if (!auth.currentUser) throw new Error("You're signed out. Please sign in again.");
  await updateProfile(auth.currentUser, { displayName: (displayName ?? "").trim() });
  await auth.currentUser.reload();
  emit(auth.currentUser);
}
