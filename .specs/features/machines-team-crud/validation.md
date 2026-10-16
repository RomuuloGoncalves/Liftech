# machines-team-crud Validation

**Verdict**: PASS ✅
**Date**: 2026-10-16
**Spec**: `.specs/features/machines-team-crud/spec.md`
**Diff range**: `85eae1a..a458dae` (18 commits, `e62d995` → `a458dae`, branch `feature/machines-team-crud`)
**Verifier**: independent sub-agent (author ≠ verifier), re-verification round 2 of 3

All 39 ACs and the 4 edge cases are covered with spec-exact assertions. Round 1 failed on LOGIN-15: no test checked the new `machines.*` keys and nothing checked that values were translated. Commit `a458dae` added that test. Both surviving mutants (P1, P2) now die, as do 3 new i18n mutants. Three minor observations remain; no AC covers them.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T14 | ✅ Done | One commit each (`e62d995`..`0f12872`) |
| T15 | ⚠️ Done with process deviation | `117a559` was committed with **17 failing tests** in `Frontend/src/test/pages/EquipePage.test.tsx` (17 failed / 16 passed, reproduced in a scratch worktree at `117a559`). T15's gate was "quick" (tsc + task tests), so the page suite stayed red until T17 (`4832ce9`) fixed it. This breaks execution-contract rule 2 (gate green before done). |
| T16-T17 | ✅ Done | `51bd1b1`, `4832ce9` |
| Fix (LOGIN-15) | ✅ Done | `a458dae` test(i18n), only `Frontend/src/test/config/i18n.test.ts` (+25 lines) |

---

## Gate Check

| Gate | Command | Result |
| ---- | ------- | ------ |
| Backend types | `cd Backend && npx tsc --noEmit` | ✅ exit 0 |
| Backend tests | `cd Backend && yarn test` (`vitest run tests/unit`) | ✅ 42 files, **770 passed**, 0 failed, 0 skipped |
| Frontend types | `cd Frontend && npx tsc -b` | ✅ exit 0 |
| Frontend lint | `cd Frontend && npx eslint .` | ✅ exit 0 |
| Frontend tests | `cd Frontend && npx vitest run` | ✅ **1312 passed**, 0 failed, 0 skipped (round 1: 1305; +7 from `a458dae`: 1 pt-BR test + 6 per-locale tests) |

- **Test count before feature** (at `85eae1a`, scratch worktree): Backend 612, Frontend 1241
- **After** (at `a458dae`, run in round 2): Backend 770 (+158), Frontend 1312 (+71)
- **Integration tests**: not run (`tests/integration` needs the DB, which is out of bounds)

### Test integrity (rewritten tests)

The spec changed behavior, so old tests were removed or rewritten. Every rewrite was checked for lost rigor:

| Old test | Replacement | Rigor |
| -------- | ----------- | ----- |
| `NewMachinePanel` "Nome and ID required, rest optional" | "Nome, ID and MAC Address required" + "does not call onCreate when only MAC is empty" | Stronger |
| `EmployeeInfoModal` "hides the password and toggles it" | "has no password row" + "empty Usuário without login" | Matches spec (password is never shown) |
| `data/team` EMPLOYEES shape, `nextEmployeeCode` (2 tests) | `'EMPLOYEES' in team === false`, `'nextEmployeeCode' in team === false`; matrícula moved to `operatorService.test.ts:124,137` (`EMP-093` after `EMP-092`, `EMP-001` when empty) | Kept, moved to the backend |
| `EmployeeFormModal` duplicate-usuario-on-edit (2 tests) | usuario is disabled once a login exists; duplicate check kept for an employee without login ("reports a duplicate when picking another employee's usuario") | Matches spec (no usuario rename) |
| `EquipePage` 27 sync tests | Same names, now async over the mocked `operatorService`, plus 20 new API tests | Kept; create now also asserts `criar`→`criarLogin` call order |
| `VisaoGeralPage` "does not call the API again…" | "registers, edits and deletes through the API…" asserts `criar(values, undefined)`, `atualizar('srv-EMP-200', …)`, `remover('srv-EMP-200')` | Stronger |

