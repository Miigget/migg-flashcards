# Dokument wymagań produktu (PRD) - Migg Flashcards
## 1. Przegląd produktu
Aplikacja "Migg Flashcards" umożliwia użytkownikom tworzenie i zarządzanie zestawami fiszek poprzez zarówno ręczne wprowadzanie danych, jak i wykorzystanie AI do automatycznego generowania fiszek. System integruje podstawowy mechanizm kont użytkowników, zarządzanie kolekcjami, oraz gotowy algorytm powtórek, gwarantując prosty i intuicyjny interfejs. Produkt skupia się na usprawnieniu procesu nauki metodą spaced repetition poprzez eliminację czasochłonnego ręcznego tworzenia fiszek.

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne i skomplikowane, co zniechęca użytkowników do korzystania z efektywnej metody nauki. Użytkownicy, szczególnie początkujący, mają trudności z optymalnym dzieleniem informacji na mniejsze jednostki, co prowadzi do problemów z zapamiętywaniem i efektywnym powtarzaniem materiału.

## 3. Wymagania funkcjonalne
- Umożliwienie kopiowania i wklejania tekstu z limitem 10000 znaków.
- Automatyczne generowanie kandydatów na fiszki przez AI na podstawie wprowadzonego tekstu.
- Proces generowania jest synchroniczny, a kandydaci na fiszki podlegają recenzji przez użytkownika (opcje: Accept, Edit, Discard).
- Funkcjonalność bulk zapisu zatwierdzonych fiszek do bazy danych.
- Możliwość ręcznego tworzenia fiszek.
- System rejestracji i logowania użytkowników.
- Zarządzanie kolekcjami fiszek (przeglądanie, edycja, usuwanie).
- W sekcji Settings użytkownik może edytować hasło oraz usunąć konto.
- Struktura fiszek:
  - Przód: do 200 znaków, z opcjonalnymi odpowiedziami.
  - Tył: do 500 znaków.
- Statystyki generowania fiszek(zbieranie informacji o tym, ile fiszek zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano)
- Wykorzystanie gotowej, open-source biblioteki do implementacji algorytmu powtórek.

## 4. Granice produktu
- Nie implementujemy własnego, zaawansowanego algorytmu powtórek (jak SuperMemo czy Anki).
- Importowanie wielu formatów plików (PDF, DOCX, itp.) nie jest w zakresie MVP.
- Współdzielenie zestawów fiszek między użytkownikami nie jest przewidziane.
- Integracje z innymi platformami edukacyjnymi nie są realizowane.
- Produkt jest obecnie planowany jako aplikacja webowa; mobilne aplikacje nie są priorytetem na etapie MVP.

## 5. Historyjki użytkowników

### US-001: Rejestracja i uwierzytelnianie
- Opis: Jako nowy użytkownik chcę móc się zarejestrować i zalogować do systemu, aby mieć bezpieczny dostęp do mojego konta i zarządzać fiszkami.
- Kryteria akceptacji:
  - Użytkownik może zarejestrować konto poprzez formularz.
  - Walidacja danych (email, hasło) działa poprawnie.
  - Użytkownik może zalogować się do systemu po rejestracji.
  - Tylko uwierzytelnieni użytkownicy mają dostęp do wszystkich widoków aplikacji.
  - Użytkownik po wejściu na stronę główną powinien zostać przekierowany do dedykowanego widoku logowania/rejestracji.
  - Użytkownik może wylogować się z systemu po zalogowaniu.

### US-002: Ręczne tworzenie fiszek
- Opis: Jako użytkownik chcę móc samodzielnie tworzyć fiszki, aby móc dokładnie dopasować zawartość do moich potrzeb.
- Kryteria akceptacji:
  - Interfejs pozwala na tworzenie nowej fiszki.
  - Pole "przód" akceptuje maksymalnie 200 znaków, a "tył" do 500 znaków.
  - Istnieje możliwość dodania opcjonalnych odpowiedzi do pola "przód".
  - System wyświetla komunikaty błędów przy przekroczeniu limitów znakowych.

### US-003: Generowanie fiszek przez AI
- Opis: Jako użytkownik chcę, aby system generował kandydatów na fiszki na podstawie wprowadzonego tekstu, aby przyspieszyć proces tworzenia fiszek.
- Kryteria akceptacji:
  - Użytkownik może wkleić tekst do pola tekstowego z limitem od 100 do 10000 znaków.
  - Po kliknięciu przycisku generowania aplikacja komunikuje się z API modelu LLM i generuje kandydatów na fiszki synchronicznie w postaci listy.
  - Kandydaci są prezentowani z opcjami: Accept, Edit, i Discard.
  - W przypadku problemów z API system wyświetla odpowiedni komunikat błędu i umożliwia ponowną próbę generowania.

