#!/usr/bin/env python3
"""
Genera i dataset demo (data/demo/raw.json, ferie.json, ds.json) usati come
contenuto di default dell'app quando nessun dato reale e' stato caricato
localmente (vedi js/data-loader.js e docs/05-data-model-e-privacy.md).

Tutti i nominativi sono INVENTATI (marcati "DEMO"/"ESEMPIO"/"CAMPIONE") e le
matricole sono nel range 9000+ per non poter mai collidere con matricole reali.
Nessun dato reale viene letto o usato da questo script: i valori numerici sono
generati con un generatore pseudocasuale a seme fisso, solo per rendere i
grafici e le tabelle dell'app leggibili in una demo.

Uso:
    python3 tools/generate-demo-data.py
Rigenera i tre file in data/demo/. Rilancialo se cambi la struttura demo.
"""
import json
import random
import os

random.seed(42)

MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio',
          'Agosto','Settembre','Ottobre','Novembre','Dicembre']

# Tutte le funzioni calibrate in js/budget.js (oggetto CAL): ognuna deve
# avere almeno un dipendente demo, altrimenti il motore di proiezione del
# Budget (che divide per le ore effettive osservate) produce NaN per le
# funzioni senza alcun dato -- lo stesso accadrebbe con dati reali incompleti.
FUNZIONI = ['A.S.A.', 'AMMINISTRATIVI', 'ANIMATORI / EDUCATORI', 'ASSISTENTI SOCIALI',
            'FISIOTERAPIA', 'FUNDRAISING', 'INFERMIERI', 'MAGAZZINO', 'MANUTENZIONE',
            'MEDICI', 'RECEPTION', 'SANIFICAZIONE', 'SERV. PSICO-SOCIALI']

STRUTTURE = {
    'A.S.A.': ('CDI Demo Nord', 'CDI Demo Nord', 'O.S.S.'),
    'AMMINISTRATIVI': ('Sede Demo', 'Sede Demo', 'Impiegato amministrativo'),
    'ANIMATORI / EDUCATORI': ('Centro Diurno Demo', 'Centro Diurno Demo', 'Educatore'),
    'ASSISTENTI SOCIALI': ('Sede Demo', 'Sede Demo', 'Assistente sociale'),
    'FISIOTERAPIA': ('RSA Demo Sud', 'RSA Demo Sud', 'Fisioterapista'),
    'FUNDRAISING': ('Sede Demo', 'Sede Demo', 'Addetto fundraising'),
    'INFERMIERI': ('RSA Demo Sud', 'RSA Demo Sud', 'Infermiere'),
    'MAGAZZINO': ('Sede Demo', 'Sede Demo', 'Addetto magazzino'),
    'MANUTENZIONE': ('Sede Demo', 'Sede Demo', 'Manutentore'),
    'MEDICI': ('RSA Demo Sud', 'RSA Demo Sud', 'Medico'),
    'RECEPTION': ('CDI Demo Nord', 'CDI Demo Nord', 'Addetto reception'),
    'SANIFICAZIONE': ('RSA Demo Sud', 'RSA Demo Sud', 'Addetto sanificazione'),
    'SERV. PSICO-SOCIALI': ('Centro Diurno Demo', 'Centro Diurno Demo', 'Psicologo'),
}

_NOMI = ['ANNA','MARCO','LUCA','SARA','GIULIA','PAOLO','ELENA','DAVIDE','CHIARA','FEDERICO',
         'ALICE','SIMONE','NOEMI','TOMMASO','GRETA']
_PREFISSI = ['ESEMPIO','DEMO','CAMPIONE']
DIPENDENTI_DEMO = []
for i, io in enumerate(FUNZIONI):
    n_dip = 2 if io in ('A.S.A.', 'INFERMIERI') else 1
    for j in range(n_dip):
        idx = len(DIPENDENTI_DEMO)
        DIPENDENTI_DEMO.append({
            'matr': str(9001 + idx),
            'dip': f'{_PREFISSI[idx % 3]} {_NOMI[idx % len(_NOMI)]}',
            'io': io,
        })

