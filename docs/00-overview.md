# 00 — Panoramica architetturale

## Da dove viene questa app

L'app originale (`Bottega_Norris_Regia (1).html`) era un singolo file HTML di
11,6 MB. Analizzandolo si è scoperto che in realtà conteneva:

- una "shell" (header, tab, vista Costi Effettivi, vista Ferie residue) — circa 12 KB di markup reale;
- **tre sotto-applicazioni complete**, ciascuna un documento HTML autonomo
  (proprio `<head>`, `<style>`, `<script>`, dataset proprio), incorporate come
  stringa nell'attributo `data-src` di un `<iframe>` e caricate in `srcdoc`
  al primo click sulla relativa scheda:
  - **Analisi costo del lavoro & ore** (~4,2 MB da sola, per via del suo dataset dettagliato);
  - **Budget — Mastro Venturo** (~256 KB, includeva 6 font in base64);
  - **Confronto anno su anno** (~40 KB, includeva un generatore di file .xlsx scritto a mano).

Questo spiega la dimensione: non era un file con "tanto codice", ma quattro
applicazioni concatenate in un unico contenitore, con tutti i font e i dati
duplicati inline.

## La nuova architettura

Ogni sotto-applicazione è diventata un **file HTML reale e autonomo**:

| File | Ruolo | Può girare da sola? |
|---|---|---|
| `index.html` | Shell + Costi Effettivi + Ferie residue | Sì (è il contenitore) |
| `analitica.html` | Analisi costo del lavoro & ore | Sì, ha il suo dataset (`ds`) |
| `budget.html` | Budget — Mastro Venturo | No, legge `raw` dalla finestra padre |
| `yoy.html` | Confronto anno su anno | No, legge `raw` dalla finestra padre |

`index.html` incorpora `budget.html` e `yoy.html` in due `<iframe>` con
caricamento pigro (`src` valorizzato solo al primo click sulla scheda,
esattamente come nell'originale faceva `srcdoc`). Poiché l'iframe punta a un
file servito dalla stessa origine, `budget.js`/`yoy.js` possono continuare a
leggere `parent.document.getElementById('raw')` **senza alcuna modifica**
rispetto al codice originale: unica differenza, i dati arrivano da un file
vero invece che da una stringa incorporata nell'HTML del padre.

## Cosa è stato tolto dal codice, e cosa no

**Tolto (solo impacchettamento, zero logica):**
- CSS spostato da `<style>` inline a `css/*.css` con `<link>`.
- JS spostato da `<script>` inline a `js/*.js` con `<script src>`.
- 6 font in base64 (~530 KB di testo) estratti in file `.ttf` reali sotto `assets/fonts/`, referenziati da `url()` invece che incorporati.
- Dataset reali dei dipendenti rimossi e sostituiti da dataset demo (vedi [05-data-model-e-privacy.md](05-data-model-e-privacy.md)).

**Aggiunto (nuovo, minimo, isolato):**
- `js/data-loader.js`: un modulo indipendente (IndexedDB nel browser) che permette di caricare dati reali localmente, senza toccare la logica applicativa.
- Un piccolo blocco `(async function(){ ... })()` in testa a `js/shell.js` e `js/analitica.js` che, prima di leggere i dati, chiede al data-loader se esiste un override locale. Tutto il resto di quei due file è **identico riga per riga** all'originale.
- `js/budget.js` e `js/yoy.js` sono **copiati senza alcuna modifica**.

Se conosci il file originale: le formule di calcolo, i nomi di funzione, le
soglie, gli scenari di budget e la logica di esportazione Excel sono
esattamente gli stessi. Solo il "contenitore" è cambiato.

## Perché non un framework (React/Vue/ecc.)

L'app originale non ne usava uno, e introdurne uno ora avrebbe richiesto
riscrivere da zero tutta la logica di rendering (rischio di bug, nessun
beneficio per un cruscotto interno a 4-5 viste). La scelta è stata mantenere
JS "vanilla" con Chart.js (unica dipendenza esterna, da CDN, come
nell'originale) e concentrare lo sforzo di modernizzazione sulla
**separazione dei file** e sulla **gestione dei dati**, che erano i problemi
reali del formato precedente.
