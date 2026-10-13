# Autenticação e escopo por filial nas rotas Specification

## Problem Statement

O backend emite um JWT no login, mas nenhuma rota o verifica, e o `RepositoryBase` devolve tudo de todas as empresas. A feature `branches-model` criou empresa, filial e os campos de escopo. Esta feature fecha o acesso: o middleware `autenticar` valida o token e carrega o escopo do usuário a cada requisição, o filtro por filial vive num só lugar (o `RepositoryBase`) e as rotas passam a mostrar e alterar só o que o escopo do chamador permite. Ela também fecha dois buracos do CRUD de usuários: atribuição em massa no `PUT` e papel sem validação no `POST`.

## Goals

- [ ] Toda rota de `/api/*` exige `Authorization: Bearer <token>` válido, exceto login, solicitação de acesso, health e `GET /`.
- [ ] O escopo vem do banco a cada requisição, então uma mudança de acesso vale na hora.
- [ ] Empilhadeiras, telemetria, máquinas e usuários só aparecem e só mudam dentro do escopo do chamador; fora dele, o recurso é "não encontrado" (404).
- [ ] `GET /api/machines` aceita `?filialId=` e o cruza com as filiais permitidas.
- [ ] `PUT /api/users/:id` aceita só campos permitidos e `POST /api/users` valida o `role`.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Frontend: enviar o token, tratar 401, seletor de filial | Feature `branches-frontend` (plano D) |
| Autorização por `role` (admin x colaborador) nas rotas | Não existe hoje; o `role` continua só definindo o que o front mostra |
| Validar que o dispositivo e o operador de uma empilhadeira são do mesmo escopo | O `dispositivoConectadoId` e o `operadorConectadoId` seguem sem checagem cruzada; risco registrado |
| Unicidade de `identificacao` (empilhadeira) e de `nome` (usuário) por empresa | Seguem únicas no banco inteiro, como hoje |
| Autenticação própria dos dispositivos IoT que enviam telemetria | `POST /api/telemetry` passa a exigir o token de um usuário (decisão do dono); um canal para dispositivos fica para depois |
| Revogar token, refresh token, logout | O token só expira; apagar ou mudar o usuário já vale na hora porque ele é lido a cada requisição |
| Rotas de device, operator e incident | Não existem; só o schema ganhou `filialId` |
| Limite de requisições, bloqueio por tentativas de login | Fora do plano de filiais |
| Mover funcionário entre filiais por tela | Feature `branches-frontend`; aqui só `PUT /api/users/:id` com `filiaisIds` |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Forma de `req.escopo` | O `Escopo` de `branches-model` (`{ empresaId, tipo, filiais }`), montado por `carregarEscopo` a partir do usuário lido a cada requisição | Reuso; o filtro usa os ids de `filiais`, que já são só as filiais da empresa do usuário | y |
| Mensagem do 401 | `{ error: 'Não autenticado.' }` para todos os casos | Não revela se o token, o formato ou o usuário falhou | n |
| Algoritmo do JWT | A verificação aceita só `HS256`, o mesmo do `jwt.sign` do login | Fecha troca de algoritmo | n |
| Sem `JWT_SECRET` | O middleware responde 500 `{ error: 'JWT_SECRET não configurado.' }`, como o login | Erro de configuração não é falha de credencial | n |
| Falha do banco no middleware | 500 com a mensagem do erro, nunca 401 | Falha de infraestrutura não é token inválido | n |
| Usuário sem `empresaId` (antes da migração) | Autentica, com escopo vazio: não vê recurso nenhum e não cria usuário nem filial | Falha fechada até a migração rodar | n |
| Filtro vazio | `filialId: { $in: [] }` não casa nada; sem `req.escopo` o filtro também é vazio | Falha fechada | y |
| Chave do filtro no repository | O filtro entra como `{ ...filtro, _id: id }`, então o `_id` pedido nunca é sobrescrito | Evita colisão de chave | n |
| Filtro das rotas de usuário | `{ empresaId: { $in: [<empresa do chamador>] } }`; sem empresa, `$in: []` | Isola usuários por empresa sem a chave `filialId` | n |
| Criar recurso: filial | Com `filialId` no corpo: ObjectId inválido é 400 e filial fora do escopo é 403. Sem `filialId`: se `tipo` é `filiais` com exatamente uma filial, usa essa; nos outros casos (empresa, várias, nenhuma) é 400 | Decisão do dono (AD-008); 403 para filial fora do escopo porque o chamador já informou um id | y |
| Mover recurso de filial | `PUT` com `filialId` no corpo só para `tipo: 'empresa'`, e a filial nova precisa estar no escopo; senão 403 | Decisão do dono | y |
| `GET /api/machines?filialId=` fora do escopo | 200 com lista vazia (interseção vazia), não 404; id que não é ObjectId é 400 | É filtro de lista, não busca de recurso; não revela que a filial existe | n |
| Telemetria pelo dispositivo | O controller lista os dispositivos do escopo (`Device.find` pelo filtro de filial) e filtra a telemetria por `dispositivoId` neles; `?dispositivoId=` de fora devolve lista vazia; criar ou mudar para dispositivo de fora é 404 | Decisão do dono: sem campo novo na telemetria | y |
| Corpo de update com operador do Mongo | Chave que começa com `$` no corpo de `PUT` é 400 (forklift, telemetria, usuário) | `{"$set": {"filialId": ...}}` contornaria a checagem de filial | n |
| `PUT /api/users/:id`: campos | Permitidos para qualquer chamador: `nome`, `telefone`, `cargo`. `role`, `escopo` e `filiaisIds` só para `tipo: 'empresa'` (senão 403). Qualquer outra chave (`senhaHash`, `email`, `usuario`, `empresaId`, desconhecidas, com `$`) é 400. `_id` e `id` são descartados em silêncio como hoje | Pedido da revisão de segurança; só o admin da empresa mexe em escopo (AD-008) | y |
| `telefone` e `cargo` | Texto (qualquer string); a lista permitida os inclui mesmo onde o schema ainda não os tem, e o Mongoose ignora o campo desconhecido | Os campos entram pela feature `employee-nav-settings` | n |
| `POST /api/users`: `empresaId` | Sempre a empresa do chamador; o `empresaId` do corpo é ignorado | Nunca confiar no corpo para o escopo | y |
| `POST /api/users`: escopo e papel | `escopo`, `filiaisIds` e `role: 'admin'` só para `tipo: 'empresa'` (senão 403); sem eles o usuário nasce `escopo: 'filiais'` sem filiais, que não vê nada | Impede escalada de acesso por quem não administra a empresa | n |
| `filiaisIds` em usuário | Cada id precisa estar nas filiais visíveis do chamador (para `empresa`, todas as da empresa); senão 403 | Filial de outra empresa nunca entra | y |
| Validação do `role` | `admin` ou `colaborador` em `POST` e `PUT`; a regra do `userRules` passa a exigir isso | Pedido da revisão de segurança; é o conjunto que o login aceita | y |
| `request-check` | Cada campo vai em um objeto próprio no `check`, porque a lib lê só a primeira chave de cada objeto | Corrige o `check({ nome, role })` do `POST /api/users` | y |
| Rota nova de filiais | `/api/branches` montada atrás do `autenticar` | Os handlers de `branches-model` leem `req.escopo` | y |
| Estrutura do app | `src/app.ts` monta o Express (middlewares, rotas, `autenticar`) e `server.ts` só importa o app, semeia e escuta | Permite testar a ordem das rotas em teste unitário sem porta fixa nem banco | n |
| Teste de rota | O teste unitário sobe o app numa porta efêmera de loopback com os schemas mockados e chama com `fetch` | Prova a ordem do middleware; nenhum banco | n |
| Testes que chamam controller direto | Ganham `req.escopo` no `Request` falso (parâmetro novo do contrato) | Adaptação mínima pedida | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Middleware autenticar e rotas protegidas ⭐ MVP

