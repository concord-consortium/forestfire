# Terms of Use Link and Licensing Copy for Boreal Forest Fire Explorer

**Jira**: https://concord-consortium.atlassian.net/browse/WM-70
**Repo**: https://github.com/concord-consortium/forestfire
**Implementation Spec**: [implementation.md](implementation.md)
**Status**: **In Development**

## Overview

Boreal Forest Fire Explorer's About and Share dialogs get the same license and Terms of Use copy the other Geo simulations now show, replacing the old CC BY 4.0 copyright block, and its top bar and dialogs get the same keyboard and screen-reader behavior, so all six Geo apps say and do the same thing.

## Project Owner Overview

Concord published its non-commercial Terms of Use at concord.org/terms-of-use in September. Tectonic, Seismic, Flood, Wildfire and Hurricane Explorer already show the new copy and a Terms of Use link in their About and Share dialogs (TE-10, SE-4, FM-5, WM-67, HURR-70). Boreal Forest Fire Explorer (forestfire.concord.org) is built from its own repository, so none of those stories reached it: it still says its content is under a Creative Commons license and has no Terms of Use link, and it is still in use.

This story brings it in line with the others "exactly": the same two paragraphs with the product name and host swapped, the same 12px copyright line, the same links opening in a new tab, and the same top-bar and dialog behavior Kiley Brown asked for after reviewing the other Geo branches. Kiley reviews the result on the branch deploy before merge, and it ships as Forest Fire 1.2.1.

## Background

The five earlier Geo stories settled every shared question (copy, link targets, `rel`, year, placement, dialog behavior, top-bar buttons, test standards) and are merged. WM-70's Jira text and AI instructions ask for the same result here, and name WM-67 (concord-consortium/wildfire-model PR #157) as the template, with FM-5 (concord-consortium/flooding-model PR #72) as a second reference.

Forestfire's `src/components/geohazard-components/` is a local copy of the shared geohazard top bar, and its stack matches Wildfire's (React 18, MobX 6, MUI 5.15). Its top bar is closest to Flood's starting point: no read-only mode, no stores, no `observer`, and the same `top-bar.scss` (Reload, Share and About as `<span onClick>`, Reload's icon pushed down by `margin-top: 4px`). Its dialog is Wildfire's starting point: an MUI 5 `Dialog` whose title is a `<div>` and whose close control is a bare `<CloseIcon onClick>`. So the plan ports WM-67's license component, dialog and tests, and FM-5's top-bar styling (inset focus ring, Reload icon pulled to the 21px row).

On master today (checked in the code):

