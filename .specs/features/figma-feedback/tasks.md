# Feedback e Sugestões Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Commits:** sem commit (decisão do dono). Cada task termina com o gate verde e o `tasks.md` marcado; o nível 1 integra o diff na branch `fix/crud-funcionario-integridade`.

---

**Design**: `.specs/features/figma-feedback/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `Backend/package.json` (`test` = só `tests/unit`; `tests/integration` toca o banco e fica fora), `.specs/STATE.md` (AD-010: models mockados, 0 acesso ao banco), `.specs/features/telas-figma-faltantes/contexto.md` (Node 25 no Frontend). Amostras: `Backend/tests/unit/{schemas,incidentController,incidentService,app}.test.ts`, `Frontend/src/test/{services/incidentService,components/layout/Sidebar,pages/employee/EmployeeSettingsPage,config/i18n}.test.*`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema | unit | `validate()` dos obrigatórios e do `maxlength`, sem banco | `Backend/tests/unit/schemas.test.ts` | `cd Backend && npx vitest run tests/unit/schemas.test.ts` |
| Backend service | unit | 1:1 aos ACs, `Feedback` mockado | `Backend/tests/unit/feedbackService.test.ts` | `cd Backend && npx vitest run tests/unit/feedbackService.test.ts` |
| Backend controller / router | unit | 201 + cada 400 (faltando, não texto, vazio, só espaços, 1001) + limite 1000 + campos extras ignorados + rota POST `/` registrada; service mockado | `Backend/tests/unit/feedbackController.test.ts` | `cd Backend && npx vitest run tests/unit/feedbackController.test.ts` |
| Backend app (montagem) | unit | 401 sem token em `POST /api/feedback`, sem banco | `Backend/tests/unit/app.test.ts` | `cd Backend && npx vitest run tests/unit/app.test.ts` |
| Frontend service | unit | URL, método e corpo; `api` mockado | `Frontend/src/test/services/feedbackService.test.ts` | `cd Frontend && npx vitest run src/test/services/feedbackService.test.ts` |
| Frontend component / page | unit (Testing Library) | cada AC visível + erro + envio duplo; serviço mockado | `Frontend/src/test/{components,pages}/**` | `cd Frontend && npx vitest run src/test/<caminho>` |
| Frontend i18n | unit | paridade nos 7 idiomas | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && npx vitest run src/test/config/i18n.test.ts` |
| Backend router / wiring | unit | coberto no teste do controller (rota) e do app (montagem) | `Backend/tests/unit/*.test.ts` | ver linhas acima |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Frontend precisa de `export PATH=$HOME/.nvm/versions/node/v25.9.0/bin:$PATH`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | Backend: `cd Backend && npx vitest run <arquivo>`; Frontend: `cd Frontend && npx vitest run <arquivo>` |
| Full | After the last task of each phase | Backend: `cd Backend && yarn test`; Frontend: `cd Frontend && yarn test` |
| Build | After phase completion | Backend: `cd Backend && yarn build && yarn test`; Frontend: `cd Frontend && yarn lint && yarn build && yarn test` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Frontend

```
T6 → T7 → T8 → T9 → T10
```

---

## Task Breakdown

### T1: Schema `Feedback`

**What**: Criar o model `feedback` com `mensagem` (obrigatória, `trim`, `maxlength: 1000`), `usuarioId` (obrigatório, ref `user`), `empresaId` (ref `company`, opcional), `role` (obrigatório) e `criadoEm` (default `Date.now`).
**Where**: `Backend/src/schemas/feedback.ts`
**Depends on**: None
**Reuses**: formato de `Backend/src/schemas/incident.ts`; teste em `Backend/tests/unit/schemas.test.ts` (novo `describe('schema feedback')`)
**Requirement**: FDB-01, FDB-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Documento vazio falha em `mensagem`, `usuarioId` e `role`; documento completo sem `empresaId` passa
- [ ] `mensagem` de 1001 caracteres falha; de 1000 passa; `'  oi  '` vira `'oi'`
- [ ] `criadoEm` vem preenchido por padrão
- [ ] Gate check passes: `cd Backend && npx vitest run tests/unit/schemas.test.ts`

**Tests**: unit
**Gate**: quick

---

### T2: Service `enviar` (backend)

**What**: `enviar(usuario, escopo, mensagem)` cria o documento com `usuarioId = usuario._id`, `role = usuario.role`, `empresaId = escopo.empresaId ?? null` e devolve `{ _id, criadoEm }` (ISO).
**Where**: `Backend/src/feature/feedback/feedbackService.ts`
**Depends on**: T1
**Reuses**: tipos `UsuarioRequisicao` (`core/autenticar.ts`) e `Escopo` (`core/escopo.ts`); mock no estilo de `incidentService.test.ts`
**Requirement**: FDB-01, FDB-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste: `Feedback.create` recebe exatamente `{ mensagem, usuarioId, empresaId, role }` para admin e para colaborador
- [ ] Teste: escopo sem `empresaId` grava `empresaId: null`
- [ ] Teste: retorno é `{ _id: string, criadoEm: string ISO }`
- [ ] Gate check passes: `cd Backend && npx vitest run tests/unit/feedbackService.test.ts`

**Tests**: unit
**Gate**: quick

---

### T3: Controller `enviar`

**What**: `lerMensagem(req)` valida `req.body.mensagem` (texto, 1 a 1000 depois do `trim`) e lança `ErroHttp(400, "O campo 'mensagem' deve ter de 1 a 1000 caracteres.")`; `enviar(req, res)` chama o service com `req.usuario`, `req.escopo` e a mensagem cortada e responde 201.
**Where**: `Backend/src/feature/feedback/feedbackController.ts`
**Depends on**: T2
**Reuses**: `incidentController.ts` (`lerOcorrencia`, `respostaSucesso`, `responderErro`); teste no estilo de `incidentController.test.ts`
**Requirement**: FDB-01, FDB-02, FDB-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste: `{ mensagem: '  Ótimo app  ' }` → service com `'Ótimo app'` e status 201 com o retorno do service
- [ ] Teste: 1000 caracteres → 201; 1001 → 400
- [ ] Teste: corpo vazio, `mensagem: 42`, `''` e `'   '` → 400 com a mensagem exata e service não chamado
- [ ] Teste: corpo com `usuarioId`, `empresaId` e `role` falsos → service recebe o `req.usuario` e o `req.escopo` originais
- [ ] Teste: erro do service → 500
- [ ] Gate check passes: `cd Backend && npx vitest run tests/unit/feedbackController.test.ts`

**Tests**: unit
**Gate**: quick

---

### T4: Router `feedback`

**What**: `router.post('/', enviar)` exportado por padrão.
**Where**: `Backend/src/feature/feedback/feedbackRouter.ts`
**Depends on**: T3
**Reuses**: `incidentRouter.ts`
**Requirement**: FDB-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste em `feedbackController.test.ts`: a pilha do router tem `POST /` ligado a `enviar` (mesmo jeito do `incidentController.test.ts`)
- [ ] Gate check passes: `cd Backend && npx vitest run tests/unit/feedbackController.test.ts`

**Tests**: unit
**Gate**: quick

---

### T5: Montar `/api/feedback` no app

**What**: Import do router e `app.use('/api/feedback', feedbackRouter);` depois de `app.use('/api', autenticar)`. Só essa linha e o import (arquivo disputado com `figma-perfil-admin`).
**Where**: `Backend/src/app.ts`
**Depends on**: T4
**Reuses**: `Backend/tests/unit/app.test.ts` (servidor na porta 0, sem banco)
**Requirement**: FDB-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste em `app.test.ts`: `POST /api/feedback` sem `Authorization` → 401 e `Feedback.create` (mockado) não chamado
- [ ] Teste em `app.test.ts`: com token válido e `{ mensagem: 'oi' }` → 201 (schema `feedback` mockado)
- [ ] Gate check passes: `cd Backend && yarn build && yarn test`

**Tests**: unit
**Gate**: build

---

### T6: Textos nos 7 locales

**What**: Acrescentar o bloco `feedback` (`title`, `question`, `placeholder`, `send`, `sent`, `error`) e a chave `employee.settings.feedbackPlaceholder` em `de`, `en-US`, `es`, `fr`, `ja`, `pt-BR` e `ru`, sem alterar nenhuma chave existente. Textos pt-BR no `design.md`.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Reuses**: teste de paridade existente em `Frontend/src/test/config/i18n.test.ts`
**Requirement**: FDB-19, FDB-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste novo em `i18n.test.ts`: os 7 locales têm `feedback` com as mesmas 6 chaves do pt-BR, todas não vazias
- [ ] Teste novo: os 7 locales têm `employee.settings.feedbackPlaceholder` não vazio (a paridade de `employee.settings` já existente continua verde)
- [ ] Gate check passes: `cd Frontend && npx vitest run src/test/config/i18n.test.ts`

**Tests**: unit
**Gate**: quick

---

### T7: `feedbackService` (front)

**What**: `feedbackService.enviar(mensagem)` faz `api.post('/feedback', { mensagem })` e resolve `void`.
**Where**: `Frontend/src/services/feedbackService.ts`
**Depends on**: T6
**Reuses**: `Frontend/src/services/incidentService.ts`; mock de `api` como em `src/test/services/incidentService.test.ts`
**Requirement**: FDB-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste: chama `api.post('/feedback', { mensagem: 'oi' })`
- [ ] Teste: rejeição do `api.post` propaga
- [ ] Gate check passes: `cd Frontend && npx vitest run src/test/services/feedbackService.test.ts`

**Tests**: unit
**Gate**: quick

---

### T8: `FeedbackModal`

**What**: Componente do Figma `06/01` sobre o `Modal`: rótulo, textarea (`autoFocus`, `maxLength=1000`), botão "Enviar" (`buttons.confirm`) desabilitado sem texto ou durante o envio; sucesso → toast + `onClose`; erro → toast de erro e texto mantido. CSS em `FeedbackModal.module.css` com os valores do textarea de Configurações (altura ~140 px).
**Where**: `Frontend/src/components/feedback/FeedbackModal.tsx`
**Depends on**: T7
**Reuses**: `Modal`, `DialogButtons.module.css`, `useToast`
**Requirement**: FDB-05, FDB-06, FDB-07, FDB-08, FDB-09, FDB-10, FDB-11, FDB-12

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (só para conferir com o PNG)

**Done when**:

- [ ] Teste: mostra o título, o rótulo, o placeholder e o botão "Enviar" em pt-BR
- [ ] Teste: textarea recebe o foco ao montar
- [ ] Teste: "Enviar" desabilitado com `''` e com `'   '`; submit pelo Enter do form não chama o serviço
- [ ] Teste: com `'  ideia  '`, clique chama `enviar('ideia')`, mostra "Feedback enviado. Obrigado!" e chama `onClose`
- [ ] Teste: serviço rejeita → toast de erro, `onClose` não chamado, texto continua no textarea e o botão volta a habilitar
- [ ] Teste: dois cliques rápidos com promessa pendente → 1 chamada
- [ ] Teste: X e Esc chamam `onClose` sem chamar o serviço
- [ ] Teste: textarea tem `maxLength` 1000
- [ ] Gate check passes: `cd Frontend && npx vitest run src/test/components/feedback/FeedbackModal.test.tsx`

**Tests**: unit
**Gate**: quick

---

### T9: Abrir o modal pela Sidebar

**What**: Estado `feedbackOpen`, `onClick` no botão "Feedback & Sugestões" que fecha o drawer mobile e abre o modal; `FeedbackModal` via `React.lazy` + `Suspense fallback={null}`. Mexe só no trecho do botão e no estado novo (arquivo disputado com `figma-dashboard` e `figma-modal-alerta`).
**Where**: `Frontend/src/components/layout/Sidebar.tsx`
**Depends on**: T8
**Reuses**: `closeMobileDrawer` já existente; `lazy` como em `routes/appRoutes.tsx`
**Requirement**: FDB-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste em `Sidebar.test.tsx`: clicar no botão abre o diálogo "Envie-nos feedback ou uma sugestão" (com `findByRole`, por causa do lazy)
- [ ] Teste: com a sidebar recolhida, o botão só-ícone também abre o modal
- [ ] Teste: fechar pelo X remove o diálogo
- [ ] Testes existentes da Sidebar continuam verdes
- [ ] Gate check passes: `cd Frontend && yarn lint && yarn build && yarn test`; o chunk de entrada do `vite build` cresce no máximo 0,5 kB gzip

**Tests**: unit
**Gate**: build

---

### T10: Enviar pela caixa de Configurações do funcionário

**What**: Textarea controlado com `maxLength=1000`, placeholder `employee.settings.feedbackPlaceholder`, botão "Enviar" (`feedback.send`) abaixo e à direita, mesma regra de `disabled`; sucesso → toast e caixa limpa; erro → toast de erro e texto mantido. Classe `.send` nova em `EmployeeSettingsPage.module.css`.
**Where**: `Frontend/src/pages/employee/EmployeeSettingsPage.tsx`
**Depends on**: T9
**Reuses**: `feedbackService`, `useToast`, `DialogButtons.module.css` (`.confirm`)
**Requirement**: FDB-13, FDB-14, FDB-15, FDB-16, FDB-17, FDB-18, FDB-19

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste em `EmployeeSettingsPage.test.tsx`: botão "Enviar" visível abaixo da caixa
- [ ] Teste: placeholder é "Digite uma sugestão de melhoria ou um feedback!" (não a chave)
- [ ] Teste: `'   '` deixa "Enviar" desabilitado e o serviço não é chamado
- [ ] Teste: `' boa '` → `enviar('boa')`, toast de sucesso e caixa vazia
- [ ] Teste: serviço rejeita → toast de erro e texto mantido
- [ ] Teste: dois cliques com promessa pendente → 1 chamada
- [ ] Teste: caixa tem `maxLength` 1000
- [ ] Testes existentes da página continuam verdes
- [ ] Gate check passes: `cd Frontend && yarn lint && yarn build && yarn test`

**Tests**: unit
**Gate**: build

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 → T2 → T3 → T4 → T5
Phase 2:  T6 → T7 → T8 → T9 → T10
```

10 tasks → 2 lotes no Execute (Fase 1 | Fase 2); oferecer sub-agentes antes de começar.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Schema | 1 arquivo | ✅ Granular |
| T2: Service | 1 função | ✅ Granular |
| T3: Controller | 1 handler + validação | ✅ Granular |
| T4: Router | 1 rota | ✅ Granular |
| T5: Montagem no app | 1 linha | ✅ Granular |
| T6: Locales | mesmo bloco em 7 arquivos irmãos | ⚠️ OK, coeso (uma mudança só, repetida por idioma) |
| T7: Service front | 1 função | ✅ Granular |
| T8: FeedbackModal | 1 componente (+ CSS módulo) | ✅ Granular |
| T9: Sidebar | 1 trecho | ✅ Granular |
| T10: Configurações | 1 seção da página (+ 1 classe CSS) | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da Fase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | None | início da Fase 2 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Backend schema | unit | unit | ✅ OK |
| T2 | Backend service | unit | unit | ✅ OK |
| T3 | Backend controller | unit | unit | ✅ OK |
| T4 | Backend router | unit | unit | ✅ OK |
| T5 | Backend app (montagem) | unit | unit | ✅ OK |
| T6 | Frontend i18n | unit | unit | ✅ OK |
| T7 | Frontend service | unit | unit | ✅ OK |
| T8 | Frontend component | unit | unit | ✅ OK |
| T9 | Frontend component | unit | unit | ✅ OK |
| T10 | Frontend page | unit | unit | ✅ OK |

## Requirement → Task

| Requirement | Tasks |
| ----------- | ----- |
| FDB-01 | T1, T2, T3, T4 |
| FDB-02 | T1, T3 |
| FDB-03 | T5 |
| FDB-04 | T2, T3 |
| FDB-05 | T8, T9 |
| FDB-06 | T8 |
| FDB-07 | T8 |
| FDB-08 | T8 |
| FDB-09 | T8 |
| FDB-10 | T8 |
| FDB-11 | T8 |
| FDB-12 | T8 |
| FDB-13 | T10 |
| FDB-14 | T10 |
| FDB-15 | T10 |
| FDB-16 | T10 |
| FDB-17 | T10 |
| FDB-18 | T10 |
| FDB-19 | T6, T10 |
| FDB-20 | T6 |
