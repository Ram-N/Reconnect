# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reconnect is a privacy-minded personal CRM that helps users stay in touch with friends and family through voice capture, AI-powered extraction, and smart scheduling.

**Tech Stack**:
- **Frontend**: Vite + React + TypeScript + Tailwind CSS + PWA
- **Database**: Supabase (Postgres with Row-Level Security)
- **Backend**: FastAPI (Python) for AI processing + Supabase Edge Functions
- **AI**: (Planned) OpenAI Whisper (STT) + LLM for extraction
- **Authentication**: Google OAuth via Supabase Auth (email/password fallback available)

## Key Commands

### Frontend Development (`/web` directory)

```bash
# Install dependencies
cd web
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm preview
```

### Backend Development (`/server` directory)

```bash
# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python main.py
# OR
uvicorn main:app --reload
```

### Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run schema: `supabase/schema.sql` in SQL Editor
3. Run policies: `supabase/policies.sql` in SQL Editor
4. Set up Google OAuth: Follow `docs/GOOGLE_OAUTH_SETUP.md`
5. Create `.env` in `web/` directory:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Architecture

### Data Flow

1. **Capture**: User records voice note via PWA (MediaRecorder API)
2. **Process**: Audio → Supabase Edge Function → STT (Whisper) → LLM extraction → Structured JSON
3. **Review**: User edits/confirms extracted data (people, topics, facts, follow-ups)
4. **Store**: Save to Supabase with RLS (contacts, people, interactions tables)
5. **Schedule**: Auto-update `next_checkin_date` based on cadence

### Key Data Models

**contacts**: Main contact records with `cadence_days` and `next_checkin_date` for scheduling

**people**: Related individuals mentioned in conversations (spouse, children, colleagues, etc.)

**interactions**: Conversation records with `transcript`, `summary`, and `extracted` JSONB field containing:
- `people_mentioned`: Array of people with name, relation, org_school, location
- `key_topics`: Array of conversation topics
- `facts`: Array of structured facts (promotions, moves, life events)
- `followups`: Array of action items with due dates
- `checkin_hint_days`: Suggested days until next check-in

**interaction_embeddings**: pgvector embeddings for semantic search (optional)

### Frontend Structure

- **pages/**: React page components (Record, Contacts, UpNext, Login)
- **hooks/**: Custom React hooks (useRecorder.ts for audio capture)
- **lib/api.ts**: Supabase client and API functions
- **App.tsx**: React Router setup with bottom navigation

### Backend Options

Two deployment patterns are supported:

1. **Supabase Edge Functions** (default): Process audio via `supabase/functions/process/index.ts`
2. **FastAPI Server** (alternative): `server/main.py` for local/self-hosted AI processing

The frontend calls Supabase Edge Functions by default (`lib/api.ts:processAudio`). For local AI processing, switch to calling the FastAPI `/process` endpoint.

### PWA Configuration

PWA manifest and service worker configured in `vite.config.ts` for:
- Installable mobile app
- Offline audio capture capability
- Quick capture from home screen

## Development Notes

### Current MVP Status

The codebase is in early MVP stage with:
- ✅ Frontend UI for Record/Review/Contacts/UpNext pages
- ✅ Audio recording via MediaRecorder API
- ✅ Supabase schema and RLS policies
- ✅ PWA configuration
- ⚠️ **Placeholder AI processing** (Whisper and LLM not yet implemented)

### AI Integration TODOs

Both backend options (Edge Functions and FastAPI) currently return mock data:
- STT placeholder: `server/main.py:48` and `supabase/functions/process/index.ts`
- LLM placeholder: `server/main.py:52` and `supabase/functions/process/index.ts`

To implement real AI:
1. Add Whisper STT (local whisper.cpp/Faster-Whisper OR cloud OpenAI/Deepgram)
2. Add LLM extraction (local Ollama OR cloud OpenAI/Together/Groq)
3. Update ExtractedData schema validation in both backends

### Privacy Considerations

- All data stored with Row-Level Security (RLS) on Supabase
- Audio files stored in Supabase Storage with RLS policies
- Optional: Client-side encryption before upload (not yet implemented)
- Optional: Name redaction before cloud LLM calls (not yet implemented)

### Styling

- Tailwind CSS (v4.1+) configured
- Mobile-first responsive design
- Bottom navigation bar for mobile UX
- Lucide React for icons

## Important Files

- `web/src/lib/api.ts` - All Supabase interactions and data fetching
- `web/src/hooks/useRecorder.ts` - Audio recording hook
- `supabase/schema.sql` - Database schema (contacts, people, interactions)
- `supabase/policies.sql` - Row-Level Security policies
- `server/main.py` - FastAPI backend for AI processing
- `web/vite.config.ts` - PWA and build configuration
