package it.bottenorris.regia.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Una riga del dataset "raw" (costi effettivi): un dipendente/collaboratore,
 * un mese. Stesso schema del web app (vedi docs/05-data-model-e-privacy.md
 * nel repository principale).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
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

    public double fteEff() {
        if (fte != null) return fte;
        double montante = 165.0;
        if ("Libero professionista".equals(tip)) return Math.min(1.0, ore / montante);
        return ore / montante;
    }
}
