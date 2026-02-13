# Future Features & Enhancements

This document tracks planned features and improvements for Reconnect.

## Planned Features

### 1. Bulk Contact Upload (Excel/CSV Import)
**Priority**: Medium
**Status**: Planned
**Requested**: 2026-02-12

**Description**:
Allow users to upload an Excel or CSV file to bulk import contacts instead of adding them one by one.

**Requirements**:
- Support Excel (.xlsx) and CSV (.csv) file formats
- File upload interface with drag-and-drop
- Column mapping UI (map spreadsheet columns to contact fields)
- Validation and error reporting (duplicate names, invalid data)
- Preview before import (show first 5-10 rows)
- Progress indicator for large imports
- Option to update existing contacts or skip duplicates

**Expected Columns**:
- Name (required)
- Phone
- Email
- Cadence (days)
- Notes

**Technical Considerations**:
- Frontend: Use `xlsx` library for Excel parsing, native CSV parsing
- Backend: Batch insert with Supabase (chunks of 100-500 contacts)
- Validation: Check for required fields, phone/email format
- RLS: Ensure all imports have correct `owner_uid`

**Related Files**:
- `web/src/pages/Contacts.tsx` - Add import button
- `web/src/components/BulkImportModal.tsx` - New component for upload UI
- `web/src/lib/importHelpers.ts` - New file for parsing/validation logic

---

### 2. Edit Existing Notes/Interactions
**Priority**: High
**Status**: Planned
**Requested**: 2026-02-12

**Description**:
Allow users to go back to previously recorded notes/interactions and edit them. Currently, once a note is saved, there's no way to modify the transcript, extracted data, or metadata.

**Requirements**:
- Edit button on interaction cards (contact detail page, home page recent notes)
- Modal or page for editing interaction details
- Ability to edit:
  - Transcript text
  - Summary
  - People mentioned (add/remove/edit)
  - Key topics (add/remove/edit)
  - Facts (add/remove/edit)
  - Follow-ups (add/remove/edit/mark complete)
  - Occurred date/time
- Save/Cancel buttons with confirmation for discarding changes
- Show "Last edited" timestamp
- Validation to prevent saving empty/invalid data

**Technical Considerations**:
- Add `updated_at` timestamp column to `interactions` table
- Update RLS policies to allow UPDATE on interactions
- Frontend: Create `EditInteractionModal.tsx` or `EditInteractionPage.tsx`
- Consider adding edit history/audit log (optional, future enhancement)
- Handle concurrent edits (optimistic locking)

**Related Files**:
- `web/src/pages/ContactDetail.tsx` - Add edit button to interaction cards
- `web/src/pages/Home.tsx` - Add edit button to recent notes
- `web/src/components/EditInteractionModal.tsx` - New component for editing UI
- `web/src/lib/api.ts` - Add `updateInteraction()` function
- `supabase/schema.sql` - Add `updated_at` column (optional migration)

---

### 3. Smart Contact Suggestions from Note Content
**Priority**: High
**Status**: Planned
**Requested**: 2026-02-12

**Description**:
When reviewing extracted data from a voice note, intelligently suggest existing contacts based on the people mentioned in the transcript, or allow users to create new contacts. Instead of manually selecting contacts, the system should analyze names mentioned and offer smart suggestions.

**Requirements**:
- Analyze transcript and extracted "people mentioned" for name matching
- Show dropdown with suggested existing contacts that match mentioned names
- Fuzzy matching for similar names (e.g., "Sarah" matches "Sarah Johnson")
- Allow multiple contact selection if multiple people mentioned
- Option to "Create New Contact" if no match found
- Option to manually type/search if suggestions aren't relevant
- Show confidence level for matches (High/Medium/Low)
- Allow user to confirm/reject suggestions before saving

**User Flow**:
1. User records voice note mentioning "Had coffee with Sarah today"
2. AI extracts "Sarah" as a person mentioned
3. System suggests existing contacts:
   - "Sarah Johnson" (High confidence)
   - "Sarah Williams" (Medium confidence)
4. User selects correct contact or clicks "Create New Contact"
5. Interaction is linked to selected/new contact

