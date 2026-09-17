package it.bottenorris.regia.view;

import it.bottenorris.regia.model.CostoRecord;
import it.bottenorris.regia.model.DataStore;
import it.bottenorris.regia.util.CalcUtils;
import it.bottenorris.regia.util.Tally;
import it.bottenorris.regia.util.XlsxWriter;
import it.bottenorris.regia.view.components.KpiCard;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.control.*;
import javafx.scene.control.cell.TreeItemPropertyValueFactory;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.text.Text;
import javafx.stage.FileChooser;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.function.Function;

/**
 * Vista "Confronto anno su anno": tabella gerarchica Funzione -> Struttura
 * riclassificata -> Reparto effettivo -> Centro di costo, anno corrente
 * (l'ultimo disponibile) contro il precedente. Porta di aggregate()/render()
 * in js/yoy.js; a differenza dell'originale (YM/YC fissi nel codice) qui gli
 * anni sono presi dinamicamente da DataStore.latestYear()/prevYear().
 */
public class YoyView extends VBox {

    static class Row {
        final String label;
        final Tally cur, prev;
        final boolean hasPrev;
        final double totCostoCur;

        Row(String label, Tally cur, Tally prev, boolean hasPrev, double totCostoCur) {
            this.label = label; this.cur = cur; this.prev = prev; this.hasPrev = hasPrev; this.totCostoCur = totCostoCur;
        }

        public String getLabel() { return label; }
        public String getOre() { return CalcUtils.num0(cur.ore); }
        public String getCosto() { return CalcUtils.eur(cur.costo); }
        public String getEuroOra() { return cur.ore > 0 ? CalcUtils.eur2(cur.costo / cur.ore) : "—"; }
        public String getOrePrev() { return hasPrev ? CalcUtils.num0(prev.ore) : "n/d"; }
        public String getCostoPrev() { return hasPrev ? CalcUtils.eur(prev.costo) : "n/d"; }
        public String getEuroOraPrev() { return hasPrev ? (prev.ore > 0 ? CalcUtils.eur2(prev.costo / prev.ore) : "—") : "n/d"; }
        public String getDeltaOre() { return hasPrev ? CalcUtils.num0(cur.ore - prev.ore) : "n/d"; }
        public String getDeltaCosto() { return hasPrev ? CalcUtils.eur(cur.costo - prev.costo) : "n/d"; }
        public String getDeltaPct() {
            if (!hasPrev) return "n/d";
            if (prev.costo == 0) return cur.costo != 0 ? "n.c." : "0,0%";
            return CalcUtils.pct((cur.costo - prev.costo) / prev.costo);
        }
        public String getQuota() { return totCostoCur != 0 ? CalcUtils.pct(cur.costo / totCostoCur) : "—"; }
        public String getFte() { return CalcUtils.fte1(cur.fte); }
        public String getFtePrev() { return hasPrev ? CalcUtils.fte1(prev.fte) : "n/d"; }
        public String getDeltaFte() {
            if (!hasPrev) return "n/d";
            double d = cur.fte - prev.fte;
            return (d >= 0 ? "+" : "−") + CalcUtils.fte1(Math.abs(d));
        }
    }

    private final DataStore store;
    private final ComboBox<String> daBox = new ComboBox<>();
    private final ComboBox<String> aBox = new ComboBox<>();
    private final ComboBox<String> funzioneBox = new ComboBox<>();
    private final ComboBox<String> tipoBox = new ComboBox<>();
    private final HBox kpiRow = new HBox(12);
    private final Label noteLabel = new Label();
    private final TreeTableView<Row> table = new TreeTableView<>();
    private final String currentYear, previousYear;

    public YoyView(DataStore store) {
        this.store = store;
        this.currentYear = store.latestYear();
        this.previousYear = store.prevYear();
        setSpacing(16);
        setPadding(new Insets(24));
        VBox.setVgrow(table, Priority.ALWAYS);

        Text title = new Text("Confronto anno su anno"); title.getStyleClass().add("view-title");
        Text lede = new Text("Costi effettivi riclassificati, " + currentYear + (previousYear != null ? " vs " + previousYear : "")
                + ". Gerarchia: Funzione › Struttura riclassificata › Reparto effettivo › Centro di costo.");
        lede.getStyleClass().add("lede"); lede.setWrappingWidth(700);

        noteLabel.getStyleClass().add("lede");

        List<String> months = currentYear != null ? store.availMonths(currentYear) : List.of();
        daBox.setItems(FXCollections.observableArrayList(months));
        aBox.setItems(FXCollections.observableArrayList(months));
        if (!months.isEmpty()) { daBox.getSelectionModel().selectFirst(); aBox.getSelectionModel().select(months.size() - 1); }

        funzioneBox.setItems(FXCollections.observableArrayList(prepend("Tutte le funzioni", store.funzioni())));
        funzioneBox.getSelectionModel().selectFirst();
        tipoBox.setItems(FXCollections.observableArrayList("Tutte le tipologie", "Dipendente", "Libero professionista"));
        tipoBox.getSelectionModel().selectFirst();

        Button exportBtn = new Button("⬇ Esporta Excel");
        exportBtn.getStyleClass().add("bn-btn");
        exportBtn.setOnAction(e -> export());

        FlowPane controls = new FlowPane(14, 10,
                labeled("Da mese", daBox), labeled("A mese", aBox),
                labeled("Funzione", funzioneBox), labeled("Tipologia", tipoBox));

        buildTable();
        getChildren().addAll(title, lede, noteLabel, controls, exportBtn, kpiRow, table);

        daBox.valueProperty().addListener((o, a, b) -> render());
        aBox.valueProperty().addListener((o, a, b) -> render());
        funzioneBox.valueProperty().addListener((o, a, b) -> render());
        tipoBox.valueProperty().addListener((o, a, b) -> render());

        render();
    }

