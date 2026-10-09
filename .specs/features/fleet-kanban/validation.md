# fleet-kanban Validation

**Date**: 2026-10-02
**Spec**: `.specs/features/fleet-kanban/spec.md`
**Diff range**: `610e2e1^..d0e7f60` (iteration 2; iteration 1 was `..6200abf`)
**Verifier**: independent sub-agent (author != verifier)
**Result**: PASS

## Validation: fleet-kanban - PASS

Reason (iteration 2): all 42 ACs have evidence; FILTER-04 and FILTER-06 now killed their mutants. BOARD-04 (CSS scroll) accepted as visual check by coordinator.

## Gate
Scoped run (fleet.test.ts, components/fleet, MachineDetailModal, FrotaPage, i18n, Header): 9 files, 166 passed, 0 failed.

## Spec-anchored acceptance criteria

| AC | Spec outcome | file:line + assertion | Result |
| -- | ------------ | --------------------- | ------ |
| BOARD-01 | title + 4 rows in order | `pages/FrotaPage.test.tsx:235` regions labels toEqual [Acidentes,Ativas,Manutenção,Disponíveis]; title `layout/Header.test.tsx:17` heading 'Gerenciamento das máquinas' | PASS |
| BOARD-02 | initial placement, Offline out | `data/fleet.test.ts:30,38-43`; `FrotaPage.test.tsx:245-249` | PASS |
| BOARD-03 | name, color, count | `fleet/FleetRow.test.tsx:172-174` (name, '2', `--category-color` '#3A9CFF') | PASS |
| BOARD-04 | horizontal scroll in row | CSS only (`FleetRow.module.css`); jsdom cannot assert | Spec-precision gap (untestable in jsdom; visual check) |
| BOARD-05 | fields per row type, "(Indefinido)" | `FleetCard.test.tsx:47,48,58,63,69,42,53,74,79-81` | PASS |
| BOARD-06 | empty row shows only "+" | `FleetRow.test.tsx:184-187` | PASS |
| MOVE-01 | drop -> end of row, both counters | `FrotaPage.test.tsx:260-263` | PASS |
| MOVE-02 | same-row drop keeps order | `fleet.test.ts:66` toBe(board); `FrotaPage.test.tsx:271` | PASS |
| MOVE-03 | menu move to end | `FrotaPage.test.tsx:288`; `FleetCard.test.tsx:115` | PASS |
| MOVE-04 | remove + available in picker | `FrotaPage.test.tsx:296,299` | PASS |
| MOVE-05 | at most one category | `fleet.test.ts:48`; `fleet.test.ts:104` | PASS |
| MOVE-06 | status unchanged | `fleet.test.ts:78` MACHINES toEqual before (weak: function never receives machines, vacuous) | PASS (weak) |
| CAT-01 | both entries open modal | `FrotaPage.test.tsx:224,315` | PASS |
| CAT-02 | popover 7 colors + hex | `CategoryFormModal.test.tsx:289-292` | PASS |
| CAT-03 | append empty row, close | `FrotaPage.test.tsx:306-309`; `fleet.test.ts:125` | PASS |
| CAT-04 | "Campo obrigatório", stays open | `CategoryFormModal.test.tsx:319-321` | PASS |
| CAT-05 | duplicate msg | `CategoryFormModal.test.tsx:328`; `FrotaPage.test.tsx:321-322`; `fleet.test.ts:159-160` | PASS |
| CAT-06 | 30 chars | `CategoryFormModal.test.tsx:334` maxLength '30' (mutant maxLength 40 killed) | PASS |
| CAT-07 | invalid hex keeps color | `CategoryFormModal.test.tsx:301-305`; `fleet.test.ts:175` | PASS |
| CAT-08 | Cancelar/close/Escape | `CategoryFormModal.test.tsx:342-343` | PASS |
| ADD-01 | only unassigned listed | `FrotaPage.test.tsx:329` toEqual [EMP-086,EMP-094]; `fleet.test.ts:114` | PASS |
| ADD-02 | filter code/name | `MachinePickerModal.test.tsx:397,399` | PASS |
| ADD-03 | toggle chip + check | `MachinePickerModal.test.tsx:376-381` | PASS |
| ADD-04 | chip x unselects | `MachinePickerModal.test.tsx:389-390` | PASS |
| ADD-05 | confirm appends, closes | `FrotaPage.test.tsx:332-333`; `MachinePickerModal.test.tsx:407`; `fleet.test.ts:98` | PASS |
| ADD-06 | empty msg + disabled | `MachinePickerModal.test.tsx:417-418` | PASS |
| ADD-07 | disabled w/o selection | `MachinePickerModal.test.tsx:412` | PASS |
| DEL-01 | button on custom | `FleetRow.test.tsx:245-246` | PASS |
| DEL-02 | not on initial | `FleetRow.test.tsx:251`; `fleet.test.ts:146` | PASS |
| DEL-03 | confirmation | `FrotaPage.test.tsx:344-345,357-358` | PASS |
| DEL-04 | row removed, machines freed | `FrotaPage.test.tsx:348-350`; `fleet.test.ts:140-141` | PASS |
| FILTER-01 | top search all rows | `FrotaPage.test.tsx:365-367` | PASS |
| FILTER-02 | category dropdown | `FrotaPage.test.tsx:374,376` | PASS |
| FILTER-03 | row search only that row | `FleetRow.test.tsx:199`; (page-level isolation of other rows not asserted) | PASS |
| FILTER-04 | period filter, inclusive | `FleetRow.test.tsx:228-235` default + out-of-range only; boundary dates not asserted; mutant `>=`->`>` SURVIVED | GAP (partial) |
| FILTER-05 | counter = total | `FrotaPage.test.tsx:368`; `FleetRow.test.tsx:200,212` | PASS |
| DETAIL-01 | click opens modal w/ name, badge, Código, Mac | `FrotaPage.test.tsx:381-383` (checks Funcionário/tabs only; name/badge/Código/Mac not asserted on page; pre-existing modal header covered in MachineDetailModal tests) | PASS (indirect) |
| DETAIL-02 | 4 rows | `MachineDetailModal.test.tsx:168-171` | PASS |
| DETAIL-03 | tabs + period | `MachineDetailModal.test.tsx:185,197-198` | PASS |
| DETAIL-04 | no Editar/Excluir | `MachineDetailModal.test.tsx:203-204` | PASS |
| DETAIL-05 | menu / drag do not open | `FrotaPage.test.tsx:391` (menu only; drag not asserted) | PASS (menu only) |

