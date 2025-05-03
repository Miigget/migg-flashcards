# Plan Implementacji Testów Jednostkowych - MiggFlashcards

## 1. Wprowadzenie

Niniejszy dokument przedstawia plan implementacji testów jednostkowych dla kluczowych komponentów aplikacji MiggFlashcards. Celem jest zapewnienie jakości i poprawności działania poszczególnych modułów w izolacji. Plan jest przeznaczony dla deweloperów, w tym juniorów, i zawiera szczegółowe instrukcje dotyczące pisania testów przy użyciu Vitest i React Testing Library, zgodnie z wytycznymi projektu.

Testy jednostkowe skupiają się na weryfikacji logiki biznesowej, funkcji pomocniczych, hooków oraz komponentów React. Zależności zewnętrzne (jak Supabase, OpenRouter API) oraz inne moduły aplikacji będą mockowane.

## 2. Struktura Zależności i Granice Testów Jednostkowych (Uproszczona ASCII)

Poniższy diagram ASCII ilustruje główne warstwy aplikacji i ich zależności, ze szczególnym uwzględnieniem granic testów jednostkowych, gdzie zewnętrzne systemy i inne moduły są mockowane.

```ascii
./src
├── pages/**/*.astro                 (Używają Komponentów)
│   └── Components (React/Astro)
│
├── components/**/*.tsx              (Komponenty React, np. CreateFlashcardForm)
│   ├── Hooks                        (np. `useGenerateFlashcards`)
│   │   └── Services (Mocked)        (Serwisy używane przez hook, np. flashcard-generation.service)
│   └── Services (Mocked)            (Rzadsze, bezpośrednie użycie serwisów)
│
├── hooks/*.ts                       (Hooki React, np. `useGenerateFlashcards.ts`)
│   └── Services (Mocked)            (np. `flashcard-generation.service`)
│       ├── External API (Mocked)    (np. OpenRouter API)
│       └── DB Client (Mocked)       (np. Klient Supabase)
│
├── middleware/index.ts              (Logika Middleware)
│   └── Services/DB Client (Mocked)  (np. Weryfikacja sesji Supabase)
│
├── lib/
│   ├── services/**/*.ts             (Logika Biznesowa, np. `flashcard.service.ts`, `collections.ts`)
│   │   ├── External API (Mocked)    (np. OpenRouter API `fetch`)
│   │   └── DB Client (Mocked)       (np. Funkcje klienta Supabase: select, insert itp.)
│   └── utils.ts                     (Funkcje pomocnicze)
│
└── db/                              (Klient Supabase - Mockowany w testach)

(Mocked) - Wskazuje zależność, która będzie mockowana podczas testów jednostkowych danej warstwy.
```

## 3. Plan Implementacji Testów (Uporządkowany wg Priorytetu)

Poniżej znajduje się lista modułów do przetestowania, uporządkowana według priorytetu. Dla każdego modułu opisano kroki niezbędne do napisania testów jednostkowych.

---

### 1. Middleware (`src/middleware/index.ts`)

*   **Cel:** Weryfikacja logiki middleware, np. sprawdzanie sesji użytkownika, modyfikacja odpowiedzi, przekierowania, obsługa błędów.
*   **Interfejs:** Funkcja `onRequest` (lub inna eksportowana funkcja middleware) przyjmująca `context` (typu `APIContext`) i `next` (funkcja `MiddlewareNextResponse`).
*   **Zależności/Interakcje:**
    *   `context.locals`: Odczyt/zapis danych specyficznych dla żądania (np. sesja użytkownika).
    *   `context.cookies`: Odczyt/zapis ciasteczek.
    *   `context.redirect`: Wywołanie przekierowania.
    *   `next()`: Wywołanie kolejnego middleware lub handlera trasy.
    *   Serwisy/Funkcje pomocnicze z `src/lib` (np. do weryfikacji sesji z Supabase) - **do mockowania**.
