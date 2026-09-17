(async function(){
  if(typeof BNStore!=='undefined') await BNStore.applyOverride('raw','raw');
  if(typeof BNStore!=='undefined') await BNStore.applyOverride('ferie','ferie');


/* =====================================================================
   MOTORE DATI CONDIVISO — un solo dataset grezzo alimenta le tre viste
   ===================================================================== */
const RAW = JSON.parse(document.getElementById('raw').textContent);
const YEARS = Object.keys(RAW).sort();
const LATEST = YEARS[YEARS.length-1];
const PREV = YEARS.length>1 ? YEARS[YEARS.length-2] : null;
const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MSHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const EXCLUDE_BUDGET = new Set(['COLLABORATORI']);

const FUNZIONI = (()=>{ const s=new Set();
  for(const y of YEARS) for(const m in RAW[y]) for(const r of RAW[y][m]) s.add(r.io);
  return [...s].sort(); })();

const nRec = YEARS.reduce((a,y)=>a+Object.values(RAW[y]).reduce((b,arr)=>b+arr.length,0),0);
document.getElementById('srcChip').innerHTML = '<b>'+nRec.toLocaleString('it-IT')+'</b> record · '+YEARS.join(' · ');

// ---- helpers ----
const eur = v => '€ '+Math.round(v).toLocaleString('it-IT');
const eurK = v => '€ '+(v/1000).toLocaleString('it-IT',{maximumFractionDigits:0})+'k';
const num0 = v => Math.round(v).toLocaleString('it-IT');
const pct = (v,d=1) => (v*100).toLocaleString('it-IT',{minimumFractionDigits:d,maximumFractionDigits:d})+'%';

function flat(year,{month=null,tip=null,io=null}={}){
  const out=[]; const Y=RAW[year]||{};
  const ms = month ? [month] : Object.keys(Y);
  for(const m of ms) for(const r of (Y[m]||[])){
    if(tip && r.tip!==tip) continue;
    if(io && r.io!==io) continue;
    out.push(r);
  }
  return out;
}
const MONTANTE=165;
function fteRec(r){ return (r.fte!=null)?r.fte:((r.tip==='Libero professionista')?Math.min(1,(r.ore||0)/MONTANTE):(r.ore||0)/MONTANTE); }
function fteFmt(v){ return (v||0).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1}); }
function cellFte(v){ return '<td class="num">'+fteFmt(v)+'</td>'; }
function cellDeltaFte(d){ if(d==null) return '<td class="num" style="color:var(--dim)">—</td>';
  const c=d>=0?'var(--pos)':'var(--neg)'; const s=d>=0?'+':'−';
  return '<td class="num" style="color:'+c+'">'+s+fteFmt(Math.abs(d))+'</td>'; }
function fteFmt(v){ return (v||0).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1}); }
function dFte(map,path,cur){ return (map&&map[path]!=null)?(cur-map[path]):null; }
function dFteCell(delta){ if(delta==null) return '<td class="num" style="color:var(--dim)">—</td>';
  const cls=delta>0.05?'var(--neg)':(delta<-0.05?'var(--pos)':'var(--dim)'); const s=delta>0?'+':'';
  return '<td class="num" style="color:'+cls+'">'+s+fteFmt(delta)+'</td>'; }
function priorFteMap(){ const py=String(+CE.anno-1); if(!RAW[py])return null;
  const pl=flat(py,{month:CE.mese||null,tip:CE.tip||null}); const pN=CE.mese?1:(availMonths(py).length||1);
  if(!pl.length)return null; const m={__T__:0};
  for(const r of pl){ const f=fteRec(r); m.__T__+=f; const a=r.io,b=r.io+'|'+r.agg,c=r.io+'|'+r.agg+'|'+r.lav;
    m[a]=(m[a]||0)+f; m[b]=(m[b]||0)+f; m[c]=(m[c]||0)+f; }
  for(const k in m) m[k]/=pN; return m; }
function tally(list){ let c=0,o=0,so=0,sc=0,ft=0,fe=0; const t=new Set();
  for(const r of list){ c+=r.costo||0; o+=r.ore||0; so+=r.sore||0; sc+=r.scos||0; fe+=r.ferie||0; ft+=fteRec(r); if(r.matr)t.add(r.matr); }
  return {costo:c,ore:o,sore:so,scos:sc,ferie:fe,teste:t.size,fte:ft};
}
function groupTally(list,field){ const g={};
  for(const r of list){ const k=r[field]||'—';
    let e=g[k]; if(!e){e=g[k]={costo:0,ore:0,sore:0,scos:0,ferie:0,fte:0,_t:new Set()};}
    e.costo+=r.costo||0; e.ore+=r.ore||0; e.sore+=r.sore||0; e.scos+=r.scos||0; e.ferie+=r.ferie||0; e.fte+=fteRec(r); if(r.matr)e._t.add(r.matr);
  }
  for(const k in g){ g[k].teste=g[k]._t.size; delete g[k]._t; }
  return g;
}
function availMonths(year){ return MONTHS.filter(m=>RAW[year]&&RAW[year][m]); }

