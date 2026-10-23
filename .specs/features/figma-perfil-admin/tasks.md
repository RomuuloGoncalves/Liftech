# Perfil do admin Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Sem commit (decisão do dono):** cada task termina com o gate verde e a marcação em `tasks.md`, sem `git commit`. O nível 1 integra os diffs na branch `fix/crud-funcionario-integridade`. Nunca acessar banco de dados.

---

**Design**: `.specs/features/figma-perfil-admin/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `.specs/STATE.md` AD-010 (testes do Backend sem banco, models mockados; `yarn test` só roda `tests/unit`), `Backend/package.json`, `Frontend/package.json`, `Frontend/src/test/setup.ts`. Amostras: `Backend/tests/unit/authService.test.ts`, `sessionController.test.ts`, `app.test.ts`; `Frontend/src/test/services/authService.test.ts`, `test/components/layout/Header.test.tsx`, `test/components/common/Modal.test.tsx`, `test/config/i18n.test.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend service (`feature/*/…Service.ts`) | unit (vitest, `User` mockado) | Todos os ramos; 1:1 com os PRF do backend; todos os edge cases da spec | `Backend/tests/unit/<nome>.test.ts` | `cd Backend && yarn test` |
| Backend controller/router | unit (vitest, `req`/`res` mockados) | Cada rota: sucesso + cada status de erro repassado; rotas montadas no router | `Backend/tests/unit/<nome>Controller.test.ts` | `cd Backend && yarn test` |
| Backend `app.ts` | unit HTTP (`app.listen(0)`, schemas mockados) | Rota montada atrás de `autenticar` (401 sem token) | `Backend/tests/unit/app.test.ts` | `cd Backend && yarn test` |
| Frontend service | unit (vitest, `api` mockado) | Chamada HTTP exata, efeito na sessão local, erro propagado | `Frontend/src/test/services/<nome>.test.ts` | `cd Frontend && yarn test` |
| Frontend componente | unit (vitest + testing-library) | Cada AC de UI: render, interação, estados desabilitado/carregando, cada mensagem de erro | `Frontend/src/test/components/layout/<Nome>.test.tsx` | `cd Frontend && yarn test` |
| Locales | unit existente (`i18n.test.ts`, paridade de chaves) | Paridade entre os 7 locales | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && yarn test` |

## Gate Check Commands

> Generated from codebase - confirm before Execute. No Frontend, antes de tudo: `export PATH=$HOME/.nvm/versions/node/v25.9.0/bin:$PATH`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Task de Backend | `cd Backend && yarn test` |
| Quick | Task de Frontend | `cd Frontend && yarn test` |
| Full | Fim da fase de Backend | `cd Backend && yarn build && yarn test` |
| Build | Fim da fase de Frontend | `cd Frontend && yarn lint && yarn build && yarn test` (conferir no log do `vite build` que o chunk de entrada segue ≤ 100 kB gzip e que existe um chunk separado do `ProfileModal`) |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend `/api/me` e e-mail no login

```
T1 → T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 2: Frontend do Perfil

```
T8 → T9 → T10 → T11 → T12
```

---

## Task Breakdown

### T1: Validação do corpo de `/api/me`

**What**: Criar `meService.ts` com `validarAtualizacao(corpo)` e `validarExclusao(corpo)` lançando `ErroHttp(400)` conforme o design, e a constante da regex de e-mail.
**Where**: `Backend/src/feature/me/meService.ts` [NEW]
**Depends on**: None
**Reuses**: `utils/corpo.ts` (`exigirSemOperadores`), regex de `accessRequestRules.ts:15`, `ErroHttp`
**Requirement**: PRF-11, PRF-12, PRF-20, PRF-22

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `validarAtualizacao` devolve `{ senhaAtual, email?, novaSenha? }` com e-mail em `trim().toLowerCase()`
- [ ] 400 para: chave fora de `senhaAtual|email|novaSenha` (incluindo `_id`, PRF-22), chave `$`, sem `email` e sem `novaSenha`, `senhaAtual` vazia/não texto, e-mail inválido, `novaSenha` com 7 caracteres ou não texto
- [ ] `novaSenha` com exatamente 8 caracteres passa
- [ ] `validarExclusao` dá 400 para `senhaAtual` ausente, `''`, `'   '` e número
- [ ] Testes em `Backend/tests/unit/meService.test.ts`
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: suíte anterior + ≥ 12 novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T2: `atualizarConta`

