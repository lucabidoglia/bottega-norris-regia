
const DATA=JSON.parse(parent.document.getElementById('raw').textContent);
const YM='2026', YC='2025';
const PROG='Progressivo gen-giu';
const MESI6=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno'];
const MONTHS12=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
function _cmpMonths(){return Object.keys(DATA[YM]).filter(function(m){return DATA[YC]&&DATA[YC][m];});}
function _rangeMonths(y){var lo=MONTHS12.indexOf(state.da),hi=MONTHS12.indexOf(state.a);if(lo<0)lo=0;if(hi<0)hi=lo;if(lo>hi){var t=lo;lo=hi;hi=t;}var out=[];for(var i=lo;i<=hi;i++){var m=MONTHS12[i];if(DATA[y]&&DATA[y][m])out.push(m);}return out;}
function _isRange(){return state.da!==state.a;}
function _perLabel(){return state.da===state.a?state.da:(state.da+'\u2013'+state.a);}
const state={per:PROG,da:'',a:'',io:'',cdc:'',rep:'',agg:[],lav:[],man:'',tip:'',matr:'',open:{}};
if(!state.da){var _cm0=_cmpMonths();state.da=_cm0[0];state.a=_cm0[_cm0.length-1];state.per=_perLabel();}
const eur=n=>'€ '+Math.round(n).toLocaleString('it-IT');
const num=n=>n.toLocaleString('it-IT',{minimumFractionDigits:0,maximumFractionDigits:0});
const pct=n=>(n*100).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
function recs(y){var o=[];_rangeMonths(y).forEach(function(m){o=o.concat(DATA[y][m]);});return o;}
function matchF(r){return (!state.io||r.io===state.io)&&(!state.cdc||r.cdc===state.cdc)&&(!state.rep||r.rep===state.rep)&&(!state.man||r.man===state.man)&&(!state.tip||r.tip===state.tip)&&inSet(state.agg,r.agg)&&inSet(state.lav,r.lav)&&(!state.matr||r.matr===state.matr);}
function distinct(y,key,pre){const s=new Set();recs(y).forEach(r=>{if(pre(r))s.add(r[key]);});return [...s].filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b),'it'));}
function opts(sel,vals,cur,all){sel.innerHTML='';const o=document.createElement('option');o.value='';o.textContent=all;sel.appendChild(o);vals.forEach(v=>{const e=document.createElement('option');e.value=v;e.textContent=v;if(v===cur)e.selected=true;sel.appendChild(e);});}
function inSet(arr,v){return !arr.length||arr.indexOf(v)>=0;}
function multiOpts(sel,vals,curArr){sel.innerHTML='';vals.forEach(v=>{const e=document.createElement('option');e.value=v;e.textContent=v;if(curArr.indexOf(v)>=0)e.selected=true;sel.appendChild(e);});}
function buildFilters(){
 (function(){var cm=_cmpMonths();if(!state.da){state.da=cm[0];state.a=cm[cm.length-1];state.per=_perLabel();}var da=document.getElementById('f_per'),a=document.getElementById('f_perTo');da.innerHTML='';a.innerHTML='';cm.forEach(function(m){var o1=document.createElement('option');o1.value=m;o1.textContent=m;if(m===state.da)o1.selected=true;da.appendChild(o1);var o2=document.createElement('option');o2.value=m;o2.textContent=m;if(m===state.a)o2.selected=true;a.appendChild(o2);});})();
 opts(document.getElementById('f_io'),distinct(YM,'io',()=>true),state.io,'Tutte le funzioni');
 opts(document.getElementById('f_cdc'),distinct(YM,'cdc',r=>(!state.io||r.io===state.io)&&inSet(state.agg,r.agg)&&inSet(state.lav,r.lav)&&(!state.tip||r.tip===state.tip)),state.cdc,'Tutti i centri di costo');
 opts(document.getElementById('f_rep'),distinct(YM,'rep',r=>(!state.io||r.io===state.io)&&inSet(state.agg,r.agg)&&inSet(state.lav,r.lav)&&(!state.cdc||r.cdc===state.cdc)&&(!state.tip||r.tip===state.tip)),state.rep,'Tutti i reparti');
 multiOpts(document.getElementById('f_agg'),distinct(YM,'agg',r=>(!state.io||r.io===state.io)&&(!state.tip||r.tip===state.tip)),state.agg);
 multiOpts(document.getElementById('f_lav'),distinct(YM,'lav',r=>(!state.io||r.io===state.io)&&inSet(state.agg,r.agg)&&(!state.tip||r.tip===state.tip)),state.lav);
 opts(document.getElementById('f_man'),distinct(YM,'man',r=>(!state.io||r.io===state.io)&&inSet(state.agg,r.agg)&&inSet(state.lav,r.lav)&&(!state.cdc||r.cdc===state.cdc)&&(!state.rep||r.rep===state.rep)),state.man,'Tutte le mansioni');
 opts(document.getElementById('f_tip'),distinct(YM,'tip',()=>true),state.tip,'Tutte le tipologie');
 const dsel=document.getElementById('f_matr');const seen={};recs(YM).filter(r=>(!state.io||r.io===state.io)&&(!state.cdc||r.cdc===state.cdc)&&(!state.rep||r.rep===state.rep)&&(!state.man||r.man===state.man)&&(!state.tip||r.tip===state.tip)&&inSet(state.agg,r.agg)&&inSet(state.lav,r.lav)).forEach(r=>seen[r.matr]=r.dip);
 dsel.innerHTML='';const o0=document.createElement('option');o0.value='';o0.textContent='Tutti i dipendenti';dsel.appendChild(o0);
 Object.entries(seen).sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'it')).forEach(([m,n])=>{const e=document.createElement('option');e.value=m;e.textContent=n+' ('+m+')';if(m===state.matr)e.selected=true;dsel.appendChild(e);});
}
function aggregate(y){
 const F={};
 var isMain=(y===YM);
 recs(y).filter(matchF).forEach(r=>{
   var _nh=(isMain&&_HR25[r.matr]!=null)?(r.costo-(r.ore||0)*_HR25[r.matr]):0;
   const f=F[r.io]||(F[r.io]={ore:0,costo:0,fte:0,ferie:0,nonh:0,pers:new Set(),aggs:{}});
   f.ore+=r.ore;f.costo+=r.costo;f.fte+=(r.fte||0);f.ferie+=(r.ferie||0);f.nonh+=_nh;f.pers.add(r.matr);
   const a=f.aggs[r.agg]||(f.aggs[r.agg]={ore:0,costo:0,fte:0,ferie:0,nonh:0,pers:new Set(),lav:{}});
   a.ore+=r.ore;a.costo+=r.costo;a.fte+=(r.fte||0);a.ferie+=(r.ferie||0);a.nonh+=_nh;a.pers.add(r.matr);
   const l=a.lav[r.lav]||(a.lav[r.lav]={ore:0,costo:0,fte:0,ferie:0,nonh:0,pers:new Set(),cdcs:{}});
   l.ore+=r.ore;l.costo+=r.costo;l.fte+=(r.fte||0);l.ferie+=(r.ferie||0);l.nonh+=_nh;l.pers.add(r.matr);
   const cc=l.cdcs[r.cdc]||(l.cdcs[r.cdc]={ore:0,costo:0,fte:0,ferie:0,nonh:0,pers:new Set()});
   cc.ore+=r.ore;cc.costo+=r.costo;cc.fte+=(r.fte||0);cc.ferie+=(r.ferie||0);cc.nonh+=_nh;cc.pers.add(r.matr);
 });
 var _nm=_rangeMonths(y).length||1;
 if(_nm>1){for(const io in F){F[io].fte/=_nm;for(const ag in F[io].aggs){F[io].aggs[ag].fte/=_nm;for(const lv in F[io].aggs[ag].lav){F[io].aggs[ag].lav[lv].fte/=_nm;for(const cc in F[io].aggs[ag].lav[lv].cdcs){F[io].aggs[ag].lav[lv].cdcs[cc].fte/=_nm;}}}}}
 return F;
}
function kpi(v,l){return '<div class="kpi"><div class="v">'+v+'</div><div class="l">'+l+'</div></div>';}
function esc(s){return String(s).replace(/'/g,"\\'");}
function cell25(cur,prev,has25,dash){ // prev may be null
 if(!has25) return '<td class="grp2 muted">'+dash+'</td><td class="muted">'+dash+'</td><td class="muted">'+dash+'</td>';
 const p=prev||0; const d=cur-p;
 let dp; if(p!==0){dp=(d/p*100).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';} else {dp=(cur!==0?'n.c.':'0,0%');}
 return '<td class="grp2 muted">'+eur(p)+'</td><td class="muted">'+eur(d)+'</td><td class="muted">'+dp+'</td>';
}
let _chartTrend=null;
function _costoMese(y,m){var c=0;(DATA[y]&&DATA[y][m]?DATA[y][m]:[]).filter(matchF).forEach(function(r){c+=r.costo;});return c;}
function renderChart(F,F25,has25){
 var cont=document.getElementById('chart');
 cont.innerHTML='<div class="chttl">Andamento mensile del costo del lavoro — 2026'+(has25?' vs 2025':'')+'</div><div style="position:relative;height:170px"><canvas id="_trendCanvas"></canvas></div>';
 var ms=_rangeMonths(YM);
 var labels=ms.map(function(m){return m.slice(0,3);});
 var cur=ms.map(function(m){return _costoMese(YM,m);});
 var prev=has25?ms.map(function(m){return (DATA[YC]&&DATA[YC][m])?_costoMese(YC,m):null;}):[];
 if(_chartTrend){_chartTrend.destroy();_chartTrend=null;}
 if(typeof Chart==='undefined')return;
 var dsets=[{label:'2026',data:cur,borderColor:'#1f4e5f',backgroundColor:'rgba(31,78,95,.12)',fill:true,tension:.3,borderWidth:2,pointRadius:3}];
 if(has25)dsets.push({label:'2025',data:prev,borderColor:'#c9a678',borderDash:[5,4],fill:false,tension:.3,borderWidth:2,pointRadius:2});
 _chartTrend=new Chart(document.getElementById('_trendCanvas'),{type:'line',
  data:{labels:labels,datasets:dsets},
  options:{responsive:true,maintainAspectRatio:false,
   plugins:{legend:{labels:{color:'#334',boxWidth:14}},
    tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': € '+Math.round(ctx.parsed.y).toLocaleString('it-IT');}}}},
   scales:{x:{ticks:{color:'#556'},grid:{display:false}},
    y:{ticks:{color:'#556',callback:function(v){return '€ '+(v/1000).toLocaleString('it-IT',{maximumFractionDigits:0})+'k';}},grid:{color:'rgba(0,0,0,.06)'}}}}});
}
function eperh(c,o){return o>0?('€ '+(c/o).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})):'—';}
function fte1(v){return (v||0).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1});}
function _fte(y){var s=0;recs(y).filter(matchF).forEach(function(r){s+=(r.fte||0);});return s/(_rangeMonths(y).length||1);}
function _ferie(y){var s=0;recs(y).filter(matchF).forEach(function(r){s+=(r.ferie||0);});return s;}
var _HR25={};
function _nonhTot(){var s=0;recs(YM).filter(matchF).forEach(function(r){if(_HR25[r.matr]!=null)s+=(r.costo-(r.ore||0)*_HR25[r.matr]);});return s;}
function rowM(n26,n25,has25,tot,dash){
 const c26=n26?n26.costo:0,o26=n26?n26.ore:0,p26=(n26&&n26.pers)?n26.pers.size:0;
 const p25=(n25&&n25.pers)?n25.pers.size:0;
 let s='<td>'+num(o26)+'</td><td>'+eur(c26)+'</td><td class="muted">'+eperh(c26,o26)+'</td>';
 if(has25){const c25=n25?n25.costo:0,o25=n25?n25.ore:0;
  const dp=c25!==0?((c26-c25)/c25*100).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':(c26!==0?'n.c.':'0,0%');
  s+='<td class="grp2 muted">'+num(o25)+'</td><td class="muted">'+eur(c25)+'</td><td class="muted">'+eperh(c25,o25)+'</td>';
  s+='<td class="grp2 muted">'+num(o26-o25)+'</td><td class="muted">'+eur(c26-c25)+'</td><td class="muted">'+dp+'</td><td class="muted">'+eur(n26?(n26.nonh||0):0)+'</td>';
 }else{s+='<td class="grp2 muted">'+dash+'</td><td class="muted">'+dash+'</td><td class="muted">'+dash+'</td><td class="grp2 muted">'+dash+'</td><td class="muted">'+dash+'</td><td class="muted">'+dash+'</td><td class="muted">'+dash+'</td>';}
 s+='<td class="grp2">'+pct(tot?c26/tot:0)+'</td>';
 var ft26=n26?(n26.fte||0):0, ft25=n25?(n25.fte||0):0;
 s+='<td class="grp2">'+fte1(ft26)+'</td>';
 if(has25){var dft=ft26-ft25;s+='<td class="muted">'+fte1(ft25)+'</td><td class="muted">'+(dft>=0?'+':'−')+fte1(Math.abs(dft))+'</td>';}else{s+='<td class="muted">'+dash+'</td><td class="muted">'+dash+'</td>';}
 var fe26=n26?(n26.ferie||0):0, fe25=n25?(n25.ferie||0):0;
 s+='<td class="grp2">'+num(fe26)+'</td>';
 if(has25){var dfe=fe26-fe25;s+='<td class="muted">'+num(fe25)+'</td><td class="muted">'+(dfe>=0?'+':'−')+num(Math.abs(dfe))+'</td>';}else{s+='<td class="muted">'+dash+'</td><td class="muted">'+dash+'</td>';}
 return s;
}
function render(){
 buildFilters();
 _HR25={};{var _e25C={},_e25O={};recs(YC).filter(matchF).forEach(function(r){_e25C[r.matr]=(_e25C[r.matr]||0)+r.costo;_e25O[r.matr]=(_e25O[r.matr]||0)+(r.ore||0);});for(var _mk in _e25O){if(_e25O[_mk]>0)_HR25[_mk]=_e25C[_mk]/_e25O[_mk];}}
 const F=aggregate(YM), F25=aggregate(YC);
 const has25=recs(YC).filter(matchF).length>0;
 const tot=Object.values(F).reduce((s,f)=>s+f.costo,0);
 const totOre=Object.values(F).reduce((s,f)=>s+f.ore,0);
 const tot25=Object.values(F25).reduce((s,f)=>s+f.costo,0);
 const totOre25=Object.values(F25).reduce((s,f)=>s+f.ore,0);
 const persAll=new Set();recs(YM).filter(matchF).forEach(r=>persAll.add(r.matr));
 const persAll25=new Set();recs(YC).filter(matchF).forEach(r=>persAll25.add(r.matr));
 let naC=0;Object.values(F).forEach(f=>{if(f.aggs['Personale non attivo'])naC+=f.aggs['Personale non attivo'].costo;});
 document.getElementById('kpis').innerHTML=kpi(eur(tot),'Costo effettivo 2026')+kpi(num(totOre),'Ore effettive')+kpi(fte1(_fte(YM)),'FTE')+kpi(eur(naC),'di cui personale non attivo')+(has25?kpi((totOre-totOre25>=0?'+':'')+num(totOre-totOre25),'Δ ore vs 2025')+kpi(((_fte(YM)-_fte(YC))>=0?'+':'−')+fte1(Math.abs(_fte(YM)-_fte(YC))),'Δ FTE vs 2025'):'');
 renderChart(F,F25,has25);
 const funcs=[...new Set([...Object.keys(F),...Object.keys(F25)])].sort((a,b)=>((F[b]?F[b].costo:0)-(F[a]?F[a].costo:0)));
 let h='';
 funcs.forEach(io=>{
   const f=F[io]||{ore:0,costo:0,pers:new Set(),aggs:{}};
   const f25=F25[io]||{ore:0,costo:0,aggs:{}};
   const op1=state.open[io];
   h+='<tr class="l1" onclick="tg(\''+esc(io)+'\')"><td><span class="caret">'+(op1?'▾':'▸')+'</span>'+io+'</td>'+rowM(F[io],F25[io],has25,tot,'n/d')+'</tr>';
   if(op1){
     const aggU=[...new Set([...Object.keys(f.aggs),...Object.keys(f25.aggs||{})])].sort((a,b)=>((f.aggs[b]?f.aggs[b].costo:0)-(f.aggs[a]?f.aggs[a].costo:0)));
     aggU.forEach(ag=>{
       const a=f.aggs[ag]||{ore:0,costo:0,pers:new Set(),lav:{}};
       const a25=(f25.aggs||{})[ag]||{ore:0,costo:0,lav:{}};
       const k2=io+'||'+ag; const op2=state.open[k2]; const isNA=ag==='Personale non attivo';
       h+='<tr class="l2'+(isNA?' na':'')+'" onclick="tg(\''+esc(k2)+'\')"><td class="ind2"><span class="caret">'+(op2?'▾':'▸')+'</span>'+ag+'</td>'+rowM(f.aggs[ag],(f25.aggs||{})[ag],has25,tot,'n/d')+'</tr>';
       if(op2){
         const lavU=[...new Set([...Object.keys(a.lav),...Object.keys(a25.lav||{})])].sort((x,y)=>((a.lav[y]?a.lav[y].costo:0)-(a.lav[x]?a.lav[x].costo:0)));
         lavU.forEach(lv=>{
           const l=a.lav[lv]||{ore:0,costo:0,pers:new Set(),cdcs:{}};
           const l25=(a25.lav||{})[lv]||{ore:0,costo:0,cdcs:{}};
           const k3=io+'||'+ag+'||'+lv; const op3=state.open[k3];
           h+='<tr class="l3" onclick="tg(\''+esc(k3)+'\')"><td class="ind3"><span class="caret">'+(op3?'▾':'▸')+'</span>'+lv+'</td>'+rowM(a.lav[lv],(a25.lav||{})[lv],has25,tot,'—')+'</tr>';
           if(op3){
             const ccU=[...new Set([...Object.keys(l.cdcs||{}),...Object.keys(l25.cdcs||{})])].sort((x,y)=>((l.cdcs[y]?l.cdcs[y].costo:0)-(l.cdcs[x]?l.cdcs[x].costo:0)));
             ccU.forEach(cc=>{
               h+='<tr class="l4"><td class="ind4">'+cc+'</td>'+rowM((l.cdcs||{})[cc],(l25.cdcs||{})[cc],has25,tot,'—')+'</tr>';
             });
           }
         });
       }
     });
   }
 });
 let ts='<tr class="tot"><td>TOTALE</td><td>'+num(totOre)+'</td><td>'+eur(tot)+'</td><td>'+eperh(tot,totOre)+'</td>';
 if(has25){ts+='<td class="grp2">'+num(totOre25)+'</td><td>'+eur(tot25)+'</td><td>'+eperh(tot25,totOre25)+'</td><td class="grp2">'+num(totOre-totOre25)+'</td><td>'+eur(tot-tot25)+'</td><td>'+(tot25!==0?((tot-tot25)/tot25*100).toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':'n.c.')+'</td><td>'+eur(_nonhTot())+'</td>';}
 else{ts+='<td class="grp2">n/d</td><td>n/d</td><td>n/d</td><td class="grp2">n/d</td><td>n/d</td><td>n/d</td><td>n/d</td>';}
 ts+='<td class="grp2">100%</td>';
 var _tf26=_fte(YM),_tf25=_fte(YC);
 ts+='<td class="grp2">'+fte1(_tf26)+'</td>';
 if(has25){ts+='<td>'+fte1(_tf25)+'</td><td>'+((_tf26-_tf25)>=0?'+':'−')+fte1(Math.abs(_tf26-_tf25))+'</td>';}else{ts+='<td>n/d</td><td>n/d</td>';}
 var _tfe26=_ferie(YM),_tfe25=_ferie(YC);
 ts+='<td class="grp2">'+num(_tfe26)+'</td>';
 if(has25){ts+='<td>'+num(_tfe25)+'</td><td>'+((_tfe26-_tfe25)>=0?'+':'−')+num(Math.abs(_tfe26-_tfe25))+'</td>';}else{ts+='<td>n/d</td><td>n/d</td>';}
 ts+='</tr>';
 h+=ts;
 document.getElementById('tb').innerHTML=h;
 document.getElementById('note').innerHTML= has25?('✅ Confronto 2025–2026 attivo per '+state.per+'.'):('⚠️ Per '+state.per+' mancano i dati riclassificati 2025: le colonne 2025/Δ mostrano "n/d". Carica il file di riclassificazione 2025 del mese per attivare il confronto.');
}
function tg(k){state.open[k]=!state.open[k];render();}
['f_per','f_perTo','f_io','f_cdc','f_rep','f_agg','f_lav','f_man','f_tip','f_matr'].forEach(id=>{
 document.getElementById(id).addEventListener('change',e=>{const v=e.target.value;
  if(id==='f_per'){state.da=v;if(!state.a)state.a=v;state.per=_perLabel();}
  if(id==='f_perTo'){state.a=v;if(!state.da)state.da=v;state.per=_perLabel();}
  if(id==='f_io'){state.io=v;state.agg=[];state.lav=[];state.cdc='';state.rep='';state.man='';state.matr='';}
  if(id==='f_cdc'){state.cdc=v;state.rep='';state.man='';state.matr='';}
  if(id==='f_rep'){state.rep=v;state.man='';state.matr='';}
  if(id==='f_agg'){state.agg=[...e.target.selectedOptions].map(o=>o.value).filter(Boolean);state.lav=[];state.cdc='';state.rep='';state.man='';state.matr='';}
  if(id==='f_lav'){state.lav=[...e.target.selectedOptions].map(o=>o.value).filter(Boolean);state.cdc='';state.rep='';state.man='';state.matr='';}
  if(id==='f_man'){state.man=v;state.matr='';}
  if(id==='f_tip'){state.tip=v;state.matr='';}
  if(id==='f_matr')state.matr=v;
  render();});
});

/* ===== Export Excel (xlsx nativo, senza dipendenze) ===== */
function _crc32(b){var c,crc=0xFFFFFFFF;for(var i=0;i<b.length;i++){c=(crc^b[i])&0xFF;for(var k=0;k<8;k++){c=c&1?(0xEDB88320^(c>>>1)):(c>>>1);}crc=(crc>>>8)^c;}return (crc^0xFFFFFFFF)>>>0;}
function _u8(s){return new TextEncoder().encode(s);}
function _zip(files){
 var chunks=[],central=[],offset=0;
 function u16(n){return [n&0xFF,(n>>>8)&0xFF];}
 function u32(n){return [n&0xFF,(n>>>8)&0xFF,(n>>>16)&0xFF,(n>>>24)&0xFF];}
 files.forEach(function(f){
  var nameB=_u8(f.name),data=f.data,crc=_crc32(data),lo=offset;
  var local=[].concat(u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameB.length),u16(0));
  chunks.push(new Uint8Array(local),nameB,data); offset+=local.length+nameB.length+data.length;
  var cen=[].concat(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameB.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(lo));
  central.push(new Uint8Array(cen),nameB);
 });
 var cenSize=0;central.forEach(function(c){cenSize+=c.length;});
 var end=[].concat(u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cenSize),u32(offset),u16(0));
 var all=chunks.concat(central,[new Uint8Array(end)]),total=0;all.forEach(function(a){total+=a.length;});
 var out=new Uint8Array(total),p=0;all.forEach(function(a){out.set(a,p);p+=a.length;});return out;
}
function _xesc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function _col(i){return String.fromCharCode(65+i);}
function _sheet(rows,colsXml){
 var x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
 x+=(colsXml||'<cols><col min="1" max="1" width="30" customWidth="1"/><col min="2" max="5" width="17" customWidth="1"/></cols>')+'<sheetData>';
 rows.forEach(function(row,ri){x+='<row r="'+(ri+1)+'">';row.forEach(function(cell,ci){if(cell==null)return;var ref=_col(ci)+(ri+1),s=cell.s?(' s="'+cell.s+'"'):'';
  if(cell.t==='s'){x+='<c r="'+ref+'"'+s+' t="inlineStr"><is><t xml:space="preserve">'+_xesc(cell.v)+'</t></is></c>';}
  else{x+='<c r="'+ref+'"'+s+'><v>'+cell.v+'</v></c>';}});x+='</row>';});
 return x+'</sheetData></worksheet>';
}
var _STYLES='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="4"><numFmt numFmtId="164" formatCode="#,##0.00&quot; €&quot;"/><numFmt numFmtId="165" formatCode="#,##0"/><numFmt numFmtId="166" formatCode="0.0%"/><numFmt numFmtId="167" formatCode="#,##0.0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9E4EA"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDF2F4"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFBBD0DA"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FF9DB2BD"/></left><right style="thin"><color rgb="FF9DB2BD"/></right><top style="thin"><color rgb="FF9DB2BD"/></top><bottom style="thin"><color rgb="FF9DB2BD"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="21"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="165" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="166" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="167" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/><xf numFmtId="165" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/><xf numFmtId="166" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/><xf numFmtId="167" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="1" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="165" fontId="1" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="166" fontId="1" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="167" fontId="1" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
function _teste(y){var ms=_rangeMonths(y);if(_isRange()){var sum=0,k=0;ms.forEach(function(m){var s=new Set();DATA[y][m].filter(matchF).forEach(function(r){s.add(r.matr);});sum+=s.size;k++;});return k?sum/k:0;}var mm=ms[0];var s=new Set();((mm&&DATA[y]&&DATA[y][mm])?DATA[y][mm]:[]).filter(matchF).forEach(function(r){s.add(r.matr);});return s.size;}
function _sumco(y){var c=0,o=0,so=0,sc=0;recs(y).filter(matchF).forEach(function(r){c+=r.costo;o+=(r.ore||0);so+=(r.sore||0);sc+=(r.scos||0);});return {c:c,o:o,so:so,sc:sc};}
function _filtriTxt(){var f=[];if(state.io)f.push('Funzione='+state.io);if(state.cdc)f.push('Struttura='+state.cdc);if(state.rep)f.push('Reparto orig.='+state.rep);if(state.agg.length)f.push('Reparto aggr.='+state.agg.join(', '));if(state.lav.length)f.push('Reparto lavori='+state.lav.join(', '));if(state.man)f.push('Mansione='+state.man);if(state.tip)f.push('Tipologia='+state.tip);if(state.matr)f.push('Dipendente='+state.matr);return f.length?f.join(' · '):'nessuno (tutti)';}
function _exportBytes(){
 var s26=_sumco(YM),s25=_sumco(YC),t26=_fte(YM),t25=_fte(YC);
 var prog=_isRange();
 var r2=function(n){return Math.round(n*100)/100;}, r1=function(n){return Math.round(n*10)/10;};
 function drow(lbl,v25,v26,sty,dsty){
  var da=Math.round((v26-v25)*100)/100; var dp=(v25!==0)?((v26-v25)/v25):null;
  return [{v:lbl,t:'s'},{v:v25,s:sty},{v:v26,s:sty},{v:da,s:dsty||sty}, (dp===null?{v:'n.c.',t:'s'}:{v:Math.round(dp*1e6)/1e6,s:4})];
 }
 var testeLbl='FTE';
 var testeSty=prog?5:3;
 var rows=[
  [{v:'Bottega Norris — Costi Effettivi · Export',t:'s',s:1}],
  [{v:'Periodo: '+state.per,t:'s'}],
  [{v:'Filtri attivi: '+_filtriTxt(),t:'s'}],
  [{v:'Generato il '+new Date().toLocaleString('it-IT'),t:'s'}],
  [],
  [{v:'Metrica',t:'s',s:1},{v:'2025',t:'s',s:1},{v:'2026',t:'s',s:1},{v:'Δ assoluto',t:'s',s:1},{v:'Δ %',t:'s',s:1}],
  drow('Costo totale', r2(s25.c), r2(s26.c), 2),
  drow('Ore totali', r1(s25.o), r1(s26.o), 3),
  drow('Ore straordinario', r1(s25.so), r1(s26.so), 3),
  drow('Costo straordinario', r2(s25.sc), r2(s26.sc), 2),
  drow(testeLbl, prog?r2(t25):t25, prog?r2(t26):t26, testeSty)
 ];
 var sheet=_sheet(rows);
 var files=[
  {name:'[Content_Types].xml',data:_u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')},
  {name:'_rels/.rels',data:_u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')},
  {name:'xl/workbook.xml',data:_u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Export" sheetId="1" r:id="rId1"/></sheets></workbook>')},
  {name:'xl/_rels/workbook.xml.rels',data:_u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')},
  {name:'xl/styles.xml',data:_u8(_STYLES)},
  {name:'xl/worksheets/sheet1.xml',data:_u8(sheet)}
 ];
 return _zip(files);
}

function _pkg(sheet){return [
 {name:'[Content_Types].xml',data:_u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')},
 {name:'_rels/.rels',data:_u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')},
 {name:'xl/workbook.xml',data:_u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Tabella" sheetId="1" r:id="rId1"/></sheets></workbook>')},
 {name:'xl/_rels/workbook.xml.rels',data:_u8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')},
 {name:'xl/styles.xml',data:_u8(_STYLES)},
 {name:'xl/worksheets/sheet1.xml',data:_u8(sheet)}
];}
function _mcells(n26,n25,has25,tot,sm){
 var r2=function(n){return Math.round(n*100)/100;},r1=function(n){return Math.round(n*10)/10;};
 var c26=n26?n26.costo:0,o26=n26?n26.ore:0,p26=(n26&&n26.pers)?n26.pers.size:0;
 var c25=n25?n25.costo:0,o25=n25?n25.ore:0,p25=(n25&&n25.pers)?n25.pers.size:0;
 var cells=[{v:r1(o26),s:sm.i},{v:r2(c26),s:sm.c},(o26>0?{v:r2(c26/o26),s:sm.c}:{v:'—',t:'s',s:sm.l})];
 if(has25){
  cells.push({v:r1(o25),s:sm.i},{v:r2(c25),s:sm.c},(o25>0?{v:r2(c25/o25),s:sm.c}:{v:'—',t:'s',s:sm.l}));
  cells.push({v:r1(o26-o25),s:sm.i},{v:r2(c26-c25),s:sm.c},(c25!==0?{v:Math.round((c26-c25)/c25*1e6)/1e6,s:sm.p}:{v:'n.c.',t:'s',s:sm.l}));
  cells.push({v:r2(n26?(n26.nonh||0):0),s:sm.c});
 }else{for(var i=0;i<7;i++)cells.push({v:'n/d',t:'s',s:sm.l});}
 cells.push({v:tot?Math.round(c26/tot*1e6)/1e6:0,s:sm.p});
 var ft26=n26?(n26.fte||0):0, ft25=n25?(n25.fte||0):0;
 cells.push({v:Math.round(ft26*10)/10,s:sm.i});
 if(has25){cells.push({v:Math.round(ft25*10)/10,s:sm.i},{v:Math.round((ft26-ft25)*10)/10,s:sm.i});}else{cells.push({v:'n/d',t:'s',s:sm.l},{v:'n/d',t:'s',s:sm.l});}
 var fe26=n26?(n26.ferie||0):0, fe25=n25?(n25.ferie||0):0;
 cells.push({v:Math.round(fe26),s:sm.i});
 if(has25){cells.push({v:Math.round(fe25),s:sm.i},{v:Math.round(fe26-fe25),s:sm.i});}else{cells.push({v:'n/d',t:'s',s:sm.l},{v:'n/d',t:'s',s:sm.l});}
 return cells;
}
function _exportTableBytes(){
 var F=aggregate(YM),F25=aggregate(YC);
 var has25=recs(YC).filter(matchF).length>0;
 var tot=Object.values(F).reduce(function(s,f){return s+f.costo;},0);
 var SM1={c:7,i:8,p:9,l:6},SM2={c:12,i:13,p:14,l:11},SM3={c:2,i:3,p:4,l:0},SMT={c:17,i:18,p:19,l:16};
 var rows=[];
 rows.push([{v:'Bottega Norris — Costi Effettivi · Tabella gerarchica',t:'s',s:1}]);
 rows.push([{v:'Periodo: '+state.per+'  ·  Filtri: '+_filtriTxt(),t:'s'}]);
 rows.push([{v:'Generato il '+new Date().toLocaleString('it-IT'),t:'s'}]);
 rows.push([]);
 var hdr=['Funzione › Reparto aggregato › Reparto lavori','Ore 2026','Costo 2026','€/ora 2026','Ore 2025','Costo 2025','€/ora 2025','Δ ore','Δ costo','Δ %','Δ costo non-ore','Quota %','FTE 2026','FTE 2025','Δ FTE','Ferie 2026','Ferie 2025','Δ Ferie'];
 rows.push(hdr.map(function(x){return {v:x,t:'s',s:1};}));
 var funcs=Object.keys(F).concat(Object.keys(F25).filter(function(k){return !(k in F);}));
 funcs.sort(function(a,b){return ((F[b]?F[b].costo:0)-(F[a]?F[a].costo:0));});
 funcs.forEach(function(io){
  var f=F[io]||{ore:0,costo:0,pers:new Set(),aggs:{}};
  var f25=F25[io]||{ore:0,costo:0,pers:new Set(),aggs:{}};
  rows.push([{v:io,t:'s',s:6}].concat(_mcells(F[io],F25[io],has25,tot,SM1)));
  var aggs=Object.keys(f.aggs).concat(Object.keys(f25.aggs||{}).filter(function(k){return !(k in f.aggs);}));
  aggs.sort(function(a,b){return ((f.aggs[b]?f.aggs[b].costo:0)-(f.aggs[a]?f.aggs[a].costo:0));});
  aggs.forEach(function(ag){
   var a=f.aggs[ag]||{ore:0,costo:0,pers:new Set(),lav:{}};
   var a25=(f25.aggs||{})[ag]||{ore:0,costo:0,pers:new Set(),lav:{}};
   rows.push([{v:'   › '+ag,t:'s',s:11}].concat(_mcells(f.aggs[ag],(f25.aggs||{})[ag],has25,tot,SM2)));
   var lavs=Object.keys(a.lav).concat(Object.keys(a25.lav||{}).filter(function(k){return !(k in a.lav);}));
   lavs.sort(function(x,y){return ((a.lav[y]?a.lav[y].costo:0)-(a.lav[x]?a.lav[x].costo:0));});
   lavs.forEach(function(lv){
    rows.push([{v:'        › '+lv,t:'s',s:0}].concat(_mcells(a.lav[lv],(a25.lav||{})[lv],has25,tot,SM3)));
   });
  });
 });
 var totOre=Object.values(F).reduce(function(s,f){return s+f.ore;},0);
 var tot25=Object.values(F25).reduce(function(s,f){return s+f.costo;},0);
 var totOre25=Object.values(F25).reduce(function(s,f){return s+f.ore;},0);
 var persAll=new Set();recs(YM).filter(matchF).forEach(function(r){persAll.add(r.matr);});
 var persAll25=new Set();recs(YC).filter(matchF).forEach(function(r){persAll25.add(r.matr);});
 rows.push([{v:'TOTALE',t:'s',s:16}].concat(_mcells({ore:totOre,costo:tot,fte:_fte(YM),pers:persAll},has25?{ore:totOre25,costo:tot25,fte:_fte(YC),pers:persAll25}:null,has25,tot,SMT)));
 var cols='<cols><col min="1" max="1" width="42" customWidth="1"/><col min="2" max="14" width="13" customWidth="1"/></cols>';
 return _zip(_pkg(_sheet(rows,cols)));
}
function exportTable(){
 try{
  var blob=new Blob([_exportTableBytes()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  var fn='Tabella_CostiEffettivi_'+String(state.per).replace(/[^\w-]+/g,'_')+(state.io?('_'+state.io.replace(/[^\w-]+/g,'_')):'')+(state.agg.length?('_'+state.agg.join('-').replace(/[^\w-]+/g,'_')):'')+'.xlsx';
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},0);
 }catch(e){alert('Errore export tabella: '+e.message);}
}

function exportXlsx(){
 try{
  var bytes=_exportBytes();
  var blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  var fn='Export_CostiEffettivi_'+String(state.per).replace(/[^\w-]+/g,'_')+(state.io?('_'+state.io.replace(/[^\w-]+/g,'_')):'')+'.xlsx';
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},0);
 }catch(e){alert('Errore export: '+e.message);}
}

document.getElementById('reset').onclick=()=>{state.io=state.cdc=state.rep=state.man=state.tip=state.matr='';state.agg=[];state.lav=[];render();};
document.getElementById('export').onclick=exportXlsx;
document.getElementById('exportTab').onclick=exportTable;
render();
