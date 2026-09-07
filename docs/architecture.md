# Arquitetura e Decisões Técnicas - Liftech

Este documento registra as decisões de arquitetura e o ferramental escolhido para o projeto Liftech.

## 1. Estrutura de Monorepo
O projeto foi concebido utilizando uma estrutura de **Monorepo**, mantendo tanto o `Frontend` quanto o `Backend` no mesmo repositório git. Isso facilita o compartilhamento de tipos, padronização de commits e orquestração.
- A orquestração do ambiente de desenvolvimento é feita pelo pacote `concurrently` na raiz do projeto.
- O comando `yarn dev` na raiz sobe ambos os servidores simultaneamente.

## 2. Arquitetura do Backend
O Backend foi desenhado seguindo uma **Arquitetura Baseada em Features (Modular)**, fortemente inspirada no **Domain-Driven Design (DDD)**. Ao invés de agrupar arquivos por tipo (todos os controllers juntos), agrupamos por funcionalidade/entidade. Isso garante alta coesão, facilita a manutenção e prepara o sistema para uma possível extração de microsserviços no futuro.

### Estrutura de Pastas do Backend (`Backend/src/`)
* **core/**: Elementos globais e compartilhados da aplicação, como classes abstratas, interfaces globais e configurações de repositório genéricas.
* **middlewares/**: Interceptadores de rotas utilizados para autenticação, autorização e tratamento de erros globais.
* **feature/**: O coração do sistema. Cada subpasta representa uma funcionalidade isolada (ex: `user`). Dentro de cada feature, agrupamos as responsabilidades de execução e orquestração:
  * **Controller**: Ponto de entrada das requisições HTTP (req, res).
  * **Service**: Regras de negócio da aplicação.
  * **Repository**: Responsável exclusivamente por conversar com o banco de dados.
* **models/**: Classes puras (POO) com as regras de domínio.
* **schemas/**: O mapeamento do banco de dados (Mongoose/MongoDB).
* **routes/**: Definição dos caminhos das URLs da aplicação.
* **config/**: Configurações de infraestrutura (variáveis de ambiente, conexão com banco).
* **utils/**: Funções utilitárias puras e genéricas.

## 3. Decisões Técnicas e Ferramental

### Motor de TypeScript no Backend (`tsx`)
Inicialmente, o `ts-node-dev` estava causando conflitos com a versão 24 do Node.js (TypeError nativo do V8). Para resolver o "Paradoxo das Extensões do ES Modules" (onde o Node exige extensões `.js` no import, mas o compilador TS proíbe importar arquivos `.ts`), foi adotado o **`tsx`** (TypeScript eXecute). 
- O `tsx` atua como um traduto, permitindo imports limpos sem quebra de extensão, fornecendo a melhor experiência de desenvolvimento no Node moderno.