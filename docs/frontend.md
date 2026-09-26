# Estrutura e Arquitetura do Frontend (Liftech)

Este documento descreve as responsabilidades de cada um dos diretórios principais localizados na camada de frontend (`Frontend/src/`).

---

## Visão Geral da Estrutura (`Frontend/src/`)

```
src/
├── assets/         # Imagens estáticas, SVGs e logos
├── components/     # Componentes visuais reutilizáveis da UI (Design System)
├── config/         # Configurações globais e instâncias de clientes
├── pages/          # Páginas e telas da aplicação
├── routes/         # Roteamento e proteção de rotas (Guards)
├── services/       # Camada de comunicação HTTP com a API REST
├── types/          # Definições de interfaces e tipos TypeScript
└── utils/          # Funções utilitárias puras
```

---

## Responsabilidades das Pastas Principais

### 1. `src/components/`
- **Responsabilidade:** Abstrair e concentrar os componentes visuais reutilizáveis da interface do usuário (Design System), como botões, modais, tabelas, cards, headers, sidebars e indicadores de feedback.

### 2. `src/pages/`
- **Responsabilidade:** Armazenar as telas/visões completas da aplicação (Login, Dashboard/Matriz de Frota, Gestão de Operadores, Empilhadeiras, Dispositivos e Erros). Cada página é responsável por orquestrar os componentes visuais e integrar as chamadas aos serviços de dados.

### 3. `src/routes/`
- **Responsabilidade:** Centralizar as rotas de navegação da aplicação utilizando o React Router, definindo o mapeamento de URLs e as travas de acesso a rotas privadas.

### 4. `src/services/`
- **Responsabilidade:** Isolar toda a camada de comunicação HTTP com o Backend (instância do Axios), centralizando as chamadas para as APIs REST.

### 5. `src/config/`
- **Responsabilidade:** Concentrar variáveis de ambiente, configurações globais da aplicação e parâmetros de inicialização de bibliotecas externas.

### 6. `src/types/`
- **Responsabilidade:** Guardar todas as definições de tipos e interfaces do TypeScript, mantendo a consistência dos dados recebidos da API no Frontend.

### 7. `src/utils/`
- **Responsabilidade:** Armazenar funções utilitárias puras e reutilizáveis (como manipuladores de texto, formatação de datas e cálculos operacionais).
