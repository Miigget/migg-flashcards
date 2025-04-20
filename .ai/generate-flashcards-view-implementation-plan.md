# Plan implementacji widoku GenerateFlashcards

## 1. Przegląd
Widok `GenerateFlashcards` umożliwia użytkownikom generowanie fiszek przy użyciu AI na podstawie dostarczonego tekstu. Proces jest podzielony na trzy kroki: wprowadzenie tekstu, przeglądanie i edycja wygenerowanych kandydatów na fiszki, oraz zapisanie zaakceptowanych fiszek do wybranej kolekcji. Widok integruje się z API w celu generowania kandydatów, pobierania istniejących kolekcji i zapisywania zaakceptowanych fiszek zbiorczo.

## 2. Routing widoku
Widok powinien być dostępny pod ścieżką `/generate`. Dostęp do tej ścieżki powinien być chroniony i wymagać zalogowanego użytkownika.

## 3. Struktura komponentów
Hierarchia komponentów React dla tego widoku:

```
GenerateFlashcardsView (Kontener, granica Astro/React)
├── Stepper (Komponent UI)
├── Step1_TextInput (Komponent kroku 1)
│   ├── Textarea (Shadcn)
│   ├── CharacterCounter (Komponent UI)
│   ├── ErrorMessage (Komponent UI)
│   └── Button (Shadcn - Generate)
│   └── LoadingIndicator (Komponent UI)
├── Step2_ReviewCandidates (Komponent kroku 2)
│   ├── ErrorMessage (Komponent UI)
│   ├── Button (Shadcn - Retry Generate)
│   ├── LoadingIndicator (Komponent UI)
│   ├── Button (Shadcn - Accept All)
│   ├── CandidateCard[] (Komponent listy kandydatów)
│   │   ├── div (Tryb wyświetlania)
│   │   │   ├── p (Front)
│   │   │   ├── p (Back)
│   │   │   └── Button (Shadcn - Accept), Button (Shadcn - Edit), Button (Shadcn - Discard)
│   │   └── form (Tryb edycji)
│   │       ├── Input (Shadcn - Front)
│   │       ├── CharacterCounter
│   │       ├── Textarea (Shadcn - Back)
│   │       ├── CharacterCounter
│   │       ├── ErrorMessage
│   │       └── Button (Shadcn - Save), Button (Shadcn - Cancel)
│   └── Button (Shadcn - Proceed to Save)
└── Step3_SaveSelection (Komponent kroku 3)
    ├── ErrorMessage (Komponent UI)
    ├── LoadingIndicator (Komponent UI)
    ├── div (Lista zaakceptowanych kandydatów)
    ├── CollectionSelector (Komponent współdzielony/UI)
    │   ├── Combobox (Shadcn)
    └── Button (Shadcn - Save Flashcards)
```

## 4. Szczegóły komponentów

### `GenerateFlashcardsView`
- **Opis:** Główny kontener React zarządzający stanem całego procesu generowania fiszek (aktualny krok, dane wejściowe, kandydaci, błędy, ładowanie, kolekcje). Komunikuje się z API. Renderuje komponenty odpowiednie dla bieżącego kroku.
- **Główne elementy:** `Stepper`, `Step1_TextInput` / `Step2_ReviewCandidates` / `Step3_SaveSelection` (warunkowo).
- **Obsługiwane interakcje:** Przechodzenie między krokami, inicjowanie wywołań API.
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji, deleguje do komponentów podrzędnych.
- **Typy:** `GenerateFlashcardsViewModel`, `ApiError`.
- **Propsy:** Brak (jest komponentem najwyższego poziomu dla tej funkcji).

### `Stepper`
- **Opis:** Wyświetla wizualnie kroki procesu (1. Wprowadź tekst, 2. Sprawdź kandydatów, 3. Zapisz fiszki) i podświetla aktualny krok.
- **Główne elementy:** Elementy `div` lub `li` stylizowane na kroki.
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `number` (aktualny krok), `string[]` (nazwy kroków).
- **Propsy:** `currentStep: number`, `steps: string[]`.

