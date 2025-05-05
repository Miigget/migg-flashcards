/// <reference types="vitest/globals" />
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";

import CollectionsListView from "./CollectionsListView";
import type { CollectionViewModel, ApiError } from "@/types";
import { useCollectionsList } from "@/components/hooks/useCollectionsList";
import ErrorDisplay from "@/components/ErrorDisplay"; // Import original for mocking

// --- Mocks ---
vi.mock("@/components/hooks/useCollectionsList");

// Mock CollectionItem
interface MockCollectionItemProps {
  collection: CollectionViewModel;
  onRenameClick: (name: string) => void;
  onDeleteClick: (name: string) => void;
}
vi.mock("@/components/CollectionItem", () => ({
  default: ({ collection, onRenameClick, onDeleteClick }: MockCollectionItemProps) => (
    <div role="listitem" data-testid={`collection-${collection.name}`}>
      <h3>{collection.name}</h3>
      <span>{collection.flashcardCount} cards</span>
      <button onClick={() => onRenameClick(collection.name)}>Rename</button>
      <button onClick={() => onDeleteClick(collection.name)}>Delete</button>
      {/* Add link check if necessary */}
      <a href={`/collections/${collection.name}`}>View</a>
    </div>
  ),
}));

// Define types for dialog/error mocks
interface MockDialogProps {
  isOpen: boolean;
  [key: string]: unknown;
}
interface MockDeleteDialogProps extends MockDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  itemType: string;
  itemName: string;
}
interface MockRenameDialogProps extends MockDialogProps {
  currentName: string;
  existingNames: string[];
  onRenameSubmit: (newName: string) => void;
  onCancel: () => void;
}
interface MockErrorDisplayProps {
  error: ApiError;
  title?: string;
  message: string;
  onRetry?: () => void;
}

// Mock dialogs
vi.mock("@/components/RenameCollectionDialog", () => ({
  default: ({ isOpen, currentName }: MockRenameDialogProps) =>
    isOpen ? (
      <div role="dialog" aria-label="Rename Dialog">
        Rename {currentName}
      </div>
    ) : null,
}));
vi.mock("@/components/DeleteConfirmationDialog", () => ({
  default: ({ isOpen, itemName }: MockDeleteDialogProps) =>
    isOpen ? (
      <div role="alertdialog" aria-label="Delete Dialog">
        Delete {itemName}
      </div>
    ) : null,
}));

// Mock ErrorDisplay
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

// Get mocked reference
const MockedErrorDisplay = vi.mocked(ErrorDisplay, true);

const mockCollectionsData: CollectionViewModel[] = [
  { name: "Collection A", flashcardCount: 10, isLoadingCount: false, errorCount: null },
  { name: "Collection B", flashcardCount: 5, isLoadingCount: false, errorCount: null },
  { name: "Collection C", flashcardCount: null, isLoadingCount: true, errorCount: null }, // Example loading count
];

