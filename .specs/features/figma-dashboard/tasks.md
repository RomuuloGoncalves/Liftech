# Dashboard Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Commits:** sem commit (decisão do dono). Cada task termina com o gate verde e o `tasks.md` marcado; o nível 1 integra o diff na branch `fix/crud-funcionario-integridade`.

---

**Spec**: `.specs/features/figma-dashboard/spec.md`
**Design**: `.specs/features/figma-dashboard/design.md`
**Status**: Draft

---

## Test Coverage Matrix

Provenance: amostras `Backend/tests/unit/sessionService.test.ts` (vitest, models mockados, AD-010), `Frontend/src/test/pages/VisaoGeralPage.test.tsx` e `Frontend/src/test/components/layout/Sidebar.test.tsx` (vitest + testing-library, serviços com `vi.mock`). Sem guia de testes escrito no repo; vale o padrão forte (cada AC e edge case coberto).

| Layer | Test type | Location | Coverage Expectation |
| --- | --- | --- | --- |
| Backend service | unit (models mockados) | `Backend/tests/unit/` | Cada AC de backend (DSH-14..16) + edge case de filial fora do escopo |
| Front service | unit (axios mockado) | `Frontend/src/test/services/` | Parâmetro novo enviado |
| Util puro | unit | `Frontend/src/test/utils/` | Bordas de dia, faixa e nível |
| Componente | unit (testing-library) | `Frontend/src/test/components/dashboard/` | Cada AC visível do componente + vazio |
| Página | unit (testing-library, serviços mockados) | `Frontend/src/test/pages/` | Carga, erro parcial, skeleton, filial, cadastro, detalhe |
| Rotas/layout | unit | `Frontend/src/test/routes/`, `Frontend/src/test/components/layout/` | Rota, título, item ativo |
| i18n | unit | `Frontend/src/test/config/i18n.test.ts` | Chaves `dashboard.*` em pt-BR; paridade top-level nos 7 |

## Gate Check Commands

Node 25: `export PATH=$HOME/.nvm/versions/node/v25.9.0/bin:$PATH` antes de qualquer gate.

| Gate | Command |
| --- | --- |
| backend | `cd Backend && yarn test && yarn build` |
| quick | `cd Frontend && yarn test` |
| full | `cd Frontend && yarn test && yarn lint && yarn build` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation

Peças independentes entre si.

```
T1    T2    T3    T4
```

### T1: Admin lista sessões do escopo com filtro de filial
### T2: `filialId` no sessionService do front
### T3: Contagem e níveis do heatmap
### T4: Chaves `dashboard.*` nos 7 locales

### Phase 2: Core Implementation

```
T5 -> T7
T6 -> T7
```

### T5: UsageHeatmap
### T6: MachineTable
### T7: DashboardPage

### Phase 3: Integration

Independentes entre si; todas usam a página da fase 2.

```
T8    T9    T10
```

### T8: Rota `/dashboard`
### T9: Título no Header
### T10: Item no Sidebar

---

## Task Breakdown

#### Phase 1 tasks

### T1: Admin lista sessões do escopo com filtro de filial

**What**: Em `listar`, admin sem `machineId` recebe as sessões de todos os operadores do escopo; `filialId` opcional reduz o escopo (interseção) e é validado como ObjectId.
**Where**: `Backend/src/feature/session/sessionService.ts`
**Depends on**: None
**Reuses**: `lerMachineId` (formato do erro 400), `filtroPorFilial`, interseção de `listarMaquinas` em `Backend/src/feature/machine/machineService.ts`
**Requirement**: DSH-14, DSH-15, DSH-16

