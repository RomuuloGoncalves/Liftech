# Visão Geral das Máquinas Specification

## Problem Statement

A rota `/` (Visão Geral) hoje renderiza um placeholder ("Em construção"). O operador precisa de uma visão consolidada de todas as máquinas (empilhadeiras) da frota - identificação, setor, conectividade e status - em um grid de cards, com busca e filtro rápidos, conforme o mockup da issue #28.

## Goals

- [ ] Renderizar um grid responsivo de cards de máquinas na rota `/`, populado por dados mock estruturados como o backend atual (`forklift` + `device` + `operator`).
- [ ] Permitir busca client-side por identificação/setor e filtro por status.
- [ ] Layout fluido: do desktop (mockup, 4 colunas) até mobile (1 coluna), reaproveitando os tokens visuais já usados em `Sidebar`/`Header`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Ação real do menu de contexto (⋮) por card | Sem especificação de quais ações existem; fica como affordance. |
| Lógica real do dropdown "All" além de um filtro de status simples | Mockup não detalha as opções; cobrimos o caso funcional mínimo (status). |
| Integração com API real (fetch ao backend) | Backend ainda não expõe endpoint de listagem agregada (forklift+device+operador+setor); mock fica isolado em um módulo de dados, pronto para troca futura. Isso inclui o submit do formulário "Nova Máquina" (P4 abaixo): sem `POST` real, sem validação de duplicidade de MAC/código no servidor. |
| Paginação / virtualização da lista | Mock fixo (16 itens); não há requisito de volume grande ainda. |
| Cálculo real de "tempo de sessão" | Não existe telemetria de sessão no backend hoje; valor é mock estático. |
| Edição/exclusão de máquina existente | Fora do escopo da issue #28 (só criação, via mockup do painel "Nova Máquina"). |
| Reutilização do painel "Nova Máquina" na página Frota | O mockup mostra o mesmo painel também sobre a página Frota, mas a Frota (`FrotaPage`) ainda é um placeholder fora desta spec; o painel fica implementado e disparado a partir da Visão Geral agora. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Campo "Setor" não existe no schema `forklift` atual (`Backend/src/schemas/forklift.ts`) | Tratar como campo mock adicional (`setor: string`) já modelado no tipo `Machine`, para facilitar a extensão do schema real depois | Mockup exige "Setor: Expedição - Bloco B" e o backend não tem esse dado ainda; não é este spec que altera o schema Mongo | n/a (registrado como gap de backend, não decisão de produto) |
| "Tempo de sessão" não existe no backend | Mock estático por card (ex.: "34 minutos"), sem cronômetro ao vivo | Não há fonte de dado real (telemetria de sessão); ao vivo criaria expectativa de dado real | n/a |
| Estrutura do mock | Objeto `Machine` compõe os 3 recursos reais do backend: `identificacao` (forklift), `enderecoMac` + `status` (device), `operador` (operator, opcional) | Mantém o mock 1:1 com o modelo Mongo existente (AD-002), reduzindo o custo de trocar por fetch real depois | y (decisão técnica, sem impacto de produto) |
| Status possíveis do card | `Disponível`, `Em uso`, `Manutenção`, `Offline` (`device.status`) | Cobre os estados operacionais óbvios de uma empilhadeira monitorada; mockup só mostra "Disponível" | n/a |
| Botão "Cadastrar Máquina" | Renderiza mas não abre modal (`onClick` vazio/disabled visualmente ativo) | Consistente com Out of Scope acima e o precedente do Header (AD-004) | y |
| Busca | Filtra client-side por `identificacao` e `setor`, case-insensitive, em tempo real (sem debounce por ser array pequeno em memória) | Único dado de busca visível no mockup é o campo "Search..." | y |
| Breakpoints do grid | Desktop ≥1280px: 4 colunas; 900-1279px: 3 colunas; 640-899px: 2 colunas; <640px: 1 coluna | Deriva do mockup (4 colunas em desktop largo) + convenção mobile-first já usada na Sidebar (`MOBILE_BREAKPOINT = 768`) | y |
| Botão "Cadastrar Máquina" (atualizado) | Agora abre o painel "Nova Máquina" (drawer lateral no desktop, full-screen em mobile <768px), conforme os 2 mockups anexados (issue #28, mensagem de acompanhamento) | Substitui a decisão anterior de deixar o botão inerte; o usuário anexou o mockup do formulário e pediu explicitamente para implementar | y |
| Campo "Nome Dispositivo" do mockup tem placeholder de endereço MAC (`AA:BB:CC:DD:EE:FF`), igual ao campo "Endereço Mac" logo abaixo | Tratar como 2 campos de texto livre distintos, sem validação de formato MAC em nenhum dos dois (nenhuma integração real de dispositivo nesta spec) | O mockup mostra os dois campos lado a lado com o mesmo placeholder; sem API real não há como validar contra device.enderecoMac; texto livre evita bloquear o usuário por um placeholder que parece sugerir formato mas não é validado no mockup | y |
| Submit "Criar Empilhadeira" | Sem chamada de API. Adiciona a nova máquina à lista mock em memória (estado do componente da página) com status "Disponível", tempo de sessão 0 e sem operador vinculado, então fecha o painel e limpa o formulário | Dá valor de demonstração real ao formulário (aparece no grid) sem violar "não precisa integrar com o backend"; consistente com o dataset já ser um módulo em memória | y |
| Validação de campos obrigatórios | "Empilhadeira" (nome) e "Código" são obrigatórios (`required`); "Setor", "Nome Dispositivo" e "Endereço Mac" são opcionais | Mockup não indica quais campos são obrigatórios; nome e código são o mínimo para o card ser identificável no grid (AC1.2 da P1) | n/a |
| Fechar o painel | Fecha ao clicar no X, no botão "Cancelar", na tecla Escape, ou (desktop) ao clicar no backdrop fora do painel; dados digitados são descartados | Mesmo padrão já usado no popover de idioma do Header (Escape/click-outside/X) e no drawer mobile da Sidebar | y |

**Open questions:** none - todas resolvidas ou registradas acima.

---

## User Stories

### P1: Ver grid de máquinas ⭐ MVP

**User Story**: Como operador de frota, quero ver todas as máquinas em cards num grid, para entender rapidamente status e localização de cada uma.

**Why P1**: É o núcleo da tela - sem isso a página não entrega valor algum.

**Acceptance Criteria**:

1. WHEN a rota `/` é acessada THEN o sistema SHALL renderizar um grid com um card por máquina do dataset mock.
2. The system SHALL exibir em cada card: ícone da máquina, nome (ex. "Empilhadeira Elétrica Titan-X"), código de identificação entre parênteses (ex. "EMP-084(ID)"), setor, endereço MAC do dispositivo, badge de status e tempo de sessão.
3. WHILE a viewport tem largura ≥1280px o sistema SHALL exibir o grid em 4 colunas.
4. WHILE a viewport tem largura <640px o sistema SHALL exibir o grid em 1 coluna.
5. IF o dataset mock estiver vazio THEN o sistema SHALL exibir um estado vazio com mensagem "Nenhuma máquina encontrada".

**Independent Test**: Acessar `/`, ver os cards renderizados; redimensionar a janela e confirmar mudança de colunas nos breakpoints.

---

### P2: Buscar e filtrar máquinas

**User Story**: Como operador, quero buscar por identificação/setor e filtrar por status, para localizar uma máquina específica rapidamente.

**Why P2**: Útil com poucas máquinas, essencial quando a frota crescer, mas o grid já é utilizável sem isso.

**Acceptance Criteria**:

1. WHEN o usuário digita no campo de busca THEN o sistema SHALL exibir apenas os cards cujo `identificacao` ou `setor` contenha o texto digitado (case-insensitive).
2. WHEN o usuário limpa o campo de busca THEN o sistema SHALL voltar a exibir todos os cards (respeitando o filtro de status ativo).
3. WHEN o usuário seleciona um status no filtro "All" THEN o sistema SHALL exibir apenas os cards com aquele `status`.
4. IF a busca + filtro não retornar nenhum card THEN o sistema SHALL exibir o mesmo estado vazio da AC1.5 do P1.

**Independent Test**: Digitar um trecho de identificação existente e ver a lista reduzir; selecionar um status no filtro e ver só aquele grupo.

---

### P3: Affordances de ação (cadastrar/editar)

**User Story**: Como operador, quero ver os pontos de entrada para cadastrar uma máquina ou abrir ações de um card específico, para saber que essas ações existirão.

**Why P3**: Nice-to-have visual - a funcionalidade real (modal, ações) é Out of Scope deste spec.

**Acceptance Criteria**:

1. The system SHALL renderizar o botão "Cadastrar Máquina" no topo da página, visualmente ativo, sem ação de submit associada.
2. The system SHALL renderizar um botão de menu (⋮) em cada card, visualmente ativo, sem menu de conteúdo associado.

**Independent Test**: Ver os dois elementos presentes e clicáveis (sem crash), sem side-effect funcional.

---

### P4: Cadastrar nova máquina via painel "Nova Máquina"

**User Story**: Como operador de frota, quero abrir um painel de cadastro ao clicar em "Cadastrar Máquina" e preencher os dados da nova empilhadeira, para vê-la aparecer no grid sem sair da tela de Visão Geral.

**Why P4**: Completa a affordance deixada em P3 - o mockup da issue #28 (mensagem de acompanhamento) especifica o formulário completo; sem isso o botão continuaria inerte.

**Acceptance Criteria**:

1. WHEN o usuário clica no botão "Cadastrar Máquina" THEN o sistema SHALL exibir o painel "Nova Máquina" com os campos Empilhadeira, Código, Setor, Nome Dispositivo e Endereço Mac.
2. WHILE a viewport tem largura ≥768px o sistema SHALL exibir o painel como um drawer lateral direito com um backdrop escurecendo o restante da tela.
3. WHILE a viewport tem largura <768px o sistema SHALL exibir o painel em tela cheia (100% de largura e altura).
4. WHEN o usuário clica no X, no botão "Cancelar", pressiona Escape, ou (≥768px) clica no backdrop THEN o sistema SHALL fechar o painel e descartar os valores digitados.
5. IF os campos "Empilhadeira" ou "Código" estiverem vazios THEN o sistema SHALL impedir o submit do formulário (validação nativa HTML `required`).
6. WHEN o usuário preenche "Empilhadeira" e "Código" (campos obrigatórios) e clica em "Criar Empilhadeira" THEN o sistema SHALL adicionar um novo card ao grid com os valores preenchidos, status "Disponível" e tempo de sessão "0 minutos", fechar o painel e limpar o formulário.
7. The system SHALL preservar o texto de busca e o filtro de status ativos ao abrir e fechar o painel.

**Independent Test**: Clicar em "Cadastrar Máquina", preencher nome e código, submeter, e ver o novo card aparecer no grid com status "Disponível"; testar fechar pelas 4 formas (X, Cancelar, Escape, backdrop) sem criar card.

---

## Edge Cases

- IF um card não tiver `operadorConectadoId` (operador não vinculado) THEN o sistema SHALL omitir a linha de operador sem quebrar o layout do card.
- IF o texto de busca não casar com nenhuma máquina THEN o sistema SHALL mostrar o estado vazio (ver AC1.5 / P2-AC4).
- WHEN a janela é redimensionada entre breakpoints THEN o sistema SHALL re-renderizar o grid sem perder o texto de busca/filtro ativos. (Verificado manualmente no browser: `query`/`status` vivem em `useState` no componente da página e não são resetados por eventos de resize/media query, que só afetam CSS via `VisaoGeralPage.module.css`.)
- IF o usuário tentar submeter o formulário "Nova Máquina" com "Empilhadeira" ou "Código" vazios THEN o sistema SHALL bloquear o submit (validação nativa do browser).
- IF o usuário fechar o painel sem submeter THEN o sistema SHALL descartar os valores digitados (reabrir o painel depois mostra o formulário vazio, não o rascunho anterior).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| VGM-01 | P1: Ver grid de máquinas | Execute | Verified |
| VGM-02 | P1: Ver grid de máquinas | Execute | Verified |
| VGM-03 | P1: Ver grid de máquinas | Execute | Verified (manual browser check; jsdom has no layout engine) |
| VGM-04 | P1: Ver grid de máquinas | Execute | Verified (manual browser check; jsdom has no layout engine) |
| VGM-05 | P1: Ver grid de máquinas | Execute | Verified |
| VGM-06 | P2: Buscar e filtrar máquinas | Execute | Verified |
| VGM-07 | P2: Buscar e filtrar máquinas | Execute | Verified |
| VGM-08 | P2: Buscar e filtrar máquinas | Execute | Verified |
| VGM-09 | P2: Buscar e filtrar máquinas | Execute | Verified |
| VGM-10 | P3: Affordances de ação | Execute | Verified |
| VGM-11 | P3: Affordances de ação | Execute | Verified |
| VGM-12 | P4: Cadastrar nova máquina | Execute | Verified |
| VGM-13 | P4: Cadastrar nova máquina | Execute | Verified (manual browser check ≥768px; jsdom has no layout engine) |
| VGM-14 | P4: Cadastrar nova máquina | Execute | Verified (manual browser check <768px; jsdom has no layout engine) |
| VGM-15 | P4: Cadastrar nova máquina | Execute | Verified |
| VGM-16 | P4: Cadastrar nova máquina | Execute | Verified |
| VGM-17 | P4: Cadastrar nova máquina | Execute | Verified |
| VGM-18 | P4: Cadastrar nova máquina | Execute | Verified |

**Coverage:** 18 total, 18 mapped to tasks (implicit, Medium scope), 0 unmapped.

---

## Success Criteria

- [ ] Grid renderiza os 16 cards mock na rota `/`, responsivo em 4/3/2/1 colunas conforme breakpoint.
- [ ] Busca e filtro de status reduzem a lista corretamente, com estado vazio tratado.
- [ ] Nenhuma regressão nos testes existentes de Sidebar/Header/rotas.