    private static List<String> prepend(String first, List<String> rest) {
        List<String> l = new ArrayList<>(); l.add(first); l.addAll(rest); return l;
    }

    private static VBox labeled(String label, Control control) {
        Label l = new Label(label.toUpperCase());
        l.getStyleClass().add("label-caps");
        control.setPrefWidth(170);
        return new VBox(5, l, control);
    }

    private void buildTable() {
        table.getStyleClass().add("ledger-table");
        table.setShowRoot(false);
        table.setPrefHeight(480);
        TreeTableColumn<Row, String> cLabel = col("Funzione › Struttura › Reparto › CdC", Row::getLabel);
        cLabel.setPrefWidth(260);
        table.getColumns().setAll(List.of(
                cLabel,
                col("Ore", Row::getOre), col("Costo", Row::getCosto), col("€/ora", Row::getEuroOra),
                col("Ore prec.", Row::getOrePrev), col("Costo prec.", Row::getCostoPrev), col("€/ora prec.", Row::getEuroOraPrev),
                col("Δ ore", Row::getDeltaOre), col("Δ costo", Row::getDeltaCosto), col("Δ %", Row::getDeltaPct),
                col("Quota %", Row::getQuota), col("FTE", Row::getFte), col("FTE prec.", Row::getFtePrev), col("Δ FTE", Row::getDeltaFte)
        ));
    }

    private TreeTableColumn<Row, String> col(String title, java.util.function.Function<Row, String> fmt) {
        TreeTableColumn<Row, String> c = new TreeTableColumn<>(title);
        c.setCellValueFactory(cd -> new javafx.beans.property.ReadOnlyStringWrapper(fmt.apply(cd.getValue().getValue())));
        c.setPrefWidth(95);
        return c;
    }

    private List<CostoRecord> filtered(String year, List<String> months) {
        if (year == null) return List.of();
        String io = funzioneBox.getValue();
        String tip = tipoBox.getValue();
        List<CostoRecord> out = new ArrayList<>();
        for (String m : months) {
            for (CostoRecord r : store.flat(year, m,
                    (tip != null && !tip.startsWith("Tutte")) ? tip : null,
                    (io != null && !io.startsWith("Tutte")) ? io : null)) {
                out.add(r);
            }
        }
        return out;
    }

    public void render() {
        if (currentYear == null) return;
        String da = daBox.getValue(), a = aBox.getValue();
        List<String> allMonths = store.availMonths(currentYear);
        int lo = da != null ? allMonths.indexOf(da) : 0;
        int hi = a != null ? allMonths.indexOf(a) : allMonths.size() - 1;
        if (lo > hi) { int t = lo; lo = hi; hi = t; }
        List<String> months = lo >= 0 && hi >= 0 ? allMonths.subList(Math.max(0, lo), Math.min(allMonths.size(), hi + 1)) : allMonths;

        List<CostoRecord> curList = filtered(currentYear, months);
        List<String> prevMonthsAvail = previousYear != null
                ? months.stream().filter(m -> store.raw.containsKey(previousYear) && store.raw.get(previousYear).containsKey(m)).toList()
                : List.of();
        List<CostoRecord> prevList = filtered(previousYear, prevMonthsAvail);
        boolean hasPrev = !prevList.isEmpty();

        Tally curTot = CalcUtils.tally(curList);
        Tally prevTot = CalcUtils.tally(prevList);

        kpiRow.getChildren().setAll(
                new KpiCard("Costo effettivo " + currentYear, CalcUtils.eur(curTot.costo), null),
                new KpiCard("Ore effettive", CalcUtils.num0(curTot.ore), null),
                new KpiCard("FTE", CalcUtils.fte1(curTot.fte), null),
                hasPrev ? new KpiCard("Δ ore vs " + previousYear, (curTot.ore - prevTot.ore >= 0 ? "+" : "") + CalcUtils.num0(curTot.ore - prevTot.ore), null)
                        : new KpiCard("Δ ore vs " + (previousYear != null ? previousYear : "anno prec."), "n/d", null),
                hasPrev ? new KpiCard("Δ FTE vs " + previousYear, (curTot.fte - prevTot.fte >= 0 ? "+" : "−") + CalcUtils.fte1(Math.abs(curTot.fte - prevTot.fte)), null)
                        : new KpiCard("Δ FTE", "n/d", null)
        );
        noteLabel.setText(hasPrev
                ? "✅ Confronto " + previousYear + "–" + currentYear + " attivo per il periodo selezionato."
                : "⚠️ Per il periodo selezionato mancano dati " + (previousYear != null ? previousYear : "dell'anno precedente") + ": le colonne \"prec.\"/Δ mostrano \"n/d\".");

        List<Function<CostoRecord, String>> keyFns = List.of(r -> r.io, r -> r.agg, r -> r.lav, r -> r.cdc);
        TreeItem<Row> root = new TreeItem<>();
        buildLevel(root, curList, prevList, keyFns, 0, curTot.costo, hasPrev);
        table.setRoot(root);
    }

