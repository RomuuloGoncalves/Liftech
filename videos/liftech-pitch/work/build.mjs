// Gera public/index.html (composição HyperFrames) a partir do EDL, da transcrição e das legendas.
// Tempos dos cards são escritos em segundos do BRUTO (source/pitch-v3-bruto.mp4) e convertidos para o corte limpo via EDL.
// Versão anterior (take 1 da primeira gravação): build-v2.mjs.
import fs from 'fs';

const here = (p) => new URL(p, import.meta.url);
const edl = JSON.parse(fs.readFileSync(here('./edl.json')));
// os blocos do Whisper se sobrepõem: descarta palavras que voltam no tempo (repetição do bloco anterior)
let lastS = -1;
const words = JSON.parse(fs.readFileSync(here('./words-v3.json')))
  .map((x) => ({ t: x.text.trim().toLowerCase().replace(/[.,!?;:]/g, ''), s: x.timestamp[0] }))
  .filter((x) => { if (!x.t || x.s < lastS - 0.05) return false; lastS = x.s; return true; });
const caps = JSON.parse(fs.readFileSync(here('../captions-v3.json')));
const FPS = 30000 / 1001;
const DUR = edl.duration;
const TOTAL = DUR + 2.0; // cartela final segura ~2 s depois do fim da fala

// tempo do original -> tempo no corte (dentro de uma pausa removida, cai no início do próximo trecho)
const out = (src) => {
  for (const g of edl.segments) {
    if (src < g.src) return g.out;
    if (src <= g.srcEnd) return g.out + (src - g.src);
  }
  return DUR;
};
const q = (t) => Math.round(t * FPS) / FPS;
const O = (src) => +q(out(src)).toFixed(4);
// início da primeira palavra que começa com `w` a partir de `after` (segundos do original)
const W = (w, after) => {
  const hit = words.find((x) => x.s >= after && x.t.startsWith(w.toLowerCase()));
  if (!hit) throw new Error(`palavra não encontrada: ${w} após ${after}`);
  return hit.s;
};

const brand = JSON.parse(fs.readFileSync(here('../assets/logos/brand-colors.json')));
const svg = (name) =>
  fs.readFileSync(here(`../public/img/logos/${name}.svg`), 'utf8').replace('<svg ', '<svg class="logo-svg" ');

const ICON = {
  forklift: '<svg viewBox="0 0 64 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 36V16h16l8 12v8"/><path d="M30 34h6"/><path d="M44 4v32h14"/><circle cx="14" cy="38" r="5"/><circle cx="32" cy="38" r="5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.5 3 3 6-6.5"/></svg>',
  todo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="3 3"><circle cx="12" cy="12" r="10"/></svg>',
  clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/></svg>',
  split: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="5" width="7" height="7" rx="1.5"/><rect x="6" y="14" width="7" height="7" rx="1.5"/></svg>',
  fleet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17V8h6l3 5v4"/><path d="M15 3v14h6"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
};

// ---------- cards ----------
// cada card: id, janela (src), zona ('panel' | 'wide' | 'full' | 'lower'), html, anims(list de [srcTime, js(T)])
const cards = [];
const A = []; // linhas do timeline
const fmt = (n) => n.toFixed(4);
const at = (src) => fmt(O(src));
const add = (s) => A.push(s);
const sel = (id, s = '') => `'#${id}${s ? ' ' + s : ''}'`;

const rise = (id, s, t, d = 0.55, y = 26) =>
  add(`tl.fromTo(${sel(id, s)},{opacity:0,y:${y}},{opacity:1,y:0,duration:${d},ease:'power3.out',stagger:0.08},${at(t)});`);
const pop = (id, s, t, d = 0.5) =>
  add(`tl.fromTo(${sel(id, s)},{opacity:0,scale:0.7},{opacity:1,scale:1,duration:${d},ease:'back.out(1.7)',stagger:0.07},${at(t)});`);
const fade = (id, s, t, to = 1, d = 0.4) =>
  add(`tl.fromTo(${sel(id, s)},{opacity:${to ? 0 : 1}},{opacity:${to},duration:${d},ease:'power2.out'},${at(t)});`);
const wipe = (id, s, t, d = 0.7) =>
  add(`tl.fromTo(${sel(id, s)},{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:${d},ease:'power2.inOut'},${at(t)});`);
const draw = (id, s, t, d = 0.9) =>
  add(`(function(){document.querySelectorAll(${sel(id, s)}).forEach(function(el){var L=el.getTotalLength();tl.fromTo(el,{strokeDasharray:L,strokeDashoffset:L},{strokeDashoffset:0,duration:${d},ease:'power2.inOut'},${at(t)});});})();`);
// logos: mesmo cartão e mesmo efeito para todas — entram neutras e "acendem" na cor da marca quando são faladas
const lightLogo = (id, key, t) => {
  const c = brand[key].hex;
  add(`tl.to(${sel(id, `.tile[data-k="${key}"]`)},{color:'${c}',borderColor:'${c}',boxShadow:'0 0 0 6px ${c}22, 0 18px 40px ${c}33',scale:1.06,duration:0.35,ease:'power2.out'},${at(t)});`);
  add(`tl.to(${sel(id, `.tile[data-k="${key}"]`)},{scale:1,duration:0.4,ease:'power2.inOut'},${fmt(O(t) + 0.35)});`);
  add(`tl.fromTo(${sel(id, `.tile[data-k="${key}"] .shine`)},{xPercent:-120},{xPercent:120,duration:0.7,ease:'power2.inOut'},${at(t)});`);
};
const tile = (key, label) =>
  `<div class="tile" data-k="${key}"><span class="shine"></span>${svg(key)}<span class="tile-label">${label}</span></div>`;
const counter = (id, s, from, to, t, d = 1.2) =>
  add(`(function(){var o={v:${from}};tl.to(o,{v:${to},duration:${d},ease:'power2.out',onUpdate:function(){var el=document.querySelector(${sel(id, s)});if(el)el.textContent=String(Math.round(o.v));}},${at(t)});})();`);

