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
speed. The slider sits beneath a hand-drawn car whose airflow answers it --- a
single glowing streak arcing over the body, slow, smooth and blue at shallow
angles, fast, rippling and red once the wing stalls --- with arrows on the rear
axle that grow and shrink with the load. The same value drives a live line chart
below it, and a collapsible section at the foot of the page sets out the four
relationships behind the numbers. The point isn't the exact numbers --- the
constants are illustrative, not telemetry --- it's the shape: tilting the wing
steeper buys cornering grip at the cost of straight-line speed, and past the
wing's stall angle you lose both at once.

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

4. **A shape "fix" isn't verified until you look at the rendered pixels, not
   the path coordinates.** My first two passes at the car-visual chassis
   (rounded hill, then a sharper wedge) still let the silhouette overlap the
   wheel circles, because I was reasoning from the `d` string instead of the
   screenshot. The fix that actually held was mechanical: confine every raised
   part of the body path to x-ranges that don't intersect either wheel's
   x-span, then confirm it with an `agent-browser` screenshot at both marking
   viewports rather than trusting the geometry by eye
   ([`807b7e4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/807b7e4)).

5. **Reference art you can look at isn't reference art you can use.** I asked
   for the car to be redrawn "in a similar style" to an uploaded F1
   illustration, then caught that it was copyrighted fan art carrying real
   sponsor livery (Ferrari, Shell, Santander) --- not something safe to trace
   into a page that deploys publicly under my name. I had the agent treat it as
   a loose proportion reference only (nose height, wheel exposure, halo shape)
   and draw an original, unbranded silhouette from scratch instead, landing in
   [`059c013`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/059c013).

6. **"Doesn't break on resize" turned out to be a real, measurable bug, not a
   given.** I asked for the resize/drag accessibility check as a should-still-be-true
   sanity pass, expecting it to just confirm the viewBox-based SVGs were already
   resolution-independent. Instead, `document.documentElement.scrollWidth` vs
   `clientWidth` at 390px width showed the page actually grew a real horizontal
   scrollbar (390 → 397px) once the wing angle passed stall, because the
   rotating wing SVG's painted extent --- a CSS `transform`, not a layout
   change --- was never clipped by its container. The fix was one line
   (`overflow: hidden` on `.car-scene`), but it only surfaced because I checked
   `scrollWidth` across the full angle range instead of trusting that
   `viewBox` + responsive width already made resize safe
   ([`5b01cbb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/5b01cbb)).

7. **A font in the stylesheet is not a font on the page.** The dark-theme pass
   read as correct in the diff and in a screenshot, so I shipped it
   ([`1b96a9b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/1b96a9b)).
   Looking at the actual page, only the headings had changed. The cause was
   invisible in review: body copy declared `Inter`, which was never in the
   Google Fonts request, so it fell back to the system sans while the
   `font-family` line read as deliberate. The one-line fix mattered less than
   the check I didn't have --- `document.fonts.check()` in the browser, not the
   stylesheet, is what tells you a typeface actually loaded
   ([`d894afc`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/d894afc)).
   > "You did not change the font it does not match the theme"

8. **The fonts I picked couldn't legally ship.** I asked for Redline for the
   headings and Automove for everything else. Neither is on Google Fonts, so
   both would have to be committed into a repo that goes public and served to
   every visitor --- redistribution, which donationware and personal-use-only
   licences don't cover. Automove is also uppercase-only display type its own
   foundry recommends against body text, so "everything else" would have made
   the explainer unreadable at paragraph size. I took Google-hosted stand-ins
   with the same character (Orbitron, Chakra Petch) and kept body copy on a
   text face
   ([`0432167`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/0432167)).
   > "use the font "REDLINE" as the headers etc and "AUTOMOVE" for any other
   > info"

9. **"Works locally" can mean "works because of a file only I have."** The car
   image rendered on my machine and showed a broken icon on the deploy. I gave
   three hypotheses to rule out: filename case, the Pages base path, and
   whether the file was actually committed. The first two were clean; `public/`
   was untracked, so every build except mine had no image to copy into `dist/`.
   Checking the base path anyway surfaced a second, latent bug --- the relative
   `./car.png` resolves to `/car.png` if the page is ever served without its
   trailing slash --- so it moved to an absolute `import.meta.env.BASE_URL`
   path before it could bite
   ([`0432167`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/0432167)).
   > "Confirm the file is actually committed and not just sitting locally."

10. **A shipped invariant outranked my instruction, and both survived.** I
    asked for the "Home" link gone from the top of the page.
    `spec/invariants.test.ts` requires a `<nav>` landmark, so deleting the
    element would have turned a green check red to satisfy a cosmetic request,
    and silently keeping the link would have ignored me. Removing the
    redundant self-link and putting a skip link in the landmark did both:
    nothing visible at the top, check still green, and the page keyboard-
    navigable in a way it wasn't before
    ([`0432167`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/0432167)).

11. **Continuous in the code is not continuous to the eye.** The airflow
    switched colour, speed and waviness at exactly the stall angle and read as
    three toggles firing together. Fixing it was structural rather than
    numeric: the streamlines are now generated at runtime from the drawing's
    own contour instead of swapped between two pre-baked path arrays, and the
    dash phase is integrated per frame rather than handed to a CSS animation,
    because changing `animation-duration` mid-drag jumps the animation to a new
    position instead of bending its speed. Even then the last degrees before
    stall measured only 15% slower than stalled, which I couldn't see at all;
    easing the speed curve widened that to 38%. Measuring the gap was the only
    reason I knew "smooth" still wasn't legible
    ([`698cabb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/698cabb)).
    > "line speed and waviness still jump suddenly at the stall point instead
    > of transitioning gradually"

