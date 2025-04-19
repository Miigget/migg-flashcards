# API Endpoint Implementation Plan: GET /api/flashcards/{flashcard_id}

## 1. Przegląd punktu końcowego
Cel: Pobranie pojedynczej fiszki na podstawie unikalnego identyfikatora `flashcard_id`. Endpoint umożliwia autoryzowanym użytkownikom dostęp do szczegółów ich własnych fiszek, zapewniając jednocześnie bezpieczeństwo poprzez weryfikację, że użytkownik ma prawo dostępu do danej fiszki.

## 2. Szczegóły żądania
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards/{flashcard_id}`
- **Parametry**:
  - **Wymagane**:
    - `flashcard_id` (część ścieżki, typ liczbowy – odpowiada kolumnie `flashcard_id` w bazie danych)
  - **Opcjonalne**: brak
- **Request Body**: Brak (żądanie opiera się wyłącznie na parametrach ścieżki i nagłówkach autoryzacyjnych)

## 3. Wykorzystywane typy
- **FlashcardDTO**: Definiowany w `src/types.ts`, reprezentuje pełną strukturę fiszki.

## 4. Szczegóły odpowiedzi
- **200 OK**: Pomyślne pobranie fiszki. Odpowiedź zawiera obiekt typu `FlashcardDTO`.
- **400 Bad Request**: Niepoprawny format lub brak wymaganego parametru (np. `flashcard_id` nie jest liczbą).
- **401 Unauthorized**: Użytkownik nie przesłał poprawnego tokena autoryzacyjnego lub nie jest zalogowany.
- **404 Not Found**: Fiszka o podanym `flashcard_id` nie istnieje lub nie należy do zalogowanego użytkownika.
- **500 Internal Server Error**: Błąd serwera, np. problem z zapytaniem do bazy danych lub inny nieoczekiwany problem.

_Przykładowa struktura odpowiedzi (200 OK):_
```json
{
  "flashcard_id": 123,
  "user_id": "user-uuid",
  "front": "Przykładowy front",
  "back": "Przykładowy back",
  "collection": "Default",
  "source": "manual",
  "created_at": "2023-10-01T12:00:00Z",
  "updated_at": "2023-10-01T12:00:00Z"
}
```

## 5. Przepływ danych
1. Żądanie trafia do endpointa `/api/flashcards/{flashcard_id}` i przechodzi przez middleware autoryzacyjne, które weryfikuje token JWT i ustala `user_id` z kontekstu.
2. Parametr `flashcard_id` jest odczytywany z URL i walidowany (musi być liczbą całkowitą).
3. Logika endpointu wykonuje zapytanie do bazy danych (tabela `flashcards`), filtrując wyniki według:
   - `flashcard_id` – pobranie konkretnej fiszki
   - `user_id` – zapewnienie, że użytkownik ma dostęp tylko do swoich fiszek
4. Jeśli fiszka zostanie znaleziona, dane są zwracane w odpowiedzi z kodem 200.
5. Jeśli nie zostanie znaleziona, zwracany jest błąd 404.
6. W przypadku wystąpienia błędów (np. błąd zapytania), błąd jest logowany, a użytkownik otrzymuje odpowiedź 500.

## 6. Względy bezpieczeństwa
- **Autoryzacja**: Middleware powinno weryfikować token JWT, aby upewnić się, że żądanie pochodzi od autoryzowanego użytkownika.
- **Walidacja danych**: Parametr `flashcard_id` musi być sprawdzony pod kątem poprawności (musi być liczbą całkowitą), aby uniknąć SQL Injection oraz innych błędów.
- **Dostęp do zasobów**: Upewnić się, że zapytanie filtruje dane po `user_id`, dzięki czemu użytkownik widzi tylko swoje fiszki.

## 7. Obsługa błędów
- **400 Bad Request**: Zwracany, gdy parametr `flashcard_id` jest niepoprawny lub brakuje go.
- **401 Unauthorized**: Zwracany, gdy brak jest prawidłowego tokena autoryzacyjnego.
- **404 Not Found**: Zwracany, gdy fiszka o podanym `flashcard_id` nie zostanie znaleziona lub nie należy do użytkownika.
- **500 Internal Server Error**: Zwracany w przypadku nieoczekiwanych błędów. Należy logować szczegóły błędów dla dalszej diagnostyki.

## 8. Rozważania dotyczące wydajności
- **Indeksacja bazy danych**: Tabela `flashcards` powinna posiadać indeksy na kolumnach `flashcard_id` i `user_id`, aby przyspieszyć wyszukiwanie.
- **Optymalizacja zapytań**: Użycie klienta Supabase z parametryzowanymi zapytaniami zabezpiecza przed SQL Injection i poprawia wydajność.
- **Monitorowanie zapytań**: Wdrożyć logowanie długotrwałych zapytań, aby móc optymalizować wydajność w przyszłości.

## 9. Etapy wdrożenia
1. **Stworzenie szkieletu endpointa**: Utworzyć plik w katalogu `/src/pages/api/flashcards/[flashcard_id].ts`.
2. **Implementacja middleware**: Zapewnić, że middleware autoryzacyjne prawidłowo weryfikuje token JWT i ustala `user_id` w kontekście żądania.
3. **Walidacja wejścia**: Implementacja walidacji dla parametru `flashcard_id` (muszą być przekazywane jako liczba całkowita).
4. **Implementacja logiki zapytania**: Użyć klienta Supabase do wykonania zapytania do tabeli `flashcards`, filtrując po `flashcard_id` oraz `user_id`.
5. **Implementacja logiki odpowiedzi**: Zwrócić odpowiedź 200 z obiektem `FlashcardDTO` jeżeli fiszka zostanie znaleziona, lub odpowiednio obsłużyć kody błędów 400, 401, 404, 500.
6. **Obsługa błędów i logowanie**: Implementacja mechanizmu logowania błędów wewnętrznych, w tym rejestrowanie nieoczekiwanych błędów.