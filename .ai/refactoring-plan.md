# Plan Refaktoryzacji i Restrukturyzacji Projektu

Data analizy: 12.05.2025

## Wstęp

Niniejszy dokument przedstawia plan refaktoryzacji i restrukturyzacji projektu, oparty na analizie bazy kodu, ze szczególnym uwzględnieniem plików o największej liczbie linii kodu (LOC) oraz ogólnej struktury projektu. Celem jest poprawa czytelności, utrzymywalności i potencjalnej wydajności kodu, zgodnie z dobrymi praktykami i wytycznymi technologicznymi projektu (Astro, React, TypeScript, Supabase).

## Analiza Plików o Najwyższej Złożoności (LOC)

Zidentyfikowano następujące pliki (top 9) z największą liczbą linii kodu w katalogu `src`:

1.  `src/lib/services/flashcard.service.test.ts` (788 linii)
2.  `src/lib/services/flashcard-generation.service.test.ts` (492 linie)
3.  `src/lib/services/collections.test.ts` (488 linii)
4.  `src/lib/services/openrouter.service.test.ts` (447 linii)
5.  `src/hooks/useGenerateFlashcards.ts` (437 linii)
6.  `src/lib/services/flashcard-generation.service.ts` (423 linie)
7.  `src/lib/services/flashcard.service.ts` (403 linie)
8.  `src/lib/services/openrouter.service.ts` (402 linie)
9.  `src/pages/api/flashcards/[flashcard_id].ts` (395 linii)

**Uwaga:** Znaczna część najdłuższych plików to pliki testowe. Wysoka liczba LOC w testach niekoniecznie jest problemem, ale może wskazywać na potrzebę ich refaktoryzacji w celu poprawy czytelności i utrzymania.

## Sugestie Refaktoryzacji dla Wybranych Plików

Poniżej przedstawiono sugestie refaktoryzacji dla kluczowych plików produkcyjnych z listy:

### 1. `src/hooks/useGenerateFlashcards.ts` (437 linii)

*   **Problem:** Duża złożoność stanu (`viewModel`), wiele odpowiedzialności (zarządzanie UI, logika biznesowa, komunikacja API), długie funkcje `useCallback`.
*   **Sugestie:**
    *   **Zarządzanie stanem:** Rozważyć użycie `useReducer` zamiast `useState` dla `viewModel` lub podzielić stan na mniejsze, zarządzane przez dedykowane `useState` / mniejsze hooki.
    *   **Podział odpowiedzialności:** Wydzielić logikę do mniejszych, wyspecjalizowanych hooków (np. `useFlashcardCandidates`, `useCollectionManagement`, `useFlashcardGenerationAPI`, `useFlashcardSaveAPI`). Główny hook komponowałby te mniejsze.
    *   **Serwisy:** Przenieść całą logikę komunikacji z API (fetch) do dedykowanych funkcji w odpowiednich serwisach (`src/lib/services`). Hook powinien jedynie wywoływać te serwisy i zarządzać stanem UI.
    *   **Walidacja:** Wydzielić logikę walidacji do osobnych funkcji pomocniczych lub modułu walidacyjnego.
    *   **Typy:** Przenieść definicje typów specyficznych dla tego hooka/modułu (ViewModel, CandidateViewModel itp.) do dedykowanego pliku typów lub do `src/types.ts`, jeśli są reużywalne.

### 2. `src/lib/services/flashcard-generation.service.ts` (423 linie)

*   **Problem:** Długa metoda `generateFlashcards`, potencjalnie krucha obsługa błędów AI, zahardkodowana konfiguracja AI, osadzony długi prompt systemowy.
*   **Sugestie:**
    *   **Metoda `generateFlashcards`:** Choć obecna struktura jest w miarę czytelna, monitorować jej rozrost. Upewnić się, że metody prywatne pozostają spójne.
    *   **Obsługa błędów:** Rozważyć dedykowany `LoggingService`. Uprościć/ujednolicić logikę parsowania błędów AI. Zastanowić się nad strategią fallbacku (zamiast zwracać dane przykładowe, może lepiej propagować błąd).
    *   **Konfiguracja AI:** Przenieść konfigurację (model, parametry, klucz API) do zmiennych środowiskowych/pliku konfiguracyjnego. Długi system prompt przenieść do osobnego pliku. Rozważyć stworzenie bardziej abstrakcyjnego interfejsu dla klienta AI.
    *   **`getCurrentUserId`:** Preferować jawne przekazywanie `userId` do serwisu zamiast polegania na `supabase.auth.getUser()` wewnątrz.
    *   **Naprawić `@ts-expect-error`:** Rozwiązać problem z rozpoznawaniem ścieżek w `tsconfig.json`.