12. **I misread my own drawing, and the check was to go and look at it.** I
    told the agent the downforce arrows were sitting on the front wheel and
    to move them to the rear, where the wing's load actually acts. Instead of
    doing it, it cropped `public/car.png` and read the two ends off the
    artwork: the low-x end has the tall rear-wing box, the halo hoop and the
    wider rear tyre; the high-x end has the long nose and the flat front
    wing. The car faces right, so the arrows were already on the rear wheel.
    Obeying me would have put them on the front; ignoring me would have left
    a real complaint unanswered, because they *were* far enough forward to
    read as front. Shifting them back to straddle the rear-wheel centre under
    the wing answered what I meant rather than what I said
    ([`56d24ff`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/56d24ff)).
    > "move the downforce arrows from the front wheel to the rear wheel/wing
    > area, that's where the wing's downforce actually acts"

13. **The accessible version of my instruction was not the literal one.** I
    asked for `aria-live="polite"` on the four stat displays and an
    `aria-label` on the slider carrying its current value. Done literally,
    both produce markup that reviews as correct and announces badly. The stat
    values were `<output>` elements, which carry an implicit `role="status"`
    --- they were already live regions before I asked --- so adding
    `aria-live` to each would have announced a bare "4253 N" with no way to
    tell which of four numbers had moved. Moving the region up to the card,
    adding `aria-atomic`, and demoting the `<output>`s to spans is what makes
    it say "Downforce 4253 N". The slider's value likewise belongs in
    `aria-valuetext` rather than the label: `aria-valuetext` is what a screen
    reader re-reads on every change, while an accessible name that shifts
    under the user isn't re-announced at all. The label instead opens with
    the visible label's exact words, because `aria-label` overrides `<label>`
    and WCAG 2.5.3 wants the name to contain what's on screen
    ([`6d5f4f5`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/6d5f4f5)).

14. **Two contradictory notes from me were both correct at once.** First I
    said the box behind the car didn't match the car's greys; once it did, I
    said it no longer matched the rest of the page. Sampling `public/car.png`
    showed why both were true: the drawing's greys are `#403338`, hsl(337 11%
    22%) --- a warm plum --- against a panel of `#15171d`, a cool blue-grey.
    Opposed hues, not a brightness problem, which is why it read as two
    different materials rather than as too light or too dark. The car is warm
    and the page is cool, so no single flat colour could satisfy both notes
    and chasing either one was always going to break the other. The fix was
    to stop treating it as a colour at all: the panel became a lit garage
    bay, base in the page's cool family with a warm overhead light pooled
    where the car sits, over a coarser carbon weave than the body's
    ([`63eaa7a`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/63eaa7a),
    then
    [`6d5f4f5`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-hemansii/commit/6d5f4f5)).
    > "now that box does not match with the rest of the color palette of the
    > webpage"

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that the
current reflection entry is in `reflections/`, and that your `CLAUDE.md` is
there --- before a marker ever opens the file. It checks that your map is
traceable, not that it is good: the marker judges whether your small,
deliberately chosen set of moments shows real judgement and reflection. A green
check is not a substitute for that curation.

Images are deliberately not checked, because whether one renders is visible the
moment you look. Open this file on GitHub and look at it before you ship.
