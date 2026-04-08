# claude-skills

A collection of curated Claude Skills — reusable instruction packages that teach Claude
how to perform specific tasks in a repeatable, grounded way.

Skills work across **Claude.ai**, **Claude Code**, and the **Claude API**. Build once,
use everywhere.

---

## Skills

| Skill                              | Description                                                                                                               | Install                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [spec-forge](./skills/spec-forge/) | Ingest any API spec or SDK docs and become a grounded expert — generate code, validate integrations, diff versions        | [📦 Download](./skills/spec-forge/spec-forge.skill) |
| [zip-output](./skills/zip-output/) | Ensures Claude always produces ZIPs with the correct folder structure — files unzip into a clean root folder, never loose | [📦 Download](./skills/zip-output/zip-output.skill) |

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
