# Liftech pitch — storyboard de motion graphics (proposta, nada renderizado)

Fonte: `~/Downloads/VIDEO-PITCH.mp4`, **take 1**. Tempos abaixo = segundos no arquivo original
(a transcrição por palavra foi feita com Whisper small; revisar termos antes de legendar).

## 1. Cortes (EDL do take 1)

| Ação | Tempo original | Motivo |
|---|---|---|
| Cortar | 0 – 8,3 s | silêncio antes de começar |
| **Manter** | **8,3 – 250 s** | take 1 completo (termina em "...agradeço muito pela sua atenção") |
| Cortar | 250 – 535 s | bastidores, take 2 e conversa final |
| Encurtar | pausas de ~1,5–2 s em ~70, ~131 e ~182 s | ritmo (deixar ~0,4 s) |

Duração final estimada: **~4:00**. Áudio: normalizar (~-16 LUFS), pois o original está em -36 dB de média.

## 2. Direção visual

- Marca do app: azul `#3a9cff`, fundo `#fafafa`, texto `#181818` / `#4c4c4c`, alerta `#c84646`,
  fonte **Host Grotesk**, cantos 5–10 px, UI clara. Logo: `Frontend/src/assets/logo-full.svg`.
- O palestrante fica à **esquerda**; cards vivem no **painel direito (~40%)**. Telas cheias só em 3 momentos.
- Movimento: entradas pela direita com ease-out suave, saídas rápidas, uma única família de curvas.
  Zoom lento (100→108%) no rosto em frases de ênfase para quebrar o plano fixo.
- Telas reais: `figma-telas/` (admin e funcionário). Vídeo de empilhadeira: `Frontend/src/assets/forklift.mp4`.

## 3. Cards (tempos originais)

| # | Tempo | Fala | Motion graphic | Zona |
|---|---|---|---|---|
| 1 | 8.7–14 | "dezenas de empilhadeiras movimentam cargas" | contador "dezenas" + ícones de empilhadeiras cruzando o painel | lado |
| 2 | 14.4–19 | "colisão ou frenagem brusca" | pulso vermelho + pico num gráfico de aceleração | lado |
| 3 | 19.3–28 | perguntas "como saber? qual equipamento? quando?" | 3 perguntas empilhadas, "?" pulsando, uma por vez | lado |
| 4 | 28.5–39 | "desenvolvemos a Liftech... Universidade de Sorocaba... prof. Denis" | revelação do logo + lower-third Engenharia da Computação · Uniso · Orientador | tela cheia curta + terço inferior |
| 5 | 39.3–45 | "nosso quadro de membros" | 6 fotos recortadas (`assets/team/`) entram em sequência, com nome e papel; o silêncio de ~3 s em 42–45 s dá tempo para ler | lado |
| 6 | 45–57 | verificações manuais, registros descentralizados | papéis/planilhas soltos, 3 etiquetas: manual · descentralizado · sem identificação | lado |
| 7 | 57–71 | "integrar em uma única plataforma" | peças soltas convergem para a janela do app (`admin-visao-geral.png`) | lado → tela cheia |
| 8 | 71–85 | "transformar dados em informações úteis" | fluxo Dados → Informação → Decisão | lado |
| 9 | 85–105 | microcontrolador ESP32, C++, sensores 3 eixos | chip ESP32 + eixos X/Y/Z com onda de aceleração | lado |
| 10 | 105–132 | React, TS, Node, Express, MongoDB, Mongoose, RabbitMQ, Figma, GitHub | cartões de tecnologia entrando na palavra exata, agrupados em Front / Back / Dados / Mensageria / Ferramentas | lado |
| 11 | 132–149 | "coleta... processamento... armazenamento... plataforma" | pipeline animado com pacotes de dados | lado |
| 12 | 149–175 | central do administrador e app móvel | telas principais em `assets/screens/` com destaques: admin visão geral → frota → equipe e setores → histórico de alertas; depois celular: visão geral → em processo → reportar ocorrência | lado |
| 13 | 175–183 | "suporte a 7 idiomas" | contador 0→7 + PT · EN · ES · DE · FR · JA · RU alternando | lado |
| 14 | 184–196 | "diferencial: monitoramento físico + gestão em um só ambiente" | dois blocos se fundem num só | lado |
| 15 | 197–213 | "já desenvolvemos... próximas etapas" | checklist: ✔ banco ✔ protótipos ✔ estrutura · ◻ integração HW+SW ◻ testes e validação | lado |
| 16 | 213–226 | "plataforma capaz de..." | 3 ícones: frota · ocorrências · segurança/manutenção | lado |
| 17 | 226–244 | "transformar informações em decisões... movimentar o futuro" | frase-final em tipografia grande + logo | tela cheia |
| 18 | 244–250 | "Eu sou o Victor Cardoso" | lower-third: Victor Cardoso · Equipe Liftech | terço inferior |

