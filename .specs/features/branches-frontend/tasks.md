# Seletor de filial no front Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Regra do banco (global do dono):** nenhuma tarefa, teste ou gate acessa o banco nem sobe o Backend. Toda chamada de API é mockada nos testes (`vi.mock` de `api` ou do service).

---

**Spec**: `.specs/features/branches-frontend/spec.md` (sem `design.md`: a abordagem está nas Assumptions do spec)
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none (`docs/arquitetura.md` descreve a arquitetura, sem regras de teste) - strong defaults applied; `Frontend/src/test/**` sampled as the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Frontend service / HTTP client | unit | Request path, params and payload; error propagates; interceptor branches | `Frontend/src/test/services/*.test.ts` | `cd Frontend && npx vitest run <arquivo>` |
| Frontend context / hook | unit | Every spec AC and edge case, API mocked | `Frontend/src/test/context/*.test.tsx` | `cd Frontend && npx vitest run <arquivo>` |
| Frontend component | unit | Every spec AC and edge case for the component; services mocked | `Frontend/src/test/components/**/*.test.tsx` | `cd Frontend && npx vitest run <arquivo>` |
| Frontend page | unit | Every spec AC and edge case for the page; service mocked | `Frontend/src/test/pages/*.test.tsx` | `cd Frontend && npx vitest run <arquivo>` |
| Frontend locales | unit | Keys present in all 7 languages (existing parity test) | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && npx vitest run src/test/config/i18n.test.ts` |

Frontend commands need Node 22: prefix with `PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH` (the default `node` is 20 and fails with `ERR_REQUIRE_ESM`).

## Gate Check Commands

> Generated from codebase - confirm before Execute. Baseline before this feature: Frontend 941 passed, 0 failed, `tsc -b` and `eslint .` clean.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | The row's Run Command above for the task's test file |
| Full | After tasks with e2e/integration tests | Not used: this feature has no integration tests |
| Build | After phase completion | `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH sh -c 'npx tsc -b && npx eslint . && npx vitest run'` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Sessão e filial ativa

```
T1 → T2 → T3
T1 → T3
```

### Phase 2: Consumidores independentes

```
T4
T3 → T5
T6
```

### Phase 3: Seletor na Sidebar

```
T7 → T8
T2 → T7
T3 → T7
T6 → T7
```

---

## Task Breakdown

### T1: Session type with scope

**What**: `UsuarioLogado` com `empresa`, `escopo`, `filiais` (tipo `Filial`) e opcionais `telefone`, `cargo`; `authService.getSession()` (usuário salvo ou `null`, JSON inválido vira `null`) e `authService.saveBranches(filiais)`.
**Where**: `Frontend/src/services/authService.ts`
**Depends on**: None
**Reuses**: Existing `authService` shape and `Frontend/src/test/services/authService.test.ts`
**Requirement**: BRF-01, BRF-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `getSession()` devolve o usuário de `localStorage['user']`, ou `null` sem ele, com JSON inválido ou com storage que lança (Edge: JSON inválido; AC7 da sessão)
- [x] `saveBranches(filiais)` reescreve só `filiais` no usuário salvo e não faz nada sem usuário
- [x] Os testes existentes de `authService` seguem com as mesmas asserções
- [x] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/services/authService.test.ts`
- [x] Test count: os testes existentes mais ao menos 4 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(auth): add scope and branches to the session user`

---

### T2: Branch service

**What**: `branchService` com `listar`, `criar(nome)`, `renomear(id, nome)` e `remover(id)` sobre `/branches`.
**Where**: `Frontend/src/services/branchService.ts`
**Depends on**: T1
**Reuses**: `Frontend/src/services/machineService.ts` and `Frontend/src/test/services/machineService.test.ts`
**Requirement**: BRF-06, BRF-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `listar` chama `GET /branches` e devolve `Filial[]`
- [x] `criar` chama `POST /branches` com `{ nome }`; `renomear` chama `PUT /branches/<id>` com `{ nome }`; `remover` chama `DELETE /branches/<id>`
- [x] A rejeição da API se propaga nas quatro funções (o 409 chega ao chamador)
- [x] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/services/branchService.test.ts`
- [x] Test count: ao menos 5 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): add branch service`

---

### T3: Active branch provider

**What**: `ActiveBranchProvider` e `useActiveBranch()` com `user`, `branches`, `activeBranch`, `setActiveBranch`, `canManage`, `showAll`, `createBranch`, `renameBranch`, `removeBranch`; valor padrão sem provider; ligado em `main.tsx`.
**Where**: `Frontend/src/context/ActiveBranchContext.tsx`
**Depends on**: T1, T2
**Reuses**: `Frontend/src/components/common/Toast.tsx` (padrão context + provider + hook), `readStoredCollapsed` do Sidebar (padrão try/catch no storage)
**Requirement**: BRF-02, BRF-06, BRF-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `activeBranch` é o id guardado em `liftech.activeBranch` quando pertence às filiais do usuário; senão `'todas'` (AC2, AC3 da sessão)
- [x] Usuário `escopo: 'filiais'` com 1 filial tem essa filial ativa mesmo com `'todas'` guardado (AC4)
- [x] `setActiveBranch` grava em `liftech.activeBranch` e muda o valor exposto (AC5)
- [x] Sem usuário ou com `localStorage` que lança: `'todas'`, sem filiais, sem erro (AC7, AC8)
- [x] `showAll` é verdadeiro para `escopo: 'empresa'` ou 2 ou mais filiais; `canManage` só para `escopo: 'empresa'`
- [x] `createBranch`, `renameBranch` e `removeBranch` chamam o `branchService`, refazem `listar`, gravam o resultado com `saveBranches` e a lista exposta atualiza; excluir a filial ativa volta a `'todas'` (AC6, Edge)
- [x] Sem provider, `useActiveBranch()` devolve `'todas'` e nenhum usuário (suíte atual da Visão Geral e da Sidebar continua verde)
- [x] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/context/ActiveBranchContext.test.tsx`
- [x] Test count: ao menos 12 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): add active branch provider`

---

### T4: Invalid session on 401

**What**: Interceptor de resposta em `api.ts`: 401 fora de `/auth/login` e fora das rotas de autenticação chama `authService.logout()` e navega para `/login` por `history.pushState` + `popstate`; sempre rejeita com o mesmo erro.
**Where**: `Frontend/src/services/api.ts`
**Depends on**: None
**Reuses**: `AUTH_ROUTES` de `Frontend/src/App.tsx` (mesma lista, copiada em `api.ts` porque `api.ts` não pode importar o `App`)
**Requirement**: BRF-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 401 de `/machines` em `/`: `token` e `user` removidos do `localStorage` e `window.location.pathname` vira `/login` (AC1)
- [x] 401 de `/auth/login`: nada é limpo e a rota não muda (AC2)
- [x] 401 estando em `/login`, `/login/colaborador` ou `/solicitar-acesso`: a rota não muda (AC3)
- [x] A promessa rejeita com o mesmo erro em todos os casos (AC4)
- [x] 403, 409 e 500 não chamam `logout` (AC5)
- [x] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/services/api.test.ts`
- [x] Test count: ao menos 6 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(auth): end the session on a 401 response`

---

### T5: Visão Geral follows the active branch

**What**: `machineService.listar(filialId?)` envia `params: { filialId }` só quando há id; a Visão Geral busca com a filial ativa, volta ao skeleton e busca de novo quando ela muda, e descarta resposta de filial anterior.
**Where**: `Frontend/src/pages/VisaoGeralPage.tsx`
**Depends on**: T3
**Reuses**: `Frontend/src/services/machineService.ts`, existing `VisaoGeralPage.test.tsx` e `machineService.test.ts`
**Requirement**: BRF-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `listar()` chama `api.get('/machines')` sem segundo argumento e `listar('f2')` chama com `{ params: { filialId: 'f2' } }` (AC1, AC2 da Visão Geral)
- [x] Com `'todas'` ativa a página chama `listar(undefined)`; com id ativo chama `listar(id)` (AC3, AC4)
- [x] Ao mudar a filial ativa, a página mostra o skeleton com `aria-busy="true"` e chama `listar` com o novo id (AC5)
- [x] Resposta lenta de uma filial anterior não substitui a da filial atual (AC6)
- [x] Erro e "Tentar novamente" seguem funcionando, e usam a filial ativa (AC7)
- [x] Os testes existentes de `VisaoGeralPage` e `machineService` seguem com as mesmas asserções
- [x] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/pages/VisaoGeralPage.test.tsx src/test/services/machineService.test.ts`
- [x] Test count: os testes existentes mais ao menos 5 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(machines): filter Visão Geral by the active branch`

---

### T6: Branch texts in 7 languages

**What**: Chaves `branches.*` (rótulo, "todas", gerenciar, concluir, criar, nome, confirmar, cancelar via `common`, renomear, excluir, título e mensagem da exclusão, erros) nos 7 idiomas.
**Where**: `Frontend/src/locales/pt-BR/translation.json`
**Depends on**: None
**Reuses**: Existing keys and `Frontend/src/test/config/i18n.test.ts`
**Requirement**: BRF-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] pt-BR: "Filiais", "Todas as filiais", "Gerenciar Filiais", "Criar Filial", "Nome da filial", "Confirmar" e os avisos do spec com o texto exato
- [x] en-US: "Branches" e "All branches"
- [x] As chaves `branches.*` existem nos 7 idiomas com o mesmo conjunto, com texto traduzido (não cópia do pt-BR)
- [x] Teste de paridade exige o módulo `branches` nos 7 idiomas
- [x] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/config/i18n.test.ts`
- [x] Test count: os testes existentes mais ao menos 2 novos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(i18n): add branch selector texts`

---

### T7: Branch selector component

**What**: `BranchSelector` com botão, popup `listbox`, opção "Todas as filiais", gerenciar (renomear inline, excluir com `ConfirmDialog` em portal), criar inline, avisos `role="alert"`, Escape e clique fora, modo colapsado; mais o CSS Module.
**Where**: `Frontend/src/components/layout/BranchSelector.tsx`
**Depends on**: T2, T3, T6
**Reuses**: `Frontend/src/components/layout/Header.tsx` (popover com Escape e clique fora), `Frontend/src/components/common/ConfirmDialog.tsx`, tokens de `index.css`
**Requirement**: BRF-03, BRF-04, BRF-06, BRF-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Botão com o rótulo "Filiais" e o nome da filial ativa; abre `listbox` com uma opção por filial e a ativa com `aria-selected="true"` (AC1, AC2 do seletor)
- [ ] "Todas as filiais" aparece só com `showAll` (AC3, AC4); clicar numa opção chama `setActiveBranch` e fecha (AC5)
- [ ] Escape e clique fora fecham (AC6); sem usuário nada é renderizado (AC8); lista vazia abre sem erro (Edge)
- [ ] Colapsado: só a inicial do nome, com `aria-label` e `title` com o nome (AC7)
- [ ] "Gerenciar Filiais" e "Criar Filial" só com `canManage` (AC1, AC2 de gerenciar)
- [ ] Criar: campo "Nome da filial" com "Confirmar" (desabilitado se vazio) e "Cancelar"; confirmar chama `createBranch` com o nome cortado; cancelar não chama (AC3 a AC6, Edge)
- [ ] Gerenciar: por filial "Renomear <nome>" (campo preenchido, `renameBranch`) e "Excluir <nome>" (`ConfirmDialog`, `removeBranch`) (AC7 a AC10)
- [ ] 409 mostra o aviso de matriz/recursos, criar ou renomear com erro mostra o aviso de salvar e mantém o campo, outro erro de exclusão mostra o aviso de excluir (AC11 a AC13)
- [ ] Em en-US o rótulo é "Branches" e a opção "All branches" (BRF-09 AC2)
- [ ] Gate: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH npx vitest run src/test/components/layout/BranchSelector.test.tsx`
- [ ] Test count: ao menos 22 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(branches): add branch selector component`

---

### T8: Sidebar shows the selector and the company

**What**: A Sidebar renderiza o `BranchSelector` abaixo do logo e, no rodapé, a linha com ícone de usuário e o nome da empresa (só ícone com `aria-label` e `title` quando colapsada).
**Where**: `Frontend/src/components/layout/Sidebar.tsx`
**Depends on**: T7
**Reuses**: `Frontend/src/components/layout/Sidebar.module.css` (footer, feedbackButton), existing `Sidebar.test.tsx`
**Requirement**: BRF-03, BRF-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com usuário na sessão, o seletor aparece entre o logo e a lista de páginas; sem usuário, a Sidebar fica como hoje (AC8 do seletor)
- [ ] Rodapé mostra o ícone e o nome da empresa (AC1 da empresa); colapsada, só o ícone com `aria-label` e `title` iguais ao nome (AC2); sem usuário, sem a linha (AC3)
- [ ] A Sidebar colapsada passa `collapsed` ao seletor
- [ ] Os testes existentes de `Sidebar` e `App` seguem com as mesmas asserções (em especial `getByRole('list')` único)
- [ ] Gate: Build completo do Frontend (`tsc -b`, `eslint .`, `vitest run`)
- [ ] Test count: os 941 testes de baseline mais os novos das tarefas anteriores passam, sem remover nenhum

**Tests**: unit
**Gate**: build

**Commit**: `feat(branches): show the branch selector and company in the sidebar`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2 ------→ T3
Phase 2:  T4
Phase 2:  T5
Phase 2:  T6
Phase 3:  T7 ------→ T8
```

Cross-phase dependencies (T3 → T5, T2 → T7, T3 → T7, T6 → T7) are listed in each task's `Depends on`. Execution is strictly sequential. 8 tasks fit one batch, so execution is inline with no sub-agents.

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1, T2 | T1 → T3, T2 → T3 | ✅ Match |
| T4 | None | none | ✅ Match |
| T5 | T3 (earlier phase) | T3 → T5 | ✅ Match |
| T6 | None | none | ✅ Match |
| T7 | T2, T3, T6 (earlier phases) | T2 → T7, T3 → T7, T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: session type | Frontend service | unit | unit | ✅ OK |
| T2: branch service | Frontend service | unit | unit | ✅ OK |
| T3: provider | Frontend context / hook | unit | unit | ✅ OK |
| T4: 401 interceptor | Frontend service / HTTP client | unit | unit | ✅ OK |
| T5: Visão Geral | Frontend page + service | unit | unit | ✅ OK |
| T6: locales | Frontend locales | unit | unit | ✅ OK |
| T7: selector | Frontend component | unit | unit | ✅ OK |
| T8: Sidebar | Frontend component | unit | unit | ✅ OK |
