# Terms of Use Link and Licensing Copy for Boreal Forest Fire Explorer

**Jira**: https://concord-consortium.atlassian.net/browse/WM-70

**Status**: **Closed**

## Overview

Boreal Forest Fire Explorer's About and Share dialogs get the same license and Terms of Use copy the other Geo simulations show (TE-10, SE-4, FM-5, WM-67, HURR-70), replacing the old CC BY 4.0 copyright block, and its top bar and dialogs get the same keyboard and screen-reader behavior, so all six Geo apps say and do the same thing. The code ports WM-67 (concord-consortium/wildfire-model PR #157) with FM-5's top-bar styling (concord-consortium/flooding-model PR #72); forestfire's `src/components/geohazard-components/` is a local copy of the same geohazard top bar on the same stack (React 18, MobX 6, MUI 5.15).

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
- **R12. Only one dialog is ever open, and it is on top.** About and Share are the app's only dialogs and each is modal, so one cannot open over the other, and nothing opens over them on its own: no timer- or simulation-driven overlay, no coach mark, and the only `window.alert` needs a canvas click the backdrop blocks. Esc therefore always closes the dialog the user sees. They draw above every other part of the app (whose highest z-index is the bottom bar's 1000, under MUI's 1300), including in full screen, which takes the whole document. No z-index change is needed, unlike WM-67's coach mark.
- **R13. The dialogs look as before** apart from the copy and Close's focus ring: the same title style and close icon, in the same place.
- **R14. The dialogs fit the embed frame**: in the Share dialog's own 1000 × 800 iframe, About (556px tall in Chromium, 575px in Firefox) and Share (396px, 407px) fit without scrolling, under MUI's existing cap of the frame height less 64px, which scrolls the dialog inside itself in a shorter frame. No new height cap.

### Unchanged

- **R15.** The About dialog's descriptive paragraphs and its creator and NSF credit line, and their links, are unchanged (including their `rel="noreferrer"` without `noopener`). The Share dialog's link and embed textareas and its "Suggested citation" line are unchanged.

### Tests

- **R16. Copy tests** render the real About and Share content (not the copy component alone, so dropping it from either dialog fails) and assert, for each: the four hrefs as literal URLs written in the test, not imported constants; `target="_blank"` and `rel="noopener noreferrer"` on the three web links and neither on the mailto link; each web link's accessible name with the hint, and the mailto link's name as its text alone; the R2 copy word for word and in order, including the curly apostrophe and the two bold lead-ins; that the copy is the last block; the copyright line with the clock pinned and the year asserted as a literal, under two different pinned years; and that the R5 text is absent.
- **R17. Dialog and top-bar tests** cover: the dialog's name from its level-2 heading (`aria-labelledby` pointing at it), `aria-modal`, focus on Close when it opens, closing from Close and on Esc; Close as a `type="button"` button; Reload as a `type="button"` button with `aria-label` and `title` of "Reload" (asserted as attributes), the first Tab stop, reloading on Enter; Share and About as `type="button"` buttons that are the second and third Tab stops, opening their dialog on Enter with focus on Close, getting focus back by Esc and by Close after a click that did not focus them, and focusing Close on a reopen during the close animation; and both dialog-opened logs, with the `log` mock cleared before each test.
- **R18. Cypress layout tests** (Jest applies no Sass) check that the three buttons' DOM order, which is their Tab order, runs left to right on screen, and that the copyright line computes to 12px in both dialogs.
- **R19. Every new test fails when the line it guards is removed** (checked by mutation). What no automated test can see (the look of the buttons, the focus rings, the dialog in the embed frame, Enter in a real browser) is checked by hand in a browser before review.

### CI

- **R20. CI's Cypress job runs on GitHub's current runner**: `cypress-io/github-action@v5` moves to `@v7` in `.github/workflows/ci.yml`, as the first code commit, in a commit of its own whose message says why (Node 24 runners make versions before v7.4.4 give up on the dev-server wait at the first refused connection).

### Review

- **R21.** Kiley Brown reviews the result on the branch deploy before merge (story acceptance criterion), at `https://models-resources.concord.org/forestfire/branch/add-terms-of-use-link/index.html` (also served as `https://forestfire.concord.org/branch/add-terms-of-use-link/index.html`; `s3-deploy-action` strips the leading Jira key from the branch name). Her steps, one per acceptance criterion:
  - **Copy with working links, worded as the other Geo apps**: open About, then Share; each ends with the two paragraphs and the copyright line, reading as Wildfire Explorer's do apart from "Boreal Forest Fire Explorer" and "forestfire.concord.org". MIT License, Terms of Use and concord.org/licensing each open the right page in a new tab; licensing@concord.org opens a new email.
  - **Reachable standalone and embedded**: on the branch URL, and in a page that loads it in the Share dialog's 1000 × 800 embed code, About opens and its Terms of Use link works.
  - **Keyboard and dialogs**: Tab from the page start reaches Reload, Share and About in that order with a visible ring; Enter on Share or About opens its dialog with focus on Close; Tab stays inside it; Esc or Close returns focus to the button. Enter on Reload reloads.
  - **Reviewed on the deployed branch**: these checks on the URL above are that review.

## Technical Notes

- **Where the code lives**: the copy, `ExternalLink` and the link constants in `src/components/license/`, as in WM-67 and FM-5; the buttons in `src/components/geohazard-components/top-bar/top-bar.tsx`; the dialog in `.../top-bar/dialog.tsx`; the `focusRing($offset)` mixin in `.../geohazard-components/common.scss` (which names its dark gray `$controlText`, where Flood's names it `$controlLabel`); the layout checks in `cypress/e2e/top-bar.cy.ts`.
- **Dialog name**: `aria-labelledby` passed to `MuiDialog` lands on the paper, pointing at the `<h2>`'s `React.useId()` id. FM-5 used `aria-label` because `useId` renumbered Flood's react-tabs ids that its Cypress page objects select; forestfire's Cypress specs select only `data-testid`s and class names.
- **Focus on open**: the Fade transition's `onEnter` (through `TransitionProps`) focuses Close on every enter; `autoFocus` misses a reopen during MUI's exit fade, since the dialog stays mounted. MUI returns focus to the opener on close; the About and Share click handlers call `event.currentTarget.focus()` first so a mouse open in Safari or Firefox still has an opener to return to.
- **Focus ring**: 2px solid `$controlText` on `:focus-visible`; `-2px` (inset) in the top bar, `2px` around Close. Reload's icon is `display: block` with `margin: -1.5px 0`, so its button is 21px tall like Share and About (0.5 to 21.5px in the 22px bar) and the icon stays where master drew it. `.topBar .textButton:hover` (0,3,0) outranks `.topBar button.textButton { color: inherit }` (0,2,1), so hover stays `#434343`.
- **Enter in Jest**: user-event 14 activates a native `<button>` on Enter in jsdom and not a `<div role="button">`, so the Enter tests fail if a button goes back to a non-button. Cypress 13 cannot send a real Tab or Enter without a new dependency (`cypress-real-events`), so keyboard activation is tested in Jest and by hand rather than in Cypress, which the story's AI instructions had suggested.
- **Test isolation**: the Jest config sets neither `clearMocks` nor `resetMocks`, so the top-bar test file clears its `log` mock in a top-level `beforeEach`; without it, the log checks pass on calls left by earlier tests.
- **Logging**: no new log events.
- **CI and deploy**: the repository's last push before this story was in September 2024, so the branch's first push is the first CI run in over a year. The S3 Deploy job still authenticates with the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` repository secrets, last set in June 2023, and R21's branch deploy depends on them. `workspace.cy.ts`'s "verify timeline scrubber" test is timing-sensitive (it expects the track width near 6% after 8 seconds of simulation) and fails intermittently on master as well.
- **Release** (Forest Fire 1.2.1, WM-71) follows the other Geo releases: version bump, tag, and `release.yml` copying `index-top.html`.

## Out of Scope

- From the story: a third-party library acknowledgements list, changing the software license, and localizing the legal copy.
- The existing credit links in the About dialog and their `rel`.
- The Share dialog's "Suggested citation" line, including its "Forest Fire Explorer" name and 2023 date.
- Switching CI and the release workflow to OIDC (DEV-193), and the other outdated CI actions (`actions/checkout@v2`, `actions/setup-node@v2`, `codecov/codecov-action@v1`).
- The README's deployment section, which still describes Travis and a `production` branch.
- The top-bar text color: `#797979` on white is about 4.35:1, under WCAG AA's 4.5:1 for 17px text; R10 keeps the existing look, as the other Geo apps did.
- The release itself (WM-71).

## Decisions

### Name the dialog by `aria-labelledby` (WM-67) or `aria-label` (FM-5)?
**Context**: Both name the dialog by its title. FM-5 chose `aria-label` only because `useId` renumbered react-tabs ids its Cypress page objects hardcode.
**Options considered**:
- A) `aria-labelledby` pointing at the `<h2>`, as WM-67.
- B) `aria-label={title}` on the paper, as FM-5.

