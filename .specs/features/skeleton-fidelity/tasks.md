# Skeletons iguais ao layout Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Regra do banco (global do dono):** nenhuma tarefa, teste, gate ou Verifier acessa o banco. Esta feature é só Frontend (CSS e componentes de skeleton); os testes rodam com jsdom e leem o texto dos módulos CSS.

---

**Spec**: `.specs/features/skeleton-fidelity/spec.md` (sem `design.md`: a abordagem está nas Assumptions do spec)
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none (`docs/arquitetura.md` descreve a arquitetura, sem regras de teste) - strong defaults applied; `Frontend/src/test/components/common/PageSkeleton.test.tsx`, `Frontend/src/test/components/employee/EmployeeSkeleton.test.tsx` and `Frontend/src/test/styles/employeeSkeleton.test.ts` sampled as the floor.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Skeleton component (`components/common/PageSkeleton`, `components/employee/EmployeeSkeleton`) | unit | Every spec AC for the component: blocks present, `data-skeleton-*` markers, grid class used, `aria-busy`/`role="status"` | `Frontend/src/test/components/**/*Skeleton.test.tsx` | `cd Frontend && npx vitest run <arquivo>` |
| Skeleton CSS module | unit | Static assertions on the dimensions the spec fixes (read the `.module.css` text, like `src/test/styles/*.test.ts`) | `Frontend/src/test/styles/*.test.ts` | `cd Frontend && npx vitest run <arquivo>` |
| Frontend page (loading state) | unit | The page passes its own toolbar placeholder and grid class to the skeleton; existing page tests keep passing | `Frontend/src/test/pages/*.test.tsx` | `cd Frontend && npx vitest run <arquivo>` |

Frontend commands need Node 22: prefix with `PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH` (the default `node` is 20 and fails with `ERR_REQUIRE_ESM`). Layout equality (4px, 1024px and 375px) needs a real browser; jsdom does not compute layout, so the independent Verifier measures it.

## Gate Check Commands

> Generated from codebase - confirm before Execute. Baseline before this feature: Frontend = 938 passed, 3 failed (the old `34 min`/`N minutos` ones), `tsc -b` and `eslint` clean.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | The row's Run Command above for the task's test files |
| Full | After tasks with e2e/integration tests | Not used: this feature has no integration tests |
| Build | After phase completion or config-only tasks | `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH sh -c 'npx tsc -b && npx eslint . && npx vitest run'` (only the 3 old failures) |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Telas do administrador

```
T1 → T2 → T3 → T4
```

### Phase 2: Telas do funcionário

```
T5 → T6 → T7 → T8
```

---

## Task Breakdown

### T1: PageSkeleton base and Visão Geral skeleton

**What**: `PageSkeleton` aceita o cabeçalho da página como filho, vira uma casca transparente (`display: contents`) e ganha o card de máquina (155px, estrutura do `MachineCard`); a Visão Geral monta a própria barra de filtros (busca 300x32, seletor, botão) e usa a classe de grade dela.
**Where**: `Frontend/src/components/common/PageSkeleton.tsx` (+ módulo CSS), `Frontend/src/pages/VisaoGeralPage.tsx` (+ módulo CSS)
**Depends on**: None
**Reuses**: `PageSkeleton.module.css` (`.block`, `.srOnly`), classes de grade da página
**Requirement**: SKL-01, SKL-05, SKL-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `PageSkeleton` renderiza o filho antes da grade, mantém `aria-busy="true"` e o aviso `common.loading` (Edge aria-busy)
- [x] Card de máquina com nome e identificação, 2 linhas de detalhe, selo e tempo; altura 155px por CSS (36 + 39 + 38 + 2 gaps de 8 + padding 12 + borda 1) (SKL-01 AC2)
- [x] Visão Geral carregando mostra a barra (busca 300x32, seletor, botão) acima da grade, e a grade usa `styles.grid` da página (SKL-01 AC1, SKL-05 AC8)
- [x] Gate check passes: `cd Frontend && npx vitest run src/test/components/common/PageSkeleton.test.tsx src/test/styles/pageSkeleton.test.ts src/test/pages/VisaoGeralPage.test.tsx`
- [x] Test count: 8 tests in `PageSkeleton.test.tsx` (2 new) and 5 in `pageSkeleton.test.ts` pass; `VisaoGeralPage.test.tsx` has 1 new test and keeps its baseline failure only

