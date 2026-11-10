# Frontend Harmonia Specification

## Problem Statement

O frontend Liftech (React 19 + CSS Modules, 7 idiomas) já tem uma escala de fonte única (`--fs-*`, 94,6% de adesão), mas o mesmo papel visual aparece com tamanhos, pesos, cores e ritmos diferentes entre telas: título de página em 500, 600 e 700; botão em 11 a 14px com pesos de 400 a 700; erro em dois vermelhos e dois tamanhos; placeholders em três cores; transições em 0.1s/120ms/150ms/0.2s com três easings. Vários textos ficam abaixo de AA (`--text-muted` 2,26:1, azul 2,85:1, amarelo 1,52:1) e o título da auth vaza em fr/de/ru. Quatro auditorias somente leitura (A shell, B gestor, C funcionário, D inventário; relatórios brutos removidos após a consolidação) somaram 122 achados, que viraram **64 achados consolidados** (seção Consolidação). Esta feature harmoniza tipografia, espaçamento interno e movimento **sem mudar layout**.

## Goals

- [ ] Todo papel tipográfico da tabela de papéis (`design.md` §2) usa um único conjunto tamanho/peso/line-height/cor nos arquivos tocados.
- [ ] Nenhum texto dos papéis label/meta/erro/link/status fica abaixo de 4,5:1 sobre branco, exceto os itens com decisão de marca pendente (Q1).
- [ ] Zero `font-weight: 300 | bold | normal` e zero `var(--ease-out, …)` com fallback no `src` (o token passa a existir).
- [ ] `yarn build`, `yarn lint` e `yarn test` (hoje 129 arquivos / 1826 testes) passam ao fim, e os testes de paridade de skeleton (`pageSkeleton.test.ts`, `employeeSkeleton.test.ts`) passam sem edição.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Mudar estrutura, posição, grid, ordem ou componentes | Restrição do usuário: só harmonizar |
| Padding de página entre telas (L-B-01, L-EMP-03, L-EMP-04) | Move o conteúdo de posição; precisa de decisão (Q6) |
| Remover `--px` do `font-size` em Frota/Alertas (T-B-01, T-B-02, D-INV-07) | O board inteiro escala com a largura por desenho (Figma 1121px) e os skeletons replicam essas medidas; conflito aberto (Q4) |
| Raios (`border-radius`), alturas de controle, sombra 3D dos botões de sessão (L-EMP-01/02/05, L-B-04) | Fora da lista do usuário (tamanho, peso, lh, tracking, cor de texto, espaço interno, duração/easing) |
| Encaixe em massa de 6/10/14px na grade de 4 (D-INV-13, L-B-03) | Ajuste sem ganho de harmonia por papel e com risco de deslocar caixas; só valores do mesmo papel são alinhados |
| Espaçamentos da auth medidos do Figma (T-A-31) | Exceção documentada (AD-007) |
| Durações do shell do funcionário (TabBar, EmployeeLayout) | Testes `employeeMotion.test.ts` fixam `opacity 150ms ease` e `transform 200ms`; família própria de gestos mobile |
| Trocar `--blue` de fundo (botões, nav ativo) | Decisão de marca (Q1) |
| Dark mode | AD-003 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Q1: texto branco sobre `--blue` (2,85:1) nos botões primários e nav ativo | Manter `--blue` como fundo; criar só `--blue-text: #1f78d1` para texto azul | Escurecer o fundo muda a identidade; texto azul pequeno é o risco maior | n |
| Q2: abas da auth truncam em de/fr ("Als Administrator anmelden") | Peso 600 + atributo `title`; não mexer nas traduções | Copy é decisão do usuário | n |
| Q3: `Modal .body` 28/30px fora da grade (A T-A-28 vs D-INV-14 24/32) | Manter 28/30; só rodapé 15→16 e gap 10→8 | Mudar o body altera a largura útil de todos os modais e quebra o divisor `TeamForm .divider` (-30px) | n |
| Q4: fonte escalada por `--px` em Frota/Alertas (B quer `--fs-*` fixo; D diz "valor idêntico") | Manter a escala; só o contador do chip passa a escalar junto | Acima de 1440px o valor **não** é idêntico; o skeleton (`pageSkeleton.test.ts:46-50`) espelha as alturas em `--px` | n |
| Q5: tamanho do input no app mobile (C: 13 ou 14; iOS dá zoom < 16px) | `--fs-base` (14px) em todos os inputs do funcionário | Une os 4 tamanhos atuais sem saltar para 16 (mudança visual grande); 16px fica para decisão | n |
| Q6: padding de página diferente por tela (gestor 16/24/32; funcionário 0/16) | Não alterar | Desloca o conteúdo 8 a 16px (posição) | n |
| Q7: ênfase do rótulo no `InfoField` (D-INV-12 rebaixa para 11/500/label; A e B mantêm) | Manter 13/600 `--text-h` | Medidas casadas com skeletons e Figma; mudar altera a altura dos cards | n |
| Q8: título de painel da Equipe em azul 18/500 | `--fs-lg`/600/`--text-h`, igual ao Dashboard | Um papel só; o azul 2,85:1 falha AA | n |
| Q9: tokens `--fs-display 48` e `--fs-hero 64` (C, D) | Não criar; 48px (timer) e 64px (404) ficam como exceções documentadas | Um uso cada; `employeeSession.test.ts` fixa `font-size: 48px;` | y |
| Q10: peso 700 | Só no papel data-display (KPI, timer, destaque do InfoField); o resto vira 600 | Mantém o carregamento 400–700 e os testes de KPI | y |
| Q11: cor do placeholder (C: `--text-muted`; A/B: `--text-label`) | `--text-label` via regra global `::placeholder` | `--text-muted` falha contraste; com o alias (Q12) os dois ficam iguais de qualquer forma | y |
| Q12: `--text-muted` (10 usos de texto, 2,26:1) | Alias `--text-muted: var(--text-label)` em `index.css` | 1 linha corrige todos os usos | y |
| Q13: tokens de motion (C: 150/200/220 e `--ease-out-smooth`; D: 120/200; A/B: 120/180/220 e `--ease-out`) | `--ease-out`, `--dur-fast 120ms`, `--dur-base 180ms`, `--dur-slow 220ms` | `--ease-out` já é referenciado em 7 arquivos; 120ms é a duração mais usada (21×); 180ms já é a de toda entrada de overlay | y |
| Q14: peso do badge (A 600, B 500) | 500 | É o valor do `StatusBadge`, usado na maioria dos badges | y |
| Q15: tracking de título (D: remover resets e herdar 0.18px; A/B: título 0) | `h1, h2, h3 { letter-spacing: 0 }`; display `-0.01em` | Tracking positivo afrouxa texto ≥ 18px | y |
| Q16: regra de controles (D: `font: inherit` completo) | Só `font-family` e `letter-spacing: inherit` | `line-height`/`font-size` herdados mudam a altura dos botões (layout) | y |
| Q17: line-height de h1 (B 1.2; A 1.25) | 1.25 | Já é o valor do `Header .title` | y |
| Q18: estado vazio em sheet/modal (C 14; B 12) | Página 14; dentro de painel/modal/sheet 12 | Papel depende do contêiner; segue a regra de B | y |
| Q19: animação de largura da Sidebar (D: trocar por transform) | Manter `width`; só unificar duração em `--dur-slow` | Transform mudaria como o conteúdo ocupa o espaço (layout) | y |
| Q20: listra lateral do Toast (detector `side-tab`) | Manter | É o código de status do toast; não é tipografia | y |
| Gate de testes exige Node ≥ 20.19 (`package.json` engines); a máquina tem 20.18.1 no PATH | Rodar os gates com Node 22.22.2 (`$HOME/.nvm/versions/node/v22.22.2/bin`) | Com 20.18.1 os 129 arquivos falham por `require()` de ESM, antes de qualquer mudança | y |

