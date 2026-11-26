{
const TR=["Maxcel","Impulse","Stay Up","Controle"];
const COL={"Maxcel":"#1e8a42","Impulse":"#2f6db5","Stay Up":"#c7861b","Controle":"#8c918a"};
const VARS={Ground_Cover_pct:{n:"Ground Cover",u:"%",d:1},Altura_cm:{n:"Altura de plantas",u:"cm",d:1},Estande_pl_m:{n:"Estande",u:"pl/m",d:1},Ramos_por_planta:{n:"Ramos por planta",u:"nº",d:1}};
const ORD=["VE","VC","V1","V2","V3","V4","V5","V6","V7","V8","V9","R1","R2","R3","R4","R5","R6","R7","R8"];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=id=>document.getElementById(id);
const fmt=(v,d=1)=>v==null||isNaN(v)?"–":v.toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=v=>v==null||isNaN(v)?"–":(v>0?"+":"")+fmt(v,1)+"%";
const cls=v=>v>1?"up":v<-1?"dn":"eq";

/* ---------- dados de exemplo ---------- */
function demo(){
  let s=42;const r=()=>(s=(s*16807)%2147483647)/2147483647;const nr=()=>(r()+r()+r()-1.5)*0.8;
  const sites=[["Produtor A","Faz. Boa Vista","Rio Verde","GO",["T01","T02"]],["Produtor A","Faz. Santa Rita","Jataí","GO",["T05"]],
    ["Produtor B","Faz. Primavera","Sorriso","MT",["T03","T07"]],["Produtor C","Faz. Chapadão","Luís Eduardo Magalhães","BA",["T02","T04"]],
    ["Produtor D","Faz. São Pedro","Cascavel","PR",["T01"]],["Produtor E","Faz. Esperança","Primavera do Leste","MT",["T09","T11"]]];
  const st=[["V3",20],["V6",35],["R1",50],["R3",65],["R5",85]];
  const base={V3:[15,22,0.2],V6:[32,47,1.1],R1:[52,76,2.6],R3:[72,89,3.3],R5:[88,94,3.5]};
  const ef={Maxcel:[-0.05,0.13,0.30],Impulse:[0.01,0.06,0.11],"Stay Up":[-0.08,0.04,0.08],Controle:[0,0,0]};
  const out=[];let site=0;
  for(const [p,f,m,uf,ts] of sites)for(const t of ts){site++;
    const sh=1+nr()*0.12,sg=1+nr()*0.06,stand=12.5+nr()*1.6,resp=site===6?0.15:1+nr()*0.35;
    for(const tr of TR)for(let pt=1;pt<=4;pt++)for(const [e,d] of st){
      const ramp=e==="V3"?0:e==="V6"?0.55:1,[eh,eg,er]=ef[tr].map(x=>x*ramp*resp),[bh,bg,br]=base[e];
      const gc=Math.min(99,bg*sg*(1+eg)*(1+nr()*0.05));
      const id=`${t}-${tr.replace(" ","").slice(0,3).toUpperCase()}-P${pt}-${e}`;
      out.push({ID_Avaliacao:id,Produtor:p,Fazenda:f,Municipio:m,UF:uf,Talhao:t,Tratamento:tr,Ponto:pt,Estadio:e,DAE:d,
        Altura_cm:bh*sh*(1+eh)*(1+nr()*0.06),Estande_pl_m:stand*(1+nr()*0.05),Ground_Cover_pct:gc,
        Ramos_por_planta:Math.max(0,br*(1+er)*(1+nr()*0.12)),Foto_Arquivo:id+".jpg"});
    }}
  return out;
}
let DATA=[],PHOTOS={},SB=null,PAPEL=null,MODE="",RECOVERY=false;

/* ---------- estatística ---------- */
const st=a=>{const v=a.filter(x=>x!=null&&!isNaN(x));const n=v.length;if(!n)return{n:0,m:NaN,sd:NaN,cv:NaN};
  const m=v.reduce((s,x)=>s+x,0)/n,sd=n>1?Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/(n-1)):0;return{n,m,sd,cv:m?sd/m*100:NaN}};
