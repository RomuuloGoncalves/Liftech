# Página 404 temática — Specification

## Problem Statement

A `NotFoundPage` (rota `*`, `Frontend/src/pages/NotFoundPage.tsx`) é genérica: um ícone `Compass` do lucide, o código "404" e "Página não encontrada". Nada nela diz que o usuário está no Liftech, um produto de gestão de empilhadeiras. Além disso, o botão sempre volta para `/` (Visão Geral do gestor), inclusive quando o erro acontece dentro do app do funcionário (`/funcionario/...`), que roda sem o shell do gestor e é mobile.

## Goals

- [ ] A 404 mostra a empilhadeira animada do produto (vídeo `assets/forklift.*` que já existe) e um texto do universo do galpão.
- [ ] O botão de retorno leva o usuário ao início **do app em que ele está**: `/funcionario` para URLs `/funcionario/*` e `/` para o resto.
- [ ] Nenhum asset novo, nenhuma dependência nova; o loop do vídeo vem de um único lugar no código.

## Out of Scope

| Item | Motivo |
| ---- | ------ |
| Ilustração/SVG nova, Lottie ou imagem gerada | Conceito escolhido reusa o vídeo existente |
| Mudar o roteamento (`path="*"`) ou o shell (`App.tsx`) | A 404 já aparece no shell do gestor e solta em `/funcionario/*`; só o conteúdo muda |
| 404 diferente para usuário deslogado | Não há guarda de rota hoje; fora deste escopo |
| Busca, sugestões de páginas ou relato de link quebrado | Não pedido |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Conceito visual | "Empilhadeira perdida": vídeo `forklift.webm`/`forklift.mp4` + título "Esta rota saiu do mapa do galpão" | Escolha do usuário (2026-11-10); zero asset novo | y |
| Destino do botão | Por contexto: `pathname` começa com `/funcionario/` → `/funcionario`; senão `/` | Escolha do usuário (2026-11-10) | y |
| Reuso do loop do vídeo | Extrair o efeito de `EmployeeSessionPage.tsx:21-33` (loop com `loopFade` + reduced-motion) para um componente `ForkliftLoop` em `components/common/` e usar nas duas telas | Evita duplicar ~13 linhas e a regra de reduced-motion; `utils/loopFade.ts` continua a fonte do cálculo | n |
| Texto do botão para o funcionário | Mesma chave `notFound.backHome` ("Voltar para o início") nos dois contextos | O destino muda, o rótulo serve aos dois | n |
| Tipografia | Mantém os papéis da feature `frontend-harmonia`: código 64px (exceção data-display), título `--fs-xl`/500, descrição `--fs-base`, botão `--fs-md`/600 | Não reabrir o que acabou de ser harmonizado | y |
| Vídeo em reduced-motion | Mostra o vídeo parado no primeiro quadro com opacidade 1 (sem `autoPlay`) | `prefers-reduced-motion` já é respeitado no projeto; vídeo em loop é movimento | n |
| Ícone `Compass` | Removido | O vídeo é a ilustração; dois elementos visuais competem | n |

Open questions: confirmar os 4 defaults marcados `n` (componente `ForkliftLoop`, rótulo único do botão, vídeo parado em reduced-motion, remoção do `Compass`) e os textos propostos em pt-BR.

---

## User Stories

### P1: Tela 404 com a empilhadeira ⭐ MVP

**User Story**: Como usuário do Liftech que abriu uma URL inexistente, quero ver uma tela que claramente pertence ao produto, para entender que errei o caminho e não que o sistema caiu.

**Why P1**: É o pedido.

**Acceptance Criteria**:

1. WHEN o usuário acessa uma rota que não existe THEN the system SHALL renderizar um vídeo decorativo da empilhadeira com fontes `forklift.webm` e `forklift.mp4`, `muted`, `loop`, `playsInline` e `aria-hidden="true"`. <!-- event-driven -->
2. WHEN a 404 é renderizada THEN the system SHALL mostrar o heading "404", o título traduzido de `notFound.title` e a descrição traduzida de `notFound.description`. <!-- event-driven -->
3. WHILE o usuário tem `prefers-reduced-motion: reduce` THE system SHALL manter o vídeo parado (sem autoplay) e com opacidade 1. <!-- state-driven -->
4. WHILE o vídeo toca THE system SHALL aplicar o fade de loop de `utils/loopFade.ts` através do componente compartilhado `ForkliftLoop`. <!-- state-driven -->
5. The `EmployeeSessionPage` SHALL usar o mesmo `ForkliftLoop`, sem mudança visual (largura 220px, mesmas fontes). <!-- ubiquitous -->

**Independent Test**: Abrir `/qualquer-coisa` logado como gestor: aparece a empilhadeira, "404", "Esta rota saiu do mapa do galpão" e o botão.

---

### P1: Retorno por contexto ⭐ MVP

**User Story**: Como funcionário no app mobile, quero que o botão da 404 me leve ao início do meu app, e não ao painel do gestor.

**Why P1**: O gestor tem Sidebar; o funcionário cai numa tela solta e `/` o tiraria do app dele.

**Acceptance Criteria**:

