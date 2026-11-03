# i18n completo Specification

## Problem Statement

O Frontend declara 7 idiomas, mas só pt-BR está completo. Em es, fr, de, ja e ru faltam 72 a 78 chaves, quase todas da área do funcionário (`employee.*`, cerca de 70 chaves); nesses idiomas o funcionário vê português pelo fallback. As chaves `machines.labelDeviceName` e `machines.newMachineSubtitle` só existem em pt-BR (faltam também em en-US). Além disso, 11 textos de interface (rótulos de acessibilidade, placeholder e mensagem de erro) estão escritos direto no JSX e nunca são traduzidos. O teste de estrutura de locales ignora a chave `employee`, por isso a lacuna passou despercebida.

## Goals

- [ ] Os 6 idiomas diferentes de pt-BR (en-US, es, fr, de, ja, ru) definem todas as chaves de pt-BR, incluindo `employee.*`.
- [ ] Um teste de paridade automático falha quando qualquer idioma perde uma chave de pt-BR ou muda os `{{placeholders}}`.
- [ ] Nenhum dos 11 textos fixos listados em I18N-04 a I18N-09 aparece literal no código de produção; todos passam por `t()`.
- [ ] Em pt-BR a interface renderiza exatamente os mesmos textos de hoje.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Bloco "DEV" da Sidebar (`TEMP_AUTH_LINKS`, "Simular alerta") | Existe só em desenvolvimento e será removido ou protegido por ambiente em outra entrega. |
| `placeholder="EMP-084"` e `placeholder="AA:BB:CC:DD:EE:FF"` em `NewMachinePanel` | São exemplos de formato, iguais em todos os idiomas. |
| `alt="Liftech"` e `aria-label="Liftech"` | Nome da marca, não se traduz. |
| `console.error('Falha ao carregar rota:', ...)` em `appRoutes.tsx` | Log para desenvolvedor, não texto de interface. |
| `DEFAULT_LAST_MACHINE` em `EmployeeHomePage.tsx` (máquina de exemplo fixa) | É dado inventado, não tradução; vira item separado. |
| Revisão das traduções por falante nativo | Não é verificável por teste; registrada como risco nas premissas. |
| Textos vindos do Backend (mensagens de erro da API) | O Backend responde em português; fora desta entrega. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quem escreve as traduções de es, fr, de, ja e ru | O worker de implementação (modelo de linguagem), sem revisão humana | Não há tradutor no projeto; as traduções existentes (módulos `machines`, `team`, etc.) já seguem esse caminho | n (registrar no validation.md que falta revisão nativa) |
| Vocabulário | Reaproveitar os termos que o mesmo idioma já usa nas chaves existentes (ex.: empilhadeira, setor, ocorrência, sessão) | Evita dois nomes para a mesma coisa dentro de um idioma | y |
| Chaves de plural (`_zero`, `_one`, `_two`, `_few`, `_many`, `_other`) | A paridade compara a chave base: cada idioma precisa de pelo menos uma variante de plural por chave base de pt-BR | Japonês só tem a categoria `other` e russo tem `few`/`many`; exigir os mesmos sufixos de pt-BR estaria errado | y |
| Chaves a mais em outro idioma além das de pt-BR | Permitidas apenas se forem variantes de plural | O russo hoje tem `_few` e `_many`, que são corretas | y |
| Valor igual ao de pt-BR numa tradução | Aceito; o teste não compara texto | Palavras como "Offline" são iguais em vários idiomas e um teste de cópia daria falso positivo | y |
| Textos de acessibilidade já em pt-BR | O texto novo de cada chave em pt-BR é igual ao literal de hoje | Garante que os testes e a interface em pt-BR não mudem | y |
| Nomes das chaves novas | Ficam nos módulos existentes (`common`, `navigation`, `machines`, `languages`), definidos em I18N-04 a I18N-09 | O teste `REQUIRED_MODULES` já exige esses módulos | y |
| Runtime de teste | Node 22.22.2 (`~/.nvm/versions/node/v22.22.2/bin`) | O `package.json` exige Node >= 20.19; o Node 20.18 padrão da máquina quebra o `jsdom` | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Funcionário vê a área do funcionário no próprio idioma ⭐ MVP