### `Step1_TextInput`
- **Opis:** Komponent dla pierwszego kroku. Zawiera pole `Textarea` do wprowadzenia tekstu, licznik znaków i przycisk "Generuj".
- **Główne elementy:** `Textarea` (Shadcn), `CharacterCounter`, `ErrorMessage`, `Button` (Shadcn), `LoadingIndicator`.
- **Obsługiwane interakcje:** Wprowadzanie tekstu, kliknięcie przycisku "Generuj".
- **Obsługiwana walidacja:** Długość tekstu: minimum 100 znaków, maksimum 10000 znaków. Przycisk "Generuj" jest nieaktywny, jeśli tekst jest nieprawidłowy lub trwa ładowanie. Wyświetla błędy walidacji.
- **Typy:** `string` (wartość tekstu), `ApiError | null` (błąd generowania), `boolean` (ładowanie).
- **Propsy:** `text: string`, `validationError: string | null`, `isLoading: boolean`, `apiError: ApiError | null`, `onTextChange: (text: string) => void`, `onGenerateClick: () => void`, `onRetryGenerate: () => void`.

### `Step2_ReviewCandidates`
- **Opis:** Komponent dla drugiego kroku. Wyświetla listę kandydatów na fiszki zwróconych przez API. Umożliwia akceptację, edycję i odrzucenie każdego kandydata. Zawiera przycisk "Akceptuj wszystkie" oraz przycisk przejścia do kroku zapisu. Obsługuje stan ładowania i błędy z API generowania.
- **Główne elementy:** `LoadingIndicator`, `ErrorMessage`, `Button` (Retry, Accept All, Proceed to Save), lista `CandidateCard`.
- **Obsługiwane interakcje:** Akceptacja, odrzucenie, rozpoczęcie edycji, zapis edycji, anulowanie edycji pojedynczego kandydata. Akceptacja wszystkich. Przejście do kroku 3. Ponowienie próby generowania w razie błędu.
- **Obsługiwana walidacja:** Przycisk "Przejdź do zapisu" jest aktywny tylko wtedy, gdy przynajmniej jeden kandydat ma status 'accepted'.
- **Typy:** `CandidateViewModel[]`, `ApiError | null` (błąd generowania), `boolean` (ładowanie generowania).
- **Propsy:** `candidates: CandidateViewModel[]`, `isLoading: boolean`, `apiError: ApiError | null`, `onAccept: (tempId: string) => void`, `onDiscard: (tempId: string) => void`, `onEditStart: (tempId: string) => void`, `onEditSave: (candidate: CandidateViewModel) => void`, `onEditCancel: (tempId: string) => void`, `onAcceptAll: () => void`, `onProceedToSave: () => void`, `onRetryGenerate: () => void`.

### `CandidateCard`
- **Opis:** Wyświetla pojedynczego kandydata na fiszkę. Może być w trybie wyświetlania (pokazuje przód/tył i przyciski Akceptuj/Edytuj/Odrzuć) lub w trybie edycji (pokazuje formularz do edycji przodu/tyłu).
- **Główne elementy:** Tryb wyświetlania: `div` z `p` (front/back), `Button` (Accept/Edit/Discard). Tryb edycji: `form` z `Input` (Shadcn - front), `Textarea` (Shadcn - back), `CharacterCounter`, `ErrorMessage`, `Button` (Save/Cancel).
- **Obsługiwane interakcje:** Kliknięcie Akceptuj, Odrzuć, Edytuj. Wprowadzanie tekstu w formularzu edycji. Kliknięcie Zapisz, Anuluj w formularzu edycji.
- **Obsługiwana walidacja:** W trybie edycji: Front <= 200 znaków, Back <= 500 znaków. Przycisk "Zapisz" jest nieaktywny, jeśli dane są nieprawidłowe. Wyświetla błędy walidacji.
- **Typy:** `CandidateViewModel`.
- **Propsy:** `candidate: CandidateViewModel`, `onAccept: (tempId: string) => void`, `onDiscard: (tempId: string) => void`, `onEditStart: (tempId: string) => void`, `onEditSave: (candidate: CandidateViewModel) => void`, `onEditCancel: (tempId: string) => void`.

