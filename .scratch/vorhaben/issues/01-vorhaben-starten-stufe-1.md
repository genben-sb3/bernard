# 01: Vorhaben starten und Stufe 1 erreichen (Tracer)

**What to build:** Ein Kumpel sagt „Bernard, spiel bis zur Steinzeit“ oder „Bernard, besieg den Enderdrachen“. Bernard bestätigt das Vorhaben und die Zielstufe. Danach besorgt er sich selbstständig das Soll-Inventar von Stufe 1 (Steinspitzhacke, Steinschwert, Steinaxt, Werkbank, Ofen, 16 Bruchstein, 16 Holz) und meldet „Steinzeit geschafft“. Ist die Zielstufe höher als 1, sagt er danach ehrlich, dass er weiter noch nicht kann, und beendet das Vorhaben.

Das ist der erste durchgehende Pfad, auf dem alle folgenden Tickets aufbauen:
- **Stufen als Daten:** Soll-Inventare 1 bis 5. Nur Stufe 1 ist gefüllt, 2 bis 5 sind nur benannt (Eisenzeit, Diamantzeit, Nether, End).
- **Aktuelle Stufe:** Sie ergibt sich aus dem Inventar. Ein höherwertiges Werkzeug erfüllt ein niedrigeres, und alle Holzsorten zählen zusammen.
- **Entscheider:** eine pure Funktion ohne Mineflayer, die aus einem Zustand die nächste Aktion ableitet. In dieser Grundform gibt es nur die Aktion „besorge Ding und Menge“, die Reihenfolge steht in den Stufen-Daten (Werkzeuge vor Vorrat).
- **Ausführungsschleife:** eine dünne Schleife, die den Zustand aus dem Bot liest, den Entscheider fragt und `besorge` aufruft.
- **Befehlserkennung:** Vorhaben starten mit Zielstufe 1 bis 5. „besieg den Enderdrachen“ entspricht Stufe 5. Deutsch und Englisch wie bei den anderen Befehlen.
- **`CONTEXT.md`:** Die Begriffe Vorhaben, Stufe, Soll-Inventar, Rückfall, Laufbericht und Entscheider kommen hinein, so wie in Spec 011 beschrieben.

Quelle: Spec `.scratch/bernard/issues/011-vorhaben-geruest-und-stufe-1.md`.

**Blocked by:** Ticket 001 des Bernard-Trackers (`besorge`) muss fertig und committet sein. Innerhalb dieses Features gibt es keine Blocker.

**Status:** ready-for-agent

- [ ] Unit-Tests für den Entscheider:
  - leeres Inventar → besorge das erste Ding
  - fast vollständiges Soll-Inventar → besorge das fehlende Ding
  - vollständiges Soll-Inventar → keine Aktion, Stufe erreicht
  - eine Eisenspitzhacke erfüllt die Steinspitzhacke
  - Holzsorten zählen zusammen
- [ ] Unit-Tests für die Stufenberechnung aus dem Inventar, mit 0 bei leerem Inventar und 1 bei vollem Soll-Inventar
- [ ] Unit-Tests für die Befehlserkennung: alle Formulierungen zum Starten, die Zielstufen samt Enderdrache und Sätze, die nicht erkannt werden dürfen
- [ ] Bernard bestätigt den Start im Chat und meldet „Steinzeit geschafft“
- [ ] Bei Zielstufe über 1 meldet er nach Stufe 1, dass er weiter noch nicht kann, und das Vorhaben endet
- [ ] Nur Kumpel können ein Vorhaben starten
- [ ] Die Begriffe stehen in `CONTEXT.md`
- [ ] Szenario in der flachen, friedlichen Welt mit hingesetzten Bäumen und Stein: leeres Inventar, „spiel bis zur Steinzeit“. Am Ende liegt das Soll-Inventar vor (per Server-Befehl geprüft), und es steht keine Werkbank herum.
