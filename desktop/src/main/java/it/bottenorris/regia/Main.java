package it.bottenorris.regia;

import it.bottenorris.regia.data.DataLoader;
import it.bottenorris.regia.model.DataStore;
import it.bottenorris.regia.view.*;
import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.text.Text;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import java.io.IOException;
import java.nio.file.Path;

/**
 * Punto d'ingresso dell'app desktop. Costruisce lo shell (header + nav a
 * schede) ed esegue il lazy-build delle viste, come activate() in
 * js/shell.js: ogni scheda viene costruita/renderizzata alla prima
 * selezione, non tutte all'avvio.
 */
public class Main extends Application {

    private DataStore store;
    private Label statusLabel;
    private Label countLabel;

    private CostiEffettiviView costiView;
    private FerieView ferieView;
    private AnaliticaView analiticaView;
    private BudgetView budgetView;
    private YoyView yoyView;

    @Override
    public void start(Stage stage) throws Exception {
        store = DataLoader.load();

        BorderPane root = new BorderPane();
        root.setTop(buildHeader(stage));

        TabPane tabs = new TabPane();
        tabs.getStyleClass().add("nav-tabs");
        tabs.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);

        Tab tCosti = new Tab("Costi Effettivi");
        Tab tAnalitica = new Tab("Analitica");
        Tab tBudget = new Tab("Budget");
        Tab tYoy = new Tab("Confronto anno su anno");
        Tab tFerie = new Tab("Ferie residue");
        tabs.getTabs().addAll(tCosti, tAnalitica, tBudget, tYoy, tFerie);

        costiView = new CostiEffettiviView(store);
        costiView.render();
        tCosti.setContent(scrollable(costiView));

        tabs.getSelectionModel().selectedItemProperty().addListener((obs, oldTab, newTab) -> {
            if (newTab == tAnalitica && analiticaView == null) {
                analiticaView = new AnaliticaView(store);
                tAnalitica.setContent(scrollable(analiticaView));
            } else if (newTab == tBudget && budgetView == null) {
                budgetView = new BudgetView(store);
                tBudget.setContent(scrollable(budgetView));
            } else if (newTab == tYoy && yoyView == null) {
                yoyView = new YoyView(store);
                tYoy.setContent(scrollable(yoyView));
            } else if (newTab == tFerie && ferieView == null) {
                ferieView = new FerieView(store);
                tFerie.setContent(scrollable(ferieView));
            }
        });

        root.setCenter(tabs);

        Scene scene = new Scene(root, 1280, 860);
        scene.getStylesheets().add(getClass().getResource("/css/theme.css").toExternalForm());
        stage.setTitle("Bottega Norris — Regia del costo del lavoro");
        stage.setScene(scene);
        stage.show();

        updateStatus();
    }

    private ScrollPane scrollable(javafx.scene.Node n) {
        ScrollPane sp = new ScrollPane(n);
        sp.setFitToWidth(true);
        sp.setStyle("-fx-background-color: transparent;");
        return sp;
    }

    private VBox buildHeader(Stage stage) {
        VBox header = new VBox(10);
        header.getStyleClass().add("header-bar");

        Text brand = new Text("Bottega Norris · Regia del costo del lavoro");
        brand.getStyleClass().add("brand-title");
        Text sub = new Text("Fonte unica: Costi Effettivi · CCNL Cooperative Sociali 2023-2025");
        sub.getStyleClass().add("brand-sub");
        VBox titleBox = new VBox(2, brand, sub);

        countLabel = new Label();
        countLabel.getStyleClass().add("src-chip");

        HBox top = new HBox(20, titleBox);
        HBox.setHgrow(titleBox, Priority.ALWAYS);
        top.getChildren().add(countLabel);
        top.setAlignment(Pos.CENTER_LEFT);

        statusLabel = new Label();
        statusLabel.getStyleClass().add("bn-status");

        Button btnRaw = dataButton("Carica costi effettivi");
        Button btnFerie = dataButton("Carica ferie");
        Button btnDs = dataButton("Carica dati Analitica");
        Button btnReset = dataButton("Ripristina demo");

        btnRaw.setOnAction(e -> loadFile(stage, "raw", "Costi effettivi (JSON)"));
        btnFerie.setOnAction(e -> loadFile(stage, "ferie", "Ferie residue (JSON)"));
        btnDs.setOnAction(e -> loadFile(stage, "ds", "Dati Analitica (JSON)"));
        btnReset.setOnAction(e -> resetDemo());

        HBox dataBar = new HBox(10, statusLabel, btnRaw, btnFerie, btnDs, btnReset);
        dataBar.setAlignment(Pos.CENTER_LEFT);

        header.getChildren().addAll(top, dataBar);
        header.setPadding(new Insets(12, 20, 12, 20));
        return header;
    }

    private Button dataButton(String text) {
        Button b = new Button(text);
        b.getStyleClass().add("bn-btn");
        return b;
    }

    private void loadFile(Stage stage, String key, String description) {
        FileChooser chooser = new FileChooser();
        chooser.setTitle("Scegli il file " + description);
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("JSON", "*.json"));
        var file = chooser.showOpenDialog(stage);
        if (file == null) return;
        try {
            Path path = file.toPath();
            switch (key) {
                case "raw" -> DataLoader.validateRawFile(path);
                case "ferie" -> DataLoader.validateFerieFile(path);
                case "ds" -> DataLoader.validateDsFile(path);
            }
            DataLoader.saveOverride(key, path);
            reloadDataAndRefresh();
        } catch (IOException ex) {
            Alert alert = new Alert(Alert.AlertType.ERROR, "File non valido per \"" + key + "\": " + ex.getMessage());
            alert.showAndWait();
        }
    }

    private void resetDemo() {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
                "Ripristinare i dati demo? I dati caricati localmente verranno rimossi (nessun file esterno viene toccato).",
                ButtonType.OK, ButtonType.CANCEL);
        confirm.showAndWait().ifPresent(bt -> {
            if (bt == ButtonType.OK) {
                DataLoader.clearOverrides();
                reloadDataAndRefresh();
            }
        });
    }

    private void reloadDataAndRefresh() {
        try {
            DataStore fresh = DataLoader.load();
            store.raw = fresh.raw;
            store.ferie = fresh.ferie;
            store.ferieAggiornato = fresh.ferieAggiornato;
            store.ds = fresh.ds;
            store.dsMonths = fresh.dsMonths;
            costiView.render();
            if (ferieView != null) ferieView.render();
            if (analiticaView != null) analiticaView.render();
            if (budgetView != null) budgetView.render();
            if (yoyView != null) yoyView.render();
            updateStatus();
        } catch (IOException ex) {
            new Alert(Alert.AlertType.ERROR, "Errore nel ricaricare i dati: " + ex.getMessage()).showAndWait();
        }
    }

    private void updateStatus() {
        countLabel.setText(store.totalRecords() + " record · " + String.join(" · ", store.years()));
        boolean loaded = DataLoader.hasAnyOverride();
        statusLabel.setText(loaded ? "dati locali caricati" : "dati demo");
        statusLabel.getStyleClass().removeAll("loaded");
        if (loaded) statusLabel.getStyleClass().add("loaded");
    }

    public static void main(String[] args) {
        launch(args);
    }
}
