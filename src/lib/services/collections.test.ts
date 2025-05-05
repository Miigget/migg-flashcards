import { describe, it, expect, vi, beforeEach, SpyInstance } from "vitest";
import type {
  SupabaseClient,
  // PostgrestResponse, // No longer explicitly used in tests
  PostgrestError,
} from "@supabase/supabase-js";
// Import the service object
import { service as collectionsService } from "./collections";
import type { Database } from "@/db/database.types";

// More specific types for mocks
interface MockSupabaseResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  count?: number | null;
}

// Re-type the mock based on the actual usage and SupabaseClient
type MockSupabaseClient = SupabaseClient<Database> & {
  mockResolveNext: (value: MockSupabaseResponse<unknown>) => void;
  mockRejectNext: (error: Error | PostgrestError) => void; // Accept Error or PostgrestError
  // Chainable methods return the mock itself or a promise-like object
  from: vi.Mock<[string], MockSupabaseClient>;
  select: vi.Mock<[string?, { head?: boolean; count?: "exact" | "planned" | "estimated" }?], MockSupabaseClient>; // Updated select mock type
  eq: vi.Mock<[string, string | number | boolean], MockSupabaseClient>; // Updated eq mock type
  order: vi.Mock<[string, { ascending?: boolean }?], MockSupabaseClient>;
  limit: vi.Mock<[number], MockSupabaseClient>;
  update: vi.Mock<[object, { count?: "exact" | "planned" | "estimated" }?], MockSupabaseClient>; // Updated update mock type
  delete: Mock<[{ count?: "exact" | "planned" | "estimated" }?], MockSupabaseClient>; // Updated delete mock type
  // The implicit then method for await
  then: <TResult1 = MockSupabaseResponse<unknown>, TResult2 = never>(
    onfulfilled: (value: MockSupabaseResponse<unknown>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: Error | PostgrestError) => TResult2 | PromiseLike<TResult2>
  ) => Promise<TResult1 | TResult2>;
};

// Define expected data shapes
interface FlashcardCollectionData {
  collection: string;
}

