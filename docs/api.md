# API REST e Scripts do Backend - Liftech

Referência da API REST que existe hoje em `Backend/src/server.ts` e `Backend/src/feature/*`, e dos scripts de seed e de teste do Backend. Tudo aqui foi extraído do código; quando algo não pôde ser confirmado sem rodar o servidor ou acessar o banco, o texto diz isso.

## 1. Visão geral

* Servidor Express 5, porta fixa `3000` (`app.listen(3000)`), com `cors()` aberto (qualquer origem) e `express.json()`.
* Prefixo das rotas: `/api`, exceto `GET /`, que responde o texto `Hello World!`.
* **Autenticação: nenhuma rota exige token hoje.** Não existe middleware de autenticação ou autorização no Backend (`Backend/src/middlewares/` não existe e nada chama `jwt.verify`). O login emite um JWT, mas nenhuma rota o valida. Todas as rotas abaixo estão abertas.
* Dados e rotas aceitam e devolvem JSON.

### Formato de erro

Toda resposta de erro vem de `respostaErro` (`utils/responseHandler.ts`) no formato:

```json
{ "error": "mensagem" }
```

Erros de validação de campos trazem uma lista no lugar da mensagem (biblioteca `request-check`):

```json
{ "error": [ { "field": "login", "message": "O campo 'login' é obrigatório e deve ser texto válido." } ] }
```

