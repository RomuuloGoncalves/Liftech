# employee-session Validation

**Date**: 2026-10-15
**Spec**: `.specs/features/employee-session/spec.md`
**Diff range**: eafe2fc..76c76aa (`feature/employee-session`)
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: PASS

---

## Gate

| Gate | Result |
| ---- | ------ |
| Backend `npx vitest run tests/unit` | 612 passed, 0 failed |
| Frontend `npx vitest run` | 90 files, 1241 passed, 0 failed |

## Task Completion

All tasks in `tasks.md` are marked done.

## Spec-Anchored Acceptance Criteria

Backend paths are relative to `Backend/tests/unit/`; frontend paths to `Frontend/src/test/`.

| ID | Spec-defined outcome | Evidence | Result |
| -- | -------------------- | -------- | ------ |
| LOG-01 | colaborador gets `operador = { _id, nome }` or `null` | `authService.test.ts:165` `expect(user.operador).toEqual({ _id: OPERADOR, nome: 'Carlos Silva' })`; `authService.test.ts:172` `.toBeNull()` | ✅ |
| LOG-02 | admin gets `operador = null` | `authService.test.ts:178` `.toBeNull()` and `Operator.findById` not called | ✅ |
| LOG-03 | `/funcionario/*` without colaborador → `/login/colaborador` | `components/employee/EmployeeLayout.test.tsx:30-34` `expect(path()).toBe('/login/colaborador')` | ✅ |
| LOG-04 | operator name (or user name without link) | `pages/employee/EmployeeSettingsPage.test.tsx:52`; `components/employee/IncidentSheet.test.tsx:77`, `:83` | ✅ |
| LOG-05 | logout clears session, goes to `/login/colaborador` | `pages/employee/EmployeeSettingsPage.test.tsx:94-99` | ✅ |
| SES-01 | creates session, sets `operadorConectadoId`/`sessaoIniciadaEm`, `em_uso`, 201 | `sessionService.test.ts:90-95` (create/updateOne/`aplicarStatus(MAQUINA,'em_uso')`); `sessionController.test.ts:25,52` | ✅ |
| SES-02 | not `disponivel` → 409, nothing written | `sessionService.test.ts:99-106` | ✅ |
| SES-03 | open session of operator or machine → 409 | `sessionService.test.ts:112-113` (`$or` query), `:119-121` | ✅ |
| SES-04 | machine missing/out of scope → 404 | `sessionService.test.ts:131` `toBe(404)` | ✅ |
| SES-05 | no `operadorId` → 403 | `sessionService.test.ts:136-137` | ✅ |
| SES-06 | `GET /atual` → open session or `null` | `sessionService.test.ts:67-68`, `:73` | ✅ |
| SES-07 | end: `fim`, `$unset`, `disponivel` only if `em_uso` | `sessionService.test.ts:151-155`, `:163-164` | ✅ |
| SES-08 | no open session → 409 | `sessionService.test.ts:180-181` | ✅ |
| SES-09 | own sessions only, newest first, contract shape | `sessionService.test.ts:197-199` (`operadorId` filter, `sort({ inicio: -1 })`) | ✅ |
| SES-10 | start calls API, opens `/funcionario/sessao` counting from `inicio` | `components/employee/MachineDetailSheet.test.tsx:110`; `hooks/useWorkSession.test.ts:86`; `pages/employee/EmployeeSessionPage.test.tsx:58` | ✅ |
| SES-11 | reload recovers via `GET /sessions/atual` | `hooks/useWorkSession.test.ts:60`; `pages/employee/EmployeeSessionPage.test.tsx:68` | ✅ |
| SES-12 | end → API + `/funcionario`; failure keeps session + error toast | `pages/employee/EmployeeSessionPage.test.tsx:80`, `:91`; `hooks/useWorkSession.test.ts:131` | ✅ |
| SES-13 | machines from `/machines`, history + last machine from `/sessions` | `pages/employee/EmployeeHomePage.test.tsx:48`; `pages/employee/EmployeeMachinesPage.test.tsx:51`; `pages/employee/EmployeeHistoryPage.test.tsx:57` | ✅ |
| OCO-01 | `pendente`, `origem: 'funcionario'`, session data, `horario` today or now, `alerta`, 201 | `incidentService.test.ts:60-65`, `:73`; `incidentController.test.ts:31-33` | ✅ |
| OCO-02 | no session → 409; no operator → 403 | `incidentService.test.ts:78-80`, `:84-85` | ✅ |
| OCO-03 | bad `horario` or `descricao` > 500 → 400 | `incidentController.test.ts:42-51` (9:15, 24:00, number, 501 chars); `:55-56` (500 passes) | ✅ |
| OCO-04 | scoped list, optional machine/day filters, newest first, contract shape | `incidentService.test.ts:98-103`, `:108`; `incidentController.test.ts:70-72` | ✅ |
| OCO-05 | form posts `horario`, toast; failure keeps form + error toast | `components/employee/IncidentSheet.test.tsx:134`, `:145`; `services/incidentService.test.ts:28` | ✅ |
| OCO-06 | detail and Alertas list API incidents; repairs stay mock | `components/machines/MachineDetailModal.test.tsx:102`, `:138`; `pages/AlertasPage.test.tsx:67`, `:141`, `:184` | ✅ |

