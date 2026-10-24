# Modal "Alerta!" e contexto de alertas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Sem commit (decisão do dono):** onde a skill pede um commit atômico por task, marque a task como concluída neste arquivo e siga para a próxima, sem `git commit` e sem `git push`. O nível 1 integra os diffs na branch `fix/crud-funcionario-integridade`. Sem acesso ao banco: o backend só roda `yarn test` (unitário, models mockados, AD-010).

---

**Design**: `.specs/features/figma-modal-alerta/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `.specs/STATE.md` AD-010 (backend `yarn test` só unitário, models mockados), `Frontend/vite.config.ts` (vitest, `src/test/setup.ts`), `Frontend/package.json`, `Backend/package.json`; amostras `Backend/tests/unit/incidentService.test.ts`, `Frontend/src/test/components/layout/Sidebar.test.tsx`, `Frontend/src/test/services/incidentService.test.ts`, `Frontend/src/test/config/i18n.test.ts`, `Frontend/src/test/pages/FrotaPage.test.tsx` (fake timers).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend service | unit (models mockados) | Todos os ramos; 1:1 com MAL-26..29 | `Backend/tests/unit/*.test.ts` | `cd Backend && yarn test` |
| Front service | unit (axios mockado) | Parâmetros enviados | `Frontend/src/test/services/*.test.ts` | `cd Frontend && yarn test` |
| Front context | unit (RTL + fake timers) | 1:1 com os ACs do contexto e do polling; todos os edge cases do spec | `Frontend/src/test/context/*.test.tsx` | `cd Frontend && yarn test` |
| Front component | unit (RTL) | Render, textos, a11y, teclado e clique de fundo | `Frontend/src/test/components/**/*.test.tsx` | `cd Frontend && yarn test` |
| Locales | unit (i18n config) | Bloco presente nos 7 locales | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && yarn test` |
| App shell | unit (RTL) | Provider só no shell | `Frontend/src/test/App.test.tsx` | `cd Frontend && yarn test` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Node 25: `export PATH=$HOME/.nvm/versions/node/v25.9.0/bin:$PATH`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Task de backend | `cd Backend && yarn test && yarn build` |
| Quick | Task de frontend | `cd Frontend && yarn test` |
| Full | Fim de cada fase de frontend | `cd Frontend && yarn test && yarn lint && npx tsc -b` |
| Build | Fim da feature | `cd Backend && yarn test && yarn build` + `cd Frontend && yarn test && yarn lint && yarn build` (conferir o gzip do chunk de entrada ≤ 100 kB e um chunk separado para `AlertModal`) |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend

```
T1
```

### Phase 2: Base do frontend

```
T2
T3 → T4
```

### Phase 3: Contexto de alertas

```
T5 → T6
```

### Phase 4: Integração

```
T7 → T8
```

---

## Task Breakdown

### T1: Filtro `filialId` em `listar` de incidentes

**What**: `listar(escopo, filtro)` aceita `filtro.filialId`: ausente ou `''` mantém todas as filiais do escopo; ObjectId válido restringe à interseção com o escopo (fora dele, `$in: []`); outro valor lança `ErroHttp(400)` antes do `find`.
**Where**: `Backend/src/feature/incident/incidentService.ts`
**Depends on**: None
**Reuses**: `listarMaquinas` (`Backend/src/feature/machine/machineService.ts:78-81`), `lerMachineId` (`Backend/src/feature/session/sessionService.ts:25-31`)
**Requirement**: MAL-26, MAL-27, MAL-28, MAL-29

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em `Backend/tests/unit/incidentService.test.ts` (bloco `listar`): filial do escopo → `find` com `filialId: { $in: [FILIAL] }`; filial fora do escopo → `find` com `$in: []` e resultado `[]`; `filialId: 'abc'` e `filialId: 123` → rejeita com status 400 e `Incident.find` não é chamado; sem `filialId` → teste atual continua passando.
- [ ] Gate check passes: `cd Backend && yarn test && yarn build`
- [ ] Test count: suíte anterior + 4 novos, sem remoção

**Tests**: unit
**Gate**: quick

---

### T2: `filialId` em `FiltroIncidentes`

