(async function(){
  if(typeof BNStore!=='undefined') await BNStore.applyOverride('ds','ds');


/* ============ DATI & STATO ============ */
const DS = JSON.parse(document.getElementById('ds').textContent);
const ROWS = DS.rows;
const PERIODS = {
  prog: {label:'Progressivo Gen–Mag', months:['Gennaio','Febbraio','Marzo','Aprile','Maggio']},
  Gennaio:{label:'Gennaio',months:['Gennaio']},
  Febbraio:{label:'Febbraio',months:['Febbraio']},
  Marzo:{label:'Marzo',months:['Marzo']},
  Aprile:{label:'Aprile',months:['Aprile']},
  Maggio:{label:'Maggio',months:['Maggio']},
};
const state={period:'prog',io:'',cdc:[],rep:'',man:'',matr:'',tab:'cost',sort:{col:null,dir:-1}};
const YMain=2026, YComp=2025;

/* ============ HELPERS ============ */
const eur=n=>'€ '+Math.round(n).toLocaleString('it-IT');
const eur2=n=>'€ '+n.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
const num0=n=>Math.round(n).toLocaleString('it-IT');
const num1=n=>n.toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1});
const pct1=n=>(n*100).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const MONTHS12=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
function periodMonthsAvail(){return MONTHS12.filter(m=>ROWS.some(r=>r.y===YMain&&r.m===m));}
function rangeMonths(){var cm=periodMonthsAvail();var lo=MONTHS12.indexOf(state.da),hi=MONTHS12.indexOf(state.a);if(lo<0)lo=0;if(hi<0)hi=lo;if(lo>hi){var t=lo;lo=hi;hi=t;}return MONTHS12.slice(lo,hi+1).filter(m=>cm.includes(m));}
function perLabel(){return state.da===state.a?state.da:(state.da+'\u2013'+state.a);}
function months(){return rangeMonths();}
function matchH(r){
  if(state.tip && r.tip!==state.tip) return false;
  if(state.io && r.io!==state.io) return false;
  if(!inSet(state.cdc,r.agg)) return false;
  if(state.rep && r.lav!==state.rep) return false;
  if(state.man && r.man!==state.man) return false;
  if(state.matr && r.matr!==state.matr) return false;
  return true;
}
function rowsFor(year,mset){
  const ms=mset||months();
  return ROWS.filter(r=>r.y===year && ms.includes(r.m) && matchH(r));
}
function agg(rows){
  const a={costo:0,ord:0,eff:0,stra:0,magg:0,ass_nc:0,ferie:0,mal:0,ass_r:0,ass_nr:0,imp_stra:0,imp_magg:0,ind:0,nonric:0,fte:0,n:new Set()};
  for(const r of rows){
    a.costo+=r.costo;a.ord+=r.ord;a.eff+=r.eff;a.stra+=r.stra;a.magg+=r.magg;
    a.ass_nc+=r.ass_nc;a.ferie+=r.ferie;a.mal+=r.mal;a.ass_r+=r.ass_r;a.ass_nr+=r.ass_nr;
    a.imp_stra+=r.imp_stra;a.imp_magg+=r.imp_magg;a.ind+=(r.ind||0);a.nonric+=(r.nonric||0);a.fte+=r.fte;a.n.add(r.matr);
  }
  const nm=months().length;
  a.base=a.costo-a.imp_stra-a.imp_magg-a.ind-a.nonric; // retribuzione base (ordinario+fissi)
  a.headcount=a.n.size;
  a.fteAvg=a.fte/nm;                       // FTE medio mensile del periodo
  a.teoriche=a.ord+a.ferie+a.mal+a.ass_r+a.ass_nr+a.ass_nc; // ore potenziali
  a.costoFte=a.fte>0?a.costo/a.fte:0;       // costo medio mensile per FTE
  a.costoOra=a.eff>0?a.costo/a.eff:0;       // costo per ora effettiva
  a.pStra=a.ord>0?a.stra/a.ord:0;           // % straord su ordinario
  a.pMal=a.teoriche>0?a.mal/a.teoriche:0;
  a.pFerie=a.teoriche>0?a.ferie/a.teoriche:0;
  a.pAssTot=a.teoriche>0?(a.mal+a.ferie+a.ass_r+a.ass_nr+a.ass_nc)/a.teoriche:0;
  a.effRatio=a.ord>0?a.eff/a.ord:0;
  return a;
}
function deltaPct(cur,prev){if(prev===0)return null;return (cur-prev)/Math.abs(prev);}

/* which field to group breakdown by, given drill state */
function groupLevel(){
  if(state.matr) return null;
  if(state.man) return {key:'dip',label:'Dipendente'};
  if(state.rep||state.cdc.length) return {key:'man',label:'Mansione'};
  if(state.io) return {key:'cdc',label:'Struttura'};
  return {key:'io',label:'Funzione / Area'};
}
function groupedAgg(){
  const gl=groupLevel(); if(!gl) return null;
  const cur=rowsFor(YMain), prev=rowsFor(YComp);
  const m={};
  const push=(r,yr)=>{const k=r[gl.key]||'—';(m[k]=m[k]||{cur:[],prev:[]})[yr].push(r);};
  cur.forEach(r=>push(r,'cur')); prev.forEach(r=>push(r,'prev'));
  const out=[];
  for(const k in m){out.push({key:k,cur:agg(m[k].cur),prev:agg(m[k].prev)});}
  return {level:gl,items:out};
}

