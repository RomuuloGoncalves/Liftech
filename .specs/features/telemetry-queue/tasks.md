# Telemetria pela fila (RabbitMQ) Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Regras do projeto que valem acima do skill:** nunca executar `git commit` (deixar tudo no working tree e avisar o dono); os workers não acessam o banco e usam mocks. O dono liberou o banco LOCAL para `yarn test:integration` do Backend, rodado só pelo coordenador depois da integração, removendo do banco o que os testes gerarem.

---

**Design**: `.specs/features/telemetry-queue/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/arquitetura.md` (`yarn test` roda `vitest run` nos dois projetos; `tests/integration` do Backend conecta ao banco e não entra) e `/home/romulo/Projetos/Liftech/CLAUDE.md` (sem commit). Sem `AGENTS.md` nem limite de cobertura configurado: defaults fortes aplicados.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend service / contrato / hub / consumidor | unit (mocks, sem banco) | Todos os ramos; 1:1 com os ACs da spec; todo edge case listado | `Backend/tests/unit/*.test.ts` | `cd Backend && yarn test` |
| Backend router / controller / `app.ts` | unit (HTTP em memória, services mockados) | Rotas do escopo: caminho feliz + erro (401) + edge | `Backend/tests/unit/*Controller.test.ts`, `app.test.ts` | `cd Backend && yarn test` |
| Backend schema (Mongoose) | unit (validação sem conexão) | Campos novos, defaults e índice TTL | `Backend/tests/unit/*Model.test.ts`, `schemas.test.ts` | `cd Backend && yarn test` |
| Backend script (simulador, seed) | unit (funções puras; sem importar `conn`) | Lógica de montagem e argumentos; I/O fica mockado | `Backend/tests/unit/*.test.ts` | `cd Backend && yarn test` |
| Backend config / `server.ts` | none | - (gate de build) | - | `cd Backend && yarn build` |
| Frontend `data/`, `services/`, `utils/` | unit | Todos os ramos; 1:1 com os ACs | `Frontend/src/test/{data,services,utils}/*.test.ts` | `cd Frontend && yarn test` |
| Frontend context / hook | unit (Testing Library) | Estados e ramos; reconexão; efeitos de logout | `Frontend/src/test/{context,hooks}/*.test.tsx` | `cd Frontend && yarn test` |
| Frontend componente / página | unit (Testing Library) | Render por estado/variante + interação; casos do spec | `Frontend/src/test/{components,pages}/**/*.test.tsx` | `cd Frontend && yarn test` |
| Frontend locales | unit (paridade de chaves, já existe) | Cinco tipos presentes nos 7 idiomas | `Frontend/src/test/config/levelInfoLocales.test.ts` | `cd Frontend && yarn test` |
| Docs, firmware, `.env.example`, `package.json` | none | - (revisão e gate de build) | - | Build gate |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Fonte: `Backend/package.json` (`test`, `build`, `format:check`) e `Frontend/package.json` (`test`, `lint`, `build`).

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Task só do Backend com testes unit | `cd Backend && yarn test` |
| Quick (Front) | Task só do Frontend com testes unit | `cd Frontend && yarn test` |
| Full | Task que muda contrato entre Backend e Frontend | `cd Backend && yarn test && cd ../Frontend && yarn test` |
| Build | Fim de fase, ou task só de config/docs/firmware | `cd Backend && yarn build && yarn format:check && yarn test && cd ../Frontend && yarn lint && yarn build && yarn test` |

---

## Execution Plan

Fases em ordem; tarefas em ordem dentro da fase.

### Phase 1: Dados e contrato (Backend)

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Tempo real no Backend

```
T7 → T8 → T9 → T10 → T11 → T12
```

### Phase 3: Consumo da fila (Backend)

```
T13 → T14 → T15 → T16 → T17 → T18 → T19
```

### Phase 4: Simulador e seed

```
T20 → T21
```

### Phase 5: Urgência e rótulos (Frontend)

```
T22 → T23 → T24 → T25
```

### Phase 6: Tempo real no Frontend

```
T26 → T27 → T28 → T29 → T30 → T31 → T32 → T33
```

### Phase 7: Documentação e firmware

```
T34 → T35 → T36 → T37 → T38
```

---

