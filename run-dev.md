# 🚀 Run Reconnect App

## Start Development Server

```bash
cd /home/ram/projects/Reconnect/web
npm run dev
```

Then open: **http://localhost:5173**

## What Works

- ✅ Voice recording
- ✅ AI transcription (Groq Whisper)
- ✅ Data extraction (Groq Llama 3.3)
- ✅ Save to Supabase database

## Quick Reminders

- **Login first** at `/login` to create/access your account
- **Check browser console** (F12) for any errors
- **Supabase Dashboard**: https://supabase.com/dashboard/project/kjlhpzkzvinaophbxqdy

## Environment

- `.env` file is in `web/.env` (gitignored)
- Groq API key stored in Supabase secrets
- Database uses Row-Level Security (RLS)
