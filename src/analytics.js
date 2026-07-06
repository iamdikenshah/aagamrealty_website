// =============================================================================
// FIREBASE ANALYTICS (Google Analytics 4)
// =============================================================================
// Thin wrapper around Firebase Analytics. Config comes from Vite env vars
// (VITE_FB_*) — copy .env.example to .env.local and fill in the values from your
// Firebase console (Project settings → your web app → SDK config).
//
// The Firebase SDK is loaded with dynamic import() so it lands in its own chunk
// *after* the app's first paint — it never bloats the critical bundle. Events
// fired before the SDK finishes loading are queued and flushed on init.
//
// Nothing here throws or blocks rendering: if the config is missing or the
// browser can't support analytics (private mode, ad-blockers, SSR), every call
// becomes a silent no-op.
//
// Usage:
//   import { track, trackPageView } from "./analytics";
//   track("whatsapp_click", { location: "float" });
// =============================================================================

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
};

let analytics = null;
let logEventFn = null;
// Buffers events fired before the async SDK load finishes, so nothing is dropped
// on the very first page load.
const queue = [];

async function init() {
  // No measurement id → analytics not configured for this build; stay a no-op.
  if (!config.measurementId) {
    if (import.meta.env.DEV) {
      console.warn(
        "[analytics] disabled — VITE_FB_MEASUREMENT_ID is not set. " +
          "Create a .env.local from .env.example with your Firebase config and restart `npm run dev`."
      );
    }
    return;
  }
  try {
    const [{ initializeApp }, { getAnalytics, isSupported, logEvent }] = await Promise.all([
      import("firebase/app"),
      import("firebase/analytics"),
    ]);
    if (!(await isSupported())) return;
    const app = initializeApp(config);
    analytics = getAnalytics(app);
    logEventFn = logEvent;
    // Flush anything queued while the SDK was loading.
    queue.splice(0).forEach(([name, params]) => logEvent(analytics, name, params));
  } catch {
    /* analytics unavailable — ignore */
  }
}

init();

/**
 * Log a custom event. Safe to call anywhere; queues until the SDK is ready and
 * no-ops entirely when analytics isn't configured/supported.
 * @param {string} name    GA4 event name (snake_case).
 * @param {object} [params] Event parameters.
 */
export function track(name, params = {}) {
  // Dev feedback: see every event in the console even before Firebase confirms.
  if (import.meta.env.DEV) console.debug("[analytics]", name, params);
  if (analytics && logEventFn) logEventFn(analytics, name, params);
  else if (config.measurementId) queue.push([name, params]);
}

/** Log a page_view — call on every SPA route change (GA4 only auto-logs the first). */
export function trackPageView(path) {
  track("page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