## Task Breakdown

### T1: Campos de comunicação na empilhadeira

**What**: `forklift` ganha `ultimaLeituraEm` (Date), `offlineDesde` (Date | null) e `manutencaoPorOffline` (boolean, default `false`).
**Where**: `Backend/src/schemas/forklift.ts`
**Depends on**: None
**Reuses**: `Backend/tests/unit/forkliftModel.test.ts`
**Requirement**: TLQ-02, TLQ-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Os três campos existem com os tipos e defaults do design
- [ ] Teste de modelo: `manutencaoPorOffline` vem `false`; `offlineDesde` aceita `null`
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: ao menos os testes anteriores mais os novos (sem exclusões)

**Tests**: unit
**Gate**: quick

---

### T2: Tipo e movimento no incidente

**What**: `incident` ganha `tipo` (enum dos 5 tipos, opcional) e `movimento` (subdocumento `Movimento`, opcional).
**Where**: `Backend/src/schemas/incident.ts`
**Depends on**: T1
**Reuses**: `Backend/tests/unit/schemas.test.ts`
**Requirement**: TLQ-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `tipo` rejeita valor fora dos 5 tipos e aceita ausência
- [ ] `movimento` aceita os seis números do contrato
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T3: Movimento e TTL na leitura

**What**: `telemetry` ganha `movimento` e o índice TTL de 7 dias em `dataDados`.
**Where**: `Backend/src/schemas/telemetry.ts`
**Depends on**: T2
**Reuses**: `Backend/tests/unit/schemas.test.ts`
**Requirement**: TLQ-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `schema.indexes()` contém `{ dataDados: 1 }` com `expireAfterSeconds` igual a 604800
- [ ] `incident` continua sem índice TTL (AC TLQ-08.2)
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T4: `tipo` no `GET /api/incidents`

**What**: `formatar` do `incidentService` passa a ser exportado e devolve `tipo` (`null` quando não há); a gravação aceita `movimento` e não o devolve.
**Where**: `Backend/src/feature/incident/incidentService.ts`
**Depends on**: T3
**Reuses**: `Backend/tests/unit/incidentService.test.ts`
**Requirement**: TLQ-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `formatar` exportado; incidente com tipo devolve o tipo, sem tipo devolve `null`
- [ ] Resposta não inclui `movimento`
- [ ] `POST /api/telemetry` segue com o comportamento atual (teste existente passa)
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T5: Dependência `amqplib` e variável de prefixo

**What**: instalar `amqplib` e `@types/amqplib` (versão fixada) no Backend e expor `rabbit_url` e `rabbit_prefixo` (padrão vazio) em `env`.
**Where**: `Backend/src/config/env.ts`
**Depends on**: T4
**Reuses**: padrão do objeto `env`
**Requirement**: TLQ-01

**Tools**:

- MCP: `context7` (confirmar a API atual do `amqplib`)
- Skill: NONE

**Done when**:

- [ ] `package.json` e `yarn.lock` com `amqplib` na versão fixada
- [ ] `env.rabbit_url` lê `RABBITMQ_URL`; `env.rabbit_prefixo` lê `RABBITMQ_PREFIXO` com `""` como padrão
- [ ] Gate check passes: `cd Backend && yarn build && yarn test`

**Tests**: none
**Gate**: build

---

### T6: Contrato da mensagem

**What**: `lerMensagem`, `TIPOS_EVENTO`, `montarTelemetria` e `montarEvento`, sem importar `conn`.
**Where**: `Backend/src/feature/telemetry/telemetryContrato.ts`
**Depends on**: T5
**Reuses**: formato de `iot/codigo/codigo.ino`
**Requirement**: TLQ-01, TLQ-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mensagens válidas de `telemetria` e `evento` do firmware passam em `lerMensagem` e voltam normalizadas (campos de `movimento` em camelCase)
- [ ] `null` para: não-JSON, `tipo` desconhecido, sem `dispositivo`, sem `movimento`, número não finito, `evento.tipo` fora dos 5 (AC TLQ-01.5 e .6)
- [ ] `montarTelemetria`/`montarEvento` geram mensagens que `lerMensagem` aceita
- [ ] O módulo não importa `conn` (teste lê o arquivo)
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T7: Hub de conexões SSE

