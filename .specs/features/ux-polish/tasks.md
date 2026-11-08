# Polimento de experiência Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

**Regras do projeto que valem acima do skill:** nunca executar `git commit` nem `git add` (tudo fica no working tree; o dono revisa e commita); nunca acessar o banco; só mexer no `Frontend/` e em `.specs/features/ux-polish/`. Trabalhar direto na branch `feature/telemetry-queue`, sem worktree. Não reformatar arquivos inteiros (rodar prettier só nos arquivos que você criou).

**Design (inline)**: sem `design.md`. Decisões: spinner = `Loader2` do `lucide-react` com a classe de rotação do CSS Module (respeitar `prefers-reduced-motion`); toast = `useToast()` de `components/common/Toast.tsx`; textos novos nas chaves de i18n dos 7 idiomas (`Frontend/src/locales/{pt-BR,en-US,de,es,fr,ja,ru}`); o teste de paridade de chaves já existe e deve passar; estilos com os tokens atuais (`var(--border)`, `var(--bg)`, `var(--radius-sm)`, `var(--accent-border)`, `var(--blue)`).

**Status**: Complete

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Frontend componente / página | unit (Testing Library) | Estados carregando, sucesso, erro e ocupado; ACs da spec | `Frontend/src/test/{components,pages}/**/*.test.tsx` | `cd Frontend && yarn test` |
| Frontend hook | unit | Ramos de sucesso e falha | `Frontend/src/test/hooks/*.test.tsx` | `cd Frontend && yarn test` |
| Frontend locales | unit (paridade de chaves, já existe) | Chaves novas nos 7 idiomas | `Frontend/src/test/config/` | `cd Frontend && yarn test` |
| Tasks de fechamento | none | - (gate de build) | - | `cd Frontend && yarn lint && yarn build && yarn test` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Cada task | `cd Frontend && yarn test` |
| Build | Fim de fase e fim da feature | `cd Frontend && yarn lint && yarn build && yarn test` |

Tests ficam em `Frontend/src/test/{components,pages,hooks,...}/` espelhando `src/`, com Testing Library.

---

