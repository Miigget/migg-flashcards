import { useState } from "react";
import type { ApiError, CreateFlashcardCommand, FlashcardDTO } from "@/types";

interface UseCreateFlashcardReturn {
  createFlashcard: (command: CreateFlashcardCommand) => Promise<FlashcardDTO>; // Return created flashcard on success
  isSubmitting: boolean;
  error: ApiError | null;
}

export function useCreateFlashcard(): UseCreateFlashcardReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const createFlashcard = async (command: CreateFlashcardCommand): Promise<FlashcardDTO> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        let errorPayload: ApiError;
        try {
          // Try to parse the error response according to ApiError structure
          errorPayload = await response.json();
          if (typeof errorPayload.message !== "string") {
            // Fallback if parsing fails or structure is wrong
            throw new Error(`HTTP error ${response.status}: Failed to parse error response.`);
          }
        } catch (parseError: unknown) {
          console.error("Failed to parse error response:", parseError);
          // Fallback if JSON parsing fails completely
          errorPayload = {
            status: response.status,
            message: `HTTP error ${response.status}: ${response.statusText || "Failed to create flashcard."}`,
          };
        }
        setError(errorPayload);
        console.error("API Error:", errorPayload);
        throw new Error(errorPayload.message); // Throw error to be caught by the calling component
      }

      // Assuming API returns the created flashcard object on 201 status
      const createdFlashcard: FlashcardDTO = await response.json();
      return createdFlashcard;
    } catch (err) {
      // Catch fetch errors or errors thrown from response handling
      console.error("useCreateFlashcard Error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during flashcard creation.";
      // Ensure the error state reflects the caught error if it wasn't set already
      if (!error) {
        setError({
          status: 500,
          message: errorMessage,
        });
      }
      // Re-throw the error so the calling component knows the operation failed
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createFlashcard, isSubmitting, error };
}
