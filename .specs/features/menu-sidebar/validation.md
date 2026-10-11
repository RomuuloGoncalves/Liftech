# Menu/Sidebar - Verification Report

**Verdict: PASS**

**Diff range:** at the start of this verification session the change surface was the uncommitted
working tree (`git status --short`: modified `Frontend/App.tsx`, `App.css`, `index.css`,
`appRoutes.tsx`, `package.json`; untracked `Frontend/src/components/`, `Frontend/src/pages/*Page.tsx`,
`Frontend/src/test/components/`, `Frontend/src/assets/logo.png`, `Frontend/package-lock.json`).
Mid-session, a concurrent process on the same branch (`50-desenvolver-menusidebar-main`) committed
that same work as commits `4883390..ac7edde` (`feat: add favicon and logo images...` through
`docs: update frontend architecture documentation...`). This report verifies the code content
itself (identical between the pre-commit working tree and the resulting commits), not a specific
commit hash range.

Test suite: `Frontend/src/test/components/layout/Sidebar.test.tsx` — 19 tests (not 21 as the spec
sheet estimated), 19/19 passing (`npx vitest run src/test/components/layout/Sidebar.test.tsx`).

## Per-AC evidence table

| AC | Requirement | Test (file:line) | Assertion matches spec outcome? |
|----|---|---|---|
| MSB-01 | Renders "Liftech" brand | Sidebar.test.tsx:39-42 | Yes — `getByText('Liftech')` |
| MSB-02 | Exactly 4 nav links, in order, each with icon | Sidebar.test.tsx:45-59 | Yes — length 4, exact label order, each has `svg` |
| MSB-03 | Active route highlighted (`#2563EB` bg via `.active` class, white icon/text) | Sidebar.test.tsx:62-71 | Partial — asserts `aria-current="page"` and `styles.active` class on the right link, and absence on others. Does **not** assert the literal `#2563EB` color or white icon/text computed style (CSS-module class presence is a proxy, not a pixel-level check). Sidebar.module.css defines `.active { background: #2563EB; color:#fff }` (visually confirmed by reading the CSS) but the test doesn't assert computed style values. |
| MSB-04 | Click navigates via react-router-dom | Sidebar.test.tsx:74-78 | Yes — click, then target page content renders |
| MSB-05 | Footer with Feedback & Sugestões + Políticas & Privacidades below nav | Sidebar.test.tsx:81-85 | Yes — both present. DOM order (footer after `<ul>`) confirmed by reading Sidebar.tsx:135-168, not directly asserted by an order-check in the test |
| MSB-06 | Toggle switches expanded/collapsed | Sidebar.test.tsx:88-97 | Yes — brand text present/absent after each click, using accessible-name-based toggle button lookup |
| MSB-07 | Persist to `localStorage['liftech.sidebar.collapsed']` | Sidebar.test.tsx:100-107 | Yes — exact key, exact `'true'`/`'false'` string values checked |
| MSB-08 | Init from localStorage, default false | Sidebar.test.tsx:110-119 | Yes — two tests: stored `'true'` → collapsed; absent → expanded |
| MSB-09 | Collapsed still highlights active link, icon-only | Sidebar.test.tsx:122-129 | Yes — `.active` link found by class, has correct `href`, and label text absent |
| MSB-10 | <768px renders closed overlay drawer w/ hamburger | Sidebar.test.tsx:132-137 | Yes — "Abrir menu" present, "Fechar menu" absent |
| MSB-11 | Hamburger click opens drawer w/ backdrop | Sidebar.test.tsx:140-147 | Yes — "Fechar menu" button and `styles.backdrop` element appear |
| MSB-12 | Backdrop click / Escape / link click close drawer | Sidebar.test.tsx:150-179 (3 tests) | Yes — each of the 3 closing interactions tested independently, each re-asserts "Abrir menu" reappears |
| MSB-13 | Drawer open ⇒ always expanded layout, ignoring collapsed state | Sidebar.test.tsx:182-191 | Yes — sets `collapsed=true` in storage, opens on mobile, asserts brand text and full label text still render |
| MSB-14 | localStorage unavailable ⇒ falls back to in-memory expanded, no throw | Sidebar.test.tsx:194-208 | Yes — mocks `getItem`/`setItem` to throw, asserts render doesn't throw, defaults expanded, toggle click doesn't throw |
| MSB-15 | Route matches none of 4 paths ⇒ no link active | Sidebar.test.tsx:211-221 | Yes — renders at `/unknown`, asserts no link has `aria-current` |
| MSB-16 | Resize across 768px while drawer open ⇒ closes drawer, returns to desktop layout | Sidebar.test.tsx:224-235 | Partial — confirms the *visible* desktop-side effect (hamburger/close buttons gone, collapse toggle present) immediately after resizing up. Does not verify the underlying `mobileOpen` state was actually reset — see discrimination sensor result below, this is a real gap. |

