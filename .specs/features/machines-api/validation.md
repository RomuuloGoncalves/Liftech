# machines-api Validation

## Validation: PASS

**Result**: PASS (Backend PASS, Frontend PASS; minor gaps fixed or accepted below)
**Date**: 2026-10-13
**Spec**: `.specs/features/machines-api/spec.md` (MCH-01..04, SED-01..04, VGR-01..03)
**Diff range**: `main..HEAD` on branch `feature/visao-geral-api-e-seeds`; Backend `d9644d8..5355a56`, Frontend `bbbd1ac, e8b3b72, 5a6ca8e`; follow-up fixes `30a0a27..65062f0`
**Verifiers**: two independent Verifiers (author != verifier), one per half; both left the real tree untouched (`git status --porcelain` identical before and after).

---

## Backend

**Date**: 2026-10-13
**Spec**: `.specs/features/machines-api/spec.md` (stories "Rota de máquinas" MCH-01..04, "Seeds" SED-01..04)
**Diff range**: `main..HEAD -- Backend` (d9644d8..5355a56; 5 commits, 13 files, +689)
**Verifier**: independent Verifier (author != verifier). No DB access, no .env read, no server/seed/integration run.

**Verdict: PASS (with 2 minor gaps, no blockers).**

### Gate
- `npx vitest run` on the 4 files explicitly: 4 files, 34 tests passed, 0 failed (machineService 10, machineController 3, seedDataset 12, seedData 9).
- Task minimums met: T2 >=8 (10), T3 2 (2 + 1 router), T4 >=8 (12), T5 >=7 (9).
- `npx tsc --noEmit`: exactly the 2 baseline errors (authService.ts jsonwebtoken, server.ts cors types); none from the feature (covers MCH AC1 schema build gate).

### Spec-anchored ACs

