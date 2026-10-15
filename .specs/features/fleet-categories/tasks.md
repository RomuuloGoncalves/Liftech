# Categorias da Frota e status da máquina Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Regra do banco (global do dono):** nenhuma tarefa, teste, gate ou Verifier acessa o banco. Schemas, serviços, seed e migração são testados com models mockados; só o dono executa `seed:data` e `migrate:status`. Os gates do Backend rodam `tests/unit`, nunca `tests/integration`. Nenhum `.env` é lido.

**Commits:** com a identidade git do dono, Conventional Commits, sem trailer nem menção ao agente.

---

**Design**: `.specs/features/fleet-categories/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none (`docs/arquitetura.md` descreve a arquitetura, sem regras de teste) - strong defaults applied; `Backend/tests/unit/*` e `Frontend/src/test/**` sampled as the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema (`src/schemas`) | unit | `validateSync()` para required, regex, maxlength e padrões; `schema.indexes()` para índices; `config/conn` mockado | `Backend/tests/unit/schemas.test.ts` | `cd Backend && npx vitest run tests/unit/schemas.test.ts` |
| Backend service / domínio | unit | All branches; 1:1 to spec ACs; every listed edge case; models mockados | `Backend/tests/unit/<nome>.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend controller / route | unit | Toda rota: happy path + cada erro (400, 403, 404, 409), service mockado | `Backend/tests/unit/<nome>Controller.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Controller.test.ts` |
| Backend script (`src/scripts`) | unit | All branches; idempotência; models mockados | `Backend/tests/unit/<script>.test.ts` | `cd Backend && npx vitest run tests/unit/<script>.test.ts` |
| Frontend data / service | unit | Funções puras 1:1 aos ACs; serviços com `api` mockado (URL, método, corpo) | `Frontend/src/test/{data,services}/*.test.ts` | `cd Frontend && npx vitest run src/test/<pasta>/<nome>.test.ts` |
| Frontend component / page | unit (Testing Library) | Cada AC visível: render, interação, erro e rollback; serviços mockados | `Frontend/src/test/{components,pages}/**` | `cd Frontend && npx vitest run src/test/<caminho>` |
| Frontend i18n | unit | Paridade de chaves nos 7 idiomas e valores diferentes do pt-BR (L-009) | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && npx vitest run src/test/config/i18n.test.ts` |
| Docs | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Baseline: Frontend 1133 testes, `tsc -b` e `eslint .` limpos; Backend 372 testes unitários, `tsc --noEmit` limpo (STATE.md, AD-010).

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Depois de cada task com teste | Run Command da linha da task, depois `cd Backend && npx tsc --noEmit` ou `cd Frontend && npx tsc -b` (0 erros) |
| Full | Não usado | `tests/integration` toca o banco |
| Build | Fim de cada fase e tasks sem teste | Backend: `npx tsc --noEmit && npx vitest run tests/unit`; Frontend: `npx tsc -b && npx eslint . && npx vitest run` |

**Granularity note:** T6, T7, T8, T12 e T20 tocam controller + router (ou dois serviços) porque cada par é uma rota coesa de poucas linhas; T13 toca dataset + seed; T17 toca os 7 arquivos de idioma. O aviso do validador é aceito.

---

## Execution Plan

### Phase 1: Dados e domínio de status (Backend)

```
T1 → T2 → T3 → T4
```

### Phase 2: Rotas de máquina e telemetria (Backend)

```
T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: Categorias (Backend)

```
T11 → T12
```

### Phase 4: Seed, migração e docs (Backend)

```
T13 → T14 → T15
```

### Phase 5: Base do front (tipos, textos, selo, serviços)

```
T16 → T17 → T18 → T19 → T20
```

### Phase 6: Detalhe e Frota (Frontend)

```
T21 → T22 → T23 → T24 → T25 → T26 → T27 → T28
```

---

## Task Breakdown

### T1: Schema `category`

**What**: Schema `category` com `empresaId`, `nome` (trim, required, maxlength 40), `cor` (regex `^#[0-9a-fA-F]{6}$`), `chave` (enum das 4 chaves ou null), `statusVinculados` (default `[]`) e índice único `{ empresaId, nome }` com collation `{ locale: 'pt', strength: 2 }`.
**Where**: `Backend/src/schemas/category.ts`
**Depends on**: None
**Reuses**: `Backend/src/schemas/branch.ts`
**Requirement**: CAT-06, CAT-07, CAT-10

**Done when**:

- [x] Testes em `schemas.test.ts`: nome vazio, nome com 41 caracteres, cor `#12345` e `#GGGGGG` falham; padrão de `statusVinculados` é `[]`; o índice existe com a collation
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(category): add category schema`

---

### T2: Campos novos em forklift e telemetry

**What**: `forklift` ganha `status` (enum dos 5 códigos, default null), `statusAlteradoEm`, `categoriaId` (ref category, index) e `categoriaTravada` (default false); `telemetry` ganha `forcaImpacto: Number`.
**Where**: `Backend/src/schemas/forklift.ts`
**Depends on**: T1
**Reuses**: schema atual
**Requirement**: STS-01, IMP-01

**Done when**:

- [x] Testes em `schemas.test.ts`: status fora do enum falha; `categoriaTravada` padrão `false`; índice em `categoriaId`; `forcaImpacto` aceito na telemetria
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(forklift): add status, category and lock fields`

---

### T3: `aplicarStatus` e códigos de status

**What**: `statusService.ts` com `STATUS`, `ehStatus`, `limiteImpacto()` e `aplicarStatus(forkliftId, novo)` conforme o design.
**Where**: `Backend/src/feature/machine/statusService.ts`
**Depends on**: T2
**Reuses**: schemas `forklift`, `incident`, `category`, `branch`
**Requirement**: STS-04, STS-07, STS-08, AUT-01, AUT-02, AUT-03, IMP-07

**Done when**:

- [x] Testes: status igual ao atual não grava nada; status novo grava `status` e `statusAlteradoEm`; sair de `alerta` marca `resolvido` os pendentes da máquina; entrar em `alerta` não resolve nada; destravada com categoria ligada grava o `categoriaId` dela; destravada sem ligação mantém; travada mantém; a categoria buscada é da empresa da filial da máquina; `limiteImpacto` usa o env válido e cai em 5 com ausente ou `abc`
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(status): apply status changes with category auto-move and lock`

---

### T4: `registrarImpacto`

**What**: Função que acha a empilhadeira do dispositivo, cria o incidente pendente e chama `aplicarStatus(id, 'alerta')`.
**Where**: `Backend/src/feature/machine/statusService.ts` (modify)
**Depends on**: T3
**Reuses**: `aplicarStatus`
**Requirement**: IMP-02, IMP-03, IMP-06

**Done when**:

- [x] Testes: cria incidente com empilhadeira, operador conectado, filial, força e `dataIncidente = dataDados`; muda para `alerta` a partir de `manutencao` e `offline`; dispositivo sem empilhadeira não cria nada; segundo impacto cria outro incidente e mantém `alerta`
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(status): turn an impact reading into an alert`

---

### T5: Novo formato de `GET /api/machines`

**What**: `listarMaquinas` devolve `status` (null → `disponivel`), `categoriaId`, `categoriaTravada`, `alertaEm` (incidente pendente mais recente, só com `alerta`) e tira `status` de `dispositivoConectado`; extrai `paraMaquina` e adiciona `obterMaquina(escopo, id)` (404 fora do escopo).
**Where**: `Backend/src/feature/machine/machineService.ts`
**Depends on**: None (fase anterior concluída)
**Reuses**: mapeamento atual, `filtroPorFilial`
**Requirement**: STS-01, STS-02, STS-03

**Done when**:

- [x] Testes em `machineService.test.ts`: os 5 status passam; null vira `disponivel`; `alertaEm` só com `alerta` e é o pendente mais recente; `categoriaId` `null` quando ausente; `obterMaquina` 404 fora do escopo; ids como texto a partir de ObjectId real (L-007)
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): return status, category and lock on the machine list`

---

### T6: `PUT /api/machines/:id/status`

**What**: Rota que valida `status`, confere o escopo, chama `aplicarStatus` e responde com `obterMaquina`.
**Where**: `Backend/src/feature/machine/machineController.ts`
**Depends on**: T5
**Reuses**: `responderErro`, `exigirSemOperadores`
**Requirement**: STS-04, STS-05, STS-06

**Done when**:

- [x] Testes em `machineController.test.ts`: 200 com a máquina; 400 status inválido sem chamar o serviço; 400 id inválido; 404 fora do escopo; 400 corpo com `$`
- [x] Rota registrada em `machineRouter.ts`
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): add manual status change route`

---

### T7: `PUT /api/machines/:id/trava`

**What**: Rota que grava `categoriaTravada` sem mexer em `categoriaId`.
**Where**: `Backend/src/feature/machine/machineController.ts`
**Depends on**: T6
**Reuses**: padrão da T6
**Requirement**: AUT-04, AUT-05, AUT-06

**Done when**:

- [x] Testes: 200 ligando e desligando; `categoriaId` não muda ao desligar; 400 com `"true"` texto; 404 fora do escopo
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): add category lock route`

---

### T8: `PUT /api/machines/categoria`

**What**: `moverParaCategoria(escopo, ids, categoriaId)` no serviço e a rota, registrada antes de `/:id/...`.
**Where**: `Backend/src/feature/machine/machineService.ts`
**Depends on**: T7
**Reuses**: `filtroPorFilial`, `escopo.empresaId`
**Requirement**: MOV-01, MOV-02, MOV-03, MOV-04, MOV-05, MOV-06

**Done when**:

- [x] Testes: grava em todas e devolve as máquinas; `null` tira de categoria; uma id fora do escopo → 404 sem `updateMany`; categoria de outra empresa → 404 sem `updateMany`; lista vazia, não lista ou id inválida → 400; `status` e `categoriaTravada` não entram no `$set`
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): move machines between categories`

---

### T9: Campos protegidos no `PUT /api/forklifts/:id`

**What**: Recusar com 400 `status`, `statusAlteradoEm`, `categoriaId`, `categoriaTravada` e `sessaoIniciadaEm`.
**Where**: `Backend/src/feature/forklift/forkliftController.ts`
**Depends on**: T8
**Reuses**: `exigirSemOperadores`
**Requirement**: STS-09

**Done when**:

- [x] Testes em `forkliftController.test.ts`: cada um dos 5 campos → 400 sem chamar o serviço; corpo sem eles segue 200
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `fix(forklift): reject status and category fields on update`

---

### T10: `forcaImpacto` na telemetria

**What**: Validar `forcaImpacto` (número finito ≥ 0, opcional), gravar e chamar `registrarImpacto` quando ≥ `limiteImpacto()`.
**Where**: `Backend/src/feature/telemetry/telemetryController.ts`
**Depends on**: T9
**Reuses**: `telemetryRules.ts`, `registrarImpacto`
**Requirement**: IMP-01, IMP-04, IMP-05

**Done when**:

- [x] Testes em `telemetryController.test.ts`: igual ao limite chama `registrarImpacto`; abaixo e ausente não chamam; `-1`, `"7"`, `NaN` e `Infinity` → 400 sem gravar
- [x] Build gate do Backend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(telemetry): accept impact force and raise alerts`

---

### T11: `categoryService`

**What**: `listar`, `criar`, `atualizar` (zera `chave` ao mudar nome), `excluir` (limpa máquinas e trava antes de apagar) e `criarQuadroInicial(empresaId)`.
**Where**: `Backend/src/feature/category/categoryService.ts`
**Depends on**: None (fase anterior concluída)
**Reuses**: `branchService.ts` (`traduzirErro`), `STATUS`
**Requirement**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-08, CAT-09, CAT-10, CAT-11, CAT-13

**Done when**:

- [x] Testes: lista só da empresa na ordem de criação; cria com `statusVinculados` padrão; nome novo zera `chave`; status ligado a outra categoria → 409; 11000 → 409; status repetido ou fora da lista → 400; 404 de outra empresa; excluir faz `updateMany` com `categoriaId: null, categoriaTravada: false` antes de apagar; mudar ligação não chama `updateMany` em forklift; `criarQuadroInicial` cria as 4 com chave, cor e ligação e não cria nada se já há categoria
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(category): add category service`

---

### T12: Rotas de categorias

**What**: Controller e router de `/api/categories` (leitura de corpo, `exigirEmpresa` em POST/PUT/DELETE) e registro em `app.ts` depois de `autenticar`.
**Where**: `Backend/src/feature/category/categoryController.ts`
**Depends on**: T11
**Reuses**: `branchController.ts`
**Requirement**: CAT-05, CAT-06, CAT-07, CAT-12

**Done when**:

- [x] Testes em `categoryController.test.ts`: GET 200 para escopo filiais; POST/PUT/DELETE 403 para escopo filiais; nome vazio e com 41 caracteres → 400; cor inválida → 400; `$` no corpo → 400; 201/200 nos caminhos felizes
- [x] `app.test.ts` confirma 401 sem token em `/api/categories`
- [x] Build gate do Backend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(category): add category routes`

---

### T13: Seed com status e quadro inicial

**What**: Dataset com códigos de status e EMP-081/085/089 em `alerta`; `gerarIncidentes` com 1 pendente só nas de alerta; `sessaoIniciadaEm` só em `em_uso`; seed grava `forklift.status`, chama `criarQuadroInicial` e posiciona as máquinas.
**Where**: `Backend/src/scripts/seedData.ts`
**Depends on**: None (fase anterior concluída)
**Reuses**: `upsert`, `criarQuadroInicial`
**Requirement**: MIG-06, MIG-07

**Done when**:

- [x] Testes em `seedDataset.test.ts` e `seedData.test.ts`: só as 3 máquinas têm incidente pendente; `sessaoIniciadaEm` só nas `em_uso`; `categoriaId` de cada máquina é o da categoria ligada ao seu status; `offline` sem categoria
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(seed): seed machine status and the initial category board`

---

### T14: `yarn migrate:status`

**What**: Script `migrarStatus()` (mapa do `device.status` antigo, `offline` sem device, quadro inicial por empresa sem categorias, posicionamento) e o script no `package.json`.
**Where**: `Backend/src/scripts/migrateStatus.ts`
**Depends on**: T13
**Reuses**: `migrateToBranches.ts`, `criarQuadroInicial`
**Requirement**: MIG-01, MIG-02, MIG-03, MIG-04, MIG-05

**Done when**:

- [x] Testes em `migrateStatus.test.ts`: cada um dos 4 valores antigos vira o código certo; sem device vira `offline`; só toca empilhadeiras com `status: null`; cria quadro só para empresa sem categorias; posiciona só `categoriaId: null`; segunda execução com tudo migrado não chama nenhuma escrita; desconecta também em falha (L-008)
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(migration): add migrate:status script`

---

### T15: Documentação do backend

**What**: `docs/api.md` (rotas novas, formato de `Machine`, `forcaImpacto`, `LIMITE_IMPACTO`, `migrate:status`) e `docs/modelagem_de_dados.md` (category e campos novos).
**Where**: `docs/api.md`
**Depends on**: T14
**Reuses**: seções atuais
**Requirement**: CAT-01, STS-01, IMP-01

**Done when**:

- [x] Rotas, campos e scripts novos documentados
- [x] Build gate do Backend passa

**Tests**: none
**Gate**: build
**Commit**: `docs(api): document categories, status and impact readings`

---

### T16: Tipo `Machine` e mocks no novo formato

**What**: `MachineStatus` com os 5 códigos, `status`/`categoriaId`/`categoriaTravada`/`alertaEm` na máquina, `dispositivoConectado` sem `status`; mocks (`MACHINES`, `employeeArea`, `filterMachines`, `filterAvailableMachines`) e testes existentes migrados.
**Where**: `Frontend/src/data/machines.ts`
**Depends on**: None (fase anterior concluída)
**Reuses**: dados atuais
**Requirement**: STS-01

**Done when**:

- [x] `filterMachines` filtra por `machine.status`; só `disponivel` é ativável na área do funcionário
- [x] Testes de `data/` e dos componentes afetados atualizados sem perder contagem
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `refactor(machines): move status to the machine with plain codes`

---

### T17: Textos de status e categorias

**What**: Chaves `machines.status.{disponivel,em_uso,manutencao,alerta,offline}`, `machines.changeStatus`, `fleet.lock`, `fleet.unlock`, `fleet.editCategory`, `fleet.linkedStatus`, `fleet.statusTaken`, `fleet.saveError`, `fleet.noCategories` nos 7 idiomas.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: T16
**Reuses**: estrutura atual
**Requirement**: FRT-11

**Done when**:

- [x] Paridade de chaves passa; valores novos diferentes do pt-BR nos outros idiomas (L-009)
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(i18n): add status, lock and category texts`

---

### T18: `StatusBadge`

**What**: Componente do selo e `STATUS_TONE` para o cabeçalho do card.
**Where**: `Frontend/src/components/machines/StatusBadge.tsx`
**Depends on**: T17
**Reuses**: classes de cor de `MachineCard.module.css`
**Requirement**: FRT-08, FRT-11

**Done when**:

- [ ] Testes: os 5 códigos mostram o rótulo traduzido e uma classe distinta; render em en-US
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): add shared status badge`

---

### T19: Selo único nas telas

**What**: `MachineCard`, `MachineListCard`, `MachineDetailModal` e o filtro da Visão Geral usam `StatusBadge`/`machines.status.*`; os mapas copiados saem.
**Where**: `Frontend/src/components/machines/MachineCard.tsx`
**Depends on**: T18
**Reuses**: `StatusBadge`
**Requirement**: FRT-11, FRT-12

**Done when**:

- [ ] Testes: `offline` e `alerta` aparecem traduzidos no card, no detalhe e no card do funcionário; filtro da Visão Geral lista os 5 e filtra `alerta`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `refactor(machines): use the shared status badge everywhere`

---

### T20: Serviços de máquina e categoria

**What**: `machineService.mover/alterarStatus/travar` e `categoryService.listar/criar/atualizar/remover`.
**Where**: `Frontend/src/services/categoryService.ts`
**Depends on**: T19
**Reuses**: `branchService.ts`, `api.ts`
**Requirement**: MOV-07, STS-10, AUT-07, FRT-01

**Done when**:

- [ ] Testes com `api` mockado: método, URL e corpo de cada função
- [ ] Build gate do Frontend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(services): add category and machine update services`

---

### T21: Status e trava no detalhe

**What**: `MachineDetailModal` ganha `onChangeStatus` e `onToggleLock`: `select` com os 5 status e botão "Travar"/"Destravar".
**Where**: `Frontend/src/components/machines/MachineDetailModal.tsx`
**Depends on**: None (fase anterior concluída)
**Reuses**: `StatusBadge`
**Requirement**: STS-10, AUT-07

**Done when**:

- [ ] Testes: sem as props nada aparece; escolher status chama `onChangeStatus` com o código; o botão mostra o texto pelo estado e chama `onToggleLock` com o inverso
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): change status and lock from the machine detail`

---

### T22: Visão Geral troca status e trava

**What**: Visão Geral passa as duas props ao detalhe, chama o serviço, aplica a resposta e volta + aviso em falha.
**Where**: `Frontend/src/pages/VisaoGeralPage.tsx`
**Depends on**: T21
**Reuses**: `machineService`, `useToast`
**Requirement**: STS-10, MOV-08

**Done when**:

- [ ] Testes: troca de status atualiza o selo do card; falha volta o selo e mostra o aviso
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): wire status and lock changes on Visão Geral`

---

### T23: `FleetCard` pelo status

**What**: Destaque e cor do cabeçalho pelo `machine.status`, selo `StatusBadge` e botão de cadeado (`onToggleLock`).
**Where**: `Frontend/src/components/fleet/FleetCard.tsx`
**Depends on**: T22
**Reuses**: `StatusBadge`, `STATUS_TONE`, `formatAlertDate`
**Requirement**: FRT-08, FRT-09, FRT-10, AUT-07

**Done when**:

- [ ] Testes: máquina `disponivel` com `kind` de acidentes mostra selo "Disponível" e horas semanais; cada status mostra o destaque do spec; `alerta` usa `alertaEm`; cadeado visível só com trava ligada e clique chama `onToggleLock`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): drive the fleet card by machine status`

---

### T24: Quadro montado da API

**What**: `data/fleet.ts` troca `initialBoard` por `montarQuadro(categorias, maquinas)` (máquina com `categoriaId` inexistente vira sem categoria) e adapta `unassignedMachines`.
**Where**: `Frontend/src/data/fleet.ts`
**Depends on**: T23
**Reuses**: `moveMachine`, `removeMachine`, `addMachines`
**Requirement**: FRT-04

**Done when**:

- [ ] Testes: linhas na ordem das categorias; máquina com categoria apagada fica sem categoria; contadores só das máquinas recebidas
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `refactor(fleet): build the board from categories and machines`

---

### T25: Frota lendo a API

**What**: `FrotaPage` busca categorias e máquinas da filial ativa com skeleton, erro e "Tentar novamente", descartando resposta antiga; nome por `chave` ou `nome`.
**Where**: `Frontend/src/pages/FrotaPage.tsx`
**Depends on**: T24
**Reuses**: efeito da `VisaoGeralPage`, `useActiveBranch`
**Requirement**: FRT-01, FRT-02, FRT-03, FRT-05

**Done when**:

- [ ] Testes: skeleton até as duas responderem; troca de filial busca de novo e ignora a resposta antiga; falha de qualquer busca mostra erro e tentar de novo refaz; categoria com `chave` mostra texto traduzido, sem `chave` mostra `nome`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): load categories and machines from the API`

---

### T26: Mover, travar e status otimistas na Frota

**What**: Arrastar, "Mover para", "Remover da categoria", "Adicionar máquinas", trava e status chamam a API com atualização otimista e rollback + aviso em falha; soltar na mesma linha não chama.
**Where**: `Frontend/src/pages/FrotaPage.tsx` (modify)
**Depends on**: T25
**Reuses**: `machineService`, `useToast`
**Requirement**: MOV-07, MOV-08, AUT-07, STS-10

**Done when**:

- [ ] Testes: cada ação chama o serviço com os ids certos; a tela muda antes da resposta; falha volta ao estado anterior e mostra `fleet.saveError`; soltar na mesma linha não chama
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): persist moves, locks and status changes`

---

### T27: Formulário de categoria com edição e status ligados

**What**: `CategoryFormModal` em modo criar/editar com checkboxes dos 5 status, desabilitando os ligados a outra categoria e mostrando erro do servidor sem fechar.
**Where**: `Frontend/src/components/fleet/CategoryFormModal.tsx`
**Depends on**: T26
**Reuses**: validação atual (`categoryNameError`, `isHexColor`)
**Requirement**: CAT-02, CAT-03, CAT-09

**Done when**:

- [ ] Testes: edição vem preenchida; status de outra categoria fica desabilitado com `fleet.statusTaken`; envio devolve nome, cor e status marcados; erro mantém o formulário aberto
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): edit categories and their linked status`

---

### T28: Gerenciar categorias na Frota por escopo

**What**: `FrotaPage` e `FleetRow` criam, editam e excluem pela API só com `escopo: 'empresa'`; escopo filiais não vê esses controles; sem categorias mostra o botão (empresa) ou `fleet.noCategories` (filiais); filtro excluído volta a "Todas".
**Where**: `Frontend/src/pages/FrotaPage.tsx` (modify)
**Depends on**: T27
**Reuses**: `categoryService`, `ConfirmDialog`, sessão do `authService`
**Requirement**: FRT-06, FRT-07, CAT-04, CAT-05

**Done when**:

- [ ] Testes: escopo empresa vê criar, editar e excluir; escopo filiais não vê e mantém adicionar, arrastar, trava e status; excluir tira as máquinas da linha; estados vazios dos dois escopos
- [ ] Build gate do Frontend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(fleet): manage company categories by scope`

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1, T2 | 1 schema cada | ✅ |
| T3, T4 | 1 função cada | ✅ |
| T5 | 1 serviço | ✅ |
| T6, T7, T8, T12 | 1 rota (controller + router) | ⚠️ coeso |
| T9, T10 | 1 handler | ✅ |
| T11 | 1 serviço | ✅ |
| T13 | dataset + seed | ⚠️ coeso |
| T14, T15 | 1 script / docs | ✅ |
| T16 | tipo + mocks que dependem dele | ⚠️ coeso (não compila separado) |
| T17 | 7 arquivos de idioma | ⚠️ coeso |
| T18–T28 | 1 componente, serviço ou página cada | ✅ |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da fase 1 | ✅ |
| T2 | T1 | T1 → T2 | ✅ |
| T3 | T2 | T2 → T3 | ✅ |
| T4 | T3 | T3 → T4 | ✅ |
| T5 | None | início da fase 2 (T4 na fase anterior) | ✅ |
| T6 | T5 | T5 → T6 | ✅ |
| T7 | T6 | T6 → T7 | ✅ |
| T8 | T7 | T7 → T8 | ✅ |
| T9 | T8 | T8 → T9 | ✅ |
| T10 | T9 | T9 → T10 | ✅ |
| T11 | None | início da fase 3 | ✅ |
| T12 | T11 | T11 → T12 | ✅ |
| T13 | None | início da fase 4 | ✅ |
| T14 | T13 | T13 → T14 | ✅ |
| T15 | T14 | T14 → T15 | ✅ |
| T16 | None | início da fase 5 | ✅ |
| T17 | T16 | T16 → T17 | ✅ |
| T18 | T17 | T17 → T18 | ✅ |
| T19 | T18 | T18 → T19 | ✅ |
| T20 | T19 | T19 → T20 | ✅ |
| T21 | None | início da fase 6 | ✅ |
| T22–T28 | anterior | cadeia T21 → … → T28 | ✅ |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1, T2 | Backend schema | unit | unit | ✅ |
| T3, T4, T5, T11 | Backend service | unit | unit | ✅ |
| T6–T10, T12 | Backend controller | unit | unit | ✅ |
| T13, T14 | Backend script | unit | unit | ✅ |
| T15 | Docs | none | none | ✅ |
| T16, T24 | Frontend data | unit | unit | ✅ |
| T17 | Frontend i18n | unit | unit | ✅ |
| T18, T19, T21, T23, T27 | Frontend component | unit | unit | ✅ |
| T20 | Frontend service | unit | unit | ✅ |
| T22, T25, T26, T28 | Frontend page | unit | unit | ✅ |

## Requirement Coverage

64 requisitos, todos mapeados: STS-01..10 (T3, T5, T6, T9, T16, T21, T22, T26), IMP-01..07 (T2, T3, T4, T10), CAT-01..13 (T1, T11, T12, T27, T28), AUT-01..07 (T3, T7, T21, T23, T26), MOV-01..08 (T8, T22, T26), FRT-01..12 (T18, T19, T23, T24, T25, T28), MIG-01..07 (T13, T14).
