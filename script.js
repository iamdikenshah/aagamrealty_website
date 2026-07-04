(function () {
  "use strict";

  /* ---------- Navbar scroll shadow ---------- */
  var navbar = document.getElementById("navbar");
  function onScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Hamburger / mobile menu ---------- */
  var hamburger = document.getElementById("hamburger");
  var mobileMenu = document.getElementById("mobileMenu");
  var hamburgerIcon = hamburger.querySelector("i");

  function closeMenu() {
    mobileMenu.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open navigation menu");
    hamburgerIcon.className = "fa-solid fa-bars";
  }
  function openMenu() {
    mobileMenu.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    hamburger.setAttribute("aria-label", "Close navigation menu");
    hamburgerIcon.className = "fa-solid fa-xmark";
  }
  hamburger.addEventListener("click", function () {
    if (mobileMenu.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  // Close on link tap
  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Stats count-up ---------- */
  var statsSection = document.getElementById("stats");
  var counters = document.querySelectorAll(".stat-number");
  var countersStarted = false;

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-target"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1600;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      // easeOutQuad
      var eased = 1 - (1 - progress) * (1 - progress);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && statsSection) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !countersStarted) {
          countersStarted = true;
          counters.forEach(animateCount);
          statObserver.disconnect();
        }
      });
    }, { threshold: 0.35 });
    statObserver.observe(statsSection);
  } else {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute("data-target") + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- Enquiry form -> Google Form ---------- */
  var enquiryForm = document.getElementById("enquiryForm");
  if (enquiryForm) {
    var GOOGLE_FORM_ACTION =
      "https://docs.google.com/forms/d/e/1FAIpQLScqSfnwJp8rWhQUt7Ho_EUaXkP68t_LBRyCfDVJMv8escHotw/formResponse";
    // Site field -> Google Form entry ID (direct mappings)
    var FIELD_MAP = {
      fullName: "entry.959408424",
      whatsapp: "entry.254660384",
      requirement: "entry.2037999976"
    };
    // Property type + free-text both go into the "Additional details" field
    var DETAILS_ENTRY = "entry.1188830922";
    // Preferred Property Location (multi-select) -> free-text field
    var LOCATION_ENTRY = "entry.924428044";

    var statusEl = document.getElementById("formStatus");
    var submitBtn = document.getElementById("enquirySubmit");
    var locationGroup = document.getElementById("locationGroup");

    function getCheckedLocations() {
      return Array.prototype.slice
        .call(enquiryForm.querySelectorAll('input[name="locations"]:checked'))
        .map(function (c) { return c.value; });
    }

    enquiryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = "";
      statusEl.className = "form-status";

      // Validation (text inputs + selects)
      var fields = enquiryForm.querySelectorAll('input:not([type="checkbox"]), select');
      var valid = true;
      fields.forEach(function (f) {
        if (!f.checkValidity()) {
          f.classList.add("invalid");
          if (valid) f.focus();
          valid = false;
        } else {
          f.classList.remove("invalid");
        }
      });

      // At least one preferred location must be selected
      var locations = getCheckedLocations();
      if (locations.length === 0) {
        locationGroup.classList.add("invalid");
        valid = false;
      } else {
        locationGroup.classList.remove("invalid");
      }

      if (!valid) {
        statusEl.textContent = "Please fill in all required fields (including at least one location).";
        statusEl.classList.add("error");
        return;
      }

      // Build payload mapped to Google Form entries
      var data = new FormData();
      Object.keys(FIELD_MAP).forEach(function (name) {
        data.append(FIELD_MAP[name], enquiryForm.elements[name].value);
      });

      // Preferred locations (multi-select) joined into one string
      data.append(LOCATION_ENTRY, locations.join(", "));

      // Combine property type + free text into the Additional details field
      var details = "Property Type: " + enquiryForm.elements["propertyType"].value;
      var freeText = enquiryForm.elements["details"].value.trim();
      if (freeText) details += "\nDetails: " + freeText;
      data.append(DETAILS_ENTRY, details);

      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";

      // no-cors: submission succeeds; response is opaque
      fetch(GOOGLE_FORM_ACTION, { method: "POST", mode: "no-cors", body: data })
        .then(function () {
          statusEl.textContent = "Thank you! Your enquiry has been sent. We'll reach out shortly.";
          statusEl.classList.add("success");
          enquiryForm.reset();
          updateLocationLabel();
          closeLocation();
        })
        .catch(function () {
          statusEl.textContent = "Something went wrong. Please try again or WhatsApp us directly.";
          statusEl.classList.add("error");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.style.opacity = "1";
        });
    });

    // Clear invalid state as the user corrects a field
    enquiryForm.querySelectorAll('input:not([type="checkbox"]), select').forEach(function (f) {
      f.addEventListener("input", function () { f.classList.remove("invalid"); });
      f.addEventListener("change", function () { f.classList.remove("invalid"); });
    });
    // ----- Multi-select dropdown behaviour -----
    var locationTrigger = document.getElementById("locationTrigger");
    var locationValue = document.getElementById("locationValue");

    function updateLocationLabel() {
      var sel = getCheckedLocations();
      if (sel.length === 0) {
        locationValue.textContent = "Select location(s)";
        locationValue.classList.add("placeholder");
      } else {
        locationValue.textContent =
          sel.length <= 2 ? sel.join(", ") : sel.length + " locations selected";
        locationValue.classList.remove("placeholder");
      }
    }

    function openLocation() {
      locationGroup.classList.add("open");
      locationTrigger.setAttribute("aria-expanded", "true");
    }
    function closeLocation() {
      locationGroup.classList.remove("open");
      locationTrigger.setAttribute("aria-expanded", "false");
    }

    locationTrigger.addEventListener("click", function () {
      if (locationGroup.classList.contains("open")) closeLocation();
      else openLocation();
    });
    // Close when clicking outside
    document.addEventListener("click", function (e) {
      if (!locationGroup.contains(e.target)) closeLocation();
    });
    // Close on Escape
    locationGroup.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeLocation(); locationTrigger.focus(); }
    });

    // Update label + clear error as selections change
    enquiryForm.querySelectorAll('input[name="locations"]').forEach(function (c) {
      c.addEventListener("change", function () {
        updateLocationLabel();
        if (getCheckedLocations().length > 0) locationGroup.classList.remove("invalid");
      });
    });
  }

  /* ---------- Marquee pause on touch ---------- */
  var marquee = document.getElementById("marquee");
  if (marquee) {
    marquee.addEventListener("touchstart", function () {
      marquee.classList.add("paused");
    }, { passive: true });
    marquee.addEventListener("touchend", function () {
      marquee.classList.remove("paused");
    }, { passive: true });
  }
})();
