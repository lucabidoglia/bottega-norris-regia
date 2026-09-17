# Bottega Norris — Regia del costo del lavoro

App statica (HTML + CSS + JS, nessun framework, nessun build) per il controllo
del costo del lavoro di una cooperativa sociale: costi effettivi riclassificati,
analisi costi/ore, budget/proiezione pluriennale, confronto anno su anno e
gestione ferie residue.

Questa versione nasce dallo spacchettamento di un unico file HTML da 11,6 MB
(`Bottega_Norris_Regia.html`, ancora presente nella cartella superiore) nelle
sue parti reali: pagine, fogli di stile, script e font sono ora file separati
e versionabili singolarmente. **Nessun dato reale di dipendenti è incluso in
questo repository**: l'app pubblicata funziona con dati demo (inventati) e
carica i dati reali solo localmente, nel browser di chi la usa — vedi
[docs/05-data-model-e-privacy.md](docs/05-data-model-e-privacy.md).

> Cerchi l'app desktop (Java/JavaFX, nessun browser)? È in [desktop/](desktop/README.md) — stesse 5 viste, stesso motore di calcolo, stessi principi sui dati.

## Avvio rapido

Nessuna installazione richiesta. Da questa cartella:

```bash
python3 -m http.server 8743
```

poi apri `http://localhost:8743/index.html`. (Serve un server perché le pagine
si scambiano dati via `iframe` e `fetch`; aprire il file con doppio clic da
Finder — protocollo `file://` — non basta.)

## Struttura del progetto

```
index.html          Shell dell'app: header, tab, vista "Costi Effettivi", vista "Ferie residue"
analitica.html       Vista "Analisi costo del lavoro & ore" (pagina indipendente)
budget.html          Vista "Budget — Mastro Venturo" (richiede index.html come contenitore)
yoy.html             Vista "Confronto anno su anno" (richiede index.html come contenitore)

css/                 Un foglio di stile per pagina
js/                  Un modulo JS per pagina, più js/data-loader.js condiviso
assets/fonts/        Font incorporati nell'export originale, estratti in file .ttf reali
data/demo/           Dataset demo (inventati) incorporati nelle pagine pubblicate
tools/               Script locali: generano i dati demo o estraggono i dati reali
                      da un vecchio export monolitico (mai eseguiti in rete)
docs/                Specifiche tecniche, una per parte (vedi indice sotto)
netlify.toml         Configurazione di pubblicazione statica per Netlify
```

## Come funziona (in breve)

Le quattro pagine condividono lo **stesso dataset grezzo** (`raw` = costi
effettivi mese per mese) invece di avere ciascuna una propria copia:

- `index.html` tiene `raw` e `ferie` in due tag `<script type="application/json">`
  e li usa direttamente per le viste "Costi Effettivi" e "Ferie residue".
- `budget.html` e `yoy.html` girano **dentro un `<iframe>` di `index.html`** e
  leggono `raw` da lì (`parent.document.getElementById('raw')`): per questo
  non funzionano se aperte da sole in una scheda del browser (mostrano un
  avviso e un link per tornare a `index.html`).
- `analitica.html` ha un dataset proprio più dettagliato (`ds`) e può anche
  essere aperta in una scheda separata (link "apri in una scheda separata"
  nella vista Analitica).

Il caricamento dati locale (`js/data-loader.js`, IndexedDB nel browser) sostituisce
il contenuto di quei tag `<script>` **prima** che il resto del codice li legga:
tutta la logica applicativa di ciascuna vista è quella originale, non è stata
riscritta per la nuova architettura.

## Documentazione per parte

1. [docs/00-overview.md](docs/00-overview.md) — architettura generale e come si tiene insieme l'app
2. [docs/01-shell-costi-ferie.md](docs/01-shell-costi-ferie.md) — `index.html`, `js/shell.js`, `css/shell.css`
3. [docs/02-analitica.md](docs/02-analitica.md) — `analitica.html`, `js/analitica.js`, `css/analitica.css`
4. [docs/03-budget.md](docs/03-budget.md) — `budget.html`, `js/budget.js`, `css/budget.css`
5. [docs/04-yoy.md](docs/04-yoy.md) — `yoy.html`, `js/yoy.js`, `css/yoy.css`
6. [docs/05-data-model-e-privacy.md](docs/05-data-model-e-privacy.md) — schema dei dataset, dati demo, caricamento locale, privacy
7. [docs/06-deploy.md](docs/06-deploy.md) — pubblicazione su GitHub e Netlify

## Origine

Ricostruito a partire da `Bottega_Norris_Regia (1).html` (cartella superiore),
un export monolitico che incorporava font in base64 e tre "sotto-app" complete
come stringhe HTML dentro attributi `iframe[data-src]`. Lo spacchettamento ha
preservato il comportamento e le formule originali riga per riga; sono cambiati
solo: il modo in cui le pagine si caricano (file separati invece di stringhe
incorporate) e il modo in cui i dati entrano nell'app (caricamento locale
invece di dati incorporati nel file).
