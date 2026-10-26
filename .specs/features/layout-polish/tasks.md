# Polimento de proporção do layout Tasks

**Spec**: `.specs/features/layout-polish/spec.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Cards e controles (Parallel)

```
T1 [P]
T2 [P]
T3 [P]
```

### Phase 2: Fechamento (Sequential)

```
T1, T2, T3 → T4
```

---

## Task Breakdown

### Phase 1: Cards e controles

#### T1: Card da Visão Geral e cards da Equipe [P]

**What**: Aplicar padding 12, raio 8 e gap 8, título 13px em uma linha, rótulos/valores/tempo nas escalas e selo compacto no `MachineCard`; aplicar padding 12 e raio 8 em `EmployeeCard` e `SectorCard`.
**Where**: `Frontend/src/components/machines/MachineCard.module.css`, `Frontend/src/components/team/EmployeeCard.module.css`, `Frontend/src/components/team/SectorCard.module.css`, `Frontend/src/test/styles/polishCards.test.ts`
**Depends on**: None
**Reuses**: tokens `--fs-*`, padrão de `src/test/styles/*.test.ts`
**Requirement**: POL-01, POL-02

**Tests**: unit
**Gate**: quick - `cd Frontend && npx vitest run src/test/styles src/test/components/machines src/test/components/team`

**Done when**:

- [x] Teste estático afirma padding, raio e gap dos três cards
- [x] Teste afirma título 13px/600 com reticências, rótulos `--fs-xs`, valores `--fs-sm`, tempo `--fs-base` e selo `--fs-xs`
- [x] Testes antigos que afirmavam os valores anteriores atualizados com justificativa
- [x] Gate passa

#### T2: Cards da Frota e Alertas [P]

**What**: Aplicar o padrão ao `FleetCard`, afinar a faixa colorida para padding vertical de 8px e limitar a grade de Alertas a colunas entre 240px e 288px.
**Where**: `Frontend/src/components/fleet/FleetCard.module.css`, `Frontend/src/pages/AlertasPage.module.css`, `Frontend/src/test/styles/polishFleet.test.ts`
**Depends on**: None
**Reuses**: regras `.topRow.*` existentes
**Requirement**: POL-01, POL-03, POL-04

**Tests**: unit
**Gate**: quick - `cd Frontend && npx vitest run src/test/styles src/test/components/fleet src/test/pages/AlertasPage.test.tsx`

**Done when**:

- [x] Card com padding 12, raio 8, gap 8 e `min-height` removido ou reduzido ao necessário
- [x] Faixa por status e por urgência com padding `8px 12px` e sangria coerente
- [x] Grade de Alertas com `minmax(240px, 288px)` (`--px`) e sem `1fr` no desktop
- [x] Gate passa

#### T3: Controles e menu lateral [P]

**What**: Padronizar altura 32px e fonte `--fs-md` em botões, buscas e seletores de Visão Geral, Frota, Equipe e Alertas, e `--fs-md` nos itens do menu lateral.
**Where**: `Frontend/src/pages/VisaoGeralPage.module.css`, `FrotaPage.module.css`, `EquipePage.module.css`, `AlertasPage.module.css`, `Frontend/src/components/layout/Sidebar.module.css`, `Frontend/src/test/styles/polishControls.test.ts`
**Depends on**: None
**Reuses**: tokens `--fs-md`
**Requirement**: POL-05, POL-06

**Tests**: unit
**Gate**: quick - `cd Frontend && npx vitest run src/test/styles src/test/pages`

**Done when**:

- [x] Teste estático afirma `height: 32px` e `--fs-md` nos controles das 4 páginas
- [x] `.navLink` usa `--fs-md`
- [x] Botão de adicionar categoria continua 32px
- [x] Gate passa

### Phase 2: Fechamento

#### T4: Verificação a 1440x900

**What**: Rodar o gate completo e medir no navegador as alturas dos cards, a contagem de colunas de Alertas e as alturas dos controles.
**Where**: sem arquivos de código; relatório na resposta ao dono
**Depends on**: T1, T2, T3
**Reuses**: medição por `getBoundingClientRect` usada na restyle
**Requirement**: POL-02, POL-04

**Tests**: unit
**Gate**: full - `cd Frontend && npm run lint && npx tsc -b && npx vitest run && npm run build`

**Done when**:

- [x] Cards da Visão Geral e da Frota entre 146 e 165px de altura a 1440x900
- [x] Alertas com 4 cards por linha
- [x] Controles com 32px de altura nas 4 páginas
- [x] Só restam as 3 falhas antigas de `34 min`
- [x] Gate passa

---

## Parallel Execution Map

```
Phase 1 (Parallel):    T1 [P], T2 [P], T3 [P]
Phase 2 (Sequential):  T4
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 3 CSS de card com a mesma regra | OK |
| T2 | 1 card e 1 grade | OK |
| T3 | Altura e fonte dos controles | OK |
| T4 | Verificação | OK |

---

## Test Coverage Matrix

| Code layer | Required test type | Tasks |
| ---------- | ------------------ | ----- |
| CSS Modules dos cards, páginas e menu | unit (leitura estática de CSS) | T1, T2, T3 |
| Medidas computadas a 1440x900 | verificação manual no navegador | T4 |

---

## Gate Check Commands

| Gate | Command | When |
| ---- | ------- | ---- |
| quick | `cd Frontend && npx vitest run <arquivos da tarefa>` | Depois de cada tarefa |
| full | `cd Frontend && npm run lint && npx tsc -b && npx vitest run && npm run build` | T4 |