**Tests**: unit
**Gate**: quick

**Commit**: `feat(skeleton): mirror the Visão Geral toolbar and machine card`

---

### T2: Alertas skeleton

**What**: O skeleton dos Alertas mostra o painel com borda e padding 16, a etiqueta vermelha, a busca e o período, e cards de `FleetCard` (faixa de topo, 170px) com largura máxima `288 * var(--px)`.
**Where**: `Frontend/src/components/common/PageSkeleton.tsx` (+ módulo CSS, card `fleet`), `Frontend/src/pages/AlertasPage.tsx` (+ módulo CSS)
**Depends on**: T1
**Reuses**: casca e `SkeletonBlock` da T1; `AlertasPage.module.css` (`.panel`, `.toolbar`, `.grid`)
**Requirement**: SKL-04, SKL-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Card `fleet` com faixa de topo e 3 grupos de detalhe; altura `170 * var(--px)` por CSS e largura `288 * var(--px)` (SKL-04 AC5, SKL-02 AC3)
- [x] Alertas carregando mostra o painel (`styles.panel`), a etiqueta vermelha, a busca e o período, e os cards na grade `styles.grid` (SKL-04 AC5, SKL-05 AC8)
- [x] Gate check passes: `cd Frontend && npx vitest run src/test/components/common/PageSkeleton.test.tsx src/test/styles/pageSkeleton.test.ts src/test/pages/AlertasPage.test.tsx`
- [x] Test count: 1 test added to `PageSkeleton.test.tsx` (9 in total) and 5 to `pageSkeleton.test.ts` (10 in total), 1 to `AlertasPage.test.tsx`; all of `AlertasPage.test.tsx` passes

**Tests**: unit
**Gate**: quick

**Commit**: `feat(skeleton): mirror the Alertas panel and fleet card`

---

### T3: Frota skeleton

**What**: O skeleton da Frota mostra a barra de filtros com borda inferior, 4 painéis de categoria com cabeçalho (etiqueta 158x24 e ferramentas) e cards de frota.
**Where**: `Frontend/src/components/common/PageSkeleton.tsx` (+ módulo CSS, variante `kanban`), `Frontend/src/pages/FrotaPage.tsx` (+ módulo CSS)
**Depends on**: T2
**Reuses**: card `fleet` da T2; `FrotaPage.module.css` (`.toolbar`)
**Requirement**: SKL-02, SKL-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `kanban` renderiza o filho (barra) e 4 painéis, cada um com etiqueta 158x24, busca de ferramentas (o primeiro também o período) e 4 cards `fleet` de 288 de largura (SKL-02 AC3)
- [x] Painel espelha `FleetRow` (padding 12/20/20, gap 12, raio 8, tudo em `--px`) por CSS
- [x] Frota carregando mostra a barra com a classe `toolbar` da página (borda inferior)
- [x] Gate check passes: `cd Frontend && npx vitest run src/test/components/common/PageSkeleton.test.tsx src/test/styles/pageSkeleton.test.ts src/test/pages/FrotaPage.test.tsx`
- [x] Test count: 2 tests added to `PageSkeleton.test.tsx` (the old kanban test and the aria-hidden test updated from 3 rows/12 cards to 4 panels/16 cards; 11 in total) and 4 to `pageSkeleton.test.ts` (14 in total), 1 to `FrotaPage.test.tsx`; all of `FrotaPage.test.tsx` passes

**Tests**: unit
**Gate**: quick

**Commit**: `feat(skeleton): mirror the Frota toolbar, panels and cards`

---

### T4: Equipe skeleton and cleanup of the old card

