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
