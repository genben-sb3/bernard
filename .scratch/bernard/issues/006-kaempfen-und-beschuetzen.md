# 006: Kämpfen und Beschützen

**Status:** offen · **Blockiert von:** – · **Version:** 1 (im Interview festgelegt, Q12)

## Problem
„greif den Zombie an“ und „beschütze mich“ gehören zum Befehlsumfang von Version 1, sind aber nicht gebaut.

## Gewünscht (wie entschieden)
- „greif X an“: das nächste passende Monster angreifen. **Nie Spieler**, auch nicht auf Befehl (Q25).
- „beschütze mich“: beim Kumpel bleiben (wie Folgen) und Monster angreifen, die ihm oder Bernard nahekommen.
- Bestes Schwert aus dem Inventar nehmen, wenn eins da ist.
- Bei wenig Leben: zurückziehen und melden.

## Hinweise
- mineflayer-pvp ist seit 2022 nicht gepflegt. Mit den bisherigen 26.x-Eigenheiten (Blickrichtung erst im nächsten Tick, Physik-Patch) ist Ärger zu erwarten. Eventuell lieber eine eigene einfache Kampfschleife.
- Testserver: `difficulty=peaceful` und `spawn-monsters=false`. Das Szenario muss Monster gezielt per `summon` erzeugen und die Schwierigkeit umstellen.

## Fertig, wenn
- Szenario: 3 Zombies werden besiegt, Bernard überlebt, kein Spieler nimmt Schaden durch Bernard.
- Szenario: „greif Ben an“ → Bernard weigert sich.
