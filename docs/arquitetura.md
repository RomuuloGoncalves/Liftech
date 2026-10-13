# Arquitetura e Decisões Técnicas - Liftech

Decisões de arquitetura e ferramentas do projeto Liftech.

## 1. Estrutura de Monorepo
Escolhemos a estrutura de Monorepo para manter o `Frontend` e o `Backend` no mesmo repositório. Isso facilita o compartilhamento de tipos e a padronização do código. O pacote `concurrently` gerencia o ambiente de desenvolvimento, permitindo que o comando `yarn dev` inicie ambos os servidores juntos.

O `package.json` da raiz só orquestra os dois projetos, não substitui os `package.json` de cada um. `yarn` na raiz instala as dependências da raiz e, pelo hook `postinstall`, roda `yarn install` dentro de `Backend/` e `Frontend/` também. `yarn test` na raiz usa o mesmo `concurrently` do `yarn dev` para rodar a suíte de cada projeto (`vitest run` nos dois casos) e reporta falha se qualquer um dos dois quebrar. No Backend, esse `yarn test` roda só `tests/unit`; os testes de `tests/integration` conectam ao banco e rodam à parte (`yarn test:integration` em `Backend/`).

## 2. Arquitetura do Backend
O Backend usa uma arquitetura baseada em módulos, inspirada em Domain-Driven Design (DDD). Arquivos são agrupados por funcionalidade em vez de tipo. Isso garante maior coesão e facilita a manutenção e uma futura separação em microsserviços.

### Estrutura de Pastas do Backend (`Backend/src/`)
* **config/**: Configurações de ambiente (`env.ts`) e conexão com o banco (`conn.ts`).
* **core/**: Classes base abstratas: `coreModel`, `RepositoryBase` (CRUD genérico sobre um modelo Mongoose) e `ServiceBase` (listar, obter, criar, atualizar e deletar em cima do repositório).
* **feature/**: A base do sistema. Cada pasta representa uma funcionalidade isolada (ex: `forklift`, `user`, `auth`) e traz o próprio Router, além de Controller, Service, Repository e `*Rules.ts` (validação do corpo da requisição) quando a feature precisa deles.
* **models/**: Classes com regras de domínio, que estendem `coreModel`.
* **schemas/**: Mapeamento do banco de dados (MongoDB/Mongoose). Veja a [Modelagem de Dados](./modelagem_de_dados.md) para detalhes.
* **scripts/**: Seeds de desenvolvimento (ver abaixo).
* **utils/**: Funções genéricas e utilitárias (logger, hash de senha, formato de resposta).

Não há pastas `middlewares/` nem `routes/`: as rotas ficam em cada feature e `server.ts` as monta sob `/api/...`.

### Camadas do Backend
O fluxo de uma requisição é Router -> Controller -> Service -> Repository (decisão AD-002 em `.specs/STATE.md`). O Controller valida o corpo com as regras da feature e responde com `respostaSucesso`/`respostaErro`; o Service aplica as regras de negócio (ex: `ForkliftService` recusa identificação repetida) e estende `ServiceBase`; o Repository estende `RepositoryBase` e é o único que fala com o Mongoose, convertendo documentos em modelos.

Nem toda feature segue a cadeia completa. `authService` (login e emissão do JWT) e `machineService` (lista as máquinas da Visão Geral juntando empilhadeira, dispositivo e operador) são funções que usam o schema direto, sem classe nem repositório. O `accessRequestController` também grava no schema direto.

### Seeds (`Backend/src/scripts/`)
* `seedAdmin.ts` (`yarn seed`, ou `yarn dev:seed` junto do servidor): cria o admin a partir de `SEED_ADMIN_EMAIL`, `SEED_ADMIN_SENHA` e `SEED_ADMIN_NOME`; se o email já existe, não faz nada.
* `seedData.ts` (`yarn seed:data`): chama o `seedAdmin` e popula operadores, dispositivos, empilhadeiras, telemetria, incidentes, colaboradores (senha em `SEED_COLABORADOR_SENHA`) e solicitações de acesso, com upsert pela chave natural, então pode rodar de novo sem duplicar. Os dados de exemplo vêm de `seedDataset.ts`, os mesmos do mock do Frontend.

Os seeds escrevem no banco configurado no `.env`: rode só contra um ambiente de desenvolvimento.

### Frontend e specs
A estrutura do Frontend está em [frontend.md](./frontend.md). Resumo: `src/{components,pages,services,data,hooks,locales,routes,test}`; as páginas ainda usam dados mock de `src/data`, e só autenticação, solicitação de acesso e a lista de máquinas chamam a API (`src/services`).

A pasta `.specs/` na raiz guarda o fluxo spec-driven: `features/<nome>/` com o `spec.md` de cada feature e, conforme o tamanho dela, `design.md`, `tasks.md` e `validation.md`, `STATE.md` com o registro de decisões e `LESSONS.md` com as lições aprendidas.

## 3. Ferramentas e Decisões Técnicas

### Motor TypeScript no Backend (`tsx`)
O Node.js 24 causou conflitos iniciais com o `ts-node-dev`. O Node exige extensões `.js` em módulos ES, mas o TypeScript restringe importações de `.ts`. A solução foi adotar o `tsx` (TypeScript eXecute), que traduz os imports automaticamente e resolve o problema sem exigir a extensão no código.