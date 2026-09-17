# 04 — Confronto anno su anno

File: `yoy.html`, `css/yoy.css`, `js/yoy.js`

## Ruolo

Tabella gerarchica di confronto fra l'anno corrente e il precedente (nel
codice: `YM='2026', YC='2025'` — anni scritti fissi, da aggiornare nel
codice sorgente quando si passa d'anno, vedi nota sotto), con esportazione
Excel nativa (nessuna libreria esterna).

Come `budget.html`, **non ha un dataset proprio**: legge `raw` dalla finestra
padre (`parent.document.getElementById('raw')`) e deve girare dentro
l'`<iframe>` di `index.html`.

## Perché gli anni sono scritti nel codice

```js
const YM='2026', YC='2025';
```

Questo comportamento viene dall'app originale invariato: la vista è pensata
per confrontare "l'anno in corso" con "l'anno precedente", non una coppia di
anni qualsiasi. Per spostarla in avanti di un anno, modifica queste due
costanti in `js/yoy.js` (unica riga da cambiare). Il periodo di confronto di
default (Da mese/A mese) si auto-imposta sui mesi comuni a entrambi gli anni
presenti nel dataset (`_cmpMonths()`), quindi non richiede altre modifiche.

## Filtri e gerarchia

Da mese / A mese, Funzione, Struttura riclassificata (multi), Reparto
effettivo (multi), Centro di costo di appartenenza, Reparto (origine),
Mansione, Tipologia, Dipendente. La tabella è a 4 livelli (Funzione →
Struttura riclassificata → Reparto effettivo → Centro di costo), righe
espandibili con memoria dello stato aperto/chiuso (`state.open`).

Per ogni riga: ore, costo, €/ora dell'anno corrente e del precedente, delta
assoluto e %, "Δ costo non-ore" (variazione di costo non spiegata dalle ore
lavorate — usa la tariffa oraria 2025 del dipendente per isolare l'effetto
tariffa dall'effetto volume), quota % sul totale, FTE e ferie con relativo
delta.

Se per il periodo scelto mancano dati dell'anno precedente, le colonne
2025/Δ mostrano "n/d" e la nota in alto lo segnala esplicitamente invece di
mostrare zeri silenziosi.

## Esportazione Excel senza dipendenze

`js/yoy.js` include un generatore `.xlsx` scritto a mano (`_zip`, `_sheet`,
`_STYLES`, `_crc32`): costruisce lo ZIP OOXML byte per byte con
`Uint8Array`, senza alcuna libreria esterna (né SheetJS né altro). Due
pulsanti:

- **Esporta Excel** (`exportXlsx`): riepilogo compatto (costo, ore, ore/costo straordinario, FTE) 2025 vs 2026.
- **Esporta tabella** (`exportTable`): l'intera tabella gerarchica visualizzata, con la stessa indentazione a video.

Questo codice è copiato invariato dall'originale: se un giorno servisse
sostituirlo con una libreria (es. per aggiungere più fogli o formattazioni
avanzate), è un modulo isolato e puoi rimpiazzarlo senza toccare il resto di
`yoy.js`.
