-- -----------------------------------------------------
-- migration: add flashcard_srs_metadata table
-- purpose: add support for spaced repetition with FSRS algorithm
-- date: 2024-09-08
-- -----------------------------------------------------

-- -----------------------------------------------------
-- table: flashcard_srs_metadata
-- -----------------------------------------------------
create table if not exists flashcard_srs_metadata (
  flashcard_id bigint not null references flashcards(flashcard_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  due timestamp with time zone not null,
  stability double precision not null,
  difficulty double precision not null,
  elapsed_days integer not null,
  scheduled_days integer not null,
  reps integer not null,
  lapses integer not null,
  state integer not null, -- Maps to State from ts-fsrs: 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review timestamp with time zone,
  fsrs_params_hash text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (flashcard_id, user_id)
);

-- automatically update updated_at on record updates
create trigger update_flashcard_srs_metadata_updated_at
before update on flashcard_srs_metadata
for each row
execute procedure update_updated_at_column();

-- create indexes for flashcard_srs_metadata
create index idx_flashcard_srs_metadata_user_id on flashcard_srs_metadata(user_id);
create index idx_flashcard_srs_metadata_due on flashcard_srs_metadata(due);
create index idx_flashcard_srs_metadata_state on flashcard_srs_metadata(state);

-- -----------------------------------------------------
-- row level security (rls)
-- -----------------------------------------------------

-- enable row level security
alter table flashcard_srs_metadata enable row level security;

-- policy for authenticated users to select their own flashcard_srs_metadata
create policy "authenticated users can select their own flashcard_srs_metadata"
on flashcard_srs_metadata for select
to authenticated
using (auth.uid() = user_id);

-- policy for authenticated users to insert their own flashcard_srs_metadata
create policy "authenticated users can insert their own flashcard_srs_metadata"
on flashcard_srs_metadata for insert
to authenticated
with check (auth.uid() = user_id);

-- policy for authenticated users to update their own flashcard_srs_metadata
create policy "authenticated users can update their own flashcard_srs_metadata"
on flashcard_srs_metadata for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy for authenticated users to delete their own flashcard_srs_metadata
create policy "authenticated users can delete their own flashcard_srs_metadata"
on flashcard_srs_metadata for delete
to authenticated
using (auth.uid() = user_id); 