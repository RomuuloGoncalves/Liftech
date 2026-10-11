# Restyle conforme o Figma Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Regra do projeto (`CLAUDE.md`)**: nenhum `git commit` neste repositório. Cada task termina com as mudanças no working tree e o checkbox marcado; o dono revisa e commita.

---

**Design**: inline (tokens e troca de cor em CSS; sem decisão de arquitetura nova)
**Spec**: `.specs/features/figma-restyle/spec.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/frontend.md` (testes espelham `src/`), `Frontend/package.json` (vitest, jsdom, Testing Library), `.specs/features/ui-polish` e `type-scale` (padrão de teste estático sobre CSS). `Frontend/vite.config.ts` não define threshold de cobertura.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Tokens / CSS global (`index.css`, `index.html`) | unit (estático: lê o arquivo) | Cada AC de tokens, fonte e fundo vira uma asserção sobre o texto do arquivo | `Frontend/src/test/styles/*.test.ts` | `npx vitest run src/test/styles` |
| Componente React (`components/**`) | unit (Testing Library) | Cada AC de status, botão, cabeçalho de urgência e ausência de ícone; ramos por variante | `Frontend/src/test/components/**/*.test.tsx` | `npx vitest run src/test/components` |
| Página (`pages/**`) | unit (Testing Library) | Suíte existente continua passando; sem teste novo se a página só troca CSS | `Frontend/src/test/pages/*.test.tsx` | `npx vitest run src/test/pages` |
| CSS Module sem lógica | unit (estático) | Coberto pelo teste de "sem hex fora de index.css" (T10) | `Frontend/src/test/styles/` | `npx vitest run src/test/styles` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Baseline: 479 testes, **3 falhas anteriores a esta feature** (`MachineCard` x2 e `VisaoGeralPage` x1 esperam "34 min"/"0 min", o app renderiza "34 minutos"). O gate exige que nenhum teste novo falhe e que essas 3 continuem sendo as únicas.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Task que toca um arquivo/pasta com teste próprio | `cd Frontend && npx vitest run <caminho do teste>` |
| Full | Task que muda componente compartilhado | `cd Frontend && npx vitest run --maxWorkers=4` |
| Build | Fim de fase e T10 | `cd Frontend && npm run lint && npm run build && npx vitest run --maxWorkers=4` |

---

## Execution Plan

### Phase 1: Foundation

```
T1 → T2
```

### Phase 2: Shell e superfícies compartilhadas

```
T3
T4
```

### Phase 3: Domínios

```
T5
T6 → T7
T8
```

### Phase 4: Fechamento

```
T9 → T10
```

### Phase 5: Correções da validação e cabeçalho por status

```
T11 → T12
```

---

## Task Breakdown

### Phase 1: Foundation

#### T1: Tokens do Style Guide e fundo de página

**What**: Declarar os 13 tokens do guide + `--danger-solid`, `--urgency-*`, `--line`, `--sidebar-line`, `--bg-page`; `:root` passa a usar `--bg-page` de fundo e `--black-title`/`--black-text` em `--text-h`/`--text`; manter os nomes antigos (`--accent`, `--border`, `--bg`…) como alias para não quebrar os módulos.
**Where**: `Frontend/src/index.css`
**Depends on**: None
**Reuses**: tokens existentes em `index.css` (`--text`, `--accent`, `--border`)
**Requirement**: RST-01, RST-04, RST-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `src/test/styles/tokens.test.ts` confere os 13 valores do guide e os 7 tokens extras (AC RST-01)
- [x] O teste confere `:root` com `background: var(--bg-page)` e `--text-h` = `#181818`, `--text` = `#4c4c4c` (AC RST-05)
- [x] Gate: `cd Frontend && npx vitest run src/test/styles`
- [x] Test count: ≥ 3 testes novos passam, suíte anterior sem remoções

**Tests**: unit
**Gate**: quick

---

#### T2: Fonte Host Grotesk

**What**: Trocar o link de Google Fonts (Inter + Lexend) por Host Grotesk 400-700 e usar `'Host Grotesk', system-ui, …` em `--sans`/`--heading`.
**Where**: `Frontend/index.html`
**Depends on**: T1
**Reuses**: link de Google Fonts existente
**Requirement**: RST-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `src/test/styles/font.test.ts` confere que `index.html` carrega `Host Grotesk` e que `index.css` tem `'Host Grotesk'` como 1ª família de `--sans` e `--heading`
- [x] `index.html` não referencia mais Inter nem Lexend
- [x] Gate: `cd Frontend && npx vitest run src/test/styles`
- [x] Test count: ≥ 2 testes novos passam

