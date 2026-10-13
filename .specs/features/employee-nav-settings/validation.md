# employee-nav-settings Validation

## Validation: PASS

**Result**: PASS (minor gaps; the ones fixed or deferred are listed at the end)
**Date**: 2026-10-13
**Spec**: `.specs/features/employee-nav-settings/spec.md` (TAB-01..03, USR-01..03, SET-01..08)
**Diff range**: commits `c9532b1^..4c6cca4` on `feature/visao-geral-api-e-seeds`
**Verifier**: independent Verifier (author != verifier); the real tree was not modified.

---

**Date**: 2026-10-13
**Spec**: `.specs/features/employee-nav-settings/spec.md`
**Diff range**: `c9532b1^..4c6cca4` (scratch built from `git archive 4c6cca4`; branch tip has since moved)
**Verifier**: independent Verifier (author != verifier)
**Verdict**: PASS with minor gaps (no blocker; 3 weak/unkilled behaviours listed below)

Paths below: backend tests `Backend/tests/unit/`, frontend tests `Frontend/src/test/`.

### Gate (run in scratch of 4c6cca4)
- Frontend `tsc -b` exit 0, `eslint .` exit 0, `vitest run` 79 files / 964 passed / 0 failed.
- Backend `tsc --noEmit` exit 0, `vitest run tests/unit` 15 files / 116 passed. No integration test, no DB, no .env read.
- Test count: nothing deleted except tests/rows of the removed incident tab (see integrity).

### Spec-anchored coverage

| AC | Spec outcome | file:line + assertion | Result |
|----|--------------|------------------------|--------|
| TAB AC1 3 links in order | Visão geral, Empilhadeiras, Histórico | TabBar.test.tsx:20-24 `expect(links.map(aria-label)).toEqual(TABS)`; EmployeeLayout.test.tsx:28-32 `toHaveLength(3)` | PASS |
| TAB AC2 House icon | `House` | TabBar.test.tsx:28 `querySelector('svg')).toHaveClass('lucide-house')` | PASS |
| TAB AC3 no incident link | no `/funcionario/ocorrencia` link | TabBar.test.tsx:29 `querySelector('a[href="/funcionario/ocorrencia"]')).toBeNull()` | PASS |
| TAB AC4 hidden indicator, no aria-current on ocorrencia/sessao/configuracoes | hidden + none current | TabBar.test.tsx:61-68 `toHaveClass(styles.hidden)` + `not.toHaveAttribute('aria-current')` x3 routes | PASS |
| TAB AC5 alert -> /funcionario/ocorrencia + sheet "Reportar uma ocorrência" | route + sheet | EmployeeLayout.test.tsx:56-60 `path()).toBe('/funcionario/ocorrencia')`; sheet only in IncidentSheet.test.tsx:127-136 (`dialog` name "Reporte uma ocorrência") | PASS for route; Spec-precision gap: sheet title is "Reporte uma ocorrência", spec says "Reportar uma ocorrência" (that is the button label); no single click-to-dialog test |
| TAB AC6 hamburger -> configuracoes | route | EmployeeLayout.test.tsx:62-66 `expect(path()).toBe('/funcionario/configuracoes')` | PASS |
| USR AC1 schema optional trimmed text | `String`, `trim`, optional | none (matrix says build gate only); `tsc` clean; mutant B18 (drop trim) survives | PASS by design / not test-covered |
| USR AC2 POST stores and returns | 201 + both fields | userController.test.ts:36-46 `toMatchObject({telefone,cargo})`, `toHaveBeenCalledWith(201)`, `toHaveBeenCalledWith({_id,nome,role,telefone,cargo})`; userModel.test.ts:16 | PASS |
| USR AC3 non-text -> 400 + message | 400 + `O campo '<campo>' deve ser texto válido.` | POST: userController.test.ts:64-66 (telefone 123, cargo object) + `criarMock not called`; PUT telefone: :101-103; rules userRules.test.ts:21 `toEqual([{field,message}])` | PASS; GAP: PUT with non-text `cargo` untested (mutant B20 survives) |
| USR AC4 PUT updates and returns | 200 + value | userController.test.ts:80-82 (`toHaveBeenCalledWith(ID,{telefone})`, `toMatchObject`), :92-93 cargo | PASS |
| USR AC5 login includes fields | user has both | authService.test.ts:56 `expect(resultado.user).toEqual({_id,nome,role,telefone,cargo})` | PASS |
| USR AC6 no fields: no error | login/list ok, no keys | authService.test.ts:64 `Object.keys(JSON.parse(JSON.stringify(user))).toEqual(['_id','nome','role'])`; userRepository.test.ts:33; userModel.test.ts:8-10; controller :53; :111-112; userRules.test.ts:8 | PASS |
| SET AC1 title, Geral, Dados do usuário + 3 fields | headings | EmployeeSettingsPage.test.tsx:32-34 `getByRole('heading', {level:1,name:'Configurações'})`, Geral, Dados do usuário | PASS (fields-inside-card not asserted structurally) |
| SET AC2 readonly + label | readonly, labelled | :37-41 `getByLabelText(label)` + `toHaveAttribute('readonly')` | PASS |
| SET AC3 Nome from storage | `Bruno Souza` | :46 `expect(field('Nome').value).toBe('Bruno Souza')` | PASS |
| SET AC4 absent/no nome -> — | `—` | :59-66 it.each 3 cases `toBe('—')` | PASS |
| SET AC5 phone/cargo or — | value / `—` | :47-48, :55-56 | PASS |
| SET AC6 notice | "Solicitação de alteração" + supervisor text | :71-72 `getByText('Solicitação de alteração')`, regex `/solicite a mudança ao supervisor responsável/` | PASS; shallow: "inside the card" not asserted; full sentence not exact |
| SET AC7 logout | token+user removed, /login/colaborador | :78-80 `getItem('token')).toBeNull()`, `getItem('user')).toBeNull()`, `path()).toBe('/login/colaborador')` | PASS |
| SET AC8 feedback | heading, question, textarea editable, no send | :85-92 `tagName 'TEXTAREA'`, `not readonly`, value after change, buttons `toEqual(['Deslogar-se','Política e Privacidade'])` | PASS |
| SET AC9 privacy inert | route unchanged | :106 `expect(path()).toBe('/funcionario/configuracoes')` | PASS |
| SET AC10 skeleton first visit aria-busy | busy + settings skeleton | EmployeeSkeletonPages.test.tsx:78-86 (`busy()` not null, status "Carregando..."), :103-109 3 fields/2 buttons; EmployeeSkeleton.test.tsx:8 aria-busy for `settings`, :48-55 | PASS |
| SET AC11 return visit no skeleton | no `aria-busy` | EmployeeSkeletonPages.test.tsx:88-93 `expect(busy()).toBeNull()` | PASS |
| SET AC12 7 languages translated | all keys, non-empty | i18n.test.ts:259-267 `Object.keys(settings).sort()).toEqual(ptBR keys)` + `toBeTruthy()` for 7 locales | PASS (key parity/non-empty only; no render in non-pt-BR; wording not checked) |
| Edge: invalid JSON | `—`, no throw | EmployeeSettingsPage.test.tsx:63-66 `'{not json'` -> `toBe('—')` | PASS |
| Edge: textarea discarded | empty after remount | :95-100 `toHaveValue('')` | PASS |
| Edge: header X back | X + previous | EmployeeLayout.test.tsx:62-68, :70-74 | PASS |

