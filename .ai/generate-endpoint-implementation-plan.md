# API Endpoint Implementation Plan: POST /api/flashcards/generate

## 1. Przegląd punktu końcowego
Endpoint `/api/flashcards/generate` umożliwia generowanie kandydatów na fiszki przy użyciu sztucznej inteligencji na podstawie dostarczonego tekstu. Użytkownicy mogą przesłać tekst źródłowy (do 10 000 znaków), który zostanie przetworzony przez serwis AI w celu utworzenia zestawu fiszek do nauki. Wygenerowane kandydaty na fiszki są zwracane użytkownikowi wraz z identyfikatorem sesji generowania (`generation_id`) oraz liczbą wygenerowanych fiszek (`generated_count`).

## 2. Szczegóły żądania
- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards/generate`
- **Parametry**:
  - Wymagane: Brak parametrów URL
  - Opcjonalne: Brak parametrów URL
- **Request Body**:
  ```typescript
  {
    "text": string // Tekst wejściowy do generacji fiszek (max 10 000 znaków)
  }
  ```
- **Nagłówki**:
  - `Authorization`: Bearer token JWT (wymagany)
  - `Content-Type`: application/json

## 3. Wykorzystywane typy
```typescript
// Request types
import { AIGenerateFlashcardsCommand } from '../types';

// Response types
import { 
  FlashcardCandidateDto,
  GenerationDTO,
  GenerationErrorLogDTO 
} from '../types';

// Walidacja
import { z } from 'zod';

// Schema walidacji
const generateFlashcardsSchema = z.object({
  text: z.string()
    .min(1, { message: "Tekst nie może być pusty" })
    .max(10000, { message: "Tekst nie może przekraczać 10 000 znaków" })
});
```

## 4. Szczegóły odpowiedzi
- **Status Code**:
  - 201 Created: Pomyślnie wygenerowano kandydatów na fiszki
  - 400 Bad Request: Nieprawidłowe dane wejściowe
  - 401 Unauthorized: Brak autoryzacji
  - 500 Internal Server Error: Błąd podczas generowania fiszek
- **Response Body (Success)**:
  ```typescript
  {
    "candidates": FlashcardCandidateDto[], // Lista wygenerowanych kandydatów na fiszki
    "generation_id": string,              // ID sesji generowania
    "generated_count": number             // Liczba wygenerowanych fiszek
  }
  ```
- **Response Body (Error)**:
  ```typescript
  {
    "error": string,           // Krótki opis błędu
    "message": string,         // Szczegółowy opis błędu
    "status": number           // Kod statusu HTTP
  }
  ```

## 5. Przepływ danych
1. **Walidacja wejścia**:
   - Sprawdzenie czy tekst źródłowy spełnia wymagania (niepusty, max 10 000 znaków)
   
2. **Utworzenie wpisu w tabeli generations**:
   - Generacja hasha tekstu źródłowego
   - Zapisanie metadanych generacji w tabeli `generations`
   
3. **Wywołanie usługi AI**:
   - Przesłanie tekstu do API OpenRouter.ai
   - Monitorowanie czasu generacji
   
4. **Przetwarzanie odpowiedzi AI**:
   - Parsowanie wygenerowanych kandydatów na fiszki
   - Walidacja wygenerowanych danych
   
5. **Aktualizacja rekordu generacji**:
   - Uzupełnienie informacji o liczbie wygenerowanych fiszek i czasie generacji
   
6. **Zwrócenie odpowiedzi**:
   - Zwrócenie listy kandydatów wraz z `generation_id` i `generated_count`

## 6. Względy bezpieczeństwa
1. **Uwierzytelnianie**:
   - Middleware Supabase sprawdza ważność tokenu JWT w nagłówku Authorization
   - Endpoint dostępny tylko dla zalogowanych użytkowników
   
2. **Autoryzacja**:
   - Użycie `context.locals.supabase` zamiast bezpośredniego importu `supabaseClient`
   - RLS (Row Level Security) na poziomie bazy danych zapewnia dostęp tylko do własnych danych
   
3. **Walidacja danych**:
   - Walidacja tekstu wejściowego przy użyciu Zod
   - Sanityzacja danych przed przesłaniem do serwisu AI
   
4. **Kontrola kosztów**:
   - Implementacja limitów wywołań na użytkownika lub mechanizmu kredytowego
   - Monitoring użycia API OpenRouter.ai

## 7. Obsługa błędów
1. **Błędy walidacji (400 Bad Request)**:
   - Pusty tekst wejściowy
   - Tekst przekraczający 10 000 znaków
   
2. **Błędy autoryzacji (401 Unauthorized)**:
   - Brak tokenu JWT
   - Nieprawidłowy lub wygasły token
   
3. **Błędy serwisu AI (500 Internal Server Error)**:
   - Niedostępność serwisu OpenRouter.ai
   - Przekroczenie limitu API
   - Błędy podczas generowania fiszek
   
4. **Rejestrowanie błędów**:
   - Zapisywanie błędów w tabeli `generation_error_logs`
   - Rejestrowanie metadanych: user_id, model, source_text_hash, source_text_length, error_code, error_message

## 8. Rozważania dotyczące wydajności
1. **Obsługa długotrwałych żądań**:
   - Generowanie fiszek może trwać kilka sekund lub dłużej
   - Zastosowanie strategii odpowiedniego timeoutu dla żądań HTTP (np. 60 sekund)
   
2. **Buforowanie**:
   - Implementacja buforowania identycznych żądań (na podstawie hasha tekstu)
   - Możliwość ponownego wykorzystania wyników z poprzednich generacji

3. **Przetwarzanie wsadowe**:
   - Grupowanie podobnych żądań w celu optymalizacji wywołań API AI

## 9. Etapy wdrożenia
1. **Utworzenie pliku endpointu**:
   ```
   src/pages/api/flashcards/generate.ts
   ```

2. **Utworzenie serwisu generacji fiszek**:
    - Integruje się z zewnętrznym serwisem AI. Na etapie developmentu skorzystamy z mocków zamiast wywoływania serwisu AI.
   ```
   src/lib/services/flashcard_generation.service.ts
   ```

3. **Implementacja walidacji danych wejściowych**:
   - Zdefiniowanie schematu Zod
   - Utworzenie funkcji walidacyjnych

4. **Implementacja obsługi endpointu**:
   - Implementacja handlera POST
   - Integracja z serwisami
   - Implementacja funkcji pomocniczych

5. **Implementacja rejestrowania błędów**:
   - Utworzenie funkcji do zapisywania błędów w tabeli `generation_error_logs`

6. **Implementacja mechanizmu komunikacji z OpenRouter.ai**:
   - Integracja z API OpenRouter.ai
   - Implementacja obsługi odpowiedzi

## 10. Struktura plików
```
src/
├── pages/
│   └── api/
│       └── flashcards/
│           └── generate.ts             # Endpoint handler
├── lib/
│   ├── services/
│   │   └── flashcard-generation.service.ts  # Logika biznesowa generacji fiszek
│   └── utils/
│       └── error-logging.ts            # Funkcje do rejestrowania błędów
└── types.ts                            # Definicje typów (już istniejące)
```
