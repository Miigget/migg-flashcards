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

// Validation schema for flashcard update
const flashcardUpdateSchema = z
  .object({
    front: z.string().max(200, "Front text cannot exceed 200 characters").optional(),
    back: z.string().max(500, "Back text cannot exceed 500 characters").optional(),
    collection: z.string().max(30, "Collection name cannot exceed 30 characters").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
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

export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
          status: 400,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate request body
    const validationBodyResult = flashcardUpdateSchema.safeParse(requestBody);
    if (!validationBodyResult.success) {
      const errorMessages = validationBodyResult.error.errors.map((err) => err.message).join("; ");
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: errorMessages,
          status: 400,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get validated update data
    const validatedUpdateData = validationBodyResult.data;

    // Create flashcard service and update the flashcard
    const flashcardService = new FlashcardService(supabase);

    try {
      const updatedFlashcard = await flashcardService.updateFlashcard(
        validatedFlashcardId,
        validatedUpdateData,
        DEFAULT_USER_ID // Using default user ID for development
      );

      // Return the updated flashcard data
      return new Response(JSON.stringify(updatedFlashcard), {
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
    console.error("Unexpected error in PUT /api/flashcards/[flashcard_id]:", error);

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

export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // Create flashcard service and delete the flashcard
    const flashcardService = new FlashcardService(supabase);

    try {
      await flashcardService.deleteFlashcard(
        validatedFlashcardId,
        DEFAULT_USER_ID // Using default user ID for development
      );

      // Return success response
      return new Response(
        JSON.stringify({
          message: "Flashcard deleted successfully",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
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
    console.error("Unexpected error in DELETE /api/flashcards/[flashcard_id]:", error);

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
