# Empresas e filiais: modelo, seeds, migração e CRUD de filiais Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Regra do banco (global do dono):** nenhuma tarefa, teste, gate ou Verifier acessa o banco. Seeds e migração são escritos e testados com models mockados, e só o dono os executa. Os gates do Backend rodam `tests/unit/<arquivo>` explícito, nunca `yarn test` (que inclui `tests/integration`, que conecta ao Mongo). Nenhum `.env` é lido.

---

**Spec**: `.specs/features/branches-model/spec.md` (sem `design.md`: a abordagem está nas Assumptions do spec)
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none (`docs/arquitetura.md` descreve a arquitetura, sem regras de teste) - strong defaults applied; `Backend/tests/unit/*` sampled as the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema (`src/schemas`) | unit | `validateSync()` para `required`, enum e padrões, e `schema.indexes()` para os índices; `config/conn` mockado (só `mongoose`, sem conectar) | `Backend/tests/unit/schemas.test.ts` | `cd Backend && npx vitest run tests/unit/schemas.test.ts` |
| Backend model / repository | unit | Campos novos em `obterDados()` e na conversão do documento; padrões quando o campo falta | `Backend/tests/unit/<nome>Model.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Model.test.ts` |
| Backend service / core | unit | All branches; 1:1 to spec ACs; every listed edge case; models mockados | `Backend/tests/unit/<nome>.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend controller / route | unit | Happy path + each error path, with the service mocked | `Backend/tests/unit/<nome>Controller.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Controller.test.ts` |
| Backend script (`src/scripts`) | unit | All branches; models mockados; no DB access | `Backend/tests/unit/seed*.test.ts`, `migrateToBranches.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Docs | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Baseline before this feature: Backend `tests/unit` = 93 passed in 11 files; `npx tsc --noEmit` = 0 errors.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | The row's Run Command above for the task's test file, then `cd Backend && npx tsc --noEmit` (0 errors) |
| Full | After tasks with e2e/integration tests | Not used: the tests in `Backend/tests/integration` touch the database |
| Build | After phase completion or tasks without tests | `cd Backend && npx tsc --noEmit` (0 errors) and `cd Backend && npx vitest run tests/unit` (all pass) |

**Granularity note:** T4 a T8 e T13 tocam mais de um arquivo porque cada um é uma unidade coesa de poucas linhas (os quatro schemas de recurso; model + repository; regras + controller; controller + router). O validador avisa; o aviso é aceito.

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Schemas

```
T1 → T2 → T3
T2 → T4
```

### Phase 2: User and forklift API carry the new fields

```
T3 → T5 → T6
T4 → T7 → T8
```

### Phase 3: Escopo and login

```
T9
T3 → T10 → T11
```

### Phase 4: Branch CRUD

```
T9 → T12 → T13
```

### Phase 5: Seeds and migration

```
T14 → T15 → T16 → T17
T15 → T18
```

### Phase 6: Docs

```
T18 → T19
```

---

## Task Breakdown

### T1: Company schema

**What**: Schema `company` com `nome` obrigatório e único.
**Where**: `Backend/src/schemas/company.ts`
**Depends on**: None
**Reuses**: `Backend/src/schemas/operator.ts` (estilo do schema e do model)
**Requirement**: BRM-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `company` existe com `nome` obrigatório (Modelo AC1)
- [x] `schema.indexes()` contém índice único em `nome` (Modelo AC1)
- [x] Gate: `cd Backend && npx vitest run tests/unit/schemas.test.ts && npx tsc --noEmit`
- [x] Test count: 2 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): add company schema`

---

### T2: Branch schema

**What**: Schema `branch` com `nome`, `empresaId` (ref `company`) obrigatórios, `matriz` booleano padrão `false`, índice único `empresaId`+`nome` e índice único parcial `empresaId` onde `matriz: true`.
**Where**: `Backend/src/schemas/branch.ts`
**Depends on**: T1
**Reuses**: `Backend/src/schemas/forklift.ts` (campo ObjectId com `ref`)
**Requirement**: BRM-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `nome` e `empresaId` obrigatórios (Modelo AC2)
- [x] `matriz` vale `false` quando omitido (Modelo AC2)
- [x] Índice único em `{ empresaId: 1, nome: 1 }` (Modelo AC3)
- [x] Índice único em `{ empresaId: 1 }` com `partialFilterExpression: { matriz: true }` (Modelo AC4)
- [x] Gate: `cd Backend && npx vitest run tests/unit/schemas.test.ts && npx tsc --noEmit`
- [x] Test count: 4 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): add branch schema`

