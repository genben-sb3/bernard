// Szenario: Bernard folgt Ben um eine Mauer herum, bleibt auf „stopp“ stehen, kommt auf
// geflüstertes „komm her“ und ignoriert Befehle von Fremden.
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'

const BODEN = -60 // Füße stehen auf dem Gras der flachen Welt

export const folgen: Szenario = {
  name: 'folgen',
  beschreibung:
    'Bernard ignoriert einen Fremden, folgt Ben um eine Mauer herum, bleibt auf „stopp“ stehen und kommt auf geflüstertes „komm her“.',
  spieler: ['Ben', 'Fremder'],
  kumpel: ['Ben'],
  aufbau: [
    // Mauer quer zum Weg, 3 Blöcke hoch: Bernard muss außen herum
    `fill 8 ${BODEN} -6 8 ${BODEN + 2} 10 stone_bricks`,
  ],
  start: {
    Bernard: [-3, 0],
    Ben: [0, 0],
    Fremder: [0, 6],
    Beobachter: [6, 4],
  },

  async ablauf({ beobachter: b, spieler }) {
    const ben = spieler.Ben
    const fremder = spieler.Fremder
    const bernardPos = () => b.position('Bernard')
    const antwortVonBernard = (seit: number, an?: string) =>
      b.chatSeit(seit).find(c => c.von === 'Bernard' && (an === undefined || c.an === an))

    // 1. Ein Fremder versucht, Bernard zu befehlen
    b.setzePhase('Fremder gibt Befehl')
    let beginn = b.jetzt
    const vorher = bernardPos()
    fremder.sage('Bernard, folge mir')
    await fremder.geheZu(-12, 10)
    await warte(2000)
    const bewegt = abstand(vorher, bernardPos())
    b.pruefe('Bernard ignoriert den Fremden', bewegt < 1 && !antwortVonBernard(beginn),
      `Bernard hat sich ${bewegt.toFixed(1)} Blöcke bewegt` +
      (antwortVonBernard(beginn) ? ` und geantwortet: „${antwortVonBernard(beginn)!.text}“` : ' und nichts gesagt'))
    b.karte('1 – Fremder gibt Befehl', beginn)

    // 2. Ben: „folge mir“, dann um die Mauer herum
    b.setzePhase('Folgen')
    beginn = b.jetzt
    ben.sage('Bernard, folge mir')
    await warte(3000)
    const antwort = antwortVonBernard(beginn)
    b.pruefe('Bernard bestätigt „folge mir“', !!antwort, antwort ? `„${antwort.text}“` : 'keine Antwort in 3 s')
    const laufBeginn = b.jetzt
    for (const [x, z] of [[4, -9], [14, -9], [16, 4], [6, 14], [-6, 12]] as const) {
      await ben.geheZu(x, z)
    }
    await warte(3000) // Bernard holt auf
    const abstaende = b.probenSeit(laufBeginn + 2000).map(p => abstand(p.positionen.Ben, p.positionen.Bernard))
    const nah = abstaende.filter(a => a <= 5).length / abstaende.length
    const max = Math.max(...abstaende)
    b.pruefe('Bernard bleibt dicht dran (≤ 5 Blöcke in 90 % der Zeit)', nah >= 0.9,
      `${Math.round(nah * 100)} % der Zeit ≤ 5 Blöcke, größter Abstand ${max.toFixed(1)}`)
    const amEnde = abstand(b.position('Ben'), bernardPos())
    b.pruefe('Bernard steht am Ende neben Ben (≤ 3 Blöcke)', amEnde <= 3, `Abstand am Ende ${amEnde.toFixed(1)}`)
    b.karte('2 – Folgen um die Mauer', beginn)

    // 3. „stopp“, dann läuft Ben weg
    b.setzePhase('Stopp')
    beginn = b.jetzt
    ben.sage('Bernard, stopp')
    await warte(1500)
    const stoppPos = bernardPos()
    await ben.geheZu(-18, -6)
    await warte(2000)
    const nachStopp = abstand(stoppPos, bernardPos())
    b.pruefe('Bernard bleibt nach „stopp“ stehen', nachStopp < 1, `nach „stopp“ ${nachStopp.toFixed(1)} Blöcke bewegt`)
    b.karte('3 – Stopp, Ben läuft weg', beginn)

    // 4. Geflüstert: „komm her“
    b.setzePhase('Komm her (geflüstert)')
    beginn = b.jetzt
    ben.fluestere('Bernard', 'komm her')
    let angekommen = -1
    for (let i = 0; i < 40; i++) {
      await warte(500)
      if (abstand(b.position('Ben'), bernardPos()) <= 3) { angekommen = (i + 1) * 0.5; break }
    }
    const fluesterAntwort = antwortVonBernard(beginn, 'Ben')
    b.pruefe('Bernard antwortet per Flüstern', !!fluesterAntwort,
      fluesterAntwort ? `„${fluesterAntwort.text}“` : 'keine geflüsterte Antwort an Ben')
    b.pruefe('Bernard kommt in 20 s zu Ben', angekommen >= 0,
      angekommen >= 0 ? `nach ${angekommen} s angekommen` : `nach 20 s noch ${abstand(b.position('Ben'), bernardPos()).toFixed(1)} Blöcke entfernt`)
    b.karte('4 – Komm her', beginn)
  },
}
