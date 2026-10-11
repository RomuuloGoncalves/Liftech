# Restyle conforme o Figma - Relatório de verificação

## Validation: figma-restyle - PASS

**Date**: 2026-10-10
**Spec**: `.specs/features/figma-restyle/spec.md`
**Diff range**: `dcc66bc^..HEAD` (HEAD = b21620a, 19 commits, 48 arquivos; esta iteração cobre `3b5ab57`, `4097a7c`, `b0d76b6`, `b21620a`)
**Verifier**: sub-agente independente (autor != verificador), iteração 2 de 3

**Result**: PASS (RST-01..RST-12 com asserção ancorada na spec; 34/34 mutantes mortos; gate com só as 3 falhas do baseline)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T10 | Done | Verificadas na iteração 1; sem regressão (suíte completa verde exceto baseline). |
| T11 | Done | `Frontend/src/test/styles/surfaces.test.ts` (fundo `.app-main`, superfícies brancas, botões primários) e `font.test.ts:22` (`--heading` com `system-ui`). `App.css` agora declara `background: var(--bg-page)` em `.app-main`. |
| T12 | Done | `FleetCard.tsx` mapeia `STATUS_HEADER` por status; `FleetCard.module.css` com as classes `.topRow.status*`. |

Spec: RST-12 adicionada e os 2 edge cases não verificáveis (responsividade 640-1279px e `custom` de cor clara) removidos com decisão registrada na tabela de assumptions (linha "Responsividade e categoria `custom` clara"). Nenhum critério ficou sem implementação.

---

## Spec-Anchored Acceptance Criteria

Legenda: "visual, coberto pelo orquestrador" = cor computada a 1440x900 conferida em navegador real (fundo `rgb(250,250,250)`, cards `rgb(255,255,255)`, badges, chips, cabeçalho de urgência); só é marcado quando um teste estático/de componente também cobre a declaração.

Caminhos relativos a `Frontend/src/test/`.

