package it.bottenorris.regia.model;

import java.util.*;

/**
 * Contenitore in memoria dei quattro dataset dell'app, equivalente ai tag
 * &lt;script id="raw"/"ferie"/"ds"&gt; della web app. Popolato da
 * {@link it.bottenorris.regia.data.DataLoader}.
 */
public class DataStore {
    /** anno -> mese -> righe */
    public Map<String, Map<String, List<CostoRecord>>> raw = new LinkedHashMap<>();
    public String ferieAggiornato = "";
    public List<FerieRecord> ferie = new ArrayList<>();
    public List<String> dsMonths = new ArrayList<>();
    public List<DsRecord> ds = new ArrayList<>();

    public static final List<String> MONTHS = List.of(
            "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
            "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre");

    public List<String> years() {
        List<String> ys = new ArrayList<>(raw.keySet());
        Collections.sort(ys);
        return ys;
    }

    public String latestYear() {
        List<String> ys = years();
        return ys.isEmpty() ? null : ys.get(ys.size() - 1);
    }

    public String prevYear() {
        List<String> ys = years();
        return ys.size() > 1 ? ys.get(ys.size() - 2) : null;
    }

    public List<String> availMonths(String year) {
        Map<String, List<CostoRecord>> y = raw.get(year);
        if (y == null) return List.of();
        List<String> out = new ArrayList<>();
        for (String m : MONTHS) if (y.containsKey(m)) out.add(m);
        return out;
    }

    /** Tutte le funzioni ("io") viste in tutto il dataset raw, ordinate. */
    public List<String> funzioni() {
        TreeSet<String> s = new TreeSet<>();
        for (var yEntry : raw.entrySet())
            for (var mEntry : yEntry.getValue().entrySet())
                for (CostoRecord r : mEntry.getValue()) s.add(r.io);
        return new ArrayList<>(s);
    }

    public int totalRecords() {
        int n = 0;
        for (var yEntry : raw.entrySet())
            for (var mEntry : yEntry.getValue().entrySet())
                n += mEntry.getValue().size();
        return n;
    }

    /** record raw filtrati per anno, opzionalmente mese/tipo/funzione. */
    public List<CostoRecord> flat(String year, String month, String tip, String io) {
        List<CostoRecord> out = new ArrayList<>();
        Map<String, List<CostoRecord>> y = raw.get(year);
        if (y == null) return out;
        List<String> ms = month != null ? List.of(month) : new ArrayList<>(y.keySet());
        for (String m : ms) {
            List<CostoRecord> rows = y.get(m);
            if (rows == null) continue;
            for (CostoRecord r : rows) {
                if (tip != null && !tip.equals(r.tip)) continue;
                if (io != null && !io.equals(r.io)) continue;
                out.add(r);
            }
        }
        return out;
    }
}