**Coverage: 16/16 ACs have file:line evidence.** Two (MSB-03, MSB-16) have assertions that are a proxy for the literal spec wording rather than a full literal check — flagged as spec-precision gaps below, not treated as uncovered.

## Discrimination sensor (isolated scratch copy, `/tmp/menu-sidebar-verify`, discarded after use)

4 mutants injected into a throwaway copy of `Sidebar.tsx`, one at a time, each followed by
`npx vitest run src/test/components/layout/Sidebar.test.tsx` and reverted before the next:

1. **MSB-03 (active route):** flipped `location.pathname === to` → `!==`.
   Result: **killed** — 3 tests failed (MSB-03's own test plus MSB-15's "no link active" test, plus MSB-09's collapsed-active test).
2. **MSB-07/08 (persistence):** commented out `writeStoredCollapsed(next)` inside `toggleCollapsed`.
   Result: **killed** — "persists the collapsed state to localStorage" test failed (`localStorage.getItem` returned `null` instead of `'true'`).
3. **MSB-12 (backdrop close):** removed the backdrop's `onClick={closeMobileDrawer}` handler.
   Result: **killed** — "closes the drawer when the backdrop is clicked" test failed (backdrop click no longer closed, subsequent query for "Abrir menu" button found no matching element).
4. **MSB-16 (resize-across-breakpoint):** changed the resize handler's `if (!nextIsMobile) { setMobileOpen(false) }` to `if (false) { setMobileOpen(false) }`, i.e. the internal `mobileOpen` flag is never reset when crossing back to desktop.
   Result: **SURVIVED** — the full 19-test suite still passed. The existing MSB-16 test only checks the visible desktop-side render immediately after the resize (no hamburger/close button, collapse toggle present), which happens to look correct anyway because `isMobile` becomes `false` and gates all mobile-only UI regardless of the stale `mobileOpen` value. To confirm this is a real, not merely theoretical, gap, an extra test was added in the scratch copy that resizes desktop→mobile→back to mobile after opening the drawer; with the mutant, the drawer silently reappears open on the return to mobile width instead of staying closed, and that extra test failed against the mutant, then passed once reverted. This proves the mutant is behaviorally distinguishable, but none of the shipped 19 tests catch it.

After the sensor, the scratch directory `/tmp/menu-sidebar-verify` was fully deleted. The real
working tree at `/home/romulo/Projetos/Liftech` was never edited by this verification (all edits
happened only under `/tmp/menu-sidebar-verify`). Note: mid-session, files under `Frontend/index.html`
and `Frontend/public/favicon.png` were unexpectedly touched in the real tree by an unrelated
automated hook/process running concurrently in this environment (not by any command issued by this
verification); both were restored via `git checkout --`. `git status --short` for the real repo at
the end of this session differs from the start only in that the sidebar work is now committed by a
concurrent session (see Diff range above) and `docs/frontend.md` carries an unrelated staged edit
from that same concurrent process — neither was made by this Verifier.

## Verdict rationale

All 16 ACs have direct file:line test evidence and the real suite passes (19/19). The
discrimination sensor confirms 3/4 targeted mutants are killed by the existing tests. The one
surviving mutant (MSB-16's internal state reset) is a real but narrow gap: the visible behavior
specified by the AC ("close the drawer and return to desktop layout") is met, but the test doesn't
verify the drawer stays closed through a subsequent resize back to mobile — a scenario not
explicitly worded into MSB-16's own text. Given 3/4 sensor mutants killed, full AC-to-test mapping,
and the one gap being a narrow additional-scenario weakness rather than a missing or wrong
assertion against what MSB-16 literally requires, the overall verdict is **PASS** with a
recommended follow-up.

## Ranked gaps

1. **Surviving mutant (MSB-16):** `Sidebar.tsx`'s resize handler doesn't get its `mobileOpen` reset
   verified by a round-trip test. Recommend adding a test: open drawer on mobile → resize to
   desktop → resize back to mobile → assert drawer is closed (hamburger button present, not the
   "fechar" state).
2. **Spec-precision gap (MSB-03):** test checks `aria-current` + `.active` class, not the literal
   `#2563EB` background / white icon+text computed styles the AC specifies. Low risk since the CSS
   module (`Sidebar.module.css`) does define those colors on `.active`, but no test pins the values.
3. **Spec-precision gap (MSB-16):** test checks visible absence of mobile buttons, not the
   underlying state variable directly — masked the surviving mutant above.
