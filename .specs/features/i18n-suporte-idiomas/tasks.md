# i18n — Suporte de Idiomas: Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/i18n-suporte-idiomas/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec — confirm before Execute.
> Guidelines found: `Frontend/package.json` (vitest, coverage via `yarn test`); `CLAUDE.md` (commit restrictions); testes existentes em `Frontend/src/test/`. Cobertura mínima de 80 % exigida pela spec (AC I18N-23). Strong defaults aplicados para camadas sem guideline explícita.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| `src/config/i18n.ts` (config/init) | unit | Todos os branches: idioma padrão PT-BR, idioma lido de localStorage válido, idioma inválido → PT-BR, fallback de chave ausente | `Frontend/src/test/**/*.test.ts(x)` | `cd Frontend && yarn test` |
| `src/hooks/useLanguage.ts` (lógica de negócio) | unit | 1:1 com ACs I18N-09 a I18N-13: changeLanguage atualiza language, persiste em localStorage, lista correta de idiomas, idioma inválido → PT-BR | `Frontend/src/test/**/*.test.ts(x)` | `cd Frontend && yarn test` |
| Componentes modificados (Header, Sidebar, VisaoGeralPage, MachineCard, NewMachinePanel) | unit (smoke) | Render sem crash com i18next mockado; assertions de texto via chaves de tradução ou idioma PT-BR ativo | `Frontend/src/test/**/*.test.ts(x)` | `cd Frontend && yarn test` |
| `src/locales/*/translation.json` (dados puros) | none | Build gate apenas (TypeScript import) | — | build gate |
| Páginas stub (AlertasPage, EquipePage, FrotaPage, NotFoundPage) | none | Build gate apenas | — | build gate |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após tasks com unit tests | `cd Frontend && yarn test` |
| Build | Após phase completion ou tasks de config/dados | `cd Frontend && yarn test && yarn build` |

---

## Execution Plan

Phases são ordenadas e sequenciais — cada phase completa antes da próxima começar.

```
Phase 1 → Phase 2 → Phase 3 → Phase 4
```

### Phase 1: Foundation (T1–T3)

Instala dependências e cria a infraestrutura de i18n. Pré-requisito de tudo.

```
T1 → T2 → T3
T1 → T3
```

### Phase 2: Hook e Persistência (T4)

Cria `useLanguage` com API pública e persistência em localStorage.

```
T2 → T4
T3 → T4
```

### Phase 3: Traduções — 7 idiomas (T5–T6)

Cria os arquivos de tradução. T5 cria a base PT-BR; T6 cria os 6 restantes.

```
T3 → T5 → T6
```

### Phase 4: Integração e Conversão de Componentes (T7–T11)

Conecta i18n nos componentes existentes. Sequencial por dependência de roteamento.

```
T4 → T7
T6 → T7
T6 → T8
T6 → T9
T6 → T10
T7 → T11
T8 → T11
```

---

## Task Breakdown

### T1: Instalar dependências i18n

**What**: Adicionar `i18next` e `react-i18next` ao `package.json` do Frontend via yarn.
**Where**: `Frontend/package.json`
**Depends on**: None
**Reuses**: Padrão de instalação do projeto (yarn)
**Requirement**: I18N-01, I18N-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `i18next` e `react-i18next` aparecem em `dependencies` de `Frontend/package.json`
- [x] `yarn install` completa sem erros
- [x] `cd Frontend && yarn test` mantém 47 testes passando (nenhum quebrado)

**Tests**: none
**Gate**: quick

**Commit**: `chore(i18n): install i18next and react-i18next`

---

### T2: Criar constante `VALID_LANGUAGES` e tipo `SupportedLanguage`

