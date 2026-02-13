# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for Reconnect.

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for G Suite orgs)
   - App name: **Reconnect**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile` (these are default)
   - Test users: Add your Google account email for testing

6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **Reconnect Web App**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for local development)
     - Your production domain when deployed (e.g., `https://reconnect.yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback` (for local development)
     - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
     - Your production domain callback when deployed

7. Copy the **Client ID** and **Client Secret** - you'll need these in the next step

## Step 2: Supabase Configuration

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your Reconnect project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to expand it
5. Enable the Google provider
6. Paste your Google **Client ID** and **Client Secret** from Step 1
7. Click **Save**

## Step 3: Update Environment Variables (if needed)

Your `.env` file should already have:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

No additional environment variables are needed for OAuth - Supabase handles it server-side.

## Step 4: Test the Integration

1. Start your development server:
   ```bash
   cd web
   npm run dev
   ```

2. Navigate to `http://localhost:5173/login`
3. Click **Continue with Google**
4. You should be redirected to Google's OAuth consent screen
5. After authorizing, you'll be redirected back to your app and logged in

## Step 5: Verify in Supabase

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. You should see your Google account listed
3. The user's email and metadata (name, avatar) are automatically populated

## Troubleshooting

### "redirect_uri_mismatch" error
- Double-check that your redirect URIs in Google Cloud Console match exactly:
  - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes

### OAuth consent screen not configured
- Go back to Google Cloud Console → OAuth consent screen
- Complete all required fields
- Add your email as a test user

### User not being created in Supabase
- Check Supabase logs: **Authentication** → **Logs**
- Verify that email and profile scopes are enabled in Google OAuth settings

### Local development redirect issues
- Make sure you've added `http://localhost:5173` to Authorized JavaScript origins
- Clear your browser cache and cookies
- Try incognito mode

## Production Deployment

When deploying to production:

1. Add your production domain to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

2. Update the `redirectTo` in `Login.tsx` if needed (currently uses `window.location.origin`)

3. Test thoroughly in production environment

## Security Notes

- Never commit your Google Client Secret to version control
- The Client Secret is only stored in Supabase (server-side)
- Supabase handles all OAuth token management securely
- User sessions are automatically managed by Supabase Auth

## Additional Features

### Auto-fill user profile
You can access Google user data via:
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log(user?.user_metadata?.full_name);
console.log(user?.user_metadata?.avatar_url);
console.log(user?.email);
```

### Sign out
```typescript
await supabase.auth.signOut();
```

This is already implemented in your RLS policies - they use `auth.uid()` which works automatically with OAuth users.
