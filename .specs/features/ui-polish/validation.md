# Polimento da interface Validation

**Date**: 2026-10-02
**Spec**: `.specs/features/ui-polish/spec.md`
**Diff range**: `e8a6372^..HEAD` (main, 14 commits, 35 files)
**Verifier**: independent sub-agent (author != verifier)

**Result**: PASS

## Task Completion

T1-T12 all marked done in `tasks.md`.

## Spec-Anchored Acceptance Criteria

Paths: `T` = `Frontend/src/test`. Skeleton ACs are asserted at hook level (timing) and page level (the hook is mocked, so the pages assert only skeleton vs content).

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| SKEL-01 | skeleton 600 ms, then content | `T/hooks/useFirstVisitLoading.test.ts:19-22` - `toBe(true)` at 599 ms, `toBe(false)` at 600; page wiring `T/pages/FrotaPage.test.tsx:311`, `VisaoGeralPage.test.tsx:248`, `EquipePage.test.tsx:285`, `AlertasPage.test.tsx:155` | PASS |
| SKEL-02 | visited page shows content directly | `T/hooks/useFirstVisitLoading.test.ts:30-31` - `expect(result.current).toBe(false)`; per-key `:37-38` | PASS |
| SKEL-03 | `aria-busy="true"` + `role=status` "Carregando..." | `T/components/common/PageSkeleton.test.tsx:12-13` - `toHaveTextContent('Carregando...')`, `closest('[aria-busy="true"]')).not.toBeNull()` | PASS |
| SKEL-04 | toolbar hidden while loading | `T/pages/FrotaPage.test.tsx:314-315` (no "Cadastrar categoria", no regions); `VisaoGeralPage.test.tsx:252-253`; `EquipePage.test.tsx:290-291`; `AlertasPage.test.tsx:160` | PASS |
| SKEL-05 | blocks `aria-hidden="true"` | `T/components/common/PageSkeleton.test.tsx:50-52` - `querySelector('[aria-hidden="true"]')` contains 12 cards | PASS |
| DRAG-01 | dragging card marked | `T/pages/FrotaPage.test.tsx:228-230` - `toHaveAttribute('data-dragging','true')`; `FleetCard.test.tsx:152` | PASS (opacity/dashed in CSS `FleetCard.module.css:24-28`: 0.4, dashed) |
| DRAG-02 | other row highlighted | `T/pages/FrotaPage.test.tsx:238-240` - `data-drop-target 'true'` on Manutencao only; `FleetRow.test.tsx:143` | PASS (dashed + 14% category tint in `FleetRow.module.css:14-18`) |
| DRAG-03 | own row not highlighted | `T/pages/FrotaPage.test.tsx:242-243` - `not.toHaveAttribute('data-drop-target')` | PASS |
| DRAG-04 | marks cleared on drop and cancel | `T/pages/FrotaPage.test.tsx:255-258` (drop), `:261-266` (dragEnd) | PASS |
| DRAG-05 | arriving flash 1 s via drag, menu, picker | `T/pages/FrotaPage.test.tsx:269-278` (true at 999 ms, gone at 1000), `:288` (menu), `:295-302` (picker, 2 cards) | PASS |
| ANIM-01 | backdrop 150 ms, dialog 180 ms scale 0.96 to 1 | `Frontend/src/components/common/Modal.module.css` `fade-in 150ms`, `dialog-in 180ms`, `scale(0.96)` | PASS (CSS, not unit-testable) |
| ANIM-02 | menu and popover 120 ms, 4 px slide | `FleetCard.module.css` and `CategoryFormModal.module.css` `menu-in 120ms`, `translateY(-4px)` | PASS (CSS, not unit-testable) |
| ANIM-03 | reduced motion makes all instant | `Frontend/src/index.css:93-101` `@media (prefers-reduced-motion: reduce)` on `*` with `0.01ms !important` | PASS (CSS, not unit-testable) |
| TOAST-01 | machine toast on Visao Geral | `T/pages/VisaoGeralPage.test.tsx:274-292` - `toEqual(['Máquina "EMP-999" cadastrada'])`, `salva`, `excluída` | PASS |
| TOAST-02 | employee and sector toasts | `T/pages/EquipePage.test.tsx:310-350` - six `toEqual([...])` (cadastrado/salvo/excluído for each) | PASS |
| TOAST-03 | Frota category and machine toasts | `T/pages/FrotaPage.test.tsx:338-360` - `Categoria "Reserva" criada`, `excluída`, `Máquinas adicionadas a "Ativas"`, `EMP-082 removida da categoria` | PASS |
| TOAST-04 | `role=status`, `aria-live=polite` | `T/components/common/Toast.test.tsx:137-138` - `toHaveAttribute('aria-live','polite')` | PASS |
| TOAST-05 | removed at 4 s or on close | `T/components/common/Toast.test.tsx:144-147` (3999 ms present, 4000 gone), `:152-153` | PASS |
| TOAST-06 | newest at the bottom | `T/components/common/Toast.test.tsx:158` - `toEqual(['primeiro','segundo'])` | PASS |
| TOAST-07 | no provider is a no-op | `T/components/common/Toast.test.tsx:174-175` - `not.toThrow()` | PASS |

