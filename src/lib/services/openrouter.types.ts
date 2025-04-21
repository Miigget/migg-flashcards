// Types and interfaces for OpenRouter service
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: object;
  };
}

export interface ChatOptions {
  message?: string;
  messages?: Message[];
  systemMessage?: string;
  model?: string;
  parameters?: ModelParameters;
  responseFormat?: ResponseFormat;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "down";
  availableModels: string[];
  message?: string;
}

export interface RequestObject {
  model: string;
  messages: Message[];
  stream?: boolean;
  response_format?: ResponseFormat;
  [key: string]: unknown;
}

// Error classes
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class AuthenticationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "authentication_error", details);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "rate_limit_error", details);
    this.name = "RateLimitError";
  }
}

export class QuotaExceededError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "quota_exceeded", details);
    this.name = "QuotaExceededError";
  }
}

export class ModelUnavailableError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "model_unavailable", details);
    this.name = "ModelUnavailableError";
  }
}

export class InvalidRequestError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "invalid_request", details);
    this.name = "InvalidRequestError";
  }
}

export class ContentFilterError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "content_filtered", details);
    this.name = "ContentFilterError";
  }
}

export class NetworkError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "network_error", details);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "timeout", details);
    this.name = "TimeoutError";
  }
}
