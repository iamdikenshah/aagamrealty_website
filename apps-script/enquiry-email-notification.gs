/**
 * Aagam Realty — email notification for every website enquiry.
 * =============================================================
 * This runs in Google Apps Script (NOT in the website bundle). Both the main
 * enquiry form and the property-detail enquiry form POST to the same Google
 * Form, so a single "On form submit" trigger on the linked Google Sheet emails
 * you a nicely formatted summary for every lead.
 *
 * The renderer is generic: it lists every non-empty question/answer pair from
 * the submission, so it keeps working even if you add, rename or reorder form
 * questions later. onEnquirySubmit works whether the project is bound to the
 * Form (event carries a FormResponse) or to the responses Sheet (event carries
 * the appended row) — so it can live in the same project as the form-setup code.
 *
 * ── SETUP (one time) ──────────────────────────────────────────────────────
 *  1. Open the Apps Script project (Form → ⋮ → Script editor, or the Sheet →
 *     Extensions → Apps Script). Paste this file in as a new file. Save.
 *  2. Triggers (clock icon on the left) → Add Trigger:
 *        • Function to run:   onEnquirySubmit
 *        • Deployment:        Head
 *        • Event source:      From form   (form-bound)  — or
 *                             From spreadsheet   (sheet-bound)
 *        • Event type:        On form submit
 *     Save, then approve the Google authorization prompt (it needs permission
 *     to send email as you). An *installable* trigger is required — a plain
 *     onFormSubmit simple trigger can't send mail.
 *  3. Test: submit the website form once and check your inbox.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ── Config ──────────────────────────────────────────────────────────────────
var NOTIFY_TO = "shah.diken@gmail.com"; // where lead notifications are sent
var BRAND = {
  name: "Aagam Realty",
  navy: "#1B2A4A",
  gold: "#C9A34E",
  bg: "#f4f5f7",
  // Light logo (for the dark header). Hosted on the live site; Gmail loads it.
  logo: "https://aagamrealty.com/images/app_logo_footer.png",
};

/**
 * Installable "On form submit" trigger entry point. Handles both a form-bound
 * event (e.response is a FormResponse) and a sheet-bound event (e.values +
 * e.range), so it runs correctly in either kind of Apps Script project.
 * @param {GoogleAppsScript.Events.FormsOnFormSubmit|GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
function onEnquirySubmit(e) {
  if (!e) return; // ignore manual/empty runs
  var extracted = e.response ? fromFormEvent(e) : fromSheetEvent(e);
  if (!extracted || !extracted.rows.length) return;

  var rows = extracted.rows;
  var submittedAt = extracted.submittedAt;

  // Fuzzy-match the key fields for the subject line and the highlight card.
  var find = function (re) {
    for (var j = 0; j < rows.length; j++) if (re.test(rows[j].label)) return rows[j].value;
    return "";
  };
  var name = find(/name/i);
  var phone = find(/whatsapp|phone|mobile|contact/i);
  var email = find(/e-?mail/i);
  var requirement = find(/requirement|looking\s*for/i);

  var subject = "New property enquiry" + (name ? " — " + name : "") +
    (requirement ? " (" + requirement + ")" : "");

  var options = {
    htmlBody: renderEmail({ rows: rows, name: name, phone: phone, email: email, submittedAt: submittedAt }),
    name: BRAND.name + " Website",
  };
  // Reply-To lets you reply straight to the lead when they left an email.
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) options.replyTo = email;

  MailApp.sendEmail(NOTIFY_TO, subject, plainText(rows, submittedAt), options);
}

/**
 * MANUAL TEST — run this from the editor (Run ▸ sendTestEmail) to debug delivery.
 * It sends a sample notification to NOTIFY_TO directly, bypassing the trigger.
 *   • First run pops the Google authorization prompt — Allow it (this grants the
 *     mail-sending permission, which the form-setup code never needed).
 *   • Get the test email → mail works; any "no email" problem is the TRIGGER
 *     (check Triggers ⏰ and the Executions log). Don't get it → check the
 *     Executions log for the error (usually authorization or send quota).
 */
function sendTestEmail() {
  var rows = [
    { label: "Full Name", value: "Test Lead" },
    { label: "WhatsApp Number", value: "+919876543210" },
    { label: "Email", value: "test@example.com" },
    { label: "Requirement Type", value: "Residential Buy" },
    { label: "Additional Details", value: "This is a test of the enquiry notifier." },
  ];
  var submittedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  MailApp.sendEmail(NOTIFY_TO, "New property enquiry — Test Lead (TEST)", plainText(rows, submittedAt), {
    htmlBody: renderEmail({ rows: rows, name: "Test Lead", phone: "+919876543210", email: "test@example.com", submittedAt: submittedAt }),
    name: BRAND.name + " Website",
  });
  Logger.log("Test email sent to " + NOTIFY_TO + " — check your inbox (and Spam).");
}

/**
 * Form-bound "On form submit": the event carries a FormResponse. Read each
 * answered question's title + value (only answered items are present).
 */
function fromFormEvent(e) {
  var items = e.response.getItemResponses();
  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var label = String(items[i].getItem().getTitle() || "").trim();
    var ans = items[i].getResponse();
    // Checkbox / grid answers come back as arrays — flatten to a readable list.
    var value = Array.isArray(ans) ? ans.join(", ") : String(ans == null ? "" : ans).trim();
    if (label && value) rows.push({ label: label, value: value });
  }
  var ts = e.response.getTimestamp();
  var submittedAt = ts
    ? Utilities.formatDate(ts, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")
    : "";
  return { rows: rows, submittedAt: submittedAt };
}

/**
 * Sheet-bound "On form submit": the event carries the appended row (e.values)
 * and its range. Pair each column header with its value; drop empties and the
 * Sheet's automatic Timestamp column (shown separately in the footer).
 */
function fromSheetEvent(e) {
  if (!e.values || !e.range) return null;
  var sheet = e.range.getSheet();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = e.values;
  var rows = [];
  var submittedAt = "";
  for (var i = 0; i < headers.length; i++) {
    var label = String(headers[i] == null ? "" : headers[i]).trim();
    var value = String(values[i] == null ? "" : values[i]).trim();
    if (!label || !value) continue;
    if (/timestamp/i.test(label)) { submittedAt = value; continue; }
    rows.push({ label: label, value: value });
  }
  return { rows: rows, submittedAt: submittedAt };
}

// ── Rendering ────────────────────────────────────────────────────────────────

/** Plain-text fallback for email clients that don't render HTML. */
function plainText(rows, submittedAt) {
  var lines = rows.map(function (r) { return r.label + ": " + r.value; });
  if (submittedAt) lines.push("Submitted: " + submittedAt);
  return "New property enquiry\n\n" + lines.join("\n");
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
        '<img src="' + BRAND.logo + '" alt="' + esc(BRAND.name) + '" width="150" ' +
          'style="display:block;border:0;outline:none;text-decoration:none;height:auto;margin:0 0 14px;">' +
        '<div style="color:#ffffff;font-size:20px;font-weight:700;">New Property Enquiry</div>' +
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
