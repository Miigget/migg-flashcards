import type { APIRoute } from "astro";
import { z } from "zod";
import { flashcardGenerationService } from "../../../lib/services/flashcard-generation.service";
import type { AIGenerateFlashcardsCommand } from "../../../types";

// Schema for validating input
const generateFlashcardsSchema = z.object({
  text: z
    .string()
    .min(100, { message: "Text cannot be less than 100 characters" })
    .max(10000, { message: "Text cannot exceed 10,000 characters" }),
});

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Extract request body
    const body = (await request.json()) as AIGenerateFlashcardsCommand;

    // Validate input
    const validation = generateFlashcardsSchema.safeParse(body);

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

    // Generate flashcards using service
    const result = await flashcardGenerationService.generateFlashcards(validation.data.text);

    // Prepare and return response
    const responseData = {
      candidates: result.candidates,
      generation_id: result.generation_id,
      generated_count: result.generated_count,
    };

    return new Response(JSON.stringify(responseData), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating flashcards:", error);

    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while generating flashcards",
        status: 500,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
