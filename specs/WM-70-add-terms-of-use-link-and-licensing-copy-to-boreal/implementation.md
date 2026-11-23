# Implementation Plan: Terms of Use Link and Licensing Copy for Boreal Forest Fire Explorer

**Jira**: https://concord-consortium.atlassian.net/browse/WM-70
**Requirements Spec**: [requirements.md](requirements.md)
**Status**: **In Development**

## Implementation Plan

Four commits after the spec commit, on `WM-70-add-terms-of-use-link` from master. The code is WM-67's (license component, dialog, tests) with FM-5's top-bar styling, renamed for this app. Every step below was built as throwaway code on master and run: each step alone passes the full Jest suite and `npm run lint:build`, and the finished branch passes Jest (62 tests, of which 1 is skipped as on master, where the suite has 36), `lint:build`, the production webpack build, and all 6 Cypress specs (17 tests) against the built app. No dependency or lockfile changes.

### Move the Cypress action to v7

**Summary**: R20. GitHub's runner now runs JavaScript actions on Node 24, where a refused localhost connection raises `ERR_SOCKET_CLOSED_BEFORE_CONNECTION`; `cypress-io/github-action` before v7.4.4 treats that as fatal, so its wait for the dev server gives up on the first poll and no spec runs (found in HURR-70, fixed there and in Wildfire and Flood by moving to v7). Its own commit, first, so the later commits' CI runs are meaningful.

**Files affected**:
- `.github/workflows/ci.yml`: one line.

**Estimated diff size**: ~2 lines

```diff
       - name: Checkout
         uses: actions/checkout@v2
-      - uses: cypress-io/github-action@v5
+      - uses: cypress-io/github-action@v7
```

Commit subject: `ci: move the Cypress action to v7 [WM-70]`, with the reason above in the body. The job keeps its other inputs; Wildfire's cypress job has the same shape (no `setup-node` step) and passes on v7. This can only be verified by CI on the first push.

---

### Show the license and Terms of Use copy in About and Share

**Summary**: R1 to R8, R15, R16, and the 12px half of R18. A license-copy component replaces `<Copyright />` at the end of both dialogs, and `copyright.tsx` is deleted.

**Files affected**:
- `src/components/license/license-constants.ts` (new): the four link targets.
- `src/components/license/external-link.tsx` and `external-link.scss` (new): new-tab link with the hidden hint, identical to WM-67's.
- `src/components/license/license-copy.tsx` and `license-copy.scss` (new): the copy.
- `src/components/license/license-copy.test.tsx` (new).
- `src/components/about-dialog-content.tsx`, `src/components/share-dialog-content.tsx`: swap the import and the element.
- `src/components/geohazard-components/top-bar/copyright.tsx`: deleted.
- `cypress/e2e/top-bar.cy.ts` (new): the 12px checks.

**Estimated diff size**: ~180 lines

`license-constants.ts`:

```ts
export const kMitLicenseUrl = "https://github.com/concord-consortium/forestfire/blob/master/LICENSE";
export const kTermsOfUseUrl = "https://concord.org/terms-of-use/";
export const kLicensingUrl = "https://concord.org/licensing";
export const kLicensingEmail = "licensing@concord.org";
```

`external-link.tsx`:

```tsx
import * as React from "react";
import css from "./external-link.scss";

interface IProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> {
  href: string;
  children: React.ReactNode;
}

// A link that opens in a new tab and tells screen-reader users that it does.
export const ExternalLink = ({ href, children, ...others }: IProps) => (
  <a {...others} href={href} target="_blank" rel="noopener noreferrer">
    {children}
    <span className={css.visuallyHidden}> (opens in a new tab)</span>
  </a>
);
```

`external-link.scss`:

```scss
.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

`license-copy.tsx`:

```tsx
import * as React from "react";
import { ExternalLink } from "./external-link";
import { kLicensingEmail, kLicensingUrl, kMitLicenseUrl, kTermsOfUseUrl } from "./license-constants";
import css from "./license-copy.scss";

