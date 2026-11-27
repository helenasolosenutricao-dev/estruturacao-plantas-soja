{
/* ====================== constantes e utilidades ====================== */
const TR=["Maxcel","Stay Up","Controle"];
/* ids fixos da tabela tratamentos */
const TRID={"Maxcel":1,"Stay Up":3,"Controle":4},TRNOME=Object.fromEntries(Object.entries(TRID).map(([k,v])=>[v,k]));
const COL={"Maxcel":"#1e8a42","Stay Up":"#7b3fa0","Controle":"#e67e22"};
const ORD=["VE","VC","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10","R1","R2","R3","R4","R5","R6","R7","R8"];
const NPL=5,NPT=3,NFT=3;
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
let PROD=[],FAZ=[],PL=[],GC=[],GER=[],PF=[],FC=[],URL_={};
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
  const ef={Maxcel:[-0.05,0.13],"Stay Up":[-0.08,0.04],Controle:[0,0]};
  PL=[];GC=[];let id=0;
  for(const f of FAZ){const p=prodById(f.produtor_id),sh=1+nr()*0.1,sg=1+nr()*0.05,stand=13+nr()*1.5;
    for(const t of TR)for(const[e,d]of ST){const ramp=e==="V4"?0.3:1,[eh,eg]=ef[t].map(x=>x*ramp),[bh,bg]=base[e];
      for(let pt=1;pt<=NPT;pt++){const ps=1+nr()*0.04;for(let k=1;k<=NPL;k++)PL.push({id:++id,produtor_id:p.id,produtor:p.nome,fazenda_id:f.id,fazenda:f.nome,municipio:f.municipio,uf:f.uf,espacamento_cm:f.espacamento_cm,
        tratamento:t,estadio:e,dae:d,ponto:pt,planta:k,altura_cm:+(bh*sh*ps*(1+eh)*(1+nr()*0.08)).toFixed(1),estande_pl_m:Math.max(6,Math.round(stand*ps*(1+nr()*0.15)))})}
      for(let a=1;a<=NPT;a++)for(let fo=1;fo<=NFT;fo++)GC.push({id:"g"+id+"-"+a+"-"+fo,foto:fo,arquivo:`P${a}_foto${fo}.jpg`,produtor_id:p.id,produtor:p.nome,fazenda_id:f.id,fazenda:f.nome,tratamento:t,estadio:e,amostra:a,dae:d,cobertura_pct:+Math.min(98,bg*sg*(1+eg)*(1+nr()*0.07)).toFixed(1)})}}
}

/* ====================== conexão e carga ====================== */
async function fetchAll(table){const out=[];for(let i=0;;i+=1000){const{data,error}=await SB.from(table).select("*").range(i,i+999);
  if(error)throw error;out.push(...data);if(data.length<1000)break}return out}
async function loadDB(){
  $("srcNote").textContent="Carregando dados do banco…";
  try{
    [PROD,FAZ,PL,GC,GER,PF,FC]=await Promise.all([SB.from("produtores").select("*").order("nome").then(r=>r.data||[]),
      SB.from("fazendas").select("*").order("nome").then(r=>r.data||[]),fetchAll("v_plantas"),fetchAll("v_cobertura"),
      SB.from("fotos_gerais").select("*").then(r=>r.data||[]),SB.from("fotos_plantas").select("*").then(r=>r.data||[]),SB.from("fotos_comparacao").select("*").then(r=>r.data||[])]);
    PF.forEach(r=>{const f=fazById(r.fazenda_id);r.tratamento=TRNOME[r.tratamento_id];r.fazenda=f?.nome||"";r.produtor_id=f?.produtor_id});
    FC.forEach(r=>{const f=fazById(r.fazenda_id);r.tratamento=TRNOME[r.tratamento_id];r.fazenda=f?.nome||"";r.produtor_id=f?.produtor_id});
    {const ok=r=>TR.includes(r.tratamento);PL=PL.filter(ok);GC=GC.filter(ok);PF=PF.filter(ok);FC=FC.filter(ok)}
    PL.forEach(r=>{r.ponto=num(r.ponto)??1;r.altura_cm=num(r.altura_cm);r.estande_pl_m=num(r.estande_pl_m);r.espacamento_cm=num(r.espacamento_cm);r.dae=num(r.dae)});
    GC.forEach(r=>{r.cobertura_pct=num(r.cobertura_pct);r.dae=num(r.dae)});
    URL_={};const paths=[...GC,...GER,...PF,...FC].flatMap(g=>[g.foto_path,g.mapa_path]).filter(Boolean);
    for(let i=0;i<paths.length;i+=100){const{data}=await SB.storage.from("fotos").createSignedUrls(paths.slice(i,i+100),3600);
      (data||[]).forEach((u,k)=>{if(u.signedUrl)URL_[paths[i+k]]=u.signedUrl})}
    $("srcNote").textContent=`Banco Supabase · ${PROD.length} produtor(es) · ${FAZ.length} fazenda(s) · ${PL.length} medições de altura/estande · ${GC.length} fotos de cobertura · ${PF.length} fotos de plantas inteiras`;
  }catch(e){toast("Erro ao ler o banco: "+e.message,1)}
  refreshAll();
}
function refreshAll(){fillSelects();renderPainel();renderFotos();renderCadastro();renderEditar()}

