# Menu/Sidebar Specification

## Problem Statement

O app não tem navegação estrutural: só existe `NotFoundPage`. A issue #50 pede uma sidebar colapsível com 4 links de navegação, marca visual da Liftech e rodapé de suporte, servindo de casca de navegação para as demais features do dashboard.

## Goals

- [ ] Sidebar fixa em desktop, com estado expandido/colapsado (ícone-only) persistido em `localStorage`.
- [ ] Sidebar vira drawer overlay em mobile (< 768px), fechado por padrão, acionado por botão hambúrguer.
- [ ] Link ativo (baseado na rota atual via `react-router-dom`) destacado em azul `#2563EB` com ícone e texto brancos.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Conteúdo real das páginas Gerenciamento Frota / Gestão de Equipe / Histórico de Alertas | Fora do escopo da issue; só a navegação e um placeholder são pedidos aqui |
| Header superior (busca, seletor de idioma, notificações, avatar) visto no mockup | Pertence a outra issue de layout; esta issue é só a Sidebar |
| Autenticação / controle de acesso por rota | Não mencionado na issue |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Rotas de destino | `/` (Visão Geral), `/frota`, `/equipe`, `/alertas` | Únicos nomes derivados da issue; sem convenção prévia no repo | y |
| Páginas placeholder | Criar 4 páginas simples ("em construção") | Usuário respondeu "página em branco" ao ser perguntado sobre tratamento das rotas | y |
| Persistência do estado colapsado | `localStorage`, chave `liftech.sidebar.collapsed` | Usuário confirmou (Recomendado) | y |
| Breakpoint mobile | `< 768px`, igual ao valor exato da issue | Já explícito na issue | y |
| Ícones | `lucide-react`: `PanelLeft` (toggle), `FileText` (Visão Geral), `Truck` (Frota), `Users` (Equipe), `AlertCircle` (Alertas), `MessageSquare` + `ChevronRight` (Feedback) | Combina com os ícones do mockup e com AD-001, que já adota lucide-react | y |
| Estado colapsado em mobile | Colapsar não se aplica no drawer mobile — mobile sempre mostra o conteúdo expandido dentro do drawer, e fecha/abre em vez de colapsar | Colapso "ícone only" e overlay mobile são interações diferentes; a issue trata como dois requisitos separados | n → assumido, ver AC MSB-06 |
| Fechar drawer mobile | Fecha ao clicar no backdrop, pressionar Esc, ou navegar para um link | Comportamento padrão de drawers acessíveis; não especificado na issue | n → assumido |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Navegar pelas páginas principais ⭐ MVP

**User Story**: Como usuário do Liftech, quero uma sidebar com os links das principais páginas, para navegar pelo sistema e saber sempre onde estou.

**Why P1**: É a funcionalidade central da issue — sem ela não há navegação estrutural.

**Acceptance Criteria**:

1. The Sidebar SHALL render the "Liftech" logo/brand at the top. <!-- ubiquitous, MSB-01 -->
2. The Sidebar SHALL render exactly 4 navigation links, in order: "Visão Geral", "Gerenciamento Frota", "Gestão de Equipe", "Histórico de Alertas", each with an icon. <!-- ubiquitous, MSB-02 -->
3. WHEN the current route matches a link's path THEN the Sidebar SHALL render that link with a `#2563EB` background, white icon and white text. <!-- event-driven, MSB-03 -->
4. WHEN the user clicks a navigation link THEN the Sidebar SHALL navigate to that link's route via `react-router-dom`. <!-- event-driven, MSB-04 -->
5. The Sidebar SHALL render a footer with a "Feedback & Sugestões" action and a "Políticas & Privacidades" link, both below the nav links. <!-- ubiquitous, MSB-05 -->

**Independent Test**: Render `<Sidebar>` inside a router at each of the 4 paths; assert the matching link carries the active styling and the other 3 do not.

---

### P2: Colapsar/expandir a sidebar (desktop)

**User Story**: Como usuário em uma tela grande, quero colapsar a sidebar para um modo compacto (só ícones), para ganhar espaço de conteúdo.

