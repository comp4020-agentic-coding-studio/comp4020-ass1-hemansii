# Process overview

## What I built

An interactive explainer of F1 rear-wing trade-offs: one slider (0°–30°)drives a physically-shaped model of downforce, drag, corner speed, and top speed. A hand-drawn car answers it with a single glowing airflow streak — slow and blue at shallow angles, fast and rippling red once the wing stalls and rear-axle arrows that grow and shrink with the load. The same value drives a live chart below, and a collapsible section explains the four relationships behind the numbers. The constants are illustrative, not telemetry; the point is the shape — a steeper wing buys cornering grip at the cost of top speed, and past stall you lose both at once.

## The moments that mattered

1. **The drag curve was wrong in a way that looked plausible.** My first
   pass at `dragCoefficient` kept the induced-drag term (`CD0 + K·CL²`)
   past stall, so CD fell from 1.24 back toward 0.90 as angle kept rising,
   because the post-stall lift coefficient itself declines faster than the
   flat penalty I'd added could compensate. I verified the failure
   numerically before touching the fix, then decoupled post-stall drag
   from CL² entirely and wrote it into a permanent regression test —
   `dragPastStall` must be `>=` `dragAtStall` — rather than trusting
   eyeballing next time
   ([`7e1df08`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/7e1df08)).
   > "shouldn't drag stay high or keep rising post-stall since the flow's
   > separated? Can you check the CD(α) curve shape specifically and tell me
   > why it does that, or fix it if it's wrong?"

2. **A shipped invariant outranked my instruction, and both survived.**
   I asked for the "Home" link gone from the top nav. `spec/invariants.test.ts`
   requires a `<nav>` landmark, so deleting the element would have turned
   a green check red to satisfy a cosmetic request, and silently keeping
   the link would have ignored me. Removing the redundant self-link and
   adding a skip link in the landmark did both: nothing visible at the
   top, check still green, and the page more keyboard-navigable than
   before
   ([`0432167`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/0432167)).

3. **"Doesnt break on resize" turned out to be a measurable bug, not a given**
   I expected the resize check to just confirm the viewBox-based
   SVGs were already safe. Instead, comparing
   `document.documentElement.scrollWidth` against `clientWidth` at 390px
   width showed the page grew a real horizontal scrollbar once the wing
   passed stall — the rotating wing's CSS `transform` was never clipped
   by its container. The fix was one line (`overflow: hidden`), but it
   only surfaced because I measured `scrollWidth` across the full angle
   range instead of trusting that a responsive width already made resize
   safe
   ([`5b01cbb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/5b01cbb)).

4. **The accessible version of my instruction was not the literal one.**
   I asked for `aria-live="polite"` on the four stat displays and an
   `aria-label` on the slider carrying its current value. Done literally,
   both read as correct and announce badly. The stat values were
   `<output>` elements, which already carry an implicit `role="status"`
   — adding `aria-live` to each would announce a bare "4253 N" with no
   way to tell which of four numbers moved. Moving the live region up to
   the card, adding `aria-atomic`, and demoting the `<output>`s to spans
   makes it say "Downforce 4253 N" instead. The slider's value likewise
   belongs in `aria-valuetext`, which a screen reader re-reads on every
   change, not `aria-label`, which isn't re-announced once set
   ([`6d5f4f5`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/6d5f4f5)).

