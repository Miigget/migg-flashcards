# Plan Testów dla Aplikacji MiggFlashcards

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia plan testów dla aplikacji `MiggFlashcards`. Plan ten obejmuje strategię, zakres, zasoby i harmonogram działań testowych mających na celu zapewnienie jakości, funkcjonalności, wydajności i bezpieczeństwa aplikacji przed jej wdrożeniem. Plan uwzględnia specyfikę stosu technologicznego (Astro, React, TypeScript, Tailwind, Shadcn/ui, Supabase, Openrouter.ai) oraz strukturę projektu.

### 1.2. Cele Testowania

Główne cele procesu testowania to:

*   **Weryfikacja funkcjonalna:** Potwierdzenie, że wszystkie funkcje aplikacji działają zgodnie z wymaganiami i specyfikacją.
*   **Zapewnienie jakości:** Identyfikacja i eliminacja błędów oraz defektów we wczesnych fazach rozwoju.
*   **Ocena wydajności:** Weryfikacja, czy aplikacja działa wydajnie pod oczekiwanym obciążeniem.
*   **Weryfikacja bezpieczeństwa:** Identyfikacja potencjalnych luk bezpieczeństwa i zapewnienie ochrony danych użytkowników.
*   **Ocena użyteczności (UX) i dostępności (a11y):** Sprawdzenie, czy interfejs użytkownika jest intuicyjny, łatwy w obsłudze i dostępny dla osób z niepełnosprawnościami.
*   **Potwierdzenie stabilności:** Zapewnienie, że aplikacja działa stabilnie w różnych warunkach i środowiskach.
*   **Weryfikacja integracji:** Sprawdzenie poprawnej współpracy między różnymi komponentami systemu oraz z usługami zewnętrznymi (Supabase, Openrouter.ai).

## 2. Zakres Testów

Testowaniem objęte zostaną następujące obszary aplikacji:

*   **Frontend:**
    *   Renderowanie stron i layoutów (Astro)
    *   Komponenty statyczne (Astro)
    *   Komponenty interaktywne (React, Shadcn/ui)
    *   Logika po stronie klienta (React Hooks, TypeScript)
    *   Routing po stronie klienta (jeśli dotyczy)
    *   Interfejs użytkownika (UI) i doświadczenie użytkownika (UX)
    *   Walidacja formularzy
    *   Responsywność (RWD) na różnych urządzeniach i przeglądarkach
    *   Dostępność (a11y)
*   **Backend (API Endpoints - `src/pages/api`):**
    *   Logika biznesowa
    *   Obsługa żądań HTTP (GET, POST, PUT, DELETE, etc.)
    *   Walidacja danych wejściowych
    *   Integracja z bazą danych (Supabase)
    *   Integracja z usługami zewnętrznymi (Openrouter.ai)
    *   Obsługa błędów
*   **Middleware (`src/middleware`):**
    *   Autentykacja i autoryzacja użytkowników
    *   Logowanie żądań
    *   Modyfikacja żądań/odpowiedzi
*   **Baza danych (Supabase):**
    *   Integralność danych
    *   Poprawność zapytań
    *   Reguły bezpieczeństwa (Row Level Security - RLS), jeśli są stosowane
*   **Integracje:**
    *   Poprawność komunikacji między frontendem a backendem (API)
    *   Poprawność komunikacji z Supabase (SDK)
    *   Poprawność komunikacji z Openrouter.ai (API)
*   **Niefunkcjonalne:**
    *   Wydajność (czas ładowania, czas odpowiedzi API)
    *   Bezpieczeństwo (podstawowe skanowanie podatności, kontrola dostępu)
    *   Użyteczność
    *   Kompatybilność (przeglądarki, systemy operacyjne)

**Poza zakresem:**

*   Szczegółowe testy penetracyjne (mogą być przeprowadzone przez zewnętrzny zespół).
*   Testy obciążeniowe na dużą skalę (początkowo skupimy się na testach wydajnościowych).
*   Testowanie wewnętrznej implementacji bibliotek zewnętrznych (np. Shadcn/ui, Supabase SDK), chyba że wystąpią problemy integracyjne.

## 3. Typy Testów

W ramach projektu przeprowadzone zostaną następujące typy testów:

