-- -----------------------------------------------------
-- migration: disable rls policies
-- purpose: disable all row level security policies for flashcards app
-- date: 2025-04-10
-- -----------------------------------------------------

-- Drop policies for flashcards table
DROP POLICY IF EXISTS "authenticated users can select their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "authenticated users can insert their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "authenticated users can update their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "authenticated users can delete their own flashcards" ON flashcards;

-- Drop policies for generations table
DROP POLICY IF EXISTS "authenticated users can select their own generations" ON generations;
DROP POLICY IF EXISTS "authenticated users can insert their own generations" ON generations;
DROP POLICY IF EXISTS "authenticated users can update their own generations" ON generations;
DROP POLICY IF EXISTS "authenticated users can delete their own generations" ON generations;

-- Drop policies for generation_error_logs table
DROP POLICY IF EXISTS "authenticated users can select their own error logs" ON generation_error_logs;
DROP POLICY IF EXISTS "authenticated users can insert their own error logs" ON generation_error_logs;
DROP POLICY IF EXISTS "authenticated users can update their own error logs" ON generation_error_logs;
DROP POLICY IF EXISTS "authenticated users can delete their own error logs" ON generation_error_logs;

-- Disable row level security for all tables
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY; 