# Categorias da Frota e status da máquina Specification

## Problem Statement

O kanban da Frota (`FrotaPage`) guarda as categorias só em memória: recarregar a página perde o que o usuário organizou, e cada admin vê um quadro diferente. O status da máquina é um texto livre em `device.status`, escrito só pelo seed, sem regra de quem muda nem de onde vem. O dono quer que o status venha do hardware (um impacto lido pelo dispositivo vira alerta), que a categoria defina para qual coluna do kanban cada status leva a máquina, e que a pessoa consiga ajustar à mão e travar uma máquina numa coluna.

## Goals

- [ ] O status da máquina fica gravado no backend e muda por leitura do dispositivo ou por ajuste manual.
- [ ] Cada categoria pode estar ligada a status; uma mudança de status leva a máquina destravada para a coluna ligada a ele.
- [ ] Uma máquina travada não sai da categoria por mudança de status.
- [ ] O quadro de categorias da empresa sobrevive a recarregar a página e é o mesmo para todos os usuários da empresa.
- [ ] Todo card mostra o selo do status real, com rótulo e cor próprios, separado da cor da categoria.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Rotas de iniciar/encerrar sessão do funcionário | Segunda feature (decisão do dono); `em_uso` aqui só muda à mão |
| Ocorrência registrada pelo funcionário | Segunda feature |
| Autenticação própria do dispositivo IoT | `POST /api/telemetry` segue exigindo o token de usuário (pendência do AD-010); a regra de leitura é testada com esse token |
| Offline por falta de leitura (heartbeat) | Exige tarefa agendada; `offline` aqui só muda à mão |
| Histórico de mudanças de status | Não pedido; guarda só o status atual e quando mudou |
| Reordenar categorias ou máquinas dentro da categoria | Não pedido; categorias saem na ordem de criação e máquinas por `identificacao` |
| Área do funcionário, histórico de alertas e reparos lendo a API | Seguem em mock; só ganham o novo formato de status |
| Cadastro, edição e exclusão de máquina persistidos | Seguem em memória na Visão Geral |
| Nível de urgência real do alerta | Não há regra de urgência por força; o card mostra "Urgente" fixo |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Dono do quadro | Categorias pertencem à empresa (`empresaId`); todas as filiais usam as mesmas | Decisão do dono: evitar kanbans diferentes entre filiais | y |
| Máquinas exibidas | A Frota lista só as máquinas da filial ativa; com "Todas as filiais" lista todas as do escopo, igual à Visão Geral | Decisão do dono | y |
| Quem gerencia categorias | Só `escopo: 'empresa'` cria, renomeia, recolore, liga status e exclui (403 para os demais) | Decisão do dono; mesmo padrão de filiais | y |
| Quem move, troca status e trava | Qualquer usuário autenticado, nas máquinas do seu escopo | Decisão do dono ("todos movem") estendida ao status e à trava | y |
| Origem do status | Gravado na empilhadeira (`forklift.status`), mudado por leitura do dispositivo ou à mão | Decisão do dono: hardware define, pessoa ajusta | y |
| Valores do status | `disponivel`, `em_uso`, `manutencao`, `alerta`, `offline`; o front traduz por `machines.status.<codigo>` | "alerta" é o termo do dono para impacto detectado; códigos sem acento evitam o problema atual de tradução | y |
| Regra de leitura | O backend decide: leitura com `forcaImpacto` maior ou igual ao limite muda o status para `alerta` e cria `incident` `pendente` | Decisão do dono ("leituras, back decide") | y |
| Limite de impacto | `LIMITE_IMPACTO` no `.env`, padrão `5` (mesma unidade de `incident.forcaImpacto`) | O seed usa forças de 3 a 9; precisa de ajuste no campo, então fica configurável | y |
| Leitura abaixo do limite | Grava a telemetria e não muda o status | Só impacto tem regra nesta feature | y |
| Sair de `alerta` | Só à mão (a pessoa troca o status); a mudança manual para fora de `alerta` marca como `resolvido` os incidentes pendentes da máquina | Alerta não pode sumir sozinho | y |
| Impacto com status `manutencao` ou `offline` | Também vira `alerta` | Segurança primeiro | y |
| Ligação categoria-status | Cada categoria tem `statusVinculados: string[]` (pode ser vazia); um status fica ligado a no máximo uma categoria da empresa (409 se repetir) | Uma mudança de status precisa de um destino único | y |
| Mudança de status em máquina destravada | Vai para a categoria ligada ao novo status; se nenhuma categoria liga o status, fica onde está | Decisão do dono | y |
| Mudança de status em máquina travada | Fica na categoria atual | Decisão do dono | y |
| Trava | Campo `categoriaTravada: boolean` por máquina, padrão `false`, ligado e desligado pela pessoa | Decisão do dono | y |
| Mover à mão liga a trava? | Não; mover à mão só muda a categoria, a trava é uma ação separada | O dono descreveu a trava como controle explícito | y |
| Mudança de status igual ao atual | Não move a máquina nem muda `statusAlteradoEm` | Evita que uma leitura repetida desfaça um ajuste manual | y |
| Quadro inicial | Acidentes (`#EF4444`, liga `alerta`), Ativas (`#3A9CFF`, liga `em_uso`), Manutenção (`#FFC93A`, liga `manutencao`) e Disponíveis (`#22C55E`, liga `disponivel`); `offline` sem ligação; as máquinas entram pela regra | Decisão do dono; casa com o Figma | y |
| Nome das categorias iniciais | Guardam `chave` (`acidentes`, `ativas`, `manutencao`, `disponiveis`) e o front traduz por `fleet.category*`; ao renomear, `chave` vira `null` | Mantém os 7 idiomas | y |
| Confusão nome x status | Nome livre; todo card mostra o selo do status real; a cor do cabeçalho do card vem do status, nunca da categoria | Decisão do dono | y |
| Destaque do card | Segue o status: `alerta` mostra "Urgente" e a data do incidente pendente mais recente; `em_uso` mostra tempo de sessão; `disponivel` mostra horas semanais; `manutencao` mostra o MAC; `offline` sem destaque | Separa o card da categoria | y |
| Máquina sem categoria | `categoriaId: null`; o front oferece em "Adicionar máquinas" como hoje | Comportamento atual | y |
| Excluir categoria | As máquinas dela ficam sem categoria e sem trava; qualquer categoria pode ser excluída, inclusive as iniciais | A categoria é organização; o status não depende dela | y |
| Nome da categoria | Obrigatório, cortado nas pontas, até 40 caracteres, único por empresa sem diferenciar maiúscula de minúscula (409) | Regra de duplicado do front atual | y |
| Cor da categoria | `^#[0-9a-fA-F]{6}$`, 400 caso contrário | `isHexColor` do front atual | y |
| Dados antigos | Script `migrate:status`: copia o `device.status` antigo para `forklift.status` (`Disponível`→`disponivel`, `Em uso`→`em_uso`, `Manutenção`→`manutencao`, `Offline`→`offline`; máquina sem device → `offline`) e cria o quadro inicial das empresas sem categorias | Preserva o que a tela mostra hoje; rodar de novo não altera nada | y |
| Seed | Grava `forklift.status` direto do dataset; EMP-081, EMP-085 e EMP-089 ficam `alerta` com 1 incidente pendente; as demais só com incidentes `resolvido` | O seed atual põe 1 incidente pendente em toda máquina | y |
| `device.status` | Deixa de ser lido pela API; continua no schema e não é apagado | Remoção fica para quando o hardware definir o campo | y |
| Campos protegidos em `PUT /api/forklifts/:id` | `status`, `statusAlteradoEm`, `categoriaId`, `categoriaTravada` e `sessaoIniciadaEm` são recusados ali (400) | Hoje esse PUT aceita qualquer campo e contornaria as regras | y |
| Concorrência | Última escrita vence | Volume baixo; sem trava de banco | y |
| Falha ao salvar no front | Atualização otimista: muda na hora e, se a API falhar, volta ao estado anterior e mostra aviso de erro | Arrastar precisa responder na hora | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Status gravado e trocado à mão ⭐ MVP

