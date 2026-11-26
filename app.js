{
/* ====================== constantes e utilidades ====================== */
const TR=["Maxcel","Impulse","Stay Up","Controle"];
const COL={"Maxcel":"#1e8a42","Impulse":"#2f6db5","Stay Up":"#c7861b","Controle":"#8c918a"};
const ORD=["VE","VC","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","R1","R2","R3","R4","R5","R6","R7","R8"];
const NPL=5;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=id=>document.getElementById(id);
const fmt=(v,d=1)=>v==null||isNaN(v)?"–":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=v=>v==null||isNaN(v)?"–":(v>0?"+":"")+fmt(v,1)+"%";
const cls=v=>v>1?"up":v<-1?"dn":"eq";
const num=v=>v===""||v==null?null:typeof v==="number"?v:(x=>isNaN(x)?null:x)(parseFloat(String(v).replace(",",".")));
const isoDate=v=>{if(v instanceof Date)return new Date(v.getTime()-v.getTimezoneOffset()*6e4).toISOString().slice(0,10);
  const s=String(v??"").trim();if(!s)return"";const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`:s};
const daysBetween=(a,b)=>a&&b?Math.round((new Date(b)-new Date(a))/864e5):null;
const st=a=>{const v=a.filter(x=>x!=null&&!isNaN(x));const n=v.length;if(!n)return{n:0,m:NaN,sd:NaN,cv:NaN};
  const m=v.reduce((s,x)=>s+x,0)/n,sd=n>1?Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/(n-1)):0;return{n,m,sd,cv:m?sd/m*100:NaN}};
const by=(a,k)=>a.reduce((o,r)=>((o[typeof k==="function"?k(r):r[k]]??=[]).push(r),o),{});
const ordSt=a=>[...new Set(a)].filter(Boolean).sort((x,y)=>(ORD.indexOf(x)+1||99)-(ORD.indexOf(y)+1||99));
let tt;const toast=(m,err)=>{const t=$("toast");t.textContent=m;t.className="toast on"+(err?" err":"");clearTimeout(tt);tt=setTimeout(()=>t.className="toast",err?9000:5000)};
const opts=(arr,all)=>(all?[`<option value="">${all}</option>`]:[]).concat(arr.map(o=>typeof o==="object"?`<option value="${esc(o.v)}">${esc(o.t)}</option>`:`<option>${esc(o)}</option>`)).join("");
const setSel=(el,html)=>{const v=el.value;el.innerHTML=html;if([...el.options].some(o=>o.value===v))el.value=v};

/* ====================== estado ====================== */
let SB=null,PAPEL=null,MODE="";
let PROD=[],FAZ=[],PL=[],GC=[],GER=[],URL_={};
const CFG=window.APP_CONFIG||{};
if(CFG.supabaseUrl&&CFG.supabaseAnonKey&&!CFG.supabaseAnonKey.startsWith("COLE_")&&window.supabase)SB=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey);
const fazById=id=>FAZ.find(f=>f.id===id);
const prodById=id=>PROD.find(p=>p.id===id);
const popHa=(plm,esp)=>plm!=null&&esp?plm*10000/(esp/100):null;

/* ====================== dados de exemplo ====================== */
function demo(){
  let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;const nr=()=>(r()+r()+r()-1.5)*0.8;
  PROD=[{id:"p1",nome:"João Silva"},{id:"p2",nome:"Marta Oliveira"},{id:"p3",nome:"Agro Cerrado Ltda"}];
  FAZ=[{id:"f1",produtor_id:"p1",nome:"Faz. Boa Vista",municipio:"Rio Verde",uf:"GO",espacamento_cm:50,data_emergencia:"2026-10-30"},
       {id:"f2",produtor_id:"p1",nome:"Faz. Santa Rita",municipio:"Jataí",uf:"GO",espacamento_cm:45,data_emergencia:"2026-11-02"},
       {id:"f3",produtor_id:"p2",nome:"Faz. Primavera",municipio:"Sorriso",uf:"MT",espacamento_cm:50,data_emergencia:"2026-10-25"},
       {id:"f4",produtor_id:"p3",nome:"Faz. Chapadão",municipio:"Luís Eduardo Magalhães",uf:"BA",espacamento_cm:50,data_emergencia:"2026-11-05"}];
  const ST=[["V4",25],["V8",42],["R1",56],["R3",72]],base={V4:[21,38],V8:[39,63],R1:[55,82],R3:[71,92]};
  const ef={Maxcel:[-0.05,0.13],Impulse:[0.01,0.06],"Stay Up":[-0.08,0.04],Controle:[0,0]};
  PL=[];GC=[];let id=0;
  for(const f of FAZ){const p=prodById(f.produtor_id),sh=1+nr()*0.1,sg=1+nr()*0.05,stand=13+nr()*1.5;
    for(const t of TR)for(const[e,d]of ST){const ramp=e==="V4"?0.3:1,[eh,eg]=ef[t].map(x=>x*ramp),[bh,bg]=base[e];
      for(let k=1;k<=NPL;k++)PL.push({id:++id,produtor_id:p.id,produtor:p.nome,fazenda_id:f.id,fazenda:f.nome,municipio:f.municipio,uf:f.uf,espacamento_cm:f.espacamento_cm,
        tratamento:t,estadio:e,dae:d,planta:k,altura_cm:+(bh*sh*(1+eh)*(1+nr()*0.08)).toFixed(1),estande_pl_m:+(stand*(1+nr()*0.06)).toFixed(1)});
      for(let a=1;a<=5;a++)GC.push({id:"g"+id+"-"+a,produtor_id:p.id,produtor:p.nome,fazenda_id:f.id,fazenda:f.nome,tratamento:t,estadio:e,amostra:a,dae:d,cobertura_pct:+Math.min(98,bg*sg*(1+eg)*(1+nr()*0.07)).toFixed(1)})}}
}

/* ====================== conexão e carga ====================== */
async function fetchAll(table){const out=[];for(let i=0;;i+=1000){const{data,error}=await SB.from(table).select("*").range(i,i+999);
  if(error)throw error;out.push(...data);if(data.length<1000)break}return out}
async function loadDB(){
  $("srcNote").textContent="Carregando dados do banco…";
  try{
    [PROD,FAZ,PL,GC,GER]=await Promise.all([SB.from("produtores").select("*").order("nome").then(r=>r.data||[]),
      SB.from("fazendas").select("*").order("nome").then(r=>r.data||[]),fetchAll("v_plantas"),fetchAll("v_cobertura"),
      SB.from("fotos_gerais").select("*").then(r=>r.data||[])]);
    PL.forEach(r=>{r.altura_cm=num(r.altura_cm);r.estande_pl_m=num(r.estande_pl_m);r.espacamento_cm=num(r.espacamento_cm);r.dae=num(r.dae)});
    GC.forEach(r=>{r.cobertura_pct=num(r.cobertura_pct);r.dae=num(r.dae)});
    URL_={};const paths=[...GC,...GER].flatMap(g=>[g.foto_path,g.mapa_path]).filter(Boolean);
    for(let i=0;i<paths.length;i+=100){const{data}=await SB.storage.from("fotos").createSignedUrls(paths.slice(i,i+100),3600);
      (data||[]).forEach((u,k)=>{if(u.signedUrl)URL_[paths[i+k]]=u.signedUrl})}
    $("srcNote").textContent=`Banco Supabase · ${PROD.length} produtor(es) · ${FAZ.length} fazenda(s) · ${PL.length} plantas medidas · ${GC.length} fotos de cobertura`;
  }catch(e){toast("Erro ao ler o banco: "+e.message,1)}
  refreshAll();
}
function refreshAll(){fillSelects();renderPainel();renderFotos();renderCadastro();renderEditar()}

/* ====================== selects ====================== */
const prodOpts=()=>PROD.map(p=>({v:p.id,t:p.nome}));
const fazOpts=pid=>FAZ.filter(f=>!pid||f.produtor_id===pid).map(f=>({v:f.id,t:pid?f.nome:`${prodById(f.produtor_id)?.nome||""} · ${f.nome}`}));
const allStages=()=>ordSt([...PL.map(r=>r.estadio),...GC.map(r=>r.estadio)]);
function fillSelects(){
  setSel($("sP"),opts(prodOpts(),"Todos"));setSel($("sF"),opts(fazOpts($("sP").value),"Todas"));
  const ss=allStages();setSel($("sE"),opts(ss));if(!$("sE").value&&ss.length)$("sE").value=ss.includes("R1")?"R1":ss.at(-1);
  for(const[p,f]of[["uP","uF"],["cP","cF"]]){setSel($(p),opts(prodOpts()));setSel($(f),opts(fazOpts($(p).value)))}
  setSel($("uT"),opts(TR));setSel($("uE"),opts(ORD));if(!$("uE").dataset.init){$("uE").value="V4";$("uE").dataset.init=1}
  const gcs=ordSt(GC.filter(g=>g.fazenda_id===$("cF").value).map(g=>g.estadio));setSel($("cE"),opts(gcs.length?gcs:ORD));
  setSel($("pA"),opts(TR));setSel($("pB"),opts(TR));if(!$("pA").dataset.init){$("pA").value="Maxcel";$("pB").value="Controle";$("pA").dataset.init=1}
  setSel($("dP"),opts(prodOpts()));setSel($("dE"),opts(ORD));if(!$("dE").dataset.init){$("dE").value="V4";$("dE").dataset.init=1}
  setSel($("fzP"),opts(prodOpts()));
}

/* ====================== painel ====================== */
let charts={};
const errPlug={id:"err",afterDatasetsDraw(c){const y=c.scales.y,x=c.ctx;x.save();x.strokeStyle=getComputedStyle(document.body).color;x.lineWidth=1.5;
  c.data.datasets.forEach((ds,di)=>{if(!ds.sd||!c.isDatasetVisible(di))return;const m=c.getDatasetMeta(di),w=Math.min(6,(m.data[0]?.width||12)/3);
    m.data.forEach((b,i)=>{const v=ds.data[i];if(v==null||!ds.sd[i])return;const t=y.getPixelForValue(v+ds.sd[i]),bo=y.getPixelForValue(v-ds.sd[i]);
      x.beginPath();x.moveTo(b.x,t);x.lineTo(b.x,bo);x.moveTo(b.x-w,t);x.lineTo(b.x+w,t);x.moveTo(b.x-w,bo);x.lineTo(b.x+w,bo);x.stroke()})});x.restore()}};
function mk(id,cfg){charts[id]?.destroy();const ink=getComputedStyle(document.body).color,grid=getComputedStyle(document.documentElement).getPropertyValue("--line").trim()||"#ddd";
  Chart.defaults.color=ink;Chart.defaults.font.family="Barlow, system-ui, sans-serif";Chart.defaults.font.size=13;
  for(const s of Object.values(cfg.options.scales||{}))s.grid={color:grid,...(s.grid||{})};
  charts[id]=new Chart($(id),cfg)}
const filtP=a=>{const P=$("sP").value,F=$("sF").value;return a.filter(r=>(!P||r.produtor_id===P)&&(!F||r.fazenda_id===F))};
const meanT=(a,t,k)=>st(a.filter(r=>r.tratamento===t).map(r=>r[k])).m;
const dlt=(a,t,k)=>{const c=meanT(a,"Controle",k);return c?(meanT(a,t,k)/c-1)*100:NaN};
function series(rows,k){/* média por tratamento em cada estádio */
  const ss=ordSt(rows.map(r=>r.estadio)),daeOf={};for(const e of ss)daeOf[e]=st(rows.filter(r=>r.estadio===e).map(r=>r.dae)).m;
  return{ss,daeOf,val:t=>ss.map(e=>{const m=st(rows.filter(r=>r.estadio===e&&r.tratamento===t).map(r=>r[k])).m;return isNaN(m)?null:+m.toFixed(2)})}}
function renderPainel(){
  const pl=filtP(PL),gc=filtP(GC),E=$("sE").value;
  const has=pl.length||gc.length;$("empty").hidden=!!has;$("dash").hidden=!has;if(!has){$("title").textContent="Estruturação de plantas de soja";return}
  const pe=pl.filter(r=>r.estadio===E),ge=gc.filter(r=>r.estadio===E);
  pl.forEach(r=>r.pop_ha=popHa(r.estande_pl_m,r.espacamento_cm));
  const nF=new Set([...pl,...gc].map(r=>r.fazenda_id)).size,nP=new Set([...pl,...gc].map(r=>r.produtor_id)).size;
  $("sub").textContent=`${nP} produtor(es) · ${nF} fazenda(s) · ${ordSt([...pl,...gc].map(r=>r.estadio)).length} estádio(s) avaliados`;
  const dgc=dlt(ge,"Maxcel","cobertura_pct"),dh=dlt(pe,"Maxcel","altura_cm");
  $("title").textContent=!isNaN(dgc)?`Maxcel ${dgc>=0?"fechou":"abriu"} ${fmt(Math.abs(dgc),0)}% ${dgc>=0?"mais":"menos"} a entrelinha que o Controle em ${E}`:
    !isNaN(dh)?`Maxcel com altura ${fmt(Math.abs(dh),0)}% ${dh>=0?"maior":"menor"} que o Controle em ${E}`:"Estruturação de plantas de soja";
  /* KPIs */
  const K=[["Grau de cover (média das amostras)",ge,"cobertura_pct","%",1],["Altura média",pe,"altura_cm","cm",1],["Estande",pe,"estande_pl_m","pl/m",1],["População",pe,"pop_ha","mil pl/ha",0]];
  $("kpis").innerHTML=K.map(([n,a,k,u,d])=>{let m=meanT(a,"Maxcel",k),c=meanT(a,"Controle",k),x=dlt(a,"Maxcel",k);if(k==="pop_ha"){m/=1000;c/=1000}
    return`<div class="k"><div class="l">${n} · Maxcel · ${esc(E)}</div><div class="v">${fmt(m,d)} <span style="font-size:18px">${u}</span></div>
    <div class="d ${cls(x)}">${pct(x)} vs Controle</div><div class="l">Controle: ${fmt(c,d)} ${u}</div></div>`}).join("");
  $("leg1").innerHTML=TR.map(t=>`<span><i style="background:${COL[t]}"></i>${t}</span>`).join("");
  /* altura por planta */
  $("plT").textContent=`Altura por planta em ${E}`;
  const sts=TR.map(t=>st(pe.filter(r=>r.tratamento===t).map(r=>r.altura_cm)));
  const pts=[];const byF=by(pe,r=>r.fazenda_id+"|"+r.planta);for(const[k,a]of Object.entries(byF))pts.push({type:"line",showLine:false,label:"Planta",pointRadius:4,pointBackgroundColor:"#16231acc",pointBorderColor:"#fff",
    data:TR.map(t=>a.find(r=>r.tratamento===t)?.altura_cm??null)});
  mk("cPl",{type:"bar",plugins:[errPlug],data:{labels:TR,datasets:[{data:sts.map(s=>isNaN(s.m)?null:+s.m.toFixed(1)),sd:sts.map(s=>s.sd),backgroundColor:TR.map(t=>COL[t]+"cc"),borderRadius:6,order:2},...pts.map(p=>({...p,order:1}))]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{filter:i=>i.datasetIndex===0,callbacks:{label:c=>`média ${fmt(c.raw)} ± ${fmt(sts[c.dataIndex].sd)} cm (n=${sts[c.dataIndex].n})`}}},
      scales:{x:{grid:{display:false}},y:{beginAtZero:true,title:{display:true,text:"cm"}}}}});
  /* grau de cover por amostra */
  $("gcbT").textContent=`Grau de cover em ${E}`;
  const gs=TR.map(t=>st(ge.filter(r=>r.tratamento===t).map(r=>r.cobertura_pct)));
  const gpts=Object.values(by(ge,r=>r.fazenda_id+"|"+(r.amostra||1))).map(a=>({type:"line",showLine:false,label:"Amostra",pointRadius:4,pointBackgroundColor:"#16231acc",pointBorderColor:"#fff",order:1,
    data:TR.map(t=>a.find(r=>r.tratamento===t)?.cobertura_pct??null)}));
  mk("cGCb",{type:"bar",plugins:[errPlug],data:{labels:TR,datasets:[{data:gs.map(s=>isNaN(s.m)?null:+s.m.toFixed(1)),sd:gs.map(s=>s.sd),backgroundColor:TR.map(t=>COL[t]+"cc"),borderRadius:6,order:2},...gpts]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{filter:i=>i.datasetIndex===0,callbacks:{label:c=>`grau de cover ${fmt(c.raw)}% ± ${fmt(gs[c.dataIndex].sd)} (n=${gs[c.dataIndex].n} amostras)`}}},
      scales:{x:{grid:{display:false}},y:{beginAtZero:true,max:100,title:{display:true,text:"% de fechamento"}}}}});
  /* comparação por local */
  renderLoc(pe,ge,E);
  /* séries */
  const line=(id,rows,k,unit,f=1)=>{const S=series(rows,k);mk(id,{type:"line",data:{labels:S.ss.map(e=>isNaN(S.daeOf[e])?e:`${e} · ${fmt(S.daeOf[e],0)} DAE`),
    datasets:TR.map(t=>({label:t,data:S.val(t).map(v=>v==null?null:v/f),borderColor:COL[t],backgroundColor:COL[t],borderWidth:t==="Maxcel"?3.5:2,pointRadius:4,tension:.3,spanGaps:true}))},
    options:{maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:12}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw,f>1?0:1)} ${unit}`}}},scales:{x:{},y:{beginAtZero:id==="cPop",title:{display:true,text:unit}}}}});return S};
  line("cGC",gc,"cobertura_pct","% cobertura");
  const G=line("cGrow",pl,"altura_cm","cm");
  const hasEsp=pl.some(r=>r.pop_ha);$("popH").textContent=hasEsp?"Plantas por hectare (estande × espaçamento da fazenda)":"Plantas por metro de linha — cadastre o espaçamento da fazenda para ver plantas/ha";
  line("cPop",pl,hasEsp?"pop_ha":"estande_pl_m",hasEsp?"mil pl/ha":"pl/m",hasEsp?1000:1);
  /* taxa de crescimento */
  const rate=t=>{const v=G.val(t),o=[];for(let i=1;i<G.ss.length;i++){const d=G.daeOf[G.ss[i]]-G.daeOf[G.ss[i-1]];o.push(v[i]!=null&&v[i-1]!=null&&d>0?(v[i]-v[i-1])/d:null)}return o};
  $("tabRate").innerHTML=G.ss.length>1?`<tr><th>Taxa de crescimento (cm/dia)</th>${G.ss.slice(1).map((e,i)=>`<th>${esc(G.ss[i])}→${esc(e)}</th>`).join("")}<th>Média</th></tr>`+
    TR.map(t=>{const r=rate(t),m=st(r).m;return`<tr><td><span class="dot" style="background:${COL[t]}"></span>${t}</td>${r.map(x=>`<td>${fmt(x,2)}</td>`).join("")}<td><b>${fmt(m,2)}</b></td></tr>`}).join(""):
    `<tr><td>Envie mais de um estádio para ver a taxa de crescimento.</td></tr>`;
  /* resumo por tratamento */
  $("tabT").textContent=`Resumo por tratamento · ${E}`;$("tabH").textContent="Média ± desvio padrão · Δ% em relação ao Controle · CV% da altura entre plantas";
  const R=[["Grau de cover (%)",ge,"cobertura_pct"],["Altura (cm)",pe,"altura_cm"],["Estande (pl/m)",pe,"estande_pl_m"]];
  $("tab").innerHTML=`<tr><th>Tratamento</th>${R.map(x=>`<th>${x[0]}</th><th>Δ%</th>`).join("")}<th>CV% altura</th><th>Plantas</th></tr>`+TR.map(t=>{
    const a=pe.filter(r=>r.tratamento===t);return`<tr><td><span class="dot" style="background:${COL[t]}"></span>${t}</td>${R.map(([,rows,k])=>{const s=st(rows.filter(r=>r.tratamento===t).map(r=>r[k])),x=dlt(rows,t,k);
      return`<td>${fmt(s.m)}${s.n>1?" ± "+fmt(s.sd):""}</td><td class="${t==="Controle"?"eq":cls(x)}">${t==="Controle"?"—":pct(x)}</td>`}).join("")}<td>${fmt(st(a.map(r=>r.altura_cm)).cv)}</td><td>${a.length}</td></tr>`}).join("");
  /* por fazenda */
  $("tab2H").textContent=`${E} · grau de cover médio (%) e altura média (cm) por tratamento`;
  const fz=ordFaz([...new Set([...pe,...ge].map(r=>r.fazenda_id))]);
  $("tab2").innerHTML=`<tr><th>Produtor · Fazenda</th>${TR.map(t=>`<th><span class="dot" style="background:${COL[t]}"></span>${t}<br><small>GC % · alt. cm</small></th>`).join("")}<th>Maxcel vs Ctrl (GC)</th></tr>`+
    fz.map(id=>{const f=fazById(id),a=pe.filter(r=>r.fazenda_id===id),g=ge.filter(r=>r.fazenda_id===id),x=dlt(g,"Maxcel","cobertura_pct");
      return`<tr><td>${esc(prodById(f?.produtor_id)?.nome||"")} · ${esc(f?.nome||"")}</td>${TR.map(t=>`<td>${fmt(meanT(g,t,"cobertura_pct"))} · ${fmt(meanT(a,t,"altura_cm"))}</td>`).join("")}<td class="${cls(x)}">${pct(x)}</td></tr>`}).join("");
  /* plantas */
  $("tab3H").textContent=`${E} · altura (cm) de cada planta`;
  const pf=by(pe,r=>r.fazenda_id+"|"+r.tratamento);
  $("tab3").innerHTML=`<tr><th>Fazenda</th><th class="tl">Tratamento</th>${Array.from({length:NPL},(_,i)=>`<th>P${i+1}</th>`).join("")}<th>Média</th><th>Estande médio</th></tr>`+
    Object.entries(pf).sort().map(([k,a])=>{const f=fazById(a[0].fazenda_id);return`<tr><td>${esc(f?.nome||"")}</td><td class="tl"><span class="dot" style="background:${COL[a[0].tratamento]}"></span>${esc(a[0].tratamento)}</td>${Array.from({length:NPL},(_,i)=>`<td>${fmt(a.find(r=>r.planta===i+1)?.altura_cm)}</td>`).join("")}<td><b>${fmt(st(a.map(r=>r.altura_cm)).m)}</b></td><td>${fmt(st(a.map(r=>r.estande_pl_m)).m)}</td></tr>`}).join("");
  /* insights */
  const ins=[];
  const rk=TR.map(t=>[t,meanT(ge,t,"cobertura_pct")]).filter(x=>!isNaN(x[1])).sort((a,b)=>b[1]-a[1]);
  if(rk.length)ins.push(`<b>Fechamento de entrelinha em ${esc(E)}</b><br>${rk.map(([t,m],i)=>`${i+1}º ${t} (${fmt(m)}%)`).join(" · ")}`);
  const rh=TR.map(t=>[t,meanT(pe,t,"altura_cm")]).filter(x=>!isNaN(x[1])).sort((a,b)=>b[1]-a[1]);
  if(rh.length)ins.push(`<b>Altura em ${esc(E)}</b><br>${rh.map(([t,m])=>`${t} ${fmt(m)} cm`).join(" · ")}${!isNaN(dh)?` — Maxcel ${pct(dh)} vs Controle.`:""}`);
  if(G.ss.length>1){const rm=TR.map(t=>[t,st(rate(t)).m]).filter(x=>!isNaN(x[1]));if(rm.length){const mx=rm.reduce((a,b)=>b[1]>a[1]?b:a),mn=rm.reduce((a,b)=>b[1]<a[1]?b:a);
    ins.push(`<b>Crescimento</b><br>Maior ritmo: ${mx[0]} (${fmt(mx[1],2)} cm/dia); menor: ${mn[0]} (${fmt(mn[1],2)} cm/dia) entre ${esc(G.ss[0])} e ${esc(G.ss.at(-1))}.`)}}
  const ds=dlt(pe,"Maxcel","estande_pl_m");if(!isNaN(ds))ins.push(`<b>Estande</b><br>Maxcel ${pct(ds)} vs Controle — ${Math.abs(ds)<5?"populações semelhantes; as diferenças vêm da arquitetura, não do número de plantas.":"populações diferentes; considere isso ao comparar cobertura e altura."}`);
  const cvs=TR.map(t=>[t,st(pe.filter(r=>r.tratamento===t).map(r=>r.altura_cm)).cv]).filter(x=>!isNaN(x[1]));
  if(cvs.length){const u=cvs.reduce((a,b)=>b[1]<a[1]?b:a);ins.push(`<b>Uniformidade</b><br>Plantas mais uniformes em ${u[0]} (CV ${fmt(u[1])}% na altura).`)}
  $("ins").innerHTML=ins.map(i=>`<li>${i}</li>`).join("")||"<li>Sem dados suficientes neste estádio.</li>";
}
function renderLoc(pe,ge,E){
  const k=$("locA").value,isGC=k==="cobertura_pct",rows=isGC?ge:pe,f=k==="pop_ha"?1000:1,un={cobertura_pct:"%",altura_cm:"cm",estande_pl_m:"pl/m",pop_ha:"mil pl/ha"}[k];
  $("locT").textContent=`Comparação por local · ${$("locA").selectedOptions[0].text.replace(/ \(.*\)/,"")} · ${E}`;
  const fz=ordFaz([...new Set(rows.map(r=>r.fazenda_id))]),labels=[...fz.map(id=>fazById(id)?.nome||"?"),"Média geral"];
  const S=(a,t)=>st(a.filter(r=>r.tratamento===t).map(r=>r[k]==null?null:r[k]/f));
  const ds=TR.map(t=>{const v=[...fz.map(id=>S(rows.filter(r=>r.fazenda_id===id),t)),S(rows,t)];
    return{label:t,data:v.map(s=>isNaN(s.m)?null:+s.m.toFixed(2)),sd:v.map(s=>s.sd),nn:v.map(s=>s.n),backgroundColor:COL[t]+"cc",borderRadius:4}});
  $("leg2").innerHTML=TR.map(t=>`<span><i style="background:${COL[t]}"></i>${t}</span>`).join("");
  mk("cLoc",{type:"bar",plugins:[errPlug],data:{labels,datasets:ds},options:{maintainAspectRatio:false,plugins:{legend:{display:false},
    tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw,k==="pop_ha"?0:1)} ${un} ± ${fmt(c.dataset.sd[c.dataIndex],1)} (n=${c.dataset.nn[c.dataIndex]})`}}},
    scales:{x:{grid:{display:false}},y:{beginAtZero:true,...(isGC?{max:100}:{}),title:{display:true,text:un}}}}});
  $("tabLoc").innerHTML=`<tr><th>Local</th>${TR.map(t=>`<th><span class="dot" style="background:${COL[t]}"></span>${t}</th>`).join("")}<th>Maxcel vs Ctrl</th></tr>`+
    labels.map((l,i)=>{const c=ds[TR.indexOf("Controle")].data[i],m=ds[TR.indexOf("Maxcel")].data[i],x=c?(m/c-1)*100:NaN;
      return`<tr><td>${i===labels.length-1?"<b>Média geral</b>":esc(l)}</td>${ds.map(d=>`<td>${fmt(d.data[i],k==="pop_ha"?0:1)}${d.nn[i]>1?` ± ${fmt(d.sd[i],1)}`:""}</td>`).join("")}<td class="${cls(x)}">${pct(x)}</td></tr>`}).join("");
}
const ordFaz=ids=>ids.sort((a,b)=>{const fa=fazById(a),fb=fazById(b);return((prodById(fa?.produtor_id)?.nome||"")+(fa?.nome||"")).localeCompare((prodById(fb?.produtor_id)?.nome||"")+(fb?.nome||""))});

/* ====================== falso NDVI (várias amostras) ====================== */
const RAMP=[[-0.2,[165,0,38]],[0,[244,109,67]],[0.08,[254,224,139]],[0.16,[166,217,106]],[0.3,[26,152,80]],[0.45,[0,104,55]]];
const rampAt=v=>{if(v<=RAMP[0][0])return RAMP[0][1];for(let i=1;i<RAMP.length;i++)if(v<=RAMP[i][0]){const[a,ca]=RAMP[i-1],[b,cb]=RAMP[i],t=(v-a)/(b-a);return ca.map((x,j)=>x+(cb[j]-x)*t)}return RAMP.at(-1)[1]};
let SAMP=[];
function analyze(s,lim){
  const max=1200,sc=Math.min(1,max/Math.max(s.img.width,s.img.height)),w=Math.round(s.img.width*sc),h=Math.round(s.img.height*sc);
  const co=s.co,cn=s.cn;co.width=cn.width=w;co.height=cn.height=h;const xo=co.getContext("2d");xo.drawImage(s.img,0,0,w,h);
  const d=xo.getImageData(0,0,w,h).data,out=cn.getContext("2d").createImageData(w,h),o=out.data;let veg=0,sum=0;
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],exg=2*g-r-b,gli=(2*g-r-b)/(2*g+r+b+1e-6);
    const isV=g>0&&r/g<0.95&&b/g<0.95&&exg>lim;if(isV){veg++;sum+=gli}
    const c=rampAt(isV?Math.max(gli,0.12):Math.min(gli,0.06));o[i]=c[0];o[i+1]=c[1];o[i+2]=c[2];o[i+3]=255}
  cn.getContext("2d").putImageData(out,0,0);s.cov=veg/(d.length/4)*100;s.idx=veg?sum/veg:0;s.lim=lim}
function analisarTodas(){const lim=+$("lim").value;$("limOut").textContent=lim;SAMP.forEach(s=>{analyze(s,lim);s.el.querySelector("b").textContent=fmt(s.cov)+"%"});
  const S=st(SAMP.map(s=>s.cov));$("covOut").textContent=fmt(S.m)+"%";$("covSd").textContent=SAMP.length>1?`± ${fmt(S.sd)} (desvio) · CV ${fmt(S.cv)}% · ${SAMP.length} amostras`:"1 amostra"}
const loadImg=f=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=URL.createObjectURL(f)});
const isGeral=()=>$("uK").value==="geral";
$("uK").addEventListener("change",()=>{$("uTw").hidden=isGeral();$("uFl").textContent=isGeral()?"Foto geral (1 foto)":"Fotos (1 a 5)";$("uFile").multiple=!isGeral();
  $("saveFoto").textContent=isGeral()?"Salvar foto geral":"Salvar amostras";$("uFile").value="";SAMP=[];$("samp").innerHTML="";$("anal").hidden=true});
$("uFile").addEventListener("change",async e=>{const lim5=isGeral()?1:5,files=[...e.target.files].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).slice(0,lim5);if(!files.length)return;
  if(e.target.files.length>lim5)toast(isGeral()?"Na foto geral só a primeira foto é usada.":"Só as 5 primeiras fotos foram usadas.",1);
  SAMP=[];$("samp").innerHTML="";
  for(const[i,f]of files.entries()){let img;try{img=await loadImg(f)}catch{toast(`Não consegui abrir ${f.name}.`,1);continue}
    const el=document.createElement("div");el.className="smp";el.innerHTML=`<div class="two"><canvas></canvas><canvas></canvas></div><div class="cap"><label${isGeral()?' hidden':''}>Amostra <select>${[1,2,3,4,5].map(n=>`<option${n===i+1?" selected":""}>${n}</option>`).join("")}</select></label><b>–</b></div><div class="cap" style="padding-top:0"><small>${esc(f.name)}</small></div>`;
    const[co,cn]=el.querySelectorAll("canvas");$("samp").append(el);SAMP.push({file:f,img,el,co,cn,sel:el.querySelector("select")})}
  $("anal").hidden=!SAMP.length;analisarTodas()});
$("lim").addEventListener("input",analisarTodas);
const slug=s=>String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-");
$("saveFoto").addEventListener("click",async()=>{
  if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const fid=$("uF").value,t=$("uT").value,e=$("uE").value,dt=$("uD").value||null;if(!fid||!SAMP.length)return toast("Escolha fazenda, tratamento, estádio e as fotos.",1);
  if(isGeral()){const s=SAMP[0],f=fazById(fid),base=`cobertura/${fid}/${slug(e)}/geral`;$("saveFoto").disabled=true;
    try{const jpg=await new Promise(r=>s.co.toBlob(r,"image/jpeg",0.9)),png=await new Promise(r=>s.cn.toBlob(r,"image/png"));
      for(const[p,b,ct]of[[base+".jpg",jpg,"image/jpeg"],[base+"-ndvi.png",png,"image/png"]]){const{error}=await SB.storage.from("fotos").upload(p,b,{upsert:true,contentType:ct});if(error)throw error}
      const{error}=await SB.from("fotos_gerais").upsert({fazenda_id:fid,estadio:e,data:dt,dae:daysBetween(f?.data_emergencia,dt),foto_path:base+".jpg",mapa_path:base+"-ndvi.png",
        cobertura_pct:+s.cov.toFixed(2),limiar:s.lim,atualizado_em:new Date().toISOString()},{onConflict:"fazenda_id,estadio"});if(error)throw error;
      toast(`Foto geral salva · ${e} · ${fmt(s.cov)}% de cobertura.`);$("uFile").value="";$("anal").hidden=true;SAMP=[];$("samp").innerHTML="";
      const pid=$("uP").value;await loadDB();$("cP").value=pid;setSel($("cF"),opts(fazOpts(pid)));$("cF").value=fid;fillSelects();$("cE").value=e;renderFotos();
    }catch(err){toast("Não foi possível salvar: "+err.message,1)}finally{$("saveFoto").disabled=false}return}
  const nums=SAMP.map(s=>+s.sel.value);if(new Set(nums).size!==nums.length)return toast("Duas fotos estão com o mesmo número de amostra.",1);
  const f=fazById(fid),trId=TR.indexOf(t)+1;$("saveFoto").disabled=true;
  try{for(const s of SAMP){const a=+s.sel.value,base=`cobertura/${fid}/${slug(e)}/${slug(t)}-a${a}`;
      const jpg=await new Promise(r=>s.co.toBlob(r,"image/jpeg",0.88)),png=await new Promise(r=>s.cn.toBlob(r,"image/png"));
      for(const[p,b,ct]of[[base+".jpg",jpg,"image/jpeg"],[base+"-ndvi.png",png,"image/png"]]){const{error}=await SB.storage.from("fotos").upload(p,b,{upsert:true,contentType:ct});if(error)throw error}
      const{error}=await SB.from("fotos_cobertura").upsert({fazenda_id:fid,tratamento_id:trId,estadio:e,amostra:a,data:dt,dae:daysBetween(f?.data_emergencia,dt),foto_path:base+".jpg",mapa_path:base+"-ndvi.png",
        cobertura_pct:+s.cov.toFixed(2),indice_medio:+s.idx.toFixed(4),limiar:s.lim,atualizado_em:new Date().toISOString()},{onConflict:"fazenda_id,tratamento_id,estadio,amostra"});if(error)throw error}
    toast(`Salvo: ${t} · ${e} · ${SAMP.length} amostra(s) · grau de cover ${$("covOut").textContent}.`);$("uFile").value="";$("anal").hidden=true;SAMP=[];$("samp").innerHTML="";
    const pid=$("uP").value;await loadDB();$("cP").value=pid;setSel($("cF"),opts(fazOpts(pid)));$("cF").value=fid;fillSelects();$("cE").value=e;renderFotos();
  }catch(err){toast("Não foi possível salvar: "+err.message,1)}finally{$("saveFoto").disabled=false}});

/* ====================== comparação de fotos ====================== */
function canopy(gc,seed){let s=seed;const r=()=>(s=(s*16807)%2147483647)/2147483647;const cov=Math.min(.99,(gc||0)/100),rows=4,lw=100/rows,lv=[];
  for(let i=0;i<rows;i++){const cx=lw*(i+.5),half=lw/2*cov,n=Math.round(120+cov*260);for(let k=0;k<n;k++){const y=r()*104-2,x=cx+(r()*2-1)*half,rr=1.4+r()*2.2;
    lv.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr*.7).toFixed(1)}" fill="${["#2f7d32","#3b8f3c","#256b2b","#4aa04a"][Math.floor(r()*4)]}"/>`)}}
  return`<svg viewBox="0 0 100 75" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#7a5a3c"/>${lv.join("")}</svg>`}
