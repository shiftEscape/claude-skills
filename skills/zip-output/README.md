# zip-output

> Fixes a common pain point: when asked to produce a ZIP file, Claude often dumps files flat at the archive root instead of nesting them inside a properly named folder. This skill enforces the correct structure every time.

A Claude Skill by [@shiftEscape](https://github.com/shiftEscape)

## The Problem

Without this skill, Claude produces ZIPs like this:

```
my-project.zip
├── index.html        ← loose at root ❌
├── style.css         ← loose at root ❌
└── app.js            ← loose at root ❌
```

Unzipping this pollutes your current directory with loose files. With this skill installed, you always get:

```
my-project.zip
└── my-project/       ← single root folder ✅
    ├── index.html
    ├── style.css
    └── app.js
```

## When It Triggers

This skill activates whenever you ask Claude to:

- Generate a project or scaffold a codebase for download
- "Zip it up", "give me the files", "package this", "make it downloadable"
- Export as ZIP or create an archive
- Produce more than 2 related files that belong together (even without mentioning ZIP)
- Only zips it if needed - Asks the user first before proceeding

## Installation

**Claude.ai / Claude Code:**

1. Download `zip-output.skill` from [Releases](../../releases)
2. Go to **Settings → Skills → Install from file**
3. Upload the `.skill` file

**Manual (Claude Code):**

```bash
cp -r zip-output .claude/skills/zip-output
```

Produces `dist/zip-output.skill`.

## License

MIT — see [LICENSE](../../LICENSE)