const by=(a,k)=>a.reduce((o,r)=>((o[r[k]]??=[]).push(r),o),{});
const stages=a=>[...new Set(a.map(r=>r.Estadio))].sort((x,y)=>ORD.indexOf(x)-ORD.indexOf(y));
const siteKey=r=>`${r.Produtor} · ${r.Fazenda} · ${r.Talhao}`;

/* ---------- filtros ---------- */
const sel=(el,opts,keep,all=true)=>{const v=el.value;el.innerHTML=(all?['<option value="">Todos</option>']:[]).concat(opts.map(o=>`<option>${esc(o)}</option>`)).join("");
  if(keep&&[...el.options].some(o=>o.value===v))el.value=v};
function cascade(){
  const P=$("sP").value;sel($("sF"),[...new Set(DATA.filter(r=>!P||r.Produtor===P).map(r=>r.Fazenda))].sort(),1);
  const F=$("sF").value;sel($("sT"),[...new Set(DATA.filter(r=>(!P||r.Produtor===P)&&(!F||r.Fazenda===F)).map(r=>r.Talhao))].sort(),1);
}
function initFilters(){
  sel($("sP"),[...new Set(DATA.map(r=>r.Produtor))].sort());cascade();
  const ss=stages(DATA);sel($("sE"),ss,0,false);$("sE").value=ss.includes("R1")?"R1":ss[Math.floor(ss.length/2)];
  $("sV").innerHTML=Object.entries(VARS).map(([k,v])=>`<option value="${k}">${v.n} (${v.u})</option>`).join("");
  const sites=[...new Set(DATA.map(r=>r.Talhao+"|"+r.Fazenda))];
  $("pT").innerHTML=sites.map(s=>{const[t,f]=s.split("|");return`<option value="${esc(s)}">${esc(f)} · ${esc(t)}</option>`}).join("");
  sel($("pE"),ss,0,false);$("pE").value=$("sE").value;
  const tro=TR.map(t=>`<option>${t}</option>`).join("");$("pA").innerHTML=tro;$("pB").innerHTML=tro;$("pA").value="Maxcel";$("pB").value="Controle";
}
const filt=()=>{const P=$("sP").value,F=$("sF").value,T=$("sT").value;return DATA.filter(r=>(!P||r.Produtor===P)&&(!F||r.Fazenda===F)&&(!T||r.Talhao===T))};

/* ---------- gráficos ---------- */
let cE,cB;
const errPlug={id:"err",afterDatasetsDraw(c){const m=c.getDatasetMeta(0),sd=c.data.datasets[0].sd,y=c.scales.y,x=c.ctx;if(!sd)return;
  x.save();x.strokeStyle=getComputedStyle(document.body).color;x.lineWidth=1.5;
  m.data.forEach((b,i)=>{const v=c.data.datasets[0].data[i];if(v==null)return;const t=y.getPixelForValue(v+sd[i]),bo=y.getPixelForValue(v-sd[i]);
    x.beginPath();x.moveTo(b.x,t);x.lineTo(b.x,bo);x.moveTo(b.x-6,t);x.lineTo(b.x+6,t);x.moveTo(b.x-6,bo);x.lineTo(b.x+6,bo);x.stroke()});x.restore()}};
function charts(d,V,E){
  const ink=getComputedStyle(document.body).color,grid=getComputedStyle(document.documentElement).getPropertyValue("--line").trim()||"#ddd";
  Chart.defaults.color=ink;Chart.defaults.font.family="Barlow, system-ui, sans-serif";Chart.defaults.font.size=13;
  const dae=[...new Set(d.map(r=>r.DAE))].sort((a,b)=>a-b),bySt=by(d,"DAE"),eByD={};d.forEach(r=>eByD[r.DAE]=r.Estadio);
  const ds=TR.map(t=>({label:t,borderColor:COL[t],backgroundColor:COL[t],borderWidth:t==="Maxcel"?3.5:2,pointRadius:4,tension:.3,
    data:dae.map(x=>st((bySt[x]||[]).filter(r=>r.Tratamento===t).map(r=>r[V])).m)}));
  cE?.destroy();cE=new Chart($("cEvo"),{type:"line",data:{labels:dae.map(x=>`${eByD[x]} · ${x}`),datasets:ds},
    options:{maintainAspectRatio:false,animation:{duration:400},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw)} ${VARS[V].u}`}}},
      scales:{x:{title:{display:true,text:"Estádio · DAE"},grid:{color:grid}},y:{title:{display:true,text:VARS[V].u},grid:{color:grid}}}}});
  const de=d.filter(r=>r.Estadio===E),ss=TR.map(t=>st(de.filter(r=>r.Tratamento===t).map(r=>r[V])));
  cB?.destroy();cB=new Chart($("cBar"),{type:"bar",plugins:[errPlug],data:{labels:TR,datasets:[{data:ss.map(s=>isNaN(s.m)?null:s.m),sd:ss.map(s=>s.sd),backgroundColor:TR.map(t=>COL[t]),borderRadius:6}]},
    options:{maintainAspectRatio:false,animation:{duration:400},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${fmt(c.raw)} ± ${fmt(ss[c.dataIndex].sd)} ${VARS[V].u} (n=${ss[c.dataIndex].n})`}}},
      scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:grid}}}}});
}