**Open questions:** none - all resolved or logged above (Q1–Q8 aguardam confirmação do usuário com default escolhido; os defaults não mudam layout).

---

## User Stories

### P1: Tipografia por papel ⭐ MVP

**User Story**: Como gestor ou operador, quero que o mesmo tipo de informação (título, rótulo, botão, erro, número) tenha a mesma aparência em todas as telas, para ler a interface sem reaprender a hierarquia.

**Why P1**: Prioridade 1 do brief; maior volume de achados (37 de 64).

**Acceptance Criteria**:

1. The `index.css` SHALL declare `--blue-text: #1f78d1`, `--danger-text: var(--urgency-critical)`, `--yellow-text: #726800`, `--tracking-display: -0.01em`, and `--text-muted: var(--text-label)` in `:root`.  <!-- ubiquitous -->
2. The `index.css` SHALL NOT contain the selector `*` with `font-family`, and SHALL declare `button, input, select, textarea { font-family: inherit; letter-spacing: inherit; }`.  <!-- ubiquitous -->
3. The `index.css` SHALL declare `::placeholder { color: var(--text-label); opacity: 1; }` and no component CSS module in `src` SHALL declare a `::placeholder` color.  <!-- ubiquitous -->
4. The `index.css` SHALL set `h1, h2, h3` to `letter-spacing: 0`, `line-height: 1.25` and `text-wrap: balance`, and `p` to `text-wrap: pretty`.  <!-- ubiquitous -->
5. The CSS in `src` SHALL NOT contain `font-weight: 300`, `font-weight: bold` or `font-weight: normal`, and `font-weight: 700` SHALL appear only in data-display selectors (`DashboardPage .cardNumber`, `EmployeeSessionPage .timer`, `InfoField .highlight .label`).  <!-- ubiquitous -->
6. WHEN a selector listed in `design.md` §2 under a role is rendered THEN it SHALL use exactly that role's `font-size` token and `font-weight`.  <!-- event-driven -->
7. The text selectors that render numbers listed in `design.md` §2 (data/number role) SHALL declare `font-variant-numeric: tabular-nums`.  <!-- ubiquitous -->
8. The auth CSS modules SHALL NOT declare hex text colors, and the files touched by this feature SHALL NOT reference `--black-title` or `--black-text`.  <!-- ubiquitous -->
9. WHEN the auth title is rendered in fr, de or ru inside the 374px column THEN it SHALL wrap (`white-space: normal`) instead of overflowing.  <!-- event-driven -->
10. WHEN an auth tab label is truncated with ellipsis THEN the tab link SHALL expose the full text in its `title` attribute.  <!-- event-driven -->
11. IF a text uses the blue, red or yellow hue on a white or tinted background at 11–14px THEN it SHALL use `--blue-text`, `--danger-text` or `--yellow-text` (≥ 4,5:1).  <!-- unwanted-behavior -->