**What**: `conectar(req, res)` (cabeçalhos, escopo → filiais, remoção no `close`), `publicar(evento, filialId, dados)` e heartbeat de 25 s.
**Where**: `Backend/src/feature/stream/streamHub.ts`
**Depends on**: None (a fase anterior termina antes)
**Reuses**: `Escopo` de `Backend/src/core/escopo.ts`
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cabeçalhos `text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`
- [ ] `publicar` escreve só nas conexões cujo escopo inclui a filial; escopo `filiais` vazio não recebe nada
- [ ] Heartbeat `: ping` a cada 25 s (timers falsos); `close` remove o cliente; erro de escrita remove o cliente sem lançar
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T8: Publicar o estado da máquina

**What**: `publicarMaquina(forkliftId)` lê a empilhadeira e os incidentes pendentes e publica o evento `maquina` com o payload do design.
**Where**: `Backend/src/feature/stream/streamHub.ts`
**Depends on**: T7
**Reuses**: repositórios de `Forklift` e `Incident`
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Payload com `id`, `filialId`, `status`, `categoriaId`, `categoriaTravada`, `alertaEm`, `alertaTipos`, `dispositivoOffline`
- [ ] `alertaTipos` traz os tipos distintos dos pendentes, do mais recente ao mais antigo
- [ ] Empilhadeira inexistente não lança nem publica
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T9: Rota `GET /api/stream`

**What**: router que chama `conectar`, registrado em `app.ts` depois do `autenticar`, com o `compression()` pulando `/api/stream`.
**Where**: `Backend/src/feature/stream/streamRouter.ts` (e o registro em `Backend/src/app.ts`)
**Depends on**: T8
**Reuses**: `autenticar`
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Sem token válido responde 401
- [ ] Com token abre `text/event-stream` e recebe o evento publicado (servidor HTTP em memória, `autenticar` e repositórios mockados)
- [ ] O filtro do `compression` recusa `/api/stream` e aceita as demais rotas
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T10: Gancho de SSE no `aplicarStatus`

**What**: depois de gravar, `aplicarStatus` chama `publicarMaquina(id)` e grava `manutencaoPorOffline: false` em toda mudança de status.
**Where**: `Backend/src/feature/machine/statusService.ts`
**Depends on**: T9
**Reuses**: `publicarMaquina`
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mudança de status chama `publicarMaquina` uma vez, depois das gravações
- [ ] `manutencaoPorOffline` volta a `false` em toda mudança, salvo quando o varredor passa a flag explicitamente
- [ ] Falha em `publicarMaquina` não desfaz nem lança no `aplicarStatus`
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T11: Gancho de SSE na trava e na categoria

**What**: `definirTrava` e `moverParaCategoria` chamam `publicarMaquina` depois de gravar.
**Where**: `Backend/src/feature/machine/machineService.ts`
**Depends on**: T10
**Reuses**: `publicarMaquina`
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Trava e movimento de categoria publicam `maquina` uma vez cada
- [ ] Falha na publicação não muda a resposta da operação
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T12: `dispositivoOffline` e `alertaTipos` em `/api/machines`

**What**: `listarMaquinas` e `consultar` devolvem `dispositivoOffline` (`offlineDesde != null`) e `alertaTipos`.
**Where**: `Backend/src/feature/machine/machineService.ts`
**Depends on**: T11
**Reuses**: formato do payload `maquina` (T8)
**Requirement**: TLQ-04, TLQ-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `dispositivoOffline` verdadeiro só com `offlineDesde` preenchido
- [ ] `alertaTipos` com tipos distintos dos pendentes, mais recente primeiro; lista vazia sem incidentes
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T13: Processar telemetria comum

