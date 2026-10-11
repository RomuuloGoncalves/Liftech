# Detalhe e Histórico da Máquina Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/machine-detail/spec.md`
**Design (inline)**: dados e formatação puros em `data/machines.ts` e `utils/format.ts`; `Modal` ganha `badge` e `footer`; `MachineDetailModal` mostra cabeçalho, info card, abas (`role="tab"`), período (2 inputs `date`) e linha do tempo; `MachineCard` abre o detalhe por botão esticado no título (sem aninhar botões); `NewMachinePanel` ganha modo edição; `VisaoGeralPage` mantém um único estado `dialog` (detalhe | editar | excluir).
**Status**: Draft

---

## Test Coverage Matrix

> Guidelines found: `docs/frontend.md` (Vitest + Testing Library, testes espelham `src/` em `src/test/`), `Frontend/package.json`. Defaults fortes aplicados.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Dados / utils puros | unit | Todas as ramificações; 1:1 com os ACs de filtro e formatação | `Frontend/src/test/{data,utils}/*.test.ts` | `cd Frontend && yarn vitest run src/test/data src/test/utils` |
| Componente | unit (Testing Library) | Render, callbacks, acessibilidade, estados vazios | `Frontend/src/test/components/**/*.test.tsx` | `cd Frontend && yarn vitest run src/test/components` |
| Página | integration | Fluxos da spec: abrir, abas, período, editar, excluir | `Frontend/src/test/pages/*.test.tsx` | `cd Frontend && yarn vitest run src/test/pages` |
| Locales | unit | Paridade das chaves novas nos 7 idiomas | `Frontend/src/test/config/i18n.test.ts` | `cd Frontend && yarn vitest run src/test/config` |
| CSS / docs | none | - (build gate only) | - | build gate only |

## Gate Check Commands

Rodar com Node 22.22.2 (`PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH`).

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com testes de unidade | `cd Frontend && yarn vitest run <teste da task>` |
| Full | Tasks de página | `cd Frontend && yarn test` |
| Build | Fim de fase e tasks sem teste | `cd Frontend && yarn lint && yarn build && yarn test` |

---

## Execution Plan

### Phase 1: Foundation

```
T1
T2
T3
T4
```

### Phase 2: Componentes

```
T5
T6
T7
```

### Phase 3: Página

```
T8 → T9
```

---

## Task Breakdown

### Phase 1: Foundation

### T1: ✅ Dados do detalhe e do histórico

**What**: `nomeDispositivo` e `tempoUsoTotalHoras` na `Machine`, tipo `MachineEvent`, eventos mockados por máquina, `filterEvents(events, { tipo, from, to })` e `DEFAULT_PERIOD`.
**Where**: `Frontend/src/data/machines.ts`
**Depends on**: None
**Reuses**: `filterMachines` e a estrutura atual do mock
**Requirement**: MACH-02

**Done when**:

- [ ] Todas as 16 máquinas têm nome de dispositivo e horas; há eventos de acidente e de manutenção, todos dentro de `DEFAULT_PERIOD`
- [ ] `filterEvents` filtra por tipo e por período inclusivo, ordena do mais novo ao mais antigo e devolve `[]` quando início > fim
- [ ] Os testes existentes de `machines.test.ts` continuam passando
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/data`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): add device name, total usage and event history mocks`

---

### T2: ✅ Formatação de data, duração e horas

**What**: `formatEventDate`, `formatDuration` e `formatHours` com `Intl`, no idioma ativo.
**Where**: `Frontend/src/utils/format.ts`
**Depends on**: None
**Reuses**: `Intl.DateTimeFormat` e `Intl.NumberFormat` (unit)
**Requirement**: MACH-02, MACH-04

**Done when**:

- [ ] `2025-09-14` em pt-BR vira "Dom, 14 setembro 2025" (dia da semana abreviado, mês por extenso, sem "de")
- [ ] 14:35:25 a 16:35:20 vira "2 horas"; 14:00:00 a 14:45:00 vira "45 minutos"; 14:00:00 a 15:30:00 vira "1 hora 30 minutos"
- [ ] Mesmo resultado estrutural em en-US
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/utils/format.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(utils): add date and duration formatters`

---

### T3: ✅ Traduções do detalhe, edição e exclusão

**What**: Chaves novas em `machines.*` (detalhe, abas, período, vazio, ações, edição, exclusão) nos 7 idiomas, mais teste de paridade.
**Where**: `Frontend/src/locales/*/translation.json`
**Depends on**: None
**Reuses**: Teste de paridade do módulo `team` em `i18n.test.ts`
**Requirement**: MACH-04

**Done when**:

- [ ] Mesmas chaves novas em pt-BR, en-US, es, fr, de, ja e ru, nenhuma vazia
- [ ] Textos com `{{name}}` o preservam em todos os idiomas
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/config`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(i18n): add machine detail translations`

---

### T4: ✅ `Modal` com `badge` e `footer`

**What**: Props opcionais `badge` (ao lado do título) e `footer` (faixa inferior em largura total), sem mudar os modais existentes.
**Where**: `Frontend/src/components/common/Modal.tsx`
**Depends on**: None
**Reuses**: `Modal.module.css`
**Requirement**: MACH-01

**Done when**:

- [ ] Sem as props novas, a saída e os testes atuais de Modal, ConfirmDialog e dos modais de Equipe não mudam
- [ ] `badge` aparece junto ao título; `footer` aparece depois do conteúdo
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(common): add badge and footer slots to Modal`

---

### Phase 2: Componentes

### T5: ✅ `NewMachinePanel` em modo edição

**What**: Prop opcional `machine`: título "Editar Máquina", subtítulo e botão "Editar Empilhadeira" do Figma, campos preenchidos, `onSave` com os valores.
**Where**: `Frontend/src/components/machines/NewMachinePanel.tsx`
**Depends on**: T3
**Reuses**: O próprio painel
**Requirement**: MACH-03

**Done when**:

- [ ] Sem `machine`, o comportamento e os testes atuais não mudam
- [ ] Com `machine`, os cinco campos vêm preenchidos e Empilhadeira e Código continuam obrigatórios
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/machines`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): add edit mode to NewMachinePanel`

---

### T6: ✅ `MachineCard` abre o detalhe

**What**: Prop opcional `onOpen`; o título vira botão esticado sobre o card, o "⋮" continua independente.
**Where**: `Frontend/src/components/machines/MachineCard.tsx`
**Depends on**: T3
**Reuses**: `MachineCard.module.css`
**Requirement**: MACH-01

**Done when**:

- [ ] Clicar no card chama `onOpen(machine)`; clicar no "⋮" não chama
- [ ] Sem `onOpen`, os testes atuais continuam passando
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/machines/MachineCard.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): make MachineCard open the detail`

---

### T7: ✅ `MachineDetailModal`

**What**: Modal do frame `89:3800`: cabeçalho com status, info card, abas, período e linha do tempo, rodapé com Editar e Excluir.
**Where**: `Frontend/src/components/machines/MachineDetailModal.tsx`
**Depends on**: T1, T2, T3, T4
**Reuses**: `Modal`, `filterEvents`, formatadores, estilos de status do `MachineCard`
**Requirement**: MACH-01, MACH-02, MACH-03

**Done when**:

- [ ] Mostra nome, badge, código, MAC, Setor, Tempo Uso (Total) e Nome Dispositivo
- [ ] Abre em "Histórico de acidentes"; abas com `role="tab"` e `aria-selected`; a lista muda ao trocar
- [ ] Período filtra; início depois do fim e lista sem eventos mostram o estado vazio
- [ ] Editar e Excluir chamam `onEdit` e `onDelete`; fechar por ícone, Escape e backdrop
- [ ] Gate passes: `cd Frontend && yarn vitest run src/test/components/machines/MachineDetailModal.test.tsx`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(machines): add MachineDetailModal`

---

### Phase 3: Página

### T8: ✅ Ligar detalhe, edição e exclusão na Visão Geral

**What**: Estado `dialog` único na página: detalhe, edição (drawer) e confirmação de exclusão (`ConfirmDialog`).
**Where**: `Frontend/src/pages/VisaoGeralPage.tsx`
**Depends on**: T5, T6, T7
**Reuses**: `ConfirmDialog`, handlers de criação já existentes
**Requirement**: MACH-01, MACH-03

**Done when**:

- [ ] Clicar num card abre o detalhe; editar atualiza card e detalhe; cancelar mantém
- [ ] Excluir confirmado remove o card e fecha tudo; cancelar mantém a máquina e o detalhe aberto
- [ ] Busca e filtro de status continuam aplicados após editar
- [ ] Os testes atuais da página continuam passando
- [ ] Gate passes: `cd Frontend && yarn test`

**Tests**: integration
**Gate**: full
**Commit**: `feat(machines): wire detail, edit and delete on the overview`

---

### T9: ✅ Documentação e gate de build

**What**: Atualizar `docs/frontend.md` (modal de detalhe, `utils/`, `Modal` com slots) e rodar o gate de build completo.
**Where**: `docs/frontend.md`
**Depends on**: T8
**Reuses**: Seções existentes do doc
**Requirement**: MACH-01

**Done when**:

- [ ] `docs/frontend.md` descreve `MachineDetailModal`, `utils/format.ts` e os slots do `Modal`
- [ ] Gate passes: `cd Frontend && yarn lint && yarn build && yarn test`

**Tests**: none
**Gate**: build
**Commit**: `docs(frontend): document machine detail modal`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1, T2, T3, T4 (independentes)
Phase 2:  T5, T6, T7 (independentes entre si)
Phase 3:  T8 → T9
```
