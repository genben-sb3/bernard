# 010: Folgen glätten (Mikrostopps, Kurven schneiden)

**Status:** offen · **Blockiert von:** – · **Version:** 1 (Feinschliff)

## Problem
Aus der Auswertung von „folgen“:
- Beim Sprinten steht Bernard manchmal etwa 0,2 s still, bis die Wegfindung neu plant (Weg zu Ende, bevor Ben sich 0,75 Blöcke bewegt hat).
- Er schneidet Kurven und streift dabei Mauerecken, statt Bens Spur zu folgen.

- **Der Test ist wackelig**: „≤ 5 Blöcke in 90 % der Zeit“ schwankt am 2026-10-09 bei unverändertem Code zwischen 81 % und 100 % (main und Ticket-002-Branch gleichermaßen, unter Last öfter darunter). Ein Durchfallen von „folgen“ ist deshalb im Moment kein sicheres Zeichen für einen Rückschritt.

## Gewünscht
- Sofort neu planen, wenn ein Wegstück endet und der Abstand größer als der Zielabstand ist.
- Optional: Bens Spur (letzte Positionen) als Zwischenziele nutzen.

## Fertig, wenn
- Das Szenario „folgen“ misst Stillstände über 0,15 s während des Folgens, und es gibt keine.
