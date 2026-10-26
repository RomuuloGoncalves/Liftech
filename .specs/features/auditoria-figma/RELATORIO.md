# Relatório consolidado: Figma × frontend (Liftech)

Fontes: `inventario.md` e os 7 relatórios desta pasta (`admin-auth-outros`, `admin-visao-geral`, `admin-frota`, `admin-equipe-alertas`, `funcionario`, `transversal-visual`, `transversal-estados`). Caminhos relativos a `Frontend/src`, salvo indicação. Auditoria estática: o app não foi executado, e cores, medidas em px e responsivo **não foram verificados**, exceto onde está dito.

## Resumo

| Status | Qtde |
|---|---|
| OK | 5 |
| DIVERGENTE | 32 |
| NÃO IMPLEMENTADA | 8 |
| NÃO-DESENVOLVER | 3 |
| **Total** | **48** |

Prioridade sugerida: **Alta** = fluxo/ação do Figma ausente ou estado enganoso; **Média** = campo/rótulo/ação diferente que o usuário percebe; **Baixa** = texto, ordem ou detalhe visual.

### Ressalvas sobre a evidência
- **Linhas citadas fora do tamanho do arquivo.** Conferi os `arquivo:linha` dos relatórios contra a árvore atual. Estas referências não existem com esse número de linha e foram trocadas abaixo pela linha localizada via grep: `SolicitarAcessoPage.tsx:158-208` (arquivo tem 118 linhas), `AuthLayout.tsx:246-277` (69), `MachinePickerModal.tsx:603-681` (110), `CategoryFormModal.tsx:456-571` (195), `FleetCard.tsx:233-257` (224), `EmployeeCard.tsx:128-177` (76), `SectorCard.tsx:208` (51), `SectorInfoModal.tsx:68-82` (36), `MachineCard.tsx:509-530` (69), `BranchSelector.tsx:336-461` (332). `appRoutes.tsx:55-61`, citado por 3 auditores, não aponta para as rotas: elas ficam em `routes/appRoutes.tsx:69-87`. Onde não achei a linha certa, escrevi "linha não confirmada".
- **A worktree não está limpa.** `git status` mostra arquivos modificados em `Backend/` e outros, e `pages/SolicitacoesPage.tsx` não está no git (untracked). Os auditores podem ter lido versões diferentes; isso não foi verificado.
- **Mapeamento do inventário corrigido:** `02-visao-geral-maquinas/06/07/08-gestao-da-frota-ativo-*` são, na ordem, popover **Alertas Recentes**, modal **Perfil** e popover **Idioma**. Os nomes dos arquivos não descrevem o conteúdo.

## 1. Tabela por tela (48)

### Admin: 01-autenticacao

| Tela | Status | Divergências | Evidência | Prioridade |
|---|---|---|---|---|
| `01-splash` | NÃO IMPLEMENTADA | Não há splash (gradiente azul + logo). Nenhuma rota ou componente. | `routes/appRoutes.tsx:69-87` (sem rota); grep "splash" sem resultado | Baixa |
| `02-signup-administrador` | OK | Layout, abas, 3 campos, botão e hero batem; textos iguais ao pt-BR. Ressalva: hero escondido no CSS base, só aparece em breakpoint maior (responsivo sem referência no Figma). | `pages/SolicitarAcessoPage.tsx` (linha não confirmada); hero `components/auth/AuthLayout.tsx:49-52`; `locales/pt-BR/translation.json:183-205` | n/a |
| `03-login-administrador` | OK | Bate. Link "Esqueceu a senha? Clique aqui!" é `button` sem ação: o fluxo de recuperação não existe. | `pages/LoginPage.tsx:83-84` | Baixa (recuperação, se for feita) |
| `04-login-colaborador` | DIVERGENTE | Subtítulo: o Figma usa o mesmo texto do admin; o código usa um texto próprio de colaborador. Link "Esqueceu" sem ação. | `pages/LoginPage.tsx:55`; `pt-BR/translation.json:174` vs `:173` | Baixa |

### Admin: 02-visao-geral-maquinas

