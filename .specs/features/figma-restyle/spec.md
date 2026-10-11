# Restyle conforme o Figma atualizado Specification

## Problem Statement

O Figma foi atualizado: o fundo de todas as telas virou `#FAFAFA` com cards brancos, os status passaram a usar as cores do Style Guide (cor a 25% sobre branco), os cards de acidente ganharam cabeçalho preenchido pelo nível de urgência, os botões de perigo e o modal de alerta usam vermelho sólido e a fonte é Host Grotesk. O front ainda usa fundo branco, cerca de 60 cores soltas em 25 arquivos CSS (verdes, azuis e vermelhos do Tailwind sem relação com o guide) e `system-ui`. A funcionalidade não mudou; só o visual.

## Goals

- [ ] As 13 cores do Style Guide existem como tokens em `index.css` e são a única fonte de cor do app.
- [ ] Nenhum arquivo CSS fora de `index.css` e das telas de auth declara cor em hexadecimal.
- [ ] Visão Geral, Frota, Equipe, Alertas e os modais batem com o Figma em cor de fundo, status, botões e cards de acidente, medido a 1440x900.
- [ ] O app inteiro usa Host Grotesk.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Seletor "Filiais", "Nome da companhia", ícone de exportar, página Feedback & Sugestões | Itens novos do Figma; dono pediu para ignorar (funcionalidade não mudou) |
| Página de Política e Privacidade | Dono pediu para não fazer ainda |
| Botão "?" e modal de explicação de categoria em Alertas | Funcionalidade nova, não existe no app |
| Botão "Enviar para manutenção" no detalhe de acidente | Funcionalidade nova |
| Popup "Alerta!" de acidente (círculo vermelho, frame 100:21063) | Funcionalidade nova; o diálogo de exclusão do app não tem frame no Figma e fica como está |
| Seção "Funcionário" (11 telas mobile) | Não existe versão mobile de funcionário no app |
| Telas "Descarte" e as marcadas "Não desenvolver" | Descartadas pelo dono no Figma |
| Controle de período no formato "Date: 14 Julho..." | Muda o componente (hoje `input type="date"` nativo); só as cores entram |
| Tema escuro | AD-003: só tema claro |
| Gradiente de auth, splash | Já batem com o Figma |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Escopo de telas | Todas as telas Admin que já existem no app | Resposta do dono | y |
| Fonte | Host Grotesk (Google Fonts, pesos 400-700) em `--sans` e `--heading`, com `system-ui` de fallback; Lexend e Inter saem do auth | Texto "Host Grotesk fonts" no Figma; resposta do dono | y |
| Itens novos do Figma | Ignorados | Resposta do dono | y |
| Cores do guide (valores) | `--blue #3A9CFF`, `--blue-bg rgba(58,156,255,.25)`, `--gray-border rgba(21,28,39,.1)`, `--gray-bg #FAFAFA`, `--white #FFF`, `--red #FF0000`, `--red-bg rgba(255,58,58,.25)`, `--yellow #E5D000`, `--yellow-bg rgba(255,245,139,.25)`, `--green #1E8021`, `--green-bg rgba(74,255,58,.25)`, `--black-title #181818`, `--black-text #4C4C4C` | Lidos no frame "Guide Style" (141:259) | y |
| Cores fora do guide, medidas nos frames | `--danger-solid #EF4444` (botões Excluir e Cancelar), `--urgency-critical #C84646`, `--urgency-high #D4773F`, `--urgency-medium #FFC415`, `--line #E3E4E5` (divisor do header), `--sidebar-line #EEEFF0` | O guide não cobre; valores são a cor dominante da região nos frames 88:272, 100:21063 e 100:17710 | n |
| Vermelho de texto | Textos de erro/negado seguem `--red` do guide; botões preenchidos usam `--danger-solid` | O Figma usa `#EF4444` nos botões, não o `#FF0000` do guide | n |
| Fundo de página vs card | `--bg` (branco) continua sendo a superfície de cards, modais e inputs; novo `--bg-page` (`#FAFAFA`) vira o fundo de `body`, `.app-main` e Header | Figma: fundo `#FAFAFA` em todas as telas, cards `#FFF` | y |
| Status da Visão Geral | Disponível = `--green-bg`/`--green`; Em uso = `--blue-bg`/`--blue`; Manutenção = `--yellow-bg`/`--yellow`; Offline = cinza atual | Figma 35:479; hoje Manutenção é vermelho | n |
| Categoria sem tipo no guide ("Desativadas" do Figma) | Categorias `custom` mantêm a cor escolhida pelo usuário | A cor é dado do usuário; o app não tem tipo "desativadas" | n |
| Caixa de ícone nos cards | Removida dos cards de Frota, Alertas e Equipe | Os frames novos não têm; é mudança de layout, não de função | n |
| Cabeçalho de acidente | Fundo = cor da urgência, texto branco; "Média" usa texto branco também | Figma 88:272 e 100:20173 | n |
| Verificação visual | Script com Chrome headless que lê o `getComputedStyle` das rotas a 1440x900 e compara com os valores desta spec | Sem Figma no CI; Chrome já existe na máquina | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Tokens do Style Guide e fonte ⭐ MVP

