import * as crypto from "crypto";
// @ts-expect-error: Path resolution issue - this will be fixed in project setup
import type { FlashcardCandidateDto } from "../../../types";
import type { SupabaseClient } from "@supabase/supabase-js"; // Import SupabaseClient type
import type { Database } from "../../db/database.types";
import { getOpenRouterClient } from "./openrouter";
import { z } from "zod";

type GenerationRecord = Database["public"]["Tables"]["generations"]["Row"];

interface GenerateFlashcardsResult {
  candidates: FlashcardCandidateDto[];
  generation_id: string;
  generated_count: number;
}

// Define schema for flashcard response with Zod
const flashcardSchema = z.object({
  flashcards: z
    .array(
      z.object({
        front: z.string().min(3).max(500),
        back: z.string().min(1).max(1000),
      })
    )
    .min(1)
    .max(50),
});

class FlashcardGenerationService {
  private supabase: SupabaseClient<Database>; // Add Supabase client property
  private userId: string | undefined; // Add property to store user ID

  /**
   * Constructor accepting Supabase client instance
   * @param supabase - Initialized Supabase client instance
   * @param userId - Optional user ID
   */
  constructor(supabase: SupabaseClient<Database>, userId?: string) {
    this.supabase = supabase;
    this.userId = userId; // Store the user ID if provided
  }