/* ============ DROPDOWN POPULATION ============ */
function opts(sel,vals,cur,allLabel){
  sel.innerHTML='';
  const o0=document.createElement('option');o0.value='';o0.textContent=allLabel;sel.appendChild(o0);
  vals.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;if(v===cur)o.selected=true;sel.appendChild(o);});
}
function inSet(arr,v){return !arr.length||arr.indexOf(v)>=0;}
function multiOpts(sel,vals,curArr){
  sel.innerHTML='';
  vals.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;if(curArr.indexOf(v)>=0)o.selected=true;sel.appendChild(o);});
}
function distinct(field,filterFn){
  const s=new Set();
  ROWS.forEach(r=>{if(filterFn(r))s.add(r[field]);});
  return [...s].filter(Boolean).sort((a,b)=>a.localeCompare(b,'it'));
}
function buildFilters(){
  var cm=periodMonthsAvail();
  if(!state.da||!cm.includes(state.da))state.da=cm[0];
  if(!state.a||!cm.includes(state.a))state.a=cm[cm.length-1];
  state.period=perLabel();
  var _da=document.getElementById('f_period'),_a=document.getElementById('f_perTo');
  _da.innerHTML='';_a.innerHTML='';
  cm.forEach(function(m){var o1=document.createElement('option');o1.value=m;o1.textContent=m;if(m===state.da)o1.selected=true;_da.appendChild(o1);var o2=document.createElement('option');o2.value=m;o2.textContent=m;if(m===state.a)o2.selected=true;_a.appendChild(o2);});
  opts(document.getElementById('f_tip'),['Dipendente','Libero professionista'],state.tip||'','Tutti i rapporti');
  opts(document.getElementById('f_io'),distinct('io',()=>true),state.io,'Tutte le funzioni');
  multiOpts(document.getElementById('f_cdc'),distinct('agg',r=>!state.io||r.io===state.io),state.cdc);
  opts(document.getElementById('f_rep'),distinct('lav',r=>(!state.io||r.io===state.io)&&inSet(state.cdc,r.agg)),state.rep,'Tutti i reparti effettivi');
  opts(document.getElementById('f_man'),distinct('man',r=>(!state.io||r.io===state.io)&&inSet(state.cdc,r.agg)&&(!state.rep||r.lav===state.rep)),state.man,'Tutte le mansioni');
  // dipendenti: label = "Cognome (matricola)"
  const dsel=document.getElementById('f_matr');
  const dips=ROWS.filter(r=>(!state.io||r.io===state.io)&&inSet(state.cdc,r.agg)&&(!state.rep||r.lav===state.rep)&&(!state.man||r.man===state.man));
  const seen={};dips.forEach(r=>{seen[r.matr]=r.dip;});
  dsel.innerHTML='';const o0=document.createElement('option');o0.value='';o0.textContent='Tutti i dipendenti';dsel.appendChild(o0);
  Object.entries(seen).sort((a,b)=>a[1].localeCompare(b[1],'it')).forEach(([mt,nm])=>{const o=document.createElement('option');o.value=mt;o.textContent=nm+' ('+mt+')';if(mt===state.matr)o.selected=true;dsel.appendChild(o);});
}

/* ============ SCOPE LABEL ============ */
function scopeLabel(){
  const parts=[];
  parts.push('Periodo <b>'+perLabel()+' 2026</b> vs 2025');
  if(state.io)parts.push('Funzione <b>'+state.io+'</b>');
  if(state.cdc.length)parts.push('Struttura riclassificata <b>'+state.cdc.join(', ')+'</b>');
  if(state.rep)parts.push('Reparto effettivo <b>'+state.rep+'</b>');
  if(state.man)parts.push('Mansione <b>'+state.man+'</b>');
  if(state.matr){const r=ROWS.find(x=>x.matr===state.matr);parts.push('Dipendente <b>'+(r?r.dip:state.matr)+'</b>');}
  if(!state.io&&!state.cdc.length&&!state.rep&&!state.man&&!state.matr)parts.push('perimetro <b>intera organizzazione</b>');
  document.getElementById('scope').innerHTML='Ambito: '+parts.join(' · ');
}

/* ============ KPI RENDER ============ */
function deltaEl(dp,invert){
  if(dp===null)return '<span class="d flat">n/d</span>';
  const dir=dp>0.0005?'up':(dp<-0.0005?'down':'flat');
  const arrow=dp>0.0005?'▲':(dp<-0.0005?'▼':'▬');
  const cls=invert?dir+' inv':dir;
  return '<span class="d '+cls+'">'+arrow+' '+pct1(Math.abs(dp))+' vs 2025</span>';
}
function deltaElAbs(cur,prev,fmtFn,unit){
  const dp=deltaPct(cur,prev);
  if(dp===null) return '<span class="d flat">n/d</span>';
  const dir=dp>0.0005?'up':(dp<-0.0005?'down':'flat');
  const arrow=dp>0.0005?'▲':(dp<-0.0005?'▼':'▬');
  const diff=cur-prev, sign=diff>=0?'+':'−';
  const absTxt=(fmtFn?fmtFn(Math.abs(diff)):Math.round(Math.abs(diff)))+(unit?' '+unit:'');
  return '<span class="d '+dir+'">'+arrow+' '+pct1(Math.abs(dp))+' · '+sign+absTxt+' vs 2025</span>';
}
const KPI={
  cost:a=>[
    {t:'Costo del lavoro',v:eur(a.c.costo),d:deltaElAbs(a.c.costo,a.p.costo,eur,''),sub:'periodo selezionato'},
    {t:'FTE medio',v:num1(a.c.fteAvg),d:deltaEl(deltaPct(a.c.fteAvg,a.p.fteAvg),false),sub:a.c.headcount+' dipendenti a ruolo'},
    {t:'Costo / FTE (mese)',v:eur(a.c.costoFte),d:deltaEl(deltaPct(a.c.costoFte,a.p.costoFte),false),sub:'costo medio per FTE/mese'},
    {t:'Costo / ora effettiva',v:eur2(a.c.costoOra),d:deltaEl(deltaPct(a.c.costoOra,a.p.costoOra),false),sub:num0(a.c.eff)+' ore effettive'},
    {t:'Ore effettive (da timbratura)',v:num0(a.c.eff),d:deltaElAbs(a.c.eff,a.p.eff,num0,'ore'),sub:'lavorate nel periodo · differenza assoluta e % vs 2025'},
  ],
  over:a=>[
    {t:'Ore straordinario',v:num0(a.c.stra),d:deltaEl(deltaPct(a.c.stra,a.p.stra),false),sub:'nel periodo'},
    {t:'% straord. / ordinario',v:pct1(a.c.pStra),d:deltaEl(deltaPct(a.c.pStra,a.p.pStra),false),sub:'incidenza sul lavoro ordinario'},
    {t:'Importo straordinari',v:eur(a.c.imp_stra),d:deltaEl(deltaPct(a.c.imp_stra,a.p.imp_stra),false),sub:'costo lordo straord.'},
    {t:'Importo maggiorazioni',v:eur(a.c.imp_magg),d:deltaEl(deltaPct(a.c.imp_magg,a.p.imp_magg),false),sub:num0(a.c.magg)+' ore maggiorate'},
  ],
  abs:a=>[
    {t:'Tasso di assenza',v:pct1(a.c.pAssTot),d:deltaEl(deltaPct(a.c.pAssTot,a.p.pAssTot),false),sub:'assenze / ore potenziali'},
    {t:'Incidenza malattia',v:pct1(a.c.pMal),d:deltaEl(deltaPct(a.c.pMal,a.p.pMal),false),sub:num0(a.c.mal)+' ore malattia'},
    {t:'Ferie & permessi',v:pct1(a.c.pFerie),d:deltaEl(deltaPct(a.c.pFerie,a.p.pFerie),false),sub:num0(a.c.ferie)+' ore'},
    {t:'Assenze non retrib.',v:num0(a.c.ass_nr),d:deltaEl(deltaPct(a.c.ass_nr,a.p.ass_nr),false),sub:'ore non retribuite'},
  ],
  prod:a=>[
    {t:'Ore effettive',v:num0(a.c.eff),d:deltaElAbs(a.c.eff,a.p.eff,num0,'ore'),sub:'lavorate nel periodo'},
    {t:'Ore ordinarie',v:num0(a.c.ord),d:deltaElAbs(a.c.ord,a.p.ord,num0,'ore'),sub:'contrattuali ordinarie'},
    {t:'Rapporto eff./ord.',v:pct1(a.c.effRatio),d:deltaEl(deltaPct(a.c.effRatio,a.p.effRatio),false),sub:'ore rese vs ordinarie'},
    {t:'Costo / ora effettiva',v:eur2(a.c.costoOra),d:deltaEl(deltaPct(a.c.costoOra,a.p.costoOra),false),sub:'efficienza di costo'},
  ],
};
function renderKPI(a){
  const items=KPI[state.tab](a);
  document.getElementById('kpis').innerHTML=items.map(k=>
    '<div class="kpi"><div class="t">'+k.t+'</div><div class="v">'+k.v+'</div>'+k.d+'<div class="sub">'+k.sub+'</div></div>').join('');
}

