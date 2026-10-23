# Auditoria transversal — fidelidade visual

Escopo: 48 PNGs de `figma-telas/` (sem `nao-desenvolver`) × `Frontend/src/index.css` e CSS Modules. Somente leitura.

**Método e limite:** abri ~12 PNGs representativos (admin: visão geral, frota, equipe, alertas, login, detalhe de máquina, nova máquina, modal-alert; funcionário: visão geral, disponíveis, em processo, ocorrência). Os demais foram **não verificados** visualmente. Os PNGs são capturas (1440 px admin / 393 px funcionário), sem inspeção de valores: tamanhos em px e cores do Figma abaixo são **estimativas visuais**, não medidas. Valores do app são exatos (arquivo:linha).

## 1. Tokens do app (referência)

`Frontend/src/index.css:2-55`: `--blue #3a9cff`, `--red #ff0000`, `--danger-solid #ef4444`, `--yellow #e5d000`, `--green #1e8021`, urgências `#c84646/#d4773f/#ffc415` (`:18-20`), raios 5/8/10 (`:34-36`), escala de fonte 11–32 px (`:48-55`), fonte Host Grotesk (`:43`; carregada em `index.html:9`).

Hardcodes que escapam dos tokens (CSS Modules, via grep):
- Cores soltas: `#40b2ff`, `#4550ee`, `#41b0ff`, `#4652ef`, `#41a8ff`, `#333`, `#444`, `#3a8bff`, `#d9d9d9`, `#dedede`, `#b3b3b3`, `#e3e3e3` (ex.: `AuthForm.module.css:40`, `AuthLayout.module.css:59,100,111`).
- Raios soltos: 23× `8px`, 16× `5px`, 5× `3px`, 4× `4px`, `9px`, `7px`, `6px`, `12px`, `24px` (ex.: `MachineListCard.module.css:9,64`; `EmployeeSessionPage.module.css:~27`; `SessionBar.module.css:14` = 12px; `BottomSheet.module.css:19` = 24px).
- Fontes fora da escala: `10px` (`EmployeeHomePage.module.css:110,155`), `11px` literal (`EmployeeSettingsPage.module.css:125`), `48px` (`EmployeeSessionPage.module.css:35`), `64px` (`NotFoundPage.module.css:19`). O comentário em `index.css:47` ("todo font-size usa um destes passos") não é verdade.
- `FleetCard`/`FleetRow` usam `calc(N * var(--px, 1px))` (`FleetCard.module.css:10,49,118,152,168,185`; `FleetRow.module.css:9,40,88`) — sistema de escala paralelo aos tokens de raio.

## 2. Divergências Figma × app (alta confiança)

### V1 — Botão primário "3D" (sombra inferior sólida) só existe em 1 tela
- Figma: botões primários/destrutivos têm sombra inferior sólida (~3 px, tom mais escuro) em `admin/02.../04-cadastrar-maquina.png` ("Criar Empilhadeira"), `12-modal-alert.png` ("Ok"), `funcionario/06-em-processo.png` e `07-reportar-ocorrencia.png` ("Cancelar"/"Ativar máquina").
- App: só `EmployeeSessionPage.module.css:70,75` (`0 3px 0 color-mix(...)`). Faltam em `NewMachinePanel.module.css:128-140` (`.submitButton`, sem sombra, raio `--radius-lg` 10px), `DialogButtons.module.css:8-26` (sem sombra, raio 5px) e `IncidentSheet.module.css:~81-97` (verificar: botões 40px sem `box-shadow`; grep de `box-shadow` não retorna esse arquivo).
- Efeito: mesmo componente "botão" com 4 acabamentos diferentes (raio 5/8/10, com/sem sombra).

### V2 — Modal "Alerta!" (12-modal-alert.png) sem equivalente visual
- Figma: card branco ~470 px, círculo vermelho (~64 px, `#ef4444`-like) com triângulo, título "Alerta!" vermelho grande (~32 px), texto cinza com negrito parcial, botão azul "Ok" 3D.
- App: `Modal.module.css:19` (`max-width: 550px`) e `DialogButtons.module.css` não têm variante de ícone/título vermelho; `ConfirmDialog.module.css` tem 5 linhas. Não encontrei componente de alerta de acidente (grep "Alerta!" só aponta `Header.tsx`/`MachineDetailModal.tsx`; conteúdo **não verificado**). Parte do escopo funcional — checar com o auditor do grupo 02.