  /**
   * Generates flashcard candidates using AI based on provided text
   * @param text - Source text for flashcard generation
   * @returns Generated flashcard candidates, generation ID, and count
   */
  async generateFlashcards(text: string): Promise<GenerateFlashcardsResult> {
    // Get user ID, potentially fallback to a default or handle error if not available
    const userId = await this.getCurrentUserId();
    if (!userId) {
      throw new Error("User ID not found. Cannot generate flashcards.");
    }

    try {
      // 1. Create a hash of input text for tracking duplicates
      const textHash = this.generateHash(text);

      // 2. Create entry in generations table, passing the user ID
      const generation = await this.createGenerationRecord(textHash, text.length, userId);

      // 3. Call AI service using OpenRouter
      const startTime = Date.now();
      const candidates = await this.callAIService(text, userId);
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
      // eslint-disable-next-line no-console
      console.error("Error during flashcard generation:", error);
      // Pass userId to error logging
      await this.logGenerationError(error, this.generateHash(text), text.length, userId);
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
  private async createGenerationRecord(
    textHash: string,
    textLength: number,
    userId: string // Add userId parameter
  ): Promise<GenerationRecord> {
    // Use the injected Supabase client
    // const supabase = createClient(); <-- Remove this line

    const { data, error } = await this.supabase // Use this.supabase
      .from("generations")
      .insert({
        user_id: userId, // Use the provided user ID
        source_text_hash: textHash,
        source_text_length: textLength,
        model: "openrouter.ai", // Default model
        generated_count: 0,
        generation_duration: 0, // Initialize with 0 instead of null
      })
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
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
    // Use the injected Supabase client
    // const supabase = createClient(); <-- Remove this line

    const { error } = await this.supabase // Use this.supabase
      .from("generations")
      .update({
        generated_count: generatedCount,
        generation_duration: generationTimeMs,
      })
      .eq("generation_id", generationId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating generation record:", error);
      throw new Error(`Failed to update generation record: ${error.message}`);
    }
  }

  /**
   * Logs an error that occurred during generation
   */
  private async logGenerationError(
    error: unknown,
    sourceTextHash: string,
    sourceTextLength: number,
    userId: string // Add userId parameter
  ): Promise<void> {
    // Use the injected Supabase client
    // const supabase = createClient(); <-- Remove this line

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error instanceof Error && "code" in error ? String((error as Record<string, unknown>).code) : "UNKNOWN_ERROR";

    // Use this.supabase
    await this.supabase.from("generation_error_logs").insert({
      user_id: userId, // Use the provided user ID
      error_code: errorCode,
      error_message: errorMessage,
      model: "openrouter.ai",
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Fetches the current user ID from the session.
   * Throws an error if the user is not authenticated.
   */
  private async getCurrentUserId(): Promise<string> {
    // If userId was provided in constructor, use it
    if (this.userId) {
      return this.userId;
    }
    // Otherwise, try to get it from the session
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated.");
    }
    return user.id;
  }

  /**
   * Calls the OpenRouter AI service to generate flashcards
   */
  private async callAIService(inputText: string, userId: string): Promise<FlashcardCandidateDto[]> {
    const models = ["openai/gpt-4o-mini", "anthropic/claude-3-haiku", "meta-llama/llama-3.1-8b-instruct"];

    for (const model of models) {
      try {
        return await this.tryGenerateWithModel(inputText, userId, model);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
          `Failed to generate flashcards with model ${model}:`,
          error instanceof Error ? error.message : error
        );

        // If this is the last model, throw the error
        if (model === models[models.length - 1]) {
          throw error;
        }
        // Otherwise, continue to next model
      }
    }

    throw new Error("All models failed to generate flashcards");
  }

  /**
   * Attempts to generate flashcards with a specific model
   */
  private async tryGenerateWithModel(
    inputText: string,
    userId: string,
    model: string
  ): Promise<FlashcardCandidateDto[]> {
    try {
      // Get the OpenRouter client
      const openRouter = getOpenRouterClient();

      // Create a timestamp for all flashcards
      const now = new Date().toISOString();

      // Build the system prompt with clear JSON format instructions
      const systemPrompt = `
        You are a helpful AI assistant specialized in creating high-quality flashcards from educational content.
        Your task is to extract key concepts and knowledge from the provided text and create flashcards.
        
        Guidelines for creating flashcards:
        1. Each flashcard should have a clear question on the front and a concise answer on the back
        2. Focus on important concepts, definitions, facts, and relationships
        3. Use clear, concise language that accurately represents the content
        4. Create as many flashcards as appropriate for the content, up to 50 cards maximum
        5. Make the questions specific enough to have a clear, unambiguous answer
        6. Avoid overly complex or compound questions
        7. Ensure the answer provides complete information to answer the question
        8. For longer texts, aim to cover all major concepts and important details
        9. IMPORTANT: Do not create more than 50 flashcards, as this will cause the generation to fail
        
        IMPORTANT: You must respond with a valid JSON object in exactly this format:
        {
          "flashcards": [
            {
              "front": "Question text here",
              "back": "Answer text here"
            }
          ]
        }
        
        Do not include any other text, explanations, or comments. Only return the JSON object.
      `;

      // Send request to OpenRouter WITHOUT structured output
      const response = await openRouter.chat({
        message: `Create flashcards from this text: ${inputText}`,
        systemMessage: systemPrompt,
        model: model,
        // Remove responseFormat to avoid compatibility issues
        parameters: {
          temperature: 0.3, // Niższa temperatura dla bardziej spójnych wyników
          max_tokens: 4000, // Zwiększony limit tokenów dla większej liczby fiszek
        },
      });

      // Check if response has the expected structure
      if (!response || !response.choices || !response.choices.length || !response.choices[0].message) {
        throw new Error(`Invalid response structure from AI service (${model})`);
      }

      // Extract and validate the response
      const content = response.choices[0].message.content;

      if (!content) {
        throw new Error(`Empty content returned from AI service (${model})`);
      }

      // Clean the content - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      // Try to parse the JSON content
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(cleanContent);
      } catch {
        // eslint-disable-next-line no-console
        console.error(`Failed to parse AI response as JSON from ${model}. Content:`, cleanContent.substring(0, 500));
        throw new Error(`Failed to parse AI response: invalid JSON format (${model})`);
      }

      // Validate with Zod
      const validationResult = flashcardSchema.safeParse(jsonResponse);

      if (!validationResult.success) {
        // eslint-disable-next-line no-console
        console.error(`AI response validation failed for ${model}:`, validationResult.error.message);
        throw new Error(`AI response validation failed: ${validationResult.error.message} (${model})`);
      }

      // Transform the validated response into FlashcardCandidateDto[]
      const candidates: FlashcardCandidateDto[] = validationResult.data.flashcards.map((card) => ({
        user_id: userId, // Use the passed userId
        front: card.front,
        back: card.back,
        source: "ai-full" as const,
        collection: "default",
        created_at: now,
        updated_at: now,
        flashcard_id: 0, // Will be assigned by the database
        generation_id: 0, // This will be updated later in generateFlashcards
        status: "candidate", // Default status
      }));

      return candidates;
    } catch (error) {
      // Check if this is a JSON parsing error
      if (error instanceof Error && error.message.includes("Failed to parse JSON response")) {
        throw new Error(
          `Flashcard generation failed due to invalid API response from ${model}. This might be a temporary issue with the AI service.`
        );
      }

      // Re-throw the error with model information
      throw error instanceof Error
        ? new Error(`${error.message} (${model})`)
        : new Error(`Flashcard generation failed: Unknown error (${model})`);
    }
  }

  /**
   * Provides sample flashcards for fallback when OpenRouter fails
   * @param timestamp - Timestamp to use for created_at and updated_at fields
   * @param userId - User ID for the sample flashcards
   * @returns Sample flashcards
   */
  private getSampleFlashcards(timestamp: string, userId: string): FlashcardCandidateDto[] {
    return [
      {
        user_id: userId, // Use userId for samples too
        front: "Przykładowa fiszka - Przód 1",
        back: "Przykładowa fiszka - Tył 1",
        source: "ai-full" as const,
        collection: "default",
        created_at: timestamp,
        updated_at: timestamp,
        flashcard_id: 0,
        generation_id: -1, // Use a placeholder ID like -1 for samples
        status: "candidate",
      },
      {
        user_id: userId, // Use userId for samples too
        front: "Przykładowa fiszka - Przód 2",
        back: "Przykładowa fiszka - Tył 2",
        source: "ai-full" as const,
        collection: "default",
        created_at: timestamp,
        updated_at: timestamp,
        flashcard_id: 0,
        generation_id: -1,
        status: "candidate",
      },
    ];
  }
}

// Remove singleton instance export, instance should be created where needed with dependencies
// export const flashcardGenerationService = new FlashcardGenerationService();

export { FlashcardGenerationService }; // Ensure the class is exported
