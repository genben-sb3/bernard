// Szenario (Vorhaben-Ticket 04): Das Vorhaben lebt mit den Befehlen der Kumpel zusammen.
// Statusfrage, „komm her“ unterbricht und Bernard macht mit Ansage weiter, „stopp“ pausiert, „mach weiter“, „vergiss“.
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'
import { laufberichte } from './vorhaben'

const BODEN = -60
const BAEUME: Array<[number, number]> = [[14, -8], [18, 4], [22, -4], [16, 14], [24, 10], [10, -16]]
const STEINFELD = { x1: 4, z1: 8, x2: 10, z2: 14 }

export const unterbrechen: Szenario = {
  name: 'unterbrechen',
  beschreibung:
    'Während „spiel bis zur Steinzeit“: „was machst du?“ nennt Stufe, was fehlt und was er gerade tut; ein Fremder kann nichts beenden; ' +
    '„komm her“ unterbricht, danach sagt Bernard das Weitermachen an und läuft wieder los; „stopp“ hält ihn an, „mach weiter“ setzt fort; ' +
    '„vergiss das Vorhaben“ beendet es (Laufbericht: vergessen).',
  spieler: ['Ben', 'Fremder'],
  kumpel: ['Ben'],
  aufbau: [
    ...BAEUME.map(([x, z]) => `place feature minecraft:oak ${x} ${BODEN} ${z}`),
    `fill ${STEINFELD.x1} ${BODEN} ${STEINFELD.z1} ${STEINFELD.x2} ${BODEN} ${STEINFELD.z2} stone`,
  ],
  start: { Bernard: [-2, 0], Ben: [0, 0], Fremder: [-4, -6], Beobachter: [8, 2] },

  async ablauf({ ordner, beobachter: b, spieler }) {
    const ben = spieler.Ben
    const vonBernard = (seit: number) => b.chatSeit(seit).filter(c => c.von === 'Bernard')
    const warteAufChat = async (seit: number, muster: RegExp, maxMs: number) => {
      for (let t = 0; t < maxMs; t += 250) {
        const zeile = vonBernard(seit).find(c => muster.test(c.text))
        if (zeile) return zeile
        await warte(250)
      }
      return undefined
    }
    const meldungen = (seit: number) => vonBernard(seit).map(c => `„${c.text}“`).join(' ') || '–'
    /** Ob Bernard in dieser Zeit arbeitet: sich mindestens 2 Blöcke bewegt oder etwas abbaut. */
    const arbeitet = async (maxMs: number) => {
      const seit = b.jetzt
      const pos = b.position('Bernard')
      for (let t = 0; t < maxMs; t += 250) {
        if (b.abgebautSeit(seit).length > 0 || abstand(pos, b.position('Bernard')) >= 2) return true
        await warte(250)
      }
      return false
    }

    // 1. Vorhaben starten, warten, bis er arbeitet
    b.setzePhase('Vorhaben läuft')
    let beginn = b.jetzt
    ben.sage('Bernard, spiel bis zur Steinzeit')
    for (let i = 0; i < 120 && b.abgebautSeit(beginn).length === 0; i++) await warte(250)

    // 2. Statusfrage (unterbricht nichts) und ein Fremder, der nichts zu sagen hat
    b.setzePhase('Status')
    beginn = b.jetzt
    ben.sage('Bernard, was machst du?')
    const status = await warteAufChat(beginn, /stufe/i, 5000)
    b.pruefe('„was machst du?“ nennt Stufe, was fehlt und was er gerade tut',
      !!status && /stufe \d/i.test(status.text) && /fehlen/i.test(status.text) && /gerade/i.test(status.text), status ? `„${status.text}“` : 'keine Antwort')
    spieler.Fremder.sage('Bernard, vergiss das Vorhaben')
    await warte(1500)
    b.pruefe('Ein Fremder kann das Vorhaben nicht beenden', !vonBernard(beginn).some(c => /vergesse/i.test(c.text)) && await arbeitet(15000),
      meldungen(beginn))

    // 3. „komm her“ unterbricht, danach Ansage und weiter
    b.setzePhase('Unterbrechen')
    beginn = b.jetzt
    ben.sage('Bernard, komm her')
    let da = -1
    for (let i = 0; i < 80; i++) {
      await warte(250)
      if (abstand(b.position('Ben'), b.position('Bernard')) <= 3) { da = (i + 1) / 4; break }
    }
    b.pruefe('„komm her“ unterbricht das Vorhaben, Bernard kommt', da >= 0, da >= 0 ? `nach ${da} s da` : 'nach 20 s nicht da')
    const ansage = await warteAufChat(beginn, /mach dann weiter/i, 8000)
    b.pruefe('Danach sagt er an, womit er weitermacht', !!ansage, ansage ? `„${ansage.text}“` : meldungen(beginn))
    b.pruefe('… und läuft wieder los', await arbeitet(15000), meldungen(beginn))
    b.karte('3 – Unterbrechen', beginn)

    // 4. „stopp“ pausiert
    b.setzePhase('Stopp')
    await warte(2000)
    beginn = b.jetzt
    ben.sage('Bernard, stopp')
    await warte(1500)
    const stillAb = b.jetzt
    const pos = b.position('Bernard')
    await warte(8000)
    b.pruefe('„stopp“: Bernard bleibt auch nach 8 s stehen', abstand(pos, b.position('Bernard')) < 1 && b.abgebautSeit(stillAb).length === 0,
      `${abstand(pos, b.position('Bernard')).toFixed(1)} Blöcke bewegt, ${b.abgebautSeit(stillAb).length} Blöcke abgebaut; ${meldungen(beginn)}`)
    ben.sage('Bernard, was machst du?')
    const pausiert = await warteAufChat(stillAb, /mach weiter/i, 5000)
    b.pruefe('Der Status sagt, dass er auf „mach weiter“ wartet', !!pausiert, pausiert ? `„${pausiert.text}“` : meldungen(stillAb))

    // 5. „mach weiter“
    b.setzePhase('Mach weiter')
    beginn = b.jetzt
    ben.sage('Bernard, mach weiter')
    b.pruefe('„mach weiter“: Bernard setzt fort', await arbeitet(15000), meldungen(beginn))

    // 6. „vergiss das Vorhaben“
    b.setzePhase('Vergessen')
    beginn = b.jetzt
    ben.sage('Bernard, vergiss das Vorhaben')
    const vergessen = await warteAufChat(beginn, /vergesse/i, 5000)
    await warte(1000)
    ben.sage('Bernard, was machst du?')
    const nichts = await warteAufChat(beginn, /nichts vor/i, 5000)
    b.pruefe('Nach „vergiss das Vorhaben“: „Ich hab gerade nichts vor.“', !!vergessen && !!nichts, meldungen(beginn))
    const [bericht = []] = laufberichte(ordner)
    const ende = bericht.at(-1)
    b.pruefe('Der Laufbericht endet mit dem Grund „vergessen“', ende?.art === 'ende' && ende.grund === 'vergessen', JSON.stringify(ende ?? null))
    const ruhig = b.jetzt
    const posRuhig = b.position('Bernard')
    await warte(5000)
    b.pruefe('Danach tut er nichts mehr', abstand(posRuhig, b.position('Bernard')) < 1 && b.abgebautSeit(ruhig).length === 0,
      `${abstand(posRuhig, b.position('Bernard')).toFixed(1)} Blöcke bewegt`)
  },
}