### US-004: Bulk zapis zaakceptowanych fiszek
- Opis: Jako użytkownik chcę mieć możliwość zapisania wszystkich zaakceptowanych fiszek do bazy danych zbiorczo, aby usprawnić proces dodawania fiszek.
- Kryteria akceptacji:
  - Użytkownik może zaznaczyć zaakceptowane fiszki i zapisać je zbiorczo.
  - Zatwierdzone fiszki są poprawnie zapisywane w bazie danych.

### US-005: Zarządzanie kolekcjami fiszek
- Opis: Jako użytkownik chcę móc przeglądać, edytować i usuwać kolekcje fiszek, aby mieć porządek i łatwy dostęp do moich zestawów.
- Kryteria akceptacji:
  - Użytkownik może usunąć istniejącą kolekcję.
  - Użytkownik może przeglądać listę swoich kolekcji(sekcja/przycisk My Collections).
  - Użytkownik może dodawać, edytować i usuwać fiszki w obrębie danej kolekcji.
  - Każda fiszka musi przynależeć do przynajmniej jednej kolekcji.
  - Interfejs jest intuicyjny i spójny.

### US-006: Zarządzanie ustawieniami konta
- Opis: Jako użytkownik chcę mieć możliwość zmiany hasła oraz usunięcia konta, aby skutecznie zarządzać swoim profilem.
- Kryteria akceptacji:
  - Użytkownik ma dostęp do sekcji/przycisku Settings.
  - Użytkownik może zmienić swoje hasło.
  - Użytkownik może usunąć swoje konto.
  - Operacje są wspierane przez odpowiednie komunikaty potwierdzające skuteczność zmian.

### US-007: Przeglądanie i edycja kandydatów fiszek generowanych przez AI
- Opis: Jako użytkownik chcę mieć możliwość przeglądania i edycji kandydatów fiszek wygenerowanych przez AI, aby móc dostosować ich treść przed zatwierdzeniem.
- Kryteria akceptacji:
  - System prezentuje kandydatów fiszek z opcjami edycji, zatwierdzenia lub odrzucenia.
  - Użytkownik może modyfikować treść fiszek przed zapisaniem.
  - Zmiany są zapisywane i widoczne po edycji.

### US-008: Walidacja wprowadzanego tekstu
- Opis: Jako użytkownik chcę otrzymać informację, gdy wklejony tekst nie spełnia kryterium od 100 do 10000 znaków, aby system mógł odpowiednio obsłużyć błędy.
- Kryteria akceptacji:
  - System weryfikuje długość wprowadzanego tekstu.
  - Po przekroczeniu limitu wyświetlany jest wyraźny komunikat o błędzie.
  - Tekst nie jest przetwarzany, dopóki nie zostanie skorygowany.

### US-009: Sesja nauki z algorytmem powtórek
- Opis: Jako użytkownik chcę mieć możliwość uczenia się fiszek z wykorzystaniem algorytmu powtórek, aby efektywnie przyswajać wiedzę i śledzić swoje postępy (spaced repetition).
- Kryteria akceptacji:
  - System umożliwia rozpoczęcie sesji nauki z wybranej kolekcji fiszek(sekcja/przycisk Study).
  - Fiszki są prezentowane według zewnętrznego algorytmu powtórek (spaced repetition).
  - Na start wyświetlany jest przód fiszki, poprzez interakcję użytkownik wyświetla jej tył
  - Po każdej fiszce użytkownik może ocenić swoją znajomość materiału zgodnie z oczekiwaniami algorytmu na ile przyswoił fiszkę.
  - Następnie algorytm pokazuje kolejną fiszkę w ramach sesji nauki.
  - System dostosowuje częstotliwość pokazywania fiszek na podstawie ocen użytkownika.
  - Użytkownik może w dowolnym momencie zakończyć sesję nauki.
  - Postępy nauki są zapisywane i widoczne w profilu użytkownika.
  - System pokazuje statystyki sesji po jej zakończeniu (liczba przerobioych fiszek, procent poprawnych odpowiedzi).

### US-010: Bezpieczny dostęp i autoryzacja
- Opis: Jako użytkownik chcę mieć pewność, że moje konto jest bezpieczne i tylko ja mam do niego dostęp, aby chronić moje dane i postępy w nauce.
- Kryteria akceptacji:
  - Użytkownik musi potwierdzić swój adres email podczas rejestracji.
  - System umożliwia bezpieczne odzyskiwanie hasła poprzez email.
  - Tylko zalogowany użytkownik może wyświetlać, tworzyć, edytować i usuwać swoje fiszki.
  - Nie ma dostępu do fiszek innych użytkowników ani możliwości współdzielenia.

## 6. Metryki sukcesu
- Co najmniej 75% fiszek generowanych przez AI musi być zaakceptowanych przez użytkowników (mierzone poprzez logi oraz zapisy w bazie danych).
- Przynajmniej 75% fiszek w systemie powinno pochodzić z generowania przez AI.
- Wysoki poziom satysfakcji użytkowników dzięki intuicyjnemu i spójnemu interfejsowi.