| Tela | Status | Divergências | Evidência | Prioridade |
|---|---|---|---|---|
| `01-visao-geral` | DIVERGENTE | (a) Select de setor a mais; filtro padrão "Padrão" vs "All". (b) Card "Em operação" no Figma mostra Funcionário e "Tempo de sessão"; os outros mostram "Tempo de Total". O código sempre mostra Setor + MAC + "Tempo de sessão". (c) Tempo sempre "N minutos" (Figma também "2 Horas"). (d) Menu ⋮ do card sem ação. (e) Header: sino sem ponto/ação; botão de logout extra. | `pages/VisaoGeralPage.tsx:205-267` (linha não confirmada); `components/machines/MachineCard.tsx:43` (⋮ sem onClick), `:50-62`; `components/layout/Header.tsx:112-128` | Média |
| `02-visao-geral-variante` | NÃO IMPLEMENTADA | É outra tela, "Dashboard": 4 cards de dados rápidos (máquinas, funcionários, manutenção, desativadas), tabela "Listagem de máquinas" com paginação e heatmap "Registro por tempo" (semana × horário). | grep "Dashboard"/"Registro por" sem resultado; `routes/appRoutes.tsx:69` | Média |
| `03-detalhe-maquina` | DIVERGENTE | (a) Figma "Desativar máquina"; código "Excluir Máquina", que exclui de fato. (b) Extras do código: select "Alterar status" e travar categoria. (c) Abas "Histórico de acidentes/manutenção" vs "Acidentes/Manutenção". (d) Aba de manutenção usa mock; só acidentes vêm da API. | `components/machines/MachineDetailModal.tsx:34-38,85-178`; `pages/VisaoGeralPage.tsx:27-29` | Alta (excluir vs desativar) |
| `04-cadastrar-maquina` | DIVERGENTE | (a) Setor: input texto no Figma, `<select>` no código. (b) Rótulos "Nome/ID/MAC Address" vs "Empilhadeira/Código/Endereço Mac". (c) Botão "Salvar" vs "Criar Empilhadeira". (d) Select de Filial extra quando a filial ativa é "todas". | `components/machines/NewMachinePanel.tsx:60-61,113,125,136-189`; `pt-BR/translation.json:39-43,61-64` | Baixa |
| `05-editar-maquina` | DIVERGENTE | Quase igual. Setor é `<select>` (Figma: texto). | `NewMachinePanel.tsx:60-64,136-146`; `VisaoGeralPage.tsx:294-300` | Baixa |
| `06-gestao-da-frota-ativo-1` (Alertas Recentes) | NÃO IMPLEMENTADA | O sino não tem handler nem popover, nem ponto de não lidos. Falta a lista "Alertas Recentes" com "Mais" e X. | `components/layout/Header.tsx:112-114` | Alta |
| `07-gestao-da-frota-ativo-2` (Perfil) | NÃO IMPLEMENTADA | Avatar sem ação. Falta modal com Email (editar), Senha (ver/editar), "Excluir Conta" e "Deslogar-se". | `Header.tsx:116-118`; grep "Excluir Conta" sem resultado | Média |
| `08-gestao-da-frota-ativo-3` (Idioma) | DIVERGENTE | Popover de idioma existe. Lista, ordem e bandeiras contra os 7 do Figma: não verificado. O card da imagem mostra "2 Horas" (ver 01-c). | `Header.tsx:60-110`; `hooks/useLanguage.ts` (não aberto) | Baixa |
| `09-trocar-de-filial-1` | DIVERGENTE | Opção extra "Todas as filiais"; ícone de "Gerenciar" diferente (Bolt vs hexágono); fallback do trigger diferente. | `components/layout/BranchSelector.tsx` (linha não confirmada) | Baixa |
| `10-trocar-de-filial-2` | DIVERGENTE | Ordem lápis/lixeira invertida; código acrescenta ConfirmDialog e erro 409; o botão vira "concluir". | `BranchSelector.tsx:221-224` (lápis), `:320` (ConfirmDialog) | Baixa |
| `11-trocar-de-filial-3` | DIVERGENTE | Input inline com ✓/✗ existe, mas sem placeholder visível "Digite o nome da filial" (só `aria-label`). | `BranchSelector.tsx:44` | Baixa |
| `12-modal-alert` | NÃO IMPLEMENTADA | Falta o modal global "Alerta!" de acidente (setor, funcionário, máquina, "Ok"). Não há mecanismo de alerta em tempo real no admin. | grep "Acidente no setor" sem resultado; `App.tsx` sem provider de alertas | Alta |

