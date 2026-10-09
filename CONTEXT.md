# Bernard

Ein KI-gesteuerter Begleiter, der als eigener Spieler einer Minecraft-Welt beitritt und Befehle seiner Kumpel ausführt.

## Language

**Bernard**:
Der KI-gesteuerte Begleiter: eine eigene Spielfigur in der Welt, getrennt von den Accounts der Menschen.
_Avoid_: Bot, Agent, sekundärer Account, Begleiter (als Eigenname)

**Spieler**:
Jeder Mensch, der in derselben Welt wie Bernard spielt.
_Avoid_: User, Mitspieler

**Kumpel**:
Ein Spieler auf Bernards Liste, dessen Befehle Bernard befolgt. Allen anderen Spielern gehorcht er nicht.
_Avoid_: Freund, Owner, Master, Besitzer, erlaubter Spieler

**Befehl**:
Eine Anweisung eines Kumpels an Bernard im Ingame-Chat, die mit „Bernard“ beginnt oder ihm privat geschickt wird. Ein neuer Befehl ersetzt den laufenden sofort.
_Avoid_: Kommando, Prompt, Auftrag

**Craften**:
Einen Gegenstand (Werkzeug, Werkbank, Ofen, Bretter …) aus Material herstellen, im Inventar oder an der Werkbank. Das Ergebnis landet in Bernards Inventar. Im Chat: „mach“, „crafte“, „stell … her“ und auch „bau“, solange das Ding ein Gegenstand ist („bau mir eine Holzspitzhacke“).
_Avoid_: Herstellen (als Begriff), Bauen (für Gegenstände)

**Bauen**:
Blöcke in die Welt setzen, sodass ein Bauwerk entsteht („bau eine Hütte“). Das Ergebnis steht in der Welt, nicht im Inventar. Kann Bernard noch nicht; auf „bau“ mit etwas, das kein Gegenstand ist, antwortet er „Bauen kann ich noch nicht.“
_Avoid_: Craften (für Bauwerke), Konstruieren, Errichten

**Geschützter Bereich**:
Ein von Kumpeln festgelegtes Gebiet der Welt, in dem Bernard keine Blöcke abbaut.
_Avoid_: Zone, Claim, Sperrgebiet

**Natürlicher Baum**:
Ein Baum, der von selbst gewachsen ist (erkennbar an Blättern, die kein Spieler gesetzt hat). Nur von natürlichen Bäumen nimmt Bernard Holz; Gebautes aus Holz bleibt stehen.
_Avoid_: echter Baum, wilder Baum

**Vorhaben**:
Ein langfristiges Ziel, das ein Kumpel Bernard gibt, z. B. „spiel bis zur Steinzeit“ oder „besieg den Enderdrachen“. Bernard verfolgt es selbstständig in Stufen, solange kein anderer Befehl läuft.
_Avoid_: Mission, Quest, Auftrag, Ziel (als Begriff)

**Stufe**:
Ein Abschnitt auf dem Weg zum Spielende: 1 Steinzeit, 2 Eisenzeit, 3 Diamantzeit, 4 Nether, 5 End. Welche Stufe Bernard erreicht hat, ergibt sich allein daraus, was er gerade besitzt.
_Avoid_: Level, Phase, Etappe

**Soll-Inventar**:
Was Bernard besitzen muss, damit eine Stufe als erreicht gilt. Ein besseres Werkzeug zählt für ein schlechteres derselben Art.
_Avoid_: Checkliste, Anforderungen

**Rückfall**:
Bernard verliert Sachen (z. B. durch einen Tod) und steht danach auf einer niedrigeren Stufe.
_Avoid_: Reset, Verlust

**Laufbericht**:
Die Meilensteine eines Vorhabens mit Spiel- und Echtzeit: Start, erste Erhalte, Stufenwechsel, Tode, Rückfälle, Ende mit Grund. Nicht zu verwechseln mit dem Protokoll, dem technischen Debug-Log von Bernard und der Simulation.
_Avoid_: Log, Protokoll (für den Laufbericht)

**Entscheider**:
Der Teil von Bernard, der aus seinem Zustand den nächsten Schritt eines Vorhabens wählt. Er weiß nichts von der Welt außer diesem Zustand.
_Avoid_: Planer (das ist der Craft-Planer), KI, Brain
