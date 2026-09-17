package it.bottenorris.regia.util;

import it.bottenorris.regia.model.CostoRecord;
import it.bottenorris.regia.model.DataStore;

import java.util.*;

/**
 * Motore di proiezione del costo del lavoro — porta 1:1 delle funzioni
 * _computeBASE(), projectFunc(), projectAll() in js/budget.js. Stessa
 * calibrazione (CAL), stesse formule del "ponte" (bridge) per componente.
 * A differenza dell'originale (anno base e orizzonte scritti nel codice),
 * qui l'anno base è DataStore.latestYear() e l'orizzonte sono i 4 anni
 * successivi, calcolati dinamicamente.
 */
public class BudgetEngine {

    /** Calibrazione fissa per funzione (non un dato caricabile: aggiorna qui se cambia l'organizzazione). */
    public record Cal(double fte, double impMagg, double ind, double nonric, double ord, double magg,
                       double oreContrFte, double oreNecFte, double pAss, double turnover) {}

    public static final Map<String, Cal> CAL = new LinkedHashMap<>();
    static {
        CAL.put("A.S.A.", new Cal(197.22, 173456, 85022, 13313, 286264, 51892, 1792, 1773, 0.1898, 0.266));
        CAL.put("AMMINISTRATIVI", new Cal(18.1, 0, 50561, 29425, 28366, 0, 1860, 1672, 0.1573, 0.136));
        CAL.put("ANIMATORI / EDUCATORI", new Cal(14.57, 1593, 8280, 8735, 21474, 484, 1853, 1773, 0.2047, 0.158));
        CAL.put("ASSISTENTI SOCIALI", new Cal(3.83, 0, 8520, 856, 6424, 0, 1865, 1877, 0.1013, 0.0));
        CAL.put("FISIOTERAPIA", new Cal(7.61, 0, 2400, 1765, 11504, 0, 1880, 1642, 0.1955, 0.286));
        CAL.put("FUNDRAISING", new Cal(2.0, 0, 0, 6384, 3459, 0, 1900, 1028, 0.0897, 0.0));
        CAL.put("INFERMIERI", new Cal(14.71, 21834, 13202, 121, 19423, 4278, 1504, 1959, 0.1218, 0.381));
        CAL.put("MAGAZZINO", new Cal(4.53, 0, 14656, 5244, 7470, 0, 1868, 2059, 0.118, 0.167));
        CAL.put("MANUTENZIONE", new Cal(1.0, 0, 8836, 3760, 1792, 0, 1900, 2302, 0.0574, 0.0));
        CAL.put("MEDICI", new Cal(5.95, 0, 72660, 296, 9763, 0, 1889, 2153, 0.1318, 0.0));
        CAL.put("RECEPTION", new Cal(4.2, 1342, 0, 0, 6448, 993, 1951, 1885, 0.2133, 0.0));
        CAL.put("SANIFICAZIONE", new Cal(0.79, 0, 0, 0, 1172, 0, 1899, 1507, 0.2183, 0.0));
        CAL.put("SERV. PSICO-SOCIALI", new Cal(1.87, 0, 0, 555, 3351, 0, 2112, 2022, 0.15, 0.25));
    }

    public record Scenario(double ccnl, double integ, double istat, double scatti, double organico,
                            double sconto, double coper, double unatantum, String note) {}

    public static final Map<String, Scenario> SCENARI = Map.of(
            "prudente", new Scenario(1.5, 0.3, 1.5, 0.8, 0.0, 12, 110, 2500, "Aumenti minimi, coperture contenute."),
            "centrale", new Scenario(2.7, 0.5, 2.0, 1.0, 0.0, 12, 120, 3000, "Rinnovo in linea con le ultime tornate, IPCA verso il 2%."),
            "teso", new Scenario(4.0, 1.0, 3.0, 1.2, 1.0, 10, 135, 3500, "Rinnovo generoso, inflazione alta, organico in crescita.")
    );

    public static class FuncBase {
        public double fte, costo, costoFte, base, impStra, impMagg, ind, nonric;
        public double pAss, pStra, ord, eff, stra, magg, oreContrFte, oreNecFte, pMagg, turnover;
    }

    public static class Base {
        public int annoBase;
        public double tot;
        public double driftOsservato;
        public Map<String, FuncBase> funzioni = new LinkedHashMap<>();
    }

