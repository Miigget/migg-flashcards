# Architektura UI dla Migg Flashcards

## 1. Przegląd struktury UI

Aplikacja Migg Flashcards zostanie zbudowana jako nowoczesna aplikacja webowa wykorzystująca Astro 5, React 19, TypeScript 5, Tailwind 4 i komponenty shadcn/ui. Architektura interfejsu użytkownika składa się z następujących kluczowych elementów:

- **Układ główny**: Topbar z nawigacją główną, zawierający linki do głównych sekcji aplikacji.
- **System routingu**: Oparty na Astro z middleware chroniącym strony wymagające autoryzacji.
- **Główne widoki**: Dashboard, Kolekcje, Tworzenie fiszek, Generowanie AI, Nauka, Ustawienia i strony autoryzacji.
- **Organizacja komponentów**: Zgodna z podejściem atomic design (atomy, molekuły, organizmy, szablony, strony).
- **Wzorce projektowe**: Mobile First dla responsywności, Skeleton UI dla stanów ładowania, Toast dla powiadomień.

Aplikacja implementuje trzy kluczowe przepływy użytkownika:
1. Rejestracja i pierwsze kroki
2. Generowanie fiszek przez AI
3. Sesja nauki z algorytmem powtórek

## 2. Lista widoków

### 2.1. Strona Logowania (auth/login)
- **Ścieżka**: `/auth/login`
- **Główny cel**: Umożliwienie użytkownikowi zalogowania się do systemu
- **Kluczowe informacje**: 
  - Formularz logowania z polami email i hasło
  - Linki do rejestracji i resetowania hasła
  - Logo aplikacji
- **Kluczowe komponenty**: 
  - `LoginForm` z walidacją w czasie rzeczywistym
  - Przyciski "Zaloguj się" i "Zarejestruj się"
  - Link "Zapomniałem hasła"
- **UX, dostępność i bezpieczeństwo**: 
  - Responsywny formularz działający na wszystkich urządzeniach
  - Walidacja pól w czasie rzeczywistym
  - Komunikaty błędów widoczne pod każdym polem
  - Obsługa stanu ładowania podczas wysyłania formularza
  - Bezpieczna transmisja danych przez HTTPS

### 2.2. Strona Rejestracji (auth/register)
- **Ścieżka**: `/auth/register`
- **Główny cel**: Umożliwienie nowym użytkownikom utworzenia konta
- **Kluczowe informacje**: 
  - Formularz rejestracji z polami email, hasło, potwierdzenie hasła
  - Link do logowania
  - Logo aplikacji
- **Kluczowe komponenty**: 
  - `RegisterForm` z walidacją
  - Przycisk "Zarejestruj się"
  - Link "Powrót do logowania"
- **UX, dostępność i bezpieczeństwo**: 
  - Informacja o wymaganiach dotyczących hasła
  - Wyraźne komunikaty błędów
  - Potwierdzenie rejestracji z instrukcją weryfikacji email

### 2.3. Strona Resetowania Hasła (auth/reset-password)
- **Ścieżka**: `/auth/reset-password`
- **Główny cel**: Umożliwienie użytkownikom zresetowania zapomnianego hasła
- **Kluczowe informacje**: 
  - Formularz do podania emaila
  - Potwierdzenie wysłania linku resetującego
- **Kluczowe komponenty**: 
  - `ResetPasswordForm`
  - Przycisk "Wyślij link resetujący"
  - Link "Powrót do logowania"
- **UX, dostępność i bezpieczeństwo**:
  - Komunikat potwierdzający wysłanie emaila
  - Ochrona przed nadużyciami (rate limiting)

### 2.4. Dashboard / Strona główna
- **Ścieżka**: `/`
- **Główny cel**: Zaprezentowanie ogólnego przeglądu aktywności użytkownika
- **Kluczowe informacje**: 
  - Statystyki użytkownika (liczba kolekcji, fiszek, procent wygenerowanych przez AI)
  - Skróty do ostatnio używanych kolekcji (max 3)
  - Sekcja "Continue Learning" z ostatnio używanymi kolekcjami
