# Gerenciamento da Frota (Kanban) Specification

## Problem Statement

`/frota` hoje mostra só "Em construção". O Figma (frames "Frota(Gestão da Frota)", "Criar Categoria", "Selecionar Máquinas" x2 e "Detalhe Máquina") define um kanban horizontal: cada categoria é uma linha com os cards das máquinas, e o gestor organiza a frota arrastando cards entre linhas, criando categorias e adicionando máquinas a elas. Tudo roda sobre dados mockados em memória.

## Goals

- [ ] O gestor vê as máquinas agrupadas por categoria em linhas horizontais, igual ao Figma.
- [ ] O gestor move uma máquina de categoria arrastando o card (ou pelo menu ⋮, sem mouse).
- [ ] O gestor cria e exclui categorias e adiciona máquinas sem categoria a uma linha.
- [ ] Clicar num card abre o detalhe da máquina.
- [ ] Todo texto novo existe nos 7 idiomas.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Reordenar cards dentro da mesma linha | Não pedido; soltar sempre coloca no fim da linha |
| Mudar o status da máquina ao mover | Decisão do dono: categoria não altera status |
| Editar categoria (renomear/trocar cor) | Sem frame no Figma |
| Excluir as 4 categorias iniciais | O Figma só mostra "Excluir categoria" na categoria criada |
| Seletor "Filiais" da sidebar | Outra feature |
| Integração com API e persistência entre recarregamentos | Dados mockados |
| Editar/excluir máquina a partir do detalhe | O frame de Frota não tem esses botões |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Layout | Cada categoria é uma linha; os cards rolam na horizontal dentro dela | Pedido do dono ("kanban na horizontal") | y |
| Pertencimento | Manual: cada máquina fica em no máximo uma categoria; o status só define a posição inicial | Escolha do dono | y |
| Status x categoria | Mover não altera o status da máquina | Escolha do dono | y |
| Última linha do Figma ("Todas") | É o exemplo de uma categoria recém-criada; não existe linha "Todas" fixa | Escolha do dono | y |
| "+" de dentro da linha | Abre "Selecione as máquinas" listando só máquinas sem categoria | Indicação do dono | y |
| "+" de fora e "Cadastrar categoria" | Os dois abrem "Criar Categoria" | Indicação do dono | y |
| Categorias iniciais | Acidentes, Ativas, Manutenção, Disponíveis, nessa ordem, com as cores do Figma (vermelho, azul, amarelo, verde) | Frame do Figma | n |
| Posição inicial | EMP-081, EMP-085 e EMP-089 (lista fixa no mock) → Acidentes; das demais: Em uso → Ativas; Manutenção → Manutenção; Disponível → Disponíveis; Offline → sem categoria | Todas as máquinas do mock têm acidente no histórico, então a regra por acidente lotaria a linha; a lista fixa reproduz o frame | n |
| Conteúdo do card | Varia pelo tipo da linha, como no Figma: Acidentes = data/hora do último acidente + "Urgente"; Ativas = tempo de sessão; Manutenção = endereço MAC; Disponíveis = horas totais semanais; categoria criada = só setor e funcionário | Cada linha do frame mostra campos diferentes | n |
| Campo sem valor no card | Mostra "(Indefinido)" | Texto usado no frame (linha Disponíveis) | n |
| Arrastar e soltar | API nativa de drag and drop do HTML; soltar numa linha coloca o card no fim dela | Sem dependência nova; reordenar está fora do escopo | n |
| Alternativa sem mouse | O ⋮ do card abre um menu "Mover para" com as outras categorias e "Remover da categoria" | Drag nativo não funciona com teclado nem toque; o ⋮ existe no frame sem ação definida | n |
| Excluir categoria | Só categorias criadas; pede confirmação (`ConfirmDialog` existente); as máquinas dela ficam sem categoria | Figma + mesmo padrão da tela de Equipe | n |
| Nome da categoria | Obrigatório, até 30 caracteres, sem repetir nome existente (ignorando maiúsculas e espaços nas pontas) | Evita linhas duplicadas | n |
| Cor da categoria | 7 cores prontas do frame (azul, verde, amarelo, laranja, roxo, rosa, ciano) ou hex `#RRGGBB`; padrão azul | Frame "Criar Categoria" | n |
| Nova categoria | Entra no fim da lista, vazia | Frame mostra a nova linha por último | n |
| Busca do topo | Filtra os cards de todas as linhas por nome ou código | Campo "Search..." do frame | n |
| Filtro "All" do topo | Mostra todas as linhas ou só a categoria escolhida | Dropdown do frame | n |
| Busca da linha ("Procurar Máquina") | Filtra só os cards daquela linha por nome ou código | Campo de cada linha | n |
| Período da linha | Aparece só na linha Acidentes e filtra pela data do acidente; padrão 14/07/2024 a 14/07/2026 | Nas outras linhas não há data para filtrar; mostrar um controle sem efeito confundiria | n |
| Contador da linha | O selo ao lado do nome mostra quantas máquinas a categoria tem | Selo "10" do frame | n |
| Detalhe da máquina | Reusa o `MachineDetailModal` numa variante de Frota: linhas Setor, Funcionário, Tempo Uso (Sessão), Nome Dispositivo; abas "Histórico de reparos" (eventos de manutenção) e "Histórico de alertas" (acidentes); sem botões Editar/Excluir | Frame "Frota(Detalhe Máquina)" | n |
| Título da página | "Gerenciamento das máquinas" | Frame principal | n |
| Estado | Local da página Frota, em memória; recarregar volta ao mock | Mesmo padrão das outras telas; não compartilha com a Visão Geral porque nada altera a máquina | n |
| Tamanhos | Os do frame em 1440px | O dono pede fidelidade ao Figma | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Ver a frota em linhas por categoria ⭐ MVP

