# Autenticação e escopo por filial nas rotas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Regra do banco (global do dono):** nenhuma tarefa, teste, gate ou Verifier acessa o banco. Os gates do Backend rodam `tests/unit/<arquivo>` explícito, nunca `yarn test` (que inclui `tests/integration`, que conecta ao Mongo). Todo teste que importa um módulo que chega aos schemas precisa mockar `config/conn` ou os schemas; um teste sem esse mock poderia conectar ao banco quando existe `.env`. Nenhum `.env` é lido.

---

**Spec**: `.specs/features/access-scope/spec.md` (sem `design.md`: a abordagem está nas Assumptions do spec)
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none (`docs/arquitetura.md` descreve a arquitetura, sem regras de teste) - strong defaults applied; `Backend/tests/unit/*` sampled as the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend core (`src/core`, `src/utils`) | unit | All branches; 1:1 to spec ACs; models/schemas mockados | `Backend/tests/unit/<nome>.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend middleware (`autenticar`) | unit | Happy path + every 401/500 AC; JWT real, schemas mockados | `Backend/tests/unit/autenticar.test.ts` | `cd Backend && npx vitest run tests/unit/autenticar.test.ts` |
| Backend service | unit | All branches; 1:1 to spec ACs; every listed edge case | `Backend/tests/unit/<nome>Service.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Service.test.ts` |
| Backend controller / route | unit | Happy path + each error path, with the service mocked | `Backend/tests/unit/<nome>Controller.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Controller.test.ts` |
| Backend app wiring (`src/app.ts`) | unit | Ordem do middleware: rotas públicas sem token, protegidas com 401, protegidas com token chegam ao handler; porta efêmera de loopback, schemas mockados | `Backend/tests/unit/app.test.ts` | `cd Backend && npx vitest run tests/unit/app.test.ts` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Baseline before this feature: Backend `tests/unit` = 203 passed in 22 files; `npx tsc --noEmit` = 0 errors.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | The row's Run Command above for the task's test file, then `cd Backend && npx tsc --noEmit` (0 errors) |
| Full | After tasks with e2e/integration tests | Not used: the tests in `Backend/tests/integration` touch the database |
| Build | After phase completion or tasks without tests | `cd Backend && npx tsc --noEmit` (0 errors) and `cd Backend && npx vitest run tests/unit` (all pass) |

**Granularity note:** T4, T7 e T11 tocam mais de um arquivo porque cada um é uma unidade coesa de poucas linhas (helper + o controller de filiais que passa a usá-lo; controller + regras). O validador avisa; o aviso é aceito.

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Core

```
T1 → T2
T3 → T4
T5
T6
```

### Phase 2: Resources

```
T2 → T7
T4 → T7
T5 → T7
T3 → T8 → T9
T2 → T10
T3 → T10
T5 → T10
T2 → T11
T4 → T11
T11 → T12
T5 → T12
```

### Phase 3: Wiring

```
T6 → T13
T9 → T13
```

---

## Task Breakdown

### T1: Scope filter in RepositoryBase

**What**: `obterTodos`, `obterPorId`, `atualizarPorId` e `deletarPorId` aceitam um filtro opcional, que vale junto com o `_id` pedido.
**Where**: `Backend/src/core/coreRepository.ts`
**Depends on**: None
**Reuses**: Os métodos atuais do mesmo arquivo
**Requirement**: SCP-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `obterTodos(filtro)` chama `find(filtro)`; sem filtro, `find({})` (Filtro AC1)
- [x] `obterPorId(id, filtro)` chama `findOne({ ...filtro, _id: id })` e devolve `null` quando não acha (Filtro AC2)
- [x] `atualizarPorId(id, dados, options, filtro)` chama `findOneAndUpdate({ ...filtro, _id: id }, dados, { new: true, ...options })` e devolve `null` quando não acha (Filtro AC3)
- [x] `deletarPorId(id, filtro)` chama `findOneAndDelete({ ...filtro, _id: id })` e devolve `null` quando não acha (Filtro AC4)
- [x] Um `_id` dentro do filtro nunca vence o `_id` pedido (Filtro AC5)
- [x] Id inválido devolve `null` sem consultar o model nos três métodos por id (Filtro AC6)
- [x] Gate: `cd Backend && npx vitest run tests/unit/coreRepository.test.ts && npx tsc --noEmit`
- [x] Test count: ao menos 9 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): accept a scope filter in RepositoryBase`

