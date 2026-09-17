package it.bottenorris.regia.view;

import it.bottenorris.regia.model.DataStore;
import it.bottenorris.regia.model.DsRecord;
import it.bottenorris.regia.util.CalcUtils;
import it.bottenorris.regia.view.components.KpiCard;
import javafx.beans.property.ReadOnlyStringWrapper;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.chart.*;
import javafx.scene.control.*;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.text.Text;

import java.util.*;

/**
 * Vista "Analisi costo del lavoro & ore": KPI, andamento mensile, ripartizione
 * per funzione, tabella di dettaglio e segnalazioni. Porta ridotta ma
 * funzionante di analitica.js: filtri principali (periodo, funzione,
 * tipologia, dipendente), le 4 schede di lettura, due grafici e la tabella.
 *
 * Semplificazioni rispetto alla web app: le "maschere" con fattori editabili
 * per spiegare uno scostamento non sono state riportate (qui il pannello
 * "Segnalazioni" mostra le stesse soglie in forma di lista, senza editor).
 */
public class AnaliticaView extends VBox {

    private final DataStore store;
    private final ComboBox<String> daBox = new ComboBox<>();
    private final ComboBox<String> aBox = new ComboBox<>();
    private final ComboBox<String> funzioneBox = new ComboBox<>();
    private final ComboBox<String> tipoBox = new ComboBox<>();
    private final HBox kpiRow = new HBox(12);
    private final LineChart<String, Number> trendChart;
    private final BarChart<Number, String> funcChart;
    private final TableView<Map.Entry<String, double[]>> detailTable = new TableView<>();
    private final VBox actionBox = new VBox(8);
    private String tab = "cost";
    private final String year;

    // indici nell'array aggregato: costo, ore(eff), straord(stra), impStra, assenza(ass_r+ass_nr+ass_nc), mal, fte
    private static final int I_COSTO = 0, I_EFF = 1, I_STRA = 2, I_IMPSTRA = 3, I_ASS = 4, I_MAL = 5, I_ORD = 6;

    public AnaliticaView(DataStore store) {
        this.store = store;
        setSpacing(16);
        setPadding(new Insets(24));

        Text title = new Text("Analisi costo del lavoro & ore"); title.getStyleClass().add("view-title");
        Text lede = new Text("Costi, straordinari, assenze e produttività, con filtri e drill-down per funzione. Dataset dettagliato (assenze scomposte, malattia).");
        lede.getStyleClass().add("lede"); lede.setWrappingWidth(760);

        List<String> years = new ArrayList<>();
        for (DsRecord r : store.ds) { String y = String.valueOf(r.y); if (!years.contains(y)) years.add(y); }
        Collections.sort(years);
        year = years.isEmpty() ? null : years.get(years.size() - 1);
        List<String> months = year != null ? monthsForYear(year) : List.of();

        daBox.setItems(FXCollections.observableArrayList(months));
        aBox.setItems(FXCollections.observableArrayList(months));
        if (!months.isEmpty()) { daBox.getSelectionModel().selectFirst(); aBox.getSelectionModel().select(months.size() - 1); }

        List<String> funzioni = new ArrayList<>();
        for (DsRecord r : store.ds) if (!funzioni.contains(r.io)) funzioni.add(r.io);
        Collections.sort(funzioni);
        funzioni.add(0, "Tutte le funzioni");
        funzioneBox.setItems(FXCollections.observableArrayList(funzioni));
        funzioneBox.getSelectionModel().selectFirst();

        tipoBox.setItems(FXCollections.observableArrayList("Tutti i rapporti", "Dipendente", "Libero professionista"));
        tipoBox.getSelectionModel().selectFirst();

        ToggleGroup tg = new ToggleGroup();
        HBox tabsBox = new HBox(8);
        for (String[] t : new String[][]{{"cost", "Costo del lavoro & Costo/FTE"}, {"over", "Straordinari & Maggiorazioni"},
                {"abs", "Assenteismo"}, {"prod", "Produttività ore"}}) {
            ToggleButton tb = new ToggleButton(t[1]);
            tb.setToggleGroup(tg);
            tb.setSelected(t[0].equals(tab));
            tb.getStyleClass().add("bn-btn");
            tb.setOnAction(e -> { tab = t[0]; render(); });
            tabsBox.getChildren().add(tb);
        }

        FlowPane controls = new FlowPane(14, 10,
                labeled("Da mese", daBox), labeled("A mese", aBox),
                labeled("Funzione", funzioneBox), labeled("Rapporto", tipoBox));

        trendChart = new LineChart<>(new CategoryAxis(), new NumberAxis());
        trendChart.setLegendVisible(false);
        trendChart.setPrefHeight(260);
        funcChart = new BarChart<>(new NumberAxis(), new CategoryAxis());
        funcChart.setLegendVisible(false);
        funcChart.setPrefHeight(300);

        buildDetailTable();

        VBox charts = new VBox(16, panel("Andamento", trendChart), panel("Per funzione", funcChart));

        getChildren().addAll(title, lede, controls, tabsBox, kpiRow, charts,
                panel("Dettaglio per funzione", detailTable),
                panel("Segnalazioni", actionBox));

        daBox.valueProperty().addListener((o, a, b) -> render());
        aBox.valueProperty().addListener((o, a, b) -> render());
        funzioneBox.valueProperty().addListener((o, a, b) -> render());
        tipoBox.valueProperty().addListener((o, a, b) -> render());

        render();
    }

