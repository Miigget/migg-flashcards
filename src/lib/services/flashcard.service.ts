import type { CreateFlashcardCommand, FlashcardDTO, UpdateFlashcardCommand } from "../../types";
import type { createSupabaseServerInstance } from "../../db/supabase.client";

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

// Define the type based on the return type of the factory function
type SupabaseClientType = ReturnType<typeof createSupabaseServerInstance>;

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
      // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error("Unexpected error in getFlashcards:", error);
      throw new FlashcardServiceError(
        "An unexpected error occurred while fetching flashcards",
        "UNKNOWN_ERROR",
        500,
        error
      );
    }
  }

  /**
   * Retrieves a single flashcard by ID
   * @param flashcardId ID of the flashcard to retrieve
   * @param userId Current user ID
   * @returns The requested flashcard
   * @throws FlashcardServiceError if flashcard not found or other errors occur
   */
  async getFlashcardById(flashcardId: number, userId: string): Promise<FlashcardDTO> {
    // Input validation
    if (!userId) {
      throw new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400);
    }

    if (!flashcardId || flashcardId <= 0) {
      throw new FlashcardServiceError("Valid flashcard ID is required", "VALIDATION_ERROR", 400);
    }

    try {
      // Query the database for the specific flashcard
      const { data, error } = await this.supabase
        .from("flashcards")
        .select("*")
        .eq("flashcard_id", flashcardId)
        .eq("user_id", userId)
        .single();

      // Handle database errors
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching flashcard by ID:", error);

        // Handle not found specifically
        if (error.code === "PGRST116") {
          throw new FlashcardServiceError(
            "The requested flashcard was not found or you don't have access to it",
            "NOT_FOUND",
            404,
            error
          );
        }

        // Handle other database-specific errors
        if (error.code === "42P01") {
          throw new FlashcardServiceError("Table 'flashcards' does not exist", "DATABASE_ERROR", 500, error);
        } else if (error.code?.startsWith("23")) {
          throw new FlashcardServiceError(`Constraint violation: ${error.message}`, "DATABASE_ERROR", 500, error);
        } else {
          throw new FlashcardServiceError(`Database error: ${error.message}`, "DATABASE_ERROR", 500, error);
        }
      }

      if (!data) {
        throw new FlashcardServiceError("Flashcard not found", "NOT_FOUND", 404);
      }

      return data;
    } catch (error) {
      // Rethrow FlashcardServiceError instances
      if (error instanceof FlashcardServiceError) {
        throw error;
      }

      // Handle unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in getFlashcardById:", error);
      throw new FlashcardServiceError(
        "An unexpected error occurred while fetching the flashcard",
        "UNKNOWN_ERROR",
        500,
        error
      );
    }
  }

  /**
   * Updates an existing flashcard
   * @param flashcardId ID of the flashcard to update
   * @param command Data for updating the flashcard
   * @param userId Current user ID
   * @returns The updated flashcard
   * @throws FlashcardServiceError if flashcard not found or other errors occur
   */
  async updateFlashcard(flashcardId: number, command: UpdateFlashcardCommand, userId: string): Promise<FlashcardDTO> {
    // Input validation
    if (!userId) {
      throw new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400);
    }

    if (!flashcardId || flashcardId <= 0) {
      throw new FlashcardServiceError("Valid flashcard ID is required", "VALIDATION_ERROR", 400);
    }

    // Ensure there's at least one field to update
    if (Object.keys(command).length === 0) {
      throw new FlashcardServiceError("At least one field must be provided for update", "VALIDATION_ERROR", 400);
    }

    try {
      // First check if the flashcard exists and belongs to the user
      const { data: existingFlashcard, error: checkError } = await this.supabase
        .from("flashcards")
        .select("flashcard_id")
        .eq("flashcard_id", flashcardId)
        .eq("user_id", userId)
        .single();

      if (checkError) {
        if (checkError.code === "PGRST116") {
          throw new FlashcardServiceError(
            "The flashcard was not found or you don't have permission to update it",
            "NOT_FOUND",
            404,
            checkError
          );
        }
        throw new FlashcardServiceError(`Database error: ${checkError.message}`, "DATABASE_ERROR", 500, checkError);
      }

      if (!existingFlashcard) {
        throw new FlashcardServiceError("Flashcard not found", "NOT_FOUND", 404);
      }

      // Perform the update
      const { data, error } = await this.supabase
        .from("flashcards")
        .update({
          ...(command.front !== undefined && { front: command.front }),
          ...(command.back !== undefined && { back: command.back }),
          ...(command.collection !== undefined && { collection: command.collection }),
          ...(command.source !== undefined && { source: command.source }),
        })
        .eq("flashcard_id", flashcardId)
        .eq("user_id", userId)
        .select()
        .single();

      // Handle database errors
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error updating flashcard:", error);

        if (error.code === "42P01") {
          throw new FlashcardServiceError("Table 'flashcards' does not exist", "DATABASE_ERROR", 500, error);
        } else if (error.code?.startsWith("23")) {
          throw new FlashcardServiceError(`Constraint violation: ${error.message}`, "DATABASE_ERROR", 500, error);
        } else {
          throw new FlashcardServiceError(`Database error: ${error.message}`, "DATABASE_ERROR", 500, error);
        }
      }

      if (!data) {
        throw new FlashcardServiceError("Failed to update flashcard", "DATABASE_ERROR", 500);
      }

      return data;
    } catch (error) {
      // Rethrow FlashcardServiceError instances
      if (error instanceof FlashcardServiceError) {
        throw error;
      }

      // Handle unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in updateFlashcard:", error);
      throw new FlashcardServiceError(
        "An unexpected error occurred while updating the flashcard",
        "UNKNOWN_ERROR",
        500,
        error
      );
    }
  }

  /**
   * Deletes a flashcard by ID
   * @param flashcardId ID of the flashcard to delete
   * @param userId Current user ID
   * @returns void
   * @throws FlashcardServiceError if flashcard not found or other errors occur
   */
  async deleteFlashcard(flashcardId: number, userId: string): Promise<void> {
    // Input validation
    if (!userId) {
      throw new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400);
    }

    if (!flashcardId || flashcardId <= 0) {
      throw new FlashcardServiceError("Valid flashcard ID is required", "VALIDATION_ERROR", 400);
    }

    try {
      // First check if the flashcard exists and belongs to the user
      const { data: existingFlashcard, error: checkError } = await this.supabase
        .from("flashcards")
        .select("flashcard_id")
        .eq("flashcard_id", flashcardId)
        .eq("user_id", userId)
        .single();

      if (checkError) {
        if (checkError.code === "PGRST116") {
          throw new FlashcardServiceError(
            "The flashcard was not found or you don't have permission to delete it",
            "NOT_FOUND",
            404,
            checkError
          );
        }
        throw new FlashcardServiceError(`Database error: ${checkError.message}`, "DATABASE_ERROR", 500, checkError);
      }

      if (!existingFlashcard) {
        throw new FlashcardServiceError("Flashcard not found", "NOT_FOUND", 404);
      }

      // Perform the delete operation
      const { error } = await this.supabase
        .from("flashcards")
        .delete()
        .eq("flashcard_id", flashcardId)
        .eq("user_id", userId);

      // Handle database errors
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error deleting flashcard:", error);

        if (error.code === "42P01") {
          throw new FlashcardServiceError("Table 'flashcards' does not exist", "DATABASE_ERROR", 500, error);
        } else if (error.code?.startsWith("23")) {
          throw new FlashcardServiceError(`Constraint violation: ${error.message}`, "DATABASE_ERROR", 500, error);
        } else {
          throw new FlashcardServiceError(`Database error: ${error.message}`, "DATABASE_ERROR", 500, error);
        }
      }
    } catch (error) {
      // Rethrow FlashcardServiceError instances
      if (error instanceof FlashcardServiceError) {
        throw error;
      }

      // Handle unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in deleteFlashcard:", error);
      throw new FlashcardServiceError(
        "An unexpected error occurred while deleting the flashcard",
        "UNKNOWN_ERROR",
        500,
        error
      );
    }
  }
}

// Not exporting an instance as we'll use supabase from context.locals
