import type { FlashcardCandidateDto, FlashcardDTO } from "../../types";
import type { SupabaseClientType } from "../../db/supabase.client";
import { FlashcardServiceError } from "./flashcard.service";

/**
 * Service for handling bulk operations with flashcards
 */
export class FlashcardsBulkService {
  constructor(private readonly supabase: SupabaseClientType) {}

  /**
   * Creates multiple flashcards in a single transaction
   * @param flashcards Array of flashcard candidates to create
   * @param userId Current user ID
   * @returns The created flashcards
   * @throws FlashcardServiceError for validation or database errors
   */
  async bulkCreateFlashcards(
    flashcards: FlashcardCandidateDto[],
    userId: string
  ): Promise<{ data: FlashcardDTO[]; status: string }> {
    // Input validation
    if (!userId) {
      throw new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400);
    }

    if (!flashcards?.length) {
      throw new FlashcardServiceError("At least one flashcard must be provided", "VALIDATION_ERROR", 400);
    }

    try {
      // Prepare the data for insertion
      const flashcardsToInsert = flashcards.map((flashcard) => ({
        front: flashcard.front,
        back: flashcard.back,
        collection: flashcard.collection,
        source: flashcard.source,
        generation_id: flashcard.generation_id,
        user_id: userId,
      }));

      // Execute bulk insert within a transaction
      const { data, error } = await this.supabase.from("flashcards").insert(flashcardsToInsert).select();

      if (error) {
        console.error("Error creating flashcards in bulk:", error);

        // Check specific error conditions
        if (error.code === "23503") {
          throw new FlashcardServiceError(
            "Foreign key constraint violation: referenced generation may not exist",
            "VALIDATION_ERROR",
            400,
            error
          );
        } else if (error.code?.startsWith("23")) {
          throw new FlashcardServiceError(`Constraint violation: ${error.message}`, "VALIDATION_ERROR", 400, error);
        } else {
          throw new FlashcardServiceError(
            `Failed to create flashcards in bulk: ${error.message}`,
            "DATABASE_ERROR",
            500,
            error
          );
        }
      }

      return {
        data: data || [],
        status: "Created flashcards successfully",
      };
    } catch (error) {
      // Rethrow FlashcardServiceError instances
      if (error instanceof FlashcardServiceError) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error in bulkCreateFlashcards:", error);
      throw new FlashcardServiceError(
        "An unexpected error occurred while creating flashcards in bulk",
        "UNKNOWN_ERROR",
        500,
        error
      );
    }
  }
}
