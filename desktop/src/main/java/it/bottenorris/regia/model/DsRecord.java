package it.bottenorris.regia.model;

import it.bottenorris.regia.util.Json;

import java.util.Map;

/** Una riga del dataset "ds" (dettaglio Analitica: assenze scomposte, malattia, ecc.). */
public class DsRecord {
    public int y;
    public String m;
    public String matr;
    public String dip;
    public String io;
    public String cdc;
    public String rep;
    public String agg;
    public String lav;
    public String man;
    public String tip;
    public double costo;
    public double eff;
    public double ord;
    public double stra;
    public double imp_stra;
    public double magg;
    public double imp_magg;
    public double ind;
    public double mal;
    public double ass_r;
    public double ass_nr;
    public double ass_nc;
    public double nonric;
    public double ferie;
    public Double fte;

    public static DsRecord fromMap(Map<String, Object> map) {
        DsRecord r = new DsRecord();
        r.y = (int) Json.num(map, "y"); r.m = Json.str(map, "m");
        r.matr = Json.str(map, "matr"); r.dip = Json.str(map, "dip"); r.io = Json.str(map, "io");
        r.cdc = Json.str(map, "cdc"); r.rep = Json.str(map, "rep"); r.agg = Json.str(map, "agg");
        r.lav = Json.str(map, "lav"); r.man = Json.str(map, "man"); r.tip = Json.str(map, "tip");
        r.costo = Json.num(map, "costo"); r.eff = Json.num(map, "eff"); r.ord = Json.num(map, "ord");
        r.stra = Json.num(map, "stra"); r.imp_stra = Json.num(map, "imp_stra"); r.magg = Json.num(map, "magg");
        r.imp_magg = Json.num(map, "imp_magg"); r.ind = Json.num(map, "ind"); r.mal = Json.num(map, "mal");
        r.ass_r = Json.num(map, "ass_r"); r.ass_nr = Json.num(map, "ass_nr"); r.ass_nc = Json.num(map, "ass_nc");
        r.nonric = Json.num(map, "nonric"); r.ferie = Json.num(map, "ferie"); r.fte = Json.numOrNull(map, "fte");
        return r;
    }

    public double fteEff() {
        if (fte != null) return fte;
        return eff / 165.0;
    }
}