*   **Testy jednostkowe (Unit Tests):**
    *   *Cel:* Weryfikacja poprawności działania izolowanych fragmentów kodu (funkcje, komponenty React, hooki, moduły w `src/lib`).
    *   *Narzędzia:* Vitest/Jest, React Testing Library.
    *   *Zakres:* Głównie logika w `src/lib`, `src/hooks`, komponenty React, funkcje pomocnicze.
*   **Testy integracyjne (Integration Tests):**
    *   *Cel:* Weryfikacja poprawnej współpracy między różnymi modułami i komponentami systemu oraz z usługami zewnętrznymi (z mockowaniem lub na dedykowanym środowisku testowym).
    *   *Narzędzia:* Vitest/Jest, React Testing Library, Supertest (dla API), Playwright/Cypress (dla integracji UI).
    *   *Zakres:* Interakcje między komponentami React, komunikacja Frontend <-> API, komunikacja API <-> Supabase, komunikacja API <-> Openrouter.ai (mockowane), działanie Middleware.
*   **Testy End-to-End (E2E Tests):**
    *   *Cel:* Symulacja rzeczywistych scenariuszy użytkownika, weryfikacja pełnych przepływów w aplikacji z perspektywy użytkownika końcowego.
    *   *Narzędzia:* Playwright lub Cypress.
    *   *Zakres:* Kluczowe przepływy użytkownika (rejestracja, logowanie, główne funkcjonalności aplikacji, operacje CRUD), renderowanie stron Astro, interakcje z komponentami React.
*   **Testy API:**
    *   *Cel:* Bezpośrednia weryfikacja działania punktów końcowych API (`src/pages/api`) pod kątem logiki, walidacji, obsługi błędów i kontraktu API.
    *   *Narzędzia:* Supertest (w ramach testów integracyjnych backendu) lub narzędzia jak Postman/Insomnia (manualnie/automatycznie).
    *   *Zakres:* Wszystkie endpointy API.
*   **Testy wizualnej regresji:**
    *   *Cel:* Wykrywanie niezamierzonych zmian w wyglądzie interfejsu użytkownika.
    *   *Narzędzia:* Playwright (z porównywaniem screenshotów) lub dedykowane narzędzia (np. Percy, Chromatic).
    *   *Zakres:* Kluczowe strony i komponenty UI.
*   **Testy wydajnościowe:**
    *   *Cel:* Ocena czasu ładowania stron, czasu odpowiedzi API pod standardowym obciążeniem.
    *   *Narzędzia:* Lighthouse (frontend), narzędzia do profilowania backendu, k6 (opcjonalnie dla API).
    *   *Zakres:* Kluczowe strony, krytyczne endpointy API, zapytania do bazy danych.
*   **Testy bezpieczeństwa:**
    *   *Cel:* Identyfikacja podstawowych luk bezpieczeństwa.
    *   *Narzędzia:* Skanery ZAP/OWASP (automatyczne), manualna weryfikacja kontroli dostępu.
    *   *Zakres:* Autentykacja, autoryzacja, walidacja danych wejściowych, konfiguracja Supabase RLS.
*   **Testy dostępności (a11y):**
    *   *Cel:* Zapewnienie zgodności ze standardami WCAG i użyteczności dla osób z niepełnosprawnościami.
    *   *Narzędzia:* Axe (wtyczka przeglądarki, integracja z Playwright/Cypress), manualne testy z czytnikami ekranu.
    *   *Zakres:* Cała aplikacja, ze szczególnym uwzględnieniem interaktywnych komponentów.
*   **Testy manualne i eksploracyjne:**
    *   *Cel:* Wykrywanie błędów trudnych do zautomatyzowania, ocena UX, testowanie przypadków brzegowych.
    *   *Narzędzia:* Przeglądarki, narzędzia deweloperskie.
    *   *Zakres:* Cała aplikacja, szczególnie nowe funkcje i obszary o wysokim ryzyku.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

*Przykładowe scenariusze (lista będzie rozwijana w miarę rozwoju aplikacji):*

*   **Autentykacja:**
    *   Rejestracja nowego użytkownika (poprawna, z błędami walidacji, z istniejącym email).
    *   Logowanie użytkownika (poprawne dane, błędne hasło, błędny email).
    *   Wylogowanie użytkownika.
    *   Ochrona tras/zasobów wymagających zalogowania.
    *   Resetowanie hasła (jeśli dotyczy).
