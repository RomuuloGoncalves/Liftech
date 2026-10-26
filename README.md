# Liftech

Repositório do projeto **Liftech**. O projeto usa o formato Monorepo, mantendo Frontend e Backend no mesmo lugar para facilitar o desenvolvimento, versionamento e organização.

Consulte a [Documentação de Arquitetura](./docs/arquitetura.md) para detalhes sobre a estrutura do sistema.

## Especificações Técnicas

*   **Node.js**: Versão 24+
*   **Gestor de Pacotes**: Yarn
*   **Linguagem Base**: TypeScript

### Frontend
*   React.js com Vite
*   TypeScript
*   CSS Modules (estilo) e lucide-react (ícones)
*   i18next (7 idiomas)
*   Axios e React Router

### Backend
*   Node.js e Express
*   TypeScript (Motor de Dev: `tsx`)
*   Banco de Dados: MongoDB via Mongoose
*   Validação: regras com `request-check` (`*Rules.ts` de cada feature)
*   Arquitetura: Baseada em Módulos (Domain-Driven Design), isolando componentes por entidade.

## Inicialização Local

O projeto usa o pacote `concurrently`, permitindo iniciar tudo com um único comando.

### 1. Instalação
Clone o projeto e instale as dependências na pasta raiz:

```bash
yarn install
```

### 2. Rodando a Aplicação
Inicie os servidores do Frontend e do Backend simultaneamente:

```bash
yarn dev
```

Você verá os logs do Backend e Frontend no mesmo terminal. O Backend reinicia automaticamente com `tsx watch` e o Frontend usa o servidor do Vite.

## Testes

`yarn test` (na raiz, em `Backend/` ou em `Frontend/`) roda só os testes unitários (`vitest run`), que usam mocks e não tocam no banco; no Backend, o `yarn test` cobre apenas `tests/unit`. Os testes de integração do Backend conectam ao MongoDB configurado em `.env` e rodam à parte, com `yarn test:integration` dentro de `Backend/`.