**What**: `FiltroIncidentes` ganha `filialId?: string`, repassado como query por `incidentService.listar`.
**Where**: `Frontend/src/services/incidentService.ts`
**Depends on**: None
**Reuses**: `params` do axios já usado em `listar`
**Requirement**: MAL-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em `Frontend/src/test/services/incidentService.test.ts`: `listar({ filialId: 'f1' })` chama `api.get('/incidents', { params: { filialId: 'f1' } })`.
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: suíte anterior + 1, sem remoção

**Tests**: unit
**Gate**: quick

---

### T3: Bloco `alertModal` nos 7 locales

**What**: Acrescentar `alertModal.title`, `alertModal.message` (com `<b>` em setor e funcionário e `{{setor}}`, `{{funcionario}}`, `{{maquina}}`), `alertModal.notInformed` e `alertModal.ok` em `de`, `en-US`, `es`, `fr`, `ja`, `pt-BR`, `ru`, sem editar chaves existentes; incluir `'alertModal'` em `REQUIRED_MODULES` do teste de i18n.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Reuses**: texto pt-BR do `design.md` (Data Models)
**Requirement**: MAL-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `Frontend/src/test/config/i18n.test.ts` exige `alertModal` nos 7 locales e passa.
- [ ] As 4 chaves existem nos 7 arquivos e todo `message` tem 2 pares `<b>…</b>` e as 3 variáveis.
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: suíte anterior, sem remoção

**Tests**: unit
**Gate**: quick

---

### T4: Componente `AlertModal`

**What**: Modal do PNG para um `Incidente` (`incident`, `onClose`): círculo vermelho com `AlertTriangle`, título, texto via `Trans` com "não informado" nos trechos nulos ou vazios, botão "Ok"; `role="alertdialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`; foco no "Ok" a cada `incident`; Esc fecha; clique no fundo não fecha; CSS do `design.md` com `composes` do backdrop do `Modal` e do `.confirm` de `DialogButtons`.
**Where**: `Frontend/src/components/alerts/AlertModal.tsx`
**Depends on**: T3
**Reuses**: `Modal.module.css` (`.backdrop`), `DialogButtons.module.css` (`.confirm`), `Trans` como em `LoginPage.tsx`, Esc como em `Modal.tsx:17-24`
**Requirement**: MAL-01, MAL-05, MAL-11, MAL-12, MAL-13, MAL-14, MAL-16

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (conferir com o PNG)

**Done when**:

- [ ] Em `Frontend/src/test/components/alerts/AlertModal.test.tsx`: texto completo "Acidente no setor Expedição - Bloco B, Alexandre Mattos funcionário responsável pela máquina EMP-084(ID)." com setor e funcionário dentro de `<b>` e a máquina fora; `maquina: null` → "não informado" no setor e na máquina; `operador: null` → "não informado" no funcionário; `setor: ''` → "não informado"; `getByRole('alertdialog')` com nome "Alerta!" e descrição igual ao texto; "Ok" tem o foco após render e após `rerender` com outro incidente; clique em "Ok" e Esc chamam `onClose` uma vez; clique no backdrop não chama `onClose`.
- [ ] `AlertModal.module.css` usa `max-width: 470px` e `overflow-wrap: anywhere` no texto.
- [ ] Gate check passes: `cd Frontend && yarn test && yarn lint && npx tsc -b`
- [ ] Test count: suíte anterior + 9, sem remoção

**Tests**: unit
**Gate**: full

---

### T5: `AlertsContext`: polling, `recent`, `loading`, `error`, `reload`, vistos

**What**: `AlertsProvider` + `useAlerts` com o contrato fixo `AlertsContextValue`: polling de `incidentService.listar({ filialId })` na montagem, a cada `POLL_INTERVAL_MS` (15 000) com a aba visível e ao voltar a ficar visível; `filialId` de `useActiveBranch` (`'todas'` → `undefined`); sem `user` não consulta; `recent` = 5 primeiros; `loading` até a primeira resposta da filial; `error` até a próxima resposta boa; `reload()` consulta na hora; `hasUnseen`/`markSeen` com `liftech.alerts.seen.<userId>` e try/catch; respostas `stale` descartadas. Nesta task `simulate` é no-op e a fila ainda não existe.
**Where**: `Frontend/src/context/AlertsContext.tsx`
**Depends on**: None
**Reuses**: `useActiveBranch`, padrão `stale` de `VisaoGeralPage.tsx:58-74`, storage seguro de `ActiveBranchContext.tsx:38-52`
**Requirement**: MAL-06, MAL-08, MAL-09, MAL-10, MAL-19, MAL-20, MAL-21, MAL-22, MAL-23, MAL-24, MAL-25

