// Szenario (Bernard-Ticket 004): Bernard schmilzt im Ofen, stellt ihn dafür auf und nimmt ihn wieder mit.
import type { Rcon } from 'rcon-client'
import { Vec3 } from 'vec3'
import type { Bot } from 'mineflayer'
import type { Szenario } from '../szenario'
import { warte } from '../testspieler'

const BODEN = -60
const BAEUME: Array<[number, number]> = [[14, -8], [18, 4], [22, -4]]
const SANDFELD = { x1: -10, z1: 6, x2: -7, z2: 8 } // 12 Sand

async function anzahl(rcon: Rcon, gegenstand: string) {
  return Number((await rcon.send(`clear Bernard ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

async function liegtHerum(rcon: Rcon) {
  const ohneBlaetterabfall = ['stick', 'apple', 'oak_sapling'].map(i => `nbt=!{Item:{id:"minecraft:${i}"}}`).join(',')
  const antwort = await rcon.send(`execute positioned 5 -60 0 if entity @e[type=item,distance=..40,${ohneBlaetterabfall}]`)
  return Number(antwort.match(/Count: (\d+)/)?.[1] ?? 0)
}

function stehenGeblieben(welt: Bot) {
  const ids = ['furnace', 'crafting_table'].map(n => welt.registry.blocksByName[n].id)
  return welt.findBlocks({ matching: ids, point: new Vec3(5, BODEN, 0), maxDistance: 40, count: 10 })
}

export const schmelzen: Szenario = {
  name: 'schmelzen',
  beschreibung:
    'Mit Roheisen, Kohle und einem Ofen im Inventar: „schmelz 3 Eisen“ → 3 Eisenbarren, Ansage der Dauer, der Ofen ist wieder mitgenommen. ' +
    'Dann ohne Brennstoff „mach 4 Glas“ → er holt Sand und Holz selbst. Dann „mach 4 Fackeln“ ohne Kohle → er schmilzt Holzkohle.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [
    ...BAEUME.map(([x, z]) => `place feature minecraft:oak ${x} ${BODEN} ${z}`),
    `fill ${SANDFELD.x1} ${BODEN} ${SANDFELD.z1} ${SANDFELD.x2} ${BODEN} ${SANDFELD.z2} sand`,
  ],
  start: { Bernard: [-2, 0], Ben: [0, 0], Beobachter: [4, 2] },

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
    const aufgeraeumt = async (phase: string) => {
      const stehen = stehenGeblieben(b.bot)
      b.pruefe(`${phase}: Kein Ofen und keine Werkbank bleibt stehen`, stehen.length === 0, stehen.length === 0 ? 'keine' : `stehen bei ${stehen.join(', ')}`)
      await warte(1500)
      const liegen = await liegtHerum(rcon)
      b.pruefe(`${phase}: Nichts liegt herum (außer Blätterabfall)`, liegen === 0, `${liegen} Gegenstände am Boden`)
    }

    // 1. Alles dabei
    b.setzePhase('Eisen schmelzen')
    await rcon.send('give Bernard raw_iron 3')
    await rcon.send('give Bernard coal 1')
    await rcon.send('give Bernard furnace 1')
    await rcon.send('give Bernard stone_pickaxe 1')
    await warte(1000)
    let beginn = b.jetzt
    ben.sage('Bernard, schmelz 3 Eisen')
    const dauer = await warteAufChat(beginn, /dauert/i, 10000)
    b.pruefe('Bernard sagt an, wie lange es dauert', !!dauer && /30 sekunden/i.test(dauer.text), dauer ? `„${dauer.text}“` : meldungen(beginn))
    let fertig = await warteAufChat(beginn, /fertig|fehlen|finde|schief|platz/i, 90000)
    const barren = await anzahl(rcon, 'iron_ingot')
    b.pruefe('3 Eisenbarren', !!fertig && /fertig/i.test(fertig.text) && barren === 3,
      `„${fertig?.text ?? '–'}“${fertig ? ` nach ${((fertig.t - beginn) / 1000).toFixed(0)} s` : ''}; ${barren} Eisenbarren`)
    const oefen = await anzahl(rcon, 'furnace')
    b.pruefe('Der Ofen ist wieder im Inventar', oefen === 1, `${oefen} Ofen`)
    await aufgeraeumt('Eisen')
    b.karte('1 – Eisen schmelzen', beginn)

    // 2. Ohne Brennstoff und ohne Sand
    b.setzePhase('Glas ohne Zutaten')
    beginn = b.jetzt
    ben.sage('Bernard, mach 4 Glas')
    const ansage = await warteAufChat(beginn, /hole (ich )?erst/i, 10000)
    b.pruefe('Bernard sagt an, was er erst holt (Sand und Holz)', !!ansage && /sand/i.test(ansage.text) && /holz/i.test(ansage.text),
      ansage ? `„${ansage.text}“` : meldungen(beginn))
    fertig = await warteAufChat(beginn, /fertig|fehlen|finde|schief|platz/i, 240000)
    const glas = await anzahl(rcon, 'glass')
    b.pruefe('4 Glas', !!fertig && /fertig/i.test(fertig.text) && glas === 4,
      `„${fertig?.text ?? '–'}“${fertig ? ` nach ${((fertig.t - beginn) / 1000).toFixed(0)} s` : ''}; ${glas} Glas; ${meldungen(beginn)}`)
    await aufgeraeumt('Glas')
    b.karte('2 – Glas ohne Zutaten', beginn)

    // 3. Fackeln ohne Kohle: Holzkohle schmelzen
    b.setzePhase('Fackeln ohne Kohle')
    await rcon.send('clear Bernard coal')
    await rcon.send('clear Bernard charcoal')
    beginn = b.jetzt
    ben.sage('Bernard, mach 4 Fackeln')
    fertig = await warteAufChat(beginn, /fertig|fehlen|finde|schief|platz/i, 240000)
    const fackeln = await anzahl(rcon, 'torch')
    const holzkohle = vonBernard(beginn).some(c => /holzkohle/i.test(c.text))
    b.pruefe('4 Fackeln, dafür Holzkohle geschmolzen', !!fertig && /fertig/i.test(fertig.text) && fackeln >= 4 && holzkohle,
      `„${fertig?.text ?? '–'}“${fertig ? ` nach ${((fertig.t - beginn) / 1000).toFixed(0)} s` : ''}; ${fackeln} Fackeln; ${meldungen(beginn)}`)
    await aufgeraeumt('Fackeln')
    b.karte('3 – Fackeln ohne Kohle', beginn)
  },
}
