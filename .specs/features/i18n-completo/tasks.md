# i18n completo Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

> Nota para o worker Antigravity: se não conseguir ativar a skill pelo nome, leia por inteiro `/home/romulo/Projetos/IA-skills/skills/universal/tlc-spec-driven/references/implement.md` e siga o ciclo por task dele (implementar, gate, marcar no tasks.md, um commit atômico). Isso conta como ativar a skill.

---

**Spec**: `.specs/features/i18n-completo/spec.md`
**Design**: inline (sem `design.md`): sem decisão de arquitetura nova; só dados de tradução, `t()` nos componentes e um teste de paridade.
**Status**: Approved

**Ambiente (obrigatório em todo comando do Frontend):**

```bash
export PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH   # Node 20.18 padrão quebra o jsdom
cd Frontend && yarn install --frozen-lockfile              # só se node_modules faltar
```

**Regras fixas do worker:** commit local apenas, `git push` proibido; mensagens de commit em português, no formato Conventional Commits, **sem** `Co-Authored-By` e sem citar IA; nunca acessar banco de dados; só editar os arquivos listados em `Where` de cada task (mais o `tasks.md` e o `spec.md` desta feature); nunca apagar ou afrouxar teste para passar.

**Baseline medido antes do início (Node 22.22.2):** `yarn test` = 125 arquivos e 1718 testes passando; `yarn lint` e `npx tsc -b` sem erro.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/i18n.md`, `docs/frontend.md`, `Frontend/vite.config.ts`, `Frontend/package.json` (sem `AGENTS.md`, sem limite de cobertura configurado) - strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Componente React / página (Sidebar, Header, VisaoGeralPage, MachineCard, NewMachinePanel) | unit (Testing Library) | 1:1 com os ACs da task: texto em pt-BR igual ao literal antigo e texto em en-US igual ao valor da chave | `Frontend/src/test/components/**/*.test.tsx`, `Frontend/src/test/pages/*.test.tsx` | `cd Frontend && yarn -s vitest run <arquivo>` |
| Rota / error boundary (`appRoutes.tsx`) | unit | Mensagem e botão em pt-BR e em en-US | `Frontend/src/test/routes/appRoutes.test.tsx` | `cd Frontend && yarn -s vitest run src/test/routes/appRoutes.test.tsx` |
| Locale JSON (`src/locales/*/translation.json`) | unit (paridade em `src/test/config/i18n.test.ts`) | Cada idioma tem toda chave base de pt-BR, mesmos `{{placeholders}}`, valores não vazios | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && yarn -s vitest run src/test/config/i18n.test.ts` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com um arquivo de teste | `cd Frontend && yarn -s vitest run <arquivo de teste da task>` |
| Full | Tasks que mexem em locale ou em componente usado por vários testes | `cd Frontend && yarn -s test` |
| Build | Última task de cada fase | `cd Frontend && yarn -s lint && npx tsc -b && yarn -s test` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order.

### Phase 1: Paridade e chaves base

```
T1 → T2 → T3
```

### Phase 2: Componentes usam t()

```
T3 → T4 → T5 → T6 → T7 → T8 → T9
```

### Phase 3: Idiomas restantes

```
T9 → T10 → T11 → T12 → T13 → T14
```

---

## Task Breakdown

### T1: Teste de paridade de locales com lista de pendentes

**What**: Em `i18n.test.ts`, criar os helpers `folhas(obj)` (mapa caminho→texto), `chaveBase(caminho)` (tira o sufixo de plural `_zero|_one|_two|_few|_many|_other`) e `placeholders(texto)` (conjunto de `{{x}}`), e um `describe('locale parity')` que, para cada idioma fora da constante `PENDING_LOCALES = ['en-US','es','fr','de','ja','ru']`, exige: toda chave base de pt-BR presente, mesmo conjunto de placeholders, valor com texto não vazio, e nenhuma chave extra que não seja variante de plural. A constante nasce com os 6 idiomas, então o teste só liga idioma a idioma nas tasks seguintes. O arquivo também ganha testes dos próprios helpers com fixtures pequenas (plural `_one`/`_other` contra só `_other`; placeholder diferente; chave extra).
**Where**: `Frontend/src/test/config/i18n.test.ts`
**Depends on**: None
**Reuses**: `ALL_LOCALES` e os imports de JSON já existentes no arquivo
**Requirement**: I18N-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `PENDING_LOCALES` existe com os 6 idiomas e há um `it.each` sobre `ALL_LOCALES` sem os pendentes (hoje só pt-BR, que se compara a si mesmo).
- [x] Testes dos helpers cobrem: plural com sufixos diferentes aceito (ja só com `_other`; ru com `_few` e `_many`), placeholder trocado falha, chave faltando cita idioma e chave, chave extra não plural falha.
- [x] A mensagem de falha cita o idioma e a chave (`Locale "es" is missing "employee.home.title"`).
- [x] Gate check passes: `cd Frontend && yarn -s vitest run src/test/config/i18n.test.ts`
- [x] Os testes antigos do arquivo seguem passando (nenhum removido).

