# Categorias da Frota e status da máquina Context

**Gathered:** 2026-10-15
**Spec:** `.specs/features/fleet-categories/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Status da máquina gravado no backend e mudado por leitura do dispositivo (impacto vira alerta) ou à mão; categorias da Frota persistidas por empresa e ligadas a status, com movimento automático na mudança de status, trava por máquina e movimento manual livre. Inclui a Frota lendo a API e o selo de status em todo card.

---

## Implementation Decisions

### Categoria x status

- Status é o estado da máquina (disponível, em uso, manutenção, alerta, offline), definido pelo hardware: o dispositivo manda leituras e o backend decide (impacto acima do limite vira alerta).
- A pessoa também ajusta o status à mão (ex.: encerrar um alerta).
- Categoria é uma coluna do kanban; cada uma pode estar ligada a status. Quando o status muda, a máquina vai para a coluna ligada a ele.
- A pessoa move cards à mão para qualquer coluna sem mudar o status.
- Cada máquina tem uma trava: travada, fica na coluna mesmo com status novo; destravada, move sozinha.
- Nome igual entre categoria e status é permitido; a proteção contra confusão é o selo de status sempre visível no card, com cor própria.

### Dono do quadro

- As categorias são da empresa, para que as filiais não tenham kanbans diferentes.
- A exibição mostra só as máquinas da filial ativa; a matriz (escopo empresa) vê todas com "Todas as filiais".

### Permissões

- Só escopo empresa cria, renomeia, recolore e exclui categorias.
- Qualquer admin move as máquinas do seu escopo entre as categorias existentes.

### Status

- Gravado na máquina e mudado por evento (leitura do dispositivo ou ajuste manual).
- Esta feature traz a regra de impacto e a troca manual. Rotas de sessão e de ocorrência do funcionário ficam para a feature seguinte.

### Quadro inicial

- Cada empresa começa com Acidentes, Ativas, Manutenção e Disponíveis (Figma), ligadas a alerta, em uso, manutenção e disponível; as máquinas entram pela regra.

### Agent's Discretion

- Formato das rotas, códigos de status sem acento, campos novos no schema e scripts de migração.

### Declined / Undiscussed Gray Areas → Assumptions

- Precedência entre status, fonte de cada status, quem marca manutenção, regras de nome e cor, concorrência e destaque do card: registrados em Assumptions do spec.

---

## Specific References

- Frames da Frota no Figma (linhas Acidentes, Ativas, Manutenção, Disponíveis e cores atuais de `data/fleet.ts`).
- Gerenciamento de filiais (`branches-model`, `branches-frontend`) como molde de permissão e de CRUD.

---

## Deferred Ideas

- Rotas de iniciar/encerrar sessão e de registrar ocorrência, ligando a área do funcionário ao status (feature seguinte, decisão do dono).
- Offline por heartbeat de telemetria.
- Reordenar categorias e máquinas.
