import type { FlashcardCandidateDto } from "../../types";

// Step types for the generation process
export type StepType = "input" | "generating" | "review";

// Status types for flashcard candidates
export type CandidateStatus = "pending" | "accepted" | "edited" | "discarded";

// Main state for the generate page component
export interface GeneratePageState {
  step: StepType;
  sourceText: string;
  selectedCollection: string;
  isGenerating: boolean;
  generationProgress: number;
  candidates: ReviewableCandidateViewModel[];
  error: string | null;
}

// Extension of FlashcardCandidateDto with review status
export interface ReviewableCandidateViewModel extends FlashcardCandidateDto {
  id: string;
  status: CandidateStatus;
  originalFront?: string;
  originalBack?: string;
}

// Form data for editing candidates
export interface EditCandidateFormData {
  front: string;
  back: string;
  frontError?: string;
  backError?: string;
}

// Response from the AI generation API
export interface AIGenerateFlashcardsResponse {
  candidates: FlashcardCandidateDto[];
  generation_id: string;
  generated_count: number;
}