Códigos usados (`StatusCode`): `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `500`. Na prática o código só devolve `200`, `201`, `400`, `401`, `404`, `409` e `500`. Qualquer exceção não tratada pelo controller vira `500` com `error` igual à mensagem da exceção.

Sobre a validação de campo obrigatório: quando o campo chega ausente, `null` ou `""`, a `request-check` usa a mensagem padrão dela, **em inglês** (`This field is required!`), com o campo em `field`. Só `access-requests` troca essa mensagem por `O campo '<campo>' é obrigatório.`.

### Convenções que se repetem

* Rotas com `:id` usam o `_id` do MongoDB. Um `:id` que não é ObjectId válido responde `400` com `O ID fornecido não é um ObjectId válido do MongoDB.`.
* O controller também aceita o id vindo de `_id` ou `id` no corpo quando não há `:id` na rota, mas as rotas sempre têm `:id` no caminho, então isso não é alcançável hoje.
* `PUT` não valida o corpo: os campos recebidos vão direto para o `findByIdAndUpdate` do Mongoose (veja o aviso em Usuários).
* Corpo ausente: o Express 5 deixa `req.body` como `undefined` quando não há JSON. `auth/login` e `access-requests` tratam isso (`req.body ?? {}`) e respondem `400`. Os controllers de usuários, empilhadeiras e telemetria leem `req.body` direto, então provavelmente respondem `500` com a mensagem do `TypeError`. Isso é dedução da leitura do código, não foi executado.

### Aviso sobre `request-check` e o corpo de `POST`

`request-check` lê **só a primeira chave** de cada objeto passado em `check()`. Os controllers de usuários, empilhadeiras e telemetria passam todos os campos num único objeto, então só o primeiro campo é de fato validado:

| Rota | Campo validado | Campos com regra que nunca rodam |
|------|----------------|-----------------------------------|
| `POST /api/users` | `nome` | `role` |
| `POST /api/forklifts` | `id` | `dispositivoConectadoId`, `operadorConectadoId` |
| `POST /api/telemetry` | `dispositivoId` | `dataDados` |

Consequência para quem consome a API: nessas rotas, mandar os outros campos inválidos ou ausentes não gera `400`. Em `telemetry`, um `dataDados` ausente ou inválido vira `Invalid Date` e deve falhar no Mongoose com `500` (dedução, não executado). `auth/login` e `access-requests` passam um objeto por campo e validam tudo.

## 2. Health

### `GET /api/health`

* Auth: nenhuma. Sem corpo nem query.
* Resposta `200`:
  * Se o cliente aceita HTML (`req.accepts('html')`, inclusive quando não manda `Accept`): página HTML.
  * Caso contrário (ex.: `Accept: application/json`): `{ "ok": true, "lastPing": "<texto>" }`.
* `lastPing` é a data/hora (formato `pt-BR`) do ping **anterior** guardada em memória do processo, ou `Primeiro ping!` na primeira chamada. Reinicia com o servidor.
* Erros: nenhum previsto.

## 3. Autenticação

### `POST /api/auth/login`

* Auth: nenhuma.
* Corpo:

| Campo | Regra |
|-------|-------|
| `role` | Obrigatório. Exatamente `"admin"` ou `"colaborador"`. |
| `login` | Obrigatório, texto não vazio (após `trim`). Para `admin` é o **email** (normalizado em minúsculas); para `colaborador` é o **usuário** (campo `usuario`). |
| `senha` | Obrigatório, texto não vazio (após `trim`). A senha é comparada com `senhaHash` do usuário. |

* Sucesso `200`:

```json
{ "token": "<jwt>", "user": { "_id": "<id>", "nome": "<nome>", "role": "admin", "operador": null } }
```

* `user.operador`: `{ "_id", "nome" }` do operator ligado ao colaborador (`operadorId`), ou `null` (admin, colaborador sem ligação ou operator apagado).

* O JWT leva `{ sub: <_id>, role }` e expira em `JWT_EXPIRES_IN` (padrão `8h`), assinado com `JWT_SECRET`.
* Erros:
  * `400`: campo inválido (lista `request-check`, mensagens em português para `role`, `login` e `senha` fora da regra; campo ausente usa a mensagem padrão em inglês).
  * `401`: `Credenciais inválidas.` (usuário não existe, não tem `senhaHash` ou senha errada; a mesma mensagem para todos os casos).
  * `500`: `JWT_SECRET não configurado.` ou qualquer erro de banco.

## 4. Solicitações de acesso

### `POST /api/access-requests`

* Auth: nenhuma. É a única rota do módulo (não há listagem nem aprovação).
* Corpo:

| Campo | Regra |
|-------|-------|
| `email` | Obrigatório, texto no formato `x@y.z` (regex simples, sem espaços). Salvo com `trim` e em minúsculas. |
| `nomeEmpresa` | Obrigatório, texto não vazio. Salvo com `trim`. |
| `nomeAdministrador` | Obrigatório, texto não vazio. Salvo com `trim`. |

* Sucesso `201`: o documento criado, com `_id`, `email`, `nomeEmpresa`, `nomeAdministrador`, `status` (`"pendente"` por padrão), `createdAt`, `updatedAt` e `__v`.
* Erros:
  * `400`: validação (mensagem de obrigatório: `O campo '<campo>' é obrigatório.`).
  * `409`: `Já existe uma solicitação pendente para este email.`
  * `500`: erro de banco.

## 5. Usuários

Base: `/api/users`. Auth: nenhuma em nenhuma das rotas.

Formato de um usuário nas respostas: `{ "_id": "<id>", "nome": "<nome>", "role": "<role>" }`. Os campos `email`, `usuario` e `senhaHash` existem no banco mas **não** são devolvidos.

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/api/users` | Lista todos os usuários. `200` com array de usuários. |
| `GET` | `/api/users/:id` | Busca por `_id`. `200` com o usuário. |
| `POST` | `/api/users` | Cria usuário. `201` com o usuário criado. |
| `PUT` | `/api/users/:id` | Atualiza. `200` com o usuário já atualizado. |
| `DELETE` | `/api/users/:id` | Exclui. `200` com `{ "_id": "<id>", "message": "Usuário excluído com sucesso." }`. |

Corpo do `POST`:

| Campo | Regra |
|-------|-------|
| `nome` | Obrigatório, texto não vazio. Único: nome repetido responde `409`. |
| `role` | A regra existe (texto não vazio, valor livre; não há lista de papéis), mas **não é aplicada** (veja o aviso da seção 1). |

Erros:
* `400`: `nome` inválido; `:id` que não é ObjectId.
* `404`: `Usuário não encontrado(a).` (`GET`, `PUT`, `DELETE`).
* `409`: `Já existe um usuário com o nome "<nome>".` (`POST`).
* `500`: demais erros.