/* ====================== selects ====================== */
const prodOpts=()=>PROD.map(p=>({v:p.id,t:p.nome}));
const fazOpts=pid=>FAZ.filter(f=>!pid||f.produtor_id===pid).map(f=>({v:f.id,t:pid?f.nome:`${prodById(f.produtor_id)?.nome||""} · ${f.nome}`}));
const allStages=()=>ordSt([...PL.map(r=>r.estadio),...GC.map(r=>r.estadio)]);
function fillSelects(){
  fillProd();setSel($("sF"),opts(fazOptsM(),"Todas"));
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
const HIDE=new Set(),TRV=()=>TR.filter(t=>!HIDE.has(t));
const legH=order=>order.map(t=>`<button type="button" class="lg${HIDE.has(t)?" off":""}" data-t="${esc(t)}" aria-pressed="${!HIDE.has(t)}" title="Clique para ${HIDE.has(t)?"mostrar":"ocultar"} ${esc(t)}"><i style="background:${COL[t]}"></i>${esc(t)}</button>`).join("");
function togTr(t){if(HIDE.has(t))HIDE.delete(t);else if(TRV().length>1)HIDE.add(t);else return toast("Deixe pelo menos um tratamento visível.",1);renderPainel()}
/* rótulo de dados: valor em cima de cada barra (acima da barra de erro) */
const valPlug={id:"val",afterDatasetsDraw(c){const y=c.scales.y,x=c.ctx;x.save();x.fillStyle=getComputedStyle(document.body).color;x.textAlign="center";x.textBaseline="bottom";
  c.data.datasets.forEach((ds,di)=>{if((ds.type||c.config.type)!=="bar"||!c.isDatasetVisible(di))return;const m=c.getDatasetMeta(di),bw=m.data[0]?.width||30;x.font=`600 ${bw<22?10:bw<40?11:13}px Barlow, system-ui, sans-serif`;
    const inside=c.data.datasets.some(d=>d.type==="line");
    m.data.forEach((b,i)=>{const v=ds.data[i];if(v==null)return;const t=fmt(v,ds.dec??1);
      if(inside&&Math.abs(b.base-b.y)>30){x.save();x.textBaseline="top";x.font=`700 ${bw<40?12:15}px Barlow, system-ui, sans-serif`;const tw=x.measureText(t).width+12;
        x.fillStyle="#fffffff0";x.beginPath();x.roundRect(b.x-tw/2,b.y+(b.base-b.y)*0.42,tw,22,6);x.fill();x.fillStyle="#16231a";x.fillText(t,b.x,b.y+(b.base-b.y)*0.42+4);x.restore();return}
      const top=v+(ds.sd&&ds.sd[i]?ds.sd[i]:0);x.fillText(t,b.x,Math.max(c.chartArea.top+12,y.getPixelForValue(top)-4))})});x.restore()}};
const errPlug={id:"err",afterDatasetsDraw(c){const y=c.scales.y,x=c.ctx;x.save();x.strokeStyle=getComputedStyle(document.body).color;x.lineWidth=1.5;
  c.data.datasets.forEach((ds,di)=>{if(!ds.sd||!c.isDatasetVisible(di))return;const m=c.getDatasetMeta(di),w=Math.min(6,(m.data[0]?.width||12)/3);
    m.data.forEach((b,i)=>{const v=ds.data[i];if(v==null||!ds.sd[i])return;const t=y.getPixelForValue(v+ds.sd[i]),bo=y.getPixelForValue(v-ds.sd[i]);
      x.beginPath();x.moveTo(b.x,t);x.lineTo(b.x,bo);x.moveTo(b.x-w,t);x.lineTo(b.x+w,t);x.moveTo(b.x-w,bo);x.lineTo(b.x+w,bo);x.stroke()})});x.restore()}};
function mk(id,cfg){charts[id]?.destroy();const ink=getComputedStyle(document.body).color,grid=getComputedStyle(document.documentElement).getPropertyValue("--line").trim()||"#ddd";
  Chart.defaults.color=ink;Chart.defaults.font.family="Barlow, system-ui, sans-serif";Chart.defaults.font.size=13;
  for(const s of Object.values(cfg.options.scales||{})){s.grid={...(s.grid||{}),display:false};s.border={display:true,color:ink}}
  for(const d of cfg.data.datasets||[])if((d.type||cfg.type)==="bar"){d.borderColor="#000";d.borderWidth=1.5;d.borderSkipped=false}
  if(cfg.type==="bar"){cfg.plugins=[...(cfg.plugins||[]),valPlug];const yy=cfg.options.scales?.y;if(yy&&yy.max==null)yy.grace="12%";cfg.options.layout={...(cfg.options.layout||{}),padding:{top:16,...(cfg.options.layout?.padding||{})}}}
  charts[id]=new Chart($(id),cfg)}
let SELP=new Set();
const filtP=a=>{const F=$("sF").value;return a.filter(r=>(!SELP.size||SELP.has(r.produtor_id))&&(!F||r.fazenda_id===F))};
const fazOptsM=()=>FAZ.filter(f=>!SELP.size||SELP.has(f.produtor_id)).map(f=>({v:f.id,t:SELP.size===1?f.nome:`${prodById(f.produtor_id)?.nome||""} · ${f.nome}`}));
function fillProd(){for(const id of[...SELP])if(!prodById(id))SELP.delete(id);
  $("sP").innerHTML=`<label class="all"><input type="checkbox" value=""${SELP.size?"":" checked"}> Todos os produtores</label>`+PROD.map(p=>`<label><input type="checkbox" value="${esc(p.id)}"${SELP.has(p.id)?" checked":""}> ${esc(p.nome)}</label>`).join("");
  $("sPb").textContent=!SELP.size?"Todos":SELP.size===1?prodById([...SELP][0])?.nome||"1 produtor":`${SELP.size} produtores`}
const meanT=(a,t,k)=>st(a.filter(r=>r.tratamento===t).map(r=>r[k])).m;
const desc=(arr,f)=>arr.map(x=>[x,f(x)]).sort((a,b)=>(isNaN(b[1])?-1e9:b[1])-(isNaN(a[1])?-1e9:a[1])).map(x=>x[0]);
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
  const K=[["Grau de cover (média das fotos)",ge,"cobertura_pct","%",1],["Altura média",pe,"altura_cm","cm",1],["Estande",pe,"estande_pl_m","pl/m",1],["População",pe,"pop_ha","mil pl/ha",0]];
  $("kpis").innerHTML=K.map(([n,a,k,u,d])=>{let m=meanT(a,"Maxcel",k),c=meanT(a,"Controle",k),x=dlt(a,"Maxcel",k);if(k==="pop_ha"){m/=1000;c/=1000}
    return`<div class="k"><div class="l">${n} · Maxcel · ${esc(E)}</div><div class="v">${fmt(m,d)} <span style="font-size:18px">${u}</span></div>
    <div class="d ${cls(x)}">${pct(x)} vs Controle</div><div class="l">Controle: ${fmt(c,d)} ${u}</div></div>`}).join("");
  $("leg1").innerHTML=legH(desc($("plCmp").value?[$("plCmp").value,"Controle"]:TR,t=>meanT(pe,t,"altura_cm")));
  /* altura por planta */
  $("plT").textContent=`Altura por planta em ${E}`;
  {const v=$("plCmp").value;$("plCmp").innerHTML=`<option value="">Todos os produtos</option>`+TR.filter(t=>t!=="Controle").map(t=>`<option${t===v?" selected":""}>${esc(t)}</option>`).join("")}
  const trH=($("plCmp").value?[$("plCmp").value,"Controle"]:TR).filter(t=>!HIDE.has(t));
  const oH=desc(trH,t=>st(pe.filter(r=>r.tratamento===t).map(r=>r.altura_cm)).m),sts=oH.map(t=>st(pe.filter(r=>r.tratamento===t).map(r=>r.altura_cm)));
  const pts=[];const byF=by(pe,r=>r.fazenda_id+"|"+r.ponto+"|"+r.planta);for(const[k,a]of Object.entries(byF))pts.push({type:"line",showLine:false,label:"Planta",pointRadius:4,pointBackgroundColor:"#16231acc",pointBorderColor:"#fff",
    data:oH.map(t=>a.find(r=>r.tratamento===t)?.altura_cm??null)});
  mk("cPl",{type:"bar",plugins:[errPlug],data:{labels:oH,datasets:[{data:sts.map(s=>isNaN(s.m)?null:+s.m.toFixed(1)),sd:sts.map(s=>s.sd),backgroundColor:oH.map(t=>COL[t]+"cc"),borderRadius:6,order:2},...pts.map(p=>({...p,order:1}))]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{filter:i=>i.datasetIndex===0,callbacks:{label:c=>`média ${fmt(c.raw)} ± ${fmt(sts[c.dataIndex].sd)} cm (n=${sts[c.dataIndex].n})`}}},
      scales:{x:{grid:{display:false}},y:{beginAtZero:true,title:{display:true,text:"cm"}}}}});
  $("plT").textContent=`Altura por planta em ${E}${$("plCmp").value?` · ${$("plCmp").value} vs Controle`:""}`;
  renderPF(E);
  /* grau de cover por amostra */
  $("gcbT").textContent=`Grau de cover em ${E}`;
  $("legGC").innerHTML=legH(desc(TR,t=>meanT(ge,t,"cobertura_pct")));const oG=desc(TRV(),t=>meanT(ge,t,"cobertura_pct")),gs=oG.map(t=>st(ge.filter(r=>r.tratamento===t).map(r=>r.cobertura_pct)));
  const gpts=Object.values(by(ge,r=>r.fazenda_id+"|"+(r.amostra||1)+"|"+(r.foto||1))).map(a=>({type:"line",showLine:false,label:"Foto",pointRadius:4,pointBackgroundColor:"#16231acc",pointBorderColor:"#fff",order:1,
    data:oG.map(t=>a.find(r=>r.tratamento===t)?.cobertura_pct??null)}));
  mk("cGCb",{type:"bar",plugins:[errPlug],data:{labels:oG,datasets:[{data:gs.map(s=>isNaN(s.m)?null:+s.m.toFixed(1)),sd:gs.map(s=>s.sd),backgroundColor:oG.map(t=>COL[t]+"cc"),borderRadius:6,order:2},...gpts]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{filter:i=>i.datasetIndex===0,callbacks:{label:c=>`grau de cover ${fmt(c.raw)}% ± ${fmt(gs[c.dataIndex].sd)} (n=${gs[c.dataIndex].n} fotos)`}}},
      scales:{x:{grid:{display:false}},y:{beginAtZero:true,max:100,title:{display:true,text:"% de fechamento"}}}}});
  /* comparação por local */
  renderLoc(pe,ge,E);
  /* séries */
  const line=(id,rows,k,unit,f=1)=>{const S=series(rows,k);mk(id,{type:"line",data:{labels:S.ss.map(e=>isNaN(S.daeOf[e])?e:`${e} · ${fmt(S.daeOf[e],0)} DAE`),
    datasets:TR.map(t=>({label:t,hidden:HIDE.has(t),data:S.val(t).map(v=>v==null?null:v/f),borderColor:COL[t],backgroundColor:COL[t],borderWidth:t==="Maxcel"?3.5:2,pointRadius:4,tension:.3,spanGaps:true}))},
    plugins:[lineLab(f>1?0:1)],options:{maintainAspectRatio:false,layout:{padding:{top:14}},plugins:{legend:{position:"bottom",labels:{boxWidth:12},onClick:(e,it)=>togTr(it.text)},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw,f>1?0:1)} ${unit}`}}},scales:{x:{},y:{beginAtZero:id==="cPop",title:{display:true,text:unit}}}}});return S};
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
  $("tab3H").textContent=`${E} · ${NPT} pontos por tratamento · altura (cm) das 5 plantas e plantas contadas em cada metro (5 m)`;
  const pf=by(pe,r=>r.fazenda_id+"|"+trOrd(r.tratamento)+"|"+r.ponto),M=Array.from({length:NPL},(_,i)=>i+1);
  $("tab3").innerHTML=`<tr><th>Fazenda</th><th class="tl">Tratamento</th><th>Ponto</th>${M.map(i=>`<th>Alt. P${i}</th>`).join("")}<th>Altura média</th>${M.map(i=>`<th>${i}º m</th>`).join("")}<th>Estande (pl/m)</th></tr>`+
    Object.entries(pf).sort((x,y)=>{const a=x[1][0],b=y[1][0];return(fazById(a.fazenda_id)?.nome||"").localeCompare(fazById(b.fazenda_id)?.nome||"")||trOrd(a.tratamento)-trOrd(b.tratamento)||a.ponto-b.ponto}).map(([k,a])=>{const f=fazById(a[0].fazenda_id);
      return`<tr><td>${esc(f?.nome||"")}</td><td class="tl"><span class="dot" style="background:${COL[a[0].tratamento]}"></span>${esc(a[0].tratamento)}</td><td>${a[0].ponto}</td>${M.map(i=>`<td>${fmt(a.find(r=>r.planta===i)?.altura_cm)}</td>`).join("")}<td><b>${fmt(st(a.map(r=>r.altura_cm)).m)}</b></td>${M.map(i=>`<td>${fmt(a.find(r=>r.planta===i)?.estande_pl_m,0)}</td>`).join("")}<td><b>${fmt(st(a.map(r=>r.estande_pl_m)).m)}</b></td></tr>`}).join("");
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
/* rótulo nos pontos das linhas */
const lineLab=dec=>({id:"ll",afterDatasetsDraw(c){const x=c.ctx;x.save();x.textAlign="center";x.textBaseline="bottom";x.font="600 11px Barlow, system-ui, sans-serif";
  const L=[];c.data.datasets.forEach((ds,di)=>{if(!c.isDatasetVisible(di))return;c.getDatasetMeta(di).data.forEach((p,i)=>{const v=ds.data[i];if(v!=null)L.push({i,x:p.x,y:p.y-7,t:fmt(v,dec),col:ds.borderColor})})});
  for(const g of Object.values(by(L,l=>l.i))){g.sort((a,b)=>a.y-b.y);for(let k=1;k<g.length;k++)if(g[k].y-g[k-1].y<13)g[k].y=g[k-1].y+13}
  for(const l of L){x.strokeStyle="#fff";x.lineWidth=3;x.strokeText(l.t,l.x,l.y);x.fillStyle=l.col;x.fillText(l.t,l.x,l.y)}x.restore()}});
/* altura por produto · fazenda · produtor (todos os produtores, ignora o filtro de produtor) */
function renderPF(E){
  const rows=PL.filter(r=>r.estadio===E&&r.altura_cm!=null&&!HIDE.has(r.tratamento)),byFz=by(rows,r=>r.fazenda_id);
  const grp=Object.entries(byFz).map(([fid,a])=>{const f=fazById(fid),its=Object.values(by(a,r=>r.tratamento)).map(b=>({t:b[0].tratamento,S:st(b.map(r=>r.altura_cm))})).filter(x=>!isNaN(x.S.m)).sort((p,q)=>q.S.m-p.S.m);
    return{fz:f?.nome||"?",pr:prodById(f?.produtor_id)?.nome||"",m:st(a.map(r=>r.altura_cm)).m,its}}).filter(g=>g.its.length).sort((p,q)=>q.m-p.m);
  const it=[],G=[];for(const g of grp){G.push({s:it.length,e:it.length+g.its.length-1,fz:g.fz,pr:g.pr});for(const x of g.its)it.push({...x,fz:g.fz,pr:g.pr})}
  $("pfT").textContent=`Altura por produto, fazenda e produtor · ${E}`;
  $("leg3").innerHTML=legH(TR);
  $("pfFig").style.minWidth=Math.max(0,it.length*62+G.length*16)+"px";
  /* faixas alternadas, linha separando fazendas e nome da fazenda/produtor embaixo */
  const grpPlug={id:"grp",beforeDatasetsDraw(c){const x=c.ctx,ca=c.chartArea,m=c.getDatasetMeta(0).data;if(!m.length)return;const ed=i=>i<0?ca.left:i>=m.length?ca.right:(m[i-1].x+m[i].x)/2;x.save();
      G.forEach((g,k)=>{if(k%2)return;const l=g.s===0?ca.left:ed(g.s),r=g.e===m.length-1?ca.right:ed(g.e+1);x.fillStyle="rgba(22,35,26,.045)";x.fillRect(l,ca.top,r-l,ca.bottom-ca.top)});x.restore()},
    afterDraw(c){const x=c.ctx,ca=c.chartArea,m=c.getDatasetMeta(0).data;if(!m.length)return;const ink=getComputedStyle(document.body).color,xs=c.scales.x;x.save();
      for(const g of G.slice(1)){const px=(m[g.s-1].x+m[g.s].x)/2;x.strokeStyle=ink;x.lineWidth=1.2;x.setLineDash([5,4]);x.beginPath();x.moveTo(px,ca.top);x.lineTo(px,xs.bottom+34);x.stroke()}
      x.setLineDash([]);x.fillStyle=ink;x.textAlign="center";x.textBaseline="top";
      for(const g of G){const cx=(m[g.s].x+m[g.e].x)/2,wd=Math.max(60,m[g.e].x-m[g.s].x+50);x.font="700 12px Barlow, system-ui, sans-serif";x.fillText(fitT(x,g.fz,wd),cx,xs.bottom+4);x.font="400 11px Barlow, system-ui, sans-serif";x.fillText(fitT(x,g.pr,wd),cx,xs.bottom+19)}x.restore()}};
  mk("cPF",{type:"bar",plugins:[errPlug,grpPlug],data:{labels:it.map(x=>x.t),datasets:[{data:it.map(x=>+x.S.m.toFixed(1)),sd:it.map(x=>x.S.sd),backgroundColor:it.map(x=>COL[x.t]+"cc"),borderRadius:6,maxBarThickness:56}]},
    options:{maintainAspectRatio:false,layout:{padding:{bottom:36}},plugins:{legend:{display:false},tooltip:{callbacks:{title:c=>it[c[0].dataIndex].t+" · "+it[c[0].dataIndex].fz+" · "+it[c[0].dataIndex].pr,label:c=>`média ${fmt(c.raw)} ± ${fmt(it[c.dataIndex].S.sd)} cm (n=${it[c.dataIndex].S.n})`}}},
      scales:{x:{ticks:{autoSkip:false,maxRotation:0,font:{size:11}}},y:{beginAtZero:true,title:{display:true,text:"cm"}}}}})}
const fitT=(x,t,w)=>{if(x.measureText(t).width<=w)return t;while(t.length>3&&x.measureText(t+"…").width>w)t=t.slice(0,-1);return t+"…"};
function renderLoc(pe,ge,E){
  const k=$("locA").value,isGC=k==="cobertura_pct",rows=isGC?ge:pe,f=k==="pop_ha"?1000:1,un={cobertura_pct:"%",altura_cm:"cm",estande_pl_m:"pl/m",pop_ha:"mil pl/ha"}[k];
  $("locT").textContent=`Comparação por local · ${$("locA").selectedOptions[0].text.replace(/ \(.*\)/,"")} · ${E}`;
  const S=(a,t)=>st(a.filter(r=>r.tratamento===t).map(r=>r[k]==null?null:r[k]/f));
  const fz=desc(ordFaz([...new Set(rows.map(r=>r.fazenda_id))]),id=>st(rows.filter(r=>r.fazenda_id===id).map(r=>r[k])).m),labels=[...fz.map(id=>fazById(id)?.nome||"?"),"Média geral"];
  const oL=desc(TR,t=>S(rows,t).m);
  const dsAll=oL.map(t=>{const v=[...fz.map(id=>S(rows.filter(r=>r.fazenda_id===id),t)),S(rows,t)];
    return{label:t,data:v.map(s=>isNaN(s.m)?null:+s.m.toFixed(2)),sd:v.map(s=>s.sd),nn:v.map(s=>s.n),backgroundColor:COL[t]+"cc",borderRadius:4}});
  const ds=dsAll.filter(d=>!HIDE.has(d.label));$("leg2").innerHTML=legH(oL);
  mk("cLoc",{type:"bar",plugins:[errPlug],data:{labels,datasets:ds},options:{maintainAspectRatio:false,plugins:{legend:{display:false},
    tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw,k==="pop_ha"?0:1)} ${un} ± ${fmt(c.dataset.sd[c.dataIndex],1)} (n=${c.dataset.nn[c.dataIndex]})`}}},
    scales:{x:{grid:{display:false}},y:{beginAtZero:true,...(isGC?{max:100}:{}),title:{display:true,text:un}}}}});
  $("tabLoc").innerHTML=`<tr><th>Local</th>${oL.map(t=>`<th><span class="dot" style="background:${COL[t]}"></span>${t}</th>`).join("")}<th>Maxcel vs Ctrl</th></tr>`+
    labels.map((l,i)=>{const c=dsAll[oL.indexOf("Controle")].data[i],m=dsAll[oL.indexOf("Maxcel")].data[i],x=c?(m/c-1)*100:NaN;
      return`<tr><td>${i===labels.length-1?"<b>Média geral</b>":esc(l)}</td>${dsAll.map(d=>`<td>${fmt(d.data[i],k==="pop_ha"?0:1)}${d.nn[i]>1?` ± ${fmt(d.sd[i],1)}`:""}</td>`).join("")}<td class="${cls(x)}">${pct(x)}</td></tr>`}).join("");
}
const ordFaz=ids=>ids.sort((a,b)=>{const fa=fazById(a),fb=fazById(b);return((prodById(fa?.produtor_id)?.nome||"")+(fa?.nome||"")).localeCompare((prodById(fb?.produtor_id)?.nome||"")+(fb?.nome||""))});

