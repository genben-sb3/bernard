# 013: Stufe 2 (Eisenzeit): Vorrat, Lager und Mine

**Status:** offen · **Label:** ready-for-agent · **Blockiert von:** 004 und 012 in `main`, 011 (Vorhaben-Tickets 01–07) · **Version:** 1 (Grilling vom 2026-10-09)

**Tickets:** aufgeteilt in `.scratch/eisenzeit/issues/` (01–07, siehe dortige INDEX.md).

## Problem Statement

Bernard kann ein Vorhaben bis zur Steinzeit verfolgen, aber nicht weiter. Für die Eisenzeit fehlt ihm dreierlei. Er kann kein Erz abbauen. Er hat keinen festen Ort, an dem Ofen, Werkbank und Überschuss bleiben. Und das Stufenmodell zählt Verbrauchsgüter mit: Verbaut Bernard ein paar Fackeln oder etwas Bruchstein, fällt er rechnerisch auf eine niedrigere Stufe zurück, obwohl er nichts verloren hat.

## Solution

Das Stufenmodell trennt das **Soll-Inventar** (dauerhafte Dinge, bestimmen die Stufe) vom **Vorrat** (Verbrauchsgüter, die Bernard auffüllt, die aber nicht zur Stufe zählen). Die Stufe ergibt sich aus Bernards **Besitz**, also aus Inventar und **Lager** (ADR 0002). Hat Bernard die Steinzeit erreicht, legt er dort, wo er steht, sein Lager an (Kiste, Ofen, Werkbank) und sagt die Koordinaten an. Vom Lager aus gräbt er eine **Mine**: eine Treppe hinunter auf Erzhöhe, dort Stollen. Fehlt ihm Roheisen, holt er es über `besorge` aus der Mine. Am Lager schmilzt und craftet er dann. Erreicht hat er die Eisenzeit, wenn er Eisenspitzhacke, Eisenschwert, Schild und Eimer besitzt.

## User Stories

1. Als Kumpel will ich „Bernard, spiel bis zur Eisenzeit“ sagen, damit er nach der Steinzeit selbstständig weiterspielt.
2. Als Kumpel will ich, dass Bernard die Eisenzeit ansagt („Eisenzeit geschafft.“), sobald er Eisenspitzhacke, Eisenschwert, Schild und Eimer besitzt.
3. Als Kumpel will ich, dass „besieg den Enderdrachen“ jetzt bis zur Eisenzeit läuft und Bernard erst dann sagt, dass er weiter noch nicht kann.
4. Als Kumpel will ich, dass Bernard nach Erreichen der Steinzeit ein Lager anlegt und mir die Koordinaten sagt („Mein Lager ist bei 120 64 -35.“), damit ich es finde.
5. Als Kumpel will ich „Bernard, wo ist dein Lager?“ fragen und die Koordinaten bekommen.
6. Als Kumpel will ich, dass die Antwort auf „wie weit bist du?“ das Lager mit nennt.
7. Als Kumpel will ich, dass Bernard das Lager behält, auch wenn ich das Vorhaben vergesse und ihm ein neues gebe, damit nicht in jeder Ecke eine Kiste steht.
8. Als Kumpel will ich, dass Bernard nur das beste Werkzeug jeder Art und den gerade nötigen Vorrat bei sich trägt und den Rest einräumt, damit er beim Tod wenig verliert.
9. Als Kumpel will ich, dass Bernard eine weitere Kiste neben die erste stellt, wenn das Lager voll ist.
10. Als Kumpel will ich, dass Bernard verbrauchte Fackeln und verbauten Bruchstein einfach nachholt, ohne dass das als Rückfall gilt.
11. Als Kumpel will ich, dass Bernard eine Treppe vom Lager nach unten gräbt (nie senkrecht) und unten Stollen mit Seitengängen anlegt, damit er sicher an Eisen kommt.
12. Als Kumpel will ich, dass Bernard in der Mine Fackeln setzt, damit dort weniger Monster entstehen.
13. Als Kumpel will ich, dass Bernard Lava und Wasser, die er sieht, mit Bruchstein zumauert, statt hineinzulaufen.
14. Als Kumpel will ich, dass Bernard jedes Eisen- und Kohleerz mitnimmt, das er sieht, und überflüssiges Gestein wegwirft, damit sein Inventar nicht vollläuft.
15. Als Kumpel will ich, dass Bernard so lange gräbt, bis er alles Eisen für die Stufe hat, und Überschuss ins Lager bringt.
16. Als Kumpel will ich, dass Bernard seine Mine wiederfindet und dort weitergräbt, statt jedes Mal eine neue anzufangen.
17. Als Kumpel will ich „Bernard, besorg 5 Eisen“ sagen können, und er holt es aus der Mine und schmilzt es.
18. Als Kumpel will ich, dass Bernard nach dem Tod zuerst zum Lager läuft und sich dort Ersatz holt.
19. Als Kumpel will ich, dass Bernard es meldet und das Vorhaben pausiert, wenn er wiederholt kein Eisen findet.
20. Als Kumpel will ich, dass Bernard einen Rückfall meldet, wenn im Lager etwas fehlt, das zu seiner Stufe gehört.
21. Als Experimentierender will ich im Laufbericht sehen: Lager angelegt (mit Koordinaten), Mine begonnen (Koordinaten, Zieltiefe), erstes Erz jeder Sorte, Rückfall durch Lagerverlust (getrennt vom Rückfall durch Tod) und jeden Gang in die Mine mit Dauer und Ausbeute.
22. Als Experimentierender will ich einen Messlauf, der mit dem Besitz der Steinzeit beginnt (Zeitlimit 45 Minuten), damit ich Stufe 2 für sich messen kann.
23. Als Experimentierender will ich einen vollen Lauf von null bis zur Eisenzeit (Zeitlimit 75 Minuten), damit ich die Übergänge zwischen den Stufen prüfe.