function card(id, s, e, zone, html, anims, o = {}) {
  cards.push({ id, s, e, zone, html, cls: o.cls });
  // entrada/saída padrão; zonas 'free'/'stage' não têm fundo: os filhos animam por conta própria
  const S = o.S ?? O(s), E = o.E ?? O(e);
  if (zone === 'full' || zone === 'free' || zone === 'stage') {
    add(`tl.fromTo('#${id} .panel',{opacity:0},{opacity:1,duration:${zone === 'full' ? 0.5 : 0.3},ease:'power2.out'},${fmt(S)});`);
  } else {
    const dx = zone === 'panel-l' ? -60 : 60;
    add(`tl.fromTo('#${id} .panel',{opacity:0,x:${dx}},{opacity:1,x:0,duration:0.6,ease:'power3.out'},${fmt(S)});`);
    add(`tl.fromTo('#${id} .panel',{y:0},{y:-10,duration:${fmt(Math.max(0.1, E - S))},ease:'none'},${fmt(S)});`);
  }
  if (!o.noExit) add(`tl.to('#${id} .panel',{opacity:0,duration:0.35,ease:'power2.in'},${fmt(Math.max(S, E - 0.35))});`);
  cards.at(-1).S = S; cards.at(-1).E = E;
  anims && anims();
}

const kicker = (t) => `<div class="kicker">${t}</div>`;

// ---------- câmera virtual ----------
// o bruto já alterna duas câmeras reais (aberta e fechada); cada uma tem o rosto num ponto e um limite de zoom
// (a fechada é mais macia: no máximo ~1,15×). Os cortes de câmera caem nas emendas do EDL.
const FACES = { wide: [970, 290], close: [890, 300] };
const camAt = (t) => { let c = edl.segments[0].cam; for (const g of edl.segments) if (t >= g.out - 1e-6) c = g.cam; return c; };
const frame = (s, fx, fy, cam = 'wide') => {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const [X, Y] = FACES[cam];
  return { s, cam, x: +clamp(fx - s * X, 1920 - 1920 * s, 0).toFixed(1), y: +clamp(fy - s * Y, 1080 - 1080 * s, 0).toFixed(1) };
};
const CAMS = {
  wide: {
    wide: frame(1, 960, 290), push: frame(1.15, 960, 330), close: frame(1.42, 960, 380),
    medL: frame(1.3, 640, 340), medR: frame(1.3, 1280, 340),
    // dentro do PiP a janela é pequena (28%), então dá para aproximar bem sem perder nitidez
    pip: frame(2.1, 960, 470), pipc: frame(2.0, 960, 540),
  },
  close: {
    wide: frame(1, 960, 300, 'close'), push: frame(1.08, 960, 320, 'close'), close: frame(1.15, 960, 340, 'close'),
    medL: frame(1.15, 640, 340, 'close'), medR: frame(1.15, 1280, 340, 'close'),
    pip: frame(1, 960, 300, 'close'), pipc: frame(1.1, 960, 330, 'close'),
  },
};
const camCuts = edl.segments.filter((g, i) => i && g.cam !== edl.segments[i - 1].cam).map((g) => g.out);
let camNow = CAMS.wide.wide;
const camTo = (t, f, d = 1.0, ease = 'power2.inOut') => {
  if (camCuts.some((c) => c > t + 0.01 && c < t + d - 0.01)) throw new Error(`movimento de câmera atravessa um corte real em ${t.toFixed(2)}`);
  camNow = typeof f === 'string' ? CAMS[camAt(t + 0.01)][f] : f;
  add(`tl.to('#video-inner',{scale:${camNow.s},x:${camNow.x},y:${camNow.y},duration:${d},ease:'${ease}'},${fmt(t)});`);
};
const camSet = (t, f) => { camNow = CAMS[camAt(t + 0.01)][f]; add(`tl.set('#video-inner',{scale:${camNow.s},x:${camNow.x},y:${camNow.y}},${fmt(t)});`); };
// deriva lenta: aproxima ~3% mantendo o rosto no mesmo ponto da tela
const drift = (t, d, k = 1.03) => {
  const [X, Y] = FACES[camNow.cam];
  const fx = camNow.x + camNow.s * X, fy = camNow.y + camNow.s * Y;
  camTo(t, frame(+(camNow.s * k).toFixed(4), fx, fy, camNow.cam), d, 'none');
};
const shake = (t) => {
  [[14, -6], [-11, 5], [8, -3], [-4, 2], [0, 0]].forEach(([x, y], i) =>
    add(`tl.to('#video-wrap',{x:${x},y:${y},duration:0.06,ease:'none'},${fmt(t + i * 0.06)});`));
};
// PiP: o vídeo vira uma janela — retangular no canto inferior esquerdo ou redonda no canto inferior direito
const PIPS = {
  rect: { scale: 0.28, x: 50, y: 650, clip: 'inset(0px 0px 0px 0px round 90px)', ring: '#pip-ring' },
  // círculo de 1080 px no centro do quadro, reduzido a 26% (≈281 px) e levado para o canto inferior direito
  circle: { scale: 0.26, x: 1470, y: 739, clip: 'inset(0px 420px 0px 420px round 540px)', ring: '#pip-ring-c' },
};
const pipIn = (t, d = 1.0, kind = 'rect') => {
  const p = PIPS[kind];
  add(`tl.to('#video-wrap',{scale:${p.scale},x:${p.x},y:${p.y},clipPath:'${p.clip}',duration:${d},ease:'power3.inOut'},${fmt(t)});`);
  add(`tl.fromTo('${p.ring}',{opacity:0},{opacity:1,duration:0.4,ease:'power2.out'},${fmt(t + d - 0.2)});`);
  camTo(t, kind === 'circle' ? 'pipc' : 'pip', d);
};
const pipOut = (t, f = 'medL', d = 1.0, kind = 'rect') => {
  add(`tl.to('${PIPS[kind].ring}',{opacity:0,duration:0.2},${fmt(t)});`);
  add(`tl.to('#video-wrap',{scale:1,x:0,y:0,clipPath:'inset(0px 0px 0px 0px round 0px)',duration:${d},ease:'power3.inOut'},${fmt(t)});`);
  camTo(t, f, d);
};