/* ============ CHARTS ============ */
let ch1,ch2;
const CLR={m:'#c8663a',p:'#5a6b78',good:'#4bb37a',bad:'#e0644f',warn:'#e0a54f',blue:'#3a8fc8'};
const baseOpts=(extra)=>Object.assign({responsive:true,maintainAspectRatio:false,
  plugins:{legend:{labels:{color:'#93a2ad',boxWidth:12,font:{size:11}}}},
  scales:{x:{ticks:{color:'#93a2ad',font:{size:10}},grid:{color:'#222c34'}},
          y:{ticks:{color:'#93a2ad',font:{size:10}},grid:{color:'#222c34'}}}},extra||{});
function trendSeries(metric){
  const labels=months();
  const cur=labels.map(m=>metric(agg(rowsFor(YMain,[m]))));
  const prev=labels.map(m=>metric(agg(rowsFor(YComp,[m]))));
  return {labels,cur,prev};
}
function drawChart1(){
  const el=document.getElementById('chart1');if(ch1)ch1.destroy();
  const cfgByTab={
    cost:{title:'Andamento mensile del costo del lavoro',cap:'Costo totale per mese — 2026 vs 2025',metric:a=>a.costo,fmt:eur},
    over:{title:'Andamento ore di straordinario',cap:'Ore straordinario per mese — 2026 vs 2025',metric:a=>a.stra,fmt:num0},
    abs:{title:'Andamento incidenza malattia',cap:'% ore malattia sulle ore potenziali — 2026 vs 2025',metric:a=>a.pMal*100,fmt:v=>num1(v)+'%'},
    prod:{title:'Ore effettive vs ordinarie',cap:'Ore per mese (2026)',metric:a=>a.eff,fmt:num0},
  };
  const c=cfgByTab[state.tab];
  document.getElementById('c1t').textContent=c.title;
  document.getElementById('c1c').textContent=c.cap;
  if(state.tab==='prod'){
    const labels=months();
    const eff=labels.map(m=>agg(rowsFor(YMain,[m])).eff);
    const ord=labels.map(m=>agg(rowsFor(YMain,[m])).ord);
    ch1=new Chart(el,{type:'bar',data:{labels,datasets:[
      {label:'Ore effettive',data:eff,backgroundColor:CLR.m},
      {label:'Ore ordinarie',data:ord,backgroundColor:CLR.blue}]},options:baseOpts()});
  }else{
    const s=trendSeries(c.metric);
    ch1=new Chart(el,{type:'line',data:{labels:s.labels,datasets:[
      {label:'2026',data:s.cur,borderColor:CLR.m,backgroundColor:'rgba(200,102,58,.12)',fill:true,tension:.3,borderWidth:2,pointRadius:3},
      {label:'2025',data:s.prev,borderColor:CLR.p,borderDash:[5,4],fill:false,tension:.3,borderWidth:2,pointRadius:2}]},options:baseOpts()});
  }
}
function drawChart2(){
  const el=document.getElementById('chart2');if(ch2)ch2.destroy();
  if(state.tab==='abs'){
    document.getElementById('c2t').textContent='Composizione delle assenze';
    document.getElementById('c2c').textContent='Ripartizione ore di assenza (2026) — periodo selezionato';
    const a=agg(rowsFor(YMain));
    ch2=new Chart(el,{type:'doughnut',data:{labels:['Malattia/inf.','Ferie/permessi','Retrib. non accant.','Non retribuite','Non classificate'],
      datasets:[{data:[a.mal,a.ferie,a.ass_r,a.ass_nr,a.ass_nc],
      backgroundColor:[CLR.bad,CLR.blue,CLR.warn,'#8a5cd0','#5a6b78'],borderColor:'#171e24',borderWidth:2}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'#93a2ad',font:{size:11},boxWidth:12}}}}});
    return;
  }
  const g=groupedAgg();
  const metricByTab={
    cost:{title:'Costo / FTE per ',cap:'Confronto 2026 vs 2025 (costo medio mensile per FTE)',metric:x=>x.costoFte,fmt:eur},
    over:{title:'Importo straordinari per ',cap:'Costo lordo straordinari nel periodo — 2026 vs 2025',metric:x=>x.imp_stra,fmt:eur},
    prod:{title:'Costo / ora effettiva per ',cap:'Efficienza di costo — 2026 vs 2025',metric:x=>x.costoOra,fmt:eur2},
  };
  const c=metricByTab[state.tab];
  if(!g){document.getElementById('c2t').textContent='Dettaglio singolo dipendente';document.getElementById('c2c').textContent='Nessuna ulteriore disaggregazione disponibile';
    ch2=new Chart(el,{type:'bar',data:{labels:['2026','2025'],datasets:[{label:c.title,data:[c.metric(agg(rowsFor(YMain))),c.metric(agg(rowsFor(YComp)))],backgroundColor:[CLR.m,CLR.p]}]},options:baseOpts()});return;}
  document.getElementById('c2t').textContent=c.title+g.level.label.toLowerCase();
  document.getElementById('c2c').textContent=c.cap;
  const items=g.items.map(it=>({k:it.key,cur:c.metric(it.cur),prev:c.metric(it.prev)})).sort((a,b)=>b.cur-a.cur).slice(0,10);
  ch2=new Chart(el,{type:'bar',data:{labels:items.map(i=>i.k.length>22?i.k.slice(0,21)+'…':i.k),datasets:[
    {label:'2026',data:items.map(i=>i.cur),backgroundColor:CLR.m},
    {label:'2025',data:items.map(i=>i.prev),backgroundColor:CLR.p}]},
    options:baseOpts({indexAxis:'y',scales:{x:{ticks:{color:'#93a2ad',font:{size:10}},grid:{color:'#222c34'}},y:{ticks:{color:'#cbd6dd',font:{size:10}},grid:{display:false}}}})});
}

