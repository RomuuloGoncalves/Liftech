# sectors Validation

**Date**: 2026-10-16
**Spec**: `.specs/features/sectors/spec.md`
**Diff range**: `f5163bd..HEAD` (HEAD = 73e9f7f at round 2: planning docs, T1-T15, round-1 report 3c44a53, test fixes 743f8b0, spec decisions 73e9f7f)
**Round**: 2 of 3
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: PASS

Round 2: all 46 acceptance criteria have spec-anchored evidence, both full gates are green, and the full sensor kills 42 of 42 mutants. Round 1 failed on 5 surviving mutants (B8, B24, F16, F17, F18; round 1 reported "38/42", the correct count was 37/42). Commit 743f8b0 added the missing tests and 73e9f7f put the 4 spec-precision gaps into the spec as explicit assumptions.

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
| 11 | move with N machines → 409 "Setor com N máquina(s) ligada(s) não pode mudar de filial.", nothing saved | `sectorService.test.ts:131-134` (N=3), `:137-143` (N=1) | ✅ (round 2; B8 killed) |
| 12 | delete without machines → 200 `{ _id, message }` | `sectorService.test.ts:147-149`; `sectorController.test.ts:346-348` | ✅ |
| 13 | delete with N machines → 409 "Setor com N máquina(s) ligada(s).", nothing deleted | `sectorService.test.ts:156-157` (N=2), `:168-174` (N=1) | ✅ (round 2; B24 killed) |
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
| 9 | new keys in 7 locales, translated | `Frontend/src/test/config/i18n.test.ts:487-493` - the 7 sector keys are truthy in every locale and `.not.toBe(ptBR value)` outside pt-BR; `:495-499` - `toContain('{{n}}')`; `team.*` parity `:104-110` | ✅ (round 2; F16-F18 killed; "traduzida" now defined at `spec.md:52`) |

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

**Status**: ✅ All ACs covered (round 2).

---

## Spec-Precision Gaps

**Round 2**: all four are resolved as explicit assumptions in `spec.md:51-54`, and the code matches each one. Residual note: gap 3 (POST ignores `setor`) has no dedicated test. The behavior is the generic pass-list in `machineController.ts:80` and is low risk, so it is not a blocker. Gap 1 keeps the regex coupling to the backend text on purpose; the spec records the upgrade path (`maquinas` in the 409 body).

Round 1 findings:

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
**Round 1 sensor outcome**: 37/42 killed (B8, B24, F16, F17, F18 survived) - FAIL ❌

### Round 2 (HEAD 73e9f7f)

All 42 mutants re-run in a fresh temp worktree (same script, same targeted test files). The worktree was removed afterwards, and real-tree `git status --porcelain` matched the clean baseline.

| Mutation | Round 1 | Round 2 |
| -------- | ------- | ------- |
| B8 move 409 `> 0` → `> 1` | ❌ Survived | ✅ Killed by `sectorService.test.ts:137` |
| B24 delete 409 `> 0` → `> 1` | ❌ Survived | ✅ Killed by `sectorService.test.ts:168` |
| F16 de `machines.filterSectorAll` removed | ❌ Survived | ✅ Killed by `i18n.test.ts:487` |
| F17 ja `machines.sectorNone` in Portuguese | ❌ Survived | ✅ Killed by `i18n.test.ts:487` |
| F18 fr `team.sectorHasMachines` without `{{n}}` | ❌ Survived | ✅ Killed by `i18n.test.ts:495` |
| B1-B7, B9-B23, F1-F15 (37 previously killed) | ✅ Killed | ✅ Killed (no regression) |

**Result**: 42/42 killed (round 2) - PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches patterns (category service/controller, `exigirAdmin`, optimistic `saveOptimistic` style) | ✅ |
| Spec-anchored outcome check | ✅ (round 2) |
| Per-layer coverage (service 1:1; controller happy + 400/403/404/409) | ✅ |
| Every test maps to a requirement | ✅ |
| Documented guidelines: `Backend/package.json` (unit only), `.specs/STATE.md` AD-010/AD-012 | ✅ |

---

## Gate Check

- **Backend**: `cd Backend && npx tsc --noEmit && yarn test` → exit 0; 47 files, **863 passed**, 0 failed, 0 skipped (only `tests/unit`; no DB access).
- **Frontend** (Node v25.9.0): `npx tsc -b && npx eslint . && npx vitest run` → exit 0; 92 files, **1364 passed**, 0 failed, 0 skipped.
- **Round 2** (HEAD 73e9f7f): Backend → exit 0, **865 passed** (+2); Frontend → exit 0, **1378 passed** (+14: 2 `it.each` × 7 locales). 0 failed, 0 skipped.
- **Test integrity**: no tests deleted. Existing tests were updated from `setor` text to `setorId` to follow the spec (e.g. `machineController.test.ts:375` now asserts the 400 that replaced the old pass-through). No assertions were weakened.

---

## SPEC_DEVIATIONs noted by the author

1. **T12 absorbed part of T13**: task-boundary only. The behavior is covered by the T13 tests (`VisaoGeralPage.test.tsx:834-899`). No spec impact.
2. **`PUT /api/forklifts` clears `setorId` whenever `filialId` is in the body**: this matches the spec's own assumption row ("Todo corpo com `filialId` grava `setorId: null` junto, mesmo se for a filial atual"), so it is not a real deviation. Evidence: `Backend/src/feature/forklift/forkliftController.ts:126-129`, `forkliftController.test.ts:160`.

---

## Fix Plans

**Round 2**: Fix 1-3 applied in 743f8b0 and verified (the mutants they target are killed). No open fix tasks.

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
| SECT-03 (CRUD 11), SECT-04 (CRUD 13) | ✅ Verified (round 2) |
| SECT-13 (i18n) | ✅ Verified (round 2) |

---

## Summary

**Overall**: ✅ Ready (round 2)

**Spec-anchored check**: 46/46 ACs matched; the 4 round-1 spec-precision gaps are resolved in `spec.md:51-54`
**Sensor**: 42/42 mutations killed (round 1: 37/42)
**Gate**: Backend 865 passed, Frontend 1378 passed

**What works**: the full sectors CRUD with scope, admin and 409 rules; machine linking with the same-branch check; name resolution in machines, sessions and incidents; forklift protection; idempotent migration; seed and reset; Equipe optimistic flow with rollback; branch-aware sector selects; sector filters in Visão Geral and Frota.

**Next steps**: none for this feature. Optional: one test asserting `POST /api/machines` ignores `setor` (`spec.md:53`).