### `Step3_SaveSelection`
- **Opis:** Komponent dla trzeciego kroku. Wyświetla listę zaakceptowanych kandydatów (tylko do odczytu). Umożliwia wybór istniejącej kolekcji lub wprowadzenie nazwy nowej. Zawiera przycisk "Zapisz fiszki". Obsługuje stan ładowania i błędy z API zapisu oraz pobierania kolekcji.
- **Główne elementy:** `LoadingIndicator`, `ErrorMessage`, `div` (lista zaakceptowanych), `CollectionSelector`, `Button` (Save Flashcards).
- **Obsługiwane interakcje:** Wybór kolekcji z listy, wpisanie nowej nazwy kolekcji, kliknięcie przycisku "Zapisz fiszki".
- **Obsługiwana walidacja:** Nazwa kolekcji (wybrana lub nowa) nie może być pusta. Przycisk "Zapisz fiszki" jest nieaktywny, jeśli nazwa kolekcji jest nieprawidłowa lub trwa ładowanie.
- **Typy:** `CandidateViewModel[]` (tylko zaakceptowane), `string[]` (istniejące kolekcje), `string` (wybrana/nowa kolekcja), `boolean` (czy nowa kolekcja), `ApiError | null` (błąd zapisu/kolekcji), `boolean` (ładowanie zapisu/kolekcji).
- **Propsy:** `acceptedCandidates: CandidateViewModel[]`, `availableCollections: string[]`, `selectedCollection: string`, `isNewCollection: boolean`, `isLoadingSave: boolean`, `isLoadingCollections: boolean`, `saveApiError: ApiError | null`, `collectionsApiError: ApiError | null`, `onCollectionChange: (name: string, isNew: boolean) => void`, `onSaveClick: () => void`.

### `CollectionSelector`
- **Opis:** Komponent UI (prawdopodobnie oparty o Shadcn Combobox) umożliwiający wybór elementu z listy lub wpisanie własnej wartości. Używany do wyboru/tworzenia kolekcji.
- **Główne elementy:** `Combobox` (Shadcn) lub podobny.
- **Obsługiwane interakcje:** Wybór elementu z listy, wpisywanie tekstu.
- **Obsługiwana walidacja:** Może walidować, czy wpisana wartość nie jest pusta, jeśli jest wymagane.
- **Typy:** `string[]` (lista opcji), `string` (aktualna wartość).
- **Propsy:** `collections: string[]`, `value: string`, `onChange: (value: string, isNew: boolean) => void`, `placeholder?: string`, `isLoading?: boolean`, `disabled?: boolean`.

### `CharacterCounter`, `LoadingIndicator`, `ErrorMessage`
- **Opis:** Proste komponenty UI do wyświetlania licznika znaków, wskaźnika ładowania (np. spinner) i komunikatów o błędach (z opcjonalnym przyciskiem ponowienia).
- **Propsy:** Zależne od komponentu (np. `current: number, max: number` dla licznika; `isLoading: boolean` dla wskaźnika; `error: ApiError | string | null`, `showRetry?: boolean`, `onRetry?: () => void` dla błędu).

## 5. Typy

### Typy DTO (bezpośrednio z API lub `src/types.ts`)
- `AIGenerateFlashcardsCommand`: `{ text: string }` (Żądanie POST `/api/flashcards/generate`)
- `GeneratedCandidateDto`: `{ front: string; back: string; }` (Reprezentuje pojedynczego kandydata zwróconego przez API `/generate` - bez kolekcji)
- `GenerateApiResponse`: `{ candidates: GeneratedCandidateDto[], generation_id: string, generated_count: number }` (Odpowiedź z `/generate`)
- `FlashcardCandidateDto`: `{ front: string; back: string; collection: string; source: 'ai-full' | 'ai-edited'; generation_id: string; }` (Struktura danych wysyłana w żądaniu POST `/api/flashcards/bulk` dla każdej fiszki, **wymaga** `collection`)
- `BulkCreateFlashcardsCommand`: `FlashcardCandidateDto[]` (Żądanie POST `/api/flashcards/bulk`)
- `BulkCreateApiResponse`: `FlashcardDTO[]` (Odpowiedź z `/bulk`. Zakładamy, że zwraca tablicę utworzonych fiszek, zgodnie z `src/types.ts` `FlashcardDTO`).
- `CollectionsApiResponse`: `string[]` (Odpowiedź z GET `/api/collections`).
- `FlashcardDTO`: `{ id: string; created_at: string; user_id: string; front: string; back: string; collection: string; source: 'manual' | 'ai-full' | 'ai-edited'; generation_id: string | null; }` (Pełna struktura fiszki w bazie danych).

