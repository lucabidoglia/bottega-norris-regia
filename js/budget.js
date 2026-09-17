
/* ============================================================
   MASTRO VENTURO — motore di proiezione del costo del lavoro
   Nessuna dipendenza. Ogni euro proiettato e tracciabile al ponte.
   ============================================================ */

const CAL={"A.S.A.":{"fte":197.22,"imp_magg":173456,"ind":85022,"nonric":13313,"ord":286264,"magg":51892,"oreContrFte":1792,"oreNecFte":1773,"pAss":0.1898,"turnover":0.266},"AMMINISTRATIVI":{"fte":18.1,"imp_magg":0,"ind":50561,"nonric":29425,"ord":28366,"magg":0,"oreContrFte":1860,"oreNecFte":1672,"pAss":0.1573,"turnover":0.136},"ANIMATORI / EDUCATORI":{"fte":14.57,"imp_magg":1593,"ind":8280,"nonric":8735,"ord":21474,"magg":484,"oreContrFte":1853,"oreNecFte":1773,"pAss":0.2047,"turnover":0.158},"ASSISTENTI SOCIALI":{"fte":3.83,"imp_magg":0,"ind":8520,"nonric":856,"ord":6424,"magg":0,"oreContrFte":1865,"oreNecFte":1877,"pAss":0.1013,"turnover":0.0},"FISIOTERAPIA":{"fte":7.61,"imp_magg":0,"ind":2400,"nonric":1765,"ord":11504,"magg":0,"oreContrFte":1880,"oreNecFte":1642,"pAss":0.1955,"turnover":0.286},"FUNDRAISING":{"fte":2.0,"imp_magg":0,"ind":0,"nonric":6384,"ord":3459,"magg":0,"oreContrFte":1900,"oreNecFte":1028,"pAss":0.0897,"turnover":0.0},"INFERMIERI":{"fte":14.71,"imp_magg":21834,"ind":13202,"nonric":121,"ord":19423,"magg":4278,"oreContrFte":1504,"oreNecFte":1959,"pAss":0.1218,"turnover":0.381},"MAGAZZINO":{"fte":4.53,"imp_magg":0,"ind":14656,"nonric":5244,"ord":7470,"magg":0,"oreContrFte":1868,"oreNecFte":2059,"pAss":0.118,"turnover":0.167},"MANUTENZIONE":{"fte":1.0,"imp_magg":0,"ind":8836,"nonric":3760,"ord":1792,"magg":0,"oreContrFte":1900,"oreNecFte":2302,"pAss":0.0574,"turnover":0.0},"MEDICI":{"fte":5.95,"imp_magg":0,"ind":72660,"nonric":296,"ord":9763,"magg":0,"oreContrFte":1889,"oreNecFte":2153,"pAss":0.1318,"turnover":0.0},"RECEPTION":{"fte":4.2,"imp_magg":1342,"ind":0,"nonric":0,"ord":6448,"magg":993,"oreContrFte":1951,"oreNecFte":1885,"pAss":0.2133,"turnover":0.0},"SANIFICAZIONE":{"fte":0.79,"imp_magg":0,"ind":0,"nonric":0,"ord":1172,"magg":0,"oreContrFte":1899,"oreNecFte":1507,"pAss":0.2183,"turnover":0.0},"SERV. PSICO-SOCIALI":{"fte":1.87,"imp_magg":0,"ind":0,"nonric":555,"ord":3351,"magg":0,"oreContrFte":2112,"oreNecFte":2022,"pAss":0.15,"turnover":0.25}};
function _computeBASE(){
  const RAW=JSON.parse(parent.document.getElementById('raw').textContent);
  const MONTHS=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  const YS=Object.keys(RAW).sort(); const LAT=YS[YS.length-1], PRE=YS.length>1?YS[YS.length-2]:null;
  const avail=y=>MONTHS.filter(m=>RAW[y]&&RAW[y][m]);
  const refY=avail(LAT).length?LAT:PRE;
  const avg={};
  for(const io in CAL){let c=0,e=0,st=0,is=0;const ms=avail(refY);
    for(const m of ms)for(const r of RAW[refY][m])if(r.io===io&&r.tip==='Dipendente'){c+=r.costo||0;e+=r.ore||0;st+=r.sore||0;is+=r.scos||0;}
    const n=ms.length||1; avg[io]={costo:c/n,eff:e/n,stra:st/n,imp_stra:is/n};}
  const funz={}; for(const io in CAL) funz[io]={costo:0,eff:0,stra:0,imp_stra:0};
  for(const m of MONTHS){
    const yr=(RAW[LAT]&&RAW[LAT][m])?LAT:(PRE&&RAW[PRE]&&RAW[PRE][m])?PRE:null;
    for(const io in funz){let c=0,e=0,st=0,is=0;
      if(yr){for(const r of RAW[yr][m])if(r.io===io&&r.tip==='Dipendente'){c+=r.costo||0;e+=r.ore||0;st+=r.sore||0;is+=r.scos||0;}}
      else{const a=avg[io];c=a.costo;e=a.eff;st=a.stra;is=a.imp_stra;}
      funz[io].costo+=c;funz[io].eff+=e;funz[io].stra+=st;funz[io].imp_stra+=is;}
  }
  const F={};
  for(const io in funz){const o=funz[io],k=CAL[io];
    const costo=Math.round(o.costo),eff=Math.round(o.eff),stra=Math.round(o.stra),imp_stra=Math.round(o.imp_stra);
    const base=Math.round(costo-imp_stra-k.imp_magg-k.ind-k.nonric);
    F[io]={fte:k.fte,costo,costoFte:Math.round(costo/k.fte),base,imp_stra,imp_magg:k.imp_magg,ind:k.ind,nonric:k.nonric,
      pAss:k.pAss,pStra:k.ord?+(stra/k.ord).toFixed(4):0,ord:k.ord,eff,stra,magg:k.magg,
      oreContrFte:k.oreContrFte,oreNecFte:k.oreNecFte,pMagg:eff?+(k.magg/eff).toFixed(4):0,turnover:k.turnover};}
  const tot=Object.values(F).reduce((a,f)=>a+f.costo,0);
  const tot_ore={ord:0,eff:0,stra:0,magg:0};for(const io in F){tot_ore.ord+=F[io].ord;tot_ore.eff+=F[io].eff;tot_ore.stra+=F[io].stra;tot_ore.magg+=F[io].magg;}
  let drift=0.0413;
  if(PRE){const common=avail(LAT).filter(m=>RAW[PRE]&&RAW[PRE][m]);let cl=0,cp=0;
    for(const m of common)for(const io in CAL){
      for(const r of RAW[LAT][m])if(r.io===io&&r.tip==='Dipendente')cl+=r.costo||0;
      for(const r of RAW[PRE][m])if(r.io===io&&r.tip==='Dipendente')cp+=r.costo||0;}
    drift=cp?+(cl/cp-1).toFixed(4):drift;}
  return {anno_base:+LAT, tot, drift_osservato:drift, tot_ore, funzioni:F};
}
const BASE=_computeBASE();
const Y0=BASE.anno_base;                 // 2025
const HORIZON=[2027,2028,2029,2030];     // anno successivo + tre
const FUNCS=Object.keys(BASE.funzioni).sort((a,b)=>BASE.funzioni[b].costo-BASE.funzioni[a].costo);

/* ---------- formati ---------- */
const G={useGrouping:true};
const eur=n=>'€ '+Math.round(n).toLocaleString('it-IT',G);
const eurk=n=>'€ '+(Math.round(n/1000)).toLocaleString('it-IT',G)+' k';
const eur2=n=>'€ '+n.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true});
const num0=n=>Math.round(n).toLocaleString('it-IT',G);
const num1=n=>n.toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:true});
const pct1=n=>(n*100).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const hh=n=>num0(n)+' h';
const pct0=n=>(n*100).toLocaleString('it-IT',{minimumFractionDigits:0,maximumFractionDigits:0})+'%';
const sgn=n=>(n>0?'+':n<0?'−':'')+'';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const cut=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;

