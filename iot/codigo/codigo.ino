#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <math.h>

#define ENDERECO_ADXL345 0x53

#define PINO_SDA 21
#define PINO_SCL 22

// Preencha antes de gravar na placa. Não versionar a senha real.
const char* NOME_WIFI = "NOME_DA_REDE";
const char* SENHA_WIFI = "SENHA_DA_REDE";

// Broker MQTT do CloudAMQP (mesma instância da RABBITMQ_URL da API).
// Pegue host, usuário, senha e vhost na página da instância. Não versionar a senha real.
// O plugin rabbitmq_mqtt traduz o tópico "telemetria/<MAC>" para a routing key
// "telemetria.<MAC>" no exchange amq.topic, que a API consome (docs/telemetria.md).
const char* MQTT_HOST = "HOST.cloudamqp.com";
const int MQTT_PORTA = 8883; // TLS
const char* MQTT_USUARIO = "VHOST:USUARIO"; // formato do CloudAMQP: vhost:usuario
const char* MQTT_SENHA = "SENHA_MQTT";

// Igual ao RABBITMQ_PREFIXO do .env da API (vazio em produção, ex.: "dev_").
const char* PREFIXO_TOPICO = "";

// O identificador do dispositivo e obtido via WiFi.macAddress()

#define INTERVALO_LEITURA 10
#define INTERVALO_TELEMETRIA 5000

#define TEMPO_BLOQUEIO_EVENTO 3000

// Valores iniciais.
// Depois vamos calibrar com dados reais da empilhadeira.

#define LIMITE_ACELERACAO_BRUSCA 1.50
#define LIMITE_FRENAGEM_BRUSCA -1.50
#define LIMITE_COLISAO 2.50
#define LIMITE_CURVA_BRUSCA 1.50
#define LIMITE_INCLINACAO 15.0

unsigned long ultimaLeitura = 0;
unsigned long ultimaTelemetria = 0;

unsigned long ultimoEventoFrenagem = 0;
unsigned long ultimoEventoAceleracao = 0;
unsigned long ultimoEventoColisao = 0;
unsigned long ultimoEventoCurva = 0;
unsigned long ultimoEventoInclinacao = 0;

unsigned long contadorEventos = 0;

float aceleracaoXFiltrada = 0;
float aceleracaoYFiltrada = 0;
float aceleracaoZFiltrada = 0;

const float FATOR_FILTRO = 0.20;

// Gravidade medida na posição de instalação
float gravidadeX = 0;
float gravidadeY = 0;
float gravidadeZ = 0;

// Inclinação inicial
float inclinacaoInicialX = 0;
float inclinacaoInicialY = 0;

Preferences memoria;

WiFiClientSecure clienteTLS;
PubSubClient mqtt(clienteTLS);

void escreverRegistrador(byte registrador, byte valor) {

  Wire.beginTransmission(ENDERECO_ADXL345);

  Wire.write(registrador);
  Wire.write(valor);

  Wire.endTransmission();
}

bool lerAceleracao(
  int16_t &x,
  int16_t &y,
  int16_t &z
) {

  Wire.beginTransmission(ENDERECO_ADXL345);

  Wire.write(0x32);

  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  if (Wire.requestFrom(ENDERECO_ADXL345, 6) != 6) {
    return false;
  }

  x = Wire.read() | (Wire.read() << 8);
  y = Wire.read() | (Wire.read() << 8);
  z = Wire.read() | (Wire.read() << 8);

  return true;
}

float aplicarFiltro(
  float atual,
  float anterior
) {

  return anterior +
         FATOR_FILTRO *
         (atual - anterior);
}

bool podeGerarEvento(
  unsigned long ultimoEvento
) {

  return millis() - ultimoEvento >
         TEMPO_BLOQUEIO_EVENTO;
}

float calcularInclinacaoX(
  float x,
  float y,
  float z
) {

  return atan2(
    x,
    sqrt(y * y + z * z)
  ) * 180.0 / PI;
}

float calcularInclinacaoY(
  float x,
  float y,
  float z
) {

  return atan2(
    y,
    sqrt(x * x + z * z)
  ) * 180.0 / PI;
}

