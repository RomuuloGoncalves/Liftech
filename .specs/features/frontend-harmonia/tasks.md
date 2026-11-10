# Frontend Harmonia Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/frontend-harmonia/spec.md`
**Design**: `.specs/features/frontend-harmonia/design.md` (papéis §2, tokens §3, ritmo §4, motion §5, posse de arquivos §6)
**Status**: Draft

### Protocolo de lane (vale para toda tarefa T2–T47)

1. Caminhos relativos a `Frontend/src/`. Ler o arquivo inteiro antes de editar. **Se um seletor ou valor "atual" da tarefa não existir como descrito, parar e escalar ao orquestrador** (não adivinhar).
2. Editar **só** o arquivo do `Where` e os testes que a lane possui (`design.md` §6). Testes somente-leitura (§6) não podem ser editados; se quebrarem, reverter a parte que quebrou e reportar.
3. Em todo arquivo tocado, trocar também `var(--black-title)` → `var(--text-h)` e `var(--black-text)` → `var(--text)` (H30), `var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1))` → `var(--ease-out)` e a curva literal `cubic-bezier(0.23, 1, 0.32, 1)` → `var(--ease-out)` (H51).
4. Nada de estrutura, posição, grid, ordem, componentes, raios ou alturas. Só o que a tarefa lista.
5. Teste: acrescentar um `describe('<arquivo>')` no teste novo da lane (`test/styles/harmony/<lane>.test.ts`, padrão `read`/`block` de `test/styles/polishControls.test.ts`) afirmando cada valor novo e a ausência do antigo. Se um teste possuído fixa o valor antigo, atualizar a asserção (nunca apagar o caso).
6. Node ≥ 20.19 obrigatório: `export PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH`.
7. Um commit por tarefa, Conventional Commits, identidade git do usuário, **sem** `Co-Authored-By` nem menção a IA: `style(harmonia): <resumo>` (CSS) ou `fix(harmonia): <resumo>` (TSX). Sem push.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `Frontend/package.json` (`test: vitest run`, `lint: eslint .`, engines node >=20.19), `Frontend/vite.config.ts` (vitest, setup `src/test/setup.ts`); padrão existente: testes regex sobre CSS em `src/test/styles/**` (37 arquivos, 323 testes) e RTL em `src/test/components/**`, `src/test/pages/**`. Linha de base: 129 arquivos / 1826 testes verdes com Node 22.22.2.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Tokens globais (`index.css`) | unit (regex sobre CSS) | cada token e regra de `design.md` §3 afirmados; `*` com `font-family` ausente | `src/test/styles/harmony/foundation.test.ts` | `yarn test src/test/styles` |
| CSS Module (estilo de componente/página) | unit (regex sobre CSS) | cada declaração alterada afirmada (valor novo presente, antigo ausente) no seletor; testes possuídos atualizados | `src/test/styles/harmony/<lane>.test.ts`, `src/test/styles/**/*.test.ts` | `yarn test src/test/styles` |
| Componente TSX | unit (RTL) | comportamento novo (atributo `title`, reduced-motion, valor inline) com caso feliz e o caso de borda da tarefa | `src/test/components/**`, `src/test/pages/**` | `yarn test` |
| Verificação final | unit (re-execução) | suíte inteira + build + lint + detector | — | Build gate |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Rodar em `Frontend/` com Node 22.22.2 no PATH.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas de CSS | `yarn test src/test/styles` |
| Full | Tarefas de TSX e última tarefa de cada lane | `yarn test` |
| Build | T1, fim de fase e T48 | `yarn build && yarn lint && yarn test && /home/romulo/.claude/skills/impeccable/scripts/impeccable detect --json --scope type src` |

---

## Execution Plan

Fase 1 roda sozinha. Na Fase 2, cada linha do diagrama é uma **lane** com arquivos disjuntos (`design.md` §6) e pode ir para um worker Gemini Flash em paralelo; dentro da lane a ordem é sequencial. Fase 3 roda depois que todas as lanes reportarem.

### Phase 1: Fundação

```
T1
```

### Phase 2: Lanes paralelas

```
S1 auth:     T1 -> T2 -> T3 -> T4 -> T5 -> T48
S2 common:   T1 -> T6 -> T7 -> T8 -> T9 -> T10 -> T48
S3 layout:   T1 -> T11 -> T12 -> T13 -> T14 -> T15 -> T16 -> T17 -> T48
G1 gestor:   T1 -> T18 -> T19 -> T20 -> T21 -> T22 -> T23 -> T24 -> T25 -> T48
G2a frota:   T1 -> T26 -> T27 -> T28 -> T29 -> T30 -> T31 -> T32 -> T48
G2b máquina: T1 -> T33 -> T34 -> T35 -> T36 -> T37 -> T38 -> T39 -> T48
E1 páginas:  T1 -> T40 -> T41 -> T42 -> T43 -> T44 -> T48
E2 comps:    T1 -> T45 -> T46 -> T47 -> T48
```

### Phase 3: Verificação

```
T48
```

---

## Task Breakdown

### T1: Tokens e regras globais

**What**: Aplicar em `index.css` exatamente o bloco de `design.md` §3: tokens `--text-muted: var(--text-label)`, `--blue-text: #1f78d1`, `--danger-text: var(--urgency-critical)`, `--yellow-text: #726800`, `--tracking-display: -0.01em`, `--ease-out`, `--dur-fast 120ms`, `--dur-base 180ms`, `--dur-slow 220ms`; trocar `* { font-family }` (e o comentário "Rever…") por `button, input, select, textarea { font-family: inherit; letter-spacing: inherit; }`; adicionar `::placeholder { color: var(--text-label); opacity: 1; }`; `h1, h2, h3 { letter-spacing: 0; line-height: 1.25; text-wrap: balance; }`; remover `line-height: 118%` do h2; `p { margin: 0; text-wrap: pretty; }`.
**Where**: `Frontend/src/index.css`
**Depends on**: None
**Reuses**: `--urgency-critical`, `--text-label`
**Requirement**: HARM-01, HARM-02, HARM-03, HARM-04, HARM-18

**Tools**:

- MCP: NONE
- Skill: `impeccable` (detector no gate)

**Done when**:

