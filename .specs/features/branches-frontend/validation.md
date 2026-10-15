# branches-frontend Validation

## Validation: FAIL

**Result**: FAIL (força dos testes; nenhum defeito de produção encontrado)
**Date**: 2026-10-13
**Spec**: `.specs/features/branches-frontend/spec.md`
**Diff range**: `edbb96d^..5277d92` (a branch avançou depois; `VisaoGeralPage.tsx` e `authService.ts` mudaram depois e não foram reverificados)
**Verifier**: independent Verifier (author != verifier); relatório completo na sessão que o gerou.

## Resumo

- Gate na cópia isolada: `tsc -b` e `eslint .` limpos, 1067 testes passando.
- 36 de 41 critérios batem exatamente com o spec; 4 têm asserção fraca (sessão AC8, seletor AC7, empresa AC2, 401 AC1) e 5 são lacunas de precisão do spec.
- Sensor: 88 mutantes, 77 mortos, 11 sobreviventes. Nenhuma asserção antiga foi enfraquecida.

## Gaps e situação

| Gap | Situação |
| --- | -------- |
| Re-render do provider ao navegar (`ActiveBranchContext.tsx`, `useLocation`) | Teste adicionado |
| `popstate` após o 401 (`api.ts`) | Teste adicionado |
| Provider ligado fora de `main.tsx` | Provider movido para `App.tsx`, coberto por `App.test.tsx` |
| `aria-label` e `aria-expanded` nunca asseridos | Testes adicionados |
| `setItem` do localStorage lançando erro | Teste adicionado |
| Alternância "Concluir" sem teste e sem AC | Teste adicionado |
| Falha tardia de requisição de filial anterior | Teste adicionado |
| Foco não volta ao botão do seletor ao fechar | Corrigido, com testes |
| Falha do `GET /branches` após mutação bem-sucedida mostra erro de salvar | **Não corrigido** (em andamento quando a execução foi interrompida) |

Depois de corrigir o último item, a feature precisa de uma nova verificação independente para virar PASS.
