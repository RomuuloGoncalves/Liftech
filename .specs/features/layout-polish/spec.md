# Polimento de proporção do layout Specification

## Problem Statement

Depois do restyle, os cards ficaram grandes e o resto pequeno: a Visão Geral mede 263×245 (padding 16, gap 14, título de 16px em duas linhas, selo de 27px), a Frota 288×193 e o card de Alertas estica até 342×184, enquanto o Figma tem cards de cerca de 255×146 e controles de 30px de altura. Os campos de busca e botões têm de 36 a 39px de altura com alturas diferentes entre páginas, e o menu lateral usa 12px. Os elementos não têm uma escala comum, e o conjunto parece desproporcional.

## Goals

- [ ] Todos os cards usam o mesmo padrão: padding 12, raio 8, gap 8.
- [ ] Na Visão Geral e na Frota os cards ficam entre 146px e 165px de altura a 1440x900.
- [ ] Botões, buscas e seletores das barras de ferramentas têm 32px de altura e texto de 13px em todas as páginas.
- [ ] Nenhuma cor, rota ou comportamento muda; só tamanhos.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Cores, tokens e fonte | Já resolvidos no figma-restyle |
| Telas do funcionário | Feature `employee-screens` |
| Modais e painéis laterais (Nova Máquina, detalhe) | Não fazem parte da queixa |
| Header (altura 71px) | Fora da queixa; revisar depois se o dono pedir |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Padrão de card | padding 12, raio 8, gap 8 em `MachineCard`, `FleetCard`, `EmployeeCard`, `SectorCard`; Alertas herda do `FleetCard` | Figma: cards de 255×146 com padding de 12 a 13px | n |
| Texto do card | Título 13px/600 em uma linha com reticências; rótulos 11px; valores 12px; tempo de sessão 14px; selo de status 11px com 22px de altura | Escala `--fs-*` existente; título do Figma tem 12 a 13px | n |
| Faixa colorida da Frota | Padding vertical de 8px (hoje 12px); lateral continua 12px | A faixa de 40px+ domina o card de 146px | n |
| Largura dos cards de Alertas | Colunas entre 240px e 288px (`--px`), sem passar de 288px | O painel de Alertas tem cerca de 1023px úteis a 1440px; 4 colunas de 288px pedem 1200px, de 240px pedem 1008px | n |
| Controles | 32px de altura e 13px de texto (`--fs-md`) em Visão Geral, Frota, Equipe e Alertas | Figma: 30px; 32px fica na escala de 4px | n |
| Menu lateral | `.navLink` com 13px; altura 38px mantida | Texto de 12px ficou menor que o conteúdo | n |
| Verificação | Medição de `getBoundingClientRect` e `getComputedStyle` a 1440x900 no navegador, mais testes estáticos de CSS | Sem Figma no CI | n |
| Commit | Nada é commitado; o dono revisa e reverte se não gostar | Pedido do dono | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Card padrão ⭐ MVP

**User Story**: As a usuário, I want cards compactos e iguais so that a tela tenha ritmo e eu veja mais máquinas de uma vez.

**Why P1**: É a queixa principal.

**Acceptance Criteria**:

1. The `MachineCard`, `FleetCard`, `EmployeeCard` e `SectorCard` SHALL declarar padding de 12px, raio de 8px e gap de 8px.
2. The título do card SHALL usar 13px, peso 600 e uma linha com reticências em `MachineCard` e `FleetCard`.
3. The rótulos dos cards SHALL usar `--fs-xs`, os valores `--fs-sm` e o tempo de sessão `--fs-base`.
4. The selo de status do `MachineCard` SHALL usar `--fs-xs`, padding vertical de 2px e horizontal de 8px.
5. WHEN a largura da janela é 1440x900 THEN the card da Visão Geral SHALL medir de 146px a 165px de altura.

### P1: Faixa da Frota e largura dos Alertas

**User Story**: As a usuário, I want a faixa colorida fina e cards de Alertas do tamanho da Frota so that a cor sinalize sem dominar.

**Why P1**: A faixa e o card esticado são os maiores culpados da desproporção.

**Acceptance Criteria**:

1. The faixa colorida do `FleetCard` SHALL ter padding vertical de 8px e lateral de 12px, tanto por status quanto por urgência.
2. The grade de Alertas SHALL usar colunas entre 240px e 288px (`--px`) sem esticar os cards além de 288px.
3. WHEN a largura da janela é 1440x900 THEN the Frota SHALL mostrar cards de 146px a 165px de altura e a grade de Alertas SHALL mostrar 4 cards por linha.

### P2: Controles e menu

**User Story**: As a usuário, I want botões e buscas na mesma altura so that as barras de ferramentas pareçam um conjunto.

**Why P2**: Consistência; não bloqueia o resto.

**Acceptance Criteria**:

1. The botão de cadastro, a busca e o seletor das barras de Visão Geral, Frota, Equipe e Alertas SHALL ter altura de 32px e fonte `--fs-md`.
2. The itens do menu lateral SHALL usar `--fs-md`.
3. The botão circular de adicionar categoria na Frota SHALL manter 32px.

---

## Edge Cases

- WHEN o nome da máquina excede a largura do card THEN the card SHALL truncar com reticências sem quebrar a altura.
- WHEN a janela tem menos de 768px THEN as colunas das grades SHALL seguir as media queries atuais.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| POL-01 | P1 Card padrão: AC1, AC2, AC3, AC4 | Execute | Pending |
| POL-02 | P1 Card padrão: AC5 | Execute | Pending |
| POL-03 | P1 Faixa e Alertas: AC1 | Execute | Pending |
| POL-04 | P1 Faixa e Alertas: AC2, AC3 | Execute | Pending |
| POL-05 | P2 Controles: AC1, AC3 | Execute | Pending |
| POL-06 | P2 Controles: AC2 | Execute | Pending |

---

## Success Criteria

- [ ] A 1440x900, cards da Visão Geral e da Frota entre 146 e 165px de altura, Alertas com 4 por linha.
- [ ] Todos os controles das barras de ferramentas com 32px de altura.
- [ ] Lint, `tsc -b`, build e testes passam, exceto as 3 falhas antigas de `34 min`; testes de CSS só mudam onde afirmavam os valores antigos, com justificativa.
- [ ] Nada commitado.
