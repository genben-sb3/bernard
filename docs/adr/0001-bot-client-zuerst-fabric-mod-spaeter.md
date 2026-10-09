# Bernard startet als eigenständiger Bot-Client, der Fabric-Mod kommt später

Bernard betritt die Welt zuerst als eigenständiger Mineflayer-Client (Node.js), der sich wie ein normaler Spieler mit einem Offline-Modus-Server verbindet. Ein serverseitiger Fabric-Mod mit Fake-Spieler soll später folgen. Mineflayer liefert Wegfindung, Abbauen, Kampf und Inventar fertig mit, sodass Bernard in Tagen statt Monaten spielbar ist. Ein Fabric-Mod bräuchte keinen Account und würde auch in geöffneten LAN-Welten laufen, müsste diese Fähigkeiten aber weitgehend selbst bauen und bei jeder Minecraft-Version nachgezogen werden.

## Consequences

- Die KI-Logik (Befehle verstehen, Aufgaben planen) bleibt vom Weg in die Welt getrennt, damit ein späterer Fabric-Mod sie wiederverwenden kann.
- Bis der Mod existiert, braucht Bernard einen Server im Offline-Modus. Geöffnete LAN-Welten im Online-Modus funktionieren nicht ohne Weiteres.
- Bedrock-Spieler werden über Geyser auf dem Java-Server unterstützt, nicht über eine eigene Bedrock-Version von Bernard.
