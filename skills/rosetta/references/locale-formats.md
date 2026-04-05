# Locale File Formats Reference

Load this file when working with locale files — reading, writing, converting, or
validating them. Covers structure, quirks, and conversion patterns per format.

---

## Table of Contents
1. [JSON](#json)
2. [YAML](#yaml)
3. [ARB (Flutter)](#arb)
4. [PO / POT (gettext)](#po--pot)
5. [XLIFF](#xliff)
6. [Format comparison](#format-comparison)
7. [Converting between formats](#converting-between-formats)

---

## JSON

Most common format for JS/TS frameworks.

### Flat structure
```json
{
  "save": "Save",
  "cancel": "Cancel",
  "welcome_message": "Welcome, {name}!"
}
```

### Nested structure
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "auth": {
    "login": {
      "title": "Log in",
      "button": "Log in",
      "error": "Invalid credentials"
    }
  }
}
```

### Reading nested keys in code
- next-intl: `t('auth.login.title')` or scoped `useTranslations('auth.login')` → `t('title')`
- react-i18next: `t('auth:login.title')` with namespaces
- vue-i18n: `$t('auth.login.title')`

### Quirks
- JSON doesn't support comments — use a `"_comment"` key convention if needed
- Key order is not guaranteed in all parsers — don't rely on order
- All values must be strings (or objects for nesting) — no numbers, no booleans
- Missing trailing comma = parse error — validate JSON before committing

### Validation
```bash
# Quick JSON validation
node -e "JSON.parse(require('fs').readFileSync('en.json', 'utf8'))"

# Or with jq
jq . en.json > /dev/null
```

---

## YAML

Common in Rails, some Vue setups. More human-readable than JSON.

### Structure
```yaml
en:
  common:
    save: "Save"
    cancel: "Cancel"
  auth:
    login:
      title: "Log in"
      error: "Invalid credentials for %{email}"
  users:
    items:
      one: "%{count} item"
      other: "%{count} items"
```

### Quirks
- Indentation is significant — use spaces, never tabs
- Top-level key must match the locale code (`en:`, `es:`, etc.)
- Pluralization uses `one:` / `other:` sub-keys (Rails convention)
- Interpolation uses `%{variable}` (different from JSON frameworks)
- Strings with special chars (`:`, `#`, `[`, etc.) need quotes

### Multiline strings
```yaml
en:
  terms:
    # Literal block (preserves newlines)
    text: |
      Line one.
      Line two.
    # Folded block (newlines become spaces)
    summary: >
      This is a long paragraph that
      wraps across multiple lines.
```

### Validation
```bash
ruby -e "require 'yaml'; YAML.load_file('config/locales/en.yml')"
# or
python3 -c "import yaml; yaml.safe_load(open('en.yml'))"
```

---

## ARB

Flutter's Application Resource Bundle format. JSON with metadata.

### Structure
```json
{
  "@@locale": "en",
  "@@last_modified": "2026-01-15",

  "appTitle": "My App",
  "@appTitle": {
    "description": "The application title"
  },

  "greeting": "Hello, {userName}!",
  "@greeting": {
    "description": "Greeting shown on home screen",
    "placeholders": {
      "userName": {
        "type": "String",
        "example": "Alice"
      }
    }
  },

  "itemCount": "{count, plural, =0{No items} =1{One item} other{{count} items}}",
  "@itemCount": {
    "description": "Number of items in cart",
    "placeholders": {
      "count": {
        "type": "int"
      }
    }
  },

  "price": "Price: {amount}",
  "@price": {
    "placeholders": {
      "amount": {
        "type": "double",
        "format": "currency",
        "optionalParameters": {
          "decimalDigits": 2
        }
      }
    }
  }
}
```

### Rules
- Every key needs a corresponding `@key` metadata entry
- `description` is required in `@key`
- Placeholder types must be declared: `String`, `int`, `double`, `DateTime`, `num`
- Key names use camelCase
- `@@locale` must match the filename (e.g. `app_es.arb` → `"@@locale": "es"`)
- Plural syntax follows ICU format inside curly braces

### Quirks
- `@`-prefixed keys are metadata, not translatable — don't translate them
- Generated Dart code uses the key as the method name — keep keys valid Dart identifiers
- Running `flutter gen-l10n` regenerates the Dart bindings — must run after any ARB change

---

## PO / POT

GNU gettext format. Used in PHP, Python (Django), C, some Ruby projects.

### POT file (template, source strings)
```po
# Translation template
# Copyright (C) 2026
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\n"

#: src/views/home.py:15
#, python-format
msgid "Welcome, %(name)s!"
msgstr ""

#: src/views/cart.py:42
#, python-format
msgid "%(count)s item"
msgid_plural "%(count)s items"
msgstr[0] ""
msgstr[1] ""
```

### PO file (translated)
```po
# Spanish translation
msgid "Welcome, %(name)s!"
msgstr "¡Bienvenido, %(name)s!"

msgid "%(count)s item"
msgid_plural "%(count)s items"
msgstr[0] "%(count)s elemento"
msgstr[1] "%(count)s elementos"
```

### Flags
- `fuzzy` — translation needs review (marked by translators)
- `python-format` — uses `%(var)s` style
- `c-format` — uses `%s`, `%d` style

### Quirks
- `msgid` is the source string itself (not a key) — changing source text breaks the link
- `msgstr ""` means untranslated — blank is the marker, not a missing key
- Plural forms vary by language (`nplurals=6` for Arabic, `nplurals=3` for Russian)
- Comments starting with `#.` are translator notes, `#:` are source references

### Tools
```bash
# Extract strings
xgettext -d myapp -o locale/myapp.pot src/**/*.py

# Initialize a new language
msginit -i locale/myapp.pot -o locale/es/LC_MESSAGES/myapp.po -l es

# Update existing translations with new strings
msgmerge -U locale/es/LC_MESSAGES/myapp.po locale/myapp.pot

# Compile to binary (required for runtime use)
msgfmt locale/es/LC_MESSAGES/myapp.po -o locale/es/LC_MESSAGES/myapp.mo
```

---

## XLIFF

XML Localization Interchange File Format. Enterprise standard, iOS, Angular.

### XLIFF 1.2
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" target-language="es" datatype="plaintext">
    <body>
      <trans-unit id="intro.title">
        <source>Welcome to our app</source>
        <target>Bienvenido a nuestra aplicación</target>
        <note>Shown on the home screen</note>
      </trans-unit>
      <trans-unit id="auth.login.button">
        <source>Log in</source>
        <target state="needs-review-translation">Iniciar sesión</target>
      </trans-unit>
    </body>
  </file>
</xliff>
```

### XLIFF 2.0
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xliff xmlns="urn:oasis:names:tc:xliff:document:2.0" version="2.0"
       srcLang="en" trgLang="es">
  <file id="f1">
    <unit id="intro.title">
      <segment>
        <source>Welcome to our app</source>
        <target>Bienvenido a nuestra aplicación</target>
      </segment>
    </unit>
  </file>
</xliff>
```

### State values
- `initial` — not started
- `translated` — machine or first-pass translation
- `needs-review-translation` — translated but needs human review
- `final` — approved and ready

### Quirks
- Verbose format — not human-friendly to edit manually
- `id` is the translation key
- iOS uses XLIFF for its built-in localization (`NSLocalizedString`)
- Angular's built-in i18n outputs XLIFF — use `ng extract-i18n`

---

## Format Comparison

| Format | Human-readable | Comments | Plurals | Used by |
|--------|---------------|----------|---------|---------|
| JSON (flat) | ✅ | ❌ | Library-specific | Most JS frameworks |
| JSON (nested) | ✅ | ❌ | Library-specific | next-intl, vue-i18n |
| YAML | ✅✅ | ✅ | Built-in (Rails) | Rails, some Vue |
| ARB | Moderate | Via `@key` | ICU | Flutter |
| PO | Moderate | ✅ | Built-in | Python, PHP, C |
| XLIFF | ❌ (XML) | ✅ | Built-in | Enterprise, iOS, Angular |

---

## Converting Between Formats

### JSON → YAML
```python
import json, yaml

with open('en.json') as f:
    data = json.load(f)

with open('en.yml', 'w') as f:
    yaml.dump({'en': data}, f, allow_unicode=True, default_flow_style=False)
```

### YAML → JSON
```python
import json, yaml

with open('en.yml') as f:
    data = yaml.safe_load(f)

# Remove top-level locale key if present
content = data.get('en', data)

with open('en.json', 'w') as f:
    json.dump(content, f, ensure_ascii=False, indent=2)
```

### JSON → ARB
```python
import json

def json_to_arb(source_json: dict, locale: str) -> dict:
    arb = {"@@locale": locale}
    for key, value in source_json.items():
        arb[key] = value
        arb[f"@{key}"] = {"description": f"Translation for {key}"}
    return arb

with open('en.json') as f:
    source = json.load(f)

with open('app_en.arb', 'w') as f:
    json.dump(json_to_arb(source, 'en'), f, ensure_ascii=False, indent=2)
```

### Flatten nested JSON
```python
def flatten(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)
```

### Unflatten to nested JSON
```python
def unflatten(d, sep='.'):
    result = {}
    for key, value in d.items():
        parts = key.split(sep)
        target = result
        for part in parts[:-1]:
            target = target.setdefault(part, {})
        target[parts[-1]] = value
    return result
```
