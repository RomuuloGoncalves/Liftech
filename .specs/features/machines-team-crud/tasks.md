# machines-team-crud Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/machines-team-crud/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `Backend/package.json` (`test` = só `tests/unit`), `.specs/STATE.md` (AD-010: testes com models mockados; Node 24+ no Frontend). Nenhum teste toca o banco.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend schema | unit | `validateSync()` e `schema.indexes()`/paths | `Backend/tests/unit/schemas.test.ts` | `cd Backend && npx vitest run tests/unit/schemas.test.ts` |
| Backend middleware / auth | unit | cada AC (401/403), models mockados | `Backend/tests/unit/{autenticar,authService,authController}.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend service | unit | 1:1 aos ACs e edge cases, models mockados | `Backend/tests/unit/<nome>Service.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>.test.ts` |
| Backend controller / route | unit | happy path + cada erro (400/403/404/409), service mockado | `Backend/tests/unit/<nome>Controller.test.ts` | `cd Backend && npx vitest run tests/unit/<nome>Controller.test.ts` |
| Frontend service | unit | URL, método, corpo; `api` mockado | `Frontend/src/test/services/*.test.ts` | `cd Frontend && npx vitest run src/test/services` |
| Frontend page / component | unit (Testing Library) | cada AC visível + erro/rollback; serviços mockados | `Frontend/src/test/{pages,components}/**` | `cd Frontend && npx vitest run src/test/<caminho>` |
| Frontend data | unit | funções puras | `Frontend/src/test/data/*.test.ts` | `cd Frontend && npx vitest run src/test/data` |
| Frontend i18n | unit | paridade nos 7 idiomas | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && npx vitest run src/test/config/i18n.test.ts` |

## Gate Check Commands

> Frontend com `export PATH=/home/romulo/.nvm/versions/node/v25.9.0/bin:$PATH`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Depois de cada task | Run Command da task + `cd Backend && npx tsc --noEmit` ou `cd Frontend && npx tsc -b` |
| Build | Fim de cada fase | Backend: `npx tsc --noEmit && yarn test`; Frontend: `npx tsc -b && npx eslint . && npx vitest run` |

---

## Execution Plan

### Phase 1: Backend base (schemas, acesso)

```
T1 → T2 → T3
```

### Phase 2: Backend máquinas

```
T4 → T5 → T6 → T7
```

### Phase 3: Backend operadores e login

```
T8 → T9 → T10
```

### Phase 4: Frontend Visão Geral

```
T11 → T12 → T13
```

### Phase 5: Frontend Equipe

```
T14 → T15 → T16 → T17
```

---

## Task Breakdown

### T1: Campos novos nos schemas

**What**: `operator` ganha `matricula`, `telefone`, `cargo`, `horarioEntrada`, `horarioSaida`; `user` ganha `acessoNegado` (padrão `false`); `device` ganha `nome` e `enderecoMac` único.
**Where**: `Backend/src/schemas/operator.ts` (+ schemas `user` e `device`)
**Depends on**: None
**Reuses**: padrão de `schemas.test.ts`
**Requirement**: OPER-01, LOGIN-06, MACH-05

**Done when**:

- [x] Paths novos existem; `acessoNegado` nasce `false`; índice único em `enderecoMac`
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(schemas): add operator, login access and device fields`

---

### T2: `autenticar` recusa acesso negado e `exigirAdmin`

**What**: `autenticar` responde 401 para `user.acessoNegado`; novo `exigirAdmin(usuario, mensagem)` lança 403 para role ≠ admin.
**Where**: `Backend/src/core/autenticar.ts`
**Depends on**: T1
**Reuses**: `exigirEmpresa` (forma), `ErroHttp`
**Requirement**: LOGIN-11, OPER-10

**Done when**:

- [x] Teste: user com `acessoNegado: true` → 401 e `next` não chamado; `false` → segue
- [x] Teste: `exigirAdmin` lança 403 com a mensagem para colaborador e passa para admin
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): block denied users and add admin guard`

---

### T3: Login recusa acesso negado

**What**: `login` com senha certa e `acessoNegado` lança 403 "Acesso negado."; o controller responde o status do `ErroHttp`.
**Where**: `Backend/src/feature/auth/authService.ts` (+ `authController.ts`, testes)
**Depends on**: T2
**Reuses**: `ErroHttp`, `responderErro`
**Requirement**: LOGIN-10

**Done when**:

- [x] Teste: senha certa + `acessoNegado` → 403 sem token; senha errada + `acessoNegado` → 401 "Credenciais inválidas."
- [x] Gate build do Backend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(auth): refuse login for denied collaborators`

---

### T4: `criarMaquina` no service

**What**: Extrai `categoriaDoStatus` do `aplicarStatus`; `criarMaquina` cria device + forklift (`disponivel`, categoria ligada), checa identificação e MAC (409), compensa o device e devolve a máquina; `consultar` devolve `nomeDispositivo`.
**Where**: `Backend/src/feature/machine/machineService.ts` (+ `statusService.ts`, testes)
**Depends on**: None (fase 1 concluída)
**Reuses**: `aplicarStatus`, `obterMaquina`, `traduzirErro` (padrão)
**Requirement**: MACH-01, MACH-02, MACH-04, MACH-05

**Done when**:

- [x] Testes: cria os dois documentos ligados na filial; status `disponivel` e categoria do status (ou `null`); identificação repetida → 409; MAC repetido (maiúsculas) → 409; 11000 → 409; falha do forklift apaga o device; resposta com `nomeDispositivo`
- [x] Testes do `statusService` seguem verdes
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): create forklift and device together`

---

### T5: `atualizarMaquina` no service

**What**: Grava só os campos livres no forklift e no device; checa identificação e MAC contra os outros.
**Where**: `Backend/src/feature/machine/machineService.ts` (+ teste)
**Depends on**: T4
**Reuses**: `obterMaquina`
**Requirement**: MACH-06, MACH-10

**Done when**:

- [x] Testes: cada campo vai ao documento certo; identificação/MAC de outra máquina → 409; o próprio MAC repetido passa; fora do escopo → 404
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): update machine and device fields`

---

### T6: `excluirMaquina` no service

**What**: 409 com sessão aberta; senão apaga forklift e device.
**Where**: `Backend/src/feature/machine/machineService.ts` (+ teste)
**Depends on**: T5
**Reuses**: `WorkSession`, `obterMaquina`
**Requirement**: MACH-08, MACH-09, MACH-10

**Done when**:

- [x] Testes: sessão aberta → 409 sem `deleteOne`; sem sessão apaga os dois e devolve `{ _id, message }`; fora do escopo → 404
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): delete machine unless a session is open`

---

### T7: Rotas POST, PUT e DELETE de `/api/machines`

**What**: `criar`, `atualizar`, `deletar` no controller com validação do corpo e `resolverFilial`; rotas no router.
**Where**: `Backend/src/feature/machine/machineController.ts` (+ `machineRouter.ts`, teste)
**Depends on**: T6
**Reuses**: `lerId`, `lerCorpo`, `resolverFilial`
**Requirement**: MACH-01, MACH-03, MACH-06, MACH-07, MACH-08

**Done when**:

- [x] Testes: POST 201; campo obrigatório ausente/vazio → 400; PUT com campo protegido ou desconhecido → 400 com o nome do campo; id inválido → 400; `$` → 400; DELETE 200; erros do service repassados
- [x] Gate build do Backend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(machines): add create, update and delete routes`

---

### T8: `operatorService` (CRUD)

**What**: `listar`, `criar` (matrícula gerada), `atualizar` (propaga `nome` ao login), `excluir` (409 com sessão aberta; apaga o login junto) e `formatar`; remove o repository/model mortos.
**Where**: `Backend/src/feature/operator/operatorService.ts`
**Depends on**: None (fase 2 concluída)
**Reuses**: `filtroPorFilial`, `listarMaquinas` (interseção de filial)
**Requirement**: OPER-01, OPER-02, OPER-03, OPER-05, OPER-06, OPER-07, OPER-08, OPER-09

**Done when**:

- [x] Testes 1:1 aos ACs: formato com `usuario`/`acesso`; filtro de filial só reduz; matrícula `EMP-001` sem operadores e `EMP-093` depois de `EMP-092`; nome propagado; 409 sem apagar; exclusão apaga o `user` do `operadorId`; 404 fora do escopo
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(operators): add operator service`

---

### T9: Login do operador no service

**What**: `criarLogin`, `atualizarLogin`, `removerLogin`.
**Where**: `Backend/src/feature/operator/operatorService.ts` (+ teste)
**Depends on**: T8
**Reuses**: `gerarHashSenha`
**Requirement**: LOGIN-01, LOGIN-02, LOGIN-03, LOGIN-05, LOGIN-06, LOGIN-07, LOGIN-08, LOGIN-09

**Done when**:

- [x] Testes: cria user colaborador com os campos do design e hash verificável; 409 já tem login; 409 usuário em uso (checagem e 11000); troca de senha grava hash novo; `acessoNegado` gravado e `acesso` correspondente; 404 sem login; remove → `usuario: null`; resposta sem `senha`/`senhaHash`
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(operators): manage collaborator login`

---

### T10: Rotas de `/api/operators`

**What**: Controller com `exigirAdmin` e validação; router; `app.ts` monta `/api/operators`.
**Where**: `Backend/src/feature/operator/operatorController.ts` (+ `operatorRouter.ts`, `app.ts`, teste)
**Depends on**: T9
**Reuses**: padrão do `categoryController`
**Requirement**: OPER-03, OPER-04, OPER-05, OPER-10, LOGIN-04

**Done when**:

- [x] Testes: colaborador → 403 em toda rota; nome vazio, horário fora de `HH:mm`, usuário com espaço ou curto, senha < 8 ou > 72, `acessoNegado` não booleano → 400; campo extra no PUT → 400; id inválido → 400; happy path de cada rota; `app.test` cobre o mount (401 sem token)
- [x] Gate build do Backend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(operators): add operator and login routes`

---

### T11: `machineService` do front

**What**: `criar(values, filialId?)`, `atualizar(id, values)`, `remover(id)`.
**Where**: `Frontend/src/services/machineService.ts` (+ teste)
**Depends on**: None (fase 3 concluída)
**Reuses**: `api`
**Requirement**: MACH-11

**Done when**:

- [x] Teste: método, URL e corpo de cada chamada
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): add create, update and delete to the machine service`

---

### T12: `NewMachinePanel` com MAC obrigatório e filial

**What**: MAC obrigatório; select Filial quando recebe `branches`; `onCreate` recebe `filialId`.
**Where**: `Frontend/src/components/machines/NewMachinePanel.tsx` (+ teste, locales)
**Depends on**: T11
**Reuses**: estilo de campo do painel
**Requirement**: MACH-03, LOGIN-15

**Done when**:

- [x] Testes: MAC vazio mostra erro e não envia; select aparece só com `branches` e envia a escolhida
- [x] Chaves novas nos 7 idiomas, traduzidas
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): require MAC and pick the branch on register`

---

### T13: Visão Geral grava pela API

**What**: Criar, editar e excluir otimistas com rollback e toast (409 na exclusão com mensagem própria).
**Where**: `Frontend/src/pages/VisaoGeralPage.tsx` (+ teste, locales)
**Depends on**: T12
**Reuses**: `updateMachine`, `useToast`, `useActiveBranch`
**Requirement**: MACH-11, MACH-12, LOGIN-15

**Done when**:

- [ ] Testes: card aparece antes da resposta e é trocado por ela; falha remove e mostra toast; editar com falha volta; excluir 409 volta e mostra "sessão aberta"; com "Todas as filiais" e 2+ filiais o painel mostra Filial
- [ ] Gate build do Frontend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(machines): persist register, edit and delete on the overview`

---

### T14: `operatorService` do front

**What**: `listar(filialId?)`, `criar`, `atualizar`, `remover`, `criarLogin`, `atualizarLogin`.
**Where**: `Frontend/src/services/operatorService.ts` (+ teste)
**Depends on**: None (fase 4 concluída)
**Reuses**: `api`
**Requirement**: OPER-11, LOGIN-12

**Done when**:

- [ ] Teste: método, URL e corpo de cada chamada
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): add operator service`

---

### T15: Tipo `Employee` da API, card e info

**What**: `Employee` no formato da API (sai `senha`, entram `usuario | null` e `filialId`); saem `EMPLOYEES` e `nextEmployeeCode`; `EmployeeInfoModal` sem senha; `EmployeeCard` com interruptor desabilitado sem login.
**Where**: `Frontend/src/data/team.ts` (+ `EmployeeCard.tsx`, `EmployeeInfoModal.tsx`, fixture e testes)
**Depends on**: T14
**Reuses**: `filterEmployees`, `isUsernameTaken`
**Requirement**: OPER-01, LOGIN-09

**Done when**:

- [ ] Testes: filtros sobre fixture; card sem login com interruptor desabilitado; info sem linha de senha
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `refactor(team): use the API employee shape`

---

### T16: `EmployeeFormModal` para login real

**What**: Senha opcional na edição de quem tem login (8+ caracteres quando preenchida); usuário só leitura com login; select Filial no cadastro.
**Where**: `Frontend/src/components/team/EmployeeFormModal.tsx` (+ teste, locales)
**Depends on**: T15
**Reuses**: `TeamForm.module.css`
**Requirement**: LOGIN-04, LOGIN-13, LOGIN-15

**Done when**:

- [ ] Testes: edição com senha vazia salva sem `senha`; senha curta mostra erro; usuário desabilitado com login; select de filial só no cadastro com `branches`
- [ ] Gate quick passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(team): handle login fields in the employee form`

---

### T17: Equipe lê e grava pela API

**What**: Carga da filial ativa (skeleton, erro, retry); criar (operador + login, falha do login vira toast); editar (+ senha/login); excluir e acesso otimistas com rollback; 409 com mensagem própria.
**Where**: `Frontend/src/pages/EquipePage.tsx` (+ teste, locales)
**Depends on**: T16
**Reuses**: carga da `VisaoGeralPage`, `useToast`, `useActiveBranch`
**Requirement**: OPER-11, OPER-12, LOGIN-12, LOGIN-13, LOGIN-14, LOGIN-15

**Done when**:

- [ ] Testes 1:1 aos ACs de front; setores seguem do mock
- [ ] Gate build do Frontend passa

**Tests**: unit
**Gate**: build
**Commit**: `feat(team): read and write employees through the API`

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram | Status |
| ---- | ----------------- | ------- | ------ |
| T1 | None | início fase 1 | ✅ |
| T2 | T1 | T1 → T2 | ✅ |
| T3 | T2 | T2 → T3 | ✅ |
| T4 | None | início fase 2 | ✅ |
| T5 | T4 | T4 → T5 | ✅ |
| T6 | T5 | T5 → T6 | ✅ |
| T7 | T6 | T6 → T7 | ✅ |
| T8 | None | início fase 3 | ✅ |
| T9 | T8 | T8 → T9 | ✅ |
| T10 | T9 | T9 → T10 | ✅ |
| T11 | None | início fase 4 | ✅ |
| T12 | T11 | T11 → T12 | ✅ |
| T13 | T12 | T12 → T13 | ✅ |
| T14 | None | início fase 5 | ✅ |
| T15 | T14 | T14 → T15 | ✅ |
| T16 | T15 | T15 → T16 | ✅ |
| T17 | T16 | T16 → T17 | ✅ |

## Test Co-location Validation

| Task | Layer | Matrix | Task Says | Status |
| ---- | ----- | ------ | --------- | ------ |
| T1 | schema | unit | unit | ✅ |
| T2–T3 | middleware/auth | unit | unit | ✅ |
| T4–T6, T8–T9 | service | unit | unit | ✅ |
| T7, T10 | controller | unit | unit | ✅ |
| T11, T14 | front service | unit | unit | ✅ |
| T12, T15–T16 | component/data | unit | unit | ✅ |
| T13, T17 | page | unit | unit | ✅ |
