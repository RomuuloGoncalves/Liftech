// Gera public/index.html (composição HyperFrames) a partir do EDL, da transcrição e das legendas.
// Tempos dos cards são escritos em segundos do ARQUIVO ORIGINAL e convertidos para o corte limpo via EDL.
import fs from 'fs';

const here = (p) => new URL(p, import.meta.url);
const edl = JSON.parse(fs.readFileSync(here('./edl.json')));
const words = JSON.parse(fs.readFileSync(here('./words-take1.json')))
  .map((x) => ({ t: x.text.trim().toLowerCase().replace(/[.,!?;:]/g, ''), s: x.timestamp[0] }))
  .filter((x) => x.t);
const caps = JSON.parse(fs.readFileSync(here('../captions-take1.json')));
const FPS = 30000 / 1001;
const DUR = edl.duration;

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

function card(id, s, e, zone, html, anims) {
  cards.push({ id, s, e, zone, html });
  // entrada/saída padrão (mesma curva em todo o vídeo)
  const S = O(s), E = O(e);
  if (zone === 'full') {
    add(`tl.fromTo('#${id} .panel',{opacity:0},{opacity:1,duration:0.5,ease:'power2.out'},${fmt(S)});`);
  } else {
    add(`tl.fromTo('#${id} .panel',{opacity:0,x:60},{opacity:1,x:0,duration:0.6,ease:'power3.out'},${fmt(S)});`);
    add(`tl.fromTo('#${id} .panel',{y:0},{y:-10,duration:${fmt(Math.max(0.1, E - S))},ease:'none'},${fmt(S)});`);
  }
  if (id !== 'c20') add(`tl.to('#${id} .panel',{opacity:0,${zone === 'full' ? '' : 'x:30,'}duration:0.35,ease:'power2.in'},${fmt(Math.max(S, E - 0.35))});`);
  anims && anims();
}

const kicker = (t) => `<div class="kicker">${t}</div>`;

// 1. hook
card('c01', 8.55, 14.2, 'panel', `
  ${kicker('Operação industrial')}
  <h2 class="title">Dezenas de empilhadeiras</h2>
  <div class="fleet">${Array.from({ length: 6 }, () => `<span class="fk">${ICON.forklift}</span>`).join('')}</div>
  <p class="body">movimentando cargas todos os dias</p>`, () => {
  rise('c01', '.title', 8.8);
  add(`tl.fromTo('#c01 .fk',{opacity:0,x:-80},{opacity:1,x:0,duration:0.7,ease:'power3.out',stagger:0.12},${at(W('empilhadeiras', 10))});`);
  rise('c01', '.body', W('movimentam', 11));
});

// 2. incidente
card('c02', 14.3, 19.15, 'panel', `
  ${kicker('E se algo acontecer?')}
  <div class="alert-row"><span class="pulse"></span><span class="alert-ic">${ICON.alert}</span></div>
  <div class="chips"><span class="chip red">Colisão</span><span class="chip red">Frenagem brusca</span></div>
  <svg class="spark" viewBox="0 0 700 160" fill="none"><path d="M0 110 L120 108 L200 112 L280 106 L330 110 L360 20 L385 150 L410 96 L470 112 L560 104 L700 108" stroke="#c84646" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`, () => {
  pop('c02', '.alert-ic', 14.6);
  add(`tl.fromTo('#c02 .pulse',{scale:0.4,opacity:0.7},{scale:2.4,opacity:0,duration:1.2,ease:'power2.out',repeat:2},${at(14.6)});`);
  pop('c02', `.chip:nth-child(1)`, W('colisão', 15));
  pop('c02', `.chip:nth-child(2)`, W('frenagem', 15));
  draw('c02', '.spark path', W('colisão', 15), 1.6);
});

// 3. perguntas
card('c03', 19.2, 28.3, 'panel', `
  ${kicker('As perguntas')}
  <div class="qs">
    <div class="q"><b>?</b><span>Quem fica sabendo?</span></div>
    <div class="q"><b>?</b><span>Qual equipamento?</span></div>
    <div class="q"><b>?</b><span>Em que momento?</span></div>
  </div>`, () => {
  rise('c03', '.q:nth-child(1)', 19.4);
  rise('c03', '.q:nth-child(2)', W('equipamento', 22));
  rise('c03', '.q:nth-child(3)', W('momento', 24));
});

