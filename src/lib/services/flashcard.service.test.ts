/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { FlashcardService, FlashcardServiceError } from "./flashcard.service";
import type { CreateFlashcardCommand, FlashcardDTO, UpdateFlashcardCommand } from "@/types"; // Assuming types are in src/types
import { createSupabaseServerInstance } from "@/db/supabase.client";

// Mock the Supabase client factory
vi.mock("@/db/supabase.client");

// Define the return type of the factory function based on the actual service usage
type SupabaseClientType = ReturnType<typeof createSupabaseServerInstance>;

// Type for the mocked Supabase client instance, derived from the actual type
interface MockSupabaseClient extends SupabaseClientType {
  from: vi.Mock<[string], MockSupabaseChain>;
}

// Type for the chainable query builder methods (simplified, adjust as needed)
interface MockSupabaseChain {
  select: vi.Mock<[string, { count?: "exact" | "planned" | "estimated" }?], MockSupabaseChain>;
  insert: vi.Mock<[object | object[]], MockSupabaseChain>;
  update: vi.Mock<[object], MockSupabaseChain>;
  delete: vi.Mock<[], MockSupabaseChain>;
  eq: vi.Mock<[string, string | number | boolean | null], MockSupabaseChain>;
  neq: vi.Mock<[string, string | number | boolean | null], MockSupabaseChain>;
  gt: vi.Mock<[string, string | number], MockSupabaseChain>;
  lt: vi.Mock<[string, string | number], MockSupabaseChain>;
  gte: vi.Mock<[string, string | number], MockSupabaseChain>;
  lte: vi.Mock<[string, string | number], MockSupabaseChain>;
  like: vi.Mock<[string, string], MockSupabaseChain>;
  ilike: vi.Mock<[string, string], MockSupabaseChain>;
  in: vi.Mock<[string, (string | number | boolean)[]], MockSupabaseChain>;
  is: vi.Mock<[string, null | boolean], MockSupabaseChain>;
  or: vi.Mock<[string], MockSupabaseChain>;
  filter: vi.Mock<[string, string, unknown], MockSupabaseChain>;
  match: vi.Mock<[Record<string, unknown>], MockSupabaseChain>;
  order: vi.Mock<[string, { ascending?: boolean; nullsFirst?: boolean }?], MockSupabaseChain>;
  limit: vi.Mock<[number], MockSupabaseChain>;
  range: vi.Mock<[number, number], MockSupabaseChain>;
  single: vi.Mock<[], MockSupabaseChain>;
  maybeSingle: vi.Mock<[], MockSupabaseChain>;
  then: <TResult1 = { data: unknown; error: PostgrestError | null; count: number | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: unknown;
          error: PostgrestError | null;
          count: number | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ) => Promise<TResult1 | TResult2>;
  mockQueryResult: (result: {
    data?: unknown;
    error?: PostgrestError | null;
    count?: number | null;
  }) => MockSupabaseChain;
  clearMockQueue: () => void;
}

// Helper function to create a mock Supabase client with chainable methods and result queuing
const createMockSupabase = (): MockSupabaseClient => {
  let resultsQueue: { data?: unknown; error?: PostgrestError | null; count?: number | null }[] = [];

  const chain: MockSupabaseChain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    like: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    in: vi.fn(() => chain),
    is: vi.fn(() => chain),
    or: vi.fn(() => chain),
    filter: vi.fn(() => chain),
    match: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    range: vi.fn(() => chain),
    single: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
    then: vi.fn(
      <TResult1 = { data: unknown; error: PostgrestError | null; count: number | null }, TResult2 = never>(
        onfulfilled?:
          | ((value: {
              data: unknown;
              error: PostgrestError | null;
              count: number | null;
            }) => TResult1 | PromiseLike<TResult1>)
          | undefined
          | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
      ): Promise<TResult1 | TResult2> => {
        const resultToUse = resultsQueue.shift() || { data: null, error: null, count: 0 };
        const promise = Promise.resolve({
          data: resultToUse.error ? null : resultToUse.data,
          error: resultToUse.error,
          count: resultToUse.count ?? null,
        });
        return promise.then(onfulfilled, onrejected);
      }
    ),
    mockQueryResult: (result: {
      data?: unknown;
      error?: PostgrestError | null;
      count?: number | null;
    }): MockSupabaseChain => {
      resultsQueue.push(result);
      return chain;
    },
    clearMockQueue: () => {
      resultsQueue = [];
    },
  };

  const client = {
    from: vi.fn(() => chain),
  } as unknown as MockSupabaseClient;

  // Add methods using Mock type from vitest if needed for type safety
  (client as MockSupabaseClient & { mockQueryResult: typeof chain.mockQueryResult }).mockQueryResult =
    chain.mockQueryResult;
  (client as MockSupabaseClient & { clearMockQueue: typeof chain.clearMockQueue }).clearMockQueue =
    chain.clearMockQueue;

  return client;
};

