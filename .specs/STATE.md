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

### AD-008: Empresas e filiais (modelo de acesso)
- **Date**: 2026-10-13
- **Status**: Approved (decisões do dono; specs B, C e D ainda não escritos)
- **Context**: Hoje não existe empresa ou filial no backend (só `accessRequest.nomeEmpresa`), o JWT não é verificado em nenhuma rota e o `RepositoryBase` não filtra. O Figma tem o seletor de filial na Sidebar (frames `341:7064`, `341:7309`, `341:7804`), não no Header.
- **Decision**:
  - Dois eixos independentes: `role` (`admin` | `colaborador`) diz o que o usuário vê; o escopo diz onde atua.
  - Coleções novas `company` e `branch` (`empresaId`; a matriz é uma filial com `matriz: true`).
  - `user` ganha `empresaId`, `escopo: 'empresa' | 'filiais'` e `filiaisIds[]` (um usuário pode ter várias filiais). `escopo: 'filiais'` com lista vazia não vê nada.
  - Recursos (forklift, device, operator, sector, incident) têm um único `filialId`; telemetria isola pelo device.
  - O JWT continua só com `sub`; o middleware busca o usuário a cada requisição, e o escopo vem daí. O filtro entra no `RepositoryBase`.
  - Criar recurso com várias filiais exige `filialId` no corpo, validado contra as filiais do usuário.
  - Cada filial tem admin próprio; só o admin da empresa move máquina ou funcionário entre filiais. Mesmo banco, com `empresaId` nos documentos. O setor pertence a uma filial e substitui o texto `unidade`.
  - Front: o seletor fica na Sidebar, com "Todas as filiais", listar, criar inline, renomear e excluir; "Gerenciar" e "Criar" só para `escopo: 'empresa'`. Linha "Nome da companhia" no rodapé da Sidebar.
  - Reverte o Out of Scope "Proteção de rotas" de `auth-login`.
- **Plano**: A `employee-nav-settings` (só front) → B `branches-model` → C `access-scope` → D `branches-frontend`.

### AD-009: Visão Geral lendo a API e seeds (`machines-api`)
- **Date**: 2026-10-13
- **Status**: Approved, implementado e verificado (ver `.specs/features/machines-api/validation.md`)
- **Context**: A Visão Geral lia o mock `MACHINES`; o backend não tinha rota que juntasse forklift, device e operator.
- **Decision**:
  - `GET /api/machines` (feature `machine`: service, controller, router) devolve o formato `Machine` do front; rota separada de `/api/forklifts`, sem auth até a feature de escopo.
  - O schema `forklift` ganhou `nome`, `setor` e `sessaoIniciadaEm` (opcionais); `tempoSessaoMinutos` é calculado na resposta.
  - `yarn seed:data` (`Backend/src/scripts/seedData.ts`, dados em `seedDataset.ts`) faz upsert por chave natural em operator, device, forklift, telemetry, incident, user (colaboradores, senha em `SEED_COLABORADOR_SENHA`) e accessRequest, e chama o `seedAdmin`. O dono executa o seed; os testes usam models mockados.
  - A Visão Geral busca as máquinas com skeleton, erro e nova tentativa; cadastrar, editar e excluir seguem só em memória; o histórico do detalhe segue mock, casado pela `identificacao`.
  - Frota, Equipe, Alertas e as telas do funcionário seguem em mock.

### AD-010: Filiais, escopo de acesso, skeletons e área do funcionário implementados
- **Date**: 2026-10-13
- **Status**: Implementado na branch `feature/visao-geral-api-e-seeds`; verificação independente **incompleta** (ver Handoff)
- **Decision**:
  - Implementados conforme AD-008: `branches-model` e `access-scope` (Backend), `branches-frontend`, `employee-nav-settings` e `skeleton-fidelity` (Frontend); specs em `.specs/features/<feature>/`.
  - Todas as rotas `/api/*` exigem `Authorization: Bearer`, exceto `POST /api/auth/login`, `POST /api/access-requests`, `GET /api/health` e `GET /`; o escopo vem do usuário relido do banco a cada requisição.
  - `PUT /api/users/:id` aceita só campos permitidos (sem `senhaHash`, `email`, `usuario`, chaves `$`).
  - `yarn test` no Backend roda só os testes unitários; `yarn test:integration` toca o banco.
  - Reverte o Out of Scope "Proteção de rotas" da spec `auth-login`.