/* ---------- scenari: preimpostazioni delle leve globali ----------
   Ogni valore e in punti percentuali annui. Lo scenario riscrive i globali,
   ma le leve per funzione restano quelle che l'utente ha in tabella. */
const SCENARI={
  prudente:{ccnl:1.5, integ:0.3, istat:1.5, scatti:0.8, organico:0.0,
            sconto:12, coper:110, unatantum:2500, note:'Aumenti minimi, coperture contenute.'},
  centrale:{ccnl:2.7, integ:0.5, istat:2.0, scatti:1.0, organico:0.0,
            sconto:12, coper:120, unatantum:3000, note:'Rinnovo in linea con le ultime tornate, IPCA verso il 2%.'},
  teso:    {ccnl:4.0, integ:1.0, istat:3.0, scatti:1.2, organico:1.0,
            sconto:10, coper:135, unatantum:3500, note:'Rinnovo generoso, inflazione alta, organico in crescita.'}
};
/* definizione delle leve globali, con etichetta e spiegazione a schermo */
const LEVE=[
  {k:'ccnl',   n:'CCNL nazionale',   u:'% / anno', hint:'Aumento dei minimi tabellari da rinnovo. Agisce sulla retribuzione base.'},
  {k:'integ',  n:'Integrativo',      u:'% / anno', hint:'Contrattazione di secondo livello. Si somma al nazionale sulla base.'},
  {k:'istat',  n:'ISTAT / IPCA',     u:'% / anno', hint:'Inflazione. Rivaluta le indennità e il TFR. Non è un aumento tabellare.'},
  {k:'scatti', n:'Scatti anzianità', u:'% / anno', hint:'Deriva automatica sulla popolazione che resta. Il turnover la erode.'},
  {k:'organico',n:'Organico',        u:'% / anno', hint:'Crescita o riduzione degli FTE, a parità di servizio.'},
  {k:'sconto', n:'Sconto neoassunto',u:'%',        hint:'Quanto costa meno un neoassunto rispetto a chi esce, per scatti persi.'},
  {k:'coper',  n:'Costo copertura',  u:'%',        hint:'Costo di un\'ora coperta in straordinario o sostituzione, sul costo ordinario.'},
  {k:'unatantum',n:'Una tantum turnover',u:'€/uscita',hint:'Costo di selezione, inserimento e affiancamento per ogni sostituzione.'}
];

/* ---------- stato ---------- */
const G0=Object.assign({},SCENARI.centrale);
const state={scenario:'centrale', tab:'cost', g:Object.assign({},G0),
  fx:{}, bridgeYear:2027};
/* fx: override per funzione di assenteismo e turnover, chiave = nome funzione */
FUNCS.forEach(f=>{state.fx[f]={ass:BASE.funzioni[f].pAss, turn:BASE.funzioni[f].turnover};});
state.necFte={};
FUNCS.forEach(f=>{state.necFte[f]=BASE.funzioni[f].oreNecFte;});

/* ============================================================
   MODELLO
   Per ogni funzione, dal costo dell'anno precedente si arriva a quello
   dell'anno t sommando strati distinti e tracciabili:
     + dinamica base (CCNL + integrativo + scatti) sulla retribuzione base
     + rivalutazione ISTAT su indennità e componenti indicizzate
     + effetto organico (crescita/riduzione FTE al costo medio)
     − sconto turnover (la quota che ricambia perde gli scatti accumulati)
     + copertura assenteismo (le ore perse oltre la base si coprono a costo pieno)
     + una tantum turnover (selezione e inserimento, costo non ricorrente)
   Il primo anno parte dalla base 2025; ogni anno successivo parte dal
   precedente proiettato.
   ============================================================ */
function projectFunc(fname){
  const b=BASE.funzioni[fname], g=state.g, fx=state.fx[fname];
  const assBase=b.pAss;                       // assenteismo storico della funzione
  const oreContrFte=b.oreContrFte;            // schema orario: monte ore contrattuale per FTE
  const oreNecFte=(state.necFte&&state.necFte[fname]!=null)?state.necFte[fname]:b.oreNecFte; // fabbisogno per FTE (editabile)
  // decompone le ore per un dato FTE, assenteismo, straordinario e maggiorate
  function oreOf(fte,ass,straH,maggH){
    const contr=fte*oreContrFte;              // ore contrattuali teoriche (schema orario)
    const nec=fte*oreNecFte;                  // fabbisogno: ore che i turni richiedono
    const ordRese=contr*(1-ass);              // ordinarie effettivamente rese, al netto assenze
    const gap=nec-ordRese;                    // divario di copertura
    return {contr:contr, nec:nec, ordRese:ordRese, stra:straH, magg:maggH,
            flex:Math.max(0,gap-straH), gap:gap};
  }
  let prev={
    anno:Y0, costo:b.costo, base:b.base, ind:b.ind,
    imp_stra:b.imp_stra, imp_magg:b.imp_magg, nonric:b.nonric,
    fte:b.fte, costoFte:b.costoFte,
    stra:b.stra, magg:b.magg, ord:b.ord, eff:b.eff, pStra:b.pStra, pAss:assBase,
    costoOra:b.eff>0?b.costo/b.eff:0, effRatio:b.ord>0?b.eff/b.ord:0
  };
  prev.ore=oreOf(b.fte,assBase,b.stra,b.magg);
  const years={};
  years[Y0]=Object.assign({bridge:null},prev);
  HORIZON.forEach((t,ix)=>{
    const bridge=[];
    const step=(ix===0)?2:1;                   // primo passo biennale (salta il 2026)
    const comp=(rate)=>Math.pow(1+rate,step)-1;
    const fteNew=prev.fte*Math.pow(1+g.organico/100,step);
    const effOrg=(fteNew-prev.fte)*prev.costoFte;
    bridge.push({l:'Organico',v:effOrg});
    const dinBase=comp((g.ccnl+g.integ+g.scatti)/100);
    const effBase=prev.base*dinBase;
    bridge.push({l:'Dinamica base (CCNL+integrativo+scatti)',v:effBase});
    const effIstat=(prev.ind+prev.nonric)*comp(g.istat/100);
    bridge.push({l:'Rivalutazione ISTAT su indennità',v:effIstat});
    const effTurn=-(prev.base*fx.turn*(g.sconto/100))*step;
    bridge.push({l:'Sconto turnover (neoassunti)',v:effTurn});
    const orePot=prev.ord/(1-Math.min(0.6,prev.pAss||assBase));
    const costoOra=prev.ord>0?(prev.base+prev.ind)/prev.eff:0;
    const dAss=fx.ass-assBase;
    const effCoper=dAss*orePot*costoOra*(g.coper/100);
    bridge.push({l:'Copertura assenteismo',v:effCoper});
    const effUna=(fteNew*fx.turn)*g.unatantum*step;
    bridge.push({l:'Una tantum turnover',v:effUna});

    const costo=prev.costo+effOrg+effBase+effIstat+effTurn+effCoper+effUna;
    const baseNew=prev.base*(1+dinBase) - prev.base*fx.turn*(g.sconto/100)*step;
    const indNew=prev.ind*(1+comp(g.istat/100));
    // ORE proiettate coerenti col fabbisogno e con l'assenteismo
    const oreNow=oreOf(fteNew,fx.ass,0,0);
    const straShareBase=prev.ore.gap>0?prev.stra/prev.ore.gap:0.5;
    const straNew=Math.max(0, oreNow.gap*straShareBase*(1+Math.max(0,dAss)*2));
    const maggNew=fteNew*oreNecFte*b.pMagg*(1+Math.max(0,dAss));
    const effNew=oreNow.ordRese+Math.max(0,oreNow.gap);
    const impStraNew=prev.imp_stra*(straNew/(prev.stra||1))*(1+dinBase);
    const ore=oreOf(fteNew,fx.ass,straNew,maggNew);
    const cur={
      anno:t, costo:costo, base:baseNew, ind:indNew,
      imp_stra:impStraNew, imp_magg:prev.imp_magg*(1+dinBase)*(maggNew/(prev.magg||1)),
      nonric:prev.nonric*(1+comp(g.istat/100)),
      fte:fteNew, costoFte:fteNew>0?costo/fteNew:0,
      stra:straNew, magg:maggNew, ord:oreNow.ordRese, eff:effNew,
      costoOra:effNew>0?costo/effNew:0, effRatio:oreNow.ordRese>0?effNew/oreNow.ordRese:0,
      pStra:oreNow.ordRese>0?straNew/oreNow.ordRese:0, pAss:fx.ass,
      ore:ore, bridge:bridge
    };
    years[t]=cur; prev=cur;
  });
  return years;
}
function projectAll(){
  const out={by:{},tot:{}};
  [Y0].concat(HORIZON).forEach(y=>out.tot[y]={costo:0,fte:0,base:0,imp_stra:0,stra:0,ord:0,eff:0,ind:0,imp_magg:0,nonric:0,magg:0,
    oContr:0,oNec:0,oOrd:0,oStra:0,oMagg:0,oFlex:0,oGap:0});
  FUNCS.forEach(f=>{
    const p=projectFunc(f); out.by[f]=p;
    [Y0].concat(HORIZON).forEach(y=>{
      const k=out.tot[y], v=p[y];
      k.costo+=v.costo; k.fte+=v.fte; k.base+=v.base; k.imp_stra+=v.imp_stra;
      k.stra+=v.stra; k.ord+=v.ord; k.eff+=v.eff; k.ind+=v.ind;
      k.imp_magg+=v.imp_magg; k.nonric+=v.nonric; k.magg+=(v.magg||0);
      const o=v.ore; if(o){k.oContr+=o.contr; k.oNec+=o.nec; k.oOrd+=o.ordRese;
        k.oStra+=o.stra; k.oMagg+=o.magg; k.oFlex+=o.flex; k.oGap+=o.gap;}
    });
  });
  [Y0].concat(HORIZON).forEach(y=>{
    const k=out.tot[y];
    k.costoFte=k.fte>0?k.costo/k.fte:0;
    k.pStra=k.ord>0?k.stra/k.ord:0;
    k.costoOra=k.eff>0?k.costo/k.eff:0;
    k.effRatio=k.ord>0?k.eff/k.ord:0;
    let a=0,w=0; FUNCS.forEach(f=>{a+=state.fx[f].ass*BASE.funzioni[f].fte; w+=BASE.funzioni[f].fte;});
    k.pAss=w>0?a/w:0;
  });
  return out;
}
let MODEL=projectAll();