/* ============ TABELLA DETTAGLIO ============ */
function renderTable(){
  const g=groupedAgg();
  const t=document.getElementById('tbl');
  if(!g){document.getElementById('tblt').textContent='Riepilogo dipendente';document.getElementById('tblc').textContent='';
    const a=agg(rowsFor(YMain));
    t.innerHTML='<tbody><tr><td>Costo</td><td>'+eur(a.costo)+'</td></tr><tr><td>Ore effettive</td><td>'+num0(a.eff)+'</td></tr><tr><td>Straordinario</td><td>'+num0(a.stra)+' h</td></tr><tr><td>Malattia</td><td>'+num0(a.mal)+' h</td></tr><tr><td>Ferie/permessi</td><td>'+num0(a.ferie)+' h</td></tr></tbody>';
    return;}
  document.getElementById('tblt').textContent='Dettaglio per '+g.level.label.toLowerCase();
  document.getElementById('tblc').textContent='Clic sulle intestazioni per ordinare · confronto 2026 vs 2025';
  const cols=[
    {k:'key',l:g.level.label,f:v=>v,txt:true},
    {k:'costo',l:'Costo 2026',f:eur,g:x=>x.costo},
    {k:'dcosto',l:'Δ% costo',f:'d',g:x=>x.costo},
    {k:'fteAvg',l:'FTE',f:num1,g:x=>x.fteAvg},
    {k:'costoFte',l:'Costo/FTE',f:eur,g:x=>x.costoFte},
    {k:'pStra',l:'% straord.',f:pct1,g:x=>x.pStra},
    {k:'pMal',l:'% malattia',f:pct1,g:x=>x.pMal},
    {k:'costoOra',l:'€/ora eff.',f:eur2,g:x=>x.costoOra},
  ];
  let rows=g.items.map(it=>({key:it.key,cur:it.cur,prev:it.prev}));
  const sc=state.sort.col;
  if(sc){rows.sort((a,b)=>{const col=cols.find(c=>c.k===sc);let av,bv;
    if(sc==='key'){av=a.key;bv=b.key;return state.sort.dir*av.localeCompare(bv,'it');}
    if(sc==='dcosto'){av=deltaPct(a.cur.costo,a.prev.costo)||-9;bv=deltaPct(b.cur.costo,b.prev.costo)||-9;}
    else{av=col.g(a.cur);bv=col.g(b.cur);}
    return state.sort.dir*(av-bv);});}
  else rows.sort((a,b)=>b.cur.costo-a.cur.costo);
  let h='<thead><tr>'+cols.map(c=>'<th data-c="'+c.k+'">'+c.l+'</th>').join('')+'</tr></thead><tbody>';
  for(const r of rows){
    h+='<tr><td>'+(r.key.length>34?r.key.slice(0,33)+'…':r.key)+'</td>';
    for(let i=1;i<cols.length;i++){const c=cols[i];
      if(c.k==='dcosto'){const dp=deltaPct(r.cur.costo,r.prev.costo);const cls=dp>0?'neg':'pos';h+='<td class="'+(dp===null?'':cls)+'">'+(dp===null?'n/d':(dp>0?'+':'')+pct1(dp))+'</td>';}
      else{h+='<td>'+c.f(c.g(r.cur))+'</td>';}
    }
    h+='</tr>';
  }
  h+='</tbody>';t.innerHTML=h;
  t.querySelectorAll('th').forEach(th=>th.onclick=()=>{const c=th.dataset.c;if(state.sort.col===c)state.sort.dir*=-1;else{state.sort.col=c;state.sort.dir=-1;}renderTable();});
}

/* ============ PIANI D'AZIONE ============ */
function fmtEl(pri,title,body,acts,ref){
  return '<div class="finding"><div class="fh"><span class="pill '+pri.cls+'">'+pri.txt+'</span>'+title+'</div>'+
    '<p>'+body+'</p>'+(acts?'<ul class="act">'+acts.map(a=>'<li>'+a+'</li>').join('')+'</ul>':'')+
    (ref?'<div class="ref">'+ref+'</div>':'')+'</div>';
}
const P={alta:{cls:'alta',txt:'Priorità alta'},media:{cls:'media',txt:'Priorità media'},bassa:{cls:'bassa',txt:'Priorità bassa'},ok:{cls:'ok',txt:'Presidio'}};

