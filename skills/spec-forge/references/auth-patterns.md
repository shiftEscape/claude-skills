# Auth Patterns Reference

Load this file when the user asks about authentication, needs auth code generated,
or when the spec's auth scheme is non-trivial (anything beyond a simple API key).

---

## Table of Contents

1. [Quick decision tree](#quick-decision-tree)
2. [API Key](#api-key)
3. [Bearer / JWT](#bearer--jwt)
4. [OAuth2 — Client Credentials](#oauth2--client-credentials-server-to-server)
5. [OAuth2 — Authorization Code](#oauth2--authorization-code-user-delegated)
6. [Basic Auth](#basic-auth)
7. [HMAC / Request Signing](#hmac--request-signing)
8. [mTLS](#mtls-mutual-tls)
9. [Multi-scheme APIs](#multi-scheme-apis)
10. [Token refresh patterns](#token-refresh-patterns)
11. [Common auth bugs](#common-auth-bugs)

---

## Quick Decision Tree

```
What does the spec say?
│
├── type: apiKey → API Key section
├── type: http, scheme: bearer → Bearer / JWT section
├── type: http, scheme: basic → Basic Auth section
├── type: oauth2
│   ├── flows: clientCredentials → OAuth2 Client Credentials section
│   ├── flows: authorizationCode → OAuth2 Authorization Code section
│   └── flows: deviceCode → OAuth2 Device Code section
└── Not in spec / custom header → flag as undocumented, ask user
```

---

## API Key

The simplest scheme. A static token passed with every request.

### Header-based (most common)

```python
# Python
headers = {
    "X-API-Key": api_key,          # use exact header name from spec
    "Content-Type": "application/json"
}
response = requests.post(url, headers=headers, json=payload)
```

```typescript
// TypeScript
const response = await fetch(url, {
  headers: {
    "X-API-Key": apiKey, // use exact header name from spec
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
```

### Query parameter (less secure — credentials in URL logs)

```python
response = requests.get(url, params={"api_key": api_key})
```

**Code gen rule:** Use the exact `name` field from the spec's `securityScheme`.
Never guess the header or param name — a wrong name silently fails.

---

## Bearer / JWT

A token passed in the `Authorization` header. The token is obtained separately
(login endpoint, OAuth flow, etc.) and then sent with each request.

```python
# Python
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
```

```typescript
// TypeScript
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
}
```

```bash
# curl
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/resource
```

**If the spec uses `bearerFormat: JWT`:**
JWTs are base64-encoded JSON and have an expiry (`exp` claim). The client is
responsible for refreshing before expiry — see Token Refresh section below.

**Common mistake:** `"Bearer: token"` (with a colon) instead of `"Bearer token"` (space).
The colon breaks authentication silently.

---

## OAuth2 — Client Credentials (Server-to-Server)

Used when your server talks to another server — no user involved. You exchange
your `client_id` and `client_secret` for an access token, then use that token.

### Flow

```
Your Server → POST /token {client_id, client_secret, grant_type} → Auth Server
Auth Server → {access_token, expires_in} → Your Server
Your Server → GET /resource {Authorization: Bearer access_token} → API
```

### Token request

```python
# Python
import requests

def get_access_token(token_url, client_id, client_secret, scopes=None):
    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }
    if scopes:
        data["scope"] = " ".join(scopes)   # space-separated scope list

    response = requests.post(
        token_url,
        data=data,                          # form-encoded, NOT JSON
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    response.raise_for_status()
    token_data = response.json()
    return token_data["access_token"], token_data.get("expires_in", 3600)
```

```typescript
// TypeScript
async function getAccessToken(
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  scopes?: string[],
): Promise<{ token: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    ...(scopes && { scope: scopes.join(" ") }),
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) throw new Error(`Token request failed: ${response.status}`);
  const data = await response.json();
  return { token: data.access_token, expiresIn: data.expires_in ?? 3600 };
}
```

**Key detail:** Token endpoint uses `application/x-www-form-urlencoded`, NOT JSON.
This is the most common client credentials implementation bug.

**Scopes:** only request the scopes you need. Check the spec's `securitySchemes`
for the available scope list and their descriptions.

---

## OAuth2 — Authorization Code (User-Delegated)

Used when your app acts on behalf of a user. The user logs in and grants permission.
More complex — involves redirects and a browser.

### Flow

```
Your App → redirect user to authorizationUrl?client_id=...&redirect_uri=...&scope=...
User → logs in and approves
Auth Server → redirect to redirect_uri?code=AUTH_CODE
Your App → POST /token {code, client_id, client_secret, redirect_uri} → Auth Server
Auth Server → {access_token, refresh_token, expires_in} → Your App
Your App → API calls with access_token
```

### Token exchange (after receiving the auth code)

```python
def exchange_code_for_token(token_url, code, client_id, client_secret, redirect_uri):
    response = requests.post(token_url, data={
        "grant_type": "authorization_code",
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,    # must match exactly what was used in auth URL
    })
    return response.json()
    # Returns: access_token, refresh_token, expires_in, token_type
```

**Always store the `refresh_token`** — you'll need it to get new access tokens without
the user re-authenticating. See Token Refresh section.

---

## Basic Auth

Username and password, base64-encoded in the Authorization header.
Less common in modern APIs but still used for internal or legacy systems.

```python
# Python — requests handles encoding automatically
response = requests.get(url, auth=(username, password))

# Manual encoding
import base64
credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
headers = {"Authorization": f"Basic {credentials}"}
```

```typescript
// TypeScript
const credentials = btoa(`${username}:${password}`);
headers: {
  "Authorization": `Basic ${credentials}`
}
```

**Security note:** always use HTTPS with Basic Auth. The credentials are encoded,
not encrypted — they're trivially decodable.

---

## HMAC / Request Signing

Some APIs (Stripe webhooks, AWS Signature v4, Shopify) sign requests with an HMAC
digest rather than passing a token. The spec may describe this in a custom
`securityScheme` or in documentation prose.

### Typical pattern

```
signature = HMAC-SHA256(secret_key, canonical_request_string)
header: X-Signature: sha256={hex(signature)}
```

### Generic HMAC signing

```python
import hmac
import hashlib

def sign_request(secret_key: str, payload: bytes) -> str:
    return hmac.new(
        secret_key.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

# Usage
body = json.dumps(payload).encode()
signature = sign_request(webhook_secret, body)
headers["X-Signature"] = f"sha256={signature}"
```

```typescript
// TypeScript (Node.js)
import { createHmac } from "crypto";

function signRequest(secretKey: string, payload: string): string {
  return createHmac("sha256", secretKey).update(payload).digest("hex");
}

const signature = signRequest(webhookSecret, JSON.stringify(payload));
headers["X-Signature"] = `sha256=${signature}`;
```

**If the spec uses HMAC signing:** look for the exact canonical string format — what
fields are included, in what order, and what separators. The signing algorithm is
brittle to get wrong. Document the exact format from the spec.

---

## mTLS (Mutual TLS)

Both client and server present certificates. Used in high-security enterprise APIs.
The spec may indicate this via `type: mutualTLS` (OpenAPI 3.1) or in prose.

```python
# Python — pass client certificate and key
response = requests.get(
    url,
    cert=("/path/to/client.crt", "/path/to/client.key"),
    verify="/path/to/ca-bundle.crt"   # server cert verification
)
```

```typescript
// TypeScript (Node.js)
import https from "https";
import fs from "fs";

const agent = new https.Agent({
  cert: fs.readFileSync("/path/to/client.crt"),
  key: fs.readFileSync("/path/to/client.key"),
  ca: fs.readFileSync("/path/to/ca-bundle.crt"),
});

const response = await fetch(url, { agent } as any);
```

---

## Multi-Scheme APIs

Some APIs support multiple auth methods (e.g. Bearer OR API Key). When generating
code, pick ONE and document the alternatives.

```yaml
# Spec shows alternatives with OR logic
security:
  - BearerAuth: []
  - ApiKeyHeader: []
```

**Strategy:**

1. Default to the most secure / most commonly used scheme
2. Note the alternatives in a comment
3. Make the scheme easy to swap (dependency injection, config flag)

---

## Token Refresh Patterns

Access tokens expire. Build refresh logic from the start.

### Proactive refresh (preferred)

Check expiry before each request, refresh if within a buffer window:

```python
import time

class TokenManager:
    def __init__(self, token_url, client_id, client_secret):
        self.token_url = token_url
        self.client_id = client_id
        self.client_secret = client_secret
        self._token = None
        self._expires_at = 0

    def get_token(self) -> str:
        # Refresh if expired or expiring within 60 seconds
        if time.time() >= self._expires_at - 60:
            self._refresh()
        return self._token

    def _refresh(self):
        data = get_access_token(self.token_url, self.client_id, self.client_secret)
        self._token = data["access_token"]
        self._expires_at = time.time() + data["expires_in"]
```

### Reactive refresh (simpler, slightly less efficient)

Retry on 401:

```python
def api_call_with_retry(url, headers, payload):
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 401:
        # Token expired — refresh and retry once
        headers["Authorization"] = f"Bearer {refresh_token()}"
        response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()
```

### OAuth2 refresh token flow

```python
def refresh_oauth_token(token_url, refresh_token, client_id, client_secret):
    response = requests.post(token_url, data={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
    })
    response.raise_for_status()
    return response.json()  # new access_token (and possibly new refresh_token)
```

**Important:** some OAuth servers rotate the refresh token on each use. Always
store the latest refresh token returned — don't reuse old ones.

---

## Common Auth Bugs

| Bug                                       | Symptom                            | Fix                                               |
| ----------------------------------------- | ---------------------------------- | ------------------------------------------------- |
| `"Bearer: token"` (colon)                 | 401 Unauthorized                   | `"Bearer token"` (space, no colon)                |
| JSON body to token endpoint               | 400 Bad Request                    | Use `application/x-www-form-urlencoded` for OAuth |
| Stale access token                        | Intermittent 401s                  | Implement token refresh (proactive or reactive)   |
| Wrong header name                         | 401 / 403                          | Use exact `name` from spec securityScheme         |
| Reusing rotated refresh token             | 400 invalid_grant                  | Store and use the latest refresh token            |
| Missing required scopes                   | 403 Forbidden                      | Request all required scopes at token time         |
| HTTP instead of HTTPS                     | Credentials leaked                 | Always HTTPS in production                        |
| Sending auth on unauthenticated endpoints | Usually harmless, but leaks tokens | Respect `security: []` on public endpoints        |
