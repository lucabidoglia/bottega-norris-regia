package it.bottenorris.regia.view.components;

import javafx.geometry.Insets;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;

/** Una card KPI, equivalente a .kpi nella web app. */
public class KpiCard extends VBox {
    private final Label valueLabel = new Label();
    private final Label subLabel = new Label();

    public KpiCard(String label, String value, String sub) {
        getStyleClass().add("kpi-card");
        setSpacing(6);
        Label lab = new Label(label.toUpperCase());
        lab.getStyleClass().add("kpi-label");
        valueLabel.getStyleClass().add("kpi-value");
        valueLabel.setText(value);
        subLabel.getStyleClass().add("kpi-sub");
        subLabel.setText(sub == null ? "" : sub);
        subLabel.setManaged(sub != null);
        subLabel.setVisible(sub != null);
        getChildren().addAll(lab, valueLabel, subLabel);
        setPadding(new Insets(0));
        setMinWidth(160);
    }

    public void setValue(String v) { valueLabel.setText(v); }

    public void setSub(String s, String styleClass) {
        subLabel.setText(s == null ? "" : s);
        subLabel.getStyleClass().removeAll("up", "down");
        if (styleClass != null) subLabel.getStyleClass().add(styleClass);
        subLabel.setManaged(s != null);
        subLabel.setVisible(s != null);
    }
}
