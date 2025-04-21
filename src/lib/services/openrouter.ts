import { OpenRouterService } from "./openrouter.service";
import { z } from "zod";

// Environment variables schema
const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  PUBLIC_APP_URL: z.string().url().optional().default("https://migg-flashcards.app"),
  PUBLIC_APP_NAME: z.string().optional().default("Migg Flashcards"),
});

/**
 * Returns an instance of the OpenRouter client configured with the API key from environment variables
 * @returns {OpenRouterService} Configured OpenRouter client
 * @throws {Error} If the API key is not set in environment variables
 */
export function getOpenRouterClient(): OpenRouterService {
  // Validate environment variables
  const env = validateEnv();

  return new OpenRouterService({
    apiKey: env.OPENROUTER_API_KEY,
    defaultModel: "openai/gpt-4o-mini",
    defaultSystemMessage: "You are a helpful assistant.",
    defaultParameters: {
      temperature: 0.7,
      max_tokens: 1000,
    },
    headers: {
      "HTTP-Referer": env.PUBLIC_APP_URL,
      "X-Title": env.PUBLIC_APP_NAME,
    },
  });
}

/**
 * Creates a client with custom configuration, still using the API key from environment variables
 * @param {object} config Custom configuration options
 * @returns {OpenRouterService} Configured OpenRouter client
 * @throws {Error} If the API key is not set in environment variables
 */
export function createOpenRouterClient(config: {
  defaultModel?: string;
  defaultSystemMessage?: string;
  defaultParameters?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
  timeoutMs?: number;
  headers?: Record<string, string>;
}): OpenRouterService {
  // Validate environment variables
  const env = validateEnv();

  return new OpenRouterService({
    apiKey: env.OPENROUTER_API_KEY,
    ...config,
    headers: {
      "HTTP-Referer": env.PUBLIC_APP_URL,
      "X-Title": env.PUBLIC_APP_NAME,
      ...config.headers,
    },
  });
}

/**
 * Validates environment variables and returns them typed
 */
function validateEnv() {
  const result = envSchema.safeParse({
    OPENROUTER_API_KEY: import.meta.env.OPENROUTER_API_KEY,
    PUBLIC_APP_URL: import.meta.env.PUBLIC_APP_URL,
    PUBLIC_APP_NAME: import.meta.env.PUBLIC_APP_NAME,
  });

  if (!result.success) {
    throw new Error(`Environment variable validation failed: ${result.error.message}`);
  }

  return result.data;
}
