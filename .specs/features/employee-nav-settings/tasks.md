# Menu de 3 ícones e tela de Configurações do funcionário Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Regra do banco (global do dono):** nenhuma tarefa, teste, gate ou Verifier acessa o banco. Os gates do Backend rodam `tests/unit/<arquivo>` explícito, nunca `yarn test` (que inclui `tests/integration`, que conecta ao Mongo).

---

**Spec**: `.specs/features/employee-nav-settings/spec.md` (sem `design.md`: a abordagem está nas Assumptions do spec)
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none (`docs/arquitetura.md` descreve a arquitetura, sem regras de teste) - strong defaults applied; `Backend/tests/unit/*` and `Frontend/src/test/**` sampled as the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema (`src/schemas`) | none | - (build gate only) | - | `cd Backend && npx tsc --noEmit` |
| Backend model / repository / rules | unit | All branches; 1:1 to spec ACs; every listed edge case | `Backend/tests/unit/<nome>.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend controller | unit | Happy path + each error path, with the service mocked | `Backend/tests/unit/<nome>Controller.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Controller.test.ts` |
| Backend service (`authService`) | unit | All branches; 1:1 to spec ACs; every listed edge case | `Backend/tests/unit/authService.test.ts` | `cd Backend && npx vitest run tests/unit/authService.test.ts` |
| Frontend type (`authService.ts` interface) | none | - (build gate only) | - | `cd Frontend && npx tsc -b` |
| Frontend component | unit | Every spec AC and edge case for the component | `Frontend/src/test/components/employee/*.test.tsx` | `cd Frontend && npx vitest run <arquivo>` |
| Frontend page | unit | Every spec AC and edge case for the page; no network | `Frontend/src/test/pages/employee/*.test.tsx` | `cd Frontend && npx vitest run <arquivo>` |
| Frontend styles (CSS Module) | unit (static) | Tokens only, no hex colors (existing `no-hardcoded-colors`) | `Frontend/src/test/styles/*.test.ts` | `cd Frontend && npx vitest run src/test/styles` |
| Frontend locales | unit | Keys present in the locales that carry the screen, parity with pt-BR | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && npx vitest run src/test/config/i18n.test.ts` |

Frontend commands need Node 22: prefix with `PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH` (the default `node` is 20 and fails with `ERR_REQUIRE_ESM`).

## Gate Check Commands

> Generated from codebase - confirm before Execute. Baseline: Backend `tests/unit` = 54 passed (7 files), `tsc --noEmit` clean. Frontend = 3 old failures (`34 min`/`0 min` vs `N minutos`), `tsc -b` and `eslint` clean.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | The row's Run Command above for the task's test file |
| Full | After tasks with e2e/integration tests | Not used: no integration tests (the ones in `Backend/tests/integration` touch the database) |
| Build | After phase completion or config/schema-only tasks | Backend: `cd Backend && npx tsc --noEmit && npx vitest run tests/unit`. Frontend: `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH sh -c 'npx tsc -b && npx eslint . && npx vitest run'` (only the 3 old failures) |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Telefone e cargo no usuário (Backend)

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Menu e Configurações (Frontend)

```
T7 → T8 → T9 → T10 → T11
```

---

## Task Breakdown

### T1: Add telefone and cargo to the user schema

**What**: Campos `telefone` e `cargo`, texto com `trim`, opcionais, no schema `user`.
**Where**: `Backend/src/schemas/user.ts`
**Depends on**: None
**Reuses**: Existing field style in the same schema
**Requirement**: USR-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Os dois campos existem, `String` com `trim: true`, sem `required` (AC1)
- [x] `npx tsc --noEmit` continua limpo

**Tests**: none
**Gate**: build

**Commit**: `feat(user): add telefone and cargo to the user schema`

---

### T2: Carry telefone and cargo in userModel

**What**: Parâmetros opcionais `telefone` e `cargo` depois de `id`, getters, e `obterDados()` com os dois só quando existem.
**Where**: `Backend/src/models/userModel.ts`
**Depends on**: T1
**Reuses**: O padrão `...(this.id ? { _id: this.id } : {})` do mesmo arquivo
**Requirement**: USR-01, USR-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `new userModel(nome, role, id)` continua válido e `obterDados()` sem `telefone`/`cargo` (AC6)
- [ ] Com `telefone` e `cargo`, `obterDados()` devolve os dois (AC2, AC4)
- [ ] Gate check passes: `cd Backend && npx vitest run tests/unit/userModel.test.ts`
- [ ] Test count: ao menos 3 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(user): carry telefone and cargo in userModel`

---

### T3: Validate telefone and cargo as optional text

**What**: Regras `telefone` e `cargo` que aceitam ausente e exigem texto quando presentes.
**Where**: `Backend/src/feature/user/userRules.ts`
**Depends on**: T2
**Reuses**: As regras opcionais de `Backend/src/feature/forklift/forkliftRules.ts`
**Requirement**: USR-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Ausente (`undefined`) é válido (AC6)
- [ ] Texto é válido; número, objeto e `null` geram erro de validação (AC3)
- [ ] Gate check passes: `cd Backend && npx vitest run tests/unit/userRules.test.ts`
- [ ] Test count: ao menos 6 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(user): validate telefone and cargo as optional text`

---

### T4: Read telefone and cargo in the user repository

**What**: `converterParaModelo` repassa `telefone` e `cargo` do documento para o `userModel`.
**Where**: `Backend/src/feature/user/userRepository.ts`
**Depends on**: T3
**Reuses**: O próprio `converterParaModelo`
**Requirement**: USR-01, USR-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Documento com os dois campos vira modelo cujo `obterDados()` os devolve (AC2, AC4)
- [ ] Documento sem eles (usuário antigo) vira modelo sem erro e sem os campos (AC6)
- [ ] Gate check passes: `cd Backend && npx vitest run tests/unit/userRepository.test.ts`
- [ ] Test count: ao menos 2 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(user): read telefone and cargo in the user repository`

---

### T5: Persist telefone and cargo in POST and PUT /api/users

**What**: `criar` valida e grava `telefone`/`cargo`; `atualizar` valida os dois quando vêm no corpo.
**Where**: `Backend/src/feature/user/userController.ts`
**Depends on**: T4
**Reuses**: `regras.check` já usado em `criar`
**Requirement**: USR-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `POST` com `telefone` e `cargo` chama o serviço com um modelo que os contém e responde 201 com os dois (AC2)
- [ ] `POST` ou `PUT` com `telefone` ou `cargo` não texto responde 400 com a mensagem de validação e não chama o serviço (AC3)
- [ ] `PUT` com `telefone` ou `cargo` repassa o campo ao serviço e responde 200 com o valor atualizado (AC4)
- [ ] `POST` sem os campos continua 201 (AC6)
- [ ] Gate check passes: `cd Backend && npx vitest run tests/unit/userController.test.ts`
- [ ] Test count: ao menos 6 testes passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(user): persist telefone and cargo in POST and PUT /api/users`

---

### T6: Return telefone and cargo in the login response

**What**: O `user` de `login()` inclui `telefone` e `cargo` quando existem no usuário.
**Where**: `Backend/src/feature/auth/authService.ts`
**Depends on**: T5
**Reuses**: O `user` já montado em `login()`
**Requirement**: USR-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Usuário com os dois campos: `user` os traz (AC5)
- [ ] Usuário sem eles: `user` continua `{ _id, nome, role }` sem erro (AC6); os testes antigos de `toEqual` seguem passando
- [ ] Gate check passes: `cd Backend && npx vitest run tests/unit/authService.test.ts`
- [ ] Test count: ao menos 9 testes passam

**Tests**: unit
**Gate**: build

**Commit**: `feat(auth): return telefone and cargo in the login response`

---

### T7: Cut the TabBar to 3 tabs

**What**: Barra com Visão geral (`House`), Empilhadeiras e Histórico; sem a aba de ocorrência.
**Where**: `Frontend/src/components/employee/TabBar.tsx`
**Depends on**: None
**Reuses**: O array `TABS` do mesmo arquivo
**Requirement**: TAB-01, TAB-02, TAB-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] 3 links nesta ordem: Visão geral, Empilhadeiras, Histórico; nenhum para `/funcionario/ocorrencia` (AC1, AC3)
- [ ] O ícone de Visão geral é o `House` (AC2)
- [ ] Em `/funcionario/ocorrencia`, `/funcionario/sessao` e `/funcionario/configuracoes` o indicador fica oculto e nenhum link tem `aria-current` (AC4)
- [ ] O alerta do header navega para `/funcionario/ocorrencia` e o hambúrguer para `/funcionario/configuracoes` (AC5, AC6; `EmployeeLayout.test.tsx` já cobre, segue passando)
- [ ] Gate check passes: `cd Frontend && npx vitest run src/test/components/employee/TabBar.test.tsx src/test/components/employee/EmployeeLayout.test.tsx src/test/styles/employeeShell.test.ts`
- [ ] Test count: os testes antigos reescritos para 3 abas passam, sem remoções além das da aba de ocorrência

**Tests**: unit
**Gate**: quick

**Commit**: `feat(employee): cut the tab bar to three tabs`

---

### T8: Add telefone and cargo to UsuarioLogado

**What**: `telefone?` e `cargo?` no tipo `UsuarioLogado`.
**Where**: `Frontend/src/services/authService.ts`
**Depends on**: T7
**Reuses**: O tipo existente
**Requirement**: SET-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Os dois campos opcionais (`string`) existem no tipo
- [ ] `npx tsc -b` limpo

**Tests**: none
**Gate**: build

**Commit**: `feat(auth): add telefone and cargo to UsuarioLogado`

---

### T9: Settings texts in the locales

**What**: Bloco `employee.settings.*` e remoção de `employee.nav.incident` (sem uso depois do T7).
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: T8
**Reuses**: O bloco `employee.settings` existente (`title`, `close`)
**Requirement**: SET-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] pt-BR e en-US têm as mesmas chaves `employee.*`, todas com texto (AC12)
- [ ] Os outros 5 idiomas (es, fr, ja, de, ru) trazem `employee.settings.*` completo, todos com texto (AC12)
- [ ] `employee.nav.incident` removida dos locales que a têm
- [ ] Gate check passes: `cd Frontend && npx vitest run src/test/config/i18n.test.ts`
- [ ] Test count: os testes antigos de i18n passam e os novos cobrem o bloco `settings` nos 7 idiomas

**Tests**: unit
**Gate**: quick

**Commit**: `feat(i18n): add employee settings texts in all locales`

---

### T10: Settings variant of EmployeeSkeleton

**What**: Variante `settings` com os blocos do layout: título, card com 3 campos, aviso, botão, seção de feedback e botão final.
**Where**: `Frontend/src/components/employee/EmployeeSkeleton.tsx`
**Depends on**: T9
**Reuses**: As classes `field`, `fieldLabel`, `input`, `button`, `title` e `card` de `EmployeeSkeleton.module.css`
**Requirement**: SET-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `variant="settings"` anuncia carregamento uma vez e marca `aria-busy="true"` (AC10)
- [ ] Tem 3 campos de dados (`data-skeleton-field`) e 2 botões (`data-skeleton-button`), sem erros de tipo
- [ ] Gate check passes: `cd Frontend && npx vitest run src/test/components/employee/EmployeeSkeleton.test.tsx src/test/styles/employeeSkeleton.test.ts src/test/styles/no-hardcoded-colors.test.ts`
- [ ] Test count: os testes antigos passam e o novo caso cobre a variante

**Tests**: unit
**Gate**: quick

**Commit**: `feat(employee): add the settings variant to the skeleton`

---

### T11: Employee settings page

**What**: A tela de Configurações com dados somente leitura, aviso, "Deslogar-se", feedback e "Política e Privacidade" inerte.
**Where**: `Frontend/src/pages/employee/EmployeeSettingsPage.tsx`
**Depends on**: T10
**Reuses**: `EmployeeHomePage.tsx` e seu CSS Module (tokens); `authService.logout()`; `IncidentSheet.module.css` (campo e rótulo)
**Requirement**: SET-01, SET-02, SET-03, SET-04, SET-05, SET-06, SET-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Título "Configurações", seção "Geral", card "Dados do usuário" com Nome, Telefone e Cargo (AC1)
- [ ] Os 3 campos são `readOnly` e têm rótulo associado (AC2)
- [ ] Nome vem de `localStorage['user'].nome`; `—` sem usuário, sem `nome` ou com JSON inválido, sem erro (AC3, AC4, edge)
- [ ] Telefone e Cargo mostram o valor gravado, `—` quando ausente (AC5)
- [ ] Aviso "Solicitação de alteração" no card (AC6)
- [ ] "Deslogar-se" remove `token` e `user` do `localStorage` e navega para `/login/colaborador` (AC7)
- [ ] "Feedback & Sugestões" com "Como foi sua experiência?" e textarea editável sem botão de envio; o texto é descartado ao sair (AC8, edge)
- [ ] "Política e Privacidade" não altera a rota (AC9)
- [ ] Primeira visita mostra o skeleton `settings` com `aria-busy="true"`, a volta mostra o conteúdo (AC10, AC11)
- [ ] CSS Module só com tokens, sem cores hex
- [ ] Gate check passes: `cd Frontend && npx vitest run src/test/pages/employee src/test/styles`
- [ ] Test count: os testes antigos passam (o caso de `EmployeeSkeletonPages` segue válido) e os novos cobrem cada AC acima

**Tests**: unit
**Gate**: build

**Commit**: `feat(employee): build the settings page`

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4 ------→ T5 ------→ T6
Phase 2:  T7 ------→ T8 ------→ T9 ------→ T10 -----→ T11
```
