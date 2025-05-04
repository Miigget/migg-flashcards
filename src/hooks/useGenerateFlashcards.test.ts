/// <reference types="vitest/globals" />
import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from "vitest";
import { useGenerateFlashcards } from "./useGenerateFlashcards";
import type { CandidateViewModel } from "./useGenerateFlashcards";
import type { AIGenerateFlashcardsCommand } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Mock the uuid to have predictable ids
vi.mock("uuid", () => ({
  v4: vi.fn(),
}));

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useGenerateFlashcards Hook", () => {
  let uuidCounter = 0;

  beforeEach(() => {
    // Reset mocks and counter before each test
    vi.resetAllMocks();
    uuidCounter = 0;
    (uuidv4 as Mock).mockImplementation(() => `mock-uuid-${++uuidCounter}`);

    // Explicitly reset fetch mock implementation (safer than relying only on resetAllMocks)
    mockFetch.mockReset();
    // Default fetch mock after reset
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [], generation_id: "default-gen-id", generated_count: 0 }),
    });
  });

  afterEach(() => {
    // Ensure fetch mock is always reset after each test - Using reset in beforeEach is likely sufficient
    // mockFetch.mockClear();
    // mockFetch.mockReset();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useGenerateFlashcards());
    // Match against the expected initial state properties directly on result.current
    // Note: generationId is internal state and not returned, so we omit it here.
    const expectedInitialState: Partial<ReturnType<typeof useGenerateFlashcards>> = {
      currentStep: 1,
      inputText: "",
      inputTextValidationError: null,
      candidates: [],
      // generationId: null, // Omitted - not returned by hook
      isLoadingGenerate: false,
      isLoadingSave: false,
      isLoadingCollections: false,
      generateApiError: null,
      saveApiError: null,
      collectionsApiError: null,
      availableCollections: [],
      selectedCollection: "",
      isNewCollection: false,
    };
    expect(result.current).toMatchObject(expectedInitialState);
  });

  it("handleTextChange should update inputText and validationError", () => {
    const { result } = renderHook(() => useGenerateFlashcards());

    // Test valid text (>= 100 chars)
    const longText = "a".repeat(100);
    act(() => {
      result.current.handleTextChange(longText);
    });
    expect(result.current.inputText).toBe(longText);
    expect(result.current.inputTextValidationError).toBeNull();

    // Test text too short (< 100 chars)
    const shortText = "a".repeat(50);
    act(() => {
      result.current.handleTextChange(shortText);
    });
    expect(result.current.inputText).toBe(shortText);
    expect(result.current.inputTextValidationError).toBe("Tekst musi zawierać co najmniej 100 znaków");

    // Test text too long (> 10000 chars)
    const veryLongText = "a".repeat(10001);
    act(() => {
      result.current.handleTextChange(veryLongText);
    });
    expect(result.current.inputText).toBe(veryLongText);
    expect(result.current.inputTextValidationError).toBe("Tekst nie może przekraczać 10000 znaków");

    // Test empty text
    act(() => {
      result.current.handleTextChange("");
    });
    expect(result.current.inputText).toBe("");
    expect(result.current.inputTextValidationError).toBeNull(); // No error for empty string
  });

  it("handleGenerateClick should not call API if text is invalid", async () => {
    const { result } = renderHook(() => useGenerateFlashcards());

    // Set invalid text
    act(() => {
      result.current.handleTextChange("too short");
    });

    await act(async () => {
      await result.current.handleGenerateClick();
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.isLoadingGenerate).toBe(false);
  });

  it("handleGenerateClick should set loading state and call generate API", async () => {
    const inputText = "a".repeat(100);
    const { result } = renderHook(() => useGenerateFlashcards());

    act(() => {
      result.current.handleTextChange(inputText);
    });

    // Mock fetch to return a promise that never resolves to check loading state
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    // Use await act for async operations within the hook
    await act(async () => {
      // Don't await the click itself, as we want to check the loading state *during* the fetch
      result.current.handleGenerateClick();
    });

    expect(result.current.isLoadingGenerate).toBe(true);
    expect(result.current.generateApiError).toBeNull();

    const expectedCommand: AIGenerateFlashcardsCommand = { text: inputText };
    expect(mockFetch).toHaveBeenCalledWith("/api/flashcards/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expectedCommand),
    });
  });

  it("handleGenerateClick should update state correctly on successful API call", async () => {
    const inputText = "a".repeat(100);
    const generationIdFromApi = "gen-123"; // Keep track of the ID returned by API for candidate check
    const mockApiResponse = {
      candidates: [
        { front: "Q1", back: "A1" },
        { front: "Q2", back: "A2" },
      ],
      generation_id: generationIdFromApi,
      generated_count: 2,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useGenerateFlashcards());

    act(() => {
      result.current.handleTextChange(inputText);
    });

    await act(async () => {
      await result.current.handleGenerateClick();
    });

    // Access properties directly on result.current
    expect(result.current.isLoadingGenerate).toBe(false);
    expect(result.current.generateApiError).toBeNull();
    // expect(result.current.generationId).toBe(generationIdFromApi); // Removed - hook doesn't return generationId
    expect(result.current.currentStep).toBe(2);
    expect(result.current.candidates).toHaveLength(2);

    // Check if candidates received the correct generation_id internally
    const expectedCandidates: CandidateViewModel[] = [
      {
        tempId: "mock-uuid-1",
        front: "Q1",
        back: "A1",
        status: "pending",
        originalFront: "Q1",
        originalBack: "A1",
        validationError: null,
        generation_id: generationIdFromApi, // Check if generation_id was correctly passed to candidates
      },
      {
        tempId: "mock-uuid-2",
        front: "Q2",
        back: "A2",
        status: "pending",
        originalFront: "Q2",
        originalBack: "A2",
        validationError: null,
        generation_id: generationIdFromApi, // Check if generation_id was correctly passed to candidates
      },
    ];
    expect(result.current.candidates).toEqual(expectedCandidates);
  });

  it("handleGenerateClick should update state correctly on failed API call", async () => {
    const inputText = "a".repeat(100);
    const mockApiError = { message: "Generation Failed", status: 500, code: "GEN_ERROR" };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => mockApiError,
    });

    const { result } = renderHook(() => useGenerateFlashcards());

    act(() => {
      result.current.handleTextChange(inputText);
    });

    await act(async () => {
      await result.current.handleGenerateClick();
    });

    // Access properties directly on result.current
    expect(result.current.isLoadingGenerate).toBe(false);
    expect(result.current.generateApiError).toEqual({
      message: "Generation Failed",
      status: 500,
      code: "GEN_ERROR",
    });
    expect(result.current.candidates).toEqual([]);
    expect(result.current.currentStep).toBe(1); // Should remain on step 1 on error
  });

  // Example for handleAccept:
  it("handleAccept should change candidate status to accepted", async () => {
    const inputText = "a".repeat(100);
    const generationIdFromApi = "gen-accept";
    const mockApiResponse = {
      candidates: [{ front: "Q1", back: "A1" }],
      generation_id: generationIdFromApi,
      generated_count: 1,
    };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockApiResponse });

    const { result } = renderHook(() => useGenerateFlashcards());

    act(() => {
      result.current.handleTextChange(inputText);
    });
    await act(async () => {
      await result.current.handleGenerateClick();
    });

    // Access properties directly on result.current
    expect(result.current.candidates[0].status).toBe("pending");

    act(() => {
      result.current.handleAccept("mock-uuid-1");
    });

    // Access properties directly on result.current
    expect(result.current.candidates[0].status).toBe("accepted");
  });

  // Add similar tests for handleDiscard, handleEditStart, handleEditSave, handleEditCancel,
  // handleAcceptAll, handleDiscardAll, handleConfirmSelection
});