1. WHEN a URL atual começa com `/funcionario/` THEN the system SHALL apontar o link de retorno para `/funcionario`. <!-- event-driven -->
2. WHEN a URL atual não começa com `/funcionario/` THEN the system SHALL apontar o link de retorno para `/`. <!-- event-driven -->
3. The link de retorno SHALL ser um `Link` do `react-router-dom` com texto de `notFound.backHome`. <!-- ubiquitous -->

**Independent Test**: Abrir `/funcionario/xyz` → botão leva a `/funcionario`; abrir `/xyz` → botão leva a `/`.

---

### P2: Textos em todos os idiomas

**User Story**: Como usuário em qualquer um dos 7 idiomas, quero ler a 404 na minha língua.

**Why P2**: O app é traduzido; uma chave faltando aparece como texto cru.

**Acceptance Criteria**:

1. The system SHALL definir `notFound.title` nos 7 locales (`pt-BR`, `en-US`, `es`, `fr`, `de`, `ja`, `ru`) e atualizar `notFound.description` para o tom do galpão. <!-- ubiquitous -->
2. WHEN o título tem mais de uma linha (de, ru) THEN the system SHALL quebrar com `text-wrap: balance` sem cortar texto. <!-- event-driven -->

**Independent Test**: Trocar o idioma para `de` em `/xyz`: título e descrição em alemão, sem chave crua.

---

## Edge Cases

- WHEN o vídeo não carrega (rede, formato) THEN the system SHALL manter o texto e o botão visíveis e centralizados; o espaço do vídeo não deixa ícone de mídia quebrada (sem `controls`, `aria-hidden`).
- WHEN a URL é exatamente `/funcionario` com sufixo inválido como `/funcionarios` THEN the system SHALL tratar como contexto do gestor (retorno `/`), pois só `/funcionario/` com barra conta.
- WHEN a tela é estreita (≤ 360px) THEN the system SHALL limitar o vídeo a `max-width: 100%` e a descrição a `max-width: 420px`, sem rolagem horizontal.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| NF2-01 | P1 Tela: vídeo decorativo com fontes e atributos | Execute | Pending |
| NF2-02 | P1 Tela: heading 404, título e descrição traduzidos | Execute | Pending |
| NF2-03 | P1 Tela: reduced-motion para o vídeo | Execute | Pending |
| NF2-04 | P1 Tela: fade de loop via `ForkliftLoop` | Execute | Pending |
| NF2-05 | P1 Tela: `EmployeeSessionPage` usa `ForkliftLoop` sem mudança visual | Execute | Pending |
| NF2-06 | P1 Retorno: `/funcionario/*` → `/funcionario` | Execute | Pending |
| NF2-07 | P1 Retorno: resto → `/` | Execute | Pending |
| NF2-08 | P1 Retorno: `Link` com `notFound.backHome` | Execute | Pending |
| NF2-09 | P2 i18n: `notFound.title` e descrição nos 7 locales | Execute | Pending |
| NF2-10 | P2 i18n: título balanceado em idiomas longos | Execute | Pending |

**Coverage:** 10 total, 0 mapped to tasks (Medium: tasks implícitas no Execute), 0 unmapped.

---

## Execute (passos implícitos)

1. Criar `components/common/ForkliftLoop.tsx` (+ `.module.css` só se precisar) movendo o efeito de `EmployeeSessionPage.tsx:21-33`; aceita `className`. Teste RTL: atributos do vídeo, reduced-motion (sem `autoplay`, opacidade 1). → NF2-01, NF2-03, NF2-04
2. `EmployeeSessionPage.tsx` passa a usar `<ForkliftLoop className={styles.illustration} />`; `test/pages/employee/EmployeeSessionPage.test.tsx` continua verde. → NF2-05
3. `NotFoundPage.tsx`: troca `Compass` por `ForkliftLoop`, título vira `t('notFound.title')`, destino via `useLocation().pathname.startsWith('/funcionario/')`. CSS: `.illustration` (220px, `max-width: 100%`), `.title` com `text-wrap: balance`. → NF2-02, NF2-06, NF2-07, NF2-08, NF2-10
4. Locales: `notFound.title` e nova `notFound.description` nos 7 `translation.json`. → NF2-09
5. `test/pages/NotFoundPage.test.tsx`: casos de `/xyz` → `href="/"`, `/funcionario/xyz` → `href="/funcionario"`, `/funcionarios` → `href="/"`, vídeo presente, textos pt-BR. Teste de chaves nos 7 locales. → NF2-02, NF2-06..NF2-09

**Gate:** `cd Frontend && export PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH && yarn build && yarn lint && yarn test` + `impeccable detect --json --scope type src`.

**Textos propostos (pt-BR):** título "Esta rota saiu do mapa do galpão"; descrição "A página que você procura não existe ou mudou de lugar. Volte para o início e siga por outro corredor."; botão "Voltar para o início" (existente).

---

## Success Criteria

- [ ] `/xyz` e `/funcionario/xyz` mostram a empilhadeira, "404", título e descrição no idioma ativo.
- [ ] O botão leva a `/` ou `/funcionario` conforme a URL.
- [ ] O loop do vídeo existe em um só componente, usado pela 404 e pela tela de sessão.
- [ ] Build, lint, testes e detector verdes; nenhum teste removido.
