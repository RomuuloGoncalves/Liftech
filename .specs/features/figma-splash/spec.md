# Splash (Figma `admin/01-autenticacao/01-splash`) Specification

## Problem Statement

O Figma abre o app com uma splash: fundo em gradiente vertical azul (`#41b0ff` no topo → `#4652ef` na base) e a logo Liftech branca centralizada (marca acima, palavra "Liftech" abaixo). A auditoria (`.specs/features/auditoria-figma/RELATORIO.md`, linha `01-splash`) confirmou que não existe nada disso no código: nenhuma rota, componente ou referência a "splash" em `Frontend/src`. É só visual, sem backend.

## Goals

- [ ] Na primeira abertura de uma aba do navegador numa rota do admin ou de autenticação, a splash aparece por 1,5 s igual ao PNG em 1440 px e depois a rota pedida é exibida.
- [ ] A splash nunca aparece na área do funcionário, nem duas vezes na mesma aba, nem para quem pede menos movimento.
- [ ] Nenhum teste existente quebra; `yarn lint`, `yarn build` e `yarn test` do Frontend seguem verdes.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Animação de entrada/saída (fade, escala da logo) | O Figma mostra um quadro estático; sem protótipo de movimento. |
| Splash na área do funcionário (mobile) | O Figma da splash é 1440 px (admin); o funcionário tem layout próprio. |
| Splash como rota (`/splash`) | É um estado de abertura da aba, não um destino navegável. |
| Novo asset de logo branca | A logo atual (`logo.svg` + `logo-name.svg`) vira branca por CSS; não precisa de arquivo novo. |
| Textos traduzidos (`splash.*` nos locales) | A splash não tem texto além da marca "Liftech", que é nome próprio e não se traduz. |
| Splash ao trocar de rota dentro do app | Só a abertura da aba conta; navegação interna nunca mostra a splash. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quando a splash aparece | Uma vez por aba, decidida só na montagem inicial do app, pela rota de entrada. | `sessionStorage` vive por aba e sobrevive ao recarregar; é o escopo pedido no contexto. | n |
| Duração | 1500 ms fora dos testes; 0 ms no `MODE === 'test'` (splash desligada), igual ao padrão `MOCK_LATENCY_MS` de `hooks/useFirstVisitLoading.ts`. | Os testes de `App.test.tsx` renderizam o shell direto e quebrariam se a splash cobrisse a tela. | n |
| Rotas que mostram a splash | Todas, exceto `/funcionario` e `/funcionario/*` (inclui `/login`, `/login/colaborador`, `/solicitar-acesso`, `/solicitacoes`, rotas do admin e o 404). | O contexto diz "qualquer rota do admin ou do login"; a página de cadastro e o 404 usam o mesmo layout desktop. | n |
| Marca de "já vista" | Chave `liftech.splashSeen` = `'1'` no `sessionStorage`, gravada quando a splash é exibida (não quando é pulada). | Pular por rota do funcionário ou por movimento reduzido não deve impedir a splash numa entrada posterior válida. | n |
| `sessionStorage` bloqueado (leitura ou escrita lança erro) | Trata como "não vista": mostra a splash e ignora a falha de escrita. | A splash é cosmética; erro de armazenamento não pode quebrar a abertura do app. | n |
| `window.matchMedia` ausente | Trata como "sem preferência de movimento reduzido". | jsdom e navegadores antigos não têm `matchMedia`. | n |
| Conteúdo da rota durante a splash | Não é montado (nem Sidebar, Header ou página); monta depois dos 1500 ms. | "Esconder o conteúdo" mais simples e sem chamadas de API em segundo plano por 1,5 s. | n |
| Logo branca | `logo.svg` (marca) e `logo-name.svg` (palavra) com `filter: brightness(0) invert(1)`. Tamanho medido no PNG: marca ≈ 128 × 142 px, palavra ≈ 192 × 48 px, 36 px entre elas, bloco centralizado. | Reusa os assets já usados em `AuthLayout.tsx` e `Sidebar.tsx`. | n |
| Gradiente | Novo token `--gradient-brand: linear-gradient(180deg, #41b0ff 20%, #4652ef 100%)` em `index.css`. | Mesmo gradiente do hero de `AuthLayout.module.css:111`; o teste `no-hardcoded-colors` só permite hex em `index.css` e nos CSS de auth. | n |
| Acessibilidade | Container com `role="img"` e `aria-label="Liftech"`; as duas `<img>` com `alt=""`. | Atende "anunciar o app com aria-label Liftech" sem leitura duplicada da marca. | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Splash na abertura da aba ⭐ MVP

