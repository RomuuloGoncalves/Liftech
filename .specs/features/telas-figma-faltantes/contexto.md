# Telas do Figma que faltam: contexto compartilhado

> Rascunho de pesquisa feito pelo nível 1 (não é uma spec validada). Cada tela tem a sua feature em `.specs/features/figma-<tela>/` com `spec.md`, `design.md` e `tasks.md` escritos pelo orquestrador dela, usando este arquivo como entrada. As histórias e critérios abaixo são o ponto de partida; o orquestrador pode corrigi-los se o código ou o PNG provar outra coisa, registrando o motivo.

## Problem Statement

A auditoria `.specs/features/auditoria-figma/RELATORIO.md` achou 7 telas ou ações do Figma sem implementação: splash, modal de feedback, dashboard, dropdown de alertas recentes, perfil, modal "Alerta!" e modal de explicação de nível crítico. Quatro delas (alertas, perfil, feedback, dashboard) precisam de backend que não existe. O dono quer todas planejadas numa única branch (`fix/crud-funcionario-integridade`), sem commit por enquanto.

## Goals

- [ ] As 7 telas existem e batem com os PNGs de `figma-telas/` nos elementos listados nas histórias abaixo.
- [ ] Uma aba "Dashboard" existe no menu lateral do admin, separada de "Visão Geral" (decisão do dono, diverge do Figma).
- [ ] O modal "Alerta!" dispara sozinho para incidente novo e pode ser simulado pelo bloco DEV da sidebar, sem backend.
- [ ] Todo texto novo entra nos 7 locales (`de`, `en-US`, `es`, `fr`, `ja`, `pt-BR`, `ru`).
- [ ] Backend: 0 acesso ao banco nos testes (models mockados, AD-010); `tsc`, `eslint` e as suítes dos dois pacotes seguem verdes.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Política e Privacidade (página) | Fora da lista do dono. O texto jurídico vem dele; o link continua indo ao 404 até lá. |
| Recuperação de senha | Fora da lista; o link "Esqueceu a senha" segue sem ação. |
| Ações de manutenção no detalhe (Enviar/Completar), "Desativar" | Fora da lista; ficam para outro planejamento. |
| Histórico de manutenção real (hoje mock) | Fora da lista. |
| Notificações push, WebSocket ou e-mail | O alerta usa polling; infra de tempo real é decisão futura. |
| Lida/não lida de alerta salva no servidor | Basta guardar o último alerta visto no navegador (ver Assumptions). |
| Perfil do funcionário como tela nova | Já existe: `funcionario/09-configuracoes` (Dados do usuário + Deslogar). Só falta o envio do feedback. |
| Mudanças visuais fora das 7 telas | Cobertas pela auditoria, não por esta spec. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quem tem Perfil | Só o admin. O funcionário já tem "Dados do usuário" em Configurações, somente leitura, com texto mandando pedir alteração ao supervisor. | O Figma do funcionário (`09`) não tem e-mail, senha nem exclusão de conta. O colaborador não tem e-mail (loga por `usuario`). | y (Figma) |
| Olho que mostra a senha no Perfil | Não mostra a senha. O campo exibe `••••••••` e só tem o lápis de editar. | A senha é guardada só como hash, então não existe o que revelar. Desvio do Figma. | n |
| Editar e-mail e senha | Um modal pede a senha atual e grava o novo valor. A senha nova tem 8+ caracteres. | Trocar credencial sem pedir a atual deixa uma sessão roubada trancar o dono fora. | n |
| Excluir Conta | Pede a senha atual e uma confirmação. Recusa com 409 se for o único admin da empresa. | Apagar o último admin deixa a empresa sem ninguém que a gerencie. | n |
| O que é "Máquinas Desativadas" no Dashboard | Máquinas com status `offline`. | Não existe status "desativada". "Desativar" no detalhe (Figma `03`) é outra pendência. | n |
| Origem do heatmap "Registro por tempo" | Sessões de trabalho (`GET /api/sessions`, até 500 do `LIMITE_HISTORICO`), contadas por dia da semana × faixa de horário do início. Cálculo no navegador. | Já existe a rota e o limite. Um agregado no servidor só entra se a lista passar de 500. O Figma não diz o que o heatmap mede, então o rótulo da tela diz "sessões". | n |
| Faixas de horário do heatmap | As 7 do Figma: 6, 8, 10, 12, 15, 16 e 18 h. Cada linha conta as sessões que começam daquela hora até a próxima faixa. A faixa 18 h vai até 23:59. Sessões antes das 6 h ficam fora. | O Figma não define o intervalo. | n |
| Quando o splash aparece | Uma vez por aba do navegador, ao abrir qualquer rota do admin ou do login, por 1,5 s, e depois segue a rota pedida. Nunca aparece na área do funcionário (o Figma do splash é 1440 px). | `sessionStorage` marca que já foi visto. Com `prefers-reduced-motion`, o splash não aparece. | n |
| Quais incidentes disparam o "Alerta!" | Todo incidente novo da filial (sensor ou reportado por funcionário), com data posterior ao último visto. O primeiro carregamento só fixa a marca, sem disparar. | O Figma só mostra "Acidente no setor…". Incidente de funcionário também é acidente reportado. | n |
| Intervalo do polling | 15 s, só com a aba visível, parando no logout e fora das rotas do admin. | Equilibra atraso do alerta e carga. A rota de incidentes já é limitada a 500. | n |
| Alerta sem setor ou sem funcionário | O texto troca o trecho que falta por "não informado". | `maquina.setor` e `operador` podem ser nulos na API. | n |
| "Lido" do sino | O ponto vermelho some quando o dropdown abre. O id do último incidente visto fica no `localStorage`, por usuário. | Sem backend de leitura. Vale por navegador. | n |
| Lista do dropdown de alertas | Os 5 incidentes mais recentes da filial ativa. O botão "Mais" leva a `/alertas`. Cada linha leva a `/alertas` também. | O Figma mostra 5 linhas e um botão "Mais". Não define o destino de cada linha. | n |
| Armazenamento do feedback | Nova coleção `feedback` (mensagem de até 1000 caracteres, usuário, empresa, papel, data). Sem tela de leitura nesta entrega: o dono consulta pelo banco. | O Figma só desenha o envio. | n |
| Feedback do funcionário | A caixa de Configurações passa a enviar para a mesma rota, com botão "Enviar". | Hoje a caixa não envia nada e a chave `employee.settings.feedbackPlaceholder` não existe em nenhum locale. | n |
| Rota de dev do alerta | O bloco "DEV" da sidebar ganha o botão "Simular alerta", que abre o modal com dados de exemplo. Aparece junto do bloco DEV atual. | Pedido do dono. O bloco já é temporário (`TEMP_AUTH_LINKS`). | y (dono) |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Modal "Alerta!" com atalho de simulação ⭐ MVP

