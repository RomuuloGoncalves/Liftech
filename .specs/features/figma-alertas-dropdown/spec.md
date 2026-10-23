# Dropdown de Alertas Recentes Specification

## Problem Statement

O sino do cabeçalho do admin é um botão sem ação (`Frontend/src/components/layout/Header.tsx:112-114`). O Figma `admin/02-visao-geral-maquinas/06-gestao-da-frota-ativo-1.png` desenha um popover "Alertas Recentes" ancorado no sino, com os últimos incidentes, um botão "Mais" e um X. A auditoria (`.specs/features/auditoria-figma/RELATORIO.md`, linha `06-gestao-da-frota-ativo-1`) marca a tela como NÃO IMPLEMENTADA, prioridade Alta.

## Goals

- [ ] O sino abre um popover igual ao PNG: título azul "Alertas Recentes" com seta, X à direita, até 5 linhas com o nome da máquina em vermelho e seta, botão azul "Mais" centralizado.
- [ ] Um ponto vermelho no sino indica incidente mais novo que o último visto e some quando o popover abre.
- [ ] O popover só consome o `AlertsContext` de `figma-modal-alerta`; 0 chamadas de API próprias.
- [ ] Os textos novos existem nos 7 locales, no namespace `alertsDropdown.*`.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Polling, busca de incidentes, regra de "visto" | Dono é `figma-modal-alerta` (`AlertsContext`). Este popover só lê `recent`, `loading`, `error`, `hasUnseen` e chama `markSeen()`/`reload()`. |
| Abrir o detalhe do incidente a partir da linha | O Figma não define destino; o contexto compartilhado fixa `/alertas`. |
| Lida/não lida por incidente salva no servidor | Fora do contexto compartilhado; o "visto" é um marcador único no navegador. |
| Trocar o ícone do sino pelo do Figma | O Figma usa um ícone quadrado com ponto; o projeto padroniza `lucide-react` (`Bell`). Diferença só de glifo. |
| Mudanças no popover de idioma, no avatar ou no botão de logout | Outras features (`figma-perfil-admin`, auditoria). |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Destino de cada linha, do título e do "Mais" | Todos navegam para `/alertas` e fecham o popover. | Contexto compartilhado. O título tem seta no Figma, então também é link. | n |
| Nome exibido na linha | `maquina.nome`; se `maquina` for nulo, "Máquina não informada". | `Incidente.maquina` é `MaquinaResumo \| null` (`services/incidentService.ts:7`). Mesmo padrão do "não informado" do modal "Alerta!". | n |
| Ordem das linhas | A ordem de `recent` (mais novo primeiro), sem reordenar. | O contexto já entrega os 5 mais novos; a API ordena por `dataIncidente` desc (`Backend/src/feature/incident/incidentService.ts:75`). | n |
| Estado de carregamento | Com `loading` verdadeiro e `recent` vazio, o corpo mostra "Carregando alertas…". Com `loading` verdadeiro e lista já carregada, mantém a lista. | O Figma não desenha loading; um texto curto evita skeleton para 5 linhas. | n |
| Prioridade entre erro e lista | `error` verdadeiro mostra a mensagem de erro no lugar da lista, mesmo que `recent` tenha itens antigos. | Igual à regra da auditoria: erro nunca vira estado enganoso. | n |
| Nome acessível do sino | "Notificações" sem pendências; "Notificações (há alertas novos)" com o ponto. | O teste atual do Header procura `/notificações/i`; o ponto precisa de equivalente textual. | n |
| Retorno de foco | Fechar por X ou Esc devolve o foco ao sino. Clique fora e navegação não movem o foco. | Clique fora já põe o foco onde o usuário clicou; após navegar, a página nova assume. | n |
| Hook do contexto | `useAlerts()` exportado de `Frontend/src/context/AlertsContext.tsx`, junto com o objeto `AlertsContext` para os testes. | Contrato fixa só o arquivo e a interface; se `figma-modal-alerta` usar outro nome, só os imports mudam. | n |
| Popover de idioma aberto ao clicar no sino | Fecha pelo clique fora já existente (`Header.tsx:41-45`); o de alertas abre. | Sem código novo: o `mousedown` no sino está fora do popover de idioma. | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Dropdown de alertas recentes no sino ⭐ MVP

