# sectors Validation

**Date**: 2026-10-16
**Spec**: `.specs/features/sectors/spec.md`
**Diff range**: `f5163bd..b353e5f` (3529dfb through b353e5f, 16 commits: planning docs + T1-T15)
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: FAIL

Every acceptance criterion has spec-anchored evidence and both gates are green, but the discrimination sensor left 4 of 42 mutants alive. The surviving mutants are weak tests, not wrong behavior: the implementation is correct on every mutated line. Four small test fixes close the gaps (see Fix Plans).

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T11 | ✅ Done | - |
| T12 | ✅ Done | SPEC_DEVIATION (author): absorbed part of T13 (Visão Geral passes `sectors`/`defaultFilialId` to the panel) |
| T13-T15 | ✅ Done | - |

---

## Spec-Anchored Acceptance Criteria

### P1: CRUD de setor no backend

| # | Spec-defined outcome | `file:line` + assertion | Result |
| - | -------------------- | ----------------------- | ------ |
| 1 | scope branches, sort by `nome`, `{ _id, nome, filialId, filial: { nome } }` | `Backend/tests/unit/sectorService.test.ts:42-47` - `find({ filialId: { $in: [F1, F2] } })`, `sort({ nome: 1 })`, `toEqual([{ _id, nome, filialId, filial: { nome: 'Matriz' } }, ...])` | ✅ |
| 2 | `?filialId` in scope filters; outside scope → empty | `sectorService.test.ts:53` - `$in: [F2]`; `:58-59` - `toEqual([])`, `$in: []` | ✅ |
| 3 | invalid `filialId` → 400 | `sectorController.test.ts:238-241` - `status(400)`, service not called | ✅ |
| 4 | create in `resolverFilial` branch, 201, AC1 shape | `sectorController.test.ts:263-265` - `criar(ESCOPO, { nome: 'Doca', filialId: FILIAL })`, `status(201)`; `sectorService.test.ts:69-70` | ✅ |
| 5 | missing/blank/>60 → 400 exact message, nothing saved | `sectorController.test.ts:268-279` - `{ error: NOME_INVALIDO }` + `naoChamouServico()`; 60 passes `:281-284` | ✅ |
| 6 | duplicate (case-insensitive) → 409 exact message on POST and PUT | `sectorService.test.ts:75-77` (create, message), `:96-98` (update, 409); `schemas.test.ts:141-145` collation pt/2 unique | ✅ |
| 7 | PUT nome → 200 AC1 shape | `sectorService.test.ts:92-93`; `sectorController.test.ts:310-312` | ✅ |
| 8 | extra field or `$` key → 400, nothing saved | `sectorController.test.ts:315-325` | ✅ |
| 9 | empresa scope moves via `resolverFilial`, 200 | `sectorService.test.ts:107-108` - `$set: { filialId: F2 }`, `filial.nome 'Unidade Centro'` | ✅ |
| 10 | non-empresa moving → 403 exact message | `sectorService.test.ts:112-115` | ✅ |
| 11 | move with N machines → 409 "Setor com N máquina(s) ligada(s) não pode mudar de filial.", nothing saved | `sectorService.test.ts:131-134` (N=3) | ⚠️ boundary N=1 untested (mutant B8 survived) |
| 12 | delete without machines → 200 `{ _id, message }` | `sectorService.test.ts:147-149`; `sectorController.test.ts:346-348` | ✅ |
| 13 | delete with N machines → 409 "Setor com N máquina(s) ligada(s).", nothing deleted | `sectorService.test.ts:156-157` (N=2) | ⚠️ boundary N=1 untested (mutant B24 survived) |
| 14 | missing / out of scope → 404 "Setor não encontrado." | `sectorService.test.ts:139` (PUT, message), `:162-163` (DELETE) | ✅ |
| 15 | non-admin writes → 403 exact message | `sectorController.test.ts:250-255`; mounted route `app.test.ts:116-121` | ✅ |

### P1: Máquina ligada ao setor

