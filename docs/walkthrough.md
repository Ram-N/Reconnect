# Personal CRM MVP Walkthrough

The Personal CRM MVP is now built! Here's what has been implemented and how to use it.

## Features

### 1. Recording & Processing
- **Record**: Capture voice notes directly in the browser.
- **Process**: Automatically transcribe audio (via OpenAI Whisper) and extract structured data (via OpenAI GPT-4o).
- **Review**: Review the transcript and extracted data before saving.
- **Save**: Store interactions in Supabase with RLS privacy.

### 2. Contacts & Scheduling
- **Up Next**: View contacts due for a check-in based on their cadence.
- **Contacts**: Browse your contact list and see last interaction dates.
- **Search**: Filter contacts by name.

### 3. Authentication
- **Login/Signup**: Secure email/password authentication via Supabase Auth.
- **Privacy**: All data is protected by Row Level Security (RLS) policies, ensuring only you can see your data.

## Setup & Running

### Prerequisites
- Node.js installed.
- Supabase project created.
- OpenAI API Key.

### Steps

1. **Database Setup**:
   Run the SQL scripts in your Supabase SQL Editor:
   - `supabase/schema.sql`
   - `supabase/policies.sql`

2. **Edge Function Setup**:
   Deploy the `process` function to Supabase:
   ```bash
   supabase functions deploy process --no-verify-jwt
   supabase secrets set OPENAI_API_KEY=sk-...
   ```

3. **Frontend Setup**:
   Create a `.env` file in `web/` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run Locally**:
   ```bash
   cd web
   npm run dev
   ```

## Project Structure

- `web/`: Vite + React + TypeScript frontend.
  - `src/pages/`: Record, UpNext, Contacts, Login pages.
  - `src/hooks/`: `useRecorder` hook.
  - `src/lib/`: API client.
- `supabase/`: Database and Edge Functions.
  - `functions/process/`: Deno-based Edge Function for STT & LLM.
  - `schema.sql`: Database schema.
  - `policies.sql`: RLS policies.
