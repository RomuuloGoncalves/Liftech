# Telemetria pela fila (RabbitMQ) Specification

## Problem Statement

O firmware (`iot/codigo/codigo.ino`) lê um acelerômetro, classifica eventos de movimento e manda telemetria a cada 5 s. O backend não recebe nada disso: o único caminho é `POST /api/telemetry`, atrás do JWT de usuário, com `dispositivoId` e `forcaImpacto`, que o firmware não usa. Não há consumo de fila (a `RABBITMQ_URL` do `.env.example` não é lida), o incidente não guarda o tipo do evento, o front trata todo incidente do sensor como `colisao`, a máquina nunca fica `offline` por falta de comunicação, e o front só descobre mudanças por polling (15 s no sino, uma carga só na Visão Geral e na Frota). O dono não tem o hardware integrado, então precisa de um simulador para testar o fluxo inteiro.

## Goals

- [ ] O backend consome as filas `telemetria` e `eventos` do CloudAMQP no mesmo processo da API e grava leituras e incidentes a partir das mensagens do contrato do firmware.
- [ ] Um evento de movimento de uma máquina com sessão aberta cria o incidente, move a máquina para `alerta` (e o card para "Acidentes") e aparece no front em até 2 s, sem recarregar.
- [ ] A urgência do alerta vem do tipo do evento, por uma tabela fixa e documentada no front.
- [ ] Placa sem mensagem por 30 s aparece como sem comunicação (card cinza, pop-up) e se recupera sozinha.
- [ ] `yarn simulate:hardware` publica na fila mensagens iguais às do firmware, sem tocar no banco.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Caminho físico ESP32 → broker (MQTT ou endpoint HTTP que publica na fila) | O MQTT no plano gratuito do CloudAMQP não está confirmado; esta feature fecha só o contrato da fila |
| Recalibrar limites do firmware e mudar o transporte dele | Hardware em teste; o dono ajusta e regrava as placas |
| Tela com aceleração, inclinação e magnitude | Nenhuma tela existe; v1 só guarda os dados |
| Início de trabalho no sino e no histórico | Dono: "não precisa por enquanto"; o sino e o histórico seguem listando só incidentes |
| Agrupar vários eventos do mesmo impacto num incidente | Dono quer aprofundar depois; v1 grava um incidente por evento |
| Gravidade configurável no backend | Dono: fica fixa no front; só a documentação de onde mudar entra |
| Alertas de área restrita, bateria e velocidade | Não vêm do firmware atual |
| Remover `POST /api/telemetry` e `LIMITE_IMPACTO` | Caminho legado fica como está; remover é outra decisão |
| WebSocket e mais de uma instância do backend | SSE basta com uma instância; com mais, usar fanout do RabbitMQ |
| Limpeza dos docs desatualizados e da seção "DEV" da Sidebar | Feature separada |
| Rodar o consumidor, o simulador, o seed ou o reset contra o banco | O dono roda; os testes usam mocks |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Identificação do dispositivo | O campo `dispositivo` da mensagem é o MAC; o backend normaliza para maiúsculas e casa com `device.enderecoMac`; o firmware do repositório troca `ID_DISPOSITIVO` por `WiFi.macAddress()` | Opção A do dono; o cadastro de máquina já pede o MAC | y |
| Horário | `dataDados` e `dataIncidente` são o horário de recebimento; `tempo` do firmware é ignorado | `tempo` é `millis()`, não um horário | n |
| Quando evento vira incidente | Só com sessão aberta na empilhadeira; sem sessão, descarta com log | Dono: máquina parada não gera alerta; cobre manutenção e alerta sem sessão | n |
| Evento de qualquer tipo move para `alerta` | Todos os 5, pela função de status existente (categoria ligada, trava respeitada) | Dono | y |
| Urgência | Tabela fixa no front: `colisao` alta, `frenagem_brusca` média, `aceleracao_brusca` média, `curva_brusca` média, `inclinacao_excessiva` crítica; `gravidade` do firmware é ignorada | Dono: seguir a regra do front; `inclinacao_excessiva` equivale ao tombamento | n |
| Incidente de sensor sem `tipo` (dado antigo) | O front trata como `colisao` | É o que o front faz hoje | n |
| Vários incidentes pendentes | O card mostra a maior urgência; empate, o mais recente | Dono | y |
| Saída de `alerta` | Só manual, como hoje; a sessão segue aberta e, ao encerrar, a máquina fica em `alerta` | Dono | y |
| Pop-up | Todo incidente novo abre o pop-up, inclusive de máquina com categoria travada; o sino e o histórico não mudam | Dono | y |
| Telemetria comum | Grava a leitura e a última leitura da máquina; não muda status | Dono | y |
| Retenção | Leituras expiram em 7 dias (índice TTL); incidentes não expiram | Volume de leituras; o dono pode mudar | n |
| Leituras do seed | O `seedDataset` usa datas fixas antigas, que o TTL apagaria; o seed passa a gerar as datas relativas a agora | Sem isso o `yarn seed:data` perde as leituras | n |
| Offline | 30 s sem nenhuma mensagem válida, só para máquina que já enviou ao menos uma; o varredor roda a cada 10 s no mesmo processo | Placa fica ligada o tempo todo; regra provisória do dono | n |
| Offline com máquina `disponivel` | Status vira `manutencao` (pela função de status) | Dono: sinalizar que o dispositivo precisa de correção | y |
| Volta da comunicação | Tira o cinza; se a `manutencao` foi posta pela regra de offline, volta a `disponivel`; se foi posta à mão, não mexe | Sem isso, uma queda de Wi-Fi trava as sessões até um admin liberar | n |
| Máquina sem dispositivo | Segue com o status `offline` de hoje; não entra no varredor | Ainda não há placa para falar | n |
| Pop-up de offline | Um por transição para offline; não é incidente e não entra no sino nem no histórico | Dono: alerta é só incidente | n |
| Topologia | Exchange `amq.topic` (já existe no CloudAMQP); chaves `<prefixo>telemetria.<MAC>` e `<prefixo>evento.<MAC>`; mensagens do MQTT chegam pelo mesmo exchange (o plugin troca `/` por `.`) | Backend não depende do transporte da placa | n |
| Filas | Duas filas duráveis, `<prefixo>telemetria` (ligada a `<prefixo>telemetria.*`) e `<prefixo>eventos` (ligada a `<prefixo>evento.*`); uma mensagem por vez em cada (prefetch 1), ack só depois de processar | Evento não espera atrás de leituras acumuladas; carga baixa (16 placas a 5 s são cerca de 3 mensagens por segundo); dono manteve duas filas | y |
| Validade na fila | `x-message-ttl` de 60 s na `telemetria` e 5 min na `eventos` | Horário do incidente é o do recebimento; evento velho viraria alerta com horário errado | n |
| Isolamento dev/prod | Dono: local e prod usam as mesmas filas. `RABBITMQ_PREFIXO` existe, vazia por padrão, só para quem quiser separar; a regra é rodar um backend por vez | Projeto de faculdade; com dois backends ligados, cada mensagem vai para só um deles | y |
| Mensagem inválida ou MAC desconhecido | Log e descarte sem recolocar na fila (sem fila de mensagens mortas) | Evita laço infinito | n |
| Falha de banco ao processar | Recoloca na fila uma vez; se a mesma mensagem falhar de novo (`redelivered`), descarta com log de erro | Teto simples contra laço | n |
| Mensagem repetida após queda entre processar e ack | Aceita o incidente duplicado raro na v1 | `id_evento` e `tempo` zeram a cada boot, então não servem de chave | n |
| Broker fora do ar | A API sobe e responde; o consumidor reconecta com espera de 1 s até 30 s | A API não pode depender do broker | n |
| SSE | `GET /api/stream`, com token no cabeçalho `Authorization` (o front usa `fetch` com stream, pois `EventSource` não aceita cabeçalho); heartbeat a cada 25 s | Segurança do token e proxies do Render | n |
| Polling de segurança no front | 60 s no lugar dos 15 s do sino; recarrega ao reconectar o stream | Rede de segurança se a conexão cair sem aviso | n |
| `POST /api/telemetry` e `registrarImpacto` | Ficam como estão (legado, `forcaImpacto`) | Limita o alcance da mudança | n |
| Simulador | Script do Backend que publica pelo AMQP no `amq.topic`, com as mesmas chaves que o MQTT geraria, intervalo e MACs configuráveis, sem conectar ao MongoDB | Dono: simular o hardware; a cota gratuita limita o volume; MQTT no plano gratuito não confirmado | n |
| Plano e cota do CloudAMQP | Little Lemur: 20 conexões e cerca de 1 milhão de mensagens por mês, a confirmar no painel | A pesquisa não confirmou os números nem o MQTT | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Consumidor da fila ⭐ MVP