| # | Spec-defined outcome | `file:line` + assertion | Result |
| - | -------------------- | ----------------------- | ------ |
| 1 | same-branch `setorId` saved on POST/PUT | `machineService.test.ts:538-541` - `Sector.exists({ _id, filialId: F1 })`, `$set: {..., setorId}`; create `:426-429` | ✅ |
| 2 | other branch / missing → 400 exact message, nothing saved | `machineService.test.ts:437-445` (create: message, no `Device.create`/`Forklift.create`); `:547-552` (update) | ✅ |
| 3 | non-ObjectId non-null → 400 exact message | `machineController.test.ts:308-311`, `:296-297` | ✅ |
| 4 | `setorId: null` unlinks | `machineController.test.ts:368-372`; `machineService.test.ts:555-559` | ✅ |
| 5 | GET returns `setorId` and linked name or `''` | `machineService.test.ts:79-80`, `:111-117` | ✅ |
| 6 | `setor` on PUT → 400 exact message | `machineController.test.ts:375-380` | ✅ |
| 7 | sessions/incidents `maquina.setor` = linked name or `''` | `sessionService.test.ts:37,75-80`; `incidentService.test.ts:31,110-116` | ✅ |
| 8 | `setorId` on PUT forklifts → 400 exact message | `forkliftController.test.ts:137-145` | ✅ |
| 9 | PUT forklifts with `filialId` writes `setorId: null` | `forkliftController.test.ts:160` | ✅ |
| 10 | sector select with "Sem setor" + form-branch sectors | `Frontend/src/test/components/machines/NewMachinePanel.test.tsx:235-268` | ✅ |
| 11 | branch change clears sector | `NewMachinePanel.test.tsx:279-292` - `toHaveValue('')`, options `['Sem setor','Doca Norte']` | ✅ |
| 12 | renamed sector → new name in GET | `machineService.test.ts:102-109` | ✅ |

### P1: Setores na Equipe pela API

| # | Spec-defined outcome | `file:line` + assertion | Result |
| - | -------------------- | ----------------------- | ------ |
| 1 | fetch active branch (all with todas), skeleton | `Frontend/src/test/pages/EquipePage.test.tsx:812-835` | ✅ |
| 2 | error with retry | `EquipePage.test.tsx:842` | ✅ |
| 3 | card and detail show `filial.nome` | `components/team/SectorCard.test.tsx:14`; `SectorInfoModal.test.tsx:8` | ✅ |
| 4 | empresa: select with scope branches | `components/team/SectorFormModal.test.tsx:50-66` | ✅ |
| 5 | filiais: edit shows branch name read-only | `SectorFormModal.test.tsx:68-96` | ✅ |
| 6 | optimistic apply, then API response | `EquipePage.test.tsx:854` (create swaps in API answer), `:898`, `:910`, `:949` | ✅ |
| 7 | rollback + toast; delete 409 shows count | `EquipePage.test.tsx:873-896`, `:920-947`, `:960-985` - `toastTexts()` contains `'Setor com 3 máquina(s) ligada(s)'`, card back at index 4 | ✅ (see spec-precision gap 1) |
| 8 | no `SECTORS` mock, no `unidade` | `Frontend/src/data/team.ts` no longer exports them; `grep -rn "SECTORS\|unidade" Frontend/src --exclude-dir=test` → no hits | ✅ |
| 9 | new keys in 7 locales, translated | `Frontend/src/test/config/i18n.test.ts:104-110` covers `team.*` key parity only | ❌ `machines.sectorNone/filterSectorAll/filterSectorLabel` parity and `{{n}}` placeholder untested (mutants F16, F17, F18 survived) |

### P2: Filtro por setor