---

### T2: Scope filter in ServiceBase

**What**: `listar`, `obterPorId`, `atualizar` e `deletar` do `ServiceBase` repassam um filtro opcional ao repository.
**Where**: `Backend/src/core/coreService.ts`
**Depends on**: T1
**Reuses**: Os métodos atuais do mesmo arquivo
**Requirement**: SCP-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Cada método repassa o filtro ao repository na posição certa (Filtro AC7)
- [x] Repository que devolve `null` faz o service lançar `<Entidade> não encontrado(a).` como hoje (Filtro AC8)
- [x] Sem filtro, os testes existentes de `forkliftService.test.ts` e `userService.test.ts` seguem passando
- [x] Gate: `cd Backend && npx vitest run tests/unit/coreService.test.ts tests/unit/forkliftService.test.ts tests/unit/userService.test.ts && npx tsc --noEmit`
- [x] Test count: 5 testes novos passam e os existentes de forkliftService e userService seguem

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): pass the scope filter through ServiceBase`

---

### T3: Scope filters

**What**: `filtroPorFilial(escopo)` e `filtroPorEmpresa(escopo)`, que falham fechado sem escopo.
**Where**: `Backend/src/core/escopo.ts`
**Depends on**: None
**Reuses**: O tipo `Escopo` do mesmo arquivo
**Requirement**: SCP-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `filtroPorFilial` devolve `{ filialId: { $in: <ids das filiais> } }` (Filtro AC9)
- [x] Escopo ausente ou sem filiais devolve `{ filialId: { $in: [] } }` (Filtro AC10)
- [x] `filtroPorEmpresa` devolve `{ empresaId: { $in: [<empresaId>] } }`, e `$in: []` sem empresa ou sem escopo (Filtro AC11)
- [x] Gate: `cd Backend && npx vitest run tests/unit/escopo.test.ts && npx tsc --noEmit`
- [x] Test count: os 8 testes existentes mais 4 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): add scope filters by filial and empresa`

---

### T4: resolverFilial and exigirEmpresa

**What**: `resolverFilial(escopo, filialId?)` escolhe e valida a filial de um recurso novo, `exigirEmpresa(escopo, mensagem)` lança 403 sem `tipo: 'empresa'`, e o `branchController` passa a usar `exigirEmpresa`.
**Where**: `Backend/src/core/escopo.ts`, `Backend/src/feature/branch/branchController.ts`
**Depends on**: T3
**Reuses**: `ErroHttp` de `Backend/src/utils/responseHandler.ts`; a função local `exigirEmpresa` do `branchController`
**Requirement**: SCP-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `filialId` de uma filial do escopo é devolvido (Forklift AC3)
- [x] `filialId` fora do escopo lança `ErroHttp` 403 (Forklift AC4)
- [x] `filialId` que não é texto de ObjectId lança `ErroHttp` 400 (Forklift AC5)
- [x] Sem `filialId`, escopo `filiais` com uma filial devolve essa filial (Forklift AC6)
- [x] Sem `filialId`, escopo `empresa`, várias filiais ou nenhuma lança `ErroHttp` 400 (Forklift AC7)
- [x] `exigirEmpresa` lança `ErroHttp` 403 com a mensagem dada quando `tipo` não é `empresa`, e não faz nada quando é
- [x] Os testes existentes de `branchController.test.ts` seguem passando; o arquivo só ganha o mock do schema `branch`, que o controller agora alcança por `core/escopo`
- [x] Gate: `cd Backend && npx vitest run tests/unit/escopo.test.ts tests/unit/branchController.test.ts && npx tsc --noEmit`
- [x] Test count: ao menos 9 testes novos passam e os 20 de branchController seguem

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): add resolverFilial and exigirEmpresa`

---

### T5: Reject Mongo operators in update bodies

**What**: `exigirSemOperadores(corpo)` lança `ErroHttp` 400 se alguma chave começa com `$`.
**Where**: `Backend/src/utils/corpo.ts`
**Depends on**: None
**Reuses**: `ErroHttp` de `Backend/src/utils/responseHandler.ts`
**Requirement**: SCP-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Corpo com chave `$set`, `$where` ou outra com `$` lança `ErroHttp` 400 nomeando a chave (Filtro AC12)
- [x] Corpo sem chave com `$` não lança, mesmo com `$` no meio de uma chave ou nos valores
- [x] Gate: `cd Backend && npx vitest run tests/unit/corpo.test.ts && npx tsc --noEmit`
- [x] Test count: 4 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): reject mongo operators in update bodies`