**Tests**: unit
**Gate**: quick

---

### Phase 2: Shell e superfícies compartilhadas

#### T3: Header e Sidebar

**What**: Header com fundo `--bg-page` e divisor `--line`; Sidebar com borda direita `--sidebar-line`; avatar e item ativo em `--blue`; trocar hex/rgba restantes por tokens.
**Where**: `Frontend/src/components/layout/`
**Depends on**: T1
**Reuses**: `var(--bg-sidebar)`, `var(--active-bg)` já usados
**Requirement**: RST-04, RST-05

**Tools**:

- MCP: `Claude_Browser` (conferir visual)
- Skill: NONE

**Done when**:

- [x] `src/test/styles/layout.test.ts` confere `.header` com `var(--bg-page)` e `var(--line)`, e a Sidebar com `var(--sidebar-line)` (AC RST-05)
- [x] Testes existentes de `components/layout` seguem verdes
- [x] Gate: `cd Frontend && npx vitest run src/test/components/layout src/test/styles`
- [x] Test count: ≥ 2 testes novos passam, nenhum removido

**Tests**: unit
**Gate**: quick

---

#### T4: Modais, botões de diálogo e componentes comuns

**What**: `DialogButtons` com `--danger-solid`/`--blue`; overlay do `Modal` em `rgba(245, 245, 245, 0.55)` com caixa branca; `Toast` e `PageSkeleton` sem hex.
**Where**: `Frontend/src/components/common/`
**Depends on**: T1
**Reuses**: `DialogButtons.module.css`, `Modal.module.css`
**Requirement**: RST-08, RST-09

**Tools**:

- MCP: `Claude_Browser`
- Skill: NONE

**Done when**:

- [x] `src/test/styles/common.test.ts` confere o overlay do `Modal` em `rgba(245, 245, 245, 0.55)` e a caixa em `var(--bg)` (AC RST-09)
- [x] `src/test/styles/common.test.ts` confere `--danger-solid` em `.cancel` e `--blue` em `.confirm` (AC RST-08)
- [x] Gate: `cd Frontend && npx vitest run src/test/components/common src/test/styles`
- [x] Test count: ≥ 3 testes novos passam, nenhum removido

**Tests**: unit
**Gate**: quick

---

### Phase 3: Domínios

#### T5: Status e detalhe da máquina (Visão Geral)

**What**: Badges do `MachineCard` (Disponível verde, Em uso azul, Manutenção amarelo, Offline cinza) e pill do `MachineDetailModal` (mesmas cores); `NewMachinePanel` sem hex.
**Where**: `Frontend/src/components/machines/`
**Depends on**: T1
**Reuses**: `STATUS_CLASS` em `MachineCard.tsx`
**Requirement**: RST-06, RST-08

**Tools**:

- MCP: `Claude_Browser`
- Skill: NONE

**Done when**:

- [x] `src/test/styles/machines.test.ts` confere que `.statusAvailable`, `.statusInUse`, `.statusMaintenance` usam `--green-bg`/`--green`, `--blue-bg`/`--blue`, `--yellow-bg`/`--yellow` (AC RST-06)
- [x] Teste do `MachineDetailModal` confere o pill de status Disponível/Em uso/Manutenção (AC RST-06)
- [x] Botão Excluir Máquina usa `--danger-solid`, Editar usa `--blue` (AC RST-08)
- [x] Gate: `cd Frontend && npx vitest run src/test/components/machines src/test/styles`
- [x] Test count: ≥ 4 testes novos passam; as 2 falhas anteriores de `MachineCard` (texto "34 min") continuam as únicas falhas desta pasta

**Tests**: unit
**Gate**: quick

---

#### T6: Chips de categoria da Frota

**What**: `FleetRow.module.css` (e `FleetRow.tsx` se faltar a classe por tipo) com chip por tipo (`acidentes` vermelho, `ativas` azul, `manutencao` amarelo, `disponiveis` verde) usando `-bg` + cor sólida + borda; `custom` mantém `--category-color`; botão "Excluir categoria" em `--danger-solid`.
**Where**: `Frontend/src/components/fleet/FleetRow.module.css`
**Depends on**: T1
**Reuses**: `CategoryKind` em `data/fleet.ts`, `--category-color` em `FleetRow`
**Requirement**: RST-07, RST-08

**Tools**:

- MCP: `Claude_Browser`
- Skill: NONE

**Done when**:

- [x] `src/test/components/fleet/FleetRow.test.tsx` renderiza cada `kind` e confere a classe do chip (AC RST-07)
- [x] Teste `custom` confere que `--category-color` continua aplicado (AC RST-07)
- [x] `src/test/styles/fleet.test.ts` confere `--danger-solid` no botão excluir categoria (AC RST-08)
- [x] Gate: `cd Frontend && npx vitest run src/test/components/fleet/FleetRow.test.tsx src/test/styles`
- [x] Test count: ≥ 5 testes novos passam, nenhum removido

**Tests**: unit
**Gate**: quick

---

#### T7: Card de acidente por urgência, sem caixa de ícone

**What**: `FleetCard.tsx` e `FleetCard.module.css`: card de acidente com cabeçalho preenchido (`--urgency-critical`/`high`/`medium`, texto branco), rótulo de urgência na mesma cor e `--urgency-critical` quando não há urgência; remover a caixa de ícone do `FleetCard`; `CategoryFormModal` e `MachinePickerModal` sem hex.
**Where**: `Frontend/src/components/fleet/FleetCard.tsx`
**Depends on**: T6
**Reuses**: `URGENCY_TONE` e `urgency` em `FleetCard.tsx`
**Requirement**: RST-10, RST-11

**Tools**:

- MCP: `Claude_Browser`
- Skill: NONE

**Done when**:

- [x] `src/test/components/fleet/FleetCard.test.tsx` renderiza Crítica, Alta, Média e sem urgência, e confere a variável de cor do cabeçalho e do rótulo (AC RST-10)
- [x] Teste confere que o botão do título e o menu ⋮ continuam acessíveis e que a caixa de ícone não existe (AC RST-11)
- [x] Gate: `cd Frontend && npx vitest run src/test/components/fleet src/test/pages/AlertasPage.test.tsx src/test/pages/FrotaPage.test.tsx`
- [x] Test count: ≥ 6 testes novos passam, nenhum removido

**Tests**: unit
**Gate**: full

---

#### T8: Equipe: botões de Setor e cards sem caixa de ícone

**What**: `SectorCard` com excluir/editar como quadrados preenchidos (`--danger-solid`/`--blue`, ícone branco); remover a caixa de ícone de `SectorCard` e `EmployeeCard`; `TeamForm` e `EmployeeCard` sem hex.
**Where**: `Frontend/src/components/team/`
**Depends on**: T1
**Reuses**: classes `.delete`/`.edit` existentes
**Requirement**: RST-08, RST-11

**Tools**:

- MCP: `Claude_Browser`
- Skill: NONE

**Done when**:

- [x] `src/test/components/team/SectorCard.test.tsx` confere botões excluir/editar com as classes preenchidas e sem a caixa de ícone (AC RST-08, RST-11)
- [x] `EmployeeCard.test.tsx` confere ausência da caixa de ícone e o toggle de acesso intacto (AC RST-11)
- [x] Gate: `cd Frontend && npx vitest run src/test/components/team src/test/pages/EquipePage.test.tsx`
- [x] Test count: ≥ 4 testes novos passam, nenhum removido

**Tests**: unit
**Gate**: full

---

### Phase 4: Fechamento

#### T9: Páginas e auth sem hex

**What**: Trocar hex/rgba restantes de `pages/*.module.css` e de `components/auth/*.module.css` por tokens, mantendo só os gradientes de auth e `rgba` preto/branco; fundo de auth em `--bg-page`; fonte de auth herda a global.
**Where**: `Frontend/src/pages/`
**Depends on**: T3, T4, T5, T6, T7, T8
**Reuses**: tokens de T1
**Requirement**: RST-03, RST-04

**Tools**:

- MCP: `Claude_Browser`
- Skill: NONE

**Done when**:

- [x] `grep -E '#[0-9a-fA-F]{3,8}'` nos `.css` retorna só `index.css`, `AuthLayout.module.css` e `AuthForm.module.css`
- [x] Suítes de `pages` e `components/auth` seguem verdes
- [x] Gate: `cd Frontend && npx vitest run src/test/pages src/test/components/auth`
- [x] Test count: nenhum teste removido; falhas = as 3 do baseline

**Tests**: unit
**Gate**: full

---

#### T10: Guarda "sem cor solta" e fechamento