/* ---------- metriche per tab ---------- */
const MET={
  cost:{lbl:'Costo del lavoro', g:y=>y.costo, f:eur, sub:'totale annuo'},
  over:{lbl:'Importo straordinari', g:y=>y.imp_stra, f:eur, sub:'costo lordo annuo'},
  abs:{lbl:'Tasso di assenza', g:y=>y.pAss, f:pct1, sub:'media ponderata FTE'},
  prod:{lbl:'Costo per ora resa', g:y=>y.costoOra, f:eur2, sub:'efficienza di costo'},
  ore:{lbl:'Fabbisogno ore', g:y=>y.oNec, f:hh, sub:'ore da schemi orari'}
};

/* ---------- pannello parametri globali ---------- */
function drawAssumi(){
  const el=document.getElementById('assumi');
  el.innerHTML=LEVE.map(L=>{
    const v=state.g[L.k];
    const step=L.k==='unatantum'?100:(L.k==='sconto'||L.k==='coper'?1:0.1);
    return '<div class="par"><label>'+L.n+'</label>'+
      '<div class="rowin"><input type="number" id="g_'+L.k+'" value="'+v+'" step="'+step+'" '+
      (L.k==='unatantum'?'':'min="-10" max="60"')+'><span class="u">'+L.u+'</span></div>'+
      '<div class="hint">'+L.hint+'</div></div>';
  }).join('');
  LEVE.forEach(L=>{
    document.getElementById('g_'+L.k).addEventListener('input',e=>{
      const v=parseFloat(e.target.value);
      state.g[L.k]=isFinite(v)?v:0; MODEL=projectAll(); renderAll();
    });
  });
}

/* ---------- KPI ---------- */
function renderKPI(){
  const m=MET[state.tab], T=MODEL.tot, y0=T[Y0], y1=T[2027], y3=T[2030];
  let cards;
  if(state.tab==='ore'){
    cards=[
      ['Fabbisogno 2027', hh(y1.oNec), fmtD(y0.oNec?(y1.oNec-y0.oNec)/y0.oNec:null)+' su '+Y0, 'ore da schemi orari'],
      ['Ordinarie rese 2027', hh(y1.oOrd), 'copertura '+pct1(y1.oNec?y1.oOrd/y1.oNec:0), 'al netto assenze'],
      ['Straordinarie 2027', hh(y1.oStra), fmtD(y0.oStra?(y1.oStra-y0.oStra)/y0.oStra:null), 'oltre il contrattuale'],
      ['Maggiorate 2027', hh(y1.oMagg), pct1(y1.oNec?y1.oMagg/y1.oNec:0)+' del fabbisogno', 'a tariffa premium']
    ];
  }else{
    const cagr=y3.costo>0&&y0.costo>0?Math.pow(y3.costo/y0.costo,1/(2030-Y0))-1:0;
    const v0=m.g(y0), v1=m.g(y1), v3=m.g(y3);
    const d1=v0?(v1-v0)/Math.abs(v0):null, d3=v0?(v3-v0)/Math.abs(v0):null;
    cards=[
      ['2027 · anno successivo', m.f(v1), fmtD(d1)+' su '+Y0, m.sub],
      ['2030 · fine orizzonte', m.f(v3), fmtD(d3)+' su '+Y0, 'quarto anno'],
      [state.tab==='cost'?'CAGR costo 25→30':'Base '+Y0, state.tab==='cost'?pct1(cagr):m.f(v0),
        state.tab==='cost'?'crescita media annua':'anno di partenza',
        state.tab==='cost'?'composto':'ultimo anno pieno'],
      ['FTE 2030', num1(T[2030].fte), fmtD(T[Y0].fte?(T[2030].fte-T[Y0].fte)/T[Y0].fte:null), 'organico proiettato']
    ];
  }
  document.getElementById('kpis').innerHTML=cards.map((c,i)=>
    '<div class="kpi" data-co="kpi" data-i="'+i+'"><span class="t">'+c[0]+'</span><span class="v">'+c[1]+'</span>'+
    '<span class="d">'+c[2]+'</span><span class="s">'+c[3]+'</span></div>').join('');
}
function fmtD(d){return (d===null||!isFinite(d))?'—':((d>0?'+':d<0?'−':'')+pct1(Math.abs(d)));}

/* ---------- grafico 1: traiettoria a linea ---------- */
function seg(x1,y1,x2,y2,color,w,dash){
  const up=y2>=y1, lo=Math.min(y1,y2), h=Math.abs(y2-y1);
  const style='left:'+x1.toFixed(3)+'%;width:'+(x2-x1).toFixed(3)+'%;bottom:'+lo.toFixed(3)+'%;';
  if(h<0.15)return '<div class="seg" style="'+style+'height:0;border-top:'+w+'px '+(dash?'dashed':'solid')+' '+color+'"></div>';
  const dir=up?'to bottom right':'to top right';
  const gg='linear-gradient('+dir+',transparent calc(50% - '+(w/2)+'px),'+color+' calc(50% - '+(w/2)+'px),'+
          color+' calc(50% + '+(w/2)+'px),transparent calc(50% + '+(w/2)+'px))';
  return '<div class="seg" style="'+style+'height:'+h.toFixed(3)+'%;background:'+gg+'"></div>';
}
function drawChart1(){
  const m=MET[state.tab], years=[Y0].concat(HORIZON);
  document.getElementById('k1').textContent='Traiettoria';
  document.getElementById('c1t').textContent=m.lbl+' '+Y0+'–2030';
  document.getElementById('c1c').textContent='Punto di partenza '+Y0+', proiezione a quattro anni sotto lo scenario '+state.scenario+'.';
  const vals=years.map(y=>m.g(MODEL.tot[y]));
  let hi=Math.max.apply(null,vals),lo=Math.min.apply(null,vals);
  const pad=(hi-lo)*0.2||Math.abs(hi)*0.1||1; hi+=pad; lo=Math.max(0,lo-pad); if(hi===lo)hi=lo+1;
  const n=years.length, X=i=>i/(n-1)*100, Y=v=>(v-lo)/(hi-lo)*100;
  let h='<div class="lchart">'+
    '<i class="grid" style="bottom:100%"></i><i class="grid" style="bottom:50%"></i>'+
    '<span class="cap-v" style="bottom:100%;transform:translateY(50%)">'+m.f(hi)+'</span>'+
    '<span class="cap-v" style="bottom:0;transform:translateY(50%)">'+m.f(lo)+'</span>';
  // segmento base->2027 tratteggiato (e una previsione, non un consuntivo)
  for(let i=0;i<n-1;i++)h+=seg(X(i),Y(vals[i]),X(i+1),Y(vals[i+1]),'var(--amber)',2.5,i>=0);
  for(let i=0;i<n;i++)h+='<div class="pt" style="left:'+X(i).toFixed(3)+'%;bottom:'+Y(vals[i]).toFixed(3)+
    '%" title="'+years[i]+': '+m.f(vals[i])+'"></div>';
  h+='</div><div class="laxis">';
  years.forEach((y,i)=>{h+='<span style="left:'+X(i).toFixed(3)+'%">'+(y===Y0?y+' base':y)+'</span>';});
  h+='</div><div class="legend"><span><i></i>'+m.lbl.toLowerCase()+', linea tratteggiata = proiezione</span></div>';
  document.getElementById('chart1').innerHTML=h;
}

