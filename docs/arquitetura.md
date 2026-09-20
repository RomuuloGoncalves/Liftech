# Arquitetura e Decisões Técnicas - Liftech

Decisões de arquitetura e ferramentas do projeto Liftech.

## 1. Estrutura de Monorepo
Escolhemos a estrutura de Monorepo para manter o `Frontend` e o `Backend` no mesmo repositório. Isso facilita o compartilhamento de tipos e a padronização do código. O pacote `concurrently` gerencia o ambiente de desenvolvimento, permitindo que o comando `yarn dev` inicie ambos os servidores juntos.

## 2. Arquitetura do Backend
O Backend usa uma arquitetura baseada em módulos, inspirada em Domain-Driven Design (DDD). Arquivos são agrupados por funcionalidade em vez de tipo. Isso garante maior coesão e facilita a manutenção e uma futura separação em microsserviços.

### Estrutura de Pastas do Backend (`Backend/src/`)
* **core/**: Elementos compartilhados da aplicação, como classes abstratas e interfaces globais.
* **middlewares/**: Interceptadores de rotas para autenticação, autorização e tratamento de erros.
* **feature/**: A base do sistema. Cada pasta representa uma funcionalidade isolada (ex: `user`). Responsabilidades são divididas em:
  * **Controller**: Recebe as requisições HTTP.
  * **Service**: Contém as regras de negócio.
  * **Repository**: Comunica-se exclusivamente com o banco de dados.
* **models/**: Classes com regras de domínio.
* **schemas/**: Mapeamento do banco de dados (MongoDB/Mongoose). Veja a [Modelagem de Dados](./modelagem_de_dados.md) para detalhes.
* **routes/**: Definições de URLs da aplicação.
* **config/**: Configurações de ambiente e banco de dados.
* **utils/**: Funções genéricas e utilitárias.

## 3. Ferramentas e Decisões Técnicas

### Motor TypeScript no Backend (`tsx`)
O Node.js 24 causou conflitos iniciais com o `ts-node-dev`. O Node exige extensões `.js` em módulos ES, mas o TypeScript restringe importações de `.ts`. A solução foi adotar o `tsx` (TypeScript eXecute), que traduz os imports automaticamente e resolve o problema sem exigir a extensão no código.