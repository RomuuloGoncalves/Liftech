# Polimento da interface Specification

## Problem Statement

As telas funcionam, mas parecem cruas: aparecem de uma vez, sem estado de carregamento; arrastar um card no kanban não mostra o que está sendo arrastado nem onde vai cair; modais e menus surgem sem transição; e nenhuma ação (criar, salvar, excluir) dá retorno além da mudança na tela. O dono quer um acabamento mais profissional.

## Goals

- [ ] Visão Geral, Frota, Equipe e Alertas mostram skeleton na primeira visita da sessão.
- [ ] Arrastar no kanban mostra o card em arrasto, a linha de destino e a chegada do card.
- [ ] Modais e menus entram com transição, respeitando "reduzir movimento".
- [ ] Criar, salvar e excluir mostram um aviso curto, lido por leitor de tela.
- [ ] Todo texto novo existe nos 7 idiomas.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Hover/foco padronizado nos cards | Não escolhido pelo dono |
| Estados vazios com ícone | Não escolhido pelo dono |
| Biblioteca de drag and drop / reordenar na linha | Dono decidiu manter o DnD nativo |
| Animação de saída de modais e menus | Exige adiar a desmontagem; ganho pequeno |
| Skeleton nas telas de login/cadastro | Não carregam dados |
| Avisos para ações já visíveis na hora (mover card, alternar acesso, filtros) | A própria tela já mostra o resultado |
| Tema escuro | AD-003: só tema claro |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Itens do polimento | Skeleton, feedback de arrasto, animações de modal/menu, avisos | Escolha do dono | y |
| Skeleton com dados mock | Atraso simulado de 600 ms na primeira visita de cada página na sessão; visitas seguintes mostram o conteúdo direto | Escolha do dono | y |
| Atraso nos testes | 0 ms no modo de teste (`import.meta.env.MODE === 'test'`); testes do skeleton forçam o atraso | Não quebrar os ~400 testes existentes, que esperam conteúdo imediato | n |
| Formato do skeleton | Blocos cinza com brilho deslizante, no formato dos cards de cada tela, em quantidade que preenche a primeira dobra (8 na Visão Geral e Alertas; 3 linhas x 4 na Frota; 8 funcionários + 4 setores na Equipe) | Evita salto de layout quando o conteúdo chega | n |
| Acessibilidade do skeleton | Região com `aria-busy="true"` e texto oculto "Carregando..." em `role="status"`; blocos com `aria-hidden` | Leitor de tela anuncia o carregamento uma vez, sem ler os blocos | n |
| Card em arrasto | Fica com 40% de opacidade e borda tracejada enquanto é arrastado | Mostra de onde saiu sem sumir da linha | n |
| Linha de destino | Ao passar sobre outra linha, ela ganha borda tracejada e fundo na cor da categoria; a linha de origem não destaca | Destaque só onde soltar muda algo | n |
| Chegada do card | O card que acabou de entrar numa linha (arrasto, menu ⋮ ou "+") pisca na cor da categoria por 1 s | Confirma visualmente onde foi parar | n |
| Animação de modal | Fundo com fade de 150 ms; caixa com fade + escala de 0,96 a 1 em 180 ms | Curta o bastante para não atrasar o uso | n |
| Animação de menu/popover | Menu ⋮ do card e popover de cores com fade + deslocamento de 4 px em 120 ms | Mesmo padrão do popover de idioma que já existe | n |
| Reduzir movimento | Com `prefers-reduced-motion: reduce`, todas as animações e transições do app ficam instantâneas | Acessibilidade básica | n |
| Avisos (toasts) | Canto inferior direito, empilhados, somem em 4 s ou no X; `role="status"` + `aria-live="polite"` | Padrão comum, não bloqueia a tela | n |
| Ações com aviso | Visão Geral: máquina cadastrada/salva/excluída. Equipe: funcionário e setor cadastrado/salvo/excluído. Frota: categoria criada/excluída, máquinas adicionadas, máquina removida da categoria | Ações que mudam dados e cujo resultado pode não estar à vista | n |
| Texto dos avisos | Frase curta com o nome do item, ex.: "Categoria \"Reserva\" criada" | Confirma o que foi afetado | n |
| Sem provider | `useToast()` fora do provider vira no-op | Componentes continuam testáveis isolados | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Skeleton na primeira visita ⭐ MVP

**User Story**: As a usuário, I want to see a loading placeholder shaped like the content so that the page feels responsive while data loads.

**Why P1**: Pedido explícito do dono.

**Acceptance Criteria**:

1. WHEN the user opens Visão Geral, Frota, Equipe or Alertas for the first time in the session THEN the system SHALL show the page skeleton for 600 ms and then the content.
2. WHEN the user opens a page already visited in the session THEN the system SHALL show the content without skeleton.
3. WHILE the skeleton is shown the system SHALL expose `aria-busy="true"` on the content region and a `role="status"` text "Carregando...".
4. WHILE the skeleton is shown the system SHALL keep the page toolbar hidden so no control acts on unloaded data.
5. The system SHALL render skeleton blocks with `aria-hidden="true"`.

**Independent Test**: Abrir `/frota` numa aba nova: 600 ms de skeleton, depois o quadro; sair e voltar: quadro direto.

---

### P1: Feedback de arrasto no kanban ⭐ MVP

**User Story**: As a gestor, I want to see which card I'm dragging and where it will land so that I move machines with confidence.

**Why P1**: Pedido explícito do dono.

**Acceptance Criteria**:

1. WHILE a card is being dragged the system SHALL mark it as dragging (40% opacity, dashed border).
2. WHILE a dragged card is over a row other than its own the system SHALL highlight that row with a dashed border and a background in the category color.
3. WHILE a dragged card is over its own row the system SHALL NOT highlight it.
4. WHEN the drag ends (drop or cancel) THEN the system SHALL remove the dragging mark and every row highlight.
5. WHEN a machine enters a row by drag, by the "Mover para" menu or by "Selecione as máquinas" THEN the system SHALL flash its card in the category color for 1 s.

**Independent Test**: Arrastar um card de Ativas sobre Manutenção: card esmaecido, Manutenção destacada; soltar: destaque some e o card pisca na nova linha.

---

### P2: Animações de modal e menu

**User Story**: As a usuário, I want dialogs and menus to appear smoothly so that the interface feels polished.

**Why P2**: Melhora a percepção, sem mudar comportamento.

**Acceptance Criteria**:

1. WHEN any `Modal` opens THEN the system SHALL fade in the backdrop (150 ms) and fade + scale the dialog from 0.96 to 1 (180 ms).
2. WHEN the card "⋮" menu or the category color popover opens THEN the system SHALL fade it in with a 4 px slide (120 ms).
3. WHERE the user's system has `prefers-reduced-motion: reduce` the system SHALL make every animation and transition of the app instant.

**Independent Test**: Abrir um modal e o menu ⋮ e ver a transição; com "reduzir movimento" ligado, abrem na hora.

---

### P2: Avisos após ações

**User Story**: As a usuário, I want a short confirmation after creating, saving or deleting something so that I know the action worked.

**Why P2**: Escolha do dono; as ações já funcionam sem ele.

**Acceptance Criteria**:

1. WHEN the user creates, saves or deletes a machine on Visão Geral THEN the system SHALL show a toast naming the machine.
2. WHEN the user creates, saves or deletes an employee or a sector on Equipe THEN the system SHALL show a toast naming the item.
3. WHEN the user creates or deletes a category, adds machines to a category, or removes a machine from a category on Frota THEN the system SHALL show a toast naming the category or machine.
4. The system SHALL render toasts inside a `role="status"` region with `aria-live="polite"`.
5. WHEN 4 s pass or the user clicks the toast close button THEN the system SHALL remove that toast.
6. WHEN several actions happen in sequence THEN the system SHALL stack the toasts, newest at the bottom.
7. WHERE a component is rendered without the toast provider the system SHALL ignore toast calls without error.

**Independent Test**: Criar uma categoria e ver "Categoria \"Reserva\" criada" no canto, que some sozinho.

---

## Edge Cases

- WHEN the user leaves a page during its skeleton THEN the system SHALL cancel the pending timer and still mark the page as visited only after the content shows.
- WHEN a drag ends outside any row THEN the system SHALL clear all drag marks without moving the machine.
- WHEN the "+" adds several machines at once THEN the system SHALL flash every added card.
- WHEN a toast is closed by the user before 4 s THEN the system SHALL NOT throw or remove another toast when its timer fires.

---

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | N/A because no new input is added |
| Failure / partial-failure states | N/A because data is in-memory mock; skeleton timing covered by SKEL-01/02 |
| Idempotency / duplicates | TOAST-05 edge case (closing early does not affect other toasts) |
| Auth boundaries & rate limits | N/A because no auth or network |
| Concurrency / ordering | TOAST-06 (stack order); DRAG-04 (all marks cleared on end) |
| Data lifecycle | SKEL-02 (visited state lasts the browser session, resets on reload) |
| Observability | N/A because no telemetry in the frontend |
| External-dependency failure | N/A because no external calls |
| State-transition integrity | DRAG-02/03/04 (highlight only during drag over another row) |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| SKEL-01 | P1: Skeleton AC1 | Execute | Verified |
| SKEL-02 | P1: Skeleton AC2 | Execute | Verified |
| SKEL-03 | P1: Skeleton AC3 | Execute | Verified |
| SKEL-04 | P1: Skeleton AC4 | Execute | Verified |
| SKEL-05 | P1: Skeleton AC5 | Execute | Verified |
| DRAG-01 | P1: Arrasto AC1 | Execute | Verified |
| DRAG-02 | P1: Arrasto AC2 | Execute | Verified |
| DRAG-03 | P1: Arrasto AC3 | Execute | Verified |
| DRAG-04 | P1: Arrasto AC4 | Execute | Verified |
| DRAG-05 | P1: Arrasto AC5 | Execute | Verified |
| ANIM-01 | P2: Animações AC1 | Execute | Verified |
| ANIM-02 | P2: Animações AC2 | Execute | Verified |
| ANIM-03 | P2: Animações AC3 | Execute | Verified |
| TOAST-01 | P2: Avisos AC1 | Execute | Verified |
| TOAST-02 | P2: Avisos AC2 | Execute | Verified |
| TOAST-03 | P2: Avisos AC3 | Execute | Verified |
| TOAST-04 | P2: Avisos AC4 | Execute | Verified |
| TOAST-05 | P2: Avisos AC5 | Execute | Verified |
| TOAST-06 | P2: Avisos AC6 | Execute | Verified |
| TOAST-07 | P2: Avisos AC7 | Execute | Verified |

**Coverage:** 20 total, 0 mapped to tasks.

---

## Success Criteria

- [ ] Nenhum salto de layout quando o skeleton dá lugar ao conteúdo.
- [ ] Os ~400 testes existentes continuam passando sem alteração.
- [ ] Com "reduzir movimento" ligado, nenhuma animação roda.
