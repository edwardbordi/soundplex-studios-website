# Releasing the template

Two repos, one tree:

- **site-starter** — where the work happens. PR Law: branch → PR → CI green → squash-merge.
- **site-starter-pro** — what customers clone. Its `main` is a byte-for-byte mirror of
  site-starter's `main` (only `"name"` in package.json differs), advanced one release at a
  time as a single `vN: summary` commit with a `vN` tag. Customers never see the work-in-progress.

## Cut a release

From a clean `main` in both repos (the script checks):

```
cd ~/dev/site-starter
npm run release:pro -- 1.5 "Help center; US spelling (admin 0.14.0)"
```

The script mirrors the tree, restores the pro name, runs `npm install`, `npm run build`
and the Playwright suite in the pro checkout, then commits, tags and pushes. If anything
fails it stops before committing; fix in site-starter (via PR), then run it again.

Version numbers: bump the minor for features (1.4 → 1.5), the patch for fixes (1.5 → 1.5.1).

## When Studio changed

Studio (`@realiizlabs/admin`) is a public npm package. After a realiiz-admin change: bump its
version and `releaseNotes` in package.json, `npm publish`. Every site — including this
template — gets the update as a Dependabot PR on **Monday morning** (sooner if you trigger it:
Insights → Dependency graph → Dependabot → Check for updates), and owners install it from
Studio (the strip, or Settings → Studio → Update). A template release is only needed when
files in this repo change.

This only works on repos where the dependency graph has been switched on (README step 2). If a
site never shows updates, that step was skipped: run the two commands there and trigger a check.
The cadence and the Help center's "Studio updates" articles both say Monday — change them together.

## Updating a site built from the template

Studio updates: nothing to do — see above. Template updates (new pages, config): from the
site's repo, with `template` pointing at site-starter-pro,

```
git fetch template --tags
git checkout -b chore/template-<new>
git diff --binary v<old> v<new> -- . ':!package-lock.json' ':!README.md' ':!AGENTS.md' | git apply --3way
npm install
npm run build && npx playwright test
```

Sites created with GitHub's "Use this template" have no shared history with the template, so
a merge is not possible — the diff-and-apply above is the supported path. Resolve any
"both modified" files by keeping the site's version unless the template change is wanted.

## History

Read `git log --oneline` in site-starter-pro — one line per release, newest first.
