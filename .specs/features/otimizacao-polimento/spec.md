# Otimização e polimento Specification

## Problem Statement

O Frontend entrega um único chunk JS de 600 kB (181 kB gzip) com as 14 páginas e os 7 idiomas, injeta 600 ms de latência falsa em 7 telas e embute dados mock de manutenção em produção. O Backend lista telemetria, sessões e ocorrências sem limite, consulta coleções por campos sem índice, faz hash de senha síncrono no event loop e expõe sem proteção uma rota pública `GET /api/reset` que apaga o banco. Três auditorias (frontend, backend, código morto) levantaram os achados; os 13 de maior impacto foram reverificados no código em 2026-10-23 (ver Assumptions).

## Goals

- [ ] Chunk JS de entrada ≤ 140 kB gzip após a F1 (hoje 181 kB) e ≤ 120 kB gzip após a F2; nenhum chunk > 500 kB minificado (some o aviso do Vite).
- [ ] Toda listagem de histórico da API (`/api/sessions`, `/api/incidents`, `/api/telemetry`) devolve no máximo 500 documentos, ordenados do mais recente.
- [ ] Toda consulta Mongo do caminho quente usa índice declarado no schema (`schema.indexes()` asserido em teste; `explain` confirmado pelo dono).
- [ ] Leitura de sensor com impacto (`POST /api/telemetry`) cai de 10 para ≤ 8 operações Mongo.
- [ ] Zero latência simulada em produção (hoje 600 ms em 7 telas).
- [ ] Zero arquivo/export morto apontado pelo knip (Frontend e Backend) e um só lockfile por pacote.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Refator do formulário comum (`<Field>`) e de `matchesText` duplicado 6x | Polimento de código sem ganho de desempenho; backlog. |
| Unificar as duas arquiteturas do Backend (classes x funções) | Esforço G; some sozinho se a pilha legada for removida (F3, D2). |
| Trocar axios por fetch | ~13 kB gzip [H] contra reescrever interceptors de auth; não compensa. |
| Contador atômico de matrícula (`proximaMatricula`) | Só importa com milhares de operadores. |
| Traduzir as 72 chaves `employee.*` faltantes em de/es/fr/ja/ru | Dívida de tradução, não otimização; o fallback pt-BR cobre. |
| `React.memo` em cards e `useCallback` em massa | Sem medição de jank; só `useMemo` dos filtros entra (OPT-17). |
| Mover `figma-telas/` (9,2 MB) para fora do repo | Decisão de repositório; registrado como pergunta D7. |
| Acessar o banco | Regra do dono: nenhum agente acessa banco; o dono roda as queries e devolve o resultado. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Limite das listagens de histórico | Constante 500, ordenação desc, sem parâmetro `limit` | Front não pagina hoje; 500 cobre os períodos padrão das telas. Parâmetro só quando houver paginação na UI. | n |
| Índices criados por `autoIndex` do Mongoose no boot | Mantém o padrão do projeto (sem script `syncIndexes`) | Coleções pequenas [H]; o dono confere com `listIndexes` (T13). | n |
| Índice único de `accessRequest` pendente por e-mail | Só na F2, depois de o dono rodar a query de duplicados | O build do índice falha se houver duplicata. | n |
| Testes do Frontend | Rodam com Node ≥ 20.19 (o projeto usa Node 25.9 via nvm) | A auditoria falhou em Node 20.18.1 com ERR_REQUIRE_ESM; não é bug do código. | y |
| `vite` no `Backend/package.json` | Fica | É peerDependency do vitest 5 (confirmado no lock); a auditoria 2 errou ao chamá-lo de morto. | y |
| Cache do `autenticar` | Fora da F1/F2; só projeção `.select` (F2) | Comentário em `core/autenticar.ts:26` e AD-010/AD-012 exigem revogação imediata; decisão D3. | n |
| Remoção de assets | Só entra o que tem 0 referência em `src`, `index.html`, `public` e `docs` (grep registrado). O vídeo da sessão (`forklift.mp4` e `forklift.webm`, usados em `EmployeeSessionPage`) FICA, com os dois formatos como fallback; ele não pesa no JS inicial (o Vite o emite como arquivo próprio, baixado só nessa tela). O plano só ajusta `preload` e o `requestAnimationFrame`. | Dono: "não podemos excluir vídeo; verificar o que é usado e reorganizar". Verificado: `hero.png`, `react.svg`, `vite.svg` e `logo-full.svg` têm 0 uso; `logo.svg`, `logo-name.svg` e os vídeos têm uso. | y |
| Itens F3 (D1–D7) | Não executar sem resposta do dono | Afetam dados, contrato externo ou produto. | n |
| Achados reverificados (13) | Confirmados: rotas estáticas (`appRoutes.tsx:3-16`), 7 locales inline (`config/i18n.ts:5-11`, 105 kB raw, ~4,2 kB gzip cada), `useFirstVisitLoading` 600 ms em 7 lugares, mock `MACHINES` em 3 páginas, telemetria sem limite (`coreRepository.ts:15`), sessões/ocorrências sem limite (`sessionService.ts:133`, `incidentService.ts:75`), índices faltando (6 campos), `autenticar` 2 queries sequenciais, `scryptSync` (`utils/senha.ts`), `/api/reset` GET público, `pino-pretty` fixo em `logger.ts`, 2 `incidentModel.ts` sem importador, `package-lock.json` + `yarn.lock` em Frontend e Backend | Lidos no código | y |
| Achados descartados ou corrigidos | Descartados: "vite morto no Backend"; "vitest não roda" (ambiente). Corrigidos: `useEmployeeData` não tem estado de loading, então tirar a latência falsa exige criar `loading` real (não só apagar o hook); `AlertasPage` também não tem loading real. Contagem do impacto: 10 operações (não 12). | Lidos no código | y |

