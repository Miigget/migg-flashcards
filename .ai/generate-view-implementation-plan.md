# Plan implementacji widoku Generowania Fiszek przez AI

## 1. Przegląd
Widok Generowania Fiszek przez AI umożliwia użytkownikom tworzenie fiszek na podstawie wprowadzonego tekstu źródłowego. Proces składa się z trzech głównych etapów: wprowadzania tekstu, generowania fiszek przez AI oraz przeglądania i zarządzania wygenerowanymi kandydatami na fiszki. Użytkownik ma możliwość akceptacji, edycji lub odrzucenia każdego kandydata, a następnie zbiorczego zapisu zaakceptowanych fiszek do wybranej kolekcji.

## 2. Routing widoku
- Ścieżka: `/generate`

## 3. Struktura komponentów
```
GeneratePage
├── GenerateSteps (nawigacja między krokami)
│   ├── Step 1: Source Text Input
│   ├── Step 2: Generation Progress
│   └── Step 3: Review Candidates
├── SourceTextInput (dla kroku 1)
│   ├── TextArea (z licznikiem znaków)
│   └── CollectionSelector
├── GenerationProgress (dla kroku 2)
│   └── ProgressBar
└── CandidatesList (dla kroku 3)
    ├── CandidateCard (wiele)
    │   ├── Front/Back Display
    │   └── Action Buttons (Accept/Edit/Discard)
    ├── EditCandidateModal
    └── BulkSaveButton
```

## 4. Szczegóły komponentów

### GeneratePage
- **Opis komponentu:** Główny kontener widoku zarządzający procesem generowania fiszek, przechowujący globalny stan i kontrolujący przejścia między krokami.
- **Główne elementy:** 
  - Nawigacja między krokami procesu
  - Kontener dla aktualnego kroku (SourceTextInput, GenerationProgress, CandidatesList)
- **Obsługiwane interakcje:** 
  - Zmiana aktualnego kroku procesu
  - Resetowanie procesu
  - Obsługa błędów API
- **Obsługiwana walidacja:** Deleguje walidację do podkomponentów
- **Typy:** GeneratePageState, AIGenerateFlashcardsResponse, BulkCreateFlashcardsCommand
- **Propsy:** Brak (komponent najwyższego poziomu)

### GenerateSteps
- **Opis komponentu:** Komponent nawigacyjny pokazujący aktualny krok procesu i umożliwiający przechodzenie między krokami.
- **Główne elementy:** 
  - Przyciski/zakładki kroków procesu
  - Wizualne oznaczenie aktualnego kroku
- **Obsługiwane interakcje:** Zmiana kroku (jeśli dozwolona)
- **Obsługiwana walidacja:** Blokada przejścia do następnego kroku bez spełnienia warunków
- **Typy:** StepType ('input' | 'generating' | 'review')
- **Propsy:** 
  - `currentStep: StepType`
  - `onStepChange: (step: StepType) => void`
  - `isStepEnabled: (step: StepType) => boolean`

### SourceTextInput
- **Opis komponentu:** Formularz umożliwiający wprowadzenie tekstu źródłowego i wybór kolekcji docelowej.
- **Główne elementy:** 
  - TextArea z licznikiem znaków
  - CollectionSelector (dropdown kolekcji)
  - Przycisk "Generate Flashcards"
- **Obsługiwane interakcje:** 
  - Wprowadzanie tekstu
  - Wybór kolekcji
  - Kliknięcie przycisku generowania
- **Obsługiwana walidacja:** 
  - Długość tekstu: minimum 100 znaków, maksimum 10000 znaków
  - Wymagane wybranie kolekcji
- **Typy:** AIGenerateFlashcardsCommand
- **Propsy:** 
  - `sourceText: string`
  - `onSourceTextChange: (text: string) => void`
  - `selectedCollection: string`
  - `onCollectionChange: (collection: string) => void`
  - `onGenerate: () => void`
  - `error: string | null`
  - `isValid: boolean`

### GenerationProgress
- **Opis komponentu:** Wizualizacja postępu generowania fiszek przez AI.
- **Główne elementy:** 
  - ProgressBar
  - Licznik wygenerowanych kandydatów
  - Przycisk anulowania generowania
- **Obsługiwane interakcje:** Anulowanie procesu generowania
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak specyficznych
- **Propsy:** 
  - `progress: number` (0-100)
  - `generatedCount: number`
  - `onCancel: () => void`

