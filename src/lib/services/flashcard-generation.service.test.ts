/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { FlashcardGenerationService } from "./flashcard-generation.service";
import type { FlashcardCandidateDto, GenerationDTO } from "@/types";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { getOpenRouterClient } from "./openrouter";
import { OpenRouterService } from "./openrouter.service";
import * as crypto from "crypto";

// --- Global Mock Variables --- //
// Use 'let' and define outside factory/beforeEach
let mockChat: Mock;
let mockCreateJsonSchema: Mock;
let mockSchemaBuilder: { addProperty: Mock; build: Mock };

// --- Mock Dependencies --- //
vi.mock("@/db/supabase.client");
vi.mock("./openrouter");
// Mock the service module using a factory
vi.mock("./openrouter.service", () => {
  // Define the mock class
  const MockOpenRouterService = vi.fn().mockImplementation(() => {
    // Constructor logic if needed, otherwise methods assigned to prototype
  });

  // Assign EXTERNAL mock functions to the prototype
  // These will be initialized in beforeEach
  MockOpenRouterService.prototype.createJsonSchema = (...args: unknown[]) => mockCreateJsonSchema(...args);
  MockOpenRouterService.prototype.chat = (...args: unknown[]) => mockChat(...args);

  // Expose the mock class
  return {
    OpenRouterService: MockOpenRouterService,
  };
});

vi.mock("crypto", () => ({
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue("mocked-hash-123"),
  }),
}));

// --- Mock Supabase Helper (Copied from flashcard.service.test.ts) --- //
// Define the return type of the factory function based on the actual service usage
type SupabaseClientType = ReturnType<typeof createSupabaseServerInstance>;

// Type for the mocked Supabase client instance
interface MockSupabaseClient extends SupabaseClientType {
  from: Mock<[string], MockSupabaseChain>;
  // Add queue control methods directly to the client mock instance type
  mockQueryResult: (result: {
    data?: unknown;
    error?: PostgrestError | null;
    count?: number | null;
  }) => MockSupabaseChain;
  clearMockQueue: () => void;
  // Add auth type explicitly if needed by linter
  auth: {
    getUser: Mock<unknown[], Promise<{ data: { user: { id: string } | null }; error: Error | null }>>;
  };
}

// Type for the chainable query builder methods
interface MockSupabaseChain {
  select: Mock<unknown[], MockSupabaseChain>;
  insert: Mock<[object | object[]], MockSupabaseChain>;
  update: Mock<[object], MockSupabaseChain>;
  delete: Mock<[], MockSupabaseChain>;
  eq: Mock<[string, unknown], MockSupabaseChain>;
  // Add other methods if needed by flashcard-generation.service
  single: Mock<[], MockSupabaseChain>;
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
  // Keep the mock setup methods
  mockQueryResult: (result: {
    data?: unknown;
    error?: PostgrestError | null;
    count?: number | null;
  }) => MockSupabaseChain;
  clearMockQueue: () => void;
}

