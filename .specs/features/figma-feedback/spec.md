# Feedback e Sugestões Specification

## Problem Statement

O botão "Feedback & Sugestões" da sidebar do admin não tem ação (`Frontend/src/components/layout/Sidebar.tsx:219-230`), e a caixa de feedback das Configurações do funcionário não envia nada (`Frontend/src/pages/employee/EmployeeSettingsPage.tsx:66-76`). Além disso, o placeholder da caixa usa a chave `employee.settings.feedbackPlaceholder`, que não existe em nenhum dos 7 locales, então a tela mostra a própria chave. Não há rota no backend para receber feedback.

Telas do Figma: `figma-telas/admin/06-outros/01-feedback-e-sugestoes.png` (modal do admin) e a seção "Feedback & Sugestões" de `figma-telas/funcionario/09-configuracoes.png`.

**O que os PNGs mostram:**

- **Admin `06/01`:** modal branco centralizado (~470 px) sobre a Visão Geral desfocada. Título em duas linhas "Envie-nos feedback ou uma sugestão" à esquerda e um X à direita. Abaixo, o rótulo em negrito "Como foi sua experiência?", um textarea cinza-claro de ~140 px de altura com o placeholder "Digite um sugestão de uma melhoria ou um feedback!" e, centralizado embaixo, o botão azul "Enviar" (~136 × 34 px).
- **Funcionário `09`:** seção "Feedback & Sugestões" com um cartão branco, rótulo "Como foi sua experiência?" e textarea com o mesmo placeholder. O Figma **não** desenha botão de envio; logo abaixo vem o botão "Política e Privacidade".

## Goals

- [ ] O admin envia feedback pelo modal da sidebar e o funcionário pela caixa de Configurações, os dois pela mesma rota `POST /api/feedback`.
- [ ] Cada feedback enviado fica gravado com mensagem, usuário, empresa, papel e data, sem nenhum dado vindo do corpo além da mensagem.
- [ ] A caixa do funcionário deixa de mostrar a chave i18n crua: o placeholder aparece traduzido nos 7 locales.
- [ ] Backend e Frontend: `tsc`, `eslint` e `yarn test` continuam verdes, com 0 acesso ao banco nos testes (AD-010).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Tela para ler os feedbacks | O Figma só desenha o envio. O dono consulta pelo banco (contexto compartilhado). |
| Limite de envios por usuário (rate limit) | Só usuários autenticados enviam e o app não tem rate limit em nenhuma rota. Entra se aparecer abuso. |
| Anexos, nota (estrelas) ou categoria no feedback | Não existem no Figma. |
| Página de Política e Privacidade | Fora da lista do dono; o link segue indo ao 404. |
| Devolver o foco ao botão da sidebar ao fechar o modal | O `Modal` comum não faz isso em nenhum modal do app; muda para todos juntos, em outra entrega. |
| Texto longo da "Solicitação de alteração" do funcionário | Divergência de outra linha da auditoria, não desta tela. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Botão "Enviar" no funcionário | Entra um botão "Enviar" abaixo da caixa, à direita, no estilo do "Enviar" do modal. | Sem botão o texto não tem como sair da tela. Desvio do Figma `09`, decidido no contexto compartilhado. | n |
| Erro de digitação do Figma | O placeholder vira "Digite uma sugestão de melhoria ou um feedback!" (o Figma diz "Digite um sugestão de uma melhoria…"). | A auditoria marcou como typo do design. | n |
| Largura do modal | Usa o `Modal` comum sem mudança (até 550 px). O Figma mede ~470 px. | Todos os modais do app usam a mesma largura; mexer no `Modal` afeta as outras telas. | n |
| Resposta da rota | 201 com `{ _id, criadoEm }`. | O front só precisa saber que gravou; não há tela de leitura. | n |
| Usuário sem `empresaId` (dado antigo) | Grava com `empresaId` nulo em vez de recusar. | O feedback não depende de escopo; perder a mensagem por causa de dado legado não ajuda ninguém. | n |
| Tamanho da mensagem | 1 a 1000 caracteres depois do `trim`; o textarea limita a 1000 com `maxLength`. A mensagem é gravada já cortada. | Valor fixado no contexto compartilhado. | y (contexto) |
| Texto dos toasts | Sucesso: "Feedback enviado. Obrigado!". Erro: "Não foi possível enviar o feedback. Tente de novo." | O Figma não desenha o estado enviado nem o de erro. | n |
| Modal reaberto | Abre vazio. | O conteúdo só sobrevive enquanto o modal está aberto (falha de envio). | n |
| Abertura pelo drawer mobile | Clicar no botão com o drawer aberto fecha o drawer e abre o modal. | Senão o modal abre por baixo do overlay do drawer. | n |
| Papel gravado | O `role` do usuário autenticado (`admin` ou `colaborador`), lido de `req.usuario`. | O corpo nunca define quem enviou. | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Rota que recebe o feedback ⭐ MVP