**User Story**: As an admin, I want a blocking alert when an accident is reported so that I notice it even on another screen.

**Why P1**: É o núcleo do produto (segurança) e o Figma `02/12`. As histórias de dropdown e entrega de alerta dependem do mesmo hook de polling.

**Acceptance Criteria**:

1. WHEN o polling encontra um incidente da filial ativa com data posterior ao último visto THEN the system SHALL abrir o modal "Alerta!" com o texto "Acidente no setor {setor}, {funcionário} funcionário responsável pela máquina {identificacao}."  <!-- event-driven -->
2. WHILE o modal "Alerta!" está aberto and chega outro incidente novo, the system SHALL enfileirá-lo e abri-lo depois do "Ok"  <!-- state-driven -->
3. WHEN o admin clica em "Ok" or pressiona Esc THEN the system SHALL fechar o modal and gravar o incidente como visto  <!-- event-driven -->
4. WHEN o admin carrega a página pela primeira vez na sessão THEN the system SHALL apenas fixar a marca do último incidente visto, sem abrir o modal  <!-- event-driven -->
5. IF o setor or o funcionário do incidente for nulo THEN the system SHALL escrever "não informado" no lugar do trecho  <!-- unwanted-behavior -->
6. IF a chamada de polling falhar THEN the system SHALL manter o estado atual, tentar de novo no próximo ciclo e não abrir o modal  <!-- unwanted-behavior -->
7. WHEN o admin clica em "Simular alerta" no bloco DEV da sidebar THEN the system SHALL abrir o modal "Alerta!" com setor "Expedição - Bloco B", funcionário "Alexandre Mattos" e máquina "EMP-084(ID)", sem chamar a API  <!-- event-driven -->
8. The system SHALL exibir o modal com ícone de alerta vermelho, título "Alerta!" em vermelho, texto com setor, funcionário e máquina em negrito, e botão "Ok" azul  <!-- ubiquitous -->
9. WHILE o admin está em rota fora do shell do admin (login, funcionário), the system SHALL não rodar o polling  <!-- state-driven -->