### CandidatesList
- **Opis komponentu:** Lista wygenerowanych kandydatów na fiszki z możliwością zarządzania statusem każdego z nich.
- **Główne elementy:** 
  - Nagłówek z licznikiem kandydatów (wszystkich/zaakceptowanych)
  - Lista kart kandydatów (CandidateCard)
  - BulkSaveButton
  - EditCandidateModal (wyświetlany kontekstowo)
- **Obsługiwane interakcje:** 
  - Filtrowanie listy (wszystkie/zaakceptowane/edytowane/odrzucone)
  - Zbiorczy zapis zaakceptowanych fiszek
- **Obsługiwana walidacja:** 
  - Sprawdzenie czy istnieje przynajmniej jedna zaakceptowana fiszka przed zapisem
- **Typy:** ReviewableCandidateViewModel[], BulkCreateFlashcardsCommand
- **Propsy:** 
  - `candidates: ReviewableCandidateViewModel[]`
  - `onCandidateStatusChange: (id: string, status: CandidateStatus, updatedData?: Partial<FlashcardCandidateDto>) => void`
  - `onBulkSave: () => void`
  - `selectedCollection: string`
  - `isLoading: boolean`

### CandidateCard
- **Opis komponentu:** Wizualizacja pojedynczego kandydata na fiszkę z przyciskami akcji.
- **Główne elementy:** 
  - Sekcja przodu fiszki
  - Sekcja tyłu fiszki
  - Przyciski akcji (Accept/Edit/Discard)
  - Wskaźnik statusu (zaakceptowana/edytowana/odrzucona)
- **Obsługiwane interakcje:** 
  - Akceptacja kandydata
  - Otwarcie modalu edycji
  - Odrzucenie kandydata
- **Obsługiwana walidacja:** Brak
- **Typy:** ReviewableCandidateViewModel, CandidateStatus
- **Propsy:** 
  - `candidate: ReviewableCandidateViewModel`
  - `onStatusChange: (id: string, status: CandidateStatus) => void`
  - `onEdit: (id: string) => void`
  - `isLoading: boolean`

### EditCandidateModal
- **Opis komponentu:** Modal umożliwiający edycję zawartości kandydata na fiszkę.
- **Główne elementy:** 
  - Formularz edycji z polami przód/tył
  - Liczniki znaków
  - Przyciski "Zapisz" i "Anuluj"
- **Obsługiwane interakcje:** 
  - Edycja tekstu przodu/tyłu
  - Zapisanie zmian
  - Anulowanie edycji
- **Obsługiwana walidacja:** 
  - Długość przodu: maksimum 200 znaków
  - Długość tyłu: maksimum 500 znaków
- **Typy:** FlashcardCandidateDto, EditCandidateFormData
- **Propsy:** 
  - `isOpen: boolean`
  - `onClose: () => void`
  - `candidate: FlashcardCandidateDto`
  - `onSave: (id: string, front: string, back: string) => void`

### BulkSaveButton
- **Opis komponentu:** Przycisk umożliwiający zbiorczy zapis zaakceptowanych fiszek.
- **Główne elementy:** 
  - Przycisk "Save Accepted Flashcards"
  - Licznik zaakceptowanych fiszek
- **Obsługiwane interakcje:** Kliknięcie przycisku zapisu
- **Obsługiwana walidacja:** Dezaktywacja przycisku gdy brak zaakceptowanych fiszek
- **Typy:** Brak specyficznych
- **Propsy:** 
  - `acceptedCount: number`
  - `onSave: () => void`
  - `isLoading: boolean`
  - `disabled: boolean`

### CollectionSelector
- **Opis komponentu:** Dropdown do wyboru kolekcji docelowej dla fiszek.
- **Główne elementy:** 
  - Dropdown z listą dostępnych kolekcji
  - Opcjonalnie: przycisk tworzenia nowej kolekcji
- **Obsługiwane interakcje:** 
  - Wybór kolekcji z listy
  - Opcjonalnie: tworzenie nowej kolekcji
- **Obsługiwana walidacja:** Brak
- **Typy:** string[]
- **Propsy:** 
  - `collections: string[]`
  - `selectedCollection: string`
  - `onCollectionChange: (collection: string) => void`

## 5. Typy