// 4. apresentação
card('c04', 28.5, 39.1, 'panel', `
  <div class="brand"><img src="img/logo-full.svg" alt="Liftech"/></div>
  <div class="hr"></div>
  <p class="meta"><b>Engenharia da Computação</b></p>
  <p class="meta">Universidade de Sorocaba</p>
  <p class="meta small">Orientador: Prof. Denis César Ângelo Baldo</p>`, () => {
  wipe('c04', '.brand', W('liftech', 30), 0.9);
  add(`tl.fromTo('#c04 .hr',{scaleX:0},{scaleX:1,duration:0.6,ease:'power2.out'},${at(W('produto', 32))});`);
  rise('c04', '.meta:nth-of-type(1)', W('produto', 32));
  rise('c04', '.meta:nth-of-type(2)', W('universidade', 33));
  rise('c04', '.meta:nth-of-type(3)', W('orientado', 34));
});

// 5. equipe (só primeiro nome)
const team = [['daniel', 'Daniel'], ['lucas', 'Lucas'], ['maria', 'Maria'], ['romulo', 'Rômulo'], ['victor', 'Victor'], ['vitor', 'Vitor']];
card('c05', 39.3, 47.4, 'panel', `
  ${kicker('Equipe Liftech')}
  <div class="team">${team.map(([f, n]) => `<div class="member"><img src="img/team/${f}.jpg" alt="${n}"/><span>${n}</span></div>`).join('')}</div>`, () => {
  pop('c05', '.member', W('quadro', 40), 0.55);
});

// 6. problema
card('c06', 45.2 + 2.2, 57.25, 'panel', `
  ${kicker('O problema')}
  <h2 class="title sm">Como é hoje</h2>
  <div class="rows">
    <div class="row">${ICON.clip}<span>Verificações manuais</span></div>
    <div class="row">${ICON.split}<span>Registros descentralizados</span></div>
  </div>
  <div class="chips"><span class="chip warn">Controle da frota</span><span class="chip warn">Identificação de operadores</span><span class="chip warn">Registro de ocorrências</span></div>`, () => {
  rise('c06', '.title', 47.6);
  rise('c06', '.row:nth-child(1)', W('verificações', 47));
  rise('c06', '.row:nth-child(2)', W('registros', 49));
  pop('c06', '.chip:nth-child(1)', W('controle', 52));
  pop('c06', '.chip:nth-child(2)', W('identificação', 53));
  pop('c06', '.chip:nth-child(3)', W('registro', 55));
});

// 7. solução
card('c07', 57.4, 70.2, 'wide', `
  ${kicker('A proposta')}
  <h2 class="title sm">Uma única plataforma</h2>
  <div class="browser"><div class="bar"><i></i><i></i><i></i></div><img src="img/screens/admin-visao-geral.png" alt=""/></div>
  <div class="chips tight"><span class="chip blue">Estado das máquinas</span><span class="chip blue">Histórico de uso</span><span class="chip blue">Registro de incidentes</span><span class="chip blue">Gestão operacional</span></div>`, () => {
  rise('c07', '.title', W('única', 60));
  add(`tl.fromTo('#c07 .browser',{opacity:0,scale:0.92,y:30},{opacity:1,scale:1,y:0,duration:0.8,ease:'power3.out'},${at(W('plataforma', 61))});`);
  pop('c07', '.chip:nth-child(1)', W('estado', 63));
  pop('c07', '.chip:nth-child(2)', W('histórico', 64));
  pop('c07', '.chip:nth-child(3)', W('registrar', 66));
  pop('c07', '.chip:nth-child(4)', W('gestão', 68));
});

