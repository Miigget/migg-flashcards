import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import type { CreateFlashcardCommand } from "../../../types";

// Validation schema for flashcard creation
const createFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, { message: "Front text cannot be empty" })
    .max(200, { message: "Front text cannot exceed 200 characters" }),
  back: z
    .string()
    .min(1, { message: "Back text cannot be empty" })
    .max(500, { message: "Back text cannot exceed 500 characters" }),
  collection: z.string().min(1, { message: "Collection name cannot be empty" }),
  source: z.literal("manual").default("manual"),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get supabase client from locals
    const supabase = locals.supabase;

    // Extract request body
    const body = (await request.json()) as CreateFlashcardCommand;

    // Validate input data
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

    // Create flashcard using service
    const flashcardService = new FlashcardService(supabase);
    const validatedData: CreateFlashcardCommand = {
      front: validation.data.front,
      back: validation.data.back,
      collection: validation.data.collection,
      source: "manual",
    };

    // Use DEFAULT_USER_ID for development instead of requiring authentication
    const flashcard = await flashcardService.createFlashcard(validatedData, DEFAULT_USER_ID);

    // Return response
    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating flashcard:", error);

    // Handle unexpected errors
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