// ---------- efeitos sonoros ----------
// volume calibrado pelo pico de cada arquivo: tudo fica 18–22 dB abaixo da voz
const SFX = {
  whoosh: ['whoosh.mp3', 0.13, 0.58], click: ['click-soft.mp3', 0.12, 0.37], pop: ['pop.mp3', 0.14, 0.72],
  ping: ['ping.mp3', 0.2, 1.32], sparkle: ['sparkle.mp3', 0.06, 1.8], impact: ['impact-bass-1.mp3', 0.07, 2.1],
  chime: ['chime.mp3', 0.35, 2.54], riser: ['riser.mp3', 0.06, 2.4, 7.6], tick: ['click-soft.mp3', 0.08, 0.37],
};
const sounds = [];
const sfx = (kind, t) => { if (t >= 0 && t < TOTAL) sounds.push({ kind, t: q(t) }); };
// no máximo um som a cada 0,7 s (o resto é descartado para não poluir)
const spaced = () => { const out = []; for (const x of [...sounds].sort((a, b) => a.t - b.t)) if (!out.length || x.t - out.at(-1).t >= 0.7) out.push(x); return out; };

const team = [['daniel', 'Daniel'], ['lucas', 'Lucas'], ['maria', 'Maria'], ['romulo', 'Rômulo'], ['victor', 'Victor'], ['vitor', 'Vitor']];
// 1. hook — câmera aberta aproximando devagar; título solto no canto, empilhadeiras atravessando a tela
camSet(0, 'wide');
camTo(O(14.0), 'push', O(19.2) - O(14.0), 'none');
card('c01', 13.9, 19.2, 'free', `
  <div class="free-tl">
    ${kicker('Operação industrial')}
    <h2 class="title xl">Dezenas de<span>empilhadeiras</span></h2>
    <p class="body">movimentando cargas todos os dias</p>
  </div>
  <div class="convoy">${Array.from({ length: 7 }, () => `<span class="fk">${ICON.forklift}</span>`).join('')}</div>`, () => {
  rise('c01', '.kicker', 14.1);
  rise('c01', '.title', 14.25);
  const t = W('empilhadeiras', 16);
  add(`tl.fromTo('#c01 .convoy',{x:-1400},{x:2100,duration:4.2,ease:'none'},${at(t - 0.2)});`);
  sfx('whoosh', O(t) - 0.1);
  rise('c01', '.body', W('movimentam', 17));
});

// 2. incidente — tremor + borda vermelha na palavra "colisão"; alerta no canto superior direito
const tCol = W('colisão', 21);
shake(O(tCol));
add(`tl.fromTo('#flash',{opacity:0},{opacity:1,duration:0.08},${at(tCol)});`);
add(`tl.to('#flash',{opacity:0,duration:0.9,ease:'power2.out'},${fmt(O(tCol) + 0.1)});`);
sfx('impact', O(tCol));
card('c02', 19.25, 24.0, 'free', `
  <div class="corner-card tr">
    ${kicker('E se algo acontecer?')}
    <div class="alert-row"><span class="pulse"></span><span class="alert-ic">${ICON.alert}</span></div>
    <div class="chips"><span class="chip red">Colisão</span><span class="chip red">Frenagem brusca</span></div>
  </div>
  <svg class="spark-band" viewBox="0 0 1920 160" fill="none" preserveAspectRatio="none"><path d="M0 110 L520 108 L700 112 L820 106 L880 110 L930 18 L965 150 L1000 96 L1080 112 L1300 104 L1920 108" stroke="#c84646" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`, () => {
  add(`tl.fromTo('#c02 .corner-card',{opacity:0,y:-40},{opacity:1,y:0,duration:0.6,ease:'power3.out'},${at(19.45)});`);
  pop('c02', '.alert-ic', 19.65);
  add(`tl.fromTo('#c02 .pulse',{scale:0.4,opacity:0.7},{scale:2.4,opacity:0,duration:1.2,ease:'power2.out',repeat:2},${at(19.65)});`);
  pop('c02', `.chip:nth-child(1)`, tCol);
  pop('c02', `.chip:nth-child(2)`, W('frenagem', 22));
  draw('c02', '.spark-band path', tCol - 0.2, 1.4);
});

// 3. perguntas — ainda na câmera aberta (o corte real para a fechada vem logo depois); cada pergunta num canto
camTo(O(24.0) - 0.3, frame(1.25, 960, 360), 1.1);
drift(O(24.0) + 0.9, O(30.7) - O(24.0) - 1.0);
card('c03', 24.0, 30.7, 'free', `
  <div class="bubble b1"><b>?</b><span>Quem fica sabendo?</span></div>
  <div class="bubble b2"><b>?</b><span>Qual equipamento?</span></div>
  <div class="bubble b3"><b>?</b><span>Em que momento?</span></div>`, () => {
  [[1, 24.2], [2, W('equipamento', 27)], [3, W('momento', 28)]].forEach(([n, t]) => {
    add(`tl.fromTo('#c03 .b${n}',{opacity:0,scale:0.6,y:30},{opacity:1,scale:1,y:0,duration:0.6,ease:'back.out(1.6)'},${at(t)});`);
    sfx('pop', O(t));
  });
});

// corte real → câmera fechada
camSet(camCuts[0], 'wide');
drift(camCuts[0] + 0.05, O(37.2) - camCuts[0] - 0.3, 1.04);

// 4. Liftech — logo em tela cheia por ~2 s; por baixo a câmera troca para médio-esquerda; depois o card da Uniso
const tLogo = O(W('liftec', 37)) - 0.25;
card('c04logo', 0, 0, 'full', `<div class="end"><img class="end-logo" src="img/logo-full.svg" alt="Liftech"/></div>`, () => {
  add(`tl.fromTo('#c04logo .end-logo',{opacity:0,scale:0.8},{opacity:1,scale:1,duration:0.8,ease:'power3.out'},${fmt(tLogo + 0.1)});`);
  sfx('whoosh', tLogo);
  sfx('sparkle', tLogo + 0.45);
}, { S: tLogo, E: tLogo + 2.3 });
camSet(tLogo + 0.6, 'medL');
card('c04', 0, 44.8, 'panel', `
  ${kicker('Quem somos')}
  <p class="meta"><b>Engenharia da Computação</b></p>
  <p class="meta">Universidade de Sorocaba</p>
  <div class="hr"></div>
  <p class="meta small">Orientador</p>
  <p class="meta prof">Prof. Denicezar Angelo Baldo</p>`, () => {
  add(`tl.fromTo('#c04 .hr',{scaleX:0},{scaleX:1,duration:0.6,ease:'power2.out'},${at(W('orientado', 41))});`);
  rise('c04', '.meta:nth-of-type(1)', W('projeto', 38));
  rise('c04', '.meta:nth-of-type(2)', W('universidade', 40));
  rise('c04', '.meta:nth-of-type(3)', W('orientado', 41));
  rise('c04', '.meta:nth-of-type(4)', W('orientado', 41) + 0.3);
}, { S: tLogo + 2.0, cls: 'narrow' });