- [ ] `test/styles/harmony/foundation.test.ts` (novo) afirma os 9 tokens, a regra de controles, `::placeholder`, a regra `h1, h2, h3` e `p`, e que não existe `*` seguido de `{ font-family`
- [ ] `tokens.test.ts`, `font.test.ts`, `no-hardcoded-colors.test.ts`, `splash.test.ts` seguem verdes sem edição
- [ ] Gate check passes: `yarn build && yarn lint && yarn test && impeccable detect --json --scope type src` (0 achados de tipo)
- [ ] Test count: ≥ 1826 + novos (nenhum removido)

**Tests**: unit
**Gate**: build

**Commit**: `style(harmonia): tokens de texto, tracking e motion no index.css`

---

### T2: AuthLayout — ritmo, cores e título que quebra

**What**: `.page`: remover `font-family`, `letter-spacing: 0` e `line-height: 1.3`. `.title`: `white-space: nowrap` → `white-space: normal`; `letter-spacing: -0.4px` → `var(--tracking-display)`; `color: #41a8ff` → `var(--blue)` (manter o `@media (max-width: 359px)` como está). `.subtitle`: `line-height: 16px` → `1.45`; `color: #4c4c4c` → `var(--text)`. `.tab`: `font-weight: bold` → `600`; `color: #3a9cff` → `var(--blue-text)`; `border: 1px solid #e3e3e3` → `1px solid var(--line)`; `background: #fff` → `var(--white)`. `.tabActive`, `.hero`: `color: #fff` → `var(--white)`. `.heroTitle`: `letter-spacing: -0.3px` → `var(--tracking-display)`; `color: #fff` → `var(--white)`. `.heroSubtitle`: `line-height: 17px` → `1.45`. `.infoCard`: `color: #333` → `var(--text-h)`. `.infoIcon`: `#3a8bff` → `var(--blue)`. `.infoCardTitle`: `line-height: 14px` → `1.3`. `.infoCardDesc`: `line-height: 14px` → `1.35`; `color: #444` → `var(--text)`. Gradientes ficam.
**Where**: `Frontend/src/components/auth/AuthLayout.module.css`
**Depends on**: T1
**Reuses**: tokens de T1
**Requirement**: HARM-04, HARM-08, HARM-09, HARM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/auth.test.ts` (novo) afirma cada valor acima e que nenhum `color: #` resta no arquivo
- [ ] `authMobile.test.ts` verde (possuído; atualizar só se fixar valor alterado)
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): ritmo e cores do AuthLayout`

---

### T3: Abas da auth com título completo

**What**: Nas 3 `NavLink` de abas, adicionar `title` com o mesmo texto do rótulo: `title={t('auth.tabRequest')}`, `title={t('auth.tabAdmin')}`, `title={t('auth.tabCollaborator')}`.
**Where**: `Frontend/src/components/auth/AuthLayout.tsx`
**Depends on**: T2
**Reuses**: chaves i18n existentes
**Requirement**: HARM-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `test/components/auth/AuthLayout.test.tsx` ganha caso: cada link de aba tem `title` igual ao seu texto
- [ ] Gate check passes: `yarn test`
- [ ] Test count: +1 ou mais

**Tests**: unit
**Gate**: full

**Commit**: `fix(harmonia): title nas abas da auth para textos truncados`

---

### T4: AuthForm — rótulo, placeholder, cores e botão

**What**: `.labelAccent`: `font-size: var(--fs-xs)` → `var(--fs-sm)`; `color: #3a9cff` → `var(--blue-text)`. Apagar o bloco `.input::placeholder` inteiro. `.input`: `border: 1px solid #dedede` → `1px solid var(--line)`; `background: #fff` → `var(--white)`. `.sectionTitle`: `color: #333` → `var(--text-h)`. `.submitButton`: `color: #fff` → `var(--white)`; `transition` → `opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)`. `.forgotLink`: `color: #3a9cff` → `var(--blue-text)`; adicionar `font-weight: 500`. `.successTitle`: `font-weight: 700` → `600`. Gradiente do botão fica.
**Where**: `Frontend/src/components/auth/AuthForm.module.css`
**Depends on**: T3
**Reuses**: regra global `::placeholder` (T1)
**Requirement**: HARM-03, HARM-05, HARM-06, HARM-08, HARM-11, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/auth.test.ts` afirma os valores e a ausência de `::placeholder`, `font-weight: 300`, `font-weight: 700` e `color: #`
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): AuthForm sem hex e placeholder global`

---

### T5: NotFound — CTA no papel button-lg

**What**: `.cta`: `font-size: var(--fs-base)` → `var(--fs-md)`; `transition` com `120ms var(--ease-out, …)` → `var(--dur-fast) var(--ease-out)` (mesmas propriedades). `.code` (64px, -1.68px) fica (exceção Q9).
**Where**: `Frontend/src/pages/NotFoundPage.module.css`
**Depends on**: T4
**Reuses**: tokens de T1
**Requirement**: HARM-06, HARM-19, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/auth.test.ts` afirma `.cta` com `var(--fs-md)` e `var(--dur-fast) var(--ease-out)`
- [ ] Gate check passes: `yarn test` (último da lane)
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: full

**Commit**: `style(harmonia): CTA da 404 no tamanho de botão grande`

---

### T6: Modal — rodapé, gap e motion

**What**: `.title`: remover `letter-spacing: 0` (vem do global). `.footer`: `padding: 15px 30px` → `16px 30px`. `.titleGroup`: `gap: 10px` → `8px`. `.backdrop`: `animation: fade-in 150ms ease-out` → `fade-in var(--dur-base) var(--ease-out)`. `.dialog`: `animation: dialog-in 180ms cubic-bezier(...)` → `dialog-in var(--dur-base) var(--ease-out)`. `.body` (28px 30px) fica (Q3).
**Where**: `Frontend/src/components/common/Modal.module.css`
**Depends on**: T1
**Reuses**: tokens de T1
**Requirement**: HARM-12, HARM-19, HARM-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/common.test.ts` (novo) afirma os valores; `common.test.ts` verde
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): rodapé e motion do Modal`

---

### T7: DialogButtons — padding do botão compacto

**What**: `.cancel, .confirm`: `padding: 8px 18px` → `8px 16px`.
**Where**: `Frontend/src/components/common/DialogButtons.module.css`
**Depends on**: T6
**Reuses**: —
**Requirement**: HARM-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/common.test.ts` afirma `padding: 8px 16px`
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): padding do botão de diálogo na grade`

---

### T8: Toast — entrada com tokens