**User Story**: Como dono do sistema, quero que o backend leia as mensagens da fila e ignore as que não servem, sem nunca derrubar a API.

**Acceptance Criteria**:

1. WHEN o backend sobe com `RABBITMQ_URL` configurada THEN the backend SHALL declarar as filas duráveis `<prefixo>telemetria` (`x-message-ttl` 60 s) e `<prefixo>eventos` (`x-message-ttl` 5 min), ligá-las ao `amq.topic` e consumir das duas no mesmo processo da API.
2. IF `RABBITMQ_URL` não está configurada THEN the backend SHALL subir só a API e registrar um aviso no log.
3. IF a conexão com o broker falha ou cai THEN the backend SHALL manter a API respondendo e tentar reconectar com espera crescente de 1 s até 30 s, registrando cada falha no log.
4. The backend SHALL processar uma mensagem por vez em cada fila, na ordem de chegada, e dar ack só depois de processá-la.
5. IF o corpo não é JSON, o `tipo` não é `telemetria` nem `evento`, `dispositivo` ou `movimento` falta, ou um número de `movimento` não é finito THEN the backend SHALL registrar no log e descartar a mensagem sem recolocá-la na fila.
6. IF `evento.tipo` de uma mensagem `evento` não é um dos cinco tipos do contrato THEN the backend SHALL descartá-la com log.
7. IF nenhum dispositivo tem o `enderecoMac` da mensagem, sem diferenciar maiúsculas THEN the backend SHALL descartá-la com log.
8. IF o dispositivo não está ligado a nenhuma empilhadeira THEN the backend SHALL descartar a mensagem com log.
9. IF o processamento falha por erro de banco e a mensagem não é uma reentrega THEN the backend SHALL recolocá-la na fila.
10. IF o processamento falha por erro de banco e a mensagem já é uma reentrega THEN the backend SHALL descartá-la com log de erro.