### Typy ViewModel (używane w stanie komponentów React)
- `GenerateFlashcardsViewModel`:
  ```typescript
  interface GenerateFlashcardsViewModel {
    currentStep: 1 | 2 | 3; // Aktualny krok procesu
    inputText: string; // Tekst wprowadzony przez użytkownika
    inputTextValidationError: string | null; // Błąd walidacji tekstu wejściowego
    candidates: CandidateViewModel[]; // Lista wszystkich kandydatów (zarządzana w kroku 2)
    generationId: string | null; // ID sesji generowania zwrócone przez API
    isLoadingGenerate: boolean; // Czy trwa ładowanie odpowiedzi z /generate
    isLoadingSave: boolean; // Czy trwa zapisywanie fiszek przez /bulk
    isLoadingCollections: boolean; // Czy trwa ładowanie listy kolekcji z /collections
    generateApiError: ApiError | null; // Błąd z API /generate
    saveApiError: ApiError | null; // Błąd z API /bulk
    collectionsApiError: ApiError | null; // Błąd z API /collections
    availableCollections: string[]; // Lista nazw istniejących kolekcji
    selectedCollection: string; // Nazwa wybranej lub nowo wpisanej kolekcji
    isNewCollection: boolean; // Czy `selectedCollection` to nowa nazwa
  }
  ```
- `CandidateViewModel`:
  ```typescript
  interface CandidateViewModel {
    tempId: string; // Unikalny ID dla klucza listy React i zarządzania stanem (np. uuid)
    front: string; // Aktualna treść przodu fiszki
    back: string; // Aktualna treść tyłu fiszki
    status: 'pending' | 'accepted' | 'discarded' | 'editing'; // Status kandydata w procesie recenzji
    originalFront: string; // Oryginalna treść przodu (do śledzenia edycji dla pola 'source')
    originalBack: string; // Oryginalna treść tyłu (do śledzenia edycji dla pola 'source')
    validationError: { front?: string; back?: string } | null; // Błędy walidacji podczas edycji
    generation_id: string; // ID sesji generowania (potrzebne do zapisu)
  }
  ```
- `ApiError`:
  ```typescript
  interface ApiError {
    message: string; // Komunikat błędu
    status?: number; // Opcjonalny kod statusu HTTP
    code?: string; // Opcjonalny kod błędu z backendu
  }
  ```

## 6. Zarządzanie stanem
Zalecane jest użycie customowego hooka React, np. `useGenerateFlashcards`, który hermetyzuje całą logikę i stan widoku.

- **Hook `useGenerateFlashcards`:**
  - Zarządza wszystkimi stanami z `GenerateFlashcardsViewModel` używając `useState` lub `useReducer`.
  - Zawiera funkcje do obsługi zdarzeń (np. `handleTextChange`, `handleGenerateClick`, `handleAccept`, `handleEditSave`, `handleCollectionChange`, `handleSaveBulk`).
  - Obsługuje wywołania API (`fetch` lub biblioteka typu `axios`/`tanstack-query`) wewnątrz tych funkcji lub w `useEffect` (np. do pobrania kolekcji).
  - Zwraca obiekt zawierający wszystkie potrzebne stany i funkcje obsługi zdarzeń, które zostaną przekazane jako propsy do komponentów `Step1_TextInput`, `Step2_ReviewCandidates`, `Step3_SaveSelection`.

- **Stan lokalny:**
  - Komponent `CandidateCard` może mieć lokalny stan dla pól formularza edycji, zanim zostanie on zapisany do stanu globalnego hooka.
  - Komponent `CollectionSelector` (jeśli to Combobox) może mieć wewnętrzny stan dla wartości wpisywanej.

## 7. Integracja API

- **Generowanie kandydatów:**
  - **Akcja:** Kliknięcie "Generuj" w `Step1_TextInput`.
  - **Wywołanie:** `POST /api/flashcards/generate`
  - **Żądanie:** `AIGenerateFlashcardsCommand` (`{ text: string }`)
  - **Odpowiedź (Sukces):** `GenerateApiResponse` (`{ candidates: GeneratedCandidateDto[], generation_id: string, generated_count: number }`) -> Dla każdego `GeneratedCandidateDto` w `candidates`, stwórz `CandidateViewModel` (generując `tempId`, kopiując `front`/`back` do `originalFront`/`originalBack`, ustawiając `status` na `'pending'`, `validationError` na `null` i przypisując `generation_id` z odpowiedzi). Zapisz tablicę `CandidateViewModel` w stanie. Zapisz `generation_id` z odpowiedzi w stanie. Zmień `currentStep` na 2.
  - **Odpowiedź (Błąd):** Ustaw `generateApiError`.

- **Pobieranie kolekcji:**
  - **Akcja:** Przejście do kroku 3 (wywołane przez `onProceedToSave` w `Step2_ReviewCandidates`).
  - **Wywołanie:** `GET /api/collections`
  - **Żądanie:** Brak payloadu.
  - **Odpowiedź (Sukces):** `CollectionsApiResponse` (`string[]`) -> Zapisz w `availableCollections`.
  - **Odpowiedź (Błąd):** Ustaw `collectionsApiError`.

