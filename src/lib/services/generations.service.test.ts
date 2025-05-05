import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { getGenerationsForUser, getGenerationById } from "./generations.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationDTO } from "../../types";
import type { PostgrestResponse, PostgrestError } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

// --- Mock Types --- //
// Mock for standard query builder chain (select, eq, order, range)
interface MockDataQueryBuilder {
  select: Mock<(columns: string, options?: Record<string, unknown>) => MockDataQueryBuilder>;
  eq: Mock<(column: string, value: unknown) => MockDataQueryBuilder>;
  order: Mock<(column: string, options: { ascending: boolean }) => MockDataQueryBuilder>;
  range: Mock<(from: number, to: number) => Promise<PostgrestResponse<GenerationDTO>>>;
  single: Mock<() => Promise<PostgrestResponse<GenerationDTO>>>;
}

// Mock for the count query's 'eq' method (returns promise)
type MockCountQueryEq = Mock<(column: string, value: string) => Promise<PostgrestResponse<GenerationDTO>>>;

// --- Mocks (initialized in beforeEach) --- //
let mockSupabase: SupabaseClient<Database>;
let mockDataQueryBuilder: MockDataQueryBuilder;
let mockCountEq: MockCountQueryEq;

// Helper to create a mock PostgrestError
const createMockPostgrestError = (message: string, code: string): PostgrestError => ({
  message,
  details: "mock details",
  hint: "mock hint",
  code,
  name: "PostgrestError",
});