const gcRows=t=>GC.filter(r=>r.fazenda_id===$("cF").value&&r.estadio===$("cE").value&&r.tratamento===t);
function imgOf(g,mode){if(!g)return null;const u=URL_[mode==="mapa"?g.mapa_path:g.foto_path];
  return u?`<img src="${esc(u)}" alt="" loading="lazy">`:canopy(g.cobertura_pct,(g.amostra||1)*131+[...g.tratamento+g.estadio].reduce((s,c)=>s+c.charCodeAt(0),11)*97)}
const selTR=()=>[...$("trSel").querySelectorAll("input:checked")].map(i=>i.value);
function renderTrSel(){if($("trSel").childElementCount)return;
  $("trSel").innerHTML=TR.map(t=>`<label><input type="checkbox" value="${esc(t)}" checked><span class="dot" style="background:${COL[t]}"></span>${esc(t)}</label>`).join("")+`<button class="mini" type="button" id="trAll">Todos os tratamentos</button>`;
  $("trSel").addEventListener("change",renderFotos);$("trAll").onclick=()=>{$("trSel").querySelectorAll("input").forEach(i=>i.checked=true);renderFotos()}}
function renderFotos(){
  renderTrSel();const mode=$("cMode").value,ts=selTR();
  const G=GER.find(g=>g.fazenda_id===$("cF").value&&g.estadio===$("cE").value),gu=G&&URL_[mode==="mapa"?G.mapa_path:G.foto_path];
  const all=GC.filter(r=>r.fazenda_id===$("cF").value&&r.estadio===$("cE").value),ms=st(all.map(r=>r.cobertura_pct));
  $("geral").hidden=!G;if(G)$("geral").innerHTML=`<div class="gcap"><h3>Foto geral · todas as parcelas</h3><span>cobertura na foto geral <b>${fmt(G.cobertura_pct)}%</b></span>${ms.n?`<span>média das amostras de todos os tratamentos <b>${fmt(ms.m)}%</b></span>`:""}</div>
    ${gu?`<div class="gimg" data-geral="1"><img src="${esc(gu)}" alt="Foto geral"></div>`:""}`;$("bigGrid").style.setProperty("--n",Math.max(ts.length,1));
  const nA=Math.max(5,...GC.filter(r=>r.fazenda_id===$("cF").value&&r.estadio===$("cE").value).map(r=>r.amostra||1));
  let h=ts.map(t=>{const S=st(gcRows(t).map(r=>r.cobertura_pct));return`<div class="hd" style="background:${COL[t]}"><span>${esc(t)}</span><b>${isNaN(S.m)?"–":fmt(S.m)+"%"}</b><span>${S.n?`grau de cover · ${S.n} amostra(s)${S.n>1?` · ± ${fmt(S.sd)}`:""}`:"sem fotos"}</span></div>`}).join("");
  for(let a=1;a<=nA;a++)h+=ts.map(t=>{const g=gcRows(t).find(r=>(r.amostra||1)===a),im=imgOf(g,mode);
    return im?`<button type="button" class="cell" data-t="${esc(t)}" data-a="${a}">${im}<span class="bd">A${a} · ${fmt(g.cobertura_pct)}%</span></button>`:`<div class="cell" style="cursor:default"><span class="nf">${esc(t)} · amostra ${a}: sem foto</span></div>`}).join("");
  $("bigGrid").innerHTML=h;
  const pm=$("pMode").value,a=+$("pS").value,A=$("pA").value,B=$("pB").value,gA=gcRows(A).find(r=>(r.amostra||1)===a),gB=gcRows(B).find(r=>(r.amostra||1)===a);
  const nf=t=>`<div style="display:grid;place-items:center;color:#fff;height:100%">${esc(t)} · amostra ${a}: sem foto</div>`;
  $("lyA").innerHTML=imgOf(gA,pm==="mapa"?"mapa":"foto")||nf(A);$("lyB").innerHTML=imgOf(gB,pm==="foto"?"foto":"mapa")||nf(B);
  $("tgA").textContent=`${A}${gA?` · ${fmt(gA.cobertura_pct)}%`:""}`;$("tgA").style.background=COL[A];$("tgB").textContent=`${B}${gB?` · ${fmt(gB.cobertura_pct)}%`:""}`;$("tgB").style.background=COL[B];slide();
}
const slide=()=>{const v=$("rg").value;$("lyA").style.clipPath=`inset(0 ${100-v}% 0 0)`;$("hand").style.left=v+"%"};
$("bigGrid").addEventListener("click",e=>{const c=e.target.closest(".cell[data-t]");if(!c)return;const g=gcRows(c.dataset.t).find(r=>(r.amostra||1)===+c.dataset.a);
  const u=URL_[$("cMode").value==="mapa"?g.mapa_path:g.foto_path];if(!u)return;$("lbImg").src=u;$("lbCap").textContent=`${g.tratamento} · amostra ${g.amostra||1} · ${g.estadio} · grau de cover ${fmt(g.cobertura_pct)}%`;$("lb").hidden=false});