**Done when**:
- [ ] `FiltroLista.filialId` e `lerFilialId` existem; `filialId` inválido lança 400 antes de `WorkSession.find`.
- [ ] Admin sem `machineId`: `find` recebe `{ filialId: { $in: <escopo ∩ filialId> } }` sem `operadorId`.
- [ ] Colaborador sem `machineId` segue com `operadorId`; usuário sem operador e não admin segue com 403.
- [ ] Testes novos em `Backend/tests/unit/sessionService.test.ts`: admin sem filtro, admin com `filialId` do escopo, admin com `filialId` fora do escopo (`$in: []`), `filialId` inválido (400, `find` não chamado), colaborador inalterado; o teste existente "sem machineId e sem operador: 403" continua passando.

**Tests**: unit
**Gate**: backend

---

### T2: `filialId` no sessionService do front

**What**: `FiltroSessoes` ganha `filialId?: string`.
**Where**: `Frontend/src/services/sessionService.ts`
**Depends on**: None
**Reuses**: `listar` atual (já repassa `params`)
**Requirement**: DSH-06, DSH-10

**Done when**:
- [ ] Teste em `Frontend/src/test/services/sessionService.test.ts` prova que `listar({ from, filialId })` chama `GET /sessions` com os dois em `params`.

**Tests**: unit
**Gate**: quick

---

### T3: Contagem e níveis do heatmap

**What**: Funções puras `countSessions`, `heatmapLevel`, `heatmapFrom` e as constantes `HEATMAP_HOURS`/`HEATMAP_WEEKS`, conforme design §3.
**Where**: `Frontend/src/utils/heatmap.ts`
**Depends on**: None
**Reuses**: nada (stdlib `Date`)
**Requirement**: DSH-06, DSH-07

**Done when**:
- [ ] `Frontend/src/test/utils/heatmap.test.ts` cobre: 05:59 fora; 06:00 → linha 0; 14:59 → linha 3 (faixa 12); 15:00 → linha 4; 23:59 → linha 6; segunda → coluna 0; domingo → coluna 6; lista vazia → grade 7×7 de zeros.
- [ ] `heatmapLevel`: `(0, 4) → 0`, `(1, 4) → 1`, `(2, 4) → 1`, `(3, 4) → 2`, `(1, 1) → 2`.
- [ ] `heatmapFrom(new Date(2026, 9, 28))` → `'2026-10-01'` (hoje − 27 dias, data local).

**Tests**: unit
**Gate**: quick

---

### T4: Chaves `dashboard.*` nos 7 locales

**What**: Acrescentar o bloco `dashboard` (lista do design, seção i18n) em cada locale, sem editar chaves existentes.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Reuses**: chaves existentes `machines.registerButton`, `machines.searchPlaceholder`, `machines.toastCreated`, `machines.saveError`, `common.retry`, `common.loading`
**Requirement**: DSH-01, DSH-02, DSH-03, DSH-04, DSH-06, DSH-07, DSH-08, DSH-13

**Done when**:
- [ ] Os 7 arquivos têm o bloco `dashboard` com as mesmas chaves (plurais conforme a regra de cada idioma).
- [ ] Novo caso em `Frontend/src/test/config/i18n.test.ts`: pt-BR define cada chave `dashboard.*` usada pelo design, e `t('dashboard.pageInfo', { count: 4, page: 1, pages: 1 })` dá "Exibindo 4 máquinas - Página 1 de 1".
- [ ] O teste de paridade de top-level existente continua passando.

**Tests**: unit
**Gate**: quick

---

#### Phase 2 tasks

### T5: UsageHeatmap

**What**: Componente do painel "Registro por tempo" (design §4): tabela 7×7, 3 tons, legenda, período e texto de vazio, com o CSS module ao lado.
**Where**: `Frontend/src/components/dashboard/UsageHeatmap.tsx`
**Depends on**: T3, T4
**Reuses**: `heatmapLevel`, `HEATMAP_HOURS`; `Clock` do `lucide-react`; tokens de `index.css`
**Requirement**: DSH-06, DSH-07