---

### T6: autenticar middleware

**What**: `autenticar` verifica o Bearer token, lê o usuário do banco a cada requisição e define `req.escopo`.
**Where**: `Backend/src/core/autenticar.ts`
**Depends on**: None
**Reuses**: `carregarEscopo` de `Backend/src/core/escopo.ts`; `jsonwebtoken` e `env` como em `authService.ts`; `User` de `Backend/src/schemas/user.ts`
**Requirement**: SCP-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Token válido de usuário existente chama `next` e define `req.escopo` com o resultado de `carregarEscopo` (Autenticar AC1)
- [ ] Duas requisições seguidas leem o usuário duas vezes e a segunda reflete o dado novo (Autenticar AC2)
- [ ] Sem cabeçalho, sem `Bearer ` (incluindo `bearer` em minúsculas) ou sem token: 401 `{ error: 'Não autenticado.' }` sem consultar o banco (Autenticar AC3, edge bearer minúsculo)
- [ ] Assinatura inválida, token malformado, token expirado e token assinado com `HS512`: 401 (Autenticar AC4)
- [ ] `sub` que não é ObjectId: 401 sem consultar o banco (Autenticar AC5)
- [ ] Usuário inexistente: 401 (Autenticar AC6)
- [ ] Falha do banco ao ler o usuário ou o escopo: 500 com `{ error: <mensagem> }`, não 401 (Autenticar AC7)
- [ ] Sem `JWT_SECRET`: 500 `{ error: 'JWT_SECRET não configurado.' }` (Autenticar AC8)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/autenticar.test.ts && npx tsc --noEmit`
- [ ] Test count: ao menos 11 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): add autenticar middleware`

---

### T7: Forklifts inside the scope

**What**: O `forkliftController` filtra listar, buscar, atualizar e deletar por filial, resolve a filial do `criar` com `resolverFilial`, só deixa o escopo de empresa mover de filial e recusa chaves com `$`; a regra `filialId` do `forkliftRules` sai porque `resolverFilial` valida.
**Where**: `Backend/src/feature/forklift/forkliftController.ts`, `Backend/src/feature/forklift/forkliftRules.ts`
**Depends on**: T2, T4, T5
**Reuses**: `filtroPorFilial`, `resolverFilial`, `exigirEmpresa`, `exigirSemOperadores`, `responderErro`
**Requirement**: SCP-07, SCP-08, SCP-09, SCP-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] listar, buscar, atualizar e deletar passam `filtroPorFilial(req.escopo)` ao service (Forklift AC1, AC2)
- [ ] Empilhadeira fora do escopo (o service lança "não encontrado(a)") responde 404 em buscar, atualizar e deletar (Forklift AC2)
- [ ] criar usa a filial de `resolverFilial` e a envia no model; 403 para filial de fora, 400 para inválida, default de uma filial, 400 nos demais casos sem `filialId` (Forklift AC3, AC4, AC5, AC6, AC7)
- [ ] atualizar com `filialId`: move para a filial do escopo se o chamador é de empresa; 403 se não é de empresa ou a filial é de fora; 400 se inválido (Forklift AC8, AC9, AC10)
- [ ] atualizar com chave `$...` no corpo responde 400 e não chama o service (Forklift AC11)
- [ ] Os testes de `forkliftController.test.ts` (unit) e do `tests/integration/forkliftController.test.ts` (só mocks, não executado aqui) passam a mandar `req.escopo` (parâmetro novo do contrato)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/forkliftController.test.ts && npx tsc --noEmit`
- [ ] Test count: os 4 testes existentes (adaptados) mais ao menos 14 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): scope forklift routes by filial`