- `about-dialog-content.tsx` and `share-dialog-content.tsx` both end with `<Copyright licenseUrl=".../forestfire/blob/master/LICENSE" />`. `Copyright` (`geohazard-components/top-bar/copyright.tsx`) renders a 0.8em paragraph: "Copyright © {year} The Concord Consortium. All rights reserved. The software is licensed under the MIT license. The content is licensed under a Creative Commons Attribution 4.0 International License. Please provide attribution to the Concord Consortium and the URL http://concord.org." Nothing else uses it.
- The top bar always renders: `app.tsx` mounts `TopBar` unconditionally, with no URL parameter or embed mode that hides it. The app has no Activity Player wrapper, so it loads in a plain iframe (such as the Share dialog's own 1000 × 800 embed code) as well as standalone.
- The dialog has no accessible name (MUI 5 only names the paper from `aria-labelledby`, which is not passed), no `aria-modal` on the `role="dialog"` element, and no keyboard-reachable close control. MUI already gives it `role="dialog"`, a focus trap, Esc close and backdrop-click close.
- Nothing can open over About or Share on its own: the app has no other dialog, no timer- or simulation-driven overlay, and no coach mark. Its highest z-index is the bottom bar's 1000, below MUI's modal layer (1300). The only `window.alert` (`use-show-coords-interaction.tsx`, an authoring aid behind `showCoordsOnClick`) needs a click on the 3D canvas, which the dialog's backdrop blocks. Full screen uses `screenfull.request()` with no element, so it takes the whole document and the dialog's portal stays visible.
- LICENSE is MIT and the default branch is `master`.
- CI (`.github/workflows/ci.yml`) runs Cypress through `cypress-io/github-action@v5`. HURR-70 found that GitHub's current runner (Node 24 for JavaScript actions) makes the action's wait for the dev server fail on the first refused connection, which only `@v7.4.4` and later retry; Hurricane, Wildfire and Flood moved to `@v7`. The deploy uses static AWS keys; the switch to OIDC is DEV-193 and not part of this story.

## Requirements

### License copy

- **R1. One license-copy component** renders the copy below and is the last block of both the About and the Share dialog content, replacing `<Copyright />` in each. `geohazard-components/top-bar/copyright.tsx` is deleted. Share's "Suggested citation" paragraph stays, before the copy.
- **R2. Copy, word for word** (the other Geo apps' copy with the product and host swapped), in this order:
  - Paragraph 1: **Boreal Forest Fire Explorer is free, open-source software.** The Boreal Forest Fire Explorer source code is released under the [MIT License], so you’re welcome to use, modify, and build on it.
  - Paragraph 2: **Your use of Boreal Forest Fire Explorer at forestfire.concord.org** is governed by our [Terms of Use]. The hosted version is free for non-commercial use; commercial use requires a separate written agreement. For more information, visit [concord.org/licensing] or contact [licensing@concord.org].
  - Copyright line: `© {current year} The Concord Consortium, Inc.`
  - The leading phrase of each paragraph is bold. "you’re" uses the curly apostrophe U+2019, as the other Geo apps do (the story's typed copy has a straight one).
- **R3. Text size**: the two paragraphs use the dialogs' existing paragraph style; the copyright line is exactly 12px, replacing the old block's 0.8em.
- **R4. Year** is `new Date().getFullYear()` at render time. No range and no build-time constant.
- **R5. The old text is gone** from both dialogs: no "Creative Commons", "CC BY" or "All rights reserved".

### Links

- **R6. Link targets**, kept in one constants module rather than inline in JSX:
  - MIT License: `https://github.com/concord-consortium/forestfire/blob/master/LICENSE`
  - Terms of Use: `https://concord.org/terms-of-use/`
  - concord.org/licensing: `https://concord.org/licensing`
  - licensing@concord.org: `mailto:licensing@concord.org`
- **R7. Web links open in a new tab**: the three web links have `target="_blank"` and `rel="noopener noreferrer"` (the other Geo apps' value, a superset of the story's `rel="noopener"`), and append visually hidden text " (opens in a new tab)", so each one's accessible name is its visible text plus the hint. The mailto link is a plain same-tab `<a>` named by its text alone.
- **R8. Links in the copy are underlined.**

### Reachability

- **R9. No other new surface**: no top-bar Terms of Use item, no heading over the copy, no links row. The top bar shows in every way the app runs (standalone, Activity Player, a plain iframe), so the copy is reachable wherever the app runs; the story's requirement 4 needs nothing more here, and no corner link is added.
- **R10. Top-bar buttons**:
  - **Reload, Share and About are each a `<button type="button">`**, looking as before: Share and About in the bar's 17px text, Reload as MUI's 24px Refresh icon, all `#797979` with `#434343` on hover, in the same places, with no button border, background or padding. They keep `data-testid="reload"`, `"share"` and `"about"`, Reload's `TopBarReloadButtonClicked` log and reload, and the `ShareDialogOpened` and `AboutDialogOpened` logs.
  - **Reload is named "Reload"** by `aria-label`, with a matching `title` tooltip, as in the other Geo apps.
  - Each shows a visible focus ring on keyboard focus, drawn inset so all four sides fall inside the 22px top bar.
  - **Tab visits them in their on-screen order**, left to right: Reload, Share, About.

### Dialog behavior

- **R11. Both dialogs**:
  - keep MUI's `role="dialog"`, focus trap, Esc close and backdrop-click close, and carry `aria-modal="true"` on the `role="dialog"` element, which MUI 5 does not set;
  - are named by their visible title ("About: Boreal Forest Fire Explorer", "Share: Boreal Forest Fire Explorer"), which becomes a level-2 heading;
  - have a real `<button type="button" aria-label="Close">` in place of the bare icon, with a visible focus ring;
  - put focus on that Close button every time they open, including a reopen during the close animation;
  - return focus to the Share or About button that opened them after Esc, Close or a backdrop click, including when the click that opened them did not focus the button (macOS Safari and Firefox do not focus a button on click).
- **R12. Only one dialog is ever open, and it is on top.** About and Share are the app's only dialogs and each is modal, so one cannot open over the other, and nothing opens over them on its own (see Background); Esc therefore always closes the dialog the user sees. They draw above every other part of the app, including in full screen. No z-index change is needed, unlike WM-67's coach mark.
- **R13. The dialogs look as before** apart from the copy and Close's focus ring: the same title style and close icon, in the same place.
- **R14. The dialogs fit the embed frame**: in the Share dialog's own 1000 × 800 iframe, About (now 556px tall in Chromium, 575px in Firefox) and Share (396px, 407px) fit without scrolling, under MUI's existing cap of the frame height less 64px, which scrolls the dialog inside itself in a shorter frame. No new height cap.

### Unchanged

- **R15.** The About dialog's descriptive paragraphs and its creator and NSF credit line, and their links, are unchanged (including their `rel="noreferrer"` without `noopener`). The Share dialog's link and embed textareas and its "Suggested citation" line are unchanged.

### Tests

- **R16. Copy tests** render the real About and Share content (not the copy component alone, so dropping it from either dialog fails) and assert, for each: the four hrefs as literal URLs written in the test, not imported constants; `target="_blank"` and `rel="noopener noreferrer"` on the three web links and neither on the mailto link; each web link's accessible name with the hint, and the mailto link's name as its text alone; the R2 copy word for word and in order, including the curly apostrophe and the two bold lead-ins; that the copy is the last block; the copyright line with the clock pinned and the year asserted as a literal, under two different pinned years; and that the R5 text is absent.
- **R17. Dialog and top-bar tests** cover: the dialog's name from its level-2 heading, `aria-modal`, focus on Close when it opens, closing from Close and on Esc; Close as a `type="button"` button; Reload as a `type="button"` button with `aria-label` and `title` of "Reload" (asserted as attributes), the first Tab stop, reloading on Enter; Share and About as `type="button"` buttons that are the second and third Tab stops, opening their dialog on Enter with focus on Close, getting focus back by Esc and by Close after a click that did not focus them, and focusing Close on a reopen during the close animation; and both dialog-opened logs.
- **R18. Cypress layout tests** (Jest applies no Sass) check that the three buttons' DOM order, which is their Tab order, runs left to right on screen, and that the copyright line computes to 12px in both dialogs.
- **R19. Every new test fails when the line it guards is removed** (checked by mutation while writing this spec). What no automated test here can see (the look of the buttons, the focus rings, the dialog in the embed frame, Enter in a real browser) is checked by hand in a browser before review.

### CI

- **R20. CI's Cypress job runs on GitHub's current runner**: `cypress-io/github-action@v5` moves to `@v7` in `.github/workflows/ci.yml`, as the first code commit, in a commit of its own whose message says why.

### Review

- **R21.** Kiley reviews the result on the branch deploy before merge (story acceptance criterion), at `https://models-resources.concord.org/forestfire/branch/add-terms-of-use-link/index.html` (also served as `https://forestfire.concord.org/branch/add-terms-of-use-link/index.html`; `s3-deploy-action` strips the leading Jira key from the branch name). Her steps, one per acceptance criterion:
  - **Copy with working links, worded as the other Geo apps**: open About, then Share; each ends with the two paragraphs and the copyright line, reading as Wildfire Explorer's do apart from "Boreal Forest Fire Explorer" and "forestfire.concord.org". MIT License, Terms of Use and concord.org/licensing each open the right page in a new tab; licensing@concord.org opens a new email.
  - **Reachable standalone and embedded**: on the branch URL, and in a page that loads it in the Share dialog's 1000 × 800 embed code, About opens and its Terms of Use link works.
  - **Keyboard and dialogs**: Tab from the page start reaches Reload, Share and About in that order with a visible ring; Enter on Share or About opens its dialog with focus on Close; Tab stays inside it; Esc or Close returns focus to the button. Enter on Reload reloads.
  - **Reviewed on the deployed branch**: these checks on the URL above are that review.

## Technical Notes

- **Where the code lives**: the copy, `ExternalLink` and the link constants in a new `src/components/license/`, as in WM-67 and FM-5; the buttons in `src/components/geohazard-components/top-bar/top-bar.tsx`; the dialog in `.../top-bar/dialog.tsx`; the focus-ring mixin in `.../geohazard-components/common.scss` (which names its dark gray `$controlText`, where Flood's names it `$controlLabel`).
- **Dialog name**: `aria-labelledby` passed to `MuiDialog` lands on the paper, pointing at the `<h2>`'s `React.useId()` id, as in WM-67. FM-5 used `aria-label` because `useId` renumbered Flood's react-tabs ids that its Cypress page objects select; forestfire's Cypress specs select only `data-testid`s and class names, so WM-67's form is safe here.
- **Focus on open**: the Fade transition's `onEnter` (through `TransitionProps`) focuses Close on every enter; `autoFocus` misses a reopen during MUI's exit fade, since the dialog stays mounted. MUI returns focus to the opener on close; the About and Share click handlers call `event.currentTarget.focus()` first so a mouse open in Safari or Firefox still has an opener to return to.
- **Focus ring**: a `focusRing($offset)` mixin, 2px solid `$controlText` on `:focus-visible`; `-2px` (inset) in the top bar, `2px` around Close. Reload's icon becomes `display: block` with `margin: -1.5px 0`, so its button is 21px tall like Share and About and the icon stays where it was.
- **Enter in Jest**: user-event 14 (already a dev dependency) activates a native `<button>` on Enter in jsdom and does not activate a `<div role="button">`, so the Enter tests fail if a button goes back to a non-button (checked by mutation). The real-browser check in R19 and R21 repeats Enter, since jsdom is not a browser. Cypress 13 cannot send a real Tab or Enter without a new dependency (`cypress-real-events`), so keyboard activation is tested in Jest and by hand rather than in Cypress, which the story's AI instructions had suggested.
- **Logging**: no new log events.
- **CI and deploy**: the repository's last push was in September 2024 and GitHub keeps no runs from then, so this branch's first push is the first CI run in over a year. Its Cypress job has the same shape as Wildfire's (no `setup-node` step, the action running on its own Node), which passes on `@v7`. The S3 Deploy job still authenticates with the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` repository secrets, last set in June 2023; whether that key is still active cannot be checked from here, and R21's branch deploy depends on it. If S3 Deploy fails on it, Ethan McElroy is asked whether forestfire's OIDC role (DEV-193) can be set up now, and the job is rerun.
- **Release** (Forest Fire 1.2.1, WM-71) follows the other Geo releases: version bump, tag, and `release.yml` copying `index-top.html`. It is a separate story.

## Out of Scope

- From the story: a third-party library acknowledgements list, changing the software license, and localizing the legal copy.
- The existing credit links in the About dialog and their `rel`.
- The Share dialog's "Suggested citation" line, including its "Forest Fire Explorer" name and 2023 date.
- Switching CI and the release workflow to OIDC (DEV-193), and the other outdated CI actions (`actions/checkout@v2`, `actions/setup-node@v2`, `codecov/codecov-action@v1`).
- The README's deployment section, which still describes Travis and a `production` branch.
- The top-bar text color: `#797979` on white is about 4.35:1, under WCAG AA's 4.5:1 for 17px text; R10 keeps the existing look, as the other Geo apps did.
- The release itself (WM-71).

## Open Questions

### RESOLVED: Judgment call: name the dialog by `aria-labelledby` (WM-67) or `aria-label` (FM-5)?
**Context**: Both name the dialog by its title. FM-5 chose `aria-label` only because `useId` renumbered react-tabs ids its Cypress page objects hardcode.
**Options considered**:
- A) `aria-labelledby` pointing at the `<h2>`, as WM-67.
- B) `aria-label={title}` on the paper, as FM-5.

**Decision**: A. Forestfire's Cypress specs select no generated ids, so FM-5's reason does not apply, and WM-67 is the story's named template.

### RESOLVED: Judgment call: inset focus ring (FM-5) or a shorter button with an outside ring (WM-67)?
**Context**: R10 needs all four sides of the ring inside the 22px bar.
**Options considered**:
- A) `outline-offset: -2px` on the unchanged 21px buttons, as FM-5.
- B) WM-67's `$buttonHeight` line-height arithmetic with a 1px outside offset.