**What**: Criar `src/types/i18n.ts` com a constante `VALID_LANGUAGES` (array readonly dos 7 códigos) e o tipo derivado `SupportedLanguage`.
**Where**: `Frontend/src/types/i18n.ts` [NEW]
**Depends on**: T1
**Reuses**: Padrão de `src/types/` existente
**Requirement**: I18N-12

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `VALID_LANGUAGES` é `['pt-BR', 'en-US', 'es', 'fr', 'ja', 'de', 'ru'] as const`
- [x] `SupportedLanguage` é o tipo derivado (`typeof VALID_LANGUAGES[number]`)
- [x] TypeScript compila sem erros (`yarn build` não falha no tipo)
- [x] `cd Frontend && yarn test` mantém 47 testes passando

**Tests**: none
**Gate**: build

**Commit**: `feat(i18n): add VALID_LANGUAGES constant and SupportedLanguage type`

---

### T3: Criar `src/config/i18n.ts` (inicialização síncrona)

**What**: Criar o módulo de configuração do i18next com `initReactI18next`, `resources` vazios (objeto vazio por agora, populado em T5/T6), `lng` lido de `localStorage` com fallback PT-BR, e `initImmediate: false`.
**Where**: `Frontend/src/config/i18n.ts` [NEW]
**Depends on**: T1, T2
**Reuses**: `VALID_LANGUAGES` de `src/types/i18n.ts`

> `main.tsx` também recebe `import './config/i18n'` nesta task (efeito colateral de 1 linha).
**Requirement**: I18N-01, I18N-02, I18N-03, I18N-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `i18n.ts` chama `i18next.use(initReactI18next).init({ ... })` de forma síncrona
- [x] `lng` é lido de `localStorage.getItem('liftech-lang')`; se inválido ou ausente, usa `'pt-BR'`
- [x] `fallbackLng: 'pt-BR'`; `interpolation: { escapeValue: false }`; `initImmediate: false`
- [x] `main.tsx` importa `'./config/i18n'` antes do `ReactDOM.createRoot`
- [x] Testes do módulo cobrem: idioma padrão PT-BR quando localStorage está vazio, idioma lido de localStorage válido, idioma inválido em localStorage → PT-BR
- [x] `cd Frontend && yarn test` passa com ≥ 50 testes (47 + ≥ 3 novos de i18n config)

**Tests**: unit (cobertura ≥ 80 % do módulo `i18n.ts`)
**Gate**: quick

**Commit**: `feat(i18n): add i18n config with sync init, localStorage bootstrap, and fallback`

---

### T4: Criar hook `useLanguage`

**What**: Criar `src/hooks/useLanguage.ts` exportando `useLanguage()` com `{ language, changeLanguage, languages }`. `changeLanguage` atualiza `i18next.language` e persiste em `localStorage['liftech-lang']`. `languages` é array `LanguageOption[]` com os 7 idiomas.
**Where**: `Frontend/src/hooks/useLanguage.ts` [NEW]
**Depends on**: T2, T3
**Reuses**: `VALID_LANGUAGES` de `src/types/i18n.ts`
**Requirement**: I18N-09, I18N-10, I18N-11, I18N-12, I18N-13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `useLanguage()` retorna `{ language: string, changeLanguage: (code: string) => void, languages: LanguageOption[] }`
- [x] `changeLanguage('en-US')` → `i18next.language === 'en-US'` e `localStorage.getItem('liftech-lang') === 'en-US'`
- [x] `changeLanguage('zz')` (inválido) → nenhuma exceção; idioma permanece inalterado
- [x] `languages` contém exatamente 7 entradas com `code`, `flag`, `nativeLabel`
- [x] Testes cobrem: changeLanguage atualiza language, persiste em localStorage, idioma inválido ignorado, lista de idiomas completa
- [x] `cd Frontend && yarn test` passa com ≥ 57 testes (50 anteriores + ≥ 7 novos de useLanguage)

**Tests**: unit (cobertura ≥ 80 % do módulo `useLanguage.ts`)
**Gate**: quick

**Commit**: `feat(i18n): add useLanguage hook with changeLanguage and localStorage persistence`

---

### T5: Criar arquivo de tradução base `pt-BR/translation.json`