*   **Główna funkcjonalność X (np. tworzenie fiszek):**
    *   Poprawne utworzenie nowej fiszki (z wszystkimi wymaganymi polami).
    *   Próba utworzenia fiszki z brakującymi/niepoprawnymi danymi (walidacja).
    *   Wyświetlanie listy fiszek.
    *   Edycja istniejącej fiszki.
    *   Usuwanie fiszki.
    *   Wyszukiwanie/filtrowanie fiszek (jeśli dotyczy).
*   **Integracja z Openrouter.ai (jeśli dotyczy):**
    *   Wysłanie zapytania do AI i poprawne przetworzenie odpowiedzi.
    *   Obsługa błędów komunikacji z API Openrouter.ai.
    *   Obsługa limitów API (jeśli możliwe do zasymulowania).
*   **Profil użytkownika:**
    *   Wyświetlanie danych użytkownika.
    *   Edycja danych profilu.
    *   Zmiana hasła (jeśli dotyczy).

*Dla każdego scenariusza zostaną zdefiniowane kroki, oczekiwane rezultaty oraz typy testów (Jednostkowy, Integracyjny, E2E, Manualny).*

## 5. Środowisko Testowe

*   **Środowisko deweloperskie (lokalne):** Do uruchamiania testów jednostkowych i integracyjnych podczas rozwoju.
*   **Środowisko testowe (staging/testing):** Odseparowana instancja aplikacji, maksymalnie zbliżona do środowiska produkcyjnego.
    *   Osobna baza danych Supabase (testowa).
    *   Osobny klucz API dla Openrouter.ai (z limitami).
    *   Wdrażane automatycznie po zmianach na głównym branchu developerskim (np. `develop` lub `main`).
    *   Wykorzystywane do uruchamiania testów E2E, testów API, testów wizualnej regresji, testów wydajnościowych, testów a11y oraz testów manualnych.
*   **Środowisko produkcyjne:** Monitorowane, ale nie używane bezpośrednio do testów przed wdrożeniem (ewentualnie testy dymne po wdrożeniu).

## 6. Narzędzia do Testowania

*   **Framework do testów jednostkowych/integracyjnych:** Vitest (preferowany dla projektów Vite/Astro) lub Jest.
*   **Biblioteka do testowania komponentów React:** React Testing Library.
*   **Framework do testów E2E:** Playwright (preferowany) lub Cypress.
*   **Narzędzie do testowania API:** Supertest (w kodzie), Postman/Insomnia (manualnie/automatycznie).
*   **Narzędzie do testów wizualnej regresji:** Playwright (wbudowane), Percy, Chromatic.
*   **Narzędzie do testów wydajności:** Lighthouse, narzędzia deweloperskie przeglądarki, k6 (opcjonalnie).
*   **Narzędzie do testów dostępności:** Axe (integracja z E2E, wtyczka).
*   **System CI/CD:** GitHub Actions (do automatycznego uruchamiania testów).
*   **System zarządzania zadaniami/błędami:** Jira, Trello, GitHub Issues lub inny.

## 7. Harmonogram Testów

*   **Testy jednostkowe i integracyjne:** Pisane równolegle z kodem przez deweloperów. Uruchamiane automatycznie przy każdym pushu do repozytorium i przed merge requestami.
*   **Testy API:** Pisane równolegle z implementacją endpointów. Uruchamiane w CI/CD.
*   **Testy E2E:** Tworzone dla kluczowych przepływów po ustabilizowaniu się funkcjonalności. Uruchamiane regularnie (np. co noc) na środowisku testowym oraz przed każdym wdrożeniem na produkcję.
*   **Testy wizualnej regresji:** Uruchamiane po zmianach w UI na środowisku testowym.
*   **Testy wydajnościowe:** Przeprowadzane okresowo (np. przed dużymi wydaniami) na środowisku testowym.
*   **Testy bezpieczeństwa (podstawowe):** Przeprowadzane okresowo i przed wdrożeniem krytycznych zmian związanych z bezpieczeństwem.
*   **Testy dostępności:** Uruchamiane automatycznie w CI/CD, manualne testy okresowo.
*   **Testy manualne/eksploracyjne:** Przeprowadzane przed każdym wydaniem na środowisku testowym.

*Dokładny harmonogram będzie powiązany z harmonogramem projektu i sprintów.*

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Rozpoczęcia Testów)