- **Kluczowe komponenty**: 
  - `StatsCard` - karty ze statystykami
  - `CollectionCard` - karty kolekcji
  - `QuickCreateButton` - przycisk szybkiego tworzenia fiszek
  - `ContinueLearningSection` - sekcja kontynuacji nauki
- **UX, dostępność i bezpieczeństwo**:
  - Skeleton UI podczas ładowania danych
  - Komunikaty dla pustego stanu (brak kolekcji)
  - Responsywny układ dostosowany do różnych urządzeń

### 2.5. Lista kolekcji
- **Ścieżka**: `/collections`
- **Główny cel**: Prezentacja wszystkich kolekcji użytkownika
- **Kluczowe informacje**: 
  - Lista kolekcji w formie kart
  - Informacje o każdej kolekcji (nazwa, liczba fiszek, data modyfikacji)
  - Przyciski akcji dla każdej kolekcji
- **Kluczowe komponenty**: 
  - `CollectionsList` - lista kolekcji
  - `CollectionCard` - karta pojedynczej kolekcji
  - `CreateCollectionButton` - przycisk tworzenia nowej kolekcji
  - `Pagination` - paginacja dla większej liczby kolekcji
  - `SearchInput` - proste pole wyszukiwania
- **UX, dostępność i bezpieczeństwo**:
  - Filtry i sortowanie kolekcji
  - Potwierdzenia dla krytycznych akcji (usuwanie)
  - Wskaźniki ładowania przy akcjach asynchronicznych

### 2.6. Szczegóły kolekcji
- **Ścieżka**: `/collections/[collection_name]`
- **Główny cel**: Zarządzanie fiszkami w ramach kolekcji
- **Kluczowe informacje**: 
  - Edytowalny nagłówek z nazwą kolekcji
  - Tabela fiszek z przodu/tyłu i akcjami
  - Przyciski do dodawania nowych fiszek
- **Kluczowe komponenty**: 
  - `EditableCollectionHeader` - edytowalny nagłówek
  - `FlashcardsTable` - tabela fiszek
  - `AddFlashcardButton` - przycisk dodawania fiszek
  - `EditFlashcardModal` - modal edycji fiszki
  - `Pagination` - paginacja dla większej liczby fiszek
- **UX, dostępność i bezpieczeństwo**:
  - Obsługa inline-edycji nazwy kolekcji
  - Potwierdzenia usunięcia fiszek
  - Wyszukiwanie i filtrowanie fiszek

### 2.7. Ręczne tworzenie fiszek
- **Ścieżka**: `/create`
- **Główny cel**: Umożliwienie ręcznego tworzenia fiszek
- **Kluczowe informacje**: 
  - Formularz z polami na przód/tył fiszki
  - Liczniki znaków (max 200 dla przodu, 500 dla tyłu)
  - Wybór kolekcji
- **Kluczowe komponenty**: 
  - `FlashcardForm` - formularz tworzenia fiszki
  - `CharacterCounter` - licznik znaków
  - `CollectionSelector` - dropdown wyboru kolekcji
  - `ActionButtons` - przyciski akcji (Zapisz, Anuluj)
- **UX, dostępność i bezpieczeństwo**:
  - Walidacja w czasie rzeczywistym
  - Możliwość dodania wielu fiszek po kolei
  - Autosave dla zapobiegania utracie danych

### 2.8. Generowanie fiszek przez AI
- **Ścieżka**: `/generate`
- **Główny cel**: Generowanie fiszek przy pomocy AI na podstawie wprowadzonego tekstu
- **Kluczowe informacje**: 
  - Trzyetapowy proces:
    1. Wprowadzanie tekstu źródłowego (od 100 do 10000 znaków)
    2. Proces generowania (wskaźnik postępu)
    3. Przeglądanie wygenerowanych kandydatów (Accept/Edit/Discard)
  - Bulk zapis zaakceptowanych fiszek
