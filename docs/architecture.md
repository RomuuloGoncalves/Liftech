# Arquitetura e Decisões Técnicas - Liftech

Este documento registra as decisões de arquitetura e o ferramental escolhido para o projeto Liftech.

## 1. Estrutura de Monorepo
O projeto foi concebido utilizando uma estrutura de **Monorepo**, mantendo tanto o `Frontend` quanto o `Backend` no mesmo repositório git. Isso facilita o compartilhamento de tipos, padronização de commits e orquestração.
- A orquestração do ambiente de desenvolvimento é feita pelo pacote `concurrently` na raiz do projeto.
- O comando `yarn dev` na raiz sobe ambos os servidores simultaneamente.

## 2. Arquitetura do Backend
O Backend foi desenhado seguindo a **Arquitetura em Camadas**, fortemente baseada na injeção de dependências e separação de responsabilidades. Isso garante um código escalável e fácil de manter.

### Estrutura de Pastas do Backend (`Backend/src/`)
* **`config/`**: Configurações globais, variáveis de ambiente (via `dotenv`) e conexão com bancos de dados.
* **`controllers/`**: Ponto de entrada das requisições. Responsável exclusivamente por receber o objeto `req`, repassar os dados para o Service, e devolver a resposta `res`.
* **`middlewares/`**: Interceptadores de rotas utilizados para autenticação, autorização e tratamento de erros.
* **`models/`**: Classes de domínio da aplicação e Schemas de Banco de Dados. Como utilizamos o Mongoose, o Schema (regras do banco) e o Model (motor do Mongoose) ficam agrupados aqui junto com a Interface TypeScript.
* **`routes/`**: Definição dos caminhos das URLs (ex: `/usuarios`) e mapeamento para seus respectivos Controllers.
* **`schemas/`**: Schemas de validação de dados de entrada (Data Transfer Objects - DTOs). Utilizado com bibliotecas como Zod ou Joi para garantir que os dados recebidos da internet estejam no formato correto antes de chegarem ao Controller/Service.
* **`services/`**: O coração do sistema. Contém 100% da regra de negócio pesada, processamento de dados e chamadas aos repositórios/models.
* **`utils/`**: Funções utilitárias puras e reaproveitáveis, como formatadores de data ou validadores de CPF.

## 3. Decisões Técnicas e Ferramental

### Motor de TypeScript no Backend (`tsx`)
Inicialmente, o `ts-node-dev` estava causando conflitos com a versão 24 do Node.js (TypeError nativo do V8). Para resolver o "Paradoxo das Extensões do ES Modules" (onde o Node exige extensões `.js` no import, mas o compilador TS proíbe importar arquivos `.ts`), foi adotado o **`tsx`** (TypeScript eXecute). 
- O `tsx` atua como um traduto, permitindo imports limpos sem quebra de extensão, fornecendo a melhor experiência de desenvolvimento no Node moderno.