import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardServiceError } from "../../../lib/services/flashcard.service";
import { FlashcardsBulkService } from "../../../lib/services/flashcards-bulk.service";
import type { BulkCreateFlashcardsCommand, FlashcardCandidateDto } from "../../../types";

// Validation schema for a single flashcard candidate (input from request)
const flashcardInputSchema = z.object({
  front: z
    .string()
    .min(1, { message: "Front text cannot be empty" })
    .max(200, { message: "Front text cannot exceed 200 characters" }),
  back: z
    .string()
    .min(1, { message: "Back text cannot be empty" })
    .max(500, { message: "Back text cannot exceed 500 characters" }),
  collection: z.string().min(1, { message: "Collection name cannot be empty" }),
  source: z.enum(["ai-full", "ai-edited"], {
    message: "Source must be 'ai-full' or 'ai-edited' for bulk creation",
  }),
  // Keep generation_id as string for input validation (matching client)
  generation_id: z.string().min(1, { message: "Generation ID is required" }),
});

// Validation schema for the bulk creation command (array of inputs)
const bulkCreateFlashcardsSchema = z
  .array(flashcardInputSchema)
  .min(1, {
    message: "At least one flashcard must be provided",
  })
  .max(100, {
    message: "Maximum 100 flashcards can be created in a single request",
  });

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get supabase client from locals
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

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Extract request body
    const body = (await request.json()) as BulkCreateFlashcardsCommand;

    // Validate input data
    const validation = bulkCreateFlashcardsSchema.safeParse(body);

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

    // Create flashcards using the bulk service
    const flashcardsBulkService = new FlashcardsBulkService(supabase);
    const validatedInputs = validation.data; // Rename for clarity

    // Map validated inputs to FlashcardCandidateDto[], adding missing fields and converting types
    const now = new Date().toISOString();
    const candidatesToCreate: FlashcardCandidateDto[] = validatedInputs.map((input) => ({
      front: input.front,
      back: input.back,
      collection: input.collection,
      source: input.source,
      // Convert generation_id from string to number here
      generation_id: parseInt(input.generation_id, 10),
      user_id: user.id,
      created_at: now,
      updated_at: now,
      flashcard_id: 0,
      status: "candidate",
    }));

    // Use the authenticated user's ID and the mapped DTOs
    const result = await flashcardsBulkService.bulkCreateFlashcards(candidatesToCreate, user.id);

    // Return response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating flashcards in bulk:", error);

    // Handle service-specific errors
    if (error instanceof FlashcardServiceError) {
      return new Response(
        JSON.stringify({
          error: error.code,
          message: error.message,
          status: error.statusCode,
        }),
        { status: error.statusCode, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while creating flashcards in bulk",
        status: 500,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
