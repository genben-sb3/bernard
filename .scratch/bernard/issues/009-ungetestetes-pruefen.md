# 009: Gebaute, aber ungetestete Fähigkeiten prüfen

**Status:** erledigt (Branch `ticket-009-ungetestetes-pruefen`) · **Blockiert von:** – · **Version:** 1

## Problem
Diese Fähigkeiten gibt es im Code, aber kein Szenario deckt sie ab:
- Erde und Sand sammeln
- Mit einer Axt im Inventar Holz fällen (sie sollte benutzt werden)
- Sterben: Meldung im Chat, ein laufender Auftrag bricht ab, Bernard wartet am Spawn
- „Ich kann dich nicht sehen“, wenn der Kumpel zu weit weg ist

## Fertig, wenn
- Für jeden Punkt eine Prüfung in einem Szenario (neu oder bestehend), mehrfach grün.

## Umsetzung
Neues Szenario `faehigkeiten` (`sim/szenarien/faehigkeiten.ts`, flache Welt). Am Code von Bernard musste nichts geändert werden, alle vier Fähigkeiten funktionierten schon.
1. **Erde:** „hol 5 Erde“ → Fertigmeldung, 5 Erde im Inventar. Der Aufbau füllt die Erdschicht unter dem Gras wieder auf, weil die Arena-Räumung nur die Grasschicht erneuert.
2. **Sand:** „hol 5 Sand“ aus einem 3×3-Sandfeld → Fertigmeldung, 5 Sand, nur Sand abgebaut.
3. **Axt:** Bernard bekommt eine Steinaxt, „hol 4 Holz“ → beim Fällen hält er die Axt (über seine eigene Sicht `heldItem`), und die Axt hat danach Schaden (per RCON gezielt `…components."minecraft:damage"` abgefragt, das ganze Inventar schneidet RCON ab).
4. **Kein Sichtkontakt:** Ben wird 400 Blöcke weit teleportiert, „komm her“ → „Ben, ich kann dich nicht sehen. Wo bist du?“, Bernard bleibt stehen.
5. **Tod ohne Vorhaben:** „hol 30 Holz“, nach dem ersten Stamm `kill Bernard` → „Autsch, ich bin gestorben. Ich warte am Spawn auf neue Befehle.“, er steht am Spawn, bewegt sich 8 s lang nicht, baut nichts mehr ab und meldet nichts mehr zum alten Auftrag.

## Tests
- Szenario `faehigkeiten`: 13 Prüfungen, dreimal hintereinander bestanden (2026-10-09).
