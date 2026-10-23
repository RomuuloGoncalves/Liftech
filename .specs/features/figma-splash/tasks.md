# Splash Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/figma-splash/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase (`Frontend/package.json`, `Frontend/src/test/`): Vitest + Testing Library, testes espelham `src/` em `src/test/`. Node 25: `export PATH=$HOME/.nvm/versions/node/v25.9.0/bin:$PATH`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Componente (`components/common/SplashGate.tsx`) | unit (Testing Library + fake timers) | Um teste por SPL-01..07 + desmontagem antes do fim | `Frontend/src/test/components/common/SplashGate.test.tsx` | `cd Frontend && yarn vitest run src/test/components/common/SplashGate.test.tsx` |
| CSS (`SplashGate.module.css`, token em `index.css`) | unit (CSS como texto) | Gradiente via token, tela cheia, logo branca | `Frontend/src/test/styles/splash.test.ts` | `cd Frontend && yarn vitest run src/test/styles` |
| Shell (`App.tsx`) | integration (existente) | `App.test.tsx` segue verde sem mudança (splash desligada em teste) | `Frontend/src/test/App.test.tsx` | `cd Frontend && yarn vitest run src/test/App.test.tsx` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após T1 e T2 | `cd Frontend && yarn vitest run <arquivo-de-teste da task>` |
| Full | Após T3 | `cd Frontend && yarn test` |
| Build | Fim da feature | `cd Frontend && yarn lint && yarn build && yarn test` |

---

## Execution Plan

### Phase 1: Splash

```
T1 → T2 → T3
```

---

## Task Breakdown

### T1: Token do gradiente e CSS da splash

**What**: Adicionar `--gradient-brand` em `index.css` e criar `SplashGate.module.css` (`.splash` fixa em tela cheia com o gradiente, coluna centralizada, `gap: 36px`; `.mark` 128 px e `.name` 192 px de largura, ambos com `filter: brightness(0) invert(1)`).
**Where**: `Frontend/src/index.css`, `Frontend/src/components/common/SplashGate.module.css`, `Frontend/src/test/styles/splash.test.ts`
**Depends on**: None
**Reuses**: valores de `components/auth/AuthLayout.module.css:111`; padrão de leitura de CSS de `test/styles/*.test.ts`
**Requirement**: SPL-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `index.css` declara `--gradient-brand: linear-gradient(180deg, #41b0ff 20%, #4652ef 100%)`
- [ ] `.splash` usa `var(--gradient-brand)`, `position: fixed` e `inset: 0`; `.mark`/`.name` têm o filtro branco
- [ ] `no-hardcoded-colors.test.ts` segue verde (nenhum hex no CSS novo)
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/styles`

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T2: Componente `SplashGate`

**What**: Criar `SplashGate` com `SPLASH_MS` (0 em teste, 1500 fora), `shouldShowSplash(pathname, durationMs)` e a splash (`role="img"`, `aria-label="Liftech"`, `logo.svg` + `logo-name.svg` com `alt=""`), conforme o design.
**Where**: `Frontend/src/components/common/SplashGate.tsx`, `Frontend/src/test/components/common/SplashGate.test.tsx`
**Depends on**: T1
**Reuses**: imports de logo de `components/auth/AuthLayout.tsx:5-6`; padrão `MOCK_LATENCY_MS` de `hooks/useFirstVisitLoading.ts`; regra de rota do funcionário de `App.tsx`
**Requirement**: SPL-01, SPL-02, SPL-03, SPL-04, SPL-05, SPL-06, SPL-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] SPL-01: em `/login`, `durationMs=1500`: splash visível e conteúdo ausente; após `advanceTimersByTime(1500)` o conteúdo aparece e a splash some; em 1499 ms ainda é splash
- [ ] SPL-02: com `sessionStorage['liftech.splashSeen']='1'`, conteúdo aparece direto, sem splash
- [ ] SPL-03: com `matchMedia` stubado `matches: true` para `(prefers-reduced-motion: reduce)`, sem splash e sem marca gravada
- [ ] SPL-04: em `/funcionario` e `/funcionario/maquinas`, sem splash e sem marca gravada
- [ ] SPL-05: enquanto visível, `getByRole('img', { name: 'Liftech' })` existe e o filho não está no DOM
- [ ] SPL-06: com `sessionStorage.getItem`/`setItem` lançando erro, a splash aparece e some após 1500 ms sem erro
- [ ] SPL-07: ao exibir, `sessionStorage['liftech.splashSeen']` vale `'1'`; um segundo render na mesma "aba" não mostra splash
- [ ] Edge: desmontar antes de 1500 ms não gera aviso de atualização após desmontar (timer limpo)
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/common/SplashGate.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T3: Ligar a splash no `App`

**What**: Em `App.tsx`, envolver `<AppShell />` com `<SplashGate durationMs={SPLASH_MS}>` dentro do `ActiveBranchProvider`, sem tocar no resto do arquivo.
**Where**: `Frontend/src/App.tsx`
**Depends on**: T2
**Reuses**: `SplashGate` de T2
**Requirement**: SPL-01, SPL-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `App.test.tsx` passa sem alteração
- [ ] `yarn lint && yarn build && yarn test` passam, sem teste removido; bundle de entrada ≤ 100 kB gzip
- [ ] No navegador do Orca, 1440 × 900, aba nova em `/login`: splash igual ao PNG `figma-telas/admin/01-autenticacao/01-splash.png` por ~1,5 s e depois o login; recarregar não mostra; `/funcionario` em aba nova não mostra
- [ ] Gate passes: `cd Frontend && yarn lint && yarn build && yarn test`

**Tests**: integration
**Gate**: build
**Commit**: sem commit (decisão do dono)
