#!/usr/bin/env bash
# Release site-starter's main to site-starter-pro as one "vN: summary" commit + tag.
# Usage:  npm run release:pro -- 1.5 "Help center; US spelling (admin 0.14.0)"
# See RELEASE.md. Never run this from a dirty or non-main site-starter checkout.
set -euo pipefail

VERSION="${1:?version required, e.g. 1.5}"
SUMMARY="${2:?one-line summary required}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
PRO="${PRO_DIR:-$SRC/../site-starter-pro}"

[ -d "$PRO/.git" ] || { echo "site-starter-pro not found at $PRO (set PRO_DIR)"; exit 1; }

cd "$SRC"
[ "$(git branch --show-current)" = "main" ] || { echo "site-starter must be on main"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "site-starter has uncommitted changes"; exit 1; }
git pull -q

cd "$PRO"
[ "$(git branch --show-current)" = "main" ] || { echo "site-starter-pro must be on main"; exit 1; }
[ -z "$(git status --porcelain | grep -v "Claude outputs/")" ] || { echo "site-starter-pro has uncommitted changes"; exit 1; }
git pull -q
git rev-parse -q --verify "refs/tags/v$VERSION" >/dev/null && { echo "tag v$VERSION already exists"; exit 1; }

echo "→ mirroring site-starter → site-starter-pro"
rsync -a --delete \
  --exclude .git --exclude node_modules --exclude .next \
  --exclude test-results --exclude playwright-report --exclude "Claude outputs" \
  --exclude LICENSE \
  "$SRC/" "$PRO/"
# LICENSE is excluded above because it exists only in pro: site-starter carries no
# Realiiz branding, and pro is the copy that gets licensed to agencies. Without the
# exclude, --delete would remove it on every release.
# The other intentional difference between the repos.
node -e '
  const fs=require("fs");const p="package.json";const j=JSON.parse(fs.readFileSync(p,"utf8"));
  j.name="site-starter-pro";fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n");
'

echo "→ install, build, test"
npm install --no-audit --no-fund
npm run build
npx playwright test

echo "→ commit + tag v$VERSION"
git add -A
git commit -m "v$VERSION: $SUMMARY"
git tag "v$VERSION"
git push && git push --tags
echo "✓ site-starter-pro v$VERSION released"