function actionCost(a){
  const c=a.c,p=a.p;const dC=deltaPct(c.costo,p.costo),dF=deltaPct(c.costoFte,p.costoFte),dFte=deltaPct(c.fteAvg,p.fteAvg);
  let out='<h2>💶 Piano d\'azione — Costo del lavoro &amp; Costo/FTE</h2><div class="lead">Sintesi automatica sui valori del perimetro selezionato. I riferimenti normativi sono indicativi e vanno verificati sul CCNL applicato.</div>';
  if(dF!==null && dF>0.03){
    out+=fmtEl(dF>0.08?P.alta:P.media,'Costo per FTE in crescita ('+(dF>0?'+':'')+pct1(dF)+' vs 2025)',
      'Il costo medio mensile per FTE è salito a <b>'+eur(c.costoFte)+'</b>. A parità di organico ('+num1(c.fteAvg)+' FTE) l\'aumento non è spiegato dalla dimensione ma dal mix retributivo (scatti, straordinari, indennità, maggiorazioni).',
      ['Scomporre l\'incremento tra rinnovo/scatti CCNL, straordinari e indennità variabili per isolare la quota comprimibile.',
       'Verificare gli automatismi retributivi (scatti di anzianità) e la coerenza degli inquadramenti con le mansioni effettive.',
       'Definire un tetto di costo/FTE per struttura da monitorare mensilmente con questo cruscotto.'],
      '<b>Rif.:</b> CCNL di settore (retribuzione tabellare, scatti di anzianità, indennità); contrattazione di 2º livello per premi di risultato; <b>L. 208/2015</b> art. 1 c.182-189 (detassazione premi di produttività) come leva su costo variabile.');
  }else if(dF!==null && dF<-0.02){
    out+=fmtEl(P.ok,'Costo per FTE sotto controllo ('+pct1(dF)+' vs 2025)',
      'Il costo/FTE è pari a <b>'+eur(c.costoFte)+'</b>, in riduzione sul 2025. Mantenere il presidio ed estendere le buone pratiche alle strutture in aumento.',
      ['Documentare le leve che hanno generato il risparmio per replicarle.'],
      '<b>Rif.:</b> contrattazione di 2º livello; benchmark interno costo/FTE per struttura.');
  }
  const dO=deltaPct(c.costoOra,p.costoOra);
  if(dO!==null && dO>0.03){
    out+=fmtEl(P.media,'Costo per ora effettiva in aumento ('+(dO>0?'+':'')+pct1(dO)+')',
      'Ogni ora effettivamente lavorata costa <b>'+eur2(c.costoOra)+'</b>. Se cresce più del costo/FTE, il fenomeno è legato a ore non produttive (assenze retribuite) o a ore pagate ma non rese.',
      ['Incrociare con la dashboard Assenteismo e Produttività per capire se l\'aumento nasce da minori ore rese.',
       'Ridurre il ricorso a straordinario e sostituzioni ad alto costo orario dove strutturale.'],
      '<b>Rif.:</b> <b>D.Lgs. 66/2003</b> (orario di lavoro) per la programmazione dei turni; CCNL per maggiorazioni e indennità che incidono sul costo orario.');
  }
  const g=groupedAgg();
  if(g&&g.items.length>1){
    const top=[...g.items].sort((x,y)=>y.cur.costo-x.cur.costo)[0];
    const tot=g.items.reduce((s,i)=>s+i.cur.costo,0);
    const share=tot>0?top.cur.costo/tot:0;
    if(share>0.25)out+=fmtEl(P.bassa,'Concentrazione del costo su «'+top.key+'»',
      '«'+top.key+'» pesa per <b>'+pct1(share)+'</b> del costo del perimetro ('+eur(top.cur.costo)+'). È la leva prioritaria: interventi qui hanno il massimo impatto assoluto.',
      ['Approfondire il drill-down su «'+top.key+'» per individuare le cause specifiche.'],
      '<b>Rif.:</b> analisi per centro di costo ai fini del controllo di gestione.');
  }
  out+='<div class="ref" style="border-left:3px solid var(--accent2)"><b>Quadro normativo di riferimento (costo del lavoro):</b> CCNL di settore socio-sanitario/assistenziale (parte economica: minimi tabellari, scatti, 13ª/14ª, indennità); <b>Codice Civile art. 2099-2103</b> (retribuzione e mansioni); <b>D.Lgs. 66/2003</b> (orario); <b>L. 208/2015</b> (welfare e premi detassati). Verificare sempre il CCNL effettivamente applicato dall\'ente.</div>';
  return out;
}
function actionOver(a){
  const c=a.c,p=a.p;const dS=deltaPct(c.stra,p.stra),dP=deltaPct(c.pStra,p.pStra);
  let out='<h2>⏱ Piano d\'azione — Straordinari &amp; Maggiorazioni</h2><div class="lead">L\'analisi dello straordinario ha rilievo sia economico sia di conformità (limiti di durata del lavoro).</div>';
  if(c.pStra>0.06||(dS!==null&&dS>0.1)){
    out+=fmtEl(c.pStra>0.10?P.alta:P.media,'Straordinario elevato: '+pct1(c.pStra)+' delle ore ordinarie',
      'Nel periodo sono state prestate <b>'+num0(c.stra)+' ore</b> di straordinario per <b>'+eur(c.imp_stra)+'</b>'+(dS!==null?' ('+(dS>0?'+':'')+pct1(dS)+' vs 2025)':'')+'. Un\'incidenza alta segnala sotto-organico strutturale o programmazione turni migliorabile, con rischio di superamento dei limiti di durata.',
      ['Verificare il rispetto del limite medio di <b>48 ore settimanali</b> (media su max 4 mesi) e del monte-ore annuo di straordinario previsto dal CCNL.',
       'Individuare le strutture/mansioni con straordinario ricorrente e valutare inserimenti o redistribuzione dei turni rispetto al costo dello straordinario.',
       'Introdurre un alert mensile quando lo straordinario supera una soglia (es. 5% delle ore ordinarie) per centro di costo.'],
      '<b>Rif.:</b> <b>D.Lgs. 66/2003</b> art. 4 (durata max 48h/sett. media 4 mesi), art. 5 (lavoro straordinario, compenso/riposi compensativi), art. 7 (11h di riposo giornaliero consecutivo), art. 9 (riposo settimanale); CCNL per limite annuo di straordinario e misura delle maggiorazioni.');
  }else{
    out+=fmtEl(P.ok,'Straordinario contenuto ('+pct1(c.pStra)+' delle ore ordinarie)',
      'Lo straordinario è a <b>'+num0(c.stra)+' ore</b> ('+eur(c.imp_stra)+'), entro un\'incidenza fisiologica. Mantenere il monitoraggio per prevenire derive stagionali.',
      ['Continuare a tracciare i picchi mensili e le concentrazioni per struttura.'],
      '<b>Rif.:</b> <b>D.Lgs. 66/2003</b> artt. 4-9; CCNL (monte-ore annuo e maggiorazioni).');
  }
  if(c.imp_magg>0){
    out+=fmtEl(P.bassa,'Maggiorazioni: '+eur(c.imp_magg)+' nel periodo',
      'Le maggiorazioni (notturno, festivo, oltre-4ª notte) valgono <b>'+eur(c.imp_magg)+'</b> ('+num0(c.magg)+' ore). Sono in parte incomprimibili nei servizi h24, ma la programmazione dei turni notturni/festivi ne governa l\'entità.',
      ['Bilanciare la rotazione dei turni notturni per evitare concentrazioni sullo stesso personale (maggiorazioni oltre 4ª notte).',
       'Verificare la corretta applicazione delle percentuali di maggiorazione da CCNL.'],
      '<b>Rif.:</b> CCNL (maggiorazioni per lavoro notturno, festivo, straordinario); <b>D.Lgs. 66/2003</b> artt. 11-13 (lavoro notturno: limiti e sorveglianza sanitaria).');
  }
  const g=groupedAgg();
  if(g&&g.items.length>1){
    const top=[...g.items].sort((x,y)=>y.cur.imp_stra-x.cur.imp_stra)[0];
    if(top.cur.imp_stra>0)out+=fmtEl(P.bassa,'Focus straordinario: «'+top.key+'»',
      '«'+top.key+'» concentra il maggior costo di straordinario ('+eur(top.cur.imp_stra)+', '+pct1(top.cur.pStra)+' delle ore ordinarie). Prioritaria la revisione dell\'organico/turni qui.',null,
      '<b>Rif.:</b> pianificazione turni ex <b>D.Lgs. 66/2003</b>; contrattazione turni con RSU.');
  }
  return out;
}
function actionAbs(a){
  const c=a.c,p=a.p;const dM=deltaPct(c.pMal,p.pMal);
  let out='<h2>🩺 Piano d\'azione — Assenteismo</h2><div class="lead">Il tasso di assenza incide su costo/ora, carico di lavoro residuo e ricorso a straordinario.</div>';
  if(c.pMal>0.05||(dM!==null&&dM>0.15)){
    out+=fmtEl(c.pMal>0.08?P.alta:P.media,'Incidenza malattia: '+pct1(c.pMal)+(dM!==null?' ('+(dM>0?'+':'')+pct1(dM)+' vs 2025)':''),
      'Le ore di malattia/infortunio pesano per <b>'+pct1(c.pMal)+'</b> delle ore potenziali (<b>'+num0(c.mal)+' ore</b>). Livelli alti o in crescita meritano analisi su condizioni di lavoro, stagionalità e concentrazione su specifiche strutture.',
      ['Analizzare la distribuzione per struttura/mansione e la durata media degli eventi (brevi ricorrenti vs lunghe degenze) tramite drill-down.',
       'Valutare con il medico competente misure di prevenzione dove la malattia si concentra (movimentazione carichi, stress correlato).',
       'Monitorare il periodo di comporto individuale per la corretta gestione dei rapporti.'],
      '<b>Rif.:</b> <b>art. 2110 c.c.</b> (malattia e conservazione del posto); CCNL (periodo di comporto, trattamento economico di malattia, carenza); <b>D.Lgs. 81/2008</b> (sorveglianza sanitaria e prevenzione, artt. 25 e 41); <b>D.L. 463/1983</b> conv. L. 638/1983 (fasce orarie di reperibilità).');
  }else{
    out+=fmtEl(P.ok,'Malattia entro livelli fisiologici ('+pct1(c.pMal)+')',
      'L\'incidenza malattia è contenuta (<b>'+num0(c.mal)+' ore</b>). Mantenere sorveglianza sanitaria e monitoraggio delle concentrazioni.',
      ['Continuare il monitoraggio periodico per struttura.'],
      '<b>Rif.:</b> <b>D.Lgs. 81/2008</b> (sorveglianza sanitaria); CCNL (comporto).');
  }
  if(c.pFerie>0.10){
    out+=fmtEl(P.media,'Elevato utilizzo/accumulo ferie e permessi ('+pct1(c.pFerie)+')',
      'Ferie e permessi valgono <b>'+pct1(c.pFerie)+'</b> delle ore potenziali ('+num0(c.ferie)+' ore). Va governato il piano ferie per evitare accumuli e garantire il godimento di legge, contenendo i debiti figurativi.',
      ['Pianificare lo smaltimento ferie residue e verificare le 2 settimane da godere nell\'anno di maturazione.',
       'Distribuire le assenze programmate per non generare sotto-organico e straordinario compensativo.'],
      '<b>Rif.:</b> <b>D.Lgs. 66/2003 art. 10</b> (min. 4 settimane di ferie; almeno 2 nell\'anno di maturazione, le restanti entro 18 mesi); <b>art. 2109 c.c.</b> (diritto alle ferie).');
  }
  if(c.ass_nr>0){
    out+=fmtEl(P.bassa,'Assenze non retribuite: '+num0(c.ass_nr)+' ore',
      'Presenti <b>'+num0(c.ass_nr)+' ore</b> di assenza non retribuita (aspettative, permessi non retribuiti). Neutre a costo diretto ma incidono su copertura turni e organizzazione.',null,
      '<b>Rif.:</b> CCNL (aspettative e permessi non retribuiti); <b>L. 104/1992</b> per permessi assistiti; normativa su congedi (D.Lgs. 151/2001).');
  }
  return out;
}
function actionProd(a){
  const c=a.c,p=a.p;const dR=deltaPct(c.effRatio,p.effRatio),dE=deltaPct(c.eff,p.eff);
  let out='<h2>📈 Piano d\'azione — Produttività ore</h2><div class="lead">Misura il rapporto tra ore effettivamente rese e ore contrattuali, e l\'efficienza di costo per ora.</div>';
  out+=fmtEl(c.effRatio<0.9?P.media:P.ok,'Rapporto ore effettive / ordinarie: '+pct1(c.effRatio),
    'Nel periodo sono state rese <b>'+num0(c.eff)+' ore effettive</b> a fronte di <b>'+num0(c.ord)+' ore ordinarie</b> ('+pct1(c.effRatio)+')'+(dR!==null?', '+(dR>0?'+':'')+pct1(dR)+' vs 2025':'')+'. Valori sopra il 100% indicano ricorso a straordinario/flessibilità; sotto il 100% segnalano assenze che erodono le ore rese.',
    c.effRatio<0.9?['Incrociare con Assenteismo: un rapporto basso è spesso spiegato da malattia/ferie elevate.',
       'Verificare la copertura dei turni e ridurre il gap con programmazione anziché straordinario.']
      :['Verificare che l\'eccedenza non derivi da straordinario strutturale (vedi dashboard dedicata).',
       'Consolidare la programmazione che garantisce piena resa oraria.'],
    '<b>Rif.:</b> <b>D.Lgs. 66/2003</b> (orario normale, flessibilità e straordinario); CCNL (banca ore, flessibilità oraria, part-time).');
  const dO=deltaPct(c.costoOra,p.costoOra);
  out+=fmtEl(dO!==null&&dO>0.03?P.media:P.bassa,'Efficienza di costo: '+eur2(c.costoOra)+' per ora effettiva'+(dO!==null?' ('+(dO>0?'+':'')+pct1(dO)+')':''),
    'Ogni ora effettivamente lavorata costa <b>'+eur2(c.costoOra)+'</b>. È l\'indicatore che sintetizza costo, assenze e straordinari: si riduce aumentando le ore rese a parità di costo o contenendo le componenti variabili.',
    ['Agire congiuntamente sulle tre leve: assenteismo (più ore rese), straordinario (meno ore costose) e mix (indennità/maggiorazioni).',
     'Definire un target di €/ora per struttura e monitorarlo mensilmente.'],
    '<b>Rif.:</b> controllo di gestione del personale; contrattazione di 2º livello (produttività, L. 208/2015).');
  const g=groupedAgg();
  if(g&&g.items.length>1){
    const worst=[...g.items].filter(i=>i.cur.ord>0).sort((x,y)=>x.cur.effRatio-y.cur.effRatio)[0];
    if(worst)out+=fmtEl(P.bassa,'Resa oraria più bassa: «'+worst.key+'» ('+pct1(worst.cur.effRatio)+')',
      '«'+worst.key+'» mostra il rapporto ore effettive/ordinarie più basso del perimetro. Approfondire le cause (assenze, part-time, turni scoperti) con il drill-down.',null,
      '<b>Rif.:</b> analisi organico per centro di costo; <b>D.Lgs. 66/2003</b> per la riorganizzazione turni.');
  }
  return out;
}
const ACT={cost:actionCost,over:actionOver,abs:actionAbs,prod:actionProd};

