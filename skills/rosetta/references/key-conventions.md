# Translation Key Conventions

Load this file when generating or reviewing translation key names, deciding on
namespacing strategy, or refactoring existing keys.

---

## Table of Contents
1. [Core principles](#core-principles)
2. [Naming patterns](#naming-patterns)
3. [Namespacing strategies](#namespacing-strategies)
4. [Placeholder conventions](#placeholder-conventions)
5. [Pluralization keys](#pluralization-keys)
6. [Common anti-patterns](#common-anti-patterns)
7. [Decision guide](#decision-guide)

---

## Core Principles

**1. Keys should be meaningful out of context.**
A developer reading `t('save')` in a code search has no idea where it's used.
`t('settings.profile.save_button')` is immediately clear. Always prefer specificity.

**2. Keys describe location and purpose, not content.**
Key: `auth.login.error_invalid_credentials`
Not: `invalid_credentials_error_message`

The key communicates *where* and *what*, not the English value. This matters because
the English value may change but the semantic meaning stays the same.

**3. Consistency beats correctness.**
If a project uses flat keys, add flat keys. If it uses dot-notation namespacing,
use dot-notation. Mixing conventions is worse than either choice alone.

**4. Never hard-code language in key names.**
`en_save` — wrong. The key is language-agnostic.
`common.save` — correct.

**5. Avoid key collisions by namespacing.**
`title` alone will collide across every page. `homepage.hero.title` won't.

---

## Naming Patterns

### Pattern 1: Dot-notation (most common in JS)
```
namespace.component.element[.modifier]
```

Examples:
```
common.save
common.cancel
common.loading
auth.login.title
auth.login.email_placeholder
auth.login.password_placeholder
auth.login.submit_button
auth.login.error.invalid_credentials
auth.login.error.account_locked
auth.register.title
settings.profile.save_button
settings.profile.avatar.upload_label
settings.notifications.email.label
settings.notifications.email.description
errors.network
errors.not_found
errors.unauthorized
```

### Pattern 2: Underscore (flat, common in Rails/Django)
```
namespace_component_element
```

Examples:
```
auth_login_title
auth_login_submit
settings_profile_save
errors_network
```

### Pattern 3: Component-scoped (Next.js convention)
```
ComponentName.section.element
```

Examples:
```
LoginPage.title
LoginPage.form.email
LoginPage.form.submit
HomePage.hero.title
HomePage.hero.cta
```

### Pattern 4: Feature-first
```
feature.action.element
```

Examples:
```
checkout.payment.card_number
checkout.payment.expiry
checkout.payment.submit
checkout.confirmation.title
checkout.confirmation.order_number
```

---

## Namespacing Strategies

### Single file (simple apps)
All keys in one file. Good for small apps (<50 keys).

```json
{
  "common.save": "Save",
  "auth.login.title": "Log in",
  "dashboard.welcome": "Welcome back"
}
```

**When to use:** Small apps, prototypes, <3 pages.

### By feature / page (most common)
Separate files per feature or page.

```
/messages/en/
  common.json       ← shared UI (save, cancel, loading)
  auth.json         ← login, register, forgot password
  dashboard.json    ← dashboard page
  settings.json     ← settings pages
  errors.json       ← error messages
```

**When to use:** Most apps. Allows lazy loading per route.

### Single nested file
One file per language, nested by feature.

```json
{
  "common": {"save": "Save", "cancel": "Cancel"},
  "auth": {
    "login": {"title": "Log in", "submit": "Log in"},
    "register": {"title": "Create account"}
  }
}
```

**When to use:** next-intl, vue-i18n. Good for server-rendered apps.

### Shared vs page-specific pattern
```
common.*     ← reused everywhere (buttons, labels, errors)
pages.*      ← page-specific content
components.* ← reusable component strings
emails.*     ← transactional email content
```

---

## Placeholder Conventions

Different frameworks use different placeholder syntax. Always match the project's
existing convention — never mix syntaxes.

| Framework | Syntax | Example |
|-----------|--------|---------|
| next-intl | `{variable}` | `"Hello, {name}!"` |
| vue-i18n | `{variable}` | `"Hello, {name}!"` |
| react-i18next | `{{variable}}` | `"Hello, {{name}}!"` |
| i18next | `{{variable}}` | `"Hello, {{name}}!"` |
| Rails | `%{variable}` | `"Hello, %{name}!"` |
| Python/Django | `%(variable)s` | `"Hello, %(name)s!"` |
| Flutter/ARB | `{variable}` | `"Hello, {userName}!"` |
| PHP (gettext) | `%s`, `%d` | `"Hello, %s!"` |

**Variable naming in placeholders:**
- Use camelCase for JS frameworks: `{userName}`, `{itemCount}`
- Use snake_case for Rails/Python: `%{user_name}`, `%(item_count)s`
- Be descriptive: `{count}` over `{n}`, `{userName}` over `{u}`

**Multiple placeholders:**
```json
{
  "transfer_success": "Transferred {amount} to {recipientName} on {date}"
}
```

Document what type each placeholder is — especially numbers and dates that may
need formatting per locale.

---

## Pluralization Keys

### react-i18next / i18next (suffix convention)
```json
{
  "item_one": "{{count}} item",
  "item_other": "{{count}} items",
  "item_zero": "No items"
}
```
Usage: `t('item', {count: n})`

Suffixes: `_zero`, `_one`, `_two`, `_few`, `_many`, `_other`

### next-intl (ICU format)
```json
{
  "items": "{count, plural, =0 {No items} one {# item} other {# items}}"
}
```

### vue-i18n (pipe separator)
```json
{
  "item": "no items | one item | {count} items"
}
```
Usage: `$tc('item', count)`

### Rails (sub-key convention)
```yaml
en:
  items:
    zero: "No items"
    one: "One item"
    other: "%{count} items"
```

### Flutter/ARB (ICU format)
```json
{
  "itemCount": "{count, plural, =0{No items} =1{One item} other{{count} items}}"
}
```

### Plural forms by language
Not all languages have the same plural rules. Account for this:

| Language | Plural forms | Rule |
|----------|-------------|------|
| English | 2 (one, other) | n == 1 → one |
| French | 2 (one, other) | n <= 1 → one |
| Russian | 3 (one, few, many) | Complex |
| Arabic | 6 forms | Very complex |
| Japanese | 1 (no plurals) | Always other |
| Polish | 4 forms | Complex |

Generate plural forms for all language-specific categories, not just English ones.

---

## Common Anti-Patterns

### ❌ Using the string value as the key
```json
{"Save Changes": "Save Changes"}
```
**Problem:** Changing the English text breaks all code references. The key is not
a stable identifier.

**Fix:**
```json
{"common.save_changes": "Save Changes"}
```

### ❌ Overly generic keys
```json
{
  "button": "Save",
  "title": "Settings",
  "error": "Something went wrong"
}
```
**Problem:** These will collide immediately. Every page has a button, title, error.

**Fix:** Always namespace: `settings.profile.save_button`, `settings.page.title`

### ❌ Encoding context in the value, not the key
```json
{"greeting": "Hello (shown on dashboard after login)"}
```
**Problem:** The value is the translatable string. Notes belong in metadata or comments.

**Fix:** Use a `@key` description (ARB), translator comment (PO), or a `_comment` convention.

### ❌ Duplicate keys with different values
```json
{
  "save": "Save",
  "save_button": "Save",
  "submit": "Save"
}
```
**Problem:** Translators translate the same string 3 times. Changes must be made in 3 places.

**Fix:** Use `common.save` once, reference it everywhere.

### ❌ Dynamic key construction without documentation
```typescript
// This cannot be statically extracted
t(`errors.${errorCode}`)
t('status.' + status)
```
**Problem:** Static analysis tools (and Rosetta) can't find all possible keys.

**Fix:** Document all possible values, or use a switch/map to explicit keys:
```typescript
const errorKeys = {
  NOT_FOUND: 'errors.not_found',
  UNAUTHORIZED: 'errors.unauthorized',
} as const;
t(errorKeys[errorCode]);
```

### ❌ HTML in translation values
```json
{"welcome": "<strong>Welcome</strong>, {name}!"}
```
**Problem:** Exposes HTML to translators, XSS risk if not handled carefully.

**Fix:** Use the framework's rich text support or split into separate keys:
```json
{
  "welcome.prefix": "Welcome",
  "welcome.suffix": "to our platform"
}
```

---

## Decision Guide

**Should this string be translated?**
- User sees it → YES
- It's a UI label, heading, button, error, tooltip → YES
- It's a log message, console output, code comment → NO
- It's a CSS class, URL, ID, API endpoint → NO
- It's hardcoded English in an error only developers see → MAYBE (flag for decision)

**How to name this key?**
1. What page/feature is it on? → first namespace segment
2. What component/section? → second segment
3. What is its role? (title, label, button, error, placeholder) → final segment
4. Is there a meaningful qualifier? (primary vs secondary, success vs error) → modifier

**Should this be a new key or reuse an existing one?**
- Same string, same meaning, reused in multiple places → reuse `common.*` key
- Same string, different context/meaning → separate keys
- When in doubt → separate keys (over-reuse causes translation issues when contexts diverge)