    private List<String> monthsForYear(String y) {
        List<String> out = new ArrayList<>();
        for (String m : DataStore.MONTHS) {
            int yy = Integer.parseInt(y);
            boolean has = store.ds.stream().anyMatch(r -> r.y == yy && m.equals(r.m));
            if (has) out.add(m);
        }
        return out;
    }

    private VBox labeled(String label, Control control) {
        Label l = new Label(label.toUpperCase()); l.getStyleClass().add("label-caps");
        control.setPrefWidth(170);
        return new VBox(5, l, control);
    }

    private VBox panel(String title, javafx.scene.Node content) {
        Label t = new Label(title); t.getStyleClass().add("panel-title");
        VBox box = new VBox(10, t, content);
        box.getStyleClass().add("panel");
        return box;
    }

    private void buildDetailTable() {
        detailTable.setPrefHeight(280);
        TableColumn<Map.Entry<String, double[]>, String> cF = new TableColumn<>("Funzione");
        cF.setCellValueFactory(d -> new ReadOnlyStringWrapper(d.getValue().getKey()));
        cF.setPrefWidth(220);
        TableColumn<Map.Entry<String, double[]>, String> cCosto = numCol("Costo", a -> CalcUtils.eur(a[I_COSTO]));
        TableColumn<Map.Entry<String, double[]>, String> cOre = numCol("Ore effettive", a -> CalcUtils.num0(a[I_EFF]));
        TableColumn<Map.Entry<String, double[]>, String> cStra = numCol("% straordinario", a -> a[I_ORD] > 0 ? CalcUtils.pct(a[I_STRA] / a[I_ORD]) : "—");
        TableColumn<Map.Entry<String, double[]>, String> cAss = numCol("Ore assenza", a -> CalcUtils.num0(a[I_ASS]));
        TableColumn<Map.Entry<String, double[]>, String> cMal = numCol("Ore malattia", a -> CalcUtils.num0(a[I_MAL]));
        TableColumn<Map.Entry<String, double[]>, String> cProd = numCol("€ / ora", a -> a[I_EFF] > 0 ? CalcUtils.eur2(a[I_COSTO] / a[I_EFF]) : "—");
        detailTable.getColumns().setAll(List.of(cF, cCosto, cOre, cStra, cAss, cMal, cProd));
    }