**What**: `.toast`: `animation: toast-in 180ms ease-out` → `toast-in var(--dur-base) var(--ease-out)`. Listra lateral fica (Q20).
**Where**: `Frontend/src/components/common/Toast.module.css`
**Depends on**: T7
**Reuses**: tokens de T1
**Requirement**: HARM-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/common.test.ts` afirma a animação com tokens
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): toast com tokens de motion`

---

### T9: Select — motion, reduced-motion duplicado e peso

**What**: `.button` `transition: border-color 0.15s ease`, `.chevron` `transform 0.15s ease`, `.option` `background-color 0.1s ease` → mesma propriedade com `var(--dur-fast) var(--ease-out)`. Apagar o bloco local `@media (prefers-reduced-motion: reduce)` (o global de `index.css` cobre). `.checkmark`: `font-weight: 700` → `600`. Remover `font-family: inherit` de `.button` (coberto por T1).
**Where**: `Frontend/src/components/common/Select.module.css`
**Depends on**: T8
**Reuses**: regra global de controles (T1)
**Requirement**: HARM-05, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/common.test.ts` afirma tokens, ausência de `prefers-reduced-motion` e de `font-weight: 700`
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): Select com tokens de motion`

---

### T10: Card — `.cardLg` com tokens

**What**: `.cardLg`: `gap: 12px` → `var(--card-gap-lg)`; `padding: 16px` → `var(--card-pad-lg)`. `.card` (em `--px`) fica.
**Where**: `Frontend/src/components/common/Card.module.css`
**Depends on**: T9
**Reuses**: `--card-gap-lg`, `--card-pad-lg`
**Requirement**: HARM-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `test/styles/cards/Card.test.ts` (possuído): caso `.cardLg` passa a afirmar `var(--card-pad-lg)` e `var(--card-gap-lg)`
- [ ] `team.test.ts`, `employeeSkeleton.test.ts`, `pageSkeleton.test.ts` verdes sem edição
- [ ] Gate check passes: `yarn test` (último da lane)
- [ ] Test count: igual ou maior

**Tests**: unit
**Gate**: full

**Commit**: `style(harmonia): cardLg usa os tokens de card`

---

### T11: Header — opção de idioma e motion

**What**: `.languageOption`: `font-size: var(--fs-sm)` → `var(--fs-md)`; `padding: 8px` → `8px 10px`. `.avatarButton`: `transition: transform 120ms ease` → `transform var(--dur-fast) var(--ease-out)`. `.popover`: `animation: popover-in 180ms var(--ease-out, …)` → `popover-in var(--dur-base) var(--ease-out)`.
**Where**: `Frontend/src/components/layout/Header.module.css`
**Depends on**: T1
**Reuses**: tokens de T1
**Requirement**: HARM-14, HARM-19, HARM-20, HARM-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/layout.test.ts` (novo) afirma os valores; `layout.test.ts` verde
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): opções de idioma e motion do Header`

---

### T12: Sidebar CSS — rótulo de grupo, botão e duração

**What**: `.sidebar`: `transition: width 200ms var(--ease-out, …)` → `width var(--dur-slow) var(--ease-out)`; no `@media (max-width: 767px)`, `transform 220ms var(--ease-out, …)` → `transform var(--dur-slow) var(--ease-out)`. `.toggleButton`: `transform 120ms ease` → `transform var(--dur-fast) var(--ease-out)`. `.sectionLabel`: `color: var(--text-h)` → `var(--text-label)`. `.feedbackButton`: `font-weight: 500` → `600`.
**Where**: `Frontend/src/components/layout/Sidebar.module.css`
**Depends on**: T11
**Reuses**: tokens de T1
**Requirement**: HARM-06, HARM-19, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/layout.test.ts` afirma os valores; `polishControls.test.ts` (somente leitura) verde
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): sidebar com rótulo de grupo e duração unificada`

---

### T13: Sidebar TSX — tamanho inline com token

