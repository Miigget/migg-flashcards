# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego
Ten endpoint umożliwia pobranie listy fiszek przypisanych do uwierzytelnionego użytkownika. Wspiera paginację, filtrowanie po kolekcji oraz sortowanie wyników, co pozwala na elastyczne wyszukiwanie i prezentację danych.

## 2. Szczegóły żądania
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/flashcards`
- **Parametry zapytania:**
  - Wymagane:
    - `page` (numer strony)
    - `limit` (ilość fiszek na stronę)
  - Opcjonalne:
    - `collection` (nazwa kolekcji, do filtrowania fiszek)
    - `sort` (kryterium sortowania, np. `created_at`)
    - `order` (kierunek sortowania: `asc` lub `desc`)
- **Body:** Brak

## 3. Wykorzystywane typy
- **FlashcardDTO:** Definiowany w `src/types.ts`, reprezentuje strukturę fiszki w bazie danych.
- **PaginatedResponse<T>:** Ogólny typ odpowiedzi, zawierający tablicę danych (`data`), numer strony (`page`), limit (`limit`) oraz łączną liczbę rekordów (`total`).

## 4. Szczegóły odpowiedzi
- **Kod odpowiedzi:**
  - 200 OK – Pomyślne pobranie listy fiszek
- **Struktura odpowiedzi (JSON):**
  ```json
  {
    "data": [ { /* FlashcardDTO */ } ],
    "page": number,
    "limit": number,
    "total": number
  }
  ```

## 5. Przepływ danych
1. **Walidacja zapytania:**
   - Walidacja parametrów `page` i `limit` oraz opcjonalnie `collection`, `sort` i `order` przy użyciu biblioteki Zod.
2. **Autoryzacja:**
   - Middleware sprawdza token JWT, ekstrakcja `user_id` umożliwiająca ograniczenie danych fiszek do użytkownika.
3. **Budowanie zapytania:**
   - Utworzenie zapytania SQL do tabeli `flashcards`, filtrując rekordy po `user_id`.
   - Dodanie warunków filtrowania (np. po `collection`) oraz sortowania na podstawie przekazanych parametrów.
   - Użycie paginacji przez `limit` oraz `offset` (obliczony jako `(page - 1) * limit`).
4. **Wykonanie zapytania do bazy:**
   - Zapytanie jest wykonywane przy użyciu klienta Supabase lub innego łącza do Postgresa.
5. **Formatowanie odpowiedzi:**
   - Wyniki zapytania są opakowywane w strukturę `PaginatedResponse<FlashcardDTO>` i zwracane jako JSON.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Wykorzystanie JWT do autoryzacji i walidacji, zapewniając że użytkownik widzi tylko swoje fiszki.
- **Walidacja danych:** Wprowadzenie silnej walidacji parametrów wejściowych za pomocą Zod, aby zapobiec SQL Injection oraz błędom walidacyjnym.
- **Indeksacja:** Baza danych powinna mieć indeksy na kolumnach `user_id` i `collection`, aby zoptymalizować zapytania.
- **Kontrola dostępu:** Sprawdzenie, że użytkownik pobiera dane tylko dla swojego `user_id`.

## 7. Obsługa błędów
- **400 Bad Request:** Gdy walidacja parametrów nie powiedzie się (np. niepoprawny format `page` lub `limit`).
- **401 Unauthorized:** Gdy token JWT jest nieprawidłowy, wygasł lub nie został dostarczony.
- **404 Not Found:** (Rzadko, przy pobieraniu listy, zwykle zwracana pusta lista zamiast 404).
- **500 Internal Server Error:** W przypadku nieoczekiwanych błędów serwera lub bazy danych.
- **Strategia:**
  - Użycie try-catch oraz centralnego middleware do obsługi błędów, logowanie szczegółowych błędów w logach serwera.

## 8. Rozważania dotyczące wydajności
- **Paginacja:** Używanie limit/offset aby minimalizować ilość przetwarzanych danych.
- **Indeksowanie:** Upewnienie się, że kolumny `user_id` i `collection` są właściwie indeksowane.
- **Cache (opcjonalnie):** Rozważenie cache'owania często pobieranych zestawów danych, jeśli to konieczne.

## 9. Etapy wdrożenia
1. Utworzenie nowego endpointu GET `/api/flashcards` w odpowiednim pliku API (np. `src/pages/api/flashcards/index.ts`).
2. Implementacja walidacji zapytania przy użyciu Zod dla parametrów `page`, `limit`, `collection`, `sort` i `order`.
3. Zaimplementowanie middleware do ekstrakcji i walidacji tokenu JWT oraz wyciągnięcia `user_id`.
4. Wyodrębnienie logiki zapytań do nowego/istniejącego serwisu (np. `src/lib/services/flashcardService.ts`), który będzie budował i wykonywał zapytanie do bazy danych.
5. Implementacja mechanizmu filtrowania, sortowania oraz paginacji (obliczenie offsetu wg. `page` i `limit`).
6. Zapewnienie odpowiedniej struktury odpowiedzi zgodnej z typem `PaginatedResponse<FlashcardDTO>`.
7. Implementacja mechanizmów obsługi błędów (walidacja, try-catch, middleware błędów), tak aby zwracać poprawne kody statusu (400, 401, 500).
8. Przegląd kodu oraz audyt bezpieczeństwa przed wdrożeniem na produkcję.
9. Aktualizacja dokumentacji API, aby odzwierciedlała zmiany oraz sposób korzystania z endpointu. 