---
name: write-post
description: Interview the writer and produce a complete, publishable blog post — draft, verified citations, hero image, frontmatter — that satisfies the frontmatter contract and content laws. Use whenever someone wants to write, draft, plan or publish a post, even if they only say "write something about X", or when they're stuck on what to write.
---

# write-post

This produces a finished post: an MDX file at `content/blog/<slug>.mdx` that passes the `.strict()`
frontmatter schema (`src/lib/blog/schema.ts`), with verified sources and a hero image. The person
you're working with should have to think about what they want to say, and about nothing else.

**Read `content/blog/_template.mdx` before you start** — it holds the field-level detail this file
deliberately doesn't repeat.

## Why the long version of this skill exists

Two things make posts work, and both are easy to lose.

**The voice is a real person's.** A post drafted from a bare topic comes back competent and
anonymous, and a few of those in a row and the site stops sounding like anyone.

**Every factual claim has to be true.** On a previous site built from this template, a pre-launch
audit found five misattributed studies in the first six posts: a researcher credited with an
interview she wasn't in, a figure from one experiment presented as the result of two, a chart
described as a ranking when it's a benchmark. Every one was written confidently and read fine.
That is what makes this failure mode dangerous, and why the source check happens *before* the
sentence gets written rather than after.

## 1 · Interview first. Don't draft yet.

**Ask one question at a time and wait for the answer.** A list of six questions gets six short
answers; a conversation gets the material.

- **What have you actually been noticing?** Not the topic — the observation.
- **Who is the one person you're writing this for?** A specific person beats a demographic, and it
  changes the whole register.
- **What would you say to them if they asked you over coffee?** Whatever they say here, in these
  words, is the spine of the post.
- **What do you know that a general article wouldn't?**
- **Is there advice about this you think is wrong?** Disagreement is the fastest route to a post
  that isn't interchangeable with everyone else's.

**Then read it back**: "So the piece is really about X, for someone who Y, and the thing you'd push
back on is Z — have I got that?" If they hand you a voice memo or notes instead, better — work from
it and only ask what's missing.

## 2 · Read two existing posts

Before drafting, read two posts from `content/blog/` — the closest in subject. Don't take a
description of the voice from a doc; go and hear it: sentence rhythm, how much is conceded before a
point is made, the habits of the writer.

## 3 · Check every source BEFORE you write the claim

For each factual claim the post will make:

1. **Fetch the actual source.** Not an article about the source — the paper, the release, the advisory.
2. **Find the sentence that supports the claim** and hold onto it.
3. **Write the claim to match that sentence.** If the study found 23%, the post says 23% — not
   "about a quarter", not "nearly a third".
4. **If you can't verify it, the claim doesn't go in.** Not softened, not hedged. Out.

The five traps that recur:

- **Attributing a linked page to the wrong person.** A journalist quoting a researcher is not the
  researcher speaking.
- **Pooling results across studies.** A number from Study 1 is not the finding of "a pair of
  experiments".
- **Reading a ranking into a comparison chart.** Benchmarks put things side by side; they don't
  order them.
- **Press-release rounding attributed to the paper.** Cite the paper → use the paper's numbers.
- **Present tense about third parties.** "X maintains a directory" is a claim about today — check
  the page still exists before writing it.

Tell the writer what you verified and what you dropped.

## 4 · Draft it

- **Open on the reader's problem in their words.** Get the focus keyword in naturally.
- **`##` headings** to break it up — they drive the section rail + anchors.
- **Name the limits.** Honesty about what the thing can't do is what makes the rest believable.
- **End with something small and specific** the reader can do this week.

Internal links are paths (`/about`, `/blog/<slug>`); external links are full `https://` URLs and get
the outbound arrow automatically.

**Then show them the draft and ask what doesn't sound like them** — that question gets better edits
than "what do you think?".

## 5 · The hero image

`heroImage` is required — the build fails without it. Target: `/public/blog/<slug>.webp`, ~1024px
wide, under 250KB (generators return enormous files; resize before committing). If replacing an
existing hero, use a `-2` suffix rather than overwriting — Next caches optimized images by URL.

**Write `heroImageAlt` from what is actually IN the image** — look at the file, don't restate the
prompt or the post title. Generators ignore instructions ("no text, no logos") often enough that you
must check the output, not the prompt.

If the site keeps an image-prompt log in `design-process/`, append the prompt you used — a hero with
no recorded prompt can't be regenerated to match, only replaced.

## 6 · Frontmatter

Copy `content/blog/_template.mdx` and fill every field. The two that bite:

- **`slug` must equal the filename** without `.mdx`. ⚠️ Nothing checks this — if they drift, the
  post quietly lives at an address nobody expects. Copy-paste it.
- **`focusKeyword`** should appear in the title, description, first paragraph and at least one `##`
  heading — but only where it reads naturally.

## 7 · Verify + ship

`npm run build` catches a missing field, bad date or malformed tag list while it's cheap. Then open
a PR — never commit to `main` (PR Law). For a client site, propose the post (idea → draft → publish)
and stop for approval at each gate; don't auto-publish.

## If they just want to think out loud

Sometimes the answer to "what should I write about?" is a conversation, not a post. Have that
conversation. A page of half-formed ideas beats a mediocre post published today.
