# access-requests-admin Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/access-requests-admin/design.md`
**Status**: Draft

Regras desta feature: nenhuma task toca o banco (models mockados nos testes); cada task só edita os arquivos de **Files**; nada de push.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `Backend/package.json` (`test` = só `tests/unit`), `Frontend/package.json` (`test`, `lint`, `build`), `.specs/STATE.md` (AD-009/AD-010: testes com models mockados, nenhum teste toca o banco), `Frontend/src/test/styles/no-hardcoded-colors.test.ts` (cores só por token).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema | unit | `validateSync()` do enum, `maxlength`, trim e paths novos | `Backend/tests/unit/schemas.test.ts` | `cd Backend && npx vitest run tests/unit/schemas.test.ts` |
| Backend service | unit | 1:1 aos ACs de ACCR-01/03/04/06 e edge cases; models mockados | `Backend/tests/unit/accessRequestService.test.ts` | `cd Backend && npx vitest run tests/unit/accessRequestService.test.ts` |
| Backend controller / route | unit | happy path + cada 400/404/409 + rotas públicas no `app.test.ts`; service mockado | `Backend/tests/unit/accessRequestController.test.ts`, `Backend/tests/unit/app.test.ts` | `cd Backend && npx vitest run tests/unit/accessRequestController.test.ts tests/unit/app.test.ts` |
| Frontend service | unit | URL, método, params, corpo; `api` mockado | `Frontend/src/test/services/*.test.ts` | `cd Frontend && npx vitest run src/test/services/accessRequestService.test.ts` |
| Frontend component | unit (Testing Library) | cada AC visível do componente | `Frontend/src/test/components/**` | `cd Frontend && npx vitest run src/test/components/<caminho>` |
| Frontend page | unit (Testing Library) | cada AC de ACCR-02/05/07 + erro e 409; serviço mockado | `Frontend/src/test/pages/SolicitacoesPage.test.tsx` | `cd Frontend && npx vitest run src/test/pages/SolicitacoesPage.test.tsx` |
| Frontend routes / shell | unit | rota renderiza a página; sem Sidebar/Header | `Frontend/src/test/routes/appRoutes.test.tsx`, `Frontend/src/test/App.test.tsx` | `cd Frontend && npx vitest run src/test/routes src/test/App.test.tsx` |
| Frontend i18n | unit | chaves `accessRequests.*` nos 7 idiomas, não vazias, traduzidas | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && npx vitest run src/test/config/i18n.test.ts` |

## Gate Check Commands

> Frontend com `export PATH=/home/romulo/.nvm/versions/node/v25.9.0/bin:$PATH`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Depois de cada task | Run Command da task + `cd Backend && npx tsc --noEmit` ou `cd Frontend && npx tsc -b` |
| Build | Fim de cada fase | Backend: `npx tsc --noEmit && yarn test`; Frontend: `npx tsc -b && npx eslint . && npx vitest run` |

---

## Execution Plan

As duas fases **não dependem uma da outra** (arquivos disjuntos; o contrato é o JSON de `design.md` → Data Models). Rodam em paralelo: um worker por fase. Dentro da Fase 2, T5 e T6 não dependem de nada e T7/T8/T9 só de T4, então um segundo worker de front pode pegar T5+T6 enquanto o primeiro faz T4→T7→T8→T9; T10 espera todos.

### Phase 1: Backend

```
T1 → T2 → T3
```

### Phase 2: Frontend

```
T4 → T7
T4 → T8
T4 → T9
T5 → T10
T6 → T10
T7 → T10
T8 → T10
T9 → T10
T10 → T11 → T12
```

---

## Task Breakdown

### T1: Schema `accessRequest` com decisão

**What**: `status` com `enum ['pendente', 'aprovando', 'aprovada', 'recusada']` (default `pendente`), e campos `empresaId` (ObjectId ref `company`), `decididaEm` (Date), `motivoRecusa` (String, trim, `maxlength: 200`).
**Where**: `Backend/src/schemas/accessRequest.ts`
**Files**: `Backend/src/schemas/accessRequest.ts`, `Backend/tests/unit/schemas.test.ts`
**Depends on**: None
**Reuses**: `Backend/src/schemas/branch.ts` (ref ObjectId)
**Requirement**: ACCR-03, ACCR-06

**Done when**:
- [ ] `schemas.test.ts`: status inválido falha no `validateSync()`, os 4 válidos passam, default `pendente`; `motivoRecusa` com 201 caracteres falha e é cortado; `empresaId` e `decididaEm` existem nos paths
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(access-request): add decision fields to accessRequest schema`