### 3. `src/lib/services/flashcard.service.ts` (403 linie)

*   **Problem:** Powtarzalność w mapowaniu błędów Supabase, potencjalna optymalizacja zapytań w `update`/`delete`.
*   **Sugestie:**
    *   **Obsługa Błędów:** Stworzyć centralny mechanizm/helper do mapowania błędów Supabase na `FlashcardServiceError`, aby uniknąć powtórzeń w każdej metodzie CRUD.
    *   **Walidacja:** Rozważyć użycie Zod (lub innej biblioteki) do walidacji obiektów `command` w `createFlashcard` i `updateFlashcard` dla większej spójności i czytelności.

### 4. `src/lib/services/openrouter.service.ts` (402 linie)

*   **Problem:** Zahardkodowane wartości konfiguracyjne (API Key, URL, nagłówki).
*   **Sugestie:**
    *   **Konfiguracja:** Ładować klucz API, URL bazowy API, domyślny model, `X-Title`, `HTTP-Referer` ze zmiennych środowiskowych lub pliku konfiguracyjnego.
    *   **`JsonSchemaBuilder`:** Rozważyć wydzielenie do osobnego modułu, jeśli będzie potrzebny gdzie indziej.
    *   **`trackUsage`:** Rozbudować implementację, jeśli śledzenie zużycia tokenów jest wymagane.

### 5. `src/pages/api/flashcards/[flashcard_id].ts` (395 linii)

*   **Problem:** Powtarzalny kod inicjalizacyjny (walidacja ID, autentykacja, pobieranie `locals`), logika biznesowa (zmiana `source`) w handlerze PUT.
*   **Sugestie:**
    *   **Redukcja Powtórzeń:** Stworzyć funkcję pomocniczą wyższego rzędu lub middleware (jeśli możliwe w Astro) do obsługi powtarzalnej logiki walidacji ID, autentykacji i pobierania `locals`.
    *   **Centralizacja Odpowiedzi Błędów:** Stworzyć helper do generowania standardowych odpowiedzi błędów JSON.
    *   **Przeniesienie Logiki Biznesowej:** Przenieść logikę aktualizacji pola `source` z handlera PUT do `FlashcardService`. Handler API powinien być jak najcieńszy. Przemyśleć obsługę błędów podczas pobierania fiszki przed aktualizacją `source`.

### 6. Pliki Testowe (`*.test.ts`)

*   **Problem:** Wysoka liczba LOC w niektórych plikach testowych.
*   **Sugestie:**
    *   **Przegląd Struktury:** Przeanalizować najdłuższe pliki testowe (`flashcard.service.test.ts`, `flashcard-generation.service.test.ts`, `collections.test.ts`, `openrouter.service.test.ts`).
    *   **Refaktoryzacja Testów:**
        *   Grupować testy logicznie (np. używając `describe`).
        *   Wydzielić wspólne dane testowe (mocki, stałe) do osobnych plików lub fabryk.
        *   Wydzielić powtarzalne kroki setupu/teardownu do funkcji `beforeEach`/`afterEach` lub dedykowanych funkcji pomocniczych.
        *   Stworzyć reużywalne funkcje asercji dla złożonych sprawdzeń.
        *   Rozbić bardzo długie bloki `it`/`test` na mniejsze, bardziej skoncentrowane testy.

## Analiza Struktury Projektu i Sugestie Restrukturyzacji

Aktualna struktura projektu jest **dobrze zorganizowana i zgodna z wytycznymi**. Główne katalogi (`components`, `layouts`, `pages`, `middleware`, `db`, `types.ts`, `lib`, `hooks`) są logicznie rozdzielone.

*   **`src/lib`:** W miarę rozwoju, rozważyć dalszy podział na podkatalogi wg funkcjonalności (`utils`, `validators`, `config`).
*   **Testy:** Obecna kolokacja testów jest akceptowalna. Alternatywnie można rozważyć dedykowany katalog `tests`. Niezależnie od lokalizacji, skupić się na refaktoryzacji samych testów (jak opisano powyżej).

**Wnioski:** Nie ma potrzeby gruntownej restrukturyzacji katalogów. Główne działania powinny skupić się na refaktoryzacji zidentyfikowanych plików w celu poprawy ich wewnętrznej struktury, czytelności i utrzymywalności, zgodnie z podanymi sugestiami. 