| ID / Critério | Resultado definido na spec | `file:line` + asserção | Resultado |
| ------------- | -------------------------- | ---------------------- | --------- |
| RST-01 AC1: 13 tokens do guide | valores da tabela de assumptions | `styles/tokens.test.ts:28` - `expect(token(name)).toBe(value)` (it.each de 13 valores) | PASS |
| RST-01 AC2: tokens extras | `--danger-solid #EF4444`, `--urgency-*`, `--line`, `--sidebar-line`, `--overlay`, `--bg-page` | `styles/tokens.test.ts:41` - `expect(token(name)).toBe(value)` | PASS |
| RST-02 AC3: Host Grotesk | `index.html` carrega a fonte; 1ª família de `--sans` e `--heading` | `styles/font.test.ts:11` `toContain('family=Host+Grotesk')`; `:16-17` `expect(firstFamily('sans')).toBe("'Host Grotesk'")` e `'heading'` | PASS |
| RST-03 AC4: sem hex fora de index.css/auth | lista vazia | `styles/no-hardcoded-colors.test.ts:26` - `expect(offenders).toEqual([])` | PASS |
| RST-03 AC5: sem rgb/rgba colorido fora de index.css | lista vazia | `styles/no-hardcoded-colors.test.ts:37` - `expect(offenders).toEqual([])` | PASS |
| RST-04 AC1: `body`, `.app-main`, Header em `rgb(250,250,250)` | `--bg-page` (=`--gray-bg` #FAFAFA) em cada um | body/:root: `styles/tokens.test.ts:48,54` `toContain('background:var(--bg-page);')`; `.app-main`: `styles/surfaces.test.ts:14` - `expect(block('App.css', '.app-main')).toContain('background: var(--bg-page);')` (declaração em `App.css:22`); Header: `styles/layout.test.ts:20` `toContain('background: var(--bg-page)')`; visual, coberto pelo orquestrador | PASS |
| RST-04 AC2: cards e seções em `rgb(255,255,255)` | `--bg`(=`--white`)/`--white` nos cards de máquina, funcionário, setor, acidente e seções de Frota/Equipe/Alertas | `styles/surfaces.test.ts:26` - `expect(block(file, selector)).toContain(\`background: ${token};\`)` para MachineCard `.card`, EmployeeCard `.card`, SectorCard `.card`, EquipePage `.section`, AlertasPage `.panel` (`var(--bg)`), FleetRow `.row`, FleetCard `.card` (`var(--white)`); `styles/tokens.test.ts:49` `expect(token('bg')).toBe('var(--white)')`; visual, coberto pelo orquestrador | PASS |
| RST-05 AC3: `h1`/títulos `rgb(24,24,24)`, corpo `rgb(76,76,76)` | `--text-h`=`--black-title`, `--text`=`--black-text` | `styles/tokens.test.ts:58-59` - `expect(token('text-h')).toBe('var(--black-title)')` e `expect(token('text')).toBe('var(--black-text)')`; valores `#181818`/`#4c4c4c` em `tokens.test.ts:28` | PASS |
| RST-05 AC4: divisor do Header `#E3E4E5`, borda da Sidebar `#EEEFF0` | `--line` / `--sidebar-line` | `styles/layout.test.ts:21` - `toContain('border-bottom: 1px solid var(--line)')`; `:40` - `toContain('border-right: 1px solid var(--sidebar-line)')`; valores em `tokens.test.ts:41` | PASS |
| RST-06 AC1: badge Disponível/Em uso/Manutenção | `green-bg/green`, `blue-bg/blue`, `yellow-bg/yellow` | `styles/machines.test.ts:23-24` - `toContain(\`background: var(--${bg})\`)` e `toContain(\`color: var(--${fg})\`)`; classe aplicada: `components/machines/MachineCard.test.tsx:77` - `expect(screen.getByText(label).className).toContain(cls)` (o arquivo tem 2 falhas de baseline em outros testes) | PASS |
| RST-06 AC3: pill do detalhe com as mesmas cores | idem | `styles/machines.test.ts:40-41`; classe: `components/machines/MachineDetailModal.test.tsx:244` - `toContain(cls)` | PASS |
| RST-07 AC2: chip por kind | `red/blue/yellow/green` `-bg` + texto e borda sólidos | `styles/fleet.test.ts:26-28` - `toContain(\`--chip-bg: var(--${color}-bg)\`)`, `--chip: var(--${color})`, `--chip-text: var(--${color})`; `:37` `toContain('border: 1px solid var(--chip)')`; classe: `components/fleet/FleetRow.test.tsx:179` - `expect(chip().className).toContain(kind)` | PASS |
| RST-07 AC4: `custom` mantém a cor do usuário | `--category-color` preservado | `styles/fleet.test.ts:32-33`; `components/fleet/FleetRow.test.tsx:187` - `getPropertyValue('--category-color')).toBe('#FF8800')` | PASS |
| RST-08 AC1: botões de exclusão/cancelar `--danger-solid` + texto branco | DialogButtons, Excluir categoria, Excluir Máquina, excluir Setor | `styles/common.test.ts:14` (`.cancel`); `styles/fleet.test.ts:44-45` (`.deleteButton` + `color: var(--white)`); `styles/machines.test.ts:48-49` (`.delete` + `.action` branco); `styles/team.test.ts:19-20` (`.delete` + ícone branco) | PASS |
| RST-08 AC2: botões primários `--blue` + texto branco | cadastrar, confirmar, editar, editar de Setor, avatar do Header | `styles/surfaces.test.ts:40-41` - `expect(css).toContain('background: var(--blue);')` e `'color: var(--white);'` para VisaoGeral `.registerButton`, Equipe `.registerButton`, Frota `.createButton` e `.addCategory`, FleetRow `.addButton`, NewMachinePanel `.submitButton`; `styles/common.test.ts:18` (`.confirm`); `styles/machines.test.ts:47` (`.edit`); `styles/team.test.ts:25-26` (`.edit` do Setor); `styles/layout.test.ts:27-28` (avatar) | PASS |
| RST-08 AC3: Setor com quadrados preenchidos e ícone branco | `--danger-solid` / `--blue`, 25px | `styles/team.test.ts:19,25` (fundos), `:20,26` `toMatch(/color:\s*var\(--white\)/)`, `:31-32` `width: 25px`/`height: 25px`; classes: `components/team/SectorCard.test.tsx:50-51` `toMatch(/delete/)`, `toMatch(/edit/)` | PASS |
| RST-09 AC4: overlay `rgba(245,245,245,0.55)` + caixa branca | `--overlay` em `.backdrop`; `.dialog` com `--bg` | `styles/common.test.ts:30` - `toMatch(/background:\s*var\(--overlay\)/)`; `:34` `.dialog` `var(--bg)`; valor em `styles/tokens.test.ts:41` | PASS |
| RST-10 AC1: cabeçalho de acidente pela urgência, texto branco | `danger`/`warning`/`caution` = `--urgency-critical/high/medium` | `styles/fleet.test.ts:58` - `toContain(\`background: var(--${token})\`)`; `:63-64` `color: var(--white)`; `components/fleet/FleetCard.test.tsx:179` - `expect(header().className).toContain(tone)` | PASS |
| RST-10 AC2: rótulo na cor do cabeçalho | `.highlight .tone` com o mesmo token | `styles/fleet.test.ts:59` - `toContain(\`color: var(--${token})\`)`; `components/fleet/FleetCard.test.tsx:180` - `expect(value().className).toContain(tone)` | PASS |
| RST-10 AC3: sem urgência usa `--urgency-critical` | classe `danger` | `components/fleet/FleetCard.test.tsx:185-186` - `toContain('danger')` (cabeçalho e rótulo) | PASS |
| RST-10 AC4: dados, ordenação, busca e filtros inalterados | sem alteração | Sem teste novo; `git diff dcc66bc^..HEAD` não toca `data/` nem `pages/*.tsx`; suítes `FrotaPage`/`AlertasPage` pré-existentes verdes no gate | PASS (por regressão) |
| RST-11 AC1: sem caixa de ícone | nenhum `[class*="icon"]`/avatar/svg decorativo | `components/fleet/FleetCard.test.tsx:237` - `querySelector('[class*="icon"]')).toBeNull()`; `styles/fleet.test.ts:68` `not.toMatch(/\.icon\s*\{/)`; `components/team/SectorCard.test.tsx:38-39` `querySelector('svg')).toBeNull()`, `children).toHaveLength(1)`; `components/team/EmployeeCard.test.tsx:89`; `styles/team.test.ts:44-45` | PASS |
| RST-11 AC2: nome, código, abrir e ⋮ funcionando | handlers chamados | `components/fleet/FleetCard.test.tsx:245` - `expect(onOpen).toHaveBeenCalledWith(machine)`; `:252` - `expect(onRemove).toHaveBeenCalledWith('4')`; `components/team/EmployeeCard.test.tsx:100` toggle | PASS |
| RST-12 AC1: cabeçalho fora de Acidentes na cor do status | Disponível `--green`, Em uso `--blue`, Manutenção `--yellow`, Offline `--black-text` | CSS: `styles/fleet.test.ts:90` - `expect(rule(css, \`.topRow.${cls}\`)).toContain(\`background: var(${token})\`)` (4 casos); classe: `components/fleet/FleetCard.test.tsx:211` - `expect(header().className).toContain(cls)` (4 status); mapeamento em `FleetCard.tsx:40-45` | PASS |
| RST-12 AC2: texto branco, exceto Manutenção em `--black-title` | `--white` / `--black-title` | `styles/fleet.test.ts:95` - `toContain('color: var(--white)')` (Disponível, Em uso, Offline); `:96` - `rule(css, '.topRow.statusMaintenance :is(.nome, .code, .menuButton)')).toContain('color: var(--black-title)')`; forma do cabeçalho: `:101-102` `margin: calc(-12 * ...)`/`padding: calc(12 * ...)` | PASS |
| RST-12 AC3: mudar de categoria mantém a cor do status | sem herdar a cor da coluna | `components/fleet/FleetCard.test.tsx:218-220` - `expect(header().className).toContain('statusInUse')` e `not.toContain(other)` para `ativas`, `manutencao`, `disponiveis`, `custom` | PASS |
| RST-12 AC4: Acidentes mantém a urgência | classe de urgência, sem classe de status | `components/fleet/FleetCard.test.tsx:227-228` - `toContain('warning')` e `not.toContain('statusAvailable')`; `:179` (RST-10) | PASS |

### Edge cases

| Caso | Evidência | Resultado |
| ---- | --------- | --------- |
| Google Fonts falha, cai em `system-ui` | `styles/font.test.ts:21-22` - `toMatch(/--sans:[^;]*system-ui/)` e `toMatch(/--heading:[^;]*system-ui/)`; mutante R5 morto | PASS |

Os dois edge cases de iterações anteriores (640-1279px e `custom` de cor clara) saíram da spec com decisão registrada (assumptions, linha "Responsividade e categoria `custom` clara"); não são mais critérios, logo não há lacuna de cobertura.

### Teste renomeado em `FleetCard.test.tsx:189`

O título "does not fill the %s header" virou "uses no urgency or column tone on the %s header" em `b0d76b6`. As asserções (`FleetCard.test.tsx:192`, `not.toContain` de `danger`, `warning`, `caution`, `info`, `success`) estão byte a byte iguais (`git diff 4097a7c b0d76b6`). O título antigo ficou falso quando o cabeçalho passou a ser preenchido pelo status (RST-12); o novo descreve o que o teste de fato afirma. Esclarecimento legítimo, não enfraquecimento: a presença positiva da classe de status passou a ser afirmada em `:211` e `:218-220`.

**Status**: todos os 12 requisitos cobertos com asserção igual ao resultado da spec; 1 lacuna de precisão residual (ver "Lacunas de precisão da spec").

---

## Discrimination Sensor

Escopo isolado: `git worktree` em `/tmp/claude-1000/.../scratchpad/verifier-wt2` (HEAD b21620a), `Frontend/node_modules` por symlink, cada mutante aplicado e revertido só no worktree. Cada mutante rodou a suíte completa (`npx vitest run --maxWorkers=4`, 629 testes). Baseline do worktree: 629 testes, 3 falhas pré-existentes (`MachineCard.test.tsx` x2, `VisaoGeralPage.test.tsx` x1). "Morto" = surgiu falha de teste além das 3 do baseline.

### Rodada A - sobreviventes da iteração 1 reexecutados

| # | Mutante (arquivo) | Testes que falharam além do baseline | Resultado |
| - | ----------------- | ------------------------------------ | --------- |
| R1 (M12) | `EquipePage.module.css` `.section` bg -> `--bg-page` | `styles/surfaces.test.ts` (superfície `.section`) | Killed |
| R2 (M13) | `MachineCard.module.css` `.card` bg -> `--bg-page` | `styles/surfaces.test.ts` | Killed |
| R3 (M16b) | `App.css` `.app-main` bg -> `var(--bg)` (branco via token) | `styles/surfaces.test.ts:14` | Killed |
| R3b | `App.css` `.app-main` sem `background` | `styles/surfaces.test.ts:14` | Killed |
| R4 (M23) | `EquipePage.module.css` `.registerButton` bg -> `--red` | `styles/surfaces.test.ts` | Killed |
| R5 | `index.css` `--heading` perde `system-ui` | `styles/font.test.ts:22` | Killed |

M21 (media query 640-1279px) não é reexecutável: o edge case saiu da spec; não há comportamento especificado a mutar.

### Rodada B - 28 mutantes novos (foco em RST-12 e demais ACs)

| # | Mutante (arquivo) | Testes que falharam além do baseline | Resultado |
| - | ----------------- | ------------------------------------ | --------- |
| N1 | `FleetCard.module.css` troca fundos Disponível (verde) e Em uso (azul) | `styles/fleet.test.ts` (2) | Killed |
| N2 | `FleetCard.module.css` texto de Manutenção branco em vez de `--black-title` | `styles/fleet.test.ts` | Killed |
| N3 | `FleetCard.tsx` cabeçalho ignora o status e usa o tom da coluna | `components/fleet/FleetCard.test.tsx` (10) | Killed |
| N4 | `FleetCard.tsx` Acidentes passa a usar a classe de status no lugar da urgência | `components/fleet/FleetCard.test.tsx` (5) | Killed |
| N5 | `FleetCard.tsx` Offline mapeado para `statusAvailable` (verde) | `components/fleet/FleetCard.test.tsx` | Killed |
| N6 | `FleetCard.module.css` remove a regra de texto escuro de Manutenção | `styles/fleet.test.ts` | Killed |
| N7 | `FleetCard.module.css` `.statusOffline` bg -> `--blue` | `styles/fleet.test.ts` | Killed |
| N8 | `FleetCard.module.css` remove a sangria (`margin`) do cabeçalho de status | `styles/fleet.test.ts:101` | Killed |
| N9 | `FleetCard.tsx` Manutenção mapeado para `statusInUse` | `components/fleet/FleetCard.test.tsx` | Killed |
| N10 | `FleetCard.module.css` texto de Disponível/Em uso/Offline -> `--black-text` | `styles/fleet.test.ts` | Killed |
| N11 | `FleetCard.tsx` Em uso mapeado para `statusAvailable` | `components/fleet/FleetCard.test.tsx` (5) | Killed |
| N12 | `FleetCard.module.css` `.topRow.caution` bg -> `--urgency-high` | `styles/fleet.test.ts` | Killed |
| N13 | `FleetCard.module.css` texto do cabeçalho de acidente -> `--black-title` | `styles/fleet.test.ts` | Killed |
| N14 | `SectorCard.module.css` `.card` bg -> `--bg-page` | `styles/surfaces.test.ts` | Killed |
| N15 | `AlertasPage.module.css` `.panel` bg -> `--bg-page` | `styles/surfaces.test.ts` | Killed |
| N16 | `FleetRow.module.css` `.row` bg -> `--bg-page` | `styles/surfaces.test.ts` | Killed |
| N17 | `FleetCard.module.css` `.card` bg -> `--bg-page` | `styles/surfaces.test.ts` | Killed |
| N18 | `FrotaPage.module.css` `.createButton` bg -> `--red` | `styles/surfaces.test.ts` | Killed |
| N19 | `NewMachinePanel.module.css` `.submitButton` bg -> `--active-bg` | `styles/surfaces.test.ts` | Killed |
| N20 | `FleetRow.module.css` `.addButton` bg -> `--red` | `styles/surfaces.test.ts` | Killed |
| N21 | `VisaoGeralPage.module.css` `.registerButton` bg -> `--active-bg` | `styles/surfaces.test.ts` | Killed |
| N22 | `FrotaPage.module.css` `.addCategory` bg -> `--red` | `styles/surfaces.test.ts` | Killed |
| N23 | `EmployeeCard.module.css` `.card` bg -> `--bg-page` | `styles/surfaces.test.ts` | Killed |
| N24 | `Header.module.css` `.header` bg -> `--bg` | `styles/layout.test.ts` | Killed |
| N25 | `FleetCard.tsx` Disponível mapeado para `statusInUse` | `components/fleet/FleetCard.test.tsx` | Killed |
| N26 | `FleetCard.module.css` `.statusMaintenance` bg -> `--green` | `styles/fleet.test.ts` | Killed |
| N27 | `FleetCard.tsx` acidente sem urgência cai em `warning` em vez de `danger` | `components/fleet/FleetCard.test.tsx` | Killed |
| N28 | `FleetCard.module.css` zera o `padding` do cabeçalho de status | `styles/fleet.test.ts:102` | Killed |

**Sensor depth**: lightweight expandido (34 mutações; 5 reexecuções dos sobreviventes + 1 variante, 28 novas)
**Resultado**: 34/34 mortos (100%), 0 sobreviventes. Nenhum morto "por acidente": cada falha caiu no teste que cobre a declaração mutada.
**Isolamento**: `git worktree remove --force` + `git worktree prune`; `git worktree list` mostra só a árvore real; `git status --porcelain` da árvore real idêntico ao baseline registrado antes do sensor (`M .specs/LESSONS.md`, `M .specs/lessons.json`, `?? .specs/features/figma-restyle/validation.md`).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | OK (`STATUS_HEADER` é um `Record` único; CSS do cabeçalho de status reaproveita o formato do de urgência) |
| Surgical changes | OK (iteração 2 toca só `App.css`, `FleetCard.*`, `FleetRow.module.css`, `NewMachinePanel.module.css`, `FrotaPage`/`VisaoGeralPage.module.css`, `index.css` e testes) |
| No scope creep | OK |
| Matches patterns | OK (teste estático de CSS no padrão de `tokens.test.ts`) |
| Sem comentários de código novos | OK (`git diff dcc66bc^..HEAD` não adiciona `//` nem `/* */` fora de regexes que removem comentários; `b21620a` removeu os do restyle) |
| Spec-anchored outcome check | OK (tabela acima) |
| Every test maps to a spec requirement | OK |
| Documented guidelines followed | `docs/frontend.md` (testes espelham `src/`), `CLAUDE.md` do projeto (nenhum commit feito pelo Verifier) |

---

## Gate Check

- **Gate command**: `cd Frontend && npx vitest run --maxWorkers=4` e `npm run lint` (build não reexecutado para não escrever `dist/` na árvore real)
- **Result**: 626 passed, 3 failed, 0 skipped (46 arquivos); lint sem erros
- **Test count before feature**: 479 (baseline do tasks.md)
- **Test count after feature**: 629
- **Delta**: +150 testes
- **Failures**: só as 3 do baseline (`MachineCard.test.tsx` x2, `VisaoGeralPage.test.tsx` x1, esperam "34 min"; o app renderiza "34 minutos"), anteriores à feature
- **Testes removidos / asserções enfraquecidas**: nenhum (um título renomeado com asserções idênticas, avaliado acima)

---

## Lacunas de precisão da spec (não bloqueantes)

1. RST-06 AC1 / assumptions: Offline = "cinza atual", sem token nomeado. `styles/machines.test.ts:28-31` afirma `--gray-bg`, `--black-text` e `--gray-border` copiando a implementação; a spec não define o resultado. Registrado como L-006.
2. Success Criteria #1 (script Chrome headless a 1440x900) não existe como artefato no repositório (`getComputedStyle` não aparece em nenhum arquivo do projeto). A confirmação das cores computadas é manual, feita pelo orquestrador; a regressão das declarações está guardada pelos testes estáticos acima. Se o dono quiser a guarda computada permanente, vira task nova.
3. Build (`npm run build`) não reexecutado por este Verifier; o orquestrador deve incluí-lo no fechamento.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| RST-01, RST-02, RST-03 | Verified | Verified |
| RST-04 | Needs Fix | Verified |
| RST-05, RST-06, RST-07, RST-09, RST-10, RST-11 | Verified | Verified |
| RST-08 | Verified com gap | Verified |
| RST-12 | Pending | Verified |

---

## Summary

**Overall**: Ready (PASS)

**Spec-anchored check**: 12/12 requisitos (27 critérios) com asserção igual ao resultado da spec; 1 lacuna de precisão não bloqueante (Offline "cinza atual")
**Sensor**: 34/34 mutantes mortos (5 sobreviventes da iteração 1 agora mortos + 1 variante + 28 novos)
**Gate**: 626 passed, 3 failed (todas do baseline), lint limpo

**What works**: tokens, fonte com fallback nos dois tokens, ausência de cor solta, fundo da página (`body`, `.app-main`, Header), superfícies brancas de todos os cards e seções, botões primários e de perigo, status e chips, cabeçalho de urgência, cabeçalho por status da máquina (RST-12) e ausência de caixas de ícone.

**Next steps**: rodar `npm run build` no fechamento; o dono revisa e commita (regra do projeto).
