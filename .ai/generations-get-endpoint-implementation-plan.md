# API Endpoint Implementation Plan: GET /api/generations

## 1. Przegląd punktu końcowego
Endpoint umożliwia pobranie listy sesji generacji flashcards dla uwierzytelnionego użytkownika. Zwraca metadane dotyczące sesji, takie jak model, liczba wygenerowanych fiszek, czas trwania generacji oraz dodatkowe informacje, które mogą być wykorzystane przy analizie historii generacji.

## 2. Szczegóły żądania
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/generations`
- **Parametry zapytania:**
  - *Opcjonalne:*
    - `page`: numer strony (domyślnie 1)
    - `limit`: liczba elementów na stronę (domyślnie 10 lub 20)
- **Nagłówki:**
  - `Authorization: Bearer <token>` (JWT wymagany do uwierzytelnienia użytkownika)

## 3. Wykorzystywane typy
- **DTO:**
  - `GenerationDTO` (definiowany w `src/types.ts`) - reprezentuje rekord sesji generacji z bazy danych
- **Command/Model:**
  - `PaginatedResponse<GenerationDTO>` - struktura opakowująca dane stronicowane
- **Walidacja:**
  - Zod schema do walidacji query parameters (`page` i `limit`)

## 4. Szczegóły odpowiedzi
- **Status HTTP 200:**
  - Sukces. Zwraca obiekt JSON zawierający:
    - `data`: tablica obiektów `GenerationDTO`
    - `page`: numer aktualnej strony
    - `limit`: liczba rekordów na stronie
    - `total`: całkowita liczba sesji generacji
- **Możliwe kody błędów:**
  - **400:** Nieprawidłowe dane wejściowe (np. błędne parametry paginacji)
  - **401:** Brak lub nieważny token autoryzacyjny
  - **500:** Błąd po stronie serwera

## 5. Przepływ danych
1. **Uwierzytelnienie:**
   - Middleware weryfikuje token JWT i pozyskuje `user_id` z kontekstu (np. `context.locals` z Supabase).
2. **Walidacja parametrów:**
   - Query parameters `page` i `limit` są walidowane przy użyciu Zod schema.
3. **Pobieranie danych:**
   - Warstwa serwisowa (np. w `src/lib/services`) wykonuje zapytanie do bazy danych tabeli `generations`, filtrując rekordy po `user_id` oraz stosując paginację.
4. **Odpowiedź:**
   - Wynik zapytania jest opakowywany w struktury `PaginatedResponse<GenerationDTO>` i zwracany do klienta.

## 6. Względy bezpieczeństwa
- **Uwierzytelnienie i autoryzacja:**
  - Wymagane jest dostarczenie poprawnego tokena JWT.
  - Dostęp do danych jest ograniczony tylko do rekordów należących do zalogowanego użytkownika.
- **Walidacja danych:**
  - Wszystkie inputy, w tym query parameters, są dokładnie walidowane.
  - Używanie parametrów zapytań zamiast budowania zapytań SQL w locie, aby zapobiec atakom typu injection.
- **Obsługa uprawnień:**
  - Weryfikacja, czy użytkownik ma dostęp do żądanych danych przy użyciu Supabase Auth.

## 7. Obsługa błędów
- **400:** Nieprawidłowe dane wejściowe (np. błędny format paginacji).
- **401:** Brak tokena lub token nieważny, co uniemożliwia uwierzytelnienie.
- **500:** Błąd po stronie serwera, np. problem z połączeniem do bazy danych. Użycie try/catch oraz logowanie szczegółów błędu w logach serwera.

## 8. Rozważania dotyczące wydajności
- **Indeksacja:**
  - Wykorzystanie indeksu na kolumnie `user_id` w tabeli `generations` zapewnia szybką filtrację rekordów.
- **Paginacja:**
  - Implementacja paginacji zapobiega ładowaniu nadmiernej liczby rekordów jednocześnie.
- **Optymalizacja zapytań:**
  - Pobieranie tylko niezbędnych pól z bazy danych w celu zmniejszenia obciążenia.
- **Caching (opcjonalnie):**
  - Rozważenie cache'owania wyników, jeśli dane się nie zmieniają często.

## 9. Etapy wdrożenia
1. Utworzenie endpointu w pliku `/src/pages/api/generations/index.ts`.
2. Implementacja mechanizmu uwierzytelnienia poprzez middleware i weryfikację tokena JWT.
3. Walidacja query parameters (`page`, `limit`) przy użyciu Zod.
4. Wyodrębnienie logiki pobierania danych do warstwy serwisowej (np. `getGenerationsForUser(userId, page, limit)`).
5. Wykonanie zapytania do bazy danych za pomocą Supabase client, filtrowanie po `user_id` oraz implementacja paginacji.
6. Formowanie odpowiedzi w formacie `PaginatedResponse<GenerationDTO>` i zwrócenie jej z kodem 200.
7. Dodanie obsługi błędów – zwracanie odpowiednich statusów (400, 401, 500) oraz logowanie błędów.
