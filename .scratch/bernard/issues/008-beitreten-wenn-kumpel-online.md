# 008: Beitreten, wenn ein Kumpel online kommt

**Status:** offen · **Blockiert von:** – · **Version:** 1 (im Interview festgelegt, Q23)

## Problem
Bernard tritt im Moment bei, sobald man `npm run bernard` startet, und bleibt dann. Entschieden war: Er kommt, wenn ein Kumpel online ist, und geht, wenn keiner mehr da ist.

## Gewünscht
- Ein kleiner Wächter fragt den Server regelmäßig (Server-List-Ping, ohne beizutreten), wer online ist.
- Ist ein Kumpel da → Bernard tritt bei und begrüßt ihn. Ist keiner mehr da → kurze Wartezeit (z. B. 1 min), dann verlässt Bernard den Server.
- Wird Bernard rausgeworfen oder bricht die Verbindung ab, verbindet er sich neu, solange ein Kumpel online ist.

## Fertig, wenn
- Szenario: Ben tritt bei → Bernard kommt. Ben geht → Bernard geht nach der Wartezeit.
