#!/bin/bash

# Shell-Skript für macOS
# Kopiert den Inhalt aller sichtbaren Dateien (außer sich selbst)
# im aktuellen Verzeichnis formatiert in die Zwischenablage.
# Besonders geeignet für Textdateien wie .jsx, .css, etc.

# --- Konfiguration ---
# (Normalerweise keine Änderung nötig)

# --- Skriptlogik ---

# 1. Prüfe, ob der Befehl 'pbcopy' verfügbar ist (spezifisch für macOS)
if ! command -v pbcopy &> /dev/null; then
    # Schreibe Fehlermeldung auf den Standard-Fehlerkanal
    echo "Fehler: 'pbcopy' Befehl nicht gefunden. Dieses Skript ist für macOS konzipiert." >&2
    exit 1 # Beende Skript mit Fehlercode
fi

# 2. Ermittle den Namen des Skripts selbst, damit es sich nicht selbst liest
script_name=$(basename "$0")
# echo "Skriptname: $script_name" # Debug-Ausgabe (optional)

# 3. Bereite die Verarbeitung vor
output_buffer="" # Variable zum Sammeln der Ausgabe

# 4. Gehe alle Einträge im aktuellen Verzeichnis (.) durch
#    Der Stern (*) expandiert zu allen sichtbaren Dateien/Ordnern
for item in *; do
    # 5. Prüfungen für jeden Eintrag:
    #    a) Ist es eine reguläre Datei (-f)?
    #    b) Beginnt der Name NICHT mit einem Punkt (.)? (Doppelte Klammern für erweiterte Tests)
    #    c) Ist der Name NICHT der Name des Skripts selbst?
    if [ -f "$item" ] && [[ "$item" != .* ]] && [ "$item" != "$script_name" ]; then

        # Debug-Ausgabe (optional)
        # echo "Verarbeite Datei: $item"

        # 6. Wenn alle Prüfungen OK sind -> Verarbeite die Datei:
        #    Füge den Header zur Ausgabe hinzu (printf für sichere Formatierung)
        output_buffer+=$(printf "------ Dateiname: %s ------\n" "$item")

        #    Füge den Dateiinhalt hinzu (cat liest die Datei)
        #    Warnung: 'cat' liest auch Binärdateien, was zu unleserlichem Output führen kann.
        #    Fehler beim Lesen (z.B. keine Berechtigung) würden hier eine Fehlermeldung ausgeben.
        file_content=$(cat "$item")
        output_buffer+="$file_content" # Füge Inhalt hinzu

        #    Füge den Footer hinzu (mit extra Leerzeile für Trennung)
        output_buffer+=$(printf "\n------ END of %s ------\n\n" "$item")

    # else
        # Debug-Ausgabe (optional)
        # if [ "$item" == "$script_name" ]; then echo "Ignoriere Skript: $item"; fi
        # if [[ "$item" == .* ]]; then echo "Ignoriere versteckt: $item"; fi
        # if [ ! -f "$item" ]; then echo "Ignoriere (keine Datei): $item"; fi
    fi
done # Ende der Schleife

# 7. Übergebe die gesammelte Ausgabe an die macOS Zwischenablage
#    'echo -n' verhindert eine zusätzliche ungewollte Leerzeile am Ende.
#    Wenn $output_buffer leer ist, wird die Zwischenablage geleert.
echo -n "$output_buffer" | pbcopy

# 8. Erfolgsmeldung (optional, erscheint nur im Terminal)
#    Prüfe, ob die Zwischenablage jetzt Inhalt hat (größer 0 Bytes).
#    LANG=C sorgt für konsistentes Verhalten von wc. awk gibt Exit-Code 0 bei Erfolg.
if LANG=C pbpaste | wc -c | awk '$1 > 0 {exit 0} {exit 1}'; then
   echo "Inhalt der Dateien wurde erfolgreich in die Zwischenablage kopiert."
else
   echo "Hinweis: Keine passenden Dateien gefunden oder Zwischenablage ist leer."
fi

# 9. Beende das Skript erfolgreich
exit 0
