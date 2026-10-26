# Remover mocks de máquinas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

Regras do projeto: nunca acessar banco de dados (testes do Backend mockam os models, como `tests/unit/incidentService.test.ts`); commits só locais; sem push.

---

**Spec**: `.specs/features/remover-mocks/spec.md`
**Design**: `.specs/features/remover-mocks/design.md`
**Status**: Draft (Fases 1-4 executáveis já com D1 = A; Fase 5 só se o usuário escolher D1 = B)

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `Frontend/package.json` (`vitest run`), `Backend/package.json` (`vitest run tests/unit`); sem threshold de cobertura configurado.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Frontend page/component | unit (vitest + Testing Library, serviços mockados) | ACs RM-01..RM-04 / RM-13 + edge cases de falha da API | `Frontend/src/test/{pages,components}/**/*.test.tsx` | `cd Frontend && yarn test` |
| Frontend data helpers | unit | helpers que ficam (RM-06) mantêm os testes atuais | `Frontend/src/test/data/*.test.ts` | `cd Frontend && yarn test` |
| Frontend test fixture | none | build gate (consumido pelos testes) | `Frontend/src/test/fixtures/*.ts` | `cd Frontend && yarn build` |
| Backend service/controller (D1=B) | unit (models mockados com `vi.mock`) | RM-09..RM-12: happy + 400 + escopo de filial | `Backend/tests/unit/*.test.ts` | `cd Backend && yarn test` |
| Backend schema (D1=B) | unit | campos/required/índices como `tests/unit/schemas.test.ts` | `Backend/tests/unit/schemas.test.ts` | `cd Backend && yarn test` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ----------- |
| Quick | Tasks de Frontend | `cd Frontend && yarn test` |
| Full | Tasks de Backend (D1=B) | `cd Backend && yarn test && yarn build` |
| Build | Fim de fase / T7 | `cd Frontend && yarn lint && yarn build && yarn test` |

---

## Execution Plan

### Phase 1: Fixture

```
T1
```

### Phase 2: Migrar imports dos testes (paralelo: T2, T3, T4, T5 tocam arquivos disjuntos)

```
T2
T3
T4
T5
```

### Phase 3: Histórico do modal sem mock

```
T6
```

### Phase 4: Limpeza de `data/machines.ts`

```
T7
```

### Phase 5 (condicional, D1 = B): Manutenção real (B1 → B2 → B3 sequenciais no Backend; B4 depois de B3)

```
B1 → B2 → B3 → B4
```

Paralelismo: Fase 2 inteira em paralelo. A Fase 5 (Backend) pode rodar em paralelo às Fases 1-4 até B3; B4 depende de T6 (prop removida) e B3 (contrato).

---

## Task Breakdown

### T1: Criar fixture `MACHINES`

**What**: Copiar `BASE_MACHINES` e o `map` que gera `MACHINES` de `data/machines.ts` para uma fixture de teste, exportando `MACHINES: Machine[]` (tipo importado de `data/machines`).
**Where**: `Frontend/src/test/fixtures/machines.ts` (novo)
**Depends on**: None
**Reuses**: padrão de `Frontend/src/test/fixtures/employees.ts`
**Requirement**: RM-07

**Done when**:

- [ ] Fixture exporta 16 máquinas idênticas ao mock atual (ids '1'..'16', `nomeDispositivo` `Mpa-53xx`, `tempoUsoTotalHoras`, `setorId: null`).
- [ ] `data/machines.ts` ainda intacto (remoção é o T7).
- [ ] Gate passa.

**Tests**: none
**Gate**: build

---

### T2: Migrar testes de `test/data` para a fixture

**What**: Trocar `MACHINES` importado de `data/machines` pelo da fixture.
**Where**: `Frontend/src/test/data/` (`machines.test.ts`, `fleet.test.ts`, `employeeArea.test.ts`)
**Depends on**: T1
**Reuses**: fixture do T1
**Requirement**: RM-07

**Done when**:

- [ ] Nenhum desses arquivos importa `MACHINES` de `data/machines` (os blocos que testam `MACHINE_EVENTS`/`eventsForMachine`/`filterEvents` ficam até o T7).
- [ ] Mesma contagem de testes passando que antes.

**Tests**: unit
**Gate**: quick

---

### T3: Migrar testes da área do colaborador para a fixture

**What**: Trocar o import estático e o `await import('…/data/machines')` dentro de `vi.mock` pela fixture.
**Where**: `Frontend/src/test/` (`fixtures/employeeSessions.ts`, `pages/employee/{EmployeeMachinesPage,EmployeeHistoryPage,EmployeeHomePage,EmployeeSkeletonPages}.test.tsx`, `components/employee/{IncidentSheet,MachineDetailSheet}.test.tsx`)
**Depends on**: T1
**Reuses**: fixture do T1
**Requirement**: RM-07

