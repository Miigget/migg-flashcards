# Plan implementacji widoku kolekcji (Collections & CollectionDetail)

## 1. Przegląd
Widoki te umożliwiają użytkownikom zarządzanie kolekcjami fiszek. Widok `/collections` wyświetla listę wszystkich kolekcji użytkownika wraz z liczbą fiszek i akcjami. Widok `/collections/[name]` wyświetla szczegóły wybranej kolekcji, w tym listę zawartych w niej fiszek z opcjami edycji, usuwania, dodawania nowych fiszek, generowania AI oraz rozpoczęcia sesji nauki.

## 2. Routing widoku
-   `/collections`: Wyświetla listę kolekcji (`CollectionsPage` -> `CollectionsListView`).
-   `/collections/[collection_name]`: Wyświetla szczegóły konkretnej kolekcji (`CollectionDetailPage` -> `CollectionDetailView`). Parametr `collection_name` jest nazwą kolekcji.

## 3. Struktura komponentów
```
Layout (Astro)
├─ Navbar (React)
└─ Slot
   ├─ CollectionsPage (Astro - /src/pages/collections.astro)
   │  └─ CollectionsListView (React - /src/components/CollectionsListView.tsx)
   │     ├─ LoadingSkeleton (Shadcn) / ErrorDisplay (Custom)
   │     └─ CollectionItem (React - /src/components/CollectionItem.tsx) [*]
   │        ├─ Card (Shadcn)
   │        ├─ CardHeader, CardTitle, CardDescription, CardContent, CardFooter (Shadcn)
   │        └─ Button (Shadcn) [*] (Szczegóły, Zmień nazwę, Usuń)
   ├─ CollectionDetailPage (Astro - /src/pages/collections/[collection_name].astro)
   │  └─ CollectionDetailView (React - /src/components/CollectionDetailView.tsx)
   │     ├─ Button (Shadcn) [*] (Rozpocznij naukę, Dodaj fiszkę, Generuj AI, Zmień nazwę kolekcji, Usuń kolekcję)
   │     ├─ LoadingSkeleton (Shadcn) / ErrorDisplay (Custom)
   │     ├─ FlashcardItem (React - /src/components/FlashcardItem.tsx) [*]
   │     │  ├─ Card (Shadcn)
   │     │  ├─ CardHeader, CardTitle, CardContent, CardFooter (Shadcn)
   │     │  └─ Button (Shadcn) [*] (Edytuj, Usuń)
   │     └─ PaginationControls (React - /src/components/ui/PaginationControls.tsx)
   │        └─ Pagination (Shadcn)
   └─ Dialogs (Renderowane warunkowo, np. wewnątrz komponentów widoku lub na poziomie Layoutu)
      ├─ RenameCollectionDialog (React - /src/components/RenameCollectionDialog.tsx)
      │  ├─ Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter (Shadcn)
      │  ├─ Input (Shadcn)
      │  └─ Button (Shadcn)
      └─ DeleteConfirmationDialog (React - /src/components/DeleteConfirmationDialog.tsx)
         ├─ Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter (Shadcn)
         └─ Button (Shadcn)
```

## 4. Szczegóły komponentów

### `CollectionsListView` (React)
-   **Opis komponentu:** Odpowiedzialny za pobranie i wyświetlenie listy kolekcji użytkownika. Zarządza stanami ładowania i błędów dla listy nazw kolekcji oraz dla liczników fiszek. Renderuje komponenty `CollectionItem`.
-   **Główne elementy:** `div` jako kontener, komponenty `Skeleton` (Shadcn) podczas ładowania, `ErrorDisplay` przy błędzie, mapowanie stanu kolekcji na komponenty `CollectionItem`.
-   **Obsługiwane interakcje:** Wywołanie funkcji do otwarcia modali zmiany nazwy (`handleRenameClick`) i usuwania (`handleDeleteClick`) przekazanych z `CollectionItem`. Logika pobierania danych przy montowaniu komponentu.
-   **Obsługiwana walidacja:** Brak bezpośredniej walidacji.
-   **Typy:** `CollectionViewModel[]`, `ApiError | null`
-   **Propsy:** Brak (komponent pobiera własne dane).

