#!/usr/bin/env bash
# Fetch the third-party skills Vishal also runs.
#
# They are NOT vendored into this repo — they carry their own licences and release
# cadences, and a stale copy of someone else's skill is worse than no copy.
# Source list: skills/manifest.json -> third_party
#
#   bash tools/install-third-party.sh

set -euo pipefail
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
mkdir -p "$DEST"

clone() {  # clone <repo-url> <dest-name>
  local url="$1" name="$2"
  if [[ -d "$DEST/$name/.git" ]]; then
    echo "update  $name"
    git -C "$DEST/$name" pull --ff-only --quiet || echo "  (pull failed, leaving as-is)"
  else
    echo "clone   $name"
    rm -rf "${DEST:?}/$name"
    git clone --depth 1 --quiet "$url" "$DEST/$name" || echo "  (clone failed — check the URL)"
  fi
}

echo "Third-party skills → $DEST"
echo

clone https://github.com/pbakaus/impeccable.git   impeccable
clone https://github.com/emilkowalski/skill.git   emil-design-eng

echo
echo "The Vercel skill set (MIT) ships many skills in one repo — use their installer:"
echo "  npx skills add vercel-labs/skills"
echo "It provides: deploy-to-vercel, vercel-cli-with-tokens, vercel-optimize,"
echo "vercel-react-best-practices, vercel-composition-patterns, vercel-react-native-skills,"
echo "vercel-react-view-transitions, web-design-guidelines, writing-guidelines."
echo
echo "Plugins (they carry hooks + statuslines, so they install differently):"
echo "  caveman        github:JuliusBrussee/caveman            — token-efficient output, always on here"
echo "  ui-ux-pro-max  github:nextlevelbuilder/ui-ux-pro-max-skill"
echo "Add the marketplace, then enable the plugin — see skills/claude-code-setup-ops."
echo
echo "Everything installs at USER scope. A project-local install only exists in that folder."