**What**: Nos dois `style={{ fontSize: 12, … }}` do bloco DEV temporário, trocar `fontSize: 12` por `fontSize: 'var(--fs-sm)'`. Não remover o bloco.
**Where**: `Frontend/src/components/layout/Sidebar.tsx`
**Depends on**: T12
**Reuses**: `--fs-sm`
**Requirement**: HARM-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/layout.test.ts` lê `components/layout/Sidebar.tsx` e afirma ausência de `fontSize: 12`
- [ ] `test/components/layout/Sidebar.test.tsx` verde
- [ ] Gate check passes: `yarn test`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: full

**Commit**: `fix(harmonia): tamanho dos links DEV da sidebar via token`

---

### T14: AlertsDropdown — título, erro, botões e contador

**What**: `.bellButton`: transições `120ms ease` → `var(--dur-fast) var(--ease-out)`. `.popover`: `popover-in 180ms cubic-bezier(...)` → `popover-in var(--dur-base) var(--ease-out)`. `.titleButton`: `font-size: var(--fs-sm)` → `var(--fs-base)`; `color: var(--blue)` → `var(--blue-text)`. `.machineName`: `color: var(--red)` → `var(--danger-text)`. `.errorText` (as duas regras): `font-size: var(--fs-xs)` → `var(--fs-sm)`, adicionar `font-weight: 500`, cor vermelha → `var(--danger-text)`. `.retryButton`: `font-size: var(--fs-xs)` → `var(--fs-sm)`, adicionar `font-weight: 600`. `.moreButton`: adicionar `font-variant-numeric: tabular-nums` (peso 500 fica).
**Where**: `Frontend/src/components/layout/AlertsDropdown.module.css`
**Depends on**: T13
**Reuses**: tokens de T1
**Requirement**: HARM-06, HARM-07, HARM-11, HARM-20, HARM-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/layout.test.ts` afirma os valores
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): papéis tipográficos do AlertsDropdown`

---

### T15: BranchSelector — rótulo, ação e alerta

**What**: `.label`: `color: var(--text-h)` → `var(--text-label)`. `.actionBranch, .actionBranchCreate`: `font-weight: bold` → `600`. `.alert`: `color: var(--danger-solid)` → `var(--danger-text)`, adicionar `font-weight: 500`. `.confirm`: `color: var(--blue)` → `var(--blue-text)`. `.danger` (ícone) fica.
**Where**: `Frontend/src/components/layout/BranchSelector.module.css`
**Depends on**: T14
**Reuses**: tokens de T1
**Requirement**: HARM-05, HARM-06, HARM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/layout.test.ts` afirma os valores e ausência de `font-weight: bold`
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): BranchSelector no sistema de papéis`

---

### T16: ProfileModal — chave-valor e botões

**What**: `.label`: `font-size: var(--fs-base)` → `var(--fs-md)`; `font-weight: 500` → `600`. `.value`: `font-size: var(--fs-base)` → `var(--fs-md)`. `.deleteButton`: `font-size: var(--fs-base)` → `var(--fs-sm)`; `font-weight: 500` → `600`; `color: var(--danger-solid)` → `var(--danger-text)`. `.editButton` `color 150ms ease` e `.logoutButton` `opacity 150ms ease` → mesma propriedade com `var(--dur-fast) var(--ease-out)`.
**Where**: `Frontend/src/components/layout/ProfileModal.module.css`
**Depends on**: T15
**Reuses**: papel key-value do `InfoField`
**Requirement**: HARM-06, HARM-11, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/layout.test.ts` afirma os valores; `test/components/layout/ProfileModal.test.tsx` verde
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): ProfileModal no papel chave-valor`

---

### T17: AccountActionModal — cor do erro inline

**What**: Nos dois `<p>` de erro (`style={{ fontSize: 'var(--fs-sm)', color: 'var(--danger-solid)', … }}` e `role="alert"`), trocar `color: 'var(--danger-solid)'` por `'var(--danger-text)'` e acrescentar `fontWeight: 500`. O fundo do botão excluir (`--danger-solid`) fica.
**Where**: `Frontend/src/components/layout/AccountActionModal.tsx`
**Depends on**: T16
**Reuses**: `--danger-text`
**Requirement**: HARM-06, HARM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `test/components/layout/AccountActionModal.test.tsx` ganha caso: a mensagem de erro renderiza com `color: var(--danger-text)`
- [ ] Gate check passes: `yarn test` (último da lane)
- [ ] Test count: +1 ou mais

**Tests**: unit
**Gate**: full

**Commit**: `fix(harmonia): erro do AccountActionModal com cor acessível`

---

### T18: DashboardPage — h1, painel, KPI, retry, erro

**What**: `.title`: remover `font-weight: 700` e `color: var(--black-title)` (herda h1 500 `--text-h`). Título de painel (`:25`, 16/600): cor → `var(--text-h)`. `.cardNumber`: adicionar `font-variant-numeric: tabular-nums` (700 fica, data-display). `.retryButton`: `font-size: var(--fs-xs)` → `var(--fs-sm)`; `font-weight: 500` → `600`. Texto de erro (`:92-94`, `--danger-solid`) → `var(--danger-text)`. Hover sem transição (`:109`): adicionar `transition: background-color var(--dur-fast) var(--ease-out)` (ou `opacity`, a propriedade que o hover muda).
**Where**: `Frontend/src/pages/DashboardPage.module.css`
**Depends on**: T1
**Reuses**: regra global h1 (T1)
**Requirement**: HARM-05, HARM-06, HARM-07, HARM-11, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/gestor.test.ts` (novo) afirma os valores; `cards/DashboardKpi.test.ts` e `cards/DashboardHeights.test.ts` (possuídos) verdes, atualizados se necessário (o 700 do KPI continua)
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): Dashboard com h1 do sistema e KPI tabular`

---

### T19: MachineTable — botão, números e motion

**What**: `.createButton`: `font-size: var(--fs-sm)` → `var(--fs-md)`; `font-weight: 500` → `600` (altura 38 fica). `.td`, `.pageInfo`, `.pageNumber`: adicionar `font-variant-numeric: tabular-nums`. Transições `0.15s` (`:71,91,190`) → `var(--dur-fast) var(--ease-out)`. Hover sem transição (`:144`): adicionar transição com `var(--dur-fast) var(--ease-out)`.
**Where**: `Frontend/src/components/dashboard/MachineTable.module.css`
**Depends on**: T18
**Reuses**: tokens de T1
**Requirement**: HARM-06, HARM-07, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/gestor.test.ts` afirma os valores; `cards/DashboardHeights.test.ts` verde
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): MachineTable com botão de toolbar e números tabulares`

---

### T20: UsageHeatmap — transição morta e horas tabulares

**What**: `.cell`: remover `transition: opacity 0.15s`. `.hourHeader`: adicionar `font-variant-numeric: tabular-nums`.
**Where**: `Frontend/src/components/dashboard/UsageHeatmap.module.css`
**Depends on**: T19
**Reuses**: —
**Requirement**: HARM-07, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/gestor.test.ts` afirma ausência de `transition` em `.cell` e `tabular-nums` em `.hourHeader`
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): heatmap sem transição morta`

---

### T21: SolicitacoesPage — h1, vazio, aba e erro

**What**: `.title`: remover `font-weight: 600` e o `color` local (herda h1). Estado vazio (`:81-90`): `font-size: var(--fs-md)` → `var(--fs-base)`. `.tab`: `transition: color …` → `color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)`. Erro (`:104`): `var(--danger-solid)` → `var(--danger-text)`.
**Where**: `Frontend/src/pages/SolicitacoesPage.module.css`
**Depends on**: T20
**Reuses**: regra global h1 (T1)
**Requirement**: HARM-06, HARM-11, HARM-19, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/gestor.test.ts` afirma os valores; `cards/grids.test.ts` verde
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): Solicitações no sistema de papéis`

---

### T22: EquipePage — título de painel, casca, vazio e press

**What**: `.sectionTitle`: `font-size: var(--fs-xl)` → `var(--fs-lg)`; `font-weight: 500` → `600`; `color: var(--blue)` → `var(--text-h)`; remover `letter-spacing: 0`. Casca do painel (`:14-16`): `border: 0.5px solid var(--border)` → `1px solid var(--line)`; `border-radius: 10px` → `var(--radius-lg)` (mesmo valor). `.emptyState`: `padding: 24px 0` → `48px 0`. Botão de toolbar (`:50-63`): adicionar `transition: transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out)`, `:hover { opacity: 0.92 }`, `:active { transform: scale(0.97) }`.
**Where**: `Frontend/src/pages/EquipePage.module.css`
**Depends on**: T21
**Reuses**: casca de `MachineTable`
**Requirement**: HARM-06, HARM-15, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/gestor.test.ts` afirma os valores; `polishControls.test.ts` e `pageSkeleton.test.ts` (somente leitura) verdes
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): painel e título da Equipe`

---

### T23: EmployeeCard — status negado e duração

**What**: `.denied`: `color: var(--red)` → `var(--danger-text)`. Transição `150ms` (`:118`) → `var(--dur-fast) var(--ease-out)`.
**Where**: `Frontend/src/components/team/EmployeeCard.module.css`
**Depends on**: T22
**Reuses**: `--danger-text`
**Requirement**: HARM-11, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `cards/EmployeeCard.test.ts` (possuído): asserção `color: var(--red)` passa a `var(--danger-text)`
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: igual

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): status negado do EmployeeCard acessível`

