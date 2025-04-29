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

Zostaną utworzone dedykowane komponenty React dla formularzy, wykorzystujące komponenty UI z `shadcn/ui` oraz bibliotekę do zarządzania stanem formularzy (np. `react-hook-form`) i walidacji (np. `zod`).

-   **`LoginForm.tsx`**:
    -   Zawiera pola: Email, Password.
    -   Przyciski: "Log in", link do `/auth/register`, link do `/auth/forgot-password`.
    -   Logika:
        -   Walidacja po stronie klienta (format email, wymagane hasło).
        -   Wywołanie funkcji logowania Supabase (`signInWithPassword`) przy submicie.
        -   Obsługa stanu ładowania.
        -   Wyświetlanie błędów walidacji i błędów z Supabase (np. nieprawidłowe dane logowania) przy użyciu komponentu `Toast` lub dedykowanych komunikatów pod polami.
        -   Przekierowanie do `/dashboard` po udanym logowaniu (realizowane przez logikę strony Astro lub hook React po otrzymaniu sukcesu z Supabase).
-   **`RegisterForm.tsx`**:
    -   Zawiera pola: Email, Password, Confirm Password.
    -   Przyciski: "Register", link do `/auth/login`.
    -   Logika:
        -   Walidacja po stronie klienta (format email, siła hasła, zgodność haseł).
        -   Wywołanie funkcji rejestracji Supabase (`signUp`) przy submicie. Supabase domyślnie wymaga potwierdzenia email.
        -   Obsługa stanu ładowania.
        -   Wyświetlanie błędów walidacji i błędów z Supabase (np. użytkownik już istnieje).
        -   Po udanej rejestracji wyświetlenie komunikatu o konieczności weryfikacji emaila (może być zarządzane przez stronę `.astro`).
-   **`ForgotPasswordForm.tsx`**:
    -   Zawiera pole: Email.
    -   Przycisk: "Send reset link".
    -   Logika:
        -   Walidacja po stronie klienta (format email).
        -   Wywołanie funkcji Supabase (`resetPasswordForEmail`) przy submicie.
        -   Obsługa stanu ładowania.
        -   Wyświetlanie komunikatu potwierdzającego wysłanie linku (niezależnie od tego, czy email istnieje w bazie - zgodnie z dobrymi praktykami bezpieczeństwa) lub błędu.
-   **`ResetPasswordForm.tsx`**:
    -   Zawiera pola: New Password, Confirm New Password.
    -   Przycisk: "Change Password".
    -   Logika:
        -   Walidacja po stronie klienta (siła hasła, zgodność haseł).
        -   Wywołanie funkcji Supabase (`updateUser` z nowym hasłem) przy submicie. Komponent ten otrzyma token resetujący (z URL) jako props od strony `.astro`, który jest potrzebny do wywołania Supabase.
        -   Obsługa stanu ładowania.
        -   Wyświetlanie błędów walidacji lub błędów z Supabase.
        -   Przekierowanie do `/auth/login` po udanej zmianie hasła.

### 2.4. Walidacja i Komunikaty Błędów

-   **Client-side**: Realizowana w komponentach React (`react-hook-form` + `zod`) dla natychmiastowego feedbacku (np. wymagane pola, format email, długość/siła hasła, zgodność haseł).
-   **Server-side**: Błędy zwracane przez Supabase Auth (np. "Invalid login credentials", "User already registered", "Invalid token") będą przechwytywane w komponentach React i wyświetlane użytkownikowi za pomocą `Toast` (shadcn/ui) lub dedykowanych komunikatów przy formularzu.
-   Komunikaty błędów będą zgodne z językiem polskim.

### 2.5. Scenariusze Użytkownika

