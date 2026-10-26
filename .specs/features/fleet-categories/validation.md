# Categorias da Frota e status da máquina Validation

## Validation: fleet-categories - PASS ✅

**Date**: 2026-10-15
**Spec**: `.specs/features/fleet-categories/spec.md`
**Diff range**: `f23648b..HEAD` (HEAD `f80a536`, 28 task commits: backend T1–T15, frontend T16–T28)
**Verifier**: independent sub-agent (author ≠ verifier)

Paths: `B/` = `Backend/tests/unit/`, `F/` = `Frontend/src/test/`.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1–T15 (Backend) | ✅ Done | all Done-when checked in tasks.md |
| T16–T28 (Frontend) | ✅ Done | all Done-when checked in tasks.md |

---

## Spec-Anchored Acceptance Criteria

### P1: Status gravado e trocado à mão

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| STS-01 | machine has `status` (5 codes), `categoriaId` text/null, `categoriaTravada` bool | `B/machineService.test.ts:201` - `expect(item!.status).toBe(status)` (each code); `:224` - `toBe(categoria.toHexString())`, `:225` `categoriaTravada toBe(true)` | ✅ |
| STS-02 | null → `'disponivel'` | `B/machineService.test.ts:208` - `expect(item!.status).toBe('disponivel')` | ✅ |
| STS-03 | `alertaEm` = most recent pending `dataIncidente` ISO, else null | `B/machineService.test.ts:228` - `expect(item!.alertaEm).toBe('2026-10-14T10:00:00.000Z')`, `semIncidente.alertaEm toBeNull()` | ✅ |
| STS-04 | writes status + statusAlteradoEm, 200 with Machine | `B/statusService.test.ts:56` - `toEqual({ $set: { status: 'manutencao', statusAlteradoEm: AGORA } })`; `B/machineController.test.ts:104-105` - `status 200`, `json(MAQUINA)` | ✅ |
| STS-05 | invalid status → 400, no write | `B/machineController.test.ts:113-114` - `toHaveBeenCalledWith(400)`, `aplicarStatus not called` | ✅ |
| STS-06 | out of scope → 404 | `B/machineController.test.ts:138-140` - `404`, `aplicarStatus not called` | ✅ |
| STS-07 | leaving `alerta` resolves pending incidents | `B/statusService.test.ts:82` - `Incident.updateMany` called with `{empilhadeiraId, status:'pendente'}`/`resolvido`; `:91` entering alerta does not | ✅ |
| STS-08 | same status: no statusAlteradoEm/categoriaId change | `B/statusService.test.ts:42-43` - `Forklift.updateOne not called` | ✅ |
| STS-09 | 5 protected fields → 400 no write | `B/forkliftController.test.ts` (each of 5) - `mockStatus 400`, `servicoForklift.atualizar not called` | ✅ |
| STS-10 | front calls route and shows new badge | `F/pages/VisaoGeralPage.test.tsx:612-613` - `alterarStatus(base.id,'disponivel')`, badge `Offline`; `F/pages/FrotaPage.test.tsx:736` (`alterarStatus` called, select value) | ✅ |

### P1: Leitura de impacto vira alerta

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| IMP-01 | accepts optional numeric `forcaImpacto` | `B/telemetryController.test.ts:172` - `obterDados() toMatchObject({ forcaImpacto: 5 })`; `B/schemas.test.ts:151` | ✅ |
| IMP-02 | pending incident with forklift, operator, branch, force, `dataIncidente=dataDados` | `B/statusService.test.ts:141` - `Incident.create toHaveBeenCalledWith({...status:'pendente'})` exact | ✅ |
| IMP-03 | → `alerta` from any status | `B/statusService.test.ts:151` (each disponivel/manutencao/offline/em_uso) - `$set.status toBe('alerta')` | ✅ |
| IMP-04 | absent / below limit: saves, no status change | `B/telemetryController.test.ts:177,183` - `criar calledTimes(1)`, `registrarImpacto not called` | ✅ |
| IMP-05 | non-finite / negative → 400, no write | `B/telemetryController.test.ts:188` (-1,'7',NaN,Infinity,null) - `400`, `criar not called` | ✅ |
| IMP-06 | no forklift: no incident, no status | `B/statusService.test.ts:165-166` - `Incident.create`/`updateOne not called` | ✅ |
| IMP-07 | default 5 | `B/statusService.test.ts:120` - `expect(limiteImpacto()).toBe(5)`; `:114` env `8.5` | ✅ |