## Implementation Decisions

- **Begriffe:** Vorrat, Lager, Besitz und Mine stehen in `CONTEXT.md`. Die Regel „Stufe aus Besitz, ohne Vorrat“ steht in ADR 0002.
- **Stufen als Daten:** Jede Stufe hat zwei Listen, `soll` (dauerhaft, bestimmt die Stufe) und `vorrat` (Verbrauchsgüter, bestimmen die Stufe nicht).
  - Stufe 1, Soll-Inventar: Steinspitzhacke, Werkbank, Steinaxt, Steinschwert, Ofen. Vorrat: 16 Bruchstein, 16 Holz.
  - Stufe 2, Soll-Inventar: Eisenspitzhacke, Eisenschwert, Schild, Eimer. Vorrat: 32 Fackeln, 32 Bruchstein, 8 Kohle.
  - Neue Dinge: Eisenspitzhacke, Eisenschwert, Eisenaxt (für die Werkzeugränge), Schild, Eimer, Kiste, Eisenerz und Roheisen, Kohleerz. Jedes neue Ding bekommt englische Namen (`en`).
- **Stufenberechnung:** `aktuelleStufe(besitz)`, wobei Besitz Inventar plus gemerkter Lagerinhalt plus Lagerblöcke ist (aufgestellter Ofen und aufgestellte Werkbank zählen). Die Werkzeugränge gelten unverändert.
- **Lager:**
  - Bernard legt es an, sobald Stufe 1 erreicht ist und es noch kein Lager gibt, und zwar dort, wo er gerade steht: Kiste, Ofen und Werkbank nebeneinander. Er sagt die Koordinaten an.
  - Pro Welt gibt es ein Lager. Es gehört Bernard, nicht dem Vorhaben, und steht in einer Datei neben der Konfiguration, sodass es einen Neustart übersteht. Gespeichert werden Position, Kisten und gemerkter Inhalt.
  - Bei jedem Öffnen gleicht Bernard den gemerkten Inhalt mit dem tatsächlichen ab. Fehlt etwas, das zur Stufe gehört, ist das ein Rückfall durch Lagerverlust. Ist die Kiste oder ein Lagerblock zerstört, gilt dasselbe.
  - Ist die Kiste voll, stellt er eine weitere Kiste daneben.
  - Was Bernard trägt: das beste Werkzeug jeder Art und den Vorrat, den der aktuelle Schritt braucht. Alles andere räumt er ein, also Ersatzwerkzeug, Überschuss und schlechtere Werkzeuge.
- **Entscheider:** Die Priorität nach „Befehl läuft“ und „pausiert“ ist:
  1. Lager anlegen (Stufe 1 erreicht, kein Lager)
  2. Einräumen (Inventar fast voll oder Bernard ist am Lager)
  3. Vorrat auffüllen (ein Vorrat-Ding liegt unter der Hälfte)
  4. Das nächste fehlende Ding des Soll-Inventars, in der Reihenfolge aus den Daten
  - Neue Aktionen: `lagerAnlegen`, `einraeumen`, `zumLager`. Der Entscheider bekommt den Lagerinhalt als Teil des Zustands und bleibt eine pure Funktion.
