# Estrutura e Arquitetura do Frontend (Liftech)

Este documento descreve as responsabilidades de cada diretório em `Frontend/src/`, as bibliotecas em uso e as convenções que o time já vem seguindo no código. `services/` ainda não existe no projeto, mas ficam mapeados aqui porque a estrutura já foi planejada para crescer nessa direção conforme as próximas páginas passarem a falar com a API.

---

## Estrutura atual (`Frontend/src/`)

```
src/
├── assets/         # Imagens estáticas (logo, hero, ícones)
├── components/
│   ├── common/     # Peças genéricas: Modal, ConfirmDialog
│   ├── fleet/      # Kanban da Frota: FleetRow, FleetCard, CategoryFormModal, MachinePickerModal
│   ├── layout/     # Casca da aplicação: Sidebar, Header
│   ├── machines/   # Domínio de máquinas: MachineCard, NewMachinePanel, MachineDetailModal
│   └── team/       # Domínio de equipe e setores: cards e modais de funcionário e setor
├── data/           # Módulos de dados mock, um por domínio (machines.ts, team.ts, fleet.ts)
├── utils/          # Funções puras (format.ts: data, duração e horas com Intl)
├── pages/          # Telas da aplicação (uma por rota)
├── routes/         # Definição de rotas com React Router
├── test/           # Testes, espelhando a estrutura de src/
├── App.tsx          # Shell da aplicação (monta layout + rotas)
└── main.tsx          # Bootstrap do React e do BrowserRouter
```

**Ainda não existem, mas estão reservados para quando a API entrar em jogo:**

| Pasta | Responsabilidade prevista |
| --- | --- |
| `src/services/` | Camada Axios de comunicação com o Backend |

**Já existem, criadas pela feature de i18n:**

| Pasta | Conteúdo |
| --- | --- |
| `src/config/` | `i18n.ts` — inicialização do i18next (ver [i18n.md](./i18n.md)) |
| `src/hooks/` | `useLanguage.ts` — hook de troca e persistência de idioma |
| `src/types/` | `i18n.ts` — constante `VALID_LANGUAGES` e tipo `SupportedLanguage` |
| `src/locales/` | Arquivos JSON de tradução para os 7 idiomas suportados |

---

## Responsabilidades das pastas

### `src/components/`
Componentes visuais reutilizáveis da interface, organizados por domínio (hoje só `layout/`, para peças estruturais como a `Sidebar`). Conforme o design system crescer, componentes de UI mais genéricos (botões, cards, modais) devem ganhar sua própria subpasta aqui, no mesmo padrão.

Cada componente com CSS Modules leva um `.module.css` ao lado do `.tsx`, com o mesmo nome (ver a seção "Estilização" abaixo).

### `src/pages/`
Uma página por rota, montada em `routes/appRoutes.tsx`. Uma página orquestra os componentes visuais e, quando a camada de `services/` existir, as chamadas aos dados. `FrotaPage` (rota `/frota`) é o kanban horizontal da frota: uma linha por categoria, cards arrastáveis entre linhas, criação e exclusão de categorias e inclusão de máquinas sem categoria. `AlertasPage` (rota `/alertas`) lista um card por acidente do mock (reusa o `FleetCard` de acidente, com o nível de urgência derivado da causa via `ACCIDENT_URGENCY`), com busca por nome ou código da máquina, filtro de período e o `MachineDetailModal` na variante `alerts`. `VisaoGeralPage` (rota `/`) mostra o grid de máquinas, busca, filtro de status, o painel de cadastro e o detalhe da máquina com edição e exclusão. `EquipePage` (rota `/equipe`) tem as seções Funcionários e Setores, com busca, filtro de acesso, cadastro, edição, detalhe e exclusão; tudo sobre estado em memória.

### `src/data/`
Módulos de dados mock, um por domínio, usados enquanto o `Backend` ainda não expõe o endpoint equivalente. `machines.ts` é o primeiro: define o tipo `Machine` espelhando os schemas Mongo de `forklift`, `device` e `operator`, a lista de 16 máquinas de exemplo e a função `filterMachines` (busca por identificação/setor + filtro por status), os eventos de histórico (`MACHINE_EVENTS`, `eventsForMachine`) e `filterEvents` (tipo + período). `team.ts` faz o mesmo para `Employee` e `Sector`. `fleet.ts` guarda o modelo do quadro da Frota (`FleetCategory`: id, tipo, nome, cor e a lista ordenada de `machineIds`), a posição inicial (`initialBoard`) e todas as transformações como funções puras que devolvem um novo array (`moveMachine`, `removeMachine`, `addMachines`, `createCategory`, `deleteCategory`), além da validação do nome e da cor. Cada máquina fica em no máximo uma categoria; mover não altera o status da máquina. A ideia é que, quando a API existir, essa pasta vire uma camada fina de tipos e o `useState` que guarda a lista na página seja trocado por uma chamada em `services/`, sem mexer nos componentes que já consomem `Machine`.

