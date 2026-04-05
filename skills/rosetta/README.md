# rosetta

> Automate i18n workflows — extract strings, audit coverage, validate consistency, set up localization from scratch.

A Claude Skill by [@shiftEscape](https://github.com/shiftEscape)

---

## The Problem

Internationalization is one of the most tedious parts of software development. Developers hunt for hardcoded strings manually, invent inconsistent key names, and only discover missing translations in production when a user sees raw key names instead of text.

**Rosetta fixes this.** Drop in a component, a locale file, or just describe your stack — and Rosetta handles the extraction, auditing, validation, and setup with your exact framework and conventions.

No external service. No API key. No lock-in.

---

## What It Does

**String Extraction**
Scans components for user-facing hardcoded text. Distinguishes translatable strings from CSS classes, URLs, log messages, and IDs. Generates context-aware keys following your existing naming convention. Shows a before/after diff of the code changes alongside the keys to add to your locale file.

**Coverage Audit**
Compares your source locale against every target language. Reports missing keys, extra keys, placeholder mismatches, and coverage percentage per language — in one structured table.

**Consistency Validation**
Catches missing keys, empty values, untranslated strings, placeholder name differences, plural form gaps, and HTML tag mismatches. Flags issues as errors (will break the app) or warnings (degraded UX).

**i18n Setup from Scratch**
Detects your framework, recommends the right i18n library, provides install and configuration steps, creates the initial file structure, and demonstrates the wrapping pattern with a sample file.

**Key Quality Review**
Audits existing key names for anti-patterns — non-descriptive names, values-as-keys, language-hardcoded names, cryptic abbreviations — and proposes improvements.

---

## Triggers

Rosetta activates automatically when you:

- Mention i18n, l10n, localization, internationalization, or translations
- Share locale files (`.json`, `.yaml`, `.arb`, `.po`, `.xliff`)
- Ask about missing translations or coverage
- Say things like *"extract strings"*, *"add i18n support"*, *"support multiple languages"*, *"hardcoded text"*
- Work with frameworks like next-intl, react-i18next, vue-i18n, i18next, Flutter ARB

Or invoke it directly: `/rosetta`

---

## Usage

**Extract strings from a component**
```
Here's my LoginForm component. Extract all hardcoded strings and give me the i18n keys.

[paste component code]
```

**Audit translation coverage**
```
Audit my translations. Here's en.json and es.json.

[paste locale files]
```

**Set up i18n from scratch**
```
I have a Next.js App Router app with no i18n setup. I want to support English, Spanish, and French.
```

**Validate consistency**
```
Check my locale files for any consistency issues — missing keys, placeholder mismatches, anything broken.
```

**Review key names**
```
Are these key names good? How would you improve them?

[paste keys]
```

---

## Supported Frameworks

| Framework | Library |
|-----------|---------|
| Next.js (App Router) | next-intl |
| Next.js (Pages Router) | next-intl, react-i18next |
| React (Vite / CRA) | react-i18next |
| Vue 3 / Nuxt | vue-i18n |
| Angular | ngx-translate, built-in |
| Flutter | gen-l10n (ARB) |
| Rails | Built-in I18n |
| Django / Python | gettext / Babel |
| Node.js | i18next |

## Supported Formats

JSON (flat + nested), YAML, ARB, PO/POT, XLIFF 1.2 & 2.0

---

## Structure

```
rosetta/
├── SKILL.md                            # Core skill instructions
├── evals/
│   └── evals.json                      # 5 test cases
└── references/                         # Loaded on demand
    ├── frameworks.md                   # Setup guide per framework
    ├── locale-formats.md               # JSON, YAML, ARB, PO, XLIFF
    └── key-conventions.md              # Naming patterns, anti-patterns
```

---

## Grounding Rules

1. **Never invent translations** — generate keys and English values only; leave target languages empty or `[TODO]`
2. **Preserve existing conventions** — match the project's current key style, don't impose a different one
3. **Context over brevity** — `settings.profile.save_button` beats `save` every time
4. **Flag, don't skip ambiguous strings** — if unsure whether a string is user-facing, surface it for the developer to decide
5. **Always show diffs** — code changes and locale file additions must be shown together
6. **Warn about dynamic keys** — `t('prefix.' + variable)` patterns can't be statically extracted; always call this out

---

## Install

**Claude.ai**
Settings → Skills → Install from file → upload `rosetta.skill`

**Claude Code**
```bash
cp -r skills/rosetta .claude/skills/
```

Or from the monorepo root:
```bash
npm run install-all
```
