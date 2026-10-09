# 001: Fehlendes Material fürs Craften selbst besorgen

**Status:** erledigt (Branch `ticket-001-material-besorgen`) · **Blockiert von:** – · **Version:** 1

## Problem
„Bernard, mach eine Holzspitzhacke“ ohne Holz im Inventar endet mit „Dafür fehlen mir 3 Holz.“ Ein Mitspieler erwartet, dass Bernard das Holz selbst holt und dann craftet.

## Gewünscht
- Fehlt Grundmaterial, das Bernard sammeln kann (Holz, Bruchstein, Erde, Sand), sagt er an, was er holt („Ich hole erst 3 Holz.“), sammelt es und craftet dann.
- Fehlt etwas, das er nicht sammeln kann (z. B. Kohle, Eisen), meldet er es wie bisher.
- Fehlt ein Werkzeug zum Sammeln (Bruchstein braucht eine Spitzhacke), craftet er zuerst das Werkzeug, notfalls ebenfalls mit selbst gesammeltem Material. Beispiel: „mach eine Steinspitzhacke“ mit leerem Inventar → Holz holen, Holzspitzhacke craften, 3 Bruchstein holen, Steinspitzhacke craften.
- „stopp“ bricht die ganze Kette ab.

## Hinweise
- Der Craft-Planer (`src/craftplan.ts`) liefert schon `fehlt` als Gegenstands-IDs. Daraus muss eine Liste von Sammelaufträgen werden (`src/sammeln.ts`).
- Bei Gleichstand nennt der Planer bekannte Materialien zuerst. Beim Sammeln muss aber die Sorte zählen, die es in der Nähe gibt (Birke statt Eiche).

## Fertig, wenn
- Neues Simulations-Szenario: leeres Inventar, Bäume und Stein in der Nähe, „mach eine Steinspitzhacke“ → Bernard hat sie, keine Werkbank bleibt stehen, nichts liegt herum.
- Szenario: kein Stein in der Nähe → klare Meldung, was fehlt, und keine Endlosschleife.

## Umsetzung
- `besorge(bot, ding, gesamt, kontext)` in `src/besorgen.ts`: ein eigenständiger, wiederverwendbarer Baustein. Danach hat Bernard mindestens `gesamt` Stück. Sammelbares sammelt er (eine fehlende Spitzhacke besorgt er vorher), alles andere craftet er und besorgt die Zutaten rekursiv. Höchstens 6 Runden und 4 Ebenen, damit es keine Endlosschleifen gibt.
- Der Craft-Befehl ruft nur noch `besorge` auf. Der Sammel-Befehl verhält sich wie bisher: Ohne Spitzhacke meldet er das, statt sie zu besorgen.
- Nebenbei entstanden:
  - Alles Abbauen und Platzieren läuft über `src/eingriffe.ts`, mit anhängbaren Regeln (Vorbereitung für 007).
  - Die Wegfindung setzt keine Gerüstblöcke mehr.
  - Abgebrochene Aufträge fassen die Wegfindung nicht mehr an (`src/auftrag.ts`, `halteAn`). Vorher stoppte ein abgebrochener Auftrag den Weg des neuen Befehls.
- Szenario `besorgen`: Steinspitzhacke mit leerem Inventar, Ofen ohne Stein in der Nähe, Unterbrechen mitten im Besorgen. Die letzte Prüfung schlägt nachweislich fehl, wenn der Abbruch-Fehler wieder eingebaut wird.
