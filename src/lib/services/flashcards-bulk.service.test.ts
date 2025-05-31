import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { FlashcardsBulkService } from "./flashcards-bulk.service";
import { FlashcardServiceError } from "./flashcard.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlashcardCandidateDto, FlashcardDTO } from "../../types";
import type { PostgrestResponse, PostgrestError } from "@supabase/supabase-js";

// --- Mock Types --- //
// Mock for the final query builder step (.insert().select())
interface MockInsertSelectBuilder {
  insert: Mock<(data: FlashcardCandidateDto[]) => MockInsertSelectBuilder>;
  select: Mock<() => Promise<PostgrestResponse<FlashcardDTO>>>;
}

// --- Mocks (initialized in beforeEach) --- //
let mockSupabase: SupabaseClient;
let mockInsertSelectBuilder: MockInsertSelectBuilder;

// Helper to create a mock PostgrestError
const createMockPostgrestError = (message: string, code: string): PostgrestError => ({
  message,
  details: "mock details",
  hint: "mock hint",
  code,
  name: "PostgrestError",
});

describe("FlashcardsBulk Service", () => {
  let flashcardsBulkService: FlashcardsBulkService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the final insert().select() chain
    mockInsertSelectBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        status: 201,
        statusText: "Created",
        count: null,
      } as unknown as PostgrestResponse<FlashcardDTO>),
    };

    // Mock the Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockInsertSelectBuilder),
    } as unknown as SupabaseClient;

    // Instantiate the service with the mock client
    flashcardsBulkService = new FlashcardsBulkService(mockSupabase);
  });

  describe("bulkCreateFlashcards", () => {
    const userId = "user-bulk-test";
    const mockFlashcardCandidates: FlashcardCandidateDto[] = [
      { front: "f1", back: "b1", collection: "col1", source: "ai-full", generation_id: 1 },
      { front: "f2", back: "b2", collection: "col1", source: "ai-edited", generation_id: 1 },
    ];
    // Corresponding DTOs expected after insertion (assuming DB adds id, created_at etc.)
    const mockCreatedFlashcards: FlashcardDTO[] = mockFlashcardCandidates.map((fc, i) => ({
      ...fc,
      flashcard_id: i + 1, // Mocked ID
      user_id: userId,
      created_at: new Date().toISOString(), // Mocked timestamp
      updated_at: new Date().toISOString(),
    }));

    it("should create flashcards successfully", async () => {
      // Arrange
      mockInsertSelectBuilder.select.mockResolvedValueOnce({
        data: mockCreatedFlashcards,
        error: null,
        status: 201,
        statusText: "Created",
        count: null,
      } as unknown as PostgrestResponse<FlashcardDTO>);
      const expectedInsertPayload = mockFlashcardCandidates.map((fc) => ({ ...fc, user_id: userId }));

      // Act
      const result = await flashcardsBulkService.bulkCreateFlashcards(mockFlashcardCandidates, userId);

      // Assert
      expect(result.data).toEqual(mockCreatedFlashcards);
      expect(result.status).toBe("Created flashcards successfully");
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockInsertSelectBuilder.insert).toHaveBeenCalledWith(expectedInsertPayload);
      expect(mockInsertSelectBuilder.select).toHaveBeenCalledTimes(1);
    });

    it("should throw validation error if userId is missing", async () => {
      await expect(flashcardsBulkService.bulkCreateFlashcards(mockFlashcardCandidates, "")).rejects.toThrow(
        new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400)
      );
    });

    it("should throw validation error if flashcards array is empty", async () => {
      await expect(flashcardsBulkService.bulkCreateFlashcards([], userId)).rejects.toThrow(
        new FlashcardServiceError("At least one flashcard must be provided", "VALIDATION_ERROR", 400)
      );
    });

    it("should throw validation error for foreign key constraint violation (23503)", async () => {
      const dbError = createMockPostgrestError(
        'insert or update on table "flashcards" violates foreign key constraint "fk_flashcards_generation_id"',
        "23503"
      );
      // Arrange
      mockInsertSelectBuilder.select.mockResolvedValueOnce({
        data: null,
        error: dbError,
        status: 409,
        statusText: "Conflict",
        count: null,
      } as unknown as PostgrestResponse<FlashcardDTO>);

      // Act & Assert
      await expect(flashcardsBulkService.bulkCreateFlashcards(mockFlashcardCandidates, userId)).rejects.toThrow(
        new FlashcardServiceError(
          "Foreign key constraint violation: referenced generation may not exist",
          "VALIDATION_ERROR",
          400,
          dbError
        )
      );
    });

    it("should throw validation error for other constraint violations (starting with 23)", async () => {
      const constraintMsg = 'violates check constraint "flashcards_source_check"';
      const dbError = createMockPostgrestError(constraintMsg, "23514"); // Example check constraint code
      // Arrange
      mockInsertSelectBuilder.select.mockResolvedValueOnce({
        data: null,
        error: dbError,
        status: 409,
        statusText: "Conflict",
        count: null,
      } as unknown as PostgrestResponse<FlashcardDTO>);

      // Act & Assert
      await expect(flashcardsBulkService.bulkCreateFlashcards(mockFlashcardCandidates, userId)).rejects.toThrow(
        new FlashcardServiceError(`Constraint violation: ${constraintMsg}`, "VALIDATION_ERROR", 400, dbError)
      );
    });

    it("should throw database error for other Supabase errors", async () => {
      const genericMsg = "Database connection lost";
      const dbError = createMockPostgrestError(genericMsg, "08006"); // Example connection error code
      // Arrange
      mockInsertSelectBuilder.select.mockResolvedValueOnce({
        data: null,
        error: dbError,
        status: 500,
        statusText: "Internal Server Error",
        count: null,
      } as unknown as PostgrestResponse<FlashcardDTO>);

      // Act & Assert
      await expect(flashcardsBulkService.bulkCreateFlashcards(mockFlashcardCandidates, userId)).rejects.toThrow(
        new FlashcardServiceError(`Failed to create flashcards in bulk: ${genericMsg}`, "DATABASE_ERROR", 500, dbError)
      );
    });

    it("should rethrow FlashcardServiceError if caught", async () => {
      const customError = new FlashcardServiceError("A pre-existing condition", "VALIDATION_ERROR", 412);
      // Arrange: Make the insert call itself throw our specific error
      mockInsertSelectBuilder.insert.mockImplementationOnce(() => {
        throw customError;
      });

      // Act & Assert
      await expect(flashcardsBulkService.bulkCreateFlashcards(mockFlashcardCandidates, userId)).rejects.toThrow(
        customError
      );
    });

    it("should throw unknown error for unexpected errors during insert/select", async () => {
      // Reset and create fresh mocks for this test
      vi.clearAllMocks();

      const unexpectedError = new Error("Something completely unexpected happened");

      // Create a fresh mock builder for this specific test
      const testMockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockRejectedValueOnce(unexpectedError),
      };

      // Create a fresh Supabase mock for this test
      const testSupabase = {
        from: vi.fn().mockReturnValue(testMockBuilder),
      } as unknown as SupabaseClient;

      // Create a fresh service instance
      const testService = new FlashcardsBulkService(testSupabase);

      // Act & Assert
      await expect(testService.bulkCreateFlashcards(mockFlashcardCandidates, userId)).rejects.toThrow(
        new FlashcardServiceError(
          "An unexpected error occurred while creating flashcards in bulk",
          "UNKNOWN_ERROR",
          500,
          unexpectedError
        )
      );
    }, 10000); // Add 10 second timeout

    it("should return empty data array if Supabase returns success but null data", async () => {
      // Arrange
      mockInsertSelectBuilder.select.mockResolvedValueOnce({
        data: null,
        error: null,
        status: 201,
        statusText: "Created",
        count: null,
      } as unknown as PostgrestResponse<FlashcardDTO>);
      const expectedInsertPayload = mockFlashcardCandidates.map((fc) => ({ ...fc, user_id: userId }));

      // Act
      const result = await flashcardsBulkService.bulkCreateFlashcards(mockFlashcardCandidates, userId);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.status).toBe("Created flashcards successfully");
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockInsertSelectBuilder.insert).toHaveBeenCalledWith(expectedInsertPayload);
      expect(mockInsertSelectBuilder.select).toHaveBeenCalledTimes(1);
    });
  });
});
