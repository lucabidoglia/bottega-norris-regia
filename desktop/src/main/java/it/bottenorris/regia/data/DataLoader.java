package it.bottenorris.regia.data;

import it.bottenorris.regia.model.*;
import it.bottenorris.regia.util.Json;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

/**
 * Carica i dataset (demo o locali) nello stesso spirito del js/data-loader.js
 * della web app: nessuna rete, tutto locale. Qui, invece di IndexedDB nel
 * browser, i dati caricati dall'utente vengono copiati in una cartella dati
 * dell'applicazione (~/Library/Application Support/BottegaNorrisRegia/data)
 * cosi' da essere ritrovati al prossimo avvio, finche' non si preme
 * "Ripristina demo".
 */
public class DataLoader {

    public static Path appDataDir() {
        String home = System.getProperty("user.home");
        Path dir = Paths.get(home, "Library", "Application Support", "BottegaNorrisRegia", "data");
        try { Files.createDirectories(dir); } catch (IOException ignored) {}
        return dir;
    }

    private static Path localFile(String name) {
        return appDataDir().resolve(name + ".json");
    }

    public static boolean hasLocalOverride(String key) {
        return Files.exists(localFile(key));
    }

    public static boolean hasAnyOverride() {
        return hasLocalOverride("raw") || hasLocalOverride("ferie") || hasLocalOverride("ds");
    }

    public static void saveOverride(String key, Path sourceFile) throws IOException {
        Files.copy(sourceFile, localFile(key), StandardCopyOption.REPLACE_EXISTING);
    }

    public static void clearOverrides() {
        for (String key : List.of("raw", "ferie", "ds")) {
            try { Files.deleteIfExists(localFile(key)); } catch (IOException ignored) {}
        }
    }

    public static DataStore load() throws IOException {
        DataStore store = new DataStore();
        loadRaw(store);
        loadFerie(store);
        loadDs(store);
        return store;
    }

    private static String readAll(String key) throws IOException {
        Path local = localFile(key);
        if (Files.exists(local)) return Files.readString(local, StandardCharsets.UTF_8);
        try (InputStream in = DataLoader.class.getResourceAsStream("/demo/" + key + ".json")) {
            if (in == null) throw new IOException("risorsa demo mancante: " + key);
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @SuppressWarnings("unchecked")
    private static void loadRaw(DataStore store) throws IOException {
        Map<String, Object> parsed = (Map<String, Object>) Json.parse(readAll("raw"));
        Map<String, Map<String, List<CostoRecord>>> raw = new LinkedHashMap<>();
        for (var yEntry : parsed.entrySet()) {
            Map<String, List<CostoRecord>> months = new LinkedHashMap<>();
            for (var mEntry : Json.map(yEntry.getValue()).entrySet()) {
                List<CostoRecord> rows = new ArrayList<>();
                for (Object rowObj : Json.list(mEntry.getValue())) rows.add(CostoRecord.fromMap(Json.map(rowObj)));
                months.put(mEntry.getKey(), rows);
            }
            raw.put(yEntry.getKey(), months);
        }
        store.raw = raw;
    }

    private static void loadFerie(DataStore store) throws IOException {
        Map<String, Object> parsed = Json.map(Json.parse(readAll("ferie")));
        store.ferieAggiornato = Json.str(parsed, "aggiornato", "");
        List<FerieRecord> rows = new ArrayList<>();
        for (Object rowObj : Json.list(parsed.get("rows"))) rows.add(FerieRecord.fromMap(Json.map(rowObj)));
        store.ferie = rows;
    }

    private static void loadDs(DataStore store) throws IOException {
        Map<String, Object> parsed = Json.map(Json.parse(readAll("ds")));
        List<String> months = new ArrayList<>();
        for (Object o : Json.list(parsed.get("months"))) months.add(String.valueOf(o));
        List<DsRecord> rows = new ArrayList<>();
        for (Object rowObj : Json.list(parsed.get("rows"))) rows.add(DsRecord.fromMap(Json.map(rowObj)));
        store.dsMonths = months;
        store.ds = rows;
    }

    /** Validazione leggera prima di accettare un file come override "raw". */
    public static void validateRawFile(Path file) throws IOException {
        Object parsed = Json.parse(Files.readString(file, StandardCharsets.UTF_8));
        if (!(parsed instanceof Map)) throw new IOException("atteso un oggetto {\"2025\":{\"Gennaio\":[...]}}, trovato un valore diverso");
    }

    public static void validateFerieFile(Path file) throws IOException {
        Object parsed = Json.parse(Files.readString(file, StandardCharsets.UTF_8));
        if (!(parsed instanceof Map) || !((Map<?, ?>) parsed).containsKey("rows"))
            throw new IOException("atteso un oggetto {\"aggiornato\":\"...\",\"rows\":[...]}");
    }

    public static void validateDsFile(Path file) throws IOException {
        Object parsed = Json.parse(Files.readString(file, StandardCharsets.UTF_8));
        if (!(parsed instanceof Map) || !((Map<?, ?>) parsed).containsKey("rows"))
            throw new IOException("atteso un oggetto {\"rows\":[...],\"months\":[...]}");
    }
}
