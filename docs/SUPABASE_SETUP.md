# Supabase Setup & Troubleshooting

## Current Setup

This project uses **Supabase Cloud** (hosted), not local Supabase.

**Project URL**: `https://kjlhpzkzvinaophbxqdy.supabase.co`

## Initial Setup

### 1. Supabase Project Configuration

The project is already configured with:
- Database schema: `supabase/schema.sql`
- Row-Level Security policies: `supabase/policies.sql`
- Environment variables in `web/.env`

### 2. Environment Variables

Located in `web/.env`:
```env
VITE_SUPABASE_URL=https://kjlhpzkzvinaophbxqdy.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Troubleshooting

### Error: "ERR_NAME_NOT_RESOLVED" or "Could not resolve host"

**This means the Supabase project URL is invalid or the project was deleted.**

**Solution:**
1. Check if your project still exists at https://supabase.com/dashboard
2. If deleted/missing, you need to create a new project
3. Follow the full setup guide: `docs/SETUP_NEW_PROJECT.md`
4. Update `web/.env` with the new credentials
5. Run the SQL schema files in the new project
6. Restart the dev server

### Error: "Cannot connect to Supabase"

**Possible causes:**

1. **Database tables not created**
   - Go to Supabase Dashboard → SQL Editor
   - Run `supabase/schema.sql`
   - Run `supabase/policies.sql`

2. **Authentication not enabled**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Email provider (at minimum)
   - Configure redirect URLs if needed

3. **Environment variables missing**
   - Check `web/.env` exists and has correct values
   - Restart dev server after changing `.env`

4. **Edge Functions not deployed**
   - The `process` edge function may not exist yet
   - Deploy with: `supabase functions deploy process`
   - Or disable edge function calls temporarily in `web/src/lib/api.ts`

### Checking Connection

Run this test script:
```bash
cd web
node test-connection.js
```

### Restarting the App

```bash
# Stop the dev server
# Press Ctrl+C in the terminal running the server

# Start it again
cd web
npm run dev
```

### Checking Supabase Status

**Via Dashboard:**
- Go to https://supabase.com/dashboard
- Select your project
- Check:
  - Table Editor (tables exist?)
  - Authentication (users can sign up?)
  - Edge Functions (process function deployed?)
  - API Settings (correct keys?)

**Via CLI (if using local Supabase):**
```bash
# Start local Supabase
supabase start

# Check status
supabase status

# Stop local Supabase
supabase stop
```

**Note**: This project currently uses cloud Supabase, so CLI commands require Docker Desktop with WSL integration enabled.

## Database Schema Reset

If you need to reset/recreate the database:

1. **Backup data** (if needed)
2. Go to Supabase Dashboard → SQL Editor
3. Drop tables:
   ```sql
   DROP TABLE IF EXISTS interaction_embeddings;
   DROP TABLE IF EXISTS interactions;
   DROP TABLE IF EXISTS people;
   DROP TABLE IF EXISTS contacts;
   ```
4. Re-run `supabase/schema.sql`
5. Re-run `supabase/policies.sql`

## Edge Functions

The app calls `supabase.functions.invoke('process')` to process audio.

**Deploying the edge function:**
```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref kjlhpzkzvinaophbxqdy

# Deploy the function
supabase functions deploy process
```

**Temporarily disable edge function calls:**
Edit `web/src/lib/api.ts` and mock the response instead of calling the edge function.

## Common Issues

### "Invalid API key"
- Double-check `VITE_SUPABASE_ANON_KEY` in `.env`
- Get the correct key from Supabase Dashboard → Project Settings → API

### "Function not found: process"
- Edge function not deployed
- Deploy it or mock the response in `api.ts`

### "Row-Level Security policy violation"
- User not authenticated
- RLS policies not applied
- Check `supabase/policies.sql` was run

### Browser console shows 404 on auth endpoint
- Check if auth is enabled in Supabase Dashboard
- Verify redirect URLs match your local dev server

## Quick Reset Checklist

1. ✅ Supabase project exists (cloud dashboard)
2. ✅ Database schema applied (`schema.sql`)
3. ✅ RLS policies applied (`policies.sql`)
4. ✅ Authentication enabled (Email provider minimum)
5. ✅ Environment variables set in `web/.env`
6. ✅ Dev server restarted after `.env` changes
7. ⚠️ Edge function deployed (or mocked in code)

## Need Help?

Check browser console (F12) for specific error messages and search for them in this document.