No assertion got weaker.

---

## Spec-Anchored Acceptance Criteria

Paths are relative to `Backend/tests/unit/` (BE) or `Frontend/src/test/` (FE).

### P1: Máquina persistida pela Visão Geral

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| MACH-01 | device + forklift linked by `dispositivoConectadoId`, filial from `resolverFilial`, 201, GET shape | BE `machineService.test.ts:376` `expect(Device.create).toHaveBeenCalledWith({ enderecoMac: 'AA:BB:CC:DD:EE', nome: 'Sensor 01', filialId: F1 })`; `:378` `Forklift.create` with `dispositivoConectadoId: DEVICE, filialId: F1`; `:394` `toMatchObject({ id, filialId, status: 'disponivel', categoriaId, dispositivoConectado: {...} })`; BE `machineController.test.ts:263-264` `criarMaquina` called with `filialId: FILIAL`, `status(201)` | ✅ |
| MACH-02 | `status: 'disponivel'`, `categoriaId` = category linked to `disponivel`, or `null` | BE `machineService.test.ts:377` `Category.findOne` with `{ empresaId, statusVinculados: 'disponivel' }`; `:382-384` `status: 'disponivel'`, `categoriaId: CATEGORIA`; `:409` `toMatchObject({ categoriaId: null })` | ✅ |
| MACH-03 | missing/empty `nome`/`identificacao`/`enderecoMac` → 400, nothing written | BE `machineController.test.ts:286-303` 6 cases (absent + blank for each) → `status(400)` and `expect(criarMaquina).not.toHaveBeenCalled()` | ✅ |
| MACH-04 | 409 `Já existe uma empilhadeira com a identificação "<id>".`, nothing written | BE `machineService.test.ts:415` `rejects.toMatchObject({ status: 409, message: 'Já existe uma empilhadeira com a identificação "EMP-200".' })`; `:417-418` no `Device.create` / `Forklift.create` | ✅ |
| MACH-05 | uppercased MAC already used → 409 `Já existe um dispositivo com este endereço MAC.`, nothing written | BE `machineService.test.ts:424-427` exact message; `Device.exists` with `'AA:BB:CC:DD:EE'` from input `' aa:bb:cc:dd:ee '`; no creates | ✅ |
| MACH-06 | PUT writes only the 5 fields, 200 with the machine | BE `machineService.test.ts:472-473` forklift `$set {nome, identificacao, setor}`, device `$set {nome, enderecoMac}`; `:480-481`, `:487-488` per-document isolation; BE `machineController.test.ts:342-344` service gets only the sent fields, `status(200)`, `json(MAQUINA)` | ✅ |
| MACH-07 | protected or unknown field → 400 `O campo '<campo>' não pode ser alterado por esta rota.`, nothing written | BE `machineController.test.ts:353-362` `status`, `categoriaId`, `categoriaTravada`, `operadorConectadoId`, `sessaoIniciadaEm`, `filialId`, `dispositivoConectadoId`, `qualquer` → exact `json({ error })`, service not called | ✅ |
| MACH-08 | DELETE without open session removes forklift + device, 200 `{ _id, message }` | BE `machineService.test.ts:546-548` `Forklift.deleteOne({_id})`, `Device.deleteOne({_id: DEVICE})`, `toEqual({ _id: id, message: 'Máquina excluída com sucesso.' })`; BE `machineController.test.ts:426-427` `status(200)` | ✅ |
| MACH-09 | open `workSession` (`fim: null`) → 409 `Máquina com sessão aberta.`, nothing deleted | BE `machineService.test.ts:545` filter `{ empilhadeiraId: id, fim: null }`; `:554-556` exact 409 and no deletes; controller passthrough `machineController.test.ts:437-447` | ✅ |
| MACH-10 | missing or out-of-scope → 404 `Máquina não encontrada.` on PUT and DELETE | BE `machineService.test.ts:525` (PUT), `:562` (DELETE) exact; nothing written | ✅ |
| MACH-11 | front shows the machine at once, then swaps in the API answer | FE `pages/VisaoGeralPage.test.tsx:703` card visible while `criar` is pending; `:709` `getByText('Doca do servidor')` from the API answer; `:710` count +1 | ✅ |
| MACH-12 | API refuses create/edit/delete → list back to previous + error toast; delete 409 → "Máquina com sessão aberta" | FE `VisaoGeralPage.test.tsx:719-721` (create removed + `SAVE_ERROR`), `:733-735` (edit reverted + toast), `:745-749` (delete 409 restored + `'Máquina com sessão aberta: encerre a sessão antes de excluir.'`), `:760-761` (other failure → generic toast) | ✅ |

