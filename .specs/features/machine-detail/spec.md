# Detalhe e Histórico da Máquina Specification

## Problem Statement

Na Visão Geral (`/`), clicar numa máquina não faz nada. O Figma (frames "Visão Geral Máquinas(Detalhe máquina)" `89:3800` e "Editar Máquina" `89:4995`) define um modal com os dados da máquina, o histórico de acidentes e de manutenção, e as ações Editar e Excluir. Tudo roda sobre dados mockados em memória, sem API.

## Goals

- [ ] Clicar num card da Visão Geral abre o modal de detalhe da máquina, igual ao Figma.
- [ ] As abas e o filtro de período do histórico funcionam sobre eventos mockados.
- [ ] "Editar Máquina" e "Excluir Máquina" funcionam sobre a lista em memória.
- [ ] Todo texto novo existe nos 7 idiomas.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Modal de detalhe da página Frota (`89:5761`, com Funcionário e abas de reparos/alertas) | Outra tela |
| Menu "⋮" do card | Sem frame no Figma |
| Integração com API e persistência entre recarregamentos | Dados mockados |
| Seletor de data em calendário customizado | Inputs `date` nativos bastam |
| Criar/editar eventos de histórico | Só leitura |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Escopo | Modal + Editar + Excluir | Escolha do dono | y |
| Histórico | Abas e período funcionam sobre mock | Escolha do dono | y |
| Abertura | Clique no corpo do card (padrão "stretched button"); o "⋮" continua sem ação | O Figma não define outra entrada | n |
| Período padrão | 14/07/2024 a 14/07/2026, como no Figma | Os eventos mockados caem nesse intervalo | n |
| Período invertido (início depois do fim) | Lista vazia com o estado vazio | Evita adivinhar a intenção | n |
| Tamanhos de texto | Escalados para legibilidade (10 a 14px) mantendo proporção; o frame usa 8 a 10px | Mesma decisão já tomada no restante do app | n |
| Ícones | Equivalentes do `lucide-react`, não os SVGs do Figma | AD-001: um único sistema de ícones | n |
| Nome do dispositivo e tempo de uso total | Campos novos no mock (`nomeDispositivo`, `tempoUsoTotalHoras`); máquina criada na UI nasce com 0 h | O modal os exibe e a lista atual não os tem | n |
| Excluir máquina | Confirmação com o `ConfirmDialog` existente; remove da lista e fecha o modal | Mesmo padrão da tela de Equipe | n |
| Editar máquina | Reusa o `NewMachinePanel` (mesmos campos do frame) com título "Editar Máquina" e botão "Editar Empilhadeira" | Os campos do frame de edição são os do cadastro | n |
| Máquina sem eventos | Estado vazio no histórico | Máquinas criadas na UI não têm histórico | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Abrir o detalhe da máquina ⭐ MVP

**User Story**: As a gestor, I want to open a machine's details from its card.

**Why P1**: É o pedido central.

**Acceptance Criteria**:

1. WHEN the user clicks a machine card THEN the system SHALL open a modal with the machine's nome, status badge, "Código: EMP-xxx(ID)" and "Mac: …".
2. The modal SHALL show an info card with Setor, Tempo Uso (Total) and Nome Dispositivo, each with its icon.
3. WHEN the user clicks the close icon, presses Escape or clicks the backdrop THEN the system SHALL close the modal.
4. WHILE the modal is open the system SHALL expose it as `role="dialog"` with `aria-modal` and the machine name as its label.
5. WHEN the user clicks the "⋮" button THEN the system SHALL NOT open the modal.

**Independent Test**: Clicar no card EMP-084 e ver o modal com os dados; Escape fecha.

---

### P1: Histórico de acidentes e de manutenção ⭐ MVP

**User Story**: As a gestor, I want to see a machine's accident and maintenance history, filtered by period.

**Why P1**: É o conteúdo que o pedido chama de "histórico".

**Acceptance Criteria**:

1. WHEN the modal opens THEN the system SHALL select the "Histórico de acidentes" tab and show that machine's accident events in a timeline, newest first.
2. WHEN the user clicks "Histórico de manutenção" THEN the system SHALL show the maintenance events instead and mark that tab as selected.
3. The system SHALL render each event with the operator name, the date as "dia da semana, dia mês ano" and "início ~ fim (duração)".
4. WHEN the user changes the start or end date THEN the system SHALL show only events whose date falls within the period, inclusive.
5. IF the start date is after the end date THEN the system SHALL show the empty state.
6. IF the machine has no events for the tab and period THEN the system SHALL show the empty-state message.
7. The tabs SHALL expose `role="tab"` with `aria-selected`.

**Independent Test**: Trocar para manutenção, mudar o fim do período para antes do primeiro evento e ver o estado vazio.

---

### P1: Editar e excluir a máquina ⭐ MVP

**User Story**: As a gestor, I want to edit or delete the machine from its details.

**Why P1**: Os dois botões do rodapé do Figma.

**Acceptance Criteria**:

1. WHEN the user clicks "Editar Máquina" THEN the system SHALL open the edit drawer titled "Editar Máquina" with Empilhadeira, Código, Setor, Nome Dispositivo and Endereço Mac filled in.
2. WHEN the user confirms the edit with Empilhadeira and Código filled THEN the system SHALL update the machine, close the drawer and show the new values on the card and in the detail modal.
3. WHEN the user cancels the edit THEN the system SHALL keep the machine unchanged.
4. WHEN the user clicks "Excluir Máquina" THEN the system SHALL open a confirmation naming the machine.
5. WHEN the user confirms THEN the system SHALL remove the machine from the grid and close both dialogs.
6. WHEN the user cancels the confirmation THEN the system SHALL keep the machine and keep the detail modal open.

**Independent Test**: Editar o setor de EMP-084 e ver o card atualizado; excluir EMP-084 e ver o card sumir.

---

### P2: Internacionalização

**User Story**: As a usuário de outro idioma, I want the modal in my language.

**Why P2**: O app já suporta 7 idiomas.

**Acceptance Criteria**:

1. The system SHALL read every visible text of the modal, the edit drawer and the delete confirmation from the translation files.
2. The system SHALL provide the new keys in pt-BR, en-US, es, fr, de, ja and ru.
3. The system SHALL format event dates and durations with the active language.

**Independent Test**: Trocar para en-US e abrir o modal; nenhum texto fica em português.

---

## Edge Cases

- WHEN a machine is edited while a search or status filter is active THEN the system SHALL keep the filter applied.
- IF the edited Código is empty THEN the system SHALL block the save.
- WHEN an event lasts a whole number of hours THEN the system SHALL show "N horas"; otherwise hours and minutes.
- IF the viewport is narrower than 520px THEN the modal SHALL fit the viewport and the history SHALL scroll inside it.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MACH-01 | P1: Abrir o detalhe | Design | Pending |
| MACH-02 | P1: Histórico | Design | Pending |
| MACH-03 | P1: Editar e excluir | Design | Pending |
| MACH-04 | P2: Internacionalização | Design | Pending |

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped ⚠️

---

## Success Criteria

- [ ] Todos os fluxos P1 e P2 passam em testes de componente e de página.
- [ ] `yarn lint`, `yarn build` e `yarn test` passam.
- [ ] O modal confere com o frame `89:3800` do Figma em desktop e mobile.
