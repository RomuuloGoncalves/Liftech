# Telas do Funcionário Specification

## Problem Statement

O Figma tem a seção "Funcionário" com 8 telas mobile (login, visão geral, empilhadeiras disponíveis, detalhe da empilhadeira, sessão em andamento, histórico, reportar ocorrência e configurações). O app só tem as telas do Administrador: não existe rota, layout nem navegação para o colaborador, e o login do colaborador, depois de autenticar, cai na Visão Geral do administrador. O funcionário precisa de uma área própria, pensada para celular e usável em tablet e desktop.

## Goals

- [ ] O colaborador entra por `/login/colaborador` e cai na área do funcionário em `/funcionario`.
- [ ] As 8 telas do Figma (menos as 2 marcadas "Não desenvolver") existem como rotas, com layout, cores e textos do Figma, medidos em 390px de largura.
- [ ] Todas as telas funcionam sem rolagem horizontal de 320px a 1440px de largura.
- [ ] Um atalho temporário no menu do administrador leva à área do funcionário.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Integração com a API (operator, forklift, incident) | Dono pediu mock primeiro; segue o padrão do admin (AD-005). Vira feature seguinte |
| Duas variantes de "Empilhadeiras Disponíveis" na linha de baixo do Figma | Anotação do Figma: "Não desenvolver essas duas telas" |
| Proteção de rota por papel (colaborador não entra em `/frota` etc.) | Não existe sessão real no front; depende do backend |
| Conteúdo da tela Configurações além do cabeçalho do Figma | O frame só tem o cabeçalho com o botão de fechar e corpo vazio |
| Tema escuro | AD-003: só tema claro |
| Notificações push, modo offline | Não aparecem no Figma |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Escopo de telas | As 8 do Figma, exceto as 2 anotadas | Resposta do dono | y |
| Origem dos dados | Mock em `Frontend/src/data`, reaproveitando o tipo `Machine` | Resposta do dono | y |
| Navegação | Layout próprio do funcionário (header + barra inferior flutuante como no Figma), sem a sidebar do admin; atalho temporário no menu do admin | Resposta do dono | y |
| Login | `/login/colaborador` continua usando `LoginPage`; já bate com o frame mobile "Login Colaborador"; muda só o destino pós-login (`/funcionario`) e a conferência em 390px | Dono: "acho que dá pra reaproveitar" | y |
| Rotas | `/funcionario` (visão geral), `/funcionario/maquinas`, `/funcionario/maquinas/:id` (detalhe), `/funcionario/sessao`, `/funcionario/historico`, `/funcionario/ocorrencia`, `/funcionario/configuracoes` | Uma rota por tela do Figma; detalhe e ocorrência são folhas sobre a tela anterior | n |
| Folhas (detalhe e ocorrência) | Renderizam como bottom sheet sobre a tela de origem com fundo desfocado, como no Figma | Frames "Detalhe Empilhadeira" e "Reportar ocorrência" | n |
| Barra inferior | 4 abas: Visão geral, Empilhadeiras, Histórico, Ocorrência; a aba ativa é o círculo azul preenchido | Frames mostram 4 ícones (cópia, empilhadeira, histórico, alerta); o terceiro ícone aparece como "pessoas" no frame Empilhadeiras e como histórico nos demais; vale histórico | n |
| Botões do header | Triângulo de alerta abre Reportar ocorrência; botão azul abre Configurações (vira X lá dentro) | O frame Configurações mostra o botão azul como X | n |
| Sessão | "Ativar máquina" cria a sessão e vai para `/funcionario/sessao`; o cronômetro conta a partir do início guardado em `sessionStorage`; "Encerrar Sessão" limpa e volta para `/funcionario` | Frame "Em processo" (00:30:25); sem backend, o início precisa sobreviver a recarregar a página | n |
| Botão do sheet de ocorrência | O frame repete o rótulo "Ativar máquina"; o app usa "Enviar ocorrência" | Rótulo copiado de outro frame; o botão confirma a ocorrência, não ativa máquina | n |
| Histórico de uso no detalhe | Lista fixa mock (nome do operador, data, intervalo e duração), filtro por período | Frame Detalhe mostra a timeline; sem endpoint | n |
| Responsividade | Até 767px: coluna única; a partir de 768px: conteúdo centrado em coluna de até 1120px, listas em 2 colunas e 3 a partir de 1200px; barra inferior continua flutuante e centrada | Dono: "compatibilidade para todos os dispositivos"; o Figma só tem 390px | n |
| Largura de referência | 390px para o Figma mobile | Largura do frame | n |
| Textos | Passam pelo i18next; pt-BR e en-US completos, demais idiomas caem no fallback pt-BR | Padrão do app (`fallbackLng: pt-BR`) | n |
| Fonte e cores | Host Grotesk e tokens de `index.css`; nenhuma cor nova fora dos tokens | Feature figma-restyle | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Casca da área do funcionário ⭐ MVP

