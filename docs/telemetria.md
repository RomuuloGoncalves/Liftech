# Telemetria e Fila de Mensagens (RabbitMQ) - Liftech

Este documento detalha o funcionamento da fila de mensagens, o contrato dos pacotes enviados pelas empilhadeiras, as regras de negócio de telemetria e incidentes, a detecção de comunicação offline, o simulador de hardware e a configuração do CloudAMQP.

---

## 1. Conceitos Básicos: AMQP, MQTT e TLS

- **AMQP (Advanced Message Queuing Protocol):** Protocolo avançado de mensageria usado entre a API do Backend e o broker (CloudAMQP). Suporta exchanges flexíveis, filas persistentes, controle de fluxo (`prefetch`) e confirmações explícitas de recebimento (`ack`/`nack`). A API do Liftech conecta via AMQP com a biblioteca `amqplib`.
- **MQTT (Message Queuing Telemetry Transport):** Protocolo muito leve voltado a dispositivos com baixa capacidade de processamento e conexões instáveis, como o microcontrolador ESP32. O broker CloudAMQP traduz tópicos MQTT para o exchange `amq.topic` do RabbitMQ trocando barras (`/`) por pontos (`.`).
- **TLS (Transport Layer Security):** Camada de segurança criptográfica (conexões `amqps://` ou `mqtts://`). Garante que as credenciais e os dados de telemetria trafeguem cifrados entre os nós e a nuvem, protegendo contra interceptação na rede.

---

## 2. Topologia do RabbitMQ

A arquitetura utiliza o exchange padrão do RabbitMQ e duas filas duráveis declaradas automaticamente pela API no momento em que o servidor sobe.

```
[ ESP32 / Simulador ]
         |
         v
  (amq.topic exchange)
   /                \
  routing key:       routing key:
  telemetria.<MAC>   evento.<MAC>
 /                    \
v                      v
[ fila telemetria ]    [ fila eventos ]
(TTL: 60 s)            (TTL: 5 min)
 \                    /
  \                  /
   v                v
 [ API Backend: telemetryConsumer ]
```

### Configuração das filas

| Fila                  | Routing Key vinculada   | TTL da mensagem (`x-message-ttl`) | Finalidade                                |
| --------------------- | ----------------------- | --------------------------------- | ----------------------------------------- |
| `<prefixo>telemetria` | `<prefixo>telemetria.*` | 60.000 ms (60 s)                  | Leituras contínuas de sensores a cada 5 s |
| `<prefixo>eventos`    | `<prefixo>evento.*`     | 300.000 ms (5 min)                | Alertas de impacto, curva ou inclinação   |

- **Por que duas filas separadas:** Garante prioridade no processamento de incidentes. Se uma máquina ficar temporariamente sem conexão ou se o consumidor pausar, o acúmulo de mensagens periódicas de telemetria não atrasa o consumo de eventos críticos de segurança.
- **Prefetch:** O consumidor processa `1` mensagem por vez em cada fila (`channel.prefetch(1)`), garantindo ordem cronológica e evitando sobrecarga de memória.
- **Confirmação (Ack/Nack):**
  - Mensagem processada com sucesso: recebe `ack`.
  - Mensagem inválida, MAC desconhecido ou erro irrecuperável: recebe `ack` com registro em log (`warn`), sendo descartada para evitar laços infinitos.
  - Erro de banco de dados no primeiro processamento (`redelivered: false`): recebe `nack` com recolocação na fila (`requeue: true`).
  - Erro de banco de dados em mensagem já reentregue (`redelivered: true`): recebe `ack` com log de erro, sendo descartada.

---

## 3. Contrato das Mensagens

As mensagens enviadas à fila devem ser objetos JSON válidos. O campo `dispositivo` transporta o endereço MAC da placa (case-insensitive, normalizado para maiúsculas no backend).

### 3.1. Mensagem de Telemetria Contínua

Enviada periodicamente pelo hardware (a cada 5 segundos):