### P1: Categorias da empresa ligadas a status

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| CAT-01 | 200 `[{_id,nome,cor,chave,statusVinculados}]`, company only, creation order | `B/categoryService.test.ts:34-36` - `find(DA_EMPRESA)`, `sort({_id:1})`, exact shape | ✅ |
| CAT-02 | 201, `statusVinculados` default `[]` | `B/categoryService.test.ts:55`; `B/categoryController.test.ts:61` - `status 201` | ✅ |
| CAT-03 | 200; renaming sets `chave: null` | `B/categoryService.test.ts:91` - `toEqual({ $set: { nome: 'Pátio', chave: null } })`; `B/categoryController.test.ts:89` | ✅ |
| CAT-04 | machines → `categoriaId:null, categoriaTravada:false`, delete, `{_id,message}` | `B/categoryService.test.ts:134-137` - exact updateMany, order `['maquinas','categoria']`; `B/categoryController.test.ts:122-123` | ✅ |
| CAT-05 | escopo filiais → 403 no write | `B/categoryController.test.ts:51-54` - `403`, services not called | ✅ |
| CAT-06 | blank / >40 → 400 | `B/categoryController.test.ts:76` (blank, spaces, 41 chars); `:82` 40 passes; `B/schemas.test.ts:107` | ✅ |
| CAT-07 | color regex → 400 | `B/categoryController.test.ts:76` (`#12345`, `000000`), `:97` (`azul`); `B/schemas.test.ts` `#GGGGGG` | ✅ |
| CAT-08 | invalid/repeated codes → 400 | `B/categoryService.test.ts:72` - `rejects.toMatchObject({ status: 400 })` | ✅ |
| CAT-09 | status linked elsewhere → 409 | `B/categoryService.test.ts:62,109` - `status: 409`, no write | ✅ |
| CAT-10 | case-insensitive dup name → 409 | `B/categoryService.test.ts:78,120` (11000 → 409); `B/schemas.test.ts:117` collation strength 2 | ✅ |
| CAT-11 | other company → 404 on PUT/DELETE | `B/categoryService.test.ts:115,142` - `status: 404` | ✅ |
| CAT-12 | `$` key → 400 | `B/categoryController.test.ts:72-77` - `$where` → `400` | ✅ (POST only; PUT shares `lerDados`) |
| CAT-13 | link change moves no machine | `B/categoryService.test.ts:104` - `Forklift.updateMany not called` | ✅ |

### P1: Status move a máquina, trava segura

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| AUT-01 | unlocked + linked → `categoriaId` of that category | `B/statusService.test.ts:62-63` - `findOne({empresaId, statusVinculados:'alerta'})`, `categoriaId toBe(CATEGORIA_ALERTA)` | ✅ |
| AUT-02 | no link → keep | `B/statusService.test.ts:69` - `not.toHaveProperty('categoriaId')` | ✅ |
| AUT-03 | locked → keep | `B/statusService.test.ts:75-76` | ✅ |
| AUT-04 | route writes, 200 Machine | `B/machineController.test.ts:161-163`; `B/machineService.test.ts` definirTrava - `updateOne({_id},{ $set:{categoriaTravada} })` | ✅ |
| AUT-05 | non-boolean → 400 | `B/machineController.test.ts:169-170` (`'true'`,1,undefined) | ✅ |
| AUT-06 | unlocking keeps categoriaId | `B/machineService.test.ts` definirTrava each(false) - `$set` only `{ categoriaTravada }` | ✅ |
| AUT-07 | front calls route, padlock while locked | `F/components/fleet/FleetCard.test.tsx:198-207`; `F/pages/FrotaPage.test.tsx:716,728`; `F/components/machines/MachineDetailModal.test.tsx:277,284` | ✅ |

