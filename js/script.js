/* =========================================================
   GOOGLE FORM PREFILL CONFIG
   -----------------------------------------------------------
   To wire this form to a real Google Form:
   1. Create a Google Form with matching fields.
   2. Get the form's "viewform" action URL and replace
      GOOGLE_FORM_BASE_URL below with it (use the
      "formResponse" URL pattern, e.g.
      https://docs.google.com/forms/d/e/FORM_ID/formResponse).
   3. For each field, inspect the form (or use the prefilled
      link feature) to find its real entry ID, then replace
      the placeholder IDs below:
        entry.1111111111 -> Full Name
        entry.2222222222 -> WhatsApp Number
        entry.3333333333 -> Looking To (Rent/Buy/Sell)
        entry.4444444444 -> Property Type
        entry.5555555555 -> Message / Requirements
   ========================================================= */
const GOOGLE_FORM_BASE_URL = "https://docs.google.com/forms/d/e/FORM_ID_PLACEHOLDER/formResponse"; // TODO: Replace with actual Google Form URL
const ENTRY_IDS = {
  fullName: "entry.1111111111",
  whatsapp: "entry.2222222222",
  lookingTo: "entry.3333333333",
  propertyType: "entry.4444444444",
  message: "entry.5555555555"
};

/* ===== NAVBAR SCROLL EFFECT ===== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

/* ===== MOBILE HAMBURGER MENU ===== */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

/* ===== INTERSECTION OBSERVER: FADE-UP ON SCROLL ===== */
const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

fadeEls.forEach(el => observer.observe(el));

/* ===== TOAST NOTIFICATION ===== */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ===== CONTACT FORM VALIDATION ===== */
const enquiryForm = document.getElementById('enquiryForm');
const fullNameInput = document.getElementById('fullName');
const whatsappInput = document.getElementById('whatsapp');
const propertyTypeInput = document.getElementById('propertyType');

const NAME_PATTERN = /^[A-Za-z][A-Za-z\s.'-]{1,49}$/;
const WHATSAPP_PATTERN = /^(\+?91[\s-]?)?[6-9]\d{9}$/;

const VALIDATORS = {
  fullName: {
    input: fullNameInput,
    isValid: (value) => NAME_PATTERN.test(value.trim()),
    message: 'Please enter a valid name (at least 2 letters).'
  },
  whatsapp: {
    input: whatsappInput,
    isValid: (value) => WHATSAPP_PATTERN.test(value.trim().replace(/\s+/g, ' ')),
    message: 'Please enter a valid 10-digit Indian mobile number.'
  },
  propertyType: {
    input: propertyTypeInput,
    isValid: (value) => value !== '',
    message: 'Please select a property type.'
  }
};

function setFieldError(fieldKey, show) {
  const { input, message } = VALIDATORS[fieldKey];
  const formGroup = input.closest('.form-group');
  const errorEl = document.getElementById(`${fieldKey}Error`);
  formGroup.classList.toggle('error', show);
  if (errorEl) errorEl.textContent = show ? message : '';
}

function validateField(fieldKey) {
  const { input, isValid } = VALIDATORS[fieldKey];
  const valid = isValid(input.value);
  setFieldError(fieldKey, !valid);
  return valid;
}

Object.keys(VALIDATORS).forEach((fieldKey) => {
  const { input } = VALIDATORS[fieldKey];
  input.addEventListener('blur', () => validateField(fieldKey));
  input.addEventListener('input', () => {
    if (input.closest('.form-group').classList.contains('error')) {
      validateField(fieldKey);
    }
  });
});

/* ===== CONTACT FORM SUBMISSION ===== */
enquiryForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fieldKeys = Object.keys(VALIDATORS);
  const results = fieldKeys.map(validateField);
  const firstInvalidIndex = results.indexOf(false);

  if (firstInvalidIndex !== -1) {
    VALIDATORS[fieldKeys[firstInvalidIndex]].input.focus();
    showToast('Please fix the highlighted fields.');
    return;
  }

  const fullName = fullNameInput.value.trim();
  const whatsapp = whatsappInput.value.trim();
  const lookingTo = enquiryForm.querySelector('input[name="lookingTo"]:checked')?.value || '';
  const propertyType = propertyTypeInput.value;
  const message = document.getElementById('message').value.trim();

  const params = new URLSearchParams();
  params.append(ENTRY_IDS.fullName, fullName);
  params.append(ENTRY_IDS.whatsapp, whatsapp);
  params.append(ENTRY_IDS.lookingTo, lookingTo);
  params.append(ENTRY_IDS.propertyType, propertyType);
  params.append(ENTRY_IDS.message, message);

  const prefillUrl = `${GOOGLE_FORM_BASE_URL}?${params.toString()}`;

  window.open(prefillUrl, '_blank');

  showToast("Thank you! We'll contact you on WhatsApp shortly. 🎉");
  enquiryForm.reset();
  fieldKeys.forEach((fieldKey) => setFieldError(fieldKey, false));
});
