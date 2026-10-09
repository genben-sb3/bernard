# 007: Geschützte Bereiche

**Status:** offen · **Label:** ready-for-agent · **Blockiert von:** – · **Version:** 1 (Interview Q25/Q27, geschärft im Grilling vom 2026-10-09)

## Problem Statement

Im Moment schützt nur die Regel „Holz nur von natürlichen Bäumen“ vor Gebautem. Erde, Sand und Bruchstein baut Bernard überall ab, auch aus dem Fundament einer Basis. Sobald er fehlendes Material fürs Craften selbst besorgt (Ticket 001) und später ein Vorhaben selbstständig verfolgt, entscheidet er selbst, wo er abbaut. Ohne Schutz kann man ihn nicht guten Gewissens in der Welt der Kumpel mitspielen lassen.

## Solution

Kumpel legen geschützte Bereiche komplett im Chat fest. Wer einen Bereich anlegt, stellt sich dorthin und sagt zum Beispiel „Bernard, schütze hier 50 als Basis“. Bernard nimmt die Position dieses Kumpels als Mitte, speichert den Bereich selbst und bestätigt ihn mit Name und Radius. Niemand muss Koordinaten kennen oder eine Datei anfassen. In geschützten Bereichen baut Bernard nichts ab und setzt nichts, egal ob er gerade einen Befehl ausführt, ein Vorhaben verfolgt oder nur einen Weg sucht. Die Bereiche gelten auch nach einem Neustart weiter.

## User Stories

1. Als Kumpel will ich mich in meine Basis stellen und „Bernard, schütze hier“ sagen, damit Bernard dort nichts abbaut, ohne dass ich Koordinaten kennen muss.
2. Als Kumpel will ich den Radius nennen können („schütze hier 50“), damit auch große Basen ganz geschützt sind.
3. Als Kumpel will ich, dass ohne Zahl ein sinnvoller Standard gilt (Radius 32), damit der kürzeste Befehl schon funktioniert.
4. Als Kumpel will ich einem Bereich einen Namen geben können („schütze hier 50 als Basis“), damit ich ihn später wiedererkenne.
5. Als Kumpel will ich, dass Bernard einem Bereich ohne Namen selbst einen gibt („Bereich 1“, „Bereich 2“ …), damit ich jeden Bereich trotzdem ansprechen kann.
6. Als Kumpel will ich, dass Bernard das Anlegen mit Name und Radius bestätigt („Basis ist geschützt, Radius 50.“), damit ich sofort merke, wenn er mich falsch verstanden hat.
7. Als Kumpel will ich, dass der Schutz über die ganze Höhe gilt (Zylinder), damit weder Keller noch Turm abgebaut werden.
8. Als Kumpel will ich fragen können „Bernard, welche Bereiche gibt es?“, damit ich weiß, was geschützt ist.
9. Als Kumpel will ich in dieser Liste zu jedem Bereich Name, Radius und die ungefähre Richtung und Entfernung von mir aus sehen („Basis: Radius 50, etwa 120 Blöcke nördlich“), damit ich mir nichts unter Koordinaten vorstellen muss.
10. Als Kumpel will ich, dass Bernard ehrlich sagt, wenn es keine Bereiche gibt, damit ich nicht glaube, etwas wäre geschützt.
11. Als Kumpel will ich einen Bereich mit „Bernard, gib die Basis frei“ aufheben, damit ich Platz wieder freigeben kann.
12. Als Kumpel will ich mit „Bernard, gib hier frei“ den Bereich aufheben, in dem ich gerade stehe, damit ich seinen Namen nicht kennen muss.
13. Als Kumpel will ich, dass Bernard das Aufheben bestätigt und den Namen nennt, damit ich sehe, welcher Bereich weg ist.
14. Als Kumpel will ich eine verständliche Meldung, wenn es den genannten Bereich nicht gibt oder ich in keinem stehe, damit ich nicht im Unklaren bleibe.
15. Als Kumpel will ich, dass jeder Kumpel jeden Bereich aufheben darf, egal wer ihn angelegt hat, damit wir uns nicht gegenseitig aussperren.
16. Als Spieler, der kein Kumpel ist, darf ich keine Bereiche anlegen, auflisten oder aufheben, damit Fremde den Schutz nicht aushebeln.
17. Als Kumpel will ich, dass Bernard in einem Bereich keine Blöcke für „hol …“-Befehle abbaut, damit unsere Basis heil bleibt.
18. Als Kumpel will ich, dass Bernard Material außerhalb sucht, wenn im Bereich welches läge, damit „hol 10 Erde“ trotzdem klappt.
19. Als Kumpel will ich eine klare Meldung, wenn Bernard außerhalb der Bereiche nichts Passendes findet, damit er nicht endlos sucht.
20. Als Kumpel will ich, dass auch das selbstständige Besorgen fehlender Zutaten (Ticket 001) den Schutz beachtet, damit „mach eine Steinspitzhacke“ nicht unseren Boden aufreißt.
21. Als Kumpel will ich, dass Bernard in einem Bereich auch nichts setzt, damit keine Erdsäulen oder Brücken mitten in unserer Basis entstehen.
22. Als Kumpel will ich, dass Bernard beim Wegfinden durch einen Bereich weder abbaut noch Blöcke setzt, damit auch das Laufen nichts kaputt macht.
23. Als Kumpel will ich, dass Bernard beim Craften im Bereich zuerst eine dort stehende Werkbank benutzt, damit er nichts aufstellen muss.
24. Als Kumpel will ich, dass Bernard ausnahmsweise seine eigene Werkbank im Bereich kurz aufstellen und danach wieder mitnehmen darf, damit Craften auch in der Basis klappt.
25. Als Kumpel will ich, dass Bernard die Werkbank nach dem Craften auch im Bereich wieder abbaut und aufhebt, damit nichts herumsteht.
26. Als Kumpel will ich, dass die Bereiche einen Neustart von Bernard überstehen, damit ich sie nicht jedes Mal neu anlegen muss.
27. Als Kumpel will ich, dass Bernard die Bereiche selbst in einer Datei speichert, damit ich nichts von Hand pflegen muss.
28. Als Kumpel will ich, dass ein Bereich nur in der Dimension gilt, in der er angelegt wurde, damit ein Schutz in der Oberwelt nicht zufällig den Nether sperrt.
29. Als Kumpel will ich, dass sich Bereiche überlappen dürfen, damit ich eine große Basis aus mehreren Kreisen schützen kann.
30. Als Kumpel will ich eine Meldung, wenn ein Name schon vergeben ist, damit nicht zwei Bereiche gleich heißen.
31. Als Kumpel will ich, dass Bernard „Ich sehe dich nicht“ sagt, wenn er meine Position nicht kennt, so wie bei „komm her“, damit kein Bereich an der falschen Stelle entsteht.
32. Als Kumpel will ich, dass die Kumpel-Liste weiter nur in der Konfigurationsdatei steht und nicht per Chat änderbar ist, damit niemand sich selbst zum Kumpel macht.
33. Als Kumpel will ich, dass ein neuer Schutzbefehl wie jeder Befehl den laufenden ersetzt, damit Bernard sich verhält wie gewohnt.
34. Als Entwickler will ich, dass der Schutz an einer zentralen Stelle geprüft wird, damit spätere Fähigkeiten (Vorhaben, Farmen, Erkunden) ihn automatisch beachten.
35. Als Entwickler will ich ein Simulations-Szenario für den Schutz, damit eine Verletzung im Lauf sofort auffällt.