**Done when**:
- [ ] `Frontend/src/test/components/dashboard/UsageHeatmap.test.tsx`: cabeçalhos Seg…Dom e 6…18 hrs na ordem do Figma; célula com `aria-label` "Seg, 6 hrs: 3 sessões" e classe do nível forte quando é o máximo; contagem zero com classe clara; grade toda zero mostra "Sem registros no período"; legenda "Menos"/"Mais" presente.

**Tests**: unit
**Gate**: quick

---

### T6: MachineTable

**What**: Painel "Listagem de máquinas" (design §5): busca por nome/identificação, 10 por página, rodapé com contagem e setas, linha vazia, nome clicável, botão de cadastro, com o CSS module ao lado.
**Where**: `Frontend/src/components/dashboard/MachineTable.tsx`
**Depends on**: T4
**Reuses**: `StatusBadge`, tipo `Machine` de `data/machines.ts`, ícones `Forklift`/`Search`/`Plus`/`ChevronLeft`/`ChevronRight`
**Requirement**: DSH-03, DSH-04, DSH-05, DSH-12, DSH-13

**Done when**:
- [ ] `Frontend/src/test/components/dashboard/MachineTable.test.tsx`: 23 máquinas → 10 linhas, "Exibindo 23 máquinas - Página 1 de 3", seta anterior desabilitada e próxima habilitada; na página 3, 3 linhas e próxima desabilitada; 20 máquinas → "de 2"; busca por parte do nome e por identificação filtra e volta à página 1; busca sem resultado → "Nenhuma máquina encontrada", "Exibindo 0 máquinas - Página 1 de 1", duas setas desabilitadas; clicar no nome chama `onOpen` com a máquina; clicar em "Cadastrar Máquina" chama `onCreate`; coluna Tempo mostra "34 minutos".

**Tests**: unit
**Gate**: quick

---

### T7: DashboardPage

**What**: Página com cartões de dados rápidos, `MachineTable` e `UsageHeatmap`, carga por fonte com erro e retry isolados, skeletons, troca de filial, cadastro otimista e detalhe só leitura (design §6), com o CSS module ao lado.
**Where**: `Frontend/src/pages/DashboardPage.tsx`
**Depends on**: T5, T6
**Reuses**: padrão de `VisaoGeralPage.tsx` (`loadedFilialId`, `stale`, `handleCreateMachine`), `useActiveBranch`, `useToast`, `PageSkeleton`/`SkeletonBlock`, `NewMachinePanel`, `MachineDetailModal`, `machineService`, `operatorService`, `sectorService`, `sessionService` (T2), `countSessions`/`heatmapFrom` (T3)
**Requirement**: DSH-02, DSH-05, DSH-08, DSH-09, DSH-10, DSH-12

**Done when**:
- [ ] `Frontend/src/test/pages/DashboardPage.test.tsx` (serviços com `vi.mock`):
  - 3 máquinas (1 `manutencao`, 1 `offline`) e 2 operadores → cartões 3, 2, 1, 1 com os rótulos do Figma.
  - Sessões pedidas com `from` = `heatmapFrom(hoje)` e o `filialId` ativo; com filial "todas", sem `filialId`.
  - Antes das promessas resolverem: `aria-busy` e nenhum número.
  - `operatorService.listar` rejeita → cartão de funcionários mostra o erro com "Tentar de novo", tabela e outros cartões aparecem; clicar em "Tentar de novo" chama o serviço de novo e mostra o número. Mesmo caso para sessões (heatmap com erro, tabela intacta).
  - Trocar a filial ativa → skeleton e nova chamada dos 3 serviços com o novo `filialId`.
  - Cadastrar pelo painel → nova linha, cartão de máquinas +1, toast de criada; criação rejeitada → linha some e toast de erro.
  - Clicar no nome → modal de detalhe sem os botões de editar e excluir.

**Tests**: unit
**Gate**: full

---

#### Phase 3 tasks

### T8: Rota `/dashboard`

**What**: Registrar `DashboardPage` com `lazy` em `/dashboard`.
**Where**: `Frontend/src/routes/appRoutes.tsx`
**Depends on**: T7
**Reuses**: padrão `lazy(() => import(...))` do arquivo
**Requirement**: DSH-01