Observações:
* Usuário criado por esta rota não tem `email`, `usuario` nem `senhaHash`, então **não consegue fazer login**. Os usuários que logam são criados pelos scripts de seed.
* `PUT` não valida nem filtra o corpo (só remove `_id`). Como `email`, `usuario` e `senhaHash` fazem parte do schema, um `PUT` aberto pode sobrescrevê-los. Isso é consequência direta do código e vale tratar quando as rotas ganharem autenticação.

## 6. Empilhadeiras

Base: `/api/forklifts`. Auth: nenhuma.

Formato nas respostas: `{ "_id": "<id>", "id": "<identificação>", "dispositivoConectadoId": "<id|ausente>", "operadorConectadoId": "<id|ausente>" }`. O campo `id` é a **identificação** da empilhadeira (ex.: `EMP-081`), e o `_id` é o id do banco. `nome`, `setor` e `sessaoIniciadaEm` existem no schema mas não são devolvidos por estas rotas (aparecem em `GET /api/machines`).

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/api/forklifts` | Lista. `200` com array. |
| `GET` | `/api/forklifts/:id` | Busca por `_id`. `200`. |
| `POST` | `/api/forklifts` | Cria. `201`. |
| `PUT` | `/api/forklifts/:id` | Atualiza. `200` com a empilhadeira atualizada. |
| `DELETE` | `/api/forklifts/:id` | Exclui. `200` com `{ "_id": "<id>", "message": "Empilhadeira excluída com sucesso." }`. |

Corpo do `POST`:

| Campo | Regra |
|-------|-------|
| `id` | Obrigatório, texto não vazio (a identificação). Única: repetida responde `409`. |
| `dispositivoConectadoId` | Opcional. Deveria ser ObjectId válido, mas a regra **não é aplicada** (aviso da seção 1). |
| `operadorConectadoId` | Opcional. Mesma situação. |

No `PUT`, o campo `id` do corpo é convertido para `identificacao` antes de gravar; `_id` é descartado; os demais campos (ex.: `nome`, `setor`, `dispositivoConectadoId`) vão direto para o Mongoose sem validação.

Erros:
* `400`: `id` inválido no corpo; `:id` que não é ObjectId.
* `404`: `Empilhadeira não encontrado(a).`
* `409`: `Já existe uma empilhadeira com a identificação "<id>".`
* `500`: demais erros.

Não verificado: o modelo devolve a identificação na chave `id` (`forkliftModel.obterDados`), mas o schema do Mongoose guarda o campo como `identificacao`. Sem rodar contra o banco não dá para afirmar se o `POST` persiste a identificação (e, portanto, se a checagem de duplicidade do `409` funciona). Os testes unitários usam mocks e não cobrem isso.

## 7. Telemetria

Base: `/api/telemetry`. Auth: nenhuma.

Formato nas respostas: `{ "id": "<id>", "dataDados": "<data ISO>", "dispositivoId": "<id>" }`. Atenção: aqui a chave do id do banco é `id`, não `_id` como nos outros módulos.

| Método | Caminho | Descrição | Status de sucesso |
|--------|---------|-----------|-------------------|
| `GET` | `/api/telemetry` | Lista todos os registros. Com `?dispositivoId=<ObjectId>`, só os desse dispositivo, ordenados por `dataDados` decrescente (sem o filtro, a ordem não é definida). | `200` |
| `GET` | `/api/telemetry/:id` | Busca por `_id`. | `201` |
| `POST` | `/api/telemetry` | Cria. | `201` |
| `PUT` | `/api/telemetry/:id` | Atualiza. | `201` |
| `DELETE` | `/api/telemetry/:id` | Exclui e devolve o registro excluído. | `201` |

Os `201` em `GET /:id`, `PUT` e `DELETE` estão assim no código (`StatusCode.CREATED`). Parecem engano, mas são o comportamento atual; um cliente que checa `200` vai falhar nessas rotas.

Corpo do `POST`:

| Campo | Regra |
|-------|-------|
| `dispositivoId` | Obrigatório, ObjectId válido. |
| `dataDados` | Obrigatório e data válida (`new Date(valor)` não pode ser inválida), mas a regra **não é aplicada** (aviso da seção 1). |
| `forcaImpacto` | Opcional. Número finito maior ou igual a 0 (`400` caso contrário). |

Leitura com `forcaImpacto` maior ou igual a `LIMITE_IMPACTO` (variável do `.env`, padrão `5`) cria um incidente `pendente` para a empilhadeira ligada ao dispositivo e muda o status dela para `alerta` (regra da seção 8). Sem empilhadeira ligada, só a leitura é gravada.

No `PUT`, `_id` e `id` são descartados e, se vier `dataDados`, ele é convertido com `new Date(...)`; o resto vai direto ao Mongoose sem validação.

Erros:
* `400`: `dispositivoId` inválido (no corpo, ou `O dispositivoId fornecido não é válido.` na query); `:id` que não é ObjectId.
* `404`: `Telemetria não encontrado(a).` (`GET /:id`, `PUT`, `DELETE`).
* `500`: demais erros.

## 8. Máquinas e categorias

Todas exigem `Authorization: Bearer <token>` e respeitam o escopo do usuário (filiais que ele enxerga).

### `GET /api/machines`

Alimenta a Visão Geral e a Frota. Aceita `?filialId=<ObjectId>` para reduzir a lista a uma filial do escopo (nunca amplia).

Sucesso `200`: array ordenado por `identificacao`, uma entrada por empilhadeira:

```json
[
  {
    "id": "<_id da empilhadeira>",
    "identificacao": "EMP-081",
    "nome": "Empilhadeira Elétrica Titan-X",
    "setor": "Expedição - Bloco B",
    "filialId": "<_id da filial>",
    "status": "alerta",
    "categoriaId": "<_id da categoria> ou null",
    "categoriaTravada": false,
    "alertaEm": "2026-10-14T10:00:00.000Z",
    "dispositivoConectado": { "enderecoMac": "A2:C9:9B:1D:F7" },
    "operadorConectado": { "nome": "Carlos Silva" },
    "tempoSessaoMinutos": 34
  }
]
```

Regras do formato:
* `status` é da empilhadeira: `disponivel`, `em_uso`, `manutencao`, `alerta` ou `offline`. Empilhadeira sem status gravado vem como `disponivel`.
* `alertaEm` é a `dataIncidente` do incidente pendente mais recente; só é preenchido com `status: "alerta"` (senão `null`).
* `dispositivoConectado.enderecoMac` é `""` quando não há dispositivo. O `status` do dispositivo não é mais lido.
* `operadorConectado` só aparece quando há operador ligado.
* `tempoSessaoMinutos` é `floor((agora - sessaoIniciadaEm) / 60000)`, nunca negativo, `0` sem sessão.

### Mudança de status

Toda mudança de status, manual ou por leitura do dispositivo, segue a mesma regra:
* Status igual ao atual não altera nada.
* Status novo grava `status` e `statusAlteradoEm`.
* Saindo de `alerta`, os incidentes `pendente` da máquina viram `resolvido`.
* Com `categoriaTravada: false`, a máquina vai para a categoria da empresa ligada ao novo status (`statusVinculados`); sem categoria ligada, fica onde está. Com a trava ligada, nunca muda de categoria.

| Método | Caminho | Corpo | Sucesso |
|--------|---------|-------|---------|
| `PUT` | `/api/machines/:id/status` | `{ "status": "manutencao" }` | `200` com a máquina |
| `PUT` | `/api/machines/:id/trava` | `{ "categoriaTravada": true }` | `200` com a máquina; não muda a categoria |
| `PUT` | `/api/machines/categoria` | `{ "machineIds": ["<id>"], "categoriaId": "<id>" ou null }` | `200` com as máquinas; não muda status nem trava |

Erros: `400` para corpo inválido ou chave iniciada por `$`; `404` para máquina fora do escopo ou categoria de outra empresa (em `/categoria`, nenhuma máquina é gravada se uma falhar).

`PUT /api/forklifts/:id` recusa com `400` os campos `status`, `statusAlteradoEm`, `categoriaId`, `categoriaTravada` e `sessaoIniciadaEm`: eles só mudam pelas rotas acima.

### Categorias (`/api/categories`)

Categorias pertencem à empresa: todas as filiais usam as mesmas. Formato: `{ "_id", "nome", "cor", "chave", "statusVinculados" }`. `chave` (`acidentes`, `ativas`, `manutencao`, `disponiveis`) só existe nas categorias iniciais e vira `null` quando o nome muda.

| Método | Caminho | Quem | Sucesso |
|--------|---------|------|---------|
| `GET` | `/api/categories` | qualquer usuário da empresa | `200`, na ordem de criação |
| `POST` | `/api/categories` | escopo `empresa` | `201` |
| `PUT` | `/api/categories/:id` | escopo `empresa` | `200` |
| `DELETE` | `/api/categories/:id` | escopo `empresa` | `200` com `{ _id, message }`; as máquinas dela ficam sem categoria e destravadas |

Regras do corpo: `nome` obrigatório no `POST`, cortado nas pontas, até 40 caracteres; `cor` no formato `#RRGGBB`; `statusVinculados` lista de status sem repetição. Mudar `statusVinculados` não move máquinas.