/* ---------- render ---------- */
function render(){
  $("empty").hidden=!!DATA.length;$("dash").hidden=!DATA.length;if(!DATA.length)return;
  const d=filt(),V=$("sV").value,E=$("sE").value,vn=VARS[V].n,u=VARS[V].u,de=d.filter(r=>r.Estadio===E);
  const nP=new Set(d.map(r=>r.Produtor)).size,nF=new Set(d.map(r=>r.Fazenda)).size,nT=new Set(d.map(siteKey)).size;
  $("sub").textContent=`${nP} produtor(es) · ${nF} fazenda(s) · ${nT} talhão(ões) · ${d.length.toLocaleString("pt-BR")} registros de avaliação`;
  const mean=(a,t,k)=>st(a.filter(r=>r.Tratamento===t).map(r=>r[k])).m,dl=(a,t,k)=>{const c=mean(a,"Controle",k);return c?(mean(a,t,k)/c-1)*100:NaN};
  const gd=dl(de,"Maxcel","Ground_Cover_pct");
  $("title").textContent=isNaN(gd)?"Estruturação de plantas de soja":`Maxcel ${gd>=0?"aumentou":"reduziu"} a cobertura do solo em ${fmt(Math.abs(gd),0)}% frente ao Controle em ${E}`;
  $("leg").innerHTML=TR.map(t=>`<span><i style="background:${COL[t]}"></i>${t}</span>`).join("");
  $("kpis").innerHTML=Object.entries(VARS).map(([k,v])=>{const m=mean(de,"Maxcel",k),x=dl(de,"Maxcel",k);
    return`<div class="k"><div class="l">${v.n} · Maxcel · ${esc(E)}</div><div class="v">${fmt(m)} <span style="font-size:18px">${v.u}</span></div>
    <div class="d ${cls(x)}">${pct(x)} vs Controle</div><div class="l">Controle: ${fmt(mean(de,"Controle",k))} ${v.u}</div></div>`}).join("");
  $("evoT").textContent=`${vn} ao longo do ciclo`;$("barT").textContent=`${vn} em ${E}`;
  charts(d,V,E);

  /* consistência */
  const bs=by(de.map(r=>({...r,_s:siteKey(r)})),"_s");
  const cons=Object.entries(bs).map(([k,a])=>({k,v:dl(a,"Maxcel",V)})).filter(x=>!isNaN(x.v)).sort((a,b)=>b.v-a.v);
  const mx=Math.max(5,...cons.map(c=>Math.abs(c.v))),win=cons.filter(c=>c.v>0).length;
  $("conT").textContent=`Maxcel × Controle por talhão`;
  $("conH").textContent=`Diferença % em ${vn.toLowerCase()} no estádio ${E}. Maxcel ficou acima do Controle em ${win} de ${cons.length} talhões.`;
  $("con").innerHTML=cons.map(c=>{const w=Math.abs(c.v)/mx*50,l=c.v>=0?50:50-w;
    return`<div class="row"><span title="${esc(c.k)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.k.split(" · ").slice(1).join(" · "))}</span>
    <div class="axis"><div class="bar" style="left:${l}%;width:${w}%;background:${c.v>=0?COL.Maxcel:"#c0392b"}"></div></div><span class="n ${cls(c.v)}">${pct(c.v)}</span></div>`}).join("")||"<p>Sem dados.</p>";

  /* insights */
  const ins=[],rk=TR.map(t=>[t,mean(de,t,V)]).filter(x=>!isNaN(x[1])).sort((a,b)=>b[1]-a[1]);
  if(rk.length)ins.push(`<b>Ranking em ${esc(E)}</b><br>${rk.map(([t,m],i)=>`${i+1}º ${t} (${fmt(m)} ${u})`).join(" · ")}`);
  if(cons.length)ins.push(`<b>Consistência</b><br>Maxcel superou o Controle em ${win}/${cons.length} talhões (${fmt(win/cons.length*100,0)}%). Maior ganho: ${esc(cons[0].k.split(" · ").slice(1).join(" · "))} (${pct(cons[0].v)}); menor: ${esc(cons.at(-1).k.split(" · ").slice(1).join(" · "))} (${pct(cons.at(-1).v)}).`);
  const hr=dl(de,"Maxcel","Ramos_por_planta"),ha=dl(de,"Maxcel","Altura_cm");
  if(!isNaN(hr))ins.push(`<b>Arquitetura da planta</b><br>Com Maxcel, ramos por planta ${hr>=0?"subiram":"caíram"} ${fmt(Math.abs(hr))}% e a altura ${ha>=0?"aumentou":"reduziu"} ${fmt(Math.abs(ha))}% — ${hr>5&&ha<0?"planta mais ramificada e mais baixa, padrão esperado de estruturação":"verificar se o efeito de estruturação aparece neste recorte"}.`);
  const hs=dl(de,"Maxcel","Estande_pl_m");if(!isNaN(hs))ins.push(`<b>Estande</b><br>Diferença de ${pct(hs)} entre Maxcel e Controle — ${Math.abs(hs)<4?"estande semelhante, então as diferenças não vêm do número de plantas":"atenção: estande diferente pode confundir o efeito dos tratamentos"}.`);
  const gm=d.filter(r=>r.Tratamento==="Maxcel"),gc=d.filter(r=>r.Tratamento==="Controle"),dd=[...new Set(d.map(r=>r.Estadio))];
  const first=stages(d).find(e=>{const a=st(gm.filter(r=>r.Estadio===e).map(r=>r.Ground_Cover_pct)).m,b=st(gc.filter(r=>r.Estadio===e).map(r=>r.Ground_Cover_pct)).m;return a/b>1.05});
  if(first)ins.push(`<b>Fechamento de entrelinha</b><br>A vantagem de Maxcel em ground cover passa de 5% a partir de ${esc(first)}.`);
  $("ins").innerHTML=ins.map(i=>`<li>${i}</li>`).join("");

  /* tabela por tratamento */
  $("tabH").textContent=`Estádio ${E} · média ± desvio padrão · Δ% em relação ao Controle · CV%`;
  $("tab").innerHTML=`<tr><th>Tratamento</th>${Object.values(VARS).map(v=>`<th>${v.n} (${v.u})</th><th>Δ%</th>`).join("")}<th>CV% ${esc(vn)}</th><th>n</th></tr>`+
    TR.map(t=>{const a=de.filter(r=>r.Tratamento===t);return`<tr><td><span class="dot" style="background:${COL[t]}"></span>${t}</td>${Object.keys(VARS).map(k=>{const s=st(a.map(r=>r[k])),x=dl(de,t,k);
      return`<td>${fmt(s.m)} ± ${fmt(s.sd)}</td><td class="${t==="Controle"?"eq":cls(x)}">${t==="Controle"?"—":pct(x)}</td>`}).join("")}<td>${fmt(st(a.map(r=>r[V])).cv)}</td><td>${a.length}</td></tr>`}).join("");

  /* tabela por site */
  $("tab2H").textContent=`${vn} (${u}) em ${E} — média dos pontos por tratamento`;
  $("tab2").innerHTML=`<tr><th>Produtor</th><th class="tl">Fazenda</th><th class="tl">Município/UF</th><th class="tl">Talhão</th>${TR.map(t=>`<th><span class="dot" style="background:${COL[t]}"></span>${t}</th>`).join("")}<th>Maxcel vs Ctrl</th></tr>`+
    Object.values(bs).map(a=>{const r=a[0],x=dl(a,"Maxcel",V);return`<tr><td>${esc(r.Produtor)}</td><td class="tl">${esc(r.Fazenda)}</td><td class="tl">${esc(r.Municipio)}/${esc(r.UF)}</td><td class="tl">${esc(r.Talhao)}</td>${TR.map(t=>`<td>${fmt(mean(a,t,V))}</td>`).join("")}<td class="${cls(x)}">${pct(x)}</td></tr>`}).join("");

  photos();
  const cols=Object.keys(DATA[0]||{}).filter(c=>c[0]!=="_");
  $("raw").innerHTML=`<tr>${cols.map(c=>`<th>${esc(c)}</th>`).join("")}</tr>`+DATA.slice(0,50).map(r=>`<tr>${cols.map(c=>`<td>${typeof r[c]==="number"?fmt(r[c],c==="Ponto"||c==="DAE"?0:1):esc(r[c])}</td>`).join("")}</tr>`).join("");
}