| # | Spec-defined outcome | `file:line` + assertion | Result |
| - | -------------------- | ----------------------- | ------ |
| 1 | select "Todos os setores" + active-branch sectors | `pages/VisaoGeralPage.test.tsx:877`; `pages/FrotaPage.test.tsx:790` | ✅ |
| 2 | only machines of the sector, combined with existing filters | `VisaoGeralPage.test.tsx:888` (with status); `FrotaPage.test.tsx:798,808` (with search); `data/machines.test.ts:81,90` | ✅ |
| 3 | "Todos" does not filter | `VisaoGeralPage.test.tsx:899`; `FrotaPage.test.tsx:817`; `machines.test.ts:85` | ✅ |
| 4 | branch change resets to "Todos" | `VisaoGeralPage.test.tsx:952-960` - `sectorFilter() toHaveValue('Todos')`; `FrotaPage.test.tsx:869` | ✅ |

### P2: Migração, seed e reset

| # | Spec-defined outcome | `file:line` + assertion | Result |
| - | -------------------- | ----------------------- | ------ |
| 1 | one sector per distinct trimmed, case-insensitive text per branch; link | `Backend/tests/unit/migrateSectors.test.ts:48-67`, reuse existing `:70-78` | ✅ |
| 2 | second run creates/updates nothing | `migrateSectors.test.ts:94-107` - `create`/`updateOne` not called | ✅ |
| 3 | blank/spaces/>60 → no sector, counted in `ignoradas` | `migrateSectors.test.ts:80-91` | ✅ |
| 4 | log counts; disconnect even on failure | `migrateSectors.test.ts:110-116`, `:127-132` | ✅ |
| 5 | seed creates sectors per branch and links `setorId` | `seedData.test.ts:202-212` | ✅ |
| 6 | `COLECOES` includes `Sector` | `resetData.test.ts:37-38` | ✅ |

### Edge cases

- [x] Concurrent duplicate name → 409 via unique index: `schemas.test.ts:141-145` (index) + `sectorService.test.ts:73-78` (11000 → 409; mutant B1 killed).
- [x] Deleted sector still referenced → `setor: ''` and stored `setorId`: `machineService.test.ts:120-127`.

**Status**: ❌ AC P1-Equipe-9 has no evidence for the `machines.*` keys; ⚠️ boundary gaps on CRUD-11/13; 3 spec-precision gaps flagged.

---

## Spec-Precision Gaps

1. **Equipe AC7 "toast com a mensagem do erro"**: the spec does not say whether the toast shows the API text or a translated one. The implementation shows i18n text (`team.sectorHasMachines` with `n` parsed from the API message by `/Setor com (\d+)/`, `Frontend/src/pages/EquipePage.tsx:171`) and a generic `team.saveError` for non-409 failures. Tests assert that choice. If the backend wording changes, the count silently disappears (falls back to `sectorNameTaken`). Suggest: pin in the spec that the toast is translated and that the count comes from a structured field (e.g. `{ error, maquinas: N }`).
2. **Equipe AC9 "traduzidas"**: no measurable definition. Suggest: "differs from pt-BR in every non-pt locale and keeps every `{{placeholder}}`".
3. **Máquina AC6 only covers PUT**: `POST /api/machines` with `setor` is silently ignored (`Backend/src/feature/machine/machineController.ts:80-81`, `lerDadosMaquina` reads only `CAMPOS_MAQUINA`). The spec says nothing either way. Suggest: state whether POST should 400 too.
4. Success toasts for sector create/save/delete fire before the API answers (`EquipePage.tsx:188,198,217`), so a failure shows a success toast and then an error toast. The spec does not cover this. Same pattern as the existing employee flow (AD-012).

---

## Discrimination Sensor

Isolated temp `git worktree` at HEAD (node_modules symlinked), one mutation at a time, targeted vitest run, `git checkout` between mutants. The worktree was removed afterwards, and real-tree `git status --porcelain` matched the empty pre-sensor baseline.

