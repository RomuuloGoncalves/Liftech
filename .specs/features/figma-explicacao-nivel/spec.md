# Modal de explicação de nível crítico Specification

## Problem Statement

O Histórico de Alertas pinta cada acidente de vermelho, laranja ou amarelo, mas a tela não explica o que cada cor significa. O Figma `admin/05-historico-de-alertas/03-modal-explicacao-categoria.png` resolve isso com um botão "?" na barra de ferramentas que abre o modal "Informações sobre nível crítico". A auditoria (`.specs/features/auditoria-figma/RELATORIO.md`, linha `03-modal-explicacao-categoria`) marcou a tela como NÃO IMPLEMENTADA. O mapeamento causa → nível já existe em `ACCIDENT_URGENCY` (`Frontend/src/data/machines.ts:243`).

## Goals

- [ ] Em `/alertas`, o botão "?" abre o modal com os 3 cartões do PNG (Crítico, Alta, Média), na ordem e nas cores do Figma.
- [ ] A causa de cada nível vem de `ACCIDENT_URGENCY`: mudar o mapa muda o modal, sem texto de nível solto no componente.
- [ ] O texto novo existe nos 7 locales, no namespace `levelInfo.*`, sem editar chave existente.
- [ ] Puro frontend: 0 rota nova e 0 dependência nova.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Outras divergências da tela `05/01` (chip "Acidentes", período em botão único, ⋮ no card) | Cobertas pela auditoria, não por esta tela. |
| Erro de carga virando lista vazia em `AlertasPage` | Problema de estado da `05/01` apontado pela auditoria; outra feature. |
| Mudar a largura do `Modal` compartilhado | `Modal.tsx` é usado por 8 modais e outras features em paralelo podem mexer nele. Ver Assumptions. |
| Novas causas de acidente ou novo nível | O modal só lê o que `ACCIDENT_URGENCY` já define. |
| Backend | Não há dado novo; o mapa é estático no frontend. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Texto dos cartões | Literal do Figma: "Nível de urgência crítico associado a um **tombamento**." / "... a uma **colisão**." / "... a uma **frenagem brusca**." O adjetivo "crítico" se repete nos 3. | Fidelidade ao PNG. "Nível crítico" é o nome do conceito no título do modal. Se o dono preferir "Nível de urgência alta/média", basta trocar o valor no locale. | n |
| Rótulo do nível | Novas chaves `levelInfo.level.*` com "Crítico", "Alta", "Média" | O Figma escreve "Crítico". A chave existente `alerts.urgency.critica` diz "Crítica" e não pode ser editada (regra de arquivos disputados). | n |
| Ordem dos cartões | Fixa por nível: crítica, alta, média. A causa de cada nível é procurada em `ACCIDENT_URGENCY`. | O objeto `ACCIDENT_URGENCY` está na ordem inversa (`frenagem`, `colisao`, `tombamento`); a ordem do Figma é por gravidade. | y (Figma) |
| Nível sem causa no mapa | O cartão do nível não aparece. | Se o mapa mudar e um nível ficar sem causa, um cartão sem causa seria texto falso. | n |
| Largura do modal | Usa o `Modal` compartilhado como está (`max-width: 550px`); o Figma mede ~458 px. Os cartões ocupam a largura útil. | Mexer em `Modal.tsx` arrisca conflito com feedback, alerta e perfil. Diferença só de largura. | n |
| Posição do "?" | Primeiro item do grupo de filtros, à esquerda da busca, como no PNG. | PNG: botão azul entre o chip "Acidentes" e a busca, colado na busca. | y (Figma) |
| Ícone do "?" | `CircleHelp` do `lucide-react` (já instalado), branco, sobre fundo `--blue`. | O PNG mostra um glifo "?" branco num botão azul; o ícone existe no pacote. | n |
| Nome acessível do "?" | `levelInfo.open` = "Sobre os níveis de urgência" (`aria-label` e `title`) | O botão só tem ícone. | n |
| Foco ao fechar | O foco volta ao botão "?". | `Modal` não devolve o foco; sem isso o foco cai no `body`. | n |
| Botão durante o skeleton | Não aparece enquanto a página mostra o skeleton; aparece com lista vazia. | O skeleton da página já desenha a barra; o modal não depende dos dados. | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

