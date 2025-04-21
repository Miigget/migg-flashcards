# OpenRouter Service Implementation Plan

## 1. Opis usługi

OpenRouter to usługa, która umożliwia dostęp do wielu modeli LLM (OpenAI, Anthropic, Google i innych) poprzez zunifikowane API. Implementacja tej usługi w naszej aplikacji pozwoli na:

- Komunikację z różnymi modelami LLM bez konieczności integracji z wieloma dostawcami
- Zarządzanie limitami finansowymi dla kluczy API
- Dynamiczny wybór modeli w zależności od potrzeb
- Strukturyzowanie odpowiedzi w formacie JSON
- Obsługę błędów i zarządzanie dostępnością modeli

## 2. Opis konstruktora

```typescript
class OpenRouterService {
  constructor({
    apiKey,
    defaultModel = "openai/gpt-4o-mini",
    defaultSystemMessage = "",
    defaultParameters = {
      temperature: 0.7,
      max_tokens: 1000,
    },
    timeoutMs = 30000,
  }: {
    apiKey: string;
    defaultModel?: string;
    defaultSystemMessage?: string;
    defaultParameters?: ModelParameters;
    timeoutMs?: number;
  }) {
    // Inicjalizacja usługi
  }
}
```

## 3. Publiczne metody i pola

### 3.1. Podstawowe metody

```typescript
interface ChatOptions {
  message?: string;
  messages?: Message[];
  systemMessage?: string;
  model?: string;
  parameters?: ModelParameters;
  responseFormat?: ResponseFormat;
  stream?: boolean;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: object;
  };
}

// Metoda do wysyłania pojedynczego zapytania do modelu
async chat(options: ChatOptions): Promise<ChatResponse>;

// Metoda do pobierania listy dostępnych modeli
async listModels(): Promise<Model[]>;

// Metoda do ustawiania domyślnych parametrów
setDefaultParameters(parameters: ModelParameters): void;

// Metoda do ustawiania domyślnego modelu
setDefaultModel(modelName: string): void;

// Metoda do ustawiania domyślnej wiadomości systemowej
setDefaultSystemMessage(message: string): void;

// Metoda do tworzenia schematów JSON dla strukturyzowanych odpowiedzi
createJsonSchema(name: string): JsonSchemaBuilder;
```

### 3.2. Metody pomocnicze

```typescript
// Metoda do sprawdzania stanu usługi OpenRouter
async checkHealth(): Promise<HealthStatus>;

// Metoda do walidacji odpowiedzi według schematu
validateResponse(response: any, schema: object): boolean;

// Metoda do korzystania z predefiniowanych szablonów dla wiadomości systemowych
useTemplate(templateName: string): string;

// Metoda do korzystania z predefiniowanych zestawów parametrów
useParameterPreset(presetName: string): ModelParameters;
```

## 4. Prywatne metody i pola

```typescript
// Prywatne pola
private readonly apiKey: string;
private defaultModel: string;
private defaultSystemMessage: string;
private defaultParameters: ModelParameters;
private readonly timeoutMs: number;
private requestCount: number = 0;

// Metoda do budowania zapytań do API
private buildRequest(options: ChatOptions): RequestObject;

// Metoda do przetwarzania odpowiedzi z API
private parseResponse(rawResponse: any): ChatResponse;

// Metoda do obsługi strumieni danych
private handleStream(stream: ReadableStream): AsyncGenerator<ChatResponseChunk>;

// Metoda do śledzenia wykorzystania API
private trackUsage(tokens: { prompt: number; completion: number }): void;

// Metoda do zarządzania ponownymi próbami w przypadku błędów
private async retryWithBackoff(fn: Function, maxRetries: number = 3): Promise<any>;
```

## 5. Obsługa błędów

### 5.1. Typy błędów

```typescript
class OpenRouterError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "OpenRouterError";
  }
}

class AuthenticationError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, "authentication_error", details);
    this.name = "AuthenticationError";
  }
}

class RateLimitError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, "rate_limit_error", details);
    this.name = "RateLimitError";
  }
}

class QuotaExceededError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, "quota_exceeded", details);
    this.name = "QuotaExceededError";
  }
}

class ModelUnavailableError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, "model_unavailable", details);
    this.name = "ModelUnavailableError";
  }
}

class InvalidRequestError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, "invalid_request", details);
    this.name = "InvalidRequestError";
  }
}

class ContentFilterError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, "content_filtered", details);
    this.name = "ContentFilterError";
  }
}

class NetworkError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, "network_error", details);
    this.name = "NetworkError";
  }
}

class TimeoutError extends OpenRouterError {
  constructor(message: string, details?: any) {
    super(message, "timeout", details);
    this.name = "TimeoutError";
  }
}
```

### 5.2. Strategia obsługi błędów

1. **Błędy uwierzytelniania**
   - Sprawdzać poprawność klucza API przed każdym zapytaniem
   - Implementować mechanizm odświeżania klucza API jeśli to możliwe
   - Informować użytkownika o problemach z uwierzytelnieniem