export const LicenseCopy = () => (
  <div className={css.licenseCopy} data-testid="license-copy">
    <p>
      <strong>Boreal Forest Fire Explorer is free, open-source software.</strong> The Boreal Forest Fire Explorer
      source code is released under the <ExternalLink href={kMitLicenseUrl}>MIT License</ExternalLink>, so you’re
      welcome to use, modify, and build on it.
    </p>
    <p>
      <strong>Your use of Boreal Forest Fire Explorer at forestfire.concord.org</strong> is governed by
      our <ExternalLink href={kTermsOfUseUrl}>Terms of Use</ExternalLink>. The hosted version is free for
      non-commercial use; commercial use requires a separate written agreement. For more information,
      visit <ExternalLink href={kLicensingUrl}>concord.org/licensing</ExternalLink> or
      contact <a href={`mailto:${kLicensingEmail}`}>{kLicensingEmail}</a>.
    </p>
    <p className={css.copyright}>© {new Date().getFullYear()} The Concord Consortium, Inc.</p>
  </div>
);
```

`license-copy.scss`:

```scss
.licenseCopy {
  a {
    text-decoration: underline;
  }
}

.copyright {
  font-size: 12px;
}
```

`about-dialog-content.tsx` and `share-dialog-content.tsx`, each:

```diff
-import { Copyright } from "./geohazard-components/top-bar/copyright";
+import { LicenseCopy } from "./license/license-copy";
...
-    <Copyright licenseUrl="https://github.com/concord-consortium/forestfire/blob/master/LICENSE" />
+    <LicenseCopy />
```

`license-copy.test.tsx`: WM-67's test with the product, host and MIT URL changed and the imports pointing at `../about-dialog-content` and `../share-dialog-content`. `describe.each` over the real About and Share content, with the clock pinned to 2031 in `beforeEach`:

- "links the MIT License, Terms of Use and licensing page in a new tab": exactly 4 links in the copy; for each of the three web links, found by the name `"<text> (opens in a new tab)"`, the literal href, `target="_blank"` and `rel="noopener noreferrer"`.
- "links the licensing email in the same tab": found by the name `licensing@concord.org`, href `mailto:licensing@concord.org`, no `target`, no `rel`.
- "shows the approved copy, in order, with the current year": the copy's whitespace-collapsed `textContent` equals the R2 text joined (with the hints and "© 2031"); both lead-ins are `STRONG`.
- "computes the copyright year when it renders": `jest.setSystemTime` to 2047, expects "© 2047 The Concord Consortium, Inc.".
- "is the last block in the dialog": the rendered content's text ends with "© 2031 The Concord Consortium, Inc.".
- "drops the old Creative Commons copyright block": no `Creative Commons|CC BY|All rights reserved` in the body.

`cypress/e2e/top-bar.cy.ts`:

```ts
// Layout checks for the top bar and its dialogs. jsdom applies no stylesheet, so
// computed sizes and on-screen positions are observable only here.

describe("Top bar and dialog layout", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  ["about", "share"].forEach((testid) => {
    it(`shows the ${testid} dialog's copyright line at 12px`, () => {
      cy.get(`[data-testid="${testid}"]`).click();
      cy.get('[role="dialog"]')
        .contains("p", /^© \d{4} The Concord Consortium, Inc\.$/)
        .should("have.css", "font-size", "12px");
    });
  });
});
```

---

### Name the dialogs, give them a Close button and focus it on open

**Summary**: R11 and R13 for the dialog itself, and R17's dialog tests: an `<h2>` title that names the dialog through `aria-labelledby`, `aria-modal` on the paper, a real Close button with a focus ring, and focus on Close on every enter. Adds the `focusRing` mixin the next step reuses.

**Files affected**:
- `src/components/geohazard-components/common.scss`: `focusRing` mixin.
- `src/components/geohazard-components/top-bar/dialog.tsx`: rewritten as below.
- `src/components/geohazard-components/top-bar/dialog.scss`: title margin, Close button reset and ring.
- `src/components/geohazard-components/top-bar/dialog.test.tsx`: replaces its one test.

**Estimated diff size**: ~80 lines

`common.scss`, appended:

```scss
@mixin focusRing($offset: 2px) {
  &:focus-visible {
    outline: 2px solid $controlText;
    outline-offset: $offset;
  }
}
```

`dialog.tsx`:

```tsx
import * as React from "react";
import MuiDialog from "@mui/material/Dialog";
import CloseIcon from "@mui/icons-material/Close";
import css from "./dialog.scss";

interface IProps {
  onClose: () => void;
  open: boolean;
  title: string;
  children?: JSX.Element | JSX.Element[];
}

