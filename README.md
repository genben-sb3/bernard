# 🤖 Bernard

Ein KI-Begleiter für Minecraft, der **als eigener Spieler** in die Welt kommt.
Seine Kumpel geben ihm Befehle im Chat: „Bernard, folge mir“, „Bernard, crafte mir eine
Holzspitzhacke“ oder einfach in freien Sätzen. Mit einem **Vorhaben** spielt er
selbstständig weiter, zum Beispiel bis zur Steinzeit (die Eisenzeit ist in Arbeit).

Gebaut mit **TypeScript**, [Mineflayer](https://github.com/PrismarineJS/mineflayer) und einem
lokalen Sprachmodell über eine OpenAI-kompatible Schnittstelle (z. B. Ollama).

## Was Bernard kann

- **Folgen, sammeln, abbauen**: nimmt Holz nur von natürlichen Bäumen, Gebautes bleibt stehen
- **Craften und Schmelzen**: plant Rezepte und besorgt fehlendes Material selbst
- **Werkbank und Ofen aufstellen**, auch an engen Stellen
- **Freie Sätze verstehen** über ein Sprachmodell, feste Befehle gehen auch ohne KI
- **Vorhaben in Stufen**: Stufe 1 (Steinzeit) läuft, Stufe 2 (Eisenzeit) mit Vorrat, Lager und Mine ist in Arbeit
- **Gehorcht nur seinen Kumpeln**, und antwortet in der Sprache des Befehls

## Aufbau

| Ordner | Inhalt |
|---|---|
| `src/` | Bernard selbst: Befehle, Craft-Planung, Besorgen, Vorhaben |
| `sim/` | Simulation auf einem lokalen Testserver mit Testbots, Szenarien und Auswertung als Karte |
| `config/` | Einstellungen (Server, Kumpel, KI-Modell) und Bernards Persönlichkeit |
| `docs/` | Architektur-Entscheidungen und Anleitung für die KI |
| `CONTEXT.md` | Glossar: was Begriffe wie *Kumpel*, *Vorhaben* oder *Lager* genau bedeuten |

## Testen

- **Unit-Tests** mit Vitest: `npm test`
- **Szenarien** auf einem echten Testserver, ohne dass ein Mensch mitspielen muss:
  `npm run sim -- folgen` (weitere in [`sim/LIESMICH.md`](sim/LIESMICH.md))

## Starten

Voraussetzung: Node.js und ein Minecraft-Java-Server im Offline-Modus.

```sh
npm install
npm run bernard
```

Server, Kumpel und KI-Modell stehen in `config/bernard.json`. Wie man das Sprachmodell
einrichtet, steht in [`docs/ki-einrichten.md`](docs/ki-einrichten.md).
