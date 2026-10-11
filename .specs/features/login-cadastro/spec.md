# Telas de Login e Cadastro Specification

## Problem Statement

A aplicação não tem nenhuma tela de entrada: `AppRoutes` só expõe as páginas internas (Visão Geral, Frota, Equipe, Alertas) e não existe nenhuma rota de autenticação. O Figma (`node-id=0-1`, página "MVP") já especifica 3 telas prontas — Login Administrador, Login Colaborador e Solicitar Acesso (Administrador) — que precisam ser construídas no Frontend como UI funcional (mock), sem backend de autenticação real ainda (o projeto hoje não tem hash de senha, JWT nem sessão em nenhuma camada).

## Goals

- [ ] Implementar as 3 telas do Figma (Login Administrador, Login Colaborador, Solicitar Acesso) como páginas React completas, fieis ao layout: Solicitar Acesso é split screen com painel informativo azul à direita; os 2 logins são coluna única centralizada, sem painel.
- [ ] Navegação funcional entre as 3 telas (links cruzados Admin↔Colaborador, "Já tem cadastro? Entrar Agora!").
- [ ] Submissão mockada: login sempre autentica com campos preenchidos e válidos; "Solicitar acesso" mostra confirmação de envio, sem criar conta real.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Autenticação real (hash de senha, JWT, sessão, endpoints de login/solicitação no Backend) | Decisão do usuário: esta feature é só UI mock, mesmo padrão já usado nas outras páginas (Visão Geral, Frota etc. nasceram UI-first). Backend de auth fica para uma feature futura. |
| Guard de rota nas páginas internas (Visão Geral, Frota, Equipe, Alertas) | Decisão do usuário: não proteger as rotas existentes nesta fase; qualquer um continua acessando `/`, `/frota` etc. livremente. |
| Ação real de "Esqueceu a senha? Clique aqui" | Decisão do usuário: fica como affordance sem navegação/ação, mesmo padrão do Bell/Avatar do Header (AD-004). |
| Criação real de conta de Colaborador | O Figma mostra que o Colaborador não se autocadastra (não há tela de signup para ele); usuário/senha são definidos pelo Administrador em "Gestão de Equipe → Cadastrar Funcionário" (fora desta spec). |
| Persistência de "usuário logado" entre reloads da aplicação | Sem guard de rota e sem backend real, não há necessidade de persistir sessão; o estado de login mock vive só no fluxo do formulário (redireciona e não é mais referenciado por outras telas). |
| Definição de senha após "Solicitar acesso" ser aprovado | O formulário do Figma não coleta senha nesta tela (só e-mail empresarial, nome da empresa, nome do administrador); como é só feedback mock, não há aprovação real nem etapa seguinte. |
| Tradução de idioma visível nas telas de auth (seletor de idioma) | As telas de auth não têm Header (ver assumption abaixo); o texto ainda é traduzido via i18n (chaves novas), mas não há controle de idioma nelas — o idioma usado é o último selecionado nas páginas internas (`localStorage['liftech-lang']`). |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Shell (Sidebar/Header) nas rotas de auth | `App.tsx` passa a renderizar `Sidebar`/`Header` condicionalmente: ocultos nas rotas `/login`, `/login/colaborador` e `/solicitar-acesso` (telas full-screen, conforme Figma) | O Figma mostra as 3 telas ocupando a tela inteira, sem sidebar/header; hoje `AppRoutes` está sempre dentro do shell fixo | n |
| Rotas | `/login` (Login Administrador), `/login/colaborador` (Login Colaborador), `/solicitar-acesso` (Solicitar Acesso) | Nomes descritivos em português, consistentes com as rotas existentes (`/frota`, `/equipe`, `/alertas`) | n |
| Regra de sucesso do login mock | Com todos os campos obrigatórios preenchidos e formato válido (e-mail no Login Admin), o submit sempre autentica: redireciona para `/` sem checar credencial contra nenhuma lista fixa | Decisão do usuário | y |
| Validação de formato | Login Administrador e Solicitar Acesso validam formato de e-mail no campo de e-mail; Login Colaborador valida apenas que "Usuário" não está vazio (campo é texto livre definido pelo admin, sem formato de e-mail) | O Figma rotula o campo do Colaborador como "Usuário" (texto livre) e o do Admin como "Email empresarial" | n |
| Campos obrigatórios | Todos os campos de cada formulário são obrigatórios (nenhum campo opcional aparece em nenhuma das 3 telas do Figma) | Nenhuma tela indica campo opcional | n |
| Pós-login (mock) | Redireciona para `/` (Visão Geral) após submit válido, sem persistir estado de "usuário logado" em lugar nenhum (ver Out of Scope) | É o destino natural da aplicação (rota raiz já existente); sem guard de rota não há necessidade de guardar quem logou | y |
| Pós "Solicitar acesso" | Mostra uma mensagem de confirmação inline no próprio formulário (ex.: "Solicitação enviada! Entraremos em contato em breve.") substituindo o form, sem redirecionar | Decisão do usuário: só feedback visual, sem criar conta real | y |
| Link "Entrar Agora!" (Solicitar Acesso) | Navega para `/login` (Login Administrador) | Mockup rotula a seção como "Já tem cadastro? Entrar Agora!", direcionando para o login existente do mesmo perfil (Admin) | n |
| Link "Colaborador? Clique aqui!" (Solicitar Acesso e Login Admin) | Navega para `/login/colaborador` | Mesmo rótulo nas duas telas, aponta para o fluxo de Colaborador | n |
| Link "Administrador? Clique aqui!" (Login Colaborador) | Navega para `/login` | Caminho inverso do link acima | n |
| Textos traduzíveis (i18n) | Todo o copy estático das 3 telas (labels, placeholders, títulos, botões, mensagens de erro/validação) entra em `src/locales/*/translation.json` sob uma chave nova `auth.*`, nas 7 línguas já suportadas | Consistente com AD-006 (i18n já é o padrão do projeto para todo texto de UI) | y |
| Erro de validação | IF algum campo obrigatório estiver vazio ou com formato inválido no submit THEN a tela SHALL exibir uma mensagem de erro abaixo do campo correspondente e SHALL impedir o redirecionamento/confirmação | Comportamento padrão esperado de formulário; nenhum mockup trata disso explicitamente, mas é necessário para o form não "autenticar" com campos vazios | n |
| Mostrar/ocultar senha | Nenhum toggle de visibilidade de senha (ícone de olho) nos campos de senha | O Figma não mostra ícone de olho nos inputs de senha das telas de Login (o ícone "noto:eye" encontrado é da seção informativa "Mais Controle", não do campo) | n |