**What**: Acrescentar `atualizarConta(usuario, dados)` a `meService.ts`: `exigirAdmin`, leitura com `+senhaHash`, `verificarSenha`, `updateOne` com `email` e/ou `senhaHash`, 11000 → 409, retorno `{ email }`.
**Where**: `Backend/src/feature/me/meService.ts` (modify)
**Depends on**: T1
**Reuses**: `exigirAdmin` (`core/autenticar.ts:48`), `verificarSenha`/`gerarHashSenha` (`utils/senha.ts`), padrão 11000 de `branchService.ts:14-16`
**Requirement**: PRF-07, PRF-08, PRF-09, PRF-10, PRF-21, PRF-22, PRF-23

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Colaborador → 403 e `User.findById` não é chamado (PRF-21)
- [ ] Senha errada → 403 "Senha atual incorreta." e `updateOne` não é chamado (PRF-09)
- [ ] E-mail novo → `updateOne({ _id: usuario._id }, { $set: { email } })` e retorno `{ email }` (PRF-07, PRF-22)
- [ ] Senha nova → `$set.senhaHash` verificável com `verificarSenha(novaSenha, hash)` e diferente do texto puro; retorno `{ email: <atual> }` (PRF-08, PRF-23)
- [ ] `updateOne` rejeitando com `{ code: 11000 }` → 409 "E-mail já em uso." (PRF-10)
- [ ] Usuário não encontrado → 404 "Usuário não encontrado(a)."
- [ ] E-mail igual ao atual → 200 com o mesmo e-mail (edge case)
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: suíte de T1 + ≥ 7 novos

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T3: `excluirConta`

**What**: Acrescentar `excluirConta(usuario, empresaId, senhaAtual)` a `meService.ts`: `exigirAdmin`, conferir senha, contar outros admins com login, 409 se zero ou sem empresa, `deleteOne`.
**Where**: `Backend/src/feature/me/meService.ts` (modify)
**Depends on**: T2
**Reuses**: leitura e checagem de senha de T2
**Requirement**: PRF-17, PRF-18, PRF-19, PRF-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Colaborador → 403 sem ler nem apagar (PRF-21)
- [ ] Senha errada → 403 e `deleteOne` não é chamado (PRF-19)
- [ ] `countDocuments` chamado com `{ empresaId, role: 'admin', _id: { $ne: id }, email: { $exists: true }, acessoNegado: { $ne: true } }`
- [ ] Contagem 0 → 409 "Você é o único administrador da empresa." sem `deleteOne` (PRF-18)
- [ ] `empresaId` ausente → 409 sem `countDocuments` nem `deleteOne`
- [ ] Contagem ≥ 1 → `deleteOne({ _id: id })` (PRF-17)
- [ ] Comentário `// ponytail:` sobre a corrida count + delete
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: suíte de T2 + ≥ 6 novos

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T4: `meController`

**What**: Criar `atualizar` e `excluir` que validam o corpo, chamam o serviço com `req.usuario` (e `req.escopo.empresaId` no excluir) e respondem 200 ou `responderErro`.
**Where**: `Backend/src/feature/me/meController.ts` [NEW]
**Depends on**: T3
**Reuses**: molde de `sessionController.ts` / `responderErro`
**Requirement**: PRF-07, PRF-17, PRF-23

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `atualizar`: 200 `{ email }`; repassa 400/403/404/409 do serviço com `{ error }`
- [ ] `excluir`: 200 `{ _id, message: "Conta excluída com sucesso." }` e passa `req.escopo.empresaId` ao serviço
- [ ] Nenhuma resposta contém `senhaAtual`, `novaSenha` ou `senhaHash` (PRF-23)
- [ ] Testes em `Backend/tests/unit/meController.test.ts` com `meService` mockado
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: suíte de T3 + ≥ 6 novos

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T5: `meRouter`