/* ---------- fotos ---------- */
function canopy(gc,seed,h){
  let s=seed;const r=()=>(s=(s*16807)%2147483647)/2147483647;const cov=Math.min(.99,(gc||0)/100);
  const rows=4,lw=100/rows,leaves=[];
  for(let i=0;i<rows;i++){const cx=lw*(i+.5),half=lw/2*cov;const n=Math.round(120+cov*260);
    for(let k=0;k<n;k++){const y=r()*104-2,x=cx+(r()*2-1)*half,rr=1.4+r()*2.2;
      const g=["#2f7d32","#3b8f3c","#256b2b","#4aa04a"][Math.floor(r()*4)];leaves.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr*.7).toFixed(1)}" fill="${g}" transform="rotate(${Math.floor(r()*180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`)}}
  return`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#7a5a3c"/>
    <g fill="#6b4e33" opacity=".6">${Array.from({length:60},()=>`<circle cx="${(r()*100).toFixed(1)}" cy="${(r()*100).toFixed(1)}" r="${(r()*1.6).toFixed(1)}"/>`).join("")}</g>${leaves.join("")}</svg>`;
}
function photoFor(tr){
  const[t,f]=$("pT").value.split("|"),e=$("pE").value;
  const a=DATA.filter(r=>r.Talhao===t&&r.Fazenda===f&&r.Estadio===e&&r.Tratamento===tr);const r=a.find(x=>+x.Ponto===1)||a[0];
  if(!r)return{html:'<div style="display:grid;place-items:center;color:#fff">Sem registro</div>',r:null};
  const url=PHOTOS[String(r.Foto_Arquivo||"").toLowerCase()];
  const seed=[...String(r.ID_Avaliacao)].reduce((s,c)=>s+c.charCodeAt(0),7)*97+1;
  return{html:url?`<img src="${url}" alt="Foto ${esc(tr)}">`:canopy(r.Ground_Cover_pct,seed),r,real:!!url};
}
function photos(){
  $("ph").innerHTML=TR.map(t=>{const p=photoFor(t),r=p.r;return`<div class="ph"><div class="img">${p.html}</div><div class="cap"><b style="color:${COL[t]}">${t}</b>${p.real?"":" <span style='color:var(--mut)'>· ilustração</span>"}<br>
    ${r?`GC ${fmt(r.Ground_Cover_pct)}% · Altura ${fmt(r.Altura_cm)} cm · ${fmt(r.Ramos_por_planta)} ramos<br><span style="color:var(--mut);font-size:13px">${esc(r.Foto_Arquivo)}</span>`:""}</div></div>`}).join("");
  const A=$("pA").value,B=$("pB").value;$("lyA").innerHTML=photoFor(A).html;$("lyB").innerHTML=photoFor(B).html;
  $("tgA").textContent=A;$("tgA").style.background=COL[A];$("tgB").textContent=B;$("tgB").style.background=COL[B];
}
const slide=()=>{const v=$("rg").value;$("lyA").style.clipPath=`inset(0 ${100-v}% 0 0)`;$("hand").style.left=v+"%"};

/* ---------- utilidades de interface ---------- */
let tt;const toast=(m,err)=>{const t=$("toast");t.textContent=m;t.className="toast on"+(err?" err":"");clearTimeout(tt);tt=setTimeout(()=>t.className="toast",err?9000:5000)};
const show=(gate)=>{$("gate").hidden=!gate;$("app").hidden=gate;$("actions").hidden=gate};
const num=v=>v===""||v==null?null:typeof v==="number"?v:(x=>isNaN(x)?null:x)(parseFloat(String(v).replace(",",".")));
const isoDate=v=>{if(v instanceof Date)return new Date(v.getTime()-v.getTimezoneOffset()*6e4).toISOString().slice(0,10);
  const s=String(v??"").trim();if(!s)return"";const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`:s};

/* ---------- conexão ---------- */
const CFG=window.APP_CONFIG||{};
if(CFG.supabaseUrl&&CFG.supabaseAnonKey&&!CFG.supabaseAnonKey.startsWith("COLE_")&&window.supabase)SB=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey);

async function loadDB(){
  $("srcNote").textContent="Carregando dados do banco…";
  const rows=[];for(let i=0;;i+=1000){const{data,error}=await SB.from("v_avaliacoes").select("*").range(i,i+999);
    if(error){toast("Erro ao ler o banco: "+error.message,1);break}rows.push(...data);if(data.length<1000)break}
  DATA=rows.map(r=>({ID_Avaliacao:r.id,Produtor:r.produtor,Fazenda:r.fazenda,Municipio:r.municipio||"",UF:r.uf||"",Talhao:r.talhao,
    Tratamento:r.tratamento,Ponto:num(r.ponto),Data:r.data,Estadio:r.estadio,DAE:num(r.dae),Altura_cm:num(r.altura_cm),
    Estande_pl_m:num(r.estande_pl_m),Ground_Cover_pct:num(r.ground_cover_pct),Ramos_por_planta:num(r.ramos_por_planta),
    Foto_Arquivo:r.foto_arquivo||"",_foto:r.foto_path||"",Avaliador:r.avaliador||""}));
  PHOTOS={};const withP=DATA.filter(r=>r._foto);
  for(let i=0;i<withP.length;i+=100){const part=withP.slice(i,i+100);
    const{data}=await SB.storage.from("fotos").createSignedUrls(part.map(r=>r._foto),3600);
    (data||[]).forEach((u,k)=>{if(u.signedUrl)PHOTOS[part[k].Foto_Arquivo.toLowerCase()]=u.signedUrl})}
  const last=rows.reduce((m,r)=>r.atualizado_em>m?r.atualizado_em:m,"");
  $("srcNote").textContent=`Banco Supabase · ${rows.length.toLocaleString("pt-BR")} avaliações · ${withP.length} com foto`+(last?` · última atualização ${new Date(last).toLocaleString("pt-BR")}`:"");
  if(DATA.length)initFilters();render();
}

async function boot(){
  if(MODE==="demo"||RECOVERY)return;
  if(!SB){$("gateMsg").textContent="O banco ainda não foi configurado (config.js). Você pode ver a prévia com dados de exemplo.";$("loginForm").hidden=true;show(true);return}
  const{data:{session}}=await SB.auth.getSession();
  if(!session){show(true);$("who").textContent="";return}
  const{data:papel}=await SB.rpc("papel_atual");PAPEL=papel;
  $("who").textContent=session.user.email+(papel?` · ${papel}`:"");
  if(!papel){show(true);$("loginForm").hidden=true;
    $("gateMsg").innerHTML=`O e-mail <b>${esc(session.user.email)}</b> entrou, mas ainda não foi autorizado no projeto. Peça a um administrador para incluí-lo em “Membros da equipe”.`;
    $("demoBtn").textContent="Sair";$("demoBtn").onclick=()=>SB.auth.signOut().then(()=>location.reload());return}
  show(false);const can=papel==="admin"||papel==="avaliador";$("bxWrap").hidden=!can;$("bpWrap").hidden=!can;
  $("adminBox").hidden=papel!=="admin";if(papel==="admin")loadMembers();
  await loadDB();
}

/* ---------- login (e-mail e senha; contas criadas só pela administração) ---------- */
const here=location.origin+location.pathname;
const ptErr=m=>/Invalid login/i.test(m)?"E-mail ou senha incorretos.":/not confirmed/i.test(m)?"Conta ainda não confirmada. Fale com a administradora.":
  /at least 6/i.test(m)?"A senha precisa ter pelo menos 6 caracteres.":/rate limit/i.test(m)?"Muitas tentativas em pouco tempo. Aguarde alguns minutos.":m;
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!SB)return;
  const email=$("email").value.trim().toLowerCase(),password=$("pass").value;
  $("sendLink").disabled=true;const{error}=await SB.auth.signInWithPassword({email,password});$("sendLink").disabled=false;
  if(error)return toast(ptErr(error.message),1)});
