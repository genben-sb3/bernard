// Szenario (Vorhaben-Ticket 07): der echte Messlauf. Frische Normalwelt (fester Seed, Schwierigkeit „normal“),
// „spiel bis zur Steinzeit“ mit 30 Minuten Zeitlimit, ohne jede Überlebenslogik. Ob Bernard die Steinzeit schafft,
// ist ein Messwert (messung.json), kein Testfehler. Ein unvollständiger Laufbericht ist ein Fehler.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Rcon } from 'rcon-client'
import { SEED } from '../normalwelt'
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'
import { laufberichte } from './vorhaben'

const ZEITLIMIT_MS = 30 * 60 * 1000
const SOLL: Array<[string, string, number]> = [
  ['steinspitzhacke', 'stone_pickaxe', 1], ['werkbank', 'crafting_table', 1], ['steinaxt', 'stone_axe', 1],
  ['steinschwert', 'stone_sword', 1], ['ofen', 'furnace', 1], ['stein', 'cobblestone', 16], ['holz', '#minecraft:logs', 16],
]

async function anzahl(rcon: Rcon, gegenstand: string) {
  return Number((await rcon.send(`clear Bernard ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

export const stufe1: Szenario = {
  name: 'stufe1',
  beschreibung:
    `Messlauf: frische Normalwelt (Seed ${SEED}, „normal“), „spiel bis zur Steinzeit“ mit 30 min Zeitlimit. Unterwegs: Statusfrage, ` +
    '„komm her“ mit Ansage beim Weitermachen, „stopp“ und „mach weiter“. Gemessen: Zeit bis Stufe 1, Tode, Rückfälle, Ende.',
  welt: 'normal',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  zeitlimitMs: ZEITLIMIT_MS,
  aufbau: [],
  start: {},

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
    const meldungen = (seit: number) => vonBernard(seit).map(c => `„${c.text}“`).join(' ') || '–'
    // In der Normalwelt fällt ständig irgendwo Kies oder Sand: nur zählen, was in Bernards Reichweite verschwindet
    const nah = (p: { x: number; y: number; z: number }) => {
      const bernard = b.position('Bernard')
      return !!bernard && Math.hypot(p.x - bernard.x, p.y - bernard.y, p.z - bernard.z) <= 6 // auch in der Höhe: Höhlen darunter zählen nicht
    }
    const vonBernardAbgebaut = (seit: number) => b.abgebautSeit(seit).filter(a => nah(a.position))
    /** Ob Bernard in dieser Zeit arbeitet: sich mindestens 2 Blöcke bewegt oder etwas abbaut. */
    const arbeitet = async (maxMs: number) => {
      const seit = b.jetzt
      const pos = b.position('Bernard')
      for (let t = 0; t < maxMs; t += 250) {
        if (vonBernardAbgebaut(seit).length > 0 || abstand(pos, b.position('Bernard')) >= 2) return true
        await warte(250)
      }
      return false
    }

    // Ben ist der Kumpel am Spawn und soll selbst nicht sterben; Tode zählt der Server unabhängig vom Laufbericht
    await rcon.send('gamemode creative Ben')
    await rcon.send('scoreboard objectives add tode deathCount')
    // Der Beobachter fliegt Bernard hinterher, sonst verliert er ihn außerhalb der Sichtweite
    const folgen = setInterval(() => { void rcon.send('execute as Beobachter at Bernard run tp @s ~ ~25 ~').catch(() => {}) }, 3000)

    try {
      // 1. Vorhaben starten
      b.setzePhase('Start')
      const beginn = b.jetzt
      ben.sage('Bernard, spiel bis zur Steinzeit')
      const bestaetigt = await warteAufChat(beginn, /steinzeit/i, 5000)
      b.pruefe('Bernard bestätigt das Vorhaben', !!bestaetigt, bestaetigt ? `„${bestaetigt.text}“` : 'keine Antwort in 5 s')
      for (let i = 0; i < 240 && vonBernardAbgebaut(beginn).length === 0; i++) await warte(250)

      // 2. Zusammenspiel mit dem Kumpel, solange Bernard noch in der Nähe des Spawns arbeitet
      b.setzePhase('Status')
      let seit = b.jetzt
      ben.sage('Bernard, was machst du?')
      const status = await warteAufChat(seit, /stufe/i, 5000)
      b.pruefe('„was machst du?“ nennt Stufe und was fehlt', !!status && /stufe \d/i.test(status.text) && /fehl/i.test(status.text),
        status ? `„${status.text}“` : 'keine Antwort')

      b.setzePhase('Komm her')
      seit = b.jetzt
      ben.sage('Bernard, komm her')
      let da = -1
      for (let i = 0; i < 240; i++) {
        await warte(250)
        if (abstand(b.position('Ben'), b.position('Bernard')) <= 3) { da = (i + 1) / 4; break }
      }
      b.pruefe('„komm her“ unterbricht das Vorhaben, Bernard kommt', da >= 0, da >= 0 ? `nach ${da} s da` : 'nach 60 s nicht da')
      const ansage = await warteAufChat(seit, /mach dann weiter/i, 8000)
      b.pruefe('Danach sagt er an, womit er weitermacht', !!ansage, ansage ? `„${ansage.text}“` : meldungen(seit))
      b.pruefe('… und läuft wieder los', await arbeitet(30000), meldungen(seit))

      b.setzePhase('Stopp')
      seit = b.jetzt
      ben.sage('Bernard, stopp')
      await warte(1500)
      const stillAb = b.jetzt
      const pos = b.position('Bernard')
      await warte(8000)
      b.pruefe('„stopp“ pausiert: Bernard bleibt 8 s stehen', abstand(pos, b.position('Bernard')) < 1 && vonBernardAbgebaut(stillAb).length === 0,
        `${abstand(pos, b.position('Bernard')).toFixed(1)} Blöcke bewegt, ${vonBernardAbgebaut(stillAb).length} abgebaut; ${meldungen(seit)}`)
      b.setzePhase('Mach weiter')
      seit = b.jetzt
      ben.sage('Bernard, mach weiter')
      b.pruefe('„mach weiter“ setzt fort', await arbeitet(30000), meldungen(seit))

      // 3. Laufen lassen bis zum Ende des Vorhabens (Ziel erreicht, aufgehört oder Zeitlimit)
      b.setzePhase('Messlauf')
      let ende: Record<string, unknown> | undefined
      for (let t = 0; t < ZEITLIMIT_MS + 120000 && !ende; t += 5000) {
        ende = laufberichte(ordner)[0]?.find(e => e.art === 'ende')
        if (!ende) await warte(5000)
      }
      await warte(1000)
      b.notiere(`Bernards Meldungen: ${meldungen(beginn)}`)
      b.karte('Messlauf', beginn)

      // 4. Auswertung
      b.setzePhase('Auswertung')
      const berichte = laufberichte(ordner)
      const bericht = berichte[0] ?? []
      const arten = bericht.map(e => e.art)
      const mitZeit = bericht.every(e => typeof e.spielzeit === 'number' && typeof e.echtzeit === 'string' && typeof e.sekunden === 'number')
      b.pruefe('Genau ein Laufbericht mit Start und Ende, alle Einträge mit Zeiten',
        berichte.length === 1 && arten[0] === 'start' && arten.at(-1) === 'ende' && arten.filter(a => a === 'ende').length === 1 && mitZeit,
        `${berichte.length} Laufberichte; Einträge: ${arten.join(', ') || '–'}`)

      const tode = Number((await rcon.send('scoreboard players get Bernard tode')).match(/has (\d+)/)?.[1] ?? 0)
      const todeImBericht = bericht.filter(e => e.art === 'tod').length
      b.pruefe('Jeder Tod steht im Laufbericht', todeImBericht === tode, `Server: ${tode}, Laufbericht: ${todeImBericht}`)

      const inventar: Record<string, number> = {}
      for (const [ding, gegenstand] of SOLL) inventar[ding] = await anzahl(rcon, gegenstand)
      const erfuellt = new Set(bericht.filter(e => e.art === 'erfuellt').map(e => e.ding))
      const ohneEintrag = SOLL.filter(([ding, , soll]) => inventar[ding] >= soll && !erfuellt.has(ding)).map(([ding]) => ding)
      b.pruefe('Jedes vorhandene Soll-Ding steht als erfüllt im Laufbericht', ohneEintrag.length === 0,
        ohneEintrag.length ? `fehlt: ${ohneEintrag.join(', ')}` : `erfüllt: ${[...erfuellt].join(', ') || '–'}`)

      const stufenwechsel = bericht.find(e => e.art === 'stufe' && e.nach === 1)
      const geschafft = ende?.grund === 'zielErreicht'
      if (geschafft) {
        const fehlt = SOLL.filter(([ding, , soll]) => inventar[ding] < soll).map(([ding, , soll]) => `${ding} ${inventar[ding]}/${soll}`)
        b.pruefe('Bei Erfolg liegt das Soll-Inventar per Server-Befehl vor', fehlt.length === 0, fehlt.length ? `fehlt: ${fehlt.join(', ')}` : 'vollständig')
        const meldung = vonBernard(beginn).find(c => /steinzeit geschafft/i.test(c.text))
        b.pruefe('Bei Erfolg: „Steinzeit geschafft“ im Chat', !!meldung, meldungen(beginn))
        b.pruefe('Bei Erfolg steht der Stufenwechsel im Laufbericht', !!stufenwechsel, arten.join(', '))
      }

      // Messwerte (kein Testfehler)
      const messung = {
        seed: SEED,
        ende: ende?.grund ?? 'keinEnde',
        sekundenBisStufe1: typeof stufenwechsel?.sekunden === 'number' ? stufenwechsel.sekunden : null,
        tode,
        rueckfaelle: bericht.filter(e => e.art === 'rueckfall').length,
        weiterziehen: bericht.filter(e => e.art === 'weiterziehen').length,
        aufgeben: bericht.filter(e => e.art === 'aufgeben').length,
        dauerSekunden: typeof ende?.sekunden === 'number' ? ende.sekunden : null,
        erfuellt: [...erfuellt],
        inventar,
      }
      writeFileSync(join(ordner, 'messung.json'), JSON.stringify(messung, null, 2))
      b.notiere(`Messung: ${JSON.stringify(messung)}`)
      console.log(`MESSUNG ${JSON.stringify(messung)}`)
    } finally {
      clearInterval(folgen)
    }
  },
}
