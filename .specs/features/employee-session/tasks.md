# Sessão do funcionário, ocorrência e login do colaborador Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Regra do banco (global do dono):** nenhuma tarefa, teste, gate ou Verifier acessa o banco. Models mockados; os gates do Backend rodam `tests/unit`, nunca `tests/integration`; nenhum `.env` é lido. Só o dono roda `seed:data`.

**Commits:** com a identidade git do dono, Conventional Commits, sem trailer nem menção ao agente. Nunca `git push`.

**Node:** o Frontend precisa de Node 24+ (`export PATH=/home/romulo/.nvm/versions/node/v25.9.0/bin:$PATH`).

---

**Spec**: `.specs/features/employee-session/spec.md` (design inline nas decisões do spec)
**Status**: Approved

---

## Contrato da API (fixo; back e front implementam em paralelo)

- `POST /api/auth/login` → `user.operador: { _id, nome } | null`.
- `GET /api/sessions/atual` → `Sessao | null`; `POST /api/sessions { machineId }` → 201 `Sessao`; `PUT /api/sessions/atual/encerrar` → 200 `Sessao`; `GET /api/sessions?from&to&machineId` → `Sessao[]`.
- `Sessao = { _id, machineId, maquina: { nome, identificacao, setor }, operador: { nome }, inicio: ISO, fim: ISO | null }`.
- `POST /api/incidents { horario?: 'HH:mm', descricao?: string }` → 201 `Incidente`; `GET /api/incidents?machineId&from&to` → `Incidente[]`.
- `Incidente = { _id, machineId, maquina: { nome, identificacao, setor }, operador: { nome } | null, dataIncidente: ISO, forcaImpacto: number | null, status, origem: 'sensor' | 'funcionario', descricao: string | null }`.

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema | unit | `validateSync()` e `schema.indexes()` | `Backend/tests/unit/schemas.test.ts` | `cd Backend && npx vitest run tests/unit/schemas.test.ts` |
| Backend service | unit | 1:1 aos ACs e edge cases, models mockados | `Backend/tests/unit/<nome>.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend controller / route | unit | happy path + cada erro, service mockado | `Backend/tests/unit/<nome>Controller.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Controller.test.ts` |
| Frontend service | unit | URL, método, corpo; `api` mockado | `Frontend/src/test/services/*.test.ts` | `cd Frontend && npx vitest run src/test/services` |
| Frontend page / component | unit (Testing Library) | cada AC visível, erro; serviços mockados | `Frontend/src/test/{pages,components}/**` | `cd Frontend && npx vitest run src/test/<caminho>` |
| Frontend i18n | unit | paridade nos 7 idiomas (L-009) | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && npx vitest run src/test/config/i18n.test.ts` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Depois de cada task | Run Command da task + `cd Backend && npx tsc --noEmit` ou `cd Frontend && npx tsc -b` |
| Build | Fim de cada fase | Backend: `npx tsc --noEmit && npx vitest run tests/unit`; Frontend: `npx tsc -b && npx eslint . && npx vitest run` |

---

## Execution Plan

### Phase 1: Backend

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Frontend

```
T7 → T8 → T9 → T10 → T11 → T12
```

As fases rodam em paralelo (contrato fixo acima); a Phase 2 usa serviços mockados nos testes.

---

## Task Breakdown

### T1: `operadorId` no user, `workSession` e campos do incident

**What**: `user.operadorId` (ref operator, opcional). Schema novo `workSession`: `operadorId`, `empilhadeiraId`, `filialId` (required, index), `inicio` (required), `fim` (default null), com índices únicos parciais `{ operadorId }` e `{ empilhadeiraId }` onde `fim: null`. `incident` ganha `origem` (enum `sensor`|`funcionario`, default `sensor`) e `descricao` (maxlength 500).
**Where**: `Backend/src/schemas/{user,workSession,incident}.ts`
**Depends on**: None
**Requirement**: SES-01, SES-03, OCO-01

**Done when**:

- [x] Testes em `schemas.test.ts` cobrem os padrões, o maxlength e os dois índices parciais
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(session): add work session schema and operator link`

---

### T2: Usuário na requisição e operador no login

**What**: `autenticar` grava `req.usuario = { _id, role, operadorId: string | null }`. O login devolve `user.operador` (`{ _id, nome }` do operator ligado, ou `null`).
**Where**: `Backend/src/core/autenticar.ts`, `Backend/src/feature/auth/authService.ts`
**Depends on**: T1
**Requirement**: LOG-01, LOG-02

**Done when**:

- [x] Testes: colaborador ligado → `operador` preenchido; sem ligação ou admin → `null`; `req.usuario` montado
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): expose the linked operator on login`

---

### T3: Serviço de sessão

**What**: `sessionService`: `atual`, `iniciar`, `encerrar` e `listar`, conforme SES-01..09 e os edge cases.
**Where**: `Backend/src/feature/session/sessionService.ts`
**Depends on**: T2
**Reuses**: `aplicarStatus`, `filtroPorFilial`, `obterMaquina`
**Requirement**: SES-01..09

**Done when**:

- [x] Um teste por AC e por edge case (409, 404, 403, 400, `from` > `to`, máquina apagada, `11000` → 409)
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(session): start, end and list work sessions`

---

### T4: Rotas de sessão

**What**: `sessionController` + `sessionRouter` em `/api/sessions` (`GET /atual`, `POST /`, `PUT /atual/encerrar`, `GET /`), ligados em `app.ts`.
**Where**: `Backend/src/feature/session/`, `Backend/src/app.ts`
**Depends on**: T3
**Requirement**: SES-01..09

**Done when**:

- [x] Testes de controller: status e corpo de cada rota e de cada erro; rotas registradas
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(session): expose work session routes`

---

### T5: Ocorrência e leitura de incidentes

**What**: `incidentService.reportar` e `incidentService.listar`; `incidentController` + `incidentRouter` em `/api/incidents`; `registrarImpacto` grava `origem: 'sensor'`.
**Where**: `Backend/src/feature/incident/`, `Backend/src/app.ts`, `Backend/src/feature/machine/statusService.ts`
**Depends on**: T4
**Requirement**: OCO-01..04

**Done when**:

- [x] Um teste por AC e erro (400, 403, 409), filtro por máquina e por dia, ordem
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(incident): report incidents and list them by scope`

---

### T6: Seed e docs

**What**: o seed liga cada colaborador ao operator do mesmo nome; `docs/api.md` e `docs/modelagem_de_dados.md` ganham as rotas e campos novos.
**Where**: `Backend/src/scripts/seedData.ts`, `docs/`
**Depends on**: T5
**Requirement**: LOG-01

**Done when**:

- [x] Teste do seed: colaborador com operator de mesmo nome ganha `operadorId`; sem par fica sem
- [x] Build gate do Backend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(seed): link collaborators to their operators`

---

### T7: Serviços, tipos e textos

**What**: `UsuarioLogado.operador`; `sessionService` (`atual`, `iniciar`, `encerrar`, `listar`) e `incidentService` (`reportar`, `listar`) conforme o contrato; chaves i18n novas (erro de iniciar, encerrar e enviar; sair) nos 7 idiomas.
**Where**: `Frontend/src/services/`, `Frontend/src/locales/*`
**Depends on**: None
**Requirement**: LOG-01, SES-10..13, OCO-05

**Done when**:

- [x] Testes de serviço (URL, método, corpo) e paridade i18n
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(employee): add session and incident services`

---

### T8: Guarda e sair da área do funcionário

**What**: `EmployeeLayout` redireciona para `/login/colaborador` sem usuário `colaborador`; Configurações ganha "Sair"; o nome exibido vem de `operador?.nome ?? nome`.
**Where**: `Frontend/src/components/employee/`, `Frontend/src/pages/employee/EmployeeSettingsPage.tsx`
**Depends on**: T7
**Requirement**: LOG-03..05

**Done when**:

- [x] Testes: redireciona deslogado e admin; nome do operador; sair limpa e navega
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(employee): require collaborator login on the employee area`

---

### T9: Sessão pela API

**What**: `useWorkSession` passa a ler `GET /sessions/atual` e a iniciar e encerrar pela API (mesma interface, `start` e `end` assíncronos; erro vira toast). `MachineDetailSheet` e `EmployeeSessionPage` usam isso.
**Where**: `Frontend/src/hooks/useWorkSession.ts`, `Frontend/src/components/employee/`, `Frontend/src/pages/employee/EmployeeSessionPage.tsx`
**Depends on**: T8
**Requirement**: SES-10..12

**Done when**:

- [x] Testes: iniciar navega para a sessão com o cronômetro de `inicio`; recarregar recupera; falha ao encerrar mantém a sessão e mostra o toast
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(employee): start and end sessions through the API`

---

### T10: Início, Máquinas e Histórico pela API

**What**: as três telas leem as máquinas de `machineService.listar` e o histórico e a última máquina de `sessionService.listar`; `employeeArea.ts` perde os mocks que deixarem de ser usados.
**Where**: `Frontend/src/pages/employee/`, `Frontend/src/data/employeeArea.ts`
**Depends on**: T9
**Requirement**: SES-13

**Done when**:

- [x] Testes por tela com serviços mockados (lista, vazio, filtros do histórico)
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(employee): read machines and usage history from the API`

---

### T11: Ocorrência pela API

**What**: `IncidentSheet` envia `incidentService.reportar({ horario })` com o nome do operador e a máquina da sessão preenchidos; erro mantém aberto com toast.
**Where**: `Frontend/src/components/employee/IncidentSheet.tsx`
**Depends on**: T10
**Requirement**: OCO-05

**Done when**:

- [x] Testes: envio chama a API com o horário; sucesso mostra toast e fecha; erro mantém aberto
- [x] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(employee): send incidents to the API`

---

### T12: Acidentes reais no detalhe e em Alertas

**What**: a aba de acidentes do detalhe da máquina e a `AlertasPage` leem `incidentService.listar` e convertem `Incidente` para o card (`origem: 'sensor'` → causa `colisao`; `funcionario` → urgência `alta`); reparos seguem em `MACHINE_EVENTS`.
**Where**: `Frontend/src/components/machines/`, `Frontend/src/pages/AlertasPage.tsx`, `Frontend/src/data/machines.ts`
**Depends on**: T11
**Requirement**: OCO-06

**Done when**:

- [ ] Testes: lista da API no detalhe e em Alertas, conversão, filtro de data; reparos seguem do mock
- [ ] Build gate do Frontend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(alerts): list real incidents on detail and alerts`
