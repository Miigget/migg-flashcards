import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCollectionDetail } from "./useCollectionDetail"; // Adjust path if necessary
import type { FlashcardDTO, PaginatedResponse } from "@/types"; // Removed ApiError
import { toast } from "sonner";

// Mock fetch globally
global.fetch = vi.fn();
const mockedFetch = fetch as ReturnType<typeof vi.fn>;

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useCollectionDetail", () => {
  const collectionName = "Test Collection";
  const mockFlashcardsPage1Data: FlashcardDTO[] = [
    {
      flashcard_id: 1,
      front: "Q1",
      back: "A1",
      collection: collectionName,
      source: "manual",
      user_id: "u1",
      created_at: "",
      updated_at: "",
      generation_id: null,
    },
    {
      flashcard_id: 2,
      front: "Q2",
      back: "A2",
      collection: collectionName,
      source: "manual",
      user_id: "u1",
      created_at: "",
      updated_at: "",
      generation_id: null,
    },
  ];
  const mockFlashcardsPage1: PaginatedResponse<FlashcardDTO> = {
    data: mockFlashcardsPage1Data,
    page: 1,
    limit: 10,
    total: 3,
  };
  const mockFlashcardsPage2Data: FlashcardDTO[] = [
    {
      flashcard_id: 3,
      front: "Q3",
      back: "A3",
      collection: collectionName,
      source: "manual",
      user_id: "u1",
      created_at: "",
      updated_at: "",
      generation_id: null,
    },
  ];
  const mockFlashcardsPage2: PaginatedResponse<FlashcardDTO> = {
    data: mockFlashcardsPage2Data,
    page: 2,
    limit: 10,
    total: 3,
  };

  beforeEach(() => {
    // Reset mocks first
    vi.resetAllMocks(); // Use resetAllMocks for thorough cleanup
    // mockFetch.mockClear(); // Covered by resetAllMocks
    // vi.clearAllMocks(); // Replaced by resetAllMocks

    // Explicitly reset fetch implementation and set default
    mockedFetch.mockReset();
    mockedFetch.mockImplementation(async (url, options) => {
      const urlStr = url.toString();
      if (urlStr.includes(`/api/flashcards?collection=${encodeURIComponent(collectionName)}`)) {
        const urlParams = new URLSearchParams(urlStr.split("?")[1]);
        const page = parseInt(urlParams.get("page") || "1");
        if (page === 1) {
          return new Response(JSON.stringify(mockFlashcardsPage1), { status: 200 });
        }
        if (page === 2) {
          return new Response(JSON.stringify(mockFlashcardsPage2), { status: 200 });
        }
      }
      if (urlStr.includes(`/api/flashcards/`) && options?.method === "DELETE") {
        return new Response(null, { status: 204 }); // No Content
      }
      // eslint-disable-next-line no-console
      console.warn(`Unhandled fetch mock request: ${options?.method || "GET"} ${urlStr}`);
      return new Response(`Not Found: ${options?.method || "GET"} ${urlStr}`, { status: 404 });
    });

    // Ensure toast mocks are reset (resetAllMocks should handle this)
    // if (toast.error.mockClear) toast.error.mockClear(); // Not needed, resetAllMocks covers vi.mock
    // if (toast.success.mockClear) toast.success.mockClear(); // Not needed, resetAllMocks covers vi.mock
  });

  it("should initialize, fetch first page of flashcards, and update state", async () => {
    // Act
    const { result } = renderHook(() => useCollectionDetail(collectionName));

    // Assert: Initial state (access via viewModel)
    expect(result.current.viewModel.flashcards).toEqual([]);
    expect(result.current.viewModel.isLoading).toBe(true);
    expect(result.current.viewModel.error).toBeNull();
    expect(result.current.viewModel.pagination.currentPage).toBe(1);
    expect(result.current.viewModel.pagination.totalPages).toBe(1); // Initial default
    expect(result.current.viewModel.pagination.totalItems).toBe(0);

    // Assert: Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.viewModel.isLoading).toBe(false);
    });

    // Assert: Final state after first page fetch (access via viewModel)
    expect(result.current.viewModel.flashcards).toEqual(mockFlashcardsPage1.data);
    expect(result.current.viewModel.error).toBeNull();
    expect(result.current.viewModel.pagination.currentPage).toBe(1);
    expect(result.current.viewModel.pagination.totalPages).toBe(1); // Calculated from total/limit
    expect(result.current.viewModel.pagination.totalItems).toBe(mockFlashcardsPage1.total);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith(expect.stringContaining(`page=1`));
  });

  it("should handle fetching the next page via handlePageChange", async () => {
    // Arrange: Mock fetch for page 1 and 2
    mockedFetch.mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes(`/api/flashcards?collection=${encodeURIComponent(collectionName)}`)) {
        const urlParams = new URLSearchParams(urlStr.split("?")[1]);
        const page = parseInt(urlParams.get("page") || "1");
        if (page === 1) return new Response(JSON.stringify(mockFlashcardsPage1), { status: 200 });
        if (page === 2) return new Response(JSON.stringify(mockFlashcardsPage2), { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    });

    // Act: Initial render and wait for first page
    const { result } = renderHook(() => useCollectionDetail(collectionName));
    await waitFor(() => expect(result.current.viewModel.isLoading).toBe(false));

    // Assert: Initial state correct
    expect(result.current.viewModel.pagination.currentPage).toBe(1);
    expect(result.current.viewModel.pagination.totalPages).toBe(1);
    expect(result.current.viewModel.flashcards).toHaveLength(2);

    // Act: Call page change handler
    act(() => {
      result.current.handlePageChange(2);
    });

    // Assert: Loading state should be true while fetching page 2
    await waitFor(() => {
      expect(result.current.viewModel.isLoading).toBe(true);
    });
    // Assert: Wait for fetch of page 2 to complete
    await waitFor(() => {
      expect(result.current.viewModel.isLoading).toBe(false);
    });

    // Assert: State updated after fetching page 2
    expect(result.current.viewModel.flashcards).toEqual(mockFlashcardsPage2.data); // Should replace data
    expect(result.current.viewModel.pagination.currentPage).toBe(2);
    expect(result.current.viewModel.pagination.totalPages).toBe(1); // Remains 1 based on initial total=3
    expect(mockedFetch).toHaveBeenCalledTimes(2); // Fetch page 1, then page 2
    expect(mockedFetch).toHaveBeenCalledWith(expect.stringContaining(`page=1`));
    expect(mockedFetch).toHaveBeenCalledWith(expect.stringContaining(`page=2`));
  });

  it("should handle errors during flashcard fetch", async () => {
    // Arrange: Mock fetch to fail
    const errorMessage = "Failed to fetch flashcards";
    mockedFetch.mockRejectedValueOnce(new Error(errorMessage)); // Mock rejection

    // Act
    const { result } = renderHook(() => useCollectionDetail(collectionName));

    // Assert: Wait for loading to finish and error to appear
    await waitFor(() => {
      expect(result.current.viewModel.isLoading).toBe(false);
    });

    // Assert: Error state is set (access via viewModel)
    expect(result.current.viewModel.flashcards).toEqual([]);
    // The hook catches the error and formats it into ApiError
    expect(result.current.viewModel.error).toEqual({ status: 500, message: errorMessage });
  });

  it("should handle deleting a flashcard and updating state", async () => {
    // Arrange: Render hook and wait for initial load
    const { result } = renderHook(() => useCollectionDetail(collectionName));
    await waitFor(() => expect(result.current.viewModel.isLoading).toBe(false));

    const initialFlashcards = result.current.viewModel.flashcards;
    const flashcardToDelete = initialFlashcards[0]; // Assume ID 1
    expect(initialFlashcards).toHaveLength(2); // Ensure we have flashcards initially
    expect(mockedFetch).toHaveBeenCalledTimes(1); // Verify initial fetch

    // Act: Trigger deletion in separate steps
    act(() => {
      result.current.handleDeleteFlashcard(flashcardToDelete.flashcard_id); // Sets the target ID
    });

    // Now call confirm in a separate act block to ensure state update is processed
    await act(async () => {
      await result.current.handleDeleteFlashcardConfirm(); // Confirms deletion and triggers fetch DELETE
    });

    // Assert: Wait for fetch DELETE call and related updates
    await waitFor(() => {
      // Check fetch call for DELETE
      expect(mockedFetch).toHaveBeenCalledWith(
        `/api/flashcards/${flashcardToDelete.flashcard_id}`,
        // Make sure the options object is checked, specifically the method
        expect.objectContaining({ method: "DELETE" })
      );

      // Check total fetch calls
      expect(mockedFetch).toHaveBeenCalledTimes(2); // Initial GET + DELETE

      // Check toast success message
      expect(toast.success).toHaveBeenCalledWith("Flashcard deleted.");

      // Check state update (flashcard removed)
      expect(result.current.viewModel.flashcards).toHaveLength(initialFlashcards.length - 1);
      expect(
        result.current.viewModel.flashcards.find((fc) => fc.flashcard_id === flashcardToDelete.flashcard_id)
      ).toBeUndefined();
      // Check pagination update (total items decreased)
      expect(result.current.viewModel.pagination.totalItems).toBe(mockFlashcardsPage1.total - 1);
    });
  });

  it("should handle error during flashcard deletion", async () => {
    // Arrange: Mock fetch to fail on DELETE
    const deleteErrorMessage = "Server error during delete";
    mockedFetch.mockImplementation(async (url, options) => {
      const urlStr = url.toString();
      // Initial GET succeeds
      if (
        urlStr.includes(`/api/flashcards?collection=${encodeURIComponent(collectionName)}`) &&
        (!options || options.method === "GET" || options.method === undefined)
      ) {
        return new Response(JSON.stringify(mockFlashcardsPage1), { status: 200 });
      }
      // DELETE fails
      if (urlStr.includes(`/api/flashcards/`) && options?.method === "DELETE") {
        const errorResponse = { message: deleteErrorMessage };
        // Ensure headers are set for JSON response if needed by the hook's error handling
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(`Not Found`, { status: 404 });
    });

    // Act: Render hook and wait for load
    const { result } = renderHook(() => useCollectionDetail(collectionName));
    await waitFor(() => expect(result.current.viewModel.isLoading).toBe(false));

    const initialFlashcards = result.current.viewModel.flashcards;
    const flashcardToDelete = initialFlashcards[0]; // ID 1
    expect(mockedFetch).toHaveBeenCalledTimes(1); // Verify initial fetch

    // Act: Trigger deletion expecting error in separate steps
    act(() => {
      result.current.handleDeleteFlashcard(flashcardToDelete.flashcard_id);
    });

    await act(async () => {
      // Use try/catch because the hook re-throws the error after handling it
      try {
        await result.current.handleDeleteFlashcardConfirm();
      } catch (e) {
        // Verify the error is thrown as expected
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toContain(deleteErrorMessage);
      }
    });

    // Assert: Wait for assertions after the error occurred
    await waitFor(() => {
      // Check fetch call was made for DELETE
      expect(mockedFetch).toHaveBeenCalledWith(
        `/api/flashcards/${flashcardToDelete.flashcard_id}`,
        expect.objectContaining({ method: "DELETE" })
      );
      expect(mockedFetch).toHaveBeenCalledTimes(2); // Initial GET + failed DELETE attempt

      // Check toast error message
      // The hook might use a generic title like "Error" and put details in description
      expect(toast.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ description: deleteErrorMessage })
      );

      // Check state (flashcards should NOT have changed)
      expect(result.current.viewModel.flashcards).toEqual(initialFlashcards);

      // Check error state stored within the hook
      expect(result.current.deleteFlashcardError).toBe(deleteErrorMessage);
    });
  });

  // Add tests for search/filter/sorting if implemented
  // Add tests for updating a flashcard using handleEditFlashcard/Submit if needed
});
