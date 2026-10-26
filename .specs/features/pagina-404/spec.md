# Specification: Página 404

## Overview
Reformular a tela de rota não encontrada (`NotFoundPage`, rota `*`) para seguir o padrão visual e estrutural das demais páginas do frontend: CSS Modules com tokens do `index.css`, textos 100% via i18n (`t()`), ícones `lucide-react`, link de retorno para `/` e teste de página em `src/test/pages/NotFoundPage.test.tsx`.

## Problem Statement
A `NotFoundPage` atual existe e a rota `*` já está registrada, mas a implementação está fora do padrão do projeto: estilos inline, cores hardcoded (`#e53e3e`, `#3182ce`), texto hardcoded em pt-BR ("A página que você está procurando...", "Voltar para o início") ignorando os 7 locales, e sem CSS Module. Resultado: visual inconsistente com o restante do app e strings não traduzíveis.

## User Stories
- As a user, I want to see a styled 404 page matching the app's design when I hit an unknown route, so the app feels coherent.
- As a user in any supported language, I want the 404 texts translated, so the message is understandable in my locale.
- As a user, I want a clear way back to the home page, so I can recover from a wrong URL.

## Out of Scope
- Alterar o roteamento existente (rota `*` já aponta para `NotFoundPage`).
- Conteúdo/dropdown do Header, Sidebar ou qualquer shell novo.
- Página 404 específica para rotas internas protegidas vs. públicas.

## Assumptions & Open Questions
- A chave existente `navigation.notFound` ("Página não encontrada") será reutilizada como título; novas chaves necessárias (descrição e CTA) serão adicionadas em todos os locales.
- O CTA volta para `/` (Visão Geral), mantendo o comportamento atual.
- Nenhum loading de primeira visita (`useFirstVisitLoading`) — a tela é estática e instantânea.

## Requirements (EARS Notation)

### NF-001: Renderização da tela 404
- **WHEN** o usuário acessa uma rota inexistente, **THE** system **SHALL** renderizar a `NotFoundPage` com código "404", título traduzido e descrição traduzida.
- **Acceptance Criteria**:
  - `AC-NF-001.1`: A página MUST renderizar um heading com o texto "404".
  - `AC-NF-001.2`: A página MUST renderizar o título via `t('navigation.notFound')`.
  - `AC-NF-001.3`: A página MUST renderizar a descrição via chave i18n própria, resolvida em todos os 7 locales.

### NF-002: Ação de retorno
- **WHEN** o usuário clica no botão/link de retorno, **THE** system **SHALL** navegar para `/`.
- **Acceptance Criteria**:
  - `AC-NF-002.1`: O link MUST apontar para `/` e ter texto via chave i18n própria.
  - `AC-NF-002.2`: O link MUST ser um `<a>` acessível por teclado (via `react-router-dom` `Link`).

### NF-003: Padrão visual do projeto
- **WHILE** a página renderizar, **THE** system **SHALL** usar `NotFoundPage.module.css` com os tokens do `index.css` (`--text-h`, `--text`, `--accent`, `--border`, `--radius-md`, `--shadow`, `--ease-out`), sem cores ou fontes hardcoded no JSX.
- **Acceptance Criteria**:
  - `AC-NF-003.1`: O componente MUST ter zero estilos inline — todo estilo em CSS Module.
  - `AC-NF-003.2`: Hover do link MUST ter feedback visual com a easing `--ease-out` e escala `scale(0.97)` no active, seguindo o padrão de botões do projeto.
  - `AC-NF-003.3`: A página MUST exibir um ícone `lucide-react` (ex.: `Compass` ou `TriangleAlert`) com `aria-hidden`.

### NF-004: Internacionalização
- **WHEN** o locale ativo muda, **THE** system **SHALL** exibir título, descrição e CTA no idioma correspondente.
- **Acceptance Criteria**:
  - `AC-NF-004.1`: As novas chaves MUST existir em pt-BR, en-US, es, fr, ja, de, ru.
  - `AC-NF-004.2`: O teste MUST renderizar em pt-BR e verificar as strings traduzidas.

### NF-005: Testes
- **WHEN** a suíte de testes roda, **THE** system **SHALL** executar `src/test/pages/NotFoundPage.test.tsx` cobrindo renderização e navegação do link.
- **Acceptance Criteria**:
  - `AC-NF-005.1`: O teste MUST verificar heading "404", título via i18n, descrição e link com `href="/"`.
  - `AC-NF-005.2`: `yarn vitest run src/test/pages/NotFoundPage.test.tsx` (ou equivalente do projeto) MUST passar.

## Requirement Traceability

| ID | Requirement | Test ID | Status |
|----|-------------|---------|--------|
| NF-001 | Renderização da tela 404 | NotFoundPage.test.tsx › heading/título/descrição | verified |
| NF-002 | Ação de retorno | NotFoundPage.test.tsx › link href="/" | verified |
| NF-003 | Padrão visual do projeto | revisão de código + teste de classe CSS Module | verified |
| NF-004 | Internacionalização | NotFoundPage.test.tsx + inspeção dos 7 translation.json | verified |
| NF-005 | Testes | execução da suíte vitest | verified |