---

### T8: Machines service inside the scope

**What**: `listarMaquinas(escopo, filialId?)` consulta só as filiais do escopo, cruza com `filialId` e inclui `filialId` no item.
**Where**: `Backend/src/feature/machine/machineService.ts`
**Depends on**: T3
**Reuses**: `filtroPorFilial` de `Backend/src/core/escopo.ts`; os testes de `machineService.test.ts`
**Requirement**: SCP-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `Forklift.find` recebe `{ filialId: { $in: <ids do escopo> } }` (Máquinas/Telemetria AC1)
- [ ] O item inclui `filialId` em texto (Máquinas/Telemetria AC2)
- [ ] Com `filialId` do escopo, o `$in` fica só com ele (Máquinas/Telemetria AC3)
- [ ] Com `filialId` fora do escopo, o `$in` fica vazio e a lista é vazia (Máquinas/Telemetria AC4)
- [ ] Escopo sem filiais consulta com `$in: []` (Máquinas/Telemetria AC6)
- [ ] Os testes existentes de `machineService.test.ts` passam chamando com um escopo, e o item esperado ganha `filialId` (comportamento mudou pelo spec)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/machineService.test.ts && npx tsc --noEmit`
- [ ] Test count: os 9 testes existentes mais ao menos 4 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): scope the machines list by filial`

---

### T9: GET /api/machines filialId query

