# Liftech

Bem-vindo ao repositório oficial do projeto **Liftech**.
Este projeto está organizado no formato de **Monorepo**, contendo o Frontend e o Backend centralizados no mesmo lugar para facilitar o desenvolvimento, versionamento e orquestração.

> Para detalhes profundos sobre a Arquitetura do Backend e do projeto, consulte a [Documentação de Arquitetura](./docs/arquitetura.md).

## Especificações Técnicas

*   **Node.js**: Versão 24+
*   **Gestor de Pacotes**: Yarn
*   **Linguagem Base**: TypeScript

### Frontend
*   React.js com Vite
*   TypeScript
*   Ant Design (UI)
*   Redux 
*   Axios e React Router

### Backend
*   Node.js + Express
*   TypeScript (Motor de Dev: `tsx`)
*   Banco de Dados: MongoDB via Mongoose
*   Validação: Camada de Schemas de Validação (DTOs)
*   Arquitetura Baseada em Features/Módulos (Domain-Driven Design), isolando componentes por Entidade.

---

## Instruções de Inicialização (Desenvolvimento Local)

Graças ao pacote `concurrently`, subir o projeto para testes locais requer apenas um único comando na raiz do projeto.

### 1. Instalação
Clone o projeto e, dentro da pasta raiz (`Liftech`), instale as dependências globais e as dependências internas dos subprojetos:

```bash
# Na pasta raiz
yarn install
```

### 2. Rodando a Aplicação
Para iniciar os servidores do Frontend e do Backend simultaneamente, rode na raiz do projeto:

```bash
yarn dev
```

Você verá os logs tanto do Backend quanto do Frontend dividindo o mesmo terminal.
* O **Backend** usará o `tsx watch` para reiniciar automaticamente em caso de mudanças (sem problemas de compatibilidade com imports `.ts`).
* O **Frontend** usará o servidor rápido do Vite.

---