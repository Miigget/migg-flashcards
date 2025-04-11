import type { CreateFlashcardCommand, FlashcardDTO } from "../../types";
import type { SupabaseClientType } from "../../db/supabase.client";

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
}

// Not exporting an instance as we'll use supabase from context.locals