### Admin: 03-frota

| Tela | Status | Divergências | Evidência | Prioridade |
|---|---|---|---|---|
| `01-gestao-da-frota` | DIVERGENTE | (1) Título "Gerenciamento das máquinas" vs menu "Gerenciamento Frota" (título do Header não verificado). (2) Falta a linha padrão "Desativadas": o seed só cria 4 categorias. (3) "All" vs "Todas"; select de setor extra. (4) Seletor de data só em Acidentes (Figma: todas as linhas); "Data:" vs "Date:". (5) "Excluir categoria" em todas as linhas + "Editar categoria" extra (Figma: só em Desativadas). (6) Card de acidente sempre "Urgente" (Figma: Crítica/Alta/Média). (7) "Tempo Sessão"/"Horas Totais(Semanal)" vs "Tempo de sessão"/"Tempo total". (8) Extras: cadeado, "mover para". (9) Sem `@media` na página. | `pages/FrotaPage.tsx:195-250`; `components/fleet/FleetRow.tsx:111,130-141`; `components/fleet/FleetCard.tsx:75-79`; `Backend/src/feature/category/categoryService.ts:14-19` | Média |
| `02-criar-categoria` | DIVERGENTE | Implementado, mas com o fieldset "Status vinculados" a mais; cor inicial azul vs "#3AFF3A"; botão "Criar" à direita da toolbar (Figma: à esquerda). | `components/fleet/CategoryFormModal.tsx:39,115-120,152`; `data/fleet.ts:16` | Baixa |
| `03-selecionar-maquinas-1` | DIVERGENTE | Chips e busca em caixas separadas (Figma: mesma caixa); Confirmar desabilitado sem seleção; lista só com máquinas sem categoria. | `components/fleet/MachinePickerModal.tsx:30-39,55-58,99` | Baixa |
| `04-selecionar-maquinas-2` | DIVERGENTE | Lista sempre aberta, não é dropdown ao focar a busca. | `MachinePickerModal.tsx:55-58` (linha não confirmada para a lista) | Baixa |
| `05-detalhe-maquina-padrao` | DIVERGENTE | Selo, rótulos ("Último Funcionário", "Tempo Uso (Total Sessão)", "7hrs" vs "N minutos"), abas "Histórico de reparos/alertas" vs "Manutenção/Acidentes"; extras select de status e travar; "Date:" hardcoded em inglês; reparos são mock. | `MachineDetailModal.tsx:85-112,150-226`; `FrotaPage.tsx:56-58` | Média |
| `06-detalhe-maquina-acidente` | DIVERGENTE | Faltam o selo de urgência ("Crítico"), a linha "Data e Hora" e o botão amarelo **"Enviar para manutenção"**. A Frota não passa footer ao modal. | `MachineDetailModal.tsx:96-100,118-137`; `FrotaPage.tsx:325-336` | Alta |
| `07-detalhe-maquina-manutencao` | DIVERGENTE | Falta o botão azul **"Completar Manutenção"** (hoje é via select); selo "Em manutenção" vs "Manutenção". | `MachineDetailModal.tsx:150-178`; `pt-BR/translation.json:76,260` | Alta |
| `08-detalhe-maquina-disponivel` | DIVERGENTE | Mesmas diferenças da 05 (rótulos, abas, controles extras, mock). | `MachineDetailModal.tsx:96-100,150-178` | Baixa |

### Admin: 04-equipe-e-setor

