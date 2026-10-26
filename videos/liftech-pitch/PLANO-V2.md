# Plano v2: correções, efeitos sonoros e um vídeo menos estático

Status: **plano, nada executado**. Base: `output/liftech-pitch-editado.mp4` (v1, 3:51). Tempos abaixo = tempo no vídeo editado.

## 1. Nome do orientador

- Correto: **Prof. Denicezar Angelo Baldo** (sem acento em "Angelo").
- Onde muda: card de apresentação (0:20–0:31) e a legenda de ~0:27 ("...orientado pelo professor Denicezar Angelo Baldo").
- A correção entra na lista de correções da legenda (`work/build.mjs` / `captions-take1.*`) e no STORYBOARD, para não voltar a sair errado se o vídeo for gerado de novo.

## 2. Diagnóstico do "estático"

- Ele fica no terço esquerdo **o vídeo inteiro** (zoom fixo de 1,3×) e todo gráfico entra no **mesmo lugar** (painel branco à direita), do **mesmo jeito** (desliza da direita). O olho aprende o padrão em 30 s e desliga.
- No bruto ele fica parado no centro, com as mãos na frente do corpo. Ele quase não se move, então o movimento tem que vir da edição.
- Mapa de gestos (amostra a cada 4 s): o único gesto amplo é em **~0:31**, mão aberta para o lado direito da tela, em "esse é o nosso quadro de membros". Nos demais momentos as mãos ficam na frente do tronco, então os gráficos podem ir para qualquer canto que o enquadramento libere.

## 3. Linguagem de câmera (câmera virtual sobre o 1080p)

| Enquadramento | Zoom | Onde ele fica | Espaço para gráficos |
|---|---|---|---|
| **Aberto** | 1,0× | centro, corpo inteiro | ~650 px livres em cada lateral + cantos |
| **Médio esquerda** | 1,3× | terço esquerdo | painel à direita (o atual) |
| **Médio direita** | 1,3× | terço direito | painel à esquerda |
| **Fechado** | até 1,45× | rosto e ombros, centro | texto grande nas laterais |
| **PiP** | vídeo reduzido | janela arredondada num canto | tela cheia para o gráfico (telas do sistema grandes e legíveis) |
| **Tela cheia** | — | some por ≤ 3 s | só logo e fechamento |

Regras:
- **Movimentos animados** entre enquadramentos (0,9–1,2 s, ease in-out): afastar (pull-back), aproximar (push-in) e pan lateral. Sempre na troca de frase, nunca no meio de uma palavra.
- No máximo **1 movimento grande a cada ~8 s**. Nos trechos longos, deriva lenta contínua de 2–4% para a imagem nunca ficar congelada.
- O zoom de cada emenda (punch-in) continua, só que dentro do enquadramento do momento.
- **Limite de qualidade:** zoom máximo de 1,45×. Acima disso o 1080p amolece visivelmente.

## 4. Variedade de gráficos

Sair do "sempre card branco à direita". Repertório:
- Card branco (atual), usado em menos da metade dos momentos.
- **Elementos soltos na parede**: chips, ícones e texto grande, sem card, em cantos diferentes.
- **Faixas**: horizontal no topo ou acima da legenda (fluxos, pipelines, empilhadeiras atravessando).
- **Entradas variadas**: de cima, de baixo, da esquerda, em arco, saindo da mão dele (equipe).

## 5. Roteiro por trecho

| Tempo | Trecho | Câmera | Gráficos (onde) | SFX |
|---|---|---|---|---|
| 0:00–0:06 | Hook | **Aberto** com push-in lento 1,0→1,15 | título no canto sup. esquerdo; empilhadeiras atravessando a faixa inferior da esquerda para a direita | whoosh curto nas empilhadeiras |
| 0:06–0:11 | Colisão | aberto; **tremor de 0,25 s** em "colisão" | flash vermelho nas bordas; alerta + chips no canto sup. direito; linha de pico atravessando a tela | impacto grave baixo em "colisão" |
| 0:11–0:20 | 3 perguntas | **Fechado** 1,4× centro | cada pergunta num canto diferente (sup. esq. → sup. dir. → inf. dir.) | pop suave por pergunta (3) |
| 0:20–0:31 | Liftech | **Tela cheia 2 s** (logo) → volta em médio esquerda | card Uniso/orientador à direita (com o nome corrigido) | whoosh na revelação + brilho discreto |
| 0:31–0:37 | Equipe | **afasta para aberto** junto com o gesto da mão | 6 fotos saem da mão dele em arco no lado direito | 1 brilho só (não 6 pops) |
| 0:37–0:47 | Problema | **pan: ele vai para a direita** | card à esquerda; chips laranja "bagunçados" que se alinham | whoosh no pan |
| 0:47–1:00 | Plataforma | **PiP**: ele vira janela no canto inf. esquerdo | a tela do sistema nasce pequena e **expande para tela cheia** (~1 s), segura, depois recolhe para ~1300 px no centro-direita; chips ao redor da tela | whoosh na entrada do PiP; 1 clique nos chips |
| 1:00–1:13 | Objetivo | volta ao vídeo, médio 1,15 centro | Dados → Informação → Decisão em faixa no topo; chips nos cantos inferiores | ping em "decisão" |
| 1:13–1:33 | Hardware | médio esquerda com push-in lento | ESP32 e C++; eixos X/Y/Z girando devagar | clique ao acender cada logo (2) |
| 1:33–1:59 | Software | **afasta para aberto** | logos **dos dois lados dele**: Front/Back à esquerda, Dados/Ferramentas à direita; acendem quando ditos | clique bem baixo por logo (9) |
| 1:59–2:14 | Pipeline | médio centro, enquadramento um pouco mais alto | pipeline horizontal acima da legenda, pacotes indo da esquerda para a direita | whoosh curto quando a linha desenha |
| 2:15–2:31 | Central admin | **PiP** (círculo no canto inf. direito) | telas do admin em **tela cheia**; troca entre elas com **transição animada** (ver §5.1), com zoom na área citada em cada frase | whoosh curto a cada troca de tela (4) |
| 2:31–2:41 | App | **médio direita** | celular à esquerda entrando com leve giro 3D; telas do app trocam com **deslize lateral** dentro do celular, como um swipe | clique em cada tela (3) |
| 2:41–2:47 | 7 idiomas | fechado 1,4× | "7" grande à esquerda; à direita, **bandeira + sigla** de cada idioma surgindo em sequência (ver §5.2) | ping quando chega no 7 |
| 2:48–2:59 | Diferencial | **aberto** | "Monitoramento físico" entra pela esquerda, "Gestão operacional" pela direita, e se encontram acima da cabeça dele → "Um único ambiente" | 2 whooshes + impacto leve no encontro |
| 3:00–3:16 | Onde estamos | médio esquerda | checklist à direita | clique por item (5) |
| 3:17–3:28 | O que esperamos | médio direita | ícones em coluna à esquerda | pop suave (3) |
| 3:29–3:40 | Mensagem | **fechado** com push-in lento até 1,45× | texto grande direto na parede, nas laterais; "decisões" em destaque | riser curto (~2 s) levando ao fechamento |
| 3:41–3:47 | Fechamento | tela cheia | logo + "Otimizando a inteligência operacional..." | chime (o único do vídeo) |
| 3:47–3:51 | Nome e fim | **afasta para aberto** | lower-third "Victor Cardoso" → cartela final | whoosh curto no lower-third |

