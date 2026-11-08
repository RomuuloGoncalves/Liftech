# Plano v3: novo vídeo do pitch (gravação de 29/10)

Status: **plano, nada editado**. Fonte: `~/Downloads/VITOR VIDEO PITCH 2910 1 (Output 1).mp4`.
Tempos "fonte" = segundos no arquivo novo; tempos "final" = estimativa no vídeo editado.

## 1. O que é o vídeo novo

| Item | Medido |
|---|---|
| Duração | 3:37,9 (217,9 s) |
| Vídeo | 1920x1080, H.264, **29,97 fps** (o anterior era 30) |
| Áudio | AAC 48 kHz estéreo, **-37,1 LUFS**, pico real -15,5 dBTP, ruído de fundo -84 dB (limpo, só baixo) |
| Takes | **Um só take**, completo, sem repetições. Bastidores só no começo (0–13 s: "dá para descer um pouco o teleprompter?", "um, dois, três") |
| Câmeras | **Duas câmeras já intercaladas** pelo editor: aberta (corpo inteiro, parede clara) e fechada (cintura para cima, parede mais cinza). Mesmo apresentador da v2 (Victor), agora de camisa azul-clara |
| Fundo | Parede lisa nas duas câmeras: ótimo para gráficos "soltos" direto na parede |

Cortes de câmera (fonte): **31,2 s** (aberta → fechada), **49,3 s** (→ aberta), **87,3 s** (→ fechada), **175,5 s** (→ aberta).

Diferença de cor entre as câmeras: a fechada está um pouco mais escura e fria (luma da parede 183 vs 192). Dá para igualar com um ajuste leve de brilho e temperatura só nos trechos da fechada.

Nitidez: a câmera aberta aguenta zoom digital de até ~1,45× (como na v2). A **fechada já é mais macia**, então nela o limite é **~1,15×**.

## 2. O que mudou no roteiro em relação ao take 1

O texto é praticamente o mesmo, com quatro diferenças que afetam a edição:

1. **Saiu o trecho "Onde estamos"** ("já desenvolvemos a modelagem, protótipos... próximas etapas"). O card do checklist (c15 da v2) deixa de existir.
2. **Saiu "Eu sou o Victor Cardoso"**. Ele termina com "Muito obrigado pela sua atenção". O lower-third com o nome precisa de outro lugar (ver §8).
3. "Um produto da Engenharia" virou "**um projeto** da Engenharia da Computação".
4. Fala mais solta e rápida: o conteúdo cabe em 3:23 antes de cortar as pausas (o take 1 tinha 4:01).

As cenas e os assets da v2 (telas, equipe, logos, bandeiras e SFX) continuam valendo para todo o resto.

## 3. Corte (EDL)

| Ação | Fonte | Motivo |
|---|---|---|
| Cortar | 0 – 13,9 s | bastidores, teleprompter, contagem |
| Manter | 13,9 – 217,4 s | pitch completo |
| Encurtar para ~0,6 s | 32,6–34,8 · 87,0–90,0 (coincide com o corte de câmera) · 174,7–177,2 (idem) | ritmo |
| Encurtar para ~1,6 s | 47,3–51,1 | pausa da equipe, para dar tempo de ver as fotos |

Resultado: **~3:15 de fala + ~2 s de cartela final ≈ 3:17**. Só pausas saem, nenhuma frase é cortada.

Conferi dois pontos suspeitos da transcrição isolando o trecho: "professor **por** Denis..." e "foi proje... projetada" são **erros do Whisper**, não da fala. Nos dois casos a fala está limpa e não precisa de corte.

## 4. Áudio

- Mesma cadeia da v2: passa-alta 80 Hz → compressor 3:1 → loudnorm para **-16 LUFS** → limitador em -1 dBTP.
- Precisa de ~+21 dB (a v2 precisou de ~+17). Como o ruído de fundo está em -84 dB, sobra margem. Antes do render faço o teste e meço o volume, o pico e se há clipping.
- SFX: mesma paleta e mesmas regras da v2 (18–22 dB abaixo da voz, no máximo 1 a cada 0,7 s). Sai ~1 som (o checklist), então ficam **~45 sons**.

## 5. Legendas

Transcrição nova com palavra a palavra (`words.json`). Correções que entram na lista do `caps.mjs`:

| Whisper | Correto |
|---|---|
| LIFTEC / Liftech | Liftech |
| Universidade Sorocaba | Universidade de Sorocaba |
| professor por Denis César Ângelo Baldo | professor Denicezar Angelo Baldo |
| microcontroller | microcontrolador |
| rastriabilidade | rastreabilidade |
| empiradeiras | empilhadeiras |
| interface imóvel | interface móvel |
| da nossas interfaces | das nossas interfaces |
| Como responsável pela operação, ficaria sabendo. | Como responsável pela operação, como ficaria sabendo? (vou ouvir para confirmar se ele diz "como") |
| frase duplicada em 165–170 s | remover (sobreposição entre blocos do Whisper) |

## 6. Câmera virtual com duas câmeras reais

Na v2 havia uma câmera só e todo o movimento vinha do zoom digital. Agora já existem 4 trocas reais de câmera, então:

- **As trocas reais contam como movimento.** Não coloco outro movimento grande nem punch-in a menos de ~3 s delas.
- **Enquadramentos por câmera:**
  - Aberta (rosto em ~970, 290): todos os da v2 (aberto, médio esq./dir. 1,3×, fechado 1,42×, PiP).
  - Fechada (rosto em ~890, 300; ombros de 470 a 1370 px): só deriva lenta até 1,1×, médio esq./dir. a 1,15× e PiP. Nada de "fechado" digital por cima da câmera fechada.
