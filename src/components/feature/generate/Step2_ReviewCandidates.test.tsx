import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Step2_ReviewCandidates from "./Step2_ReviewCandidates";
import type { CandidateViewModel, ApiError } from "../../../hooks/useGenerateFlashcards";
import "@testing-library/jest-dom";

// Mock CandidateCard to simplify testing this container component
vi.mock("./CandidateCard", () => ({
  // Mock the default export
  default: vi.fn(({ candidate, onAccept, onDiscard, onEditClick }) => (
    <div data-testid={`candidate-card-${candidate.tempId}`}>
      <p>{candidate.front}</p>
      <p>{candidate.back}</p>
      <button data-testid={`accept-${candidate.tempId}`} onClick={() => onAccept(candidate.tempId)}>
        Accept
      </button>
      <button data-testid={`discard-${candidate.tempId}`} onClick={() => onDiscard(candidate.tempId)}>
        Discard
      </button>
      <button data-testid={`edit-${candidate.tempId}`} onClick={() => onEditClick(candidate.tempId)}>
        Edit
      </button>
      <span>{`Status: ${candidate.status}`}</span>
    </div>
  )),
}));

// Mock EditCandidateModal as it's complex and used internally
vi.mock("./EditCandidateModal", () => ({
  default: vi.fn(() => <div data-testid="edit-modal">Mock Edit Modal</div>),
}));

// Mock other UI components used directly
vi.mock("../../ui/button", () => ({
  Button: vi.fn(({ children, ...props }) => <button {...props}>{children}</button>),
}));
vi.mock("../../ui/ErrorMessage", () => ({
  default: ({ error }: { error: ApiError | null }) =>
    error ? <div data-testid="error-message">{error.message}</div> : null,
}));
vi.mock("../../ui/LoadingIndicator", () => ({
  default: ({ text }: { text: string }) => (
    <div data-testid="loading-indicator" role="status">
      {text}
    </div>
  ),
}));