**What**: Criar `src/locales/pt-BR/translation.json` com todas as chaves dos 4 módulos (`common`, `navigation`, `machines`, `languages`) em Português e atualizar `i18n.ts` para registrar o recurso.
**Where**: `Frontend/src/locales/pt-BR/translation.json` [NEW]
**Depends on**: T3
**Reuses**: Textos hardcoded existentes em `Header.tsx`, `Sidebar.tsx`, `VisaoGeralPage.tsx`, `MachineCard.tsx`, `NewMachinePanel.tsx`
**Requirement**: I18N-05, I18N-06, I18N-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `translation.json` contém todos os módulos: `common`, `navigation`, `machines`, `languages`
- [x] Todos os textos visíveis dos componentes listados estão cobertos por uma chave
- [x] `i18n.ts` importa e registra `pt-BR` em `resources`
- [x] `i18next.t('navigation.overview')` retorna `'Visão Geral'` (smoke check via teste)
- [x] `cd Frontend && yarn test` mantém todos os testes anteriores passando

**Tests**: none (dados JSON — build gate)
**Gate**: build

**Commit**: `feat(i18n): add pt-BR translation file and register in i18n config`

---

### T6: Criar traduções para `en-US`, `es`, `fr`, `ja`, `de`, `ru`

**What**: Criar os 6 arquivos de tradução para `en-US`, `es`, `fr`, `ja`, `de`, `ru` com as mesmas chaves do PT-BR traduzidas e registrá-los em `i18n.ts`.
**Where**: `Frontend/src/locales/en-US/translation.json` [NEW] (e equivalentes para es, fr, ja, de, ru)
**Depends on**: T5
**Reuses**: Estrutura de chaves de `pt-BR/translation.json`
**Requirement**: I18N-05, I18N-07, I18N-08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] 6 arquivos criados; cada um tem todas as chaves de `pt-BR/translation.json`
- [x] `i18n.ts` importa e registra os 6 locales em `resources`
- [x] `i18next.changeLanguage('en-US'); i18next.t('navigation.overview')` retorna `'Overview'` (ou equivalente em inglês)
- [x] `cd Frontend && yarn test` passa todos os testes; build sem erros

**Tests**: none (dados JSON — build gate)
**Gate**: build

**Commit**: `feat(i18n): add en-US, es, fr, ja, de, ru translation files`

---

### T7: Integrar `useLanguage` no `Header` e ativar troca de idioma real

**What**: Refatorar `Header.tsx` para usar `useLanguage()` em vez do estado local `selectedLanguage`; substituir todos os textos hardcoded por `t('...')`.
**Where**: `Frontend/src/components/layout/Header.tsx` [MODIFY]
**Depends on**: T4, T6
**Reuses**: Estrutura de popover existente em `Header.tsx`

> Esta task cobre apenas a integração do `useLanguage` e tradução dos strings do popover. PAGE_TITLES é convertido em T11.
**Requirement**: I18N-14, I18N-15, I18N-16, I18N-17, I18N-18

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `useState<string>('pt-BR')` local removido; `useLanguage()` usado para `language` e `changeLanguage`
- [x] `LANGUAGES` array local removido do `Header.tsx`; source único é `useLanguage().languages`
- [x] `onClick` de cada opção chama `changeLanguage(code)` e fecha popover
- [x] Nomes dos idiomas no popover usam `t('languages.{code}')` (exibidos no idioma atual)
- [x] Texto `"Escolha um idioma"` → `t('languages.title')`
- [x] Testes do Header adaptados; smoke test confirma render sem crash com i18n mockado
- [x] `cd Frontend && yarn test` passa todos os testes anteriores

**Tests**: unit (smoke render)
**Gate**: quick

**Commit**: `feat(i18n): wire Header language selector to useLanguage and translate strings`

---

### T8: Converter `Sidebar.tsx` para usar `useTranslation`