**Why P2**: Melhora a ergonomia em desktop, mas o produto funciona sem isso (P1 já entrega navegação).

**Acceptance Criteria**:

1. WHEN the user clicks the collapse toggle button THEN the Sidebar SHALL switch between expanded (icons + labels) and collapsed (icons only) layouts. <!-- event-driven, MSB-06 -->
2. WHEN the collapsed state changes THEN the Sidebar SHALL persist the new state to `localStorage` under the key `liftech.sidebar.collapsed`. <!-- event-driven, MSB-07 -->
3. WHEN the Sidebar mounts THEN the Sidebar SHALL read `liftech.sidebar.collapsed` from `localStorage` and initialize its collapsed state from it, defaulting to expanded (`false`) when absent or invalid. <!-- event-driven, MSB-08 -->
4. WHILE collapsed, the Sidebar SHALL still render the active link with the `#2563EB` highlight, icon-only. <!-- state-driven, MSB-09 -->

**Independent Test**: Click the toggle, reload/remount the component, and confirm the collapsed state survived via `localStorage`.

---

### P3: Sidebar responsiva em mobile

**User Story**: Como usuário em um celular, quero abrir a navegação como um drawer sobreposto, para não perder espaço de tela permanentemente.

**Why P3**: Necessário para cobrir todos os tamanhos de tela pedidos pela issue, mas é uma adaptação da P1, não uma capacidade nova.

**Acceptance Criteria**:

1. WHILE the viewport width is below 768px, the Sidebar SHALL render as a closed-by-default overlay drawer instead of a fixed column. <!-- state-driven, MSB-10 -->
2. WHEN the user clicks the hamburger/menu button on a viewport below 768px THEN the Sidebar SHALL open the drawer over the page content with a backdrop. <!-- event-driven, MSB-11 -->
3. WHEN the drawer is open and the user clicks the backdrop, presses `Escape`, or clicks a navigation link THEN the Sidebar SHALL close the drawer. <!-- event-driven, MSB-12 -->
4. WHILE the drawer is open, the Sidebar SHALL always render in its expanded (icons + labels) layout, ignoring the desktop collapsed state. <!-- state-driven, MSB-13 -->

**Independent Test**: Resize the test viewport (or mock `matchMedia`) below 768px, open the drawer, assert the backdrop and expanded content render, then close via each of the three closing interactions.

---

## Edge Cases

- IF `localStorage` is unavailable (e.g., private browsing throws) THEN the Sidebar SHALL fall back to in-memory state (expanded by default) without throwing. <!-- MSB-14 -->
- IF the current route does not match any of the 4 link paths THEN the Sidebar SHALL render with no link marked active. <!-- MSB-15 -->
- WHEN the viewport is resized across the 768px breakpoint while the drawer is open THEN the Sidebar SHALL close the drawer and return to the fixed desktop layout. <!-- MSB-16 -->

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MSB-01 | P1 | Execute | Pending |
| MSB-02 | P1 | Execute | Pending |
| MSB-03 | P1 | Execute | Pending |
| MSB-04 | P1 | Execute | Pending |
| MSB-05 | P1 | Execute | Pending |
| MSB-06 | P2 | Execute | Pending |
| MSB-07 | P2 | Execute | Pending |
| MSB-08 | P2 | Execute | Pending |
| MSB-09 | P2 | Execute | Pending |
| MSB-10 | P3 | Execute | Pending |
| MSB-11 | P3 | Execute | Pending |
| MSB-12 | P3 | Execute | Pending |
| MSB-13 | P3 | Execute | Pending |
| MSB-14 | Edge | Execute | Pending |
| MSB-15 | Edge | Execute | Pending |
| MSB-16 | Edge | Execute | Pending |

**Coverage:** 16 total, 16 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Todos os 16 critérios de aceitação passam em testes automatizados (Vitest + Testing Library).
- [ ] `npm run lint` e `npm run build` (tsc) passam sem erros novos.
- [ ] Sidebar visualmente equivalente ao mockup fornecido (logo, cores, ícones, rodapé) em desktop expandido, desktop colapsado e mobile.
