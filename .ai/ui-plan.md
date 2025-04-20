# Architektura UI dla Migg Flashcards

## 1. Przegląd struktury UI

Struktura interfejsu użytkownika Migg Flashcards składa się z dwóch głównych sekcji: Auth (uwierzytelnianie) i App (główna funkcjonalność). Aplikacja wykorzystuje topbar na desktopach i menu hamburgerowe na urządzeniach mobilnych, zaimplementowane z użyciem Navigation Menu z biblioteki shadcn/ui. 

Nawigacja jest intuicyjna, z czytelną hierarchią widoków zgodną z głównymi przepływami użytkownika. Interfejs jest responsywny, z podejściem Mobile First i układami jednokolumnowymi rozszerzającymi się na wielokolumnowe na większych ekranach. Komunikacja z użytkownikiem odbywa się poprzez system powiadomień (Toast), wskaźniki ładowania (Skeleton) i modalne potwierdzenia dla krytycznych operacji.

## 2. Lista widoków

### Sekcja Auth:

#### Login
- **Ścieżka**: `/auth/login`
- **Główny cel**: Umożliwienie użytkownikowi zalogowania się do systemu
- **Kluczowe informacje**: Formularz logowania
- **Kluczowe komponenty**: Formularz (e-mail, password), przyciski (Log in, Register, Forgot Password)
- **UX, dostępność, bezpieczeństwo**: Walidacja danych wejściowych, komunikaty błędów, bezpieczne przechowywanie tokenów JWT

#### Register
- **Ścieżka**: `/auth/register`
- **Główny cel**: Umożliwienie utworzenia nowego konta
- **Kluczowe informacje**: Formularz rejestracji
- **Kluczowe komponenty**: Formularz (e-mail, password, confirm password), przyciski (Register, Already Registered(Log in))
- **UX, dostępność, bezpieczeństwo**: Walidacja danych wejściowych, wskaźniki siły hasła, komunikaty błędów

#### ForgotPassword
- **Ścieżka**: `/auth/forgot-password`
- **Główny cel**: Umożliwienie odzyskania hasła
- **Kluczowe informacje**: Formularz odzyskiwania hasła
- **Kluczowe komponenty**: Formularz (e-mail), przycisk (Send link to reset password), informacja o wysłaniu linku
- **UX, dostępność, bezpieczeństwo**: Komunikaty o wysłaniu linku bez ujawniania istnienia konta

#### ResetPassword
- **Ścieżka**: `/auth/reset-password`
- **Główny cel**: Zmiana hasła po otrzymaniu linku resetującego
- **Kluczowe informacje**: Formularz zmiany hasła
- **Kluczowe komponenty**: Formularz (new password, confirm password), przycisk (Change Password)
- **UX, dostępność, bezpieczeństwo**: Walidacja hasła, wskaźniki siły hasła, ochrona przed nieautoryzowanym dostępem

#### VerifyEmail
- **Ścieżka**: `/auth/verify-email`
- **Główny cel**: Potwierdzenie adresu email użytkownika
- **Kluczowe informacje**: Status weryfikacji
- **Kluczowe komponenty**: Informacja o statusie, przycisk (Log in)
- **UX, dostępność, bezpieczeństwo**: Jasny komunikat o wyniku weryfikacji

### Sekcja App:

#### Dashboard
- **Ścieżka**: `/dashboard`
- **Główny cel**: Przegląd aktywności i szybki dostęp do głównych funkcji
- **Kluczowe informacje**: Statystyki, ostatnia aktywność, szybki dostęp
- **Kluczowe komponenty**: Statystyki (liczba kolekcji, fiszek), przyciski szybkiego dostępu, lista ostatnio używanych kolekcji
- **UX, dostępność, bezpieczeństwo**: Intuicyjny układ, szybki dostęp do najczęściej używanych funkcji

#### Collections
- **Ścieżka**: `/collections`
- **Główny cel**: Przeglądanie i zarządzanie kolekcjami fiszek
- **Kluczowe informacje**: Lista kolekcji
- **Kluczowe komponenty**: Lista kolekcji (karty z nazwą, liczbą fiszek, przyciskami akcji)
- **UX, dostępność, bezpieczeństwo**: Potwierdzenia dla operacji usuwania, intuicyjne karty kolekcji

#### CollectionDetail
- **Ścieżka**: `/collections/[name]`
- **Główny cel**: Przeglądanie i zarządzanie fiszkami w konkretnej kolekcji
- **Kluczowe informacje**: Nazwa kolekcji, lista fiszek
- **Kluczowe komponenty**: Nagłówek z nazwą kolekcji, przyciski akcji (Rozpocznij naukę, Edytuj nazwę, Usuń), lista fiszek (karty z przód/tył, przyciskami edycji/usunięcia), przyciski (Add Flashcard, Generate Flashcards with AI)
- **UX, dostępność, bezpieczeństwo**: Potwierdzenia dla operacji usuwania, paginacja dla dużych kolekcji