| Tela | Status | Divergências | Evidência | Prioridade |
|---|---|---|---|---|
| `01-gestao-de-equipe-e-setor` | DIVERGENTE | Filtro `<select>` nativo "Todos" vs "All" com ícone; card de setor mostra a filial (extra); switch desabilitado sem login (estado extra). | `pages/EquipePage.tsx:264-333`; `components/team/EmployeeCard.tsx:61-66`; `components/team/SectorCard.tsx:27` | Baixa |
| `02-cadastrar-funcionario` | DIVERGENTE | Campo Filial só aparece com a filial "todas" e 2+ filiais, em outra ordem e sem opção vazia; horários com `type=time` nativo. | `components/team/EmployeeFormModal.tsx:42-52,150-174` | Média |
| `03-editar-funcionario` | DIVERGENTE | Sem Filial na edição; senha vazia ("deixe em branco") vs valor preenchido no Figma; Usuário `disabled` quando já existe. | `EmployeeFormModal.tsx:42,165-170`; `pt-BR/translation.json:151` | Média |
| `04-detalhe-funcionario` | DIVERGENTE | Não mostra Filial nem Senha. Filial já existe em `Employee.filialId`; senha não deve ser exibida (é hash). | `components/team/EmployeeInfoModal.tsx:35-46`; `data/team.ts:15` | Baixa |
| `05-cadastrar-setor` | DIVERGENTE | "Unidade" (Figma) vs "Filial"; select/somente leitura vs input texto. | `components/team/SectorFormModal.tsx:33,72-99`; `pt-BR/translation.json:138,146` | Baixa |
| `06-editar-setor` | DIVERGENTE | O Figma reaproveita o título "Cadastrar um novo setor" e o botão "Criar setor" (provável cópia de frame; confirmar com o design); código "Editar setor"/"Confirmar". "Unidade" vs "Filial". | `SectorFormModal.tsx:49,97-99` | Baixa |
| `07-detalhe-setor` | DIVERGENTE | Só o rótulo "Unidade" vs "Filial". | `components/team/SectorInfoModal.tsx:26-27` | Baixa |

### Admin: 05-historico-de-alertas

| Tela | Status | Divergências | Evidência | Prioridade |
|---|---|---|---|---|
| `01-historico-de-alertas` | DIVERGENTE | Falta o botão "?" que abre o modal 03; período em 2 `input date` vs botão único; chip "Acidentes" vs `h2`; sem ⋮ no card. **Estado:** erro de carga vira lista vazia ("sem alertas"). | `pages/AlertasPage.tsx:37-58,100-155`; `FleetCard.tsx:75-84,114` | Alta (estado enganoso) |
| `02-detalhe` | DIVERGENTE | Linhas: Figma tem "Data e hora", código tem "Nome Dispositivo"; abas com outros nomes; "7hrs" vs minutos; timeline sem cartões azuis (visual não verificado); reparos mock. | `MachineDetailModal.tsx:43-47,87-102,139-148`; `AlertasPage.tsx:21-23,160-166` | Média |
| `03-modal-explicacao-categoria` | NÃO IMPLEMENTADA | Falta o modal "Informações sobre nível crítico" (Crítico/Alta/Média + causas) e o botão "?". O mapeamento causa → nível já existe. | `data/machines.ts:243,313`; `pt-BR/translation.json:85-94` | Média |

### Admin: 06-outros

| Tela | Status | Divergências | Evidência | Prioridade |
|---|---|---|---|---|
| `01-feedback-e-sugestoes` | NÃO IMPLEMENTADA | O botão da Sidebar não tem ação. Falta o modal (título, X, "Como foi sua experiência?", textarea, Enviar). | `components/layout/Sidebar.tsx:219-230` | Média |
| `02-politica-e-privacidade` | NÃO IMPLEMENTADA | O link aponta para `/politicas-privacidade`, que não está registrada e cai no 404. Falta a página (logo + "Voltar", metadados, seções numeradas). | `Sidebar.tsx:232`; `routes/appRoutes.tsx:87` (`*` → 404) | Média |

### Funcionário