**What**: A Equipe monta as 2 seções (título, barra, grade) com as classes dela; cards de funcionário (3 linhas, interruptor) e de setor (1 linha, 2 botões); remove a variante `team` e o card antigo do `PageSkeleton`.
**Where**: `Frontend/src/components/common/PageSkeleton.tsx` (+ módulo CSS, cards `employee` e `sector`), `Frontend/src/pages/EquipePage.tsx` (+ módulo CSS)
**Depends on**: T3
**Reuses**: `EquipePage.module.css` (`.section`, `.sectionHeader`, `.toolbar`, `.grid`)
**Requirement**: SKL-03, SKL-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Seção de funcionários: 8 cards `employee` (3 linhas, 2 ícones e interruptor) e barra com botão, busca e seletor (SKL-03 AC4)
- [x] Seção de setores: 8 cards `sector` (uma linha e 2 botões de 25px) e barra com botão e busca, sem seletor (SKL-03 AC4, Assumption)
- [x] Equipe usa `styles.section`, `styles.sectionHeader`, `styles.toolbar` e `styles.grid` da página (SKL-05 AC8)
- [x] Nenhum código ou CSS do card antigo (`.head`, `.icon`, `.lines`, `.compact`, variante `team`) resta no `PageSkeleton`
- [x] Gate check passes: `cd Frontend && npx vitest run src/test/components/common/PageSkeleton.test.tsx src/test/styles/pageSkeleton.test.ts src/test/pages/EquipePage.test.tsx`
- [x] Test count: `PageSkeleton.test.tsx` 13 (the old `team` test replaced by 3 tests for the no-variant shell and the employee/sector cards), `pageSkeleton.test.ts` 21 (7 new), `EquipePage.test.tsx` 1 new and the old skeleton test updated from 12 to 16 cards; all of `EquipePage.test.tsx` passes

**Tests**: unit
**Gate**: quick

**Commit**: `feat(skeleton): mirror the Equipe sections and cards`

---

### T5: Employee home skeleton

**What**: O skeleton da Visão geral do funcionário mostra a faixa "Última máquina" com o card da última máquina e cards de 122px.
**Where**: `Frontend/src/components/employee/EmployeeSkeleton.tsx` (+ módulo CSS, variante `home`)
**Depends on**: None
**Reuses**: `EmployeeSkeleton.module.css` (`.banner`, `.stats`, `.card`)
**Requirement**: SKL-06, SKL-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `home` mostra a faixa, o card da última máquina (`data-skeleton-last`), os 2 quadros e 3 cards (SKL-06 AC1)
- [x] Cards da `home` têm 122px (SKL-06 AC4)
- [x] Gate check passes: `cd Frontend && npx vitest run src/test/components/employee/EmployeeSkeleton.test.tsx src/test/styles/employeeSkeleton.test.ts src/test/pages/employee/EmployeeHomePage.test.tsx`
- [x] Test count: 3 tests added to `EmployeeSkeleton.test.tsx` and 6 to `employeeSkeleton.test.ts`; the old card style test changed its `min-height: 120px` line to `gap: 8px` because the card height now comes from its parts (122px); `EmployeeHomePage.test.tsx` all pass

**Tests**: unit
**Gate**: quick

**Commit**: `feat(skeleton): add the last machine card to the employee home skeleton`

---

### T6: Employee machines and history skeleton

**What**: As Empilhadeiras e o Histórico usam cards de 140px; o Histórico ganha a variante `history` com o título "Filtros" e as 3 linhas de campo de 36px (período, dois horários, busca) com 8px entre elas e 12px de espaço no cabeçalho.
**Where**: `Frontend/src/components/employee/EmployeeSkeleton.tsx` (+ módulo CSS, variantes `list` e `history`), `Frontend/src/pages/employee/EmployeeHistoryPage.tsx`
**Depends on**: T5
**Reuses**: `.list`, `.search` e `.card` do `EmployeeSkeleton.module.css`
**Requirement**: SKL-07, SKL-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Cards de `list` e `history` com 140px (SKL-07 AC3)
- [x] `history` mostra título, subtítulo, "Filtros" e 3 linhas de campo de 36px, a segunda com 2 campos lado a lado (SKL-07 AC2)
- [x] O Histórico carregando usa a variante `history`
- [x] `prefers-reduced-motion` global mantém o brilho parado (SKL-10, AC9 já coberto por `employeeMotion.test.ts`)
- [x] Gate check passes: `cd Frontend && npx vitest run src/test/components/employee/EmployeeSkeleton.test.tsx src/test/styles/employeeSkeleton.test.ts src/test/pages/employee/EmployeeHistoryPage.test.tsx src/test/pages/employee/EmployeeHistorySkeleton.test.tsx`
- [x] Test count: 2 tests added to `EmployeeSkeleton.test.tsx` (plus `history` in the aria-busy `it.each`), 3 to `employeeSkeleton.test.ts`, 1 new page file `EmployeeHistorySkeleton.test.tsx`; `EmployeeHistoryPage.test.tsx` all pass

