/*
API Endpoint Implementation Plan: DELETE /api/flashcards/{flashcard_id}

## 1. Przegląd punktu końcowego
Ten endpoint umożliwia usunięcie fiszki na podstawie przekazanego identyfikatora (flashcard_id). Endpoint zwraca komunikat potwierdzający pomyślne usunięcie fiszki. Endpoint jest zabezpieczony mechanizmem uwierzytelniania JWT i sprawdza, czy usuwana fiszka należy do zalogowanego użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP:** DELETE
- **Struktura URL:** /api/flashcards/{flashcard_id}
- **Parametry:**
  - **flashcard_id** (wymagany): identyfikator fiszki, oczekiwany jako liczba (BIGINT) w ścieżce URL.
- **Ciało żądania:** Brak

## 3. Wykorzystywane typy
- Nie jest wymagany dedykowany DTO dla żądania usunięcia, ale operacja opiera się na identyfikatorze fiszki.
- W odpowiedzi można zwrócić strukturę potwierdzającą, np.:
  ```json
  { "message": "Flashcard deleted successfully" }
  ```
- Modele i typy wykorzystywane w projekcie (takie jak `FlashcardDTO`) mogą być użyte przy weryfikacji własności fiszki.

## 4. Szczegóły odpowiedzi
- **Status 200:** Fiszka została pomyślnie usunięta. Odpowiedź zawiera komunikat potwierdzający, np.
  ```json
  { "message": "Flashcard deleted successfully" }
  ```
- **Status 404:** Fiszka o podanym identyfikatorze nie została znaleziona lub nie należy do użytkownika.
- **Status 401:** Nieautoryzowany dostęp – token JWT jest nieprawidłowy lub nie został dostarczony.
- **Status 500:** Błąd po stronie serwera w trakcie operacji usunięcia.

## 5. Przepływ danych
1. Żądanie przychodzi z tokenem JWT w nagłówku `Authorization: Bearer <token>`.
2. Middleware uwierzytelniające weryfikuje token i wyodrębnia `user_id`.
3. Endpoint pobiera `flashcard_id` z parametrów ścieżki.
4. Wykonywana jest weryfikacja, czy fiszka o podanym `flashcard_id` istnieje i należy do zalogowanego użytkownika.
5. Jeśli walidacja przejdzie pomyślnie, wykonywane jest zapytanie DELETE do bazy danych.
6. Po pomyślnym usunięciu zwracany jest status 200 z komunikatem potwierdzającym.

## 6. Względy bezpieczeństwa
- Endpoint jest chroniony przez middleware weryfikujące token JWT.
- Sprawdzanie własności fiszki: usuwana fiszka musi należeć do użytkownika wyznaczonego przez token.
- Walidacja danych wejściowych, aby uniknąć SQL Injection (użycie zapytań parametryzowanych lub ORM).
- Ograniczenie dostępu do endpointu poprzez odpowiednią konfigurację uprawnień w Supabase oraz implemetację mechanizmów rate limiting.

## 7. Obsługa błędów
- **400 Bad Request:** Nieprawidłowy format `flashcard_id` (np. nie liczba).
- **401 Unauthorized:** Brak lub nieprawidłowy token JWT.
- **404 Not Found:** Fiszka o podanym `flashcard_id` nie istnieje lub nie jest własnością użytkownika.
- **500 Internal Server Error:** Błąd podczas operacji usunięcia, niespodziewany wyjątek.

Każdy błąd powinien być logowany, a komunikat błędu zwracany użytkownikowi powinien być przyjazny i nie ujawniać szczegółów implementacyjnych.

## 8. Rozważania dotyczące wydajności
- Operacja usunięcia pojedynczej fiszki jest operacją lekką, jednak należy upewnić się, że zapytanie do bazy danych wykorzystuje indeks na polu `flashcard_id` oraz `user_id` dla szybkiej weryfikacji własności.
- Monitorowanie czasu odpowiedzi i obciążenia bazy danych, aby szybko wykryć potencjalne problemy.

## 9. Kroki implementacji
1. **Uwierzytelnienie:** Upewnić się, że middleware poprawnie weryfikuje token JWT i ustawia `user_id` w kontekście żądania.
2. **Walidacja parametru:** Sprawdzić, czy `flashcard_id` jest obecny w ścieżce i jest liczbą.
3. **Weryfikacja własności:** Pobierać fiszkę z bazy danych, sprawdzając, czy `user_id` z tokena zgadza się z właścicielem fiszki.
4. **Operacja usunięcia:** Wykonać zapytanie DELETE w bazie danych dla danego `flashcard_id`.
5. **Odpowiedź:** Zwrocić status 200 wraz z komunikatem potwierdzającym pomyślne usunięcie.
6. **Obsługa błędów:** Zaimplementować odpowiednie bloki try/catch, aby obsłużyć przypadki 400, 401, 404 oraz 500.
7. **Dokumentacja:** Zaktualizować dokumentację API, opisując nowy endpoint i przykładowe przypadki użycia.
*/ 