-   **Rejestracja**: Użytkownik wypełnia formularz -> Klient waliduje -> Wywołanie Supabase `signUp` -> Supabase wysyła email weryfikacyjny -> Użytkownik widzi komunikat o konieczności weryfikacji.
-   **Weryfikacja Email**: Użytkownik klika link w emailu -> Supabase weryfikuje -> Użytkownik jest przekierowany na stronę `/auth/verify-email` lub `/auth/login`.
-   **Logowanie**: Użytkownik wypełnia formularz -> Klient waliduje -> Wywołanie Supabase `signInWithPassword` -> Sukces: Supabase ustawia sesję (cookie), użytkownik przekierowany do `/dashboard`. Błąd: Wyświetlenie komunikatu.
-   **Odzyskiwanie Hasła**: Użytkownik podaje email -> Wywołanie Supabase `resetPasswordForEmail` -> Supabase wysyła email -> Użytkownik klika link -> Przekierowanie do `/auth/reset-password` z tokenem -> Użytkownik ustawia nowe hasło -> Wywołanie Supabase `updateUser` -> Sukces: Przekierowanie do `/auth/login`.
-   **Wylogowanie**: Użytkownik klika przycisk "Log out" (w `Navbar` w `AppLayout`) -> Wywołanie Supabase `signOut` -> Sesja jest usuwana -> Użytkownik jest przekierowany do `/auth/login` (obsłużone przez middleware lub logikę strony).
-   **Dostęp do Chronionych Stron**: Niezalogowany użytkownik próbuje wejść np. na `/dashboard` -> Middleware przechwytuje żądanie -> Sprawdza brak sesji Supabase -> Przekierowuje na `/auth/login`.

## 3. Logika Backendowa (Astro + Supabase)

### 3.1. Endpointy API

Nie będą tworzone dedykowane endpointy API w Astro (`src/pages/api/auth/`). Logika autentykacji będzie realizowana bezpośrednio przez wywołania Supabase JS SDK z komponentów React (client-side) lub potencjalnie z kodu server-side stron Astro, jeśli zajdzie taka potrzeba (np. przy SSR). Supabase działa jako BaaS, dostarczając gotowe endpointy i logikę.

### 3.2. Modele Danych

Nie ma potrzeby definiowania dodatkowych modeli danych dla autentykacji w `src/types.ts`, ponieważ Supabase Auth zarządza strukturą użytkownika (`auth.users`). Interakcja będzie odbywać się za pomocą typów dostarczanych przez `@supabase/supabase-js`.

### 3.3. Walidacja Danych Wejściowych

Podstawowa walidacja (np. istnienie użytkownika, poprawność hasła, ważność tokenów) jest obsługiwana przez Supabase Auth. Dodatkowa walidacja (format, siła hasła) odbywa się client-side w komponentach React.

### 3.4. Obsługa Wyjątków

Błędy zwracane przez Supabase SDK (np. `AuthApiError`) będą przechwytywane w blokach `try...catch` w komponentach React i odpowiednio komunikowane użytkownikowi.

### 3.5. Server-Side Rendering (SSR) i Dostęp do Sesji

Aplikacja Astro działa w trybie `output: "server"`. Dostęp do informacji o sesji użytkownika na stronach renderowanych serwerowo oraz ochrona tras będą realizowane za pomocą Astro Middleware.

-   **`src/middleware/index.ts`**:
    -   Middleware będzie uruchamiane dla każdego żądania.
    -   Utworzy klienta Supabase dla danego żądania (server-side client).
    -   Spróbuje pobrać sesję użytkownika z ciasteczek (`getSessionFromCookie`).
    -   Umieści informacje o sesji (lub jej braku) w `Astro.locals`, np. `Astro.locals.session` i `Astro.locals.user`.
    -   Dla chronionych tras (wszystkie poza `/auth/*` i potencjalnie stroną główną `/`), sprawdzi obecność aktywnej sesji w `Astro.locals`.
    -   Jeśli sesja nie istnieje, przekieruje użytkownika do `/auth/login` za pomocą `Astro.redirect`.
    -   Jeśli sesja istnieje, pozwoli na kontynuację żądania.
-   **Dostęp do danych użytkownika w stronach `.astro`**: Strony renderowane serwerowo będą mogły uzyskać dostęp do danych zalogowanego użytkownika poprzez `Astro.locals.user` (lub `Astro.locals.session.user`).

## 4. System Autentykacji (Integracja z Supabase Auth)

### 4.1. Konfiguracja Supabase