$("newPassForm").addEventListener("submit",async e=>{e.preventDefault();
  if($("np1").value!==$("np2").value)return toast("As senhas não conferem.",1);
  const{error}=await SB.auth.updateUser({password:$("np1").value});if(error)return toast(ptErr(error.message),1);
  RECOVERY=false;toast("Senha atualizada.");$("newPassForm").hidden=true;$("loginForm").hidden=false;history.replaceState(null,"",here);boot()});
$("demoBtn").onclick=()=>{MODE="demo";DATA=demo();PHOTOS={};show(false);$("bxWrap").hidden=true;$("bpWrap").hidden=true;$("reload").hidden=true;
  $("logout").textContent="Voltar ao login";$("srcNote").textContent="Dados fictícios de demonstração — nada aqui vem do banco.";initFilters();render()};
$("logout").onclick=async()=>{if(MODE!=="demo"&&SB)await SB.auth.signOut();location.reload()};
$("reload").onclick=()=>loadDB();
SB?.auth.onAuthStateChange(ev=>{if(ev==="PASSWORD_RECOVERY"){RECOVERY=true;show(true);$("loginForm").hidden=true;$("newPassForm").hidden=false;
    $("gateTitle").textContent="Nova senha";$("gateMsg").textContent="Escolha sua nova senha.";return}
  if(ev==="SIGNED_IN"&&!RECOVERY&&$("app").hidden&&MODE!=="demo")setTimeout(boot,0)});

