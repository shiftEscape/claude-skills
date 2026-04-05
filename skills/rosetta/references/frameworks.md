# i18n Framework Reference

Load this file when the user mentions a specific framework or asks how to set up
i18n in their stack. Covers setup, configuration, usage patterns, and common pitfalls
per framework.

---

## Table of Contents
1. [next-intl (Next.js)](#next-intl)
2. [react-i18next](#react-i18next)
3. [i18next (vanilla)](#i18next)
4. [vue-i18n (Vue / Nuxt)](#vue-i18n)
5. [Angular i18n / ngx-translate](#angular)
6. [Flutter (ARB / gen-l10n)](#flutter)
7. [Rails (i18n gem)](#rails)
8. [Python (gettext / Babel)](#python)
9. [Choosing a library](#choosing-a-library)

---

## next-intl

**Best for:** Next.js App Router and Pages Router

### Install
```bash
npm install next-intl
```

### File structure
```
/messages/
  en.json
  es.json
  fr.json
next.config.js
middleware.ts  ← handles locale routing
```

### Configuration (App Router)
```typescript
// i18n.ts
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

const locales = ['en', 'es', 'fr'];

export default getRequestConfig(async ({locale}) => {
  if (!locales.includes(locale as any)) notFound();
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
```

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es', 'fr'],
  defaultLocale: 'en'
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
```

### Usage in components
```typescript
// Server component
import {useTranslations} from 'next-intl';

export default function Page() {
  const t = useTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}

// Client component
'use client';
import {useTranslations} from 'next-intl';
```

### Locale file format (JSON, nested)
```json
{
  "HomePage": {
    "title": "Welcome",
    "description": "Hello, {name}!"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

### Pluralization
```json
{
  "items": "{count, plural, =0 {No items} one {# item} other {# items}}"
}
```

### Common pitfall
next-intl uses ICU message format for pluralization and interpolation. Placeholders
use `{name}` syntax, not `{{name}}` (that's vue-i18n) or `%{name}` (that's Rails).

---

## react-i18next

**Best for:** React apps (CRA, Vite, React Native)

### Install
```bash
npm install react-i18next i18next
# Optional backends
npm install i18next-http-backend i18next-browser-languagedetector
```

### File structure
```
/public/locales/
  en/
    common.json
    auth.json
  es/
    common.json
    auth.json
```

### Configuration
```typescript
// i18n.ts
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    ns: ['common', 'auth'],
    defaultNS: 'common',
    interpolation: {escapeValue: false}, // React already escapes
  });

export default i18n;
```

### Usage
```typescript
import {useTranslation} from 'react-i18next';

function LoginButton() {
  const {t} = useTranslation('auth');
  return <button>{t('login.button')}</button>;
}

// With namespace in hook
const {t} = useTranslation(['common', 'auth']);
```

### Locale format
```json
// public/locales/en/auth.json
{
  "login": {
    "button": "Log in",
    "error": "Invalid credentials for {{email}}"
  }
}
```

### Interpolation syntax
`{{variable}}` — double curly braces (different from next-intl's single braces)

### Pluralization
```json
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} items"
}
```

---

## i18next

**Best for:** Non-React JS, Node.js, vanilla JS

### Install
```bash
npm install i18next
```

### Usage
```typescript
import i18next from 'i18next';

await i18next.init({
  lng: 'en',
  resources: {
    en: {translation: {key: 'Hello world'}},
    es: {translation: {key: 'Hola mundo'}}
  }
});

i18next.t('key'); // 'Hello world'
```

---

## vue-i18n

**Best for:** Vue 2, Vue 3, Nuxt

### Install
```bash
npm install vue-i18n@9  # Vue 3
npm install vue-i18n@8  # Vue 2
```

### Configuration (Vue 3)
```typescript
// i18n.ts
import {createI18n} from 'vue-i18n';

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {common: {save: 'Save'}},
    es: {common: {save: 'Guardar'}}
  }
});
```

### Usage
```vue
<template>
  <button>{{ $t('common.save') }}</button>
  <p>{{ $t('welcome', {name: userName}) }}</p>
</template>

<script setup>
import {useI18n} from 'vue-i18n';
const {t} = useI18n();
</script>
```

### Interpolation syntax
`{variable}` — single curly braces (same as next-intl)

### Pluralization
```json
{
  "apple": "no apples | one apple | {count} apples"
}
```
```vue
{{ $tc('apple', 0) }} // no apples
{{ $tc('apple', 1) }} // one apple
{{ $tc('apple', 5) }} // 5 apples
```

---

## Angular

**Best for:** Angular apps

### Two options

**Option A: Angular built-in i18n (compile-time)**
- Uses XLIFF files
- Requires separate build per locale
- Best for large enterprise apps

```html
<h1 i18n="Site header|An introduction header@@introductionHeader">
  Hello, World!
</h1>
```

**Option B: ngx-translate (runtime)**
```bash
npm install @ngx-translate/core @ngx-translate/http-loader
```

```typescript
// Usage
import {TranslateService} from '@ngx-translate/core';

constructor(private translate: TranslateService) {
  translate.setDefaultLang('en');
}
```

```html
{{ 'HELLO' | translate }}
{{ 'HELLO' | translate: {value: 'world'} }}
```

### Locale format (ngx-translate)
```json
{
  "HELLO": "Hello {{value}}"
}
```

---

## Flutter

**Best for:** Flutter / Dart cross-platform apps

### Setup
```yaml
# pubspec.yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.0

flutter:
  generate: true
```

```yaml
# l10n.yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
```

### ARB file format
```json
// lib/l10n/app_en.arb
{
  "@@locale": "en",
  "helloWorld": "Hello World!",
  "@helloWorld": {
    "description": "The conventional newborn programmer greeting"
  },
  "hello": "Hello {userName}",
  "@hello": {
    "description": "A message with a user name parameter",
    "placeholders": {
      "userName": {
        "type": "String",
        "example": "Bob"
      }
    }
  },
  "nItems": "{count, plural, =0{no items} one{1 item} other{{count} items}}",
  "@nItems": {
    "placeholders": {
      "count": {"type": "int"}
    }
  }
}
```

### Generate code
```bash
flutter gen-l10n
```

### Usage
```dart
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

Text(AppLocalizations.of(context)!.helloWorld)
Text(AppLocalizations.of(context)!.hello('Alice'))
```

### Key convention for ARB
Use camelCase keys (not dot-notation). Each key needs a `@key` metadata entry
with at least a `description`. Placeholder types must be declared.

---

## Rails

**Best for:** Ruby on Rails

### Built-in, no gem needed

### File structure
```
/config/locales/
  en.yml
  es.yml
  fr.yml
```

### YAML format
```yaml
# config/locales/en.yml
en:
  common:
    save: "Save"
    cancel: "Cancel"
  users:
    greeting: "Hello, %{name}!"
    items:
      one: "%{count} item"
      other: "%{count} items"
```

### Usage
```ruby
I18n.t('common.save')                    # => "Save"
I18n.t('users.greeting', name: 'Alice')  # => "Hello, Alice!"
I18n.t('users.items', count: 3)          # => "3 items"
```

### In views (ERB)
```erb
<%= t('common.save') %>
<%= t('users.greeting', name: current_user.name) %>
```

### Interpolation syntax
`%{variable}` — percent-brace (different from JS frameworks)

---

## Python

**Best for:** Django, Flask, FastAPI

### Django (built-in)
```python
# settings.py
LANGUAGE_CODE = 'en-us'
USE_I18N = True
LOCALE_PATHS = [BASE_DIR / 'locale']

# In views/templates
from django.utils.translation import gettext_lazy as _

class MyModel(models.Model):
    name = models.CharField(_('name'), max_length=100)

# In template
{% load i18n %}
{% trans "Welcome" %}
{% blocktrans with name=user.name %}Hello, {{ name }}{% endblocktrans %}
```

### Extract strings
```bash
django-admin makemessages -l es
django-admin compilemessages
```

### PO file format
```po
#: myapp/views.py:10
msgid "Welcome"
msgstr "Bienvenido"

#: myapp/models.py:5
msgid "Hello, %(name)s"
msgstr "Hola, %(name)s"
```

---

## Choosing a Library

Use this when the project has no i18n library yet:

| Stack | Recommended | Reason |
|-------|-------------|--------|
| Next.js App Router | `next-intl` | Best App Router support, RSC compatible |
| Next.js Pages Router | `next-intl` or `react-i18next` | Both mature |
| React (Vite/CRA) | `react-i18next` | Most flexible, huge ecosystem |
| Vue / Nuxt | `vue-i18n` | Official, best Nuxt support |
| Angular | `ngx-translate` | Simpler than built-in for most apps |
| Flutter | Built-in `gen-l10n` | Official, ARB format |
| Rails | Built-in `I18n` | No gem needed |
| Node.js (non-React) | `i18next` | Framework-agnostic |
| Django | Built-in | No pip needed |

**When NOT to use a library:**
If the app only ever supports one language and has no plans to expand, i18n adds
complexity with no benefit. Say so clearly rather than recommending setup.
