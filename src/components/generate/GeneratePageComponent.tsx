import { useState, useCallback, useEffect } from "react";
import { GenerateSteps } from "./GenerateSteps";
import { SourceTextInput } from "./SourceTextInput";
import { GenerationProgress } from "./GenerationProgress";
import { CandidatesList } from "./CandidatesList";
import { useFlashcardGeneration } from "./hooks/useFlashcardGeneration";
import { useCandidatesReview } from "./hooks/useCandidatesReview";
import { toast } from "sonner";
import type { StepType, CandidateStatus } from "./types";

export default function GeneratePageComponent() {
  // Step state
  const [currentStep, setCurrentStep] = useState<StepType>("input");

  // Input state
  const [sourceText, setSourceText] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");

  // Hooks for flashcard generation and review
  const {
    generateFlashcards,
    cancelGeneration,
    isGenerating,
    progress,
    candidates,
    error: generationError,
  } = useFlashcardGeneration();

  const {
    candidates: reviewableCandidates,
    acceptCandidate,
    editCandidate,
    discardCandidate,
    bulkSaveAccepted,
    isLoading: isSaving,
    error: savingError,
  } = useCandidatesReview(candidates);

  // Logowanie dla debugowania
  useEffect(() => {
    console.log("Candidates updated:", candidates.length);
    console.log("Reviewable candidates:", reviewableCandidates.length);
  }, [candidates, reviewableCandidates]);

  // Determine if steps are enabled
  const isStepEnabled = useCallback(
    (step: StepType) => {
      switch (step) {
        case "input":
          return true;
        case "generating":
          return sourceText.length >= 100 && selectedCollection !== "";
        case "review":
          return reviewableCandidates.length > 0;
        default:
          return false;
      }
    },
    [sourceText, selectedCollection, reviewableCandidates.length]
  );

  // Handle step changes
  const handleStepChange = (step: StepType) => {
    if (isStepEnabled(step)) {
      setCurrentStep(step);
    }
  };

  // Handle generating flashcards
  const handleGenerate = async () => {
    if (sourceText.length < 100 || !selectedCollection) {
      return;
    }

    setCurrentStep("generating");
    const result = await generateFlashcards(sourceText);

    if (result) {
      console.log("Generation result:", result.length, "candidates");
      setCurrentStep("review");
      toast.success(`Generated ${result.length} flashcards for review`);
    } else {
      setCurrentStep("input");
      if (generationError) {
        toast.error(generationError);
      }
    }
  };

  // Handle candidate status change
  const handleCandidateStatusChange = (
    id: string,
    status: CandidateStatus,
    updatedData?: { front?: string; back?: string }
  ) => {
    console.log("Status change for candidate:", id, status, updatedData);
    switch (status) {
      case "accepted":
        acceptCandidate(id);
        toast.success("Flashcard accepted");
        break;
      case "edited":
        if (updatedData?.front && updatedData?.back) {
          editCandidate(id, updatedData.front, updatedData.back);
          toast.success("Flashcard edited successfully");
        }
        break;
      case "discarded":
        discardCandidate(id);
        toast.info("Flashcard discarded");
        break;
      default:
        break;
    }
  };

  // Handle bulk save of accepted flashcards
  const handleBulkSave = async () => {
    const acceptedCount = reviewableCandidates.filter((c) => c.status === "accepted" || c.status === "edited").length;

    if (acceptedCount === 0) {
      toast.error("No flashcards selected for saving");
      return;
    }

    toast.promise(bulkSaveAccepted(selectedCollection), {
      loading: `Saving ${acceptedCount} flashcards...`,
      success: () => {
        // Reset application state for a new generation session
        setSourceText("");
        setCurrentStep("input");
        return `Successfully saved ${acceptedCount} flashcards to collection "${selectedCollection}"`;
      },
      error: (err) => `Failed to save flashcards: ${err}`,
    });
  };

  // Handle cancelling generation
  const handleCancelGeneration = () => {
    cancelGeneration();
    setCurrentStep("input");
    toast.info("Generation cancelled");
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "input":
        return (
          <SourceTextInput
            sourceText={sourceText}
            onSourceTextChange={setSourceText}
            selectedCollection={selectedCollection}
            onCollectionChange={setSelectedCollection}
            onGenerate={handleGenerate}
            error={generationError}
            isLoading={isGenerating}
          />
        );
      case "generating":
        return (
          <GenerationProgress
            progress={progress}
            generatedCount={candidates.length}
            onCancel={handleCancelGeneration}
          />
        );
      case "review":
        console.log("Rendering review step with", reviewableCandidates.length, "candidates");
        return (
          <CandidatesList
            candidates={reviewableCandidates}
            onCandidateStatusChange={handleCandidateStatusChange}
            onBulkSave={handleBulkSave}
            selectedCollection={selectedCollection}
            isLoading={isSaving}
            error={savingError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <GenerateSteps currentStep={currentStep} onStepChange={handleStepChange} isStepEnabled={isStepEnabled} />

      <div className="mt-6">{renderStepContent()}</div>
    </div>
  );
}
