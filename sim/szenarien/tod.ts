// Szenario (Vorhaben-Ticket 06): Bernard stirbt mitten im Vorhaben, respawnt, sagt es an und schafft die Steinzeit trotzdem.
// Ein Rückfall ist hier nicht möglich (vor Stufe 1 endet das Vorhaben nicht), ihn prüfen die Unit-Tests.
import type { Rcon } from 'rcon-client'
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'
import { laufberichte } from './vorhaben'

const BODEN = -60
const SPAWN: [number, number] = [-2, 0]
// Mehr Bäume und Stein als im Szenario „vorhaben“: Nach dem Tod besorgt Bernard alles ein zweites Mal
const BAEUME: Array<[number, number]> = [[14, -8], [18, 4], [22, -4], [16, 14], [24, 10], [10, -16], [26, -14], [28, 2], [20, 20], [12, 22]]
const STEINFELD = { x1: 4, z1: 8, x2: 10, z2: 16 } // 63 Blöcke

const SOLL: Array<[string, number]> = [
  ['stone_pickaxe', 1], ['stone_axe', 1], ['stone_sword', 1], ['crafting_table', 1], ['furnace', 1], ['cobblestone', 16], ['#minecraft:logs', 16],
]

async function anzahl(rcon: Rcon, gegenstand: string) {
  return Number((await rcon.send(`clear Bernard ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

export const tod: Szenario = {
  name: 'tod',
  beschreibung:
    'Bernard spielt bis zur Steinzeit und wird getötet, sobald er eine Steinspitzhacke hat. Er respawnt, sagt den Tod an, ' +
    'macht mit demselben Vorhaben weiter, besorgt alles neu und schafft die Steinzeit. Der Laufbericht enthält den Tod.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [
    ...BAEUME.map(([x, z]) => `place feature minecraft:oak ${x} ${BODEN} ${z}`),
    `fill ${STEINFELD.x1} ${BODEN} ${STEINFELD.z1} ${STEINFELD.x2} ${BODEN} ${STEINFELD.z2} stone`,
  ],
  start: { Bernard: SPAWN, Ben: [0, 0], Beobachter: [8, 2] },

  async ablauf({ ordner, rcon, beobachter: b, spieler }) {
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
    await rcon.send(`spawnpoint Bernard ${SPAWN[0]} ${BODEN} ${SPAWN[1]}`)

    // 1. Vorhaben bis zur ersten Steinspitzhacke
    b.setzePhase('Bis zur Steinspitzhacke')
    const beginn = b.jetzt
    ben.sage('Bernard, spiel bis zur Steinzeit')
    let spitzhacke = false
    for (let t = 0; t < 300000 && !spitzhacke; t += 1000) {
      spitzhacke = (await anzahl(rcon, 'stone_pickaxe')) > 0
      if (!spitzhacke) await warte(1000)
    }
    b.pruefe('Bernard baut sich eine Steinspitzhacke', spitzhacke, spitzhacke ? 'hat eine' : 'keine in 5 min')
    if (!spitzhacke) return

    // 2. Tod
    b.setzePhase('Tod')
    const todBeginn = b.jetzt
    await rcon.send('kill Bernard')
    await warte(1000)
    await rcon.send('kill @e[type=item]') // Sachen zurückholen gehört nicht zu diesem Ticket
    const ansage = await warteAufChat(todBeginn, /gestorben/i, 5000)
    b.pruefe('Bernard sagt an, dass er gestorben ist und weitermacht', !!ansage && /weiter/i.test(ansage.text) && !/neue befehle/i.test(ansage.text),
      ansage ? `„${ansage.text}“` : 'keine Ansage in 5 s')
    await warte(2000)
    // Gleich nach dem Respawn läuft er wieder los: Es reicht, dass er nach dem Tod einmal am Spawn stand
    const spawn = { x: SPAWN[0] + 0.5, y: BODEN, z: SPAWN[1] + 0.5 }
    const amSpawn = b.probenSeit(todBeginn).find(p => abstand(p.positionen.Bernard, spawn) < 1.5)
    b.pruefe('Bernard respawnt von selbst am Spawn', !!amSpawn,
      amSpawn ? `nach ${((amSpawn.t - todBeginn) / 1000).toFixed(1)} s` : `nie am Spawn, zuletzt bei ${JSON.stringify(b.position('Bernard'))}`)
    const leer = (await anzahl(rcon, 'stone_pickaxe')) === 0
    b.pruefe('Nach dem Tod ist das Inventar weg', leer, leer ? 'keine Steinspitzhacke mehr' : 'hat noch eine Steinspitzhacke')

    // 3. Weitermachen bis zur Steinzeit
    b.setzePhase('Weiter bis zur Steinzeit')
    const ende = await warteAufChat(todBeginn, /geschafft|aufhören|höre|schief/i, 600000)
    b.pruefe('Bernard schafft die Steinzeit trotzdem', !!ende && /steinzeit geschafft/i.test(ende.text),
      ende ? `„${ende.text}“ nach ${((ende.t - todBeginn) / 1000).toFixed(0)} s` : 'keine Meldung in 10 min')
    const fehlt: string[] = []
    for (const [gegenstand, soll] of SOLL) {
      const hat = await anzahl(rcon, gegenstand)
      if (hat < soll) fehlt.push(`${gegenstand} ${hat}/${soll}`)
    }
    b.pruefe('Das Soll-Inventar der Steinzeit liegt vor', fehlt.length === 0, fehlt.length === 0 ? 'vollständig' : `fehlt: ${fehlt.join(', ')}`)
    b.notiere(`Bernards Meldungen: ${vonBernard(beginn).map(c => `„${c.text}“`).join(' ')}`)
    b.karte('Gesamter Vorhaben-Lauf', beginn)

    // 4. Laufbericht
    const berichte = laufberichte(ordner)
    b.pruefe('Es bleibt ein einziges Vorhaben (ein Laufbericht)', berichte.length === 1, `${berichte.length} Laufberichte`)
    const [bericht = []] = berichte
    const tode = bericht.filter(e => e.art === 'tod')
    const mitZeit = tode.every(e => typeof e.spielzeit === 'number' && typeof e.echtzeit === 'string')
    b.pruefe('Der Laufbericht enthält den Tod mit Spiel- und Echtzeit', tode.length === 1 && mitZeit, JSON.stringify(tode))
    b.pruefe('Kein Rückfall: Bernard war beim Tod noch auf Stufe 0', !bericht.some(e => e.art === 'rueckfall') && tode[0]?.stufe === 0,
      bericht.map(e => e.art).join(', '))
    const letzter = bericht.at(-1)
    b.pruefe('Der Laufbericht endet mit „zielErreicht“', letzter?.art === 'ende' && letzter.grund === 'zielErreicht', JSON.stringify(letzter ?? null))
  },
}
