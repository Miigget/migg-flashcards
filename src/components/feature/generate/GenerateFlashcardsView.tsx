import { useGenerateFlashcards } from "../../../hooks/useGenerateFlashcards";
import Stepper from "./Stepper";
import Step1_TextInput from "./Step1_TextInput";
import Step2_ReviewCandidates from "./Step2_ReviewCandidates";
import Step3_SaveSelection from "./Step3_SaveSelection";
import type { CandidateViewModel } from "../../../hooks/useGenerateFlashcards";

// Upewnij się, że TypeScript uznaje moduły za dostępne
declare module "../../../hooks/useGenerateFlashcards" {
  export function useGenerateFlashcards(): any;
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
}

declare module "./Stepper" {
  const Stepper: React.ComponentType<{ currentStep: number; steps: string[] }>;
  export default Stepper;
}

declare module "./Step1_TextInput" {
  const Step1_TextInput: React.ComponentType<{
    text: string;
    validationError: string | null;
    isLoading: boolean;
    apiError: any;
    onTextChange: (text: string) => void;
    onGenerateClick: () => void;
    onRetryGenerate: () => void;
  }>;
  export default Step1_TextInput;
}

declare module "./Step2_ReviewCandidates" {
  const Step2_ReviewCandidates: React.ComponentType<{
    candidates: CandidateViewModel[];
    isLoading: boolean;
    apiError: any;
    onAccept: (tempId: string) => void;
    onDiscard: (tempId: string) => void;
    onEditSave: (candidate: CandidateViewModel) => void;
    onAcceptAll: () => void;
    onProceedToSave: () => void;
    onRetryGenerate: () => void;
  }>;
  export default Step2_ReviewCandidates;
}

declare module "./Step3_SaveSelection" {
  const Step3_SaveSelection: React.ComponentType<{
    acceptedCandidates: CandidateViewModel[];
    availableCollections: string[];
    selectedCollection: string;
    isNewCollection: boolean;
    isLoadingSave: boolean;
    isLoadingCollections: boolean;
    saveApiError: any;
    collectionsApiError: any;
    onCollectionChange: (name: string, isNew: boolean) => void;
    onSaveClick: () => void;
  }>;
  export default Step3_SaveSelection;
}

export default function GenerateFlashcardsView() {
  const {
    currentStep,
    inputText,
    inputTextValidationError,
    candidates,
    isLoadingGenerate,
    isLoadingSave,
    isLoadingCollections,
    generateApiError,
    saveApiError,
    collectionsApiError,
    availableCollections,
    selectedCollection,
    isNewCollection,
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
  } = useGenerateFlashcards();

  const steps = ["Wprowadź tekst", "Sprawdź kandydatów", "Zapisz fiszki"];

  return (
    <div className="space-y-8">
      <Stepper currentStep={currentStep} steps={steps} />

      {currentStep === 1 && (
        <Step1_TextInput
          text={inputText}
          validationError={inputTextValidationError}
          isLoading={isLoadingGenerate}
          apiError={generateApiError}
          onTextChange={handleTextChange}
          onGenerateClick={handleGenerateClick}
          onRetryGenerate={handleRetryGenerate}
        />
      )}

      {currentStep === 2 && (
        <Step2_ReviewCandidates
          candidates={candidates}
          isLoading={isLoadingGenerate}
          apiError={generateApiError}
          onAccept={handleAccept}
          onDiscard={handleDiscard}
          onEditSave={handleEditSave}
          onAcceptAll={handleAcceptAll}
          onProceedToSave={handleProceedToSave}
          onRetryGenerate={handleRetryGenerate}
        />
      )}

      {currentStep === 3 && (
        <Step3_SaveSelection
          acceptedCandidates={candidates.filter((c: CandidateViewModel) => c.status === "accepted")}
          availableCollections={availableCollections}
          selectedCollection={selectedCollection}
          isNewCollection={isNewCollection}
          isLoadingSave={isLoadingSave}
          isLoadingCollections={isLoadingCollections}
          saveApiError={saveApiError}
          collectionsApiError={collectionsApiError}
          onCollectionChange={handleCollectionChange}
          onSaveClick={handleSaveBulk}
        />
      )}
    </div>
  );
}
