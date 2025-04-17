import { useState, useEffect } from "react";
import type { FlashcardCandidateDto } from "../../../types";
import type { CandidateStatus, ReviewableCandidateViewModel } from "../types";

/**
 * Custom hook for managing the review of flashcard candidates
 */
export const useCandidatesReview = (initialCandidates: FlashcardCandidateDto[]) => {
  const [candidates, setCandidates] = useState<ReviewableCandidateViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aktualizacja kandydatów, gdy initialCandidates się zmienia
  useEffect(() => {
    if (initialCandidates.length > 0) {
      const mappedCandidates = initialCandidates.map((c, index) => ({
        ...c,
        id: `candidate-${index}-${Date.now()}`,
        status: "pending" as CandidateStatus,
        originalFront: c.front,
        originalBack: c.back,
      }));
      setCandidates(mappedCandidates);
    }
  }, [initialCandidates]);

  /**
   * Update the status of a candidate
   */
  const updateCandidateStatus = (id: string, status: CandidateStatus, updatedData?: Partial<FlashcardCandidateDto>) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              ...updatedData,
              status,
            }
          : candidate
      )
    );
  };

  /**
   * Accept a candidate
   */
  const acceptCandidate = (id: string) => {
    updateCandidateStatus(id, "accepted");
  };

  /**
   * Edit a candidate
   */
  const editCandidate = (id: string, front: string, back: string) => {
    updateCandidateStatus(id, "edited", { front, back });
  };

  /**
   * Discard a candidate
   */
  const discardCandidate = (id: string) => {
    updateCandidateStatus(id, "discarded");
  };

  /**
   * Get all accepted candidates
   */
  const getAcceptedCandidates = () => {
    return candidates.filter((c) => c.status === "accepted" || c.status === "edited");
  };

  /**
   * Save all accepted candidates to a collection
   */
  const bulkSaveAccepted = async (collection: string) => {
    const acceptedCandidates = getAcceptedCandidates();

    if (acceptedCandidates.length === 0) {
      setError("No accepted flashcards to save");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const flashcardsToSave = acceptedCandidates.map((c) => ({
        front: c.front,
        back: c.back,
        collection,
        source: "manual" as const,
      }));

      const response = await fetch("/api/flashcards/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flashcardsToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error saving flashcards");
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    candidates,
    acceptCandidate,
    editCandidate,
    discardCandidate,
    getAcceptedCandidates,
    bulkSaveAccepted,
    isLoading,
    error,
  };
};