**User Story**: As an admin, I want to see the latest alerts from the bell so that I can jump to them.

**Why P1**: Figma `02/06`, prioridade Alta na auditoria. Usa a mesma fonte de dados do modal "Alerta!".

**Acceptance Criteria**:

1. WHEN o admin clica no sino THEN the system SHALL abrir o popover "Alertas Recentes" com os itens de `recent` (até 5), cada linha com o nome da máquina em vermelho e uma seta  <!-- event-driven -->
2. WHEN o admin clica em "Mais", no título "Alertas Recentes" or em uma linha THEN the system SHALL navegar para `/alertas` e fechar o popover  <!-- event-driven -->
3. WHEN o admin clica no X, fora do popover or pressiona Esc THEN the system SHALL fechar o popover  <!-- event-driven -->
4. WHILE `hasUnseen` é verdadeiro, the system SHALL mostrar um ponto vermelho no sino  <!-- state-driven -->
5. WHEN o popover abre THEN the system SHALL chamar `markSeen()` uma vez  <!-- event-driven -->
6. IF `recent` estiver vazio, sem `loading` e sem `error`, THEN the system SHALL mostrar o texto "Nenhum alerta recente"  <!-- unwanted-behavior -->
7. IF `error` for verdadeiro THEN the system SHALL mostrar "Não foi possível carregar os alertas" com o botão "Tentar de novo", que chama `reload()`  <!-- unwanted-behavior -->
8. The system SHALL dar ao sino `aria-label` traduzido, `aria-expanded` e foco devolvido ao botão ao fechar por X or Esc  <!-- ubiquitous -->
9. WHILE `loading` é verdadeiro and `recent` está vazio, the system SHALL mostrar "Carregando alertas…" no corpo do popover  <!-- state-driven -->
10. IF o incidente tiver `maquina` nula THEN the system SHALL escrever "Máquina não informada" na linha  <!-- unwanted-behavior -->
11. The system SHALL traduzir todos os textos do popover nos 7 locales, no namespace `alertsDropdown`  <!-- ubiquitous -->

**Independent Test**: Com 2 incidentes no banco e o modal "Alerta!" já fechado para o primeiro, o sino mostra o ponto, abre com 2 linhas, o ponto some e "Mais" leva a `/alertas`. Em teste: `AlertsDropdown` com `AlertsContext.Provider` de valor fixo.

---

## Edge Cases

- WHEN `recent` traz mais de 5 itens THEN the system SHALL mostrar só os 5 primeiros.
- WHEN o nome da máquina é longo THEN the system SHALL cortar com reticências numa linha, sem passar dos 244 px do popover.
- WHEN o admin clica no sino com o popover aberto THEN the system SHALL fechar o popover.
- IF `markSeen()` já zerou `hasUnseen` e chega incidente novo com o popover aberto THEN the system SHALL mostrar a linha nova e o ponto de novo, sem chamar `markSeen()` até o próximo abrir.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ALR-01 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-02 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-03 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-04 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-05 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-06 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-07 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-08 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-09 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-10 | P1: Dropdown de alertas | Tasks | Pending |
| ALR-11 | P1: Dropdown de alertas | Tasks | Pending |

**ID format:** `ALR-NN`, na ordem dos critérios da história.

**Coverage:** 11 total, 11 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `yarn test`, `yarn lint` e `tsc -b` do Frontend verdes, sem teste removido; os testes existentes do Header continuam passando.
- [ ] Cada ALR tem um teste que falha se o comportamento quebrar.
- [ ] No navegador do Orca, em 1440 px, o popover bate com o PNG `06-gestao-da-frota-ativo-1.png`.