Totals: 26 rows, 24 PASS, 2 spec-precision gaps (TAB AC5 sheet title wording; AC12 depth), 0 uncovered ACs.

### Discrimination sensor (scratch copy, 40 valid mutants, tests per side: backend 5 unit files; frontend employee components/pages, i18n, styles)

Killed (36 of 40 valid):
B1 rules validator -> true; B2 rule message changed; B3 rules only telefone; B4 model drops telefone; B5 model always emits cargo key; B6 model swaps telefone<-cargo; B7 repo drops cargo; B8 repo swaps fields; B9 POST drops telefone; B10 POST validation removed; B11 PUT validation removed; B12 optional rule made required; B13 helper only telefone (POST); B14 POST swaps args; B15 login drops cargo; B16 login telefone<-cargo; B17 PUT 400 -> 404; B19 POST 201 -> 200;
F1 House -> History; F2 incident tab re-added; F3 tabs reordered; F4 indicator always visible; F5 `—` fallback removed; F6 readOnly removed; F7 logout goes to /login; F8 authService.logout() removed; F9 label association removed; F10 privacy navigates; F11 textarea readOnly; F12 submit button added; F13 JSON error rethrown; F14 phone/cargo swapped; F15 skeleton variant title; F16 notice removed; F19 nome fallback 'x'; F20 card title removed; F21 logout re-writes user; F22 skeleton 2 fields; F23 skeleton final button removed; F24 skeleton notice removed; F25 pt-BR logout "Desloga-se"; F26 de key removed; F27 es notice empty; F28 pt-BR notice reworded; F29 ja privacy empty; F30 pt-BR feedbackTitle reworded; F32 skeleton branch disabled; F33 h1 -> h2; F35 feedback label unassociated; F36 reads wrong storage key.
(F17 first attempt was a syntax-invalid mutant, redone as F33; F18 `useFirstVisitLoading(key,0)` is invalid because the test mock ignores the delay arg, replaced by F32; both excluded from totals.)

