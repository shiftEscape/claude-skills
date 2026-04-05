# claude-skills

A collection of curated Claude Skills — reusable instruction packages that teach Claude
how to perform specific tasks in a repeatable, grounded way.

Skills work across **Claude.ai**, **Claude Code**, and the **Claude API**. Build once,
use everywhere.

## Skills

| Skill                              | Description                                                                                                        | Version | Install                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------- | --------------------------------------------------- |
| [spec-forge](./skills/spec-forge/) | Ingest any API spec or SDK docs and become a grounded expert — generate code, validate integrations, diff versions | 1.0.0   | [📦 Download](./skills/spec-forge/spec-forge.skill) |
| [rosetta](./skills/rosetta/)       | Automate i18n workflows — extract strings, audit coverage, validate consistency, set up localization from scratch  | 1.0.0   | [📦 Download](./skills/rosetta/rosetta.skill)       |
| [zip-output](./skills/zip-output/) | Ensures ZIP files always unzip into a clean single root folder — never loose files at archive root                 | 1.0.0   | [📦 Download](./skills/zip-output/zip-output.skill) |

## Getting Started

### Install a skill in Claude.ai

1. Download the `.skill` file from the table above
2. Go to **Settings → Skills → Install from file**
3. Upload the `.skill` file
4. The skill activates automatically when relevant

### Install a skill in Claude Code

```bash
# Copy a single skill into your project
cp -r skills/spec-forge .claude/skills/spec-forge

# Or install all skills at once
npm run install-all
```

This copies every skill folder into `.claude/skills/` in your current working directory.
Restart Claude Code or run `/reload-plugins` to activate.

## Repo Structure

```
claude-skills/
├── skills/                        # One folder per skill
│   ├── spec-forge/
│   │   ├── SKILL.md               # Skill instructions + frontmatter (required)
│   │   ├── README.md              # Skill-level documentation (required)
│   │   ├── evals/
│   │   │   └── evals.json         # Test cases
│   │   └── references/            # Reference docs loaded on demand
│   │       ├── openapi-cheatsheet.md
│   │       ├── auth-patterns.md
│   │       └── code-gen-patterns.md
│   ├── rosetta/
│   │   ├── SKILL.md
│   │   ├── README.md
│   │   ├── evals/
│   │   │   └── evals.json
│   │   └── references/
│   │       ├── frameworks.md
│   │       ├── locale-formats.md
│   │       └── key-conventions.md
│   └── zip-output/
│       ├── SKILL.md
│       ├── README.md
│       ├── evals/
│       │   └── evals.json
│       ├── references/
│       │   └── edge-cases.md
│       └── scripts/
│           ├── build_zip.py
│           └── verify_zip.py
├── scripts/
│   ├── validate.js                # Validate all skill structures
│   ├── package.js                 # Package skills into .skill files
│   └── install-all.sh             # Install all skills into Claude Code
├── .github/
│   └── workflows/
│       └── validate.yml           # CI: validate + package on push
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── package.json
```

## Building a New Skill

1. Create a new folder under `skills/`
2. Add a `SKILL.md` with YAML frontmatter:

```markdown
---
name: your-skill-name
metadata:
  author: "@shiftEscape"
  version: "1.0.0"
  tags: [tag1, tag2]
description: >
  What this skill does and when to trigger it. Be specific — this
  description is how Claude decides whether to load your skill.
---

# Your Skill Name

[Instructions here...]
```

3. Add a `README.md` describing the skill for the repo
4. Add test cases to `evals/evals.json`
5. Add reference files to `references/` if needed
6. Run `npm run package -- your-skill-name` to generate the `.skill` file
7. Update the Skills table in this README
8. Open a PR — CI will validate automatically

## Scripts

| Command                      | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `npm run package -- <skill>` | Package a single skill into a `.skill` file |
| `npm run package:all`        | Package all skills                          |
| `npm run validate`           | Validate all skill structures               |
| `npm run install-all`        | Install all skills into `.claude/skills/`   |

## Validation

The validator checks every skill for:

**Hard errors** (fail CI):

- Missing `SKILL.md`
- Missing or malformed YAML frontmatter
- Missing `name` or `description` field
- Invalid `evals/evals.json` (malformed JSON)

**Warnings** (logged, don't fail CI):

- Missing `README.md`
- Missing `evals/evals.json`
- Missing `metadata.author`
- Missing `metadata.version`

Run `npm run validate -- --strict` to treat warnings as errors.

## License

MIT — see [LICENSE](./LICENSE)
