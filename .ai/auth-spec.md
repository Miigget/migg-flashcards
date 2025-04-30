# Specyfikacja Techniczna Modułu Autentykacji - Migg Flashcards

## 1. Przegląd

Niniejszy dokument opisuje architekturę i implementację modułu uwierzytelniania i autoryzacji dla aplikacji Migg Flashcards, zgodnie z wymaganiami US-001 i US-010 z dokumentu PRD oraz na podstawie zdefiniowanego stosu technologicznego i planu UI. Moduł wykorzysta Supabase Auth jako Backend-as-a-Service (BaaS) zintegrowany z Astro i React.

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Strony (Astro Pages - `src/pages/auth/`)

Zostaną utworzone następujące strony w katalogu `src/pages/auth/`, każda wykorzystująca dedykowany `AuthLayout`:

-   **`login.astro` (`/auth/login`)**:
    -   Wyświetla komponent `LoginForm` (React).
    -   Odpowiada za renderowanie strony logowania.
-   **`register.astro` (`/auth/register`)**:
    -   Wyświetla komponent `RegisterForm` (React).
    -   Odpowiada za renderowanie strony rejestracji.
    -   Może wyświetlać komunikat informujący o konieczności weryfikacji emaila po udanej rejestracji.
-   **`forgot-password.astro` (`/auth/forgot-password`)**:
    -   Wyświetla komponent `ForgotPasswordForm` (React).
    -   Odpowiada za renderowanie strony do zainicjowania procesu resetowania hasła.
-   **`reset-password.astro` (`/auth/reset-password`)**:
    -   Wyświetla komponent `ResetPasswordForm` (React).
    -   Odpowiada za renderowanie strony do ustawienia nowego hasła. Strona ta będzie dostępna tylko poprzez specjalny link wysłany emailem przez Supabase. Supabase Auth obsłuży walidację tokenu z linku.
-   **`verify-email.astro` (`/auth/verify-email`)**:
    -   Strona informacyjna potwierdzająca weryfikację adresu email.
    -   Może być stroną docelową po kliknięciu linku weryfikacyjnego (konfiguracja w Supabase).
    -   Wyświetla komunikat o sukcesie i przycisk przekierowujący do logowania (`/auth/login`) lub dashboardu (`/dashboard`), jeśli użytkownik jest już zalogowany.

### 2.2. Layouty (Astro Layouts - `src/layouts/`)

-   **`AuthLayout.astro`**:
    -   Layout dedykowany dla stron w sekcji `/auth/`.
    -   Zawiera podstawową strukturę HTML, stylowanie Tailwind, ale *bez* nawigacji aplikacji (Navbar). Może zawierać logo aplikacji.
    -   Centruje zawartość (komponenty formularzy React) na stronie.
    -   Renderuje `<slot />` dla treści strony (np. formularza).
-   **`BaseLayout.astro` / `AppLayout.astro` (do weryfikacji/aktualizacji)**:
    -   Główny layout aplikacji używany dla zalogowanych użytkowników.
    -   Musi zostać dostosowany, aby warunkowo renderować `Navbar` i zawartość strony tylko dla uwierzytelnionych użytkowników. Dostęp do stanu uwierzytelnienia będzie realizowany poprzez Astro Middleware i `Astro.locals`.
    -   Niezalogowani użytkownicy próbujący uzyskać dostęp do chronionych stron zostaną przekierowani do `/auth/login` przez middleware.

### 2.3. Komponenty (React Components - `src/components/auth/`)

Zostaną utworzone dedykowane komponenty React dla formularzy, wykorzystujące komponenty UI z `shadcn/ui` oraz bibliotekę do zarządzania stanem formularzy (np. `react-hook-form`) i walidacji (np. `zod`). Komponenty te **nie będą** bezpośrednio wywoływać Supabase SDK, lecz będą wysyłać żądania `fetch` do odpowiednich endpointów API Astro (`/api/auth/*`).

-   **`LoginForm.tsx`**:
    -   Zawiera pola: Email, Password.
    -   Przyciski: "Log in", link do `/auth/register`, link do `/auth/forgot-password`.
    -   Logika:
        -   Walidacja po stronie klienta (format email, wymagane hasło).
        -   Wywołanie `fetch` z metodą `POST` do endpointu `/api/auth/login` przy submicie, przesyłając email i hasło w ciele żądania.
        -   Obsługa stanu ładowania.
        -   Wyświetlanie błędów walidacji i błędów zwróconych przez API (np. nieprawidłowe dane logowania) przy użyciu komponentu `Toast` lub dedykowanych komunikatów pod polami.
        -   Przekierowanie do `/dashboard` po udanym logowaniu (np. na podstawie odpowiedzi z API lub przez odświeżenie strony i działanie middleware).
