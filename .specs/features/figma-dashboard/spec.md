# Dashboard (Figma `admin/02-visao-geral-maquinas/02-visao-geral-variante.png`)

> Entrada: `.specs/features/telas-figma-faltantes/contexto.md` (história "P2: Dashboard", DSH-01..11) e `.specs/features/auditoria-figma/RELATORIO.md` (linha `02-visao-geral-variante`, NÃO IMPLEMENTADA). Este arquivo corrige o contexto onde o código ou o PNG provaram outra coisa; cada correção está em "Assumptions" com o motivo.

## Problem Statement

O Figma desenha uma tela "Dashboard" com 4 cartões de dados rápidos, uma tabela paginada de máquinas e um heatmap "Registro por tempo". Nada disso existe: não há rota, item de menu nem componente (`grep "Dashboard"` sem resultado em `Frontend/src`). O dono quer a tela numa aba própria, separada de "Visão Geral". O heatmap precisa das sessões da filial, mas `GET /api/sessions` sem `machineId` exige operador (`Backend/src/feature/session/sessionService.ts`, `exigirOperador`) e responde 403 ao admin, então o backend precisa de um ajuste pequeno.

## O que o PNG mostra (1440 px)

- Cabeçalho com o título "Dashboard" e, abaixo de uma linha, a seção **"Dados rápidos"** com 4 cartões brancos de borda cinza. Cada cartão tem um quadrado azul com ícone branco à esquerda, o número em destaque e o rótulo embaixo: "25 Máquinas cadastradas" (empilhadeira), "34 Funcionário cadastrados" (grupo de pessoas), "5 Máquinas em manutenção" (chave inglesa), "2 Máquinas Desativadas" (ferramentas riscadas).
- Seção **"Informações sobre as máquinas"** com dois painéis lado a lado:
  - **"Listagem de máquinas"** (ícone de empilhadeira), campo "Search..." com lupa e botão azul "+ Cadastrar Máquina". Tabela com colunas Nome (link azul, ex. "Empilhadeira Elétrica Titan-X"), Setor ("Expedição - Bloco B"), Tempo ("34 minutos") e Status (selo pequeno: Disponível verde, Em operação azul, Manutenção amarelo). Rodapé: "Exibindo 4 máquinas - Página 1 de 1", seta esquerda, caixa com o número da página e seta direita (setas azuis).
  - **"Registro por tempo"** (ícone de relógio): grade de 7 colunas (Seg, Ter, Quar, Quin, Sex, Sab, Dom) × 7 linhas (6, 8, 10, 12, 15, 16 e 18 hrs), células em 3 tons de azul e a legenda "Menos ■ ■ ■ Mais".
- Sidebar igual à atual (no Figma "Visão Geral" aparece ativa; o dono decidiu um item "Dashboard" próprio). Header com globo, sino com ponto vermelho e avatar (fora desta feature).

## Goals

