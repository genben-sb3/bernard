# 003: Bernard antwortet in der Sprache des Befehls

**Status:** offen · **Blockiert von:** – (mit 002 abstimmen) · **Version:** 1

## Problem
Im Interview wurde entschieden: Die Antwortsprache ist einstellbar, Standard ist die Sprache des Befehls. Im Moment antwortet Bernard immer auf Deutsch, auch auf „Bernard, follow me“.

## Gewünscht
- Schnellweg: Die Sprache wird am erkannten Muster festgemacht (deutsches oder englisches Muster). Alle Antworttexte gibt es auf Deutsch und Englisch, mit englischen Minecraft-Namen (Oak Log, Cobblestone).
- Einstellung in `config/bernard.json`: `"sprache": "wie-befehl" | "de" | "en"`.
- Wenn 002 da ist, antwortet die KI in der Sprache des Satzes.

## Hinweise
- Die Antworttexte stehen im Moment verteilt in `src/bernard.ts`, `src/inventar.ts`, `src/craften.ts` und `src/dinge.ts`. Sie sollten an einen Ort, sonst wird die Übersetzung unübersichtlich.

## Fertig, wenn
- Unit-Tests: jeder Befehl auf Englisch → englische Antwort.
- Ein Simulationslauf mit englischen Befehlen besteht.