## Execution Plan

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11
```

---

## Task Breakdown

### T1: Componente `Select`

**What**: Criar `Select` (botão `role="combobox"` + lista `role="listbox"`/`option`, `aria-selected`) com props `id`, `value`, `options: {value,label}[]`, `onChange(valor)`, `disabled`, `className`, `ariaLabel`. Abre com clique, Enter, Espaço, seta para baixo; setas/Home/End/Enter/Esc; clique fora fecha e devolve o foco; digitar letra salta para a opção; abre para cima se faltar espaço; altura máxima com rolagem; estilo de desabilitado; animação desligada em `prefers-reduced-motion`; cantos com `var(--radius-sm)`, tema claro/escuro por tokens.
**Where**: `Frontend/src/components/common/Select.tsx`, `Select.module.css`
**Depends on**: None
**Reuses**: `components/layout/AlertsDropdown.tsx` (clique fora, Esc), `components/common/Modal.tsx` (padrão de foco)
**Requirement**: UXP-04 (AC 1, 3–9)

**Done when**:
- [x] Todos os ACs 3–9 do UXP-04 verificados por teste
- [x] O label associado por `htmlFor`/`id` foca o botão

**Tests**: unit (`Frontend/src/test/components/common/Select.test.tsx`)
**Gate**: quick

---

### T2: Trocar os nove `<select>` pelo `Select`

**What**: Substituir os `<select>` de `NewMachinePanel` (×2), `EmployeeFormModal`, `SectorFormModal`, `MachineDetailModal`, `VisaoGeralPage` (×2), `EquipePage`, `FrotaPage` (×2) pelo `Select`, mantendo a regra de cada tela e ajustando os CSS Modules (remover estilos do select nativo que sobrarem). Atualizar os testes existentes que usam `selectOptions`/`getByRole('combobox')` para o novo componente.
**Where**: arquivos acima + os testes deles em `Frontend/src/test/`
**Depends on**: T1
**Requirement**: UXP-04 (AC 2)

**Done when**:
- [x] `grep -rn "<select" Frontend/src --include=*.tsx` sem resultado fora do `Select`
- [x] Testes das telas passam

**Tests**: unit (ajustar existentes)
**Gate**: quick

---

### T3: Skeleton e erro no histórico do modal de máquina

**What**: Em `MachineDetailModal`, estado `loading/error` para a busca do histórico: skeleton (linhas com a altura da lista) com `aria-busy="true"` no painel; erro com mensagem e botão "Tentar de novo" (não mostrar "sem registros"); descartar resposta antiga ao trocar período/fechar; trocar o texto fixo "Date:" e o sufixo "(ID)" por chaves de i18n nos 7 idiomas. Pode extrair um `Skeleton` pequeno reutilizável se `PageSkeleton.module.css` já tiver a animação.
**Where**: `components/machines/MachineDetailModal.tsx` + `.module.css`, locales
**Depends on**: T2
**Reuses**: `components/common/PageSkeleton.*`
**Requirement**: UXP-01 (AC 1–5), UXP-05 (AC 1–2)

**Done when**:
- [x] Testes cobrem: skeleton enquanto pendente, lista após sucesso, vazio, erro com retry, resposta antiga descartada
- [x] Nenhum texto fixo em inglês no modal

**Tests**: unit (`Frontend/src/test/components/machines/MachineDetailModal.test.tsx`)
**Gate**: quick

---

### T4: Botão com progresso (`SpinnerButton` ou estilo comum)

**What**: Criar o padrão de botão em andamento: spinner `Loader2` + texto de andamento, `disabled`, `aria-busy="true"`, `cursor: not-allowed`, anel `focus-visible`. Preferir uma classe compartilhada em `DialogButtons.module.css` e um pequeno componente `Spinner` em `components/common/`.
**Where**: `components/common/Spinner.tsx` + `.module.css`, `components/common/DialogButtons.module.css`
**Depends on**: T3
**Requirement**: UXP-06 (AC 3–4), UXP-03

**Done when**:
- [x] Teste do `Spinner` e do estado ocupado

**Tests**: unit
**Gate**: quick

---

### T5: Sessão do funcionário (encerrar e iniciar)

**What**: `EmployeeSessionPage`: ao encerrar, desabilitar os dois botões, spinner e texto "Encerrando…"; sucesso → toast "Sessão encerrada" e vai para `/funcionario`; falha mantém a tela e o `endError` já existente. `MachineDetailSheet` (iniciar): spinner, desabilita, toast "Sessão iniciada" no sucesso; impedir segundo envio. Chaves nos 7 idiomas.
**Where**: `pages/employee/EmployeeSessionPage.tsx`, `components/employee/MachineDetailSheet.tsx`, `hooks/useWorkSession.ts` (se precisar do toast), CSS e locales
**Depends on**: T4
**Requirement**: UXP-02

**Done when**:
- [x] Testes: spinner durante a chamada, toast no sucesso, erro libera os botões, sem duplo clique

**Tests**: unit (`test/pages/employee/`, `test/components/employee/`)
**Gate**: quick

---

### T6: Formulários (funcionário, setor, máquina, categoria)

**What**: `EmployeeFormModal`, `SectorFormModal`, `NewMachinePanel` (e o formulário de máquina de `VisaoGeralPage`/`DashboardPage`), `CategoryFormModal`: estado `saving` com campos e botão desabilitados, spinner no confirmar, sem envio duplo; falha mantém o formulário com os dados. Os pais devem devolver a promise do salvar (`onSubmit` async) para o formulário saber quando terminou.
**Where**: componentes acima, `EquipePage`, `FrotaPage`, `VisaoGeralPage`, `DashboardPage`, CSS e locales
**Depends on**: T5
**Requirement**: UXP-03 (AC 1–2, 7)

**Done when**:
- [x] Teste por formulário: ocupado durante a promise, fecha no sucesso, permanece no erro

**Tests**: unit
**Gate**: quick

---

### T7: Exclusões com progresso

**What**: Confirmar exclusão de máquina, categoria, funcionário, setor e filial: spinner no confirmar, cancelar desabilitado até a resposta, fecha só no sucesso, toast de erro mantém o diálogo. Estender `ConfirmDialog` com a prop `busy`.
**Where**: `components/common/ConfirmDialog.tsx`, `components/layout/BranchSelector.tsx`, `pages/{FrotaPage,EquipePage,VisaoGeralPage}.tsx`, CSS e locales
**Depends on**: T6
**Requirement**: UXP-03 (AC 3, 7)

**Done when**:
- [x] Teste do `ConfirmDialog` ocupado; testes das telas ajustados

**Tests**: unit
**Gate**: quick

---

### T8: Troca de status e trava de categoria

**What**: No `MachineDetailModal`, enquanto a troca de status ou a trava roda: controle desabilitado com spinner; sucesso → toast; falha → volta ao valor anterior e toast de erro. Os pais (`FrotaPage`, `VisaoGeralPage`) devolvem a promise de `onChangeStatus`/`onToggleLock` e lançam o erro para o modal reagir (sem toast duplicado com o que já existe).
**Where**: `MachineDetailModal.tsx`, `pages/FrotaPage.tsx`, `pages/VisaoGeralPage.tsx`, locales
**Depends on**: T7
**Requirement**: UXP-03 (AC 4–5)

**Done when**:
- [x] Testes: ocupado, toast de sucesso, rollback no erro

**Tests**: unit
**Gate**: quick

---

### T9: Ações de filial

**What**: `BranchSelector`: criar, renomear e remover mostram spinner no item acionado, bloqueiam duplo envio e dão toast de sucesso/erro.
**Where**: `components/layout/BranchSelector.tsx` + `.module.css`, locales
**Depends on**: T8
**Requirement**: UXP-03 (AC 6–7)

**Done when**:
- [x] Testes para as três ações (ocupado, sucesso, erro)

**Tests**: unit
**Gate**: quick

---

### T10: Levantamento completo e lacunas restantes

**What**: Percorrer cada página e componente com `await`, `useEffect` com busca, lista ou botão que muda dados (Login, SolicitarAcesso, Solicitacoes, Feedback, IncidentSheet, EmployeeHistory, EmployeeSettings, AccountActionModal, InitialPasswordModal, AlertasPage, AlertsDropdown, Dashboard, Header/Profile) e conferir: loading, erro com nova tentativa, vazio, toast de sucesso, botão ocupado, `focus-visible`, texto fixo fora do i18n. Registrar no fim deste arquivo (seção "Lacunas achadas") cada item achado e tratar todos com os padrões dos T1–T9.
**Where**: `Frontend/src/**` conforme achados
**Depends on**: T9
**Requirement**: UXP-01 (AC 6), UXP-05 (AC 3), UXP-06

**Done when**:
- [x] A seção "Lacunas achadas" lista cada item com o arquivo e a correção
- [x] Cada item tem teste ou justificativa

**Tests**: unit
**Gate**: build

---

### T11: Fechamento

**What**: Rodar o gate Build completo, conferir paridade de i18n nos 7 idiomas, marcar as tasks concluídas aqui e `Status: Complete`; listar os arquivos alterados no relatório final. Sem commit.
**Where**: `.specs/features/ux-polish/tasks.md`
**Depends on**: T10
**Requirement**: UXP-01..UXP-06

**Done when**:
- [x] `cd Frontend && yarn lint && yarn build && yarn test` passam

**Tests**: none
**Gate**: build

---

## Lacunas achadas

Tratadas no T10 (resumo dos workers):
- Área do funcionário e feedback: histórico do `MachineDetailSheet` sem loading/erro; `IncidentSheet`, `FeedbackModal` e `EmployeeSettingsPage` sem spinner e sem bloqueio de duplo envio; texto fixo em `EmployeeHistoryPage`; foco visível.
- Login, solicitações, conta, cabeçalho e sino: `LoginPage`, `SolicitarAcessoPage` e `AccountActionModal` sem spinner/`aria-busy`; `SolicitacoesPage` sem `busy` no diálogo; diálogos de exclusão fechavam antes da resposta; foco em `AlertsDropdown` e `Header`.
- Frota e visão geral: foco visível em `.menuButton` (`FleetCard`, `MachineCard`), `FleetRow` e `MachineTable`.
- Histórico do modal de máquina: a aba de manutenção não mostra o skeleton da busca de alertas.