-   **`RegisterForm.tsx`**:
    -   Zawiera pola: Email, Password, Confirm Password.
    -   Przyciski: "Register", link do `/auth/login`.
    -   Logika:
        -   Walidacja po stronie klienta (format email, siła hasła, zgodność haseł).
        -   Wywołanie `fetch` z metodą `POST` do endpointu `/api/auth/register` przy submicie, przesyłając email i hasło.
        -   Obsługa stanu ładowania.
        -   Wyświetlanie błędów walidacji i błędów zwróconych przez API (np. użytkownik już istnieje).
        -   Po udanej rejestracji (odpowiedź sukcesu z API) wyświetlenie komunikatu o konieczności weryfikacji emaila.
-   **`ForgotPasswordForm.tsx`**:
    -   Zawiera pole: Email.
    -   Przycisk: "Send reset link".
    -   Logika:
        -   Walidacja po stronie klienta (format email).
        -   Wywołanie `fetch` z metodą `POST` do endpointu `/api/auth/forgot-password` (do utworzenia) przy submicie, przesyłając email.
        -   Obsługa stanu ładowania.
        -   Wyświetlanie komunikatu potwierdzającego wysłanie linku (na podstawie odpowiedzi z API) lub błędu.
-   **`ResetPasswordForm.tsx`**:
    -   Zawiera pola: New Password, Confirm New Password.
    -   Przycisk: "Change Password".
    -   Logika:
        -   Komponent otrzyma token resetujący jako props od strony `.astro` (pobrany z URL).
        -   Walidacja po stronie klienta (siła hasła, zgodność haseł).
        -   Wywołanie `fetch` z metodą `POST` do endpointu `/api/auth/reset-password` (do utworzenia) przy submicie, przesyłając nowe hasło i token.
        -   Obsługa stanu ładowania.
        -   Wyświetlanie błędów walidacji lub błędów zwróconych przez API.
        -   Przekierowanie do `/auth/login` po udanej zmianie hasła.

### 2.4. Walidacja i Komunikaty Błędów

-   **Client-side**: Realizowana w komponentach React (`react-hook-form` + `zod`) dla natychmiastowego feedbacku (np. wymagane pola, format email, długość/siła hasła, zgodność haseł).
-   **Server-side**: Błędy zwracane przez API endpoints (pochodzące z Supabase Auth, np. "Invalid login credentials", "User already registered", "Invalid token") będą przechwytywane w komponentach React i wyświetlane użytkownikowi za pomocą `Sonner` (zintegrowanego przez shadcn/ui) lub dedykowanych komunikatów przy formularzu.
-   Komunikaty błędów będą zgodne z językiem polskim.

### 2.5. Scenariusze Użytkownika

-   **Rejestracja**: Użytkownik wypełnia formularz -> Klient waliduje -> Wywołanie `POST /api/auth/register` -> Endpoint API wywołuje Supabase `signUp` -> Supabase wysyła email weryfikacyjny -> API zwraca sukces -> Użytkownik widzi komunikat o konieczności weryfikacji.
-   **Weryfikacja Email**: Użytkownik klika link w emailu -> Supabase weryfikuje -> Użytkownik jest przekierowany na stronę `/auth/verify-email` lub `/auth/login`.
-   **Logowanie**: Użytkownik wypełnia formularz -> Klient waliduje -> Wywołanie `POST /api/auth/login` -> Endpoint API wywołuje Supabase `signInWithPassword` -> Sukces: API ustawia cookies sesji, zwraca sukces -> Użytkownik przekierowany do `/dashboard`. Błąd: API zwraca błąd, Wyświetlenie komunikatu.
-   **Odzyskiwanie Hasła**: Użytkownik podaje email -> Wywołanie `POST /api/auth/forgot-password` -> Endpoint API wywołuje Supabase `resetPasswordForEmail` -> Supabase wysyła email -> API zwraca sukces -> Użytkownik widzi komunikat.
-   **Ustawienie Nowego Hasła**: Użytkownik klika link w emailu -> Przekierowanie do `/auth/reset-password` z tokenem w URL -> Użytkownik ustawia nowe hasło -> Wywołanie `POST /api/auth/reset-password` z nowym hasłem i tokenem -> Endpoint API wywołuje Supabase `updateUser` (lub odpowiednik z tokenem) -> Sukces: API zwraca sukces -> Przekierowanie do `/auth/login`.
-   **Wylogowanie**: Użytkownik klika przycisk "Log out" (w `Navbar` w `AppLayout`) -> Wywołanie `POST /api/auth/logout` -> Endpoint API wywołuje Supabase `signOut` -> Sesja (cookie) jest usuwana -> Użytkownik jest przekierowany do `/auth/login`.
-   **Dostęp do Chronionych Stron**: Niezalogowany użytkownik próbuje wejść np. na `/dashboard` -> Middleware przechwytuje żądanie -> Sprawdza brak sesji Supabase -> Przekierowuje na `/auth/login`.