**What**: `processarMensagem` para `telemetria`: acha dispositivo e empilhadeira, grava `ultimaLeituraEm`, grava a leitura com `movimento`, trata a volta do offline e publica `maquina`.
**Where**: `Backend/src/feature/telemetry/telemetryIngestService.ts`
**Depends on**: None (a fase anterior termina antes)
**Reuses**: `DeviceRepository.obterPorMac`, `TelemetryRepository`, `aplicarStatus`, `publicarMaquina`
**Requirement**: TLQ-02, TLQ-01 (itens 7 e 8), TLQ-07 (itens 6 a 8)

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Leitura gravada com `dataDados` igual ao `agora` recebido e `movimento`; `tempo` ignorado
- [ ] `ultimaLeituraEm` atualizado; status e categoria intactos
- [ ] MAC em minúsculas casa com o dispositivo; MAC desconhecido e dispositivo sem máquina descartam com log
- [ ] Com `offlineDesde` preenchido: limpa a marca e publica `maquina` com `dispositivoOffline: false`; se `manutencaoPorOffline` é `true`, volta a `disponivel`; se foi manual, mantém
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T14: Processar evento de movimento

**What**: `processarMensagem` para `evento`: com sessão aberta cria o incidente, aplica `alerta` e publica `incidente`; sem sessão descarta com log.
**Where**: `Backend/src/feature/telemetry/telemetryIngestService.ts`
**Depends on**: T13
**Reuses**: `WorkSessionRepository`, `IncidentRepository`, `formatar`, `aplicarStatus`
**Requirement**: TLQ-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Incidente `pendente` com `origem: "sensor"`, `tipo`, `movimento`, `dataIncidente` igual ao `agora`, `operadorId` da sessão e `filialId` da máquina
- [ ] `aplicarStatus(id, "alerta")` chamado; máquina já em `alerta` com sessão cria mais um incidente e mantém o status
- [ ] Sem sessão: nenhum incidente, nenhuma mudança de status, log
- [ ] `gravidade` e `id_evento` ignorados; evento publicado ao stream no formato de `GET /api/incidents`
- [ ] Categoria de `alerta` inexistente: status muda e a categoria fica (edge case)
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T15: Consumidor da fila (conexão e topologia)

**What**: `iniciarConsumidor` conecta, declara `amq.topic`, as duas filas duráveis com TTL, os `bindQueue`, `prefetch(1)` e consome.
**Where**: `Backend/src/feature/telemetry/telemetryConsumer.ts`
**Depends on**: T14
**Reuses**: `utils/logger.ts`, `env`
**Requirement**: TLQ-01

**Tools**:

- MCP: `context7` (API do `amqplib`)
- Skill: NONE

**Done when**:

- [ ] Sem `rabbit_url`: loga aviso e retorna sem conectar
- [ ] Declara `telemetria` com `x-message-ttl` 60000 e `eventos` com 300000, ligadas a `<prefixo>telemetria.*` e `<prefixo>evento.*` (`amqplib` mockado)
- [ ] `prefetch(1)` e consumo das duas filas
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T16: Ack, descarte e reentrega

**What**: `tratar(msg, canal)`: `lerMensagem` → `processarMensagem`; ack no sucesso e nos descartes; erro de banco volta uma vez à fila e depois descarta.
**Where**: `Backend/src/feature/telemetry/telemetryConsumer.ts`
**Depends on**: T15
**Reuses**: `lerMensagem`, `processarMensagem`
**Requirement**: TLQ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mensagem válida: ack depois de processar, nunca antes
- [ ] Mensagem inválida: log e ack, sem requeue
- [ ] Erro de banco com `redelivered: false`: `nack` com requeue
- [ ] Erro de banco com `redelivered: true`: descarta com log de erro
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T17: Reconexão do consumidor

**What**: Se a conexão falha ou cai, tentar de novo com espera crescente de 1 s até 30 s, sem derrubar a API.
**Where**: `Backend/src/feature/telemetry/telemetryConsumer.ts`
**Depends on**: T16
**Reuses**: nada novo
**Requirement**: TLQ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Falha ao conectar agenda nova tentativa com 1 s, 2 s, 4 s ... até o teto de 30 s (timers falsos)
- [ ] Evento `close` da conexão dispara a reconexão e refaz a topologia
- [ ] Reconexão bem-sucedida zera a espera
- [ ] Nenhum erro escapa para o processo (sem `unhandledRejection`)
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T18: Varredor de offline

