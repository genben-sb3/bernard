# 06: Tod mit Lager

**What to build:** Nach dem Respawn läuft Bernard zuerst zum Lager, holt sich Ersatz für fehlende Soll-Dinge und den nötigen Vorrat und entscheidet dann neu. Ein Rückfall gilt nur, wenn danach im gesamten Besitz etwas aus dem Soll-Inventar fehlt. Sachen dort zurückholen, wo er gestorben ist, gehört weiter nicht dazu.

**Blocked by:** 04

**Status:** offen

- [ ] Unit-Tests: Tod mit Ersatz im Lager ist kein Rückfall. Tod ohne Ersatz ist ein Rückfall mit Grund `tod`.
- [ ] Szenario (flache Welt, Lager mit Ersatz-Steinspitzhacke): Bernard wird per Server-Befehl getötet, läuft zum Lager, holt den Ersatz und macht weiter. Im Laufbericht steht ein Tod, aber kein Rückfall.
