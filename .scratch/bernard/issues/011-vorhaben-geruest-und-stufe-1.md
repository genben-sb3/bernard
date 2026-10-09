# 011: Vorhaben-Gerüst und Stufe 1 (Steinzeit)

**Status:** offen · **Label:** ready-for-agent · **Blockiert von:** 001 (`besorge` muss fertig und committet sein) · **Version:** 1 (Grilling vom 2026-10-09)

**Tickets:** aufgeteilt in `.scratch/vorhaben/issues/` (01–07, siehe dortige INDEX.md).

## Problem Statement

Bernard tut bisher nur, was ihm ein Kumpel gerade sagt. Er soll Minecraft aber irgendwann allein durchspielen können, bis zum Enderdrachen. Außerdem soll er eine Plattform für Experimente sein, auf der man messen kann, wie weit und wie schnell er kommt und wo er scheitert. Dafür fehlt ihm alles: ein langfristiges Ziel, eine Logik, die selbst den nächsten Schritt wählt, und eine Möglichkeit, einen Lauf vergleichbar festzuhalten.

## Solution

Ein Kumpel gibt Bernard ein **Vorhaben**, zum Beispiel „Bernard, besieg den Enderdrachen“ oder „Bernard, spiel bis zur Steinzeit“. Bernard arbeitet es selbstständig ab. Der Weg ist in fünf **Stufen** geteilt. Jede Stufe hat ein **Soll-Inventar**, und welche Stufe gilt, ergibt sich immer daraus, was Bernard gerade besitzt. Ein **Entscheider** wählt immer wieder den dringendsten nächsten Schritt. Ein Befehl eines Kumpels unterbricht das Vorhaben. Danach kündigt Bernard an, dass er weitermacht, und ein Kumpel kann ihn aufhalten. Stirbt Bernard, respawnt er und macht weiter. Jeder Lauf schreibt einen **Laufbericht** mit Meilensteinen und Zeiten. In dieser ersten Ausbaustufe ist nur Stufe 1 (Steinzeit) mit Inhalt gefüllt. Gemessen wird in einer frisch erzeugten, normalen Testwelt mit festem Seed auf Schwierigkeit „normal“.

## User Stories

