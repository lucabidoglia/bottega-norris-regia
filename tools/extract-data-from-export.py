#!/usr/bin/env python3
"""
Estrae i dataset (raw.json, ferie.json, ds.json) da un vecchio export
monolitico "Bottega_Norris_Regia*.html" (il formato a file unico con tutto
incorporato: stile, script e dati), cosi' da poterli caricare nella nuova
app spacchettata con i pulsanti "Carica dati" di index.html / analitica.html.

Tutto avviene IN LOCALE: questo script legge solo il file che gli indichi
sul tuo computer e scrive dei .json accanto ad esso (o nella cartella che
indichi con --out). Non effettua alcuna richiesta di rete e non carica
nulla online: puoi verificarlo leggendo il codice qui sotto, e' meno di
100 righe.

Uso:
    python3 tools/extract-data-from-export.py "/percorso/Bottega_Norris_Regia.html" [--out data/local]

Poi, nell'app:
    - vai su index.html -> "Carica costi effettivi" -> scegli raw.json
    - vai su index.html -> "Carica ferie" -> scegli ferie.json
    - vai su analitica.html -> "Carica dati Analitica" -> scegli ds.json
(la vista Analitica e' l'unica ad avere un dataset proprio, "ds"; Budget e
Confronto anno su anno derivano tutto dal dataset "raw" condiviso, non
serve caricare nulla per loro).

Se il tuo export monolitico non contiene le tre iframe con "Analisi",
"Budget" e "Confronto anno su anno" (perche' e' un formato piu' vecchio),
lo script estrae comunque raw.json e ferie.json, che bastano per le viste
Costi Effettivi, Budget e Ferie residue.
"""
import argparse
import html
import json
import os
import re
import sys


def find_script_json(text, script_id):
    """Trova <script id="X" type="application/json">...</script> nel testo
    (gestisce anche il caso in cui sia annidato/escaped come attributo
    HTML, cercando prima la forma diretta e poi quella con &quot;)."""
    pattern = re.compile(
        r'<script id=["\']%s["\'][^>]*>(.*?)</script>' % re.escape(script_id),
        re.S,
    )
    matches = list(pattern.finditer(text))
    if not matches:
        return None
    # se ce n'e' più di una (export con snapshot storici annidati), prendi
    # l'ultima: e' quella del documento "esterno" reale, non uno snapshot.
    return matches[-1].group(1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('export_html', help='Percorso del file HTML monolitico da cui estrarre i dati')
    ap.add_argument('--out', default=None, help='Cartella di destinazione (default: data/local accanto a questo script)')
    args = ap.parse_args()

    if not os.path.isfile(args.export_html):
        print('File non trovato:', args.export_html, file=sys.stderr)
        sys.exit(1)

    out_dir = args.out or os.path.join(os.path.dirname(__file__), '..', 'data', 'local')
    os.makedirs(out_dir, exist_ok=True)

    with open(args.export_html, 'r', encoding='utf-8') as f:
        text = f.read()

    # In alcuni export più vecchi la vista "Analitica" è un iframe con il
    # suo documento incorporato come attributo HTML (quindi con le virgolette
    # scritte &quot;...&quot;): un passaggio di unescape sull'intero file lo
    # rende visibile a find_script_json esattamente come i tag non annidati.
    text_unescaped = html.unescape(text)

    found_any = False
    for script_id, out_name in [('raw', 'raw.json'), ('ferie', 'ferie.json'), ('ds', 'ds.json')]:
        raw = find_script_json(text, script_id)
        source = text
        if raw is None:
            raw = find_script_json(text_unescaped, script_id)
            source = text_unescaped
        if raw is None:
            print(f'  [!] tag <script id="{script_id}"> non trovato, salto {out_name}')
            continue
        content = raw if source is text_unescaped else html.unescape(raw)
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as e:
            print(f'  [!] {script_id}: JSON non valido ({e}), salto {out_name}')
            continue
        out_path = os.path.join(out_dir, out_name)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(parsed, f, ensure_ascii=False)
        print(f'  [ok] {out_name} <- #{script_id}  ({os.path.getsize(out_path):,} byte)')
        found_any = True

    if not found_any:
        print('Nessun dataset trovato in questo file. E\' un export di Bottega Norris Regia?', file=sys.stderr)
        sys.exit(2)

    print('\nFatto. File scritti in:', os.path.abspath(out_dir))
    print('Carica questi file dai pulsanti "Carica dati" dell\'app (restano solo nel tuo browser).')


if __name__ == '__main__':
    main()
