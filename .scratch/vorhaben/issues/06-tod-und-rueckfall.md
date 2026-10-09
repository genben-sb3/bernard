# 06: Tod und Rückfall

**What to build:** Auf Schwierigkeit „normal“ stirbt Bernard. Das Vorhaben übersteht das: Bernard respawnt automatisch, und das Vorhaben bleibt aktiv. Der Entscheider sieht einfach ein kleineres Inventar und besorgt neu, was fehlt. Sinkt dadurch die Stufe, ist das ein **Rückfall**: Bernard sagt ihn an, zum Beispiel „Ich bin gestorben, zurück auf Stufe 0.“ Jeder Tod und jeder Rückfall steht im Laufbericht.

Sachen zurückholen gehört ausdrücklich nicht dazu, das kommt mit der Überleben-Spec.

**Blocked by:** 01 (Vorhaben starten und Stufe 1 erreichen), 03 (Laufbericht und Zeitlimit)

**Status:** ready-for-agent

- [ ] Unit-Tests: Ein Vergleich der Stufe vor und nach einem Inventarverlust erkennt den Rückfall. Ein Tod ohne Stufenverlust ist kein Rückfall.
- [ ] Bernard respawnt nach dem Tod von selbst, und das Vorhaben läuft weiter
- [ ] Ein Rückfall wird im Chat angesagt
- [ ] Tod und Rückfall stehen mit Spielzeit und Echtzeit im Laufbericht
- [ ] Szenario (flache Welt): Vorhaben läuft, Bernard wird per Server-Befehl getötet, nachdem er Werkzeug hat. Er respawnt, sagt den Rückfall an und erreicht trotzdem Stufe 1, und der Laufbericht enthält Tod und Rückfall.