**What**: `varrerOffline(agora)` marca a placa sem mensagem há mais de 30 s e `iniciarVarredor()` roda a cada 10 s.
**Where**: `Backend/src/feature/telemetry/offlineService.ts`
**Depends on**: T17
**Reuses**: `aplicarStatus`, `publicarMaquina`, `streamHub.publicar`
**Requirement**: TLQ-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Máquina com `ultimaLeituraEm` de mais de 30 s e `offlineDesde` vazio: grava `offlineDesde`, publica `maquina` e `dispositivo_offline` uma única vez por transição
- [ ] Sem `ultimaLeituraEm` ou sem dispositivo: ignorada
- [ ] Em `disponivel`: `aplicarStatus(manutencao)` e `manutencaoPorOffline: true`; em outro status: só a marca
- [ ] Sessão continua aberta
- [ ] Um tick não começa enquanto o anterior roda; `unref()` no timer
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T19: Ligar o consumidor e o varredor ao servidor

**What**: `server.ts` chama `iniciarConsumidor()` e `iniciarVarredor()` depois do `listen`.
**Where**: `Backend/src/server.ts`
**Depends on**: T18
**Reuses**: nada novo
**Requirement**: TLQ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A API sobe e responde mesmo sem `RABBITMQ_URL`
- [ ] `app.ts` continua sem efeito colateral para os testes
- [ ] Gate check passes: `cd Backend && yarn build && yarn test`

**Tests**: none
**Gate**: build

---

### T20: Simulador de hardware

**What**: script que publica telemetria a cada intervalo e eventos por tecla (`c`, `f`, `a`, `u`, `i`) no `amq.topic`, com `--mac`, `--intervalo` e `--evento`; adiciona `simulate:hardware` ao `package.json`.
**Where**: `Backend/src/scripts/simulateHardware.ts`
**Depends on**: None (a fase anterior termina antes)
**Reuses**: `montarTelemetria`, `montarEvento`
**Requirement**: TLQ-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Lógica de argumentos e de montagem em funções puras testadas: chaves `<prefixo>telemetria.<MAC>` e `<prefixo>evento.<MAC>`, intervalo padrão 5 s
- [ ] Sem `RABBITMQ_URL` encerra com código diferente de zero e mensagem clara
- [ ] Ctrl+C fecha a conexão e encerra
- [ ] Mostra no início a estimativa de mensagens por mês
- [ ] O script não importa `conn` (teste lê o arquivo)
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T21: Datas relativas no seed de leituras

**What**: `seedDataset` gera `dataDados` relativo ao momento da execução em vez de datas fixas.
**Where**: `Backend/src/scripts/seedDataset.ts`
**Depends on**: T20
**Reuses**: nada novo
**Requirement**: TLQ-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] As leituras geradas ficam nos últimos 7 dias contados de `agora` (teste com relógio falso)
- [ ] Nada executa contra o banco nos testes
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick

---

### T22: Urgência dos cinco tipos

**What**: `AccidentCause` vira os 5 tipos do backend; `ACCIDENT_URGENCY`, `incidentToEvent` (com `tipo ?? "colisao"`) e o novo `urgenciaDaMaquina` seguem a tabela fixa.
**Where**: `Frontend/src/data/machines.ts`
**Depends on**: None (a fase anterior termina antes)
**Reuses**: `ACCIDENT_URGENCY`, `eventUrgency`
**Requirement**: TLQ-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tabela: colisão alta, frenagem/aceleração/curva média, inclinação crítica
- [ ] Incidente do sensor sem `tipo` vira `colisao`
- [ ] `urgenciaDaMaquina` escolhe a maior urgência; empate, o tipo mais recente (primeiro de `alertaTipos`); lista vazia devolve nenhuma
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: testes antigos que usavam `frenagem` e `tombamento` atualizados sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T23: Rótulos dos cinco tipos nos 7 idiomas

**What**: chaves `frenagem_brusca`, `aceleracao_brusca`, `curva_brusca`, `inclinacao_excessiva` (e `colisao`) traduzidas em `de`, `en-US`, `es`, `fr`, `ja`, `pt-BR` e `ru`; chaves antigas `frenagem` e `tombamento` removidas.
**Where**: `Frontend/src/locales/`
**Depends on**: T22
**Reuses**: `Frontend/src/test/config/levelInfoLocales.test.ts`
**Requirement**: TLQ-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Os cinco tipos existem nos sete idiomas, sem texto vazio nem cópia do português
- [ ] O teste de paridade de chaves passa
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T24: `LevelInfoModal` com os cinco tipos

