package it.bottenorris.regia.model;

import it.bottenorris.regia.util.Json;

import java.util.Map;

/** Una riga del dataset "ferie" (residuo ferie/ex festività per dipendente). */
public class FerieRecord {
    public String matr;
    public String dip;
    public String io;
    public String cdc;
    public String agg;
    public String lav;
    public double ore;
    public double val;
    public double fruito;
    public double resAp;

    public static FerieRecord fromMap(Map<String, Object> m) {
        FerieRecord r = new FerieRecord();
        r.matr = Json.str(m, "matr"); r.dip = Json.str(m, "dip"); r.io = Json.str(m, "io");
        r.cdc = Json.str(m, "cdc"); r.agg = Json.str(m, "agg"); r.lav = Json.str(m, "lav");
        r.ore = Json.num(m, "ore"); r.val = Json.num(m, "val");
        r.fruito = Json.num(m, "fruito"); r.resAp = Json.num(m, "resAp");
        return r;
    }
}