### Główne typy
```typescript
// Typy stanu widoku
type StepType = 'input' | 'generating' | 'review';
type CandidateStatus = 'pending' | 'accepted' | 'edited' | 'discarded';

// Stan głównego komponentu
interface GeneratePageState {
  step: StepType;
  sourceText: string;
  selectedCollection: string;
  isGenerating: boolean;
  generationProgress: number;
  candidates: ReviewableCandidateViewModel[];
  error: string | null;
}

// Rozszerzenie FlashcardCandidateDto o status
interface ReviewableCandidateViewModel extends FlashcardCandidateDto {
  status: CandidateStatus;
  originalFront?: string;
  originalBack?: string;
}

// Dane formularza edycji
interface EditCandidateFormData {
  front: string;
  back: string;
  frontError?: string;
  backError?: string;
}

// Odpowiedź z API
interface AIGenerateFlashcardsResponse {
  candidates: FlashcardCandidateDto[];
  generation_id: string;
  generated_count: number;
}
```

## 6. Zarządzanie stanem

Główny stan widoku będzie zarządzany w komponencie `GeneratePage` za pomocą useState i useContext dla głębszych zagnieżdżeń. Potrzebne będą następujące customowe hooki:

### useFlashcardGeneration
```typescript
const useFlashcardGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [candidates, setCandidates] = useState<FlashcardCandidateDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateFlashcards = async (text: string) => {
    // Implementacja generowania fiszek
  };

  return { generateFlashcards, isGenerating, progress, candidates, error };
};
```

### useCandidatesReview
```typescript
const useCandidatesReview = (initialCandidates: FlashcardCandidateDto[]) => {
  const [candidates, setCandidates] = useState<ReviewableCandidateViewModel[]>(
    initialCandidates.map(c => ({ ...c, status: 'pending' }))
  );

  // Metody zarządzania statusem kandidatów
  const acceptCandidate = (id: string) => { /* ... */ };
  const editCandidate = (id: string, front: string, back: string) => { /* ... */ };
  const discardCandidate = (id: string) => { /* ... */ };
  const getAcceptedCandidates = () => { /* ... */ };
  const bulkSaveAccepted = async (collection: string) => { /* ... */ };

  return {
    candidates,
    acceptCandidate,
    editCandidate,
    discardCandidate,
    getAcceptedCandidates,
    bulkSaveAccepted
  };
};
```

## 7. Integracja API

### Generowanie fiszek
```typescript
const generateFlashcards = async (text: string): Promise<AIGenerateFlashcardsResponse> => {
  const response = await fetch('/api/flashcards/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Błąd podczas generowania fiszek');
  }

  return await response.json();
};
```

### Zbiorczy zapis fiszek
```typescript
const bulkSaveFlashcards = async (
  flashcards: BulkCreateFlashcardsCommand
): Promise<any> => {
  const response = await fetch('/api/flashcards/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flashcards)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Błąd podczas zapisywania fiszek');
  }

  return await response.json();
};
```

## 8. Interakcje użytkownika

### Wprowadzanie tekstu źródłowego
1. Użytkownik wchodzi na stronę `/generate`
2. Wprowadza tekst źródłowy w pole tekstowe
3. System waliduje długość tekstu (100-10000 znaków)
4. Użytkownik wybiera kolekcję docelową z dropdown
5. Klika przycisk "Generate Flashcards"

### Proces generowania
1. System wyświetla wskaźnik postępu
2. Przez API wysyłane jest żądanie generowania fiszek
3. Użytkownik widzi aktualizowany pasek postępu
4. Może anulować generowanie w dowolnym momencie

### Przeglądanie i zarządzanie kandydatami
1. System wyświetla listę wygenerowanych kandydatów
2. Dla każdego kandydata użytkownik może:
   - Zaakceptować fiszkę (przycisk "Accept")
   - Edytować fiszkę (przycisk "Edit")
   - Odrzucić fiszkę (przycisk "Discard")
3. Przy edycji otwiera się modal z polami przód/tył
4. System waliduje długość pól (przód - max 200 znaków, tył - max 500 znaków)
5. Po zakończeniu przeglądania, użytkownik klika "Save Accepted Flashcards"
6. System zapisuje zaakceptowane fiszki i przekierowuje do widoku kolekcji

## 9. Warunki i walidacja

### Walidacja tekstu źródłowego
- **Warunek:** Tekst musi mieć od 100 do 10000 znaków
- **Komponent:** SourceTextInput
- **Wpływ na UI:** 
  - Wyświetlenie licznika znaków
  - Komunikat błędu przy niepoprawnej długości
  - Dezaktywacja przycisku "Generate Flashcards" gdy warunki nie są spełnione