---

### T24: TeamForm — erro e placeholder

**What**: `.error`: `font-size: var(--fs-xs)` → `var(--fs-sm)`; `color: var(--red)` → `var(--danger-text)`; adicionar `font-weight: 500`. Apagar o bloco `.input::placeholder`. `.leftIcon`, `.rightButton`: `var(--black-text)` → `var(--text)`. `.divider` (-30px) fica (Q3).
**Where**: `Frontend/src/components/team/TeamForm.module.css`
**Depends on**: T23
**Reuses**: regra global `::placeholder` (T1)
**Requirement**: HARM-03, HARM-06, HARM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/gestor.test.ts` afirma os valores e ausência de `::placeholder`
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): erro e placeholder do TeamForm`

---

### T25: AccessRequestCard — easing sem fallback

**What**: `:59`: `var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1))` → `var(--ease-out)`; duração literal 120ms → `var(--dur-fast)`.
**Where**: `Frontend/src/components/accessRequests/AccessRequestCard.module.css`
**Depends on**: T24
**Reuses**: tokens de T1
**Requirement**: HARM-19

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/gestor.test.ts` afirma ausência de `var(--ease-out,`; `cards/AccessRequestCard.test.ts` verde
- [ ] Gate check passes: `yarn test` (último da lane)
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: full

**Commit**: `style(harmonia): AccessRequestCard com token de easing`

---

### T26: FleetCard — cabeçalho caution e tracking

**What**: `.topRow.caution`: `color: var(--white)` → `var(--text-h)`. `.nome`: remover `letter-spacing: 0`. Tamanhos em `--px` ficam (Q4).
**Where**: `Frontend/src/components/fleet/FleetCard.module.css`
**Depends on**: T1
**Reuses**: padrão `toneManutencao` (texto escuro sobre amarelo)
**Requirement**: HARM-04, HARM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `cards/FleetCard.test.ts` (possuído): `color: var(--black-text)` vira `var(--text)`; novo caso afirma `.topRow.caution` com `var(--text-h)`
- [ ] `pageSkeleton.test.ts` verde sem edição
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: +1 ou mais

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): FleetCard caution legível`

---

### T27: FleetRow — chip, contador, placeholder e botões

**What**: `.manutencao`: `color: var(--yellow)` → `var(--yellow-text)`. `.label`: adicionar `font-weight: 500`. `.count`: adicionar `font-variant-numeric: tabular-nums`. Apagar a regra de placeholder (`:128`). `.editButton, .deleteButton`: `font-weight: 700` → `600`. Transições `ease` → `var(--dur-fast) var(--ease-out)`. Tamanhos em `--px` ficam (Q4).
**Where**: `Frontend/src/components/fleet/FleetRow.module.css`
**Depends on**: T26
**Reuses**: `--yellow-text`
**Requirement**: HARM-03, HARM-05, HARM-07, HARM-11, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/fleet.test.ts` (novo) afirma os valores; `fleet.test.ts` (possuído) verde; `pageSkeleton.test.ts` verde sem edição
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): FleetRow com chip legível e contador tabular`

---

### T28: CategoryFormModal — inputs, erro e popover que não desliza

**What**: `.nameInput`: `font-size: var(--fs-xs)` → `var(--fs-md)`. `.hex input`: `var(--fs-xs)` → `var(--fs-sm)` + `font-variant-numeric: tabular-nums`. Apagar a regra de placeholder (`:154`). Erro (`:162-164`): `var(--danger-solid)` → `var(--danger-text)`. `.popover`: trocar `transform: translateX(-40%)` por `translate: -40% 0` (o `@keyframes menu-in` continua só com `transform: translateY(-4px)`); animação → `menu-in var(--dur-base) var(--ease-out)`.
**Where**: `Frontend/src/components/fleet/CategoryFormModal.module.css`
**Depends on**: T27
**Reuses**: tokens de T1
**Requirement**: HARM-03, HARM-06, HARM-07, HARM-11, HARM-21, HARM-22

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/fleet.test.ts` afirma `translate: -40% 0`, ausência de `translateX(-40%)` em `.popover`, e os demais valores
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `fix(harmonia): popover de cor sem deslize lateral e inputs na escala`

---

### T29: MachinePickerModal — input e opções

**What**: Input (`:59`, `:66`) `font-size: var(--fs-sm)` → `var(--fs-md)`. Opções (`:91`) `var(--fs-sm)` → `var(--fs-md)`. Vazio (`:106`, 12px) fica (contêiner).
**Where**: `Frontend/src/components/fleet/MachinePickerModal.module.css`
**Depends on**: T28
**Reuses**: papel control
**Requirement**: HARM-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/fleet.test.ts` afirma os valores
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): MachinePicker com controles em fs-md`

---

### T30: StatusBadge — texto de status acessível

**What**: `.manutencao`: `color: var(--yellow)` → `var(--yellow-text)`. `.em_uso`: `color: var(--blue)` → `var(--blue-text)`. Fundos e bordas ficam.
**Where**: `Frontend/src/components/machines/StatusBadge.module.css`
**Depends on**: T29
**Reuses**: `--yellow-text`, `--blue-text`
**Requirement**: HARM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `machines.test.ts` (possuído): tabela `[cls, bg, fg]` passa a `['em_uso','blue-bg','blue-text']`, `['manutencao','yellow-bg','yellow-text']`
- [ ] `polishCards.test.ts`, `employeeSheet.test.ts`, `fleet.test.ts` verdes
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: igual

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): StatusBadge com texto de status legível`

---

### T31: MachineDetailModal — hierarquia, botões, abas e números

