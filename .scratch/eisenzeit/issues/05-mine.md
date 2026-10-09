# 05: Mine: Treppe, Stollen, Erz

**What to build:** Fehlt Roheisen (oder Kohle), geht `besorge` in die Mine. Der Entscheider weiß davon nichts.
- **Mine anlegen:** Bernard gräbt vom Lager aus eine Treppe nach unten auf Y 16, nie senkrecht, und setzt alle paar Blöcke eine Fackel.
- **Stollen:** Auf Y 16 gräbt er einen Hauptgang mit Seitengängen alle 3 Blöcke.
- **Abbauen:** Er nimmt jedes sichtbare Eisen- und Kohleerz mit. Lava und Wasser, die er sieht, mauert er mit Bruchstein zu. Gestein über den Vorrat hinaus wirft er weg.
- **Wie viel:** Er gräbt, bis er das Eisen für die Stufe hat. Dann geht er hoch zum Lager, schmilzt dort und räumt den Überschuss ein.
- **Gedächtnis:** Eingang und letzte Stollenposition merkt er sich in der Lagerdatei. Beim nächsten Mal gräbt er dort weiter.
- **Fehlschlag:** 150 Blöcke Stollen ohne Eisen. Dann beginnt er einen neuen Hauptgang in eine andere Richtung. Nach 3 Fehlschlägen in Folge meldet er es und pausiert, nach derselben Regel wie bisher.
- **Befehl:** „Bernard, besorg 5 Eisen“ funktioniert auch als normaler Befehl.

**Blocked by:** 02, 03

**Status:** offen

- [ ] Unit-Tests für die reine Logik der Mine, soweit es sie gibt: Treppenschritte, Seitengang-Raster, Fehlschlag nach 150 Blöcken
- [ ] Szenario `mine` (normale Welt, fester Seed): „besorg 5 Eisen“. Bernard gräbt eine Treppe nach unten und einen Stollen, hat 5 Eisenbarren und ist zurück am Lager. Geprüft wird: nie senkrecht gegraben, Fackeln gesetzt, kein Gestein über den Vorrat hinaus im Inventar.
- [ ] Szenario: Lava neben dem Stollen wird zugemauert, und Bernard stirbt nicht daran.
- [ ] Laufbericht: `mineBegonnen` (Koordinaten, Zieltiefe), erstes Erhalten von Erzen, `minengang` (Dauer, Ausbeute je Erz)