/* ---------- envio de planilha ---------- */
const REQ=["ID_Avaliacao","Produtor","Fazenda","Talhao","Tratamento","Estadio"];
const clean=o=>{const r={};for(const[k,v]of Object.entries(o)){const key=String(k).trim();if(!key||key.startsWith("__EMPTY"))continue;
  r[key]=v instanceof Date?isoDate(v):typeof v==="string"?v.trim():v}return r};
async function sendChunks(fn,rows){let n=0;for(let i=0;i<rows.length;i+=400){const{data,error}=await SB.rpc(fn,{linhas:rows.slice(i,i+400)});
  if(error)throw new Error(`${error.message} (bloco a partir da linha ${i+2})`);n+=data}return n}
$("fx").addEventListener("change",async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;
  try{const wb=XLSX.read(await f.arrayBuffer(),{type:"array",cellDates:true});
    const sh=wb.Sheets["Avaliacoes"]||wb.Sheets[wb.SheetNames[0]];
    const av=XLSX.utils.sheet_to_json(sh,{defval:"",raw:true}).map(clean).filter(r=>Object.values(r).some(v=>v!==""));
    const bad=[];av.forEach((r,i)=>{const miss=REQ.filter(k=>r[k]===""||r[k]==null);if(miss.length)bad.push(`linha ${i+2}: falta ${miss.join(", ")}`);
      r.Data=isoDate(r.Data);for(const k of["Ponto","DAE","Altura_cm","Estande_pl_m","Ground_Cover_pct","Ramos_por_planta"])r[k]=num(r[k]);
      for(const k of REQ)r[k]=String(r[k]??"")});
    if(!av.length)return toast("A aba Avaliacoes está vazia.",1);
    if(bad.length)return toast(`Corrija antes de enviar — ${bad.length} linha(s) incompleta(s). ${bad.slice(0,3).join("; ")}`,1);
    toast(`Enviando ${av.length} linhas…`);
    let nc=0;const cad=wb.Sheets["Cadastro_Talhoes"];
    if(cad){const rows=XLSX.utils.sheet_to_json(cad,{defval:"",raw:true}).map(clean).filter(r=>r.Produtor&&r.Fazenda&&r.Talhao)
      .map(r=>({...r,Data_Semeadura:isoDate(r.Data_Semeadura),Data_Aplicacao:isoDate(r.Data_Aplicacao),
        Latitude:num(r.Latitude),Longitude:num(r.Longitude),Area_ha:num(r.Area_ha),Espacamento_cm:num(r.Espacamento_cm),Talhao:String(r.Talhao)}));
      if(rows.length)nc=await sendChunks("importar_talhoes",rows)}
    const n=await sendChunks("importar_avaliacoes",av);
    toast(`Pronto: ${n} avaliações gravadas`+(nc?` e ${nc} talhões cadastrados`:"")+".");await loadDB();
  }catch(err){toast("Envio interrompido: "+err.message,1)}});