**User Story**: As a gestor, I want to see my machines grouped by category in horizontal rows so that I understand the state of the fleet at a glance.

**Why P1**: É a tela em si; todo o resto depende dela.

**Acceptance Criteria**:

1. WHEN the user opens `/frota` THEN the system SHALL render the title "Gerenciamento das máquinas" and the rows Acidentes, Ativas, Manutenção and Disponíveis in this order.
2. WHEN the page loads THEN the system SHALL place each mock machine in the row given by the initial-placement rule, and leave Offline machines without category.
3. The system SHALL show, in each row label, the category name, its color and the count of machines in that row.
4. WHEN a row has more cards than fit in its width THEN the system SHALL scroll the cards horizontally inside the row.
5. The system SHALL render each card with the fields defined for its row type, showing "(Indefinido)" for missing values.
6. WHILE a row has no machines the system SHALL show only the centered "+" button inside it.

**Independent Test**: Abrir `/frota` e ver as 4 linhas com os cards do mock nas linhas certas.

---

### P1: Mover máquinas entre categorias ⭐ MVP

**User Story**: As a gestor, I want to drag a card to another row so that I can reorganize the fleet.

**Why P1**: É o motivo de existir um kanban.

**Acceptance Criteria**:

1. WHEN the user drops a card on another row THEN the system SHALL move the machine to the end of that row and update both counters.
2. WHEN the user drops a card on its own row THEN the system SHALL keep the order unchanged.
3. WHEN the user picks a category in the card's "Mover para" menu THEN the system SHALL move the machine to the end of that row.
4. WHEN the user picks "Remover da categoria" THEN the system SHALL remove the machine from its row and make it available in "Selecione as máquinas".
5. The system SHALL keep each machine in at most one category.
6. The system SHALL NOT change the machine's status when it moves.

**Independent Test**: Arrastar um card de Ativas para Manutenção e ver os contadores mudarem; repetir pelo menu ⋮.

---

### P1: Criar categoria ⭐ MVP

**User Story**: As a gestor, I want to create a category with a name and a color so that I can group machines my own way.

**Why P1**: O "+" de fora e o "Cadastrar categoria" são entradas principais do frame.

**Acceptance Criteria**:

1. WHEN the user clicks "Cadastrar categoria" or the "+" below the rows THEN the system SHALL open the "Criar Categoria" modal.
2. WHEN the user clicks the color square THEN the system SHALL open a popover with the 7 preset colors and a hex input.
3. WHEN the user submits a valid name and color THEN the system SHALL append an empty row with that name and color and close the modal.
4. IF the name is empty after trimming THEN the system SHALL show "Campo obrigatório" and keep the modal open.
5. IF the name matches an existing category ignoring case and surrounding spaces THEN the system SHALL show "Já existe uma categoria com esse nome" and keep the modal open.
6. The system SHALL limit the name input to 30 characters.
7. IF the hex input is not `#RRGGBB` THEN the system SHALL keep the previous color.
8. WHEN the user clicks "Cancelar", the close icon or presses Escape THEN the system SHALL close the modal without creating a category.

**Independent Test**: Criar "Reserva" verde e ver a nova linha vazia no fim.

---

### P1: Adicionar máquinas sem categoria a uma linha ⭐ MVP

