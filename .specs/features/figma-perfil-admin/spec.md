# Perfil do admin (Figma `02/07`) Specification

## Problem Statement

O avatar do cabeçalho do admin não faz nada (`Frontend/src/components/layout/Header.tsx:116-118`), e o Figma `admin/02-visao-geral-maquinas/07-gestao-da-frota-ativo-2.png` desenha ali o modal "Perfil" com e-mail, senha, "Excluir Conta" e "Deslogar-se". O backend não tem rota para o próprio usuário alterar e-mail, senha ou apagar a conta, e o login nem devolve o e-mail (`Backend/src/feature/auth/authService.ts:36-48`), então a tela não tem o que mostrar.

## O que o PNG mostra

Página "Visão geral das máquinas" desfocada ao fundo e, no centro, um cartão branco de cantos arredondados (~470 px) com:

- Cabeçalho: título "Perfil" à esquerda e X à direita, separado por uma linha.
- Linha "Email": rótulo à esquerda; à direita o valor (`exampleEmail@gmail.com`) e um lápis.
- Linha "Senha": rótulo à esquerda; à direita a senha mascarada (`*********`), um olho e um lápis.
- Rodapé: link de texto vermelho "Excluir Conta" à esquerda e botão vermelho preenchido, pequeno, "Deslogar-se" à direita.

## Confirmação: o Perfil é só do admin

- O `Header` só é montado no `AppShell` fora das rotas de login e de `/funcionario` (`Frontend/src/App.tsx:9-27`). A área do funcionário usa `EmployeeLayout`/`EmployeeHeader`, sem avatar de perfil.
- O funcionário já tem "Dados do usuário" somente leitura em `Frontend/src/pages/employee/EmployeeSettingsPage.tsx:44-63`, com aviso para pedir alteração ao supervisor.
- O colaborador loga por `usuario`, não tem e-mail (`Backend/src/feature/auth/authService.ts:19-21`, `Backend/src/schemas/user.ts:9-10`).
- Por isso as rotas `/api/me` recusam `role !== 'admin'` com 403, reusando `exigirAdmin` (`Backend/src/core/autenticar.ts:48-50`).

## Goals

- [ ] Clicar no avatar abre o modal "Perfil" igual ao PNG em 1440 px, menos o olho (ver Assumptions).
- [ ] O admin troca o próprio e-mail e a própria senha, e exclui a própria conta, sempre confirmando a senha atual.
- [ ] O último admin com login de uma empresa não consegue se excluir.
- [ ] Textos novos no namespace `profile.*` dos 7 locales.
- [ ] Backend: 0 acesso ao banco nos testes (models mockados, AD-010); `tsc`, `eslint` e as suítes dos dois pacotes verdes.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Perfil do funcionário | Já existe em `funcionario/09-configuracoes` (contexto compartilhado). |
| Mostrar a senha (olho) | A senha só existe como hash (`Backend/src/utils/senha.ts`); não há o que revelar. |
| Editar nome, telefone ou cargo do admin | O Figma só tem e-mail e senha. |
| Invalidar tokens antigos após troca de senha | O JWT é stateless; exigiria lista de revogação. Ver Risks no design. |
| Recuperação de senha | Fora da lista do dono. |
| Remover o botão de logout separado do cabeçalho | Divergência visual da auditoria, não desta tela; fica para o dono decidir (pergunta em aberto). |
| Confirmar o novo e-mail por mensagem | Não há envio de e-mail no projeto. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quem tem Perfil | Só o admin; `/api/me` responde 403 a colaborador. | Ver "Confirmação" acima. | y (código + Figma) |
| Olho da senha | Não aparece. A linha mostra `••••••••` e o lápis. | A senha é guardada só como hash. Desvio do Figma. | n |
| De onde vem o e-mail exibido | O login do admin passa a devolver `user.email`; o modal lê da sessão local. Sessão antiga sem `email` mostra "—" até o próximo login. | Evita uma rota `GET /api/me` só para um campo; o login já carrega o documento. | n |
| Editar e-mail e senha | O lápis troca o modal "Perfil" por um modal de edição com o campo novo e "Senha atual". | Trocar credencial sem a senha atual deixa uma sessão roubada trancar o dono fora. | n |
| Tamanho mínimo da senha nova | 8 caracteres, sem outras regras. | Contexto compartilhado. A senha inicial gerada pelo sistema já é maior. | n |
| Formato do e-mail | Mesma regex de `accessRequestRules.ts:14-16`, depois de `trim` e minúsculas. | Reusa a regra que já criou os e-mails de admin. | n |
| E-mail igual ao atual | Responde 200 e devolve o mesmo e-mail. | Contexto compartilhado (edge case). O índice único não reclama do próprio documento. | n |
| Excluir Conta | Modal de confirmação pede a senha atual; `DELETE /api/me` apaga só o documento `user`. | Empresa, filiais e dados continuam para os outros admins. | n |
| "Único admin" | Conta outros usuários da mesma `empresaId` com `role: 'admin'`, `email` existente e `acessoNegado` diferente de `true`. Se zero, 409. Admin sem `empresaId` também recebe 409. | Admin criado pela tela de Equipe não tem e-mail e não loga; não serve como substituto. Sem empresa não há como provar que existe outro. | n |
| Corpo extra em `PUT /api/me` | Só aceita `senhaAtual`, `email`, `novaSenha`; outro campo ou nenhum de `email`/`novaSenha` dá 400. | Mesma defesa contra atribuição em massa de `userController.ts:141-166`. | n |
| Senha atual errada | 403 com "Senha atual incorreta." (não 401). | O interceptor do axios desloga em 401 (`Frontend/src/services/api.ts:24-37`). | n |
| Ordem das checagens | Corpo (400) → papel (403) → senha atual (403) → conflito (409). | Erro de formato não depende de credencial; quem erra a senha não descobre se o e-mail existe. | n |
| Modal aninhado | O modal de edição substitui o "Perfil" na tela, em vez de abrir por cima. | `Modal` escuta Esc no `window` (`Modal.tsx:20-26`); dois abertos fechariam juntos. | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed). Para o dono, sem bloquear: remover o ícone de logout separado do cabeçalho agora que o Perfil tem "Deslogar-se"?

