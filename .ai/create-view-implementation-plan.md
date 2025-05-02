# Plan implementacji widoku Ręcznego Tworzenia Fiszki (`/create`)

## 1. Przegląd
Widok Ręcznego Tworzenia Fiszki umożliwia zalogowanym użytkownikom manualne dodawanie nowych fiszek do swoich kolekcji. Użytkownik wprowadza tekst dla przodu i tyłu fiszki, wybiera istniejącą kolekcję, do której fiszka ma należeć, a następnie zapisuje ją w systemie. Widok realizuje wymagania historyjki użytkownika US-002.

## 2. Routing widoku
Widok powinien być dostępny pod ścieżką `/create`. Dostęp do tej ścieżki powinien być chroniony i wymagać zalogowania użytkownika. Niezalogowani użytkownicy próbujący uzyskać dostęp powinni zostać przekierowani do strony logowania.

## 3. Struktura komponentów
Widok będzie zaimplementowany jako strona Astro (`/src/pages/create.astro`), która renderuje główny komponent formularza w React (`/src/components/CreateFlashcardForm.tsx`).

```
/src/pages/create.astro (Astro Page)
└── Standardowy Layout Aplikacji (Astro Layout)
    └── CreateFlashcardForm (React Component)
        ├── Form (Shadcn - opakowuje cały formularz, wykorzystuje react-hook-form)
        │   ├── FormField (Shadcn - dla pola "Przód")
        │   │   ├── FormLabel (Shadcn - etykieta "Przód")
        │   │   ├── FormControl (Shadcn)
        │   │   │   └── Input (Shadcn - pole tekstowe dla przodu fiszki)
        │   │   ├── CharacterCounter (Komponent pomocniczy React - licznik znaków dla "Przód")
        │   │   └── FormMessage (Shadcn - do wyświetlania błędów walidacji dla "Przód")
        │   ├── FormField (Shadcn - dla pola "Tył")
        │   │   ├── FormLabel (Shadcn - etykieta "Tył")
        │   │   ├── FormControl (Shadcn)
        │   │   │   └── Textarea (Shadcn - pole tekstowe dla tyłu fiszki)
        │   │   ├── CharacterCounter (Komponent pomocniczy React - licznik znaków dla "Tył")
        │   │   └── FormMessage (Shadcn - do wyświetlania błędów walidacji dla "Tył")
        │   ├── FormField (Shadcn - dla pola "Kolekcja")
        │   │   ├── FormLabel (Shadcn - etykieta "Kolekcja")
        │   │   ├── Select (Shadcn - komponent wyboru kolekcji)
        │   │   │   ├── SelectTrigger (Shadcn)
        │   │   │   │   └── SelectValue (Shadcn - placeholder "Wybierz kolekcję")
        │   │   │   └── SelectContent (Shadcn)
        │   │   │       └── SelectItem (Shadcn - opcje dla każdej istniejącej kolekcji)
        │   │   └── FormMessage (Shadcn - do wyświetlania błędów walidacji dla "Kolekcja")
        │   ├── Button (Shadcn - przycisk "Zapisz", typ submit)
        │   └── Button (Shadcn - przycisk "Anuluj", typ button, wariant "outline" lub "ghost")
        └── Toast (Shadcn - do wyświetlania powiadomień o sukcesie/błędzie)
```
*(Uwaga: `CharacterCounter` może być zintegrowany z logiką wewnątrz `CreateFlashcardForm` zamiast być oddzielnym komponentem, jeśli to upraszcza implementację).*

## 4. Szczegóły komponentów

### `CreateFlashcardPage` (`/src/pages/create.astro`)
- **Opis komponentu:** Strona Astro hostująca formularz React. Odpowiedzialna za podstawowy layout strony, ochronę trasy (przez middleware Astro lub logikę strony) i potencjalne pobranie początkowych danych (lista kolekcji) i przekazanie ich do komponentu React.
- **Główne elementy:** Wykorzystuje standardowy layout aplikacji. Renderuje komponent `<CreateFlashcardForm client:load />` przekazując mu listę kolekcji jako props.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji użytkownika na poziomie strony Astro; deleguje je do komponentu React.
- **Obsługiwana walidacja:** Brak walidacji na tym poziomie.
- **Typy:** `string[]` (lista nazw kolekcji).
- **Propsy:** Brak (pobiera dane i przekazuje je do dziecka).