| Mutation | File | Description | Killed? |
| -------- | ---- | ----------- | ------- |
| B1 | `Backend/src/feature/sector/sectorService.ts:26` | 11000 → 11001 (no 409 translation) | ✅ |
| B2 | `sectorController.ts:106` | max nome 60 → 61 | ✅ |
| B3 | `sectorController.ts:147` | admin guard removed on POST | ✅ |
| B4 | `sectorService.ts:34` | `?filialId` not intersected with scope | ✅ |
| B5 | `sectorService.ts:49` | update drops scope filter | ✅ |
| B6 | `sectorService.ts:74` | delete drops scope filter | ✅ |
| B7 | `sectorService.ts:55` | move-branch 403 removed | ✅ |
| B8 | `sectorService.ts:58` | move 409 `> 0` → `> 1` | ❌ Survived |
| B9 | `sectorService.ts:76` | delete 409 count + 1 | ✅ |
| B10 | `machineService.ts:117` | create skips same-branch sector check | ✅ |
| B11 | `machineService.ts:158` | update skips same-branch sector check | ✅ |
| B12 | `machineService.ts:63` | missing sector falls back to legacy text | ✅ |
| B13 | `machineController.ts:81` | PUT accepts `setor` | ✅ |
| B14 | `forkliftController.ts:107` | `setorId` unprotected | ✅ |
| B15 | `forkliftController.ts:129` | branch move keeps `setorId` | ✅ |
| B16 | `sessionService.ts:71` | session reads legacy text | ✅ |
| B17 | `incidentService.ts:32` | incident reads legacy text | ✅ |
| B18 | `migrateSectors.ts:20` | migration accepts > 60 chars | ✅ |
| B19 | `migrateSectors.ts:29` | migration ignores existing sector | ✅ |
| B20 | `migrateSectors.ts:13` | migration re-processes linked forklifts | ✅ |
| B21 | `seedData.ts:48` | seed does not link `setorId` | ✅ |
| B22 | `resetData.ts:16` | `COLECOES` without `Sector` | ✅ |
| B23 | `sectorService.ts:29` | machine count on wrong field | ✅ |
| B24 | `sectorService.ts:76` | delete 409 `> 0` → `> 1` | ❌ Survived |
| F1 | `Frontend/src/pages/EquipePage.tsx:185` | edit failure no rollback | ✅ |
| F2 | `EquipePage.tsx:219` | delete failure no rollback | ✅ |
| F3 | `EquipePage.tsx:195` | create failure keeps temp | ✅ |
| F4 | `EquipePage.tsx:172` | 409 toast loses count | ✅ |
| F5 | `EquipePage.tsx:183` | branch scope sends `filialId` on edit | ✅ |
| F6 | `EquipePage.tsx:194` | create keeps temp instead of API answer | ✅ |
| F7 | `components/machines/NewMachinePanel.tsx:80` | branch change keeps sector | ✅ |
| F8 | `NewMachinePanel.tsx:59` | sector select unfiltered by branch | ✅ |
| F9 | `pages/VisaoGeralPage.tsx:55` | overview filter not reset on branch change | ✅ |
| F10 | `pages/FrotaPage.tsx:78` | fleet filter not reset on branch change | ✅ |
| F11 | `FrotaPage.tsx:312` | fleet ignores sector filter | ✅ |
| F12 | `data/machines.ts:352` | `filterMachines` ignores sector | ✅ |
| F13 | `VisaoGeralPage.tsx:85` | overview does not pass sector filter | ✅ |
| F14 | `components/team/SectorFormModal.tsx:33` | branch scope 2+ create hides select | ✅ |
| F15 | `SectorFormModal.tsx:33` | select always shown (branch scope edit) | ✅ |
| F16 | `locales/de/translation.json` | `machines.filterSectorAll` removed | ❌ Survived |
| F17 | `locales/ja/translation.json` | `machines.sectorNone` left in Portuguese | ❌ Survived |
| F18 | `locales/fr/translation.json` | `team.sectorHasMachines` loses `{{n}}` | ❌ Survived |

**Sensor depth**: expanded (≥5; scope/admin/data-integrity paths)
**Result**: 38/42 killed - FAIL ❌

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches patterns (category service/controller, `exigirAdmin`, optimistic `saveOptimistic` style) | ✅ |
| Spec-anchored outcome check | ⚠️ boundary N=1 and i18n gaps above |
| Per-layer coverage (service 1:1; controller happy + 400/403/404/409) | ✅ |
| Every test maps to a requirement | ✅ |
| Documented guidelines: `Backend/package.json` (unit only), `.specs/STATE.md` AD-010/AD-012 | ✅ |