/* ---------- envio de fotos ---------- */
$("fp").addEventListener("change",async e=>{const files=[...e.target.files];e.target.value="";if(!files.length)return;
  let ok=0,lig=0,fail=[];
  for(const[i,f]of files.entries()){toast(`Enviando foto ${i+1} de ${files.length}…`);
    const path="avaliacoes/"+f.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"_");
    const{error}=await SB.storage.from("fotos").upload(path,f,{upsert:true,contentType:f.type||"image/jpeg"});
    if(error){fail.push(f.name);continue}ok++;
    const{data}=await SB.rpc("vincular_foto",{arquivo:f.name,caminho:path});lig+=data?1:0;if(!data)fail.push(f.name+" (sem linha com esse Foto_Arquivo)")}
  toast(`${ok} foto(s) enviada(s), ${lig} ligada(s) a avaliações.`+(fail.length?` Verificar: ${fail.slice(0,4).join(", ")}`:""),!!fail.length);await loadDB()});

/* ---------- membros (admin): cria conta, define senha e papel ---------- */
async function adminCall(body){const{data,error}=await SB.functions.invoke("gerenciar-usuario",{body});
  if(error){let m=error.message;try{const j=await error.context.json();m=j.erro||m}catch{}throw new Error(m)}
  if(data?.erro)throw new Error(data.erro);return data}
