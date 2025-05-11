import React from "react"; // Removed useState, useEffect
// Removed ApiError, FlashcardDTO, PaginatedResponse, toast imports
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FlashcardItem from "@/components/FlashcardItem";
import PaginationControls from "@/components/ui/PaginationControls";
import RenameCollectionDialog from "@/components/RenameCollectionDialog";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import EditFlashcardDialog from "@/components/EditFlashcardDialog";
import ErrorDisplay from "@/components/ErrorDisplay";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useCollectionDetail } from "@/components/hooks/useCollectionDetail"; // Import the hook

// Removed internal ViewModel interface

interface CollectionDetailViewProps {
  initialCollectionName: string;
}

const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({ initialCollectionName }) => {
  // Use the custom hook
  const {
    viewModel,
    handlePageChange,
    handleRetryFetch,
    studyUrl,
    createUrl,
    generateUrl,
    isSubmittingAny,
    showRenameDialog,
    isSubmittingRename,
    renameError,
    handleRenameClick,
    handleRenameCancel,
    handleRenameSubmit,
    showDeleteDialog,
    isSubmittingDelete,
    deleteError,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    editFlashcardTarget,
    isSubmittingEdit,
    editError,
    handleEditFlashcard,
    handleEditCancel,
    handleEditSubmit,
    deleteFlashcardTargetId,
    isSubmittingFlashcardDelete,
    deleteFlashcardError,
    handleDeleteFlashcard,
    handleDeleteFlashcardCancel,
    handleDeleteFlashcardConfirm,
  } = useCollectionDetail(initialCollectionName);

  // Loading State
  if (viewModel.isLoading && viewModel.flashcards.length === 0) {
    return (
      // Same Skeleton structure as before
      <div>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="space-x-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="mb-6 space-x-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-6 w-1/4 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-4/5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-9 w-64" />
        </div>
      </div>
    );
  }

  // Error State
  if (viewModel.error) {
    return (
      <ErrorDisplay
        error={viewModel.error}
        title="Error loading collection details"
        message={viewModel.error.message || "Failed to fetch data for this collection."}
        onRetry={handleRetryFetch}
      />
    );
  }

  // Main Render Logic (uses hook props)
  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{viewModel.collectionName}</h1>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={handleRenameClick} disabled={isSubmittingAny}>
              Rename
            </Button>
            <Button size="sm" onClick={handleDeleteClick} disabled={isSubmittingAny}>
              Delete
            </Button>
          </div>
        </div>

        <div className="mb-6 space-x-2">
          <Button asChild disabled={isSubmittingAny}>
            <a href={studyUrl}>Start learning</a>
          </Button>
          <Button asChild variant="outline" disabled={isSubmittingAny}>
            <a href={createUrl}>Add flashcard</a>
          </Button>
          <Button asChild variant="outline" disabled={isSubmittingAny}>
            <a href={generateUrl}>AI Generate</a>
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-4">Flashcards ({viewModel.pagination.totalItems})</h2>
        {viewModel.flashcards.length === 0 && !viewModel.isLoading ? (
          <p>No flashcards in this collection.</p>
        ) : (
          <div className="space-y-4">
            {viewModel.flashcards.map((fc) => (
              <FlashcardItem
                key={fc.flashcard_id}
                flashcard={fc}
                onEditClick={handleEditFlashcard}
                onDeleteClick={handleDeleteFlashcard}
              />
            ))}
          </div>
        )}

        {viewModel.pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <PaginationControls
              currentPage={viewModel.pagination.currentPage}
              totalPages={viewModel.pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Dialogs (use props from hook) */}
      <RenameCollectionDialog
        isOpen={showRenameDialog}
        currentName={viewModel.collectionName}
        onRenameSubmit={handleRenameSubmit}
        onCancel={handleRenameCancel}
        isSubmitting={isSubmittingRename}
        error={renameError}
      />

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        itemType="collection"
        itemName={viewModel.collectionName}
        additionalInfo={`This will delete all ${viewModel.pagination.totalItems} flashcards in this collection.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isSubmittingDelete}
        error={deleteError}
      />

      <EditFlashcardDialog
        isOpen={editFlashcardTarget !== null}
        flashcard={editFlashcardTarget}
        onEditSubmit={handleEditSubmit}
        onCancel={handleEditCancel}
        isSubmitting={isSubmittingEdit}
        error={editError}
      />

      {deleteFlashcardTargetId !== null &&
        (() => {
          const flashcardToDelete = viewModel.flashcards.find((fc) => fc.flashcard_id === deleteFlashcardTargetId);
          return (
            <DeleteConfirmationDialog
              isOpen={deleteFlashcardTargetId !== null}
              itemType="flashcard"
              itemName={
                flashcardToDelete
                  ? `"${flashcardToDelete.front.substring(0, 30)}..."`
                  : `ID: ${deleteFlashcardTargetId}`
              }
              onConfirm={handleDeleteFlashcardConfirm}
              onCancel={handleDeleteFlashcardCancel}
              isDeleting={isSubmittingFlashcardDelete}
              error={deleteFlashcardError}
            />
          );
        })()}
    </>
  );
};

export default CollectionDetailView;
