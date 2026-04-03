# OpenAPI / Swagger Reading Guide

Load this file when the user provides an OpenAPI 2.x (Swagger) or OpenAPI 3.x spec.
It covers the structural patterns that trip up even experienced readers, so you can
parse the spec correctly and avoid misreading schemas.

---

## Table of Contents

1. [Version differences (2.x vs 3.x)](#version-differences)
2. [Schema composition — the hard part](#schema-composition)
3. [Resolving $ref chains](#resolving-ref-chains)
4. [Security schemes](#security-schemes)
5. [Parameters: where things live](#parameters)
6. [Response envelopes](#response-envelopes)
7. [Pagination patterns](#pagination-patterns)
8. [Common gotchas](#common-gotchas)

---

## Version Differences

### How to detect the version

```yaml
# OpenAPI 2.x (Swagger)
swagger: "2.0"

# OpenAPI 3.x
openapi: "3.0.3" # or 3.1.0
```

### Key structural differences

| Concern                | OpenAPI 2.x                     | OpenAPI 3.x                    |
| ---------------------- | ------------------------------- | ------------------------------ |
| Base URL               | `host` + `basePath` + `schemes` | `servers[].url`                |
| Request body           | `in: body` parameter            | `requestBody` object           |
| Response schemas       | `definitions`                   | `components/schemas`           |
| Auth schemes           | `securityDefinitions`           | `components/securitySchemes`   |
| File uploads           | `in: formData`, type: file      | `requestBody` with multipart   |
| Multiple content types | Not supported                   | `content` map with media types |

**OpenAPI 2.x request body** — lives as a parameter:

```yaml
parameters:
  - name: body
    in: body
    required: true
    schema:
      $ref: "#/definitions/CreatePaymentRequest"
```

**OpenAPI 3.x request body** — its own top-level key:

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/CreatePaymentRequest"
```

---

## Schema Composition

This is where specs are most commonly misread. OpenAPI uses JSON Schema keywords
to compose complex types. Read these carefully — they are NOT interchangeable.

### `allOf` — merge all schemas (like intersection / extends)

The result must satisfy ALL listed schemas. Use for inheritance patterns.

```yaml
components:
  schemas:
    Payment:
      allOf:
        - $ref: "#/components/schemas/BaseResource" # inherits id, created_at
        - type: object
          properties:
            amount:
              type: integer
            currency:
              type: string
```

Reading rule: the effective schema is the union of all properties from all listed schemas.
Required fields from any member schema apply to the merged result.

### `oneOf` — exactly one schema must match (discriminated union)

Only ONE of the listed schemas applies. Often paired with a `discriminator`.

```yaml
requestBody:
  content:
    application/json:
      schema:
        oneOf:
          - $ref: "#/components/schemas/CardPayment"
          - $ref: "#/components/schemas/BankPayment"
        discriminator:
          propertyName: payment_type
```

Reading rule: look for the `discriminator.propertyName` field in the request/response.
Its value determines which schema applies. Document this mapping clearly.

### `anyOf` — one or more schemas may match

Less strict than `oneOf`. Used for optional polymorphism or union types.

```yaml
schema:
  anyOf:
    - $ref: "#/components/schemas/StringValue"
    - $ref: "#/components/schemas/NumberValue"
```

Reading rule: the value is valid if it satisfies at least one. In practice, treat as
"could be any of these types" — enumerate them all in your documentation.

### `not` — must NOT match the schema

Rare. Used for exclusions.

```yaml
schema:
  not:
    type: string
```

---

## Resolving $ref Chains

`$ref` is a JSON pointer to another schema. Always resolve fully before documenting.

### Local refs (most common)

```yaml
$ref: '#/components/schemas/Payment'       # OpenAPI 3.x
$ref: '#/definitions/Payment'              # OpenAPI 2.x
```

Navigate to that key in the document and substitute the full schema.

### Nested refs — always follow the full chain

```yaml
# PaymentResponse refs BaseResponse which refs Timestamps
# You must read all three to know the full shape
PaymentResponse:
  allOf:
    - $ref: "#/components/schemas/BaseResponse"
    - properties:
        amount: { type: integer }

BaseResponse:
  allOf:
    - $ref: "#/components/schemas/Timestamps"
    - properties:
        id: { type: string }

Timestamps:
  properties:
    created_at: { type: string, format: date-time }
    updated_at: { type: string, format: date-time }
```

**Fully resolved PaymentResponse has:** `id`, `created_at`, `updated_at`, `amount`.
Document the full resolved shape, not just the top-level ref.

### External refs

```yaml
$ref: 'https://example.com/schemas/payment.yaml'
$ref: './shared/models.yaml#/Payment'
```

These reference files you may not have. Flag this to the user:

> "This spec references an external schema at `./shared/models.yaml`. I don't have
> that file — do you want to provide it?"

---

## Security Schemes

### OpenAPI 3.x security structure

Security is declared in two places:

1. `components/securitySchemes` — defines the available schemes
2. `security` at root or operation level — applies them

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT # optional hint, not enforced

    ApiKeyHeader:
      type: apiKey
      in: header
      name: X-API-Key

    ApiKeyQuery:
      type: apiKey
      in: query
      name: api_key

    OAuth2:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: https://auth.example.com/token
          scopes:
            read:payments: Read payment data
            write:payments: Create payments

    BasicAuth:
      type: http
      scheme: basic

# Applied globally:
security:
  - BearerAuth: []

# OR per-operation (overrides global):
paths:
  /payments:
    post:
      security:
        - BearerAuth: []
        - ApiKeyHeader: [] # alternative — user can use either
```

### Reading security correctly

- `security: []` (empty array at operation level) = **no auth required** for this endpoint, even if global auth is set
- Multiple entries in the array = OR (any one scheme works)
- Multiple entries within one object = AND (all required simultaneously, rare)
- `bearerFormat: JWT` is documentation-only — the API doesn't validate the format

### OAuth2 flows — what each means

| Flow                | Use case                       | What to document                   |
| ------------------- | ------------------------------ | ---------------------------------- |
| `authorizationCode` | User-delegated auth (web apps) | authorizationUrl, tokenUrl, scopes |
| `clientCredentials` | Server-to-server               | tokenUrl, scopes                   |
| `implicit`          | Deprecated, avoid              | —                                  |
| `deviceCode`        | CLI / limited-input devices    | deviceAuthorizationUrl, tokenUrl   |

---

## Parameters

Parameters appear in four locations. Their `in` value tells you where:

```yaml
parameters:
  - name: id
    in: path # /payments/{id} — always required
    required: true
    schema: { type: string }

  - name: limit
    in: query # /payments?limit=20 — usually optional
    required: false
    schema: { type: integer, default: 20, maximum: 100 }

  - name: X-Idempotency-Key
    in: header # custom request header
    required: false
    schema: { type: string }

  - name: session_id
    in: cookie # rare, but valid
    schema: { type: string }
```

**Path parameters are always required** — even if `required: false` appears (that's
a spec error). A path template like `/payments/{id}` cannot be called without `id`.

**Default values** — if a query param has `default`, the API behaves as if that value
was sent even when omitted. Document defaults so users know what they're getting.

---

## Response Envelopes

Many APIs wrap their actual data in an envelope. Recognize these patterns:

### Direct response (no envelope)

```yaml
"200":
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/Payment"
# Response IS the Payment object
```

### Envelope with data key

```yaml
"200":
  content:
    application/json:
      schema:
        type: object
        properties:
          data:
            $ref: "#/components/schemas/Payment"
          meta:
            type: object
# Access the payment via response.data
```

### Paginated list envelope

```yaml
"200":
  content:
    application/json:
      schema:
        type: object
        properties:
          data:
            type: array
            items:
              $ref: "#/components/schemas/Payment"
          pagination:
            $ref: "#/components/schemas/PaginationMeta"
```

When generating code, make sure to unwrap the envelope correctly. A common bug is
treating `response` as the payment when it's actually `response.data`.

---

## Pagination Patterns

OpenAPI doesn't standardize pagination — look for these common shapes:

### Cursor-based (most scalable)

```yaml
# Request
parameters:
  - name: cursor
    in: query
    schema: { type: string }
  - name: limit
    in: query
    schema: { type: integer }

# Response
properties:
  data: { type: array }
  next_cursor: { type: string, nullable: true }
  has_more: { type: boolean }
```

**Usage:** pass `next_cursor` as `cursor` on the next request. Stop when `has_more` is false or `next_cursor` is null.

### Offset-based

```yaml
parameters:
  - name: offset
    in: query
  - name: limit
    in: query

# Response
properties:
  data: { type: array }
  total: { type: integer }
  offset: { type: integer }
  limit: { type: integer }
```

**Usage:** next page offset = current offset + limit. Stop when offset ≥ total.

### Page-based

```yaml
parameters:
  - name: page
    in: query
  - name: per_page
    in: query

# Response
properties:
  data: { type: array }
  total_pages: { type: integer }
  current_page: { type: integer }
```

### Link header (RFC 5988)

Some APIs return pagination via `Link` response headers rather than body:

```
Link: <https://api.example.com/payments?cursor=xyz>; rel="next"
```

If you see `Link` mentioned in response headers in the spec, document this pattern.

---

## Common Gotchas

**`nullable: true` (OpenAPI 3.0) vs `type: [string, null]` (OpenAPI 3.1 / JSON Schema)**
These are equivalent but different syntax. Both mean the field can be null.

**`additionalProperties: false`**
The object rejects any properties not listed in `properties`. Important for request
validation — don't add undocumented fields to requests against such schemas.

**`readOnly` and `writeOnly`**

```yaml
id:
  type: string
  readOnly: true # present in responses, ignored/rejected in requests

password:
  type: string
  writeOnly: true # sent in requests, never returned in responses
```

When generating typed models, split into separate request/response interfaces.

**`deprecated: true`**

```yaml
/old-endpoint:
  get:
    deprecated: true
```

Always flag deprecated endpoints and suggest the replacement if documented.

**`format` is advisory, not enforced**
`format: date-time`, `format: email`, `format: uuid` — these are hints for
documentation and client validation. The API may or may not enforce them server-side.
Generate client-side validation but don't assume server enforcement.

**Empty `security: []` at operation level**
This explicitly means NO authentication for that endpoint. It overrides any global
security definition. Don't add auth headers to these requests.