**Independent Test**: `yarn test src/test/styles` passa com os testes novos em `src/test/styles/harmony/*.test.ts`; `grep -rE "font-weight:\s*(300|bold|normal)" src --include=*.css` retorna vazio.

---

### P2: Ritmo de espaçamento interno

**User Story**: Como usuário, quero que componentes do mesmo tipo tenham o mesmo respiro interno, para a interface parecer uma só.

**Why P2**: Prioridade 2 do brief; restrito a espaço interno para não mexer em layout.

**Acceptance Criteria**:

1. The `Modal .footer` SHALL use `padding: 16px 30px` and `Modal .titleGroup` SHALL use `gap: 8px`.  <!-- ubiquitous -->
2. The compact button shell in `DialogButtons` SHALL use `padding: 8px 16px`.  <!-- ubiquitous -->
3. The list-option selectors (`Select .option`, `BranchSelector .option`, `Header .languageOption`) SHALL share `padding: 8px 10px` and `font-size: var(--fs-md)`.  <!-- ubiquitous -->
4. The white panel shell in `AlertasPage .panel` and `EquipePage` SHALL use `padding: 24px`, `border: 1px solid var(--line)` and `border-radius: var(--radius-lg)`, matching `MachineTable`.  <!-- ubiquitous -->
5. The `Card .cardLg` SHALL use `var(--card-gap-lg)` and `var(--card-pad-lg)`.  <!-- ubiquitous -->
6. IF a spacing change would alter a value asserted by `pageSkeleton.test.ts` or `employeeSkeleton.test.ts` THEN the task SHALL stop and report instead of editing those tests.  <!-- unwanted-behavior -->

