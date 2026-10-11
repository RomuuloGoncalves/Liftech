# Internacionalização (i18n) — Suporte de Idiomas

## Problem Statement

A aplicação Liftech exibe todos os textos hardcoded em Português. Não há mecanismo para o usuário trocar de idioma, embora o Header já apresente um seletor de idioma visual (sem efeito real). O sistema precisa de uma camada de internacionalização real com 7 idiomas, troca em tempo real e persistência da escolha — para atender usuários não falantes de Português e habilitar futuras expansões.

## Goals

- [ ] Instalar e configurar `react-i18next` como camada de i18n do Frontend
- [ ] Criar estrutura de arquivos de tradução para 7 idiomas sob `src/locales/`
- [ ] Converter todos os textos visíveis da aplicação para chaves de tradução
- [ ] Persistir o idioma escolhido em `localStorage` entre sessões
- [ ] Conectar o seletor de idioma existente no `Header` ao sistema real de i18n
- [ ] Cobertura de testes ≥ 80 % para os novos módulos (config i18n + hook + utilitários)

## Out of Scope

| Feature | Reason |
| ------- | ------- |
| Tradução do Backend / mensagens de erro de API | Escopo de backend, não desta issue |
| Detecção automática de idioma pelo browser (languagedetector) | A issue pede padrão fixo PT-BR; detecção automática não foi solicitada |
| Lazy-loading de arquivos de tradução | Aplicação pequena; sem risco de bundle size no horizonte atual |
| Validação de chaves faltantes em build/CI | Nice-to-have futuro; fora do prazo desta issue |
| Dark mode e outros temas visuais | Fora do escopo (AD-003) |
| Dropdown de notificações e perfil do Header | Fora do escopo (AD-004) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Idioma padrão | `pt-BR` | Explícito na issue | y |
| Estratégia de fallback | `pt-BR` | Issue: "Se idioma inválido, retornar fallback para PT-BR" | y |
| Namespace único ou múltiplos | Namespace único `translation` | Aplicação pequena; múltiplos namespaces adicionam complexidade sem benefício imediato | n (assumido) |
| Chave de `localStorage` | `liftech-lang` | Convencional; sem conflito com outras chaves existentes | n (assumido) |
| Tradução dos 6 idiomas não-PT | Usar Google Translate / DeepL como base; revisão manual fora de escopo | Issue menciona explicitamente ferramentas automáticas | y |
| Textos das páginas stub (Frota, Equipe, Alertas) | Converter placeholders existentes | Consistência; custo zero | n (assumido) |
| Onde fica o `I18nextProvider` | Wrapping em `main.tsx`, fora do `<BrowserRouter>` | Padrão react-i18next; sem restrição de routing | n (assumido) |
| `i18next-browser-languagedetector` | **Não instalar** (out of scope) | Issue pede padrão PT-BR fixo | y |

**Open questions:** none — todos resolvidos ou registrados acima.

---

## User Stories

### P1: Configuração base do i18n ⭐ MVP

**User Story**: Como desenvolvedor, quero que o `react-i18next` esteja instalado e inicializado na aplicação, para que todos os componentes possam acessar traduções via hook.

**Why P1**: Pré-requisito de tudo; nada mais funciona sem este passo.

**Acceptance Criteria**:

1. WHEN a aplicação é iniciada THEN o sistema SHALL carregar o namespace `translation` do idioma PT-BR sem erros no console.
2. The system SHALL definir `pt-BR` como idioma padrão e fallback na configuração do `i18next`.
3. IF `localStorage` não contém a chave `liftech-lang` THEN o sistema SHALL usar `pt-BR` como idioma ativo.
4. WHEN `i18next` é inicializado THEN o sistema SHALL completar a inicialização de forma síncrona (sem `Suspense` obrigatório), usando `initReactI18next` com `resources` inline.

**Independent Test**: Abrir a app no browser e verificar que nenhum erro de i18n aparece no console; `i18next.language` retorna `'pt-BR'`.

---

### P1: Estrutura de arquivos de tradução — 7 idiomas ⭐ MVP

**User Story**: Como desenvolvedor, quero arquivos `translation.json` para cada idioma suportado, com todas as chaves da aplicação preenchidas, para que o sistema exiba textos corretos em qualquer idioma selecionado.