// Helper function to create a mock Supabase client
const createMockSupabase = (): MockSupabaseClient => {
  // Store separate chains keyed by table name
  const chains: Record<string, MockSupabaseChain> = {};

  // Factory function to create a new chain instance
  const createChain = (): MockSupabaseChain => {
    let resultsQueue: { data?: unknown; error?: PostgrestError | null; count?: number | null }[] = [];
    const chainInstance: Partial<MockSupabaseChain> = {}; // Use Partial initially

    const mockQueryResult = (result: { data?: unknown; error?: PostgrestError | null; count?: number | null }) => {
      resultsQueue.push(result);
      return chainInstance as MockSupabaseChain; // Return the fully formed chain
    };
    const clearMockQueue = () => {
      resultsQueue = [];
    };

    // Assign methods to chainInstance
    Object.assign(chainInstance, {
      select: vi.fn(() => chainInstance as MockSupabaseChain),
      insert: vi.fn(() => chainInstance as MockSupabaseChain),
      update: vi.fn(() => chainInstance as MockSupabaseChain),
      delete: vi.fn(() => chainInstance as MockSupabaseChain),
      eq: vi.fn(() => chainInstance as MockSupabaseChain),
      single: vi.fn(() => chainInstance as MockSupabaseChain),
      then: vi.fn((onfulfilled) => {
        const result = resultsQueue.shift() ?? { data: null, error: null, count: 0 };
        return Promise.resolve(onfulfilled ? onfulfilled(result) : result);
      }),
      mockQueryResult,
      clearMockQueue,
    });

    return chainInstance as MockSupabaseChain;
  };

  const mockGetUser = vi.fn<unknown[], Promise<{ data: { user: { id: string } | null }; error: Error | null }>>();

  const client = {
    from: vi.fn().mockImplementation((tableName: string) => {
      // Create a new chain for the table if it doesn't exist
      if (!chains[tableName]) {
        chains[tableName] = createChain();
      }
      return chains[tableName];
    }),
    auth: {
      getUser: mockGetUser,
    },
    // Remove ambiguous client-level methods
    // mockQueryResult: (result: any) => {
    //   console.warn("mockQueryResult on client level is ambiguous with multiple chains");
    // },
    // clearMockQueue: () => {
    //   Object.values(chains).forEach((chain) => chain.clearMockQueue());
    // },
    // Add helper to get a specific chain for assertions
    getChain: (tableName: string): MockSupabaseChain | undefined => chains[tableName],
  } as unknown as MockSupabaseClient;

  return client;
};

// --- Test Suite Setup --- //
let mockSupabaseInstance: MockSupabaseClient;
let mockGenerationsChain: MockSupabaseChain;
let mockErrorLogsChain: MockSupabaseChain;
let flashcardGenerationService: FlashcardGenerationService;
const testUserId = "test-user-gen-123";