**User Story**: As a dono, I want que toda rota valide o token e o usuário so that ninguém acesse a API sem login.

**Why P1**: Hoje qualquer um lê e altera tudo sem autenticar.

**Acceptance Criteria**:

1. WHEN a requisição traz `Authorization: Bearer <token>` com token válido de um usuário existente THEN `autenticar` SHALL carregar o usuário do banco, definir `req.escopo` com o escopo dele e chamar `next`.
2. WHEN duas requisições com o mesmo token chegam e o usuário mudou entre elas THEN `autenticar` SHALL carregar o usuário de novo e `req.escopo` SHALL refletir o dado novo.
3. IF o cabeçalho `Authorization` falta ou não tem o formato `Bearer <token>` THEN `autenticar` SHALL responder 401 com `{ error: 'Não autenticado.' }` sem consultar o banco.
4. IF o token tem assinatura inválida, está malformado, expirou ou foi assinado com algoritmo diferente de `HS256` THEN `autenticar` SHALL responder 401.
5. IF o `sub` do token não é um ObjectId válido THEN `autenticar` SHALL responder 401 sem consultar o banco.
6. IF o usuário do `sub` não existe mais THEN `autenticar` SHALL responder 401.
7. IF o banco falha ao carregar o usuário ou o escopo THEN `autenticar` SHALL responder 500 com `{ error: <mensagem> }`.
8. IF `JWT_SECRET` não está configurado THEN `autenticar` SHALL responder 500 com `{ error: 'JWT_SECRET não configurado.' }`.
9. WHEN uma rota de `/api/*` é chamada sem token THEN o app SHALL responder 401, exceto `POST /api/auth/login`, `POST /api/access-requests`, `GET /api/health` e `GET /`.
10. WHEN `POST /api/auth/login`, `POST /api/access-requests`, `GET /api/health` ou `GET /` é chamada sem token THEN o app SHALL atendê-la sem exigir autenticação.
11. WHEN uma rota protegida é chamada com token válido THEN o app SHALL entregá-la ao handler com `req.escopo` definido.
12. The app SHALL montar `/api/branches` atrás do `autenticar`.

