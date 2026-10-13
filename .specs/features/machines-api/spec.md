# Visão Geral lendo a API e seeds das collections Specification

## Problem Statement

A Visão Geral das Máquinas lê `MACHINES`, um mock em `Frontend/src/data/machines.ts`. O backend já guarda `forklift`, `device` e `operator`, mas não tem uma rota que junte os três no formato que a tela usa, nem dados para exibir. Sem isso o front não consegue consumir a API real. Nenhuma collection tem script de seed além do admin.

## Goals

- [ ] `GET /api/machines` devolve as empilhadeiras com dispositivo e operador no formato do tipo `Machine` do front.
- [ ] `yarn seed:data` popula `operator`, `device`, `forklift`, `telemetry`, `incident`, `user` (colaboradores) e `accessRequest`, e pode rodar várias vezes sem duplicar.
- [ ] A Visão Geral carrega as máquinas dessa rota, com skeleton enquanto espera e mensagem de erro com nova tentativa.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Frota, Equipe, Alertas e telas do funcionário lendo da API | Decisão do dono: só a Visão Geral por enquanto |
| Cadastrar, editar e excluir máquina pela API | O painel continua alterando só a lista em memória; exige rotas de device e operator |
| Autenticação e escopo por filial na rota | Features C e D do plano de filiais; a rota segue aberta como as outras |
| Seeds de `company`, `branch` e setor | Essas collections ainda não existem (feature B) |
| Entidade `sector` e campo `unidade` | `setor` fica como texto na empilhadeira até a feature B |
| Rotas de device, operator, incident e histórico de telemetria | Não são necessárias para a Visão Geral |
| Histórico do modal de detalhe vindo da API | Continua mock até existir rota de incident |
| Mudar `forkliftModel` e as rotas `/api/forklifts` | Os campos novos entram só no schema e na rota nova |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Rota nova | `GET /api/machines`, separada de `/api/forklifts` | A tela precisa de uma forma junta (forklift + device + operator); `/api/forklifts` devolve só ids e tem outro contrato testado | n |
| Campos que o schema `forklift` não tinha | `nome` (texto), `setor` (texto) e `sessaoIniciadaEm` (data), todos opcionais | São os campos do mock sem lugar no banco (AD-005); opcionais não quebram documentos existentes | n |
| `tempoSessaoMinutos` | Calculado na resposta: minutos desde `sessaoIniciadaEm`, 0 sem ela | Guardar o número ficaria velho a cada minuto | n |
| Empilhadeira sem dispositivo | `dispositivoConectado` vira `{ enderecoMac: '', status: 'Offline' }` | O tipo `Machine` exige o campo; Offline é o estado honesto | n |
| Ordem da lista | Por `identificacao` crescente | `find()` sem ordem não tem ordem garantida | n |
| Auth na rota | Sem token, igual às demais rotas atuais | Proteção de rotas é a feature C | y |
| Quem roda o seed | O dono; o agente escreve o script e os testes com mocks e nunca o executa | Regra global: nunca acessar o banco | y |
| Comando do seed | `yarn seed:data`, que também chama o `seedAdmin` existente | Um comando só; `seedAdmin` já é idempotente e depende de env | n |
| Dados do seed | Os 16 itens de `BASE_MACHINES` do mock (EMP-081 a EMP-096), seus operadores e MACs | O front continua com a mesma aparência | n |
| Operadores | Os nomes que aparecem no mock: operadores das máquinas e dos eventos | Evita operador sem uso | n |
| Chave de cada collection | `operator.nome`, `device.enderecoMac`, `forklift.identificacao`, `user.usuario`, `accessRequest.email`+`status`, `telemetry.dispositivoId`+`dataDados`, `incident.empilhadeiraId`+`dataIncidente` | Upsert por chave natural dá idempotência | n |
| Telemetria do seed | 5 leituras por dispositivo, de hora em hora a partir de `2026-09-01T08:00:00Z` | Âncora fixa mantém a chave estável entre execuções | n |
| Incidentes do seed | 2 por empilhadeira, em datas fixas, com `forcaImpacto` de 3 a 9 e `status` `pendente` ou `resolvido` | O schema não define escala; números plausíveis | n |
| Usuários colaboradores | Criados dos 11 funcionários do mock de Equipe, com `usuario` e senha vinda de `SEED_COLABORADOR_SENHA`; sem a variável, são ignorados com aviso | Mesmo padrão do `seedAdmin`; nenhuma senha no código | n |
| `sessaoIniciadaEm` no seed | `agora − tempoSessaoMinutos` quando o mock tem mais de 0 minutos, recalculado a cada execução | Mantém o tempo de sessão plausível | n |
| Histórico do modal de detalhe | Segue o mock, escolhido pela `identificacao` da máquina | Os ids da API são ObjectId e os eventos do mock usam `'1'` a `'16'` | n |
| Estado de carregamento | Passa a ser o da requisição; `useFirstVisitLoading('visao-geral')` sai da tela | A espera deixa de ser simulada | n |
| Textos novos | `machines.loadError` e `common.retry` nos 7 idiomas | AD-006 | y |
| URL da API | `VITE_API_URL` com fallback `http://localhost:3000/api`, já em `services/api.ts` | Nenhuma mudança | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Rota de máquinas ⭐ MVP