**What**: o modal lista cada tipo no nível definido pela tabela.
**Where**: `Frontend/src/components/alerts/LevelInfoModal.tsx`
**Depends on**: T23
**Reuses**: `ACCIDENT_URGENCY`
**Requirement**: TLQ-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cada nível mostra só os tipos que a tabela atribui a ele
- [ ] Os nomes aparecem traduzidos
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: `LevelInfoModal.test.tsx` atualizado sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T25: Urgência real no card da Frota

**What**: o card de acidente da Frota mostra a urgência de `urgenciaDaMaquina(machine)`.
**Where**: `Frontend/src/components/fleet/FleetCard.tsx`
**Depends on**: T24
**Reuses**: `urgenciaDaMaquina`
**Requirement**: TLQ-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Card com `alertaTipos` mostra a maior urgência; sem `alertaTipos` segue o comportamento atual
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T26: Cliente SSE do Frontend

**What**: `abrir(onEvento, signal)` com `fetch`, `ReadableStream`, cabeçalho `Authorization` e parser mínimo de SSE.
**Where**: `Frontend/src/services/streamService.ts`
**Depends on**: None (a fase anterior termina antes)
**Reuses**: `authService.getSession()`
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Parser entrega `event` e `data` (JSON) mesmo com o bloco quebrado entre dois chunks
- [ ] Ignora comentários (`: ping`) e blocos sem `event`
- [ ] Manda `Authorization: Bearer ...`; resposta 401 ou fim do stream avisa quem chamou
- [ ] `signal` abortado fecha a leitura
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T27: `LiveContext` e `useLive`

**What**: contexto que mantém uma conexão por usuário logado, reconecta com espera de 1 s até 30 s, fecha no logout e entrega eventos a quem assina com `useLive(tipo, handler)` e `onReconnect`.
**Where**: `Frontend/src/context/LiveContext.tsx`
**Depends on**: T26
**Reuses**: padrão de `AlertsContext`
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Abre o stream com usuário logado e fecha no logout
- [ ] Handler recebe só o tipo de evento que assinou
- [ ] Queda do stream reconecta com espera crescente e chama `onReconnect`
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T28: Provider do stream na árvore

**What**: envolver a aplicação autenticada no `LiveProvider`.
**Where**: `Frontend/src/App.tsx`
**Depends on**: T27
**Reuses**: providers existentes
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `LiveProvider` fica dentro do `AuthProvider` e acima dos consumidores
- [ ] `App.test.tsx` segue passando
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T29: Sino e pop-up pelo stream

**What**: `AlertsContext` recebe incidentes por `useLive("incidente")`, o polling cai para 60 s e recarrega ao reconectar.
**Where**: `Frontend/src/context/AlertsContext.tsx`
**Depends on**: T28
**Reuses**: fila de pop-ups existente
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Incidente do stream entra no sino e abre o pop-up, inclusive de máquina com categoria travada
- [ ] Polling de segurança a cada 60 s; recarga ao reconectar
- [ ] Sem duplicar o incidente que chega pelo stream e depois pelo polling
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: `AlertsContext.test.tsx` atualizado sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T30: Pop-up de placa sem comunicação

**What**: `useLive("dispositivo_offline")` alimenta uma fila própria de pop-ups; `AlertModal` ganha a variante `offline`, traduzida, que não entra no sino nem no histórico.
**Where**: `Frontend/src/components/alerts/AlertModal.tsx` (e a fila em `Frontend/src/context/AlertsContext.tsx`)
**Depends on**: T29
**Reuses**: `AlertModal`
**Requirement**: TLQ-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Variante `offline` mostra a identificação da máquina, nos 7 idiomas
- [ ] O evento não aparece no sino nem no histórico
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T31: Card cinza na Frota

**What**: `FleetCard` aplica o tom cinza quando `dispositivoOffline`, sem mudar de coluna.
**Where**: `Frontend/src/components/fleet/FleetCard.tsx`
**Depends on**: T30
**Reuses**: tokens de cor de `offline`
**Requirement**: TLQ-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `dispositivoOffline: true` aplica a classe cinza; `false` não
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T32: Card cinza na Visão Geral

