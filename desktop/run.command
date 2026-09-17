#!/bin/bash
# Avvia l'app desktop con un doppio clic dal Finder.
# Non serve installare nulla a parte Java: usa il Maven Wrapper (./mvnw),
# che scarica Maven da solo al primo avvio (richiede una connessione
# internet la prima volta; poi resta in cache).
set -e
cd "$(dirname "$0")"

find_java_home() {
  if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then echo "$JAVA_HOME"; return; fi
  if [ -x "$HOME/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home/bin/java" ]; then
    echo "$HOME/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"; return
  fi
  local jh
  jh=$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home 2>/dev/null || true)
  if [ -n "$jh" ]; then echo "$jh"; return; fi
  echo ""
}

JH=$(find_java_home)
if [ -z "$JH" ]; then
  osascript -e 'display alert "Java non trovato" message "Questa app richiede Java 21 (o superiore). Installa Eclipse Temurin da https://adoptium.net e riprova." as critical'
  exit 1
fi
export JAVA_HOME="$JH"

echo "Avvio Bottega Norris — Regia del costo del lavoro..."
./mvnw -q javafx:run
