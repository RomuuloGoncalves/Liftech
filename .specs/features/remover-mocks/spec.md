# Remover mocks de máquinas Specification

## Problem Statement

`Frontend/src/data/machines.ts` ainda exporta um dataset fictício (`BASE_MACHINES`, `MACHINES`, `MACHINE_EVENTS`, `eventsForMachine`). Três páginas de produção (`VisaoGeralPage.tsx:27-29`, `FrotaPage.tsx:47-49`, `AlertasPage.tsx:22-24`) usam esse dataset para preencher a aba de reparos/manutenção do `MachineDetailModal`, casando pela `identificacao`: uma máquina real "EMP-084" mostra reparos inventados, e qualquer outra não mostra nada. Os comentários dizem "não há rota de incident", mas `/api/incidents` já existe e o modal já busca os acidentes nela (`MachineDetailModal.tsx:66-75`); o que não existe no Backend é registro de manutenção.

## Goals

- [ ] Nenhum arquivo de produção em `Frontend/src` (fora de `src/test`) importa ou define `MACHINES`, `BASE_MACHINES`, `MACHINE_EVENTS` ou `eventsForMachine`.
- [ ] O histórico do `MachineDetailModal` mostra só dados vindos da API (acidentes de `/incidents`; reparos conforme a decisão D1).
- [ ] Os testes que dependiam do dataset passam usando `src/test/fixtures/machines.ts`, sem perda de cobertura do comportamento de produção.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Renomear/reorganizar `data/machines.ts` (tipos, `filterMachines`, `incidentToEvent`) | Só removemos o mock; os helpers reais continuam onde estão. |
| Backfill de manutenções passadas | O Backend só guarda `statusAlteradoEm` da última mudança; não há histórico para reconstruir. |
| Mudar o visual das abas do modal (Figma) | As abas Acidentes/Manutenção (ou Reparos/Alertas) ficam como estão. |
| Seeds do Backend (`seedDataset.ts`) | Dados de dev do Backend não são mock do Frontend. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1: de onde vem a aba de reparos/manutenção | Opção A: aba fica com estado vazio (`machines.historyEmpty`) até existir endpoint; Opção B (fase condicional em tasks.md): criar `GET /api/maintenances` no Backend | O Backend não tem modelo de manutenção (ver design.md §1); a opção A entrega os goals sem inventar Backend; B só com aval do usuário | n (decisão do usuário) |
| D2 (só se D1=B): quem aparece como "operador" num reparo | `null` → modal mostra vazio na coluna | `aplicarStatus` não recebe o usuário; gravar quem mudou o status exige passar o usuário do controller | n (decisão do usuário) |
| D3 (só se D1=B): reparo em aberto (máquina ainda em manutenção) | listado com `fim: null`, exibido como `inicio ~ agora`? Default: exibir só `inicio` | Menor mudança no modal (mesmo formato do acidente, `inicio === fim`) | n (decisão do usuário) |
| Testes que validavam o próprio mock (`machines.test.ts`: "machine detail mocks", causas de `MACHINE_EVENTS`) | Removidos junto com o mock | Testam dados fictícios que deixam de existir, não comportamento de produção | y |
| `filterEvents` | Removido de produção (e seus testes) | Só filtrava os eventos mock por tipo/período; acidentes já vêm filtrados da API e reparos (B) também viriam | y |
| Fixture de máquinas | Cópia literal de `MACHINES` (16 máquinas, mesmos ids/identificacao) em `src/test/fixtures/machines.ts` | Os testes existentes asseveram valores desse dataset (ids '1'..'16', EMP-081..); copiar evita reescrever asserts | y |

**Open questions:** D1 (e D2/D3 se D1=B) — registradas acima com default; o plano executa a opção A sem bloquear.

---

## User Stories

### P1: Histórico do modal só com dados reais ⭐ MVP

**User Story**: Como administrador, quero que o detalhe da máquina mostre apenas eventos registrados de verdade, para não tomar decisão em cima de reparos inventados.

**Why P1**: Hoje uma máquina real pode exibir reparos falsos.

**Acceptance Criteria**:

1. WHEN o usuário abre o detalhe de uma máquina em Visão Geral, Frota ou Alertas THEN o `MachineDetailModal` SHALL listar na aba de acidentes apenas os incidentes retornados por `incidentService.listar({ machineId, from, to })`. <!-- RM-01 -->
2. WHERE D1 = A, WHEN o usuário abre a aba de reparos/manutenção THEN o modal SHALL exibir o texto `machines.historyEmpty` e nenhum item de lista. <!-- RM-02 -->
3. The `MachineDetailModal` SHALL não ter a prop `events` (nenhum chamador passa histórico). <!-- RM-03 -->
4. WHEN uma máquina da API tem `identificacao` igual a uma do antigo mock (ex.: EMP-084) THEN o modal SHALL exibir o mesmo histórico de reparos que uma máquina sem correspondência. <!-- RM-04 -->