### Walidacja edycji fiszki
- **Warunek:** Przód - max 200 znaków, tył - max 500 znaków
- **Komponent:** EditCandidateModal
- **Wpływ na UI:**
  - Wyświetlenie liczników znaków
  - Komunikaty błędów przy przekroczeniu limitów
  - Dezaktywacja przycisku zapisu gdy warunki nie są spełnione

### Walidacja zapisu fiszek
- **Warunek:** Musi być zaakceptowana przynajmniej jedna fiszka
- **Komponent:** BulkSaveButton
- **Wpływ na UI:**
  - Dezaktywacja przycisku "Save Accepted Flashcards" gdy brak zaakceptowanych fiszek
  - Wyświetlenie informacji o liczbie zaakceptowanych fiszek

## 10. Obsługa błędów

### Błędy wprowadzania tekstu
- **Scenariusz:** Tekst jest za krótki (<100 znaków) lub za długi (>10000 znaków)
- **Obsługa:** Wyświetlenie komunikatu błędu, dezaktywacja przycisku generowania

### Błędy generowania fiszek
- **Scenariusz:** Błąd API podczas generowania fiszek
- **Obsługa:** 
  - Wyświetlenie komunikatu błędu
  - Możliwość powrotu do kroku wprowadzania tekstu
  - Opcja ponownej próby generowania

### Błędy edycji fiszki
- **Scenariusz:** Przekroczenie limitu znaków
- **Obsługa:** Komunikat błędu, dezaktywacja przycisku zapisu

### Błędy zapisu fiszek
- **Scenariusz:** Błąd API podczas zbiorczego zapisu fiszek
- **Obsługa:**
  - Wyświetlenie komunikatu błędu
  - Opcja ponownej próby
  - Możliwość zmiany kolekcji docelowej
  - Zapisanie częściowych danych w sessionStorage dla odzyskania stanu

## 11. Kroki implementacji

1. **Przygotowanie struktury komponentów**
   - Utworzenie pliku strony `/src/pages/generate.astro` (lub odpowiedniej struktury dla Astro)
   - Zdefiniowanie głównych komponentów React (GeneratePage, SourceTextInput, CandidatesList, itd.)

2. **Implementacja typów i interfejsów**
   - Utworzenie pliku z definicjami typów dla lokalnych modeli widoku
   - Rozszerzenie istniejących typów o nowe interfejsy (ReviewableCandidateViewModel, EditCandidateFormData)

3. **Implementacja customowych hooków**
   - Implementacja useFlashcardGeneration do obsługi generowania fiszek
   - Implementacja useCandidatesReview do zarządzania recenzją kandydatów

4. **Implementacja komponentu SourceTextInput**
   - Utworzenie pola tekstowego z licznikiem znaków
   - Implementacja walidacji długości tekstu
   - Integracja z komponentem wyboru kolekcji

5. **Implementacja komponentu GenerationProgress**
   - Utworzenie wskaźnika postępu
   - Implementacja symulatora postępu (jeśli API nie dostarcza rzeczywistego postępu)

6. **Implementacja komponentu CandidatesList i CandidateCard**
   - Wyświetlanie listy wygenerowanych kandydatów
   - Implementacja przycisków akcji (Accept/Edit/Discard)
   - Wizualizacja statusu każdego kandydata

7. **Implementacja modalu edycji**
   - Utworzenie formularza edycji z walidacją
   - Implementacja akcji zapisania zmian i anulowania edycji

8. **Implementacja zapisu zbiorczego**
   - Utworzenie przycisku "Save Accepted Flashcards"
   - Implementacja logiki filtrowania zaakceptowanych fiszek
   - Integracja z API zbiorczego zapisu

9. **Implementacja nawigacji między krokami**
   - Utworzenie komponentu GenerateSteps
   - Implementacja przejść między krokami procesu

10. **Testowanie i debugowanie**
    - Testowanie walidacji danych wejściowych
    - Testowanie interakcji użytkownika
    - Testowanie integracji z API
    - Weryfikacja obsługi błędów

11. **Optymalizacja UX**
    - Dodanie komunikatów o statusie operacji
    - Implementacja animacji przejść między krokami
    - Dodanie wskazówek dla użytkownika

12. **Finalne testy i oddanie do produkcji**
    - Testy end-to-end całego przepływu
    - Weryfikacja zgodności z wymaganiami PRD i User Stories
    - Oddanie do produkcji 