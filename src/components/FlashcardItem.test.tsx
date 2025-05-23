import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FlashcardItem from "./FlashcardItem";
import type { FlashcardDTO } from "@/types";

describe("FlashcardItem", () => {
  const mockOnEditClick = vi.fn();
  const mockOnDeleteClick = vi.fn();

  const mockFlashcard: FlashcardDTO = {
    flashcard_id: 42,
    front: "Test Front Content",
    back: "Test Back Content",
    collection: "Test Collection",
    created_at: new Date().toISOString(),
    source: "manual",
    user_id: "user-123",
    generation_id: null,
    updated_at: new Date().toISOString(),
  };

  const defaultProps = {
    flashcard: mockFlashcard,
    onEditClick: mockOnEditClick,
    onDeleteClick: mockOnDeleteClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render flashcard front and back content", async () => {
    render(<FlashcardItem {...defaultProps} />);

    // Both front and back should be visible directly (no need to click to reveal)
    expect(screen.getByText(mockFlashcard.front)).toBeInTheDocument();
    expect(screen.getByText(mockFlashcard.back)).toBeInTheDocument();
  }, 10000); // Add 10s timeout

  it("should render Edit and Delete buttons", () => {
    render(<FlashcardItem {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
  });

  it("should call onEditClick with the flashcard object when Edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<FlashcardItem {...defaultProps} />);
    const editButton = screen.getByRole("button", { name: /Edit/i });

    await user.click(editButton);

    expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    expect(mockOnEditClick).toHaveBeenCalledWith(mockFlashcard);
    expect(mockOnDeleteClick).not.toHaveBeenCalled();
  });

  it("should call onDeleteClick with the flashcard ID when Delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<FlashcardItem {...defaultProps} />);
    const deleteButton = screen.getByRole("button", { name: /Delete/i });

    await user.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith(mockFlashcard.flashcard_id);
    expect(mockOnEditClick).not.toHaveBeenCalled();
  });
});