**User Story**: As a gestor, I want listar as máquinas pela API so that a Visão Geral mostre dados reais.

**Why P1**: É a base de tudo; sem ela o front não tem o que consumir.

**Acceptance Criteria**:

1. The schema `forklift` SHALL aceitar `nome`, `setor` e `sessaoIniciadaEm` opcionais.
2. WHEN `GET /api/machines` é chamada THEN the backend SHALL responder 200 com um array de `{ id, identificacao, nome, setor, dispositivoConectado: { enderecoMac, status }, operadorConectado?, tempoSessaoMinutos }`, onde `id` é o `_id` em texto.
3. WHEN a empilhadeira tem operador ligado THEN the item SHALL incluir `operadorConectado: { nome }`.
4. WHEN a empilhadeira não tem operador THEN the item SHALL NOT ter a propriedade `operadorConectado`.
5. WHEN a empilhadeira tem `sessaoIniciadaEm` THEN the `tempoSessaoMinutos` SHALL ser os minutos inteiros entre essa data e agora, nunca negativo.
6. WHEN a empilhadeira não tem `sessaoIniciadaEm` THEN the `tempoSessaoMinutos` SHALL ser 0.
7. IF a empilhadeira não tem dispositivo ligado ou o dispositivo não existe mais THEN the `dispositivoConectado` SHALL ser `{ enderecoMac: '', status: 'Offline' }`.
8. The lista SHALL vir ordenada por `identificacao` crescente.
9. IF a consulta ao banco falha THEN the backend SHALL responder 500 com `{ error: <mensagem> }`.

**Independent Test**: Com as máquinas no banco, `GET /api/machines` devolve 16 itens ordenados de EMP-081 a EMP-096.

---

### P1: Seeds de todas as collections ⭐ MVP

**User Story**: As a dev, I want popular o banco com dados de exemplo so that o front tenha o que consumir.

**Why P1**: Sem dados a rota devolve lista vazia.

**Acceptance Criteria**:

1. WHEN `yarn seed:data` roda THEN the script SHALL criar 8 operadores, 16 dispositivos, 16 empilhadeiras, 80 leituras de telemetria, 32 incidentes e 2 solicitações de acesso.
2. WHEN uma empilhadeira é semeada THEN the documento SHALL ter `dispositivoConectadoId` do seu dispositivo e `operadorConectadoId` do seu operador quando o mock tem um.
3. WHEN a empilhadeira tem `tempoSessaoMinutos` maior que 0 no mock THEN the `sessaoIniciadaEm` SHALL ser agora menos esses minutos.
4. WHEN o script roda de novo THEN the script SHALL NOT duplicar nenhum documento, atualizando os existentes pela chave natural.
5. WHERE `SEED_COLABORADOR_SENHA` está definida THE script SHALL criar os 11 usuários colaboradores com `senhaHash` que valida essa senha.
6. IF `SEED_COLABORADOR_SENHA` não está definida THEN the script SHALL pular os colaboradores e registrar um aviso.
7. WHEN o script roda THEN the script SHALL chamar o `seedAdmin` existente.
8. WHEN o script termina THEN the script SHALL registrar a quantidade de documentos por collection e fechar a conexão.
9. The script SHALL NOT conter senhas literais.

