import { useState, useEffect, useCallback } from "react";
import type { ApiError, FlashcardDTO, PaginatedResponse } from "@/types";
import { toast } from "sonner";

const PAGE_SIZE = 10;

// Define ViewModel structure internally for the hook's state
interface CollectionDetailState {
  collectionName: string;
  flashcards: FlashcardDTO[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  isLoading: boolean;
  error: ApiError | null;
}

export function useCollectionDetail(initialCollectionName: string) {
  const [state, setState] = useState<CollectionDetailState>({
    collectionName: initialCollectionName,
    flashcards: [],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit: PAGE_SIZE },
    isLoading: true,
    error: null,
  });

  // Dialog States
  const [showRenameDialog, setShowRenameDialog] = useState<boolean>(false);
  const [isSubmittingRename, setIsSubmittingRename] = useState<boolean>(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editFlashcardTarget, setEditFlashcardTarget] = useState<FlashcardDTO | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteFlashcardTargetId, setDeleteFlashcardTargetId] = useState<number | null>(null);
  const [isSubmittingFlashcardDelete, setIsSubmittingFlashcardDelete] = useState<boolean>(false);
  const [deleteFlashcardError, setDeleteFlashcardError] = useState<string | null>(null);

  // Fetching Logic
  const fetchFlashcards = useCallback(async (page: number, collectionName: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(
        `/api/flashcards?collection=${encodeURIComponent(collectionName)}&page=${page}&limit=${PAGE_SIZE}`
      );
      if (!response.ok) {
        const errorData: ApiError = { status: response.status, message: `Failed fetch for ${collectionName}` };
        throw errorData;
      }
      const data: PaginatedResponse<FlashcardDTO> = await response.json();
      setState((prev) => ({
        ...prev,
        collectionName: collectionName, // Ensure name is updated if it changed
        flashcards: data.data,
        pagination: {
          currentPage: data.page,
          totalPages: Math.ceil(data.total / data.limit) || 1,
          totalItems: data.total,
          limit: data.limit,
        },
        isLoading: false,
      }));
    } catch (error: unknown) {
      console.error("Error fetching flashcards:", error);
      const apiError = error as ApiError;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: { status: apiError?.status || 500, message: apiError?.message || "Unknown fetch error" },
      }));
    }
  }, []);

  useEffect(() => {
    fetchFlashcards(state.pagination.currentPage, state.collectionName);
  }, [state.pagination.currentPage, state.collectionName, fetchFlashcards]);

  const handleRetryFetch = useCallback(() => {
    fetchFlashcards(1, state.collectionName); // Reset to page 1 on retry?
  }, [state.collectionName, fetchFlashcards]);

  const handlePageChange = useCallback((newPage: number) => {
    setState((prev) => ({ ...prev, pagination: { ...prev.pagination, currentPage: newPage } }));
  }, []);

  // Collection Dialog Handlers
  const handleRenameClick = useCallback(() => {
    setRenameError(null);
    setShowRenameDialog(true);
  }, []);
  const handleRenameCancel = useCallback(() => {
    setShowRenameDialog(false);
  }, []);
  const handleRenameSubmit = useCallback(
    async (newName: string) => {
      setIsSubmittingRename(true);
      setRenameError(null);
      try {
        const response = await fetch(`/api/collections/${encodeURIComponent(state.collectionName)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_name: newName }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API Error ${response.status}`);
        }
        setState((prev) => ({ ...prev, collectionName: newName })); // Update name in state
        setShowRenameDialog(false);
        toast.success(`Renamed to "${newName}"`);
        const newUrl = `/collections/${encodeURIComponent(newName)}`;
        window.history.pushState({}, "", newUrl);
        document.title = `Kolekcja: ${newName}`;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Rename failed";
        setRenameError(message);
        toast.error(message);
        throw error;
      } finally {
        setIsSubmittingRename(false);
      }
    },
    [state.collectionName]
  );

  const handleDeleteClick = useCallback(() => {
    setDeleteError(null);
    setShowDeleteDialog(true);
  }, []);
  const handleDeleteCancel = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);
  const handleDeleteConfirm = useCallback(async () => {
    setIsSubmittingDelete(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/collections/${encodeURIComponent(state.collectionName)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error ${response.status}`);
      }
      toast.success(`Deleted collection "${state.collectionName}"`);
      window.location.href = "/collections";
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Delete failed";
      setDeleteError(message);
      toast.error(message);
      // Don't set loading false here as we are navigating away
      throw error;
    }
    // No finally block needed if navigating away on success
  }, [state.collectionName]);

  // Flashcard Dialog Handlers
  const handleEditFlashcard = useCallback((flashcard: FlashcardDTO) => {
    setEditError(null);
    setEditFlashcardTarget(flashcard);
  }, []);
  const handleEditCancel = useCallback(() => {
    setEditFlashcardTarget(null);
  }, []);
  const handleEditSubmit = useCallback(
    async (flashcardId: number, updates: Partial<Pick<FlashcardDTO, "front" | "back" | "collection">>) => {
      setIsSubmittingEdit(true);
      setEditError(null);
      try {
        const response = await fetch(`/api/flashcards/${flashcardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API Error ${response.status}`);
        }
        const updatedFlashcard: FlashcardDTO = await response.json();
        setState((prev) => ({
          ...prev,
          flashcards: prev.flashcards.map((fc) => (fc.flashcard_id === flashcardId ? updatedFlashcard : fc)),
        }));
        setEditFlashcardTarget(null);
        toast.success("Flashcard updated.");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Update failed";
        setEditError(message);
        toast.error(message);
        throw error;
      } finally {
        setIsSubmittingEdit(false);
      }
    },
    []
  );

  const handleDeleteFlashcard = useCallback((id: number) => {
    setDeleteFlashcardError(null);
    setDeleteFlashcardTargetId(id);
    setShowDeleteDialog(false);
  }, []);
  const handleDeleteFlashcardCancel = useCallback(() => {
    setDeleteFlashcardTargetId(null);
  }, []);
  const handleDeleteFlashcardConfirm = useCallback(async () => {
    if (deleteFlashcardTargetId === null) return;
    setIsSubmittingFlashcardDelete(true);
    setDeleteFlashcardError(null);
    try {
      const response = await fetch(`/api/flashcards/${deleteFlashcardTargetId}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error ${response.status}`);
      }
      const deletedId = deleteFlashcardTargetId;
      setState((prev) => {
        const newFlashcards = prev.flashcards.filter((fc) => fc.flashcard_id !== deletedId);
        const newTotalItems = prev.pagination.totalItems - 1;
        const newTotalPages = Math.ceil(newTotalItems / PAGE_SIZE) || 1;
        const newCurrentPage =
          prev.pagination.currentPage > newTotalPages
            ? newTotalPages
            : newFlashcards.length === 0 && prev.pagination.currentPage > 1
              ? prev.pagination.currentPage - 1
              : prev.pagination.currentPage;
        return {
          ...prev,
          flashcards: newFlashcards,
          pagination: {
            ...prev.pagination,
            totalItems: newTotalItems,
            totalPages: newTotalPages,
            currentPage: newCurrentPage,
          },
        };
      });
      setDeleteFlashcardTargetId(null);
      toast.success("Flashcard deleted.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Delete failed";
      setDeleteFlashcardError(message);
      toast.error("Error", { description: message });
      throw error;
    } finally {
      setIsSubmittingFlashcardDelete(false);
    }
  }, [deleteFlashcardTargetId]);

  // URLs for navigation buttons
  const studyUrl = `/study/${encodeURIComponent(state.collectionName)}`;
  const createUrl = `/create?collection=${encodeURIComponent(state.collectionName)}`;
  const generateUrl = `/generate?collection=${encodeURIComponent(state.collectionName)}`;

  // Determine overall submitting state for disabling buttons
  const isSubmittingAny = isSubmittingRename || isSubmittingDelete || isSubmittingEdit || isSubmittingFlashcardDelete;

  return {
    // View Model Data (derived from state)
    viewModel: {
      collectionName: state.collectionName,
      flashcards: state.flashcards,
      pagination: state.pagination,
      isLoading: state.isLoading,
      error: state.error,
    },
    // Actions
    handlePageChange,
    handleRetryFetch,
    studyUrl,
    createUrl,
    generateUrl,
    isSubmittingAny,
    // Collection Rename Dialog
    showRenameDialog,
    isSubmittingRename,
    renameError,
    handleRenameClick,
    handleRenameCancel,
    handleRenameSubmit,
    // Collection Delete Dialog
    showDeleteDialog,
    isSubmittingDelete,
    deleteError,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    // Flashcard Edit Dialog
    editFlashcardTarget,
    isSubmittingEdit,
    editError,
    handleEditFlashcard,
    handleEditCancel,
    handleEditSubmit,
    // Flashcard Delete Dialog
    deleteFlashcardTargetId,
    isSubmittingFlashcardDelete,
    deleteFlashcardError,
    handleDeleteFlashcard,
    handleDeleteFlashcardCancel,
    handleDeleteFlashcardConfirm,
  };
}
