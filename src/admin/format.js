// Small presentational helpers shared across admin pages (Dashboard, Enquiries,
// Testimonials). Pure functions — no Firebase, no React.

/** Firestore Timestamp | Date | undefined → Date | null. */
export function toDate(ts) {
  return ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
}

/** Absolute, readable date-time (e.g. "7 Jul 2026, 4:12 pm"). */
export function formatDateTime(ts) {
  const d = toDate(ts);
  return d ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
}

/** Compact relative time, e.g. "just now", "5m ago", "3h ago", "2d ago". */
export function timeAgo(ts) {
  const d = toDate(ts);
  if (!d) return "";
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Up to two uppercase initials from a name ("Riya Shah" → "RS"). */
export function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// A small palette of on-brand-adjacent gradients. A stable hash of the seed
// picks one so each person keeps the same avatar colour across renders.
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #1B2A4A, #2A4270)",
  "linear-gradient(135deg, #3a2c66, #6d4bb0)",
  "linear-gradient(135deg, #0f5c4d, #1f9e7e)",
  "linear-gradient(135deg, #8a5a12, #d99a2b)",
  "linear-gradient(135deg, #7a2740, #c0506e)",
  "linear-gradient(135deg, #14496e, #2f86c0)",
];

export function avatarGradient(seed) {
  const s = seed || "";
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}
