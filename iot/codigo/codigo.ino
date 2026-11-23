#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <MQTT.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <ArduinoOTA.h>
#include <esp_ota_ops.h>
#include <math.h>
#include <time.h>

#include "secrets.h"

#define FW_VERSAO "1.0.0"

#define ENDERECO_ADXL345 0x53

#define PINO_SDA 21
#define PINO_SCL 22

// Certificado raiz ISRG Root X1 (Let's Encrypt / CloudAMQP)
const char* CA_CLOUDAMQP =
  "-----BEGIN CERTIFICATE-----\n"
  "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\n"
  "-----END CERTIFICATE-----\n";

#define INTERVALO_RECONEXAO_WIFI 10000
#define INTERVALO_RECONEXAO_MQTT 5000
#define TAMANHO_BUFFER_MQTT 768
#define EPOCH_MINIMO_VALIDO 1700000000L

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
MQTTClient mqtt(TAMANHO_BUFFER_MQTT);

String macDispositivo = "";
String mqttClientId = "";
String topicoTelemetria = "";
String topicoEvento = "";

unsigned long ultimaTentativaWiFi = 0;
unsigned long ultimaTentativaMqtt = 0;
bool wifiConectadoAntes = false;
bool ntpIniciado = false;
bool ntpSincronizadoAntes = false;
bool mqttConectadoAntes = false;

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

bool carregarCalibracao() {

  if (!memoria.begin("calibracao", true)) {
    return false;
  }

  if (!memoria.isKey("gravidade_z")) {
    memoria.end();
    return false;
  }

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

  return true;
}

void inicializarIdentidadeRede() {

  macDispositivo = WiFi.macAddress();

  String macLimpo = macDispositivo;
  macLimpo.replace(":", "");

  mqttClientId = "liftech-" + macLimpo;
  topicoTelemetria = String(MQTT_PREFIXO) + "telemetria/" + macDispositivo;
  topicoEvento = String(MQTT_PREFIXO) + "evento/" + macDispositivo;
}

void iniciarRede() {

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  inicializarIdentidadeRede();

  clienteTLS.setCACert(CA_CLOUDAMQP);
  clienteTLS.setHandshakeTimeout(5);

  mqtt.begin(MQTT_HOST, MQTT_PORTA, clienteTLS);
  mqtt.setTimeout(1000);

  Serial.print("Dispositivo MAC: ");
  Serial.println(macDispositivo);
  Serial.print("Topico telemetria: ");
  Serial.println(topicoTelemetria);
  Serial.print("Topico eventos: ");
  Serial.println(topicoEvento);

  ultimaTentativaWiFi = millis();
  WiFi.begin(WIFI_SSID, WIFI_SENHA);

  Serial.println("Conectando ao Wi-Fi em segundo plano...");
}

void gerenciarConexao(unsigned long agora) {

  if (WiFi.status() != WL_CONNECTED) {

    if (wifiConectadoAntes) {
      wifiConectadoAntes = false;
      ntpIniciado = false;
      ntpSincronizadoAntes = false;

      if (mqttConectadoAntes || mqtt.connected()) {
        mqtt.disconnect();
        mqttConectadoAntes = false;
      }

      Serial.println("Wi-Fi desconectado.");
    }

    if (agora - ultimaTentativaWiFi >= INTERVALO_RECONEXAO_WIFI) {
      ultimaTentativaWiFi = agora;
      Serial.println("Tentando reconectar ao Wi-Fi...");
      WiFi.disconnect(false);
      WiFi.begin(WIFI_SSID, WIFI_SENHA);
    }

    return;
  }

  if (!wifiConectadoAntes) {
    wifiConectadoAntes = true;
    Serial.println("Wi-Fi conectado.");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  }

  if (!ntpIniciado) {
    ntpIniciado = true;
    configTime(0, 0, "pool.ntp.org", "a.st1.ntp.br", "time.nist.gov");
    Serial.println("Sincronizando horario via NTP...");
  }

  if (time(nullptr) < EPOCH_MINIMO_VALIDO) {
    return;
  }

  if (!ntpSincronizadoAntes) {
    ntpSincronizadoAntes = true;
    // Permite tentar a primeira conexao MQTT imediatamente apos o NTP sincronizar
    ultimaTentativaMqtt = agora - INTERVALO_RECONEXAO_MQTT;
    Serial.println("Horario NTP sincronizado.");
  }

  if (mqtt.connected()) {
    mqtt.loop();
    return;
  }

  if (mqttConectadoAntes) {
    mqttConectadoAntes = false;
    Serial.println("MQTT desconectado.");
  }

  if (agora - ultimaTentativaMqtt >= INTERVALO_RECONEXAO_MQTT) {
    ultimaTentativaMqtt = agora;

    Serial.print("Conectando ao broker MQTT...");

    if (mqtt.connect(mqttClientId.c_str(), MQTT_USUARIO, MQTT_SENHA)) {
      mqttConectadoAntes = true;
      Serial.println(" conectado.");
    } else {
      Serial.print(" falha (erro=");
      Serial.print(mqtt.lastError());
      Serial.println(").");
    }
  }
}

