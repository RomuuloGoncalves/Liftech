// EDL do take 1: encurta pausas >= 1 s (detectadas por silencedetect -42 dB) para ~0,55 s.
import fs from 'fs';
const IN = 8.40, OUT = 248.90;
const silences = [[42.27,44.97],[69.97,71.45],[83.73,85.07],[104.54,105.59],[131.19,132.87],[139.79,140.86],[147.98,149.00],[174.48,175.50],[181.72,183.77],[195.53,196.67],[236.98,238.19]];
const segs = []; let cur = IN;
for (const [a, b] of silences) {
  const keepA = a < 43 ? 0.5 : 0.25, keepB = a < 43 ? 0.7 : 0.30; // pausa da equipe fica maior (~1,2 s) para leitura do card
  segs.push([cur, +(a + keepA).toFixed(3)]); cur = +(b - keepB).toFixed(3);
}
segs.push([cur, OUT]);
let t = 0; const map = segs.map(([s, e]) => { const o = { src: s, srcEnd: e, out: +t.toFixed(3) }; t += e - s; return o; });
fs.writeFileSync(new URL('./edl.json', import.meta.url), JSON.stringify({ segments: map, duration: +t.toFixed(3) }, null, 1));
const f = 0.012; // micro-fade de áudio em cada emenda (evita estalo)
const v = segs.map(([s, e], i) => `[0:v]trim=${s}:${e},setpts=PTS-STARTPTS[v${i}]`).join(';');
const a = segs.map(([s, e], i) => `[0:a]atrim=${s}:${e},asetpts=PTS-STARTPTS,afade=t=in:d=${f},afade=t=out:st=${(e - s - f).toFixed(3)}:d=${f}[a${i}]`).join(';');
const cat = segs.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${segs.length}:v=1:a=1[v][a]`;
fs.writeFileSync(new URL('./cut.filter', import.meta.url), `${v};${a};${cat}`);
console.log(segs.length, 'segmentos, duração', t.toFixed(2), 's');
