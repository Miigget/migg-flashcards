import { useGenerateFlashcards } from "../../../hooks/useGenerateFlashcards";
import Stepper from "./Stepper";
import Step1_TextInput from "./Step1_TextInput";
import Step2_ReviewCandidates from "./Step2_ReviewCandidates";
import Step3_SaveSelection from "./Step3_SaveSelection";

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

  const steps = ["Enter text", "Review candidates", "Save flashcards"];

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
          onEditStart={handleEditStart}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          onAcceptAll={handleAcceptAll}
          onProceedToSave={handleProceedToSave}
          onRetryGenerate={handleRetryGenerate}
        />
      )}

      {currentStep === 3 && (
        <Step3_SaveSelection
          acceptedCandidates={candidates.filter((c) => c.status === "accepted")}
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