#### CreateFlashcard
- **Ścieżka**: `/create`
- **Główny cel**: Ręczne tworzenie nowych fiszek
- **Kluczowe informacje**: Formularz tworzenia fiszki
- **Kluczowe komponenty**: Formularz (przód z limitem 200 znaków, tył z limitem 500 znaków, liczniki znaków), wybór kolekcji, przyciski (Save, Cancel)
- **UX, dostępność, bezpieczeństwo**: Walidacja w czasie rzeczywistym, liczniki znaków, komunikaty błędów

#### GenerateFlashcards
- **Ścieżka**: `/generate`
- **Główny cel**: Generowanie fiszek przy pomocy AI
- **Kluczowe informacje**: Trzyetapowy proces (wprowadzanie tekstu, recenzja kandydatów, zapis)
- **Kluczowe komponenty**:
  - Stepper (wskaźnik postępu)
  - Krok 1: Textarea (100-10000 znaków), licznik znaków, przycisk (Generate)
  - Krok 2: Lista kandydatów na fiszki (karty z front/back, przyciskami Accept/Edit/Discard), formularz edycji, przycisk (Accept All)
  - Krok 3: Lista zaakceptowanych fiszek, wybór kolekcji jeśli istnieje lub opcja podania nazwy nowej kolekcji, przycisk (Save)
- **UX, dostępność, bezpieczeństwo**: Walidacja tekstu wejściowego, mechanizm Retry dla operacji AI, informacje o postępie

#### StudySession
- **Ścieżka**: `/study/[collection_name]`
- **Główny cel**: Nauka z wykorzystaniem algorytmu powtórek
- **Kluczowe informacje**: Aktualna fiszka, postęp sesji
- **Kluczowe komponenty**: Karta fiszki (z animacją odwracania), przyciski oceny znajomości, licznik fiszek, przycisk (End Session), ekran podsumowania
- **UX, dostępność, bezpieczeństwo**: Minimalistyczny interfejs koncentrujący się na nauce, automatyczny zapis postępu

#### Settings
- **Ścieżka**: `/settings`
- **Główny cel**: Zarządzanie ustawieniami konta
- **Kluczowe informacje**: Ustawienia profilu, hasło, usuwanie konta
- **Kluczowe komponenty**: Zakładki (Profile, Change Password, Delete Account), odpowiednie formularze, potwierdzenia dla krytycznych operacji
- **UX, dostępność, bezpieczeństwo**: Potwierdzenia dla krytycznych operacji, walidacja formularzy

## 3. Mapa podróży użytkownika

### Rejestracja i logowanie
1. Użytkownik wchodzi na stronę główną
2. Wybiera opcję "Regiser"
3. Wypełnia formularz rejestracyjny
4. Otrzymuje email z linkiem do weryfikacji
5. Po weryfikacji loguje się i jest przekierowany do Dashboard

### Ręczne tworzenie fiszek
1. Z Dashboard lub widoku kolekcji użytkownik wybiera "Create Flashcard"
2. Wypełnia formularz (front/back) i wybiera istniejącą kolekcję lub podaje nazwę nowej kolekcji
3. Po zapisaniu wraca do szczegółów kolekcji z dodaną fiszką

### Generowanie fiszek przez AI
1. Z Dashboard lub widoku kolekcji użytkownik wybiera "Generate Flashcards with AI"
2. W kroku 1 wprowadza tekst źródłowy (100-10000 znaków)
3. W kroku 2 przegląda kandydatów na fiszki i podejmuje decyzje (Accept/Edit/Discard)
4. W kroku 3 wybiera istniejącą kolekcję lub podaje nazwę nowej kolekcji i zapisuje je
5. Po zapisaniu wraca do szczegółów kolekcji z dodanymi fiszkami

### Zarządzanie kolekcjami
1. Z Dashboard użytkownik przechodzi do sekcji "My Collections"
2. Wybiera istniejącą
3. W widoku szczegółów kolekcji może edytować nazwę lub usunąć kolekcję(usunięcie kolekcji powoduje usunięcie wszystkich fiszek tej kolekcji)
4. Może przeglądać, edytować lub usuwać fiszki w kolekcji