### `src/components/machines/`
`MachineCard` renderiza um card da Visão Geral com os dados de uma `Machine` (nome, código, setor, endereço MAC, operador quando existir, status e tempo de sessão). `NewMachinePanel` é o formulário de cadastro aberto pelo botão "Cadastrar Máquina": um drawer lateral a partir de 768px e tela cheia abaixo disso, sem chamada de API (o submit só adiciona a máquina à lista em memória da página). Decisão registrada em `.specs/STATE.md` (AD-005). Com a prop `machine`, o mesmo painel vira "Editar Máquina". `MachineDetailModal` abre ao clicar num card (o título do card é um botão esticado sobre ele, para não aninhar botões): mostra status, código, MAC, setor, tempo de uso total, nome do dispositivo e o histórico de acidentes e de manutenção, com abas e filtro de período. O rodapé tem Editar e Excluir; enquanto o drawer de edição ou a confirmação de exclusão está aberto, o modal de detalhe sai da tela e volta ao fechar, para o Escape fechar só a camada de cima.

### `src/components/fleet/`
`FleetRow` é uma categoria do kanban: rótulo colorido com contador, busca própria, período (só na linha Acidentes, filtrando pela data do último acidente), "Excluir categoria" (só nas categorias criadas), cards com rolagem horizontal e o "+" que abre `MachinePickerModal` com as máquinas sem categoria. `FleetCard` muda os campos conforme o tipo da linha e é arrastável; o arrasto usa a API nativa de drag and drop do HTML (o id arrastado fica num `useRef` da `FrotaPage`), sem biblioteca. Como o drag nativo não funciona com teclado nem toque, o menu ⋮ do card oferece "Mover para" e "Remover da categoria" para o mesmo fluxo. `CategoryFormModal` cria a categoria (nome + cor das 7 prontas ou hex); o popover de cores usa `position: fixed` porque o `Modal` tem `overflow` e o cortaria. `MachineDetailModal` ganhou `variant="fleet"` (linhas Setor, Funcionário, Tempo Uso (Sessão), Nome Dispositivo; abas de reparos e alertas; sem Editar/Excluir).

### `src/components/common/`
`Modal` é a casca de diálogo (backdrop, Escape, `role="dialog"`, botão fechar) e aceita `badge` (ao lado do título) e `footer` (faixa inferior). A entrada do `Modal` é animada (fade do fundo e fade + escala da caixa). `PageSkeleton` é o estado de carregamento das páginas, nas variantes `grid`, `kanban` e `team`, com `aria-busy`, um "Carregando..." só para leitor de tela e a classe de grid da própria página, para não haver salto de layout. `Toast.tsx` exporta `ToastProvider` (montado em `main.tsx`) e `useToast().show(mensagem)`: avisos curtos no canto inferior direito, numa região `role="status"`/`aria-live="polite"`, que somem em 4 s ou no X; fora do provider o `show` é um no-op, então componentes continuam testáveis isolados. `ConfirmDialog` é a confirmação de exclusão sobre o `Modal`. `DialogButtons.module.css` guarda os botões Cancelar/Confirmar compartilhados.

### `src/components/team/`
`EmployeeCard` e `SectorCard` (área clicável separada das ações), `EmployeeFormModal` e `SectorFormModal` (cadastro e edição, validação no submit), `EmployeeInfoModal` e `SectorInfoModal` (somente leitura). `TeamForm.module.css` concentra o estilo dos campos.

### `src/hooks/`
`useFirstVisitLoading(chave)` devolve `true` só na primeira visita de cada página na sessão, por 600 ms (`MOCK_LATENCY_MS`), para mostrar o skeleton enquanto os dados ainda são mock. Nos testes o atraso é 0, e os testes de skeleton mocam o hook. Quando a API existir, o `loading` passa a vir da requisição e o `PageSkeleton` continua o mesmo.

### `src/utils/`
`format.ts` formata data do evento ("Dom, 14 setembro 2025"), data do alerta ("23 Janeiro 2026"), duração arredondada ao minuto e horas, sempre no idioma ativo via `Intl`.

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
| **i18next + react-i18next** | Internacionalização | 7 idiomas, recursos inline, persistência em `localStorage`. Ver [i18n.md](./i18n.md) |
| **lucide-react** | Ícones | Um componente React por ícone (`<FileText />`, `<Truck />` etc.). Só ícones: não inclui componentes de UI nem estilo. Decisão registrada em `.specs/STATE.md` (AD-001), para manter um único sistema de ícones em todo o app |
| **Vitest + Testing Library + jsdom** | Testes | `npm run test` roda tudo em modo não-interativo (`vitest run`) |
| **ESLint** | Lint | `npm run lint`; roda sobre o projeto inteiro |

Não há Tailwind nem outra lib de UI instalada (ver "Estilização" a seguir).

---

## Estilização

O projeto usa **CSS Modules**, não Tailwind. `index.css` concentra os tokens globais (cores, tipografia, espaçamento) como CSS custom properties (`--text`, `--bg`, `--border`, `--accent`, etc.) em `:root`, para reaproveitar em qualquer componente. Animações e transições usam CSS puro; uma regra global em `index.css` as desliga para quem ativa `prefers-reduced-motion`. Hoje só existe o tema claro: o bloco `@media (prefers-color-scheme: dark)` foi removido para acompanhar o Figma, que ainda não tem uma versão dark aprovada (decisão AD-003 em `.specs/STATE.md`).

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