## 3. Logika Backendowa (Astro + Supabase)

### 3.1. Endpointy API

Zgodnie z zasadami `@supabase-auth.mdc`, zostaną utworzone dedykowane endpointy API w Astro (`src/pages/api/auth/`) do obsługi operacji autentykacji. Komponenty frontendowe będą komunikować się z tymi endpointami.

-   **`POST /api/auth/login`**: Odbiera email/hasło, wywołuje `supabase.auth.signInWithPassword`, zarządza sesją (cookies) za pomocą `createServerClient`.
-   **`POST /api/auth/register`**: Odbiera email/hasło, wywołuje `supabase.auth.signUp`.
-   **`POST /api/auth/logout`**: Wywołuje `supabase.auth.signOut`, usuwa sesję (cookies).
-   **`POST /api/auth/forgot-password`**: Odbiera email, wywołuje `supabase.auth.resetPasswordForEmail`.
-   **`POST /api/auth/reset-password`**: Odbiera nowe hasło i token (z ciała żądania lub nagłówków), wywołuje odpowiednią funkcję Supabase do aktualizacji hasła przy użyciu tokenu.

### 3.2. Modele Danych

Nie ma potrzeby definiowania dodatkowych modeli danych dla autentykacji w `src/types.ts`, ponieważ Supabase Auth zarządza strukturą użytkownika (`auth.users`). Interakcja będzie odbywać się za pomocą typów dostarczanych przez `@supabase/supabase-js`.

### 3.3. Walidacja Danych Wejściowych

Walidacja po stronie serwera (w endpointach API) będzie kluczowa przed wywołaniem funkcji Supabase. Można użyć biblioteki `zod` również po stronie serwera. Podstawowa walidacja Supabase (np. istnienie użytkownika) nadal działa.

### 3.4. Obsługa Wyjątków

Błędy Supabase (np. `AuthApiError`) będą przechwytywane w endpointach API Astro i zwracane jako odpowiednie odpowiedzi HTTP (np. 400, 401, 500) z komunikatem błędu w ciele JSON.

### 3.5. Server-Side Rendering (SSR) i Dostęp do Sesji

Aplikacja Astro działa w trybie `output: "server"`. Dostęp do informacji o sesji użytkownika na stronach renderowanych serwerowo oraz ochrona tras będą realizowane za pomocą Astro Middleware, zgodnie z implementacją z `@supabase-auth.mdc`.

-   **`src/middleware/index.ts`**:
    -   Middleware będzie uruchamiane dla każdego żądania.
    -   Użyje `createSupabaseServerInstance` (zgodnie z `@supabase-auth.mdc`, używając `@supabase/ssr`) do utworzenia klienta Supabase dla danego żądania, poprawnie obsługując cookies (`getAll`/`setAll`).
    -   Wywoła `supabase.auth.getUser()` aby pobrać dane użytkownika na podstawie sesji z cookies.
    -   Umieści dane użytkownika (lub `null`) w `Astro.locals.user`.
    -   Sprawdzi, czy ścieżka należy do `PUBLIC_PATHS` (zdefiniowanych w middleware).
    -   Dla chronionych tras (nie w `PUBLIC_PATHS`), jeśli `Astro.locals.user` jest `null`, przekieruje użytkownika do `/auth/login` za pomocą `Astro.redirect`.
    -   Jeśli sesja istnieje lub ścieżka jest publiczna, pozwoli na kontynuację żądania (`next()`).
-   **Dostęp do danych użytkownika w stronach `.astro`**: Strony renderowane serwerowo będą mogły uzyskać dostęp do danych zalogowanego użytkownika poprzez `Astro.locals.user` (np. `const { user } = Astro.locals;`).

## 4. System Autentykacji (Integracja z Supabase Auth)

### 4.1. Konfiguracja Supabase

-   Projekt Supabase zostanie skonfigurowany z włączonym modułem Auth.
-   **Potwierdzenie Email**: Będzie włączone (wymóg US-010). Szablony email (weryfikacja, reset hasła) zostaną dostosowane (opcjonalnie).
-   **Redirect URLs**: W ustawieniach Supabase Auth zostaną skonfigurowane adresy URL, na które użytkownik ma być przekierowany po weryfikacji emaila i resecie hasła (np. `http://localhost:3000/auth/verify-email`, `http://localhost:3000/auth/login`). Site URL również musi być poprawnie ustawiony.
-   **Providerzy**: Na start używany będzie tylko provider Email/Password.