$("geral").addEventListener("click",e=>{if(!e.target.closest("[data-geral]"))return;$("lbImg").src=e.target.closest("[data-geral]").querySelector("img").src;$("lbCap").textContent="Foto geral · todas as parcelas";$("lb").hidden=false});
$("lb").addEventListener("click",()=>{$("lb").hidden=true;$("lbImg").src=""});

/* ====================== planilha base ====================== */
$("dlForm").addEventListener("submit",e=>{e.preventDefault();const pid=$("dP").value,E=$("dE").value,D=$("dD").value;const p=prodById(pid);
  const fz=FAZ.filter(f=>f.produtor_id===pid);if(!fz.length)return toast("Cadastre ao menos uma fazenda para este produtor.",1);
  const H=["Produtor","Fazenda","Tratamento","Estadio","Data","DAE","Planta","Altura_cm","Estande_pl_m","Observacoes"],rows=[H];
  for(const f of fz)for(const t of TR)for(let k=1;k<=NPL;k++){const ex=PL.find(r=>r.fazenda_id===f.id&&r.tratamento===t&&r.estadio===E&&r.planta===k);
    rows.push([p.nome,f.nome,t,E,D||"",daysBetween(f.data_emergencia,D)??"",k,ex?.altura_cm??"",ex?.estande_pl_m??"",""])}
  const ws=XLSX.utils.aoa_to_sheet(rows);ws["!cols"]=[22,22,12,9,12,6,7,11,13,30].map(w=>({wch:w}));ws["!autofilter"]={ref:`A1:J${rows.length}`};
  const ins=XLSX.utils.aoa_to_sheet([["Planilha base — Projeto Estruturação de Plantas (Grower)"],[""],["Produtor",p.nome],["Estádio",E],["Data",D||"(preencher na coluna Data)"],[""],
    ["Como preencher"],["• Cada linha é uma planta. São 5 plantas por tratamento em cada fazenda."],["• Altura_cm: altura da planta, do solo ao ápice, em centímetros."],
    ["• Estande_pl_m: plantas por metro de linha contadas no ponto daquela planta (5 pontos por tratamento)."],["• Não altere as colunas Produtor, Fazenda, Tratamento e Planta."],
    ["• DAE é calculado pela data de emergência cadastrada; pode ser preenchido à mão."],["• Linhas sem altura e sem estande são ignoradas no envio."],[""],["Fazendas"],["Fazenda","Município","UF","Espaçamento (cm)","Emergência"],
    ...fz.map(f=>[f.nome,f.municipio||"",f.uf||"",f.espacamento_cm??"",f.data_emergencia||""])]);ins["!cols"]=[{wch:30},{wch:28},{wch:6},{wch:16},{wch:12}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Avaliacao");XLSX.utils.book_append_sheet(wb,ins,"Instrucoes");
  XLSX.writeFile(wb,`Planilha_${slug(p.nome)}_${E}${D?"_"+D:""}.xlsx`);toast("Planilha gerada.")});
$("fx").addEventListener("change",async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;
  if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  try{const wb=XLSX.read(await f.arrayBuffer(),{type:"array",cellDates:true});const sh=wb.Sheets["Avaliacao"]||wb.Sheets[wb.SheetNames[0]];
    const raw=XLSX.utils.sheet_to_json(sh,{defval:"",raw:true});const REQ=["Produtor","Fazenda","Tratamento","Estadio","Planta"],bad=[],rows=[];
    raw.forEach((r0,i)=>{const r={};for(const[k,v]of Object.entries(r0))r[String(k).trim()]=v instanceof Date?isoDate(v):typeof v==="string"?v.trim():v;
      r.Altura_cm=num(r.Altura_cm);r.Estande_pl_m=num(r.Estande_pl_m);if(r.Altura_cm==null&&r.Estande_pl_m==null)return;
      const miss=REQ.filter(k=>r[k]===""||r[k]==null);if(miss.length)return bad.push(`linha ${i+2}: falta ${miss.join(", ")}`);
      if(r.Altura_cm!=null&&(r.Altura_cm<=0||r.Altura_cm>250))bad.push(`linha ${i+2}: altura ${r.Altura_cm} cm fora do esperado`);
      rows.push({Produtor:String(r.Produtor),Fazenda:String(r.Fazenda),Tratamento:String(r.Tratamento),Estadio:String(r.Estadio),Data:isoDate(r.Data),DAE:num(r.DAE),
        Planta:num(r.Planta),Altura_cm:r.Altura_cm,Estande_pl_m:r.Estande_pl_m,Observacoes:r.Observacoes||""})});
    if(bad.length)return $("sendRes").innerHTML=`<b style="color:#c0392b">Corrija antes de enviar:</b><br>${bad.slice(0,8).map(esc).join("<br>")}`;
    if(!rows.length)return toast("Nenhuma linha com altura ou estande preenchidos.",1);
    $("sendRes").textContent=`Enviando ${rows.length} plantas…`;let n=0;
    for(let i=0;i<rows.length;i+=400){const{data,error}=await SB.rpc("importar_plantas",{linhas:rows.slice(i,i+400)});if(error)throw error;n+=data}
    $("sendRes").textContent=`Pronto: ${n} plantas gravadas.`;toast(`${n} plantas gravadas.`);await loadDB();
  }catch(err){$("sendRes").innerHTML=`<b style="color:#c0392b">Envio interrompido:</b> ${esc(err.message)}`}});