void calibrarSensor() {

  Serial.println();
  Serial.println("=================================");
  Serial.println("INICIANDO CALIBRACAO");
  Serial.println("=================================");
  Serial.println("Mantenha a empilhadeira parada.");
  Serial.println("Nao mexa no sensor.");
  Serial.println();

  delay(2000);

  const int NUMERO_AMOSTRAS = 300;

  float somaX = 0;
  float somaY = 0;
  float somaZ = 0;

  int amostrasValidas = 0;

  for (int i = 0; i < NUMERO_AMOSTRAS; i++) {

    int16_t x;
    int16_t y;
    int16_t z;

    if (lerAceleracao(x, y, z)) {

      somaX += x * 0.0039;
      somaY += y * 0.0039;
      somaZ += z * 0.0039;

      amostrasValidas++;
    }

    delay(10);
  }

  if (amostrasValidas == 0) {

    Serial.println("ERRO: nenhuma amostra obtida.");

    return;
  }

  gravidadeX =
    somaX / amostrasValidas;

  gravidadeY =
    somaY / amostrasValidas;

  gravidadeZ =
    somaZ / amostrasValidas;

  inclinacaoInicialX =
    calcularInclinacaoX(
      gravidadeX,
      gravidadeY,
      gravidadeZ
    );

  inclinacaoInicialY =
    calcularInclinacaoY(
      gravidadeX,
      gravidadeY,
      gravidadeZ
    );

  // Salva na memória permanente
  memoria.begin("calibracao", false);

  memoria.putFloat(
    "gravidade_x",
    gravidadeX
  );

  memoria.putFloat(
    "gravidade_y",
    gravidadeY
  );

  memoria.putFloat(
    "gravidade_z",
    gravidadeZ
  );

  memoria.putFloat(
    "inicial_x",
    inclinacaoInicialX
  );

  memoria.putFloat(
    "inicial_y",
    inclinacaoInicialY
  );

  memoria.end();

  Serial.println();
  Serial.println("CALIBRACAO CONCLUIDA");

  Serial.print("Gravidade X: ");
  Serial.println(gravidadeX, 4);

  Serial.print("Gravidade Y: ");
  Serial.println(gravidadeY, 4);

  Serial.print("Gravidade Z: ");
  Serial.println(gravidadeZ, 4);

  Serial.print("Inclinacao inicial X: ");
  Serial.println(inclinacaoInicialX, 2);

  Serial.print("Inclinacao inicial Y: ");
  Serial.println(inclinacaoInicialY, 2);

  Serial.println();
}

void carregarCalibracao() {

  memoria.begin("calibracao", true);

  gravidadeX =
    memoria.getFloat(
      "gravidade_x",
      0
    );

  gravidadeY =
    memoria.getFloat(
      "gravidade_y",
      0
    );

  gravidadeZ =
    memoria.getFloat(
      "gravidade_z",
      0
    );

  inclinacaoInicialX =
    memoria.getFloat(
      "inicial_x",
      0
    );

  inclinacaoInicialY =
    memoria.getFloat(
      "inicial_y",
      0
    );

  memoria.end();

  Serial.println("Calibracao carregada.");

  Serial.print("Inclinacao inicial X: ");
  Serial.println(inclinacaoInicialX);

  Serial.print("Inclinacao inicial Y: ");
  Serial.println(inclinacaoInicialY);
}

void conectarWiFi() {

  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.print("Conectando ao Wi-Fi");

  WiFi.begin(
    NOME_WIFI,
    SENHA_WIFI
  );

  int tentativas = 0;

  while (
    WiFi.status() != WL_CONNECTED &&
    tentativas < 30
  ) {

    delay(500);

    Serial.print(".");

    tentativas++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("Wi-Fi conectado.");

    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

  } else {

    Serial.println(
      "Falha ao conectar ao Wi-Fi."
    );
  }
}

bool conectarMQTT() {

  if (mqtt.connected()) {
    return true;
  }

  // O ID do cliente precisa ser único no broker: usa o MAC.
  String idCliente = "liftech-" + WiFi.macAddress();

  if (mqtt.connect(idCliente.c_str(), MQTT_USUARIO, MQTT_SENHA)) {

    Serial.println("MQTT conectado.");

    return true;
  }

  Serial.print("Falha MQTT, estado: ");
  Serial.println(mqtt.state());

  return false;
}

// tipo: "telemetria" ou "evento". Tópico final: <prefixo><tipo>/<MAC>.
bool enviarJSON(
  const char* tipo,
  JsonDocument &documento
) {

  if (WiFi.status() != WL_CONNECTED) {

    conectarWiFi();
  }

  if (WiFi.status() != WL_CONNECTED || !conectarMQTT()) {
    return false;
  }

  String json;

  serializeJson(
    documento,
    json
  );

  String topico =
    String(PREFIXO_TOPICO) + tipo + "/" + WiFi.macAddress();

  if (mqtt.publish(topico.c_str(), json.c_str())) {
    return true;
  }

  Serial.print("Erro ao publicar em ");
  Serial.println(topico);

  return false;
}

