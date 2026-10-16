# Cadastro de máquina e Equipe pela API Specification

## Problem Statement

A Visão Geral lê as máquinas da API (AD-009), mas cadastrar, editar e excluir só mexem no estado da página: um recarregamento desfaz tudo. A tela Equipe lê o mock `data/team.ts`; não existe rota para operador nem para o login do colaborador, que hoje só nasce pelo seed.

O modelo vigente é: o `operator` é a pessoa que retira a máquina; o `user` com role `colaborador` serve só para o login e aponta para o operador por `operadorId` (feature `employee-session`).

## Goals

- [ ] Máquina cadastrada, editada ou excluída na Visão Geral continua assim depois de recarregar a página.
- [ ] A Equipe lista, cria, edita e exclui funcionários (operadores) pela API, no escopo do usuário.
- [ ] O admin cria o login do funcionário, troca a senha e nega ou permite o acesso; acesso negado barra o login e as requisições do colaborador.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Setores da Equipe pela API | Não existe coleção `sector`; a seção de setores segue em mock |
| Mover máquina ou operador de filial por estas rotas | Não pedido; `PUT /api/forklifts/:id` já move máquina (só escopo empresa) |
| Trocar o `usuario` de um login existente | Não pedido; remove-se o login e cria-se outro |
| Botão de remover login na tela | O Figma não tem; "Acesso Negado" cobre o caso. A rota existe no backend |
| Exibir a senha do funcionário | A API só guarda o hash; a senha não volta em nenhuma resposta |
| Middleware de role nas rotas antigas e nas de máquina | Fora desta feature; só `/api/operators` exige admin (cria credenciais). Máquinas seguem AD-011: qualquer usuário do escopo |
| Histórico de uso e incidentes ao excluir | Sessões e incidentes antigos ficam; a sessão de máquina apagada já mostra `maquina: null` |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Campos do operador | `nome`, `matricula`, `telefone`, `cargo`, `horarioEntrada`, `horarioSaida` e `filialId` no `operator` | Dono: todos os campos do mock estão no Figma | y |
| Matrícula | O backend gera `EMP-NNN`, um acima da maior matrícula dos operadores da empresa; não é editável | O formulário não tem campo de matrícula (o mock gerava no front) | n |
| Corrida na matrícula | Dois cadastros simultâneos podem gerar a mesma matrícula; sem índice único | `ponytail:` no código; índice `{ empresaId, matricula }` quando o operador ganhar `empresaId` | n |
| Quem gerencia operador e login | `role: 'admin'`, com o operador numa filial do escopo (escopo empresa ou admin da filial) | Dono: admin da filial também | y |
| Colaborador nas rotas novas | 403 "Apenas administradores podem gerenciar a equipe." | As rotas novas criam credenciais; falha fechada | n |
| Acesso Permitido/Negado | Campo `acessoNegado` (boolean, padrão `false`) no `user` do login | Dono: flag que bloqueia o login sem apagar | y |
| Operador sem login | Aparece como "Negado"; o interruptor de acesso fica desabilitado até criar o login (editando e preenchendo usuário e senha) | Sem login ninguém entra | n |
| Login com acesso negado | `POST /api/auth/login` com senha certa responde 403 "Acesso negado." | O colaborador entende por que não entra | n |
| Token de quem teve acesso negado | O `autenticar` responde 401 "Não autenticado."; o front já desloga em 401 | O middleware relê o usuário a cada requisição (AD-010) | n |
| Excluir operador | Apaga o operador e o `user` com aquele `operadorId` | Dono: apaga o login junto | y |
| Regras do login | `usuario`: texto sem espaços, 3 a 40 caracteres, único (comparação exata, como o login). `senha`: 8 a 72 caracteres | Senhas do mock têm 8+ caracteres | n |
| Login criado | `role: 'colaborador'`, `nome` do operador, `empresaId` do escopo, `escopo: 'filiais'`, `filiaisIds: [filialId do operador]`, `senhaHash` por `gerarHashSenha` | Mesmo formato do seed | y |
| Endereço MAC | Texto obrigatório, sem espaços nas pontas, até 32 caracteres, gravado em maiúsculas; sem checar o formato (o seed usa 5 octetos) | Evita recusar os dados que já existem | n |
| Unicidade do MAC | Checagem antes de gravar (409) e índice único em `device.enderecoMac` | Pedido do dono; o índice exige que o banco não tenha MAC repetido | n |
| Unicidade da identificação | Mesma regra de `POST /api/forklifts`: identificação já usada em qualquer filial responde 409 | Reusa a regra existente | n |
| Nome do dispositivo | Gravado em `device.nome` e devolvido em `dispositivoConectado.nomeDispositivo` | O formulário já pede; sem isso o campo some ao recarregar | n |
| Filial no cadastro | A filial ativa da Sidebar; com "Todas as filiais" e mais de uma filial, o formulário mostra um campo Filial (padrão: a primeira da lista) | `resolverFilial` exige a filial nesse caso | n |
| Atualização otimista | Visão Geral: criar, editar e excluir aplicam na hora e desfazem com toast se a API falhar. Equipe: editar, excluir e acesso iguais; criar espera a API (são duas chamadas e o conflito de usuário precisa voltar ao formulário) | Dono: mesmo padrão de status e trava | n |
| Criar funcionário | Duas chamadas: `POST /api/operators` e `POST /api/operators/:id/login`. Se o login falhar, o funcionário fica na lista sem login e o toast avisa | Rotas separadas, pedidas pelo dono | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Máquina persistida pela Visão Geral ⭐ MVP

