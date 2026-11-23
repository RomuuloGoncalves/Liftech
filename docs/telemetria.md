# Telemetria e Fila de Mensagens (RabbitMQ) - Liftech

Este documento detalha o funcionamento da fila de mensagens, o contrato dos pacotes enviados pelas empilhadeiras, as regras de negócio de telemetria e incidentes, a detecção de comunicação offline, o simulador de hardware, a configuração do CloudAMQP, a gravação do firmware no ESP32 e a atualização por Wi-Fi (OTA).

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
- Critério: empilhadeiras que possuem dispositivo vinculado e `ultimaLeituraEm` há mais de 30 segundos (padrão; configurável via `OFFLINE_LIMITE_MS` em ms no `.env` do backend), sem a marca `offlineDesde`.
- **Relação com intervalo de envio e cota:** com `INTERVALO_TELEMETRIA = 5000` ms (5 s), 1 placa envia cerca de **518 mil mensagens/mês** (~2 placas no plano gratuito Little Lemur de ~1 M msg/mês). Se aumentar `INTERVALO_TELEMETRIA` no firmware para economizar cota quando a frota crescer, ajuste `OFFLINE_LIMITE_MS` na mesma proporção (regra prática: `6 × INTERVALO_TELEMETRIA`), caso contrário as placas serão marcadas como offline entre leituras.
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

### Modo demo (`yarn dev:sim` na raiz, ou `yarn simulate:hardware --demo`)

Para ver as máquinas mudando sem nenhum passo manual (depois de `yarn seed:data`, que cria uma sessão aberta para cada máquina em uso):

- **EMP-082** (`A2:C9:9B:1D:F8`, em uso, com sessão aberta) recebe um evento de tipo sorteado a cada 45 a 90 s. O card vai para "Acidentes" e o pop-up abre. A saída de `alerta` continua manual.
- **EMP-083** (`A2:C9:9B:1D:F9`, disponível) para de enviar por 45 s a cada 2 min. Depois de 30 s o card fica cinza, vai para manutenção e o pop-up de offline abre. Quando a telemetria volta, a máquina volta a disponível.

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
5. Para conectar placas ESP32 reais via MQTT:
   - No menu lateral do CloudAMQP, acesse **RabbitMQ Management**.
   - Em **Plugins**, certifique-se de que o plugin `rabbitmq_mqtt` está habilitado.
   - Crie um usuário dedicado para as placas (ou use o usuário da instância) com permissão no exchange `amq.topic` e anote o **vhost**, **usuário**, **senha** e **host** para preencher `iot/codigo/secrets.h`.
   - No firmware, o usuário MQTT deve ser preenchido no formato **`vhost:usuario`** (ex.: `abc12345:placa_esp32`), pois o plugin MQTT do RabbitMQ/CloudAMQP exige o vhost antes dos dois pontos. Se o plano permitir permissão por tópico, restrinja a escrita do usuário das placas ao exchange `amq.topic`.
6. Ao iniciar a API do Liftech (`yarn dev`), o backend conecta automaticamente ao broker, declara as filas `<prefixo>telemetria` e `<prefixo>eventos` e inicia o consumo.

---

## 7. Gravar a Placa (ESP32 + ADXL345)

Guia para preparar o ambiente na Arduino IDE, configurar credenciais, calibrar e validar uma placa nova (`iot/codigo/codigo.ino`).

### 7.1. Hardware e Serial

- **Placa:** ESP32 (core `arduino-esp32` instalado pelo Gerenciador de Placas da Arduino IDE).
- **Acelerômetro:** ADXL345 via I2C no endereço `0x53` (`PINO_SDA = 21`, `PINO_SCL = 22`).
- **Serial Monitor:** `115200` baud.

### 7.2. Bibliotecas necessárias

No **Gerenciador de Bibliotecas** da Arduino IDE, instale:

