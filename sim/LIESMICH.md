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
npm run sim -- folgen                                                # Szenario laufen lassen
npx tsx sim/diagnose-wand.ts                                          # Wand-Diagnose: überall 0 Server-Korrekturen erwartet
```

## Neues Szenario

Eine Datei in `sim/szenarien/` anlegen, die ein `Szenario` exportiert (Aufbau per Server-Befehlen, Startpositionen, Ablauf mit `beobachter.pruefe(...)` und `beobachter.karte(...)`), und in `SZENARIEN` in `sim/lauf.ts` eintragen.

## Bekannte Eigenheiten

- **prismarine-physics ist gepatcht** (`patches/`): Server ab 26.1 lehnen jede Bewegung ab, wenn ein Spieler exakt bündig an einer Wand anliegt. Ohne den Patch bleibt Bernard an Wänden dauerhaft hängen.
- **GoalFollow aus mineflayer-pathfinder wird nicht verwendet**: Das Ziel misst gegen einen veralteten Punkt und hängt bis zu doppelt so weit zurück wie eingestellt. Bernard nutzt stattdessen `GoalHinterher` aus `src/ziele.ts`.
- 3D-Screenshots gibt es nicht: prismarine-viewer kann nur Versionen bis 1.21.4 darstellen.
