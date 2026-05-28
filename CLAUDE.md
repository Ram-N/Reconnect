# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reconnect is a privacy-minded personal CRM that helps users stay in touch with friends and family through voice capture, AI-powered extraction, and smart scheduling.

**Production URL**: https://reconnect-nine.vercel.app/

**Tech Stack**:
- **Frontend**: Vite + React + TypeScript + Tailwind CSS (v4) + PWA
- **Database**: Supabase (Postgres with Row-Level Security)
- **Edge Functions**: Supabase Deno runtime (`supabase/functions/process/`)
- **AI (STT)**: Groq Whisper large-v3
- **AI (LLM)**: NVIDIA NIM `meta/llama-3.3-70b-instruct` (primary) → Groq `llama-3.3-70b-versatile` (fallback)
- **Authentication**: Google OAuth via Supabase Auth
- **Deployment**: Vercel (auto-deploy from GitHub main branch)

## Key Commands

### Frontend Development (`/web` directory)

```bash
cd web
npm install          # Install dependencies
npm run dev          # Run development server (http://localhost:5173)
npm run build        # Build for production
npm run lint         # Run linter
npm run check:supabase  # Check if Supabase project is active
```

### Supabase Edge Functions

```bash
# Deploy the process function
supabase functions deploy process

# Set secrets (NIM is primary LLM, Groq keys used for both STT and LLM fallback)
supabase secrets set NIM_API_KEY1=nvapi_xxxx
supabase secrets set GROQ_API_KEY1=gsk_xxxx
```

### Supabase Setup (first time)

1. Create a Supabase project at https://supabase.com
2. Run schema: `supabase/schema.sql` in SQL Editor
3. Run policies: `supabase/policies.sql` in SQL Editor
4. Set up Google OAuth: Follow `docs/GOOGLE_OAUTH_SETUP.md`
5. Create `web/.env`:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Architecture

### Data Flow

1. **Capture**: User records voice note via PWA (MediaRecorder API), with pause/resume and auto-process at zero
2. **Process**: Audio → Supabase Edge Function → Groq Whisper (STT) → NIM/Groq LLM (extraction) → Structured JSON
3. **Review**: User edits/confirms extracted data (people, topics, hashtags, facts, follow-ups)
4. **Store**: Save to Supabase with RLS (contacts, people, interactions tables)
5. **Schedule**: Auto-update `next_checkin_date` based on cadence

### Key Data Models

**contacts**: Main contact records with `cadence_days`, `next_checkin_date`, and `note_count` for scheduling

**people**: Related individuals mentioned in conversations (spouse, children, colleagues, etc.)

**interactions**: Conversation records with `transcript`, `summary`, and `extracted` JSONB field containing:
- `people_mentioned`: Array of people with name, relation, org_school, location
- `key_topics`: Array of conversation topics
- `hashtags`: Array of category tags extracted from speech (e.g. "hashtag books" → "books")
- `facts`: Array of structured facts (promotions, moves, life events)
- `followups`: Array of action items with due dates
- `checkin_hint_days`: Suggested days until next check-in

**interaction_embeddings**: pgvector embeddings for semantic search (optional)

### Frontend Structure

```
web/src/
  pages/          # React page components
    Home.tsx        # Dashboard
    Record.tsx      # Voice recording with pause/resume
    Contacts.tsx    # Contact list
    ContactDetail.tsx
    UpNext.tsx      # Contacts due for check-in
    FollowUps.tsx   # Pending action items
    ToBeAssigned.tsx # Unassigned interactions
    Login.tsx
  components/     # Reusable UI components
    ContactCard, InteractionCard, AddContactModal,
    SearchBar, Toast, TopNav, PersonChip, Button, EmptyState
  hooks/
    useRecorder.ts  # Audio recording hook (MediaRecorder API)
  lib/
    api.ts          # All Supabase interactions and data fetching
  App.tsx           # React Router + bottom navigation
```

### Edge Function: `supabase/functions/process/index.ts`

Handles the full audio-to-structured-data pipeline:
1. Receives multipart form data with audio file
2. Calls Groq Whisper for transcription (STT)
3. Calls NIM (primary) or Groq (fallback) for structured extraction
4. Returns `{ transcript, extracted }` JSON

API key rotation: multiple keys supported via `GROQ_API_KEY1/2/3` and `NIM_API_KEY1/2`.

### PWA Configuration

PWA manifest and service worker configured in `vite.config.ts`:
- Installable on Android/iOS home screen
- Offline audio capture capability

## Development Notes

### Current Status

The app is fully functional with real AI processing:
- ✅ Voice recording with pause/resume and auto-process countdown
- ✅ AI transcription (Groq Whisper large-v3)
- ✅ Structured extraction: people, topics, hashtags, facts, follow-ups
- ✅ NIM as primary LLM with Groq automatic fallback
- ✅ Contacts with cadence scheduling and note counts
- ✅ Google OAuth authentication
- ✅ PWA installable on mobile
- ✅ "Note to Self" contact for personal notes
- ✅ ToBeAssigned queue for unassigned interactions
- ✅ Hashtag extraction from speech

### Privacy Considerations

- All data stored with Row-Level Security (RLS) — users only see their own data
- Audio processed server-side via Supabase Edge Functions, not stored long-term
- Optional: client-side encryption before upload (not yet implemented)

### Styling

- Tailwind CSS v4 — use utility classes, not v3 config syntax
- Mobile-first responsive design
- Bottom navigation bar for mobile UX
- Lucide React for icons

## Important Files

- `web/src/lib/api.ts` - All Supabase interactions and data fetching
- `web/src/hooks/useRecorder.ts` - Audio recording hook
- `supabase/functions/process/index.ts` - Edge function: STT + LLM extraction
- `supabase/schema.sql` - Database schema
- `supabase/policies.sql` - Row-Level Security policies
- `web/vite.config.ts` - PWA and build configuration
