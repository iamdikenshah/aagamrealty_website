// Central content for the site — edit copy here without touching component code.

// "What We Deal In" — two top-level categories (Residential / Commercial), each
// with the four ways we can help (Rent, Buy, Pre-Lease, Land/Plot). Every
// offering deep-links straight into the matching listing view.
export const dealCategories = [
  {
    key: "residential",
    label: "Residential",
    icon: "fa-house-chimney",
    blurb: "Homes to live in or invest in — flats, villas, bungalows and plots.",
    offerings: [
      { label: "Rent", icon: "fa-key", to: "/properties?category=residential&transaction=rent" },
      { label: "Buy", icon: "fa-house", to: "/properties?category=residential&transaction=buy" },
      { label: "Pre-Lease", icon: "fa-file-signature", to: "/properties?category=residential&transaction=pre-lease" },
      { label: "Land / Plot", icon: "fa-map-location-dot", to: "/properties?category=residential&listingType=land" },
    ],
  },
  {
    key: "commercial",
    label: "Commercial",
    icon: "fa-building",
    blurb: "Offices, shops, showrooms & pre-leased assets for business and returns.",
    offerings: [
      { label: "Rent", icon: "fa-key", to: "/properties?category=commercial&transaction=rent" },
      { label: "Buy", icon: "fa-store", to: "/properties?category=commercial&transaction=buy" },
      { label: "Pre-Lease", icon: "fa-file-signature", to: "/properties?category=commercial&transaction=pre-lease" },
      { label: "Land / Plot", icon: "fa-map-location-dot", to: "/properties?category=commercial&listingType=land" },
    ],
  },
];

export const stats = [
  { target: 150, suffix: "+", label: "Properties Sold & Rented" },
  { target: 9, suffix: "+", label: "Years of Experience" },
  { target: 200, suffix: "+", label: "Happy Clients" },
  { target: 50, suffix: "+", label: "Ongoing Listings" },
];

export const testimonials = [
  {
    text: "Aagam Realty made buying our first home completely stress-free. Every document was verified and explained clearly. Highly recommended!",
    name: "Rohan Mehta",
    role: "Property Buyer",
  },
  {
    text: "Found a 2BHK rental within my budget in just a week. The whole process was smooth and completely transparent. Thank you so much!",
    name: "Priya Sharma",
    role: "Tenant",
  },
  {
    text: "I invested in a pre-leased office space and the returns have been exactly as promised. Professional, honest, and reliable service.",
    name: "Anil Deshmukh",
    role: "Investor",
  },
  {
    text: "Bought a residential plot with clear title and zero hassles. Their documentation support saved me weeks of running around. Excellent!",
    name: "Sneha Patel",
    role: "Plot Owner",
  },
  {
    text: "Genuine guidance and no hidden charges. They understood exactly what my family needed and delivered beyond expectations.",
    name: "Vikram Nair",
    role: "Home Buyer",
  },
  {
    text: "As an NRI, I was worried about renting out my flat. Aagam Realty handled everything end-to-end. Truly a client-first approach!",
    name: "Meera Iyer",
    role: "Property Owner",
  },
];

export const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#featured", label: "Properties" },
  { href: "#about", label: "About" },
  { href: "#testimonials", label: "Testimonials" },
];

// Locality quick-links for the footer (SEO). Each deep-links into the listing
// page pre-filtered to that locality. Kept to localities we actually list.
export const footerLocalities = [
  "Adani Shantigram",
  "Bopal",
  "South Bopal",
  "Satellite",
  "SG Highway",
  "Prahlad Nagar",
  "CG Road",
  "Shela",
];

export const requirementOptions = ["Buy", "Rent", "Pre-Lease"];

// Top-level segment for the enquiry form. Combined with the requirement on
// submit (e.g. "Commercial Buy") so a single value captures both.
export const segmentOptions = ["Residential", "Commercial"];

export const propertyCategoryOptions = [
  "Flat/Apartment",
  "Villa",
  "Bungalow",
  "Row House",
  "Plot/Land",
  "Commercial/Office",
];

// Which property categories are offered under each segment, so the category
// dropdown only shows what's relevant once a segment is picked.
export const propertyCategoriesBySegment = {
  Residential: ["Flat/Apartment", "Villa", "Bungalow", "Row House", "Plot/Land"],
  Commercial: ["Commercial/Office", "Plot/Land"],
};

// Categories for which a BHK configuration is relevant. Plot/Land and
// Commercial/Office are intentionally excluded — the Configuration field is
// hidden for those.
export const bhkCategories = [
  "Flat/Apartment",
  "Villa",
  "Bungalow",
  "Row House",
];

export const configurationOptions = [
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4 BHK",
  "4+ BHK",
];

// Budget ranges swap depending on the requirement type (Rent uses monthly rent
// bands, Buy/Pre-Lease use sale-price bands).
export const buyBudgetOptions = [
  "Under ₹50L",
  "₹50L – ₹1Cr",
  "₹1Cr – ₹2Cr",
  "₹2Cr – ₹5Cr",
  "₹5Cr+",
];

export const rentBudgetOptions = [
  "Under ₹15,000/month",
  "₹15,000 – ₹30,000/month",
  "₹30,000 – ₹50,000/month",
  "₹50,000 – ₹1,00,000/month",
  "₹1,00,000+/month",
];

export const purposeOptions = ["Self-use", "Investment"];

export const timelineOptions = [
  "Immediate",
  "1–3 months",
  "3–6 months",
  "Just exploring",
];

export const furnishingOptions = ["Furnished", "Semi-furnished", "Unfurnished"];

export const sourceOptions = [
  "Instagram",
  "Facebook",
  "Google Search",
  "Referral",
  "Signboard/Walk-in",
  "Other",
];

export const locationOptions = [
  "Bopal",
  "South Bopal",
  "SG Highway",
  "Satellite",
  "Prahlad Nagar",
  "Bodakdev",
  "Thaltej",
  "Shela",
  "Gota",
  "Other",
];

// Google Form endpoint + entry-id mappings (from the original site).
export const GOOGLE_FORM = {
  action:
    "https://docs.google.com/forms/d/e/1FAIpQLScqSfnwJp8rWhQUt7Ho_EUaXkP68t_LBRyCfDVJMv8escHotw/formResponse",
  fields: {
    fullName: "entry.959408424",
    whatsapp: "entry.254660384",
    requirement: "entry.2037999976",
    email: "entry.1412848508",
    propertyCategory: "entry.721090552",
    configuration: "entry.1067735460",
    budget: "entry.1797993296",
    purpose: "entry.1991310664",
    timeline: "entry.1796205361",
    furnishing: "entry.1482183831",
    source: "entry.1159073300",
    consent: "entry.1849267595",
  },
  detailsEntry: "entry.1188830922",
  locationEntry: "entry.924428044",
};

export const WHATSAPP_NUMBER = "919227100299";

/** Build a wa.me deep-link that pre-fills the chat with `text`. */
export const whatsappLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const WHATSAPP_LINK = whatsappLink("Hi Aagam Realty, I'm interested in a property.");
