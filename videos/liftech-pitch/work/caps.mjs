// Legendas da gravação de 29/10 a partir de words-v3.json (tempos do bruto). Uso: node work/caps.mjs
import fs from 'fs';
const here = (p) => new URL(p, import.meta.url);
const IN = 13.8, OUT = 217;
const w = JSON.parse(fs.readFileSync(here('./words-v3.json')));
const fix=[[/LIFTEC|LIFTECH|Liftec\b/g,"Liftech"],[/Universidade Sorocaba/g,"Universidade de Sorocaba"],[/professor por Denis César Ângelo/g,"professor Denicezar Angelo"],[/Denis César Ângelo/g,"Denicezar Angelo"],[/Ângelo/g,"Angelo"],[/engenharia da computação/g,"Engenharia da Computação"],[/microcontroller/g,"microcontrolador"],[/rastriabilidade/g,"rastreabilidade"],[/empiradeiras/g,"empilhadeiras"],[/interface imóvel/g,"interface móvel"],[/da nossas interfaces/g,"das nossas interfaces"],[/ficaria sabendo\./g,"ficaria sabendo?"],[/C \+\+/g,"C++"],[/Front -End/g,"Front-End"],[/Back -End/g,"Back-End"],[/Node \.js/g,"Node.js"],[/Rabbit MQ/g,"RabbitMQ"]];
const apply=t=>{for(const [r,s] of fix)t=t.replace(r,s);return t};
const toks=[];
for(const x of w){const t=x.text.trim();if(!t)continue;const [a,b]=x.timestamp;if(a<IN||a>=OUT)continue;
  // blocos do Whisper se sobrepõem: descarta palavra que começa antes do fim da anterior (repetição) e o "proje..." falso
  if(toks.length&&(a<toks.at(-1).s-0.05||toks.slice(-8).some(k=>k.t===t&&Math.abs(k.s-a)<0.3)))continue;
  if(t==='proje'||t==='...')continue;
  if(/^[-.+]/.test(t)&&toks.length){toks.at(-1).t+=t;toks.at(-1).e=b}else toks.push({t,s:a,e:b})}
const sents=[];let cur=[];for(let i=0;i<toks.length;i++){const k=toks[i];cur.push(k);const n=toks[i+1];if(/[.?!]$/.test(k.t)||(n&&n.s-k.e>0.8)){sents.push(cur);cur=[]}}if(cur.length)sents.push(cur);
const MAX=42,out=[];
for(const s of sents){const len=s.map(x=>x.t).join(" ").length;const n=Math.max(1,Math.ceil(len/MAX));
 // divide em n partes de tamanho parecido, preferindo quebrar depois de vírgula
 let parts=[],start=0;for(let p=1;p<=n;p++){let end=p===n?s.length:start+1;if(p<n){const target=len*p/n;let acc=s.slice(0,start).map(x=>x.t).join(" ").length;let best=start,bestScore=1e9;
   for(let j=start;j<s.length-1;j++){acc+=s[j].t.length+1;const sc=Math.abs(acc-target)-(/[,;:]$/.test(s[j].t)?6:0);if(sc<bestScore){bestScore=sc;best=j}}end=best+1}
  parts.push(s.slice(start,end));start=end}
 for(const c of parts){if(c.length)out.push({start:+c[0].s.toFixed(2),end:+c.at(-1).e.toFixed(2),text:apply(c.map(x=>x.t).join(" "))})}}
out.forEach((o,i)=>o.i=i+1);
fs.writeFileSync(here('../captions-v3.json'),JSON.stringify(out,null,1));
const f=t=>{const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=Math.floor(t%60),ms=Math.round((t%1)*1000);return [h,m,s].map(v=>String(v).padStart(2,"0")).join(":")+","+String(ms).padStart(3,"0")};
fs.writeFileSync(here('../captions-v3.srt'),out.map(o=>`${o.i}\n${f(o.start)} --> ${f(o.end)}\n${o.text}\n`).join("\n"));
console.log(out.length,"legendas, maior",Math.max(...out.map(o=>o.text.length)),"car.");
