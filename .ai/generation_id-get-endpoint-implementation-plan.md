# API Endpoint Implementation Plan: GET /api/generations/{generation_id}

## 1. Przegląd punktu końcowego
Endpoint umożliwia pobranie szczegółów sesji generacji AI na podstawie identyfikatora (generation_id). Jego celem jest zwrócenie pełnych informacji o danej sesji generacji, w tym nazwy użytego modelu, liczby wygenerowanych fiszek, czasu trwania generacji oraz pozostałych istotnych danych.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/api/generations/{generation_id}`
- Parametry:
  - Wymagane: 
    - `generation_id`: unikalny identyfikator sesji generacji (typ: liczba)
  - Opcjonalne: brak
- Request Body: brak

## 3. Wykorzystywane typy
- DTO: `GenerationResponseDTO` (reprezentuje rekord z tabeli `generations`), który zawiera pola:
  - `generation_id`: number
  - `user_id`: string
  - `model`: string
  - `generated_count`: number
  - `accepted_unedited_count`: number | null
  - `accepted_edited_count`: number | null
  - `source_text_hash`: string
  - `source_text_length`: number
  - `generation_duration`: string (reprezentacja czasu, np. w formacie ISO lub HH:MM:SS)
  - `created_at`: string (data w formacie ISO)
- Command Model: brak (ponieważ endpoint nie przyjmuje ciała żądania, a jedynie parametr ścieżki)

## 4. Szczegóły odpowiedzi
- Kod 200: Zwraca szczegóły sesji generacji w formacie JSON.
  - Przykładowa odpowiedź:
    ```json
    {
      "generation_id": 123,
      "user_id": "uuid-abc-123",
      "model": "openai-gpt",
      "generated_count": 15,
      "accepted_unedited_count": 10,
      "accepted_edited_count": 5,
      "source_text_hash": "abcdef123456",
      "source_text_length": 500,
      "generation_duration": "00:00:05",
      "created_at": "2023-10-05T12:34:56Z"
    }
    ```
- Kody błędów:
  - 400: Nieprawidłowy format identyfikatora (np. nie jest liczbą).
  - 401: Brak lub niepoprawny token uwierzytelnienia.
  - 404: Sesja generacji o podanym `generation_id` nie została znaleziona lub użytkownik nie ma do niej dostępu.
  - 500: Błąd po stronie serwera.

## 5. Przepływ danych
1. Klient wysyła żądanie GET do `/api/generations/{generation_id}` z poprawnym tokenem uwierzytelnienia (JWT).
2. Middleware weryfikuje token i wydobywa `user_id` użytkownika.
3. Parametr `generation_id` jest parsowany i walidowany (sprawdzenie, czy jest liczbą).
4. Serwer wykonuje zapytanie do bazy danych Supabase, aby pobrać rekord z tabeli `generations`, gdzie `generation_id` odpowiada podanemu parametrze oraz `user_id` zgadza się z użytkownikiem z tokena.
5. Jeżeli rekord zostanie znaleziony, dane są mapowane na DTO (`GenerationResponseDTO`) i zwracane z kodem 200.
6. Jeśli rekord nie istnieje lub użytkownik nie ma dostępu, serwer zwraca błąd 404.
7. W przypadku nieprawidłowych danych wejściowych lub braku tokena, zwracane są odpowiednio kody 400 lub 401.
8. W przypadku nieprzewidzianych błędów, zwracany jest kod 500, a błąd jest logowany.

## 6. Względy bezpieczeństwa
- Uwierzytelnianie: Endpoint jest zabezpieczony middlewarem weryfikującym token JWT. Brak poprawnego tokena skutkuje zwróceniem błędu 401.
- Autoryzacja: Po weryfikacji tokena, serwer sprawdza, czy `user_id` z tokena pokrywa się z `user_id` sesji generacji. W przypadku niezgodności, zwracany jest błąd 404 (lub opcjonalnie 403, ale zgodnie z dostarczoną specyfikacją używamy 404).
- Walidacja danych: Parametr `generation_id` musi spełniać oczekiwany format (liczba), aby uniknąć błędów podczas zapytania do bazy danych.
- Zapobieganie SQL Injection: Używanie przygotowanych zapytań lub ORM w celu zabezpieczenia zapytań do bazy danych.

## 7. Rozważania dotyczące wydajności
- Zapytanie dotyczy pojedynczego rekordu, dzięki czemu obciążenie serwera jest minimalne.
- Odpowiednie indeksy w bazie danych (na `generation_id` i `user_id`) zapewniają szybki dostęp do danych.
- Opcjonalnie: rozważenie mechanizmów cachowania dla redukcji liczby zapytań do bazy przy powtarzających się żądaniach.

## 8. Etapy wdrożenia
1. Utworzenie nowego handlera endpointa w pliku np. `/src/pages/api/generations/[generation_id].ts`.
2. Implementacja middleware'a do weryfikacji tokenu JWT i wydobycia `user_id`.
3. Walidacja parametru `generation_id`:
   - Sprawdzenie, czy jest liczbą.
   - W razie błędu zwrócenie statusu 400.
4. Wykonanie zapytania do bazy danych (Supabase):
   - Pobranie rekordu z tabeli `generations` pasującego do `generation_id` oraz `user_id` z tokena.
   - W przypadku braku rekordu, zwrócenie statusu 404.
5. Mapowanie danych z rekordu na DTO (`GenerationResponseDTO`).
6. Zwrócenie odpowiedzi z kodem 200 oraz danymi sesji generacji.
7. Implementacja logiki obsługi wyjątków, w tym:
   - Przechwytywanie błędów walidacji, uwierzytelnienia i nieoczekiwanych błędów serwera (500).
   - Opcjonalne logowanie błędów do tabeli `generation_error_logs` (jeżeli to wymagane przez reguły biznesowe).
 