```json
{
  "tipo": "telemetria",
  "dispositivo": "00:1B:44:11:3A:B7",
  "tempo": 128450,
  "movimento": {
    "aceleracao_x": 0.05,
    "aceleracao_y": -0.02,
    "aceleracao_z": 0.98,
    "inclinacao_x": 1.2,
    "inclinacao_y": -0.4,
    "magnitude": 0.06
  }
}
```

- `tempo`: tempo de atividade em milissegundos (`millis()` do ESP32). É ignorado na persistência do backend.
- `movimento`: valores de aceleração em G, inclinação em graus e magnitude calculada do vetor dinâmico.

### 3.2. Mensagem de Evento de Movimento

Enviada imediatamente quando um dos limites de segurança é ultrapassado:

```json
{
  "tipo": "evento",
  "dispositivo": "00:1B:44:11:3A:B7",
  "id_evento": 14,
  "tempo": 132100,
  "evento": {
    "tipo": "colisao",
    "gravidade": "critica"
  },
  "movimento": {
    "aceleracao_x": 2.85,
    "aceleracao_y": 0.12,
    "aceleracao_z": 1.05,
    "inclinacao_x": 3.1,
    "inclinacao_y": 0.5,
    "magnitude": 2.86
  }
}
```

- `evento.tipo`: deve ser estritamente um dos 5 tipos reconhecidos:
  1. `colisao`
  2. `frenagem_brusca`
  3. `aceleracao_brusca`
  4. `curva_brusca`
  5. `inclinacao_excessiva`
- `evento.gravidade` e `id_evento`: campos informativos enviados pelo firmware, ignorados pelo backend (a urgência do incidente é determinada pela tabela do frontend).

---

## 4. Regras de Processamento no Backend

### 4.1. Evento vira Incidente

1. **Dependência de sessão ativa:** O backend consulta se a empilhadeira associada ao MAC possui sessão de trabalho aberta (`WorkSession` com `fim: null`).
   - **Sem sessão aberta:** O evento é descartado com log informativo. Uma máquina estacionada ou em manutenção não gera incidentes de operador.
   - **Com sessão aberta:** Cria um documento na coleção `incident` com status `pendente`, `origem: "sensor"`, `tipo: evento.tipo`, cópia dos dados de `movimento`, data atual (`agora`), operador da sessão e filial da máquina.
2. **Mudança para status `alerta`:** A criação do incidente aciona `aplicarStatus(empilhadeiraId, "alerta")`.
   - A máquina é movida para a categoria vinculada ao status de alerta (ex.: "Acidentes"), respeitando a trava de categoria caso esteja ligada.
   - Se a máquina já estiver em `alerta` e houver nova ocorrência, o novo incidente é registrado e o status mantido.
3. **Publicação em tempo real:** Notifica os clientes conectados via Server-Sent Events (`GET /api/stream`) na filial correspondente com o evento `incidente`.

### 4.2. Telemetria e Atualização de Estado

- Grava a leitura na coleção `telemetry` com `dataDados = agora` e os eixos de `movimento`.
- Atualiza o campo `ultimaLeituraEm` na empilhadeira correspondente.
- Não altera status nem categoria da máquina.
- **Recuperação de offline:** Se a máquina estava com `offlineDesde` preenchido, a marca é removida. Caso a máquina tenha sido colocada em `manutencao` automaticamente pelo varredor (`manutencaoPorOffline = true`), seu status retorna a `disponivel`. Se a manutenção foi aplicada manualmente por um usuário, o status permanece em `manutencao`. Notifica o stream com o evento `maquina`.

### 4.3. Monitoramento de Placa sem Comunicação (Offline)

- O serviço `offlineService` executa uma varredura a cada 10 segundos.
- Critério: empilhadeiras que possuem dispositivo vinculado e `ultimaLeituraEm` há mais de 30 segundos, sem a marca `offlineDesde`.
- Ao atingir 30 segundos sem comunicação:
  - Grava `offlineDesde = agora`.
  - Se a máquina estiver com status `disponivel`, muda para `manutencao` marcando `manutencaoPorOffline = true`.
  - Emite o evento SSE `maquina` com `dispositivoOffline: true` e o evento `dispositivo_offline`.
  - O card da máquina na Frota e na Visão Geral ganha tonalidade cinza, permanecendo na mesma coluna.
  - A sessão de uso aberta NÃO é encerrada por falta de comunicação.
  - Máquinas sem dispositivo conectado ou que nunca enviaram leituras não entram nessa verificação.