void enviarTelemetria(
  float aceleracaoX,
  float aceleracaoY,
  float aceleracaoZ,
  float inclinacaoX,
  float inclinacaoY,
  float magnitude
) {

  JsonDocument documento;

  documento["tipo"] =
    "telemetria";

  documento["dispositivo"] =
    WiFi.macAddress();

  documento["tempo"] =
    millis();

  JsonObject movimento =
    documento["movimento"]
      .to<JsonObject>();

  movimento["aceleracao_x"] =
    aceleracaoX;

  movimento["aceleracao_y"] =
    aceleracaoY;

  movimento["aceleracao_z"] =
    aceleracaoZ;

  movimento["inclinacao_x"] =
    inclinacaoX;

  movimento["inclinacao_y"] =
    inclinacaoY;

  movimento["magnitude"] =
    magnitude;

  enviarJSON(
    "telemetria",
    documento
  );
}

void enviarEvento(
  const char* tipo,
  const char* gravidade,
  float aceleracaoX,
  float aceleracaoY,
  float aceleracaoZ,
  float inclinacaoX,
  float inclinacaoY,
  float magnitude
) {

  contadorEventos++;

  JsonDocument documento;

  documento["tipo"] =
    "evento";

  documento["dispositivo"] =
    WiFi.macAddress();

  documento["id_evento"] =
    contadorEventos;

  documento["tempo"] =
    millis();

  JsonObject evento =
    documento["evento"]
      .to<JsonObject>();

  evento["tipo"] =
    tipo;

  evento["gravidade"] =
    gravidade;

  JsonObject movimento =
    documento["movimento"]
      .to<JsonObject>();

  movimento["aceleracao_x"] =
    aceleracaoX;

  movimento["aceleracao_y"] =
    aceleracaoY;

  movimento["aceleracao_z"] =
    aceleracaoZ;

  movimento["inclinacao_x"] =
    inclinacaoX;

  movimento["inclinacao_y"] =
    inclinacaoY;

  movimento["magnitude"] =
    magnitude;

  bool enviado =
    enviarJSON(
      "evento",
      documento
    );

  if (enviado) {

    Serial.print(
      "EVENTO ENVIADO: "
    );

    Serial.println(tipo);
  }
}

void setup() {

  Serial.begin(115200);

  delay(1000);

  Wire.begin(
    PINO_SDA,
    PINO_SCL
  );

  // Configura ADXL345
  escreverRegistrador(
    0x31,
    0x0B
  );

  escreverRegistrador(
    0x2D,
    0x08
  );

  delay(100);

  Serial.println();
  Serial.println(
    "================================="
  );

  Serial.println(
    "MONITORAMENTO DE EMPILHADEIRA"
  );

  Serial.println(
    "ESP32 + ADXL345"
  );

  Serial.println(
    "================================="
  );

  conectarWiFi();

  // ponytail: TLS sem validar o certificado do broker; use clienteTLS.setCACert(...) para validar.
  clienteTLS.setInsecure();

  mqtt.setServer(MQTT_HOST, MQTT_PORTA);

  // O evento passa dos 256 bytes padrão do PubSubClient.
  mqtt.setBufferSize(512);

  conectarMQTT();

  carregarCalibracao();

  Serial.println();
  Serial.println(
    "Digite C no Serial Monitor para recalibrar."
  );
}

