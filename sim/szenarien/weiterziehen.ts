// Szenario (Vorhaben-Ticket 05): Bernard zieht weiter, wenn er in der Nähe nichts findet, und meldet sich,
// wenn dasselbe Ding mehrmals hintereinander fehlt.
import type { Rcon } from 'rcon-client'
import type { Szenario } from '../szenario'
import { warte } from '../testspieler'
import { laufberichte } from './vorhaben'

const BODEN = -60
/** Bäume nur außerhalb der Suchreichweite (48) vom Start, nach Osten. */
const BAEUME: Array<[number, number]> = [[56, -6], [60, 4], [64, -2], [58, 12], [66, 8], [54, -14]]
/** Hier läuft Bernard herum: vor dem Lauf leer räumen (Reste früherer Läufe), mit eigenem forceload. */
const OSTEN = { x1: 41, x2: 215, z1: -40, z2: 40 }
const FORCELOAD = `64 ${OSTEN.z1} ${OSTEN.x2} ${OSTEN.z2}` // ab x 64, darunter hält die Arena die Chunks

const SOLL: Array<[string, number]> = [
  ['stone_pickaxe', 1], ['stone_axe', 1], ['stone_sword', 1], ['crafting_table', 1], ['furnace', 1], ['cobblestone', 16], ['#minecraft:logs', 16],
]