| Tela | Status | Divergências | Evidência | Prioridade |
|---|---|---|---|---|
| `01-login-colaborador` | OK | Bate. Extras: hero ≥900px; "Esqueceu" sem ação. | `pages/LoginPage.tsx:18-93` | n/a |
| `02-visao-geral` | DIVERGENTE | "Tempo restante da jornada" fixo `04:00`; jornada "8h às 17h" fixa no i18n; "Última máquina" com fallback mock; banner com seta sem ação; cor do "Disponível" ambígua no próprio Figma. | `pages/employee/EmployeeHomePage.tsx:14-21,29,46-51,70-87`; `pt-BR/translation.json:298-305` | Média |
| `03-empilhadeiras-disponiveis-1` | OK | Bate; estado vazio extra. | `pages/employee/EmployeeMachinesPage.tsx:40-73`; `data/employeeArea.ts:48-58` | n/a |
| `04-empilhadeiras-disponiveis-2` | DIVERGENTE | Falta o toggle **Disponíveis / Em operação**. A aba "Em operação" é NÃO-DESENVOLVER, então falta só o seletor (decidir se ele faz sentido sem a segunda aba). | `EmployeeMachinesPage.tsx:40-57`; `data/employeeArea.ts:52` | Baixa |
| `05-detalhe-empilhadeira` | OK | Bate. Extras: "Ativar" desabilitado se a máquina não está disponível ou já há sessão; 2 inputs de data vs campo único. | `components/employee/MachineDetailSheet.tsx:28-129` | n/a |
| `06-em-processo` | DIVERGENTE | Destaques em azul do texto diferem; ilustração é vídeo em loop (Figma: arte estática); timer 48px, fora da escala de fontes. | `pages/employee/EmployeeSessionPage.tsx:32,40-66`; `EmployeeSessionPage.module.css:35` | Baixa |
| `07-reportar-ocorrencia` | DIVERGENTE | Botão "Ativar máquina" no Figma (provável erro do design) vs "Enviar ocorrência"; campos pré-preenchidos; só `horario` é enviado; sem sessão, o backend responde 409 e o app mostra só um toast genérico; sem descrição. | `components/employee/IncidentSheet.tsx:23-52,103-129`; `components/employee/EmployeeHeader.tsx:32-39`; `Backend/src/feature/incident/incidentService.ts:44-60` | Média |
| `08-historico-de-empilhadeira` | DIVERGENTE | Subtítulo diferente; período em 2 inputs vs campo único; rótulo "Hora:" ausente; "Data:" hardcoded fora do i18n; registros de máquinas fora da lista somem sem aviso. **Estado:** erro de rede vira "histórico vazio". | `pages/employee/EmployeeHistoryPage.tsx:40-112`; `hooks/useEmployeeData.ts:15-26` | Média |
| `09-configuracoes` | DIVERGENTE | Texto de "Solicitação de alteração" mais curto; feedback sem envio; "Política e Privacidade" sem ação; **a chave `employee.settings.feedbackPlaceholder` não existe em nenhum locale** (confirmado por grep), então a tela pode mostrar a própria chave. | `pages/employee/EmployeeSettingsPage.tsx:67-80`; `locales/*/translation.json` (só `feedbackQuestion`) | Média (chave i18n faltando) |

### NÃO-DESENVOLVER (decisão do dono, não é pendência)

| Tela | Status | Observação |
|---|---|---|
| `admin/nao-desenvolver/cadastrar-maquina` | NÃO-DESENVOLVER | Informativo: `NewMachinePanel` já cobre o cadastro, com outros rótulos e sem "Tempo uso (Horas)". |
| `admin/nao-desenvolver/editar-maquina` | NÃO-DESENVOLVER | Informativo: o modo edição existe; falta "Tempo uso (Horas)". |
| `funcionario/nao-desenvolver/empilhadeiras-disponiveis` | NÃO-DESENVOLVER | Aba "Em operação" com "Tempo Restante". Não existe no app. |

## 2. Telas e ações faltantes, por funcionalidade