/* ====================== edição on-line ====================== */
const trOrd=t=>TR.indexOf(t);
function fillEditSel(){setSel($("eP"),opts(prodOpts(),"Todos"));setSel($("eF"),opts(fazOpts($("eP").value),"Todas"));
  const ss=ordSt([...PL.map(r=>r.estadio),...GC.map(r=>r.estadio)]);setSel($("eE"),opts(ORD.filter(e=>ss.includes(e)).concat(ORD.filter(e=>!ss.includes(e))),"Todos"));
  if(!$("eE").dataset.init&&ss.length){$("eE").value=$("sE").value||ss.at(-1);$("eE").dataset.init=1}}
const edRows=()=>{const P=$("eP").value,F=$("eF").value,E=$("eE").value;
  return PL.filter(r=>(!P||r.produtor_id===P)&&(!F||r.fazenda_id===F)&&(!E||r.estadio===E)).sort((a,b)=>(a.produtor+a.fazenda).localeCompare(b.produtor+b.fazenda)||ORD.indexOf(a.estadio)-ORD.indexOf(b.estadio)||trOrd(a.tratamento)-trOrd(b.tratamento)||a.planta-b.planta)};
function renderEditar(){
  fillEditSel();const adm=PAPEL==="admin",rows=edRows();
  $("edPl").innerHTML=`<tr><th>Fazenda</th><th class="tl">Estádio</th><th class="tl">Tratamento</th><th>Planta</th><th>Altura (cm)</th><th>Estande (pl/m)</th><th class="tl">Data</th><th>DAE</th><th class="tl">Observações</th>${adm?"<th></th>":""}</tr>`+
    (rows.length?rows.map(r=>`<tr data-id="${esc(r.id)}"><td>${esc(r.fazenda)}</td><td class="tl">${esc(r.estadio)}</td><td class="tl"><span class="dot" style="background:${COL[r.tratamento]}"></span>${esc(r.tratamento)}</td><td>${r.planta}</td>
      <td><input type="number" step="0.1" min="0" max="250" data-k="altura_cm" value="${r.altura_cm??""}"></td><td><input type="number" step="0.1" min="0" max="99" data-k="estande_pl_m" value="${r.estande_pl_m??""}"></td>
      <td class="tl"><input type="date" data-k="data" value="${esc(r.data||"")}"></td><td>${r.dae??"–"}</td><td class="tl"><input type="text" data-k="observacoes" value="${esc(r.observacoes||"")}"></td>
      ${adm?`<td><button class="mini" type="button" data-delpl="${esc(r.id)}">Excluir</button></td>`:""}</tr>`).join(""):`<tr><td colspan="10">Nenhuma planta neste filtro. Escolha fazenda e estádio e use “Criar linhas vazias”, ou envie a planilha.</td></tr>`);
  $("edInfo").textContent=`${rows.length} planta(s)`;$("edSave").disabled=true;
  const P=$("eP").value,F=$("eF").value,E=$("eE").value,g=GC.filter(r=>(!P||r.produtor_id===P)&&(!F||r.fazenda_id===F)&&(!E||r.estadio===E)).sort((a,b)=>a.fazenda.localeCompare(b.fazenda)||ORD.indexOf(a.estadio)-ORD.indexOf(b.estadio)||trOrd(a.tratamento)-trOrd(b.tratamento)||(a.amostra||1)-(b.amostra||1));
  const gg=GER.filter(r=>(!F||r.fazenda_id===F)&&(!P||fazById(r.fazenda_id)?.produtor_id===P)&&(!E||r.estadio===E));
  $("edGc").innerHTML=`<tr><th>Foto</th><th class="tl">Fazenda</th><th class="tl">Estádio</th><th class="tl">Tratamento</th><th>Amostra</th><th>Grau de cover</th><th class="tl">Data</th><th></th></tr>`+
    [...gg.map(r=>({...r,geral:1,tratamento:"Foto geral",fazenda:fazById(r.fazenda_id)?.nome||""})),...g].map(r=>`<tr data-gid="${esc(r.id)}" data-geral="${r.geral?1:""}"><td>${URL_[r.foto_path]?`<img class="thumb" src="${esc(URL_[r.foto_path])}" alt="">`:"–"}</td><td class="tl">${esc(r.fazenda)}</td><td class="tl">${esc(r.estadio)}</td>
      <td class="tl">${r.geral?"<b>Foto geral</b>":`<span class="dot" style="background:${COL[r.tratamento]}"></span>${esc(r.tratamento)}`}</td><td>${r.geral?"–":r.amostra||1}</td><td>${fmt(r.cobertura_pct)}%</td>
      <td class="tl"><input type="date" data-gk="data" value="${esc(r.data||"")}"></td><td>${adm?`<button class="mini" type="button" data-delgc="${esc(r.id)}">Excluir</button>`:""}</td></tr>`).join("")||`<tr><td colspan="8">Nenhuma foto neste filtro.</td></tr>`;
}
$("edPl").addEventListener("input",e=>{const tr=e.target.closest("tr[data-id]");if(!tr)return;tr.classList.add("dirty");
  const v=e.target.dataset.k==="altura_cm"?num(e.target.value):null;e.target.classList.toggle("err",v!=null&&(v<=0||v>250));
  const n=$("edPl").querySelectorAll("tr.dirty").length;$("edSave").disabled=!n;$("edInfo").textContent=`${n} linha(s) alterada(s)`});