Legendas: faixa discreta embaixo (`embedded-captions`), PT-BR revisado à mão.

## 4. Assets já separados (`assets/`)

- `team/` (recortes quadrados a partir de `~/Downloads/integrantes-melhorada` (versões melhoradas por você), sem processamento nosso): lucas, maria, romulo, victor, vitor, daniel. Victor = quem fala (foto de jaqueta jeans).
- `screens/` (originais do Figma, sem upscale, só telas principais, sem modais): `admin-visao-geral`, `admin-frota`, `admin-equipe-setores`, `admin-historico-alertas`, `mobile-visao-geral`, `mobile-em-processo`, `mobile-reportar-ocorrencia`.
  Descartadas de propósito: modais (detalhe de máquina, alerta, categoria), cadastros/edições e `nao-desenvolver/`.

## 5. Decisões já tomadas

- Formato: 16:9 (1920x1080), como gravado. Sem música. Legendas ligadas. Telas do app como estão (sem upscale).
- Uso: apresentação ao vivo. **Duração: manter ~3:50, cortando só as pausas** (sem cortar conteúdo).
- Equipe (card 5): só o primeiro nome, sem papel.
- ESP32 e RabbitMQ: confirmados como reais pelo autor, mantidos nos cards 9–11.
- Logos: oficiais (Simple Icons, em `assets/logos/`, com cores em `brand-colors.json`), **todas com o mesmo tratamento** para não ficar desconexo: mesmo cartão arredondado, logo em tom único (`#181818`) que acende na cor da marca no instante em que a tecnologia é falada, mesma entrada, mesmo brilho e mesma saída. Ausentes: nenhuma (ESP32 = Espressif, C++, React, TypeScript, Node.js, Express, MongoDB, Mongoose, RabbitMQ, Figma, GitHub).

## 6. Áudio (medido no trecho 8,3–250 s)

- Original: -33,2 LUFS, pico real -11,6 dBTP, ruído de sala ~-71 dB (silêncio) — bem limpo, só baixo.
- Subir ~17 dB estouraria o pico (+5 dBTP), então a cadeia é: filtro passa-alta 80 Hz → compressor leve (3:1) → ganho para **-16 LUFS** → limitador.
- Teste feito: resultado **-16,0 LUFS, pico real -1,5 dBTP, pico de amostra -2,6 dB, sem clipping** (LRA 2,6).

## 7. Legendas

`captions-take1.srt` / `.json` (105 legendas, tempos no arquivo original; serão reajustados ao novo corte). Corrigidas pelo contexto: ESP32, RabbitMQ, C++, Node.js, Front-End/Back-End, rastreabilidade, "interface móvel", "sessão", "utilização", "consultar o histórico", Universidade **de** Sorocaba, Ângelo, "integramos".
Termos a confirmar ouvindo o áudio: "produto/projeto da Engenharia da Computação", "movimentos e orientação", "encaminhados para processamento".

## 8. Fatos do pitch vs repositório