---

### T3: User scope fields in the schema

**What**: `empresaId` obrigatório, `escopo` (enum `empresa`/`filiais`, padrão `filiais`) e `filiaisIds` (lista de ObjectId, padrão vazia) no schema `user`; o teste de integração do schema ganha `empresaId`.
**Where**: `Backend/src/schemas/user.ts`
**Depends on**: T2
**Reuses**: `Backend/src/schemas/forklift.ts` (ObjectId com `ref`)
**Requirement**: BRM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `validateSync()` sem `empresaId` falha em `empresaId` (Modelo AC5)
- [x] Sem `escopo` e `filiaisIds`, valem `'filiais'` e `[]` (Modelo AC6)
- [x] `escopo: 'todos'` é rejeitado e `'empresa'` é aceito (Modelo AC7)
- [x] `Backend/tests/integration/feature/user/user.test.ts` cria o usuário com `empresaId` (não executado aqui)
- [x] Gate: `cd Backend && npx vitest run tests/unit/schemas.test.ts && npx tsc --noEmit`
- [x] Test count: 4 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): add scope fields to the user schema`

---

### T4: filialId in the resource schemas

**What**: `filialId` obrigatório (ObjectId, ref `branch`) em `forklift`, `device`, `operator` e `incident`; os 4 testes de integração do schema ganham o campo.
**Where**: `Backend/src/schemas/forklift.ts`, `Backend/src/schemas/device.ts`, `Backend/src/schemas/operator.ts`, `Backend/src/schemas/incident.ts`
**Depends on**: T2
**Reuses**: `Backend/src/schemas/forklift.ts` (ObjectId com `ref`)
**Requirement**: BRM-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `validateSync()` sem `filialId` falha em `filialId` nos 4 schemas (Modelo AC8)
- [x] Os testes de integração de forklift, device, operator e incident criam o documento com `filialId` (não executados aqui)
- [x] Gate: `cd Backend && npx vitest run tests/unit/schemas.test.ts && npx tsc --noEmit`
- [x] Test count: 4 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): require filialId in forklift, device, operator and incident`

---

### T5: User model and repository carry the scope fields

**What**: `userModel` guarda `empresaId`, `escopo` e `filiaisIds` (4º parâmetro opcional `acesso`) e os devolve em `obterDados()`; `UserRepository` os lê do documento.
**Where**: `Backend/src/models/userModel.ts`, `Backend/src/feature/user/userRepository.ts`
**Depends on**: T3
**Reuses**: `Backend/src/models/forkliftModel.ts` (parâmetros opcionais), `Backend/src/feature/user/userRepository.ts` (`converterParaModelo`)
**Requirement**: BRM-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `obterDados()` inclui `empresaId`, `escopo` e `filiaisIds` (Modelo AC9)
- [x] O repository converte o documento com ids em texto; documento sem os campos vira `filiaisIds: []` (Modelo AC9)
- [x] Gate: `cd Backend && npx vitest run tests/unit/userModel.test.ts && npx tsc --noEmit`
- [x] Test count: 3 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): expose scope fields on the user model`

---

### T6: POST /api/users accepts the scope fields

**What**: `userRules` valida `empresaId`, `escopo` e `filiaisIds`; `criar` do `userController` os repassa ao model.
**Where**: `Backend/src/feature/user/userController.ts`, `Backend/src/feature/user/userRules.ts`
**Depends on**: T5
**Reuses**: `Backend/src/feature/forklift/forkliftRules.ts` (regra de ObjectId), `Backend/src/feature/auth/authController.ts` (`check` com um objeto por campo)
**Requirement**: BRM-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 201 e o service recebe um model com `empresaId`, `escopo` e `filiaisIds` do corpo (Modelo AC10)
- [x] Sem `escopo` e `filiaisIds` no corpo, o model fica sem `escopo` e com `filiaisIds` vazio (Modelo AC10)
- [x] 400 com `empresaId` ausente, `empresaId` inválido, `escopo` fora da lista e `filiaisIds` com item inválido (Modelo AC11)
- [x] Gate: `cd Backend && npx vitest run tests/unit/userController.test.ts && npx tsc --noEmit`
- [x] Test count: 6 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): accept scope fields when creating a user`