**Done when**:

- [ ] Nenhum desses arquivos referencia `MACHINES` de `data/machines` (inclui importações dinâmicas).
- [ ] Mesma contagem de testes passando que antes.

**Tests**: unit
**Gate**: quick

---

### T4: Migrar testes da Frota para a fixture

**What**: Trocar `MACHINES` / `MACHINES as MOCK` pelo da fixture.
**Where**: `Frontend/src/test/` (`pages/FrotaPage.test.tsx`, `components/fleet/{FleetRow,MachinePickerModal}.test.tsx`)
**Depends on**: T1
**Reuses**: fixture do T1
**Requirement**: RM-07

**Done when**:

- [ ] Nenhum desses arquivos importa `MACHINES` de `data/machines`.
- [ ] Mesma contagem de testes passando que antes.

**Tests**: unit
**Gate**: quick

---

### T5: Migrar `MACHINES` dos testes de Visão Geral e Alertas e tirar `MACHINE_EVENTS` dos acidentes fabricados

**What**: Importar `MACHINES` da fixture; em `AlertasPage.test.tsx:18` trocar a geração de incidentes a partir de `MACHINE_EVENTS` por incidentes literais (ou por `MACHINE_EVENTS` exportado da fixture, o que for menor), mantendo os mesmos asserts.
**Where**: `Frontend/src/test/pages/` (`VisaoGeralPage.test.tsx`, `AlertasPage.test.tsx`)
**Depends on**: T1
**Reuses**: fixture do T1
**Requirement**: RM-07

**Done when**:

- [ ] Imports de `MACHINES`/`MACHINE_EVENTS` não vêm mais de `data/machines` (os usos de `eventsForMachine`/`filterEvents` no histórico de reparos ficam para o T6).
- [ ] Mesma contagem de testes passando que antes.

**Tests**: unit
**Gate**: quick

---

### T6: Remover a prop `events` do `MachineDetailModal` e o mock das páginas

**What**: Apagar a prop `events` e o uso de `filterEvents` no modal (aba de reparos renderiza lista vazia → `machines.historyEmpty`); apagar `mockEventsFor`/`repairsFor`, os imports de `MACHINES`/`eventsForMachine` e o `events=` nas quatro páginas; atualizar os testes que dependiam do histórico mock.
**Where**: `Frontend/src/components/machines/MachineDetailModal.tsx` + chamadores (`pages/{VisaoGeralPage,FrotaPage,AlertasPage,DashboardPage}.tsx`) + testes (`test/components/machines/MachineDetailModal.test.tsx`, `test/pages/VisaoGeralPage.test.tsx`, `test/pages/AlertasPage.test.tsx`) — um commit, porque remover a prop sem os chamadores quebra o `tsc -b`.
**Depends on**: None (fases anteriores concluídas)
**Reuses**: estado vazio existente (`machines.historyEmpty`), efeito de acidentes já existente no modal
**Requirement**: RM-01, RM-02, RM-03, RM-04

**Done when**:

- [ ] `MachineDetailModalProps` sem `events`; nenhuma página passa `events=`.
- [ ] Teste do modal: aba de reparos/manutenção mostra `Nenhum…`/`machines.historyEmpty` e zero `listitem` (RM-02); aba de acidentes continua listando o que `incidentService.listar` devolve (RM-01).
- [ ] `VisaoGeralPage.test.tsx` l.470-505: os dois testes de "mock history" viram um teste de RM-04 (EMP-084 e EMP-777 mostram a mesma lista de reparos, vazia).
- [ ] `AlertasPage.test.tsx` l.200-202: assert de reparos passa a esperar estado vazio.
- [ ] Comentários `ponytail: … não há rota de incident` removidos junto com os helpers.
- [ ] Gate passa; contagem de testes só cai pelos testes substituídos, listados no commit.

**Tests**: unit
**Gate**: quick

---

### T7: Apagar o mock de `data/machines.ts`

**What**: Remover `BASE_MACHINES`, `MACHINES`, `EVENT_OPERATORS`, `EVENT_SLOTS`, `EVENT_TYPES`, `ACCIDENT_CAUSES`, `FIRST_EVENT_DAY`, `DAY_MS`, `MACHINE_EVENTS`, `eventsForMachine`, `EventFilters`, `filterEvents`; em `test/data/machines.test.ts` remover os blocos `machine detail mocks`, `filterEvents` e os dois asserts sobre `MACHINE_EVENTS` (mantém `ACCIDENT_URGENCY`, `incidentToEvent`, `eventUrgency`, `filterMachines`).
**Where**: `Frontend/src/data/machines.ts` (+ `Frontend/src/test/data/machines.test.ts`)
**Depends on**: None (fases anteriores concluídas)
**Reuses**: —
**Requirement**: RM-05, RM-06, RM-08