**Independent Test**: com o consumidor ligado a uma fila de teste, publicar mensagem válida (processada e confirmada), JSON quebrado e MAC desconhecido (descartadas com log) e ver que a API segue respondendo.

---

### P1: Telemetria comum ⭐ MVP

**User Story**: Como admin, quero que cada leitura da placa fique registrada e prove que a máquina está viva.

**Acceptance Criteria**:

1. WHEN chega uma mensagem `telemetria` válida de um dispositivo ligado a uma empilhadeira THEN the backend SHALL gravar uma leitura com `dispositivoId`, `dataDados` igual ao horário de recebimento e os campos de `movimento`.
2. WHEN chega qualquer mensagem válida de um dispositivo ligado a uma empilhadeira THEN the backend SHALL gravar `ultimaLeituraEm` da empilhadeira com o horário de recebimento.
3. The backend SHALL não mudar o status nem a categoria da empilhadeira ao processar uma mensagem `telemetria`.
4. The backend SHALL ignorar o campo `tempo` da mensagem.

**Independent Test**: publicar uma mensagem `telemetria` e ver a leitura gravada e `ultimaLeituraEm` atualizada, com o status igual ao de antes.

---

### P1: Evento vira incidente e alerta ⭐ MVP

**User Story**: Como admin, quero que uma batida, frenagem, aceleração, curva ou inclinação forte de uma máquina em operação vire alerta na hora.