/* =====================================================================
   VISTA 1 — COSTI EFFETTIVI (tabella gerarchica dal dato grezzo)
   ===================================================================== */
const CE = { anno:LATEST, mese:'', tip:'' , open:new Set() };
function ceInit(){
  const aS=document.getElementById('c-anno'); aS.innerHTML='';
  YEARS.slice().reverse().forEach(y=>{ const o=document.createElement('option');o.value=y;o.textContent=y;aS.appendChild(o); });
  aS.value=CE.anno;
  ceMonths();
  aS.onchange=()=>{CE.anno=aS.value;CE.open.clear();ceMonths();ceRender();};
  document.getElementById('c-mese').onchange=e=>{CE.mese=e.target.value;ceRender();};
  document.getElementById('c-tip').onchange=e=>{CE.tip=e.target.value;ceRender();};
  ceRender();
}
function ceMonths(){
  const mS=document.getElementById('c-mese'); const prev=CE.mese;
  mS.innerHTML='<option value="">Tutti i mesi disponibili</option>';
  availMonths(CE.anno).forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=m;mS.appendChild(o);});
  if([...mS.options].some(o=>o.value===prev)) mS.value=prev; else {CE.mese='';mS.value='';}
}
function ceRender(){
  const list=flat(CE.anno,{month:CE.mese||null,tip:CE.tip||null});
  const T=tally(list);
  // FTE stesso periodo anno precedente (per il delta)
  const py=String(+CE.anno-1);
  const hasPrev=YEARS.includes(py);
  const curMonths = CE.mese ? [CE.mese] : availMonths(CE.anno);
  const prevList = hasPrev ? [].concat(...curMonths.filter(m=>RAW[py]&&RAW[py][m]).map(m=>flat(py,{month:m,tip:CE.tip||null}))) : [];
  const nM = curMonths.length || 1;
  const nMp = hasPrev ? (curMonths.filter(m=>RAW[py]&&RAW[py][m]).length || 1) : 1;
  const pv={io:{},ia:{},ial:{}};
  for(const r of prevList){ const f=fteRec(r);
    pv.io[r.io]=(pv.io[r.io]||0)+f;
    pv.ia[r.io+'|'+r.agg]=(pv.ia[r.io+'|'+r.agg]||0)+f;
    pv.ial[r.io+'|'+r.agg+'|'+r.lav]=(pv.ial[r.io+'|'+r.agg+'|'+r.lav]||0)+f;
  }
  const Tprev=hasPrev? tally(prevList).fte : null;
  const k=document.getElementById('c-kpis');
  const straInc = T.costo? T.scos/T.costo : 0;
  k.innerHTML = kpi('Costo del lavoro',eur(T.costo))
    + kpi('Ore lavorate',num0(T.ore))
    + kpi('Costo straordinario',eur(T.scos),pct(straInc)+' del costo')
    + kpi('FTE', fteFmt(T.fte/nM), (Tprev!=null? ((T.fte/nM-Tprev/nMp)>=0?'+':'−')+fteFmt(Math.abs(T.fte/nM-Tprev/nMp))+' vs '+py : (CE.tip||'dipendenti + liberi prof.')));

  // gerarchia io > agg > lav
  const byIo=groupTally(list,'io');
  const funcRows=Object.entries(byIo).sort((a,b)=>b[1].costo-a[1].costo);
  const maxC=funcRows.length?funcRows[0][1].costo:1;
  const body=document.getElementById('c-body'); body.innerHTML='';
  for(const [io,agIo] of funcRows){
    body.appendChild(row(0,io,agIo,maxC,CE.open.has('io:'+io),'io:'+io, hasPrev?(pv.io[io]||0):null, nM, nMp));
    if(CE.open.has('io:'+io)){
      const sub=list.filter(r=>r.io===io);
      const byAgg=groupTally(sub,'agg');
      for(const [ag,agAg] of Object.entries(byAgg).sort((a,b)=>b[1].costo-a[1].costo)){
        const key='ag:'+io+'|'+ag;
        body.appendChild(row(1,ag,agAg,maxC,CE.open.has(key),key, hasPrev?(pv.ia[io+'|'+ag]||0):null, nM, nMp));
        if(CE.open.has(key)){
          const sub2=sub.filter(r=>r.agg===ag);
          const byLav=groupTally(sub2,'lav');
          for(const [lv,agLav] of Object.entries(byLav).sort((a,b)=>b[1].costo-a[1].costo)){
            body.appendChild(row(2,lv,agLav,maxC,null,null, hasPrev?(pv.ial[io+'|'+ag+'|'+lv]||0):null, nM, nMp));
          }
        }
      }
    }
  }
  const tr=document.createElement('tr'); tr.className='total';
  tr.innerHTML='<td>TOTALE</td>'+cellNum(T.costo)+cellNum(T.ore,0)+cellNum(T.ferie,0)+cellNum(T.sore,0)+cellNum(T.scos)
    +'<td class="num">'+pct(straInc)+'</td>'+cellFte(T.fte/nM)+cellDeltaFte(Tprev!=null?T.fte/nM-Tprev/nMp:null);
  body.appendChild(tr);
  fitLedger();
}
function row(lvl,label,d,maxC,open,key,prevFte,nM,nMp){
  const tr=document.createElement('tr'); tr.className='lvl'+lvl;
  const straInc=d.costo?d.scos/d.costo:0;
  const w=Math.max(2,Math.round(d.costo/maxC*100));
  const caret = key!==null ? '<span class="caret">▶</span>' : '<span style="display:inline-block;width:14px"></span>';
  const first = '<td class="'+(key!==null?'tw'+(open?' open':''):'')+'" '+(key!==null?'data-k="'+key+'"':'')+'>'+caret+' '+esc(label)+'</td>';
  tr.innerHTML=first
    +'<td class="bar-cell num"><span class="bar" style="width:'+w+'%"></span><span>'+eur(d.costo)+'</span></td>'
    +cellNum(d.ore,0)+cellNum(d.ferie,0)+cellNum(d.sore,0)+cellNum(d.scos)
    +'<td class="num">'+(straInc>0.001?'<span class="pill">'+pct(straInc)+'</span>':'—')+'</td>'
    +cellFte(d.fte/nM)+cellDeltaFte(prevFte==null?null:d.fte/nM-prevFte/nMp);
  return tr;
}
function cellNum(v,dec=0){ return '<td class="num">'+ (dec? '€ '+Math.round(v).toLocaleString('it-IT') : num0(v)) +'</td>'; }
function kpi(lab,val,sub){ return '<div class="kpi"><div class="k-lab">'+lab+'</div><div class="k-val">'+val+'</div>'+(sub?'<div class="k-sub">'+sub+'</div>':'')+'</div>'; }
function esc(s){ return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
document.getElementById('c-body').addEventListener('click',e=>{
  const t=e.target.closest('.tw'); if(!t)return;
  const k=t.dataset.k; if(CE.open.has(k))CE.open.delete(k); else CE.open.add(k);
  ceRender();
});

/* =====================================================================
   VISTA 2 — ANALITICA
   ===================================================================== */
let charts={};
const AN={anno:LATEST, da:0, a:0, cmp:'anno'};
function periodLabel(lo,hi){ return lo===hi ? MONTHS[lo] : MONTHS[lo]+'–'+MONTHS[hi]; }
function winMonths(year,lo,hi){ return MONTHS.slice(lo,hi+1).filter(m=>RAW[year]&&RAW[year][m]); }
function winTally(year,lo,hi,extra){
  return tally([].concat(...winMonths(year,lo,hi).map(m=>flat(year,Object.assign({month:m},extra||{})))));
}
function anInit(){
  const aY=document.getElementById('a-anno'); aY.innerHTML='';
  YEARS.slice().reverse().forEach(y=>{const o=document.createElement('option');o.value=y;o.textContent=y;aY.appendChild(o);});
  aY.value=AN.anno;
  anMonths();
  aY.onchange=()=>{AN.anno=aY.value;anMonths();analiticaRender();};
  document.getElementById('a-da').onchange=e=>{AN.da=+e.target.value;syncMonths();analiticaRender();};
  document.getElementById('a-a').onchange=e=>{AN.a=+e.target.value;syncMonths();analiticaRender();};
  document.getElementById('a-cmp').onchange=e=>{AN.cmp=e.target.value;analiticaRender();};
  analiticaRender();
}
function anMonths(){
  const am=availMonths(AN.anno);
  const daS=document.getElementById('a-da'), aS=document.getElementById('a-a');
  daS.innerHTML=''; aS.innerHTML='';
  am.forEach(m=>{const i=MONTHS.indexOf(m);
    daS.appendChild(new Option(m,i)); aS.appendChild(new Option(m,i));});
  AN.da=MONTHS.indexOf(am[0]); AN.a=MONTHS.indexOf(am[am.length-1]);
  daS.value=AN.da; aS.value=AN.a;
}
function syncMonths(){ // impedisce Da > A
  if(AN.da>AN.a){ const t=AN.da; AN.da=AN.a; AN.a=t;
    document.getElementById('a-da').value=AN.da; document.getElementById('a-a').value=AN.a; }
}
function analiticaRender(){
  const lo=Math.min(AN.da,AN.a), hi=Math.max(AN.da,AN.a);
  const Y=AN.anno;
  const cur=winTally(Y,lo,hi);

  // finestra di confronto
  let cmpT=null, cmpLabel='—';
  if(AN.cmp==='anno'){
    const py=String(+Y-1);
    if(YEARS.includes(py) && winMonths(py,lo,hi).length){ cmpT=winTally(py,lo,hi); cmpLabel=periodLabel(lo,hi)+' '+py; }
  } else {
    const L=hi-lo+1;
    if(lo>0){ const plo=Math.max(0,lo-L), phi=lo-1; if(winMonths(Y,plo,phi).length){ cmpT=winTally(Y,plo,phi); cmpLabel=periodLabel(plo,phi)+' '+Y; } }
  }
  const d=(a,b)=> (b? a/b-1 : null);

  document.getElementById('a-cmplabel').innerHTML =
    'Periodo: <b>'+periodLabel(lo,hi)+' '+Y+'</b> &nbsp;·&nbsp; confronto con <b>'+cmpLabel+'</b>'
    + (cmpT?'':' &nbsp;<span style="color:var(--neg)">(nessun periodo di confronto disponibile)</span>');

  const straInc=cur.costo?cur.scos/cur.costo:0;
  const straIncC=cmpT&&cmpT.costo?cmpT.scos/cmpT.costo:null;
  const cph=cur.ore?cur.costo/cur.ore:0;
  const dip=winTally(Y,lo,hi,{tip:'Dipendente'});
  const lp=winTally(Y,lo,hi,{tip:'Libero professionista'});

  document.getElementById('a-kpis').innerHTML =
    kpiD('Costo del lavoro',eur(cur.costo),d(cur.costo,cmpT&&cmpT.costo),'vs '+cmpLabel)
    + kpiD('Ore lavorate',num0(cur.ore),d(cur.ore,cmpT&&cmpT.ore),'vs confronto')
    + kpi('Incidenza straordinario',pct(straInc), straIncC!=null?((straInc>=straIncC?'+':'')+pct(straInc-straIncC,1)+' vs confronto'):'—')
    + kpi('Costo medio orario','€ '+cph.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2}))
    + kpi('Costo dipendenti',eur(dip.costo), pct(cur.costo?dip.costo/cur.costo:0)+' del totale')
    + kpi('Costo liberi prof.',eur(lp.costo), pct(cur.costo?lp.costo/cur.costo:0)+' del totale');

  // andamento mensile + progressivo (anno selezionato)
  const am=availMonths(Y);
  const monthly=am.map(m=>tally(flat(Y,{month:m})).costo);
  let run=0; const cumul=monthly.map(v=>run+=v);
  const inWin=am.map(m=>{const i=MONTHS.indexOf(m);return i>=lo&&i<=hi;});
  mkChart('a-trend','bar',{
    labels:am.map(m=>m.slice(0,3)),
    datasets:[
      {label:'Costo mensile',data:monthly,yAxisID:'y',
        backgroundColor:am.map((m,i)=>inWin[i]?'#D19A3E':'rgba(209,154,62,.28)'),order:2},
      {type:'line',label:'Progressivo (cumulato)',data:cumul,yAxisID:'y1',
        borderColor:'#5AA783',backgroundColor:'transparent',tension:.3,borderWidth:2,pointRadius:2,order:1}
    ]},{plugins:{legend:{labels:{color:'#9DB1AB'}}},
      scales:{
        x:{ticks:{color:'#9DB1AB'},grid:{display:false}},
        y:{position:'left',ticks:{color:'#7d918b',callback:v=>v>=1000?(v/1000)+'k':v},grid:{color:'rgba(255,255,255,.05)'}},
        y1:{position:'right',ticks:{color:'#5AA783',callback:v=>v>=1000?(v/1000)+'k':v},grid:{display:false}}
      }});

  // costo per funzione (finestra) dip vs lp
  const funcs=FUNZIONI;
  const dipF=funcs.map(io=>winTally(Y,lo,hi,{io,tip:'Dipendente'}).costo);
  const lpF=funcs.map(io=>winTally(Y,lo,hi,{io,tip:'Libero professionista'}).costo);
  const ord=funcs.map((io,i)=>[io,dipF[i]+lpF[i],i]).sort((a,b)=>b[1]-a[1]);
  mkChart('a-func','bar',{
    labels:ord.map(o=>o[0]),
    datasets:[
      {label:'Dipendenti',data:ord.map(o=>dipF[o[2]]),backgroundColor:'#D19A3E',stack:'s'},
      {label:'Liberi prof.',data:ord.map(o=>lpF[o[2]]),backgroundColor:'#5A6B78',stack:'s'}
    ]},{indexAxis:'y',plugins:{legend:{labels:{color:'#9DB1AB'}}},scales:axes(false,true)});

  // mix doughnut (finestra)
  mkChart('a-mix','doughnut',{
    labels:['Dipendenti','Liberi professionisti'],
    datasets:[{data:[dip.costo,lp.costo],backgroundColor:['#D19A3E','#5A6B78'],borderColor:'#152926',borderWidth:2}]
  },{plugins:{legend:{position:'bottom',labels:{color:'#9DB1AB',padding:14}}},cutout:'62%'});

  // incidenza straordinario per funzione (finestra, dipendenti)
  const straF=funcs.map(io=>{const t=winTally(Y,lo,hi,{io,tip:'Dipendente'});return [io,t.costo?t.scos/t.costo:0];})
    .filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,10);
  mkChart('a-stra','bar',{
    labels:straF.map(o=>o[0]),
    datasets:[{label:'% straordinario',data:straF.map(o=>o[1]*100),backgroundColor:'#C25B44'}]
  },{indexAxis:'y',plugins:{legend:{display:false}},scales:axes(false,true,'%')});
}
function kpiD(lab,val,delta,sub){
  let d;
  if(delta==null){ d='<span class="delta" style="color:var(--dim)">—</span>'; }
  else { const cls=delta>=0?'up':'down';
    d='<span class="delta '+cls+'">'+Math.abs(delta*100).toLocaleString('it-IT',{maximumFractionDigits:1})+'%</span>'; }
  return '<div class="kpi"><div class="k-lab">'+lab+'</div><div class="k-val">'+val+'</div><div class="k-sub">'+d+' '+sub+'</div></div>';
}
function axes(money,horiz,suffix){
  const fmt=v=> suffix==='%'? v+'%' : (horiz||money? (v>=1000? (v/1000)+'k':v):v);
  const val={ticks:{color:'#7d918b',callback:fmt},grid:{color:'rgba(255,255,255,.05)'}};
  const cat={ticks:{color:'#9DB1AB'},grid:{display:false}};
  return horiz? {x:val,y:cat} : {y:val,x:cat};
}
function mkChart(id,type,data,opts){
  if(charts[id])charts[id].destroy();
  charts[id]=new Chart(document.getElementById(id),{type,data,options:Object.assign({
    responsive:true,maintainAspectRatio:false},opts)});
}

