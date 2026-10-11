# Telas do Funcionário Tasks

**Spec**: `.specs/features/employee-screens/spec.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Fundação (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Telas (Parallel)

```
T3 → T4 [P]
T3 → T5 [P]
T3 → T6 [P]
T3 → T7 [P]
T3 → T8 [P]
```

### Phase 3: Fechamento (Sequential)

```
T4, T5, T6, T7, T8 → T9
```

---

## Task Breakdown

### Phase 1: Fundação

#### T1: Dados mock, sessão e textos

**What**: Criar os tipos e os dados mock do funcionário, as funções de filtro, o hook de sessão com `sessionStorage` e todas as chaves de tradução (pt-BR e en-US) das 8 telas.
**Where**: `Frontend/src/data/employeeArea.ts`, `Frontend/src/hooks/useWorkSession.ts`, `Frontend/src/locales/pt-BR/translation.json`, `Frontend/src/locales/en-US/translation.json`
**Depends on**: None
**Reuses**: `Machine` e `MACHINES` de `data/machines.ts`; padrão de `filterMachines`
**Requirement**: EMP-06, EMP-07, EMP-08, EMP-09

**Tests**: unit
**Gate**: quick - `cd Frontend && npx vitest run src/test/data/employeeArea.test.ts src/test/hooks/useWorkSession.test.ts`

**Done when**:

- [x] `filterAvailableMachines` devolve só "Disponível" e filtra por nome, identificação e setor sem diferenciar maiúsculas
- [x] `filterUsageHistory` aplica período, hora inicial, hora final e máquina; período invertido devolve lista vazia
- [x] `useWorkSession` inicia, limpa, devolve os segundos decorridos e funciona em memória quando `sessionStorage` lança erro
- [x] Chaves `employee.*` existem em pt-BR e en-US
- [x] Gate passa

#### T2: Layout do funcionário, rotas e bottom sheet

**What**: Criar o layout do funcionário (header com logo, botão de alerta e botão azul; barra inferior flutuante com 4 abas), o componente `BottomSheet`, o `MachineListCard` compartilhado (nome, identificação, setor, data e hora, chip de status, botão) as páginas stub das 7 rotas e o ramo `/funcionario` no `App.tsx`.
**Where**: `Frontend/src/components/employee/EmployeeLayout.tsx`, `EmployeeHeader.tsx`, `TabBar.tsx`, `BottomSheet.tsx` (+ `.module.css`), `MachineListCard.tsx`, `Frontend/src/pages/employee/*.tsx`, `Frontend/src/routes/appRoutes.tsx`, `Frontend/src/App.tsx`
**Depends on**: T1
**Reuses**: `logo.svg`, `lucide-react`, tokens de `index.css`, `Toast` e `Modal` de `components/common` como referência de a11y
**Requirement**: EMP-01, EMP-02, EMP-11

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/components/employee src/test/App.test.tsx`

**Done when**:

- [x] Em `/funcionario/*` não há Sidebar nem Header do administrador
- [x] A aba da rota atual tem o círculo azul preenchido e as outras não
- [x] Tocar numa aba navega para a rota dela; o botão de alerta abre `/funcionario/ocorrencia`
- [x] O botão azul abre `/funcionario/configuracoes`, mostra X lá e volta para a rota anterior
- [x] `BottomSheet` fecha com Escape, toque no fundo e botão cancelar, e prende o foco
- [x] Gate passa

### Phase 2: Telas (Parallel)

```
T3 → T4 [P]
T3 → T5 [P]
T3 → T6 [P]
T3 → T7 [P]
T3 → T8 [P]
```

### Phase 3: Fechamento (Sequential)

```
T4, T5, T6, T7, T8 → T9
```

---

## Task Breakdown

### Phase 1: Fundação

#### T1: Dados mock, sessão e textos

**What**: Criar os tipos e os dados mock do funcionário, as funções de filtro, o hook de sessão com `sessionStorage` e todas as chaves de tradução (pt-BR e en-US) das 8 telas.
**Where**: `Frontend/src/data/employeeArea.ts`, `Frontend/src/hooks/useWorkSession.ts`, `Frontend/src/locales/pt-BR/translation.json`, `Frontend/src/locales/en-US/translation.json`
**Depends on**: None
**Reuses**: `Machine` e `MACHINES` de `data/machines.ts`; padrão de `filterMachines`
**Requirement**: EMP-06, EMP-07, EMP-08, EMP-09

**Tests**: unit
**Gate**: quick - `cd Frontend && npx vitest run src/test/data/employeeArea.test.ts src/test/hooks/useWorkSession.test.ts`

**Done when**:

- [x] `filterAvailableMachines` devolve só "Disponível" e filtra por nome, identificação e setor sem diferenciar maiúsculas
- [x] `filterUsageHistory` aplica período, hora inicial, hora final e máquina; período invertido devolve lista vazia
- [x] `useWorkSession` inicia, limpa, devolve os segundos decorridos e funciona em memória quando `sessionStorage` lança erro
- [x] Chaves `employee.*` existem em pt-BR e en-US
- [x] Gate passa

#### T2: Layout do funcionário, rotas e bottom sheet

**What**: Criar o layout do funcionário (header com logo, botão de alerta e botão azul; barra inferior flutuante com 4 abas), o componente `BottomSheet`, o `MachineListCard` compartilhado (nome, identificação, setor, data e hora, chip de status, botão) as páginas stub das 7 rotas e o ramo `/funcionario` no `App.tsx`.
**Where**: `Frontend/src/components/employee/EmployeeLayout.tsx`, `EmployeeHeader.tsx`, `TabBar.tsx`, `BottomSheet.tsx` (+ `.module.css`), `MachineListCard.tsx`, `Frontend/src/pages/employee/*.tsx`, `Frontend/src/routes/appRoutes.tsx`, `Frontend/src/App.tsx`
**Depends on**: T1
**Reuses**: `logo.svg`, `lucide-react`, tokens de `index.css`, `Toast` e `Modal` de `components/common` como referência de a11y
**Requirement**: EMP-01, EMP-02, EMP-11

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/components/employee src/test/App.test.tsx`

**Done when**:

- [x] Em `/funcionario/*` não há Sidebar nem Header do administrador
- [x] A aba da rota atual tem o círculo azul preenchido e as outras não
- [x] Tocar numa aba navega para a rota dela; o botão de alerta abre `/funcionario/ocorrencia`
- [x] O botão azul abre `/funcionario/configuracoes`, mostra X lá e volta para a rota anterior
- [x] `BottomSheet` fecha com Escape, toque no fundo e botão cancelar, e prende o foco
- [x] Gate passa

#### T3: Login do colaborador e atalho temporário

**What**: Mandar o colaborador para `/funcionario` depois do login, manter o administrador em `/`, conferir o login em 320px e adicionar o link "Área do Funcionário" ao menu.
**Where**: `Frontend/src/pages/LoginPage.tsx`, `Frontend/src/components/auth/AuthLayout.module.css`, `Frontend/src/components/layout/Sidebar.tsx`
**Depends on**: T2
**Reuses**: `TEMP_AUTH_LINKS` do `Sidebar`
**Requirement**: EMP-03, EMP-04

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/pages/LoginPage.test.tsx src/test/components/layout`

**Done when**:

- [ ] Login de colaborador com sucesso navega para `/funcionario`
- [ ] Login de administrador com sucesso continua navegando para `/`
- [ ] O menu exibe "Área do Funcionário" apontando para `/funcionario`
- [ ] `AuthLayout.module.css` não gera rolagem horizontal em 320px (regra `min-width: 0`/`max-width: 100%` conferida por teste estático)
- [ ] Gate passa

### Phase 2: Telas

#### T4: Visão geral do funcionário [P]

**What**: Implementar a tela com banner "Última máquina", cards de jornada, e seção "Empilhadeiras disponíveis" com até 3 cards e link "Mais".
**Where**: `Frontend/src/pages/employee/EmployeeHomePage.tsx`, `EmployeeHomePage.module.css`
**Depends on**: T3
**Reuses**: `MachineListCard` e `BottomSheet` de T2, dados de T1, tokens `--green-bg`/`--blue`
**Requirement**: EMP-05

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/pages/employee/EmployeeHomePage.test.tsx`

**Done when**:

- [ ] Título, subtítulo, banner e os dois cards de jornada aparecem com os textos do Figma
- [ ] A seção lista no máximo 3 cards e "Mais" navega para `/funcionario/maquinas`
- [ ] "Selecionar" navega para `/funcionario/maquinas/:id`
- [ ] Gate passa

#### T5: Empilhadeiras disponíveis e sheet de detalhe [P]

**What**: Implementar a lista com busca e o sheet "Selecionar Máquina" com histórico de uso, filtro de período e os botões "Cancelar" e "Ativar máquina".
**Where**: `Frontend/src/pages/employee/EmployeeMachinesPage.tsx`, `Frontend/src/components/employee/MachineDetailSheet.tsx` (+ `.module.css`)
**Depends on**: T3
**Reuses**: `MachineListCard` e `BottomSheet` de T2, `useWorkSession`
**Requirement**: EMP-06, EMP-07

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/pages/employee/EmployeeMachinesPage.test.tsx src/test/components/employee/MachineDetailSheet.test.tsx`

**Done when**:

- [ ] A lista mostra só máquinas "Disponível"; busca filtra; busca sem resultado mostra a mensagem de vazio
- [ ] Selecionar abre o sheet com nome, MAC, código, setor, dispositivo e histórico
- [ ] Período filtra o histórico; "Cancelar" fecha o sheet; id inexistente abre só a lista
- [ ] "Ativar máquina" inicia a sessão e navega para `/funcionario/sessao`; com sessão ativa fica desabilitado
- [ ] Gate passa

#### T6: Sessão em andamento [P]

**What**: Implementar a tela com ilustração, texto, cronômetro `HH:MM:SS`, "Encerrar Sessão" e "Reportar uma ocorrência".
**Where**: `Frontend/src/pages/employee/EmployeeSessionPage.tsx`, `EmployeeSessionPage.module.css`
**Depends on**: T3
**Reuses**: `useWorkSession`, `BottomSheet`
**Requirement**: EMP-08

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/pages/employee/EmployeeSessionPage.test.tsx`

**Done when**:

- [ ] O cronômetro conta a partir do início guardado (teste com `vi.useFakeTimers`) e continua após remontar a página
- [ ] "Encerrar Sessão" limpa a sessão e navega para `/funcionario`
- [ ] "Reportar uma ocorrência" abre o sheet sem encerrar a sessão
- [ ] Sem sessão, redireciona para `/funcionario/maquinas`
- [ ] Gate passa

#### T7: Histórico [P]

**What**: Implementar a tela com filtros de período, hora inicial, hora final e busca, lista de registros e o botão "Mais detalhes".
**Where**: `Frontend/src/pages/employee/EmployeeHistoryPage.tsx`, `EmployeeHistoryPage.module.css`
**Depends on**: T3
**Reuses**: `filterUsageHistory`, `MachineDetailSheet`
**Requirement**: EMP-09

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/pages/employee/EmployeeHistoryPage.test.tsx`

**Done when**:

- [x] Título, subtítulo e os 4 filtros aparecem como no Figma
- [x] Cada filtro e a combinação deles restringem a lista; período invertido mostra a lista vazia
- [x] "Mais detalhes" abre o sheet da empilhadeira do registro
- [x] Gate passa

#### T8: Reportar ocorrência [P]

**What**: Implementar o sheet "Reporte uma ocorrência" com os 4 campos, validação, preenchimento pela sessão ativa, "Cancelar" e "Enviar ocorrência" com toast.
**Where**: `Frontend/src/pages/employee/EmployeeIncidentPage.tsx`, `Frontend/src/components/employee/IncidentSheet.tsx` (+ `.module.css`)
**Depends on**: T3
**Reuses**: `BottomSheet`, `Toast` de `components/common`, `useWorkSession`
**Requirement**: EMP-10

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/components/employee/IncidentSheet.test.tsx`

**Done when**:

- [ ] Campo obrigatório vazio mostra a mensagem e não envia
- [ ] Com sessão ativa, Setor e Máquina vêm preenchidos
- [ ] Envio válido fecha o sheet e mostra o toast; "Cancelar" fecha sem enviar
- [ ] Gate passa

### Phase 3: Fechamento

#### T9: Responsividade, unificação e verificação visual

**What**: Aplicar os breakpoints (1 coluna, 2 colunas a partir de 768px, 3 a partir de 1200px, coluna de até 1120px), truncar nomes longos e conferir 320, 390, 768 e 1440px no navegador.
**Where**: `Frontend/src/pages/employee/*.module.css`, `Frontend/src/components/employee/*.module.css`, `Frontend/src/test/styles/employee.test.ts`
**Depends on**: T4, T5, T6, T7, T8
**Reuses**: padrão de `src/test/styles/*.test.ts` (leitura estática de CSS)
**Requirement**: EMP-12

**Tests**: unit
**Gate**: full - `cd Frontend && npm run lint && npx tsc -b && npx vitest run && npm run build`

**Done when**:

- [ ] Teste estático afirma as colunas e os `max-width` por breakpoint e a ausência de largura fixa maior que 100% nas telas
- [ ] Nome de empilhadeira longo trunca com reticências em uma linha
- [ ] `no-hardcoded-colors.test.ts` continua passando com os CSS novos
- [ ] Conferência manual em 320, 390, 768 e 1440px sem rolagem horizontal, anexada ao relatório do Verifier
- [ ] Só restam as 3 falhas antigas de `34 min`
- [ ] Gate passa

---

## Parallel Execution Map

```
Phase 1 (Sequential):  T1 → T2 → T3
Phase 2 (Parallel):    T4 [P], T5 [P], T6 [P], T7 [P], T8 [P]
Phase 3 (Sequential):  T9
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 módulo de dados + 1 hook + chaves de tradução | OK |
| T2 | 1 layout coerente (header, tab bar, sheet, card de lista, rotas) | OK |
| T3 | 1 mudança de destino, 1 link, 1 ajuste de CSS | OK |
| T4 | 1 página | OK |
| T5 | 1 página + 1 sheet do mesmo fluxo | OK |
| T6 | 1 página | OK |
| T7 | 1 página | OK |
| T8 | 1 sheet + 1 página fina | OK |
| T9 | Camada transversal de CSS e conferência | OK |

---

## Test Coverage Matrix

| Code layer | Required test type | Tasks |
| ---------- | ------------------ | ----- |
| `data/employeeArea.ts`, `useWorkSession` | unit | T1 |
| Layout, tab bar, sheet, card de lista | component | T2 |
| Login e atalho do menu | component | T3 |
| Páginas e sheets do funcionário | component | T4, T5, T6, T7, T8 |
| CSS responsivo e tokens | unit (leitura estática de CSS) | T9 |

---

## Gate Check Commands

| Gate | Command | When |
| ---- | ------- | ---- |
| quick | `cd Frontend && npx vitest run <arquivos da tarefa>` | Depois de cada tarefa |
| full | `cd Frontend && npm run lint && npx tsc -b && npx vitest run && npm run build` | T9 e antes do Verifier |
