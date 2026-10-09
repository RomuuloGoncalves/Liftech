# Gerenciamento da Frota (Kanban) Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/fleet-kanban/design.md`
**Status**: Done

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/frontend.md` (seção Testes: Vitest + Testing Library, testes espelham `src/` em `src/test/`), `Frontend/package.json`, `Frontend/vite.config.ts`. Sem limiar de cobertura configurado; defaults fortes aplicados.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Dados / lógica pura (`data/*.ts`) | unit | Todas as ramificações; 1:1 com os ACs de posição inicial, mover, adicionar, criar, excluir, validar | `Frontend/src/test/data/*.test.ts` | `cd Frontend && yarn vitest run src/test/data` |
| Componente (`components/**`) | unit (Testing Library) | Render, cada callback, validação, estados vazios, `role`/`aria-*` | `Frontend/src/test/components/**/*.test.tsx` | `cd Frontend && yarn vitest run src/test/components` |
| Página (`pages/**`) | integration (Testing Library) | Fluxos completos da spec: arrastar, menu ⋮, criar, adicionar, excluir, filtros, detalhe, edge cases | `Frontend/src/test/pages/*.test.tsx` | `cd Frontend && yarn vitest run src/test/pages` |
| Locales (`locales/*/translation.json`) | unit | Módulo `fleet` presente e com as mesmas chaves nos 7 idiomas | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && yarn vitest run src/test/config` |
| CSS Modules / docs | none | - (build gate only) | - | build gate only |

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
T2
```

### Phase 2: Componentes

```
T3
T4 → T5
T6
T7
```

### Phase 3: Página e documentação

```
T8 → T9
```

---

## Task Breakdown

### Phase 1: Foundation

### T1: ✅ Modelo do quadro e funções puras

**What**: Tipos `CategoryKind`/`FleetCategory`, `CATEGORY_COLORS`, `ACCIDENT_MACHINE_IDS` e as funções `initialBoard`, `moveMachine`, `removeMachine`, `addMachines`, `createCategory`, `deleteCategory`, `unassignedMachines`, `categoryNameError`, `isHexColor`, `matchesMachine`, `lastAccidentDate`.
**Where**: `Frontend/src/data/fleet.ts`
**Depends on**: None
**Reuses**: `Frontend/src/data/machines.ts`
**Requirement**: BOARD-01, BOARD-02, MOVE-01, MOVE-02, MOVE-04, MOVE-05, MOVE-06, CAT-03, CAT-04, CAT-05, CAT-07, ADD-01, ADD-02, ADD-05, DEL-04, FILTER-01, FILTER-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `initialBoard` devolve Acidentes, Ativas, Manutenção, Disponíveis nessa ordem; EMP-081/085/089 em Acidentes; Offline fora de todas
- [ ] `moveMachine` põe no fim do destino, tira da origem, não muda nada na mesma categoria nem no status
- [ ] `addMachines` ignora ids que já têm categoria; nenhuma função deixa um id em duas categorias
- [ ] `deleteCategory` só remove `custom` e libera as máquinas
- [ ] `categoryNameError` cobre vazio, só espaços, repetido ignorando caixa/espaços
- [ ] `isHexColor` aceita `#RRGGBB` e rejeita o resto
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/data/fleet.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): add board model and pure transforms`

---

### T2: ✅ Traduções do módulo `fleet` nos 7 idiomas

**What**: Chaves `fleet.*` (título, toolbar, nomes das 4 categorias, rótulos do card, menu ⋮, modais, validação, estados vazios, `aria-label`) e `fleet` em `REQUIRED_MODULES`.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Reuses**: Estrutura de `machines.*` e `team.*`
**Requirement**: BOARD-01, CAT-04, CAT-05, ADD-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mesmas chaves `fleet.*` em pt-BR, en-US, es, fr, de, ja, ru
- [ ] `i18n.test.ts` exige `fleet` e passa
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/config`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(i18n): add fleet translations`

---

### Phase 2: Componentes

### T3: ✅ Variante `fleet` do `MachineDetailModal`

**What**: Prop `variant` com linhas Setor/Funcionário/Tempo Uso (Sessão)/Nome Dispositivo, abas "Histórico de reparos"/"Histórico de alertas" e sem rodapé; `onEdit`/`onDelete` opcionais.
**Where**: `Frontend/src/components/machines/MachineDetailModal.tsx`
**Depends on**: None
**Reuses**: O próprio componente
**Requirement**: DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Variante `fleet` mostra as 4 linhas e as 2 abas da spec, sem Editar/Excluir
- [ ] Variante padrão continua igual (testes existentes passam sem alteração)
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/machines/MachineDetailModal.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): add fleet variant to machine detail modal`

