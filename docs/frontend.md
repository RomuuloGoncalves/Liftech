# Estrutura e Arquitetura do Frontend (Liftech)

Este documento descreve as responsabilidades de cada diretório em `Frontend/src/`, as bibliotecas em uso e as convenções que o time já vem seguindo no código. `config/`, `services/`, `types/` e `utils/` ainda não existem no projeto, mas ficam mapeados aqui porque a estrutura já foi planejada para crescer nessa direção conforme as próximas páginas passarem a falar com a API.

---

## Estrutura atual (`Frontend/src/`)

```
src/
├── assets/         # Imagens estáticas (logo, hero, ícones)
├── components/
│   └── layout/     # Casca da aplicação: Sidebar e futuros componentes de layout
├── pages/          # Telas da aplicação (uma por rota)
├── routes/         # Definição de rotas com React Router
├── test/           # Testes, espelhando a estrutura de src/
├── App.tsx          # Shell da aplicação (monta layout + rotas)
└── main.tsx          # Bootstrap do React e do BrowserRouter
```

**Ainda não existem, mas estão reservados para quando a API entrar em jogo:**

| Pasta | Responsabilidade prevista |
| --- | --- |
| `src/config/` | Variáveis de ambiente e inicialização de bibliotecas externas |
| `src/services/` | Camada Axios de comunicação com o Backend |
| `src/types/` | Interfaces/tipos TypeScript compartilhados, espelhando o contrato da API |
| `src/utils/` | Funções utilitárias puras (formatação de datas, texto, cálculos) |

---

## Responsabilidades das pastas

### `src/components/`
Componentes visuais reutilizáveis da interface, organizados por domínio (hoje só `layout/`, para peças estruturais como a `Sidebar`). Conforme o design system crescer, componentes de UI mais genéricos (botões, cards, modais) devem ganhar sua própria subpasta aqui, no mesmo padrão.

Cada componente com CSS Modules leva um `.module.css` ao lado do `.tsx`, com o mesmo nome (ver a seção "Estilização" abaixo).

### `src/pages/`
Uma página por rota, montada em `routes/appRoutes.tsx`. Uma página orquestra os componentes visuais e, quando a camada de `services/` existir, as chamadas aos dados. Hoje `VisaoGeralPage`, `FrotaPage`, `EquipePage` e `AlertasPage` são placeholders que só marcam a existência da rota; o conteúdo real de cada uma é escopo de outras issues.

### `src/routes/`
Centraliza as rotas com `react-router-dom` em um único `<Routes>` (`appRoutes.tsx`). `App.tsx` monta esse roteador dentro do shell visual da aplicação; o `BrowserRouter` em si vive em `main.tsx`, fora de `App`, para manter `App.tsx` testável sem precisar reconfigurar o router a cada teste.

### `src/test/`
Espelha 1:1 a estrutura de `src/` (ex.: `test/components/layout/Sidebar.test.tsx` testa `components/layout/Sidebar.tsx`). Usa Vitest + Testing Library; ver "Testes" abaixo.

---

## Bibliotecas em uso

| Biblioteca | Para quê | Observações |
| --- | --- | --- |
| **React 19 + TypeScript** | Base da aplicação | `strict` mode do TS ligado via `tsconfig.app.json` |
| **Vite** | Build e dev server | `npm run dev`, `npm run build` (roda `tsc -b` antes de empacotar) |
| **react-router-dom** | Roteamento | Um `<Routes>` central em `routes/appRoutes.tsx`; `BrowserRouter` só em `main.tsx` |
| **lucide-react** | Ícones | Um componente React por ícone (`<FileText />`, `<Truck />` etc.). Só ícones: não inclui componentes de UI nem estilo. Decisão registrada em `.specs/STATE.md` (AD-001), para manter um único sistema de ícones em todo o app |
| **Vitest + Testing Library + jsdom** | Testes | `npm run test` roda tudo em modo não-interativo (`vitest run`) |
| **ESLint** | Lint | `npm run lint`; roda sobre o projeto inteiro |

Não há Tailwind nem outra lib de UI instalada (ver "Estilização" a seguir).

---

## Estilização

O projeto usa **CSS Modules**, não Tailwind. `index.css` concentra os tokens globais (cores, tipografia, espaçamento) como CSS custom properties (`--text`, `--bg`, `--border`, `--accent`, etc.) em `:root`, para reaproveitar em qualquer componente. Hoje só existe o tema claro: o bloco `@media (prefers-color-scheme: dark)` foi removido para acompanhar o Figma, que ainda não tem uma versão dark aprovada (decisão AD-003 em `.specs/STATE.md`).

Um componente com estilo próprio ganha um arquivo `NomeDoComponente.module.css` ao lado do `.tsx`, importado como `import styles from './NomeDoComponente.module.css'`. Isso dá escopo automático (sem colisão de nomes de classe entre componentes) sem precisar de nenhuma dependência extra. A `Sidebar` (`components/layout/Sidebar.tsx` + `Sidebar.module.css`) é a referência atual desse padrão.

---

## Testes

Convenção: todo arquivo de teste espelha o caminho do arquivo testado dentro de `src/test/` (ex.: `src/components/layout/Sidebar.tsx` → `src/test/components/layout/Sidebar.test.tsx`). Os testes usam `@testing-library/react` com `MemoryRouter` para qualquer componente que dependa de rota, e `fireEvent` para simular clique, teclado e resize.

`npm run test` executa a suíte inteira uma vez (sem watch); é o mesmo comando que roda no gate de build/lint antes de qualquer commit.

---

## Convenções gerais

- Componentes são sempre `React.FC` tipado, em arquivo próprio.
- Ícones vêm exclusivamente de `lucide-react` (ver tabela de bibliotecas acima).
- Decisões de arquitetura maiores (escolha de lib, mudança de tema, etc.) ficam registradas em `.specs/STATE.md`, não só no código. É esse histórico que explica por que uma escolha foi feita, quando isso não fica óbvio lendo o arquivo isolado.
