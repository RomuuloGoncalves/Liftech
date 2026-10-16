# Setores pela API Specification

## Problem Statement

A aba Setores da Equipe lê o mock `SECTORS` (`{ id, nome, unidade }`) e criar, editar e excluir mexem só na memória. No backend não existe setor: `forklift.setor` é texto livre, escrito pela Visão Geral e pelo seed e lido pela Visão Geral, pela Frota, pela área do funcionário, pelas sessões e pelas ocorrências. O AD-008 decidiu que o setor pertence a uma filial e substitui o texto `unidade`.

## Goals

- [ ] O admin cria, renomeia, move de filial (escopo empresa) e exclui setores na Equipe, e isso continua assim depois de recarregar.
- [ ] Toda máquina com setor aponta para um documento `sector` da mesma filial; o nome exibido em todas as telas vem desse documento.
- [ ] A Visão Geral e a Frota filtram as máquinas por setor.
- [ ] Os dados que já existem passam para o modelo novo com `yarn migrate:sectors`, que pode rodar de novo sem alterar nada.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Filtro por setor na área do funcionário | Não pedido; a busca de lá já casa o nome do setor, que segue vindo como texto |
| Apagar o campo `forklift.setor` do banco | A migração só preenche `setorId`; o texto antigo fica e deixa de ser lido. Limpar depois, se incomodar |
| Ligar operador ou usuário a setor | Não pedido; o setor só agrupa máquinas |
| Excluir setor soltando as máquinas | Pedido: excluir com máquinas ligadas responde 409 |
| Rodar a migração, o seed ou o reset no banco | O dono roda; os testes usam models mockados |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quem lista setores | `GET /api/sectors` para qualquer usuário autenticado, no escopo dele | Dono: colaborador lê | y |
| Quem grava setores | `POST`, `PUT` e `DELETE` só para `role: 'admin'` (403 "Apenas administradores podem gerenciar setores."), com o guard `exigirAdmin` de `core/autenticar.ts` | Pedido do dono | y |
| Máquina sem setor | `setorId` opcional, padrão `null`; `setorId: null` no `PUT` desliga. A resposta traz `setor: ''` e `setorId: null` | Dono | y |
| Filtro por setor | Entra nesta feature, na Visão Geral e na Frota, client-side por `setorId` | Dono | y |
| Sessões e ocorrências | `maquina.setor` passa a ser o nome do setor ligado (ou `''`), sem mudar o formato da resposta | Dono | y |
| Texto antigo sem migração | A API não lê mais `forklift.setor`; máquina sem `setorId` mostra `setor: ''` até rodar `migrate:sectors` | Uma fonte só para o nome; o dono roda a migração no deploy | n |
| Campo `setor` (texto) no `PUT /api/machines/:id` | Sai da lista de campos aceitos; vira `setorId`. Mandar `setor` responde 400 "O campo 'setor' não pode ser alterado por esta rota." | O texto livre deixa de existir | n |
| `setorId` em `PUT /api/forklifts/:id` | Entra em `CAMPOS_PROTEGIDOS` (400); só `/api/machines` liga setor, porque é lá que a filial é conferida | Mesmo padrão de status e categoria (AD-011) | n |
| Máquina movida de filial por `PUT /api/forklifts/:id` | Todo corpo com `filialId` grava `setorId: null` junto, mesmo se for a filial atual | O setor antigo é de outra filial; o controller não lê a filial atual e nenhuma tela usa essa rota | n |
| Setor com máquinas mudando de filial | 409 "Setor com N máquina(s) ligada(s) não pode mudar de filial." | Mover deixaria máquinas ligadas a setor de outra filial | n |
| Nome repetido | Índice único `{ filialId, nome }` com `collation: { locale: 'pt', strength: 2 }` (o mesmo de `category`); o erro 11000 vira 409 "Já existe um setor com este nome nesta filial." | Pedido do dono | y |
| Ordem da lista | Por `nome` | Lista de nomes para select e cards | n |
| Migração: nome | Texto de `forklift.setor` com `trim`; texto vazio, só espaços ou com mais de 60 caracteres fica sem setor e entra na contagem `ignoradas` do log | Não inventa nome nem corta texto | n |
| Migração: repetição | Na mesma filial, textos iguais sem diferenciar maiúsculas viram um setor só (o primeiro texto encontrado dá o nome) | Igual à regra do índice | n |
| Migração: idempotência | Só toca empilhadeiras com `setorId` ausente ou `null` e `setor` preenchido; acha o setor existente antes de criar | Rodar de novo encontra tudo ligado e não altera nada | n |
| Seed | Cria um setor por texto distinto de `EmpilhadeiraSeed.setor`, na filial da empilhadeira, com upsert por `{ filialId, nome }`, e liga `setorId` | O seed já faz upsert por chave natural (AD-009) | n |
| Seletor de filial no formulário de setor | Escopo empresa: select com as filiais do escopo (padrão: a filial ativa da Sidebar ou a primeira). Escopo filiais: mostra o nome da filial, sem select; com mais de uma filial no escopo, o select aparece só ao criar | `resolverFilial` aceita qualquer filial do escopo ao criar; mudar de filial é só do escopo empresa | n |
| Lista de setores na Equipe | Os setores da filial ativa da Sidebar (todos do escopo com "Todas as filiais"), com skeleton, erro e nova tentativa | Mesmo padrão dos funcionários (AD-012) | n |
| Atualização otimista | Criar, editar e excluir setor aplicam na hora e desfazem com toast se a API falhar | Pedido do dono | y |
| Select de setor na máquina | Lista os setores da filial escolhida no formulário, com a opção "Sem setor"; trocar a filial do formulário limpa o setor escolhido | O backend recusa setor de outra filial | n |
| Rótulo no filtro | O filtro mostra `nome`; com mais de uma filial na tela mostra `nome · filial` | Nomes podem repetir entre filiais | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: CRUD de setor no backend ⭐ MVP