**What**: `.infoValue`: `font-size: var(--fs-xs)` → `var(--fs-sm)`; `font-weight: 700` → `600`; adicionar `font-variant-numeric: tabular-nums`. `.action` (`:213-222`) e editar/excluir 11/700 → `var(--fs-sm)`/600. `.tab` (`:104-107`): `var(--fs-xs)`/`bold` → `var(--fs-sm)`/600. Retry 11/600 (`:309`) → `var(--fs-sm)`. Erro (`:303-306`) → `var(--danger-text)`. Vazio (`:205-209`) `var(--fs-md)` → `var(--fs-sm)`. `.event`: adicionar `tabular-nums`. Transições `0.15s` (`:318`) → `var(--dur-fast) var(--ease-out)`. Override de `.badge` fica.
**Where**: `Frontend/src/components/machines/MachineDetailModal.module.css`
**Depends on**: T30
**Reuses**: papéis button, tab, data
**Requirement**: HARM-05, HARM-06, HARM-07, HARM-11, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/fleet.test.ts` afirma os valores e ausência de `font-weight: 700` e `bold`; `machines.test.ts` verde
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): MachineDetailModal com hierarquia valor > rótulo`

---

### T32: AlertasPage — casca do painel, contador e placeholder

**What**: `.panel` (`:13-15`): `padding: 16px` → `24px`; `border-radius: 8px` → `var(--radius-lg)`. `.count`: adicionar `font-variant-numeric: tabular-nums`. Apagar a regra de placeholder com `color-mix` (`:104`).
**Where**: `Frontend/src/pages/AlertasPage.module.css`
**Depends on**: T31
**Reuses**: casca de `MachineTable`
**Requirement**: HARM-03, HARM-07, HARM-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/fleet.test.ts` afirma os valores; `polishFleet.test.ts` (possuído) verde; `polishControls.test.ts` e `pageSkeleton.test.ts` verdes sem edição
- [ ] Gate check passes: `yarn test` (último da lane)
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: full

**Commit**: `style(harmonia): painel de Alertas na casca padrão`

---

### T33: NewMachinePanel — título, rótulo, input, cancelar, backdrop

**What**: `.title`: `font-weight: 600` → `500`. `.label`: `var(--fs-md)` → `var(--fs-sm)`. `.input` (`:108-115`): `var(--fs-base)` → `var(--fs-md)`. Submit (`:143`, 14/600) → `var(--fs-md)`. `.cancelButton`: `color: var(--red)` → `var(--danger-text)`. `.backdrop`: adicionar `animation: fade-in var(--dur-base) var(--ease-out)` e o keyframe `@keyframes fade-in { from { opacity: 0; } }` (cópia do `Modal.module.css`). `:21` easing com fallback → `var(--ease-out)`.
**Where**: `Frontend/src/components/machines/NewMachinePanel.module.css`
**Depends on**: T1
**Reuses**: `@keyframes fade-in` do Modal
**Requirement**: HARM-06, HARM-11, HARM-19, HARM-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/machines.test.ts` (novo) afirma os valores e o keyframe
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): NewMachinePanel no papel de modal`

---

### T34: MachineCard — título de card preto

**What**: `.nome`: `color: var(--accent)` → `var(--text-h)`; `line-height: 130%` → `1.3`.
**Where**: `Frontend/src/components/machines/MachineCard.module.css`
**Depends on**: T33
**Reuses**: papel card-title
**Requirement**: HARM-06, HARM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `cards/MachineCard.test.ts` (possuído): `color: var(--accent);` vira `color: var(--text-h);`
- [ ] `pageSkeleton.test.ts` verde sem edição
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: igual

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): nome da máquina no papel de título de card`

---

### T35: LevelInfoModal — tamanho literal

**What**: `.level`: `font-size: 16px` → `var(--fs-lg)`. Listra lateral (detector `side-tab`) fica.
**Where**: `Frontend/src/components/alerts/LevelInfoModal.module.css`
**Depends on**: T34
**Reuses**: `--fs-lg`
**Requirement**: HARM-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/machines.test.ts` afirma `var(--fs-lg)` e ausência de `font-size: 16px`
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): nível do LevelInfoModal na escala`

---

### T36: FeedbackModal — input e placeholder

**What**: Input/textarea (`:13-22`): `var(--fs-sm)` → `var(--fs-md)`. Apagar a regra de placeholder (`:27-28`).
**Where**: `Frontend/src/components/feedback/FeedbackModal.module.css`
**Depends on**: T35
**Reuses**: regra global `::placeholder` (T1)
**Requirement**: HARM-03, HARM-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/machines.test.ts` afirma os valores e ausência de `::placeholder`
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): FeedbackModal com input em fs-md`

---

### T37: VisaoGeralPage — press do botão de toolbar

**What**: Botão "Cadastrar" (`:33-42`): `transition` → `transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out)`; `:active` `transform: scale(0.97)`; `:hover` `opacity: 0.92` (manter se já existir).
**Where**: `Frontend/src/pages/VisaoGeralPage.module.css`
**Depends on**: T36
**Reuses**: tokens de T1
**Requirement**: HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/machines.test.ts` afirma os valores; `polishControls.test.ts` e `pageSkeleton.test.ts` verdes sem edição
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): press do botão da Visão Geral`

---

### T38: FrotaPage — press do botão e placeholder

**What**: Botão de toolbar (`:41-46`): mesma regra de T37 (`transition` com tokens, `:hover { opacity: 0.92 }`, `:active { transform: scale(0.97) }`). Apagar a regra de placeholder com `color-mix` (`:59`).
**Where**: `Frontend/src/pages/FrotaPage.module.css`
**Depends on**: T37
**Reuses**: regra de T37
**Requirement**: HARM-03, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/machines.test.ts` afirma os valores; `polishControls.test.ts` e `pageSkeleton.test.ts` verdes sem edição
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): press do botão da Frota`

---

### T39: InitialPasswordModal — fonte mono e aviso

**What**: Inline `fontFamily: 'monospace'` → `'var(--mono)'`. Na caixa de aviso (`:62-70`): `fontSize: 'var(--fs-xs)'` → `'var(--fs-sm)'`; `lineHeight: 1.4` → `1.45`. `letterSpacing: '0.05em'` da senha fica (legibilidade de código).
**Where**: `Frontend/src/components/accessRequests/InitialPasswordModal.tsx`
**Depends on**: T38
**Reuses**: `--mono`
**Requirement**: HARM-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `test/components/accessRequests/InitialPasswordModal.test.tsx` ganha caso: a senha usa `font-family: var(--mono)` e o aviso `font-size: var(--fs-sm)`
- [ ] Gate check passes: `yarn test` (último da lane)
- [ ] Test count: +1 ou mais