describe("CollectionsListView", () => {
  const user = userEvent.setup();
  let mockUseCollectionsList: Mock;
  let mockHandleRenameClick: Mock;
  let mockHandleDeleteClick: Mock;

  // Default hook state
  const defaultHookState = {
    collections: mockCollectionsData,
    isLoading: false,
    error: null,
    renameTarget: null,
    deleteTarget: null,
    isSubmittingRename: false,
    isSubmittingDelete: false,
    renameError: null,
    deleteError: null,
    handleRenameClick: vi.fn(),
    handleDeleteClick: vi.fn(),
    handleRenameCancel: vi.fn(),
    handleDeleteCancel: vi.fn(),
    handleRenameSubmit: vi.fn(),
    handleDeleteConfirm: vi.fn(),
    handleRetryFetch: vi.fn(),
    // Provide the missing property for validation
    collectionNamesForValidation: mockCollectionsData.map((c) => c.name),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    MockedErrorDisplay.mockClear();

    // Assign specific handlers for assertion
    mockHandleRenameClick = defaultHookState.handleRenameClick;
    mockHandleDeleteClick = defaultHookState.handleDeleteClick;

    // Setup default mock implementation for the hook
    mockUseCollectionsList = useCollectionsList as Mock;
    mockUseCollectionsList.mockReturnValue(defaultHookState);
  });

  it("should render list of collections from hook data", () => {
    render(<CollectionsListView />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(mockCollectionsData.length);
    expect(within(listItems[0]).getByRole("heading", { name: "Collection A" })).toBeInTheDocument();
    expect(within(listItems[1]).getByRole("heading", { name: "Collection B" })).toBeInTheDocument();
    expect(within(listItems[0]).getByText(/10 cards/i)).toBeInTheDocument();
  });

  it("should display loading state based on hook", () => {
    mockUseCollectionsList.mockReturnValueOnce({
      ...defaultHookState,
      isLoading: true,
      collections: [], // Skeleton usually shown when collection is empty
    });
    const { container } = render(<CollectionsListView />);
    // Check for skeleton elements instead of role="status"
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByText("Collection A")).not.toBeInTheDocument();
  });

  it("should display error state based on hook", () => {
    const expectedErrorMessage = "Nie udało się pobrać listy Twoich kolekcji.";
    const error: ApiError = { status: 500, message: expectedErrorMessage };
    mockUseCollectionsList.mockReturnValueOnce({
      ...defaultHookState,
      error: error,
      isLoading: false,
      collections: [], // Error state often means no data
    });
    render(<CollectionsListView />);

    // Check that the mocked ErrorDisplay was called correctly
    expect(MockedErrorDisplay).toHaveBeenCalledTimes(1);
    expect(MockedErrorDisplay).toHaveBeenCalledWith(
      expect.objectContaining({
        error: error,
        message: expectedErrorMessage, // Use the correct message
      }),
      undefined // Expect undefined as second argument
    );

    // Check content rendered by the mock
    expect(screen.getByTestId("error-display")).toBeInTheDocument();
    expect(screen.getByText(`Error Details: ${expectedErrorMessage}`)).toBeInTheDocument();
    expect(screen.queryByText("Collection A")).not.toBeInTheDocument();
  });

  it("should display message when there are no collections", () => {
    mockUseCollectionsList.mockReturnValueOnce({
      ...defaultHookState,
      collections: [],
      isLoading: false,
      error: null,
    });
    render(<CollectionsListView />);

    expect(screen.getByText(/Nie znaleziono żadnych kolekcji. Utwórz pierwszą!/i)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("should call handleDeleteClick from hook when delete button is clicked", async () => {
    render(<CollectionsListView />);
    const firstCollectionItem = screen.getByTestId("collection-Collection A");
    const deleteButton = within(firstCollectionItem).getByRole("button", { name: /delete/i });

    await user.click(deleteButton);

    expect(mockHandleDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockHandleDeleteClick).toHaveBeenCalledWith("Collection A");
  });

  it("should show delete confirmation dialog when deleteTarget is set", async () => {
    const targetName = "Collection A";
    mockUseCollectionsList.mockReturnValueOnce({
      ...defaultHookState,
      deleteTarget: targetName,
    });
    render(<CollectionsListView />);

    const dialog = await screen.findByRole("alertdialog", { name: /delete dialog/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(`Delete ${targetName}`)).toBeInTheDocument();
  });

  it("should call handleRenameClick from hook when rename button is clicked", async () => {
    render(<CollectionsListView />);
    const firstCollectionItem = screen.getByTestId("collection-Collection A");
    const renameButton = within(firstCollectionItem).getByRole("button", { name: /rename/i });

    await user.click(renameButton);

    expect(mockHandleRenameClick).toHaveBeenCalledTimes(1);
    expect(mockHandleRenameClick).toHaveBeenCalledWith("Collection A");
  });

  it("should show rename dialog when renameTargetName is set", () => {
    const targetName = "Collection B";
    mockUseCollectionsList.mockReturnValueOnce({
      ...defaultHookState,
      renameTarget: targetName,
    });
    render(<CollectionsListView />);

    // Dialog powinien być wyświetlony natychmiast po renderze
    const dialog = screen.getByRole("dialog", { name: /rename dialog/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(`Rename ${targetName}`)).toBeInTheDocument();
  });
});
