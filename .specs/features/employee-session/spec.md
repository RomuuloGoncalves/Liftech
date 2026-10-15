# Sessão do funcionário, ocorrência e login do colaborador Specification

## Problem Statement

A área do funcionário (`/funcionario/*`) roda em mock. A sessão de uso vive só no `sessionStorage`, e o nome, a última máquina e o histórico vêm de `employeeArea.ts`. Já a ocorrência só mostra um toast. Os eventos de acidente do detalhe da máquina e da tela de Alertas também são mock (`MACHINE_EVENTS`).

O backend aceita o login do colaborador (`POST /api/auth/login` com `role: 'colaborador'`), mas o `user` não sabe qual `operator` ele é. O `operator` é quem retira a máquina e é a pessoa que a empilhadeira e o incidente referenciam. O `user` serve só para o login.

## Goals

- [ ] O colaborador entra na área do funcionário com login e senha, como o admin entra no painel.
- [ ] O funcionário inicia e encerra uma sessão de uso numa máquina disponível. A máquina passa a `em_uso` e volta a `disponivel`, e o operador e o tempo de sessão aparecem no painel.
- [ ] O funcionário reporta uma ocorrência na sessão. Isso cria um incidente pendente e põe a máquina em `alerta`.
- [ ] O histórico de uso do funcionário e os acidentes do detalhe da máquina e da tela de Alertas vêm da API.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Middleware de role nas rotas do admin | Não pedido ("só a funcionalidade de login, igual ao admin"). Hoje o colaborador com token consegue chamar as rotas do painel |
| Guarda de rota do painel admin | Não pedido |
| Histórico de reparos (manutenção) pela API | Não existe registro de manutenção no backend; a aba segue em mock |
| Jornada de trabalho e horas restantes | Não existe dado de jornada; os textos seguem fixos |
| Cadastro de operador e ligação user-operator pela tela | Só seed e banco nesta feature |
| Offline por heartbeat e autenticação do dispositivo | Pendência do AD-010 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| User e operator | O `user` colaborador ganha `operadorId` (ref `operator`). A sessão e o incidente gravam o operator | Dono: "o user é só pro login, o operator é quem retira a máquina" | y |
| Colaborador sem `operadorId` | Faz login normalmente; iniciar sessão ou reportar ocorrência responde 403 "Usuário sem operador ligado." | Falha fechada | n |
| Login do colaborador | Mesma rota e tela; a resposta ganha `operador: { _id, nome } \| null` | "igual é pro adm" | y |
| Área do funcionário sem login | `/funcionario/*` sem sessão de colaborador no `localStorage` redireciona para `/login/colaborador` | É o que faz o login do funcionário ter efeito; o painel admin fica como está | n |
| Sessão de uso | Coleção nova `workSession` com `operadorId`, `empilhadeiraId`, `filialId`, `inicio` e `fim` (null enquanto aberta) | Histórico precisa de registro por sessão | y |
| Iniciar sessão | Só com máquina `disponivel`, do escopo do usuário, sem sessão aberta do operador nem da máquina. Grava `operadorConectadoId` e `sessaoIniciadaEm` na empilhadeira e chama `aplicarStatus(em_uso)` | Reusa o caminho único de status (AD-011) | y |
| Encerrar sessão | Grava `fim` e limpa `operadorConectadoId` e `sessaoIniciadaEm`. Se a máquina está `em_uso`, chama `aplicarStatus(disponivel)`; outro status (ex. `alerta`) fica | Alerta não some sozinho (fleet-categories) | y |
| Ocorrência | `POST /api/incidents` com sessão aberta: cria `incident` `pendente` com `origem: 'funcionario'`, `descricao` opcional, `dataIncidente` = horário informado (hoje) ou agora, e chama `aplicarStatus(alerta)` | Dono: "cria incidente + alerta" | y |
| Ocorrência sem sessão aberta | 409 "Nenhuma sessão aberta." | A ocorrência é ligada à máquina da sessão | n |
| Leitura de acidentes | `GET /api/incidents?machineId&from&to` devolve os incidentes do escopo, mais recente primeiro, com operador e máquina | Substitui o tipo `acidente` de `MACHINE_EVENTS` | y |
| Histórico de uso | `GET /api/sessions?from&to`: o colaborador vê só as próprias sessões; com `machineId`, a sessão de qualquer operador da máquina no escopo | O histórico do funcionário é dele | n |
| Causa e urgência do acidente | Incidente do sensor vira `causa: 'colisao'`; ocorrência do funcionário fica sem causa e mostra urgência `alta` | Não há regra de causa; mantém o card sem campo vazio | n |
| Dados antigos | O seed liga cada colaborador ao operator do mesmo nome. Usuários sem par ficam sem `operadorId` | O dono roda o seed | y |

