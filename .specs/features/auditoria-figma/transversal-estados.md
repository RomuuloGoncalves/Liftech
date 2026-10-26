# Auditoria transversal: estados e responsivo

Escopo: as 48 telas de `figma-telas/` (sem `nao-desenvolver/`) contra `Frontend/src`. Somente leitura.
Abri 16 PNGs: signup, login admin, alerta de acidente, cadastrar máquina, sino/alertas recentes, troca de filial 3, seleção de máquinas, cadastrar funcionário, modal de nível crítico, feedback, dashboard (02-variante) e, no funcionário, em-processo, ocorrência, configurações, detalhe e lista de máquinas.
As outras 32 não foram abertas, então tudo que digo sobre "o Figma não mostra X" vale só para as 16 que vi (**não verificado** nas demais).

## 1. Conclusão geral

- **O Figma não desenha estados.** Nas telas que vi não há skeleton, erro de rede, estado vazio, toast, campo inválido, botão desabilitado ou carregando, nem hover/foco.
  Tudo isso é decisão do app, sem referência visual. Não é divergência, mas não há como validar fidelidade.
- **O Figma não tem responsivo.** Admin é desktop 1440×900 (ex.: `admin/02.../01-visao-geral.png`). Funcionário é mobile 393×~850 (ex.: `funcionario/06-em-processo.png`).
  Nenhum tablet, nenhum admin mobile, nenhum funcionário desktop. O app implementa os três, tudo por inferência.
- O app cobre bem os estados genéricos. Os problemas reais são as lacunas abaixo (seção 3).

## 2. O que o app implementa e o Figma não mostra (extra, sem referência)

| Estado | Evidência |
|---|---|
| Skeleton de carregamento (Visão Geral, Frota, Equipe, Alertas, Solicitações, 4 variantes do funcionário) | `pages/VisaoGeralPage.tsx:175`, `FrotaPage.tsx:219`, `EquipePage.tsx:213`, `AlertasPage.tsx:78`, `SolicitacoesPage.tsx:179`, `EmployeeSkeleton` usado em `EmployeeSessionPage.tsx:30` |
| Erro de carga com `role="alert"` (admin: VisaoGeral/Frota/Equipe/Solicitações) | `VisaoGeralPage.tsx:190`, `FrotaPage.tsx:234`, `EquipePage.tsx:243`, `SolicitacoesPage.tsx:183` |
| Estado vazio | `VisaoGeralPage.tsx:261`, `EquipePage.tsx:296,338`, `AlertasPage.tsx:144`, `EmployeeMachinesPage.tsx:60`, `EmployeeHistoryPage.tsx:100`, `MachinePickerModal.tsx:52` |
| Toasts de sucesso/erro | `components/common/Toast.tsx:18-77`; usados em `FrotaPage.tsx:144,208,354`, `VisaoGeralPage.tsx:125-165`, `EquipePage.tsx:115-205`, `IncidentSheet.tsx:107-110`, `useWorkSession.ts:70,83` |
| Atualização otimista com rollback | `VisaoGeralPage.tsx:93`, `EquipePage.tsx:94` |
| Validação "obrigatório" com `aria-invalid` | `LoginPage.tsx:34-36`, `SolicitarAcessoPage.tsx:35-43`, `EmployeeFormModal.tsx:61-82,126`, `SectorFormModal.tsx:39,62`, `CategoryFormModal.tsx:55-57,140`, `IncidentSheet.tsx:59-82` |
| Erro de API em login e solicitação (401, rede, 409) | `LoginPage.tsx:45-47`, `SolicitarAcessoPage.tsx:56-58` |
| Botão desabilitado durante envio (login, solicitar, sessão, categoria) | `LoginPage.tsx:86`, `SolicitarAcessoPage.tsx:109`, `EmployeeSessionPage.tsx:53`, `CategoryFormModal.tsx:186` |
| Esc fecha modal/sheet, `aria-modal` | `Modal.tsx:20,32`, `BottomSheet.tsx:37,67` |
| `prefers-reduced-motion` | `index.css:111` |

## 3. Lacunas e divergências (o que os auditores por tela tendem a perder)

### 3.1 Telas do Figma sem estado equivalente no app

1. **"Alertas Recentes" (sino) inexistente.** `06/07/08-gestao-da-frota-ativo-*` mostram um dropdown "Alertas Recentes" com 5 itens vermelhos e botão "Mais". As telas de troca de filial mostram um ponto vermelho no sino (`11-trocar-de-filial-3.png`).
   No app o sino não faz nada: `components/layout/Header.tsx:112-114` (`aria-label="Notificações"`, sem `onClick`). Não há indicador de não lido.
