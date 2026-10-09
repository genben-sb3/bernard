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
npm run sim -- folgen                                                # Szenario laufen lassen (folgen, sammeln, werkzeug, besorgen, ki, englisch, vorhaben, zeitlimit, unterbrechen, weiterziehen, normalwelt, tod, stufe1)
npx tsx sim/diagnose-wand.ts                                          # Wand-Diagnose: überall 0 Server-Korrekturen erwartet
npx tsx sim/diagnose-werfen.ts                                        # Werfen/Craften: Server- und Bernard-Sicht aufs Inventar vergleichen
npx tsx sim/diagnose-craften.ts 10                                    # Holzspitzhacke 10× craften, Paketspur bei Fehlschlag
npx tsx sim/diagnose-ki.ts [url] [modell]                            # echtes KI-Modell: zehn Sätze, Ergebnis und Antwortzeit
node sim/rcon-befehl.mjs "list"                                      # beliebige Server-Befehle
```

## Weltarten

Jedes Szenario legt mit `welt` fest, wo es läuft:

- **`flach`** (Standard): die flache, friedliche Welt des Testservers in `server/`. Vor jedem Lauf wird die Testfläche geräumt, die Bots werden auf `start` gesetzt.
- **`normal`**: eine normal generierte Welt mit festem Seed auf Schwierigkeit „normal“, Monster spawnen. `npm run sim` startet dafür selbst einen zweiten Server in `server-normal/` (Port 25566, RCON 25576), löscht vorher die alte Welt und stoppt ihn nach dem Lauf. Jeder Lauf beginnt also in einer frisch erzeugten Welt. Der flache Server muss dafür nicht laufen, darf es aber. Der Start dauert etwa 25 s. Alle Bots betreten die Welt genau am Weltspawn (`respawn_radius 0`), `start` gilt hier nicht, der Beobachter schwebt 30 Blöcke darüber.

**Seed:** `42`, Spawn bei x −32, y 71, z 0 auf Gras. Der nächste Baum (Schwarzeiche) ist 5,5 Blöcke entfernt, offener Stein etwa 10 Blöcke. Das Szenario `normalwelt` prüft das.

**Seed ändern:** `SEED` und `SPAWN` in `sim/normalwelt.ts` anpassen und `npm run sim -- normalwelt` laufen lassen. Den Spawn des neuen Seeds nennt die fehlgeschlagene Prüfung „am erwarteten Spawn“. Ein neuer Seed taugt, wenn auch Baum und Monster bestanden sind und Stein in der Nähe offen liegt. Alle Messläufe mit dem alten Seed sind danach nicht mehr vergleichbar.

## Ausgangsmessung Stufe 1

`npm run sim -- stufe1` ist der Messlauf: frische Normalwelt (Seed 42, „normal“), „spiel bis zur Steinzeit“ mit 30 Minuten Zeitlimit, ohne Überlebenslogik. Ob Bernard die Steinzeit schafft, ist ein Messwert, kein Testfehler. Er steht in `messung.json` im Ergebnisordner. Ben steht im Kreativmodus am Spawn, und der Beobachter fliegt Bernard hinterher.

Erste Ausgangsmessung (2026-10-09, Stand `df0257a`, also vor Ticket 004):

| Lauf | Ende | Zeit bis Stufe 1 | Dauer | Tode | Rückfälle | Erfüllt |
|---|---|---|---|---|---|---|
| 10:50 | gescheitert | – | 456 s | 0 | 0 | Steinspitzhacke, Werkbank, Steinaxt |
| 13:09 | gescheitert | – | 667 s | 1 | 0 | Werkbank |
| 13:22 | gescheitert | – | 554 s | 1 | 0 | Steinspitzhacke, Werkbank, Steinaxt, Steinschwert |
| 13:33 | gescheitert | – | 188 s | 0 | 0 | Werkbank |
| 14:00 (nach Ticket 003) | gescheitert | – | 555 s | 1 | 0 | Steinspitzhacke, Werkbank, Steinaxt, Steinschwert, Ofen |

**Befund:** Kein Lauf erreicht die Steinzeit. Alle fünf enden mit „Ich finde keinen Platz für die Werkbank“. Bernard steht dabei in einem selbst gegrabenen Loch, und dort ist keines der acht Nachbarfelder frei (Ticket 012). Außerdem bricht die Wegsuche zum Stein oft ab („Took to long to decide path“, 5 bis 62 Mal pro Lauf), weil Bernard unterwegs nicht gräbt und nur an offenen Stein kommt. Drei der fünf Läufe hatten einen Tod, beide auf Stufe 0, also ohne Rückfall.

## Neues Szenario

Eine Datei in `sim/szenarien/` anlegen, die ein `Szenario` exportiert (Aufbau per Server-Befehlen, Startpositionen, Ablauf mit `beobachter.pruefe(...)` und `beobachter.karte(...)`), und in `SZENARIEN` in `sim/lauf.ts` eintragen.

## Bekannte Eigenheiten

- **Gamerules heißen ab 26.1 anders** (snake_case): `respawn_radius`, `spawn_mobs`, `spawn_monsters` statt `spawnRadius`, `doMobSpawning`.
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
- **Simulationen schließen sich gegenseitig aus** (`flock /tmp/bernard-sim.lock` in `npm run sim`). Mehrere Sessions teilen sich einen Testserver.
- **KI im Szenario**: `ki` nutzt eine KI-Attrappe (`sim/ki-attrappe.ts`) mit festen Antworten, also prüft es das Zusammenspiel, nicht die Sprachfähigkeit. Die Sprachfähigkeit misst `sim/diagnose-ki.ts` mit einem echten Modell. Auf dem Linux-PC (nur CPU, oft ausgelastet) dauert eine Antwort von `qwen2.5:3b` etwa eine Minute.
- 3D-Screenshots gibt es nicht: prismarine-viewer kann nur Versionen bis 1.21.4 darstellen.
