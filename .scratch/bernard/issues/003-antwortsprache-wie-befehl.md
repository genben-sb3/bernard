# 003: Bernard antwortet in der Sprache des Befehls

**Status:** erledigt (Branch `ticket-003-antwortsprache`) · **Blockiert von:** – (mit 002 abstimmen) · **Version:** 1

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

## Umsetzung
- `src/texte.ts`: Alle Antworttexte an einem Ort, auf Deutsch und Englisch (`texte(sprache)`). Fehlt ein englischer Text, schlägt die Typprüfung fehl.
- Spracherkennung `erkenneSprache` über typische Wörter (follow/come/give … gegen folge/komm/gib …). Ist sie nicht eindeutig, gilt die Einstellung, sonst Deutsch.
- `config/bernard.json` → `"sprache": "wie-befehl" | "de" | "en"`.
- Jedes Ding hat englische Namen wie im Spiel (`en: [Einzahl, Mehrzahl, „no …“]`), `mc:`-Gegenstände ihren Spielnamen. `mitMenge`, `mehrzahl` und `kein` nehmen die Sprache entgegen.
- Funktionen liefern Ergebnisse statt fertiger Sätze, wo sonst Deutsch fest eingebaut war: Werkzeugbedarf als Schlüssel, „nicht gefunden“ als Material plus Fehlendes. Der Satz entsteht erst in `bernard.ts`.
- Befehle, die die KI liefert, bekommen ihre Bestätigung in der Sprache des Originalsatzes. Die eigenen Antworten der KI (`say`) schreibt die KI ohnehin in der Sprache der Nachricht.
- Der Schnellweg kennt jetzt auch „make …“ zum Craften.
- Die Todesmeldung kommt in der Sprache der letzten Nachricht.

## Tests
- Unit-Tests: Spracherkennung (16 Sätze), feste Einstellung, englische Namen, „Was fehlt“ auf Englisch.
- Szenario `englisch`: folgen, stopp, Inventar, Holz holen, KI-Satz, nichts da, alles geben auf Englisch. Dazwischen ein deutscher Befehl mit deutscher Antwort.
