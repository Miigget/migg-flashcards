import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { getGenerationErrorLogs } from "./generationErrors.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationErrorLogDTO, PaginatedResponse } from "../../types";
import type { PostgrestResponse, PostgrestError } from "@supabase/supabase-js";

// --- Mock Types --- //
// Mock for the data query builder chain
interface MockDataQueryBuilder {
  select: Mock<(columns: string, options?: { count: "exact"; head: true }) => MockDataQueryBuilder>;
  eq: Mock<(column: string, value: string) => MockDataQueryBuilder>;
  order: Mock<(column: string, options: { ascending: boolean }) => MockDataQueryBuilder>;
  range: Mock<(from: number, to: number) => Promise<PostgrestResponse<GenerationErrorLogDTO>>>;
}

// Mock for the count query's 'eq' method, which returns the final promise
type MockCountQueryEq = Mock<(column: string, value: string) => Promise<PostgrestResponse<GenerationErrorLogDTO>>>;

// Mock for the count query's 'select' method, returning an object with 'eq'
// Accept the broader options type that might be passed
type MockCountQuerySelect = Mock<
  (columns: string, options?: { count?: "exact"; head?: boolean }) => { eq: MockCountQueryEq }
>;

// --- Mocks (initialized in beforeEach) --- //
let mockSupabase: SupabaseClient;
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

