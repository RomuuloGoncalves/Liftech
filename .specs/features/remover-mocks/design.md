# Remover mocks de máquinas — Design

Spec: `.specs/features/remover-mocks/spec.md`

## 1. O Backend cobre reparo/manutenção?

**Não.** O que existe:

| Peça | O que guarda | Serve para reparo? |
| ---- | ------------ | ------------------ |
| `Backend/src/schemas/incident.ts` | `dataIncidente`, `forcaImpacto`, `status` (`pendente`/`resolvido`), `origem` (`sensor`/`funcionario`), `descricao`, `empilhadeiraId`, `operadorId`, `filialId` | Não. É acidente/ocorrência pontual; não tem tipo, início/fim nem noção de manutenção. |
| `GET /api/incidents` (`feature/incident/incidentService.ts:listar`) | filtra por escopo de filial, `machineId`, `from`/`to`, ordena por data desc, limite `LIMITE_HISTORICO` (500) | Já usado pelo modal para a aba de acidentes. |
| `Backend/src/schemas/forklift.ts:12-13` | `status` (inclui `manutencao`) + `statusAlteradoEm` (só a última mudança) | Não há histórico: só dá para saber desde quando a máquina está no status atual. |
| `feature/machine/statusService.ts:aplicarStatus` | único caminho de mudança de status (manual e dispositivo); hoje só resolve incidentes ao sair de `alerta` | Ponto natural para registrar entrada/saída de `manutencao`, mas nada é gravado. |

Conclusão: a aba de reparos não tem fonte real. **Decisão D1 do usuário** (spec, Assumptions):

- **A (default do plano):** remover o mock e deixar a aba vazia (`machines.historyEmpty`). Zero Backend.
- **B:** criar o contrato mínimo abaixo e ligar o modal nele.

### Contrato mínimo (só se D1 = B)

Schema novo `Backend/src/schemas/maintenance.ts` (coleção `maintenance`):

```ts
{ empilhadeiraId: ObjectId (ref forklift, required), filialId: ObjectId (ref branch, required),
  inicio: Date (required), fim: Date | null, operadorId?: ObjectId (ref operator) }
// índices: { filialId: 1, inicio: -1 }, { empilhadeiraId: 1, fim: 1 }
```

Gravação em `aplicarStatus` (depois do `Forklift.updateOne`, mesmo estilo sem transação já marcado com `ponytail:` ali):

- `novo === 'manutencao'` → `Maintenance.create({ empilhadeiraId, filialId, inicio: new Date(), fim: null })`
- `atual === 'manutencao'` → `Maintenance.updateMany({ empilhadeiraId, fim: null }, { $set: { fim: new Date() } })`

Leitura `GET /api/maintenances?machineId&from&to&filialId` — mesma forma de `/incidents`, reaproveitando `filtroPorFilial`, `lerMachineId`, `lerPeriodo`, `LIMITE_HISTORICO`; período filtra por `inicio`. Resposta:

```ts
{ _id: string, machineId: string, operador: { nome: string } | null, inicio: string /*ISO*/, fim: string | null }[]
```

Pendências dentro de B: D2 (quem é o "operador" de um reparo — default `null`) e D3 (reparo em aberto — default exibir só `inicio`). Sem migração/backfill: `statusAlteradoEm` não reconstrói histórico.

## 2. Mapa de uso do mock em `Frontend/src`

Produção (precisa mudar):

| Arquivo | Uso |
| ------- | --- |
| `pages/VisaoGeralPage.tsx:15,17,27-29,283` | `MACHINES` + `eventsForMachine` em `mockEventsFor` → `events` do modal |
| `pages/FrotaPage.tsx:24,47-49,407` | idem |
| `pages/AlertasPage.tsx:10,13,22-24,182` | idem (`repairsFor`) |
| `pages/DashboardPage.tsx:362` | passa `events={[]}` (só precisa perder a prop) |
| `components/machines/MachineDetailModal.tsx:9,27-28,79` | prop `events` + `filterEvents` para a aba de reparos |
| `data/machines.ts:30-237,262-295,318-330` | `BASE_MACHINES`, `MACHINES`, `EVENT_*`, `MACHINE_EVENTS`, `eventsForMachine`, `EventFilters`, `filterEvents` |

Testes que importam o dataset (migrar para `src/test/fixtures/machines.ts`):

| Grupo | Arquivos | Observação |
| ----- | -------- | ---------- |
| data | `test/data/machines.test.ts`, `test/data/fleet.test.ts`, `test/data/employeeArea.test.ts` | `machines.test.ts` também tem blocos que testam o próprio mock (`machine detail mocks`, causas de `MACHINE_EVENTS`) e `filterEvents` → saem no T7 |
| employee | `test/fixtures/employeeSessions.ts`, `test/pages/employee/{EmployeeMachinesPage,EmployeeHistoryPage,EmployeeHomePage,EmployeeSkeletonPages}.test.tsx`, `test/components/employee/{IncidentSheet,MachineDetailSheet}.test.tsx` | `EmployeeSkeletonPages` e `IncidentSheet` fazem `await import('../../../data/machines')` dentro de `vi.mock` — trocar o caminho da importação dinâmica também |
| fleet | `test/pages/FrotaPage.test.tsx`, `test/components/fleet/{FleetRow,MachinePickerModal}.test.tsx` | `FrotaPage.test` importa `MACHINES as MOCK` |
| overview/alerts | `test/pages/VisaoGeralPage.test.tsx`, `test/pages/AlertasPage.test.tsx` | também usam `eventsForMachine`/`filterEvents` (VisaoGeral l.470-505) e `MACHINE_EVENTS` (Alertas l.18 para fabricar acidentes, l.201 para reparos) |
| modal | `test/components/machines/MachineDetailModal.test.tsx` | não usa o dataset, mas passa `events` (prop removida no T6) |

Sem mudança: `LevelInfoModal.test.tsx` (`vi.doMock` de `data/machines` só sobrescreve `ACCIDENT_URGENCY`), `StatusBadge.test.tsx` (`MACHINE_STATUSES`), arquivos que importam só tipos.

## 3. Abordagem (ladder)

- **Fixture:** copiar `BASE_MACHINES` + o `map` de `MACHINES` literalmente para `src/test/fixtures/machines.ts` (padrão de `fixtures/employees.ts`). Sem builder novo; os asserts existentes dependem desses valores.
- **`AlertasPage.test.tsx:18`** fabrica incidentes a partir de `MACHINE_EVENTS.filter(tipo==='acidente')`: substituir por uma lista literal de incidentes na própria fixture de teste do arquivo (ou exportar `MACHINE_EVENTS` na fixture se a reescrita ficar maior que a cópia — o executor escolhe a menor; ambos são só teste).
- **Modal:** remover a prop `events` e `filterEvents`; aba `manutencao` renderiza `[]` (A). Em B, a aba usa um segundo `useEffect` idêntico ao de acidentes com `maintenanceService.listar` mapeado para `MachineEvent { tipo: 'manutencao', data, inicio, fim }` (função pura ao lado de `incidentToEvent`).
- **Páginas:** apagar `mockEventsFor`/`repairsFor` e o `events=` do JSX, no mesmo commit da remoção da prop (senão o `tsc -b` quebra).
- **Limpeza:** apagar do `data/machines.ts` o que ficou sem importador; o grep de RM-05 é o gate.

## 4. Decisões a registrar

Quando o usuário decidir D1, registrar um AD em `.specs/STATE.md` ("Histórico de reparos: vazio até endpoint" ou "Manutenção registrada em `aplicarStatus`").
