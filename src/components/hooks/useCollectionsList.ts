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
      // Identify collections that need counts fetched
      const collectionsToFetch = collections.filter((c) => c.isLoadingCount);
      if (collectionsToFetch.length === 0) return;

      const countPromises = collectionsToFetch.map(async (collection) => {
        try {
          const response = await fetch(
            // Fetch only 1 item to get the total count efficiently
            `/api/flashcards?collection=${encodeURIComponent(collection.name)}&limit=1&page=1`
          );
          if (!response.ok) {
            // Try to parse error response, fallback if needed
            let errorPayload: ApiError;
            try {
              errorPayload = await response.json();
              if (typeof errorPayload.message !== "string") throw new Error(); // Validate structure
            } catch {
              errorPayload = {
                status: response.status,
                message: `Count fetch API error ${response.status} for ${collection.name}`,
              };
            }
            throw errorPayload;
          }
          const data: PaginatedResponse<FlashcardDTO> = await response.json();
          // Return structure matching the catch block for consistency
          return { name: collection.name, count: data.total, error: null };
        } catch (error: unknown) {
          console.error(`Error fetching count for ${collection.name}:`, error);
          // Ensure the error conforms to ApiError structure
          const apiError: ApiError =
            error && typeof error === "object" && "status" in error && "message" in error
              ? (error as ApiError)
              : {
                  status: 500,
                  message:
                    error instanceof Error ? error.message : `Unknown error fetching count for ${collection.name}`,
                };
          // Return error structure
          return { name: collection.name, count: null, error: apiError };
        }
      });

      const results = await Promise.allSettled(countPromises);

      setCollections((prevCollections) => {
        // Calculate the next state based on previous state and results
        const newCollections = prevCollections.map((collection) => {
          // Find the index of this collection within the original list that was fetched
          const indexInFetched = collectionsToFetch.findIndex((c) => c.name === collection.name);

          // If this collection wasn't fetched in this batch, return it unchanged
          if (indexInFetched === -1) {
            return collection;
          }

          const result = results[indexInFetched];

          if (result.status === "fulfilled") {
            const { count, error } = result.value;
            if (error) {
              // Error occurred during fetch and was caught, returned in value
              return { ...collection, flashcardCount: null, isLoadingCount: false, errorCount: error };
            } else {
              // Success
              return { ...collection, flashcardCount: count, isLoadingCount: false, errorCount: null };
            }
          } else {
            // result.status === "rejected"
            // Promise was rejected (e.g., network error before catch)
            const reason = result.reason;
            let message = `Network error fetching count for ${collection.name}`;
            let status = 500;

            if (reason instanceof Error) {
              message = reason.message;
              // Attempt to get status if it's a custom error with status
              if ("status" in reason && typeof reason.status === "number") {
                status = reason.status;
              }
            } else if (typeof reason === "string") {
              message = reason;
            }
            // Add more specific checks if other structured error types are expected

            const apiError: ApiError = { status, message };
            console.error(`Count fetch failed for ${collection.name} (rejected):`, reason);
            return { ...collection, flashcardCount: null, isLoadingCount: false, errorCount: apiError };
          }
        });
        // Return the fully calculated new state array
        return newCollections;
      });
    };

    fetchCounts();
    // Dependency: only run when names finish loading OR if collectionNames array ref changes
  }, [collectionNames, isLoadingNames]); // Removed collections dependency to avoid loops

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
    // Reset state before fetching again? - No, let the fetch handle it.
    fetchCollectionNames();
  }, [fetchCollectionNames]);

  return {
    // State derived for the view
    collections,
    isLoading: isLoadingNames || collections.some((c) => c.isLoadingCount), // Overall loading state
    error: errorNames, // Global error should only reflect name fetching errors

    // Actions
    retryFetchNames,

    // Collection Rename Dialog
    renameTarget,
    isSubmittingRename,
    renameError,
    handleRenameClick,
    handleRenameCancel,
    handleRenameSubmit,

    // Collection Delete Dialog
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
