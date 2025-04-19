import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService, FlashcardServiceError } from "../../../lib/services/flashcard.service";
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

// Validation schema for GET flashcards query params
const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  collection: z.string().optional(),
  sort: z.string().optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// List of valid sort fields for flashcards
const validSortFields = ["created_at", "updated_at", "front", "back", "collection"];

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

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get URL to extract query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    // Validate query parameters
    const validation = getFlashcardsQuerySchema.safeParse(queryParams);

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

    // Extract validated parameters
    const { page, limit, collection, sort, order } = validation.data;

    // Validate sort field
    if (sort && !validSortFields.includes(sort)) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: `Invalid sort field. Valid options are: ${validSortFields.join(", ")}`,
          status: 400,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

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

    // Create service and fetch flashcards
    const flashcardService = new FlashcardService(supabase);

    try {
      const result = await flashcardService.getFlashcards(
        DEFAULT_USER_ID, // Using default user ID for development
        page,
        limit,
        collection,
        sort,
        order
      );

      // Check if the result has the expected structure
      if (!result || !Array.isArray(result.data)) {
        throw new FlashcardServiceError("Invalid response format from flashcard service", "UNKNOWN_ERROR", 500);
      }

      // Return paginated response
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      console.error("Error in flashcard service:", serviceError);

      // Handle service-specific errors
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
    console.error("Error fetching flashcards:", error);

    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while fetching flashcards",
        status: 500,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
