package it.bottenorris.regia.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Una riga del dataset "ds" (dettaglio Analitica: assenze scomposte, malattia, ecc.). */
@JsonIgnoreProperties(ignoreUnknown = true)
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

    public double fteEff() {
        if (fte != null) return fte;
        return eff / 165.0;
    }
}