describe("Generations Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // --- Mock Data Query Path (includes single()) ---
    mockDataQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>),
    };

    // --- Mock Count Query Path for getGenerationsForUser ---
    mockCountEq = vi.fn().mockResolvedValue({
      data: null,
      error: null,
      count: 0,
      status: 200,
      statusText: "OK",
    } as unknown as PostgrestResponse<GenerationDTO>);
    const mockCountSelectFn = vi.fn().mockReturnValue({ eq: mockCountEq });

    // --- Mock Supabase Client ---
    mockSupabase = {
      from: vi.fn().mockImplementation((tableName: string) => {
        if (!tableName) {
          throw new Error("Table name must be provided");
        }

        return {
          select: vi.fn((columns: string, options?: { count?: "exact"; head?: boolean }) => {
            if (options?.count === "exact" && options?.head === true) {
              // COUNT PATH (getGenerationsForUser)
              return mockCountSelectFn(columns, options);
            } else {
              // DATA PATH (for both functions)
              return mockDataQueryBuilder;
            }
          }),
        };
      }),
    } as unknown as SupabaseClient<Database>;
  });

  // --- Tests for getGenerationsForUser --- //
  describe("getGenerationsForUser", () => {
    const userId = "user-123";
    const mockGenerations: GenerationDTO[] = [
      {
        generation_id: 1,
        user_id: userId,
        created_at: "2023-01-01T10:00:00Z",
        generated_count: 10,
        model: "gpt-1",
        source_text_hash: "h1",
        source_text_length: 100,
        accepted_edited_count: 1,
        accepted_unedited_count: 8,
        generation_duration: 5000,
      },
      {
        generation_id: 2,
        user_id: userId,
        created_at: "2023-01-02T11:00:00Z",
        generated_count: 5,
        model: "gpt-2",
        source_text_hash: "h2",
        source_text_length: 50,
        accepted_edited_count: 0,
        accepted_unedited_count: 5,
        generation_duration: 3000,
      },
    ];

    it("should fetch generations for a user with pagination", async () => {
      const page = 2;
      const limit = 5;
      const expectedCount = 12;
      const expectedOffset = 5;
      const expectedData = mockGenerations.slice(0, 1);

      // Arrange
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: null,
        count: expectedCount,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>);
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: expectedData,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>);

      // Act
      const result = await getGenerationsForUser(mockSupabase, userId, page, limit);

      // Assert
      expect(result.data).toEqual(expectedData);
      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
      expect(result.total).toBe(expectedCount);

      // Verify calls (similar to generationErrors)
      expect(mockSupabase.from).toHaveBeenCalledWith("generations");
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      expect(mockCountEq).toHaveBeenCalledWith("user_id", userId);
      expect(mockDataQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockDataQueryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockDataQueryBuilder.range).toHaveBeenCalledWith(expectedOffset, expectedOffset + limit - 1);
    });

    it("should return empty data and total 0 if no generations found", async () => {
      // Arrange
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 0,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>);
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>);

      // Act
      const result = await getGenerationsForUser(mockSupabase, userId, 1, 10);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should throw an error if fetching data fails", async () => {
      const dbError = createMockPostgrestError("Data fetch failed", "DB500");
      // Arrange
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 10,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>); // Count succeeds
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: null,
        error: dbError,
        count: null,
        status: 500,
        statusText: "Err",
      } as unknown as PostgrestResponse<GenerationDTO>); // Range fails

      // Act & Assert
      await expect(getGenerationsForUser(mockSupabase, userId, 1, 10)).rejects.toThrow("Failed to fetch generations");
    });

    it("should return total 0 if count query fails", async () => {
      const dbError = createMockPostgrestError("Count fetch failed", "DB501");
      // Arrange
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: dbError,
        count: null,
        status: 500,
        statusText: "Err",
      } as unknown as PostgrestResponse<GenerationDTO>); // Count fails
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: mockGenerations,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>); // Range succeeds

      // Act
      const result = await getGenerationsForUser(mockSupabase, userId, 1, 10);

      // Assert
      expect(result.total).toBe(0);
      expect(result.data).toEqual(mockGenerations);
    });
  });

  // --- Tests for getGenerationById --- //
  describe("getGenerationById", () => {
    const userId = "user-456";
    const generationId = 99;
    const mockGeneration: GenerationDTO = {
      generation_id: generationId,
      user_id: userId,
      created_at: "2023-02-01T12:00:00Z",
      generated_count: 20,
      model: "gpt-3",
      source_text_hash: "h3",
      source_text_length: 200,
      accepted_edited_count: 5,
      accepted_unedited_count: 10,
      generation_duration: 8000,
    };

    it("should return generation if found for the user", async () => {
      // Arrange
      mockDataQueryBuilder.single.mockResolvedValueOnce({
        data: mockGeneration,
        error: null,
        count: 1,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>);

      // Act
      const result = await getGenerationById(mockSupabase, generationId, userId);

      // Assert
      expect(result.generation).toEqual(mockGeneration);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith("generations");
      expect(mockDataQueryBuilder.eq).toHaveBeenCalledWith("generation_id", generationId);
      expect(mockDataQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockDataQueryBuilder.single).toHaveBeenCalledTimes(1);
    });

    it("should return null generation and error if Supabase returns error", async () => {
      const errorMessage = "Generation not found or access denied";
      const dbError = createMockPostgrestError(errorMessage, "PGRST116"); // Example error code
      // Arrange
      mockDataQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: dbError,
        count: 0,
        status: 406,
        statusText: "Not Acceptable",
      } as unknown as PostgrestResponse<GenerationDTO>);

      // Act
      const result = await getGenerationById(mockSupabase, generationId, userId);

      // Assert
      expect(result.generation).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe(errorMessage);
      expect(mockDataQueryBuilder.single).toHaveBeenCalledTimes(1);
    });

    it("should return null generation and error if .single() throws", async () => {
      const thrownError = new Error("Unexpected DB error");
      // Arrange
      mockDataQueryBuilder.single.mockRejectedValueOnce(thrownError);

      // Act
      const result = await getGenerationById(mockSupabase, generationId, userId);

      // Assert
      expect(result.generation).toBeNull();
      expect(result.error).toBe(thrownError);
      expect(mockDataQueryBuilder.single).toHaveBeenCalledTimes(1);
    });

    it("should return null generation if data is null without error (edge case)", async () => {
      // Arrange - Simulate Supabase returning success but null data
      mockDataQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 0,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationDTO>);

      // Act
      const result = await getGenerationById(mockSupabase, generationId, userId);

      // Assert
      expect(result.generation).toBeNull();
      expect(result.error).toBeNull();
      expect(mockDataQueryBuilder.single).toHaveBeenCalledTimes(1);
    });
  });
});