**What**: Criar o router com `PUT /` → `atualizar` e `DELETE /` → `excluir`.
**Where**: `Backend/src/feature/me/meRouter.ts` [NEW]
**Depends on**: T4
**Reuses**: formato de `authRouter.ts`
**Requirement**: PRF-07, PRF-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Caso em `meController.test.ts` confere no `router.stack` as rotas `put /` e `delete /` ligadas aos handlers (mesmo jeito de `sessionController.test.ts`)
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: suíte de T4 + ≥ 1 novo

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T6: Montar `/api/me` no app

**What**: Uma linha `app.use('/api/me', meRouter)` depois de `app.use('/api', autenticar)`, mais o import.
**Where**: `Backend/src/app.ts` (modify)
**Depends on**: T5
**Reuses**: `app.test.ts` (servidor real com schemas mockados)
**Requirement**: PRF-24, PRF-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `PUT /api/me` e `DELETE /api/me` sem token → 401 (PRF-24)
- [ ] `PUT /api/me` com token de admin e corpo `{}` → 400 (prova que a rota está montada e atrás do `autenticar`)
- [ ] Com `User.findById` devolvendo `role: 'colaborador'`, `PUT /api/me` com corpo válido → 403 (PRF-21)
- [ ] Só uma linha de rota tocada em `app.ts` (arquivo disputado com `figma-feedback`)
- [ ] Gate check passes: `cd Backend && yarn test`
- [ ] Test count: suíte de T5 + ≥ 3 novos

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T7: E-mail no retorno do login

**What**: Incluir `email: usuario.email` no `user` de `authService.login`.
**Where**: `Backend/src/feature/auth/authService.ts` (modify)
**Depends on**: T6
**Reuses**: `Backend/tests/unit/authService.test.ts`
**Requirement**: PRF-04, PRF-23

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Login de admin devolve `user.email === 'ana@empresa.com'` (PRF-04)
- [ ] Login de colaborador sem e-mail não tem a chave `email` depois de `JSON.stringify`
- [ ] Os asserts de `authService.test.ts:50,63,80` atualizados para o contrato novo; o assert de que não há `senhaHash` continua (PRF-23)
- [ ] Gate check passes: `cd Backend && yarn build && yarn test` (fim da fase)
- [ ] Test count: suíte de T6 + ≥ 1 novo, nenhum removido

**Tests**: unit
**Gate**: full
**Commit**: sem commit (decisão do dono)

---

### T8: Funções de conta no `authService` do Frontend

**What**: `email?: string` em `UsuarioLogado`; `atualizarConta(dados)` (PUT `/me`, regrava o e-mail na sessão) e `excluirConta(senhaAtual)` (DELETE `/me` com `{ data }`, depois `logout()`).
**Where**: `Frontend/src/services/authService.ts` (modify)
**Depends on**: None
**Reuses**: `saveBranches` (mesma regravação da sessão), mock de `api` de `test/services/authService.test.ts`
**Requirement**: PRF-07, PRF-08, PRF-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `atualizarConta({ senhaAtual, email })` chama `api.put('/me', ...)` e grava o `email` da resposta em `localStorage['user']`, mantendo os outros campos
- [ ] `atualizarConta({ senhaAtual, novaSenha })` não muda a sessão além do `email` devolvido
- [ ] `excluirConta('x')` chama `api.delete('/me', { data: { senhaAtual: 'x' } })` e apaga `token` e `user`
- [ ] Erro da API propaga e não mexe na sessão (nos dois casos)
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: suíte anterior + ≥ 5 novos

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T9: Textos `profile.*` nos 7 locales

**What**: Acrescentar o bloco `profile` (título, rótulos Email/Senha/Novo e-mail/Nova senha/Senha atual, `open`, `editEmail`, `editPassword`, `deleteAccount`, `logout` "Deslogar-se", `deleteWarning`, `save`, `delete`, `emailChanged` "E-mail alterado", `passwordChanged` "Senha alterada", `wrongPassword` "Senha atual incorreta", `emailInUse` "E-mail já em uso", `onlyAdmin` "Você é o único administrador da empresa", `genericError`, `minLength`).
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: T8
**Reuses**: `test/config/i18n.test.ts` (paridade)
**Requirement**: PRF-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Bloco `profile` com as mesmas chaves em `de`, `en-US`, `es`, `fr`, `ja`, `pt-BR`, `ru`; nenhuma chave existente alterada
- [ ] `i18n.test.ts` verde
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: igual à de T8 (só paridade)

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T10: `AccountActionModal`