**Tests**: unit
**Gate**: quick

**Commit**: `feat(skeleton): mirror the employee history filters and card height`

---

### T7: Employee session skeleton

**What**: O skeleton da Sessão troca as duas linhas da descrição por uma barra de 38px e o cronômetro passa a 210px de largura.
**Where**: `Frontend/src/components/employee/EmployeeSkeleton.tsx` (+ módulo CSS, variante `session`)
**Depends on**: T6
**Reuses**: `.timer` e `.line` do `EmployeeSkeleton.module.css`
**Requirement**: SKL-08, SKL-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `session` tem uma única barra de descrição de 38px e nenhuma barra de filtros (Edge Sessão) (SKL-08 AC5)
- [x] Cronômetro com 210px de largura (SKL-08 AC5)
- [x] Gate check passes: `cd Frontend && npx vitest run src/test/components/employee/EmployeeSkeleton.test.tsx src/test/styles/employeeSkeleton.test.ts`
- [x] Test count: 1 test added to `EmployeeSkeleton.test.tsx` and 2 to `employeeSkeleton.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(skeleton): fit the employee session description and timer`

---

### T8: Incident sheet skeleton

**What**: O skeleton do sheet de ocorrência mostra 4 campos de 65px, o último com 120px de largura.
**Where**: `Frontend/src/components/employee/EmployeeSkeleton.tsx` (+ módulo CSS, variante `form`)
**Depends on**: T7
**Reuses**: `.field`, `.fieldLabel` e `.input` do `EmployeeSkeleton.module.css`
**Requirement**: SKL-09, SKL-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 4 campos de 65px (rótulo + 6px + entrada de 40px) por CSS (SKL-09 AC6)
- [x] O quarto campo com 120px de largura e `max-width: 100%` (SKL-09 AC6)
- [x] Gate check passes (Build): `cd Frontend && PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH sh -c 'npx tsc -b && npx eslint . && npx vitest run'` (only the 3 old failures)
- [x] Test count: 1 test added to `EmployeeSkeleton.test.tsx` and 2 to `employeeSkeleton.test.ts`; full Frontend suite has only the 3 old failures

**Tests**: unit
**Gate**: build

**Commit**: `feat(skeleton): mirror the incident sheet fields`

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4
Phase 2:  T5 ------→ T6 ------→ T7 ------→ T8
```

Execution is strictly sequential - there is no intra-phase parallelism. A single agent works one task at a time, in order.

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T2 | T2 | ✅ Match |
| T4 | T3 | T3 | ✅ Match |
| T5 | None | None | ✅ Match |
| T6 | T5 | T5 | ✅ Match |
| T7 | T6 | T6 | ✅ Match |
| T8 | T7 | T7 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: PageSkeleton base + Visão Geral | Skeleton component, CSS module, page | unit | unit | ✅ OK |
| T2: Alertas | Skeleton component, CSS module, page | unit | unit | ✅ OK |
| T3: Frota | Skeleton component, CSS module, page | unit | unit | ✅ OK |
| T4: Equipe | Skeleton component, CSS module, page | unit | unit | ✅ OK |
| T5: Employee home | Skeleton component, CSS module | unit | unit | ✅ OK |
| T6: Employee list/history | Skeleton component, CSS module, page | unit | unit | ✅ OK |
| T7: Employee session | Skeleton component, CSS module | unit | unit | ✅ OK |
| T8: Incident form | Skeleton component, CSS module | unit | unit | ✅ OK |