    private TableColumn<Map.Entry<String, double[]>, String> numCol(String title, java.util.function.Function<double[], String> fmt) {
        TableColumn<Map.Entry<String, double[]>, String> c = new TableColumn<>(title);
        c.setCellValueFactory(d -> new ReadOnlyStringWrapper(fmt.apply(d.getValue().getValue())));
        c.setPrefWidth(120);
        return c;
    }

    private boolean matches(DsRecord r) {
        String io = funzioneBox.getValue();
        if (io != null && !io.startsWith("Tutte") && !io.equals(r.io)) return false;
        String tip = tipoBox.getValue();
        if (tip != null && !tip.startsWith("Tutti") && !tip.equals(r.tip)) return false;
        return true;
    }

    private List<DsRecord> filteredList() {
        if (year == null) return List.of();
        List<String> months = periodMonths();
        int y = Integer.parseInt(year);
        List<DsRecord> out = new ArrayList<>();
        for (DsRecord r : store.ds) if (r.y == y && months.contains(r.m) && matches(r)) out.add(r);
        return out;
    }

    private List<String> periodMonths() {
        List<String> all = monthsForYear(year);
        String da = daBox.getValue(), a = aBox.getValue();
        int lo = da != null ? all.indexOf(da) : 0, hi = a != null ? all.indexOf(a) : all.size() - 1;
        if (lo < 0) lo = 0; if (hi < 0) hi = all.size() - 1;
        if (lo > hi) { int t = lo; lo = hi; hi = t; }
        return all.subList(Math.max(0, lo), Math.min(all.size(), hi + 1));
    }

    /** Somma costo/eff/stra/impStra/assenza/malattia/ord su una lista. */
    private double[] agg(List<DsRecord> list) {
        double[] a = new double[7];
        for (DsRecord r : list) {
            a[I_COSTO] += r.costo; a[I_EFF] += r.eff; a[I_STRA] += r.stra; a[I_IMPSTRA] += r.imp_stra;
            a[I_ASS] += r.ass_r + r.ass_nr + r.ass_nc; a[I_MAL] += r.mal; a[I_ORD] += r.ord;
        }
        return a;
    }

