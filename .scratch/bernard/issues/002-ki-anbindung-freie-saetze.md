# 002: KI-Anbindung für freie Sätze und unbekannte Gegenstände

**Status:** erledigt (Branch `ticket-002-ki-anbindung`) · **Blockiert von:** – · **Version:** 1

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

## Umsetzung
- `src/ki.ts`: OpenAI-kompatible Anbindung über `fetch`, ohne zusätzliche Bibliothek. Werkzeuge: follow_player, stop, come_here, gather, show_inventory, give_items, craft_item, say. Werkzeugnamen und Anweisung sind auf Englisch, weil kleine Modelle damit zuverlässiger sind. Die Antworten kommen in der Sprache der Nachricht.
- Robuste Auswertung: Werkzeugaufrufe, JSON im Text (`<tool_call>`) oder reiner Text. Mengen werden begrenzt, Synonyme für Materialien erkannt („stone“ → Bruchstein). Unbekannte Gegenstände führen zu einer Antwort statt zu Raten.
- Beliebige Minecraft-Gegenstände: `mc:<id>` (z. B. `mc:ladder`), aufgelöst über `dingAufloeser`. Bekannte Gegenstände behalten ihren deutschen Namen.
- Ablauf in `src/bernard.ts`: erst der Schnellweg, dann die KI. Nach 3 s ohne Antwort sagt Bernard „Hmm, Moment …“. Kommt inzwischen eine neuere Nachricht, wird die KI-Antwort verworfen. Ist die KI nicht erreichbar, meldet er das höchstens alle 5 min, und der Schnellweg funktioniert weiter.
- Schnellweg ignoriert jetzt Füllwörter („bleib mal da stehen“, „folg mir bitte“).
- Die KI bekommt das Inventar auch als Minecraft-IDs, damit sie beim Geben nichts erfindet.
- `config/bernard.json` → `"ki"`, `config/persoenlichkeit.md`, API-Schlüssel über `BERNARD_KI_KEY`. Einrichtung auf dem Gaming-PC: `docs/ki-einrichten.md`.
- Nebenbei behoben: Craften mit Wiederholungen (z. B. 2× Stöcke) scheiterte gelegentlich mit „missing ingredient“. Jetzt wird jede Wiederholung einzeln gecraftet, mit Warten und einem zweiten Versuch.

## Tests
- Unit-Tests mit nachgebauten KI-Antworten (`src/ki.test.ts`, `src/dinge.test.ts`).
- Szenario `ki` mit KI-Attrappe (`sim/ki-attrappe.ts`): folgen, stehen bleiben, Inventar, Leitern craften und hergeben, ablehnen, langsame Antwort („Moment“), überholte Antwort, Ausfall. Außerdem: Feste Befehle gehen nie an die KI.
- Echtes Modell `qwen2.5:3b` auf dem Linux-PC, nur CPU (`sim/diagnose-ki.ts`, 10 Sätze):
  - Bei ruhigem PC 2–7 s pro Antwort, die erste etwa 30 s (Modell laden). Unter Volllast (andere Prozesse) 1–2 min.
  - Nach den Verbesserungen werden alle 10 Sätze sinnvoll behandelt: 8 richtige Aktionen. „hau mal Ben“ und „bau mir ein Haus“ ergeben nur eine Antwort, keine Aktion. Die Formulierung des 3b-Modells ist manchmal holprig.
  - Vorher (alter Prompt, ohne Synonyme): 4 von 10 richtig.

## Offen
- Die Sprachqualität mit `qwen2.5:7b` auf der GPU des Gaming-PCs ist ungetestet. Prüfen mit `npx tsx sim/diagnose-ki.ts http://<IP>:11434/v1 qwen2.5:7b`.
- Die Antwortsprache des Schnellwegs ist weiterhin immer Deutsch (Ticket 003).