**Independent Test**: No navegador, clicar em "Simular alerta" abre o modal igual ao Figma. Com a API, criar um incidente (POST de funcionário com sessão) e ver o modal em até 15 s.

---

### P1: Dropdown de alertas recentes no sino ⭐ MVP

**User Story**: As an admin, I want to see the latest alerts from the bell so that I can jump to them.

**Why P1**: Figma `02/06`. Usa a mesma fonte de dados do modal.

**Acceptance Criteria**:

1. WHEN o admin clica no sino THEN the system SHALL abrir o popover "Alertas Recentes" com os 5 incidentes mais recentes da filial ativa, cada linha com o nome da máquina em vermelho e uma seta  <!-- event-driven -->
2. WHEN o admin clica em "Mais" or em uma linha THEN the system SHALL navegar para `/alertas` e fechar o popover  <!-- event-driven -->
3. WHEN o admin clica no X, fora do popover or pressiona Esc THEN the system SHALL fechar o popover  <!-- event-driven -->
4. WHILE existe incidente mais novo que o último visto, the system SHALL mostrar um ponto vermelho no sino  <!-- state-driven -->
5. WHEN o popover abre THEN the system SHALL gravar o incidente mais recente como visto e esconder o ponto  <!-- event-driven -->
6. IF não houver incidente THEN the system SHALL mostrar o texto "Nenhum alerta recente"  <!-- unwanted-behavior -->
7. IF a lista falhar ao carregar THEN the system SHALL mostrar "Não foi possível carregar os alertas" com botão "Tentar de novo"  <!-- unwanted-behavior -->
8. The system SHALL dar ao sino `aria-label` traduzido, `aria-expanded` e foco devolvido ao botão ao fechar  <!-- ubiquitous -->

**Independent Test**: Com 2 incidentes no banco, o sino mostra o ponto, abre com 2 linhas e o ponto some.

---

### P1: Modal de explicação de nível crítico ⭐ MVP

**User Story**: As an admin, I want to understand the urgency levels so that I know what each color means.

**Why P1**: Figma `05/03`. Não depende de backend e fecha a tela de alertas.

**Acceptance Criteria**:

1. WHEN o admin clica no botão "?" da barra de ferramentas do Histórico de Alertas THEN the system SHALL abrir o modal "Informações sobre nível crítico"  <!-- event-driven -->
2. The system SHALL listar Crítico (vermelho, tombamento), Alta (laranja, colisão) e Média (amarelo, frenagem brusca), na ordem do Figma, lendo os pares causa → nível de `ACCIDENT_URGENCY`  <!-- ubiquitous -->
3. WHEN o admin clica no X, no fundo ou pressiona Esc THEN the system SHALL fechar o modal  <!-- event-driven -->
4. The system SHALL dar ao botão "?" um nome acessível traduzido  <!-- ubiquitous -->

**Independent Test**: Em `/alertas`, o "?" abre o modal com 3 cartões.

---

### P2: Modal de feedback e sugestões

**User Story**: As an admin or employee, I want to send feedback so that the team learns what to improve.

**Why P2**: Figma admin `06/01` e funcionário `09`. Precisa de rota nova.

**Acceptance Criteria**:

1. WHEN o admin clica em "Feedback & Sugestões" na sidebar THEN the system SHALL abrir o modal "Envie-nos feedback ou uma sugestão" com a pergunta "Como foi sua experiência?", um textarea e o botão "Enviar"  <!-- event-driven -->
2. WHEN o usuário envia mensagem com 1 a 1000 caracteres (depois de `trim`) THEN the system SHALL chamar `POST /api/feedback`, fechar o modal e mostrar o toast "Feedback enviado. Obrigado!"  <!-- event-driven -->
3. IF a mensagem estiver vazia ou só com espaços THEN the system SHALL desabilitar "Enviar" e não chamar a API  <!-- unwanted-behavior -->
4. IF o envio falhar THEN the system SHALL manter o modal aberto com o texto digitado e mostrar o toast de erro  <!-- unwanted-behavior -->
5. WHILE o envio está em andamento, the system SHALL desabilitar "Enviar" e ignorar cliques repetidos  <!-- state-driven -->
6. WHEN o funcionário clica em "Enviar" na caixa de Configurações THEN the system SHALL enviar à mesma rota e limpar a caixa  <!-- event-driven -->
7. The system SHALL traduzir o placeholder do textarea nos 7 locales, corrigindo a chave `employee.settings.feedbackPlaceholder` que hoje não existe  <!-- ubiquitous -->
8. WHEN `POST /api/feedback` recebe mensagem válida de usuário autenticado THEN the system SHALL gravar mensagem, usuário, empresa, papel e data e responder 201  <!-- event-driven -->
9. IF `POST /api/feedback` recebe mensagem vazia, não textual ou com mais de 1000 caracteres THEN the system SHALL responder 400 sem gravar  <!-- unwanted-behavior -->
10. IF `POST /api/feedback` chega sem token válido THEN the system SHALL responder 401  <!-- unwanted-behavior -->

