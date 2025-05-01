import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService, FlashcardServiceError } from "../../../lib/services/flashcard.service";
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
    // Get supabase client and user from locals
    const supabase = locals.supabase;
    const user = locals.user;

    // --- Authentication Check ---
    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "User must be logged in to create flashcards." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const userId = user.id;
    // ---------------------------

    const body = (await request.json()) as CreateFlashcardCommand;
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

    const flashcardService = new FlashcardService(supabase);
    const validatedData: CreateFlashcardCommand = validation.data;

    const flashcard = await flashcardService.createFlashcard(validatedData, userId);

    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating flashcard:", error);

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
    // Get supabase client and user from locals
    const supabase = locals.supabase;
    const user = locals.user;

    // --- Authentication Check ---
    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "User must be logged in to view flashcards." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const userId = user.id;
    // ---------------------------

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
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

    const { page, limit, collection, sort, order } = validation.data;

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

    const flashcardService = new FlashcardService(supabase);

    try {
      const result = await flashcardService.getFlashcards(userId, page, limit, collection, sort, order);

      if (!result || !Array.isArray(result.data)) {
        throw new FlashcardServiceError("Invalid response format from flashcard service", "UNKNOWN_ERROR", 500);
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      console.error("Error in flashcard service:", serviceError);

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
