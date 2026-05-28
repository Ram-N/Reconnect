# Future Features

**Last updated**: 2026-05-28

This is the consolidated backlog of features not yet implemented. Items already shipped
(voice recording, AI processing, contacts, UpNext, follow-ups, hashtags, PWA, Google OAuth,
Note to Self, ToBeAssigned) have been removed.

---

## High Priority

### 1. Edit Existing Notes
Allow users to modify a saved interaction — transcript, people, topics, facts, follow-ups.

- Edit button on interaction cards (contact detail + home page)
- Editable fields: transcript, summary, people mentioned, key topics, facts, follow-ups, occurred date
- Requires `updated_at` column on `interactions` table
- Key files: `ContactDetail.tsx`, `Home.tsx`, new `EditInteractionModal.tsx`, `api.ts`

---


### 3. Smart Contact Suggestions
When reviewing a note, suggest existing contacts based on names the AI extracted.

- Fuzzy match extracted `people_mentioned` names against `contacts.display_name`
- Show ranked suggestions (High/Medium confidence)
- Fall back to manual search if no match
- Library: `fuse.js` or similar
- Key files: `Record.tsx`, new `ContactSuggestionInput.tsx`, new `lib/contactMatcher.ts`

---

## Medium Priority

### 4. Recurring Reminders & Notifications
Notify users when a check-in is due, so they don't have to check the UpNext page manually.

- Email notifications via Supabase scheduled Edge Function (nightly cron)
- Optional: browser push notifications via Web Push API
- Configurable: daily digest vs. per-contact alert

---

### 5. Contact Tags / Categories
Group contacts by label (e.g. Family, Work, College Friends) for filtering.

- Tag field on contacts (array of strings)
- Filter by tag on Contacts and UpNext pages
- Reuses hashtag UI patterns already in place

---

### 6. Bulk Contact Import (CSV/Excel)
Upload a spreadsheet to import contacts instead of adding one by one.

- Drag-and-drop upload, column mapping UI, preview before import
- Validate required fields, handle duplicates
- Library: `xlsx` for Excel parsing
- Key files: `Contacts.tsx`, new `BulkImportModal.tsx`, new `lib/importHelpers.ts`

---

### 7. Rapid Recall Card
A 30-second pre-call summary card for a contact — last 3 highlights, open follow-ups, key facts.

- Accessible from contact detail or UpNext with one tap
- Read-only condensed view: last interaction summary, people, pending follow-ups
- No new data model needed — derived from existing interactions

---

### 8. Shared Household / Multi-user
Let two users (e.g. spouses) see and add to the same set of contacts and interactions.

- `households` table mapping multiple `owner_uid` values to one `household_id`
- RLS policies updated to allow access by household membership
- Invite flow (email invite to join household)

---

## Low Priority

### 9. Semantic Search
Search interactions by meaning, not just keywords (e.g. "when did we talk about her job?").

- pgvector extension already in schema (`interaction_embeddings` table)
- Generate embeddings at save time via NIM or a small embedding model
- Search UI on Contacts or a global search page

---

### 10. Google Contacts Import
Seed the contact list from an existing Google Contacts account.

- OAuth scope: `contacts.readonly`
- Map Google fields → Reconnect contact fields
- One-time import with duplicate detection

---

### 11. Export Contacts (CSV)
Download all contacts as a CSV for backup or migration.

- Single button on Contacts page
- Exports: name, phone, email, cadence, last interaction date

---

### 12. Contact Photo Upload
Add a profile photo to a contact.

- Upload to Supabase Storage with RLS
- Display in contact cards and detail page
- Low impact on core workflows

---

## Completed (for reference)

- ✅ Voice recording with pause/resume and auto-process countdown
- ✅ AI transcription — Groq Whisper large-v3
- ✅ Structured extraction — NIM Llama 3.3 70B (primary), Groq (fallback)
- ✅ Hashtag extraction from speech
- ✅ Contacts page with search and cadence scheduling
- ✅ Contact detail page with interaction timeline
- ✅ UpNext page (contacts due for check-in)
- ✅ Follow-ups page with completion tracking
- ✅ ToBeAssigned queue for unlinked interactions
- ✅ Note to Self contact
- ✅ Note counts on contact cards
- ✅ Quick add contact from review screen (pre-filled from AI extraction, auto-selected on save)
- ✅ Google OAuth authentication
- ✅ PWA — installable on Android/iOS
