App   qidea. It’s a lightweight, privacy-minded “personal CRM” with voice capture → speech-to-text → LLM extraction → searchable, scheduled recall. Below is a concrete plan you can start building today.

# 1) MVP scope (2–3 days of focused work)

* Voice note capture on phone/desktop (PWA) and manual text entry fallback.
* STT to get a transcript.
* LLM turns transcript into a structured JSON summary.
* Review screen to accept/edit before saving.
* Store in Supabase with row-level security; simple contact list + last interaction timeline.
* ‘Up next’ list: contacts due for a check-in based on a cadence you set per person.

# 2) Architecture at a glance

* **Frontend**: Vite + React + TypeScript + Tailwind. Installable PWA for quick capture.
* **Backend**:

  * Supabase Postgres (+ RLS), storage for audio, optional pgvector for semantic search.
  * One small API service (FastAPI on Render/Fly/Railway) to run Whisper locally or call a cloud STT, and to run LLM extraction if not done in the browser.
* **LLM & STT options**:

  * **STT**:

    * Local: whisper.cpp or Faster-Whisper on your server (cheap, private; needs CPU/GPU).
    * Cloud: OpenAI Whisper / Deepgram / Google STT (fast, reliable; $).
  * **LLM**:

    * Local/hosted open-weights (Ollama: llama3.1-8b, mistral-7b, qwen-7b) for private/cheap.
    * Cloud (OpenAI/Together/Groq/HF Inference) for convenience and higher accuracy.

# 3) Data model (Supabase/Postgres)

Start simple; you can normalize further later.

```sql
create table contacts (
  id uuid primary key default gen_random_uuid(),
  owner_uid uuid not null, -- your Supabase user id
  display_name text not null,
  primary_phone text,
  primary_email text,
  cadence_days int default 180, -- how often you want to check in
  next_checkin_date date,       -- auto-updated on save
  notes text,                   -- freeform
  created_at timestamptz default now()
);

create table people (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  name text not null,
  relation text,        -- spouse, child, parent, friend, colleague
  org_school text,      -- employer or school
  location text,
  birthday date,
  extra jsonb default '{}'::jsonb
);

create table interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  occurred_at timestamptz not null,   -- call date/time
  transcript text,                    -- STT result
  summary text,                       -- human-readable
  extracted jsonb not null,           -- structured fields (see schema below)
  actions text,                       -- action items
  sentiment text,                     -- optional: 'positive', 'neutral', etc.
  audio_path text,                    -- Supabase Storage path to original audio
  created_at timestamptz default now()
);

-- Optional for semantic search:
create extension if not exists vector;
create table interaction_embeddings (
  interaction_id uuid primary key references interactions(id) on delete cascade,
  embedding vector(768)
);
```

**Core extracted JSON shape** (in `interactions.extracted`):

```json
{
  "people_mentioned": [
    {"name":"Riya","relation":"child","org_school":"UCLA","location":"LA"},
    {"name":"Amit","relation":"spouse","org_school":null,"location":"Boston"}
  ],
  "key_topics": ["promotion", "move to Boston", "college applications"],
  "facts": [
    {"type":"promotion","who":"Priya","org":"Acme","role":"Sr PM","when":"2025-08"},
    {"type":"move","who":"Family","to":"Boston","when":"2026-01"}
  ],
  "followups": [
    {"what":"Send book rec on college essays","due":"2025-09-15"}
  ],
  "checkin_hint_days": 120
}
```

# 4) LLM extraction prompt (schema-first)

Use a JSON-only response and validate before save.

**System**

```
You extract structured facts from personal call transcripts. 
Return STRICT JSON matching the provided schema. No extra keys, no commentary.
If a field is unknown, use null. Dates ISO-8601 when possible.
```

**User**

```
Schema:
{
  "people_mentioned":[{"name":string,"relation":string|null,"org_school":string|null,"location":string|null}],
  "key_topics":[string],
  "facts":[{"type":string,"who":string|null,"org":string|null,"role":string|null,"when":string|null,"to":string|null,"from":string|null}],
  "followups":[{"what":string,"due":string|null}],
  "checkin_hint_days": number|null
}

Transcript:
<PASTE STT TEXT HERE>
```

After the model replies, validate JSON client-side; show a review UI where you can fix names and relations before saving.

# 5) Frontend plan (React)

* **Pages**:

  * ‘Record’: big record/stop button, waveform, upload fallback, auto-STT, then extraction → review → save.
  * ‘Contacts’: list with search; each card shows next check-in date + last interaction snippet.
  * ‘Contact detail’: timeline, people, facts, follow-ups quick editor.
  * ‘Up next’: sorted by `next_checkin_date` with snooze.
* **PWA**: Add service worker + manifest for home-screen install and offline audio capture.
* **Recorder** (simplified TS snippet):