| Afirmação | No repositório |
|---|---|
| React + TypeScript no front | Confere (React 19, TypeScript) |
| Node.js + Express + TypeScript no back | Confere (Express 5, TypeScript) |
| MongoDB com Mongoose | Confere (Mongoose; modelagem em `docs/modelagem_de_dados.md`) |
| 7 idiomas | Confere: pt-BR, en-US, es, de, fr, ja, ru |
| Central do admin (estado das máquinas, funcionários, setores, histórico de ocorrências) | Confere (telas em `figma-telas/` e features em `Backend/src/feature`) |
| App móvel do funcionário (sessão de uso, reportar incidente) | Confere (telas `funcionario/`, feature `session`/`incident`) |
| Sensores de impacto → telemetria | Confere em parte: há `Device` e `Telemetry` (`forcaImpacto`) e `POST /api/telemetry` |
| **ESP32 + C++, sensores de 3 eixos** | **Não está neste repositório** (sem firmware) |
| **RabbitMQ** | **Não aparece**: nenhuma dependência nem menção no código ou docs |
| "Já desenvolvemos modelagem, protótipos e estrutura" | Subestima: há API e telas implementadas. "Integração HW+SW e testes como próximas etapas" é coerente com a falta de firmware aqui |

## 9. Tempo

Decidido: **manter ~3:50**, cortando só as pausas longas (take 1 = 8,7 → 250 s ≈ 4:01 antes das pausas). Os 5 cortes de conteúdo que reduziriam para ~3:00 foram descartados.

## 10. Em aberto

Nada bloqueante.

## 11. Edição feita

- Backup do bruto: `~/Downloads/VIDEO-PITCH-original-backup.mp4` (idêntico ao original, conferido com `cmp`).
- Corte: `work/edl.mjs` → 12 trechos do take 1, pausas ≥1 s encurtadas para ~0,55 s (a da equipe fica ~1,2 s). Duração **3:51**.
- Áudio: passa-alta 80 Hz → compressor 3:1 → loudnorm → limitador. Medido no arquivo final do corte: **-16,0 LUFS, pico -1,4 dB, sem clipping**.
- Reenquadramento: vídeo com zoom 1,3× ancorado à direita (palestrante no terço esquerdo); em cada emenda alterna 1,30/1,36 para o salto parecer intencional.
- Composição: `work/build.mjs` + `work/style.css` geram `public/index.html` (21 cards, 105 legendas). Render: `output/liftech-pitch-editado.mp4`.
- Para refazer: `node work/build.mjs` e `npx hyperframes render public -o output/liftech-pitch-editado.mp4 --fps 30` (com ffmpeg no PATH).

## 12. Versão 2 (dinâmica)

Plano em `PLANO-V2.md`. O que mudou em relação à v1:
- Nome do orientador corrigido para **Prof. Denicezar Angelo Baldo** (card, legenda e `work/caps.mjs`). Legenda "consultório" → "consultar o".
- Câmera virtual com 6 enquadramentos (aberto, médio esquerda/direita, fechado, PiP retangular, PiP redondo) e transições animadas; deriva lenta nos trechos longos; punch-in das emendas num wrapper separado (`#video-punch`).
- Gráficos soltos em cantos diferentes, faixas no topo e na base, equipe saindo da mão dele (gesto em ~0:31), logos dos dois lados.
- Telas do admin em tela cheia com 4 transições (expansão, push lateral, mergulho no menu, pilha); app com swipe dentro do celular.
- Bandeiras (flag-icons, MIT) nos 7 idiomas: Brasil, EUA, Espanha, Alemanha, França, Japão, Rússia.
- 51 efeitos sonoros da biblioteca Pixabay incluída nas skills (`public/sfx/`), 18–22 dB abaixo da voz, no máximo 1 a cada 0,7 s.
- Gerador da v1 preservado em `work/build-v1.mjs` / `work/style-v1.css`. Prévia: `PREVIEW=56 node work/build.mjs`.
