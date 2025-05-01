import { useState, useEffect, useCallback } from "react";
import type { ApiError, CollectionViewModel, PaginatedResponse, FlashcardDTO } from "@/types";
import { toast } from "sonner";

export function useCollectionsList() {
  const [collectionNames, setCollectionNames] = useState<string[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState<boolean>(true);
  const [errorNames, setErrorNames] = useState<ApiError | null>(null);
  const [collections, setCollections] = useState<CollectionViewModel[]>([]);

  // Dialog State
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [isSubmittingRename, setIsSubmittingRename] = useState<boolean>(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetching Logic
  const fetchCollectionNames = useCallback(async () => {
    setIsLoadingNames(true);
    setErrorNames(null);
    setCollections([]);
    try {
      const response = await fetch("/api/collections");
      if (!response.ok) {
        const errorData: ApiError = {
          status: response.status,
          message: response.statusText || "Failed to fetch names",
        };
        throw errorData;
      }
      const data: string[] = await response.json();
      setCollectionNames(data);
      const initialCollections = data.map((name) => ({
        name: name,
        flashcardCount: null,
        isLoadingCount: true,
        errorCount: null,
      }));
      setCollections(initialCollections);
    } catch (error: unknown) {
      console.error("Error fetching collection names:", error);
      const apiError = error as ApiError; // Basic assertion
      setErrorNames({ status: apiError?.status || 500, message: apiError?.message || "Unknown error fetching names" });
    } finally {
      setIsLoadingNames(false);
    }
  }, []);

  useEffect(() => {
    fetchCollectionNames();
  }, [fetchCollectionNames]);

  useEffect(() => {
    if (collectionNames.length === 0 || isLoadingNames) {
      return;
    }

    const fetchCounts = async () => {
      const countPromises = collections
        .filter((c) => c.isLoadingCount) // Only fetch for those still loading
        .map(async (collection) => {
          try {
            const response = await fetch(
              `/api/flashcards?collection=${encodeURIComponent(collection.name)}&limit=1&page=1`
            );
            if (!response.ok) {
              const errorData: ApiError = {
                status: response.status,
                message: `Count fetch failed for ${collection.name}`,
              };
              throw errorData;
            }
            const data: PaginatedResponse<FlashcardDTO> = await response.json();
            return { name: collection.name, count: data.total, error: null };
          } catch (error: unknown) {
            console.error(`Error fetching count for ${collection.name}:`, error);
            return { name: collection.name, count: null, error: error as ApiError };
          }
        });

      if (countPromises.length === 0) return;

      const results = await Promise.allSettled(countPromises);

      setCollections((prevCollections) =>
        prevCollections.map((collection) => {
          const result = results.find((r) => r.status === "fulfilled" && r.value.name === collection.name);
          if (result?.status === "fulfilled") {
            return { ...collection, flashcardCount: result.value.count, isLoadingCount: false, errorCount: null };
          }

          const errorResult = results.find(
            (r) =>
              r.status === "rejected" ||
              (r.status === "fulfilled" && r.value.name === collection.name && r.value.error !== null)
          );
          let apiError: ApiError | null = null;
          if (errorResult?.status === "rejected") {
            const reason = errorResult.reason as ApiError;
            apiError = { status: reason?.status || 500, message: reason?.message || "Fetch count failed" };
          } else if (errorResult?.status === "fulfilled") {
            apiError = errorResult.value.error;
          }

          if (apiError && collection.name === apiError.message?.split(" ").pop()) {
            // Check if error matches collection name
            return { ...collection, flashcardCount: null, isLoadingCount: false, errorCount: apiError };
          }

          // If no result/error found for this collection (shouldn't happen if filtered correctly), keep loading state?
          // Or assume it finished successfully if not in error results?
          // Keeping existing state seems safer if filtered correctly.
          return collection;
        })
      );
    };

    fetchCounts();
    // Dependency: collections array itself, specifically isLoadingCount flags.
    // Stringifying a part of it or using a counter might be needed if direct dependency causes loops.
  }, [collections, isLoadingNames]); // Re-run when collections state changes (e.g., isLoadingCount) or names finish loading

  // Dialog Handlers
  const handleRenameClick = useCallback((name: string) => {
    setRenameTarget(name);
    setRenameError(null);
  }, []);

  const handleRenameCancel = useCallback(() => {
    setRenameTarget(null);
  }, []);

  const handleRenameSubmit = useCallback(
    async (newName: string) => {
      if (!renameTarget) return;
      setIsSubmittingRename(true);
      setRenameError(null);
      try {
        const response = await fetch(`/api/collections/${encodeURIComponent(renameTarget)}`, {
          /* ... PUT options ... */ method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ new_name: newName }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API Error ${response.status}`);
        }
        setCollections((prev) => prev.map((c) => (c.name === renameTarget ? { ...c, name: newName } : c)));
        setCollectionNames((prev) => prev.map((n) => (n === renameTarget ? newName : n)));
        setRenameTarget(null);
        toast.success(`Renamed collection to "${newName}"`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Rename failed";
        setRenameError(message);
        toast.error(message);
        throw error;
      } finally {
        setIsSubmittingRename(false);
      }
    },
    [renameTarget]
  );

  const handleDeleteClick = useCallback((name: string) => {
    setDeleteTarget(name);
    setDeleteError(null);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsSubmittingDelete(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/collections/${encodeURIComponent(deleteTarget)}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error ${response.status}`);
      }
      setCollections((prev) => prev.filter((c) => c.name !== deleteTarget));
      setCollectionNames((prev) => prev.filter((n) => n !== deleteTarget));
      setDeleteTarget(null);
      toast.success(`Deleted collection "${deleteTarget}"`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Delete failed";
      setDeleteError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsSubmittingDelete(false);
    }
  }, [deleteTarget]);

  const retryFetchNames = useCallback(() => {
    fetchCollectionNames();
  }, [fetchCollectionNames]);

  return {
    collections,
    isLoading: isLoadingNames, // Use isLoadingNames as the primary loading state
    error: errorNames,
    retryFetchNames,
    // Rename Dialog Props
    renameTarget,
    isSubmittingRename,
    renameError,
    handleRenameClick,
    handleRenameCancel,
    handleRenameSubmit,
    // Delete Dialog Props
    deleteTarget,
    isSubmittingDelete,
    deleteError,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    // Pass collection names for validation
    collectionNamesForValidation: collectionNames,
  };
}
