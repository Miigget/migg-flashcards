import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CandidateCard from "./CandidateCard";
import type { CandidateViewModel } from "../../../hooks/useGenerateFlashcards";
import "@testing-library/jest-dom";

// Mock ui components for simplicity if needed, but usually test through them
vi.mock("../../ui/button", () => ({
  // Simple mock for Button, forwarding props and children
  Button: vi.fn(({ children, ...props }) => <button {...props}>{children}</button>),
}));

describe("CandidateCard Component", () => {
  const mockCandidatePending: CandidateViewModel = {
    tempId: "temp-1",
    front: "What is the capital of Poland?",
    back: "Warsaw",
    status: "pending",
    originalFront: "Original Q Poland?",
    originalBack: "Original A Warsaw",
    validationError: null,
    generation_id: "gen-abc",
  };
  const mockCandidateAccepted: CandidateViewModel = {
    ...mockCandidatePending,
    tempId: "temp-2",
    status: "accepted",
    originalFront: "Original Q Poland?",
    originalBack: "Original A Warsaw",
    validationError: null,
    generation_id: "gen-abc",
  };
  const mockCandidateDiscarded: CandidateViewModel = {
    ...mockCandidatePending,
    tempId: "temp-3",
    status: "discarded",
    originalFront: "Original Q Poland?",
    originalBack: "Original A Warsaw",
    validationError: null,
    generation_id: "gen-abc",
  };

  const mockOnAccept = vi.fn();
  const mockOnDiscard = vi.fn();
  const mockOnEditClick = vi.fn();

  beforeEach(() => {
    mockOnAccept.mockClear();
    mockOnDiscard.mockClear();
    mockOnEditClick.mockClear();
  });

  it("should render front, back, and correct buttons for pending status", () => {
    render(
      <CandidateCard
        candidate={mockCandidatePending}
        onAccept={mockOnAccept}
        onDiscard={mockOnDiscard}
        onEditClick={mockOnEditClick}
      />
    );

    expect(screen.getByText(mockCandidatePending.front)).toBeInTheDocument();
    expect(screen.getByText(mockCandidatePending.back)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /discard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /restore/i })).not.toBeInTheDocument();
  });

  it("should render correct buttons for accepted status", () => {
    render(
      <CandidateCard
        candidate={mockCandidateAccepted}
        onAccept={mockOnAccept}
        onDiscard={mockOnDiscard}
        onEditClick={mockOnEditClick}
      />
    );
    expect(screen.getByRole("button", { name: /discard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /restore/i })).not.toBeInTheDocument();
  });

  it("should render correct button for discarded status", () => {
    render(
      <CandidateCard
        candidate={mockCandidateDiscarded}
        onAccept={mockOnAccept}
        onDiscard={mockOnDiscard}
        onEditClick={mockOnEditClick}
      />
    );
    expect(screen.getByRole("button", { name: /restore/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /discard/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();
  });

  it("should call onEditClick with the tempId when the edit button is clicked (pending status)", async () => {
    const user = userEvent.setup();
    render(
      <CandidateCard
        candidate={mockCandidatePending}
        onAccept={mockOnAccept}
        onDiscard={mockOnDiscard}
        onEditClick={mockOnEditClick}
      />
    );

    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    expect(mockOnEditClick).toHaveBeenCalledWith(mockCandidatePending.tempId);
    expect(mockOnAccept).not.toHaveBeenCalled();
    expect(mockOnDiscard).not.toHaveBeenCalled();
  });

  it("should call onDiscard with the tempId when the discard button is clicked (pending status)", async () => {
    const user = userEvent.setup();
    render(
      <CandidateCard
        candidate={mockCandidatePending}
        onAccept={mockOnAccept}
        onDiscard={mockOnDiscard}
        onEditClick={mockOnEditClick}
      />
    );

    const discardButton = screen.getByRole("button", { name: /discard/i });
    await user.click(discardButton);

    expect(mockOnDiscard).toHaveBeenCalledTimes(1);
    expect(mockOnDiscard).toHaveBeenCalledWith(mockCandidatePending.tempId);
    expect(mockOnAccept).not.toHaveBeenCalled();
    expect(mockOnEditClick).not.toHaveBeenCalled();
  });

  it("should call onAccept with the tempId when the accept button is clicked (pending status)", async () => {
    const user = userEvent.setup();
    render(
      <CandidateCard
        candidate={mockCandidatePending}
        onAccept={mockOnAccept}
        onDiscard={mockOnDiscard}
        onEditClick={mockOnEditClick}
      />
    );

    const acceptButton = screen.getByRole("button", { name: /accept/i });
    await user.click(acceptButton);

    expect(mockOnAccept).toHaveBeenCalledTimes(1);
    expect(mockOnAccept).toHaveBeenCalledWith(mockCandidatePending.tempId);
    expect(mockOnDiscard).not.toHaveBeenCalled();
    expect(mockOnEditClick).not.toHaveBeenCalled();
  });

  it("should call onAccept with the tempId when the restore button is clicked (discarded status)", async () => {
    const user = userEvent.setup();
    render(
      <CandidateCard
        candidate={mockCandidateDiscarded}
        onAccept={mockOnAccept}
        onDiscard={mockOnDiscard}
        onEditClick={mockOnEditClick}
      />
    );

    const restoreButton = screen.getByRole("button", { name: /restore/i });
    await user.click(restoreButton);

    expect(mockOnAccept).toHaveBeenCalledTimes(1);
    expect(mockOnAccept).toHaveBeenCalledWith(mockCandidateDiscarded.tempId);
    expect(mockOnDiscard).not.toHaveBeenCalled();
    expect(mockOnEditClick).not.toHaveBeenCalled();
  });

  it("should render correctly even if front or back are empty strings", () => {
    const emptyCandidate: CandidateViewModel = {
      tempId: "temp-empty",
      front: "",
      back: "",
      status: "pending",
      originalFront: "",
      originalBack: "",
      validationError: null,
      generation_id: "gen-def",
    };
    render(
      <CandidateCard
        candidate={emptyCandidate}
        onAccept={mockOnAccept}
        onDiscard={mockOnDiscard}
        onEditClick={mockOnEditClick}
      />
    );
    // Check buttons are still there for pending status
    expect(screen.getByRole("button", { name: /discard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();

    // Check that the elements containing the text are rendered, even if empty.
    // Find the <p> tags next to the corresponding <h3> labels.
    const frontParagraph = screen.getByText(/Front:/i).nextElementSibling;
    const backParagraph = screen.getByText(/Back:/i).nextElementSibling;

    expect(frontParagraph).toBeInTheDocument();
    expect(backParagraph).toBeInTheDocument();
    expect(frontParagraph).toHaveTextContent(""); // Front should be empty
    expect(backParagraph).toHaveTextContent(""); // Back should be empty
    // Verify they are the correct paragraph elements if needed (e.g., check tag name or class)
    expect(frontParagraph?.tagName).toBe("P");
    expect(backParagraph?.tagName).toBe("P");
    expect(frontParagraph).toHaveClass("p-2 bg-card rounded border");
    expect(backParagraph).toHaveClass("p-2 bg-card rounded border");
  });
});