| Biblioteca | Autor / Referência | Header no firmware | Uso |
| --- | --- | --- | --- |
| **MQTT** | Joel Gaehwiler (`256dpi/arduino-mqtt`) | `#include <MQTT.h>` | Cliente MQTT com suporte a QoS 0 e QoS 1 sobre TLS (`MQTTClient`, buffer de `768` bytes) |
| **ArduinoJson** | Benoit Blanchon (v7+) | `#include <ArduinoJson.h>` | Serialização dos pacotes JSON (`JsonDocument`) |

As demais bibliotecas (`WiFi.h`, `WiFiClientSecure.h`, `Wire.h`, `Preferences.h`, `time.h`, `ArduinoOTA.h`, `esp_ota_ops.h`) já vêm no core `arduino-esp32`.

### 7.3. Arquivo `secrets.h` (credenciais fora do Git)

1. Copie `iot/codigo/secrets.example.h` para `iot/codigo/secrets.h`.
2. O arquivo `secrets.h` está listado em `iot/.gitignore` e **nunca deve ser commitado**.
3. Preencha as constantes abaixo (mantenha as aspas em textos e sem aspas em `MQTT_PORTA`):

| Constante | Tipo / Exemplo | Descrição |
| --- | --- | --- |
| `WIFI_SSID` | `"NOME_DA_REDE"` | Nome da rede Wi-Fi (2,4 GHz) onde a placa vai operar |
| `WIFI_SENHA` | `"SENHA_DA_REDE"` | Senha da rede Wi-Fi |
| `MQTT_HOST` | `"seu-host.lmq.cloudamqp.com"` | Hostname da instância no CloudAMQP |
| `MQTT_PORTA` | `8883` | Porta padrão MQTT sobre TLS (`mqtts`) |
| `MQTT_USUARIO` | `"vhost:usuario"` | Usuário MQTT no formato **`vhost:usuario`** do CloudAMQP |
| `MQTT_SENHA` | `"SENHA_MQTT"` | Senha do usuário MQTT |
| `MQTT_PREFIXO` | `""` | Prefixo dos tópicos; deve ser idêntico a `RABBITMQ_PREFIXO` no `.env` do backend (vazio `""` por padrão) |
| `OTA_SENHA_MD5` | `"SUBSTITUA_PELO_HASH_MD5"` | Hash MD5 (32 caracteres hexadecimais) da senha de atualização OTA (ver [seção 8.2](#82-gerar-o-hash-md5-da-senha-ota)) |
| `OTA_URL_BASE` | `"https://exemplo.invalid/releases/"` | Prefixo de URL HTTPS permitida para download de `.bin` na futura OTA-2 |

### 7.4. Conexão, TLS, NTP e Tópicos MQTT

- **TLS e NTP:** o firmware conecta em `mqtts` na porta `8883` validando o certificado raiz `CA_CLOUDAMQP` (**ISRG Root X1**). Assim que o Wi-Fi sobe, o ESP32 sincroniza a hora via NTP (`pool.ntp.org`, `a.st1.ntp.br`, `time.nist.gov`) até atingir `EPOCH_MINIMO_VALIDO` (`1700000000L`), pois a checagem de validade do certificado TLS exige relógio ajustado.
- **Reconexão não bloqueante:** a leitura do sensor (`INTERVALO_LEITURA = 10` ms) não para quando a rede cai. Wi-Fi tenta reconectar a cada `10 s` (`INTERVALO_RECONEXAO_WIFI = 10000`) e MQTT a cada `5 s` (`INTERVALO_RECONEXAO_MQTT = 5000`), mantendo `mqtt.loop()` ativo.
- **Client ID:** `liftech-<MAC sem :>`.
- **Tópicos publicados pelo firmware:**

| Tipo | Tópico MQTT | QoS | Routing Key no `amq.topic` | Frequência / Regra |
| --- | --- | --- | --- | --- |
| Telemetria contínua | `<MQTT_PREFIXO>telemetria/<MAC>` | `0` | `<prefixo>telemetria.<MAC>` | A cada `5 s` (`INTERVALO_TELEMETRIA = 5000`) |
| Evento de movimento | `<MQTT_PREFIXO>evento/<MAC>` | `1` | `<prefixo>evento.<MAC>` | Imediato ao cruzar um limite, com bloqueio de `3 s` (`TEMPO_BLOQUEIO_EVENTO = 3000`) por tipo |

`<MAC>` é obtido automaticamente por `WiFi.macAddress()` (formato `XX:XX:XX:XX:XX:XX`).

### 7.5. Calibração do sensor (NVS)

A calibração mede a gravidade na posição de montagem da placa (`300` amostras, ~5 s no total após `2 s` de espera inicial) e grava `gravidade_x`, `gravidade_y`, `gravidade_z`, `inicial_x` e `inicial_y` na memória permanente (NVS, namespace `"calibracao"`).

- **Primeiro boot (ou NVS vazio):** `carregarCalibracao()` verifica se a chave `gravidade_z` existe no NVS. Se não existir, imprime `"Nenhuma calibracao no NVS. Iniciando autocalibracao..."` e calibra automaticamente. **Ligue a placa pela primeira vez já apoiada parada e nivelada na posição de operação** (sem mexer no sensor durante os primeiros ~5 s).
- **Boots seguintes:** os valores salvos são carregados direto do NVS.
- **Recalibrar manualmente:** conecte a placa por USB, abra o Serial Monitor (`115200` baud), deixe a empilhadeira parada e envie **`C`** (ou `c`). Faça isso sempre que mudar a placa de posição ou de empilhadeira.
- **Persistência em OTA:** atualizações por Wi-Fi não apagam a partição `nvs`, mantendo a calibração salva.
- **Limiares iniciais no código (`codigo.ino`):** `LIMITE_ACELERACAO_BRUSCA` (`1.50`), `LIMITE_FRENAGEM_BRUSCA` (`-1.50`), `LIMITE_COLISAO` (`2.50`), `LIMITE_CURVA_BRUSCA` (`1.50`) e `LIMITE_INCLINACAO` (`15.0`). Ainda são valores de partida a ajustar com coleta real na empilhadeira.

### 7.6. Passos para gravar pela Arduino IDE

1. Preencha `iot/codigo/secrets.h` e abra `iot/codigo/codigo.ino`.
2. Instale as bibliotecas `MQTT` e `ArduinoJson`.
3. Selecione a placa ESP32 correta e o esquema de partição adequado para OTA (ver [seção 8.1](#81-esquema-de-partição-primeira-gravação-por-cabo)).
4. Conecte a placa pelo cabo USB, selecione a porta serial e faça o **Upload**.
5. Abra o **Serial Monitor** em `115200` baud e anote o endereço exibido em `Dispositivo MAC: XX:XX:XX:XX:XX:XX`.

### 7.7. Checklist E2E (do cabo ao painel)

1. **Broker e Backend prontos:** plugin `rabbitmq_mqtt` ativo no CloudAMQP; `.env` do backend com `RABBITMQ_URL` e `RABBITMQ_PREFIXO` igual a `MQTT_PREFIXO`; apenas **uma** instância do backend conectada àquele prefixo.
2. **Boot e conexão da placa:** Serial exibe a versão (`Versao: ...`), calibração concluída/carregada, `Wi-Fi conectado.`, `Horario NTP sincronizado.`, `Conectando ao broker MQTT... conectado.` e linhas `[Telemetria] ... [MQTT OK]` a cada 5 s.
3. **Cadastro no sistema:** cadastre o dispositivo com o `MAC` impresso no Serial e vincule-o a uma empilhadeira. Confirme que o backend para de registrar aviso de MAC desconhecido e atualiza a leitura da máquina.
4. **Evento com sessão aberta:** inicie uma sessão de trabalho na empilhadeira no sistema, sacuda/incline a placa acima do limite (`> 15°` ou impacto `>= 2.50`) e confirme `EVENTO ENVIADO: ...` no Serial, card movido para a coluna de alerta ("Acidentes") e pop-up no frontend em até 2 s.
5. **Evento sem sessão aberta:** encerre a sessão da empilhadeira, repita o movimento e confirme que nenhum novo incidente é criado.
6. **Offline e retorno automático:** deixe a empilhadeira em `disponivel` (sem sessão) e desligue a placa da tomada. Após 30–40 s, confirme o card cinza, status `manutencao` e pop-up de dispositivo offline. Religue a placa e confirme o retorno automático a `disponivel`.
7. **Atualização OTA:** com a sessão fechada, execute uma atualização por Wi-Fi seguindo a [seção 8](#8-atualizar-a-placa-por-wi-fi-ota) e confirme a versão nova no boot.

---

## 8. Atualizar a Placa por Wi-Fi (OTA)

O firmware usa **ArduinoOTA** (OTA-1, na mesma rede Wi-Fi/LAN) com janela de confirmação para **rollback automático** (OTA-3).

> **Regra obrigatória:** nunca atualize uma empilhadeira com **sessão de trabalho aberta**. Durante a gravação, `ArduinoOTA.handle()` bloqueia o loop por ~10 a 30 s e pausa a leitura e o envio do sensor (`otaEmAndamento`). Se a transferência passar de 30 s (`OFFLINE_LIMITE_MS`), o backend marcará a placa como offline (e `disponivel` vira `manutencao`), restaurando o status automaticamente quando a placa voltar a publicar telemetria.

### 8.1. Esquema de partição (primeira gravação por cabo)

A OTA precisa de dois slots de aplicativo na flash:

- **"Default 4MB with spiffs"**: ~1,2 MB por slot de app. Como o sketch inclui Wi-Fi + TLS + MQTT + OTA + JSON, o binário fica próximo de ~1 MB.
- **"Minimal SPIFFS (1.9MB APP with OTA)"**: usar este esquema caso o binário compilado passe de ~1,15 MB.
- **Nunca usar "Huge APP"**: possui apenas um slot de aplicação e não suporta OTA.
- A **primeira gravação** após alterar o esquema de partição precisa ser feita por **cabo USB**.

### 8.2. Gerar o hash MD5 da senha OTA

A senha em texto puro nunca é gravada no binário: o firmware chama `ArduinoOTA.setPasswordHash(OTA_SENHA_MD5)`. Gere o MD5 **sem quebra de linha** e copie os 32 caracteres hexadecimais para `OTA_SENHA_MD5` em `secrets.h`:

- **Linux / macOS / Git Bash:**
  ```bash
  echo -n "sua-senha" | md5sum
  ```
  *(copie apenas o hash de 32 caracteres antes de ` -`).*
- **Windows (PowerShell):**
  ```powershell
  $bytes = [System.Text.Encoding]::UTF8.GetBytes("sua-senha")
  $md5 = [System.Security.Cryptography.MD5]::Create()
  ([System.BitConverter]::ToString($md5.ComputeHash($bytes)) -replace '-','').ToLower()
  ```

Na hora de enviar o firmware (Arduino IDE ou `espota.py`), informe a **senha em texto puro** (`sua-senha`), não o hash.

### 8.3. Pré-requisito de rede e envio (IDE ou `espota.py`)

- O computador e o ESP32 precisam estar na **mesma rede Wi-Fi/LAN**. Redes com isolamento de clientes (comum em redes acadêmicas/visitantes) bloqueiam mDNS/UDP; nesse caso, use o hotspot do celular/notebook.
- Após conectar ao Wi-Fi, a placa anuncia o hostname **`liftech-<MAC sem :>`** (ex.: `liftech-001B44113AB7.local`) e imprime o IP no Serial.

**Opção A — Arduino IDE:**
1. Incremente `#define FW_VERSAO "x.y.z"` em `codigo.ino`.
2. Em **Tools → Port**, selecione a porta de rede `liftech-<MAC>` (ou o IP da placa).
3. Clique em **Upload** e digite a senha OTA em texto puro quando solicitada.

**Opção B — Linha de comando (`espota.py`):**
1. Na Arduino IDE, gere o `.bin` via **Sketch → Export Compiled Binary**.
2. Execute o `espota.py` (presente na pasta `tools/` do core `arduino-esp32`):
   ```bash
   python3 espota.py -i <IP_OU_HOSTNAME_LOCAL> -a <SENHA_OTA> -f <CAMINHO_DO_BINARIO.bin>
   ```
   - `-i`: IP da placa ou `liftech-<MAC sem :>.local`
   - `-a`: senha OTA em texto puro
   - `-f`: caminho do arquivo `.bin` exportado

### 8.4. Como conferir a versão

- Antes de compilar, atualize `#define FW_VERSAO "x.y.z"` no topo de `codigo.ino`.
- No boot, o Serial Monitor (`115200` baud) imprime `Versao: <FW_VERSAO>` no cabeçalho inicial.
- Ao concluir a transferência, a placa imprime `"OTA: atualizacao concluida. Reiniciando..."` e reinicia já no novo slot.

### 8.5. Como funciona o rollback (OTA-3)

- O firmware sobrescreve `verifyRollbackLater()` retornando `true` e também registra o estado pendente no NVS (namespace `"ota"`, chave `"pendente"`).
- Ao subir após uma OTA, inicia uma janela de **90 segundos** (`TEMPO_LIMITE_VALIDACAO_OTA_MS = 90000UL`).
- Quando o ESP32 conecta ao Wi-Fi, conecta ao MQTT e conclui o primeiro `publish` com sucesso, chama `confirmarOtaValida()` (`esp_ota_mark_app_valid_cancel_rollback()`), marcando o firmware novo como válido e imprimindo `"OTA: firmware confirmado como valido."`.
- Se isso **não** acontecer em até 90 s (por exemplo, credencial MQTT errada ou broker inacessível), o firmware imprime `"OTA: timeout de 90 s sem confirmacao. Executando rollback..."` e chama `esp_ota_mark_app_invalid_rollback_and_reboot()`, reiniciando na versão anterior.
- **Atenção sobre `CONFIG_APP_ROLLBACK_ENABLE` no `sdkconfig`:** o core ESP32 não estava instalado no ambiente durante a documentação, então **não foi confirmado se o `sdkconfig` do core instalado habilita `CONFIG_APP_ROLLBACK_ENABLE` no bootloader**.
  - Se habilitado no bootloader: o rollback protege também contra crash/boot loop imediato antes de chegar ao `loop()`.
  - Se **não** habilitado no core: apenas o fallback via NVS entra em ação, protegendo **somente firmwares que sobem até o `loop()` e falham em conectar/publicar em 90 s** — um crash imediato no boot exigirá gravação por cabo USB. Sempre teste firmwares novos em bancada antes de atualizar uma placa montada.

### 8.6. (Futuro — OTA-2) Atualização remota fora da LAN via MQTT + HTTPS

Para placas em campo fora da LAN do operador, está prevista a **OTA-2 (P3, ainda não implementada no firmware atual)**:

- A placa assinará `<MQTT_PREFIXO>ota/<MAC>` (QoS 1) e publicará o resultado em `<MQTT_PREFIXO>ota_status/<MAC>`.
- Payload do comando:
  ```json
  {
    "url": "https://exemplo.invalid/releases/liftech-1.1.0.bin",
    "md5": "hash-md5-do-arquivo-bin",
    "versao": "1.1.0"
  }
  ```
- O firmware recusará URLs que não comecem com `OTA_URL_BASE`, ignorará versões iguais à `FW_VERSAO` atual e validará o MD5 do `.bin` antes de reiniciar.
- **Como disparar sem script extra:** no painel **RabbitMQ Management** do CloudAMQP → **Exchanges** → `amq.topic` → **Publish message**, informe a routing key `<prefixo>ota.<MAC>` e o JSON acima no payload. O backend não consome `ota.*` (não há binding ligada a esse padrão).
