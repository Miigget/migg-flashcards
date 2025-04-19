# API Endpoint Implementation Plan: GET /api/collections

## 1. Przegląd punktu końcowego
Celem tego endpointu jest zwrócenie unikalnych nazw kolekcji, które powstały w wyniku tworzenia fiszek przypisanych do danego użytkownika. Kolekcje są automatycznie tworzone przy wstawianiu fiszek (na podstawie pola `collection` w tabeli `flashcards`) oraz usuwane, gdy ostatnia fiszka zostanie usunięta. Endpoint umożliwia użytkownikowi filtrowanie i sortowanie swoich fiszek według kolekcji.

## 2. Szczegóły żądania
- **Metoda HTTP:** GET
- **Struktura URL:** /api/collections
- **Parametry:**
  - Wymagane: Brak (jedynym wymogiem jest obecność poprawnego tokenu autoryzacyjnego w nagłówku `Authorization`)
  - Opcjonalne: Brak
- **Request Body:** Brak

## 3. Wykorzystywane typy
- **FlashcardDTO:** Reprezentuje rekord w tabeli `flashcards` (używany do odczytu pola `collection`).
- **Response DTO:** Tablica unikalnych ciągów znaków (Array<string>) reprezentujących nazwy kolekcji.
- Nie ma dedykowanego Command Model, ponieważ operacja jest tylko odczytowa.

## 4. Szczegóły odpowiedzi
- **Kod 200:** Zwrot poprawnej listy unikalnych nazw kolekcji jako JSON Array, np. ["Kolekcja A", "Kolekcja B", ...].
- **Kod 401:** Błąd uwierzytelnienia, jeśli token nie jest dostarczony lub jest niepoprawny.
- **Kod 500:** Błąd po stronie serwera lub podczas wykonywania zapytania do bazy danych.

## 5. Przepływ danych
1. Klient wysyła żądanie GET /api/collections z nagłówkiem `Authorization: Bearer <token>`.
2. Middleware autoryzacyjne weryfikuje token i wyciąga `user_id` z kontekstu (np. z `context.locals` przy użyciu Supabase).
3. Endpoint wywołuje funkcję serwisową (np. `getUniqueCollections(userId)`) zlokalizowaną w katalogu `src/lib/services`.
4. Funkcja serwisowa wykonuje zapytanie do bazy danych: wyszukuje w tabeli `flashcards` wszystkie rekordy należące do danego `user_id`, a następnie dokonuje operacji DISTINCT na polu `collection`.
5. Wynik (tablica unikalnych nazw) zostaje zwrócony jako odpowiedź JSON z kodem 200.

## 6. Względy bezpieczeństwa
- Weryfikacja autoryzacji: Endpoint musi sprawdzić obecność i ważność tokenu JWT, aby uzyskać `user_id`.
- Ograniczenie dostępu: Zapytanie do bazy danych powinno dotyczyć tylko fiszek przypisanych do autoryzowanego użytkownika.
- Sanitacja danych: Choć w tym przypadku nie ma danych wejściowych od użytkownika poza tokenem, należy zachować standardowe procedury walidacji.

## 7. Obsługa błędów
- **401 Unauthorized:** Jeśli token nie zostanie dostarczony lub jest nieważny.
- **500 Internal Server Error:** W przypadku problemów z bazą danych lub niespodziewanych błędów w logice serwisu. Wszystkie błędy powinny być logowane z odpowiednimi informacjami pomocniczymi.

## 8. Rozważania dotyczące wydajności
- Zapytanie korzysta z indeksu na kolumnie `collection` (zgodnie z definicjami w bazie danych), co zapewnia szybkie wykonanie operacji DISTINCT.
- Zapytanie zwraca tylko pojedynczą kolumnę, co minimalizuje obciążenie sieci.

## 9. Etapy wdrożenia
1. Utworzyć lub rozszerzyć serwis w katalogu `src/lib/services` (np. plik `collections.ts`) z funkcją `getUniqueCollections(userId: string)`.
   - Funkcja powinna wykonywać zapytanie do bazy danych (używając Supabase) z filtrowaniem po `user_id` oraz operacją DISTINCT na polu `collection`.
2. Dodać nowy endpoint w katalogu `src/pages/api` (np. plik `collections.ts` lub inny dedykowany dla endpointu kolekcji), implementując metodę GET.
   - Upewnić się, że middleware autoryzacyjne poprawnie weryfikuje token i przekazuje `user_id` do endpointu.
3. W endpointcie wywołać funkcję serwisową, a następnie zwrócić wynik w formacie JSON.
4. Zaimplementować odpowiednie bloki try/catch w celu obsługi błędów i zwracania kodu 500 w przypadku awarii.
5. Zaktualizować dokumentację API, aby zawierała szczegóły nowego endpointu. 