**User Story**: As a dono do produto, I want that o app use exatamente as cores e a fonte do Figma so that o front e o design não divirjam.

**Why P1**: Todo o resto depende dos tokens.

**Acceptance Criteria**:

1. The frontend SHALL declarar em `index.css` os 13 tokens do Style Guide com os valores da tabela de assumptions.
2. The frontend SHALL declarar em `index.css` os tokens `--danger-solid`, `--urgency-critical`, `--urgency-high`, `--urgency-medium`, `--line`, `--sidebar-line` e `--bg-page`.
3. The frontend SHALL carregar a fonte Host Grotesk no `index.html` e usá-la como primeira família de `--sans` e `--heading`.
4. The frontend SHALL NOT declarar cor em hexadecimal em nenhum arquivo `.css` além de `index.css`, `AuthLayout.module.css` e `AuthForm.module.css`.
5. The frontend SHALL NOT declarar `rgb()`/`rgba()` com canais diferentes de preto ou branco em nenhum `.css` além de `index.css`.

**Independent Test**: Teste Vitest que lê os `.css` do `src/` e confere (1) a (5).

---

### P1: Fundo de página e cores base

**User Story**: As a usuário, I want fundo cinza claro com cards brancos so that a hierarquia visual seja a do Figma.

**Why P1**: É a diferença mais visível entre o app e o Figma.

**Acceptance Criteria**:

1. WHEN qualquer rota interna (`/`, `/frota`, `/equipe`, `/alertas`) é renderizada a 1440x900 THEN the frontend SHALL exibir `body`, `.app-main` e o Header com fundo `rgb(250, 250, 250)`.
2. WHEN os cards de máquina, funcionário, setor, acidente e as seções de Frota/Equipe/Alertas são renderizados THEN the frontend SHALL exibir fundo `rgb(255, 255, 255)`.
3. The frontend SHALL exibir `h1` e títulos de card em `rgb(24, 24, 24)` e texto de corpo em `rgb(76, 76, 76)`.
4. The frontend SHALL exibir o divisor do Header em `#E3E4E5` e a borda direita da Sidebar em `#EEEFF0`.

**Independent Test**: Script Chrome headless lê `getComputedStyle(...).backgroundColor` por rota.

---

### P1: Status, chips e badges nas cores do guide

**User Story**: As a usuário, I want status coloridos como no Figma so that eu reconheça o estado da máquina de relance.

**Why P1**: Status é o elemento de cor mais frequente.

**Acceptance Criteria**:

1. WHEN uma máquina com status Disponível, Em uso ou Manutenção aparece num card da Visão Geral THEN the frontend SHALL exibir o badge com fundo/texto `--green-bg`/`--green`, `--blue-bg`/`--blue` ou `--yellow-bg`/`--yellow` respectivamente.
2. WHEN o chip de uma categoria `acidentes`, `ativas`, `manutencao` ou `disponiveis` aparece na Frota THEN the frontend SHALL exibir fundo `--red-bg`, `--blue-bg`, `--yellow-bg` ou `--green-bg` respectivamente, com texto e borda na cor sólida correspondente.
3. WHEN o detalhe da máquina mostra o status THEN the frontend SHALL exibir o pill com as mesmas cores do badge da Visão Geral; o pill "Crítico" usa `--red-bg` com borda `--red`.
4. WHERE a categoria é `custom` the frontend SHALL manter a cor escolhida pelo usuário.

**Independent Test**: Renderizar `MachineCard` e `FleetRow` e conferir a classe/variável aplicada; Chrome headless confere a cor computada.

---

### P2: Botões e modais

**User Story**: As a usuário, I want botões de ação com as cores do Figma so that perigo, confirmação e atenção sejam inconfundíveis.

