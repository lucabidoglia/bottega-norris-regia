module it.bottenorris.regia {
    requires javafx.controls;
    requires javafx.graphics;
    requires javafx.base;

    opens it.bottenorris.regia to javafx.graphics;
    exports it.bottenorris.regia;
}
