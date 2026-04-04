---
name: zip-output
description: >
  Ensures Claude always produces ZIP files with the correct internal folder structure when delivering multi-file outputs. Use this skill whenever the user asks Claude to: generate a project, scaffold a codebase, deliver multiple files for download, create a ZIP archive, bundle outputs, or says things like "zip it up", "give me the files", "package this for me", "create a project structure", "make it downloadable", or "export as ZIP". Also trigger when Claude is about to write more than 2 files that belong together — even if the user hasn't mentioned ZIP yet. The skill enforces correct folder hierarchy inside the archive so files unzip into a clean, properly named root folder instead of dumping loose files into the current directory.
---

# ZIP Output — Correct Folder Structure

Claude has a well-known failure mode: when producing ZIP files, it dumps files flat at the archive root instead of nesting them inside a properly named folder. This skill eliminates that.

**The rule is simple:** every ZIP must unzip into exactly one root folder named after the project.

---

## The Problem

When a user asks for a project ZIP, Claude often produces:

```
my-project.zip
├── index.html          ← loose at root ❌
├── style.css           ← loose at root ❌
└── app.js              ← loose at root ❌
```

Unzipping this dumps files directly into wherever the user runs the command — polluting their directory.

**What it should look like:**

```
my-project.zip
└── my-project/         ← single root folder ✅
    ├── index.html
    ├── style.css
    └── app.js
```

---

## Rules to Always Follow

1. **Single root folder** — Every ZIP must contain exactly one top-level folder named after the project (e.g. `my-project/`, `invoice-app/`, `portfolio/`).
2. **Folder name matches ZIP name** — If the file is `dashboard.zip`, the root folder inside must be `dashboard/`.
3. **No loose files at root** — Nothing sits directly at the archive root except that one folder.
4. **Nested structure preserved** — All subdirectories (`src/`, `public/`, `components/`, etc.) live inside the root folder, not flattened.
5. **Use the script** — Always use `scripts/build_zip.py` to create the archive. Never use raw `zip` CLI commands or Python `zipfile` without the wrapper, as they silently produce the wrong structure.

---

## Workflow

### Step 1 — Write all files to disk first

Write every file to a staging folder under `/home/claude/<project-name>/`. Maintain the exact folder hierarchy the user expects:

```
/home/claude/my-project/
├── index.html
├── src/
│   └── app.js
└── styles/
    └── main.css
```

### Step 2 — Run the packaging script

```bash
python /home/claude/zip-outputs/zip-output/scripts/build_zip.py \
  /home/claude/my-project \
  /mnt/user-data/outputs/my-project.zip
```

The script enforces the single-root-folder rule automatically — no manual configuration needed.

### Step 3 — Verify the structure (optional but recommended for complex projects)

```bash
python /home/claude/zip-outputs/zip-output/scripts/verify_zip.py \
  /mnt/user-data/outputs/my-project.zip
```

This prints the ZIP tree and confirms the root folder rule is satisfied. If verification fails, it exits with a non-zero code and explains what's wrong.

### Step 4 — Present the file

```python
present_files(["/mnt/user-data/outputs/my-project.zip"])
```

---

## Naming the Root Folder

Use this priority order to determine the root folder name:

1. **User specified it** — e.g. "call it `invoice-generator`" → use that exactly
2. **Project has an obvious name** — derive from the main file, repo name, or topic
3. **Fallback** — use the ZIP filename without extension

Always lowercase, hyphen-separated. No spaces. No version suffixes unless the user asked for them.

| Bad root name | Good root name |
|---|---|
| `Project Files/` | `project-files/` |
| `My App (1)/` | `my-app/` |
| `output/` | `invoice-generator/` |
| (none — files at root) | `dashboard/` |

---

## Common Mistake Patterns to Avoid

### ❌ Wrong: `zip -r` from inside the folder

```bash
cd /home/claude/my-project && zip -r /output/my-project.zip .
# Produces: my-project.zip/index.html (no root folder!)
```

### ✅ Right: `zip -r` from the parent folder

```bash
cd /home/claude && zip -r /output/my-project.zip my-project/
# Produces: my-project.zip/my-project/index.html ✓
```

### ❌ Wrong: Python zipfile with relative paths from inside

```python
with zipfile.ZipFile("out.zip", "w") as zf:
    for f in Path("my-project").rglob("*"):
        zf.write(f, f.relative_to("my-project"))  # strips root folder!
```

### ✅ Right: Use the provided script (it handles this correctly)

```bash
python scripts/build_zip.py /home/claude/my-project /mnt/user-data/outputs/my-project.zip
```

---

## Script Reference

See `scripts/build_zip.py` — creates a correctly structured ZIP.
See `scripts/verify_zip.py` — verifies a ZIP has correct single-root-folder structure.
See `references/edge-cases.md` — handling monorepos, flat outputs, and special cases.
