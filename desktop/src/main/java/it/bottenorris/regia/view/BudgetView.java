package it.bottenorris.regia.view;

import it.bottenorris.regia.model.DataStore;
import it.bottenorris.regia.util.BudgetEngine;
import it.bottenorris.regia.util.BudgetEngine.*;
import it.bottenorris.regia.util.CalcUtils;
import it.bottenorris.regia.view.components.KpiCard;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.chart.*;
import javafx.scene.control.*;
import javafx.scene.control.cell.TextFieldTableCell;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import javafx.scene.text.Text;
import javafx.util.StringConverter;

import java.util.*;

/**
 * Vista "Budget — Mastro Venturo": scenari, leve globali, leve per funzione
 * (assenteismo/turnover), traiettoria e proiezione a 4 anni. Porta della UI
 * di budget.js/budget.html; il motore di calcolo è in {@link BudgetEngine}
 * (stesse formule, stessa calibrazione CAL).
 *
 * Semplificazioni rispetto alla web app: i callout esplicativi al passaggio
 * del mouse e il dialogo "Ponte" dettagliato non sono stati riportati 1:1
 * (qui il ponte per funzione/anno è mostrato in una finestra a comparsa più
 * semplice); tutta la logica di calcolo è invece identica.
 */
public class BudgetView extends VBox {

    private final DataStore store;
    private BudgetEngine.Base base;
    private Levers levers;
    private final Map<String, FuncState> fx = new LinkedHashMap<>();
    private final Map<String, Double> necFteOverride = new LinkedHashMap<>();
    private Model model;
    private String scenario = "centrale";
    private String metricTab = "cost";

    private final HBox kpiRow = new HBox(12);
    private final LineChart<String, Number> trendChart;
    private final BarChart<Number, String> funcChart;
    private final TableView<String[]> gridTable = new TableView<>();
    private final TableView<FuncRow> funcTable = new TableView<>();
    private final Label baseNote = new Label();

    public BudgetView(DataStore store) {
        this.store = store;
        setSpacing(16);
        setPadding(new Insets(24));

        Text title = new Text("Budget del costo del lavoro — Mastro Venturo");
        title.getStyleClass().add("view-title");
        Text lede = new Text("Motore di proiezione a 4 anni per funzione, sotto scenari e leve modificabili. Ogni euro è tracciabile nel ponte (Organico, Dinamica base, ISTAT, Turnover, Copertura assenza, Una tantum).");
        lede.getStyleClass().add("lede"); lede.setWrappingWidth(760);

        base = BudgetEngine.computeBase(store);
        if (base.annoBase == 0) {
            getChildren().addAll(title, lede, new Label("Nessun dato disponibile."));
            trendChart = null; funcChart = null;
            return;
        }
        levers = new Levers(BudgetEngine.SCENARI.get(scenario));

        ToggleGroup scenGroup = new ToggleGroup();
        HBox scenBox = new HBox(8);
        for (String s : List.of("prudente", "centrale", "teso")) {
            ToggleButton tb = new ToggleButton(cap(s));
            tb.setToggleGroup(scenGroup);
            tb.setSelected(s.equals(scenario));
            tb.getStyleClass().add("bn-btn");
            tb.setOnAction(e -> { scenario = s; levers = new Levers(BudgetEngine.SCENARI.get(s)); render(); });
            scenBox.getChildren().add(tb);
        }

        ToggleGroup metricGroup = new ToggleGroup();
        HBox metricBox = new HBox(8);
        for (var e : Map.of("cost", "Costo del lavoro", "over", "Straordinari", "abs", "Assenteismo",
                "prod", "Produttività ore", "ore", "Fabbisogno ore").entrySet()) {
            // Map iteration order isn't fixed; build in fixed order instead below.
        }
        String[][] tabs = {{"cost", "Costo del lavoro"}, {"over", "Importo straordinari"}, {"abs", "Tasso di assenza"},
                {"prod", "Costo per ora resa"}, {"ore", "Fabbisogno ore"}};
        for (String[] t : tabs) {
            ToggleButton tb = new ToggleButton(t[1]);
            tb.setToggleGroup(metricGroup);
            tb.setSelected(t[0].equals(metricTab));
            tb.getStyleClass().add("bn-btn");
            tb.setOnAction(e -> { metricTab = t[0]; render(); });
            metricBox.getChildren().add(tb);
        }

        GridPaneLevers leverPanel = new GridPaneLevers();

        trendChart = new LineChart<>(new CategoryAxis(), new NumberAxis());
        trendChart.setTitle("Traiettoria");
        trendChart.setPrefHeight(280);
        trendChart.setLegendVisible(false);

        funcChart = new BarChart<>(new NumberAxis(), new CategoryAxis());
        funcChart.setTitle("Per funzione (anno successivo)");
        funcChart.setPrefHeight(320);
        funcChart.setLegendVisible(false);

        VBox charts = new VBox(16,
                panel("Traiettoria", trendChart),
                panel("Per funzione", funcChart));

        buildGridTable();
        buildFuncTable();

        baseNote.getStyleClass().add("lede");
        baseNote.setWrapText(true);

        VBox.setVgrow(charts, Priority.NEVER);

        getChildren().addAll(title, lede,
                labeledRow("Scenario", scenBox),
                leverPanel,
                labeledRow("Vista", metricBox),
                kpiRow, charts,
                panel("Proiezione anno per anno", gridTable),
                panel("Leve per funzione (assenteismo / turnover)", funcTable),
                baseNote);

        render();
    }