**User Story**: As a funcionário, I want a área própria com header e barra inferior so that eu navegue pelas telas com o polegar.

**Why P1**: Todas as telas dependem do layout e das rotas.

**Acceptance Criteria**:

1. WHEN o caminho começa com `/funcionario` THEN the app SHALL renderizar o layout do funcionário sem a Sidebar nem o Header do administrador.
2. The layout do funcionário SHALL exibir o header com o logo Liftech, o botão de alerta e o botão azul de menu.
3. The layout do funcionário SHALL exibir a barra inferior flutuante com 4 abas, e a aba da rota atual com o círculo azul preenchido e as outras sem preenchimento.
4. WHEN o usuário toca em uma aba THEN the app SHALL navegar para a rota da aba.
5. The menu do administrador SHALL exibir o link temporário "Área do Funcionário" que leva a `/funcionario`.

### P1: Login do colaborador

**User Story**: As a colaborador, I want entrar com usuário e senha so that eu caia direto na minha área.

**Why P1**: É a porta de entrada.

**Acceptance Criteria**:

1. WHEN o colaborador autentica com sucesso em `/login/colaborador` THEN the app SHALL navegar para `/funcionario`.
2. WHEN o administrador autentica com sucesso em `/login` THEN the app SHALL continuar navegando para `/`.
3. The tela de login do colaborador SHALL caber em 320px sem rolagem horizontal.

### P1: Visão geral do funcionário

**User Story**: As a funcionário, I want ver minha última máquina, minha jornada e as empilhadeiras disponíveis so that eu comece o turno rápido.

**Why P1**: É a tela inicial.

**Acceptance Criteria**:

1. The tela SHALL exibir o título "Visão geral", o subtítulo do Figma e o banner azul "Última máquina" com nome, identificação e data da última utilização.
2. The tela SHALL exibir os cards "Jornada de trabalho" (horário e jornada diária) e "Tempo restante da jornada" (horas).
3. The tela SHALL exibir a seção "Empilhadeiras disponíveis" com no máximo 3 cards e o link "Mais" que leva a `/funcionario/maquinas`.
4. WHEN o usuário toca em "Selecionar" em um card THEN the app SHALL abrir o detalhe da empilhadeira.

### P1: Empilhadeiras disponíveis e detalhe

**User Story**: As a funcionário, I want escolher uma empilhadeira e ativá-la so that minha sessão de uso comece.

**Why P1**: É a ação central do funcionário.

**Acceptance Criteria**:

1. The tela de empilhadeiras SHALL listar somente máquinas com status "Disponível", com nome, identificação, setor, data e hora e o botão "Selecionar".
2. WHEN o usuário digita na busca THEN the app SHALL filtrar a lista por nome, identificação ou setor, sem diferenciar maiúsculas.
3. WHEN nenhuma máquina corresponde à busca THEN the app SHALL exibir a mensagem de lista vazia.
4. WHEN o usuário seleciona uma máquina THEN the app SHALL abrir o sheet "Selecionar Máquina" com nome, endereço MAC, código, setor, nome do dispositivo e o histórico de uso.
5. WHEN o usuário toca em "Cancelar" no sheet THEN the app SHALL fechar o sheet e manter a lista.
6. WHEN o usuário toca em "Ativar máquina" THEN the app SHALL iniciar a sessão e navegar para `/funcionario/sessao`.
7. WHEN o usuário escolhe um período no histórico de uso THEN the app SHALL listar só os registros dentro do período.

### P2: Sessão em andamento

**User Story**: As a funcionário, I want ver o tempo da minha sessão e encerrá-la so that o registro de uso fique correto.

**Why P2**: Fecha o fluxo de ativação.

**Acceptance Criteria**:

1. WHILE a sessão está ativa THE tela SHALL exibir o cronômetro no formato `HH:MM:SS` contando a partir do início da sessão.
2. WHEN a página é recarregada durante a sessão THEN the app SHALL mostrar o cronômetro continuando do início guardado.
3. WHEN o usuário toca em "Encerrar Sessão" THEN the app SHALL limpar a sessão e navegar para `/funcionario`.
4. WHEN o usuário toca em "Reportar uma ocorrência" THEN the app SHALL abrir o sheet de ocorrência sem encerrar a sessão.
5. WHEN não existe sessão ativa e o usuário abre `/funcionario/sessao` THEN the app SHALL redirecionar para `/funcionario/maquinas`.

### P2: Histórico

**User Story**: As a funcionário, I want consultar os usos anteriores so that eu confira minhas atividades.

**Why P2**: Consulta, não bloqueia o fluxo.

**Acceptance Criteria**:

1. The tela SHALL exibir o título "Histórico", o subtítulo do Figma e os filtros de período, hora inicial, hora final e busca por máquina.
2. The tela SHALL listar cards com nome, identificação, setor, data e hora, chip de status e o botão "Mais detalhes".
3. WHEN o usuário aplica um filtro THEN the app SHALL listar só os registros que atendem a todos os filtros ativos.
4. WHEN o usuário toca em "Mais detalhes" THEN the app SHALL abrir o sheet de detalhe da empilhadeira do registro.

