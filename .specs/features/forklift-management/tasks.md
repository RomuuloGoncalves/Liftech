# Tasks: Gestão de Empilhadeiras

## Test Coverage Matrix

> Generated from codebase - strong defaults applied for new tests since vitest is configured.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Service | unit | All branches; 1:1 to spec ACs; all listed edge cases | `Backend/src/feature/**/__tests__/*.test.ts` | `yarn test` |
| Controller/Router | integration | All routes: happy + edge + error | `Backend/src/feature/**/__tests__/*.test.ts` | `yarn test` |
| Repository / Core | none | - (build gate only) | - | `yarn build` |

## Gate Check Commands

> Generated from codebase.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `yarn test` |
| Full | After tasks with e2e/integration tests | `yarn test` |
| Build | After phase completion or config/entity-only tasks | `yarn tsc --noEmit` |

---

## Execution Plan

Phase 1 (Implementation) is complete.
Phase 2 (Testing) will backfill the missing test coverage.

### Phase 1: Implementation (Concluída)

```
T1 → T3
T2 → T3
T3 → T4
T4 → T5
T5 → T6
```

### Phase 2: Testing

```
T4 → T7
T5 → T8
T7 → T8
```

---

## Task Breakdown

### T1: Implementar coreRepository

**What**: Criar classe abstrata `RepositoryBase` baseada no AGX
**Where**: `Backend/src/core/coreRepository.ts`
**Depends on**: None
**Reuses**: None
**Requirement**: FORK-01

**Done when**:
- [x] Arquivo compila sem erros
- [x] Gate check passes: `yarn tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T2: Atualizar forkliftModel

**What**: Estender `coreModel` e implementar método `obterDados()`
**Where**: `Backend/src/models/forkliftModel.ts`
**Depends on**: None
**Reuses**: None
**Requirement**: FORK-01

**Done when**:
- [x] Arquivo compila sem erros
- [x] Gate check passes: `yarn tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T3: Criar forkliftRepository

**What**: Estender `RepositoryBase` tipando para `forkliftModel`
**Where**: `Backend/src/feature/forklift/forkliftRepository.ts`
**Depends on**: T1, T2
**Reuses**: None
**Requirement**: FORK-01

**Done when**:
- [x] Arquivo compila sem erros
- [x] Gate check passes: `yarn tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T4: Criar forkliftService

**What**: Implementar métodos de negócio e tratamento de erros
**Where**: `Backend/src/feature/forklift/forkliftService.ts`
**Depends on**: T3
**Reuses**: None
**Requirement**: FORK-01

**Done when**:
- [x] Arquivo compila sem erros
- [x] Gate check passes: `yarn tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T5: Criar forkliftController

**What**: Implementar funções CRUD manipulando Request e Response
**Where**: `Backend/src/feature/forklift/forkliftController.ts`
**Depends on**: T4
**Reuses**: None
**Requirement**: FORK-01

**Done when**:
- [x] Arquivo compila sem erros
- [x] Gate check passes: `yarn tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T6: Criar forkliftRouter

**What**: Configurar rotas HTTP
**Where**: `Backend/src/feature/forklift/forkliftRouter.ts`
**Depends on**: T5
**Reuses**: None
**Requirement**: FORK-01

**Done when**:
- [x] Arquivo compila sem erros
- [x] Gate check passes: `yarn tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T7: Adicionar Testes Unitários no Service

**What**: Criar suite de testes para as regras de negócio do `forkliftService` usando mocks do repository
**Where**: `Backend/src/feature/forklift/__tests__/forkliftService.test.ts`
**Depends on**: T4
**Reuses**: None
**Requirement**: FORK-01

**Done when**:
- [x] Testes cobrem todos os fluxos de sucesso e falha do serviço
- [x] Conflito de identificação (409 logic) é testado
- [x] Gate check passes: `yarn test`

**Tests**: unit
**Gate**: quick

---

### T8: Adicionar Testes de Integração no Controller

**What**: Criar suite de testes para as rotas simulando Req/Res sem subir servidor
**Where**: `Backend/src/feature/forklift/__tests__/forkliftController.test.ts`
**Depends on**: T5, T7
**Reuses**: None
**Requirement**: FORK-01

**Done when**:
- [x] Testes cobrem todos os HTTP status codes esperados (200, 201, 400, 404, 409)
- [x] Gate check passes: `yarn test`

**Tests**: integration
**Gate**: full

---

### T9: Instalar Dependências de Validação

**What**: Adicionar as dependências `request-check` e `@zarco/isness`
**Where**: `Backend/package.json`
**Depends on**: None
**Reuses**: None
**Requirement**: FORK-02

**Done when**:
- [ ] Dependências instaladas (yarn add)
- [ ] Gate check passes: `yarn tsc --noEmit`

**Tests**: none
**Gate**: build

---

### T10: Implementar forkliftRules e acoplar ao Controller

**What**: Criar arquivo exclusivo para as regras de validação da feature (ao invés de poluir o controller diretamente) e substituir a validação manual do controller.
**Where**: `Backend/src/feature/forklift/forkliftRules.ts` e `Backend/src/feature/forklift/forkliftController.ts`
**Depends on**: T9
**Reuses**: Padrão do projetoAGX adaptado para arquivos isolados
**Requirement**: FORK-02

**Done when**:
- [ ] `forkliftRules.ts` exporta instância configurada do `request-check`
- [ ] Controller importa `regras` e utiliza `regras.check(corpo)`
- [ ] Testes do Controller ajustados para validação em formato estruturado
- [ ] Gate check passes: `yarn test`

**Tests**: integration
**Gate**: full