**Open questions:** none - all resolved or logged above. As 7 decisões do dono (D1–D7) estão na seção "P3: Itens que exigem decisão do dono"; cada uma tem recomendação e bloqueia só a sua tarefa da F3.

---

## User Stories

### P1: Carregamento inicial enxuto (F1, Frontend) ⭐ MVP

**User Story**: Como usuário no celular, quero que a primeira tela carregue só o código dela, para abrir o app mais rápido.

**Why P1**: É o maior ganho mensurável (181 kB gzip num chunk só) com esforço pequeno.

**Acceptance Criteria**:

1. The Frontend build SHALL gerar um chunk de entrada com no máximo 140 kB gzip, medido pela saída de `vite build`.
2. The Frontend build SHALL gerar nenhum chunk JS acima de 500 kB minificado.
3. WHEN o usuário navega para uma rota ainda não carregada THEN o Frontend SHALL mostrar o `PageSkeleton` (rotas admin) ou o `EmployeeSkeleton` (rotas `/funcionario/*`) até o chunk da página chegar.
4. WHILE o usuário navega entre páginas de `/funcionario/*` o Frontend SHALL manter o `EmployeeLayout` (cabeçalho e tab bar) montado.
5. IF o `import()` de uma página falha THEN o Frontend SHALL mostrar a mensagem de erro com botão de recarregar, sem tela branca.

**Independent Test**: `vite build` lista mais de um chunk JS e o de entrada ≤ 140 kB gzip; testes de rota passam com `findBy*`.

---

### P1: Sem latência falsa (F1, Frontend) ⭐ MVP

**User Story**: Como colaborador, quero ver os dados assim que a API responde, sem espera artificial.

**Why P1**: 600 ms fixos em 7 telas pioram a percepção sem motivo.

**Acceptance Criteria**:

1. The Frontend SHALL não conter `useFirstVisitLoading` nem `MOCK_LATENCY_MS` em `src/` (fora de `src/test`).
2. WHILE as requisições de `useEmployeeData` (máquinas e sessões) não terminaram o hook SHALL devolver `loading: true`.
3. WHEN as duas requisições de `useEmployeeData` terminam, com sucesso ou erro, THEN o hook SHALL devolver `loading: false`.
4. WHILE `AlertasPage` espera a primeira resposta de `incidentService.listar` a página SHALL mostrar o skeleton.
5. WHEN a API responde THEN as telas Home, Máquinas, Histórico, Alertas SHALL trocar o skeleton pelo conteúdo sem atraso adicional.

**Independent Test**: teste com serviço mockado que resolve na hora mostra o conteúdo no primeiro `findBy*`, sem `advanceTimers`.