- **Kluczowe komponenty**: 
  - `SourceTextInput` - pole na tekst źródłowy z licznikiem
  - `GenerationProgress` - wskaźnik postępu generowania
  - `CandidatesList` - lista kandydatów na fiszki
  - `CandidateCard` - karta pojedynczego kandydata
  - `EditCandidateModal` - modal edycji kandydata
  - `BulkSaveButton` - przycisk masowego zapisu
  - `CollectionSelector` - wybór kolekcji dla zapisywanych fiszek
- **UX, dostępność i bezpieczeństwo**:
  - Wskaźnik postępu dla długiego generowania
  - Możliwość anulowania generowania
  - Bulk zaznaczanie/odznaczanie kandydatów
  - Podział interfejsu na logiczne etapy procesu

### 2.9. Sesja nauki
- **Ścieżka**: `/study/[collection_name]`
- **Główny cel**: Nauka fiszek z wykorzystaniem algorytmu powtórek
- **Kluczowe informacje**: 
  - Aktualna fiszka (przód/tył)
  - Przyciski oceny znajomości materiału
  - Postęp sesji
  - Statystyki po zakończeniu
- **Kluczowe komponenty**: 
  - `FlashcardView` - karta fiszki z animacją odwracania
  - `RatingButtons` - przyciski oceny znajomości materiału
  - `SessionProgress` - pasek postępu sesji
  - `EndSessionButton` - przycisk zakończenia sesji
  - `SessionSummary` - podsumowanie sesji (po zakończeniu)
- **UX, dostępność i bezpieczeństwo**:
  - Możliwość korzystania z skrótów klawiaturowych
  - Animacje płynnego odwracania fiszek
  - Zachowanie stanu sesji w przypadku przerwania
  - Funkcja wstrzymania/wznowienia sesji

### 2.10. Ustawienia
- **Ścieżka**: `/settings`
- **Główny cel**: Zarządzanie kontem użytkownika
- **Kluczowe informacje**: 
  - Formularz zmiany hasła
  - Sekcja "Danger Zone" z opcją usunięcia konta
- **Kluczowe komponenty**: 
  - `ChangePasswordForm` - formularz zmiany hasła
  - `DangerZone` - sekcja krytycznych akcji
  - `DeleteAccountButton` - przycisk usuwania konta
  - `ConfirmationModal` - modal potwierdzenia akcji
- **UX, dostępność i bezpieczeństwo**:
  - Podwójne potwierdzenie dla krytycznych akcji
  - Informacje o konsekwencjach usunięcia konta
  - Walidacja siły nowego hasła

## 3. Mapa podróży użytkownika

### 3.1. Rejestracja i pierwsze kroki
1. Użytkownik wchodzi na stronę i jest przekierowywany do `/auth/login`
2. Klika link "Zarejestruj się", przechodzi do `/auth/register`
3. Wypełnia formularz rejestracji i zatwierdza
4. Po pomyślnej rejestracji jest przekierowany na `/` (Dashboard)
5. Z dashboardu może:
   - Utworzyć nową kolekcję (przycisk "New Collection")
   - Przejść do ręcznego tworzenia fiszek (przycisk "Create Manually")
   - Przejść do generowania fiszek przez AI (przycisk "Generate with AI")

### 3.2. Generowanie fiszek przez AI
1. Użytkownik klika "Create" w nawigacji głównej i wybiera "AI Generation"
2. Na stronie `/generate`:
   - Wkleja tekst źródłowy (od 100 do 10000 znaków)
   - Wybiera kolekcję docelową
   - Klika przycisk "Generate Flashcards"
3. Podczas generowania widzi wskaźnik postępu
4. Po wygenerowaniu przegląda kandydatów na fiszki:
   - Akceptuje przydatne fiszki (przycisk "Accept")
   - Edytuje fiszki wymagające poprawek (przycisk "Edit")
   - Odrzuca nieprzydatne fiszki (przycisk "Discard")
