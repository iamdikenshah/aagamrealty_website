// =============================================================================
// BUILD STEP — pre-render static HTML shells for known deep routes
// =============================================================================
// GitHub Pages serves a file only where one exists on disk; every other path
// falls through to 404.html (HTTP 404, no Open Graph tags). Social crawlers
// (WhatsApp/Facebook/LinkedIn) don't run the SPA's JS redirect, so a shared
// deep link like /enquiry gets no metadata and shows a stale/garbage preview.
//
// The homepage previews correctly only because a real dist/index.html is served
// at 200 with full OG tags. This script gives the same treatment to fixed deep
// routes: it copies the freshly built dist/index.html (already carrying the
// hashed asset tags Vite injected) into dist/<route>/index.html, swapping the
// title/description/canonical/OG/Twitter meta for that route. GitHub Pages then
// serves aagamrealty.com/<route> as a real 200 page with correct preview data,
// and the SPA boots identically because the body/scripts are untouched.
//
// Runs automatically after `vite build` (see package.json). Add a route by
// dropping another entry in ROUTES below.
// =============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "../dist");
const SITE = "https://aagamrealty.com";

// One shell per crawlable deep route. `path` is the URL path (no leading slash).
const ROUTES = [
  {
    path: "enquiry",
    title: "Send an Enquiry — Aagam Realty | Real Estate Agent in Ahmedabad",
    description:
      "Tell Aagam Realty what you're looking for — rent, buy, pre-lease or plots in Ahmedabad. Share your requirement and our team will get back to you.",
    ogTitle: "Send an Enquiry — Aagam Realty",
    ogDescription:
      "Share your property requirement — rent, buy, pre-lease or plots in Ahmedabad — and Aagam Realty will get back to you.",
  },
  {
    path: "terms",
    title: "Terms & Conditions — Aagam Realty",
    description:
      "The terms and conditions governing the use of the Aagam Realty website and enquiry service.",
    ogTitle: "Terms & Conditions — Aagam Realty",
    ogDescription:
      "The terms governing use of the Aagam Realty website and enquiry service.",
  },
  {
    path: "privacy",
    title: "Privacy Policy — Aagam Realty",
    description:
      "How Aagam Realty collects, uses, and protects your personal data, and your rights under the Digital Personal Data Protection Act, 2023.",
    ogTitle: "Privacy Policy — Aagam Realty",
    ogDescription:
      "How Aagam Realty collects, uses, and protects your personal data.",
  },
];

// Replace the `content="..."` (or href) of a tag matched by `attr="value"`.
// Anchored on the identifying attribute so only the intended tag is touched.
function setAttr(html, identifier, targetAttr, value) {
  const re = new RegExp(
    `(${identifier}[^>]*?${targetAttr}=")[^"]*(")`,
    "i"
  );
  if (!re.test(html)) throw new Error(`prerender: no match for ${identifier} / ${targetAttr}`);
  return html.replace(re, `$1${value}$2`);
}

const source = await readFile(resolve(dist, "index.html"), "utf8");

