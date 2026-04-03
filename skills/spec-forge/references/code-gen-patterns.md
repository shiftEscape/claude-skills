# Code Generation Patterns

Load this file when generating client code from a spec. It provides idiomatic,
production-ready patterns per language — covering pagination, retry logic, error
handling, and typed models — so the generated code is actually usable, not just
a demo that works once.

---

## Table of Contents

1. [Language detection](#language-detection)
2. [Python patterns](#python)
3. [TypeScript / JavaScript patterns](#typescript--javascript)
4. [Go patterns](#go)
5. [Typed model generation](#typed-model-generation)
6. [Pagination loops](#pagination-loops)
7. [Retry with backoff](#retry-with-backoff)
8. [Streaming responses](#streaming-responses)
9. [Error handling by status code](#error-handling-by-status-code)

---

## Language Detection

Use the language the user is already working in. Signals to look for:

- Existing code they've pasted
- File extensions mentioned
- Framework names (FastAPI → Python, Express → Node.js/TypeScript)
- Import statements

If unclear, ask: "Which language are you working in?"

Default preference order if no signal: **TypeScript → Python → Go**

---

## Python

### Minimal working client

```python
import requests
from typing import Any

BASE_URL = "https://api.example.com"  # use server URL from spec

class APIClient:
    def __init__(self, api_key: str):
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",  # adapt to spec's auth scheme
            "Content-Type": "application/json",
        })

    def _request(self, method: str, path: str, **kwargs) -> Any:
        response = self.session.request(method, f"{BASE_URL}{path}", **kwargs)
        self._raise_for_status(response)
        return response.json()

    def _raise_for_status(self, response: requests.Response) -> None:
        if response.ok:
            return
        # Map status codes to exceptions using documented error codes
        error_map = {
            400: ValueError,
            401: PermissionError,
            403: PermissionError,
            404: LookupError,
            422: ValueError,
            429: RuntimeError,  # rate limited
        }
        exc_class = error_map.get(response.status_code, RuntimeError)
        raise exc_class(f"API error {response.status_code}: {response.text}")
```

### Async client (when user is using asyncio/FastAPI)

```python
import httpx
import asyncio

class AsyncAPIClient:
    def __init__(self, api_key: str):
        self.client = httpx.AsyncClient(
            base_url=BASE_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.client.aclose()

    async def _request(self, method: str, path: str, **kwargs):
        response = await self.client.request(method, path, **kwargs)
        response.raise_for_status()
        return response.json()
```

### Dataclasses for typed models

```python
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

@dataclass
class Payment:
    id: str
    amount: int                      # integer, in cents
    currency: str                    # "usd" | "eur" | "gbp"
    status: str                      # "pending" | "completed" | "failed"
    created_at: datetime
    source_id: str
    metadata: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict) -> "Payment":
        return cls(
            id=data["id"],
            amount=data["amount"],
            currency=data["currency"],
            status=data["status"],
            created_at=datetime.fromisoformat(data["created_at"]),
            source_id=data["source_id"],
            metadata=data.get("metadata", {}),
        )
```

---

## TypeScript / JavaScript

### Minimal working client

```typescript
const BASE_URL = "https://api.example.com"; // use server URL from spec

class APIClient {
  private headers: Record<string, string>;

  constructor(apiKey: string) {
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return response.json() as Promise<T>;
  }

  private async handleError(response: Response): Promise<never> {
    const body = await response.text();
    const messages: Record<number, string> = {
      400: "Invalid request",
      401: "Unauthorized — check your API key",
      403: "Forbidden",
      404: "Not found",
      422: "Unprocessable — check request data",
      429: "Rate limited — slow down",
    };
    throw new Error(
      messages[response.status] ?? `API error ${response.status}: ${body}`,
    );
  }
}
```

### Typed interfaces from spec schemas

```typescript
// Generate interfaces that match the spec exactly
// Field names must match the spec — no camelCase conversion unless spec uses camelCase

interface CreatePaymentRequest {
  amount: number; // integer, smallest currency unit
  currency: "usd" | "eur" | "gbp"; // exact enum values from spec
  source_id: string; // use spec's exact field name
  metadata?: Record<string, unknown>;
}

interface Payment {
  id: string;
  amount: number;
  currency: "usd" | "eur" | "gbp";
  status: "pending" | "completed" | "failed";
  created_at: string; // ISO 8601 — parse to Date where needed
  source_id: string;
  metadata: Record<string, unknown>;
}

// Separate request and response types if fields differ
// (readOnly fields only in response, writeOnly only in request)
interface CreatePaymentResponse extends Payment {}
```

### Node.js with axios (when user already uses it)

```typescript
import axios, { AxiosInstance } from "axios";

class APIClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // Map all 4xx/5xx to thrown errors automatically
    this.client.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error),
    );
  }
}
```

---

## Go

### Minimal working client

```go
package apiclient

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

const baseURL = "https://api.example.com"

type Client struct {
    apiKey     string
    httpClient *http.Client
}

func NewClient(apiKey string) *Client {
    return &Client{
        apiKey: apiKey,
        httpClient: &http.Client{Timeout: 30 * time.Second},
    }
}

func (c *Client) do(ctx context.Context, method, path string, body, result any) error {
    var buf bytes.Buffer
    if body != nil {
        if err := json.NewEncoder(&buf).Encode(body); err != nil {
            return fmt.Errorf("encoding request: %w", err)
        }
    }

    req, err := http.NewRequestWithContext(ctx, method, baseURL+path, &buf)
    if err != nil {
        return fmt.Errorf("creating request: %w", err)
    }

    req.Header.Set("Authorization", "Bearer "+c.apiKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return fmt.Errorf("executing request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return fmt.Errorf("API error %d", resp.StatusCode)
    }

    if result != nil {
        return json.NewDecoder(resp.Body).Decode(result)
    }
    return nil
}
```

### Go structs from spec schemas

```go
// Use json tags that match the spec's field names exactly
type Payment struct {
    ID        string            `json:"id"`
    Amount    int               `json:"amount"`
    Currency  string            `json:"currency"`
    Status    string            `json:"status"`
    CreatedAt time.Time         `json:"created_at"`
    SourceID  string            `json:"source_id"`
    Metadata  map[string]any    `json:"metadata,omitempty"`
}

type CreatePaymentRequest struct {
    Amount   int               `json:"amount"`
    Currency string            `json:"currency"`
    SourceID string            `json:"source_id"`
    Metadata map[string]any    `json:"metadata,omitempty"`
}
```

---

## Typed Model Generation

When generating models from spec schemas, follow these rules:

### Field naming

- **Always use the spec's exact field names** in serialization (JSON tags, `from_dict` keys)
- In strongly-typed languages, you may use idiomatic naming in the struct/class,
  but the serialized name must match the spec exactly
- Example: Go struct field `SourceID string` with tag `json:"source_id"` ✅

### Required vs optional fields

```yaml
# Spec
required: [amount, currency, source_id]
properties:
  amount: { type: integer }
  currency: { type: string }
  source_id: { type: string }
  metadata: { type: object } # NOT in required → optional
```

```typescript
// TypeScript — optional fields use ?
interface CreatePaymentRequest {
  amount: number; // required
  currency: string; // required
  source_id: string; // required
  metadata?: Record<string, unknown>; // optional
}
```

```python
# Python dataclass — optional fields have defaults
@dataclass
class CreatePaymentRequest:
    amount: int                          # required
    currency: str                        # required
    source_id: str                       # required
    metadata: Optional[dict] = None      # optional
```

### Enums

Generate string literal union types / enums directly from the spec's `enum` array:

```typescript
// From spec: enum: [usd, eur, gbp]
type Currency = "usd" | "eur" | "gbp";

// From spec: enum: [pending, completed, failed]
type PaymentStatus = "pending" | "completed" | "failed";
```

```python
from enum import Enum

class Currency(str, Enum):
    USD = "usd"
    EUR = "eur"
    GBP = "gbp"
```

### Separate request/response models when needed

When a schema has `readOnly` or `writeOnly` fields, split into two types:

```typescript
// Request — no readOnly fields
interface CreatePaymentRequest {
  amount: number;
  currency: Currency;
  source_id: string;
}

// Response — includes readOnly fields
interface Payment extends CreatePaymentRequest {
  id: string; // readOnly
  status: PaymentStatus; // readOnly
  created_at: string; // readOnly
}
```

---

## Pagination Loops

Generate complete pagination loops, not just single-page calls.

### Cursor-based pagination

```python
# Python
def list_all_payments(client, limit=100):
    all_payments = []
    cursor = None

    while True:
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor

        response = client.get("/payments", params=params)
        all_payments.extend(response["data"])

        if not response.get("has_more") or not response.get("next_cursor"):
            break
        cursor = response["next_cursor"]

    return all_payments
```

```typescript
// TypeScript
async function* listAllPayments(client: APIClient, limit = 100) {
  let cursor: string | undefined;

  do {
    const response = await client.get<PaginatedResponse<Payment>>("/payments", {
      limit,
      ...(cursor && { cursor }),
    });

    yield* response.data;
    cursor = response.next_cursor ?? undefined;
  } while (response.has_more);
}

// Usage — async generator, processes one page at a time
for await (const payment of listAllPayments(client)) {
  console.log(payment.id);
}
```

### Offset-based pagination

```python
def list_all_payments(client, limit=100):
    all_payments = []
    offset = 0

    while True:
        response = client.get("/payments", params={"offset": offset, "limit": limit})
        page = response["data"]
        all_payments.extend(page)

        if offset + limit >= response["total"]:
            break
        offset += limit

    return all_payments
```

---

## Retry with Backoff

Always generate retry logic for production code. Rate limits (429) and transient
errors (500, 503) are expected in production.

```python
# Python — exponential backoff with jitter
import time
import random

def with_retry(fn, max_retries=3, base_delay=1.0):
    retryable = {429, 500, 502, 503, 504}

    for attempt in range(max_retries + 1):
        try:
            return fn()
        except requests.HTTPError as e:
            if attempt == max_retries or e.response.status_code not in retryable:
                raise

            # Respect Retry-After header if present (common with 429)
            retry_after = e.response.headers.get("Retry-After")
            if retry_after:
                delay = float(retry_after)
            else:
                delay = base_delay * (2 ** attempt) + random.uniform(0, 1)

            time.sleep(delay)
```

```typescript
// TypeScript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  const retryable = new Set([429, 500, 502, 503, 504]);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const status = (error as any).status;
      if (!retryable.has(status)) throw error;

      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("unreachable");
}
```

---

## Streaming Responses

When the spec indicates a streaming endpoint (Server-Sent Events or chunked JSON):

```python
# Python — SSE / chunked streaming
def stream_response(client, endpoint, payload):
    with client.session.post(
        f"{BASE_URL}{endpoint}",
        json=payload,
        stream=True
    ) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if line:
                if line.startswith(b"data: "):
                    data = line[6:]
                    if data != b"[DONE]":
                        yield json.loads(data)
```

```typescript
// TypeScript — ReadableStream
async function* streamResponse(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { ...this.headers },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Stream error: ${response.status}`);
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        yield JSON.parse(line.slice(6));
      }
    }
  }
}
```

---

## Error Handling by Status Code

Map every documented error code to a clear exception or error type:

```python
# Python — custom exceptions per error type
class APIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        super().__init__(f"[{status_code}] {message}")

class ValidationError(APIError): pass      # 400, 422
class AuthenticationError(APIError): pass  # 401
class AuthorizationError(APIError): pass   # 403
class NotFoundError(APIError): pass        # 404
class RateLimitError(APIError): pass       # 429
class ServerError(APIError): pass          # 500, 502, 503

def raise_for_status(response):
    handlers = {
        400: ValidationError,
        401: AuthenticationError,
        403: AuthorizationError,
        404: NotFoundError,
        422: ValidationError,
        429: RateLimitError,
        500: ServerError,
    }
    if not response.ok:
        exc_class = handlers.get(response.status_code, APIError)
        raise exc_class(response.status_code, response.text)
```

Only generate error types for status codes actually documented in the spec.
Don't invent error classes for undocumented codes — just use the generic `APIError`.