- **Zapisywanie fiszek:**
  - **Akcja:** Kliknięcie "Zapisz fiszki" w `Step3_SaveSelection`.
  - **Wywołanie:** `POST /api/flashcards/bulk`
  - **Żądanie:** `BulkCreateFlashcardsCommand` (`FlashcardCandidateDto[]`). Przed wysłaniem:
    1. Odfiltruj `candidates` ze stanu (`CandidateViewModel[]`) wybierając te ze statusem `accepted`.
    2. Zmapuj odfiltrowaną listę `CandidateViewModel` na `FlashcardCandidateDto`:
       - `front`, `back` z `CandidateViewModel`.
       - `collection = selectedCollection` (z `GenerateFlashcardsViewModel`).
       - `generation_id` (z `GenerateFlashcardsViewModel`).
       - `source = (candidate.front !== candidate.originalFront || candidate.back !== candidate.originalBack) ? 'ai-edited' : 'ai-full'`.
  - **Odpowiedź (Sukces):** `BulkCreateApiResponse` (`FlashcardDTO[]`) -> Wyświetl komunikat sukcesu (używając `Sonner`), zresetuj stan widoku lub przekieruj użytkownika (np. do listy kolekcji).
  - **Odpowiedź (Błąd):** Ustaw `saveApiError`.

## 8. Interakcje użytkownika
- **Krok 1:** Użytkownik wpisuje tekst -> licznik się aktualizuje, walidacja jest sprawdzana. Klika "Generuj" -> stan ładowania, wywołanie API.
- **Krok 2:** Lista kandydatów się pojawia. Użytkownik klika "Akceptuj" -> status kandydata się zmienia. Klika "Odrzuć" -> status kandydata się zmienia (lub jest usuwany). Klika "Edytuj" -> pojawia się formularz edycji dla danego kandydata. W formularzu edytuje tekst -> walidacja długości. Klika "Zapisz" (w edycji) -> zmiany są zapisywane w stanie, formularz znika. Klika "Anuluj" (w edycji) -> zmiany są odrzucane, formularz znika. Klika "Akceptuj wszystkie" -> status wszystkich 'pending' zmienia się na 'accepted'. Klika "Przejdź do zapisu" (aktywny, gdy są zaakceptowane fiszki) -> przejście do kroku 3.
- **Krok 3:** Użytkownik widzi listę zaakceptowanych fiszek. Wybiera istniejącą kolekcję z listy lub wpisuje nową nazwę -> stan `selectedCollection` i `isNewCollection` się aktualizuje. Klika "Zapisz fiszki" (aktywny, gdy wybrano kolekcję) -> stan ładowania, wywołanie API. Po sukcesie widzi potwierdzenie/jest przekierowany.

## 9. Warunki i walidacja
- **Tekst wejściowy (Krok 1):** Długość między 100 a 10000 znaków. Weryfikowane w `Step1_TextInput` przed wysłaniem żądania `/generate`. Blokuje przycisk "Generuj", wyświetla błąd.
- **Edycja kandydata (Krok 2):** Front <= 200 znaków, Back <= 500 znaków. Weryfikowane w `CandidateCard` (tryb edycji) przed zapisaniem zmian. Blokuje przycisk "Zapisz" w formularzu edycji, wyświetla błąd.
- **Przejście do kroku 3 (Krok 2):** Co najmniej jeden kandydat musi mieć status `accepted`. Weryfikowane w `Step2_ReviewCandidates` przed aktywacją przycisku "Przejdź do zapisu".
- **Wybór kolekcji (Krok 3):** `selectedCollection` nie może być pusty. Weryfikowane w `Step3_SaveSelection` przed aktywacją przycisku "Zapisz fiszki". Wyświetla błąd, jeśli jest pusty.
- **Warunki API:** Backend dodatkowo waliduje wszystkie te warunki (`generate.ts`, `bulk.ts`). Walidacja frontendowa ma na celu poprawę UX i uniknięcie niepotrzebnych wywołań API.