### `CreateFlashcardForm` (`/src/components/CreateFlashcardForm.tsx`)
- **Opis komponentu:** Główny komponent React implementujący interfejs formularza. Wykorzystuje `react-hook-form` i Zod do zarządzania stanem formularza i walidacji. Odpowiedzialny za renderowanie pól input, selecta kolekcji, przycisków, obsługę wprowadzania danych, walidację w czasie rzeczywistym, komunikację z API (poprzez customowy hook) i wyświetlanie informacji zwrotnych (liczniki znaków, błędy, toasty).
- **Główne elementy:** Komponenty Shadcn: `Form`, `FormField`, `FormLabel`, `FormControl`, `FormMessage`, `Input`, `Textarea`, `Select`, `Button`, `toast`. Komponent `CharacterCounter` (lub logika).
- **Obsługiwane interakcje:**
    - Wprowadzanie tekstu w polach "Przód" i "Tył".
    - Wybór kolekcji z listy rozwijanej.
    - Kliknięcie przycisku "Zapisz" (submit formularza).
    - Kliknięcie przycisku "Anuluj".
- **Obsługiwana walidacja:** (Realizowana przez `react-hook-form` z Zod resolverem)
    - `front`: Wymagane (nie może być puste), Maksymalnie 200 znaków.
    - `back`: Wymagane (nie może być puste), Maksymalnie 500 znaków.
    - `collection`: Wymagane (musi być wybrana jedna z opcji).
    - Wyświetlanie komunikatów błędów przy polach (`FormMessage`).
    - Wyłączenie przycisku "Zapisz", gdy formularz jest niepoprawny lub trwa wysyłanie.
- **Typy:** `CreateFlashcardFormData` (dla stanu formularza), `CreateFlashcardFormSchema` (Zod schema dla walidacji), `CreateFlashcardCommand` (dla payloadu API), `ApiError` (dla błędów API), `string[]` (dla listy kolekcji).
- **Propsy:**
    - `collections: string[]`: Tablica z nazwami istniejących kolekcji użytkownika.
    - `initialData?: Partial<CreateFlashcardFormData>`: Opcjonalne dane początkowe (np. jeśli widok będzie rozszerzony o edycję).

### `CharacterCounter` (Logika w `CreateFlashcardForm` lub `/src/components/ui/CharacterCounter.tsx`)
- **Opis komponentu:** Wyświetla licznik znaków w formacie `aktualna_liczba / limit`. Zmienia kolor (np. na czerwony) po przekroczeniu limitu.
- **Główne elementy:** Element `<span>` lub `<p>`.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Wizualna (zmiana koloru).
- **Typy:** `number` (current), `number` (max).
- **Propsy:** `currentLength: number`, `maxLength: number`.

## 5. Typy
- **`CreateFlashcardCommand` (z `src/types.ts`):** Typ danych wysyłanych do API `POST /api/flashcards`.
  ```typescript
  type CreateFlashcardCommand = {
    front: string; // 1-200 znaków
    back: string;  // 1-500 znaków
    collection: string; // Niepusta nazwa kolekcji
    source: "manual";
  };
  ```
- **`FlashcardDTO` (z `src/types.ts`):** Typ danych otrzymywanych z API po pomyślnym utworzeniu fiszki.
- **`ApiError` (z `src/types.ts`):** Standardowy typ do obsługi błędów API.
- **`CreateFlashcardFormData` (Nowy, do zdefiniowania w `CreateFlashcardForm.tsx` lub wspólnym pliku typów):** Typ reprezentujący stan pól formularza w komponencie React.
  ```typescript
  interface CreateFlashcardFormData {
    front: string;
    back: string;
    collection: string; // Pusty string oznacza brak wyboru
  }
  ```
- **`CreateFlashcardFormSchema` (Nowy, Zod schema w `CreateFlashcardForm.tsx`):** Schemat Zod używany przez `react-hook-form` do walidacji `CreateFlashcardFormData`.
  ```typescript
  import { z } from "zod";

  const CreateFlashcardFormSchema = z.object({
    front: z
      .string()
      .min(1, "Pole 'Przód' jest wymagane.")
      .max(200, "Pole 'Przód' może mieć maksymalnie 200 znaków."),
    back: z
      .string()
      .min(1, "Pole 'Tył' jest wymagane.")
      .max(500, "Pole 'Tył' może mieć maksymalnie 500 znaków."),
    collection: z.string().min(1, "Musisz wybrać kolekcję."),
  });
  ```