---

### P1: Higiene do Frontend (F1) ⭐ MVP

**User Story**: Como mantenedor, quero só dependências, exports e arquivos usados, para o bundle e a revisão não carregarem lixo.

**Why P1**: Risco nulo, esforço pequeno.

**Acceptance Criteria**:

1. The `Frontend/package.json` SHALL não declarar `react-router` (só `react-router-dom`).
2. The `Frontend/package.json` SHALL declarar `engines.node` `>=20.19`.
3. The repositório SHALL não versionar `Frontend/package-lock.json`.
4. WHEN `npx knip` roda no Frontend THEN ele SHALL reportar zero dependências, exports e tipos sem uso.
5. The `Frontend/src/assets` SHALL não conter `hero.png`, `react.svg`, `vite.svg` nem `logo-full.svg`.
6. WHEN o Frontend faz um `GET` sem corpo THEN o `api` SHALL não enviar `Content-Type: application/json`.

**Independent Test**: `npx knip` limpo; teste de `services/api` confere o header do GET.

---

### P1: Consultas limitadas e indexadas (F1, Backend) ⭐ MVP

**User Story**: Como operador do sistema, quero que as listagens não cresçam sem limite e usem índice, para a API não degradar com o volume.

**Why P1**: Telemetria cresce a cada leitura de sensor; sem limite e sem índice o tempo cresce linearmente.

**Acceptance Criteria**:

1. WHEN `GET /api/sessions` é chamado THEN o backend SHALL devolver no máximo 500 sessões ordenadas por `inicio` desc.
2. WHEN `GET /api/incidents` é chamado THEN o backend SHALL devolver no máximo 500 ocorrências ordenadas por `dataIncidente` desc.
3. WHEN `GET /api/telemetry` é chamado com ou sem `dispositivoId` THEN o backend SHALL devolver no máximo 500 leituras ordenadas por `dataDados` desc.
4. The schema `incident` SHALL declarar os índices `{ filialId: 1, dataIncidente: -1 }` e `{ empilhadeiraId: 1, status: 1 }`, sem o índice simples de `filialId`.
5. The schema `workSession` SHALL declarar os índices `{ operadorId: 1, inicio: -1 }` e `{ empilhadeiraId: 1, inicio: -1 }`, mantendo os dois únicos parciais `fim: null`.
6. The schema `user` SHALL declarar o índice `{ operadorId: 1 }` parcial para documentos com `operadorId` do tipo ObjectId.
7. The schema `forklift` SHALL declarar o índice `{ dispositivoConectadoId: 1 }` parcial para documentos com `dispositivoConectadoId` do tipo ObjectId.
8. The schema `accessRequest` SHALL declarar o índice `{ status: 1, createdAt: 1 }`.

**Independent Test**: `schemas.test.ts` asserta `schema.indexes()`; testes de service assertam `.limit(500)` e o `sort`.

---

### P1: Infra HTTP e logs (F1, Backend) ⭐ MVP

**User Story**: Como dono do sistema, quero respostas comprimidas, cabeçalhos de segurança e logs sem token.

**Why P1**: Três mudanças de poucas linhas com ganho direto de banda e de segurança.

**Acceptance Criteria**:

1. WHEN o cliente envia `Accept-Encoding: gzip` e a resposta JSON passa de 1 kB THEN o backend SHALL responder com `Content-Encoding: gzip`.
2. The backend SHALL enviar `X-Content-Type-Options: nosniff` e não enviar `X-Powered-By` em toda resposta.
3. WHERE `NODE_ENV` é `production` o logger SHALL escrever JSON sem o transport `pino-pretty`.
4. The logger SHALL substituir o valor de `req.headers.authorization` por `[Redacted]` em todo log.
5. The `Backend` SHALL não conter `src/feature/incident/incidentModel.ts` nem `src/models/incidentModel.ts`.
6. WHEN `npx knip` roda no Backend THEN ele SHALL reportar zero arquivos, exports e tipos sem uso e nenhum `main` inexistente no `package.json`.
7. The repositório SHALL não versionar `Backend/package-lock.json`, e o `.gitignore` da raiz SHALL ignorar `package-lock.json`.

