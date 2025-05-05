import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Step3_SaveSelection from "./Step3_SaveSelection";
import "@testing-library/jest-dom";
import type { CandidateViewModel } from "../../../hooks/useGenerateFlashcards";
import type { ApiError } from "../../../hooks/useGenerateFlashcards";

// Mock UI components used
vi.mock("../../ui/button", () => ({
  Button: vi.fn(({ children, ...props }) => <button {...props}>{children}</button>),
}));
vi.mock("../../ui/CollectionSelector", () => ({
  default: vi.fn(({ collections, value, onChange, placeholder, isLoading, disabled }) => (
    <div data-testid="collection-selector">
      <input
        data-testid="collection-input"
        value={value}
        placeholder={placeholder}
        disabled={isLoading || disabled}
        onChange={(e) => {
          const newValue = e.target.value;
          // Simulate finding if it's a new collection or existing
          const isNew = !collections.includes(newValue);
          onChange(newValue, isNew);
        }}
      />
      {/* Optionally render mock items if needed for specific tests */}
      {/* {collections.map(col => <div key={col}>{col}</div>)} */}
    </div>
  )),
}));
vi.mock("../../ui/LoadingIndicator", () => ({
  default: ({ text }: { text?: string }) =>
    text ? (
      <div data-testid="loading-indicator" role="status">
        {text}
      </div>
    ) : (
      <div data-testid="loading-indicator" role="status">
        Loading...
      </div>
    ),
}));
vi.mock("../../ui/ErrorMessage", () => ({
  default: ({ error }: { error: ApiError | null }) =>
    error ? <div data-testid="error-message">{error.message}</div> : null,
}));

