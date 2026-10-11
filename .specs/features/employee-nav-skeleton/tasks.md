# Retorno à sessão, animação do menu e skeleton do funcionário Tasks

**Spec**: `.specs/features/employee-nav-skeleton/spec.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Implementação (Parallel)

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

### Phase 1: Implementação

#### T1: Barra "Sessão em andamento" [P]

**What**: Criar a barra fixa acima da barra inferior com nome da máquina, cronômetro e seta, visível só com sessão ativa fora de `/funcionario/sessao`, e ajustar o espaço do conteúdo.
**Where**: `Frontend/src/components/employee/SessionBar.tsx`, `SessionBar.module.css`, `EmployeeLayout.tsx`, `EmployeeLayout.module.css`, `Frontend/src/test/components/employee/SessionBar.test.tsx`
**Depends on**: None
**Reuses**: `useWorkSession`, `formatElapsed`, `MACHINES`, chaves `employee.*` (acrescentar `employee.sessionBar.title` em pt-BR e en-US)
**Requirement**: NAV-01, NAV-02

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/components/employee`

**Done when**:

- [ ] Barra aparece com sessão ativa em qualquer tela exceto `/funcionario/sessao`, com nome da máquina e `HH:MM:SS`
- [ ] Tocar navega para `/funcionario/sessao`; encerrar a sessão remove a barra; sem sessão não aparece
- [ ] Máquina inexistente mostra só o título e o cronômetro
- [ ] Z-index abaixo do overlay dos sheets e conteúdo com `padding-bottom` para a barra
- [ ] Gate passa

#### T2: Animação da barra inferior e do conteúdo [P]

**What**: Animar o círculo azul entre as abas (transform, 250ms), o ícone ativo, e a entrada do conteúdo por seção (fade e subida de 8px, 200ms), com movimento reduzido sem animação.
**Where**: `Frontend/src/components/employee/TabBar.tsx`, `TabBar.module.css`, `EmployeeLayout.tsx` (só a chave de seção no `Outlet`), `Frontend/src/utils/routeSection.ts`, testes em `Frontend/src/test/components/employee/TabBar.test.tsx` e `Frontend/src/test/styles/employeeMotion.test.ts`
**Depends on**: None
**Reuses**: tokens de `index.css`, regra `prefers-reduced-motion`
**Requirement**: NAV-03, NAV-04

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/components/employee src/test/styles/employeeMotion.test.ts src/test/utils`

**Done when**:

- [ ] O indicador é um único elemento posicionado por `transform: translateX` com transição de 250ms e `cubic-bezier(0.23, 1, 0.32, 1)`, na aba da rota atual
- [ ] `routeSection` devolve a seção e `maquinas/:id` pertence à seção `maquinas`
- [ ] Conteúdo com `animation` de 200ms (opacity e translateY 8px) reiniciada pela troca de seção, não por `maquinas/:id`
- [ ] `prefers-reduced-motion: reduce` anula transição e animação
- [ ] Gate passa

#### T3: Skeleton das telas do funcionário [P]

**What**: Criar `EmployeeSkeleton` com variantes por tela e usar `useFirstVisitLoading('employee-…')` em Visão geral, Empilhadeiras, Histórico, Sessão, Configurações e no sheet de ocorrência.
**Where**: `Frontend/src/components/employee/EmployeeSkeleton.tsx`, `EmployeeSkeleton.module.css`, `Frontend/src/pages/employee/*.tsx`, testes em `Frontend/src/test/components/employee/EmployeeSkeleton.test.tsx` e `Frontend/src/test/pages/employee/*.test.tsx`
**Depends on**: None
**Reuses**: `useFirstVisitLoading`, `resetVisitedPages`, `PageSkeleton` como modelo, `common.loading`
**Requirement**: NAV-05, NAV-06

**Tests**: component
**Gate**: quick - `cd Frontend && npx vitest run src/test/components/employee src/test/pages/employee`

**Done when**:

- [ ] Cada uma das 6 telas mostra skeleton com `aria-busy="true"` e `role="status"` com `common.loading` na primeira visita
- [ ] Segunda visita mostra o conteúdo sem skeleton
- [ ] O skeleton usa a mesma grade de colunas do conteúdo
- [ ] Sheet de ocorrência mostra os 4 campos em skeleton antes do formulário
- [ ] Testes existentes das telas seguem passando (atraso zero em modo de teste)
- [ ] Gate passa

### Phase 2: Fechamento

#### T4: Verificação a 390px e 1440px

**What**: Rodar o gate completo e conferir no navegador o atalho da sessão, a animação e o skeleton em 390px e 1440px.
**Where**: sem arquivos de código
**Depends on**: T1, T2, T3
**Reuses**: medição por `getBoundingClientRect`
**Requirement**: NAV-01, NAV-03, NAV-05

**Tests**: unit
**Gate**: full - `cd Frontend && npm run lint && npx tsc -b && npx vitest run && npm run build`

**Done when**:

- [ ] Barra de sessão visível em `/funcionario`, `/funcionario/maquinas` e `/funcionario/historico` com sessão ativa
- [ ] Círculo azul se move entre abas e o conteúdo entra com fade
- [ ] Skeleton visível na primeira visita de cada tela
- [ ] Só restam as 3 falhas antigas de `34 min`
- [ ] Gate passa

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
| T1 | 1 componente + espaço no layout | OK |
| T2 | 1 componente animado + 1 util | OK |
| T3 | 1 componente de skeleton usado por 6 telas | OK |
| T4 | Verificação | OK |

---

## Test Coverage Matrix

| Code layer | Required test type | Tasks |
| ---------- | ------------------ | ----- |
| SessionBar, TabBar, EmployeeSkeleton | component | T1, T2, T3 |
| Páginas do funcionário com skeleton | component | T3 |
| CSS de movimento e `routeSection` | unit | T2 |

---

## Gate Check Commands

| Gate | Command | When |
| ---- | ------- | ---- |
| quick | `cd Frontend && npx vitest run <arquivos da tarefa>` | Depois de cada tarefa |
| full | `cd Frontend && npm run lint && npx tsc -b && npx vitest run && npm run build` | T4 |
