# 005: „bau“ für das spätere Bauen freihalten

**Status:** erledigt (Branch `ticket-005-bau-freihalten`) · **Blockiert von:** – · **Version:** 1 (klein)

## Problem
„bau mir eine Holzspitzhacke“ bedeutet im Moment craften (`CRAFTEN` in `src/befehle.ts`). Wenn Bernard später wirklich bauen soll („bau eine Hütte“), ist das Wort belegt, und die Bedeutung kippt für den Spieler.

## Gewünscht
- „bau“ craftet nur noch, wenn das Ding ein Gegenstand ist (Werkzeug, Werkbank …). Bei allem anderen antwortet Bernard „Bauen kann ich noch nicht.“
- Den Begriff „Bauen“ und den Unterschied zu „Craften“ in `CONTEXT.md` festhalten.

## Fertig, wenn
- Unit-Tests für beide Fälle.

## Umsetzung
- `src/befehle.ts`: Eigenes Muster `BAUEN` für „bau“, „baue“, „build“. Ist der Rest ein Gegenstand, den man herstellen kann, wird gecraftet („bau mir eine Holzspitzhacke“, „build me a crafting table“), sonst entsteht der neue Befehl `{ art: 'bauen' }`. „bau“ ist aus `CRAFTEN` entfernt, die Prüfung „herstellbar?“ steckt für beide Wege in `gegenstandZumCraften`.
- „bau“ mit Unbekanntem geht nicht mehr an die KI, sondern bekommt sofort die feste Antwort. „mach“ mit Unbekanntem geht weiter an die KI.
- `src/bernard.ts`: `bauen` antwortet nur „Bauen kann ich noch nicht.“ / "I can't build things yet." (`texte.ts` → `bauenNochNicht`) und unterbricht wie `status` weder einen laufenden Befehl noch das Vorhaben.
- `CONTEXT.md`: Begriffe **Craften** und **Bauen** mit ihrem Unterschied.

## Tests
- Unit-Tests (`src/befehle.test.ts`, „erkenneBefehl – bauen“): 4 Sätze, die craften (de + en), 6 Sätze, die Bauen sind (Hütte, Haus, Mauer, „bau mir 3 holz“, build a house/bridge), und „mach mir eine Hütte“ bleibt bei der KI. Spracherkennung für „bau eine Hütte“ / „build a house“.
- Szenarien `werkzeug`, `besorgen` und `englisch` erneut gelaufen, alle bestanden (2026-10-09).
