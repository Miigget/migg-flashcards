# Schemat bazy danych dla Migg Flashcards

## 1. Tabele i kolumny

### 1.1. users

This table is managed by Supabase Auth.

- **user_id**: UUID PRIMARY KEY
- **email**: VARCHAR NOT NULL UNIQUE
- **encrypted_password**: VARCHAR NOT NULL
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
- **confirmed_at**: TIMESTAMP WITH TIME ZONE

### 1.2. flashcards
- **flashcard_id**: BIGSERIAL PRIMARY KEY
- **user_id**: UUID NOT NULL REFERENCES users(user_id)
- **front**: VARCHAR(200) NOT NULL, CHECK (char_length(front) <= 200)
- **back**: VARCHAR(500) NOT NULL, CHECK (char_length(back) <= 500)
- **collection**: VARCHAR(30) NOT NULL, CHECK (collection <> '')
- **source**: VARCHAR NOT NULL, CHECK (source IN ('ai-full', 'ai-edited', 'manual'))
- **generation_id**: BIGINT REFERENCES generations(generation_id)
  
  • **Constraint**: CHECK ((source IN ('ai-full', 'ai-edited') AND generation_id IS NOT NULL)
  	OR (source = 'manual' AND generation_id IS NULL))
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()

*Trigger: Automatically update the `updated_at` column on record updates.*

### 1.3. generations
- **generation_id**: BIGSERIAL PRIMARY KEY
- **user_id**: UUID NOT NULL REFERENCES users(user_id)
- **model**: VARCHAR NOT NULL
- **generated_count**: INTEGER NOT NULL
- **accepted_unedited_count**: INTEGER NULLABLE
- **accepted_edited_count**: INTEGER NULLABLE
- **source_text_hash**: VARCHAR NOT NULL
- **source_text_length**: INTEGER NOT NULL CHECK (source_text_length BETWEEN 100 AND 10000)
- **generation_duration**: INTERVAL NOT NULL
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()

### 1.4. generation_error_logs
- **generation_error_log_id**: BIGSERIAL PRIMARY KEY
- **user_id**: UUID NOT NULL REFERENCES users(user_id)
- **model**: VARCHAR NOT NULL
- **source_text_hash**: VARCHAR NOT NULL
- **source_text_length**: INTEGER NOT NULL CHECK (source_text_length BETWEEN 100 AND 10000)
- **error_code**: VARCHAR(100) NOT NULL
- **error_message**: TEXT NOT NULL
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()

## 2. Relacje między tabelami
- Każdy rekord w `users` może mieć wiele rekordów w tabelach `flashcards`, `generations` oraz `generation_error_logs`.
- Relacja między `flashcards` a `generations`:
  - `flashcards.generation_id` odnosi się do `generations.generation_id` (relacja jeden-do-wielu). Obowiązkowe dla fiszek generowanych przez AI (source: 'ai-full' lub 'ai-edited').
- Relacje przez kolumnę **user_id**:
  - `flashcards.user_id` REFERENCES `users(user_id)`
  - `generations.user_id` REFERENCES `users(user_id)`
  - `generation_error_logs.user_id` REFERENCES `users(user_id)`

## 3. Indeksy
- **users**:
  - Indeks na `user_id` (PRIMARY KEY).
- **flashcards**:
  - Indeks na `user_id`.
  - Indeks na `generation_id`.
  - Indeks na `collection`.
- **generations**:
  - Indeks na `user_id`.
  - Indeks na `source_text_hash`.
- **generation_error_logs**:
  - Indeks na `user_id`.
  - Indeks na `error_code`.

## 4. Zasady PostgreSQL (Row-Level Security - RLS)
Dla tabel `flashcards`, `generations` oraz `generation_error_logs` wdrożone zostaną zasady RLS, oparte na kolumnie **user_id**, które pozwalają na dostęp tylko do rekordów, gdzie **user_id** odpowiada identyfikatorowi użytkownika z Supabase Auth (np. auth.uid() = user_id).

## 5. Dodatkowe uwagi
- Schemat został zaprojektowany zgodnie z wymaganiami MVP oraz notatkami sesji planowania.
- Ograniczenia CHECK zapewniają integralność danych, np. limit długości tekstu w kolumnach `front` i `back` oraz obowiązkowy `generation_id` dla fiszek generowanych przez AI.
- Trigger w tabeli **flashcards** ma automatycznie aktualizować kolumnę `updated_at` przy każdej modyfikacji rekordu.
- Indeksowanie kluczowych kolumn (np. `user_id`, `generation_id`, `collection`, `source_text_hash`, `error_code`) ma na celu optymalizację zapytań.
- RLS gwarantuje, że użytkownicy mają dostęp tylko do swoich danych, co jest wspierane przez mechanizm Supabase Auth.
- Schemat jest prosty i umożliwia łatwą rozbudowę w przyszłości, np. dodanie audytu czy partycjonowania, jeśli zajdzie taka potrzeba. 