-   Projekt Supabase zostanie skonfigurowany z włączonym modułem Auth.
-   **Potwierdzenie Email**: Będzie włączone (wymóg US-010). Szablony email (weryfikacja, reset hasła) zostaną dostosowane (opcjonalnie).
-   **Redirect URLs**: W ustawieniach Supabase Auth zostaną skonfigurowane adresy URL, na które użytkownik ma być przekierowany po weryfikacji emaila i resecie hasła (np. `http://localhost:3000/auth/verify-email`, `http://localhost:3000/auth/login`). Site URL również musi być poprawnie ustawiony.
-   **Providerzy**: Na start używany będzie tylko provider Email/Password.

### 4.2. Klient Supabase (`src/db/supabase.ts`)

-   Zostanie utworzony plik inicjujący klienta Supabase JS SDK.
-   Będą wyeksportowane funkcje do tworzenia klienta:
    -   `createSupabaseBrowserClient()`: Dla użycia w komponentach React (client-side).
    -   `createSupabaseServerClient(context)`: Dla użycia w Astro Middleware i na stronach `.astro` (server-side), przekazując obiekt `context` (lub `Astro`) do poprawnego zarządzania cookies.
    -   Supabase Auth Helpers (`@supabase/auth-helpers-astro`) zostaną wykorzystane do uproszczenia zarządzania sesją w środowisku Astro SSR.

### 4.3. Przepływy Autentykacji

-   **Rejestracja**: `RegisterForm` -> `supabase.auth.signUp({ email, password })`.
-   **Logowanie**: `LoginForm` -> `supabase.auth.signInWithPassword({ email, password })`.
-   **Wylogowanie**: Przycisk w `Navbar` -> `supabase.auth.signOut()`.
-   **Reset Hasła (Inicjacja)**: `ForgotPasswordForm` -> `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/auth/reset-password' })`.
-   **Reset Hasła (Ustawienie Nowego)**: `ResetPasswordForm` -> `supabase.auth.updateUser({ password: newPassword })`. Token jest obsługiwany automatycznie przez Supabase SDK, gdy użytkownik trafia na stronę z linku.
-   **Obsługa Sesji**: Supabase SDK automatycznie zarządza sesją użytkownika za pomocą plików cookie (dla SSR) i/lub Local Storage (opcjonalnie, głównie dla SPA). Astro Middleware będzie odczytywać sesję z cookies przy każdym żądaniu server-side. Stan sesji na kliencie (w React) może być synchronizowany za pomocą `onAuthStateChange`.

## 5. Bezpieczeństwo

-   Hasła nie są przechowywane w czystym tekście (obsługiwane przez Supabase).
-   Komunikacja z Supabase odbywa się przez HTTPS.
-   Klucze API Supabase (`anon key`) będą przechowywane w zmiennych środowiskowych (`.env`). Klucz serwisowy (`service_role key`) nie będzie używany na frontendzie.
-   Tokeny JWT są zarządzane przez Supabase Auth Helpers z flagami `HttpOnly` i `Secure` w środowisku produkcyjnym.
-   Ochrona przed atakami CSRF jest częściowo zapewniana przez mechanizmy Supabase i poprawne zarządzanie cookies przez Auth Helpers.
-   Walidacja wejść po stronie klienta i serwera (Supabase).
-   Ograniczenie informacji zwrotnej przy resetowaniu hasła (nie ujawnianie, czy email istnieje).

## 6. Podsumowanie Kluczowych Zmian

-   Dodanie stron Astro w `src/pages/auth/`.
-   Dodanie komponentów React w `src/components/auth/` dla formularzy.
-   Utworzenie `AuthLayout.astro`.
-   Implementacja `src/middleware/index.ts` do ochrony tras i zarządzania sesją w `Astro.locals`.
-   Konfiguracja i integracja Supabase Auth JS SDK oraz Auth Helpers.
-   Aktualizacja `AppLayout` (lub odpowiednika) do obsługi stanu zalogowania/wylogowania.
-   Dodanie przycisku "Log out" do `Navbar`.
-   Konfiguracja projektu Supabase (Auth, Email Templates, Redirects). 