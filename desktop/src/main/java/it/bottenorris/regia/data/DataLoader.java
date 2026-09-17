package it.bottenorris.regia.data;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import it.bottenorris.regia.model.*;

import java.io.*;
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
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static Path appDataDir() {
        String home = System.getProperty("user.home");
        Path dir = Paths.get(home, "Library", "Application Support", "BottegaNorrisRegia", "data");
        try { Files.createDirectories(dir); } catch (IOException ignored) {}
        return dir;
    }

    private static Path localFile(String name) {
        return appDataDir().resolve(name + ".json");
    }

    /** true se esiste un override locale per quella chiave ("raw"/"ferie"/"ds"). */
    public static boolean hasLocalOverride(String key) {
        return Files.exists(localFile(key));
    }

    public static boolean hasAnyOverride() {
        return hasLocalOverride("raw") || hasLocalOverride("ferie") || hasLocalOverride("ds");
    }

    /** Salva il file scelto dall'utente come override locale persistente. */
    public static void saveOverride(String key, Path sourceFile) throws IOException {
        Files.copy(sourceFile, localFile(key), StandardCopyOption.REPLACE_EXISTING);
    }

    public static void clearOverrides() {
        for (String key : List.of("raw", "ferie", "ds")) {
            try { Files.deleteIfExists(localFile(key)); } catch (IOException ignored) {}
        }
    }

    /** Carica lo stato completo: override locali se presenti, altrimenti dati demo incorporati. */
    public static DataStore load() throws IOException {
        DataStore store = new DataStore();
        loadRaw(store);
        loadFerie(store);
        loadDs(store);
        return store;
    }

    private static InputStream openRaw(String key) throws IOException {
        Path local = localFile(key);
        if (Files.exists(local)) return Files.newInputStream(local);
        return DataLoader.class.getResourceAsStream("/demo/" + key + ".json");
    }

    @SuppressWarnings("unchecked")
    private static void loadRaw(DataStore store) throws IOException {
        try (InputStream in = openRaw("raw")) {
            Map<String, Map<String, List<CostoRecord>>> parsed = MAPPER.readValue(in,
                    new TypeReference<Map<String, Map<String, List<CostoRecord>>>>() {});
            store.raw = parsed;
        }
    }

    private static void loadFerie(DataStore store) throws IOException {
        try (InputStream in = openRaw("ferie")) {
            Map<String, Object> parsed = MAPPER.readValue(in, new TypeReference<Map<String, Object>>() {});
            store.ferieAggiornato = String.valueOf(parsed.getOrDefault("aggiornato", ""));
            List<FerieRecord> rows = MAPPER.convertValue(parsed.get("rows"), new TypeReference<List<FerieRecord>>() {});
            store.ferie = rows != null ? rows : new ArrayList<>();
        }
    }

    @SuppressWarnings("unchecked")
    private static void loadDs(DataStore store) throws IOException {
        try (InputStream in = openRaw("ds")) {
            Map<String, Object> parsed = MAPPER.readValue(in, new TypeReference<Map<String, Object>>() {});
            List<String> months = MAPPER.convertValue(parsed.get("months"), new TypeReference<List<String>>() {});
            List<DsRecord> rows = MAPPER.convertValue(parsed.get("rows"), new TypeReference<List<DsRecord>>() {});
            store.dsMonths = months != null ? months : new ArrayList<>();
            store.ds = rows != null ? rows : new ArrayList<>();
        }
    }

    /** Validazione leggera prima di accettare un file come override "raw". */
    public static void validateRawFile(Path file) throws IOException {
        Object parsed = MAPPER.readValue(file.toFile(), Object.class);
        if (!(parsed instanceof Map)) throw new IOException("atteso un oggetto {\"2025\":{\"Gennaio\":[...]}}, trovato: " + parsed.getClass().getSimpleName());
    }

    public static void validateFerieFile(Path file) throws IOException {
        Object parsed = MAPPER.readValue(file.toFile(), Object.class);
        if (!(parsed instanceof Map) || !((Map<?, ?>) parsed).containsKey("rows"))
            throw new IOException("atteso un oggetto {\"aggiornato\":\"...\",\"rows\":[...]}");
    }

    public static void validateDsFile(Path file) throws IOException {
        Object parsed = MAPPER.readValue(file.toFile(), Object.class);
        if (!(parsed instanceof Map) || !((Map<?, ?>) parsed).containsKey("rows"))
            throw new IOException("atteso un oggetto {\"rows\":[...],\"months\":[...]}");
    }
}