/* ============ MASCHERA: DRIVER DELLE VARIAZIONI ============ */
const FACTORS=['Rinnovo CCNL / aumento minimi tabellari','Scatti di anzianità','Nuove assunzioni / potenziamento organico',
  'Cessazioni / turnover','Variazione mix full-time / part-time','Stagionalità (assenze, ferie)',
  'Apertura / chiusura di un servizio o struttura','Nuovo appalto / gara / commessa','Una tantum / arretrati / premi','Riorganizzazione turni'];
const maskState={}; // per-tab: {basis,month,factors:{},note}
let maskChart=1;
function mkey(){return state.tab;}
function ms(){const k=mkey();if(!maskState[k])maskState[k]={basis:'yoy',month:null,factors:{},note:''};return maskState[k];}
function prevMonthOf(name){const i=DS.months.indexOf(name);if(i>0)return{m:DS.months[i-1],y:YMain};return{m:'Dicembre',y:YMain-1};}
function comparison(){
  const st=ms(),pm=months();
  if(st.basis==='mom'){
    const ref=(st.month&&pm.includes(st.month))?st.month:pm[pm.length-1];
    const pv=prevMonthOf(ref);
    return{cur:agg(rowsFor(YMain,[ref])),prev:agg(rowsFor(pv.y,[pv.m])),
      curRows:rowsFor(YMain,[ref]),prevRows:rowsFor(pv.y,[pv.m]),
      curL:ref+' '+YMain,prevL:pv.m+' '+pv.y,mode:'mese su mese',ref};
  }
  return{cur:agg(rowsFor(YMain)),prev:agg(rowsFor(YComp)),curRows:rowsFor(YMain),prevRows:rowsFor(YComp),
    curL:perLabel()+' '+YMain,prevL:perLabel()+' '+YComp,mode:'anno su anno'};
}
const num0h=n=>num0(n)+' h';
const TABM={
  cost:{name:'Costo del lavoro',fmt:eur,cM:x=>x.costo,cN:'costo',cF:eur},
  over:{name:'Ore di straordinario',fmt:num0h,cM:x=>x.imp_stra,cN:'importo straord.',cF:eur},
  abs:{name:'Ore di malattia',fmt:num0h,cM:x=>x.mal,cN:'ore malattia',cF:num0h},
  prod:{name:'Ore effettive',fmt:num0h,cM:x=>x.eff,cN:'ore effettive',cF:num0h},
};
function bridge(tab,c,p){
  const rows=[];
  if(tab==='cost'){
    const bpfP=p.fte>0?p.base/p.fte:0,bpfC=c.fte>0?c.base/c.fte:0;
    rows.push({l:'Effetto organico (Δ FTE)',v:(c.fte-p.fte)*bpfP});
    rows.push({l:'Dinamica retributiva base (CCNL, scatti, mix)',v:(bpfC-bpfP)*c.fte});
    rows.push({l:'Δ Straordinari',v:c.imp_stra-p.imp_stra});
    rows.push({l:'Δ Maggiorazioni',v:c.imp_magg-p.imp_magg});
    rows.push({l:'Δ Indennità',v:c.ind-p.ind});
    rows.push({l:'Δ Importi non ricorrenti',v:c.nonric-p.nonric});
    return{rows,total:c.costo-p.costo,fmt:eur};
  }
  const field={over:'stra',abs:'mal',prod:'eff'}[tab];
  const perP=p.fte>0?p[field]/p.fte:0,perC=c.fte>0?c[field]/c.fte:0;
  rows.push({l:'Effetto organico (Δ FTE)',v:(c.fte-p.fte)*perP});
  rows.push({l:'Effetto intensità (ore per FTE)',v:(perC-perP)*c.fte});
  return{rows,total:c[field]-p[field],fmt:num0h};
}
function openMask(chart){maskChart=chart;renderMask();document.getElementById('modalbg').classList.remove('hidden');}
function closeMask(){document.getElementById('modalbg').classList.add('hidden');}
function renderMask(){
  const st=ms(),cmp=comparison(),tm=TABM[state.tab];
  document.getElementById('m_title').textContent=(maskChart===1?'Driver della variazione — '+tm.name:'Chi ha spinto la variazione');
  document.getElementById('m_sub').textContent='Ambito: '+perLabel()+' 2026'+(state.io?' · '+state.io:'')+(state.cdc.length?' · '+state.cdc.join(', '):'')+(state.man?' · '+state.man:'')+(state.matr?' · dipendente':'');
  const pm=months();
  let h='';
  // basis chooser
  h+='<div class="seg"><button data-b="yoy" class="'+(st.basis==='yoy'?'on':'')+'">Anno su anno</button>'+
     '<button data-b="mom" class="'+(st.basis==='mom'?'on':'')+'">Mese su mese</button></div>';
  if(st.basis==='mom'){
    h+='<span style="font-size:12px;color:var(--muted)">Mese di riferimento:<select class="mselect" id="m_month">'+
      pm.map(m=>'<option '+(((st.month||pm[pm.length-1])===m)?'selected':'')+'>'+m+'</option>').join('')+'</select></span>';
  }
  h+='<div class="head-var">Variazione '+cmp.mode+': <span class="big">'+
    (()=>{const cv=tm.cM(cmp.cur),pv=tm.cM(cmp.prev),dp=deltaPct(cv,pv);
      return (cv-pv>=0?'+':'')+(state.tab==='cost'?eur(cv-pv):num0h(cv-pv))+'</span> '+
      (dp!==null?'('+(dp>0?'+':'')+pct1(dp)+')':'')+
      '<div class="hint" style="margin-top:2px">'+cmp.curL+' vs '+cmp.prevL+' — '+
      (state.tab==='cost'?eur(cv):num0h(cv))+' vs '+(state.tab==='cost'?eur(pv):num0h(pv))+'</div>';})();
  h+='</div>';
  // section: decomposition or contributors
  if(maskChart===1){
    const b=bridge(state.tab,cmp.cur,cmp.prev);
    const mx=Math.max(...b.rows.map(r=>Math.abs(r.v)),1);
    h+='<div class="msec"><h4>Scomposizione automatica della variazione</h4>'+
       '<p class="hint">Contributi calcolati dai dati. «Dinamica retributiva base» isola l\'effetto tariffa a parità di organico: è la voce dove pesano rinnovi CCNL e scatti di anzianità.</p>';
    b.rows.forEach(r=>{const w=Math.abs(r.v)/mx*100,pos=r.v>=0,col=pos?'var(--accent)':'var(--accent2)';
      h+='<div class="bridge-row"><div class="lbl">'+r.l+'</div>'+
        '<div class="barwrap"><div class="bar" style="width:'+w.toFixed(0)+'%;background:'+col+';left:0"></div></div>'+
        '<div class="val" style="color:'+col+'">'+(pos?'+':'')+b.fmt(r.v)+'</div></div>';});
    h+='<div class="bridge-row tot"><div class="lbl">Variazione totale</div><div></div><div class="val">'+(b.total>=0?'+':'')+b.fmt(b.total)+'</div></div></div>';
  }else{
    const gl=groupLevel();
    if(!gl){h+='<div class="msec"><p class="hint">Sei sul singolo dipendente: nessuna ulteriore disaggregazione. Usa «Anno su anno / Mese su mese» per leggere la variazione individuale.</p></div>';}
    else{
      const m={};const push=(r,k)=>{(m[r[gl.key]||'—']=m[r[gl.key]||'—']||{c:[],p:[]})[k].push(r);};
      cmp.curRows.forEach(r=>push(r,'c'));cmp.prevRows.forEach(r=>push(r,'p'));
      const items=Object.entries(m).map(([k,v])=>{const ca=agg(v.c),pa=agg(v.p);return{k,d:tm.cM(ca)-tm.cM(pa),cur:tm.cM(ca)};})
        .sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)).slice(0,7);
      const mx=Math.max(...items.map(i=>Math.abs(i.d)),1);
      h+='<div class="msec"><h4>Principali contributi per '+gl.label.toLowerCase()+' ('+tm.cN+')</h4>'+
         '<p class="hint">Chi ha determinato di più la variazione '+cmp.mode+'. Ordinati per impatto assoluto.</p>';
      items.forEach(i=>{const w=Math.abs(i.d)/mx*100,pos=i.d>=0,col=pos?'var(--accent)':'var(--accent2)';
        h+='<div class="bridge-row"><div class="lbl">'+(i.k.length>26?i.k.slice(0,25)+'…':i.k)+'</div>'+
          '<div class="barwrap"><div class="bar" style="width:'+w.toFixed(0)+'%;background:'+col+';left:0"></div></div>'+
          '<div class="val" style="color:'+col+'">'+(pos?'+':'')+tm.cF(i.d)+'</div></div>';});
      h+='</div>';
    }
  }
  // section: external factors (choice)
  h+='<div class="msec"><h4>Fattori esterni / contestuali</h4><p class="hint">Seleziona i fatti che spiegano la variazione (non deducibili dai soli numeri). Le scelte restano salvate nella sessione.</p><div class="factors">';
  FACTORS.forEach((f,i)=>{const on=st.factors[i];h+='<label class="fchip '+(on?'on':'')+'"><input type="checkbox" data-f="'+i+'" '+(on?'checked':'')+'>'+f+'</label>';});
  h+='</div><textarea class="mnote" id="m_note" placeholder="Nota libera: es. rinnovo CCNL UNEBA in vigore da gennaio, +X% tabellare; apertura nuovo nucleo a marzo…">'+(st.note||'')+'</textarea>';
  // synthesis
  const sel=FACTORS.filter((f,i)=>st.factors[i]);
  if(sel.length||st.note){
    h+='<div class="msummary"><b>Lettura di sintesi:</b> la variazione '+cmp.mode+' di <b>'+tm.name.toLowerCase()+'</b> è ricondotta ';
    h+= sel.length? 'ai fattori: '+sel.join('; ')+'.':'alle note indicate.';
    if(st.note)h+=' <br><i>'+st.note.replace(/</g,'&lt;')+'</i>';
    h+='</div>';
  }
  h+='</div>';
  // reference
  const refByTab={cost:'CCNL di settore (minimi tabellari, scatti, indennità); verbali di rinnovo contrattuale; L. 208/2015 (premi detassati).',
    over:'D.Lgs. 66/2003 artt. 4-9 (durata e straordinario); CCNL (monte-ore annuo, maggiorazioni).',
    abs:'art. 2110 c.c.; CCNL (comporto, malattia); D.Lgs. 81/2008 (prevenzione); fattori stagionali.',
    prod:'D.Lgs. 66/2003 (orario, flessibilità); CCNL (banca ore, part-time).'};
  h+='<div class="ref mref"><b>Riferimenti:</b> '+refByTab[state.tab]+' Le voci contrattuali/normative citate sono indicative.</div>';
  document.getElementById('m_body').innerHTML=h;
  // wire modal controls
  document.querySelectorAll('.seg button').forEach(bt=>bt.onclick=()=>{ms().basis=bt.dataset.b;renderMask();});
  const msel=document.getElementById('m_month');if(msel)msel.onchange=e=>{ms().month=e.target.value;renderMask();};
  document.querySelectorAll('#m_body input[data-f]').forEach(cb=>cb.onchange=e=>{ms().factors[e.target.dataset.f]=e.target.checked;renderMask();});
  const nt=document.getElementById('m_note');if(nt)nt.oninput=e=>{ms().note=e.target.value;};
}