| # | Funcionalidade | Telas / ações | Backend | Evidência |
|---|---|---|---|---|
| 1 | **Alertas em tempo real** | `02/06` popover Alertas Recentes + ponto de não lidos; `02/12` modal "Alerta!" | **Sim**: lista de recentes/não lidos por filial, flag de leitura e push/polling/WebSocket de novos incidentes. Não verificado se existe. | `Header.tsx:112-114` |
| 2 | **Ações de manutenção no detalhe** | `03/06` "Enviar para manutenção"; `03/07` "Completar Manutenção"; `02/03` "Desativar" em vez de excluir | Parcial: `machineService.alterarStatus` já existe. "Desativar" exige soft-delete/status `offline` (não verificado). | `MachineDetailModal.tsx:118-178`; `FrotaPage.tsx:325-336` |
| 3 | **Histórico de manutenção real** | Abas de reparos em `02/03`, `03/05-08`, `05/02` (hoje mock) | **Sim**: não há rota de histórico de manutenção. | `VisaoGeralPage.tsx:27`; `AlertasPage.tsx:21` |
| 4 | **Dashboard** | `02/02` (dados rápidos, tabela paginada, heatmap) | **Sim** para o heatmap (agregado semana × horário). As contagens podem vir das listas já carregadas. | grep "Dashboard" sem resultado |
| 5 | **Perfil do admin** | `02/07` (email, senha, excluir conta, deslogar) | **Sim**: alterar e-mail/senha e excluir conta (não verificado se há rotas). | `Header.tsx:116-118` |
| 6 | **Feedback** | `06/01` modal admin; envio na `funcionario/09` | **Sim**: endpoint para receber o feedback (não existe, segundo `funcionario.md`). | `Sidebar.tsx:219-230`; `EmployeeSettingsPage.tsx:67-76` |
| 7 | **Política e Privacidade** | `06/02` página; botões no admin e no funcionário | Não (conteúdo estático; o texto jurídico vem do dono) | `Sidebar.tsx:232`; `EmployeeSettingsPage.tsx:78-80` |
| 8 | **Explicação de níveis de alerta** | `05/03` modal + botão "?" | Não (mapeamento já existe em `data/machines.ts:243`) | `AlertasPage.tsx` |
| 9 | **Jornada do funcionário** | `funcionario/02` tempo restante e jornada | **Sim**: turno/jornada não estão no payload de login nem no schema `operator` | `EmployeeHomePage.tsx:14-21` |
| 10 | **Linha "Desativadas" na Frota** | `03/01` | Ajuste no seed (`Backend/src/feature/category/categoryService.ts:14`) | `FleetRow.tsx:130-141` |
| 11 | **Urgência real nos cards da Frota** | `03/01`, `03/06` | Ajuste: o dado de incidente só vem na página Alertas | `FleetCard.tsx:75-79` |
| 12 | **Splash** | `01/01` | Não | n/a |
| 13 | **Recuperar senha** (fora do Figma, só o link aparece) | link em `01/03`, `01/04`, `funcionario/01` | **Sim**, se for desenvolvida | `LoginPage.tsx:83` |
| 14 | **Toggle Disponíveis/Em operação** | `funcionario/04` (só o seletor; a aba é NÃO-DESENVOLVER) | Não | `EmployeeMachinesPage.tsx:40-57` |

Ordem sugerida: 1 e 2 (alertas e manutenção, núcleo do produto), depois 3, 6, 7, 8, 5, 4, 9; o resto por último.

## 3. Divergências transversais

> **Cobertura parcial.** O auditor visual abriu cerca de 12 PNGs e o de estados, 16. As afirmações "o Figma não mostra X" e os valores de cor/px valem só para essas telas, e os valores do Figma são estimativas visuais (não houve inspeção do arquivo Figma). Os dois relatórios dizem "48 PNGs sem nao-desenvolver", mas sem essa pasta são 45.

### 3.1 Visual (`transversal-visual.md`)