**Tests**: unit
**Gate**: full

**Commit**: `fix(harmonia): senha inicial com --mono e aviso legível`

---

### T40: EmployeeSettingsPage — h1, seção, rótulo, inputs, aviso, motion

**What**: `.title`: `font-weight: 600` → `500`. `.sectionTitle`: `var(--fs-md)` → `var(--fs-base)` (600). `.label`: `font-weight: 500` → `600`. `.input, .textarea`: `var(--fs-sm)` → `var(--fs-base)` (Q5). Apagar `.textarea::placeholder`. `.noticeText`: `font-size: 11px` → `var(--fs-xs)`. `.logout`, `.privacy`: `transition: opacity 0.2s` → `opacity var(--dur-fast) var(--ease-out)`.
**Where**: `Frontend/src/pages/employee/EmployeeSettingsPage.module.css`
**Depends on**: T1
**Reuses**: papéis page-title, section-title, field-label
**Requirement**: HARM-03, HARM-05, HARM-06, HARM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/employeePages.test.ts` (novo) afirma os valores; `cards/EmployeeSettings.test.ts` (possuído) verde
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): Configurações do funcionário no sistema de papéis`

---

### T41: EmployeeSessionPage CSS — cores semânticas e botão

**What**: `.description`: `var(--black-text)` → `var(--text)`. `.timer`: `var(--black-title)` → `var(--text-h)` (48px/700/tabular ficam). `.button`: `font-size: var(--fs-md)` → `var(--fs-base)`; `font-weight: 500` → `600` (button-touch). Sombra 3D fica (fora de escopo).
**Where**: `Frontend/src/pages/employee/EmployeeSessionPage.module.css`
**Depends on**: T40
**Reuses**: papel button-touch
**Requirement**: HARM-06, HARM-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/employeePages.test.ts` afirma os valores; `employeeSession.test.ts` (possuído) verde; `employeeSkeleton.test.ts` verde sem edição
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): sessão do funcionário com cores semânticas`

---

### T42: EmployeeSessionPage TSX — loop de vídeo respeita reduced-motion

**What**: No `useEffect` do loop (`requestAnimationFrame(function tick…)`), se `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, definir `video.style.opacity = '1'` e não iniciar o loop.
**Where**: `Frontend/src/pages/employee/EmployeeSessionPage.tsx`
**Depends on**: T41
**Reuses**: `loopFade` (sem mudança)
**Requirement**: HARM-23

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `test/pages/employee/EmployeeSessionPage.test.tsx` ganha 2 casos: com `matchMedia` → `reduce: true`, `requestAnimationFrame` não é chamado e a opacidade é `1`; com `false`, o loop roda como hoje
- [ ] Gate check passes: `yarn test`
- [ ] Test count: +2 ou mais

**Tests**: unit
**Gate**: full

**Commit**: `fix(harmonia): vídeo da sessão sem loop com reduced-motion`

---

### T43: EmployeeHomePage — título de card, números, statLabel

**What**: `.lastName`: `var(--fs-sm)` → `var(--fs-md)` e `line-height: 1.35` (mantém a caixa de linha em ~17,5px). `.digitBox`, `.lastTime`, `.lastDuration`, `.statValue`: adicionar `font-variant-numeric: tabular-nums`. `.digitColon`: `font-weight: 700` → `600`. `.statLabel`: adicionar `line-height: 1.35`.
**Where**: `Frontend/src/pages/employee/EmployeeHomePage.module.css`
**Depends on**: T42
**Reuses**: papéis card-title e data
**Requirement**: HARM-05, HARM-06, HARM-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/employeePages.test.ts` afirma os valores; `employeeHome.test.ts` (possuído) verde; `employeeSkeleton.test.ts` verde sem edição
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): Home do funcionário com números tabulares`

---

### T44: EmployeeHistoryPage — seção, inputs e vazio

**What**: `.filtersTitle`: `var(--fs-md)` → `var(--fs-base)` (margin `4px 0 0` fica). `.dateInput`, `.input`: `var(--fs-md)` → `var(--fs-base)`; `.dateInput` + `font-variant-numeric: tabular-nums`. `.empty`: `var(--fs-md)` → `var(--fs-base)`.
**Where**: `Frontend/src/pages/employee/EmployeeHistoryPage.module.css`
**Depends on**: T43
**Reuses**: papéis section-title, control, empty
**Requirement**: HARM-06, HARM-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/employeePages.test.ts` afirma os valores; `employeeHistory.test.ts` (possuído) verde; `employeeSkeleton.test.ts` verde sem edição
- [ ] Gate check passes: `yarn test` (último da lane)
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: full

**Commit**: `style(harmonia): Histórico do funcionário no sistema de papéis`

---

### T45: IncidentSheet — rótulo, input, botões, erro, focus duplicado

**What**: `.label`: `var(--fs-md)`/500 → `var(--fs-sm)`/600. `.input`: `var(--fs-sm)` → `var(--fs-base)`. Apagar `.input::placeholder`. `.button`, `.cancel`: `font-weight: 500` → `600`. `.error`: `var(--fs-xs)` → `var(--fs-sm)`; `var(--danger-solid)` → `var(--danger-text)`; adicionar `font-weight: 500`. Apagar o segundo `.button:focus-visible` (o de `outline … var(--text-h)`, ~`:111`), manter o de `var(--blue)`. `.icon`: `var(--black-text)` → `var(--text)`.
**Where**: `Frontend/src/components/employee/IncidentSheet.module.css`
**Depends on**: T1
**Reuses**: papéis field-label, control, button-touch, error
**Requirement**: HARM-03, HARM-05, HARM-06, HARM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `employeeIncident.test.ts` (possuído) atualizado: `--black-text` → `--text`, `--fs-md`/500 do rótulo → `--fs-sm`/600, `--fs-sm` do input → `--fs-base`; `harmony/employeeComponents.test.ts` (novo) afirma o restante
- [ ] `employeeSkeleton.test.ts` verde sem edição
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: igual ou maior

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): IncidentSheet no sistema de papéis`

---

### T46: MachineDetailSheet — inputs, números, botões, skeleton

**What**: `.dateInput`: `var(--fs-xs)` → `var(--fs-base)` + `tabular-nums`. `.infoValue`, `.itemMeta`: adicionar `tabular-nums`. `.chip`: `var(--fs-sm)` → `var(--fs-xs)` (badge, 500). `.footerButton`, `.cancel`: `font-weight: 600`. `.retryButton`: `var(--fs-xs)` → `var(--fs-sm)`. `.errorText`: `var(--danger-solid)` → `var(--danger-text)`, `font-weight: 500`. `.skeletonLine`: `animation: pulse 1.5s ease-in-out infinite` → `pulse 1.2s ease-in-out infinite`. `.empty` (12px) fica.
**Where**: `Frontend/src/components/employee/MachineDetailSheet.module.css`
**Depends on**: T45
**Reuses**: duração do `shimmer` (1.2s)
**Requirement**: HARM-06, HARM-07, HARM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/employeeComponents.test.ts` afirma os valores; `employeeMachines.test.ts` (possuído) verde
- [ ] Gate check passes: `yarn test src/test/styles`
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `style(harmonia): MachineDetailSheet com números tabulares e skeleton 1.2s`