/* ====================== falso NDVI (várias amostras) ====================== */
const RAMP=[[-0.2,[165,0,38]],[0,[244,109,67]],[0.08,[254,224,139]],[0.16,[166,217,106]],[0.3,[26,152,80]],[0.45,[0,104,55]]];
const rampAt=v=>{if(v<=RAMP[0][0])return RAMP[0][1];for(let i=1;i<RAMP.length;i++)if(v<=RAMP[i][0]){const[a,ca]=RAMP[i-1],[b,cb]=RAMP[i],t=(v-a)/(b-a);return ca.map((x,j)=>x+(cb[j]-x)*t)}return RAMP.at(-1)[1]};
let SAMP=[];
/* linhas de soja: detecta orientação e espaçamento das linhas na própria foto e mantém só a vegetação ligada às linhas */
function detectRows(veg,w,h){
  const stp=Math.max(1,Math.round(Math.max(w,h)/320)),xs=[],ys=[],vs=[];
  for(let y=0;y<h;y+=stp)for(let x=0;x<w;x+=stp){xs.push(x);ys.push(y);vs.push(veg[y*w+x])}
  const n=xs.length;let tv=0;for(const v of vs)tv+=v;const fr=tv/n;if(fr<0.01||fr>0.92)return null;
  /* perfil da vegetação atravessando as linhas, no ângulo a, só com os pontos cujo índice passa no filtro */
  const prof=(a,B,keepI)=>{const t=a*Math.PI/180,c=Math.cos(t),sn=Math.sin(t),us=[0,w*c,h*sn,w*c+h*sn],u0=Math.min(...us),nb=Math.ceil((Math.max(...us)-u0)/B)+1,T=new Float64Array(nb),V=new Float64Array(nb);
    for(let i=0;i<n;i++){if(keepI&&!keepI(i))continue;const b=Math.floor((xs[i]*c+ys[i]*sn-u0)/B);T[b]++;V[b]+=vs[i]}
    const mx=Math.max(...T),mn=Math.max(2,0.25*mx),p=[];for(let b=0;b<nb;b++)p.push(T[b]>=mn?V[b]/T[b]:NaN);
    const ok=p.filter(v=>!isNaN(v)),m=ok.length?ok.reduce((x,y)=>x+y,0)/ok.length:0;return{c,sn,u0,B,p:p.map(v=>isNaN(v)?m:v),m,valid:p.map(v=>!isNaN(v))}};
  const vari=P=>{let vv=0,k=0;P.p.forEach((v,i)=>{if(P.valid[i]){vv+=(v-P.m)**2;k++}});return k?vv/k:0};
  /* ângulo: maior contraste, medido em faixas ao longo da linha (tolera fotos um pouco inclinadas) */
  const K=5;let best=null;
  for(let a=0;a<180;a+=3){const t=a*Math.PI/180,dx=-Math.sin(t),dy=Math.cos(t),vv=xs.map((x,i)=>x*dx+ys[i]*dy),v0=Math.min(...vv),v1=Math.max(...vv);let sc=0;
    for(let k=0;k<K;k++){const lo=v0+(v1-v0)*k/K,hi=v0+(v1-v0)*(k+1)/K;sc+=vari(prof(a,2*stp,i=>vv[i]>=lo&&vv[i]<hi))}if(!best||sc>best.sc)best={a,sc}}
  const t=best.a*Math.PI/180,dx=-Math.sin(t),dy=Math.cos(t),vv=xs.map((x,i)=>x*dx+ys[i]*dy),v0=Math.min(...vv),v1=Math.max(...vv);
  const per=P=>{const N=P.p.length,z=P.p.map(v=>v-P.m),ac=L=>{let s2=0,c2=0;for(let i=0;i+L<N;i++)if(P.valid[i]&&P.valid[i+L]){s2+=z[i]*z[i+L];c2++}return c2>4?s2/c2:0};
    const a0=ac(0);if(!(a0>0))return null;const Lmin=Math.max(3,Math.round(N*0.06)),Lmax=Math.floor(N*0.55),pk=[];
    for(let l=Lmin;l<=Lmax;l++){const v=ac(l)/a0;if(v>=ac(l-1)/a0&&v>=ac(l+1)/a0)pk.push([l,v])}
    const mr=Math.max(0,...pk.map(x=>x[1])),f1=pk.find(x=>x[1]>=0.55*mr);if(!f1||f1[1]<0.1)return null;const L=f1[0];
    const k=Math.max(1,Math.round(L/6)),sm=z.map((_,i)=>{let s2=0,c2=0;for(let j=i-k;j<=i+k;j++)if(j>=0&&j<N){s2+=z[j];c2++}return s2/c2});
    let ph=0,bs=-1e9;for(let f=0;f<L;f++){let s2=0,c2=0;for(let i=f;i<N;i+=L){s2+=sm[i];c2++}s2/=c2;if(s2>bs){bs=s2;ph=f}}return{L,ph,r:f1[1],N}};
  /* em cada faixa: ajusta o ângulo, mede o espaçamento e marca o centro de cada linha (picos do perfil) */
  const S=[];for(let k=0;k<K;k++){const lo=v0+(v1-v0)*k/K,hi=v0+(v1-v0)*(k+1)/K,inS=i=>vv[i]>=lo&&vv[i]<hi;let ba=best.a,bv=-1;
    for(let a=best.a-15;a<=best.a+15;a+=3){const x=vari(prof(a,2*stp,inS));if(x>bv){bv=x;ba=a}}
    const P=prof(ba,stp,inS),q=per(P);S.push({a:ba,c:Math.cos(ba*Math.PI/180),sn:Math.sin(ba*Math.PI/180),u0:P.u0,P,L:q?q.L:0,r:q?q.r:0,lo,hi})}
  const good=S.filter(x=>x.L);if(good.length<Math.ceil(K/2))return null;
  const Ls=good.map(x=>x.L).sort((a,b)=>a-b),Lm=Ls[Math.floor(Ls.length/2)];
  for(const x of S){if(!x.L||x.L>1.6*Lm||x.L<0.6*Lm)x.L=Lm;const p=x.P.p,N=p.length,k=Math.max(1,Math.round(x.L/5)),sm=p.map((_,i)=>{let s2=0,c2=0;for(let j=i-k;j<=i+k;j++)if(j>=0&&j<N){s2+=p[j];c2++}return s2/c2});
    const mean=sm.reduce((a,b)=>a+b,0)/N,cand=[];for(let i=1;i<N-1;i++)if(sm[i]>=sm[i-1]&&sm[i]>=sm[i+1]&&sm[i]>mean)cand.push(i);
    cand.sort((a,b)=>sm[b]-sm[a]);const cen=[];for(const i of cand)if(cen.every(j=>Math.abs(j-i)>=0.6*x.L))cen.push(i);x.cen=cen.sort((a,b)=>a-b);x.N=N;delete x.P}
  const nRows=Math.round(st(S.map(x=>x.cen.length)).m);if(!nRows)return null;
  return{dx,dy,B:stp,S,v0,v1,K,n:nRows,ang:best.a}}