    public static class YearPoint {
        public int anno;
        public double costo, base, ind, impStra, impMagg, nonric, fte, costoFte, stra, magg, ord, eff, pStra, pAss;
        public double costoOra, effRatio;
        /** composizione ore (contr/nec/ordRese/gap), riportata avanti come nell'originale oreOf(). */
        public double oreContr, oreNec, oreOrdRese, oreGap;
        public List<BridgeItem> bridge;
    }

    public record BridgeItem(String label, double valore) {}

    /** Leve globali modificabili dall'utente, inizializzate da uno scenario. */
    public static class Levers {
        public double ccnl, integ, istat, scatti, organico, sconto, coper, unatantum;
        public Levers(Scenario s) {
            ccnl = s.ccnl(); integ = s.integ(); istat = s.istat(); scatti = s.scatti();
            organico = s.organico(); sconto = s.sconto(); coper = s.coper(); unatantum = s.unatantum();
        }
    }

    /** Stato per-funzione modificabile: assenteismo e turnover. */
    public static class FuncState {
        public double ass, turn;
    }

    public static Base computeBase(DataStore store) {
        Base b = new Base();
        String latest = store.latestYear();
        String prev = store.prevYear();
        if (latest == null) return b;
        b.annoBase = Integer.parseInt(latest);

        List<String> avail = store.availMonths(latest);
        String refYear = !avail.isEmpty() ? latest : prev;
        List<String> refMonths = refYear != null ? store.availMonths(refYear) : List.of();

        Map<String, double[]> avg = new HashMap<>(); // costo, eff, stra, impStra
        for (String io : CAL.keySet()) {
            double c = 0, e = 0, st = 0, is = 0;
            for (String m : refMonths) {
                for (CostoRecord r : store.flat(refYear, m, "Dipendente", io)) {
                    c += r.costo; e += r.ore; st += r.sore; is += r.scos;
                }
            }
            int n = Math.max(1, refMonths.size());
            avg.put(io, new double[]{c / n, e / n, st / n, is / n});
        }

        Map<String, double[]> funz = new LinkedHashMap<>();
        for (String io : CAL.keySet()) funz.put(io, new double[]{0, 0, 0, 0}); // costo, eff, stra, impStra

        for (String m : DataStore.MONTHS) {
            String yr = (store.raw.containsKey(latest) && store.raw.get(latest).containsKey(m)) ? latest
                    : (prev != null && store.raw.containsKey(prev) && store.raw.get(prev).containsKey(m)) ? prev : null;
            for (String io : funz.keySet()) {
                double c, e, st, is;
                if (yr != null) {
                    c = e = st = is = 0;
                    for (CostoRecord r : store.flat(yr, m, "Dipendente", io)) { c += r.costo; e += r.ore; st += r.sore; is += r.scos; }
                } else {
                    double[] a = avg.get(io);
                    c = a[0]; e = a[1]; st = a[2]; is = a[3];
                }
                double[] f = funz.get(io);
                f[0] += c; f[1] += e; f[2] += st; f[3] += is;
            }
        }

        for (String io : CAL.keySet()) {
            Cal k = CAL.get(io);
            double[] o = funz.get(io);
            double costo = Math.round(o[0]), eff = Math.round(o[1]), stra = Math.round(o[2]), impStra = Math.round(o[3]);
            double base = Math.round(costo - impStra - k.impMagg() - k.ind() - k.nonric());
            FuncBase fb = new FuncBase();
            fb.fte = k.fte(); fb.costo = costo; fb.costoFte = k.fte() != 0 ? costo / k.fte() : 0; fb.base = base;
            fb.impStra = impStra; fb.impMagg = k.impMagg(); fb.ind = k.ind(); fb.nonric = k.nonric();
            fb.pAss = k.pAss(); fb.pStra = k.ord() != 0 ? round4(stra / k.ord()) : 0; fb.ord = k.ord(); fb.eff = eff; fb.stra = stra;
            fb.magg = k.magg(); fb.oreContrFte = k.oreContrFte(); fb.oreNecFte = k.oreNecFte();
            fb.pMagg = eff != 0 ? round4(k.magg() / eff) : 0; fb.turnover = k.turnover();
            b.funzioni.put(io, fb);
        }
        b.tot = b.funzioni.values().stream().mapToDouble(f -> f.costo).sum();

        double drift = 0.0413;
        if (prev != null) {
            List<String> common = store.availMonths(latest).stream()
                    .filter(m -> store.raw.containsKey(prev) && store.raw.get(prev).containsKey(m)).toList();
            double cl = 0, cp = 0;
            for (String m : common) for (String io : CAL.keySet()) {
                for (CostoRecord r : store.flat(latest, m, "Dipendente", io)) cl += r.costo;
                for (CostoRecord r : store.flat(prev, m, "Dipendente", io)) cp += r.costo;
            }
            if (cp != 0) drift = round4(cl / cp - 1);
        }
        b.driftOsservato = drift;
        return b;
    }

