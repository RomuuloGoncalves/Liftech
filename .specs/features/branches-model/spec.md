# Empresas e filiais: modelo, seeds, migração e CRUD de filiais Specification

## Problem Statement

Hoje o backend não tem empresa nem filial: só `accessRequest.nomeEmpresa` guarda um nome solto, e todo recurso é global. O AD-008 decidiu dois eixos independentes: `role` (o que o usuário vê) e escopo (onde ele atua). Esta feature cria o modelo de dados desse escopo (collections `company` e `branch`, campos no `user` e `filialId` nos recursos), os seeds, a migração dos dados atuais e o CRUD de filiais. Ela não verifica o JWT nem filtra consultas; isso é a feature `access-scope`.

## Goals

- [ ] Existem as collections `company` e `branch` (a matriz é uma filial com `matriz: true`, uma por empresa), e `user` guarda `empresaId`, `escopo` e `filiaisIds`.
- [ ] `forklift`, `device`, `operator` e `incident` guardam um único `filialId`.
- [ ] A resposta do login traz a empresa, o escopo e as filiais do usuário.
- [ ] O `branchRouter` expõe listar, criar, renomear e excluir filiais, com as regras de escopo de empresa.
- [ ] `yarn seed:data` semeia 1 empresa, 3 filiais e distribui recursos e usuários; `yarn migrate:branches` leva os dados atuais para a matriz da empresa padrão. Ambos são idempotentes.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Verificar o JWT, carregar o usuário por requisição e proteger rotas | Feature `access-scope` (AD-008, plano C) |
| Filtro de escopo no `RepositoryBase` e rotas de forklift, telemetria, usuários e máquinas escopadas | Feature `access-scope` |
| Montar `/api/branches` no `server.ts` | Sem o middleware `autenticar` a rota não tem `req.escopo`; a feature `access-scope` monta atrás dele |
| Frontend: seletor de filial na Sidebar, "Nome da companhia" | Feature `branches-frontend` (plano D) |
| Entidade `sector` e troca do texto `unidade`/`setor` | Decisão do AD-008: fica para depois |
| Mover recurso ou funcionário entre filiais | Regra de escopo, entra na `access-scope` |
| Admin próprio por filial e gestão de quem vê qual filial | Gestão de acesso, fora deste plano |
| Criar a empresa por API ou ao aprovar uma `accessRequest` | Hoje só seed e migração criam `company` |
| Transação na exclusão de filial | Verificar e apagar são dois passos; o risco é aceito (ver Assumptions) |
| `device`, `operator` e `incident` ganharem rotas ou models com `filialId` | Só `forklift` tem CRUD hoje; os outros ganham o campo no schema |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Forma do escopo | `Escopo = { empresaId, tipo: 'empresa' \| 'filiais', filiais: [{ _id, nome, matriz }] }`; `filiais` já traz as filiais visíveis (todas da empresa quando `tipo` é `empresa`) | Uma só estrutura serve ao login, ao `GET /api/branches` e (na `access-scope`) ao filtro | n |
| Filial de outra empresa em `filiaisIds` | Ignorada: `carregarEscopo` busca as filiais com `empresaId` do usuário | O AD-008 exige validar cada filial contra a empresa de quem chama | y |
| Usuário sem `empresaId` (dado legado) | `tipo: 'filiais'` e `filiais: []`; o login responde `empresa: null` | Falha fechada: não vê nada até a migração rodar | n |
| Obrigatoriedade | `user.empresaId` e `filialId` dos 4 recursos são `required` no schema | A validação do Mongoose só roda em `create`/`save`, então documentos antigos e upserts do seed seguem válidos; a migração preenche os antigos | n |
| `escopo` do usuário | Enum `'empresa'` ou `'filiais'`, padrão `'filiais'`; `filiaisIds` padrão `[]` | Padrão que não dá acesso (falha fechada) | y |
| Matriz | Criada só por seed e migração; `POST /api/branches` ignora `matriz` do corpo e cria sempre `false`; único índice parcial `{ empresaId } where matriz: true` garante uma por empresa | Restrição no banco em vez de código | y |
| Nome único | Índice único `{ empresaId, nome }`, que diferencia maiúsculas; o duplicado vira 409 pelo código 11000 do Mongo | Restrição no banco; sem checagem manual | n |
| Renomear a matriz | Permitido; só `nome` muda por `PUT` | A matriz é uma filial normal com um flag | n |
| Filial de outra empresa por id | 404, igual a não existir | Nunca revelar que existe | y |
| Ordem das filiais | Matriz primeiro, depois por `nome` | Ordem estável para o seletor | n |
| Exclusão de filial | Checa `exists({ filialId })` em forklift, device, operator e incident e depois apaga, sem transação; `filiaisIds` de usuários que apontam para a filial apagada ficam órfãos e `carregarEscopo` os ignora | Corrida rara entre checar e apagar; transação exige replica set | n |
| `POST /api/users` e `POST /api/forklifts` até a `access-scope` | Aceitam `empresaId` / `filialId` do corpo (obrigatório e ObjectId válido) | O schema agora exige o campo; sem isso a criação quebraria; a `access-scope` troca por escopo do chamador | n |
| Empresa e matriz padrão | Nomes `Liftech Logística` e `Matriz`, constantes em `seedDataset.ts`; seed e migração usam as mesmas | Os dois convergem para a mesma empresa | n |
| Seed standalone do admin (`yarn seed`, `--seed`) | `seedAdmin` garante a empresa padrão e a matriz sozinho quando não recebe `empresaId` | O admin precisa de empresa para existir | n |
| Admin que já existe | `seedAdmin` atualiza só `empresaId` e `escopo: 'empresa'` dele e não recria | O AD-008 pede que o admin do seed tenha escopo de empresa | n |
| Distribuição do seed | Setor do mock vira filial: Expedição - Bloco B para Matriz, Recebimento - Bloco A para Unidade Centro, Armazenagem - Bloco C para Unidade Norte. Dispositivo e incidente herdam a filial da empilhadeira; operador herda a da primeira empilhadeira que o cita, ou a Matriz se nenhuma | Deriva dos dados que já existem | n |
| Operador de reserva do incidente | Mantém a regra do seed atual (`OPERADORES[i % 8]`), e pode ser de outra filial que a empilhadeira | Mudar a regra quebraria o contrato do `machines-api`; é dado de exemplo | n |
| Colaboradores do seed | `escopo: 'filiais'` com uma filial cada (tabela explícita de 11), e `PauloNunes` com Unidade Centro e Unidade Norte | Cobre o teste manual de usuário com duas filiais | n |
| Migração: usuários | `role: 'admin'` sem `empresaId` vira `escopo: 'empresa'`; qualquer outro role sem `empresaId` vira `escopo: 'filiais'` com `[matriz]` | Admins existentes administram a empresa; os demais ficam na matriz | n |
| Migração: o que é "faltando" | Filtro `{ campo: null }`, que casa campo ausente ou nulo | Idempotente e não toca em documento já migrado | n |
| Quem roda | O dono roda `yarn seed:data` e `yarn migrate:branches`; os scripts são testados só com models mockados | Regra global: nunca acessar o banco | y |
| Teste de schema | Testes unitários importam o schema real com `config/conn` mockado (só `mongoose`, sem conectar) e usam `validateSync()` e `schema.indexes()` | Verifica `required`, enum e índices sem tocar no banco | n |
| Testes de integração do schema | Os 5 arquivos de `tests/integration/feature/*` ganham o campo agora obrigatório (`empresaId`/`filialId`) | O schema mudou; não são executados aqui | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Modelo de empresa, filial e escopo ⭐ MVP

