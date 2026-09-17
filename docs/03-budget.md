# 03 — Budget · Mastro Venturo

File: `budget.html`, `css/budget.css`, `js/budget.js`

## Ruolo

Motore di proiezione del costo del lavoro su 4 anni (l'anno successivo
all'ultimo anno base + tre), per funzione, sotto scenari e leve modificabili
dall'utente. Nessuna dipendenza esterna oltre ai dati condivisi: ogni euro
proiettato è ricostruibile passo per passo nel "Ponte" (bridge chart).

**Questa pagina non ha un dataset proprio incorporato**: legge `raw` dalla
finestra che la contiene (`parent.document.getElementById('raw')`). Per
questo deve girare dentro l'`<iframe>` di `index.html` — se aperta da sola
mostra un avviso con un link per tornare alla Regia.

## Dati: dataset condiviso + calibrazione fissa

```js
const RAW = JSON.parse(parent.document.getElementById('raw').textContent);
```

A questo si somma una tabella di **calibrazione per funzione** (`CAL`,
costante nel codice, non un dato caricabile): FTE di riferimento, indennità,
importi non ricorrenti, ore contrattuali/necessarie per FTE, tasso di
assenza e turnover osservati. Sono valori aggregati per funzione (non dati
di singoli dipendenti) che vanno aggiornati manualmente nel codice quando
cambia l'organizzazione (nuove funzioni, nuovi parametri di calibrazione).

**Importante:** ogni funzione elencata in `CAL` deve avere almeno qualche
riga nel dataset `raw` (dipendenti, in un mese qualsiasi). Una funzione
presente in `CAL` ma assente dal dataset produce proiezioni `NaN` per
un'incompatibilità aritmetica nella formula del "costo per ora" (divisione
per ore osservate pari a zero) — le 13 funzioni attualmente calibrate sono
le chiavi dell'oggetto `CAL` in cima a `js/budget.js`, e sono le stesse
usate da `tools/generate-demo-data.py` per generare dati demo coerenti.

## Scenari e leve

Tre scenari preimpostati (`SCENARI.prudente/centrale/teso`) che valorizzano 8
leve globali (`LEVE`): CCNL nazionale, integrativo, ISTAT/IPCA, scatti di
anzianità, organico, sconto neoassunto, costo copertura, una tantum turnover.
Ogni leva è modificabile singolarmente; lo scenario è solo un punto di
partenza, non un vincolo.

Per funzione sono modificabili anche assenteismo e turnover (tabella "Leve
per funzione"), e le ore necessarie per FTE (tabella "Ore e turni").

## Il modello (`projectFunc`)

Per ogni funzione e ogni anno dell'orizzonte, il costo dell'anno precedente
viene fatto avanzare sommando **sei componenti tracciabili**:

1. Organico (variazione FTE al costo medio)
2. Dinamica base (CCNL + integrativo + scatti, sulla retribuzione base)
3. Rivalutazione ISTAT (su indennità e non ricorrente)
4. Sconto turnover (chi esce perde gli scatti accumulati)
5. Copertura assenteismo (ore perse oltre la base, coperte a costo pieno)
6. Una tantum turnover (costo di selezione/inserimento per sostituzione)

Ognuna di queste righe è quella che compare nel "Ponte" (bottone accanto al
grafico traiettoria) per un anno selezionato.

## Le 5 schede

Costo del lavoro, Importo straordinari, Tasso di assenza, Costo per ora
resa, Fabbisogno ore. Le prime quattro condividono lo stesso layout (KPI +
traiettoria + per funzione + griglia anno per anno); "Fabbisogno ore" ha un
layout dedicato con barre di composizione (ordinarie rese / straordinario /
flessibilità) contro il fabbisogno pieno.

## Callout esplicativi

Passando il mouse su un qualsiasi numero con `data-co="..."` (KPI, cella
della griglia, riga della tabella funzioni) si apre un callout con la
formula effettiva usata per calcolarlo (`coBuild()` in `js/budget.js`) — non
è un tooltip statico, ricalcola la spiegazione dai valori correnti dello
stato (scenario, leve, filtri).
