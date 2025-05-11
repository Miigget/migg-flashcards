import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import GenerateFlashcardsView from "./GenerateFlashcardsView";
import { useGenerateFlashcards } from "../../../hooks/useGenerateFlashcards";
import Stepper from "./Stepper";
import "@testing-library/jest-dom";
import type { CandidateViewModel } from "../../../hooks/useGenerateFlashcards";

// Mock the hook
vi.mock("../../../hooks/useGenerateFlashcards");

// Mock child components (Steps and Stepper)
// to focus on the view's logic of rendering the correct step
vi.mock("./Stepper", () => ({ default: vi.fn(() => <div data-testid="stepper">Stepper Mock</div>) }));
vi.mock("./Step1_TextInput", () => ({ default: vi.fn(() => <div data-testid="step1">Step 1 Mock</div>) }));
vi.mock("./Step2_ReviewCandidates", () => ({ default: vi.fn(() => <div data-testid="step2">Step 2 Mock</div>) }));
vi.mock("./Step3_SaveSelection", () => ({ default: vi.fn(() => <div data-testid="step3">Step 3 Mock</div>) }));

// Helper to create a mock state matching the hook's flat return type
const createMockHookState = (
  overrides: Partial<ReturnType<typeof useGenerateFlashcards>> = {}
): ReturnType<typeof useGenerateFlashcards> => ({
  // State fields directly in the root
  currentStep: 1,
  inputText: "",
  inputTextValidationError: null,
  candidates: [],
  isLoadingGenerate: false,
  isLoadingSave: false,
  isLoadingCollections: false,
  generateApiError: null,
  saveApiError: null,
  collectionsApiError: null,
  availableCollections: [],
  selectedCollection: "",
  isNewCollection: false,
  // Handler functions directly in the root
  handleTextChange: vi.fn(),
  handleGenerateClick: vi.fn(),
  handleRetryGenerate: vi.fn(),
  handleAccept: vi.fn(),
  handleDiscard: vi.fn(),
  handleEditStart: vi.fn(),
  handleEditSave: vi.fn(),
  handleEditCancel: vi.fn(),
  handleAcceptAll: vi.fn(),
  handleProceedToSave: vi.fn(),
  handleCollectionChange: vi.fn(),
  handleSaveBulk: vi.fn(),
  // Apply overrides directly to the flat structure
  ...overrides,
});

const mockCandidate1: CandidateViewModel = {
  tempId: "c1",
  front: "Q1",
  back: "A1",
  status: "pending",
  originalFront: "Q1",
  originalBack: "A1",
  validationError: null,
  generation_id: "g1",
};

const mockCandidate2: CandidateViewModel = {
  tempId: "c2",
  front: "Q2",
  back: "A2",
  status: "pending",
  originalFront: "Q2",
  originalBack: "A2",
  validationError: null,
  generation_id: "g1",
};