## 6. Zarządzanie stanem
- Stan formularza (`front`, `back`, `collection`) oraz stan walidacji będą zarządzane przez bibliotekę `react-hook-form` z użyciem resolvera Zod (`@hookform/resolvers/zod`) i schemy `CreateFlashcardFormSchema`.
- Stan ładowania listy kolekcji (`isLoadingCollections`) i stan wysyłania formularza (`isSubmitting`) będą zarządzane za pomocą `useState` w komponencie `CreateFlashcardForm` lub w dedykowanych hookach.
- Lista kolekcji (`collections`) będzie przechowywana w stanie `useState` komponentu `CreateFlashcardForm` (otrzymana przez propsy z Astro lub pobrana przez hook).
- Stan błędów API (`error`) będzie zarządzany przez `useState` w komponencie lub hooku API.
- **Rekomendacja:** Utworzenie dwóch customowych hooków:
    - `useCollections()`: Do pobierania listy kolekcji (`GET /api/collections`). Zwraca `{ collections: string[], isLoading: boolean, error: ApiError | null }`.
    - `useCreateFlashcard()`: Do obsługi wysyłania formularza (`POST /api/flashcards`). Przyjmuje funkcję `onSuccess` do obsługi przekierowania. Zwraca `{ createFlashcard: (data: CreateFlashcardCommand) => Promise<void>, isSubmitting: boolean, error: ApiError | null }`.

## 7. Integracja API
- **Pobieranie kolekcji:**
    - Przed renderowaniem formularza (w Astro lub na początku w React) zostanie wywołany endpoint `GET /api/collections` (bez parametrów).
    - Hook `useCollections` obsłuży to wywołanie.
    - Odpowiedź (tablica stringów `string[]` z nazwami kolekcji) zostanie użyta do wypełnienia komponentu `Select`.