**What**: O controller `listar` valida `?filialId=` e passa `req.escopo` e o `filialId` ao service.
**Where**: `Backend/src/feature/machine/machineController.ts`
**Depends on**: T8
**Reuses**: A validação de ObjectId de `Backend/src/feature/telemetry/telemetryController.ts`
**Requirement**: SCP-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] 200 com o array do service, chamado com `req.escopo` e o `filialId` da query (Máquinas/Telemetria AC1, AC3)
- [ ] `?filialId=` que não é ObjectId, ou aparece duas vezes, responde 400 sem chamar o service (Máquinas/Telemetria AC5, edge filialId repetido)
- [ ] 500 com `{ error: <mensagem> }` quando o service lança
- [ ] Os testes existentes de `machineController.test.ts` passam com `query` e `escopo` no `Request` falso
- [ ] Gate: `cd Backend && npx vitest run tests/unit/machineController.test.ts && npx tsc --noEmit`
- [ ] Test count: os 3 testes existentes mais ao menos 4 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): accept filialId on GET /api/machines`

---

### T10: Telemetry inside the scope

**What**: O `telemetryController` isola a telemetria pelos dispositivos do escopo em listar, buscar, criar, atualizar e deletar, e recusa chaves com `$` no `PUT`.
**Where**: `Backend/src/feature/telemetry/telemetryController.ts`
**Depends on**: T2, T3, T5
**Reuses**: `filtroPorFilial`, `exigirSemOperadores`, `responderErro`; `Device` de `Backend/src/schemas/device.ts`
**Requirement**: SCP-11, SCP-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Os dispositivos do escopo vêm de `Device.find(filtroPorFilial(req.escopo)).distinct('_id')`
- [ ] listar sem `dispositivoId` passa `{ dispositivoId: { $in: <dispositivos> } }` ao service (Máquinas/Telemetria AC7)
- [ ] listar com `?dispositivoId=` de fora do escopo responde 200 `[]` sem consultar a telemetria; de dentro, lista as leituras dele (Máquinas/Telemetria AC8)
- [ ] buscar, atualizar e deletar passam o mesmo filtro, e leitura de fora responde 404 (Máquinas/Telemetria AC9)
- [ ] criar com `dispositivoId` de fora responde 404 sem criar (Máquinas/Telemetria AC10)
- [ ] atualizar com `dispositivoId` de fora responde 404 (Máquinas/Telemetria AC11)
- [ ] atualizar com chave `$...` responde 400 (Máquinas/Telemetria AC12)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/telemetryController.test.ts && npx tsc --noEmit`
- [ ] Test count: ao menos 12 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): isolate telemetry by device scope`

---

### T11: Users by empresa, creation hardened

**What**: O `userController` filtra listar, buscar e deletar por empresa; `criar` usa a empresa do chamador, valida `role` e `escopo`/`filiaisIds` com um objeto por campo e restringe escopo e papel de admin ao escopo de empresa.
**Where**: `Backend/src/feature/user/userController.ts`, `Backend/src/feature/user/userRules.ts`
**Depends on**: T2, T4
**Reuses**: `filtroPorEmpresa`, `exigirEmpresa`, `responderErro`; as regras de `userRules.ts`
**Requirement**: SCP-12, SCP-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] listar, buscar e deletar passam `filtroPorEmpresa(req.escopo)`; usuário de outra empresa responde 404 (Usuários AC1, AC2)
- [ ] criar grava o `empresaId` do escopo e ignora o do corpo; escopo sem empresa responde 403 (Usuários AC3, AC4)
- [ ] `role` que não é `admin` nem `colaborador` responde 400 (Usuários AC5); nome e role inválidos juntos listam os dois campos (Usuários AC6)
- [ ] `escopo` ou `filiaisIds` inválidos respondem 400 (Usuários AC7)
- [ ] Chamador sem `tipo: 'empresa'` com `escopo`, `filiaisIds` ou `role: 'admin'` no corpo responde 403 (Usuários AC8)
- [ ] `filiaisIds` com filial fora das filiais do chamador responde 403 (Usuários AC9)
- [ ] A regra `empresaId` do `userRules` sai; a regra `role` passa a exigir `admin` ou `colaborador`
- [ ] Os testes de `userController.test.ts` da feature anterior (empresaId vindo do corpo) mudam para o contrato novo (comportamento mudou pelo spec)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/userController.test.ts tests/unit/userService.test.ts && npx tsc --noEmit`
- [ ] Test count: ao menos 14 testes no `userController.test.ts` e os de `userService` seguem

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): scope users by empresa and validate role on create`

---

### T12: Users update without mass assignment

**What**: `atualizar` do `userController` aceita só `nome`, `telefone` e `cargo` (e `role`, `escopo`, `filiaisIds` para o escopo de empresa) e recusa o resto.
**Where**: `Backend/src/feature/user/userController.ts`
**Depends on**: T11, T5
**Reuses**: `exigirSemOperadores`, `exigirEmpresa`, `filtroPorEmpresa`; as regras de `userRules.ts`
**Requirement**: SCP-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Só `nome`, `telefone` e `cargo`: o service recebe esses campos e o filtro de empresa (Usuários AC10)
- [ ] `role`, `escopo`, `filiaisIds` válidos com chamador de empresa passam ao service (Usuários AC11)
- [ ] Os mesmos campos com chamador que não é de empresa respondem 403 sem chamar o service (Usuários AC12)
- [ ] `senhaHash`, `email`, `usuario`, `empresaId`, chave desconhecida e chave com `$` respondem 400 sem chamar o service (Usuários AC13)
- [ ] `nome` vazio ou que não é texto, `telefone` ou `cargo` que não é texto, `role` ou `escopo` inválido respondem 400; corpo vazio responde 400 (Usuários AC14, edge corpo vazio)
- [ ] `filiaisIds` com filial fora do escopo responde 403 (Usuários AC9)
- [ ] `_id` e `id` no corpo são descartados e não chegam ao service (Usuários AC15)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/userController.test.ts && npx tsc --noEmit`
- [ ] Test count: ao menos 16 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `fix(scope): stop mass assignment in PUT /api/users/:id`