// Global mock instance to be configured in tests
let mockSupabaseInstance: MockSupabaseClient;
let flashcardService: FlashcardService;

describe("Flashcard Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSupabaseInstance = createMockSupabase();
    vi.mocked(createSupabaseServerInstance).mockReturnValue(mockSupabaseInstance);
    flashcardService = new FlashcardService(mockSupabaseInstance);
  });

  it("should be defined", () => {
    expect(flashcardService).toBeDefined();
  });

  // --- createFlashcard --- //
  describe("createFlashcard", () => {
    const userId = "test-user-id";
    const command: CreateFlashcardCommand = {
      front: "Test Front",
      back: "Test Back",
      collection: "Test Collection",
      source: "manual",
    };
    const expectedFlashcard: FlashcardDTO = {
      flashcard_id: 1,
      user_id: userId,
      front: "Test Front",
      back: "Test Back",
      collection: "Test Collection",
      source: "manual",
      generation_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it("should create and return a new flashcard on success", async () => {
      // Arrange
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ data: expectedFlashcard });

      // Act
      const result = await flashcardService.createFlashcard(command, userId);

      // Assert
      expect(result).toEqual(expectedFlashcard);
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("flashcards");
      expect(mockChain.insert).toHaveBeenCalledWith({
        front: command.front,
        back: command.back,
        collection: command.collection,
        source: "manual",
        user_id: userId,
        generation_id: null,
      });
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
    });

    it("should throw an error if Supabase insert fails", async () => {
      // Arrange
      const mockError: PostgrestError = {
        message: "Insert failed",
        details: "",
        hint: "",
        code: "DB_INSERT_ERR",
        name: "PostgrestError",
      };
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      // Simulate error during the insert->select->single chain
      mockChain.mockQueryResult({ error: mockError });

      // Act & Assert
      try {
        await flashcardService.createFlashcard(command, userId);
        // If the above line does not throw, fail the test
        expect.fail("Expected createFlashcard to throw, but it did not.");
      } catch (error) {
        // Check if the caught error is an instance of the generic Error
        expect(error).toBeInstanceOf(Error);
        // Check if the error message is what we expect
        expect((error as Error).message).toBe(`Failed to create flashcard: ${mockError.message}`);
      }

      // Verify the calls still happened
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("flashcards");
      expect(mockChain.insert).toHaveBeenCalled(); // Check if insert was called
      expect(mockChain.select).toHaveBeenCalled(); // Check if select was called after insert
      expect(mockChain.single).toHaveBeenCalled(); // Check if single was called after select
    });
  });

  // --- getFlashcards --- //
  describe("getFlashcards", () => {
    const userId = "test-user-id";
    const page = 1;
    const limit = 10;
    const mockFlashcards: FlashcardDTO[] = [
      {
        flashcard_id: 1,
        user_id: userId,
        front: "Q1",
        back: "A1",
        collection: "Col1",
        source: "manual",
        generation_id: null,
        created_at: new Date(Date.now() - 10000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        flashcard_id: 2,
        user_id: userId,
        front: "Q2",
        back: "A2",
        collection: "Col2",
        source: "manual",
        generation_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    it("should return paginated flashcards for a user", async () => {
      // Arrange
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ data: mockFlashcards, count: mockFlashcards.length });
      const offset = (page - 1) * limit;

      // Act
      const result = await flashcardService.getFlashcards(userId, page, limit);

      // Assert
      expect(result).toEqual({ data: mockFlashcards, page, limit, total: mockFlashcards.length });
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("flashcards");
      expect(mockChain.select).toHaveBeenCalledWith("*", { count: "exact" });
      expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockChain.order).toHaveBeenCalledWith("created_at", { ascending: false }); // Default sort
      expect(mockChain.range).toHaveBeenCalledWith(offset, offset + limit - 1);
    });

    it("should apply collection filter when provided", async () => {
      // Arrange
      const collection = "Col1";
      const filteredFlashcards = mockFlashcards.filter((f) => f.collection === collection);
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ data: filteredFlashcards, count: filteredFlashcards.length });
      const offset = (page - 1) * limit;

      // Act
      const result = await flashcardService.getFlashcards(userId, page, limit, collection);

      // Assert
      expect(result.data).toEqual(filteredFlashcards);
      expect(mockChain.select).toHaveBeenCalledWith("*", { count: "exact" });
      expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockChain.eq).toHaveBeenCalledWith("collection", collection);
      expect(mockChain.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockChain.range).toHaveBeenCalledWith(offset, offset + limit - 1);
    });

    it("should apply sorting when provided", async () => {
      // Arrange
      const sort = "front";
      const order = "asc";
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ data: mockFlashcards, count: mockFlashcards.length }); // Mock data doesn't need to be sorted here
      const offset = (page - 1) * limit;

      // Act
      await flashcardService.getFlashcards(userId, page, limit, undefined, sort, order);

      // Assert
      expect(mockChain.order).toHaveBeenCalledWith(sort, { ascending: true });
      expect(mockChain.range).toHaveBeenCalledWith(offset, offset + limit - 1);
    });

    it("should return empty data array and total 0 if no flashcards found", async () => {
      // Arrange
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ data: [], count: 0 });

      // Act
      const result = await flashcardService.getFlashcards(userId, page, limit);

      // Assert
      expect(result).toEqual({ data: [], page, limit, total: 0 });
      expect(mockChain.select).toHaveBeenCalledWith("*", { count: "exact" });
    });

    // Validation Error Tests
    it.each([
      { p: 0, l: 10, error: "Page must be a positive integer", code: "VALIDATION_ERROR" },
      { p: -1, l: 10, error: "Page must be a positive integer", code: "VALIDATION_ERROR" },
      { p: 1, l: 0, error: "Limit must be between 1 and 100", code: "VALIDATION_ERROR" },
      { p: 1, l: 101, error: "Limit must be between 1 and 100", code: "VALIDATION_ERROR" },
    ])("should throw Validation Error for page $p and limit $l", async ({ p, l, error, code }) => {
      await expect(flashcardService.getFlashcards(userId, p, l)).rejects.toThrowError(
        new FlashcardServiceError(error, code as "VALIDATION_ERROR", 400)
      );
    });

    it("should throw Validation Error if userId is missing", async () => {
      await expect(flashcardService.getFlashcards("", 1, 10)).rejects.toThrowError(
        new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400)
      );
    });

    // Database Error Tests
    it("should throw FlashcardServiceError with DATABASE_ERROR code on Supabase error", async () => {
      // Arrange
      const mockError: PostgrestError = {
        message: "Connection failed",
        details: "",
        hint: "",
        code: "50000", // Generic DB error code
        name: "PostgrestError",
      };
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ error: mockError });

      // Act & Assert
      await expect(flashcardService.getFlashcards(userId, page, limit)).rejects.toThrowError(
        new FlashcardServiceError(`Failed to fetch flashcards: ${mockError.message}`, "DATABASE_ERROR", 500, mockError)
      );
    });

    it("should throw specific FlashcardServiceError for known Supabase error codes", async () => {
      // Arrange
      const mockError: PostgrestError = {
        message: "Table missing",
        details: "",
        hint: "",
        code: "42P01", // Table does not exist
        name: "PostgrestError",
      };
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ error: mockError });

      // Act & Assert
      await expect(flashcardService.getFlashcards(userId, page, limit)).rejects.toThrowError(
        new FlashcardServiceError("Table 'flashcards' does not exist", "DATABASE_ERROR", 500, mockError)
      );
    });

    // Unexpected Error Test
    it("should throw FlashcardServiceError with UNKNOWN_ERROR code for unexpected errors", async () => {
      // Arrange
      const unexpectedError = new Error("Something weird happened");
      // Simulate error by making the mock function throw directly
      vi.spyOn(mockSupabaseInstance, "from").mockImplementation(() => {
        throw unexpectedError;
      });

      // Act & Assert
      await expect(flashcardService.getFlashcards(userId, page, limit)).rejects.toThrowError(
        new FlashcardServiceError(
          "An unexpected error occurred while fetching flashcards",
          "UNKNOWN_ERROR",
          500,
          unexpectedError
        )
      );
    });
  });

  // --- getFlashcardById --- //
  describe("getFlashcardById", () => {
    const userId = "test-user-id";
    const flashcardId = 123;
    const mockFlashcard: FlashcardDTO = {
      flashcard_id: flashcardId,
      user_id: userId,
      front: "Specific Q",
      back: "Specific A",
      collection: "Specific Col",
      source: "manual",
      generation_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it("should return the flashcard when found", async () => {
      // Arrange
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ data: mockFlashcard });

      // Act
      const result = await flashcardService.getFlashcardById(flashcardId, userId);

      // Assert
      expect(result).toEqual(mockFlashcard);
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("flashcards");
      expect(mockChain.select).toHaveBeenCalledWith("*");
      expect(mockChain.eq).toHaveBeenCalledWith("flashcard_id", flashcardId);
      expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockChain.single).toHaveBeenCalled();
    });

    // Validation Errors
    it("should throw Validation Error if userId is missing", async () => {
      await expect(flashcardService.getFlashcardById(flashcardId, "")).rejects.toThrowError(
        new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400)
      );
    });

    it.each([
      { id: 0, msg: "Valid flashcard ID is required" },
      { id: -1, msg: "Valid flashcard ID is required" },
    ])("should throw Validation Error for invalid flashcardId: $id", async ({ id, msg }) => {
      await expect(flashcardService.getFlashcardById(id, userId)).rejects.toThrowError(
        new FlashcardServiceError(msg, "VALIDATION_ERROR", 400)
      );
    });

    // Not Found Errors
    it("should throw Not Found Error if Supabase returns PGRST116 error", async () => {
      // Arrange
      const mockError: PostgrestError = {
        message: "No rows found",
        details: "",
        hint: "",
        code: "PGRST116", // Specific code for no rows found with .single()
        name: "PostgrestError",
      };
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ error: mockError });

      // Act & Assert
      await expect(flashcardService.getFlashcardById(flashcardId, userId)).rejects.toThrowError(
        new FlashcardServiceError(
          // Message from service code for PGRST116
          "The requested flashcard was not found or you don't have access to it",
          "NOT_FOUND",
          404,
          mockError
        )
      );
    });

    it("should throw Not Found Error if Supabase returns null data without error", async () => {
      // Arrange
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ data: null }); // Simulate no data returned

      // Act & Assert
      await expect(flashcardService.getFlashcardById(flashcardId, userId)).rejects.toThrowError(
        new FlashcardServiceError("Flashcard not found", "NOT_FOUND", 404)
      );
    });

    // Database Error
    it("should throw Database Error for generic Supabase errors", async () => {
      // Arrange
      const mockError: PostgrestError = {
        message: "DB connection lost",
        details: "",
        hint: "",
        code: "XXYYZ",
        name: "PostgrestError",
      };
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ error: mockError });

      // Act & Assert
      await expect(flashcardService.getFlashcardById(flashcardId, userId)).rejects.toThrowError(
        new FlashcardServiceError(`Database error: ${mockError.message}`, "DATABASE_ERROR", 500, mockError)
      );
    });

    // Unexpected Error
    it("should throw Unknown Error for unexpected issues", async () => {
      // Arrange
      const unexpectedError = new Error("Something else broke");
      vi.spyOn(mockSupabaseInstance, "from").mockImplementation(() => {
        throw unexpectedError;
      });

      // Act & Assert
      await expect(flashcardService.getFlashcardById(flashcardId, userId)).rejects.toThrowError(
        new FlashcardServiceError(
          "An unexpected error occurred while fetching the flashcard",
          "UNKNOWN_ERROR",
          500,
          unexpectedError
        )
      );
    });
  });

  // --- updateFlashcard --- //
  describe("updateFlashcard", () => {
    const userId = "test-user-id";
    const flashcardId = 456;
    const updateCommand: UpdateFlashcardCommand = {
      front: "Updated Front",
      back: "Updated Back",
    };
    const existingFlashcard: FlashcardDTO = {
      flashcard_id: flashcardId,
      user_id: userId,
      front: "Original Front",
      back: "Original Back",
      collection: "Original Col",
      source: "manual",
      generation_id: null,
      created_at: new Date(Date.now() - 20000).toISOString(),
      updated_at: new Date(Date.now() - 10000).toISOString(),
    };
    const updatedFlashcard: FlashcardDTO = {
      ...existingFlashcard,
      ...updateCommand,
      updated_at: new Date().toISOString(), // Assume updated_at changes
    };

    it("should update and return the flashcard on success", async () => {
      // Arrange
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      // Mock the initial check for existence
      mockChain.mockQueryResult({ data: { flashcard_id: flashcardId } });
      // Mock the update operation
      mockChain.mockQueryResult({ data: updatedFlashcard });

      // Act
      const result = await flashcardService.updateFlashcard(flashcardId, updateCommand, userId);

      // Assert
      expect(result).toEqual(updatedFlashcard);
      // Check the initial select call
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("flashcards");
      // Check select was called twice (once for check, once after update)
      expect(mockChain.select).toHaveBeenCalledTimes(2);
      expect(mockChain.eq).toHaveBeenCalledWith("flashcard_id", flashcardId);
      expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
      // Check single was called twice (once for check, once after update)
      expect(mockChain.single).toHaveBeenCalledTimes(2);

      // Check the update call
      expect(mockChain.update).toHaveBeenCalledWith(updateCommand);
      // Verify eq calls related to the update
      expect(mockChain.eq).toHaveBeenCalledWith("flashcard_id", flashcardId);
      expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
    });

    // Validation Errors
    it("should throw Validation Error if userId is missing", async () => {
      await expect(flashcardService.updateFlashcard(flashcardId, updateCommand, "")).rejects.toThrowError(
        new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400)
      );
    });

    it.each([
      { id: 0, cmd: updateCommand, msg: "Valid flashcard ID is required" },
      { id: -1, cmd: updateCommand, msg: "Valid flashcard ID is required" },
      { id: flashcardId, cmd: {}, msg: "At least one field must be provided for update" },
    ])("should throw Validation Error for invalid input (id: $id, cmd: $cmd)", async ({ id, cmd, msg }) => {
      await expect(flashcardService.updateFlashcard(id, cmd as UpdateFlashcardCommand, userId)).rejects.toThrowError(
        new FlashcardServiceError(msg, "VALIDATION_ERROR", 400)
      );
    });

    // Not Found Error (during initial check)
    it("should throw Not Found Error if the flashcard does not exist or belong to user", async () => {
      // Arrange
      const mockError: PostgrestError = {
        message: "No rows found during check",
        details: "",
        hint: "",
        code: "PGRST116",
        name: "PostgrestError",
      };
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ error: mockError }); // Error on the initial select().single()

      // Act & Assert
      await expect(flashcardService.updateFlashcard(flashcardId, updateCommand, userId)).rejects.toThrowError(
        new FlashcardServiceError(
          "The flashcard was not found or you don't have permission to update it",
          "NOT_FOUND",
          404,
          mockError
        )
      );
      // Verify only the check was attempted
      expect(mockChain.select).toHaveBeenCalledWith("flashcard_id");
      expect(mockChain.update).not.toHaveBeenCalled();
    });

    // Database Error (during update)
    it("should throw Database Error if the update operation fails", async () => {
      // Arrange
      const mockError: PostgrestError = {
        message: "Update constraint violation",
        details: "",
        hint: "",
        code: "23505", // Example constraint violation code
        name: "PostgrestError",
      };
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      // Mock the initial check for existence - success
      mockChain.mockQueryResult({ data: { flashcard_id: flashcardId } });
      // Mock the update operation - failure
      mockChain.mockQueryResult({ error: mockError });

      // Act & Assert
      await expect(flashcardService.updateFlashcard(flashcardId, updateCommand, userId)).rejects.toThrowError(
        new FlashcardServiceError(`Constraint violation: ${mockError.message}`, "DATABASE_ERROR", 500, mockError)
      );
      // Verify the update was attempted
      expect(mockChain.update).toHaveBeenCalledWith(updateCommand);
    });

    // Unexpected Error
    it("should throw Unknown Error for unexpected issues", async () => {
      // Arrange
      const unexpectedError = new Error("Network issue during update");
      // Simulate error during the initial check
      vi.spyOn(mockSupabaseInstance, "from").mockImplementation(() => {
        throw unexpectedError;
      });

      // Act & Assert
      await expect(flashcardService.updateFlashcard(flashcardId, updateCommand, userId)).rejects.toThrowError(
        new FlashcardServiceError(
          "An unexpected error occurred while updating the flashcard",
          "UNKNOWN_ERROR",
          500,
          unexpectedError
        )
      );
    });
  });

  // --- deleteFlashcard --- //
  describe("deleteFlashcard", () => {
    const userId = "test-user-id";
    const flashcardId = 789;

    it("should delete the flashcard successfully", async () => {
      // Arrange
      // Use the refactored mock helper to queue results
      // Queue result for the initial existence check (select)
      mockSupabaseInstance.mockQueryResult({ data: { flashcard_id: flashcardId } });
      // Queue result for the delete operation
      mockSupabaseInstance.mockQueryResult({ data: null, error: null });

      // Act
      await flashcardService.deleteFlashcard(flashcardId, userId);

      // Assert
      // Check the initial select call
      expect(mockSupabaseInstance.from).toHaveBeenCalledWith("flashcards");
      // Get the mock chain for verification
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      expect(mockChain.select).toHaveBeenCalledWith("flashcard_id");
      expect(mockChain.eq).toHaveBeenCalledWith("flashcard_id", flashcardId);
      expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockChain.single).toHaveBeenCalledTimes(1);

      // Check the delete call
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith("flashcard_id", flashcardId);
      expect(mockChain.eq).toHaveBeenCalledWith("user_id", userId);
    });

    // Validation Errors
    it("should throw Validation Error if userId is missing", async () => {
      await expect(flashcardService.deleteFlashcard(flashcardId, "")).rejects.toThrowError(
        new FlashcardServiceError("User ID is required", "VALIDATION_ERROR", 400)
      );
    });

    it.each([
      { id: 0, msg: "Valid flashcard ID is required" },
      { id: -1, msg: "Valid flashcard ID is required" },
    ])("should throw Validation Error for invalid flashcardId: $id", async ({ id, msg }) => {
      await expect(flashcardService.deleteFlashcard(id, userId)).rejects.toThrowError(
        new FlashcardServiceError(msg, "VALIDATION_ERROR", 400)
      );
    });

    // Not Found Error (during initial check)
    it("should throw Not Found Error if the flashcard to delete does not exist", async () => {
      // Arrange
      const mockError: PostgrestError = {
        message: "No rows found to delete",
        details: "",
        hint: "",
        code: "PGRST116",
        name: "PostgrestError",
      };
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      mockChain.mockQueryResult({ error: mockError }); // Error on the initial select().single()

      // Act & Assert
      await expect(flashcardService.deleteFlashcard(flashcardId, userId)).rejects.toThrowError(
        new FlashcardServiceError(
          "The flashcard was not found or you don't have permission to delete it",
          "NOT_FOUND",
          404,
          mockError
        )
      );
      // Verify only the check was attempted
      expect(mockChain.select).toHaveBeenCalledWith("flashcard_id");
      expect(mockChain.delete).not.toHaveBeenCalled();
    });

    // Database Error (during delete)
    it("should throw Database Error if the delete operation fails", async () => {
      // Arrange
      const mockError: PostgrestError = {
        message: "Deletion failed due to constraint",
        details: "",
        hint: "",
        code: "23503", // Example foreign key violation
        name: "PostgrestError",
      };
      const mockChain = mockSupabaseInstance.from("flashcards") as unknown as MockSupabaseChain;
      // Mock the initial check - success
      mockChain.mockQueryResult({ data: { flashcard_id: flashcardId } });
      // Mock the delete operation - failure
      mockChain.mockQueryResult({ error: mockError });

      // Act & Assert
      await expect(flashcardService.deleteFlashcard(flashcardId, userId)).rejects.toThrowError(
        new FlashcardServiceError(`Constraint violation: ${mockError.message}`, "DATABASE_ERROR", 500, mockError)
      );
      // Verify the delete was attempted
      expect(mockChain.delete).toHaveBeenCalled();
    });

    // Unexpected Error
    it("should throw Unknown Error for unexpected issues", async () => {
      // Arrange
      const unexpectedError = new Error("Server timeout during delete");
      // Simulate error during the initial check
      vi.spyOn(mockSupabaseInstance, "from").mockImplementation(() => {
        throw unexpectedError;
      });

      // Act & Assert
      await expect(flashcardService.deleteFlashcard(flashcardId, userId)).rejects.toThrowError(
        new FlashcardServiceError(
          "An unexpected error occurred while deleting the flashcard",
          "UNKNOWN_ERROR",
          500,
          unexpectedError
        )
      );
    });
  });
});