// 8. objetivo
card('c08', 71.4, 84.3, 'panel', `
  ${kicker('Objetivo')}
  <div class="flow">
    <div class="node">Dados</div><div class="arrow"></div>
    <div class="node">Informação</div><div class="arrow"></div>
    <div class="node blue">Decisão</div>
  </div>
  <div class="chips"><span class="chip blue">Decisões mais rápidas</span><span class="chip blue">Rastreabilidade</span><span class="chip blue">Mais segurança</span></div>`, () => {
  rise('c08', '.node:nth-child(1)', 72.4);
  add(`tl.fromTo('#c08 .arrow:nth-child(2)',{scaleX:0},{scaleX:1,duration:0.5,ease:'power2.out'},${at(73.6)});`);
  rise('c08', '.node:nth-child(3)', 73.9);
  add(`tl.fromTo('#c08 .arrow:nth-child(4)',{scaleX:0},{scaleX:1,duration:0.5,ease:'power2.out'},${at(75.0)});`);
  rise('c08', '.node:nth-child(5)', 75.3);
  pop('c08', '.chip:nth-child(1)', 76.5);
  pop('c08', '.chip:nth-child(2)', 78.5);
  pop('c08', '.chip:nth-child(3)', 81.2);
});

// 9. hardware
card('c09', 85.1, 104.6, 'panel', `
  ${kicker('Hardware + Software')}
  <h2 class="title sm">No hardware</h2>
  <div class="tiles">${tile('espressif', 'ESP32')}${tile('cplusplus', 'C++')}</div>
  <div class="axes">
    <svg viewBox="0 0 220 200" fill="none" stroke-linecap="round"><path class="ax" d="M110 120 L110 20" stroke="#3a9cff" stroke-width="6"/><path class="ax" d="M110 120 L200 165" stroke="#1e8021" stroke-width="6"/><path class="ax" d="M110 120 L20 165" stroke="#d4773f" stroke-width="6"/>
    <text x="118" y="30" fill="#3a9cff">Z</text><text x="190" y="190" fill="#1e8021">X</text><text x="12" y="190" fill="#d4773f">Y</text></svg>
    <div class="axes-txt"><b>Sensores de 3 eixos</b><span>movimento e orientação da empilhadeira</span></div>
  </div>`, () => {
  rise('c09', '.title', W('hardware', 89));
  pop('c09', '.tile', W('microcontrolador', 91));
  lightLogo('c09', 'espressif', W('s32', 92));
  lightLogo('c09', 'cplusplus', 94.4);
  draw('c09', '.ax', W('sensores', 95), 0.8);
  rise('c09', '.axes-txt', W('três', 96));
});

// 10. software (logos)
const stack = [
  ['Front-End', [['react', 'React'], ['typescript', 'TypeScript']]],
  ['Back-End', [['nodedotjs', 'Node.js'], ['express', 'Express']]],
  ['Dados e mensageria', [['mongodb', 'MongoDB'], ['mongoose', 'Mongoose'], ['rabbitmq', 'RabbitMQ']]],
  ['Ferramentas', [['figma', 'Figma'], ['github', 'GitHub']]],
];
card('c10', 105.5, 132.0, 'panel', `
  ${kicker('No software')}
  <div class="stack">${stack.map(([g, items]) => `<div class="group"><span class="glabel">${g}</span><div class="tiles sm">${items.map(([k, l]) => tile(k, l)).join('')}</div></div>`).join('')}</div>`, () => {
  rise('c10', '.group', 106.3);
  add(`tl.fromTo('#c10 .tile',{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.45,ease:'back.out(1.7)',stagger:0.05},${at(106.6)});`);
  lightLogo('c10', 'react', W('react', 108));
  lightLogo('c10', 'typescript', W('typescript', 108.5));
  lightLogo('c10', 'nodedotjs', W('node', 110));
  lightLogo('c10', 'express', W('express', 111));
  lightLogo('c10', 'mongodb', W('mongodb', 116));
  lightLogo('c10', 'mongoose', W('mongoose', 118));
  lightLogo('c10', 'rabbitmq', W('rabbit', 119));
  lightLogo('c10', 'figma', W('figma', 125));
  lightLogo('c10', 'github', W('github', 128));
});

