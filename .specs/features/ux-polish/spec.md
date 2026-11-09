# Polimento de experiência (loadings, feedbacks e selects) Specification

## Problem Statement

Várias telas do front não mostram o que está acontecendo. O histórico do modal de máquina (aba de alertas) abre em branco e, uns segundos depois, a lista aparece do nada; se a busca falha, mostra "sem registros" como se não houvesse nada. O funcionário encerra a sessão e só vê o botão desabilitado, sem spinner nem aviso. Formulários de equipe, setor e máquina, a troca de status, a trava de categoria e as ações de filial não mostram progresso nem confirmação de sucesso. Os nove `<select>` do sistema são o HTML cru: a lista de opções é desenhada pelo navegador, sem o arredondamento e as cores do resto da interface. O modal de máquina também tem texto fixo em inglês ("Date:") fora do i18n.

## Goals

- [ ] Toda busca de dados aberta pelo usuário mostra um estado de carregamento e, se falhar, um estado de erro com "tentar de novo".
- [ ] Toda ação que muda dados (salvar, excluir, encerrar sessão, trocar status, travar categoria, ações de filial) mostra progresso enquanto roda e avisa o resultado (sucesso ou erro) por toast.
- [ ] Todos os selects usam um componente único, com a caixa de opções no padrão visual do sistema (cantos arredondados, cores do tema, claro/escuro) e navegação por teclado.
- [ ] Nenhum texto visível ao usuário fica fora do i18n (7 idiomas).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Redesenhar telas, mudar layout ou cores do tema | Só polir o que existe, com os tokens atuais |
| Mudanças no Backend e nos contratos da API | Tudo é feito no front |
| Trocar `<input type="date">` por um seletor próprio | O seletor nativo de data segue como está |
| Atualização otimista com desfazer (undo) | Fora de "pequenos ajustes" |
| Skeletons novos para páginas inteiras que já têm | `PageSkeleton` e `EmployeeSkeleton` ficam como estão |
| Limpeza dos docs desatualizados e da seção "DEV" da Sidebar | Feature separada, já combinada |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Como estilizar o select | Componente próprio `Select` (botão + lista com `role="listbox"`), não o `<select>` nativo | O popup nativo não aceita borda arredondada em Firefox e Safari; `appearance: base-select` só existe no Chromium recente | n |
| Select dentro de `<label>` e formulários | O componente expõe `id`, `value`, `onChange(valor)`, `disabled` e rótulo acessível; os formulários trocam o `<select>` sem mudar a regra de validação | Menor mudança nos formulários | n |
| Carregamento de listas dentro de modal | Linhas de skeleton no lugar da lista, com a altura da lista final (sem o conteúdo "pular") | Padrão já usado em `PageSkeleton` | n |
| Falha na busca do histórico | Mensagem de erro dentro do painel e botão "Tentar de novo"; não vira "sem registros" | Hoje o erro é engolido e mostra vazio | n |
| Progresso em botão | Botão desabilitado com spinner (ícone `Loader2` do lucide, já instalado) e o texto trocado por "Salvando…"/"Encerrando…" | Reaproveita lucide e os botões de `DialogButtons.module.css` | n |
| Feedback de sucesso | Toast (`useToast`) com texto de i18n; erro continua em `showError` | `ToastProvider` já existe | n |
| Encerrar sessão | Toast de sucesso "Sessão encerrada" e redirecionamento para `/funcionario`; durante a chamada o botão mostra spinner | Hoje só desabilita | n |
| Iniciar sessão | Mesmo tratamento do encerrar (spinner no botão de iniciar e toast) | Mesma lacuna, mesma tela | n |
| Troca de status e trava no modal | O select/botão ficam desabilitados com spinner até a resposta; toast de sucesso ou erro; se der erro, volta ao valor anterior | Hoje não há resposta visual | n |
| Auditoria | A lista de lacunas abaixo vem de leitura do código; a execução começa por um levantamento completo (tela a tela) que pode somar itens, registrados em `tasks.md` | O dono pediu varredura de todo o sistema | n |
| Textos novos | Chaves nos 7 idiomas (`pt`, `en` e os outros 5 já existentes) | i18next é padrão do projeto | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Carregamento e erro nas buscas dentro de modais e telas ⭐ MVP

**User Story**: Como usuário, quero ver que a informação está carregando e saber quando falhou, em vez de ver o painel em branco e a lista surgir de repente.

**Acceptance Criteria**:

1. WHEN o modal de máquina abre ou o período do histórico muda THEN the frontend SHALL mostrar linhas de skeleton no painel do histórico até a busca terminar.
2. WHEN a busca do histórico termina com sucesso THEN the frontend SHALL trocar o skeleton pela lista, ou pelo texto "sem registros" se a lista vier vazia.
3. IF a busca do histórico falha THEN the frontend SHALL mostrar uma mensagem de erro e o botão "Tentar de novo" no painel, e não mostrar "sem registros".
4. WHEN o usuário aciona "Tentar de novo" THEN the frontend SHALL repetir a busca mostrando o skeleton de novo.
5. WHILE o skeleton do histórico está visível THEN the frontend SHALL marcar o painel com `aria-busy="true"`.
6. The frontend SHALL aplicar o mesmo tratamento (carregando, erro com nova tentativa) a toda outra busca disparada por abertura de modal, painel ou folha encontrada no levantamento.

**Independent Test**: abrir o modal de uma máquina com a rede limitada e ver o skeleton; derrubar a rede e ver o erro com "Tentar de novo".

---

### P1: Feedback ao encerrar e iniciar sessão (funcionário) ⭐ MVP

**User Story**: Como funcionário, quero saber que o encerramento da sessão está em andamento e que deu certo.

**Acceptance Criteria**:

1. WHEN o funcionário aciona "Encerrar sessão" THEN the frontend SHALL desabilitar os dois botões da tela e mostrar spinner e o texto de andamento no botão de encerrar.
2. WHEN o encerramento termina com sucesso THEN the frontend SHALL mostrar o toast "Sessão encerrada" e levar o funcionário para `/funcionario`.
3. IF o encerramento falha THEN the frontend SHALL reabilitar os botões, manter a tela e mostrar o toast de erro (`employee.session.endError`).
4. WHEN o funcionário aciona "Iniciar" numa máquina THEN the frontend SHALL mostrar spinner no botão e desabilitá-lo até a resposta, e SHALL mostrar o toast "Sessão iniciada" ao ter sucesso.
5. The frontend SHALL impedir um segundo envio enquanto a chamada está em andamento.

**Independent Test**: com a rede lenta, encerrar a sessão: spinner, depois toast e volta para o início; derrubar a rede: erro e botões liberados.

---

### P1: Progresso e resultado em toda ação que muda dados ⭐ MVP

**User Story**: Como admin, quero ver que minha ação está rodando e se funcionou.

**Acceptance Criteria**:

1. WHEN o usuário envia um formulário de funcionário, setor, máquina ou categoria THEN the frontend SHALL desabilitar os campos e o botão de confirmar e mostrar spinner no botão até a resposta.
2. WHEN a resposta é sucesso THEN the frontend SHALL fechar o formulário e mostrar o toast de sucesso; IF falha THEN the frontend SHALL manter o formulário aberto com os dados e mostrar o toast de erro.
3. WHEN o usuário confirma uma exclusão (máquina, categoria, funcionário, setor, filial) THEN the frontend SHALL mostrar spinner no botão de confirmar e desabilitar o cancelar até a resposta.
4. WHEN o usuário troca o status da máquina no modal THEN the frontend SHALL desabilitar o controle com spinner até a resposta, mostrar toast de sucesso, e IF falha THEN SHALL voltar ao status anterior e mostrar toast de erro.
5. WHEN o usuário trava ou destrava a categoria da máquina THEN the frontend SHALL aplicar o mesmo tratamento do item 4.
6. WHEN o usuário cria, renomeia ou remove uma filial pelo seletor de filial THEN the frontend SHALL mostrar progresso no item acionado e toast de sucesso ou erro.
7. The frontend SHALL impedir envio duplo enquanto a chamada está em andamento.

**Independent Test**: em cada formulário, enviar com a rede lenta e ver spinner, bloqueio dos campos e toast; derrubar a rede e ver erro com o formulário preservado.

---

### P1: Select padronizado ⭐ MVP

**User Story**: Como usuário, quero que os selects tenham o mesmo visual do resto do sistema, com a lista de opções arredondada.

**Acceptance Criteria**:

1. The frontend SHALL ter um componente `Select` único que renderiza o botão e a lista de opções com os tokens de cor, borda e raio do tema, em tema claro e escuro.
2. The frontend SHALL trocar os nove `<select>` (`NewMachinePanel` ×2, `EmployeeFormModal`, `SectorFormModal`, `MachineDetailModal`, `VisaoGeralPage` ×2, `EquipePage`, `FrotaPage` ×2) pelo componente `Select`, sem mudar a regra de cada tela.
3. WHEN o usuário clica no botão do `Select`, ou usa Enter, Espaço ou seta para baixo com o foco nele THEN the frontend SHALL abrir a lista, com a opção atual destacada.
4. WHILE a lista está aberta THEN the frontend SHALL permitir navegar com setas, Home e End, escolher com Enter e fechar com Esc ou clique fora, devolvendo o foco ao botão.
5. WHEN o usuário escolhe uma opção THEN the frontend SHALL chamar `onChange` com o valor e fechar a lista.
6. WHILE o `Select` está desabilitado THEN the frontend SHALL não abrir a lista e mostrar o estilo de desabilitado.
7. The frontend SHALL expor `role="combobox"` no botão, `role="listbox"`/`role="option"` na lista e `aria-selected` na opção atual.
8. IF a lista não cabe abaixo do botão na janela THEN the frontend SHALL abri-la para cima.
9. The frontend SHALL manter, nos formulários, o rótulo associado ao campo (clique no rótulo foca o `Select`).

