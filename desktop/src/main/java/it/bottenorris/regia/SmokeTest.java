package it.bottenorris.regia;

import it.bottenorris.regia.data.DataLoader;
import it.bottenorris.regia.model.DataStore;
import it.bottenorris.regia.view.*;
import javafx.application.Application;
import javafx.stage.Stage;

/** Verifica temporanea: costruisce e renderizza tutte le viste senza mostrare la finestra, per intercettare eccezioni. */
public class SmokeTest extends Application {
    @Override
    public void start(Stage stage) {
        try {
            DataStore store = DataLoader.load();
            System.out.println("Dati caricati: " + store.totalRecords() + " record, anni=" + store.years());

            CostiEffettiviView costi = new CostiEffettiviView(store);
            costi.render();
            System.out.println("CostiEffettiviView OK");

            FerieView ferie = new FerieView(store);
            ferie.render();
            System.out.println("FerieView OK");

            YoyView yoy = new YoyView(store);
            yoy.render();
            System.out.println("YoyView OK");

            BudgetView budget = new BudgetView(store);
            budget.render();
            System.out.println("BudgetView OK");

            AnaliticaView analitica = new AnaliticaView(store);
            analitica.render();
            System.out.println("AnaliticaView OK");

            System.out.println("SMOKE TEST: TUTTO OK");
        } catch (Throwable t) {
            System.out.println("SMOKE TEST FALLITO:");
            t.printStackTrace();
        } finally {
            javafx.application.Platform.exit();
        }
    }

    public static void main(String[] args) { launch(args); }
}