1. Als Kumpel will ich „Bernard, besieg den Enderdrachen“ sagen, damit Bernard selbstständig auf das Spielende hinarbeitet.
2. Als Kumpel will ich „Bernard, spiel bis zur Steinzeit“ (oder eine andere Stufe) sagen, damit er nur bis zu einer bestimmten Stufe spielt und dann aufhört.
3. Als Kumpel will ich, dass Bernard beim Start das Vorhaben und die Zielstufe bestätigt, damit ich sehe, dass er mich verstanden hat.
4. Als Kumpel will ich, dass Bernard ehrlich sagt, wenn er eine Stufe noch nicht beherrscht („Weiter als bis zur Steinzeit kann ich noch nicht.“), damit ich nicht auf etwas warte, das nicht kommt.
5. Als Kumpel will ich, dass Bernard mit leerem Inventar anfangen kann, damit ein Lauf wirklich bei null beginnt.
6. Als Kumpel will ich, dass Bernard selbst entscheidet, was als Nächstes fehlt, damit ich ihm nicht jeden Schritt sagen muss.
7. Als Kumpel will ich, dass Bernard für Stufe 1 Steinspitzhacke, Steinschwert, Steinaxt, Werkbank, Ofen sowie 16 Bruchstein und 16 Holz Vorrat besorgt, damit er gut für die Eisenzeit gerüstet ist.
8. Als Kumpel will ich, dass Bernard ansagt, wenn er eine Stufe erreicht („Steinzeit geschafft.“), damit ich den Fortschritt mitbekomme.
9. Als Kumpel will ich, dass Bernard aufhört und es sagt, wenn er die Zielstufe erreicht hat, damit ein Lauf ein klares Ende hat.
10. Als Kumpel will ich, dass mein Befehl das Vorhaben sofort unterbricht, damit Bernard mir weiter wie gewohnt hilft.
11. Als Kumpel will ich, dass Bernard nach meinem Befehl ansagt, dass er mit dem Vorhaben weitermacht („Ich mach dann mit der Steinzeit weiter, mir fehlt noch eine Steinaxt.“), damit ich nicht überrascht bin, wenn er losläuft.
12. Als Kumpel will ich ihn mit „stopp“ oder „bleib“ anhalten, und das Vorhaben ist dann pausiert, damit er bei mir bleibt, bis ich ihn wieder brauche.
13. Als Kumpel will ich „mach weiter“ sagen, damit ein pausiertes Vorhaben fortgesetzt wird.
14. Als Kumpel will ich „vergiss das Vorhaben“ sagen, damit er es ganz beendet.
15. Als Kumpel will ich fragen „was machst du?“ oder „wie weit bist du?“, damit er mir Vorhaben, Stufe, nächstes Ziel und aktuelle Aktion nennt („Stufe 1, ich brauch noch eine Steinaxt, gerade hole ich Bruchstein.“).
16. Als Kumpel will ich, dass er auch ohne Vorhaben ehrlich antwortet („Ich hab gerade nichts vor.“), damit die Frage immer funktioniert.
17. Als Kumpel will ich, dass Bernard weiterzieht und anderswo sucht, wenn er in der Nähe kein Holz oder keinen Stein findet, damit er in einer echten Welt nicht stecken bleibt.
18. Als Kumpel will ich, dass Bernard nach einem Tod respawnt und mit dem Vorhaben weitermacht, damit ein Lauf auf „normal“ nicht beim ersten Zombie endet.
19. Als Kumpel will ich, dass Bernard nach einem Tod einfach neu besorgt, was ihm fehlt, damit seine Stufe immer zu seinem Inventar passt.
20. Als Kumpel will ich, dass Bernard einen Rückfall ansagt („Ich bin gestorben, zurück auf Stufe 0.“), damit ich weiß, was passiert ist.
21. Als Kumpel will ich, dass Bernard nicht endlos dasselbe versucht, wenn etwas immer wieder scheitert, sondern es meldet, damit ein Lauf nicht unbemerkt hängen bleibt.
22. Als Kumpel will ich, dass nur Kumpel ein Vorhaben geben, pausieren oder beenden dürfen, damit Fremde ihn nicht steuern.
23. Als Experimentierender will ich, dass jeder Lauf einen Laufbericht schreibt, damit ich Läufe nachträglich vergleichen kann.
24. Als Experimentierender will ich im Laufbericht Start und Ende mit Grund sehen (Zielstufe erreicht, abgebrochen, Zeitlimit), damit ich weiß, wie der Lauf ausging.
25. Als Experimentierender will ich im Laufbericht jeden Gegenstand des Soll-Inventars beim ersten Erhalt sehen, damit ich sehe, wo die Zeit hingeht.
26. Als Experimentierender will ich im Laufbericht jeden Stufenwechsel, jeden Rückfall und jeden Tod sehen, damit ich Schwachstellen erkenne.
27. Als Experimentierender will ich zu jedem Eintrag die Spielzeit und die Echtzeit sehen, damit ich beides auswerten kann.
28. Als Experimentierender will ich ein Zeitlimit pro Lauf (Standard 30 Minuten Echtzeit für Stufe 1), damit hängende Läufe von selbst enden.
29. Als Experimentierender will ich eine frisch erzeugte Testwelt mit festem Seed für jeden Lauf, damit Läufe vergleichbar sind.
30. Als Experimentierender will ich, dass diese Testwelt normal generiert ist und auf „normal“ läuft, damit die Messung dem echten Spiel entspricht.
31. Als Experimentierender will ich, dass die bisherigen Szenarien weiter in der flachen, friedlichen Welt laufen, damit sie nicht kaputtgehen.
32. Als Experimentierender will ich, dass der Entscheider ohne Bot testbar ist, damit ich seine Logik schnell und genau prüfen kann.
33. Als Experimentierender will ich, dass sich der Entscheider später austauschen lässt (fester Plan gegen KI-Plan), damit ich beide Ansätze vergleichen kann.
34. Als Entwickler will ich, dass Stufen und Soll-Inventare als Daten beschrieben sind, damit Stufe 2 bis 5 ohne Umbau dazukommen.

## Implementation Decisions

- **Neue Begriffe für `CONTEXT.md`:**
  - **Vorhaben:** ein langfristiges Ziel, das ein Kumpel Bernard gibt. Bernard verfolgt es selbstständig, solange kein Befehl läuft. Es ist aktiv, pausiert oder beendet.
  - **Stufe:** ein Abschnitt auf dem Weg zum Spielende: 1 Steinzeit, 2 Eisenzeit, 3 Diamantzeit, 4 Nether, 5 End.
  - **Soll-Inventar:** was Bernard besitzen muss, damit eine Stufe als erreicht gilt.
  - **Rückfall:** Bernard verliert Sachen und steht danach auf einer niedrigeren Stufe.
  - **Laufbericht:** die Meilensteine eines Laufs mit Zeiten. Bewusst nicht „Protokoll“, denn so heißt schon das technische Debug-Log von Bernard und der Simulation.
  - **Entscheider:** der Teil von Bernard, der den nächsten Schritt wählt.
