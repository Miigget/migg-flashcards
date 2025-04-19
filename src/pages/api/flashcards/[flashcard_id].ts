import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService, FlashcardServiceError } from "../../../lib/services/flashcard.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

// Validation schema for flashcard_id parameter
const flashcardIdSchema = z.coerce.number().int().positive({
  message: "Flashcard ID must be a positive integer",
});

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Extract flashcard_id from params
    const { flashcard_id } = params;

    // Validate flashcard_id
    const validationResult = flashcardIdSchema.safeParse(flashcard_id);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid flashcard ID format. It must be a positive integer.",
          status: 400,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get validated flashcard_id
    const validatedFlashcardId = validationResult.data;

    // Get supabase client from context
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Database client is not available",
          status: 500,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create flashcard service and fetch the requested flashcard
    const flashcardService = new FlashcardService(supabase);

    try {
      const flashcard = await flashcardService.getFlashcardById(
        validatedFlashcardId,
        DEFAULT_USER_ID // Using default user ID for development
      );

      // Return the flashcard data
      return new Response(JSON.stringify(flashcard), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      console.error("Error in flashcard service:", serviceError);

      // Handle specific service errors with appropriate status codes
      if (serviceError instanceof FlashcardServiceError) {
        return new Response(
          JSON.stringify({
            error: serviceError.code,
            message: serviceError.message,
            status: serviceError.statusCode,
          }),
          { status: serviceError.statusCode, headers: { "Content-Type": "application/json" } }
        );
      }

      // Handle other errors
      return new Response(
        JSON.stringify({
          error: "Service Error",
          message: serviceError instanceof Error ? serviceError.message : "An error occurred in the flashcard service",
          status: 500,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/flashcards/[flashcard_id]:", error);

    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while processing your request",
        status: 500,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
