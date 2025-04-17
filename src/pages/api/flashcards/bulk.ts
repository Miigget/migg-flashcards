import type { APIRoute } from "astro";
import { z } from "zod";
import type { BulkCreateFlashcardsCommand } from "../../../types";

// Schema dla walidacji pojedynczej fiszki
const flashcardSchema = z.object({
  front: z
    .string()
    .min(1, { message: "Front side cannot be empty" })
    .max(200, { message: "Front side cannot exceed 200 characters" }),
  back: z
    .string()
    .min(1, { message: "Back side cannot be empty" })
    .max(500, { message: "Back side cannot exceed 500 characters" }),
  collection: z.string().min(1, { message: "Collection name is required" }),
  source: z.literal("manual"),
});

// Schema dla walidacji zbiorczych fiszek
const bulkFlashcardsSchema = z
  .array(flashcardSchema)
  .min(1, { message: "At least one flashcard is required" })
  .max(100, { message: "Cannot save more than 100 flashcards at once" });

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parsowanie ciała żądania
    const body = (await request.json()) as BulkCreateFlashcardsCommand;

    // Walidacja danych wejściowych
    const validation = bulkFlashcardsSchema.safeParse(body);

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

    // Symulacja zapisywania wielu fiszek
    const savedFlashcards = validation.data.map((flashcard, index) => ({
      id: `flashcard-${Date.now()}-${index}`,
      ...flashcard,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Symulacja opóźnienia odpowiedzi API
    await new Promise((resolve) => setTimeout(resolve, 800));

    return new Response(
      JSON.stringify({
        success: true,
        saved_count: savedFlashcards.length,
        flashcards: savedFlashcards,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error saving flashcards:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while saving flashcards",
        status: 500,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
