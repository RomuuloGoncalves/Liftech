# Solicitações de acesso (lado do admin) Specification

## Problem Statement

A tela "Solicitar Acesso" grava solicitações (`accessRequest`, status `pendente`), mas ninguém as vê, aceita ou recusa. Hoje criar uma empresa nova exige rodar seed. A feature entrega uma tela para listar as solicitações e decidir cada uma; aceitar já cria a empresa, a matriz e o admin.

## Goals

- [ ] Uma rota `/solicitacoes` lista as solicitações por status (Pendentes, Aprovadas, Recusadas).
- [ ] Aceitar uma pendente cria `company`, `branch` matriz e `user` admin numa operação só e mostra a senha inicial uma única vez.
- [ ] Recusar uma pendente guarda um motivo opcional.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Autenticação e papel de admin nas rotas e na tela | Decisão do dono: sem auth por enquanto. As rotas levam o marcador `TEMP` para travar com `exigirAdmin` depois. |
| Link para `/solicitacoes` na Sidebar ou no Header | A tela é aberta pela URL, como as telas de auth. |
| Envio de e-mail ao solicitante (aceite, recusa, senha) | O projeto não tem infraestrutura de e-mail. Quem aprova repassa a senha. |
| Paginação, busca e filtros além da aba de status | Volume baixo; entra quando houver necessidade. |
| Desfazer uma decisão (reabrir, reenviar senha) | Decisão é final nesta versão. |
| Editar os dados da solicitação | A solicitação é o que o solicitante enviou. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Efeito do aceite | Cria empresa, filial matriz e admin | Dono escolheu essa opção | y |
| Senha inicial | Gerada pelo backend, devolvida em texto uma única vez; só o hash é gravado | Dono escolheu essa opção; não há e-mail | y |
| Conflito no aceite | 409, nada é criado, a solicitação segue pendente | Dono escolheu essa opção; evita dar admin de empresa real por formulário público | y |
| Motivo de recusa | Opcional, texto até 200 caracteres | Dono escolheu recusa com motivo opcional | y |
| Rotas sem auth | `GET`, `PUT /:id/aprovar` e `PUT /:id/recusar` públicas, marcadas `TEMP` | Dono pediu sem autenticação por enquanto | y |
| Nome da filial matriz | `Matriz` (mesmo nome do seed) | Mantém o padrão de `seedDataset` | n |
| Formato da senha gerada | 12 caracteres base64url (`randomBytes(9)`) | Passa o mínimo de 8 do projeto e dispensa caracteres ambíguos de teclado | n |
| Escopo do admin criado | `escopo: 'empresa'`, `role: 'admin'`, `nome` = `nomeAdministrador`, login por `email` | Mesmo formato do `seedAdmin` | n |
| Lista padrão | Sem `?status`, devolve só as pendentes, da mais antiga para a mais nova; com `?status`, a mais recente primeiro | A fila de trabalho é a de pendentes; FIFO | n |
| Aviso de risco | Qualquer pessoa com a URL consegue aprovar enquanto não houver auth | Consequência direta da decisão do dono | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Ver as solicitações ⭐ MVP

**User Story**: Como admin da plataforma, quero ver as solicitações de acesso por status para saber o que decidir.

**Why P1**: Sem a lista não há o que aceitar ou recusar.

**Acceptance Criteria**:

