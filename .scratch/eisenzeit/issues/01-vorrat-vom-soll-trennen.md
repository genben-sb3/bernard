# 01: Vorrat vom Soll-Inventar trennen (Stufe 1 neu schneiden)

**What to build:** Jede Stufe hat neben dem Soll-Inventar einen Vorrat. Der Vorrat sind Verbrauchsgüter, die Bernard auffüllt, die aber nicht zur Stufe zählen (ADR 0002). Stufe 1: Das Soll-Inventar sind Steinspitzhacke, Werkbank, Steinaxt, Steinschwert und Ofen. Vorrat: 16 Bruchstein, 16 Holz. Der Entscheider füllt den Vorrat auf. Ein Vorrat-Ding unter der Hälfte hat Vorrang vor dem nächsten Soll-Ding. Beim Erreichen einer Stufe ist der Vorrat einmal voll aufgefüllt.

**Blocked by:** –

**Status:** offen

- [ ] Unit-Tests Stufen: verbrauchter Vorrat ist kein Rückfall, und die Stufe hängt nur am Soll-Inventar
- [ ] Unit-Tests Entscheider: Vorrat unter der Hälfte wird vor dem Soll-Inventar aufgefüllt, ein voller Vorrat wird ignoriert
- [ ] Der Laufbericht nennt das erste Erhalten nur für Soll-Dinge, wie bisher
- [ ] Die Szenarien vorhaben, unterbrechen, weiterziehen und tod bleiben grün (Erwartungen an den neuen Schnitt anpassen)
- [ ] Vorhaben-Ticket 07 (der alte Messlauf) wird nicht umgeschrieben. Im Ticket steht ein Hinweis auf den neuen Schnitt
