# Polimento da interface Tasks
## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/ui-polish/design.md`
**Status**: Done

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/frontend.md` (seção Testes: Vitest + Testing Library, testes espelham `src/` em `src/test/`), `Frontend/package.json`, `Frontend/vite.config.ts`. Sem limiar de cobertura configurado; defaults fortes aplicados.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Hooks / lógica pura (`hooks/*.ts`, `data/*.ts`) | unit | Todas as ramificações; 1:1 com os ACs do hook | `Frontend/src/test/hooks/*.test.ts` | `cd Frontend && yarn vitest run src/test/hooks` |
| Componente (`components/**`) | unit (Testing Library) | Render, cada callback, validação, estados vazios, `role`/`aria-*` | `Frontend/src/test/components/**/*.test.tsx` | `cd Frontend && yarn vitest run src/test/components` |
| Página (`pages/**`) | integration (Testing Library) | Fluxos da spec: skeleton por página, feedback de arrasto, avisos, edge cases | `Frontend/src/test/pages/*.test.tsx` | `cd Frontend && yarn vitest run src/test/pages` |
| Locales (`locales/*/translation.json`) | unit | Chaves novas presentes nos 7 idiomas | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && yarn vitest run src/test/config` |
| CSS / docs / bootstrap (`main.tsx`) | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após tasks com testes de unidade | `cd Frontend && yarn vitest run <arquivo-de-teste da task>` |
| Full | Após tasks de página / integração | `cd Frontend && yarn test` |
| Build | Fim de fase e tasks sem teste | `cd Frontend && yarn lint && yarn build && yarn test` |

---

## Execution Plan

### Phase 1: Foundation

```
T1
T2 → T3
T2 → T4
T5
```

### Phase 2: Kanban

```
T6 → T7 → T8
```

### Phase 3: Telas e fechamento

```
T9 → T10 → T11 → T12
```

---

## Task Breakdown

### T1: ✅ Hook `useFirstVisitLoading`

**What**: Hook com `MOCK_LATENCY_MS` (0 em teste, 600 fora) e `resetVisitedPages()`; devolve `true` até o timer terminar na 1ª visita de cada chave.
**Where**: `Frontend/src/hooks/useFirstVisitLoading.ts`
**Depends on**: None
**Reuses**: Padrão de `hooks/useLanguage.ts`
**Requirement**: SKEL-01, SKEL-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] 1ª visita com atraso: `true` e depois `false` após o tempo (fake timers)
- [ ] 2ª visita da mesma chave: `false` desde o início
- [ ] Desmontar antes do fim cancela o timer e não marca como vista
- [ ] `delayMs` 0: `false` desde o início
- [ ] Gate passes: `cd Frontend && yarn vitest run <arquivo-de-teste da task>`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add first-visit loading hook`

---

### T2: ✅ Traduções de loading e avisos

**What**: Chaves `common.loading`, `common.closeNotification` e textos dos avisos em `machines.*`, `team.*` e `fleet.*`, nos 7 idiomas.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Reuses**: Estrutura existente
**Requirement**: SKEL-03, TOAST-01, TOAST-02, TOAST-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mesmas chaves nos 7 idiomas
- [ ] `{{name}}` preservado nos avisos
- [ ] Testes de paridade existentes passam
- [ ] Gate passes: `cd Frontend && yarn vitest run <arquivo-de-teste da task>`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(i18n): add loading and notification texts`

---

### T3: ✅ Componente `PageSkeleton`

**What**: Skeleton com variantes `grid`, `kanban` e `team`, shimmer em CSS, `aria-busy`, status oculto "Carregando..." e blocos `aria-hidden`.
**Where**: `Frontend/src/components/common/PageSkeleton.tsx`
**Depends on**: T2
**Reuses**: Classes de grid das páginas via `gridClassName`
**Requirement**: SKEL-03, SKEL-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cada variante renderiza a quantidade de blocos da spec
- [ ] `aria-busy="true"` e `role="status"` com "Carregando..."
- [ ] Blocos com `aria-hidden`
- [ ] Gate passes: `cd Frontend && yarn vitest run <arquivo-de-teste da task>`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add page skeleton`

---

### T4: ✅ `ToastProvider` e `useToast`

**What**: Provider com pilha de avisos, remoção em 4 s ou no X, região `role="status"`/`aria-live`, no-op sem provider.
**Where**: `Frontend/src/components/common/Toast.tsx`
**Depends on**: T2
**Reuses**: Nenhum
**Requirement**: TOAST-04, TOAST-05, TOAST-06, TOAST-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `show` adiciona um aviso visível dentro da região `role="status"`
- [ ] Some em 4 s; X remove na hora; fechar antes não remove outro aviso
- [ ] Vários avisos empilham em ordem
- [ ] `useToast` fora do provider não lança erro
- [ ] Gate passes: `cd Frontend && yarn vitest run <arquivo-de-teste da task>`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add toast notifications`

