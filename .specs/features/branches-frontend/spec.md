# Seletor de filial no front Specification

## Problem Statement

O backend passa a ter empresa e filial (AD-008): o login devolve o escopo do usuário e a lista de filiais que ele enxerga, e `GET /api/machines` aceita `?filialId=`. O front ainda não sabe disso: não guarda a sessão com escopo, não deixa escolher a filial, não filtra a Visão Geral e não reage a um token inválido. O Figma coloca o seletor de filial na Sidebar, abaixo do logo.

## Goals

- [ ] O usuário escolhe a filial ativa (ou "Todas as filiais") na Sidebar, e a escolha sobrevive a recarregar a página.
- [ ] A Visão Geral busca só as máquinas da filial ativa e busca de novo quando ela muda.
- [ ] O usuário com `escopo: 'empresa'` cria, renomeia e exclui filiais sem sair da Sidebar.
- [ ] Um 401 em qualquer requisição encerra a sessão e leva ao login.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Equipe, Frota, Alertas e telas do funcionário lendo a API | Decisão do dono: só a Visão Geral lê a API por enquanto |
| Entidade setor | Fica para a feature de setores |
| Mudanças no Header | O seletor fica na Sidebar (Figma) |
| Página separada de gerenciamento de filiais | O gerenciamento é inline no seletor |
| Mover máquina ou funcionário entre filiais | Exige telas de edição que ainda não existem |
| Escolher a filial ao cadastrar máquina | O cadastro segue só em memória (`machines-api`) |
| Tela ou fluxo de refresh de token | O 401 apenas encerra a sessão |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Contrato da API | `GET /branches` devolve `[{ _id, nome, matriz }]`; `POST /branches {nome}` 201; `PUT /branches/:id {nome}` 200; `DELETE /branches/:id` 200, ou 409 `{error}` (matriz ou com recursos) e 403 (sem escopo empresa); `GET /machines?filialId=<id>` | Contrato combinado com a feature de backend em paralelo | y |
| Resposta do login | `user = { _id, nome, role, telefone?, cargo?, empresa: { _id, nome }, escopo, filiais: [{ _id, nome, matriz }] }`, guardada em `localStorage['user']` | Mesmo contrato; `UsuarioLogado` ganha os campos | y |
| Campos de escopo no tipo | `empresa`, `escopo` e `filiais` são opcionais em `UsuarioLogado`; uma sessão salva antes desta feature (sem eles) conta como sem filiais | O contrato do login sempre os envia, mas `localStorage` pode guardar um usuário antigo | n |
| Fonte da sessão | `localStorage['user']` é a fonte única; o provider lê a cada renderização, e as mutações de filial reescrevem `filiais` ali | Evita um segundo estado que desalinha após login ou logout | n |
| Quando a lista de filiais atualiza | Só depois de criar, renomear ou excluir (refaz `GET /branches`); não há busca ao montar | A lista já vem no login; menos requisições | n |
| Valor da filial ativa | `'todas'` ou o `_id` de uma filial; guardado em `localStorage['liftech.activeBranch']` | Decisão do dono | y |
| Valor guardado inválido ou storage indisponível | Cai em `'todas'` sem lançar erro | Mesmo padrão do estado colapsado da Sidebar | n |
| Opção "Todas as filiais" | Aparece para `escopo: 'empresa'` ou para quem tem 2 ou mais filiais | Decisão do dono | y |
| Usuário `escopo: 'filiais'` com 1 filial | A filial ativa é essa, mesmo que o valor guardado seja `'todas'` | Decisão do dono | y |
| Seletor sem sessão | Não aparece (nem a linha da empresa) | Rotas de login e testes sem sessão não têm filiais | n |
| Sidebar colapsada (Figma não define) | O seletor mostra só a inicial do nome da filial ativa, com `aria-label` e `title` com o nome; a linha da empresa mostra só o ícone com `aria-label` e `title` | Mesmo padrão do botão de feedback colapsado | n |
| Local do popup | Abre abaixo do botão, sobre o conteúdo, com `min-width` maior que a Sidebar colapsada | O popup precisa caber os nomes mesmo com a Sidebar a 76px | n |
| Fechar o popup | `Escape` e clique fora fecham, como o popover de idioma do Header; enquanto o diálogo de exclusão está aberto o popup não fecha | O diálogo fica fora da Sidebar (portal) e o clique nele contaria como "fora" | n |
| Exclusão | Usa o `ConfirmDialog` existente; erro 409 mostra o aviso "Não foi possível excluir: a filial é a matriz ou ainda tem recursos." no popup; outro erro mostra "Não foi possível excluir a filial." | O texto do servidor não é traduzido | n |
| Erro ao salvar | Aviso `role="alert"` dentro do popup, com a entrada mantida | O Toast atual só tem ícone de sucesso | n |
| Nome da filial | Espaços das pontas são cortados; vazio desabilita o botão de confirmar; sem limite de tamanho no front | O backend valida o resto | n |
| 401 | `authService.logout()` e navegação para `/login` por `history.pushState` + evento `popstate` (o `BrowserRouter` reage), sem recarregar a página | `api.ts` está fora do React Router | n |
| 401 em rota de autenticação | Rotas `/login`, `/login/colaborador` e `/solicitar-acesso` não navegam; a requisição `/auth/login` não encerra a sessão | Credencial errada é 401 e não é sessão inválida | y |
| 401 na área do funcionário | Também vai para `/login` (admin) | Não há destino melhor sem ler o `role`; o login de colaborador tem link na tela | n |
| Corrida de buscas | A resposta de uma filial anterior é descartada | Trocar de filial rápido não pode mostrar máquinas da filial errada | n |
| Textos novos | Chaves `branches.*` nos 7 idiomas; o teste de paridade existente cobre | AD-006 | y |
| Teste de componentes sem provider | O hook da filial ativa tem valor padrão (`'todas'`, sem usuário), então a Visão Geral e a Sidebar renderizam sem provider | Mantém os testes atuais sem mudança | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Sessão com escopo e filial ativa ⭐ MVP

