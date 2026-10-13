# Menu de 3 ícones e tela de Configurações do funcionário Specification

## Problem Statement

A barra inferior do funcionário tem 4 ícones e o Figma tem 3: o ícone de ocorrência sobra, porque o alerta já fica no header, e o primeiro ícone é `Copy` onde o Figma mostra uma casa. O hambúrguer do header já leva a `/funcionario/configuracoes`, mas essa tela é só um `<h1>`. É a única tela do funcionário que falta no Figma (frame `342:9577`).

## Goals

- [ ] A barra inferior mostra exatamente 3 abas: Visão geral (casa), Empilhadeiras e Histórico.
- [ ] O `User` do backend guarda `telefone` e `cargo`, e o login os devolve para a tela de Configurações.
- [ ] `/funcionario/configuracoes` reproduz o frame `Configurações` do Figma.
- [ ] O alerta do header continua abrindo o sheet de ocorrência e o hambúrguer continua abrindo as configurações.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| As duas telas "Empilhadeiras Disponíveis" com abas Disponíveis/Em operação | O Figma marca "Não desenvolver essas duas telas" |
| Página de Política e Privacidade (frame `161:579`) e a navegação para ela | Decisão do dono: não será feita agora; o link da Sidebar do admin continua como está |
| Enviar o feedback | O frame não tem botão de enviar e não há endpoint |
| Preencher telefone e cargo de usuários já existentes | Os campos são opcionais; ficam vazios até a Equipe integrar, sem script de migração |
| Tela de Equipe gravar telefone e cargo | Equipe ainda é mock; só a API aceita os campos |
| Editar dados do perfil | O Figma manda pedir a mudança ao supervisor |
| Alterar a rota `/funcionario/ocorrencia` | O sheet já funciona e é reaproveitado pelo alerta |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Ícone da primeira aba | `House` do lucide-react | O Figma e o print do dono mostram uma casa | y |
| Aba de ocorrência | Removida da barra; a rota continua e o indicador fica oculto nela | O alerta do header é o único acesso, como o dono pediu | y |
| Nome na tela | Vem de `localStorage['user'].nome` (gravado no login) | É o único dado do usuário que o backend já devolve | n |
| Telefone e Cargo | Campos opcionais `telefone` e `cargo` (texto, `trim`) no schema `user`, no `userModel`, no `POST`/`PUT /api/users` e na resposta do login; a tela mostra o valor ou `—` | Decisão do dono: adicionar no banco. Opcional não quebra documentos antigos, então não precisa migrar | y |
| Posição dos campos novos no `userModel` | Parâmetros opcionais depois de `id` | Mantém as chamadas posicionais atuais `new userModel(nome, role, id)` | n |
| Validação de `telefone` e `cargo` | Se vierem no corpo, precisam ser texto; sem formato nem tamanho | Telefone de Equipe tem máscara livre no mock; o Figma mostra `+55 99 99999999` | n |
| Campos de dados | `readOnly`, com rótulo associado | Figma mostra campos cinza sem edição e manda pedir mudança ao supervisor | n |
| Texto "Desloga-se" do Figma | Escrito "Deslogar-se" | O Figma tem erro de digitação | n |
| Deslogar | Chama `authService.logout()` e navega para `/login/colaborador` | Decisão do dono | y |
| Feedback | Textarea sem botão e sem envio, só visual | Decisão do dono | y |
| Botão Política e Privacidade | Aparece como no Figma, mas sem ação (não navega) | A página não existe e não será feita agora; evita levar o usuário ao 404. Mesmo padrão do Bell/Avatar do Header (AD-004) | y |
| Skeleton da tela | Nova variante `settings` de `EmployeeSkeleton` (chave `employee-settings`) com os blocos do layout: título, card com 3 campos, aviso, botão, seção de feedback e botão final | Substitui a linha de título da spec `employee-nav-skeleton`, que valia quando a tela era um título; o skeleton precisa ter o mesmo layout (spec `skeleton-fidelity`) | n |
| Idiomas | Textos novos em `employee.settings.*` nos 7 `locales/*/translation.json` | AD-006 | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Menu inferior com 3 ícones ⭐ MVP

**User Story**: As a funcionário, I want uma barra com só as 3 telas principais so that eu navegue como no Figma.

**Why P1**: É a correção pedida; o ícone extra confunde porque o alerta já está no header.

**Acceptance Criteria**:

1. The barra inferior SHALL exibir 3 links nesta ordem: Visão geral, Empilhadeiras, Histórico.
2. The link Visão geral SHALL usar o ícone `House`.
3. The barra SHALL NOT exibir um link para `/funcionario/ocorrencia`.
4. WHEN a rota é `/funcionario/ocorrencia`, `/funcionario/sessao` ou `/funcionario/configuracoes` THEN the indicador SHALL ficar oculto e nenhum link SHALL ter `aria-current`.
5. WHEN o usuário toca no alerta do header THEN the app SHALL navegar para `/funcionario/ocorrencia` e abrir o sheet "Reportar uma ocorrência".
6. WHEN o usuário toca no hambúrguer do header THEN the app SHALL navegar para `/funcionario/configuracoes`.

**Independent Test**: Abrir `/funcionario`; a barra tem casa, empilhadeira e relógio; tocar no triângulo abre o sheet; tocar no hambúrguer abre as configurações.

---

