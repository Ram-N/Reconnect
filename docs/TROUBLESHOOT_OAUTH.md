# Troubleshooting Google OAuth

## Current Issue
After clicking "Sign in with Google", authentication succeeds but tokens appear in URL hash instead of being handled properly.

## Root Cause
The redirect URLs may not be properly configured in Supabase, causing the OAuth callback to display tokens in the URL instead of being automatically processed.

## Fix Steps

### 1. Configure Supabase Redirect URLs

Go to: https://app.supabase.com/project/kjlhpzkzvinaophbxqdy/auth/url-configuration

**Add these to "Redirect URLs" (whitelist):**
```
http://localhost:3000
http://localhost:3000/
```

**Set "Site URL" to:**
```
http://localhost:3000
```

### 2. Verify Google OAuth Provider Settings

Go to: https://app.supabase.com/project/kjlhpzkzvinaophbxqdy/auth/providers

**Check Google provider:**
- ✅ Enabled
- ✅ Client ID is set
- ✅ Client Secret is set

### 3. Verify Google Cloud Console Settings

Go to: https://console.cloud.google.com/apis/credentials

**Find your OAuth 2.0 Client ID and check:**

**Authorized JavaScript origins:**
```
http://localhost:3000
https://kjlhpzkzvinaophbxqdy.supabase.co
```

**Authorized redirect URIs:**
```
https://kjlhpzkzvinaophbxqdy.supabase.co/auth/v1/callback
http://localhost:3000
```

### 4. Test the Flow

1. Clear browser cookies/cache for localhost:3000
2. Start dev server: `npm run dev`
3. Navigate to http://localhost:3000/login
4. Click "Continue with Google"
5. Authorize the app
6. You should be redirected back and automatically logged in to the Home page

### 5. Debugging

If it still doesn't work, open browser DevTools (F12) and check:

**Console tab** for errors like:
- "Auth session missing!"
- CORS errors
- Invalid redirect URL errors

**Network tab** for:
- OAuth callback request (should be 200 OK)
- Any failed requests to Supabase

**Application → Storage → Cookies** to verify:
- `sb-kjlhpzkzvinaophbxqdy-auth-token` cookie is set after login

### 6. Current Code Changes

Updated `Login.tsx` line 39 to use explicit path:
```typescript
redirectTo: `${window.location.origin}/`,
```

This ensures the redirect goes to the root path where the auth state listener can properly handle the session.

## Expected Behavior

After successful Google sign-in:
1. Google redirects to `http://localhost:3000/#access_token=...`
2. Supabase auth listener (`onAuthStateChange`) detects the tokens in the URL hash
3. Session is established automatically
4. Navigate hook triggers and sends you to the Home page (`/`)
5. URL hash is cleaned up by Supabase auth

## Common Issues

**Tokens visible in URL:**
- Redirect URL not whitelisted in Supabase
- Solution: Add to URL Configuration

**Infinite redirect loop:**
- Site URL misconfigured
- Solution: Set to exact match of your app URL

**"Invalid redirect URL" error:**
- Google Cloud Console redirect URI missing
- Solution: Add Supabase callback URL to Google Console

**Session not persisting:**
- Cookie settings issue
- Solution: Check browser allows localhost cookies
