import * as crypto from "crypto";
// @ts-expect-error: Path resolution issue - this will be fixed in project setup
import type { FlashcardCandidateDto } from "../../../types";
import { createClient, DEFAULT_USER_ID } from "../../db/supabase.client";
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

      // 3. Call AI service using OpenRouter
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
   * Calls the OpenRouter AI service to generate flashcards
   */
  private async callAIService(inputText: string): Promise<FlashcardCandidateDto[]> {
    try {
      // Get the OpenRouter client
      const openRouter = getOpenRouterClient();

      // Create a timestamp for all flashcards
      const now = new Date().toISOString();

      // Create a JSON schema for structured response
      const jsonSchema = openRouter
        .createJsonSchema("FlashcardResponse")
        .addProperty("flashcards", "array", true, {
          items: {
            type: "object",
            properties: {
              front: { type: "string", description: "The front side of the flashcard, containing the question" },
              back: { type: "string", description: "The back side of the flashcard, containing the answer" },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
        })
        .build();

      // Build the system prompt
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
        
        Respond ONLY with the JSON structure of flashcards.
      `;

      // Send request to OpenRouter
      const response = await openRouter.chat({
        message: `Create flashcards from this text: ${inputText}`,
        systemMessage: systemPrompt,
        model: "openai/gpt-4o-mini", // Can be configured as needed
        responseFormat: jsonSchema,
        parameters: {
          temperature: 0.3, // Niższa temperatura dla bardziej spójnych wyników
          max_tokens: 4000, // Zwiększony limit tokenów dla większej liczby fiszek
        },
      });

      // Debug the response
      console.log("OpenRouter response:", JSON.stringify(response, null, 2));

      // Check if response has the expected structure
      if (!response || !response.choices || !response.choices.length || !response.choices[0].message) {
        console.error("Invalid response structure, falling back to sample flashcards");
        return this.getSampleFlashcards(now);
      }

      // Extract and validate the response
      const content = response.choices[0].message.content;

      if (!content) {
        console.error("Empty content returned, falling back to sample flashcards");
        return this.getSampleFlashcards(now);
      }

      // Try to parse the JSON content
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", content);
        console.error("Parse error details:", parseError);
        return this.getSampleFlashcards(now);
      }

      // Log the parsed response
      console.log("Parsed JSON response:", JSON.stringify(jsonResponse, null, 2));

      // Validate with Zod
      const validationResult = flashcardSchema.safeParse(jsonResponse);

      if (!validationResult.success) {
        console.error("Validation error:", validationResult.error);
        return this.getSampleFlashcards(now);
      }

      // Transform the validated response into FlashcardCandidateDto[]
      return validationResult.data.flashcards.map((card) => ({
        user_id: DEFAULT_USER_ID,
        front: card.front,
        back: card.back,
        source: "ai-full" as const,
        collection: "default",
        created_at: now,
        updated_at: now,
        flashcard_id: 0, // Will be assigned by the database
        generation_id: null, // Will be assigned later
      }));
    } catch (error) {
      console.error("Error calling OpenRouter service:", error);

      // Szczegółowe logowanie błędów OpenRouter
      if (error && typeof error === "object" && "message" in error) {
        console.error("Error message:", error.message);

        // Sprawdź czy to błąd od OpenRouter z metadanymi
        if ("error" in error && typeof error.error === "object" && error.error !== null) {
          const openRouterError = error.error as Record<string, unknown>;
          console.error("OpenRouter error details:", openRouterError);

          // Sprawdź czy są dostępne szczegółowe metadane
          if (
            "metadata" in openRouterError &&
            typeof openRouterError.metadata === "object" &&
            openRouterError.metadata !== null
          ) {
            const metadata = openRouterError.metadata as Record<string, unknown>;
            console.error("Provider metadata:", metadata);

            // Wypisz surową odpowiedź od providera (np. OpenAI)
            if ("raw" in metadata && typeof metadata.raw === "string") {
              try {
                const rawError = JSON.parse(metadata.raw);
                console.error("Raw provider error:", rawError);
              } catch {
                console.error("Raw provider response (not JSON):", metadata.raw);
              }
            }
          }
        }
      }

      console.error("Falling back to sample flashcards");

      // Create a timestamp for all flashcards
      const now = new Date().toISOString();

      // Return sample cards in case of errors
      return this.getSampleFlashcards(now);
    }
  }

  /**
   * Provides sample flashcards for fallback when OpenRouter fails
   * @param timestamp - Timestamp to use for created_at and updated_at fields
   * @returns Sample flashcards
   */
  private getSampleFlashcards(timestamp: string): FlashcardCandidateDto[] {
    return [
      {
        user_id: DEFAULT_USER_ID,
        front: "What is the capital of France?",
        back: "Paris",
        source: "ai-full" as const,
        collection: "default",
        created_at: timestamp,
        updated_at: timestamp,
        flashcard_id: 0,
        generation_id: null,
      },
      {
        user_id: DEFAULT_USER_ID,
        front: "Who wrote 'Hamlet'?",
        back: "William Shakespeare",
        source: "ai-full" as const,
        collection: "default",
        created_at: timestamp,
        updated_at: timestamp,
        flashcard_id: 0,
        generation_id: null,
      },
      {
        user_id: DEFAULT_USER_ID,
        front: "What is the chemical symbol for gold?",
        back: "Au",
        source: "ai-full" as const,
        collection: "default",
        created_at: timestamp,
        updated_at: timestamp,
        flashcard_id: 0,
        generation_id: null,
      },
    ];
  }
}

// Export singleton instance
export const flashcardGenerationService = new FlashcardGenerationService();