$("edUndo").onclick=renderEditar;
$("edSave").onclick=async()=>{if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const trs=[...$("edPl").querySelectorAll("tr.dirty")];if($("edPl").querySelector("input.err"))return toast("Há altura fora do esperado (0 a 250 cm).",1);
  $("edSave").disabled=true;let ok=0;
  try{for(const tr of trs){const r=PL.find(x=>String(x.id)===tr.dataset.id),v={};tr.querySelectorAll("input").forEach(i=>v[i.dataset.k]=i.value);
      const up={altura_cm:num(v.altura_cm),estande_pl_m:num(v.estande_pl_m),data:v.data||null,observacoes:v.observacoes||null,dae:v.data?daysBetween(fazById(r.fazenda_id)?.data_emergencia,v.data)??r.dae:r.dae,atualizado_em:new Date().toISOString()};
      const{error}=await SB.from("plantas").update(up).eq("id",r.id);if(error)throw error;ok++}
    toast(`${ok} linha(s) salva(s).`);await loadDB();
  }catch(err){toast(`Salvei ${ok} linha(s); erro: ${err.message}`,1);$("edSave").disabled=false}};
$("edGen").onclick=async()=>{if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const F=$("eF").value,E=$("eE").value;if(!F||!E)return toast("Escolha uma fazenda e um estádio.",1);
  const rows=[];for(const[i,t]of TR.entries())for(let k=1;k<=NPL;k++)rows.push({fazenda_id:F,tratamento_id:i+1,estadio:E,planta:k});
  const{error}=await SB.from("plantas").upsert(rows,{onConflict:"fazenda_id,tratamento_id,estadio,planta",ignoreDuplicates:true});if(error)return toast(error.message,1);
  toast("Linhas criadas. Preencha e salve.");await loadDB()};