/* ---------- grafico 2: 2027 per funzione, con delta sul base ---------- */
function drawChart2(){
  const m=MET[state.tab];
  document.getElementById('k2').textContent='Per funzione';
  if(state.tab==='ore'){
    document.getElementById('c2t').textContent='Copertura del fabbisogno 2027 per funzione';
    document.getElementById('c2c').textContent='Barra piena = ordinarie rese; contorno = fabbisogno. Dove il contorno sporge, il servizio va coperto altrimenti.';
    const items=FUNCS.map(f=>{const p=MODEL.by[f][2027].ore;return{k:f,ord:p.ordRese,nec:p.nec};})
      .sort((a,b)=>b.nec-a.nec).slice(0,10);
    const mx=Math.max.apply(null,items.map(i=>Math.max(i.nec,i.ord)).concat([1]));
    let h='<div class="hchart">';
    items.forEach((i,idx)=>{
      const short=i.nec>i.ord;
      h+='<div class="hrow"><span class="lbl" title="'+esc(i.k)+'">'+esc(cut(i.k,26))+'</span>'+
        '<span class="track">'+
        '<span class="fill prev" style="width:'+(i.nec/mx*100).toFixed(1)+'%"></span>'+
        '<span class="fill'+(short?'':' peak')+'" style="width:'+(i.ord/mx*100).toFixed(1)+'%"></span>'+
        '</span><span class="val">'+hh(i.nec)+'</span></div>';
    });
    document.getElementById('chart2').innerHTML=h+'</div>';
    return;
  }
  document.getElementById('c2t').textContent=m.lbl+' 2027 per funzione';
  document.getElementById('c2c').textContent='Valore proiettato al 2027, ordinato per grandezza. Barra chiara = base '+Y0+'.';
  const items=FUNCS.map(f=>({k:f,cur:m.g(MODEL.by[f][2027]),base:m.g(MODEL.by[f][Y0])}))
    .sort((a,b)=>b.cur-a.cur).slice(0,10);
  const mx=Math.max.apply(null,items.map(i=>Math.max(i.cur,i.base)).concat([1]));
  let h='<div class="hchart">';
  items.forEach((i,idx)=>{
    h+='<div class="hrow"><span class="lbl" title="'+esc(i.k)+'">'+esc(cut(i.k,26))+'</span>'+
      '<span class="track">'+
      '<span class="fill'+(idx===0?' peak':'')+'" style="width:'+(i.cur/mx*100).toFixed(1)+'%"></span>'+
      '<span class="fill prev" style="width:'+(i.base/mx*100).toFixed(1)+'%"></span>'+
      '</span><span class="val">'+m.f(i.cur)+'</span></div>';
  });
  document.getElementById('chart2').innerHTML=h+'</div>';
}

/* ---------- griglia di proiezione anno per anno ---------- */
function drawProjgrid(){
  const m=MET[state.tab], years=[Y0].concat(HORIZON), T=MODEL.tot;
  document.getElementById('pgt').textContent=m.lbl+', anno per anno';
  document.getElementById('pgc').textContent='Totale di perimetro. La colonna 2027 è l\'anno successivo. Passa sui numeri per la spiegazione del dato.';
  let h='<div class="projgrid"><div class="cell h lbl">Metrica</div>';
  years.forEach(y=>h+='<div class="cell h num'+(y===2027?' now':(y===Y0?' base':''))+'">'+(y===Y0?y+' base':(y===2027?y+' · succ.':y))+'</div>');
  const rows=(state.tab==='ore')?[
    ['Fabbisogno (schemi orari)', y=>hh(T[y].oNec), 'oNec'],
    ['Ore contrattuali teoriche', y=>hh(T[y].oContr), 'oContr'],
    ['Ordinarie rese', y=>hh(T[y].oOrd), 'oOrd'],
    ['Straordinarie', y=>hh(T[y].oStra), 'oStra'],
    ['Maggiorate (premium)', y=>hh(T[y].oMagg), 'oMagg'],
    ['Divario di copertura', y=>hh(T[y].oGap), 'oGap']
  ]:[
    ['Costo del lavoro', y=>eur(T[y].costo), 'costo'],
    ['FTE medio', y=>num1(T[y].fte), 'fte'],
    ['Costo per FTE', y=>eur(T[y].costoFte), 'costoFte'],
    ['Importo straordinari', y=>eur(T[y].imp_stra), 'imp_stra'],
    ['Tasso di assenza', y=>pct1(T[y].pAss), 'pAss'],
    ['Costo per ora resa', y=>eur2(T[y].costoOra), 'costoOra']
  ];
  rows.forEach(r=>{
    h+='<div class="cell lbl">'+r[0]+'</div>';
    years.forEach(y=>{
      h+='<div class="cell num'+(y===2027?' now':(y===Y0?' base':''))+
         '" data-co="grid" data-metric="'+r[2]+'" data-year="'+y+'"><span class="v">'+r[1](y)+'</span></div>';
    });
  });
  document.getElementById('projgrid').innerHTML=h+'</div>';
}

/* ---------- tabella funzioni: zone dichiarate ----------
   anagrafica | LEVE editabili (ambra) | RISULTATI calcolati. Un filetto pieno
   separa le leve dai risultati, cosi si vede a colpo d'occhio cosa si tocca. */