---

## User Stories

### P1: Ver o Perfil e sair ⭐ MVP

**User Story**: As an admin, I want to open my profile from the avatar so that I see my account and can log out.

**Why P1**: É o que o PNG mostra e não depende de rota nova além do e-mail no login.

**Acceptance Criteria**:

1. WHEN o admin clica no avatar do cabeçalho THEN the system SHALL abrir o modal "Perfil" com a linha "Email" (valor da sessão e botão de editar), a linha "Senha" (`••••••••` e botão de editar), o link "Excluir Conta" e o botão "Deslogar-se"  <!-- event-driven -->
2. WHEN o admin clica em "Deslogar-se" THEN the system SHALL chamar `authService.logout()` e navegar para `/login`  <!-- event-driven -->
3. WHEN o admin clica no X, no fundo ou pressiona Esc no modal "Perfil" THEN the system SHALL fechar o modal sem alterar nada  <!-- event-driven -->
4. WHEN o login de admin dá certo THEN the system SHALL incluir `email` no objeto `user` da resposta de `POST /api/auth/login`  <!-- event-driven -->
5. IF a sessão local não tiver `email` THEN the system SHALL mostrar "—" no valor da linha "Email"  <!-- unwanted-behavior -->
6. The system SHALL dar nome acessível traduzido aos botões de editar e-mail, editar senha e ao avatar  <!-- ubiquitous -->

**Independent Test**: Logar como admin, clicar no avatar, ver o e-mail do login; "Deslogar-se" leva a `/login`.

---

### P2: Trocar e-mail e senha

**User Story**: As an admin, I want to change my e-mail and password so that I control my access.

**Why P2**: Precisa da rota `PUT /api/me`.

**Acceptance Criteria**:

1. WHEN o admin confirma um novo e-mail com a senha atual correta THEN the system SHALL chamar `PUT /api/me` com `{ senhaAtual, email }`, gravar o e-mail em minúsculas e sem espaços nas pontas, atualizar o e-mail da sessão local, voltar ao modal "Perfil" com o novo valor e mostrar o toast "E-mail alterado"  <!-- event-driven -->
2. WHEN o admin confirma uma nova senha de 8 ou mais caracteres com a senha atual correta THEN the system SHALL chamar `PUT /api/me` com `{ senhaAtual, novaSenha }`, gravar o hash com `gerarHashSenha`, voltar ao modal "Perfil" e mostrar o toast "Senha alterada"  <!-- event-driven -->
3. IF `senhaAtual` não confere com o hash gravado THEN the system SHALL responder 403 "Senha atual incorreta." sem gravar, e o modal de edição SHALL continuar aberto com a mensagem "Senha atual incorreta"  <!-- unwanted-behavior -->
4. IF o novo e-mail já pertence a outro usuário THEN the system SHALL responder 409 sem gravar, e o modal de edição SHALL mostrar "E-mail já em uso"  <!-- unwanted-behavior -->
5. IF o e-mail novo não casar com a regex de e-mail, a senha nova tiver menos de 8 caracteres, ou `senhaAtual` estiver vazia ou não for texto THEN the system SHALL responder 400 sem gravar  <!-- unwanted-behavior -->
6. IF o corpo de `PUT /api/me` tiver campo fora de `senhaAtual`, `email` e `novaSenha`, ou não tiver `email` nem `novaSenha` THEN the system SHALL responder 400 sem gravar  <!-- unwanted-behavior -->
7. WHILE o campo novo está vazio, a senha nova tem menos de 8 caracteres ou a senha atual está vazia, the system SHALL manter "Salvar" desabilitado no modal de edição  <!-- state-driven -->
8. WHILE a gravação está em andamento, the system SHALL desabilitar os botões do modal de edição e ignorar novos envios  <!-- state-driven -->
9. WHEN o admin clica em "Cancelar" ou pressiona Esc no modal de edição THEN the system SHALL voltar ao modal "Perfil" sem chamar a API  <!-- event-driven -->

**Independent Test**: Trocar a senha pelo modal, sair e logar com a nova. Tentar um e-mail de outro admin e ver "E-mail já em uso".

---

### P2: Excluir a própria conta

**User Story**: As an admin, I want to delete my account so that I leave the company system.

**Why P2**: Precisa da rota `DELETE /api/me` e da trava do último admin.

**Acceptance Criteria**:

1. WHEN o admin clica em "Excluir Conta" THEN the system SHALL trocar o "Perfil" por um modal de confirmação com o aviso de que a ação não pode ser desfeita, o campo "Senha atual" e o botão "Excluir"  <!-- event-driven -->
2. WHEN o admin confirma com a senha atual correta e existe outro admin com login na empresa THEN the system SHALL chamar `DELETE /api/me` com `{ senhaAtual }`, apagar o documento `user`, chamar `authService.logout()` e navegar para `/login`  <!-- event-driven -->
3. IF não existir outro usuário da mesma empresa com `role: 'admin'`, `email` e `acessoNegado` diferente de `true` THEN the system SHALL responder 409 "Você é o único administrador da empresa." sem apagar, e o modal SHALL mostrar essa mensagem  <!-- unwanted-behavior -->
4. IF a senha atual estiver errada no `DELETE /api/me` THEN the system SHALL responder 403 "Senha atual incorreta." sem apagar  <!-- unwanted-behavior -->
5. IF `senhaAtual` estiver vazia ou não for texto no `DELETE /api/me` THEN the system SHALL responder 400 sem apagar  <!-- unwanted-behavior -->

**Independent Test**: Com um único admin na empresa, tentar excluir e ver o 409. Com dois admins com login, excluir um e cair em `/login`.

---

### P2: Segurança das rotas de conta

**User Story**: As the company owner, I want account routes locked to the logged admin so that nobody changes another account.

**Why P2**: Fronteira de confiança das rotas novas.

**Acceptance Criteria**:

1. IF um colaborador chamar `PUT /api/me` ou `DELETE /api/me` THEN the system SHALL responder 403 sem ler a senha nem gravar  <!-- unwanted-behavior -->
2. The system SHALL operar `/api/me` só sobre o usuário do token (`req.usuario._id`), ignorando qualquer `_id` no corpo  <!-- ubiquitous -->
3. The system SHALL nunca devolver `senhaHash`, `senhaAtual` ou `novaSenha` nas respostas de `/api/me` nem exibir a senha na tela  <!-- ubiquitous -->
4. IF `/api/me` for chamado sem token válido THEN the system SHALL responder 401 pelo middleware `autenticar` já existente  <!-- unwanted-behavior -->

