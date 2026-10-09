# 03: Lager anlegen und wiederfinden

**What to build:** Ist Stufe 1 erreicht und hat Bernard noch kein Lager, legt er eines dort an, wo er steht: Kiste, Ofen und Werkbank nebeneinander. Er sagt die Koordinaten an („Mein Lager ist bei 120 64 -35.“). Das Lager gehört Bernard, nicht dem Vorhaben. Es steht pro Welt in einer Datei neben der Konfiguration und übersteht einen Neustart. Ein neues Vorhaben nutzt dasselbe Lager. „wo ist dein Lager?“ / „where is your base?“ nennt die Koordinaten. Die Status-Antwort nennt das Lager mit. Ab jetzt nutzt Bernard zum Craften und Schmelzen Ofen und Werkbank am Lager, sofern sie in der Nähe sind.

**Blocked by:** 01

**Status:** offen

- [ ] Unit-Tests Entscheider: Stufe 1 ist erreicht und es gibt kein Lager, also lagerAnlegen. Gibt es schon ein Lager, wird kein neues angelegt.
- [ ] Unit-Tests Befehle: „wo ist dein Lager?“ in beiden Sprachen
- [ ] Szenario `lager` (flache Welt), Teil 1: Bernard hat das Soll-Inventar der Steinzeit. Er legt ein Lager an und sagt die Koordinaten an, und Kiste, Ofen und Werkbank stehen dort. Nach einem Neustart von Bernard kennt er das Lager noch.
- [ ] Laufbericht: `lagerAngelegt` mit Koordinaten
