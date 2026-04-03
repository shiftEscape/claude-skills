#!/usr/bin/env bash
# Install all skills into .claude/skills/ for Claude Code
# Run from the repo root: bash scripts/install-all.sh

set -e

SKILLS_DIR="$(dirname "$0")/../skills"
TARGET_DIR=".claude/skills"

if [ ! -d "$SKILLS_DIR" ]; then
  echo "❌ skills/ directory not found. Run from repo root."
  exit 1
fi

mkdir -p "$TARGET_DIR"

count=0
for skill_dir in "$SKILLS_DIR"/*/; do
  skill_name=$(basename "$skill_dir")
  if [ -f "$skill_dir/SKILL.md" ]; then
    cp -r "$skill_dir" "$TARGET_DIR/$skill_name"
    echo "✅ Installed: $skill_name → $TARGET_DIR/$skill_name"
    ((count++))
  fi
done

echo ""
echo "✅ $count skill(s) installed into $TARGET_DIR"
echo "   Restart Claude Code or run /reload-plugins to activate."