---

### T4: ✅ Componente `FleetCard`

**What**: Card arrastável com campos por `kind`, botão esticado para abrir e menu ⋮ com "Mover para" e "Remover da categoria".
**Where**: `Frontend/src/components/fleet/FleetCard.tsx`
**Depends on**: None
**Reuses**: Botão esticado de `MachineCard`, `formatEventDate`, `formatHours`
**Requirement**: BOARD-05, MOVE-03, MOVE-04, DETAIL-01, DETAIL-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cada `kind` mostra os campos da spec; valor ausente vira "(Indefinido)"
- [ ] `draggable` e `onDragStart` com o id da máquina
- [ ] Menu ⋮ lista as outras categorias e "Remover da categoria"; abrir o menu não chama `onOpen`
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/fleet/FleetCard.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): add fleet card`

---

### T5: ✅ Componente `FleetRow`

**What**: Linha da categoria: rótulo colorido com contador, busca da linha, período só em Acidentes, "Excluir categoria" só em custom, rolagem horizontal, área de soltar e "+".
**Where**: `Frontend/src/components/fleet/FleetRow.tsx`
**Depends on**: T4
**Reuses**: `FleetCard`, período de `MachineDetailModal`
**Requirement**: BOARD-03, BOARD-04, BOARD-06, MOVE-01, ADD-01, DEL-01, DEL-02, DEL-03, FILTER-03, FILTER-04, FILTER-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Contador mostra o total da categoria mesmo com filtro
- [ ] Linha vazia mostra só o "+" central; filtro sem resultado mostra "Nenhuma máquina encontrada"
- [ ] `drop` chama `onDrop(categoryId)`; `dragover` faz `preventDefault`
- [ ] Período aparece só em `acidentes`; excluir só em `custom`
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/fleet/FleetRow.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): add fleet row`

---

### T6: ✅ Componente `CategoryFormModal`

**What**: Modal "Criar Categoria" com popover de cores (7 prontas + hex), nome com validação e Cancelar/Criar.
**Where**: `Frontend/src/components/fleet/CategoryFormModal.tsx`
**Depends on**: None
**Reuses**: `Modal`, `DialogButtons.module.css`, `TeamForm.module.css`, `categoryNameError`, `isHexColor`
**Requirement**: CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Popover abre pelo quadrado de cor; escolher cor ou hex válido muda o quadrado; hex inválido mantém a cor
- [ ] Erros "Campo obrigatório" e "Já existe uma categoria com esse nome"; `maxLength` 30
- [ ] Cancelar, X e Escape fecham sem criar
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/fleet/CategoryFormModal.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): add create category modal`

---

### T7: ✅ Componente `MachinePickerModal`

**What**: Modal "Selecione as máquinas" com chips removíveis, busca, lista com check e Cancelar/Confirmar.
**Where**: `Frontend/src/components/fleet/MachinePickerModal.tsx`
**Depends on**: None
**Reuses**: `Modal`, `DialogButtons.module.css`, `matchesMachine`
**Requirement**: ADD-02, ADD-03, ADD-04, ADD-05, ADD-06, ADD-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Clicar na máquina alterna chip e check; "x" do chip desmarca
- [ ] Busca filtra por código ou nome
- [ ] Confirmar desabilitado sem seleção; lista vazia mostra a mensagem
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/fleet/MachinePickerModal.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(fleet): add machine picker modal`