**User Story**: Como funcionário que usa o sistema em espanhol, francês, alemão, japonês ou russo, quero ver as telas da minha área traduzidas para ter o mesmo conteúdo que um usuário de pt-BR.

**Why P1**: É a maior lacuna: cerca de 70 chaves por idioma caem no português hoje.

**Acceptance Criteria**:

1. The system SHALL define, em cada um dos idiomas en-US, es, fr, de, ja e ru, toda chave folha de pt-BR (comparando a chave base de plural), em todos os módulos, inclusive `employee`.  <!-- ubiquitous -->
2. The system SHALL definir `machines.labelDeviceName` e `machines.newMachineSubtitle` em en-US, es, fr, de, ja e ru.  <!-- ubiquitous -->
3. The system SHALL manter, em cada valor traduzido, o mesmo conjunto de `{{placeholders}}` do valor de pt-BR da mesma chave.  <!-- ubiquitous -->
4. The system SHALL manter todo valor traduzido com pelo menos um caractere que não seja espaço.  <!-- ubiquitous -->
5. WHEN o idioma ativo é es, fr, de, ja ou ru THEN o `t()` de qualquer chave `employee.*` SHALL devolver o texto do idioma, não o de pt-BR.  <!-- event-driven -->

**Independent Test**: Rodar o teste de paridade; ele passa para os 6 idiomas. Trocar o idioma para `ja` e abrir `/funcionario` mostra textos em japonês.

---

### P1: Textos de acessibilidade e de erro seguem o idioma ⭐ MVP

**User Story**: Como usuário de leitor de tela em qualquer um dos 7 idiomas, quero que rótulos, placeholders e a mensagem de erro de rota apareçam no meu idioma.

**Why P1**: Hoje 11 textos ignoram o seletor de idioma.

**Acceptance Criteria**:

1. WHEN a `Sidebar` renderiza THEN ela SHALL obter via `t()` os rótulos "Abrir menu" (`common.openMenu`), "Fechar menu" (`common.closeMenu`) e "Navegação principal" (`navigation.mainLabel`), e o texto em pt-BR SHALL ser igual ao de hoje.  <!-- event-driven -->  (I18N-04)
2. WHEN o `Header` renderiza THEN ele SHALL obter via `t()` os rótulos "Selecionar idioma" (`languages.selectLabel`) e "Fechar seleção de idioma" (`languages.closeLabel`).  <!-- event-driven -->  (I18N-05)
3. WHEN a `VisaoGeralPage` renderiza THEN ela SHALL obter via `t()` os rótulos "Buscar máquina por identificação ou setor" (`machines.searchAriaLabel`) e "Filtrar máquinas por status" (`machines.statusFilterAriaLabel`).  <!-- event-driven -->  (I18N-06)
4. WHEN o `MachineCard` renderiza uma máquina THEN o botão de ações SHALL obter via `t('machines.moreActions', { name })` o rótulo "Mais ações para {{name}}", com `name` igual à identificação da máquina.  <!-- event-driven -->  (I18N-07)
5. WHEN o `NewMachinePanel` renderiza o campo de nome THEN o placeholder SHALL vir de `t('machines.phName')`, com o texto "Ex: Empilhadeira Elétrica Titan-X" em pt-BR.  <!-- event-driven -->  (I18N-08)
6. WHEN o `RouteErrorBoundary` exibe o erro THEN a mensagem SHALL vir de `common.routeLoadError` ("Ocorreu um erro ao carregar a página.") e o botão SHALL vir de `common.reload` ("Recarregar").  <!-- event-driven -->  (I18N-09)
7. WHILE o idioma ativo é pt-BR, cada um dos 11 textos acima SHALL ser renderizado igual ao literal que existia antes da mudança.  <!-- state-driven -->
8. The system SHALL definir as 11 chaves novas (`common.openMenu`, `common.closeMenu`, `common.routeLoadError`, `common.reload`, `navigation.mainLabel`, `languages.selectLabel`, `languages.closeLabel`, `machines.searchAriaLabel`, `machines.statusFilterAriaLabel`, `machines.moreActions`, `machines.phName`) nos 7 idiomas.  <!-- ubiquitous -->

