// Szenario (Eisenzeit-Ticket 02): Mit dem Soll-Inventar der Steinzeit und 9 Eisenbarren craftet Bernard die Eisenzeit selbst.
// Danach läuft „besieg den Enderdrachen“ bis zur Eisenzeit und endet mit „weiter kann ich noch nicht“.
import type { Rcon } from 'rcon-client'
import type { Szenario } from '../szenario'
import { warte } from '../testspieler'
import { laufberichte } from './vorhaben'

/** Steinzeit (Soll-Inventar und Vorrat) und genau genug Eisen: Spitzhacke 3, Schwert 2, Schild 1, Eimer 3. */
const START: Array<[string, number]> = [
  ['stone_pickaxe', 1], ['stone_axe', 1], ['stone_sword', 1], ['crafting_table', 1], ['furnace', 1],
  ['cobblestone', 16], ['oak_log', 16], ['iron_ingot', 9],
]
const EISENZEIT: Array<[string, number]> = [['iron_pickaxe', 1], ['iron_sword', 1], ['shield', 1], ['bucket', 1]]
/** Vorrat der Eisenzeit, per Server-Befehl aufgefüllt: Er ist nicht Thema dieses Tickets. */
const VORRAT: Array<[string, number]> = [['torch', 32], ['cobblestone', 32], ['coal', 8]]

async function anzahl(rcon: Rcon, gegenstand: string) {
  return Number((await rcon.send(`clear Bernard ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

export const eisenzeit: Szenario = {
  name: 'eisenzeit',
  beschreibung:
    'Bernard hat das Soll-Inventar und den Vorrat der Steinzeit und 9 Eisenbarren. „spiel bis zur Eisenzeit“ → er craftet ' +
    'Eisenspitzhacke, Eisenschwert, Schild und Eimer und sagt „Eisenzeit geschafft“; der Laufbericht hat den Stufenwechsel 1 → 2. ' +
    'Danach, mit aufgefülltem Vorrat: „besieg den Enderdrachen“ → weiter als bis zur Eisenzeit kann er noch nicht.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [],
  start: { Bernard: [-2, 0], Ben: [0, 0], Beobachter: [8, 2] },

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

    await rcon.send('clear Bernard')
    for (const [gegenstand, n] of START) await rcon.send(`give Bernard ${gegenstand} ${n}`)
    await warte(1000)

    // 1. Bis zur Eisenzeit
    b.setzePhase('Spiel bis zur Eisenzeit')
    let beginn = b.jetzt
    ben.sage('Bernard, spiel bis zur Eisenzeit')
    const ende = await warteAufChat(beginn, /geschafft|aufhören|höre|schief|fehlen/i, 300000)
    b.pruefe('Bernard meldet „Eisenzeit geschafft“', !!ende && /eisenzeit geschafft/i.test(ende.text),
      ende ? `„${ende.text}“ nach ${((ende.t - beginn) / 1000).toFixed(0)} s` : 'keine Meldung in 5 min')
    const fehlt: string[] = []
    for (const [gegenstand, soll] of EISENZEIT) {
      const hat = await anzahl(rcon, gegenstand)
      if (hat < soll) fehlt.push(`${gegenstand} ${hat}/${soll}`)
    }
    b.pruefe('Das Soll-Inventar der Eisenzeit liegt vor', fehlt.length === 0, fehlt.length === 0 ? 'vollständig' : `fehlt: ${fehlt.join(', ')}`)
    ben.sage('Bernard, vergiss das Vorhaben')
    await warte(2000)
    b.notiere(`Bernards Meldungen: ${vonBernard(beginn).map(c => `„${c.text}“`).join(' ')}`)

    const [bericht = []] = laufberichte(ordner)
    const arten = bericht.map(e => e.art === 'erfuellt' ? `erfuellt:${e.ding}` : e.art === 'stufe' ? `stufe:${e.von}→${e.nach}` : e.art)
    const erwartet = ['start', ...['eisenspitzhacke', 'eisenschwert', 'schild', 'eimer'].map(d => `erfuellt:${d}`), 'stufe:1→2']
    const fehlen = erwartet.filter(a => !arten.includes(a))
    b.pruefe('Der Laufbericht hat jedes Soll-Ding der Eisenzeit und den Stufenwechsel 1 → 2', fehlen.length === 0,
      `Einträge: ${arten.join(', ') || '–'}${fehlen.length ? `; fehlt: ${fehlen.join(', ')}` : ''}`)

    // 2. Enderdrache: läuft bis zur Eisenzeit, weiter noch nicht
    b.setzePhase('Besieg den Enderdrachen')
    for (const [gegenstand, n] of VORRAT) await rcon.send(`give Bernard ${gegenstand} ${n}`)
    await warte(1000)
    beginn = b.jetzt
    ben.sage('Bernard, besieg den Enderdrachen')
    const antwort = await warteAufChat(beginn, /noch nicht|aufhören|höre|schief/i, 15000)
    b.pruefe('Bernard sagt, dass er weiter als bis zur Eisenzeit noch nicht kann', !!antwort && /eisenzeit kann ich noch nicht/i.test(antwort.text),
      `Meldungen: ${vonBernard(beginn).map(c => `„${c.text}“`).join(' ') || '–'}`)
  },
}