**User Story**: Como admin, quero criar, listar, editar e excluir setores da minha filial pela API.

**Acceptance Criteria**:

1. WHEN `GET /api/sectors` é chamado THEN the backend SHALL devolver os setores das filiais do escopo, ordenados por `nome`, cada um como `{ _id, nome, filialId, filial: { nome } }`.
2. WHEN `GET /api/sectors?filialId=<id>` é chamado THEN the backend SHALL devolver só os setores dessa filial se ela estiver no escopo, e lista vazia se não estiver.
3. IF `filialId` da query não é um ObjectId válido THEN the backend SHALL responder 400.
4. WHEN `POST /api/sectors` recebe `nome` válido THEN the backend SHALL criar o setor na filial de `resolverFilial(escopo, filialId)` e responder 201 no formato do critério 1.
5. IF `nome` falta, vem vazio depois do `trim` ou passa de 60 caracteres THEN the backend SHALL responder 400 "O campo 'nome' é obrigatório e deve ter até 60 caracteres." sem gravar nada.
6. IF já existe setor com o mesmo nome na filial, sem diferenciar maiúsculas THEN `POST` e `PUT` SHALL responder 409 "Já existe um setor com este nome nesta filial.".
7. WHEN `PUT /api/sectors/:id` recebe `nome` válido THEN the backend SHALL gravá-lo e responder 200 no formato do critério 1.
8. IF o corpo do `PUT /api/sectors/:id` traz campo diferente de `nome` e `filialId`, ou chave começando com `$` THEN the backend SHALL responder 400 sem gravar nada.
9. WHEN `PUT /api/sectors/:id` recebe `filialId` e o escopo é empresa THEN the backend SHALL mover o setor para a filial de `resolverFilial` e responder 200.
10. IF `PUT /api/sectors/:id` recebe `filialId` diferente da atual e o escopo não é empresa THEN the backend SHALL responder 403 "Apenas o escopo de empresa pode mover um setor de filial.".
11. IF `PUT /api/sectors/:id` muda a filial de um setor com N máquinas ligadas THEN the backend SHALL responder 409 "Setor com N máquina(s) ligada(s) não pode mudar de filial." sem gravar nada.
12. WHEN `DELETE /api/sectors/:id` acha o setor sem máquinas ligadas THEN the backend SHALL apagá-lo e responder 200 `{ _id, message: "Setor excluído com sucesso." }`.
13. IF o setor tem N máquinas ligadas THEN `DELETE /api/sectors/:id` SHALL responder 409 "Setor com N máquina(s) ligada(s)." sem apagar nada.
14. IF o setor não existe ou é de filial fora do escopo THEN `PUT` e `DELETE` SHALL responder 404 "Setor não encontrado.".
15. IF quem chama `POST`, `PUT` ou `DELETE /api/sectors` não tem `role: 'admin'` THEN the backend SHALL responder 403 "Apenas administradores podem gerenciar setores.".

