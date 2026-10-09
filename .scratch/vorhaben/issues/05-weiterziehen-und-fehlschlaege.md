# 05: Weiterziehen und wiederholte Fehlschläge

**What to build:** In einer echten Welt liegt nicht alles in Reichweite. Meldet `besorge`, dass Bernard etwas in der Nähe nicht findet, zieht er weiter: Er läuft eine Strecke in eine Richtung, in der er noch nicht gesucht hat, und versucht es dort erneut. Scheitert dasselbe Ding mehrmals hintereinander, meldet Bernard das im Chat (was fehlt und dass er nicht weiterkommt) und pausiert das Vorhaben, damit ein Lauf nicht unbemerkt hängen bleibt.

Der Zustand des Entscheiders enthält dafür die jüngsten Fehlschläge: was, wo und wie oft. Es gibt zwei neue Aktionen, „weiterziehen“ und „melden“.

**Blocked by:** 01 (Vorhaben starten und Stufe 1 erreichen)

**Status:** ready-for-agent

- [ ] Unit-Tests für den Entscheider:
  - nach einem „nicht gefunden“ → weiterziehen
  - die Richtung meidet schon besuchte Gegenden
  - nach mehrmaligem Fehlschlag desselben Dings → melden und pausieren
  - nach einem Erfolg ist der Fehlschlag-Zähler für dieses Ding zurückgesetzt
- [ ] Szenario (flache Welt): Bäume stehen nur außerhalb der Suchreichweite vom Start. Bernard zieht weiter, findet sie und erreicht Stufe 1.
- [ ] Szenario: Es gibt keinen Stein in der Welt. Bernard meldet nach einigen Versuchen, dass er keinen findet, und das Vorhaben ist pausiert, ohne Endlosschleife.
- [ ] Wenn Ticket 03 schon fertig ist, landen Weiterziehen und Aufgeben im Laufbericht