export const Dialog: React.FC<IProps> = ({ onClose, open, title, children }) => {
  const titleId = React.useId();
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const focusClose = () => closeRef.current?.focus();
  return (
    <MuiDialog
      onClose={onClose}
      open={open}
      maxWidth="lg"
      aria-labelledby={titleId}
      PaperProps={{ "aria-modal": true }}
      TransitionProps={{ onEnter: focusClose }}
    >
      <div className={css.dialogBody}>
        <h2 id={titleId} className={css.title}>{ title }</h2>
        <button type="button" aria-label="Close" className={css.closeButton} onClick={onClose} ref={closeRef}>
          <CloseIcon />
        </button>
        <div className={css.content}>{ children }</div>
      </div>
    </MuiDialog>
  );
};
```

`title` becomes required; `TopBar` already passes it for both dialogs.

`dialog.scss`:

```diff
 .title {
+  margin: 0;
   font-size: 1.2em;
   font-weight: 600;
 }

 .closeButton {
   position: absolute;
   top: 8px;
   right: 8px;
+  display: flex;
+  padding: 0;
+  border: none;
+  background: none;
   color: #797979;
   cursor: pointer;
   &:hover {
     color: $controlText;
   }
+  @include focusRing;
 }
```

`dialog.test.tsx`, WM-67's four tests with the title changed: "is a modal dialog named by its title" (dialog named by the title with `aria-modal="true"`, and `aria-labelledby` pointing at the level-2 heading of that name); "moves focus to its Close button when it opens"; "closes from its Close button" (also asserting `type="button"`, per R17); "closes on Escape". Import `userEvent` by name, `import { userEvent } from "@testing-library/user-event"`, as forestfire's other tests do: WM-67's default import draws an `import/no-named-as-default` warning from `lint:build` here.

---

### Make Reload, Share and About keyboard-reachable buttons

**Summary**: R10, the opener half of R11, R17's top-bar tests, and the Tab-order half of R18. The three controls become `<button type="button">`s with an inset focus ring; Share and About focus themselves on click so focus returns there.

**Files affected**:
- `src/components/geohazard-components/top-bar/top-bar.tsx`: buttons and click handlers.
- `src/components/geohazard-components/top-bar/top-bar.scss`: button reset, ring, Reload icon margin.
- `src/components/geohazard-components/top-bar/top-bar.test.tsx`: new tests.
- `cypress/e2e/top-bar.cy.ts`: Tab-order check.

**Estimated diff size**: ~130 lines

`top-bar.tsx`:

```diff
-  const handleShareOpen = () => {
+  // macOS Safari and Firefox do not focus a button on click, so focus it here for the dialog to restore focus to on close.
+  const handleShareOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
+    event.currentTarget.focus();
     setShareOpen(true);
     log("ShareDialogOpened");
   };
-  const handleAboutOpen = () => {
+  const handleAboutOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
+    event.currentTarget.focus();
     setAboutOpen(true);
     log("AboutDialogOpened");
   };
...
-      <span className={css.textButton} data-testid="reload" onClick={handleReload}><RefreshIcon /></span>
+      <button
+        type="button"
+        data-testid="reload"
+        className={css.textButton}
+        aria-label="Reload"
+        title="Reload"
+        onClick={handleReload}
+      >
+        <RefreshIcon />
+      </button>
       <span>
-        <span data-testid="share" className={css.textButton} onClick={handleShareOpen}>Share</span>
-        <span data-testid="about" className={css.textButton} onClick={handleAboutOpen}>About</span>
+        <button type="button" data-testid="share" className={css.textButton} onClick={handleShareOpen}>
+          Share
+        </button>
+        <button type="button" data-testid="about" className={css.textButton} onClick={handleAboutOpen}>
+          About
+        </button>
       </span>
```

`top-bar.scss`:

```diff
+    // MUI's 24px icon, pulled in to the 21px height of Share and About so Reload's focus ring fits inside the bar.
     svg {
-      margin-top: 4px;
+      display: block;
+      margin: -1.5px 0;
     }
   }
+
+  button.textButton {
+    padding: 0;
+    border: none;
+    background: none;
+    font: inherit;
+    color: inherit;
+    @include focusRing(-2px);
+  }
 }
```

`.topBar .textButton:hover` (specificity 0,3,0) still wins over `.topBar button.textButton { color: inherit }` (0,2,1), so hover stays `#434343`.