/* =====================================================================
   VISTA 3 — BUDGET (base 12 mesi blend + proiezione)
   ===================================================================== */
function refYear(){ // anno di riferimento per le stime: il più recente con mesi
  if(availMonths(LATEST).length) return LATEST;
  if(PREV && availMonths(PREV).length) return PREV;
  return LATEST;
}
function monthlyAvgPerFunc(year){ // media mensile per funzione (dipendenti, funzioni budget)
  const ms=availMonths(year); const out={};
  for(const io of FUNZIONI){ if(EXCLUDE_BUDGET.has(io))continue;
    let c=0,o=0,so=0,sc=0;
    for(const m of ms){ const t=tally(flat(year,{month:m,io,tip:'Dipendente'})); c+=t.costo;o+=t.ore;so+=t.sore;sc+=t.scos; }
    const n=ms.length||1;
    out[io]={costo:c/n,ore:o/n,sore:so/n,scos:sc/n};
  }
  return out;
}
function budgetBase(){
  const ref=refYear();
  const avg=monthlyAvgPerFunc(ref);
  // risoluzione fonte mese per mese
  const ribbon=MONTHS.map(m=>{
    if(RAW[LATEST]&&RAW[LATEST][m]) return {m,src:'attuale',yr:LATEST};
    if(PREV&&RAW[PREV]&&RAW[PREV][m]) return {m,src:'fallback',yr:PREV};
    return {m,src:'stimato',yr:null};
  });
  const funz={}; FUNZIONI.filter(io=>!EXCLUDE_BUDGET.has(io)).forEach(io=>funz[io]={costo:0,ore:0,sore:0,scos:0});
  for(const {m,src,yr} of ribbon){
    for(const io in funz){
      let v;
      if(src==='stimato'){ v=avg[io]||{costo:0,ore:0,sore:0,scos:0}; }
      else { v=tally(flat(yr,{month:m,io,tip:'Dipendente'})); }
      funz[io].costo+=v.costo; funz[io].ore+=v.ore; funz[io].sore+=v.sore; funz[io].scos+=v.scos;
    }
  }
  const tot=Object.values(funz).reduce((a,f)=>a+f.costo,0);
  // deriva osservata: mesi comuni latest vs prev (dipendenti, funzioni budget)
  let drift=0;
  if(PREV){
    const common=availMonths(LATEST).filter(m=>RAW[PREV]&&RAW[PREV][m]);
    let cl=0,cp=0;
    for(const m of common) for(const io in funz){
      cl+=tally(flat(LATEST,{month:m,io,tip:'Dipendente'})).costo;
      cp+=tally(flat(PREV,{month:m,io,tip:'Dipendente'})).costo;
    }
    drift = cp? cl/cp-1 : 0;
  }
  return {ribbon,funz,tot,drift,ref};
}
const BUD = budgetBase();
let driftUser = null;
function budgetInit(){
  // ribbon
  const rb=document.getElementById('b-ribbon'); rb.innerHTML='';
  BUD.ribbon.forEach((r,i)=>{
    const d=document.createElement('div'); d.className='rib '+r.src;
    d.innerHTML='<span class="rm">'+MSHORT[i]+'</span><span class="ry">'+(r.yr||'stima')+'</span>';
    rb.appendChild(d);
  });
  const baseYr = (parseInt(BUD.ref)+ (availMonths(LATEST).length===12?0:0)); // etichetta anno base
  const labelBase = 'Anno base '+BUD.ref;
  document.getElementById('b-yr1').textContent = BUD.ref;
  const H=[+BUD.ref+1,+BUD.ref+2,+BUD.ref+3,+BUD.ref+4];
  ['b-h1','b-h2','b-h3','b-h4'].forEach((id,i)=>document.getElementById(id).textContent=H[i]);
  // slider
  const sl=document.getElementById('b-drift');
  driftUser = +(BUD.drift*100).toFixed(1);
  sl.value=driftUser;
  sl.oninput=()=>{driftUser=+sl.value;budgetRender();};
  budgetRender();
}
function budgetRender(){
  const g=driftUser/100;
  const baseTot=BUD.tot;
  const H=[+BUD.ref+1,+BUD.ref+2,+BUD.ref+3,+BUD.ref+4];
  const proj=H.map((y,i)=>baseTot*Math.pow(1+g,i+1));
  const straTot=Object.values(BUD.funz).reduce((a,f)=>a+f.scos,0);
  const estMonths=BUD.ribbon.filter(r=>r.src==='stimato').length;

  document.getElementById('b-kpis').innerHTML =
    kpi('Base annua '+BUD.ref,eur(baseTot),'12 mesi · solo dipendenti')
    + kpi('Deriva osservata',pct(BUD.drift), 'crescita '+PREV+'→'+LATEST+' (periodo comune)')
    + kpi('Proiezione '+H[3],eur(proj[3]), 'a deriva '+pct(g))
    + kpi('Mesi stimati',estMonths+' / 12', estMonths?'in attesa del 2º semestre':'anno completo');

  // tabella per funzione
  const rows=Object.entries(BUD.funz).sort((a,b)=>b[1].costo-a[1].costo);
  const body=document.getElementById('b-body'); body.innerHTML='';
  for(const [io,f] of rows){
    const pr=H.map((y,i)=>f.costo*Math.pow(1+g,i+1));
    const tr=document.createElement('tr'); tr.className='lvl0';
    tr.innerHTML='<td>'+esc(io)+'</td>'+cellNum(f.costo)+pr.map(v=>cellNum(v)).join('');
    body.appendChild(tr);
  }
  const trT=document.createElement('tr'); trT.className='total';
  trT.innerHTML='<td>TOTALE</td>'+cellNum(baseTot)+proj.map(v=>cellNum(v)).join('');
  body.appendChild(trT);

  // grafici
  mkChart('b-proj','bar',{
    labels:[BUD.ref+' (base)',...H],
    datasets:[{label:'Costo del lavoro',data:[baseTot,...proj],
      backgroundColor:['#5A6B78','#D19A3E','#D19A3E','#D19A3E','#D19A3E']}]
  },{plugins:{legend:{display:false}},scales:axes(true)});
  const rf=Object.entries(BUD.funz).sort((a,b)=>b[1].costo-a[1].costo);
  mkChart('b-func','bar',{
    labels:rf.map(o=>o[0]),
    datasets:[{label:'Base',data:rf.map(o=>o[1].costo),backgroundColor:'#D19A3E'}]
  },{indexAxis:'y',plugins:{legend:{display:false}},scales:axes(false,true)});

  document.getElementById('b-note').innerHTML =
    '<b>Come leggere questa base.</b> I mesi presenti nei costi effettivi ('+availMonths(LATEST).join(', ')+' '+LATEST
    +') sono usati come dato attuale; i mesi mancanti sono stimati dalla media dei mesi disponibili e segnalati in rosso nel nastro dati. '
    +'Voci non ricavabili dai costi effettivi (indennità, non ricorrente, ore contrattuali, turnover) non entrano in questa proiezione, che si basa sul solo costo osservato. '
    +'Quando aggiungerai il 2º semestre al file, quei mesi passeranno automaticamente da "stimato" ad "attuale" e la base si ricalcolerà da sola.';
}