---

## Gate Check

- **Backend**: `cd Backend && npx tsc --noEmit && yarn test` → exit 0; 47 files, **863 passed**, 0 failed, 0 skipped (only `tests/unit`; no DB access).
- **Frontend** (Node v25.9.0): `npx tsc -b && npx eslint . && npx vitest run` → exit 0; 92 files, **1364 passed**, 0 failed, 0 skipped.
- **Test integrity**: no tests deleted. Existing tests were updated from `setor` text to `setorId` to follow the spec (e.g. `machineController.test.ts:375` now asserts the 400 that replaced the old pass-through). No assertions were weakened.

---

## SPEC_DEVIATIONs noted by the author

1. **T12 absorbed part of T13**: task-boundary only. The behavior is covered by the T13 tests (`VisaoGeralPage.test.tsx:834-899`). No spec impact.
2. **`PUT /api/forklifts` clears `setorId` whenever `filialId` is in the body**: this matches the spec's own assumption row ("Todo corpo com `filialId` grava `setorId: null` junto, mesmo se for a filial atual"), so it is not a real deviation. Evidence: `Backend/src/feature/forklift/forkliftController.ts:126-129`, `forkliftController.test.ts:160`.

---

## Fix Plans

### Fix 1: Machine-count guards untested at N=1 (B8, B24) - Major

- **Fix task**: in `Backend/tests/unit/sectorService.test.ts`, add `countDocuments → 1` cases: the move expects 409 "Setor com 1 máquina(s) ligada(s) não pode mudar de filial." with `findOneAndUpdate` not called (next to `:129`), and the delete expects 409 "Setor com 1 máquina(s) ligada(s)." with `deleteOne` not called (next to `:152`).
- **Done when**: B8 and B24 are killed.

### Fix 2: `machines.*` sector keys have no locale parity test (F16, F17) - Minor

- **Fix task**: in `Frontend/src/test/config/i18n.test.ts`, add an `it.each(ALL_LOCALES)` asserting `machines.sectorNone`, `machines.filterSectorAll`, `machines.filterSectorLabel` (and `team.sectorHasMachines`, `team.sectorMoveHasMachines`, `team.sectorNameTaken`, `team.labelSectorBranch`) are non-empty and, for non-pt locales, differ from pt-BR.
- **Done when**: F16 and F17 are killed.

### Fix 3: `{{n}}` placeholder not guarded (F18) - Minor

- **Fix task**: same file, assert every locale's `team.sectorHasMachines` and `team.sectorMoveHasMachines` contain `{{n}}`.
- **Done when**: F18 is killed.

---

## Requirement Traceability Update

| Requirement | New Status |
| ----------- | ---------- |
| SECT-01, SECT-02, SECT-05 to SECT-12, SECT-14 to SECT-17 | ✅ Verified |
| SECT-03 (CRUD 11), SECT-04 (CRUD 13) | ❌ Needs Fix (test boundary N=1) |
| SECT-13 (i18n) | ❌ Needs Fix (parity/placeholder test) |

---

## Summary

**Overall**: ❌ Not Ready (test-strength gaps only; behavior is correct)

**Spec-anchored check**: 43/46 ACs fully matched; 2 boundary gaps, 1 AC without evidence for part of its keys, 4 spec-precision gaps flagged
**Sensor**: 38/42 mutations killed
**Gate**: Backend 863 passed, Frontend 1364 passed

**What works**: the full sectors CRUD with scope, admin and 409 rules; machine linking with the same-branch check; name resolution in machines, sessions and incidents; forklift protection; idempotent migration; seed and reset; Equipe optimistic flow with rollback; branch-aware sector selects; sector filters in Visão Geral and Frota.

**Next steps**: apply Fix 1-3 (tests only), then re-run the Verifier.
