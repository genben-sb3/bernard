// Szenario (Bernard-Ticket 012): Bernard stellt Werkbank und Ofen auch in einem engen Loch auf.
import type { Rcon } from 'rcon-client'
import { Vec3 } from 'vec3'
import type { Szenario } from '../szenario'
import { warte } from '../testspieler'

const BODEN = -60
/** Löcher als Wände auf dem flachen Boden: [x, z, Tiefe] */
const LOCH_TIEF_WERKBANK: [number, number] = [-2, 0]
const LOCH_TIEF_OFEN: [number, number] = [-8, 0]
const LOCH_FLACH: [number, number] = [-14, 0]

function loch([x, z]: [number, number], tiefe: number) {
  return [
    `fill ${x - 1} ${BODEN} ${z - 1} ${x + 1} ${BODEN + tiefe - 1} ${z + 1} dirt`,
    `fill ${x} ${BODEN} ${z} ${x} ${BODEN + tiefe - 1} ${z} air`,
  ]
}

async function anzahl(rcon: Rcon, gegenstand: string) {
  return Number((await rcon.send(`clear Bernard ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

export const aufstellen: Szenario = {
  name: 'aufstellen',
  beschreibung:
    'Bernard steht in einem 1×1-Loch, zwei Blöcke tief: „mach eine Holzspitzhacke“ → er gräbt sich eine Nische für die Werkbank frei, craftet und nimmt sie wieder mit. ' +
    'Dasselbe mit dem Ofen („schmelz 1 Eisen“). Dann ein Loch, einen Block tief: die Werkbank kommt eine Ebene höher an den Rand.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [...loch(LOCH_TIEF_WERKBANK, 2), ...loch(LOCH_TIEF_OFEN, 2), ...loch(LOCH_FLACH, 1)],
  start: { Bernard: LOCH_TIEF_WERKBANK, Ben: [0, 4], Beobachter: [-8, 3] },

  async ablauf({ rcon, beobachter: b, spieler }) {
    const ben = spieler.Ben
    const vonBernard = (seit: number) => b.chatSeit(seit).filter(c => c.von === 'Bernard')
    const meldungen = (seit: number) => vonBernard(seit).map(c => `„${c.text}“`).join(' ') || '–'
    const warteAufChat = async (seit: number, muster: RegExp, maxMs: number) => {
      for (let t = 0; t < maxMs; t += 250) {
        const zeile = vonBernard(seit).find(c => muster.test(c.text))
        if (zeile) return zeile
        await warte(250)
      }
      return undefined
    }
    const ende = /fertig|fehlen|finde|schief|platz/i
    const insLoch = async ([x, z]: [number, number]) => {
      await rcon.send(`tp Bernard ${x + 0.5} ${BODEN} ${z + 0.5}`)
      await warte(1500)
    }

    // 1. Werkbank im tiefen Loch: Platz freigraben
    b.setzePhase('Werkbank im tiefen Loch')
    await rcon.send('give Bernard oak_log 3')
    await warte(1000)
    let beginn = b.jetzt
    ben.sage('Bernard, mach eine Holzspitzhacke')
    let fertig = await warteAufChat(beginn, ende, 60000)
    const spitzhacken = await anzahl(rcon, 'wooden_pickaxe')
    b.pruefe('Holzspitzhacke im tiefen Loch gecraftet', !!fertig && /fertig/i.test(fertig.text) && spitzhacken === 1,
      `${meldungen(beginn)}; ${spitzhacken} Holzspitzhacke`)
    let werkbaenke = await anzahl(rcon, 'crafting_table')
    b.pruefe('Die Werkbank ist wieder im Inventar', werkbaenke === 1, `${werkbaenke} Werkbank`)
    b.karte('1 – Werkbank im tiefen Loch', beginn)

    // 2. Ofen im tiefen Loch
    b.setzePhase('Ofen im tiefen Loch')
    await rcon.send('clear Bernard')
    await insLoch(LOCH_TIEF_OFEN)
    await rcon.send('give Bernard raw_iron 1')
    await rcon.send('give Bernard coal 1')
    await rcon.send('give Bernard furnace 1')
    await rcon.send('give Bernard stone_pickaxe 1')
    await warte(1000)
    beginn = b.jetzt
    ben.sage('Bernard, schmelz 1 Eisen')
    fertig = await warteAufChat(beginn, ende, 60000)
    const barren = await anzahl(rcon, 'iron_ingot')
    b.pruefe('1 Eisenbarren im tiefen Loch geschmolzen', !!fertig && /fertig/i.test(fertig.text) && barren === 1,
      `${meldungen(beginn)}; ${barren} Eisenbarren`)
    const oefen = await anzahl(rcon, 'furnace')
    b.pruefe('Der Ofen ist wieder im Inventar', oefen === 1, `${oefen} Ofen`)
    b.karte('2 – Ofen im tiefen Loch', beginn)

    // 3. Werkbank im flachen Loch: eine Ebene höher an den Rand
    b.setzePhase('Werkbank im flachen Loch')
    await rcon.send('clear Bernard')
    await insLoch(LOCH_FLACH)
    await rcon.send('give Bernard oak_log 3')
    await warte(1000)
    beginn = b.jetzt
    ben.sage('Bernard, mach eine Holzspitzhacke')
    fertig = await warteAufChat(beginn, ende, 60000)
    const [x, z] = LOCH_FLACH
    const wand = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
      .map(([dx, dz]) => b.bot.blockAt(new Vec3(x + dx, BODEN, z + dz))?.name)
    const ganz = wand.every(n => n === 'dirt' || n === 'grass_block') // Erde mit Luft darüber wird zu Gras
    b.pruefe('Holzspitzhacke im flachen Loch, ohne die Wand aufzugraben', !!fertig && /fertig/i.test(fertig.text) && ganz,
      `${meldungen(beginn)}; Wand ${ganz ? 'ganz' : `aufgegraben (${wand.join(', ')})`}`)
    werkbaenke = await anzahl(rcon, 'crafting_table')
    b.pruefe('Die Werkbank ist wieder im Inventar', werkbaenke === 1, `${werkbaenke} Werkbank`)
    b.karte('3 – Werkbank im flachen Loch', beginn)
  },
}