2. **Błędy limitów zapytań**
   - Implementować wykładnicze wycofanie (exponential backoff) dla ponownych prób
   - Śledzić liczbę zapytań i zapobiegać przekroczeniu limitów
   - Przechowywać dane o limitach i dostosowywać zachowanie aplikacji

3. **Błędy przekroczenia kwoty**
   - Monitorować zużycie kwoty
   - Wdrożyć mechanizm alertów przed osiągnięciem limitu
   - Zapewnić tryb fallback gdy limit zostanie osiągnięty

4. **Błędy dostępności modelu**
   - Zapewnić automatyczne przełączanie na alternatywne modele
   - Informować użytkownika o niedostępności wybranego modelu
   - Regularnie sprawdzać dostępność preferowanych modeli

5. **Błędy nieprawidłowych zapytań**
   - Walidować wszystkie zapytania przed wysłaniem
   - Dostarczać szczegółowe informacje o przyczynie błędu
   - Zapewnić przykłady poprawnych zapytań w komunikatach o błędach

6. **Błędy filtrów treści**
   - Implementować wstępne sprawdzanie treści
   - Informować użytkownika o potencjalnych problemach z treścią
   - Oferować sugestie dotyczące przeformułowania zapytania

7. **Błędy sieciowe**
   - Implementować automatyczne ponowne próby z wykładniczym wycofaniem
   - Monitorować stabilność połączenia
   - Zapewnić tryb offline dla krytycznych funkcji

8. **Błędy przekroczenia czasu**
   - Ustawiać rozsądne limity czasu dla różnych operacji
   - Implementować strategię anulowania długotrwałych zapytań
   - Informować użytkownika o postępie dla długotrwałych operacji

## 6. Kwestie bezpieczeństwa

1. **Bezpieczne przechowywanie klucza API**
   - Przechowywać klucz API jako zmienną środowiskową
   - Nigdy nie ujawniać klucza API w kodzie frontend
   - Używać proxy serwerowego dla zapytań do OpenRouter

## 7. Plan wdrożenia krok po kroku

### 7.1. Przygotowanie środowiska

1. Utworzenie konta w OpenRouter i uzyskanie klucza API
2. Dodanie klucza API do zmiennych środowiskowych:
   ```bash
   # .env
   OPENROUTER_API_KEY=your_api_key_here
   ```
3. Instalacja niezbędnych zależności:
   ```bash
   pnpm add openrouter cross-fetch dotenv
   ```

### 7.2. Implementacja klasy OpenRouterService

1. Utworzenie pliku z usługą w katalogu `src/lib/services/openrouter.service.ts`:

```typescript
import fetch from 'cross-fetch';
import { z } from 'zod';

export class OpenRouterService {
  private readonly API_BASE_URL = 'https://openrouter.ai/api/v1';
  private readonly apiKey: string;
  private defaultModel: string;
  private defaultSystemMessage: string;
  private defaultParameters: ModelParameters;
  private readonly timeoutMs: number;
  private requestCount: number = 0;

  constructor({
    apiKey,
    defaultModel = "openai/gpt-4o-mini",
    defaultSystemMessage = "",
    defaultParameters = {
      temperature: 0.7,
      max_tokens: 1000,
    },
    timeoutMs = 30000,
  }: {
    apiKey: string;
    defaultModel?: string;
    defaultSystemMessage?: string;
    defaultParameters?: ModelParameters;
    timeoutMs?: number;
  }) {
    if (!apiKey) throw new AuthenticationError("API key is required");
    
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.defaultSystemMessage = defaultSystemMessage;
    this.defaultParameters = defaultParameters;
    this.timeoutMs = timeoutMs;
  }

  // Implementacja metod publicznych i prywatnych...
}

// Implementacja interfejsów i klas błędów...
```

### 7.3. Implementacja kluczowych metod

1. Metoda chat:

```typescript
async chat(options: ChatOptions): Promise<ChatResponse> {
  try {
    // Obsługa błędów wejściowych
    if (!options.message && !options.messages) {
      throw new InvalidRequestError("Either message or messages must be provided");
    }
    
    // Budowanie zapytania
    const request = this.buildRequest(options);
    
    // Wysłanie zapytania z obsługą ponownych prób
    const rawResponse = await this.retryWithBackoff(async () => {
      const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://yourapp.com',  // Wymagane przez OpenRouter
          'X-Title': 'YourAppName'                // Wymagane przez OpenRouter
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.handleErrorResponse(response.status, errorData);
      }
      
      return response.json();
    });
    
    // Przetwarzanie odpowiedzi
    return this.parseResponse(rawResponse);
  } catch (error) {
    // Obsługa błędów
    if (error instanceof OpenRouterError) throw error;
    
    if (error.name === 'AbortError') {
      throw new TimeoutError('Request timed out');
    }
    
    throw new NetworkError(`Unexpected error: ${error.message}`, error);
  }
}
```

2. Metoda buildRequest:

```typescript
private buildRequest(options: ChatOptions): RequestObject {
  const messages: Message[] = [];
  
  // Dodanie wiadomości systemowej
  const systemMessage = options.systemMessage || this.defaultSystemMessage;
  if (systemMessage) {
    messages.push({
      role: 'system',
      content: systemMessage
    });
  }
  
  // Dodanie historii wiadomości lub pojedynczej wiadomości
  if (options.messages) {
    messages.push(...options.messages);
  } else if (options.message) {
    messages.push({
      role: 'user',
      content: options.message
    });
  }
  
  // Utworzenie obiektu zapytania
  const request: RequestObject = {
    model: options.model || this.defaultModel,
    messages,
    ...this.defaultParameters,
    ...options.parameters
  };
  
  // Dodanie formatu odpowiedzi jeśli określono
  if (options.responseFormat) {
    request.response_format = options.responseFormat;
  }
  
  // Dodanie opcji strumienia
  if (options.stream) {
    request.stream = true;
  }
  
  return request;
}
```

3. Metoda createJsonSchema:

```typescript
createJsonSchema(name: string): JsonSchemaBuilder {
  return new JsonSchemaBuilder(name);
}

// Klasa pomocnicza do budowania schematów JSON
class JsonSchemaBuilder {
  private schema: any = {
    type: 'object',
    properties: {},
    required: []
  };
  private schemaName: string;
  
  constructor(name: string) {
    this.schemaName = name;
  }
  
  addProperty(
    name: string,
    type: 'string' | 'number' | 'boolean' | 'object' | 'array',
    required: boolean = false,
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
      type: 'json_schema',
      json_schema: {
        name: this.schemaName,
        strict: true,
        schema: this.schema
      }
    };
  }
}
```

### 7.4. Implementacja obsługi błędów

```typescript
private handleErrorResponse(status: number, data: any): never {
  const message = data.error?.message || 'Unknown error';
  
  switch (status) {
    case 401:
      throw new AuthenticationError(`Authentication failed: ${message}`);
    case 403:
      throw new AuthenticationError(`Authorization failed: ${message}`);
    case 429:
      if (data.error?.type === 'insufficient_quota') {
        throw new QuotaExceededError(`Quota exceeded: ${message}`);
      }
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

private async retryWithBackoff(fn: Function, maxRetries: number = 3): Promise<any> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Nie ponawiaj niektórych błędów
      if (
        error instanceof AuthenticationError ||
        error instanceof QuotaExceededError ||
        error instanceof InvalidRequestError ||
        error instanceof ContentFilterError
      ) {
        throw error;
      }
      
      // Exponential backoff z jitterem
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 100, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

### 7.5. Wykorzystanie klucza API z .env

```typescript
// src/lib/services/openrouter.ts
import { OpenRouterService } from './openrouter.service';

// Funkcja do pobrania klienta OpenRouter z klucza API ze zmiennych środowiskowych
export function getOpenRouterClient() {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key is not set in environment variables');
  }
  
  return new OpenRouterService({
    apiKey,
    defaultModel: 'openai/gpt-4o-mini'
  });
}
```

### 7.6. Wykorzystanie OpenRouterService w API

```typescript
// src/pages/api/chat.ts
import type { APIRoute } from 'astro';
import { getOpenRouterClient } from '../../db/openrouter';
import { z } from 'zod';

const chatRequestSchema = z.object({
  message: z.string().min(1),
  systemMessage: z.string().optional(),
  model: z.string().optional(),
  responseFormat: z.object({
    type: z.literal('json_schema'),
    json_schema: z.object({
      name: z.string(),
      strict: z.boolean(),
      schema: z.any()
    })
  }).optional()
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Walidacja żądania
    const body = await request.json();
    const result = chatRequestSchema.safeParse(body);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: result.error }),
        { status: 400 }
      );
    }
    
    const validatedData = result.data;
    
    // Pobranie klienta OpenRouter
    const openRouter = await getOpenRouterClient();
    
    // Wysłanie zapytania do OpenRouter
    const response = await openRouter.chat({
      message: validatedData.message,
      systemMessage: validatedData.systemMessage,
      model: validatedData.model,
      responseFormat: validatedData.responseFormat
    });
    
    // Zwrócenie odpowiedzi
    return new Response(
      JSON.stringify(response),
      { status: 200 }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Obsługa różnych typów błędów
    if (error.name === 'QuotaExceededError') {
      return new Response(
        JSON.stringify({ error: 'Quota exceeded', message: error.message }),
        { status: 402 }
      );
    }
    
    if (error.name === 'RateLimitError') {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', message: error.message }),
        { status: 429 }
      );
    }
    
    // Ogólna obsługa błędów
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500 }
    );
  }
};
```

### 7.7. Przykład komponentu React wykorzystującego OpenRouter

```tsx
// src/components/Chat.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          systemMessage: 'You are a helpful assistant.'
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Something went wrong');
      }
      
      const data = await res.json();
      setResponse(data.choices[0].message.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Chat</CardTitle>
      </CardHeader>
      <CardContent>
        {response && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            {response}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !message}>
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```