/// <reference types="vitest/globals" />
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";
import CollectionDetailView from "./CollectionDetailView";
import type { ApiError, FlashcardDTO } from "@/types";
import { useCollectionDetail } from "@/components/hooks/useCollectionDetail";
import ErrorDisplay from "@/components/ErrorDisplay";

// --- Mocks using vi.mock ---

// Mock the hook
vi.mock("@/components/hooks/useCollectionDetail", () => ({
  useCollectionDetail: vi.fn(),
}));

// Mock child components
interface MockFlashcardItemProps {
  flashcard: FlashcardDTO;
  onEditClick: (flashcard: FlashcardDTO) => void;
  onDeleteClick: (flashcardId: number) => void;
}
vi.mock("@/components/FlashcardItem", () => ({
  default: ({ flashcard, onEditClick, onDeleteClick }: MockFlashcardItemProps) => (
    <div role="listitem" data-testid={`flashcard-${flashcard.flashcard_id}`}>
      <span>{flashcard.front}</span>
      <button onClick={() => onEditClick(flashcard)}>Edit</button>
      <button onClick={() => onDeleteClick(flashcard.flashcard_id)}>Delete</button>
    </div>
  ),
}));

// Define types for mocked dialog props
interface MockDialogProps {
  isOpen: boolean;
  [key: string]: unknown;
}
interface MockDeleteDialogProps extends MockDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  itemType: string;
}
interface MockPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
interface MockErrorDisplayProps {
  error: ApiError;
  title?: string;
  message: string;
  onRetry?: () => void;
}

// Mock dialogs
vi.mock("@/components/RenameCollectionDialog", () => ({
  default: ({ isOpen }: MockDialogProps) =>
    isOpen ? (
      <div role="dialog" aria-label="Rename Dialog">
        Rename Dialog Open
      </div>
    ) : null,
}));
vi.mock("@/components/DeleteConfirmationDialog", () => ({
  default: ({ isOpen, onConfirm, onCancel, itemType }: MockDeleteDialogProps) =>
    isOpen ? (
      <div role="alertdialog" aria-label={`Delete ${itemType} Dialog`}>
        <button onClick={onConfirm}>Confirm Delete</button>
        <button onClick={onCancel}>Cancel Delete</button>
      </div>
    ) : null,
}));
vi.mock("@/components/EditFlashcardDialog", () => ({
  default: ({ isOpen }: MockDialogProps) =>
    isOpen ? (
      <div role="dialog" aria-label="Edit Dialog">
        Edit Dialog Open
      </div>
    ) : null,
}));

// Mock ErrorDisplay directly inside the factory
vi.mock("@/components/ErrorDisplay", () => ({
  default: vi.fn(({ error, title, message, onRetry }: MockErrorDisplayProps) => (
    <div data-testid="error-display">
      <h2>{title || "Error"}</h2>
      <p>{message}</p>
      <p>Error Details: {error.message}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  )),
}));

vi.mock("@/components/ui/PaginationControls", () => ({
  default: ({ currentPage }: MockPaginationProps) => (
    <div data-testid="pagination-controls">Pagination: Page {currentPage}</div>
  ),
}));

// --- Get Mocked Reference and Define Test Data ---

// Get reference to the mocked ErrorDisplay AFTER mocks are defined
const MockedErrorDisplay = vi.mocked(ErrorDisplay, true);

const mockFlashcardsData: FlashcardDTO[] = [
  {
    flashcard_id: 1,
    collection: "c1",
    user_id: "u1",
    front: "Front 1",
    back: "Back 1",
    created_at: "2023-01-01",
    source: "manual",
    generation_id: null,
    updated_at: "",
  },
  {
    flashcard_id: 2,
    collection: "c1",
    user_id: "u1",
    front: "Front 2",
    back: "Back 2",
    created_at: "2023-01-02",
    source: "manual",
    generation_id: null,
    updated_at: "",
  },
];