// 5. equipe — no "quadro de membros" ele abre a mão para o lado ESQUERDO da tela (fonte 45,2–47,2 s):
// a câmera leva ele para a direita (médio-direita da fechada) e as fotos saem da mão dele para o canto superior esquerdo;
// o corte real para a câmera aberta acontece com as fotos na tela
camTo(O(44.8) - 0.35, 'medR', 0.8);
sfx('whoosh', O(44.8) - 0.35);
const HAND = [400, 760]; // mão aberta no médio-direita (≈330, 720 no bruto × 1,15)
const slots = [[160, 150], [370, 150], [580, 150], [160, 410], [370, 410], [580, 410]];
card('c05', 44.9, 51.0, 'free', `
  <div class="team-kicker">${kicker('Equipe Liftech')}</div>
  ${team.map(([f, n], i) => `<div class="member free m${i}" style="left:${slots[i][0] - 95}px;top:${slots[i][1] - 20}px"><img src="img/team/${f}.jpg" alt="${n}"/><span>${n}</span></div>`).join('')}`, () => {
  const t = W('quadro', 45);
  rise('c05', '.team-kicker', t);
  team.forEach((_, i) => {
    const [x, y] = slots[i];
    add(`tl.fromTo('#c05 .m${i}',{opacity:0,scale:0.15,x:${HAND[0] - x},y:${HAND[1] - (y + 90)}},{opacity:1,scale:1,x:0,y:0,duration:0.75,ease:'back.out(1.4)'},${fmt(O(t) + 0.15 + i * 0.09)});`);
  });
  sfx('sparkle', O(t) + 0.15);
});
// corte real → câmera aberta
camSet(camCuts[1], 'wide');

// 6. problema — pan: ele vai para a direita, card à esquerda; chips tortos como "bagunça"
camTo(O(51.1) - 0.1, 'medR', 1.1);
sfx('whoosh', O(51.1) - 0.1);
card('c06', 51.1, 62.9, 'panel-l', `
  ${kicker('O problema')}
  <h2 class="title sm">Como é hoje</h2>
  <div class="rows">
    <div class="row">${ICON.clip}<span>Verificações manuais</span></div>
    <div class="row">${ICON.split}<span>Registros descentralizados</span></div>
  </div>
  <div class="chips messy"><span class="chip warn">Controle da frota</span><span class="chip warn">Identificação de operadores</span><span class="chip warn">Registro de ocorrências</span></div>`, () => {
  rise('c06', '.title', 51.5);
  rise('c06', '.row:nth-child(1)', W('verificações', 54));
  rise('c06', '.row:nth-child(2)', W('registros', 55.5));
  [[1, W('controle', 58), -6], [2, W('identificação', 59), 4], [3, W('registro', 61), -3]].forEach(([n, t, r]) =>
    add(`tl.fromTo('#c06 .chip:nth-child(${n})',{opacity:0,scale:0.6,rotation:${r * 3}},{opacity:1,scale:1,rotation:${r},duration:0.5,ease:'back.out(1.7)'},${at(t)});`));
  sfx('click', O(W('controle', 58)));
});

// 7. plataforma — ele vira PiP; a tela do sistema surge, expande para tela cheia e recolhe com chips ao redor
const t7 = O(63.0) - 0.2;
pipIn(t7);
sfx('whoosh', t7);
const tPlat = O(W('plataforma', 66));
card('c07', 63.0, 75.2, 'stage', `
  <div class="stage-kicker">${kicker('A proposta')}<h2 class="title sm">Uma única plataforma</h2></div>
  <img class="hero-shot" src="img/screens/admin-visao-geral.png" alt=""/>
  <span class="chip blue fl f1">Estado das máquinas</span><span class="chip blue fl f2">Histórico de uso</span>
  <span class="chip blue fl f3">Registro de incidentes</span><span class="chip blue fl f4">Gestão operacional</span>`, () => {
  rise('c07', '.stage-kicker', 63.2);
  add(`tl.fromTo('#c07 .hero-shot',{opacity:0,scale:0.45,x:760,y:300,borderRadius:52},{opacity:1,scale:0.55,x:720,y:250,duration:0.8,ease:'power3.out'},${fmt(t7 + 0.5)});`);
  add(`tl.to('#c07 .stage-kicker',{opacity:0,duration:0.3},${fmt(tPlat - 0.1)});`);
  add(`tl.to('#c07 .hero-shot',{scale:1,x:0,y:-60,borderRadius:0,duration:0.9,ease:'power3.inOut'},${fmt(tPlat)});`);
  sfx('whoosh', tPlat);
  add(`tl.to('#c07 .hero-shot',{scale:0.66,x:600,y:110,borderRadius:36,duration:0.9,ease:'power3.inOut'},${fmt(tPlat + 1.6)});`);
  [[1, W('estado', 68)], [2, W('histórico', 69.5)], [3, W('registrar', 71)], [4, W('gestão', 73)]].forEach(([n, t]) =>
    add(`tl.fromTo('#c07 .f${n}',{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.45,ease:'back.out(1.7)'},${at(t)});`));
  sfx('click', O(W('estado', 68)));
});
pipOut(O(75.2) - 0.5, 'push');
sfx('whoosh', O(75.2) - 0.5);

