# Gestão de Equipe e Setores Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/team-management/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/frontend.md` (seção Testes: Vitest + Testing Library, testes espelham `src/` em `src/test/`), `Frontend/package.json`. Sem limiar de cobertura configurado; defaults fortes aplicados.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Dados / lógica pura (`data/*.ts`) | unit | Todas as ramificações; 1:1 com os ACs de filtro/matrícula/usuário duplicado | `Frontend/src/test/data/*.test.ts` | `cd Frontend && yarn vitest run src/test/data` |
| Componente (`components/**`) | unit (Testing Library) | Render, cada callback, validação, acessibilidade (`role`, `aria-*`), fechar por Escape/backdrop | `Frontend/src/test/components/**/*.test.tsx` | `cd Frontend && yarn vitest run src/test/components` |
| Página (`pages/**`) | integration (Testing Library) | Fluxos completos da spec: busca, filtro, toggle, criar, editar, excluir, empty state | `Frontend/src/test/pages/*.test.tsx` | `cd Frontend && yarn vitest run src/test/pages` |
| Locales (`locales/*/translation.json`) | unit | Paridade de chaves do módulo `team` nos 7 idiomas | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && yarn vitest run src/test/config` |
| CSS Modules / docs | none | - (build gate only) | - | build gate only |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após tasks com testes de unidade | `cd Frontend && yarn vitest run <arquivo-de-teste da task>` |
| Full | Após tasks de página / integração | `cd Frontend && yarn test` |
| Build | Fim de fase e tasks sem teste | `cd Frontend && yarn lint && yarn build && yarn test` |

---

## Execution Plan

### Phase 1: Foundation

```
T3 → T4
```

### Phase 2: Cards e modais

```
T5
T6
T7
T8
T9
T10
```

### Phase 3: Página e acabamento

```
T11 → T12 → T13 → T14 → T15
```

---

## Task Breakdown

### Phase 1: Foundation

### T1: ✅ Dados mockados e funções de filtro

**What**: Tipos `Employee`/`Sector`, mocks (11 funcionários, 8 setores), `filterEmployees`, `filterSectors`, `nextEmployeeCode`, `isUsernameTaken`.
**Where**: `Frontend/src/data/team.ts`
**Depends on**: None
**Reuses**: `Frontend/src/data/machines.ts`
**Requirement**: TEAM-01, TEAM-03, TEAM-04

**Done when**:

- [ ] Busca por nome, matrícula e cargo (e nome/unidade em setores), sem diferenciar maiúsculas
- [ ] Filtro de acesso combinado com a busca
- [ ] `nextEmployeeCode` retorna o maior código + 1 (lista vazia → `EMP-001`)
- [ ] `isUsernameTaken` respeita `ignoreId`
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/data/team.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): add mock data and filters`

---

### T2: ✅ Traduções do módulo `team` nos 7 idiomas

**What**: Chaves `team.*` (títulos, rótulos, placeholders, botões, mensagens de erro, estados vazios, `aria-label`, `pageTitle`) e `team` em `REQUIRED_MODULES`.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Reuses**: Estrutura de `machines.*`
**Requirement**: TEAM-06

**Done when**:

- [ ] Mesmas chaves em pt-BR, en-US, es, fr, de, ja, ru
- [ ] `i18n.test.ts` exige `team` e passa
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/config`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(i18n): add team translations`

---

### T3: ✅ Componente `Modal`

**What**: Casca de diálogo reutilizável (título, fechar, Escape, backdrop, `role="dialog"`, `aria-modal`).
**Where**: `Frontend/src/components/common/Modal.tsx`
**Depends on**: None
**Reuses**: Padrão de `NewMachinePanel.tsx`
**Requirement**: TEAM-03

**Done when**:

- [ ] Escape, backdrop e botão fechar chamam `onClose`; clique dentro do conteúdo não
- [x] Escape não propaga: dispensado, a página mantém um único diálogo aberto por vez (estado `dialog` único)
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/common/Modal.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(common): add Modal component`

---

### T4: ✅ Componente `ConfirmDialog`

**What**: Diálogo de confirmação com Cancelar e Excluir sobre `Modal`.
**Where**: `Frontend/src/components/common/ConfirmDialog.tsx`
**Depends on**: T3
**Reuses**: `Modal`
**Requirement**: TEAM-05

**Done when**:

- [ ] Mostra a mensagem recebida; Excluir chama `onConfirm`; Cancelar/Escape/backdrop chamam `onCancel`
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/common/ConfirmDialog.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(common): add ConfirmDialog component`

