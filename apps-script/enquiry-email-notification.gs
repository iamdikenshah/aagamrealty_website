/**
 * Aagam Realty — email notification for every website enquiry.
 * =============================================================
 * This runs in Google Apps Script (NOT in the website bundle). Both the main
 * enquiry form and the property-detail enquiry form POST to the same Google
 * Form, so a single "On form submit" trigger on the linked Google Sheet emails
 * you a nicely formatted summary for every lead.
 *
 * The renderer is generic: it reads the Sheet's header row and shows every
 * non-empty question/answer pair, so it keeps working even if you add, rename
 * or reorder form questions later.
 *
 * ── SETUP (one time) ──────────────────────────────────────────────────────
 *  1. Open the Google Sheet that collects this form's responses.
 *  2. Extensions → Apps Script.
 *  3. Paste this whole file in, replacing the default Code.gs. Save.
 *  4. Triggers (clock icon on the left) → Add Trigger:
 *        • Function to run:            onEnquirySubmit
 *        • Deployment:                 Head
 *        • Event source:               From spreadsheet
 *        • Event type:                 On form submit
 *     Save, then approve the Google authorization prompt (it needs permission
 *     to send email as you). An *installable* trigger is required — a plain
 *     onFormSubmit simple trigger can't send mail.
 *  5. Test: submit the website form once (or use "Run → onEnquirySubmit" after
 *     a real submission exists) and check your inbox.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ── Config ──────────────────────────────────────────────────────────────────
var NOTIFY_TO = "shah.diken@gmail.com"; // where lead notifications are sent
var BRAND = {
  name: "Aagam Realty",
  navy: "#1B2A4A",
  gold: "#C9A34E",
  bg: "#f4f5f7",
};

/**
 * Installable "On form submit" trigger entry point.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
function onEnquirySubmit(e) {
  if (!e || !e.values || !e.range) return; // ignore manual/empty runs

  var sheet = e.range.getSheet();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = e.values;

  // Pair each column header with the submitted value; drop empties and the
  // Sheet's automatic Timestamp column (shown separately in the footer).
  var rows = [];
  var submittedAt = "";
  for (var i = 0; i < headers.length; i++) {
    var label = String(headers[i] == null ? "" : headers[i]).trim();
    var value = String(values[i] == null ? "" : values[i]).trim();
    if (!label || !value) continue;
    if (/timestamp/i.test(label)) { submittedAt = value; continue; }
    rows.push({ label: label, value: value });
  }

  // Fuzzy-match the key fields for the subject line and the highlight card.
  var find = function (re) {
    for (var j = 0; j < rows.length; j++) if (re.test(rows[j].label)) return rows[j].value;
    return "";
  };
  var name = find(/name/i);
  var phone = find(/whatsapp|phone|mobile|contact/i);
  var email = find(/e-?mail/i);
  var requirement = find(/requirement|looking\s*for/i);

  var subject = "New enquiry" + (name ? " — " + name : "") +
    (requirement ? " (" + requirement + ")" : "");

  var options = {
    htmlBody: renderEmail({ rows: rows, name: name, phone: phone, email: email, submittedAt: submittedAt }),
    name: BRAND.name + " Website",
  };
  // Reply-To lets you reply straight to the lead when they left an email.
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) options.replyTo = email;

  MailApp.sendEmail(NOTIFY_TO, subject, plainText(rows, submittedAt), options);
}

// ── Rendering ────────────────────────────────────────────────────────────────

/** Plain-text fallback for email clients that don't render HTML. */
function plainText(rows, submittedAt) {
  var lines = rows.map(function (r) { return r.label + ": " + r.value; });
  if (submittedAt) lines.push("Submitted: " + submittedAt);
  return "New website enquiry\n\n" + lines.join("\n");
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Branded, mobile-friendly HTML email. Uses table layout + inline styles so it
 * renders consistently across Gmail, Apple Mail and Outlook.
 */
function renderEmail(data) {
  var name = data.name || "New enquiry";
  var phone = data.phone || "";
  var email = data.email || "";
  var digits = phone.replace(/\D/g, "");

  // Action buttons (only render the ones we have contact details for).
  var btns = [];
  if (digits) {
    btns.push(button("https://wa.me/" + digits, "💬 WhatsApp", "#25D366", "#ffffff"));
    btns.push(button("tel:" + phone, "📞 Call", "#ffffff", BRAND.navy, "1px solid #d7dbe3"));
  }
  if (email) {
    btns.push(button("mailto:" + email, "✉️ Email", "#ffffff", BRAND.navy, "1px solid #d7dbe3"));
  }
  var buttonsHtml = btns.length
    ? '<tr><td style="padding:6px 24px 22px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
        btns.map(function (b) { return '<td style="padding-right:10px;">' + b + '</td>'; }).join("") +
        '</tr></table></td></tr>'
    : "";

  // Highlight card: name + clickable phone/email.
  var contactBits = [];
  if (phone) contactBits.push('<a href="tel:' + esc(phone) + '" style="color:' + BRAND.navy + ';text-decoration:none;font-weight:600;">' + esc(phone) + '</a>');
  if (email) contactBits.push('<a href="mailto:' + esc(email) + '" style="color:' + BRAND.navy + ';text-decoration:none;">' + esc(email) + '</a>');
  var contactLine = contactBits.length
    ? '<div style="margin-top:6px;font-size:14px;color:#374151;">' + contactBits.join(' &nbsp;·&nbsp; ') + '</div>'
    : "";

  // Full detail table.
  var detailRows = data.rows.map(function (r, idx) {
    var bg = idx % 2 ? "#ffffff" : "#fafbfc";
    return '<tr style="background:' + bg + ';">' +
      '<td style="padding:11px 16px;border-bottom:1px solid #eef0f3;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.03em;width:42%;vertical-align:top;">' + esc(r.label) + '</td>' +
      '<td style="padding:11px 16px;border-bottom:1px solid #eef0f3;color:#111827;font-size:14px;font-weight:500;white-space:pre-wrap;">' + esc(r.value) + '</td>' +
    '</tr>';
  }).join("");

  var footer = data.submittedAt
    ? '<tr><td style="padding:16px 24px;color:#9aa1ac;font-size:12px;">Submitted ' + esc(data.submittedAt) + ' · via aagamrealty.com</td></tr>'
    : '<tr><td style="padding:16px 24px;color:#9aa1ac;font-size:12px;">via aagamrealty.com</td></tr>';

  return '' +
  '<div style="margin:0;padding:24px 12px;background:' + BRAND.bg + ';font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(16,24,40,.08);">' +
      // Header bar
      '<tr><td style="background:' + BRAND.navy + ';padding:22px 24px;">' +
        '<div style="color:' + BRAND.gold + ';font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">' + esc(BRAND.name) + '</div>' +
        '<div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:4px;">New Website Enquiry</div>' +
      '</td></tr>' +
      // Contact highlight
      '<tr><td style="padding:22px 24px 6px;">' +
        '<div style="font-size:18px;font-weight:700;color:' + BRAND.navy + ';">' + esc(name) + '</div>' +
        contactLine +
      '</td></tr>' +
      buttonsHtml +
      // Details
      '<tr><td style="padding:0 24px 8px;">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef0f3;border-radius:10px;overflow:hidden;">' +
          detailRows +
        '</table>' +
      '</td></tr>' +
      footer +
    '</table>' +
  '</div>';
}

/** A rounded, inline-styled anchor "button" (email-client safe). */
function button(href, label, bg, color, border) {
  return '<a href="' + esc(href) + '" style="display:inline-block;padding:10px 16px;border-radius:8px;' +
    'background:' + bg + ';color:' + color + ';font-size:14px;font-weight:600;text-decoration:none;' +
    (border ? 'border:' + border + ';' : '') + '">' + label + '</a>';
}