---

### T7: Forklift model and repository carry filialId

**What**: `forkliftModel` guarda `filialId` (último parâmetro opcional) e o devolve em `obterDados()`; `ForkliftRepository` o lê do documento.
**Where**: `Backend/src/models/forkliftModel.ts`, `Backend/src/feature/forklift/forkliftRepository.ts`
**Depends on**: T4
**Reuses**: `Backend/src/models/forkliftModel.ts` (parâmetros opcionais), `Backend/src/feature/forklift/forkliftRepository.ts` (`converterParaModelo`)
**Requirement**: BRM-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `obterDados()` inclui `filialId` (Modelo AC12)
- [x] O repository converte `filialId` do documento em texto (Modelo AC12)
- [x] Gate: `cd Backend && npx vitest run tests/unit/forkliftModel.test.ts tests/unit/forkliftService.test.ts && npx tsc --noEmit`
- [x] Test count: 2 testes novos passam e os 9 de `forkliftService.test.ts` seguem passando

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): expose filialId on the forklift model`

---

### T8: POST /api/forklifts requires filialId

**What**: `forkliftRules` valida `filialId` obrigatório e ObjectId; `criar` do `forkliftController` o repassa ao model; o teste `forkliftController.test.ts` de integração (todo com mocks) ganha `filialId` nos corpos de `criar`.
**Where**: `Backend/src/feature/forklift/forkliftController.ts`, `Backend/src/feature/forklift/forkliftRules.ts`
**Depends on**: T7
**Reuses**: `Backend/src/feature/forklift/forkliftRules.ts` (`isValidObjectId`)
**Requirement**: BRM-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 201 e o service recebe um model com o `filialId` do corpo (Modelo AC13)
- [x] 400 com `filialId` ausente e com `filialId` que não é ObjectId (Modelo AC14)
- [x] Os erros de `id` inválido seguem no mesmo formato
- [x] Em `tests/integration/forkliftController.test.ts` (não executado aqui) os corpos de `criar` que esperam 201, 400 de `id` e 409 levam `filialId` válido
- [x] Gate: `cd Backend && npx vitest run tests/unit/forkliftController.test.ts && npx tsc --noEmit`
- [x] Test count: 4 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): require filialId when creating a forklift`

---

### T9: ErroHttp and responderErro

**What**: Classe `ErroHttp` (status + mensagem) e `responderErro(res, error)` que usa o status do `ErroHttp` ou 500.
**Where**: `Backend/src/utils/responseHandler.ts`
**Depends on**: None
**Reuses**: `respostaErro` no mesmo arquivo
**Requirement**: BRM-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `responderErro` responde com `error.status` e `{ error: mensagem }` para `ErroHttp` (CRUD AC2, AC13)
- [x] `responderErro` responde 500 com `{ error: mensagem }` para qualquer outro erro (CRUD AC13)
- [x] Gate: `cd Backend && npx vitest run tests/unit/responseHandler.test.ts && npx tsc --noEmit`
- [x] Test count: 2 testes novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(api): add ErroHttp and responderErro`

---

### T10: Escopo of the user

**What**: Tipo `Escopo`, `carregarEscopo(usuario)` e a propriedade `req.escopo` no `Request` do Express.
**Where**: `Backend/src/core/escopo.ts`
**Depends on**: T3
**Reuses**: `Backend/src/schemas/branch.ts`
**Requirement**: BRM-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `escopo: 'empresa'` devolve `tipo: 'empresa'` e todas as filiais da empresa (Escopo AC1)
- [x] `escopo: 'filiais'` devolve só as filiais da empresa com id em `filiaisIds` (Escopo AC2)
- [x] A consulta usa `empresaId` do usuário, então filial de outra empresa ou inexistente não aparece (Escopo AC4, edge filial apagada)
- [x] `filiaisIds` vazio devolve `filiais` vazio (Escopo AC3)
- [x] Cada filial vem como `{ _id, nome, matriz }` com `_id` em texto, matriz primeiro e depois por `nome` (Escopo AC5)
- [x] Sem `empresaId`: `tipo: 'filiais'`, `filiais: []` e nenhuma consulta (Escopo AC6)
- [x] `escopo` indefinido com `empresaId` vira `'filiais'` (edge)
- [x] Gate: `cd Backend && npx vitest run tests/unit/escopo.test.ts && npx tsc --noEmit`
- [x] Test count: ao menos 7 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): add escopo loader`