---

### Phase 2: Cards e modais

### T5: ✅ `EmployeeCard`

**What**: Card com avatar, nome, matrícula, "Acesso: …", lixeira, lápis e switch; corpo clicável abre o detalhe.
**Where**: `Frontend/src/components/team/EmployeeCard.tsx`
**Depends on**: T1, T2
**Reuses**: `MachineCard.tsx` e `MachineCard.module.css` como referência
**Requirement**: TEAM-01, TEAM-02

**Done when**:

- [ ] Texto e cor de acesso mudam com `employee.acesso`
- [ ] Switch com `role="switch"` e `aria-checked`; clique chama `onToggleAccess`
- [ ] Clique no corpo chama `onOpen`; lápis, lixeira e switch não acionam `onOpen`
- [ ] Lápis chama `onEdit`, lixeira chama `onDelete`, ambos com `aria-label` contendo o nome
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/team/EmployeeCard.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): add EmployeeCard`

---

### T6: ✅ `EmployeeFormModal`

**What**: Formulário de cadastro/edição (nome, telefone, cargo, entrada, saída, usuário, senha com olho) com validação.
**Where**: `Frontend/src/components/team/EmployeeFormModal.tsx`
**Depends on**: T3, T1
**Reuses**: `Modal`, `isUsernameTaken`
**Requirement**: TEAM-03

**Done when**:

- [ ] Vazio no cadastro, preenchido na edição; título muda por modo
- [ ] Obrigatórios (nome, cargo, usuário, senha) bloqueiam o save e marcam o campo
- [ ] Usuário duplicado bloqueia; manter o próprio usuário na edição não bloqueia
- [ ] Olho alterna senha oculta/visível; Cancelar fecha sem salvar
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/team/EmployeeFormModal.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): add EmployeeFormModal`

---

### T7: ✅ `SectorCard`

**What**: Card com ícone, nome, lápis e lixeira; corpo clicável.
**Where**: `Frontend/src/components/team/SectorCard.tsx`
**Depends on**: T1, T2
**Reuses**: Estilo do `EmployeeCard`
**Requirement**: TEAM-04, TEAM-05

**Done when**:

- [ ] Clique no corpo chama `onOpen`; lápis chama `onEdit`; lixeira chama `onDelete`, sem acionar `onOpen`
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/team/SectorCard.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): add SectorCard`

---

### T8: ✅ `SectorFormModal`

**What**: Formulário de setor (nome, unidade) para cadastro e edição.
**Where**: `Frontend/src/components/team/SectorFormModal.tsx`
**Depends on**: T3
**Reuses**: `Modal`
**Requirement**: TEAM-04

**Done when**:

- [ ] Título "Cadastrar um novo setor" ou "Editar setor"; campos preenchidos na edição
- [ ] Nome e unidade obrigatórios bloqueiam o save
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/team/SectorFormModal.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): add SectorFormModal`

---

### T9: ✅ `SectorInfoModal`

**What**: Modal "Informações do setor" somente leitura.
**Where**: `Frontend/src/components/team/SectorInfoModal.tsx`
**Depends on**: T3
**Reuses**: `Modal`
**Requirement**: TEAM-04

**Done when**:

- [ ] Nome e unidade em campos `readOnly`; sem botões de ação além do fechar
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/team/SectorInfoModal.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): add SectorInfoModal`

---

### T10: ✅ `EmployeeInfoModal`

**What**: Modal "Informações do funcionário" somente leitura (frame "Detalhe Funcionário" do Figma).
**Where**: `Frontend/src/components/team/EmployeeInfoModal.tsx`
**Depends on**: T3
**Reuses**: `Modal`, layout de campos do `EmployeeFormModal`
**Requirement**: TEAM-03

**Done when**:

- [ ] Mostra nome, telefone, cargo, entrada, saída, usuário e senha em campos `readOnly`; olho alterna a senha; sem Cancelar/Confirmar
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/team/EmployeeInfoModal.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): add EmployeeInfoModal`

