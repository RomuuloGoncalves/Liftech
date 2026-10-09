# Fidelidade ao Figma nas telas de autenticação Specification

## Problem Statement

As telas `/login` (admin), `/login/colaborador` e `/solicitar-acesso` já existem, mas o layout difere do Figma: conteúdo alinhado à esquerda, fundo branco, inputs cinza, links sem negrito, botão secundário largo e painel azul sem cantos arredondados nem timeline centralizada. O dono quer as três telas iguais aos frames do Figma (imagens anexadas na conversa de 2026-10-02).

## Goals

- [ ] As três telas reproduzem os frames do Figma em 1440x900.
- [ ] Comportamento atual (validação, navegação, mensagem de sucesso) continua igual.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Ação real de "Esqueceu a senha?" | Sem frame no Figma |
| Integração com API | Telas mockadas |
| Layout mobile específico | Sem frame no Figma; só não pode quebrar |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Medidas | Lidas das imagens 1440x900 anexadas (sem acesso ao arquivo Figma) | Não há URL do Figma | n |
| Fonte | Inter para textos, Lexend para placeholders, via Google Fonts, só nas telas de auth | SF Pro não é distribuível; Inter é o equivalente mais próximo | n |
| Tamanhos de texto | Os do frame (8 a 32px), sem escalar | O dono pediu "exatamente igual" | y |
| "Ja tem cadastro?" | Mantém "Já" com acento | Erro de digitação no frame | n |
| Ícones dos cards | `lucide-react` preenchidos em azul | AD-001: um único sistema de ícones | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Telas iguais ao Figma ⭐ MVP

**User Story**: As a dono do produto, I want the auth screens to match the Figma frames.

**Why P1**: É o pedido central.

**Acceptance Criteria**:

1. WHEN the user opens `/login` or `/login/colaborador` THEN the system SHALL render logo, title, subtitle and form centered on a `#f4f4f4` background, with a 311px-wide form.
2. WHEN a login link is rendered ("Colaborador? Clique aqui!", "Administrador? Clique aqui!", "Esqueceu a senha? Clique aqui") THEN the system SHALL show the text after the question mark in bold.
3. WHEN the user opens `/solicitar-acesso` THEN the system SHALL render the form centered in the left half and a rounded gradient panel on the right with logo, title, subtitle and three cards on a timeline.
4. WHEN the user submits a form THEN the system SHALL keep the existing validation and navigation behavior.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AUTHUI-01 | P1: AC1 | Execute | Done |
| AUTHUI-02 | P1: AC2 | Execute | Done |
| AUTHUI-03 | P1: AC3 | Execute | Done |
| AUTHUI-04 | P1: AC4 | Execute | Done |
