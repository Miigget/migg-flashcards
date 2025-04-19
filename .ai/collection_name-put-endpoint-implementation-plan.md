# API Endpoint Implementation Plan: PUT /api/collections/{collection_name}

## 1. Przegląd punktu końcowego
Endpoint służy do zmiany nazwy istniejącej kolekcji. Aktualizujemy wszystkie fiszki użytkownika, których pole `collection` odpowiada starej nazwie, zmieniając je na nową podaną w żądaniu. Celem jest umożliwienie użytkownikowi reorganizacji i uporządkowania fiszek bez konieczności ręcznego modyfikowania każdej fiszki.

## 2. Szczegóły żądania
- **Metoda HTTP:** PUT
- **Struktura URL:** /api/collections/{collection_name}
- **Parametry ścieżki:**
  - `collection_name` (string) – obecna nazwa kolekcji, której nazwa ma być zmieniona
- **Request Body:**
  - Wymagane: JSON zawierający:
    - `new_name` (string) – nowa nazwa kolekcji, musi być niepusta (dodatkowo można walidować długość, np. max 30 znaków zgodnie z ograniczeniem bazy danych)

## 3. Wykorzystywane typy
- **UpdateCollectionCommand:**
  - Zdefiniowany w `src/types.ts` jako interfejs zawierający pole `new_name`.
- **FlashcardDTO:**
  - Typ reprezentujący fiszkę pobrany z bazy danych, używany przy wykonywaniu aktualizacji.

## 4. Szczegóły odpowiedzi
- **Sukces:**
  - HTTP 200
  - Treść: JSON zawierający potwierdzenie operacji, przykładowo:
    ```json
    {
      "message": "Collection renamed successfully.",
      "updated_count": <number_of_updated_flashcards>
    }
    ```
- **Błędy:**
  - 400 – nieprawidłowe dane wejściowe (np. `new_name` jest puste lub nie spełnia kryteriów walidacji)
  - 401 – brak autoryzacji (użytkownik nie jest uwierzytelniony)
  - 404 – kolekcja o podanej nazwie nie istnieje dla danego użytkownika
  - 500 – błąd serwera

## 5. Przepływ danych
1. Użytkownik wysyła żądanie PUT do `/api/collections/{collection_name}` z aktualną nazwą kolekcji w URL i nową nazwą w ciele żądania.
2. Middleware uwierzytelniający sprawdza token JWT i wyodrębnia `user_id`.
3. Na podstawie `user_id` oraz `collection_name` wykonujemy zapytanie do bazy danych (poprzez klienta Supabase), aktualizując wszystkie rekordy w tabeli `flashcards`:
   - Warunek: `user_id` równe aktualnemu użytkownikowi oraz `collection` równe starej nazwie kolekcji
   - Aktualizacja: ustawienie pola `collection` na wartość `new_name`
4. Zwracamy odpowiedź zawierającą liczbę zaktualizowanych rekordów.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie i autoryzacja:**
  - Endpoint zabezpieczony middlewarem weryfikującym token JWT (Bearer) i wyciągającym `user_id`.
  - Zapytanie aktualizujące musi filtrować dane na podstawie `user_id` aby zapobiec aktualizacji fiszek należących do innych użytkowników.
- **Walidacja danych:**
  - Sprawdzenie, że `new_name` nie jest pustym ciągiem oraz spełnia ewentualne ograniczenia długości (np. max 30 znaków).
- **Bezpieczne zapytania:**
  - Użycie zapytań parametryzowanych lub ORM, aby zapobiec atakom SQL Injection.

## 7. Obsługa błędów
- **Błąd walidacji (400):**
  - Jeśli `new_name` jest pusty lub nie spełnia kryteriów walidacji, natychmiast zwracamy błąd 400.
- **Brak kolekcji (404):**
  - Jeśli zapytanie aktualizujące nic nie zmienia (żaden rekord nie został znaleziony dla podanej `collection_name`), zwracamy 404.
- **Błąd autoryzacji (401):**
  - Jeśli użytkownik nie jest uwierzytelniony lub token jest nieważny.
- **Błąd serwera (500):**
  - W przypadku nieprzewidzianych błędów logujemy błąd i zwracamy status 500.

## 8. Rozważania dotyczące wydajności
- **Indeks na kolumnę `collection`:**
  - Wykorzystanie indeksu na kolumnie `collection` w tabeli `flashcards` (zgodnie z dokumentacją bazy danych) przyspiesza wyszukiwanie rekordów.
- **Operacja masowa:**
  - Aktualizacja wszystkich rekordów w jednym zapytaniu SQL zapewnia efektywność operacji, nawet przy dużej liczbie fiszek.
- **Transakcja (opcjonalnie):**
  - Możemy rozważyć użycie transakcji, jeżeli operacja aktualizacji powinna być atomowa, chociaż pojedyncze zapytanie update powinno to gwarantować.

## 9. Kroki implementacji
1. **Tworzenie endpointu:**
   - Utworzyć plik endpointu w katalogu `src/pages/api/collections/[collection_name].ts` (lub zgodnie z wybranym routingiem w Astro).
2. **Walidacja metody:**
   - Sprawdzić, czy żądanie używa metody PUT; w razie niezgodności zwrócić błąd 405 (method not allowed) lub 400.
3. **Uwierzytelnienie:**
   - Używać middleware do weryfikacji tokena JWT i wyciągania `user_id` z kontekstu (np. `context.locals`).
4. **Walidacja danych wejściowych:**
   - Walidować ciało żądania przy użyciu Zod lub innej biblioteki, upewniając się, że `new_name` jest niepusty i spełnia wymagania.
5. **Aktualizacja bazy danych:**
   - Za pomocą klienta Supabase wykonać zapytanie aktualizujące rekordy w tabeli `flashcards`
     z warunkiem `user_id` równe aktualnemu użytkownikowi oraz `collection` równe starej nazwie
   - Ustawić pole `collection` na `new_name`.
6. **Sprawdzanie wyniku:**
   - Jeśli żaden rekord nie został zaktualizowany, zwrócić odpowiedź 404.
   - W przeciwnym razie, zwrócić odpowiedź 200 z potwierdzeniem operacji i liczbą zaktualizowanych fiszek.
7. **Obsługa wyjątków:**
   - Obejmować operację blokiem try-catch, aby w razie wystąpienia błędu zwrócić 500 oraz zalogować szczegóły błędu.
