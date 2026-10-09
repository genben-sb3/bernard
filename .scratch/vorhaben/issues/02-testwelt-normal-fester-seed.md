# 02: Testwelt: normal generiert, fester Seed, frisch pro Lauf

**What to build:** Die Simulation kann neben der bisherigen flachen, friedlichen Welt eine zweite Weltart erzeugen. Diese ist normal generiert, hat einen festen Seed, läuft auf Schwierigkeit „normal“ und wird für jeden Lauf frisch erzeugt. Jedes Szenario legt fest, in welcher Weltart es läuft. Die bestehenden Szenarien (folgen, sammeln, Werkzeug, besorgen) laufen unverändert flach und friedlich. Dafür wird ein Seed gewählt, bei dem vom Spawn aus Bäume und Stein erreichbar sind, und fest hinterlegt.

Das Ziel sind vergleichbare Messläufe: gleicher Seed, gleicher Start, Bedingungen wie im echten Spiel.

**Blocked by:** Ticket 001 des Bernard-Trackers muss committet sein, weil die andere Session gerade an derselben Stelle der Simulation arbeitet. Fachlich gibt es keine Blocker, das Ticket kann parallel zu 01 laufen.

**Status:** erledigt

- [x] Ein Szenario kann die Weltart „normal mit festem Seed“ wählen, Standard bleibt flach und friedlich
- [x] Jeder Lauf mit der neuen Weltart beginnt in einer frisch erzeugten Welt, Reste früherer Läufe sind weg
- [x] Die Schwierigkeit ist „normal“, und Monster spawnen
- [x] Mini-Szenario: Bernard betritt die frische Welt am erwarteten Spawn, und vom Spawn aus ist ein natürlicher Baum in Reichweite
- [x] Alle bestehenden Szenarien laufen weiter wie bisher
- [x] Der gewählte Seed und wie man ihn ändert, ist in der Simulations-Doku (LIESMICH) beschrieben
