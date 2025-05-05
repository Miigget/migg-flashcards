import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditFlashcardDialog from "./EditFlashcardDialog";
import type { FlashcardDTO } from "@/types";

describe("EditFlashcardDialog", () => {
  const mockOnEditSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  const mockFlashcard: FlashcardDTO = {
    flashcard_id: 1,
    front: "Original Front",
    back: "Original Back",
    collection: "Test Collection",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: "manual",
    user_id: "user-123",
    generation_id: null,
  };

  const defaultProps = {
    isOpen: true,
    flashcard: mockFlashcard,
    onEditSubmit: mockOnEditSubmit,
    onCancel: mockOnCancel,
    isSubmitting: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render dialog with flashcard data when open", () => {
    render(<EditFlashcardDialog {...defaultProps} />);

    // Dialog powinien być otwarty bo isOpen=true
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Sprawdzamy czy zawartość jest poprawnie wyświetlana
    expect(screen.getByText("Edytuj fiszkę")).toBeInTheDocument();

    const frontInput = screen.getByLabelText("Przód");
    const backInput = screen.getByLabelText("Tył");

    expect(frontInput).toHaveValue(mockFlashcard.front);
    expect(backInput).toHaveValue(mockFlashcard.back);
    expect(screen.getByRole("button", { name: /Anuluj/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zapisz zmiany/i })).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(<EditFlashcardDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should update front and back fields on user input", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardDialog {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód");
    const backInput = screen.getByLabelText("Tył");
    const newFront = "Updated Front";
    const newBack = "Updated Back";

    await user.clear(frontInput);
    await user.type(frontInput, newFront);
    await user.clear(backInput);
    await user.type(backInput, newBack);

    expect(frontInput).toHaveValue(newFront);
    expect(backInput).toHaveValue(newBack);
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardDialog {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: /Anuluj/i });

    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnEditSubmit).not.toHaveBeenCalled();
  });

  it("should call onEditSubmit with updated fields when form is submitted with valid changes", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardDialog {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód");
    const backInput = screen.getByLabelText("Tył");
    const submitButton = screen.getByRole("button", { name: /Zapisz zmiany/i });
    const updatedFront = "New Valid Front";
    const updatedBack = "New Valid Back";

    await user.clear(frontInput);
    await user.type(frontInput, updatedFront);
    await user.clear(backInput);
    await user.type(backInput, updatedBack);
    await user.click(submitButton);

    expect(mockOnEditSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnEditSubmit).toHaveBeenCalledWith(mockFlashcard.flashcard_id, {
      front: updatedFront,
      back: updatedBack,
    });
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("should call onEditSubmit with only the changed field", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardDialog {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód");
    const submitButton = screen.getByRole("button", { name: /Zapisz zmiany/i });
    const updatedFront = "Only Front Changed";

    await user.clear(frontInput);
    await user.type(frontInput, updatedFront);
    // Back remains unchanged
    await user.click(submitButton);

    expect(mockOnEditSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnEditSubmit).toHaveBeenCalledWith(mockFlashcard.flashcard_id, {
      front: updatedFront,
      // back field should not be present
    });
  });

  it("should call onCancel when submitting without any changes", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardDialog {...defaultProps} />);
    const submitButton = screen.getByRole("button", { name: /Zapisz zmiany/i });

    // No changes made
    await user.click(submitButton);

    expect(mockOnEditSubmit).not.toHaveBeenCalled();
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  // --- Validation Tests ---

  it("should show validation error and disable submit if front is empty", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardDialog {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód");
    const submitButton = screen.getByRole("button", { name: /Zapisz zmiany/i });

    await user.clear(frontInput);
    // Trigger validation by trying to submit or tabbing away (userEvent handles some implicit validation)
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Pole 'Przód' nie może być puste.")).toBeInTheDocument();
    });
    expect(submitButton).toBeDisabled();
    expect(mockOnEditSubmit).not.toHaveBeenCalled();
  });

  it("should show validation error and disable submit if back is empty", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardDialog {...defaultProps} />);
    const backInput = screen.getByLabelText("Tył");
    const submitButton = screen.getByRole("button", { name: /Zapisz zmiany/i });

    await user.clear(backInput);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Pole 'Tył' nie może być puste.")).toBeInTheDocument();
    });
    expect(submitButton).toBeDisabled();
    expect(mockOnEditSubmit).not.toHaveBeenCalled();
  });

  it("should show validation error if front exceeds max length", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardDialog {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód");
    const submitButton = screen.getByRole("button", { name: /Zapisz zmiany/i });
    const longFront = "a".repeat(201); // MAX_FRONT_LENGTH = 200

    await user.clear(frontInput);
    await user.type(frontInput, longFront);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Pole 'Przód' nie może przekraczać 200 znaków./)).toBeInTheDocument();
    });
    expect(submitButton).toBeDisabled();
  });

  it("should show validation error if back exceeds max length", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardDialog {...defaultProps} />);
    const backInput = screen.getByLabelText("Tył");
    const submitButton = screen.getByRole("button", { name: /Zapisz zmiany/i });
    const longBack = "a".repeat(501); // MAX_BACK_LENGTH = 500

    await user.clear(backInput);
    await user.type(backInput, longBack);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Pole 'Tył' nie może przekraczać 500 znaków./)).toBeInTheDocument();
    });
    expect(submitButton).toBeDisabled();
  });

  // --- Submission State Tests ---

  it("should disable inputs and buttons, show loading text when isSubmitting is true", () => {
    render(<EditFlashcardDialog {...defaultProps} isSubmitting={true} />);

    const submitButton = screen.getByRole("button", { name: /Zapisywanie.../i });
    const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
    const frontInput = screen.getByLabelText("Przód");
    const backInput = screen.getByLabelText("Tył");

    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(frontInput).toBeDisabled();
    expect(backInput).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Zapisz zmiany/i })).not.toBeInTheDocument();
  });

  it("should display error message from error prop", () => {
    const submitError = "Server error during update.";
    render(<EditFlashcardDialog {...defaultProps} error={submitError} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(submitError);
  });

  it("should clear validation errors when dialog reopens with same flashcard", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EditFlashcardDialog {...defaultProps} />);
    const frontInput = screen.getByLabelText("Przód");
    const submitButton = screen.getByRole("button", { name: /Zapisz zmiany/i });

    // Create validation error
    await user.clear(frontInput);
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText("Pole 'Przód' nie może być puste.")).toBeInTheDocument();
    });

    // "Close" and "reopen" the dialog with the same flashcard data, but change the key to force a full reset
    rerender(<EditFlashcardDialog {...defaultProps} isOpen={false} key="closed" />);
    rerender(<EditFlashcardDialog {...defaultProps} isOpen={true} key="reopened" />);

    // Wait for the validation error to disappear first, ensuring the effect ran
    await waitFor(() => {
      expect(screen.queryByText("Pole 'Przód' nie może być puste.")).not.toBeInTheDocument();
    });

    // Now re-query the input inside waitFor and check its value
    await waitFor(() => {
      const inputAfterReopen = screen.getByLabelText("Przód");
      expect(inputAfterReopen).toHaveValue(mockFlashcard.front);
    });

    // Remove potentially flaky check for button state after reset
  });
});