$("edPl").addEventListener("click",async e=>{const b=e.target.closest("[data-delpl]");if(!b)return;if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Confirmar";return}
  if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);const{error}=await SB.from("plantas").delete().eq("id",b.dataset.delpl);if(error)return toast(error.message,1);toast("Planta excluída.");await loadDB()});
$("edGc").addEventListener("change",async e=>{const tr=e.target.closest("tr[data-gid]");if(!tr||e.target.dataset.gk!=="data")return;if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const geral=!!tr.dataset.geral,r=(geral?GER:GC).find(x=>String(x.id)===tr.dataset.gid),dt=e.target.value||null;
  const{error}=await SB.from(geral?"fotos_gerais":"fotos_cobertura").update({data:dt,dae:daysBetween(fazById(r.fazenda_id)?.data_emergencia,dt),atualizado_em:new Date().toISOString()}).eq("id",r.id);
  if(error)return toast(error.message,1);toast("Data atualizada.");await loadDB()});
$("edGc").addEventListener("click",async e=>{const b=e.target.closest("[data-delgc]");if(!b)return;if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Confirmar exclusão";return}
  if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const tr=b.closest("tr"),geral=!!tr.dataset.geral,r=(geral?GER:GC).find(x=>String(x.id)===b.dataset.delgc);
  const{error}=await SB.from(geral?"fotos_gerais":"fotos_cobertura").delete().eq("id",r.id);if(error)return toast(error.message,1);
  await SB.storage.from("fotos").remove([r.foto_path,r.mapa_path].filter(Boolean));toast("Foto excluída.");await loadDB()});
