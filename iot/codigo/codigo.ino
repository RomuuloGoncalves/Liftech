#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <MQTT.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <ArduinoOTA.h>
#include <esp_ota_ops.h>
#include <math.h>
#include <time.h>

#include "secrets.h"

// ==========================================
// LIFTECH - MONITORAMENTO DE EMPILHADEIRAS
// ESP32 + ADXL345 + PORTAL WI-FI + MQTT/TLS + OTA
// ==========================================

#define FW_VERSAO "1.0.0"

// ---------- IDENTIFICAÇÃO ----------
// Rótulo amigável para o portal e SSID do AP; o backend identifica a placa pelo MAC.
#define ID_DISPOSITIVO "EMP001"

// ---------- SENSOR ADXL345 ----------
#define ADXL_ADDR 0x53
#define SDA_PIN 21
#define SCL_PIN 22

// ---------- ACCESS POINT ----------
const char* AP_SSID = "Liftech-" ID_DISPOSITIVO;

WebServer server(80);
Preferences preferences;

// ---------- MQTT / TLS / NTP ----------
// Certificado raiz ISRG Root X1 (Let's Encrypt / CloudAMQP)
const char* CA_CLOUDAMQP =
  "-----BEGIN CERTIFICATE-----\n"
  "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\n"
  "-----END CERTIFICATE-----\n";

#define INTERVALO_RECONEXAO_WIFI 10000
#define INTERVALO_RECONEXAO_MQTT 5000
#define TAMANHO_BUFFER_MQTT 768
#define EPOCH_MINIMO_VALIDO 1700000000L
#define TEMPO_LIMITE_VALIDACAO_OTA_MS 90000UL

WiFiClientSecure clienteTLS;
MQTTClient mqtt(TAMANHO_BUFFER_MQTT);

String macDispositivo = "";
String mqttClientId = "";
String topicoTelemetria = "";
String topicoEvento = "";

// ---------- WI-FI ----------
String wifiSSID = "";
String wifiPassword = "";

bool wifiConnected = false;
unsigned long ultimaTentativaWiFi = 0;
unsigned long ultimaTentativaMqtt = 0;
bool wifiConectadoAntes = false;
bool ntpIniciado = false;
bool ntpSincronizadoAntes = false;
bool mqttConectadoAntes = false;

// ---------- TEMPORIZAÇÃO ----------
unsigned long ultimaLeitura = 0;
unsigned long ultimaTelemetria = 0;
unsigned long ultimoEvento = 0;

const unsigned long INTERVALO_LEITURA = 10;
const unsigned long INTERVALO_TELEMETRIA = 5000;
const unsigned long BLOQUEIO_EVENTO = 3000;

unsigned long contadorEventos = 0;

// ---------- CALIBRAÇÃO ----------
float offsetX = 0;
float offsetY = 0;
float offsetZ = 0;

bool calibrado = false;

// ---------- FILTRO ----------
float filtroX = 0;
float filtroY = 0;
float filtroZ = 0;

const float ALPHA = 0.20;

// ---------- LIMITES ----------
const float LIMITE_ACELERACAO = 1.50;
const float LIMITE_FRENAGEM = -1.50;
const float LIMITE_COLISAO = 2.50;
const float LIMITE_CURVA = 1.50;
const float LIMITE_INCLINACAO = 15.0;

// ---------- OTA ----------
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

// ==========================================
// COMUNICAÇÃO COM ADXL345
// ==========================================

void escreverRegistrador(byte reg, byte valor) {
  Wire.beginTransmission(ADXL_ADDR);
  Wire.write(reg);
  Wire.write(valor);
  Wire.endTransmission();
}

bool iniciarSensor() {
  Wire.beginTransmission(ADXL_ADDR);
  Wire.write(0x00);

  if (Wire.endTransmission() != 0) {
    Serial.println("ADXL345 nao encontrado!");
    return false;
  }

  escreverRegistrador(0x2D, 0x08);
  escreverRegistrador(0x31, 0x0B);
  escreverRegistrador(0x2C, 0x0A);

  Serial.println("ADXL345 iniciado!");
  return true;
}

