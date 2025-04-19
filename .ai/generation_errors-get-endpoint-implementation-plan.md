/* API Endpoint Implementation Plan: Generation Error Logs */

# API Endpoint Implementation Plan: Generation Error Logs

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest pobranie logów błędów występujących podczas sesji generacji AI. Endpoint ten jest przeznaczony głównie dla użytkowników administracyjnych lub do użytku wewnętrznego, umożliwiając monitorowanie i analizę problemów związanych z procesem generowania fiszek.

## 2. Szczegóły żądania
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/generation-errors`
- **Parametry zapytania:**
  - *Wymagane:* Brak
  - *Opcjonalne:*
    - `page` – numer strony dla paginacji
    - `limit` – liczba wpisów na stronę
    - (Możliwie dodatkowe filtry, np. `error_code`, mogą być rozważone w przyszłych iteracjach)
- **Body żądania:** Brak (GET request)

## 3. Wykorzystywane typy
- **GenerationErrorLogDTO:** DTO reprezentujący log błędów generacji, zgodnie z definicją w `src/types.ts`.
- **PaginatedResponse<GenerationErrorLogDTO>:** Struktura odpowiedzi paginowanej, służąca do standaryzacji zwracanych danych.

## 4. Szczegóły odpowiedzi
- **Status 200:** Pomyślne pobranie logów błędów
  - Treść: Lista obiektów typu `GenerationErrorLogDTO` ujęta w strukturę paginacji
- **Status 400:** Nieprawidłowe parametry zapytania
- **Status 401:** Brak autoryzacji lub nieważny token JWT
- **Status 500:** Błąd po stronie serwera, np. problem z bazą danych

## 5. Przepływ danych
1. Żądanie trafia do endpointu `/api/generation-errors`.
2. Middleware uwierzytelniający weryfikuje token JWT z nagłówka `Authorization` i ekstrahuje `user_id`.
3. Walidacja opcjonalnych parametrów zapytania (np. `page` oraz `limit`).
4. Logika biznesowa przekazywana do odpowiedniej funkcji serwisowej (np. `generationErrorsService`) w `src/lib/services`, która wykonuje zapytanie do bazy danych filtrując logi błędów dla danego `user_id`.
5. Wynik zapytania jest formatowany do struktury `PaginatedResponse<GenerationErrorLogDTO>` i zwracany jako odpowiedź JSON.

## 6. Względy bezpieczeństwa
- **Autoryzacja i uwierzytelnianie:** Endpoint wymaga poprawnego tokena JWT. Dostęp mają wyłącznie zalogowani użytkownicy.
- **Walidacja danych wejściowych:** Wszystkie opcjonalne parametry zapytania są walidowane, aby zapobiec nieprawidłowym wpisom oraz SQL Injection.
- **Dostęp:** Upewnij się, że użytkownik ma prawo dostępu do logów, szczególnie jeśli logi mają charakter wrażliwy; rozważyć dodatkowe sprawdzanie ról użytkowników.

## 7. Obsługa błędów
- **Błędy walidacji (400):** Zwracane gdy parametry zapytania nie spełniają oczekiwanych formatów lub zawierają nieprawidłowe wartości.
- **Błędy uwierzytelnienia (401):** Zwracane w przypadku braku lub niewłaściwego tokena JWT.
- **Błędy serwera (500):** Zwracane w przypadku nieoczekiwanych błędów w logice serwera lub błędów komunikacji z bazą danych.
- Wszystkie błędy powinny być odpowiednio logowane, aby ułatwić dalsze monitorowanie i diagnozowanie problemów.

## 8. Rozważania dotyczące wydajności
- **Paginacja:** Użycie paginacji zapobiega przeciążeniu serwera przy dużej liczbie logów.
- **Indeksowanie:** Upewnij się, że kolumna `user_id` oraz potencjalnie `error_code` w tabeli `generation_error_logs` są indeksowane.
- **Optymalizacja zapytań:** Zapytania do bazy danych powinny być zoptymalizowane przez ograniczenie liczby zwracanych wierszy oraz użycie technik cache (jeśli to możliwe).

## 9. Etapy wdrożenia
1. Utworzenie pliku endpointu w `src/pages/api/generation-errors.ts` obsługującego metodę GET.
2. Implementacja middleware do weryfikacji tokena JWT i ekstrakcji `user_id`.
3. Walidacja opcjonalnych parametrów zapytania (`page`, `limit`).
4. Utworzenie lub aktualizacja usługi w `src/lib/services` (np. `generationErrorsService`) odpowiedzialnej za pobieranie logów błędów z bazy danych.
5. Wykonanie zapytania do tabeli `generation_error_logs` z filtrowaniem po `user_id`.
6. Formatowanie wyników do struktury `PaginatedResponse<GenerationErrorLogDTO>`.
7. Implementacja obsługi błędów z odpowiednimi kodami statusu (400, 401, 500) oraz logowaniem błędów.
8. Aktualizacja dokumentacji API oraz komunikatów o błędach. 