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
- `empresaId` (ObjectId, obrigatório): Referência para a `Company` do usuário.
- `escopo` (String): `empresa` (enxerga todas as filiais da empresa) ou `filiais` (só as de `filiaisIds`). Padrão `filiais`.
- `filiaisIds` (ObjectId[]): Filiais que o usuário enxerga quando o `escopo` é `filiais`. Lista vazia não enxerga nenhuma filial.

O `role` diz o que o usuário vê; o `escopo` diz onde ele atua. São eixos independentes.

### 2. Operator (`operator.ts`)
Motorista ou piloto das empilhadeiras.
- `nome` (String): Nome do operador.
- `filialId` (ObjectId, obrigatório): Referência para a `Branch` do operador.

### 3. Device (`device.ts`)
Equipamento físico acoplado a uma empilhadeira para captar telemetria.
- `enderecoMac` (String): Endereço físico único de rede.
- `status` (String): Status atual do hardware.
- `filialId` (ObjectId, obrigatório): Referência para a `Branch` do dispositivo.

### 4. Telemetry (`telemetry.ts`)
Leituras constantes de dados gerados pelos dispositivos.
- `dataDados` (Date): Timestamp da leitura.
- `dispositivoId` (ObjectId): Referência para o `Device` (relação N:1).

### 5. Forklift (`forklift.ts`)
Empilhadeira física e o status de seu uso.
- `identificacao` (String): Código ou frota.
- `dispositivoConectadoId` (ObjectId): Qual `Device` rastreia a empilhadeira.
- `operadorConectadoId` (ObjectId): Qual `Operator` pilota a máquina.
- `filialId` (ObjectId, obrigatório): Referência para a `Branch` da empilhadeira.

### 6. Incident (`incident.ts`)
Registro de anomalias, como batidas ou paradas bruscas.
- `dataIncidente` (Date): Data e hora da ocorrência.
- `forcaImpacto` (Number): Impacto lido pelo sensor.
- `status` (String): Status de tratamento do incidente.
- `empilhadeiraId` (ObjectId): Referência da `Forklift` envolvida.
- `operadorId` (ObjectId): Referência do `Operator` envolvido.
- `filialId` (ObjectId, obrigatório): Referência para a `Branch` do incidente.

### 7. Company (`company.ts`)
Empresa cliente. Todo usuário e toda filial pertencem a uma.
- `nome` (String, obrigatório): Nome da empresa. Único.

### 8. Branch (`branch.ts`)
Filial de uma empresa. A matriz é uma filial normal com `matriz: true`.
- `nome` (String, obrigatório): Nome da filial. Único dentro da empresa.
- `empresaId` (ObjectId, obrigatório): Referência para a `Company`.
- `matriz` (Boolean): `true` para a matriz da empresa. Padrão `false`. Cada empresa tem no máximo uma matriz (índice único parcial); a matriz não pode ser excluída.

Os recursos (`Forklift`, `Device`, `Operator`, `Incident`) guardam só o `filialId`; a empresa de um recurso vem da sua filial. A `Telemetry` é isolada pelo seu `Device`.

## Migração para filiais
O banco anterior às filiais não tem `empresaId` nos usuários nem `filialId` nos recursos. O dono roda `yarn migrate:branches` (em `Backend`): o script cria a empresa padrão e a matriz, define nos admins `escopo: empresa`, nos demais usuários `escopo: filiais` com a matriz, e põe todos os recursos sem filial na matriz. Só documentos sem o campo são alterados, então rodar de novo não muda nada. O `yarn seed:data` usa a mesma empresa e matriz.