bool lerSensor(float &x, float &y, float &z) {
  Wire.beginTransmission(ADXL_ADDR);
  Wire.write(0x32);

  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  if (Wire.requestFrom(ADXL_ADDR, 6) != 6) {
    return false;
  }

  int16_t rawX = Wire.read() | (Wire.read() << 8);
  int16_t rawY = Wire.read() | (Wire.read() << 8);
  int16_t rawZ = Wire.read() | (Wire.read() << 8);

  // ADXL345: escala aproximada em m/s²
  x = rawX * 0.0039 * 9.80665;
  y = rawY * 0.0039 * 9.80665;
  z = rawZ * 0.0039 * 9.80665;

  return true;
}

// ==========================================
// PREFERENCES
// ==========================================

void carregarWiFiSalvo() {
  if (!preferences.begin("liftech", true)) {
    calibrado = false;
    return;
  }

  wifiSSID = preferences.getString("ssid", "");
  wifiPassword = preferences.getString("password", "");

  offsetX = preferences.getFloat("offsetX", 0);
  offsetY = preferences.getFloat("offsetY", 0);
  offsetZ = preferences.getFloat("offsetZ", 0);

  calibrado = preferences.getBool("calibrado", false);

  preferences.end();
}

void salvarWiFi(String ssid, String password) {
  preferences.begin("liftech", false);

  preferences.putString("ssid", ssid);
  preferences.putString("password", password);

  preferences.end();

  wifiSSID = ssid;
  wifiPassword = password;
}

void salvarCalibracao() {
  preferences.begin("liftech", false);

  preferences.putFloat("offsetX", offsetX);
  preferences.putFloat("offsetY", offsetY);
  preferences.putFloat("offsetZ", offsetZ);

  preferences.putBool("calibrado", true);

  preferences.end();

  calibrado = true;
}

// ==========================================
// CALIBRAÇÃO
// ==========================================

void calibrarSensor() {
  Serial.println("Iniciando calibracao...");

  const int AMOSTRAS = 300;

  float somaX = 0;
  float somaY = 0;
  float somaZ = 0;
  int amostrasValidas = 0;

  for (int i = 0; i < AMOSTRAS; i++) {
    float x, y, z;

    if (lerSensor(x, y, z)) {
      somaX += x;
      somaY += y;
      somaZ += z;
      amostrasValidas++;
    }

    delay(4);
  }

  if (amostrasValidas == 0) {
    Serial.println("ERRO: nenhuma amostra obtida na calibracao.");
    return;
  }

  offsetX = somaX / amostrasValidas;
  offsetY = somaY / amostrasValidas;
  offsetZ = somaZ / amostrasValidas;

  filtroX = 0;
  filtroY = 0;
  filtroZ = 0;

  salvarCalibracao();

  Serial.println("Calibracao concluida!");
}

// ==========================================
// FILTRO E CÁLCULOS
// ==========================================

void aplicarFiltro(float x, float y, float z) {
  filtroX = ALPHA * x + (1 - ALPHA) * filtroX;
  filtroY = ALPHA * y + (1 - ALPHA) * filtroY;
  filtroZ = ALPHA * z + (1 - ALPHA) * filtroZ;
}

float calcularMagnitude() {
  return sqrt(
    filtroX * filtroX +
    filtroY * filtroY +
    filtroZ * filtroZ
  );
}

float calcularInclinacaoX() {
  return atan2(
    filtroX,
    sqrt(filtroY * filtroY + filtroZ * filtroZ)
  ) * 180.0 / PI;
}

float calcularInclinacaoY() {
  return atan2(
    filtroY,
    sqrt(filtroX * filtroX + filtroZ * filtroZ)
  ) * 180.0 / PI;
}

// ==========================================
// OTA E ROLLBACK (90 s)
// ==========================================

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

  String mac = macDispositivo;
  if (mac.length() == 0) {
    mac = WiFi.macAddress();
  }
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

// ==========================================
// ENVIO MQTT / TLS
// ==========================================

void inicializarIdentidadeRede() {
  macDispositivo = WiFi.macAddress();

  String macLimpo = macDispositivo;
  macLimpo.replace(":", "");

  mqttClientId = "liftech-" + macLimpo;
  topicoTelemetria = String(MQTT_PREFIXO) + "telemetria/" + macDispositivo;
  topicoEvento = String(MQTT_PREFIXO) + "evento/" + macDispositivo;
}