**Independent Test**: testes de `harmony/*.test.ts` validam os valores; os dois testes de skeleton passam sem edição.

---

### P3: Movimento com tokens

**User Story**: Como usuário, quero que hover, abertura de popover/modal/toast e gaveta respondam no mesmo tempo e curva.

**Why P3**: Prioridade 3 do brief.

**Acceptance Criteria**:

1. The `index.css` SHALL declare `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--dur-fast: 120ms`, `--dur-base: 180ms` and `--dur-slow: 220ms`.  <!-- ubiquitous -->
2. The CSS files touched by this feature SHALL NOT contain `var(--ease-out,` (fallback form) nor the literal `cubic-bezier(0.23, 1, 0.32, 1)` outside `index.css`.  <!-- ubiquitous -->
3. WHEN a hover, press or color transition runs in a touched file THEN it SHALL use `var(--dur-fast) var(--ease-out)`.  <!-- event-driven -->
4. WHEN a popover, dialog, toast or backdrop enters THEN it SHALL animate for `var(--dur-base)` with `var(--ease-out)`.  <!-- event-driven -->
5. WHEN the CategoryFormModal color popover opens THEN it SHALL animate only vertically (no `translateX` change during the keyframe).  <!-- event-driven -->
6. WHILE `prefers-reduced-motion: reduce` matches the employee session page SHALL keep the video at opacity 1 without running the fade loop.  <!-- state-driven -->

**Independent Test**: `grep -rn "var(--ease-out," Frontend/src --include=*.css` vazio; teste unitário do loop de vídeo com `matchMedia` mockado.

---

## Edge Cases

- IF uma tradução longa (de/ru) passa da largura de um título THEN o título SHALL quebrar com `text-wrap: balance` em vez de cortar.
- IF o navegador não suporta `text-wrap` THEN o texto SHALL quebrar como hoje (propriedade progressiva, sem fallback).
- WHEN a largura da área de Frota passa de 1440px THEN fonte e skeleton SHALL continuar escalando juntos (Q4).
- IF um teste existente fixa o valor antigo de um arquivo que a tarefa possui THEN a tarefa SHALL atualizar a asserção para o valor novo e manter a contagem de testes.

---

## Consolidação dos achados (64)

Achados das 4 auditorias deduplicados em IDs `H-NN`. Severidade = a maior entre as fontes. Destino: tarefa (`design.md` §6 mapeia arquivo → tarefa), **adiado** (Q) ou **rejeitado**.

| Severidade | typeset | layout | animate | Total |
|---|---|---|---|---|
| alta | 16 | 1 | 2 | 19 |
| média | 17 | 2 | 5 | 24 |
| baixa | 4 | 10 | 7 | 21 |
| **Total** | **37** | **13** | **14** | **64** |

Entrada bruta: A 34, B 40, C 23, D 25 = 122. Com tarefa: 53. Sem tarefa: 11 (H04, H28, H29, H41, H42, H44, H45, H46, H47, H49, H55).

