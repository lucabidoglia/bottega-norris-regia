package it.bottenorris.regia.util;

import java.util.*;

/**
 * Parser JSON minimale, senza dipendenze esterne (niente Jackson): l'app
 * desktop dipende solo da JavaFX + JDK standard, il che la rende un modulo
 * Java pulito (module-info.java) e impacchettabile con jpackage/jlink senza
 * i problemi dei "moduli automatici" che Jackson introdurrebbe.
 *
 * Produce alberi generici: Map&lt;String,Object&gt;, List&lt;Object&gt;,
 * String, Double, Boolean, null. Le classi in model/ leggono da queste
 * mappe con getters di comodo (vedi Json.str/num/bool/list/map qui sotto).
 */
public final class Json {
    private final String s;
    private int i;

    private Json(String s) { this.s = s; }

    public static Object parse(String text) {
        Json p = new Json(text);
        p.skipWs();
        Object v = p.parseValue();
        p.skipWs();
        return v;
    }

    private void skipWs() {
        while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++;
    }

    private Object parseValue() {
        char c = s.charAt(i);
        return switch (c) {
            case '{' -> parseObject();
            case '[' -> parseArray();
            case '"' -> parseString();
            case 't' -> { i += 4; yield Boolean.TRUE; }
            case 'f' -> { i += 5; yield Boolean.FALSE; }
            case 'n' -> { i += 4; yield null; }
            default -> parseNumber();
        };
    }

    private Map<String, Object> parseObject() {
        Map<String, Object> m = new LinkedHashMap<>();
        i++; // {
        skipWs();
        if (s.charAt(i) == '}') { i++; return m; }
        while (true) {
            skipWs();
            String key = parseString();
            skipWs();
            i++; // :
            skipWs();
            Object val = parseValue();
            m.put(key, val);
            skipWs();
            char c = s.charAt(i++);
            if (c == '}') break;
            // else ',': continue
        }
        return m;
    }

    private List<Object> parseArray() {
        List<Object> l = new ArrayList<>();
        i++; // [
        skipWs();
        if (s.charAt(i) == ']') { i++; return l; }
        while (true) {
            skipWs();
            l.add(parseValue());
            skipWs();
            char c = s.charAt(i++);
            if (c == ']') break;
        }
        return l;
    }

    private String parseString() {
        StringBuilder sb = new StringBuilder();
        i++; // opening quote
        while (true) {
            char c = s.charAt(i++);
            if (c == '"') break;
            if (c == '\\') {
                char e = s.charAt(i++);
                switch (e) {
                    case '"' -> sb.append('"');
                    case '\\' -> sb.append('\\');
                    case '/' -> sb.append('/');
                    case 'b' -> sb.append('\b');
                    case 'f' -> sb.append('\f');
                    case 'n' -> sb.append('\n');
                    case 'r' -> sb.append('\r');
                    case 't' -> sb.append('\t');
                    case 'u' -> { sb.append((char) Integer.parseInt(s.substring(i, i + 4), 16)); i += 4; }
                    default -> sb.append(e);
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private Double parseNumber() {
        int start = i;
        while (i < s.length() && "-+.eE0123456789".indexOf(s.charAt(i)) >= 0) i++;
        return Double.parseDouble(s.substring(start, i));
    }

    // ---- accessor helpers per leggere dagli alberi generici ----

    @SuppressWarnings("unchecked")
    public static Map<String, Object> map(Object o) { return o == null ? Map.of() : (Map<String, Object>) o; }

    @SuppressWarnings("unchecked")
    public static List<Object> list(Object o) { return o == null ? List.of() : (List<Object>) o; }

    public static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : String.valueOf(v);
    }

    public static String str(Map<String, Object> m, String key, String dflt) {
        String v = str(m, key);
        return v == null ? dflt : v;
    }

    public static double num(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return 0;
        if (v instanceof Number n) return n.doubleValue();
        return Double.parseDouble(String.valueOf(v));
    }

    public static Double numOrNull(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        if (v instanceof Number n) return n.doubleValue();
        return Double.parseDouble(String.valueOf(v));
    }

    public static boolean bool(Map<String, Object> m, String key, boolean dflt) {
        Object v = m.get(key);
        return v == null ? dflt : (Boolean) v;
    }
}
