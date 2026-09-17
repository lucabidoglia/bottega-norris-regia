package it.bottenorris.regia.view;

import it.bottenorris.regia.model.DataStore;
import it.bottenorris.regia.model.FerieRecord;
import it.bottenorris.regia.util.CalcUtils;
import it.bottenorris.regia.view.components.KpiCard;
import javafx.geometry.Insets;
import javafx.scene.control.*;
import javafx.scene.control.cell.TreeItemPropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.text.Text;

import java.util.*;

/**
 * Vista "Ferie residue": tabella gerarchica Funzione -> Struttura
 * riclassificata -> Reparto effettivo -> Centro di costo -> Dipendente,
 * con ricerca. Porta di feInit()/feRender() in js/shell.js.
 */
public class FerieView extends VBox {

    static class Node {
        double ore, val, fruito, resAp;
        Map<String, Node> children = new LinkedHashMap<>();
        boolean leaf;
        String dip;
    }

    public static class Row {
        final String label;
        final int level;
        final Node node;
        final double totVal;
        final boolean isTotal;
        final String context;

        Row(String label, int level, Node node, double totVal, boolean isTotal, String context) {
            this.label = label; this.level = level; this.node = node; this.totVal = totVal;
            this.isTotal = isTotal; this.context = context;
        }

        public String getLabel() { return context != null ? label + "  ·  " + context : label; }
        public String getResAp() { return CalcUtils.num2(node.resAp); }
        public String getOre() { return CalcUtils.num2(node.ore); }
        public String getFruito() { return CalcUtils.num2(node.fruito); }
        public String getVal() { return CalcUtils.eur(node.val); }
        public String getQuota() {
            double q = totVal != 0 ? node.val / totVal : 0;
            return q > 0.0005 ? CalcUtils.pct(q) : "—";
        }
    }

    private final DataStore store;
    private final TextField search = new TextField();
    private final HBox kpiRow = new HBox(12);
    private final TreeTableView<Row> table = new TreeTableView<>();

    public FerieView(DataStore store) {
        this.store = store;
        setSpacing(16);
        setPadding(new Insets(24));
        VBox.setVgrow(table, Priority.ALWAYS);

        Text title = new Text("Gestione ferie residue"); title.getStyleClass().add("view-title");
        Text lede = new Text("Residuo alla data del prospetto, per Funzione › Struttura riclassificata › Reparto effettivo › Centro di costo › Dipendente. Espandi una riga per scendere di livello.");
        lede.getStyleClass().add("lede"); lede.setWrappingWidth(700);

        search.setPromptText("Cerca dipendente per nome o matricola…");
        search.setPrefWidth(380);
        search.textProperty().addListener((o, a, b) -> render());

        buildTable();
        getChildren().addAll(title, lede, kpiRow, search, table);
        render();
    }

    private void buildTable() {
        table.getStyleClass().add("ledger-table");
        table.setShowRoot(false);
        table.setPrefHeight(500);
        TreeTableColumn<Row, String> cLabel = col("Funzione › Struttura › Reparto › CdC › Dipendente", Row::getLabel);
        cLabel.setPrefWidth(360);
        table.getColumns().setAll(List.of(
                cLabel,
                col("Residuo a.p.", Row::getResAp),
                col("Ore residue", Row::getOre),
                col("Fruito anno", Row::getFruito),
                col("Valore residuo", Row::getVal),
                col("Quota %", Row::getQuota)
        ));
    }

    private TreeTableColumn<Row, String> col(String title, java.util.function.Function<Row, String> fmt) {
        TreeTableColumn<Row, String> c = new TreeTableColumn<>(title);
        c.setCellValueFactory(cd -> new javafx.beans.property.ReadOnlyStringWrapper(fmt.apply(cd.getValue().getValue())));
        c.setPrefWidth(110);
        return c;
    }