    private static double round4(double v) { return Math.round(v * 10000.0) / 10000.0; }

    public static List<Integer> horizon(Base base) {
        return List.of(base.annoBase + 1, base.annoBase + 2, base.annoBase + 3, base.annoBase + 4);
    }

    /** Proietta una funzione sull'orizzonte, a partire dalla base e dalle leve/stato correnti. */
    public static Map<Integer, YearPoint> projectFunc(Base base, String fname, Levers g, FuncState fx, double oreNecFteOverride) {
        FuncBase b = base.funzioni.get(fname);
        double assBase = b.pAss;
        double oreContrFte = b.oreContrFte;
        double oreNecFte = oreNecFteOverride > 0 ? oreNecFteOverride : b.oreNecFte;

        Map<Integer, YearPoint> years = new LinkedHashMap<>();
        YearPoint y0 = new YearPoint();
        y0.anno = base.annoBase; y0.costo = b.costo; y0.base = b.base; y0.ind = b.ind;
        y0.impStra = b.impStra; y0.impMagg = b.impMagg; y0.nonric = b.nonric;
        y0.fte = b.fte; y0.costoFte = b.costoFte; y0.stra = b.stra; y0.magg = b.magg; y0.ord = b.ord; y0.eff = b.eff;
        y0.pStra = b.pStra; y0.pAss = assBase;
        y0.costoOra = b.eff > 0 ? b.costo / b.eff : 0; y0.effRatio = b.ord > 0 ? b.eff / b.ord : 0;
        y0.oreContr = b.fte * oreContrFte; y0.oreNec = b.fte * oreNecFte;
        y0.oreOrdRese = y0.oreContr * (1 - assBase); y0.oreGap = y0.oreNec - y0.oreOrdRese;
        y0.bridge = List.of();
        years.put(base.annoBase, y0);

        YearPoint prev = y0;
        List<Integer> hz = horizon(base);
        for (int ix = 0; ix < hz.size(); ix++) {
            int t = hz.get(ix);
            int step = (ix == 0) ? 2 : 1;
            List<BridgeItem> bridge = new ArrayList<>();

            double fteNew = prev.fte * Math.pow(1 + g.organico / 100, step);
            double effOrg = (fteNew - prev.fte) * prev.costoFte;
            bridge.add(new BridgeItem("Organico", effOrg));

            double dinBase = Math.pow(1 + (g.ccnl + g.integ + g.scatti) / 100, step) - 1;
            double effBase = prev.base * dinBase;
            bridge.add(new BridgeItem("Dinamica base (CCNL+integrativo+scatti)", effBase));

            double compIstat = Math.pow(1 + g.istat / 100, step) - 1;
            double effIstat = (prev.ind + prev.nonric) * compIstat;
            bridge.add(new BridgeItem("Rivalutazione ISTAT su indennità", effIstat));

            double effTurn = -(prev.base * fx.turn * (g.sconto / 100)) * step;
            bridge.add(new BridgeItem("Sconto turnover (neoassunti)", effTurn));

            double orePot = prev.ord / (1 - Math.min(0.6, prev.pAss));
            double costoOraPrev = prev.ord > 0 ? (prev.base + prev.ind) / Math.max(prev.eff, 1e-9) : 0;
            double dAss = fx.ass - assBase;
            double effCoper = dAss * orePot * costoOraPrev * (g.coper / 100);
            bridge.add(new BridgeItem("Copertura assenteismo", effCoper));

            double effUna = (fteNew * fx.turn) * g.unatantum * step;
            bridge.add(new BridgeItem("Una tantum turnover", effUna));

            double costo = prev.costo + effOrg + effBase + effIstat + effTurn + effCoper + effUna;
            double baseNew = prev.base * (1 + dinBase) - prev.base * fx.turn * (g.sconto / 100) * step;
            double indNew = prev.ind * (1 + compIstat);

            double contrNew = fteNew * oreContrFte, necNew = fteNew * oreNecFte;
            double ordReseNew = contrNew * (1 - fx.ass);
            double gapNew = necNew - ordReseNew;
            double straShareBase = prev.oreGap > 0 ? prev.stra / prev.oreGap : 0.5;
            double straNew = Math.max(0, gapNew * straShareBase * (1 + Math.max(0, dAss) * 2));
            double maggNew = fteNew * oreNecFte * b.pMagg * (1 + Math.max(0, dAss));
            double effNew = ordReseNew + Math.max(0, gapNew);
            double impStraNew = prev.impStra * (straNew / Math.max(prev.stra, 1)) * (1 + dinBase);

            YearPoint cur = new YearPoint();
            cur.anno = t; cur.costo = costo; cur.base = baseNew; cur.ind = indNew;
            cur.impStra = impStraNew; cur.impMagg = prev.impMagg * (1 + dinBase) * (maggNew / Math.max(prev.magg, 1));
            cur.nonric = prev.nonric * (1 + compIstat);
            cur.fte = fteNew; cur.costoFte = fteNew > 0 ? costo / fteNew : 0;
            cur.stra = straNew; cur.magg = maggNew; cur.ord = ordReseNew; cur.eff = effNew;
            cur.costoOra = effNew > 0 ? costo / effNew : 0; cur.effRatio = ordReseNew > 0 ? effNew / ordReseNew : 0;
            cur.pStra = ordReseNew > 0 ? straNew / ordReseNew : 0; cur.pAss = fx.ass;
            cur.oreContr = contrNew; cur.oreNec = necNew; cur.oreOrdRese = ordReseNew; cur.oreGap = gapNew;
            cur.bridge = bridge;
            years.put(t, cur);
            prev = cur;
        }
        return years;
    }