$("eP").addEventListener("change",()=>{setSel($("eF"),opts(fazOpts($("eP").value),"Todas"));renderEditar()});
for(const id of["eF","eE"])$(id).addEventListener("change",renderEditar);

/* ====================== cadastro ====================== */
function renderCadastro(){
  const ro=PAPEL==="leitor";
  $("prTab").innerHTML="<tr><th>Produtor</th><th class='tl'>Fazendas</th><th></th></tr>"+PROD.map(p=>`<tr><td>${esc(p.nome)}${p.contato?`<br><small>${esc(p.contato)}</small>`:""}</td><td class="tl">${FAZ.filter(f=>f.produtor_id===p.id).length}</td><td>${ro?"":`<button class="mini" data-pr="${esc(p.id)}" type="button">Editar</button>`}</td></tr>`).join("");
  $("fzTab").innerHTML="<tr><th>Fazenda</th><th class='tl'>Produtor</th><th class='tl'>Local</th><th>Esp.</th><th>Emerg.</th><th></th></tr>"+FAZ.map(f=>`<tr><td>${esc(f.nome)}</td><td class="tl">${esc(prodById(f.produtor_id)?.nome||"")}</td><td class="tl">${esc([f.municipio,f.uf].filter(Boolean).join("/"))}</td><td>${f.espacamento_cm??"–"}</td><td>${f.data_emergencia?esc(new Date(f.data_emergencia+"T12:00").toLocaleDateString("pt-BR")):"–"}</td><td>${ro?"":`<button class="mini" data-fz="${esc(f.id)}" type="button">Editar</button>`}</td></tr>`).join("");
}
$("prTab").addEventListener("click",e=>{const p=prodById(e.target.dataset?.pr);if(!p)return;$("prId").value=p.id;$("prNome").value=p.nome;$("prCont").value=p.contato||"";$("prNome").focus()});
$("fzTab").addEventListener("click",e=>{const f=fazById(e.target.dataset?.fz);if(!f)return;$("fzId").value=f.id;$("fzP").value=f.produtor_id;$("fzNome").value=f.nome;$("fzMun").value=f.municipio||"";$("fzUF").value=f.uf||"";
  $("fzCult").value=f.cultivar||"";$("fzSem").value=f.data_semeadura||"";$("fzEme").value=f.data_emergencia||"";$("fzEsp").value=f.espacamento_cm??"";$("fzNome").focus()});