**Independent Test**: Enviar um feedback pelo admin e pelo funcionário e ver os 2 documentos (consulta pelo dono).

---

### P2: Perfil do admin

**User Story**: As an admin, I want to see and change my account data so that I control my access.

**Why P2**: Figma `02/07`. Precisa de rotas de conta que não existem.

**Acceptance Criteria**:

1. WHEN o admin clica no avatar do cabeçalho THEN the system SHALL abrir o modal "Perfil" com e-mail, senha mascarada, "Excluir Conta" e "Deslogar-se"  <!-- event-driven -->
2. WHEN o admin clica em "Deslogar-se" THEN the system SHALL encerrar a sessão local e ir para `/login`  <!-- event-driven -->
3. WHEN o admin confirma novo e-mail com a senha atual correta THEN the system SHALL chamar `PUT /api/me` e atualizar o e-mail exibido e a sessão local  <!-- event-driven -->
4. WHEN o admin confirma nova senha (8+ caracteres) com a senha atual correta THEN the system SHALL chamar `PUT /api/me` e mostrar o toast "Senha alterada"  <!-- event-driven -->
5. IF a senha atual estiver errada THEN the system SHALL responder 403 e manter o modal de edição aberto com a mensagem "Senha atual incorreta"  <!-- unwanted-behavior -->
6. IF o novo e-mail já pertencer a outro usuário THEN the system SHALL responder 409 e mostrar "E-mail já em uso"  <!-- unwanted-behavior -->
7. IF o e-mail novo for inválido or a senha nova tiver menos de 8 caracteres THEN the system SHALL responder 400 e não gravar  <!-- unwanted-behavior -->
8. WHEN o admin confirma "Excluir Conta" com a senha atual correta THEN the system SHALL chamar `DELETE /api/me`, encerrar a sessão local e ir para `/login`  <!-- event-driven -->
9. IF o admin for o único admin da empresa THEN the system SHALL responder 409 em `DELETE /api/me` e mostrar "Você é o único administrador da empresa"  <!-- unwanted-behavior -->
10. IF um colaborador chamar `PUT /api/me` or `DELETE /api/me` THEN the system SHALL responder 403  <!-- unwanted-behavior -->
11. The system SHALL nunca devolver nem exibir `senhaHash` ou a senha  <!-- ubiquitous -->
12. WHILE a gravação está em andamento, the system SHALL desabilitar os botões do modal de edição  <!-- state-driven -->

**Independent Test**: Trocar a senha pelo modal, sair e logar com a nova. Tentar excluir o único admin e ver o 409.

---

### P2: Dashboard

**User Story**: As an admin, I want a summary page so that I see the fleet and usage at a glance.

**Why P2**: Figma `02/02`. Aba nova no menu, distinta de Visão Geral (decisão do dono).

**Acceptance Criteria**:

1. WHEN o admin clica em "Dashboard" no menu lateral THEN the system SHALL abrir `/dashboard` com o título "Dashboard"  <!-- event-driven -->
2. The system SHALL mostrar 4 cartões de "Dados rápidos": máquinas cadastradas, funcionários cadastrados, máquinas em manutenção e máquinas desativadas (status `offline`), calculados da filial ativa  <!-- ubiquitous -->
3. The system SHALL mostrar a "Listagem de máquinas" com nome, setor, tempo e status, 10 por página, com busca por nome e identificação  <!-- ubiquitous -->
4. WHEN o admin muda de página THEN the system SHALL mostrar "Exibindo N máquinas - Página X de Y" e habilitar as setas só quando houver página vizinha  <!-- event-driven -->
5. WHEN o admin clica no nome de uma máquina THEN the system SHALL abrir o detalhe da máquina  <!-- event-driven -->
6. The system SHALL mostrar o heatmap "Registro por tempo" (dias da semana × 7 faixas), com 3 níveis de azul e legenda "Menos … Mais", contando as sessões de trabalho da filial ativa  <!-- ubiquitous -->
7. IF não houver sessão THEN the system SHALL mostrar todas as células no nível mais claro e o texto "Sem registros no período" abaixo do heatmap  <!-- unwanted-behavior -->
8. IF alguma das cargas falhar THEN the system SHALL mostrar mensagem de erro na área afetada e manter as demais  <!-- unwanted-behavior -->
9. WHILE os dados carregam, the system SHALL mostrar skeletons do mesmo formato da página  <!-- state-driven -->
10. WHEN o admin troca a filial ativa THEN the system SHALL recarregar os dados da nova filial  <!-- event-driven -->
11. The system SHALL manter "Visão Geral" como está e o item "Dashboard" ativo só em `/dashboard`  <!-- ubiquitous -->