bool publicarMQTT(const String &topico, JsonDocument &doc, int qos) {
  if (WiFi.status() != WL_CONNECTED || !mqtt.connected()) {
    return false;
  }

  String json;
  serializeJson(doc, json);

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

void preencherMovimento(JsonObject movimento, float inclX, float inclY, float mag) {
  movimento["aceleracao_x"] = filtroX;
  movimento["aceleracao_y"] = filtroY;
  movimento["aceleracao_z"] = filtroZ;
  movimento["inclinacao_x"] = inclX;
  movimento["inclinacao_y"] = inclY;
  movimento["magnitude"] = mag;
}

// ==========================================
// TELEMETRIA
// ==========================================

void enviarTelemetria() {
  float inclX = calcularInclinacaoX();
  float inclY = calcularInclinacaoY();
  float mag = calcularMagnitude();

  JsonDocument doc;

  doc["tipo"] = "telemetria";
  doc["dispositivo"] = macDispositivo;
  doc["tempo"] = millis();

  JsonObject movimento = doc["movimento"].to<JsonObject>();
  preencherMovimento(movimento, inclX, inclY, mag);

  bool enviado = publicarMQTT(topicoTelemetria, doc, 0);

  Serial.print("[Telemetria] acc=(");
  Serial.print(filtroX, 2);
  Serial.print(", ");
  Serial.print(filtroY, 2);
  Serial.print(", ");
  Serial.print(filtroZ, 2);
  Serial.print(") inc=(");
  Serial.print(inclX, 1);
  Serial.print(", ");
  Serial.print(inclY, 1);
  Serial.print(") mag=");
  Serial.print(mag, 2);
  Serial.println(enviado ? " [MQTT OK]" : " [offline]");
}

// ==========================================
// DETECÇÃO DE EVENTOS
// ==========================================

void registrarEvento(String tipo, float valor, String gravidade) {
  if (millis() - ultimoEvento < BLOQUEIO_EVENTO) {
    return;
  }

  contadorEventos++;

  float inclX = calcularInclinacaoX();
  float inclY = calcularInclinacaoY();
  float mag = calcularMagnitude();

  JsonDocument doc;

  doc["tipo"] = "evento";
  doc["dispositivo"] = macDispositivo;
  doc["id_evento"] = contadorEventos;
  doc["tempo"] = millis();

  JsonObject evento = doc["evento"].to<JsonObject>();
  evento["tipo"] = tipo;
  evento["gravidade"] = gravidade;

  JsonObject movimento = doc["movimento"].to<JsonObject>();
  preencherMovimento(movimento, inclX, inclY, mag);

  bool enviado = publicarMQTT(topicoEvento, doc, 1);

  ultimoEvento = millis();

  Serial.print(enviado ? "EVENTO ENVIADO: " : "EVENTO NAO ENVIADO (offline): ");
  Serial.print(tipo);
  Serial.print(" (");
  Serial.print(valor, 2);
  Serial.println(")");
}

void detectarEventos() {
  float magnitude = calcularMagnitude();

  if (magnitude >= LIMITE_COLISAO) {
    registrarEvento("colisao", magnitude, "critica");
    return;
  }

  if (filtroX >= LIMITE_ACELERACAO) {
    registrarEvento("aceleracao_brusca", filtroX, "media");
    return;
  }

  if (filtroX <= LIMITE_FRENAGEM) {
    registrarEvento("frenagem_brusca", filtroX, "alta");
    return;
  }

  if (fabs(filtroY) >= LIMITE_CURVA) {
    registrarEvento("curva_brusca", filtroY, "media");
    return;
  }

  float inclinacao = calcularInclinacaoX();

  if (fabs(inclinacao) >= LIMITE_INCLINACAO) {
    registrarEvento("inclinacao_excessiva", inclinacao, "alta");
  }
}

// ==========================================
// PORTAL WEB
// ==========================================

String paginaHTML() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Liftech - Configuração</title>

<style>
body {
  background:#101820;
  color:white;
  font-family:Arial;
  padding:20px;
  max-width:500px;
  margin:auto;
}
.card {
  background:#1d2b36;
  padding:20px;
  border-radius:12px;
  margin-bottom:15px;
}
input,select,button {
  width:100%;
  padding:12px;
  margin:8px 0;
  box-sizing:border-box;
  border-radius:6px;
  border:0;
}
button {
  background:#00a878;
  color:white;
  font-weight:bold;
}
h1 {color:#00c896}
</style>
</head>

<body>

<h1>LIFTECH</h1>
<p>Monitoramento Operacional</p>

<div class="card">
<h3>Configuração Wi-Fi</h3>

<button onclick="buscarRedes()">Buscar redes disponíveis</button>

<form action="/salvar" method="POST">

<select name="ssid" id="redes" required>
<option value="">Selecione uma rede</option>
</select>

<input type="password" name="password"
placeholder="Senha da rede">

<button type="submit">Salvar e conectar</button>
</form>
</div>

<div class="card">
<h3>Dispositivo</h3>
<p>Rótulo: )rawliteral" + String(ID_DISPOSITIVO) + R"rawliteral(</p>
<p>MAC: <strong id="mac">)rawliteral" + macDispositivo + R"rawliteral(</strong></p>
<p id="status">Consultando status...</p>
<button onclick="location.href='/calibrar'">
Calibrar sensor
</button>
</div>

<script>
async function buscarRedes() {
  const select = document.getElementById('redes');
  select.innerHTML = '<option>Buscando...</option>';

  try {
    const resposta = await fetch('/scan');
    const redes = await resposta.json();

    select.innerHTML = '<option value="">Selecione uma rede</option>';

    redes.forEach(rede => {
      const option = document.createElement('option');
      option.value = rede.ssid;
      option.textContent =
        rede.ssid + ' (' + rede.rssi + ' dBm) ' +
        (rede.segura ? '🔒' : 'Aberta');
      select.appendChild(option);
    });
  } catch(e) {
    select.innerHTML = '<option>Erro ao buscar redes</option>';
  }
}

async function atualizarStatus() {
  try {
    const resposta = await fetch('/status');
    const dados = await resposta.json();

    if (dados.mac) {
      document.getElementById('mac').textContent = dados.mac;
    }

    document.getElementById('status').textContent =
      dados.conectado
        ? 'Conectado: ' + dados.ssid + ' | IP: ' + dados.ip +
          ' | MQTT: ' + (dados.mqtt ? 'OK' : 'conectando')
        : 'Aguardando conexão Wi-Fi';
  } catch(e) {
    document.getElementById('status').textContent = 'Erro ao consultar status';
  }
}

atualizarStatus();
</script>

</body>
</html>
)rawliteral";

  return html;
}

