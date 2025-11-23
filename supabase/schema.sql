-- Enable necessary extensions
create extension if not exists vector;

-- Contacts table
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

-- People table (related to contacts)
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

-- Interactions table
create table interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  occurred_at timestamptz not null,   -- call date/time
  transcript text,                    -- STT result
  summary text,                       -- human-readable
  extracted jsonb not null,           -- structured fields
  actions text,                       -- action items
  sentiment text,                     -- optional: 'positive', 'neutral', etc.
  audio_path text,                    -- Supabase Storage path to original audio
  created_at timestamptz default now()
);

-- Interaction embeddings for semantic search
create table interaction_embeddings (
  interaction_id uuid primary key references interactions(id) on delete cascade,
  embedding vector(768)
);

-- Follow-ups table (action items extracted from interactions)
create table followups (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  interaction_id uuid references interactions(id) on delete cascade,
  task text not null,
  due_date date not null,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes for performance
create index contacts_owner_uid_idx on contacts(owner_uid);
create index contacts_next_checkin_date_idx on contacts(next_checkin_date);
create index interactions_contact_id_idx on interactions(contact_id);
create index people_contact_id_idx on people(contact_id);
create index followups_contact_id_idx on followups(contact_id);
create index followups_due_date_idx on followups(due_date);
create index followups_completed_idx on followups(completed);
