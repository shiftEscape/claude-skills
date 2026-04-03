#!/usr/bin/env node
/**
 * Package one or all skills into .skill files.
 *
 * Usage:
 *   node scripts/package.js spec-forge        ← package one skill
 *   node scripts/package.js --all            ← package all skills
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SKILLS_DIR = path.join(__dirname, "..", "skills");
const OUTPUT_DIR = path.join(__dirname, "..", "dist");

function getSkillDirs() {
  return fs.readdirSync(SKILLS_DIR).filter((name) => {
    const skillPath = path.join(SKILLS_DIR, name);
    return (
      fs.statSync(skillPath).isDirectory() &&
      fs.existsSync(path.join(skillPath, "SKILL.md"))
    );
  });
}

function validateSkill(skillDir) {
  const skillMd = path.join(skillDir, "SKILL.md");
  const content = fs.readFileSync(skillMd, "utf8");

  if (!content.startsWith("---")) {
    throw new Error("SKILL.md must start with YAML frontmatter (---)");
  }

  const frontmatterEnd = content.indexOf("---", 3);
  if (frontmatterEnd === -1) {
    throw new Error("SKILL.md frontmatter is not closed");
  }

  const frontmatter = content.slice(3, frontmatterEnd);
  if (!frontmatter.includes("name:")) {
    throw new Error('SKILL.md frontmatter must include a "name" field');
  }
  if (!frontmatter.includes("description:")) {
    throw new Error('SKILL.md frontmatter must include a "description" field');
  }
}

function packageSkill(skillName) {
  const skillDir = path.join(SKILLS_DIR, skillName);

  if (!fs.existsSync(skillDir)) {
    console.error(`❌ Skill not found: ${skillName}`);
    process.exit(1);
  }

  try {
    validateSkill(skillDir);
  } catch (err) {
    console.error(`❌ Validation failed for ${skillName}: ${err.message}`);
    process.exit(1);
  }

  // Ensure dist/ exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Create .skill file (zip archive)
  const outputFile = path.join(OUTPUT_DIR, `${skillName}.skill`);
  try {
    execSync(
      `cd "${SKILLS_DIR}" && zip -r "${outputFile}" "${skillName}" -x "*/.*" -x "*/__pycache__/*"`,
      {
        stdio: "pipe",
      },
    );
    console.log(`✅ Packaged: ${skillName} → dist/${skillName}.skill`);
  } catch (err) {
    console.error(`❌ Failed to package ${skillName}: ${err.message}`);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.includes("--all")) {
  const skills = getSkillDirs();
  console.log(`📦 Packaging ${skills.length} skill(s)...\n`);
  skills.forEach(packageSkill);
  console.log(`\n✅ Done. Files in dist/`);
} else if (args.length > 0) {
  packageSkill(args[0]);
} else {
  console.log("Usage:");
  console.log(
    "  node scripts/package.js <skill-name>   Package a single skill",
  );
  console.log("  node scripts/package.js --all          Package all skills");
  process.exit(1);
}