*   **Instrukcje dla Juniora:**
    1.  **Setup:**
        *   Utwórz plik `src/middleware/index.test.ts`.
        *   Zaimportuj testowaną funkcję middleware.
        *   Użyj `vi.mock()` na początku pliku, aby zamockować wszystkie zależności zewnętrzne (np. `import { supabase } from '@/db/supabase'; vi.mock('@/db/supabase');`) oraz serwisy z `src/lib` używane przez middleware.
    2.  **Mockowanie:**
        *   Przed każdym testem (`beforeEach`), przygotuj mocki `context` i `next`.
        *   `vi.fn()` dla `next`.
        *   Stwórz obiekt `context` z wymaganymi polami (`locals`, `cookies`, `redirect`, `url`). Użyj `vi.fn()` dla metod jak `cookies.get`, `cookies.set`, `redirect`.
        *   Zamockuj implementacje dla funkcji z zamockowanych modułów (np. `mocked(supabase.auth.getSession).mockResolvedValue(...)`).
    3.  **Scenariusze Testowe (Arrange-Act-Assert):**
        *   **Przypadek 1: Użytkownik zalogowany, dostęp do chronionej trasy:**
            *   *Arrange:* Ustaw mock `context.locals.session` na poprawną sesję. Ustaw `context.url` na chroniony URL.
            *   *Act:* Wywołaj funkcję middleware z mockami `context` i `next`.
            *   *Assert:* Sprawdź, czy `next()` zostało wywołane (`expect(next).toHaveBeenCalled()`). Sprawdź, czy `context.redirect` *nie* zostało wywołane.
        *   **Przypadek 2: Użytkownik niezalogowany, próba dostępu do chronionej trasy:**
            *   *Arrange:* Ustaw mock `context.locals.session` na `null`. Ustaw `context.url` na chroniony URL.
            *   *Act:* Wywołaj funkcję middleware.
            *   *Assert:* Sprawdź, czy `context.redirect` zostało wywołane z odpowiednim URL logowania (`expect(context.redirect).toHaveBeenCalledWith('/login')`). Sprawdź, czy `next()` *nie* zostało wywołane.
        *   **Przypadek 3: Dostęp do publicznej trasy:**
            *   *Arrange:* Ustaw `context.url` na publiczny URL. Sesja może być dowolna.
            *   *Act:* Wywołaj funkcję middleware.
            *   *Assert:* Sprawdź, czy `next()` zostało wywołane.
        *   **Przypadek 4: Obsługa błędów (jeśli middleware łapie błędy):**
            *   *Arrange:* Skonfiguruj mocki tak, aby wywołanie `next()` lub innej operacji rzuciło błąd.
            *   *Act:* Wywołaj funkcję middleware.
            *   *Assert:* Sprawdź, czy błąd został obsłużony poprawnie (np. zwrócono odpowiednią odpowiedź błędu, zalogowano błąd).
    4.  **Narzędzia:** Użyj `describe` do grupowania testów, `it` lub `test` dla poszczególnych przypadków. Korzystaj z asercji Vitest (`expect`).

---

### 2. Serwisy (`src/lib/services/*.ts`, `src/lib/utils.ts`)

*   **Cel:** Weryfikacja logiki biznesowej, operacji na danych, komunikacji z zewnętrznymi API (mockowanymi) i funkcji pomocniczych.
*   **Interfejs:** Eksportowane funkcje (np. `createFlashcard`, `getCollectionById`, `generateFlashcardsFromText`, `cn` z `utils.ts`).
*   **Zależności/Interakcje:**
    *   Inne serwisy z `src/lib/services` - **do mockowania**.
    *   Klient Supabase (`src/db/supabase`) - **do mockowania**.
    *   Klient OpenRouter (`src/lib/services/openrouter.ts` lub bezpośrednie wywołania `fetch`) - **do mockowania**.
    *   Funkcje pomocnicze z `src/lib/utils.ts` (zazwyczaj nie mockuje się, chyba że są bardzo skomplikowane lub mają zewnętrzne zależności).