- **Stufen als Daten:** Jede Stufe ist eine Liste aus Ding und Menge (Soll-Inventar), dazu kommen spätere Voraussetzungen. Die aktuelle Stufe ist die höchste Stufe N, für die die Soll-Inventare 1 bis N erfüllt sind. Werkzeuge einer höheren Materialstufe erfüllen die niedrigere, zum Beispiel erfüllt eine Eisenspitzhacke die Steinspitzhacke. Holz zählt über alle Sorten.
- **Soll-Inventar Stufe 1:** Steinspitzhacke, Steinschwert, Steinaxt, Werkbank, Ofen, 16 Bruchstein, 16 Holz. Alle diese Dinge kennt Bernard schon.
- **Entscheider:** eine pure Funktion ohne Abhängigkeit von Mineflayer, sinngemäß `naechsterSchritt(zustand) → Aktion | null`.
  - **Zustand:** Inventar (Ding und Anzahl), Leben, Hunger, Tageszeit, Dimension, Vorhaben (Zielstufe, aktiv/pausiert), ob ein Befehl läuft, und die jüngsten Fehlschläge (was, wo, wie oft).
  - **Aktionen in dieser Ausbaustufe:** `besorge(ding, menge)`, `weiterziehen` (eine Strecke in eine noch nicht besuchte Richtung laufen, dann neu suchen) und `melde(text)`.
  - **Prioritätsschleife:** Ein laufender Befehl geht vor, dann kommt ein pausiertes Vorhaben (keine Aktion), dann das nächste fehlende Ding der aktuellen Stufe. Später kommt das Überleben als höhere Priorität dazu, ohne den Rest zu ändern.
  - **Reihenfolge innerhalb einer Stufe:** fest in den Daten, sinnvoll aufsteigend (Werkzeuge vor Vorrat).
  - **Fehlschläge:** Nach `nichtGefunden` kommt `weiterziehen`. Scheitert dasselbe Ding mehrmals hintereinander, meldet Bernard das und das Vorhaben pausiert.
- **Ausführung:** Eine dünne Schleife mit Mineflayer liest den Zustand aus dem Bot, fragt den Entscheider und führt die Aktion mit den vorhandenen Fähigkeiten aus (`besorge` aus Ticket 001, Wegfindung). Sie läuft nur, solange kein Befehl läuft. Die Regel „ein neuer Befehl ersetzt den laufenden“ bleibt. Das Vorhaben ist kein Befehl, sondern läuft darunter weiter.
- **Nach einem Befehl:** Ist der Befehl erledigt, sagt Bernard an, womit er weitermacht, wartet kurz und läuft dann los. „stopp“ oder „bleib“ in dieser Zeit oder später pausiert das Vorhaben.
- **Neue Befehle in `erkenneBefehl`:** Vorhaben starten (Zielstufe 1 bis 5, „besieg den Enderdrachen“ entspricht Stufe 5), weitermachen, Vorhaben vergessen und Status abfragen. Formulierungen auf Deutsch und Englisch wie bisher. „stopp“ behält seine Bedeutung und pausiert zusätzlich ein Vorhaben.
- **Zielstufe über Stufe 1:** Bernard nimmt das Vorhaben an, spielt bis Stufe 1 und meldet dann, dass er weiter noch nicht kann. Im Laufbericht steht als Ende „Stufe nicht implementiert“.
- **Tod:** Bernard respawnt automatisch, das Vorhaben bleibt aktiv, und der Entscheider sieht einfach ein kleineres Inventar. Den Rückfall erkennt man am Vergleich der Stufe vor und nach dem Tod. Bernard sagt ihn an und trägt ihn in den Laufbericht ein. Sachen zurückholen gehört nicht dazu.
- **Laufbericht:** Bernard schreibt ihn bei jedem Vorhaben, nicht nur in der Simulation. In der Simulation landet er im Ergebnisordner des Laufs (`sim/ergebnisse/<lauf>/`), sonst in einem eigenen Ordner neben der Konfiguration. Ein Eintrag pro Zeile, maschinenlesbar, jeweils mit Spielzeit (Ticks) und Echtzeit.
- **Testwelt:** Die Simulation bekommt eine zweite Weltart neben der flachen, friedlichen: normal generiert, fester Seed, Schwierigkeit „normal“, für jeden Lauf frisch erzeugt. Jedes Szenario wählt seine Weltart. Die bestehenden Szenarien bleiben flach und friedlich.
- **Das Lager** (Kiste, Ofen, Bett, Ersatzausrüstung und Ressourcen) gehört an den Anfang von Stufe 2 und nicht hierher.