---

### T11: Login returns empresa, escopo and filiais

**What**: `login` do `authService` inclui `empresa`, `escopo` e `filiais` em `user`; o JWT segue só com `sub` e `role`.
**Where**: `Backend/src/feature/auth/authService.ts`
**Depends on**: T10
**Reuses**: `carregarEscopo` de `Backend/src/core/escopo.ts`, `Backend/src/schemas/company.ts`
**Requirement**: BRM-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `user` inclui `empresa: { _id, nome }`, `escopo` e `filiais` além de `_id`, `nome` e `role` (Escopo AC7)
- [x] Sem `empresaId`: `empresa: null`, `escopo: 'filiais'`, `filiais: []` (Escopo AC8)
- [x] O payload do JWT tem `sub` e `role` e nenhum dado de escopo (Escopo AC9)
- [x] Os testes existentes de `authService.test.ts` passam com os models de empresa e filial mockados e `user` com os campos novos (comportamento mudou pelo spec)
- [x] Gate: `cd Backend && npx vitest run tests/unit/authService.test.ts tests/unit/authController.test.ts && npx tsc --noEmit`
- [x] Test count: os 7 testes existentes de `authService` mais 4 novos passam; os 9 de `authController` seguem passando (os models de empresa e filial ficam mockados lá também)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): return empresa, escopo and filiais on login`

---

### T12: Branch service

**What**: `criar`, `renomear` e `excluir` filial na empresa do chamador, com os erros 404 e 409 como `ErroHttp`.
**Where**: `Backend/src/feature/branch/branchService.ts`
**Depends on**: T9
**Reuses**: `Backend/src/feature/machine/machineService.ts` (service que usa o schema direto), `Backend/src/core/escopo.ts`
**Requirement**: BRM-09, BRM-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `criar` grava `{ nome, empresaId }` do chamador com `matriz: false` e devolve `{ _id, nome, matriz }` (CRUD AC3, AC4)
- [x] Nome repetido na empresa (erro 11000 do Mongo) vira `ErroHttp` 409 em `criar` e `renomear` (CRUD AC6)
- [x] `renomear` atualiza só `nome` na filial da empresa e devolve `{ _id, nome, matriz }`; sem filial, `ErroHttp` 404 (CRUD AC7, AC9, edge matriz no PUT)
- [x] `excluir` apaga a filial sem vínculos e devolve `{ _id, message }` (CRUD AC10)
- [x] `excluir` de filial inexistente ou de outra empresa lança 404; da matriz lança 409; com forklift, device, operator ou incident lança 409, sem apagar (CRUD AC9, AC11, AC12)
- [x] Outros erros do banco se propagam sem virar `ErroHttp` (CRUD AC13)
- [x] Gate: `cd Backend && npx vitest run tests/unit/branchService.test.ts && npx tsc --noEmit`
- [x] Test count: ao menos 12 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): add branch service`

---

### T13: Branch controller and router