Survived (4):
- B18 `Backend/src/schemas/user.ts:7` drop `trim: true` (schema layer is "no test" by the matrix; untestable at unit level without DB).
- B20 `Backend/src/feature/user/userController.ts:~114` PUT validates only `telefone` (PUT with non-text `cargo` has no test).
- F31 `Frontend/src/services/authService.ts:9` `telefone` made required in `UsuarioLogado` (type-only, tsc clean; no runtime effect).
- F34 settings skeleton key `employee-settings` replaced by `employee-home` (no test pins the key; harmless unless keys collide).

Real survivors needing action: B20 only (F34 optional). B18/F31 are by-design.

### Test integrity
`git diff c9532b1^..4c6cca4 -- '*.test.*'`: removed assertion lines:
- EmployeeLayout.test.tsx: `toHaveLength(4)` -> 3, labels array minus "Ocorrência", loop list minus "Ocorrência": removal of the incident tab (TAB AC1/AC3), justified.
- TabBar.test.tsx: removed rows for `/funcionario/ocorrencia` (active, indicator index 3, navigation target); the route moved into the hidden-indicator `it.each` (TAB AC4), so coverage is strengthened.
- i18n.test.ts: `incident: 'Ocorrência'` removed from the `employee.nav` toEqual (key deleted by T9), justified.
No assertion weakened; test count only grew (+ new files for backend).

### Figma / wording check (pt-BR vs spec notes)
Spec fixes: "Configurações", "Geral", "Dados do usuário", Nome/Telefone/Cargo, "Solicitação de alteração", "Deslogar-se" (Figma typo "Desloga-se" corrected, assumption), "Feedback & Sugestões", "Como foi sua experiência?", "Política e Privacidade". Locale `pt-BR/translation.json` employee.settings matches all of these exactly, pinned in i18n.test.ts:269-282. Notice body "Para alterar seus dados, solicite a mudança ao supervisor responsável." is not quoted in the spec (only "orientando a pedir mudanças ao supervisor responsável"), so the exact Figma sentence is a spec-precision gap; the Figma frame itself was not queried (no file key in the repo). Sheet title mismatch: spec AC says "Reportar uma ocorrência" but the existing sheet title is "Reporte uma ocorrência" (button label is "Reportar uma ocorrência").

### Ranked gaps
1. PUT with non-text `cargo` untested (B20 survives): add in `Backend/tests/unit/userController.test.ts` after line ~103 a case `chamar({ cargo: 456 })` expecting 400, the message `O campo 'cargo' deve ser texto válido.` and `atualizar` not called.
2. Notice not asserted inside the card (`Frontend/src/test/pages/employee/EmployeeSettingsPage.test.tsx:69-73`): use `within(screen.getByRole('heading',{name:'Dados do usuário'}).parentElement!)` for the notice, and assert the full sentence.
3. AC12 only checks key parity/non-empty (`Frontend/src/test/config/i18n.test.ts:259`): optionally render the page under one non-pt-BR language and assert the title; or fix the spec wording to "chaves presentes".
4. Spec text: AC5 sheet name vs actual "Reporte uma ocorrência"; either correct the spec or add a click-to-dialog test in `EmployeeLayout.test.tsx`; quote the exact Figma notice sentence in the spec.
5. Optional: pin the skeleton key (`EmployeeSettingsPage.tsx:25`) or ignore (F34).

### Isolation
Scratch under `.../scratchpad/verify-nav*` built from `git archive 4c6cca4` with symlinked node_modules; mutated files restored and diffed against the archive (identical). Real tree: `git diff --stat` of tracked files identical before and after; nothing written to the repo.

---

## Follow-up after verification

- SET AC6 (notice inside the card, full sentence) and SET AC12 (a render in another language): `EmployeeSettingsPage.test.tsx` now scopes the notice to the "Dados do usuário" card with the full pt-BR sentence and renders the page in en-US (commit following `4c6cca4`).
- Deferred: the test for `PUT /api/users/:id` with a non-text `cargo` (survivor B20) waits for the rewrite of that endpoint in the access-scope feature, which replaces the PUT validation; the new tests there must cover `telefone` and `cargo`.
- Accepted: skeleton key `employee-settings` not pinned by a test, the schema `trim` (no schema-layer tests by design) and the type-only `telefone` mutant.
- Spec wording to align when the spec is next edited: the incident sheet title is "Reporte uma ocorrência" while AC5 quotes the button label "Reportar uma ocorrência".
