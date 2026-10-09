# 01: Vorrat vom Soll-Inventar trennen (Stufe 1 neu schneiden)

**What to build:** Jede Stufe hat neben dem Soll-Inventar einen Vorrat. Der Vorrat sind Verbrauchsgüter, die Bernard auffüllt, die aber nicht zur Stufe zählen (ADR 0002). Stufe 1: Das Soll-Inventar sind Steinspitzhacke, Werkbank, Steinaxt, Steinschwert und Ofen. Vorrat: 16 Bruchstein, 16 Holz. Der Entscheider füllt den Vorrat auf, und zwar so:
- Den Vorrat einer Stufe besorgt Bernard erst, wenn er die Stufe erreicht hat.
- Fällt ein Vorrat-Ding einer erreichten Stufe unter die Hälfte, füllt Bernard es ganz auf, bevor er am nächsten Soll-Ding arbeitet.
- Den Vorrat der Zielstufe füllt er vor dem Ende einmal ganz auf. Dann sagt er „Mein Vorrat ist aufgefüllt, ich höre mit dem Vorhaben auf.“

„Steinzeit geschafft“ kommt weiterhin, sobald das Soll-Inventar komplett ist.

**Blocked by:** –

**Status:** erledigt

- [x] Unit-Tests Stufen: verbrauchter Vorrat ist kein Rückfall, und die Stufe hängt nur am Soll-Inventar
- [x] Unit-Tests Entscheider: Vorrat unter der Hälfte wird vor dem Soll-Inventar aufgefüllt, ein voller Vorrat wird ignoriert
- [x] Der Laufbericht nennt das erste Erhalten nur für Soll-Dinge, wie bisher
- [x] Die Szenarien vorhaben, unterbrechen, weiterziehen und tod bleiben grün (Erwartungen an den neuen Schnitt anpassen)
- [ ] Vorhaben-Ticket 07 (der alte Messlauf) wird nicht umgeschrieben. Im Ticket steht ein Hinweis auf den neuen Schnitt