**User Story**: As a admin, I want ver e ajustar o status da máquina so that eu corrija o que o hardware informou ou encerre um alerta.

**Why P1**: É a base: sem status gravado nada move no kanban.

**Acceptance Criteria**:

1. The `GET /api/machines` SHALL devolver em cada máquina `status` (um de `disponivel`, `em_uso`, `manutencao`, `alerta`, `offline`), `categoriaId` (texto ou `null`) e `categoriaTravada` (booleano).
2. IF a empilhadeira não tem `status` gravado THEN the API SHALL devolver `status: 'disponivel'`.
3. WHEN o status é `alerta` THEN the API SHALL devolver `alertaEm` com a `dataIncidente` (ISO 8601) do incidente pendente mais recente da máquina, ou `null` se não houver.
4. WHEN `PUT /api/machines/:id/status` recebe `{ status }` válido diferente do atual para uma máquina do escopo THEN the API SHALL gravar o status e `statusAlteradoEm` e responder 200 com a máquina no formato de `GET /api/machines`.
5. IF `status` não é um dos 5 códigos THEN the API SHALL responder 400 sem gravar.
6. IF a máquina não existe ou está fora do escopo do usuário THEN the API SHALL responder 404.
7. WHEN o status muda à mão de `alerta` para outro THEN the API SHALL marcar como `resolvido` os incidentes `pendente` da máquina.
8. WHEN `PUT /api/machines/:id/status` recebe o mesmo status atual THEN the API SHALL responder 200 sem mudar `statusAlteradoEm` nem `categoriaId`.
9. IF `PUT /api/forklifts/:id` recebe `status`, `statusAlteradoEm`, `categoriaId`, `categoriaTravada` ou `sessaoIniciadaEm` THEN the API SHALL responder 400 sem gravar.
10. WHEN o usuário escolhe um status no detalhe da máquina (Visão Geral ou Frota) THEN the front SHALL chamar a rota e mostrar o novo selo.