## Testing Decisions

- **Was einen guten Test ausmacht:** Getestet wird nur äußeres Verhalten. Beim Entscheider heißt das: Zustand rein, Aktion raus. Bei den Befehlen: Satz rein, Befehl raus. In der Simulation: was in der Welt und im Laufbericht passiert. Interne Strukturen und die Reihenfolge interner Aufrufe werden nicht getestet.
- **Seam 1: Entscheider** (Haupt-Seam, Unit-Tests, Vorbild: Tests des Craft-Planers). Abgedeckt werden:
  - leeres Inventar → besorge Holz bzw. das erste Werkzeug
  - fast vollständiges Soll-Inventar → besorge das fehlende Ding
  - vollständiges Soll-Inventar mit Zielstufe 1 → keine Aktion, Stufe erreicht
  - höherwertiges Werkzeug erfüllt ein niedrigeres
  - Holzsorten zählen zusammen
  - ein Befehl läuft → keine Aktion
  - Vorhaben pausiert → keine Aktion
  - nach `nichtGefunden` → weiterziehen
  - wiederholter Fehlschlag → melden und pausieren
  - Stufenberechnung vor und nach Inventarverlust (Rückfall)
- **Seam 2: Befehlserkennung** (Unit-Tests, Vorbild: bestehende Tests der Befehle). Abgedeckt werden alle neuen Formulierungen, die Zielstufen samt Enderdrache, sowie Sätze, die nicht erkannt werden dürfen.
- **Seam 3: Szenario „stufe1“** (Vorbild: Szenario „sammeln“, erweitert um die neue Weltart). Ablauf: frische Welt mit festem Seed auf „normal“, Kumpel sagt „spiel bis zur Steinzeit“, Zeitlimit 30 Minuten. Erwartet wird: Bernard meldet „Steinzeit geschafft“, das Soll-Inventar liegt per Server-Befehl geprüft vor, und der Laufbericht enthält Start, jedes Soll-Ding, den Stufenwechsel und das Ende mit Grund. Zusätzlich werden im Szenario „was machst du?“, die Unterbrechung durch einen Befehl samt Ansage beim Weitermachen sowie „stopp“ und „mach weiter“ geprüft.
- Die Fähigkeiten selbst (sammeln, besorgen, craften) bekommen hier keine neuen Tests. Sie haben eigene.

## Out of Scope

- Stufen 2 bis 5 mit Inhalt, also Erz, Schmelzen, Nether, End. Die Stufen sind nur als Namen angelegt.
- Das Lager (Anfang Stufe 2).
- Überleben: fliehen, sich wehren, essen, die Nacht, Sachen nach dem Tod zurückholen. Das ist die nächste Spec. Hier wird nur respawnt und weitergemacht.
- Erz abbauen (später Treppe und Gänge, Höhlen noch später).
- Ein Standard-Vorhaben ohne Befehl und mehr Eigeninitiative.
- KI-Entscheider und der Vergleich fester Plan gegen KI. Die Schnittstelle des Entscheiders ist dafür vorbereitet.
- Geschützte Bereiche (Ticket 007, zurückgestellt). Bis dahin gehören Vorhaben-Läufe in die Testwelt, nicht in die Welt der Kumpel.

## Further Notes

- Roadmap (Grilling vom 2026-10-09): 5 Stufen. Voraussetzungen vor dem Nether: volle Eisenrüstung, Eisenschwert, Feuerzeug, Essen. Vor der Festungssuche: genug Enderaugen. Vor dem End: volle Diamantrüstung, Diamant-Spitzhacke, -Schwert und -Axt, Bogen mit Pfeilen, Wassereimer, genug Essen. Später kommen niedrige Verzauberungen auf alles. Das Stufenmodell hier muss diese Voraussetzungen später aufnehmen können.
- Der Seed wird bei der Umsetzung gewählt: einer, bei dem Bäume und Stein vom Spawn aus erreichbar sind. Er steht fest im Szenario.
- Auf „normal“ wird Bernard in Stufe-1-Läufen öfter sterben, bevor es die Überleben-Spec gibt. Das ist gewollt: Tode und Rückfälle im Laufbericht sind die Ausgangsmessung, gegen die die Überleben-Spec antritt.
- Der Entscheider ist die Stelle, die ein KI-Plan später ersetzt (ADR 0001: KI-Logik getrennt vom Zugang zur Welt).
