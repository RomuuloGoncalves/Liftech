# Escala tipográfica única Specification

## Problem Statement

O front usa 25 tamanhos de fonte diferentes, de 6px a 64px. Os cards de Frota e Alertas mostram rótulos em 6–8px ao lado de status em 14px, os cards da Visão Geral misturam rótulos de 10px com títulos de 18px e durações de 20px, e a base do `:root` (18px) e os `h1`/`h2` (56px/24px) ainda são do template do Vite. O dono pediu harmonia entre os tamanhos.

## Goals

- [ ] Todo `font-size` do front usa um token de uma escala única de 8 passos.
- [ ] Nenhum texto renderizado abaixo de 11px em 1440px de largura.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Pesos, cores, espaçamentos | Pedido trata só de tamanho |
| Escala responsiva nova | A escala `--px` de Frota/Alertas continua como está |
| Tela 404 (`64px`) | Número decorativo, fora da hierarquia de texto |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Escala | `--fs-xs` 11, `--fs-sm` 12, `--fs-md` 13, `--fs-base` 14, `--fs-lg` 16, `--fs-xl` 18, `--fs-2xl` 24, `--fs-3xl` 32 (px) | Cobre os papéis já existentes (rótulo, meta, corpo, ênfase, título de card, título de seção, título de página, display de auth) com saltos legíveis | n |
| Piso de 11px | Tudo que hoje é 6–10.5px vira 11px ou mais | Abaixo de 11px o texto fica ilegível em tela comum | n |
| Telas de auth | Saem do tamanho exato do frame (8–10px) e entram na escala | Novo pedido do dono substitui a decisão "sem escalar" da spec `auth-figma-fidelity` | n |
| Frota/Alertas | Mantêm `calc(N * var(--px))`, com N trocado pelo passo da escala | Preserva o crescimento em telas largas; em 1440px resulta no token exato | n |
| Base global | `:root` 14px (`--fs-base`); `h1`→`--fs-2xl`, `h2`→`--fs-xl`; remove `code`/`.counter` sem uso | Restos do template do Vite | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Tamanhos harmônicos ⭐ MVP

**User Story**: As a usuário, I want textos com tamanhos consistentes so that a leitura seja confortável em todas as telas.

**Acceptance Criteria**:

1. The frontend SHALL declarar os tokens `--fs-xs`…`--fs-3xl` em `index.css`.
2. The frontend SHALL usar apenas esses tokens (ou `calc(N * var(--px))` com N igual a um passo da escala) em todo `font-size` dos arquivos CSS, exceto o número da tela 404.
3. WHEN qualquer página é renderizada a 1440x900 THEN the frontend SHALL exibir todo texto visível com tamanho computado entre 11px e 32px (exceto o número da 404).
4. The frontend SHALL exibir, nos cards de Visão Geral, Frota e Alertas, títulos maiores que valores e valores maiores ou iguais aos rótulos.

**Independent Test**: Script no navegador que lista os tamanhos computados de todos os textos visíveis em cada rota.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TYPE-01 | P1: AC1 | Execute | Pending |
| TYPE-02 | P1: AC2 | Execute | Pending |
| TYPE-03 | P1: AC3 | Execute | Pending |
| TYPE-04 | P1: AC4 | Execute | Pending |

**Coverage:** 4 total, 4 mapped, 0 unmapped
