# 002: KI-Anbindung für freie Sätze und unbekannte Gegenstände

**Status:** offen · **Blockiert von:** – · **Version:** 1

## Problem
Bernard versteht nur feste Muster („hol 10 Holz“) und Gegenstände aus seiner Wortliste (`src/dinge.ts`). „Bernard, kannst du mir bitte ein paar Fackeln besorgen?“ oder „hol mir 5 Diamanten“ beantwortet er mit „Das verstehe ich noch nicht.“

## Gewünscht (wie im Interview entschieden)
- Schnellweg bleibt: Was die festen Muster erkennen, läuft weiter ohne KI.
- Alles andere geht an ein Sprachmodell über eine OpenAI-kompatible Schnittstelle (Standard: Ollama auf dem Gaming-PC im Heimnetz, alternativ Groq/Gemini/OpenRouter), einstellbar in `config/bernard.json`.
- Das Modell übersetzt den Satz in einen der bekannten Befehle (Werkzeugaufruf), inklusive Minecraft-Gegenstandsnamen, die nicht in der Wortliste stehen.
- Ist die KI nicht erreichbar, sagt Bernard das einmal kurz, und der Schnellweg funktioniert weiter.
- Bei Unklarheit rät Bernard vernünftig und sagt an, was er tut. Nur wenn Raten gefährlich wäre, fragt er nach.

## Hinweise
- Ollama unterstützt Werkzeugaufrufe, aber kein `tool_choice`. Die Antwort muss robust geparst werden.
- Auf dem Linux-PC gibt es keine GPU. Für die Simulation braucht es ein kleines Modell auf der CPU oder ein Test-Double, das feste Antworten liefert.

## Fertig, wenn
- Unit-Tests mit Test-Double: freie Sätze → richtige Befehle.
- Simulation mit echtem kleinem Modell: drei freie Sätze werden richtig ausgeführt.
- Die Antwortzeit wird im Bericht gemessen.
