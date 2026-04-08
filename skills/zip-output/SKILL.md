---
name: zip-output
description: >
  Enforces correct ZIP folder structure when Claude produces a ZIP file. Use this skill
  when the user explicitly asks for a ZIP, a downloadable archive, or says things like
  "zip it up", "package this", "make it downloadable", "export as ZIP". Do NOT trigger
  this skill proactively — only activate when a ZIP is the agreed delivery format.
  When files are being updated after an initial ZIP, do not re-ZIP automatically;
  follow the partial update rules instead.
metadata:
  author: "@shiftEscape"
  version: "1.0.0"
---

# ZIP Output — Correct Folder Structure

This skill solves one specific problem: **Claude presents a folder structure, then produces a ZIP that doesn't match it.**

It does NOT decide when to use ZIP. That decision belongs to Claude or the user. This skill only kicks in once a ZIP is already the agreed delivery format — and ensures what's inside matches what was promised.

---

## The Core Problem

Claude often presents a planned structure like this:

```
my-project/
├── index.html
├── src/
│   └── app.js
└── styles/
    └── main.css
```

Then produces a ZIP where the structure is wrong:

```
my-project.zip
├── index.html       ← loose at root, no src/ or styles/ ❌
├── app.js           ← subdirectory stripped ❌
└── main.css         ← subdirectory stripped ❌
```

**The rule:** the ZIP must exactly mirror the folder structure Claude described or the user expects. No flattening. No missing folders. No loose files at the archive root.

---

## When to Apply This Skill

| Situation                                                      | Action                                  |
| -------------------------------------------------------------- | --------------------------------------- |
| User explicitly asks for a ZIP                                 | Apply this skill when building the ZIP  |
| Claude and user have agreed ZIP is the format                  | Apply this skill                        |
| Claude is about to output multiple files with no ZIP requested | Do NOT zip — present files individually |
| A ZIP was already delivered and some files need updating       | Follow Partial Update Rules below       |

---

## ZIP Structure Rules

1. **Single root folder** — Every ZIP must have exactly one top-level folder named after the project.
2. **Structure must match what was presented** — If Claude showed a tree with `src/`, `styles/`, `components/`, those directories must exist inside the ZIP at the correct depth.
3. **No loose files at root** — Nothing sits directly at the archive root except the one root folder.
4. **No flattening** — Nested paths like `src/components/Button.jsx` must not become `Button.jsx`.
5. **Use `build_zip.py`** — Never use raw `zip` CLI or bare `zipfile` — both silently produce wrong structures.

---

## Workflow: Producing a ZIP

### Step 1 — Write the structure first

Before zipping anything, write every file to a staging folder that **exactly mirrors the planned structure**:

```
/home/claude/my-project/
├── index.html
├── src/
│   └── app.js
└── styles/
    └── main.css
```

If the structure on disk doesn't match what was presented to the user, fix it before zipping. The ZIP is a snapshot of the staging folder — garbage in, garbage out.

### Step 2 — Build the ZIP

```bash
python scripts/build_zip.py \
  /home/claude/my-project \
  /mnt/user-data/outputs/my-project.zip
```

### Step 3 — Verify the structure matches

```bash
python scripts/verify_zip.py /mnt/user-data/outputs/my-project.zip
```

Review the printed tree. Confirm it matches what was presented to the user. If it doesn't, fix the staging folder and re-run Step 2.

### Step 4 — Present

```python
present_files(["/mnt/user-data/outputs/my-project.zip"])
```

---

## Partial Update Rules

When a ZIP has already been delivered and the user asks to update files, **do not automatically re-ZIP**. Follow this:

### Some files updated (not all)

Present only the changed files individually. Tell the user which path each file belongs to so they can replace it in their local copy.

```
Here are the updated files — replace them in your local my-project/ folder:
- src/app.js  →  my-project/src/app.js
- styles/main.css  →  my-project/styles/main.css
```

### All files updated

Do not silently re-ZIP. Ask the user first:

```
All files have been updated. Would you like me to:
1. Re-ZIP everything into a new my-project.zip
2. Present all files individually
```

Then act on their choice.

### Never do this

- Re-ZIP the entire project because one file changed
- Present a partial ZIP containing only the updated files (confusing, breaks structure)
- Re-ZIP silently without informing the user

---

## Naming the Root Folder

Priority order:

1. User specified a name → use it exactly
2. Project has a clear name → derive it (lowercase, hyphen-separated)
3. Fallback → ZIP filename without extension

| Bad              | Good                 |
| ---------------- | -------------------- |
| `Project Files/` | `project-files/`     |
| `output/`        | `invoice-generator/` |
| (no root folder) | `dashboard/`         |

---

## Common Mistakes to Avoid

### `zip -r` from inside the folder — strips root folder

```bash
# Wrong
cd /home/claude/my-project && zip -r output.zip .

# Right — always zip from the parent
cd /home/claude && zip -r output.zip my-project/
```

### Python zipfile with source-relative paths — same problem

```python
# Wrong — strips root folder
zf.write(file, file.relative_to(source_dir))

# Right — use build_zip.py, which handles this correctly
```

---

## Script Reference

- `scripts/build_zip.py` — builds a correctly structured ZIP
- `scripts/verify_zip.py` — verifies ZIP tree matches expected structure
- `references/edge-cases.md` — monorepos, flat-by-request, fixing broken ZIPs, symlinks