**What**: Modal de ação (`email` | `senha` | `excluir`) com campo novo e "Senha atual", validação local, estado `saving` e mapeamento de erro por status.
**Where**: `Frontend/src/components/layout/AccountActionModal.tsx` [NEW]
**Depends on**: T9
**Reuses**: `Modal`, `DialogButtons.module.css`, `TeamForm.module.css`, `useToast`, `authService` (T8)
**Requirement**: PRF-07, PRF-08, PRF-09, PRF-10, PRF-13, PRF-14, PRF-15, PRF-16, PRF-17, PRF-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `email`: "Salvar" desabilitado com campo vazio ou senha atual vazia; com ambos, chama `atualizarConta({ senhaAtual, email })`, mostra "E-mail alterado" e chama `onDone(novoEmail)` (PRF-07, PRF-13)
- [ ] `senha`: desabilitado com 7 caracteres, habilitado com 8; sucesso mostra "Senha alterada" (PRF-08, PRF-13)
- [ ] `excluir`: mostra aviso e "Excluir"; sucesso chama `excluirConta` e navega para `/login` (PRF-16, PRF-17)
- [ ] 403 → texto "Senha atual incorreta" em `role="alert"` e modal aberto com o texto digitado (PRF-09)
- [ ] 409 em `email` → "E-mail já em uso"; 409 em `excluir` → "Você é o único administrador da empresa" (PRF-10, PRF-18)
- [ ] Outro erro → `toast.showError` e campos preservados
- [ ] Com a promessa pendente, botões desabilitados e segundo clique não chama o serviço de novo (PRF-14)
- [ ] "Cancelar" e Esc chamam `onCancel` sem chamar o serviço (PRF-15)
- [ ] Testes em `Frontend/src/test/components/layout/AccountActionModal.test.tsx` com `authService` mockado
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: suíte de T9 + ≥ 11 novos

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T11: `ProfileModal`

**What**: Vista "Perfil" do PNG (Email + lápis, Senha `••••••••` + lápis, "Excluir Conta", "Deslogar-se") que troca para o `AccountActionModal`, com o CSS do componente em `ProfileModal.module.css` usando só tokens de `index.css`.
**Where**: `Frontend/src/components/layout/ProfileModal.tsx` [NEW]
**Depends on**: T10
**Reuses**: `Modal`, `authService.getSession`/`logout`, `Pencil` do `lucide-react`, tokens `--red`, `--border`, `--text`
**Requirement**: PRF-01, PRF-02, PRF-03, PRF-05, PRF-06, PRF-15, PRF-16, PRF-23

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (só para conferir o espaçamento contra o PNG)

**Done when**:

- [ ] Abre com título "Perfil", e-mail da sessão, `••••••••`, "Excluir Conta" e "Deslogar-se"; nenhum botão de mostrar senha (PRF-01, PRF-23)
- [ ] Sessão sem `email` mostra "—" (PRF-05)
- [ ] Lápis têm nomes acessíveis "Editar e-mail" e "Editar senha" (PRF-06)
- [ ] Lápis do e-mail troca para o modal de edição e, no `onDone('novo@x.com')`, volta ao Perfil mostrando o novo e-mail
- [ ] Cancelar no modal de edição volta ao Perfil; só um `role="dialog"` existe por vez (PRF-15)
- [ ] "Excluir Conta" abre o modo `excluir` (PRF-16)
- [ ] "Deslogar-se" limpa `token`/`user` e navega para `/login` (PRF-02)
- [ ] X, Esc e clique no fundo chamam `onClose` (PRF-03)
- [ ] Testes em `Frontend/src/test/components/layout/ProfileModal.test.tsx`
- [ ] `test/styles/no-hardcoded-colors.test.ts` segue verde
- [ ] Gate check passes: `cd Frontend && yarn test`
- [ ] Test count: suíte de T10 + ≥ 8 novos

**Tests**: unit
**Gate**: quick
**Commit**: sem commit (decisão do dono)

---

### T12: Avatar do Header abre o Perfil