describe("Flashcard Generation Service", () => {
  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Re-initialize global mock functions
    mockChat = vi.fn();
    mockCreateJsonSchema = vi.fn(() => mockSchemaBuilder);
    mockSchemaBuilder = {
      addProperty: vi.fn().mockReturnThis(),
      build: vi.fn(() => ({ schemaType: "mocked-schema" })),
    };

    // Create mock Supabase instance
    mockSupabaseInstance = createMockSupabase();
    // Assign specific chain mocks using the new getChain method
    mockGenerationsChain = mockSupabaseInstance.getChain("generations") as unknown as MockSupabaseChain;
    mockErrorLogsChain = mockSupabaseInstance.getChain("generation_error_logs") as unknown as MockSupabaseChain;

    // Ensure chains are created if not accessed yet
    if (!mockGenerationsChain)
      mockGenerationsChain = mockSupabaseInstance.from("generations") as unknown as MockSupabaseChain;
    if (!mockErrorLogsChain)
      mockErrorLogsChain = mockSupabaseInstance.from("generation_error_logs") as unknown as MockSupabaseChain;

    // *** Reset 'from' mock AFTER setup to ignore setup calls in tests ***
    vi.mocked(mockSupabaseInstance.from).mockClear();

    // Mock crypto
    vi.mocked(crypto.createHash).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => "mocked-hash-123"),
    } as unknown);

    // Mock Supabase user
    vi.mocked(mockSupabaseInstance.auth.getUser).mockResolvedValue({ data: { user: { id: testUserId } }, error: null });

    // Create and configure the OpenRouterService mock instance
    const openRouterInstance = new OpenRouterService({ apiKey: "test-key" }); // Provide apiKey
    // Assign mock functions to the instance
    openRouterInstance.createJsonSchema = mockCreateJsonSchema;
    openRouterInstance.chat = mockChat;

    // Setup mock implementations
    vi.mocked(createSupabaseServerInstance).mockReturnValue(mockSupabaseInstance);
    // Ensure getOpenRouterClient returns our specific mock instance
    vi.mocked(getOpenRouterClient).mockReturnValue(openRouterInstance);

    // Instantiate the service
    flashcardGenerationService = new FlashcardGenerationService(mockSupabaseInstance);
  });

  it("should be defined", () => {
    expect(flashcardGenerationService).toBeDefined();
  });

  // --- Test cases for generateFlashcards --- //
  describe("generateFlashcards", () => {
    const inputText = "This is the source text for flashcards.";
    const expectedHash = "mocked-hash-123"; // From crypto mock
    const mockGenerationRecord: GenerationDTO = {
      generation_id: 101,
      user_id: testUserId,
      source_text_hash: expectedHash,
      source_text_length: inputText.length,
      model: "openrouter.ai",
      generated_count: 0, // Initial values
      generation_duration: 0,
      created_at: new Date().toISOString(),
      failed: false,
    };
    const mockAiResponse = {
      choices: [
        {
          message: {
            // Use longer strings to pass Zod validation (min: 3)
            content: JSON.stringify({
              flashcards: [
                { front: "Question 1", back: "Answer 1" },
                { front: "Question 2", back: "Answer 2" },
              ],
            }),
          },
        },
      ],
    };
    const expectedCandidates: FlashcardCandidateDto[] = [
      {
        flashcard_id: 0,
        front: "Question 1",
        back: "Answer 1",
        source: "ai-full",
        generation_id: mockGenerationRecord.generation_id,
        user_id: testUserId,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        collection: "default",
        status: "candidate",
      },
      {
        flashcard_id: 0,
        front: "Question 2",
        back: "Answer 2",
        source: "ai-full",
        generation_id: mockGenerationRecord.generation_id,
        user_id: testUserId,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        collection: "default",
        status: "candidate",
      },
    ];

    it("should successfully generate flashcards on happy path", async () => {
      // Arrange
      // 1. Mock generations insert success
      mockGenerationsChain.mockQueryResult({ data: mockGenerationRecord });
      // 2. Mock generations update success
      mockGenerationsChain.mockQueryResult({ data: null, error: null });

      // 3. Mock OpenRouter call
      mockChat.mockResolvedValue(mockAiResponse);

      // Act
      const result = await flashcardGenerationService.generateFlashcards(inputText);

      // Assert
      // 1. Check crypto hash call
      expect(crypto.createHash).toHaveBeenCalledWith("md5");
      const cryptoMock = vi.mocked(crypto.createHash("").update(""));
      expect(cryptoMock.update).toHaveBeenCalledWith(inputText);
      expect(cryptoMock.digest).toHaveBeenCalledWith("hex");

      // 2. Check generations insert call
      expect(mockGenerationsChain.insert).toHaveBeenCalledWith({
        user_id: testUserId,
        source_text_hash: expectedHash,
        source_text_length: inputText.length,
        model: "openrouter.ai",
        generated_count: 0,
        generation_duration: 0,
      });
      expect(mockGenerationsChain.select).toHaveBeenCalled();
      expect(mockGenerationsChain.single).toHaveBeenCalledTimes(1); // Only once for insert

      // 4. Check generations update call
      expect(mockGenerationsChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          generated_count: expectedCandidates.length,
          // generation_duration might vary, check if it's a number > 0
          generation_duration: expect.any(Number),
        })
      );
      expect(mockGenerationsChain.eq).toHaveBeenCalledWith("generation_id", mockGenerationRecord.generation_id);

      // 5. Check the final result object
      expect(result).toEqual({
        candidates: expectedCandidates,
        generation_id: mockGenerationRecord.generation_id.toString(),
        generated_count: expectedCandidates.length,
      });

      // 6. Ensure error log was NOT called
      expect(mockErrorLogsChain.insert).not.toHaveBeenCalled();
    });

    // --- Error Handling Tests --- //
    it("should log error and re-throw if creating generation record fails", async () => {
      // Arrange
      const dbError: PostgrestError = { name: "DBError", message: "Insert failed", details: "", hint: "", code: "DB1" };
      // 1. Mock generations insert failure
      mockGenerationsChain.mockQueryResult({ data: null, error: dbError });
      // Note: No need to mock error log insert here, as the function should throw before logging

      // Act & Assert
      await expect(flashcardGenerationService.generateFlashcards(inputText)).rejects.toThrow(
        `Failed to create generation record: ${dbError.message}`
      );
    });

    it("should log error and throw if AI service call fails", async () => {
      // Arrange
      const aiError = new Error("AI service unavailable");
      // 1. Mock Supabase generations insert success
      mockGenerationsChain.mockQueryResult({ data: mockGenerationRecord });
      // 2. Mock error log insert success (as fallback mechanism logs the error)
      mockErrorLogsChain.mockQueryResult({ data: null, error: null });

      // 3. Mock OpenRouter failure
      mockChat.mockRejectedValue(aiError);

      // Act & Assert: Call the service method and expect it to throw
      await expect(flashcardGenerationService.generateFlashcards(inputText)).rejects.toThrow(
        `Flashcard generation failed: ${aiError.message}`
      );

      // Assert: Ensure the error log was inserted into the DB
      expect(mockErrorLogsChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          error_message: expect.stringContaining(aiError.message),
          source_text_hash: expectedHash,
          model: "openrouter.ai",
        })
      );
    });

    it("should log error and re-throw if updating generation record fails", async () => {
      // Arrange
      const dbUpdateError: PostgrestError = {
        name: "DBError",
        message: "Update failed",
        details: "",
        hint: "",
        code: "DB2",
      };
      // 1. Mock Supabase generations insert success
      mockGenerationsChain.mockQueryResult({ data: mockGenerationRecord });
      // 2. Mock OpenRouter success
      mockChat.mockResolvedValue(mockAiResponse);
      // 3. Mock Supabase generations update failure
      mockGenerationsChain.mockQueryResult({ data: null, error: dbUpdateError });
      // 4. Mock error log insert success
      mockErrorLogsChain.mockQueryResult({ data: null, error: null });

      // Act & Assert: Expect rejection as error is outside callAIService's catch
      await expect(flashcardGenerationService.generateFlashcards(inputText)).rejects.toThrow(
        `Failed to update generation record: ${dbUpdateError.message}`
      );

      // Check that the outer error logging was called
      expect(mockErrorLogsChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          error_code: "UNKNOWN_ERROR", // Code from the wrapper Error
          error_message: `Failed to update generation record: ${dbUpdateError.message}`,
          source_text_hash: expectedHash,
        })
      );
      // DO NOT check mockChat wasn't called - it should have been called successfully here.
    });

    it("should throw error if user ID cannot be determined", async () => {
      // Arrange
      // Mock getUser to return no user
      vi.mocked(mockSupabaseInstance.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });
      // Re-instantiate service to ensure it tries to fetch user ID again without constructor override
      flashcardGenerationService = new FlashcardGenerationService(mockSupabaseInstance);

      // Act & Assert
      await expect(flashcardGenerationService.generateFlashcards(inputText)).rejects.toThrow("User not authenticated.");
      // Ensure NO DB interaction happened because error thrown before try block
      expect(mockSupabaseInstance.from).not.toHaveBeenCalled();
      expect(mockChat).not.toHaveBeenCalled();
    });

    it("should log error and throw if AI response parsing fails (Zod validation)", async () => {
      // Arrange
      const invalidAiResponse = {
        choices: [
          {
            message: {
              /* content: missing */
            },
          },
        ],
      };
      // 1. Mock Supabase generations insert success
      mockGenerationsChain.mockQueryResult({ data: mockGenerationRecord });
      // 2. Mock error log insert success
      mockErrorLogsChain.mockQueryResult({ data: null, error: null });
      // 3. Mock OpenRouter success with invalid response
      mockChat.mockResolvedValue(invalidAiResponse);

      // Act & Assert: Call the service method and expect it to throw
      await expect(flashcardGenerationService.generateFlashcards(inputText)).rejects.toThrow(
        "Flashcard generation failed: Empty content returned from AI service"
      );

      // Assert: Ensure the error log was inserted into the DB
      expect(mockErrorLogsChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          error_message: expect.stringContaining("Empty content returned"),
          source_text_hash: expectedHash,
          model: "openrouter.ai",
        })
      );
    });
  });
});
