# Dropdown de Alertas Recentes Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Commits:** sem commit (decisão do dono). Cada task termina com o gate verde e o `tasks.md` atualizado; o nível 1 integra os diffs na branch `fix/crud-funcionario-integridade`.

**Pré-requisito externo:** a task de `figma-modal-alerta` que cria `Frontend/src/context/AlertsContext.tsx` (com `useAlerts` e o objeto `AlertsContext` exportados) e monta o provider no `AppShell` precisa estar pronta antes da Phase 2.

---

**Design**: `.specs/features/figma-alertas-dropdown/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `Frontend/package.json` (`vitest run`, `eslint .`, `tsc -b`), `Frontend/src/test/setup.ts` (pt-BR, `localStorage` limpo), `.specs/features/telas-figma-faltantes/contexto.md` (regra 4). Sem limite de cobertura configurado: strong defaults.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Componente React | unit (vitest + testing-library) | 1 teste por ALR do componente + edge cases da spec; contexto via `AlertsContext.Provider` com valor fixo e `vi.fn()` | `Frontend/src/test/components/layout/*.test.tsx` | `yarn vitest run src/test/components/layout` |
| Locales | unit (paridade existente) | `i18n.test.ts` passa com o bloco novo nos 7 locales; textos pt-BR conferidos pelos testes do componente | `Frontend/src/test/config/i18n.test.ts` | `yarn vitest run src/test/config` |
| CSS module | none | build gate + conferência visual no navegador | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Rodar em `Frontend/` com `export PATH=$HOME/.nvm/versions/node/v25.9.0/bin:$PATH`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após tasks com testes unitários de componente ou locale | `yarn vitest run src/test/components/layout src/test/config` |
| Full | Não há integração/e2e neste plano | `yarn test` |
| Build | Fim de cada phase | `yarn tsc -b && yarn lint && yarn test` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Textos

```
T1
```

### Phase 2: Componente

Requer o `AlertsContext` de `figma-modal-alerta`.

```
T2 → T3
```

### Phase 3: Integração no Header

```
T4
```

---

## Task Breakdown

### T1: Adicionar o bloco `alertsDropdown` nos 7 locales

**What**: Acrescentar o bloco `alertsDropdown` (10 chaves do design) ao fim de cada `translation.json`, traduzido para `de`, `en-US`, `es`, `fr`, `ja`, `pt-BR`, `ru`, sem editar chaves existentes.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Reuses**: bloco `alerts` existente como referência de tom; `Frontend/src/test/config/i18n.test.ts` (paridade de chaves de topo)
**Requirement**: ALR-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Os 7 arquivos têm `alertsDropdown` com as mesmas 10 chaves, todas não vazias.
- [ ] `alertsDropdown.bell` contém "Notificações" em pt-BR (o teste atual do Header procura `/notificações/i`).
- [ ] Gate check passes: `yarn vitest run src/test/config`
- [ ] Test count: contagem de `i18n.test.ts` igual à anterior, todos passando (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T2: Criar `AlertsDropdown` com popover, estados e navegação

**What**: Componente com sino, abrir/fechar (clique no sino, X, clique fora, Esc), `markSeen()` ao abrir, lista de até 5 linhas, estados carregando/vazio/erro com "Tentar de novo" → `reload()`, e navegação para `/alertas` por título, linha e "Mais"; o CSS module ao lado (mesmo nome, `.module.css`) recebe as medidas do design.
**Where**: `Frontend/src/components/layout/AlertsDropdown.tsx` (novo)
**Depends on**: None
**Reuses**: padrão do popover de idioma em `Frontend/src/components/layout/Header.tsx:35-110`; tokens de `Frontend/src/index.css`
**Requirement**: ALR-01, ALR-02, ALR-03, ALR-05, ALR-06, ALR-07, ALR-09, ALR-10

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] `Frontend/src/test/components/layout/AlertsDropdown.test.tsx` criado, renderizando dentro de `MemoryRouter` + `AlertsContext.Provider`, com um teste por critério: ALR-01 (2 incidentes → 2 linhas com o nome; 7 itens → 5 linhas), ALR-02 (título, linha e "Mais" levam a `/alertas` e fecham), ALR-03 (X, `mousedown` fora e Esc fecham), ALR-05 (`markSeen` chamado 1 vez por abertura e não chamado de novo quando `recent` muda com o popover aberto), ALR-06 ("Nenhum alerta recente"), ALR-07 (mensagem + "Tentar de novo" chama `reload`; erro esconde a lista mesmo com itens), ALR-09 ("Carregando alertas…" só com lista vazia), ALR-10 ("Máquina não informada").
- [ ] Gate check passes: `yarn vitest run src/test/components/layout`
- [ ] Test count: ≥ 11 testes novos passando (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T3: Ponto de não vistos e acessibilidade do sino

**What**: Mostrar o ponto vermelho enquanto `hasUnseen`, trocar o `aria-label` entre `alertsDropdown.bell` e `alertsDropdown.bellUnseen`, `aria-expanded`/`aria-haspopup`, estado ativo do botão e foco devolvido ao sino ao fechar por X ou Esc.
**Where**: `Frontend/src/components/layout/AlertsDropdown.tsx` (modify)
**Depends on**: T2
**Reuses**: `aria-expanded` do botão de idioma (`Header.tsx:65`)
**Requirement**: ALR-04, ALR-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Testes em `AlertsDropdown.test.tsx`: ALR-04 (ponto presente com `hasUnseen: true`, ausente com `false`), ALR-08 (`aria-label` "Notificações" / "Notificações (há alertas novos)", `aria-expanded` false→true→false, `document.activeElement` é o sino após X e após Esc).
- [ ] Gate check passes: `yarn vitest run src/test/components/layout`
- [ ] Test count: testes de T2 + ≥ 4 novos passando (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T4: Trocar o sino do Header pelo `AlertsDropdown`

**What**: Substituir o `<button aria-label="Notificações">` de `Header.tsx:112-114` por `<AlertsDropdown />` e remover o import de `Bell` se ficar sem uso; envolver o `renderHeaderAt` do teste com `AlertsContext.Provider` e acrescentar um teste de que o sino do Header abre "Alertas Recentes".
**Where**: `Frontend/src/components/layout/Header.tsx` (modify; o teste do Header já existente é atualizado junto)
**Depends on**: None
**Reuses**: `AlertsDropdown` (T2/T3)
**Requirement**: ALR-01, ALR-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Diff em `Header.tsx` limitado ao import e às linhas do sino (avatar intocado, ver `figma-perfil-admin`).
- [ ] Todos os testes anteriores de `Header.test.tsx` passam, mais o novo.
- [ ] Gate check passes: `yarn tsc -b && yarn lint && yarn test`
- [ ] Conferência no navegador do Orca a 1440 px contra `figma-telas/admin/02-visao-geral-maquinas/06-gestao-da-frota-ativo-1.png` (título azul com seta, X, linhas vermelhas com seta e separador, "Mais" azul centralizado, sino cinza quando aberto).
- [ ] Test count: total do Frontend = anterior + novos de T2/T3/T4 (no silent deletions)

**Tests**: unit
**Gate**: build

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1
Phase 2:  T2 ------→ T3
Phase 3:  T4
```

Execution is strictly sequential. 4 tasks: cabe num lote só, execução inline, sem sub-agentes.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: bloco `alertsDropdown` | 1 bloco de dados repetido em 7 locales (arquivo disputado, só acréscimo) | ✅ Granular (mesma mudança, 7 traduções) |
| T2: `AlertsDropdown` popover | 1 componente + seu CSS module | ✅ Granular |
| T3: ponto + a11y | 1 componente (modify) | ✅ Granular |
| T4: Header | 1 linha de JSX + 1 import (+ teste) | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da Phase 1 | ✅ Match |
| T2 | None (Phase 1 e pré-requisito externo antes) | início da Phase 2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | None (Phases 1-2 antes) | início da Phase 3 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: locales | Locales | unit | unit | ✅ OK |
| T2: AlertsDropdown | Componente React + CSS module | unit | unit | ✅ OK |
| T3: ponto + a11y | Componente React | unit | unit | ✅ OK |
| T4: Header | Componente React | unit | unit | ✅ OK |

---

## Requirement → Task

| Requirement | Task |
| ----------- | ---- |
| ALR-01 | T2, T4 |
| ALR-02 | T2 |
| ALR-03 | T2 |
| ALR-04 | T3 |
| ALR-05 | T2 |
| ALR-06 | T2 |
| ALR-07 | T2 |
| ALR-08 | T3, T4 |
| ALR-09 | T2 |
| ALR-10 | T2 |
| ALR-11 | T1 |