2. **Modal "Alerta!" de acidente inexistente** (`12-modal-alert.png`: "Acidente no setor … funcionário responsável pela máquina EMP-084"). Não encontrei no app nenhum modal disparado por incidente (grep por `Alerta`/`acidente` em `Header.tsx` e páginas não achou nada além do status).
   O app também não tem polling nem push de incidentes no admin (**não verificado em profundidade**, só nas páginas que li).
3. **Modal "Informações sobre nível crítico"** (`05-historico-de-alertas/03-modal-explicacao-categoria.png`, Crítico/Alta/Média). Não implementado. Sem gatilho no `AlertasPage.tsx`.
4. **Modal de feedback** (`06-outros/01-feedback-e-sugestoes.png`, com textarea e "Enviar"). O botão da Sidebar não tem ação (`Sidebar.tsx:219-230`). Falta também o estado "enviado".
   No funcionário a textarea de feedback existe, mas sem envio (`EmployeeSettingsPage.tsx:67-76`).
5. **Política e Privacidade.** O link da Sidebar (`Sidebar.tsx:232`) aponta para rota inexistente e cai em 404. No funcionário, o botão "Política e Privacidade" não tem ação (`EmployeeSettingsPage.tsx:78-80`).
6. **Splash** (`01-splash.png`): sem rota nem estado de carregamento inicial correspondente (**tela não aberta por mim**, só pelo nome).
7. **Dashboard "variante"** (`02-visao-geral-variante.png`, título "Dashboard", cards de dados rápidos, tabela com paginação "Página 1 de 1", heatmap "Registro por tempo"): não é só variante, é uma tela diferente.
   O app tem só o grid de cards (`VisaoGeralPage.tsx`). Não tem paginação, cards de totais nem heatmap. Esse conteúdo é do auditor do grupo 02 confirmar.

### 3.2 Funcionário: Figma é mobile-only, app é fluido

- Figma 393px (`03-empilhadeiras-disponiveis-1.png`): TabBar flutuante na base, ícone de alerta e botão hambúrguer no topo, busca "Procurar Máquina ou setor".
- App adiciona grid em `≥768px` e `≥1200px` (`EmployeeMachinesPage.module.css:64,70`, `EmployeeHomePage.module.css:233,239`, `EmployeeHistoryPage.module.css:116,122`, `EmployeeLayout.module.css:25`) e `BottomSheet` vira cartão central `≥768px` (`BottomSheet.module.css:84-90`). Sem referência, é extra. Revisar visualmente.
- Os headers do Figma têm dois botões circulares (alerta + menu, `03-...png`; apenas "X" em `09-configuracoes.png`). Como o app trata o botão de alerta do funcionário, **não verificado**.

### 3.3 Detalhes de estado/ação que divergem do desenhado

1. **Detalhe da máquina (funcionário)** (`05-detalhe-empilhadeira.png`): botão "Ativar máquina" sempre ativo e filtro de data com "Date: 14 Julho, 2024 - 14 Julho, 2026".
   O app desabilita ativação se `status !== 'disponivel'` ou já há sessão (`MachineDetailSheet.tsx:38`). Estado desabilitado não existe no desenho: sem visual de referência, e sem mensagem explicando por quê (**não verificado se há texto**).
2. **Ocorrência** (`07-reportar-ocorrencia.png`): o desenho tem 4 campos (nome, setor, máquina, horário) e botão "Ativar máquina" (provável erro de rótulo no Figma, a rever com o designer).
   O app valida campos com erro inline (`IncidentSheet.tsx:59-82`). O Figma não mostra mensagem de erro, então o texto/estilo é invenção.
3. **Em processo** (`06-em-processo.png`): Figma tem ilustração estática e cronômetro. O app usa vídeo em loop com fade (`EmployeeSessionPage.tsx:20-26,40`). Sem fallback visual se o vídeo falhar (**não verificado**).
   Se `endSession` falha, o toast aparece, mas o botão volta a habilitar (`:36-38`): ok.
4. **Troca de filial** (`11-trocar-de-filial-3.png`): input "Digite o nome da filial" com ✓/✗ inline. O app tem `ConfirmDialog` de exclusão (`BranchSelector.tsx:320`), que o Figma não mostra. Confirmação extra, divergência intencional provável.
5. **Seleção de máquinas** (`03-selecionar-maquinas-1.png`): busca com chips removíveis e botão Confirmar sempre visível. O app desabilita Confirmar sem seleção (`MachinePickerModal.tsx:99`), o que o Figma não mostra.
6. **Login do admin**: o Figma tem link "Esqueceu a senha? Clique aqui" (`03-login-administrador.png`). Não encontrei esse link em `LoginPage.tsx` (grep por `forgot|esqueceu` não executado nos locales, **não verificado**).