**Tools**:

- MCP: NONE
- Skill: `vercel-react-best-practices`

**Done when**:

- [ ] Em `Frontend/src/test/context/AlertsContext.test.tsx` (fake timers, `incidentService.listar` e `authService.getSession` mockados, consumidor de teste que mostra o valor): 1 chamada na montagem e +1 após 15 000 ms, nenhuma a 14 999 ms; com `visibilityState: 'hidden'` o intervalo não chama, e o evento `visibilitychange` para `visible` chama na hora; filial ativa `f1` → `params.filialId === 'f1'`, `'todas'` → sem `filialId`; troca de filial → nova chamada com o novo id; sem sessão → 0 chamadas; 7 incidentes → `recent` com os 5 primeiros na ordem recebida; `loading` `true` antes da resposta e `false` depois; falha → `error: true` com `recent` anterior mantido, e sucesso seguinte → `error: false`; `reload()` chama na hora; `hasUnseen` `true` com ids não vistos e `false` após `markSeen()`, com `localStorage['liftech.alerts.seen.<userId>']` igual aos 5 ids; com `localStorage.getItem`/`setItem` lançando erro, o provider monta e `markSeen()` deixa `hasUnseen: false`; resposta resolvida após desmontar não gera warning nem atualização.
- [ ] Comentário `ponytail:` no polling sobre os 500 incidentes por consulta e o upgrade (`limit` na rota).
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: suíte anterior + 13, sem remoção

**Tests**: unit
**Gate**: quick

---

### T6: `AlertsContext`: linha de base, fila e `simulate`

**What**: No mesmo provider: `known` (ref) vira a linha de base na primeira resposta boa da filial (sem modal) e é zerado ao trocar de filial; ids fora de `known` entram na fila ordenados por `dataIncidente` crescente; `queue[0]` renderiza `AlertModal` via `React.lazy` + `Suspense`; fechar tira o primeiro da fila; `simulate()` enfileira `SAMPLE_INCIDENT` sem chamar a API; falha de consulta não mexe em fila nem em `known`.
**Where**: `Frontend/src/context/AlertsContext.tsx`
**Depends on**: T5
**Reuses**: `AlertModal` (T4)
**Requirement**: MAL-01, MAL-02, MAL-03, MAL-04, MAL-06, MAL-10, MAL-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em `Frontend/src/test/context/AlertsContext.test.tsx`: primeira resposta com 2 incidentes → nenhum `alertdialog`; segunda resposta com 1 id novo → modal com o setor, o operador e a identificação dele; "Ok" fecha e a terceira resposta com a mesma lista não reabre; Esc fecha igual; dois ids novos na mesma resposta → abre o de `dataIncidente` mais antigo e, após "Ok", o mais novo; id novo chegando com modal aberto → só aparece após o "Ok"; primeira resposta falha e a segunda traz 2 incidentes → nenhum modal; troca de filial → a primeira resposta da nova filial não abre modal; `simulate()` → modal com "Expedição - Bloco B", "Alexandre Mattos" e "EMP-084(ID)" e `listar` sem chamada a mais; `simulate()` duas vezes → dois modais em sequência; falha de consulta com modal aberto → o modal segue aberto.
- [ ] Gate check passes: `cd Frontend && yarn test && yarn lint && npx tsc -b`
- [ ] Test count: suíte anterior + 10, sem remoção

**Tests**: unit
**Gate**: full

---

### T7: Montar `AlertsProvider` no shell do admin

**What**: Em `AppShell`, envolver só o ramo do shell (`<div className="app-shell">…`) com `<AlertsProvider>`; o ramo standalone (login, solicitações, funcionário) fica sem provider.
**Where**: `Frontend/src/App.tsx`
**Depends on**: None
**Reuses**: `AUTH_ROUTES` e `isStandaloneRoute` existentes
**Requirement**: MAL-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em `Frontend/src/test/App.test.tsx`, com sessão de admin e `incidentService.listar` mockado: em `/` há chamada; em `/login`, `/solicitacoes` e `/funcionario` não há nenhuma.
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: suíte anterior + 2, sem remoção

**Tests**: unit
**Gate**: quick

---

### T8: Botão DEV "Simular alerta" na Sidebar