**Done when**:

- [ ] `grep -rnE "\b(MACHINES|BASE_MACHINES|MACHINE_EVENTS|eventsForMachine|filterEvents)\b" Frontend/src --exclude-dir=test` vazio.
- [ ] Exports de RM-06 continuam presentes.
- [ ] `yarn lint && yarn build && yarn test` verdes em `Frontend`.

**Tests**: unit
**Gate**: build

---

### B1 (D1 = B): Schema `maintenance`

**What**: Criar o schema do contrato em design.md §1.
**Where**: `Backend/src/schemas/maintenance.ts` (+ caso em `Backend/tests/unit/schemas.test.ts`)
**Depends on**: None
**Reuses**: `Backend/src/schemas/incident.ts`
**Requirement**: RM-09

**Done when**:

- [ ] Campos `empilhadeiraId`, `filialId`, `inicio` required; `fim` default `null`; índices do design.
- [ ] Gate passa.

**Tests**: unit
**Gate**: full

---

### B2 (D1 = B): Registrar entrada/saída de manutenção em `aplicarStatus`

**What**: Criar registro ao entrar em `manutencao` e fechar (`fim = agora`) ao sair.
**Where**: `Backend/src/feature/machine/statusService.ts` (+ `Backend/tests/unit/statusService.test.ts`)
**Depends on**: B1
**Reuses**: padrão de `Incident.updateMany` já em `aplicarStatus`
**Requirement**: RM-09, RM-10

**Done when**:

- [ ] Teste: `disponivel → manutencao` chama `Maintenance.create` com `fim: null`; `manutencao → disponivel` chama `updateMany({ empilhadeiraId, fim: null }, { $set: { fim } })`; `manutencao → manutencao` não chama nenhum dos dois.
- [ ] Gate passa.

**Tests**: unit
**Gate**: full

---

### B3 (D1 = B): `GET /api/maintenances`

**What**: Service/controller/router no padrão de `feature/incident` e montagem em `app.ts`.
**Where**: `Backend/src/feature/maintenance/` (`maintenanceService.ts`, `maintenanceController.ts`, `maintenanceRouter.ts`) + `Backend/src/app.ts` (+ `tests/unit/maintenanceService.test.ts`, `tests/unit/maintenanceController.test.ts`)
**Depends on**: B1
**Reuses**: `filtroPorFilial`, `lerMachineId`, `lerPeriodo`, `LIMITE_HISTORICO`, `formatar` de incident como modelo
**Requirement**: RM-11, RM-12

**Done when**:

- [ ] Resposta no formato do contrato, ordenada por `inicio` desc, limitada a 500, só filiais do escopo.
- [ ] 400 para `machineId`/`filialId`/`from`/`to` inválidos; `[]` quando `from > to`.
- [ ] Gate passa.

**Tests**: unit
**Gate**: full

---

### B4 (D1 = B): Aba de reparos lendo `/maintenances`

**What**: `maintenanceService.listar` no Frontend + mapeamento puro para `MachineEvent` (`tipo: 'manutencao'`) + segundo efeito no modal igual ao de acidentes.
**Where**: `Frontend/src/services/maintenanceService.ts` (novo) + `components/machines/MachineDetailModal.tsx` + `data/machines.ts` (função de mapeamento) + testes do modal e de `data/machines`
**Depends on**: B3
**Reuses**: `incidentService.ts`, `incidentToEvent`
**Requirement**: RM-13

**Done when**:

- [ ] Modal chama `maintenanceService.listar({ machineId, from, to })` e lista o retorno na aba de reparos; falha → `machines.historyEmpty`.
- [ ] Gate passa.

**Tests**: unit
**Gate**: quick

---

## Validation

### Diagram-Definition Cross-Check

| Task | Depends on (definition) | Diagram | Match |
| ---- | ----------------------- | ------- | ----- |
| T1 | None | Phase 1 start | ✅ |
| T2-T5 | T1 (phase 1) | Phase 2, parallel | ✅ |
| T6 | phases 1-2 | Phase 3 | ✅ |
| T7 | phases 1-3 | Phase 4 | ✅ |
| B1 | None | Phase 5 start | ✅ |
| B2 | B1 | B1 → B2 | ✅ |
| B3 | B1 | B2 → B3 (sequencial, mesmo worker) | ✅ |
| B4 | B3 (+ T6) | B3 → B4 | ✅ |

### Test Co-location

| Task | Layer | Matrix requires | Task Tests | OK |
| ---- | ----- | --------------- | ---------- | -- |
| T1 | fixture | none | none | ✅ |
| T2-T6 | Frontend tests/components | unit | unit | ✅ |
| T7 | data helpers | unit | unit | ✅ |
| B1-B3 | Backend | unit | unit | ✅ |
| B4 | Frontend service/component | unit | unit | ✅ |