**User Story**: As a dev, I want empresa, filial e campos de escopo no banco so that as features seguintes filtrem por filial.

**Why P1**: Todo o resto do plano de filiais depende desses campos.

**Acceptance Criteria**:

1. The collection `company` SHALL guardar `nome` obrigatório e único.
2. The collection `branch` SHALL guardar `nome` e `empresaId` obrigatórios e `matriz` booleano com padrão `false`.
3. The collection `branch` SHALL ter índice único em `empresaId` + `nome`.
4. The collection `branch` SHALL ter índice único em `empresaId` restrito a documentos com `matriz: true`.
5. The schema `user` SHALL exigir `empresaId` e aceitar `escopo` e `filiaisIds`.
6. WHEN um usuário é validado sem `escopo` THEN o `escopo` SHALL valer `'filiais'` e `filiaisIds` SHALL valer lista vazia.
7. IF o `escopo` do usuário não é `'empresa'` nem `'filiais'` THEN a validação SHALL rejeitar o documento.
8. The schemas `forklift`, `device`, `operator` e `incident` SHALL exigir `filialId`.
9. WHEN `GET /api/users` ou `GET /api/users/:id` responde THEN o usuário SHALL incluir `empresaId`, `escopo` e `filiaisIds`.
10. WHEN `POST /api/users` recebe `nome`, `role` e `empresaId` válidos THEN o backend SHALL criar o usuário com esses campos e com `escopo` e `filiaisIds` do corpo quando enviados.
11. IF `POST /api/users` recebe `empresaId` ausente ou que não é ObjectId, `escopo` fora de `'empresa'` e `'filiais'`, ou `filiaisIds` que não é lista de ObjectId THEN o backend SHALL responder 400.
12. WHEN `GET /api/forklifts` ou `GET /api/forklifts/:id` responde THEN a empilhadeira SHALL incluir `filialId`.
13. WHEN `POST /api/forklifts` recebe `id` e `filialId` válidos THEN o backend SHALL criar a empilhadeira com esse `filialId`.
14. IF `POST /api/forklifts` recebe `filialId` ausente ou que não é ObjectId THEN o backend SHALL responder 400.

