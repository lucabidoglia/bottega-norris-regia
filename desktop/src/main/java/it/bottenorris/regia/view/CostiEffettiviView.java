package it.bottenorris.regia.view;

import it.bottenorris.regia.model.CostoRecord;
import it.bottenorris.regia.model.DataStore;
import it.bottenorris.regia.util.CalcUtils;
import it.bottenorris.regia.util.Tally;
import it.bottenorris.regia.view.components.KpiCard;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.control.cell.TreeItemPropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.text.Text;

import java.util.*;

/**
 * Vista "Costi Effettivi": tabella gerarchica Funzione -> Reparto aggregato
 * -> Reparto lavori, calcolata dal dataset raw. Porta di ceInit()/ceRender()
 * in js/shell.js, con TreeTableView al posto delle righe <tr> espandibili
 * a mano (l'espansione/collasso qui è nativa di JavaFX).
 */
public class CostiEffettiviView extends VBox {

    /** Riga della tabella gerarchica: espone getter "bean style" per le colonne. */
    public static class Row {
        final String label;
        final int level;
        final Tally t;
        final Double prevFte;
        final int nM, nMp;
        final boolean isTotal;

        Row(String label, int level, Tally t, Double prevFte, int nM, int nMp, boolean isTotal) {
            this.label = label; this.level = level; this.t = t;
            this.prevFte = prevFte; this.nM = nM; this.nMp = nMp; this.isTotal = isTotal;
        }

        public String getLabel() { return label; }
        public String getCosto() { return CalcUtils.eur(t.costo); }
        public String getOre() { return CalcUtils.num0(t.ore); }
        public String getFerieOre() { return CalcUtils.num0(t.ferie); }
        public String getOreStraord() { return CalcUtils.num0(t.sore); }
        public String getCostoStraord() { return CalcUtils.eur(t.scos); }
        public String getPctStraord() {
            double inc = t.costo != 0 ? t.scos / t.costo : 0;
            return inc > 0.001 ? CalcUtils.pct(inc) : "—";
        }
        public String getFte() { return CalcUtils.fte1(t.fte / Math.max(1, nM)); }
        public String getDeltaFte() {
            if (prevFte == null) return "—";
            double cur = t.fte / Math.max(1, nM);
            double prev = prevFte / Math.max(1, nMp);
            double d = cur - prev;
            String sign = d >= 0 ? "+" : "−";
            return sign + CalcUtils.fte1(Math.abs(d));
        }
    }

    private final DataStore store;
    private final ComboBox<String> annoBox = new ComboBox<>();
    private final ComboBox<String> meseBox = new ComboBox<>();
    private final ComboBox<String> tipBox = new ComboBox<>();
    private final HBox kpiRow = new HBox(12);
    private final TreeTableView<Row> table = new TreeTableView<>();

    public CostiEffettiviView(DataStore store) {
        this.store = store;
        setSpacing(16);
        setPadding(new Insets(24));
        VBox.setVgrow(table, Priority.ALWAYS);

        Text eyebrow = new Text("CONSUNTIVO"); eyebrow.getStyleClass().add("eyebrow");
        Text title = new Text("Costi effettivi riclassificati"); title.getStyleClass().add("view-title");
        Text lede = new Text("Il costo del lavoro per Funzione › Reparto aggregato › Reparto lavori, calcolato in tempo reale dal dato grezzo. Espandi una riga per scendere di livello.");
        lede.getStyleClass().add("lede"); lede.setWrappingWidth(700);

        HBox controls = new HBox(14,
                labeled("Anno", annoBox), labeled("Mese", meseBox), labeled("Rapporto", tipBox));

        tipBox.setItems(FXCollections.observableArrayList("Tutti", "Dipendente", "Libero professionista"));
        tipBox.getSelectionModel().selectFirst();

        buildTable();

        getChildren().addAll(eyebrow, title, lede, controls, kpiRow, table);

        annoBox.valueProperty().addListener((o, a, b) -> { refreshMeseOptions(); render(); });
        meseBox.valueProperty().addListener((o, a, b) -> render());
        tipBox.valueProperty().addListener((o, a, b) -> render());

        refreshAnnoOptions();
    }

    private static VBox labeled(String label, Control control) {
        Label l = new Label(label.toUpperCase());
        l.getStyleClass().add("label-caps");
        control.setPrefWidth(180);
        VBox box = new VBox(5, l, control);
        return box;
    }

    private void refreshAnnoOptions() {
        List<String> years = new ArrayList<>(store.years());
        Collections.reverse(years);
        annoBox.setItems(FXCollections.observableArrayList(years));
        if (!years.isEmpty()) annoBox.getSelectionModel().select(0);
    }

    private void refreshMeseOptions() {
        String anno = annoBox.getValue();
        List<String> months = new ArrayList<>();
        months.add("Tutti i mesi disponibili");
        if (anno != null) months.addAll(store.availMonths(anno));
        String prev = meseBox.getValue();
        meseBox.setItems(FXCollections.observableArrayList(months));
        meseBox.getSelectionModel().select(months.contains(prev) ? prev : months.get(0));
    }

    private void buildTable() {
        table.getStyleClass().add("ledger-table");
        table.setShowRoot(false);
        table.setPrefHeight(500);

        TreeTableColumn<Row, String> cLabel = col("Funzione / Reparto", Row::getLabel);
        cLabel.setPrefWidth(260);

        table.getColumns().setAll(List.of(
                cLabel,
                col("Costo", Row::getCosto), col("Ore", Row::getOre), col("Ferie/ex fest.", Row::getFerieOre),
                col("Ore straord.", Row::getOreStraord), col("Costo straord.", Row::getCostoStraord),
                col("% straord.", Row::getPctStraord), col("FTE", Row::getFte), col("Δ FTE", Row::getDeltaFte)
        ));
    }