**Independent Test**: Com token de colaborador, `PUT /api/me` dá 403; a resposta de sucesso do admin só tem `email`.

---

## Edge Cases

- IF o admin troca o e-mail para o mesmo que já tem (mesmo com caixa ou espaços diferentes) THEN the system SHALL responder 200 com o mesmo e-mail.
- IF o corpo traz `email` e `novaSenha` juntos THEN the system SHALL validar e gravar os dois numa única atualização (a tela manda um por vez).
- IF o documento do usuário sumiu entre o `autenticar` e a gravação THEN the system SHALL responder 404 "Usuário não encontrado(a)."
- IF a gravação falhar por erro inesperado THEN the system SHALL responder 500 e o modal SHALL mostrar o toast de erro genérico, mantendo o que foi digitado.
- WHEN o Mongo recusa o e-mail pelo índice único (código 11000) numa corrida THEN the system SHALL responder 409 como no PRF-10.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| PRF-01 | P1: Ver o Perfil e sair (AC 1) | Tasks | Pending |
| PRF-02 | P1: Ver o Perfil e sair (AC 2) | Tasks | Pending |
| PRF-03 | P1: Ver o Perfil e sair (AC 3) | Tasks | Pending |
| PRF-04 | P1: Ver o Perfil e sair (AC 4) | Tasks | Pending |
| PRF-05 | P1: Ver o Perfil e sair (AC 5) | Tasks | Pending |
| PRF-06 | P1: Ver o Perfil e sair (AC 6) | Tasks | Pending |
| PRF-07 | P2: Trocar e-mail e senha (AC 1) | Tasks | Pending |
| PRF-08 | P2: Trocar e-mail e senha (AC 2) | Tasks | Pending |
| PRF-09 | P2: Trocar e-mail e senha (AC 3) | Tasks | Pending |
| PRF-10 | P2: Trocar e-mail e senha (AC 4) | Tasks | Pending |
| PRF-11 | P2: Trocar e-mail e senha (AC 5) | Tasks | Pending |
| PRF-12 | P2: Trocar e-mail e senha (AC 6) | Tasks | Pending |
| PRF-13 | P2: Trocar e-mail e senha (AC 7) | Tasks | Pending |
| PRF-14 | P2: Trocar e-mail e senha (AC 8) | Tasks | Pending |
| PRF-15 | P2: Trocar e-mail e senha (AC 9) | Tasks | Pending |
| PRF-16 | P2: Excluir a própria conta (AC 1) | Tasks | Pending |
| PRF-17 | P2: Excluir a própria conta (AC 2) | Tasks | Pending |
| PRF-18 | P2: Excluir a própria conta (AC 3) | Tasks | Pending |
| PRF-19 | P2: Excluir a própria conta (AC 4) | Tasks | Pending |
| PRF-20 | P2: Excluir a própria conta (AC 5) | Tasks | Pending |
| PRF-21 | P2: Segurança das rotas de conta (AC 1) | Tasks | Pending |
| PRF-22 | P2: Segurança das rotas de conta (AC 2) | Tasks | Pending |
| PRF-23 | P2: Segurança das rotas de conta (AC 3) | Tasks | Pending |
| PRF-24 | P2: Segurança das rotas de conta (AC 4) | Tasks | Pending |

**ID format:** `PRF-NN`, na ordem dos critérios de cada história.

**Mudança em relação ao contexto compartilhado:** os 12 critérios `PRF-01..12` de lá viraram 24 aqui. Entraram o e-mail no login (PRF-04/05), Esc/X (PRF-03), acessibilidade (PRF-06), corpo restrito (PRF-12), "Salvar" desabilitado (PRF-13), cancelar (PRF-15), a regra exata do "único admin" (PRF-18), 400 no DELETE (PRF-20), escopo pelo token (PRF-22) e o 401 (PRF-24). Nenhum critério de lá foi removido.

**Coverage:** 24 total, 24 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `yarn test` do Backend e do Frontend passam sem teste removido; `tsc` e `eslint` limpos.
- [ ] Cada PRF tem pelo menos um teste que falha se o comportamento quebrar.
- [ ] No navegador, o modal "Perfil" bate com o PNG em 1440 px (sem o olho).
- [ ] O bundle de entrada continua ≤ 100 kB gzip: o modal do Perfil fica num chunk lazy.
