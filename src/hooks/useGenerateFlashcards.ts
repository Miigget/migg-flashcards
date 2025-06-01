import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import type { FlashcardDTO, AIGenerateFlashcardsCommand } from "../types";

// Typy dla modelu widoku
export interface GenerateFlashcardsViewModel {
  currentStep: 1 | 2 | 3;
  inputText: string;
  inputTextValidationError: string | null;
  candidates: CandidateViewModel[];
  generationId: string | null;
  isLoadingGenerate: boolean;
  isLoadingSave: boolean;
  isLoadingCollections: boolean;
  generateApiError: ApiError | null;
  saveApiError: ApiError | null;
  collectionsApiError: ApiError | null;
  availableCollections: string[];
  selectedCollection: string;
  isNewCollection: boolean;
}

export interface CandidateViewModel {
  tempId: string;
  front: string;
  back: string;
  status: "pending" | "accepted" | "discarded" | "editing";
  originalFront: string;
  originalBack: string;
  validationError: { front?: string; back?: string } | null;
  generation_id: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Typy dla odpowiedzi API
interface GenerateApiResponse {
  candidates: { front: string; back: string }[];
  generation_id: string;
  generated_count: number;
}

type CollectionsApiResponse = string[];

// Typ dla interfejsu FlashcardCandidateDto (uproszczony dla potrzeb frontendu)
interface SimplifiedFlashcardCandidateDto {
  front: string;
  back: string;
  collection: string;
  source: "ai-full" | "ai-edited";
  generation_id: string;
}

// Hook do zarządzania stanem generowania fiszek
export function useGenerateFlashcards() {
  // Stan dla modelu widoku
  const [viewModel, setViewModel] = useState<GenerateFlashcardsViewModel>({
    currentStep: 1,
    inputText: "",
    inputTextValidationError: null,
    candidates: [],
    generationId: null,
    isLoadingGenerate: false,
    isLoadingSave: false,
    isLoadingCollections: false,
    generateApiError: null,
    saveApiError: null,
    collectionsApiError: null,
    availableCollections: [],
    selectedCollection: "",
    isNewCollection: false,
  });

  // Funkcja pomocnicza do aktualizacji stanu
  const updateViewModel = useCallback((updates: Partial<GenerateFlashcardsViewModel>) => {
    setViewModel((prev) => ({ ...prev, ...updates }));
  }, []);

  // Obsługa zmiany tekstu wejściowego
  const handleTextChange = useCallback(
    (text: string) => {
      let validationError: string | null = null;

      if (text.length > 0 && text.length < 100) {
        validationError = "Tekst musi zawierać co najmniej 100 znaków";
      } else if (text.length > 10000) {
        validationError = "Tekst nie może przekraczać 10000 znaków";
      }

      updateViewModel({
        inputText: text,
        inputTextValidationError: validationError,
      });
    },
    [updateViewModel]
  );

  // Generowanie kandydatów na fiszki
  const handleGenerateClick = useCallback(async () => {
    if (viewModel.inputTextValidationError || viewModel.inputText.length < 100) {
      return;
    }

    updateViewModel({
      isLoadingGenerate: true,
      generateApiError: null,
    });

    try {
      const command: AIGenerateFlashcardsCommand = {
        text: viewModel.inputText,
      };

      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Handle JSON parsing error for error responses
          throw {
            message: "Błąd serwera - nieprawidłowa odpowiedź",
            status: response.status,
            code: "JSON_PARSE_ERROR",
          };
        }
        throw {
          message: errorData.message || "Błąd podczas generowania fiszek",
          status: response.status,
          code: errorData.code,
        };
      }

      let data: GenerateApiResponse;
      try {
        data = await response.json();
      } catch {
        // Handle JSON parsing error for successful responses
        throw {
          message: "Błąd podczas parsowania odpowiedzi serwera",
          status: response.status,
          code: "JSON_PARSE_ERROR",
        };
      }

      // Tworzenie kandydatów na fiszki
      const candidates: CandidateViewModel[] = data.candidates.map((candidate) => ({
        tempId: uuidv4(),
        front: candidate.front,
        back: candidate.back,
        status: "pending",
        originalFront: candidate.front,
        originalBack: candidate.back,
        validationError: null,
        generation_id: data.generation_id,
      }));

      updateViewModel({
        candidates,
        generationId: data.generation_id,
        currentStep: 2,
        isLoadingGenerate: false,
      });
    } catch (error) {
      updateViewModel({
        isLoadingGenerate: false,
        generateApiError: error as ApiError,
      });
    }
  }, [viewModel.inputText, viewModel.inputTextValidationError, updateViewModel]);

  // Ponowna próba generowania
  const handleRetryGenerate = useCallback(() => {
    handleGenerateClick();
  }, [handleGenerateClick]);

  // Akceptacja kandydata
  const handleAccept = useCallback((tempId: string) => {
    setViewModel((prev) => ({
      ...prev,
      candidates: prev.candidates.map((candidate) =>
        candidate.tempId === tempId ? { ...candidate, status: "accepted" } : candidate
      ),
    }));
  }, []);

  // Odrzucenie kandydata
  const handleDiscard = useCallback((tempId: string) => {
    setViewModel((prev) => ({
      ...prev,
      candidates: prev.candidates.map((candidate) =>
        candidate.tempId === tempId ? { ...candidate, status: "discarded" } : candidate
      ),
    }));
  }, []);

  // Rozpoczęcie edycji kandydata
  const handleEditStart = useCallback((tempId: string) => {
    setViewModel((prev) => ({
      ...prev,
      candidates: prev.candidates.map((candidate) =>
        candidate.tempId === tempId ? { ...candidate, status: "editing" } : candidate
      ),
    }));
  }, []);

  // Zapisanie zmian w kandydacie
  const handleEditSave = useCallback((updatedCandidate: CandidateViewModel) => {
    // Sprawdzenie walidacji
    const validationError: { front?: string; back?: string } = {};
    let hasError = false;

    if (updatedCandidate.front.length > 200) {
      validationError.front = "Przód fiszki nie może przekraczać 200 znaków";
      hasError = true;
    }

    if (updatedCandidate.back.length > 500) {
      validationError.back = "Tył fiszki nie może przekraczać 500 znaków";
      hasError = true;
    }

    if (hasError) {
      setViewModel((prev) => ({
        ...prev,
        candidates: prev.candidates.map((candidate) =>
          candidate.tempId === updatedCandidate.tempId ? { ...updatedCandidate, validationError } : candidate
        ),
      }));
      return;
    }

    setViewModel((prev) => ({
      ...prev,
      candidates: prev.candidates.map((candidate) =>
        candidate.tempId === updatedCandidate.tempId
          ? {
              ...updatedCandidate,
              status: "accepted",
              validationError: null,
            }
          : candidate
      ),
    }));
  }, []);

  // Anulowanie edycji kandydata
  const handleEditCancel = useCallback((tempId: string) => {
    setViewModel((prev) => ({
      ...prev,
      candidates: prev.candidates.map((candidate) =>
        candidate.tempId === tempId ? { ...candidate, status: "pending", validationError: null } : candidate
      ),
    }));
  }, []);

  // Akceptacja wszystkich kandydatów
  const handleAcceptAll = useCallback(() => {
    setViewModel((prev) => ({
      ...prev,
      candidates: prev.candidates.map((candidate) =>
        candidate.status === "pending" ? { ...candidate, status: "accepted" } : candidate
      ),
    }));
  }, []);

  // Przejście do kroku zapisu
  const handleProceedToSave = useCallback(async () => {
    // Sprawdzenie, czy są zaakceptowane fiszki
    const acceptedCount = viewModel.candidates.filter((c) => c.status === "accepted").length;
    if (acceptedCount === 0) return;

    updateViewModel({
      currentStep: 3,
      isLoadingCollections: true,
      collectionsApiError: null,
    });

    // Pobranie dostępnych kolekcji
    try {
      const response = await fetch("/api/collections", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Handle JSON parsing error for error responses
          throw {
            message: "Błąd serwera podczas pobierania kolekcji",
            status: response.status,
            code: "JSON_PARSE_ERROR",
          };
        }
        throw {
          message: errorData.message || "Błąd podczas pobierania kolekcji",
          status: response.status,
          code: errorData.code,
        };
      }

      let collections: CollectionsApiResponse;
      try {
        collections = await response.json();
      } catch {
        // Handle JSON parsing error for successful responses
        throw {
          message: "Błąd podczas parsowania odpowiedzi serwera",
          status: response.status,
          code: "JSON_PARSE_ERROR",
        };
      }

      updateViewModel({
        availableCollections: collections,
        isLoadingCollections: false,
        // Ustaw domyślną kolekcję, jeśli istnieje
        selectedCollection: collections.length > 0 ? collections[0] : "",
        isNewCollection: collections.length === 0,
      });
    } catch (error) {
      updateViewModel({
        isLoadingCollections: false,
        collectionsApiError: error as ApiError,
      });
    }
  }, [viewModel.candidates, updateViewModel]);

  // Zmiana wybranej kolekcji
  const handleCollectionChange = useCallback(
    (name: string, isNew: boolean) => {
      updateViewModel({
        selectedCollection: name,
        isNewCollection: isNew,
      });
    },
    [updateViewModel]
  );

  // Zapisanie fiszek
  const handleSaveBulk = useCallback(async () => {
    if (!viewModel.selectedCollection) {
      updateViewModel({
        saveApiError: { message: "Nazwa kolekcji nie może być pusta" },
      });
      return;
    }

    const acceptedCandidates = viewModel.candidates.filter((c) => c.status === "accepted");
    if (acceptedCandidates.length === 0) return;

    updateViewModel({
      isLoadingSave: true,
      saveApiError: null,
    });

    try {
      // Przygotowanie danych do wysłania
      const command: SimplifiedFlashcardCandidateDto[] = acceptedCandidates.map((candidate) => ({
        front: candidate.front,
        back: candidate.back,
        collection: viewModel.selectedCollection,
        source:
          candidate.front !== candidate.originalFront || candidate.back !== candidate.originalBack
            ? "ai-edited"
            : "ai-full",
        generation_id: candidate.generation_id,
      }));

      const response = await fetch("/api/flashcards/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Handle JSON parsing error for error responses
          throw {
            message: "Błąd serwera podczas zapisywania fiszek",
            status: response.status,
            code: "JSON_PARSE_ERROR",
          };
        }
        throw {
          message: errorData.message || "Błąd podczas zapisywania fiszek",
          status: response.status,
          code: errorData.code,
        };
      }

      let savedFlashcards: FlashcardDTO[];
      try {
        savedFlashcards = await response.json();
      } catch {
        // Handle JSON parsing error for successful responses
        throw {
          message: "Błąd podczas parsowania odpowiedzi serwera",
          status: response.status,
          code: "JSON_PARSE_ERROR",
        };
      }

      // Wyświetl komunikat sukcesu i zresetuj stan
      toast.success(`Zapisano ${savedFlashcards.length} fiszek do kolekcji "${viewModel.selectedCollection}"`, {
        description: "Możesz teraz przejść do swoich kolekcji, aby przeglądać zapisane fiszki.",
        action: {
          label: "Przejdź do kolekcji",
          onClick: () => {
            window.location.href = "/collections";
          },
        },
      });

      // Resetowanie stanu
      setViewModel({
        currentStep: 1,
        inputText: "",
        inputTextValidationError: null,
        candidates: [],
        generationId: null,
        isLoadingGenerate: false,
        isLoadingSave: false,
        isLoadingCollections: false,
        generateApiError: null,
        saveApiError: null,
        collectionsApiError: null,
        availableCollections: [],
        selectedCollection: "",
        isNewCollection: false,
      });
    } catch (error) {
      updateViewModel({
        isLoadingSave: false,
        saveApiError: error as ApiError,
      });

      // Pokaż toast z błędem
      toast.error("Nie udało się zapisać fiszek", {
        description: (error as ApiError).message || "Wystąpił nieznany błąd podczas zapisywania fiszek.",
      });
    }
  }, [viewModel.candidates, viewModel.selectedCollection, updateViewModel]);

  return {
    // Stany
    currentStep: viewModel.currentStep,
    inputText: viewModel.inputText,
    inputTextValidationError: viewModel.inputTextValidationError,
    candidates: viewModel.candidates,
    isLoadingGenerate: viewModel.isLoadingGenerate,
    isLoadingSave: viewModel.isLoadingSave,
    isLoadingCollections: viewModel.isLoadingCollections,
    generateApiError: viewModel.generateApiError,
    saveApiError: viewModel.saveApiError,
    collectionsApiError: viewModel.collectionsApiError,
    availableCollections: viewModel.availableCollections,
    selectedCollection: viewModel.selectedCollection,
    isNewCollection: viewModel.isNewCollection,

    // Funkcje
    handleTextChange,
    handleGenerateClick,
    handleAccept,
    handleDiscard,
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleAcceptAll,
    handleProceedToSave,
    handleCollectionChange,
    handleSaveBulk,
    handleRetryGenerate,
  };
}