### P1: Telefone e cargo no usuário (backend) ⭐ MVP

**User Story**: As a funcionário, I want ver meu telefone e cargo nas configurações so that eu confira os dados que o supervisor cadastrou.

**Why P1**: A tela do Figma pede os dois campos e o `User` não os tem.

**Acceptance Criteria**:

1. The schema `user` SHALL aceitar `telefone` e `cargo` opcionais, do tipo texto com `trim`.
2. WHEN `POST /api/users` recebe `telefone` e `cargo` THEN the backend SHALL gravar os dois e devolvê-los na resposta 201.
3. IF `telefone` ou `cargo` vem no corpo e não é texto THEN the backend SHALL responder 400 com a mensagem de validação.
4. WHEN `PUT /api/users/:id` recebe `telefone` ou `cargo` THEN the backend SHALL atualizar o campo e devolvê-lo na resposta 200.
5. WHEN `POST /api/auth/login` responde 200 THEN the `user` SHALL incluir `telefone` e `cargo` quando existem no usuário.
6. WHEN o usuário não tem `telefone` nem `cargo` THEN the backend SHALL manter o login e a listagem sem erro.

**Independent Test**: `POST /api/users` com `telefone` e `cargo`, depois login desse usuário; a resposta traz os dois campos.

---

### P1: Tela de Configurações ⭐ MVP

**User Story**: As a funcionário, I want ver meus dados, sair da conta e deixar uma sugestão so that eu tenha o que o Figma define para essa tela.

**Why P1**: É a única tela do funcionário que falta.

**Acceptance Criteria**:

1. The tela SHALL exibir o título "Configurações", a seção "Geral" e o card "Dados do usuário" com os campos Nome, Telefone e Cargo.
2. The campos Nome, Telefone e Cargo SHALL ser somente leitura e cada um SHALL ter rótulo associado.
3. WHEN existe usuário gravado em `localStorage['user']` THEN the campo Nome SHALL mostrar `nome` desse usuário.
4. IF `localStorage['user']` está ausente ou sem `nome` THEN the campo Nome SHALL mostrar `—`.
5. WHEN o usuário gravado tem `telefone` ou `cargo` THEN the campo correspondente SHALL mostrar o valor, e `—` quando ausente.
6. The card SHALL exibir o aviso "Solicitação de alteração" orientando a pedir mudanças ao supervisor responsável.
7. WHEN o usuário toca em "Deslogar-se" THEN the app SHALL remover `token` e `user` do `localStorage` e navegar para `/login/colaborador`.
8. The tela SHALL exibir a seção "Feedback & Sugestões" com a pergunta "Como foi sua experiência?" e um textarea editável sem botão de envio.
9. The tela SHALL exibir o botão "Política e Privacidade" sem ação: tocar nele não altera a rota.
10. WHEN o usuário abre a tela pela primeira vez THEN the tela SHALL exibir o skeleton `settings` com `aria-busy="true"` até o atraso simulado terminar.
11. WHEN o usuário volta à tela THEN the app SHALL exibir o conteúdo sem skeleton.
12. WHERE o idioma ativo é qualquer um dos 7 suportados THE tela SHALL exibir todos os textos traduzidos.

**Independent Test**: Logar como colaborador, tocar no hambúrguer; ver os dados, digitar no textarea, tocar em "Deslogar-se" e cair no login do colaborador sem token.

---

## Edge Cases

- WHEN `localStorage['user']` contém JSON inválido THEN the campo Nome SHALL mostrar `—` sem lançar erro.
- WHEN o usuário digita no textarea e sai da tela THEN the app SHALL descartar o texto.
- WHEN a rota é `/funcionario/configuracoes` THEN the botão do header SHALL virar X e voltar para a tela anterior.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TAB-01 | P1 Menu: AC1, AC2, AC3 | Execute | Implementing |
| TAB-02 | P1 Menu: AC4 | Execute | Implementing |
| TAB-03 | P1 Menu: AC5, AC6 | Execute | Implementing |
| SET-01 | P1 Config: AC1, AC2 | Execute | Pending |
| SET-02 | P1 Config: AC3, AC4, AC5; Edge: JSON inválido | Execute | Implementing |
| USR-01 | P1 Usuário: AC1, AC6 | Execute | Implementing |
| USR-02 | P1 Usuário: AC2, AC3, AC4 | Execute | Implementing |
| USR-03 | P1 Usuário: AC5 | Execute | Implementing |
| SET-03 | P1 Config: AC6 | Execute | Pending |
| SET-04 | P1 Config: AC7 | Execute | Pending |
| SET-05 | P1 Config: AC8; Edge: descartar texto | Execute | Pending |
| SET-06 | P1 Config: AC9 | Execute | Pending |
| SET-07 | P1 Config: AC10, AC11 | Execute | Implementing |
| SET-08 | P1 Config: AC12 | Execute | Implementing |

---

## Success Criteria

- [ ] A barra inferior mostra casa, empilhadeira e relógio, sem o ícone de ocorrência.
- [ ] `/funcionario/configuracoes` bate com o frame `342:9577` do Figma.
- [ ] Um usuário criado com telefone e cargo mostra os dois nas Configurações depois do login.
- [ ] "Deslogar-se" limpa a sessão e leva ao login do colaborador.
- [ ] Lint, `tsc -b`, build e testes passam no Frontend e no Backend.