**What**: Substituir os labels de navegação hardcoded em `Sidebar.tsx` por `t('navigation.*')`.
**Where**: `Frontend/src/components/layout/Sidebar.tsx` [MODIFY]
**Depends on**: T6
**Reuses**: `useTranslation` do `react-i18next`
> Dependência em T6 (traduções disponíveis) é suficiente; independente de T7.
**Requirement**: I18N-18, I18N-19, I18N-20

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Todos os labels de navegação do Sidebar usam `t('navigation.*')`
- [x] Nenhuma string em Português hardcoded permanece em JSX do Sidebar
- [x] `cd Frontend && yarn test` passa todos os testes; `grep -n '"Visão Geral"\|"Gerenciamento Frota"\|"Gestão de Equipe"\|"Histórico de Alertas"' Frontend/src/components/layout/Sidebar.tsx` retorna zero resultados em JSX

**Tests**: unit (smoke render — adaptação de testes existentes se houver)
**Gate**: quick

**Commit**: `feat(i18n): convert Sidebar navigation labels to translation keys`

---

### T9: Converter `VisaoGeralPage.tsx` e `MachineCard.tsx`

**What**: Aplicar `useTranslation` em `VisaoGeralPage.tsx` e `MachineCard.tsx`, substituindo todos os textos visíveis por chaves de tradução.
**Where**: `Frontend/src/pages/VisaoGeralPage.tsx` [MODIFY]
**Depends on**: T6
**Reuses**: Chaves `machines.*` do `translation.json`

> MachineCard está co-localizado com VisaoGeralPage e partilha as mesmas chaves; convertido na mesma task por coesão.
**Requirement**: I18N-18, I18N-19, I18N-20

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `VisaoGeralPage.tsx`: `"Cadastrar Máquina"`, `"Search..."`, `"Padrão"`, `"Nenhuma máquina encontrada"` → chaves de tradução
- [x] `MachineCard.tsx`: labels de status, campo operador, tempo de sessão → chaves de tradução
- [x] Testes existentes de `VisaoGeralPage.test.tsx` e `MachineCard.test.tsx` adaptados para trabalhar com i18n
- [x] `cd Frontend && yarn test` passa todos os testes

**Tests**: unit (smoke render + adaptação dos testes existentes)
**Gate**: quick

**Commit**: `feat(i18n): convert VisaoGeralPage and MachineCard to translation keys`

---

### T10: Converter `NewMachinePanel.tsx` e páginas stub

**What**: Aplicar `useTranslation` em `NewMachinePanel.tsx`, `AlertasPage.tsx`, `EquipePage.tsx`, `FrotaPage.tsx`, `NotFoundPage.tsx`.
**Where**: `Frontend/src/components/machines/NewMachinePanel.tsx` [MODIFY]
**Depends on**: T6
**Reuses**: Chaves `machines.*` e `navigation.*` do `translation.json`

> Páginas stub (AlertasPage, EquipePage, FrotaPage, NotFoundPage) são alteradas na mesma task por serem triviais (1 linha cada).
**Requirement**: I18N-18, I18N-19, I18N-20

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `NewMachinePanel.tsx`: labels de formulário, placeholders, botões → chaves de tradução
- [x] Páginas stub: títulos de placeholder → chaves `navigation.*`
- [x] `cd Frontend && yarn test` passa todos os testes
- [x] `grep -rn "Visão Geral\|Cadastrar Máquina\|Buscar máquina\|Nenhuma máquina\|Gerenciamento Frota\|Gestão de Equipe\|Histórico" Frontend/src/components Frontend/src/pages` retorna zero resultados em JSX

**Tests**: none
**Gate**: build

**Commit**: `feat(i18n): convert NewMachinePanel and stub pages to translation keys`

---

### T11: Converter `Header.tsx` — `PAGE_TITLES` para `useTranslation`

**What**: Substituir o mapa `PAGE_TITLES` hardcoded em `Header.tsx` (títulos derivados da rota) por `t('navigation.*')`, mantendo a lógica de rota.
**Where**: `Frontend/src/components/layout/Header.tsx` [MODIFY]
**Depends on**: T7, T8
**Reuses**: Chaves `navigation.*` já definidas em T5/T6; lógica de rota existente com `useLocation`
> Depende de T8 pois as chaves de navegação foram definidas nessa phase.
**Requirement**: I18N-18, I18N-19, I18N-20

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `PAGE_TITLES` removido; título derivado de `t('navigation.' + routeKey)` ou mapa de `pathname → chave`
- [x] Trocar idioma no popover atualiza o título do Header imediatamente (sem recarregar)
- [x] `cd Frontend && yarn test` passa todos os testes
- [x] Build sem erros de TypeScript: `cd Frontend && yarn build`

