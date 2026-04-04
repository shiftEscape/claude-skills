#!/usr/bin/env node
/**
 * Validate all skills in the repo.
 * Checks that each skill has valid SKILL.md frontmatter with:
 *   name, description, metadata.author, metadata.version
 *
 * Expected frontmatter format:
 *   ---
 *   name: my-skill
 *   description: >
 *     What this skill does.
 *   metadata:
 *     author: "@shiftEscape"
 *     version: "1.0.0"
 *   ---
 *
 * Usage:
 *   node scripts/validate.js
 */

const fs = require("fs");
const path = require("path");

const SKILLS_DIR = path.join(__dirname, "..", "skills");

let passed = 0;
let failed = 0;

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

function validateSkill(skillName) {
  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillMd = path.join(skillDir, "SKILL.md");
  const errors = [];

  // Check SKILL.md exists
  if (!fs.existsSync(skillMd)) {
    errors.push("Missing SKILL.md");
    return errors;
  }

  const content = fs.readFileSync(skillMd, "utf8");

  // Check frontmatter block
  if (!content.startsWith("---")) {
    errors.push("SKILL.md must start with YAML frontmatter");
    return errors;
  }

  const frontmatterEnd = content.indexOf("---", 3);
  if (frontmatterEnd === -1) {
    errors.push("Frontmatter block is not closed");
    return errors;
  }

  const frontmatter = content.slice(3, frontmatterEnd);

  // Required top-level fields
  if (!frontmatter.includes("name:"))
    errors.push('Missing "name" in frontmatter');
  if (!frontmatter.includes("description:"))
    errors.push('Missing "description" in frontmatter');

  // metadata: block — must exist
  if (!frontmatter.includes("metadata:")) {
    errors.push('Missing "metadata:" block in frontmatter');
  } else {
    // author — must be a non-empty value under metadata:
    const authorMatch = frontmatter.match(
      /metadata:[\s\S]*?^\s+author:\s*"?([^"\n]+)"?/m,
    );
    if (!authorMatch) {
      errors.push('Missing "author" under metadata: block');
    } else if (!authorMatch[1].trim()) {
      errors.push(
        '"metadata.author" must not be empty (e.g. author: "@shiftEscape")',
      );
    }

    // version — must be semver x.y.z under metadata:
    const versionMatch = frontmatter.match(
      /metadata:[\s\S]*?^\s+version:\s*"?([^"\n]+)"?/m,
    );
    if (!versionMatch) {
      errors.push('Missing "version" under metadata: block');
    } else {
      const v = versionMatch[1].trim();
      if (!SEMVER_RE.test(v)) {
        errors.push(
          `"metadata.version" must follow semver format (e.g. "1.0.0") — got: "${v}"`,
        );
      }
    }
  }

  // Check evals exist (warning, not error)
  const evalsPath = path.join(skillDir, "evals", "evals.json");
  if (!fs.existsSync(evalsPath)) {
    errors.push("⚠️  No evals/evals.json (recommended)");
  }

  return errors;
}

const skills = fs.readdirSync(SKILLS_DIR).filter((name) => {
  return fs.statSync(path.join(SKILLS_DIR, name)).isDirectory();
});

if (skills.length === 0) {
  console.log("No skills found in skills/");
  process.exit(0);
}

console.log(`🔍 Validating ${skills.length} skill(s)...\n`);

skills.forEach((skillName) => {
  const errors = validateSkill(skillName);
  const hardErrors = errors.filter((e) => !e.startsWith("⚠️"));
  const warnings = errors.filter((e) => e.startsWith("⚠️"));

  if (hardErrors.length === 0) {
    const warnSuffix =
      warnings.length > 0 ? ` (${warnings.length} warning)` : "";
    console.log(`✅ ${skillName}${warnSuffix}`);
    warnings.forEach((w) => console.log(`   ${w}`));
    passed++;
  } else {
    console.log(`❌ ${skillName}`);
    hardErrors.forEach((e) => console.log(`   → ${e}`));
    warnings.forEach((w) => console.log(`   ${w}`));
    failed++;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) process.exit(1);