**Why P1**: Sem as traduções, o seletor de idioma não tem efeito visível.

**Acceptance Criteria**:

1. The system SHALL conter arquivos de tradução para exatamente 7 locales: `pt-BR`, `en-US`, `es`, `fr`, `ja`, `de`, `ru`.
2. The system SHALL organizar as chaves em módulos: `common`, `navigation`, `machines`, `languages`.
3. WHEN um idioma é selecionado THEN o sistema SHALL exibir todos os textos visíveis da UI traduzidos para o idioma correspondente, sem chaves `[object Object]` ou placeholders `key.missing` visíveis ao usuário.
4. IF uma chave não existe no idioma selecionado THEN o sistema SHALL fazer fallback para a tradução PT-BR da mesma chave.

**Independent Test**: Selecionar "Inglês" no popover; todos os rótulos visíveis mudam para inglês; nenhum texto exibe a chave crua.

---

### P1: Hook `useLanguage` e persistência em localStorage ⭐ MVP

**User Story**: Como usuário, quero que minha escolha de idioma seja lembrada quando eu fechar e reabrir o browser, para não precisar reconfigurar a cada visita.

**Why P1**: Persistência é critério de aceitação explícito da issue.

**Acceptance Criteria**:

1. WHEN o usuário seleciona um idioma via `changeLanguage(code)` THEN o sistema SHALL atualizar `i18next.language` imediatamente na mesma renderização.
2. WHEN o usuário seleciona um idioma THEN o sistema SHALL escrever o código do idioma na chave `liftech-lang` em `localStorage`.
3. WHEN a aplicação é iniciada e `localStorage['liftech-lang']` contém um código de idioma válido THEN o sistema SHALL carregar a aplicação já no idioma persistido.
4. IF `localStorage['liftech-lang']` contém um código não reconhecido pela lista dos 7 idiomas THEN o sistema SHALL ignorar o valor e usar `pt-BR`.
5. The system SHALL expor a API `{ language: string; changeLanguage: (code: string) => void; languages: LanguageOption[] }` via `useLanguage()`.

**Independent Test**: Selecionar "Japonês" → fechar aba → reabrir; a UI carrega em japonês.

---

### P1: Integração com `Header` — seletor funcional ⭐ MVP

**User Story**: Como usuário, quero clicar em um idioma no popover do Header e ver todos os textos da aplicação mudarem imediatamente, sem recarregar a página.

**Why P1**: É o ponto de entrada de toda a funcionalidade de troca de idioma.

**Acceptance Criteria**:

1. WHEN o usuário clica em um idioma no popover do Header THEN o sistema SHALL chamar `changeLanguage(code)` e fechar o popover.
2. WHEN o idioma muda THEN o sistema SHALL re-renderizar todos os componentes que usam `useTranslation()` sem recarregar a página.
3. WHILE um idioma está selecionado THEN o sistema SHALL exibir o radio button do idioma ativo como marcado (`aria-checked="true"`).
4. WHEN o popover de idioma abre THEN o sistema SHALL exibir os nomes dos idiomas **no idioma atual da UI** (ex: em Japonês, "日本語" para japonês).

**Independent Test**: Trocar para "Alemão" no Header; título da página, labels do sidebar, textos da grid — tudo muda para alemão sem F5.

---

### P1: Conversão de textos hardcoded ⭐ MVP

**User Story**: Como desenvolvedor, quero que todos os textos visíveis aos usuários usem chaves de tradução via `t('key')`, para que o sistema de i18n tenha efeito em toda a aplicação.

**Why P1**: Sem converter os textos, o sistema de i18n não tem impacto visual.

**Acceptance Criteria**:

1. The system SHALL converter todos os textos visíveis dos componentes: `Sidebar`, `Header`, `VisaoGeralPage`, `MachineCard`, `NewMachinePanel`, páginas stub (`FrotaPage`, `EquipePage`, `AlertasPage`, `NotFoundPage`).
2. WHEN um texto é convertido para chave de tradução THEN o sistema SHALL manter o comportamento visual idêntico ao PT-BR original.
3. The system SHALL não deixar nenhuma string literal em Português hardcoded em JSX nos componentes convertidos (exceto meta-dados de teste ou comentários).