function drawFtbl(){
  const t=document.getElementById('ftbl');
  let h='<thead>'+
    '<tr><td colspan="3" class="grp"></td>'+
    '<td colspan="2" class="grp lev zsep">Leve modificabili</td>'+
    '<td colspan="3" class="grp zsep">Risultati proiettati</td></tr>'+
    '<tr><th>Funzione</th><th>FTE base</th><th>Costo '+Y0+'</th>'+
    '<th class="zsep">Assenteismo</th><th>Turnover</th>'+
    '<th class="zsep">Costo 2027</th><th>Costo 2030</th><th>Δ 25→30</th></tr></thead><tbody>';
  FUNCS.forEach(f=>{
    const b=BASE.funzioni[f], fx=state.fx[f], p=MODEL.by[f];
    const d=b.costo?(p[2030].costo-b.costo)/b.costo:0;
    h+='<tr>'+
      '<td title="'+esc(f)+'">'+esc(cut(f,24))+'</td>'+
      '<td class="num" data-co="ftbl" data-f="'+esc(f)+'" data-k="fte">'+num1(b.fte)+'</td>'+
      '<td class="num" data-co="ftbl" data-f="'+esc(f)+'" data-k="base">'+eur(b.costo)+'</td>'+
      '<td class="lev-cell zsep"><span class="inwrap"><input type="number" data-f="'+esc(f)+'" data-k="ass" value="'+(fx.ass*100).toFixed(1)+'" step="0.5" min="0" max="60"><span class="u">%</span></span></td>'+
      '<td class="lev-cell"><span class="inwrap"><input type="number" data-f="'+esc(f)+'" data-k="turn" value="'+(fx.turn*100).toFixed(1)+'" step="1" min="0" max="60"><span class="u">%</span></span></td>'+
      '<td class="num zsep" data-co="ftbl" data-f="'+esc(f)+'" data-k="c27">'+eur(p[2027].costo)+'</td>'+
      '<td class="num" data-co="ftbl" data-f="'+esc(f)+'" data-k="c30">'+eur(p[2030].costo)+'</td>'+
      '<td class="num" data-co="ftbl" data-f="'+esc(f)+'" data-k="delta">'+(d>0?'+':'')+pct1(d)+'</td></tr>';
  });
  const T=MODEL.tot;
  const dt=(T[2030].costo-T[Y0].costo)/T[Y0].costo;
  h+='<tr class="total"><td>Totale</td><td>'+num1(T[Y0].fte)+'</td><td>'+eur(T[Y0].costo)+'</td>'+
    '<td class="zsep">'+pct1(T[Y0].pAss)+'</td><td>—</td>'+
    '<td class="zsep">'+eur(T[2027].costo)+'</td><td>'+eur(T[2030].costo)+'</td>'+
    '<td>+'+pct1(dt)+'</td></tr></tbody>';
  t.innerHTML=h;
  t.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',e=>{
    const f=e.target.dataset.f, k=e.target.dataset.k, v=parseFloat(e.target.value)/100;
    if(isFinite(v))state.fx[f][k]=Math.max(0,Math.min(0.6,v));
    MODEL=projectAll(); renderAll(false);
  }));
}

/* ---------- callout: spiegazione del dato al passaggio ----------
   Un pannello unico, riposizionato via JS. Per ogni numero costruisce la
   spiegazione con la formula effettiva del modello, cosi il dato non e mai
   opaco: si legge da dove viene. */
const CO=document.getElementById('callout');
const YLBL=y=>y==Y0?(y+' (base)'):(y==2027?(y+' (anno successivo)'):String(y));
function coBuild(t){
  const T=MODEL.tot;
  if(t.dataset.co==='kpi'){
    const i=+t.dataset.i, m=MET[state.tab];
    const kk=t.querySelector('.t').textContent, vv=t.querySelector('.v').textContent;
    let bodies;
    if(state.tab==='ore'){
      bodies=[
        'Ore che i turni richiedono nel 2027, sommate su tutte le funzioni. È il target di copertura del servizio: da qui parte ogni ragionamento sull\'organico.',
        'Ore ordinarie effettivamente rese dall\'organico presente nel 2027, al netto dell\'assenteismo. Il rapporto sul fabbisogno dice quanto il servizio regge da solo.',
        'Ore di straordinario 2027: quelle oltre il contrattuale, usate per colmare il divario. Salgono se alzi l\'assenteismo o il fabbisogno.',
        'Ore a tariffa maggiorata 2027, notturno e festivo. Sottoinsieme trasversale: pesano sul costo orario, non aggiungono volume.'
      ];
    }else{
      bodies=[
        'Valore proiettato per il 2027, primo anno dopo la base. È il numero che va a budget per l\'esercizio successivo.',
        'Fine orizzonte, quarto anno di proiezione. Mostra dove arriva il costo se lo scenario tiene per l\'intero periodo.',
        state.tab==='cost'?'Tasso di crescita composto medio annuo dalla base al 2030. Smorza gli scalini annui in un ritmo unico.':'Valore dell\'anno base '+Y0+', punto di partenza della proiezione.',
        'Organico proiettato al 2030. Cambia solo se muovi la leva Organico o modifichi le funzioni.'
      ];
    }
    return {k:kk, v:vv, body:bodies[i]||'', form:'', hint:'Scenario '+state.scenario};
  }
  if(t.dataset.co==='oretbl'){
    const f=t.dataset.f, kk=t.dataset.k, b=BASE.funzioni[f], p=MODEL.by[f][2027].ore;
    const NM={contr:'Ore contrattuali per FTE',nec:'Fabbisogno da schemi orari',ord:'Ordinarie rese',
      stra:'Straordinarie',magg:'Maggiorate'};
    let body='',form='';
    if(kk==='contr'){body='Monte ore contrattuale medio per FTE, osservato nel '+Y0+'. È lo schema orario teorico: quanto ogni FTE deve, prima delle assenze.';return{k:f+' · '+NM.contr,v:num0(b.oreContrFte)+' h',body:body,form:'',hint:''};}
    if(kk==='nec'){body='Ore che i turni richiedono nel 2027, dalla leva Nec./FTE accanto. Se le ordinarie rese non bastano, il resto va coperto.';form='FTE 2027 × '+num0(state.necFte[f])+' h';return{k:f+' · '+NM.nec,v:hh(p.nec),body:body,form:form,hint:''};}
    if(kk==='ord'){body='Ore ordinarie effettivamente rese: contrattuali al netto dell\'assenteismo <b>'+pct1(state.fx[f].ass)+'</b> impostato.';form='contrattuali × (1 − assenteismo)';return{k:f+' · '+NM.ord,v:hh(p.ordRese),body:body,form:form,hint:'copertura '+pct1(p.nec?p.ordRese/p.nec:0)+' del fabbisogno'};}
    if(kk==='stra'){body='Ore oltre il contrattuale per coprire il divario. Crescono col fabbisogno e con l\'assenteismo.';return{k:f+' · '+NM.stra,v:hh(p.stra),body:body,form:'',hint:p.gap>0?('divario da coprire '+hh(p.gap)):'nessun divario'};}
    if(kk==='magg'){body='Ore a tariffa maggiorata (notturno, festivo). Sono un sottoinsieme trasversale delle lavorate, non additive: pesano sul costo, non sul volume.';return{k:f+' · '+NM.magg,v:hh(p.magg),body:body,form:'',hint:pct1(p.nec?p.magg/p.nec:0)+' del fabbisogno'};}
  }
  if(t.dataset.co==='orebar'){
    const y=+t.dataset.year, k=MODEL.tot[y];
    return{k:'Copertura del fabbisogno · '+YLBL(y), v:hh(k.oNec),
      body:'Come si compone il fabbisogno: <b>'+hh(k.oOrd)+'</b> di ordinarie rese, <b>'+hh(k.oStra)+'</b> di straordinario, il resto in flessibilità e sostituzioni. Il divario da colmare è <b>'+hh(k.oGap)+'</b>.',
      form:'ordinarie '+pct1(k.oNec?k.oOrd/k.oNec:0)+' + copertura '+pct1(k.oNec?(k.oGap)/k.oNec:0),
      hint:'maggiorate '+hh(k.oMagg)+' come overlay di costo'};
  }
  if(t.dataset.co==='grid'){
    const mk=t.dataset.metric, y=+t.dataset.year, cur=T[y][mk], base=T[Y0][mk];
    const NAMES={costo:'Costo del lavoro',fte:'FTE medio',costoFte:'Costo per FTE',
      imp_stra:'Importo straordinari',pAss:'Tasso di assenza',costoOra:'Costo per ora resa',
      oNec:'Fabbisogno (schemi orari)',oContr:'Ore contrattuali teoriche',oOrd:'Ordinarie rese',
      oStra:'Straordinarie',oMagg:'Maggiorate',oGap:'Divario di copertura'};
    const FMT={costo:eur,fte:num1,costoFte:eur,imp_stra:eur,pAss:pct1,costoOra:eur2,
      oNec:hh,oContr:hh,oOrd:hh,oStra:hh,oMagg:hh,oGap:hh};
    const d=base?(cur-base)/Math.abs(base):null;
    let form='',body='';
    if(y===Y0){
      body='Valore di partenza, anno pieno '+Y0+'. Da qui muove tutta la proiezione.';
    }else{
      const prevY=(y===2027)?Y0:y-1, step=(y===2027)?'due annualità (salta il 2026, non pieno)':'una annualità';
      form=YLBL(prevY)+'  →  '+YLBL(y)+'\ncomposto su '+step;
      if(mk==='costo')body='Somma dei costi di funzione proiettati. Ogni euro è scomponibile nel <b>Ponte</b>: dinamica base, ISTAT, turnover, copertura, una tantum.';
      else if(mk==='costoFte')body='Costo totale diviso FTE. Sale se la dinamica retributiva batte l\'effetto di ricambio del turnover.';
      else if(mk==='imp_stra')body='Straordinario proiettato: segue l\'assenteismo impostato e la dinamica base sulle tariffe.';
      else if(mk==='pAss')body='Media degli assenteismi di funzione, pesata per FTE. Cambia solo se modifichi le leve in tabella.';
      else if(mk==='costoOra')body='Costo diviso ore effettive. È l\'indicatore che riassume tariffe, assenze e straordinari.';
      else if(mk==='oNec')body='Ore che i turni richiedono: FTE per fabbisogno unitario. È il target di copertura del servizio.';
      else if(mk==='oContr')body='Monte ore contrattuale teorico, prima delle assenze. FTE per ore contrattuali unitarie.';
      else if(mk==='oOrd')body='Ordinarie effettivamente rese: contrattuali al netto dell\'assenteismo impostato.';
      else if(mk==='oStra')body='Ore oltre il contrattuale per colmare il divario. Crescono col fabbisogno e con l\'assenteismo.';
      else if(mk==='oMagg')body='Ore a tariffa maggiorata, sottoinsieme trasversale delle lavorate. Pesano sul costo, non sul volume.';
      else if(mk==='oGap')body='Fabbisogno meno ordinarie rese: le ore che il servizio richiede e l\'organico presente non copre. Si colmano con straordinario, flessibilità, sostituzioni.';
      else body='Grandezza derivata dalla proiezione di costo e organico.';
    }
    return {k:NAMES[mk]+' · '+YLBL(y), v:FMT[mk](cur), body:body, form:form,
      hint:(d!==null&&y!==Y0)?('Δ '+(d>0?'+':'')+pct1(d)+' sulla base '+Y0):''};
  }
  if(t.dataset.co==='ftbl'){
    const f=t.dataset.f, k=t.dataset.k, b=BASE.funzioni[f], p=MODEL.by[f], fx=state.fx[f];
    if(k==='fte')return{k:f+' · FTE base',v:num1(b.fte),
      body:'Organico medio '+Y0+' in equivalenti a tempo pieno, dai dati a livello di dipendente.',form:'',hint:''};
    if(k==='base')return{k:f+' · Costo '+Y0,v:eur(b.costo),
      body:'Costo del lavoro '+Y0+' della funzione. Pesa <b>'+pct1(BASE.tot?b.costo/BASE.tot:0)+'</b> del totale.',form:'',hint:''};
    if(k==='c27'||k==='c30'){
      const y=k==='c27'?2027:2030, cur=p[y].costo;
      return{k:f+' · Costo '+y,v:eur(cur),
        body:'Proiezione della funzione allo scenario <b>'+state.scenario+'</b>, con assenteismo <b>'+pct1(fx.ass)+'</b> e turnover <b>'+pct1(fx.turn)+'</b> impostati qui accanto.',
        form:'base '+eur(b.costo)+'  →  '+eur(cur),
        hint:'Δ '+(b.costo?((cur-b.costo)/b.costo>0?'+':''):'')+pct1(b.costo?(cur-b.costo)/b.costo:0)+' sulla base'};
    }
    if(k==='delta'){const d=b.costo?(p[2030].costo-b.costo)/b.costo:0;
      return{k:f+' · variazione 25→30',v:(d>0?'+':'')+pct1(d),
        body:'Crescita cumulata del costo su cinque anni, dallo scenario e dalle leve correnti.',
        form:eur(b.costo)+'  →  '+eur(p[2030].costo),
        hint:'CAGR '+pct1(Math.pow(p[2030].costo/b.costo,1/(2030-Y0))-1)+' medio annuo'};
    }
  }
  return null;
}
function coShow(t,ev){
  const d=coBuild(t); if(!d)return;
  CO.innerHTML='<div class="co-k">'+esc(d.k)+'</div><div class="co-v">'+d.v+'</div>'+
    '<div class="co-b">'+d.body+'</div>'+
    (d.form?'<div class="co-form">'+esc(d.form).replace(/\n/g,'<br>')+'</div>':'')+
    (d.hint?'<div class="co-hint">'+esc(d.hint)+'</div>':'');
  CO.dataset.on='1';
  coMove(ev);
}
function coMove(ev){
  const pad=16, w=CO.offsetWidth||320, h=CO.offsetHeight||140;
  let x=ev.clientX+pad, y=ev.clientY+pad;
  if(x+w>window.innerWidth-8) x=ev.clientX-w-pad;
  if(y+h>window.innerHeight-8) y=ev.clientY-h-pad;
  CO.style.left=Math.max(8,x)+'px'; CO.style.top=Math.max(8,y)+'px';
}
function coHide(){CO.dataset.on='0';}
document.addEventListener('mouseover',e=>{
  const t=e.target.closest('[data-co]'); if(t)coShow(t,e);
});
document.addEventListener('mousemove',e=>{
  if(CO.dataset.on==='1'){
    const t=e.target.closest('[data-co]');
    if(t)coMove(e); else coHide();
  }
});
document.addEventListener('mouseout',e=>{
  const t=e.target.closest('[data-co]');
  if(t&&!e.relatedTarget?.closest?.('[data-co]'))coHide();
});

