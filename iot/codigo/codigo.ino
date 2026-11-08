#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <math.h>

// ============================================================
// CONFIGURAÇÃO DO SENSOR
// ============================================================

#define ENDERECO_ADXL345 0x53

#define PINO_SDA 21
#define PINO_SCL 22

// ============================================================
// WI-FI
// ============================================================

// Preencha antes de gravar na placa. Não versionar a senha real.
const char* NOME_WIFI = "NOME_DA_REDE";
const char* SENHA_WIFI = "SENHA_DA_REDE";

// Troque pelo IP do computador que está rodando a API
const char* URL_API_TELEMETRIA =
  "http://192.168.1.103:3000/api/telemetry";

const char* URL_API_EVENTO =
  "http://192.168.1.103:3000/api/incidents";

// ============================================================
// DISPOSITIVO
// ============================================================

// O identificador do dispositivo e obtido via WiFi.macAddress()

// ============================================================
// TEMPOS
// ============================================================

#define INTERVALO_LEITURA 10
#define INTERVALO_TELEMETRIA 5000

#define TEMPO_BLOQUEIO_EVENTO 3000

// ============================================================
// LIMITES DOS EVENTOS
// ============================================================

// Valores iniciais.
// Depois vamos calibrar com dados reais da empilhadeira.

#define LIMITE_ACELERACAO_BRUSCA 1.50
#define LIMITE_FRENAGEM_BRUSCA -1.50
#define LIMITE_COLISAO 2.50
#define LIMITE_CURVA_BRUSCA 1.50
#define LIMITE_INCLINACAO 15.0

// ============================================================
// VARIÁVEIS
// ============================================================

unsigned long ultimaLeitura = 0;
unsigned long ultimaTelemetria = 0;

unsigned long ultimoEventoFrenagem = 0;
unsigned long ultimoEventoAceleracao = 0;
unsigned long ultimoEventoColisao = 0;
unsigned long ultimoEventoCurva = 0;
unsigned long ultimoEventoInclinacao = 0;

unsigned long contadorEventos = 0;

// ============================================================
// FILTRO
// ============================================================

float aceleracaoXFiltrada = 0;
float aceleracaoYFiltrada = 0;
float aceleracaoZFiltrada = 0;

const float FATOR_FILTRO = 0.20;

// ============================================================
// CALIBRAÇÃO
// ============================================================

// Gravidade medida na posição de instalação
float gravidadeX = 0;
float gravidadeY = 0;
float gravidadeZ = 0;

// Inclinação inicial
float inclinacaoInicialX = 0;
float inclinacaoInicialY = 0;

// ============================================================
// MEMÓRIA
// ============================================================

Preferences memoria;

// ============================================================
// REGISTRADOR
// ============================================================

void escreverRegistrador(byte registrador, byte valor) {

  Wire.beginTransmission(ENDERECO_ADXL345);

  Wire.write(registrador);
  Wire.write(valor);

  Wire.endTransmission();
}

// ============================================================
// LEITURA DO SENSOR
// ============================================================

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

// ============================================================
// FILTRO
// ============================================================

float aplicarFiltro(
  float atual,
  float anterior
) {

  return anterior +
         FATOR_FILTRO *
         (atual - anterior);
}

// ============================================================
// VERIFICA BLOQUEIO
// ============================================================

bool podeGerarEvento(
  unsigned long ultimoEvento
) {

  return millis() - ultimoEvento >
         TEMPO_BLOQUEIO_EVENTO;
}

// ============================================================
// CALCULA INCLINAÇÃO
// ============================================================

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

// ============================================================
// CALIBRAÇÃO
// ============================================================

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

// ============================================================
// CARREGA CALIBRAÇÃO
// ============================================================

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

// ============================================================
// WIFI
// ============================================================

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

// ============================================================
// ENVIA JSON PARA API
// ============================================================

bool enviarJSON(
  const char* endereco,
  JsonDocument &documento
) {

  if (WiFi.status() != WL_CONNECTED) {

    conectarWiFi();
  }

  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  String json;

  serializeJson(
    documento,
    json
  );

  HTTPClient http;

  http.begin(endereco);

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  int resposta =
    http.POST(json);

  http.end();

  if (resposta >= 200 &&
      resposta < 300) {

    return true;
  }

  Serial.print("Erro HTTP: ");
  Serial.println(resposta);

  return false;
}

// ============================================================
// ENVIA TELEMETRIA
// ============================================================

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
    URL_API_TELEMETRIA,
    documento
  );
}

// ============================================================
// ENVIA EVENTO
// ============================================================

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
      URL_API_EVENTO,
      documento
    );

  if (enviado) {

    Serial.print(
      "EVENTO ENVIADO: "
    );

    Serial.println(tipo);
  }
}

// ============================================================
// SETUP
// ============================================================

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

  carregarCalibracao();

  Serial.println();
  Serial.println(
    "Digite C no Serial Monitor para recalibrar."
  );
}

// ============================================================
// LOOP
// ============================================================

void loop() {

  unsigned long agora =
    millis();

  // ==========================================================
  // COMANDO DE CALIBRAÇÃO
  // ==========================================================

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

  // ==========================================================
  // LEITURA 100 Hz
  // ==========================================================

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


  // ==========================================================
  // CONVERSÃO
  // ==========================================================

  float aceleracaoX =
    valorX * 0.0039;

  float aceleracaoY =
    valorY * 0.0039;

  float aceleracaoZ =
    valorZ * 0.0039;


  // ==========================================================
  // FILTRO
  // ==========================================================

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


  // ==========================================================
  // ACELERAÇÃO DINÂMICA
  // ==========================================================

  float aceleracaoMovimentoX =
    aceleracaoXFiltrada -
    gravidadeX;

  float aceleracaoMovimentoY =
    aceleracaoYFiltrada -
    gravidadeY;

  float aceleracaoMovimentoZ =
    aceleracaoZFiltrada -
    gravidadeZ;


  // ==========================================================
  // MAGNITUDE DO MOVIMENTO
  // ==========================================================

  float magnitude =
    sqrt(
      aceleracaoMovimentoX *
      aceleracaoMovimentoX +

      aceleracaoMovimentoY *
      aceleracaoMovimentoY +

      aceleracaoMovimentoZ *
      aceleracaoMovimentoZ
    );


  // ==========================================================
  // INCLINAÇÃO ATUAL
  // ==========================================================

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


  // ==========================================================
  // INCLINAÇÃO RELATIVA À CALIBRAÇÃO
  // ==========================================================

  float inclinacaoX =
    inclinacaoAtualX -
    inclinacaoInicialX;

  float inclinacaoY =
    inclinacaoAtualY -
    inclinacaoInicialY;


  // ==========================================================
  // COLISÃO
  // ==========================================================

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


  // ==========================================================
  // FRENAGEM
  // ==========================================================

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


  // ==========================================================
  // ACELERAÇÃO
  // ==========================================================

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


  // ==========================================================
  // CURVA
  // ==========================================================

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


  // ==========================================================
  // INCLINAÇÃO
  // ==========================================================

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


  // ==========================================================
  // TELEMETRIA
  // ==========================================================

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