for (const route of ROUTES) {
  const url = `${SITE}/${route.path}`;
  let html = source;

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${route.title}</title>`);
  html = setAttr(html, 'name="description"', "content", route.description);
  html = setAttr(html, 'rel="canonical"', "href", url);
  html = setAttr(html, 'property="og:title"', "content", route.ogTitle);
  html = setAttr(html, 'property="og:description"', "content", route.ogDescription);
  html = setAttr(html, 'property="og:url"', "content", url);
  html = setAttr(html, 'name="twitter:title"', "content", route.ogTitle);
  html = setAttr(html, 'name="twitter:description"', "content", route.ogDescription);

  const outDir = resolve(dist, route.path);
  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, "index.html"), html, "utf8");
  console.log(`prerender: wrote dist/${route.path}/index.html → ${url}`);
}

// =============================================================================
// Per-property shells — so a shared /property/<id> link previews with that
// listing's own cover photo, title and price instead of the generic site card.
//
// Reads published listings with the *client* SDK and the public VITE_FB_* config
// (the same values the browser uses, supplied to CI as repo secrets). No service
// account is needed: the security rules already allow anyone to read a listing
// whose status isn't "draft", which is exactly the set we want to publish.
//
// Best-effort — if the config is absent or Firestore is unreachable, the build
// still succeeds and those links simply fall back to the site-wide preview.
// =============================================================================

const truncate = (s, n) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
};

// Meta values land inside double-quoted attributes, so the quote and the
// HTML specials have to go.
const attrEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const PRICE_UNIT_SUFFIX = { Cr: "Cr", Lac: "Lac", "per month": "/month", "per sqft": "/sqft" };

function priceLabel(p) {
  if (p.priceMin == null) return "";
  const unit = PRICE_UNIT_SUFFIX[p.priceUnit] || p.priceUnit || "";
  const range =
    p.priceMax != null && p.priceMax !== p.priceMin ? `${p.priceMin} – ${p.priceMax}` : `${p.priceMin}`;
  return `₹${range} ${unit}`.trim();
}

async function prerenderProperties() {
  // In CI the VITE_* vars arrive as real env vars; locally they live in
  // .env.local, which Vite reads for the client build but Node does not. Merge
  // both so `npm run build` produces the same shells either way.
  const { loadEnv } = await import("vite");
  const env = { ...loadEnv("production", resolve(__dirname, ".."), "VITE_"), ...process.env };

  const cfg = {
    apiKey: env.VITE_FB_API_KEY,
    authDomain: env.VITE_FB_AUTH_DOMAIN,
    projectId: env.VITE_FB_PROJECT_ID,
    storageBucket: env.VITE_FB_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FB_MESSAGING_SENDER_ID,
    appId: env.VITE_FB_APP_ID,
  };
  if (!cfg.apiKey || !cfg.projectId) {
    console.warn("prerender: no VITE_FB_* config — skipping per-property shells.");
    return;
  }

  const { initializeApp } = await import("firebase/app");
  const { getFirestore, collection, query, where, getDocs } = await import("firebase/firestore");

  const db = getFirestore(initializeApp(cfg));
  // Rules reject an unconstrained public list, so mirror the client's filter.
  const snap = await getDocs(query(collection(db, "properties"), where("status", "!=", "draft")));

  let written = 0;
  for (const docSnap of snap.docs) {
    const p = { id: docSnap.id, ...docSnap.data() };
    const cover = p.gallery?.[0]?.url;
    if (!cover) {
      console.warn(`prerender: "${p.id}" has no cover image — skipped (would preview worse than the default).`);
      continue;
    }

    const place = [p.locality, p.city].filter(Boolean).join(", ");
    const price = priceLabel(p);
    const title = `${p.title}${place ? ` — ${place}` : ""} | Aagam Realty`;
    const description = truncate(
      p.description || `${p.title} in ${place}.${price ? ` ${price}.` : ""}`,
      160
    );
    const ogTitle = `${p.title}${price ? ` — ${price}` : ""}`;
    const ogDescription = truncate(
      [place, p.propertyType, p.projectStage].filter(Boolean).join(" · ") || description,
      200
    );
    const url = `${SITE}/property/${encodeURIComponent(p.id)}`;

    let html = source;
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${attrEscape(title)}</title>`);
    html = setAttr(html, 'name="description"', "content", attrEscape(description));
    html = setAttr(html, 'rel="canonical"', "href", url);
    html = setAttr(html, 'property="og:title"', "content", attrEscape(ogTitle));
    html = setAttr(html, 'property="og:description"', "content", attrEscape(ogDescription));
    html = setAttr(html, 'property="og:url"', "content", url);
    html = setAttr(html, 'property="og:image"', "content", attrEscape(cover));
    html = setAttr(html, 'property="og:image:alt"', "content", attrEscape(p.title));
    html = setAttr(html, 'name="twitter:title"', "content", attrEscape(ogTitle));
    html = setAttr(html, 'name="twitter:description"', "content", attrEscape(ogDescription));
    html = setAttr(html, 'name="twitter:image"', "content", attrEscape(cover));
    // The default dimensions/type describe the site card, not this photo.
    // Wrong values stop WhatsApp rendering the image at all, so drop them.
    html = html.replace(/\s*<meta property="og:image:(?:width|height|type)"[^>]*>/gi, "");
    // og:type=website is right for the site; a listing is a product-ish page.
    html = setAttr(html, 'property="og:type"', "content", "article");

    const outDir = resolve(dist, "property", p.id);
    await mkdir(outDir, { recursive: true });
    await writeFile(resolve(outDir, "index.html"), html, "utf8");
    written += 1;
  }
  console.log(`prerender: wrote ${written} property shell(s) under dist/property/`);
}

try {
  await prerenderProperties();
} catch (err) {
  // Never fail the deploy over preview metadata.
  console.warn(`prerender: per-property shells skipped — ${err.message}`);
}
