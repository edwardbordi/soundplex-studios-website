# Skill: publish — ship changes to the live site, step by step

Use when the person says anything like "let's publish", "push this live",
"ship these changes", or "how do I get this onto the site". The person may
be a NON-DEVELOPER who will forget the process between publishes — so this
skill produces the complete end-to-end walkthrough EVERY time, personalized
to their actual changes, never abbreviated to "the usual commands".

## The contract

1. **Check before prescribing.** Never hand out commands blind. First run
   (read-only) in the site's repo:
   - `git status --short` — what changed
   - `git branch --show-current` — where they are
   - `git status -sb` — is the branch in sync with GitHub
   - `git log --oneline -1` — last commit, for orientation
2. **Diagnose the situation** and route accordingly (see Situations below).
3. **Write the walkthrough** with real values filled in: a branch name you
   invent from the change (kebab-case, e.g. `update-pricing-page`), a
   commit message you draft from the actual diff, and the repo's real
   GitHub URL (from `git remote get-url origin`).
4. **Plain language throughout.** One-clause definitions the first time a
   term appears: branch ("a private copy of the site to make changes on"),
   PR ("a request to fold your copy back into the live site"), merge
   ("accepting that request").

## Situations

**A. On `main` with uncommitted changes (the normal case).** Produce the
full walkthrough below.

**B. On an old feature branch.** Explain: "You're still on the branch from
a previous publish. Let's get you back to home base first." Give:
`git checkout main && git pull`, then re-check status. If their changes
came along, continue with A. If the old branch was already merged, delete
it (`git branch -d <name>`).

**C. Nothing to publish** (`git status` clean). Say so plainly — "your
local copy matches what's already published" — and stop.

**D. Anything unexpected** — merge conflicts, a diverged main, red ✗
checks on the PR, force-push suggestions from git. STOP. Do not improvise
recovery commands for a non-developer. Explain what you see in one plain
sentence and either fix it yourself (if you have shell access to the repo)
or walk them through ONE safe step at a time, checking output after each.

## The walkthrough to produce (Situation A)

Number every step. Use their real branch name/message. The shape:

---

**Step 1 — Save your changes onto a new branch.** Copy this whole block
into your terminal (Terminal app, in the site's folder) and press Enter:

```bash
git checkout main && git pull
git checkout -b <branch-name>
git add -A
git commit -m "<one-line summary of what changed>"
git push -u origin <branch-name>
```

What this does: makes sure you're starting from the latest live version,
creates a private copy (a "branch") named `<branch-name>`, saves your
changes onto it, and uploads it to GitHub.

**Step 2 — Open the pull request.** The terminal output includes a link
like `https://github.com/<owner>/<repo>/pull/new/<branch-name>` — click
it (or paste it in your browser). On that page, click the green **Create
pull request** button. A pull request ("PR") is you asking the site to
accept your changes.

**Step 3 — Wait for the checks.** On the PR page, automatic tests run
(a yellow dot while running). Wait for **green checkmarks**. Green = your
change builds correctly and every page still works. If anything shows a
red ✗, STOP — don't merge — and ask for help (or ask me: paste what you
see).

**Step 4 — Merge.** When everything is green, click **Squash and merge**,
then **Confirm**. Your change is now part of the site; hosting will
deploy it automatically within a couple of minutes.

**Step 5 — Clean up and return to home base.** Back in your terminal:

```bash
git checkout main && git pull
git branch -d <branch-name>
```

What this does: switches you back to the main copy, downloads the version
that now includes your change, and deletes the finished branch. You're
ready for the next change.

**Step 6 — Verify.** Open the live site and check your change is there
(hard-refresh: Cmd+Shift+R). Done.

---

## Rules

- NEVER instruct a push directly to `main`. Every publish goes branch →
  PR → green checks → merge. No exceptions, including "tiny" changes.
- Never use `--force`, `reset --hard`, or history rewrites in instructions
  for a non-developer. If the situation seems to need them, that's
  Situation D: stop and get help.
- Re-check `git status` fresh on every invocation. The person's memory of
  where they left off is not data; the repo is.
- One publish = one branch = one PR. If the diff contains two unrelated
  changes, say so and offer to split (but don't force it).