**What**: Dentro do bloco `DEV: Telas de auth`, depois do `.map` de `TEMP_AUTH_LINKS`, um `<button type="button">` com `styles.navLink`, `fontSize: 12`, ícone `AlertTriangle` 16 e rótulo "Simular alerta", que chama `useAlerts().simulate()` (e fecha o drawer no mobile, como os links).
**Where**: `Frontend/src/components/layout/Sidebar.tsx`
**Depends on**: T7
**Reuses**: estilo dos links de `TEMP_AUTH_LINKS`
**Requirement**: MAL-17, MAL-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em `Frontend/src/test/components/layout/Sidebar.test.tsx`: com `AlertsProvider` e `incidentService.listar` mockado, clicar em "Simular alerta" mostra o `alertdialog` com "Alexandre Mattos" e não chama `listar` a mais; com a sidebar colapsada o botão não aparece.
- [ ] Gate check passes (Build, fim da feature): `cd Backend && yarn test && yarn build` + `cd Frontend && yarn test && yarn lint && yarn build`, com o chunk de entrada ≤ 100 kB gzip e `AlertModal` em chunk próprio.
- [ ] No navegador do Orca (1440 px), "Simular alerta" bate com `figma-telas/admin/02-visao-geral-maquinas/12-modal-alert.png`.
- [ ] Test count: suíte anterior + 2, sem remoção

**Tests**: unit
**Gate**: build

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1
Phase 2:  T2    T3 ------→ T4
Phase 3:  T5 ------→ T6
Phase 4:  T7 ------→ T8
```

Execution is strictly sequential within the feature (8 tasks, um lote só): T1, T2, T3, T4, T5, T6, T7, T8.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: filtro `filialId` | 1 função | ✅ Granular |
| T2: tipo `FiltroIncidentes` | 1 tipo | ✅ Granular |
| T3: bloco `alertModal` | 1 bloco repetido nos 7 locales | ⚠️ 7 arquivos, mesma mudança; separar seria 7 tasks idênticas |
| T4: `AlertModal` | 1 componente (+ seu CSS) | ✅ Granular |
| T5: polling e `recent` | 1 provider, metade do estado | ✅ Granular |
| T6: fila e `simulate` | mesmo provider, outra metade | ✅ Granular |
| T7: provider no `App.tsx` | 1 trecho | ✅ Granular |
| T8: botão DEV | 1 botão | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | nenhuma seta | ✅ Match |
| T2 | None | nenhuma seta | ✅ Match |
| T3 | None | nenhuma seta | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | nenhuma seta na fase | ✅ Match (usa T2, fase anterior) |
| T6 | T5 | T5 → T6 | ✅ Match (usa T4, fase anterior) |
| T7 | None | nenhuma seta na fase | ✅ Match (usa T6, fase anterior) |
| T8 | T7 | T7 → T8 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Backend service | unit | unit | ✅ OK |
| T2 | Front service | unit | unit | ✅ OK |
| T3 | Locales | unit | unit | ✅ OK |
| T4 | Front component | unit | unit | ✅ OK |
| T5 | Front context | unit | unit | ✅ OK |
| T6 | Front context | unit | unit | ✅ OK |
| T7 | App shell | unit | unit | ✅ OK |
| T8 | Front component | unit | unit | ✅ OK |

## Requirement → Task

| Requirement | Tasks |
| ----------- | ----- |
| MAL-01 | T4, T6 |
| MAL-02 | T6 |
| MAL-03 | T6 |
| MAL-04 | T6 |
| MAL-05 | T4 |
| MAL-06 | T5, T6 |
| MAL-07 | T7 |
| MAL-08 | T5 |
| MAL-09 | T5 |
| MAL-10 | T2, T5, T6 |
| MAL-11 | T4 |
| MAL-12 | T4 |
| MAL-13 | T4 |
| MAL-14 | T4 |
| MAL-15 | T3 |
| MAL-16 | T4 |
| MAL-17 | T6, T8 |
| MAL-18 | T8 |
| MAL-19 | T5 |
| MAL-20 | T5 |
| MAL-21 | T5 |
| MAL-22 | T5 |
| MAL-23 | T5 |
| MAL-24 | T5 |
| MAL-25 | T5 |
| MAL-26 | T1 |
| MAL-27 | T1 |
| MAL-28 | T1 |
| MAL-29 | T1 |
