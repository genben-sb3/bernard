// Szenario (Ticket 009): Fähigkeiten, die es gibt, die aber sonst kein Szenario prüft.
// Erde und Sand sammeln, Holz mit der Axt fällen, „ich kann dich nicht sehen“ und Sterben ohne Vorhaben.
import type { Rcon } from 'rcon-client'
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'

const BODEN = -60
const SPAWN: [number, number] = [-2, 0]
const BAEUME: Array<[number, number]> = [[14, -8], [18, 4], [12, 12], [22, -4], [16, 16], [24, 8]]
const SANDFELD = { x1: -10, z1: -10, x2: -8, z2: -8 } // 9 Blöcke

async function anzahl(rcon: Rcon, gegenstand: string) {
  return Number((await rcon.send(`clear Bernard ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

export const faehigkeiten: Szenario = {
  name: 'faehigkeiten',
  beschreibung:
    'Bernard holt Erde und Sand, fällt Holz mit der Axt aus seinem Inventar, sagt „ich kann dich nicht sehen“, ' +
    'wenn Ben weit weg ist, und stirbt mitten im Sammeln: Er meldet es, bricht den Auftrag ab und wartet am Spawn.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [
    'fill -30 -63 -30 40 -62 40 dirt', // Erde unter dem Gras wiederherstellen (wird hier abgebaut)
    ...BAEUME.map(([x, z]) => `place feature minecraft:oak ${x} ${BODEN} ${z}`),
    `fill ${SANDFELD.x1} ${BODEN} ${SANDFELD.z1} ${SANDFELD.x2} ${BODEN} ${SANDFELD.z2} sand`,
  ],
  start: { Bernard: SPAWN, Ben: [0, 0], Beobachter: [6, 2] },

  async ablauf({ rcon, beobachter: b, bernard, spieler }) {
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
    const zeit = (zeile: { t: number }, seit: number) => `nach ${((zeile.t - seit) / 1000).toFixed(0)} s`
    await rcon.send(`spawnpoint Bernard ${SPAWN[0]} ${BODEN} ${SPAWN[1]}`)

    // 1. Erde
    b.setzePhase('Erde holen')
    let beginn = b.jetzt
    ben.sage('Bernard, hol 5 Erde')
    let fertig = await warteAufChat(beginn, /fertig|finde/i, 60000)
    let hat = await anzahl(rcon, 'dirt')
    b.pruefe('Bernard holt 5 Erde', !!fertig && /fertig/i.test(fertig.text) && hat >= 5,
      `${fertig ? `„${fertig.text}“ ${zeit(fertig, beginn)}` : 'keine Meldung in 60 s'}; ${hat} Erde im Inventar`)
    b.karte('1 – Erde holen', beginn)

    // 2. Sand
    b.setzePhase('Sand holen')
    beginn = b.jetzt
    ben.sage('Bernard, hol 5 Sand')
    fertig = await warteAufChat(beginn, /fertig|finde/i, 60000)
    hat = await anzahl(rcon, 'sand')
    const nichtSand = b.abgebautSeit(beginn).filter(a => a.block !== 'sand')
    b.pruefe('Bernard holt 5 Sand', !!fertig && /fertig/i.test(fertig.text) && hat >= 5,
      `${fertig ? `„${fertig.text}“ ${zeit(fertig, beginn)}` : 'keine Meldung in 60 s'}; ${hat} Sand im Inventar`)
    b.pruefe('Beim Sand baut Bernard nur Sand ab', nichtSand.length === 0,
      nichtSand.length === 0 ? 'nur Sand' : `außerdem: ${nichtSand.map(a => a.block).join(', ')}`)
    b.karte('2 – Sand holen', beginn)

    // 3. Holz mit der Axt
    b.setzePhase('Holz mit Axt')
    await rcon.send('give Bernard stone_axe')
    await warte(500)
    beginn = b.jetzt
    ben.sage('Bernard, hol 4 Holz')
    const inDerHand = new Set<string>()
    let staemme = 0
    for (let t = 0; t < 90000; t += 200) {
      if (vonBernard(beginn).some(c => /fertig|finde/i.test(c.text))) break
      const neu = b.abgebautSeit(beginn).filter(a => a.block.endsWith('_log')).length
      if (neu > staemme || bernard.targetDigBlock?.name.endsWith('_log')) inDerHand.add(bernard.heldItem?.name ?? 'Hand')
      staemme = neu
      await warte(200)
    }
    fertig = vonBernard(beginn).find(c => /fertig|finde/i.test(c.text))
    b.pruefe('Bernard holt 4 Holz', !!fertig && /fertig/i.test(fertig.text),
      fertig ? `„${fertig.text}“ ${zeit(fertig, beginn)}` : 'keine Meldung in 90 s')
    b.pruefe('Beim Fällen hält Bernard die Axt', inDerHand.size > 0 && [...inDerHand].every(n => n === 'stone_axe'),
      inDerHand.size ? `in der Hand: ${[...inDerHand].join(', ')}` : 'nie beim Fällen beobachtet')
    const antwort = await rcon.send('data get entity Bernard Inventory[{id:"minecraft:stone_axe"}].components."minecraft:damage"')
    const schaden = Number(antwort.match(/(\d+)\s*$/)?.[1] ?? 0)
    b.pruefe('Die Axt hat sich abgenutzt', schaden > 0, schaden > 0 ? `Schaden ${schaden}` : `Server: ${antwort}`)
    b.karte('3 – Holz mit Axt', beginn)

    // 4. Ben ist zu weit weg
    b.setzePhase('Kein Sichtkontakt')
    await rcon.send(`tp Ben 400 ${BODEN} 0`)
    await warte(3000)
    beginn = b.jetzt
    ben.sage('Bernard, komm her')
    const blind = await warteAufChat(beginn, /sehen|wo bist du/i, 5000)
    b.pruefe('Bernard sagt, dass er Ben nicht sehen kann', !!blind, blind ? `„${blind.text}“` : 'keine Antwort in 5 s')
    await warte(2000)
    const losgelaufen = abstand(b.probenSeit(beginn)[0]?.positionen.Bernard, b.position('Bernard'))
    b.pruefe('Bernard läuft nicht blind los', losgelaufen < 1, `${losgelaufen.toFixed(1)} Blöcke bewegt`)
    await rcon.send(`tp Ben 0.5 ${BODEN} 0.5`)
    await warte(3000)

    // 5. Sterben mitten im Sammeln
    b.setzePhase('Tod beim Sammeln')
    beginn = b.jetzt
    ben.sage('Bernard, hol 30 Holz')
    for (let i = 0; i < 160 && b.abgebautSeit(beginn).length === 0; i++) await warte(250)
    b.pruefe('Bernard fängt an zu sammeln', b.abgebautSeit(beginn).length > 0,
      `${b.abgebautSeit(beginn).length} Blöcke abgebaut`)
    const todBeginn = b.jetzt
    await rcon.send('kill Bernard')
    await warte(1000)
    await rcon.send('kill @e[type=item]')
    const meldung = await warteAufChat(todBeginn, /gestorben/i, 5000)
    b.pruefe('Bernard meldet seinen Tod und wartet am Spawn', !!meldung && /spawn/i.test(meldung.text),
      meldung ? `„${meldung.text}“` : 'keine Meldung in 5 s')
    await warte(3000)
    const ruhig = b.jetzt
    const ruhePos = b.position('Bernard')
    await warte(8000)
    const spawn = { x: SPAWN[0] + 0.5, y: BODEN, z: SPAWN[1] + 0.5 }
    b.pruefe('Bernard steht am Spawn', abstand(b.position('Bernard'), spawn) < 1.5,
      `Abstand zum Spawn ${abstand(b.position('Bernard'), spawn).toFixed(1)}`)
    const bewegt = abstand(ruhePos, b.position('Bernard'))
    const danach = b.abgebautSeit(ruhig)
    b.pruefe('Der Sammelauftrag ist abgebrochen', bewegt < 1 && danach.length === 0,
      `in 8 s: ${bewegt.toFixed(1)} Blöcke bewegt, ${danach.length} Blöcke abgebaut`)
    const spaet = vonBernard(todBeginn).find(c => /fertig|finde|ich hole/i.test(c.text))
    b.pruefe('Keine Meldung mehr zum abgebrochenen Auftrag', !spaet, spaet ? `sagt trotzdem: „${spaet.text}“` : 'still')
    b.karte('5 – Tod beim Sammeln', beginn)
  },
}
