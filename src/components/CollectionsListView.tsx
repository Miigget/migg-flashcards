import React from "react"; // Removed useState, useEffect
// Removed ApiError, PaginatedResponse, FlashcardDTO, toast imports (handled by hook)
import CollectionItem from "@/components/CollectionItem";
import RenameCollectionDialog from "@/components/RenameCollectionDialog";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import ErrorDisplay from "@/components/ErrorDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useCollectionsList } from "@/components/hooks/useCollectionsList"; // Import the custom hook

const CollectionsListView: React.FC = () => {
  // Use the custom hook to get state and handlers
  const {
    collections,
    isLoading,
    error,
    retryFetchNames,
    renameTarget,
    isSubmittingRename,
    renameError,
    handleRenameClick,
    handleRenameCancel,
    handleRenameSubmit,
    deleteTarget,
    isSubmittingDelete,
    deleteError,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    collectionNamesForValidation,
  } = useCollectionsList();

  // Render logic remains largely the same, but uses props from the hook

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-8 w-20" />
              <div className="space-x-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        title="Error loading collections"
        message="Failed to fetch your list of collections."
        onRetry={retryFetchNames} // Use retry handler from hook
      />
    );
  }

  if (collections.length === 0 && !isLoading) {
    return <div className="text-center text-muted-foreground py-8">No collections found. Create your first one!</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <CollectionItem
            key={collection.name}
            collection={collection}
            onRenameClick={handleRenameClick}
            onDeleteClick={handleDeleteClick}
          />
        ))}
      </div>

      {renameTarget !== null && (
        <RenameCollectionDialog
          isOpen={renameTarget !== null}
          currentName={renameTarget}
          onRenameSubmit={handleRenameSubmit}
          onCancel={handleRenameCancel}
          existingNames={collectionNamesForValidation.filter((name) => name !== renameTarget)}
          isSubmitting={isSubmittingRename}
          error={renameError}
        />
      )}

      {deleteTarget !== null && (
        <DeleteConfirmationDialog
          isOpen={deleteTarget !== null}
          itemType="collection"
          itemName={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={isSubmittingDelete}
          error={deleteError}
        />
      )}
    </>
  );
};

export default CollectionsListView;