async function anzahl(rcon: Rcon, gegenstand: string) {
  return Number((await rcon.send(`clear Bernard ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

/** Bernards Position laut Server (der Beobachter sieht ihn so weit weg nicht mehr). */
async function position(rcon: Rcon) {
  const [x, , z] = ((await rcon.send('data get entity Bernard Pos')).match(/-?[\d.]+(?=d)/g) ?? []).map(Number)
  return { x, z }
}

function leereOsten() {
  const befehle = [`forceload add ${FORCELOAD}`]
  for (let x = OSTEN.x1; x <= OSTEN.x2; x += 35) {
    befehle.push(`fill ${x} ${BODEN} ${OSTEN.z1} ${Math.min(x + 34, OSTEN.x2)} ${BODEN + 10} ${OSTEN.z2} air`)
    befehle.push(`fill ${x} ${BODEN - 1} ${OSTEN.z1} ${Math.min(x + 34, OSTEN.x2)} ${BODEN - 1} ${OSTEN.z2} grass_block`)
  }
  return befehle
}

export const weiterziehen: Szenario = {
  name: 'weiterziehen',
  beschreibung:
    'Bäume stehen nur außerhalb der Suchreichweite vom Start, Stein gibt es nirgends. Bei „spiel bis zur Steinzeit“ zieht Bernard weiter, ' +
    'findet die Bäume, sucht dann vergeblich Bruchstein, meldet nach einigen Versuchen, dass er nicht weiterkommt, und pausiert ' +
    '(ohne Endlosschleife, Laufbericht: weiterziehen und aufgeben). Danach liegt Stein und Holz bei ihm, „mach weiter“ → Steinzeit geschafft.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [
    ...leereOsten(),
    ...BAEUME.map(([x, z]) => `place feature minecraft:oak ${x} ${BODEN} ${z}`),
  ],
  start: { Bernard: [-2, 0], Ben: [0, 0], Beobachter: [20, 2] },

  async ablauf({ ordner, rcon, beobachter: b, spieler }) {
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

    try {
      // 1. Nichts in der Nähe: weiterziehen, Holz finden, für Stein aufgeben
      b.setzePhase('Weiterziehen und aufgeben')
      let beginn = b.jetzt
      ben.sage('Bernard, spiel bis zur Steinzeit')
      const gemeldet = await warteAufChat(beginn, /nicht weiter|aufhören|höre|schief|geschafft/i, 480000)
      const zuHolz = vonBernard(beginn).find(c => /weiter weg/i.test(c.text) && /holz/i.test(c.text))
      b.pruefe('Ohne Bäume in der Nähe zieht Bernard weiter', !!zuHolz, meldungen(beginn))
      const holzspitzhacke = await anzahl(rcon, 'wooden_pickaxe')
      b.pruefe('… und findet dort Holz (Holzspitzhacke gebaut)', holzspitzhacke >= 1, `${holzspitzhacke} Holzspitzhacke(n)`)
      const zuStein = vonBernard(beginn).filter(c => /weiter weg/i.test(c.text) && /bruchstein/i.test(c.text))
      b.pruefe('Ohne Stein zieht er auch dafür weiter', zuStein.length >= 1, `${zuStein.length}× weitergezogen`)
      b.pruefe('Nach einigen Versuchen meldet er, dass er keinen Bruchstein findet und nicht weiterkommt',
        !!gemeldet && /bruchstein/i.test(gemeldet.text) && /nicht weiter/i.test(gemeldet.text),
        gemeldet ? `„${gemeldet.text}“ nach ${((gemeldet.t - beginn) / 1000).toFixed(0)} s` : 'keine Meldung in 8 min')

      const ruhig = b.jetzt
      const vorher = await position(rcon)
      await warte(10000)
      const nachher = await position(rcon)
      const bewegt = Math.hypot(nachher.x - vorher.x, nachher.z - vorher.z)
      b.pruefe('Danach ist Ruhe (Vorhaben pausiert, keine Endlosschleife)', bewegt < 1 && vonBernard(ruhig).length === 0,
        `in 10 s ${bewegt.toFixed(1)} Blöcke bewegt, ${vonBernard(ruhig).length} weitere Nachrichten; steht bei (${vorher.x.toFixed(0)}, ${vorher.z.toFixed(0)})`)
      ben.sage('Bernard, was machst du?')
      const status = await warteAufChat(ruhig, /mach weiter/i, 5000)
      b.pruefe('Der Status sagt, dass er auf „mach weiter“ wartet', !!status, status ? `„${status.text}“` : meldungen(ruhig))

      const [bericht1 = []] = laufberichte(ordner)
      const arten = bericht1.map(e => e.art === 'weiterziehen' || e.art === 'aufgeben' ? `${e.art}:${e.ding}` : String(e.art))
      b.pruefe('Der Laufbericht hält Weiterziehen und Aufgeben fest, das Vorhaben ist nicht beendet',
        arten.includes('weiterziehen:holz') && arten.includes('weiterziehen:stein') && arten.includes('aufgeben:stein') && !arten.includes('ende'),
        arten.join(', '))
      b.karte('1 – Weiterziehen und aufgeben', beginn)

      // 2. Ein Kumpel hilft: Stein und Bäume bei Bernard, „mach weiter“
      b.setzePhase('Mach weiter mit Stein')
      const { x, z } = nachher
      const bx = Math.floor(x), bz = Math.floor(z)
      await rcon.send(`fill ${bx + 4} ${BODEN} ${bz + 4} ${bx + 10} ${BODEN} ${bz + 10} stone`)
      for (const [dx, dz] of [[-10, -6], [-6, -12], [-12, 4], [6, -12], [14, -4]]) {
        await rcon.send(`place feature minecraft:oak ${bx + dx} ${BODEN} ${bz + dz}`)
      }
      await warte(1000)
      beginn = b.jetzt
      ben.sage('Bernard, mach weiter')
      const ende = await warteAufChat(beginn, /geschafft|nicht weiter|aufhören|höre|schief/i, 480000)
      b.pruefe('„mach weiter“: Bernard schafft die Steinzeit', !!ende && /steinzeit geschafft/i.test(ende.text),
        ende ? `„${ende.text}“ nach ${((ende.t - beginn) / 1000).toFixed(0)} s` : `keine Meldung in 8 min; ${meldungen(beginn)}`)
      const fehlt: string[] = []
      for (const [gegenstand, soll] of SOLL) {
        const hat = await anzahl(rcon, gegenstand)
        if (hat < soll) fehlt.push(`${gegenstand} ${hat}/${soll}`)
      }
      b.pruefe('Das Soll-Inventar der Steinzeit liegt vor', fehlt.length === 0, fehlt.length === 0 ? 'vollständig' : `fehlt: ${fehlt.join(', ')}`)
      const [bericht2 = []] = laufberichte(ordner)
      const letzter = bericht2.at(-1)
      b.pruefe('Der Laufbericht endet mit „zielErreicht“', letzter?.art === 'ende' && letzter.grund === 'zielErreicht', JSON.stringify(letzter ?? null))
      b.notiere(`Bernards Meldungen: ${meldungen(beginn)}`)
    } finally {
      await rcon.send(`forceload remove ${FORCELOAD}`)
    }
  },
}