**Independent Test**: Em en-US, `getByRole('navigation', { name: 'Main navigation' })` encontra a Sidebar; em pt-BR continua `Navegação principal`.

---

### P2: A lacuna não volta sem alguém perceber

**User Story**: Como desenvolvedora, quero que o CI local avise quando um idioma perde uma chave para não descobrir só em produção.

**Why P2**: Sem o teste a lacuna atual voltaria na próxima feature.

**Acceptance Criteria**:

1. The system SHALL cobrir no teste de estrutura de locales todos os módulos de pt-BR, sem exceção para `employee`.  <!-- ubiquitous -->
2. IF um idioma não tem uma chave base de pt-BR THEN o teste de paridade SHALL falhar e citar o idioma e a chave.  <!-- unwanted-behavior -->
3. IF um idioma muda o conjunto de `{{placeholders}}` de uma chave THEN o teste de paridade SHALL falhar e citar o idioma e a chave.  <!-- unwanted-behavior -->
4. IF um idioma tem uma chave que não existe em pt-BR e que não é variante de plural THEN o teste de paridade SHALL falhar e citar o idioma e a chave.  <!-- unwanted-behavior -->

**Independent Test**: Apagar `employee.home.title` de `es/translation.json` faz o teste falhar citando `es` e `employee.home.title`.

---

## Edge Cases

- IF uma chave de plural existe em pt-BR como `_one` e `_other` e o idioma só tem `_other` (japonês) THEN o teste de paridade SHALL aceitar.
- WHEN o russo traz `_few` e `_many` além de `_one` e `_other` THEN o teste de paridade SHALL aceitar essas variantes.
- IF uma chave nova é adicionada a pt-BR sem tradução nos outros 6 idiomas THEN o teste de paridade SHALL falhar.
- IF o `MachineCard` recebe uma identificação com caractere especial (aspas, `<`) THEN o rótulo SHALL conter a identificação sem escape duplo (o `escapeValue: false` do i18next já vale).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| I18N-01 | P1: Funcionário vê a área no próprio idioma (AC 1, 2, 5) | Tasks | Pending |
| I18N-02 | P1: Funcionário vê a área no próprio idioma (AC 3, 4) | Tasks | Pending |
| I18N-03 | P2: A lacuna não volta (AC 1 a 4) | Tasks | Pending |
| I18N-04 | P1: Textos de acessibilidade (Sidebar) | Tasks | Pending |
| I18N-05 | P1: Textos de acessibilidade (Header) | Tasks | Pending |
| I18N-06 | P1: Textos de acessibilidade (VisaoGeralPage) | Tasks | Pending |
| I18N-07 | P1: Textos de acessibilidade (MachineCard) | Tasks | Pending |
| I18N-08 | P1: Textos de acessibilidade (NewMachinePanel) | Tasks | Pending |
| I18N-09 | P1: Textos de acessibilidade (RouteErrorBoundary) | Tasks | Pending |
| I18N-10 | P1: Textos de acessibilidade (AC 7 e 8: pt-BR igual e 11 chaves nos 7 idiomas) | Tasks | Pending |

**Coverage:** 10 total, 10 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] `yarn test` do Frontend passa (125+ arquivos) com o teste de paridade cobrindo `employee` e os 6 idiomas.
- [ ] `yarn lint` e `tsc -b` passam sem erro novo.
- [ ] Contagem de chaves folha (comparada pela chave base de plural) é igual à de pt-BR em en-US, es, fr, de, ja e ru.
- [ ] `grep` pelos 11 literais em `src` (fora de `locales` e de `test`) não encontra nenhum.
