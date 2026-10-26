# Otimização e polimento Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/otimizacao-polimento/design.md`
**Status**: Draft

**Paralelismo (decisão do orquestrador):** as fases Backend e Frontend da mesma onda não compartilham arquivo e podem ir para workers diferentes ao mesmo tempo: Phase 1 ∥ Phase 2 (F1), Phase 3 ∥ Phase 4 (F2). Dentro de cada fase, um worker só, tarefas em ordem (várias tarefas da fase dividem o arquivo de teste). Phase 5 (F3) só começa com a decisão do dono registrada em `.specs/STATE.md`.

**Arquivos por trilha (disjuntos):**
- Backend (Phases 1, 3, parte da 5): `Backend/**` e `.gitignore` da raiz.
- Frontend (Phases 2, 4, T51 da 5): `Frontend/**`.
- Nenhuma tarefa edita `.specs/**` exceto para marcar a própria tarefa como concluída.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `Backend/package.json` (`test` = `vitest run tests/unit`), `Frontend/package.json` (`test`, `lint`, `build`), `.specs/STATE.md` (AD-010: testes com models mockados, nenhum toca o banco; Frontend em Node 25.9 via nvm). Sem `AGENTS.md`/`CONTRIBUTING.md`/limiar de cobertura.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema | unit | `schema.indexes()` contém cada índice da spec com as opções exatas | `Backend/tests/unit/schemas.test.ts` | `cd Backend && npx vitest run tests/unit/schemas.test.ts` |
| Backend service / repository | unit | 1:1 aos ACs; `limit`/`sort`/`select` e nº de chamadas aos models mockados | `Backend/tests/unit/<nome>.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend app / controller / middleware | unit (supertest) | happy path + cada erro (400/404/409/429) e headers | `Backend/tests/unit/{app,<nome>Controller,autenticar}.test.ts` | `cd Backend && npx vitest run tests/unit/<arquivo>` |
| Backend util (senha, logger) | unit | todos os ramos | `Backend/tests/unit/{senha,logger}.test.ts` | `cd Backend && npx vitest run tests/unit/<arquivo>` |
| Frontend route / page / component | unit (Testing Library) | cada AC visível + erro; serviços mockados; `findBy*` para lazy | `Frontend/src/test/{routes,pages,components}/**` | `cd Frontend && npx vitest run src/test/<caminho>` |
| Frontend hook / service / config | unit | ramos, cache/invalidação, abort | `Frontend/src/test/{hooks,services,config}/**` | `cd Frontend && npx vitest run src/test/<caminho>` |
| Manifest / lockfile / assets / CSS | none | build + knip | - | build gate only |
| Owner DB check | none | resultado do dono anexado ao STATE | - | manual |

## Gate Check Commands

> Frontend sempre com `export PATH=/home/romulo/.nvm/versions/node/v25.9.0/bin:$PATH` (Node 20.18 quebra o jsdom 30).

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Depois de cada task | Run Command da task + `cd Backend && npx tsc --noEmit` ou `cd Frontend && npx tsc -b` |
| Full | Tasks que mexem em rota/app ou em várias páginas | Quick + `cd Backend && yarn test` ou `cd Frontend && npx vitest run` |
| Build | Fim de cada fase e tasks de manifest/lockfile | Backend: `npx tsc --noEmit && yarn test && npx knip`; Frontend: `npx tsc -b && npx eslint . && npx vitest run && npx vite build --outDir /tmp/liftech-dist && npx knip` |
| Manual | Tarefa do dono | Saída do mongosh colada no STATE |

**Baseline de testes (2026-10-23):** Backend 932 testes em 48 arquivos; Frontend 1431 (contagem do auditor, reconfirmar no primeiro gate). Nenhuma tarefa pode reduzir a contagem sem apagar código coberto (T11, T19, F3) e dizer quantos saíram.

---

## Execution Plan

### Phase 1: F1 Backend (seguro)

```
T1 -> T2 -> T3 -> T4 -> T5 -> T13
T6 -> T7
T6 -> T8 -> T13
T9
T10
T11
T12
T14
```

### Phase 2: F1 Frontend (seguro)

```
T15 -> T16
T17 -> T19
T18 -> T19
T20
T21
T22
T23
T24
```

### Phase 3: F2 Backend (risco médio)

```
T25 -> T26
T27 -> T28
T29
T30
T31 -> T32
T33 -> T34
T35
```

### Phase 4: F2 Frontend (risco médio)

```
T36 -> T37
T38
T39
T40
T41
T42
T43
T44
T45
```

### Phase 5: F3 (exige decisão do dono)

```
T46
T47 -> T49
T48 -> T49
T50
T51
T52
```

---

## Task Breakdown

### T1: Índices de `incident`

**What**: Trocar o `index: true` de `filialId` pelos compostos `{ filialId: 1, dataIncidente: -1 }` e `{ empilhadeiraId: 1, status: 1 }`.
**Where**: `Backend/src/schemas/incident.ts`
**Depends on**: None
**Reuses**: padrão de `schemas.test.ts:84`
**Requirement**: OPT-07

**Done when**:
- [ ] `Incident.schema.indexes()` contém os 2 compostos e não contém `[{ filialId: 1 }, …]`
- [ ] Teste novo em `Backend/tests/unit/schemas.test.ts`; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): índices compostos de incident`

---

### T2: Índices de `workSession`

**What**: Adicionar `{ operadorId: 1, inicio: -1 }` e `{ empilhadeiraId: 1, inicio: -1 }`, mantendo os dois únicos parciais `fim: null`.
**Where**: `Backend/src/schemas/workSession.ts`
**Depends on**: T1
**Reuses**: `schemas.test.ts`
**Requirement**: OPT-07

**Done when**:
- [ ] `WorkSession.schema.indexes()` contém os 2 novos e os 2 parciais únicos intactos
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): índices de histórico de workSession`

---

### T3: Índice de `user.operadorId`

**What**: `userSchema.index({ operadorId: 1 }, { partialFilterExpression: { operadorId: { $type: 'objectId' } } })`.
**Where**: `Backend/src/schemas/user.ts`
**Depends on**: T2
**Reuses**: `schemas.test.ts`
**Requirement**: OPT-07

**Done when**:
- [ ] Teste asserta índice e `partialFilterExpression` exatos; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): índice parcial de user.operadorId`

---

### T4: Índice de `forklift.dispositivoConectadoId`

**What**: Índice `{ dispositivoConectadoId: 1 }` parcial `$type: 'objectId'`.
**Where**: `Backend/src/schemas/forklift.ts`
**Depends on**: T3
**Reuses**: `schemas.test.ts`
**Requirement**: OPT-07

**Done when**:
- [ ] Teste asserta índice e opção; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): índice de forklift.dispositivoConectadoId`

---

### T5: Índice de `accessRequest` por status

**What**: `accessRequestSchema.index({ status: 1, createdAt: 1 })` (o único parcial fica para T33).
**Where**: `Backend/src/schemas/accessRequest.ts`
**Depends on**: T4
**Reuses**: `schemas.test.ts`
**Requirement**: OPT-07

**Done when**:
- [ ] Teste asserta o índice; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): índice de accessRequest por status`

---

### T6: Limite no histórico de sessões

**What**: Exportar `LIMITE_HISTORICO = 500` ao lado de `lerPeriodo` e aplicar `.limit(LIMITE_HISTORICO)` depois do `sort({ inicio: -1 })` em `listar`.
**Where**: `Backend/src/feature/session/sessionService.ts`
**Depends on**: None
**Reuses**: `lerPeriodo`
**Requirement**: OPT-06

**Done when**:
- [ ] Teste em `sessionService.test.ts` asserta `sort({ inicio: -1 })` e `limit(500)` na chain mockada
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): limita histórico de sessões a 500`

---

### T7: Limite no histórico de ocorrências

**What**: `.limit(LIMITE_HISTORICO)` em `incidentService.listar`, importando a constante de T6.
**Where**: `Backend/src/feature/incident/incidentService.ts`
**Depends on**: T6
**Reuses**: `LIMITE_HISTORICO`
**Requirement**: OPT-06

**Done when**:
- [ ] Teste em `incidentService.test.ts` asserta `sort({ dataIncidente: -1 })` + `limit(500)`; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): limita histórico de ocorrências a 500`

---

### T8: Limite e ordenação na telemetria

**What**: `TelemetryRepository` sobrescreve `obterTodos` com `.sort({ dataDados: -1 }).limit(500)` e soma `.limit(500)` em `obterPorDispositivo`.
**Where**: `Backend/src/feature/telemetry/telemetryRepository.ts`
**Depends on**: T6
**Reuses**: `LIMITE_HISTORICO` de T6
**Requirement**: OPT-06

**Done when**:
- [ ] Teste novo (`tests/unit/telemetryRepository.test.ts`) asserta sort+limit nos dois métodos; `RepositoryBase` intocado
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): limita listagem de telemetria a 500`

---

### T9: compression, helmet e `x-powered-by`

**What**: `yarn add compression helmet` (+ `@types/compression`), `app.disable('x-powered-by')`, `app.use(helmet())`, `app.use(compression())` antes das rotas; remover `"main": "index.js"` do `package.json`.
**Where**: `Backend/src/app.ts`
**Depends on**: None
**Reuses**: `tests/unit/app.test.ts` (supertest)
**Requirement**: OPT-08

**Done when**:
- [ ] Teste: resposta JSON > 1 kB com `Accept-Encoding: gzip` vem com `Content-Encoding: gzip`
- [ ] Teste: `X-Content-Type-Options: nosniff` presente e `X-Powered-By` ausente
- [ ] Full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `perf(backend): compressão e cabeçalhos de segurança`

---

### T10: Logger de produção sem pretty e com redact

**What**: `transport` só se `NODE_ENV !== 'production'`, `level` de `LOG_LEVEL`, `redact: ['req.headers.authorization']`.
**Where**: `Backend/src/utils/logger.ts`
**Depends on**: None
**Reuses**: pino
**Requirement**: OPT-09

**Done when**:
- [ ] Teste novo (`tests/unit/logger.test.ts`) com `vi.stubEnv` cobre produção (sem transport) e dev
- [ ] Teste: log de `{ req: { headers: { authorization: 'Bearer x' } } }` sai com `[Redacted]`
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `fix(backend): logger json em produção e sem token`

---

### T11: Apagar os dois `incidentModel.ts` mortos

**What**: Remover `src/feature/incident/incidentModel.ts` e `src/models/incidentModel.ts` (0 importadores, confirmado por grep e knip).
**Where**: `Backend/src/models/incidentModel.ts`
**Depends on**: None
**Reuses**: -
**Requirement**: OPT-10

**Done when**:
- [ ] Os 2 arquivos apagados; `grep -rn incidentModel Backend/src Backend/tests` vazio
- [ ] Build gate verde

**Tests**: none
**Gate**: build
**Commit**: `chore(backend): remove incidentModel sem uso`

---

### T12: Exports mortos do knip (Backend)

**What**: Tirar `export` de `QUADRO_INICIAL`, `regrasAssign`, `repositorioForklift`, `repositorioTelemetry`, `repositorioUser`, `STATUS`, `CHAVES_CATEGORIA`, `FilialEscopo`; remover `StatusCode.NO_CONTENT` se nenhum uso.
**Where**: `Backend/src/core/escopo.ts`
**Depends on**: None
**Reuses**: saída do knip
**Requirement**: OPT-10

**Done when**:
- [ ] `npx knip` no Backend: 0 arquivos/exports/tipos sem uso e sem hint de `main`
- [ ] Build gate verde

**Tests**: none
**Gate**: build
**Commit**: `chore(backend): remove exports sem uso`

---

### T13: Dono confere índices e planos (manual)

**What**: Depois do deploy da Phase 1, o dono roda o bloco do design ("Dono (Trilha D) — T13") no mongosh e devolve a saída; o orquestrador anexa ao STATE. Inclui a query de duplicados de `accessrequests` que destrava T33.
**Where**: `.specs/STATE.md`
**Depends on**: T5, T8
**Reuses**: design.md, seção Dono
**Requirement**: OPT-07

**Done when**:
- [ ] `getIndexes()` mostra os índices de T1–T5
- [ ] Os 7 `explain` mostram `IXSCAN`; qualquer `COLLSCAN` vira tarefa nova
- [ ] Query de duplicados de `accessrequests` pendentes voltou vazia (ou o dono limpou)

**Tests**: none
**Gate**: manual
**Commit**: `docs(specs): resultado de índices do dono`

---

### T14: Um lockfile só no Backend

**What**: `git rm Backend/package-lock.json` e adicionar `package-lock.json` ao `.gitignore` da raiz (o projeto usa yarn em scripts e docs).
**Where**: `Backend/package-lock.json`
**Depends on**: None
**Reuses**: -
**Requirement**: OPT-10

**Done when**:
- [ ] `git ls-files | grep package-lock` não lista Backend; `.gitignore` atualizado
- [ ] `cd Backend && yarn install --frozen-lockfile` passa; build gate verde

**Tests**: none
**Gate**: build
**Commit**: `chore: remove package-lock duplicado do Backend`

---

### T15: Rotas lazy com Suspense

**What**: `React.lazy` para as 14 páginas e o `EmployeeLayout`, `<Suspense fallback={<PageSkeleton />}>` em volta de `<Routes>` e boundary de erro com "Recarregar".
**Where**: `Frontend/src/routes/appRoutes.tsx`
**Depends on**: None
**Reuses**: `PageSkeleton`
**Requirement**: OPT-01

**Done when**:
- [ ] `test/routes/appRoutes.test.tsx` e `test/App.test.tsx` usam `findBy*` e passam
- [ ] Teste novo: `import()` rejeitado mostra o botão "Recarregar"
- [ ] Full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `perf(frontend): carrega páginas por rota`

---

### T16: Suspense no `EmployeeLayout` e medição do bundle

**What**: `<Suspense fallback={<EmployeeSkeleton />}>` em volta do `<Outlet />`; rodar o build e registrar o tamanho do chunk de entrada.
**Where**: `Frontend/src/components/employee/EmployeeLayout.tsx`
**Depends on**: T15
**Reuses**: `EmployeeSkeleton`
**Requirement**: OPT-01

**Done when**:
- [ ] Teste: navegar entre `/funcionario` e `/funcionario/historico` mantém o cabeçalho montado
- [ ] `vite build`: chunk de entrada ≤ 140 kB gzip e nenhum > 500 kB; números no commit
- [ ] Build gate verde

**Tests**: unit
**Gate**: build
**Commit**: `perf(frontend): suspense no layout do funcionário`

---

### T17: `loading` real em `useEmployeeData`

**What**: Hook devolve `loading` até as duas requisições assentarem (`Promise.allSettled`).
**Where**: `Frontend/src/hooks/useEmployeeData.ts`
**Depends on**: None
**Reuses**: `machineService`, `sessionService`
**Requirement**: OPT-02

**Done when**:
- [ ] Teste novo (`test/hooks/useEmployeeData.test.ts`): `true` antes, `false` depois de sucesso e depois de erro
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): loading real nos dados do funcionário`

---

### T18: `loading` real em `AlertasPage`

**What**: Estado `loading` até a primeira resposta de `incidentService.listar`, mostrando o skeleton atual; remove o uso de `useFirstVisitLoading`.
**Where**: `Frontend/src/pages/AlertasPage.tsx`
**Depends on**: None
**Reuses**: skeleton da página
**Requirement**: OPT-02

**Done when**:
- [ ] Teste: skeleton enquanto a promise pende; conteúdo logo após resolver, sem timers
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `fix(frontend): alertas sem latência simulada`

---

### T19: Remover `useFirstVisitLoading`

**What**: Trocar o hook por `loading` de `useEmployeeData` em Home/Máquinas/Histórico, tirar de Session/Settings/IncidentSheet (já têm `ready`/sem dados) e apagar `hooks/useFirstVisitLoading.ts` + `test/hooks/useFirstVisitLoading.test.ts`.
**Where**: `Frontend/src/hooks/useFirstVisitLoading.ts`
**Depends on**: T17, T18
**Reuses**: T17
**Requirement**: OPT-02

**Done when**:
- [ ] `grep -rn "useFirstVisitLoading\|MOCK_LATENCY_MS" Frontend/src` vazio
- [ ] Testes das 6 telas passam sem `advanceTimers` de 600 ms; contagem de testes removidos declarada
- [ ] Full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `perf(frontend): remove latência simulada`

---

### T20: `api.ts` sem Content-Type forçado

**What**: Apagar `config.headers['Content-Type'] = 'application/json'` e o handler de erro redundante do interceptor de request.
**Where**: `Frontend/src/services/api.ts`
**Depends on**: None
**Reuses**: `test/services/api.test.ts`
**Requirement**: OPT-05

**Done when**:
- [ ] Teste: GET sem corpo não leva `Content-Type: application/json`; POST com objeto leva
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(frontend): evita preflight em GET`

---

### T21: `package.json` sem `react-router` e com `engines`

**What**: `yarn remove react-router`; `"engines": { "node": ">=20.19" }`.
**Where**: `Frontend/package.json`
**Depends on**: None
**Reuses**: -
**Requirement**: OPT-03

**Done when**:
- [ ] `yarn.lock` sem `react-router@8`; build gate verde

**Tests**: none
**Gate**: build
**Commit**: `chore(frontend): remove react-router sem uso`

---

### T22: Um lockfile só no Frontend

**What**: `git rm Frontend/package-lock.json` (o `.gitignore` da raiz já é atualizado em T14; se T14 ainda não rodou, só apagar).
**Where**: `Frontend/package-lock.json`
**Depends on**: None
**Reuses**: -
**Requirement**: OPT-03

**Done when**:
- [ ] `cd Frontend && yarn install --frozen-lockfile` passa; build gate verde

**Tests**: none
**Gate**: build
**Commit**: `chore: remove package-lock duplicado do Frontend`

---

### T23: Exports mortos do knip (Frontend)

**What**: Tirar `export` de `LOOP_FADE_SECONDS`, `USAGE_SESSIONS` e das 7 interfaces (`AccessRequestCardProps`, `InitialPasswordModalProps`, `RejectDialogProps`, `AuthFieldProps`, `AuthLayoutProps`, `CategoryFormValues`, `LanguageOption`).
**Where**: `Frontend/src/utils/loopFade.ts`
**Depends on**: None
**Reuses**: saída do knip
**Requirement**: OPT-04

**Done when**:
- [ ] `npx knip` no Frontend: 0 itens; build gate verde

**Tests**: none
**Gate**: build
**Commit**: `chore(frontend): remove exports sem uso`

---

### T24: Assets e CSS mortos

**What**: Apagar `src/assets/{hero.png,react.svg,vite.svg,logo-full.svg}` e as regras `.info` (`FleetCard.module.css:263`) e `.icon` (`MachineCard.module.css:28`) depois de grep confirmar 0 uso; `public/icons.svg` só se grep em `index.html`/`src`/`public` der 0.
**Where**: `Frontend/src/assets/hero.png`, `Frontend/src/assets/react.svg`, `Frontend/src/assets/vite.svg`, `Frontend/src/assets/logo-full.svg`, `Frontend/src/pages/employee/EmployeeSessionPage.tsx` (só leitura: confirma que `forklift.mp4` e `forklift.webm` continuam referenciados e NÃO são apagados)
**Depends on**: None
**Reuses**: -
**Requirement**: OPT-04

**Done when**:
- [ ] Greps zerados registrados no commit; build gate verde
- [ ] `forklift.mp4` e `forklift.webm` continuam em `src/assets` e no `<video>` da sessão (nenhum asset referenciado é removido)

**Tests**: none
**Gate**: build
**Commit**: `chore(frontend): remove assets e css sem uso`

---

### T25: `scrypt` assíncrono

**What**: `gerarHashSenha`/`verificarSenha` com `promisify(scrypt)`; `await` em `authService`, `operatorService`, `seedAdmin`, `seedData`; testes viram async.
**Where**: `Backend/src/utils/senha.ts`
**Depends on**: None
**Reuses**: `node:crypto`
**Requirement**: OPT-11

**Done when**:
- [ ] `senha.test.ts`: hash e verificação async, senha errada → `false`, hash malformado → `false`
- [ ] `grep -rn scryptSync Backend/src` vazio; full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `perf(backend): hash de senha sem bloquear o event loop`

---

### T26: Login com tempo constante para usuário inexistente

**What**: Quando o usuário não existe, `await verificarSenha(senha, HASH_FALSO)` antes do 401.
**Where**: `Backend/src/feature/auth/authService.ts`
**Depends on**: T25
**Reuses**: `verificarSenha`
**Requirement**: OPT-11

**Done when**:
- [ ] Teste: usuário inexistente chama `verificarSenha` uma vez e responde 401; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `fix(backend): login não revela usuário pelo tempo`

---

### T27: `aplicarStatus` reaproveita o documento

**What**: `aplicarStatus` aceita o forklift já lido e `empresaId` opcional (pula `Forklift.findById` e `Branch.findById`); `registrarImpacto` repassa o que leu.
**Where**: `Backend/src/feature/machine/statusService.ts`
**Depends on**: None
**Reuses**: `categoriaDoStatus`
**Requirement**: OPT-12

**Done when**:
- [ ] Teste conta chamadas aos models mockados em `registrarImpacto` com `empresaId`: ≤ 4 (eram 6: `Forklift.findOne`, `Incident.create`, `Forklift.findById`, `Branch.findById`, `Category.findOne`, `Forklift.updateOne`)
- [ ] Testes atuais de `aplicarStatus` por id continuam verdes; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): menos leituras ao aplicar status`

---

### T28: Telemetria valida dispositivo com `exists`

**What**: `criar` usa `Device.exists({ _id, ...filtroPorFilial(escopo) })` e passa `req.escopo.empresaId` ao `registrarImpacto`.
**Where**: `Backend/src/feature/telemetry/telemetryController.ts`
**Depends on**: T27
**Reuses**: `filtroPorFilial`
**Requirement**: OPT-12

**Done when**:
- [ ] Teste: impacto acima do limite em máquina fora de `alerta` faz ≤ 8 chamadas a models (incluindo as 2 do `autenticar`), contra 10
- [ ] Teste: dispositivo fora do escopo → 404; full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `perf(backend): leitura de sensor com menos queries`

---

### T29: Projeção no `autenticar`

**What**: `User.findById(sub).select('role operadorId acessoNegado empresaId escopo filiaisIds').lean()`.
**Where**: `Backend/src/core/autenticar.ts`
**Depends on**: None
**Reuses**: `autenticar.test.ts`
**Requirement**: OPT-12

**Done when**:
- [ ] Teste asserta o `select` exato; revogação (`acessoNegado`) segue 401 na hora; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): autenticar lê só os campos usados`

---

### T30: `definirTrava` e `populate` enxutos

**What**: `definirTrava` chama `obterMaquina` uma vez (update com filtro de escopo antes); `populate('dispositivoConectadoId', 'enderecoMac nome')` e `populate('operadorConectadoId', 'nome')`.
**Where**: `Backend/src/feature/machine/machineService.ts`
**Depends on**: None
**Reuses**: `filtroPorFilial`
**Requirement**: OPT-12

**Done when**:
- [ ] Teste: `definirTrava` → 1 `Forklift.find`/`obterMaquina`; máquina fora do escopo → 404
- [ ] Teste asserta as projeções do populate; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(backend): trava e populate com menos dados`

---

### T31: 404 e erro global em JSON

**What**: `app.use('/api', (req, res) => 404 JSON)` e handler de 4 argumentos que mapeia `SyntaxError` do `express.json` para 400 `{ message: "JSON inválido." }` e o resto para `responderErro`.
**Where**: `Backend/src/app.ts`
**Depends on**: None
**Reuses**: `responderErro`
**Requirement**: OPT-13

**Done when**:
- [ ] Teste: corpo `{` → 400 JSON; `/api/nao-existe` com token → 404 JSON; full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `fix(backend): erros sempre em json`

---

### T32: Rate limit em login e pedido de acesso

**What**: `yarn add express-rate-limit`; 10/15 min em `/api/auth/login`, 5/60 min em `POST /api/access-requests`.
**Where**: `Backend/src/app.ts`
**Depends on**: T31
**Reuses**: -
**Requirement**: OPT-13

**Done when**:
- [ ] Teste: 11ª tentativa de login → 429; 6º POST de acesso → 429; GET de acesso não limitado
- [ ] Full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `feat(backend): rate limit em login e pedido de acesso`

---

### T33: Índice único de pedido pendente

**What**: `accessRequestSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { status: 'pendente' } })`. Só depois de T13 confirmar 0 duplicados.
**Where**: `Backend/src/schemas/accessRequest.ts`
**Depends on**: None (bloqueio externo: resultado de duplicados do T13)
**Reuses**: `schemas.test.ts`
**Requirement**: OPT-14

**Done when**:
- [ ] Teste asserta índice, `unique` e o parcial; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `fix(backend): um pedido pendente por e-mail`

---

### T34: Controller de acesso trata 11000 e erro cru

**What**: `criar` responde 409 com a mensagem atual em `code === 11000` e usa `responderErro` no `catch` (sem `error.message` cru).
**Where**: `Backend/src/feature/accessRequest/accessRequestController.ts`
**Depends on**: T33
**Reuses**: `responderErro`
**Requirement**: OPT-14

**Done when**:
- [ ] Teste: `create` rejeita com 11000 → 409; erro genérico → 500 sem a mensagem interna; quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `fix(backend): conflito de pedido de acesso em 409`

---

### T35: `conn.ts` usa o logger único

**What**: Trocar o `pino()` local por `logger` de `utils/logger.ts` (o `dns.setServers` fica até D6).
**Where**: `Backend/src/config/conn.ts`
**Depends on**: None
**Reuses**: `logger`
**Requirement**: OPT-09

**Done when**:
- [ ] `grep -n "pino()" Backend/src/config/conn.ts` vazio; build gate verde

**Tests**: none
**Gate**: build
**Commit**: `chore(backend): conexão usa o logger único`

---

### T36: Idiomas sob demanda

**What**: `resources` só com `pt-BR`; `carregarIdioma(lng)` com `import()` + `addResourceBundle`; `useLanguage` espera o carregamento antes do `changeLanguage` e mostra toast se falhar; idioma salvo carrega no startup.
**Where**: `Frontend/src/config/i18n.ts`
**Depends on**: None
**Reuses**: `useToast`, `hooks/useLanguage.ts`
**Requirement**: OPT-15

**Done when**:
- [ ] `test/config/i18n.test.ts` lê os JSON direto para paridade; teste novo: trocar para `en-US` carrega e traduz; falha mantém `pt-BR` e chama o toast
- [ ] `vite build`: 6 chunks de locale; entrada ≤ 120 kB gzip (números no commit)
- [ ] Build gate verde

**Tests**: unit
**Gate**: build
**Commit**: `perf(frontend): carrega idiomas sob demanda`

---

### T37: Chaves de tradução sem uso

**What**: Remover dos 7 `locales/*/translation.json` as chaves listadas no design (reconferir cada uma com grep, incluindo uso dinâmico).
**Where**: `Frontend/src/locales/pt-BR/translation.json`
**Depends on**: T36
**Reuses**: lista do design
**Requirement**: OPT-17

**Done when**:
- [ ] Teste de paridade de chaves verde; grep de cada chave removida vazio em `src/` (fora de locales)
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `chore(frontend): remove traduções sem uso`

---

### T38: Cache e abort em `machineService.listar`

**What**: Map por `filialId` com TTL 30 s, promise rejeitada sai do cache, `invalidar()` nas mutações do próprio service, `signal` repassado ao axios.
**Where**: `Frontend/src/services/machineService.ts`
**Depends on**: None
**Reuses**: `api`
**Requirement**: OPT-16

**Done when**:
- [ ] Teste: 2 `listar` seguidos → 1 `api.get`; após 30 s (fake timers) → 2; após `criar` → refaz; rejeição não fica no cache; `signal` chega ao `api.get`
- [ ] Testes das páginas (Frota, Visão Geral, Alertas) ainda verdes com `beforeEach` limpando o cache; full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `perf(frontend): cache curto da lista de máquinas`

---

### T39: Cache em `sectorService.listar`

**What**: Mesmo padrão de T38 para setores, invalidado em criar/editar/excluir setor.
**Where**: `Frontend/src/services/sectorService.ts`
**Depends on**: None
**Reuses**: padrão de T38
**Requirement**: OPT-16

**Done when**:
- [ ] Testes equivalentes aos de T38; full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `perf(frontend): cache curto da lista de setores`

---

### T40: `value` estável no `ActiveBranchProvider`

**What**: `useMemo` do `value` e `useCallback` nos setters, mantendo a detecção de login/logout via `useLocation`.
**Where**: `Frontend/src/context/ActiveBranchContext.tsx`
**Depends on**: None
**Reuses**: -
**Requirement**: OPT-17

**Done when**:
- [ ] Teste: consumidor com contador de render não re-renderiza ao navegar entre duas rotas com a mesma sessão; login/logout seguem atualizando
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(frontend): contexto de filial sem re-render a cada rota`