*   Kod źródłowy dostępny w repozytorium.
*   Środowisko testowe skonfigurowane i dostępne.
*   Podstawowa dokumentacja funkcjonalności dostępna.
*   Build aplikacji na środowisku testowym zakończony sukcesem.

### 8.2. Kryteria Zakończenia Testów (Gotowości do Wdrożenia)

*   Wszystkie zaplanowane testy (jednostkowe, integracyjne, E2E) dla danego wydania zostały wykonane.
*   Osiągnięty zdefiniowany poziom pokrycia kodu testami (np. 80% dla kluczowych modułów).
*   Wszystkie krytyczne (Critical/Blocker) i poważne (Major/High) błędy zostały naprawione i zweryfikowane.
*   Liczba błędów o niższym priorytecie (Minor/Low) jest akceptowalna przez zespół i Product Ownera.
*   Wyniki testów wydajnościowych i bezpieczeństwa są akceptowalne.
*   Testy regresji zakończone sukcesem (brak nowych błędów w istniejącej funkcjonalności).
*   Dokumentacja testowa (wyniki, raporty błędów) jest kompletna.

## 9. Role i Odpowiedzialności

*   **Deweloperzy:**
    *   Pisanie testów jednostkowych i integracyjnych dla tworzonego kodu.
    *   Naprawianie błędów zgłoszonych przez testerów i w testach automatycznych.
    *   Utrzymanie środowiska deweloperskiego.
    *   Dbanie o jakość kodu i przestrzeganie standardów.
*   **Inżynier QA / Testerzy:**
    *   Tworzenie i utrzymanie planu testów.
    *   Projektowanie i implementacja testów automatycznych (API, E2E, wizualna regresja, wydajność, a11y).
    *   Wykonywanie testów manualnych i eksploracyjnych.
    *   Raportowanie znalezionych błędów i weryfikacja poprawek.
    *   Zarządzanie środowiskiem testowym.
    *   Monitorowanie wyników testów w CI/CD.
    *   Komunikacja statusu testów i jakości aplikacji.
*   **Product Owner / Manager Projektu:**
    *   Definiowanie wymagań i kryteriów akceptacji.
    *   Priorytetyzacja funkcjonalności i błędów.
    *   Ostateczna decyzja o wdrożeniu na podstawie wyników testów i oceny ryzyka.
*   **DevOps (jeśli dotyczy):**
    *   Konfiguracja i utrzymanie pipeline'ów CI/CD.
    *   Zarządzanie infrastrukturą środowisk (testowego, produkcyjnego).

## 10. Procedury Raportowania Błędów

1.  **Identyfikacja błędu:** Podczas testów manualnych lub automatycznych.
2.  **Rejestracja błędu:** Utworzenie nowego zgłoszenia w systemie śledzenia błędów (np. GitHub Issues). Zgłoszenie powinno zawierać:
    *   **Tytuł:** Krótki, opisowy tytuł błędu.
    *   **Opis:** Szczegółowy opis problemu, w tym kroki do reprodukcji (jasne i precyzyjne).
    *   **Oczekiwany rezultat:** Co powinno się wydarzyć.
    *   **Aktualny rezultat:** Co się dzieje w rzeczywistości.
    *   **Środowisko:** Gdzie błąd wystąpił (np. przeglądarka, system operacyjny, środowisko testowe/produkcyjne).
    *   **Priorytet/Waga:** Ocena wpływu błędu (np. Blocker, Critical, Major, Minor, Trivial).
    *   **Dowody:** Zrzuty ekranu, nagrania wideo, logi konsoli/sieciowe.
    *   **Etykiety/Tagi:** (np. `bug`, `ui`, `backend`, `auth`).
3.  **Triage błędów:** Regularne przeglądy zgłoszonych błędów przez zespół (QA, Dev, PO) w celu potwierdzenia, priorytetyzacji i przypisania do naprawy.
4.  **Naprawa błędu:** Deweloper implementuje poprawkę.
5.  **Weryfikacja poprawki:** Tester weryfikuje, czy błąd został naprawiony na środowisku testowym.
6.  **Zamknięcie błędu:** Jeśli poprawka działa, zgłoszenie jest zamykane. Jeśli nie, jest ponownie otwierane z odpowiednim komentarzem.
7.  **Testy regresji:** Sprawdzenie, czy naprawa błędu nie wprowadziła nowych problemów w innych częściach aplikacji. 