**Independent Test**: `validateSync()` do `branch` sem `empresaId` falha; `schema.indexes()` lista os dois índices únicos; `POST /api/forklifts` sem `filialId` devolve 400.

---

### P1: Escopo do usuário e payload do login ⭐ MVP

**User Story**: As a front, I want o login devolver empresa, escopo e filiais so that o seletor de filial saiba o que mostrar.

**Why P1**: A Sidebar (feature D) e o middleware (feature C) partem desse cálculo.

**Acceptance Criteria**:

1. WHEN o usuário tem `escopo: 'empresa'` THEN `carregarEscopo` SHALL devolver `tipo: 'empresa'` e todas as filiais da sua empresa.
2. WHEN o usuário tem `escopo: 'filiais'` THEN `carregarEscopo` SHALL devolver `tipo: 'filiais'` e só as filiais da sua empresa cujo id está em `filiaisIds`.
3. IF o usuário tem `escopo: 'filiais'` com `filiaisIds` vazio THEN `carregarEscopo` SHALL devolver `filiais` vazio.
4. IF um id de `filiaisIds` não existe ou pertence a outra empresa THEN `carregarEscopo` SHALL omitir essa filial.
5. The `filiais` do escopo SHALL vir como `{ _id, nome, matriz }` com `_id` em texto, a matriz primeiro e depois por `nome`.
6. IF o usuário não tem `empresaId` THEN `carregarEscopo` SHALL devolver `tipo: 'filiais'` e `filiais` vazio sem consultar filiais.
7. WHEN o login é bem-sucedido THEN `user` SHALL incluir `empresa: { _id, nome }`, `escopo` (o `tipo`) e `filiais`, além de `_id`, `nome` e `role`.
8. IF o usuário não tem `empresaId` THEN o login SHALL responder `empresa: null`, `escopo: 'filiais'` e `filiais: []`.
9. The JWT do login SHALL continuar com `sub` e `role` apenas.

**Independent Test**: Login de um admin de escopo empresa devolve as 3 filiais; login de um colaborador com uma filial devolve só ela.

---

### P1: CRUD de filiais ⭐ MVP

**User Story**: As a admin da empresa, I want listar, criar, renomear e excluir filiais so that eu mantenha a estrutura da empresa.

**Why P1**: É o que o seletor da Sidebar (feature D) consome.

O `branchRouter` expõe `GET /`, `POST /`, `PUT /:id` e `DELETE /:id`. Os handlers leem o escopo do chamador em `req.escopo`, que o middleware `autenticar` (feature `access-scope`) preenche.

**Acceptance Criteria**:

1. WHEN `GET /` é chamada THEN o backend SHALL responder 200 com as filiais de `req.escopo.filiais` no formato `{ _id, nome, matriz }`.
2. IF o chamador de `POST /`, `PUT /:id` ou `DELETE /:id` não tem `escopo: 'empresa'` THEN o backend SHALL responder 403 com `{ error }` antes de validar o corpo ou o id.
3. WHEN `POST /` recebe um `nome` válido THEN o backend SHALL criar a filial na empresa do chamador com `matriz: false` e responder 201 com `{ _id, nome, matriz }`.
4. WHEN `POST /` recebe `matriz: true` no corpo THEN o backend SHALL ignorar esse campo e criar a filial com `matriz: false`.
5. IF `nome` está ausente, vazio ou não é texto THEN `POST /` e `PUT /:id` SHALL responder 400.
6. IF já existe uma filial com o mesmo `nome` na empresa THEN `POST /` e `PUT /:id` SHALL responder 409.
7. WHEN `PUT /:id` recebe um `nome` válido THEN o backend SHALL mudar só o `nome` da filial e responder 200 com `{ _id, nome, matriz }`.
8. IF o `:id` de `PUT` ou `DELETE` não é um ObjectId válido THEN o backend SHALL responder 400.
9. IF o `:id` de `PUT` ou `DELETE` não existe ou pertence a outra empresa THEN o backend SHALL responder 404.
10. WHEN `DELETE /:id` atinge uma filial que não é matriz e não tem empilhadeiras, dispositivos, operadores nem incidentes THEN o backend SHALL apagá-la e responder 200 com `{ _id, message }`.
11. IF a filial do `DELETE` é a matriz da empresa THEN o backend SHALL responder 409 sem apagar.
12. IF a filial do `DELETE` ainda tem empilhadeiras, dispositivos, operadores ou incidentes THEN o backend SHALL responder 409 sem apagar.
13. IF o banco falha em qualquer rota THEN o backend SHALL responder 500 com `{ error: <mensagem> }`.