### `CollectionItem` (React)
-   **Opis komponentu:** Wyświetla pojedynczą kolekcję jako karta (Shadcn `Card`). Pokazuje nazwę kolekcji, liczbę fiszek (lub stan ładowania/błędu dla licznika) oraz przyciski akcji.
-   **Główne elementy:** `Card`, `CardHeader` (`CardTitle` z nazwą), `CardContent` (opis z liczbą fiszek lub `Skeleton`), `CardFooter` (przyciski "Szczegóły", "Zmień nazwę", "Usuń" - Shadcn `Button`). Link "Szczegóły" nawiguje do `/collections/[name]`.
-   **Obsługiwane interakcje:** Kliknięcie przycisków wywołuje callbacki `onViewClick` (nawigacja), `onRenameClick(collectionName)`, `onDeleteClick(collectionName)`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `CollectionViewModel`.
-   **Propsy:** `collection: CollectionViewModel`, `onRenameClick: (name: string) => void`, `onDeleteClick: (name: string) => void`.

### `CollectionDetailView` (React)
-   **Opis komponentu:** Główny komponent widoku szczegółów kolekcji. Wyświetla nazwę kolekcji, przyciski akcji na poziomie kolekcji, paginowaną listę fiszek (`FlashcardItem`) oraz kontrolki paginacji. Zarządza stanami ładowania/błędu dla fiszek i operacji na kolekcji.
-   **Główne elementy:** Nagłówek (`h1` z nazwą kolekcji), `div` z przyciskami akcji (`Button`y: Rozpocznij naukę, Dodaj fiszkę, Generuj AI, Zmień nazwę, Usuń), lista fiszek (`FlashcardItem`), `PaginationControls`. Komponenty `Skeleton` lub `ErrorDisplay` w zależności od stanu.
-   **Obsługiwane interakcje:** Kliknięcie przycisków akcji kolekcji (nawigacja lub wywołanie modali/API). Kliknięcie przycisków w `FlashcardItem` (wywołanie modali/API). Zmiana strony w `PaginationControls`. Pobieranie danych przy montowaniu i zmianie strony.
-   **Obsługiwana walidacja:** Brak bezpośredniej walidacji danych wejściowych (delegowana do modali).
-   **Typy:** `CollectionDetailViewModel`, `FlashcardDTO[]`, `PaginatedResponse<FlashcardDTO>`, `ApiError | null`.
-   **Propsy:** `initialCollectionName: string` (pobrana z URL przez stronę Astro).

### `FlashcardItem` (React)
-   **Opis komponentu:** Wyświetla pojedynczą fiszkę (przód i tył) jako karta (Shadcn `Card`) wraz z przyciskami "Edytuj" i "Usuń".
-   **Główne elementy:** `Card`, `CardHeader` (`CardTitle` z tekstem `front`), `CardContent` (tekst `back`), `CardFooter` (przyciski "Edytuj", "Usuń" - Shadcn `Button`).
-   **Obsługiwane interakcje:** Kliknięcie przycisków wywołuje callbacki `onEditClick(flashcard)` i `onDeleteClick(flashcardId)`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** `FlashcardDTO`.
-   **Propsy:** `flashcard: FlashcardDTO`, `onEditClick: (flashcard: FlashcardDTO) => void`, `onDeleteClick: (id: number) => void`.

### `RenameCollectionDialog` (React)
-   **Opis komponentu:** Modal (Shadcn `Dialog`) do zmiany nazwy kolekcji. Zawiera pole tekstowe i przyciski akcji.
-   **Główne elementy:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `Input` dla nowej nazwy, `DialogFooter` z przyciskami "Zapisz" (`Button`) i "Anuluj" (`Button` variant="outline"). Wyświetlanie błędów walidacji/API.
-   **Obsługiwane interakcje:** Wprowadzanie tekstu w `Input`. Kliknięcie "Zapisz" wywołuje `onRenameSubmit` z nową nazwą po walidacji. Kliknięcie "Anuluj" wywołuje `onCancel`.
-   **Obsługiwana walidacja:** Pole nie może być puste. Maksymalna długość: 30 znaków. Opcjonalnie: sprawdzenie, czy nazwa już istnieje (wymaga dostępu do listy nazw lub dedykowanego API).
-   **Typy:** `string` (nowa nazwa).
-   **Propsy:** `isOpen: boolean`, `currentName: string`, `onRenameSubmit: (newName: string) => Promise<void>`, `onCancel: () => void`, `existingNames: string[]` (opcjonalnie, do walidacji unikalności).

