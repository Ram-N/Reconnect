-- Add followups table for action items extracted from interactions
create table if not exists followups (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  interaction_id uuid references interactions(id) on delete cascade,
  task text not null,
  due_date date not null,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists followups_contact_id_idx on followups(contact_id);
create index if not exists followups_due_date_idx on followups(due_date);
create index if not exists followups_completed_idx on followups(completed);

-- Enable RLS
alter table followups enable row level security;

-- Add RLS policies
create policy "Users can see followups for their contacts"
  on followups for select
  using (exists (
    select 1 from contacts
    where contacts.id = followups.contact_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can insert followups for their contacts"
  on followups for insert
  with check (exists (
    select 1 from contacts
    where contacts.id = followups.contact_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can update followups for their contacts"
  on followups for update
  using (exists (
    select 1 from contacts
    where contacts.id = followups.contact_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can delete followups for their contacts"
  on followups for delete
  using (exists (
    select 1 from contacts
    where contacts.id = followups.contact_id
    and contacts.owner_uid = auth.uid()
  ));