- **Graben gehört in `besorge`:** Fehlt Roheisen (oder Kohle), geht Bernard in die Mine. Der Entscheider weiß nichts von Erz. Er sagt nur „besorge Eisenspitzhacke“, und `besorge` löst das auf: Eisenbarren schmelzen, dafür Roheisen, dafür die Mine. Schmelzen und Craften passieren am Lager.
- **Mine:**
  - Treppe vom Lager nach unten auf Y 16 (Version 26.1). Bernard gräbt nie senkrecht und setzt alle paar Blöcke eine Fackel.
  - Auf Y 16 ein Hauptgang mit Seitengängen alle 3 Blöcke.
  - Bernard baut jedes sichtbare Eisen- und Kohleerz ab. Kupfer nur, wenn er es braucht.
  - Lava und Wasser, die er sieht, mauert er mit Bruchstein zu. Fällt Kies nach, gräbt er weiter.
  - Gestein über den Vorrat hinaus wirft er weg.
  - Er gräbt, bis er alles Eisen für die Stufe hat, dann geht er die Treppe hoch zum Lager. Überschuss räumt er ein.
  - Die Mine merkt er sich in der Lagerdatei (Eingang, letzte Stollenposition) und gräbt beim nächsten Mal dort weiter.
  - Fehlschlag: 150 Blöcke Stollen ohne Eisen. Dann beginnt er einen neuen Hauptgang in eine andere Richtung. Nach 3 Fehlschlägen in Folge meldet er es und pausiert, nach derselben Regel wie in Spec 011.
- **Tod:** Bernard respawnt, läuft zuerst zum Lager, holt sich Ersatz und entscheidet dann neu. Ein Rückfall gilt nur, wenn danach etwas aus dem Soll-Inventar im gesamten Besitz fehlt.
- **Befehle:** „wo ist dein Lager?“ / „where is your base?“. Die Status-Antwort nennt das Lager mit. „spiel bis zur Eisenzeit“ erkennt Bernard schon.
- **Laufbericht, neue Einträge:**
  - `lagerAngelegt` (Koordinaten)
  - `mineBegonnen` (Koordinaten, Zieltiefe)
  - `ersterhalt` für Erze
  - `rueckfall` mit Grund `tod` oder `lager`
  - `minengang` (Start, Ende, Dauer, Ausbeute je Erz)

## Testing Decisions

- **Was einen guten Test ausmacht:** wie in Spec 011, nur äußeres Verhalten.
- **Seam 1: Stufen und Entscheider** (Unit-Tests):
  - Verbrauchter Vorrat ist kein Rückfall.
  - Was im Lager liegt, zählt zur Stufe.
  - Ein geleertes Lager ist ein Rückfall.
  - Stufe 1 ist erreicht und es gibt kein Lager, also lagerAnlegen.
  - Das Inventar ist fast voll, also einraeumen.
  - Ein Vorrat-Ding liegt unter der Hälfte, also auffüllen vor dem Soll-Inventar.
  - Ein Soll-Ding liegt im Lager, also zumLager statt besorgen.
  - Ein Eisenwerkzeug erfüllt das Steinwerkzeug.
- **Seam 2: Befehlserkennung** (Unit-Tests): „wo ist dein Lager?“ in beiden Sprachen.
- **Seam 3: Szenarien**:
  - `lager` (flache Welt): Bernard bekommt das Soll-Inventar der Steinzeit, legt ein Lager an, sagt die Koordinaten an und räumt ein. Danach wird die Kiste per Server-Befehl geleert, und Bernard meldet den Rückfall.
  - `mine` (normale Welt, fester Seed): „besorg 5 Eisen“ ergibt eine Treppe nach unten, einen Stollen, 5 Eisenbarren und eine Rückkehr zum Lager. Geprüft wird, dass Bernard nie senkrecht gräbt und dass Fackeln gesetzt sind.
  - `stufe2` (normale Welt, Start mit Besitz der Steinzeit, 45 Minuten): „Eisenzeit geschafft“, das Soll-Inventar im Besitz und ein vollständiger Laufbericht.
  - `stufe1bis2` (normale Welt, von null, 75 Minuten): der lange Lauf, nur ab und zu gestartet.

## Out of Scope

- Überleben: fliehen, wehren, essen, die Nacht, Sachen nach dem Tod zurückholen.
- Ein Bett im Lager als Respawn-Punkt (dafür braucht Bernard Wolle, also Schafe).
- „Bring mir X aus dem Lager“.
- Höhlen als Erzquelle.
- Eisenrüstung (sie wird Voraussetzung in Stufe 3).
- Geschützte Bereiche (Ticket 007). Vorhaben-Läufe gehören weiter in die Testwelt.

## Further Notes

- Das Umschneiden von Stufe 1 (Bruchstein und Holz wandern in den Vorrat) wird das erste Ticket. Vorhaben-Ticket 07 misst noch nach dem alten Schnitt und bleibt unverändert.
- Ticket 012 (Aufstellen in engen Stellen) ist Voraussetzung. Ohne es scheitern Werkbank und Ofen in Loch und Stollen.
- Die Zeitlimits von 45 und 75 Minuten sind Schätzungen und werden nach den ersten Messungen angepasst.
- Der Seed muss Eisen in erreichbarer Tiefe unter einer Stelle mit Bäumen und Stein haben. Er steht fest in den Szenarien.