/* =====================================================================
   ROUTING VISTE
   ===================================================================== */
let built={costi:false,analitica:false,budget:false,yoy:false};
function activate(v){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
  document.getElementById('v-'+v).classList.add('active');
  if(!built[v]){
    if(v==='costi')ceInit();
    if(v==='analitica'){ const fr=document.getElementById('fr-analitica'); fr.src=fr.dataset.file; }
    if(v==='budget'){ const fr=document.getElementById('fr-budget'); fr.src=fr.dataset.file; }
    if(v==='yoy'){ const fr=document.getElementById('fr-yoy'); fr.src=fr.dataset.file; }
    if(v==='ferie')feInit();
    built[v]=true;
  }
  if(v==='costi') requestAnimationFrame(fitLedger);
  if(v==='ferie') requestAnimationFrame(fitLedgerFe);
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.view)));

// adatta l'altezza della tabella Costi allo spazio disponibile (scroll interno, intestazione ancorata)
function fitLedger(){
  const l=document.querySelector('#v-costi .ledger');
  if(!l || !document.getElementById('v-costi').classList.contains('active')) return;
  const top=l.getBoundingClientRect().top;
  l.style.maxHeight=Math.max(280, window.innerHeight-top-24)+'px';
}
window.addEventListener('resize', fitLedger);

