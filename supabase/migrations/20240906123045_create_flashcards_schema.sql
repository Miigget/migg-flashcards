-- -----------------------------------------------------
-- migration: create flashcards schema
-- purpose: initial schema setup for migg flashcards app
-- date: 2024-09-06
-- author: ai-assistant
-- -----------------------------------------------------

-- -----------------------------------------------------
-- table: flashcards
-- -----------------------------------------------------
create table if not exists flashcards (
  flashcard_id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  front varchar(200) not null check (char_length(front) <= 200),
  back varchar(500) not null check (char_length(back) <= 500),
  collection varchar(30) not null check (collection <> ''),
  source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
  generation_id bigint,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint valid_generation_source check (
    (source in ('ai-full', 'ai-edited') and generation_id is not null) or
    (source = 'manual' and generation_id is null)
  )
);

-- automatically update updated_at on record updates
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_flashcards_updated_at
before update on flashcards
for each row
execute procedure update_updated_at_column();

-- create indexes for flashcards
create index idx_flashcards_user_id on flashcards(user_id);
create index idx_flashcards_generation_id on flashcards(generation_id);
create index idx_flashcards_collection on flashcards(collection);

-- -----------------------------------------------------
-- table: generations
-- -----------------------------------------------------
create table if not exists generations (
  generation_id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 100 and 10000),
  generation_duration interval not null,
  created_at timestamp with time zone not null default now()
);

-- create indexes for generations
create index idx_generations_user_id on generations(user_id);
create index idx_generations_source_text_hash on generations(source_text_hash);

-- add foreign key constraint from flashcards to generations
alter table flashcards 
add constraint fk_flashcards_generation_id 
foreign key (generation_id) references generations(generation_id);

-- -----------------------------------------------------
-- table: generation_error_logs
-- -----------------------------------------------------
create table if not exists generation_error_logs (
  generation_error_log_id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 100 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamp with time zone not null default now()
);

-- create indexes for generation_error_logs
create index idx_generation_error_logs_user_id on generation_error_logs(user_id);
create index idx_generation_error_logs_error_code on generation_error_logs(error_code);

-- -----------------------------------------------------
-- row level security (rls)
-- -----------------------------------------------------

-- enable row level security for all tables
alter table flashcards enable row level security;
alter table generations enable row level security;
alter table generation_error_logs enable row level security;

-- flashcards rls policies
-- policy for authenticated users to select their own flashcards
create policy "authenticated users can select their own flashcards"
on flashcards for select
to authenticated
using (auth.uid() = user_id);

-- policy for authenticated users to insert their own flashcards
create policy "authenticated users can insert their own flashcards"
on flashcards for insert
to authenticated
with check (auth.uid() = user_id);

-- policy for authenticated users to update their own flashcards
create policy "authenticated users can update their own flashcards"
on flashcards for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy for authenticated users to delete their own flashcards
create policy "authenticated users can delete their own flashcards"
on flashcards for delete
to authenticated
using (auth.uid() = user_id);

-- generations rls policies
-- policy for authenticated users to select their own generations
create policy "authenticated users can select their own generations"
on generations for select
to authenticated
using (auth.uid() = user_id);

-- policy for authenticated users to insert their own generations
create policy "authenticated users can insert their own generations"
on generations for insert
to authenticated
with check (auth.uid() = user_id);

-- policy for authenticated users to update their own generations
create policy "authenticated users can update their own generations"
on generations for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy for authenticated users to delete their own generations
create policy "authenticated users can delete their own generations"
on generations for delete
to authenticated
using (auth.uid() = user_id);

-- generation_error_logs rls policies
-- policy for authenticated users to select their own error logs
create policy "authenticated users can select their own error logs"
on generation_error_logs for select
to authenticated
using (auth.uid() = user_id);

-- policy for authenticated users to insert their own error logs
create policy "authenticated users can insert their own error logs"
on generation_error_logs for insert
to authenticated
with check (auth.uid() = user_id);

-- policy for authenticated users to update their own error logs
create policy "authenticated users can update their own error logs"
on generation_error_logs for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy for authenticated users to delete their own error logs
create policy "authenticated users can delete their own error logs"
on generation_error_logs for delete
to authenticated
using (auth.uid() = user_id); 