// Helper function to create a mock Supabase client
const createMockSupabase = (): MockSupabaseClient => {
  let nextPromiseConfig: { resolve: boolean; value: MockSupabaseResponse<unknown> | Error | PostgrestError } = {
    resolve: true,
    value: { data: [], error: null, count: 0 },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mock: any = {
    mockResolveNext: (value: MockSupabaseResponse<unknown>) => {
      nextPromiseConfig = {
        resolve: true,
        value: {
          data: value.data,
          error: value.error,
          count: value.count === undefined ? null : value.count,
        },
      };
    },
    mockRejectNext: (error: Error | PostgrestError) => {
      nextPromiseConfig = { resolve: false, value: error };
    },
  };

  const createPromise = (): Promise<MockSupabaseResponse<unknown>> => {
    const config = { ...nextPromiseConfig };
    // Reset default for next chain
    nextPromiseConfig = { resolve: true, value: { data: [], error: null, count: 0 } };
    if (config.resolve) {
      return Promise.resolve(config.value as MockSupabaseResponse<unknown>);
    } else {
      return Promise.reject(config.value);
    }
  };

  // Setup mock methods to be chainable and thenable
  mock.from = vi.fn(() => mock);
  mock.select = vi.fn(() => mock);
  mock.update = vi.fn(() => mock);
  mock.delete = vi.fn(() => mock);
  mock.order = vi.fn(() => mock);
  mock.limit = vi.fn(() => mock);
  mock.eq = vi.fn(() => mock);
  mock.then = vi.fn((onfulfilled, onrejected) => {
    return createPromise().then(onfulfilled, onrejected);
  });

  return mock as MockSupabaseClient;
};

describe("Collections Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("getUniqueCollections", () => {
    it("should return unique collection names for a user", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-123";
      const mockData: FlashcardCollectionData[] = [
        { collection: "Math" },
        { collection: "Science" },
        { collection: "Math" },
        { collection: "History" },
      ];
      mockSupabase.mockResolveNext({ data: mockData, error: null });
      const collections = await collectionsService.getUniqueCollections(mockSupabase, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.select).toHaveBeenCalledWith("collection");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.order).toHaveBeenCalledWith("collection");
      expect(collections).toEqual(["Math", "Science", "History"]);
    });

    it("should return an empty array if no collections found for the user", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-456";
      mockSupabase.mockResolveNext({ data: [], error: null });
      const collections = await collectionsService.getUniqueCollections(mockSupabase, userId);
      expect(collections).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("should throw the original Supabase error if query fails", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-789";
      const mockError: PostgrestError = {
        name: "PostgrestError",
        message: "Connection timeout",
        details: "d",
        hint: "h",
        code: "54321",
      };
      mockSupabase.mockResolveNext({ data: null, error: mockError });

      try {
        await collectionsService.getUniqueCollections(mockSupabase, userId);
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toEqual(mockError);
      }
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });
  });

  describe("checkCollectionExists", () => {
    it("should return true if flashcards exist for the collection and user", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-exists-1";
      const collectionName = "Existing Collection";
      // Set the expected final result for the await call
      mockSupabase.mockResolveNext({ data: null, error: null, count: 1 });

      const exists = await collectionsService.checkCollectionExists(mockSupabase, userId, collectionName);

      expect(exists).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.select).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("collection", collectionName);
    });

    it("should return false if no flashcards exist for the collection and user", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-exists-2";
      const collectionName = "NonExistent Collection";
      // Set the expected final result for the await call (count is 0)
      mockSupabase.mockResolveNext({ data: null, error: null, count: 0 });
      const exists = await collectionsService.checkCollectionExists(mockSupabase, userId, collectionName);

      expect(exists).toBe(false);
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("collection", collectionName);
    });

    it("should throw the original Supabase error if query fails", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-exists-err";
      const collectionName = "Any Collection";
      const mockError: PostgrestError = {
        name: "PostgrestError",
        message: "DB error on check",
        details: "d",
        hint: "h",
        code: "ABCDE",
      };
      mockSupabase.mockRejectNext(mockError);
      await expect(collectionsService.checkCollectionExists(mockSupabase, userId, collectionName)).rejects.toEqual(
        mockError
      );
    });
  });

  describe("getFlashcardsInCollectionCount", () => {
    it("should return the count of flashcards for the collection and user", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-count-1";
      const collectionName = "Counted Collection";
      const expectedCount = 42;
      mockSupabase.mockResolveNext({ data: null, error: null, count: expectedCount });
      const count = await collectionsService.getFlashcardsInCollectionCount(mockSupabase, userId, collectionName);

      expect(count).toBe(expectedCount);
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.select).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("collection", collectionName);
    });

    it("should return 0 if the Supabase count is null", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-count-2";
      const collectionName = "Empty Collection";
      mockSupabase.mockResolveNext({ data: null, error: null, count: null });
      const count = await collectionsService.getFlashcardsInCollectionCount(mockSupabase, userId, collectionName);
      expect(count).toBe(0);
    });

    it("should return 0 if the Supabase count is 0", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-count-3";
      const collectionName = "Zero Collection";
      mockSupabase.mockResolveNext({ data: null, error: null, count: 0 });
      const count = await collectionsService.getFlashcardsInCollectionCount(mockSupabase, userId, collectionName);
      expect(count).toBe(0);
    });

    it("should throw the original Supabase error if query fails", async () => {
      const mockSupabase = createMockSupabase();
      const userId = "user-count-err";
      const collectionName = "Error Collection";
      const mockError: PostgrestError = {
        name: "PostgrestError",
        message: "Count error",
        details: "d",
        hint: "h",
        code: "FGHIJ",
      };
      mockSupabase.mockResolveNext({ data: null, error: mockError, count: null });

      try {
        await collectionsService.getFlashcardsInCollectionCount(mockSupabase, userId, collectionName);
        expect.fail("Expected function to throw");
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });
  });

  describe("renameCollection", () => {
    // Use imported SpyInstance type
    let checkExistsSpy: SpyInstance<[MockSupabaseClient, string, string], Promise<boolean>>;
    let getCountSpy: SpyInstance<[MockSupabaseClient, string, string], Promise<number>>;
    const userId = "user-rename-123";
    const currentName = "Old Name";
    const newName = "New Name";

    beforeEach(() => {
      checkExistsSpy = vi.spyOn(collectionsService, "checkCollectionExists");
      getCountSpy = vi.spyOn(collectionsService, "getFlashcardsInCollectionCount");
    });

    it("should rename collection successfully if current exists and new name is unique", async () => {
      const mockSupabase = createMockSupabase();
      const updateCount = 3;
      checkExistsSpy
        .mockResolvedValueOnce(true) // checkCollectionExists for currentName
        .mockResolvedValueOnce(false); // checkCollectionExists for newName

      // Set the expected final result for the await call to renameCollection (the update operation)
      mockSupabase.mockResolveNext({ data: null, error: null, count: updateCount });

      const result = await collectionsService.renameCollection(mockSupabase, userId, currentName, newName);

      expect(result).toEqual({ count: updateCount, collectionExists: true });
      expect(checkExistsSpy).toHaveBeenNthCalledWith(1, mockSupabase, userId, currentName);
      expect(checkExistsSpy).toHaveBeenNthCalledWith(2, mockSupabase, userId, newName);
      expect(getCountSpy).not.toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.update).toHaveBeenCalledWith({ collection: newName }, { count: "exact" });
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("collection", currentName);
    });

    it("should return count 0 and collectionExists false if current collection does not exist", async () => {
      const mockSupabase = createMockSupabase();
      checkExistsSpy.mockResolvedValue(false);
      const result = await collectionsService.renameCollection(mockSupabase, userId, "NonExistent", newName);

      expect(checkExistsSpy).toHaveBeenCalledWith(mockSupabase, userId, "NonExistent");
      expect(getCountSpy).not.toHaveBeenCalled();
      expect(checkExistsSpy).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result).toEqual({ count: 0, collectionExists: false });
    });

    it("should throw an error if the new collection name already exists", async () => {
      const mockSupabase = createMockSupabase();
      checkExistsSpy.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
      await expect(collectionsService.renameCollection(mockSupabase, userId, currentName, newName)).rejects.toThrow(
        `Cannot rename: A collection named "${newName}" already exists for this user.`
      );

      expect(checkExistsSpy).toHaveBeenNthCalledWith(1, mockSupabase, userId, currentName);
      expect(checkExistsSpy).toHaveBeenNthCalledWith(2, mockSupabase, userId, newName);
      expect(getCountSpy).not.toHaveBeenCalled();
      expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    it("should return existing count if currentName and newName are the same and collection exists", async () => {
      const mockSupabase = createMockSupabase();
      const existingCount = 3;
      const sameName = "Same Name";
      checkExistsSpy.mockResolvedValue(true);
      getCountSpy.mockResolvedValue(existingCount);
      const result = await collectionsService.renameCollection(mockSupabase, userId, sameName, sameName);

      expect(checkExistsSpy).toHaveBeenCalledWith(mockSupabase, userId, sameName);
      expect(getCountSpy).toHaveBeenCalledWith(mockSupabase, userId, sameName);
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result).toEqual({ count: existingCount, collectionExists: true });
    });

    it("should return count 0 if currentName and newName are the same but collection doesn't exist", async () => {
      const mockSupabase = createMockSupabase();
      const sameName = "NonExistent Same Name";
      checkExistsSpy.mockResolvedValue(false);
      const result = await collectionsService.renameCollection(mockSupabase, userId, sameName, sameName);

      expect(checkExistsSpy).toHaveBeenCalledWith(mockSupabase, userId, sameName);
      expect(getCountSpy).not.toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result).toEqual({ count: 0, collectionExists: false });
    });

    it("should throw error from checkCollectionExists if the first check fails", async () => {
      const mockSupabase = createMockSupabase();
      const mockCheckError = new Error("Check failed");
      checkExistsSpy.mockRejectedValue(mockCheckError);
      await expect(collectionsService.renameCollection(mockSupabase, userId, currentName, newName)).rejects.toThrow(
        mockCheckError
      );

      expect(checkExistsSpy).toHaveBeenCalledWith(mockSupabase, userId, currentName);
      expect(getCountSpy).not.toHaveBeenCalled();
    });

    it("should throw error from checkCollectionExists if the second check fails", async () => {
      const mockSupabase = createMockSupabase();
      const mockCheckError = new Error("Second check failed");
      checkExistsSpy.mockResolvedValueOnce(true).mockRejectedValueOnce(mockCheckError);
      await expect(collectionsService.renameCollection(mockSupabase, userId, currentName, newName)).rejects.toThrow(
        mockCheckError
      );

      expect(checkExistsSpy).toHaveBeenNthCalledWith(1, mockSupabase, userId, currentName);
      expect(checkExistsSpy).toHaveBeenNthCalledWith(2, mockSupabase, userId, newName);
      expect(getCountSpy).not.toHaveBeenCalled();
    });

    it("should throw the original Supabase error if the update operation fails", async () => {
      const mockSupabase = createMockSupabase();
      const mockUpdateError: PostgrestError = {
        name: "UpdateFail",
        message: "Update failed",
        details: "d",
        hint: "h",
        code: "KLMNO",
      };
      checkExistsSpy
        .mockResolvedValueOnce(true) // checkCollectionExists for currentName
        .mockResolvedValueOnce(false); // checkCollectionExists for newName

      // Set the expected final result (rejection) for the await call to renameCollection
      mockSupabase.mockRejectNext(mockUpdateError);

      await expect(collectionsService.renameCollection(mockSupabase, userId, currentName, newName)).rejects.toEqual(
        mockUpdateError
      );

      expect(checkExistsSpy).toHaveBeenCalledTimes(2);
      expect(mockSupabase.update).toHaveBeenCalled(); // Ensure update was called
    });
  });

  describe("deleteCollection", () => {
    // Use imported SpyInstance type
    let checkExistsSpy: SpyInstance<[MockSupabaseClient, string, string], Promise<boolean>>;
    let getCountSpy: SpyInstance<[MockSupabaseClient, string, string], Promise<number>>;
    const userId = "user-delete-123";
    const collectionName = "ToDelete";

    beforeEach(() => {
      checkExistsSpy = vi.spyOn(collectionsService, "checkCollectionExists");
      getCountSpy = vi.spyOn(collectionsService, "getFlashcardsInCollectionCount");
    });

    it("should delete collection successfully if it exists", async () => {
      const mockSupabase = createMockSupabase();
      const countBeforeDelete = 5;
      checkExistsSpy.mockResolvedValue(true);
      getCountSpy.mockResolvedValue(countBeforeDelete);

      // Set the expected final result for the await call to deleteCollection (the delete operation)
      mockSupabase.mockResolveNext({ data: null, error: null, count: null });

      const result = await collectionsService.deleteCollection(mockSupabase, userId, collectionName);

      expect(checkExistsSpy).toHaveBeenCalledWith(mockSupabase, userId, collectionName);
      expect(getCountSpy).toHaveBeenCalledWith(mockSupabase, userId, collectionName);
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.delete).toHaveBeenCalledTimes(1); // Called once
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("collection", collectionName);
      // Ensure select wasn't called directly by deleteCollection's main flow
      expect(mockSupabase.select).not.toHaveBeenCalled();
      expect(result).toEqual({ count: countBeforeDelete, collectionExists: true });
    });

    it("should return count 0 and collectionExists false if collection does not exist", async () => {
      const mockSupabase = createMockSupabase();
      checkExistsSpy.mockResolvedValue(false);
      const result = await collectionsService.deleteCollection(mockSupabase, userId, "NonExistent");

      expect(checkExistsSpy).toHaveBeenCalledWith(mockSupabase, userId, "NonExistent");
      expect(getCountSpy).not.toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result).toEqual({ count: 0, collectionExists: false });
    });

    it("should throw error from checkCollectionExists if the check fails", async () => {
      const mockSupabase = createMockSupabase();
      const mockCheckError = new Error("Check failed on delete");
      checkExistsSpy.mockRejectedValue(mockCheckError);
      await expect(collectionsService.deleteCollection(mockSupabase, userId, collectionName)).rejects.toThrow(
        mockCheckError
      );

      expect(checkExistsSpy).toHaveBeenCalledWith(mockSupabase, userId, collectionName);
      expect(getCountSpy).not.toHaveBeenCalled();
    });

    it("should throw error from getFlashcardsInCollectionCount if the count fails", async () => {
      const mockSupabase = createMockSupabase();
      const mockCountError = new Error("Count failed on delete");
      checkExistsSpy.mockResolvedValue(true);
      getCountSpy.mockRejectedValue(mockCountError);
      await expect(collectionsService.deleteCollection(mockSupabase, userId, collectionName)).rejects.toThrow(
        mockCountError
      );
      checkExistsSpy.mockResolvedValue(true); // Check succeeds
      getCountSpy.mockRejectedValue(mockCountError); // Count fails

      expect(checkExistsSpy).toHaveBeenCalled();
      expect(getCountSpy).toHaveBeenCalledWith(mockSupabase, userId, collectionName);
      expect(mockSupabase.from).not.toHaveBeenCalled(); // Delete not reached
    });

    it("should throw the original Supabase error if the delete operation fails", async () => {
      const mockSupabase = createMockSupabase();
      const countBeforeDelete = 5;
      const mockDeleteError: PostgrestError = {
        name: "DeleteFail",
        message: "Delete failed",
        details: "d",
        hint: "h",
        code: "PQRST",
      };
      checkExistsSpy.mockResolvedValue(true);
      getCountSpy.mockResolvedValue(countBeforeDelete);

      // Set the expected final result (rejection) for the await call to deleteCollection
      mockSupabase.mockRejectNext(mockDeleteError);

      await expect(collectionsService.deleteCollection(mockSupabase, userId, collectionName)).rejects.toEqual(
        mockDeleteError
      );

      expect(checkExistsSpy).toHaveBeenCalled();
      expect(getCountSpy).toHaveBeenCalled();
      expect(mockSupabase.delete).toHaveBeenCalled(); // Ensure delete was called
    });
  });
});
