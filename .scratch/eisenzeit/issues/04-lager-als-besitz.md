# 04: Lager als Besitz: einräumen, holen, abgleichen

**What to build:** Was im Lager liegt oder steht, gehört zu Bernards Besitz und zählt zur Stufe. Bernard merkt sich den Inhalt in der Lagerdatei und gleicht ihn bei jedem Öffnen ab. Er trägt nur das beste Werkzeug jeder Art und den Vorrat, den der aktuelle Schritt braucht. Den Rest räumt er ein, sobald das Inventar fast voll ist oder er am Lager ist. Liegt ein fehlendes Soll-Ding im Lager, holt er es, statt es neu zu besorgen. Ist die Kiste voll, stellt er eine weitere daneben. Fehlt beim Abgleich etwas, das zur Stufe gehört, oder ist ein Lagerblock zerstört, ist das ein Rückfall durch Lagerverlust. Bernard sagt ihn an und trägt ihn in den Laufbericht ein.

**Blocked by:** 03

**Status:** offen

- [ ] Unit-Tests Stufen: Was im Lager liegt, zählt zur Stufe. Ein geleertes Lager ist ein Rückfall.
- [ ] Unit-Tests Entscheider: Das Inventar ist fast voll, also einraeumen. Ein Soll-Ding liegt im Lager, also zumLager statt besorgen.
- [ ] Szenario `lager`, Teil 2: Bernard räumt Ersatzwerkzeug ein. Die Kiste wird per Server-Befehl geleert, und beim nächsten Öffnen meldet Bernard den Rückfall.
- [ ] Szenario: Die Kiste ist voll, und Bernard stellt eine zweite daneben.
- [ ] Laufbericht: `rueckfall` mit Grund `lager`
