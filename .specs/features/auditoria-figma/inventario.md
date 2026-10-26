# Inventário do frontend × telas do Figma

Base: `Frontend/src`. Gerado para a auditoria (somente leitura). Mapa Figma → código é **provável**; os auditores confirmam.

## 1. Shell e rotas

- `App.tsx:8` — rotas "standalone" (sem Sidebar/Header): `/login`, `/login/colaborador`, `/solicitar-acesso`, `/funcionario/*`. Demais rotas usam `Sidebar` + `Header` (`App.tsx:22-30`).
- `routes/appRoutes.tsx:69-87`:

| Rota | Componente |
|---|---|
| `/` | `pages/VisaoGeralPage.tsx` |
| `/frota` | `pages/FrotaPage.tsx` |
| `/equipe` | `pages/EquipePage.tsx` |
| `/alertas` | `pages/AlertasPage.tsx` |
| `/login` | `pages/LoginPage.tsx` (`role="admin"`) |
| `/login/colaborador` | `pages/LoginPage.tsx` (`role="colaborador"`) |
| `/solicitar-acesso` | `pages/SolicitarAcessoPage.tsx` |
| `/solicitacoes` | `pages/SolicitacoesPage.tsx` (sem tela no Figma; fluxo admin de aprovar acessos) |
| `/funcionario` (layout) | `components/employee/EmployeeLayout.tsx` |
| `/funcionario` (index) | `pages/employee/EmployeeHomePage.tsx` |
| `/funcionario/maquinas`, `/funcionario/maquinas/:id` | `pages/employee/EmployeeMachinesPage.tsx` (`:id` abre `MachineDetailSheet`, linha 75) |
| `/funcionario/sessao` | `pages/employee/EmployeeSessionPage.tsx` |
| `/funcionario/historico` | `pages/employee/EmployeeHistoryPage.tsx` |
| `/funcionario/ocorrencia` | `pages/employee/EmployeeIncidentPage.tsx` → `IncidentSheet` |
| `/funcionario/configuracoes` | `pages/employee/EmployeeSettingsPage.tsx` |
| `*` | `pages/NotFoundPage.tsx` |

Rotas **inexistentes** referenciadas na UI: `/politicas-privacidade` (`components/layout/Sidebar.tsx:232`, cai no 404). Não há rota de splash nem de feedback.

## 2. Layout e componentes principais

Admin (layout):
- `components/layout/Sidebar.tsx` — nav (`:33-36`: Visão Geral, Frota, Equipe, Alertas), links temporários de auth (`:39-44`), seletor de filial (`:160`), empresa, botão "Feedback & Sugestões" **sem onClick** (`:219-230`), link de privacidade (`:232`).
- `components/layout/BranchSelector.tsx` — dropdown de filial com gerenciar/criar/editar/excluir (`:88-93`, `ConfirmDialog` `:320`).
- `components/layout/Header.tsx` — título por rota, idioma (`:22`), sino "Notificações" **sem ação** (`:112-114`), avatar, logout.

Comuns: `components/common/Modal.tsx`, `ConfirmDialog.tsx`, `Toast.tsx`, `PageSkeleton.tsx`.
Auth: `components/auth/AuthLayout.tsx`, `AuthField.tsx`.

Por página:
- Visão Geral (`pages/VisaoGeralPage.tsx`): busca + filtro status/setor (`:39-41`), `MachineCard`, `NewMachinePanel` para cadastrar (`:271`) e editar (`:294`, títulos em `components/machines/NewMachinePanel.tsx:60`), `MachineDetailModal` (`:281`), `ConfirmDialog` excluir (`:303`).
- Frota (`pages/FrotaPage.tsx`): kanban de categorias com drag (`:68-70`), `FleetRow`/`FleetCard`, diálogos (`:31-36`): `CategoryFormModal` (`:341`), `MachinePickerModal` (`:362`), `ConfirmDialog` (`:382`), `MachineDetailModal` variante `fleet` (`:405`).
- Equipe (`pages/EquipePage.tsx`): listas de funcionários (filtro de acesso `:43`) e setores; diálogos (`:30-35`): `EmployeeFormModal` (`:355`), `EmployeeInfoModal` (`:363`), `SectorFormModal` (`:365`), `SectorInfoModal` (`:374`), `ConfirmDialog` (`:376`).
- Alertas (`pages/AlertasPage.tsx`): busca + período (`:27-29`), detalhe via `MachineDetailModal` variante `alerts` (`:161`).
- `components/machines/MachineDetailModal.tsx` — abas acidente/manutenção por variante (`:30-45`), troca de status (`:151-162`), `StatusBadge`.
- Funcionário: `EmployeeHeader`, `TabBar` (3 abas: visão geral, máquinas, histórico — `TabBar.tsx:8-10`), `SessionBar`, `MachineListCard`, `MachineDetailSheet` (iniciar sessão `:41`), `IncidentSheet`, `BottomSheet`, `EmployeeSkeleton`.
- Configurações do funcionário: feedback só textarea sem envio (`EmployeeSettingsPage.tsx:67-76`), botão privacidade sem ação (`:78-80`).

Specs anteriores relevantes em `.specs/features/` (ex.: `visao-geral-maquinas`, `fleet-kanban`, `team-management`, `alerts-history`, `employee-screens`, `auth-figma-fidelity`, `branches-frontend`).

## 3. Mapa tela do Figma → rota/componente

Legenda: "?" = sem correspondente encontrado no código (candidata a NÃO IMPLEMENTADA, a confirmar).