### P1: Funcionários (operadores) pela API

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| OPER-01 | scope operators sorted by `nome`, 10 fields incl. `usuario` (or `null`) and `acesso` | BE `operatorService.test.ts:74-76` `find({ filialId: { $in: [F1, F2] } })`, `sort({ nome: 1 })`, `toEqual([FORMATADO])`; `:90-98` one `User.find`, `Permitido`/`Negado`/`null` | ✅ |
| OPER-02 | `?filialId` narrows to that filial; out of scope → empty | BE `operatorService.test.ts:106` `$in: [F2]`; `:114` `$in: []`; controller passes it on `operatorController.test.ts:70` | ✅ |
| OPER-03 | creates in the `resolverFilial` filial with a generated matrícula, 201 | BE `operatorService.test.ts:131-134` `matricula: 'EMP-093'` after max `EMP-092`; `:142` `EMP-001`; BE `operatorController.test.ts:89-92` `filialId: FILIAL`, `status(201)` | ✅ |
| OPER-04 | empty `nome` or non-`HH:mm` time → 400, nothing written | BE `operatorController.test.ts:96-112` (absent/blank nome, `8:00`, `24:00`, `17:60`) → `status(400)`, `naoChamouServico()` | ✅ |
| OPER-05 | PUT writes only the 5 fields, 200; other field → 400 `O campo '<campo>' não pode ser alterado.` | BE `operatorService.test.ts:153` `$set: { cargo: 'Líder' }` (drops `filialId`); BE `operatorController.test.ts:120-122` `status(200)`; `:125-130` exact message for `matricula`/`filialId`/`usuario`, nothing written | ✅ |
| OPER-06 | name change copied to the linked login | BE `operatorService.test.ts:164` `User.updateOne({ operadorId: ID }, { $set: { nome: 'Ana Lima' } })`; `:154` not called when the name stays | ✅ |
| OPER-07 | DELETE removes the operator and the `user` with that `operadorId`, 200 `{ _id, message }` | BE `operatorService.test.ts:183-185` `Operator.deleteOne`, `User.deleteMany({ operadorId: ID })`, `toEqual({ _id: ID, message: expect.any(String) })`; controller `:160-162` 200 | ✅ (message text not fixed by the spec) |
| OPER-08 | open session → 409 `Operador com sessão aberta.`, nothing deleted | BE `operatorService.test.ts:182` filter `{ operadorId: ID, fim: null }`; `:192-194` exact 409, no deletes | ✅ |
| OPER-09 | 404 `Operador não encontrado.` on PUT, DELETE and the login routes | BE `operatorService.test.ts:170` (PUT), `:200` (DELETE), `:257` (POST login), `:299` (PUT login), `:326` (DELETE login), all exact with no writes | ✅ |
| OPER-10 | non-admin → 403 `Apenas administradores podem gerenciar a equipe.` | BE `operatorController.test.ts:47-61` all 7 handlers → `status(403)`, exact `json`, service not called; BE `app.test.ts` "/api/operators … 403" end-to-end through `autenticar`; BE `autenticar.test.ts` `exigirAdmin` 403/passes | ✅ |
| OPER-11 | loads the active filial's employees, skeleton while loading, error with retry | FE `pages/EquipePage.test.tsx:501` `listar('f2')`; `:508` `listar(undefined)` for "todas"; `:519` `[aria-busy="true"]` on branch change; `:529-536` load error, retry → skeleton → cards; skeleton suite `:386-410` | ✅ |
| OPER-12 | edit/delete applied at once; refused → previous state + toast (409: "Funcionário com sessão aberta") | FE `EquipePage.test.tsx:696-700` edit optimistic then reverted + toast; `:735-740` delete 409 restored in place + `'Funcionário com sessão aberta: encerre a sessão antes de excluir.'`; `:749-750` generic | ✅ |

