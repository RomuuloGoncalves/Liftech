# Login e Solicitação de Acesso Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Regra do dono (global): NUNCA acessar o banco de dados.** Nenhum teste, script ou comando pode conectar no Mongo. No backend rode só `tests/unit` e mocke todo `src/schemas/*.js` importado (eles importam `config/conn.js`, que conecta). `yarn test` no Backend roda as integrações, que batem no banco real: proibido.

---

**Spec**: `.specs/features/auth-login/spec.md`
**Design**: inline (decisões na tabela de Assumptions da spec)
**Status**: Done (verifier pendente)

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/frontend.md` (Vitest + Testing Library, testes espelham `src/` em `src/test/`), `Backend/tests/unit/*.test.ts` (Vitest com mocks de repositório/schema). Sem limiar de cobertura; defaults fortes aplicados.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend util / service / script | unit | Todas as ramificações; 1:1 com ACs AUTH/SEED; schema mockado | `Backend/tests/unit/*.test.ts` | `cd Backend && yarn vitest run tests/unit` |
| Backend controller | unit (req/res mockados) | Cada status da spec: 200/201, 400, 401, 409, 500 | `Backend/tests/unit/*.test.ts` | `cd Backend && yarn vitest run tests/unit` |
| Backend schema / router / server / package.json | none | - (build gate only) | - | build gate only |
| Front service (`services/*.ts`) | unit | Payload enviado, gravação/limpeza do `localStorage` | `Frontend/src/test/services/*.test.ts` | `cd Frontend && yarn vitest run src/test/services` |
| Front componente | unit (Testing Library) | Render, abas ativas (`aria-current`), clique de logout | `Frontend/src/test/components/**/*.test.tsx` | `cd Frontend && yarn vitest run src/test/components` |
| Front página | integration (Testing Library, `authService` mockado) | Sucesso, 401, sem resposta, 409, validação, botão desabilitado | `Frontend/src/test/pages/*.test.tsx` | `cd Frontend && yarn vitest run src/test/pages` |
| Locales | unit | Paridade de chaves `auth`/`navigation` nos 7 idiomas | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && yarn vitest run src/test/config` |
| CSS Modules | none | - (build gate only) | - | build gate only |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com teste unitário | Backend: `cd Backend && yarn vitest run tests/unit` · Frontend: `cd Frontend && yarn vitest run <arquivo da task>` |
| Full | Tasks de página | `cd Frontend && yarn test` |
| Build | Fim de fase e tasks sem teste | Backend: `cd Backend && yarn build && yarn vitest run tests/unit` · Frontend: `cd Frontend && yarn lint && yarn build && yarn test` |

---

## Execution Plan

### Phase 1: Backend - login

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Backend - seed e solicitação de acesso

```
T6 → T7 → T8 → T9
```

### Phase 3: Frontend - base

```
T10
T11 → T12
```

### Phase 4: Frontend - telas e logout

```
T13 → T14 → T15
```

---

## Task Breakdown

### T1: Hash e verificação de senha

**What**: `gerarHashSenha(senha)` e `verificarSenha(senha, hash)` com `node:crypto` scrypt (`salt:hash` hex, `timingSafeEqual`).
**Where**: `Backend/src/utils/senha.ts`
**Depends on**: None
**Reuses**: stdlib `node:crypto`
**Requirement**: AUTH-01, AUTH-02, AUTH-03

**Done when**:

- [x] Senha correta → `true`; errada → `false`; hash malformado → `false` (sem exceção)
- [x] Dois hashes da mesma senha diferem (salt)
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add scrypt password hashing`

---

### T2: Campos de credencial no schema User

**What**: Adicionar `email` (lowercase, trim, unique, sparse), `usuario` (trim, unique, sparse) e `senhaHash` (`select: false`) ao schema `user`.
**Where**: `Backend/src/schemas/user.ts`
**Depends on**: T1
**Reuses**: schema existente
**Requirement**: AUTH-05

**Done when**:

- [x] `userRepository` continua convertendo só `nome`/`role` (hash nunca sai em `/api/users`)
- [x] Gate build passa

**Tests**: none
**Gate**: build
**Commit**: `feat(auth): add credential fields to user schema`

---

### T3: Serviço de login

**What**: `login(role, login, senha)` busca `{ role, email: login.trim().toLowerCase() }` (admin) ou `{ role, usuario: login.trim() }` (colaborador) com `.select('+senhaHash')`, verifica a senha e devolve `{ token, user: { _id, nome, role } }`; falha lança `Error("Credenciais inválidas.")`; sem `JWT_SECRET` lança erro de configuração. Adiciona `jsonwebtoken` + `@types/jsonwebtoken` e `jwt_secret`/`jwt_expires_in` em `config/env.ts`.
**Where**: `Backend/src/feature/auth/authService.ts`
**Depends on**: T2
**Reuses**: `utils/senha.ts`, `schemas/user.ts`, `config/env.ts`
**Requirement**: AUTH-01, AUTH-02, AUTH-03, AUTH-05, AUTH-06

**Done when**:

- [x] Testes com `User` mockado: admin ok, colaborador ok, senha errada, login inexistente, email com maiúsculas/espaços, sem `JWT_SECRET`
- [x] JWT decodificado tem `sub` = `_id` e `role`; resposta não tem `senhaHash`
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add login service with jwt`

---

### T4: Controller e regras de login

**What**: `authRules` (`role` ∈ {admin, colaborador}, `login` e `senha` texto não vazio, padrão `request-check` + `isness`) e `authController.login` → 200 / 400 / 401 / 500.
**Where**: `Backend/src/feature/auth/authController.ts`
**Depends on**: T3
**Reuses**: `userRules.ts` (padrão de regras), `responseHandler.ts`, estilo de `forkliftController.test.ts`
**Requirement**: AUTH-03, AUTH-04

**Done when**:

- [x] Testes: 200 com payload do serviço, 400 para cada campo inválido, 401 com `"Credenciais inválidas."`, 500 em erro inesperado
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add login controller and validation`

---

### T5: Rota de auth e CORS no servidor

**What**: `authRouter` (`POST /login`) montado em `/api/auth`; remover o `POST /auth/login` antigo de `server.ts`; `app.use(cors())`; `JWT_SECRET`/`JWT_EXPIRES_IN` no `.env.example`.
**Where**: `Backend/src/server.ts`
**Depends on**: T4
**Reuses**: padrão de `userRouter.ts`
**Requirement**: AUTH-01

**Done when**:

- [x] Gate build passa

**Tests**: none
**Gate**: build
**Commit**: `feat(auth): mount auth routes and enable cors`

---

### T6: Script de seed do admin

**What**: `seedAdmin()` lê `SEED_ADMIN_EMAIL`/`SEED_ADMIN_SENHA`/`SEED_ADMIN_NOME`, cria admin se o email não existe, avisa e sai sem criar se faltar variável; executável direto (`yarn seed`); variáveis no `.env.example`.
**Where**: `Backend/src/scripts/seedAdmin.ts`
**Depends on**: None (fase 1 concluída)
**Reuses**: `utils/senha.ts`, `schemas/user.ts`, `utils/logger.ts`
**Requirement**: SEED-01

**Done when**:

- [x] Testes com `User` mockado: cria quando não existe (com `senhaHash` válido, `role: 'admin'`), não cria quando existe, não cria com variável faltando
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add admin seed script`

---

### T7: Flag `--seed` no servidor

**What**: Se `process.argv.includes('--seed')`, `await seedAdmin()` antes do `app.listen`; script `dev:seed` (`tsx watch src/server.ts --seed`).
**Where**: `Backend/src/server.ts`
**Depends on**: T6
**Reuses**: `scripts/seedAdmin.ts`
**Requirement**: SEED-02

**Done when**:

- [x] Gate build passa

**Tests**: none
**Gate**: build
**Commit**: `feat(auth): run admin seed on --seed flag`

---

### T8: Schema de solicitação de acesso

**What**: Schema `accessRequest` (`email` lowercase/trim, `nomeEmpresa`, `nomeAdministrador`, `status` default `'pendente'`, `timestamps`).
**Where**: `Backend/src/schemas/accessRequest.ts`
**Depends on**: T7
**Reuses**: padrão de `schemas/user.ts`
**Requirement**: REQ-01

**Done when**:

- [x] Gate build passa

**Tests**: none
**Gate**: build
**Commit**: `feat(access-request): add access request schema`

---

### T9: Endpoint de solicitação de acesso

**What**: Regras + `criar` (400 / 409 se já há `pendente` com o email / 201) + router montado em `/api/access-requests`.
**Where**: `Backend/src/feature/accessRequest/accessRequestController.ts`
**Depends on**: T8
**Reuses**: `userRules.ts`, `responseHandler.ts`
**Requirement**: REQ-01

**Done when**:

- [x] Testes com schema mockado: 201, 400 (cada campo + email inválido), 409, 500
- [x] Gate build passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(access-request): add access request endpoint`

---

### T10: Cliente da API e authService

**What**: `api.ts` com `baseURL` de `VITE_API_URL` (fallback `http://localhost:3000/api`) e sem o interceptor 401; `authService` com `login(role, login, senha)` (salva `token` e `user`), `solicitarAcesso(dados)` e `logout()` (remove ambos).
**Where**: `Frontend/src/services/authService.ts`
**Depends on**: None
**Reuses**: `services/api.ts`
**Requirement**: AUTH-07, REQ-02, OUT-01

**Done when**:

- [x] Testes com `api` mockado: payload de login, `localStorage` preenchido após sucesso e limpo após `logout`, payload de solicitação
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): wire auth service to backend`

---

### T11: Textos novos nos 7 idiomas

**What**: Chaves `auth.tabRequest`, `auth.tabAdmin`, `auth.tabCollaborator`, `auth.invalidCredentials`, `auth.networkError`, `auth.requestDuplicate`, `navigation.logout`; `heroSignupTitle` → "Comece conosco"; `forgotPassword` com "!"; remover chaves dos links cruzados, "ou" e "Já tem cadastro?".
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Reuses**: estrutura atual dos locales
**Requirement**: AUTHUI-06, AUTH-08

**Done when**:

- [x] Teste de paridade de chaves `auth`/`navigation` nos 7 idiomas
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(i18n): add auth tab, error and logout strings`

---

### T12: AuthLayout com abas e painel sempre visível

**What**: Remover a prop `layout` (sempre dividido, painel com `heroTitle`/`heroSubtitle`/cards fixos); abas `NavLink` para as três rotas abaixo do subtítulo, ativa em gradiente; CSS das abas conforme imagens.
**Where**: `Frontend/src/components/auth/AuthLayout.tsx`
**Depends on**: T11
**Reuses**: `AuthLayout.module.css`, gradiente de `.submitButton`
**Requirement**: AUTHUI-05, AUTHUI-06

**Done when**:

- [x] Testes: três abas na ordem com `href` corretos, aba da rota atual com `aria-current="page"`, painel com "Comece conosco" e três cards
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add tabs and shared hero to auth layout`

---

### T13: LoginPage única para admin e colaborador

**What**: Substituir `LoginAdminPage`/`LoginColaboradorPage` por `LoginPage` com prop `role` (`admin` → "Email empresarial", `colaborador` → "Usuário"); chama `authService.login`, navega para `/` no sucesso, exibe 401/sem-resposta, desabilita "Entrar" durante a requisição; remove links cruzados e `console.log`; rotas atualizadas.
**Where**: `Frontend/src/pages/LoginPage.tsx`
**Depends on**: None (fase 3 concluída)
**Reuses**: `AuthField`, `AuthForm.module.css`, `authService`
**Requirement**: AUTH-07, AUTH-08, AUTH-09, AUTHUI-07

**Done when**:

- [x] `LoginPage.test.tsx` substitui os dois testes antigos: sucesso (admin e colaborador, `role` correto enviado), 401, sem resposta, validação, botão desabilitado, campos da imagem 1
- [x] Gate full passa

**Tests**: integration
**Gate**: full
**Commit**: `feat(auth): integrate login page with backend`

---

### T14: SolicitarAcessoPage integrada

**What**: Chama `authService.solicitarAcesso`; sucesso mostra a caixa atual; 409 mostra a mensagem de duplicata; remove link cruzado, divisor e "Já tem cadastro?" (e o CSS órfão em `AuthForm.module.css`).
**Where**: `Frontend/src/pages/SolicitarAcessoPage.tsx`
**Depends on**: T13
**Reuses**: `authService`
**Requirement**: REQ-02, AUTHUI-07

**Done when**:

- [x] Testes: 201 → "Solicitação enviada!", 409 → mensagem e formulário mantido, validação atual, ausência dos blocos removidos
- [x] Gate full passa

**Tests**: integration
**Gate**: full
**Commit**: `feat(access-request): submit access request to backend`

---

### T15: Botão de logout no Header

**What**: Botão "Sair" (`LogOut`) nas ações do Header; chama `authService.logout()` e navega para `/login`.
**Where**: `Frontend/src/components/layout/Header.tsx`
**Depends on**: T14
**Reuses**: `iconButton` do Header, `authService`
**Requirement**: OUT-01

**Done when**:

- [x] Teste: clique remove `token`/`user` e navega para `/login`
- [x] Gate build passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(auth): add logout button to header`

---

## Validation Tables

### Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ----------------- | ------------- | ------ |
| T1 | None | início da fase 1 | ✅ |
| T2 | T1 | T1 → T2 | ✅ |
| T3 | T2 | T2 → T3 | ✅ |
| T4 | T3 | T3 → T4 | ✅ |
| T5 | T4 | T4 → T5 | ✅ |
| T6 | None (fase 1 concluída) | início da fase 2 | ✅ |
| T7 | T6 | T6 → T7 | ✅ |
| T8 | T7 | T7 → T8 | ✅ |
| T9 | T8 | T8 → T9 | ✅ |
| T10 | None | início da fase 3 | ✅ |
| T11 | None | início da fase 3 | ✅ |
| T12 | T11 | T11 → T12 | ✅ |
| T13 | None (fase 3 concluída) | início da fase 4 | ✅ |
| T14 | T13 | T13 → T14 | ✅ |
| T15 | T14 | T14 → T15 | ✅ |

### Test Co-location Validation

| Task | Layer | Matrix Requires | Task Says | Status |
| ---- | ----- | --------------- | --------- | ------ |
| T1 | Backend util | unit | unit | ✅ |
| T2 | Backend schema | none | none | ✅ |
| T3 | Backend service | unit | unit | ✅ |
| T4 | Backend controller | unit | unit | ✅ |
| T5 | Backend router/server | none | none | ✅ |
| T6 | Backend script | unit | unit | ✅ |
| T7 | Backend server | none | none | ✅ |
| T8 | Backend schema | none | none | ✅ |
| T9 | Backend controller | unit | unit | ✅ |
| T10 | Front service | unit | unit | ✅ |
| T11 | Locales | unit | unit | ✅ |
| T12 | Front componente | unit | unit | ✅ |
| T13 | Front página | integration | integration | ✅ |
| T14 | Front página | integration | integration | ✅ |
| T15 | Front componente | unit | unit | ✅ |