**User Story**: As a gestor, I want to add machines that are in no category to a row so that no machine is left out.

**Why P1**: Sem isso uma categoria nova fica vazia para sempre e máquinas Offline nunca entram no quadro.

**Acceptance Criteria**:

1. WHEN the user clicks the "+" inside a row THEN the system SHALL open "Selecione as máquinas" listing only machines without category.
2. WHEN the user types in "Procurar..." THEN the system SHALL filter the list by machine code or name.
3. WHEN the user toggles a machine in the list THEN the system SHALL add or remove its chip in the selection field and its check mark.
4. WHEN the user clicks the "x" on a chip THEN the system SHALL unselect that machine.
5. WHEN the user clicks "Confirmar" THEN the system SHALL append the selected machines to that row and close the modal.
6. IF no machine is without category THEN the system SHALL show "Todas as máquinas já estão em uma categoria" and disable "Confirmar".
7. WHILE no machine is selected the system SHALL disable "Confirmar".

**Independent Test**: Numa categoria nova, adicionar EMP-086 (Offline) e vê-la aparecer na linha.

---

### P2: Excluir categoria criada

**User Story**: As a gestor, I want to delete a category I created so that the board stays tidy.

**Why P2**: Útil, mas o quadro funciona sem.

**Acceptance Criteria**:

1. WHERE a category was created by the user the system SHALL show the "Excluir categoria" button in its row.
2. The system SHALL NOT show "Excluir categoria" on the 4 initial categories.
3. WHEN the user clicks "Excluir categoria" THEN the system SHALL ask for confirmation.
4. WHEN the user confirms THEN the system SHALL remove the row and leave its machines without category.

**Independent Test**: Criar uma categoria, adicionar uma máquina, excluir e ver a máquina de volta em "Selecione as máquinas".

---

### P2: Filtrar o quadro

**User Story**: As a gestor, I want to search and filter the board so that I find a machine quickly.

**Why P2**: Com poucas máquinas no mock o quadro é usável sem filtro.

**Acceptance Criteria**:

1. WHEN the user types in the top "Search..." THEN the system SHALL show, in every row, only cards whose name or code contains the text, ignoring case.
2. WHEN the user picks a category in the "All" dropdown THEN the system SHALL show only that row.
3. WHEN the user types in a row's "Procurar Máquina" THEN the system SHALL filter only that row's cards by name or code.
4. WHEN the user changes the period on the Acidentes row THEN the system SHALL show only machines whose last accident falls inside the period, inclusive.
5. The system SHALL keep the row counter equal to the total machines in the category, regardless of filters.
6. WHEN the user deletes the category selected in the "All" dropdown THEN the system SHALL reset the dropdown to all categories.

**Independent Test**: Buscar "085" e ver só EMP-085 no quadro.

---

### P2: Ver o detalhe da máquina

**User Story**: As a gestor, I want to open a machine from its card so that I see its data and history.

**Why P2**: O detalhe já existe na Visão Geral; aqui é uma variante.

**Acceptance Criteria**:

1. WHEN the user clicks a card body THEN the system SHALL open the machine detail modal with name, status badge, Código and Mac.
2. The modal SHALL show the rows Setor, Funcionário, Tempo Uso (Sessão) and Nome Dispositivo.
3. The modal SHALL show the tabs "Histórico de reparos" and "Histórico de alertas" and the period filter.
4. The modal SHALL NOT show the "Editar Máquina" and "Excluir Máquina" buttons.
5. WHEN the user clicks the card's "⋮" or drags the card THEN the system SHALL NOT open the modal.

**Independent Test**: Clicar num card e ver o modal sem botões de editar/excluir.

---

## Edge Cases

- WHEN the user drags a card and drops it outside any row THEN the system SHALL keep the machine where it was.
- WHEN the user deletes a category while one of its machines is open in the detail modal THEN the system SHALL keep the modal open with the machine data.
- IF every machine already has a category THEN the system SHALL still allow opening "Selecione as máquinas" and show the empty message.
- WHEN a filter hides every card of a row THEN the system SHALL show "Nenhuma máquina encontrada" in that row instead of the "+" empty state.

---