---

### T13: App wiring with autenticar

**What**: `app.ts` monta o Express com `autenticar` depois das rotas públicas e antes das protegidas, inclusive `/api/branches`; `server.ts` importa o app, semeia e escuta.
**Where**: `Backend/src/app.ts`
**Depends on**: T6, T9
**Reuses**: O conteúdo atual de `Backend/src/server.ts`; `branchRouter`
**Requirement**: SCP-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Sem token, as rotas de `/api/*` respondem 401, incluindo `/api/branches`, `/api/users`, `/api/forklifts`, `/api/telemetry` e `/api/machines` (Autenticar AC9, AC12)
- [ ] Sem token, `POST /api/auth/login`, `POST /api/access-requests`, `GET /api/health` e `GET /` chegam ao handler (Autenticar AC10)
- [ ] Com token válido, uma rota protegida chega ao handler com `req.escopo` (Autenticar AC11)
- [ ] `server.ts` só importa o app, executa o seed com `--seed` e escuta na porta 3000
- [ ] Gate: `cd Backend && npx vitest run tests/unit/app.test.ts && npx tsc --noEmit`
- [ ] Test count: ao menos 9 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(scope): protect /api routes with autenticar`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2
Phase 1:  T3 ------→ T4
Phase 1:  T5
Phase 1:  T6
Phase 2:  T2 ------→ T7
Phase 2:  T4 ------→ T7
Phase 2:  T5 ------→ T7
Phase 2:  T3 ------→ T8 ------→ T9
Phase 2:  T2 ------→ T10
Phase 2:  T3 ------→ T10
Phase 2:  T5 ------→ T10
Phase 2:  T2 ------→ T11
Phase 2:  T4 ------→ T11
Phase 2:  T11 -----→ T12
Phase 2:  T5 ------→ T12
Phase 3:  T6 ------→ T13
Phase 3:  T9 ------→ T13
```

Cross-phase dependencies appear as arrows in the phase they land in and in each task's `Depends on`. Execution is strictly sequential, in the order T1 to T13, by a single worker with no sub-agents; the Verifier is dispatched by the orchestrator afterwards.

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | none | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | none | ✅ Match |
| T6 | None | none | ✅ Match |
| T7 | T2, T4, T5 | T2 → T7, T4 → T7, T5 → T7 | ✅ Match |
| T8 | T3 | T3 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T2, T3, T5 | T2 → T10, T3 → T10, T5 → T10 | ✅ Match |
| T11 | T2, T4 | T2 → T11, T4 → T11 | ✅ Match |
| T12 | T11, T5 | T11 → T12, T5 → T12 | ✅ Match |
| T13 | T6, T9 | T6 → T13, T9 → T13 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: RepositoryBase filter | Backend core | unit | unit | ✅ OK |
| T2: ServiceBase filter | Backend core | unit | unit | ✅ OK |
| T3: scope filters | Backend core | unit | unit | ✅ OK |
| T4: resolverFilial, exigirEmpresa | Backend core | unit | unit | ✅ OK |
| T5: exigirSemOperadores | Backend core | unit | unit | ✅ OK |
| T6: autenticar | Backend middleware | unit | unit | ✅ OK |
| T7: forklift controller | Backend controller / route | unit | unit | ✅ OK |
| T8: machines service | Backend service | unit | unit | ✅ OK |
| T9: machines controller | Backend controller / route | unit | unit | ✅ OK |
| T10: telemetry controller | Backend controller / route | unit | unit | ✅ OK |
| T11: users read, delete, create | Backend controller / route | unit | unit | ✅ OK |
| T12: users update | Backend controller / route | unit | unit | ✅ OK |
| T13: app wiring | Backend app wiring | unit | unit | ✅ OK |