void configurarRotas() {

  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", paginaHTML());
  });

  server.on("/scan", HTTP_GET, []() {

    int quantidade = WiFi.scanNetworks();

    JsonDocument doc;
    JsonArray redes = doc.to<JsonArray>();

    if (quantidade > 0) {
      for (int i = 0; i < quantidade; i++) {
        JsonObject rede = redes.add<JsonObject>();

        rede["ssid"] = WiFi.SSID(i);
        rede["rssi"] = WiFi.RSSI(i);
        rede["segura"] = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;
      }
    }

    String json;
    serializeJson(doc, json);

    server.send(200, "application/json", json);

    WiFi.scanDelete();
  });

  server.on("/salvar", HTTP_POST, []() {

    String ssid = server.arg("ssid");
    String password = server.arg("password");

    if (ssid.length() == 0) {
      server.send(400, "text/plain", "SSID invalido");
      return;
    }

    salvarWiFi(ssid, password);

    server.send(200, "text/html",
      "<h2>Wi-Fi salvo!</h2>"
      "<p>O dispositivo vai reiniciar para conectar.</p>");

    delay(1500);
    ESP.restart();
  });

  server.on("/status", HTTP_GET, []() {

    JsonDocument doc;

    doc["conectado"] = WiFi.status() == WL_CONNECTED;
    doc["ssid"] = WiFi.SSID();
    doc["ip"] = WiFi.localIP().toString();
    doc["mac"] = macDispositivo;
    doc["rotulo"] = ID_DISPOSITIVO;
    doc["mqtt"] = mqtt.connected();
    doc["calibrado"] = calibrado;
    doc["versao"] = FW_VERSAO;

    String json;
    serializeJson(doc, json);

    server.send(200, "application/json", json);
  });

  server.on("/calibrar", HTTP_GET, []() {

    calibrarSensor();

    server.send(200, "text/html",
      "<h2>Calibracao concluida!</h2>"
      "<a href='/'>Voltar</a>");
  });

  server.begin();
}