`top-bar.test.tsx`: FM-5's additions (Flood's starting test file matches forestfire's apart from its `onBeforeReload` test and a default `userEvent` import), plus WM-67's log check:

- Mock `@concord-consortium/lara-interactive-api`'s `log` with `jest.fn()` at the top, and clear it in a top-level `beforeEach` (`jest.mocked(log).mockClear()`): the Jest config does not clear mocks between tests, so without it the log check below also passes on calls left by earlier tests in the file. `import { fireEvent, render, screen, waitFor }`; keep the file's named `userEvent` import (the default import trips `import/no-named-as-default`).
- "Reload button keyboard access › is the first Tab stop, named Reload with a matching tooltip, and reloads on Enter": `type="button"`, `aria-label` and `title` both "Reload" as attributes, first `user.tab()` focuses it, Enter calls the mocked `window.location.reload`.
- `describe.each([{ name: "Share", tabs: 2 }, { name: "About", tabs: 3 }])`:
  - "is a button reached by Tab that opens its dialog with Enter, focusing Close": `type="button"`, focused after `tabs` Tabs, Enter opens a dialog named `${name}: Test`, Close focused.
  - `it.each` Esc and Close, "gets focus back when $closeWith closes the dialog after a click that did not focus it": focus on body, `fireEvent.click` (which moves no focus), close, wait for the dialog to unmount, expect the button focused.
  - "focuses Close when reopened while the dialog is still closing": open, Escape, the dialog is still in the document, click again, Close focused.
- `it.each(["Share", "About"])` "logs %sDialogOpened when its button opens the dialog".

`cypress/e2e/top-bar.cy.ts`, added inside the `describe`:

```ts
  it("lays its buttons out left to right in Tab order", () => {
    // jQuery returns the matches in DOM order, which is the order Tab visits them.
    cy.get('[data-testid="reload"], [data-testid="share"], [data-testid="about"]').should("have.length", 3).then(($buttons) => {
      const lefts = $buttons.toArray().map((button) => button.getBoundingClientRect().left);
      expect(lefts, "left edges in DOM order").to.deep.eq(lefts.slice().sort((a, b) => a - b));
    });
  });
```

## Verification

Run while writing this spec, on the throwaway build:

- **Mutations**: each planned test fails when the line it guards is removed or broken. Jest: removing either click handler's `focus()` (2 fail), the `onEnter` hook (5), `aria-modal` (1), `aria-labelledby` (3), `aria-labelledby` swapped for `aria-label={title}` (1), the `<h2>` (1), the Close button (8), Close's `type` (1), Reload's `aria-label` (1) or `title` (1), the Share or About log call (1 each), Share's log call moved into its close handler (1), the `getFullYear()` call (2), a wrong MIT URL constant (2), the copy from Share (5), the curly apostrophe (2), the mailto as an `ExternalLink` (4), the hidden hint (4), `noreferrer` (2), a bold lead-in (2), copy not last (1), old CC text kept (2), Share and About swapped in the DOM (2), and Share or Reload as a `div role="button"` (1 each: Enter opens nothing). Cypress: a build with a 13px copyright and the right-hand buttons visually reversed fails all 3 tests.
- **Enter in Jest**: user-event 14 activates a native `<button>` on Enter and not a `<div role="button" tabIndex={0}>`, so the Enter tests guard the element type; the hand check below repeats Enter in a real browser.
- **Browser (Chromium, Playwright, production build)**: the top bar matches master to the hundredth of a pixel (Reload's icon at 11, −1, 24 × 24; Share and About text boxes unchanged), the buttons are 21px tall at 0.5 to 21.5px in the 22px bar, and the inset ring shows all four sides; Tab goes Reload, Share, About, then into the page; Enter on About opens it with Close focused and a 2px ring; Tab stays in the dialog; Esc, Close and a backdrop click return focus to the opener; a reopen during the fade focuses Close; the paragraphs are 16px and the copyright line 12px in both dialogs; the four links are underlined; the dialog layer's z-index is 1300. In the Share dialog's 1000 × 800 embed code, About is 556px and Share 396px tall (master 446 and 286), with no scrolling.
- **Firefox (Playwright, same build)**: the buttons sit at 0.5 to 21.5px with the inset ring, Tab goes Reload, Share, About, Enter on About focuses Close, the copyright line is 12px, and Esc after a keyboard open and Close after a mouse open of Share return focus to the button. In the 1000 × 800 embed code, About is 575px and Share 407px tall, with no scrolling, and the Terms of Use link opens in a new tab.
- **Not run here**: Safari (Playwright's WebKit does not launch on this machine; the macOS click-focus case is covered by the `fireEvent.click` tests), the CI action change, and the S3 deploy. The implementer repeats the browser checks above by hand on the branch build, in Chrome and Firefox, before asking Kiley to review (R19, R21).

## Open Questions

### RESOLVED: Judgment call: one commit for the dialog and the buttons, or two?
**Context**: FM-5 shipped them together; WM-67 split them.
**Options considered**:
- A) Two commits, dialog first.
- B) One commit.