describe("GenerateFlashcardsView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render Step 1 components when currentStep is 1", () => {
    // Pass overrides directly
    const mockState = createMockHookState({ currentStep: 1 });
    vi.mocked(useGenerateFlashcards).mockReturnValue(mockState);

    render(<GenerateFlashcardsView />);

    expect(screen.getByTestId("stepper")).toBeInTheDocument();
    expect(screen.getByTestId("step1")).toBeInTheDocument();
    expect(screen.queryByTestId("step2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("step3")).not.toBeInTheDocument();

    // Example prop check using the flat mockState
    // expect(vi.mocked(Step1_TextInput).mock.calls[0][0]).toMatchObject({
    //    text: mockState.inputText,
    //    isLoading: mockState.isLoadingGenerate,
    //    validationError: mockState.inputTextValidationError,
    //    apiError: mockState.generateApiError,
    //    onTextChange: mockState.handleTextChange,
    //    onGenerateClick: mockState.handleGenerateClick
    // });
  });

  it("should render Step 2 components when currentStep is 2", () => {
    const mockState = createMockHookState({ currentStep: 2 });
    vi.mocked(useGenerateFlashcards).mockReturnValue(mockState);

    render(<GenerateFlashcardsView />);

    expect(screen.getByTestId("stepper")).toBeInTheDocument();
    expect(screen.queryByTestId("step1")).not.toBeInTheDocument();
    expect(screen.getByTestId("step2")).toBeInTheDocument();
    expect(screen.queryByTestId("step3")).not.toBeInTheDocument();

    // Example prop check using the flat mockState
    // expect(vi.mocked(Step2_ReviewCandidates).mock.calls[0][0]).toMatchObject({
    //    candidates: mockState.candidates,
    //    isLoading: mockState.isLoadingGenerate,
    //    apiError: mockState.generateApiError,
    //    onAccept: mockState.handleAccept,
    //    onDiscard: mockState.handleDiscard,
    //    onEditSave: mockState.handleEditSave,
    //    onAcceptAll: mockState.handleAcceptAll,
    //    onProceedToSave: mockState.handleProceedToSave,
    //    onRetryGenerate: mockState.handleRetryGenerate
    // });
  });

  it("should render Step 3 components when currentStep is 3", () => {
    const mockState = createMockHookState({ currentStep: 3 });
    vi.mocked(useGenerateFlashcards).mockReturnValue(mockState);

    render(<GenerateFlashcardsView />);

    expect(screen.getByTestId("stepper")).toBeInTheDocument();
    expect(screen.queryByTestId("step1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("step2")).not.toBeInTheDocument();
    expect(screen.getByTestId("step3")).toBeInTheDocument();

    // Example prop check using the flat mockState
    // const expectedAccepted = mockState.candidates.filter(c => c.status === 'accepted');
    // expect(vi.mocked(Step3_SaveSelection).mock.calls[0][0]).toMatchObject({
    //    acceptedCandidates: expectedAccepted,
    //    availableCollections: mockState.availableCollections,
    //    selectedCollection: mockState.selectedCollection,
    //    isNewCollection: mockState.isNewCollection,
    //    isLoadingSave: mockState.isLoadingSave,
    //    isLoadingCollections: mockState.isLoadingCollections,
    //    saveApiError: mockState.saveApiError,
    //    collectionsApiError: mockState.collectionsApiError,
    //    onCollectionChange: mockState.handleCollectionChange,
    //    onSaveClick: mockState.handleSaveFlashcards
    // });
  });

  it("should pass correct props to Stepper based on currentStep", () => {
    const { rerender } = render(<GenerateFlashcardsView />);

    // Check props for step 2 (after hypothetical step change)
    vi.mocked(useGenerateFlashcards).mockReturnValue({
      ...createMockHookState(),
      currentStep: 2,
      candidates: [mockCandidate1], // Need candidates for step 2 to render fully
    });
    rerender(<GenerateFlashcardsView />);

    // Initial render (call 0) + first rerender (call 1) = check call 1 for step 2 props
    expect(vi.mocked(Stepper).mock.calls[1][0]).toEqual({
      currentStep: 2,
      steps: ["Enter text", "Review candidates", "Save flashcards"],
    });

    // Check props for step 3 (after hypothetical step change)
    vi.mocked(useGenerateFlashcards).mockReturnValue({
      ...createMockHookState(),
      currentStep: 3,
      candidates: [
        { ...mockCandidate1, status: "accepted" },
        { ...mockCandidate2, status: "accepted" },
      ], // Need accepted candidates for step 3
    });
    rerender(<GenerateFlashcardsView />);

    // Initial render (0) + first rerender (1) + second rerender (2) = check call 2 for step 3 props
    expect(vi.mocked(Stepper).mock.calls[2][0]).toEqual({
      // Check the third call after second rerender
      currentStep: 3,
      steps: ["Enter text", "Review candidates", "Save flashcards"],
    });
  });

  // Add tests for specific prop passing if necessary, by inspecting mock calls
  // e.g., test if handleGenerateClick from hook is passed to Step1 mock
});
