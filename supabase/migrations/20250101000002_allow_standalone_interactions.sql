-- Allow interactions without requiring a contact (for initial recording)
-- This makes contact_id nullable so we can save interactions first, then link them later
alter table interactions alter column contact_id drop not null;