### P1: Mover máquinas à mão

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| MOV-01 | writes categoriaId on all, 200 list | `B/machineService.test.ts:301` - `updateMany({_id:{$in:ids}},{ $set:{categoriaId}})`; `B/machineController.test.ts:202-204` | ✅ |
| MOV-02 | null removes | `B/machineService.test.ts:312` - `$set: { categoriaId: null }` | ✅ |
| MOV-03 | any id out of scope → 404, none written | `B/machineService.test.ts:327` - `404`, `updateMany not called` | ✅ |
| MOV-04 | foreign category → 404, none written | `B/machineService.test.ts:333` | ✅ |
| MOV-05 | bad `machineIds` → 400 | `B/machineController.test.ts:214-225` - `400`, service not called | ✅ |
| MOV-06 | keeps status and lock | `B/machineService.test.ts:324` - `$set` keys `toEqual(['categoriaId'])` | ✅ |
| MOV-07 | optimistic + `PUT /machines/categoria` | `F/pages/FrotaPage.test.tsx:663,679` - immediate move, `mover` ids; `F/services/machineService.test.ts:61` | ✅ |
| MOV-08 | rollback + error toast | `F/pages/FrotaPage.test.tsx:696,706,716,759`; `F/pages/VisaoGeralPage.test.tsx:620-621` | ✅ |

### P1: Frota lendo a API

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| FRT-01 | fetch both with active branch, skeleton until both | `F/pages/FrotaPage.test.tsx:412,426` | ✅ |
| FRT-02 | refetch on branch change, discard old | `F/pages/FrotaPage.test.tsx:434` | ✅ |
| FRT-03 | error + "Tentar novamente" | `F/pages/FrotaPage.test.tsx:449` (each request) | ✅ |
| FRT-04 | rows from categories, machines by `categoriaId` | `F/data/fleet.test.ts:44,55` | ✅ |
| FRT-05 | `chave` → translated, else `nome` | `F/pages/FrotaPage.test.tsx:464` - labels `['Ativas','Pátio']` | ✅ |
| FRT-06 | empresa sees create/edit/delete | `F/pages/FrotaPage.test.tsx:553,571,593`; `F/components/fleet/FleetRow.test.tsx:138` | ✅ |
| FRT-07 | filiais hides them, keeps add/drag/move/lock/status | `F/pages/FrotaPage.test.tsx:619-631` | ✅ |
| FRT-08 | badge `machines.status.<status>` in any category | `F/components/fleet/FleetCard.test.tsx:163-172`; `F/components/machines/StatusBadge.test.tsx:18` | ✅ |
| FRT-09 | header tone from status | `F/components/fleet/FleetCard.test.tsx:172` - `header().className toContain(tone)` per status | ✅ |
| FRT-10 | highlight per status | `F/components/fleet/FleetCard.test.tsx:51-52,68,73-74,79,90` | ✅ |
| FRT-11 | 5 codes in 7 locales | `F/config/i18n.test.ts:405,413` (non-empty + differs from pt-BR); `F/components/machines/StatusBadge.test.tsx:34` en-US | ✅ |
| FRT-12 | Visão Geral filter lists 5 codes | `F/pages/VisaoGeralPage.test.tsx:83` - `toEqual(['Todos','disponivel','em_uso','manutencao','alerta','offline'])` | ✅ |

### P2: Quadro inicial e dados antigos

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| MIG-01 | 4 legacy texts → codes, only `status: null` | `B/migrateStatus.test.ts:32,48` - `find({status:null})`, exact pairs | ⚠️ Spec-precision gap: spec does not define unknown legacy text; impl maps `'online'` → `disponivel` (`:49`) |
| MIG-02 | no device → `offline` | `B/migrateStatus.test.ts:48` - `['e','offline']` | ✅ |
| MIG-03 | company without categories → 4 initial | `B/categoryService.test.ts:155` exact insertMany; `B/migrateStatus.test.ts:61-65` | ✅ |
| MIG-04 | place uncategorised by linked status, unlinked stay null | `B/categoryService.test.ts:180`; `B/migrateStatus.test.ts:64` | ✅ |
| MIG-05 | rerun changes nothing | `B/migrateStatus.test.ts:85-86` - no writes | ✅ |
| MIG-06 | seed writes status, initial board, positions | `B/seedData.test.ts:206,221` | ✅ |
| MIG-07 | only EMP-081/085/089 alerta + 1 pending | `B/seedData.test.ts:214` - pendentes `toEqual([081,085,089])`; `B/seedDataset.test.ts:94,141` | ✅ |