**Tests**: unit
**Gate**: quick

**Commit**: `test(i18n): teste de paridade das chaves entre idiomas`

---

### T2: Chaves de acessibilidade e erro em pt-BR

**What**: Adicionar ao pt-BR as 11 chaves novas com exatamente estes textos: `common.openMenu` = "Abrir menu"; `common.closeMenu` = "Fechar menu"; `common.routeLoadError` = "Ocorreu um erro ao carregar a página."; `common.reload` = "Recarregar"; `navigation.mainLabel` = "Navegação principal"; `languages.selectLabel` = "Selecionar idioma"; `languages.closeLabel` = "Fechar seleção de idioma"; `machines.searchAriaLabel` = "Buscar máquina por identificação ou setor"; `machines.statusFilterAriaLabel` = "Filtrar máquinas por status"; `machines.moreActions` = "Mais ações para {{name}}"; `machines.phName` = "Ex: Empilhadeira Elétrica Titan-X". Não sobrescrever chave existente; se alguma já existir com outro texto, parar e avisar.
**Where**: `Frontend/src/locales/pt-BR/translation.json`
**Depends on**: T1
**Reuses**: Estrutura de módulos existente (`common`, `navigation`, `languages`, `machines`)
**Requirement**: I18N-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] As 11 chaves existem em pt-BR com o texto exato acima (um teste novo em `i18n.test.ts` lê cada chave e compara com o texto, lista `A11Y_KEYS`).
- [ ] Nenhuma chave existente foi alterada ou removida (`git diff` só tem linhas adicionadas no JSON).
- [ ] JSON válido e mesma indentação do arquivo.
- [ ] Gate check passes: `cd Frontend && yarn -s vitest run src/test/config/i18n.test.ts`

**Tests**: unit (teste da lista `A11Y_KEYS` em `Frontend/src/test/config/i18n.test.ts`)
**Gate**: quick

**Commit**: `feat(i18n): chaves de acessibilidade e erro de rota em pt-BR`

---

### T3: en-US completo e ligado na paridade

**What**: Adicionar ao en-US as 11 chaves novas em inglês ("Open menu", "Close menu", "An error occurred while loading the page.", "Reload", "Main navigation", "Select language", "Close language selection", "Search machine by ID or sector", "Filter machines by status", "More actions for {{name}}", "E.g.: Titan-X Electric Forklift") mais `machines.labelDeviceName` ("Device name") e `machines.newMachineSubtitle` ("Register a new forklift for your fleet."), e tirar `'en-US'` de `PENDING_LOCALES`.
**Where**: `Frontend/src/locales/en-US/translation.json`
**Depends on**: T2
**Reuses**: Termos já usados no módulo `machines` do próprio en-US
**Requirement**: I18N-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Paridade de en-US passa: nenhuma chave base de pt-BR faltando, mesmos placeholders (`{{name}}` em `moreActions`), valores não vazios.
- [ ] `PENDING_LOCALES` em `i18n.test.ts` não tem mais `'en-US'` (edição de uma linha, citada na mensagem do commit).
- [ ] Gate check passes: `cd Frontend && yarn -s vitest run src/test/config/i18n.test.ts`
- [ ] Gate de build da fase: `cd Frontend && yarn -s lint && npx tsc -b && yarn -s test` passa (≥ 1718 testes).

**Tests**: unit
**Gate**: build

**Commit**: `feat(i18n): en-US completo e conferido pelo teste de paridade`

---

### T4: Sidebar usa t() nos rótulos de menu