// 11. pipeline
card('c11', 132.9, 148.6, 'panel', `
  ${kicker('Como funciona')}
  <div class="pipe">
    <div class="step"><span>1</span>Coleta pelos sensores</div>
    <div class="step"><span>2</span>Processamento</div>
    <div class="step"><span>3</span>Armazenamento</div>
    <div class="step blue"><span>4</span>Plataforma digital</div>
    <div class="wire"><i class="pkt"></i></div>
  </div>
  <p class="body sm">consultada pelos responsáveis da operação</p>`, () => {
  rise('c11', '.step:nth-child(1)', W('coleta', 134));
  rise('c11', '.step:nth-child(2)', W('processamento', 137));
  rise('c11', '.step:nth-child(3)', W('armazenamento', 138));
  rise('c11', '.step:nth-child(4)', W('plataforma', 142));
  add(`tl.fromTo('#c11 .wire',{scaleY:0},{scaleY:1,duration:1.0,ease:'power2.inOut'},${at(W('coleta', 134))});`);
  add(`tl.fromTo('#c11 .pkt',{y:0,opacity:1},{y:420,opacity:1,duration:1.6,ease:'none',repeat:4},${at(W('encaminhados', 136))});`);
  rise('c11', '.body', W('consultadas', 145));
});

// 12. central operacional + app
const shots = [
  ['admin-visao-geral', 'Visão geral das máquinas', W('visualizar', 154)],
  ['admin-equipe-setores', 'Funcionários e setores', W('gerenciar', 157)],
  ['admin-frota', 'Informações dos equipamentos', W('consultar', 160)],
  ['admin-historico-alertas', 'Histórico de ocorrências', W('histórico', 162)],
];
card('c12', 149.1, 165.3, 'wide', `
  ${kicker('Central operacional · administrador')}
  <div class="browser big"><div class="bar"><i></i><i></i><i></i></div><div class="shots">${shots.map(([f]) => `<img class="shot" src="img/screens/${f}.png" alt=""/>`).join('')}</div></div>
  <div class="shot-labels">${shots.map(([, l]) => `<span class="slabel">${l}</span>`).join('')}</div>`, () => {
  add(`tl.fromTo('#c12 .browser',{opacity:0,scale:0.92,y:30},{opacity:1,scale:1,y:0,duration:0.8,ease:'power3.out'},${at(149.6)});`);
  shots.forEach(([, , t], i) => {
    const T = i === 0 ? Math.min(t, 151.5) : t;
    add(`tl.fromTo('#c12 .shot:nth-child(${i + 1})',{opacity:0,scale:1.04},{opacity:1,scale:1,duration:0.6,ease:'power2.out'},${at(T)});`);
    add(`tl.fromTo('#c12 .slabel:nth-child(${i + 1})',{opacity:0,y:14},{opacity:1,y:0,duration:0.4,ease:'power2.out'},${at(T)});`);
    if (i > 0) add(`tl.to('#c12 .slabel:nth-child(${i})',{opacity:0,duration:0.3},${at(T)});`);
  });
});
const mshots = [
  ['mobile-visao-geral', 'Visão geral', W('funcionários', 165)],
  ['mobile-em-processo', 'Sessão de uso', W('acissão', 170)],
  ['mobile-reportar-ocorrencia', 'Reportar ocorrência', W('reportar', 173)],
];
card('c12b', 165.4, 175.3, 'panel', `
  ${kicker('App do funcionário')}
  <div class="mobile">
    <div class="phone"><div class="screen">${mshots.map(([f]) => `<img class="mshot" src="img/screens/${f}.png" alt=""/>`).join('')}</div></div>
    <div class="mlist">${mshots.map(([, l]) => `<div class="mitem"><span></span>${l}</div>`).join('')}</div>
  </div>`, () => {
  add(`tl.fromTo('#c12b .phone',{opacity:0,y:60},{opacity:1,y:0,duration:0.8,ease:'power3.out'},${at(165.6)});`);
  mshots.forEach(([, , t], i) => {
    add(`tl.fromTo('#c12b .mshot:nth-child(${i + 1})',{opacity:0},{opacity:1,duration:0.5,ease:'power2.out'},${at(t)});`);
    add(`tl.fromTo('#c12b .mitem:nth-child(${i + 1})',{opacity:0,x:-20},{opacity:1,x:0,duration:0.45,ease:'power2.out'},${at(t)});`);
    add(`tl.to('#c12b .mitem:nth-child(${i + 1}) span',{backgroundColor:'#3a9cff',scale:1.3,duration:0.3},${at(t)});`);
  });
});

