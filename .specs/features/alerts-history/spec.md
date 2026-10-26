# Histórico de Alertas Specification

## Problem Statement

`/alertas` hoje mostra só "Em construção". O Figma (frames "Histórico de alertas" e "Histórico de alertas(Detalhe)") define uma tela com todos os acidentes da frota em cards, com busca por máquina, filtro de período e nível de urgência, e um detalhe da máquina aberto direto no histórico de alertas. Tudo roda sobre os dados mockados de `data/machines.ts`.

## Goals

- [ ] O gestor vê todos os acidentes do período em cards, do mais recente para o mais antigo, com o nível de urgência destacado por cor.
- [ ] O gestor filtra os acidentes por máquina (nome ou código) e por período.
- [ ] Clicar num card abre o detalhe da máquina já na aba "Histórico de Alertas".
- [ ] Todo texto novo existe nos 7 idiomas.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Integração com API, notificações em tempo real | Dados mockados; não há backend de alertas |
| Ações do botão ⋮ do card | O frame não define ação para ele nesta tela |
| Marcar alerta como lido/resolvido | Sem frame no Figma |
| Filtrar por nível de urgência | Sem controle no Figma |
| Editar/excluir a máquina a partir do detalhe | O frame "Histórico de alertas(Detalhe)" não tem esses botões |
| Eventos de manutenção como alerta | A tela mostra só "Acidentes" |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| O que é um card | Um card por acidente (`MACHINE_EVENTS` com `tipo: 'acidente'`); a mesma máquina pode aparecer em vários cards | A tela é um histórico de alertas, e cada card tem data e hora próprias | n |
| Tipo do acidente no mock | Novo campo `causa` nos eventos de acidente: `frenagem`, `colisao` ou `tombamento`, distribuído de forma determinística no mock | O mock não tinha subtipo; a nota do Figma liga o tipo à urgência | n |
| Urgência | Derivada da causa: Frenagem Brusca = Média, Colisão = Alta, Tombamento = Crítica | Nota do Figma | n |
| Cores da urgência | Crítica vermelho, Alta laranja, Média amarelo, texto em negrito | Frame | n |
| Ordem dos cards | Do acidente mais recente para o mais antigo (data + hora de início) | Mesma ordem da linha do tempo do detalhe (`filterEvents`) | n |
| "Funcionário" do card | Operador registrado no acidente (`operador`) | É quem estava na máquina no momento do evento | n |
| "Data e Hora" do card | Data do acidente + hora de início, no formato "23 Janeiro 2026, 14:38:20" (mês com inicial maiúscula, no idioma ativo) | Texto do frame | n |
| Busca "Procurar Máquina" | Filtra por nome ou código da máquina, sem diferenciar maiúsculas, ignorando espaços nas pontas | Rótulo do campo fala em máquina; mesmo critério da busca de linha da Frota | n |
| Filtro de período | Dois campos de data nativos (início e fim), padrão 14/07/2024 a 14/07/2026 (`DEFAULT_PERIOD`), limites inclusivos | Chip do frame; mesmo controle do detalhe da máquina | n |
| Período invertido (início > fim) | Nenhum card, mostra o estado vazio | Mesmo comportamento de `filterEvents` | n |
| Contador do selo "Acidentes" | Quantidade de cards visíveis depois dos filtros | O selo do frame acompanha a lista | n |
| Estado vazio | "Nenhum alerta encontrado" no lugar do grid | Padrão das outras telas | n |
| Grid | Quebra em linhas: 4 colunas a partir de 1280px, 3 até 1279px, 2 até 899px, 1 até 639px | Frame em 1440px + mesmos pontos de quebra da Visão Geral | n |
| Detalhe | Reusa `MachineDetailModal` com nova variante `alerts`: linhas da Frota (Setor, Funcionário, Tempo Uso (Sessão), Nome Dispositivo), aba "Histórico de alertas" primeiro e selecionada, sem selo de status e sem Editar/Excluir | Frame "Histórico de alertas(Detalhe)" | n |
| Card | Reusa o card de acidente da Frota (`FleetCard` com `kind="acidentes"`), mostrando o nível de urgência no lugar do "Urgente" fixo | O mesmo card aparece nas duas telas | n |
| Estado | Local da página, em memória | Mesmo padrão das outras telas | n |
| Botão ⋮ do card | Não aparece nos cards de alerta (o `FleetCard` só mostra o menu quando recebe as ações de mover/remover) e o card não é arrastável | O frame mostra o ⋮, mas não há ação definida para ele aqui; um botão sem ação confunde | n |
| Data no card da Frota | O card de acidente da Frota passa a usar o mesmo formato com mês maiúsculo ("23 Janeiro 2026") | Um só formatador para o mesmo card; é o texto do Figma | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Ver os acidentes da frota ⭐ MVP

