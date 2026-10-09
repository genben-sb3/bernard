# 005: „bau“ für das spätere Bauen freihalten

**Status:** offen · **Blockiert von:** – · **Version:** 1 (klein)

## Problem
„bau mir eine Holzspitzhacke“ bedeutet im Moment craften (`CRAFTEN` in `src/befehle.ts`). Wenn Bernard später wirklich bauen soll („bau eine Hütte“), ist das Wort belegt, und die Bedeutung kippt für den Spieler.

## Gewünscht
- „bau“ craftet nur noch, wenn das Ding ein Gegenstand ist (Werkzeug, Werkbank …). Bei allem anderen antwortet Bernard „Bauen kann ich noch nicht.“
- Den Begriff „Bauen“ und den Unterschied zu „Craften“ in `CONTEXT.md` festhalten.

## Fertig, wenn
- Unit-Tests für beide Fälle.