---

### T47: MachineListCard — ação e data

**What**: `.action`: `font-weight: 400` (ou herdado) → `600`. `.dateTime`: adicionar `font-variant-numeric: tabular-nums`.
**Where**: `Frontend/src/components/employee/MachineListCard.module.css`
**Depends on**: T46
**Reuses**: papéis button e data
**Requirement**: HARM-06, HARM-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `harmony/employeeComponents.test.ts` afirma os valores; `cards/MachineListCard.test.ts` e `employeeSheet.test.ts` (possuídos) verdes; `employeeSkeleton.test.ts` verde sem edição
- [ ] Gate check passes: `yarn test` (último da lane)
- [ ] Test count: nenhum teste removido

**Tests**: unit
**Gate**: full

**Commit**: `style(harmonia): ação e data do MachineListCard`

---

### T48: Verificação final

**What**: Sem editar código. Rodar o gate Build e os greps de aceitação: `grep -rnE "font-weight:\s*(300|bold|normal)" src --include=*.css` vazio; `grep -rn "var(--ease-out," src --include=*.css` vazio; `grep -rn "cubic-bezier(0.23, 1, 0.32, 1)" src --include=*.css` só em `index.css`; `grep -rn "font-weight: 700" src --include=*.css` só nos 3 seletores data-display; `grep -rln "::placeholder" src --include=*.css` só `index.css`; `git diff --stat main...` sem arquivos fora de `design.md` §6. Inspeção visual (pt-BR e de) de Login, Frota, Dashboard, Equipe, Home do funcionário: nenhum bloco muda de posição. Registrar o resultado em `.specs/features/frontend-harmonia/validation.md`.
**Where**: `.specs/features/frontend-harmonia/validation.md`
**Depends on**: T5, T10, T17, T25, T32, T39, T44, T47
**Reuses**: gates da matriz
**Requirement**: HARM-05, HARM-17, HARM-19

**Tools**:

- MCP: NONE
- Skill: `impeccable` (detector), `tlc-spec-driven` (Verifier)

**Done when**:

- [ ] Gate check passes: `yarn build && yarn lint && yarn test && impeccable detect --json --scope type src`
- [ ] Test count: ≥ 1826 + todos os novos, nenhum removido
- [ ] Todos os greps acima conferem
- [ ] `validation.md` com veredito e evidência `arquivo:linha`

**Tests**: unit
**Gate**: build

---

## Phase Execution Map

```
Phase 1 -> Phase 2 (8 lanes em paralelo) -> Phase 3

Phase 1:  T1
Phase 2:  S1  T1 -> T2 -> T3 -> T4 -> T5 -> T48
          S2  T1 -> T6 -> T7 -> T8 -> T9 -> T10 -> T48
          S3  T1 -> T11 -> T12 -> T13 -> T14 -> T15 -> T16 -> T17 -> T48
          G1  T1 -> T18 -> T19 -> T20 -> T21 -> T22 -> T23 -> T24 -> T25 -> T48
          G2a T1 -> T26 -> T27 -> T28 -> T29 -> T30 -> T31 -> T32 -> T48
          G2b T1 -> T33 -> T34 -> T35 -> T36 -> T37 -> T38 -> T39 -> T48
          E1  T1 -> T40 -> T41 -> T42 -> T43 -> T44 -> T48
          E2  T1 -> T45 -> T46 -> T47 -> T48
Phase 3:  T48
```

Desvio consciente do modelo padrão do tlc (fases estritamente sequenciais): a Fase 2 roda 8 lanes em paralelo porque os arquivos são disjuntos (`design.md` §6), a pedido do brief (workers Gemini Flash). Cada lane é um worker; as lanes não dependem entre si, só de T1.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 arquivo (`index.css`), tokens + 4 regras coesas | ✅ Granular |
| T2–T47 | 1 arquivo cada (+ testes possuídos) | ✅ Granular |
| T48 | verificação, sem código | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | — | ✅ Match |
| T2, T6, T11, T18, T26, T33, T40, T45 | T1 (fase anterior) | início de lane | ✅ Match |
| T3–T5 | anterior da lane S1 | T2→T3→T4→T5 | ✅ Match |
| T7–T10 | anterior da lane S2 | T6→…→T10 | ✅ Match |
| T12–T17 | anterior da lane S3 | T11→…→T17 | ✅ Match |
| T19–T25 | anterior da lane G1 | T18→…→T25 | ✅ Match |
| T27–T32 | anterior da lane G2a | T26→…→T32 | ✅ Match |
| T34–T39 | anterior da lane G2b | T33→…→T39 | ✅ Match |
| T41–T44 | anterior da lane E1 | T40→…→T44 | ✅ Match |
| T46–T47 | anterior da lane E2 | T45→T46→T47 | ✅ Match |
| T48 | T5, T10, T17, T25, T32, T39, T44, T47 (fim de cada lane, fase anterior) | Phase 3 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Tokens globais | unit | unit | ✅ OK |
| T2, T4–T12, T14–T16, T18–T38 (CSS), T40, T41, T43–T47 | CSS Module | unit | unit | ✅ OK |
| T3, T13, T17, T39, T42 | Componente TSX | unit | unit | ✅ OK |
| T48 | Verificação final | unit (re-execução) | unit | ✅ OK |
