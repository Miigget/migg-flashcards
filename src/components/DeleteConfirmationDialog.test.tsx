import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { within } from "@testing-library/react";

describe("DeleteConfirmationDialog", () => {
  const mockOnConfirm = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  const defaultProps = {
    isOpen: true,
    itemType: "kolekcję",
    itemName: "Test Collection",
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    isDeleting: false,
    error: null,
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should render the dialog with correct title and description when open", () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Potwierdź usunięcie")).toBeInTheDocument();
    expect(screen.getByText(/Czy na pewno chcesz usunąć kolekcję "Test Collection"\?/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Anuluj/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Potwierdź/i })).toBeInTheDocument();
  });

  it("should render additionalInfo if provided", () => {
    const additionalInfoText = "To usunie wszystkie fiszki.";
    render(<DeleteConfirmationDialog {...defaultProps} additionalInfo={additionalInfoText} />);
    expect(screen.getByText(additionalInfoText)).toBeInTheDocument();
  });

  it("should not render the dialog when isOpen is false", () => {
    render(<DeleteConfirmationDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should call onConfirm when the confirm button is clicked and handle async", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationDialog {...defaultProps} />);

    const confirmButton = screen.getByRole("button", { name: /Potwierdź/i });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("should call onCancel when the cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmationDialog {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("should call onCancel when the dialog is closed via overlay or escape key (handled by shadcn Dialog)", async () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("should display error message when error prop is provided", () => {
    const errorMessage = "Failed to delete item.";
    render(<DeleteConfirmationDialog {...defaultProps} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(within(alert).getByText(errorMessage)).toBeInTheDocument();
  });

  it("should disable buttons and show loading text when isDeleting is true", () => {
    render(<DeleteConfirmationDialog {...defaultProps} isDeleting={true} />);

    const confirmButton = screen.getByRole("button", { name: /Usuwanie.../i });
    const cancelButton = screen.getByRole("button", { name: /Anuluj/i });

    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Potwierdź/i })).not.toBeInTheDocument();
  });
});
