# Visão Geral lendo a API e seeds Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Regra do banco (global do dono):** nenhuma tarefa, teste, gate ou Verifier acessa o banco. Os scripts de seed são escritos e testados com mocks, e só o dono os executa. Os gates do Backend rodam `tests/unit/<arquivo>` explícito, nunca `yarn test` (que inclui `tests/integration`, que conecta ao Mongo).

---

**Spec**: `.specs/features/machines-api/spec.md` (sem `design.md`: a abordagem está nas Assumptions do spec)
**Status**: Approved (dono pediu a implementação)

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none (`docs/arquitetura.md` descreve a arquitetura, sem regras de teste) - strong defaults applied; `Backend/tests/unit/*` and `Frontend/src/test/**` sampled as the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema (`src/schemas`) | none | - (build gate only) | - | `cd Backend && npx tsc --noEmit` |
| Backend service (`feature/*/…Service.ts`) | unit | All branches; 1:1 to spec ACs; every listed edge case | `Backend/tests/unit/<nome>.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend controller / route | unit | Happy path + each error path, with the service mocked | `Backend/tests/unit/<nome>Controller.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Controller.test.ts` |
| Backend script (`src/scripts`) | unit | All branches; models mocked; no DB access | `Backend/tests/unit/seed*.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Frontend service | unit | Request path and payload, error propagates | `Frontend/src/test/services/*.test.ts` | `cd Frontend && npx vitest run <arquivo>` |
| Frontend page | unit | Every spec AC and edge case for the page; service mocked | `Frontend/src/test/pages/*.test.tsx` | `cd Frontend && npx vitest run <arquivo>` |
| Frontend locales | unit | Keys present in all 7 languages (existing parity test) | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && npx vitest run src/test/config/i18n.test.ts` |

Frontend commands need Node 22: prefix with `PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH` (the default `node` is 20 and fails with `ERR_REQUIRE_ESM`).

## Gate Check Commands

> Generated from codebase - confirm before Execute. Baseline before this feature: Backend `tests/unit` = 38 passed, 2 files fail (`jsonwebtoken` and `@types/cors` not installed here, pre-existing); `tsc --noEmit` = 2 pre-existing errors (`authService.ts`, `server.ts`). Frontend = 908 passed, 3 failed (the old `34 min` ones), `tsc -b` and `eslint` clean.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | The row's Run Command above for the task's test file |
| Full | After tasks with e2e/integration tests | Not used: this feature has no integration tests (the ones in `Backend/tests/integration` touch the database) |
| Build | After phase completion or config/schema-only tasks | Backend: `cd Backend && npx tsc --noEmit` (only the 2 pre-existing errors) and `npx vitest run tests/unit` (the 2 pre-existing failing files). Frontend: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH sh -c 'npx tsc -b && npx eslint . && npx vitest run'` (only the 3 old failures) |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Rota de máquinas (Backend)

```
T1 → T2 → T3
```

### Phase 2: Seeds (Backend)

```
T4 → T5
T1 → T5
```

### Phase 3: Visão Geral (Frontend)

```
T3 → T6 → T8
T7 → T8
```

---

## Task Breakdown

### T1: Add machine fields to the forklift schema

**What**: `nome`, `setor` (texto) and `sessaoIniciadaEm` (data), opcionais, no schema `forklift`.
**Where**: `Backend/src/schemas/forklift.ts`
**Depends on**: None
**Reuses**: Existing field style in the same schema
**Requirement**: MCH-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Os três campos existem, opcionais, com os tipos acima
- [x] `npx tsc --noEmit` não ganha erros além dos 2 antigos

**Tests**: none
**Gate**: build

**Commit**: `feat(machines): add nome, setor and sessaoIniciadaEm to forklift schema`

---

### T2: List machines service