// 8. objetivo — médio centralizado; fluxo numa faixa acima da cabeça, chips nos cantos de baixo
const tDados = W('dados', 76.8), tInfo = W('informações', 78.5), tDec = W('decisões', 80.3);
card('c08', 75.4, 86.6, 'free', `
  <div class="flow band-top">
    <div class="node">Dados</div><div class="arrow"></div>
    <div class="node">Informação</div><div class="arrow"></div>
    <div class="node blue">Decisão</div>
  </div>
  <span class="chip blue fl g1">Decisões mais rápidas</span><span class="chip blue fl g2">Rastreabilidade</span><span class="chip blue fl g3">Mais segurança</span>`, () => {
  rise('c08', '.node:nth-child(1)', tDados);
  add(`tl.fromTo('#c08 .arrow:nth-child(2)',{scaleX:0},{scaleX:1,duration:0.5,ease:'power2.out'},${at(tInfo - 0.5)});`);
  rise('c08', '.node:nth-child(3)', tInfo);
  add(`tl.fromTo('#c08 .arrow:nth-child(4)',{scaleX:0},{scaleX:1,duration:0.4,ease:'power2.out'},${at(tDec - 0.4)});`);
  rise('c08', '.node:nth-child(5)', tDec);
  sfx('ping', O(tDec));
  [[1, W('rápidas', 81)], [2, W('rastr', 82)], [3, W('contribuir', 83)]].forEach(([n, t]) =>
    add(`tl.fromTo('#c08 .g${n}',{opacity:0,y:30},{opacity:1,y:0,duration:0.5,ease:'back.out(1.6)'},${at(t)});`));
});
drift(O(75.2) + 0.6, O(86.6) - O(75.2) - 0.7, 1.04);

// 9. hardware — corte real direto para a câmera fechada em médio-esquerda; ESP32/C++ e eixos girando
camSet(camCuts[2], 'medL');
drift(camCuts[2] + 0.05, O(109.6) - camCuts[2] - 0.3, 1.03);
const tCpp = (() => { try { return W('c++', 97); } catch { return W('c', 97); } })();
card('c09', 89.7, 109.6, 'panel', `
  ${kicker('Hardware + Software')}
  <h2 class="title sm">No hardware</h2>
  <div class="tiles">${tile('espressif', 'ESP32')}${tile('cplusplus', 'C++')}</div>
  <div class="axes">
    <svg class="axes-svg" viewBox="0 0 220 200" fill="none" stroke-linecap="round"><path class="ax" d="M110 120 L110 20" stroke="#3a9cff" stroke-width="6"/><path class="ax" d="M110 120 L200 165" stroke="#1e8021" stroke-width="6"/><path class="ax" d="M110 120 L20 165" stroke="#d4773f" stroke-width="6"/>
    <text x="118" y="30" fill="#3a9cff">Z</text><text x="190" y="190" fill="#1e8021">X</text><text x="12" y="190" fill="#d4773f">Y</text></svg>
    <div class="axes-txt"><b>Sensores de 3 eixos</b><span>movimento e orientação da empilhadeira</span></div>
  </div>`, () => {
  rise('c09', '.title', W('hardware', 92));
  pop('c09', '.tile', W('microcontroller', 95));
  lightLogo('c09', 'espressif', W('esp32', 96)); sfx('tick', O(W('esp32', 96)));
  lightLogo('c09', 'cplusplus', tCpp); sfx('tick', O(tCpp));
  draw('c09', '.ax', W('sensores', 99.5), 0.8);
  add(`tl.fromTo('#c09 .axes-svg',{rotationY:-35,rotationX:10,transformPerspective:600},{rotationY:35,rotationX:-6,duration:${fmt(O(109.2) - O(100.6))},ease:'sine.inOut'},${at(100.6)});`);
  rise('c09', '.axes-txt', W('três', 100));
}, { cls: 'narrow' });

// 10. software — câmera volta ao plano inteiro da fechada; logos dos dois lados dele, acendendo quando são ditos
camTo(O(109.7) - 0.3, 'wide', 1.0);
sfx('whoosh', O(109.7) - 0.3);
const sideL = [['Front-End', [['react', 'React'], ['typescript', 'TypeScript']]], ['Back-End', [['nodedotjs', 'Node.js'], ['express', 'Express']]]];
const sideR = [['Dados e mensageria', [['mongodb', 'MongoDB'], ['mongoose', 'Mongoose'], ['rabbitmq', 'RabbitMQ']]], ['Ferramentas', [['figma', 'Figma'], ['github', 'GitHub']]]];
const groupHtml = (g, items) => `<div class="group float"><span class="glabel">${g}</span><div class="tiles sm">${items.map(([k, l]) => tile(k, l)).join('')}</div></div>`;
card('c10', 109.7, 134.2, 'free', `
  <div class="side-l narrow">${kicker('No software')}${sideL.map(([g, i]) => groupHtml(g, i)).join('')}</div>
  <div class="side-r narrow">${sideR.map(([g, i]) => groupHtml(g, i)).join('')}</div>`, () => {
  add(`tl.fromTo('#c10 .side-l .group, #c10 .side-l .kicker',{opacity:0,x:-80},{opacity:1,x:0,duration:0.6,ease:'power3.out',stagger:0.12},${at(110.0)});`);
  add(`tl.fromTo('#c10 .side-r .group',{opacity:0,x:80},{opacity:1,x:0,duration:0.6,ease:'power3.out',stagger:0.12},${at(110.3)});`);
  [['react', W('react', 111)], ['typescript', W('typescript', 112)], ['nodedotjs', W('node', 113)], ['express', W('express', 114.5)],
   ['mongodb', W('mongodb', 120)], ['mongoose', W('mongoose', 121)], ['rabbit', W('rabbit', 122)], ['figma', W('figma', 127.5)], ['github', W('github', 131)]]
    .forEach(([k, t]) => { k = k === 'rabbit' ? 'rabbitmq' : k; lightLogo('c10', k, t); sfx('tick', O(t)); });
});
drift(O(109.7) + 0.8, O(134.2) - O(109.7) - 1.1, 1.04);