describe("GenerationErrors Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // --- Mock Data Query Path ---
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
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>),
    };

    // --- Mock Count Query Path ---
    // 1. Mock the 'eq' method for the count query - THIS returns the promise
    mockCountEq = vi.fn().mockResolvedValue({
      data: null,
      error: null,
      count: 0,
      status: 200,
      statusText: "OK",
    } as unknown as PostgrestResponse<GenerationErrorLogDTO>);

    // 2. Mock the 'select' method for the count query - returns object containing the 'eq' mock
    const mockCountSelectFn: MockCountQuerySelect = vi.fn().mockReturnValue({ eq: mockCountEq });

    // --- Mock Supabase Client ---
    mockSupabase = {
      from: vi.fn().mockImplementation(() => {
        return {
          // This select mock differentiates between count and data paths
          select: vi.fn((columns: string, options?: { count?: "exact"; head?: boolean }) => {
            if (options?.count === "exact" && options?.head === true) {
              // COUNT PATH: Use the specific select mock that returns { eq: mockCountEq }
              return mockCountSelectFn(columns, options); // Call the mock to get the object { eq: ... }
            } else {
              // DATA PATH: Return the standard data query builder
              return mockDataQueryBuilder;
            }
          }),
        };
      }),
    } as unknown as SupabaseClient;
  });

  describe("getGenerationErrorLogs", () => {
    const userId = "test-user-id";
    const mockLogs: GenerationErrorLogDTO[] = [
      // ... mock data remains the same ...
      {
        generation_error_log_id: 1,
        user_id: userId,
        error_message: "Error 1",
        error_code: "E100",
        model: "model-a",
        source_text_hash: "hash1",
        source_text_length: 150,
        created_at: new Date().toISOString(),
      },
      {
        generation_error_log_id: 2,
        user_id: userId,
        error_message: "Error 2",
        error_code: "E200",
        model: "model-b",
        source_text_hash: "hash2",
        source_text_length: 250,
        created_at: new Date().toISOString(),
      },
    ];

    it("should fetch generation error logs for a user with default pagination", async () => {
      const expectedCount = 5;
      const expectedData = mockLogs.slice(0, 2);
      const expectedPage = 1;
      const expectedLimit = 10;

      // Arrange: Mock the promise returned by 'eq' in the count path
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: null,
        count: expectedCount,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);
      // Arrange: Mock the promise returned by 'range' in the data path
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: expectedData,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);

      // Act
      const result: PaginatedResponse<GenerationErrorLogDTO> = await getGenerationErrorLogs(mockSupabase, userId);

      // Assert
      expect(result.data).toEqual(expectedData);
      expect(result.page).toBe(expectedPage);
      expect(result.limit).toBe(expectedLimit);
      expect(result.total).toBe(expectedCount); // Should now pass

      // Verify calls
      expect(mockSupabase.from).toHaveBeenCalledWith("generation_error_logs");
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);

      const fromMock = mockSupabase.from as Mock;

      // Verify first call (count path)
      const selectMockInstanceCount = fromMock.mock.results[0].value.select as Mock;
      expect(selectMockInstanceCount).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(selectMockInstanceCount).toHaveBeenCalledTimes(1);
      const countPathEqStepMockResult = selectMockInstanceCount.mock.results[0].value; // Object returned by select() on count path
      expect(countPathEqStepMockResult.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockCountEq).toHaveBeenCalledTimes(1); // Ensure count path final step was executed

      // Verify second call (data path)
      const selectMockInstanceData = fromMock.mock.results[1].value.select as Mock;
      expect(selectMockInstanceData).toHaveBeenCalledWith("*");
      expect(selectMockInstanceData).toHaveBeenCalledTimes(1);
      const dataPathBuilderMockResult = selectMockInstanceData.mock.results[0].value; // Object returned by select() on data path
      expect(dataPathBuilderMockResult.eq).toHaveBeenCalledWith("user_id", userId);
      expect(dataPathBuilderMockResult.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(dataPathBuilderMockResult.range).toHaveBeenCalledWith(0, expectedLimit - 1);
      expect(mockDataQueryBuilder.range).toHaveBeenCalledTimes(1); // Ensure data path final step was executed
    });

    it("should fetch generation error logs with specified pagination", async () => {
      const expectedCount = 15;
      const expectedData = mockLogs.slice(0, 1);
      const page = 2;
      const limit = 5;
      const offset = (page - 1) * limit; // 5

      // Arrange
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: null,
        count: expectedCount,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: expectedData,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);

      // Act
      const result = await getGenerationErrorLogs(mockSupabase, userId, page, limit);

      // Assert
      expect(result.data).toEqual(expectedData);
      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
      expect(result.total).toBe(expectedCount); // Should now pass

      // Verify range call on data query builder
      expect(mockDataQueryBuilder.range).toHaveBeenCalledWith(offset, offset + limit - 1);
      expect(mockCountEq).toHaveBeenCalledTimes(1);
      expect(mockDataQueryBuilder.range).toHaveBeenCalledTimes(1);
    });

    it("should return empty data array and total 0 if no logs found", async () => {
      // Arrange
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 0,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);

      // Act
      const result = await getGenerationErrorLogs(mockSupabase, userId);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockCountEq).toHaveBeenCalledTimes(1);
      expect(mockDataQueryBuilder.range).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if fetching data fails", async () => {
      const errorMessage = "Database error";
      const dbError = createMockPostgrestError(errorMessage, "DB500");

      // Arrange: Count succeeds, data fetch fails
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 5,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: null,
        error: dbError,
        count: null,
        status: 500,
        statusText: "Internal Server Error",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>); // Error response

      // Act & Assert
      await expect(getGenerationErrorLogs(mockSupabase, userId)).rejects.toThrow(
        `Failed to fetch generation error logs: ${errorMessage}`
      );
      // Verify count 'eq' was called (and thus the count query was attempted)
      expect(mockCountEq).toHaveBeenCalledTimes(1); // Should now pass
      // Verify data 'range' was called
      expect(mockDataQueryBuilder.range).toHaveBeenCalledTimes(1);
    });

    it("should return total 0 if counting fails but not throw", async () => {
      // Arrange: Count query fails, data query succeeds
      const countErrorMessage = "Count failed";
      const countError = createMockPostgrestError(countErrorMessage, "DB501");
      // Mock count 'eq' to return PostgrestResponseFailure
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: countError,
        count: null,
        status: 500,
        statusText: "Internal Server Error",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);
      // Mock data range to succeed
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: mockLogs,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);

      // Act
      const result = await getGenerationErrorLogs(mockSupabase, userId);

      // Assert: Service handles count error by setting total to 0
      expect(result.total).toBe(0);
      expect(result.data).toEqual(mockLogs);
      expect((mockSupabase.from as Mock).mock.calls.length).toBe(2);
      // Verify count 'eq' was called (and thus the count query was attempted)
      expect(mockCountEq).toHaveBeenCalledTimes(1); // Should now pass
      // Verify data 'range' was called
      expect(mockDataQueryBuilder.range).toHaveBeenCalledTimes(1);
    });

    it("should handle null data gracefully", async () => {
      // Arrange: Count succeeds, data is null
      mockCountEq.mockResolvedValueOnce({
        data: null,
        error: null,
        count: 5,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);
      mockDataQueryBuilder.range.mockResolvedValueOnce({
        data: null,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      } as unknown as PostgrestResponse<GenerationErrorLogDTO>);

      // Act
      const result = await getGenerationErrorLogs(mockSupabase, userId);

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(5); // Should now pass
      expect(mockCountEq).toHaveBeenCalledTimes(1);
      expect(mockDataQueryBuilder.range).toHaveBeenCalledTimes(1);
    });
  });
});
