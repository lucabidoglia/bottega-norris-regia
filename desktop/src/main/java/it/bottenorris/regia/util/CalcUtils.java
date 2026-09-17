package it.bottenorris.regia.util;

import it.bottenorris.regia.model.CostoRecord;

import java.text.NumberFormat;
import java.util.*;
import java.util.function.Function;

/**
 * Funzioni di aggregazione e formattazione — porta diretta di quelle
 * equivalenti in js/shell.js (tally, groupTally, eur, num0, pct, ...).
 */
public class CalcUtils {

    private static final Locale IT = Locale.ITALY;

    public static Tally tally(Collection<CostoRecord> list) {
        Tally t = new Tally();
        Set<String> teste = new HashSet<>();
        for (CostoRecord r : list) {
            t.costo += r.costo;
            t.ore += r.ore;
            t.sore += r.sore;
            t.scos += r.scos;
            t.ferie += r.ferie;
            t.fte += r.fteEff();
            if (r.matr != null) teste.add(r.matr);
        }
        t.teste = teste.size();
        return t;
    }

    /** Raggruppa per il campo indicato (via keyFn) e somma i valori come tally(). */
    public static Map<String, Tally> groupTally(Collection<CostoRecord> list, Function<CostoRecord, String> keyFn) {
        Map<String, List<CostoRecord>> groups = new LinkedHashMap<>();
        for (CostoRecord r : list) {
            String k = keyFn.apply(r);
            if (k == null) k = "—";
            groups.computeIfAbsent(k, x -> new ArrayList<>()).add(r);
        }
        Map<String, Tally> out = new LinkedHashMap<>();
        for (var e : groups.entrySet()) out.put(e.getKey(), tally(e.getValue()));
        return out;
    }

    public static List<Map.Entry<String, Tally>> sortByCostoDesc(Map<String, Tally> m) {
        List<Map.Entry<String, Tally>> l = new ArrayList<>(m.entrySet());
        l.sort((a, b) -> Double.compare(b.getValue().costo, a.getValue().costo));
        return l;
    }

    public static String eur(double v) {
        return "€ " + NumberFormat.getIntegerInstance(IT).format(Math.round(v));
    }

    public static String eur2(double v) {
        NumberFormat f = NumberFormat.getNumberInstance(IT);
        f.setMinimumFractionDigits(2);
        f.setMaximumFractionDigits(2);
        return "€ " + f.format(v);
    }

    public static String num0(double v) {
        return NumberFormat.getIntegerInstance(IT).format(Math.round(v));
    }

    public static String num2(double v) {
        NumberFormat f = NumberFormat.getNumberInstance(IT);
        f.setMinimumFractionDigits(2);
        f.setMaximumFractionDigits(2);
        return f.format(v);
    }

    public static String fte1(double v) {
        NumberFormat f = NumberFormat.getNumberInstance(IT);
        f.setMinimumFractionDigits(1);
        f.setMaximumFractionDigits(1);
        return f.format(v);
    }

    public static String pct(double v) {
        return pct(v, 1);
    }

    public static String pct(double v, int decimals) {
        NumberFormat f = NumberFormat.getNumberInstance(IT);
        f.setMinimumFractionDigits(decimals);
        f.setMaximumFractionDigits(decimals);
        return f.format(v * 100) + "%";
    }
}