**Independent Test**: Com o seed, os 4 números batem com a Visão Geral e o heatmap pinta as células das sessões.

---

### P3: Splash

**User Story**: As a user, I want a brand screen on first load so that the app feels finished.

**Why P3**: Figma `01/01`. Só visual.

**Acceptance Criteria**:

1. WHEN o admin abre o app numa aba nova THEN the system SHALL mostrar a splash (gradiente azul com a logo Liftech centralizada) por 1,5 s e seguir para a rota pedida  <!-- event-driven -->
2. WHILE a splash já foi vista na aba, the system SHALL não mostrá-la de novo  <!-- state-driven -->
3. WHERE o usuário tem `prefers-reduced-motion: reduce` the system SHALL pular a splash  <!-- optional-feature -->
4. IF a rota pedida for da área do funcionário THEN the system SHALL não mostrar a splash  <!-- unwanted-behavior -->
5. The system SHALL esconder o conteúdo da rota até a splash acabar e anunciar o app com `aria-label` "Liftech"  <!-- ubiquitous -->

**Independent Test**: Abrir `/login` numa aba anônima mostra a splash por 1,5 s; recarregar na mesma aba não mostra.

---

## Edge Cases

- IF o admin não tem filial ativa (todas as filiais) THEN the system SHALL usar todas as filiais do escopo no Dashboard, no polling e no dropdown, como a Visão Geral faz.
- WHEN dois incidentes chegam no mesmo ciclo THEN the system SHALL mostrar um modal por vez, do mais antigo para o mais novo.
- IF o `localStorage` estiver bloqueado THEN the system SHALL tratar o último visto como vazio e não repetir modal na mesma sessão.
- WHEN o texto do alerta é longo THEN the system SHALL quebrar linha dentro do modal sem estourar a largura de 470 px do Figma.
- IF o admin troca o e-mail para o mesmo que já tem THEN the system SHALL responder 200 sem alterar nada.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MAL-01..09 | P1: Modal "Alerta!" | Tasks | Pending |
| ALR-01..08 | P1: Dropdown de alertas | Tasks | Pending |
| EXP-01..04 | P1: Modal de explicação | Tasks | Pending |
| FDB-01..10 | P2: Feedback | Tasks | Pending |
| PRF-01..12 | P2: Perfil | Tasks | Pending |
| DSH-01..11 | P2: Dashboard | Tasks | Pending |
| SPL-01..05 | P3: Splash | Tasks | Pending |

**ID format:** `[CATEGORY]-[NUMBER]` (a ordem segue a lista de critérios de cada história).

**Coverage:** 59 total, 59 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `yarn test` do Backend e `yarn test` do Frontend passam, sem teste removido, e `tsc` e `eslint` ficam limpos.
- [ ] Cada critério acima tem um teste que falha se o comportamento quebrar.
- [ ] No navegador do Orca, as 7 telas abrem iguais ao PNG correspondente em 1440 px (admin).
- [ ] O bundle de entrada continua ≤ 100 kB gzip (hoje 94,29 kB); Dashboard e modais ficam em chunks lazy.


---

## Divisão por tela (1 orquestrador cada)

| Feature (pasta em `.specs/features/`) | Tela do Figma | Prefixo dos IDs | Onda |
| --- | --- | --- | --- |
| `figma-splash` | `admin/01-autenticacao/01-splash.png` | SPL | 1 |
| `figma-explicacao-nivel` | `admin/05-historico-de-alertas/03-modal-explicacao-categoria.png` | EXP | 1 |
| `figma-dashboard` | `admin/02-visao-geral-maquinas/02-visao-geral-variante.png` | DSH | 1 |
| `figma-feedback` | `admin/06-outros/01-feedback-e-sugestoes.png` + caixa em `funcionario/09-configuracoes.png` | FDB | 1 |
| `figma-modal-alerta` | `admin/02-visao-geral-maquinas/12-modal-alert.png` (dono do polling e do contexto de alertas) | MAL | 2 |
| `figma-perfil-admin` | `admin/02-visao-geral-maquinas/07-gestao-da-frota-ativo-2.png` | PRF | 2 |
| `figma-alertas-dropdown` | `admin/02-visao-geral-maquinas/06-gestao-da-frota-ativo-1.png` (consome o contexto de alertas) | ALR | 3 |

