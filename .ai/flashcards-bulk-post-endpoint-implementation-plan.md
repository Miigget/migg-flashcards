# API Endpoint Implementation Plan: Bulk Creation of Flashcards

## 1. Przegląd punktu końcowego
Endpoint POST `/api/flashcards/bulk` umożliwia tworzenie wielu fiszek naraz. Ma on na celu wsparcie procesu akceptacji lub modyfikacji fiszek wygenerowanych przez AI, umożliwiając ich masowe dodanie do bazy.

## 2. Szczegóły żądania
- Metoda HTTP: `POST`
- Struktura URL: `/api/flashcards/bulk`
- Parametry:
  - Wymagane: Tablica obiektów typu FlashcardCandidate, gdzie dla każdego obiektu:
    - `front`: Tekst przedniej strony (maksymalnie 200 znaków)
    - `back`: Tekst tylnej strony (maksymalnie 500 znaków)
    - `collection`: Nazwa kolekcji (niepusty string)
    - `source`: Wartość musi być ustawiona na `ai-full` lub `ai-edited`
    - Jeśli `source` to `ai-full` lub `ai-edited`, pole `generation_id` musi być obecne i niepuste
  - Opcjonalne: Dodatkowe atrybuty zgodne ze schematem bazy danych

## 3. Wykorzystywane typy
- `FlashcardCandidateDto` (zdefiniowany w `src/types.ts`): Reprezentuje fiszki wygenerowane przez AI, zawierające pola: `front`, `back`, `collection`, `source` (wartości: "ai-full" lub "ai-edited") oraz `generation_id`.
- `BulkCreateFlashcardsCommand`: Typ definiujący polecenie, czyli tablica obiektów typu `FlashcardCandidateDto`.

## 4. Szczegóły odpowiedzi
- Sukces:
  - Kod statusu: `201 Created`
  - Treść odpowiedzi: Lista utworzonych fiszek wraz z komunikatami statusowymi (np. potwierdzenie wstawienia dla każdego rekordu).
- Błędy:
  - `400 Bad Request` w przypadku nieprawidłowych danych wejściowych.
  - `401 Unauthorized` jeżeli użytkownik nie jest autoryzowany.
  - `500 Internal Server Error` dla błędów serwera lub nieoczekiwanych błędów.

## 5. Przepływ danych
1. Odbiór żądania z tablicą obiektów fiszek.
2. Walidacja danych wejściowych przy użyciu narzędzia walidacyjnego (np. Zod), zgodnie ze schematem `BulkCreateFlashcardsCommand`.
3. Weryfikacja autoryzacji użytkownika poprzez middleware (sprawdzanie tokenu JWT oraz przypisanie `user_id`).
4. Przekazanie danych do warstwy serwisowej (np. `flashcardsService.bulkCreate`), która:
   - Pobiera `user_id` z kontekstu autoryzacji (np. za pomocą Supabase Auth)
   - Wykonuje operację masowego wstawiania fiszek do bazy danych, stosując transakcję dla zachowania spójności
5. Zwrócenie odpowiedzi do klienta z listą utworzonych rekordów lub komunikatami o błędach.

## 6. Względy bezpieczeństwa
- Autoryzacja: Weryfikacja tokenu JWT i upewnienie się, że operacje dotyczą tylko zasobów użytkownika.
- Walidacja danych: Wykorzystanie Zod lub innej biblioteki walidacyjnej do rygorystycznej walidacji danych wejściowych.
- Ochrona przed SQL Injection: Użycie zapytań parametryzowanych oraz API bazy danych (Supabase) do bezpiecznego wstawiania danych.
- Logowanie błędów: Rejestrowanie błędów podczas operacji wstawiania oraz zapisywanie krytycznych zdarzeń, ewentualnie w tabeli `generation_error_logs` przy błędach związanych z generacją AI.

## 7. Obsługa błędów
- `400 Bad Request`: Gdy dane wejściowe są nieprawidłowe (np. zły format, przekroczone limity znaków).
- `401 Unauthorized`: Gdy użytkownik nie dostarczy prawidłowego tokenu autoryzacyjnego.
- `500 Internal Server Error`: W przypadku błędów wynikających z problemów po stronie serwera lub baz danych.
- Każdy błąd powinien zawierać jasny komunikat opisujący problem i, jeśli to możliwe, unikalny kod błędu dla dalszej diagnostyki.

## 8. Rozważania dotyczące wydajności
- Wykorzystanie operacji masowego wstawiania (bulk insert) dla zminimalizowania liczby zapytań do bazy.
- Użycie transakcji, aby zapewnić atomowość operacji – wszystkie fiszki są wstawiane jednocześnie lub nie są wstawiane wcale.
- Monitorowanie wydajności przy dużych zbiorach danych i, w razie potrzeby, optymalizacja zapytań.

## 9. Etapy wdrożenia
1. Utworzenie nowego endpointu w ścieżce `/api/flashcards/bulk` z metodą POST.
2. Implementacja middleware autoryzacyjnego, który:
   - Weryfikuje token JWT
   - Ekstrahuje `user_id` i dołącza go do kontekstu żądania
3. Definicja schematu walidacji za pomocą Zod dla `BulkCreateFlashcardsCommand`.
4. Utworzenie funkcji w warstwie serwisowej (np. `flashcards-bulk.service`), która:
   - Weryfikuje poprawność danych
   - Realizuje operację wstawiania danych w ramach transakcji
   - Obsługuje logikę biznesową związaną z walidacją źródła fiszek (`ai-full` lub `ai-edited`)
5. Integracja funkcji serwisowej z endpointem i przygotowanie odpowiedzi w formacie zgodnym z wymaganiami.
6. Implementacja mechanizmów logowania błędów oraz, w razie potrzeby, zapisywanie błędów w tabeli `generation_error_logs`.
7. Aktualizacja dokumentacji API oraz poinformowanie zespołu o nowym endpointzie. 