/* ---------- sezione ore: barra di composizione + tabella editabile ---------- */
function drawOreSection(){
  const sec=document.getElementById('oresec');
  sec.style.display=(state.tab==='ore')?'block':'none';
  if(state.tab!=='ore')return;
  const T=MODEL.tot;
  // barra impilata: come si compone il fabbisogno di ogni anno
  const years=[Y0,2027,2030];
  let bars='';
  years.forEach(y=>{
    const k=T[y], nec=k.oNec||1;
    const parts=[
      ['Ordinarie rese', k.oOrd, 's1'],
      ['Straordinarie', k.oStra, 's2'],
      ['Flessibilità e sostituzioni', Math.max(0,k.oGap-k.oStra), 's3']
    ];
    let seg='';
    parts.forEach(p=>{const w=p[1]/nec*100; if(w>0.2)seg+='<span class="'+p[2]+'" style="width:'+w.toFixed(2)+'%" title="'+esc(p[0])+': '+hh(p[1])+'"></span>';});
    bars+='<div class="orebar-row"><span class="oy">'+(y===Y0?y+' base':(y===2027?y+' · succ.':y))+'</span>'+
      '<div class="hstack" data-co="orebar" data-year="'+y+'">'+seg+'</div>'+
      '<span class="ov">'+hh(nec)+'</span></div>';
  });
  const legend='<div class="skey" style="margin-top:var(--s2)">'+
    '<div><i class="s1"></i>Ordinarie rese</div>'+
    '<div><i class="s2"></i>Straordinarie</div>'+
    '<div><i class="s3"></i>Flessibilità e sostituzioni</div>'+
    '<div><i style="background:transparent;border:1px solid var(--slate-2)"></i>bordo = fabbisogno pieno</div></div>';
  document.getElementById('orebars').innerHTML='<div class="orebars">'+bars+'</div>'+legend;
  drawOretbl();
}
function drawOretbl(){
  const t=document.getElementById('oretbl');
  let h='<thead>'+
    '<tr><td colspan="2" class="grp"></td><td class="grp lev zsep">Leva</td>'+
    '<td colspan="4" class="grp zsep">Ore 2027 proiettate</td></tr>'+
    '<tr><th>Funzione</th><th>Contr./FTE</th>'+
    '<th class="zsep">Nec./FTE</th>'+
    '<th class="zsep">Fabbisogno</th><th>Ordinarie</th><th>Straord.</th><th>Maggiorate</th></tr></thead><tbody>';
  FUNCS.forEach(f=>{
    const b=BASE.funzioni[f], p=MODEL.by[f][2027].ore, nec=state.necFte[f];
    h+='<tr>'+
      '<td title="'+esc(f)+'">'+esc(cut(f,22))+'</td>'+
      '<td class="num" data-co="oretbl" data-f="'+esc(f)+'" data-k="contr">'+num0(b.oreContrFte)+'</td>'+
      '<td class="lev-cell zsep"><span class="inwrap"><input type="number" data-f="'+esc(f)+'" data-nk="nec" value="'+Math.round(nec)+'" step="20" min="200" max="2200"><span class="u">h</span></span></td>'+
      '<td class="num zsep" data-co="oretbl" data-f="'+esc(f)+'" data-k="nec">'+hh(p.nec)+'</td>'+
      '<td class="num" data-co="oretbl" data-f="'+esc(f)+'" data-k="ord">'+hh(p.ordRese)+'</td>'+
      '<td class="num" data-co="oretbl" data-f="'+esc(f)+'" data-k="stra">'+hh(p.stra)+'</td>'+
      '<td class="num" data-co="oretbl" data-f="'+esc(f)+'" data-k="magg">'+hh(p.magg)+'</td></tr>';
  });
  const T=MODEL.tot[2027];
  h+='<tr class="total"><td>Totale</td><td>—</td><td class="zsep">—</td>'+
    '<td class="zsep">'+hh(T.oNec)+'</td><td>'+hh(T.oOrd)+'</td><td>'+hh(T.oStra)+'</td><td>'+hh(T.oMagg)+'</td></tr></tbody>';
  t.innerHTML=h;
  t.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',e=>{
    const f=e.target.dataset.f, v=parseFloat(e.target.value);
    if(isFinite(v))state.necFte[f]=Math.max(200,Math.min(2200,v));
    MODEL=projectAll(); renderAll(false);
  }));
}