---

## User Stories

### P1: Login do colaborador ⭐ MVP

**User Story**: Como colaborador, quero entrar com meu usuário e senha e cair na área do funcionário, para usar as máquinas em meu nome.

**Acceptance Criteria**:

1. WHEN o colaborador faz login com credenciais válidas THEN the backend SHALL responder com `user.operador = { _id, nome }` do operator ligado, ou `null` se não houver ligação.
2. WHEN o login de admin é feito THEN the resposta SHALL ter `user.operador = null`.
3. WHEN alguém abre uma rota `/funcionario/*` sem usuário `colaborador` salvo THEN the frontend SHALL redirecionar para `/login/colaborador`.
4. WHEN o colaborador está logado THEN the área do funcionário SHALL mostrar o nome do operator ligado (ou o do user, sem ligação) onde hoje aparece `EMPLOYEE_NAME`.
5. WHEN o colaborador clica em sair nas Configurações THEN the frontend SHALL apagar a sessão de login e ir para `/login/colaborador`.

**Independent Test**: logar como colaborador no front com a API e cair em `/funcionario` com o nome certo; abrir `/funcionario` deslogado e ir para o login.

**Requirement IDs**: LOG-01..05

---

### P1: Sessão de uso ⭐ MVP

**User Story**: Como funcionário, quero iniciar e encerrar o uso de uma máquina, para registrar o meu tempo e para o painel saber quem está nela.

**Acceptance Criteria**:

1. WHEN `POST /api/sessions { machineId }` é chamado por um usuário com operador, para uma máquina `disponivel` no escopo, sem sessão aberta do operador nem da máquina THEN the backend SHALL criar a `workSession`, gravar `operadorConectadoId` e `sessaoIniciadaEm` na empilhadeira, aplicar `em_uso` e responder 201 com `{ _id, machineId, inicio, fim: null }`.
2. WHEN a máquina não está `disponivel` THEN the backend SHALL responder 409 sem gravar nada.
3. WHEN o operador ou a máquina já tem sessão aberta THEN the backend SHALL responder 409 sem gravar nada.
4. WHEN a máquina não existe ou está fora do escopo THEN the backend SHALL responder 404.
5. WHEN o usuário não tem `operadorId` THEN the backend SHALL responder 403.
6. WHEN `GET /api/sessions/atual` é chamado THEN the backend SHALL responder 200 com a sessão aberta do operador ou `null`.
7. WHEN `PUT /api/sessions/atual/encerrar` é chamado com sessão aberta THEN the backend SHALL gravar `fim`, limpar `operadorConectadoId` e `sessaoIniciadaEm`, aplicar `disponivel` se a máquina estiver `em_uso`, e responder 200 com a sessão encerrada.
8. WHEN não há sessão aberta ao encerrar THEN the backend SHALL responder 409.
9. WHEN `GET /api/sessions?from&to` é chamado por um colaborador THEN the backend SHALL devolver só as sessões do seu operador, mais recente primeiro, com `{ _id, machineId, maquina: { nome, identificacao, setor }, operador: { nome }, inicio, fim }`.
10. WHEN o funcionário escolhe uma máquina e inicia a sessão THEN the frontend SHALL chamar a API e, na resposta, abrir `/funcionario/sessao` com o cronômetro contando a partir de `inicio`.
11. WHEN a página recarrega com sessão aberta THEN the frontend SHALL recuperá-la por `GET /api/sessions/atual`.
12. WHEN o funcionário encerra a sessão THEN the frontend SHALL chamar a API e voltar para `/funcionario`; WHEN a API falha THEN a sessão SHALL continuar e um toast de erro SHALL aparecer.
13. WHEN o funcionário abre Início, Máquinas ou Histórico THEN the frontend SHALL ler as máquinas disponíveis de `GET /api/machines` e o histórico e a última máquina de `GET /api/sessions`.

