# 04: Unterbrechen, pausieren, weitermachen, vergessen, Status

**What to build:** Das Vorhaben lebt mit den Befehlen der Kumpel zusammen.
- **Unterbrechen:** Ein Befehl unterbricht das Vorhaben sofort. Die Regel „ein neuer Befehl ersetzt den laufenden“ bleibt, das Vorhaben ist kein Befehl und läuft darunter weiter.
- **Weitermachen nach einem Befehl:** Ist der Befehl erledigt, sagt Bernard an, womit er weitermacht, zum Beispiel „Ich mach dann mit der Steinzeit weiter, mir fehlt noch eine Steinaxt.“ Dann wartet er kurz und läuft los.
- **Pausieren:** „stopp“ oder „bleib“, während der Ansage oder später, pausiert das Vorhaben. Bernard bleibt dann stehen.
- **Fortsetzen:** „mach weiter“ setzt ein pausiertes Vorhaben fort.
- **Beenden:** „vergiss das Vorhaben“ beendet es ganz.
- **Status:** „was machst du?“ und „wie weit bist du?“ beantwortet Bernard mit Vorhaben, Stufe, nächstem Ziel und aktueller Aktion, zum Beispiel „Stufe 1, ich brauch noch eine Steinaxt, gerade hole ich Bruchstein.“ Ohne Vorhaben sagt er „Ich hab gerade nichts vor.“

Im Entscheider gilt: Läuft ein Befehl, gibt es keine Aktion. Ist das Vorhaben pausiert, auch nicht.

**Blocked by:** 01 (Vorhaben starten und Stufe 1 erreichen)

**Status:** ready-for-agent

- [ ] Unit-Tests für den Entscheider: Befehl läuft → keine Aktion. Pausiert → keine Aktion. Aktiv und kein Befehl → nächstes Ding.
- [ ] Unit-Tests für die Befehlserkennung: „mach weiter“, „vergiss das Vorhaben“, „was machst du?“ und „wie weit bist du?“ samt englischer Varianten. „stopp“ wird weiter erkannt wie bisher.
- [ ] Nur Kumpel können pausieren, fortsetzen, vergessen und den Status abfragen
- [ ] Szenario (flache Welt): Vorhaben läuft, „komm her“ unterbricht es, Bernard kommt, sagt das Weitermachen an und läuft wieder los
- [ ] Szenario: „stopp“ → Bernard bleibt auch nach einigen Sekunden stehen. „mach weiter“ → er setzt fort.
- [ ] Szenario: „was machst du?“ liefert Stufe, nächstes Ziel und aktuelle Aktion. Nach „vergiss das Vorhaben“ kommt „Ich hab gerade nichts vor.“
- [ ] Wenn Ticket 03 schon fertig ist, steht „vergessen“ als Grund im Laufbericht
