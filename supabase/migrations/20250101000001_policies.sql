-- Enable RLS on all tables
alter table contacts enable row level security;
alter table people enable row level security;
alter table interactions enable row level security;
alter table interaction_embeddings enable row level security;

-- Policies for contacts
create policy "Users can only see their own contacts"
  on contacts for select
  using (auth.uid() = owner_uid);

create policy "Users can insert their own contacts"
  on contacts for insert
  with check (auth.uid() = owner_uid);

create policy "Users can update their own contacts"
  on contacts for update
  using (auth.uid() = owner_uid);

create policy "Users can delete their own contacts"
  on contacts for delete
  using (auth.uid() = owner_uid);

-- Policies for people (via contact_id)
create policy "Users can see people for their contacts"
  on people for select
  using (exists (
    select 1 from contacts
    where contacts.id = people.contact_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can insert people for their contacts"
  on people for insert
  with check (exists (
    select 1 from contacts
    where contacts.id = people.contact_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can update people for their contacts"
  on people for update
  using (exists (
    select 1 from contacts
    where contacts.id = people.contact_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can delete people for their contacts"
  on people for delete
  using (exists (
    select 1 from contacts
    where contacts.id = people.contact_id
    and contacts.owner_uid = auth.uid()
  ));

-- Policies for interactions (via contact_id)
create policy "Users can see interactions for their contacts"
  on interactions for select
  using (exists (
    select 1 from contacts
    where contacts.id = interactions.contact_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can insert interactions for their contacts"
  on interactions for insert
  with check (exists (
    select 1 from contacts
    where contacts.id = interactions.contact_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can update interactions for their contacts"
  on interactions for update
  using (exists (
    select 1 from contacts
    where contacts.id = interactions.contact_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can delete interactions for their contacts"
  on interactions for delete
  using (exists (
    select 1 from contacts
    where contacts.id = interactions.contact_id
    and contacts.owner_uid = auth.uid()
  ));

-- Policies for interaction_embeddings (via interaction_id)
create policy "Users can see embeddings for their interactions"
  on interaction_embeddings for select
  using (exists (
    select 1 from interactions
    join contacts on contacts.id = interactions.contact_id
    where interactions.id = interaction_embeddings.interaction_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can insert embeddings for their interactions"
  on interaction_embeddings for insert
  with check (exists (
    select 1 from interactions
    join contacts on contacts.id = interactions.contact_id
    where interactions.id = interaction_embeddings.interaction_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can update embeddings for their interactions"
  on interaction_embeddings for update
  using (exists (
    select 1 from interactions
    join contacts on contacts.id = interactions.contact_id
    where interactions.id = interaction_embeddings.interaction_id
    and contacts.owner_uid = auth.uid()
  ));

create policy "Users can delete embeddings for their interactions"
  on interaction_embeddings for delete
  using (exists (
    select 1 from interactions
    join contacts on contacts.id = interactions.contact_id
    where interactions.id = interaction_embeddings.interaction_id
    and contacts.owner_uid = auth.uid()
  ));
