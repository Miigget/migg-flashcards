import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCreateFlashcard } from "./useCreateFlashcard"; // Adjust path if necessary
import type { CreateFlashcardCommand, FlashcardDTO, ApiError } from "@/types";
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

describe("useCreateFlashcard", () => {
  const mockFlashcardData: CreateFlashcardCommand = {
    front: "New Question",
    back: "New Answer",
    collection: "Target Collection",
    source: "manual",
  };

  const mockApiResponse: FlashcardDTO = {
    flashcard_id: 100,
    user_id: "user1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    generation_id: null,
    ...mockFlashcardData,
  };

  beforeEach(() => {
    mockedFetch.mockClear();
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    // Act
    const { result } = renderHook(() => useCreateFlashcard());

    // Assert
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should set submitting state, call fetch, show success toast, and return created flashcard", async () => {
    // Arrange: Mock successful fetch response
    mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiResponse), { status: 201 }));

    // Act
    const { result } = renderHook(() => useCreateFlashcard());

    // Act: Call create function
    let createdFlashcard: FlashcardDTO | undefined;
    await act(async () => {
      createdFlashcard = await result.current.createFlashcard(mockFlashcardData);
    });

    // Assert: Submitting state handled (check final state)
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();

    // Assert: Fetch called correctly
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith("/api/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(mockFlashcardData),
    });

    // Assert: Success toast shown
    expect(toast.success).toHaveBeenCalledWith("Success", { description: "Flashcard created successfully." });

    // Assert: Returned value is correct
    expect(createdFlashcard).toEqual(mockApiResponse);
  });

  it("should set submitting state, call fetch, show error toast, set error state, and throw error on failed creation", async () => {
    // Arrange: Mock failed fetch response
    const errorMessage = "Failed to create flashcard";
    const errorPayload: ApiError = { status: 500, message: errorMessage };
    mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify(errorPayload), { status: 500 }));

    // Act
    const { result } = renderHook(() => useCreateFlashcard());

    // Act & Assert: Call create function and expect it to throw
    await act(async () => {
      await expect(result.current.createFlashcard(mockFlashcardData)).rejects.toThrow(errorMessage);
    });

    // Assert: Submitting state handled and error state set
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toEqual(errorPayload);

    // Assert: Fetch called correctly
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith("/api/flashcards", expect.objectContaining({ method: "POST" }));

    // Assert: Error toast shown
    expect(toast.error).toHaveBeenCalledWith("Error", { description: errorMessage });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should handle network errors, set error state, show toast and throw error", async () => {
    // Arrange: Mock fetch to reject
    const networkErrorMessage = "Network Error";
    mockedFetch.mockRejectedValueOnce(new Error(networkErrorMessage));

    // Act
    const { result } = renderHook(() => useCreateFlashcard());

    // Act & Assert: Call create function and expect it to throw
    await act(async () => {
      await expect(result.current.createFlashcard(mockFlashcardData)).rejects.toThrow(networkErrorMessage);
    });

    // Assert: Submitting state handled and error state set
    expect(result.current.isSubmitting).toBe(false);
    // Hook sets a generic error state in this case
    expect(result.current.error).toEqual({ status: 500, message: networkErrorMessage });

    // Assert: Fetch called
    expect(mockedFetch).toHaveBeenCalledTimes(1);

    // Assert: Error toast shown
    expect(toast.error).toHaveBeenCalledWith("Error", { description: networkErrorMessage });
    expect(toast.success).not.toHaveBeenCalled();
  });
});