```ts
// hooks/useRecorder.ts
export function useRecorder() {
  const chunks: BlobPart[] = [];
  let mediaRecorder: MediaRecorder | null = null;

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    chunks.length = 0;
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.start();
  }

  async function stop(): Promise<Blob> {
    if (!mediaRecorder) throw new Error('Not recording');
    await new Promise<void>(resolve => {
      mediaRecorder!.onstop = () => resolve();
      mediaRecorder!.stop();
    });
    return new Blob(chunks, { type: 'audio/webm' });
  }

  return { start, stop };
}
```

# 6) Backend plan

* **Option A (minimal ops)**:

  * Use cloud STT + cloud LLM.
  * A single serverless function receives the audio, calls STT, calls LLM, returns JSON. Fast to ship, small codebase.
* **Option B (privacy/low cost)**:

  * FastAPI service with Faster-Whisper (CPU ok; GPU faster).
  * Optional Ollama container for open-weights LLM on the same box.
  * Supabase Edge Function just signs storage uploads and triggers webhooks; heavy work stays on your service.

**FastAPI sketch**:

```py
# app.py
from fastapi import FastAPI, UploadFile
from pydantic import BaseModel
import subprocess, json

app = FastAPI()

class Extracted(BaseModel):
    people_mentioned: list
    key_topics: list
    facts: list
    followups: list
    checkin_hint_days: int | None

@app.post('/process')
async def process(audio: UploadFile):
    # 1) Save audio
    data = await audio.read()
    with open('/tmp/a.webm','wb') as f: f.write(data)

    # 2) STT (call your whisper script or cloud API)
    # transcript = run_whisper('/tmp/a.webm')
    transcript = '...'

    # 3) LLM extraction (local Ollama or cloud)
    # extracted = call_llm(schema_prompt, transcript)
    extracted = {"people_mentioned": [], "key_topics": [], "facts": [], "followups": [], "checkin_hint_days": 180}

    return {'transcript': transcript, 'extracted': extracted}
```

# 7) Scheduling ‘next check-in’

* On each save:

  * Use `extracted.checkin_hint_days` if present, else the contact’s `cadence_days`.
  * Set `next_checkin_date = greatest(coalesce(next_checkin_date, '1970-01-01'), current_date) + cadence`.
* Nightly job:

  * Supabase cron (Scheduled Edge Function) marks due items for the ‘Up next’ page and can send you an email/notification.

# 8) Privacy & safety

* Add an on-screen notice: you’re storing private details; only you and your spouse can access.
* Supabase:

  * Enable RLS on all tables; policy: owner_uid must match `auth.uid()`.
  * Add a small ‘shared household’ table so both of you see the same records by mapping both UIDs to the same `household_id`.
* Optional client-side encryption:

  * Encrypt `transcript` and `summary` in the browser with WebCrypto before upload; store the key locally and share it once with your spouse.
* Redaction:

  * Before sending to a cloud LLM, replace names with placeholders; remap after extraction.

# 9) Pros and cons of key choices

**STT**

* Local Whisper: +private, +cheap at scale, −setup/latency on CPU.
* Cloud STT: +easy, +fast, −cost, −sends audio off-device.

**LLM**

* Open-weights: +cost control, +privacy, −slightly lower accuracy, −ops.
* Cloud: +quality, +speed, −ongoing cost, −privacy.

**DB**

* Supabase: +auth, +RLS, +storage, +pgvector, −you manage schema and policies.

**Frontend as PWA**

* +fast capture anywhere, +offline, −iOS background limits, −hardware quirks.

# 10) Nice-to-have features (after MVP)

* Google Contacts import to seed names and relations.
* Calendar hooks: suggest check-in slots and create events or reminders.
* NER fallback (spaCy) to auto-suggest relations and organizations.
* Entity canonicalization and typo tolerance (‘Ankit’ vs ‘Ankith’).
* Tagging and topic filters (‘kids college’, ‘health’, ‘job’).
* Attachment capture: photos or links sent during calls.
* ‘Rapid recall’ view: 30-second pre-call card with the last 3 highlights.

# 11) Suggested repo layout

```
personal-crm/
  /web/            # Vite React TS
    src/
      pages/Record.tsx
      pages/Contacts.tsx
      pages/UpNext.tsx
      components/Recorder.tsx
      lib/api.ts
      lib/schema.ts
  /server/         # FastAPI or Node
    app.py
    llm_client.py
    stt_client.py
  /supabase/
    schema.sql
    policies.sql
  README.md
```

# 12) First tasks to do now

1. Create Supabase project; paste `schema.sql`. Turn on RLS; write owner policies.
2. Scaffold Vite + React + TS + Tailwind. Add PWA manifest + service worker.
3. Build ‘Record’ page with the recorder hook and an upload path.
4. Stand up a minimal `/process` API that returns a fake transcript and fake JSON; wire the review form and save flow.
5. Swap in real STT, then LLM extraction. Add a review and edit step before save.
6. Implement ‘Up next’ list and the cadence/next-check-in updater.

If you want, I can generate:

* Supabase RLS policy snippets,
* A stricter JSON schema and validator,
* A basic Tailwind UI for Record → Review → Save,
* A minimal FastAPI endpoint wired to Whisper and Ollama.