**Independent Test**: em cada tela com select, abrir a lista e ver cantos arredondados; escolher com mouse e com teclado; repetir no tema escuro.

---

### P2: Textos fixos fora do i18n

**User Story**: Como usuário de outro idioma, quero ver a interface toda traduzida.

**Acceptance Criteria**:

1. The frontend SHALL trocar o texto fixo "Date:" do modal de máquina por uma chave de i18n nos 7 idiomas.
2. The frontend SHALL trocar o sufixo fixo "(ID)" do código da máquina no modal por uma chave de i18n.
3. WHEN o levantamento achar outro texto visível fixo no código dos componentes e páginas THEN the frontend SHALL movê-lo para o i18n nos 7 idiomas.

**Independent Test**: trocar o idioma e abrir o modal de máquina: nenhum texto em inglês fixo.

---

### P2: Levantamento completo e acabamento restante

**User Story**: Como dono, quero que todas as pequenas lacunas de experiência sejam encontradas e tratadas, não só as que citei.

**Acceptance Criteria**:

1. WHEN a execução começa THEN the team SHALL percorrer cada página e componente com ação assíncrona ou lista e registrar em `tasks.md` toda lacuna de loading, erro, vazio, feedback de sucesso ou estilo (select, botão desabilitado, foco) ainda não coberta.
2. The frontend SHALL tratar cada lacuna registrada com o mesmo padrão dos itens acima (skeleton ou spinner, toast, estado de erro com nova tentativa).
3. WHEN um botão está desabilitado por estar em andamento THEN the frontend SHALL mostrar o cursor `not-allowed` e `aria-busy="true"` no botão.
4. WHILE um controle tem foco por teclado THEN the frontend SHALL mostrar o anel de foco do tema (`focus-visible`) em todos os botões e campos tratados.

**Independent Test**: conferir a lista final de `tasks.md` contra as telas e ver cada item marcado.

---

## Edge Cases

- WHEN o usuário fecha o modal ou troca o período antes de a busca terminar THEN the frontend SHALL descartar a resposta antiga e não mostrar dados do período anterior.
- WHEN o componente desmonta durante uma ação THEN the frontend SHALL não atualizar o estado nem mostrar toast duplicado.
- IF a rede cai no meio da ação THEN the frontend SHALL tratá-la como falha (toast de erro e controles liberados), sem ficar em spinner para sempre.
- WHEN a lista do `Select` tem muitas opções THEN the frontend SHALL limitar a altura e rolar dentro da lista.
- WHEN o usuário digita uma letra com a lista aberta THEN the frontend SHALL ir para a primeira opção que começa com ela.
- WHEN o usuário prefere movimento reduzido THEN the frontend SHALL desligar as animações de spinner e de abrir a lista, mantendo o estado visível.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| UXP-01 | P1: Carregamento e erro nas buscas dentro de modais e telas | Design | Pending |
| UXP-02 | P1: Feedback ao encerrar e iniciar sessão (funcionário) | Design | Pending |
| UXP-03 | P1: Progresso e resultado em toda ação que muda dados | Design | Pending |
| UXP-04 | P1: Select padronizado | Design | Pending |
| UXP-05 | P2: Textos fixos fora do i18n | - | Pending |
| UXP-06 | P2: Levantamento completo e acabamento restante | - | Pending |

**Coverage:** 6 total, 0 mapped to tasks, 6 unmapped ⚠️

---

## Success Criteria

- [ ] Abrir o modal de máquina mostra skeleton e depois a lista, sem painel em branco; falha mostra erro com "Tentar de novo".
- [ ] Encerrar e iniciar sessão mostram spinner e toast.
- [ ] Nenhuma ação que muda dados fica sem progresso e sem resultado visível.
- [ ] Os nove selects abrem uma lista arredondada no padrão do tema, com teclado completo.
- [ ] Nenhum texto fixo visível fora do i18n nos 7 idiomas.
- [ ] `yarn test`, `yarn lint` e `yarn build` do Frontend passam.