5. Po ocenie wszystkich kandydatów klika "Save Accepted Flashcards"
6. Fiszki są zapisywane do wybranej kolekcji
7. Użytkownik jest przekierowywany do widoku kolekcji (`/collections/[collection_name]`)

### 3.3. Sesja nauki
1. Użytkownik przechodzi do widoku kolekcji (`/collections`)
2. Wybiera kolekcję i klika przycisk "Study"
3. Na stronie `/study/[collection_name]`:
   - Widzi przód fiszki
   - Klika, aby zobaczyć tył fiszki
   - Ocenia swoją znajomość materiału (przyciski oceny)
4. System prezentuje kolejne fiszki według algorytmu powtórek
5. Po zakończeniu sesji lub kliknięciu "End Session":
   - Widzi podsumowanie z statystykami
   - Ma opcję powrotu do kolekcji lub rozpoczęcia nowej sesji

## 4. Układ i struktura nawigacji

### 4.1. Główna nawigacja (Topbar)
- **Home** - przekierowanie do Dashboard (`/`)
- **Collections** - przekierowanie do listy kolekcji (`/collections`)
- **Create** - menu rozwijane:
  - **Manual** - przekierowanie do ręcznego tworzenia (`/create`)
  - **AI Generation** - przekierowanie do generowania przez AI (`/generate`)
- **Study** - przekierowanie do wyboru kolekcji do nauki (`/collections`) z aktywnym filtrem "study mode"
- **Settings** - przekierowanie do ustawień konta (`/settings`)

### 4.2. Nawigacja kontekstowa
- **Na karcie kolekcji**:
  - Przycisk "Study" - rozpoczęcie sesji nauki
  - Przycisk "Edit" - przejście do szczegółów kolekcji
  - Przycisk "Delete" - usunięcie kolekcji (z potwierdzeniem)
- **Na stronie szczegółów kolekcji**:
  - Przycisk "Add Flashcard" - dodanie nowej fiszki
  - Przyciski "Edit"/"Delete" dla pojedynczych fiszek
  - Przycisk "Study Collection" - rozpoczęcie sesji nauki
- **Na stronie generowania przez AI**:
  - Przyciski nawigacji między krokami procesu
  - Przycisk "Back to Collections" - powrót do listy kolekcji

### 4.3. Nawigacja mobilna
- Na urządzeniach mobilnych topbar zamienia się w menu hamburger
- Po rozwinięciu wyświetla te same opcje co w wersji desktopowej
- Responsywne przyciski akcji dopasowane do ekranów dotykowych

## 5. Kluczowe komponenty

### 5.1. Komponenty UI (shadcn/ui)
- **Navigiation Menu** - główna nawigacja aplikacji
- **Card** - prezentacja kolekcji i fiszek
- **Form** - formularze z walidacją
- **Table** - prezentacja list fiszek
- **Toast** - powiadomienia
- **Skeleton** - stany ładowania
- **Pagination** - paginacja list
- **Dialog/Modal** - okna modalne (potwierdzenia, edycja)
- **Button** - przyciski akcji

### 5.2. Komponenty funkcjonalne
- **FlashcardCard** - wizualizacja pojedynczej fiszki z animacją odwracania
- **CollectionCard** - wizualizacja pojedynczej kolekcji
- **GenerationProgress** - wskaźnik postępu generowania AI
- **CharacterCounter** - licznik znaków dla pól tekstowych
- **SessionProgressBar** - pasek postępu sesji nauki
- **StatsDisplay** - wyświetlanie statystyk użytkownika
- **ErrorBoundary** - obsługa błędów w aplikacji
- **ConfirmationDialog** - dialogi potwierdzenia dla krytycznych akcji
- **ToastNotification** - powiadomienia o sukcesie/błędzie
- **LoadingIndicator** - wskaźniki ładowania

### 5.3. Layouty
- **MainLayout** - podstawowy layout z topbarem
- **AuthLayout** - layout dla stron autoryzacji
- **DashboardLayout** - layout z dodatkowymi informacjami na dashboardzie
- **StudyLayout** - minimalistyczny layout dla sesji nauki 