---

### T2: `accessRequestService` (listar, aprovar, recusar)

**What**: Service com `listar`, `aprovar` (claim `pendente → aprovando`, cria company + branch `MATRIZ_NOME` + user admin, compensação e volta a `pendente` em erro, 11000 → 409) e `recusar` (claim direto para `recusada`), conforme `design.md` → Atomicidade e claim.
**Where**: `Backend/src/feature/accessRequest/accessRequestService.ts`
**Files**: `Backend/src/feature/accessRequest/accessRequestService.ts` (novo), `Backend/tests/unit/accessRequestService.test.ts` (novo)
**Depends on**: T1
**Reuses**: `utils/senha.ts`, `utils/responseHandler.ts` (`ErroHttp`), `feature/machine/machineService.ts` (compensação e `traduzirErro`), `scripts/seedDataset.ts` (`MATRIZ_NOME`)
**Requirement**: ACCR-01, ACCR-03, ACCR-04, ACCR-06

**Done when**:
- [ ] ACCR-01: sem status → `find({ status: 'pendente' })` com `sort({ createdAt: 1 })`; com status → filtro dele e `sort({ createdAt: -1 })`
- [ ] ACCR-03 AC1: `Company.create({ nome })`, `Branch.create({ nome: 'Matriz', empresaId, matriz: true })`, `User.create` com `role: 'admin'`, `escopo: 'empresa'`, `nome`, `email`, `empresaId`; resposta com `status: 'aprovada'`, `empresaId`, `decididaEm` e `senhaInicial`
- [ ] ACCR-03 AC2/AC3: `senhaInicial` tem 12 caracteres, `User.create` recebe só `senhaHash` (sem campo de senha em texto) e `verificarSenha(senhaInicial, senhaHash)` é `true`
- [ ] ACCR-04 AC4/AC5: e-mail ou empresa existentes → 409 com a mensagem do spec, nenhum `create` chamado, claim volta a `pendente`
- [ ] ACCR-04 AC6: falha em `Branch.create` e em `User.create` apaga o que foi criado (company, branch) e volta o claim a `pendente`; 11000 em `Company.create`/`User.create` vira o 409 correspondente
- [ ] ACCR-04 AC7/AC8: claim nulo + `exists` → 409 "Solicitação já decidida."; claim nulo sem documento → 404 "Solicitação não encontrada."; o filtro do claim exige `status: 'pendente'` (prova da corrida: a segunda chamada recebe claim nulo e 409)
- [ ] ACCR-06 AC1/AC2: recusa grava `status: 'recusada'`, `decididaEm`, `motivoRecusa` quando há motivo e não grava o campo quando vazio; não chama `Company`/`User`; já decidida → 409; inexistente → 404
- [ ] Edge: `nomeEmpresa` usado cortado na checagem e na criação
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(access-request): add list, approve and reject service`

---

### T3: Controller e rotas `GET /`, `PUT /:id/aprovar`, `PUT /:id/recusar`

**What**: `listar`, `aprovar`, `recusar` no controller (validação de `status`, `id` e `motivo`) e as três rotas no router com `// TEMP: sem auth por decisão do dono; travar com exigirAdmin`. `app.ts` não muda.
**Where**: `Backend/src/feature/accessRequest/accessRequestController.ts`
**Files**: `Backend/src/feature/accessRequest/accessRequestController.ts`, `Backend/src/feature/accessRequest/accessRequestRouter.ts`, `Backend/tests/unit/accessRequestController.test.ts`, `Backend/tests/unit/app.test.ts`
**Depends on**: T2
**Reuses**: `feature/branch/branchController.ts` (`lerId`, `responderErro`)
**Requirement**: ACCR-01, ACCR-03, ACCR-04, ACCR-06