**Decision**: A. Forestfire's Cypress specs select no generated ids, so FM-5's reason does not apply, and WM-67 is the story's named template. The dialog test asserts the `aria-labelledby` link, so switching to B fails it.

---

### Inset focus ring (FM-5) or a shorter button with an outside ring (WM-67)?
**Context**: R10 needs all four sides of the ring inside the 22px bar.
**Options considered**:
- A) `outline-offset: -2px` on the unchanged 21px buttons, as FM-5.
- B) WM-67's `$buttonHeight` line-height arithmetic with a 1px outside offset.

**Decision**: A. Forestfire's `top-bar.scss` was Flood's starting file line for line, the buttons keep their boxes, and the later Geo reviews settled on the inset ring. Measured in Chromium at 1400 × 1000, the top bar matches master to the hundredth of a pixel.

---

### Product name in the copy
**Context**: The app's title is "Boreal Forest Fire Explorer", but the Share dialog's citation line says "Forest Fire Explorer".
**Options considered**:
- A) "Boreal Forest Fire Explorer", as the story's copy and the app's title.
- B) "Forest Fire Explorer", matching the citation.

**Decision**: A. The story gives the copy word for word; the citation line is out of scope.

---

### Does the About dialog need a height cap for the embed frame?
**Context**: The copy makes About taller; MUI caps the paper at the frame height less 64px (736px in the 1000 × 800 embed) and scrolls past that.
**Options considered**:
- A) Rely on MUI's cap.
- B) Add an explicit height cap.

