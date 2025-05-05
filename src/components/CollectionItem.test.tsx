import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CollectionItem from "./CollectionItem";
import type { CollectionViewModel } from "@/types";

describe("CollectionItem", () => {
  const mockOnRenameClick = vi.fn();
  const mockOnDeleteClick = vi.fn();

  const mockCollection: CollectionViewModel = {
    name: "Test Collection",
    flashcardCount: 10,
    isLoadingCount: false,
    errorCount: null,
  };

  const defaultProps = {
    collection: mockCollection,
    onRenameClick: mockOnRenameClick,
    onDeleteClick: mockOnDeleteClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render collection name and flashcard count", () => {
    render(<CollectionItem {...defaultProps} />);

    expect(screen.getByText(mockCollection.name)).toBeInTheDocument();
    expect(screen.getByText(/10 fiszek/i)).toBeInTheDocument(); // Checks count and pluralization
  });

  it("should render correct pluralization for 1 flashcard", () => {
    const singleFlashcardCollection = { ...mockCollection, flashcardCount: 1 };
    render(<CollectionItem {...defaultProps} collection={singleFlashcardCollection} />);
    expect(screen.getByText(/1 fiszka/i)).toBeInTheDocument();
  });

  it("should render Skeleton when isLoadingCount is true", () => {
    const loadingCollection = { ...mockCollection, isLoadingCount: true };
    render(<CollectionItem {...defaultProps} collection={loadingCollection} />);

    // Skeleton might not have a specific role, check for its presence by structure or test id if added
    // A simple check might be to ensure the count text is NOT present
    expect(screen.queryByText(/10 fiszek/i)).not.toBeInTheDocument();
    // More robust: Check for the skeleton component if possible (e.g., via class name or data-testid)
    expect(document.querySelector(".h-4.w-20")).toBeInTheDocument(); // Example check by class
  });

  it("should render error message when errorCount is present", () => {
    const errorCollection = {
      ...mockCollection,
      errorCount: { status: 500, message: "Failed to load" },
      isLoadingCount: false,
    };
    render(<CollectionItem {...defaultProps} collection={errorCollection} />);

    expect(screen.getByText(/Błąd ładowania/i)).toBeInTheDocument();
    expect(screen.queryByText(/10 fiszek/i)).not.toBeInTheDocument();
  });

  it("should render Details link with correct href", () => {
    render(<CollectionItem {...defaultProps} />);
    const detailsLink = screen.getByRole("link", { name: /Szczegóły/i });
    expect(detailsLink).toBeInTheDocument();
    expect(detailsLink).toHaveAttribute("href", `/collections/${encodeURIComponent(mockCollection.name)}`);
  });

  it("should render Rename and Delete buttons", async () => {
    render(<CollectionItem {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Zmień nazwę/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Usuń/i })).toBeInTheDocument();
    });
  });

  it("should call onRenameClick with collection name when Rename button is clicked", async () => {
    const user = userEvent.setup();
    render(<CollectionItem {...defaultProps} />);
    const renameButton = screen.getByRole("button", { name: /Zmień nazwę/i });

    await user.click(renameButton);

    expect(mockOnRenameClick).toHaveBeenCalledTimes(1);
    expect(mockOnRenameClick).toHaveBeenCalledWith(mockCollection.name);
    expect(mockOnDeleteClick).not.toHaveBeenCalled();
  });

  it("should call onDeleteClick with collection name when Delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<CollectionItem {...defaultProps} />);
    const deleteButton = screen.getByRole("button", { name: /Usuń/i });

    await user.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith(mockCollection.name);
    expect(mockOnRenameClick).not.toHaveBeenCalled();
  });
});