**Done when**:
- [ ] ACCR-01 AC1-3: 200 sem status e com cada status válido (service chamado com o valor certo); 400 "O campo 'status' deve ser pendente, aprovada ou recusada." para `xyz`, `aprovando` e array
- [ ] ACCR-03/04: 200 com o retorno do service; 400 para id inválido; 404/409 repassados do `ErroHttp`; 500 para erro genérico
- [ ] ACCR-06 AC2-4: `motivo` cortado antes do service; vazio/ausente vira sem motivo; número e 201 caracteres → 400 "O campo 'motivo' deve ser texto de até 200 caracteres."; id inválido → 400
- [ ] `app.test.ts`: as três rotas respondem sem `Authorization` (não 401)
- [ ] Testes do `criar` existentes seguem passando
- [ ] Build gate do Backend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(access-request): expose list, approve and reject routes`

---

### T4: Chaves `accessRequests.*` nos 7 idiomas

**What**: Módulo `accessRequests` com: `title`, `tabs.{pendente,aprovada,recusada}`, `empty.{pendente,aprovada,recusada}`, `loadError`, `email`, `company`, `admin`, `sentAt`, `reason`, `accept`, `reject`, `acceptTitle`, `acceptMessage` (`{{company}}`), `rejectTitle`, `reasonLabel`, `reasonPlaceholder`, `passwordTitle`, `passwordLabel`, `passwordWarning`, `copy`, `copied`, `rejected`, `saveError`, `alreadyDecided`, `conflictEmail`, `conflictCompany`.
**Where**: `Frontend/src/locales/pt-BR/translation.json`
**Files**: `Frontend/src/locales/{pt-BR,en-US,es,fr,ja,de,ru}/translation.json`, `Frontend/src/test/config/i18n.test.ts`
**Depends on**: None
**Reuses**: estrutura dos testes `team`/`fleet` em `i18n.test.ts`
**Requirement**: ACCR-08

**Done when**:
- [ ] `accessRequests` entra em `REQUIRED_MODULES`
- [ ] Teste novo: cada locale tem as mesmas chaves (achatadas) de `accessRequests` que o pt-BR, todas não vazias, e fora do pt-BR nenhuma copia o texto em português; `acceptMessage` mantém `{{company}}`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(i18n): add access request admin translations`

---

### T5: `accessRequestService` do front

**What**: Tipos `AccessRequest`/`AccessRequestStatus` e `listar(status)`, `aprovar(id)`, `recusar(id, motivo)` conforme `design.md`.
**Where**: `Frontend/src/services/accessRequestService.ts`
**Files**: `Frontend/src/services/accessRequestService.ts` (novo), `Frontend/src/test/services/accessRequestService.test.ts` (novo)
**Depends on**: None
**Reuses**: `services/sectorService.ts` (formato e teste com `api` mockado)
**Requirement**: ACCR-02, ACCR-05, ACCR-07

**Done when**:
- [ ] `listar('pendente')` chama `GET /access-requests` sem params; `listar('aprovada')`/`listar('recusada')` mandam `params: { status }`; devolvem o corpo
- [ ] `aprovar('a1')` → `PUT /access-requests/a1/aprovar` e devolve o corpo com `senhaInicial`
- [ ] `recusar('a1', 'motivo')` → `PUT /access-requests/a1/recusar` com `{ motivo: 'motivo' }`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(access-request): add frontend access request service`

---

### T6: `ConfirmDialog` com `confirmLabel`

**What**: Prop opcional `confirmLabel?: string` no botão de confirmar; sem ela segue `t('team.delete')`.
**Where**: `Frontend/src/components/common/ConfirmDialog.tsx`
**Files**: `Frontend/src/components/common/ConfirmDialog.tsx`, `Frontend/src/test/components/common/ConfirmDialog.test.tsx`
**Depends on**: None
**Reuses**: -
**Requirement**: ACCR-05

**Done when**:
- [ ] Teste: com `confirmLabel="Aceitar"` o botão mostra "Aceitar" e chama `onConfirm`; sem a prop mostra o rótulo atual
- [ ] Testes existentes do `ConfirmDialog` e da `EquipePage` seguem passando
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(common): allow a custom confirm label in ConfirmDialog`

---

### T7: `RejectDialog`

**What**: Diálogo de recusa com `textarea` de motivo opcional (`maxLength={200}`), Cancelar e Recusar; `onConfirm(motivo)`.
**Where**: `Frontend/src/components/accessRequests/RejectDialog.tsx`
**Files**: `Frontend/src/components/accessRequests/RejectDialog.tsx` (novo), `Frontend/src/test/components/accessRequests/RejectDialog.test.tsx` (novo)
**Depends on**: T4
**Reuses**: `components/common/Modal.tsx`, `components/common/DialogButtons.module.css`, `components/team/TeamForm.module.css`
**Requirement**: ACCR-07

