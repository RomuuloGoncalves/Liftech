# Project State & Decisions Log

## Project Memory
- **Project Name**: Liftech Frontend
- **Current Feature**: Visão Geral das Máquinas
- **Methodology**: TLC Spec-Driven Development + Emil Kowalski Design Engineering + Frontend Design Guidelines

## Architectural Decisions (ADR)
### AD-001: Component Architecture & State Management for "Visão Geral das Máquinas"
- **Date**: 2026-09-26
- **Status**: Approved
- **Context**: The main dashboard requires a responsive grid of 16+ machine cards, quick search filtering, language selection popover, and machine registration modal.
- **Decision**:
  - Use React 19 + TypeScript + Vite.
  - Use `lucide-react` for crisp vector iconography (Forklift, Globe, Bell, User, Search, Filter, Dots, Plus, Check).
  - Use CSS Modules / Scoped Tailwind or CSS Design System Variables with custom easing curves (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`).
  - Implement active feedback (`scale(0.97)`), origin-aware popover for language selector, and staggered card list animation.

### AD-002: Arquitetura Backend de Empilhadeiras
- **Date**: 2026-09-26
- **Status**: Approved
- **Context**: PR #48 continha erros graves de herança (Service herdando de Repository) e código sem conexão com MongoDB. Era necessário criar o CRUD base de empilhadeiras.
- **Decision**:
  - Utilizar estrutura baseada no `projetoAGX`.
  - Criar `coreRepository` genérico para abstrair as consultas via Mongoose (`Model.find`, `findById`, etc.).
  - Dividir a responsabilidade em Router -> Controller -> Service -> Repository.
  - Manter validações iniciais no Controller (fail-fast).
  - Usar os schemas/models do Liftech já existentes no banco de dados.

### AD-003: Tema escuro temporariamente desativado
- **Date**: 2026-09-26
- **Status**: Approved (temporary)
- **Context**: `index.css` tinha um bloco `@media (prefers-color-scheme: dark)` herdado do template Vite. Durante o desenvolvimento da Sidebar (issue #50), o usuário pediu para remover o tema escuro "por enquanto" para a UI ficar fiel ao mockup do Figma (que é light-only).
- **Decision**: `color-scheme` fixado em `light` e o bloco de variáveis dark removido de `Frontend/src/index.css`. Reavaliar quando houver um design de dark mode aprovado.

### AD-004: Header Principal (issue #51)
- **Date**: 2026-09-26
- **Status**: Approved
- **Context**: A shell só tinha `Sidebar`; faltava um header global com título da página, seletor de idioma, notificações e perfil, conforme mockup da issue #51.
- **Decision**:
  - Criar `Header.tsx` + `Header.module.css` em `components/layout`, reaproveitando as variáveis/animações do `Sidebar.module.css` (`--ease-out`, `scale(0.97)`, `var(--shadow)`).
  - Título derivado da rota atual via mapa `PAGE_TITLES` (mesmos labels do Sidebar).
  - Popover de idioma com estado local apenas (sem i18n real ainda) - 7 idiomas, fecha com Escape/click-outside/botão X.
  - Bell e Avatar renderizam só a affordance (sem dropdown de conteúdo) - out of scope explícito no spec.
  - `App.tsx` agora envolve `AppRoutes` em `<Header />` + `<main className="app-main">`.

### AD-005: Visão Geral das Máquinas (issue #28)
- **Date**: 2026-09-27
- **Status**: Approved
- **Context**: Rota `/` só tinha um placeholder. Precisava do grid de cards de máquinas do mockup da issue #28, com busca e filtro de status, usando dados mock alinhados à estrutura real do backend (`forklift` + `device` + `operator`).
- **Decision**:
  - Mock em `Frontend/src/data/machines.ts`: tipo `Machine` compõe 1:1 os 3 recursos Mongo reais (`identificacao` do forklift; `enderecoMac`/`status` do device; `operador` opcional). `setor` e `tempoSessaoMinutos` são campos mock puros - não existem no schema Mongo hoje (gap de backend registrado no spec, não decisão de produto).
  - `filterMachines(machines, { query, status })` faz filtro client-side (substring case-insensitive em `identificacao`/`setor` + igualdade de status).
  - `MachineCard` reaproveita os tokens visuais do `Header`/`Sidebar` (`var(--border)`, `var(--accent-bg)`, `var(--shadow)`, `--ease-out`).
  - Grid responsivo: 4 colunas ≥1280px, 3 colunas 900-1279px, 2 colunas 640-899px, 1 coluna <640px.
  - Botão "Cadastrar Máquina" e o menu (⋮) por card são affordances sem ação real - mesmo padrão do Bell/Avatar do Header (AD-004). Modal de cadastro é explicitamente Out of Scope.
  - Verificado por um Verifier independente (sub-agent, author ≠ verifier): achou 1 gap real (operador nunca era renderizado no card) + 2 gaps menores de cobertura de teste; todos corrigidos na mesma sessão. Ver `.specs/features/visao-geral-maquinas/validation.md`.
  - Correção fora do escopo original, pedida pelo usuário durante a implementação: ícone da Sidebar para "Gerenciamento Frota" trocado de `Truck` para `Forklift` (lucide-react).
  - Correção de layout (pedida pelo usuário): `App.css` mudou de `min-height: 100svh` para `height: 100svh` + `overflow: hidden` no shell/content, com `overflow-y: auto` só no `.app-main` - agora só a área de conteúdo rola, Header/Sidebar ficam fixos.

### AD-006: Internacionalização (i18n) — Biblioteca e Estratégia
- **Date**: 2026-09-27
- **Status**: Draft (aguardando aprovação do spec/design)
- **Context**: Issue #55 exige suporte a 7 idiomas com troca em tempo real via Header e persistência em localStorage.
- **Decision**:
  - Usar `i18next` + `react-i18next` como bibliotecas oficiais de i18n do projeto.
  - Resources inline em `src/config/i18n.ts` (sem lazy-load); namespace único `translation`; 4 módulos de chaves: `common`, `navigation`, `machines`, `languages`.
  - Idioma padrão e fallback: `pt-BR`. Persistência em `localStorage['liftech-lang']`.
  - Inicialização síncrona (`initImmediate: false`) — sem `<Suspense>`.
  - `i18next-browser-languagedetector` **não** instalado (padrão fixo PT-BR).

### AD-007: Telas de Login e Cadastro (Figma node-id=0-1)
- **Date**: 2026-10-01
- **Status**: Approved
- **Context**: A aplicação não tinha nenhuma rota de autenticação. O Figma já especifica 3 telas (Login Administrador, Login Colaborador, Solicitar Acesso). Decisão do usuário: escopo é só UI mock no Frontend, sem backend de auth real (sem JWT/hash/sessão) e sem guard de rota nas páginas internas.
- **Decision**:
  - 3 rotas novas em `appRoutes.tsx`: `/login` (`LoginAdminPage`), `/login/colaborador` (`LoginColaboradorPage`), `/solicitar-acesso` (`SolicitarAcessoPage`).
  - `App.tsx` agora oculta `Sidebar`/`Header` condicionalmente nessas 3 rotas (`AUTH_ROUTES.includes(location.pathname)`), já que o Figma mostra as telas full-screen.
  - Layout compartilhado `components/auth/AuthLayout.tsx` (+ `AuthField.tsx`, `AuthForm.module.css`) reaproveita o CSS de formulário já existente em `components/team/TeamForm.module.css` (mesmo padrão de campo/erro do `EmployeeFormModal`).
  - Login (Admin e Colaborador): com todos os campos preenchidos (e-mail válido no caso Admin) o submit sempre autentica e navega para `/`, sem checar credencial contra lista fixa (mock puro, decisão do usuário). Campo vazio/formato inválido mostra erro e não navega.
  - Solicitar Acesso: submit válido substitui o formulário por uma confirmação inline ("Solicitação enviada!"), sem criar conta nem redirecionar.
  - "Esqueceu a senha? Clique aqui" é affordance sem ação (mesmo padrão do Bell/Avatar do Header, AD-004). Links cruzados Admin↔Colaborador e "Entrar Agora!" navegam de verdade.
  - Todo o copy das 3 telas entra em `auth.*` nos 7 `locales/*/translation.json`, consistente com AD-006.
  - Pedido fora do spec, feito pelo usuário durante a implementação (facilitar QA manual): `Sidebar.tsx` ganhou uma seção temporária "DEV: Telas de auth" com 3 links (`Login Admin`, `Login Colaborador`, `Solicitar Acesso`) marcados com comentário `// TEMP` no código - não faz parte do spec.md e deve ser removida quando não for mais necessária para teste manual (ex. quando houver um fluxo real de logout/login que leve a essas telas).
  - 18 testes novos (`App.test.tsx` + 3 arquivos de página), suite completa (264 testes) + lint + build passando. Verificação visual feita por mim mesmo no Browser pane contra os 3 screenshots do Figma (sem subagente dedicado — o usuário pediu monitoramento visual e isso supriu a necessidade).
  - Ver `.specs/features/login-cadastro/spec.md` (14 ACs, AUTH-01..14, todas marcadas Verified).

## Handoff Snapshot
- **Current Phase**: Execute da feature "Telas de Login e Cadastro" concluído (todas as 14 ACs implementadas e verificadas manualmente: testes + lint + build + checagem visual no browser contra o Figma).
- **Next Phase**: Nenhuma ação pendente desta feature. Possível próximo passo (não iniciado): backend real de autenticação, hoje fora de escopo (ver Out of Scope em `login-cadastro/spec.md`).
- **Files changed (uncommitted)**: `Frontend/src/App.tsx`, `Frontend/src/routes/appRoutes.tsx`, `Frontend/src/locales/*/translation.json` (7 arquivos, namespace `auth` novo), `Frontend/src/components/auth/` (novo: `AuthLayout.tsx`, `AuthLayout.module.css`, `AuthField.tsx`, `AuthForm.module.css`), `Frontend/src/pages/{LoginAdminPage,LoginColaboradorPage,SolicitarAcessoPage}.tsx`, `Frontend/src/test/App.test.tsx`, `Frontend/src/test/pages/{LoginAdminPage,LoginColaboradorPage,SolicitarAcessoPage}.test.tsx`, `.specs/features/login-cadastro/spec.md`, `.specs/STATE.md`.
- **Não commitado de propósito**: regra do projeto (`CLAUDE.md`) proíbe `git commit` nesta sessão; o usuário revisa e commita manualmente.
- **Mudanças não relacionadas no working tree (não minhas, não tocadas)**: `Backend/src/feature/user/*`, `Backend/src/models/userModel.ts`, `Backend/tests/unit/userService.test.ts`, `Backend/tests/integration/feature/user/user.test.ts` — alterados por outro processo durante esta sessão, fora do escopo desta feature.
- **Test suite**: 264 testes passando (Frontend), lint limpo, build de produção ok. Backend não testado nesta sessão (fora de escopo).
