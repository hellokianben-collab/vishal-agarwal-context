#!/usr/bin/env bash
# Install this repo's skills into Claude Code at USER scope, so they work in every folder.
#
#   bash tools/install-skills.sh            # install / update all 27
#   bash tools/install-skills.sh --dry-run  # show what would happen
#
# Scope matters: a skill in ./.claude/skills only exists in that one project.
# See skills/claude-code-setup-ops for why this bites and how to unpick it.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

echo "source : $REPO/skills"
echo "dest   : $DEST"
[[ $DRY -eq 1 ]] && echo "mode   : DRY RUN (nothing will be written)"
echo

mkdir -p "$DEST"

installed=0
skipped=0
for dir in "$REPO"/skills/*/; do
  name="$(basename "$dir")"
  [[ -f "$dir/SKILL.md" ]] || { echo "skip  $name (no SKILL.md)"; skipped=$((skipped+1)); continue; }

  # frontmatter name must match the directory or the skill will not register
  fm_name="$(sed -n 's/^name:[[:space:]]*//p' "$dir/SKILL.md" | head -1 | tr -d '\r')"
  if [[ -n "$fm_name" && "$fm_name" != "$name" ]]; then
    echo "WARN  $name — frontmatter name is '$fm_name'; it will not register under '$name'"
  fi

  if [[ $DRY -eq 1 ]]; then
    echo "would install  $name"
  else
    rm -rf "${DEST:?}/$name"
    cp -r "$dir" "$DEST/$name"
    echo "installed      $name"
  fi
  installed=$((installed+1))
done

echo
echo "$installed skill(s), $skipped skipped."
[[ $DRY -eq 1 ]] && exit 0

cat <<'EOF'

Next:
  1. Restart your Claude Code session — skills are read at startup.
  2. Verify:   ls ~/.claude/skills | wc -l
  3. If one does not appear under /, check three things in this order:
       - SKILL.md is at the directory ROOT (not one level deeper)
       - frontmatter `name:` matches the directory name
       - it landed in ~/.claude/skills, not ./.claude/skills
     Full diagnostic ladder: skills/claude-code-setup-ops/SKILL.md

Read AGENTS.md before starting work.
EOF