**Decision**: A. Forestfire's `top-bar.scss` is Flood's starting file line for line, the buttons keep their boxes, and the later Geo reviews settled on the inset ring.

### RESOLVED: Judgment call: product name in the copy
**Context**: The app's title is "Boreal Forest Fire Explorer", but the Share dialog's citation line says "Forest Fire Explorer".
**Options considered**:
- A) "Boreal Forest Fire Explorer", as the story's copy and the app's title.
- B) "Forest Fire Explorer", matching the citation.

**Decision**: A. The story gives the copy word for word; the citation line is out of scope.

### RESOLVED: Low confidence: does the About dialog fit the 1000 × 800 embed frame (R14)?
**Context**: The copy makes the About content taller; MUI caps the paper at the frame height less 64px (736px here) and scrolls past that.
**Options considered**:
- A) Rely on MUI's cap.
- B) Add an explicit height cap.

**Decision**: A. Measured in Chromium with the planned code built and loaded in the Share dialog's own embed code: About grows from 446 to 556px tall and Share from 286 to 396px, both 936px wide, with no scrolling and Close at the top. B would add CSS for a case MUI already handles.

### RESOLVED: Low confidence: does the top bar look unchanged with the buttons and the Reload icon margin (R10)?
**Context**: FM-5's `margin: -1.5px 0` was measured in Flood.
**Options considered**:
- A) Port FM-5's values.
- B) Adjust them for forestfire.