**What**: `MachineCard` aplica o tom cinza quando `dispositivoOffline`.
**Where**: `Frontend/src/components/machines/MachineCard.tsx`
**Depends on**: T31
**Reuses**: tokens de cor de `offline`
**Requirement**: TLQ-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `dispositivoOffline: true` aplica a classe cinza; `false` não
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T33: Visão Geral e Frota atualizam pelo stream

**What**: `VisaoGeralPage` e `FrotaPage` assinam `maquina`, mesclam os campos na máquina; a Frota também move o card e destaca a chegada; id desconhecido recarrega a lista.
**Where**: `Frontend/src/pages/FrotaPage.tsx` (e `Frontend/src/pages/VisaoGeralPage.tsx`)
**Depends on**: T32
**Reuses**: `moveMachine`, `markArrived`
**Requirement**: TLQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Evento `maquina` muda o card de coluna na Frota sem recarregar e atualiza o card na Visão Geral
- [ ] Máquina com categoria travada muda só o status, fica na linha
- [ ] Id desconhecido recarrega a lista; reconexão recarrega as listas
- [ ] O evento respeita a filial ativa
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: sem exclusões

**Tests**: unit
**Gate**: quick (Front)

---

### T34: Documento de alertas

**What**: explicar a tabela tipo → urgência e em que arquivo mudá-la.
**Where**: `docs/alertas.md`
**Depends on**: None (a fase anterior termina antes)
**Reuses**: `Frontend/src/data/machines.ts`
**Requirement**: TLQ-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Uma pessoa acha, sem abrir o código, onde mudar uma urgência
- [ ] Gate check passes: `cd Backend && yarn format:check`

**Tests**: none
**Gate**: build

---

### T35: Documento de telemetria

**What**: contrato das mensagens, exchange, chaves, as duas filas, simulador, regras de evento, offline e retenção, e o passo a passo de configuração do CloudAMQP.
**Where**: `docs/telemetria.md`
**Depends on**: T34
**Reuses**: `design.md`
**Requirement**: TLQ-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Descreve como rodar `yarn simulate:hardware` e a regra "um backend por vez"
- [ ] Explica TLS, AMQP e MQTT em linguagem simples
- [ ] Gate check passes: `cd Backend && yarn format:check`

**Tests**: none
**Gate**: build

---

### T36: API documentada

**What**: documentar `GET /api/stream`, os eventos SSE, `tipo` do incidente e `dispositivoOffline` e `alertaTipos` de `/api/machines`.
**Where**: `docs/api.md`
**Depends on**: T35
**Reuses**: `design.md`
**Requirement**: TLQ-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Rota, eventos e campos novos documentados com exemplo
- [ ] Gate check passes: `cd Backend && yarn format:check`

**Tests**: none
**Gate**: build

---

### T37: Variáveis de ambiente

**What**: listar `RABBITMQ_URL` e `RABBITMQ_PREFIXO` com comentário.
**Where**: `Backend/.env.example`
**Depends on**: T36
**Reuses**: arquivo existente
**Requirement**: TLQ-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] As duas variáveis aparecem com valor de exemplo (sem credencial real)
- [ ] Gate check passes: `cd Backend && yarn build`

**Tests**: none
**Gate**: build

---

### T38: MAC no firmware

**What**: o firmware manda `WiFi.macAddress()` em `dispositivo`.
**Where**: `iot/codigo/codigo.ino`
**Depends on**: T37
**Reuses**: nada novo
**Requirement**: TLQ-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `ID_DISPOSITIVO` fixo é trocado pelo MAC em telemetria e eventos
- [ ] Nada mais do firmware muda (limites, intervalos, transporte)
- [ ] Gate check passes: `cd Backend && yarn build`