*   **Instrukcje dla Juniora:**
    1.  **Setup:**
        *   Dla każdego pliku `.ts` w `src/lib/services` i `src/lib/utils.ts`, utwórz odpowiadający plik `.test.ts` (np. `src/lib/services/flashcard.service.test.ts`).
        *   Zaimportuj testowane funkcje.
        *   Użyj `vi.mock()` na początku pliku, aby zamockować wszystkie zależności (Supabase, OpenRouter, inne serwisy).
    2.  **Mockowanie:**
        *   Przed każdym testem (`beforeEach`), zresetuj i skonfiguruj mocki.
        *   Dla Supabase: Mockuj metody klienta, których używa serwis (np. `from().select()...`, `from().insert()...`). Użyj `mockResolvedValueOnce` lub `mockRejectedValueOnce` do symulowania odpowiedzi lub błędów. Przykład: `mocked(supabase.from).mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [...], error: null }) })`.
        *   Dla OpenRouter/fetch: Mockuj globalne `fetch` lub specyficzne funkcje klienta OpenRouter, zwracając przykładowe odpowiedzi sukcesu lub błędu.
        *   Dla innych serwisów: Mockuj ich funkcje używając `vi.fn().mockResolvedValue(...)`.
    3.  **Scenariusze Testowe (Arrange-Act-Assert):**
        *   **Happy Path:**
            *   *Arrange:* Przygotuj dane wejściowe (argumenty funkcji). Skonfiguruj mocki zależności, aby zwracały poprawne dane (np. mock Supabase zwraca listę encji, mock OpenRouter zwraca poprawną odpowiedź).
            *   *Act:* Wywołaj testowaną funkcję serwisową.
            *   *Assert:* Sprawdź, czy funkcja zwróciła oczekiwane dane. Sprawdź, czy zależności zostały wywołane z poprawnymi argumentami (`expect(mockedDependency).toHaveBeenCalledWith(...)`).
        *   **Obsługa Błędów (np. błąd bazy danych):**
            *   *Arrange:* Przygotuj dane wejściowe. Skonfiguruj mock zależności (np. Supabase), aby rzucił błąd lub zwrócił obiekt `{ data: null, error: new Error(...) }`.
            *   *Act:* Wywołaj testowaną funkcję.
            *   *Assert:* Sprawdź, czy funkcja obsłużyła błąd poprawnie (np. rzuciła własny wyjątek, zwróciła `null` lub odpowiedni obiekt błędu). Użyj `expect(...).rejects.toThrow(...)` dla funkcji asynchronicznych rzucających błędy.
        *   **Przypadki Brzegowe:**
            *   *Arrange:* Przetestuj z pustymi danymi wejściowymi, niepoprawnymi ID, danymi niespełniającymi walidacji (jeśli walidacja jest w serwisie).
            *   *Act:* Wywołaj funkcję.
            *   *Assert:* Sprawdź oczekiwane zachowanie (np. zwrot pustej tablicy, rzucenie błędu walidacji).
        *   **Funkcje `utils.ts`:** Zazwyczaj proste testy wejście-wyjście. Mockowanie nie jest potrzebne, chyba że funkcja ma zewnętrzne zależności.
    4.  **Narzędzia:** Vitest (`describe`, `it`, `expect`, `vi.fn`, `vi.mock`, `beforeEach`).

---

### 3. Hooki (`src/hooks/*.ts`)

*   **Cel:** Weryfikacja logiki niestandardowych hooków React, zarządzania stanem, efektów ubocznych i interakcji z serwisami (mockowanymi).
*   **Interfejs:** Wartość zwracana przez hook (może to być obiekt, tablica lub wartość prymitywna). Funkcje zwracane przez hook, które modyfikują stan lub wykonują akcje.
*   **Zależności/Interakcje:**
    *   Serwisy z `src/lib/services` - **do mockowania**.
    *   Inne hooki React (np. `useState`, `useEffect`, `useCallback`) - testowane pośrednio przez zachowanie hooka.
    *   API przeglądarki (rzadziej w hookach logiki biznesowej) - **do mockowania** (np. `fetch`).