---

### Phase 3: Página e documentação

### T8: ✅ `FrotaPage` com o quadro completo

**What**: Título, toolbar (Cadastrar categoria, Search, filtro de categoria), linhas, "+" final, arrastar e soltar, diálogos (criar, adicionar, excluir, detalhe).
**Where**: `Frontend/src/pages/FrotaPage.tsx`
**Depends on**: T7
**Reuses**: Padrão de `VisaoGeralPage` e `EquipePage`, `ConfirmDialog`
**Requirement**: BOARD-01, BOARD-02, MOVE-01, MOVE-02, MOVE-03, CAT-01, CAT-03, ADD-01, ADD-05, DEL-03, DEL-04, FILTER-01, FILTER-02, DETAIL-01, DETAIL-05

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (fidelidade ao Figma)

**Done when**:

- [ ] Arrastar um card de Ativas para Manutenção atualiza os dois contadores
- [ ] Menu ⋮ move e remove; máquina removida aparece no picker
- [ ] Criar categoria adiciona linha vazia no fim; "+" da linha adiciona máquinas sem categoria
- [ ] Excluir categoria pede confirmação e libera as máquinas
- [ ] Search e filtro de categoria funcionam; clicar no card abre o detalhe `fleet`
- [ ] Edge cases da spec cobertos (soltar fora, filtro sem resultado)
- [ ] Gate passes: `cd Frontend && yarn test`

**Tests**: integration
**Gate**: full
**Commit**: `feat(fleet): build fleet kanban page`

---

### T9: ✅ Documentar a Frota

**What**: Seção `src/components/fleet/` e `data/fleet.ts` em `docs/frontend.md`, incluindo a escolha do drag and drop nativo.
**Where**: `docs/frontend.md`
**Depends on**: T8
**Reuses**: Formato das seções existentes
**Requirement**: BOARD-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Doc descreve componentes, modelo do quadro e a decisão de DnD nativo + menu ⋮
- [ ] Gate passes: `cd Frontend && yarn lint && yarn build && yarn test`

**Tests**: none
**Gate**: build
**Commit**: `docs(fleet): document fleet kanban`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 | T2            (independentes, executadas em ordem)
Phase 2:  T3 | T6 | T7       (independentes)
          T4 → T5
Phase 3:  T8 → T9
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Modelo do quadro | 1 arquivo de lógica pura | ✅ Granular |
| T2: Traduções | 1 módulo i18n (7 arquivos espelhados) | ✅ Coeso |
| T3: Variante do detalhe | 1 componente | ✅ Granular |
| T4: FleetCard | 1 componente | ✅ Granular |
| T5: FleetRow | 1 componente | ✅ Granular |
| T6: CategoryFormModal | 1 componente | ✅ Granular |
| T7: MachinePickerModal | 1 componente | ✅ Granular |
| T8: FrotaPage | 1 página | ✅ Granular |
| T9: Docs | 1 arquivo | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None | ✅ Match |
| T2 | None | None | ✅ Match |
| T3 | None | None | ✅ Match |
| T4 | None | None | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | None | None | ✅ Match |
| T7 | None | None | ✅ Match |
| T8 | T7 | T8 (início da fase 3, após toda a fase 2) | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Dados / lógica pura | unit | unit | ✅ OK |
| T2 | Locales | unit | unit | ✅ OK |
| T3 | Componente | unit | unit | ✅ OK |
| T4 | Componente | unit | unit | ✅ OK |
| T5 | Componente | unit | unit | ✅ OK |
| T6 | Componente | unit | unit | ✅ OK |
| T7 | Componente | unit | unit | ✅ OK |
| T8 | Página | integration | integration | ✅ OK |
| T9 | Docs | none | none | ✅ OK |