**Tests**: none
**Gate**: build

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 1:  T1 → T2 → T3 → T4 → T5 → T6
Phase 2:  T7 → T8 → T9 → T10 → T11 → T12
Phase 3:  T13 → T14 → T15 → T16 → T17 → T18 → T19
Phase 4:  T20 → T21
Phase 5:  T22 → T23 → T24 → T25
Phase 6:  T26 → T27 → T28 → T29 → T30 → T31 → T32 → T33
Phase 7:  T34 → T35 → T36 → T37 → T38
```

Execução estritamente sequencial.

---

## Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1-T3 | 1 schema cada | ✅ Granular |
| T4 | 1 função (`formatar`) | ✅ Granular |
| T5 | dependência + 2 chaves de `env` | ✅ Coeso |
| T6 | 1 módulo de contrato (4 funções pequenas) | ✅ Coeso |
| T7-T8 | 1 arquivo, 1 conceito cada | ✅ Granular |
| T9 | 1 rota + registro em `app.ts` | ✅ Coeso |
| T10-T12 | 1 gancho ou 1 campo cada | ✅ Granular |
| T13-T14 | 1 ramo do `processarMensagem` cada | ✅ Granular |
| T15-T17 | 1 aspecto do consumidor cada | ✅ Granular |
| T18-T21 | 1 arquivo cada | ✅ Granular |
| T22 | 1 arquivo de dados (tabela e 2 funções) | ✅ Coeso |
| T23 | mesmas chaves em 7 idiomas, travadas por teste de paridade | ⚠️ Coeso, é uma tradução só |
| T24-T33 | 1 componente, contexto ou página cada (T30 e T33 tocam 2 arquivos ligados) | ⚠️ Coeso |
| T34-T38 | 1 arquivo cada | ✅ Granular |

## Diagram-Definition Cross-Check

Dentro de cada fase, cada tarefa depende da anterior. A primeira tarefa de cada fase (T7, T13, T20, T22, T26, T34) declara `None`, porque as fases rodam em ordem.

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ----------------- | ------------- | ------ |
| T1 | None | início | ✅ |
| T2 | T1 | T1 → T2 | ✅ |
| T3 | T2 | T2 → T3 | ✅ |
| T4 | T3 | T3 → T4 | ✅ |
| T5 | T4 | T4 → T5 | ✅ |
| T6 | T5 | T5 → T6 | ✅ |
| T7-T12 | tarefa anterior | cadeia T7 → ... → T12 | ✅ |
| T13-T19 | tarefa anterior | cadeia T13 → ... → T19 | ✅ |
| T20-T21 | tarefa anterior | T20 → T21 | ✅ |
| T22-T25 | tarefa anterior | T22 → ... → T25 | ✅ |
| T26-T33 | tarefa anterior | T26 → ... → T33 | ✅ |
| T34-T38 | tarefa anterior | T34 → ... → T38 | ✅ |

## Test Co-location Validation

| Task | Code Layer | Matrix requires | Task says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1-T3 | Backend schema | unit | unit | ✅ |
| T4 | Backend service | unit | unit | ✅ |
| T5 | Backend config | none | none | ✅ |
| T6 | Backend contrato | unit | unit | ✅ |
| T7-T8 | Backend hub | unit | unit | ✅ |
| T9 | Backend router / `app.ts` | unit | unit | ✅ |
| T10-T14 | Backend service | unit | unit | ✅ |
| T15-T18 | Backend consumidor / service | unit | unit | ✅ |
| T19 | Backend `server.ts` | none | none | ✅ |
| T20-T21 | Backend script | unit | unit | ✅ |
| T22 | Frontend data | unit | unit | ✅ |
| T23 | Frontend locales | unit | unit | ✅ |
| T24-T25, T30-T32 | Frontend componente | unit | unit | ✅ |
| T26 | Frontend service | unit | unit | ✅ |
| T27-T29 | Frontend context | unit | unit | ✅ |
| T33 | Frontend página | unit | unit | ✅ |
| T28 | Frontend `App.tsx` | unit | unit | ✅ |
| T34-T38 | Docs, firmware, env | none | none | ✅ |

## Requirement Coverage

| ID | Tasks |
| -- | ----- |
| TLQ-01 | T5, T6, T13, T15, T16, T17, T19 |
| TLQ-02 | T1, T13 |
| TLQ-03 | T2, T4, T14 |
| TLQ-04 | T12, T22, T23, T24, T25 |
| TLQ-05 | T7, T8, T9, T10, T11, T26, T27, T28, T29, T33 |
| TLQ-06 | T6, T20 |
| TLQ-07 | T1, T12, T13, T18, T30, T31, T32 |
| TLQ-08 | T3, T21 |
| TLQ-09 | T34, T35, T36, T37, T38 |

**Coverage:** 9 total, 9 mapped to tasks.
