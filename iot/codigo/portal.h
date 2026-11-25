#pragma once

#include <pgmspace.h>

// Portal web estatico em flash (gerado a partir de iot/portal/prototipo.html, sem o bloco MOCK).
const char PAGINA_PORTAL[] PROGMEM = R"rawliteral(<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="data:,">
<title>Liftech — Portal da placa</title>
<style>
:root{--b:#3a9cff;--bb:rgba(58,156,255,.25);--bt:#1f78d1;--g:#1e8021;--gb:rgba(74,255,58,.25);--yt:#726800;--yb:rgba(255,245,139,.25);--dt:#c84646;--rb:rgba(255,58,58,.25);--th:#181818;--t:#4c4c4c;--l:#707070;--ln:#e3e4e5;--bd:rgba(21,28,39,.1);--pg:#fafafa;--bg:#fff;--ab:rgba(21,28,39,.05);--ad:rgba(58,156,255,.5);color-scheme:light}
*{box-sizing:border-box}body{margin:0;background:var(--pg);color:var(--t);font:14px/1.45 'Host Grotesk',system-ui,'Segoe UI',Roboto,sans-serif;letter-spacing:.18px;-webkit-font-smoothing:antialiased}
button,input{font:inherit;letter-spacing:inherit}::placeholder{color:var(--l);opacity:1}
h1,h2,p{margin:0}h1,h2{font-weight:500;color:var(--th);line-height:1.25}h1{font-size:24px}h2{font-size:16px;font-weight:600}
code{font-family:ui-monospace,Consolas,monospace;font-size:13px;font-variant-numeric:tabular-nums}
:focus-visible{outline:2px solid var(--b);outline-offset:1px}[hidden]{display:none!important}
.top{background:var(--bg);border-bottom:1px solid var(--ln)}.ti,.w,.ft{max-width:780px;margin:0 auto;padding:12px 16px}
.w,.c,.ks p,.bx,.mg,.fm,.fl,.ft{display:flex;flex-direction:column}
.ti,.ch,.ht,.br,.sub,.iw,.nt,.ts,.rw,.nmt,.ks p>span{display:flex;align-items:center}
.ti,.ch,.ht{justify-content:space-between;gap:10px;flex-wrap:wrap}.ht{align-items:flex-start}
.br,.sub,.rw,.nmt,.ks p>span{gap:6px;flex-wrap:wrap}.br{gap:10px}.sub{font-size:13px}
.bn{font-size:16px;font-weight:600;color:var(--th)}.bt{font-size:12px;color:var(--l);border-left:1px solid var(--ln);padding-left:10px}
.w{padding-top:16px;gap:12px}.g{display:grid;grid-template-columns:1fr;gap:12px}@media(min-width:600px){.g{grid-template-columns:1fr 1fr}}.s2{grid-column:1/-1}
.c,.bx,.mg{background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:16px;gap:12px;min-width:0}
.btn,.bg,.ban,.ts{border-radius:8px}.nt,.in,.ey,.tx{border-radius:5px}
.eye{font-size:12px;font-weight:600;color:var(--l);text-transform:uppercase;letter-spacing:.4px}
.bg{display:inline-flex;align-items:center;align-self:flex-start;padding:2px 8px;border:1px solid var(--bd);font-size:11px;font-weight:500;white-space:nowrap}
.ok{color:var(--g);background:var(--gb);border-color:var(--gb)}.wn{color:var(--yt);background:var(--yb);border-color:var(--yb)}
.inf{color:var(--bt);background:var(--bb);border-color:var(--bb)}.er{color:var(--dt);background:var(--rb);border-color:var(--rb)}.of{color:var(--t);background:var(--pg)}
.ks{display:grid;grid-template-columns:1fr;gap:10px}@media(min-width:420px){.k2{grid-template-columns:1fr 1fr}}
.ks p{gap:2px;min-width:0}.ks b{font-size:12px;font-weight:600;color:var(--l)}.ks p>span,.ks p>code{color:var(--th);overflow-wrap:anywhere}
.sg{display:inline-flex;align-items:flex-end;gap:2px;height:13px}.sg i{display:block;width:3px;border-radius:1px;background:var(--ln)}
.sg i:nth-child(1){height:4px}.sg i:nth-child(2){height:7px}.sg i:nth-child(3){height:10px}.sg i:nth-child(4){height:13px}
.sg[data-l="1"] i:nth-child(-n+1),.sg[data-l="2"] i:nth-child(-n+2),.sg[data-l="3"] i:nth-child(-n+3),.sg[data-l="4"] i:nth-child(-n+4){background:var(--b)}
.ban{padding:12px 14px;border:1px solid #ef4444;background:var(--rb);color:var(--dt);font-size:13px;font-weight:500}.st{opacity:.68;transition:opacity .18s}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid var(--bd);background:var(--bg);color:var(--th);transition:.12s}
.btn:hover:not(:disabled){background:var(--ab)}.btn:active:not(:disabled){transform:scale(.98)}.btn:disabled{opacity:.55;cursor:not-allowed}
.pr{border:0;color:#fff;background:linear-gradient(90deg,#40b2ff 30%,#4550ee 100%);width:100%}.pr:hover:not(:disabled){background:linear-gradient(90deg,#40b2ff 30%,#4550ee 100%);opacity:.92}
.fw{width:100%}.rw{gap:8px}.rw .btn{flex:1;min-width:110px}
.sp{width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:sp .7s linear infinite;flex-shrink:0}@keyframes sp{to{transform:rotate(360deg)}}
.bx,.mg{padding:12px;background:var(--pg);gap:10px;font-size:13px}
.m-ok{border-color:var(--g);background:var(--gb);color:var(--g)}.m-er{border-color:#ef4444;background:var(--rb);color:var(--dt)}.m-in{border-color:var(--ad);background:var(--ab);color:var(--th)}
.ns{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
.nt{width:100%;min-height:44px;padding:8px 12px;border:1px solid var(--ln);background:var(--pg);color:var(--th);gap:10px;cursor:pointer;text-align:left}
.nt:hover{border-color:var(--ad)}.nt[aria-checked="true"]{border-color:var(--b);background:var(--bb)}
.rd{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--l);flex-shrink:0;background:var(--bg)}.nt[aria-checked="true"] .rd{border-color:var(--b);background:var(--b);box-shadow:inset 0 0 0 3px var(--bg)}
.nss{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}.nmt{flex-shrink:0;font-size:12px;color:var(--l)}
.fm{gap:12px}.fl{gap:6px}.lb{font-size:12px;font-weight:600;color:var(--th)}.iw{position:relative}
.in{width:100%;height:44px;padding:10px 12px;border:.5px solid var(--bd);background:var(--pg);color:var(--th);font-size:14px}.in.wb{padding-right:84px}.in.iv{border:1px solid #ef4444}
.ey{position:absolute;right:0;min-height:44px;min-width:44px;padding:0 12px;border:0;background:transparent;color:var(--bt);font-size:12px;font-weight:600;cursor:pointer}.ey:hover{background:var(--ab)}
.et{font-size:12px;font-weight:500;color:var(--dt)}.ht2{font-size:12px;color:var(--l)}
.ft{padding:8px 16px 24px;gap:10px}.fi{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--l)}
.ts{position:fixed;right:16px;bottom:16px;z-index:50;max-width:min(360px,calc(100vw - 32px));gap:8px;padding:6px 8px 6px 12px;border:1px solid var(--ln);border-left:3px solid #ef4444;background:var(--bg);box-shadow:0 8px 24px rgba(0,0,0,.12);font-size:13px;color:var(--th)}
.tx{min-width:44px;min-height:44px;border:0;background:transparent;color:var(--t);cursor:pointer;font-size:18px}.tx:hover{background:var(--pg)}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
@media(max-width:360px){.w,.ti{padding:10px 12px}.c{padding:12px}}
</style>
</head>
<body>
<header class="top"><div class="ti"><div class="br"><svg width="27" height="30" viewBox="0 0 27 30" fill="none" aria-hidden="true"><defs><linearGradient id="g0" x1="11.4" y1="0" x2="11.4" y2="21.3" gradientUnits="userSpaceOnUse"><stop offset=".51" stop-color="#41B0FF"/><stop offset=".91" stop-color="#4452EF"/></linearGradient><linearGradient id="g1" x1="17" y1="8.7" x2="17" y2="30" gradientUnits="userSpaceOnUse"><stop offset=".51" stop-color="#41B0FF"/><stop offset=".91" stop-color="#4452EF"/></linearGradient></defs><path d="M21.7 0c.7.1 1 .6 1.2 1.1-.2.8-1.3 2.2-1.8 3l-3.3 4.8-4.8 7.1c-.9 1.4-1.9 2.8-2.8 4.1-.4.5-.8 1.1-1.4 1.2-1.9.2-1.6-1.7-1.6-2.9-.1-1.6.1-3.4-.1-5-.1.2-.1.4-.2.5-1.4 2.2-2.7 4.6-4.2 6.8-.5.7-1.5.7-2.1.2-.4-.4-.4-1-.5-1.6V16.2c0-1-.2-2.6 1.1-2.7 1.7-.2 1.3 2.3 1.4 3.3.3-.6.8-1.3 1.2-1.9l1.6-2.5c.6-1 1.2-2 1.9-3 .3-.3.6-.7 1-.7 1.8-.1 1.3 1.9 1.4 3 0 .7 0 1.4 0 2.1 0 1 0 1.9.1 2.9L16.5 6.5l2.2-3.3c.6-.9 1.2-1.8 1.9-2.7.4-.5.5-.5 1.1-.5Z" fill="url(#g0)"/><path d="M21.1 8.7c.9-.1 1.2 0 1.7.8.1 2.3-.1 4.8.1 7.1.3-.6.7-1.2 1-1.7.5-.9 1.3-2.1 2.4-1.3.7.5.7.9.3 1.6-1 1.7-2.2 3.2-3.3 4.9-.6.9-1.5 1.2-2.6.7-.1-.1-.3-.4-.3-.5-.2-2.4.1-4.8-.1-7.2-.7 1.2-1.7 2.5-2.5 3.7-.9 1.4-1.8 2.9-2.8 4.2-.5.7-.9 1.4-1.4 2.1L11.4 26.5c-.5.8-1.9 3.1-2.6 3.5-.7 0-1.4 0-1.6-.8-.3-.9 1-2.4 1.5-3.1l3.4-5L17.8 12.7c.7-1 1.3-2 2-2.9.3-.4.7-.9 1.3-1.1Z" fill="url(#g1)"/></svg><span class="bn">Liftech</span><span class="bt">Portal da placa</span></div><span id="bt" class="bg ok">—</span></div></header>
<main id="vm" class="w">
  <div id="eb" class="ban" role="alert" hidden>Placa sem resposta. Exibindo últimos dados conhecidos.</div>
  <section class="c">
    <div class="ht"><div><div class="eye">Empilhadeira</div><h1 id="en">—</h1></div><span id="bh" class="bg ok">—</span></div>
    <div class="sub"><code id="ei">—</code><span>·</span><code id="hm">—</code></div>
  </section>
  <div id="cd" class="g">
    <section class="c">
      <div class="ch"><h2>Conexão</h2><span id="bw" class="bg ok">—</span></div>
      <div class="ks k2">
        <p><b>Rede Wi-Fi</b><span><span id="vs">—</span><span id="vg" class="sg" data-l="0" aria-hidden="true"><i></i><i></i><i></i><i></i></span><code id="vr">—</code></span></p>
        <p><b>IP na rede</b><code id="vi">—</code></p>
        <p><b>AP local</b><code id="va">—</code></p>
        <p><b>Broker MQTT</b><span><span id="vmq" class="bg ok">—</span><span id="ven" class="ht2">—</span></span></p>
        <p class="s2"><b>Horário NTP</b><span id="vnt">—</span></p>
      </div>
    </section>
    <section class="c">
      <div class="ch"><h2>Dispositivo</h2><span id="vfb" class="bg inf">—</span></div>
      <div class="ks k2">
        <p><b>MAC</b><code id="vmc">—</code></p>
        <p><b>Dispositivo</b><code id="vdv">—</code></p>
        <p><b>Versão FW</b><code id="vfw">—</code></p>
        <p><b>Tempo ligado (uptime)</b><code id="vup">—</code></p>
      </div>
    </section>
    <section class="c">
      <div class="ch"><h2>Sensor</h2><span id="vso" class="bg ok">—</span></div>
      <div class="ks k2">
        <p><b>Calibrado</b><span id="vcl" class="bg ok">—</span></p>
        <p><b>Última leitura</b><span id="vlh">—</span></p>
        <p class="s2"><b>Aceleração e inclinação</b><code id="vlv">—</code></p>
      </div>
    </section>
    <section class="c">
      <div class="ch"><h2>Calibração</h2><span id="bcl" class="bg inf" hidden>Calibrando...</span></div>
      <p class="ht2">Mantenha a empilhadeira parada e nivelada ao calibrar.</p>
      <button id="bc" type="button" class="btn fw">Calibrar sensor</button>
      <div id="cc" class="bx" hidden><span>Empilhadeira parada e nivelada? Confirmar:</span><div class="rw"><button id="bck" type="button" class="btn pr">Confirmar</button><button id="bcn" type="button" class="btn">Cancelar</button></div></div>
      <div id="cm" class="mg" role="status" hidden></div>
    </section>
    <section class="c s2">
      <div class="ch"><h2>Wi-Fi</h2><button id="bsc" type="button" class="btn">Buscar redes disponíveis</button></div>
      <ul id="nl" class="ns" role="radiogroup" aria-label="Redes Wi-Fi disponíveis" hidden></ul>
      <div id="sm" class="ht2" role="status">Clique em "Buscar redes disponíveis" ou informe o SSID abaixo.</div>
      <form id="wf" class="fm" novalidate>
        <div class="fl"><label class="lb" for="is">Nome da rede (SSID)</label><input id="is" name="ssid" type="text" class="in" maxlength="32" autocomplete="off" placeholder="Nome da rede Wi-Fi"><span id="es" class="et" hidden></span></div>
        <div id="pf" class="fl"><label class="lb" for="ip">Senha da rede</label><div class="iw"><input id="ip" name="password" type="password" class="in wb" maxlength="63" autocomplete="off" placeholder="Senha da rede"><button id="bey" type="button" class="ey" aria-pressed="false" aria-label="Mostrar senha">Mostrar</button></div><span id="ep" class="et" hidden></span></div>
        <button id="bsv" type="submit" class="btn pr">Salvar e conectar</button>
        <div id="wm" class="mg" role="status" hidden></div>
      </form>
    </section>
  </div>
</main>
<footer class="ft">
  <div class="fi"><span id="ffw">FW — · Liftech</span><code id="fap">AP 192.168.4.1</code></div>
  </footer>
<div id="ts" class="ts" role="status" aria-live="polite" hidden><span id="tt" style="flex:1"></span><button id="tx" type="button" class="tx" aria-label="Fechar aviso">×</button></div>
<script>
(()=>{
const $=i=>document.getElementById(i),T=(i,v)=>($(i).textContent=v),H=(i,v)=>($(i).hidden=v),u8=s=>new TextEncoder().encode(s).length;
let on=0,cb=0,sv=0,fl=0;
const fT=s=>s==null||s<0?'—':s>=3600?`${s/3600|0} h ${(s%3600)/60|0} min`:s>=60?`${s/60|0} min`:`${s} s`;
const fH=m=>m==null||m<0?'nunca':m<6e4?`há ${m/1e3|0} s`:m<36e5?`há ${m/6e4|0} min`:`há ${m/36e5|0} h`;
const sL=r=>r==null||r<=-90?1:r<=-75?2:r<=-65?3:4;
const bd=(i,c,t)=>{const e=$(i);e.className='bg '+c;e.textContent=t};
const mg=(i,c,t)=>{const e=$(i);e.className='mg '+c;e.textContent=t;e.hidden=0};
const el=(n,a,c,ns)=>{const x=ns?document.createElementNS('http://www.w3.org/2000/svg',n):document.createElement(n);for(const k in a)x.setAttribute(k,a[k]);if(c)x.append(...c);return x};
const lck=()=>el('svg',{width:13,height:13,viewBox:'0 0 16 16',fill:'none',stroke:'currentColor','stroke-width':'1.5','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'},[el('rect',{x:3,y:7,width:10,height:7,rx:1.5},0,1),el('path',{d:'M5 7V5a3 3 0 0 1 6 0v2'},0,1)],1);
$('tx').onclick=()=>H('ts',1);
function render(d){
  const dev=d.dispositivoNome||'—',fw=d.versao||'—',x=d.conectado?(d.mqtt?['ok','Online']:['wn','Sem broker']):['of','Sem Wi-Fi'];
  for(const[k,v]of[['en',(d.empilhadeiraNome||'').trim()||'Instância não configurada (secrets.h)'],['ei',dev],['vdv',dev],['hm',d.mac||'—'],['vmc',d.mac||'—'],['vfw',fw],['vfb','FW '+fw],['ffw',`FW ${fw} · Liftech`],['vup',fT(d.uptimeS)],['va',`${d.apIp||'192.168.4.1'} (${d.apSsid||'Liftech'})`],['fap','AP '+(d.apIp||'192.168.4.1')],['ven',fH(d.envioHaMs)],['vnt',d.ntpOk===false?'Aguardando NTP':`Sincronizado · ${d.ntpHora||'OK'}`],['vlh',fH(d.leituraHaMs)],['vlv',d.sensorOk?(d.leitura||'Leitura ok'):'Sem resposta do ADXL345'],['vs',d.ssid||(d.conectado?'—':'Não conectada')],['vr',d.conectado&&d.rssi!=null?`${d.rssi} dBm`:'—'],['vi',d.conectado?(d.ip||'—'):'—']])T(k,v);
  bd('bt',...x);bd('bh',...x);bd('bw',d.conectado?'ok':'of',d.conectado?'Conectado':'Desconectado');
  $('vg').dataset.l=d.conectado?String(sL(d.rssi)):'0';
  bd('vmq',d.mqtt?'ok':'wn',d.mqtt?'Conectado':'Desconectado');bd('vso',d.sensorOk?'ok':'er',d.sensorOk?'Sensor ok':'Sem resposta');bd('vcl',d.calibrado?'ok':'wn',d.calibrado?'Sim':'Não');
}
async function poll(){
  if(document.hidden)return;
  try{const r=await fetch('/status');if(!r.ok)throw 0;render(await r.json());H('eb',1);$('cd').classList.remove('st');if(fl){H('ts',1);fl=0;}}
  catch(_){H('eb',0);$('cd').classList.add('st');bd('bt','er','Sem resposta');bd('bh','er','Sem resposta');if(!fl){T('tt','Placa sem resposta ao consultar /status.');H('ts',0);fl=1;}}
}
$('bsc').onclick=async()=>{
  const b=$('bsc'),ul=$('nl');b.disabled=1;b.replaceChildren(el('span',{class:'sp'}),'Buscando...');T('sm','Procurando redes...');
  try{
    const r=await fetch('/scan');if(!r.ok)throw 0;const mp=new Map();
    for(const n of await r.json())if(n.ssid&&(!mp.has(n.ssid)||n.rssi>mp.get(n.ssid).rssi))mp.set(n.ssid,n);
    const lst=[...mp.values()].sort((a,c)=>c.rssi-a.rssi);ul.replaceChildren();
    if(!lst.length){H('nl',1);T('sm','Nenhuma rede encontrada. Digite o SSID.');return;}
    for(const n of lst){
      const sg=el('span',{class:'sg','data-l':sL(n.rssi)},[el('i',{}),el('i',{}),el('i',{}),el('i',{})]),db=el('code',{}),ss=el('span',{class:'nss'});
      db.textContent=n.rssi+' dBm';ss.textContent=n.ssid;
      const bt=el('button',{type:'button',class:'nt',role:'radio','aria-checked':'false'},[el('span',{class:'rd'}),ss,el('span',{class:'nmt'},[sg,db,n.segura?lck():'Aberta'])]);
      bt.onclick=()=>{
        for(const o of ul.querySelectorAll('.nt'))o.setAttribute('aria-checked','false');
        bt.setAttribute('aria-checked','true');$('is').value=n.ssid;H('es',1);$('is').classList.remove('iv');
        on=!n.segura;H('pf',on);if(on)$('ip').value='';else $('ip').focus();
      };
      ul.appendChild(el('li',{},[bt]));
    }
    H('nl',0);T('sm',`${lst.length} rede(s) encontrada(s). Toque para selecionar.`);
  }catch(_){T('sm','Erro ao buscar redes.');T('tt','Falha ao buscar redes Wi-Fi.');H('ts',0);}
  finally{b.disabled=0;b.textContent='Buscar redes disponíveis';}
};
$('nl').onkeydown=e=>{
  const k=e.key;if(k!=='ArrowDown'&&k!=='ArrowUp'&&k!=='ArrowRight'&&k!=='ArrowLeft')return;
  const bs=[...$('nl').querySelectorAll('.nt')],i=bs.indexOf(document.activeElement);
  if(i<0)return;e.preventDefault();bs[(i+(k==='ArrowDown'||k==='ArrowRight'?1:bs.length-1))%bs.length].focus();
};
$('bey').onclick=()=>{const b=$('bey'),i=$('ip'),s=i.type==='password';i.type=s?'text':'password';b.setAttribute('aria-pressed',String(s));b.textContent=s?'Ocultar':'Mostrar';b.setAttribute('aria-label',s?'Ocultar senha':'Mostrar senha');};
$('is').oninput=()=>{on=0;H('pf',0);H('es',1);$('is').classList.remove('iv')};$('ip').oninput=()=>{H('ep',1);$('ip').classList.remove('iv')};
$('wf').onsubmit=async e=>{
  e.preventDefault();if(sv)return;
  const s=$('is').value.trim(),p=on?'':$('ip').value;let ok=1;
  if(!s||u8(s)>32){T('es',s?'SSID até 32 bytes.':'Informe o SSID.');H('es',0);$('is').classList.add('iv');ok=0;}
  if(u8(p)>63){T('ep','Senha até 63 bytes.');H('ep',0);$('ip').classList.add('iv');ok=0;}
  if(!ok)return;const b=$('bsv');b.disabled=1;b.textContent='Salvando...';
  try{
    const r=await fetch('/salvar',{method:'POST',body:new URLSearchParams({ssid:s,password:p})}),d=await r.json().catch(()=>({ok:0}));
    if(!r.ok||!d.ok)throw new Error(d.erro||'Falha ao salvar');
    sv=1;for(const x of $('wf').querySelectorAll('input,button'))x.disabled=1;$('bsc').disabled=1;for(const x of $('nl').querySelectorAll('button'))x.disabled=1;
    mg('wm','m-ok',`Salvo. Reiniciando para conectar em ${s}; se mudar de rede, reabra pelo IP novo ou pelo ${$('fap').textContent}.`);
  }catch(err){b.disabled=0;b.textContent='Salvar e conectar';mg('wm','m-er',err.message);}
};
function setCal(o){cb=o;const b=$('bc');H('cc',1);H('bc',0);H('bcl',!o);if(o){b.disabled=1;b.replaceChildren(el('span',{class:'sp'}),'Calibrando sensor...');}else{b.disabled=0;b.textContent='Calibrar sensor';}}
$('bc').onclick=()=>{if(cb)return;H('bc',1);H('cc',0);H('cm',1);$('bck').focus()};
$('bcn').onclick=()=>{H('cc',1);H('bc',0);$('bc').focus()};
$('bck').onclick=async()=>{
  setCal(1);
  try{
    const r=await fetch('/calibrar',{method:'POST'}),d=await r.json().catch(()=>({ok:0}));
    if(!r.ok||!d.ok)mg('cm','m-er','Erro: sensor sem amostras.');
    else{mg('cm','m-ok',`Calibrado (${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}).`);poll();}
  }catch(_){mg('cm','m-er','Falha ao calibrar.');}finally{setCal(0);}
};
window.__p={poll,render,setCal,mg};setTimeout(poll,0);setInterval(poll,3000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
})();
</script>
</body>
</html>
)rawliteral";
