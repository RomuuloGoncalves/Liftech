# Modelagem de Dados - Liftech

Entidades e mapeamento do banco de dados (MongoDB/Mongoose) do projeto Liftech.

## Padrões Adotados
- **Arquivos e Classes**: Nomes no singular (ex: `device.ts`, `Device`).
- **Atributos e Propriedades**: Propriedades declaradas em camelCase (ex: `dataIncidente`, `enderecoMac`).
- **Chaves Estrangeiras**: Campos que referenciam ObjectIds de outras coleções possuem o sufixo `Id` (ex: `dispositivoId`, `operadorId`).

## Diagrama de Relacionamento
Veja o diagrama de comunicação das entidades:
![Diagrama de Documentos](./diagramas/diagrama_de_relacionamento_de_documentos.jpg)
*(Nota: as entidades no diagrama original sofreram padronizações de nomenclatura documentadas abaixo)*

## Entidades e Schemas

### 1. User (`user.ts`)
Usuário do sistema, como um Gestor ou Administrador que acessa a plataforma web.
- `nome` (String): Nome completo.
- `role` (String): Papel de acesso ou cargo no sistema (ex: "Admin", "Supervisor").

### 2. Operator (`operator.ts`)
Motorista ou piloto das empilhadeiras.
- `nome` (String): Nome do operador.

### 3. Device (`device.ts`)
Equipamento físico acoplado a uma empilhadeira para captar telemetria.
- `enderecoMac` (String): Endereço físico único de rede.
- `status` (String): Status atual do hardware.

### 4. Telemetry (`telemetry.ts`)
Leituras constantes de dados gerados pelos dispositivos.
- `dataDados` (Date): Timestamp da leitura.
- `dispositivoId` (ObjectId): Referência para o `Device` (relação N:1).

### 5. Forklift (`forklift.ts`)
Empilhadeira física e o status de seu uso.
- `identificacao` (String): Código ou frota.
- `dispositivoConectadoId` (ObjectId): Qual `Device` rastreia a empilhadeira.
- `operadorConectadoId` (ObjectId): Qual `Operator` pilota a máquina.

### 6. Incident (`incident.ts`)
Registro de anomalias, como batidas ou paradas bruscas.
- `dataIncidente` (Date): Data e hora da ocorrência.
- `forcaImpacto` (Number): Impacto lido pelo sensor.
- `status` (String): Status de tratamento do incidente.
- `empilhadeiraId` (ObjectId): Referência da `Forklift` envolvida.
- `operadorId` (ObjectId): Referência do `Operator` envolvido.