**Acceptance Criteria**:

1. WHEN chega uma mensagem `evento` válida e a empilhadeira tem sessão aberta THEN the backend SHALL criar um incidente `pendente`, com `origem: "sensor"`, `tipo` igual a `evento.tipo`, `movimento`, `dataIncidente` igual ao horário de recebimento, `operadorId` da sessão e `filialId` da empilhadeira.
2. WHEN o incidente é criado THEN the backend SHALL aplicar o status `alerta` pela função de status existente, que move a máquina à categoria ligada ao status, exceto se a categoria está travada.
3. IF a empilhadeira não tem sessão aberta THEN the backend SHALL descartar o evento com log, sem criar incidente nem mudar o status.
4. WHEN a empilhadeira já está em `alerta` e tem sessão aberta THEN the backend SHALL criar mais um incidente e manter o status.
5. The backend SHALL ignorar `evento.gravidade` e `id_evento`.
6. The `GET /api/incidents` SHALL devolver `tipo` em cada incidente (`null` quando não há) e SHALL aceitar `movimento` apenas na gravação, sem devolvê-lo.
7. The backend SHALL manter a saída de `alerta` só por mudança manual de status e manter a sessão aberta enquanto a máquina está em `alerta`.
8. The `POST /api/telemetry` SHALL continuar com o comportamento atual.

**Independent Test**: abrir uma sessão numa máquina, publicar um evento `colisao` e ver o incidente `pendente` com o operador e a máquina em `alerta`; encerrar a sessão, publicar de novo e ver que nada muda.

---

### P1: Urgência e rótulos no front ⭐ MVP

**User Story**: Como admin, quero ver a urgência e o tipo certos de cada alerta.

**Acceptance Criteria**:

1. The frontend SHALL derivar a urgência do `tipo` com a tabela fixa: `colisao` alta, `frenagem_brusca` média, `aceleracao_brusca` média, `curva_brusca` média e `inclinacao_excessiva` crítica.
2. WHERE um incidente do sensor não tem `tipo` THEN the frontend SHALL tratá-lo como `colisao`.
3. WHEN uma máquina tem vários incidentes pendentes THEN the card SHALL mostrar a maior urgência e, em empate, a do mais recente.
4. The frontend SHALL mostrar o nome de cada um dos cinco tipos nos 7 idiomas, traduzido.
5. The `LevelInfoModal` SHALL listar os cinco tipos no nível que a tabela define.
6. The `GET /api/machines` SHALL devolver `alertaTipos` em cada máquina: os `tipo` distintos dos incidentes pendentes dela, do mais recente ao mais antigo, e lista vazia quando não há.

**Independent Test**: com incidentes de cada tipo, conferir a urgência no card da Frota, no pop-up e no histórico de Alertas.

---

### P1: Atualização em tempo real por SSE ⭐ MVP

**User Story**: Como admin, quero ver o card mudar de coluna e o pop-up aparecer sem recarregar a página.

**Acceptance Criteria**:

1. WHEN um usuário autenticado chama `GET /api/stream` THEN the backend SHALL manter a conexão aberta como `text/event-stream`.
2. IF a chamada a `GET /api/stream` não traz token válido THEN the backend SHALL responder 401.
3. WHEN um incidente é criado THEN the backend SHALL enviar o evento `incidente` com o incidente no formato de `GET /api/incidents`, só às conexões cujo escopo inclui a filial da máquina.
4. WHEN o status, a categoria, a trava ou o estado de comunicação de uma máquina muda por qualquer caminho (sessão, evento, mudança manual, offline) THEN the backend SHALL enviar o evento `maquina` com `id`, `status`, `categoriaId`, `categoriaTravada`, `alertaEm` e `dispositivoOffline`, só às conexões cujo escopo inclui a filial da máquina.
5. The backend SHALL enviar um comentário de heartbeat a cada 25 s em cada conexão.
6. WHEN uma conexão fecha THEN the backend SHALL removê-la da lista de clientes.
7. WHILE o usuário está logado the frontend SHALL manter o stream aberto, com `fetch` e o cabeçalho `Authorization`, e fechá-lo no logout.
8. WHEN o front recebe `maquina` THEN the Visão Geral e a Frota SHALL atualizar o card da máquina sem recarregar a lista.
9. WHEN o front recebe `incidente` THEN the sino e o pop-up SHALL mostrá-lo como mostram hoje, inclusive para máquina com categoria travada.
10. IF o stream cai THEN the frontend SHALL reconectar com espera crescente e recarregar as listas ao reconectar.
11. The frontend SHALL fazer um polling de segurança a cada 60 s no lugar do polling de 15 s do sino.

