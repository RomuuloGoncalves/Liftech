# Design: Gestão de Empilhadeiras

## Architecture

A arquitetura espelha a camada do `projetoAGX` adaptada para o Liftech:
- **Routes (`src/feature/forklift/forkliftRouter.ts`)**: Mapeamento dos endpoints para o Controller.
- **Controller (`src/feature/forklift/forkliftController.ts`)**: Funções exportadas que capturam `req/res`, validam dados (se necessário) e enviam ao Service. Respostas com status HTTP apropriados.
- **Service (`src/feature/forklift/forkliftService.ts`)**: Regras de negócio, verificação de existência, injeção de dependência do Repository.
- **Repository (`src/feature/forklift/forkliftRepository.ts`)**: Interage com o MongoDB estendendo o `coreRepository`.
- **Core (`src/core/coreRepository.ts` & `coreModel.ts`)**: Camada base genérica para as operações Mongoose.

## Component Breakdown

1. `coreRepository`: Classe abstrata com `obterTodos`, `obterPorId`, `criar`, `atualizarPorId`, `deletarPorId`.
2. `forkliftModel`: Extensão do `coreModel` contendo `identificacao`, `dispositivoConectadoId`, `operadorConectadoId`.
3. `forkliftRepository`: Converte o Doc do Mongoose (`Record<string, unknown>`) para o `forkliftModel`.
4. `forkliftService`: Lida com `listar`, `obterPorId`, `criar`, `atualizar`, `deletar`.

## Data Models

O Schema do Mongoose (já existente em `Backend/src/schemas/forklift.ts`) é a fonte de verdade para a coleção `forklifts`.
