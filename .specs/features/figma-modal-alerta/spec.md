# Modal "Alerta!" e contexto de alertas Specification

## Problem Statement

O admin não fica sabendo de um acidente enquanto está em outra tela: o Figma `admin/02-visao-geral-maquinas/12-modal-alert.png` desenha um modal bloqueante "Alerta!", e o app não tem modal, polling nem contexto de alertas (`App.tsx` sem provider; grep "Acidente no setor" sem resultado, RELATORIO §1). Esta feature cria o `AlertsContext` (polling de incidentes, dono do contrato que o dropdown do sino consome) e o modal, com um botão DEV "Simular alerta" para testar sem backend.

## Goals

- [ ] Um incidente novo da filial ativa abre o modal "Alerta!" em até 15 s, em qualquer rota do shell do admin.
- [ ] "Simular alerta" no bloco DEV da sidebar abre o modal igual ao PNG, sem chamar a API.
- [ ] `AlertsContextValue` (`recent`, `loading`, `error`, `hasUnseen`, `markSeen`, `reload`, `simulate`) está pronto para `figma-alertas-dropdown` consumir, sem polling próprio.
- [ ] Todo texto novo entra no bloco `alertModal.*` dos 7 locales.
- [ ] `yarn test`, `tsc` e `eslint` verdes nos dois pacotes; backend sem acesso ao banco nos testes (AD-010).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Popover "Alertas Recentes" e ponto no sino | Feature `figma-alertas-dropdown` (onda 3); aqui só o contexto que ela consome. |
| WebSocket, push ou e-mail | Polling basta (contexto compartilhado); tempo real é decisão futura. |
| Lida/não lida salva no servidor | O "visto" fica no navegador. |
| Ação no modal além de "Ok" (ir ao incidente, mudar status) | O Figma só tem "Ok". |
| Rota de backend paginada ou com `limit` | A lista já é limitada a 500 (`LIMITE_HISTORICO`); ver Risks no design. |
| Alerta na área do funcionário | O modal é do admin (Figma admin). |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quais incidentes disparam o modal | Todo incidente da filial ativa (sensor ou funcionário) cujo `_id` não estava na lista do primeiro carregamento da sessão. | Comparar por data falha: `POST /api/incidents` grava `dataIncidente` com o `horario` informado pelo funcionário, que pode ser anterior à última consulta (`Backend/src/feature/incident/incidentService.ts`, `reportar`). Comparar por `_id` não perde esse caso. Diverge do contexto, que comparava datas. | n |
| Marca do modal | Fica só em memória (conjunto de `_id`s já alertados). Recarregar a página refaz a linha de base sem abrir modal. | O contexto pede que o primeiro carregamento só fixe a marca; com a marca em memória, `localStorage` bloqueado não repete modal na sessão. | n |
| Marca do sino (`hasUnseen`/`markSeen`) | Separada da do modal: `markSeen()` grava no `localStorage` os `_id`s de `recent`, na chave `liftech.alerts.seen.<userId>`. "Ok" no modal não apaga o ponto do sino. | O sino mostra o que o admin ainda não abriu na lista; o modal só avisa uma vez. Com uma marca só, o ponto sumiria no "Ok" e nunca apareceria para incidentes chegados com a página fechada. | n |
| Filtro por filial ativa | `GET /api/incidents` passa a aceitar `filialId` (mesma regra de `GET /api/machines`: fora do escopo devolve lista vazia; ObjectId inválido, 400). Com "Todas as filiais", não envia o parâmetro. | Hoje a rota filtra só pelo escopo do usuário e a resposta não traz `filialId`, então o front não tem como filtrar. Mudança de backend que o contexto não previa. | n |
| Troca de filial ativa | Refaz a linha de base: os incidentes já existentes da nova filial não abrem modal. | Sem isso, trocar de filial alertaria todo o histórico dela. | n |
| Máquina em negrito | Só setor e funcionário ficam em negrito; a identificação da máquina fica em peso normal. | No PNG, "EMP-084(ID)." tem o mesmo peso de "funcionário responsável". O contexto pedia negrito nos três. | n |
| Identificação da máquina | Mostra `maquina.identificacao`; com `maquina` nula, "não informado". | É o que o PNG mostra ("EMP-084(ID)"). | n |
| Clique fora do modal | Não fecha. Só "Ok" ou Esc. | Alerta de segurança bloqueante; o contexto lista só "Ok" e Esc. | n |
| Intervalo e visibilidade | 15 s, só com `document.visibilityState === 'visible'`; ao voltar a ficar visível, consulta na hora. | Contexto compartilhado. | n |
| Texto do botão DEV | "Simular alerta", fixo em português, como os demais links de `TEMP_AUTH_LINKS`. | O bloco DEV é temporário e não usa i18n. | y (dono) |
| Usuário sem sessão no shell | Não consulta (sem `user` em `useActiveBranch`). | A rota exige token; a chamada só geraria 401. | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Modal "Alerta!" disparado pelo polling ⭐ MVP

