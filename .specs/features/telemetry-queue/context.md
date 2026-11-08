# Telemetria pela fila (RabbitMQ) Context

**Gathered:** 2026-11-07
**Spec:** `.specs/features/telemetry-queue/spec.md`
**Status:** Ready for design (aguardando aprovação do dono)

---

## Feature Boundary

O backend consome da fila RabbitMQ (CloudAMQP) as mensagens que o ESP32 publica (telemetria a cada 5 s e eventos de movimento), grava as leituras, transforma eventos em incidentes e alertas, e avisa o front na hora por Server-Sent Events. Um simulador local publica mensagens iguais às do firmware. O caminho físico ESP32 → broker (MQTT ou um endpoint HTTP que publica na fila) fica fora desta feature.

---

## Implementation Decisions

### Contrato da mensagem (firmware `iot/codigo/codigo.ino`)

- Dois tipos de mensagem: `telemetria` (`{ tipo, dispositivo, tempo, movimento }`) e `evento` (`{ tipo, dispositivo, id_evento, tempo, evento: { tipo, gravidade }, movimento }`). `movimento` traz `aceleracao_x/y/z`, `inclinacao_x/y` e `magnitude`.
- `dispositivo` é o **endereço MAC** da placa (opção A do dono): o firmware troca `ID_DISPOSITIVO` por `WiFi.macAddress()`. O backend casa com `device.enderecoMac`, sem diferenciar maiúsculas.
- `tempo` é `millis()` (tempo desde o boot), não um horário: o backend ignora e usa o horário de recebimento.
- Tipos de evento: `colisao`, `frenagem_brusca`, `aceleracao_brusca`, `curva_brusca`, `inclinacao_excessiva`. O firmware já aplica o bloqueio de 3 s por tipo.

### Quando um evento vira alerta

- Todos os 5 eventos movem a máquina para `alerta`; o que muda é só a urgência.
- Iniciar e encerrar sessão **não é alerta**: só move o card ("Ativas" e "Disponíveis"), e isso já existe.
- Alerta só nasce de incidente, e máquina parada não gera alerta. Regra única: **o evento só vira incidente se a empilhadeira tem sessão aberta**; sem sessão (disponível, manutenção, alerta com sessão já encerrada) o evento é descartado com log.
- A saída de `alerta` continua manual. A sessão segue aberta durante o alerta, e ao encerrar a máquina fica em `alerta` (regra atual).
- Categoria travada: o status vira `alerta` e o pop-up aparece normalmente, mas o card fica na linha em que está.

### Urgência (fixa no front)

- O backend guarda só o `tipo` e ignora a `gravidade` do firmware. A urgência é derivada no front, pela regra que já existe (`ACCIDENT_URGENCY`): `colisao` alta, `frenagem_brusca` média, `aceleracao_brusca` média, `curva_brusca` média, `inclinacao_excessiva` crítica (equivale ao "tombamento").
- Vários incidentes pendentes na mesma máquina: o card mostra o de maior urgência; empate, o mais recente.
- Um doc (`docs/alertas.md`) explica onde mudar a tabela, para uma feature futura tornar isso configurável.

### Telemetria comum

- Só grava a leitura (com TTL de 7 dias) e atualiza a última leitura da máquina; não muda status.
- Os dados de movimento ficam guardados no incidente e na leitura; nenhuma tela os mostra nesta feature.

### Offline (regra provisória, o dono vai rever)

- A placa fica ligada o tempo todo e manda leitura a cada 5 s; offline significa **placa sem mandar mensagem por 30 s** (desligada, sem Wi-Fi, travada), não "empilhadeira parada".
- Máquina offline: o card fica cinza, **na mesma coluna**, e aparece um pop-up (que não é incidente).
- Exceção: se a máquina está parada (`disponivel`), o status vira `manutencao`, para sinalizar que o dispositivo precisa de correção.
- Quando as mensagens voltam, o card se atualiza.

### Tempo real

- Server-Sent Events (não WebSocket): o backend empurra só o que mudou, filtrado pelo escopo de filial de cada usuário. Substitui o polling de 15 s do sino; fica um polling lento de segurança.
- O consumidor da fila roda no mesmo processo da API, uma instância só.

### Agent's Discretion

- Nome da fila, nomes dos campos novos (`ultimaLeituraEm`, `offlineDesde` etc.), formato dos eventos SSE, intervalo do varredor de offline e flags do simulador.

### Declined / Undiscussed Gray Areas → Assumptions

- Agrupar vários eventos do mesmo impacto em um incidente (D10): o dono quer aprofundar depois; v1 grava 1 incidente por evento.
- Volta de `manutencao` para `disponivel` quando o dado retorna e quando a manutenção foi posta pela regra de offline: assumido sim; está no spec como não confirmado.

---

## Specific References

- Cota do CloudAMQP gratuito (Little Lemur): 20 conexões e cerca de 1 milhão de mensagens por mês, a confirmar; MQTT no plano gratuito não confirmado. Cada dispositivo a 5 s gera cerca de 518 mil mensagens por mês, então o simulador precisa de taxa e quantidade configuráveis.

---

## Deferred Ideas

- Início de trabalho (sessão) aparecendo no sino e no histórico como atividade: "não precisa por enquanto".
- Tela com os dados de movimento (aceleração, inclinação, magnitude) no detalhe do alerta.
- Gravidade configurável no backend em vez de tabela fixa no front.
- Caminho físico ESP32 → broker (MQTT no CloudAMQP ou endpoint HTTP que publica na fila).
- Remover `POST /api/telemetry` e `LIMITE_IMPACTO`, que ficam como legado.
- Mais de uma instância do backend (SSE precisaria de fanout pelo RabbitMQ).
- Alertas de área restrita, bateria e velocidade do TAP.