**Status**: 63/64 ✅, 1 ⚠️ spec-precision gap (MIG-01 unknown legacy value; implementation choice is reasonable, not a defect).

### Edge cases

- [x] No categories: `F/pages/FrotaPage.test.tsx:634,642`
- [x] Counter counts visible machines only: `F/data/fleet.test.ts:66`
- [x] Filtered category deleted → "Todas": `F/pages/FrotaPage.test.tsx:277`
- [x] Drop on own row → no API call: `F/pages/FrotaPage.test.tsx:672`
- [x] Dangling `categoriaId` → unassigned: `F/pages/FrotaPage.test.tsx:473`, `F/data/fleet.test.ts:59`
- [x] Two impacts → two incidents, stays alerta: `B/statusService.test.ts:169`

---

## Discrimination Sensor

Scratch: temporary `git worktree` at HEAD (node_modules symlinked), removed afterwards; real-tree `git status --porcelain` identical to baseline.

| # | File | Mutation | Tests run | Killed? |
| - | ---- | -------- | --------- | ------- |
| 1 | `Backend/src/feature/machine/statusService.ts:32` | lock ignored (`if (!categoriaTravada)` → `if (true)`) | statusService | ✅ (1 failed) |
| 2 | `statusService.ts:40` | leaving alerta does not resolve incidents | statusService | ✅ (1) |
| 3 | `Backend/src/feature/telemetry/telemetryController.ts:102` | threshold `>=` → `>` | telemetryController | ✅ (1) |
| 4 | `Backend/src/feature/category/categoryService.ts` | delete clears categoriaId but not `categoriaTravada` | categoryService | ✅ (1) |
| 5 | `Backend/src/feature/category/categoryController.ts:9` | `exigirEmpresa` no-op | categoryController | ✅ (3) |
| 6 | `Frontend/src/components/fleet/FleetCard.tsx:113` | header tone constant, not from status | FleetCard | ✅ (4) |
| 7 | `Frontend/src/pages/FrotaPage.tsx:129-130` | rollback removed | FrotaPage | ✅ (4) |
| 8 | `statusService.ts:29` | same-status no-op removed | statusService | ✅ (3) |
| 9 | `Backend/src/feature/machine/machineService.ts:79` | scope count check disabled | machineService | ✅ (4) |
| 10 | `Backend/src/feature/forklift/forkliftController.ts:106` | `sessaoIniciadaEm` dropped from protected list | forkliftController | ✅ (1) |

**Sensor depth**: expanded (10 mutations; data-integrity/auth paths)
**Result**: 10/10 killed - PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical / no scope creep | ✅ |
| Matches patterns (branch feature molde, VisaoGeral fetch effect) | ✅ |
| Spec-anchored outcome check | ✅ (1 precision gap flagged) |
| Per-layer coverage (domain 1:1; routes happy + 400/403/404/409) | ✅ |
| Tests map to ACs / edge cases / Done-when | ✅ |
| Guidelines: none documented - strong defaults applied | ✅ |

---

## Gate Check

- **Backend**: `npx tsc --noEmit && npx vitest run tests/unit` → 534 passed, 0 failed (baseline 372, +162)
- **Frontend**: `npx tsc -b && npx eslint . && npx vitest run` → 1200 passed, 0 failed (baseline 1133, +67)
- **Skipped**: none. No `tests/integration`, no database, no `.env` read.

---

## Fix Plans

None required. Optional: pin the unknown-legacy-status mapping in spec (MIG-01) so `'online'`/other → `disponivel` is a decided outcome, not an implementation choice.

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 63/64 matched; 1 spec-precision gap (MIG-01)
**Sensor**: 10/10 killed
**Gate**: Backend 534 / Frontend 1200 passed
