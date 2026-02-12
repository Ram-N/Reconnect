# Testing Guide for Reconnect

This guide provides simple tests to verify the core functionality of the Reconnect app.

## Prerequisites

- Dev server running at http://localhost:5173
- Supabase project is active (not paused)

## Test Environment Setup

Start the dev server:
```bash
cd /home/ram/projects/Reconnect/web
npm run dev
```

Open browser to: http://localhost:5173

---

## Test 1: Sign Up & Authentication

**Objective**: Verify user authentication works

**Steps**:
1. You should see the home page with "Reconnect" heading
2. If not logged in, click the blue **"Sign In"** button
3. Click **"Sign up"** link at the bottom of the form
4. Enter test credentials:
   - Email: `test@example.com`
   - Password: `password123`
5. Click **"Sign Up"** button

**Expected Result**:
- Alert message: "Check your email for the confirmation link!"
- For testing purposes, you can switch back to "Sign in" mode and use the same credentials to log in directly
- After successful sign in, you should see the dashboard with two large buttons: "Add a Note" (blue) and "Look Up Notes" (purple)
- Bottom navigation bar should appear with 4 tabs: Home, Record, Follow-ups, Contacts

**Success Criteria**:
- ✅ No error messages
- ✅ Redirected to dashboard after login
- ✅ Bottom navigation visible

---

## Test 2: Add a Voice Note

**Objective**: Test audio recording and mock AI processing

**Steps**:
1. From the dashboard, click the big blue **"Add a Note"** button (with microphone icon)
2. On the Record page, click the **red microphone button** to start recording
3. Speak for a few seconds, say something like:
   - "Had coffee with Sarah today. She mentioned her new job at Google and that she's moving to Portland next month."
4. Click the **stop button** (blue/gray)
5. Click **"Submit for Processing"**
6. Review the extracted data that appears (this is mock/placeholder data)
7. Click **"Save Interaction"**

**Expected Result**:
- Recording starts/stops without errors
- After submitting, you see extracted data with:
  - Mock transcript
  - People mentioned
  - Key topics
  - Facts
  - Follow-ups
- After saving, you're redirected to success page or contacts list

**Success Criteria**:
- ✅ Audio recording works (no permission errors)
- ✅ Processing completes without errors
- ✅ Mock extracted data appears
- ✅ Interaction saved successfully

**Known Limitation**:
- ⚠️ AI processing is currently MOCK/PLACEHOLDER
- The transcript and extracted data are fake examples, not real AI processing

---

## Test 3: Add a Contact Manually

**Objective**: Verify manual contact creation and CRUD operations

**Steps**:
1. Click **"Contacts"** in the bottom navigation (phone icon - far right)
2. Click the **"+ Add Contact"** button (top right or center of screen)
3. Fill in the form:
   - **Name**: Sarah Johnson
   - **Cadence**: 30 (days)
   - **Notes**: Friend from college
4. Click **"Add Contact"** or **"Save"**
5. Verify Sarah appears in your contacts list

**Expected Result**:
- Contact form opens without errors
- After saving, redirected back to contacts list
- "Sarah Johnson" appears in the list
- Shows next check-in date (30 days from now)

**Success Criteria**:
- ✅ Form submission works
- ✅ Contact appears in list
- ✅ No database errors
- ✅ Next check-in date calculated correctly

**Bonus Test**:
- Click on Sarah's contact card to view details
- Verify you can see contact info and interaction history

---

## Additional Quick Checks

### Check Follow-ups Page
1. Click **"Follow-ups"** in bottom navigation (checklist icon)
2. Should show contacts that need check-ins soon
3. If you just added Sarah with 30-day cadence, she might not appear yet (30 days is far out)

### Check Dashboard Stats
1. Go back to **"Home"** tab
2. Verify stats show:
   - Total Contacts: 1 (if you added Sarah)
   - Notes this month: 1 (if you recorded an interaction)

### Verify Data in Supabase
1. Go to https://supabase.com/dashboard
2. Open your Reconnect project
3. Click **"Table Editor"**
4. Check tables:
   - `contacts` - should have 1 row (Sarah)
   - `interactions` - should have 1 row (if you recorded a note)
   - `people` - might be empty (depends on mock extraction)
   - `followups` - might be empty (depends on mock extraction)

---

## Troubleshooting

### "Invalid API key" or "Failed to fetch"
- Supabase project is paused - go to dashboard and restore it
- Check `web/.env` has correct credentials

### "Relation does not exist"
- Database schema not applied
- Run `supabase/schema.sql` in SQL Editor
- Run `supabase/policies.sql` in SQL Editor

### Audio recording not working
- Browser needs microphone permission
- Check browser console for permission errors
- Try using Chrome or Edge (best compatibility)

### No data showing up after tests
- Check browser console (F12) for errors
- Verify you're logged in (check for auth token)
- Check Supabase Table Editor to see if data was actually saved

---

## What's Working vs Placeholder

✅ **Fully Functional:**
- User authentication (sign up, login, logout)
- Audio recording (saves to Supabase Storage)
- Manual contact CRUD (create, read, update, delete)
- Check-in scheduling and reminders
- PWA features (install to home screen)
- Dashboard stats and recent activity

⚠️ **Mock/Placeholder (NOT REAL AI):**
- Speech-to-text (returns fake transcript)
- AI extraction (generates sample people, topics, facts)
- LLM processing (all structured data is hardcoded examples)

---

## Next Steps After Testing

Once these tests pass, you can:
1. Test on mobile device (PWA install)
2. Implement real AI processing (Whisper + LLM)
3. Test with real conversations
4. Deploy to production

---

## Test Results Template

Copy this and fill it out:

```
Date: ___________
Tester: ___________

Test 1 - Authentication:
[ ] Passed  [ ] Failed
Notes: ___________

Test 2 - Voice Note:
[ ] Passed  [ ] Failed
Notes: ___________

Test 3 - Add Contact:
[ ] Passed  [ ] Failed
Notes: ___________

Issues Found:
-
-
-

Browser/Device:
-
```