### P2: Reportar ocorrência

**User Story**: As a funcionário, I want registrar uma ocorrência so that a gestão saiba do problema.

**Why P2**: Segurança operacional, mas não bloqueia o fluxo principal.

**Acceptance Criteria**:

1. The sheet SHALL exibir os campos Nome funcionário, Setor, Máquina e Horário, e os botões "Cancelar" e "Enviar ocorrência".
2. WHEN existe sessão ativa THEN the sheet SHALL preencher Setor e Máquina com os dados da máquina da sessão.
3. IF algum campo obrigatório está vazio THEN the app SHALL exibir a mensagem de campo obrigatório e SHALL NOT enviar.
4. WHEN o envio é válido THEN the app SHALL fechar o sheet e exibir o toast de confirmação.
5. WHEN o usuário toca em "Cancelar" THEN the app SHALL fechar o sheet sem enviar.

### P3: Configurações

**User Story**: As a funcionário, I want abrir as configurações pelo botão de menu so that eu volte quando quiser.

**Why P3**: O Figma só define o cabeçalho.

**Acceptance Criteria**:

1. WHEN o usuário toca no botão azul do header THEN the app SHALL navegar para `/funcionario/configuracoes`.
2. WHILE a rota é `/funcionario/configuracoes` THE botão azul SHALL exibir o ícone X e, ao ser tocado, voltar para a rota anterior.

### P2: Responsividade

**User Story**: As a funcionário, I want usar o app em qualquer aparelho so that eu não dependa do celular.

**Why P2**: Pedido do dono; o Figma só cobre 390px.

**Acceptance Criteria**:

1. WHILE a largura é menor que 768px THE listas de cards SHALL usar uma coluna.
2. WHILE a largura é de 768px a 1199px THE listas de cards SHALL usar 2 colunas e o conteúdo SHALL ficar centrado com no máximo 1120px.
3. WHILE a largura é de 1200px ou mais THE listas de cards SHALL usar 3 colunas.
4. The telas do funcionário SHALL NOT gerar rolagem horizontal de 320px a 1440px.
5. The barra inferior SHALL ficar centrada e fixa na base da janela em qualquer largura.

---

## Edge Cases

- WHEN o usuário abre `/funcionario/maquinas/:id` com id inexistente THEN the app SHALL exibir a lista de empilhadeiras sem abrir o sheet.
- WHEN o usuário já tem sessão ativa e abre `/funcionario/maquinas` THEN the app SHALL exibir a lista normalmente e "Ativar máquina" SHALL ficar desabilitado.
- WHEN o intervalo do filtro de período está invertido (início depois do fim) THEN the app SHALL não listar registros.
- WHEN o nome da empilhadeira excede a largura do card THEN the app SHALL truncar com reticências em uma linha.
- WHEN `sessionStorage` está indisponível THEN the app SHALL manter a sessão só em memória, sem erro.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| EMP-01 | P1 Casca: AC1, AC2 | Execute | Pending |
| EMP-02 | P1 Casca: AC3, AC4 | Execute | Pending |
| EMP-03 | P1 Casca: AC5 | Execute | Pending |
| EMP-04 | P1 Login: AC1, AC2, AC3 | Execute | Pending |
| EMP-05 | P1 Visão geral: AC1, AC2, AC3, AC4 | Execute | Pending |
| EMP-06 | P1 Disponíveis: AC1, AC2, AC3 | Execute | Pending |
| EMP-07 | P1 Detalhe: AC4, AC5, AC6, AC7; Edge: id inexistente, sessão ativa | Execute | Pending |
| EMP-08 | P2 Sessão: AC1, AC2, AC3, AC4, AC5; Edge: sessionStorage | Execute | Pending |
| EMP-09 | P2 Histórico: AC1, AC2, AC3, AC4; Edge: período invertido | Execute | Pending |
| EMP-10 | P2 Ocorrência: AC1, AC2, AC3, AC4, AC5 | Execute | Pending |
| EMP-11 | P3 Configurações: AC1, AC2 | Execute | Pending |
| EMP-12 | P2 Responsividade: AC1, AC2, AC3, AC4, AC5; Edge: truncar nome | Execute | Pending |

---

## Success Criteria

- [ ] Um colaborador completa o fluxo login → escolher máquina → ativar → encerrar sessão em `/funcionario`, com dados mock, sem erro no console.
- [ ] Cada tela, aberta em 390px, bate com o frame do Figma em cores, textos, ordem e espaçamentos.
- [ ] De 320px a 1440px nenhuma tela tem rolagem horizontal.
- [ ] Lint, `tsc -b`, build e a suíte de testes passam (exceto as 3 falhas antigas de `34 min`).
