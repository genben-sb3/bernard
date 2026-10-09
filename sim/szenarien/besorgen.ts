// Szenario (Ticket 001): Bernard besorgt fehlendes Material fürs Craften selbst.
// Leeres Inventar → „mach eine Steinspitzhacke“ → Holz holen, Holzspitzhacke, Bruchstein holen, Steinspitzhacke.
// Danach ohne Stein in der Nähe → „mach einen Ofen“ → klare Meldung, keine Endlosschleife.
import type { Bot } from 'mineflayer'
import type { Rcon } from 'rcon-client'
import { Vec3 } from 'vec3'
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'

const BODEN = -60
const BAEUME: Array<[number, number]> = [[14, -8], [18, 4], [22, -4]]
const STEINFELD = { x1: 8, z1: 10, x2: 10, z2: 12 }

async function anzahl(rcon: Rcon, wer: string, gegenstand: string) {
  return Number((await rcon.send(`clear ${wer} ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

/** Herumliegende Gegenstände, für die Bernard verantwortlich ist (Blätter lassen von selbst Stöcke, Äpfel und Setzlinge fallen). */
async function liegtHerum(rcon: Rcon) {
  const ohneBlaetterabfall = ['stick', 'apple', 'oak_sapling'].map(i => `nbt=!{Item:{id:"minecraft:${i}"}}`).join(',')
  const antwort = await rcon.send(`execute positioned 5 -60 0 if entity @e[type=item,distance=..40,${ohneBlaetterabfall}]`)
  return Number(antwort.match(/Count: (\d+)/)?.[1] ?? 0)
}

function werkbaenke(welt: Bot) {
  return welt.findBlocks({ matching: welt.registry.blocksByName.crafting_table.id, point: new Vec3(5, BODEN, 0), maxDistance: 40, count: 10 })
}

export const besorgen: Szenario = {
  name: 'besorgen',
  beschreibung:
    'Bernard soll mit leerem Inventar eine Steinspitzhacke craften und besorgt dafür Holz, eine Holzspitzhacke und Bruchstein selbst. ' +
    'Danach soll er ohne Stein in der Nähe einen Ofen craften und klar melden, dass Bruchstein fehlt.',
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

    // 1. Steinspitzhacke aus dem Nichts
    b.setzePhase('Steinspitzhacke mit leerem Inventar')
    let beginn = b.jetzt
    ben.sage('Bernard, mach eine Steinspitzhacke')
    const ansage = await warteAufChat(beginn, /hole (ich )?erst/i, 5000)
    b.pruefe('Bernard sagt an, was er erst holt', !!ansage, ansage ? `„${ansage.text}“` : 'keine Ansage in 5 s')
    const fertig = await warteAufChat(beginn, /fertig|fehlen|finde|schief|platz/i, 300000)
    const hacken = await anzahl(rcon, 'Bernard', 'stone_pickaxe')
    b.pruefe('Bernard hat am Ende eine Steinspitzhacke', !!fertig && /fertig/i.test(fertig.text) && hacken === 1,
      `Antwort „${fertig?.text ?? '–'}“${fertig ? ` nach ${((fertig.t - beginn) / 1000).toFixed(0)} s` : ''}; ${hacken} Steinspitzhacke(n)`)
    const zwischen = vonBernard(beginn).map(c => `„${c.text}“`).join(' ')
    b.notiere(`Bernards Meldungen: ${zwischen}`)
    const hatHolzspitzhacke = vonBernard(beginn).some(c => /holzspitzhacke/i.test(c.text))
    b.pruefe('Bernard sagt, dass er erst eine Holzspitzhacke braucht', hatHolzspitzhacke, zwischen)
    const naehe = abstand(b.position('Ben'), b.position('Bernard'))
    b.pruefe('Bernard kommt zum Melden zurück (≤ 4 Blöcke)', naehe <= 4, `Abstand ${naehe.toFixed(1)}`)
    const stehen = werkbaenke(b.bot)
    b.pruefe('Keine Werkbank bleibt stehen', stehen.length === 0, stehen.length === 0 ? 'keine' : `stehen bei ${stehen.join(', ')}`)
    await warte(1500)
    const liegen = await liegtHerum(rcon)
    b.pruefe('Nichts liegt herum (außer Blätterabfall)', liegen === 0, `${liegen} Gegenstände am Boden`)
    b.karte('1 – Steinspitzhacke aus dem Nichts', beginn)

    // 2. Ofen, aber kein Stein mehr in der Nähe
    b.setzePhase('Ofen ohne Stein in der Nähe')
    await rcon.send(`fill ${STEINFELD.x1} ${BODEN} ${STEINFELD.z1} ${STEINFELD.x2} ${BODEN} ${STEINFELD.z2} air`)
    await rcon.send(`fill ${STEINFELD.x1} ${BODEN - 1} ${STEINFELD.z1} ${STEINFELD.x2} ${BODEN - 1} ${STEINFELD.z2} grass_block`)
    await warte(500)
    beginn = b.jetzt
    ben.sage('Bernard, mach einen Ofen')
    const meldung = await warteAufChat(beginn, /finde|fehlen|fertig|schief/i, 90000)
    b.pruefe('Bernard meldet, dass er keinen Bruchstein findet', !!meldung && /bruchstein/i.test(meldung.text) && !/fertig/i.test(meldung.text),
      meldung ? `„${meldung.text}“ nach ${((meldung.t - beginn) / 1000).toFixed(0)} s` : 'keine Meldung in 90 s')
    const nachMeldung = b.jetzt
    const pos = b.position('Bernard')
    await warte(10000)
    const ruhig = b.abgebautSeit(nachMeldung).length === 0 && abstand(pos, b.position('Bernard')) < 1 && vonBernard(nachMeldung + 100).length === 0
    b.pruefe('Danach ist Ruhe (keine Endlosschleife)', ruhig,
      `in 10 s: ${b.abgebautSeit(nachMeldung).length} Blöcke abgebaut, ${abstand(pos, b.position('Bernard')).toFixed(1)} Blöcke bewegt, ${vonBernard(nachMeldung + 100).length} weitere Nachrichten`)
    b.karte('2 – Ofen ohne Stein', beginn)

    // 3. Neuer Befehl mitten im Besorgen: der alte Auftrag darf den neuen nicht ausbremsen
    b.setzePhase('Unterbrechen beim Besorgen')
    for (const g of ['#minecraft:logs', '#minecraft:planks', 'stick']) await rcon.send(`clear Bernard ${g}`) // er muss wirklich Holz holen
    await warte(500)
    beginn = b.jetzt
    ben.sage('Bernard, mach eine Truhe')
    for (let i = 0; i < 160 && b.abgebautSeit(beginn).length === 0; i++) await warte(250)
    await warte(1000) // mitten im nächsten Stamm
    const unterbrochen = b.jetzt
    ben.sage('Bernard, komm her')
    let angekommen = -1
    for (let i = 0; i < 60; i++) {
      await warte(500)
      if (abstand(b.position('Ben'), b.position('Bernard')) <= 3) { angekommen = (i + 1) * 0.5; break }
    }
    const nachUnterbrechung = b.abgebautSeit(unterbrochen + 1500)
    const fertigVorher = vonBernard(beginn).some(c => c.t < unterbrochen && /fertig/i.test(c.text))
    b.pruefe('Auf „komm her“ mitten im Besorgen kommt Bernard sofort', !fertigVorher && angekommen >= 0 && nachUnterbrechung.length === 0,
      `${angekommen >= 0 ? `nach ${angekommen} s da` : 'nach 30 s nicht da'}, ${nachUnterbrechung.length} Blöcke danach noch abgebaut; ` +
      `Meldungen: ${vonBernard(unterbrochen).map(c => `„${c.text}“`).join(' ')}`)
    b.karte('3 – Unterbrechen', beginn)
  },
}