    private void buildLevel(TreeItem<Row> parent, List<CostoRecord> curList, List<CostoRecord> prevList,
                             List<Function<CostoRecord, String>> keyFns, int depth, double totCostoCur, boolean hasPrev) {
        if (depth >= keyFns.size()) return;
        Function<CostoRecord, String> keyFn = keyFns.get(depth);
        Map<String, Tally> curGroups = CalcUtils.groupTally(curList, keyFn);
        Map<String, List<CostoRecord>> curByKey = groupList(curList, keyFn);
        Map<String, List<CostoRecord>> prevByKey = groupList(prevList, keyFn);
        Set<String> allKeys = new LinkedHashSet<>();
        for (var e : CalcUtils.sortByCostoDesc(curGroups)) allKeys.add(e.getKey());
        for (String k : prevByKey.keySet()) allKeys.add(k);

        List<String> ordered = new ArrayList<>(allKeys);
        ordered.sort((k1, k2) -> {
            double c1 = curGroups.containsKey(k1) ? curGroups.get(k1).costo : -1;
            double c2 = curGroups.containsKey(k2) ? curGroups.get(k2).costo : -1;
            return Double.compare(c2, c1);
        });

        for (String key : ordered) {
            List<CostoRecord> curSub = curByKey.getOrDefault(key, List.of());
            List<CostoRecord> prevSub = prevByKey.getOrDefault(key, List.of());
            Tally curT = CalcUtils.tally(curSub);
            Tally prevT = CalcUtils.tally(prevSub);
            TreeItem<Row> item = new TreeItem<>(new Row(key, curT, prevT, hasPrev, totCostoCur));
            buildLevel(item, curSub, prevSub, keyFns, depth + 1, totCostoCur, hasPrev);
            parent.getChildren().add(item);
        }
    }

    private Map<String, List<CostoRecord>> groupList(List<CostoRecord> list, Function<CostoRecord, String> keyFn) {
        Map<String, List<CostoRecord>> m = new LinkedHashMap<>();
        for (CostoRecord r : list) m.computeIfAbsent(keyFn.apply(r), k -> new ArrayList<>()).add(r);
        return m;
    }

    private void export() {
        FileChooser chooser = new FileChooser();
        chooser.setTitle("Esporta confronto anno su anno");
        chooser.setInitialFileName("Confronto_" + currentYear + (previousYear != null ? "_vs_" + previousYear : "") + ".xlsx");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("Excel", "*.xlsx"));
        File file = chooser.showSaveDialog(getScene().getWindow());
        if (file == null) return;
        try {
            XlsxWriter w = new XlsxWriter();
            w.addRow(XlsxWriter.Cell.bold("Bottega Norris — Confronto anno su anno"));
            w.addRow("Periodo: " + daBox.getValue() + " – " + aBox.getValue() + " " + currentYear);
            w.addRow();
            w.addHeaderRow("Funzione › Struttura › Reparto › CdC", "Ore " + currentYear, "Costo " + currentYear,
                    "Ore " + previousYear, "Costo " + previousYear, "Δ costo", "Δ %");
            writeRowsRecursive(w, table.getRoot());
            w.writeTo(file);
            new Alert(Alert.AlertType.INFORMATION, "Esportato in " + file.getName()).showAndWait();
        } catch (IOException ex) {
            new Alert(Alert.AlertType.ERROR, "Errore nell'esportazione: " + ex.getMessage()).showAndWait();
        }
    }

    private void writeRowsRecursive(XlsxWriter w, TreeItem<Row> item) {
        for (TreeItem<Row> child : item.getChildren()) {
            Row r = child.getValue();
            w.addRow(r.label, r.cur.ore, r.cur.costo, r.hasPrev ? r.prev.ore : "n/d", r.hasPrev ? r.prev.costo : "n/d",
                    r.hasPrev ? (r.cur.costo - r.prev.costo) : "n/d", r.getDeltaPct());
            writeRowsRecursive(w, child);
        }
    }
}