**Technical Considerations**:
- Use fuzzy string matching library (e.g., `fuse.js` or Levenshtein distance)
- Search against `contacts.display_name` and `people.name` tables
- Consider using Supabase full-text search or `pg_trgm` extension
- Show suggestions in autocomplete/combobox component
- Cache contact list for faster matching
- Handle edge cases: multiple matches, no matches, ambiguous names

**Related Files**:
- `web/src/pages/Record.tsx` - Replace simple contact dropdown with smart suggestion UI
- `web/src/components/ContactSuggestionInput.tsx` - New autocomplete component
- `web/src/lib/contactMatcher.ts` - New file for fuzzy matching logic
- `web/src/lib/api.ts` - Add function to search contacts by name

**Future Enhancements**:
- Learn from user selections to improve matching over time
- Use context clues (location, topics) to improve suggestions
- Suggest contacts based on interaction frequency/recency

---

### 4. Quick Add Contact from Note Review Screen
**Priority**: High
**Status**: Planned
**Requested**: 2026-02-12

**Description**:
Allow users to create a new contact on-the-fly while reviewing a voice note, without having to abandon the note and navigate to the Contacts page. This prevents the frustrating workflow of recording a note, realizing the contact doesn't exist, and having to discard the note.

**Requirements**:
- "Create New Contact" button/link in contact selection dropdown on Record/Review page
- Inline contact creation form (modal or expandable section)
- Quick form with essential fields:
  - Name (required)
  - Cadence (optional, default to 30 or 90 days)
  - Phone (optional)
  - Email (optional)
- "Save & Select" button to:
  1. Create the contact in database
  2. Automatically select it for the current note
  3. Close modal and return to note review
- Validation and error handling
- Cancel option returns to contact selection without creating

**User Flow**:
1. User records voice note about "Had coffee with Maria"
2. On review screen, opens contact dropdown
3. "Maria" is not in the list
4. Clicks "**+ Create New Contact**" button
5. Mini-form appears with Name pre-filled as "Maria" (from AI extraction)
6. User adds cadence (30 days) and optional phone/email
7. Clicks "Save & Select"
8. Contact is created and auto-selected for this note
9. User continues reviewing and saves the interaction

**Technical Considerations**:
- Reuse existing contact creation logic from Contacts page
- Add `owner_uid` automatically (same as Contacts.tsx fix)
- Update contact dropdown to reflect newly created contact
- Pre-populate name from "people mentioned" if available
- Consider autosave draft of note to prevent data loss

**Related Files**:
- `web/src/pages/Record.tsx` - Add quick create button/modal
- `web/src/components/QuickAddContactModal.tsx` - New inline contact form component
- Reuse logic from `web/src/components/AddContactModal.tsx`

**UX Improvement**:
This solves a major pain point where users have to choose between:
- ❌ Abandoning their note to create a contact
- ❌ Saving the note without a contact link
- ✅ Creating the contact instantly and continuing the workflow

---

## Backlog

### 5. Export Contacts to Excel/CSV
**Priority**: Low
**Status**: Planned

Allow users to download their contacts as Excel or CSV for backup or sharing.

---

### 6. Contact Tags/Categories
**Priority**: Medium
**Status**: Planned

Add tags to contacts (e.g., "Family", "Work", "College Friends") for better organization.

---

### 7. Real AI Processing (Replace Mocks)
**Priority**: High
**Status**: Planned

Implement actual Whisper STT and LLM extraction to replace placeholder mock data.

**Components**:
- Whisper STT integration (OpenAI API or local Faster-Whisper)
- LLM extraction (OpenAI/Groq/Together API)
- Update `supabase/functions/process/index.ts` and `server/main.py`

---

### 8. Contact Photo Upload
**Priority**: Low
**Status**: Planned

Allow users to add profile photos for contacts.

---

### 9. Recurring Reminders & Notifications
**Priority**: Medium
**Status**: Planned

Send email/push notifications when check-ins are due.

---

## Template for New Features

When adding a new feature request, use this template:

```markdown
### Feature Name
**Priority**: High/Medium/Low
**Status**: Planned/In Progress/Completed
**Requested**: YYYY-MM-DD

**Description**:
Brief description of the feature

**Requirements**:
- Requirement 1
- Requirement 2

**Technical Considerations**:
- Technical detail 1
- Technical detail 2

**Related Files**:
- File path 1
- File path 2
```

---

## Completed Features

*(None yet - MVP in progress)*