Erros: `400` corpo inválido; `403` escopo `filiais` em `POST`/`PUT`/`DELETE`; `404` categoria de outra empresa; `409` nome repetido na empresa (sem diferenciar maiúscula de minúscula) ou status já ligado a outra categoria.

### Sessões de uso (`/api/sessions`)

Sessão do operador ligado ao usuário (`operadorId`). Formato: `{ "_id", "machineId", "maquina": { "nome", "identificacao", "setor" } ou null (máquina apagada), "operador": { "nome" }, "inicio": ISO, "fim": ISO ou null }`.

| Método | Rota | Corpo / query | Sucesso |
|--------|------|---------------|---------|
| `GET` | `/api/sessions/atual` | | `200` com a sessão aberta ou `null` |
| `POST` | `/api/sessions` | `{ "machineId": "<id>" }` | `201`; grava `operadorConectadoId` e `sessaoIniciadaEm` na máquina e aplica `em_uso` |
| `PUT` | `/api/sessions/atual/encerrar` | | `200`; grava `fim`, limpa operador e início da máquina e aplica `disponivel` só se ela está `em_uso` |
| `GET` | `/api/sessions` | `?from=YYYY-MM-DD&to=YYYY-MM-DD&machineId=<id>` | `200`, mais recente primeiro. Sem `machineId`, só as sessões do operador; com ela, as de qualquer operador da máquina no escopo |

