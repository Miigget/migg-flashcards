# API Endpoint Implementation Plan: PUT /api/flashcards/{flashcard_id}

## 1. Przegląd punktu końcowego
- Cel: Aktualizacja istniejącej fiszki, umożliwiająca użytkownikowi modyfikację jej treści (pól: front, back, collection).
- Funkcjonalność: Endpoint przyjmuje dane w formacie JSON wraz z identyfikatorem fiszki w URL, weryfikuje uprawnienia użytkownika, waliduje dane wejściowe oraz aktualizuje rekord w bazie danych (Supabase). 

## 2. Szczegóły żądania
- **Metoda HTTP:** PUT
- **Struktura URL:** /api/flashcards/{flashcard_id}
- **Parametry URL:**
  - `flashcard_id` (wymagany) – unikalny identyfikator fiszki
- **Request Body (JSON):**
  - `front` (opcjonalny): string, maksymalnie 200 znaków
  - `back` (opcjonalny): string, maksymalnie 500 znaków
  - `collection` (opcjonalny): string, maks. 30 znaków, nie może być pusty

## 3. Wykorzystywane typy
- **DTO:**
  - `FlashcardUpdateRequestDto` – obiekt zawierający opcjonalne pola: `front`, `back`, `collection`.
  - `FlashcardResponseDto` – obiekt zwracany jako odpowiedź zawierający m.in. `flashcard_id`, `user_id`, `front`, `back`, `collection`, `source`, `generation_id`, `created_at`, `updated_at`.
- **Command Model:** 
  - `UpdateFlashcardCommand` – model wykorzystywany przez logikę serwisową, zawierający: identyfikator fiszki oraz dane aktualizacyjne.

## 4. Szczegóły odpowiedzi
- **Sukces:**
  - Kod 200
  - Zwracany obiekt: zaktualizowana fiszka (FlashcardResponseDto).
- **Błędy:**
  - 400 Bad Request – dla nieprawidłowych danych wejściowych (np. przekroczenie limitu znaków)
  - 401 Unauthorized – gdy token autoryzacyjny jest nieprawidłowy lub nieobecny
  - 404 Not Found – gdy fiszka o podanym `flashcard_id` nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error – w przypadku błędów serwera

## 5. Przepływ danych
1. Odbieranie żądania PUT z `flashcard_id` w URL oraz danymi JSON w ciele żądania.
2. Weryfikacja tokenu JWT z nagłówka `Authorization` i ekstrakcja `user_id`.
3. Walidacja danych wejściowych za pomocą schemy (np. Zod), sprawdzającej ograniczenia długości i wymagania dotyczące pól.
4. Sprawdzenie, czy fiszka o danym `flashcard_id` istnieje i czy należy do autoryzowanego użytkownika.
5. Wywołanie funkcji serwisowej (np. `updateFlashcard` w `src/lib/services/flashcards.ts`) odpowiedzialnej za aktualizację rekordu w bazie danych Supabase.
6. Aktualizacja pola `updated_at` (automatycznie przez trigger bazy lub ręcznie).
7. Zwrócenie odpowiedzi 200 z zaktualizowanymi danymi fiszki.

## 6. Względy bezpieczeństwa
- **Uwierzytelnienie:** Wymagany token JWT przesyłany w nagłówku `Authorization: Bearer <token>`.
- **Autoryzacja:** Weryfikacja, czy `user_id` z tokenu zgadza się z właścicielem fiszki.
- **Walidacja danych:** Użycie schemy walidacyjnej (np. Zod) do sprawdzenia poprawności przesłanych danych oraz ograniczeń (m.in. długości pól).
- **Ochrona przed atakami:** Korzystanie z zabezpieczonych zapytań do bazy danych (Supabase) minimalizujących ryzyko SQL Injection.
- **Logowanie błędów:** Bezpieczne logowanie błędów bez ujawniania danych wrażliwych.

## 7. Obsługa błędów
- **400 Bad Request:** W przypadku, gdy dane wejściowe nie spełniają wymagań walidacyjnych (np. zbyt długa wartość dla `front`, `back` lub `collection`).
- **401 Unauthorized:** Gdy brak tokenu lub token jest nieprawidłowy.
- **404 Not Found:** Gdy nie znaleziono fiszki o podanym `flashcard_id` lub użytkownik nie ma do niej dostępu.
- **500 Internal Server Error:** W przypadku nieoczekiwanych błędów podczas operacji na bazie danych lub innych błędów serwera.

## 8. Rozważania dotyczące wydajności
- Użycie indeksów na kolumnach `flashcard_id` oraz `user_id` w tabeli `flashcards` poprawi szybkość zapytań.
- Minimalizacja liczby zapytań do bazy danych poprzez łączenie operacji (sprawdzenie istnienia i aktualizacja w jednej transakcji, jeśli to możliwe).
- Optymalizacja serwera dzięki użyciu asynchronicznego dostępu do bazy (np. z wykorzystaniem Supabase client).

## 9. Kroki implementacji
1. **Definicja DTO i schemy walidacyjnej:**
   - Zdefiniowanie `FlashcardUpdateRequestDto` w pliku typów (np. `src/types.ts`).
   - Utworzenie schemy walidacyjnej za pomocą Zod, sprawdzającej ograniczenia długości oraz obecność wymaganych pól.

2. **Implementacja endpointu:**
   - Utworzenie pliku API: `src/pages/api/flashcards/[flashcard_id].ts`.
   - Obsługa metody PUT, w tym:
     - Weryfikacja tokenu JWT i ekstrakcja `user_id`.
     - Parsowanie i walidacja ciała żądania przy użyciu utworzonej schemy.

3. **Logika serwisowa:**
   - Wyodrębnienie logiki aktualizacji fiszki do dedykowanego serwisu (np. `updateFlashcard` w `src/lib/services/flashcards.ts`).
   - Weryfikacja, czy fiszka należy do użytkownika oraz aktualizacja rekordu w bazie danych (Supabase).
   - Aktualizacja pola `updated_at` poprzez wyzwalacz bazy lub ręcznie.

4. **Obsługa błędów:**
   - Implementacja obsługi błędów dla różnych scenariuszy: walidacja, brak autoryzacji, nieznaleziona fiszka, błąd serwera.
   - Zwracanie odpowiednich kodów stanu HTTP (400, 401, 404, 500).

5. **Dokumentacja:**
   - Aktualizacja dokumentacji API oraz README z przykładami użycia endpointu.