**Why P2**: Mudança visual relevante, mas isolada em poucos componentes.

**Acceptance Criteria**:

1. The frontend SHALL exibir todo botão preenchido de exclusão ou cancelamento (`DialogButtons`, `Excluir categoria`, `Excluir Máquina`, botão excluir de Setor) com fundo `--danger-solid` e texto branco.
2. The frontend SHALL exibir todo botão primário (cadastrar, confirmar, editar, ícone de editar de Setor, avatar do Header) com fundo `--blue` e texto branco.
3. WHEN um card de Setor é renderizado THEN the frontend SHALL exibir os botões de excluir e editar como quadrados preenchidos (`--danger-solid` e `--blue`) com ícone branco.
4. The frontend SHALL exibir o fundo de overlay dos modais em `rgba(245, 245, 245, 0.55)` e a caixa do modal em branco.

**Independent Test**: Testes de componente conferem a classe de cada botão; Chrome headless confere as cores computadas.

---

### P2: Cards de acidente por urgência (Frota e Alertas)

**User Story**: As a administrador, I want cards de acidente coloridos pela urgência so that eu priorize os mais graves.

**Why P2**: Maior mudança de layout das telas; depende dos tokens.

**Acceptance Criteria**:

1. WHEN um card de acidente com urgência Crítica, Alta ou Média é renderizado THEN the frontend SHALL exibir o cabeçalho (nome e código) com fundo `--urgency-critical`, `--urgency-high` ou `--urgency-medium` e texto branco.
2. WHEN o mesmo card é renderizado THEN the frontend SHALL exibir o rótulo do nível de urgência na mesma cor do cabeçalho, sobre o corpo branco.
3. WHERE o card de acidente não recebe urgência (Frota hoje mostra "Urgente") the frontend SHALL usar `--urgency-critical`.
4. The frontend SHALL NOT alterar dados, ordenação, busca ou filtros dos cards.

**Independent Test**: Renderizar `FleetCard` com cada urgência e conferir a variável de cor.

---

### P3: Cards sem caixa de ícone

**User Story**: As a usuário, I want cards mais limpos como no Figma so that haja menos ruído visual.

**Why P3**: Ajuste fino de layout, risco de mexer em testes existentes.

**Acceptance Criteria**:

1. WHEN um card de Frota, Alertas, funcionário ou setor é renderizado THEN the frontend SHALL NOT exibir a caixa quadrada com o ícone à esquerda do nome.
2. The frontend SHALL manter o nome, o código, o botão de abrir detalhe e o menu ⋮ funcionando como hoje.

**Independent Test**: Testes de componente passam sem o ícone; teclado e leitor de tela continuam alcançando o botão do título.

---

## Edge Cases

- IF o Google Fonts não carregar THEN the frontend SHALL cair em `system-ui` sem quebrar o layout.
- WHEN a largura da janela está entre 640px e 1279px THEN the frontend SHALL manter fundo `--bg-page` e cards brancos (responsividade existente não muda).
- IF uma categoria `custom` usa uma cor muito clara THEN the frontend SHALL manter o texto legível usando o texto do chip atual (comportamento atual, sem mudança).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| RST-01 | P1 Tokens: AC1, AC2 | Execute | Pending |
| RST-02 | P1 Tokens: AC3 | Execute | Pending |
| RST-03 | P1 Tokens: AC4, AC5 | Execute | Pending |
| RST-04 | P1 Fundo: AC1, AC2 | Execute | Pending |
| RST-05 | P1 Fundo: AC3, AC4 | Execute | Pending |
| RST-06 | P1 Status: AC1, AC3 | Execute | Pending |
| RST-07 | P1 Status: AC2, AC4 | Execute | Pending |
| RST-08 | P2 Botões: AC1, AC2, AC3 | Execute | Pending |
| RST-09 | P2 Botões: AC4 | Execute | Pending |
| RST-10 | P2 Acidente: AC1, AC2, AC3, AC4 | Execute | Pending |
| RST-11 | P3 Ícone: AC1, AC2 | Execute | Pending |

**Coverage:** 11 total, 0 mapped to tasks, 11 unmapped ⚠️

---

## Success Criteria

- [ ] Script Chrome headless a 1440x900 confirma os valores computados das ACs de fundo, status e botões nas 4 rotas.
- [ ] `grep -E '#[0-9a-fA-F]{3,8}'` nos `.css` retorna só `index.css` e os 2 arquivos de auth.
- [ ] Suite de testes, lint e build passam.