**Decision**: A. Each has one reason, both pass alone (checked), and the button tests can name the dialog because the heading lands first.

### RESOLVED: Judgment call: one Cypress file or two?
**Context**: FM-5 used `license-copy.cy.ts` and `top-bar.cy.ts`; WM-67 one `top-bar-visuals.cy.ts`.
**Options considered**:
- A) One `top-bar.cy.ts`, started by the copy step and extended by the button step.
- B) Two files.

**Decision**: A. Three small layout tests that share a `beforeEach`; the file's header says why they are in Cypress.

## Self-Review

### Commit reviewer

#### RESOLVED: each step stands alone
Built as four throwaway commits on master: after the copy step and after the dialog step, the full Jest suite and `lint:build` pass; the button step completes the branch. The copy step's Cypress tests need only the copy, and the dialog step changes no `TopBar` call, since `TopBar` already passes both titles. No change.

---

### Test writer

#### RESOLVED: Close's `type` had no test
R17 asks for it; dropping `type="button"` from Close passed every planned test. The dialog step's "closes from its Close button" test now asserts it, and the mutation fails it.

#### RESOLVED: WM-67's `dialog.test.tsx` import adds a lint warning here
WM-67's dialog test imports `userEvent` as the default export. Forestfire's ESLint config flags that with `import/no-named-as-default`, and its two existing user-event tests use the named import. Built on master with the dialog test as WM-67 wrote it, `lint:build` reports 1 warning (master reports none); with the named import it reports none and the suite still passes. The dialog step now says to use the named import.

---

### Senior Engineer

#### RESOLVED: the Reload icon's `-1.5px` margin had no explanation in the code
FM-5's `top-bar.scss` carries a one-line comment on the `svg` rule saying why MUI's 24px icon gets a negative margin; the planned forestfire diff ported the rule without it, leaving an unexplained magic number in the stylesheet (only this spec's Technical Notes said why). The button step's `top-bar.scss` diff now includes FM-5's comment, which describes the code as it stands.

---

### Spec reader a year from now

#### RESOLVED: Verification said Firefox was not run
It was run once Playwright's Firefox turned up on this machine; the Verification section now records what it showed, and Safari stays the one engine not run.

---

### Jest test-isolation reviewer

#### RESOLVED: the dialog-opened log check passed on calls from earlier tests
The top-bar test file mocks `log` once for the whole file, and forestfire's Jest config sets neither `clearMocks` nor `resetMocks`, so by the time the log check runs the mock holds every call from the earlier Share and About tests, including their closes. Built as planned, the check stayed green with Share's `log("ShareDialogOpened")` moved from the open handler into `handleShareClose`. The button step now clears the mock in a top-level `beforeEach`; with it, that mutation fails the Share log test and the file's 14 tests pass. The `window.location` overrides in the Reload tests also persist for the rest of the file, as on master, but no later test reads `location`, and Jest gives each file its own jsdom, so they need no restore.

---

### Whole-document consistency reviewer

#### RESOLVED: no step claimed R17
Every other R-number in R1 to R21 traces to a step summary, the Verification section or needs no code, but R17 appeared only inside the dialog step's test paragraph. The dialog step's summary now names R17's dialog tests and the button step's names its top-bar tests.

#### RESOLVED: the embed-frame heights were Chromium's only
R14 and the Verification section gave About and Share's embed heights (556 and 396px) without saying they are Chromium's. Measured in Firefox on the same build and embed page, they are 575 and 407px, still under the 736px cap and with no scrolling. R14 and the Firefox bullet now give both.

