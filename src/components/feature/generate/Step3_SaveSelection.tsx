import React from "react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import CollectionSelector from "../../ui/CollectionSelector";
import ErrorMessage from "../../ui/ErrorMessage";
import LoadingIndicator from "../../ui/LoadingIndicator";
import type { ApiError, CandidateViewModel } from "../../../hooks/useGenerateFlashcards";

interface Step3_SaveSelectionProps {
  acceptedCandidates: CandidateViewModel[];
  availableCollections: string[];
  selectedCollection: string;
  isNewCollection: boolean;
  isLoadingSave: boolean;
  isLoadingCollections: boolean;
  saveApiError: ApiError | null;
  collectionsApiError: ApiError | null;
  onCollectionChange: (name: string, isNew: boolean) => void;
  onSaveClick: () => void;
}

export default function Step3_SaveSelection({
  acceptedCandidates,
  availableCollections,
  selectedCollection,
  isNewCollection,
  isLoadingSave,
  isLoadingCollections,
  saveApiError,
  collectionsApiError,
  onCollectionChange,
  onSaveClick,
}: Step3_SaveSelectionProps) {
  // Whether the "Save flashcards" button should be disabled
  const hasValidCollection = selectedCollection.trim() !== "";
  const hasAcceptedCards = acceptedCandidates.length > 0;
  const isSaveDisabled = isLoadingSave || isLoadingCollections || !hasValidCollection || !hasAcceptedCards;

  return (
    <div className="space-y-6">
      {/* Header and collection selection */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-2">Save flashcards</h2>
        <p className="text-muted-foreground mb-4">
          Select existing collection or create new one to save {acceptedCandidates.length} accepted flashcards.
        </p>

        <div className="mb-2">
          <label htmlFor="collection-selector" className="block text-sm font-medium mb-1">
            Collection
          </label>
          <div className="relative">
            <div id="collection-selector">
              <CollectionSelector
                collections={availableCollections}
                value={selectedCollection}
                onChange={onCollectionChange}
                placeholder="Select or create collection..."
                isLoading={isLoadingCollections}
                disabled={isLoadingSave}
              />
            </div>
            {isLoadingCollections && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <LoadingIndicator isLoading={true} size="sm" />
              </div>
            )}
          </div>
          {isNewCollection && selectedCollection && (
            <p className="text-xs text-muted-foreground mt-1">
              A new collection named &quot;{selectedCollection}&quot; will be created.
            </p>
          )}
        </div>

        {collectionsApiError && <ErrorMessage error={collectionsApiError} className="mt-2" />}

        <div className="mt-4 flex justify-end">
          <Button onClick={onSaveClick} disabled={isSaveDisabled} className="min-w-[150px]" data-testid="save-button">
            {isLoadingSave ? <LoadingIndicator isLoading={true} size="sm" text="Saving..." /> : "Save flashcards"}
          </Button>
        </div>
      </div>

      {/* Save error */}
      {saveApiError && <ErrorMessage error={saveApiError} className="mt-4" />}

      {/* List of accepted flashcards */}
      <div>
        <h3 className="text-lg font-medium mb-3">Accepted flashcards ({acceptedCandidates.length})</h3>
        <div className="grid grid-cols-1 gap-4">
          {acceptedCandidates.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-lg border">
              <p className="text-muted-foreground">
                No accepted flashcards. Go back to the previous step and accept flashcards.
              </p>
            </div>
          ) : (
            acceptedCandidates.map((candidate) => (
              <Card key={candidate.tempId} className="border-primary/10 bg-primary/5">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Front:</h4>
                      <p className="p-2 bg-card rounded border">{candidate.front}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Back:</h4>
                      <p className="p-2 bg-card rounded border">{candidate.back}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
