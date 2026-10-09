# 012: Werkbank und Ofen auch in engen Stellen aufstellen

**Status:** offen · **Label:** ready-for-agent · **Blockiert von:** – · **Version:** 1 · **Priorität:** vor Spec 013 (Stufe 2), verfälscht sonst die Messläufe zu Stufe 1 (Ticket 07)

## Problem
Im ersten Messlauf zu Stufe 1 (Vorhaben-Ticket 07) hat Bernard nach 7,6 Minuten mit „Ich finde keinen Platz für die Werkbank“ aufgegeben. Laufbericht: Ende „gescheitert“. Er stand in einem 1×1-Loch, das er selbst gegraben hatte, bei (-15, 69, 1). Das Gelände ringsum lag auf y 71 bis 73.

`stelleAuf` (`src/craften.ts`) prüft nur die 8 Nachbarfelder auf Fußhöhe, die einen festen Block darunter haben. In einem Loch sind alle diese Felder fest. Werkbank und Ofen (`src/schmelzen.ts`) teilen sich diese Funktion, daher scheitern beide.

## Gewünscht
- Ist auf Fußhöhe kein Platz frei, sucht Bernard eine Ebene höher: ein fester Block auf Fußhöhe mit Luft darüber, den er von seinem Standort aus erreicht.
- Geht auch das nicht, schafft er sich Platz: Er gräbt einen Nachbarblock auf Fußhöhe ab oder steigt aus dem Loch. Er gibt nicht auf.
- Nach dem Craften oder Schmelzen nimmt er den Block wie bisher wieder mit.

## Fertig, wenn
- Szenario: Bernard steht in einem 1×1-Loch, zwei Blöcke tief, mit Holz im Inventar. Auf „mach eine Steinspitzhacke“ stellt er eine Werkbank auf, craftet und nimmt die Werkbank wieder mit.
- Dasselbe mit dem Ofen: Er steht im Loch, hat Roheisen und Kohle dabei, und „schmelz 1 Eisen“ gelingt.
- Die bisherigen Szenarien (werkzeug, besorgen, schmelzen, vorhaben) bleiben grün.