**Independent Test**: `app.test.ts` com supertest confere headers; `logger` testado com stream em memória.

---

### P2: Menos trabalho por requisição (F2, Backend)

**User Story**: Como dono, quero que login, sensor e sessão façam menos idas ao banco e não travem o event loop.

**Why P2**: Mudam assinaturas e fluxo de serviços com testes de mock pesados; risco médio.

**Acceptance Criteria**:

1. The `gerarHashSenha` e `verificarSenha` SHALL usar `crypto.scrypt` assíncrono e devolver `Promise`.
2. IF o login recebe usuário inexistente THEN o backend SHALL calcular um scrypt contra um hash fixo antes de responder 401, para o tempo não revelar o usuário.
3. WHEN `POST /api/telemetry` recebe leitura com impacto acima do limite numa máquina fora de `alerta` THEN o backend SHALL executar no máximo 8 operações Mongo (contadas pelas chamadas aos models mockados), contra 10 hoje.
4. WHEN `POST /api/telemetry` valida o dispositivo THEN o backend SHALL usar `Device.exists({ _id, filialId: { $in } })`, sem `distinct` de todos os ids da filial.
5. The `autenticar` SHALL ler do `User` só os campos `role operadorId acessoNegado empresaId escopo filiaisIds`.
6. WHEN `PATCH` de trava da máquina (`definirTrava`) é chamado THEN o backend SHALL chamar `obterMaquina` uma vez só.
7. The `machineService` SHALL popular `dispositivoConectadoId` só com `enderecoMac nome` e `operadorConectadoId` só com `nome`.
8. WHEN o corpo JSON é malformado THEN o backend SHALL responder 400 `{ message }` em JSON.
9. WHEN uma rota `/api/*` não existe THEN o backend SHALL responder 404 `{ message }` em JSON.
10. IF `/api/auth/login` recebe mais de 10 tentativas do mesmo IP em 15 minutos THEN o backend SHALL responder 429.
11. IF `POST /api/access-requests` recebe mais de 5 pedidos do mesmo IP em 1 hora THEN o backend SHALL responder 429.
12. The schema `accessRequest` SHALL declarar índice único parcial `{ email: 1 }` com `status: 'pendente'`.
13. IF a criação de solicitação de acesso bate no índice único (erro 11000) THEN o backend SHALL responder 409 com a mesma mensagem da checagem atual.
14. IF `accessRequestController.criar` falha por erro inesperado THEN o backend SHALL responder pelo `responderErro`, sem `error.message` cru.

**Independent Test**: testes unitários contam chamadas dos models mockados; teste de rate limit com 11 requisições seguidas.

---

### P2: Menos trabalho no cliente (F2, Frontend)

**User Story**: Como usuário, quero que trocar de idioma ou voltar a uma página não baixe nem recarregue o que já está na memória.

**Why P2**: Mexe em inicialização do i18n e em cache de dados; risco médio de estado velho.

**Acceptance Criteria**:

1. The bundle de entrada SHALL conter só o locale `pt-BR`; os outros 6 SHALL ser chunks carregados por `import()`.
2. WHEN o usuário escolhe um idioma ainda não carregado THEN o Frontend SHALL carregar o chunk e trocar o texto sem recarregar a página.
3. IF o chunk do idioma falha ao carregar THEN o Frontend SHALL manter o idioma atual e mostrar o toast de erro.
4. WHEN duas telas pedem `machineService.listar(filialId)` com menos de 30 s de intervalo THEN o Frontend SHALL fazer uma requisição só.
5. WHEN uma mutação de máquina (criar, editar, excluir, mover, travar, mudar status) termina THEN o Frontend SHALL invalidar o cache de `machineService.listar`.
6. WHEN duas telas pedem `sectorService.listar(filialId)` com menos de 30 s de intervalo THEN o Frontend SHALL fazer uma requisição só, com invalidação nas mutações de setor.
7. WHEN o componente que fez a requisição desmonta THEN o Frontend SHALL abortar a requisição com `AbortController`.
8. The `ActiveBranchProvider` SHALL entregar o mesmo objeto `value` enquanto filial, lista e sessão não mudam.
9. WHILE a sessão do colaborador está aberta o `EmployeeSessionPage` SHALL agendar `requestAnimationFrame` só durante os 0,3 s finais e iniciais de cada loop do vídeo.
10. The `<video>` da sessão SHALL usar `preload="metadata"` e ficar pausado WHEN `prefers-reduced-motion: reduce`.
11. The shimmer do `PageSkeleton` SHALL animar só `transform`, não `background-position`.
12. The `index.css` SHALL definir `font-family` no `body`, sem seletor universal `*`, com `button, input, select, textarea { font: inherit }`.
13. WHEN o `Modal` abre THEN ele SHALL mover o foco para dentro, prender o Tab no diálogo e devolver o foco ao elemento de origem ao fechar.
14. The `FrotaPage` SHALL recalcular o filtro de máquinas só quando quadro, busca ou filtro de setor mudam.
15. The locales SHALL não conter as 13 chaves sem uso listadas no design.