### P1: Login do colaborador pela Equipe

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| LOGIN-01 | colaborador `user` with `gerarHashSenha`, 201 with `usuario` set and `acesso: 'Permitido'` | BE `operatorService.test.ts:215-220` exact user doc (`role: 'colaborador'`, `escopo: 'filiais'`, `filiaisIds: [filialId]`, `operadorId`), `verificarSenha('segredo123', criado.senhaHash) === true`, response `usuario: 'ana.souza', acesso: 'Permitido'`; controller `operatorController.test.ts:196` `status(201)` | ✅ |
| LOGIN-02 | already has a login → 409 `Este operador já tem login.` | BE `operatorService.test.ts:229-232` exact, no create | ✅ |
| LOGIN-03 | `usuario` used by any user → 409 `Este usuário já está em uso.`, nothing written | BE `operatorService.test.ts:239-242` exact, `User.exists({ usuario: 'ana' })`, no create | ✅ |
| LOGIN-04 | usuario with a space or outside 3-40, senha outside 8-72 → 400, nothing written | BE `operatorController.test.ts:206-219` (space, 2, 41, absent, 7, 73, non-string) → 400 and service not called; `:200-203` 40 / 72 accepted | ✅ |
| LOGIN-05 | PUT `senha` → new `senhaHash`, 200 | BE `operatorService.test.ts:271-273` only key `senhaHash`, `verificarSenha('novaSenha99', …) === true`; controller `:237` 200 | ✅ |
| LOGIN-06 | PUT `acessoNegado` written, 200 with matching `acesso` | BE `operatorService.test.ts:283-284` `$set: { acessoNegado: true }` → `acesso: 'Negado'`; controller `:250` rejects a non-boolean | ✅ |
| LOGIN-07 | no login → 404 `Operador sem login.` on PUT and DELETE | BE `operatorService.test.ts:292-293` (PUT), `:320` (DELETE), exact | ✅ |
| LOGIN-08 | DELETE login → 200, `usuario: null`, `acesso: 'Negado'` | BE `operatorService.test.ts:312-313` `User.deleteOne({ operadorId })`, `toEqual(FORMATADO)` (null/Negado); controller `:275` 200 | ✅ |
| LOGIN-09 | never returns `senha` / `senhaHash` | BE `operatorService.test.ts:210,220-222` login doc mocked **with** `senhaHash: 'x'`, response `toEqual` the 10-field shape and `not.toHaveProperty('senhaHash')`; `:285` | ✅ |
| LOGIN-10 | correct password + `acessoNegado` → 403 `Acesso negado.` without a token | BE `authService.test.ts:189-191` `ErroHttp`, `{ status: 403, message: 'Acesso negado.' }`, `jwt.sign` not called; wrong password still 401 (`:199-200`); `authController.test.ts:77-78` `status(403)`, exact json | ✅ |
| LOGIN-11 | `autenticar` → 401 `Não autenticado.` for `acessoNegado: true` | BE `autenticar.test.ts:164-169` `respondeu401()`; `false` passes (`:171-177`) | ✅ |
| LOGIN-12 | create calls the operator then the login; login fails → employee kept without login + error toast | FE `EquipePage.test.tsx:204-206` `criar`, then `criarLogin('srv-1','maria','Maria123')`, `invocationCallOrder` order; `:575-579` card kept, switch disabled, `aria-checked=false`, `loginError` toast; `:588-598` 409 path keeps the form | ✅ |
| LOGIN-13 | edit with senha → change it; blank senha → keep current | FE `EquipePage.test.tsx:676` `atualizarLogin('1', { senha: 'NovaSenha1' })`; `:665-668` blank → `atualizarLogin` not called | ✅ |
| LOGIN-14 | access toggle writes `acessoNegado`, optimistic, rollback + toast | FE `EquipePage.test.tsx:138-145` flips at once, `atualizarLogin('1', { acessoNegado: true/false })`; `:166-167` reverted + toast; `:174-176` disabled without login | ✅ |
| LOGIN-15 | the 10 keys the feature added (`machines.labelBranch`, `machines.saveError`, `machines.deleteInSession`, `team.usernameInvalid`, `team.passwordTooShort`, `team.phPasswordKeep`, `team.loadError`, `team.saveError`, `team.loginError`, `team.deleteInSession`) exist in all 7 locales, **translated** | FE `config/i18n.test.ts:124-128` `NEW_KEYS` lists exactly the 10 keys `git diff 85eae1a..HEAD` adds to `pt-BR/translation.json`; `:135` pt-BR `toBeTruthy()` for each; `:139-145` `it.each` over the 6 other locales: `:142` `expect(value).toBeTruthy()` (present, non-empty) and `:143` `expect(value).not.toBe(valueOf(ptBR, path))` (not the pt-BR text). Also `:107-112` full `team` key set equals pt-BR. "Traduzidas" is read as "not the pt-BR text copied over"; translation quality beyond that stays a review matter. Mutants P1, P2, P4, P5, P6 killed. | ✅ |

