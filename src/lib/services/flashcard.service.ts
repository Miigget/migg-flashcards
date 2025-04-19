import type { CreateFlashcardCommand, FlashcardDTO } from "../../types";
import type { SupabaseClientType } from "../../db/supabase.client";

/**
 * Custom error class for FlashcardService errors
 * Provides additional context about the error type
 */
export class FlashcardServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "VALIDATION_ERROR" | "DATABASE_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "UNKNOWN_ERROR",
    public readonly statusCode = 500,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "FlashcardServiceError";
  }
}

export class FlashcardService {
  constructor(private readonly supabase: SupabaseClientType) {}

  /**
   * Creates a new flashcard
   * @param command Data for creating the flashcard
   * @param userId Current user ID
   * @returns The created flashcard
   */
  async createFlashcard(command: CreateFlashcardCommand, userId: string): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .insert({
        front: command.front,
        back: command.back,
        collection: command.collection,
        source: "manual",
        user_id: userId,
        generation_id: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating flashcard:", error);
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    return data;
  }

  /**
   * Retrieves paginated flashcards for a user with optional filtering and sorting
   * @param userId Current user ID
   * @param page Page number (1-based)
   * @param limit Items per page
   * @param collection Optional collection name filter
   * @param sort Optional field to sort by
   * @param order Optional sort direction ('asc' or 'desc')
   * @returns Paginated flashcards with total count
   */
  async getFlashcards(
    userId: string,
    page: number,
    limit: number,
    collection?: string,
    sort = "created_at",
    order: "asc" | "desc" = "desc"
  ) {
    // Input validation
    if (!userId) {
      throw new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400);
    }

    if (page < 1) {
      throw new FlashcardServiceError("Page must be a positive integer", "VALIDATION_ERROR", 400);
    }

    if (limit < 1 || limit > 100) {
      throw new FlashcardServiceError("Limit must be between 1 and 100", "VALIDATION_ERROR", 400);
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    try {
      // Start building the query
      let query = this.supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

      // Apply collection filter if provided
      if (collection) {
        query = query.eq("collection", collection);
      }

      // Apply sorting
      query = query.order(sort, { ascending: order === "asc" });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Execute the query
      const { data, error, count } = await query;

      // Handle database errors
      if (error) {
        console.error("Database error when fetching flashcards:", error);

        // Format error message based on error code
        if (error.code === "42P01") {
          throw new FlashcardServiceError("Table 'flashcards' does not exist", "DATABASE_ERROR", 500, error);
        } else if (error.code === "42703") {
          throw new FlashcardServiceError(`Invalid column in query: ${error.message}`, "DATABASE_ERROR", 500, error);
        } else if (error.code?.startsWith("23")) {
          throw new FlashcardServiceError(`Constraint violation: ${error.message}`, "DATABASE_ERROR", 500, error);
        } else {
          throw new FlashcardServiceError(`Failed to fetch flashcards: ${error.message}`, "DATABASE_ERROR", 500, error);
        }
      }

      // Handle no results (return empty array instead of null)
      return {
        data: data || [],
        page,
        limit,
        total: count || 0,
      };
    } catch (error) {
      // Rethrow FlashcardServiceError instances
      if (error instanceof FlashcardServiceError) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error in getFlashcards:", error);
      throw new FlashcardServiceError(
        "An unexpected error occurred while fetching flashcards",
        "UNKNOWN_ERROR",
        500,
        error
      );
    }
  }
}

// Not exporting an instance as we'll use supabase from context.locals
