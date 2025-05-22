// src/types.ts

import type { Database } from "./db/database.types";
import type { State as FSRSState, Rating as FSRSRating } from "ts-fsrs";

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

// UpdateFlashcardCommand: Payload for updating a flashcard. Includes 'front', 'back', 'collection', and 'source'.
export type UpdateFlashcardCommand = Partial<Pick<FlashcardDTO, "front" | "back" | "collection" | "source">>;

// FlashcardCandidateDto: Represents an AI generated flashcard candidate.
// Contains only the necessary fields for creation via bulk insert.
export type FlashcardCandidateDto = Pick<FlashcardDTO, "front" | "back" | "collection" | "generation_id"> & {
  source: "ai-full" | "ai-edited";
};

// BulkCreateFlashcardsCommand: Command for bulk flashcard creation; an array of flashcard candidates.
export type BulkCreateFlashcardsCommand = FlashcardCandidateDto[];

// AIGenerateFlashcardsCommand: Payload for the AI flashcards generation endpoint.
export interface AIGenerateFlashcardsCommand {
  text: string;
}

// --------------------------------------------------------------------------
// Spaced Repetition models
// --------------------------------------------------------------------------

// FlashcardSRSMetadataDTO: Represents the SRS metadata for a flashcard
export type FlashcardSRSMetadataDTO = Database["public"]["Tables"]["flashcard_srs_metadata"]["Row"];

// SpacedRepetitionCard: Represents a flashcard with its SRS state
export interface SpacedRepetitionCard extends FlashcardDTO {
  fsrsCard: {
    due: Date;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: FSRSState;
    last_review: Date | null;
  };
  history: { rating: FSRSRating; state: FSRSState; review_date: Date }[]; // History of ratings
}

// StudySessionState: State of the entire study session
export interface StudySessionState {
  collectionName: string;
  allFlashcards: SpacedRepetitionCard[]; // All flashcards in the collection
  currentCard: SpacedRepetitionCard | null;
  currentIndex: number; // Index of current card in allFlashcards
  sessionQueue: SpacedRepetitionCard[]; // Cards to review in this session, sorted by FSRS
  reviewedInSession: { cardId: number; rating: FSRSRating }[]; // Cards reviewed in this session
  isFrontVisible: boolean;
  isSessionActive: boolean;
  isSessionFinished: boolean;
  studySummaryData: StudySummaryData | null;
  isLoading: boolean;
  error: string | null;
}

// StudySummaryData: Data to display in the session summary
export interface StudySummaryData {
  collectionName: string;
  cardsReviewed: number;
  againCount: number; // Count of "Again" ratings
  hardCount?: number;
  goodCount?: number;
  easyCount?: number;
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

// --------------------------------------------------------------------------
// Generic utility type for API Errors
// --------------------------------------------------------------------------

export interface ApiError {
  status: number;
  message: string;
  details?: unknown; // e.g., from Zod validation
}

// --------------------------------------------------------------------------
// View Models for Frontend Components
// --------------------------------------------------------------------------

// CollectionViewModel: Represents a collection in the list view.
export interface CollectionViewModel {
  name: string;
  flashcardCount: number | null; // null during loading or on error
  isLoadingCount: boolean;
  errorCount: ApiError | null;
}
