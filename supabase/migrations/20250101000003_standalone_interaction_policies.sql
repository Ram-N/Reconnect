-- Drop existing policies for interactions
drop policy if exists "Users can see interactions for their contacts" on interactions;
drop policy if exists "Users can insert interactions for their contacts" on interactions;
drop policy if exists "Users can update interactions for their contacts" on interactions;
drop policy if exists "Users can delete interactions for their contacts" on interactions;

-- Add owner_uid column to interactions so we can track ownership directly
alter table interactions add column if not exists owner_uid uuid;

-- Create index for performance
create index if not exists interactions_owner_uid_idx on interactions(owner_uid);

-- New policies that handle both standalone and contact-linked interactions
create policy "Users can see their own interactions"
  on interactions for select
  using (
    auth.uid() = owner_uid OR
    exists (
      select 1 from contacts
      where contacts.id = interactions.contact_id
      and contacts.owner_uid = auth.uid()
    )
  );

create policy "Users can insert their own interactions"
  on interactions for insert
  with check (
    auth.uid() = owner_uid OR
    (contact_id is not null and exists (
      select 1 from contacts
      where contacts.id = interactions.contact_id
      and contacts.owner_uid = auth.uid()
    ))
  );

create policy "Users can update their own interactions"
  on interactions for update
  using (
    auth.uid() = owner_uid OR
    exists (
      select 1 from contacts
      where contacts.id = interactions.contact_id
      and contacts.owner_uid = auth.uid()
    )
  );

create policy "Users can delete their own interactions"
  on interactions for delete
  using (
    auth.uid() = owner_uid OR
    exists (
      select 1 from contacts
      where contacts.id = interactions.contact_id
      and contacts.owner_uid = auth.uid()
    )
  );