**Decision**: A. Measured in the Share dialog's own embed code, About grows from 446 to 556px in Chromium (575px in Firefox) and Share from 286 to 396px (407px), with no scrolling and Close at the top.

---

### What if the branch's S3 Deploy fails on the 2023 static AWS key?
**Context**: The other Geo repos moved to OIDC; forestfire's switch is DEV-193 (Ethan McElroy's), planned for Sprint 32, while WM-70 ships now. If the key is inactive, Kiley has no branch deploy to review.
**Options considered**:
- A) Push and watch S3 Deploy; only if it fails, ask Ethan whether forestfire's OIDC role can be set up now, and rerun.
- B) Bring the OIDC switch into WM-70 up front.
- C) If it fails, Kiley reviews a local build and the deploy waits for DEV-193.

**Decision**: A (Doug, 2026-11-23). No AWS change lands in WM-70 unless needed.

---

### Close's `type="button"` needs a test
**Context**: R11 makes Close a `<button type="button">`, but testing it by name alone let a form-submit default pass.

**Decision**: The dialog's "closes from its Close button" test asserts `type="button"`, as FM-5's does.

---

### One commit for the dialog and the buttons, or two?
**Context**: FM-5 shipped them together; WM-67 split them.
**Options considered**:
- A) Two commits, dialog first.
- B) One commit.

**Decision**: A. Each has one reason, both pass Jest and lint alone, and the button tests can name the dialog because the heading lands first.

---

### One Cypress file or two?
**Context**: FM-5 used `license-copy.cy.ts` and `top-bar.cy.ts`; WM-67 one `top-bar-visuals.cy.ts`.
**Options considered**:
- A) One `top-bar.cy.ts`, started by the copy step and extended by the button step.
- B) Two files.

**Decision**: A. Three small layout tests that share a `beforeEach`; the file's header says why they are in Cypress.

---

### Default or named `userEvent` import?
**Context**: WM-67's dialog test imports `userEvent` as the default export, which forestfire's ESLint config flags with `import/no-named-as-default`.

**Decision**: The named import, as forestfire's other tests use; `lint:build` stays warning-free.

---

### Clear the `log` mock between top-bar tests
**Context**: The top-bar test file mocks `log` once and the Jest config does not clear mocks, so the dialog-opened log check passed even with Share's log call moved into its close handler.

**Decision**: A top-level `beforeEach` clears the mock; that mutation now fails the Share log test.
