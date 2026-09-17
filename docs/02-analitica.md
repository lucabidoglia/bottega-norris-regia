# 02 — Analisi costo del lavoro & ore

File: `analitica.html`, `css/analitica.css`, `js/analitica.js`

## Ruolo

Cruscotto di analisi con drill-down da funzione a singolo dipendente, 4
schede di lettura (Costo & Costo/FTE, Straordinari & Maggiorazioni,
Assenteismo, Produttività ore), grafici di andamento e composizione, tabella
di dettaglio ordinabile, e un pannello "azioni consigliate" generato dai dati.

A differenza di `budget.html` e `yoy.html`, questa pagina **ha un dataset
proprio** (`ds`, più dettagliato di `raw`: include assenze scomposte per
tipo — retribuite/non retribuite/non computabili — e malattia) e **può
essere aperta anche da sola** in una scheda separata (link nella vista
Analitica di `index.html`), non solo dentro l'iframe della shell.

## Dati

`#ds` (`<script id="ds" type="application/json">`): `{ "months": [...12 mesi...], "rows": [ {record}, ... ] }`. Schema in [05-data-model-e-privacy.md](05-data-model-e-privacy.md#ds).

Caricamento locale indipendente da quello di `index.html`: il pulsante
"Carica dati Analitica" in questa pagina sovrascrive solo `ds` (chiave
IndexedDB separata da `raw`/`ferie`).

## Filtri

Da mese / A mese (intervallo, non un mese singolo), Rapporto, Funzione/Area,
Struttura riclassificata (multi-selezione), Reparto effettivo, Mansione,
Dipendente. Il riquadro "Ambito" sopra le schede riepiloga i filtri attivi.

## Le 4 schede

Ogni scheda cambia la metrica dei KPI e dei due grafici principali, ma
riusa la stessa struttura (`MET` in `analitica.js` definisce etichetta,
funzione di estrazione e formattatore per ciascuna metrica):

| Scheda | Metrica | Tabella di dettaglio |
|---|---|---|
| Costo & Costo/FTE | costo totale | costo, FTE, costo/FTE per riga |
| Straordinari & Maggiorazioni | ore/importo straordinario | incidenza % straordinario |
| Assenteismo | ore di assenza (retribuita/non retribuita/malattia) | composizione assenze |
| Produttività ore | ore effettive / ore ordinarie | resa oraria |

- **Grafico 1** (`drawChart1`): andamento nel periodo selezionato vs periodo di confronto.
- **Grafico 2** (`drawChart2`): composizione o ripartizione per il livello di gruppo corrente (dipende dal drill-down attivo).
- Pulsante "ℹ Spiega variazioni" apre una finestra modale (`renderMask`) con i fattori che possono spiegare uno scostamento (rinnovo CCNL, scatti di anzianità, nuove assunzioni, ecc. — lista `FACTORS`), editabile e con un campo note libero per lasciare un commento in sede di analisi.

## Pannello azioni

`ACT = {cost:actionCost, over:actionOver, abs:actionAbs, prod:actionProd}`:
per la scheda attiva, genera una lista di segnalazioni con priorità
(alta/media/bassa/presidio) a partire da soglie sui dati filtrati — ad
esempio incidenza straordinario sopra una certa percentuale, o un reparto con
assenteismo molto superiore alla media. Le soglie sono nel codice di ciascuna
funzione `actionX` in `js/analitica.js`.

## Caricamento standalone

Se aperta direttamente (non dentro l'iframe di `index.html`), la pagina
funziona comunque: usa il proprio dataset `ds` (demo o caricato localmente),
non dipende dalla finestra padre.