---

### Phase 3: Página e acabamento

### T11: ✅ Seção Funcionários na `EquipePage`

**What**: Layout da página, seção de funcionários com busca, filtro de acesso, grid, empty state e toggle de acesso.
**Where**: `Frontend/src/pages/EquipePage.tsx`
**Depends on**: T5
**Reuses**: `VisaoGeralPage.tsx` e `.module.css`
**Requirement**: TEAM-01, TEAM-02

**Done when**:

- [ ] Busca, filtro e combinação conforme a spec; empty state
- [ ] Toggle altera o card e, com filtro ativo, o remove da vista quando deixa de casar
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/pages/EquipePage.test.tsx`

**Tests**: integration
**Gate**: full
**Commit**: `feat(team): add employees section to EquipePage`

---

### T12: ✅ Cadastro e edição de funcionário na página

**What**: Ligar botão "Cadastrar Funcionário", lápis e clique no card ao `EmployeeFormModal` e `EmployeeInfoModal`, com matrícula automática e acesso inicial Permitido.
**Where**: `Frontend/src/pages/EquipePage.tsx` (modify)
**Depends on**: T6, T10, T11
**Reuses**: `nextEmployeeCode`
**Requirement**: TEAM-03

**Done when**:

- [ ] Novo funcionário aparece no topo com próxima matrícula e Permitido
- [ ] Edição atualiza o card e preserva busca/filtro ativos
- [ ] Clicar no corpo do card abre o detalhe somente leitura
- [ ] Gate passes: `cd Frontend && yarn test`

**Tests**: integration
**Gate**: full
**Commit**: `feat(team): wire employee create and edit`

---

### T13: ✅ Seção Setores na página

**What**: Seção de setores com busca, grid, empty state, cadastro, edição e modal de leitura.
**Where**: `Frontend/src/pages/EquipePage.tsx` (modify)
**Depends on**: T7, T8, T9, T12
**Reuses**: Estado `dialog` único
**Requirement**: TEAM-04

**Done when**:

- [ ] Criar, editar, buscar e abrir leitura conforme a spec; um modal por vez
- [ ] Gate passes: `cd Frontend && yarn test`

**Tests**: integration
**Gate**: full
**Commit**: `feat(team): add sectors section`

---

### T14: ✅ Exclusão com confirmação

**What**: Lixeira de funcionário e de setor abre `ConfirmDialog` e remove ao confirmar.
**Where**: `Frontend/src/pages/EquipePage.tsx` (modify)
**Depends on**: T4, T13
**Reuses**: `ConfirmDialog`
**Requirement**: TEAM-05

**Done when**:

- [ ] Confirmar remove; cancelar, Escape e backdrop mantêm
- [ ] Gate passes: `cd Frontend && yarn test`

**Tests**: integration
**Gate**: full
**Commit**: `feat(team): add delete confirmation`

---

### T15: ✅ Título do Header e documentação

**What**: `ROUTE_KEYS['/equipe']` aponta para `team.pageTitle`; atualizar `docs/frontend.md` (EquipePage deixa de ser placeholder, novas pastas `common/` e `team/`, `data/team.ts`).
**Where**: `Frontend/src/components/layout/Header.tsx`
**Depends on**: T2, T14
**Reuses**: `ROUTE_KEYS`
**Requirement**: TEAM-06

**Done when**:

- [ ] Header mostra "Gerenciamento da Equipe e Setores" em `/equipe`; Sidebar mantém "Gestão de Equipe"
- [ ] `docs/frontend.md` atualizado
- [ ] Gate passes: `cd Frontend && yarn lint && yarn build && yarn test`

**Tests**: unit
**Gate**: build
**Commit**: `feat(team): update header title and docs`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1, T2, T3 → T4
Phase 2:  T5, T6, T7, T8, T9, T10 (sem dependência entre si)
Phase 3:  T11 → T12 → T13 → T14 → T15
```

## Validation tables

| Task | Granularity | Diagram × Depends on | Tests × matrix |
| ---- | ----------- | -------------------- | -------------- |
| T1-T15 | ✅ um componente/função/arquivo cada (T2 = um tipo de arquivo; T15 mistura Header + doc) | ✅ ver abaixo | ✅ |