**Tests**: unit (smoke render com rota mockada)
**Gate**: build

**Commit**: `feat(i18n): convert Header PAGE_TITLES to dynamic translation keys`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 → T2 → T3
Phase 2:  T2 → T4
          T3 → T4
Phase 3:  T3 → T5 → T6
Phase 4:  T4 → T7
          T6 → T7
          T6 → T8
          T6 → T9
          T6 → T10
          T7 → T11
          T8 → T11
```

Total: 11 tasks → 2 batches sugeridos: Batch 1 = Phase 1+2+3 (T1–T6, 6 tasks), Batch 2 = Phase 4 (T7–T11, 5 tasks).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Instalar dependências | 1 operação yarn | ✅ Granular |
| T2: Criar VALID_LANGUAGES + tipo | 1 arquivo, 1 conceito | ✅ Granular |
| T3: Criar i18n.ts config | 1 arquivo de config | ✅ Granular |
| T4: Criar useLanguage hook | 1 hook | ✅ Granular |
| T5: Criar pt-BR translation.json | 1 arquivo + registro | ✅ Granular |
| T6: Criar 6 translations restantes | 6 arquivos JSON + registro — coesos por natureza | ⚠️ OK (dados paralelos, mesma estrutura) |
| T7: Integrar Header com useLanguage | 1 componente (Header) | ✅ Granular |
| T8: Converter Sidebar | 1 componente (Sidebar) | ✅ Granular |
| T9: Converter VisaoGeralPage + MachineCard | 2 componentes relacionados (mesma page flow) | ⚠️ OK (coesos — card é subcomponente da page) |
| T10: Converter NewMachinePanel + stubs | 1 componente principal + 4 páginas stub triviais | ⚠️ OK (stubs sem lógica; custo de splits > benefício) |
| T11: Converter PAGE_TITLES do Header | 1 mudança de Header (depende de T7 e T8) | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Início de Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1, T2 | T2 → T3 | ✅ Match |
| T4 | T2, T3 | Início de Phase 2 (após Phase 1) | ✅ Match |
| T5 | T3 | Início de Phase 3 (após Phase 2) | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T4, T6 | Início de Phase 4 (após Phase 3) | ✅ Match |
| T8 | T6 | T7 → T8 | ✅ Match |
| T9 | T6 | T8 → T9 | ✅ Match |
| T10 | T6 | T9 → T10 | ✅ Match |
| T11 | T7, T8 | T10 → T11 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Criada/Modificada | Matrix Requer | Task Diz | Status |
| ---- | ---------------------------- | ------------- | -------- | ------ |
| T1: Instalar deps | Dependência (package.json) | none | none | ✅ OK |
| T2: VALID_LANGUAGES type | Entity/type | none (build gate) | none | ✅ OK |
| T3: i18n.ts config | Config/lógica de init (business logic) | unit | unit | ✅ OK |
| T4: useLanguage hook | Hook/lógica de negócio | unit | unit | ✅ OK |
| T5: pt-BR translation.json | Dados JSON | none (build gate) | none | ✅ OK |
| T6: 6 translation files | Dados JSON | none (build gate) | none | ✅ OK |
| T7: Header refactor | Componente modificado | unit (smoke) | unit | ✅ OK |
| T8: Sidebar conversão | Componente modificado | unit (smoke) | unit | ✅ OK |
| T9: VisaoGeralPage + MachineCard | Componentes modificados (com testes existentes) | unit | unit | ✅ OK |
| T10: NewMachinePanel + stubs | Componente + páginas stub sem lógica | none (build gate) | none | ✅ OK |
| T11: Header PAGE_TITLES | Componente modificado | unit (smoke) | unit | ✅ OK |