    private static String cap(String s) { return s.substring(0, 1).toUpperCase() + s.substring(1); }

    private VBox labeledRow(String label, javafx.scene.Node content) {
        Label l = new Label(label.toUpperCase());
        l.getStyleClass().add("label-caps");
        return new VBox(6, l, content);
    }

    private VBox panel(String title, javafx.scene.Node content) {
        Label t = new Label(title);
        t.getStyleClass().add("panel-title");
        VBox box = new VBox(10, t, content);
        box.getStyleClass().add("panel");
        return box;
    }

    /** Pannello delle 8 leve globali, con Spinner collegati allo stato "levers". */
    private class GridPaneLevers extends VBox {
        GridPaneLevers() {
            setSpacing(8);
            HBox row1 = new HBox(14), row2 = new HBox(14);
            row1.getChildren().addAll(
                    spinner("CCNL nazionale (%/anno)", () -> levers.ccnl, v -> levers.ccnl = v),
                    spinner("Integrativo (%/anno)", () -> levers.integ, v -> levers.integ = v),
                    spinner("ISTAT/IPCA (%/anno)", () -> levers.istat, v -> levers.istat = v),
                    spinner("Scatti anzianità (%/anno)", () -> levers.scatti, v -> levers.scatti = v));
            row2.getChildren().addAll(
                    spinner("Organico (%/anno)", () -> levers.organico, v -> levers.organico = v),
                    spinner("Sconto neoassunto (%)", () -> levers.sconto, v -> levers.sconto = v),
                    spinner("Costo copertura (%)", () -> levers.coper, v -> levers.coper = v),
                    spinner("Una tantum turnover (€)", () -> levers.unatantum, v -> levers.unatantum = v));
            getChildren().addAll(new Label("LEVE GLOBALI") {{ getStyleClass().add("label-caps"); }}, row1, row2);
        }

        VBox spinner(String label, java.util.function.Supplier<Double> getter, java.util.function.Consumer<Double> setter) {
            Label l = new Label(label);
            l.getStyleClass().add("label-caps");
            l.setWrapText(true);
            l.setMaxWidth(150);
            Spinner<Double> sp = new Spinner<>(-20.0, 100000.0, getter.get(), 0.1);
            sp.setEditable(true);
            sp.setPrefWidth(110);
            sp.valueProperty().addListener((o, a, b) -> { setter.accept(b); render(); });
            return new VBox(4, l, sp);
        }
    }

    private void buildGridTable() {
        gridTable.setPrefHeight(220);
        gridTable.setEditable(false);
    }

    static class FuncRow {
        String funzione;
        double fte, costoBase, costo27, costo30, deltaPct;
        double ass, turn;
    }

    private void buildFuncTable() {
        funcTable.setPrefHeight(360);
        funcTable.setEditable(true);
        TableColumn<FuncRow, String> cF = new TableColumn<>("Funzione");
        cF.setCellValueFactory(d -> new SimpleStringProperty(d.getValue().funzione));
        cF.setPrefWidth(220);
        TableColumn<FuncRow, String> cFte = readonlyCol("FTE base", r -> CalcUtils.fte1(r.fte));
        TableColumn<FuncRow, String> cBase = readonlyCol("Costo base", r -> CalcUtils.eur(r.costoBase));
        TableColumn<FuncRow, String> cAss = editablePctCol("Assenteismo %", r -> r.ass, (r, v) -> {
            fx.computeIfAbsent(r.funzione, k -> new FuncState()).ass = v / 100.0;
        });
        TableColumn<FuncRow, String> cTurn = editablePctCol("Turnover %", r -> r.turn, (r, v) -> {
            fx.computeIfAbsent(r.funzione, k -> new FuncState()).turn = v / 100.0;
        });
        TableColumn<FuncRow, String> cN1 = readonlyCol("Costo anno succ.", r -> CalcUtils.eur(r.costo27));
        TableColumn<FuncRow, String> cN4 = readonlyCol("Costo fine orizz.", r -> CalcUtils.eur(r.costo30));
        TableColumn<FuncRow, String> cD = readonlyCol("Δ su orizzonte", r -> (r.deltaPct >= 0 ? "+" : "") + CalcUtils.pct(r.deltaPct));
        funcTable.getColumns().setAll(List.of(cF, cFte, cBase, cAss, cTurn, cN1, cN4, cD));
    }

