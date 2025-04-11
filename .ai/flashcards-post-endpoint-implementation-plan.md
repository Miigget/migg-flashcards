# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego
Endpoint POST /api/flashcards umożliwia tworzenie nowych fiszek ręcznie przez uwierzytelnionego użytkownika. Fiszki te są zapisywane w tabeli `flashcards` z parametrem `source` ustawionym na wartość "manual".

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: /api/flashcards
- Parametry:
  - Wymagane: 
    - `front`: Tekst frontowy fiszki (maksymalnie 200 znaków)
    - `back`: Tekst tylny fiszki (maksymalnie 500 znaków)
    - `collection`: Nazwa kolekcji (niepusta)
    - `source`: Musi być ustawione na "manual"
- Request Body: 
  ```json
  {
    "front": "Front text (up to 200 characters)",
    "back": "Back text (up to 500 characters)",
    "collection": "Collection name",
    "source": "manual"
  }
  ```

## 3. Wykorzystywane typy
- **CreateFlashcardCommand**: Typ wejściowy definiujący strukturę żądania
- **FlashcardDTO**: Typ wyjściowy reprezentujący zapisaną fiszkę z danymi z bazy

## 4. Szczegóły odpowiedzi
- Kod statusu: 201 Created
- Response Body:
  ```json
  {
    "flashcard_id": 1,
    "user_id": "user_uuid",
    "front": "Front text",
    "back": "Back text",
    "collection": "Collection name",
    "source": "manual",
    "generation_id": null,
    "created_at": "2023-09-01T12:00:00.000Z",
    "updated_at": "2023-09-01T12:00:00.000Z"
  }
  ```

## 5. Przepływ danych
1. Żądanie dociera do endpointu `/api/flashcards` z metodą POST
2. Middleware dodaje obiekt `supabase` do `context.locals`
3. Kontroler parsuje dane wejściowe z body
4. Kontroler waliduje dane przy użyciu Zod
5. Dane są przekazywane do serwisu zarządzającego fiszkami
6. Serwis dodaje `user_id` z bieżącego uwierzytelnionego użytkownika
7. Serwis zapisuje dane w tabeli `flashcards`
8. Kontroler zwraca zapisaną fiszkę z kodem statusu 201

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagane jest uwierzytelnienie użytkownika poprzez Supabase Auth
- **Autoryzacja**: Row-Level Security (RLS) w Supabase zapewnia, że użytkownicy mogą tworzyć fiszki tylko we własnym zakresie
- **Walidacja**: Wszystkie dane wejściowe są walidowane pod kątem długości i poprawności wartości
- **Sanityzacja**: Dane są sanityzowane przez ORM Supabase, co chroni przed atakami SQL Injection

## 7. Obsługa błędów
- **400 Bad Request**:
  - Brakujące wymagane pola
  - Za długi tekst na froncie (> 200 znaków)
  - Za długi tekst na tylnej stronie (> 500 znaków)
  - Pusta nazwa kolekcji
  - Źródło inne niż "manual"
- **401 Unauthorized**:
  - Użytkownik nie jest uwierzytelniony
- **500 Internal Server Error**:
  - Problemy z połączeniem z bazą danych
  - Inne nieoczekiwane błędy serwera

## 8. Rozważania dotyczące wydajności
- Endpoint jest prosty i nie powinien mieć problemów z wydajnością
- Baza danych ma indeksy na odpowiednich kolumnach (user_id, collection)
- Walidacja danych jest wykonywana wcześnie, aby uniknąć niepotrzebnego przetwarzania nieprawidłowych danych

## 9. Etapy wdrożenia

### 1. Utworzenie serwisu flashcard.service.ts
```typescript
// src/lib/services/flashcard.service.ts
import type { CreateFlashcardCommand, FlashcardDTO } from "../../types";
import type { SupabaseClientType } from "../../db/supabase.client";

export class FlashcardService {
  constructor(private readonly supabase: SupabaseClientType) {}

  /**
   * Creates a new flashcard
   * @param command Data for creating the flashcard
   * @param userId Current user ID
   * @returns The created flashcard
   */
  async createFlashcard(command: CreateFlashcardCommand, userId: string): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .insert({
        front: command.front,
        back: command.back,
        collection: command.collection,
        source: "manual",
        user_id: userId,
        generation_id: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating flashcard:", error);
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    return data;
  }
}

// Nie eksportujemy instancji jak w generation service, 
// ponieważ będziemy używać supabase z context.locals
```

### 2. Utworzenie pliku API endpoint
```typescript
// src/pages/api/flashcards/index.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import type { CreateFlashcardCommand } from "../../../types";

// Schema walidacyjne dla tworzenia fiszki
const createFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, { message: "Front text cannot be empty" })
    .max(200, { message: "Front text cannot exceed 200 characters" }),
  back: z
    .string()
    .min(1, { message: "Back text cannot be empty" })
    .max(500, { message: "Back text cannot exceed 500 characters" }),
  collection: z
    .string()
    .min(1, { message: "Collection name cannot be empty" }),
  source: z
    .literal("manual")
    .default("manual"),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Sprawdzenie uwierzytelnienia
    const supabase = locals.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to create flashcards",
          status: 401,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ekstrakcja body żądania
    const body = (await request.json()) as CreateFlashcardCommand;

    // Walidacja danych wejściowych
    const validation = createFlashcardSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: validation.error.format(),
          status: 400,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Tworzenie fiszki przy użyciu serwisu
    const flashcardService = new FlashcardService(supabase);
    const flashcard = await flashcardService.createFlashcard(
      validation.data, 
      session.user.id
    );

    // Zwrócenie odpowiedzi
    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating flashcard:", error);

    // Obsługa nieoczekiwanych błędów
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while creating the flashcard",
        status: 500,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### 3. Dokumentacja
Dodaj dokumentację endpointu do dokumentacji API projektu, zawierającą:
- Przykład użycia z curl/Postman
- Przykłady danych wejściowych i odpowiedzi
- Listę możliwych kodów błędów i ich znaczenie 