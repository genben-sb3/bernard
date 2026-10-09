# 03: Laufbericht und Zeitlimit

**What to build:** Jedes Vorhaben schreibt einen **Laufbericht**. Das ist nicht das technische Debug-Protokoll, sondern die Meilensteine des Laufs, ein Eintrag pro Zeile, maschinenlesbar, jeweils mit Spielzeit (Ticks) und Echtzeit. Er enthält:
- den Start mit Zielstufe
- jedes Ding aus dem Soll-Inventar beim ersten Erhalt
- jeden Stufenwechsel
- das Ende mit Grund: Zielstufe erreicht, Stufe nicht implementiert, vergessen, abgebrochen oder Zeitlimit

Ein Vorhaben kann ein Zeitlimit in Echtzeit haben. Ist es abgelaufen, endet das Vorhaben mit dem Grund „Zeitlimit“, und Bernard sagt das im Chat. In der Simulation landet der Laufbericht im Ergebnisordner des Laufs, im echten Spiel in einem eigenen Ordner neben der Konfiguration.

Tod und Rückfall kommen in Ticket 06 dazu. Das Format muss sie aufnehmen können.

**Blocked by:** 01 (Vorhaben starten und Stufe 1 erreichen)

**Status:** ready-for-agent

- [ ] Unit-Tests: Aus einer Folge von Inventar-Zuständen entstehen die richtigen Einträge. Jedes Ding erscheint nur beim ersten Erhalt, jeder Stufenwechsel wird festgehalten, und das Ende hat einen Grund.
- [ ] Jeder Eintrag hat Spielzeit und Echtzeit
- [ ] Ein Lauf im Szenario aus Ticket 01 erzeugt einen vollständigen Laufbericht im Ergebnisordner
- [ ] Ein Szenario mit sehr kurzem Zeitlimit endet mit dem Grund „Zeitlimit“ und einer Meldung im Chat
- [ ] Außerhalb der Simulation wird der Laufbericht neben der Konfiguration abgelegt
