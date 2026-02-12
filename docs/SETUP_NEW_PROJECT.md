# Setting Up New Supabase Project

## Step 1: Create Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `reconnect`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Select closest to your location
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait ~2 minutes for setup to complete

## Step 2: Get API Credentials

1. In your new project dashboard, go to:
   **Settings** → **API**
2. Copy these values:
   - **Project URL** (under "Project URL") - looks like `https://xxxxx.supabase.co`
   - **anon public** key (under "Project API keys" → "anon public")

## Step 3: Update Environment Variables

Edit `web/.env` and replace with your new credentials:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

## Step 4: Set Up Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the editor
5. Click **"Run"**

You should see: `Success. No rows returned`

## Step 5: Set Up Security Policies

1. Still in **SQL Editor**, create another **"New query"**
2. Copy the entire contents of `supabase/policies.sql`
3. Paste into the editor
4. Click **"Run"**

You should see: `Success. No rows returned`

## Step 6: Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. (Optional) Configure other providers (Google, GitHub, etc.)

## Step 7: Restart Your Dev Server

```bash
# Stop the current dev server (Ctrl+C)

# Start it again
cd web
npm run dev
```

## Step 8: Test the App

1. Open http://localhost:5173
2. You should see the login page
3. Try creating an account (Sign Up)
4. If successful, you should be redirected to the Record page

## Troubleshooting

### "Invalid API key"
- Double-check you copied the **anon public** key, not the service_role key
- Make sure there are no extra spaces in the `.env` file

### "Relation does not exist"
- The database schema wasn't applied
- Go back to Step 4 and run `schema.sql` again

### Still can't connect
- Make sure you saved the `.env` file
- Restart the dev server (it only reads `.env` on startup)
- Check browser console (F12) for specific errors

## Quick Reference

**Files to edit:**
- `web/.env` - Your Supabase credentials

**SQL files to run:**
1. `supabase/schema.sql` - Creates tables
2. `supabase/policies.sql` - Sets up Row-Level Security

**Supabase Dashboard sections:**
- **SQL Editor** - Run SQL commands
- **Table Editor** - View/edit data manually
- **Authentication** - Manage users and auth settings
- **Settings → API** - Get your credentials

## Verification Checklist

After setup, verify:

- [ ] New Supabase project created
- [ ] `web/.env` updated with new URL and key
- [ ] `schema.sql` executed successfully
- [ ] `policies.sql` executed successfully
- [ ] Email authentication enabled
- [ ] Dev server restarted
- [ ] App loads at http://localhost:5173
- [ ] Can create a new account
- [ ] No errors in browser console

## Next Steps

Once everything is working:
1. Test the recording feature (will use mock AI processing)
2. Add contacts
3. View the "Up Next" reminders
4. Later: Deploy edge functions for real AI processing
