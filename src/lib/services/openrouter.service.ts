// Import all types from the dedicated types file
import {
  AuthenticationError,
  ContentFilterError,
  InvalidRequestError,
  ModelUnavailableError,
  NetworkError,
  OpenRouterError,
  QuotaExceededError,
  RateLimitError,
  TimeoutError,
} from "./openrouter.types";

import type {
  ChatOptions,
  ChatResponse,
  HealthStatus,
  Message,
  Model,
  ModelParameters,
  RequestObject,
  ResponseFormat,
} from "./openrouter.types";

// Main service class
export class OpenRouterService {
  private readonly API_BASE_URL = "https://openrouter.ai/api/v1";
  private readonly apiKey: string;
  private defaultModel: string;
  private defaultSystemMessage: string;
  private defaultParameters: ModelParameters;
  private readonly timeoutMs: number;
  private readonly headers: Record<string, string>;
  private requestCount = 0;

  constructor({
    apiKey,
    defaultModel = "openai/gpt-4o-mini",
    defaultSystemMessage = "",
    defaultParameters = {
      temperature: 0.7,
      max_tokens: 1000,
    },
    timeoutMs = 60000,
    headers = {},
  }: {
    apiKey: string;
    defaultModel?: string;
    defaultSystemMessage?: string;
    defaultParameters?: ModelParameters;
    timeoutMs?: number;
    headers?: Record<string, string>;
  }) {
    if (!apiKey) throw new AuthenticationError("API key is required");

    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.defaultSystemMessage = defaultSystemMessage;
    this.defaultParameters = defaultParameters;
    this.timeoutMs = timeoutMs;
    this.headers = headers;
  }