*   **Instrukcje dla Juniora:**
    1.  **Setup:**
        *   Utwórz plik `.test.ts` dla hooka (np. `src/hooks/useGenerateFlashcards.test.ts`).
        *   Zaimportuj testowany hook.
        *   Zaimportuj `renderHook, act` z `@testing-library/react`.
        *   Użyj `vi.mock()` na początku pliku, aby zamockować zależności (serwisy).
    2.  **Mockowanie:**
        *   Przed każdym testem (`beforeEach`), skonfiguruj mocki serwisów, które hook wywołuje.
    3.  **Scenariusze Testowe (Arrange-Act-Assert):**
        *   **Stan Początkowy:**
            *   *Arrange:* -
            *   *Act:* Wywołaj `renderHook(() => useGenerateFlashcards())`.
            *   *Assert:* Sprawdź `result.current`, aby zweryfikować początkowe wartości stanu zwracane przez hook (np. `expect(result.current.isLoading).toBe(false)`).
        *   **Aktualizacja Stanu po Akcji:**
            *   *Arrange:* Skonfiguruj mocki serwisów, które zostaną wywołane przez funkcję akcji hooka.
            *   *Act:* Użyj `act(() => { result.current.generate(/* argumenty */); })` do wywołania funkcji zwracanej przez hook. Jeśli funkcja jest asynchroniczna, użyj `await act(async () => { ... });`.
            *   *Assert:* Sprawdź, czy stan w `result.current` został poprawnie zaktualizowany (np. `isLoading` na `true`, potem na `false`, `data` wypełnione, `error` jest `null`). Sprawdź, czy zamockowane serwisy zostały wywołane.
        *   **Obsługa Błędów:**
            *   *Arrange:* Skonfiguruj mock serwisu, aby rzucił błąd lub zwrócił błąd.
            *   *Act:* Wywołaj funkcję akcji hooka wewnątrz `act`.
            *   *Assert:* Sprawdź, czy stan błędu w `result.current` został ustawiony (`expect(result.current.error).toBeDefined()`).
        *   **Efekty Uboczne (`useEffect`):**
            *   *Arrange:* Jeśli hook ma `useEffect`, który wywołuje serwis przy montowaniu lub zmianie zależności, skonfiguruj odpowiednie mocki.
            *   *Act:* Wywołaj `renderHook`. Możesz użyć `rerender` z `renderHook`, aby zasymulować zmianę propsów/zależności.
            *   *Assert:* Sprawdź, czy mock serwisu został wywołany i czy stan został zaktualizowany zgodnie z logiką efektu.
    4.  **Narzędzia:** Vitest, `@testing-library/react` (`renderHook`, `act`).

---

### 4. Komponenty React (`src/components/*.tsx`)

*   **Cel:** Weryfikacja renderowania UI na podstawie propsów i stanu, obsługi zdarzeń użytkownika (kliknięcia, wpisywanie tekstu), wywoływania funkcji (np. przekazanych przez props, z hooków) i warunkowego renderowania.
*   **Interfejs:** Props komponentu. Elementy DOM renderowane przez komponent.
*   **Zależności/Interakcje:**
    *   Hooki (niestandardowe i wbudowane) - testowane pośrednio lub mockowane, jeśli są bardzo skomplikowane i testowane osobno.
    *   Serwisy/API - wywołania powinny być mockowane (zazwyczaj przez mockowanie hooków lub funkcji przekazywanych w props).
    *   Komponenty podrzędne - zazwyczaj nie są mockowane, chyba że są bardzo złożone lub pochodzą z zewnętrznych bibliotek i utrudniają testowanie (np. ciężkie komponenty UI). Komponenty z `ui` (Shadcn) zazwyczaj *nie* są mockowane.