// 11. pipeline — etapas dos dois lados dele, linha com pacotes atravessando a frente
camTo(O(134.2) - 0.3, 'push', 1.0);
card('c11', 134.2, 147.3, 'free', `
  ${'<div class="pipe-kicker">' + kicker('Como funciona') + '</div>'}
  <div class="hline"><i class="pkt"></i><i class="pkt p2"></i></div>
  <div class="hstep s1"><span>1</span>Coleta pelos sensores</div>
  <div class="hstep s2"><span>2</span>Processamento</div>
  <div class="hstep s3"><span>3</span>Armazenamento</div>
  <div class="hstep s4 blue"><span>4</span>Plataforma digital</div>
  <p class="hnote">consultada pelos responsáveis da operação</p>`, () => {
  const t0 = W('coleta', 135);
  rise('c11', '.pipe-kicker', 134.5);
  add(`tl.fromTo('#c11 .hline',{scaleX:0},{scaleX:1,duration:1.4,ease:'power2.inOut'},${at(t0)});`);
  sfx('whoosh', O(t0));
  rise('c11', '.s1', t0);
  rise('c11', '.s2', W('processamento', 138));
  rise('c11', '.s3', W('armazenamento', 138.5));
  rise('c11', '.s4', W('plataforma', 142));
  add(`tl.fromTo('#c11 .pkt',{x:0,opacity:1},{x:1680,duration:2.2,ease:'none',repeat:4,stagger:1.1},${at(W('encaminhados', 137))});`);
  rise('c11', '.hnote', W('consultadas', 144));
}, { cls: 'narrow' });

// 12. central do administrador — ele vira PiP redondo; telas em tela cheia com transições diferentes
const t12 = O(147.4) - 0.3;
pipIn(t12, 1.0, 'circle');
sfx('whoosh', t12);
const tV = O(W('visualizar', 152)), tG = O(W('gerenciar', 155)), tC = O(W('consultar', 157)), tH = O(W('histórico', 159));
// ponto do menu "Gerenciamento Frota" na tela cheia (tela 1440 px escalada para 1920, deslocada -60 px)
const MENU = [100, 259];
card('c12', 147.4, 161.2, 'stage', `
  <div class="stage-kicker">${kicker('Central operacional')}<h2 class="title sm">Visão do administrador</h2></div>
  <img class="scr s-a" src="img/screens/admin-visao-geral.png" alt=""/>
  <img class="scr s-b" src="img/screens/admin-equipe-setores.png" alt=""/>
  <img class="scr s-c" src="img/screens/admin-frota.png" alt=""/>
  <div class="scr-dim"></div>
  <img class="scr s-d" src="img/screens/admin-historico-alertas.png" alt=""/>
  <div class="scr-label"><span class="sl l-a">Máquinas por estado operacional</span><span class="sl l-b">Funcionários e setores</span><span class="sl l-c">Informações dos equipamentos</span><span class="sl l-d">Histórico de ocorrências</span></div>`, () => {
  rise('c12', '.stage-kicker', 147.7);
  // A: entra pequena e expande para tela cheia em "visualizar"
  add(`tl.fromTo('#c12 .s-a',{opacity:0,scale:0.45,x:900,y:330,borderRadius:52},{opacity:1,scale:0.5,x:860,y:300,duration:0.8,ease:'power3.out'},${fmt(t12 + 0.5)});`);
  add(`tl.to('#c12 .stage-kicker',{opacity:0,duration:0.3},${fmt(tV - 0.1)});`);
  add(`tl.to('#c12 .s-a',{scale:1,x:0,y:-60,borderRadius:0,duration:0.9,ease:'power3.inOut'},${fmt(tV)});`);
  add(`tl.to('#c12 .s-a',{scale:1.04,x:-38,y:-80,duration:${fmt(tG - tV - 0.9)},ease:'none'},${fmt(tV + 0.9)});`);
  sfx('whoosh', tV);
  // B: push lateral
  add(`tl.fromTo('#c12 .s-b',{x:1920,y:-60,scale:1},{x:0,duration:0.75,ease:'power3.inOut'},${fmt(tG)});`);
  add(`tl.to('#c12 .s-a',{x:-1920,duration:0.75,ease:'power3.inOut'},${fmt(tG)});`);
  sfx('whoosh', tG);
  // C: mergulho no menu "Gerenciamento Frota"
  add(`tl.to('#c12 .s-b',{scale:2.6,x:${-1.6 * MENU[0]},y:${MENU[1] - 2.6 * (MENU[1] + 60)},opacity:0,duration:0.8,ease:'power3.in'},${fmt(tC)});`);
  add(`tl.fromTo('#c12 .s-c',{opacity:0,scale:0.35,x:${MENU[0]},y:${MENU[1]}},{opacity:1,scale:1,x:0,y:-60,duration:0.8,ease:'power3.out'},${fmt(tC + 0.45)});`);
  sfx('whoosh', tC);
  // D: pilha de cartas — a atual recua e escurece, a nova sobe por cima
  add(`tl.to('#c12 .s-c',{scale:0.9,x:96,y:20,duration:0.7,ease:'power2.inOut'},${fmt(tH)});`);
  add(`tl.fromTo('#c12 .scr-dim',{opacity:0},{opacity:1,duration:0.7},${fmt(tH)});`);
  add(`tl.fromTo('#c12 .s-d',{y:1100,x:0,scale:1},{y:-60,duration:0.8,ease:'power3.out'},${fmt(tH + 0.1)});`);
  sfx('whoosh', tH);
  [['a', tV], ['b', tG], ['c', tC + 0.45], ['d', tH + 0.1]].forEach(([k, t], i, arr) => {
    add(`tl.fromTo('#c12 .l-${k}',{opacity:0,y:16},{opacity:1,y:0,duration:0.4,ease:'power2.out'},${fmt(t + 0.3)});`);
    if (i < arr.length - 1) add(`tl.to('#c12 .l-${k}',{opacity:0,duration:0.25},${fmt(arr[i + 1][1])});`);
  });
});
pipOut(O(161.2) - 0.5, 'medR', 1.0, 'circle');