**What**: Handlers `listar`, `criar`, `atualizar` e `deletar` e o `branchRouter` com `GET /`, `POST /`, `PUT /:id` e `DELETE /:id`.
**Where**: `Backend/src/feature/branch/branchController.ts`, `Backend/src/feature/branch/branchRouter.ts`
**Depends on**: T12
**Reuses**: `Backend/src/feature/machine/machineController.ts` and `machineRouter.ts`; `respostaSucesso`, `responderErro`
**Requirement**: BRM-08, BRM-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `listar` responde 200 com `req.escopo.filiais` (CRUD AC1)
- [ ] `criar`, `atualizar` e `deletar` respondem 403 sem `tipo: 'empresa'`, antes de validar corpo e id e sem chamar o service (CRUD AC2)
- [ ] `criar` e `atualizar` respondem 400 com `nome` ausente, vazio, só espaços ou que não é texto, e passam o `nome` sem espaços nas pontas ao service (CRUD AC5, edges nome)
- [ ] `atualizar` e `deletar` respondem 400 com id inválido (CRUD AC8)
- [ ] Sucesso: 201 em `criar`, 200 em `atualizar` e `deletar`, com o corpo do service (CRUD AC3, AC7, AC10)
- [ ] `ErroHttp` do service vira o status dele (404, 409) e erro comum vira 500 com `{ error }` (CRUD AC6, AC9, AC11, AC12, AC13)
- [ ] `matriz` do corpo nunca chega ao service (CRUD AC4)
- [ ] `branchRouter` expõe GET `/`, POST `/`, PUT `/:id` e DELETE `/:id` ligados aos handlers
- [ ] Gate: `cd Backend && npx vitest run tests/unit/branchController.test.ts && npx tsc --noEmit`
- [ ] Test count: ao menos 16 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): add branch controller and router`

---

### T14: Seed dataset for empresa and filiais

**What**: Constantes da empresa e das filiais, mapa setor para filial, helpers de filial por empilhadeira, dispositivo e operador, e a tabela de filiais dos 11 colaboradores.
**Where**: `Backend/src/scripts/seedDataset.ts`
**Depends on**: None
**Reuses**: `EMPILHADEIRAS`, `OPERADORES` e `COLABORADORES` do mesmo arquivo (sem mudar o formato deles)
**Requirement**: BRM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `EMPRESA_NOME` é `Liftech Logística`, `MATRIZ_NOME` é `Matriz` e `FILIAIS_EXTRAS` são `Unidade Centro` e `Unidade Norte` (Seeds AC1)
- [ ] Cada empilhadeira cai na filial do seu setor: Expedição na Matriz, Recebimento em Unidade Centro, Armazenagem em Unidade Norte (Seeds AC2)
- [ ] Cada dispositivo herda a filial da sua empilhadeira (Seeds AC3)
- [ ] Cada operador herda a filial da primeira empilhadeira que o cita, ou a Matriz se nenhuma (Seeds AC4)
- [ ] Os 11 colaboradores têm entrada na tabela, com nomes de filial existentes, e ao menos um tem duas filiais (Seeds AC6)
- [ ] Os testes existentes de `seedDataset.test.ts` seguem passando sem mudança
- [ ] Nenhuma senha literal (Seeds AC12)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/seedDataset.test.ts && npx tsc --noEmit`
- [ ] Test count: os 12 testes existentes mais ao menos 6 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(seed): add empresa and filial data to the seed dataset`

---

### T15: Seed empresa helper

**What**: `garantirEmpresa(extras)` faz upsert da empresa padrão, da matriz e das filiais extras e devolve os ids; o `upsert` do `seedData` passa a viver nesse arquivo.
**Where**: `Backend/src/scripts/seedEmpresa.ts`
**Depends on**: T14
**Reuses**: `upsert` hoje em `Backend/src/scripts/seedData.ts`
**Requirement**: BRM-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Upsert da empresa por `{ nome }` e de cada filial por `{ empresaId, nome }`, com `matriz: true` só na matriz (Seeds AC1, AC10)
- [ ] Sem `extras` cria só a matriz; com `extras` cria a matriz e elas (Seeds AC9)
- [ ] Devolve `empresaId` e um mapa nome para `filialId` (Seeds AC1)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/seedEmpresa.test.ts && npx tsc --noEmit`
- [ ] Test count: ao menos 4 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(seed): add seed helper for empresa and filiais`

---

### T16: Seed admin gets empresa and escopo

**What**: `seedAdmin(empresaId?)` cria o admin com `empresaId` e `escopo: 'empresa'`, atualiza esses dois campos se o admin já existe, e garante a empresa padrão quando não recebe `empresaId`.
**Where**: `Backend/src/scripts/seedAdmin.ts`
**Depends on**: T15
**Reuses**: `garantirEmpresa` de `Backend/src/scripts/seedEmpresa.ts`
**Requirement**: BRM-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com `empresaId`, o admin novo nasce com `empresaId` e `escopo: 'empresa'` (Seeds AC7)
- [ ] Admin existente recebe só `empresaId` e `escopo: 'empresa'` por `updateOne` e não é recriado (Seeds AC8)
- [ ] Sem `empresaId`, chama `garantirEmpresa()` e usa o id devolvido (Seeds AC9)
- [ ] Sem as variáveis de ambiente, nada é consultado nem criado (comportamento atual)
- [ ] Os testes existentes de `seedAdmin.test.ts` passam com os models `company` e `branch` mockados (o mock de `User` ganha `updateOne`)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/seedAdmin.test.ts && npx tsc --noEmit`
- [ ] Test count: os 6 testes existentes mais ao menos 3 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(seed): give the seeded admin empresa scope`

---

### T17: Seed data distributes empresa and filiais

**What**: `seedData()` cria empresa e filiais, passa `empresaId` ao `seedAdmin`, grava `filialId` em operadores, dispositivos, empilhadeiras e incidentes, e `empresaId`, `escopo` e `filiaisIds` nos colaboradores.
**Where**: `Backend/src/scripts/seedData.ts`
**Depends on**: T16
**Reuses**: `garantirEmpresa` e `upsert` de `Backend/src/scripts/seedEmpresa.ts`; helpers de `seedDataset.ts`
**Requirement**: BRM-11, BRM-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Empresa por `{ nome }` e 3 filiais por `{ empresaId, nome }`, só a matriz com `matriz: true` (Seeds AC1)
- [ ] Empilhadeira, dispositivo, operador e incidente levam o `filialId` da regra do dataset (Seeds AC2, AC3, AC4, AC5)
- [ ] Cada colaborador leva `empresaId`, `escopo: 'filiais'` e `filiaisIds` da tabela, e `PauloNunes` tem duas filiais (Seeds AC6)
- [ ] O `seedAdmin` é chamado uma vez com o `empresaId` (Seeds AC7)
- [ ] Duas execuções usam as mesmas chaves, sem repetir nenhuma (Seeds AC10)
- [ ] A contagem e o log incluem empresas e filiais (Seeds AC11)
- [ ] Nenhuma senha literal (Seeds AC12)
- [ ] Os testes existentes de `seedData.test.ts` passam com `Company` e `Branch` mockados; só a asserção de contagem total ganha `empresas` e `filiais` (comportamento mudou pelo spec)
- [ ] Gate: `cd Backend && npx vitest run tests/unit/seedData.test.ts && npx tsc --noEmit`
- [ ] Test count: os 12 testes existentes mais ao menos 8 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(seed): seed empresa and filiais and distribute data`