| AC | Spec outcome | Evidence (file:line + assertion) | Result |
|---|---|---|---|
| MCH-1 schema accepts nome/setor/sessaoIniciadaEm optional | 3 optional fields | `src/schemas/forklift.ts:6-8` (no test by design, Matrix "none"); tsc build gate clean | PASS (build gate) |
| MCH-2 200 + array `{id,identificacao,nome,setor,dispositivoConectado,operadorConectado?,tempoSessaoMinutos}`, id = _id as text | exact shape | service shape: `tests/unit/machineService.test.ts:48-56` `expect(item).toEqual({id:'f1',...})`; 200: `tests/unit/machineController.test.ts:27-28` `toHaveBeenCalledWith(200)` / `(maquinas)`; route `machineController.test.ts:45-46` `methods toEqual {get:true}`, `handle toBe(listar)` | PASS; weak spot: `_id` mock is already a string so `String()` is not exercised (M08 survived); `app.use('/api/machines')` in `src/server.ts:55` has no test |
| MCH-3 operator linked -> `operadorConectado:{nome}` | `{nome:'Carlos Silva'}` | `machineService.test.ts:54` (inside toEqual) | PASS |
| MCH-4 no operator -> no property | property absent | `machineService.test.ts:74` `expect(item).not.toHaveProperty('operadorConectado')` | PASS |
| MCH-5 minutes = floor(now - sessaoIniciadaEm), never negative | 47m59s -> 47 | `machineService.test.ts:90` `toBe(47)` (fake timers); 34 at `:55` | PASS |
| MCH-6 no sessaoIniciadaEm -> 0 | 0 | `machineService.test.ts:98` `toBe(0)` | PASS |
| MCH-7 no device / device deleted -> `{enderecoMac:'',status:'Offline'}` | exact | `machineService.test.ts:109-117` test.each [undefined, null] `toEqual({enderecoMac:'',status:'Offline'})` | PASS |
| MCH-8 sorted by identificacao asc | sort `{identificacao:1}` | `machineService.test.ts:64` `expect(sort).toHaveBeenCalledWith({identificacao:1})` (+ populate calls :65-66) | PASS (call-level only; real ordering is Mongo's, no integration test per DB rule) |
| MCH-9 query fails -> 500 `{error: msg}` | status 500, body `{error:'falha de conexão'}` | `machineController.test.ts:36-37`; service propagation `machineService.test.ts:125` | PASS |
| Edge: operador apagado (populate null) -> no operadorConectado | absent | `machineService.test.ts:82` `not.toHaveProperty` | PASS |
| Edge: sessaoIniciadaEm future -> 0 | 0 | `machineService.test.ts:106` `toBe(0)` | PASS |
| SED-1 counts 8/16/16/80/32/2 (+11) | counts | `seedData.test.ts:67-82` `toEqual({operadores:8,...})` plus `chamadas(X) toHaveLength(8/16/16/80/32/11/2)`; dataset `seedDataset.test.ts:14,19,25,88` | PASS |
| SED-2 forklift links device and operator when mock has one | ids | `seedData.test.ts:110-118` `toMatchObject({dispositivoConectadoId, operadorConectadoId})`, `not.toHaveProperty('operadorConectadoId')` | PASS |
| SED-3 sessaoIniciadaEm = now - minutes when >0 | exact Date | `seedData.test.ts:127` `toEqual(new Date(AGORA - 34*60_000))`, `:128` absent for 0 | PASS |
| SED-4 re-run does not duplicate; upsert by natural key | keys per spec | `seedData.test.ts:93-101` filter equality for all 7 collections + `upsert:true`; telemetry anchor `seedDataset.test.ts:59-65`, stability `:70`, incidents `:97-100` | PASS (indirect: no DB, so idempotency is proven by key+upsert only, one sample per collection, no "run twice -> same filters" test). Spec-precision note |
| SED-5 with SEED_COLABORADOR_SENHA -> 11 users, senhaHash validates | verificarSenha true | `seedData.test.ts:154` `expect(verificarSenha(SENHA, dados.senhaHash)).toBe(true)` (1 of 11 users), `:155` not contain plaintext, `:81` 11 calls | PASS |
| SED-6 no env -> skip + warn | 0 users, warn | `seedData.test.ts:163-165` | PASS |
| SED-7 calls seedAdmin | called once | `seedData.test.ts:61` `toHaveBeenCalledTimes(1)` | PASS |
| SED-8 logs counts per collection and closes connection | log text; disconnect | log: `seedData.test.ts:172-173`; disconnect: `src/scripts/seedData.ts:94` only inside the `import.meta.url` entry guard, never executed in test (conn mock `disconnect` at `:22` never asserted; M32 survived) | PARTIAL: log PASS, disconnect GAP |
| SED-9 no literal passwords | none in code | `seedDataset.test.ts:45` keys == ['nome','usuario'] for colaboradores; `seedData.test.ts:155`; no-env path yields 0 users (`:163`) | PASS (spec-precision gap: "literal password" not precisely testable; no scan of seedData.ts; `.env.example` placeholder `'senha'` is intentional) |

Status: 18/20 rows PASS, 1 PARTIAL (SED-8 disconnect), 1 PASS with weak assertion (MCH-2 id text). No criterion lacking evidence apart from the disconnect.

### Discrimination sensor (scratch copy under scratchpad/verify, discarded; real tree untouched)
Depth: expanded (38 manual behavior mutants). Result: 36/38 killed, 2 survived.

| # | File | Mutation | Killed? |
|---|---|---|---|
| M01 | machineService.ts | drop `.sort(...)` | KILLED |
| M02 | machineService.ts | sort `-1` | KILLED |
| M03 | machineService.ts | `Math.max` -> `Math.min` | KILLED |
| M04 | machineService.ts | `floor` -> `round` | KILLED |
| M05 | machineService.ts | `operadorConectado` always present (undefined) | KILLED |
| M06 | machineService.ts | fallback status Offline -> Disponível | KILLED |
| M07 | machineService.ts | fallback mac '' -> '-' | KILLED |
| M08 | machineService.ts | `id: String(f._id)` -> `f._id` | SURVIVED |
| M09 | machineService.ts | no-session fallback `agora` -> 0 | KILLED |
| M10 | machineService.ts | device status hardcoded | KILLED |
| M11 | machineController.ts | 500 -> 400 | KILLED |
| M12 | machineController.ts | error.message dropped | KILLED |
| M13 | machineRouter.ts | `get` -> `post` | KILLED |
| M14 | machineService.ts | minute constant 60_000 -> 1_000 | KILLED |
| M15 | seedData.ts | skip `seedAdmin()` | KILLED |
| M16 | seedData.ts | remove `SEED_COLABORADOR_SENHA` guard | KILLED |
| M17 | seedData.ts | hash wrong input (`c.usuario`) | KILLED |
| M18 | seedData.ts | incident fallback operator index off by one | KILLED |
| M19 | seedData.ts | forklift upsert filter key identificacao -> nome | KILLED |
| M20 | seedData.ts | drop `tempoSessaoMinutos > 0` condition | KILLED |
| M21 | seedData.ts | `agora - min` -> `agora + min` | KILLED |
| M22 | seedDataset.ts | telemetry anchor 08h -> 09h | KILLED |
| M23 | seedData.ts | telemetry key drops `dataDados` | KILLED |
| M24 | seedData.ts | incident key drops `dataIncidente` | KILLED |
| M25 | seedData.ts | `upsert:true` -> false | KILLED |
| M26 | seedData.ts | accessRequest key drops `status` | KILLED |
| M27 | seedData.ts | user role colaborador -> admin | KILLED |
| M28 | seedData.ts | drop `operadorConectadoId` | KILLED |
| M29 | seedData.ts | device link undefined | KILLED |
| M30 | seedDataset.ts | forcaImpacto range 3..9 -> 3..11 | KILLED |
| M31 | seedDataset.ts | 5 readings -> 4 | KILLED |
| M32 | seedData.ts | remove `conn.mongoose.disconnect()` | SURVIVED |
| M33 | seedData.ts | drop `logger.warn` | KILLED |
| M34 | seedData.ts | drop final `logger.info` | KILLED |
| M35 | seedData.ts | `{ $set: dados }` -> `dados` | KILLED |
| M36 | seedDataset.ts | literal `senha` added to a colaborador | KILLED |
| M37 | seedData.ts | drop `colaboradores++` | KILLED |
| M38 | seedData.ts | sessaoIniciadaEm fixed epoch | KILLED |

Survivors: M08 (id String cast; test `_id` is already a string), M32 (disconnect in untested entry guard).
Isolation: `git status --porcelain` before = empty; after = empty (identical); `git diff` clean. Scratch deleted.

### Ranked gaps (suggested fix tasks)
1. SED-8 disconnect not covered (M32): `src/scripts/seedData.ts:91-95` entry guard only. Fix: move the "seed + disconnect" into an exported function (e.g. `rodarSeed()`) or test the guard via `vi.resetModules` + `process.argv[1]` set to the file with `conn` mocked, asserting `conn.mongoose.disconnect` was called once. Note also no `try/finally`: a seed failure leaves the connection open (same pattern as `seedAdmin.ts:23-27`; low).
2. MCH-2 id-as-text weak (M08): `tests/unit/machineService.test.ts:20-30`. Fix: give `base._id` an ObjectId-like object (`{ toString: () => 'f1' }` or `new Types.ObjectId()`), assert `typeof item.id === 'string'` and the value.
3. `/api/machines` mount untested: `src/server.ts:55` (removing it would pass all unit tests). Fix: low priority; a small supertest-free check is hard because server.ts connects the DB. Accept as covered by router test + review, or note for the owner's manual `GET /api/machines` run.
4. SED-4 idempotency is only indirect: `tests/unit/seedData.test.ts:85-102` samples one key per collection. Fix (optional): call `seedData()` twice and assert the multiset of filters is identical and has no duplicate filters within a run (e.g. `new Set(JSON.stringify(filtros)).size === calls`), plus assert all 11 users hash-validate.
5. SED-9 spec-precision: "senhas literais" has no precise testable outcome; suggest a source-scan test (readFileSync of seedData.ts/seedDataset.ts, no `senha:` string literal) or accept as review-only.
6. MCH-8 sort is call-level only (cannot verify ordering without DB); accepted by the DB rule.

### Code quality notes
- Matches existing patterns (seedAdmin entry guard, respostaSucesso/respostaErro). No scope creep. Only feature files touched. Guideline: none (strong defaults applied).
- Minor: `seedData.ts:54` uses `OPERADORES[i % OPERADORES.length]!` fallback, tested (`seedData.test.ts:131-145`). `any` typing in `upsert` and service is consistent with existing code.
- Every test maps to an AC/edge/Done-when; no unclaimed tests.

---

## Frontend

**Spec**: `.specs/features/machines-api/spec.md`, story "P1: Visão Geral lendo a API" (VGR-01..03) + frontend pieces of VGR-01/02 (service, i18n)
**Diff range**: `main..HEAD -- Frontend` (bbbd1ac, e8b3b72, 5a6ca8e): 13 files, +339/-71
**Verifier**: independent (author != verifier). Real tree untouched; `git status --porcelain` before = after = empty (IDENTICAL).
**Verdict**: PASS (no blocking gap; 1 surviving mutant and 3 minor precision notes)

### Gate
- `npx tsc -b`: exit 0. `npx eslint .`: exit 0.
- Full `npx vitest run` (Node 22): 927 passed, 3 failed, 930 total (baseline 908+3 = 911, so +19 tests: service 2, i18n 8, page +9).
- The 3 failures are exactly the known baseline ("0 min"/"34 min" vs "N minutos"): VisaoGeralPage.test.tsx:102 (assertion at :115), MachineCard.test.tsx x2. No new failure.
- Scoped run (page + service + i18n): 124 passed, 1 failed (the baseline one).

### Test-diff finding (author edit of VisaoGeralPage.test.tsx)
- Extracted every `expect(` line of `main:` version (50) vs HEAD (72): the diff is purely additive (22 new lines). No assertion removed, reworded or weakened.
- All 24 original `it(...)` titles kept (one renamed: "while loading" -> "while the request is pending"); 9 new tests added (24 -> 33).
- Removed non-assertion lines are only scaffolding: `useFirstVisitLoading` mock / `loading` hoisted var / `afterEach`; tests became `async` + `renderLoaded()` (render + `await findAllByRole('article')`); toasts helper became async. The skeleton test gained one assertion (`aria-busy="true"`).
- Count did not decrease.

### Spec-anchored acceptance criteria

| AC / edge | Spec-defined outcome | `file:line` + assertion | Result |
|---|---|---|---|
| AC1 open -> GET /machines, 1 card per machine | N machines returned -> N articles; one call | `VisaoGeralPage.test.tsx:333` `expect(await findAllByRole('article')).toHaveLength(2)` (API mock with 2 non-mock ids); `:334-335` EMP-084/085 present; `:336` `expect(listar).toHaveBeenCalledTimes(1)`; `:27` `toHaveLength(MACHINES.length)` | PASS |
| AC1 path is `GET /machines` | `/machines` | `machineService.test.ts:29` `expect(get).toHaveBeenCalledWith('/machines')`; `:30` `toEqual(machines)`; `:37` rejection `.rejects.toBe(err)` | PASS |
| AC2 pending -> grid skeleton `aria-busy="true"` | skeleton + aria-busy while pending | `:259` never-resolving promise; `:262` `container.querySelector('[aria-busy="true"]')).not.toBeNull()`; `:263` 8 `[data-skeleton-card]`; `:264-265` no toolbar button, no articles | PASS |
| AC3 failure -> message + button | "Não foi possível carregar as máquinas." + "Tentar novamente" | `:344` `findByText('Não foi possível carregar as máquinas.')`; `:345` `getByRole('button',{name:'Tentar novamente'})`; `:346` no articles | PASS (exact strings) |
| AC4 retry -> GET again, back to skeleton | 2nd call, skeleton, error gone, then cards | `:355` click; `:357` `toHaveBeenCalledTimes(2)`; `:358` aria-busy present; `:359` error text gone; `:362` cards after resolve | PASS |
| AC5 empty list -> "Nenhuma máquina encontrada" | text shown | `:370` `findByText('Nenhuma máquina encontrada')` with `listar -> []`; `:371` no articles (distinct from filter-empty test `:93`) | PASS |
| AC6 search/filter over loaded list | filters as today | `:42-43`, `:51`, `:54`, `:64`, `:71`, `:83` (assertions unchanged vs main); unknown-status filter `:426` | PASS (list loaded from mocked service = MACHINES; same data as before) |
| AC7 create/edit/delete local only | no extra GET | `:374-389` full create -> edit -> delete flow, `:388` EMP-200 gone, `:389` `expect(listar).toHaveBeenCalledTimes(1)`; local effects in `:111`, `:181-183`, `:222-223` | PASS |
| AC8 detail history = mock events by identificacao, else empty | events of same identificacao (even with ObjectId id); empty otherwise | `:406` `expect(withMockHistory).toBeGreaterThan(withoutHistory)` (API id `66f0...a001`, ident EMP-084 vs EMP-777); `:416` `getByText('Nenhum registro no período')`; created-in-UI `:253` | PASS (relative count, see note 2) |
| AC9 error msg + button translated in the 7 languages | translated texts | page: `:435` `'Could not load the machines.'`, `:436` `'Try again'` (en-US) and pt-BR in `:344-345`; locales: `i18n.test.ts` new block, `it.each(ALL_LOCALES)` non-empty `loadError`/`retry` (7 locales) + `pt-BR texts match the spec` `toBe(...)` | PASS for presence; "translated" not asserted for the other 5 (see Gap 1) |
| Edge: unknown status -> card appears under "Todos" | visible under Todos | `:424` `findAllByRole('article')).toHaveLength(1)` (default filter Todos, status `'Desconhecido'`); `:426` hidden under `Manutenção` | PASS |
| T6 Done-when: propagate rejection | rejection propagates | `machineService.test.ts:37` | PASS |
| T7 Done-when: parity for 2 keys in 7 locales | present, non-empty | `i18n.test.ts` new `it.each(ALL_LOCALES)` | PASS (presence only) |

Spec-precision gaps flagged: AC9 "traduzidos" has no precise outcome beyond pt-BR and en-US texts (spec lists only pt-BR strings); AC8 does not pin an exact event count.

### Discrimination sensor (scratch copy, Node 22, tests: page + service + i18n)
Depth: 28 behavior-level mutants (feature is P1/MVP, over the 10 requested). Scratch deleted; real tree unchanged. Unmutated scratch = only the baseline failure.

| # | File | Mutation | Result (first killing test) |
|---|---|---|---|
| M01 | VisaoGeralPage.tsx | never set error state (`'error'` -> `'ready'`) | KILLED (error/retry tests) |
| M02 | VisaoGeralPage.tsx | retry does not call fetch | KILLED (retry test) |
| M03 | VisaoGeralPage.tsx | retry does not go back to loading | KILLED (retry test) |
| M04 | VisaoGeralPage.tsx | remove empty-state branch | KILLED (both empty tests) |
| M05 | VisaoGeralPage.tsx | events looked up by `id` instead of `identificacao` | KILLED (AC8 test) |
| M06 | VisaoGeralPage.tsx | call listar after create | KILLED (AC7 test) |
| M07 | VisaoGeralPage.tsx | call listar after edit | KILLED (AC7 test) |
| M08 | VisaoGeralPage.tsx | call listar after delete | KILLED (AC7 test) |
| M09 | VisaoGeralPage.tsx | initial state `ready` (no skeleton while pending) | KILLED (skeleton test) |
| M10 | VisaoGeralPage.tsx | wrong i18n key for error message | KILLED |
| M11 | VisaoGeralPage.tsx | wrong i18n key for retry button | KILLED |
| M12 | data/machines.ts | swap filter (`status === 'Todos'` -> `!==`) | KILLED (many) |
| M13 | machineService.ts | path `/forklifts` | KILLED |
| M14 | machineService.ts | returns `[]` | KILLED |
| M15 | machineService.ts | swallows error -> `[]` | KILLED |
| M16 | VisaoGeralPage.tsx | ignores API result, uses MACHINES | KILLED (non-mock ids/2-item tests) |
| M17 | VisaoGeralPage.tsx | unknown status hidden under Todos | KILLED (edge test) |
| M18 | PageSkeleton.tsx | remove `aria-busy` | KILLED (skeleton + retry test) |
| M19 | VisaoGeralPage.tsx | fetch twice on mount | KILLED (`toHaveBeenCalledTimes(1)`) |
| M20 | VisaoGeralPage.tsx | retry fetches twice | KILLED (`toHaveBeenCalledTimes(2)`) |
| M21 | VisaoGeralPage.tsx | stuck in loading after success | KILLED |
| M22 | locales/ja | `common.retry` key missing | KILLED (i18n parity) |
| M23 | locales/ru | `machines.loadError` empty | KILLED (i18n parity) |
| M24 | locales/pt-BR | loadError text changed | KILLED (page + i18n pt-BR) |
| M25 | locales/de | `common.retry` left in English ("Try again") | **SURVIVED** |
| M26 | VisaoGeralPage.tsx | retry button onClick no-op | KILLED |
| M27 | machineService.ts | `api.post` instead of `api.get` | KILLED |
| M28 | VisaoGeralPage.tsx | detail history always empty | KILLED |

Result: 27/28 killed, 1 survivor (M25).

### Edge cases
- [x] Unknown status shows under "Todos" (`VisaoGeralPage.test.tsx:424`).

### Code quality (frontend files)
- Minimal: service is 9 lines, page adds a `LoadState` union + `fetchMachines` + `retry`; reuses `PageSkeleton`, `eventsForMachine`, `MACHINES`, existing CSS tokens. `useFirstVisitLoading` removed from the page as required. Matches existing service style (mirrors authService). Guideline: none found beyond project defaults ("none - strong defaults applied").
- Every new test maps to an AC, the edge case or a Done-when criterion; no unclaimed tests (the en-US test covers AC9).

### Gaps (ranked)
1. **Minor, M25**: i18n test only checks `loadError`/`retry` are non-empty, so an untranslated (English or pt-BR) value in es/fr/ja/de/ru passes (AC9 "traduzidos"). `Frontend/src/test/config/i18n.test.ts` (new block at the end, ~line 276). Fix task: assert for each non-pt-BR/en-US locale that both values differ from the en-US and pt-BR ones (en-US `retry` should also differ from pt-BR).
2. **Minor, precision**: AC8 test `VisaoGeralPage.test.tsx:406` compares listitem counts relatively (`toBeGreaterThan`). It kills M05/M16/M28 but would pass if the mock history were any non-zero list. Fix task (optional): assert `withMockHistory` equals `eventsForMachine('<mock id of EMP-084>').length` or a known text from that machine's events.
3. **Minor, AC9 coverage at page level**: page-level translation checked only in pt-BR and en-US (`:435-436`); other 5 rely on JSON presence. Optional: `it.each` over locales rendering the error and matching the locale's JSON strings.
4. **Note (not a defect)**: error container uses `role="alert"` (`VisaoGeralPage.tsx` error branch) but no test asserts it; spec does not require it.

---

## Follow-up after verification

Fixes applied for the gaps the Verifier reported, each in its own commit, and the final state re-tested:

| Gap | Fix | Commit |
| --- | --- | ------ |
| Backend M08: `id` as text not exercised | Mock `_id` is now a real `ObjectId`, asserted as its hex string (`machineService.test.ts:51`) | 30a0a27 |
| Backend M32 / SED-8: connection close untested | `seedEDesconectar` with `try/finally`, tested on success and on failure (`seedData.test.ts`, `describe('seedEDesconectar')`) | f8bd8aa |
| Backend SED-4 / SED-5: idempotency and all 11 hashes | Run-twice test with equal key sets and no repeated keys, and all 11 `senhaHash` validate | cbaa49a |
| Reviewer: incident dates ran past today | 2-day spacing, last incident 2026-10-02, test bounds it by 2026-10-13 | 4ac4438 |
| Frontend M25 / AC9: untranslated text passed | Load error texts must differ from pt-BR and, for es/fr/ja/de/ru, from en-US | 3b93036 |
| Frontend AC8: relative history count | Difference equals the exact mock event count of EMP-084 | 65062f0 |

Accepted, not fixed: the `/api/machines` mount in `server.ts` has no unit test (the file connects to the database); `MCH-8` ordering is asserted at call level only (real ordering needs the database); `SED-9` "no literal passwords" has no precisely testable outcome beyond the key and hash checks; page-level translation is rendered only in pt-BR and en-US; `role="alert"` on the error block is not asserted (not required by the spec).

The database was never accessed: the seed script was written and tested with mocked models only. Before the first `yarn seed:data`, the owner can check `db.users.getIndexes()` for an old non-sparse unique `email_1` or `usuario_1` index, which would make a second colaborador without email fail (the Mongoose review could not inspect the database).

Manual check in the browser with a throwaway local HTTP server standing in for the API (no database): skeleton while pending, five cards from `GET /api/machines`, error message with "Tentar novamente" on a 500, and the retry request loading the cards.