**Independent Test**: Trocar o status de uma máquina `alerta` para `disponivel` pelo detalhe muda o selo e deixa os incidentes dela como `resolvido`.

---

### P1: Leitura de impacto vira alerta ⭐ MVP

**User Story**: As a dono da frota, I want que um impacto lido pelo dispositivo coloque a máquina em alerta so that o problema apareça sem ninguém digitar nada.

**Why P1**: É o exemplo central do dono para "o hardware define o status".

**Acceptance Criteria**:

1. The `POST /api/telemetry` SHALL aceitar `forcaImpacto` numérico opcional, além de `dispositivoId` e `dataDados`.
2. WHEN uma leitura chega com `forcaImpacto` maior ou igual a `LIMITE_IMPACTO` THEN the API SHALL criar um `incident` `pendente` com a empilhadeira ligada ao dispositivo, o operador conectado, a filial da empilhadeira, `forcaImpacto` e `dataIncidente = dataDados`.
3. WHEN uma leitura chega com `forcaImpacto` maior ou igual a `LIMITE_IMPACTO` THEN the API SHALL mudar o status da empilhadeira ligada ao dispositivo para `alerta`, qualquer que seja o status atual.
4. WHEN uma leitura chega sem `forcaImpacto` ou abaixo do limite THEN the API SHALL gravar a telemetria sem mudar o status.
5. IF `forcaImpacto` não é número finito maior ou igual a 0 THEN the API SHALL responder 400 sem gravar.
6. IF nenhuma empilhadeira está ligada ao dispositivo THEN the API SHALL gravar a telemetria sem criar incidente nem mudar status.
7. WHERE `LIMITE_IMPACTO` não está no `.env` THE API SHALL usar o limite `5`.

**Independent Test**: `POST /api/telemetry` com `forcaImpacto: 7` para o dispositivo de EMP-083 deixa EMP-083 em `alerta` e cria 1 incidente pendente.

---

### P1: Categorias da empresa ligadas a status ⭐ MVP

**User Story**: As a admin da empresa, I want criar categorias e ligar cada uma a status so that o kanban se organize sozinho pelo estado das máquinas.

**Why P1**: É o que transforma o status em coluna.

**Acceptance Criteria**:

1. WHEN `GET /api/categories` é chamado THEN the API SHALL responder 200 com `[{ _id, nome, cor, chave, statusVinculados }]` das categorias da empresa do usuário, na ordem de criação.
2. WHEN um usuário com `escopo: 'empresa'` chama `POST /api/categories` com `{ nome, cor, statusVinculados? }` válidos THEN the API SHALL criar a categoria na empresa dele e responder 201 com ela (`statusVinculados` padrão `[]`).
3. WHEN um usuário com `escopo: 'empresa'` chama `PUT /api/categories/:id` com `nome`, `cor` e/ou `statusVinculados` válidos THEN the API SHALL atualizar e responder 200; ao mudar o `nome`, `chave` SHALL virar `null`.
4. WHEN um usuário com `escopo: 'empresa'` chama `DELETE /api/categories/:id` THEN the API SHALL deixar as empilhadeiras dessa categoria com `categoriaId: null` e `categoriaTravada: false`, apagar a categoria e responder 200 com `{ _id, message }`.
5. IF um usuário com `escopo: 'filiais'` chama `POST`, `PUT` ou `DELETE` em `/api/categories` THEN the API SHALL responder 403 sem gravar.
6. IF `nome` é vazio depois de cortar as pontas ou passa de 40 caracteres THEN the API SHALL responder 400.
7. IF `cor` não casa `^#[0-9a-fA-F]{6}$` THEN the API SHALL responder 400.
8. IF `statusVinculados` não é lista de códigos de status válidos e sem repetição THEN the API SHALL responder 400.
9. IF algum status de `statusVinculados` já está ligado a outra categoria da empresa THEN the API SHALL responder 409.
10. IF já existe categoria na empresa com o mesmo nome, sem diferenciar maiúscula de minúscula THEN the API SHALL responder 409.
11. IF a categoria não existe ou é de outra empresa THEN the API SHALL responder 404 em `PUT` e `DELETE`.
12. The API SHALL recusar com 400 corpo com chave iniciada por `$`.
13. WHEN a ligação de status de uma categoria muda THEN the API SHALL não mover nenhuma máquina.

**Independent Test**: Admin de empresa cria "Pátio" ligada a `offline`, recarrega a Frota e "Pátio" continua lá; admin de filial vê a linha sem os botões de gerenciar.

---

### P1: Status move a máquina, trava segura ⭐ MVP

**User Story**: As a admin, I want que a máquina vá sozinha para a coluna do novo status, a não ser que eu a trave so that o kanban se atualize sem desfazer o que fixei.

**Why P1**: É a regra pedida pelo dono.

**Acceptance Criteria**:

1. WHEN o status de uma máquina com `categoriaTravada: false` muda (à mão ou por leitura) e uma categoria da empresa liga o novo status THEN the API SHALL gravar o `categoriaId` dessa categoria.
2. WHEN o status de uma máquina com `categoriaTravada: false` muda e nenhuma categoria liga o novo status THEN the API SHALL manter o `categoriaId`.
3. WHILE a máquina tem `categoriaTravada: true` the API SHALL manter o `categoriaId` quando o status mudar.
4. WHEN `PUT /api/machines/:id/trava` recebe `{ categoriaTravada: true | false }` para uma máquina do escopo THEN the API SHALL gravar e responder 200 com a máquina.
5. IF `categoriaTravada` não é booleano THEN the API SHALL responder 400 sem gravar.
6. WHEN a trava é desligada THEN the API SHALL manter o `categoriaId` atual (a máquina só move na próxima mudança de status).
7. WHEN o usuário liga ou desliga a trava no card ou no detalhe THEN the front SHALL chamar a rota e mostrar o ícone de cadeado no card enquanto a trava está ligada.

**Independent Test**: Travar EMP-082 em "Ativas" e mandar um impacto para o dispositivo dela deixa o selo em "Alerta" e o card em "Ativas"; sem a trava, o card vai para "Acidentes".

---

### P1: Mover máquinas à mão ⭐ MVP

**User Story**: As a admin, I want mover máquinas entre categorias livremente so that eu ajuste o kanban sem mexer no status.

**Why P1**: Ajuste manual pedido pelo dono.

**Acceptance Criteria**:

1. WHEN `PUT /api/machines/categoria` recebe `{ machineIds: [...], categoriaId }` com máquinas do escopo e categoria da empresa THEN the API SHALL gravar esse `categoriaId` em todas e responder 200 com as máquinas atualizadas.
2. WHEN `categoriaId` é `null` THEN the API SHALL tirar as máquinas de qualquer categoria.
3. IF alguma máquina da lista não existe ou está fora do escopo THEN the API SHALL responder 404 e não gravar nenhuma.
4. IF a categoria não existe ou é de outra empresa THEN the API SHALL responder 404 e não gravar nenhuma.
5. IF `machineIds` não é uma lista não vazia de ObjectIds THEN the API SHALL responder 400.
6. WHEN uma máquina é movida à mão THEN the API SHALL manter o `status` e a `categoriaTravada` dela.
7. WHEN o usuário arrasta um card para outra linha, usa "Mover para", "Remover da categoria" ou confirma "Adicionar máquinas" THEN the front SHALL mostrar a mudança na hora e chamar `PUT /api/machines/categoria`.
8. IF uma chamada de mover, trocar status ou travar falha THEN the front SHALL voltar ao estado anterior e mostrar um aviso de erro.

