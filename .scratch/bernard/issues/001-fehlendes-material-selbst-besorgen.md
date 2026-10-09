# 001: Fehlendes Material fürs Craften selbst besorgen

**Status:** offen · **Blockiert von:** – · **Version:** 1

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