function soyKeep(veg,w,h,R,band){
  const keep=new Uint8Array(w*h);if(!R){keep.set(veg);return keep}
  const sw=(R.v1-R.v0)/R.K,inB=(x,y)=>{const v=x*R.dx+y*R.dy,k=Math.min(R.K-1,Math.max(0,Math.floor((v-R.v0)/sw))),g=R.S[k],u=(x*g.c+y*g.sn-g.u0)/R.B;let d=1e9;for(const c of g.cen){const e=Math.abs(u-c);if(e<d)d=e}return d<=band*g.L/2};
  const lab=new Uint8Array(w*h),stk=new Int32Array(w*h),buf=new Int32Array(w*h);
  for(let i=0;i<w*h;i++){if(!veg[i]||lab[i])continue;let sp=0,nb=0,touch=false;stk[sp++]=i;lab[i]=1;
    while(sp){const j=stk[--sp];buf[nb++]=j;const x=j%w,y=(j-x)/w;if(!touch&&inB(x,y))touch=true;
      if(x>0&&veg[j-1]&&!lab[j-1]){lab[j-1]=1;stk[sp++]=j-1}if(x<w-1&&veg[j+1]&&!lab[j+1]){lab[j+1]=1;stk[sp++]=j+1}
      if(y>0&&veg[j-w]&&!lab[j-w]){lab[j-w]=1;stk[sp++]=j-w}if(y<h-1&&veg[j+w]&&!lab[j+w]){lab[j+w]=1;stk[sp++]=j+w}}
    if(touch)for(let q=0;q<nb;q++)keep[buf[q]]=1}
  return keep}
const soyOpt=()=>({on:!$("soyOn")||$("soyOn").checked,band:($("soyBand")?+$("soyBand").value:35)/100});
function analyze(s,lim,opt=soyOpt()){
  const max=1200,sc=Math.min(1,max/Math.max(s.img.width,s.img.height)),w=Math.round(s.img.width*sc),h=Math.round(s.img.height*sc);
  const co=s.co,cn=s.cn;co.width=cn.width=w;co.height=cn.height=h;const xo=co.getContext("2d");xo.drawImage(s.img,0,0,w,h);
  const d=xo.getImageData(0,0,w,h).data,N=w*h,veg=new Uint8Array(N),gl=new Float32Array(N);
  for(let i=0,p=0;p<N;i+=4,p++){const r=d[i],g=d[i+1],b=d[i+2],exg=2*g-r-b;gl[p]=(2*g-r-b)/(2*g+r+b+1e-6);veg[p]=g>0&&r/g<0.95&&b/g<0.95&&exg>lim?1:0}
  const R=opt.on?detectRows(veg,w,h):null,keep=opt.on?soyKeep(veg,w,h,R,opt.band):veg;
  const out=cn.getContext("2d").createImageData(w,h),o=out.data;let all=0,soy=0,sum=0;
  for(let i=0,p=0;p<N;i+=4,p++){let c;if(keep[p]){soy++;sum+=gl[p];c=rampAt(Math.max(gl[p],0.12))}else if(veg[p])c=[215,48,200];else c=rampAt(Math.min(gl[p],0.06));if(veg[p])all++;
    o[i]=c[0];o[i+1]=c[1];o[i+2]=c[2];o[i+3]=255}
  const x2=cn.getContext("2d");x2.putImageData(out,0,0);
  if(R){x2.save();x2.strokeStyle="rgba(255,255,255,.9)";x2.lineWidth=Math.max(1.5,w/400);x2.setLineDash([8,6]);
    for(const g of R.S){const ex=-g.sn,ey=g.c;for(const c of g.cen){const u=g.u0+c*R.B;x2.beginPath();for(const v of[g.lo,g.hi]){const X=u*g.c+v*ex,Y=u*g.sn+v*ey;v===g.lo?x2.moveTo(X,Y):x2.lineTo(X,Y)}x2.stroke()}}x2.restore()}
  s.covAll=all/N*100;s.cov=soy/N*100;s.idx=soy?sum/soy:0;s.lim=lim;s.rows=R?R.n:0;s.soy=opt.on}
function analisarTodas(){const lim=+$("lim").value;$("anal").classList.toggle("noNdvi",isPlantas());$("limOut").textContent=lim;SAMP.forEach(s=>{analyze(s,lim);s.el.querySelector("b").textContent=fmt(s.cov)+"%";const n=s.el.querySelector(".rw");if(n)n.textContent=!s.soy?"todas as plantas verdes":s.rows?`${s.rows} linhas detectadas · total verde ${fmt(s.covAll)}%`:"linhas não detectadas: usado todo o verde"});
  const S=st(SAMP.map(s=>s.cov));$("covOut").textContent=fmt(S.m)+"%";$("covSd").textContent=SAMP.length>1?`± ${fmt(S.sd)} (desvio) · CV ${fmt(S.cv)}% · ${SAMP.length} fotos`:"1 foto"}
const loadImg=f=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=URL.createObjectURL(f)});
const isGeral=()=>$("uK").value==="geral",isPlantas=()=>$("uK").value==="plantas",single=()=>isGeral();
$("uK").addEventListener("change",()=>{$("uTw").hidden=isGeral();$("uFl").textContent=isGeral()?"Foto geral (1 foto)":isPlantas()?"Fotos das plantas inteiras (até 9: 3 por ponto)":"Fotos (até 9: 3 por ponto)";$("uFile").multiple=!single();
  $("saveFoto").textContent=isGeral()?"Salvar foto geral":isPlantas()?"Salvar fotos das plantas":"Salvar pontos";$("uFile").value="";SAMP=[];$("samp").innerHTML="";$("anal").hidden=true});
$("uFile").addEventListener("change",async e=>{const lim5=single()?1:NPT*NFT,files=[...e.target.files].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).slice(0,lim5);if(!files.length)return;
  if(e.target.files.length>lim5)toast(single()?"Aqui só a primeira foto é usada.":`Só as ${NPT*NFT} primeiras fotos foram usadas.`,1);
  SAMP=[];$("samp").innerHTML="";
  for(const[i,f]of files.entries()){let img;try{img=await loadImg(f)}catch{toast(`Não consegui abrir ${f.name}.`,1);continue}
    const mP=f.name.match(/(?:^|[^a-z])(?:p|ponto)[\s_.-]*0?([1-9])/i),mF=f.name.match(/(?:^|[^a-z])(?:f|foto)[\s_.-]*0?([1-9])/i),dP=mP&&+mP[1]<=NPT?+mP[1]:Math.floor(i/NFT)%NPT+1,dF=mF&&+mF[1]<=NFT?+mF[1]:i%NFT+1;
    const el=document.createElement("div");el.className="smp";el.innerHTML=`<div class="two"><canvas></canvas><canvas></canvas></div><div class="cap"><span class="pf"${single()?' hidden':''}><label>Ponto <select>${[1,2,3].map(n=>`<option${n===dP?" selected":""}>${n}</option>`).join("")}</select></label><label>Foto <select class="fsel">${[1,2,3].map(n=>`<option${n===dF?" selected":""}>${n}</option>`).join("")}</select></label></span><b>–</b></div><div class="cap" style="padding-top:0"><small>${esc(f.name)}</small><small class="rw"></small></div>`;
    const[co,cn]=el.querySelectorAll("canvas");$("samp").append(el);SAMP.push({file:f,img,el,co,cn,sel:el.querySelector("select"),fsel:el.querySelector(".fsel")})}
  $("anal").hidden=!SAMP.length;analisarTodas()});
$("lim").addEventListener("input",analisarTodas);$("soyOn").addEventListener("change",analisarTodas);$("soyBand").addEventListener("input",()=>{$("soyBandOut").textContent=$("soyBand").value});$("soyBand").addEventListener("change",analisarTodas);
/* recalcula as fotos já enviadas com a regra "somente soja" */
async function recalcGC(){if(MODE==="demo")return toast("Disponível só com o banco conectado.",1);
  const recs=[...GC.map(r=>({r,tab:"fotos_cobertura"})),...GER.map(r=>({r,tab:"fotos_gerais"}))].filter(x=>x.r.foto_path&&URL_[x.r.foto_path]);if(!recs.length)return toast("Nenhuma foto de Ground Cover para recalcular.",1);
  const b=$("recalc");b.disabled=true;let ok=0;const stamp=Date.now();
  try{for(const{r,tab}of recs){b.textContent=`Recalculando ${ok+1}/${recs.length}…`;
      const img=await createImageBitmap(await (await fetch(URL_[r.foto_path],{cache:"no-store"})).blob());const s={img,co:document.createElement("canvas"),cn:document.createElement("canvas")};
      analyze(s,num(r.limiar)??+$("lim").value);const png=await new Promise(res=>s.cn.toBlob(res,"image/png")),np=r.foto_path.replace(/\.jpg$/i,"")+`-ndvi-r${stamp}.png`;
      const{error:e1}=await SB.storage.from("fotos").upload(np,png,{upsert:true,contentType:"image/png"});if(e1)throw e1;
      const upd={cobertura_pct:+s.cov.toFixed(2),mapa_path:np,atualizado_em:new Date().toISOString()};if(tab==="fotos_cobertura")upd.indice_medio=+s.idx.toFixed(4);
      const{error}=await SB.from(tab).update(upd).eq("id",r.id);if(error)throw error;if(r.mapa_path&&r.mapa_path!==np)await SB.storage.from("fotos").remove([r.mapa_path]);ok++}
    toast(`${ok} foto(s) recalculadas considerando só as linhas de soja.`);await loadDB()}
  catch(err){toast(`Parou na foto ${ok+1}: ${err.message}`,1);await loadDB()}finally{b.disabled=false;b.textContent="Recalcular fotos já enviadas"}}
