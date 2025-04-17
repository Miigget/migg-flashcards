import { useState } from "react";
import type { FlashcardCandidateDto } from "../../../types";
import type { AIGenerateFlashcardsResponse } from "../types";

// Symulacja generowania fiszek na podstawie tekstu
const mockGenerateFlashcards = async (text: string): Promise<AIGenerateFlashcardsResponse> => {
  // W prawdziwej implementacji to będzie zastąpione prawdziwym wywołaniem API
  const wordCount = text.split(/\s+/).length;

  // Określenie liczby fiszek do wygenerowania na podstawie długości tekstu
  const cardCount = Math.min(Math.max(Math.floor(wordCount / 50), 3), 15);

  // Wygenerowanie losowych fiszek na podstawie tekstu
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const candidates: FlashcardCandidateDto[] = [];

  for (let i = 0; i < cardCount; i++) {
    // Wybierz losowe zdanie jako podstawę fiszki
    const sentenceIndex = Math.floor(Math.random() * sentences.length);
    const sentence = sentences[sentenceIndex].trim();

    if (sentence.length < 5) continue;

    // Podziel zdanie, aby stworzyć fiszkę
    const words = sentence.split(/\s+/);
    const pivotIndex = Math.floor(words.length / 2);

    // Przód fiszki to pierwsze słowa zdania
    const front = words.slice(0, pivotIndex).join(" ");

    // Tył fiszki to reszta zdania
    const back = words.slice(pivotIndex).join(" ");

    candidates.push({
      flashcard_id: Math.floor(Math.random() * 10000),
      front: `${front}...`,
      back: back,
      collection: "",
      source: "ai-full",
      generation_id: null,
      user_id: "mock-user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as FlashcardCandidateDto);
  }

  return {
    candidates,
    generation_id: `gen-${Date.now()}`,
    generated_count: candidates.length,
  };
};

/**
 * Custom hook for managing the flashcard generation process
 */
export const useFlashcardGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [candidates, setCandidates] = useState<FlashcardCandidateDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate flashcards based on provided text
   */
  const generateFlashcards = async (text: string): Promise<FlashcardCandidateDto[] | null> => {
    if (!text || text.length < 100) {
      setError("Text must be at least 100 characters long");
      return null;
    }

    try {
      setIsGenerating(true);
      setProgress(0);
      setError(null);

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 1000);

      // Symulacja opóźnienia API (2-5 sekund)
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Generowanie fiszek
      const data = await mockGenerateFlashcards(text);

      clearInterval(progressInterval);

      // Set progress to 100% when complete
      setProgress(100);
      setCandidates(data.candidates);

      return data.candidates;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Cancel the generation process
   */
  const cancelGeneration = () => {
    setIsGenerating(false);
    setProgress(0);
  };

  return {
    generateFlashcards,
    cancelGeneration,
    isGenerating,
    progress,
    candidates,
    error,
  };
};