**User Story**: As an admin or employee, I want my feedback saved on the server so that the team can read it later.

**Why P1**: Sem a rota, nenhuma das duas telas tem o que chamar.

**Acceptance Criteria**:

1. WHEN `POST /api/feedback` recebe `{ mensagem }` com 1 a 1000 caracteres depois do `trim`, de usuário autenticado, THEN the system SHALL gravar a mensagem cortada, o id do usuário, a empresa, o papel e a data atual e responder 201 com `{ _id, criadoEm }`  <!-- event-driven -->
2. IF `mensagem` faltar, não for texto, ficar vazia depois do `trim` ou passar de 1000 caracteres THEN the system SHALL responder 400 com "O campo 'mensagem' deve ter de 1 a 1000 caracteres." e não gravar  <!-- unwanted-behavior -->
3. IF a requisição chegar sem token válido THEN the system SHALL responder 401 e não gravar  <!-- unwanted-behavior -->
4. The system SHALL ler usuário, empresa e papel só do usuário autenticado, ignorando qualquer outro campo do corpo  <!-- ubiquitous -->

**Independent Test**: `curl -X POST /api/feedback` com token e `{"mensagem":"Teste"}` devolve 201; sem token devolve 401; com `{"mensagem":"  "}` devolve 400.

---

### P1: Modal de feedback do admin ⭐ MVP

**User Story**: As an admin, I want to open a feedback form from the sidebar so that I can report a problem or idea without leaving the screen.

**Why P1**: É a tela `06/01` do Figma e o botão hoje não faz nada.

**Acceptance Criteria**:

1. WHEN o admin clica em "Feedback & Sugestões" na sidebar (aberta ou recolhida) THEN the system SHALL abrir o modal com o título "Envie-nos feedback ou uma sugestão", o rótulo "Como foi sua experiência?", um textarea com o placeholder "Digite uma sugestão de melhoria ou um feedback!" e o botão "Enviar"  <!-- event-driven -->
2. WHEN o modal abre THEN the system SHALL pôr o foco no textarea  <!-- event-driven -->
3. WHEN o admin clica em "Enviar" com mensagem de 1 a 1000 caracteres depois do `trim` THEN the system SHALL chamar `feedbackService.enviar` com a mensagem cortada, fechar o modal e mostrar o toast "Feedback enviado. Obrigado!"  <!-- event-driven -->
4. IF a mensagem estiver vazia ou só com espaços THEN the system SHALL deixar "Enviar" desabilitado e não chamar a API  <!-- unwanted-behavior -->
5. IF o envio falhar THEN the system SHALL manter o modal aberto com o texto digitado e mostrar o toast de erro "Não foi possível enviar o feedback. Tente de novo."  <!-- unwanted-behavior -->
6. WHILE o envio está em andamento the system SHALL manter "Enviar" desabilitado, de modo que cliques repetidos gerem uma só chamada  <!-- state-driven -->
7. WHEN o admin clica no X, no fundo ou pressiona Esc THEN the system SHALL fechar o modal sem chamar a API  <!-- event-driven -->
8. The system SHALL limitar o textarea a 1000 caracteres  <!-- ubiquitous -->

**Independent Test**: No navegador, clicar no botão da sidebar abre o modal igual ao PNG; digitar e enviar fecha o modal, mostra o toast e o documento aparece na coleção `feedback`.

---

### P2: Envio pela caixa de Configurações do funcionário

**User Story**: As an employee, I want the feedback box in Settings to actually send what I type so that my suggestion reaches the team.

**Why P2**: A caixa já existe; falta o envio e a tradução do placeholder.

**Acceptance Criteria**:

1. The system SHALL mostrar o botão "Enviar" abaixo da caixa "Como foi sua experiência?" em Configurações  <!-- ubiquitous -->
2. WHEN o funcionário clica em "Enviar" com mensagem de 1 a 1000 caracteres depois do `trim` THEN the system SHALL chamar `feedbackService.enviar` com a mensagem cortada, limpar a caixa e mostrar o toast "Feedback enviado. Obrigado!"  <!-- event-driven -->
3. IF a mensagem estiver vazia ou só com espaços THEN the system SHALL deixar "Enviar" desabilitado e não chamar a API  <!-- unwanted-behavior -->
4. IF o envio falhar THEN the system SHALL manter o texto na caixa e mostrar o toast de erro "Não foi possível enviar o feedback. Tente de novo."  <!-- unwanted-behavior -->
5. WHILE o envio está em andamento the system SHALL manter "Enviar" desabilitado, de modo que cliques repetidos gerem uma só chamada  <!-- state-driven -->
6. The system SHALL limitar a caixa a 1000 caracteres  <!-- ubiquitous -->

**Independent Test**: Em `/funcionario/configuracoes`, digitar, clicar em "Enviar" e ver a caixa vazia, o toast e o documento com `role: "colaborador"`.

---

### P2: Textos nos 7 idiomas

**User Story**: As a user of any supported language, I want the feedback texts translated so that I never see a raw i18n key.

**Why P2**: Hoje o funcionário vê `employee.settings.feedbackPlaceholder` na tela.

**Acceptance Criteria**:

1. The system SHALL definir `employee.settings.feedbackPlaceholder` nos 7 locales (`de`, `en-US`, `es`, `fr`, `ja`, `pt-BR`, `ru`), com o texto pt-BR "Digite uma sugestão de melhoria ou um feedback!"  <!-- ubiquitous -->
2. The system SHALL definir o bloco `feedback` (`title`, `question`, `placeholder`, `send`, `sent`, `error`) nos 7 locales com as mesmas chaves do pt-BR  <!-- ubiquitous -->

**Independent Test**: Trocar o idioma para cada um dos 7 e abrir o modal e as Configurações: nenhum texto aparece como chave.

---

## Edge Cases

- WHEN a mensagem tem exatamente 1000 caracteres depois do `trim` THEN the system SHALL aceitar e responder 201.
- WHEN a mensagem tem espaços nas pontas e 1000 caracteres no meio THEN the system SHALL aceitar e gravar sem os espaços.
- IF o corpo traz `usuarioId`, `empresaId` ou `role` THEN the system SHALL ignorá-los e gravar os do token.
- IF o usuário autenticado não tem `empresaId` THEN the system SHALL gravar o feedback com `empresaId` nulo e responder 201.
- WHEN o admin clica no botão com o drawer mobile aberto THEN the system SHALL fechar o drawer e abrir o modal.
- IF o token expira durante o envio THEN the system SHALL seguir o interceptor existente de 401 (logout e `/login`), sem toast de sucesso.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FDB-01 | P1: Rota | Tasks | Pending |
| FDB-02 | P1: Rota | Tasks | Pending |
| FDB-03 | P1: Rota | Tasks | Pending |
| FDB-04 | P1: Rota | Tasks | Pending |
| FDB-05 | P1: Modal admin | Tasks | Pending |
| FDB-06 | P1: Modal admin | Tasks | Pending |
| FDB-07 | P1: Modal admin | Tasks | Pending |
| FDB-08 | P1: Modal admin | Tasks | Pending |
| FDB-09 | P1: Modal admin | Tasks | Pending |
| FDB-10 | P1: Modal admin | Tasks | Pending |
| FDB-11 | P1: Modal admin | Tasks | Pending |
| FDB-12 | P1: Modal admin | Tasks | Pending |
| FDB-13 | P2: Funcionário | Tasks | Pending |
| FDB-14 | P2: Funcionário | Tasks | Pending |
| FDB-15 | P2: Funcionário | Tasks | Pending |
| FDB-16 | P2: Funcionário | Tasks | Pending |
| FDB-17 | P2: Funcionário | Tasks | Pending |
| FDB-18 | P2: Funcionário | Tasks | Pending |
| FDB-19 | P2: Textos | Tasks | Pending |
| FDB-20 | P2: Textos | Tasks | Pending |

**ID format:** `FDB-NN`, na ordem dos critérios: rota 1-4 → FDB-01..04; modal 1-8 → FDB-05..12; funcionário 1-6 → FDB-13..18; textos 1-2 → FDB-19..20.

**Coverage:** 20 total, 20 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `yarn test` do Backend e do Frontend passam sem teste removido; `tsc` e `eslint` limpos.
- [ ] Cada FDB tem pelo menos um teste que falha se o comportamento quebrar.
- [ ] Em 1440 px, o modal bate com `06/01` (título, X, rótulo, textarea, "Enviar" azul centralizado), exceto a largura registrada nas Assumptions.
- [ ] O modal fica num chunk lazy: o bundle de entrada não cresce mais que 0,5 kB gzip.
