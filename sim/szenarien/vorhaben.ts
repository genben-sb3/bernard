// Szenario (Vorhaben-Ticket 01): Bernard spielt mit leerem Inventar selbstständig bis zur Steinzeit.
import type { Rcon } from 'rcon-client'
import { Vec3 } from 'vec3'
import type { Szenario } from '../szenario'
import { warte } from '../testspieler'

const BODEN = -60
const BAEUME: Array<[number, number]> = [[14, -8], [18, 4], [22, -4], [16, 14], [24, 10], [10, -16]]
const STEINFELD = { x1: 4, z1: 8, x2: 10, z2: 14 } // 49 Blöcke: 16 für Werkzeuge und Ofen, 16 Vorrat, Rest Puffer

const SOLL: Array<[string, number]> = [
  ['stone_pickaxe', 1], ['stone_axe', 1], ['stone_sword', 1], ['crafting_table', 1], ['furnace', 1], ['cobblestone', 16], ['#minecraft:logs', 16],
]

async function anzahl(rcon: Rcon, gegenstand: string) {
  return Number((await rcon.send(`clear Bernard ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

export const vorhaben: Szenario = {
  name: 'vorhaben',
  beschreibung:
    'Bernard bekommt mit leerem Inventar das Vorhaben „spiel bis zur Steinzeit“, besorgt sich das Soll-Inventar ' +
    '(Steinspitzhacke, Steinaxt, Steinschwert, Werkbank, Ofen, 16 Bruchstein, 16 Holz) selbst und meldet „Steinzeit geschafft“. ' +
    'Danach: „besieg den Enderdrachen“ → er sagt, dass er schon bei der Steinzeit ist, aber weiter noch nicht kann.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [
    ...BAEUME.map(([x, z]) => `place feature minecraft:oak ${x} ${BODEN} ${z}`),
    `fill ${STEINFELD.x1} ${BODEN} ${STEINFELD.z1} ${STEINFELD.x2} ${BODEN} ${STEINFELD.z2} stone`,
  ],
  start: {
    Bernard: [-2, 0],
    Ben: [0, 0],
    Beobachter: [8, 2],
  },

  async ablauf({ rcon, beobachter: b, spieler }) {
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

    // 1. Bis zur Steinzeit
    b.setzePhase('Spiel bis zur Steinzeit')
    let beginn = b.jetzt
    ben.sage('Bernard, spiel bis zur Steinzeit')
    const bestaetigt = await warteAufChat(beginn, /steinzeit/i, 5000)
    b.pruefe('Bernard bestätigt das Vorhaben', !!bestaetigt, bestaetigt ? `„${bestaetigt.text}“` : 'keine Antwort in 5 s')
    const ende = await warteAufChat(beginn, /geschafft|aufhören|höre|schief/i, 600000)
    b.pruefe('Bernard meldet „Steinzeit geschafft“', !!ende && /steinzeit geschafft/i.test(ende.text),
      ende ? `„${ende.text}“ nach ${((ende.t - beginn) / 1000).toFixed(0)} s` : 'keine Meldung in 10 min')
    const fehlt: string[] = []
    for (const [gegenstand, soll] of SOLL) {
      const hat = await anzahl(rcon, gegenstand)
      if (hat < soll) fehlt.push(`${gegenstand} ${hat}/${soll}`)
    }
    b.pruefe('Das Soll-Inventar der Steinzeit liegt vor', fehlt.length === 0, fehlt.length === 0 ? 'vollständig' : `fehlt: ${fehlt.join(', ')}`)
    const werkbaenke = b.bot.findBlocks({ matching: b.bot.registry.blocksByName.crafting_table.id, point: new Vec3(5, BODEN, 0), maxDistance: 48, count: 10 })
    b.pruefe('Keine Werkbank bleibt stehen', werkbaenke.length === 0, werkbaenke.length === 0 ? 'keine' : `stehen bei ${werkbaenke.join(', ')}`)
    b.notiere(`Bernards Meldungen: ${vonBernard(beginn).map(c => `„${c.text}“`).join(' ')}`)
    b.karte('1 – Bis zur Steinzeit', beginn)

    // 2. Höheres Ziel als umgesetzt
    b.setzePhase('Besieg den Enderdrachen')
    beginn = b.jetzt
    ben.sage('Bernard, besieg den Enderdrachen')
    const antwort = await warteAufChat(beginn, /noch nicht|schon/i, 15000)
    b.pruefe('Bernard sagt ehrlich, dass er weiter als bis zur Steinzeit noch nicht kann', !!antwort && /noch nicht/i.test(antwort.text),
      `Meldungen: ${vonBernard(beginn).map(c => `„${c.text}“`).join(' ') || '–'}`)
  },
}
