import React, { useState } from "react";
import { Button } from "../../ui/button";
import CandidateCard from "./CandidateCard";
import EditCandidateModal from "./EditCandidateModal";
import ErrorMessage from "../../ui/ErrorMessage";
import LoadingIndicator from "../../ui/LoadingIndicator";
import type { ApiError, CandidateViewModel } from "../../../hooks/useGenerateFlashcards";

interface Step2_ReviewCandidatesProps {
  candidates: CandidateViewModel[];
  isLoading: boolean;
  apiError: ApiError | null;
  onAccept: (tempId: string) => void;
  onDiscard: (tempId: string) => void;
  onEditStart: (tempId: string) => void;
  onEditSave: (candidate: CandidateViewModel) => void;
  onEditCancel: (tempId: string) => void;
  onAcceptAll: () => void;
  onProceedToSave: () => void;
  onRetryGenerate: () => void;
}

export default function Step2_ReviewCandidates({
  candidates,
  isLoading,
  apiError,
  onAccept,
  onDiscard,
  onEditSave,
  onAcceptAll,
  onProceedToSave,
  onRetryGenerate,
}: Step2_ReviewCandidatesProps) {
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateViewModel | null>(null);

  // Handle opening edit modal
  const handleEditClick = (tempId: string) => {
    const candidate = candidates.find((c) => c.tempId === tempId);
    if (candidate) {
      setEditingCandidate(candidate);
      setIsEditModalOpen(true);
    }
  };

  // Handle closing edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCandidate(null);
  };

  // Calculate necessary statistics
  const totalCount = candidates.length;
  const acceptedCount = candidates.filter((c) => c.status === "accepted").length;
  const pendingCount = candidates.filter((c) => c.status === "pending").length;
  const discardedCount = candidates.filter((c) => c.status === "discarded").length;

  // Sort candidates: first pending, then accepted, then discarded
  const sortedCandidates = [...candidates].sort((a, b) => {
    const statusOrder = { pending: 0, editing: 1, accepted: 2, discarded: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Whether the "Proceed to save" button should be active
  const isProceedDisabled = acceptedCount === 0;

  // Whether to show the "Accept all" button
  const showAcceptAllButton = pendingCount > 0;

  // Render empty state
  if (totalCount === 0 && !isLoading && !apiError) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <p className="text-muted-foreground">
          No candidates generated. Go back to the previous step and generate flashcards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with information and collective actions */}
      <div className="bg-card p-6 rounded-lg border">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Review generated flashcards</h2>
            <p className="text-muted-foreground mb-2">
              Review generated flashcards. You can accept, edit or discard them.
            </p>
            <div className="flex gap-3 text-sm">
              <span>
                Total: <strong>{totalCount}</strong>
              </span>
              <span>
                Accepted: <strong className="text-primary">{acceptedCount}</strong>
              </span>
              <span>
                Pending: <strong className="text-amber-500">{pendingCount}</strong>
              </span>
              <span>
                Discarded: <strong className="text-muted-foreground">{discardedCount}</strong>
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-4 md:mt-0">
            {showAcceptAllButton && (
              <Button
                variant="outline"
                onClick={onAcceptAll}
                className="whitespace-nowrap"
                data-testid="accept-all-button"
              >
                Accept all
              </Button>
            )}
            <Button onClick={onProceedToSave} disabled={isProceedDisabled} className="whitespace-nowrap">
              Proceed to save
            </Button>
          </div>
        </div>
      </div>

      {/* Loader */}
      {isLoading && (
        <div className="py-8 text-center">
          <LoadingIndicator isLoading={true} text="Generating flashcards..." size="lg" />
        </div>
      )}

      {/* Error message */}
      {apiError && <ErrorMessage error={apiError} showRetry={true} onRetry={onRetryGenerate} />}

      {/* List of candidates */}
      {!isLoading && !apiError && totalCount > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {sortedCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.tempId}
              candidate={candidate}
              onAccept={onAccept}
              onDiscard={onDiscard}
              onEditClick={handleEditClick}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingCandidate && (
        <EditCandidateModal
          candidate={editingCandidate}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={onEditSave}
        />
      )}
    </div>
  );
}