**What**: O botão do avatar abre o `ProfileModal` carregado com `React.lazy`, com `aria-haspopup="dialog"`, `aria-label` traduzido e foco devolvido ao fechar.
**Where**: `Frontend/src/components/layout/Header.tsx` (modify)
**Depends on**: T11
**Reuses**: `test/components/layout/Header.test.tsx`
**Requirement**: PRF-01, PRF-03, PRF-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Clicar no avatar mostra o dialog "Perfil" (`findByRole`, por causa do lazy) (PRF-01)
- [ ] Fechar pelo X devolve o foco ao avatar (PRF-03, PRF-06)
- [ ] O teste existente "renders notification and profile buttons" segue verde (ajustado só se o `aria-label` mudar para a chave traduzida, mantendo "Perfil do usuário" em pt-BR)
- [ ] Só o trecho do avatar e o `lazy` no topo mudam (arquivo disputado com `figma-alertas-dropdown`)
- [ ] Gate check passes: `cd Frontend && yarn lint && yarn build && yarn test` (fim da fase; entrada ≤ 100 kB gzip e chunk separado do `ProfileModal`)
- [ ] Test count: suíte de T11 + ≥ 2 novos

**Tests**: unit
**Gate**: build
**Commit**: sem commit (decisão do dono)

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 → T2 → T3 → T4 → T5 → T6 → T7
Phase 2:  T8 → T9 → T10 → T11 → T12
```

12 tasks: lote 1 = Phase 1 (7), lote 2 = Phase 2 (5). Os dois lotes são independentes no código (Backend e Frontend), mas rodam em sequência como manda a skill.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: validação | 2 funções puras, 1 arquivo | ✅ Granular |
| T2: atualizarConta | 1 função | ✅ Granular |
| T3: excluirConta | 1 função | ✅ Granular |
| T4: meController | 2 handlers, 1 arquivo | ⚠️ OK (coesos) |
| T5: meRouter | 1 arquivo | ✅ Granular |
| T6: montar rota | 1 linha | ✅ Granular |
| T7: e-mail no login | 1 campo | ✅ Granular |
| T8: authService front | 2 funções + 1 campo, 1 arquivo | ⚠️ OK (coesos) |
| T9: locales | 1 bloco em 7 arquivos irmãos (paridade obrigatória) | ⚠️ OK (precedente `fleet-kanban`, `alerts-history`) |
| T10: AccountActionModal | 1 componente | ✅ Granular |
| T11: ProfileModal | 1 componente + seu CSS module | ✅ Granular |
| T12: Header | 1 botão | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | None | início da Phase 2 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Backend service | unit | unit | ✅ OK |
| T2 | Backend service | unit | unit | ✅ OK |
| T3 | Backend service | unit | unit | ✅ OK |
| T4 | Backend controller | unit | unit | ✅ OK |
| T5 | Backend router | unit | unit | ✅ OK |
| T6 | Backend `app.ts` | unit HTTP | unit | ✅ OK |
| T7 | Backend service | unit | unit | ✅ OK |
| T8 | Frontend service | unit | unit | ✅ OK |
| T9 | Locales | unit (paridade) | unit | ✅ OK |
| T10 | Frontend componente | unit | unit | ✅ OK |
| T11 | Frontend componente | unit | unit | ✅ OK |
| T12 | Frontend componente | unit | unit | ✅ OK |

---

## Requirement → Task

| Requirement | Tasks |
| ----------- | ----- |
| PRF-01 | T11, T12 |
| PRF-02 | T11 |
| PRF-03 | T11, T12 |
| PRF-04 | T7 |
| PRF-05 | T11 |
| PRF-06 | T9, T11, T12 |
| PRF-07 | T2, T4, T5, T8, T10 |
| PRF-08 | T2, T8, T10 |
| PRF-09 | T2, T10 |
| PRF-10 | T2, T10 |
| PRF-11 | T1 |
| PRF-12 | T1 |
| PRF-13 | T10 |
| PRF-14 | T10 |
| PRF-15 | T10, T11 |
| PRF-16 | T10, T11 |
| PRF-17 | T3, T4, T5, T8, T10 |
| PRF-18 | T3, T10 |
| PRF-19 | T3 |
| PRF-20 | T1 |
| PRF-21 | T2, T3, T6 |
| PRF-22 | T1, T2 |
| PRF-23 | T2, T4, T7, T11 |
| PRF-24 | T6 |