async function loadMembers(){const{data,error}=await SB.from("membros").select("*").order("papel").order("email");if(error)return;
  $("mTab").innerHTML="<tr><th>E-mail</th><th class='tl'>Nome</th><th class='tl'>Papel</th><th></th></tr>"+data.map(m=>
    `<tr><td>${esc(m.email)}</td><td class="tl">${esc(m.nome)}</td><td class="tl">${esc(m.papel)}</td><td><button class="mini" data-edit="${esc(m.email)}" data-nome="${esc(m.nome)}" data-papel="${esc(m.papel)}" type="button">Editar</button> <button class="mini" data-del="${esc(m.email)}" type="button">Remover</button></td></tr>`).join("")}
$("addMember").addEventListener("submit",async e=>{e.preventDefault();$("mSave").disabled=true;
  try{const senha=$("mSenha").value;await adminCall({acao:"salvar",email:$("mEmail").value.trim().toLowerCase(),nome:$("mNome").value.trim(),papel:$("mPapel").value,senha:senha||null});
    toast(senha?"Usuário salvo com a senha definida. Envie a senha para a pessoa por um canal seguro.":"Usuário atualizado.");e.target.reset();loadMembers()}
  catch(err){toast(err.message,1)}finally{$("mSave").disabled=false}});
$("mTab").addEventListener("click",async e=>{const b=e.target;
  if(b.dataset?.edit){$("mEmail").value=b.dataset.edit;$("mNome").value=b.dataset.nome||"";$("mPapel").value=b.dataset.papel;$("mSenha").value="";$("mSenha").focus();return}
  const em=b.dataset?.del;if(!em)return;
  if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Confirmar remoção";return}
  try{await adminCall({acao:"remover",email:em});toast("Usuário removido.");loadMembers()}catch(err){toast(err.message,1)}});

for(const id of["sP","sF","sT"])$(id).addEventListener("change",()=>{cascade();render()});
for(const id of["sE","sV"])$(id).addEventListener("change",render);
for(const id of["pT","pE","pA","pB"])$(id).addEventListener("change",photos);
$("rg").addEventListener("input",slide);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",render);
slide();boot();
}