**Independent Test**: Com o `branchRouter` montado, um admin de empresa cria "Unidade Sul", renomeia para "Unidade Leste" e a exclui; tentar excluir a matriz devolve 409.

---

### P1: Seeds com empresa e filiais ⭐ MVP

**User Story**: As a dev, I want o `yarn seed:data` criar empresa, filiais e distribuir os dados so that eu teste o escopo à mão.

**Why P1**: Sem dados distribuídos não há como testar a feature C.

**Acceptance Criteria**:

1. WHEN `yarn seed:data` roda THEN o script SHALL criar 1 empresa e 3 filiais: a matriz (`matriz: true`), "Unidade Centro" e "Unidade Norte".
2. WHEN uma empilhadeira é semeada THEN o documento SHALL ter o `filialId` da filial do seu setor (Expedição - Bloco B na matriz, Recebimento - Bloco A em Unidade Centro, Armazenagem - Bloco C em Unidade Norte).
3. WHEN um dispositivo é semeado THEN o documento SHALL ter o `filialId` da filial da sua empilhadeira.
4. WHEN um operador é semeado THEN o documento SHALL ter o `filialId` da filial da primeira empilhadeira que o cita, ou o da matriz se nenhuma o cita.
5. WHEN um incidente é semeado THEN o documento SHALL ter o `filialId` da filial da sua empilhadeira.
6. WHERE `SEED_COLABORADOR_SENHA` está definida THE script SHALL criar cada colaborador com `empresaId`, `escopo: 'filiais'` e as `filiaisIds` da tabela do dataset, com ao menos um colaborador em duas filiais.
7. WHEN o `seedAdmin` recebe o `empresaId` THEN ele SHALL criar o admin com `empresaId` e `escopo: 'empresa'`.
8. IF o admin do `seedAdmin` já existe THEN o `seedAdmin` SHALL atualizar nele só `empresaId` e `escopo: 'empresa'`, sem criar outro.
9. WHEN o `seedAdmin` roda sem `empresaId` THEN ele SHALL garantir sozinho a empresa padrão e a matriz.
10. WHEN o script roda de novo THEN o script SHALL NOT duplicar empresa nem filial, atualizando pela chave natural (`company.nome`; `branch.empresaId` + `nome`).
11. WHEN o script termina THEN o log SHALL incluir a quantidade de empresas e de filiais.
12. The script SHALL NOT conter senhas literais.

**Independent Test**: Rodar `yarn seed:data` duas vezes (pelo dono): 1 empresa e 3 filiais nas duas; EMP-081 na Matriz, EMP-083 em Unidade Centro, EMP-085 em Unidade Norte.

---

### P1: Migração dos dados existentes ⭐ MVP

**User Story**: As a dono, I want migrar o banco atual para o modelo de filiais so that nenhum dado fique sem empresa e filial.

**Why P1**: O banco real já tem usuários e recursos sem esses campos.

Como rodar (só o dono): `cd Backend && yarn migrate:branches`. O script usa `MONGODB_URI` e `MONGODB_NAME` do `.env` como os outros scripts, cria a empresa padrão e a matriz se faltarem, e atualiza só documentos sem `empresaId` ou `filialId`. Rodar de novo não altera nada. Depois da migração, os usuários antigos fazem login com empresa e filiais.

**Acceptance Criteria**:

1. WHEN `yarn migrate:branches` roda THEN o script SHALL garantir a empresa padrão e a sua matriz.
2. WHEN há usuários com `role: 'admin'` sem `empresaId` THEN o script SHALL definir neles `empresaId` e `escopo: 'empresa'`.
3. WHEN há usuários de outro role sem `empresaId` THEN o script SHALL definir neles `empresaId`, `escopo: 'filiais'` e `filiaisIds: [<matriz>]`.
4. WHEN há empilhadeiras, dispositivos, operadores ou incidentes sem `filialId` THEN o script SHALL definir neles o `filialId` da matriz.
5. The script SHALL atualizar apenas documentos cujo campo alvo é ausente ou nulo.
6. WHEN o script roda de novo THEN o script SHALL NOT alterar documentos já migrados.
7. WHEN o script termina THEN o log SHALL registrar quantos documentos mudaram por collection.
8. WHEN o script termina com sucesso ou com erro THEN o script SHALL fechar a conexão com o banco.

**Independent Test**: Num banco de teste do dono, rodar a migração duas vezes: na segunda o log mostra 0 alterações em todas as collections.

---

### P2: Documentação do modelo de dados

**User Story**: As a dev, I want o doc de modelagem atualizado so that as entidades novas estejam registradas.

**Why P2**: Não bloqueia o código, mas o doc fica errado sem isso.

**Acceptance Criteria**:

1. The documento `docs/modelagem_de_dados.md` SHALL descrever `Company`, `Branch`, os campos `empresaId`, `escopo` e `filiaisIds` do `User` e o `filialId` de `Forklift`, `Device`, `Operator` e `Incident`.
2. The documento SHALL registrar a migração `yarn migrate:branches` e a regra de uma matriz por empresa.

---

## Edge Cases

- IF `POST /api/branches` recebe um `nome` só com espaços THEN the backend SHALL responder 400.
- WHEN o `nome` de `POST` ou `PUT` tem espaços nas pontas THEN the backend SHALL gravá-lo sem eles.
- WHEN `PUT /:id` recebe `matriz` no corpo THEN the backend SHALL ignorar esse campo.
- WHEN o usuário tem uma filial em `filiaisIds` que foi apagada THEN `carregarEscopo` SHALL omiti-la sem falhar.
- IF `carregarEscopo` recebe `escopo` indefinido com `empresaId` presente THEN ele SHALL tratar como `'filiais'`.
- IF a migração encontra o usuário já com `empresaId` THEN o script SHALL deixá-lo como está.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| BRM-01 | P1 Modelo: AC1, AC2, AC3, AC4 | Tasks | Pending |
| BRM-02 | P1 Modelo: AC5, AC6, AC7 | Tasks | Pending |
| BRM-03 | P1 Modelo: AC8 | Tasks | Pending |
| BRM-04 | P1 Modelo: AC9, AC10, AC11 | Tasks | Pending |
| BRM-05 | P1 Modelo: AC12, AC13, AC14 | Tasks | Pending |
| BRM-06 | P1 Escopo: AC1 a AC6; Edge: filial apagada, escopo indefinido | Tasks | Pending |
| BRM-07 | P1 Escopo: AC7, AC8, AC9 | Tasks | Pending |
| BRM-08 | P1 CRUD: AC1, AC2, AC13 | Tasks | Pending |
| BRM-09 | P1 CRUD: AC3, AC4, AC5, AC6, AC7, AC8, AC9; Edge: nome em branco, nome com espaços, matriz no PUT | Tasks | Pending |
| BRM-10 | P1 CRUD: AC10, AC11, AC12 | Tasks | Pending |
| BRM-11 | P1 Seeds: AC1, AC2, AC3, AC4, AC5, AC6, AC12 | Tasks | Pending |
| BRM-12 | P1 Seeds: AC7, AC8, AC9, AC10, AC11 | Tasks | Pending |
| BRM-13 | P1 Migração: AC1, AC2, AC3, AC4; Edge: usuário já migrado | Tasks | Pending |
| BRM-14 | P1 Migração: AC5, AC6, AC7, AC8 | Tasks | Pending |
| BRM-15 | P2 Documentação: AC1, AC2 | Tasks | Pending |

**Coverage:** 15 total, 15 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Depois de `yarn seed:data` (rodado pelo dono), existem 1 empresa e 3 filiais, cada recurso tem `filialId` e o login do admin devolve as 3 filiais.
- [ ] Depois de `yarn migrate:branches` num banco antigo, nenhum usuário nem recurso fica sem `empresaId`/`filialId`, e uma segunda execução não altera nada.
- [ ] O `branchRouter` cria, renomeia e exclui filiais com as regras de matriz, de vínculo e de escopo de empresa.
- [ ] `npx tsc --noEmit` sem erros e `npx vitest run tests/unit` sem falhas, sem tocar no banco.