---

### T41: Vídeo da sessão econômico

**What**: rAF só na janela de fade, ligado por `timeupdate`; `preload="metadata"`; pausa com `prefers-reduced-motion: reduce`.
**Where**: `Frontend/src/pages/employee/EmployeeSessionPage.tsx`
**Depends on**: None
**Reuses**: `utils/loopFade.ts`
**Requirement**: OPT-17

**Done when**:
- [ ] Teste: fora da janela nenhum `requestAnimationFrame` é agendado; dentro, sim; `matchMedia` reduce → `pause()`
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(frontend): vídeo da sessão sem rAF contínuo`

---

### T42: Shimmer com `transform`

**What**: Pseudo-elemento com gradiente animando `translateX` no lugar de `background-position`.
**Where**: `Frontend/src/components/common/PageSkeleton.module.css`
**Depends on**: None
**Reuses**: `prefers-reduced-motion` já existente em `index.css`
**Requirement**: OPT-17

**Done when**:
- [ ] `grep background-position PageSkeleton.module.css` vazio; conferência visual no navegador; build gate verde

**Tests**: none
**Gate**: build
**Commit**: `perf(frontend): shimmer sem repaint`

---

### T43: Fonte herdada do `body`

**What**: Trocar `*{font-family:var(--sans)}` por `body` + `button, input, select, textarea { font: inherit }`.
**Where**: `Frontend/src/index.css`
**Depends on**: None
**Reuses**: -
**Requirement**: OPT-17

**Done when**:
- [ ] Conferência visual de login, Frota, modal e área do funcionário sem mudança de fonte; build gate verde

**Tests**: none
**Gate**: build
**Commit**: `style(frontend): fonte herdada do body`

---

### T44: Foco no `Modal`

**What**: Foco inicial no primeiro focável, trap de Tab/Shift+Tab e retorno do foco ao fechar, copiando a lógica do `BottomSheet`.
**Where**: `Frontend/src/components/common/Modal.tsx`
**Depends on**: None
**Reuses**: `components/employee/BottomSheet.tsx:34-55`
**Requirement**: OPT-17

**Done when**:
- [ ] Teste: abrir foca dentro; Tab no último volta ao primeiro; fechar devolve o foco ao gatilho; `ConfirmDialog` herda
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `fix(frontend): foco preso no modal`

---

### T45: Filtro memorizado na Frota

**What**: `useMemo` de `machinesById` e do filtro por (quadro, busca, setor); o drag (`overRowId`) não refaz o filtro.
**Where**: `Frontend/src/pages/FrotaPage.tsx`
**Depends on**: None
**Reuses**: `matchesMachine`
**Requirement**: OPT-17

**Done when**:
- [ ] Teste com `matchesMachine` espionado: `dragOver` não chama o filtro de novo; digitar na busca chama
- [ ] Quick gate verde

**Tests**: unit
**Gate**: quick
**Commit**: `perf(frontend): filtro da frota memorizado`

---

### T46: D1 — `/api/reset` fora de produção

**What**: Só se o dono escolher a recomendação de D1: rota montada só com `RESET_HABILITADO=true`, depois do `autenticar`, `POST` e `exigirAdmin`.
**Where**: `Backend/src/feature/reset/resetRouter.ts`
**Depends on**: None (bloqueio externo: decisão D1)
**Reuses**: `exigirAdmin`
**Requirement**: OPT-18

**Done when**:
- [ ] Teste: sem flag → 404; com flag e sem token → 401; colaborador → 403; admin `POST` → 200; `GET` → 404
- [ ] `.env.example` documenta a flag; full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `fix(backend): reset só com flag e admin`

---

### T47: D2 — remover `/api/forklifts`

**What**: Só com aprovação de D2: apagar `feature/forklift`, `models/forkliftModel.ts`, a rota em `app.ts` e os testes da pilha.
**Where**: `Backend/src/feature/forklift/forkliftRouter.ts`
**Depends on**: None (bloqueio externo: decisão D2)
**Reuses**: -
**Requirement**: OPT-19

**Done when**:
- [ ] `/api/forklifts` → 404 (teste em `app.test.ts`); contagem de testes removidos declarada; build gate verde

**Tests**: unit
**Gate**: build
**Commit**: `refactor(backend): remove rota legada de forklifts`

---

### T48: D2 — remover `/api/users`

**What**: Só com aprovação de D2: apagar `feature/user` (router, controller, service, repository, rules), `models/userModel.ts`, a rota e os testes.
**Where**: `Backend/src/feature/user/userRouter.ts`
**Depends on**: None (bloqueio externo: decisão D2)
**Reuses**: -
**Requirement**: OPT-19

**Done when**:
- [ ] `/api/users` → 404; `PUT /api/users/:id` não é usado pelo Frontend (grep); build gate verde

**Tests**: unit
**Gate**: build
**Commit**: `refactor(backend): remove rota legada de users`

---

### T49: D2 — remover `/devices`, `/telemetry` e `core/core*`

**What**: Só se o dono confirmar que nenhum sensor IoT usa `POST /api/telemetry`: apagar `feature/device`, `feature/telemetry`, `core/coreModel|coreRepository|coreService` e testes. Se houver hardware, esta tarefa é cancelada.
**Where**: `Backend/src/core/coreRepository.ts`
**Depends on**: T47, T48
**Reuses**: -
**Requirement**: OPT-19

**Done when**:
- [ ] Rotas → 404; `registrarImpacto` continua coberto por teste do `statusService`; build gate verde

**Tests**: unit
**Gate**: build
**Commit**: `refactor(backend): remove pilha legada de device e telemetria`

---

### T50: D3 — cache curto no `autenticar`

**What**: Só se o dono aceitar até 15 s de atraso na revogação: Map por `sub` com TTL 15 s, invalidado onde `acessoNegado`, `escopo` ou `filiaisIds` mudam.
**Where**: `Backend/src/core/autenticar.ts`
**Depends on**: None (bloqueio externo: decisão D3)
**Reuses**: -
**Requirement**: OPT-20

**Done when**:
- [ ] Teste: 2 requisições em < 15 s → 1 `User.findById`; após 15 s → 2; após negar acesso pelo service → 401 imediato
- [ ] Full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `perf(backend): cache curto do usuário autenticado`

---

### T51: D4 — tirar o mock de manutenção do bundle

**What**: Só com D4: mover `MACHINES`/`MACHINE_EVENTS`/`eventsForMachine` para `src/test/fixtures`, apagar `mockEventsFor`/`repairsFor` de Frota, Visão Geral e Alertas e mostrar estado vazio na aba Manutenção.
**Where**: `Frontend/src/data/machines.ts`
**Depends on**: None (bloqueio externo: decisão D4)
**Reuses**: `incidentToEvent`
**Requirement**: OPT-21

**Done when**:
- [ ] `vite build` sem `MACHINE_EVENTS` no JS de produção (grep no dist); aba Manutenção mostra o texto vazio
- [ ] 21 arquivos de teste que importam `data/machines` apontam para a fixture; full gate verde

**Tests**: unit
**Gate**: full
**Commit**: `refactor(frontend): remove mock de manutenção da produção`

---

### T52: D5 — remover `migrate:*`

**What**: Só depois de o dono confirmar que as 3 migrações rodaram em todos os ambientes: apagar `scripts/migrate*.ts`, `tests/unit/migrate*.test.ts`, os scripts do `package.json` e as menções em `docs/`.
**Where**: `Backend/src/scripts/migrateSectors.ts`
**Depends on**: None (bloqueio externo: decisão D5)
**Reuses**: -
**Requirement**: OPT-22

**Done when**:
- [ ] `grep -rn "migrate:" Backend docs` vazio; contagem de testes removidos declarada; build gate verde

**Tests**: unit
**Gate**: build
**Commit**: `chore(backend): remove migrações já aplicadas`

---

## Phase Execution Map

```
Onda F1:  Phase 1 (Backend)  ∥  Phase 2 (Frontend)     → T13 (dono) após deploy da Phase 1
Onda F2:  Phase 3 (Backend)  ∥  Phase 4 (Frontend)     (T33 espera o resultado de duplicados do T13)
Onda F3:  Phase 5, tarefa a tarefa, conforme cada decisão D1–D5
```

Batches: Phase 1 = 14 tarefas (1 worker; T13 é do dono), Phase 2 = 10, Phase 3 = 11, Phase 4 = 10, Phase 5 = 7 condicionais. Verifier independente roda ao fim de cada onda.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1–T10, T15–T18, T20, T25–T45 | 1 arquivo de produto (+ seu teste) | ✅ Granular |
| T11, T12, T19, T23, T24 | remoção mecânica em vários arquivos, um conceito | ⚠️ OK (coeso) |
| T21, T22, T14 | manifest/lockfile | ✅ Granular |
| T47–T52 | remoção de uma pilha/rota, gated pelo dono | ⚠️ OK (coeso) |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T2/T3/T4/T5 | T1/T2/T3/T4 | cadeia T1→T5 | ✅ |
| T7 | T6 | T6→T7 | ✅ |
| T8 | T6 | T6→T8 | ✅ |
| T13 | T5, T8 | T5→T13, T8→T13 | ✅ |
| T16 | T15 | T15→T16 | ✅ |
| T19 | T17, T18 | T17→T19, T18→T19 | ✅ |
| T26 | T25 | T25→T26 | ✅ |
| T28 | T27 | T27→T28 | ✅ |
| T32 | T31 | T31→T32 | ✅ |
| T34 | T33 | T33→T34 | ✅ |
| T37 | T36 | T36→T37 | ✅ |
| T49 | T47, T48 | T47→T49, T48→T49 | ✅ |
| demais | None | sem seta | ✅ |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1–T5, T33 | Backend schema | unit | unit | ✅ |
| T6–T8, T25–T30 | Backend service/repository/middleware/util | unit | unit | ✅ |
| T9, T10, T31, T32, T34 | Backend app/controller/util | unit | unit | ✅ |
| T11, T12, T35 | remoção / troca de import sem lógica | none (build) | none | ✅ |
| T13 | Owner DB check | none | none | ✅ |
| T14, T21, T22 | Manifest/lockfile | none | none | ✅ |
| T15–T20, T36–T41, T44, T45 | Frontend route/page/hook/service/config | unit | unit | ✅ |
| T23, T24, T42, T43 | exports/assets/CSS | none (build) | none | ✅ |
| T46–T52 | Backend/Frontend app e remoções com rota | unit | unit | ✅ |