### 5.1 Transições entre telas do sistema

Repertório (alternar para não repetir a mesma duas vezes seguidas):
- **Expansão para tela cheia:** a tela sai do card/janela e cresce até ocupar o quadro inteiro; na saída, encolhe de volta.
- **Push lateral:** a tela nova empurra a anterior para fora (esquerda → direita), com leve desfoque de movimento.
- **Zoom-through:** a câmera "mergulha" num ponto da tela atual (ex.: menu "Histórico de Alertas") e a próxima tela abre a partir desse ponto.
- **Pilha de cartas:** a tela atual recua e escurece levemente enquanto a nova entra por cima.

Sequência proposta no trecho do admin (2:15–2:31): visão geral **expande para tela cheia** → equipe e setores por **push lateral** → frota por **zoom-through** no menu → histórico por **pilha de cartas** → recolhe e devolve o vídeo dele. Cada troca é casada com a palavra da fala ("visualizar", "gerenciar", "consultar", "histórico").

### 5.2 Bandeiras dos idiomas

- Mapeamento pelos idiomas do app (`Frontend/src/locales`): PT-BR → Brasil, EN-US → Estados Unidos, ES → Espanha, DE → Alemanha, FR → França, JA → Japão, RU → Rússia.
- Fonte: SVGs do pacote **flag-icons** (licença MIT), baixados via npm para a pasta temporária e copiados só os 7 usados. Não depende de emoji do sistema, que pode faltar no render.
- Visual: bandeira em cartão arredondado com a sigla embaixo, entrando uma a uma enquanto o contador sobe de 0 a 7.

## 6. Efeitos sonoros sem poluir

- **Fonte:** biblioteca que veio com as skills (`media-use/audio/assets/sfx`), 19 sons da **Pixabay**, licença de uso livre e comercial, sem atribuição obrigatória. Não precisa baixar nada.
- **Paleta fixa de 8 sons**: whoosh curto, whoosh, clique suave, pop, ping, brilho (sparkle), impacto grave, chime e riser (cortado). Sons iguais para ações iguais, como numa interface.
- **Volume:** 18–22 dB abaixo da voz. Ficam como textura, não como protagonistas. A voz continua em -16 LUFS e pico ≤ -1 dB (medido depois do render).
- **Densidade:**
  - No máximo 1 som a cada ~1,5 s.
  - Um grupo de elementos que entra junto ganha um som, não um por item.
  - Legenda nunca tem som.
  - Punch-in de emenda não tem som. Só movimentos grandes de câmera ganham whoosh.
- Estimativa: **~45 sons em 3:51** (média de 1 a cada 5 s, concentrados nas entradas).

## 7. Ordem de execução (quando aprovado)

1. Corrigir o nome (card + legenda).
2. Implementar os enquadramentos e o motor de câmera (transições animadas + deriva).
3. Reposicionar os gráficos trecho a trecho conforme a tabela, conferindo com snapshots se cobrem mãos ou rosto.
4. Adicionar os SFX como faixas de áudio separadas, nos instantes das animações.
5. **Prévia curta primeiro**: render só de 0:00–0:47 (~2 min de render) para você aprovar o ritmo, os movimentos e o volume dos sons.
6. Com a prévia aprovada, render completo (~9 min) e verificação: volume, pico, frames e sincronia.
7. A v1 continua guardada como `output/liftech-pitch-editado.mp4`. A v2 sai como `output/liftech-pitch-editado-v2.mp4`.

## 8. Decisões que ficam com você

- Intensidade dos movimentos: **moderada** (proposta acima) ou mais enérgica (mais trocas, tremores e zooms)?
- Sumir com ele em tela cheia por 2–3 s no logo e no fechamento: ok?
