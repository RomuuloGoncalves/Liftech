# Skeletons iguais ao layout Specification

## Problem Statement

Os skeletons das telas não reproduzem o layout que carregam: quase todos pulam a barra de filtros, e os cards têm altura e largura próprias. Medido no navegador a 1024px de largura, o primeiro card sobe ou desce entre 2 e 117px quando o conteúdo chega (Alertas 105px, Histórico 117px), e o card da Frota muda de 256×147 para 288×170. O skeleton deveria ser um molde da tela, sem salto de layout.

## Goals

- [ ] O primeiro card do skeleton fica a no máximo 4px da posição do primeiro card da tela carregada, em cada uma das telas abaixo.
- [ ] Os cards do skeleton têm a mesma largura de coluna e altura (até 4px) dos cards reais.
- [ ] O skeleton mostra os mesmos blocos fixos da tela (barra de filtros, painéis, cabeçalhos de seção), em branco.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Skeleton da tela de Configurações do funcionário | É a variante `settings` da spec `employee-nav-settings`; esta spec só fixa que ela segue a mesma regra |
| Skeleton de modais, sheets de detalhe e login | Não carregam listas; só o sheet de ocorrência já usa skeleton |
| Mudar o atraso simulado (`MOCK_LATENCY_MS`) ou `useFirstVisitLoading` | O comportamento de carregamento não muda |
| Quantidade de cards do skeleton igual à da tela | A tela real tem de 8 a 64 cards; só o que aparece acima da dobra importa |
| Skeleton para a tela de Sessão além do ajuste da descrição | Já bate com o layout em tudo, menos 10px |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Tolerância de igualdade | 4px de diferença na posição do primeiro card e na altura do card, nas larguras de 1024px e 375px | Medido hoje, as diferenças vão de 2 a 117px; 4px absorve quebra de linha de texto sem exigir pixel exato | n |
| Como medir | Em teste de Verifier no navegador, com a mesma medição usada neste levantamento; nos testes unitários, só estrutura (blocos presentes, classes de grid) e CSS estático | jsdom não calcula layout | n |
| Estrutura do card do skeleton | Uma variante de card por tipo real: máquina (Visão Geral), frota/alerta, funcionário, setor, máquina do funcionário com e sem data e hora | Cada card real tem altura própria: 155, 170, 81, ~50, 122 e 140px | n |
| Barra de filtros no skeleton | Cada página monta os blocos da própria barra com as classes dela; `PageSkeleton` recebe o cabeçalho como filho | Reaproveita as dimensões reais e evita copiar CSS | n |
| Largura dos cards da Frota e Alertas | `calc(288 * var(--px, 1px))`, como `FleetCard` | Hoje o skeleton usa 256 | n |
| Quantidade de categorias do skeleton da Frota | 4 painéis | O quadro padrão tem acidentes, ativas, manutenção e disponíveis | n |
| Seção de setores da Equipe | 8 cards de setor de linha única, sem o seletor de acesso no cabeçalho | A seção real não tem seletor e o `SectorCard` tem uma linha | n |
| Skeleton da Sessão | Uma única barra de 38px no lugar das duas linhas da descrição; cronômetro com 210px | Mede 424px de altura na tela real contra 434px no skeleton | n |
| Skeleton do sheet de ocorrência | 4 campos de 65px; o quarto (Horário) com 120px de largura | A tela real tem 307px de formulário e o último campo é pela metade | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Skeletons das telas do administrador ⭐ MVP

**User Story**: As a gestor, I want que o skeleton tenha o formato da tela so that nada pule quando os dados chegam.

**Why P1**: São as telas mais usadas e as de maior salto (Alertas 105px, Frota 66px).

**Acceptance Criteria**:

1. WHILE a Visão Geral carrega THE skeleton SHALL exibir a barra de filtros (busca de 300×32px, seletor e botão, centralizados) acima da grade de cards.
2. WHILE a Visão Geral carrega THE card do skeleton SHALL ter a estrutura do `MachineCard` (nome e identificação, 2 linhas de detalhe, rodapé com selo e tempo).
3. WHILE a Frota carrega THE skeleton SHALL exibir a barra de filtros com borda inferior, 4 painéis de categoria com cabeçalho (etiqueta de 158×24 e ferramentas) e cards de 288×170 com faixa de topo.
4. WHILE a Equipe carrega THE skeleton SHALL exibir 2 seções com título, barra de ferramentas e grade; os cards de funcionário SHALL ter 3 linhas e o interruptor, os de setor SHALL ter uma linha e 2 botões.
5. WHILE os Alertas carregam THE skeleton SHALL exibir o painel com borda e padding de 16px, a etiqueta vermelha, a busca e o período, e cards de `FleetCard` com largura máxima de `288 * var(--px)`.
6. WHEN o conteúdo das telas do administrador chega THEN the primeiro card SHALL ficar a no máximo 4px da posição que tinha no skeleton, nas larguras 1024px e 375px.
7. WHEN o conteúdo chega THEN the altura do primeiro card SHALL diferir em no máximo 4px da altura do card do skeleton.
8. The skeleton SHALL usar a mesma classe de grade da tela, sem copiar breakpoints.

**Independent Test**: Abrir `/alertas` pela primeira vez e medir o topo do primeiro card durante o skeleton e depois de carregar: a diferença é de até 4px.

---

### P1: Skeletons das telas do funcionário ⭐ MVP

**User Story**: As a funcionário, I want que o skeleton tenha o formato da tela so that a lista não salte no celular.

**Why P1**: O app do funcionário é de celular, onde o salto de 117px do Histórico ocupa meia tela.

**Acceptance Criteria**:

1. WHILE a Visão geral carrega THE skeleton SHALL exibir a faixa "Última máquina" e o card da última máquina, com título e subtítulo da tela.
2. WHILE o Histórico carrega THE skeleton SHALL exibir o título "Filtros" e 3 linhas de campo de 36px (período, dois horários, busca) com 8px entre elas, e o cabeçalho com 12px de espaço, igual à tela.
3. WHILE as Empilhadeiras ou o Histórico carregam THE card do skeleton SHALL ter a altura do card com data e hora (140px).
4. WHILE a Visão geral carrega THE card do skeleton SHALL ter a altura do card sem data e hora (122px).
5. WHILE a Sessão carrega THE skeleton SHALL exibir a descrição como uma barra única de 38px e o cronômetro com 210px de largura.
6. WHILE o sheet de ocorrência carrega THE skeleton SHALL exibir 4 campos de 65px, o último com 120px de largura.
7. WHEN o conteúdo das telas do funcionário chega THEN the primeiro card SHALL ficar a no máximo 4px da posição do skeleton, nas larguras 1024px e 375px.
8. WHEN o sheet de ocorrência termina de carregar THEN the altura do diálogo SHALL diferir em no máximo 4px da altura durante o skeleton.
9. WHERE `prefers-reduced-motion: reduce` está ativo THE skeleton SHALL manter os mesmos blocos, sem o brilho deslizante.

**Independent Test**: Abrir `/funcionario/historico` pela primeira vez; o primeiro card não se move mais de 4px ao carregar.

---

## Edge Cases

- WHEN a tela abre em largura de 375px THEN the skeleton SHALL empilhar a barra de filtros como a tela real.
- WHEN o skeleton é exibido THEN the skeleton SHALL manter `aria-busy="true"` no contêiner e o aviso `common.loading` para leitores de tela.
- IF a tela real não tem uma barra de filtros (Sessão) THEN the skeleton SHALL NOT inventá-la.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| SKL-01 | P1 Admin: AC1, AC2 | Execute | Implementing |
| SKL-02 | P1 Admin: AC3 | Execute | Implementing |
| SKL-03 | P1 Admin: AC4 | Execute | Implementing |
| SKL-04 | P1 Admin: AC5 | Execute | Implementing |
| SKL-05 | P1 Admin: AC6, AC7, AC8 | Execute | Implementing |
| SKL-06 | P1 Funcionário: AC1, AC4 | Execute | Implementing |
| SKL-07 | P1 Funcionário: AC2, AC3 | Execute | Implementing |
| SKL-08 | P1 Funcionário: AC5 | Execute | Implementing |
| SKL-09 | P1 Funcionário: AC6, AC8 | Execute | Pending |
| SKL-10 | P1 Funcionário: AC7, AC9; Edge: 375px, `aria-busy`, Sessão | Execute | Implementing |

---

## Success Criteria

- [ ] Nenhuma tela com skeleton move o primeiro card mais de 4px ao carregar, a 1024px e a 375px.
- [ ] Os cards do skeleton têm a altura dos cards reais, com diferença máxima de 4px.
- [ ] Lint, `tsc -b`, build e testes passam, exceto as 3 falhas antigas de `34 min`.