    public static class Totals {
        public Map<Integer, YearPoint> tot = new LinkedHashMap<>();
    }

    public static class Model {
        public Map<String, Map<Integer, YearPoint>> by = new LinkedHashMap<>();
        public Totals totals = new Totals();
    }

    public static Model projectAll(Base base, Levers g, Map<String, FuncState> fx, Map<String, Double> necFteOverride) {
        Model model = new Model();
        List<Integer> years = new ArrayList<>(List.of(base.annoBase));
        years.addAll(horizon(base));
        for (int y : years) model.totals.tot.put(y, new YearPoint());
        for (int y : years) model.totals.tot.get(y).anno = y;

        for (String f : base.funzioni.keySet()) {
            FuncState state = fx.computeIfAbsent(f, k -> {
                FuncState s = new FuncState();
                s.ass = base.funzioni.get(k).pAss; s.turn = base.funzioni.get(k).turnover;
                return s;
            });
            double necOverride = necFteOverride.getOrDefault(f, 0.0);
            Map<Integer, YearPoint> proj = projectFunc(base, f, g, state, necOverride);
            model.by.put(f, proj);
            for (int y : years) {
                YearPoint k = model.totals.tot.get(y);
                YearPoint v = proj.get(y);
                k.costo += v.costo; k.fte += v.fte; k.base += v.base; k.impStra += v.impStra;
                k.stra += v.stra; k.ord += v.ord; k.eff += v.eff; k.ind += v.ind;
                k.impMagg += v.impMagg; k.nonric += v.nonric; k.magg += v.magg;
            }
        }
        for (int y : years) {
            YearPoint k = model.totals.tot.get(y);
            k.costoFte = k.fte > 0 ? k.costo / k.fte : 0;
            k.pStra = k.ord > 0 ? k.stra / k.ord : 0;
            k.costoOra = k.eff > 0 ? k.costo / k.eff : 0;
            k.effRatio = k.ord > 0 ? k.eff / k.ord : 0;
            double a = 0, w = 0;
            for (String f : base.funzioni.keySet()) {
                FuncState s = fx.get(f);
                a += s.ass * base.funzioni.get(f).fte;
                w += base.funzioni.get(f).fte;
            }
            k.pAss = w > 0 ? a / w : 0;
        }
        return model;
    }
}