### AD-011: Status da máquina e categorias da Frota (`fleet-categories`)
- **Date**: 2026-10-15
- **Status**: Implementado e verificado (PASS em `.specs/features/fleet-categories/validation.md`)
- **Context**: O status era texto livre em `device.status`, escrito só pelo seed, e as categorias da Frota viviam só em memória, nascendo do status.
- **Decision**:
  - O status é da máquina (`forklift.status`), com os códigos `disponivel`, `em_uso`, `manutencao`, `alerta`, `offline`. Muda por leitura do dispositivo (o backend decide: `forcaImpacto >= LIMITE_IMPACTO` vira `alerta` e cria incidente pendente) ou à mão. Toda mudança passa por `aplicarStatus`.
  - Categorias pertencem à empresa (coleção `category`) e podem ligar status (`statusVinculados`, um status por categoria). Mudança de status leva a máquina destravada para a categoria ligada; `categoriaTravada` impede. Mover à mão não muda status.
  - Só escopo empresa gerencia categorias; qualquer usuário do escopo move, trava e troca status.
  - `device.status` deixa de ser lido pela API; `PUT /api/forklifts/:id` recusa campos de status e categoria.
  - Fica para a feature seguinte: sessão do funcionário e ocorrência no backend; também fora: autenticação do dispositivo e offline por heartbeat.

### AD-012: Cadastro de máquina e Equipe pela API (`machines-team-crud`)
- **Date**: 2026-10-16
- **Status**: Implementado e verificado (PASS em `.specs/features/machines-team-crud/validation.md`)
- **Decision**:
  - `POST`, `PUT /:id` e `DELETE /:id` em `/api/machines` criam e mantêm forklift + device (`enderecoMac` único, em maiúsculas; `device.nome` = nome do dispositivo). A máquina nasce `disponivel` na categoria ligada; excluir com sessão aberta responde 409.
  - `/api/operators` (só `role: 'admin'`, escopo de filial) faz o CRUD do operador (`matricula` gerada `EMP-NNN`, telefone, cargo, turno) e do login do colaborador em `/:id/login`. Excluir o operador apaga o login; sessão aberta responde 409.
  - `user.acessoNegado` bloqueia o login (403 "Acesso negado.") e o token em uso (401 no `autenticar`).
  - Visão Geral e Equipe gravam pela API com atualização otimista e rollback com toast; o cadastro na Equipe espera a API. Setores seguem em mock.

### AD-013: Setores pela API (`sectors`)
- **Date**: 2026-10-16
- **Status**: Implementado e verificado (PASS em `.specs/features/sectors/validation.md`, 42/42 mutantes mortos na rodada 2)
- **Decision**:
  - Coleção `sector` (`nome` até 60, `filialId`; único `{ filialId, nome }` com collation pt/2). `/api/sectors`: GET para todo o escopo (colaborador inclusive); POST, PUT e DELETE só admin; mover de filial só escopo empresa e sem máquinas (409); excluir com máquinas responde 409 com a contagem.
  - `forklift.setorId` (opcional) substitui o texto `forklift.setor`, que deixa de ser lido. `/api/machines` aceita `setorId` da mesma filial (400 se não) e devolve `setor` = nome do setor ligado (ou `''`) e `setorId`; sessões e ocorrências também. `PUT /api/forklifts` protege `setorId` e o zera quando o corpo traz `filialId`.
  - `yarn migrate:sectors` leva os textos antigos para setores (idempotente); seed e reset criam e limpam setores.
  - Front: aba Setores pela API com otimista e rollback; seletor de filial no formulário conforme escopo; select de setor no cadastro de máquina; filtro por setor na Visão Geral e na Frota.

## Handoff Snapshot
- **Branch**: `feature/machines-team-crud` (local, nada enviado ao remoto, sem PR).
- **Feature**: `sectors` concluída (T1–T15) e verificada: PASS na rodada 2 (rodada 1 FAIL por 5 mutantes vivos, corrigidos só com testes).
- **Gate final**: Backend `tsc --noEmit` limpo e 866 testes unitários; Frontend `tsc -b` e `eslint .` limpos e 1378 testes.
- **Pendente para o dono**: rodar `yarn migrate:sectors` nos dados existentes (sem isso, máquinas antigas aparecem sem setor); antes, conferir textos repetidos com caixa diferente na mesma filial, que viram um setor só: `db.forklift.aggregate([{ $match: { setor: { $type: "string" } } }, { $group: { _id: { f: "$filialId", s: { $toLower: { $trim: { input: "$setor" } } } }, textos: { $addToSet: "$setor" } } }, { $match: { "textos.1": { $exists: true } } }])`.
- **Ainda pendente da `machines-team-crud`**: conferir que não há `enderecoMac` repetido em `device` antes do índice único subir (`db.device.aggregate([{ $group: { _id: { $toUpper: "$enderecoMac" }, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }])`); `isUsernameTaken` do front ignora caixa e o backend não; o formulário não checa o limite de 72 caracteres da senha.
- **Observações abertas**: o toast de erro do setor lê a contagem do texto da mensagem da API (`/Setor com (\d+)/`); o diagrama `.jpg` da modelagem não mostra setores.