**User Story**: Como admin, quero cadastrar, editar e excluir máquinas na Visão Geral e ver isso depois de recarregar.

**Acceptance Criteria**:

1. WHEN `POST /api/machines` recebe `nome`, `identificacao` e `enderecoMac` válidos THEN the backend SHALL criar um `device` e um `forklift` na filial de `resolverFilial`, ligados por `dispositivoConectadoId`, e responder 201 com a máquina no formato do `GET /api/machines`.
2. WHEN uma máquina é criada THEN the backend SHALL gravar `status: 'disponivel'` e `categoriaId` igual à categoria da empresa ligada a `disponivel`, ou `null` se não houver.
3. IF `nome`, `identificacao` ou `enderecoMac` faltar ou vier vazio THEN the backend SHALL responder 400 sem gravar nada.
4. IF a `identificacao` já existe THEN the backend SHALL responder 409 "Já existe uma empilhadeira com a identificação \"<id>\"." sem gravar nada.
5. IF o `enderecoMac` (em maiúsculas) já existe em outro dispositivo THEN the backend SHALL responder 409 "Já existe um dispositivo com este endereço MAC." sem gravar nada.
6. WHEN `PUT /api/machines/:id` recebe `nome`, `identificacao`, `setor`, `nomeDispositivo` ou `enderecoMac` THEN the backend SHALL gravar só esses campos e responder 200 com a máquina atualizada.
7. IF o corpo do `PUT /api/machines/:id` traz `status`, `categoriaId`, `categoriaTravada`, `operadorConectadoId`, `sessaoIniciadaEm` ou outro campo fora da lista do critério 6 THEN the backend SHALL responder 400 "O campo '<campo>' não pode ser alterado por esta rota." sem gravar nada.
8. WHEN `DELETE /api/machines/:id` acha a máquina sem sessão aberta THEN the backend SHALL apagar o `forklift` e o `device` ligado e responder 200 `{ _id, message }`.
9. IF a máquina tem `workSession` com `fim: null` THEN `DELETE /api/machines/:id` SHALL responder 409 "Máquina com sessão aberta." sem apagar nada.
10. IF a máquina não existe ou está fora do escopo THEN `PUT` e `DELETE` SHALL responder 404 "Máquina não encontrada.".
11. WHEN o admin salva o cadastro na Visão Geral THEN the frontend SHALL mostrar a máquina na hora e trocá-la pela resposta da API.
12. IF a API recusa criar, editar ou excluir THEN the frontend SHALL voltar a lista ao estado anterior e mostrar um toast de erro (409 de exclusão: "Máquina com sessão aberta").

**Independent Test**: cadastrar uma máquina, recarregar a página e vê-la no grid; excluir uma em uso e ver o toast de sessão aberta.

---

### P1: Funcionários (operadores) pela API ⭐ MVP

**User Story**: Como admin, quero manter a lista de funcionários da minha filial na Equipe.

**Acceptance Criteria**:

1. WHEN `GET /api/operators` é chamado THEN the backend SHALL devolver os operadores das filiais do escopo, ordenados por `nome`, cada um com `id`, `matricula`, `nome`, `telefone`, `cargo`, `horarioEntrada`, `horarioSaida`, `filialId`, `usuario` (do login, ou `null`) e `acesso` (`Permitido` com login sem `acessoNegado`, senão `Negado`).
2. WHEN `GET /api/operators?filialId=<id>` é chamado THEN the backend SHALL devolver só os operadores dessa filial, se ela estiver no escopo (lista vazia se não estiver).
3. WHEN `POST /api/operators` recebe `nome` válido THEN the backend SHALL criar o operador na filial de `resolverFilial`, com a matrícula gerada, e responder 201 no formato do critério 1.
4. IF `nome` falta ou vem vazio, ou `horarioEntrada`/`horarioSaida` não está no formato `HH:mm` THEN the backend SHALL responder 400 sem gravar nada.
5. WHEN `PUT /api/operators/:id` recebe `nome`, `telefone`, `cargo`, `horarioEntrada` ou `horarioSaida` THEN the backend SHALL gravar só esses campos e responder 200; IF vier outro campo THEN SHALL responder 400 "O campo '<campo>' não pode ser alterado." sem gravar nada.
6. WHEN o `nome` do operador muda THEN the backend SHALL gravar o mesmo `nome` no login ligado.
7. WHEN `DELETE /api/operators/:id` acha o operador sem sessão aberta THEN the backend SHALL apagar o operador e o `user` com aquele `operadorId` e responder 200 `{ _id, message }`.
8. IF o operador tem `workSession` com `fim: null` THEN `DELETE /api/operators/:id` SHALL responder 409 "Operador com sessão aberta." sem apagar nada.
9. IF o operador não existe ou está fora do escopo THEN `PUT`, `DELETE` e as rotas de login SHALL responder 404 "Operador não encontrado.".
10. IF quem chama as rotas de `/api/operators` não tem `role: 'admin'` THEN the backend SHALL responder 403 "Apenas administradores podem gerenciar a equipe.".
11. WHEN a Equipe abre THEN the frontend SHALL buscar os funcionários da filial ativa, com skeleton durante a carga e erro com nova tentativa se falhar.
12. WHEN o admin edita ou exclui um funcionário THEN the frontend SHALL aplicar na hora e, se a API recusar, voltar ao estado anterior com toast de erro (409: "Funcionário com sessão aberta").

**Independent Test**: criar um funcionário na Equipe, recarregar e vê-lo com a matrícula gerada; excluir e vê-lo sumir após recarregar.

---

### P1: Login do colaborador pela Equipe ⭐ MVP

**User Story**: Como admin, quero dar ao funcionário um usuário e senha, trocar a senha e negar o acesso.

**Acceptance Criteria**:

1. WHEN `POST /api/operators/:id/login` recebe `usuario` e `senha` válidos THEN the backend SHALL criar o `user` colaborador ligado ao operador, com `senhaHash` de `gerarHashSenha`, e responder 201 com o operador (`usuario` preenchido, `acesso: 'Permitido'`).
2. IF o operador já tem login THEN `POST /api/operators/:id/login` SHALL responder 409 "Este operador já tem login.".
3. IF o `usuario` já existe em qualquer `user` THEN the backend SHALL responder 409 "Este usuário já está em uso." sem gravar nada.
4. IF `usuario` tem espaço ou fica fora de 3 a 40 caracteres, ou `senha` fica fora de 8 a 72 caracteres THEN the backend SHALL responder 400 sem gravar nada.
5. WHEN `PUT /api/operators/:id/login` recebe `senha` válida THEN the backend SHALL trocar o `senhaHash` e responder 200 com o operador.
6. WHEN `PUT /api/operators/:id/login` recebe `acessoNegado` booleano THEN the backend SHALL gravá-lo e responder 200 com `acesso` correspondente.
7. IF o operador não tem login THEN `PUT` e `DELETE /api/operators/:id/login` SHALL responder 404 "Operador sem login.".
8. WHEN `DELETE /api/operators/:id/login` é chamado THEN the backend SHALL apagar o `user` do operador e responder 200 com o operador (`usuario: null`, `acesso: 'Negado'`).
9. The backend SHALL nunca devolver `senha` nem `senhaHash` nas respostas de `/api/operators`.
10. IF o colaborador com `acessoNegado: true` faz login com a senha certa THEN `POST /api/auth/login` SHALL responder 403 "Acesso negado." sem token.
11. IF uma requisição autenticada vem de um `user` com `acessoNegado: true` THEN o `autenticar` SHALL responder 401 "Não autenticado.".
12. WHEN o admin cria um funcionário com usuário e senha THEN the frontend SHALL chamar o cadastro do operador e depois o do login; IF o login falhar THEN SHALL manter o funcionário na lista sem login e mostrar toast de erro.
13. WHEN o admin edita um funcionário e preenche a senha THEN the frontend SHALL trocar a senha; com a senha vazia SHALL manter a atual.
14. WHEN o admin alterna o acesso de um funcionário com login THEN the frontend SHALL gravar `acessoNegado` com atualização otimista e rollback com toast.
15. The frontend SHALL mostrar as chaves novas de i18n nos 7 idiomas, traduzidas.

