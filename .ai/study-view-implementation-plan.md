# Plan implementacji widoku /study

## 1. Przegląd
Widok `/study` umożliwi użytkownikom przeprowadzanie sesji nauki fiszek z wykorzystaniem algorytmu spaced repetition. Użytkownik będzie mógł rozpocząć sesję dla wybranej kolekcji, przeglądać fiszki, oceniać swoją znajomość materiału i śledzić postępy.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/study`.
Dodatkowo, możliwe będzie przekierowanie do tego widoku z parametrem kolekcji, np. `/study?collection=nazwa_kolekcji`, co automatycznie rozpocznie sesję dla tej kolekcji.

## 3. Struktura komponentów
```
/study
└── StudySessionLayout (Astro Layout)
    ├── Header (Astro/React Component) - Wyświetla nazwę kolekcji, postęp, przycisk zakończenia sesji
    └── FlashcardPlayer (React Component)
        ├── FlashcardView (React Component) - Wyświetla przód/tył fiszki
        └── RatingControls (React Component) - Przyciski do oceny znajomości fiszki
    └── CollectionSelector (React Component) - Modal/Dropdown do wyboru kolekcji (jeśli sesja nie jest rozpoczęta dla konkretnej kolekcji)
    └── StudySummary (React Component) - Wyświetla podsumowanie po zakończeniu sesji
```

## 4. Szczegóły komponentów

### StudySessionLayout (Astro Layout)
- Opis komponentu: Główny layout strony sesji nauki. Odpowiada za strukturę strony i ładowanie początkowych danych.
- Główne elementy: Slot na dynamiczne komponenty React.
- Obsługiwane interakcje: Brak bezpośrednich interakcji, zarządza wyświetlaniem komponentów podrzędnych.
- Typy: Astro.props
- Propsy: Brak

### Header (Astro/React Component)
- Opis komponentu: Wyświetla informacje o bieżącej sesji nauki.
- Główne elementy: Nazwa kolekcji, liczba przejrzanych fiszek / całkowita liczba fiszek w sesji, przycisk "Zakończ sesję".
- Obsługiwane interakcje:
    - Kliknięcie "Zakończ sesję": kończy sesję i wyświetla `StudySummary`.
- Typy: `StudySessionState` (do wyświetlania postępu), `CollectionName`
- Propsy: `collectionName: string`, `currentCardIndex: number`, `totalCardsInSession: number`, `onEndSession: () => void`

### FlashcardPlayer (React Component)
- Opis komponentu: Główny komponent zarządzający logiką sesji nauki. Pobiera fiszki dla wybranej kolekcji, implementuje algorytm FSRS.
- Główne elementy: Wyświetla `FlashcardView` i `RatingControls`.
- Obsługiwane interakcje:
    - Ładowanie fiszek dla kolekcji.
    - Przechodzenie do następnej fiszki po ocenie.
    - Aktualizacja stanu fiszki w algorytmie FSRS.
- Typy: `FlashcardDTO`, `FSRSParameters`, `Card` (z ts-fsrs), `Rating` (z ts-fsrs)
- Propsy: `collectionName: string`, `onSessionComplete: (summary: StudySummaryData) => void`

### FlashcardView (React Component)
- Opis komponentu: Wyświetla pojedynczą fiszkę (przód lub tył).
- Główne elementy: Tekst przodu fiszki, tekst tyłu fiszki (widoczny po interakcji).
- Obsługiwane interakcje:
    - Kliknięcie/touch na fiszce: "odwraca" fiszkę, pokazując jej drugą stronę.
- Typy: `FlashcardDTO`
- Propsy: `flashcard: FlashcardDTO`, `isFrontVisible: boolean`, `onFlip: () => void`

### RatingControls (React Component)
- Opis komponentu: Zestaw przycisków umożliwiających użytkownikowi ocenę, jak dobrze zapamiętał fiszkę.
- Główne elementy: Przyciski odpowiadające ocenom algorytmu FSRS (np. "Again", "Hard", "Good", "Easy" lub skala 1-5, zależnie od konfiguracji FSRS).
- Obsługiwane interakcje:
    - Kliknięcie przycisku oceny: przekazuje wybraną ocenę do `FlashcardPlayer`.
- Typy: `Rating` (z ts-fsrs)
- Propsy: `onRate: (rating: Rating) => void`, `disabled: boolean`

### CollectionSelector (React Component)
- Opis komponentu: Komponent umożliwiający wybór kolekcji do nauki, jeśli użytkownik wszedł na `/study` bez wybranej kolekcji. Może to być modal lub dropdown.
- Główne elementy: Lista dostępnych kolekcji użytkownika.
- Obsługiwane interakcje:
    - Wybór kolekcji: rozpoczyna sesję nauki dla wybranej kolekcji.
- Typy: `CollectionViewModel`
- Propsy: `collections: CollectionViewModel[]`, `onCollectionSelect: (collectionName: string) => void`, `isOpen: boolean`, `onClose: () => void`

### StudySummary (React Component)
- Opis komponentu: Wyświetla podsumowanie zakończonej sesji nauki.
- Główne elementy: Liczba przerobionych fiszek, procent poprawnych odpowiedzi (jeśli dotyczy), przycisk "Ucz się dalej" (rozpoczyna nową sesję) lub "Wróć do kolekcji".
- Typy: `StudySummaryData`
- Propsy: `summary: StudySummaryData`, `onStudyAgain: () => void`, `onGoToCollection: (collectionName: string) => void`

## 5. Typy

### `SpacedRepetitionCard`
Reprezentuje fiszkę wraz z jej stanem w algorytmie FSRS.
```typescript
import type { Card as FSRSCard, State as FSRSState, Rating as FSRSRating } from 'ts-fsrs';
import type { FlashcardDTO } from '@/types'; // Zakładając, że FlashcardDTO jest zdefiniowane