| H | Sev | Cat | Achado | Fontes | Destino |
|---|---|---|---|---|---|
| H01 | alta | typeset | hack `* { font-family }` | A05, D06 | T1 |
| H02 | alta | typeset | placeholder em 3 cores, 11px/300 na auth | A02, B15, C09, D01 | T1 + remoções locais |
| H03 | alta | typeset | `--blue` como texto (2,85:1) | A03, B nota, D08 | T1 `--blue-text` + arquivos |
| H04 | alta | typeset | branco sobre `--blue` nos botões | A03 | adiado Q1 |
| H05 | alta | typeset | `--text-muted` 2,26:1 | A10, B05, D23 | T1 alias |
| H06 | média | typeset | erro: 2 vermelhos, 11 e 12px | A11, B16, C | T1 `--danger-text` + arquivos |
| H07 | alta | typeset | amarelo de manutenção 1,52:1 | B03 | T1 `--yellow-text` + StatusBadge, FleetRow |
| H08 | alta | typeset | branco sobre amarelo no FleetCard caution | B04 | FleetCard |
| H09 | média | typeset | tracking 0.18px em títulos + 5 resets ad hoc | A06, B20, D19, D20 | T1 + arquivos |
| H10 | média | typeset | auth com outro ritmo (ls 0, lh 1.3) | A07 | AuthLayout |
| H11 | média | typeset | line-height em px na auth | A08, D21 | AuthLayout |
| H12 | média | typeset | hex de texto na auth | A09, D08 | AuthLayout, AuthForm |
| H13 | alta | typeset | título da auth `nowrap` vaza em fr/de/ru | A01 | AuthLayout |
| H14 | alta | typeset | abas da auth truncam em de/fr | A04, D10 | AuthLayout css + tsx |
| H15 | alta | typeset | h1 em 500/600/700 por tela | B06, C03, D11 | Dashboard, Solicitações, EmployeeSettings |
| H16 | baixa | typeset | h1 sem lh, h2 118%, sem text-wrap | A18, A19, B24, C11, D21, D25 | T1 |
| H17 | alta | typeset | título de card azul vs preto, 12/13/16 | B07, C07 | MachineCard, EmployeeHome |
| H18 | média | typeset | título de painel/seção divergente | B09, C06 | Equipe, EmployeeHistory, EmployeeSettings |
| H19 | média | typeset | título de sheet 600 vs modal 500 | B10 | NewMachinePanel |
| H20 | média | typeset | chave-valor 14/500 no perfil vs 13/600 | A12 (D12 adiado Q7) | ProfileModal |
| H21 | média | typeset | títulos de popover 12 vs 14 | A13 | AlertsDropdown |
| H22 | média | typeset | botão em 11–14px, pesos 400–700 | A14, B12, C08 | vários |
| H23 | média | typeset | label de form 11/12/13 | B13, A27 | NewMachinePanel, AuthForm |
| H24 | alta | typeset | valor de input em 11/12/13/14 | B08, B14, C04 | vários |
| H25 | alta | typeset | pesos 300, `bold`, 700 avulsos | A20, D01, D10, C13 | vários |
| H26 | alta | typeset | números sem `tabular-nums` | A23, B17, B19, C05, D02 | vários |
| H27 | média | typeset | `16px` e `11px` literais | B11, C01, D16 | LevelInfoModal, EmployeeSettings |
| H28 | alta | typeset | 48px e 64px fora da escala | A22, C02, D03, D04 | exceção (Q9), sem mudança |
| H29 | alta | typeset | fonte escalada por `--px` | B01, B02, D07 | adiado Q4 |
| H30 | média | typeset | `--black-*` em componentes | B21, C09, D09 | nos arquivos tocados |
| H31 | baixa | typeset | rótulo de grupo da sidebar mais escuro que os links | A24 | Sidebar, BranchSelector |
| H32 | baixa | typeset | opção de idioma 12 vs 13 | A26 | Header |
| H33 | baixa | typeset | estado vazio 12/13/14 | B23, C12 | vários |
| H34 | média | typeset | `monospace` e estilos inline no modal de senha | B22, D18 | InitialPasswordModal.tsx |
| H35 | média | typeset | `fontSize: 12` e cor de erro inline | A25, D17, A11 | Sidebar.tsx, AccountActionModal.tsx |
| H36 | média | typeset | valor menor que o rótulo no modal de máquina | B17 | MachineDetailModal |
| H37 | média | typeset | `h2` de 11px com lh 118% | C10 | EmployeeHome |
| H38 | baixa | layout | rodapé 15px e gap 10 no Modal | A28 (D14 adiado Q3) | Modal |
| H39 | baixa | layout | padding ímpar de botão compacto e opção | A29 | DialogButtons, Header |
| H40 | baixa | layout | `.cardLg` ignora `--card-*` | A30, D24 | Card |
| H41 | baixa | layout | espaços da auth fora da grade | A31 | rejeitado (Figma, AD-007) |
| H42 | média | layout | padding de página por tela | B L01, C L03, C L04 | adiado Q6 |
| H43 | média | layout | casca de painel com 4 combinações | B L02 | Alertas, Equipe |
| H44 | baixa | layout | 134 espaços fora da grade de 4 | B L03, D13 | rejeitado (fora de papel) |
| H45 | alta | layout | raios e alturas de controle literais | C L01, C L02, B L04 | fora de escopo |
| H46 | baixa | layout | divisor do TeamForm depende do padding do Modal | B L05 | sem mudança (Q3 mantém 30px) |
| H47 | baixa | layout | larguras fixas de skeleton medidas em pt-BR | B L06 | informativo |
| H48 | baixa | layout | vazio da Equipe 24px vs 48px | B L07 | EquipePage |
| H49 | baixa | layout | relevo 3D nos botões de sessão | C L05 | fora de escopo |
| H50 | baixa | layout | `:focus-visible` duplicado no IncidentSheet | C L06 | IncidentSheet |
| H51 | média | animate | `--ease-out` usado e não definido | A15, B A02, D15 | T1 + arquivos |
| H52 | média | animate | durações 0.1s/120/150/0.2s | A16, A17, B A04, C A04, D22 | T1 + arquivos |
| H53 | alta | animate | Sidebar anima `width` | A32, D05 | Sidebar (só duração) |
| H54 | baixa | animate | reduced-motion duplicado no Select | A33 | Select |
| H55 | baixa | animate | listra lateral do Toast | A34 | mantido (Q20) |
| H56 | média | animate | popover de cor desliza 40% na horizontal | B A01 | CategoryFormModal |
| H57 | média | animate | botão "Cadastrar" com 3 feedbacks | B A03 | VisaoGeral, Frota, Equipe |
| H58 | baixa | animate | transição morta no heatmap | B A05 | UsageHeatmap |
| H59 | baixa | animate | `scale` sem transição na aba | B A06 | Solicitações |
| H60 | baixa | animate | hover sem transição | B A07 | Dashboard, MachineTable |
| H61 | baixa | animate | backdrop da sheet sem fade | B A08 | NewMachinePanel |
| H62 | alta | animate | `pulse 1.5s` local vs `shimmer 1.2s` | C A01 | MachineDetailSheet |
| H63 | média | animate | loop de vídeo ignora reduced-motion | C A02 | EmployeeSessionPage.tsx |
| H64 | baixa | animate | `transition: opacity 0.2s` sem token | C A03 | EmployeeSettings |

