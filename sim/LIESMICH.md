# Simulation

Testet Bernard auf einem lokalen Testserver, ohne dass ein Mensch mitspielen muss.

- **Ben** und **Fremder** sind Testbots, die die Rolle von Spielern übernehmen.
- Der **Beobachter** fliegt im Zuschauermodus mit, sammelt Positionen, Chat und Ereignisse und zeichnet Karten (Draufsicht).
- Ergebnisse landen in `sim/ergebnisse/<zeit>-<szenario>/` (`bericht.json` und PNG-Karten). Der Agent `sim-auswerter` (`.claude/agents/`) wertet sie aus.

## Einmalig einrichten

- `server/` enthält einen Paper-26.1.2-Server (flache Welt, Offline-Modus, RCON auf Port 25575), `.tools/java/` ein Java 25.
- `npm install` spielt automatisch `patches/` ein (siehe unten).

## Ausführen

```sh
cd server && ../.tools/java/bin/java -Xmx2G -jar paper.jar --nogui   # Server starten
npm run sim -- folgen                                                # Szenario laufen lassen (folgen, sammeln, werkzeug, besorgen, vorhaben, zeitlimit, unterbrechen)
npx tsx sim/diagnose-wand.ts                                          # Wand-Diagnose: überall 0 Server-Korrekturen erwartet
npx tsx sim/diagnose-werfen.ts                                        # Werfen/Craften: Server- und Bernard-Sicht aufs Inventar vergleichen
npx tsx sim/diagnose-craften.ts 10                                    # Holzspitzhacke 10× craften, Paketspur bei Fehlschlag
node sim/rcon-befehl.mjs "list"                                      # beliebige Server-Befehle
```

## Neues Szenario

Eine Datei in `sim/szenarien/` anlegen, die ein `Szenario` exportiert (Aufbau per Server-Befehlen, Startpositionen, Ablauf mit `beobachter.pruefe(...)` und `beobachter.karte(...)`), und in `SZENARIEN` in `sim/lauf.ts` eintragen.

## Bekannte Eigenheiten

- **mineflayer ist gepatcht** (`patches/`): Der Server führt den Klick-Zähler (`stateId`) pro Fenster und schickt auch bei offener Werkbank weiter Updates fürs Spieler-Inventar. mineflayer merkte sich nur einen Zähler für alle Fenster und klickte an der Werkbank oft mit dem des Inventars. Der Server ignorierte diese Klicks, und die Holzspitzhacke kam etwa jedes zweite Mal nicht an (`sim/diagnose-craften.ts`).
- **prismarine-physics ist gepatcht** (`patches/`): Server ab 26.1 lehnen jede Bewegung ab, wenn ein Spieler exakt bündig an einer Wand anliegt. Ohne den Patch bleibt Bernard an Wänden dauerhaft hängen.
- **GoalFollow aus mineflayer-pathfinder wird nicht verwendet**: Das Ziel misst gegen einen veralteten Punkt und hängt bis zu doppelt so weit zurück wie eingestellt. Bernard nutzt stattdessen `GoalHinterher` aus `src/ziele.ts`.
- **Baumfällen**: Bei kleinen Eichen hängen die untersten Blätter auf Kopfhöhe neben dem Stamm. Bernard darf beim Fällen deshalb natürliche Blätter wegschlagen (nie gesetzte, `persistent=true`). Ohne das findet die Wegsuche keinen Platz am Stamm, und Drops bleiben in den zugewachsenen Ecken liegen.
- **Fallende Drops**: Gegenstände aus der Höhe brauchen etwa eine Sekunde zum Landen. Wer sie früher ansteuert, läuft zu ihrer Position in der Luft.
- Liegen nach einem Lauf Stämme herum, nennt die Prüfung ihre echte Position laut Server (RCON), nicht die, die Bernard glaubt.
- **Inventar-Klicks (26.x)**: Jeder Klick trägt einen Zähler des Servers mit. Kommt er, während noch Updates vom letzten Schritt eintreffen, ignoriert der Server ihn stillschweigend (Craften hängt 20 s, „missing ingredient“). Vor Inventar-Aktionen `warteAufInventarRuhe` (`src/ruhe.ts`).
- **Werfen**: Die neue Blickrichtung kennt der Server erst nach dem nächsten Bewegungspaket. Ohne ein paar Ticks Warten fliegt alles in die alte Laufrichtung. Geworfenes kann erst nach 2 s aufgehoben werden. Bernard lässt es deshalb direkt vor dem Kumpel fallen und tritt zurück, sonst hebt er es selbst wieder auf.
- **Pfad-Knoten sind ganze Blöcke**: `GoalNearXZ(x, z, 0.3)` ist oft unerreichbar. Zum Aufheben `GoalXZ(floor(x), floor(z))` verwenden.
- **Eingriffe in die Welt** laufen nur über `src/eingriffe.ts` (`baueAb`, `platziere`, `bewegungen`). Die Wegfindung setzt standardmäßig keine Gerüstblöcke. Nie direkt `bot.dig`/`bot.placeBlock` aufrufen und nie `new Movements` erzeugen.
- **Abgebrochene Aufträge** dürfen die Wegfindung nicht stoppen (`halteAn` in `src/auftrag.ts`), sonst bremsen sie den neuen Befehl aus.
- 3D-Screenshots gibt es nicht: prismarine-viewer kann nur Versionen bis 1.21.4 darstellen.