describe("Step2_ReviewCandidates Component", () => {
  const mockCandidates: CandidateViewModel[] = [
    {
      tempId: "c1",
      front: "Q1",
      back: "A1",
      status: "pending",
      originalFront: "OQ1",
      originalBack: "OA1",
      validationError: null,
      generation_id: "g1",
    },
    {
      tempId: "c2",
      front: "Q2",
      back: "A2",
      status: "accepted",
      originalFront: "OQ2",
      originalBack: "OA2",
      validationError: null,
      generation_id: "g1",
    },
    {
      tempId: "c3",
      front: "Q3",
      back: "A3",
      status: "pending",
      originalFront: "OQ3",
      originalBack: "OA3",
      validationError: null,
      generation_id: "g1",
    },
  ];

  const mockOnAccept = vi.fn();
  const mockOnDiscard = vi.fn();
  const mockOnEditSave = vi.fn();
  const mockOnAcceptAll = vi.fn();
  const mockOnProceedToSave = vi.fn();
  const mockOnRetryGenerate = vi.fn();
  const mockOnEditStart = vi.fn();
  const mockOnEditCancel = vi.fn();

  const defaultProps = {
    candidates: mockCandidates,
    isLoading: false,
    apiError: null,
    onAccept: mockOnAccept,
    onDiscard: mockOnDiscard,
    onEditSave: mockOnEditSave,
    onAcceptAll: mockOnAcceptAll,
    onProceedToSave: mockOnProceedToSave,
    onRetryGenerate: mockOnRetryGenerate,
    onEditStart: mockOnEditStart,
    onEditCancel: mockOnEditCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the correct number of CandidateCard components", () => {
    render(<Step2_ReviewCandidates {...defaultProps} />);

    const cards = screen.getAllByTestId(/candidate-card-/i);
    expect(cards).toHaveLength(mockCandidates.length);
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
  });

  it("should render title, stats, and action buttons", () => {
    render(<Step2_ReviewCandidates {...defaultProps} />);

    expect(screen.getByRole("heading", { name: /Sprawdź wygenerowane fiszki/i })).toBeInTheDocument();
    expect(screen.getByText(/Łącznie:/i)).toHaveTextContent("Łącznie: 3");
    expect(screen.getByText(/Zaakceptowane:/i)).toHaveTextContent("Zaakceptowane: 1");
    expect(screen.getByText(/Oczekujące:/i)).toHaveTextContent("Oczekujące: 2");
    expect(screen.getByText(/Odrzucone:/i)).toHaveTextContent("Odrzucone: 0");

    expect(screen.getByRole("button", { name: /Akceptuj wszystkie/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Przejdź do zapisu/i })).toBeInTheDocument();
  });

  it("should call onAccept when accept button inside a mock card is clicked", async () => {
    const user = userEvent.setup();
    render(<Step2_ReviewCandidates {...defaultProps} />);

    const acceptButton = screen.getByTestId("accept-c1");
    await user.click(acceptButton);

    expect(mockOnAccept).toHaveBeenCalledTimes(1);
    expect(mockOnAccept).toHaveBeenCalledWith("c1");
  });

  it("should call onDiscard when discard button inside a mock card is clicked", async () => {
    const user = userEvent.setup();
    render(<Step2_ReviewCandidates {...defaultProps} />);

    const discardButton = screen.getByTestId("discard-c1");
    await user.click(discardButton);

    expect(mockOnDiscard).toHaveBeenCalledTimes(1);
    expect(mockOnDiscard).toHaveBeenCalledWith("c1");
  });

  it("should trigger internal edit handler when edit button inside mock card is clicked", async () => {
    const user = userEvent.setup();
    render(<Step2_ReviewCandidates {...defaultProps} />);

    const editButton = screen.getByTestId("edit-c1");
    await user.click(editButton);
  });

  it("should call onAcceptAll when the accept all button is clicked", async () => {
    const user = userEvent.setup();
    render(<Step2_ReviewCandidates {...defaultProps} />);
    const acceptAllButton = screen.getByRole("button", { name: /Akceptuj wszystkie/i });
    await user.click(acceptAllButton);
    expect(mockOnAcceptAll).toHaveBeenCalledTimes(1);
  });

  it("should call onProceedToSave when the proceed button is clicked", async () => {
    const user = userEvent.setup({
      // Configure userEvent with shorter delays
      delay: 1,
    });

    // W mockCandidates mamy już 1 zaakceptowany, więc przycisk powinien być aktywny
    render(<Step2_ReviewCandidates {...defaultProps} />);

    // Pobierz przycisk
    const proceedButton = screen.getByRole("button", { name: /Przejdź do zapisu/i });

    // Sprawdź czy przycisk jest aktywny
    expect(proceedButton).toBeEnabled();

    // Kliknij przycisk
    await user.click(proceedButton);

    // Sprawdź czy funkcja została wywołana
    expect(mockOnProceedToSave).toHaveBeenCalledTimes(1);
  });

  it("should disable the Proceed button if there are no accepted candidates", () => {
    const noAcceptedCandidates = mockCandidates.map((c) => ({ ...c, status: "pending" as const }));
    render(<Step2_ReviewCandidates {...defaultProps} candidates={noAcceptedCandidates} />);
    expect(screen.getByText(/Zaakceptowane:/i)).toHaveTextContent("Zaakceptowane: 0");
    expect(screen.getByRole("button", { name: /Przejdź do zapisu/i })).toBeDisabled();
  });

  it("should enable the Proceed button if there are accepted candidates", () => {
    render(<Step2_ReviewCandidates {...defaultProps} candidates={mockCandidates} />);
    expect(screen.getByText(/Zaakceptowane:/i)).toHaveTextContent("Zaakceptowane: 1");
    expect(screen.getByRole("button", { name: /Przejdź do zapisu/i })).toBeEnabled();
  });

  it("should hide Accept All button if no pending candidates", () => {
    const noPendingCandidates = mockCandidates.map((c) => ({ ...c, status: "accepted" as const }));
    render(<Step2_ReviewCandidates {...defaultProps} candidates={noPendingCandidates} />);
    expect(screen.queryByRole("button", { name: /Akceptuj wszystkie/i })).not.toBeInTheDocument();
  });

  it("should render an empty state message if candidates array is empty and not loading/error", () => {
    render(<Step2_ReviewCandidates {...defaultProps} candidates={[]} />);

    expect(screen.queryByTestId(/candidate-card-/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Brak wygenerowanych kandydatów/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Akceptuj wszystkie/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Przejdź do zapisu/i })).not.toBeInTheDocument();
  });

  it("should render loading indicator when isLoading is true", () => {
    render(<Step2_ReviewCandidates {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.queryByTestId(/candidate-card-/i)).not.toBeInTheDocument();
  });

  it("should render error message and retry button when apiError is set", () => {
    const error: ApiError = { message: "Failed to generate", code: "500" };
    render(<Step2_ReviewCandidates {...defaultProps} apiError={error} />);
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-message")).toHaveTextContent(error.message);
    expect(screen.queryByTestId(/candidate-card-/i)).not.toBeInTheDocument();
  });
});
