# sectors Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/sectors/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `Backend/package.json` (`test` = só `tests/unit`), `.specs/STATE.md` (AD-010: testes com models mockados; Node 24+ no Frontend). Nenhum teste toca o banco.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema | unit | `validateSync()` e `schema.indexes()`/paths | `Backend/tests/unit/schemas.test.ts` | `cd Backend && npx vitest run tests/unit/schemas.test.ts` |
| Backend service | unit | 1:1 aos ACs e edge cases, models mockados | `Backend/tests/unit/<nome>Service.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend controller / route | unit | happy path + cada erro (400/403/404/409), service mockado | `Backend/tests/unit/<nome>Controller.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Controller.test.ts` |
| Backend scripts | unit | idempotência e contagem, models mockados | `Backend/tests/unit/<script>.test.ts` | `cd Backend && npx vitest run tests/unit/<script>.test.ts` |
| Frontend service | unit | URL, método, corpo; `api` mockado | `Frontend/src/test/services/*.test.ts` | `cd Frontend && npx vitest run src/test/services` |
| Frontend page / component | unit (Testing Library) | cada AC visível + erro/rollback; serviços mockados | `Frontend/src/test/{pages,components}/**` | `cd Frontend && npx vitest run src/test/<caminho>` |
| Frontend data | unit | funções puras | `Frontend/src/test/data/*.test.ts` | `cd Frontend && npx vitest run src/test/data` |
| Frontend i18n | unit | paridade nos 7 idiomas | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && npx vitest run src/test/config/i18n.test.ts` |
| Docs | none | - | `docs/*.md` | build gate only |

## Gate Check Commands

> Frontend com `export PATH=/home/romulo/.nvm/versions/node/v25.9.0/bin:$PATH`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Depois de cada task | Run Command da task + `cd Backend && npx tsc --noEmit` ou `cd Frontend && npx tsc -b` |
| Build | Fim de cada fase | Backend: `npx tsc --noEmit && yarn test`; Frontend: `npx tsc -b && npx eslint . && npx vitest run` |

---

## Execution Plan

### Phase 1: Backend

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Scripts

```
T7 → T8
```

### Phase 3: Frontend

```
T9 → T10 → T11 → T12 → T13 → T14
```

### Phase 4: Docs

```
T15
```

---

## Task Breakdown

### T1: Schema `sector` e `forklift.setorId`

**What**: Criar o model `sector` (nome trim/obrigatório/≤60, `filialId` obrigatório com índice, índice único `{ filialId, nome }` com collation pt/2) e `setorId` no `forklift`.
**Where**: `Backend/src/schemas/sector.ts`
**Depends on**: None
**Reuses**: `Backend/src/schemas/category.ts`
**Requirement**: SECT-02

**Done when**:
- [x] `schemas.test.ts` cobre obrigatórios, limite de 60, trim, índice único com collation e `forklift.setorId` padrão `null`
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(sector): add sector schema and forklift setorId`

---

### T2: `sectorService`

**What**: `listar`, `criar`, `atualizar` (nome e mover filial com 409 por máquinas), `excluir` (409 com contagem), `exigirSetorDaFilial`.
**Where**: `Backend/src/feature/sector/sectorService.ts`
**Depends on**: T1
**Reuses**: `feature/category/categoryService.ts`, `core/escopo.ts`
**Requirement**: SECT-01, SECT-02, SECT-03, SECT-04

**Done when**:
- [x] Testes 1:1 com os critérios 1, 2, 4, 6, 7, 9, 10, 11, 12, 13 e 14 da story CRUD
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(sector): add sector service`

---

### T3: `sectorController`, router e rota `/api/sectors`

**What**: Controller com validação, admin guard nas escritas, router e montagem em `app.ts`.
**Where**: `Backend/src/feature/sector/sectorController.ts`
**Depends on**: T2
**Reuses**: `feature/category/categoryController.ts`, `feature/operator/operatorController.ts`
**Requirement**: SECT-01, SECT-02, SECT-03, SECT-05

**Done when**:
- [x] Testes: 400 de nome, `filialId` inválido, campo extra e `$`; 403 de colaborador; listar aberto a colaborador; rota montada no `app.test.ts`
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(sector): add /api/sectors routes`

---

### T4: Máquina com `setorId`

**What**: `machineController`/`machineService` aceitam `setorId` (mesma filial), recusam `setor` e devolvem `setor` (nome) e `setorId`.
**Where**: `Backend/src/feature/machine/machineService.ts`
**Depends on**: T3
**Reuses**: `exigirSetorDaFilial`
**Requirement**: SECT-06, SECT-07

**Done when**:
- [x] Testes dos critérios 1-6 e 12 da story Máquina ligada, e do setor apagado (`setor: ''`)
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machine): link machines to sectors`

---

### T5: `/api/forklifts` protege `setorId`

**What**: `setorId` em `CAMPOS_PROTEGIDOS`; mover de filial grava `setorId: null`.
**Where**: `Backend/src/feature/forklift/forkliftController.ts`
**Depends on**: T4
**Reuses**: `CAMPOS_PROTEGIDOS`
**Requirement**: SECT-08

**Done when**:
- [x] Testes dos critérios 8 e 9 da story Máquina ligada
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(forklift): protect setorId and clear it on branch move`

---

### T6: Sessão e ocorrência com o nome do setor

**What**: `sessionService` e `incidentService` devolvem `maquina.setor` com o nome do setor ligado.
**Where**: `Backend/src/feature/session/sessionService.ts`
**Depends on**: T5
**Reuses**: `populate('setorId', 'nome')`
**Requirement**: SECT-07

**Done when**:
- [ ] Testes do critério 7 da story Máquina ligada nos dois serviços
- [ ] Build gate do Backend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(session): show the linked sector name in sessions and incidents`

---

### T7: Script `migrate:sectors`

**What**: `migrarSetores()` idempotente, contagem no log, desconecta mesmo com falha; script no `package.json`.
**Where**: `Backend/src/scripts/migrateSectors.ts`
**Depends on**: None (Phase 1 concluída)
**Reuses**: `scripts/migrateStatus.ts`
**Requirement**: SECT-15

**Done when**:
- [ ] Testes dos critérios 1-4 da story Migração, incluindo a segunda execução sem `create`/`updateOne`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(scripts): add migrate:sectors`

---

### T8: Seed e reset com setores

**What**: `seedData` cria os setores e liga `setorId`; `Sector` em `COLECOES`.
**Where**: `Backend/src/scripts/seedData.ts`
**Depends on**: T7
**Reuses**: upsert por chave natural do seed
**Requirement**: SECT-16

**Done when**:
- [ ] Testes dos critérios 5-6 da story Migração em `seedData.test.ts` e `resetData.test.ts`
- [ ] Build gate do Backend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(seed): seed sectors and reset the sector collection`

---

### T9: `sectorService` do front e chaves de i18n

**What**: Serviço com listar/criar/atualizar/remover e todas as chaves novas nos 7 idiomas.
**Where**: `Frontend/src/services/sectorService.ts`
**Depends on**: None (Phase 2 concluída)
**Reuses**: `services/operatorService.ts`
**Requirement**: SECT-13

**Done when**:
- [ ] Teste de URL, método e corpo; i18n com paridade
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): add sector service and sector i18n keys`

---

### T10: Componentes de setor com filial

**What**: `SectorCard`, `SectorInfoModal` e `SectorFormModal` usam `filial`; o formulário tem o seletor de filial conforme o escopo.
**Where**: `Frontend/src/components/team/SectorFormModal.tsx`
**Depends on**: T9
**Reuses**: `TeamForm.module.css`
**Requirement**: SECT-10, SECT-11

**Done when**:
- [ ] Testes dos critérios 3, 4 e 5 da story Setores na Equipe
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): show the sector branch and pick it in the sector form`

---

### T11: Aba Setores pela API

**What**: `EquipePage` carrega, cria, edita e exclui setores pela API com otimista e rollback; `SECTORS` e `unidade` saem.
**Where**: `Frontend/src/pages/EquipePage.tsx`
**Depends on**: T10
**Reuses**: `saveOptimistic` da Equipe
**Requirement**: SECT-10, SECT-12

**Done when**:
- [ ] Testes dos critérios 1, 2, 6, 7 e 8 da story Setores na Equipe
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): read and write sectors through the API`

---

### T12: Select de setor no cadastro de máquina

**What**: `NewMachinePanel` troca o texto por select de setores da filial do formulário; `machineService` manda `setorId`; `Machine` ganha `setorId` e `filialId`.
**Where**: `Frontend/src/components/machines/NewMachinePanel.tsx`
**Depends on**: T11
**Reuses**: select de filial do próprio painel
**Requirement**: SECT-09

**Done when**:
- [ ] Testes dos critérios 10 e 11 da story Máquina ligada e do corpo do `machineService`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): pick the machine sector from a select`

---

### T13: Visão Geral com setores e filtro

**What**: A Visão Geral busca os setores, passa ao painel e filtra por `setorId`.
**Where**: `Frontend/src/pages/VisaoGeralPage.tsx`
**Depends on**: T12
**Reuses**: `filterMachines`
**Requirement**: SECT-09, SECT-14

**Done when**:
- [ ] Testes dos critérios 1-4 da story Filtro na Visão Geral e de `filterMachines`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): filter the overview by sector`

---

### T14: Filtro por setor na Frota

**What**: A Frota busca os setores e filtra os cards por `setorId`.
**Where**: `Frontend/src/pages/FrotaPage.tsx`
**Depends on**: T13
**Reuses**: select de categoria da Frota
**Requirement**: SECT-14

**Done when**:
- [ ] Testes dos critérios 1-4 da story Filtro na Frota
- [ ] Build gate do Frontend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(fleet): filter the fleet by sector`

---

### T15: Docs

**What**: `docs/api.md` (rotas de setor, `setorId` em máquinas e forklifts) e `docs/modelagem_de_dados.md` (coleção `sector`, `forklift.setorId`).
**Where**: `docs/api.md`
**Depends on**: None
**Reuses**: formato atual dos docs
**Requirement**: SECT-17

**Done when**:
- [ ] Os dois docs descrevem o que foi implementado

**Tests**: none
**Gate**: build
**Commit**: `docs(sector): document sectors API and data model`