**User Story**: As a usuário logado, I want que o app saiba minhas filiais e a filial ativa so that as telas filtrem pelo que escolhi.

**Why P1**: É a base do seletor e do filtro.

**Acceptance Criteria**:

1. The tipo `UsuarioLogado` SHALL incluir `empresa: { _id, nome }`, `escopo: 'empresa' | 'filiais'` e `filiais: { _id, nome, matriz }[]`, além de `telefone` e `cargo` opcionais.
2. WHERE o valor de `liftech.activeBranch` é o `_id` de uma filial do usuário THE filial ativa SHALL ser esse `_id`.
3. IF o valor de `liftech.activeBranch` é ausente, ou não é `'todas'` nem o `_id` de uma filial do usuário THEN the filial ativa SHALL ser `'todas'`.
4. WHERE o usuário tem `escopo: 'filiais'` e exatamente 1 filial THE filial ativa SHALL ser essa filial, mesmo com `'todas'` guardado.
5. WHEN `setActiveBranch(valor)` é chamado THEN the provider SHALL gravar `valor` em `liftech.activeBranch` e passar a expô-lo como filial ativa.
6. WHEN a filial ativa é excluída THEN the filial ativa SHALL voltar a `'todas'`.
7. IF não há usuário na sessão THEN the provider SHALL expor `'todas'` e nenhuma filial.
8. IF o `localStorage` lança erro THEN the provider SHALL expor `'todas'` sem lançar erro.

**Independent Test**: Com um usuário de 2 filiais em `localStorage['user']` e `liftech.activeBranch` com o id da segunda, o hook devolve esse id; com um id desconhecido, devolve `'todas'`.

---

### P1: Seletor de filial na Sidebar ⭐ MVP

**User Story**: As a usuário logado, I want escolher a filial na Sidebar so that eu veja só os dados dela.

**Why P1**: É o pedido central do Figma.

**Acceptance Criteria**:

1. WHERE há usuário na sessão THE Sidebar SHALL exibir, abaixo do logo, o rótulo "Filiais" e um botão com o nome da filial ativa ("Todas as filiais" quando `'todas'`).
2. WHEN o usuário clica no botão THEN the Sidebar SHALL abrir uma lista (`role="listbox"`) com uma opção por filial, e a ativa com `aria-selected="true"`.
3. WHERE o usuário tem `escopo: 'empresa'` ou 2 ou mais filiais THE lista SHALL incluir a opção "Todas as filiais".
4. WHERE o usuário tem `escopo: 'filiais'` e 1 filial THE lista SHALL NOT incluir "Todas as filiais".
5. WHEN o usuário clica em uma opção THEN the Sidebar SHALL definir essa filial como ativa e fechar a lista.
6. WHEN o usuário pressiona `Escape` ou clica fora da lista THEN the Sidebar SHALL fechar a lista.
7. WHILE a Sidebar está colapsada THE botão SHALL mostrar só a inicial do nome da filial ativa, com `aria-label` e `title` iguais ao nome.
8. IF não há usuário na sessão THEN the Sidebar SHALL NOT exibir o seletor.