    public void render() {
        if (year == null) return;
        List<DsRecord> list = filteredList();
        double[] tot = agg(list);

        kpiRow.getChildren().clear();
        switch (tab) {
            case "over" -> kpiRow.getChildren().addAll(
                    new KpiCard("Ore straordinario", CalcUtils.num0(tot[I_STRA]), null),
                    new KpiCard("Importo straordinario", CalcUtils.eur(tot[I_IMPSTRA]), null),
                    new KpiCard("Incidenza su ordinarie", tot[I_ORD] > 0 ? CalcUtils.pct(tot[I_STRA] / tot[I_ORD]) : "—", null));
            case "abs" -> kpiRow.getChildren().addAll(
                    new KpiCard("Ore di assenza", CalcUtils.num0(tot[I_ASS]), "retribuita + non retribuita + non computabile"),
                    new KpiCard("Ore di malattia", CalcUtils.num0(tot[I_MAL]), null),
                    new KpiCard("Incidenza assenza su ordinarie", tot[I_ORD] > 0 ? CalcUtils.pct((tot[I_ASS] + tot[I_MAL]) / tot[I_ORD]) : "—", null));
            case "prod" -> kpiRow.getChildren().addAll(
                    new KpiCard("Ore effettive", CalcUtils.num0(tot[I_EFF]), null),
                    new KpiCard("Costo per ora resa", tot[I_EFF] > 0 ? CalcUtils.eur2(tot[I_COSTO] / tot[I_EFF]) : "—", null));
            default -> kpiRow.getChildren().addAll(
                    new KpiCard("Costo del lavoro", CalcUtils.eur(tot[I_COSTO]), null),
                    new KpiCard("Ore effettive", CalcUtils.num0(tot[I_EFF]), null),
                    new KpiCard("Costo medio orario", tot[I_EFF] > 0 ? CalcUtils.eur2(tot[I_COSTO] / tot[I_EFF]) : "—", null));
        }

        // Andamento mensile (per il periodo selezionato)
        trendChart.getData().clear();
        XYChart.Series<String, Number> s = new XYChart.Series<>();
        for (String m : periodMonths()) {
            int y = Integer.parseInt(year);
            List<DsRecord> ml = store.ds.stream().filter(r -> r.y == y && m.equals(r.m) && matches(r)).toList();
            double[] a = agg(ml);
            double v = switch (tab) { case "over" -> a[I_IMPSTRA]; case "abs" -> a[I_ASS] + a[I_MAL]; case "prod" -> a[I_EFF] > 0 ? a[I_COSTO] / a[I_EFF] : 0; default -> a[I_COSTO]; };
            s.getData().add(new XYChart.Data<>(m.substring(0, Math.min(3, m.length())), v));
        }
        trendChart.getData().add(s);

        // Per funzione
        Map<String, double[]> byFunc = new LinkedHashMap<>();
        for (DsRecord r : list) {
            double[] a = byFunc.computeIfAbsent(r.io, k -> new double[7]);
            a[I_COSTO] += r.costo; a[I_EFF] += r.eff; a[I_STRA] += r.stra; a[I_IMPSTRA] += r.imp_stra;
            a[I_ASS] += r.ass_r + r.ass_nr + r.ass_nc; a[I_MAL] += r.mal; a[I_ORD] += r.ord;
        }
        List<Map.Entry<String, double[]>> ranked = new ArrayList<>(byFunc.entrySet());
        ranked.sort((x, y2) -> Double.compare(metricOf(y2.getValue()), metricOf(x.getValue())));

        funcChart.getData().clear();
        XYChart.Series<Number, String> fs = new XYChart.Series<>();
        for (var e : ranked.subList(0, Math.min(10, ranked.size()))) fs.getData().add(new XYChart.Data<>(metricOf(e.getValue()), e.getKey()));
        funcChart.getData().add(fs);

        detailTable.getItems().setAll(ranked);

        // Segnalazioni (soglie semplici, ispirate a actionCost/actionOver/actionAbs/actionProd)
        actionBox.getChildren().clear();
        for (var e : ranked) {
            double[] a = e.getValue();
            String io = e.getKey();
            if (a[I_ORD] > 0 && a[I_STRA] / a[I_ORD] > 0.08) {
                actionBox.getChildren().add(actionLine("alta", io + ": incidenza straordinario " + CalcUtils.pct(a[I_STRA] / a[I_ORD]) + ", sopra l'8%."));
            }
            if (a[I_ORD] > 0 && (a[I_ASS] + a[I_MAL]) / a[I_ORD] > 0.15) {
                actionBox.getChildren().add(actionLine("media", io + ": incidenza assenze " + CalcUtils.pct((a[I_ASS] + a[I_MAL]) / a[I_ORD]) + ", sopra il 15%."));
            }
        }
        if (actionBox.getChildren().isEmpty()) actionBox.getChildren().add(new Label("Nessuna soglia superata nel periodo e nei filtri selezionati."));
    }

    private double metricOf(double[] a) {
        return switch (tab) { case "over" -> a[I_IMPSTRA]; case "abs" -> a[I_ASS] + a[I_MAL]; case "prod" -> a[I_EFF] > 0 ? a[I_COSTO] / a[I_EFF] : 0; default -> a[I_COSTO]; };
    }

    private HBox actionLine(String priority, String text) {
        Label pill = new Label(priority.toUpperCase());
        pill.setStyle("-fx-background-color: " + ("alta".equals(priority) ? "#C25B44" : "#D19A3E") + "; -fx-text-fill: white; -fx-padding: 2 8 2 8; -fx-background-radius: 3; -fx-font-size: 10px; -fx-font-weight: bold;");
        Label t = new Label(text);
        t.getStyleClass().add("lede");
        return new HBox(10, pill, t);
    }
}