**Status**: 39/39 ACs covered with spec-exact assertions.

---

## Edge Cases

- [x] Non-ObjectId `id` → 400 `O ID fornecido não é um ObjectId válido do MongoDB.`: BE `operatorController.test.ts:176-187` (5 handlers, exact message); BE `machineController.test.ts:377-381` (exact), `:430-434`
- [x] Key starting with `$` → 400: BE `machineController.test.ts:385-389` (`"O campo '$set' não é permitido."`), `:306-310`; BE `operatorController.test.ts:106,136,214`
- [x] Unique index 11000 → 409 with the same message: BE `machineService.test.ts:430-434` (create), `:516-519` (update); BE `operatorService.test.ts:245-251` (usuario)
- [x] `filiais` scope with one filial and no `filialId` → that filial: BE `machineController.test.ts:258-263`; BE `operatorController.test.ts:84-91`

---

## Discrimination Sensor

Two rounds. Round 1 (at `4832ce9`): 31 mutants. Round 2 (at `a458dae`): the 2 survivors re-run plus 3 new i18n mutants.

Isolation (both rounds): temporary `git worktree` at `HEAD` under the session scratchpad, with symlinks to the real `node_modules` and no `.env`. Each mutant was applied, the suite run, then reverted with `git checkout -- .`. The worktree was then removed and pruned. Real-tree `git status --porcelain` matched the pre-sensor baseline ✅. Round 2: worktree `scratchpad/wt-r2` (detached `a458dae`, `Frontend/node_modules` symlinked), JSON mutated by script, full FE suite run, `git checkout -- .` after each; removed with `git worktree remove --force` + `git worktree prune`. Real-tree porcelain after cleanup equals the baseline (`M .specs/LESSONS.md`, `M .specs/lessons.json`, `?? validation.md`) ✅.