// 13. idiomas
card('c13', 175.5, 183.2, 'panel', `
  ${kicker('Feita para crescer')}
  <div class="big-num"><span class="num">0</span><span class="unit">idiomas</span></div>
  <div class="langs">${['PT', 'EN', 'ES', 'DE', 'FR', 'JA', 'RU'].map((l) => `<span class="lang">${l}</span>`).join('')}</div>`, () => {
  const t = (() => { try { return W('7', 176); } catch { return W('sete', 176); } })();
  counter('c13', '.num', 0, 7, t - 0.3, 1.0);
  pop('c13', '.lang', t);
});

// 14. diferencial
card('c14', 183.9, 195.8, 'panel', `
  ${kicker('Nosso diferencial')}
  <div class="merge">
    <div class="mbox l">Monitoramento físico<small>sensores na empilhadeira</small></div>
    <div class="plus">+</div>
    <div class="mbox r">Gestão operacional<small>frota, equipe e ocorrências</small></div>
  </div>
  <div class="one">Um único ambiente</div>`, () => {
  rise('c14', '.mbox.l', W('monitoramento', 185));
  rise('c14', '.mbox.r', W('gestão', 186));
  pop('c14', '.plus', W('gestão', 186));
  const t = W('único', 188);
  add(`tl.to('#c14 .mbox.l',{x:35,duration:0.7,ease:'power3.inOut'},${at(t)});`);
  add(`tl.to('#c14 .mbox.r',{x:-35,duration:0.7,ease:'power3.inOut'},${at(t)});`);
  add(`tl.to('#c14 .plus',{opacity:0,scale:0.4,duration:0.3},${at(t)});`);
  pop('c14', '.one', t + 0.5);
});

// 15. status
card('c15', 196.7, 213.2, 'panel', `
  ${kicker('Onde estamos')}
  <div class="status">
    <div class="st done">${ICON.check}<span>Modelagem do banco de dados</span></div>
    <div class="st done">${ICON.check}<span>Protótipos das interfaces</span></div>
    <div class="st done">${ICON.check}<span>Estrutura tecnológica</span></div>
    <div class="sep">Próximas etapas</div>
    <div class="st next">${ICON.todo}<span>Integração hardware + software</span></div>
    <div class="st next">${ICON.todo}<span>Testes e validação do sistema</span></div>
  </div>`, () => {
  rise('c15', '.st:nth-child(1)', W('modelagem', 198));
  rise('c15', '.st:nth-child(2)', W('protótipos', 200));
  rise('c15', '.st:nth-child(3)', W('estrutura', 202));
  rise('c15', '.sep', W('integração', 204));
  rise('c15', '.st:nth-child(5)', W('integração', 204));
  rise('c15', '.st:nth-child(6)', W('testes', 208));
});

// 16. o que esperamos
card('c16', 213.7, 225.4, 'panel', `
  ${kicker('O que esperamos entregar')}
  <div class="rows big">
    <div class="row">${ICON.fleet}<span>Acompanhamento da frota</span></div>
    <div class="row">${ICON.list}<span>Registro de ocorrências organizado</span></div>
    <div class="row">${ICON.shield}<span>Decisões de segurança e manutenção</span></div>
  </div>`, () => {
  rise('c16', '.row:nth-child(1)', W('acompanhamento', 216));
  rise('c16', '.row:nth-child(2)', W('organizar', 218));
  rise('c16', '.row:nth-child(3)', W('apoiar', 220));
});