    private TableColumn<FuncRow, String> readonlyCol(String title, java.util.function.Function<FuncRow, String> fmt) {
        TableColumn<FuncRow, String> c = new TableColumn<>(title);
        c.setCellValueFactory(d -> new SimpleStringProperty(fmt.apply(d.getValue())));
        c.setPrefWidth(120);
        return c;
    }

    private TableColumn<FuncRow, String> editablePctCol(String title, java.util.function.Function<FuncRow, Double> getter,
                                                          java.util.function.BiConsumer<FuncRow, Double> setter) {
        TableColumn<FuncRow, String> c = new TableColumn<>(title);
        c.setCellValueFactory(d -> new SimpleStringProperty(String.format(Locale.ITALY, "%.1f", getter.apply(d.getValue()))));
        c.setPrefWidth(120);
        c.setCellFactory(TextFieldTableCell.forTableColumn(new StringConverter<String>() {
            @Override public String toString(String s) { return s; }
            @Override public String fromString(String s) { return s; }
        }));
        c.setOnEditCommit(ev -> {
            try {
                double v = Double.parseDouble(ev.getNewValue().replace(",", "."));
                setter.accept(ev.getRowValue(), v);
                render();
            } catch (NumberFormatException ignored) { }
        });
        return c;
    }

    public void render() {
        if (base == null || base.annoBase == 0) return;
        model = BudgetEngine.projectAll(base, levers, fx, necFteOverride);
        List<Integer> years = new ArrayList<>(List.of(base.annoBase));
        years.addAll(BudgetEngine.horizon(base));
        int y1 = years.get(1), yLast = years.get(years.size() - 1);
        YearPoint t0 = model.totals.tot.get(base.annoBase);
        YearPoint t1 = model.totals.tot.get(y1);
        YearPoint tN = model.totals.tot.get(yLast);

        // KPI
        kpiRow.getChildren().clear();
        switch (metricTab) {
            case "ore" -> kpiRow.getChildren().addAll(
                    new KpiCard("Fabbisogno " + y1, hh(t1.oreNec), null),
                    new KpiCard("Ordinarie rese " + y1, hh(t1.oreOrdRese), "copertura " + CalcUtils.pct(t1.oreNec != 0 ? t1.oreOrdRese / t1.oreNec : 0)),
                    new KpiCard("Straordinarie " + y1, hh(t1.stra), null),
                    new KpiCard("Maggiorate " + y1, hh(t1.magg), null));
            default -> {
                double v0 = metricValue(t0), v1 = metricValue(t1), vN = metricValue(tN);
                double cagr = (vN > 0 && v0 > 0) ? Math.pow(vN / v0, 1.0 / (yLast - base.annoBase)) - 1 : 0;
                kpiRow.getChildren().addAll(
                        new KpiCard(y1 + " · anno successivo", metricFmt(v1), fmtDelta(v0, v1) + " su " + base.annoBase),
                        new KpiCard(yLast + " · fine orizzonte", metricFmt(vN), fmtDelta(v0, vN) + " su " + base.annoBase),
                        new KpiCard("cost".equals(metricTab) ? "CAGR" : "Base " + base.annoBase,
                                "cost".equals(metricTab) ? CalcUtils.pct(cagr) : metricFmt(v0), null),
                        new KpiCard("FTE " + yLast, CalcUtils.fte1(tN.fte), fmtDeltaFte(t0.fte, tN.fte)));
            }
        }

        // Traiettoria
        trendChart.getData().clear();
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        for (int y : years) series.getData().add(new XYChart.Data<>(String.valueOf(y), metricValueSafe(model.totals.tot.get(y))));
        trendChart.getData().add(series);

        // Per funzione (anno successivo), top 10
        funcChart.getData().clear();
        XYChart.Series<Number, String> fseries = new XYChart.Series<>();
        List<Map.Entry<String, Map<Integer, YearPoint>>> ranked = new ArrayList<>(model.by.entrySet());
        ranked.sort((a, b) -> Double.compare(metricValueSafe(b.getValue().get(y1)), metricValueSafe(a.getValue().get(y1))));
        for (var e : ranked.subList(0, Math.min(10, ranked.size()))) {
            fseries.getData().add(new XYChart.Data<>(metricValueSafe(e.getValue().get(y1)), e.getKey()));
        }
        funcChart.getData().add(fseries);

        // Griglia anno per anno
        gridTable.getColumns().clear();
        gridTable.getItems().clear();
        TableColumn<String[], String> lblCol = new TableColumn<>("Metrica");
        lblCol.setCellValueFactory(d -> new SimpleStringProperty(d.getValue()[0]));
        lblCol.setPrefWidth(220);
        List<TableColumn<String[], ?>> cols = new ArrayList<>();
        cols.add(lblCol);
        for (int i = 0; i < years.size(); i++) {
            int idx = i + 1;
            TableColumn<String[], String> c = new TableColumn<>(years.get(i) + (i == 0 ? " (base)" : ""));
            c.setCellValueFactory(d -> new SimpleStringProperty(d.getValue()[idx]));
            c.setPrefWidth(110);
            cols.add(c);
        }
        gridTable.getColumns().setAll(cols);
        String[][] rows = "ore".equals(metricTab) ? new String[][]{
                {"Fabbisogno (schemi orari)"}, {"Ordinarie rese"}, {"Straordinarie"}, {"Maggiorate"}
        } : new String[][]{
                {"Costo del lavoro"}, {"FTE medio"}, {"Costo per FTE"}, {"Importo straordinari"}, {"Tasso di assenza"}, {"Costo per ora resa"}
        };
        for (String[] rowDef : rows) {
            String[] row = new String[years.size() + 1];
            row[0] = rowDef[0];
            for (int i = 0; i < years.size(); i++) {
                YearPoint yp = model.totals.tot.get(years.get(i));
                row[i + 1] = gridValue(rowDef[0], yp);
            }
            gridTable.getItems().add(row);
        }

        // Tabella per funzione
        funcTable.getItems().clear();
        for (var e : ranked) {
            FuncRow r = new FuncRow();
            r.funzione = e.getKey();
            FuncBase fb = base.funzioni.get(e.getKey());
            r.fte = fb.fte; r.costoBase = fb.costo;
            r.costo27 = e.getValue().get(y1).costo; r.costo30 = e.getValue().get(yLast).costo;
            r.deltaPct = fb.costo != 0 ? (r.costo30 - fb.costo) / fb.costo : 0;
            FuncState s = fx.get(e.getKey());
            r.ass = (s != null ? s.ass : fb.pAss) * 100;
            r.turn = (s != null ? s.turn : fb.turnover) * 100;
            funcTable.getItems().add(r);
        }

        baseNote.setText("Come leggere questa base. I mesi presenti nei costi effettivi sono usati come dato attuale; i mesi mancanti sono stimati dalla media dei mesi disponibili. "
                + "Deriva osservata " + CalcUtils.pct(base.driftOsservato) + " (crescita periodo comune anno precedente → " + base.annoBase + "). "
                + "Voci non ricavabili dai costi effettivi (indennità, non ricorrente, ore contrattuali) non entrano nella proiezione oltre alla calibrazione iniziale.");
    }

