// Szenario (Vorhaben-Ticket 03): Ein Vorhaben mit sehr kurzem Zeitlimit endet mit dem Grund „Zeitlimit“.
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'
import { laufberichte } from './vorhaben'

const BODEN = -60

export const zeitlimit: Szenario = {
  name: 'zeitlimit',
  beschreibung: 'Bernard spielt mit 15 s Zeitlimit bis zur Steinzeit: Nach Ablauf sagt er Bescheid, hört auf, und der Laufbericht endet mit „zeitlimit“.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  zeitlimitMs: 15000,
  aufbau: [`place feature minecraft:oak 30 ${BODEN} 0`, `place feature minecraft:oak 34 ${BODEN} 6`],
  start: { Bernard: [-2, 0], Ben: [0, 0], Beobachter: [8, 2] },

  async ablauf({ ordner, beobachter: b, spieler }) {
    const vonBernard = (seit: number) => b.chatSeit(seit).filter(c => c.von === 'Bernard')
    b.setzePhase('Zeitlimit')
    const beginn = b.jetzt
    spieler.Ben.sage('Bernard, spiel bis zur Steinzeit')
    let meldung
    for (let t = 0; t < 30000 && !meldung; t += 250) {
      meldung = vonBernard(beginn).find(c => /zeit ist um/i.test(c.text))
      await warte(250)
    }
    const nach = meldung ? (meldung.t - beginn) / 1000 : Infinity
    b.pruefe('Bernard sagt nach etwa 15 s, dass die Zeit um ist', nach >= 14 && nach <= 20,
      meldung ? `„${meldung.text}“ nach ${nach.toFixed(1)} s` : 'keine Meldung in 30 s')

    const pos = b.position('Bernard')
    await warte(5000)
    b.pruefe('Danach hört er auf (bewegt sich nicht weiter)', abstand(pos, b.position('Bernard')) < 1,
      `${abstand(pos, b.position('Bernard')).toFixed(1)} Blöcke in 5 s`)

    const [bericht = []] = laufberichte(ordner)
    const ende = bericht.at(-1)
    b.pruefe('Der Laufbericht endet mit dem Grund „zeitlimit“', ende?.art === 'ende' && ende.grund === 'zeitlimit',
      `letzter Eintrag: ${JSON.stringify(ende ?? null)}`)
    b.pruefe('Der Laufbericht hat genau ein Ende', bericht.filter(e => e.art === 'ende').length === 1,
      `${bericht.filter(e => e.art === 'ende').length} Enden`)
  },
}