**What**: Teste estático que varre todos os `.css` de `src/` e falha se houver hex fora de `index.css`/auth ou `rgba` com canal que não seja preto/branco fora de `index.css`.
**Where**: `Frontend/src/test/styles/no-hardcoded-colors.test.ts`
**Depends on**: T9
**Reuses**: padrão de teste estático de `src/test/styles/tokens.test.ts` (T1)
**Requirement**: RST-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O teste falha ao introduzir um `#abc` num módulo (verificado uma vez e revertido) e passa no código final (AC RST-03)
- [x] Gate: `cd Frontend && npm run lint && npm run build && npx vitest run --maxWorkers=4`
- [x] Test count: baseline 479 + novos; falhas = só as 3 do baseline

**Tests**: unit
**Gate**: build

---

### Phase 5: Correções da validação e cabeçalho por status

#### T11: Cobertura dos gaps do Verifier

**What**: Testes estáticos para fundo branco de cards e seções (RST-04 AC2), `.app-main` com `--bg-page` (RST-04 AC1) e botões primários com `--blue` (RST-08 AC2); fallback `system-ui` também em `--heading`.
**Where**: `Frontend/src/test/styles/surfaces.test.ts`
**Depends on**: T10
**Reuses**: padrão estático de `tokens.test.ts`
**Requirement**: RST-04, RST-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `.app-main` declara `background: var(--bg-page)` em `App.css` e o teste confere
- [x] Teste confere `background: var(--bg)` (ou `--white` em Frota) nas superfícies de Visão Geral, Equipe, Alertas e Frota
- [x] Teste confere `var(--blue)` nos botões primários de Visão Geral, Frota, Equipe e `NewMachinePanel`
- [x] Gate: `cd Frontend && npx vitest run src/test/styles`
- [x] Test count: ≥ 10 testes novos passam

**Tests**: unit
**Gate**: quick

---

#### T12: Cabeçalho do card pelo status

**What**: `FleetCard` fora de Acidentes preenche o cabeçalho com a cor do status da máquina (Disponível verde, Em uso azul, Manutenção amarelo com texto escuro, Offline cinza).
**Where**: `Frontend/src/components/fleet/FleetCard.tsx`
**Depends on**: T11
**Reuses**: `.topRow.danger/.warning/.caution` de `FleetCard.module.css`
**Requirement**: RST-12

**Tools**:

- MCP: `Claude_Browser`
- Skill: NONE

**Done when**:

- [x] `FleetCard.test.tsx` confere a classe do cabeçalho para cada status e a mesma classe com `kind` diferente (AC RST-12.3)
- [x] Em Acidentes o cabeçalho segue a urgência (AC RST-12.4)
- [x] `fleet.test.ts` confere fundo e texto de cada classe de status (AC RST-12.1, RST-12.2)
- [x] Gate: `cd Frontend && npx vitest run src/test/components/fleet src/test/pages/FrotaPage.test.tsx src/test/pages/AlertasPage.test.tsx src/test/styles/fleet.test.ts`
- [x] Test count: ≥ 8 testes novos passam

**Tests**: unit
**Gate**: full

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ------→ T2
Phase 2:  T3, T4
Phase 3:  T5, T6, T7 (depende de T6), T8
Phase 4:  T9 ------→ T10
Phase 5:  T11 ------→ T12
```

Execução sequencial, 12 tasks. Passa de ~8, então o fluxo oferece sub-agentes em lotes (~7 tasks por lote, fases inteiras); o padrão é executar inline.

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | cross-phase (T1 em Phase 1) | ✅ Match |
| T4 | T1 | cross-phase | ✅ Match |
| T5 | T1 | cross-phase | ✅ Match |
| T6 | T1 | cross-phase | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T1 | cross-phase | ✅ Match |
| T9 | T3, T4, T5, T6, T7, T8 | cross-phase | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | cross-phase | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Tokens / CSS global | unit (estático) | unit | ✅ OK |
| T2 | Tokens / CSS global (`index.html`) | unit (estático) | unit | ✅ OK |
| T3 | CSS Module + Componente (layout) | unit | unit | ✅ OK |
| T4 | Componente (common) | unit | unit | ✅ OK |
| T5 | Componente (machines) | unit | unit | ✅ OK |
| T6 | Componente (fleet) | unit | unit | ✅ OK |
| T7 | Componente (fleet) | unit | unit | ✅ OK |
| T8 | Componente (team) | unit | unit | ✅ OK |
| T9 | Página + CSS Module | unit (suíte existente) | unit | ✅ OK |
| T10 | CSS Module sem lógica (guarda) | unit (estático) | unit | ✅ OK |
| T11 | Tokens / CSS global (estático) | unit (estático) | unit | ✅ OK |
| T12 | Componente (fleet) | unit | unit | ✅ OK |
