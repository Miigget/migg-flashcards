import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RenameCollectionDialog from "./RenameCollectionDialog";

describe("RenameCollectionDialog", () => {
  const mockOnRenameSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  const defaultProps = {
    isOpen: true,
    currentName: "Old Name",
    onRenameSubmit: mockOnRenameSubmit,
    onCancel: mockOnCancel,
    existingNames: ["Existing Name 1", "Existing Name 2"],
    isSubmitting: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state associated with the mock function if needed, though clearAllMocks usually covers it.
  });

  it("should render the dialog with title, description, and input prefilled with currentName", () => {
    render(<RenameCollectionDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Zmień nazwę kolekcji")).toBeInTheDocument();
    expect(screen.getByText(/Wprowadź nową nazwę dla kolekcji "Old Name"/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nowa nazwa")).toHaveValue(defaultProps.currentName);
    expect(screen.getByRole("button", { name: /Anuluj/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zapisz/i })).toBeInTheDocument();
  });

  it("should not render the dialog when isOpen is false", () => {
    render(<RenameCollectionDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should update input value on change", async () => {
    const user = userEvent.setup();
    render(<RenameCollectionDialog {...defaultProps} />);
    const input = screen.getByLabelText("Nowa nazwa");
    const newValue = "New Collection Name";

    await user.clear(input);
    await user.type(input, newValue);

    expect(input).toHaveValue(newValue);
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<RenameCollectionDialog {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: /Anuluj/i });

    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnRenameSubmit).not.toHaveBeenCalled();
  });

  it("should call onRenameSubmit with the new name when form is submitted with valid data", async () => {
    const user = userEvent.setup();
    render(<RenameCollectionDialog {...defaultProps} />);
    const input = screen.getByLabelText("Nowa nazwa");
    const submitButton = screen.getByRole("button", { name: /Zapisz/i });
    const validNewName = "Valid New Name";

    await user.clear(input);
    await user.type(input, validNewName);
    await user.click(submitButton);

    expect(mockOnRenameSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnRenameSubmit).toHaveBeenCalledWith(validNewName);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  // --- Validation Tests ---

  it("should disable submit button and show validation error if name is empty", async () => {
    const user = userEvent.setup();
    render(<RenameCollectionDialog {...defaultProps} />);
    const input = screen.getByLabelText("Nowa nazwa");
    const submitButton = screen.getByRole("button", { name: /Zapisz/i });

    await user.clear(input);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Nazwa kolekcji nie może być pusta.")).toBeInTheDocument();
    await user.click(submitButton); // Try submitting
    expect(mockOnRenameSubmit).not.toHaveBeenCalled();
  });

  it("should disable submit button and show validation error if name exceeds max length", async () => {
    const user = userEvent.setup();
    render(<RenameCollectionDialog {...defaultProps} />);
    const input = screen.getByLabelText("Nowa nazwa");
    const submitButton = screen.getByRole("button", { name: /Zapisz/i });
    const longName = "a".repeat(31); // MAX_NAME_LENGTH is 30

    await user.clear(input);
    await user.type(input, longName);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/Nazwa kolekcji nie może przekraczać 30 znaków./)).toBeInTheDocument();
    await user.click(submitButton); // Try submitting
    expect(mockOnRenameSubmit).not.toHaveBeenCalled();
  });

  it("should disable submit button if name is the same as currentName", async () => {
    const user = userEvent.setup();
    render(<RenameCollectionDialog {...defaultProps} />);
    const input = screen.getByLabelText("Nowa nazwa");
    const submitButton = screen.getByRole("button", { name: /Zapisz/i });

    // Initial state has currentName, button should be disabled
    expect(submitButton).toBeDisabled();

    // Type something else, then type back the original name
    await user.type(input, " something else");
    await user.clear(input);
    await user.type(input, defaultProps.currentName);

    expect(submitButton).toBeDisabled();
    await user.click(submitButton);
    expect(mockOnRenameSubmit).not.toHaveBeenCalled();
  });

  it("should disable submit button and show validation error if name exists in existingNames", async () => {
    const user = userEvent.setup();
    render(<RenameCollectionDialog {...defaultProps} />);
    const input = screen.getByLabelText("Nowa nazwa");
    const submitButton = screen.getByRole("button", { name: /Zapisz/i });
    const existingName = "Existing Name 1";

    await user.clear(input);
    await user.type(input, existingName);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Kolekcja o tej nazwie już istnieje.")).toBeInTheDocument();
    await user.click(submitButton); // Try submitting
    expect(mockOnRenameSubmit).not.toHaveBeenCalled();
  });

  // --- Submission State Tests ---

  it("should disable buttons and show loading text when isSubmitting is true", () => {
    render(<RenameCollectionDialog {...defaultProps} isSubmitting={true} />);

    const submitButton = screen.getByRole("button", { name: /Zapisywanie.../i });
    const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
    const input = screen.getByLabelText("Nowa nazwa");

    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(input).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Zapisz/i })).not.toBeInTheDocument();
  });

  it("should display error message from error prop", () => {
    const submitError = "Server error during rename.";
    render(<RenameCollectionDialog {...defaultProps} error={submitError} />);

    expect(screen.getByText(submitError)).toBeInTheDocument();
    // Check it's inside the alert
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(within(alert).getByText(submitError)).toBeInTheDocument();
  });

  it("should prioritize validation error over submit error prop display", async () => {
    const user = userEvent.setup();
    const submitError = "Server error occurred previously";
    render(<RenameCollectionDialog {...defaultProps} error={submitError} />);
    const input = screen.getByLabelText("Nowa nazwa");

    // Introduce a validation error
    await user.clear(input);

    expect(screen.getByText("Nazwa kolekcji nie może być pusta.")).toBeInTheDocument();
    expect(screen.queryByText(submitError)).not.toBeInTheDocument(); // Validation error takes precedence
  });
});

// Import within helper if needed
import { within } from "@testing-library/react";
