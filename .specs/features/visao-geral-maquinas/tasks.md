# Task Breakdown: Visão Geral das Máquinas

## Implementation Tasks

- [ ] **Task 1: Design Tokens & Icon Setup**
  - Install `lucide-react` dependency in `Frontend/package.json`.
  - Add design tokens, custom easing variables (`--ease-out`, `--ease-in-out`), active scale utility (`.btn-press`), and typography reset to `Frontend/src/index.css`.
  - **Tests**: `Frontend/src/test/design-tokens.test.ts`
  - **Gate**: `cd Frontend && npm test`

- [ ] **Task 2: Machine Domain Types & Mock Data**
  - Create `Frontend/src/types/machine.ts` with `Machine` and `SupportedLanguage` types.
  - Create `Frontend/src/services/mockMachines.ts` with 16 default machines matching image metadata ("Empilhadeira Elétrica Titan-X", "EMP-084(ID)", "Expedição - Bloco B", "A:2C:99:B1:DF:7", "34 minutos").
  - **Tests**: `Frontend/src/test/mockMachines.test.ts`
  - **Gate**: `cd Frontend && npm test`

- [ ] **Task 3: Sidebar Component**
  - Implement `Frontend/src/components/layout/Sidebar.tsx`.
  - Render logo "Liftech", navigation links ("Visão Geral" active, "Gerenciamento Frota", "Gestão de Equipe", "Histórico de Alertas"), "Feedback & Sugestões" action button, and footer privacy links.
  - Add mobile responsive collapsible drawer support.
  - **Tests**: `Frontend/src/test/Sidebar.test.tsx`
  - **Gate**: `cd Frontend && npm test`

- [ ] **Task 4: Header & Language Selector Popover**
  - Implement `Frontend/src/components/layout/Header.tsx` and `Frontend/src/components/layout/LanguagePopover.tsx`.
  - Add title "Visão geral das máquinas", Globe icon trigger, Bell icon, User avatar icon.
  - Language popover opens with origin-aware scale (`scale(0.95)` to `scale(1)`), lists languages with radio buttons (Português, Inglês, Espanhol, Francês, Japonês, Alemão, Russo), supports `Escape` key close.
  - **Tests**: `Frontend/src/test/Header.test.tsx`
  - **Gate**: `cd Frontend && npm test`

- [ ] **Task 5: Control Bar & Filter Hook**
  - Implement `Frontend/src/hooks/useMachines.ts` for searching, filtering, and machine state updates.
  - Implement `Frontend/src/components/machines/ControlBar.tsx` with search input, sector/status dropdown filter, and "+ Cadastrar Máquina" blue button.
  - **Tests**: `Frontend/src/test/useMachines.test.ts`
  - **Gate**: `cd Frontend && npm test`

- [ ] **Task 6: Machine Grid & Machine Card Components**
  - Implement `Frontend/src/components/machines/MachineCard.tsx` with forklift icon, title, code ID, 3-dots menu, sector info, MAC address, status pill (`Disponível`), and session time (`34 minutos`).
  - Implement `Frontend/src/components/machines/MachineGrid.tsx` with responsive CSS Grid (4 cols wide desktop, 3 desktop, 2 tablet, 1 mobile) and staggered card entrance animations.
  - Add hover elevation transition (`translateY(-2px)`, shadow elevation).
  - **Tests**: `Frontend/src/test/MachineCard.test.tsx`
  - **Gate**: `cd Frontend && npm test`

- [ ] **Task 7: Modal Cadastrar Máquina**
  - Implement `Frontend/src/components/machines/RegisterMachineModal.tsx` modal dialog.
  - Provide input fields for Machine Name, Code/ID, Sector, MAC address, initial session time.
  - Add validation and submission logic to update the machine list dynamically.
  - **Tests**: `Frontend/src/test/RegisterMachineModal.test.tsx`
  - **Gate**: `cd Frontend && npm test`

- [ ] **Task 8: Page Assembly & Routing**
  - Create `Frontend/src/pages/VisaoGeralPage.tsx` assembling Sidebar, Header, ControlBar, MachineGrid, LanguagePopover, and RegisterMachineModal.
  - Wire up route in `Frontend/src/App.tsx` or router setup.
  - **Tests**: `Frontend/src/test/VisaoGeralPage.test.tsx`
  - **Gate**: `cd Frontend && npm test`