**What**: `listarMaquinas()` junta forklift, device e operator e devolve o formato `Machine`.
**Where**: `Backend/src/feature/machine/machineService.ts`
**Depends on**: T1
**Reuses**: `Backend/src/feature/auth/authService.ts` (service que usa o schema direto)
**Requirement**: MCH-02, MCH-03, MCH-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Item com `{ id, identificacao, nome, setor, dispositivoConectado, operadorConectado?, tempoSessaoMinutos }` (AC2)
- [x] `operadorConectado` presente só com operador existente (AC3, AC4, edge operador apagado)
- [x] `tempoSessaoMinutos` em minutos inteiros, 0 sem data ou com data futura (AC5, AC6, edge)
- [x] Sem dispositivo, `{ enderecoMac: '', status: 'Offline' }` (AC7)
- [x] Ordenado por `identificacao` crescente (AC8)
- [x] Gate: `cd Backend && npx vitest run tests/unit/machineService.test.ts`
- [x] Test count: ao menos 8 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(machines): add machine list service`

---

### T3: GET /api/machines endpoint

**What**: Controller `listar`, rota `GET /` do `machineRouter` e montagem em `/api/machines` no `server.ts`.
**Where**: `Backend/src/feature/machine/machineController.ts`
**Depends on**: T2
**Reuses**: `Backend/src/feature/accessRequest/accessRequestController.ts` and `accessRequestRouter.ts` patterns; `respostaSucesso`/`respostaErro`
**Requirement**: MCH-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 200 com o array do service (AC2)
- [x] 500 com `{ error: <mensagem> }` quando o service lança (AC9)
- [x] `machineRouter.ts` expõe `GET /` e `server.ts` monta `/api/machines`
- [x] Gate: `cd Backend && npx vitest run tests/unit/machineController.test.ts`
- [x] Test count: 2 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(machines): add GET /api/machines endpoint`

---

### T4: Seed dataset

**What**: Dados puros do seed: operadores, dispositivos, empilhadeiras, colaboradores, solicitações, e geradores de telemetria e incidentes.
**Where**: `Backend/src/scripts/seedDataset.ts`
**Depends on**: None
**Reuses**: Valores de `Frontend/src/data/machines.ts` (`BASE_MACHINES`) e `Frontend/src/data/team.ts` (`EMPLOYEES`)
**Requirement**: SED-01, SED-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 8 operadores com nomes únicos, 16 dispositivos com MAC único, 16 empilhadeiras EMP-081 a EMP-096 (AC1)
- [x] Todo MAC e todo operador citado por uma empilhadeira existe nas listas (AC2)
- [x] 11 colaboradores com `usuario` único e 2 solicitações de acesso (AC1, AC5)
- [x] Telemetria: 5 leituras por dispositivo, horárias a partir de `2026-09-01T08:00:00Z`, as mesmas a cada chamada (AC1, AC4)
- [x] Incidentes: 2 por empilhadeira, datas fixas, `forcaImpacto` de 3 a 9, `status` `pendente` ou `resolvido` (AC1, AC4)
- [x] Nenhuma senha literal no arquivo (AC9)
- [x] Gate: `cd Backend && npx vitest run tests/unit/seedDataset.test.ts`
- [x] Test count: ao menos 8 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(seed): add seed dataset for all collections`

---

### T5: Seed runner and script

**What**: `seedData()` que faz upsert de cada collection pela chave natural, liga os ids, chama `seedAdmin`, e o script `seed:data` no `package.json` com `SEED_COLABORADOR_SENHA` em `.env.example`.
**Where**: `Backend/src/scripts/seedData.ts`
**Depends on**: T1, T4
**Reuses**: `Backend/src/scripts/seedAdmin.ts` (entry guard, `logger`, `gerarHashSenha`)
**Requirement**: SED-01, SED-02, SED-03, SED-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Cada collection usa `findOneAndUpdate(chave, dados, { upsert: true })` com a chave do spec (AC4)
- [x] A empilhadeira recebe `dispositivoConectadoId`, `operadorConectadoId` e `sessaoIniciadaEm = agora − minutos` quando o mock tem mais de 0 (AC2, AC3)
- [x] Com `SEED_COLABORADOR_SENHA`, cria os 11 colaboradores com `senhaHash` que valida a senha; sem ela, pula e avisa (AC5, AC6)
- [x] Chama `seedAdmin` (AC7)
- [x] Registra a contagem por collection e fecha a conexão no modo script (AC8)
- [x] `package.json` tem `"seed:data": "tsx src/scripts/seedData.ts"` e `.env.example` tem `SEED_COLABORADOR_SENHA`
- [x] Gate: `cd Backend && npx vitest run tests/unit/seedData.test.ts`
- [x] Test count: ao menos 7 testes passam, todos com os models mockados

**Tests**: unit
**Gate**: quick

**Commit**: `feat(seed): add seed:data script for all collections`

---

### T6: Frontend machine service

**What**: `machineService.listar()` que chama `GET /machines` e devolve `Machine[]`.
**Where**: `Frontend/src/services/machineService.ts`
**Depends on**: T3
**Reuses**: `Frontend/src/services/authService.ts` and `Frontend/src/test/services/authService.test.ts`
**Requirement**: VGR-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Chama `api.get('/machines')` e devolve `data`
- [x] A rejeição da API se propaga
- [x] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/services/machineService.test.ts`
- [x] Test count: 2 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(machines): add frontend machine service`

---

### T7: Load-error texts in 7 languages

**What**: Chaves `machines.loadError` e `common.retry` nos 7 idiomas.
**Where**: `Frontend/src/locales/pt-BR/translation.json`
**Depends on**: None
**Reuses**: Existing keys and `Frontend/src/test/config/i18n.test.ts`
**Requirement**: VGR-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] pt-BR: "Não foi possível carregar as máquinas." e "Tentar novamente"
- [ ] As duas chaves existem nos outros 6 idiomas (`en-US`, `es`, `fr`, `ja`, `de`, `ru`), com texto traduzido
- [ ] Teste de paridade cobre as duas chaves nos 7 idiomas
- [ ] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/config/i18n.test.ts`
- [ ] Test count: os testes existentes mais ao menos 1 novo passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(i18n): add machines load error texts`

---

### T8: Visão Geral reads the API

**What**: A página busca as máquinas, mostra skeleton, erro com nova tentativa e lista vazia; busca, filtro e mutações locais seguem iguais.
**Where**: `Frontend/src/pages/VisaoGeralPage.tsx`
**Depends on**: T6, T7
**Reuses**: `Frontend/src/components/common/PageSkeleton.tsx`, `eventsForMachine` and `MACHINES` (só para o histórico), existing `VisaoGeralPage.test.tsx`
**Requirement**: VGR-01, VGR-02, VGR-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Um card por máquina devolvida pelo `machineService` (AC1); lista vazia mostra "Nenhuma máquina encontrada" (AC5)
- [ ] Skeleton com `aria-busy="true"` enquanto a requisição está pendente (AC2)
- [ ] Falha mostra a mensagem e o botão; clicar chama o service de novo e volta ao skeleton (AC3, AC4, AC9)
- [ ] Busca e filtro de status filtram a lista carregada (AC6)
- [ ] Cadastrar, editar e excluir não chamam o service de novo (AC7)
- [ ] Detalhe mostra os eventos do mock da máquina com a mesma `identificacao`, ou lista vazia (AC8); status desconhecido aparece sob "Todos" (edge)
- [ ] `useFirstVisitLoading('visao-geral')` removido da página; os testes existentes continuam com as mesmas asserções, agora aguardando a carga
- [ ] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/pages/VisaoGeralPage.test.tsx`; depois o Build gate completo do Frontend (última tarefa)
- [ ] Test count: os testes existentes da página mais os novos passam, sem remover nenhum