**Independent Test**: Arrastar EMP-082 de Ativas para Manutenção e recarregar mantém EMP-082 em Manutenção com o selo "Em uso".

---

### P1: Frota lendo a API com selo de status ⭐ MVP

**User Story**: As a admin, I want que a Frota mostre categorias e máquinas reais com o status de cada uma so that o nome da coluna não me engane.

**Why P1**: Sem isso nada do backend aparece e a confusão continua.

**Acceptance Criteria**:

1. WHEN a Frota abre THEN the front SHALL buscar `GET /api/categories` e `GET /api/machines` com a filial ativa, mostrando o skeleton até as duas responderem.
2. WHEN a filial ativa muda THEN the front SHALL buscar as máquinas de novo e descartar a resposta da filial anterior.
3. IF alguma das buscas falha THEN the front SHALL mostrar a mensagem de erro com o botão "Tentar novamente", como a Visão Geral.
4. The front SHALL montar cada linha com as categorias da API e as máquinas cujo `categoriaId` é o `_id` dela.
5. WHERE a categoria tem `chave` THE front SHALL mostrar o nome traduzido de `fleet.category*`; sem `chave`, o `nome`.
6. WHERE o usuário tem `escopo: 'empresa'` THE front SHALL mostrar criar, editar (nome, cor, status ligados) e excluir categoria.
7. WHERE o usuário tem `escopo: 'filiais'` THE front SHALL esconder esses controles e manter adicionar, arrastar, "Mover para", trava e troca de status.
8. The card da Frota SHALL mostrar o selo do status com o rótulo de `machines.status.<status>`, em qualquer categoria.
9. The cor do cabeçalho do card SHALL vir do status, nunca da categoria.
10. The destaque do card SHALL seguir o status: `alerta` mostra "Nível de urgência: Urgente" e "Data e Hora" de `alertaEm`; `em_uso` o tempo de sessão; `disponivel` as horas semanais; `manutencao` o MAC no lugar do funcionário; `offline` nenhum destaque.
11. The Visão Geral, o detalhe da máquina e o card do funcionário SHALL traduzir os 5 códigos nos 7 idiomas.
12. The filtro de status da Visão Geral SHALL listar os 5 códigos traduzidos.

**Independent Test**: Uma máquina `disponivel` colocada à mão em "Manutenção" mostra o selo "Disponível" verde e o destaque de horas semanais.

---

### P2: Quadro inicial e dados antigos

**User Story**: As a dono do sistema, I want que as empresas existentes ganhem o quadro do Figma e que o status antigo vire o novo so that ninguém comece de quadro vazio nem perca o estado atual.

**Why P2**: Necessário para colocar no ar, mas não para demonstrar em dev com seed.

**Acceptance Criteria**:

1. WHEN `yarn migrate:status` roda THEN the script SHALL gravar `forklift.status` a partir do `device.status` ligado (`Disponível`→`disponivel`, `Em uso`→`em_uso`, `Manutenção`→`manutencao`, `Offline`→`offline`) nas empilhadeiras sem `status`.
2. WHEN `yarn migrate:status` encontra empilhadeira sem dispositivo e sem `status` THEN the script SHALL gravar `status: 'offline'`.
3. WHEN `yarn migrate:status` encontra empresa sem categorias THEN the script SHALL criar as 4 categorias iniciais com `chave`, cor e `statusVinculados` do quadro inicial.
4. WHEN `yarn migrate:status` cria as categorias de uma empresa THEN the script SHALL colocar cada empilhadeira sem `categoriaId` dessa empresa na categoria ligada ao status dela, e deixar sem categoria as de status sem ligação.
5. WHEN `yarn migrate:status` roda de novo THEN the script SHALL não alterar nenhum documento.
6. WHEN `yarn seed:data` roda THEN the seed SHALL gravar `forklift.status` do dataset, criar o quadro inicial da empresa padrão e posicionar as máquinas pela regra do item 4.
7. The seed SHALL deixar EMP-081, EMP-085 e EMP-089 com `status: 'alerta'` e 1 incidente `pendente` cada, e as demais máquinas só com incidentes `resolvido`.

