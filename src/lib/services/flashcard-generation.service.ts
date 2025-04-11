import * as crypto from "crypto";
// @ts-expect-error: Path resolution issue - this will be fixed in project setup
import type { FlashcardCandidateDto } from "../../../types";
import { createClient, DEFAULT_USER_ID } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";

type GenerationRecord = Database["public"]["Tables"]["generations"]["Row"];

interface GenerateFlashcardsResult {
  candidates: FlashcardCandidateDto[];
  generation_id: string;
  generated_count: number;
}

class FlashcardGenerationService {
  /**
   * Generates flashcard candidates using AI based on provided text
   * @param text - Source text for flashcard generation
   * @returns Generated flashcard candidates, generation ID, and count
   */
  async generateFlashcards(text: string): Promise<GenerateFlashcardsResult> {
    try {
      // 1. Create a hash of input text for tracking duplicates
      const textHash = this.generateHash(text);

      // 2. Create entry in generations table
      const generation = await this.createGenerationRecord(textHash, text.length);

      // 3. Call AI service (mocked during development)
      const startTime = Date.now();
      const candidates = await this.callAIService(text);
      const generationTimeMs = Date.now() - startTime;

      // Assign the generated generation_id to each candidate
      const updatedCandidates = candidates.map((candidate) => {
        const updatedCandidate = {
          ...candidate,
          generation_id: generation.generation_id,
        };
        return updatedCandidate;
      });

      // 4. Update generation record with results
      await this.updateGenerationRecord(generation.generation_id, updatedCandidates.length, generationTimeMs);

      // 5. Create return object
      const result = {
        candidates: updatedCandidates,
        generation_id: generation.generation_id.toString(),
        generated_count: updatedCandidates.length,
      };

      // Return result
      return result;
    } catch (error) {
      // Log error
      console.error("Error during flashcard generation:", error);
      await this.logGenerationError(error, this.generateHash(text), text.length);
      throw error;
    }
  }

  /**
   * Generates a hash for the input text using MD5
   */
  private generateHash(text: string): string {
    return crypto.createHash("md5").update(text).digest("hex");
  }

  /**
   * Creates a record in the generations table
   */
  private async createGenerationRecord(textHash: string, textLength: number): Promise<GenerationRecord> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("generations")
      .insert({
        user_id: DEFAULT_USER_ID,
        source_text_hash: textHash,
        source_text_length: textLength,
        model: "openrouter.ai", // Default model
        generated_count: 0,
        generation_duration: 0, // Initialize with 0 instead of null
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating generation record:", error);
      throw new Error(`Failed to create generation record: ${error.message}`);
    }

    return data;
  }

  /**
   * Updates the generation record with results
   */
  private async updateGenerationRecord(
    generationId: number,
    generatedCount: number,
    generationTimeMs: number
  ): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("generations")
      .update({
        generated_count: generatedCount,
        generation_duration: generationTimeMs,
      })
      .eq("generation_id", generationId);

    if (error) {
      console.error("Error updating generation record:", error);
      throw new Error(`Failed to update generation record: ${error.message}`);
    }
  }

  /**
   * Logs an error that occurred during generation
   */
  private async logGenerationError(error: unknown, sourceTextHash: string, sourceTextLength: number): Promise<void> {
    const supabase = createClient();

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error instanceof Error && "code" in error ? String((error as Record<string, unknown>).code) : "UNKNOWN_ERROR";

    await supabase.from("generation_error_logs").insert({
      user_id: DEFAULT_USER_ID,
      error_code: errorCode,
      error_message: errorMessage,
      model: "openrouter.ai",
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Calls the AI service to generate flashcards
   * This is a mock implementation returning sample data
   */
  private async callAIService(_inputText: string): Promise<FlashcardCandidateDto[]> {
    // Create a timestamp for all flashcards
    const now = new Date().toISOString();

    // Return 3 sample flashcards
    return [
      {
        user_id: DEFAULT_USER_ID,
        front: "What is the capital of France?",
        back: "Paris",
        source: "ai-full",
        collection: "default",
        created_at: now,
        updated_at: now,
        flashcard_id: 0,
        generation_id: null,
      },
      {
        user_id: DEFAULT_USER_ID,
        front: "Who wrote 'Hamlet'?",
        back: "William Shakespeare",
        source: "ai-full",
        collection: "default",
        created_at: now,
        updated_at: now,
        flashcard_id: 0,
        generation_id: null,
      },
      {
        user_id: DEFAULT_USER_ID,
        front: "What is the chemical symbol for gold?",
        back: "Au",
        source: "ai-full",
        collection: "default",
        created_at: now,
        updated_at: now,
        flashcard_id: 0,
        generation_id: null,
      },
    ];
  }
}

// Export singleton instance
export const flashcardGenerationService = new FlashcardGenerationService();
