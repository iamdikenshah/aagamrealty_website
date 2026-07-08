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
`onEnquirySubmit` handles both a **form-bound** trigger (the event carries a
`FormResponse`) and a **sheet-bound** one (the event carries the appended row),
so it works in either kind of project — including the existing form-bound
project that holds `setupAagamEnquiryFields`.

## One-time setup

1. Open the Apps Script project:
   - **Form-bound** (recommended, and where the form-setup code already lives):
     open the Form → **⋮ (More)** → **Script editor**; **or**
   - **Sheet-bound:** open the responses **Google Sheet** → **Extensions →
     Apps Script**.
2. **Add** [`enquiry-email-notification.gs`](./enquiry-email-notification.gs) as a
   new script file (＋ → Script), paste it in, and **Save** (💾). It can sit
   alongside other functions in the same project.
3. Left sidebar → **Triggers** (⏰) → **Add Trigger**:
   | Field | Value |
   |-------|-------|
   | Choose which function to run | `onEnquirySubmit` |
   | Choose which deployment | `Head` |
   | Select event source | `From form` (form-bound) — or `From spreadsheet` (sheet-bound) |
   | Select event type | `On form submit` |
4. **Save** → Google shows an authorization prompt. Choose your account →
   *Advanced* → *Go to (project)* → **Allow** (it needs permission to send email
   as you). This is required because sending mail needs an **installable**
   trigger.
5. **Test:** submit the website enquiry form once and check your inbox.

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