## Implementation Decisions

- **Begriff:** „geschützter Bereich“ ist schon im Glossar (`CONTEXT.md`). Die Definition dort wird ergänzt: Der Schutz gilt fürs Abbauen und fürs Setzen. Vermieden werden „Zone“, „Claim“ und „Sperrgebiet“.
- **Form:** Kreis um die Mitte (x, z) mit Radius, über die volle Höhe, also ein Zylinder. Dazu gehört die Dimension, in der er angelegt wurde. Ein Block ist geschützt, wenn er in mindestens einem Bereich seiner Dimension liegt.
- **Mitte:** die auf Blöcke gerundete Position des Kumpels, der den Befehl gibt. Ohne Sichtkontakt antwortet Bernard wie bei „komm her“ und legt nichts an.
- **Standard-Radius:** 32, wenn keine Zahl genannt ist.
- **Namen:** optional. Ohne Namen vergibt Bernard „Bereich N“ mit der nächsten freien Nummer. Groß- und Kleinschreibung zählen beim Wiedererkennen nicht. Ist ein Name schon vergeben, legt Bernard nichts an und sagt das.
- **Aufheben:** „gib <Name> frei“ hebt den Bereich mit diesem Namen auf. „gib hier frei“ hebt alle Bereiche auf, in denen der Kumpel gerade steht, und nennt sie. Jeder Kumpel darf das.
- **Auflisten:** Zu jedem Bereich nennt Bernard Name, Radius sowie Richtung (8 Himmelsrichtungen) und gerundete Entfernung von der Position des fragenden Kumpels. Sieht Bernard den Kumpel nicht, nennt er die Koordinaten der Mitte.
- **Neues Modul „Schutzbereiche“:** ein tiefes Modul ohne Abhängigkeit von Mineflayer. Seine Schnittstelle sinngemäß: anlegen (Mitte, Radius, Name?, Dimension), auflisten, aufheben nach Name, aufheben an Position, `istGeschuetzt(position, dimension)`. Laden und Speichern laufen über einen schmalen Adapter, damit sich das Modul mit einer Datei im Temp-Verzeichnis testen lässt.
- **Speicherung:** eine eigene JSON-Datei neben der Konfiguration. Bernard liest sie beim Start und schreibt sie nach jeder Änderung neu. Die Kumpel-Liste bleibt in der Konfigurationsdatei und wird nicht per Chat verändert. Eine fehlende Datei bedeutet „keine Bereiche“.
- **Befehle:** `erkenneBefehl` lernt drei neue Befehlsarten: Bereich anlegen (Radius, Name optional), Bereiche auflisten, Bereich aufheben (Name oder „hier“). Deutsche und englische Formulierungen wie bei den übrigen Befehlen. Das Wort „hier“ ist Pflicht beim Anlegen, damit es nicht mit anderen Sätzen kollidiert.
- **Durchsetzung an einer Stelle:** Jedes Abbauen und Setzen durch Bernard läuft über eine zentrale Prüfung, die das Modul fragt. Betroffen sind Sammeln, das Besorgen fehlender Zutaten (Ticket 001) und Werkbank-Aufstellen bzw. -Abbauen. Beim Sammeln werden geschützte Blöcke schon bei der Suche übersprungen, nicht erst beim Abbauen.
- **Wegfinden:** Dieselbe Prüfung hängt an den Ausschlussbereichen von mineflayer-pathfinder fürs Abbauen und Setzen. Aktuell baut Bernard beim Laufen nichts ab und baut keine Türme. Die Anbindung sorgt dafür, dass das so bleibt, wenn diese Einschränkungen später fallen.
- **Werkbank-Ausnahme:** Bernard benutzt zuerst eine Werkbank in der Nähe. Gibt es keine, darf er seine eigene auch im Bereich auf einen freien Luftblock stellen und muss sie nach dem Craften wieder abbauen und aufheben. Das ist die einzige Ausnahme vom Schutz.
- **Laufende Aufgaben:** Wird ein Bereich angelegt, während Bernard sammelt, gilt der Schutz sofort für alle weiteren Blöcke. Weil ein neuer Befehl den laufenden ersetzt, bricht das Anlegen ohnehin die laufende Aufgabe ab.

