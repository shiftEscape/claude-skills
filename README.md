# claude-skills

A personal monorepo of Claude Skills — reusable instruction packages that teach Claude
how to perform specific tasks in a repeatable, grounded way.

Skills work across **Claude.ai**, **Claude Code**, and the **Claude API**. Build once,
use everywhere.

---

## Skills

| Skill                              | Description                                                                                                        | Install                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [spec-forge](./skills/spec-forge/) | Ingest any API spec or SDK docs and become a grounded expert — generate code, validate integrations, diff versions | [📦 Download](./skills/spec-forge/spec-forge.skill) |

---

## Getting Started

### Install a skill in Claude.ai

1. Download the `.skill` file from the table above
2. Go to **Settings → Skills → Install from file**
3. Upload the `.skill` file
4. The skill activates automatically when relevant

### Install a skill in Claude Code

```bash
# From this repo directly
npx skills add https://github.com/YOUR_USERNAME/my-claude-skills --skill spec-forge

# Or manually — copy the skill folder into your project
cp -r skills/spec-forge .claude/skills/spec-forge
```

### Install all skills at once (Claude Code)

```bash
npm run install-all
```

---

## Repo Structure

```
claude-skills/
├── skills/                   # One folder per skill
│   └── spec-forge/
│       ├── SKILL.md          # Skill instructions + frontmatter (required)
│       ├── evals/            # Test cases for the skill
│       │   └── evals.json
│       ├── references/       # Reference docs loaded on demand
│       └── assets/           # Templates, fonts, icons used in output
├── scripts/                  # Repo-level utilities
│   ├── package-all.sh        # Package all skills into .skill files
│   └── install-all.sh        # Install all skills into Claude Code
├── .github/
│   └── workflows/
│       └── validate.yml      # CI: validate all skills on push
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── package.json
```

---

## Building a New Skill

1. Create a new folder under `skills/`
2. Add a `SKILL.md` with YAML frontmatter:

```markdown
---
name: your-skill-name
description: >
  What this skill does and when to trigger it. Be specific — this
  description is how Claude decides whether to load your skill.
---

# Your Skill Name

[Instructions here...]
```

3. Add test cases to `skills/your-skill/evals/evals.json`
4. Run `npm run package -- your-skill-name` to generate the `.skill` file
5. Open a PR — CI will validate the skill structure automatically

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

---

## Scripts

| Command                      | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `npm run package -- <skill>` | Package a single skill into a `.skill` file |
| `npm run package:all`        | Package all skills                          |
| `npm run validate`           | Validate all skill structures               |
| `npm run install-all`        | Install all skills into `.claude/skills/`   |

---

## License

MIT — see [LICENSE](./LICENSE)