**Status**: 20/20 covered (17 by unit/integration tests, 3 CSS-only items verified by reading against the spec values).

## Edge Cases

- [x] Leave during skeleton: timer cancelled, not marked visited. `T/hooks/useFirstVisitLoading.test.ts:41-49` - `toBe(true)`.
- [~] Drag ends outside any row clears marks: `T/pages/FrotaPage.test.tsx:261-266`. The test does not assert that the machine stayed in its row (see gap 2).
- [x] "+" adds several: `T/pages/FrotaPage.test.tsx:295-302`.
- [x] Early close does not remove another toast: `T/components/common/Toast.test.tsx:161-171`.

## Discrimination Sensor

Run in an isolated worktree, since removed. The real-tree `git status --porcelain` was empty before and after.

| # | Mutation | Killed? |
| - | -------- | ------- |
| 1 | hook marks visited on effect start (before delay) | Killed |
| 2 | hook ignores the visited set | Killed |
| 3 | `dismiss` stops clearing the timer, nothing else changed | Survived (equivalent mutant: the late `dismiss(id)` is a no-op filter) |
| 3c | timer not cleared on close AND timer callback removes the first item | Killed (Toast.test.tsx:161) |
| 4 | toasts prepended | Killed |
| 5 | `useToast` without provider throws | Killed |
| 6 | source row gets highlighted | Killed |
| 7 | drag marks not cleared on dragend | Killed |
| 8 | arriving mark never clears | Killed |
| 9 | picker add does not mark arrivals | Killed |
| 10 | skeleton renders the toolbar | Killed |
| 11 | `aria-busy` missing | Killed |
| 12 | menu "Mover para" does not mark arrival | Killed |
| 13 | dragleave fires when entering a child | Killed |
| 14 | drop on own row moves/flashes | Killed |
| 15 | sector-deleted toast removed | Killed |
| 16 | toast close button is a no-op | Killed |
| 17 | hook delay off by one (601 ms) | Killed |
| 18 | team skeleton sector count 4 to 3 | Killed |

**Outcome**: 18 of 19 killed. The survivor (#3) is an equivalent mutant, and its behavioral variant (#3c) is killed. Depth: lightweight-plus.

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / no scope creep | PASS |
| Matches patterns (hooks, CSS modules, i18n) | PASS |
| Every test maps to an AC or edge case | PASS |
| Guidelines (`docs/frontend.md` tests mirror `src/`) | PASS |

## Gate Check

- Command: `cd Frontend && yarn test` then `yarn lint`
- Result: 36 files, 465 passed, 0 failed, 0 skipped. ESLint clean.

## Gaps (non-blocking)

1. SKEL-01/02: page tests mock the hook, so no test renders a page with the real hook (key wiring such as `'alertas'`). Fix: one integration test per page using `vi.importActual` with fake timers.
2. DRAG edge "drag ends outside any row": no assertion that the machine stays in its original row. Fix: after `dragEnd`, assert `codesIn('Ativas')` still contains EMP-082.
3. TOAST edge test (Toast.test.tsx:161) uses identical messages for both toasts, so it cannot tell which toast survived. Fix: use distinct messages.

## Requirement Traceability

SKEL-01..05, DRAG-01..05, ANIM-01..03 and TOAST-01..07 are Verified.

## Summary

**Overall**: Ready
**Spec-anchored check**: 20/20 ACs, 0 spec-precision gaps (ANIM items are CSS-only)
**Sensor**: 18/19 killed (1 equivalent)
**Gate**: 465 passed

## validate_state.py output
```

validate_state: 0 error(s) across [ui-polish]
```
