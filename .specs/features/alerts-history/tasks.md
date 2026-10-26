# Histórico de Alertas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (sem `design.md`: reusa `MachineDetailModal`, `FleetCard`, `filterEvents` e o padrão de página da Visão Geral)
**Status**: Done

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `docs/frontend.md` (testes espelham `src/` em `src/test/`, Vitest + Testing Library), `docs/i18n.md` (toda chave nos 7 locales, caso de teste para módulo novo em `i18n.test.ts`).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Mock data / pure functions (`data/`, `utils/`) | unit | All branches; 1:1 to spec ACs | `Frontend/src/test/{data,utils}/*.test.ts` | `yarn vitest run <file>` |
| Locales (`locales/*.json`) | unit | Módulo presente e com as mesmas chaves não vazias nos 7 idiomas | `Frontend/src/test/config/i18n.test.ts` | `yarn vitest run src/test/config/i18n.test.ts` |
| Components / pages | unit (Testing Library) | Every AC rendered/interacted: happy + edge (empty, inverted period) | `Frontend/src/test/{components,pages}/**/*.test.tsx` | `yarn vitest run <file>` |
| Docs | none | build gate only | - | build gate only |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `cd Frontend && yarn vitest run <file>` |
| Full | After tasks touching shared components | `cd Frontend && yarn test` |
| Build | After phase completion or docs-only tasks | `cd Frontend && yarn lint && yarn build && yarn test` |

---

## Execution Plan

### Phase 1: Foundation (independente da Frota)

```
T1
T2
T3
```

### Phase 2: Reuso dos componentes da Frota (depois de `git merge main`)

```
T4
T5
```

### Phase 3: Tela

```
T1 → T6
T2 → T6
T3 → T6
T4 → T6
T5 → T6
T6 → T7
```

---

## Task Breakdown

### T1: Causa e urgência dos acidentes no mock

**What**: Adicionar `causa` (`frenagem` | `colisao` | `tombamento`) aos eventos de acidente e exportar o mapa `ACCIDENT_URGENCY` (causa → `media` | `alta` | `critica`).
**Where**: `Frontend/src/data/machines.ts`
**Depends on**: None
**Reuses**: `MACHINE_EVENTS`
**Requirement**: ALRT-03

**Done when**:

- [x] Todo evento `acidente` tem `causa`; nenhum `manutencao` tem
- [x] As três causas aparecem no mock
- [x] Mapa frenagem→media, colisao→alta, tombamento→critica testado
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(alerts): add accident cause and urgency to mock events`

---

### T2: Formato "23 Janeiro 2026" da data do alerta

**What**: Função `formatAlertDate(isoDate, language)` → dia, mês por extenso com inicial maiúscula e ano.
**Where**: `Frontend/src/utils/format.ts`
**Depends on**: None
**Reuses**: `capitalize`, lógica de `formatEventDate`
**Requirement**: ALRT-02

**Done when**:

- [x] `formatAlertDate('2026-01-23', 'pt-BR')` = "23 Janeiro 2026"
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(alerts): add alert date formatter`

---

### T3: Módulo `alerts` nos 7 idiomas

**What**: Módulo `alerts` logo depois de `machines` nos 7 `translation.json`, `alerts` em `REQUIRED_MODULES` e caso de teste de chaves.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Requirement**: ALRT-08

**Done when**:

- [x] Mesmas chaves não vazias nos 7 idiomas
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(i18n): add alerts translations`

---

### T4: Variante `alerts` no detalhe da máquina

**What**: `variant="alerts"` no `MachineDetailModal`: linhas da Frota, aba "Histórico de alertas" primeiro e selecionada, sem selo de status; `overview` e `fleet` inalterados.
**Where**: `Frontend/src/components/machines/MachineDetailModal.tsx`
**Depends on**: None
**Requirement**: ALRT-07

**Done when**:

- [x] Com `variant="alerts"`, abas Alertas → Reparos com Alertas selecionada, sem selo nem Editar/Excluir
- [x] Variantes existentes mantidas (suíte atual passa)
- [x] Gate full passa

**Tests**: unit
**Gate**: full
**Commit**: `feat(machines): add alerts variant to machine detail modal`

---

### T5: Nível de urgência no card de acidente

**What**: Prop opcional `urgency` no `FleetCard` (`kind="acidentes"`) para mostrar o nível colorido no lugar do "Urgente" fixo; ações de mover/arrastar opcionais (sem elas, sem menu e sem drag); data via `formatAlertDate`.
**Where**: `Frontend/src/components/fleet/FleetCard.tsx`
**Depends on**: None
**Requirement**: ALRT-02, ALRT-03

**Done when**:

- [x] Com a prop, mostra "Média"/"Alta"/"Crítica" com a classe de cor
- [x] Sem a prop, mostra "Urgente" como antes
- [x] Sem `onMove`/`onRemove`/`onDragStart`, sem botão ⋮ e `draggable=false`
- [x] Gate full passa

**Tests**: unit
**Gate**: full
**Commit**: `feat(fleet): show urgency level on accident card`

---

### T6: Página Histórico de Alertas

**What**: `AlertasPage` com painel, selo "Acidentes" + contador, busca, período, grid de cards, estado vazio e detalhe.
**Where**: `Frontend/src/pages/AlertasPage.tsx`
**Depends on**: T1, T2, T3, T4, T5
**Reuses**: `filterEvents`, `DEFAULT_PERIOD`, `FleetCard`, `MachineDetailModal`, estilos da Visão Geral
**Requirement**: ALRT-01, ALRT-02, ALRT-04, ALRT-05, ALRT-06, ALRT-07

**Done when**:

- [x] Todos os ACs das três histórias cobertos em `src/test/pages/AlertasPage.test.tsx`
- [x] Gate build passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(alerts): add alerts history page`

---

### T7: Documentação

**What**: Atualizar `docs/frontend.md` (AlertasPage deixa de ser placeholder) e `docs/i18n.md` (módulo `alerts`).
**Where**: `docs/frontend.md`
**Depends on**: T6
**Requirement**: ALRT-08

**Done when**:

- [x] Docs descrevem a tela e o módulo
- [x] Gate build passa

**Tests**: none
**Gate**: build
**Commit**: `docs(alerts): document alerts history page`