$("prodForm").addEventListener("submit",async e=>{e.preventDefault();if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const row={nome:$("prNome").value.trim(),contato:$("prCont").value.trim()||null},id=$("prId").value;
  const{error}=id?await SB.from("produtores").update(row).eq("id",id):await SB.from("produtores").insert(row);
  if(error)return toast(/duplicate/i.test(error.message)?"Já existe um produtor com esse nome.":error.message,1);toast("Produtor salvo.");e.target.reset();$("prId").value="";await loadDB()});
$("fazForm").addEventListener("submit",async e=>{e.preventDefault();if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const row={produtor_id:$("fzP").value,nome:$("fzNome").value.trim(),municipio:$("fzMun").value.trim()||null,uf:$("fzUF").value.trim().toUpperCase()||null,cultivar:$("fzCult").value.trim()||null,
    data_semeadura:$("fzSem").value||null,data_emergencia:$("fzEme").value||null,espacamento_cm:num($("fzEsp").value)},id=$("fzId").value;
  const{error}=id?await SB.from("fazendas").update(row).eq("id",id):await SB.from("fazendas").insert(row);
  if(error)return toast(/duplicate/i.test(error.message)?"Este produtor já tem uma fazenda com esse nome.":error.message,1);toast("Fazenda salva.");e.target.reset();$("fzId").value="";await loadDB()});

/* ====================== equipe (admin) ====================== */
async function adminCall(body){const{data,error}=await SB.functions.invoke("gerenciar-usuario",{body});
  if(error){let m=error.message;try{const j=await error.context.json();m=j.erro||m}catch{}throw new Error(m)}if(data?.erro)throw new Error(data.erro);return data}
async function loadMembers(){const{data,error}=await SB.from("membros").select("*").order("papel").order("email");if(error)return;
  $("mTab").innerHTML="<tr><th>E-mail</th><th class='tl'>Nome</th><th class='tl'>Papel</th><th></th></tr>"+data.map(m=>
    `<tr><td>${esc(m.email)}</td><td class="tl">${esc(m.nome)}</td><td class="tl">${esc(m.papel)}</td><td><button class="mini" data-edit="${esc(m.email)}" data-nome="${esc(m.nome)}" data-papel="${esc(m.papel)}" type="button">Editar</button><button class="mini" data-del="${esc(m.email)}" type="button">Remover</button></td></tr>`).join("")}
$("addMember").addEventListener("submit",async e=>{e.preventDefault();$("mSave").disabled=true;
  try{const senha=$("mSenha").value;await adminCall({acao:"salvar",email:$("mEmail").value.trim().toLowerCase(),nome:$("mNome").value.trim(),papel:$("mPapel").value,senha:senha||null});
    toast(senha?"Usuário salvo com a senha definida. Envie a senha para a pessoa por um canal seguro.":"Usuário atualizado.");e.target.reset();loadMembers()}
  catch(err){toast(err.message,1)}finally{$("mSave").disabled=false}});
$("mTab").addEventListener("click",async e=>{const b=e.target;
  if(b.dataset?.edit){$("mEmail").value=b.dataset.edit;$("mNome").value=b.dataset.nome||"";$("mPapel").value=b.dataset.papel;$("mSenha").value="";$("mSenha").focus();return}
  const em=b.dataset?.del;if(!em)return;if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Confirmar remoção";return}
  try{await adminCall({acao:"remover",email:em});toast("Usuário removido.");loadMembers()}catch(err){toast(err.message,1)}});

/* ====================== navegação, login ====================== */
const show=gate=>{$("gate").hidden=!gate;$("app").hidden=gate;$("actions").hidden=gate};
document.querySelector(".tabs").addEventListener("click",e=>{const t=e.target.dataset?.tab;if(!t)return;
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===t));
  document.querySelectorAll(".tab").forEach(s=>s.hidden=s.id!=="tab-"+t);if(t==="painel")renderPainel();if(t==="fotos")renderFotos();if(t==="editar")renderEditar()});
async function boot(){
  if(MODE==="demo")return;
  if(!SB){$("gateMsg").textContent="O banco ainda não foi configurado (config.js). Você pode ver a prévia com dados de exemplo.";$("loginForm").hidden=true;show(true);return}
  const{data:{session}}=await SB.auth.getSession();if(!session){show(true);$("who").textContent="";return}
  const{data:papel}=await SB.rpc("papel_atual");PAPEL=papel;$("who").textContent=session.user.email+(papel?` · ${papel}`:"");
  if(!papel){show(true);$("loginForm").hidden=true;$("gateMsg").innerHTML=`O e-mail <b>${esc(session.user.email)}</b> ainda não foi autorizado. Fale com a administradora.`;
    $("demoBtn").textContent="Sair";$("demoBtn").onclick=()=>SB.auth.signOut().then(()=>location.reload());return}
  document.body.classList.toggle("ro",papel==="leitor");$("tabEquipe").hidden=papel!=="admin";if(papel==="admin")loadMembers();
  show(false);await loadDB();
}
const ptErr=m=>/Invalid login/i.test(m)?"E-mail ou senha incorretos.":/rate limit/i.test(m)?"Muitas tentativas. Aguarde alguns minutos.":m;
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!SB)return;$("sendLink").disabled=true;
  const{error}=await SB.auth.signInWithPassword({email:$("email").value.trim().toLowerCase(),password:$("pass").value});$("sendLink").disabled=false;if(error)toast(ptErr(error.message),1)});
$("demoBtn").onclick=()=>{MODE="demo";PAPEL="admin";demo();show(false);$("reload").hidden=true;$("logout").textContent="Voltar ao login";
  $("srcNote").textContent="Dados fictícios de demonstração — nada aqui é salvo.";refreshAll()};
$("logout").onclick=async()=>{if(MODE!=="demo"&&SB)await SB.auth.signOut();location.reload()};
$("reload").onclick=()=>loadDB();
SB?.auth.onAuthStateChange(ev=>{if(ev==="SIGNED_IN"&&$("app").hidden&&MODE!=="demo")setTimeout(boot,0)});
$("sP").addEventListener("change",()=>{setSel($("sF"),opts(fazOpts($("sP").value),"Todas"));renderPainel()});
for(const id of["sF","sE","locA"])$(id).addEventListener("change",renderPainel);
$("uP").addEventListener("change",()=>setSel($("uF"),opts(fazOpts($("uP").value))));
$("cP").addEventListener("change",()=>{setSel($("cF"),opts(fazOpts($("cP").value)));fillSelects();renderFotos()});
$("cF").addEventListener("change",()=>{fillSelects();renderFotos()});
for(const id of["cE","cMode","pA","pB","pS","pMode"])$(id).addEventListener("change",renderFotos);
$("rg").addEventListener("input",slide);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",renderPainel);
boot();
}
