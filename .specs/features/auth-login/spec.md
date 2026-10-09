# Login e Solicitação de Acesso Specification

## Problem Statement

As telas `/login`, `/login/colaborador` e `/solicitar-acesso` estão mockadas. O backend não tem autenticação: o `User` guarda só `nome`/`role`, e `POST /auth/login` devolve o próprio body, numa rota fora de `/api` que o front nunca alcança. Além disso, o layout novo (imagens anexadas na conversa de 2026-10-09) junta as três telas num painel dividido com abas ("Solicite o acesso", "Entrar Administrador", "Colaborador").

## Goals

- [ ] Admin (email + senha) e colaborador (usuário + senha) entram com credenciais reais, recebem um JWT e vão para `/`.
- [ ] "Solicitar acesso" grava um pedido pendente no backend.
- [ ] Logout disponível no app.
- [ ] As três telas reproduzem as imagens 1 e 2.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Proteção de rotas (front e back) | Decisão do dono: por enquanto só login → home |
| Aprovação de solicitações de acesso | Feita manualmente por enquanto |
| Cadastro de colaborador com usuário/senha pela tela Equipe | Equipe ainda é mockada; entra com a integração de Equipe |
| "Esqueceu a senha?" funcional | Sem fluxo definido |
| Rate limit / bloqueio por tentativas | Sem proteção de rotas ainda; entra junto com ela |
| Endpoint de logout / blacklist de token | JWT stateless; logout é só no cliente |
| Vínculo `Operator` ↔ `User` | Só necessário quando o colaborador logado interagir com máquinas |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Onde fica o login do colaborador | Na coleção `user` com `role: 'colaborador'` e campo `usuario`; `Operator` não muda | `User` = identidade/acesso, `Operator` = entidade de domínio ligada a máquinas. Nada referencia `user`, então adicionar campos não quebra nada. Quando precisar saber "qual operador está logado", adiciona-se `usuarioId` em `Operator` | y |
| Hash de senha | `node:crypto` scrypt, formato `salt:hash` (hex), comparação com `timingSafeEqual` | Stdlib, sem dependência nova | n |
| Token | JWT HS256 via `jsonwebtoken`, segredo em `JWT_SECRET`, expira em `JWT_EXPIRES_IN` (padrão `8h`) | Biblioteca padrão; não reimplementar cripto | n |
| Vazamento de `senhaHash` | Campo com `select: false` no schema; só o login faz `.select('+senhaHash')` | `GET /api/users` continua sem expor hash | n |
| Rota de login | `POST /api/auth/login` com `{ role: 'admin' \| 'colaborador', login, senha }`; admin busca por `email`, colaborador por `usuario` | Uma rota, uma função; a aba define o `role` | n |
| Mensagem de credencial inválida | Mesma resposta 401 `"Credenciais inválidas."` para usuário inexistente, senha errada ou role diferente | Não revela quais contas existem | n |
| Seed do admin | `yarn seed` cria admin a partir de `SEED_ADMIN_EMAIL`, `SEED_ADMIN_SENHA`, `SEED_ADMIN_NOME` se não existir; servidor iniciado com `--seed` (`yarn dev:seed`) roda o mesmo seed antes de subir | Pedido do dono; credenciais via env evitam histórico do shell | y |
| Solicitação duplicada | 409 se já existe pedido `pendente` com o mesmo email | Evita duplicatas por duplo clique/retry | n |
| CORS | `cors()` (já é dependência) liberado | Front em outra porta; restringir quando houver deploy | n |
| URL da API no front | `import.meta.env.VITE_API_URL` com fallback `http://localhost:3000/api` | O valor de produção atual é placeholder | n |
| Interceptor 401 do axios | Removido | Redirecionava `/login/colaborador` para `/login` em senha errada; sem rotas protegidas não há uso | n |
| Abas | Cada aba é um link para a rota existente (`/solicitar-acesso`, `/login`, `/login/colaborador`) | Mantém URLs e testes de rota | n |
| Aba "Entrar Administrador" | Mesmo layout da imagem 1, com "Email empresarial" no lugar de "Usuário" | Não há imagem da aba admin | n |
| Links cruzados, "ou", "Já tem cadastro?" | Removidos | Não existem nas imagens; as abas substituem | n |
| Título do painel azul | "Comece conosco" | Texto da imagem | n |
| Dados do usuário logado | `localStorage`: `token` e `user` (`{ _id, nome, role }`) | Mesmo mecanismo que `api.ts` já lê | n |
| Logout | Botão "Sair" (ícone `LogOut`) no Header; limpa `token`/`user` e navega para `/login` | Header já tem a área de ações do usuário | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Login de administrador e colaborador ⭐ MVP