describe("CollectionDetailView", () => {
  const user = userEvent.setup();
  let mockUseCollectionDetail: Mock;
  let mockHandleDeleteFlashcard: Mock;
  let mockHandleDeleteFlashcardConfirm: Mock;
  let mockHandleEditFlashcard: Mock;

  const initialCollectionName = "Test Collection";

  // Default ViewModel state
  const defaultViewModel = {
    collectionName: initialCollectionName,
    flashcards: mockFlashcardsData,
    isLoading: false,
    error: null,
    pagination: { currentPage: 1, totalPages: 1, totalItems: mockFlashcardsData.length },
  };

  // Default handlers mock
  const defaultHandlers = {
    handlePageChange: vi.fn(),
    handleRetryFetch: vi.fn(),
    studyUrl: "/study/Test%20Collection",
    createUrl: "/collections/Test%20Collection/create",
    generateUrl: "/collections/Test%20Collection/generate",
    isSubmittingAny: false,
    showRenameDialog: false,
    isSubmittingRename: false,
    renameError: null,
    handleRenameClick: vi.fn(),
    handleRenameCancel: vi.fn(),
    handleRenameSubmit: vi.fn(),
    showDeleteDialog: false,
    isSubmittingDelete: false,
    deleteError: null,
    handleDeleteClick: vi.fn(),
    handleDeleteCancel: vi.fn(),
    handleDeleteConfirm: vi.fn(),
    editFlashcardTarget: null,
    isSubmittingEdit: false,
    editError: null,
    handleEditFlashcard: vi.fn(),
    handleEditCancel: vi.fn(),
    handleEditSubmit: vi.fn(),
    deleteFlashcardTargetId: null,
    isSubmittingFlashcardDelete: false,
    deleteFlashcardError: null,
    handleDeleteFlashcard: vi.fn(),
    handleDeleteFlashcardCancel: vi.fn(),
    handleDeleteFlashcardConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    MockedErrorDisplay.mockClear(); // Clear the mocked component

    // Setup mock handlers
    mockHandleDeleteFlashcard = defaultHandlers.handleDeleteFlashcard;
    mockHandleDeleteFlashcardConfirm = defaultHandlers.handleDeleteFlashcardConfirm;
    mockHandleEditFlashcard = defaultHandlers.handleEditFlashcard;

    // Setup default mock implementation for the hook
    mockUseCollectionDetail = useCollectionDetail as Mock;
    mockUseCollectionDetail.mockReturnValue({
      viewModel: defaultViewModel,
      ...defaultHandlers,
    });
  });

  it("should render collection name and flashcards list from hook viewModel", () => {
    // Make sure mock returns the defaultViewModel
    mockUseCollectionDetail.mockReturnValue({
      ...defaultHandlers,
      viewModel: defaultViewModel,
    });

    render(<CollectionDetailView initialCollectionName={initialCollectionName} />);

    expect(screen.getByRole("heading", { name: initialCollectionName })).toBeInTheDocument();
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(mockFlashcardsData.length);
    expect(within(listItems[0]).getByText(/front 1/i)).toBeInTheDocument();
    expect(within(listItems[1]).getByText(/front 2/i)).toBeInTheDocument();
  });

  it("should display loading state based on hook viewModel", () => {
    mockUseCollectionDetail.mockReturnValueOnce({
      ...defaultHandlers,
      viewModel: { ...defaultViewModel, isLoading: true, flashcards: [] },
    });
    const { container } = render(<CollectionDetailView initialCollectionName={initialCollectionName} />);

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByText("Front 1")).not.toBeInTheDocument();
  });

  it("should display error state based on hook viewModel", () => {
    const error: ApiError = { status: 500, message: "Failed to load" };
    mockUseCollectionDetail.mockReturnValueOnce({
      ...defaultHandlers,
      viewModel: { ...defaultViewModel, error: error, isLoading: false, flashcards: [] },
    });
    render(<CollectionDetailView initialCollectionName={initialCollectionName} />);

    // Check if MockedErrorDisplay (the mocked component) was rendered with correct props
    expect(MockedErrorDisplay).toHaveBeenCalledTimes(1);
    expect(MockedErrorDisplay).toHaveBeenCalledWith(
      expect.objectContaining({
        error: error,
        title: "Błąd ładowania szczegółów kolekcji",
        message: error.message,
        onRetry: defaultHandlers.handleRetryFetch,
      }),
      undefined
    );

    // Check if the content rendered by the mock is present
    expect(screen.getByTestId("error-display")).toBeInTheDocument();
    expect(screen.getByText(`Error Details: ${error.message}`)).toBeInTheDocument();
    expect(screen.queryByText("Front 1")).not.toBeInTheDocument();
  });

  it("should display message when there are no flashcards in hook viewModel", () => {
    mockUseCollectionDetail.mockReturnValueOnce({
      ...defaultHandlers,
      viewModel: {
        ...defaultViewModel,
        flashcards: [],
        pagination: { ...defaultViewModel.pagination, totalItems: 0, totalPages: 0 },
      },
    });
    render(<CollectionDetailView initialCollectionName={initialCollectionName} />);

    expect(screen.getByText(/brak fiszek w tej kolekcji/i)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pagination-controls")).not.toBeInTheDocument();
  });

  it("should call handleDeleteFlashcard from hook when delete button is clicked", async () => {
    render(<CollectionDetailView initialCollectionName={initialCollectionName} />);
    const listItems = screen.getAllByRole("listitem");
    const firstFlashcardItem = listItems[0];

    const deleteButton = within(firstFlashcardItem).getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(mockHandleDeleteFlashcard).toHaveBeenCalledTimes(1);
    expect(mockHandleDeleteFlashcard).toHaveBeenCalledWith(mockFlashcardsData[0].flashcard_id);
  });

  it("should show delete confirmation dialog when deleteFlashcardTargetId is set", async () => {
    const targetId = mockFlashcardsData[0].flashcard_id;
    mockUseCollectionDetail.mockReturnValueOnce({
      ...defaultHandlers,
      viewModel: defaultViewModel,
      deleteFlashcardTargetId: targetId,
    });
    render(<CollectionDetailView initialCollectionName={initialCollectionName} />);

    const confirmDialog = await screen.findByRole("alertdialog", { name: /delete fiszkę dialog/i });
    expect(confirmDialog).toBeInTheDocument();

    const confirmButton = within(confirmDialog).getByRole("button", { name: /confirm delete/i });
    await user.click(confirmButton);

    expect(mockHandleDeleteFlashcardConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call handleEditFlashcard from hook when edit button is clicked", async () => {
    render(<CollectionDetailView initialCollectionName={initialCollectionName} />);
    const listItems = screen.getAllByRole("listitem");
    const firstFlashcardItem = listItems[0];

    const editButton = within(firstFlashcardItem).getByRole("button", { name: /edit/i });
    await user.click(editButton);

    expect(mockHandleEditFlashcard).toHaveBeenCalledTimes(1);
    expect(mockHandleEditFlashcard).toHaveBeenCalledWith(mockFlashcardsData[0]);
  });

  it("should show edit dialog when editFlashcardTarget is set", async () => {
    mockUseCollectionDetail.mockReturnValueOnce({
      ...defaultHandlers,
      viewModel: defaultViewModel,
      editFlashcardTarget: mockFlashcardsData[0],
    });
    render(<CollectionDetailView initialCollectionName={initialCollectionName} />);

    expect(await screen.findByRole("dialog", { name: /edit dialog/i })).toBeInTheDocument();
  });
});