**Open questions:** none — todas resolvidas ou registradas acima.

---

## User Stories

### P1: Login do Administrador ⭐ MVP

**User Story**: Como administrador da empresa, quero logar com meu e-mail e senha, para acessar o painel de gestão da frota.

**Why P1**: É a porta de entrada principal da aplicação para o perfil que já tem todas as outras telas construídas (Visão Geral, Frota, Equipe, Alertas).

**Acceptance Criteria**:

1. WHEN o usuário acessa `/login` THEN o sistema SHALL renderizar, em coluna única centralizada (sem painel informativo lateral), o formulário com os campos "Email empresarial" e "Senha" e o título "Bem-vindo de volta", sem Sidebar/Header.
2. WHEN o usuário preenche "Email empresarial" com um e-mail em formato válido e "Senha" com qualquer valor não vazio e clica em "Entrar" THEN o sistema SHALL navegar para `/`.
3. IF "Email empresarial" estiver vazio, em formato inválido, ou "Senha" estiver vazia no momento do clique em "Entrar" THEN o sistema SHALL exibir uma mensagem de erro abaixo do(s) campo(s) inválido(s) e SHALL permanecer em `/login`.
4. WHEN o usuário clica em "Colaborador? Clique aqui!" THEN o sistema SHALL navegar para `/login/colaborador`.
5. The system SHALL exibir o link "Esqueceu a senha? Clique aqui" sem nenhuma ação associada a ele (affordance apenas).

**Independent Test**: Acessar `/login`, preencher os dois campos e clicar "Entrar" — deve cair em `/`. Deixar um campo vazio e clicar "Entrar" — deve mostrar erro e não navegar.

---

### P1: Login do Colaborador ⭐ MVP

**User Story**: Como colaborador da operação, quero logar com o usuário e senha definidos pelo meu administrador, para registrar minhas atividades.

**Why P1**: Segundo perfil de acesso já desenhado no Figma; sem ele o fluxo de entrada fica incompleto.

**Acceptance Criteria**:

1. WHEN o usuário acessa `/login/colaborador` THEN o sistema SHALL renderizar, em coluna única centralizada (sem painel informativo lateral), o formulário com os campos "Usuário" e "Senha" e o título "Bem-vindo de volta", sem Sidebar/Header.
2. WHEN o usuário preenche "Usuário" e "Senha" com valores não vazios e clica em "Entrar" THEN o sistema SHALL navegar para `/`.
3. IF "Usuário" ou "Senha" estiverem vazios no momento do clique em "Entrar" THEN o sistema SHALL exibir uma mensagem de erro abaixo do(s) campo(s) inválido(s) e SHALL permanecer em `/login/colaborador`.
4. WHEN o usuário clica em "Administrador? Clique aqui!" THEN o sistema SHALL navegar para `/login`.