## Testing Decisions

- **Was einen guten Test ausmacht:** Getestet wird nur äußeres Verhalten, also was ein Kumpel sagt und was Bernard dann tut oder antwortet, bzw. was das Modul zurückgibt. Interne Datenstrukturen und das Dateiformat werden nicht getestet.
- **Seam 1: Befehlserkennung** (Unit-Tests, Vorbild: die bestehenden Tests für sammeln, Inventar und geben). Abgedeckt werden Anlegen mit und ohne Radius und Namen, Auflisten, Aufheben nach Name und „hier“, englische Varianten und Sätze, die nicht erkannt werden dürfen.
- **Seam 2: Modul Schutzbereiche** (Unit-Tests, Vorbild: die Tests des Craft-Planers). Abgedeckt werden: innerhalb und außerhalb, der Rand des Kreises, jede Höhe, die Dimension, überlappende Bereiche, automatische Namen, doppelte Namen, Aufheben nach Name und an Position, Neuladen aus der Datei (Temp-Verzeichnis) und eine fehlende Datei.
- **Seam 3: Simulations-Szenario** (Vorbild: Szenario „sammeln“). Eine Testwelt mit Erde innerhalb und außerhalb eines Bereichs. Der Kumpel sagt „schütze hier 10 als Basis“, dann „hol 10 Erde“. Erwartet wird: Bernard bestätigt, holt 10 Erde, und kein Block im Bereich fehlt. Danach wird Bernard neu gestartet, und der Bereich gilt weiter: Ein erneutes „hol“ lässt ihn ebenfalls unberührt. Zusätzlich wird „welche Bereiche gibt es?“ und „gib die Basis frei“ im Chat geprüft.
- Die Werkbank-Ausnahme wird im Szenario mitgeprüft: Craften im Bereich ohne Werkbank in der Nähe lässt am Ende keine Werkbank und keinen fehlenden Block zurück.

## Out of Scope

- Erkennen, ob ein Block von einem Spieler gesetzt wurde, als automatisches Sicherheitsnetz. Das ist bewusst verworfen, weil es ohne Mod nicht zuverlässig geht.
- Andere Formen als Kreise, etwa Rechtecke oder Höhengrenzen.
- Rechte pro Bereich (wer darf was) und das Ändern der Kumpel-Liste per Chat.
- Schutz gegen andere Spieler. Der Bereich bindet nur Bernard.
- Bereiche verschieben oder umbenennen. Dafür hebt man einen auf und legt ihn neu an.
- Verhalten des Vorhabens (Roadmap Schritt 4 ff.). Es nutzt später nur die zentrale Prüfung.

## Further Notes

- Ticket 001 (fehlendes Material selbst besorgen) wird gerade umgesetzt. Die andere Session hat den Hinweis bekommen, Abbauen über eine zentrale Stelle laufen zu lassen. Diese Spec setzt darauf auf. Falls das dort nicht so gekommen ist, gehört das Bündeln zum ersten Schritt hier.
- Eine Obergrenze für den Radius ist nicht festgelegt. Bei sehr großen Radien findet Bernard eventuell kein Material mehr in Reichweite. Das deckt die Meldung aus Story 19 ab.
- Roadmap-Kontext: Dies ist Schritt 2 von 7 (danach Überleben, dann das Gerüst fürs Vorhaben).