### Admin — 01-autenticacao (4)
| PNG | Rota / componente provável |
|---|---|
| `01-splash.png` | ? (sem rota de splash) |
| `02-signup-administrador.png` | `/solicitar-acesso` → `SolicitarAcessoPage.tsx` |
| `03-login-administrador.png` | `/login` → `LoginPage.tsx` |
| `04-login-colaborador.png` | `/login/colaborador` → `LoginPage.tsx` |

### Admin — 02-visao-geral-maquinas (12)
| PNG | Rota / componente provável |
|---|---|
| `01-visao-geral.png` | `/` → `VisaoGeralPage.tsx` + `MachineCard.tsx` |
| `02-visao-geral-variante.png` | `/` (estado/variação; não verificado qual) |
| `03-detalhe-maquina.png` | `MachineDetailModal.tsx` (variante padrão) |
| `04-cadastrar-maquina.png` | `NewMachinePanel.tsx` (modo criar) |
| `05-editar-maquina.png` | `NewMachinePanel.tsx` (modo editar) |
| `06/07/08-gestao-da-frota-ativo-{1,2,3}.png` | Corrigido após auditoria: 06 = popover "Alertas Recentes" (sino `Header.tsx:112`, sem ação), 07 = modal Perfil (avatar `Header.tsx:116`, sem ação), 08 = popover Idioma (`Header.tsx:60-110`) |
| `09/10/11-trocar-de-filial-{1,2,3}.png` | `BranchSelector.tsx` (abrir / gerenciar / criar-editar, provável) |
| `12-modal-alert.png` | Modal "Alerta!" de acidente sobre a visão geral → **?** |

### Admin — 03-frota (8)
| PNG | Rota / componente provável |
|---|---|
| `01-gestao-da-frota.png` | `/frota` → `FrotaPage.tsx`, `FleetRow.tsx`, `FleetCard.tsx` |
| `02-criar-categoria.png` | `CategoryFormModal.tsx` |
| `03/04-selecionar-maquinas-{1,2}.png` | `MachinePickerModal.tsx` |
| `05-detalhe-maquina-padrao.png` | `MachineDetailModal.tsx` variante `fleet` |
| `06-detalhe-maquina-acidente.png` | idem, status acidente |
| `07-detalhe-maquina-manutencao.png` | idem, status manutenção |
| `08-detalhe-maquina-disponivel.png` | idem, status disponível |

### Admin — 04-equipe-e-setor (7)
| PNG | Rota / componente provável |
|---|---|
| `01-gestao-de-equipe-e-setor.png` | `/equipe` → `EquipePage.tsx`, `EmployeeCard.tsx`, `SectorCard.tsx` |
| `02-cadastrar-funcionario.png` / `03-editar-funcionario.png` | `EmployeeFormModal.tsx` |
| `04-detalhe-funcionario.png` | `EmployeeInfoModal.tsx` |
| `05-cadastrar-setor.png` / `06-editar-setor.png` | `SectorFormModal.tsx` |
| `07-detalhe-setor.png` | `SectorInfoModal.tsx` |

### Admin — 05-historico-de-alertas (3)
| PNG | Rota / componente provável |
|---|---|
| `01-historico-de-alertas.png` | `/alertas` → `AlertasPage.tsx` |
| `02-detalhe.png` | `MachineDetailModal.tsx` variante `alerts` (`AlertasPage.tsx:161`) |
| `03-modal-explicacao-categoria.png` | ? (nenhum modal de explicação encontrado) |

### Admin — 06-outros (2)
| PNG | Rota / componente provável |
|---|---|
| `01-feedback-e-sugestoes.png` | ? (botão em `Sidebar.tsx:219` sem ação/rota) |
| `02-politica-e-privacidade.png` | ? (`/politicas-privacidade` não registrada em `appRoutes.tsx`) |

### Funcionário (9)
| PNG | Rota / componente provável |
|---|---|
| `01-login-colaborador.png` | `/login/colaborador` → `LoginPage.tsx` (mesma tela de admin 04?) |
| `02-visao-geral.png` | `/funcionario` → `EmployeeHomePage.tsx` |
| `03/04-empilhadeiras-disponiveis-{1,2}.png` | `/funcionario/maquinas` → `EmployeeMachinesPage.tsx`, `MachineListCard.tsx` |
| `05-detalhe-empilhadeira.png` | `/funcionario/maquinas/:id` → `MachineDetailSheet.tsx` |
| `06-em-processo.png` | `/funcionario/sessao` → `EmployeeSessionPage.tsx`, `SessionBar.tsx` |
| `07-reportar-ocorrencia.png` | `/funcionario/ocorrencia` → `IncidentSheet.tsx` |
| `08-historico-de-empilhadeira.png` | `/funcionario/historico` → `EmployeeHistoryPage.tsx` |
| `09-configuracoes.png` | `/funcionario/configuracoes` → `EmployeeSettingsPage.tsx` |

### NÃO-DESENVOLVER (decisão do dono, não é pendência)
- `admin/nao-desenvolver/cadastrar-maquina.png`
- `admin/nao-desenvolver/editar-maquina.png`
- `funcionario/nao-desenvolver/empilhadeiras-disponiveis.png`

Total: 45 telas a auditar + 3 não-desenvolver = 48.

## 4. Candidatas a NÃO IMPLEMENTADA (a confirmar pelos auditores)
1. `admin/01-autenticacao/01-splash.png`
2. `admin/02-visao-geral-maquinas/06-08` (dropdown de alertas recentes no sino)
3. `admin/02-visao-geral-maquinas/12-modal-alert.png`
4. `admin/05-historico-de-alertas/03-modal-explicacao-categoria.png`
5. `admin/06-outros/01-feedback-e-sugestoes.png`
6. `admin/06-outros/02-politica-e-privacidade.png`