### `DeleteConfirmationDialog` (React)
-   **Opis komponentu:** Generyczny modal (Shadcn `Dialog`) do potwierdzania operacji usuwania.
-   **Główne elementy:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` (informująca co zostanie usunięte, np. "Czy na pewno chcesz usunąć kolekcję '{itemName}'? Spowoduje to usunięcie wszystkich {count} fiszek w tej kolekcji."), `DialogFooter` z przyciskami "Potwierdź" (`Button` variant="destructive") i "Anuluj" (`Button` variant="outline").
-   **Obsługiwane interakcje:** Kliknięcie "Potwierdź" wywołuje `onConfirm`. Kliknięcie "Anuluj" wywołuje `onCancel`.
-   **Obsługiwana walidacja:** Brak.
-   **Typy:** Brak specyficznych typów poza propsami.
-   **Propsy:** `isOpen: boolean`, `itemType: string` (np. "kolekcję", "fiszkę"), `itemName: string`, `additionalInfo?: string` (np. o usuwaniu fiszek), `onConfirm: () => Promise<void>`, `onCancel: () => void`.

### `PaginationControls` (React)
-   **Opis komponentu:** Wyświetla komponent paginacji z Shadcn/ui.
-   **Główne elementy:** Komponent `Pagination` z Shadcn, zawierający `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationLink`, `PaginationEllipsis`, `PaginationNext`.
-   **Obsługiwane interakcje:** Kliknięcie na numery stron lub przyciski "Previous"/"Next" wywołuje callback `onPageChange` z nowym numerem strony.
-   **Obsługiwana walidacja:** Przyciski "Previous"/"Next" są wyłączane na pierwszej/ostatniej stronie.
-   **Typy:** `number`.
-   **Propsy:** `currentPage: number`, `totalPages: number`, `onPageChange: (page: number) => void`.

## 5. Typy

*   **DTO (z `src/types.ts`)**:
    *   `FlashcardDTO`: Obiekt fiszki z bazy danych.
        ```typescript
        // Database["public"]["Tables"]["flashcards"]["Row"]
        type FlashcardDTO = {
          id: number;
          user_id: string;
          created_at: string;
          updated_at: string;
          front: string;
          back: string;
          collection: string;
          source: "manual" | "ai-full" | "ai-edited";
          generation_id: number | null;
        };
        ```
    *   `PaginatedResponse<T>`: Struktura odpowiedzi dla paginowanych endpointów.
        ```typescript
        interface PaginatedResponse<T> {
          data: T[];
          page: number;
          limit: number;
          total: number;
        }
        ```
    *   `UpdateCollectionCommand`: Payload dla `PUT /api/collections/[name]`.
        ```typescript
        interface UpdateCollectionCommand {
          new_name: string;
        }
        ```
*   **ViewModel (nowe typy)**:
    *   `CollectionViewModel`: Reprezentuje kolekcję na liście.
        ```typescript
        interface CollectionViewModel {
          name: string;
          flashcardCount: number | null; // null podczas ładowania lub przy błędzie
          isLoadingCount: boolean;
          errorCount: ApiError | null;
        }
        ```
    *   `CollectionDetailViewModel`: Stan widoku szczegółów kolekcji.
        ```typescript
        interface CollectionDetailViewModel {
          collectionName: string;
          flashcards: FlashcardDTO[];
          pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            limit: number;
          };
          isLoading: boolean; // Główny stan ładowania fiszek
          isRenaming: boolean; // Stan ładowania podczas zmiany nazwy
          isDeleting: boolean; // Stan ładowania podczas usuwania kolekcji
          error: ApiError | null; // Błąd pobierania/operacji na kolekcji/fiszkach
        }
        ```
    *   `ApiError`: Struktura błędu API.
        ```typescript
        interface ApiError {
          status: number;
          message: string;
          details?: any; // np. z Zod
        }
        ```

## 6. Zarządzanie stanem

Stan będzie zarządzany głównie wewnątrz komponentów React (`CollectionsListView`, `CollectionDetailView`) przy użyciu hooków `useState` i `useEffect`.

*   **`CollectionsListView`**:
    *   `collections: CollectionViewModel[]`: Lista kolekcji z ich statusami ładowania licznika.
    *   `isLoadingNames: boolean`: Ładowanie początkowej listy nazw.
    *   `errorNames: ApiError | null`: Błąd pobierania nazw.
    *   `renameTarget: string | null`: Nazwa kolekcji do zmiany (kontroluje modal).
    *   `deleteTarget: string | null`: Nazwa kolekcji do usunięcia (kontroluje modal).
    *   **Custom Hook:** Rozważenie `useCollectionsList` do enkapsulacji logiki pobierania nazw, pobierania liczników (nawet jeśli nieefektywnie przez iterację `GET /api/flashcards`), zarządzania stanami i obsługi modali.

*   **`CollectionDetailView`**:
    *   `viewModel: CollectionDetailViewModel`: Główny stan widoku.
    *   `renameTarget: string | null`: Kontroluje modal zmiany nazwy.
    *   `deleteCollectionTarget: string | null`: Kontroluje modal usuwania kolekcji.
    *   `deleteFlashcardTarget: number | null`: ID fiszki do usunięcia (kontroluje modal).
    *   `editFlashcardTarget: FlashcardDTO | null`: Fiszka do edycji (kontroluje modal/formularz edycji).
    *   **Custom Hook:** Rozważenie `useCollectionDetail(collectionName)` do enkapsulacji pobierania fiszek, paginacji, zarządzania stanami `viewModel` oraz logiki obsługi akcji (zmiana nazwy, usuwanie kolekcji/fiszki, edycja).

Do zarządzania stanem ładowania/błędów operacji asynchronicznych (API calls) w hookach lub bezpośrednio w komponentach można użyć dodatkowych flag `useState`. Biblioteki takie jak React Query/SWR mogą uprościć zarządzanie cache, stanami ładowania/błędów, ale na start hooki `useState`/`useEffect` mogą wystarczyć.

## 7. Integracja API

Integracja z API będzie realizowana za pomocą funkcji `fetch` lub dedykowanego klienta API (np. opartego na `fetch`) wywoływanego wewnątrz `useEffect` lub w funkcjach obsługi zdarzeń.

*   **`GET /api/collections`**:
    *   Wywołanie: W `useCollectionsList` lub `useEffect` w `CollectionsListView`.
    *   Typ odpowiedzi: `string[]`.
*   **`GET /api/flashcards?collection={name}&limit=1` (dla licznika)**:
    *   Wywołanie: W `useCollectionsList` lub `useEffect` w `CollectionsListView`, iteracyjnie po pobraniu nazw.
    *   Typ odpowiedzi: `PaginatedResponse<FlashcardDTO>`. Używane pole `total`.
*   **`PUT /api/collections/{collection_name}`**:
    *   Wywołanie: W funkcji obsługi submitu `RenameCollectionDialog`.
    *   Typ żądania: `UpdateCollectionCommand` (`{ new_name: string }`).
    *   Typ odpowiedzi: `{ message: string, updated_count: number }`.
*   **`DELETE /api/collections/{collection_name}`**:
    *   Wywołanie: W funkcji obsługi potwierdzenia `DeleteConfirmationDialog` dla kolekcji.
    *   Typ odpowiedzi: `{ message: string, deletedCount: number }`.
*   **`GET /api/flashcards` (z parametrami `collection`, `page`, `limit`)**:
    *   Wywołanie: W `useCollectionDetail` lub `useEffect` w `CollectionDetailView` przy montowaniu i zmianie strony.
    *   Typ odpowiedzi: `PaginatedResponse<FlashcardDTO>`.
*   **`DELETE /api/flashcards/{flashcard_id}`**:
    *   Wywołanie: W funkcji obsługi potwierdzenia `DeleteConfirmationDialog` dla fiszki.
    *   Typ odpowiedzi: Oczekiwany status 200/204, ciało odpowiedzi może być proste `{ message: string }` lub puste.
*   **`PUT /api/flashcards/{flashcard_id}`** (do edycji):
    *   Wywołanie: W funkcji obsługi submitu formularza/modala edycji fiszki.
    *   Typ żądania: `UpdateFlashcardCommand` (`Partial<Pick<FlashcardDTO, "front" | "back" | "collection">`).
    *   Typ odpowiedzi: `FlashcardDTO` (zaktualizowana fiszka).

Należy obsługiwać różne statusy odpowiedzi (2xx, 4xx, 5xx) i odpowiednio aktualizować stan UI (ładowanie, błąd, sukces) oraz wyświetlać powiadomienia (np. Shadcn `Toast`).

## 8. Interakcje użytkownika

*   **Przeglądanie listy kolekcji:** Użytkownik widzi karty, może przewijać. Stany ładowania dla nazw i liczników są widoczne.
*   **Nawigacja do szczegółów:** Kliknięcie "Szczegóły" na karcie kolekcji przenosi do `/collections/[name]`.
*   **Zmiana nazwy kolekcji:** Kliknięcie "Zmień nazwę" -> otwarcie modala -> wpisanie nowej nazwy -> kliknięcie "Zapisz" -> wywołanie API -> zamknięcie modala -> aktualizacja UI (nazwa na karcie lub w nagłówku widoku szczegółów, potencjalna zmiana URL) -> powiadomienie toast.
*   **Usuwanie kolekcji:** Kliknięcie "Usuń" -> otwarcie modala potwierdzającego (z informacją o usunięciu fiszek) -> kliknięcie "Potwierdź" -> wywołanie API -> usunięcie karty z listy / nawigacja z widoku szczegółów -> powiadomienie toast.
*   **Przeglądanie fiszek w kolekcji:** Użytkownik widzi paginowaną listę fiszek. Stan ładowania przy pierwszej wizycie i zmianie strony.
*   **Paginacja:** Kliknięcie kontrolek paginacji -> wywołanie API dla nowej strony -> aktualizacja listy fiszek.
*   **Edycja fiszki:** Kliknięcie "Edytuj" -> otwarcie modala/formularza edycji -> zmiana danych -> kliknięcie "Zapisz" -> wywołanie API -> aktualizacja fiszki w UI -> powiadomienie toast.
*   **Usuwanie fiszki:** Kliknięcie "Usuń" -> otwarcie modala potwierdzającego -> kliknięcie "Potwierdź" -> wywołanie API -> usunięcie fiszki z listy -> powiadomienie toast.
*   **Akcje nawigacyjne (Study, Add, Generate AI):** Kliknięcie odpowiednich przycisków w `CollectionDetailView` przenosi użytkownika do odpowiednich ścieżek (`/study/[name]`, `/create`, `/generate`).

## 9. Warunki i walidacja

*   **Zmiana nazwy kolekcji (`RenameCollectionDialog`):**
    *   Nowa nazwa nie może być pusta.
    *   Nowa nazwa nie może przekraczać 30 znaków.
    *   Nowa nazwa nie może być identyczna jak inna istniejąca nazwa kolekcji (walidacja opcjonalna, API zwróci 409).
    *   Walidacja wykonywana po stronie klienta przed wysłaniem żądania API. Przycisk "Zapisz" jest nieaktywny, jeśli walidacja nie przechodzi. Komunikaty o błędach wyświetlane są w modalu.
*   **Edycja fiszki (modal/formularz):**
    *   Pole `front` nie może przekraczać 200 znaków.
    *   Pole `back` nie może przekraczać 500 znaków.
    *   Pole `collection` (jeśli edytowalne) nie może przekraczać 30 znaków i nie może być puste.
    *   Walidacja wykonywana po stronie klienta. Przycisk "Zapisz" nieaktywny przy błędach. Komunikaty o błędach wyświetlane w formularzu/modalu.
*   **API Responses:** Interfejs musi poprawnie interpretować kody statusu odpowiedzi API (np. 400, 404, 409, 500) i wyświetlać odpowiednie komunikaty o błędach użytkownikowi (np. za pomocą `Toast` lub `ErrorDisplay`).

## 10. Obsługa błędów

*   **Błędy sieciowe/API:** Użycie bloków `try...catch` wokół wywołań `fetch`. W przypadku błędu, aktualizacja stanu `error` w odpowiednim komponencie/hooku. Wyświetlenie komponentu `ErrorDisplay` z opcją ponowienia próby lub powiadomienia `Toast`.
*   **Błędy walidacji API (400, 409):** Wyświetlenie konkretnego komunikatu błędu zwróconego przez API w odpowiednim miejscu (np. w modalu zmiany nazwy przy błędzie 409).
*   **Nie znaleziono zasobu (404):**
    *   Przy wchodzeniu na `/collections/[name]` dla nieistniejącej kolekcji: strona Astro powinna obsłużyć to serwerowo (przekierowanie/strona 404) lub komponent React powinien wyświetlić stan "Nie znaleziono kolekcji".
    *   Podczas operacji (PUT/DELETE): Mało prawdopodobne, jeśli UI jest spójne, ale obsłużyć przez wyświetlenie `Toast` ("Nie znaleziono zasobu").
*   **Błędy serwera (500):** Wyświetlenie generycznego komunikatu błędu (`Toast` lub `ErrorDisplay`) z informacją o problemie po stronie serwera.
*   **Problem z pobieraniem liczników:** Jeśli pobranie licznika dla `CollectionItem` się nie powiedzie, wyświetlić "Błąd" lub "?" zamiast liczby, ustawić `errorCount`.

## 11. Kroki implementacji

1.  **Struktura plików:** Utwórz strony Astro (`/src/pages/collections.astro`, `/src/pages/collections/[collection_name].astro`). Utwórz komponenty React w `/src/components/` (np. `CollectionsListView.tsx`, `CollectionItem.tsx`, `CollectionDetailView.tsx`, `FlashcardItem.tsx`, `RenameCollectionDialog.tsx`, `DeleteConfirmationDialog.tsx`) i komponenty UI w `/src/components/ui/` (np. `PaginationControls.tsx`, `ErrorDisplay.tsx` jeśli potrzebny).
2.  **Strony Astro:** Zaimplementuj podstawową strukturę stron Astro, włączając Layout i renderując odpowiednie komponenty React (z `client:load` lub `client:visible`). Przekaż `collection_name` jako prop do `CollectionDetailView`.
3.  **Komponent `CollectionsListView`:** Zaimplementuj pobieranie nazw kolekcji (`GET /api/collections`) i wyświetlanie stanu ładowania/błędu.
4.  **Komponent `CollectionItem`:** Zaimplementuj wyświetlanie nazwy. Dodaj przyciski. Zaimplementuj nawigację do szczegółów.
5.  **Pobieranie liczników:** W `CollectionsListView`, po pobraniu nazw, zaimplementuj logikę pobierania liczników dla każdej kolekcji (np. przez `GET /api/flashcards?collection=...&limit=1`), obsługując indywidualne stany ładowania/błędu w `CollectionViewModel` i aktualizując `CollectionItem`.
6.  **Komponent `CollectionDetailView`:** Zaimplementuj pobieranie fiszek dla danej kolekcji (`GET /api/flashcards?collection=...`) wraz z paginacją. Wyświetlaj stany ładowania/błędu.
7.  **Komponent `FlashcardItem`:** Zaimplementuj wyświetlanie danych fiszki i przycisków akcji.
8.  **Komponent `PaginationControls`:** Zaimplementuj logikę paginacji i integrację z `CollectionDetailView`.
9.  **Dialogi:** Zaimplementuj `RenameCollectionDialog` i `DeleteConfirmationDialog` używając komponentów Shadcn.
10. **Logika Akcji (Zmiana nazwy):** Zintegruj `RenameCollectionDialog` z `CollectionsListView` i `CollectionDetailView`. Zaimplementuj wywołanie API (`PUT /api/collections/...`), obsługę błędów (w tym 409), aktualizację stanu, powiadomienia toast i aktualizację URL (w `CollectionDetailView`).
11. **Logika Akcji (Usuwanie kolekcji):** Zintegruj `DeleteConfirmationDialog`. Zaimplementuj wywołanie API (`DELETE /api/collections/...`), obsługę błędów, aktualizację stanu (usunięcie z listy lub nawigacja), powiadomienia toast.
12. **Logika Akcji (Usuwanie fiszki):** Zintegruj `DeleteConfirmationDialog`. Zaimplementuj wywołanie API (`DELETE /api/flashcards/...`), obsługę błędów, aktualizację stanu (usunięcie z listy), powiadomienia toast.
13. **Logika Akcji (Edycja fiszki):** Zaimplementuj modal/formularz edycji (może być nowy komponent), integrację z `FlashcardItem`, wywołanie API (`PUT /api/flashcards/...`), walidację, obsługę błędów, aktualizację stanu, powiadomienia toast.
14. **Nawigacja:** Zaimplementuj przyciski nawigacyjne (Study, Add Flashcard, Generate AI) w `CollectionDetailView`.
15. **Refaktoryzacja i Hooki:** Rozważ refaktoryzację logiki zarządzania stanem i API do customowych hooków (`useCollectionsList`, `useCollectionDetail`).
16. **Stylowanie i Dostępność:** Dopracuj stylowanie za pomocą Tailwind, upewnij się, że komponenty Shadcn są używane poprawnie i zadbaj o podstawową dostępność (semantyczny HTML, atrybuty ARIA tam, gdzie to konieczne).
17. **Testowanie:** Przetestuj wszystkie przepływy użytkownika, stany ładowania, obsługę błędów i przypadki brzegowe. 