# API Endpoint Implementation Plan: DELETE /api/collections/{collection_name}

## 1. Przegląd punktu końcowego
Ten endpoint umożliwia usunięcie kolekcji flashcards poprzez usunięcie wszystkich fiszek powiązanych z podaną nazwą kolekcji dla uwierzytelnionego użytkownika. Dzięki temu kolekcja przestaje istnieć, gdy wszystkie jej fiszki zostaną usunięte.

## 2. Szczegóły żądania
- **Metoda HTTP:** DELETE
- **Struktura URL:** /api/collections/{collection_name}
- **Parametry:**
  - **Wymagane:**
    - `collection_name` (ścieżkowy parametr) – nazwa kolekcji do usunięcia.
  - **Opcjonalne:** Żadne.
- **Request Body:** Nie dotyczy.

## 3. Wykorzystywane typy
- **FlashcardDTO:** Typ reprezentujący fiszkę z tabeli `flashcards`.
- **Response Object:** Niestandardowy obiekt odpowiedzi zawierający:
  - `message` (string) – komunikat potwierdzający operację.
  - `deletedCount` (number) – liczba usuniętych fiszek.

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK):**
  ```json
  {
    "message": "Collection 'NazwaKolekcji' deleted successfully.",
    "deletedCount": 10
  }
  ```
- **Błędy:**
  - **400 Bad Request:** dla nieprawidłowych danych wejściowych (np. pusta nazwa kolekcji).
  - **401 Unauthorized:** gdy brakuje lub jest nieprawidłowy token uwierzytelniający.
  - **500 Internal Server Error:** dla błędów po stronie serwera.

## 5. Przepływ danych
1. Klient wysyła żądanie DELETE do `/api/collections/{collection_name}` z prawidłowym tokenem JWT w nagłówku `Authorization`.
2. Middleware weryfikuje token oraz wyciąga `user_id` użytkownika.
3. Endpoint pobiera i waliduje parametr `collection_name` z URL.
4. Wykonywane jest zapytanie do bazy danych, które usuwa wszystkie fiszki powiązane z danym `user_id` oraz `collection_name`.
5. Liczba usuniętych wierszy jest zliczana.
6. Endpoint zwraca odpowiedź z potwierdzeniem oraz liczbą usuniętych fiszek.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Sprawdzenie tokenu JWT przekazanego w nagłówku `Authorization` przed przetwarzaniem żądania.
- **Autoryzacja:** Zapewnienie, że tylko fiszki należące do uwierzytelnionego użytkownika są usuwane.
- **Walidacja wejścia:** Sprawdzenie, że `collection_name` jest niepustym stringiem oraz spełnia ograniczenia długości (np. maks. 30 znaków).
- **Ochrona przed SQL Injection:** Użycie zapytań parametryzowanych lub odpowiedniego query buildera (np. udostępnionego przez Supabase).
- **Logowanie błędów:** Stosowanie bezpiecznego logowania błędów bez ujawniania wrażliwych informacji.

## 7. Obsługa błędów
- **400 Bad Request:** Jeśli `collection_name` jest pusty lub nie spełnia wymagań walidacji.
- **401 Unauthorized:** Jeśli token uwierzytelniający nie został dostarczony lub jest nieprawidłowy.
- **500 Internal Server Error:** W przypadku nieoczekiwanych błędów podczas operacji usuwania.
- Każda odpowiedź błędu zawiera opisowy komunikat, a błędy są logowane w systemie.

## 8. Rozważania dotyczące wydajności
- **Bulk Deletion:** Operacja usuwania odbywa się przy użyciu pojedynczego zapytania SQL, co jest wydajne nawet przy dużej liczbie fiszek.
- **Optymalizacja indeksów:** Tabela `flashcards` posiada indeksy na kolumny `user_id` i `collection`, co przyspiesza zapytanie usuwające odpowiednie rekordy.
- **Minimalizacja zapytań:** Cała operacja (walidacja, usunięcie, zliczenie) powinna być wykonana w jednej transakcji, aby ograniczyć liczbę połączeń z bazą danych.

## 9. Kroki implementacji
1. Utworzenie nowego pliku endpointu API w ścieżce `src/pages/api/collections/[collection_name].ts`.
2. Implementacja middleware uwierzytelniającego do weryfikacji tokenu JWT oraz wyciągania `user_id`.
3. Walidacja parametru `collection_name` – sprawdzenie, czy nie jest pusty oraz czy spełnia ograniczenia długości.
4. Utworzenie funkcji serwisowej (np. w `src/lib/services/collections.ts`), która:
   - Pobiera `user_id` oraz `collection_name` i wykonuje zapytanie usuwające fiszki z bazy danych.
   - Zwraca liczbę usuniętych wierszy.
5. W implementacji endpointu:
   - Parsowanie oraz walidacja danych wejściowych.
   - Wywołanie funkcji serwisowej odpowiedzialnej za usunięcie fiszek.
   - Budowanie i wysłanie odpowiedzi JSON z komunikatem potwierdzającym oraz liczbą usuniętych fiszek.
6. Obsługa wyjątków i błędów – przechwytywanie wyjątków, logowanie błędów oraz wysyłanie odpowiednich kodów statusu HTTP.
8. Aktualizacja dokumentacji API o nowy endpoint oraz jego opis. 