**Done when**:
- [ ] ACCR-07 AC5: o campo de motivo tem label e `maxLength` 200; Recusar sem texto chama `onConfirm('')`; com texto chama `onConfirm(texto)`; Cancelar chama `onCancel` e não `onConfirm`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(access-request): add reject dialog`

---

### T8: `InitialPasswordModal`

**What**: Modal com o e-mail, a senha inicial, botão copiar (`navigator.clipboard.writeText`) e o aviso de que a senha não aparece de novo.
**Where**: `Frontend/src/components/accessRequests/InitialPasswordModal.tsx`
**Files**: `Frontend/src/components/accessRequests/InitialPasswordModal.tsx` (novo), `Frontend/src/test/components/accessRequests/InitialPasswordModal.test.tsx` (novo)
**Depends on**: T4
**Reuses**: `components/common/Modal.tsx`, `components/common/Toast.tsx` (`useToast().show`)
**Requirement**: ACCR-05

**Done when**:
- [ ] ACCR-05 AC9: mostra e-mail, senha e `accessRequests.passwordWarning`; clicar em copiar chama `writeText` com a senha e mostra `accessRequests.copied`; fechar chama `onClose`
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(access-request): add initial password modal`

---

### T9: `AccessRequestCard`

**What**: Card com e-mail, empresa, administrador, data de envio (`formatEventDate`), motivo quando houver, e botões Aceitar/Recusar só quando os handlers vêm.
**Where**: `Frontend/src/components/accessRequests/AccessRequestCard.tsx`
**Files**: `Frontend/src/components/accessRequests/AccessRequestCard.tsx` (novo), `Frontend/src/components/accessRequests/AccessRequestCard.module.css` (novo), `Frontend/src/test/components/accessRequests/AccessRequestCard.test.tsx` (novo)
**Depends on**: T4
**Reuses**: `utils/format.ts` (`formatEventDate`), tokens de `index.css` (sem cor fixa), visual de `components/team/EmployeeCard.module.css`
**Requirement**: ACCR-02, ACCR-07

**Done when**:
- [ ] ACCR-02 AC4: mostra e-mail, empresa, administrador e a data formatada
- [ ] Com `onAccept`/`onReject` mostra os dois botões e cada um chama o seu; sem eles, nenhum botão
- [ ] ACCR-07 AC7: `motivoRecusa` aparece quando existe e não aparece quando ausente
- [ ] `no-hardcoded-colors.test.ts` segue passando
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(access-request): add access request card`

---

### T10: `SolicitacoesPage`

**What**: Página com abas Pendentes/Aprovadas/Recusadas, carga com skeleton, erro com "Tentar novamente", vazio por aba, fluxo de aceite (ConfirmDialog → aprovar → remove → InitialPasswordModal) e de recusa (RejectDialog → recusar → remove), tratamento de 409 conforme `design.md`.
**Where**: `Frontend/src/pages/SolicitacoesPage.tsx`
**Files**: `Frontend/src/pages/SolicitacoesPage.tsx` (novo), `Frontend/src/pages/SolicitacoesPage.module.css` (novo), `Frontend/src/test/pages/SolicitacoesPage.test.tsx` (novo)
**Depends on**: T5, T6, T7, T8, T9
**Reuses**: `pages/EquipePage.tsx` (loadState/attempt/stale/retry), `components/common/PageSkeleton.tsx`, `components/common/Toast.tsx`
**Requirement**: ACCR-02, ACCR-05, ACCR-07

**Done when** (serviço mockado, `ToastProvider` + `MemoryRouter`):
- [ ] ACCR-02 AC4: abre na aba Pendentes (`aria-selected`), chama `listar('pendente')` e mostra os cards
- [ ] ACCR-02 AC5: clicar em Aprovadas chama `listar('aprovada')` e mostra só o retorno dela
- [ ] ACCR-02 AC6: lista vazia mostra `accessRequests.empty.<status>` da aba
- [ ] ACCR-02 AC7: skeleton enquanto a promessa não resolve; rejeição mostra `loadError` + botão "Tentar novamente", que busca de novo
- [ ] ACCR-05 AC9: Aceitar → confirmar chama `aprovar(id)`, o card some de Pendentes e o modal mostra e-mail e `senhaInicial`; cancelar o confirm não chama `aprovar`
- [ ] ACCR-05 AC10: 409 "Já existe um usuário com este e-mail." → toast `conflictEmail`; 409 empresa → `conflictCompany`; 500 → `saveError`; nos três o card fica
- [ ] ACCR-07 AC5/AC6: Recusar → motivo → confirmar chama `recusar(id, motivo)` e o card some; falha → `saveError` e o card fica
- [ ] Edge: 409 "Solicitação já decidida." → toast `alreadyDecided` e `listar` chamado de novo
- [ ] Na aba Recusadas e Aprovadas os cards não têm botões
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(access-request): add access requests admin page`

