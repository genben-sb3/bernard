# 02: Eisenzeit als Daten: neue Dinge und Soll-Inventar (Tracer)

**What to build:** Stufe 2 bekommt Inhalt. Soll-Inventar: Eisenspitzhacke, Eisenschwert, Schild, Eimer. Vorrat: 32 Fackeln, 32 Bruchstein, 8 Kohle. Neue Dinge mit deutschen und englischen Namen: Eisenspitzhacke, Eisenschwert, Eisenaxt, Schild, Eimer, Eisenerz, Kohleerz. Mit genug Eisenbarren im Inventar craftet Bernard alles selbst und sagt „Eisenzeit geschafft.“. „Besieg den Enderdrachen“ läuft jetzt bis zur Eisenzeit. Dann sagt Bernard, dass er weiter noch nicht kann. Ohne Eisen meldet `besorge` vorerst ehrlich, dass Roheisen fehlt. Die Mine kommt in Ticket 05.

**Blocked by:** 01

**Status:** erledigt

- [x] Unit-Tests: Ein Eisenwerkzeug erfüllt das Steinwerkzeug. Stufe 2 ist erreicht mit Soll-Inventar 1 und 2.
- [x] Unit-Tests Befehle: Die neuen Dinge werden auf Deutsch und Englisch erkannt.
- [x] Szenario (flache Welt): Bernard bekommt das Soll-Inventar der Steinzeit und 9 Eisenbarren, dazu „spiel bis zur Eisenzeit“. Er craftet alles, sagt „Eisenzeit geschafft.“, und der Laufbericht hat den Stufenwechsel.

**Umsetzung:**
- Szenario `eisenzeit` (`sim/szenarien/eisenzeit.ts`): bestanden. „Eisenzeit geschafft!“ nach 21 s, Laufbericht mit `erfuellt` für alle vier Soll-Dinge und `stufe` 1 → 2. Danach, mit dem per Server-Befehl aufgefüllten Vorrat, bringt „besieg den Enderdrachen“ „Weiter als bis zur Eisenzeit kann ich noch nicht.“
- Szenario `vorhaben`, Phase 2 angepasst: „besieg den Enderdrachen“ ohne Eisen bringt jetzt „Mir fehlen 3 Roheisen. Ich höre mit dem Vorhaben auf.“ (bestanden).
- Kohle entsteht ohne Mine im Ofen als Holzkohle (`kohle.schmelzen`). Sonst könnte Bernard den Vorrat der Eisenzeit (8 Kohle) nie auffüllen. Die Mine (Ticket 05) liefert später echte Kohle.
- Der Text bleibt „… geschafft!“ mit Ausrufezeichen wie bei der Steinzeit, die Szenarien prüfen nur „Eisenzeit geschafft“.
