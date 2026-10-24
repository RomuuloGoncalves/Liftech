# Dashboard: design

**Spec**: `.specs/features/figma-dashboard/spec.md` · **Decisões em vigor**: AD-009 (Visão Geral lê a API), AD-010 (testes de backend com models mockados), AD-012 (cadastro de máquina pela API).

## Visão geral

Uma página lazy nova (`DashboardPage`) busca três listas já existentes em paralelo, cada uma com estado próprio, e deriva tudo no navegador: contagens, tabela paginada e heatmap. O único ajuste de backend é deixar o admin listar as sessões do escopo, com filtro de filial.

```
Sidebar ("Dashboard") ──> /dashboard (lazy) ──> DashboardPage
                                                 ├─ machineService.listar(filialId) ──> cartões 1,3,4 + MachineTable
                                                 ├─ operatorService.listar(filialId) ──> cartão 2
                                                 └─ sessionService.listar({ from, filialId }) ──> countSessions() ──> UsageHeatmap
Backend: GET /api/sessions ── admin sem machineId ──> todas as sessões do escopo ∩ filialId
```

## Reuso (o que já existe e entra sem mudar)

| Peça | Onde | Uso aqui |
| --- | --- | --- |
| `machineService.listar(filialId?)` | `Frontend/src/services/machineService.ts` | Máquinas da filial |
| `operatorService.listar(filialId?)` | `Frontend/src/services/operatorService.ts` | Contagem de funcionários |
| `sessionService.listar(params)` | `Frontend/src/services/sessionService.ts` | Ganha `filialId` em `FiltroSessoes` |
| `useActiveBranch()` | `Frontend/src/context/ActiveBranchContext.tsx` | `activeBranch === 'todas' ? undefined : activeBranch`, como `VisaoGeralPage` |
| Padrão "filial mudou → loading" (`loadedFilialId` no render) | `Frontend/src/pages/VisaoGeralPage.tsx` | Mesmo padrão, sem `useEffect` extra |
| `StatusBadge` | `Frontend/src/components/machines/StatusBadge.tsx` | Coluna Status (`className` para o tamanho menor da tabela) |
| `MachineDetailModal` | `Frontend/src/components/machines/MachineDetailModal.tsx` | Detalhe só leitura: sem `onEdit`/`onDelete`/`onChangeStatus`/`onToggleLock` (o modal já esconde os botões), `events={[]}` |
| `NewMachinePanel` | `Frontend/src/components/machines/NewMachinePanel.tsx` | "+ Cadastrar Máquina"; setores via `sectorService.listar(filialId).catch(() => [])`, como a Visão Geral |
| `PageSkeleton` sem variante + `SkeletonBlock` | `Frontend/src/components/common/PageSkeleton.tsx` | Skeleton montado com as classes da página |
| `useToast` | `Frontend/src/components/common/Toast.tsx` | `machines.toastCreated` / `machines.saveError` (chaves existentes) |
| `lerMachineId`, `filtroPorFilial` | `Backend/src/feature/session/sessionService.ts`, `Backend/src/core/escopo.ts` | Validação e escopo do filtro novo |
| Rotas lazy com `Suspense` | `Frontend/src/routes/appRoutes.tsx` | Só acrescentar a linha do Dashboard |

## Componentes

### 1. Backend: `sessionService.listar` (alterado)

`Backend/src/feature/session/sessionService.ts`

- `FiltroLista` ganha `filialId?: unknown`.
- `lerFilialId(valor)`: vazio/indefinido → `undefined`; não string ou não ObjectId → `ErroHttp(400, "O campo 'filialId' deve ser um ObjectId válido do MongoDB.")`. Mesmo formato de `lerMachineId`.
- Filtro de filial: `const permitidas = filtroPorFilial(escopo).filialId.$in` e `{ filialId: { $in: filialId ? permitidas.filter((id) => id === filialId) : permitidas } }` (mesma interseção de `listarMaquinas`).
- Dono das sessões sem `machineId`: `usuario.role === 'admin' ? {} : { operadorId: exigirOperador(usuario) }`. Com `machineId`, nada muda.
- O controller (`sessionController.listar`) já repassa `req.query`; não muda.