### 4.4. Retenção de Leituras (TTL)

- A coleção `telemetry` possui um índice TTL no MongoDB: `{ dataDados: 1 }` com expiração configurada para `604800` segundos (7 dias). Leituras com mais de 7 dias são removidas automaticamente pelo banco.
- A coleção `incident` não possui expiração: incidentes de segurança permanecem gravados permanentemente para auditoria e histórico.

---

## 5. Simulador de Hardware

O script `simulateHardware.ts` permite testar todo o ecossistema sem a necessidade física de um ESP32. Ele publica diretamente no exchange `amq.topic` usando AMQP e não conecta ao MongoDB.

### Como executar

Dentro do diretório `Backend/`:

```bash
# Simular uma empilhadeira com envio a cada 5 segundos
yarn simulate:hardware --mac A2:C9:9B:1D:F7

# Simular múltiplos dispositivos com intervalo de 2 segundos
yarn simulate:hardware --mac A2:C9:9B:1D:F7 --mac B4:E1:88:2C:A0 --intervalo 2

# Disparar um evento logo na inicialização
yarn simulate:hardware --mac A2:C9:9B:1D:F7 --evento colisao
```

### Controles interativos no terminal

Com o simulador em execução, digite qualquer uma das seguintes teclas no terminal para emitir um evento instantâneo para o primeiro MAC informado:

- `c` → Dispara evento de **colisão** (`colisao`)
- `f` → Dispara evento de **frenagem brusca** (`frenagem_brusca`)
- `a` → Dispara evento de **aceleração brusca** (`aceleracao_brusca`)
- `u` → Dispara evento de **curva brusca** (`curva_brusca`)
- `i` → Dispara evento de **inclinação excessiva** (`inclinacao_excessiva`)
- `Ctrl + C` → Encerra o simulador e fecha a conexão AMQP com segurança.

### Estimativa de volume de mensagens

Ao iniciar, o script calcula e exibe no console a quantidade estimada de mensagens que a configuração enviará por mês, ajudando no controle do limite gratuito do CloudAMQP.

### Regra importante: Um backend por vez

O RabbitMQ entrega mensagens de uma fila dividindo-as entre os consumidores conectados (round-robin). Se houver dois backends rodando com a mesma `RABBITMQ_URL` sem prefixo (por exemplo, um servidor local e outro ativo na nuvem no Render), metade das mensagens do simulador irá para o servidor local e metade irá para o servidor da nuvem.

> **Regra de desenvolvimento:** Mantenha apenas uma instância do backend ativa durante os testes, ou configure um prefixo exclusivo na variável `RABBITMQ_PREFIXO` do `.env` (ex.: `RABBITMQ_PREFIXO=dev_`).

---

## 6. Passo a Passo: Configuração do CloudAMQP

1. Acesse [cloudamqp.com](https://customer.cloudamqp.com) e crie uma conta gratuita.
2. Crie uma nova instância selecionando o plano **Little Lemur** (gratuito).
3. Na página de detalhes da instância, copie a **AMQP URL** (formato: `amqps://usuario:senha@host.cloudamqp.com/vhost`).
4. Configure a URL no arquivo `.env` do backend:
   ```env
   RABBITMQ_URL="amqps://usuario:senha@host.cloudamqp.com/vhost"
   RABBITMQ_PREFIXO=""
   ```
5. _(Opcional)_ Caso conecte placas ESP32 reais via MQTT:
   - No menu lateral do CloudAMQP, acesse **RabbitMQ Management**.
   - Em **Plugins**, certifique-se de que o plugin `rabbitmq_mqtt` está habilitado.
   - Crie um usuário com permissão de escrita restrita no exchange `amq.topic` para gravar no firmware das placas.
6. Ao iniciar a API do Liftech (`yarn dev`), o backend conecta automaticamente ao broker, declara as filas `telemetria` e `eventos` e inicia o consumo.