**What**: Em `Sidebar.tsx`, trocar os `aria-label` literais "Abrir menu", "Navegação principal" e "Fechar menu" por `t('common.openMenu')`, `t('navigation.mainLabel')` e `t('common.closeMenu')`. Não mexer no bloco DEV (`TEMP_AUTH_LINKS`, "Simular alerta").
**Where**: `Frontend/src/components/layout/Sidebar.tsx`
**Depends on**: T3
**Reuses**: `useTranslation` já importado em `Sidebar.tsx`
**Requirement**: I18N-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em pt-BR os 3 rótulos continuam com o texto de hoje (testes antigos de `Sidebar.test.tsx` e `App.test.tsx` passam sem edição).
- [ ] Teste novo em `Sidebar.test.tsx`: com `i18n.changeLanguage('en-US')`, `getByRole('navigation', { name: 'Main navigation' })` e os botões "Open menu" / "Close menu" existem; volta para pt-BR no `afterEach`.
- [ ] Gate check passes: `cd Frontend && yarn -s vitest run src/test/components/layout/Sidebar.test.tsx src/test/App.test.tsx`
- [ ] Test count: ≥ 1 teste novo, nenhum removido.

**Tests**: unit (`Frontend/src/test/components/layout/Sidebar.test.tsx`)
**Gate**: quick

**Commit**: `feat(i18n): rótulos de menu da Sidebar traduzidos`

---

### T5: Header usa t() nos rótulos de idioma

**What**: Em `Header.tsx`, trocar `aria-label="Selecionar idioma"` e `aria-label="Fechar seleção de idioma"` por `t('languages.selectLabel')` e `t('languages.closeLabel')`.
**Where**: `Frontend/src/components/layout/Header.tsx`
**Depends on**: T4
**Reuses**: `useTranslation` já importado em `Header.tsx`
**Requirement**: I18N-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em pt-BR os 2 rótulos continuam iguais (testes antigos de `Header.test.tsx` passam sem edição).
- [ ] Teste novo em `Header.test.tsx`: em en-US o botão "Select language" existe e, com o popover aberto, "Close language selection" existe.
- [ ] Gate check passes: `cd Frontend && yarn -s vitest run src/test/components/layout/Header.test.tsx`
- [ ] Test count: ≥ 1 teste novo, nenhum removido.

**Tests**: unit (`Frontend/src/test/components/layout/Header.test.tsx`)
**Gate**: quick

**Commit**: `feat(i18n): rótulos do seletor de idioma traduzidos`

---

### T6: VisaoGeralPage usa t() nos rótulos de busca e filtro

**What**: Em `VisaoGeralPage.tsx`, trocar `aria-label="Buscar máquina por identificação ou setor"` e `aria-label="Filtrar máquinas por status"` por `t('machines.searchAriaLabel')` e `t('machines.statusFilterAriaLabel')`.
**Where**: `Frontend/src/pages/VisaoGeralPage.tsx`
**Depends on**: T5
**Reuses**: `useTranslation` já importado; o teste de `VisaoGeralPage.test.tsx:502` já troca para en-US e serve de modelo
**Requirement**: I18N-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em pt-BR os 2 rótulos seguem iguais (testes antigos passam sem edição).
- [ ] Teste novo em `VisaoGeralPage.test.tsx`: em en-US `getByLabelText('Search machine by ID or sector')` e `getByLabelText('Filter machines by status')` existem.
- [ ] Gate check passes: `cd Frontend && yarn -s vitest run src/test/pages/VisaoGeralPage.test.tsx`
- [ ] Test count: ≥ 1 teste novo, nenhum removido.

**Tests**: unit (`Frontend/src/test/pages/VisaoGeralPage.test.tsx`)
**Gate**: quick

**Commit**: `feat(i18n): rótulos de busca e filtro da Visão Geral traduzidos`

---

### T7: MachineCard usa t() no rótulo de ações

**What**: Em `MachineCard.tsx`, trocar o template ``aria-label={`Mais ações para ${identificacao}`}`` por `aria-label={t('machines.moreActions', { name: identificacao })}`.
**Where**: `Frontend/src/components/machines/MachineCard.tsx`
**Depends on**: T6
**Reuses**: `useTranslation` já importado em `MachineCard.tsx`
**Requirement**: I18N-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em pt-BR o rótulo continua "Mais ações para EMP-081" (testes antigos passam sem edição).
- [ ] Teste novo em `MachineCard.test.tsx`: em en-US o botão se chama "More actions for EMP-081"; com identificação `A&B <1>` o rótulo contém o texto sem escape.
- [ ] Gate check passes: `cd Frontend && yarn -s vitest run src/test/components/machines/MachineCard.test.tsx`
- [ ] Test count: ≥ 2 testes novos, nenhum removido.

**Tests**: unit (`Frontend/src/test/components/machines/MachineCard.test.tsx`)
**Gate**: quick

**Commit**: `feat(i18n): rótulo de ações do cartão de máquina traduzido`

---

### T8: NewMachinePanel usa t() no placeholder do nome