*   **Instrukcje dla Juniora:**
    1.  **Setup:**
        *   Utwórz plik `.test.tsx` dla komponentu (np. `src/components/CreateFlashcardForm.test.tsx`).
        *   Zaimportuj testowany komponent.
        *   Zaimportuj potrzebne funkcje z `@testing-library/react` (`render`, `screen`, `fireEvent`, `within`) i `@testing-library/user-event` (`userEvent`).
        *   Zamockuj hooki lub serwisy, jeśli komponent bezpośrednio ich używa (chociaż często interakcje przechodzą przez props). Użyj `vi.mock()`.
    2.  **Mockowanie:**
        *   Mockuj funkcje przekazywane jako props (`onSubmit = vi.fn()`).
        *   Jeśli komponent używa niestandardowego hooka (np. `useGenerateFlashcards`), zamockuj ten hook, aby kontrolować jego stan i zwracane funkcje (`vi.mock('@/hooks/useGenerateFlashcards', () => ({ useGenerateFlashcards: () => ({ /* mock state and functions */ }) }))`).
    3.  **Scenariusze Testowe (Arrange-Act-Assert):**
        *   **Renderowanie Początkowe:**
            *   *Arrange:* Przygotuj potrzebne propsy (w tym mocki funkcji).
            *   *Act:* Wyrenderuj komponent używając `render(<MyComponent {...props} />)`.
            *   *Assert:* Sprawdź, czy kluczowe elementy są widoczne na ekranie używając `screen.getByText`, `screen.getByRole`, `screen.getByLabelText`, etc. (`expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()`). Sprawdź początkowe stany (np. czy przycisk jest wyłączony). Użyj `toMatchSnapshot()` dla weryfikacji ogólnej struktury (używaj oszczędnie).
        *   **Interakcje Użytkownika (np. wypełnianie formularza):**
            *   *Arrange:* Wyrenderuj komponent. Ustaw `userEvent` (`const user = userEvent.setup()`).
            *   *Act:* Symuluj akcje użytkownika: `await user.type(screen.getByLabelText(/Nazwa/i), 'Test Input')`, `await user.click(screen.getByRole('button', { name: /Submit/i }))`.
            *   *Assert:* Sprawdź, czy stan komponentu się zmienił (np. czy przycisk Submit jest teraz aktywny). Sprawdź, czy mockowane funkcje (np. `onSubmit`) zostały wywołane z poprawnymi argumentami (`expect(onSubmitMock).toHaveBeenCalledWith(/* expected data */)`).
        *   **Warunkowe Renderowanie:**
            *   *Arrange:* Przygotuj różne zestawy propsów lub skonfiguruj mocki hooków, aby przełączać stany (np. `isLoading: true`, `error: 'Some error'`).
            *   *Act:* Wyrenderuj komponent z różnymi propsami/stanami.
            *   *Assert:* Sprawdź, czy odpowiednie elementy są renderowane lub ukrywane (`expect(screen.queryByText(/Loading/i)).toBeInTheDocument()`, `expect(screen.queryByRole('button')).toBeNull()`).
        *   **Obsługa Błędów (np. walidacja formularza):**
            *   *Arrange:* Wyrenderuj komponent.
            *   *Act:* Symuluj wprowadzenie niepoprawnych danych i próbę wysłania formularza.
            *   *Assert:* Sprawdź, czy komunikaty o błędach walidacji są wyświetlane (`expect(screen.getByText(/Pole wymagane/i)).toBeVisible()`). Sprawdź, czy funkcja `onSubmit` *nie* została wywołana.
    4.  **Narzędzia:** Vitest, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` (dla matcherów jak `toBeInTheDocument`, `toBeVisible`).

---

Pamiętaj o stosowaniu zasad czystego kodu w testach, używaniu opisowych nazw dla testów i grup (`describe`, `it`), oraz przestrzeganiu wzorca Arrange-Act-Assert. 