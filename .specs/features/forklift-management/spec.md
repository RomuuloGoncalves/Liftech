# Gestão de Empilhadeiras Specification

## Problem Statement

A aplicação Liftech precisa de uma API REST completa para gerenciar Empilhadeiras (Forklifts), possibilitando o controle e rastreio do maquinário, além de vincular dispositivos IoT e operadores às máquinas. Atualmente o projeto conta apenas com a arquitetura base para o Mongoose.

## Goals

- [ ] Implementar a API REST (Controller, Service, Repository) de Empilhadeiras baseada na estrutura limpa (AGX).
- [ ] Garantir o vinculo de operadores e dispositivos a empilhadeiras.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature     | Reason         |
| ----------- | -------------- |
| Gestão de Operadores | Pertence à feature própria (issue separada). |
| Gestão de Dispositivos | Pertence à feature própria. |
| Autenticação | Será implementado em uma camada superior de middleware após os CRUDs base estarem operacionais. |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default  | Rationale | Confirmed? |
| --------------------- | --------------- | --------- | ---------- |
| Arquitetura | Usar estrutura baseada no projetoAGX (`CoreRepository`, etc) | Exigido pelo usuário para padronizar o backend. | y |
| Validação de dados | Delegada ao Express Controller | Para falhar rápido antes de chegar no Service. | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: CRUD Base de Empilhadeiras ⭐ MVP

**User Story**: As a sistema, I want gerenciar empilhadeiras so that eu possa manter o inventário da frota.

**Why P1**: Função essencial do sistema Liftech para ter o controle principal de cada equipamento.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN a requisição de criação envia dados válidos THEN system SHALL criar a empilhadeira no MongoDB e retornar HTTP 201 com os dados.
2. IF a requisição falha validação THEN system SHALL retornar HTTP 400 com detalhes do erro.
3. WHEN a requisição de busca solicitar todas empilhadeiras THEN system SHALL retornar a lista com HTTP 200.
4. WHEN a requisição buscar uma empilhadeira específica por ID THEN system SHALL retornar os dados com HTTP 200 ou 404 se não existir.
5. WHEN a requisição atualizar uma empilhadeira THEN system SHALL persistir as alterações e retornar HTTP 200.
6. WHEN a requisição deletar uma empilhadeira THEN system SHALL excluir e retornar HTTP 200.
7. The system SHALL armazenar IDs de `dispositivoConectadoId` e `operadorConectadoId` como ObjectId na coleção.

**Independent Test**: Usar cURL/Postman chamando `POST /api/forklifts`, `GET /api/forklifts`, `PUT /api/forklifts/:id`, `DELETE /api/forklifts/:id`.

---

## Edge Cases

- IF id de busca for inválido (não for ObjectId) THEN system SHALL retornar 400 Bad Request.
- IF houver conflito de identificação (se for definido campo unique futuro) THEN system SHALL retornar 409 Conflict.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story       | Phase  | Status  |
| -------------- | ----------- | ------ | ------- |
| FORK-01      | P1: CRUD Base | Design | Pending |
| FORK-02      | P1: Regras de Validação Isoladas | Design | Pending |

**Coverage:** 2 total, 2 mapped to tasks, 0 unmapped

---

## Success Criteria

How we know the feature is successful:

- [ ] Todas as rotas CRUD de empilhadeiras respondem 200/201 em cenários de sucesso.
- [ ] A arquitetura espelha a base do `projetoAGX` mas usa os modelos e tipagens do Liftech.
