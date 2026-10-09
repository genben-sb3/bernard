# Bernards KI einrichten

Bernard versteht feste Befehle („Bernard, folge mir“) immer, auch ohne KI. Für freie Sätze („Bernard, kannst du mir zwei Leitern craften?“) braucht er ein Sprachmodell. Er spricht jede **OpenAI-kompatible Schnittstelle** an. Eingestellt wird das in `config/bernard.json` unter `"ki"`.

## Empfohlen: Ollama auf dem Gaming-PC (kostenlos, privat)

Bernard und der Server laufen auf dem Linux-PC. Das Modell läuft auf dem Gaming-PC, weil der eine Grafikkarte hat.

1. **Ollama installieren**: https://ollama.com/download/windows, Installer ausführen.
2. **Im Heimnetz erreichbar machen**: Windows-Suche → „Umgebungsvariablen für dieses Konto bearbeiten“ → Neu:
   - Name `OLLAMA_HOST`, Wert `0.0.0.0`
   - Danach Ollama beenden (Symbol unten rechts → Quit) und neu starten.
3. **Firewall**: Beim ersten Start fragt Windows nach. Den Zugriff für **private Netzwerke** erlauben. Falls die Frage nicht kam: „Windows Defender Firewall“ → „Eine App … zulassen“ → Ollama, Haken bei „Privat“.
4. **Modell laden**: Eingabeaufforderung öffnen und eintippen:
   ```
   ollama pull qwen2.5:7b
   ```
   Welches Modell zur Grafikkarte passt (Minecraft braucht selbst auch Grafikspeicher):

   | Grafikspeicher | Modell |
   |---|---|
   | 6 GB | `qwen2.5:3b` |
   | 8 GB | `qwen2.5:7b` |
   | 12 GB und mehr | `qwen2.5:14b` |

5. **IP-Adresse des Gaming-PCs**: In der Eingabeaufforderung `ipconfig` eintippen und die „IPv4-Adresse“ notieren, z. B. `192.168.1.20`.
6. **Bernard einstellen** in `config/bernard.json` auf dem Linux-PC:
   ```json
   "ki": { "url": "http://192.168.1.20:11434/v1", "modell": "qwen2.5:7b", "zeitlimitMs": 30000 }
   ```
7. **Prüfen** auf dem Linux-PC. Das schickt zehn typische Sätze an das Modell und zeigt, was es daraus macht und wie lange es braucht:
   ```
   npx tsx sim/diagnose-ki.ts http://192.168.1.20:11434/v1 qwen2.5:7b
   ```
   Jede Antwort sollte nur wenige Sekunden dauern.

Ist der Gaming-PC aus, sagt Bernard einmal „Mein KI-Kopf ist gerade nicht erreichbar“, und die festen Befehle funktionieren weiter.

## Alternative: kostenloser Cloud-Anbieter

Das ist schnell und braucht keine Grafikkarte. Dafür gehen die Chatnachrichten an den Anbieter, und es gibt Nutzungslimits. Beispiel Groq:

1. Unter https://console.groq.com einen API-Schlüssel anlegen.
2. In `config/bernard.json` (ein Modell mit „tool use“ wählen; welche es gerade gibt, zeigt die Groq-Konsole):
   ```json
   "ki": { "url": "https://api.groq.com/openai/v1", "modell": "<Modellname aus der Groq-Konsole>", "zeitlimitMs": 15000 }
   ```
3. Den Schlüssel **nicht** in die Datei schreiben, sondern beim Start setzen:
   ```
   BERNARD_KI_KEY=gsk_… npm run bernard
   ```

## Persönlichkeit

`config/persoenlichkeit.md` beschreibt, wie Bernard redet. Die Datei darfst du frei ändern.

## Ohne KI

Fehlt der Abschnitt `"ki"`, versteht Bernard nur die festen Befehle.