**Independent Test**: `vite build` mostra 6 chunks de locale; teste de service conta 1 chamada a `api.get` para 2 `listar` seguidos.

---

### P3: Itens que exigem decisão do dono (F3)

**User Story**: Como dono, quero decidir os itens que mexem em dados, contrato externo ou produto antes de alguém mexer.

**Why P3**: Cada um tem risco de perda de dado ou de quebrar cliente externo.

**Perguntas (cada uma com recomendação):**

- **D1 `GET /api/reset` público apaga o banco.** Recomendo: tirar de produção — rota só existe WHERE `RESET_HABILITADO=true`, passa por `autenticar` + admin e vira `POST`. Alternativa: apagar a rota e manter só `yarn reset` local.
- **D2 Pilha legada `/api/forklifts`, `/api/users`, `/api/devices`, `/api/telemetry`.** O Frontend não chama nenhuma. Recomendo: remover `/forklifts` e `/users` já (−~1200 linhas com testes); manter `/devices` e `/telemetry` até você confirmar se algum sensor IoT envia leituras para `POST /api/telemetry` (hoje exige Bearer de usuário).
- **D3 Cache no `autenticar` x revogação imediata.** Recomendo: não cachear agora; a F2 já reduz o custo com `.select`. Se medir latência alta, cache de 15 s por `sub` com invalidação em `acessoNegado`/escopo — aceitando até 15 s de atraso na revogação.
- **D4 Mock de manutenção (`MACHINES`/`MACHINE_EVENTS`) em produção.** Hoje a aba Manutenção mostra eventos falsos casados por `identificacao`. Recomendo: tirar o mock do bundle e mostrar estado vazio ("Sem registros de manutenção") até existir API.
- **D5 Scripts `migrate:branches|status|sectors`.** Recomendo: remover scripts, testes (340 linhas) e entradas do `package.json` só depois de você confirmar que rodaram em todos os ambientes — o STATE ainda lista `migrate:sectors` como pendente.
- **D6 `dns.setServers(["1.1.1.1"])` em `config/conn.ts` e deploy com devDependencies.** Recomendo: manter o DNS se foi workaround do SRV do Atlas; confirmar se o deploy instala devDeps.
- **D7 `figma-telas/` (48 PNG, 9,2 MB) no repositório.** Recomendo REORGANIZAR, não apagar: conferir quais dos 48 PNG o código ou a doc referenciam (hoje nenhum arquivo do código aponta para `figma-telas/`), mover os de referência para `docs/design/` (comprimidos, ex.: PNG otimizado ou WebP) e tirar do repo só o que o Figma já guarda, com sua confirmação arquivo a arquivo.

**Acceptance Criteria**:

1. WHERE o dono escolhe a recomendação de D1 o backend SHALL responder 404 em `/api/reset` quando `RESET_HABILITADO` não for `true`.
2. WHERE o dono escolhe a recomendação de D1 e `RESET_HABILITADO=true` o backend SHALL exigir `POST` autenticado de admin em `/api/reset`.
3. WHERE o dono aprova remover `/forklifts` e `/users` o backend SHALL responder 404 nessas rotas e o build SHALL passar sem os arquivos de `feature/forklift` e `feature/user`.
4. WHERE o dono confirma que não há cliente IoT o backend SHALL remover `/devices`, `/telemetry` e `core/core*`.
5. WHERE o dono aprova o cache de D3 o `autenticar` SHALL reler o usuário depois de no máximo 15 s.
6. WHERE o dono escolhe a recomendação de D4 o bundle de produção SHALL não conter `MACHINE_EVENTS` e a aba Manutenção SHALL mostrar o estado vazio.
7. WHERE o dono confirma D5 o `Backend/package.json` SHALL não ter scripts `migrate:*`.