Remaining implicit-requirement dimensions (persistence, external calls, auth, concurrency, state transitions) N/A for this scope: o modal é estático e local.

---

## User Stories

### P1: Modal de explicação de nível crítico ⭐ MVP

**User Story**: As an admin, I want to understand the urgency levels so that I know what each color means.

**Why P1**: Figma `05/03`. Não depende de backend e fecha a tela de alertas.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN o admin clica no botão "?" da barra de ferramentas do Histórico de Alertas THEN the system SHALL abrir o modal com o título "Informações sobre nível crítico"  <!-- event-driven -->
2. The system SHALL listar 3 cartões na ordem Crítico, Alta, Média  <!-- ubiquitous -->
3. The system SHALL escrever em cada cartão a causa que `ACCIDENT_URGENCY` liga ao nível, em negrito: Crítico → "tombamento", Alta → "colisão", Média → "frenagem brusca"  <!-- ubiquitous -->
4. The system SHALL pintar a faixa esquerda e o título de cada cartão com o token da urgência: `--urgency-critical`, `--urgency-high` e `--urgency-medium`  <!-- ubiquitous -->
5. IF um nível não tiver causa em `ACCIDENT_URGENCY` THEN the system SHALL omitir o cartão desse nível  <!-- unwanted-behavior -->
6. WHEN o admin clica no X, no fundo or pressiona Esc THEN the system SHALL fechar o modal  <!-- event-driven -->
7. WHEN o modal fecha THEN the system SHALL devolver o foco ao botão "?"  <!-- event-driven -->
8. The system SHALL dar ao botão "?" o nome acessível traduzido de `levelInfo.open`  <!-- ubiquitous -->
9. The system SHALL desenhar o botão "?" com fundo `--blue` e ícone branco, como primeiro item do grupo de filtros, à esquerda da busca  <!-- ubiquitous -->
10. IF a lista de alertas estiver vazia THEN the system SHALL manter o botão "?" visível e funcional  <!-- unwanted-behavior -->
11. The system SHALL ter as chaves `levelInfo.title`, `levelInfo.open`, `levelInfo.level.{critica,alta,media}` e `levelInfo.description.{tombamento,colisao,frenagem}` nos 7 locales  <!-- ubiquitous -->

**Independent Test**: Em `/alertas`, o "?" abre o modal com 3 cartões iguais ao PNG; Esc fecha e o foco volta ao "?".

---

## Edge Cases

- WHEN o idioma ativo é outro dos 7 locales THEN the system SHALL mostrar título, níveis e descrições traduzidos, com a causa em negrito (via `Trans`).
- WHEN a descrição é longa (de, ru) THEN the system SHALL quebrar a linha dentro do cartão sem estourar a largura do modal.
- WHEN o admin abre e fecha o modal várias vezes THEN the system SHALL abrir sempre o mesmo conteúdo, sem chamada à API.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| EXP-01 | P1: Modal de explicação | Tasks | Pending |
| EXP-02 | P1: Modal de explicação | Tasks | Pending |
| EXP-03 | P1: Modal de explicação | Tasks | Pending |
| EXP-04 | P1: Modal de explicação | Tasks | Pending |
| EXP-05 | P1: Modal de explicação | Tasks | Pending |
| EXP-06 | P1: Modal de explicação | Tasks | Pending |
| EXP-07 | P1: Modal de explicação | Tasks | Pending |
| EXP-08 | P1: Modal de explicação | Tasks | Pending |
| EXP-09 | P1: Modal de explicação | Tasks | Pending |
| EXP-10 | P1: Modal de explicação | Tasks | Pending |
| EXP-11 | P1: Modal de explicação | Tasks | Pending |

**ID format:** `EXP-NN`, na ordem dos critérios acima.

**Coverage:** 11 total, 11 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `yarn test` do Frontend passa sem teste removido; `tsc -b` e `eslint .` limpos.
- [ ] Cada critério EXP tem um teste que falha se o comportamento quebrar.
- [ ] No navegador do Orca, em 1440 px, o modal bate com o PNG nos elementos listados (título, X, 3 cartões, faixas e cores), exceto a largura (Assumptions).