bool publicarMQTT(
  const String &topico,
  JsonDocument &documento,
  int qos
) {

  if (WiFi.status() != WL_CONNECTED || !mqtt.connected()) {
    return false;
  }

  String json;

  serializeJson(
    documento,
    json
  );

  bool enviado = mqtt.publish(
    topico.c_str(),
    json.c_str(),
    false,
    qos
  );

  if (enviado) {
    confirmarOtaValida();
  } else {
    Serial.print("Erro MQTT ao publicar em ");
    Serial.print(topico);
    Serial.print(" (erro=");
    Serial.print(mqtt.lastError());
    Serial.println(").");
  }

  return enviado;
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
    macDispositivo;

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

  bool enviado =
    publicarMQTT(
      topicoTelemetria,
      documento,
      0
    );

  Serial.print("[Telemetria] acc=(");
  Serial.print(aceleracaoX, 2);
  Serial.print(", ");
  Serial.print(aceleracaoY, 2);
  Serial.print(", ");
  Serial.print(aceleracaoZ, 2);
  Serial.print(") inc=(");
  Serial.print(inclinacaoX, 1);
  Serial.print(", ");
  Serial.print(inclinacaoY, 1);
  Serial.print(") mag=");
  Serial.print(magnitude, 2);
  Serial.println(enviado ? " [MQTT OK]" : " [offline]");
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
    macDispositivo;

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
    publicarMQTT(
      topicoEvento,
      documento,
      1
    );

  if (enviado) {

    Serial.print(
      "EVENTO ENVIADO: "
    );

    Serial.println(tipo);

  } else {

    Serial.print(
      "EVENTO NAO ENVIADO (offline): "
    );

    Serial.println(tipo);
  }
}

#define TEMPO_LIMITE_VALIDACAO_OTA_MS 90000UL

bool otaIniciada = false;
bool otaEmAndamento = false;
bool otaPendenteValidacao = false;
bool rollbackVerificadoNoBoot = false;
int otaUltimoMarcoProgresso = -1;
unsigned long inicioBootOtaMs = 0;
char otaHostname[32] = "";

// Sobrescreve o simbolo fraco C do core arduino-esp32 para adiar a validacao ate o primeiro publish OK.
extern "C" bool verifyRollbackLater() {
  return true;
}

bool otaPendenteNoNvs() {
  Preferences prefsOta;
  if (!prefsOta.begin("ota", true)) {
    return false;
  }
  bool pendente = prefsOta.getBool("pendente", false);
  prefsOta.end();
  return pendente;
}

void definirOtaPendenteNvs(bool pendente) {
  Preferences prefsOta;
  if (!prefsOta.begin("ota", false)) {
    return;
  }
  prefsOta.putBool("pendente", pendente);
  prefsOta.end();
}

void verificarEstadoRollbackNoBoot() {
  if (rollbackVerificadoNoBoot) {
    return;
  }
  rollbackVerificadoNoBoot = true;
  inicioBootOtaMs = millis();

  const esp_partition_t* particaoAtual = esp_ota_get_running_partition();
  esp_ota_img_states_t estadoOta = ESP_OTA_IMG_UNDEFINED;
  bool pendenteBootloader = false;

  if (particaoAtual != nullptr &&
      esp_ota_get_state_partition(particaoAtual, &estadoOta) == ESP_OK) {
    pendenteBootloader = (estadoOta == ESP_OTA_IMG_PENDING_VERIFY);
  }

  // Usa NVS como fallback caso o bootloader do core nao tenha CONFIG_APP_ROLLBACK_ENABLE.
  if (pendenteBootloader || otaPendenteNoNvs()) {
    otaPendenteValidacao = true;
    Serial.println("OTA: firmware aguardando confirmacao (janela de 90 s para rollback).");
  }
}