- **Tworzenie fiszki:**
    - Po pomyślnej walidacji i kliknięciu "Zapisz", zostanie wywołany hook `useCreateFlashcard`.
    - Hook wyśle żądanie `POST /api/flashcards` z payloadem typu `CreateFlashcardCommand`, konstruowanym na podstawie danych z formularza (`react-hook-form`'s `getValues()` lub `handleSubmit` data) i dodaniu `source: "manual"`.
    - **Typ żądania:** `CreateFlashcardCommand`
    - **Typ odpowiedzi (sukces):** `FlashcardDTO` (status 201)
    - **Typ odpowiedzi (błąd):** `ApiError` (status 400, 401, 500)
    - Po sukcesie (status 201), hook wywoła callback `onSuccess`, który wyświetli toast sukcesu i przekieruje użytkownika do widoku szczegółów kolekcji (`/collections/[nazwa_kolekcji]`). Nazwa kolekcji pochodzi z odpowiedzi API (`FlashcardDTO.collection`).
    - W przypadku błędu, hook zaktualizuje stan `error`, co spowoduje wyświetlenie odpowiedniego komunikatu/toastu.

## 8. Interakcje użytkownika
- **Wpisywanie tekstu:** Aktualizuje stan formularza (`react-hook-form`), uruchamia walidację i aktualizuje liczniki znaków w czasie rzeczywistym.
- **Wybór kolekcji:** Aktualizuje stan formularza i uruchamia walidację pola `collection`.
- **Kliknięcie "Zapisz":**
    - Jeśli formularz jest poprawny: Uruchamia proces wysyłania (ustawia `isSubmitting=true`), wywołuje API `POST /api/flashcards`. Po sukcesie resetuje formularz, wyświetla toast sukcesu i przekierowuje. Po błędzie wyświetla toast błędu. Ustawia `isSubmitting=false` po zakończeniu.
    - Jeśli formularz jest niepoprawny: Wyświetla błędy walidacji przy odpowiednich polach. Przycisk może być nieaktywny.
- **Kliknięcie "Anuluj":** Przekierowuje użytkownika z powrotem (np. używając `window.history.back()` lub do ustalonej ścieżki jak `/collections` czy `/dashboard`).

## 9. Warunki i walidacja
- **Pola wymagane:** `front`, `back`, `collection` nie mogą być puste. Walidacja `react-hook-form`/Zod. Wpływ: Wyświetlenie błędu przy polu, blokada wysłania formularza.
- **Limit znaków `front` (<= 200):** Walidacja `react-hook-form`/Zod. Wpływ: Wyświetlenie błędu, blokada wysłania, wizualna zmiana licznika znaków.
- **Limit znaków `back` (<= 500):** Walidacja `react-hook-form`/Zod. Wpływ: Wyświetlenie błędu, blokada wysłania, wizualna zmiana licznika znaków.
- **Wysyłanie formularza:** Przycisk "Zapisz" jest nieaktywny (`disabled`), gdy `isSubmitting` jest `true` lub gdy formularz jest niepoprawny (`!formState.isValid`).

## 10. Obsługa błędów
- **Błędy walidacji klienta:** Obsługiwane przez `react-hook-form` i Zod. Komunikaty wyświetlane przy polach za pomocą `FormMessage` z Shadcn.
- **Błąd pobierania kolekcji (API `GET /api/collections`):** Wyświetlić komunikat błędu w miejscu selecta lub jako toast. Zablokować możliwość wysłania formularza, jeśli wybór kolekcji jest wymagany.
- **Błąd API przy zapisie (`POST /api/flashcards`):**
    - **400 Bad Request (Błąd walidacji serwera):** Wyświetlić błąd jako ogólny toast lub spróbować zmapować błędy na pola formularza, jeśli API dostarcza szczegółów.
    - **401 Unauthorized:** Wyświetlić toast informujący o konieczności zalogowania i potencjalnie przekierować na stronę logowania.
    - **500 Internal Server Error:** Wyświetlić generyczny toast błędu ("Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.").
- **Błędy sieciowe:** Obsłużyć za pomocą bloku `try...catch` wokół wywołań `fetch` (lub w logice hooka API) i wyświetlić odpowiedni toast.

## 11. Kroki implementacji
1.  **Utworzenie strony Astro:** Stworzyć plik `/src/pages/create.astro`. Dodać podstawowy layout i zabezpieczenie trasy (np. przez sprawdzenie `Astro.locals.user` i przekierowanie, jeśli brak).
2.  **Pobranie kolekcji w Astro:** Zaimplementować logikę pobierania listy kolekcji po stronie serwera w `create.astro` (używając `Astro.locals.supabase`) i przekazać ją jako props do komponentu React.
3.  **Utworzenie komponentu React:** Stworzyć plik `/src/components/CreateFlashcardForm.tsx`.
4.  **Implementacja struktury formularza:** Dodać komponenty Shadcn (`Form`, `FormField`, `Input`, `Textarea`, `Select`, `Button`) zgodnie ze strukturą opisaną w punkcie 3.
5.  **Zarządzanie stanem i walidacja:** Zintegrować `react-hook-form` z resolverem Zod. Zdefiniować schemat walidacji `CreateFlashcardFormSchema`. Podłączyć pola formularza do `react-hook-form`.
6.  **Implementacja logiki pomocniczej:** Dodać liczniki znaków (`CharacterCounter`) i logikę ich aktualizacji. Wypełnić `Select` opcjami kolekcji otrzymanymi z propsów.
7.  **Implementacja hooków API (opcjonalnie, ale zalecane):** Stworzyć hooki `useCollections` (jeśli dane nie są pobierane w Astro) i `useCreateFlashcard` do enkapsulacji logiki API.
8.  **Obsługa wysyłania formularza:** Zaimplementować funkcję `onSubmit` przekazywaną do `handleSubmit` z `react-hook-form`. Wewnątrz wywołać `createFlashcard` z hooka API, przekazując zwalidowane dane i `source: "manual"`.
9.  **Obsługa przycisku "Anuluj":** Dodać logikę nawigacji (np. `window.history.back()`).
10. **Obsługa odpowiedzi API:** W hooku `useCreateFlashcard` (lub w `onSubmit`) obsłużyć sukces (toast, reset formularza, przekierowanie) i błędy (toast).
11. **Styling i UX:** Dopracować wygląd za pomocą Tailwind/Shadcn. Zapewnić wyraźne stany ładowania (np. na przycisku "Zapisz") i komunikaty zwrotne.
12. **Testowanie:** Przetestować ręcznie różne scenariusze: pomyślne tworzenie, błędy walidacji, błędy API (400, 401, 500), działanie liczników, przekierowania. 