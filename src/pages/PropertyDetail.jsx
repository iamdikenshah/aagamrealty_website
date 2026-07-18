import { useEffect, useMemo, useState } from "react";
import { Link, navigate } from "../router.jsx";
import PropertyEnquiryForm from "../components/property/PropertyEnquiryForm";
import PropertyLightbox from "../components/property/PropertyLightbox";
import BrochureModal from "../components/property/BrochureModal";
import PropertyShare from "../components/property/PropertyShare";
import SmartImage from "../components/SmartImage.jsx";
import { track } from "../analytics";
import { whatsappLink, CONTACT_PHONE, propertyUrl } from "../data/content";
import {
  getPropertyById,
  LISTING_TYPE_LABELS,
  formatPriceRange,
  formatConfigPrice,
  amenityIcon,
} from "../data/properties";

// Generic FAQs — editable later / can be moved to the CMS per-listing.
const FAQS = [
  {
    q: "Is this property RERA registered?",
    a: "Where applicable, the RERA registration number is listed in the RERA Details section below. Resale and rental listings may not require RERA registration.",
  },
  {
    q: "Can I schedule a site visit?",
    a: "Absolutely. Submit the enquiry form or message us on WhatsApp and our team will arrange a site visit at a time that suits you.",
  },
  {
    q: "Do you assist with home loans and documentation?",
    a: "Yes. Aagam Realty provides end-to-end support — from loan tie-ups to title verification and registration — at no extra cost to you.",
  },
  {
    q: "Are the prices negotiable?",
    a: "Indicative pricing is shown here. Final pricing depends on the unit, floor and payment plan — our team will share the exact quote on enquiry.",
  },
];

/**
 * Public property page.
 *
 * Normally fetches by `id`. The admin preview passes an unsaved property object
 * as `previewData` instead, which skips the fetch (there may be no document yet)
 * and suppresses analytics and enquiry submission — see `preview`.
 */