## Contratos compartilhados (fixos; não mude sem avisar o nível 1)

- **Contexto de alertas** (dono: `figma-modal-alerta`; arquivo `Frontend/src/context/AlertsContext.tsx`, montado no `AppShell` de `App.tsx`): `interface AlertsContextValue { recent: Incidente[]; loading: boolean; error: boolean; hasUnseen: boolean; markSeen(): void; reload(): void; simulate(): void }`. `recent` traz os 5 incidentes mais novos da filial ativa. `figma-alertas-dropdown` só consome; não faz polling próprio.
- **Feedback**: `POST /api/feedback` com `{ mensagem: string }` (1 a 1000 caracteres depois do `trim`), resposta 201. Serviço front: `feedbackService.enviar(mensagem)`. O modal do admin e a caixa do funcionário usam o mesmo serviço.
- **Conta**: `PUT /api/me` com `{ senhaAtual, email? , novaSenha? }` e `DELETE /api/me` com `{ senhaAtual }`, ambos atrás de `autenticar` e só para `role === 'admin'`.
- **Menu**: o item "Dashboard" entra em `Frontend/src/components/layout/Sidebar.tsx` (array de navegação) e a rota `/dashboard` em `routes/appRoutes.tsx` e `Header.tsx` (`ROUTE_KEYS`). Dono: `figma-dashboard`.

## Arquivos disputados e como evitar conflito

Os orquestradores trabalham em worktrees separadas e o nível 1 integra os diffs na branch `fix/crud-funcionario-integridade`, sem commit.

| Arquivo | Quem mexe | Regra |
| --- | --- | --- |
| `Frontend/src/locales/*/translation.json` (7) | todos | Cada feature só **acrescenta** um bloco novo no próprio namespace (`splash.*`, `levelInfo.*`, `dashboard.*`, `feedback.*`, `alertModal.*`, `profile.*`, `alertsDropdown.*`) e nunca edita chaves existentes, exceto `figma-feedback`, que corrige `employee.settings.feedbackPlaceholder`. O nível 1 faz o merge. |
| `Frontend/src/components/layout/Sidebar.tsx` | dashboard (nav), feedback (botão), modal-alerta (botão DEV) | Cada um edita só o seu trecho. |
| `Frontend/src/components/layout/Header.tsx` | perfil (avatar), alertas-dropdown (sino) | Idem. Perfil termina antes do dropdown. |
| `Frontend/src/App.tsx` | splash (envolve o shell), modal-alerta (provider) | Idem. |
| `Frontend/src/routes/appRoutes.tsx` | dashboard | Só dashboard. |
| `Backend/src/app.ts` | feedback (`/api/feedback`), perfil (`/api/me`) | Uma linha cada. |

## Regras para cada orquestrador

1. Só leitura no código. Escreva **somente** `spec.md`, `design.md` e `tasks.md` da sua pasta `.specs/features/figma-<tela>/`. Sem commit, sem `git push`, sem instalar pacote, sem acessar banco.
2. Siga a skill `tlc-spec-driven` (Specify → Design → Tasks). Rode `validate_spec.py` e `validate_tasks.py` e corrija até passarem. Cada ID de requisito vem em linha própria na tabela de rastreio (sem faixas como `MAL-01..09`).
3. Abra o PNG da sua tela com a ferramenta Read e descreva o que ele mostra. Leia o código real antes de projetar e reuse componentes existentes (`Modal`, `ConfirmDialog`, `Toast`, `PageSkeleton`, tokens de `index.css`).
4. Tasks atômicas, com testes junto (Frontend: vitest + testing-library, Node 25: `export PATH=$HOME/.nvm/versions/node/v25.9.0/bin:$PATH`; Backend: vitest com models mockados, AD-010). Em vez de commit por task, escreva "sem commit (decisão do dono)".
5. Termine com `worker_done` resumindo: contagem de requisitos e tasks, decisões que mudou em relação a este contexto, perguntas em aberto para o dono.