/* ============ RENDER ORCHESTRATION ============ */
function render(){
  buildFilters();scopeLabel();
  const a={c:agg(rowsFor(YMain)),p:agg(rowsFor(YComp))};
  renderKPI(a);drawChart1();drawChart2();renderTable();
  document.getElementById('action').innerHTML=ACT[state.tab](a);
  document.getElementById('foot').innerHTML=
    'Fonte: Costi_Ore 2025/2026 · Confronto &amp; Incidenze 2025–2026 (dati dipendente-livello, '+ROWS.length+' record). '+
    'Costo/FTE = costo del periodo ÷ FTE del periodo (costo medio mensile per FTE). % assenze calcolate su ore potenziali (ordinarie + assenze). '+
    'I riferimenti normativi/contrattuali sono indicativi e vanno verificati sul CCNL applicato dall\'ente e sulla normativa vigente.<br>'+
    'Cruscotto Bottega Norris · uso interno.';
}
['f_period','f_perTo','f_tip','f_io','f_cdc','f_rep','f_man','f_matr'].forEach(id=>{
  document.getElementById(id).addEventListener('change',e=>{
    const v=e.target.value;
    if(id==='f_period'){state.da=v;state.period=perLabel();}
    if(id==='f_perTo'){state.a=v;state.period=perLabel();}
    if(id==='f_tip')state.tip=v;
    if(id==='f_io'){state.io=v;state.cdc=[];state.rep='';state.man='';state.matr='';}
    if(id==='f_cdc'){state.cdc=[...e.target.selectedOptions].map(o=>o.value).filter(Boolean);state.rep='';state.man='';state.matr='';}
    if(id==='f_rep'){state.rep=v;state.man='';state.matr='';}
    if(id==='f_man'){state.man=v;state.matr='';}
    if(id==='f_matr')state.matr=v;
    state.sort={col:null,dir:-1};
    render();
  });
});
document.getElementById('reset').onclick=()=>{state.io='';state.cdc='';state.rep='';state.man='';state.matr='';state.sort={col:null,dir:-1};render();};
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');
  state.tab=t.dataset.tab;state.sort={col:null,dir:-1};render();
});
document.querySelectorAll('.explain-btn').forEach(b=>b.onclick=()=>openMask(+b.dataset.mask));
document.getElementById('m_close').onclick=closeMask;
document.getElementById('modalbg').onclick=e=>{if(e.target.id==='modalbg')closeMask();};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMask();});
render();

})();