**Independent Test**: `GET /api/machines` sem token devolve 401; com o token do login devolve 200; `GET /api/health` sem token devolve 200.

---

### P1: Filtro de escopo no RepositoryBase ⭐ MVP

**User Story**: As a dev, I want o filtro de escopo num só lugar so that nenhuma rota esqueça de aplicá-lo.

**Why P1**: É a decisão do AD-008; as rotas só passam o filtro.

**Acceptance Criteria**:

1. WHEN `obterTodos` recebe um filtro THEN o repository SHALL consultar só os documentos que o casam; sem filtro SHALL consultar todos como hoje.
2. WHEN `obterPorId` recebe um filtro THEN o repository SHALL buscar o documento com o `_id` pedido e o filtro ao mesmo tempo, devolvendo `null` se fora do filtro.
3. WHEN `atualizarPorId` recebe um filtro THEN o repository SHALL atualizar só o documento com o `_id` pedido que casa o filtro, devolvendo `null` se fora do filtro.
4. WHEN `deletarPorId` recebe um filtro THEN o repository SHALL apagar só o documento com o `_id` pedido que casa o filtro, devolvendo `null` se fora do filtro.
5. IF o filtro contém a chave `_id` THEN o repository SHALL usar o `_id` pedido, nunca o do filtro.
6. IF o id não é um ObjectId válido THEN o repository SHALL devolver `null` sem consultar o banco.
7. WHEN o service recebe um filtro THEN o service SHALL repassá-lo ao repository em listar, obter, atualizar e deletar.
8. IF o repository devolve `null` THEN o service SHALL lançar o mesmo erro de "não encontrado(a)" de hoje.
9. WHEN `filtroPorFilial` recebe o escopo THEN ele SHALL devolver `{ filialId: { $in: <ids das filiais do escopo> } }`.
10. IF o escopo está ausente ou sem filiais THEN `filtroPorFilial` SHALL devolver `{ filialId: { $in: [] } }`.
11. WHEN `filtroPorEmpresa` recebe o escopo THEN ele SHALL devolver `{ empresaId: { $in: [<empresaId>] } }`, e `$in: []` se o escopo não tem empresa.
12. IF um corpo de update tem chave que começa com `$` THEN `exigirSemOperadores` SHALL lançar `ErroHttp` 400 nomeando a chave.

**Independent Test**: Com o model mockado, `obterPorId(id, { filialId: { $in: [] } })` consulta com o `_id` e o filtro juntos.

---

### P1: Empilhadeiras no escopo ⭐ MVP

**User Story**: As a gestor de uma filial, I want ver e alterar só as empilhadeiras do meu escopo so that eu não veja dados de outra filial ou empresa.

**Why P1**: É o recurso principal.

**Acceptance Criteria**:

1. WHEN `GET /api/forklifts` é chamada THEN o backend SHALL listar só as empilhadeiras cujo `filialId` está nas filiais do escopo.
2. IF o `:id` de `GET`, `PUT` ou `DELETE /api/forklifts/:id` é de empilhadeira fora do escopo THEN o backend SHALL responder 404 como se não existisse.
3. WHEN `POST /api/forklifts` recebe um `filialId` de uma filial do escopo THEN o backend SHALL criar a empilhadeira nessa filial.
4. IF `POST /api/forklifts` recebe um `filialId` que não está no escopo THEN o backend SHALL responder 403.
5. IF `POST /api/forklifts` recebe um `filialId` que não é ObjectId THEN o backend SHALL responder 400.
6. WHEN `POST /api/forklifts` não traz `filialId` e o escopo é `filiais` com exatamente uma filial THEN o backend SHALL criar a empilhadeira nessa filial.
7. IF `POST /api/forklifts` não traz `filialId` e o escopo é `empresa`, ou tem várias filiais, ou nenhuma THEN o backend SHALL responder 400.
8. WHEN `PUT /api/forklifts/:id` traz `filialId` de uma filial do escopo e o chamador tem `escopo: 'empresa'` THEN o backend SHALL mover a empilhadeira para essa filial.
9. IF `PUT /api/forklifts/:id` traz `filialId` e o chamador não tem `escopo: 'empresa'`, ou a filial está fora do escopo THEN o backend SHALL responder 403.
10. IF `PUT /api/forklifts/:id` traz `filialId` que não é ObjectId THEN o backend SHALL responder 400.
11. IF o corpo de `PUT /api/forklifts/:id` tem chave que começa com `$` THEN o backend SHALL responder 400.

