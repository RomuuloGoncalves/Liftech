# Gestão de Equipe e Setores Specification

## Problem Statement

A rota `/equipe` é um placeholder ("Em construção"). O gestor precisa cadastrar, editar, buscar, liberar/bloquear acesso e excluir funcionários, e manter os setores da operação. O backend ainda não expõe esses recursos, então a tela roda sobre dados mockados em memória, seguindo o padrão de `VisaoGeralPage` e `src/data/machines.ts`.

## Goals

- [ ] `/equipe` mostra as duas seções do Figma (Funcionários e Setores), cada uma com busca e botão de cadastro.
- [ ] Todas as ações (criar, editar, excluir, alternar acesso, visualizar setor) funcionam sobre estado local, sem chamada de API.
- [ ] Todo texto novo existe nos 7 idiomas já suportados.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Integração com API / Backend | Pedido explícito: dados mockados por enquanto |
| Persistência entre recarregamentos | Estado só em memória, igual a `VisaoGeralPage` |
| Autenticação real, hash de senha, aplicação do "Acesso" no login | Depende do backend |
| Vínculo funcionário ↔ setor | Os prints não mostram esse vínculo |
| Upload de foto do funcionário | O avatar é um ícone fixo nos prints |
| Seletor de filial, ícones do Header, rodapé da Sidebar | Casca da aplicação, fora desta tela |
| Paginação / scroll virtual | Volume mockado pequeno |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Frames do Figma "Cadastrar Funcionário" e "Editar Setor" | Títulos dos frames estão trocados (copiados do outro modal); usar "Cadastrar funcionário" e "Editar setor" | Texto do Figma parece cópia; os títulos escolhidos combinam com a ação | n |
| Lápis do card de setor | Abre edição (modal de cadastro preenchido, título "Editar setor"); clicar no corpo do card abre "Informações do setor" (somente leitura) | Os prints trazem os dois modais | y |
| Dropdown "All" dos funcionários | Filtra por Acesso: Todos / Permitido / Negado | Único estado visível no card além de nome e ID | y |
| Excluir | Diálogo de confirmação "Excluir X?" com Cancelar/Excluir | Evita perda por clique errado; não está nos prints | y |
| Busca de funcionários | Casa nome, matrícula e cargo (sem diferenciar maiúsculas) | Mesmo critério de `filterMachines` | n |
| Busca de setores | Casa nome e unidade | Mesmo critério | n |
| Matrícula (`EMP-084`) | Gerada automaticamente, só leitura | Não há campo no formulário do Figma | n |
| Cadastrar funcionário | Mesmo modal da edição, vazio, título "Cadastrar funcionário"; novo funcionário nasce com Acesso Permitido | Os prints só mostram "Editar"; manter um formulário só | n |
| Horário de saída anterior à entrada | Aceito (turno noturno) | Evita rejeitar turnos que viram o dia | n |
| Usuário duplicado | Rejeitado com mensagem de erro no campo | Usuário identifica o login | n |
| Senha no mock | Guardada em texto puro e preenchida na edição, como no print | Só mock; ver Riscos no design | n |
| Campos obrigatórios | Funcionário: nome, cargo, usuário, senha. Telefone e horários opcionais. Setor: nome e unidade | Telefone e horários não bloqueiam o cadastro operacional | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Listar, buscar e filtrar funcionários ⭐ MVP

**User Story**: As a gestor, I want to see and search my employees so that I find who I need quickly.

**Why P1**: Sem a lista não há tela.

**Acceptance Criteria**:

1. The system SHALL render the employees section as a card grid, each card showing avatar, nome, matrícula e "Acesso: Permitido|Negado".
2. WHEN the user types in the employee search field THEN the system SHALL show only employees whose nome, matrícula or cargo contains the text, ignoring case.
3. WHEN the user selects "Permitido" or "Negado" in the access filter THEN the system SHALL show only employees with that access.
4. WHEN search and filter are both active THEN the system SHALL apply both.
5. IF no employee matches THEN the system SHALL show the empty-state message.

**Independent Test**: Abrir `/equipe`, digitar "carlos" e escolher "Negado"; a lista reflete os dois critérios.

---

### P1: Alternar acesso do funcionário ⭐ MVP

**User Story**: As a gestor, I want to allow or deny an employee's access with one click.

**Why P1**: É a ação mais frequente da tela.

**Acceptance Criteria**:

1. WHEN the user clicks an employee's toggle THEN the system SHALL flip that employee's access between Permitido and Negado.
2. WHEN access changes THEN the system SHALL update the card label ("Acesso: Permitido|Negado") and its color immediately.
3. WHILE the access filter is "Permitido" or "Negado" the system SHALL drop from view a card whose access no longer matches.
4. The toggle SHALL expose its state to assistive technology (role `switch` with `aria-checked`).

**Independent Test**: Clicar no toggle de um card "Permitido"; o card passa a "Negado" e o switch fica desligado.

---

### P1: Cadastrar e editar funcionário ⭐ MVP

**User Story**: As a gestor, I want to create and edit employees through a modal.

**Why P1**: Sem criar/editar a tela só lê.

**Acceptance Criteria**:

1. WHEN the user clicks "Cadastrar Funcionário" THEN the system SHALL open a modal with empty fields: nome, telefone, cargo, horário de entrada, horário de saída, usuário e senha.
2. WHEN the user clicks the pencil on an employee card THEN the system SHALL open the modal titled "Editar informações do funcionário" with that employee's values filled in.
3. WHEN the user confirms a valid form THEN the system SHALL save the employee, close the modal and show the change in the grid.
4. WHEN a new employee is saved THEN the system SHALL assign the next matrícula and set access to Permitido.
5. IF nome, cargo, usuário or senha is empty THEN the system SHALL block the save and mark the field as required.
6. IF the usuário already belongs to another employee THEN the system SHALL block the save and show an error on that field.
7. WHEN the user clicks the eye icon THEN the system SHALL toggle the password between hidden and visible.
8. WHEN the user clicks "Cancelar", the close icon, the backdrop or presses Escape THEN the system SHALL close the modal without saving.
9. WHILE the modal is open the system SHALL expose it as `role="dialog"` with `aria-modal` and a label.
10. WHEN the user clicks the body of an employee card THEN the system SHALL open "Informações do funcionário" with all fields read-only (password hidden, eye icon toggles it) and no action buttons.

**Independent Test**: Cadastrar "Maria" com campos obrigatórios; ela aparece no grid com Acesso Permitido. Editar o cargo dela; o card reflete.

---

### P1: Listar, buscar, cadastrar, editar e visualizar setores ⭐ MVP

**User Story**: As a gestor, I want to manage sectors in the same screen.

**Why P1**: É metade da tela.

**Acceptance Criteria**:

1. The system SHALL render the sectors section as a card grid, each card showing icon and nome.
2. WHEN the user types in the sector search field THEN the system SHALL show only sectors whose nome or unidade contains the text, ignoring case.
3. WHEN the user clicks "Cadastrar Setor" THEN the system SHALL open "Cadastrar um novo setor" with empty nome and unidade.
4. WHEN the user confirms a valid sector form THEN the system SHALL save the sector, close the modal and show it in the grid.
5. IF nome or unidade is empty THEN the system SHALL block the save and mark the field as required.
6. WHEN the user clicks the pencil on a sector card THEN the system SHALL open the same form filled in, titled "Editar setor", and save over the existing sector.
7. WHEN the user clicks the body of a sector card THEN the system SHALL open "Informações do setor" with nome and unidade read-only and no action buttons.
8. IF no sector matches the search THEN the system SHALL show the empty-state message.

**Independent Test**: Criar "Expedição B - Acesso 3" / "Unidade Votorantin"; abrir o card e ver o modal somente leitura.

---

### P2: Excluir funcionário e setor

**User Story**: As a gestor, I want to delete records I no longer need, safely.

**Why P2**: Completa o CRUD; o MVP já é usável sem isso.

**Acceptance Criteria**:

1. WHEN the user clicks the trash icon on a card THEN the system SHALL open a confirmation naming the employee or sector.
2. WHEN the user confirms THEN the system SHALL remove the item from the list and close the dialog.
3. WHEN the user cancels, presses Escape or clicks the backdrop THEN the system SHALL keep the item.

**Independent Test**: Excluir um setor, confirmar; o card some. Repetir cancelando; o card permanece.

---

### P2: Internacionalização

**User Story**: As a usuário de outro idioma, I want the screen in my language.

**Why P2**: O app já suporta 7 idiomas; texto novo não pode quebrar a paridade.

**Acceptance Criteria**:

1. The system SHALL read every visible text of the screen (títulos, rótulos, placeholders, botões, mensagens, `aria-label`) from the translation files.
2. The system SHALL provide the new keys in pt-BR, en-US, es, fr, de, ja and ru.

**Independent Test**: Trocar o idioma para en-US; nenhum texto da tela fica em português nem aparece como chave.

---

## Edge Cases

- IF the user edits an employee while search is active THEN the system SHALL keep the filter applied after saving.
- IF the user edits an employee keeping the same usuário THEN the system SHALL NOT report a duplicate.
- WHEN a modal opens THEN the system SHALL start with errors cleared, even if the previous attempt failed.
- IF the viewport is narrower than 768px THEN the system SHALL stack the grids in fewer columns and keep modals inside the viewport.
- IF the user presses Escape with a confirmation dialog open over nothing else THEN the system SHALL close only the confirmation.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TEAM-01 | P1: Listar, buscar e filtrar funcionários | Design | Pending |
| TEAM-02 | P1: Alternar acesso | Design | Pending |
| TEAM-03 | P1: Cadastrar e editar funcionário | Design | Pending |
| TEAM-04 | P1: Setores (lista, busca, cadastro, edição, leitura) | Design | Pending |
| TEAM-05 | P2: Excluir funcionário e setor | Design | Pending |
| TEAM-06 | P2: Internacionalização | Design | Pending |

**Coverage:** 6 total, 0 mapped to tasks, 6 unmapped ⚠️

---

## Success Criteria

- [ ] Todos os fluxos P1 e P2 passam em testes de componente e de página.
- [ ] `yarn lint`, `yarn build` e `yarn test` no Frontend passam.
- [ ] A tela confere visualmente com os 6 prints do Figma em desktop e mobile.