**Independent Test**: com duas abas de admin abertas, iniciar uma sessão e publicar um evento, e ver o card ir para "Ativas" e depois para "Acidentes" e o pop-up abrir nas duas abas sem recarregar; um usuário de outra filial não recebe nada.

---

### P1: Simulador de hardware ⭐ MVP

**User Story**: Como dono, quero simular as placas para testar o fluxo inteiro sem o hardware.

**Acceptance Criteria**:

1. WHEN `yarn simulate:hardware` roda com um ou mais MACs THEN the simulador SHALL publicar no `amq.topic`, com a chave `<prefixo>telemetria.<MAC>`, uma mensagem `telemetria` por MAC a cada intervalo configurado (padrão 5 s), no formato do contrato do firmware.
2. WHEN o dono pede um evento de um dos cinco tipos para um MAC THEN the simulador SHALL publicar no `amq.topic`, com a chave `<prefixo>evento.<MAC>`, uma mensagem `evento` desse tipo no formato do contrato.
3. IF `RABBITMQ_URL` não está configurada THEN the simulador SHALL encerrar com código diferente de zero e uma mensagem clara.
4. WHEN o simulador recebe Ctrl+C THEN the simulador SHALL fechar a conexão com o broker e encerrar.
5. The simulador SHALL não importar a conexão com o MongoDB.
6. The simulador SHALL mostrar no início quantas mensagens por mês a configuração gera.

**Independent Test**: rodar o simulador com um MAC cadastrado, ver as leituras chegando e pedir um evento `colisao` com a sessão aberta.

---

### P2: Placa sem comunicação (offline)

**User Story**: Como admin, quero saber quando a placa de uma máquina para de falar.

**Acceptance Criteria**:

1. WHEN passam 30 s sem mensagem válida de uma empilhadeira que já tem `ultimaLeituraEm` THEN the backend SHALL marcá-la como sem comunicação e enviar os eventos `maquina` (com `dispositivoOffline: true`) e `dispositivo_offline`.
2. The backend SHALL verificar as máquinas a cada 10 s e marcar cada transição uma única vez.
3. IF a empilhadeira não tem `ultimaLeituraEm` THEN the backend SHALL não marcá-la como sem comunicação nem notificar.
4. WHILE uma máquina está sem comunicação the card SHALL ficar cinza e na mesma coluna em que está.
5. WHEN a máquina sem comunicação está em `disponivel` THEN the backend SHALL mudar o status para `manutencao` pela função de status.
6. WHEN chega uma mensagem válida de uma máquina sem comunicação THEN the backend SHALL tirar a marca e enviar `maquina` com `dispositivoOffline: false`.
7. WHEN a comunicação volta e a `manutencao` foi aplicada pela regra de offline THEN the backend SHALL voltar o status para `disponivel`.
8. IF a `manutencao` foi aplicada à mão THEN the backend SHALL manter o status quando a comunicação volta.
9. WHEN o front recebe `dispositivo_offline` THEN the frontend SHALL abrir um pop-up com a identificação da máquina, traduzido nos 7 idiomas, que não entra no sino nem no histórico.
10. The backend SHALL manter a sessão aberta enquanto a máquina está sem comunicação.
11. The backend SHALL não incluir no varredor as máquinas sem dispositivo ligado.
12. The `GET /api/machines` SHALL devolver `dispositivoOffline` (booleano) em cada máquina.