Risco: um admin que hoje recebe 403 passa a receber dados do próprio escopo. Ninguém chama essa rota como admin hoje (o front só chama sem `machineId` na área do funcionário), então nada quebra.

### 2. `sessionService.listar` (front, alterado)

`FiltroSessoes` ganha `filialId?: string`; a função não muda (os params já vão inteiros).

### 3. `utils/heatmap.ts` (novo, puro)

```ts
export const HEATMAP_HOURS = [6, 8, 10, 12, 15, 16, 18]   // início de cada faixa
export const HEATMAP_WEEKS = 4
// grade[linha da faixa][coluna], coluna 0 = Seg ... 6 = Dom
export function countSessions(inicios: string[]): number[][]
export function heatmapLevel(count: number, max: number): 0 | 1 | 2   // 0 claro, 1 médio, 2 forte
export function heatmapFrom(today: Date): string                     // 'YYYY-MM-DD' de today − 27 dias, data local
```

- Coluna: `(new Date(inicio).getDay() + 6) % 7` (Seg primeiro). Linha: último índice com `hora >= HEATMAP_HOURS[i]`; hora < 6 descarta. 18 h cobre até 23:59.
- `heatmapLevel`: `count === 0 → 0`; `count * 2 > max → 2`; senão `1`.

### 4. `components/dashboard/UsageHeatmap.tsx` (novo)

Props: `{ counts: number[][] }`. Renderiza um `<table>` (cabeçalho com os dias traduzidos, primeira coluna com "6 hrs"…), cada célula com classe do nível e `aria-label` "Seg, 6 hrs: 3 sessões". Abaixo, legenda "Menos ■■■ Mais" e o texto do período; se a soma for 0, "Sem registros no período". Título "Registro por tempo" com ícone `Clock`.

### 5. `components/dashboard/MachineTable.tsx` (novo)

Props: `{ machines: Machine[]; onOpen(machine): void; onCreate(): void }`. Estado local: `query`, `page`.

- Filtro: `nome` ou `identificacao` contém `query` (minúsculas, `trim`). Ao mudar `query`, `page = 1`.
- `PAGE_SIZE = 10`; `pages = Math.max(1, Math.ceil(total / PAGE_SIZE))`; `page` limitado a `pages` (lista encolheu).
- Linhas: nome como `<button>` azul (`onOpen`), setor, `t('dashboard.minutes', { count: tempoSessaoMinutos })`, `StatusBadge`.
- Vazio: uma linha "Nenhuma máquina encontrada".
- Rodapé: `t('dashboard.pageInfo', { count, page, pages })`, setas `ChevronLeft`/`ChevronRight` com `aria-label` traduzido e `disabled` sem vizinha, número da página atual.
- Cabeçalho: ícone `Forklift`, título "Listagem de máquinas", busca (`type="search"`, `aria-label` traduzido, placeholder `machines.searchPlaceholder`) e botão "+ Cadastrar Máquina" (`machines.registerButton`) → `onCreate`.

### 6. `pages/DashboardPage.tsx` (novo, default export para o `lazy`)

- Estado por fonte: `type Source<T> = { state: 'loading' | 'ready' | 'error'; data: T[] }` para `machines`, `operators`, `sessions`. Um `useEffect([filialId, attempt.x])` por fonte, cada um com `stale` como na Visão Geral. `retry(fonte)` volta essa fonte a `loading`.
- Filial mudou (`loadedFilialId !== filialId` no render): as três voltam a `loading`, `detailId = null`.
- Cartões ("Dados rápidos"): `Forklift` máquinas, `Users` funcionários, `Wrench` manutenção (`status === 'manutencao'`), `WrenchOff` desativadas (`status === 'offline'`). Cartões de máquina dependem de `machines`; o de funcionários, de `operators`. Em erro, o cartão mostra `dashboard.loadError` e "Tentar de novo" (`common.retry`).
- "Informações sobre as máquinas": `MachineTable` (depende de `machines`) e `UsageHeatmap` (depende de `sessions`, `counts = countSessions(sessions.map(s => s.inicio))`, memoizado).
- Loading: `SkeletonBlock` com as classes do cartão/tabela/heatmap dentro de `PageSkeleton` (um por área em loading, para não esconder as áreas prontas).
- Cadastro: igual a `handleCreateMachine` da Visão Geral (otimista com id temporário, toast `machines.toastCreated`, falha remove e `machines.saveError`). Copiar o trecho; extrair um hook só se uma terceira tela precisar.
- Detalhe: `detailId` → `MachineDetailModal` sem ações, `events={[]}`, `variant="overview"`.
- CSS em `DashboardPage.module.css` com tokens de `index.css` (`--primary`, `--line`, `--radius-*`, `--fs-*`). Grade: 4 cartões em linha a 1440 px; tabela ~2/3 e heatmap ~1/3; abaixo de 1100 px empilha. Tons do heatmap: `color-mix` de `--primary` (claro 25 %, médio 55 %, forte 100 %).

