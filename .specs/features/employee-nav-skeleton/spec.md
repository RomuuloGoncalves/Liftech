# Retorno à sessão, animação do menu e skeleton do funcionário Specification

## Problem Statement

Quem inicia uma sessão e troca de tela só volta ao cronômetro digitando a URL, porque nenhuma aba aponta para `/funcionario/sessao`. A barra inferior do celular troca de aba sem transição, o conteúdo aparece de uma vez e as telas do funcionário abrem direto, sem o skeleton de carregamento que as telas do administrador já têm.

## Goals

- [ ] Com sessão ativa, qualquer tela do funcionário mostra um atalho para a sessão com o tempo decorrido.
- [ ] A troca de tela anima o indicador da barra inferior e a entrada do conteúdo.
- [ ] Todas as telas do funcionário mostram skeleton na primeira visita, como as do administrador.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Skeleton nas telas do administrador | `VisaoGeral`, `Frota`, `Equipe` e `Alertas` já usam `useFirstVisitLoading` e `PageSkeleton` |
| Skeleton em login e solicitar acesso | Telas de formulário sem lista de dados |
| Transição entre telas do administrador | Pedido só para o menu do celular do funcionário |
| Notificação quando a sessão passa de um limite de tempo | Não existe no Figma |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Atalho da sessão | Barra "Sessão em andamento" com nome da máquina, cronômetro `HH:MM:SS` e seta, fixa logo acima da barra inferior, em todas as telas do funcionário exceto `/funcionario/sessao` | O Figma não tem o elemento; uma barra acima das abas dá acesso em um toque sem trocar as 4 abas do Figma | n |
| Abertura sobre sheets | A barra fica abaixo dos sheets e do overlay | Sheets são modais | n |
| Animação do menu | O círculo azul da aba ativa desliza até a nova aba em 250ms (`cubic-bezier(0.23, 1, 0.32, 1)`) | Dono pediu animação ao trocar de tela | n |
| Animação do conteúdo | Fade e subida de 8px em 200ms a cada troca de seção (`/funcionario`, `maquinas`, `historico`, `sessao`, `ocorrencia`, `configuracoes`); abrir o detalhe em `maquinas/:id` não repete | A chave é a seção, não o caminho completo | n |
| Movimento reduzido | Com `prefers-reduced-motion: reduce` não há deslize nem fade | Regra global de `index.css` já encurta animações; a spec exige ausência | n |
| Skeleton | `useFirstVisitLoading` por tela (chaves `employee-*`) e um componente de skeleton com a mesma estrutura de cada tela | Reuso do padrão das telas do administrador | y |
| Skeleton no sheet de ocorrência | Campos do formulário em skeleton dentro do sheet; o fundo não carrega | A tela é um sheet | n |
| Skeleton da configurações | Uma linha de título | O frame só tem cabeçalho | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Voltar à sessão ativa ⭐ MVP

**User Story**: As a funcionário, I want voltar à minha sessão de qualquer tela so that eu veja o tempo e a encerre sem digitar a URL.

**Why P1**: Hoje o usuário perde o acesso ao cronômetro.

**Acceptance Criteria**:

1. WHILE existe sessão ativa AND a rota não é `/funcionario/sessao` THE layout SHALL exibir a barra "Sessão em andamento" com o nome da máquina e o cronômetro `HH:MM:SS` atualizado a cada segundo.
2. WHEN o usuário toca na barra THEN the app SHALL navegar para `/funcionario/sessao`.
3. WHILE não existe sessão ativa THE layout SHALL NOT exibir a barra.
4. WHILE a rota é `/funcionario/sessao` THE layout SHALL NOT exibir a barra.
5. WHEN a sessão é encerrada THEN the barra SHALL desaparecer.
6. The conteúdo das telas SHALL manter espaço para não ficar sob a barra e a barra inferior.

### P2: Animação ao trocar de tela

**User Story**: As a funcionário, I want ver a troca de tela animada so that a navegação pareça contínua.

**Why P2**: Pedido de acabamento; não bloqueia o fluxo.

**Acceptance Criteria**:

1. WHEN a rota muda para outra aba THEN the círculo azul SHALL se mover da aba anterior para a nova com transição de 250ms.
2. WHEN a seção da rota muda THEN the conteúdo SHALL entrar com fade e subida de 8px em 200ms.
3. WHEN o detalhe de máquina abre em `maquinas/:id` THEN the conteúdo SHALL NOT repetir a animação de entrada.
4. WHILE `prefers-reduced-motion: reduce` está ativo THE indicador SHALL mudar de aba sem transição e o conteúdo SHALL aparecer sem animação.

### P2: Skeleton em todas as telas do funcionário

**User Story**: As a funcionário, I want ver o skeleton enquanto a tela carrega so that eu perceba que o app responde.

**Why P2**: Consistência com as telas do administrador.

**Acceptance Criteria**:

1. WHEN o usuário abre pela primeira vez a Visão geral, Empilhadeiras, Histórico, Sessão ou Configurações THEN the tela SHALL exibir o skeleton com `aria-busy="true"` até o atraso simulado terminar.
2. WHEN o usuário abre pela primeira vez Reportar ocorrência THEN the sheet SHALL exibir os campos em skeleton até o atraso simulado terminar.
3. WHEN o usuário volta a uma tela já visitada THEN the app SHALL exibir o conteúdo sem skeleton.
4. The skeleton SHALL ocupar o mesmo layout do conteúdo (mesma grade de colunas por largura).
5. WHILE o skeleton está visível THE tela SHALL anunciar `common.loading` a leitores de tela.

---

## Edge Cases

- WHEN a página é recarregada com sessão ativa em `/funcionario` THEN the barra SHALL aparecer com o tempo contado a partir do início guardado.
- WHEN a máquina da sessão não existe em `MACHINES` THEN the barra SHALL exibir só "Sessão em andamento" e o cronômetro.
- WHEN o sheet de detalhe ou de ocorrência está aberto THEN the barra SHALL ficar atrás do overlay.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| NAV-01 | P1 Sessão: AC1, AC3, AC4, AC5; Edge: máquina inexistente, recarregar | Execute | Pending |
| NAV-02 | P1 Sessão: AC2, AC6; Edge: overlay | Execute | Pending |
| NAV-03 | P2 Animação: AC1, AC4 | Execute | Pending |
| NAV-04 | P2 Animação: AC2, AC3, AC4 | Execute | Pending |
| NAV-05 | P2 Skeleton: AC1, AC3, AC5 | Execute | Pending |
| NAV-06 | P2 Skeleton: AC2, AC4 | Execute | Pending |

---

## Success Criteria

- [ ] Com sessão ativa, de qualquer tela chega-se ao cronômetro em um toque.
- [ ] A troca de aba anima o círculo azul e o conteúdo; com movimento reduzido nada anima.
- [ ] As 6 telas do funcionário mostram skeleton na primeira visita e conteúdo nas seguintes.
- [ ] Lint, `tsc -b`, build e testes passam, exceto as 3 falhas antigas de `34 min`.