**Independent Test**: com o simulador rodando, parar o simulador e ver o card ficar cinza e o pop-up abrir em 30 a 40 s; religar e ver o card voltar.

---

### P2: Retenção das leituras

**User Story**: Como dono, quero que as leituras antigas se apaguem sozinhas para o banco não encher.

**Acceptance Criteria**:

1. The coleção `telemetry` SHALL ter índice TTL em `dataDados` que expira o documento após 7 dias.
2. The coleção `incident` SHALL não ter expiração.
3. The seed SHALL gerar as datas das leituras relativas ao momento da execução.

**Independent Test**: conferir o índice no schema e o seed gerando datas dos últimos dias.

---

### P2: Documentação e firmware

**User Story**: Como dono, quero o contrato e as regras documentados para mudar depois sem reler o código.

**Acceptance Criteria**:

1. The `docs/alertas.md` SHALL explicar a tabela tipo → urgência e em que arquivo mudá-la.
2. The `docs/telemetria.md` SHALL descrever o contrato das mensagens, o exchange, as chaves, as duas filas, o simulador, as regras de evento, de offline e de retenção, e o passo a passo de configuração do CloudAMQP.
3. The `docs/api.md` SHALL documentar `GET /api/stream`, os eventos SSE, o campo `tipo` do incidente e os campos `dispositivoOffline` e `alertaTipos` de `/api/machines`.
4. The `Backend/.env.example` SHALL listar `RABBITMQ_URL` e `RABBITMQ_PREFIXO`.
5. The `iot/codigo/codigo.ino` SHALL mandar o MAC da placa em `dispositivo`.

**Independent Test**: ler os docs e achar, sem abrir o código, onde mudar uma urgência e como rodar o simulador.

---

## Edge Cases

- IF duas mensagens da mesma máquina chegam coladas THEN the backend SHALL processá-las em sequência, e a segunda não desfaz o status da primeira.
- IF o broker entrega a mesma mensagem duas vezes THEN the backend SHALL aceitar o incidente duplicado (assumido na v1).
- IF a categoria ligada ao status `alerta` não existe na empresa THEN the backend SHALL manter a máquina na categoria em que está e mudar só o status.
- IF um usuário tem escopo `filiais` com lista vazia THEN the backend SHALL não enviar nenhum evento a ele pelo stream.
- WHEN o usuário troca de filial ativa THEN the frontend SHALL continuar mostrando só os eventos da filial escolhida.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TLQ-01 | P1: Consumidor da fila | Design | Pending |
| TLQ-02 | P1: Telemetria comum | Design | Pending |
| TLQ-03 | P1: Evento vira incidente e alerta | Design | Pending |
| TLQ-04 | P1: Urgência e rótulos no front | Design | Pending |
| TLQ-05 | P1: Atualização em tempo real por SSE | Design | Pending |
| TLQ-06 | P1: Simulador de hardware | Design | Pending |
| TLQ-07 | P2: Placa sem comunicação (offline) | - | Pending |
| TLQ-08 | P2: Retenção das leituras | - | Pending |
| TLQ-09 | P2: Documentação e firmware | - | Pending |

**Coverage:** 9 total, 0 mapped to tasks, 9 unmapped ⚠️

---

## Success Criteria

- [ ] Com o simulador, uma sessão aberta e um evento publicado, o card chega a "Acidentes" e o pop-up abre em até 2 s, sem recarregar.
- [ ] Parar o simulador deixa o card cinza em até 40 s, e religar o simulador o devolve ao normal.
- [ ] Um evento de máquina sem sessão não cria incidente.
- [ ] Mensagem inválida ou de MAC desconhecido nunca derruba o consumidor nem trava a fila.
- [ ] `yarn test` do Backend e do Frontend, `tsc` e `eslint` passam, sem nenhum teste tocar no banco.
