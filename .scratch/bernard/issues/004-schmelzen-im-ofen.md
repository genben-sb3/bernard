# 004: Schmelzen im Ofen (Eisen, Holzkohle, Glas)

**Status:** offen · **Blockiert von:** 001 (sinnvoll, nicht zwingend) · **Version:** 2

## Problem
Bernard kann keinen Ofen benutzen. Damit gibt es kein Eisen, keine Holzkohle (also keine Fackeln ohne Kohle) und kein Glas.

## Gewünscht
- „Bernard, schmelz 5 Eisen“ / „mach 4 Holzkohle“: Ofen in der Nähe benutzen oder (wie die Werkbank) aufstellen und wieder mitnehmen, Brennstoff wählen (Kohle, Holzkohle, sonst Bretter oder Stämme), warten, Ergebnis entnehmen.
- Ansage, wie lange es dauert (10 s pro Stück).
- Der Craft-Planer kennt Ofenrezepte als Zwischenschritte (Fackeln ohne Kohle → Holzkohle schmelzen).

## Hinweise
- Inventar-Klicks am Ofen haben dieselbe 26.x-Eigenheit wie beim Craften: vorher `warteAufInventarRuhe` (`src/ruhe.ts`).
- minecraft-data hat Ofenrezepte nicht in `recipes`. Die müssen aus einer eigenen kleinen Tabelle kommen.

## Fertig, wenn
- Szenario: Eisenerz und Kohle im Inventar → „schmelz 3 Eisen“ → 3 Eisenbarren, der Ofen ist wieder mitgenommen.
