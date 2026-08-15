# Process overview

A reading-guide to how the work came together --- a map to your process, not an
essay about it. Markers read this file and follow its citations; they don't
trawl the repo for evidence you didn't point at, so if a moment mattered, cite
it.

This file is the shape; the course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement, and its
[word counts](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#word-counts)
cover every deliverable.

## What I built

An interactive explainer of F1 rear-wing angle trade-offs: one slider (0°--30°)
drives a physically-shaped model of downforce, drag, corner speed, and top
speed, with the slider doubling as the x-axis under a live line chart. The
point isn't the exact numbers --- the constants are illustrative, not telemetry
--- it's the shape: more wing buys cornering grip at the cost of straight-line
speed, and past the wing's stall angle you lose both at once.

## The moments that mattered

1. **The drag curve was wrong in a way that looked plausible.** My first pass
   at `dragCoefficient` kept the same `CD0 + K·CL²` drag-polar term past stall,
   so CD *fell* from 1.24 back toward 0.90 as angle kept rising --- because the
   post-stall lift coefficient itself declines, shrinking the CL² term faster
   than the flat stall penalty I'd added could compensate. I caught this by eye
   from a printed table, but the fix wasn't "add a bigger penalty": I verified
   the failure numerically in Python first, then decoupled post-stall drag from
   the declining CL² term entirely (`CD = CD_at_stall + climb_rate·(angle -
   stall)`), and wrote it into a permanent regression test rather than trusting
   eyeballing next time --- `dragPastStall` must be `>=` `dragAtStall`,
   asserted in
   [`7e1df08`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/7e1df08).
   > "shouldn't drag stay high or keep rising post-stall since the flow's
   > separated? Can you check the CD(α) curve shape specifically and tell me
   > why it does that, or fix it if it's wrong?"

2. **Scope crept in through my own wording before the agent could build it.**
   Mid-conversation I asked for a "lap-time curve" alongside corner speed and
   top speed --- a metric that doesn't exist in the model I'd actually locked
   in. Rather than let the agent quietly synthesize a lap-time formula to match
   what I'd said, it stopped in plan mode and asked whether to add lap time or
   keep the two derived speeds; I picked the latter, which kept the model to
   what I could actually sanity-check by hand instead of a formula neither of
   us had verified
   ([`7e1df08`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/7e1df08)).

3. **The Astro base-path trap is invisible until you check for it.** The
   `stack` skill's conversion script sets the GitHub Pages `base` path from the
   repo's origin remote, but a wrong base looks identical to a right one on
   `localhost` and only 404s once deployed. Before committing the conversion, I
   ran `pnpm dev` and loaded the site under `/comp4020-ass1-hemansii/` rather
   than at the server root, confirming the page and its assets actually
   resolved under the path the live site would use
   ([`1e9aff7`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/1e9aff7)).

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that the
current reflection entry is in `reflections/`, and that your `CLAUDE.md` is
there --- before a marker ever opens the file. It checks that your map is
traceable, not that it is good: the marker judges whether your small,
deliberately chosen set of moments shows real judgement and reflection. A green
check is not a substitute for that curation.

Images are deliberately not checked, because whether one renders is visible the
moment you look. Open this file on GitHub and look at it before you ship.