void loop() {

  unsigned long agora =
    millis();

  mqtt.loop();

  if (Serial.available()) {

    char comando =
      Serial.read();

    if (
      comando == 'c' ||
      comando == 'C'
    ) {

      calibrarSensor();
    }
  }

  if (
    agora - ultimaLeitura <
    INTERVALO_LEITURA
  ) {

    return;
  }

  ultimaLeitura = agora;

  int16_t valorX;
  int16_t valorY;
  int16_t valorZ;

  if (
    !lerAceleracao(
      valorX,
      valorY,
      valorZ
    )
  ) {

    return;
  }

  float aceleracaoX =
    valorX * 0.0039;

  float aceleracaoY =
    valorY * 0.0039;

  float aceleracaoZ =
    valorZ * 0.0039;

  aceleracaoXFiltrada =
    aplicarFiltro(
      aceleracaoX,
      aceleracaoXFiltrada
    );

  aceleracaoYFiltrada =
    aplicarFiltro(
      aceleracaoY,
      aceleracaoYFiltrada
    );

  aceleracaoZFiltrada =
    aplicarFiltro(
      aceleracaoZ,
      aceleracaoZFiltrada
    );

  float aceleracaoMovimentoX =
    aceleracaoXFiltrada -
    gravidadeX;

  float aceleracaoMovimentoY =
    aceleracaoYFiltrada -
    gravidadeY;

  float aceleracaoMovimentoZ =
    aceleracaoZFiltrada -
    gravidadeZ;

  float magnitude =
    sqrt(
      aceleracaoMovimentoX *
      aceleracaoMovimentoX +

      aceleracaoMovimentoY *
      aceleracaoMovimentoY +

      aceleracaoMovimentoZ *
      aceleracaoMovimentoZ
    );

  float inclinacaoAtualX =
    calcularInclinacaoX(
      aceleracaoXFiltrada,
      aceleracaoYFiltrada,
      aceleracaoZFiltrada
    );

  float inclinacaoAtualY =
    calcularInclinacaoY(
      aceleracaoXFiltrada,
      aceleracaoYFiltrada,
      aceleracaoZFiltrada
    );

  float inclinacaoX =
    inclinacaoAtualX -
    inclinacaoInicialX;

  float inclinacaoY =
    inclinacaoAtualY -
    inclinacaoInicialY;

  if (
    magnitude >= LIMITE_COLISAO &&
    podeGerarEvento(
      ultimoEventoColisao
    )
  ) {

    ultimoEventoColisao =
      agora;

    enviarEvento(
      "colisao",
      "critica",
      aceleracaoMovimentoX,
      aceleracaoMovimentoY,
      aceleracaoMovimentoZ,
      inclinacaoX,
      inclinacaoY,
      magnitude
    );
  }

  else if (
    aceleracaoMovimentoX <=
    LIMITE_FRENAGEM_BRUSCA &&

    podeGerarEvento(
      ultimoEventoFrenagem
    )
  ) {

    ultimoEventoFrenagem =
      agora;

    enviarEvento(
      "frenagem_brusca",
      "alta",
      aceleracaoMovimentoX,
      aceleracaoMovimentoY,
      aceleracaoMovimentoZ,
      inclinacaoX,
      inclinacaoY,
      magnitude
    );
  }

  else if (
    aceleracaoMovimentoX >=
    LIMITE_ACELERACAO_BRUSCA &&

    podeGerarEvento(
      ultimoEventoAceleracao
    )
  ) {

    ultimoEventoAceleracao =
      agora;

    enviarEvento(
      "aceleracao_brusca",
      "alta",
      aceleracaoMovimentoX,
      aceleracaoMovimentoY,
      aceleracaoMovimentoZ,
      inclinacaoX,
      inclinacaoY,
      magnitude
    );
  }

  else if (
    fabs(aceleracaoMovimentoY) >=
    LIMITE_CURVA_BRUSCA &&

    podeGerarEvento(
      ultimoEventoCurva
    )
  ) {

    ultimoEventoCurva =
      agora;

    enviarEvento(
      "curva_brusca",
      "media",
      aceleracaoMovimentoX,
      aceleracaoMovimentoY,
      aceleracaoMovimentoZ,
      inclinacaoX,
      inclinacaoY,
      magnitude
    );
  }

  else if (
    (
      fabs(inclinacaoX) >=
      LIMITE_INCLINACAO ||

      fabs(inclinacaoY) >=
      LIMITE_INCLINACAO
    )

    &&

    podeGerarEvento(
      ultimoEventoInclinacao
    )
  ) {

    ultimoEventoInclinacao =
      agora;

    enviarEvento(
      "inclinacao_excessiva",
      "alta",
      aceleracaoMovimentoX,
      aceleracaoMovimentoY,
      aceleracaoMovimentoZ,
      inclinacaoX,
      inclinacaoY,
      magnitude
    );
  }

  if (
    agora - ultimaTelemetria >=
    INTERVALO_TELEMETRIA
  ) {

    ultimaTelemetria =
      agora;

    enviarTelemetria(
      aceleracaoMovimentoX,
      aceleracaoMovimentoY,
      aceleracaoMovimentoZ,
      inclinacaoX,
      inclinacaoY,
      magnitude
    );
  }
}