export interface SpacedRepetitionCard extends FlashcardDTO {
  fsrsCard: FSRSCard; // Obiekt karty z biblioteki ts-fsrs
  history: { rating: FSRSRating; state: FSRSState; review_date: Date }[]; // Historia ocen dla tej karty
}
```

### `StudySessionState`
Stan całej sesji nauki.
```typescript
export interface StudySessionState {
  collectionName: string;
  allFlashcards: SpacedRepetitionCard[]; // Wszystkie fiszki w kolekcji, przekształcone do SpacedRepetitionCard
  currentCard: SpacedRepetitionCard | null;
  currentIndex: number; // Index obecnej karty w allFlashcards
  sessionQueue: SpacedRepetitionCard[]; // Fiszki do przejrzenia w tej sesji, posortowane przez FSRS
  reviewedInSession: { cardId: number; rating: FSRSRating }[]; // Fiszki przejrzane w tej sesji
  isFrontVisible: boolean;
  isSessionActive: boolean;
  isSessionFinished: boolean;
  studySummaryData: StudySummaryData | null;
  isLoading: boolean;
  error: string | null;
}
```

### `StudySummaryData`
Dane do wyświetlenia w podsumowaniu sesji.
```typescript
export interface StudySummaryData {
  collectionName: string;
  cardsReviewed: number;
  // Można dodać więcej statystyk, np. procent poprawnych odpowiedzi,
  // ale FSRS nie definiuje bezpośrednio "poprawności", tylko stany.
  // Możemy np. śledzić, ile razy karta była "Again".
  againCount: number;
}
```

### `FSRSParameters` (z biblioteki ts-fsrs)
Parametry konfiguracyjne dla algorytmu FSRS. Będziemy używać domyślnych lub pozwolimy na ich konfigurację w przyszłości.

## 6. Zarządzanie stanem
Stan sesji nauki będzie zarządzany głównie w komponencie `FlashcardPlayer` przy użyciu hooków React (`useState`, `useEffect`, `useReducer` jeśli logika stanie się złożona).

- **Ładowanie fiszek**: Po wybraniu kolekcji, fiszki są pobierane z API.
- **Inicjalizacja FSRS**: Dla każdej fiszki tworzony jest obiekt `Card` z `ts-fsrs`. Jeśli fiszka była już uczona, jej stan (stability, difficulty, etc.) powinien być pobrany z bazy danych (nowa tabela `flashcard_srs_metadata`). Jeśli nie, tworzona jest jako nowa karta.
- **Kolejka nauki**: Algorytm FSRS (`f.repeat(card, now)`) generuje terminy dla różnych ocen. Implementacja musi wybrać następną kartę do nauki na podstawie `card.due`. Początkowo wszystkie karty "due" na dziś.
- **Aktualizacja stanu**: Po ocenie przez użytkownika, stan fiszki (`FSRSCard`) jest aktualizowany, a nowa data `due` jest zapisywana w `flashcard_srs_metadata`.
- **Przechowywanie stanu FSRS**: Każda fiszka (`FlashcardDTO`) będzie musiała mieć powiązane metadane FSRS. Proponuję nową tabelę `flashcard_srs_metadata`:
    - `flashcard_id` (FK do `flashcards.flashcard_id`)
    - `user_id` (FK do `users.id`)
    - `due`: `timestamp with time zone` (data następnej powtórki)
    - `stability`: `double precision`
    - `difficulty`: `double precision`
    - `elapsed_days`: `integer`
    - `scheduled_days`: `integer`
    - `reps`: `integer`
    - `lapses`: `integer`
    - `state`: `integer` (mapowanie na `State` z `ts-fsrs`: New, Learning, Review, Relearning)
    - `last_review`: `timestamp with time zone` (data ostatniej powtórki)
    - `fsrs_params_hash`: `text` (opcjonalnie, hash parametrów FSRS użytych do tej karty, aby wykryć zmiany)
  Początkowo, jeśli brak wpisu w `flashcard_srs_metadata`, karta jest traktowana jako nowa.

## 7. Integracja API

### Backend:
Należy stworzyć nowe endpointy API:

1.  **`GET /api/collections/[collectionName]/study`**:
    -   Pobiera wszystkie fiszki dla danej kolekcji należące do zalogowanego użytkownika.
    -   Dla każdej fiszki dołącza jej metadane FSRS z tabeli `flashcard_srs_metadata`.
    -   Odpowiedź: `PaginatedResponse<SpacedRepetitionCard[]>` (lub po prostu `SpacedRepetitionCard[]` jeśli nie ma paginacji dla sesji nauki).

2.  **`POST /api/flashcards/[flashcard_id]/review`**:
    -   Przyjmuje ocenę użytkownika (`Rating` z `ts-fsrs`) dla danej fiszki.
    -   Oblicza nowy stan fiszki używając `ts-fsrs`.
    -   Zapisuje/aktualizuje wpis w `flashcard_srs_metadata` dla tej fiszki (nowe `due`, `stability`, `difficulty`, etc.).
    -   Odpowiedź: Zaktualizowany obiekt `SpacedRepetitionCard`.
    -   Payload: `{ rating: FSRSRating }`

3.  **`GET /api/collections`**:
    -   Istniejący (lub do stworzenia) endpoint zwracający listę kolekcji użytkownika.
    -   Odpowiedź: `CollectionViewModel[]`

### Frontend:
- `FlashcardPlayer` będzie używał `fetch` do komunikacji z tymi endpointami.
- Należy obsłużyć stany ładowania i błędy.

## 8. Interakcje użytkownika

1.  **Rozpoczęcie sesji**:
    *   Przycisk "Study" w top barze: Wyświetla `CollectionSelector` (jeśli nie ma aktywnej kolekcji). Po wyborze kolekcji, ładuje fiszki.
    *   Przycisk "Start Learning" na Dashboard: Podobnie jak wyżej.
    *   Przycisk "Start learning" w widoku `/collections/[collection_name]`: Bezpośrednio ładuje fiszki dla tej kolekcji.
    *   Jeśli użytkownik wejdzie na `/study` bez parametru kolekcji i nie ma aktywnej sesji, wyświetlany jest `CollectionSelector`.
2.  **Wyświetlanie fiszki**:
    *   `FlashcardView` pokazuje przód fiszki.
    *   Użytkownik klika/dotyka fiszki, aby ją "odwrócić" i zobaczyć tył. Stan `isFrontVisible` jest przełączany.
3.  **Ocena fiszki**:
    *   Po obejrzeniu obu stron, użytkownik klika jeden z przycisków w `RatingControls`.
    *   Ocena jest wysyłana do API (`/api/flashcards/[flashcard_id]/review`).
    *   Algorytm FSRS w backendzie (lub w frontendzie, jeśli stan jest tam liczony i tylko zapisywany) oblicza następny termin.
    *   `FlashcardPlayer` ładuje następną fiszkę z kolejki `sessionQueue`.
4.  **Nawigacja w sesji**:
    *   Fiszki są prezentowane jedna po drugiej zgodnie z logiką FSRS (najpierw te, które są "due").
    *   Sesja trwa, dopóki są fiszki "due" na dany dzień lub użytkownik zdecyduje się ją zakończyć.
5.  **Zakończenie sesji**:
    *   Użytkownik klika "Zakończ sesję" w `Header`.
    *   Wyświetlany jest komponent `StudySummary` z podsumowaniem.
    *   Użytkownik może rozpocząć nową sesję lub wrócić do listy kolekcji.

## 9. Warunki i walidacja

-   Użytkownik musi być zalogowany, aby uzyskać dostęp do `/study`. Middleware Astro powinno to zapewnić.
-   Sesja nauki może być rozpoczęta tylko dla istniejącej kolekcji, która zawiera fiszki.
    -   Jeśli kolekcja nie istnieje lub jest pusta, wyświetlany jest odpowiedni komunikat.
-   Endpointy API muszą walidować payloady (np. używając Zod).
-   `collectionName` w URL musi być odpowiednio zwalidowane/sanitized.

## 10. Obsługa błędów

-   **Błędy sieciowe**: Komunikaty dla użytkownika o problemach z połączeniem podczas pobierania fiszek lub wysyłania ocen.
-   **Błędy API**:
    -   Jeśli kolekcja nie znaleziona: przekierowanie lub komunikat.
    -   Jeśli fiszka nie znaleziona: pominięcie, logowanie błędu.
    -   Błędy walidacji: wyświetlanie informacji użytkownikowi.
    -   Inne błędy serwera (500): ogólny komunikat błędu.
-   **Brak fiszek do nauki**: Jeśli w wybranej kolekcji nie ma fiszek "due" na dany dzień, użytkownik powinien zobaczyć stosowny komunikat (np. "Gratulacje, wszystko powtórzone na dziś!").
-   Komponenty powinny mieć zdefiniowane stany błędów i wyświetlać je użytkownikowi w sposób zrozumiały.

## 11. Kroki implementacji

1.  **Konfiguracja projektu**:
    *   Dodanie biblioteki `ts-fsrs` do zależności projektu (`pnpm add ts-fsrs`).
2.  **Backend - Baza Danych**:
    *   Zdefiniowanie i utworzenie nowej tabeli `flashcard_srs_metadata` w Supabase.
    *   Zaktualizowanie typów Supabase (`database.types.ts`) po migracji.
3.  **Backend - API Endpoints**:
    *   Implementacja endpointu `GET /api/collections/[collectionName]/study`.
        *   Pobieranie fiszek z tabeli `flashcards`.
        *   LEFT JOIN z `flashcard_srs_metadata` dla każdej fiszki.
        *   Walidacja (użytkownik jest właścicielem, kolekcja istnieje).
    *   Implementacja endpointu `POST /api/flashcards/[flashcard_id]/review`.
        *   Walidacja inputu (rating).
        *   Pobranie istniejących metadanych FSRS dla fiszki (jeśli są).
        *   Utworzenie/aktualizacja obiektu `Card` z `ts-fsrs`.
        *   Obliczenie nowego stanu fiszki za pomocą `fsrs.repeat()` (lub `fsrs.next()` jeśli biblioteka to wspiera dla pojedynczej oceny).
        *   Zapisanie zaktualizowanych metadanych FSRS w `flashcard_srs_metadata`.
    *   Upewnienie się, że endpoint `GET /api/collections` istnieje i działa.
4.  **Frontend - Typy**:
    *   Zdefiniowanie typów `SpacedRepetitionCard`, `StudySessionState`, `StudySummaryData` w `src/types.ts` lub dedykowanym pliku dla widoku study.
5.  **Frontend - Routing**:
    *   Utworzenie pliku strony Astro `src/pages/study.astro`.
    *   Implementacja logiki odczytu parametru `collection` z URL.
6.  **Frontend - Komponent `CollectionSelector`**:
    *   Stworzenie komponentu React.
    *   Pobieranie listy kolekcji z `GET /api/collections`.
    *   Logika wyboru kolekcji i przekazania jej do komponentu nadrzędnego lub nawigacji.
7.  **Frontend - Komponent `FlashcardView`**:
    *   Stworzenie komponentu React.
    *   Logika wyświetlania przodu/tyłu fiszki i flipowania.
8.  **Frontend - Komponent `RatingControls`**:
    *   Stworzenie komponentu React.
    *   Przyciski dla ocen FSRS (Again, Hard, Good, Easy). Domyślnie te 4 oceny są standardem w FSRS.
    *   Przekazywanie wybranej oceny.
9.  **Frontend - Komponent `FlashcardPlayer` (Rdzeń logiki)**:
    *   Stworzenie komponentu React.
    *   Zarządzanie stanem `StudySessionState`.
    *   Funkcja inicjalizacji sesji:
        *   Pobieranie fiszek i ich metadanych FSRS z `GET /api/collections/[collectionName]/study`.
        *   Transformacja danych do `SpacedRepetitionCard[]`.
        *   Inicjalizacja instancji FSRS: `const f = fsrs(generatorParameters({ ... }))`.
        *   Przygotowanie kolejki `sessionQueue`: filtrowanie kart, które są `due` (na podstawie `card.due` i `now`). Sortowanie kart `due` (np. po `due` rosnąco lub losowo).
    *   Logika wyświetlania bieżącej fiszki z `sessionQueue`.
    *   Funkcja obsługi oceny (`handleRate`):
        *   Wysłanie oceny do `POST /api/flashcards/[flashcard_id]/review`.
        *   Aktualizacja lokalnego stanu fiszki na podstawie odpowiedzi API.
        *   Usunięcie ocenionej fiszki z `sessionQueue` lub oznaczenie jako przejrzanej.
        *   Przejście do następnej fiszki. Jeśli `sessionQueue` jest pusta, zakończ sesję.
        *   Logika zakończenia sesji i przygotowania `StudySummaryData`.
10. **Frontend - Komponent `Header`**:
    *   Stworzenie komponentu React.
    *   Wyświetlanie danych z `StudySessionState`.
    *   Obsługa przycisku "Zakończ sesję".
11. **Frontend - Komponent `StudySummary`**:
    *   Stworzenie komponentu React.
    *   Wyświetlanie danych `StudySummaryData`.
    *   Przyciski nawigacyjne.
12. **Frontend - Layout `StudySessionLayout` (Astro)**:
    *   Utworzenie pliku layoutu `src/layouts/StudySessionLayout.astro`.
    *   Integracja komponentów React (`Header`, `FlashcardPlayer`, `CollectionSelector`, `StudySummary`) z wykorzystaniem `client:load`, `client:visible` lub `client:only="react"` wedle potrzeb.
    *   Podstawowa struktura HTML i style.
13. **Styling**:
    *   Styling wszystkich komponentów przy użyciu Tailwind CSS i (jeśli potrzebne) komponentów Shadcn/ui.
14. **Nawigacja**:
    *   Implementacja przycisków "Study" w top barze i "Start Learning" na Dashboard oraz w widoku kolekcji, które będą kierować do `/study` (z parametrem kolekcji lub bez).
15. **Testowanie**:
    *   Testy manualne przepływu użytkownika.
    *   Testy jednostkowe dla logiki FSRS (jeśli implementowana w frontendzie) i kluczowych funkcji komponentów.
    *   Weryfikacja zapisu i odczytu metadanych FSRS w bazie.
16. **Dokumentacja**:
    *   Krótki opis działania widoku w README (jeśli dotyczy).
    *   Komentarze w kodzie dla złożonych fragmentów logiki.

Pamiętaj o przestrzeganiu zasad czystego kodu, obsługi błędów i responsywności interfejsu. 