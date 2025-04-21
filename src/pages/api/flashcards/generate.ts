import type { APIRoute } from "astro";
import { flashcardGenerationService } from "../../../lib/services/flashcard-generation.service";
import { z } from "zod";

// Validation schema for the request body
const generateFlashcardsSchema = z.object({
  text: z
    .string()
    .min(100, { message: "Text cannot be less than 100 characters" })
    .max(10000, { message: "Text cannot exceed 10,000 characters" }),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = generateFlashcardsSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generate flashcards
    const result = await flashcardGenerationService.generateFlashcards(validationResult.data.text);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating flashcards:", error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: "Failed to generate flashcards",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

// Disable pre-rendering for this API route
export const prerender = false;
