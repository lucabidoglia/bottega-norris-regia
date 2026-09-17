package it.bottenorris.regia.util;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.*;

/**
 * Scrittore .xlsx minimale, senza dipendenze esterne (nessuna Apache POI):
 * stessa filosofia del generatore _zip/_sheet/_STYLES scritto a mano in
 * js/yoy.js, tradotta in Java con java.util.zip. Un solo foglio, celle
 * testo o numero, intestazione in grassetto.
 */
public class XlsxWriter {

    public record Cell(Object value, boolean bold) {
        public static Cell of(Object v) { return new Cell(v, false); }
        public static Cell bold(Object v) { return new Cell(v, true); }
    }

    private final List<List<Cell>> rows = new ArrayList<>();

    public void addRow(List<Cell> row) { rows.add(row); }

    public void addRow(Object... values) {
        List<Cell> r = new ArrayList<>();
        for (Object v : values) r.add(Cell.of(v));
        rows.add(r);
    }

    public void addHeaderRow(Object... values) {
        List<Cell> r = new ArrayList<>();
        for (Object v : values) r.add(Cell.bold(v));
        rows.add(r);
    }

    private static String colRef(int i) {
        StringBuilder sb = new StringBuilder();
        i++;
        while (i > 0) { int rem = (i - 1) % 26; sb.insert(0, (char) ('A' + rem)); i = (i - 1) / 26; }
        return sb.toString();
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String buildSheetXml() {
        StringBuilder x = new StringBuilder();
        x.append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>")
         .append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">")
         .append("<sheetData>");
        for (int ri = 0; ri < rows.size(); ri++) {
            x.append("<row r=\"").append(ri + 1).append("\">");
            List<Cell> row = rows.get(ri);
            for (int ci = 0; ci < row.size(); ci++) {
                Cell c = row.get(ci);
                if (c == null || c.value() == null) continue;
                String ref = colRef(ci) + (ri + 1);
                String s = c.bold() ? " s=\"1\"" : "";
                if (c.value() instanceof Number n) {
                    x.append("<c r=\"").append(ref).append("\"").append(s).append("><v>").append(n).append("</v></c>");
                } else {
                    x.append("<c r=\"").append(ref).append("\"").append(s).append(" t=\"inlineStr\"><is><t xml:space=\"preserve\">")
                     .append(esc(String.valueOf(c.value()))).append("</t></is></c>");
                }
            }
            x.append("</row>");
        }
        x.append("</sheetData></worksheet>");
        return x.toString();
    }

    private static final String CONTENT_TYPES = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
            "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
            "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
            "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
            "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
            "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>" +
            "</Types>";
    private static final String RELS = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
            "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
            "</Relationships>";
    private static final String WORKBOOK = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
            "<sheets><sheet name=\"Export\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>";
    private static final String WORKBOOK_RELS = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
            "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>" +
            "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>" +
            "</Relationships>";
    private static final String STYLES = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
            "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
            "<fonts count=\"2\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font><font><b/><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts>" +
            "<fills count=\"1\"><fill><patternFill patternType=\"none\"/></fill></fills>" +
            "<borders count=\"1\"><border/></borders>" +
            "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>" +
            "<cellXfs count=\"2\">" +
            "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>" +
            "<xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\"/>" +
            "</cellXfs>" +
            "<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>" +
            "</styleSheet>";

    public byte[] toBytes() throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(bos)) {
            putEntry(zip, "[Content_Types].xml", CONTENT_TYPES);
            putEntry(zip, "_rels/.rels", RELS);
            putEntry(zip, "xl/workbook.xml", WORKBOOK);
            putEntry(zip, "xl/_rels/workbook.xml.rels", WORKBOOK_RELS);
            putEntry(zip, "xl/styles.xml", STYLES);
            putEntry(zip, "xl/worksheets/sheet1.xml", buildSheetXml());
        }
        return bos.toByteArray();
    }

    private void putEntry(ZipOutputStream zip, String name, String content) throws IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    public void writeTo(File file) throws IOException {
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(toBytes());
        }
    }
}
