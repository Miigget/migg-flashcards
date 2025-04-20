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
  // Stan dla modalu edycji
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateViewModel | null>(null);

  // Obsługa otwierania modalu edycji
  const handleEditClick = (tempId: string) => {
    const candidate = candidates.find((c) => c.tempId === tempId);
    if (candidate) {
      setEditingCandidate(candidate);
      setIsEditModalOpen(true);
    }
  };

  // Obsługa zamykania modalu edycji
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCandidate(null);
  };

  // Obliczanie potrzebnych statystyk
  const totalCount = candidates.length;
  const acceptedCount = candidates.filter((c) => c.status === "accepted").length;
  const pendingCount = candidates.filter((c) => c.status === "pending").length;
  const discardedCount = candidates.filter((c) => c.status === "discarded").length;

  // Sortowanie kandydatów: najpierw pending, potem accepted, na końcu discarded
  const sortedCandidates = [...candidates].sort((a, b) => {
    const statusOrder = { pending: 0, editing: 1, accepted: 2, discarded: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Czy przycisk "Przejdź do zapisu" powinien być aktywny
  const isProceedDisabled = acceptedCount === 0;

  // Renderowanie pustego stanu
  if (totalCount === 0 && !isLoading && !apiError) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <p className="text-muted-foreground">
          Brak wygenerowanych kandydatów. Wróć do poprzedniego kroku i wygeneruj fiszki.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nagłówek z informacjami i akcjami zbiorczymi */}
      <div className="bg-card p-6 rounded-lg border">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Sprawdź wygenerowane fiszki</h2>
            <p className="text-muted-foreground mb-2">
              Przejrzyj wygenerowane fiszki. Możesz je zaakceptować, edytować lub odrzucić.
            </p>
            <div className="flex gap-3 text-sm">
              <span>
                Łącznie: <strong>{totalCount}</strong>
              </span>
              <span>
                Zaakceptowane: <strong className="text-primary">{acceptedCount}</strong>
              </span>
              <span>
                Oczekujące: <strong className="text-amber-500">{pendingCount}</strong>
              </span>
              <span>
                Odrzucone: <strong className="text-muted-foreground">{discardedCount}</strong>
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-4 md:mt-0">
            {pendingCount > 0 && (
              <Button variant="outline" onClick={onAcceptAll} className="whitespace-nowrap">
                Akceptuj wszystkie
              </Button>
            )}
            <Button onClick={onProceedToSave} disabled={isProceedDisabled} className="whitespace-nowrap">
              Przejdź do zapisu
            </Button>
          </div>
        </div>
      </div>

      {/* Loader */}
      {isLoading && (
        <div className="py-8 text-center">
          <LoadingIndicator isLoading={true} text="Generowanie fiszek..." size="lg" />
        </div>
      )}

      {/* Komunikat o błędzie */}
      {apiError && <ErrorMessage error={apiError} showRetry={true} onRetry={onRetryGenerate} />}

      {/* Lista kandydatów */}
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

      {/* Modal edycji */}
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