1. WHEN o cliente chama `GET /api/access-requests` sem `status` THEN the system SHALL responder 200 com as solicitações `pendente`, da mais antiga para a mais nova.  <!-- event-driven -->
2. WHEN o cliente chama `GET /api/access-requests?status=aprovada` (ou `recusada`, `pendente`) THEN the system SHALL responder 200 só com as desse status, da mais recente para a mais antiga.  <!-- event-driven -->
3. IF `status` não for `pendente`, `aprovada` ou `recusada` THEN the system SHALL responder 400 com a mensagem "O campo 'status' deve ser pendente, aprovada ou recusada.".  <!-- unwanted -->
4. WHEN o usuário abre `/solicitacoes` THEN the system SHALL mostrar a aba Pendentes com cada solicitação exibindo e-mail, empresa, administrador e data de envio.  <!-- event-driven -->
5. WHEN o usuário troca de aba THEN the system SHALL buscar e listar as solicitações do status da aba.  <!-- event-driven -->
6. IF a aba não tem solicitações THEN the system SHALL mostrar o texto de estado vazio da aba.  <!-- unwanted -->
7. WHILE a lista carrega the system SHALL mostrar o skeleton; IF a busca falhar THEN the system SHALL mostrar a mensagem de erro com o botão "Tentar novamente".  <!-- complex -->
8. The system SHALL servir `/solicitacoes` sem Sidebar e sem Header, como as telas de auth.  <!-- ubiquitous -->

**Independent Test**: Criar 3 solicitações em status diferentes e conferir cada aba em `/solicitacoes`.

---

### P1: Aceitar uma solicitação ⭐ MVP

**User Story**: Como admin da plataforma, quero aceitar uma solicitação para a empresa já nascer com matriz e administrador.

**Why P1**: É a razão da feature.

**Acceptance Criteria**:

1. WHEN o cliente chama `PUT /api/access-requests/:id/aprovar` numa solicitação `pendente` THEN the system SHALL criar a `company` (nome = `nomeEmpresa`), a `branch` `Matriz` com `matriz: true` e o `user` admin (`role: 'admin'`, `escopo: 'empresa'`, `nome` = `nomeAdministrador`, `email`, `empresaId`) e responder 200 com a solicitação (`status: 'aprovada'`, `empresaId`, `decididaEm`) e `senhaInicial`.  <!-- event-driven -->
2. The system SHALL gravar só o hash da senha inicial (12 caracteres) e devolver o texto apenas na resposta do aceite.  <!-- ubiquitous -->
3. WHEN o admin recém-criado faz `POST /api/auth/login` com o `email` e a `senhaInicial` THEN the system SHALL autenticá-lo.  <!-- event-driven -->
4. IF já existe `user` com o mesmo `email` THEN the system SHALL responder 409 "Já existe um usuário com este e-mail.", sem criar nada e mantendo a solicitação `pendente`.  <!-- unwanted -->
5. IF já existe `company` com o mesmo `nome` THEN the system SHALL responder 409 "Já existe uma empresa com este nome.", sem criar nada e mantendo a solicitação `pendente`.  <!-- unwanted -->
6. IF a criação de qualquer das três entidades falhar THEN the system SHALL desfazer as já criadas, manter a solicitação `pendente` e responder o erro.  <!-- unwanted -->
7. IF a solicitação não está `pendente` THEN the system SHALL responder 409 "Solicitação já decidida." sem criar nada; IF o id não existe THEN the system SHALL responder 404 "Solicitação não encontrada."; IF o id for inválido THEN the system SHALL responder 400.  <!-- unwanted -->
8. IF duas chamadas de aceite chegarem juntas para a mesma solicitação THEN the system SHALL concluir exatamente uma e responder 409 à outra.  <!-- unwanted -->
9. WHEN o usuário clica em Aceitar e confirma THEN the system SHALL chamar o aceite, mover a solicitação para fora de Pendentes e abrir um modal com o e-mail e a senha inicial, um botão copiar e o aviso de que ela não aparece de novo.  <!-- event-driven -->
10. IF o aceite responder 409 THEN the system SHALL mostrar a mensagem do conflito (e-mail ou empresa) e manter a solicitação na lista; IF falhar por outro motivo THEN the system SHALL mostrar o erro genérico de salvar.  <!-- unwanted -->

**Independent Test**: Aceitar uma pendente, ver o modal da senha e entrar em `/login` com o e-mail e essa senha.

---

### P1: Recusar uma solicitação ⭐ MVP

