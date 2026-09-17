# 06 — Pubblicazione: GitHub e Netlify

## GitHub

Repository pubblico, senza dati reali (vedi [05-data-model-e-privacy.md](05-data-model-e-privacy.md)).

```bash
git init
git add .
git commit -m "Bottega Norris — Regia del costo del lavoro: spacchettamento in app reale"
gh repo create bottega-norris-regia --public --source=. --remote=origin --push
```

Da lì in poi, un `git push` normale aggiorna il repository. Se colleghi
Netlify al repository (vedi sotto), ogni push su `main` ripubblica
automaticamente il sito.

## Netlify

L'app è **completamente statica**: nessun comando di build, nessuna
variabile d'ambiente richiesta. `netlify.toml` nella radice del progetto
dichiara:

```toml
[build]
  publish = "."
```

### Opzione A — collegare il repository GitHub (consigliata)

1. Netlify → "Add new site" → "Import an existing project" → GitHub → scegli il repository.
2. Build command: vuoto. Publish directory: `.` (radice).
3. Deploy. Da quel momento ogni push su `main` ripubblica il sito.

### Opzione B — deploy diretto da cartella (senza collegare GitHub)

Con la CLI Netlify, da questa cartella:

```bash
netlify deploy --prod --dir .
```

## Dopo la pubblicazione

Il sito pubblicato mostra **dati demo**, non dati reali (per costruzione: è
quello che c'è nei file committati). Chi usa l'app può caricare i propri
dati reali localmente, nel proprio browser, con i pulsanti "Carica dati" —
vedi [05-data-model-e-privacy.md](05-data-model-e-privacy.md#caricamento-dati-locale).
Quei dati non passano da Netlify: restano nel browser di chi li carica.

### Se in futuro servisse restringere l'accesso al sito

Un URL Netlify, anche se non linkato da nessuna parte, è raggiungibile da
chiunque lo scopra. Poiché non ci sono dati reali nel sito pubblicato, oggi
non è un problema di riservatezza — ma se un giorno si decidesse di
incorporare dati reali direttamente nel sito (sconsigliato, vedi il
documento sulla privacy), a quel punto andrebbe aggiunta una protezione ad
accesso (password del sito o Netlify Identity, disponibili sui piani a
pagamento di Netlify) prima di farlo.