**Independent Test**: `grep -r "Visão Geral\|Cadastrar Máquina\|Buscar máquina" src/components src/pages` retorna zero resultados em JSX.

---

### P2: Testes automatizados do sistema i18n

**User Story**: Como desenvolvedor, quero testes automatizados cobrindo a configuração, o hook e a persistência, para ter confiança em fazer mudanças sem quebrar o i18n.

**Why P2**: A issue exige cobertura mínima de 80 %; fundamental para CI saudável.

**Acceptance Criteria**:

1. WHEN o suite de testes é executado THEN o sistema SHALL passar todos os testes sem erros, mantendo os 47 testes existentes intactos.
2. The system SHALL conter testes para: carregamento do i18n com idioma padrão PT-BR; `changeLanguage` atualiza `i18next.language`; `changeLanguage` persiste em `localStorage`; inicialização com idioma inválido cai para PT-BR; fallback de chave ausente retorna string PT-BR.
3. The system SHALL atingir cobertura ≥ 80 % nas linhas de `src/config/i18n.ts`, `src/hooks/useLanguage.ts`.

**Independent Test**: `yarn vitest run --coverage` mostra ≥ 80 % nos módulos novos; `yarn vitest run` mantém todos os testes passando.

---

## Edge Cases

- IF o usuário manipula `localStorage['liftech-lang']` para um valor inválido (ex: `"zz"`) THEN o sistema SHALL silenciosamente usar `pt-BR` sem lançar exceção.
- IF a aba é duplicada (novo contexto de `localStorage`) THEN o sistema SHALL ler a preferência de idioma do `localStorage` da nova aba corretamente.
- WHEN a chave de tradução referencia interpolação (ex: `{{count}} máquinas`) THEN o sistema SHALL renderizar o valor interpolado corretamente e não expor `{{count}}` ao usuário.
- IF um arquivo `translation.json` de um idioma não-PT-BR está incompleto THEN o sistema SHALL renderizar a chave PT-BR correspondente (fallback) em vez da chave crua.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| I18N-01 | P1: Config base i18n | Design | Pending |
| I18N-02 | P1: Config base i18n | Design | Pending |
| I18N-03 | P1: Config base i18n | Design | Pending |
| I18N-04 | P1: Config base i18n | Design | Pending |
| I18N-05 | P1: Estrutura de traduções | Design | Pending |
| I18N-06 | P1: Estrutura de traduções | Design | Pending |
| I18N-07 | P1: Estrutura de traduções | Design | Pending |
| I18N-08 | P1: Estrutura de traduções | Design | Pending |
| I18N-09 | P1: Hook useLanguage | Design | Pending |
| I18N-10 | P1: Hook useLanguage | Design | Pending |
| I18N-11 | P1: Hook useLanguage | Design | Pending |
| I18N-12 | P1: Hook useLanguage | Design | Pending |
| I18N-13 | P1: Hook useLanguage | Design | Pending |
| I18N-14 | P1: Integração Header | Design | Pending |
| I18N-15 | P1: Integração Header | Design | Pending |
| I18N-16 | P1: Integração Header | Design | Pending |
| I18N-17 | P1: Integração Header | Design | Pending |
| I18N-18 | P1: Conversão textos | Design | Pending |
| I18N-19 | P1: Conversão textos | Design | Pending |
| I18N-20 | P1: Conversão textos | Design | Pending |
| I18N-21 | P2: Testes automatizados | - | Pending |
| I18N-22 | P2: Testes automatizados | - | Pending |
| I18N-23 | P2: Testes automatizados | - | Pending |

**Coverage:** 23 total, 0 mapped to tasks, 23 unmapped ⚠️

---

## Success Criteria

- [ ] `yarn vitest run` passa com todos os testes (≥ 47 existentes + novos) sem erros
- [ ] Trocar o idioma no Header muda **todos** os textos visíveis na mesma renderização, sem recarregar a página
- [ ] Recarregar a página mantém o idioma selecionado na sessão anterior
- [ ] Nenhuma string em Português hardcoded permanece em JSX nos componentes convertidos
- [ ] Build de produção (`yarn build`) conclui sem erros de TypeScript ou Vite