### V3 — Botões de confirmação/cancelar de modal: pequenos no app, diferentes no Figma
- Figma (modais de setor/máquina): botões "Cancelar" vermelho / confirmar azul e links "Cancelar" em vermelho puro (`04-cadastrar-maquina.png`: "Cancelar" texto vermelho `#ff0000`-like).
- App: `NewMachinePanel.module.css:150-158` usa `var(--red)` (#ff0000) para o link Cancelar — OK com o Figma; mas `DialogButtons.module.css:20-22` usa `--danger-solid` (#ef4444) para o botão Cancelar. Dois vermelhos para "cancelar" (puro vs. #ef4444). Figma usa vermelho puro no link e ~#ef4444 nos botões preenchidos (estimado): decisão atual plausível, **porém** `EquipePage`/`TeamForm.module.css:81,86` usa `--red` para erro de validação e `EmployeeCard.module.css:54` usa `--red` para "Negado" e `:79` `--danger-solid` para a lixeira. Convém documentar a regra (texto = `--red`, preenchimento = `--danger-solid`); hoje é implícita.

### V4 — Gradiente do login/botão: valores hardcoded e duplicados 3×
- Figma (`03-login-administrador.png`): botão "Entrar" e aba ativa com gradiente azul→roxo; painel direito com gradiente vertical ~#41b0ff→#4652ef; raio do painel ~24px.
- App: `#40b2ff→#4550ee` repetido em `AuthForm.module.css:40`, `AuthLayout.module.css:100`; painel `#41b0ff→#4652ef` em `AuthLayout.module.css:111`; `#41a8ff` em `AuthLayout.module.css:59`. Visualmente próximo ao Figma (estimativa), mas sem token (`--grad-brand`). Risco: ajuste futuro em 1 lugar não propaga.

### V5 — Badge de status: tamanho e cor no app ≠ Figma
- Figma admin (`01-visao-geral.png`, `01-gestao-da-frota.png`): badge de status minúsculo (texto ~7-8 px, pílula ~52×14 px) — "Disponível" verde-claro com texto verde, "Em operação" azul-claro, "Manutenção" amarelo-claro com texto amarelo.
- Figma funcionário (`02-visao-geral.png`): "Disponível" aparece **azul-claro** (texto azul) enquanto em `03-empilhadeiras-disponiveis-1.png` o mesmo "Disponível" é **verde**. Inconsistência dentro do próprio Figma.
- App: `StatusBadge.module.css:1-9` (padding 2×8, raio 8px, fonte 11px, peso 500) usa verde para disponível; `MachineListCard.module.css:55-61` (`.chip`) sobrescreve raio para 4px e padding. Resultado: badge admin 11px/8px-raio e badge funcionário com raio 4px — dois raios para o mesmo componente. Texto verde do app `--green #1e8021` é escuro; o Figma mostra verde mais claro/vivo (~#2ecc40-like, estimado) — **não verificado** em valor exato.
- Cor amarela: texto `--yellow #e5d000` sobre fundo `rgba(255,245,139,.25)` (`StatusBadge.module.css:23-27`) tem contraste baixo (~1.5:1) — o Figma tem o mesmo aspecto (texto amarelo em fundo creme), então é fiel, mas é problema de acessibilidade.

### V6 — Badges de categoria na Frota (cabeçalho "Acidentes", "Em Operação"…)
- Figma `01-gestao-da-frota.png`: etiqueta retangular com ícone + nome + contador em pílula branca, fundo/borda da cor do status (vermelho/azul/amarelo/verde) e raio ~3px.
- App: `FleetRow.module.css:40,88` usa `calc(2*var(--px))` de raio; não consegui confirmar o raio exato do Figma (~2-3 px estimado). Verificar `FleetRow.module.css` linhas 30-95 pelo auditor do grupo 03.

### V7 — Cards de ocorrência (Frota/Alertas): cabeçalho colorido por urgência
- Figma: cabeçalho vermelho/laranja/amarelo, "Nível de urgência" com texto grande colorido (Crítica/Alta/Média) e "Média" em amarelo `#ffc415`-like sobre branco (baixo contraste).
- App: `FleetCard.module.css:57-72,251-260` e tokens `index.css:18-20` — cores batem com o Figma (estimadas `#c84646/#d4773f/#ffc415`). Raio do card `calc(8*var(--px))` (`:10`) vs card padrão `--radius-md` 8px: igual em px, mas por mecanismo distinto.

### V8 — Sidebar
- Figma: largura ~256 px, item ativo azul `#3a9cff` com raio ~5px, botão "Feedback & Sugestões" azul com seta, "Políticas & Privacidades" abaixo, avatar+empresa no rodapé, botão de recolher 32 px.
- App: `Sidebar.module.css:2` `--sidebar-width: 260px` (≈4 px a mais; estimado), `:55-66` toggle 32×32 raio 5px ✔, `:156-170` feedback com padding 10×14 e raio 5px ✔. Diferença principal: largura 260 vs ~256 (**estimativa**, medir no Figma).
- Item "Gerenciamento Frota" vs "Gestão de Equipe": ícones do Figma são traço-fino próprios (empilhadeira, pessoas); ícones do app **não verificados** (provável lib/SVG distinto).

### V9 — Cards de funcionário/setor (Equipe)
- Figma `01-gestao-de-equipe-e-setor.png`: funcionário usa ícones de lixeira/lápis **sem fundo** (vermelho/azul) + toggle azul; setor usa botões **quadrados preenchidos** (vermelho/azul, ~25 px, raio ~3px).
- App: `EmployeeCard.module.css:~76-83` (ícones sem fundo ✔) e `SectorCard.module.css:55-71` (25×25, raio 5px, fundo `--danger-solid`/`--blue` ✔). Raio 5px vs ~3px do Figma (estimado) — pequena divergência. "Permitido" azul / "Negado" vermelho: `EmployeeCard.module.css:50-55` ✔ (usa `--red` #ff0000, Figma parece vermelho `#ef4444`-like — **não verificado**).

### V10 — Funcionário: timer e botões da sessão
- Figma `06-em-processo.png`: "00:30:25" em preto bold (~58 px estimado em frame 393), botões 357×~38 com raio ~8px e sombra 3D, vermelho/azul.
- App: `EmployeeSessionPage.module.css:35` `48px` 700 (**fora da escala**; Figma parece ~10-20 % maior), botões `:20-27` altura 40, raio 8 ✔, sombras ✔.
- Visão geral do funcionário (`02-visao-geral.png`): relógio "0 4 : 0 0" em caixas individuais com borda; o app usa `EmployeeHomePage.module.css` — formato de dígitos em caixas **não verificado** (não abri o TSX).

### V11 — Bottom sheet (ocorrência) e TabBar
- Figma `07-reportar-ocorrencia.png`: sheet com raio superior ~24 px, alça cinza, inputs altura ~38 px raio ~3px fundo `#fafafa`, campo "Horário" metade da largura, header com divisor.
- App: `BottomSheet.module.css:19` raio `24px 24px 0 0` ✔, `:32` alça raio 2px ✔; inputs do sheet usam `IncidentSheet.module.css` (raio não confirmado). O botão de seta ">" (fechar) do Figma: **não verificado** no app.
- TabBar: pílula `border-radius: 999px` (`TabBar.module.css:14`) com botões circulares ✔ (bate com Figma `02`,`03`), sombra `0 4px 12px` (`:17`).

### V12 — Inputs de formulário
- Figma `04-cadastrar-maquina.png`: inputs altura ~38 px, borda cinza-clara, **fundo cinza quase branco** (`#fafafa`-like), placeholder cinza claro, raio ~3px.
- App: `NewMachinePanel.module.css:100-106`: padding 10×12, `--radius-sm` 5px, **`background: var(--bg)` (branco)** — Figma mostra fundo ligeiramente cinza (estimado). Painel largura `400px` (`:15`) vs ~375 px no Figma (1066→1440 = 374 px; **medido na captura**, diferença ~26 px). Título 18 px (`:51`) vs ~20 px Figma (estimado).

### V13 — Modal de detalhe de máquina (`05-detalhe-maquina-padrao.png`)
- Figma: modal ~458 px de largura, raio ~10px, header com título + tag (nome tag, verde-claro) + X; tabela interna com ícones (pin, user, timer, device) e divisores; abas "Histórico de reparos" (azul preenchida)/"Histórico de alertas" (outline)/data; timeline com bolinha azul e cartões azuis `#3a9cff` com texto branco pequeno.
- App: `Modal.module.css:19` `max-width: 550px` (~92 px mais largo que o Figma, **medido**: 949−491 = 458 px); `MachineDetailModal.module.css` 244 linhas (cards azuis da timeline: **não verificado** em detalhe). Raio 10px ✔ (`Modal.module.css:24`).

## 3. Inconsistências entre telas (no app)

1. Botão primário: 4 receitas (`NewMachinePanel.module.css:128`, `DialogButtons.module.css:8`, `AuthForm.module.css:35`, `EmployeeSessionPage.module.css:20`) — raio 10/5/8/8, peso 600/600/600/500, com/sem sombra 3D, com/sem gradiente.
2. Badge de status: `StatusBadge` raio 8px vs chip funcionário 4px (`MachineListCard.module.css:55`).
3. Cartão de máquina admin (`MachineCard.module.css:9-10`: borda `--border`, raio `--radius-md`) vs funcionário (`MachineListCard.module.css:9-10`: borda `--gray-border`, raio `8px` literal): mesma aparência, tokens diferentes; `--border` e `--gray-border` são alias hoje (`index.css:30`).
4. Divisores: `--line #e3e4e5` (`index.css:21`) vs `--sidebar-line #eeeff0` vs `--border rgba(21,28,39,.1)` — três tons para linhas de 1 px.
5. Danger: `--red #ff0000` (texto Negado, erros, cancelar-link) vs `--danger-solid #ef4444` (botões, lixeira, badge alerta). Regra implícita (ver V3).
6. Escalas de tamanho paralelas: tokens `--fs-*`, `--radius-*` convivem com `calc(N * var(--px,1px))` (Frota) e `px` literais (Funcionário).
7. Sombra: `--shadow 0 1px 0` (token) vs `0 1px 0 rgba(0,0,0,.1)` literal em `EquipePage.module.css:58` e `MachineDetailModal.module.css:62` (mesmo valor, sem token).

## 4. Itens que NÃO consegui verificar

- Cor e tamanho exatos de qualquer elemento do Figma (sem inspeção; só capturas).
- Ícones (sidebar, header, cards): comparação de forma/peso de traço exigiria zoom; o app usa SVG/lib não auditada aqui.
- Telas não abertas: admin/01 splash, 02 signup, 04 login colaborador; 02-visao-geral 02/03/05–11; 03-frota 02–04, 06–08; 04-equipe 02–07; 05-alertas 02–03; 06-outros 01–02; funcionário 01, 04, 05, 08, 09.
- Responsividade (breakpoints 767/900/1024 do app) — Figma só tem 2 larguras.
- Fonte: Host Grotesk carregada ✔; a fonte das capturas parece ser a mesma (glifos arredondados), mas não confirmei pesos 400/500/600/700 do Figma.

## 5. Prioridades sugeridas (não aplicadas)

1. Unificar "botão" (V1/inconsistência 1) — maior ganho visual repetido em 6+ telas.
2. Criar tokens `--grad-brand`, `--grad-hero`, `--shadow-btn-3d` (V4/V1).
3. Alinhar largura de modal de detalhe (550 → ~458) e painel Nova Máquina (400 → ~375) após medir no Figma (V12/V13).
4. Decidir cor do "Disponível" do funcionário (azul em `02`, verde em `03`) — pergunta de design, não de código (V5).
5. Fazer a escala `--fs-*` valer de fato ou corrigir o comentário `index.css:47`.