    private String gridValue(String metric, YearPoint yp) {
        return switch (metric) {
            case "Costo del lavoro" -> CalcUtils.eur(yp.costo);
            case "FTE medio" -> CalcUtils.fte1(yp.fte);
            case "Costo per FTE" -> CalcUtils.eur(yp.costoFte);
            case "Importo straordinari" -> CalcUtils.eur(yp.impStra);
            case "Tasso di assenza" -> CalcUtils.pct(yp.pAss);
            case "Costo per ora resa" -> CalcUtils.eur2(yp.costoOra);
            case "Fabbisogno (schemi orari)" -> hh(yp.oreNec);
            case "Ordinarie rese" -> hh(yp.oreOrdRese);
            case "Straordinarie" -> hh(yp.stra);
            case "Maggiorate" -> hh(yp.magg);
            default -> "—";
        };
    }

    private double metricValue(YearPoint yp) {
        return switch (metricTab) {
            case "cost" -> yp.costo;
            case "over" -> yp.impStra;
            case "abs" -> yp.pAss;
            case "prod" -> yp.costoOra;
            default -> yp.costo;
        };
    }

    private double metricValueSafe(YearPoint yp) { return yp == null ? 0 : metricValue(yp); }

    private String metricFmt(double v) {
        return switch (metricTab) {
            case "abs" -> CalcUtils.pct(v);
            case "prod" -> CalcUtils.eur2(v);
            default -> CalcUtils.eur(v);
        };
    }

    private String fmtDelta(double v0, double v1) {
        if (v0 == 0) return "—";
        double d = (v1 - v0) / Math.abs(v0);
        return (d >= 0 ? "+" : "−") + CalcUtils.pct(Math.abs(d));
    }

    private String fmtDeltaFte(double v0, double v1) {
        double d = v0 != 0 ? (v1 - v0) / v0 : 0;
        return (d >= 0 ? "+" : "−") + CalcUtils.pct(Math.abs(d));
    }

    private String hh(double v) { return CalcUtils.num0(v) + " h"; }
}