**User Story**: As an admin, I want a blocking alert when an accident is reported so that I notice it even on another screen.

**Why P1**: Núcleo de segurança do produto; Figma `02/12`.

**Acceptance Criteria**:

1. WHEN o polling recebe um incidente da filial ativa cujo `_id` não estava na linha de base nem já foi alertado THEN the system SHALL abrir o modal "Alerta!" com o texto "Acidente no setor {setor}, {funcionário} funcionário responsável pela máquina {identificacao}."  <!-- event-driven -->
2. WHILE o modal "Alerta!" está aberto, WHEN chega outro incidente novo the system SHALL enfileirá-lo e abri-lo só depois de o atual ser fechado, do mais antigo (`dataIncidente`) para o mais novo  <!-- complex -->
3. WHEN o admin clica em "Ok" or pressiona Esc THEN the system SHALL fechar o modal e não abrir de novo o mesmo incidente na sessão  <!-- event-driven -->
4. WHEN a primeira consulta da sessão (ou da filial ativa) responde THEN the system SHALL guardar os `_id`s recebidos como linha de base, sem abrir o modal  <!-- event-driven -->
5. IF o setor, o operador ou a máquina do incidente for nulo or vazio THEN the system SHALL escrever "não informado" no lugar do trecho  <!-- unwanted-behavior -->
6. IF a consulta de polling falhar THEN the system SHALL manter `recent` e a fila como estavam e não abrir modal  <!-- unwanted-behavior -->
7. WHILE o admin está numa rota fora do shell do admin (login, solicitações, funcionário) the system SHALL não fazer consultas de incidentes  <!-- state-driven -->
8. WHILE a aba está visível and o shell está montado the system SHALL consultar `GET /api/incidents` a cada 15 s  <!-- state-driven -->
9. WHILE a aba está oculta the system SHALL não consultar, e WHEN ela volta a ficar visível THEN the system SHALL consultar na hora  <!-- complex -->
10. WHEN o admin troca a filial ativa THEN the system SHALL consultar com o novo `filialId` e refazer a linha de base sem abrir modal  <!-- event-driven -->

**Independent Test**: Com a API, abrir a Visão Geral, reportar uma ocorrência pela área do funcionário (outra aba) e ver o modal em até 15 s; "Ok" fecha e ele não volta.

---

### P1: Visual e acessibilidade do modal ⭐ MVP

**User Story**: As an admin, I want the alert to look like the Figma and work with keyboard so that it is clear and accessible.

**Why P1**: Sem o visual do PNG a tela não está entregue.

**Acceptance Criteria**:

1. The system SHALL exibir o modal centralizado, largura máxima 470 px, com círculo vermelho com ícone de alerta branco, título "Alerta!" em vermelho, texto centralizado com setor e funcionário em negrito, e botão "Ok" azul, sobre o fundo desfocado do `Modal`  <!-- ubiquitous -->
2. The system SHALL dar ao modal `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` no título e `aria-describedby` no texto  <!-- ubiquitous -->
3. WHEN o modal abre THEN the system SHALL mover o foco para o botão "Ok"  <!-- event-driven -->
4. WHEN o admin clica fora do cartão do modal THEN the system SHALL manter o modal aberto  <!-- event-driven -->
5. The system SHALL traduzir título, texto, "Ok" e "não informado" nos 7 locales, no bloco `alertModal.*`  <!-- ubiquitous -->
6. WHEN o texto é longo THEN the system SHALL quebrar linha dentro do cartão sem estourar a largura  <!-- event-driven -->

**Independent Test**: "Simular alerta" abre o modal igual ao PNG com o foco no "Ok"; clique no fundo não fecha; Esc fecha.

---

### P1: Simular alerta (DEV) ⭐ MVP

**User Story**: As a developer, I want a button that opens the alert with sample data so that I can check the modal without an accident in the database.

**Why P1**: Pedido do dono; é como o modal será conferido contra o Figma.

**Acceptance Criteria**:

1. WHEN o admin clica em "Simular alerta" no bloco DEV da sidebar THEN the system SHALL abrir o modal com setor "Expedição - Bloco B", funcionário "Alexandre Mattos" e máquina "EMP-084(ID)", sem chamar a API  <!-- event-driven -->
2. WHILE a sidebar está colapsada the system SHALL esconder o botão, junto com o resto do bloco DEV  <!-- state-driven -->

**Independent Test**: Sem backend rodando, clicar em "Simular alerta" abre o modal; nenhuma requisição sai.

---

### P1: Contexto de alertas para o sino ⭐ MVP

**User Story**: As the alerts dropdown, I want the recent incidents and an unseen flag from one shared source so that the bell does not poll on its own.

**Why P1**: Contrato fixo do contexto compartilhado; `figma-alertas-dropdown` depende dele.

**Acceptance Criteria**:

1. The system SHALL expor em `recent` os 5 incidentes mais novos (`dataIncidente` decrescente) da última consulta bem-sucedida  <!-- ubiquitous -->
2. WHILE a primeira consulta da filial ativa não respondeu the system SHALL expor `loading: true`  <!-- state-driven -->
3. IF a última consulta falhou THEN the system SHALL expor `error: true` até a próxima consulta bem-sucedida  <!-- unwanted-behavior -->
4. WHEN `reload()` é chamado THEN the system SHALL consultar na hora, sem esperar o intervalo  <!-- event-driven -->
5. WHILE algum `_id` de `recent` não está entre os vistos do usuário the system SHALL expor `hasUnseen: true`  <!-- state-driven -->
6. WHEN `markSeen()` é chamado THEN the system SHALL gravar os `_id`s de `recent` em `localStorage` na chave `liftech.alerts.seen.<userId>` e expor `hasUnseen: false`  <!-- event-driven -->
7. IF o `localStorage` estiver bloqueado THEN the system SHALL tratar os vistos como vazios na leitura, manter os vistos em memória após `markSeen()` e não lançar erro  <!-- unwanted-behavior -->

**Independent Test**: Num teste com o contexto montado e `incidentService.listar` mockado com 7 incidentes, `recent` tem 5, `hasUnseen` é `true`, e após `markSeen()` vira `false`.

---

### P1: Filtro por filial em `GET /api/incidents` ⭐ MVP

**User Story**: As an admin, I want the incident list filtered by my active branch so that the alert and the bell only show that branch.

**Why P1**: Sem ele, "filial ativa" não é possível: a resposta não traz `filialId`.

**Acceptance Criteria**:

1. WHEN `GET /api/incidents` recebe `filialId` de uma filial do escopo THEN the system SHALL devolver só os incidentes dessa filial  <!-- event-driven -->
2. IF `filialId` não pertence ao escopo do usuário THEN the system SHALL devolver lista vazia com 200  <!-- unwanted-behavior -->
3. IF `filialId` não é um ObjectId válido THEN the system SHALL responder 400 sem consultar o banco  <!-- unwanted-behavior -->
4. WHEN `filialId` não é enviado THEN the system SHALL manter o comportamento atual (todas as filiais do escopo)  <!-- event-driven -->

