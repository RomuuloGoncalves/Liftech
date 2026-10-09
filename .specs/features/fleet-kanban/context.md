# Gerenciamento da Frota (Kanban) Context

**Gathered:** 2026-10-02
**Spec:** `.specs/features/fleet-kanban/spec.md`
**Status:** Aguardando aprovação da spec

---

## Feature Boundary

Página `/frota` em kanban horizontal: linhas = categorias, cards = máquinas. Mover cards entre linhas, criar/excluir categorias, adicionar máquinas sem categoria, abrir o detalhe. Dados em memória.

---

## Implementation Decisions

### Categoria x status

- O status é fixo da máquina (Disponível, Manutenção, Em uso, Offline...). A categoria só diz em que linha do kanban a máquina aparece.
- Pertencimento manual: o status define só a posição inicial; depois o gestor arrasta ou usa o "+".
- Mover entre categorias não altera o status.
- Cada máquina fica em no máximo uma categoria.

### Botões "+"

- "+" dentro da linha: adiciona máquinas que não estão em nenhuma categoria ("Selecione as máquinas").
- "+" fora das linhas (e "Cadastrar categoria"): cria categoria ("Criar Categoria").

### Última linha do Figma

- A linha "Todas" vazia com "Excluir categoria" é só o exemplo de uma categoria recém-criada.

### Agent's Discretion

- Demais escolhas registradas como assumptions `n` na spec (conteúdo do card por linha, filtros, menu ⋮ como alternativa ao arrasto, validação do nome, cores).

---

## Specific References

- Frames: "Frota(Gestão da Frota)", "Frota(Gestão da Frota - Criar Categoria)", "Frota(Gestão da Frota - Selecionar Máquinas)" x2, "Frota(Detalhe Máquina)".
- Detalhe da máquina: reaproveitar `MachineDetailModal`.

---

## Deferred Ideas

- Reordenar cards dentro da linha.
- Editar categoria.
- Seletor de Filiais.
