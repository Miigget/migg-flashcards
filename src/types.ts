// src/types.ts

import type { Database } from "./db/database.types";

// --------------------------------------------------------------------------
// Flashcards and related commands/models
// --------------------------------------------------------------------------

// FlashcardDTO: Represents a flashcard as stored in the database.
export type FlashcardDTO = Database["public"]["Tables"]["flashcards"]["Row"];

// CreateFlashcardCommand: Payload for creating a new flashcard manually.
// We pick required fields from FlashcardDTO and override 'source' to be 'manual'.
export type CreateFlashcardCommand = Omit<Pick<FlashcardDTO, "front" | "back" | "collection" | "source">, "source"> & {
  source: "manual";
};

// UpdateFlashcardCommand: Payload for updating a flashcard. Only 'front', 'back', and 'collection' are updatable.
export type UpdateFlashcardCommand = Partial<Pick<FlashcardDTO, "front" | "back" | "collection">>;

// FlashcardCandidateDto: Represents an AI generated flashcard candidate with source "ai-full" or "ai-edited".
export type FlashcardCandidateDto = Omit<FlashcardDTO, "source"> & {
  source: "ai-full" | "ai-edited";
};

// BulkCreateFlashcardsCommand: Command for bulk flashcard creation; an array of flashcard candidates.
export type BulkCreateFlashcardsCommand = FlashcardCandidateDto[];

// AIGenerateFlashcardsCommand: Payload for the AI flashcards generation endpoint.
export interface AIGenerateFlashcardsCommand {
  text: string;
}

// --------------------------------------------------------------------------
// Generation and Error Log models
// --------------------------------------------------------------------------

// GenerationDTO: Represents a flashcard generation session as stored in the database.
export type GenerationDTO = Database["public"]["Tables"]["generations"]["Row"];

// GenerationErrorLogDTO: Represents a generation error log from the database.
export type GenerationErrorLogDTO = Database["public"]["Tables"]["generation_error_logs"]["Row"];

// --------------------------------------------------------------------------
// Collections related commands/models
// --------------------------------------------------------------------------

// CreateCollectionCommand: Payload for creating a new collection.
export interface CreateCollectionCommand {
  name: string;
}

// UpdateCollectionCommand: Payload for renaming an existing collection.
export interface UpdateCollectionCommand {
  new_name: string;
}

// --------------------------------------------------------------------------
// Generic utility type for paginated API responses
// --------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