### Edge cases

| Edge case | Evidence | Result |
| --------- | -------- | ------ |
| Concurrent start → unique partial index → 409 | `schemas.test.ts` partial index `{ fim: null }` assertion; `sessionService.test.ts:119` (error 11000 → 409) | ✅ |
| Deleted machine: end still 200 with `fim` | `sessionService.test.ts:173-175` | ✅ |
| `from` > `to` → `[]` | `sessionService.test.ts:215-216`; `incidentService.test.ts:116-117` | ✅ |
| `machineId` not ObjectId → 400 | `sessionService.test.ts:224`; `sessionController.test.ts:62`; `incidentService.test.ts:121` | ✅ |

### Accepted deviations (not failures)

- `maquina` is `null` for sessions/incidents of a deleted machine (`sessionService.test.ts:175`).
- Incident cards show a single time, not a range.
- Urgency for API incidents is always Alta (`pages/AlertasPage.test.tsx:99`).
- The incident form sends only `{ horario }`; `descricao` is never sent from the UI (`services/incidentService.test.ts:28`).

## Discrimination Sensor

Scratch: temporary `git worktree` at HEAD with `node_modules` symlinked; removed after the run. Real tree `git status --porcelain` matched the pre-sensor baseline.

| # | Mutation | Tests run | Result |
| - | -------- | --------- | ------ |
| B1 | `iniciar`: `status !== 'disponivel'` → `status === 'em_uso'` | `sessionService.test.ts` | Killed |
| B2 | `encerrar`: apply `disponivel` regardless of current status | `sessionService.test.ts` | Killed |
| B3 | `lerPeriodo`: drop the `from > to → null` guard | `tests/unit` | Killed |
| B4 | `listar` sessions: sort ascending | `sessionService.test.ts` | Killed |
| B5 | `lerPeriodo`: `to` no longer inclusive (drop +1 day) | `tests/unit` | Killed |
| B6 | `reportar`: skip `aplicarStatus('alerta')` | `incidentService.test.ts` | Killed |
| B7 | `horario` regex accepts `24:xx` | `incidentController.test.ts` | Killed |
| B8 | duplicate-key race rethrown raw instead of 409 | `sessionService.test.ts` | Killed |
| B9 | admin login also resolves `operador` | `authService.test.ts` | Killed |
| F1 | employee guard only blocks `admin` (null session passes) | `components/employee` | Killed |
| F2 | incident submit failure falls through to success toast + close | `IncidentSheet.test.tsx` | Killed |
| F3 | `end` swallows API failure and clears the session | `hooks`, `EmployeeSessionPage.test.tsx` | Killed |

**Score**: 12/12 killed.

## Gaps

None blocking. No lessons recorded (clean PASS, no surviving mutants or spec-precision gaps).