---

### T11: Rota `/solicitacoes`

**What**: `<Route path="/solicitacoes" element={<SolicitacoesPage />} />` em `appRoutes.tsx`.
**Where**: `Frontend/src/routes/appRoutes.tsx`
**Files**: `Frontend/src/routes/appRoutes.tsx`, `Frontend/src/test/routes/appRoutes.test.tsx`
**Depends on**: T10
**Reuses**: rotas de auth existentes
**Requirement**: ACCR-02

**Done when**:
- [ ] Teste: `/solicitacoes` renderiza a página (aba Pendentes), não o 404
- [ ] Quick gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(access-request): route /solicitacoes`

---

### T12: `/solicitacoes` sem Sidebar e Header

**What**: Adicionar `'/solicitacoes'` em `AUTH_ROUTES` do `App.tsx`.
**Where**: `Frontend/src/App.tsx`
**Files**: `Frontend/src/App.tsx`, `Frontend/src/test/App.test.tsx`
**Depends on**: T11
**Reuses**: teste `hides Sidebar and Header on /solicitar-acesso`
**Requirement**: ACCR-02

**Done when**:
- [ ] ACCR-02 AC8: teste em `/solicitacoes` sem Sidebar e sem Header
- [ ] Build gate do Frontend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(access-request): serve /solicitacoes without app shell`

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da Fase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | None | início da Fase 2 | ✅ Match |
| T5 | None | sem entrada | ✅ Match |
| T6 | None | sem entrada | ✅ Match |
| T7 | T4 | T4 → T7 | ✅ Match |
| T8 | T4 | T4 → T8 | ✅ Match |
| T9 | T4 | T4 → T9 | ✅ Match |
| T10 | T5, T6, T7, T8, T9 | T5/T6/T7/T8/T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Backend schema | unit | unit | ✅ OK |
| T2 | Backend service | unit | unit | ✅ OK |
| T3 | Backend controller / route | unit | unit | ✅ OK |
| T4 | Frontend i18n | unit | unit | ✅ OK |
| T5 | Frontend service | unit | unit | ✅ OK |
| T6 | Frontend component | unit | unit | ✅ OK |
| T7 | Frontend component | unit | unit | ✅ OK |
| T8 | Frontend component | unit | unit | ✅ OK |
| T9 | Frontend component | unit | unit | ✅ OK |
| T10 | Frontend page | unit | unit | ✅ OK |
| T11 | Frontend routes | unit | unit | ✅ OK |
| T12 | Frontend shell | unit | unit | ✅ OK |

## Requirement Coverage

| Requirement | Tasks |
| ----------- | ----- |
| ACCR-01 | T2, T3 |
| ACCR-02 | T5, T9, T10, T11, T12 |
| ACCR-03 | T1, T2, T3 |
| ACCR-04 | T2, T3 |
| ACCR-05 | T5, T6, T8, T10 |
| ACCR-06 | T1, T2, T3 |
| ACCR-07 | T5, T7, T9, T10 |
| ACCR-08 | T4 |

## Phase Execution Map

- Worker backend: T1, T2, T3 (Fase 1).
- Worker front A: T4, T7, T8, T9 (Fase 2).
- Worker front B (opcional): T5, T6 (Fase 2, sem dependências).
- Depois de A e B: T10, T11, T12.

Fase 1 e Fase 2 em paralelo; nenhum arquivo é editado por dois workers. Depois das duas, o Verifier roda uma vez sobre a feature inteira.
