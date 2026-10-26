# Auditoria Figma — admin: 01-autenticacao, 06-outros, nao-desenvolver

Somente leitura no código. Rotas em `Frontend/src/routes/appRoutes.tsx:55-61`; textos em `Frontend/src/locales/pt-BR/translation.json`.
Comparação visual feita sobre os PNGs; pixels/cores exatos: não verificado (app não foi executado).

| Tela | Status | Divergências | Evidência | Backend necessário? |
|---|---|---|---|---|
| 01-autenticacao/01-splash | NÃO IMPLEMENTADA | Não há splash (gradiente azul + logo centralizado). Nenhuma rota/componente/referência a "splash" em `Frontend/src` nem em `index.html`. | `appRoutes.tsx:55-61` (sem rota); grep "splash" sem resultados | Não |
| 01-autenticacao/02-signup-administrador | OK (ressalva menor) | Layout 2 colunas, abas, título, 3 campos, botão e hero com 3 cards batem com o Figma. Textos idênticos ao pt-BR. Ressalva: o hero está `display:none` no CSS base (aparece só em breakpoint maior) e o layout responsivo não existe no Figma (não verificado visualmente). Estado de sucesso/erro não existe no Figma. | `pages/SolicitarAcessoPage.tsx:158-208`; `components/auth/AuthLayout.tsx:246-277`; `AuthLayout.module.css:78-104`; `pt-BR/translation.json:183-205` | Já existe (`authService.solicitarAcesso`) |
| 01-autenticacao/03-login-administrador | OK | Título "Bem-vindo de volta", subtítulo, abas, Email empresarial, Senha, "Esqueceu a senha? Clique aqui!", botão Entrar e hero batem. Observação: o link "Esqueceu a senha?" é `button type="button"` sem ação (fluxo de recuperação não existe; Figma só mostra o link). | `pages/LoginPage.tsx:52-90` (link sem handler em `:83-85`); `pt-BR/translation.json:172-182` | Recuperação de senha: sim, se for desenvolvida (não verificado se há endpoint) |
| 01-autenticacao/04-login-colaborador | DIVERGENTE | Subtítulo: Figma mostra o mesmo texto do admin ("Acesse sua conta para acompanhar sua operação, visualizar suas atividades e manter tudo sob controle."); o código usa outro ("...acompanhar suas atividades, receber alertas e trabalhar com mais segurança durante sua operação."). Demais itens (aba Colaborador ativa, Usuário/placeholder, Senha, esqueceu a senha, Entrar) batem. Link "Esqueceu" sem ação. | `pages/LoginPage.tsx:55`; `pt-BR/translation.json:174` vs `:173` | Não |
| 06-outros/01-feedback-e-sugestoes | NÃO IMPLEMENTADA | Existe só o botão "Feedback & Sugestões" na sidebar, sem `onClick` e sem modal. Faltam: modal com título "Envie-nos feedback ou uma sugestão", botão fechar (X), label "Como foi sua experiência?", textarea com placeholder, botão Enviar. Há chaves i18n apenas para a tela do funcionário (`employee.settings.feedback*`), e lá é textarea inline, não o modal. | `components/layout/Sidebar.tsx:219-230` (botão sem handler); `pt-BR/translation.json:21`, `:378-379` | **Sim** (endpoint para receber/guardar feedback; não verificado se existe) |
| 06-outros/02-politica-e-privacidade | NÃO IMPLEMENTADA | Não há página. O link da sidebar aponta para `/politicas-privacidade`, mas não há rota (cai no 404). Também não está em `AUTH_ROUTES`/layout standalone. Faltam: cabeçalho com logo + "Voltar à tela inicial", metadados (Última atualização, Empresa), conteúdo longo com seções numeradas. Botão "Política e Privacidade" do funcionário também sem ação. | `components/layout/Sidebar.tsx:232`; `appRoutes.tsx:55-61` (sem rota; `path="*"` NotFoundPage); `pages/employee/EmployeeSettingsPage.tsx:78-80` | Não (conteúdo estático); texto jurídico completo vem do Figma/dono |
| nao-desenvolver/cadastrar-maquina | NÃO-DESENVOLVER | Dono decidiu não desenvolver. Observação informativa: já existe painel equivalente `NewMachinePanel` (modo criar) com diferenças (labels "Nome"/"ID"/botão "Salvar" vs "Empilhadeira"/"Código"/"Criar Empilhadeira"; sem campo "Tempo uso (Horas)"; Setor é select, no Figma é input). Sem ação. | `components/machines/NewMachinePanel.tsx:111-194`; `pt-BR/translation.json:38-44` | — |
| nao-desenvolver/editar-maquina | NÃO-DESENVOLVER | Dono decidiu não desenvolver. Informativo: modo edição do mesmo painel existe; labels "Empilhadeira/Código/Endereço Mac" e botão "Editar Empilhadeira" batem; falta "Tempo uso (Horas)". Sem ação. | `NewMachinePanel.tsx:60-61,113,125,175,189`; `pt-BR/translation.json:57-64` | — |

## Contagem
- OK: 2 (signup, login admin)
- DIVERGENTE: 1 (login colaborador)
- NÃO IMPLEMENTADA: 3 (splash, feedback, política de privacidade)
- NÃO-DESENVOLVER: 2

## Não verificado
- Fidelidade de cores/tamanhos/espaçamentos e responsivo (app não executado; só leitura de código/CSS).
- Existência de endpoint backend para feedback e recuperação de senha.