**Independent Test**: Acessar `/login/colaborador`, preencher os dois campos e clicar "Entrar" — deve cair em `/`. Clicar em "Administrador? Clique aqui!" — deve cair em `/login`.

---

### P2: Solicitar acesso (Administrador)

**User Story**: Como representante de uma empresa ainda não cadastrada, quero solicitar acesso à plataforma informando meus dados, para que minha empresa comece a usar o Liftech.

**Why P2**: Importante para o fluxo de aquisição de novos clientes, mas não bloqueia o uso da aplicação pelos perfis que já têm conta (Admin/Colaborador já cadastrados entram direto pelo login).

**Acceptance Criteria**:

1. WHEN o usuário acessa `/solicitar-acesso` THEN o sistema SHALL renderizar o formulário com os campos "Email empresarial", "Nome da Empresa" e "Nome Administrador", título "Boas vindas à Liftech" e o painel informativo com as 3 vantagens ("Mais Segurança", "Mais Controle", "Mais eficiência"), sem Sidebar/Header.
2. WHEN o usuário preenche os 3 campos (e-mail em formato válido) e clica em "Solicitar acesso" THEN o sistema SHALL substituir o formulário por uma mensagem de confirmação de envio, sem redirecionar.
3. IF algum dos 3 campos estiver vazio ou "Email empresarial" tiver formato inválido no momento do clique em "Solicitar acesso" THEN o sistema SHALL exibir uma mensagem de erro abaixo do(s) campo(s) inválido(s) e SHALL manter o formulário visível.
4. WHEN o usuário clica em "Colaborador? Clique aqui!" THEN o sistema SHALL navegar para `/login/colaborador`.
5. WHEN o usuário clica em "Entrar Agora!" THEN o sistema SHALL navegar para `/login`.

**Independent Test**: Acessar `/solicitar-acesso`, preencher os 3 campos e clicar "Solicitar acesso" — deve mostrar a confirmação no lugar do form. Deixar um campo vazio — deve mostrar erro e manter o form.

---

## Edge Cases

- IF o usuário submete um formulário com espaços em branco apenas (ex. `"   "`) em um campo obrigatório THEN o sistema SHALL tratar como vazio e exibir o erro de campo obrigatório.
- IF o e-mail não contém "@" e domínio (ex. `"abc"`, `"abc@"`) THEN o sistema SHALL exibir o erro de formato inválido nos campos de e-mail ("Email empresarial").
- WHEN o usuário corrige um campo que estava com erro e volta a submeter THEN o sistema SHALL limpar a mensagem de erro daquele campo assim que o novo submit for válido.
- WHEN a viewport é mobile (<768px, breakpoint já usado na Sidebar) THEN o sistema SHALL empilhar o painel informativo abaixo do formulário (ou ocultá-lo), mantendo o formulário utilizável em largura total — o Figma só cobre o layout desktop (1440px).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AUTH-01 | P1: Login do Administrador | Execute | Verified |
| AUTH-02 | P1: Login do Administrador | Execute | Verified |
| AUTH-03 | P1: Login do Administrador | Execute | Verified |
| AUTH-04 | P1: Login do Administrador | Execute | Verified |
| AUTH-05 | P1: Login do Administrador | Execute | Verified |
| AUTH-06 | P1: Login do Colaborador | Execute | Verified |
| AUTH-07 | P1: Login do Colaborador | Execute | Verified |
| AUTH-08 | P1: Login do Colaborador | Execute | Verified |
| AUTH-09 | P1: Login do Colaborador | Execute | Verified |
| AUTH-10 | P2: Solicitar acesso | Execute | Verified |
| AUTH-11 | P2: Solicitar acesso | Execute | Verified |
| AUTH-12 | P2: Solicitar acesso | Execute | Verified |
| AUTH-13 | P2: Solicitar acesso | Execute | Verified |
| AUTH-14 | P2: Solicitar acesso | Execute | Verified |

**Coverage:** 14 total, 14 mapeados para Execute, 14 Verified, 0 unmapped.

---

## Success Criteria

- [ ] As 3 rotas (`/login`, `/login/colaborador`, `/solicitar-acesso`) renderizam fiéis ao Figma (layout, textos, campos).
- [ ] Os 3 fluxos de submit (2 logins + solicitar acesso) funcionam mock conforme as ACs, com validação de campo vazio/formato.
- [ ] Navegação cruzada entre as 3 telas funciona nos dois sentidos.
- [ ] Nenhuma regressão nas páginas internas existentes (Sidebar/Header continuam aparecendo normalmente fora das rotas de auth).
