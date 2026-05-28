# 🚀 Reconnect - Quick Start

## Start Development Server

```bash
cd /home/ram/projects/Reconnect/web

# First, check if Supabase is active (recommended)
npm run check:supabase

# Then start the dev server
npm run dev
```

Then open: **http://localhost:5173**

## What Works

- ✅ Voice recording via browser microphone
- ✅ AI transcription (Groq Whisper large-v3)
- ✅ Smart data extraction (NIM Llama 3.3 70B → Groq fallback)
- ✅ Save interactions to Supabase with RLS

## First Time Setup

1. **Sign up** at `/login` to create your account
2. **Allow microphone** permissions when prompted
3. **Record** a test voice note
4. **Process** it to see AI extraction
5. **Save** to database

## Important Links

- **App (Local)**: http://localhost:5173
- **App (Production)**: https://reconnect-nine.vercel.app/
- **Supabase Dashboard**: https://supabase.com/dashboard/project/kjlhpzkzvinaophbxqdy
- **GitHub Repo**: https://github.com/Ram-N/Reconnect

## Environment

- Frontend `.env` is in `web/.env` (gitignored)
- API keys stored in Supabase secrets (set via dashboard or CLI):
  - `NIM_API_KEY1` — NVIDIA NIM (primary LLM)
  - `GROQ_API_KEY1` — Groq (STT + LLM fallback)
- Database uses Row-Level Security (RLS)

## Troubleshooting

- **"Failed to fetch" errors?** → Supabase project might be paused
  ```bash
  cd web
  npm run check:supabase
  ```
  If paused: Go to https://supabase.com/dashboard and resume your project (takes 30-60s to wake up)

- **Not logged in?** → Go to `/login` and create an account
- **Microphone not working?** → Check browser permissions
- **Processing fails?** → Check browser console (F12) for errors
- **Can't save?** → Make sure you're logged in first

## Useful Commands

```bash
# Check if Supabase is active
npm run check:supabase

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```