### 4.2. Klient Supabase (`src/db/supabase.client.ts`)

-   Zostanie utworzony lub zaktualizowany plik inicjujący klienta Supabase, zgodnie ze strukturą z `@supabase-auth.mdc`.
-   Zostanie zaimplementowana funkcja `createSupabaseServerInstance` wykorzystująca `createServerClient` z pakietu `@supabase/ssr`.
-   Implementacja będzie zawierać logikę obsługi cookies za pomocą metod `getAll()` i `setAll()`, jak pokazano w `@supabase-auth.mdc`.
-   **Nie będą** używane żadne funkcje z pakietu `@supabase/auth-helpers-astro`.
-   Nie będzie potrzeby tworzenia oddzielnego klienta "browser client", gdyż wszystkie operacje autentykacyjne będą przechodzić przez server-side (middleware lub API endpoints).

### 4.3. Przepływy Autentykacji

-   **Rejestracja**: `RegisterForm` -> `POST /api/auth/register` -> `supabase.auth.signUp()`.
-   **Logowanie**: `LoginForm` -> `POST /api/auth/login` -> `supabase.auth.signInWithPassword()`.
-   **Wylogowanie**: Przycisk w `Navbar` -> `POST /api/auth/logout` -> `supabase.auth.signOut()`.
-   **Reset Hasła (Inicjacja)**: `ForgotPasswordForm` -> `POST /api/auth/forgot-password` -> `supabase.auth.resetPasswordForEmail()`.
-   **Reset Hasła (Ustawienie Nowego)**: `ResetPasswordForm` -> `POST /api/auth/reset-password` -> `supabase.auth.updateUser()` (lub odpowiednik z tokenem).
-   **Obsługa Sesji**: Pakiet `@supabase/ssr` wraz z implementacją w `createSupabaseServerInstance` i middleware będzie automatycznie zarządzał sesją użytkownika za pomocą plików cookie. Middleware odczyta sesję przy każdym żądaniu server-side.

## 5. Bezpieczeństwo

-   Hasła nie są przechowywane w czystym tekście (obsługiwane przez Supabase).
-   Komunikacja z Supabase odbywa się przez HTTPS.
-   Klucze API Supabase (`anon key`, `service_role key` jeśli potrzebny serwerowo) będą przechowywane w zmiennych środowiskowych (`.env`) i **nie będą** eksponowane po stronie klienta. Cała interakcja z Supabase odbywa się po stronie serwera (przez API lub middleware).
-   Tokeny JWT są zarządzane przez `@supabase/ssr` i odpowiednie ustawienia cookies (HttpOnly, Secure, SameSite).
-   Ochrona przed atakami CSRF jest częściowo zapewniana przez mechanizmy Supabase i poprawne zarządzanie cookies. Zalecane może być dodanie dodatkowych mechanizmów, jeśli aplikacja jest na to narażona.
-   Walidacja wejść po stronie klienta (React) i **krytycznie ważna** walidacja po stronie serwera (w endpointach API Astro).
-   Ograniczenie informacji zwrotnej przy resetowaniu hasła (nie ujawnianie, czy email istnieje).
-   Aktualizacja pliku `src/env.d.ts` o zmienne środowiskowe Supabase.

## 6. Podsumowanie Kluczowych Zmian

-   Dodanie stron Astro w `src/pages/auth/`.
-   Dodanie komponentów React w `src/components/auth/` dla formularzy (wywołujących API).
-   **Dodanie endpointów API Astro w `src/pages/api/auth/` (login, register, logout, forgot-password, reset-password).**
-   Utworzenie `AuthLayout.astro`.
-   **Implementacja `src/middleware/index.ts` zgodnie z `@supabase-auth.mdc` (używając `@supabase/ssr`).**
-   **Konfiguracja i integracja Supabase JS SDK przy użyciu `@supabase/ssr` i `createSupabaseServerInstance`.**
-   **Usunięcie zależności i użycia `@supabase/auth-helpers-astro`.**
-   Aktualizacja `AppLayout` (lub odpowiednika) do obsługi stanu zalogowania/wylogowania na podstawie `Astro.locals.user`.
-   Dodanie przycisku "Log out" do `Navbar` (wywołującego `POST /api/auth/logout`).
-   Konfiguracja projektu Supabase (Auth, Email Templates, Redirects).
-   Aktualizacja `src/env.d.ts`. 