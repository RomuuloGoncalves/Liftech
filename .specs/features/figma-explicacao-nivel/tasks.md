# Modal de explicação de nível crítico Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Commits:** sem commit (decisão do dono). Cada task termina com o gate verde e `tasks.md` atualizado; o nível 1 integra o diff na branch `fix/crud-funcionario-integridade`.

---

**Design**: `.specs/features/figma-explicacao-nivel/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `Frontend/package.json` (`vitest run`, `eslint .`, `tsc -b`), `.specs/features/telas-figma-faltantes/contexto.md` (regras dos orquestradores), amostras `src/test/pages/AlertasPage.test.tsx`, `src/test/components/common/Modal.test.tsx`, `src/test/config/i18n.test.ts`, `src/test/styles/common.test.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Locales (`translation.json`) | unit | Toda chave `levelInfo.*` da spec presente e não vazia nos 7 locales; descrições com `<b>…</b>` | `Frontend/src/test/config/*.test.ts` | `yarn test` |
| Componente (`components/alerts`) | unit (testing-library) | 1:1 com EXP-01..06 e EXP-11 no que o componente renderiza; CSS dos tons lido como texto (padrão de `test/styles/common.test.ts`) | `Frontend/src/test/components/alerts/*.test.tsx` | `yarn test` |
| Página (`pages/AlertasPage`) | unit (testing-library) | Abrir, fechar, foco, nome acessível, lista vazia, posição e CSS do botão (EXP-01, 06..10) | `Frontend/src/test/pages/AlertasPage.test.tsx` | `yarn test` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Antes de qualquer comando: `export PATH=$HOME/.nvm/versions/node/v25.9.0/bin:$PATH` e `cd Frontend`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após cada task | `yarn test` |
| Full | Igual ao Quick (só há testes unitários no Frontend) | `yarn test` |
| Build | Após a última task | `yarn test && yarn lint && yarn build` |

---

## Execution Plan

Uma fase; cada task depende da anterior.

### Phase 1: Modal e botão

```
T1 → T2 → T3
```

---

## Task Breakdown

### T1: Textos `levelInfo.*` nos 7 locales

**What**: Acrescentar o bloco top-level `levelInfo` (estrutura e valores pt-BR em `design.md` › Data Models) ao fim de cada `Frontend/src/locales/<lang>/translation.json` (`de`, `en-US`, `es`, `fr`, `ja`, `pt-BR`, `ru`), traduzido, mantendo `<b>…</b>` em volta da causa; e um teste que lê os 7 arquivos e confere cada chave.
**Where**: `Frontend/src/locales/*/translation.json` (mesma mudança aditiva nos 7; teste novo `levelInfoLocales` em `test/config/`)
**Depends on**: None
**Reuses**: lista `ALL_LOCALES` e imports de `src/test/config/i18n.test.ts` (copiar o padrão; não editar esse arquivo, que é compartilhado)
**Requirement**: EXP-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Os 7 locales têm `levelInfo.title`, `levelInfo.open`, `levelInfo.level.{critica,alta,media}` e `levelInfo.description.{tombamento,colisao,frenagem}`, strings não vazias.
- [ ] Cada `description.*` contém exatamente um par `<b>…</b>`.
- [ ] pt-BR bate letra a letra com `design.md` (título "Informações sobre nível crítico", níveis "Crítico", "Alta", "Média").
- [ ] Nenhuma chave existente alterada (`git diff` só mostra linhas novas e a vírgula do bloco anterior).
- [ ] Teste falha se uma chave for removida de qualquer locale.
- [ ] Gate check passes: `yarn test`
- [ ] Test count: suíte anterior + 3 testes novos (presença por locale, `<b>` nas descrições, valores pt-BR) passam, sem remoção.

**Tests**: unit
**Gate**: quick

---

### T2: Componente `LevelInfoModal`

**What**: Criar `LevelInfoModal` e seu `LevelInfoModal.module.css` conforme `design.md` › LevelInfoModal (ordem `LEVEL_ORDER`, causa lida de `ACCIDENT_URGENCY`, `Trans` com `<strong>`, tons por `--tone`), com teste de componente.
**Where**: `Frontend/src/components/alerts/LevelInfoModal.tsx` (com CSS module ao lado; teste em `test/components/alerts/`)
**Depends on**: T1
**Reuses**: `components/common/Modal.tsx`, `data/machines.ts` (`ACCIDENT_URGENCY`), padrão de `components/team/SectorInfoModal.tsx`, `Trans` como em `pages/LoginPage.tsx:84`
**Requirement**: EXP-01, EXP-02, EXP-03, EXP-04, EXP-05, EXP-06

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (fidelidade ao PNG `figma-telas/admin/05-historico-de-alertas/03-modal-explicacao-categoria.png`)