Edge cases: drop outside row `FrotaPage.test.tsx:277-281` PASS; delete category while detail open: unreachable (modal blocks UI; dialog state is single) N/A; empty picker `MachinePickerModal.test.tsx:417` PASS; filter hides all -> "Nenhuma máquina encontrada" `FrotaPage.test.tsx:367`, `FleetRow.test.tsx:206,211` PASS. i18n 7 locales: `config/i18n.test.ts:154-166`.

## Discrimination sensor (14 valid mutants, isolated git worktree, removed afterwards)

| # | Location | Mutation | Result |
| - | -------- | -------- | ------ |
| M1 | `data/fleet.ts:50` | moveMachine prepends | Killed (4 fail) |
| M2 | `data/fleet.ts:74` | deleteCategory deletes any category | Killed |
| M3 | `data/fleet.ts:81` | duplicate check case-sensitive | Killed |
| M4 | `FleetRow.tsx:242` | counter uses filtered count | Killed |
| M5 | `FleetRow.tsx:212` | period filter ignored | Killed |
| M6 | `data/fleet.ts:64` | picker lists assigned machines | Killed |
| M8 | `FleetRow.tsx:212` | inclusive bounds made exclusive | SURVIVED |
| M9 | `data/fleet.ts:47` | move to same row not no-op | Killed |
| M10 | `FrotaPage.tsx:117` | top search ignored | Killed |
| M11 | `FleetRow.tsx:276` | delete button on all rows | Killed |
| M13 | `FrotaPage.tsx:162` | drop category filter reset after deleting filtered category | SURVIVED (unspecified behavior, low) |
| M14 | `FleetRow.tsx:285` | empty state keyed on filtered count | Killed |
| M15 | `data/fleet.ts:56` | addMachines accepts already-assigned | Killed |
| M16 | `CategoryFormModal.tsx` | maxLength 30 -> 40 | Killed |

Killed 12/14 (2 invalid no-op mutants discarded). Real tree `git status --porcelain` identical to baseline (clean).

## Ranked gaps
1. FILTER-04: add a FleetRow test with machine's last-accident date used as both `from` and `to` (and one day outside) to prove inclusive bounds (kills M8).
2. DETAIL-05: add a page test that dragStart/dragEnd on a card does not open the dialog.
3. MOVE-06: replace vacuous MACHINES-unchanged check with an assertion at page level (status badge text of moved card unchanged).
4. BOARD-04: spec-precision gap, horizontal scroll is CSS-only; verify visually.
5. M13 (low): either spec the filter reset after deleting the filtered category or add a test.

## Re-verification (iteration 2, commit d0e7f60)

Gate (scoped, same files): 9 files, 184 passed, 0 failed. Alerts merge (90fcd85) did not break any fleet test.

| AC | file:line + assertion | Result |
| -- | --------------------- | ------ |
| FILTER-04 | `fleet/FleetRow.test.tsx:106-123` from=to=accident day shows EMP-081; from=day+1 and to=day-1 hide it | PASS |
| FILTER-06 | `pages/FrotaPage.test.tsx:205-214` `expect(filter).toHaveValue('all')` + 4 regions after deleting filtered category | PASS |
| DETAIL-05 | `pages/FrotaPage.test.tsx:187-191` dragStart+dragEnd -> no dialog | PASS |
| MOVE-06 | `pages/FrotaPage.test.tsx:193-201` moved card detail shows 'Em uso', not 'Manutenção' | PASS |
| BOARD-04 / DETAIL-01 | accepted by coordinator (visual check at 1440px; modal test coverage) | accepted |

Sensor (isolated worktree, removed; real `git status --porcelain` equals baseline):

| # | Mutation | Result |
| - | -------- | ------ |
| M8 | period bounds both exclusive | Killed |
| M8b | lower bound exclusive only | Killed |
| M8c | upper bound exclusive only | Killed |
| M13 | filter reset line removed | Killed |
| M17 | dragStart also opens detail | Killed (3 fail) |
| M1 | move prepends | Killed |
| M2 | delete any category | Killed |
| M3 | case-sensitive duplicate | Killed |
| M4 | counter = filtered count | Killed |
| M5 | period filter ignored | Killed |
| M6 | picker lists assigned | Killed |
| M18 | filter always reset on any delete | Survived: equivalent (when a filter is active only that row is visible, so no other category can be deleted) |

Killed 11/12 (1 equivalent). Remaining low note: none blocking.

## validate_state output

```
validate_state: 0 error(s) across [fleet-kanban]
(exit 0)
```