---

### T5: ✅ Animações e reduzir movimento

**What**: Entrada do `Modal` (fundo e caixa), menu ⋮ do `FleetCard`, popover de cores e regra global `prefers-reduced-motion` em `index.css`.
**Where**: `Frontend/src/index.css`
**Depends on**: None
**Reuses**: `popover-in` de `Header.module.css`
**Requirement**: ANIM-01, ANIM-02, ANIM-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Keyframes com as durações da spec
- [ ] Regra global zera animações e transições com `reduce`
- [ ] Build e testes passam
- [ ] Gate passes: `cd Frontend && yarn lint && yarn build && yarn test`

**Tests**: none
**Gate**: build
**Commit**: `style(ui): animate dialogs and menus`

---

### T6: ✅ `FleetCard` em arrasto e chegada

**What**: Props `isDragging` e `isArriving` com as classes visuais da spec.
**Where**: `Frontend/src/components/fleet/FleetCard.tsx`
**Depends on**: None
**Reuses**: O próprio componente
**Requirement**: DRAG-01, DRAG-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `isDragging` aplica a marca de arrasto
- [ ] `isArriving` aplica o destaque de chegada
- [ ] Sem as props, nada muda (testes existentes passam)
- [ ] Gate passes: `cd Frontend && yarn vitest run <arquivo-de-teste da task>`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): mark dragging and arriving cards`

---

### T7: ✅ `FleetRow` como destino

**What**: Prop `isDropTarget` e callbacks `onDragOverRow`/`onDragLeaveRow`, ignorando `dragleave` para filhos da linha.
**Where**: `Frontend/src/components/fleet/FleetRow.tsx`
**Depends on**: T6
**Reuses**: O próprio componente
**Requirement**: DRAG-02, DRAG-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `isDropTarget` aplica o destaque
- [ ] `dragover` chama `onDragOverRow(id)`
- [ ] `dragleave` para fora chama `onDragLeaveRow(id)`; para um filho, não
- [ ] Gate passes: `cd Frontend && yarn vitest run <arquivo-de-teste da task>`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): highlight drop target row`

---

### T8: ✅ `FrotaPage`: arrasto, chegada, skeleton e avisos

**What**: Estado `draggingId`/`overRowId`/`arrivedIds`, skeleton `kanban` na 1ª visita e avisos de categoria criada/excluída, máquinas adicionadas e máquina removida.
**Where**: `Frontend/src/pages/FrotaPage.tsx`
**Depends on**: T7
**Reuses**: `FleetRow`, `FleetCard`, `PageSkeleton`, `useToast`
**Requirement**: SKEL-01, SKEL-04, DRAG-01, DRAG-02, DRAG-03, DRAG-04, DRAG-05, TOAST-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Arrastar marca o card; passar sobre outra linha destaca só ela; soltar/cancelar limpa tudo
- [ ] Card que chega (arrasto, menu, "+") pisca e o destaque some em 1 s
- [ ] Skeleton `kanban` na 1ª visita, sem toolbar
- [ ] Avisos da Frota com o nome
- [ ] Gate passes: `cd Frontend && yarn test`

**Tests**: integration
**Gate**: full
**Commit**: `feat(fleet): add drag feedback, skeleton and notifications`

---

### T9: ✅ `VisaoGeralPage`: skeleton e avisos

**What**: Skeleton `grid` (8) na 1ª visita e avisos de máquina cadastrada/salva/excluída.
**Where**: `Frontend/src/pages/VisaoGeralPage.tsx`
**Depends on**: None (fase 1 inteira já concluída)
**Reuses**: `PageSkeleton`, `useToast`
**Requirement**: SKEL-01, SKEL-04, TOAST-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Skeleton na 1ª visita, conteúdo depois, sem toolbar durante o skeleton
- [ ] Avisos com o nome da máquina
- [ ] Gate passes: `cd Frontend && yarn test`