$("recalc").addEventListener("click",recalcGC);
const slug=s=>String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-");
$("saveFoto").addEventListener("click",async()=>{
  if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const fid=$("uF").value,t=$("uT").value,e=$("uE").value,dt=$("uD").value||null;if(!fid||!SAMP.length)return toast("Escolha fazenda, tratamento, estádio e as fotos.",1);
  if(isPlantas()){const f=fazById(fid),nums=SAMP.map(s=>s.sel.value+"-"+s.fsel.value);if(new Set(nums).size!==nums.length)return toast("Duas fotos estão com o mesmo ponto e número de foto.",1);$("saveFoto").disabled=true;
    try{for(const s of SAMP){const a=+s.sel.value,fo=+s.fsel.value,p=`cobertura/${fid}/${slug(e)}/${slug(t)}-p${a}-f${fo}-plantas.jpg`;
        const jpg=await new Promise(r=>s.co.toBlob(r,"image/jpeg",0.9));const{error:e1}=await SB.storage.from("fotos").upload(p,jpg,{upsert:true,contentType:"image/jpeg"});if(e1)throw e1;
        const{error}=await SB.from("fotos_plantas").upsert({fazenda_id:fid,tratamento_id:TRID[t],estadio:e,ponto:a,foto:fo,arquivo:s.file.name,data:dt,dae:daysBetween(f?.data_emergencia,dt),foto_path:p,atualizado_em:new Date().toISOString()},{onConflict:"fazenda_id,tratamento_id,estadio,ponto,foto"});if(error)throw error}
      toast(`Plantas inteiras salvas · ${t} · ${e} · ${SAMP.length} foto(s).`);$("uFile").value="";$("anal").hidden=true;SAMP=[];$("samp").innerHTML="";
      const pid=$("uP").value;await loadDB();$("cP").value=pid;setSel($("cF"),opts(fazOpts(pid)));$("cF").value=fid;fillSelects();$("cE").value=e;renderFotos();
    }catch(err){toast("Não foi possível salvar: "+err.message,1)}finally{$("saveFoto").disabled=false}return}
  if(isGeral()){const s=SAMP[0],f=fazById(fid),base=`cobertura/${fid}/${slug(e)}/geral`;$("saveFoto").disabled=true;
    try{const jpg=await new Promise(r=>s.co.toBlob(r,"image/jpeg",0.9)),png=await new Promise(r=>s.cn.toBlob(r,"image/png"));
      for(const[p,b,ct]of[[base+".jpg",jpg,"image/jpeg"],[base+"-ndvi.png",png,"image/png"]]){const{error}=await SB.storage.from("fotos").upload(p,b,{upsert:true,contentType:ct});if(error)throw error}
      const{error}=await SB.from("fotos_gerais").upsert({fazenda_id:fid,estadio:e,data:dt,dae:daysBetween(f?.data_emergencia,dt),foto_path:base+".jpg",mapa_path:base+"-ndvi.png",
        cobertura_pct:+s.cov.toFixed(2),limiar:s.lim,arquivo:s.file.name,atualizado_em:new Date().toISOString()},{onConflict:"fazenda_id,estadio"});if(error)throw error;
      toast(`Foto geral salva · ${e} · ${fmt(s.cov)}% de cobertura.`);$("uFile").value="";$("anal").hidden=true;SAMP=[];$("samp").innerHTML="";
      const pid=$("uP").value;await loadDB();$("cP").value=pid;setSel($("cF"),opts(fazOpts(pid)));$("cF").value=fid;fillSelects();$("cE").value=e;renderFotos();
    }catch(err){toast("Não foi possível salvar: "+err.message,1)}finally{$("saveFoto").disabled=false}return}
  const nums=SAMP.map(s=>s.sel.value+"-"+s.fsel.value);if(new Set(nums).size!==nums.length)return toast("Duas fotos estão com o mesmo ponto e número de foto.",1);
  const f=fazById(fid),trId=TRID[t];$("saveFoto").disabled=true;
  try{for(const s of SAMP){const a=+s.sel.value,fo=+s.fsel.value,base=`cobertura/${fid}/${slug(e)}/${slug(t)}-p${a}-f${fo}`;
      const jpg=await new Promise(r=>s.co.toBlob(r,"image/jpeg",0.88)),png=await new Promise(r=>s.cn.toBlob(r,"image/png"));
      for(const[p,b,ct]of[[base+".jpg",jpg,"image/jpeg"],[base+"-ndvi.png",png,"image/png"]]){const{error}=await SB.storage.from("fotos").upload(p,b,{upsert:true,contentType:ct});if(error)throw error}
      const{error}=await SB.from("fotos_cobertura").upsert({fazenda_id:fid,tratamento_id:trId,estadio:e,amostra:a,foto:fo,arquivo:s.file.name,data:dt,dae:daysBetween(f?.data_emergencia,dt),foto_path:base+".jpg",mapa_path:base+"-ndvi.png",
        cobertura_pct:+s.cov.toFixed(2),indice_medio:+s.idx.toFixed(4),limiar:s.lim,atualizado_em:new Date().toISOString()},{onConflict:"fazenda_id,tratamento_id,estadio,amostra,foto"});if(error)throw error}
    toast(`Salvo: ${t} · ${e} · ${SAMP.length} foto(s) · grau de cover ${$("covOut").textContent}.`);$("uFile").value="";$("anal").hidden=true;SAMP=[];$("samp").innerHTML="";
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
const delB=(k,id,inline)=>PAPEL==="admin"&&MODE!=="demo"?`<button type="button" class="del${inline?" inl":""}" data-delk="${k}" data-delid="${esc(id)}" title="Excluir esta foto">Excluir</button>`:"";
const rotB=(k,id)=>(PAPEL==="admin"||PAPEL==="avaliador")&&MODE!=="demo"?`<button type="button" class="rot" data-rotk="${k}" data-rotid="${esc(id)}" title="Girar 90° no sentido horário">↻ Girar</button>`:"";
async function rotFoto(b){if(b.disabled)return;const K=KIND[b.dataset.rotk],r=K&&K.arr().find(x=>x.id===b.dataset.rotid);if(!r)return;
  b.disabled=true;b.textContent="Girando…";const stamp=Date.now(),upd={},old=[];
  try{for(const col of["foto_path","mapa_path"]){const p=r[col],u=p&&URL_[p];if(!u)continue;
      const bm=await createImageBitmap(await (await fetch(u,{cache:"no-store"})).blob());
      const c=document.createElement("canvas");c.width=bm.height;c.height=bm.width;const x=c.getContext("2d");x.translate(c.width,0);x.rotate(Math.PI/2);x.drawImage(bm,0,0);
      const png=/\.png$/i.test(p),type=png?"image/png":"image/jpeg",out=await new Promise(res=>c.toBlob(res,type,.9));
      const np=p.replace(/(-r\d+)?(\.\w+)$/,`-r${stamp}$2`);
      const{error}=await SB.storage.from("fotos").upload(np,out,{upsert:true,contentType:type});if(error)throw error;upd[col]=np;old.push(p)}
    if(!old.length)throw new Error("foto não encontrada");
    const{error}=await SB.from(K.tab).update(upd).eq("id",r.id);if(error)throw error;
    await SB.storage.from("fotos").remove(old);toast("Foto girada 90°.");await loadDB()}
  catch(err){toast("Não foi possível girar: "+err.message,1);b.disabled=false;b.textContent="↻ Girar"}}
document.addEventListener("click",e=>{const rb=e.target.closest&&e.target.closest("button.rot");if(rb){e.stopPropagation();e.preventDefault();rotFoto(rb)}},true);
async function delFoto(b){if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Confirmar exclusão";b.classList.add("sure");setTimeout(()=>{if(b.isConnected&&b.dataset.sure==="1"){b.dataset.sure="";b.textContent="Excluir";b.classList.remove("sure")}},5000);return}
  const K=KIND[b.dataset.delk||""],r=K.arr().find(x=>String(x.id)===b.dataset.delid);if(!r)return;b.disabled=true;
  const{error}=await SB.from(K.tab).delete().eq("id",r.id);if(error){b.disabled=false;return toast(error.message,1)}
  await SB.storage.from("fotos").remove([r.foto_path,r.mapa_path].filter(Boolean));toast("Foto excluída.");await loadDB()}
const canUp=()=>MODE==="demo"||PAPEL==="admin"||PAPEL==="avaliador";
let QUICK=null;
function quickAdd(kind,t){if(!$("cF").value||!$("cE").value)return toast("Escolha produtor, fazenda e estádio na comparação.",1);
  QUICK={kind,t};$("quickFile").value="";$("quickFile").click()}
$("quickFile").addEventListener("change",e=>{const fs=[...e.target.files];if(!fs.length||!QUICK)return;
  const fz=fazById($("cF").value);$("uP").value=fz?.produtor_id||"";setSel($("uF"),opts(fazOpts($("uP").value)));$("uF").value=$("cF").value;
  $("uK").value=QUICK.kind;$("uK").dispatchEvent(new Event("change"));$("uT").value=QUICK.t;
  if(![...$("uE").options].some(o=>o.value===$("cE").value))$("uE").add(new Option($("cE").value,$("cE").value));$("uE").value=$("cE").value;
  const dt=new DataTransfer();fs.forEach(f=>dt.items.add(f));$("uFile").files=dt.files;$("uFile").dispatchEvent(new Event("change"));
  setTimeout(()=>{$("upCard").scrollIntoView({behavior:"smooth",block:"start"});toast(`${fs.length} foto(s) de ${QUICK.t} carregadas. Confira ponto e nº da foto e clique em Salvar.`)},400)});
function renderFotos(){
  renderTrSel();const mode=$("cMode").value,ts=selTR();
  const G=GER.find(g=>g.fazenda_id===$("cF").value&&g.estadio===$("cE").value),gu=G&&URL_[mode==="mapa"?G.mapa_path:G.foto_path];
  const all=GC.filter(r=>r.fazenda_id===$("cF").value&&r.estadio===$("cE").value),ms=st(all.map(r=>r.cobertura_pct));
  $("geral").hidden=!G;if(G)$("geral").innerHTML=`<div class="gcap"><h3>Foto geral · todas as parcelas</h3>${delB("geral",G.id,1)}<span>cobertura na foto geral <b>${fmt(G.cobertura_pct)}%</b></span>${ms.n?`<span>média das amostras de todos os tratamentos <b>${fmt(ms.m)}%</b></span>`:""}</div>
    ${gu?`<div class="gimg" data-geral="1"><img src="${esc(gu)}" alt="Foto geral"></div>`:""}`;$("bigGrid").style.setProperty("--n",Math.max(ts.length,1));
  const gcs=GC.filter(r=>r.fazenda_id===$("cF").value&&r.estadio===$("cE").value),nA=NPT,nFo=Math.min(NFT,Math.max(1,...gcs.map(r=>r.foto||1)));
  let h=ts.map(t=>{const S=st(gcRows(t).map(r=>r.cobertura_pct));return`<div class="hd" style="background:${COL[t]}"><span>${esc(t)}</span><b>${isNaN(S.m)?"–":fmt(S.m)+"%"}</b><span>${S.n?`grau de cover · ${S.n} foto(s)${S.n>1?` · ± ${fmt(S.sd)}`:""}`:"sem fotos"}</span>${canUp()?`<span class="adds"><button type="button" class="add" data-add="am" data-t="${esc(t)}">+ 9 fotos Ground Cover</button><button type="button" class="add" data-add="plantas" data-t="${esc(t)}">+ Plantas inteiras</button><button type="button" class="add" data-add="grupo" data-t="${esc(t)}">+ Foto em grupo</button></span>`:""}</div>`}).join("");
  const pfs=PF.filter(r=>r.fazenda_id===$("cF").value&&r.estadio===$("cE").value),nP=pfs.length?NPT:0,nPF=Math.min(NFT,Math.max(1,...pfs.map(r=>r.foto||1)));
  const fn=r=>r&&r.arquivo?`<span class="fn" title="${esc(r.arquivo)}">${esc(r.arquivo)}</span>`:"";
  if(nP)h+=`<div class="sec">Plantas inteiras</div>`;
  if(nP)h+=ts.map(t=>{const pf=pfs.filter(r=>r.tratamento===t&&URL_[r.foto_path]).sort((x,y)=>((x.ponto||1)-(y.ponto||1))||((x.foto||1)-(y.foto||1)))[0],u=pf&&URL_[pf.foto_path],a=pf?.ponto||1,fo=pf?.foto||1;
    return u?`<div role="button" tabindex="0" class="cell tall" data-pl="${esc(t)}" data-pp="${a}" data-pf="${fo}"><img src="${esc(u)}" alt="Plantas inteiras ${esc(t)}"><span class="bd">${esc(t)}</span>${delB("plantas",pf.id)}${rotB("plantas",pf.id)}${fn(pf)}</div>`:`<div class="cell tall" style="cursor:default"><span class="nf">${esc(t)} · plantas inteiras: sem foto</span></div>`}).join("");
  const fgs=FC.filter(r=>r.tipo==="grupo"&&r.fazenda_id===$("cF").value&&r.estadio===$("cE").value&&URL_[r.foto_path]);
  if(fgs.length)h+=`<div class="sec">Fotos em grupo</div>`+ts.map(t=>{const r=fgs.find(x=>x.tratamento===t),u=r&&URL_[r.foto_path];
    return u?`<div role="button" tabindex="0" class="cell tall" data-ct="${esc(t)}" data-ctipo="grupo"><img src="${esc(u)}" alt="Foto em grupo ${esc(t)}"><span class="bd">${esc(t)}</span>${delB("comp",r.id)}${rotB("comp",r.id)}${fn(r)}</div>`:`<div class="cell tall" style="cursor:default"><span class="nf">${esc(t)} · foto em grupo: sem foto</span></div>`}).join("");
  if(nP||fgs.length)h+=`<div class="sec">Ground Cover (falso NDVI)</div>`;
  for(let a=1;a<=nA;a++)for(let fo=1;fo<=nFo;fo++)h+=ts.map(t=>{const g=gcRows(t).find(r=>(r.amostra||1)===a&&(r.foto||1)===fo),im=imgOf(g,mode);
    return im?`<div role="button" tabindex="0" class="cell" data-t="${esc(t)}" data-a="${a}" data-f="${fo}">${im}<span class="bd">Ponto ${a} · foto ${fo} · ${fmt(g.cobertura_pct)}%</span>${g.foto_path?delB("",g.id)+rotB("",g.id):""}${fn(g)}</div>`:`<div class="cell" style="cursor:default"><span class="nf">${esc(t)} · ponto ${a} · foto ${fo}: sem foto</span></div>`}).join("");
  $("bigGrid").innerHTML=h;
  const pm=$("pMode").value,[a,fo]=$("pS").value.split("-").map(Number),A=$("pA").value,B=$("pB").value,gA=gcRows(A).find(r=>(r.amostra||1)===a&&(r.foto||1)===(fo||1)),gB=gcRows(B).find(r=>(r.amostra||1)===a&&(r.foto||1)===(fo||1));
  const nf=t=>`<div style="display:grid;place-items:center;color:#fff;height:100%">${esc(t)} · ponto ${a} · foto ${fo||1}: sem foto</div>`;
  $("lyA").innerHTML=imgOf(gA,pm==="mapa"?"mapa":"foto")||nf(A);$("lyB").innerHTML=imgOf(gB,pm==="foto"?"foto":"mapa")||nf(B);
  $("tgA").textContent=`${A}${gA?` · ${fmt(gA.cobertura_pct)}%`:""}`;$("tgA").style.background=COL[A];$("tgB").textContent=`${B}${gB?` · ${fmt(gB.cobertura_pct)}%`:""}`;$("tgB").style.background=COL[B];slide();
  renderComp();
}
/* ====================== quadros: planta individual e foto em grupo (1 foto por tratamento) ====================== */
const COMP=[["compI","individual","Planta individual"],["compG","grupo","Foto em grupo"]];
const fnTag=r=>r&&r.arquivo?`<span class="fn" title="${esc(r.arquivo)}">${esc(r.arquivo)}</span>`:"";
const compRows=tipo=>FC.filter(r=>r.fazenda_id===$("cF").value&&r.estadio===$("cE").value&&r.tipo===tipo);
function renderComp(){
  const fz=fazById($("cF").value),E=$("cE").value;
  for(const[pre,tipo,nome]of COMP){
    const rows=compRows(tipo),url=t=>{const r=rows.find(x=>x.tratamento===t);return r&&URL_[r.foto_path]};
    $(pre+"_ctx").textContent=fz&&E?`${prodById(fz.produtor_id)?.nome||""} · ${fz.nome} · ${E}`:"Escolha produtor, fazenda e estádio na Comparação lado a lado.";
    $(pre+"_grid").style.setProperty("--n",TR.length);
    $(pre+"_grid").innerHTML=TR.map(t=>`<div class="hd" style="background:${COL[t]}"><span>${esc(t)}</span><b>${nome}</b>${canUp()?`<span class="adds"><button type="button" class="add" data-cadd="${tipo}" data-t="${esc(t)}">${url(t)?"Trocar foto":"+ Adicionar foto"}</button></span>`:""}</div>`).join("")+
      TR.map(t=>{const r=rows.find(x=>x.tratamento===t),u=url(t);
        return u?`<div role="button" tabindex="0" class="cell tall" data-ct="${esc(t)}" data-ctipo="${tipo}"><img src="${esc(u)}" alt="${esc(nome)} · ${esc(t)}"><span class="bd">${esc(t)}</span>${delB("comp",r.id)}${rotB("comp",r.id)}${fnTag(r)}</div>`
          :`<div class="cell tall" style="cursor:default"><span class="nf">${esc(t)} · ${nome.toLowerCase()}: sem foto</span></div>`}).join("");
    for(const[k,d]of[["_A","Maxcel"],["_B","Controle"]]){const el=$(pre+k);if(!el.options.length){setSel(el,opts(TR.map(t=>({v:t,t}))));el.value=d}}
    const A=$(pre+"_A").value,B=$(pre+"_B").value,nf=t=>`<div class="nfc">${esc(t)}: sem foto</div>`;
    $(pre+"_lyA").innerHTML=url(A)?`<img src="${esc(url(A))}" alt="">`:nf(A);$(pre+"_lyB").innerHTML=url(B)?`<img src="${esc(url(B))}" alt="">`:nf(B);
    $(pre+"_tgA").textContent=A;$(pre+"_tgA").style.background=COL[A];$(pre+"_tgB").textContent=B;$(pre+"_tgB").style.background=COL[B];compSlide(pre)}
}
const compSlide=pre=>{const v=$(pre+"_rg").value;$(pre+"_lyA").style.clipPath=`inset(0 ${100-v}% 0 0)`;$(pre+"_hand").style.left=v+"%"};
let CQ=null;
async function shrinkJpg(file,max=1600){const img=await loadImg(file),sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");
  c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);c.getContext("2d").drawImage(img,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,"image/jpeg",0.9))}
$("compFile").addEventListener("change",async e=>{const f=e.target.files[0];e.target.value="";if(!f||!CQ)return;
  if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const fid=$("cF").value,E=$("cE").value,{tipo,t}=CQ,fz=fazById(fid),p=`comparacao/${fid}/${slug(E)}/${tipo}-${slug(t)}.jpg`;
  toast(`Enviando foto de ${t}…`);
  try{const jpg=await shrinkJpg(f);const{error:e1}=await SB.storage.from("fotos").upload(p,jpg,{upsert:true,contentType:"image/jpeg"});if(e1)throw e1;
    const dt=$("uD").value||null;
    const{error}=await SB.from("fotos_comparacao").upsert({fazenda_id:fid,tratamento_id:TRID[t],estadio:E,tipo,data:dt,dae:daysBetween(fz?.data_emergencia,dt),foto_path:p,arquivo:f.name,atualizado_em:new Date().toISOString()},{onConflict:"fazenda_id,tratamento_id,estadio,tipo"});if(error)throw error;
    toast(`Foto salva · ${t} · ${tipo==="grupo"?"foto em grupo":"planta individual"} · ${E}.`);await loadDB();
  }catch(err){toast("Não foi possível salvar: "+err.message,1)}});
for(const[pre]of COMP){
  $(pre+"_grid").addEventListener("click",e=>{const db=e.target.closest("button.del");if(db){e.stopPropagation();return delFoto(db)}
    const ab=e.target.closest("button[data-cadd]");if(ab){if(!$("cF").value||!$("cE").value)return toast("Escolha produtor, fazenda e estádio na Comparação lado a lado.",1);CQ={tipo:ab.dataset.cadd,t:ab.dataset.t};$("compFile").click();return}
    const c=e.target.closest(".cell[data-ct]");if(!c)return;$("lbImg").src=c.querySelector("img").src;
    $("lbCap").textContent=`${c.dataset.ct} · ${c.dataset.ctipo==="grupo"?"foto em grupo":"planta individual"} · ${$("cE").value}${c.querySelector(".fn")?" · "+c.querySelector(".fn").textContent:""}`;$("lb").hidden=false});
  for(const k of["_A","_B"])$(pre+k).addEventListener("change",renderComp);
  $(pre+"_rg").addEventListener("input",()=>compSlide(pre))}
const slide=()=>{const v=$("rg").value;$("lyA").style.clipPath=`inset(0 ${100-v}% 0 0)`;$("hand").style.left=v+"%"};
$("bigGrid").addEventListener("click",e=>{const ab=e.target.closest("button.add");if(ab){e.stopPropagation();if(ab.dataset.add==="grupo"){if(!$("cF").value||!$("cE").value)return toast("Escolha produtor, fazenda e estádio na Comparação lado a lado.",1);CQ={tipo:"grupo",t:ab.dataset.t};return $("compFile").click()}return quickAdd(ab.dataset.add,ab.dataset.t)}
  const gc=e.target.closest(".cell[data-ct]");if(gc){$("lbImg").src=gc.querySelector("img").src;$("lbCap").textContent=`${gc.dataset.ct} · foto em grupo · ${$("cE").value}${gc.querySelector(".fn")?" · "+gc.querySelector(".fn").textContent:""}`;$("lb").hidden=false;return}
  const db=e.target.closest("button.del");if(db){e.stopPropagation();return delFoto(db)}
  const pc=e.target.closest(".cell[data-pl]");if(pc){$("lbImg").src=pc.querySelector("img").src;$("lbCap").textContent=`${pc.dataset.pl} · plantas inteiras · ponto ${pc.dataset.pp} · foto ${pc.dataset.pf} · ${$("cE").value}${pc.querySelector(".fn")?" · "+pc.querySelector(".fn").textContent:""}`;$("lb").hidden=false;return}
  const c=e.target.closest(".cell[data-t]");if(!c)return;const g=gcRows(c.dataset.t).find(r=>(r.amostra||1)===+c.dataset.a&&(r.foto||1)===+(c.dataset.f||1));
  const u=URL_[$("cMode").value==="mapa"?g.mapa_path:g.foto_path];if(!u)return;$("lbImg").src=u;$("lbCap").textContent=`${g.tratamento} · ponto ${g.amostra||1} · foto ${g.foto||1} · ${g.estadio}${g.arquivo?" · "+g.arquivo:""} · grau de cover ${fmt(g.cobertura_pct)}%`;$("lb").hidden=false});
$("geral").addEventListener("click",e=>{const db=e.target.closest("button.del");if(db)return delFoto(db);if(!e.target.closest("[data-geral]"))return;$("lbImg").src=e.target.closest("[data-geral]").querySelector("img").src;$("lbCap").textContent="Foto geral · todas as parcelas";$("lb").hidden=false});
$("lb").addEventListener("click",()=>{$("lb").hidden=true;$("lbImg").src=""});

/* ====================== planilha base ====================== */
$("dlForm").addEventListener("submit",e=>{e.preventDefault();const pid=$("dP").value,E=$("dE").value,D=$("dD").value;const p=prodById(pid);
  const fz=FAZ.filter(f=>f.produtor_id===pid);if(!fz.length)return toast("Cadastre ao menos uma fazenda para este produtor.",1);
  const H=["Produtor","Fazenda","Tratamento","Estadio","Data","DAE","Ponto","Medicao","Altura_cm","Plantas_no_metro","Observacoes"],rows=[H];
  for(const f of fz)for(const t of TR)for(let pt=1;pt<=NPT;pt++)for(let k=1;k<=NPL;k++){const ex=PL.find(r=>r.fazenda_id===f.id&&r.tratamento===t&&r.estadio===E&&r.ponto===pt&&r.planta===k);
    rows.push([p.nome,f.nome,t,E,D||"",daysBetween(f.data_emergencia,D)??"",pt,k,ex?.altura_cm??"",ex?.estande_pl_m??"",""])}
  const ws=XLSX.utils.aoa_to_sheet(rows);ws["!cols"]=[22,22,12,9,12,6,7,9,11,16,30].map(w=>({wch:w}));ws["!autofilter"]={ref:`A1:K${rows.length}`};
  const ins=XLSX.utils.aoa_to_sheet([["Planilha base — Projeto Estruturação de Plantas (Grower)"],[""],["Produtor",p.nome],["Estádio",E],["Data",D||"(preencher na coluna Data)"],[""],
    ["Como preencher"],["• Cada tratamento tem 3 pontos amostrados. Em cada ponto há 5 medições (Medicao 1 a 5) = 15 linhas por tratamento."],["• Altura_cm: altura da planta n\u00ba 1 a 5 do ponto, do solo ao ápice, em centímetros."],
    ["• Plantas_no_metro: número de plantas contadas no 1º, 2º, 3º, 4º e 5º metro de linha do ponto (5 metros por ponto)."],["• O estande (plantas/m) do ponto é a média dos 5 metros; o do tratamento é a média dos 3 pontos."],["• Não altere as colunas Produtor, Fazenda, Tratamento, Ponto e Medicao."],
    ["• DAE é calculado pela data de emergência cadastrada; pode ser preenchido à mão."],["• Linhas sem altura e sem estande são ignoradas no envio."],[""],["Fazendas"],["Fazenda","Município","UF","Espaçamento (cm)","Emergência"],
    ...fz.map(f=>[f.nome,f.municipio||"",f.uf||"",f.espacamento_cm??"",f.data_emergencia||""])]);ins["!cols"]=[{wch:30},{wch:28},{wch:6},{wch:16},{wch:12}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Avaliacao");XLSX.utils.book_append_sheet(wb,ins,"Instrucoes");
  XLSX.writeFile(wb,`Planilha_${slug(p.nome)}_${E}${D?"_"+D:""}.xlsx`);toast("Planilha gerada.")});
$("fx").addEventListener("change",async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;
  if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  try{const wb=XLSX.read(await f.arrayBuffer(),{type:"array",cellDates:true});const sh=wb.Sheets["Avaliacao"]||wb.Sheets[wb.SheetNames[0]];
    const raw=XLSX.utils.sheet_to_json(sh,{defval:"",raw:true});const REQ=["Produtor","Fazenda","Tratamento","Estadio","Ponto","Medicao"],bad=[],rows=[];
    raw.forEach((r0,i)=>{const r={};for(const[k,v]of Object.entries(r0))r[String(k).trim()]=v instanceof Date?isoDate(v):typeof v==="string"?v.trim():v;
      if(r.Medicao==null||r.Medicao==="")r.Medicao=r.Planta;if(r.Ponto==null||r.Ponto==="")r.Ponto=r.Medicao!=null&&r.Medicao!==""?1:"";if(r.Plantas_no_metro===undefined)r.Plantas_no_metro=r.Estande_pl_m;
      r.Altura_cm=num(r.Altura_cm);r.Estande_pl_m=num(r.Plantas_no_metro);if(r.Altura_cm==null&&r.Estande_pl_m==null)return;
      const miss=REQ.filter(k=>r[k]===""||r[k]==null);if(!miss.length&&!TR.some(t=>t.toLowerCase().replace(/\s/g,"")===String(r.Tratamento).toLowerCase().replace(/\s/g,"")))return bad.push(`linha ${i+2}: tratamento "${r.Tratamento}" não faz parte do experimento (use ${TR.join(", ")})`);if(!miss.length&&(num(r.Ponto)<1||num(r.Ponto)>10||num(r.Medicao)<1||num(r.Medicao)>50))return bad.push(`linha ${i+2}: Ponto ou Medicao inválido`);if(miss.length)return bad.push(`linha ${i+2}: falta ${miss.join(", ")}`);
      if(r.Altura_cm!=null&&(r.Altura_cm<=0||r.Altura_cm>250))bad.push(`linha ${i+2}: altura ${r.Altura_cm} cm fora do esperado`);
      rows.push({Produtor:String(r.Produtor),Fazenda:String(r.Fazenda),Tratamento:String(r.Tratamento),Estadio:String(r.Estadio),Data:isoDate(r.Data),DAE:num(r.DAE),
        Ponto:num(r.Ponto),Planta:num(r.Medicao),Altura_cm:r.Altura_cm,Estande_pl_m:r.Estande_pl_m,Observacoes:r.Observacoes||""})});
    if(bad.length)return $("sendRes").innerHTML=`<b style="color:#c0392b">Corrija antes de enviar:</b><br>${bad.slice(0,8).map(esc).join("<br>")}`;
    if(!rows.length)return toast("Nenhuma linha com altura ou estande preenchidos.",1);
    $("sendRes").textContent=`Enviando ${rows.length} medições…`;let n=0;
    for(let i=0;i<rows.length;i+=400){const{data,error}=await SB.rpc("importar_plantas",{linhas:rows.slice(i,i+400)});if(error)throw error;n+=data}
    $("sendRes").textContent=`Pronto: ${n} medições gravadas.`;toast(`${n} medições gravadas.`);await loadDB();
  }catch(err){$("sendRes").innerHTML=`<b style="color:#c0392b">Envio interrompido:</b> ${esc(err.message)}`}});

/* ====================== edição on-line ====================== */
const trOrd=t=>TR.indexOf(t);
function fillEditSel(){setSel($("eP"),opts(prodOpts(),"Todos"));setSel($("eF"),opts(fazOpts($("eP").value),"Todas"));
  const ss=ordSt([...PL.map(r=>r.estadio),...GC.map(r=>r.estadio)]);setSel($("eE"),opts(ORD.filter(e=>ss.includes(e)).concat(ORD.filter(e=>!ss.includes(e))),"Todos"));
  if(!$("eE").dataset.init&&ss.length){$("eE").value=$("sE").value||ss.at(-1);$("eE").dataset.init=1}}
const edRows=()=>{const P=$("eP").value,F=$("eF").value,E=$("eE").value;
  return PL.filter(r=>(!P||r.produtor_id===P)&&(!F||r.fazenda_id===F)&&(!E||r.estadio===E)).sort((a,b)=>(a.produtor+a.fazenda).localeCompare(b.produtor+b.fazenda)||ORD.indexOf(a.estadio)-ORD.indexOf(b.estadio)||trOrd(a.tratamento)-trOrd(b.tratamento)||a.ponto-b.ponto||a.planta-b.planta)};
function renderEditar(){
  fillEditSel();const adm=PAPEL==="admin",rows=edRows();
  $("edPl").innerHTML=`<tr><th>Fazenda</th><th class="tl">Estádio</th><th class="tl">Tratamento</th><th>Ponto</th><th>Medição</th><th>Altura (cm)</th><th>Plantas no metro</th><th class="tl">Data</th><th>DAE</th><th class="tl">Observações</th>${adm?"<th></th>":""}</tr>`+
    (rows.length?rows.map(r=>`<tr data-id="${esc(r.id)}"><td>${esc(r.fazenda)}</td><td class="tl">${esc(r.estadio)}</td><td class="tl"><span class="dot" style="background:${COL[r.tratamento]}"></span>${esc(r.tratamento)}</td><td>${r.ponto}</td><td>${r.planta}</td>
      <td><input type="number" step="0.1" min="0" max="250" data-k="altura_cm" value="${r.altura_cm??""}"></td><td><input type="number" step="0.1" min="0" max="99" data-k="estande_pl_m" value="${r.estande_pl_m??""}"></td>
      <td class="tl"><input type="date" data-k="data" value="${esc(r.data||"")}"></td><td>${r.dae??"–"}</td><td class="tl"><input type="text" data-k="observacoes" value="${esc(r.observacoes||"")}"></td>
      ${adm?`<td><button class="mini" type="button" data-delpl="${esc(r.id)}">Excluir</button></td>`:""}</tr>`).join(""):`<tr><td colspan="11">Nenhuma medição neste filtro. Escolha fazenda e estádio e use “Criar linhas vazias”, ou envie a planilha.</td></tr>`);
  $("edInfo").textContent=`${rows.length} medição(ões)`;$("edSave").disabled=true;
  {const b=$("edDelAll"),S=evalSel();b.hidden=!adm;b.dataset.sure="";b.classList.remove("sure");b.textContent=S?`Excluir avaliação (${fazById(S.F)?.nome||""} · ${S.E})`:"Excluir avaliação (escolha fazenda e estádio)"}
  const P=$("eP").value,F=$("eF").value,E=$("eE").value,g=GC.filter(r=>(!P||r.produtor_id===P)&&(!F||r.fazenda_id===F)&&(!E||r.estadio===E)).sort((a,b)=>a.fazenda.localeCompare(b.fazenda)||ORD.indexOf(a.estadio)-ORD.indexOf(b.estadio)||trOrd(a.tratamento)-trOrd(b.tratamento)||(a.amostra||1)-(b.amostra||1)||(a.foto||1)-(b.foto||1));
  const gg=GER.filter(r=>(!F||r.fazenda_id===F)&&(!P||fazById(r.fazenda_id)?.produtor_id===P)&&(!E||r.estadio===E));
  const pp=PF.filter(r=>(!F||r.fazenda_id===F)&&(!P||r.produtor_id===P)&&(!E||r.estadio===E));
  const cc=FC.filter(r=>(!F||r.fazenda_id===F)&&(!P||r.produtor_id===P)&&(!E||r.estadio===E));
  $("edGc").innerHTML=`<tr><th>Foto</th><th class="tl">Fazenda</th><th class="tl">Estádio</th><th class="tl">Tratamento</th><th>Ponto · foto</th><th class="tl">Arquivo</th><th>Grau de cover</th><th class="tl">Data</th><th></th></tr>`+
    [...gg.map(r=>({...r,kind:"geral",fazenda:fazById(r.fazenda_id)?.nome||""})),...pp.map(r=>({...r,kind:"plantas"})),...cc.map(r=>({...r,kind:"comp"})),...g].map(r=>`<tr data-gid="${esc(r.id)}" data-kind="${r.kind||""}"><td>${URL_[r.foto_path]?`<img class="thumb" src="${esc(URL_[r.foto_path])}" alt="">`:"–"}</td><td class="tl">${esc(r.fazenda)}</td><td class="tl">${esc(r.estadio)}</td>
      <td class="tl">${r.kind==="geral"?"<b>Foto geral</b>":`<span class="dot" style="background:${COL[r.tratamento]}"></span>${esc(r.tratamento)}${r.kind==="plantas"?" · <b>plantas inteiras</b>":r.kind==="comp"?` · <b>${r.tipo==="grupo"?"foto em grupo":"planta individual"}</b>`:""}`}</td><td>${r.kind==="geral"||r.kind==="comp"?"–":`${r.kind==="plantas"?r.ponto||1:r.amostra||1} · ${r.foto||1}`}</td><td class="tl"><small>${esc(r.arquivo||"–")}</small></td><td>${r.kind==="plantas"||r.kind==="comp"?"–":fmt(r.cobertura_pct)+"%"}</td>
      <td class="tl"><input type="date" data-gk="data" value="${esc(r.data||"")}"></td><td>${adm?`<button class="mini" type="button" data-delgc="${esc(r.id)}">Excluir</button>`:""}</td></tr>`).join("")||`<tr><td colspan="9">Nenhuma foto neste filtro.</td></tr>`;
}
$("edPl").addEventListener("input",e=>{const tr=e.target.closest("tr[data-id]");if(!tr)return;tr.classList.add("dirty");
  const v=e.target.dataset.k==="altura_cm"?num(e.target.value):null;e.target.classList.toggle("err",v!=null&&(v<=0||v>250));
  const n=$("edPl").querySelectorAll("tr.dirty").length;$("edSave").disabled=!n;$("edInfo").textContent=`${n} linha(s) alterada(s)`});
$("edUndo").onclick=renderEditar;
function evalSel(){const F=$("eF").value,E=$("eE").value;if(!F||!E)return null;const m=r=>r.fazenda_id===F&&r.estadio===E;
  return{F,E,pl:PL.filter(m),gc:GC.filter(m),pf:PF.filter(m),ge:GER.filter(m),fc:FC.filter(m)}}
$("edDelAll").onclick=async()=>{const b=$("edDelAll");if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const S=evalSel();if(!S)return toast("Escolha a fazenda e o estádio da avaliação que quer excluir.",1);
  const nF=S.gc.length+S.pf.length+S.ge.length+S.fc.length;if(!S.pl.length&&!nF)return toast("Não há dados nesta fazenda e estádio.",1);
  if(b.dataset.sure!=="1"){b.dataset.sure="1";b.classList.add("sure");b.textContent=`Confirmar: apagar ${S.pl.length} medição(ões) e ${nF} foto(s) de ${fazById(S.F)?.nome||""} em ${S.E}`;return}
  b.disabled=true;
  try{for(const t of["plantas","fotos_cobertura","fotos_plantas","fotos_gerais","fotos_comparacao"]){const{error}=await SB.from(t).delete().eq("fazenda_id",S.F).eq("estadio",S.E);if(error)throw error}
    const paths=[...S.gc,...S.pf,...S.ge,...S.fc].flatMap(r=>[r.foto_path,r.mapa_path]).filter(Boolean);for(let i=0;i<paths.length;i+=100)await SB.storage.from("fotos").remove(paths.slice(i,i+100));
    toast(`Avaliação excluída: ${fazById(S.F)?.nome||""} · ${S.E}.`);await loadDB()}catch(err){toast("Não foi possível excluir: "+err.message,1)}finally{b.disabled=false}};
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
  const rows=[];for(const t of TR)for(let pt=1;pt<=NPT;pt++)for(let k=1;k<=NPL;k++)rows.push({fazenda_id:F,tratamento_id:TRID[t],estadio:E,ponto:pt,planta:k});
  const{error}=await SB.from("plantas").upsert(rows,{onConflict:"fazenda_id,tratamento_id,estadio,ponto,planta",ignoreDuplicates:true});if(error)return toast(error.message,1);
  toast("Linhas criadas. Preencha e salve.");await loadDB()};