// 17. mensagem
card('c17', 226.3, 237.9, 'panel', `
  <div class="kin">
    <div class="k1">Além de coletar dados</div>
    <div class="k2"><span>informações</span><em>→</em><span class="hl">decisões</span></div>
    <div class="k3">operações mais <b>eficientes</b> e <b>seguras</b></div>
  </div>`, () => {
  rise('c17', '.k1', W('além', 228));
  rise('c17', '.k2', W('transformar', 231));
  add(`tl.fromTo('#c17 .hl',{backgroundSize:'0% 100%'},{backgroundSize:'100% 100%',duration:0.6,ease:'power2.out'},${at(W('decisões', 232))});`);
  rise('c17', '.k3', W('operações', 234));
});

// 18. fechamento (tela cheia)
card('c18', 238.25, 244.3, 'full', `
  <div class="end">
    <img class="end-logo" src="img/logo-full.svg" alt="Liftech"/>
    <p class="tag"><span>Otimizando a inteligência operacional</span><span>para movimentar o futuro.</span></p>
  </div>`, () => {
  add(`tl.fromTo('#c18 .end-logo',{opacity:0,scale:0.86},{opacity:1,scale:1,duration:0.9,ease:'power3.out'},${at(238.5)});`);
  add(`tl.fromTo('#c18 .tag',{opacity:0,y:24},{opacity:1,y:0,duration:0.7,ease:'power3.out'},${at(W('otimizando', 239))});`);
});

// 19. nome
card('c19', 244.35, 248.0, 'lower', `
  <div class="lt"><span class="lt-bar"></span><div><b>Victor Cardoso</b><span>Equipe Liftech · Engenharia da Computação · Uniso</span></div></div>`);

// 20. cartela final
card('c20', 247.95, 248.9, 'full', `<div class="end"><img class="end-logo" src="img/logo-full.svg" alt="Liftech"/></div>`);

// ---------- cortes: alterna leve zoom em cada emenda para o salto parecer intencional ----------
const cutZoom = edl.segments.slice(1).map((g, i) =>
  `tl.set('#video-inner',{scale:${i % 2 === 0 ? 1.36 : 1.3}},${fmt(q(g.out))});`).join('\n');

// ---------- legendas ----------
const capHtml = caps
  .map((c) => {
    const s = out(c.start), e = Math.min(out(c.end) + 0.12, DUR);
    if (e - s < 0.2) return '';
    return `<div id="cap-${c.i}" class="cap clip" data-start="${fmt(q(s))}" data-duration="${fmt(q(e - s))}" data-track-index="9"><span>${c.text}</span></div>`;
  })
  .join('\n');

const zoneClass = { panel: 'z-panel', wide: 'z-wide', full: 'z-full', lower: 'z-lower' };
const cardHtml = cards
  .map((c, i) => {
    const S = O(c.s), E = Math.min(O(c.e), DUR);
    return `<section id="${c.id}" class="card-host clip ${zoneClass[c.zone]}" data-start="${fmt(S)}" data-duration="${fmt(E - S)}" data-track-index="${2 + (i % 2)}"><div class="panel">${c.html}</div></section>`;
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
<div id="root" data-composition-id="liftech-pitch" data-start="0" data-width="1920" data-height="1080" data-fps="30" data-duration="${fmt(DUR)}">
  <div id="video-wrap"><div id="video-inner"><video id="bg-video" src="input-video.mp4" playsinline data-has-audio="true" data-start="0" data-duration="${fmt(DUR)}" data-track-index="1"></video></div></div>
${cardHtml}
${capHtml}
</div>
<script src="vendor/gsap.min.js"></script>
<script>
(function(){
var tl = gsap.timeline({ paused: true });
tl.set('#video-inner',{scale:1.3,transformOrigin:'100% 29%'},0);
${cutZoom}
${A.join('\n')}
window.__timelines["liftech-pitch"] = tl;
})();
</script>
</body>
</html>
`;
fs.writeFileSync(here('../public/index.html'), html);
console.log('cards', cards.length, '| legendas', capHtml.split('\n').filter(Boolean).length, '| duração', DUR);
for (const c of cards) console.log(c.id.padEnd(5), O(c.s).toFixed(2), '→', O(c.e).toFixed(2));