/* ============ FERIE RESIDUE ============ */
const _FEP = JSON.parse(document.getElementById('ferie').textContent);
const FERIE = _FEP.rows||_FEP;
const FE_AGG = _FEP.aggiornato||'';
const FE = { open:new Set(), q:'' };
const num2 = v => Number(v).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
const cellOre = v => '<td class="num">'+num2(v)+'</td>';
function feTree(){
  const t={};
  for(const r of FERIE){
    const io=t[r.io]||(t[r.io]={ore:0,val:0,fruito:0,resAp:0,ch:{}}); io.ore+=r.ore; io.val+=r.val; io.fruito+=(r.fruito||0); io.resAp+=(r.resAp||0);
    const ag=io.ch[r.agg]||(io.ch[r.agg]={ore:0,val:0,fruito:0,resAp:0,ch:{}}); ag.ore+=r.ore; ag.val+=r.val; ag.fruito+=(r.fruito||0); ag.resAp+=(r.resAp||0);
    const lv=ag.ch[r.lav]||(ag.ch[r.lav]={ore:0,val:0,fruito:0,resAp:0,ch:{}}); lv.ore+=r.ore; lv.val+=r.val; lv.fruito+=(r.fruito||0); lv.resAp+=(r.resAp||0);
    const cc=lv.ch[r.cdc]||(lv.ch[r.cdc]={ore:0,val:0,fruito:0,resAp:0,ch:{}}); cc.ore+=r.ore; cc.val+=r.val; cc.fruito+=(r.fruito||0); cc.resAp+=(r.resAp||0);
    cc.ch[r.matr]={ore:r.ore,val:r.val,fruito:(r.fruito||0),resAp:(r.resAp||0),dip:r.dip,leaf:true};
  }
  return t;
}
function feRow(level,label,node,key,open,totVal){
  const tr=document.createElement('tr'); tr.className='lvl'+Math.min(level,2)+(node.leaf?' feleaf':'');
  const caret = key!==null ? '<span class="caret">\u25B6</span>' : '<span style="display:inline-block;width:14px"></span>';
  const pad = 8 + level*20;
  const first='<td class="'+(key!==null?'tw'+(open?' open':''):'')+'" '+(key!==null?'data-k="'+esc(key)+'"':'')+' style="padding-left:'+pad+'px">'+caret+' '+esc(label)+'</td>';
  const quota = totVal? node.val/totVal : 0;
  tr.innerHTML=first+cellOre(node.resAp||0)+cellOre(node.ore)+cellOre(node.fruito||0)+'<td class="num">'+eur(node.val)+'</td><td class="num">'+(quota>0.0005?pct(quota):'\u2014')+'</td>';
  return tr;
}
function feRender(){
  const T=feTree();
  let totOre=0,totVal=0,totFruito=0,totResAp=0; for(const io in T){totOre+=T[io].ore; totVal+=T[io].val; totFruito+=T[io].fruito||0; totResAp+=T[io].resAp||0;}
  const nDip=FERIE.length||1;
  document.getElementById('fe-kpis').innerHTML =
    kpi('Ore residue totali',num2(totOre)) +
    kpi('Fruito anno totale',num2(totFruito),'ferie+ex fest. fruite nel 2026') +
    kpi('Media ore / dip.',num2(totOre/nDip)) +
    kpi('Valore residuo',eur(totVal),'lordo + contributi + INAIL') +
    kpi('Valore medio / dip.',eur(totVal/nDip)) +
    kpi('Dipendenti',num0(FERIE.length));
  var _fd=document.getElementById('fe-data'); if(_fd) _fd.textContent=FE_AGG||'—';
  const body=document.getElementById('fe-body'); body.innerHTML='';
  if(FE.q){
    const q=FE.q;
    const matches=FERIE.filter(r=>((r.dip||'').toLowerCase().includes(q)||(r.matr||'').toLowerCase().includes(q))).sort((a,b)=>b.val-a.val);
    if(!matches.length){
      const tr=document.createElement('tr');
      tr.innerHTML='<td colspan="6" style="text-align:center;color:var(--dim);padding:16px">Nessun dipendente trovato per \u201C'+esc(FE.q)+'\u201D</td>';
      body.appendChild(tr);
    } else {
      matches.forEach(r=>{
        const tr=document.createElement('tr'); tr.className='feleaf';
        const ctx='<span style="color:var(--dim);font-weight:400;font-size:11px"> \u00B7 '+esc(r.io)+' \u203A '+esc(r.agg)+' \u203A '+esc(r.lav)+'</span>';
        const quota=totVal? r.val/totVal:0;
        tr.innerHTML='<td style="padding-left:8px"><strong>'+esc(r.dip)+'</strong>'+ctx+'</td>'+cellOre(r.resAp||0)+cellOre(r.ore)+cellOre(r.fruito||0)+'<td class="num">'+eur(r.val)+'</td><td class="num">'+(quota>0.0005?pct(quota):'\u2014')+'</td>';
        body.appendChild(tr);
      });
      const so=matches.reduce((a,r)=>a+r.ore,0), sf=matches.reduce((a,r)=>a+(r.fruito||0),0), sv=matches.reduce((a,r)=>a+r.val,0), sap=matches.reduce((a,r)=>a+(r.resAp||0),0);
      const tt=document.createElement('tr'); tt.className='total';
      tt.innerHTML='<td>TOTALE ('+matches.length+' dip.)</td>'+cellOre(sap)+cellOre(so)+cellOre(sf)+'<td class="num">'+eur(sv)+'</td><td class="num">'+(totVal?pct(sv/totVal):'\u2014')+'</td>';
      body.appendChild(tt);
    }
    fitLedgerFe();
    return;
  }
  const out=[];
  function walk(node,level,path,label){
    const hasCh=node.ch && Object.keys(node.ch).length>0;
    const open=FE.open.has(path);
    out.push(feRow(level,label,node,hasCh?path:null,open,totVal));
    if(hasCh && open){
      Object.entries(node.ch).sort((a,b)=>b[1].val-a[1].val).forEach(([k,ch])=>walk(ch,level+1,path+'||'+k, ch.leaf?ch.dip:k));
    }
  }
  Object.entries(T).sort((a,b)=>b[1].val-a[1].val).forEach(([io,node])=>walk(node,0,'io:'+io,io));
  out.forEach(tr=>body.appendChild(tr));
  const tr=document.createElement('tr'); tr.className='total';
  tr.innerHTML='<td>TOTALE</td>'+cellOre(totResAp)+cellOre(totOre)+cellOre(totFruito)+'<td class="num">'+eur(totVal)+'</td><td class="num">100%</td>';
  body.appendChild(tr);
  fitLedgerFe();
}
document.getElementById('fe-search').addEventListener('input',e=>{ FE.q=e.target.value.trim().toLowerCase(); feRender(); });
document.getElementById('fe-body').addEventListener('click',e=>{
  const t=e.target.closest('.tw'); if(!t)return;
  const k=t.dataset.k; if(FE.open.has(k))FE.open.delete(k); else FE.open.add(k);
  feRender();
});
function fitLedgerFe(){
  const l=document.querySelector('#v-ferie .ledger');
  if(!l || !document.getElementById('v-ferie').classList.contains('active')) return;
  const top=l.getBoundingClientRect().top;
  l.style.maxHeight=Math.max(280, window.innerHeight-top-24)+'px';
}
window.addEventListener('resize', fitLedgerFe);
function feInit(){ FE.open.clear(); FE.q=''; var _s=document.getElementById('fe-search'); if(_s)_s.value=''; feRender(); }

activate('costi');

})();