**Independent Test**: cada item tem a sua tarefa F3 com teste próprio; nenhuma roda sem a resposta registrada em `STATE.md`.

---

## Edge Cases

- IF o histórico do período passa de 500 itens THEN o backend SHALL devolver os 500 mais recentes (a UI não avisa; anotado no design).
- IF o índice novo já existe com outra opção THEN o Mongoose SHALL logar o erro de `createIndex` sem derrubar o boot (o dono confere em T13).
- IF a rede cai durante o `import()` de uma rota lazy THEN o Frontend SHALL mostrar o erro com recarregar (P1 carregamento, critério 5).
- WHEN o cache de `machineService.listar` está vencido e a requisição falha THEN o Frontend SHALL repassar o erro e não guardar a promise rejeitada.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| OPT-01 | P1: Carregamento inicial (critérios 1-5) | Tasks | Pending |
| OPT-02 | P1: Sem latência falsa (critérios 1-5) | Tasks | Pending |
| OPT-03 | P1: Higiene do Frontend (critérios 1-3) | Tasks | Pending |
| OPT-04 | P1: Higiene do Frontend (critérios 4-5) | Tasks | Pending |
| OPT-05 | P1: Higiene do Frontend (critério 6) | Tasks | Pending |
| OPT-06 | P1: Consultas (critérios 1-3, limites) | Tasks | Pending |
| OPT-07 | P1: Consultas (critérios 4-8, índices) | Tasks | Pending |
| OPT-08 | P1: Infra HTTP (critérios 1-2) | Tasks | Pending |
| OPT-09 | P1: Infra HTTP (critérios 3-4, logger) | Tasks | Pending |
| OPT-10 | P1: Infra HTTP (critérios 5-7, código morto e lockfile) | Tasks | Pending |
| OPT-11 | P2: Backend (critérios 1-2, scrypt) | Tasks | Pending |
| OPT-12 | P2: Backend (critérios 3-7, queries) | Tasks | Pending |
| OPT-13 | P2: Backend (critérios 8-11, erro e rate limit) | Tasks | Pending |
| OPT-14 | P2: Backend (critérios 12-14, accessRequest) | Tasks | Pending |
| OPT-15 | P2: Frontend (critérios 1-3, i18n lazy) | Tasks | Pending |
| OPT-16 | P2: Frontend (critérios 4-7, cache e abort) | Tasks | Pending |
| OPT-17 | P2: Frontend (critérios 8-15, render, CSS, a11y) | Tasks | Pending |
| OPT-18 | P3: D1 reset | Tasks | Blocked (dono) |
| OPT-19 | P3: D2 pilha legada | Tasks | Blocked (dono) |
| OPT-20 | P3: D3 cache autenticar | Tasks | Blocked (dono) |
| OPT-21 | P3: D4 mock manutenção | Tasks | Blocked (dono) |
| OPT-22 | P3: D5 migrate | Tasks | Blocked (dono) |

**Coverage:** 22 total, 22 mapped to tasks, 0 unmapped. D6 e D7 são só perguntas, sem tarefa até a resposta.

---

## Success Criteria

- [ ] `vite build`: entrada ≤ 140 kB gzip (F1) e ≤ 120 kB gzip (F2); 0 avisos de chunk > 500 kB.
- [ ] Nenhuma listagem de histórico devolve mais de 500 itens.
- [ ] `explain` das 6 consultas listadas em T13 mostra `IXSCAN` (resultado devolvido pelo dono).
- [ ] Impacto do sensor: ≤ 8 operações Mongo (era 10); `definirTrava`: 1 `obterMaquina` (eram 2).
- [ ] 0 ms de latência simulada; `knip` limpo nos dois pacotes; 1 lockfile por pacote.
- [ ] Suítes completas verdes: Backend `tsc --noEmit` + `yarn test`; Frontend `tsc -b` + `eslint .` + `vitest run`.