**Independent Test**: Teste unitário do service com o model mockado conferindo o filtro `filialId.$in` passado ao `find`.

---

## Edge Cases

- WHEN dois incidentes novos chegam na mesma consulta THEN the system SHALL abrir um modal por vez, do mais antigo para o mais novo (coberto por MAL-02).
- WHEN "Simular alerta" é clicado com um modal aberto THEN the system SHALL enfileirar o exemplo atrás do atual.
- WHEN "Simular alerta" é clicado duas vezes THEN the system SHALL enfileirar dois modais (sem deduplicar o exemplo).
- IF a resposta de uma consulta chegar depois da troca de filial ou da desmontagem THEN the system SHALL descartá-la.
- IF a primeira consulta falhar THEN the system SHALL usar a próxima bem-sucedida como linha de base (sem modal).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MAL-01 | P1: Modal por polling (AC1) | Tasks | Pending |
| MAL-02 | P1: Modal por polling (AC2) | Tasks | Pending |
| MAL-03 | P1: Modal por polling (AC3) | Tasks | Pending |
| MAL-04 | P1: Modal por polling (AC4) | Tasks | Pending |
| MAL-05 | P1: Modal por polling (AC5) | Tasks | Pending |
| MAL-06 | P1: Modal por polling (AC6) | Tasks | Pending |
| MAL-07 | P1: Modal por polling (AC7) | Tasks | Pending |
| MAL-08 | P1: Modal por polling (AC8) | Tasks | Pending |
| MAL-09 | P1: Modal por polling (AC9) | Tasks | Pending |
| MAL-10 | P1: Modal por polling (AC10) | Tasks | Pending |
| MAL-11 | P1: Visual e acessibilidade (AC1) | Tasks | Pending |
| MAL-12 | P1: Visual e acessibilidade (AC2) | Tasks | Pending |
| MAL-13 | P1: Visual e acessibilidade (AC3) | Tasks | Pending |
| MAL-14 | P1: Visual e acessibilidade (AC4) | Tasks | Pending |
| MAL-15 | P1: Visual e acessibilidade (AC5) | Tasks | Pending |
| MAL-16 | P1: Visual e acessibilidade (AC6) | Tasks | Pending |
| MAL-17 | P1: Simular alerta (AC1) | Tasks | Pending |
| MAL-18 | P1: Simular alerta (AC2) | Tasks | Pending |
| MAL-19 | P1: Contexto de alertas (AC1) | Tasks | Pending |
| MAL-20 | P1: Contexto de alertas (AC2) | Tasks | Pending |
| MAL-21 | P1: Contexto de alertas (AC3) | Tasks | Pending |
| MAL-22 | P1: Contexto de alertas (AC4) | Tasks | Pending |
| MAL-23 | P1: Contexto de alertas (AC5) | Tasks | Pending |
| MAL-24 | P1: Contexto de alertas (AC6) | Tasks | Pending |
| MAL-25 | P1: Contexto de alertas (AC7) | Tasks | Pending |
| MAL-26 | P1: Filtro por filial (AC1) | Tasks | Pending |
| MAL-27 | P1: Filtro por filial (AC2) | Tasks | Pending |
| MAL-28 | P1: Filtro por filial (AC3) | Tasks | Pending |
| MAL-29 | P1: Filtro por filial (AC4) | Tasks | Pending |

**ID format:** `MAL-NN`, na ordem das histórias e dos critérios.

**Coverage:** 29 total, 29 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Cada MAL-NN tem um teste que falha se o comportamento quebrar.
- [ ] `yarn test` do Backend e do Frontend passam, sem teste removido; `tsc -b` e `eslint .` limpos.
- [ ] No navegador do Orca, em 1440 px, "Simular alerta" mostra o modal igual a `figma-telas/admin/02-visao-geral-maquinas/12-modal-alert.png`.
- [ ] O bundle de entrada continua ≤ 100 kB gzip: `AlertModal` entra por `React.lazy`.
