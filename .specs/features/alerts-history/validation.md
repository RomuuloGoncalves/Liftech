# Histórico de Alertas Validation

## Validation: alerts-history - PASS ✅

**Date**: 2026-10-02
**Spec**: `.specs/features/alerts-history/spec.md`
**Diff range**: `9670581~1..HEAD` minus merge `b2855df` (feature commits: 9670581, 3719a24, 8f22cdf, 46a69f3, 1783a71, c10210b, e72d66b; fleet files came from main via the merge, only 1783a71's FleetCard changes are this feature's)
**Verifier**: independent sub-agent (author ≠ verifier)

All test paths below are relative to `Frontend/src/test/`.

---

## Task Completion

| Task | Status  | Notes |
| ---- | ------- | ----- |
| T1   | ✅ Done | 9670581 - `causa` + `ACCIDENT_URGENCY` in `data/machines.ts` |
| T2   | ✅ Done | 3719a24 - `formatAlertDate` (shared `dateParts` with `formatEventDate`) |
| T3   | ✅ Done | 8f22cdf - `alerts` module in 7 locales + i18n test |
| T4   | ✅ Done | 46a69f3 - `variant="alerts"` in `MachineDetailModal` |
| T5   | ✅ Done | 1783a71 - `urgency` prop, optional menu/drag in `FleetCard` |
| T6   | ✅ Done | c10210b - `AlertasPage` |
| T7   | ✅ Done | e72d66b - `docs/frontend.md`, `docs/i18n.md` |

---

## Spec-Anchored Acceptance Criteria

### P1: Ver os acidentes da frota

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 one card per accident in default period | count = accidents with date in 2024-07-14..2026-07-14 | `pages/AlertasPage.test.tsx:25` - `expect(cards()).toHaveLength(expected.length)` (expected = `accidentsIn(DEFAULT_PERIOD.from, DEFAULT_PERIOD.to)`, `:24` non-empty) | ✅ PASS |
| AC2 order most recent → oldest by date + start time | descending by `data + inicio` | `pages/AlertasPage.test.tsx:33` - `expect(cards().map(card => field(card, 'Data e Hora'))).toEqual(expected)` (expected sorted desc by `data+inicio`, `:11`) | ✅ PASS |
| AC3 card fields | name, "EMP-084(ID)", sector, event operator, "23 Janeiro 2026, 14:38:20", urgency | `pages/AlertasPage.test.tsx:46-51` - `getByText(machine.nome)`, `getByText('EMP-084(ID)')`, `field(card,'Setor:')).toBe(machine.setor)`, `field(card,'Funcionário:')).toBe(event.operador)`, `field(card,'Data e Hora')).toBe(\`${formatAlertDate(...)}, ${event.inicio}\`)`, `field(card,'Nível de urgência')).toBe(URGENCY_LABEL[event.causa])`; literal format anchored at `utils/format.test.ts:20` - `toBe('23 Janeiro 2026')` and `components/fleet/FleetCard.test.tsx:47` - `toBe('23 Janeiro 2026, 14:38:20')` | ✅ PASS |
| AC4 cause → urgency | frenagem=Média, colisao=Alta, tombamento=Crítica | `data/machines.test.ts:138` - `expect(ACCIDENT_URGENCY).toEqual({ frenagem: 'media', colisao: 'alta', tombamento: 'critica' })`; `pages/AlertasPage.test.tsx:57` - rendered labels `toEqual(expected)` with `URGENCY_LABEL` (`:7`) and `:58` all three present; colors `components/fleet/FleetCard.test.tsx:57-58` - `textContent).toBe(label)`, `className).toContain(tone)` (caution/warning/danger) | ✅ PASS |
| AC5 "Acidentes" label with count of visible cards | counter = visible card count | `pages/AlertasPage.test.tsx:63,65` - `expect(counter()).toBe(String(cards().length))` (counter read inside heading named /Acidentes/, `:16`), `:66` count = EMP-084 accidents | ✅ PASS |
| AC6 no maintenance cards | only `tipo: 'acidente'` | `pages/AlertasPage.test.tsx:25` (count equals accidents only); `data/machines.test.ts:144` - `expect(event.causa).toBeUndefined()` for maintenance | ✅ PASS |

### P1: Filtrar acidentes

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 search by name or code, trimmed, case-insensitive | only matching machines | `pages/AlertasPage.test.tsx:71-73` - `search('  emp-084 ')` then every card `getByText('EMP-084(ID)')`, `length > 0`; name: `:78-82` - `search('atlas')`, `toHaveLength(expected.length)` | ✅ PASS |
| AC2 period inclusive | cards with `from <= data <= to` | `pages/AlertasPage.test.tsx:98` - `toHaveLength(accidentsIn(from, to).length)` with bounds equal to real event dates (`:93-94`) and `:99` narrower than all | ✅ PASS |
| AC3 start > end → no cards | 0 cards | `pages/AlertasPage.test.tsx:114` - `expect(cards()).toHaveLength(0)` | ✅ PASS |
| AC4 empty state + counter 0 | "Nenhum alerta encontrado", counter "0" | `pages/AlertasPage.test.tsx:115-116` and `:122-123` - `getByText('Nenhum alerta encontrado')`, `expect(counter()).toBe('0')` | ✅ PASS |