**Independent Test**: Num banco com o seed antigo, rodar `migrate:status` mostra na Frota o mesmo quadro de hoje, com as 3 máquinas de Acidentes em `alerta`.

---

## Edge Cases

- IF a empresa não tem nenhuma categoria THEN the Frota SHALL mostrar só o botão de adicionar categoria (escopo empresa) ou o aviso "Nenhuma categoria cadastrada" (escopo filiais).
- WHEN uma categoria tem máquinas de várias filiais e a filial ativa é uma só THEN the contador da linha SHALL contar só as máquinas visíveis.
- IF a categoria filtrada no seletor da Frota é excluída THEN the filtro SHALL voltar para "Todas".
- WHEN um card é solto na linha onde já está THEN the front SHALL não chamar a API.
- IF o `categoriaId` de uma máquina aponta para categoria inexistente THEN the front SHALL tratá-la como sem categoria.
- WHEN duas leituras de impacto chegam para a mesma máquina THEN the API SHALL criar um incidente por leitura e manter `status: 'alerta'`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| STS-01 | P1: Status gravado e trocado à mão (AC1) | Tasks | In Tasks |
| STS-02 | P1: Status gravado e trocado à mão (AC2) | Tasks | In Tasks |
| STS-03 | P1: Status gravado e trocado à mão (AC3) | Tasks | In Tasks |
| STS-04 | P1: Status gravado e trocado à mão (AC4) | Tasks | In Tasks |
| STS-05 | P1: Status gravado e trocado à mão (AC5) | Tasks | In Tasks |
| STS-06 | P1: Status gravado e trocado à mão (AC6) | Tasks | In Tasks |
| STS-07 | P1: Status gravado e trocado à mão (AC7) | Tasks | In Tasks |
| STS-08 | P1: Status gravado e trocado à mão (AC8) | Tasks | In Tasks |
| STS-09 | P1: Status gravado e trocado à mão (AC9) | Tasks | In Tasks |
| STS-10 | P1: Status gravado e trocado à mão (AC10) | Tasks | In Tasks |
| IMP-01 | P1: Leitura de impacto vira alerta (AC1) | Tasks | In Tasks |
| IMP-02 | P1: Leitura de impacto vira alerta (AC2) | Tasks | In Tasks |
| IMP-03 | P1: Leitura de impacto vira alerta (AC3) | Tasks | In Tasks |
| IMP-04 | P1: Leitura de impacto vira alerta (AC4) | Tasks | In Tasks |
| IMP-05 | P1: Leitura de impacto vira alerta (AC5) | Tasks | In Tasks |
| IMP-06 | P1: Leitura de impacto vira alerta (AC6) | Tasks | In Tasks |
| IMP-07 | P1: Leitura de impacto vira alerta (AC7) | Tasks | In Tasks |
| CAT-01 | P1: Categorias da empresa ligadas a status (AC1) | Tasks | In Tasks |
| CAT-02 | P1: Categorias da empresa ligadas a status (AC2) | Tasks | In Tasks |
| CAT-03 | P1: Categorias da empresa ligadas a status (AC3) | Tasks | In Tasks |
| CAT-04 | P1: Categorias da empresa ligadas a status (AC4) | Tasks | In Tasks |
| CAT-05 | P1: Categorias da empresa ligadas a status (AC5) | Tasks | In Tasks |
| CAT-06 | P1: Categorias da empresa ligadas a status (AC6) | Tasks | In Tasks |
| CAT-07 | P1: Categorias da empresa ligadas a status (AC7) | Tasks | In Tasks |
| CAT-08 | P1: Categorias da empresa ligadas a status (AC8) | Tasks | In Tasks |
| CAT-09 | P1: Categorias da empresa ligadas a status (AC9) | Tasks | In Tasks |
| CAT-10 | P1: Categorias da empresa ligadas a status (AC10) | Tasks | In Tasks |
| CAT-11 | P1: Categorias da empresa ligadas a status (AC11) | Tasks | In Tasks |
| CAT-12 | P1: Categorias da empresa ligadas a status (AC12) | Tasks | In Tasks |
| CAT-13 | P1: Categorias da empresa ligadas a status (AC13) | Tasks | In Tasks |
| AUT-01 | P1: Status move a máquina, trava segura (AC1) | Tasks | In Tasks |
| AUT-02 | P1: Status move a máquina, trava segura (AC2) | Tasks | In Tasks |
| AUT-03 | P1: Status move a máquina, trava segura (AC3) | Tasks | In Tasks |
| AUT-04 | P1: Status move a máquina, trava segura (AC4) | Tasks | In Tasks |
| AUT-05 | P1: Status move a máquina, trava segura (AC5) | Tasks | In Tasks |
| AUT-06 | P1: Status move a máquina, trava segura (AC6) | Tasks | In Tasks |
| AUT-07 | P1: Status move a máquina, trava segura (AC7) | Tasks | In Tasks |
| MOV-01 | P1: Mover máquinas à mão (AC1) | Tasks | In Tasks |
| MOV-02 | P1: Mover máquinas à mão (AC2) | Tasks | In Tasks |
| MOV-03 | P1: Mover máquinas à mão (AC3) | Tasks | In Tasks |
| MOV-04 | P1: Mover máquinas à mão (AC4) | Tasks | In Tasks |
| MOV-05 | P1: Mover máquinas à mão (AC5) | Tasks | In Tasks |
| MOV-06 | P1: Mover máquinas à mão (AC6) | Tasks | In Tasks |
| MOV-07 | P1: Mover máquinas à mão (AC7) | Tasks | In Tasks |
| MOV-08 | P1: Mover máquinas à mão (AC8) | Tasks | In Tasks |
| FRT-01 | P1: Frota lendo a API com selo de status (AC1) | Tasks | In Tasks |
| FRT-02 | P1: Frota lendo a API com selo de status (AC2) | Tasks | In Tasks |
| FRT-03 | P1: Frota lendo a API com selo de status (AC3) | Tasks | In Tasks |
| FRT-04 | P1: Frota lendo a API com selo de status (AC4) | Tasks | In Tasks |
| FRT-05 | P1: Frota lendo a API com selo de status (AC5) | Tasks | In Tasks |
| FRT-06 | P1: Frota lendo a API com selo de status (AC6) | Tasks | In Tasks |
| FRT-07 | P1: Frota lendo a API com selo de status (AC7) | Tasks | In Tasks |
| FRT-08 | P1: Frota lendo a API com selo de status (AC8) | Tasks | In Tasks |
| FRT-09 | P1: Frota lendo a API com selo de status (AC9) | Tasks | In Tasks |
| FRT-10 | P1: Frota lendo a API com selo de status (AC10) | Tasks | In Tasks |
| FRT-11 | P1: Frota lendo a API com selo de status (AC11) | Tasks | In Tasks |
| FRT-12 | P1: Frota lendo a API com selo de status (AC12) | Tasks | In Tasks |
| MIG-01 | P2: Quadro inicial e dados antigos (AC1) | Tasks | In Tasks |
| MIG-02 | P2: Quadro inicial e dados antigos (AC2) | Tasks | In Tasks |
| MIG-03 | P2: Quadro inicial e dados antigos (AC3) | Tasks | In Tasks |
| MIG-04 | P2: Quadro inicial e dados antigos (AC4) | Tasks | In Tasks |
| MIG-05 | P2: Quadro inicial e dados antigos (AC5) | Tasks | In Tasks |
| MIG-06 | P2: Quadro inicial e dados antigos (AC6) | Tasks | In Tasks |
| MIG-07 | P2: Quadro inicial e dados antigos (AC7) | Tasks | In Tasks |

**Coverage:** 64 total, 64 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Um impacto acima do limite leva uma máquina destravada para a coluna ligada a `alerta` sem ação de ninguém.
- [ ] Uma máquina travada nunca muda de coluna por mudança de status.
- [ ] Recarregar a Frota mostra o mesmo quadro, para qualquer usuário da empresa.
- [ ] Os 5 status aparecem traduzidos nos 7 idiomas em Visão Geral, Frota, detalhe e área do funcionário.