**What**: Em `NewMachinePanel.tsx`, trocar `placeholder="Ex: Empilhadeira Elétrica Titan-X"` por `placeholder={t('machines.phName')}`. Os placeholders `EMP-084` e `AA:BB:CC:DD:EE:FF` ficam como estão (fora de escopo).
**Where**: `Frontend/src/components/machines/NewMachinePanel.tsx`
**Depends on**: T7
**Reuses**: `useTranslation` já importado em `NewMachinePanel.tsx`
**Requirement**: I18N-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em pt-BR o placeholder continua "Ex: Empilhadeira Elétrica Titan-X" (testes antigos passam sem edição).
- [ ] Teste novo em `NewMachinePanel.test.tsx`: em en-US o campo de nome tem placeholder "E.g.: Titan-X Electric Forklift".
- [ ] Gate check passes: `cd Frontend && yarn -s vitest run src/test/components/machines/NewMachinePanel.test.tsx`
- [ ] Test count: ≥ 1 teste novo, nenhum removido.

**Tests**: unit (`Frontend/src/test/components/machines/NewMachinePanel.test.tsx`)
**Gate**: quick

**Commit**: `feat(i18n): placeholder do nome da máquina traduzido`

---

### T9: RouteErrorBoundary usa t() na mensagem e no botão

**What**: Em `appRoutes.tsx`, o `RouteErrorBoundary` é um componente de classe: importar `i18n` de `../config/i18n` e trocar "Ocorreu um erro ao carregar a página." e "Recarregar" por `i18n.t('common.routeLoadError')` e `i18n.t('common.reload')`. Deixar o `console.error` como está.
**Where**: `Frontend/src/routes/appRoutes.tsx`
**Depends on**: T8
**Reuses**: `Frontend/src/config/i18n.ts` (instância default já usada nos testes)
**Requirement**: I18N-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em pt-BR a mensagem e o botão seguem iguais (testes antigos de `appRoutes.test.tsx` passam sem edição).
- [ ] Teste novo em `appRoutes.test.tsx`: em en-US o boundary mostra "An error occurred while loading the page." e o botão "Reload".
- [ ] Gate check passes: `cd Frontend && yarn -s vitest run src/test/routes/appRoutes.test.tsx`
- [ ] Gate de build da fase: `cd Frontend && yarn -s lint && npx tsc -b && yarn -s test` passa.
- [ ] Nenhum dos 11 literais aparece mais em `Frontend/src` fora de `locales` e `test` (`grep -rn` dos 11 textos, exceto o bloco DEV, devolve vazio).

**Tests**: unit (`Frontend/src/test/routes/appRoutes.test.tsx`)
**Gate**: build

**Commit**: `feat(i18n): mensagem de erro de rota traduzida`

---

### T10: Espanhol completo

**What**: No es, adicionar todas as chaves que faltam em relação a pt-BR: o módulo `employee` inteiro (cerca de 70 chaves em `sessionBar`, `nav`, `common`, `home`, `machines`, `detail`, `session`, `history`, `incident`, `settings`), `machines.labelDeviceName`, `machines.newMachineSubtitle` e as 11 chaves novas de T2. Manter os mesmos `{{placeholders}}`. Reaproveitar o vocabulário que o es já usa em `machines`, `team` e `alerts` (empilhadeira = "carretilla elevadora" ou o termo que o arquivo já usar; seguir o arquivo). Remover `'es'` de `PENDING_LOCALES`.
**Where**: `Frontend/src/locales/es/translation.json`
**Depends on**: T9
**Reuses**: Termos existentes do próprio es; estrutura de `employee` de pt-BR como referência de chaves
**Requirement**: I18N-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Paridade de `es` passa (chaves base, placeholders, valores não vazios, sem chave extra).
- [ ] Nenhuma chave existente do es foi alterada (o diff só adiciona linhas).
- [ ] Textos de `employee.*` estão em espanhol, não em português (conferir 10 chaves ao acaso; cognatos como "Offline" são aceitos).
- [ ] `PENDING_LOCALES` sem `'es'`.
- [ ] Gate check passes: `cd Frontend && yarn -s test`

**Tests**: unit (paridade em `Frontend/src/test/config/i18n.test.ts`)
**Gate**: full

**Commit**: `feat(i18n): espanhol completo, incluindo a área do funcionário`

---

### T11: Francês completo