| ID | Divergência | Evidência | Prioridade |
|---|---|---|---|
| V1 | O botão primário "3D" (sombra inferior sólida) do Figma só existe na tela de sessão. O app tem 4 receitas de botão (raio 10/5/8/8, com/sem sombra, com/sem gradiente). | `EmployeeSessionPage.module.css:70,75`; `NewMachinePanel.module.css:128-140`; `DialogButtons.module.css:8-26`; `AuthForm.module.css:35` | Alta |
| V2 | O modal "Alerta!" não tem variante visual no `Modal`. | `Modal.module.css:19` | (junto com faltante #1) |
| V3/5 | Dois vermelhos com regra implícita: `--red #ff0000` (texto) e `--danger-solid #ef4444` (preenchimento). | `index.css:2-55`; `DialogButtons.module.css:20-22`; `EmployeeCard.module.css:54,79` | Baixa |
| V4 | Gradiente da marca hardcoded e repetido 3×, sem token. | `AuthForm.module.css:40`; `AuthLayout.module.css:59,100,111` | Baixa |
| V5 | Badge de status: raio 8px (admin) vs 4px (funcionário); verde do app mais escuro que o do Figma (estimado); "Disponível" é azul em `funcionario/02` e verde em `/03` dentro do próprio Figma (pergunta para o design); amarelo com contraste ~1.5:1 (fiel ao Figma, mas é problema de acessibilidade). | `StatusBadge.module.css:1-27`; `MachineListCard.module.css:55-61` | Média |
| V8 | Sidebar com 260px vs ~256px (estimado). | `Sidebar.module.css:2` | Baixa |
| V9 | Botões quadrados do card de setor com raio 5px vs ~3px (estimado). | `SectorCard.module.css:55-71` | Baixa |
| V10 | Timer da sessão com 48px, fora da escala e ~10-20% menor que o do Figma (estimado). | `EmployeeSessionPage.module.css:35` | Baixa |
| V12 | Inputs com fundo branco vs cinza claro no Figma; painel Nova Máquina com 400px vs ~375px (medido na captura); título 18px vs ~20px. | `NewMachinePanel.module.css:15,51,100-106` | Baixa |
| V13 | Modal de detalhe com `max-width` 550px vs ~458px (medido na captura). | `Modal.module.css:19` | Média |
| T1 | Escalas paralelas: tokens `--fs-*`/`--radius-*` convivem com `calc(N*var(--px))` (Frota) e px literais (funcionário). O comentário em `index.css:47` diz que toda fonte usa a escala, o que não é verdade (há 10, 48 e 64px). | `FleetCard.module.css:10,49,...`; `EmployeeHomePage.module.css:110,155` | Baixa |
| T2 | Três tons para divisores (`--line`, `--sidebar-line`, `--border`); sombra `0 1px 0` repetida sem token. | `index.css:21,30`; `EquipePage.module.css:58` | Baixa |

### 3.2 Estados e responsivo (`transversal-estados.md`)

**O Figma não desenha estados** (loading, erro, vazio, desabilitado, toast, hover/foco) **nem responsivo**: admin só em 1440px e funcionário só em 393px. Tudo o que o app tem nessas áreas foi feito por inferência e não tem como ser validado contra o design. Itens que pedem ação:

| ID | Problema | Evidência | Prioridade |
|---|---|---|---|
| A/B | Alertas: o erro de carga vira lista vazia ("sem alertas"), e as máquinas dos filtros falham em silêncio. | `pages/AlertasPage.tsx:37-58,144` | **Alta** |
| C | Área do funcionário: `Promise.allSettled` ignora rejeições, e uma falha de rede aparece como "nenhuma máquina"/"histórico vazio". | `hooks/useEmployeeData.ts:15-26` | **Alta** |
| D | Cadastro de máquina, funcionário e setor sem estado "salvando": duplo clique pode duplicar. | `NewMachinePanel.tsx:86-89`; `EmployeeFormModal.tsx`/`SectorFormModal.tsx` (sem `saving`) | Média |
| E | Validação só de "vazio"; sem formato para e-mail, telefone, MAC e horário. | `LoginPage.tsx:34`; `EmployeeFormModal.tsx:66` | Média |
| F | `aria-label` do Header fixos em português, fora do i18n (7 idiomas). | `Header.tsx:64,78,112,116` | Baixa |
| G | "Encerrar Sessão" sem confirmação (o Figma também não desenha uma; é decisão de produto). | `EmployeeSessionPage.tsx:53` | Baixa |
| H | Toast sem pausa no hover e sem botão de fechar (não verificado além do componente). | `components/common/Toast.tsx:55-77` | Baixa |
| R1 | Frota sem `@media`: o kanban depende de scroll horizontal. É o maior risco em tablet/mobile (não verificado visualmente). | `FrotaPage.module.css`, `FleetRow.module.css`, `FleetCard.module.css:149` | Média |
| R2 | Funcionário com grid em ≥768/≥1200px e BottomSheet virando cartão central: extras sem referência no Figma. | `EmployeeMachinesPage.module.css:64,70`; `BottomSheet.module.css:84-90` | Baixa |

Correção ao relatório de estados: o item 3.3.6 diz não ter achado o link "Esqueceu a senha" em `LoginPage.tsx`, mas ele existe em `pages/LoginPage.tsx:83-84`, sem ação.

## 4. Pedidos ao design (para parar de operar por inferência)
- Estados de erro, vazio, loading e desabilitado; versão tablet/mobile do admin.
- Confirmar: botão "Ativar máquina" em `funcionario/07`; título/botão de `04/06-editar-setor`; cor do "Disponível" (`funcionario/02` vs `/03`); typos "Digite um sugestão" e "Tital-X".

## 5. Não verificado (consolidado)
- Cores, tamanhos, tipografia e ícones exatos (só capturas; o app não foi executado).
- Existência de endpoints para feedback, recuperação de senha, perfil, alertas recentes, dashboard e "desativar máquina".
- Lista de idiomas em `hooks/useLanguage.ts`.
- Comportamento responsivo real.