**Tests**: integration
**Gate**: full
**Commit**: `feat(machines): add overview skeleton and notifications`

---

### T10: ✅ `EquipePage`: skeleton e avisos

**What**: Skeleton `team` na 1ª visita e avisos de funcionário/setor cadastrado/salvo/excluído.
**Where**: `Frontend/src/pages/EquipePage.tsx`
**Depends on**: T9
**Reuses**: `PageSkeleton`, `useToast`
**Requirement**: SKEL-01, SKEL-04, TOAST-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Skeleton na 1ª visita
- [ ] Avisos com o nome do funcionário/setor
- [ ] Gate passes: `cd Frontend && yarn test`

**Tests**: integration
**Gate**: full
**Commit**: `feat(team): add team skeleton and notifications`

---

### T11: ✅ `AlertasPage`: skeleton

**What**: Skeleton `grid` (8) na 1ª visita.
**Where**: `Frontend/src/pages/AlertasPage.tsx`
**Depends on**: T10
**Reuses**: `PageSkeleton`
**Requirement**: SKEL-01, SKEL-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Skeleton na 1ª visita, conteúdo depois
- [ ] Gate passes: `cd Frontend && yarn test`

**Tests**: integration
**Gate**: full
**Commit**: `feat(alerts): add alerts skeleton`

---

### T12: ✅ Provider no app e documentação

**What**: `ToastProvider` em `main.tsx`; seção de skeleton, avisos e animações em `docs/frontend.md`.
**Where**: `docs/frontend.md`
**Depends on**: T11
**Reuses**: Formato das seções existentes
**Requirement**: TOAST-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `main.tsx` envolve o app com o provider
- [ ] Doc descreve hook, skeleton, avisos e reduzir movimento
- [ ] Build gate passa
- [ ] Gate passes: `cd Frontend && yarn lint && yarn build && yarn test`

**Tests**: none
**Gate**: build
**Commit**: `docs(ui): document loading, notifications and motion`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 | T5          (independentes)
          T2 → T3
          T2 → T4
Phase 2:  T6 → T7 → T8
Phase 3:  T9 → T10 → T11 → T12
```

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Hook `useFirstVisitLoading` | 1 arquivo | ✅ |
| T2: Traduções de loading e avisos | 1 módulo i18n (7 arquivos espelhados) | ✅ |
| T3: Componente `PageSkeleton` | 1 arquivo | ✅ |
| T4: `ToastProvider` e `useToast` | 1 arquivo | ✅ |
| T5: Animações e reduzir movimento | 1 arquivo de estilos (+ CSS dos 3 componentes animados) | ✅ |
| T6: `FleetCard` em arrasto e chegada | 1 arquivo | ✅ |
| T7: `FleetRow` como destino | 1 arquivo | ✅ |
| T8: `FrotaPage`: arrasto, chegada, skeleton e avisos | 1 arquivo | ✅ |
| T9: `VisaoGeralPage`: skeleton e avisos | 1 arquivo | ✅ |
| T10: `EquipePage`: skeleton e avisos | 1 arquivo | ✅ |
| T11: `AlertasPage`: skeleton | 1 arquivo | ✅ |
| T12: Provider no app e documentação | 1 arquivo | ✅ |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | None | None | ✅ Match |
| T3 | T2 | T2 | ✅ Match |
| T4 | T2 | T2 | ✅ Match |
| T5 | None | None | ✅ Match |
| T6 | None | None | ✅ Match |
| T7 | T6 | T6 | ✅ Match |
| T8 | T7 | T7 | ✅ Match |
| T9 | None | início da fase 3 | ✅ Match |
| T10 | T9 | T9 | ✅ Match |
| T11 | T10 | T10 | ✅ Match |
| T12 | T11 | T11 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | Hook | unit | unit | ✅ OK |
| T2 | Locales | unit | unit | ✅ OK |
| T3 | Componente | unit | unit | ✅ OK |
| T4 | Componente | unit | unit | ✅ OK |
| T5 | CSS | none | none | ✅ OK |
| T6 | Componente | unit | unit | ✅ OK |
| T7 | Componente | unit | unit | ✅ OK |
| T8 | Página | integration | integration | ✅ OK |
| T9 | Página | integration | integration | ✅ OK |
| T10 | Página | integration | integration | ✅ OK |
| T11 | Página | integration | integration | ✅ OK |
| T12 | Docs/bootstrap | none | none | ✅ OK |