### Nauka z wykorzystaniem fiszek
1. Z Dashboard lub widoku kolekcji użytkownik wybiera "Study"
2. W sesji nauki przegląda fiszki, ocenia swoją znajomość materiału
3. Po zakończeniu sesji widzi podsumowanie i wraca do widoku kolekcji

### Zarządzanie kontem
1. Użytkownik przechodzi do sekcji "Settings"
2. Może przeglądać swój profil, zmienić hasło lub usunąć konto
3. Krytyczne operacje wymagają potwierdzenia

## 4. Układ i struktura nawigacji

### Główna nawigacja
- **Topbar** (desktop) / **Menu hamburgerowe** (mobile) zawierające:
  - Logo/Nazwa aplikacji (link do Dashboard)
  - Dashboard
  - My Collections
  - Generate Flashcards with AI
  - Create Flashcard
  - Settings
  - Log out

### Routing i struktura hierarchiczna
- **/** - Landing page lub przekierowanie do Dashboard dla zalogowanych
- **/auth/*** - Ekrany uwierzytelniania (niezabezpieczone trasami)
- **/dashboard** - Strona główna po zalogowaniu
- **/collections** - Lista kolekcji
- **/collections/[name]** - Szczegóły kolekcji
- **/create** - Tworzenie ręczne fiszek
- **/generate** - Generowanie fiszek przez AI
- **/study/[collection_name]** - Sesja nauki
- **/settings** - Ustawienia konta

Wszystkie trasy poza /auth/* są zabezpieczone middleware autoryzacyjnym, które przekierowuje niezalogowanych użytkowników do ekranu logowania.

### Nawigacja kontekstowa
- W widoku szczegółów kolekcji: przyciski do rozpoczęcia nauki, dodawania fiszek
- W widoku generowania fiszek: stepper pokazujący aktualny krok procesu
- W sesji nauki: minimalistyczny interfejs z opcją powrotu do kolekcji

## 5. Kluczowe komponenty

### Komponenty współdzielone

#### Navbar
- **Opis**: Główny pasek nawigacyjny, pokazujący się jako topbar na desktopach i menu hamburgerowe na urządzeniach mobilnych
- **Zawartość**: Logo, linki nawigacyjne, przycisk wylogowania
- **Użycie**: We wszystkich widokach App (poza sesją nauki)

#### FlashcardItem
- **Opis**: Komponent reprezentujący pojedynczą fiszkę
- **Zawartość**: Przód, tył, przyciski akcji (edytuj, usuń)
- **Użycie**: W widokach CollectionDetail, GenerateFlashcards

#### CollectionItem
- **Opis**: Komponent reprezentujący kolekcję na liście
- **Zawartość**: Nazwa, liczba fiszek, przyciski akcji (przeglądaj, rozpocznij naukę, edytuj, usuń)
- **Użycie**: W widokach Dashboard, Collections

#### FormField
- **Opis**: Opakowanie dla pól formularza z walidacją
- **Zawartość**: Etykieta, pole wejściowe, komunikaty błędów, licznik znaków (opcjonalnie)
- **Użycie**: We wszystkich formularzach

#### ErrorDisplay
- **Opis**: Komponent do wyświetlania błędów API
- **Zawartość**: Komunikat błędu, przycisk ponowienia próby (opcjonalnie)
- **Użycie**: W miejscach interakcji z API

#### LoadingState
- **Opis**: Prezentacja stanu ładowania
- **Zawartość**: Skeleton lub spinner, tekst informacyjny
- **Użycie**: W miejscach ładowania danych

#### ConfirmationModal
- **Opis**: Modal do potwierdzania krytycznych operacji
- **Zawartość**: Pytanie potwierdzające, przyciski (Potwierdź, Anuluj)
- **Użycie**: Przed usunięciem kolekcji, fiszek, konta

#### FlashcardForm
- **Opis**: Formularz do tworzenia/edycji fiszki
- **Zawartość**: Pola na przód i tył fiszki z licznikami znaków, przyciski akcji
- **Użycie**: W widokach CreateFlashcard, GenerateFlashcards (krok 2)

#### FlashcardCard
- **Opis**: Karta do wyświetlania i interakcji z fiszką w sesji nauki
- **Zawartość**: Przód/tył fiszki, animacja odwracania
- **Użycie**: W widoku StudySession

#### CollectionSelector
- **Opis**: Komponent do wyboru kolekcji
- **Zawartość**: Select z listą istniejących kolekcji, opcja "New Collection"
- **Użycie**: W widokach CreateFlashcard, GenerateFlashcards (krok 3)

#### Stepper
- **Opis**: Wskaźnik postępu procesu wieloetapowego
- **Zawartość**: Wizualizacja kroków, aktualny krok
- **Użycie**: W widoku GenerateFlashcards 