package it.bottenorris.regia.model;

import it.bottenorris.regia.util.Json;

import java.util.Map;

/**
 * Una riga del dataset "raw" (costi effettivi): un dipendente/collaboratore,
 * un mese. Stesso schema del web app (vedi docs/05-data-model-e-privacy.md
 * nel repository principale).
 */
public class CostoRecord {
    public String matr;
    public String dip;
    public String io;
    public String cdc;
    public String rep;
    public String agg;
    public String lav;
    public String man;
    public String tip;
    public boolean attivo = true;
    public double ore;
    public double sore;
    public double costo;
    public double scos;
    public double ferie;
    public Double fte;

    public static CostoRecord fromMap(Map<String, Object> m) {
        CostoRecord r = new CostoRecord();
        r.matr = Json.str(m, "matr"); r.dip = Json.str(m, "dip"); r.io = Json.str(m, "io");
        r.cdc = Json.str(m, "cdc"); r.rep = Json.str(m, "rep"); r.agg = Json.str(m, "agg");
        r.lav = Json.str(m, "lav"); r.man = Json.str(m, "man"); r.tip = Json.str(m, "tip");
        r.attivo = Json.bool(m, "attivo", true);
        r.ore = Json.num(m, "ore"); r.sore = Json.num(m, "sore"); r.costo = Json.num(m, "costo");
        r.scos = Json.num(m, "scos"); r.ferie = Json.num(m, "ferie"); r.fte = Json.numOrNull(m, "fte");
        return r;
    }

    public double fteEff() {
        if (fte != null) return fte;
        double montante = 165.0;
        if ("Libero professionista".equals(tip)) return Math.min(1.0, ore / montante);
        return ore / montante;
    }
}