// ==========================================
// WI-FI AP + STA E RECONEXÃO NÃO BLOQUEANTE
// ==========================================

void iniciarWiFi() {

  WiFi.mode(WIFI_AP_STA);
  WiFi.setAutoReconnect(true);

  WiFi.softAP(AP_SSID, AP_SENHA);

  inicializarIdentidadeRede();

  clienteTLS.setCACert(CA_CLOUDAMQP);
  clienteTLS.setHandshakeTimeout(5);

  mqtt.begin(MQTT_HOST, MQTT_PORTA, clienteTLS);
  mqtt.setTimeout(1000);

  Serial.println("Access Point iniciado!");
  Serial.print("SSID: ");
  Serial.println(AP_SSID);

  Serial.print("IP do portal: ");
  Serial.println(WiFi.softAPIP());

  Serial.print("Dispositivo MAC: ");
  Serial.println(macDispositivo);
  Serial.print("Topico telemetria: ");
  Serial.println(topicoTelemetria);
  Serial.print("Topico eventos: ");
  Serial.println(topicoEvento);

  if (wifiSSID.length() > 0) {

    WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

    Serial.println("Conectando ao Wi-Fi salvo...");

    unsigned long inicio = millis();

    while (WiFi.status() != WL_CONNECTED &&
           millis() - inicio < 15000) {
      delay(500);
      Serial.print(".");
    }

    wifiConnected = WiFi.status() == WL_CONNECTED;
    ultimaTentativaWiFi = millis();
  }

  if (wifiConnected) {
    wifiConectadoAntes = true;
    Serial.println("\nWi-Fi conectado!");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nAguardando configuracao ou reconexao Wi-Fi.");
  }
}

void gerenciarConexao(unsigned long agora) {

  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;

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

    if (wifiSSID.length() > 0 &&
        agora - ultimaTentativaWiFi >= INTERVALO_RECONEXAO_WIFI) {
      ultimaTentativaWiFi = agora;
      Serial.println("Tentando reconectar ao Wi-Fi...");
      WiFi.disconnect(false);
      WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
    }

    return;
  }

  wifiConnected = true;

  if (!wifiConectadoAntes) {
    wifiConectadoAntes = true;
    Serial.println("Wi-Fi conectado!");
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

// ==========================================
// SETUP
// ==========================================

void setup() {

  Serial.begin(115200);

  Wire.begin(SDA_PIN, SCL_PIN);

  delay(500);

  Serial.println();
  Serial.println("=================================");
  Serial.println("LIFTECH - MONITORAMENTO");
  Serial.print("Versao: ");
  Serial.println(FW_VERSAO);
  Serial.println("=================================");

  if (!iniciarSensor()) {
    Serial.println("ERRO: Verifique o ADXL345.");
  }

  carregarWiFiSalvo();

  if (!calibrado) {
    Serial.println("Nenhuma calibracao no NVS. Iniciando autocalibracao...");
    calibrarSensor();
  }

  iniciarWiFi();

  iniciarOta();

  configurarRotas();

  Serial.println("LIFTECH INICIADA!");
  Serial.println("Acesse http://192.168.4.1");
  Serial.println("Digite C no Serial Monitor ou acesse /calibrar para recalibrar.");
}

// ==========================================
// LOOP
// ==========================================

void loop() {

  tratarOta();
  if (otaEmAndamento) {
    return;
  }

  server.handleClient();

  unsigned long agora = millis();

  gerenciarConexao(agora);

  if (Serial.available()) {
    char comando = Serial.read();
    if (comando == 'c' || comando == 'C') {
      calibrarSensor();
    }
  }

  if (agora - ultimaLeitura < INTERVALO_LEITURA) {
    return;
  }

  ultimaLeitura = agora;

  float x, y, z;

  if (lerSensor(x, y, z)) {

    if (calibrado) {
      x -= offsetX;
      y -= offsetY;
      z -= offsetZ;
    }

    aplicarFiltro(x, y, z);

    detectarEventos();
  }

  if (agora - ultimaTelemetria >= INTERVALO_TELEMETRIA) {

    ultimaTelemetria = agora;

    enviarTelemetria();
  }
}