| # | File | Mutation | Tests run | Killed? |
| - | ---- | -------- | --------- | ------- |
| M1 | `Backend/src/feature/machine/machineService.ts:165` | open-session check inverted (`!exists`) | BE unit | ✅ (2 failed) |
| M2 | `Backend/src/feature/operator/operatorService.ts:97` | open-session check inverted | BE unit | ✅ (2) |
| M3 | `Backend/src/core/autenticar.ts:37` | `acessoNegado` check removed from `autenticar` | BE unit | ✅ (1) |
| M4 | `Backend/src/feature/auth/authService.ts:28` | `acessoNegado` check removed from `login` | BE unit | ✅ (1) |
| M5 | `Backend/src/core/autenticar.ts:49` | `exigirAdmin` never throws | BE unit | ✅ (9) |
| M6 | `Backend/src/feature/machine/machineController.ts:119` | PUT accepts protected/unknown fields | BE unit | ✅ (8) |
| M7 | `Backend/src/feature/operator/operatorService.ts:64` | matrícula `maior + 1` → `maior` | BE unit | ✅ (2) |
| M8 | `Backend/src/feature/operator/operatorService.ts:101` | login not deleted with the operator | BE unit | ✅ (1) |
| M9 | `Backend/src/feature/machine/machineService.ts:22` | MAC not uppercased | BE unit | ✅ (3) |
| M10 | `Backend/src/feature/operator/operatorService.ts:89` | name not copied to the login | BE unit | ✅ (1) |
| M11 | `Backend/src/feature/operator/operatorService.ts:46` | `acesso` ignores `acessoNegado` | BE unit | ✅ (2) |
| M12 | `Backend/src/feature/machine/machineService.ts:124` | `categoriaId` always `null` on create | BE unit | ✅ (1) |
| M13 | `Backend/src/feature/operator/operatorService.ts:70` | `?filialId` filter ignored | BE unit | ✅ (2) |
| M14 | `Backend/src/feature/machine/machineService.ts:113` | MAC duplicate check removed | BE unit | ✅ (1) |
| M15 | `Backend/src/feature/operator/operatorController.ts:93` | operator PUT accepts any field | BE unit | ✅ (3) |
| M16 | `Backend/src/feature/operator/operatorService.ts:108` | "already has login" check removed | BE unit | ✅ (2) |
| F1 | `Frontend/src/pages/VisaoGeralPage.tsx:86` | edit/status rollback removed | VisaoGeralPage | ✅ (2) |
| F2 | `Frontend/src/pages/VisaoGeralPage.tsx:147` | delete rollback removed | VisaoGeralPage | ✅ (2) |
| F3 | `Frontend/src/pages/VisaoGeralPage.tsx:114` | failed create stays in the list | VisaoGeralPage | ✅ (1) |
| F4 | `Frontend/src/pages/VisaoGeralPage.tsx:112` | create answer not swapped in | VisaoGeralPage | ✅ (2) |
| F5 | `Frontend/src/pages/EquipePage.tsx:96` | edit/access rollback removed | EquipePage | ✅ (3) |
| F6 | `Frontend/src/pages/EquipePage.tsx:184` | delete rollback removed | EquipePage | ✅ (2) |
| F7 | `Frontend/src/pages/EquipePage.tsx:124` | operator dropped when its login fails | EquipePage | ✅ (2) |
| F8 | `Frontend/src/pages/EquipePage.tsx:150` | blank password still calls `atualizarLogin` | EquipePage | ✅ (1) |
| F9 | `Frontend/src/pages/EquipePage.tsx:104` | `acessoNegado` inverted on toggle | EquipePage | ✅ (1) |
| F10 | `Frontend/src/pages/EquipePage.tsx:185` | delete 409 shows the generic toast | EquipePage | ✅ (1) |
| F11 | `Frontend/src/pages/VisaoGeralPage.tsx:149` | delete 409 shows the generic toast | VisaoGeralPage | ✅ (1) |
| F12 | `Frontend/src/pages/EquipePage.tsx:62` | list ignores the active filial | EquipePage | ✅ (2) |
| P1 (r1) | `Frontend/src/locales/de/translation.json` | `machines.labelBranch` deleted | full FE suite | ❌ Survived (1305 passed) |
| P2 (r1) | `Frontend/src/locales/en-US/translation.json` | `team.loginError` replaced with the pt-BR text | full FE suite | ❌ Survived (1305 passed) |
| P3 (r1) | `Frontend/src/locales/de/translation.json` | `team.loginError` deleted | `config/i18n.test.ts` | ✅ (1) |
| P1 (r2) | `Frontend/src/locales/de/translation.json` | `machines.labelBranch` deleted | full FE suite | ✅ (1 failed: "locale de translates every new key") |
| P2 (r2) | `Frontend/src/locales/en-US/translation.json` | `team.loginError` replaced with the pt-BR text | full FE suite | ✅ (1 failed: "locale en-US translates every new key") |
| P4 (r2) | `Frontend/src/locales/ja/translation.json` | `machines.deleteInSession` deleted | full FE suite | ✅ (1 failed: "locale ja …") |
| P5 (r2) | `Frontend/src/locales/ru/translation.json` | `team.passwordTooShort` set to `""` | full FE suite | ✅ (2 failed: team key-set test + "locale ru …") |
| P6 (r2) | `Frontend/src/locales/fr/translation.json` | `machines.saveError` replaced with the pt-BR text | full FE suite | ✅ (1 failed: "locale fr …") |