Erros: `400` `machineId` ausente ou não ObjectId, data fora de `YYYY-MM-DD`; `403` usuário sem operador ligado; `404` máquina fora do escopo; `409` máquina não `disponivel`, operador ou máquina com sessão aberta, ou nenhuma sessão aberta ao encerrar. `from` > `to` devolve `[]`. Os dias usam o fuso do servidor.

### Incidentes (`/api/incidents`)

Formato: `{ "_id", "machineId", "maquina": { "nome", "identificacao", "setor" } ou null, "operador": { "nome" } ou null, "dataIncidente": ISO, "forcaImpacto": número ou null, "status", "origem": "sensor" ou "funcionario", "descricao": texto ou null }`.

| Método | Rota | Corpo / query | Sucesso |
|--------|------|---------------|---------|
| `POST` | `/api/incidents` | `{ "horario"?: "HH:mm", "descricao"?: "até 500 caracteres" }` | `201`; incidente `pendente`, `origem: "funcionario"`, na máquina da sessão aberta, `dataIncidente` hoje no `horario` (ou agora); a máquina vai para `alerta` |
| `GET` | `/api/incidents` | `?machineId=<id>&from=YYYY-MM-DD&to=YYYY-MM-DD` | `200`, incidentes das filiais do escopo, mais recente primeiro |

Erros: `400` `horario`, `descricao`, `machineId` ou data inválidos; `403` usuário sem operador; `409` nenhuma sessão aberta. `from` > `to` devolve `[]`.

## 9. Scripts do Backend

Todos rodam dentro de `Backend/` (`yarn <script>`). A conexão usa `MONGODB_URI` e `MONGODB_NAME` do `Backend/.env` (veja `Backend/.env.example` para a lista de variáveis).

### Seeds

Os seeds **escrevem no banco configurado no `.env`**. Quem roda é o dono do projeto, com o ambiente certo em mãos; não rodar de forma automática nem apontando para um ambiente que não se queira alterar.