**What**: No fr, mesma tarefa de T10: adicionar `employee` inteiro, `machines.labelDeviceName`, `machines.newMachineSubtitle` e as 11 chaves de T2, mantendo placeholders e o vocabulário do próprio fr. Remover `'fr'` de `PENDING_LOCALES`.
**Where**: `Frontend/src/locales/fr/translation.json`
**Depends on**: T10
**Reuses**: Termos existentes do próprio fr
**Requirement**: I18N-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Paridade de `fr` passa.
- [ ] O diff só adiciona linhas ao JSON.
- [ ] Textos de `employee.*` estão em francês (conferir 10 chaves ao acaso).
- [ ] `PENDING_LOCALES` sem `'fr'`.
- [ ] Gate check passes: `cd Frontend && yarn -s test`

**Tests**: unit
**Gate**: full

**Commit**: `feat(i18n): francês completo, incluindo a área do funcionário`

---

### T12: Alemão completo

**What**: No de, mesma tarefa de T10: adicionar `employee` inteiro, as 2 chaves de `machines` e as 11 chaves de T2, mantendo placeholders e o vocabulário do próprio de. Remover `'de'` de `PENDING_LOCALES`.
**Where**: `Frontend/src/locales/de/translation.json`
**Depends on**: T11
**Reuses**: Termos existentes do próprio de
**Requirement**: I18N-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Paridade de `de` passa.
- [ ] O diff só adiciona linhas ao JSON.
- [ ] Textos de `employee.*` estão em alemão (conferir 10 chaves ao acaso).
- [ ] `PENDING_LOCALES` sem `'de'`.
- [ ] Gate check passes: `cd Frontend && yarn -s test`

**Tests**: unit
**Gate**: full

**Commit**: `feat(i18n): alemão completo, incluindo a área do funcionário`

---

### T13: Japonês completo

**What**: No ja, mesma tarefa de T10: adicionar `employee` inteiro, as 2 chaves de `machines` e as 11 chaves de T2. Japonês tem só a categoria de plural `other`: onde pt-BR tem `_one`/`_other` basta `_other`; não criar `_one`. Os plurais de `dashboard` (`cellLabel`, `minutes`, `pageInfo`) já estão cobertos se existir `_other`; conferir antes de adicionar. Remover `'ja'` de `PENDING_LOCALES`.
**Where**: `Frontend/src/locales/ja/translation.json`
**Depends on**: T12
**Reuses**: Termos existentes do próprio ja
**Requirement**: I18N-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Paridade de `ja` passa (aceita só `_other` nos plurais).
- [ ] O diff só adiciona linhas ao JSON.
- [ ] Textos de `employee.*` estão em japonês (conferir 10 chaves ao acaso).
- [ ] `PENDING_LOCALES` sem `'ja'`.
- [ ] Gate check passes: `cd Frontend && yarn -s test`

**Tests**: unit
**Gate**: full

**Commit**: `feat(i18n): japonês completo, incluindo a área do funcionário`

---

### T14: Russo completo e paridade total

**What**: No ru, mesma tarefa de T10: adicionar `employee` inteiro, as 2 chaves de `machines` e as 11 chaves de T2. Russo usa `_one`, `_few`, `_many`, `_other`: para chaves de plural novas em `employee`, criar as 4 variantes (as existentes `dashboard.*_few`/`_many` ficam). Remover `'ru'` de `PENDING_LOCALES`; com a lista vazia, apagar a constante e o filtro, e remover a exceção `key !== 'employee'` do teste "all locales have the same top-level keys as pt-BR".
**Where**: `Frontend/src/locales/ru/translation.json`
**Depends on**: T13
**Reuses**: Termos existentes do próprio ru
**Requirement**: I18N-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Paridade de `ru` passa e agora vale para os 6 idiomas sem lista de pendentes.
- [ ] A exceção de `employee` no teste de chaves de topo foi removida e o teste passa.
- [ ] Textos de `employee.*` estão em russo (conferir 10 chaves ao acaso).
- [ ] O diff do JSON só adiciona linhas.
- [ ] Gate de build: `cd Frontend && yarn -s lint && npx tsc -b && yarn -s test` passa (≥ 1718 testes mais os novos).

**Tests**: unit
**Gate**: build

**Commit**: `feat(i18n): russo completo e paridade obrigatória nos 7 idiomas`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2 ------→ T3
Phase 2:  T3 ------→ T4 ------→ T5 ------→ T6 ------→ T7 ------→ T8 ------→ T9
Phase 3:  T9 ------→ T10 -----→ T11 -----→ T12 -----→ T13 -----→ T14
```

Execução sequencial por um único worker (decisão do usuário): 14 tasks, um commit atômico por task. Depois do T14 roda o Verifier independente (outro worker), que confere cada AC do spec, roda a sensor de mutação (apagar uma chave de um locale e trocar um placeholder devem derrubar o teste) e grava `validation.md`.
