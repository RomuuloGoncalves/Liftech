#ifndef SECRETS_H
#define SECRETS_H

// Copie este arquivo para secrets.h e preencha com as credenciais reais.
// O arquivo secrets.h esta no .gitignore e nao deve ser versionado.
// As credenciais da rede Wi-Fi (STA) sao configuradas pelo portal Web e salvas no NVS.

// Identidade da instancia no sistema (o `yarn seed:placa` imprime estas linhas)
#define EMPILHADEIRA_ID "EMP001"
#define EMPILHADEIRA_NOME "EMP001"
#define DISPOSITIVO_NOME "ESP32-01"

// Access Point de configuracao (minimo 8 caracteres para WPA2)
#define AP_SENHA "SUBSTITUA_PELA_SENHA_AP"

// Broker MQTT (CloudAMQP sobre TLS na porta 8883)
// Usuario no CloudAMQP segue o formato "vhost:usuario".
#define MQTT_HOST "seu-host.lmq.cloudamqp.com"
#define MQTT_PORTA 8883
#define MQTT_USUARIO "vhost:usuario"
#define MQTT_SENHA "SENHA_MQTT"

// Prefixo dos topicos (deve bater com RABBITMQ_PREFIXO do backend; vazio = "")
#define MQTT_PREFIXO ""

// OTA (hash MD5 da senha de atualizacao e prefixo de URL permitida)
// Gere o hash com: echo -n "sua-senha" | md5sum
#define OTA_SENHA_MD5 "SUBSTITUA_PELO_HASH_MD5"
#define OTA_URL_BASE "https://exemplo.invalid/releases/"

#endif