## Implicit-Requirement Sweep

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | CAT-04..07 (nome obrigatório, único, 30 caracteres; hex `#RRGGBB`) |
| Failure / partial-failure states | N/A because there is no API; every change is a synchronous in-memory update |
| Idempotency / duplicates | MOVE-05 (no máximo uma categoria por máquina), ADD-01 (só lista máquinas sem categoria), CAT-05 (nome único) |
| Auth boundaries & rate limits | N/A because the app has no authentication yet; the screen is admin-only by navigation |
| Concurrency / ordering | MOVE-01 (soltar sempre no fim); single user, in-memory, no concurrent writers |
| Data lifecycle | DEL-04 (excluir categoria libera as máquinas); recarregar volta ao mock (assumption) |
| Observability | N/A because there is no backend or telemetry in the frontend |
| External-dependency failure | N/A because no external calls are made |
| State-transition integrity | MOVE-02, MOVE-06 (soltar na mesma linha não muda nada; mover não altera status) |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| BOARD-01 | P1: Ver a frota AC1 | Execute | Verified |
| BOARD-02 | P1: Ver a frota AC2 | Execute | Verified |
| BOARD-03 | P1: Ver a frota AC3 | Execute | Verified |
| BOARD-04 | P1: Ver a frota AC4 | Execute | Verified |
| BOARD-05 | P1: Ver a frota AC5 | Execute | Verified |
| BOARD-06 | P1: Ver a frota AC6 | Execute | Verified |
| MOVE-01 | P1: Mover máquinas AC1 | Execute | Verified |
| MOVE-02 | P1: Mover máquinas AC2 | Execute | Verified |
| MOVE-03 | P1: Mover máquinas AC3 | Execute | Verified |
| MOVE-04 | P1: Mover máquinas AC4 | Execute | Verified |
| MOVE-05 | P1: Mover máquinas AC5 | Execute | Verified |
| MOVE-06 | P1: Mover máquinas AC6 | Execute | Verified |
| CAT-01 | P1: Criar categoria AC1 | Execute | Verified |
| CAT-02 | P1: Criar categoria AC2 | Execute | Verified |
| CAT-03 | P1: Criar categoria AC3 | Execute | Verified |
| CAT-04 | P1: Criar categoria AC4 | Execute | Verified |
| CAT-05 | P1: Criar categoria AC5 | Execute | Verified |
| CAT-06 | P1: Criar categoria AC6 | Execute | Verified |
| CAT-07 | P1: Criar categoria AC7 | Execute | Verified |
| CAT-08 | P1: Criar categoria AC8 | Execute | Verified |
| ADD-01 | P1: Adicionar máquinas AC1 | Execute | Verified |
| ADD-02 | P1: Adicionar máquinas AC2 | Execute | Verified |
| ADD-03 | P1: Adicionar máquinas AC3 | Execute | Verified |
| ADD-04 | P1: Adicionar máquinas AC4 | Execute | Verified |
| ADD-05 | P1: Adicionar máquinas AC5 | Execute | Verified |
| ADD-06 | P1: Adicionar máquinas AC6 | Execute | Verified |
| ADD-07 | P1: Adicionar máquinas AC7 | Execute | Verified |
| DEL-01 | P2: Excluir categoria AC1 | Execute | Verified |
| DEL-02 | P2: Excluir categoria AC2 | Execute | Verified |
| DEL-03 | P2: Excluir categoria AC3 | Execute | Verified |
| DEL-04 | P2: Excluir categoria AC4 | Execute | Verified |
| FILTER-01 | P2: Filtrar o quadro AC1 | Execute | Verified |
| FILTER-02 | P2: Filtrar o quadro AC2 | Execute | Verified |
| FILTER-03 | P2: Filtrar o quadro AC3 | Execute | Verified |
| FILTER-04 | P2: Filtrar o quadro AC4 | Execute | Verified |
| FILTER-05 | P2: Filtrar o quadro AC5 | Execute | Verified |
| FILTER-06 | P2: Filtrar o quadro AC6 | Execute | Verified |
| DETAIL-01 | P2: Ver detalhe AC1 | Execute | Verified |
| DETAIL-02 | P2: Ver detalhe AC2 | Execute | Verified |
| DETAIL-03 | P2: Ver detalhe AC3 | Execute | Verified |
| DETAIL-04 | P2: Ver detalhe AC4 | Execute | Verified |
| DETAIL-05 | P2: Ver detalhe AC5 | Execute | Verified |

**ID format:** `<STORY>-<AC number>` (e.g. `MOVE-03` = story "Mover máquinas", AC 3).

**Coverage:** 42 total, 0 mapped to tasks, 41 unmapped (Tasks phase pending).

---

## Success Criteria

- [ ] Em 1440x900, `/frota` e os 3 modais batem com os frames do Figma.
- [ ] Mover uma máquina leva um arrasto ou dois cliques (⋮ → categoria).
- [ ] Nenhuma máquina aparece em duas linhas em nenhum fluxo.