**Independent Test**: iniciar a sessão numa máquina disponível, ver a máquina `em_uso` com o operador no painel, encerrar e ver de novo `disponivel` sem operador.

**Requirement IDs**: SES-01..13

---

### P1: Ocorrência e acidentes ⭐ MVP

**User Story**: Como funcionário, quero reportar uma ocorrência na sessão, para a máquina ir para alerta. Como admin, quero ver os acidentes reais no detalhe da máquina e na tela de Alertas.

**Acceptance Criteria**:

1. WHEN `POST /api/incidents { horario?, descricao? }` é chamado com sessão aberta THEN the backend SHALL criar `incident` `pendente`, `origem: 'funcionario'`, com operador, máquina e filial da sessão, `dataIncidente` = hoje no `horario` (`HH:mm`) ou agora, aplicar `alerta` e responder 201.
2. WHEN não há sessão aberta THEN the backend SHALL responder 409; WHEN o usuário não tem operador THEN 403.
3. WHEN `horario` não é `HH:mm` ou `descricao` passa de 500 caracteres THEN the backend SHALL responder 400.
4. WHEN `GET /api/incidents?machineId&from&to` é chamado THEN the backend SHALL devolver os incidentes das filiais do escopo (filtro opcional por máquina e por dia `YYYY-MM-DD` inclusivo), mais recente primeiro, como `{ _id, machineId, maquina: { nome, identificacao, setor }, operador: { nome } | null, dataIncidente, forcaImpacto, status, origem, descricao }`.
5. WHEN o funcionário envia o formulário de ocorrência THEN the frontend SHALL chamar `POST /api/incidents` com o horário e mostrar o toast de enviado; WHEN a API falha THEN SHALL mostrar o toast de erro e manter o formulário aberto.
6. WHEN o detalhe da máquina abre a aba de acidentes, ou a tela de Alertas carrega THEN the frontend SHALL listar os incidentes da API no lugar dos eventos `acidente` de `MACHINE_EVENTS`; a aba de reparos segue em mock.

**Independent Test**: reportar uma ocorrência na sessão e ver a máquina em Acidentes na Frota e o evento no detalhe e em Alertas.

**Requirement IDs**: OCO-01..06

---

## Edge Cases

- WHEN duas chamadas iniciam sessão na mesma máquina ao mesmo tempo THEN the índice único parcial `{ empilhadeiraId }` com `fim: null` SHALL recusar a segunda (409).
- WHEN a máquina da sessão foi apagada THEN encerrar SHALL gravar `fim` e responder 200 mesmo assim.
- WHEN `from` > `to` em `GET /api/sessions` ou `/api/incidents` THEN the backend SHALL devolver `[]`.
- WHEN `machineId` não é ObjectId THEN the backend SHALL responder 400.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| LOG-01 | Login | Execute | Pending |
| LOG-02 | Login | Execute | Pending |
| LOG-03 | Login | Execute | Pending |
| LOG-04 | Login | Execute | Pending |
| LOG-05 | Login | Execute | Pending |
| SES-01 | Sessão | Execute | Pending |
| SES-02 | Sessão | Execute | Pending |
| SES-03 | Sessão | Execute | Pending |
| SES-04 | Sessão | Execute | Pending |
| SES-05 | Sessão | Execute | Pending |
| SES-06 | Sessão | Execute | Pending |
| SES-07 | Sessão | Execute | Pending |
| SES-08 | Sessão | Execute | Pending |
| SES-09 | Sessão | Execute | Pending |
| SES-10 | Sessão | Execute | Pending |
| SES-11 | Sessão | Execute | Pending |
| SES-12 | Sessão | Execute | Pending |
| SES-13 | Sessão | Execute | Pending |
| OCO-01 | Ocorrência | Execute | Pending |
| OCO-02 | Ocorrência | Execute | Pending |
| OCO-03 | Ocorrência | Execute | Pending |
| OCO-04 | Ocorrência | Execute | Pending |
| OCO-05 | Ocorrência | Execute | Pending |
| OCO-06 | Ocorrência | Execute | Pending |

---

## Success Criteria

- [ ] Fluxo completo no navegador: login de colaborador → iniciar → ocorrência → encerrar, e o painel acompanha cada passo.
- [ ] Os gates do Backend e do Frontend passam, e o Verifier dá PASS.
