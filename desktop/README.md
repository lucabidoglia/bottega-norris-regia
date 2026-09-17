# Bottega Norris — Regia del costo del lavoro (app desktop Java)

App desktop nativa (JavaFX 21, nessun browser richiesto) con le stesse 5
viste della [web app](../README.md): Costi Effettivi, Analitica, Budget ·
Mastro Venturo, Confronto anno su anno, Ferie residue. Stesso motore di
calcolo (formule tradotte 1:1 da `js/*.js`), stessa filosofia sui dati:
**nessun dato reale nel repository**, dati demo inclusi, caricamento dati
reali solo in locale (vedi "Dati" più sotto).

## Avvio rapido

Serve Java 21 o superiore. Se non ce l'hai, installa [Eclipse Temurin
21](https://adoptium.net/) (gratuito, open source).

**Opzione più semplice — doppio clic:**
apri [`run.command`](run.command) dal Finder (la prima volta macOS chiederà
conferma perché lo script non è firmato da uno sviluppatore registrato: tasto
destro → Apri → Apri). La prima esecuzione scarica Maven in automatico
(richiede internet una volta sola; da lì in poi funziona anche offline).

**Da terminale:**
```bash
cd desktop
./mvnw javafx:run
```

## Build

```bash
./mvnw package
```

Produce `target/regia-desktop.jar` (jar "fat", tutte le dipendenze incluse).
Per via di come JavaFX gestisce i moduli nativi, questo jar **non** si avvia
con `java -jar` da solo — usa sempre `./mvnw javafx:run`, oppure genera
un'app nativa con jpackage (sotto).

### App nativa macOS (.app)

```bash
./mvnw package
mkdir -p target/jpackage-input && cp target/regia-desktop.jar target/jpackage-input/
jpackage --type app-image --input target/jpackage-input --dest dist \
  --name "Bottega Norris Regia" --main-jar regia-desktop.jar \
  --main-class it.bottenorris.regia.Main --app-version 1.0.0
```

Su Apple Silicon, se l'app non si apre (killata subito dopo l'avvio), è quasi
sempre perché il bundle non è firmato correttamente — su macOS un eseguibile
arm64 dev'essere firmato anche solo ad-hoc per partire:
```bash
xattr -cr "dist/Bottega Norris Regia.app"
codesign -s - --deep --force "dist/Bottega Norris Regia.app"
```

## Struttura del codice

```
src/main/java/it/bottenorris/regia/
  Main.java              Shell dell'app: header, barra dati, TabPane con le 5 viste
  SmokeTest.java          Strumento di verifica manuale: costruisce e renderizza
                           tutte le viste senza aprire finestra, stampa OK/eccezione
                           per ciascuna. Non è un test automatico (niente JUnit):
                           lancialo con `./mvnw -o javafx:run -Djavafx.mainClass=...`
                           sostituendo temporaneamente <mainClass> nel pom, oppure
                           via `java --module-path ... SmokeTest` (vedi git history).
  model/                 CostoRecord, FerieRecord, DsRecord, DataStore — stesso
                           schema dei dataset della web app (vedi ../docs/05-*)
  data/DataLoader.java    Carica dati demo o override locali (JSON)
  util/
    CalcUtils.java        Aggregazioni e formattazione (porta di tally()/eur()/... )
    BudgetEngine.java      Motore di proiezione Budget (porta di _computeBASE/
                           projectFunc/projectAll di js/budget.js, calibrazione CAL inclusa)
    XlsxWriter.java         Scrittore .xlsx minimale senza dipendenze (porta dello
                           zip/xlsx scritto a mano in js/yoy.js)
  view/
    CostiEffettiviView.java   TreeTableView gerarchico + KPI (porta di ceRender())
    FerieView.java            TreeTableView gerarchico + ricerca (porta di feRender())
    YoyView.java              Confronto anno su anno + export Excel (porta di yoy.js)
    BudgetView.java           Scenari, leve, grafici, proiezione (porta di budget.js)
    AnaliticaView.java        KPI, grafici, tabella, segnalazioni (porta ridotta di analitica.js)
    components/KpiCard.java  Card KPI riusabile
src/main/resources/
  css/theme.css           Stessa palette scuro/ambra della web app
  demo/{raw,ferie,ds}.json Dati demo (identici a ../data/demo/, stessa generazione)
```

## Dati

Stessa filosofia della web app (vedi [../docs/05-data-model-e-privacy.md](../docs/05-data-model-e-privacy.md)):
i dati demo sono incorporati nell'app (`src/main/resources/demo/`), nessun
dato reale è nel repository. Per caricare dati reali:

1. Pulsanti "Carica costi effettivi" / "Carica ferie" / "Carica dati
   Analitica" in alto — scegli un file JSON con lo stesso schema descritto
   nella documentazione della web app (li puoi generare con
   `../tools/extract-data-from-export.py` a partire da un vecchio export).
2. Il file scelto viene copiato in `~/Library/Application Support/BottegaNorrisRegia/data/`
   (equivalente locale dell'IndexedDB della web app: resta solo su questo
   Mac, non viene mai inviato in rete) e ricaricato automaticamente ai
   prossimi avvii, finché non premi "Ripristina demo".

## Cosa è stato semplificato rispetto alla web app

Il motore di calcolo (tutte le formule) è portato 1:1. Sono state
semplificate solo alcune interazioni "di superficie":

- **Budget**: i callout esplicativi al passaggio del mouse e il dialogo
  "Ponte" dettagliato non sono stati riportati come popup interattivo (la
  logica del ponte esiste in `BudgetEngine.YearPoint.bridge`, pronta per
  essere esposta in UI in futuro).
- **Analitica**: le "maschere" con fattori editabili per spiegare uno
  scostamento non sono incluse; il pannello "Segnalazioni" mostra soglie
  fisse invece di un editor.
- **Confronto anno su anno**: l'export Excel qui produce la tabella
  gerarchica corrente (non il doppio formato riepilogo/tabella completa
  dell'originale), stesso motore .xlsx senza dipendenze.

Nessuna di queste riguarda i calcoli: sono tutte funzionalità di
esplorazione/spiegazione in più, non correttezza dei numeri.

## Perché JavaFX e non Swing

Swing è disponibile "gratis" in ogni JDK senza dipendenze aggiuntive, ma
avrebbe reso molto più laborioso riprodurre il tema scuro/ambra e i
controlli moderni (KPI card, tabelle ad albero stilizzate) della web app.
JavaFX si stilizza con CSS in modo simile al web, ed è quello che permette
al tema di `css/theme.css` di restare leggibile e vicino all'originale.
