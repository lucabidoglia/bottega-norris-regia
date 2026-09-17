package it.bottenorris.regia.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Una riga del dataset "ferie" (residuo ferie/ex festività per dipendente). */
@JsonIgnoreProperties(ignoreUnknown = true)
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
}