- **Trecho longo na câmera fechada (fonte 87–175 s = 1:28 seguido):** é onde estão hardware, software, pipeline, telas do admin, app e idiomas. Como ali o zoom é limitado, o dinamismo vem do **PiP com telas em tela cheia**, dos gráficos nas laterais (cerca de 470 px livres de cada lado) e da troca médio esq. ↔ médio dir.
- Punch-in nas emendas das pausas, como na v2, só dentro da câmera aberta.

## 7. Roteiro por trecho (tempos finais estimados)

| Final | Fonte | Câmera real | Trecho | Ajuste em relação à v2 |
|---|---|---|---|---|
| 0:00–0:10 | 14,1–23,8 | aberta | Hook + colisão | igual (push-in, empilhadeiras, tremor + flash em "colisão") |
| 0:10–0:19 | 24,1–32,6 | aberta → **fechada em 0:17** | 3 perguntas | as duas primeiras nos cantos com ele aberto; a troca real para a fechada substitui o "fechado" digital; a 3ª pergunta entra no canto livre da fechada |
| 0:19–0:29 | 34,8–44,7 | fechada | Liftech + Uniso + orientador | logo em tela cheia (ele some 2 s); card "Projeto · Engenharia da Computação · Universidade de Sorocaba · **Prof. Denicezar Angelo Baldo**" |
| 0:29–0:34 | 44,9–51,1 | fechada → **aberta em ~0:32** | Equipe | as fotos já não saem da mão dele (o gesto era do take 1): entram em arco pela direita e a troca para a aberta acontece com as fotos na tela |
| 0:33–0:45 | 51,1–62,7 | aberta | Problema | igual (pan, ele à direita, card à esquerda, chips bagunçados) |
| 0:45–0:57 | 63,2–75,0 | aberta | Plataforma | igual (PiP retangular, tela expande para tela cheia) |
| 0:58–1:09 | 75,4–87,0 | aberta | Objetivo | igual (faixa Dados → Informação → Decisão) |
| 1:09–1:29 | 90,0–109,5 | **fechada** | Hardware | médio esq. 1,15× com ESP32/C++ e eixos à direita |
| 1:30–1:54 | 109,8–134,1 | fechada | Software | logos dos dois lados, em coluna nas faixas laterais (cartões um pouco menores que na v2) |
| 1:54–2:07 | 134,4–146,7 | fechada | Pipeline | faixa horizontal acima da legenda |
| 2:07–2:21 | 147,5–160,7 | fechada | Central admin | igual (PiP redondo + 4 transições entre telas) |
| 2:21–2:28 | 161,3–168,6 | fechada | App | médio dir. 1,15×, celular à esquerda com swipe |
| 2:29–2:35 | 168,9–174,7 | fechada | 7 idiomas | igual (contador + bandeiras) |
| 2:35–2:45 | 177,2–186,7 | **aberta** | Diferencial | a troca real para a aberta abre o trecho; blocos se fundem acima da cabeça |
| 2:46–2:56 | 187,5–197,7 | aberta | O que esperamos | médio dir. com os 3 ícones à esquerda (o checklist sai) |
| 2:56–3:07 | 198,0–208,6 | aberta | Mensagem | igual (fechado 1,45× com push-in, texto na parede, riser) |
| 3:07–3:12 | 209,1–213,8 | — | Fechamento | igual (tela cheia, logo + frase, chime) |
| 3:12–3:17 | 214,2–217,4 | aberta | "Muito obrigado" | afasta para aberto + lower-third **Victor · Equipe Liftech** → cartela final |

## 8. Pontos em aberto

1. **Nome do apresentador:** como ele não se apresenta mais, a proposta é o lower-third "Victor · Equipe Liftech" no "Muito obrigado" (mesmo lugar da v2). A alternativa é colocá-lo nos primeiros segundos do hook.
2. **Igualar a cor das duas câmeras:** a proposta é um ajuste leve na fechada (+brilho, levemente mais quente) para a troca não "piscar".
3. **Os arquivos antigos sumiram de Downloads**: `VIDEO-PITCH.mp4` e o backup `VIDEO-PITCH-original-backup.mp4` não estão mais lá. A v1, a v2 e o corte do take 1 (`work/cut-raw.mov`) continuam no projeto. Proponho guardar uma cópia do vídeo novo em `videos/liftech-pitch/source/` antes de editar.

## 9. Ordem de execução (quando aprovado)

1. Backup do vídeo novo + cópia de segurança do gerador da v2 (`work/build-v2.mjs`, `work/style-v2.css`).
2. Nova EDL (`edl.mjs` com IN/OUT e as pausas acima) → `public/input-video.mp4` com áudio normalizado e cor da câmera fechada ajustada (re-encode a 30 fps para manter o projeto igual).
3. Novas legendas a partir de `words.json` + lista de correções.
4. Reancorar as cenas no `build.mjs`: os gatilhos já buscam a palavra falada (`W('palavra', tempo)`), então basta atualizar os tempos de referência, remover o checklist e adaptar câmera/equipe/nome conforme a §7.
5. **Prévia de 0:00–0:45** (cobre as duas trocas de câmera, o logo e a equipe) para você aprovar.
6. Render completo → `output/liftech-pitch-editado-v3.mp4` + verificação de volume, pico, frames e sincronia. A v1 e a v2 ficam como estão.