---

### T18: Migration script

**What**: `migrarParaFiliais()` garante a empresa padrão e a matriz, e atribui `empresaId`/`escopo`/`filiaisIds` aos usuários e `filialId` aos recursos que não os têm; script `migrate:branches` no `package.json`.
**Where**: `Backend/src/scripts/migrateToBranches.ts`
**Depends on**: T15
**Reuses**: `garantirEmpresa` de `Backend/src/scripts/seedEmpresa.ts`; guarda de entrada de `Backend/src/scripts/seedData.ts`
**Requirement**: BRM-13, BRM-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Chama `garantirEmpresa()` sem extras (Migração AC1)
- [ ] Admins com `empresaId: null` recebem `empresaId` e `escopo: 'empresa'` (Migração AC2)
- [ ] Os demais usuários com `empresaId: null` recebem `empresaId`, `escopo: 'filiais'` e `filiaisIds: [<matriz>]` (Migração AC3)
- [ ] Forklift, device, operator e incident com `filialId: null` recebem o `filialId` da matriz (Migração AC4)
- [ ] Todos os filtros miram só o campo ausente ou nulo (Migração AC5, AC6, edge usuário já migrado)
- [ ] Registra e devolve a contagem de documentos alterados por collection (Migração AC7)
- [ ] Fecha a conexão com sucesso e com erro, e o erro continua subindo (Migração AC8)
- [ ] `package.json` tem `"migrate:branches": "tsx src/scripts/migrateToBranches.ts"`
- [ ] Gate: `cd Backend && npx vitest run tests/unit/migrateToBranches.test.ts && npx tsc --noEmit`
- [ ] Test count: ao menos 8 testes passam, todos com os models mockados