**Independent Test**: Um colaborador da Unidade Centro lista só as empilhadeiras dela; `GET /api/forklifts/<id de uma da Matriz>` devolve 404.

---

### P1: Máquinas e telemetria no escopo ⭐ MVP

**User Story**: As a gestor, I want a Visão Geral e a telemetria só com dados do meu escopo so that o painel mostre o que é meu.

**Why P1**: A Visão Geral lê `GET /api/machines`.

**Acceptance Criteria**:

1. WHEN `GET /api/machines` é chamada THEN o backend SHALL devolver só as empilhadeiras cujo `filialId` está nas filiais do escopo.
2. The item de `GET /api/machines` SHALL incluir `filialId` em texto, além dos campos de hoje.
3. WHEN `GET /api/machines?filialId=<id>` traz uma filial do escopo THEN o backend SHALL devolver só as empilhadeiras dessa filial.
4. IF `?filialId=` traz uma filial fora do escopo THEN o backend SHALL responder 200 com lista vazia.
5. IF `?filialId=` não é um ObjectId válido THEN o backend SHALL responder 400.
6. IF o escopo não tem filiais THEN `GET /api/machines` SHALL responder 200 com lista vazia.
7. WHEN `GET /api/telemetry` é chamada THEN o backend SHALL listar só as leituras de dispositivos cujo `filialId` está nas filiais do escopo.
8. IF `?dispositivoId=` de `GET /api/telemetry` é de dispositivo fora do escopo THEN o backend SHALL responder 200 com lista vazia.
9. IF o `:id` de `GET`, `PUT` ou `DELETE /api/telemetry/:id` é de leitura de dispositivo fora do escopo THEN o backend SHALL responder 404.
10. IF `POST /api/telemetry` traz `dispositivoId` de dispositivo fora do escopo THEN o backend SHALL responder 404.
11. IF `PUT /api/telemetry/:id` traz `dispositivoId` de dispositivo fora do escopo THEN o backend SHALL responder 404.
12. IF o corpo de `PUT /api/telemetry/:id` tem chave que começa com `$` THEN o backend SHALL responder 400.

**Independent Test**: `GET /api/machines?filialId=<Unidade Norte>` por um colaborador da Unidade Centro devolve `[]`; sem o parâmetro devolve só as da Unidade Centro.

---

### P1: Usuários isolados por empresa e sem atribuição em massa ⭐ MVP

**User Story**: As a admin, I want que o CRUD de usuários respeite a empresa e os campos permitidos so that ninguém ganhe acesso que não deveria.

**Why P1**: Sem isso, qualquer usuário trocaria o próprio escopo e quebraria o filtro.

**Acceptance Criteria**:

1. WHEN `GET /api/users` é chamada THEN o backend SHALL listar só os usuários da empresa do chamador.
2. IF o `:id` de `GET`, `PUT` ou `DELETE /api/users/:id` é de usuário de outra empresa THEN o backend SHALL responder 404.
3. WHEN `POST /api/users` cria um usuário THEN o backend SHALL gravar o `empresaId` do chamador e ignorar o `empresaId` do corpo.
4. IF o chamador de `POST /api/users` não tem empresa THEN o backend SHALL responder 403.
5. IF `role` de `POST /api/users` não é `admin` nem `colaborador` THEN o backend SHALL responder 400.
6. IF `nome` e `role` de `POST /api/users` são ambos inválidos THEN o backend SHALL responder 400 listando os dois campos.
7. IF `POST /api/users` traz `escopo` ou `filiaisIds` inválidos (fora da lista, ou lista com item que não é ObjectId) THEN o backend SHALL responder 400.
8. IF o chamador de `POST /api/users` não tem `escopo: 'empresa'` e o corpo traz `escopo`, `filiaisIds` ou `role: 'admin'` THEN o backend SHALL responder 403.
9. IF `filiaisIds` de `POST` ou `PUT /api/users` tem filial fora das filiais visíveis do chamador THEN o backend SHALL responder 403.
10. WHEN `PUT /api/users/:id` traz só `nome`, `telefone` e `cargo` THEN o backend SHALL atualizar esses campos para qualquer chamador autenticado da empresa.
11. WHEN `PUT /api/users/:id` traz `role`, `escopo` ou `filiaisIds` e o chamador tem `escopo: 'empresa'` THEN o backend SHALL aceitá-los se válidos.
12. IF `PUT /api/users/:id` traz `role`, `escopo` ou `filiaisIds` e o chamador não tem `escopo: 'empresa'` THEN o backend SHALL responder 403.
13. IF o corpo de `PUT /api/users/:id` tem qualquer chave fora de `nome`, `telefone`, `cargo`, `role`, `escopo` e `filiaisIds` (`senhaHash`, `email`, `usuario`, `empresaId`, desconhecida ou começando com `$`) THEN o backend SHALL responder 400 sem atualizar.
14. IF `nome`, `telefone` ou `cargo` de `PUT /api/users/:id` não é texto, ou `nome` é vazio, ou `role` ou `escopo` é inválido THEN o backend SHALL responder 400.
15. WHEN o corpo de `PUT /api/users/:id` traz `_id` ou `id` THEN o backend SHALL descartá-los sem erro.

**Independent Test**: Um colaborador manda `PUT /api/users/<ele mesmo>` com `{ "escopo": "empresa" }` e recebe 403; com `{ "senhaHash": "x" }` recebe 400.

---

## Edge Cases

- WHEN o cabeçalho é `bearer <token>` em minúsculas THEN `autenticar` SHALL responder 401, pois só `Bearer ` é aceito.
- WHEN `?filialId=` aparece duas vezes na query THEN `GET /api/machines` SHALL responder 400, pois o valor não é texto único.
- WHEN a filial de um usuário foi apagada THEN o escopo dele SHALL seguir sem essa filial e as rotas SHALL continuar a responder.
- IF `PUT /api/users/:id` traz corpo vazio THEN o backend SHALL responder 400, pois não há campo a atualizar.
- WHEN o `:id` de qualquer rota com id não é ObjectId THEN o backend SHALL responder 400 como hoje.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| SCP-01 | P1 Filtro: AC1, AC2, AC3, AC4, AC5, AC6 | Tasks | Implementing |
| SCP-02 | P1 Filtro: AC7, AC8 | Tasks | Implementing |
| SCP-03 | P1 Filtro: AC9, AC10, AC11 | Tasks | Implementing |
| SCP-04 | P1 Filtro: AC12; Forklift: AC11; Telemetria: AC12 | Tasks | Implementing |
| SCP-05 | P1 Autenticar: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8; Edge: bearer minúsculo | Tasks | Implementing |
| SCP-06 | P1 Autenticar: AC9, AC10, AC11, AC12 | Tasks | In Tasks |
| SCP-07 | P1 Forklift: AC1, AC2 | Tasks | Implementing |
| SCP-08 | P1 Forklift: AC3, AC4, AC5, AC6, AC7 | Tasks | Implementing |
| SCP-09 | P1 Forklift: AC8, AC9, AC10 | Tasks | Implementing |
| SCP-10 | P1 Máquinas: AC1, AC2, AC3, AC4, AC5, AC6; Edge: filialId repetido | Tasks | Implementing |
| SCP-11 | P1 Telemetria: AC7, AC8, AC9, AC10, AC11 | Tasks | Implementing |
| SCP-12 | P1 Usuários: AC1, AC2, AC3, AC4 | Tasks | Implementing |
| SCP-13 | P1 Usuários: AC5, AC6, AC7, AC8, AC9 | Tasks | Implementing |
| SCP-14 | P1 Usuários: AC10, AC11, AC12, AC13, AC14, AC15; Edge: corpo vazio | Tasks | Implementing |

**Coverage:** 14 total, 14 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Sem token, toda rota de `/api/*` devolve 401, menos login, solicitação de acesso, health e `GET /`.
- [ ] Um usuário de uma filial nunca vê, altera nem apaga empilhadeira, leitura de telemetria ou máquina de outra filial ou empresa, e o `?filialId=` nunca amplia o que ele vê.
- [ ] Nenhum usuário consegue mudar o próprio escopo, papel, e-mail, usuário ou senha pelo `PUT /api/users/:id`, salvo `role`, `escopo` e `filiaisIds` pelo admin da empresa.
- [ ] `npx tsc --noEmit` sem erros e `npx vitest run tests/unit` sem falhas, sem tocar no banco.