**User Story**: As a gestor, I want to see every accident of the fleet as a card so that I know which machines need attention.

**Why P1**: É a tela em si.

**Acceptance Criteria**:

1. WHEN the user opens `/alertas` THEN the system SHALL render one card per accident event whose date is inside the default period 2024-07-14 to 2026-07-14.
2. The system SHALL order the cards from the most recent accident to the oldest by date and start time.
3. The system SHALL render in each card the machine name, the code as "EMP-084(ID)", the machine sector, the event operator as "Funcionário", the date and time as "23 Janeiro 2026, 14:38:20" and the urgency level.
4. The system SHALL map the accident cause to the urgency level as frenagem = "Média", colisao = "Alta" and tombamento = "Crítica".
5. The system SHALL show the "Acidentes" label with the count of visible cards.
6. The system SHALL NOT render maintenance events as cards.

**Independent Test**: Abrir `/alertas` e ver os cards de acidente com urgência colorida e o contador batendo com a quantidade de cards.

---

### P1: Filtrar acidentes ⭐ MVP

**User Story**: As a gestor, I want to filter accidents by machine and period so that I can find a specific incident.

**Why P1**: Com dezenas de acidentes a lista sem filtro não serve.

**Acceptance Criteria**:

1. WHEN the user types in "Procurar Máquina" THEN the system SHALL show only cards whose machine name or code contains the trimmed text, ignoring case.
2. WHEN the user changes the start or end date THEN the system SHALL show only cards whose date is between them, inclusive.
3. IF the start date is after the end date THEN the system SHALL show no cards.
4. WHILE no card matches the filters the system SHALL show "Nenhum alerta encontrado" and the counter 0.

**Independent Test**: Digitar "EMP-084" e ver só os acidentes dessa máquina; estreitar o período e ver a lista diminuir.

---

### P1: Ver o detalhe da máquina a partir do alerta ⭐ MVP

**User Story**: As a gestor, I want to open the machine of an alert so that I see its full alert history.

**Why P1**: É o frame de detalhe da tela.

**Acceptance Criteria**:

1. WHEN the user clicks a card THEN the system SHALL open the machine detail modal of that card's machine with the "Histórico de Alertas" tab selected.
2. The system SHALL render the detail with the tabs "Histórico de alertas" then "Histórico de reparos", without the status badge and without the "Editar Máquina" and "Excluir Máquina" buttons.
3. WHEN the user closes the modal THEN the system SHALL return to the list with the filters unchanged.

**Independent Test**: Clicar num card de EMP-084 e ver o modal com a aba de alertas ativa e a linha do tempo de acidentes.

---

## Edge Cases

- IF the start date is after the end date THEN the system SHALL show "Nenhum alerta encontrado".
- IF a date input is cleared THEN the system SHALL treat that side of the period as open.
- WHEN the search has only spaces THEN the system SHALL show every card of the period.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ALRT-01 | P1: Ver os acidentes (AC 1, 2, 6) | Execute | Verified |
| ALRT-02 | P1: Ver os acidentes (AC 3) | Execute | Verified |
| ALRT-03 | P1: Ver os acidentes (AC 4) | Execute | Verified |
| ALRT-04 | P1: Ver os acidentes (AC 5) | Execute | Verified |
| ALRT-05 | P1: Filtrar acidentes (AC 1) | Execute | Verified |
| ALRT-06 | P1: Filtrar acidentes (AC 2, 3, 4) | Execute | Verified |
| ALRT-07 | P1: Detalhe (AC 1, 2, 3) | Execute | Verified |
| ALRT-08 | Todos: textos nos 7 idiomas | Execute | Verified |

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] `/alertas` reproduz o frame "Histórico de alertas" em 1440px.
- [ ] `yarn lint && yarn build && yarn test` passam sem teste removido.