**Independent Test**: Logado com 2 filiais, abrir o seletor, escolher "Filial 02": o botão passa a mostrar "Filial 02" e `liftech.activeBranch` guarda o id dela.

---

### P1: Visão Geral filtrada pela filial ativa ⭐ MVP

**User Story**: As a gestor, I want ver só as máquinas da filial ativa so that a tela não misture filiais.

**Why P1**: É o efeito visível da escolha.

**Acceptance Criteria**:

1. WHEN `machineService.listar()` é chamado sem argumento THEN the serviço SHALL chamar `GET /machines` sem parâmetros.
2. WHEN `machineService.listar(filialId)` é chamado THEN the serviço SHALL chamar `GET /machines` com o parâmetro `filialId`.
3. WHILE a filial ativa é `'todas'` THE Visão Geral SHALL buscar as máquinas sem `filialId`.
4. WHILE a filial ativa é o `_id` de uma filial THE Visão Geral SHALL buscar as máquinas com esse `filialId`.
5. WHEN a filial ativa muda THEN the Visão Geral SHALL voltar ao skeleton com `aria-busy="true"` e buscar de novo.
6. IF a resposta de uma filial anterior chega depois da troca THEN the Visão Geral SHALL descartá-la e mostrar só a resposta da filial atual.
7. IF a busca falha THEN the Visão Geral SHALL exibir a mensagem de erro e o botão "Tentar novamente" já existentes.

**Independent Test**: Trocar de "Todas as filiais" para "Filial 02" chama `listar` com o id da Filial 02 e mostra as máquinas devolvidas.

---

### P2: Gerenciar filiais (escopo empresa)

**User Story**: As a administrador da empresa, I want criar, renomear e excluir filiais so that eu mantenha a estrutura sem outra tela.

**Why P2**: Completa o Figma, mas o MVP funciona escolhendo filiais já existentes.

**Acceptance Criteria**:

1. WHERE o usuário tem `escopo: 'empresa'` THE lista SHALL exibir os botões "Gerenciar Filiais" e "Criar Filial".
2. WHERE o usuário tem `escopo: 'filiais'` THE lista SHALL NOT exibir "Gerenciar Filiais" nem "Criar Filial".
3. WHEN o usuário clica em "Criar Filial" THEN the lista SHALL exibir um campo "Nome da filial" com os botões "Confirmar" e "Cancelar".
4. WHEN o usuário confirma um nome não vazio THEN the Sidebar SHALL chamar `POST /branches` com `{ nome }` sem espaços nas pontas, refazer `GET /branches`, gravar o resultado em `filiais` da sessão e listar a nova filial.
5. IF o nome está vazio ou só com espaços THEN the botão "Confirmar" SHALL ficar desabilitado.
6. WHEN o usuário cancela a criação THEN the campo SHALL sumir sem chamar a API.
7. WHEN o usuário clica em "Gerenciar Filiais" THEN the lista SHALL mostrar, por filial, os botões "Renomear <nome>" e "Excluir <nome>" no lugar das opções.
8. WHEN o usuário clica em "Renomear <nome>" e confirma um nome não vazio THEN the Sidebar SHALL chamar `PUT /branches/<id>` com `{ nome }` e atualizar a lista.
9. WHEN o usuário clica em "Excluir <nome>" THEN the Sidebar SHALL abrir o `ConfirmDialog` com o nome da filial.
10. WHEN o usuário confirma a exclusão THEN the Sidebar SHALL chamar `DELETE /branches/<id>`, refazer `GET /branches` e remover a filial da lista.
11. IF `DELETE /branches/<id>` responde 409 THEN the Sidebar SHALL fechar o diálogo e exibir o aviso "Não foi possível excluir: a filial é a matriz ou ainda tem recursos." com `role="alert"`.
12. IF criar ou renomear falha THEN the Sidebar SHALL exibir o aviso "Não foi possível salvar a filial." com `role="alert"` e manter o campo.
13. IF excluir falha com outro erro THEN the Sidebar SHALL exibir o aviso "Não foi possível excluir a filial." com `role="alert"`.

**Independent Test**: Logado como empresa, criar "Filial 03" faz `POST /branches` e a opção aparece; excluir a matriz mostra o aviso de 409.

---

### P2: Nome da empresa no rodapé

**User Story**: As a usuário logado, I want ver o nome da minha empresa na Sidebar so that eu saiba em qual conta estou.

**Why P2**: Detalhe do Figma sem efeito funcional.

**Acceptance Criteria**:

1. WHERE a sessão tem `empresa.nome` THE rodapé da Sidebar SHALL exibir um ícone de usuário e esse nome.
2. WHILE a Sidebar está colapsada THE rodapé SHALL mostrar só o ícone, com `aria-label` e `title` iguais ao nome da empresa.
3. IF não há usuário na sessão THEN the rodapé SHALL NOT exibir a linha da empresa.

**Independent Test**: Logado na empresa "Acme", o rodapé mostra "Acme"; colapsada, mostra só o ícone com o nome no `aria-label`.

---

### P1: Sessão inválida encerra o login ⭐ MVP

**User Story**: As a usuário, I want ser levado ao login quando o token deixa de valer so that eu não fique numa tela que só falha.

**Why P1**: Todas as rotas `/api/*` passam a exigir token; sem isso o app trava com erros.

**Acceptance Criteria**:

1. WHEN uma requisição, exceto o login, responde 401 e a rota atual não é de autenticação THEN the cliente HTTP SHALL chamar `authService.logout()` e navegar para `/login`.
2. IF a requisição `/auth/login` responde 401 THEN the cliente HTTP SHALL NOT chamar `authService.logout()` nem navegar.
3. WHILE a rota atual é `/login`, `/login/colaborador` ou `/solicitar-acesso` THE cliente HTTP SHALL NOT navegar em um 401.
4. WHEN uma requisição falha com qualquer erro THEN the cliente HTTP SHALL rejeitar a promessa com o mesmo erro.
5. WHEN uma requisição responde 403, 409 ou 500 THEN the cliente HTTP SHALL NOT chamar `authService.logout()`.

**Independent Test**: Com a rota em `/`, uma resposta 401 de `/machines` limpa `token` e `user` do `localStorage` e a URL vira `/login`.

---

### P1: Textos nos 7 idiomas ⭐ MVP

**User Story**: As a usuário de qualquer idioma suportado, I want o seletor traduzido so that a Sidebar siga o idioma escolhido.

**Why P1**: AD-006 exige i18n em todo texto novo.

**Acceptance Criteria**:

1. The chaves `branches.*` SHALL existir nos 7 idiomas (pt-BR, en-US, es, fr, ja, de, ru), com o mesmo conjunto de chaves.
2. WHERE o idioma ativo é en-US THE Sidebar SHALL exibir "Branches" e "All branches".

**Independent Test**: O teste de paridade de locales passa e, em en-US, o rótulo é "Branches".

---

## Edge Cases

- WHEN o usuário exclui a filial ativa THEN the Sidebar SHALL passar para "Todas as filiais" (BRF-02 AC6).
- IF o usuário `escopo: 'filiais'` tem lista vazia THEN the seletor SHALL abrir sem opções, sem lançar erro.
- WHEN o nome digitado para a filial tem espaços nas pontas THEN the nome enviado SHALL ser o texto cortado.
- IF o `localStorage['user']` tem JSON inválido THEN the provider SHALL tratar como sem usuário.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| BRF-01 | P1 Sessão: AC1, AC7 | Implementing | Pending |
| BRF-02 | P1 Sessão: AC2, AC3, AC4, AC5, AC6, AC8; Edge: JSON inválido | Implementing | Pending |
| BRF-03 | P1 Seletor: AC1, AC2, AC3, AC4, AC5, AC6, AC8; Edge: lista vazia | Implementing | Pending |
| BRF-04 | P1 Seletor: AC7; P2 Empresa: AC1, AC2, AC3 | Implementing | Pending |
| BRF-05 | P1 Visão Geral: AC1, AC2, AC3, AC4, AC5, AC6, AC7 | Implementing | Pending |
| BRF-06 | P2 Gerenciar: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8; Edge: espaços | Implementing | Pending |
| BRF-07 | P2 Gerenciar: AC9, AC10, AC11, AC12, AC13; Edge: excluir a ativa | Implementing | Pending |
| BRF-08 | P1 Sessão inválida: AC1, AC2, AC3, AC4, AC5 | Implementing | Pending |
| BRF-09 | P1 Textos: AC1, AC2 | Implementing | Pending |

**Coverage:** 9 total, 0 mapped to tasks, 9 unmapped (tasks.md ainda não escrito).

---

## Success Criteria

- [ ] Logado como empresa com 2 filiais, escolher uma filial no seletor mostra só as máquinas dela na Visão Geral, e a escolha permanece depois de recarregar.
- [ ] Criar, renomear e excluir uma filial pelo popup atualiza a lista sem recarregar a página.
- [ ] Um 401 fora das telas de login limpa a sessão e leva a `/login`.
- [ ] `tsc -b`, `eslint .` e todos os testes do Frontend passam, incluindo a paridade dos 7 idiomas.
