# 01 — Shell, Costi Effettivi, Ferie residue

File: `index.html`, `css/shell.css`, `js/shell.js`

## Ruolo

Pagina di ingresso dell'app. Contiene:
- header con marchio, le 5 schede di navigazione e la barra di caricamento dati;
- vista **Costi Effettivi** (`#v-costi`): tabella gerarchica Funzione › Reparto aggregato › Reparto lavori, calcolata dal dataset grezzo `raw`;
- vista **Ferie residue** (`#v-ferie`): stessa gerarchia (con Centro di costo e Dipendente in più) sul dataset `ferie`;
- i tre `<iframe>` che caricano, al primo click, `analitica.html`, `budget.html`, `yoy.html`.

## Dati

- `#raw` (`<script id="raw" type="application/json">`): oggetto `{ "2025": { "Gennaio": [ {record}, ... ] }, "2026": {...} }`. Schema del singolo record in [05-data-model-e-privacy.md](05-data-model-e-privacy.md#raw).
- `#ferie` (`<script id="ferie" type="application/json">`): `{ "aggiornato": "data", "rows": [ {record}, ... ] }`.

All'avvio, `js/shell.js` (dentro un `(async function(){...})()`) chiede prima
a `js/data-loader.js` se in IndexedDB c'è un dato caricato localmente per
`raw`/`ferie`; se sì lo usa al posto dei dati demo incorporati nella pagina.
Da quel punto in poi la logica è quella originale:

```js
const RAW = JSON.parse(document.getElementById('raw').textContent);
const YEARS = Object.keys(RAW).sort();
const LATEST = YEARS[YEARS.length-1];   // anno più recente disponibile
const PREV = ...                          // anno precedente, per i confronti
```

## Vista Costi Effettivi

- Filtri: Anno, Mese ("Tutti i mesi disponibili" oppure un mese preciso), Rapporto (Dipendente / Libero professionista / tutti).
- KPI: Costo del lavoro, Ore lavorate, Costo straordinario (+ incidenza % sul costo), FTE (con delta vs stesso periodo dell'anno precedente).
- Tabella gerarchica a 3 livelli (Funzione → Reparto aggregato → Reparto lavori), righe espandibili (`ceRender()`, stato di apertura tenuto in `CE.open`, un `Set` di chiavi tipo `"io:Funzione"`, `"ag:Funzione|Aggregato"`).
- Il delta FTE per riga è calcolato contro lo stesso insieme di mesi dell'anno precedente (`priorFteMap`/`dFteCell`), non contro l'anno intero.

## Vista Ferie residue

- KPI: ore residue totali, ferie fruite nell'anno, media ore/dipendente, valore residuo (lordo + contributi + INAIL), valore medio/dipendente, numero dipendenti.
- Tabella gerarchica a 5 livelli (Funzione → Struttura riclassificata → Reparto effettivo → Centro di costo → Dipendente), con ricerca libera per nome o matricola (`#fe-search`) che appiattisce la vista sui soli dipendenti corrispondenti.
- "Dati aggiornati al" mostra il campo `aggiornato` del dataset `ferie`.

## Instradamento fra le viste

`activate(v)` mostra/nasconde le sezioni `.view` e, alla prima attivazione di
ciascuna scheda (`built[v]`), inizializza quella vista:

```js
if(v==='analitica'){ const fr=document.getElementById('fr-analitica'); fr.src=fr.dataset.file; }
if(v==='budget'){ const fr=document.getElementById('fr-budget'); fr.src=fr.dataset.file; }
if(v==='yoy'){ const fr=document.getElementById('fr-yoy'); fr.src=fr.dataset.file; }
```

Questa è l'unica riga di logica applicativa cambiata rispetto all'originale
(che usava `fr.srcdoc = fr.getAttribute('data-src')` con l'intero documento
incorporato come stringa): ora l'iframe carica un file vero, ma il momento in
cui lo fa — al primo click, non al caricamento della pagina — è identico.

## Barra di caricamento dati

Tre pulsanti in header, gestiti da `js/data-loader.js`:
- **Carica costi effettivi** → sceglie un `raw.json` locale, lo valida (deve essere un oggetto, non un array), lo salva in IndexedDB, ricarica la pagina.
- **Carica ferie** → stesso meccanismo per `ferie.json` (deve avere un array `rows`).
- **Ripristina demo** → svuota l'IndexedDB e ricarica, tornando ai dati demo incorporati nella pagina.

Lo stato ("dati demo" / "dati locali caricati") è mostrato dal badge accanto
al contatore record.