### P1: Detalhe a partir do alerta

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 click opens that machine's modal on alerts tab | dialog for the card's machine, alerts tab selected | `pages/AlertasPage.test.tsx:133` - `within(dialog).getByText('EMP-084(ID)')`, `:136` - `tabs[0]).toHaveAttribute('aria-selected','true')`; `components/machines/MachineDetailModal.test.tsx:223` same + `:224-225` alerts timeline shown, repairs hidden | ✅ PASS |
| AC2 tabs alerts → repairs, no badge, no Edit/Delete | `['Histórico de alertas','Histórico de reparos']`, no badge/buttons | `pages/AlertasPage.test.tsx:135` - `toEqual(['Histórico de alertas', 'Histórico de reparos'])`, `:137` - `queryByText('Em manutenção')).not` (EMP-084 is `Manutenção`), `:138` - no /Editar\|Excluir/ button; `components/machines/MachineDetailModal.test.tsx:222,231-233` | ✅ PASS |
| AC3 close keeps filters | modal gone, search value and card count unchanged | `pages/AlertasPage.test.tsx:141-143` - dialog not in document, `toHaveValue('EMP-084')`, `toHaveLength(visible)` | ✅ PASS |

### ALRT-08: textos nos 7 idiomas

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| `alerts` module in 7 locales | same non-empty keys | `config/i18n.test.ts:141` - keys `toEqual(ptBRAlertKeys)`, `:143` - `toBeTruthy()` per value; `:20` `alerts` in `REQUIRED_MODULES` | ✅ PASS |

**Status**: ✅ All ACs covered (14/14 matched spec outcome, 0 spec-precision gaps)

---

## Edge Cases

- [x] Start after end → "Nenhum alerta encontrado": `pages/AlertasPage.test.tsx:115`
- [x] Cleared date = open side: `pages/AlertasPage.test.tsx:107` - `toHaveLength(accidentsIn('', to).length)`
- [x] Search with only spaces → every card of the period: `pages/AlertasPage.test.tsx:88` - `toHaveLength(accidentsIn(DEFAULT_PERIOD...).length)`

---

## Discrimination Sensor

Scratch: rsync copy of `Frontend/` (no node_modules/dist, node_modules symlinked) under the session scratchpad; tests run there: `yarn vitest run` on the 5 component/data/page test files in scope (80 tests). Porcelain baseline empty before and after; scratch deleted.

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| M1 | `Frontend/src/data/machines.ts:172` | `colisao: 'alta'` → `'critica'` | ✅ Killed (2 failed) |
| M2 | `Frontend/src/pages/AlertasPage.tsx:26` | dropped `.trim()` from search | ✅ Killed (2 failed) |
| M3 | `Frontend/src/components/machines/MachineDetailModal.tsx:48-51` | `alerts` tabs reordered (repairs first/selected) | ✅ Killed (2 failed) |
| M4 | `Frontend/src/pages/AlertasPage.tsx:27` | removed `tipo: 'acidente'` filter (maintenance included) | ✅ Killed (11 failed) |
| M5 | `Frontend/src/pages/AlertasPage.tsx:30` | code match case-sensitive | ✅ Killed (4 failed) |
| M6 | `Frontend/src/components/machines/MachineDetailModal.tsx:108` | status badge shown in `alerts` variant | ✅ Killed (2 failed) |

**Sensor depth**: lightweight (6 mutations)
**Result**: 6/6 killed - PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code (reuses `filterEvents`, `FleetCard`, `MachineDetailModal`; `dateParts` shared by two formatters, FleetCard's private formatter removed) | ✅ |
| Surgical changes (FleetCard menu block only re-indented under `onMove && onRemove`) | ✅ |
| No scope creep (no ⋮ action, no urgency filter, no edit/delete) | ✅ |
| Matches patterns (page state local, CSS module, i18n keys) | ✅ |
| Spec-anchored outcome check | ✅ |
| Per-layer Coverage Expectation met (data/utils unit 1:1, page happy + edge) | ✅ |
| Every test maps to a spec requirement - no unclaimed tests | ✅ |
| Documented guidelines followed: `docs/frontend.md`, `docs/i18n.md` | ✅ |

---

## Gate Check

- **Gate command**: `cd Frontend && yarn lint && yarn build && yarn test`
- **Result**: lint clean, build ok, 356 passed, 0 failed, 0 skipped (29 files)
- **Test count before feature**: 264 (pre-merge baseline; main's fleet work added more)
- **Test count after feature**: 356
- **Delta**: +92 total; feature-owned: machines +3, format +2, i18n +8, MachineDetailModal +2, FleetCard +4, AlertasPage +13
- **Skipped tests**: none
- **Failures**: none

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| ALRT-01 | Pending | ✅ Verified |
| ALRT-02 | Pending | ✅ Verified |
| ALRT-03 | Pending | ✅ Verified |
| ALRT-04 | Pending | ✅ Verified |
| ALRT-05 | Pending | ✅ Verified |
| ALRT-06 | Pending | ✅ Verified |
| ALRT-07 | Pending | ✅ Verified |
| ALRT-08 | Pending | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 14/14 ACs matched spec outcome, 3/3 edge cases
**Sensor**: 6/6 mutations killed
**Gate**: 356 passed

**Notes (non-blocking)**: the grid breakpoints and the Figma 1440px fidelity are CSS-only and not unit-testable here; covered by UAT, not by tests.