## 10. Obsługa błędów
- **Błędy walidacji:** Wyświetlane jako komunikaty bezpośrednio przy odpowiednich polach formularzy (tekst wejściowy, edycja kandydata, wybór kolekcji). Odpowiednie przyciski są blokowane.
- **Błędy API `/generate`:** Wyświetlane w `Step1_TextInput` lub `Step2_ReviewCandidates` za pomocą komponentu `ErrorMessage`. Powinien zawierać komunikat błędu zwrócony przez API (jeśli dostępny) oraz przycisk "Ponów próbę".
- **Błędy API `/collections`:** Wyświetlane w `Step3_SaveSelection` za pomocą `ErrorMessage`. Może wymagać przycisku "Ponów próbę" do ponownego załadowania kolekcji. Wybór kolekcji powinien być zablokowany do czasu rozwiązania problemu.
- **Błędy API `/bulk`:** Wyświetlane w `Step3_SaveSelection` za pomocą `ErrorMessage`. Powinien zawierać komunikat błędu i przycisk "Ponów próbę" do ponowienia zapisu.
- **Stan ładowania:** Podczas wszystkich operacji API (generowanie, pobieranie kolekcji, zapis) należy wyświetlać wskaźniki ładowania (`LoadingIndicator`) i blokować interaktywne elementy, aby zapobiec wielokrotnym wywołaniom.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików:** Stwórz plik dla głównego komponentu widoku (np. `src/components/GenerateFlashcardsView.tsx`) oraz pliki dla komponentów podrzędnych (`Stepper.tsx`, `Step1_TextInput.tsx`, `Step2_ReviewCandidates.tsx`, `CandidateCard.tsx`, `Step3_SaveSelection.tsx`) i komponentów UI (`CharacterCounter.tsx`, `LoadingIndicator.tsx`, `ErrorMessage.tsx`) w odpowiednich katalogach (np. `src/components/feature/generate`, `src/components/ui`). Utwórz plik dla customowego hooka (`src/hooks/useGenerateFlashcards.ts`).
2.  **Implementacja custom hooka `useGenerateFlashcards`:** Zdefiniuj stan (`GenerateFlashcardsViewModel`), logikę zmiany stanu, funkcje obsługi zdarzeń i wywołania API (`/generate`, `/collections`, `/bulk`) wraz z obsługą ładowania i błędów.
3.  **Implementacja komponentów UI:** Stwórz podstawowe komponenty UI (`Stepper`, `CharacterCounter`, `LoadingIndicator`, `ErrorMessage`) używając komponentów Shadcn i Tailwind.
4.  **Implementacja komponentu `Step1_TextInput`:** Połącz z hookiem, dodaj `Textarea`, licznik, przycisk "Generuj", obsługę walidacji i błędów/ładowania.
5.  **Implementacja komponentu `CandidateCard`:** Stwórz logikę przełączania między trybem wyświetlania a edycją. Zaimplementuj formularz edycji z walidacją dla pól Front i Back.
6.  **Implementacja komponentu `Step2_ReviewCandidates`:** Połącz z hookiem, wyrenderuj listę `CandidateCard`, dodaj przyciski "Akceptuj wszystkie" i "Przejdź do zapisu" wraz z logiką ich aktywacji. Obsłuż błędy/ładowanie z API `/generate`.
7.  **Implementacja komponentu `CollectionSelector`:** Użyj komponentu `Combobox` z Shadcn, aby umożliwić wybór z listy i wpisanie nowej wartości. Połącz z hookiem.
8.  **Implementacja komponentu `Step3_SaveSelection`:** Połącz z hookiem, wyświetl listę zaakceptowanych, dodaj `CollectionSelector` i przycisk "Zapisz fiszki". Obsłuż błędy/ładowanie z API `/bulk` i `/collections`.
9.  **Implementacja głównego komponentu `GenerateFlashcardsView`:** Użyj hooka `useGenerateFlashcards`. Renderuj warunkowo komponenty kroków (`Step1`, `Step2`, `Step3`) oraz `Stepper` na podstawie `currentStep` ze stanu hooka. Przekaż potrzebne stany i funkcje jako propsy.
10. **Integracja z Astro:** Utwórz stronę Astro (`src/pages/generate.astro`). Zaimportuj i użyj komponentu `GenerateFlashcardsView.tsx` z odpowiednią dyrektywą `client:` (np. `client:load`). Dodaj routing i ochronę trasy w middleware Astro (`src/middleware/index.ts`).
11. **Testowanie:** Przetestuj wszystkie kroki przepływu, walidację, obsługę błędów API i przypadki brzegowe (brak kandydatów, błędy sieciowe, pusta kolekcja itp.).
12. **Stylowanie:** Dopracuj wygląd komponentów używając Tailwind i upewnij się, że jest zgodny z resztą aplikacji i biblioteką Shadcn. 