**User Story**: As a admin ou colaborador, I want entrar com minhas credenciais so that eu acesse a plataforma.

**Why P1**: É o pedido central.

**Acceptance Criteria**:

1. WHEN `POST /api/auth/login` recebe `{ role: 'admin', login: <email>, senha }` de um usuário admin com senha correta THEN the backend SHALL responder 200 com `{ token, user: { _id, nome, role } }`.
2. WHEN `POST /api/auth/login` recebe `{ role: 'colaborador', login: <usuario>, senha }` de um usuário colaborador com senha correta THEN the backend SHALL responder 200 com `{ token, user: { _id, nome, role } }`.
3. IF a senha está errada, o login não existe ou o `role` do usuário difere do enviado THEN the backend SHALL responder 401 com `{ error: "Credenciais inválidas." }`.
4. IF `role`, `login` ou `senha` está ausente ou vazio, ou `role` não é `admin`/`colaborador` THEN the backend SHALL responder 400 com `{ error: <erros de validação> }`.
5. The backend SHALL nunca incluir `senhaHash` em respostas de `/api/auth/login` ou `/api/users`.
6. The JWT SHALL conter `sub` = `_id` do usuário e `role`, assinado com `JWT_SECRET`.
7. WHEN o login no front retorna 200 THEN the frontend SHALL salvar `token` e `user` no `localStorage` e navegar para `/`.
8. IF o login no front retorna 401 THEN the frontend SHALL exibir "Usuário ou senha inválidos." e permanecer na tela.
9. IF o login no front falha sem resposta do servidor THEN the frontend SHALL exibir "Não foi possível conectar ao servidor." e permanecer na tela.
10. WHILE a requisição de login está em andamento the frontend SHALL desabilitar o botão "Entrar".

**Independent Test**: Rodar `yarn seed` com as variáveis de seed, entrar na aba "Entrar Administrador" com essas credenciais e cair em `/`.

---

### P1: Seed do admin ⭐ MVP

**User Story**: As a dono, I want criar o primeiro admin por script so that exista alguém para logar.

**Acceptance Criteria**:

1. WHEN `seedAdmin()` roda e não existe usuário com `SEED_ADMIN_EMAIL` THEN the backend SHALL criar um `user` com `role: 'admin'`, `nome`, `email` e `senhaHash` da senha informada.
2. WHEN `seedAdmin()` roda e já existe usuário com `SEED_ADMIN_EMAIL` THEN the backend SHALL não criar nem alterar nenhum usuário.
3. IF alguma variável `SEED_ADMIN_*` está ausente THEN `seedAdmin()` SHALL registrar um aviso e não criar usuário.
4. WHEN o servidor é iniciado com o argumento `--seed` THEN the backend SHALL executar `seedAdmin()` antes de escutar a porta.

---

### P1: Solicitar acesso ⭐ MVP

**User Story**: As a empresa interessada, I want enviar meu pedido de acesso so that a Liftech entre em contato.

**Acceptance Criteria**:

1. WHEN `POST /api/access-requests` recebe `{ email, nomeEmpresa, nomeAdministrador }` válidos THEN the backend SHALL gravar o pedido com `status: 'pendente'` e responder 201 com o pedido criado.
2. IF algum campo está vazio ou `email` é inválido THEN the backend SHALL responder 400 com `{ error: <erros de validação> }`.
3. IF já existe pedido `pendente` com o mesmo email THEN the backend SHALL responder 409 com `{ error: "Já existe uma solicitação pendente para este email." }`.
4. WHEN o envio no front retorna 201 THEN the frontend SHALL exibir a mensagem "Solicitação enviada!".
5. IF o envio no front retorna 409 THEN the frontend SHALL exibir "Já existe uma solicitação pendente para este email." e manter o formulário.

---

### P1: Logout ⭐ MVP

**Acceptance Criteria**:

1. WHEN o usuário clica em "Sair" no Header THEN the frontend SHALL remover `token` e `user` do `localStorage` e navegar para `/login`.

---

### P1: Layout das telas de autenticação ⭐ MVP

**User Story**: As a dono do produto, I want as telas iguais às imagens 1 e 2.

**Acceptance Criteria**:

1. The frontend SHALL renderizar `/login`, `/login/colaborador` e `/solicitar-acesso` no layout dividido: formulário à esquerda e painel azul arredondado à direita com logo, "Comece conosco", subtítulo e os três cards na timeline.
2. The frontend SHALL exibir, abaixo do subtítulo, três abas na ordem "Solicite o acesso", "Entrar Administrador", "Colaborador", ligadas a `/solicitar-acesso`, `/login` e `/login/colaborador`.
3. WHILE uma rota de auth está ativa the frontend SHALL destacar a aba correspondente com fundo em gradiente e texto branco (`aria-current="page"`) e as outras com fundo branco e borda.
4. WHEN o usuário abre `/login/colaborador` THEN the frontend SHALL exibir o título "Bem-vindo de volta", os campos "Usuário" e "Senha", o link "Esqueceu a senha? Clique aqui!" e o botão "Entrar".
5. WHEN o usuário abre `/solicitar-acesso` THEN the frontend SHALL exibir o título "Boas vindas à Liftech", o texto "Solicite o acesso da plataforma", os campos "Email empresarial", "Nome da Empresa", "Nome Administrador" e o botão "Solicitar acesso", sem os links cruzados nem o bloco "ou / Já tem cadastro?".

---

## Edge Cases

- IF `login` vem com espaços ou maiúsculas no email THEN the backend SHALL comparar o email em minúsculas e sem espaços nas pontas.
- IF `JWT_SECRET` não está definido THEN the backend SHALL responder 500 no login em vez de assinar com segredo vazio.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AUTH-01 | P1 Login: AC1 | Execute | Done |
| AUTH-02 | P1 Login: AC2 | Execute | Done |
| AUTH-03 | P1 Login: AC3 | Execute | Done |
| AUTH-04 | P1 Login: AC4 | Execute | Done |
| AUTH-05 | P1 Login: AC5 | Execute | Done |
| AUTH-06 | P1 Login: AC6 + edge cases | Execute | Done |
| AUTH-07 | P1 Login: AC7 | Execute | Done |
| AUTH-08 | P1 Login: AC8, AC9 | Execute | Done |
| AUTH-09 | P1 Login: AC10 | Execute | Done |
| SEED-01 | P1 Seed: AC1-AC3 | Execute | Done |
| SEED-02 | P1 Seed: AC4 | Execute | Done |
| REQ-01 | P1 Solicitar: AC1-AC3 | Execute | Done |
| REQ-02 | P1 Solicitar: AC4, AC5 | Execute | Done |
| OUT-01 | P1 Logout: AC1 | Execute | Done |
| AUTHUI-05 | P1 Layout: AC1 | Execute | Done |
| AUTHUI-06 | P1 Layout: AC2, AC3 | Execute | Done |
| AUTHUI-07 | P1 Layout: AC4, AC5 | Execute | Done |

**Coverage:** 17 total, 17 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Admin criado pelo seed entra pela aba "Entrar Administrador" e cai em `/`.
- [ ] Pedido enviado em `/solicitar-acesso` aparece na coleção `accessrequests` com `status: 'pendente'`.
- [ ] `GET /api/users` não expõe `senhaHash`.