// Chamar apos Wi-Fi + MQTT conectados e o primeiro publish bem-sucedido (IOT-2).
void confirmarOtaValida() {
  if (!otaPendenteValidacao) {
    return;
  }

  esp_err_t err = esp_ota_mark_app_valid_cancel_rollback();
  definirOtaPendenteNvs(false);
  otaPendenteValidacao = false;

  if (err == ESP_OK) {
    Serial.println("OTA: firmware confirmado como valido.");
  } else {
    Serial.print("OTA: aviso ao confirmar firmware: ");
    Serial.println(esp_err_to_name(err));
  }
}

void iniciarOta() {
  verificarEstadoRollbackNoBoot();

  if (otaIniciada) {
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("OTA: aguardando Wi-Fi para iniciar.");
    return;
  }

  String mac = WiFi.macAddress();
  mac.replace(":", "");
  snprintf(otaHostname, sizeof(otaHostname), "liftech-%s", mac.c_str());

  ArduinoOTA.setHostname(otaHostname);
  ArduinoOTA.setPasswordHash(OTA_SENHA_MD5);

  ArduinoOTA.onStart([]() {
    otaEmAndamento = true;
    otaUltimoMarcoProgresso = -1;
    const char* tipo =
      (ArduinoOTA.getCommand() == U_FLASH) ? "firmware" : "filesystem";
    Serial.print("OTA: iniciando atualizacao de ");
    Serial.println(tipo);
  });

  ArduinoOTA.onProgress([](unsigned int progresso, unsigned int total) {
    if (total == 0) {
      return;
    }
    int percentual = (int)((progresso * 100UL) / total);
    int marco = percentual / 20;
    if (marco != otaUltimoMarcoProgresso) {
      otaUltimoMarcoProgresso = marco;
      Serial.print("OTA: progresso ");
      Serial.print(percentual);
      Serial.println("%");
    }
  });

  ArduinoOTA.onEnd([]() {
    otaEmAndamento = false;
    definirOtaPendenteNvs(true);
    Serial.println("OTA: atualizacao concluida. Reiniciando...");
  });

  ArduinoOTA.onError([](ota_error_t erro) {
    otaEmAndamento = false;
    Serial.print("OTA: erro [");
    Serial.print(erro);
    Serial.print("] ");
    if (erro == OTA_AUTH_ERROR) {
      Serial.println("Falha de autenticacao");
    } else if (erro == OTA_BEGIN_ERROR) {
      Serial.println("Falha ao iniciar gravacao");
    } else if (erro == OTA_CONNECT_ERROR) {
      Serial.println("Falha de conexao");
    } else if (erro == OTA_RECEIVE_ERROR) {
      Serial.println("Falha ao receber dados");
    } else if (erro == OTA_END_ERROR) {
      Serial.println("Falha ao finalizar gravacao");
    } else {
      Serial.println("Erro desconhecido");
    }
  });

  ArduinoOTA.begin();
  otaIniciada = true;

  Serial.print("OTA: pronto em ");
  Serial.print(otaHostname);
  Serial.println(".local");
}

void tratarOta() {
  // Verifica timeout de rollback antes do Wi-Fi para recuperar mesmo se a rede falhar.
  if (otaPendenteValidacao &&
      (millis() - inicioBootOtaMs >= TEMPO_LIMITE_VALIDACAO_OTA_MS)) {
    definirOtaPendenteNvs(false);
    otaPendenteValidacao = false;
    Serial.println("OTA: timeout de 90 s sem confirmacao. Executando rollback...");
    esp_err_t err = esp_ota_mark_app_invalid_rollback_and_reboot();
    Serial.print("OTA: falha ao executar rollback: ");
    Serial.println(esp_err_to_name(err));
  }

  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (!otaIniciada) {
    iniciarOta();
  }

  if (otaIniciada) {
    ArduinoOTA.handle();
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

  Serial.print("Versao: ");
  Serial.println(FW_VERSAO);

  Serial.println(
    "================================="
  );

  iniciarRede();

  iniciarOta();

  if (!carregarCalibracao()) {
    Serial.println(
      "Nenhuma calibracao no NVS. Iniciando autocalibracao..."
    );
    calibrarSensor();
  }

  Serial.println();
  Serial.println(
    "Digite C no Serial Monitor para recalibrar."
  );
}

void loop() {

  tratarOta();
  if (otaEmAndamento) {
    return;
  }

  unsigned long agora =
    millis();

  gerenciarConexao(agora);

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
