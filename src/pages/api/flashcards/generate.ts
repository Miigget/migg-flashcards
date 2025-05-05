import type { APIRoute } from "astro";
import { FlashcardGenerationService } from "../../../lib/services/flashcard-generation.service";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

// Validation schema for the request body
const generateFlashcardsSchema = z.object({
  text: z
    .string()
    .min(100, { message: "Text cannot be less than 100 characters" })
    .max(10000, { message: "Text cannot exceed 10,000 characters" }),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server client instance for this request
    const supabase = createSupabaseServerInstance({ headers: request.headers, cookies });

    // Optional: Check user authentication if needed before proceeding
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

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

    // Create an instance of the service, passing the Supabase client and user ID
    const serviceInstance = new FlashcardGenerationService(supabase, user.id);

    // Generate flashcards using the service instance
    const result = await serviceInstance.generateFlashcards(validationResult.data.text);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
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
