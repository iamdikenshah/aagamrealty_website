# Enquiry email notifications (Google Apps Script)

Emails **shah.diken@gmail.com** a nicely formatted summary every time someone
submits an enquiry on the website.

## Why it lives here

Both website forms — the main [Enquiry form](../src/components/Enquiry.jsx) and
the [property-detail form](../src/components/property/PropertyEnquiryForm.jsx) —
POST to the **same Google Form**. Its responses land in a Google Sheet. A single
"On form submit" trigger on that Sheet covers every enquiry, with zero backend
and no Firebase billing.

The script ([`enquiry-email-notification.gs`](./enquiry-email-notification.gs))
is kept in the repo as the source of truth, but it **runs in Google Apps
Script**, not in the website bundle. Edit it here, then paste it into Apps Script.

## One-time setup

1. Open the **Google Sheet** that collects this form's responses
   (Form editor → **Responses** tab → green Sheets icon → *View in Sheets*).
2. In the Sheet: **Extensions → Apps Script**.
3. Delete the default `Code.gs` contents and **paste in the whole**
   [`enquiry-email-notification.gs`](./enquiry-email-notification.gs). **Save** (💾).
4. Left sidebar → **Triggers** (⏰) → **Add Trigger**:
   | Field | Value |
   |-------|-------|
   | Choose which function to run | `onEnquirySubmit` |
   | Choose which deployment | `Head` |
   | Select event source | `From spreadsheet` |
   | Select event type | `On form submit` |
5. **Save** → Google shows an authorization prompt. Choose your account →
   *Advanced* → *Go to (project)* → **Allow** (it needs permission to send email
   as you). This is required because sending mail needs an **installable**
   trigger.
6. **Test:** submit the website enquiry form once and check your inbox.

## What the email contains

- Subject: `New enquiry — <name> (<requirement>)`
- A branded header, a highlight card with the lead's name + clickable
  phone/email, and **WhatsApp / Call / Email** buttons.
- A table of **every** field the form captured (name, phone, email,
  requirement, category, budget, locations, timeline, message, etc.).
- `Reply-To` is set to the lead's email, so replying goes straight to them.

## Notes & tweaks

- **Change the recipient / add a CC:** edit `NOTIFY_TO` at the top of the `.gs`
  file (a comma-separated string adds more recipients), then re-paste + save.
- **Self-adapting:** the email is rendered from the Sheet's header row, so if
  you add/rename/reorder form questions later, the email updates automatically —
  no code change needed.
- **Not receiving mail?** Check the trigger exists (⏰), that you approved the
  auth prompt, and Apps Script → **Executions** for errors. Gmail's free send
  quota is ~100/day (Workspace: ~1,500/day) — far above expected lead volume.
- This is independent of the Firestore admin inbox; both keep working. If you
  ever move off Google Forms, this notifier would need to be re-homed (e.g. a
  Firebase Function on the `enquiries` collection).
