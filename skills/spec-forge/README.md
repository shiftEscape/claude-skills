# spec-forge

Ingest any API spec or SDK docs and become a grounded expert — grounded in the source, never in guesswork.

A Claude Skill by [@shiftEscape](https://github.com/shiftEscape)

## The Problem

Claude's training data contains outdated SDK versions, deprecated method names, and hallucinated parameters. When you ask Claude to help integrate an API without a spec, it guesses — and those guesses ship as bugs.

**spec-forge fixes this.** Drop in any spec or docs, and Claude reads it first, answers from it, and flags anything that isn't documented rather than filling gaps with training-data assumptions.

## What It Does

**Ingests any format**
OpenAPI 2.x / 3.x (JSON or YAML), SDK READMEs, docs URLs, pasted content, multiple sources at once, or two versions side-by-side for diffing.

**Produces an Orientation Report**
After reading the spec, Claude produces a structured summary — auth schemes, endpoints, pagination pattern, rate limits, deprecated fields, and honest gaps — before doing anything else.

**Generates grounded client code**
TypeScript, Python, Go, or any language. Exact field names, correct auth, typed models from schemas, pagination loops, retry logic, and error handling mapped to documented status codes.

**Validates your existing code**
Paste code you've already written and spec-forge checks it against the spec — wrong field names, bad auth, undocumented fields, deprecated usage.

**Diffs versions**
Provide two specs and get a structured breakdown: breaking changes, deprecations, new additions.

**Honest about gaps**
If something isn't in the spec, spec-forge says so rather than inventing a plausible answer.

## Triggers

The skill activates automatically when you:

- Upload or paste an OpenAPI / Swagger file
- Share SDK docs, a README, or a docs URL
- Say things like _"here's our internal API"_, _"use this spec"_, _"the library updated"_, _"help me integrate this"_
- Ask to generate a client, write typed models, produce curl examples, or validate existing code against a spec

Or invoke it directly: `/spec-forge`

## Usage

**1. Drop in your spec**

```
Here's our payments API spec. Help me integrate it.

[paste OpenAPI YAML / JSON, SDK README, or docs URL]
```

**2. Get an Orientation Report**
Claude reads the full spec and produces a structured summary before writing any code.

**3. Ask for what you need**

```
Write a TypeScript client for the payments endpoint
```

```
Check this existing code against the spec
```

```
Generate curl examples for all endpoints
```

```
What changed between v2 and v3? [paste both specs]
```

```
Does this API support webhooks?
```

## Structure

```
spec-forge/
├── SKILL.md                          # Core skill instructions
├── evals/
│   └── evals.json                    # Test cases
└── references/                       # Loaded on demand
    ├── openapi-cheatsheet.md         # $ref resolution, allOf/oneOf, security schemes
    ├── auth-patterns.md              # OAuth2, API key, HMAC, mTLS, token refresh
    └── code-gen-patterns.md          # Typed models, pagination, retry, streaming
```

References load only when needed — not all upfront — keeping context efficient.

## Grounding Rules

spec-forge enforces five rules on every response:

1. **Spec beats training data** — if there's a conflict, the spec wins
2. **Flag uncertainty explicitly** — never silently guess
3. **No gap-filling** — if it's not documented, say so
4. **Deprecated means deprecated** — always surface it, even if asked to use it
5. **Preserve exact names** — field names are copied verbatim from the spec

## Installation

**Claude.ai / Claude Code:**

1. Download `spec-forge.skill` from [Releases](../../releases)
2. Go to **Settings → Skills → Install from file**
3. Upload the `.skill` file

**Manual (Claude Code):**

```bash
cp -r spec-forge .claude/skills/spec-forge
```

Produces `dist/spec-forge.skill`.

## License

MIT — see [LICENSE](../../LICENSE)