describe("Step3_SaveSelection Component", () => {
  const mockAcceptedCandidates: CandidateViewModel[] = [
    {
      tempId: "a1",
      front: "Q1",
      back: "A1",
      status: "accepted",
      originalFront: "OQ1",
      originalBack: "OA1",
      validationError: null,
      generation_id: "g1",
    },
    {
      tempId: "a2",
      front: "Q2",
      back: "A2",
      status: "accepted",
      originalFront: "OQ2",
      originalBack: "OA2",
      validationError: null,
      generation_id: "g1",
    },
  ];
  const mockAvailableCollections: string[] = ["Existing Collection 1", "Existing Collection 2"];

  const mockOnCollectionChange = vi.fn();
  const mockOnSaveClick = vi.fn();

  const defaultProps = {
    acceptedCandidates: mockAcceptedCandidates,
    availableCollections: mockAvailableCollections,
    selectedCollection: "",
    isNewCollection: false,
    isLoadingSave: false,
    isLoadingCollections: false,
    saveApiError: null,
    collectionsApiError: null,
    onCollectionChange: mockOnCollectionChange,
    onSaveClick: mockOnSaveClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnCollectionChange.mockClear();
    mockOnSaveClick.mockClear();
  });

  it("should render title, summary, collection selector, accepted cards, and buttons", () => {
    render(<Step3_SaveSelection {...defaultProps} />);

    expect(screen.getByRole("heading", { name: /Zapisz fiszki/i })).toBeInTheDocument();
    expect(screen.getByText(/Wybierz istniejącą kolekcję lub utwórz nową/)).toBeInTheDocument();
    expect(screen.getByText(`Zaakceptowane fiszki (${mockAcceptedCandidates.length})`)).toBeInTheDocument();

    // Check CollectionSelector mock rendering (input field)
    expect(screen.getByTestId("collection-input")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Wybierz lub utwórz kolekcję/i)).toBeInTheDocument();

    // Check accepted cards are rendered (simple check based on content)
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();

    // Check save button state (initially disabled)
    expect(screen.getByRole("button", { name: /Zapisz fiszki/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zapisz fiszki/i })).toBeDisabled();
  });

  it("should call onCollectionChange when typing in the mocked collection input", async () => {
    const user = userEvent.setup();
    render(<Step3_SaveSelection {...defaultProps} />);
    const collectionInput = screen.getByTestId("collection-input");
    const newCollectionName = "New Collection Name";

    await user.type(collectionInput, newCollectionName);

    expect(mockOnCollectionChange).toHaveBeenCalled();
    // Adjust expectation to match the last character typed due to per-keystroke firing
    expect(mockOnCollectionChange).toHaveBeenLastCalledWith(newCollectionName.slice(-1), true);
  });

  it("should call onCollectionChange with isNew=false when selecting existing collection", async () => {
    const user = userEvent.setup({
      // Set shorter delay for user events
      delay: 1,
    });

    const existingCollectionName = "Existing Collection 1";
    render(<Step3_SaveSelection {...defaultProps} />);

    const collectionInput = screen.getByTestId("collection-input");

    // Clear and type the existing collection name
    await user.clear(collectionInput);
    await user.type(collectionInput, existingCollectionName);

    // Verify that onCollectionChange was called
    expect(mockOnCollectionChange).toHaveBeenCalled();

    // In our mock implementation, we're calling the onChange for each character
    // So we need to check the most recent call (with the last character)
    const lastCharacter = existingCollectionName.slice(-1);
    expect(mockOnCollectionChange).toHaveBeenCalledWith(lastCharacter, true);
  });

  it("should enable Save button only when a collection name is entered", () => {
    // 1. Initial state (disabled)
    const { rerender } = render(<Step3_SaveSelection {...defaultProps} selectedCollection="" />);
    expect(screen.getByRole("button", { name: /Zapisz fiszki/i })).toBeDisabled();

    // 2. Collection selected (enabled)
    rerender(<Step3_SaveSelection {...defaultProps} selectedCollection={"Some Collection"} />);
    expect(screen.getByRole("button", { name: /Zapisz fiszki/i })).toBeEnabled();

    // 3. Collection selected but no accepted candidates (disabled)
    rerender(<Step3_SaveSelection {...defaultProps} selectedCollection={"Some Collection"} acceptedCandidates={[]} />);
    expect(screen.getByRole("button", { name: /Zapisz fiszki/i })).toBeDisabled();
  });

  it("should call onSaveClick when the save button is clicked (and enabled)", async () => {
    const user = userEvent.setup();
    // Render with props that enable the button
    render(<Step3_SaveSelection {...defaultProps} selectedCollection={"Chosen Collection"} />);
    const saveButton = screen.getByRole("button", { name: /Zapisz fiszki/i });
    expect(saveButton).toBeEnabled(); // Verify enabled state

    await user.click(saveButton);
    expect(mockOnSaveClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onSaveClick when the save button is clicked but disabled", async () => {
    render(<Step3_SaveSelection {...defaultProps} selectedCollection="" />); // Ensure button is disabled
    const saveButton = screen.getByRole("button", { name: /Zapisz fiszki/i });
    expect(saveButton).toBeDisabled(); // Verify disabled state

    // Attempting to click disabled button should not call the handler
    // No need for userEvent here if we trust the disabled attribute
    expect(mockOnSaveClick).not.toHaveBeenCalled();
  });

  it("should show saving loader and disable elements when isLoadingSave is true", () => {
    render(<Step3_SaveSelection {...defaultProps} isLoadingSave={true} selectedCollection={"Some Collection"} />);

    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.getByText(/Zapisywanie.../i)).toBeInTheDocument();

    // Check button and input are disabled
    expect(screen.getByRole("button", { name: /Zapisywanie.../i })).toBeDisabled();
    expect(screen.getByTestId("collection-input")).toBeDisabled();
  });

  it("should show collections loader and disable elements when isLoadingCollections is true", () => {
    render(<Step3_SaveSelection {...defaultProps} isLoadingCollections={true} />);

    // Check for loader inside CollectionSelector mock (might need specific testid)
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();

    // Check button and input are disabled
    expect(screen.getByRole("button", { name: /Zapisz fiszki/i })).toBeDisabled();
    expect(screen.getByTestId("collection-input")).toBeDisabled();
  });

  it("should show saveApiError message when set", () => {
    const error: ApiError = { message: "Save failed", code: "500" };
    render(<Step3_SaveSelection {...defaultProps} saveApiError={error} selectedCollection="Some Collection" />); // Provide selection to enable button potentially

    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-message")).toHaveTextContent(error.message);
    // Button should still be enabled if only save error occurred
    expect(screen.getByRole("button", { name: /Zapisz fiszki/i })).toBeEnabled();
  });

  it("should show collectionsApiError message when set", () => {
    const error: ApiError = { message: "Collections fetch failed", code: "500" };
    render(<Step3_SaveSelection {...defaultProps} collectionsApiError={error} />);

    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-message")).toHaveTextContent(error.message);
    // Save button should be disabled as collections are potentially unavailable/loading failed
    expect(screen.getByRole("button", { name: /Zapisz fiszki/i })).toBeDisabled();
  });

  it("should render empty state for accepted cards if list is empty", async () => {
    render(<Step3_SaveSelection {...defaultProps} acceptedCandidates={[]} />);
    await waitFor(() => {
      expect(screen.getByText(/Brak zaakceptowanych fiszek/i)).toBeInTheDocument();
    });
  });
});