**Decision**: A. Measured in Chromium at 1400 × 1000 against master: Reload's icon box is (11, −1, 24 × 24) on both, Share and About's text boxes are identical to the hundredth of a pixel, all three buttons are 21px tall at 0.5 to 21.5px in the 22px bar, and the inset ring (2px, offset −2px) lies inside them.

## Self-Review

### QA Engineer

#### RESOLVED: R17 did not ask for Close's `type="button"`
R11 makes Close a `<button type="button">`, but R17 only tested it by name, so dropping `type` (a form-submit default) left every test green. R17 now asserts it, as FM-5's dialog test does.

---

### DevOps Engineer

#### RESOLVED: What if the branch's S3 Deploy fails on the 2023 static AWS key?
The other Geo repos moved to OIDC (DEV-163, DEV-185); forestfire's switch is DEV-193 (Ethan McElroy's), out of scope here. If the key behind forestfire's secrets has been deactivated, the first push builds and tests but publishes no branch deploy, and Kiley has nothing to review (R21). DEV-193 is To Do and planned for Sprint 32 (starting 2026-12-07), while WM-70 is meant to ship now. Options: A) push and watch S3 Deploy; only if it fails, ask Ethan whether forestfire's OIDC role can be set up now, and rerun (recommended: most likely the key still works, and no AWS change lands in this story unless needed); B) bring the OIDC switch into WM-70 as its own commit up front; C) if it fails, Kiley reviews a local build Doug shares and the deploy waits for DEV-193. Doug's call, since it involves Ethan's story and AWS.

**Decision** (Doug, 2026-11-23): A. Push as planned; only if S3 Deploy fails, ask Ethan McElroy whether forestfire's OIDC role can be set up now, then rerun. No AWS change lands in WM-70 unless needed.