export default function PropertyDetail({ id, previewData, preview = false }) {
  const [property, setProperty] = useState(preview ? previewData : undefined); // undefined = loading, null = not found
  const [activeConfig, setActiveConfig] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null); // null = closed, number = open at index
  const [brochureOpen, setBrochureOpen] = useState(false); // enquiry gate for the brochure PDF
  const [cmsFaqs, setCmsFaqs] = useState([]); // CMS-managed FAQs (fall back to the static list)

  useEffect(() => {
    if (preview) {
      setProperty(previewData);
      return undefined;
    }
    let active = true;
    setProperty(undefined);
    setLightboxIndex(null);
    getPropertyById(id).then((p) => {
      if (!active) return;
      setProperty(p);
      if (p) track("property_view", { property_id: p.id, property_title: p.title });
    });
    return () => {
      active = false;
    };
  }, [id, preview, previewData]);

  // Load CMS FAQs on demand (keeps Firestore off this page's critical bundle).
  useEffect(() => {
    let active = true;
    import("../firebase/firestore")
      .then(({ fetchFaqs }) => fetchFaqs())
      .then((list) => { if (active) setCmsFaqs(list); })
      .catch(() => { /* keep the static fallback */ });
    return () => { active = false; };
  }, []);

  const faqItems = cmsFaqs.length ? cmsFaqs.map((f) => ({ q: f.question, a: f.answer })) : FAQS;

  if (property === undefined) {
    return (
      <section className="prop-detail">
        <div className="container prop-detail__loading">Loading…</div>
      </section>
    );
  }

  if (property === null) {
    return (
      <section className="prop-detail">
        <div className="container prop-empty">
          <i className="fa-solid fa-house-circle-xmark" aria-hidden="true" />
          <h3>Property not found</h3>
          <p>This listing may have been removed or the link is incorrect.</p>
          <Link to="/properties" className="btn btn-primary">Browse all properties</Link>
        </div>
      </section>
    );
  }

  const isLand = property.listingType === "land";

  // Open the fullscreen gallery at image `i` and log it.
  const openLightbox = (i) => {
    setLightboxIndex(i);
    if (preview) return; // admin preview must not pollute analytics
    track("gallery_open", {
      property_id: property.id,
      image_index: i,
      image_category: property.gallery?.[i]?.category,
    });
  };

  return (
    <article className="prop-detail">
      <div className="container">
        <nav className="prop-crumbs" aria-label="Breadcrumb">
          <Link to="/properties">Properties</Link>
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          <span>{property.title}</span>
        </nav>

        {/* 1. Hero gallery — driven by the same categorised `gallery` as the lightbox */}
        <Gallery
          images={property.gallery?.map((g) => g.url) ?? []}
          title={property.title}
          onOpen={property.gallery?.length ? openLightbox : undefined}
        />

        {/* 2. Title / type / price */}
        <header className="prop-detail__head">
          <div>
            <span className={`prop-badge prop-badge--${property.listingType}`}>
              {LISTING_TYPE_LABELS[property.listingType]}
            </span>
            <h1 className="prop-detail__title">{property.title}</h1>
            <p className="prop-detail__loc">
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              {property.locality}, {property.city}
              {property.developer && <span className="prop-detail__dev"> · {property.developer}</span>}
            </p>
            <PropertyShare property={property} preview={preview} />
          </div>
          <div className="prop-detail__price">
            <span className="prop-detail__price-label">
              {property.priceUnit === "per month" ? "Rent" : "Price"}
            </span>
            <span className="prop-detail__price-val">{formatPriceRange(property)}</span>
          </div>
        </header>

        <div className="prop-detail__grid">
          {/* ---- Main column ---- */}
          <div className="prop-detail__main">
            {/* 3. Configuration cards */}
            {property.configurations?.length > 0 && (
              <Section id="configs" title={isLand ? "Available Plots" : "Configurations"}>
                <div className="prop-configs">
                  {property.configurations.map((c, i) => (
                    <div className="prop-config" key={`${c.config}-${i}`}>
                      <div className="prop-config__top">
                        <h4>{c.config}</h4>
                        <span className="prop-config__price">{formatConfigPrice(c, property)}</span>
                      </div>
                      <dl className="prop-config__areas">
                        <AreaRow label={isLand ? "Plot area" : "Super built-up"} value={c.superBuiltupArea} unit={c.areaUnit} />
                        {!isLand && <AreaRow label="Carpet area" value={c.carpetArea} unit={c.areaUnit} />}
                        {!isLand && c.usableArea ? <AreaRow label="Usable area" value={c.usableArea} unit={c.areaUnit} /> : null}
                      </dl>
                      {/* Direct contact per configuration — the message/call is
                          scoped to this specific unit type. */}
                      <div className="prop-config__ctas">
                        <a
                          className="btn btn-outline prop-config__cta"
                          href={`tel:${CONTACT_PHONE}`}
                          aria-label={`Call about the ${c.config}`}
                          title={`Call about the ${c.config}`}
                          onClick={() => {
                            setActiveConfig(c.config);
                            if (preview) return;
                            track("contact_click", {
                              method: "phone",
                              location: "property_config",
                              property_id: property.id,
                              configuration: c.config,
                            });
                          }}
                        >
                          <i className="fa-solid fa-phone" aria-hidden="true" />
                        </a>
                        <a
                          className="btn btn-outline prop-config__cta prop-config__cta--wa"
                          href={whatsappLink(
                            `Hi Aagam Realty, I'm interested in the ${c.config} at ${property.title} (${property.locality}). Please share more details.\n\n${propertyUrl(property.id)}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Chat on WhatsApp about the ${c.config}`}
                          title={`Chat on WhatsApp about the ${c.config}`}
                          onClick={() => {
                            setActiveConfig(c.config);
                            if (preview) return;
                            track("whatsapp_click", {
                              location: "property_config",
                              property_id: property.id,
                              configuration: c.config,
                            });
                          }}
                        >
                          <i className="fa-brands fa-whatsapp" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* 5. Overview table */}
            <Section id="overview" title="Overview">
              <table className="prop-table">
                <tbody>
                  <OverviewRow label="Property type" value={property.propertyType} />
                  <OverviewRow label="Purchase type" value={property.purchaseType} />
                  <OverviewRow label="Total area" value={property.totalArea} />
                  {!isLand && <OverviewRow label="Possession" value={property.possessionDate} />}
                  {!isLand && <OverviewRow label="Project stage" value={property.projectStage} />}
                  <OverviewRow label="Total units" value={property.totalUnits} />
                  <OverviewRow label="Launch date" value={property.launchDate} />
                </tbody>
              </table>
            </Section>

            {/* 6. Tower / unit details (skip for land) */}
            {!isLand && property.towers?.length > 0 && (
              <Section id="towers" title="Tower & Unit Details">
                <div className="prop-table-scroll">
                  <table className="prop-table prop-table--grid">
                    <thead>
                      <tr>
                        <th>Tower</th><th>Configuration</th><th>Units / floor</th><th>Lifts</th><th>Storeys</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.towers.map((t) => (
                        <tr key={t.name}>
                          <td>{t.name}</td><td>{t.bedroomType}</td><td>{t.unitsOnFloor}</td>
                          <td>{t.lifts}</td><td>{t.storeys}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* 7. About */}
            {property.description && (
              <Section id="about" title="About this property">
                <p className="prop-prose">{property.description}</p>
              </Section>
            )}

            {/* 8. Key features */}
            {property.keyFeatures?.length > 0 && (
              <Section id="features" title="Key Features">
                <ul className="prop-features">
                  {property.keyFeatures.map((f) => (
                    <li key={f}><i className="fa-solid fa-circle-check" aria-hidden="true" />{f}</li>
                  ))}
                </ul>
              </Section>
            )}

            {/* 9. Amenities */}
            {property.amenities?.length > 0 && (
              <Section id="amenities" title="Amenities">
                <ul className="prop-amenities">
                  {property.amenities.map((a) => (
                    <li key={a}>
                      <span className="prop-amenities__icon"><i className={`fa-solid ${amenityIcon(a)}`} aria-hidden="true" /></span>
                      {a}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* 10. Gallery with category tabs */}
            {property.gallery?.length > 0 && (
              <Section id="gallery" title="Gallery">
                <CategoryGallery gallery={property.gallery} onOpen={openLightbox} />
              </Section>
            )}

            {/* 11. Video */}
            {property.videoUrl && (
              <Section id="video" title="Video">
                <div className="prop-video">
                  <iframe
                    src={property.videoUrl}
                    title={`${property.title} video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </Section>
            )}

            {/* 12. Location map */}
            {property.location && (
              <Section id="location" title="Location">
                <div className="prop-map">
                  <iframe
                    className="prop-map__frame"
                    title={`Map — ${property.location.address}`}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(property.location.address)}&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                  <div className="prop-map__foot">
                    <p className="prop-map__addr">
                      <i className="fa-solid fa-location-dot" aria-hidden="true" />
                      {property.location.address}
                    </p>
                    {property.location.mapUrl && (
                      <a
                        className="btn btn-outline"
                        href={property.location.mapUrl}
                        target="_blank" rel="noopener noreferrer"
                      >
                        <i className="fa-solid fa-map-location-dot" aria-hidden="true" /> Open in Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* 13. What's nearby */}
            {property.nearby?.length > 0 && (
              <Section id="nearby" title="What's Nearby">
                <div className="prop-nearby">
                  {property.nearby.map((n) => (
                    <div className="prop-nearby__card" key={n.label}>
                      <span className="prop-nearby__cat">{n.category}</span>
                      <span className="prop-nearby__label">{n.label}</span>
                      {/* Distance is optional — render nothing (not a bare "km"). */}
                      {n.distanceKm != null && n.distanceKm !== "" && (
                        <span className="prop-nearby__dist">{n.distanceKm} km</span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* 14. RERA */}
            {property.rera?.id && (
              <Section id="rera" title="RERA Details">
                <div className="prop-rera">
                  <div>
                    <p className="prop-rera__label">{property.rera.authority} Registration No.</p>
                    <p className="prop-rera__id">{property.rera.id}</p>
                  </div>
                  <span className="prop-rera__badge"><i className="fa-solid fa-certificate" aria-hidden="true" /> RERA</span>
                </div>
              </Section>
            )}

            {/* 15. FAQ accordion */}
            <Section id="faq" title="Frequently Asked Questions">
              <Faq items={faqItems} />
            </Section>
          </div>

          {/* ---- Sticky enquiry sidebar ---- */}
          <aside className="prop-detail__aside" id="enquire">
            <div className="prop-detail__sticky">
              {/* Brochure sits above the enquiry form because downloading it
                  *is* an enquiry — saying so up front beats surprising the
                  visitor with a form after they click. */}
              {property.brochure?.url && (
                <div className="prop-brochure-card">
                  <i className="fa-solid fa-file-pdf prop-brochure-card__icon" aria-hidden="true" />
                  <div className="prop-brochure-card__text">
                    <strong>Project brochure</strong>
                    <span>Share your details to download</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary prop-brochure-card__btn"
                    onClick={() => setBrochureOpen(true)}
                  >
                    <i className="fa-solid fa-download" aria-hidden="true" /> Download
                  </button>
                </div>
              )}
              <PropertyEnquiryForm property={property} prefillConfig={activeConfig} preview={preview} />
            </div>
          </aside>
        </div>

        <div className="prop-detail__back">
          <button type="button" className="btn btn-outline" onClick={() => navigate("/properties")}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to all properties
          </button>
        </div>
      </div>

      {lightboxIndex !== null && property.gallery?.length > 0 && (
        <PropertyLightbox
          gallery={property.gallery}
          title={property.title}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {brochureOpen && property.brochure?.url && (
        <BrochureModal
          property={property}
          preview={preview}
          onClose={() => setBrochureOpen(false)}
        />
      )}
    </article>
  );
}

// --- Sub-components -----------------------------------------------------------

function Section({ id, title, children }) {
  return (
    <section className="prop-section" id={id}>
      <h2 className="prop-section__title">{title}</h2>
      {children}
    </section>
  );
}

function Gallery({ images = [], title, onOpen }) {
  const [active, setActive] = useState(0);
  if (!images.length) return null;
  return (
    <div className="prop-hero">
      <div className={`prop-hero__main${onOpen ? " prop-hero__main--zoom" : ""}`}>
        <SmartImage
          src={images[active]}
          alt={`${title} — image ${active + 1}`}
          eager
          onClick={onOpen ? () => onOpen(active) : undefined}
          role={onOpen ? "button" : undefined}
        />
        {onOpen && (
          <button type="button" className="prop-hero__expand" onClick={() => onOpen(active)} aria-label="View all photos">
            <i className="fa-solid fa-expand" aria-hidden="true" /> View all photos
          </button>
        )}
        {images.length > 1 && (
          <>
            <button className="prop-hero__nav prop-hero__nav--prev" aria-label="Previous image"
              onClick={() => setActive((a) => (a - 1 + images.length) % images.length)}>
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button className="prop-hero__nav prop-hero__nav--next" aria-label="Next image"
              onClick={() => setActive((a) => (a + 1) % images.length)}>
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="prop-hero__thumbs">
          {images.map((src, i) => (
            <button key={src} className={`prop-hero__thumb${i === active ? " active" : ""}`}
              onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}>
              <SmartImage src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const UNCATEGORISED = "Other";

function GalleryTile({ g, onOpen }) {
  return (
    <button
      type="button"
      className="prop-gallery__item"
      onClick={() => onOpen?.(g.index)}
      aria-label={`View ${g.caption || g.cat}`}
    >
      <SmartImage src={g.url} alt={g.caption || g.cat} />
      <span className="prop-gallery__zoom" aria-hidden="true"><i className="fa-solid fa-magnifying-glass-plus" /></span>
      {/* Skip the caption bar entirely when there is no text for it. */}
      {(g.caption || g.category) && (
        <span className="prop-gallery__cap">{g.caption || g.category}</span>
      )}
    </button>
  );
}

function CategoryGallery({ gallery, onOpen }) {
  // The category field is optional; bucket the blanks rather than letting
  // `undefined` become an empty, unclickable tab pill. Same fallback label the
  // lightbox uses, so the two views agree.
  const items = useMemo(
    () => gallery.map((g, index) => ({ ...g, index, cat: g.category?.trim() || UNCATEGORISED })),
    [gallery]
  );
  const categories = useMemo(() => [...new Set(items.map((g) => g.cat))], [items]);

  const [cat, setCat] = useState("All");
  // The selected category can disappear (images edited/removed) — fall back to
  // "All" rather than showing an empty grid.
  const activeCat = cat === "All" || categories.includes(cat) ? cat : "All";

  // "All" shows every category as its own labelled group; a specific tab shows
  // just that one, ungrouped (the tab already names it).
  const groups =
    activeCat === "All"
      ? categories.map((name) => ({ name, images: items.filter((g) => g.cat === name) }))
      : [{ name: null, images: items.filter((g) => g.cat === activeCat) }];

  return (
    <div>
      {/* One category and no groups to label — nothing to filter, hide the row. */}
      {categories.length > 1 && (
        <div className="prop-gallery__tabs">
          {["All", ...categories].map((c) => (
            <button key={c} type="button" className={`prop-tab${c === activeCat ? " active" : ""}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      {groups.map((group) => (
        <section className="prop-gallery__group" key={group.name || "single"}>
          {/* Headings only make sense when several groups are stacked. */}
          {group.name && groups.length > 1 && (
            <h3 className="prop-gallery__group-title">
              {group.name}
              <span className="prop-gallery__group-count">{group.images.length}</span>
            </h3>
          )}
          <div className="prop-gallery__grid">
            {group.images.map((g) => (
              <GalleryTile key={`${g.url}-${g.index}`} g={g} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="prop-faq">
      {items.map((item, i) => (
        <div className={`prop-faq__item${open === i ? " open" : ""}`} key={item.q}>
          <button type="button" className="prop-faq__q" aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}>
            {item.q}
            <i className="fa-solid fa-chevron-down" aria-hidden="true" />
          </button>
          <div className="prop-faq__a"><p>{item.a}</p></div>
        </div>
      ))}
    </div>
  );
}

function AreaRow({ label, value, unit }) {
  if (value == null) return null;
  return (
    <div className="prop-config__area">
      <dt>{label}</dt>
      <dd>{value.toLocaleString("en-IN")} {unit}</dd>
    </div>
  );
}

function OverviewRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{value}</td>
    </tr>
  );
}