**Tests**: unit
**Gate**: build

**Commit**: `feat(machines): load Visão Geral from the API`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2 ------→ T3
Phase 2:  T4 ------→ T5
Phase 3:  T6 ------→ T8
Phase 3:  T7 ------→ T8
```

Cross-phase dependencies (T1 → T5, T3 → T6) are listed in each task's `Depends on`. Execution is strictly sequential. 8 tasks fit one batch, so execution is inline with no sub-agents; the Verifier runs after T8.

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | None | none | ✅ Match |
| T5 | T1 (earlier phase), T4 | T4 → T5, T1 → T5 | ✅ Match |
| T6 | T3 (earlier phase) | T3 → T6 | ✅ Match |
| T7 | None | none | ✅ Match |
| T8 | T6, T7 | T6 → T8, T7 → T8 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: schema | Backend schema | none | none | ✅ OK |
| T2: service | Backend service | unit | unit | ✅ OK |
| T3: endpoint | Backend controller / route | unit | unit | ✅ OK |
| T4: dataset | Backend script | unit | unit | ✅ OK |
| T5: runner | Backend script | unit | unit | ✅ OK |
| T6: front service | Frontend service | unit | unit | ✅ OK |
| T7: locales | Frontend locales | unit | unit | ✅ OK |
| T8: page | Frontend page | unit | unit | ✅ OK |
