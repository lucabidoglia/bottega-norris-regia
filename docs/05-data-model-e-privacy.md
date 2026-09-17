# 05 — Modello dati, dati demo, caricamento locale, privacy

## Perché questo documento viene prima di tutto il resto

Il file originale da cui è nata questa app conteneva dati reali di
dipendenti: nome e cognome, matricola, costo del lavoro, ore, straordinari,
ferie, **malattia**. Sono dati personali sensibili (retributivi e sanitari,
categoria particolare secondo il GDPR) di persone reali che non hanno scelto
di renderli pubblici.

**Questo repository non contiene nessuno di quei dati.** Le pagine
pubblicate (anche su Netlify) funzionano con dati demo interamente
inventati — vedi la sezione "Dati demo" sotto per la prova che non derivano
da dati reali. I dati veri, se vuoi usarli, restano **solo nel browser di chi
li carica** (IndexedDB locale) e non vengono mai inviati in rete né
committati: vedi "Caricamento dati locale".

## I quattro dataset

L'app usa quattro dataset, ciascuno con un proprio schema. Tre viste
(Costi Effettivi, Budget, Confronto anno su anno, Ferie residue) condividono
`raw`/`ferie`; la vista Analitica ha un dataset proprio più dettagliato
(`ds`).

### `raw` — costi effettivi (condiviso: Costi Effettivi, Budget, Confronto YoY)

Oggetto `{ "<anno>": { "<Mese>": [ {record}, ... ] } }`. Campi del record:

| Campo | Tipo | Significato |
|---|---|---|
| `matr` | stringa | Matricola dipendente (identificativo, non il nome) |
| `dip` | stringa | Nome e cognome |
| `io` | stringa | Funzione (es. "A.S.A.", "INFERMIERI") — deve corrispondere alle chiavi di `CAL` in `js/budget.js` per il modulo Budget |
| `cdc` | stringa | Centro di costo |
| `rep` | stringa | Reparto di origine |
| `agg` | stringa | Struttura riclassificata (reparto aggregato) |
| `lav` | stringa | Reparto lavori (dove il costo è stato effettivamente ripartito) |
| `man` | stringa | Mansione |
| `tip` | stringa | "Dipendente" oppure "Libero professionista" |
| `attivo` | booleano | Se il rapporto è attivo nel mese |
| `ore` | numero | Ore lavorate |
| `sore` | numero | Ore di straordinario |
| `costo` | numero | Costo totale del mese (€) |
| `scos` | numero | Costo dello straordinario (€) |
| `ferie` | numero | Ore di ferie/ex festività nel mese |
| `fte` | numero | Equivalente tempo pieno (0–1 per un part-time) |

### `ferie` — ferie residue (vista Ferie residue)

`{ "aggiornato": "gg/mm/aaaa", "rows": [ {record}, ... ] }`. Campi:
`matr`, `dip`, `io`, `cdc`, `agg`, `lav`, `ore` (residue), `val` (valore €,
lordo + contributi + INAIL), `fruito` (ore fruite nell'anno), `resAp`
(residuo anno precedente).

### `ds` — dettaglio analitico (solo vista Analitica)

`{ "months": [...12 mesi...], "rows": [ {record}, ... ] }`. Sovrainsieme di
`raw` con scomposizione delle assenze e delle ore:
`y`, `m`, più tutti i campi di `raw` tranne `sore`/`scos`/`attivo`, più
`eff` (ore effettive), `ord` (ore ordinarie), `stra` (ore straordinario),
`imp_stra`/`imp_magg` (importi straordinario/maggiorazioni), `magg` (ore
maggiorate), `ind` (indennità), `mal` (ore malattia), `ass_r`/`ass_nr`/`ass_nc`
(ore di assenza retribuita / non retribuita / non computabile), `nonric`
(importi non ricorrenti).

### Calibrazione Budget (non un dataset caricabile)

`js/budget.js` contiene una costante `CAL` con parametri aggregati per
funzione (FTE, indennità, ore contrattuali/necessarie, assenteismo e
turnover osservati). Non sono dati di singoli dipendenti e non si caricano
da file: si aggiornano modificando il codice quando cambiano i parametri
organizzativi. Vedi [03-budget.md](03-budget.md).

## Dati demo

`data/demo/{raw,ferie,ds}.json` sono generati da `tools/generate-demo-data.py`
con un generatore pseudocasuale a seme fisso. Tutti i nominativi sono
marcati esplicitamente come inventati (prefissi "ESEMPIO", "DEMO",
"CAMPIONE" + nome comune) e le matricole partono da 9001, un intervallo che
non può collidere con matricole reali di un gestionale HR standard (che
tipicamente usa numerazioni a partire da 1 o da un altro prefisso aziendale).
Lo script non legge alcun file esterno: puoi verificarlo aprendolo, è meno
di 100 righe.

Per rigenerare i dati demo (es. se cambi la struttura, aggiungi funzioni):

```bash
python3 tools/generate-demo-data.py
```

Poi devi reincorporare i nuovi JSON nei tag `<script>` di `index.html` /
`analitica.html` (i dati demo sono incorporati nella pagina, non caricati
via `fetch`, per far funzionare l'app anche senza server e per riflettere
fedelmente com'era strutturato l'originale).

## Caricamento dati locale

Ogni pagina che usa un dataset ha un pulsante "Carica dati …" che apre un
selettore file. Il file scelto viene:

1. letto **nel browser** con `File.text()` (nessun upload, nessuna richiesta di rete);
2. validato in modo superficiale (forma dell'oggetto JSON);
3. salvato in **IndexedDB**, un database locale del browser, sotto una chiave (`raw`, `ferie` o `ds`);
4. applicato ricaricando la pagina: `js/data-loader.js` sostituisce il contenuto del tag `<script>` corrispondente con quello salvato, **prima** che `js/shell.js` / `js/analitica.js` lo leggano.

I dati restano in quel browser, su quel computer, finché non premi
"Ripristina demo" (che li cancella) o svuoti i dati del sito da quel
browser. Non vengono mai inviati a un server: l'app è interamente statica,
non esiste un backend a cui inviarli.

### Da dove arrivano i file da caricare

Se hai ancora export monolitici nel vecchio formato (come
`Bottega_Norris_Regia.html`), usa lo script locale:

```bash
python3 tools/extract-data-from-export.py "/percorso/Bottega_Norris_Regia.html"
```

Scrive `raw.json`, `ferie.json`, `ds.json` (quelli che trova) in
`data/local/` — cartella esclusa da git (`.gitignore`) apposta perché lì
potresti salvare dati reali. Carica quei file dai pulsanti "Carica dati"
dell'app. Anche questo script è locale al 100%: legge solo il file che gli
indichi e scrive solo sul disco, nessuna rete.

## Cosa NON fare

- Non sostituire i file in `data/demo/` con dati reali: quella cartella
  viene pubblicata (è quello che gira su Netlify).
- Non rimuovere `data/local/` da `.gitignore`.
- Se estrai dati reali con `extract-data-from-export.py`, non fare
  `git add` di quei file né incollarli in un commit, un'issue o una pull
  request pubblica.