    private Node tree() {
        Node root = new Node();
        for (FerieRecord r : store.ferie) {
            Node io = root.children.computeIfAbsent(r.io, k -> new Node());
            add(io, r);
            Node agg = io.children.computeIfAbsent(r.agg, k -> new Node());
            add(agg, r);
            Node lav = agg.children.computeIfAbsent(r.lav, k -> new Node());
            add(lav, r);
            Node cdc = lav.children.computeIfAbsent(r.cdc, k -> new Node());
            add(cdc, r);
            Node dip = new Node();
            dip.ore = r.ore; dip.val = r.val; dip.fruito = r.fruito; dip.resAp = r.resAp;
            dip.leaf = true; dip.dip = r.dip;
            cdc.children.put(r.matr, dip);
        }
        return root;
    }

    private void add(Node n, FerieRecord r) {
        n.ore += r.ore; n.val += r.val; n.fruito += r.fruito; n.resAp += r.resAp;
    }

    public void render() {
        Node root = tree();
        double totOre = 0, totVal = 0, totFruito = 0, totResAp = 0;
        for (Node io : root.children.values()) { totOre += io.ore; totVal += io.val; totFruito += io.fruito; totResAp += io.resAp; }
        int nDip = Math.max(1, store.ferie.size());

        kpiRow.getChildren().setAll(
                new KpiCard("Ore residue totali", CalcUtils.num2(totOre), null),
                new KpiCard("Fruito anno totale", CalcUtils.num2(totFruito), "ferie + ex festività fruite"),
                new KpiCard("Media ore / dip.", CalcUtils.num2(totOre / nDip), null),
                new KpiCard("Valore residuo", CalcUtils.eur(totVal), "lordo + contributi + INAIL"),
                new KpiCard("Valore medio / dip.", CalcUtils.eur(totVal / nDip), null),
                new KpiCard("Dipendenti", CalcUtils.num0(store.ferie.size()), null)
        );

        TreeItem<Row> rootItem = new TreeItem<>();
        String q = search.getText() == null ? "" : search.getText().trim().toLowerCase();
        double finalTotVal = totVal;

        if (!q.isEmpty()) {
            List<FerieRecord> matches = store.ferie.stream()
                    .filter(r -> (r.dip != null && r.dip.toLowerCase().contains(q)) || (r.matr != null && r.matr.toLowerCase().contains(q)))
                    .sorted((a, b) -> Double.compare(b.val, a.val))
                    .toList();
            for (FerieRecord r : matches) {
                Node n = new Node();
                n.ore = r.ore; n.val = r.val; n.fruito = r.fruito; n.resAp = r.resAp;
                String ctx = r.io + " › " + r.agg + " › " + r.lav;
                rootItem.getChildren().add(new TreeItem<>(new Row(r.dip, 4, n, finalTotVal, false, ctx)));
            }
        } else {
            for (var eIo : root.children.entrySet()) {
                TreeItem<Row> ioItem = new TreeItem<>(new Row(eIo.getKey(), 0, eIo.getValue(), finalTotVal, false, null));
                for (var eAgg : eIo.getValue().children.entrySet()) {
                    TreeItem<Row> aggItem = new TreeItem<>(new Row(eAgg.getKey(), 1, eAgg.getValue(), finalTotVal, false, null));
                    for (var eLav : eAgg.getValue().children.entrySet()) {
                        TreeItem<Row> lavItem = new TreeItem<>(new Row(eLav.getKey(), 2, eLav.getValue(), finalTotVal, false, null));
                        for (var eCdc : eLav.getValue().children.entrySet()) {
                            TreeItem<Row> cdcItem = new TreeItem<>(new Row(eCdc.getKey(), 3, eCdc.getValue(), finalTotVal, false, null));
                            for (var eDip : eCdc.getValue().children.entrySet()) {
                                cdcItem.getChildren().add(new TreeItem<>(new Row(eDip.getValue().dip, 4, eDip.getValue(), finalTotVal, false, null)));
                            }
                            lavItem.getChildren().add(cdcItem);
                        }
                        aggItem.getChildren().add(lavItem);
                    }
                    ioItem.getChildren().add(aggItem);
                }
                rootItem.getChildren().add(ioItem);
            }
        }
        table.setRoot(rootItem);
    }
}
