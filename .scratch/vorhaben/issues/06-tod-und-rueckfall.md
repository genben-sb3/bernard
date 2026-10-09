# 06: Tod und Rückfall

**What to build:** Auf Schwierigkeit „normal“ stirbt Bernard. Das Vorhaben übersteht das: Bernard respawnt automatisch, und das Vorhaben bleibt aktiv. Der Entscheider sieht einfach ein kleineres Inventar und besorgt neu, was fehlt. Sinkt dadurch die Stufe, ist das ein **Rückfall**: Bernard sagt ihn an, zum Beispiel „Ich bin gestorben, zurück auf Stufe 0.“ Jeder Tod und jeder Rückfall steht im Laufbericht.

Sachen zurückholen gehört ausdrücklich nicht dazu, das kommt mit der Überleben-Spec.

**Blocked by:** 01 (Vorhaben starten und Stufe 1 erreichen), 03 (Laufbericht und Zeitlimit)

**Status:** erledigt

- [x] Unit-Tests: Ein Vergleich der Stufe vor und nach einem Inventarverlust erkennt den Rückfall. Ein Tod ohne Stufenverlust ist kein Rückfall.
- [x] Bernard respawnt nach dem Tod von selbst, und das Vorhaben läuft weiter
- [x] Ein Rückfall wird im Chat angesagt
- [x] Tod und Rückfall stehen mit Spielzeit und Echtzeit im Laufbericht
- [x] Szenario (flache Welt): Vorhaben läuft, Bernard wird per Server-Befehl getötet, nachdem er Werkzeug hat. Er respawnt, sagt den Rückfall an und erreicht trotzdem Stufe 1, und der Laufbericht enthält Tod und Rückfall.

**Entscheidung bei der Umsetzung (2026-10-09):** In einem Vorhaben bis Stufe 1 ist ein Rückfall nicht möglich. Das Vorhaben endet, sobald Stufe 1 erreicht ist, und ein Tod auf Stufe 0 ist kein Rückfall. Deshalb prüft das Szenario `tod` den Tod: Ansage „Ich bin gestorben, ich mach weiter …“, Respawn, Steinzeit trotzdem geschafft, Tod im Laufbericht, kein Rückfall. Rückfall und Rückfall-Ansage belegen die Unit-Tests (`stufen.test.ts`, `laufbericht.test.ts`, `vorhaben.test.ts`). Der Server leert das Inventar, bevor er den Tod meldet. Bernard merkt sich sein Inventar deshalb alle 500 ms (`merkeInventar`).
