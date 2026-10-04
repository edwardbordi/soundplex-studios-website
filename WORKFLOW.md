> ⚠️ **After creating a repo from this template — or after any repo transfer** — branch protection
> on `main` and "automatically delete head branches" do NOT carry across. Re-apply them in the new
> repo's Settings, or the guardrails this file describes silently aren't there.

# Workflow — shipping a change without fighting Git

`main` is protected: you can't push straight to it. Every change goes on a **branch**, becomes a
**pull request (PR)**, passes **CI**, and gets **merged** on GitHub. That sounds like a lot of
terminal commands — but you can do the whole thing from **buttons in VS Code**. This guide sets that
up once, then it's a five-click loop.

Not a developer? That's fine. Follow the one-time setup, then the everyday loop. You never have to
memorize a Git command.

---

## One-time setup (do once, then forget it)

**1. Stamp your commits with the right email.** So the "Commit" button in VS Code records the correct
author automatically (no flags to type ever again). You run this **once and never again** — it's
written to a config file on your computer, not something you re-type each time you open VS Code.

Use the `--global` form so it applies to **every** repo on your machine, including every future site
you clone from this template — a true one-time thing:

```bash
git config --global user.email you@example.com
git config --global user.name "Your Name"
```

(If you ever need a *different* email for one specific repo, run it inside that repo without
`--global` — `git config user.email other@example.com` — and it overrides the global setting for that
repo only. You rarely will.)

**2. Let GitHub clean up branches for you.** On GitHub → your repo → **Settings → General** → check
**"Automatically delete head branches."** Now merging a PR deletes the branch automatically — so the
messy "delete the old branch" cleanup step simply disappears.

**3. Install the VS Code GitHub extension.** In VS Code, open Extensions (the squares icon), search
**"GitHub Pull Requests"** (by GitHub — id `GitHub.vscode-pull-request-github`), install it, and sign
in to GitHub when prompted.

That's it. You won't touch these again.

---

## The everyday loop (all buttons, no commands)

Every time you want to make a change:

1. **Start a branch.** Click the branch name in the bottom-left status bar → **"Create new branch"**
   → give it a short name (e.g. `add-services-page`). You're now safely off `main`.

2. **Make your edits.** Change files as normal. VS Code tracks what changed.

3. **Commit + push.** Open the **Source Control** panel (the branch-y icon in the left rail). Type a
   short message describing the change, click **Commit**, then **Publish Branch** (first time) or
   **Sync Changes**. Your work is now on GitHub.

4. **Open the PR.** In the **GitHub Pull Requests** panel (also in the left rail), click **Create
   Pull Request**. This starts the automated checks (CI).

5. **Wait for the green check, then Merge.** When the **`build`** check passes (a green ✓), click
   **Merge** and choose **Squash and merge**. GitHub merges your change into `main` and — thanks to
   the setting above — deletes the branch for you.

6. **Return to `main`.** Click the branch name in the status bar → switch to **`main`** → click the
   **Sync Changes** button. You're back on the latest, ready for the next change.

---

## Why the checks matter (don't skip the green ✓)

The PR won't let you merge until CI passes. CI runs the same three checks you can run locally:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

If the check is **red**, click **Details** on the PR to see what failed — it's usually one of the
[laws in `AGENTS.md`](AGENTS.md) catching a mistake (a missing SEO field, a raw `<img>`, a typo in
frontmatter). Fix it, commit again on the same branch, and the check re-runs automatically. This is
the guardrail doing its job — a broken page can't reach your live site.

---

## When something looks stuck

- **"I can't push to main."** Correct — that's the protection. Make a branch (step 1) and open a PR.
- **The Merge button is greyed out.** The `build` check hasn't gone green yet, or someone needs to
  approve. Wait for the ✓, or open **Details** to see what's blocking.
- **VS Code says my branch is "behind."** Click **Sync Changes** — it pulls the latest `main` in.
- **I committed to the wrong place / want to start over.** Nothing is live until a PR is merged. You
  can always make a fresh branch from `main` and redo it — no harm done.

---

## Prefer the terminal?

The exact same loop as commands, for reference:

```bash
git checkout main && git pull
git checkout -b my-change
# ...edit files...
git add -A
git commit -m "Describe the change"
git push -u origin my-change
# open the PR on GitHub, wait for the green check, Squash-merge (auto-deletes branch)
git checkout main && git pull        # back to latest
```

Either path is fine — the buttons and the commands do the same thing.