// 12b. app do funcionário — ele à direita; celular entra girando, telas trocam como swipe
const mshots = [['mobile-visao-geral', 'Visão geral', W('funcionários', 161)], ['mobile-em-processo', 'Sessão de uso', W('sessão', 165.5)], ['mobile-reportar-ocorrencia', 'Reportar ocorrência', W('reportar', 167)]];
card('c12b', 161.3, 168.8, 'free', `
  <div class="mobile free-mobile">
    <div class="phone"><div class="screen">${mshots.map(([f]) => `<img class="mshot" src="img/screens/${f}.png" alt=""/>`).join('')}</div></div>
    <div class="mlist">${kicker('App do funcionário')}${mshots.map(([, l]) => `<div class="mitem pill"><span></span>${l}</div>`).join('')}</div>
  </div>`, () => {
  add(`tl.fromTo('#c12b .phone',{opacity:0,y:80,rotationY:35,rotationZ:-6,transformPerspective:1400},{opacity:1,y:0,rotationY:0,rotationZ:0,duration:1.0,ease:'power3.out'},${at(161.4)});`);
  rise('c12b', '.kicker', 161.6);
  mshots.forEach(([, , t], i) => {
    if (i === 0) add(`tl.fromTo('#c12b .mshot:nth-child(1)',{xPercent:0,opacity:1},{xPercent:0,opacity:1,duration:0.01},${at(161.4)});`);
    else {
      add(`tl.fromTo('#c12b .mshot:nth-child(${i + 1})',{xPercent:100,opacity:1},{xPercent:0,duration:0.55,ease:'power3.inOut'},${at(t)});`);
      add(`tl.to('#c12b .mshot:nth-child(${i})',{xPercent:-100,duration:0.55,ease:'power3.inOut'},${at(t)});`);
    }
    add(`tl.fromTo('#c12b .mitem:nth-child(${i + 2})',{opacity:0,x:-30},{opacity:1,x:0,duration:0.45,ease:'power2.out'},${at(t)});`);
    add(`tl.to('#c12b .mitem:nth-child(${i + 2}) span',{backgroundColor:'#3a9cff',scale:1.3,duration:0.3},${at(t)});`);
    // na câmera fechada os rótulos ficam no mesmo lugar, embaixo do celular: o anterior sai quando o próximo entra
    if (i) add(`tl.to('#c12b .mitem:nth-child(${i + 1})',{opacity:0,duration:0.25},${at(t)});`);
    sfx('click', O(t));
  });
}, { cls: 'narrow' });

// 13. idiomas — a câmera recua para o plano inteiro da fechada; "7" grande à esquerda, bandeiras à direita
camTo(O(168.85) - 0.3, 'wide', 0.9);
const langs = [['br', 'PT'], ['us', 'EN'], ['es', 'ES'], ['de', 'DE'], ['fr', 'FR'], ['jp', 'JA'], ['ru', 'RU']];
card('c13', 168.85, 174.95, 'free', `
  <div class="big-num free-num">${kicker('Feita para crescer')}<span class="num">0</span><span class="unit">idiomas</span></div>
  <div class="flags">${langs.map(([f, l]) => `<div class="flag"><img src="img/flags/${f}.svg" alt="${l}"/><span>${l}</span></div>`).join('')}</div>`, () => {
  const t = (() => { try { return W('7', 171); } catch { return W('sete', 171); } })();
  rise('c13', '.free-num', 169.0);
  counter('c13', '.num', 0, 7, t - 0.6, 1.0);
  add(`tl.fromTo('#c13 .flag',{opacity:0,scale:0.5,y:30},{opacity:1,scale:1,y:0,duration:0.5,ease:'back.out(1.7)',stagger:0.14},${fmt(O(t) - 0.6)});`);
  sfx('ping', O(t) + 0.4);
}, { cls: 'narrow' });

// 14. diferencial — corte real para a câmera aberta; os dois blocos vêm das bordas e se encontram acima da cabeça
camSet(camCuts[3], 'wide');
card('c14', 177.0, 187.3, 'free', `
  <div class="mbox fl-l">Monitoramento físico</div>
  <div class="mbox fl-r">Gestão operacional</div>
  <div class="one fl-one">Um único ambiente</div>`, () => {
  const tM = W('monitoramento', 179), tGe = W('gestão', 181), tU = W('único', 182.5);
  add(`tl.fromTo('#c14 .fl-l',{opacity:0,x:-700},{opacity:1,x:0,duration:0.8,ease:'power3.out'},${at(tM)});`);
  add(`tl.fromTo('#c14 .fl-r',{opacity:0,x:700},{opacity:1,x:0,duration:0.8,ease:'power3.out'},${at(tGe)});`);
  sfx('whoosh', O(tM)); sfx('whoosh', O(tGe));
  add(`tl.to('#c14 .fl-l',{x:175,opacity:0,scale:0.9,duration:0.6,ease:'power3.in'},${at(tU)});`);
  add(`tl.to('#c14 .fl-r',{x:-175,opacity:0,scale:0.9,duration:0.6,ease:'power3.in'},${at(tU)});`);
  add(`tl.fromTo('#c14 .fl-one',{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.6,ease:'back.out(1.8)'},${fmt(O(tU) + 0.5)});`);
  sfx('impact', O(tU) + 0.5);
});
drift(camCuts[3] + 0.05, O(187.2) - camCuts[3] - 0.5, 1.04);

// 15. o que esperamos — médio direita, coluna à esquerda
camTo(O(187.3) - 0.3, 'medR', 1.1);
sfx('whoosh', O(187.3) - 0.3);
card('c16', 187.3, 197.8, 'panel-l', `
  ${kicker('O que esperamos entregar')}
  <div class="rows big">
    <div class="row">${ICON.fleet}<span>Acompanhamento da frota</span></div>
    <div class="row">${ICON.list}<span>Registro de ocorrências organizado</span></div>
    <div class="row">${ICON.shield}<span>Decisões de segurança e manutenção</span></div>
  </div>`, () => {
  [[1, W('acompanhamento', 190)], [2, W('organizar', 192)], [3, W('apoiar', 194)]].forEach(([n, t]) => {
    rise('c16', `.row:nth-child(${n})`, t);
    sfx('pop', O(t));
  });
});

// 16. mensagem — fechado aproximando devagar; frases grandes direto na parede
camTo(O(197.9) - 0.3, 'close', 1.1);
drift(O(197.9) + 0.8, O(207.6) - O(197.9) - 0.9, 1.03);
card('c17', 197.9, 207.6, 'free', `
  <div class="wall k1">Além de coletar dados</div>
  <div class="wall k2"><span>informações</span><em>→</em><span class="hl">decisões</span></div>
  <div class="wall k3">operações mais <b>eficientes</b> e <b>seguras</b></div>`, () => {
  add(`tl.fromTo('#c17 .k1',{opacity:0,x:-60},{opacity:1,x:0,duration:0.6,ease:'power3.out'},${at(W('além', 199.5))});`);
  add(`tl.fromTo('#c17 .k2',{opacity:0,x:60},{opacity:1,x:0,duration:0.6,ease:'power3.out'},${at(W('transformar', 201.5))});`);
  add(`tl.fromTo('#c17 .hl',{backgroundSize:'0% 100%'},{backgroundSize:'100% 100%',duration:0.6,ease:'power2.out'},${at(W('decisões', 203))});`);
  add(`tl.fromTo('#c17 .k3',{opacity:0,y:40},{opacity:1,y:0,duration:0.6,ease:'power3.out'},${at(W('operações', 205))});`);
});
sfx('riser', O(208.8) - 2.3);