**User Story**: As a user, I want a brand screen on first load so that the app feels finished.

**Why P1**: É a única história desta tela (Figma `01/01`); no contexto geral ela é P3, mas aqui é o MVP da feature.

**Acceptance Criteria**:

1. WHEN o app monta numa aba sem a marca `liftech.splashSeen` e a rota de entrada não é da área do funcionário THEN the system SHALL mostrar a splash (gradiente `--gradient-brand` em tela cheia com a logo branca centralizada) por 1500 ms e em seguida exibir a rota de entrada, sem alterar a URL  <!-- event-driven -->
2. WHILE a marca `liftech.splashSeen` vale `'1'` no `sessionStorage`, the system SHALL montar a rota de entrada direto, sem splash  <!-- state-driven -->
3. WHERE o usuário tem `prefers-reduced-motion: reduce` the system SHALL pular a splash e não gravar a marca  <!-- optional-feature -->
4. IF a rota de entrada for `/funcionario` ou começar com `/funcionario/` THEN the system SHALL pular a splash e não gravar a marca  <!-- unwanted-behavior -->
5. WHILE a splash está visível, the system SHALL não montar o conteúdo da rota (página, Sidebar e Header) e SHALL expor a splash com `role="img"` e `aria-label="Liftech"`  <!-- state-driven -->
6. IF ler ou gravar o `sessionStorage` lançar erro THEN the system SHALL tratar a splash como não vista, exibi-la e seguir para a rota sem erro  <!-- unwanted-behavior -->
7. WHEN a splash é exibida THEN the system SHALL gravar `liftech.splashSeen` = `'1'` no `sessionStorage`, de modo que recarregar a aba não a mostre de novo  <!-- event-driven -->

**Independent Test**: Abrir `/login` numa aba anônima mostra a splash por 1,5 s e depois o login; recarregar na mesma aba não mostra; abrir `/funcionario` numa aba nova não mostra.

---

## Edge Cases

- WHEN o app é desmontado antes de 1500 ms THEN the system SHALL cancelar o timer da splash (sem atualização de estado após desmontar).
- WHEN o `StrictMode` monta, desmonta e remonta o app em dev THEN the system SHALL decidir a splash uma só vez por montagem e a gravação da marca SHALL ser idempotente (feita em efeito, nunca no inicializador de estado).
- WHEN o usuário navega dentro do app depois da splash THEN the system SHALL não mostrar a splash de novo (a decisão é só da montagem).
- WHEN a janela é menor que 1440 px THEN the system SHALL manter o gradiente em tela cheia e a logo centralizada, sem rolagem.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| SPL-01 | P1: Splash na abertura da aba | Tasks | Pending |
| SPL-02 | P1: Splash na abertura da aba | Tasks | Pending |
| SPL-03 | P1: Splash na abertura da aba | Tasks | Pending |
| SPL-04 | P1: Splash na abertura da aba | Tasks | Pending |
| SPL-05 | P1: Splash na abertura da aba | Tasks | Pending |
| SPL-06 | P1: Splash na abertura da aba | Tasks | Pending |
| SPL-07 | P1: Splash na abertura da aba | Tasks | Pending |

**ID format:** `SPL-[NUMBER]`, na ordem dos critérios da história.

**Coverage:** 7 total, 7 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] Cada critério SPL tem um teste que falha se o comportamento quebrar.
- [ ] `cd Frontend && yarn lint && yarn build && yarn test` passam, sem teste removido.
- [ ] No navegador do Orca em 1440 × 900, a splash bate com `figma-telas/admin/01-autenticacao/01-splash.png` (gradiente, logo branca centralizada, sem outros elementos).
- [ ] O bundle de entrada continua ≤ 100 kB gzip (a splash é um componente pequeno no chunk de entrada, sem dependência nova).
