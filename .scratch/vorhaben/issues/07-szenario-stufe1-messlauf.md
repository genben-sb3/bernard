# 07: Szenario „stufe1“: der echte Messlauf

**What to build:** der vollständige Messlauf aus Spec 011 in der echten Testwelt. Ablauf: frische, normal generierte Welt mit festem Seed auf Schwierigkeit „normal“. Ein Kumpel sagt „spiel bis zur Steinzeit“, das Zeitlimit beträgt 30 Minuten Echtzeit. Während des Laufs prüft das Szenario auch das Zusammenspiel mit dem Kumpel: die Statusfrage, eine Unterbrechung durch einen Befehl samt Ansage beim Weitermachen sowie „stopp“ und „mach weiter“.

Das Ergebnis ist die **Ausgangsmessung**: Zeit bis Stufe 1, Tode und Rückfälle ohne jede Überlebenslogik. Dagegen tritt später die Überleben-Spec an. Ob Bernard die Stufe im Zeitlimit erreicht, ist ein Messwert und kein harter Testfehler. Ein Lauf ohne vollständigen Laufbericht ist dagegen ein Fehler.

**Blocked by:** 02 (Testwelt), 04 (Unterbrechen, pausieren, Status), 05 (Weiterziehen und Fehlschläge), 06 (Tod und Rückfall)

**Status:** erledigt

- [x] Das Szenario „stufe1“ läuft in der Weltart aus Ticket 02 mit festem Seed
- [x] Der Laufbericht enthält den Start, jedes erreichte Ding aus dem Soll-Inventar, Stufenwechsel, Tode und Rückfälle sowie das Ende mit Grund
- [x] Bei Erfolg: „Steinzeit geschafft“ im Chat, und das Soll-Inventar liegt per Server-Befehl geprüft vor
- [x] „was machst du?“ während des Laufs liefert eine sinnvolle Antwort
- [x] Eine Unterbrechung durch „komm her“ endet mit der Ansage beim Weitermachen. „stopp“ pausiert, „mach weiter“ setzt fort.
- [x] Die Ergebnisse von mindestens drei Läufen (Zeit bis Stufe 1, Tode, Rückfälle, Ende) sind als erste Ausgangsmessung in der Simulations-Doku oder im Ergebnisordner festgehalten

**Ergebnis (2026-10-09):** 5 Messläufe, keiner erreicht Stufe 1. Alle enden mit „gescheitert“, weil kein Platz für die Werkbank da ist (→ Ticket 012). Die Tabelle steht in `sim/LIESMICH.md` unter „Ausgangsmessung Stufe 1“. Die Prüfungen „Steinzeit geschafft“ und „Soll-Inventar liegt vor“ laufen nur bei Erfolg und kamen deshalb noch nie dran.