### Conflitos entre auditores

| K | Tema | Posições | Situação |
|---|---|---|---|
| K1 | fonte em `--px` (Frota/Alertas) | B: fixar `--fs-*`; D: "valor idêntico"; skeleton tests: espelham `--px` | **aberto** (Q4, default manter) |
| K2 | rótulo do `InfoField` | D: 11/500/label; A, B: 13/600 | **aberto** (Q7, default manter) |
| K3 | padding do `Modal .body` | D: 24 ou 32; A: manter; B: divisor depende de 30 | **aberto** (Q3, default manter) |
| K4 | input mobile | C: 13 ou 14; B: zoom iOS < 16 | **aberto** (Q5, default 14) |
| K5 | padding de página | B, C: unificar; brief: não mover posição | **aberto** (Q6, default não mexer) |
| K6 | cor do placeholder | C: `--text-muted`; A, B: `--text-label` | resolvido: `--text-label` |
| K7 | tokens de motion | C: 150/200/220 + `--ease-out-smooth`; D: 120/200; A, B: 120/180/220 + `--ease-out` | resolvido: A/B |
| K8 | tokens 48/64 | C, D: criar; A: exceção | resolvido: exceção |
| K9 | regra de controles | D: `font`/`line-height` inherit; A: só família e tracking | resolvido: A |
| K10 | tracking de títulos | D: herdar 0.18; A, B: 0 | resolvido: 0 |
| K11 | width da Sidebar | D: transform; A, B: manter | resolvido: manter |
| K12 | peso de badge | A: 600; B: 500 | resolvido: 500 |
| K13 | lh de h1 | B: 1.2; A: 1.25 | resolvido: 1.25 |
| K14 | tracking display | D: -0.02em; A: -0.01em | resolvido: -0.01em |
| K15 | vazio em sheet | C: 14; B: 12 dentro de contêiner | resolvido: B |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| HARM-01 | P1: tokens de cor/tracking + alias muted (AC1) | Tasks | In Tasks |
| HARM-02 | P1: herança de fonte em controles (AC2) | Tasks | In Tasks |
| HARM-03 | P1: placeholder global (AC3) | Tasks | In Tasks |
| HARM-04 | P1: regras de título e text-wrap (AC4) | Tasks | In Tasks |
| HARM-05 | P1: pesos 400/500/600 + 700 só em data-display (AC5) | Tasks | In Tasks |
| HARM-06 | P1: papéis por seletor (AC6) | Tasks | In Tasks |
| HARM-07 | P1: tabular-nums (AC7) | Tasks | In Tasks |
| HARM-08 | P1: sem hex na auth, sem `--black-*` nos tocados (AC8) | Tasks | In Tasks |
| HARM-09 | P1: título da auth quebra (AC9) | Tasks | In Tasks |
| HARM-10 | P1: `title` nas abas da auth (AC10) | Tasks | In Tasks |
| HARM-11 | P1: tokens de texto acessíveis (AC11) | Tasks | In Tasks |
| HARM-12 | P2: rodapé/gap do Modal (AC1) | Tasks | In Tasks |
| HARM-13 | P2: botão compacto (AC2) | Tasks | In Tasks |
| HARM-14 | P2: opções de lista (AC3) | Tasks | In Tasks |
| HARM-15 | P2: casca de painel (AC4) | Tasks | In Tasks |
| HARM-16 | P2: `.cardLg` com tokens (AC5) | Tasks | In Tasks |
| HARM-17 | P2: skeletons intocados (AC6) | Tasks | In Tasks |
| HARM-18 | P3: tokens de motion (AC1) | Tasks | In Tasks |
| HARM-19 | P3: sem fallback/curva literal (AC2) | Tasks | In Tasks |
| HARM-20 | P3: hover/press em `--dur-fast` (AC3) | Tasks | In Tasks |
| HARM-21 | P3: entradas em `--dur-base` (AC4) | Tasks | In Tasks |
| HARM-22 | P3: popover de cor sem deslize (AC5) | Tasks | In Tasks |
| HARM-23 | P3: loop de vídeo respeita reduced-motion (AC6) | Tasks | In Tasks |

**Coverage:** 23 total, 23 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `yarn build`, `yarn lint` e `yarn test` passam com Node ≥ 20.19; contagem de testes ≥ 1826 (só cresce).
- [ ] `impeccable detect --json --scope type src` continua com 0 achados.
- [ ] Os greps de §Independent Test (P1, P3) voltam vazios.
- [ ] Inspeção visual em pt-BR e de: nenhum bloco muda de posição; só tamanho/peso/cor/tempo de texto e espaço interno.
