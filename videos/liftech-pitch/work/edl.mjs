// EDL da gravação de 29/10 (source/pitch-v3-bruto.mp4): encurta pausas >= 0,9 s (silencedetect -42 dB).
// Os 4 cortes de câmera (31,16 · 49,28 · 87,25 · 175,48) caem dentro de pausas, então viram a própria emenda.
import fs from 'fs';
const IN = 13.80, OUT = 217.00;
const silences = [[30.46,34.03],[47.11,51.04],[86.39,89.94],[133.39,134.30],[139.52,140.57],[174.66,177.22],[207.38,209.04]];
const CAM_CUTS = [31.16, 49.28, 87.25, 175.48];
const segs = []; let cur = IN;
for (const [a, b] of silences) {
  const team = a > 47 && a < 48; // pausa da equipe fica ~1,6 s para ver as fotos
  const keepA = team ? 0.8 : 0.25, keepB = team ? 0.8 : 0.3;
  segs.push([cur, +(a + keepA).toFixed(3)]); cur = +(b - keepB).toFixed(3);
}
segs.push([cur, OUT]);
const close = (s) => (s > 31.16 && s < 49.28) || (s > 87.25 && s < 175.48);
for (const [s, e] of segs) if (CAM_CUTS.some((c) => c > s && c < e)) throw new Error(`corte de câmera dentro do trecho ${s}-${e}`);
let t = 0; const map = segs.map(([s, e]) => { const o = { src: s, srcEnd: e, out: +t.toFixed(3), cam: close(s) ? 'close' : 'wide' }; t += e - s; return o; });
fs.writeFileSync(new URL('./edl.json', import.meta.url), JSON.stringify({ segments: map, duration: +t.toFixed(3) }, null, 1));
const f = 0.012; // micro-fade de áudio em cada emenda (evita estalo)
// câmera fechada: parede mais escura e fria que a aberta (luma 183 vs 192)
const grade = ',eq=brightness=0.035,colorbalance=rm=0.015:bm=-0.015';
const v = segs.map(([s, e], i) => `[0:v]trim=${s}:${e},setpts=PTS-STARTPTS${close(s) ? grade : ''}[v${i}]`).join(';');
const a = segs.map(([s, e], i) => `[0:a]atrim=${s}:${e},asetpts=PTS-STARTPTS,afade=t=in:d=${f},afade=t=out:st=${(e - s - f).toFixed(3)}:d=${f}[a${i}]`).join(';');
const cat = segs.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${segs.length}:v=1:a=1[vc][a];[vc]fps=30[v]`;
fs.writeFileSync(new URL('./cut.filter', import.meta.url), `${v};${a};${cat}`);
console.log(segs.length, 'segmentos, duração', t.toFixed(2), 's');
console.log(map.map((m) => `${m.out.toFixed(2)} ${m.cam} ${m.src}-${m.srcEnd}`).join('\n'));
