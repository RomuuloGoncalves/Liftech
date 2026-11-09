# Alertas e Urgências - Liftech

Este documento descreve como os alertas de telemetria são classificados em níveis de urgência, as regras de desempate e onde alterar a tabela no código.

## 1. Tabela de Tipos e Urgências

Os eventos detectados pelo sensor da empilhadeira pertencem a um dos 5 tipos abaixo. Cada tipo possui uma urgência fixa:

| Tipo (`tipo`)          | Nome / Descrição                       | Nível de Urgência |
| ---------------------- | -------------------------------------- | ----------------- |
| `inclinacao_excessiva` | Inclinação ou risco de tombamento      | **Crítica**       |
| `colisao`              | Impacto ou colisão com obstáculo       | **Alta**          |
| `frenagem_brusca`      | Desaceleração repentina além do limite | **Média**         |
| `aceleracao_brusca`    | Arrancada rápida além do limite        | **Média**         |
| `curva_brusca`         | Aceleração lateral em curva            | **Média**         |

### Regras de atribuição e desempate

1. **Incidente sem tipo (legado):** Se um incidente de sensor não possuir o campo `tipo` (ex.: dados antigos do banco), o frontend trata o evento como `colisao` (urgência Alta).
2. **Incidente de funcionário:** Incidentes reportados manualmente pelo operador (`origem: "funcionario"`) não possuem `tipo` do sensor e são exibidos com urgência Alta.
3. **Múltiplos incidentes pendentes na mesma máquina:** O card da máquina na Frota exibe a **maior urgência** entre todos os incidentes pendentes (`critica` > `alta` > `media`).
4. **Empate de urgência:** Em caso de empate entre incidentes com o mesmo nível máximo de urgência, prevalece o tipo do incidente **mais recente** (o primeiro elemento do array `alertaTipos` retornado pela API).
5. **Máquina sem incidentes pendentes:** O card não exibe badge de urgência de acidente.

## 2. Em qual arquivo alterar as urgências

A tabela de urgência é definida no Frontend. Para alterar o nível atribuído a qualquer tipo de incidente:

- **Arquivo:** `Frontend/src/data/machines.ts`
- **Constante:** `ACCIDENT_URGENCY`

Exemplo no código:

```typescript
export const ACCIDENT_URGENCY: Record<AccidentCause, UrgencyLevel> = {
  colisao: "alta",
  frenagem_brusca: "media",
  aceleracao_brusca: "media",
  curva_brusca: "media",
  inclinacao_excessiva: "critica",
};
```

Para reclassificar um tipo (por exemplo, mover `frenagem_brusca` para `'alta'`), basta alterar o valor correspondente no objeto `ACCIDENT_URGENCY`.

## 3. Onde alterar os nomes e traduções

Os nomes amigáveis exibidos ao usuário para cada tipo de evento são localizados nos 7 idiomas suportados pelo sistema (`pt-BR`, `en-US`, `es`, `fr`, `de`, `ja`, `ru`):

- **Diretório:** `Frontend/src/locales/<idioma>/translation.json` (ex.: `Frontend/src/locales/pt-BR/translation.json`)
- **Chaves de tradução:**
  - `colisao`
  - `frenagem_brusca`
  - `aceleracao_brusca`
  - `curva_brusca`
  - `inclinacao_excessiva`

O modal explicativo de níveis de alerta (`LevelInfoModal`, localizado em `Frontend/src/components/alerts/LevelInfoModal.tsx`) lê diretamente `ACCIDENT_URGENCY` e exibe os tipos em suas respectivas colunas ou listas de urgência de forma automática.