**Done when**:

- [ ] `getByRole('dialog', { name: 'Informações sobre nível crítico' })` existe (EXP-01).
- [ ] Os cabeçalhos dos cartões, em ordem, são `['Crítico', 'Alta', 'Média']` (EXP-02).
- [ ] Cada cartão tem `<strong>` com "tombamento", "colisão" e "frenagem brusca", respectivamente (EXP-03).
- [ ] Com `vi.mock('../../../data/machines')` trocando `ACCIDENT_URGENCY` para `{ frenagem: 'media', colisao: 'media', tombamento: 'critica' }`, o cartão "Alta" some e "Média" mostra a primeira causa achada (EXP-05, prova de que o texto vem do mapa).
- [ ] Teste de CSS (leitura do `.module.css` como texto): `.critical`, `.high`, `.medium` definem `--tone` com `var(--urgency-critical)`, `var(--urgency-high)`, `var(--urgency-medium)`; `.card` usa `var(--tone)` na borda esquerda e o título usa `var(--tone)` na cor (EXP-04).
- [ ] Clicar em "Fechar", clicar no fundo e `Escape` chamam `onClose` uma vez cada (EXP-06).
- [ ] Gate check passes: `yarn test`
- [ ] Test count: suíte de T1 + 6 testes novos passam, sem remoção.

**Tests**: unit
**Gate**: quick

---

### T3: Botão "?" em `AlertasPage`

**What**: Adicionar o botão "?" como primeiro filho de `.filters`, o estado `showLevelInfo`, a devolução de foco ao fechar e a classe `.helpButton` em `AlertasPage.module.css`, conforme `design.md` › AlertasPage; estender o teste da página.
**Where**: `Frontend/src/pages/AlertasPage.tsx` (com o CSS module dela; teste em `test/pages/`)
**Depends on**: T2
**Reuses**: mocks de `incidentService`/`machineService` já em `AlertasPage.test.tsx`; `CircleHelp` de `lucide-react`
**Requirement**: EXP-01, EXP-06, EXP-07, EXP-08, EXP-09, EXP-10

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] `getByRole('button', { name: 'Sobre os níveis de urgência' })` existe após o carregamento (EXP-08).
- [ ] Clicar nele abre o diálogo "Informações sobre nível crítico" (EXP-01).
- [ ] `Escape` fecha o diálogo e `document.activeElement` é o botão "?" (EXP-06, EXP-07); o mesmo ao clicar em "Fechar".
- [ ] O botão é o primeiro filho do grupo que contém a busca (EXP-09) e o CSS `.helpButton` usa `background: var(--blue)` e `color: var(--white)` (EXP-09, teste de CSS lido como texto).
- [ ] Com `incidentService.listar` resolvendo `[]`, o texto "Nenhum alerta encontrado" aparece e o botão abre o modal (EXP-10).
- [ ] Testes existentes de `AlertasPage.test.tsx` continuam passando sem mudança de asserção.
- [ ] Gate check passes: `yarn test && yarn lint && yarn build`
- [ ] Test count: suíte de T2 + 5 testes novos passam, sem remoção.

**Tests**: unit
**Gate**: build

---

## Phase Execution Map

```
Phase 1:  T1 ------→ T2 ------→ T3
```

3 tasks: cabe num lote; execução inline, sem sub-agentes. Verifier roda ao fim (regra da skill).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Textos `levelInfo.*` | 1 bloco de dados, a mesma mudança aditiva em 7 arquivos irmãos + 1 teste | ✅ Granular (separar por locale geraria 7 tasks idênticas) |
| T2: `LevelInfoModal` | 1 componente + seu CSS module | ✅ Granular |
| T3: Botão em `AlertasPage` | 1 alteração de página + seu CSS module | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Locales | unit | unit | ✅ OK |
| T2 | Componente | unit | unit | ✅ OK |
| T3 | Página | unit | unit | ✅ OK |

## Requirement Coverage

| Requirement | Task(s) |
| ----------- | ------- |
| EXP-01 | T2, T3 |
| EXP-02 | T2 |
| EXP-03 | T2 |
| EXP-04 | T2 |
| EXP-05 | T2 |
| EXP-06 | T2, T3 |
| EXP-07 | T3 |
| EXP-08 | T3 |
| EXP-09 | T3 |
| EXP-10 | T3 |
| EXP-11 | T1 |