/* ---------- ponte: scomposizione base -> 2027 ---------- */
function openBridge(){document.getElementById('bridgebg').hidden=false; renderBridge();}
function closeBridge(){document.getElementById('bridgebg').hidden=true;}
function renderBridge(){
  const yr=state.bridgeYear;
  const prevYear=(HORIZON.indexOf(yr)===0)?Y0:yr-1;
  document.getElementById('b_title').textContent='Ponte del costo — '+(prevYear===Y0?Y0+' base':String(prevYear))+' verso '+yr;
  document.getElementById('b_sub').textContent='Scenario '+state.scenario+'. Contributi calcolati sul totale di perimetro.';
  // aggrego i bridge di tutte le funzioni per l'anno scelto
  const agg={};
  FUNCS.forEach(f=>{
    const br=MODEL.by[f][yr].bridge; if(!br)return;
    br.forEach(x=>{agg[x.l]=(agg[x.l]||0)+x.v;});
  });
  const prev=MODEL.tot[prevYear].costo, cur=MODEL.tot[yr].costo, delta=cur-prev;
  let h='<div class="seg" style="display:none"></div>';
  h+='<div style="display:flex;gap:var(--s2);flex-wrap:wrap;margin-bottom:var(--s3)">';
  HORIZON.forEach((y,ix)=>{
    const pv=(ix===0)?(Y0+' base'):(y-1);
    h+='<button class="'+(y===yr?'solid':'ghost')+'" data-by="'+y+'">'+pv+' → '+y+'</button>';
  });
  h+='</div>';
  h+='<div class="headvar"><span class="kicker">Variazione '+(prevYear===Y0?'dalla base':'annua')+'</span>'+
     '<div class="big">'+(delta>=0?'+':'−')+eur(Math.abs(delta))+'</div>'+
     '<div class="meta">'+(prev?((delta/prev>0?'+':'−')+pct1(Math.abs(delta/prev))+' / '):'')+
     eur(prev)+' → '+eur(cur)+'</div></div>';
  h+='<div class="msec"><span class="kicker">Scomposizione</span>'+
     '<p class="hint">Ogni strato e calcolato dai parametri correnti. Un valore negativo riduce il costo: qui lo sconto turnover.</p>';
  const order=['Organico','Dinamica base (CCNL+integrativo+scatti)','Rivalutazione ISTAT su indennità',
    'Sconto turnover (neoassunti)','Copertura assenteismo','Una tantum turnover'];
  const mx=Math.max.apply(null,order.map(l=>Math.abs(agg[l]||0)).concat([1]));
  order.forEach(l=>{const v=agg[l]||0;
    h+='<div class="brow"><span>'+l+'</span><span class="track">'+
      '<span class="fill'+(v<0?' neg':'')+'" style="width:'+(Math.abs(v)/mx*100).toFixed(1)+'%"></span></span>'+
      '<span class="val">'+(v>=0?'+':'−')+eur(Math.abs(v))+'</span></div>';
  });
  h+='<div class="brow tot"><span>Variazione totale</span><span></span><span class="val">'+
     (delta>=0?'+':'−')+eur(Math.abs(delta))+'</span></div></div>';
  h+='<div class="ref" style="margin-top:var(--s4)"><span class="kicker">Come leggerlo</span>'+
     'La dinamica base è la somma di CCNL, integrativo e scatti applicata alla sola retribuzione base. '+
     'L\'ISTAT tocca le indennità, non i tabellari. Lo sconto turnover misura il risparmio di chi entra al posto di chi esce, '+
     'con meno anzianità. La copertura assenteismo compare solo se l\'assenteismo impostato supera quello storico della funzione.</div>';
  document.getElementById('b_body').innerHTML=h;
  document.querySelectorAll('#b_body [data-by]').forEach(b=>b.onclick=()=>{state.bridgeYear=+b.dataset.by;renderBridge();});
}

