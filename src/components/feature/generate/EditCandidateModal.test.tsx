import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditCandidateModal from "./EditCandidateModal";
import type { CandidateViewModel } from "../../../hooks/useGenerateFlashcards";
import "@testing-library/jest-dom";

// Mock Shadcn UI components used by the modal if needed,
// e.g., Dialog, Input, Label, Button
// For simplicity, we'll assume basic HTML equivalents or test through them
vi.mock("../../ui/dialog", () => ({
  Dialog: vi.fn(({ open, children }) =>
    open ? (
      <div data-testid="dialog" role="dialog" aria-modal="true">
        {children}
      </div>
    ) : null
  ),
  DialogContent: vi.fn(({ children }) => <div data-testid="dialog-content">{children}</div>),
  DialogHeader: vi.fn(({ children }) => <div>{children}</div>),
  DialogTitle: vi.fn(({ children }) => <h2>{children}</h2>),
  DialogDescription: vi.fn(({ children }) => <p>{children}</p>),
  DialogFooter: vi.fn(({ children }) => <div>{children}</div>),
  DialogClose: vi.fn(({ children }) => <button>{children}</button>),
}));
vi.mock("../../ui/input", () => ({
  Input: vi.fn((props) => <input {...props} />),
}));
vi.mock("../../ui/textarea", () => ({
  Textarea: vi.fn((props) => <textarea {...props} />),
}));
vi.mock("../../ui/label", () => ({
  Label: vi.fn(({ children, ...props }) => <label {...props}>{children}</label>),
}));
vi.mock("../../ui/button", () => ({
  Button: vi.fn(({ children, ...props }) => <button {...props}>{children}</button>),
}));
vi.mock("../../ui/CharacterCounter", () => ({
  default: vi.fn(() => <div data-testid="char-counter"></div>),
}));
vi.mock("../../ui/ErrorMessage", () => ({
  default: vi.fn(({ error }) => (error ? <div data-testid="error-message">{error}</div> : null)),
}));

describe("EditCandidateModal Component", () => {
  const mockCandidate: CandidateViewModel = {
    tempId: "edit-c1",
    front: "Original Question?",
    back: "Original Answer.",
    status: "pending",
    originalFront: "Original Question?",
    originalBack: "Original Answer.",
    validationError: null,
    generation_id: "g-edit",
  };

  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (candidate = mockCandidate, isOpen = true) => {
    render(<EditCandidateModal candidate={candidate} isOpen={isOpen} onSave={mockOnSave} onClose={mockOnClose} />);
  };

  it("should not render the dialog when isOpen is false", () => {
    renderModal(mockCandidate, false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render the dialog, title, description, form fields with initial data when open", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(within(dialog).getByRole("heading", { name: /Edit flashcard/i })).toBeInTheDocument();
    expect(
      within(dialog).getByText(/^Edit the front and back of the flashcard. Click "Save" when you're done.$/i)
    ).toBeInTheDocument();

    // Check form fields existence and initial values
    expect(within(dialog).getByLabelText(/Front of flashcard/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Front of flashcard/i)).toHaveValue(mockCandidate.front);

    expect(within(dialog).getByLabelText(/Back of flashcard/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Back of flashcard/i)).toHaveValue(mockCandidate.back);

    // Check buttons
    expect(within(dialog).getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /^Save$/i })).toBeInTheDocument();
  });

  it("should update input fields when user types", async () => {
    const user = userEvent.setup();
    renderModal();
    const dialog = screen.getByRole("dialog");

    const frontInput = within(dialog).getByLabelText(/Front of flashcard/i);
    const backInput = within(dialog).getByLabelText(/Back of flashcard/i);

    const typedFront = "Updated Question?";
    const typedBack = "Updated Answer.";

    await user.clear(frontInput);
    await user.type(frontInput, typedFront);
    expect(frontInput).toHaveValue(typedFront);

    await user.clear(backInput);
    await user.type(backInput, typedBack);
    expect(backInput).toHaveValue(typedBack);
  });

  it("should call onClose when the cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderModal();
    const dialog = screen.getByRole("dialog");

    const cancelButton = within(dialog).getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  // Assuming DialogClose is handled by the mock Dialog correctly calling onOpenChange
  // Testing close on overlay click or escape key might require more complex Dialog mock.

  it("should call onSave with updated candidate data when save button is clicked", async () => {
    const user = userEvent.setup();
    renderModal();
    const dialog = screen.getByRole("dialog");

    const frontInput = within(dialog).getByLabelText(/Front of flashcard/i);
    const backInput = within(dialog).getByLabelText(/Back of flashcard/i);
    const saveButton = within(dialog).getByRole("button", { name: /^Save$/i });

    const updatedFront = "Edited Front Valid";
    const updatedBack = "Edited Back Valid";

    await user.clear(frontInput);
    await user.type(frontInput, updatedFront);
    await user.clear(backInput);
    await user.type(backInput, updatedBack);

    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockCandidate, // Keep original properties like tempId, status etc.
      front: updatedFront,
      back: updatedBack,
      // validationError is internal, not passed back
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should disable save button if front or back is empty", async () => {
    const user = userEvent.setup();
    renderModal();
    const dialog = screen.getByRole("dialog");
    const frontInput = within(dialog).getByLabelText(/Front of flashcard/i);
    const backInput = within(dialog).getByLabelText(/Back of flashcard/i);
    const saveButton = within(dialog).getByRole("button", { name: /^Save$/i });

    // Initial state - button should be enabled
    expect(saveButton).toBeEnabled();

    // Clear front input
    await user.clear(frontInput);
    expect(saveButton).toBeDisabled();

    // Type back into front, clear back input
    await user.type(frontInput, "Some text");
    expect(saveButton).toBeEnabled(); // Should be enabled now
    await user.clear(backInput);
    expect(saveButton).toBeDisabled();

    // Fill back input again
    await user.type(backInput, "Some other text");
    expect(saveButton).toBeEnabled();
  });
});