**User Story**: Como admin da plataforma, quero recusar uma solicitação, opcionalmente dizendo o motivo.

**Why P1**: Metade do "aceitar e recusar" pedido.

**Acceptance Criteria**:

1. WHEN o cliente chama `PUT /api/access-requests/:id/recusar` numa solicitação `pendente` THEN the system SHALL responder 200 com `status: 'recusada'`, `decididaEm` e o `motivoRecusa` informado, sem criar empresa nem usuário.  <!-- event-driven -->
2. The system SHALL cortar espaços do `motivo` e gravá-lo sem texto quando vier vazio ou ausente.  <!-- ubiquitous -->
3. IF o `motivo` não for texto ou passar de 200 caracteres THEN the system SHALL responder 400 com "O campo 'motivo' deve ser texto de até 200 caracteres.".  <!-- unwanted -->
4. IF a solicitação não está `pendente` THEN the system SHALL responder 409 "Solicitação já decidida."; IF o id não existe THEN the system SHALL responder 404 "Solicitação não encontrada."; IF o id for inválido THEN the system SHALL responder 400.  <!-- unwanted -->
5. WHEN o usuário clica em Recusar THEN the system SHALL abrir um diálogo com campo de motivo opcional (até 200 caracteres) e, ao confirmar, recusar a solicitação e removê-la de Pendentes.  <!-- event-driven -->
6. IF a recusa falhar THEN the system SHALL mostrar o erro genérico de salvar e manter a solicitação na lista.  <!-- unwanted -->
7. WHERE a solicitação está na aba Recusadas e tem motivo, the system SHALL mostrar o motivo no card.  <!-- optional -->

**Independent Test**: Recusar uma pendente com motivo e ver o card na aba Recusadas com o texto.

---

### P2: Textos nos 7 idiomas

**User Story**: Como usuário de qualquer idioma suportado, quero a tela traduzida.

**Why P2**: Convenção do projeto (AD-006); não bloqueia o fluxo.

**Acceptance Criteria**:

1. The system SHALL ter todas as chaves novas (`accessRequests.*`) nos 7 `locales/*/translation.json`, e o teste de i18n SHALL falhar se faltar alguma.  <!-- ubiquitous -->

**Independent Test**: `yarn test` no Frontend passa com o teste de i18n incluindo as chaves.

---

## Edge Cases

- IF o aceite do mesmo e-mail for pedido depois de uma recusa (nova solicitação, pois `POST` só barra pendente) THEN the system SHALL tratar como solicitação independente.
- IF o `nomeEmpresa` tiver espaços nas pontas THEN the system SHALL comparar e gravar o nome já sem eles (o POST já grava cortado).
- WHEN a aba mostra uma solicitação decidida em outra sessão e o admin age nela THEN the system SHALL tratar o 409 "já decidida" e recarregar a lista.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ACCR-01 | P1: Ver, AC 1-3 (API lista) | Specify | Pending |
| ACCR-02 | P1: Ver, AC 4-8 (tela lista) | Specify | Pending |
| ACCR-03 | P1: Aceitar, AC 1-3 (cria e senha) | Specify | Pending |
| ACCR-04 | P1: Aceitar, AC 4-8 (conflitos e atomicidade) | Specify | Pending |
| ACCR-05 | P1: Aceitar, AC 9-10 (tela aceita) | Specify | Pending |
| ACCR-06 | P1: Recusar, AC 1-4 (API recusa) | Specify | Pending |
| ACCR-07 | P1: Recusar, AC 5-7 (tela recusa) | Specify | Pending |
| ACCR-08 | P2: i18n | Specify | Pending |

**Coverage:** 8 total, 0 mapped to tasks, 8 unmapped ⚠️

---

## Success Criteria

- [ ] Uma solicitação criada em `/solicitar-acesso` é aceita em `/solicitacoes` e o admin criado entra em `/login` com a senha mostrada.
- [ ] `yarn test` no Backend e no Frontend, `tsc -b` e `eslint` passam.