$("edPl").addEventListener("click",async e=>{const b=e.target.closest("[data-delpl]");if(!b)return;if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Confirmar";return}
  if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);const{error}=await SB.from("plantas").delete().eq("id",b.dataset.delpl);if(error)return toast(error.message,1);toast("Medição excluída.");await loadDB()});
const KIND={"":{tab:"fotos_cobertura",arr:()=>GC},geral:{tab:"fotos_gerais",arr:()=>GER},plantas:{tab:"fotos_plantas",arr:()=>PF},comp:{tab:"fotos_comparacao",arr:()=>FC}};
$("edGc").addEventListener("change",async e=>{const tr=e.target.closest("tr[data-gid]");if(!tr||e.target.dataset.gk!=="data")return;if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const K=KIND[tr.dataset.kind||""],r=K.arr().find(x=>String(x.id)===tr.dataset.gid),dt=e.target.value||null;
  const{error}=await SB.from(K.tab).update({data:dt,dae:daysBetween(fazById(r.fazenda_id)?.data_emergencia,dt),atualizado_em:new Date().toISOString()}).eq("id",r.id);
  if(error)return toast(error.message,1);toast("Data atualizada.");await loadDB()});
$("edGc").addEventListener("click",async e=>{const b=e.target.closest("[data-delgc]");if(!b)return;if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Confirmar exclusão";return}
  if(MODE==="demo")return toast("No modo de exemplo nada é salvo.",1);
  const tr=b.closest("tr"),K=KIND[tr.dataset.kind||""],r=K.arr().find(x=>String(x.id)===b.dataset.delgc);
  const{error}=await SB.from(K.tab).delete().eq("id",r.id);if(error)return toast(error.message,1);
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
$("sP").addEventListener("change",e=>{const v=e.target.value;if(!v)SELP.clear();else e.target.checked?SELP.add(v):SELP.delete(v);if(SELP.size===PROD.length&&PROD.length>1)SELP.clear();
  fillProd();setSel($("sF"),opts(fazOptsM(),"Todas"));renderPainel()});
$("plCmp").addEventListener("change",renderPainel);
document.addEventListener("click",e=>{const b=e.target.closest(".legend [data-t]");if(b)togTr(b.dataset.t)});
$("sPb").addEventListener("click",e=>{e.stopPropagation();const o=$("sP").hidden;$("sP").hidden=!o;$("sPb").setAttribute("aria-expanded",String(o))});
document.addEventListener("click",e=>{if(!$("sP").hidden&&!e.target.closest("#sPw")){$("sP").hidden=true;$("sPb").setAttribute("aria-expanded","false")}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("sP").hidden){$("sP").hidden=true;$("sPb").focus()}});
for(const id of["sF","sE","locA"])$(id).addEventListener("change",renderPainel);
$("uP").addEventListener("change",()=>setSel($("uF"),opts(fazOpts($("uP").value))));
$("cP").addEventListener("change",()=>{setSel($("cF"),opts(fazOpts($("cP").value)));fillSelects();renderFotos()});
$("cF").addEventListener("change",()=>{fillSelects();renderFotos()});
for(const id of["cE","cMode","pA","pB","pS","pMode"])$(id).addEventListener("change",renderFotos);
$("rg").addEventListener("input",slide);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",renderPainel);
boot();
}