**Tests**: unit
**Gate**: quick

**Commit**: `feat(migration): add migrate:branches script`

---

### T19: Data model docs

**What**: `docs/modelagem_de_dados.md` descreve `Company`, `Branch`, os campos novos do `User`, o `filialId` dos recursos e a migração.
**Where**: `docs/modelagem_de_dados.md`
**Depends on**: T18
**Reuses**: Estrutura de entidades do mesmo arquivo
**Requirement**: BRM-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Entidades `Company` e `Branch` com os campos e a regra de uma matriz por empresa (Docs AC1, AC2)
- [ ] `User` com `empresaId`, `escopo` e `filiaisIds`; `Forklift`, `Device`, `Operator` e `Incident` com `filialId` (Docs AC1)
- [ ] Seção curta sobre `yarn migrate:branches` (Docs AC2)
- [ ] Gate: build (`cd Backend && npx tsc --noEmit && npx vitest run tests/unit`)

**Tests**: none
**Gate**: build

**Commit**: `docs(branches): document company, branch and scope fields`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Phase 1:  T1 ------→ T2 ------→ T3
Phase 1:  T2 ------→ T4
Phase 2:  T3 ------→ T5 ------→ T6
Phase 2:  T4 ------→ T7 ------→ T8
Phase 3:  T9
Phase 3:  T3 ------→ T10 -----→ T11
Phase 4:  T9 ------→ T12 -----→ T13
Phase 5:  T14 -----→ T15 -----→ T16 -----→ T17
Phase 5:  T15 -----→ T18
Phase 6:  T18 -----→ T19
```

Cross-phase dependencies (T3 → T5, T4 → T7, T3 → T10, T9 → T12, T18 → T19) appear as arrows in the phase they land in and in each task's `Depends on`. Execution is strictly sequential, in the order T1 to T19, by a single worker with no sub-agents; the Verifier is dispatched by the orchestrator afterwards.

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T2 | T2 → T4 | ✅ Match |
| T5 | T3 (earlier phase) | T3 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T4 (earlier phase) | T4 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | None | none | ✅ Match |
| T10 | T3 (earlier phase) | T3 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T9 (earlier phase) | T9 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | None | none | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T15 | T15 → T18 | ✅ Match |
| T19 | T18 (earlier phase) | T18 → T19 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: company schema | Backend schema | unit | unit | ✅ OK |
| T2: branch schema | Backend schema | unit | unit | ✅ OK |
| T3: user schema | Backend schema | unit | unit | ✅ OK |
| T4: resource schemas | Backend schema | unit | unit | ✅ OK |
| T5: user model + repository | Backend model / repository | unit | unit | ✅ OK |
| T6: user rules + controller | Backend controller / route | unit | unit | ✅ OK |
| T7: forklift model + repository | Backend model / repository | unit | unit | ✅ OK |
| T8: forklift rules + controller | Backend controller / route | unit | unit | ✅ OK |
| T9: ErroHttp | Backend service / core | unit | unit | ✅ OK |
| T10: escopo | Backend service / core | unit | unit | ✅ OK |
| T11: login | Backend service / core | unit | unit | ✅ OK |
| T12: branch service | Backend service / core | unit | unit | ✅ OK |
| T13: branch controller + router | Backend controller / route | unit | unit | ✅ OK |
| T14: dataset | Backend script | unit | unit | ✅ OK |
| T15: seed helper | Backend script | unit | unit | ✅ OK |
| T16: seedAdmin | Backend script | unit | unit | ✅ OK |
| T17: seedData | Backend script | unit | unit | ✅ OK |
| T18: migration | Backend script | unit | unit | ✅ OK |
| T19: docs | Docs | none | none | ✅ OK |