    private TreeTableColumn<Row, String> col(String title, java.util.function.Function<Row, String> fmt) {
        TreeTableColumn<Row, String> c = new TreeTableColumn<>(title);
        c.setCellValueFactory(cd -> new javafx.beans.property.ReadOnlyStringWrapper(fmt.apply(cd.getValue().getValue())));
        c.setPrefWidth(110);
        return c;
    }

    /** Ricalcola KPI e albero per i filtri correnti (equivalente a ceRender()). */
    public void render() {
        String anno = annoBox.getValue();
        if (anno == null) { kpiRow.getChildren().clear(); table.setRoot(null); return; }
        String mese = "Tutti i mesi disponibili".equals(meseBox.getValue()) ? null : meseBox.getValue();
        String tip = "Tutti".equals(tipBox.getValue()) ? null : tipBox.getValue();

        List<CostoRecord> list = store.flat(anno, mese, tip, null);
        Tally total = CalcUtils.tally(list);

        String py = String.valueOf(Integer.parseInt(anno) - 1);
        boolean hasPrev = store.years().contains(py);
        List<String> curMonths = mese != null ? List.of(mese) : store.availMonths(anno);
        int nM = Math.max(1, curMonths.size());
        int nMp = 1;
        Double prevFteTotal = null;
        Map<String, Double> prevIo = new HashMap<>(), prevIoAgg = new HashMap<>(), prevIoAggLav = new HashMap<>();
        if (hasPrev) {
            List<CostoRecord> prevList = new ArrayList<>();
            int matchedMonths = 0;
            for (String m : curMonths) {
                if (store.raw.containsKey(py) && store.raw.get(py).containsKey(m)) {
                    matchedMonths++;
                    prevList.addAll(store.flat(py, m, tip, null));
                }
            }
            nMp = Math.max(1, matchedMonths);
            for (CostoRecord r : prevList) {
                double f = r.fteEff();
                prevIo.merge(r.io, f, Double::sum);
                prevIoAgg.merge(r.io + "|" + r.agg, f, Double::sum);
                prevIoAggLav.merge(r.io + "|" + r.agg + "|" + r.lav, f, Double::sum);
            }
            prevFteTotal = CalcUtils.tally(prevList).fte;
        }

        // KPI
        double straInc = total.costo != 0 ? total.scos / total.costo : 0;
        kpiRow.getChildren().setAll(
                new KpiCard("Costo del lavoro", CalcUtils.eur(total.costo), null),
                new KpiCard("Ore lavorate", CalcUtils.num0(total.ore), null),
                new KpiCard("Costo straordinario", CalcUtils.eur(total.scos), CalcUtils.pct(straInc) + " del costo"),
                new KpiCard("FTE", CalcUtils.fte1(total.fte / nM),
                        prevFteTotal != null
                                ? (((total.fte / nM - prevFteTotal / nMp) >= 0 ? "+" : "−") + CalcUtils.fte1(Math.abs(total.fte / nM - prevFteTotal / nMp)) + " vs " + py)
                                : (tip != null ? tip : "dipendenti + liberi prof."))
        );

        // Albero gerarchico
        TreeItem<Row> root = new TreeItem<>();
        Map<String, Tally> byIo = CalcUtils.groupTally(list, r -> r.io);
        for (var e : CalcUtils.sortByCostoDesc(byIo)) {
            String io = e.getKey();
            Double prevFte = hasPrev ? prevIo.getOrDefault(io, 0.0) : null;
            TreeItem<Row> ioItem = new TreeItem<>(new Row(io, 0, e.getValue(), prevFte, nM, nMp, false));
            List<CostoRecord> subIo = list.stream().filter(r -> io.equals(r.io)).toList();
            Map<String, Tally> byAgg = CalcUtils.groupTally(subIo, r -> r.agg);
            for (var e2 : CalcUtils.sortByCostoDesc(byAgg)) {
                String agg = e2.getKey();
                Double prevFteAgg = hasPrev ? prevIoAgg.getOrDefault(io + "|" + agg, 0.0) : null;
                TreeItem<Row> aggItem = new TreeItem<>(new Row(agg, 1, e2.getValue(), prevFteAgg, nM, nMp, false));
                List<CostoRecord> subAgg = subIo.stream().filter(r -> agg.equals(r.agg)).toList();
                Map<String, Tally> byLav = CalcUtils.groupTally(subAgg, r -> r.lav);
                for (var e3 : CalcUtils.sortByCostoDesc(byLav)) {
                    String lav = e3.getKey();
                    Double prevFteLav = hasPrev ? prevIoAggLav.getOrDefault(io + "|" + agg + "|" + lav, 0.0) : null;
                    aggItem.getChildren().add(new TreeItem<>(new Row(lav, 2, e3.getValue(), prevFteLav, nM, nMp, false)));
                }
                ioItem.getChildren().add(aggItem);
            }
            root.getChildren().add(ioItem);
        }
        TreeItem<Row> totalItem = new TreeItem<>(new Row("TOTALE", -1, total, prevFteTotal, nM, nMp, true));
        root.getChildren().add(totalItem);

        table.setRoot(root);
    }
}