### 3.4 Falhas de robustez nos estados do app (independentes do Figma)

| # | Problema | Evidência |
|---|---|---|
| A | **Alertas engole o erro de carga**: falha vira lista vazia, mostrando "sem alertas" como se fosse sucesso. Não há `loadState`/`role="alert"`/retry como nas outras páginas | `AlertasPage.tsx:38,43-58`, `:144` |
| B | Mesmo erro nas máquinas dos filtros de Alertas: `() => {}` silencioso | `AlertasPage.tsx:37` |
| C | **Área do funcionário sem estado de erro**: `Promise.allSettled` ignora rejeições e liga `loading=false`. Falha de rede aparece como "nenhuma máquina"/"histórico vazio" | `hooks/useEmployeeData.ts:15-26`; telas `EmployeeMachinesPage.tsx:60`, `EmployeeHistoryPage.tsx:100` |
| D | **Cadastro de máquina**: validação só nativa (`required`) e `onCreate` direto, sem estado de "salvando" e sem erro inline. Duplo clique pode criar duplicado. Outros formulários de admin também não bloqueiam submit (Employee/Sector: sem `disabled`/`saving`) | `NewMachinePanel.tsx:86-89,120,132,182`; `EmployeeFormModal.tsx` e `SectorFormModal.tsx` sem `saving` (grep) |
| E | **Validação de formato ausente**: e-mail, telefone, MAC e horário só checam "vazio". Figma sugere formatos (`EMP-084`, `AA:BB:CC:DD:EE:FF`, `(55) 15 999999999`) | `LoginPage.tsx:34`, `EmployeeFormModal.tsx:66`; MAC sem validação em `NewMachinePanel.tsx` (**não verificado se o backend valida**) |
| F | **Aria-labels do Header fixos em português**, fora do i18n (o app tem 7 idiomas): "Notificações", "Selecionar idioma", "Fechar seleção de idioma", "Perfil do usuário" | `Header.tsx:64,78,112,116` |
| G | **Sem confirmação em ações de sessão**: "Encerrar Sessão" é imediato (sem `ConfirmDialog`). O Figma também não desenha confirmação, então só vale decidir se se quer uma | `EmployeeSessionPage.tsx:53` |
| H | Toast: sem pausa ao hover/foco, nem botão de fechar (**não verificado** além de `Toast.tsx:55-77`) | `Toast.tsx` |

### 3.5 Responsivo admin (sem referência no Figma)

- Breakpoints existentes: sidebar vira drawer com hambúrguer `<768px` (`Sidebar.module.css:207`), header com padding extra para o hambúrguer (`Header.module.css:165`), grids em 1279/899/767/639 (`VisaoGeralPage.module.css:150-168`, `AlertasPage.module.css:185-218`), painel de máquina `<768px` (`NewMachinePanel.module.css:164`), `EquipePage` 768, `TeamForm` 480.
- **Frota não tem `@media` próprio**: `FrotaPage.module.css` e `FleetRow.module.css`/`FleetCard.module.css` não declaram breakpoints (grep por `@media` não retornou). O kanban depende de scroll horizontal e `min-width: 160px` em `FleetCard.module.css:149`.
  Comportamento em tablet/mobile **não verificado visualmente**, mas é o ponto de maior risco.
- Os modais do Figma (`CategoryFormModal` `min-width: min(400px,100%)`, `MachinePickerModal` idem) estão protegidos para telas estreitas, e `Modal.module.css:19` limita a 550px.
- Hover/ativo/foco: 46 ocorrências de `:hover|:active|:focus-visible` em CSS, mas o Figma não mostra nenhum. Não verifiquei se todos os botões têm foco visível (**não verificado**).

## 4. Prioridade sugerida

1. **A, B, C** (erro de carga virando "vazio"): são o único caso de estado enganoso para o usuário.
2. **D** (salvando/duplo clique) e **E** (formato).
3. **3.1 itens 1-3** (sino, modal de acidente, modal de nível): decisão de produto, pois exigem backend/polling.
4. **F** (i18n dos aria-labels), **3.5** Frota em telas estreitas.
5. Pedir ao designer estados de erro/vazio/loading/desabilitado e uma versão tablet/mobile do admin, para parar de operar por inferência.

## 5. Limites desta auditoria

- Não rodei o app nem medi layouts: tudo é leitura de código e das 16 imagens citadas.
- Não abri as outras 32 imagens; onde afirmo "Figma não mostra", vale só para as abertas.
- Não acessei o banco, não alterei código e não rodei instaladores.