// 17. fechamento (tela cheia)
card('c18', 208.8, 214.1, 'full', `
  <div class="end">
    <img class="end-logo" src="img/logo-full.svg" alt="Liftech"/>
    <p class="tag"><span>Otimizando a inteligência operacional</span><span>para movimentar o futuro.</span></p>
  </div>`, () => {
  add(`tl.fromTo('#c18 .end-logo',{opacity:0,scale:0.86},{opacity:1,scale:1,duration:0.9,ease:'power3.out'},${at(209.0)});`);
  add(`tl.fromTo('#c18 .tag',{opacity:0,y:24},{opacity:1,y:0,duration:0.7,ease:'power3.out'},${at(W('otimizando', 210))});`);
  sfx('chime', O(209.0));
});
camSet(O(213.0), 'push');
camTo(O(214.1) - 0.2, 'wide', 1.4);

// 18. nome — ele não se apresenta mais no fim, então o lower-third entra no "muito obrigado"
card('c19', 214.15, 0, 'lower', `
  <div class="lt"><span class="lt-bar"></span><div><b>Victor</b><span>Equipe Liftech · Engenharia da Computação · Uniso</span></div></div>`, () => sfx('whoosh', O(214.15)), { E: DUR + 0.1 });

// 19. cartela final — passa ~2 s do fim da fala
card('c20', 0, 0, 'full', `<div class="end"><img class="end-logo" src="img/logo-full.svg" alt="Liftech"/></div>`, null, { S: DUR - 0.3, E: TOTAL, noExit: true });

// ---------- cortes: alterna leve zoom em cada emenda para o salto parecer intencional ----------
// fica num wrapper próprio (#video-punch) para não brigar com a câmera (#video-inner)
// nas emendas que já são troca de câmera real não há punch-in (volta a 1)
let punch = 0;
const cutZoom = edl.segments.slice(1).map((g, i) => {
  const s = g.cam !== edl.segments[i].cam ? 1 : (punch++ % 2 === 0 ? 1.04 : 1);
  return `tl.set('#video-punch',{scale:${s}},${fmt(q(g.out))});`;
}).join('\n');

// prévia: PREVIEW=56 gera só os primeiros 56 s
const END = process.env.PREVIEW ? Math.min(TOTAL, +process.env.PREVIEW) : TOTAL;

// ---------- legendas ----------
const capHtml = caps
  .map((c, i) => {
    // termina antes da próxima começar (as pausas removidas podem encostar uma na outra)
    const next = caps[i + 1] ? out(caps[i + 1].start) - 0.04 : END;
    const s = out(c.start), e = Math.min(out(c.end) + 0.12, next, END);
    if (e - s < 0.2) return '';
    return `<div id="cap-${c.i}" class="cap clip" data-start="${fmt(q(s))}" data-duration="${fmt(q(e - s))}" data-track-index="9"><span>${c.text}</span></div>`;
  })
  .join('\n');

const zoneClass = { panel: 'z-panel', 'panel-l': 'z-panel-l', wide: 'z-wide', full: 'z-full', lower: 'z-lower', free: 'z-free', stage: 'z-stage' };
const cardHtml = cards
  .filter((c) => c.S < END)
  .map((c, i) => {
    const E = Math.min(c.E, END);
    return `<section id="${c.id}" class="card-host clip ${zoneClass[c.zone]}${c.cls ? ' ' + c.cls : ''}" data-start="${fmt(c.S)}" data-duration="${fmt(E - c.S)}" data-track-index="${2 + (i % 2)}"><div class="panel">${c.html}</div></section>`;
  })
  .join('\n');

const sfxHtml = spaced()
  .filter((x) => x.t < END)
  .map((x, i) => {
    const [f, v, d, ms] = SFX[x.kind];
    return `<audio id="sfx-${i}" src="sfx/${f}" data-start="${fmt(x.t)}" data-duration="${fmt(Math.min(d, END - x.t))}"${ms ? ` data-media-start="${ms}"` : ''} data-volume="${v}" data-track-index="8"></audio>`;
  })
  .join('\n');

const css = fs.readFileSync(here('./style.css'), 'utf8');
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=1920, height=1080"/>
<title>Liftech pitch</title>
<style>
${css}
</style>
</head>
<body>
<div id="root" data-composition-id="liftech-pitch" data-start="0" data-width="1920" data-height="1080" data-fps="30" data-duration="${fmt(END)}">
  <div id="backdrop"></div>
  <div id="video-wrap"><div id="video-punch"><div id="video-inner"><video id="bg-video" src="input-video.mp4" playsinline data-has-audio="true" data-start="0" data-duration="${fmt(Math.min(DUR, END))}" data-track-index="1"></video></div></div></div>
  <div id="pip-ring"></div>
  <div id="pip-ring-c"></div>
  <div id="flash"></div>
${cardHtml}
${capHtml}
${sfxHtml}
</div>
<script src="vendor/gsap.min.js"></script>
<script>
(function(){
var tl = gsap.timeline({ paused: true });
tl.set('#video-wrap',{transformOrigin:'0 0',clipPath:'inset(0px 0px 0px 0px round 0px)'},0);
tl.set('#video-inner',{transformOrigin:'0 0'},0);
tl.set('#video-punch',{transformOrigin:'50% 35%'},0);
${cutZoom}
${A.join('\n')}
window.__timelines["liftech-pitch"] = tl;
})();
</script>
</body>
</html>
`;
fs.writeFileSync(here('../public/index.html'), html);
console.log('cards', cards.filter((c) => c.S < END).length, '| legendas', capHtml.split('\n').filter(Boolean).length, '| sons', spaced().filter((x) => x.t < END).length, '| duração', END.toFixed(2));
for (const c of cards) if (c.S < END) console.log(c.id.padEnd(8), c.S.toFixed(2), '→', c.E.toFixed(2));