**Independent Test**: criar o login de um funcionário, entrar em `/login/colaborador` com ele, negar o acesso na Equipe e ver o login seguinte recusado.

---

## Edge Cases

- IF o `id` da rota não é um ObjectId THEN the backend SHALL responder 400 "O ID fornecido não é um ObjectId válido do MongoDB.".
- IF o corpo traz chave começando com `$` THEN the backend SHALL responder 400 (`exigirSemOperadores`).
- IF o Mongo recusa por índice único (corrida no MAC ou no usuário) THEN the backend SHALL responder 409 com a mesma mensagem da checagem.
- WHEN o escopo do usuário é `filiais` com uma filial só e o corpo não traz `filialId` THEN the backend SHALL usar essa filial.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MACH-01 | P1 Máquina: criar forklift + device | Design | Implementing |
| MACH-02 | P1 Máquina: status inicial e categoria | Design | Implementing |
| MACH-03 | P1 Máquina: campos obrigatórios | Design | Implementing |
| MACH-04 | P1 Máquina: identificação repetida | Design | Implementing |
| MACH-05 | P1 Máquina: MAC repetido | Design | Implementing |
| MACH-06 | P1 Máquina: editar campos livres | Design | Implementing |
| MACH-07 | P1 Máquina: campos protegidos | Design | Implementing |
| MACH-08 | P1 Máquina: excluir forklift + device | Design | Implementing |
| MACH-09 | P1 Máquina: 409 com sessão aberta | Design | Implementing |
| MACH-10 | P1 Máquina: 404 fora do escopo | Design | Implementing |
| MACH-11 | P1 Máquina: front otimista | Design | Pending |
| MACH-12 | P1 Máquina: front rollback | Design | Pending |
| OPER-01 | P1 Operador: listar | Design | Implementing |
| OPER-02 | P1 Operador: filtro de filial | Design | Implementing |
| OPER-03 | P1 Operador: criar com matrícula | Design | Implementing |
| OPER-04 | P1 Operador: validação | Design | Pending |
| OPER-05 | P1 Operador: editar campos livres | Design | Implementing |
| OPER-06 | P1 Operador: nome no login | Design | Implementing |
| OPER-07 | P1 Operador: excluir com login | Design | Implementing |
| OPER-08 | P1 Operador: 409 com sessão aberta | Design | Implementing |
| OPER-09 | P1 Operador: 404 fora do escopo | Design | Implementing |
| OPER-10 | P1 Operador: só admin | Design | Implementing |
| OPER-11 | P1 Operador: Equipe carrega da API | Design | Pending |
| OPER-12 | P1 Operador: front otimista e rollback | Design | Pending |
| LOGIN-01 | P1 Login: criar | Design | Pending |
| LOGIN-02 | P1 Login: já tem login | Design | Pending |
| LOGIN-03 | P1 Login: usuário em uso | Design | Pending |
| LOGIN-04 | P1 Login: validação | Design | Pending |
| LOGIN-05 | P1 Login: trocar senha | Design | Pending |
| LOGIN-06 | P1 Login: acesso negado | Design | Implementing |
| LOGIN-07 | P1 Login: sem login 404 | Design | Pending |
| LOGIN-08 | P1 Login: remover | Design | Pending |
| LOGIN-09 | P1 Login: sem senha na resposta | Design | Pending |
| LOGIN-10 | P1 Login: auth recusa negado | Design | Implementing |
| LOGIN-11 | P1 Login: middleware recusa negado | Design | Implementing |
| LOGIN-12 | P1 Login: front cria operador + login | Design | Pending |
| LOGIN-13 | P1 Login: front troca senha | Design | Pending |
| LOGIN-14 | P1 Login: front alterna acesso | Design | Pending |
| LOGIN-15 | P1 Login: i18n 7 idiomas | Design | Pending |

**Coverage:** 39 total, 0 mapped to tasks, 39 unmapped ⚠️

---

## Success Criteria

- [ ] Nenhuma ação de cadastro, edição ou exclusão da Visão Geral e da Equipe (funcionários) se perde ao recarregar.
- [ ] Gates: Backend `tsc --noEmit` + `yarn test` (só `tests/unit`); Frontend `tsc -b`, `eslint .` e `vitest` verdes.