**Sensor depth**: P0-full (auth/credentials path)
**Round 1**: 31 injected, 29 killed, 2 survived
**Round 2**: 5 injected (P1, P2 re-run + P4, P5, P6), 5 killed, 0 survived
**Total**: 36 injected, 34 killed, 2 survived in round 1, both killed in round 2. No mutant survives at `a458dae` → PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ (CRUD reuses `resolverFilial`, `filtroPorFilial`, `exigirSemOperadores`, `responderErro`; `categoriaDoStatus` extracted, not duplicated) |
| Surgical changes | ✅ (`statusService` refactor limited to the extraction) |
| No scope creep | ✅ (`DELETE /:id/login` route exists per spec; no UI button, as the spec says) |
| Matches patterns | ✅ (controllers mirror the existing machine controller; `ponytail:` notes for the missing transaction and matrícula race, as the spec asks) |
| Spec-anchored outcome check | ✅ (LOGIN-15 fixed in `a458dae`) |
| Per-layer coverage (service 1:1 ACs; routes happy + edge + error) | ✅ |
| Every test maps to an AC / edge case / Done-when | ✅ |
| Documented guidelines | `.specs/features/machines-team-crud/tasks.md` Gate Check Commands; no separate testing guideline file |

---

## Observations (no AC covers them; not blocking)

Round 1 gaps 1 and 2 (LOGIN-15 test gap and "traduzidas") are closed by `a458dae`. The rest stay as observations:

1. **[Process] T15 committed with a red suite.** `117a559` left 17 `EquipePage` tests failing until T17 (`4832ce9`), because the quick gate did not run the page suite the refactor broke. HEAD is green. Recorded as lesson candidate L-014.
2. **[Minor, consistency] The front treats usernames as case-insensitive; the spec says exact.** `Frontend/src/data/team.ts:72-73` `isUsernameTaken` lowercases both sides, while the spec ("Regras do login") and the backend (`operatorService.ts:109`) compare exactly. The form blocks `Ana` when `ana` is loaded, even though the API would accept it.
3. **[Minor, UX] The front form does not check the 72-character password limit.** `EmployeeFormModal.tsx` checks only `>= 8`. A longer password gets a 400 from the backend and the generic save toast. LOGIN-04 is enforced on the backend.

---

## Requirement Traceability Update

| Requirement | New Status |
| ----------- | ---------- |
| MACH-01..12 | ✅ Verified |
| OPER-01..12 | ✅ Verified |
| LOGIN-01..15 | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 39/39 ACs matched the spec outcome; no open spec-precision gap
**Sensor**: 36 injected over 2 rounds; at HEAD every mutant dies (round 1: 29/31, round 2: 5/5 incl. the 2 round-1 survivors)
**Gate**: Backend 770 passed, Frontend 1312 passed; `tsc --noEmit`, `tsc -b` and `eslint .` clean

**What works**: machine CRUD with linked device, MAC/identification uniqueness and the 11000 race; protected fields; open-session guards; operator CRUD with backend matrícula; login create/password/deny/remove with hashed passwords and no hash leak; 403 for non-admins; `acessoNegado` enforced at login (403) and per request (401); optimistic UI with rollback and the specific 409 toasts on both pages; the branch picker under "Todas as filiais"; the 10 new i18n keys present and translated in all 7 locales.

**Next steps**: `spec.md` traceability still says "Implementing" for all 39 requirements; the orchestrator should move them to Verified (this Verifier writes only `validation.md`). Observations 2 and 3 can become follow-ups if wanted.