YEARS_MONTHS = [('2025', MONTHS)] + [('2026', MONTHS[:3])]  # 2025 completo, 2026 Gen-Mar

def gen_raw():
    raw = {}
    for year, months in YEARS_MONTHS:
        raw[year] = {}
        for m in months:
            rows = []
            for d in DIPENDENTI_DEMO:
                cdc, rep, man = STRUTTURE[d['io']]
                ore = round(random.uniform(120, 168), 2)
                sore = round(random.uniform(0, 8), 2)
                costo = round(ore * random.uniform(15, 19), 2)
                scos = round(sore * random.uniform(18, 24), 2)
                ferie = round(random.uniform(0, 14), 1)
                rows.append({
                    'matr': d['matr'], 'dip': d['dip'], 'io': d['io'],
                    'cdc': cdc, 'rep': rep, 'agg': cdc, 'lav': cdc, 'man': man,
                    'tip': 'Dipendente', 'attivo': True,
                    'ore': ore, 'sore': sore, 'costo': costo, 'scos': scos,
                    'ferie': ferie, 'fte': round(ore/165, 4),
                })
            raw[year][m] = rows
    return raw

def gen_ferie():
    rows = []
    for d in DIPENDENTI_DEMO:
        cdc, rep, man = STRUTTURE[d['io']]
        ore = round(random.uniform(40, 220), 2)
        val = round(ore * random.uniform(16, 20), 2)
        fruito = round(random.uniform(20, 120), 2)
        rows.append({
            'matr': d['matr'], 'dip': d['dip'], 'io': d['io'],
            'cdc': cdc, 'agg': cdc, 'lav': cdc,
            'ore': ore, 'val': val, 'fruito': fruito, 'resAp': round(ore*0.15, 2),
        })
    return {'aggiornato': '31/03/2026 (dati demo)', 'rows': rows}

def gen_ds():
    rows = []
    months_flat = [('2025', m) for m in MONTHS] + [('2026', m) for m in MONTHS[:3]]
    for y, m in months_flat:
        for d in DIPENDENTI_DEMO:
            cdc, rep, man = STRUTTURE[d['io']]
            ord_ = round(random.uniform(120, 150), 2)
            stra = round(random.uniform(0, 8), 2)
            eff = round(ord_ + stra, 2)
            costo = round(eff * random.uniform(15, 19), 2)
            rows.append({
                'y': int(y), 'm': m, 'matr': d['matr'], 'dip': d['dip'], 'io': d['io'],
                'cdc': cdc, 'rep': rep, 'agg': cdc, 'lav': cdc, 'man': man, 'tip': 'Dipendente',
                'costo': costo, 'eff': eff, 'ord': ord_, 'stra': stra,
                'imp_stra': round(stra * 20, 2), 'magg': round(random.uniform(0, 6), 2),
                'imp_magg': round(random.uniform(0, 90), 2), 'fte': round(eff/165, 4),
                'ferie': round(random.uniform(0, 12), 1), 'mal': round(random.uniform(0, 16), 1),
                'ass_r': round(random.uniform(0, 8), 1), 'ass_nr': round(random.uniform(0, 4), 1),
                'ass_nc': round(random.uniform(0, 4), 1), 'ind': round(random.uniform(0, 40), 2),
                'nonric': 0,
            })
    return {'rows': rows, 'months': MONTHS}

if __name__ == '__main__':
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'demo')
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'raw.json'), 'w', encoding='utf-8') as f:
        json.dump(gen_raw(), f, ensure_ascii=False)
    with open(os.path.join(out_dir, 'ferie.json'), 'w', encoding='utf-8') as f:
        json.dump(gen_ferie(), f, ensure_ascii=False)
    with open(os.path.join(out_dir, 'ds.json'), 'w', encoding='utf-8') as f:
        json.dump(gen_ds(), f, ensure_ascii=False)
    print('Dati demo generati in', out_dir)
