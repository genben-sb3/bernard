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
Ein Abschnitt auf dem Weg zum Spielende: 1 Steinzeit, 2 Eisenzeit, 3 Diamantzeit, 4 Nether, 5 End. Welche Stufe Bernard erreicht hat, ergibt sich allein aus seinem Besitz.
_Avoid_: Level, Phase, Etappe

**Soll-Inventar**:
Die dauerhaften Dinge, die Bernard besitzen muss, damit eine Stufe als erreicht gilt. Ein besseres Werkzeug zählt für ein schlechteres derselben Art. Verbrauchsgüter gehören nicht hinein, sondern in den Vorrat.
_Avoid_: Checkliste, Anforderungen

**Vorrat**:
Verbrauchsgüter (z. B. Fackeln, Bruchstein, Holz), die Bernard für eine Stufe bereithält. Er füllt ihn auf, aber der Vorrat zählt nicht zur Stufe: Was er davon verbraucht, ist nie ein Rückfall.
_Avoid_: Reserve, Soll (für Verbrauchsgüter)

**Lager**:
Bernards fester Ort in der Welt: Kiste(n), aufgestellter Ofen und Werkbank. Was dort liegt oder steht, gehört zu seinem Besitz. Er legt es selbst an und sagt die Koordinaten im Chat an.
_Avoid_: Basis, Truhe, Depot

**Mine**:
Bernards gegrabener Weg zum Erz, vom Lager aus: eine Treppe nach unten und Stollen auf Erzhöhe. Er merkt sie sich und gräbt dort beim nächsten Mal weiter.
_Avoid_: Schacht, Tunnel, Höhle (Höhlen sind natürlich)

**Besitz**:
Alles, was Bernard hat: sein Inventar plus sein Lager. Daraus ergibt sich seine Stufe.
_Avoid_: Inventar (wenn das Lager mitgemeint ist)

**Rückfall**:
Bernard verliert Sachen (z. B. durch einen Tod) und steht danach auf einer niedrigeren Stufe.
_Avoid_: Reset, Verlust

**Laufbericht**:
Die Meilensteine eines Vorhabens mit Spiel- und Echtzeit: Start, erste Erhalte, Stufenwechsel, Tode, Rückfälle, Ende mit Grund. Nicht zu verwechseln mit dem Protokoll, dem technischen Debug-Log von Bernard und der Simulation.
_Avoid_: Log, Protokoll (für den Laufbericht)

**Entscheider**:
Der Teil von Bernard, der aus seinem Zustand den nächsten Schritt eines Vorhabens wählt. Er weiß nichts von der Welt außer diesem Zustand.
_Avoid_: Planer (das ist der Craft-Planer), KI, Brain