### 7. Integração

- `routes/appRoutes.tsx`: `const DashboardPage = lazy(() => import('../pages/DashboardPage'))` e `<Route path="/dashboard" element={<DashboardPage />} />`.
- `components/layout/Header.tsx`: `ROUTE_KEYS['/dashboard'] = 'dashboard.title'`.
- `components/layout/Sidebar.tsx`: `{ to: '/dashboard', labelKey: 'dashboard.navLabel', icon: LayoutDashboard }` como primeiro item de `NAV_ITEMS`. O `isActive` atual (`pathname === to`) já cumpre DSH-11.

## i18n (`dashboard.*`, 7 locales, só acréscimo)

`navLabel`, `title`, `quickData`, `machinesRegistered`, `employeesRegistered`, `machinesMaintenance`, `machinesDisabled`, `machinesInfo`, `machineList`, `searchLabel`, `colName`, `colSector`, `colTime`, `colStatus`, `minutes_one`/`minutes_other`, `pageInfo_one`/`pageInfo_other` ("Exibindo {{count}} máquinas - Página {{page}} de {{pages}}"), `prevPage`, `nextPage`, `noResults`, `usageTitle`, `weekdays` (objeto `mon`…`sun` → "Seg", "Ter", "Quar", "Quin", "Sex", "Sab", "Dom"), `hourLabel` ("{{hour}} hrs"), `cellLabel` ("{{day}}, {{hour}} hrs: {{count}} sessões", com `_one`), `less`, `more`, `period` ("Sessões nas últimas 4 semanas"), `noSessions`, `loadError`. `ja` e `ru` seguem as regras de plural do i18next (`_other` em `ja`; `_one/_few/_many/_other` em `ru`).

## Testes (por camada)

| Camada | Arquivo | O que prova |
| --- | --- | --- |
| Backend service | `Backend/tests/unit/sessionService.test.ts` | admin sem `machineId` → consulta sem `operadorId`; `filialId` reduz o `$in`; fora do escopo → `$in: []`; `filialId` inválido → 400 sem `find`; colaborador inalterado; sem operador e não admin → 403 (DSH-14..16) |
| Front service | `Frontend/src/test/services/sessionService.test.ts` | `filialId` vai em `params` |
| Util | `Frontend/src/test/utils/heatmap.test.ts` | dia/faixa de borda (5:59 fora, 6:00 linha 0, 14:59 linha 3, 23:59 linha 6, domingo coluna 6), níveis, `heatmapFrom` |
| Componentes | `Frontend/src/test/components/dashboard/*.test.tsx` | tabela (paginação, busca, setas, vazio, clique), heatmap (células, `aria-label`, vazio) |
| Página | `Frontend/src/test/pages/DashboardPage.test.tsx` | contagens, erro parcial com retry, skeleton, troca de filial, cadastro, detalhe sem ações (serviços mockados com `vi.mock`, como `VisaoGeralPage.test.tsx`) |
| Integração | `Frontend/src/test/routes/appRoutes.test.tsx`, `test/components/layout/Sidebar.test.tsx`, `Header.test.tsx` | rota, item ativo, título |
| i18n | `Frontend/src/test/config/i18n.test.ts` | as chaves `dashboard.*` existem em pt-BR e o namespace existe nos 7 (o teste de paridade de top-level já cobre) |