/* ---------- note metodologiche ---------- */
function drawNotes(){
  const T=MODEL.tot;
  const NOTES=[
    ['Base di calcolo','ok',
      '<p>Il punto di partenza è l\'anno <b>'+Y0+' completo</b>, dodici mensilità, non il 2026: del 2026 esistono solo cinque mesi e annualizzarli avrebbe proiettato la stagionalità di gennaio-maggio su tutto l\'anno. Il costo base di perimetro è <b>'+eur(BASE.tot)+'</b>.</p>'+
      '<p>Il primo 2026 non è però ignorato: il costo per FTE è cresciuto del <b>'+pct1(BASE.drift_osservato)+'</b> tra i due primi quadrimestri, e questo scostamento reale ha calibrato gli ordini di grandezza dei parametri di default.</p>'],
    ['CCNL e integrativo','ok',
      '<p>L\'aumento nazionale agisce sui <b>minimi tabellari</b>, cioè sulla sola retribuzione base, non sull\'intero costo. Applicarlo al costo totale sovrastimerebbe l\'effetto, perché indennità, straordinari e oneri seguono logiche diverse.</p>'+
      '<p>Il CCNL applicato va verificato: per una cooperativa socio-sanitaria è tipicamente il <b>CCNL Cooperative Sociali</b> (UNEBA o AGCI-Confcooperative-Legacoop a seconda dell\'adesione). Le percentuali qui sono ipotesi di lavoro, da sostituire con i valori del verbale di rinnovo effettivo.</p>'],
    ['ISTAT, e cosa NON è la BCE','warn',
      '<p>L\'ISTAT entra come <b>inflazione (IPCA o FOI)</b>: rivaluta le indennità e, fuori da questo modello, la rivalutazione annua del <b>TFR</b> (1,5% fisso più il 75% dell\'indice FOI). Non è un aumento tabellare e va tenuto distinto dal CCNL.</p>'+
      '<p><b>La BCE non fissa i salari.</b> I tassi di riferimento della Banca centrale non entrano direttamente nel costo del lavoro: incidono sul costo del debito e sugli oneri finanziari, non sulla busta paga. L\'ho richiamata dove serve — come guida all\'aspettativa di inflazione che orienta l\'IPCA — ma non come leva a sé, perché sarebbe un doppio conteggio con l\'ISTAT. Se serve l\'effetto BCE sugli oneri finanziari, è un altro conto, fuori dal costo del personale.</p>'],
    ['Scatti di anzianità','ok',
      '<p>Gli scatti sono una <b>deriva automatica</b>: la popolazione che resta invecchia e matura aumenti a prescindere dai rinnovi. Li ho messi come parametro separato perché il turnover li erode — chi esce porta via l\'anzianità accumulata, chi entra riparte da zero.</p>'],
    ['Turnover','ok',
      '<p>Il turnover di partenza è stimato dalle <b>matricole 2025 non più presenti nel primo 2026</b>, per funzione. È un proxy: coglie le uscite, non distingue pensionamenti da dimissioni, e sui cinque mesi del 2026 sottostima chi è uscito dopo maggio. Alcune funzioni piccole risultano a turnover zero solo perché nessuno è ancora uscito nella finestra osservata, non perché siano stabili. Correggilo dove conosci la realtà.</p>'+
      '<p>Nel modello il turnover ha due effetti opposti: <b>riduce</b> il costo (i neoassunti costano meno, per scatti persi) ma <b>aggiunge</b> un costo una tantum di selezione e inserimento. Il saldo dipende dallo sconto neoassunto e dal costo di ricambio che imposti.</p>'],
    ['Assenteismo','ok',
      '<p>L\'assenteismo di partenza è quello <b>storico osservato</b> per funzione. Nel budget non pesa sul costo diretto — le assenze retribuite sono già nel costo base — ma sulla <b>copertura</b>: se lo alzi sopra il valore storico, le ore in più vanno coperte con straordinario o sostituzioni, a un costo che imposti come sovrapprezzo sull\'ora ordinaria.</p>'+
      '<p>Se invece lo abbassi sotto il valore storico, il modello non genera un risparmio automatico: meno assenze liberano capacità, ma tradurla in minor costo richiede una decisione organizzativa, non un automatismo contabile. Per questo l\'effetto sotto la base è prudentemente nullo.</p>'],
    ['Cosa il modello NON cattura','warn',
      '<p>Non c\'è <b>stagionalità</b>: il budget è annuo, non mensile. Non ci sono <b>gradoni di organico</b>: l\'apertura o chiusura di un servizio è un evento discreto che qui va inserito a mano modificando gli FTE della funzione. Non c\'è <b>progressione di carriera</b> oltre gli scatti, né riqualificazioni di inquadramento.</p>'+
      '<p>Gli oneri riflessi (contributi, INAIL) si muovono con l\'imponibile e sono impliciti nel costo base; se le aliquote cambiano, il modello non lo sa. Il <b>cuneo fiscale</b> e le decontribuzioni per neoassunti non sono modellati e possono spostare il saldo del turnover in modo significativo.</p>'],
    ['Ore, fabbisogno e schemi orari','warn',
      '<p>Il <b>fabbisogno da schemi orari</b> è la parte più fragile del modello, perché i turni reali — il minutaggio assistenziale per ospite, la copertura per nucleo — non sono nel dato. Come proxy uso le <b>ore effettive erogate</b> nel '+Y0+' per FTE: sono quelle che di fatto hanno coperto i turni, quindi la miglior stima disponibile del bisogno. Il valore per funzione è <b>modificabile</b> nella tab Ore e turni: quando avrai lo standard regionale di minutaggio, va inserito lì al posto del proxy.</p>'+
      '<p>Le <b>ore contrattuali teoriche</b> sono il monte ore che ogni FTE deve, osservato nel '+Y0+' (circa 1.800 h/FTE), non un numero da manuale. Le <b>ordinarie rese</b> sono quel monte al netto dell\'assenteismo. Il <b>divario</b> fra fabbisogno e ordinarie rese è ciò che va coperto: sale con l\'assenteismo e con la crescita del servizio, e si paga in straordinario e maggiorazioni.</p>'+
      '<p>Le <b>ore maggiorate</b> non si sommano alle altre: sono un sottoinsieme trasversale delle ore lavorate che cade in fasce a tariffa premium — notturno, festivo, oltre la quarta notte. Le tengo separate perché pesano sul costo orario, non sul volume di copertura. Nel modello seguono il fabbisogno e l\'assenteismo, ma la loro entità reale dipende dalla rotazione dei turni, che è una scelta organizzativa.</p>'],
    ['Come usarlo','ok',
      '<p>Parti da uno dei tre scenari, poi correggi. I tre non sono probabilità: sono un <b>ventaglio</b>. Il centrale serve come base di lavoro, il prudente come pavimento, il teso come stress test per capire quanto regge il conto economico se tutto va storto insieme.</p>'+
      '<p>La leva più sensibile è quasi sempre la <b>dinamica base</b>, perché agisce su una massa grande e si compone anno su anno. Cambia quella per prima e guarda il ponte per vedere dove finisce ogni euro.</p>']
  ];
  let h='<div class="plan-h"><div><span class="kicker">Note</span><h2>Tutto quello che c\'è da sapere prima di firmare questo budget</h2></div>'+
    '<p class="lead">Un budget è una serie di ipotesi rese esplicite. Qui sotto ci sono tutte, con i limiti annessi. Nessun numero di questo cruscotto vale più delle ipotesi che lo generano.</p></div>';
  NOTES.forEach(n=>{
    h+='<div class="note-blk'+(n[1]==='warn'?' warn':'')+'"><div class="nh">'+n[0]+'</div><div class="nb">'+n[2]+'</div></div>';
  });
  document.getElementById('notes').innerHTML=h;
}

/* ---------- orchestrazione ---------- */
function renderAll(refreshInputs){
  renderKPI(); drawChart1(); drawChart2(); drawProjgrid(); drawOreSection(); drawNotes();
  if(refreshInputs!==false){/* i valori negli input restano quelli digitati */}
  drawFtblValues();
  const T=MODEL.tot;
  document.getElementById('scope').innerHTML='Scenario <b>'+state.scenario+'</b> / base <b>'+Y0+
    '</b> / orizzonte <b>2027–2030</b> / costo base <b>'+eur(T[Y0].costo)+'</b> → 2030 <b>'+eur(T[2030].costo)+'</b>';
  document.getElementById('stamp').innerHTML='Base<br>'+Y0+'<br><br>Orizzonte<br>2027–2030<br><br>Funzioni<br>'+FUNCS.length;
  document.getElementById('colophon').innerHTML=
    '<b>Fonte.</b> Costi e ore '+Y0+', dati a livello di dipendente, aggregati per funzione. Base di partenza '+eur(BASE.tot)+'. '+
    'Proiezione a parametri espliciti: nessun valore oltre il '+Y0+' è un consuntivo. '+
    'I riferimenti a CCNL, ISTAT e BCE sono indicativi e vanno sostituiti con i dati del rinnovo e dell\'indice effettivi.<br>'+
    '<b>Mastro Venturo</b> / Rough Cut / uso interno. Parallelo a Mastro Ore, stessa base dati.';
}
function drawFtblValues(){
  // aggiorna solo le colonne calcolate, senza ridisegnare gli input attivi
  const t=document.getElementById('ftbl');
  if(!t.querySelector('tbody')){drawFtbl();return;}
  drawFtbl();
}
function boot(){
  drawAssumi(); drawFtbl(); renderAll();
}

/* eventi */
document.querySelectorAll('#scenari button').forEach(b=>b.onclick=()=>{
  state.scenario=b.dataset.sc;
  document.querySelectorAll('#scenari button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  state.g=Object.assign({},SCENARI[state.scenario]);
  MODEL=projectAll(); drawAssumi(); renderAll();
});
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected','false'));
  t.setAttribute('aria-selected','true'); state.tab=t.dataset.tab; renderAll();
});
document.querySelectorAll('[data-bridge]').forEach(b=>b.onclick=openBridge);
document.getElementById('b_close').onclick=closeBridge;
document.getElementById('bridgebg').onclick=e=>{if(e.target.id==='bridgebg')closeBridge();};
document.getElementById('freset').onclick=()=>{
  FUNCS.forEach(f=>{state.fx[f]={ass:BASE.funzioni[f].pAss,turn:BASE.funzioni[f].turnover};});
  MODEL=projectAll(); renderAll();
};
const oresetBtn=document.getElementById('oreset');
if(oresetBtn)oresetBtn.onclick=()=>{
  FUNCS.forEach(f=>{state.necFte[f]=BASE.funzioni[f].oreNecFte;});
  MODEL=projectAll(); renderAll();
};
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!document.getElementById('bridgebg').hidden)closeBridge();
});

boot();