**Independent Test**: Rodar `yarn seed:data` duas vezes (pelo dono) e contar os documentos: os números não mudam na segunda vez.

---

### P1: Visão Geral lendo a API ⭐ MVP

**User Story**: As a gestor, I want ver as máquinas reais na Visão Geral so that a tela reflita o banco.

**Why P1**: É o pedido central.

**Acceptance Criteria**:

1. WHEN a Visão Geral abre THEN the tela SHALL chamar `GET /machines` e exibir um card por máquina devolvida.
2. WHILE a requisição está pendente THE tela SHALL exibir o skeleton de grade com `aria-busy="true"`.
3. IF a requisição falha THEN the tela SHALL exibir a mensagem "Não foi possível carregar as máquinas." e o botão "Tentar novamente".
4. WHEN o usuário clica em "Tentar novamente" THEN the tela SHALL chamar `GET /machines` de novo e voltar ao skeleton.
5. WHEN a API devolve lista vazia THEN the tela SHALL exibir "Nenhuma máquina encontrada".
6. WHEN o usuário busca ou filtra por status THEN the tela SHALL filtrar a lista carregada, como hoje.
7. WHEN o usuário cadastra, edita ou exclui uma máquina THEN the tela SHALL alterar só a lista em memória, sem chamar a API.
8. WHEN o modal de detalhe abre THEN the histórico SHALL mostrar os eventos do mock da máquina com a mesma `identificacao`, ou lista vazia se não houver.
9. WHERE o idioma ativo é qualquer um dos 7 suportados THE mensagem de erro e o botão SHALL aparecer traduzidos.

**Independent Test**: Com o backend semeado e no ar, a Visão Geral mostra 16 cards; com o backend parado, mostra a mensagem de erro e o botão.

---

## Edge Cases

- WHEN uma empilhadeira tem `operadorConectadoId` apontando para um operador apagado THEN the item SHALL NOT ter `operadorConectado`.
- WHEN `sessaoIniciadaEm` está no futuro THEN the `tempoSessaoMinutos` SHALL ser 0.
- WHEN a resposta da API tem um status que o filtro não conhece THEN the card SHALL aparecer sob o filtro "Todos".

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MCH-01 | P1 Rota: AC1 | Execute | Implementing |
| MCH-02 | P1 Rota: AC2, AC3, AC4, AC8; Edge: operador apagado | Execute | Implementing |
| MCH-03 | P1 Rota: AC5, AC6; Edge: data futura | Execute | Implementing |
| MCH-04 | P1 Rota: AC7, AC9 | Execute | Implementing |
| SED-01 | P1 Seeds: AC1, AC2, AC3 | Execute | Implementing |
| SED-02 | P1 Seeds: AC4 | Execute | Implementing |
| SED-03 | P1 Seeds: AC5, AC6, AC9 | Execute | Implementing |
| SED-04 | P1 Seeds: AC7, AC8 | Execute | Implementing |
| VGR-01 | P1 Visão Geral: AC1, AC2, AC5, AC6; Edge: status desconhecido | Execute | Implementing |
| VGR-02 | P1 Visão Geral: AC3, AC4, AC9 | Execute | Implementing |
| VGR-03 | P1 Visão Geral: AC7, AC8 | Execute | Pending |

---

## Success Criteria

- [ ] Depois de `yarn seed:data` (rodado pelo dono), `GET /api/machines` devolve 16 máquinas e a Visão Geral mostra os 16 cards.
- [ ] Rodar o seed uma segunda vez não muda a contagem de nenhuma collection.
- [ ] Com o backend parado a Visão Geral mostra o erro e o botão de nova tentativa.
- [ ] Lint, `tsc -b`, build e testes do Frontend passam, exceto as 3 falhas antigas de `34 min`; os testes unitários novos do Backend passam sem tocar no banco.