- [ ] `/dashboard` abre pelo menu lateral e bate com o PNG nos elementos acima.
- [ ] Os 4 números batem com os dados da Visão Geral e da Equipe para a mesma filial.
- [ ] O heatmap conta as sessões reais da filial; o admin passa a poder listá-las sem afetar o colaborador.
- [ ] Todo texto novo entra nos 7 locales, no namespace `dashboard.*`.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Mudar a Visão Geral (`/`) | Decisão do dono: Dashboard é aba separada. |
| Status "desativada" novo ou ação "Desativar" | Outra pendência (`03`). "Desativadas" conta `offline`. |
| Editar, excluir ou mudar status pelo detalhe aberto no Dashboard | O detalhe aqui é só leitura; essas ações seguem na Visão Geral e na Frota. |
| Histórico de manutenção real no detalhe | Fora da lista do dono (hoje mock); a aba de manutenção abre vazia aqui. |
| Agregado do heatmap no servidor | A lista de sessões (limite 500) basta; só entra se o volume passar disso. |
| Sino, avatar e idioma do Header | São de `figma-alertas-dropdown` e `figma-perfil-admin`. |
| Filtro de período no heatmap | O Figma não desenha seletor; o período é fixo (ver Assumptions). |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| O que é "Máquinas Desativadas" | Máquinas com status `offline`. | Não existe status "desativada" (`MACHINE_STATUSES` em `data/machines.ts`). | n |
| "Máquinas em manutenção" | Máquinas com status `manutencao`. | Status já existe. | n |
| Origem do heatmap | `GET /api/sessions?from=…&filialId=…` (até 500 sessões, `LIMITE_HISTORICO`), contadas no navegador por dia da semana × faixa do horário de início, no fuso do navegador. | Rota e limite já existem. | n |
| **Correção do contexto:** o admin não lista sessões hoje | `sessionService.listar` (backend) passa a devolver, para `role === 'admin'` sem `machineId`, as sessões de todos os operadores do escopo. Colaborador segue vendo só as próprias. | O contexto diz "já existe a rota", mas sem `machineId` ela chama `exigirOperador` e o admin (sem `operadorId`) recebe 403. | n |
| Filtro de filial nas sessões | `filialId` opcional em `GET /api/sessions`; só reduz o escopo (interseção), igual a `listarMaquinas`. `filialId` mal formado: 400. | Hoje a rota não aceita filial, e o heatmap precisa seguir a filial ativa. | n |
| Período do heatmap | Últimas 4 semanas (hoje e os 27 dias anteriores), via `from`. O rótulo da legenda diz "Sessões nas últimas 4 semanas". | O Figma não define período; sem ele o heatmap mistura meses e "Sem registros no período" não teria período. | n |
| Faixas de horário | 6, 8, 10, 12, 15, 16 e 18 h do Figma. Cada linha conta as sessões que começam daquela hora até a próxima faixa; 18 h vai até 23:59; antes das 6 h fica fora. | O Figma não define o intervalo. | n |
| Níveis de cor | 0 sessões: claro; até metade do máximo da grade: médio; acima da metade: forte. | O Figma tem 3 tons e todas as células pintadas. | n |
| Coluna "Tempo" | `tempoSessaoMinutos` da máquina em minutos (plural traduzido), igual ao cartão da Visão Geral. | O Figma mostra "34 minutos", o mesmo valor do cartão. | n |
| Busca da tabela | Filtra por nome e identificação, sem diferenciar maiúsculas; volta à página 1 ao digitar. | Contexto DSH-03. `filterMachines` busca por identificação e setor, então a tabela usa filtro próprio. | n |
| Clique no nome | Abre `MachineDetailModal` sobre o Dashboard, sem Editar/Excluir/status (props omitidas). | Reusa o modal; ações de edição ficam fora do escopo. | n |
| **Acréscimo ao contexto:** "+ Cadastrar Máquina" | O botão abre o `NewMachinePanel` existente; ao salvar, a máquina entra na lista e nos cartões. | Está no PNG e o contexto não cobria. | n |
| Filial "todas" | Usa todas as filiais do escopo (sem `filialId`), como a Visão Geral. | Edge case do contexto. | n |
| Ícone do item "Dashboard" e posição no menu | `LayoutDashboard` do `lucide-react`, primeiro item, antes de "Visão Geral". | Sem desenho no Figma; o primeiro item é a tela de resumo. | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P2: Dashboard

**User Story**: As an admin, I want a summary page so that I see the fleet and usage at a glance.

**Why P2**: Figma `02/02`. Aba nova no menu, distinta de Visão Geral (decisão do dono).

**Independent Test**: Com o seed, os 4 números batem com a Visão Geral e a Equipe, a tabela pagina e o heatmap pinta as células das sessões das últimas 4 semanas.

**Acceptance Criteria**:

1. WHEN o admin clica em "Dashboard" no menu lateral THEN the system SHALL abrir `/dashboard` com o título "Dashboard" no cabeçalho  <!-- event-driven -->
2. The system SHALL mostrar, sob "Dados rápidos", 4 cartões com ícone, número e rótulo: máquinas cadastradas, funcionários cadastrados, máquinas em manutenção (`manutencao`) e máquinas desativadas (`offline`), calculados da filial ativa  <!-- ubiquitous -->
3. The system SHALL mostrar a "Listagem de máquinas" com as colunas Nome, Setor, Tempo e Status, 10 linhas por página, e um campo de busca que filtra por nome e identificação e volta à página 1  <!-- ubiquitous -->
4. WHEN a lista ou a página muda THEN the system SHALL mostrar "Exibindo N máquinas - Página X de Y" (N = total filtrado) e habilitar cada seta só quando houver página vizinha  <!-- event-driven -->
5. WHEN o admin clica no nome de uma máquina THEN the system SHALL abrir o detalhe da máquina sem os botões de editar, excluir e mudar status  <!-- event-driven -->
6. The system SHALL mostrar o heatmap "Registro por tempo" com Seg a Dom × 6, 8, 10, 12, 15, 16 e 18 hrs, 3 tons de azul e a legenda "Menos … Mais", contando as sessões das últimas 4 semanas da filial ativa pela hora de início  <!-- ubiquitous -->
7. IF não houver sessão no período THEN the system SHALL pintar todas as células no tom mais claro e mostrar "Sem registros no período" abaixo do heatmap  <!-- unwanted-behavior -->
8. IF a carga de máquinas, de funcionários ou de sessões falhar THEN the system SHALL mostrar mensagem de erro com "Tentar de novo" só na área que depende dela e manter as demais  <!-- unwanted-behavior -->
9. WHILE os dados carregam, the system SHALL mostrar skeletons no formato dos cartões, da tabela e do heatmap  <!-- state-driven -->
10. WHEN o admin troca a filial ativa THEN the system SHALL voltar aos skeletons e recarregar os três dados da nova filial  <!-- event-driven -->
11. The system SHALL manter "Visão Geral" como está e marcar o item "Dashboard" como ativo (`aria-current="page"`) só em `/dashboard`  <!-- ubiquitous -->
12. WHEN o admin salva uma máquina pelo "+ Cadastrar Máquina" THEN the system SHALL incluí-la na tabela e no cartão de máquinas cadastradas e mostrar o toast de máquina criada  <!-- event-driven -->
13. IF a busca não encontrar máquina THEN the system SHALL mostrar "Nenhuma máquina encontrada" na tabela e "Exibindo 0 máquinas - Página 1 de 1" com as duas setas desabilitadas  <!-- unwanted-behavior -->
14. WHEN um admin chama `GET /api/sessions` sem `machineId` THEN the system SHALL devolver as sessões de todos os operadores das filiais do escopo, reduzidas ao `filialId` informado, até 500, da mais nova para a mais antiga  <!-- event-driven -->
15. IF `GET /api/sessions` recebe `filialId` que não é ObjectId THEN the system SHALL responder 400 sem consultar sessões  <!-- unwanted-behavior -->
16. WHILE o usuário é colaborador, the system SHALL seguir listando em `GET /api/sessions` sem `machineId` só as sessões do próprio operador, e responder 403 a quem não tem operador nem é admin  <!-- state-driven -->

---

## Edge Cases

- IF o `filialId` informado estiver fora do escopo THEN the system SHALL devolver lista vazia (a interseção não amplia o escopo).
- IF uma sessão começa antes das 6 h THEN the system SHALL deixá-la fora do heatmap.
- WHEN o total de máquinas é múltiplo de 10 THEN the system SHALL não criar página vazia (ex.: 20 máquinas = 2 páginas).
- IF a máquina aberta no detalhe some da lista (troca de filial) THEN the system SHALL fechar o detalhe.
- IF o cadastro pelo "+ Cadastrar Máquina" falhar THEN the system SHALL tirar a máquina da lista e mostrar o toast de erro, como a Visão Geral.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| DSH-01 | P2: Dashboard | Tasks | Pending |
| DSH-02 | P2: Dashboard | Tasks | Pending |
| DSH-03 | P2: Dashboard | Tasks | Pending |
| DSH-04 | P2: Dashboard | Tasks | Pending |
| DSH-05 | P2: Dashboard | Tasks | Pending |
| DSH-06 | P2: Dashboard | Tasks | Pending |
| DSH-07 | P2: Dashboard | Tasks | Pending |
| DSH-08 | P2: Dashboard | Tasks | Pending |
| DSH-09 | P2: Dashboard | Tasks | Pending |
| DSH-10 | P2: Dashboard | Tasks | Pending |
| DSH-11 | P2: Dashboard | Tasks | Pending |
| DSH-12 | P2: Dashboard | Tasks | Pending |
| DSH-13 | P2: Dashboard | Tasks | Pending |
| DSH-14 | P2: Dashboard | Tasks | Pending |
| DSH-15 | P2: Dashboard | Tasks | Pending |
| DSH-16 | P2: Dashboard | Tasks | Pending |

**ID format:** `DSH-NN`, na ordem dos critérios de aceite.

**Coverage:** 16 total, 16 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `yarn test` do Backend e do Frontend passam sem teste removido; `yarn build` (tsc) e `yarn lint` do Frontend limpos.
- [ ] Cada critério DSH tem um teste que falha se o comportamento quebrar.
- [ ] Em 1440 px, `/dashboard` bate com o PNG nos elementos listados em "O que o PNG mostra".
- [ ] O Dashboard fica num chunk lazy próprio (rotas já usam `lazy`); bundle de entrada ≤ 100 kB gzip.