**Independent Test**: abrir o detalhe de EMP-084 vindo da API mockada (serviço) e ver a aba de manutenção vazia.

---

### P1: Mock fora do código de produção ⭐ MVP

**User Story**: Como desenvolvedor, quero o dataset fictício só nos testes, para que nenhum caminho de produção dependa dele.

**Acceptance Criteria**:

1. The `Frontend/src` fora de `src/test` SHALL não conter as identificadores `MACHINES`, `BASE_MACHINES`, `MACHINE_EVENTS`, `eventsForMachine` nem `filterEvents` (verificável por grep). <!-- RM-05 -->
2. The `data/machines.ts` SHALL continuar exportando `MachineStatus`, `MACHINE_STATUSES`, `Machine`, `MachineEventType`, `AccidentCause`, `UrgencyLevel`, `ACCIDENT_URGENCY`, `MachineEvent`, `DEFAULT_PERIOD`, `defaultPeriodTo`, `incidentToEvent`, `eventUrgency`, `MachineFilters`, `filterMachines`. <!-- RM-06 -->
3. The `src/test/fixtures/machines.ts` SHALL exportar `MACHINES: Machine[]` com as mesmas 16 máquinas (ids, identificacao, status, setor, `nomeDispositivo`, `tempoUsoTotalHoras`) do mock atual. <!-- RM-07 -->
4. WHEN `yarn test` e `yarn build` rodam em `Frontend` THEN ambos SHALL sair com código 0. <!-- RM-08 -->

**Independent Test**: `grep -rnE "MACHINES|MACHINE_EVENTS|eventsForMachine|BASE_MACHINES" Frontend/src --exclude-dir=test` vazio + suíte verde.

---

### P2 (condicional, D1 = B): Reparos reais pela API

**User Story**: Como administrador, quero ver os períodos em que a máquina ficou em manutenção.

**Acceptance Criteria**:

1. WHEN o status de uma máquina passa de outro valor para `manutencao` via `aplicarStatus` THEN o Backend SHALL criar um registro de manutenção com `empilhadeiraId`, `filialId`, `inicio = agora` e `fim = null`. <!-- RM-09 -->
2. WHEN o status sai de `manutencao` THEN o Backend SHALL gravar `fim = agora` no registro aberto dessa máquina. <!-- RM-10 -->
3. WHEN `GET /api/maintenances?machineId&from&to&filialId` é chamado THEN o Backend SHALL responder 200 com `[{ _id, machineId, operador: { nome } | null, inicio: ISO, fim: ISO | null }]` restrito às filiais do escopo, ordenado por `inicio` desc, limitado a `LIMITE_HISTORICO`. <!-- RM-11 -->
4. IF `machineId`, `filialId`, `from` ou `to` forem inválidos THEN o Backend SHALL responder 400 com as mesmas mensagens de `/incidents`. <!-- RM-12 -->
5. WHEN o usuário abre a aba de reparos THEN o modal SHALL listar os registros de `maintenanceService.listar({ machineId, from, to })`. <!-- RM-13 -->

---

## Edge Cases

- IF `incidentService.listar` falhar THEN o modal SHALL mostrar `machines.historyEmpty` na aba de acidentes (comportamento atual, mantido).
- IF (D1=B) `maintenanceService.listar` falhar THEN o modal SHALL mostrar `machines.historyEmpty` na aba de reparos.
- WHEN `from > to` THEN (D1=B) o Backend SHALL responder `[]` (mesmo contrato de `lerPeriodo` usado em `/incidents`).

Dimensions sweep (Medium): persistência/estado e chamadas externas só existem na opção B (RM-09..RM-12); auth = escopo de filial reutilizado de `/incidents`; demais dimensões N/A para remoção de mock.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| RM-01 | P1: Histórico real | Tasks (T6) | Pending |
| RM-02 | P1: Histórico real | Tasks (T6) | Pending |
| RM-03 | P1: Histórico real | Tasks (T6) | Pending |
| RM-04 | P1: Histórico real | Tasks (T6) | Pending |
| RM-05 | P1: Mock fora | Tasks (T7) | Pending |
| RM-06 | P1: Mock fora | Tasks (T7) | Pending |
| RM-07 | P1: Mock fora | Tasks (T1) | Pending |
| RM-08 | P1: Mock fora | Tasks (T7) | Pending |
| RM-09 | P2: Reparos API | Tasks (B2) | Pending (D1) |
| RM-10 | P2: Reparos API | Tasks (B2) | Pending (D1) |
| RM-11 | P2: Reparos API | Tasks (B3) | Pending (D1) |
| RM-12 | P2: Reparos API | Tasks (B3) | Pending (D1) |
| RM-13 | P2: Reparos API | Tasks (B4) | Pending (D1) |

**Coverage:** 13 total, 13 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] grep de RM-05 vazio.
- [ ] `yarn test` e `yarn build` verdes em `Frontend` (e `yarn test` em `Backend` se D1=B).