**Independent Test**: com um token de admin, criar um setor, listá-lo, tentar repetir o nome em outra caixa (409), renomear e excluir.

---

### P1: Máquina ligada ao setor ⭐ MVP

**User Story**: Como admin, quero escolher o setor da máquina numa lista em vez de digitar texto.

**Acceptance Criteria**:

1. WHEN `POST /api/machines` ou `PUT /api/machines/:id` recebe `setorId` de um setor da mesma filial da máquina THEN the backend SHALL gravar `forklift.setorId`.
2. IF `setorId` é de setor de outra filial ou não existe THEN the backend SHALL responder 400 "O setor informado não pertence à filial da máquina." sem gravar nada.
3. IF `setorId` não é ObjectId nem `null` THEN the backend SHALL responder 400 "O campo 'setorId' deve ser um ObjectId ou null.".
4. WHEN `PUT /api/machines/:id` recebe `setorId: null` THEN the backend SHALL desligar a máquina do setor.
5. The `GET /api/machines` SHALL devolver em cada máquina `setorId` (texto ou `null`) e `setor` igual ao nome do setor ligado, ou `''` sem setor.
6. IF o corpo do `PUT /api/machines/:id` traz `setor` THEN the backend SHALL responder 400 "O campo 'setor' não pode ser alterado por esta rota.".
7. The respostas de sessões e ocorrências SHALL trazer `maquina.setor` igual ao nome do setor ligado, ou `''` sem setor.
8. IF `PUT /api/forklifts/:id` traz `setorId` THEN the backend SHALL responder 400 "O campo 'setorId' não pode ser alterado por esta rota.".
9. WHEN `PUT /api/forklifts/:id` recebe `filialId` THEN the backend SHALL gravar `setorId: null` junto.
10. WHEN o admin abre o cadastro ou a edição de máquina na Visão Geral THEN the frontend SHALL mostrar um select de setor com "Sem setor" e os setores da filial escolhida no formulário.
11. WHEN a filial do formulário de máquina muda THEN the frontend SHALL limpar o setor escolhido.
12. WHEN o setor de uma máquina é renomeado THEN the `GET /api/machines` SHALL devolver o nome novo em `setor`.

**Independent Test**: cadastrar uma máquina escolhendo um setor, recarregar e ver o nome no card; renomear o setor na Equipe e ver o nome novo na Visão Geral.

---

### P1: Setores na Equipe pela API ⭐ MVP

**User Story**: Como admin, quero manter os setores na aba Setores e ver a filial de cada um.

**Acceptance Criteria**:

1. WHEN a aba Setores abre THEN the frontend SHALL buscar os setores da filial ativa (todos do escopo com "Todas as filiais"), com skeleton durante a carga.
2. IF a busca falha THEN the frontend SHALL mostrar o erro com botão de nova tentativa.
3. The card e o detalhe do setor SHALL mostrar o nome da filial (`filial.nome`) no lugar do texto `unidade`.
4. WHERE o usuário tem escopo empresa the formulário de setor SHALL mostrar um select com as filiais do escopo.
5. WHERE o usuário tem escopo filiais the formulário de edição de setor SHALL mostrar o nome da filial sem permitir trocar.
6. WHEN o admin cria, edita ou exclui um setor THEN the frontend SHALL aplicar a mudança na lista na hora e trocá-la pela resposta da API.
7. IF a API recusa criar, editar ou excluir THEN the frontend SHALL voltar a lista ao estado anterior e mostrar um toast com a mensagem do erro (409 de exclusão: a mensagem com a contagem de máquinas).
8. The frontend SHALL não ter mais o mock `SECTORS` nem o campo `unidade`.
9. The chaves novas de i18n SHALL existir nos 7 idiomas, traduzidas.

**Independent Test**: criar um setor na Equipe, recarregar e vê-lo com o nome da filial; excluir um setor com máquinas e ver o toast com a contagem.

---

### P2: Filtro por setor na Visão Geral e na Frota

**User Story**: Como usuário, quero ver só as máquinas de um setor.

**Acceptance Criteria**:

1. WHEN a Visão Geral ou a Frota abre THEN the frontend SHALL mostrar um select de setor com "Todos os setores" e os setores da filial ativa.
2. WHEN um setor é escolhido THEN the frontend SHALL mostrar só as máquinas com aquele `setorId`, somado aos filtros que já existem.
3. WHEN "Todos os setores" é escolhido THEN the frontend SHALL não filtrar por setor.
4. WHEN a filial ativa muda THEN the frontend SHALL voltar o filtro de setor para "Todos os setores".

**Independent Test**: escolher um setor na Visão Geral e ver só as máquinas dele; o mesmo na Frota.

---

### P2: Migração, seed e reset

**User Story**: Como dono, quero levar os textos de setor que já existem para o modelo novo sem perder nada.

**Acceptance Criteria**:

1. WHEN `yarn migrate:sectors` roda THEN the script SHALL criar um setor por texto distinto (com `trim`, sem diferenciar maiúsculas) de `forklift.setor` em cada filial e gravar `setorId` nas empilhadeiras.
2. WHEN `yarn migrate:sectors` roda de novo sem dados novos THEN the script SHALL não criar setor nem alterar empilhadeira.
3. IF o texto é vazio, só espaços ou passa de 60 caracteres THEN the script SHALL deixar a empilhadeira sem setor e somá-la em `ignoradas`.
4. The script SHALL registrar no log `setores` criados, `empilhadeiras` ligadas e `ignoradas`, e fechar a conexão mesmo se falhar.
5. WHEN `yarn seed:data` roda THEN the seed SHALL criar os setores dos textos de `EmpilhadeiraSeed.setor`, na filial de cada empilhadeira, e gravar `setorId` nelas.
6. The `COLECOES` de `resetData.ts` SHALL incluir `Sector`.

**Independent Test**: com models mockados, rodar a migração duas vezes sobre o mesmo estado e ver que a segunda não chama `create` nem `updateOne`.

---

## Edge Cases

- IF dois admins criam o mesmo nome ao mesmo tempo THEN the índice único SHALL recusar o segundo com 409.
- IF uma máquina é ligada a um setor enquanto ele é excluído (corrida, sem transação) e o `GET /api/machines` acha `setorId` de setor apagado THEN the backend SHALL devolver `setor: ''` e o `setorId` gravado.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| SECT-01 | P1: CRUD de setor (critérios 1-3, listar) | Execute | Implemented |
| SECT-02 | P1: CRUD de setor (critérios 4-6, criar) | Execute | Implemented |
| SECT-03 | P1: CRUD de setor (critérios 7-11, editar e mover) | Execute | Implemented |
| SECT-04 | P1: CRUD de setor (critérios 12-14, excluir) | Execute | Implemented |
| SECT-05 | P1: CRUD de setor (critério 15, admin) | Execute | Implemented |
| SECT-06 | P1: Máquina ligada (critérios 1-4, setorId) | Execute | Implemented |
| SECT-07 | P1: Máquina ligada (critérios 5-7, 12, resposta com nome) | Execute | Implemented |
| SECT-08 | P1: Máquina ligada (critérios 8-9, `/api/forklifts`) | Execute | Implemented |
| SECT-09 | P1: Máquina ligada (critérios 10-11, select no front) | Design | Pending |
| SECT-10 | P1: Setores na Equipe (critérios 1-3, 8) | Design | Pending |
| SECT-11 | P1: Setores na Equipe (critérios 4-5, filial) | Design | Pending |
| SECT-12 | P1: Setores na Equipe (critérios 6-7, otimista) | Design | Pending |
| SECT-13 | P1: Setores na Equipe (critério 9, i18n) | Design | Pending |
| SECT-14 | P2: Filtro por setor | Design | Pending |
| SECT-15 | P2: Migração (critérios 1-4) | Execute | Implemented |
| SECT-16 | P2: Seed e reset (critérios 5-6) | Design | Pending |
| SECT-17 | Docs: `docs/api.md` e `docs/modelagem_de_dados.md` | Design | Pending |

**Coverage:** 17 total, 0 mapped to tasks, 17 unmapped ⚠️

---

## Success Criteria

- [ ] Nenhum arquivo do front importa `SECTORS` nem lê `unidade`.
- [ ] Backend `tsc --noEmit` e `yarn test` limpos; Frontend `tsc -b`, `eslint .` e `vitest run` limpos.
- [ ] A segunda execução de `migrate:sectors` sobre os mesmos dados não altera nenhum documento (teste com mocks).