| Comando | O que faz |
|---------|-----------|
| `yarn seed` | `src/scripts/seedAdmin.ts`. Cria o admin fixo `admin@admin.com` com a senha `asdasdasd`. Se ele já existe, só volta escopo e senha para os fixos (idempotente). |
| `yarn seed:data` | `src/scripts/seedData.ts`. Chama o seed do admin e depois popula as demais coleções. Veja abaixo. |
| `yarn migrate:status` | `src/scripts/migrateStatus.ts`. Leva o `status` antigo do dispositivo (`Disponível`, `Em uso`, `Manutenção`, `Offline`) para a empilhadeira (sem dispositivo: `offline`) e cria o quadro inicial de categorias (Acidentes, Ativas, Manutenção, Disponíveis) nas empresas sem categoria, posicionando as máquinas pelo status. Idempotente. |
| `yarn dev:seed` | Sobe o servidor com `--seed`, que roda só o seed do admin antes de ouvir a porta. |

Os acessos do seed são fixos (`SENHA_PADRAO` e `ADMIN` em `seedDataset.ts`): `admin@admin.com` / `asdasdasd` e `colaborador@colaborador.com` / `asdasdasd`. Dados criados, a partir de `seedDataset.ts`:

* 12 operadores com a ficha da Equipe (matrícula, telefone, cargo e turno), 16 dispositivos (com nome `Mpa-5300` em diante) e 16 empilhadeiras (`EMP-081` a `EMP-096`), com o mesmo conteúdo do mock do Frontend.
* 5 leituras de telemetria por dispositivo e 2 incidentes por empilhadeira, com datas fixas. Só `EMP-081`, `EMP-085` e `EMP-089` ficam em `alerta`, com 1 incidente pendente cada.
* O quadro inicial de categorias da empresa, com as máquinas posicionadas pelo status.
* 12 colaboradores (login pelo campo `usuario`, senha `asdasdasd`), cada um ligado (`operadorId`) ao operator de mesmo nome. `colaborador@colaborador.com` é o login fixo de teste (operador Alexandre Gomes, na Matriz). Quem está "Negado" na Equipe do Figma nasce com `acessoNegado: true`.
* 2 solicitações de acesso pendentes.

**Reset público** (`GET /api/reset`, sem token): apaga os documentos das 11 collections da aplicação (os índices ficam) e roda o `seedData` do zero, respondendo 200 com a contagem. Não depende de variável de ambiente: qualquer pessoa com a URL apaga o banco do ambiente em que a API roda (decisão do dono, projeto pessoal). Um segundo reset enquanto o primeiro roda responde 409.

É **idempotente**: cada registro é gravado com upsert pela chave natural (nome do operador, MAC do dispositivo, identificação da empilhadeira, par dispositivo/data na telemetria, par empilhadeira/data no incidente, `usuario` do colaborador, par email/status na solicitação). Rodar de novo atualiza em vez de duplicar. Exceção esperada: `sessaoIniciadaEm` das empilhadeiras é recalculada a partir do momento da execução, então `tempoSessaoMinutos` volta a ser o do dataset. A conexão é fechada ao final, mesmo se o seed falhar.

### Testes

| Comando | O que roda | Banco |
|---------|------------|-------|
| `yarn test` | `vitest run tests/unit`. Só os testes unitários, com mocks. Na raiz do monorepo, `yarn test` roda isso no Backend e a suíte do Frontend. | Não acessa. |
| `yarn test:integration` | `vitest run tests/integration`. Os testes de `tests/integration/feature/*` importam os schemas e a conexão real e gravam e apagam documentos. | **Acessa o banco do `.env`.** |

Em `tests/integration/` também está `forkliftController.test.ts`, que usa `vi.mock` e não deveria tocar no banco, mas roda junto com o `yarn test:integration`. Não rodei nenhum dos dois comandos para confirmar o comportamento; o texto vem dos scripts do `package.json`, dos imports dos arquivos de teste e do `README.md`.

## 10. Em andamento: filiais e escopo de acesso

Há uma feature em desenvolvimento para escopo por empresa e filial (incluindo novas rotas em `/api/branches`). Nada disso está descrito acima. As rotas serão documentadas aqui quando a feature entrar.