**Done when**:
- [ ] Caso novo em `Frontend/src/test/routes/appRoutes.test.tsx`: `/dashboard` renderiza a página (serviços mockados) e não cai no 404.

**Tests**: unit
**Gate**: quick

---

### T9: Título no Header

**What**: `ROUTE_KEYS['/dashboard'] = 'dashboard.title'`.
**Where**: `Frontend/src/components/layout/Header.tsx`
**Depends on**: T7
**Reuses**: mapa `ROUTE_KEYS` existente
**Requirement**: DSH-01

**Done when**:
- [ ] Caso novo em `Frontend/src/test/components/layout/Header.test.tsx`: em `/dashboard` o título é "Dashboard".

**Tests**: unit
**Gate**: quick

---

### T10: Item no Sidebar

**What**: Primeiro item de `NAV_ITEMS`: `{ to: '/dashboard', labelKey: 'dashboard.navLabel', icon: LayoutDashboard }`. Mexe só no array e no import (arquivo disputado com feedback e modal-alerta).
**Where**: `Frontend/src/components/layout/Sidebar.tsx`
**Depends on**: T7
**Reuses**: `NAV_ITEMS` e o `isActive` existentes
**Requirement**: DSH-01, DSH-11

**Done when**:
- [ ] `Frontend/src/test/components/layout/Sidebar.test.tsx` atualizado: a lista tem 5 links com "Dashboard" primeiro; em `/dashboard` só ele tem `aria-current="page"`; em `/` só "Visão Geral" tem; o link aponta para `/dashboard`. Ajustar a contagem de links do teste existente (era 4), sem remover asserções.

**Tests**: unit
**Gate**: full

---

## Validation

### Diagram-Definition Cross-Check

| Task | Depends on (definição) | Diagrama | OK |
| --- | --- | --- | --- |
| T1 | None | sem seta | ✅ |
| T2 | None | sem seta | ✅ |
| T3 | None | sem seta | ✅ |
| T4 | None | sem seta | ✅ |
| T5 | T3, T4 (fase 1) | sem seta intra-fase | ✅ |
| T6 | T4 (fase 1) | sem seta intra-fase | ✅ |
| T7 | T5, T6 | T5 → T7, T6 → T7 | ✅ |
| T8 | T7 (fase 2) | sem seta intra-fase | ✅ |
| T9 | T7 (fase 2) | sem seta intra-fase | ✅ |
| T10 | T7 (fase 2) | sem seta intra-fase | ✅ |

### Test Co-location

| Task | Camada | Tipo exigido | Tests do task | OK |
| --- | --- | --- | --- | --- |
| T1 | Backend service | unit | unit | ✅ |
| T2 | Front service | unit | unit | ✅ |
| T3 | Util | unit | unit | ✅ |
| T4 | i18n | unit | unit | ✅ |
| T5 | Componente | unit | unit | ✅ |
| T6 | Componente | unit | unit | ✅ |
| T7 | Página | unit | unit | ✅ |
| T8 | Rotas | unit | unit | ✅ |
| T9 | Layout | unit | unit | ✅ |
| T10 | Layout | unit | unit | ✅ |

### Requirement → Task

| Requirement | Tasks |
| --- | --- |
| DSH-01 | T4, T8, T9, T10 |
| DSH-02 | T4, T7 |
| DSH-03 | T4, T6 |
| DSH-04 | T4, T6 |
| DSH-05 | T6, T7 |
| DSH-06 | T2, T3, T4, T5 |
| DSH-07 | T3, T4, T5 |
| DSH-08 | T4, T7 |
| DSH-09 | T7 |
| DSH-10 | T2, T7 |
| DSH-11 | T10 |
| DSH-12 | T6, T7 |
| DSH-13 | T4, T6 |
| DSH-14 | T1 |
| DSH-15 | T1 |
| DSH-16 | T1 |