  // Public methods
  async chat(options: ChatOptions): Promise<ChatResponse> {
    try {
      // Validate input
      if (!options.message && !options.messages) {
        throw new InvalidRequestError("Either message or messages must be provided");
      }

      // Build request
      const request = this.buildRequest(options);

      // Send request with retry capability
      const rawResponse = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://yourapp.com", // Default, will be overridden if provided
            "X-Title": "YourAppName", // Default, will be overridden if provided
            ...this.headers,
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          this.handleErrorResponse(response.status, errorData);
        }

        return response.json();
      });

      // Parse and return response
      return this.parseResponse(rawResponse);
    } catch (error: unknown) {
      // Handle errors
      if (error instanceof OpenRouterError) throw error;

      const err = error as Error;

      if (err.name === "AbortError") {
        throw new TimeoutError("Request timed out");
      }

      throw new NetworkError(`Unexpected error: ${err.message}`, error);
    }
  }

  async listModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://yourapp.com", // Default, will be overridden if provided
          "X-Title": "YourAppName", // Default, will be overridden if provided
          ...this.headers,
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.handleErrorResponse(response.status, errorData);
      }

      const data = await response.json();

      // Map API response to our Model interface
      if (Array.isArray(data.data)) {
        return data.data.map((model: Record<string, unknown>) => ({
          id: model.id as string,
          name: model.name as string,
          description: model.description as string | undefined,
          context_length: model.context_length as number,
          pricing: {
            prompt: ((model.pricing as Record<string, unknown>)?.input as number) || 0,
            completion: ((model.pricing as Record<string, unknown>)?.output as number) || 0,
          },
        }));
      }

      return [];
    } catch (error: unknown) {
      if (error instanceof OpenRouterError) throw error;

      const err = error as Error;

      if (err.name === "AbortError") {
        throw new TimeoutError("Request timed out");
      }

      throw new NetworkError(`Unexpected error: ${err.message}`);
    }
  }

  setDefaultParameters(parameters: ModelParameters): void {
    this.defaultParameters = { ...this.defaultParameters, ...parameters };
  }

  setDefaultModel(modelName: string): void {
    this.defaultModel = modelName;
  }

  setDefaultSystemMessage(message: string): void {
    this.defaultSystemMessage = message;
  }

  createJsonSchema(name: string): JsonSchemaBuilder {
    return new JsonSchemaBuilder(name);
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      // Try to fetch available models as a quick health check
      const models = await this.listModels();

      return {
        status: "healthy",
        availableModels: models.map((model) => model.id),
      };
    } catch (error: unknown) {
      // If we get authentication errors, the service might be fine but credentials are wrong
      if (error instanceof AuthenticationError) {
        return {
          status: "degraded",
          availableModels: [],
          message: "Authentication issue: Check API key",
        };
      }

      // If rate limited, service is up but we're restricted
      if (error instanceof RateLimitError) {
        return {
          status: "degraded",
          availableModels: [],
          message: "Rate limited: Try again later",
        };
      }

      // For other errors, report service as down
      const err = error as Error;
      return {
        status: "down",
        availableModels: [],
        message: err.message,
      };
    }
  }

  // Private methods
  private buildRequest(options: ChatOptions): RequestObject {
    const messages: Message[] = [];

    // Add system message if provided
    const systemMessage = options.systemMessage || this.defaultSystemMessage;
    if (systemMessage) {
      messages.push({
        role: "system",
        content: systemMessage,
      });
    }

    // Add message history or single message
    if (options.messages) {
      messages.push(...options.messages);
    } else if (options.message) {
      messages.push({
        role: "user",
        content: options.message,
      });
    }

    // Create request object
    const request: RequestObject = {
      model: options.model || this.defaultModel,
      messages,
      ...this.defaultParameters,
      ...options.parameters,
    };

    // Add response format if specified
    if (options.responseFormat) {
      request.response_format = options.responseFormat;
    }

    // Add stream option if specified
    if (options.stream) {
      request.stream = true;
    }

    return request;
  }

  private parseResponse(rawResponse: unknown): ChatResponse {
    // Basic validation of the response
    if (!rawResponse || typeof rawResponse !== "object") {
      throw new NetworkError("Invalid response from OpenRouter API");
    }

    const response = rawResponse as Record<string, unknown>;

    // Track token usage
    if (response.usage && typeof response.usage === "object") {
      const usage = response.usage as Record<string, number>;
      this.trackUsage({
        prompt: usage.prompt_tokens || 0,
        completion: usage.completion_tokens || 0,
      });
    }

    // Return the validated response
    return rawResponse as ChatResponse;
  }

  private handleErrorResponse(status: number, data: unknown): never {
    const errorData = data as Record<string, unknown>;
    let message = "Unknown error";

    // Safely extract the error message
    if (errorData.error && typeof errorData.error === "object") {
      const error = errorData.error as Record<string, unknown>;
      if (error.message && typeof error.message === "string") {
        message = error.message;
      }

      // Check for quota exceeded condition
      if (error.type && error.type === "insufficient_quota") {
        throw new QuotaExceededError(`Quota exceeded: ${message}`);
      }
    }

    switch (status) {
      case 401:
        throw new AuthenticationError(`Authentication failed: ${message}`);
      case 403:
        throw new AuthenticationError(`Authorization failed: ${message}`);
      case 429:
        throw new RateLimitError(`Rate limit exceeded: ${message}`);
      case 404:
        throw new ModelUnavailableError(`Model not found: ${message}`);
      case 400:
        throw new InvalidRequestError(`Invalid request: ${message}`);
      case 422:
        throw new ContentFilterError(`Content filtered: ${message}`);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new NetworkError(`Server error: ${message}`);
      default:
        throw new OpenRouterError(`Error: ${message}`, `status_${status}`);
    }
  }

  private async retryWithBackoff(fn: () => Promise<unknown>, maxRetries = 3): Promise<unknown> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        const err = error as Error;
        lastError = err;

        // Don't retry for certain error types
        if (
          error instanceof AuthenticationError ||
          error instanceof QuotaExceededError ||
          error instanceof InvalidRequestError ||
          error instanceof ContentFilterError
        ) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = Math.min(1000 * 2 ** attempt + Math.random() * 100, 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error("Unknown error during retry");
  }

  private trackUsage(tokens: { prompt: number; completion: number }): void {
    this.requestCount++;
    // Usage tracking implementation
    // This is a stub that could be expanded with actual token tracking logic
    void tokens; // Silence the unused parameter warning
  }
}

// JsonSchemaBuilder class for creating response schemas
export class JsonSchemaBuilder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private schema: any = {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  };
  private schemaName: string;

  constructor(name: string) {
    this.schemaName = name;
  }

  addProperty(
    name: string,
    type: "string" | "number" | "boolean" | "object" | "array",
    required = false,
    additionalProps?: object
  ): JsonSchemaBuilder {
    this.schema.properties[name] = { type, ...additionalProps };

    if (required) {
      this.schema.required.push(name);
    }

    return this;
  }

  build(): ResponseFormat {
    return {
      type: "json_schema",
      json_schema: {
        name: this.schemaName,
        strict: true,
        schema: this.schema,
      },
    };
  }
}
