// Szenario: Bernard sammelt Holz nur von natürlichen Bäumen, lässt Gebautes stehen,
// bricht auf „stopp“ ab und sagt Bescheid, wenn ihm für Stein die Spitzhacke fehlt.
import type { Bot } from 'mineflayer'
import type { Rcon } from 'rcon-client'
import { Vec3 } from 'vec3'
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'
import type { Position } from '../protokoll'

const BODEN = -60

// Gebautes aus Holz, näher an Bernard als die echten Bäume: darf nicht abgebaut werden
const HOLZWAND = { x: -8, z1: -2, z2: 2, hoehe: 3 }
const FALSCHER_BAUM = { x: -3, z: 7, hoehe: 4 }

const BAEUME: Array<[number, number]> = [[14, -8], [18, 4], [12, 12], [22, -4]]

function istGebaut(p: Position) {
  const inWand = p.x === HOLZWAND.x && p.z >= HOLZWAND.z1 && p.z <= HOLZWAND.z2
  const imFalschenBaum = p.x === FALSCHER_BAUM.x && p.z === FALSCHER_BAUM.z
  return inWand || imFalschenBaum
}

async function holzBeiBernard(rcon: Rcon) {
  const antwort = await rcon.send('clear Bernard #minecraft:logs 0')
  return Number(antwort.match(/(\d+)/)?.[1] ?? 0)
}

export const sammeln: Szenario = {
  name: 'sammeln',
  beschreibung:
    'Bernard holt 10 Holz nur von natürlichen Bäumen (nicht von einer Holzwand oder einem Baum mit gesetzten Blättern), ' +
    'bricht eine zweite Sammelaufgabe auf „stopp“ ab und meldet, dass ihm für Stein die Spitzhacke fehlt.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [
    ...BAEUME.map(([x, z]) => `place feature minecraft:oak ${x} ${BODEN} ${z}`),
    `fill ${HOLZWAND.x} ${BODEN} ${HOLZWAND.z1} ${HOLZWAND.x} ${BODEN + HOLZWAND.hoehe - 1} ${HOLZWAND.z2} oak_log`,
    `fill ${FALSCHER_BAUM.x} ${BODEN} ${FALSCHER_BAUM.z} ${FALSCHER_BAUM.x} ${BODEN + FALSCHER_BAUM.hoehe - 1} ${FALSCHER_BAUM.z} oak_log`,
    `fill ${FALSCHER_BAUM.x - 2} ${BODEN + FALSCHER_BAUM.hoehe} ${FALSCHER_BAUM.z - 2} ${FALSCHER_BAUM.x + 2} ${BODEN + FALSCHER_BAUM.hoehe + 1} ${FALSCHER_BAUM.z + 2} oak_leaves[persistent=true]`,
  ],
  start: {
    Bernard: [-2, 0],
    Ben: [0, 0],
    Beobachter: [6, 2],
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

    // 1. Zehn Holz holen
    b.setzePhase('10 Holz holen')
    let beginn = b.jetzt
    ben.sage('Bernard, hol 10 Holz')
    const ansage = await warteAufChat(beginn, /10/, 3000)
    b.pruefe('Bernard sagt an, was er tut', !!ansage, ansage ? `„${ansage.text}“` : 'keine Ansage mit der Menge in 3 s')
    const fertig = await warteAufChat(beginn, /fertig/i, 150000)
    const anzahl = await holzBeiBernard(rcon)
    b.pruefe('Bernard meldet sich fertig (in 150 s)', !!fertig,
      fertig ? `„${fertig.text}“ nach ${((fertig.t - beginn) / 1000).toFixed(0)} s` :
        `keine Fertigmeldung; letzte Nachricht: „${vonBernard(beginn).at(-1)?.text ?? '–'}“`)
    b.pruefe('Bernard hat mindestens 10 Holz', anzahl >= 10, `${anzahl} Holz im Inventar`)
    const gebaut = b.abgebautSeit(beginn).filter(a => istGebaut(a.position))
    const abgebaut = b.abgebautSeit(beginn)
    b.pruefe('Bernard lässt Gebautes stehen', gebaut.length === 0,
      gebaut.length === 0
        ? `${abgebaut.length} Blöcke abgebaut, alle von echten Bäumen`
        : `hat Gebautes abgebaut: ${gebaut.map(a => `${a.block} bei ${a.position.x}/${a.position.y}/${a.position.z}`).join(', ')}`)
    const gesetzteBlaetter = zaehleGesetzteBlaetter(b.bot)
    b.pruefe('Gesetzte Blätter des falschen Baums sind alle noch da', gesetzteBlaetter === 50,
      `${gesetzteBlaetter} von 50`)
    const nichtHolz = abgebaut.filter(a => !a.block.endsWith('_log'))
    b.pruefe('Bernard baut nur Holz ab', nichtHolz.length === 0,
      nichtHolz.length === 0 ? 'nur Stämme' : `außerdem: ${nichtHolz.map(a => a.block).join(', ')}`)
    const stammAbbau = abgebaut.filter(a => a.block.endsWith('_log'))
    const liegen = anzahl >= stammAbbau.length ? [] : await liegendeStaemme(rcon)
    b.pruefe('Alle abgebauten Stämme sind im Inventar (nichts liegen gelassen)', anzahl >= stammAbbau.length,
      `${stammAbbau.length} Stämme abgebaut, ${anzahl} im Inventar` +
      (liegen.length ? `; laut Server liegen: ${liegen.join(', ')}; Bernard steht bei ${await rcon.send('data get entity Bernard Pos')}` : ''))
    const schwebend = schwebendeStaemme(b.bot, stammAbbau.map(a => a.position))
    b.pruefe('Keine schwebenden Stämme über gefällten Bäumen', schwebend.length === 0,
      schwebend.length === 0 ? 'alle angefangenen Bäume ganz gefällt' : `stehen noch: ${schwebend.join(', ')}`)
    const naehe = abstand(b.position('Ben'), b.position('Bernard'))
    b.pruefe('Bernard kommt zum Melden zurück (≤ 4 Blöcke)', naehe <= 4, `Abstand bei der Meldung ${naehe.toFixed(1)}`)
    b.karte('1 – 10 Holz holen', beginn)

    // 2. Ohne Menge losschicken, dann abbrechen
    b.setzePhase('Abbrechen')
    beginn = b.jetzt
    ben.sage('Bernard, hol Holz')
    const geraten = await warteAufChat(beginn, /16/, 3000)
    b.pruefe('Ohne Menge rät Bernard 16 und sagt es', !!geraten, geraten ? `„${geraten.text}“` : 'keine Ansage mit 16')
    // „stopp“ erst, wenn er nachweislich hackt: der erste Stamm ist gefallen
    for (let i = 0; i < 120 && b.abgebautSeit(beginn).length === 0; i++) await warte(250)
    b.pruefe('Bernard fängt mit der zweiten Aufgabe an', b.abgebautSeit(beginn).length > 0,
      b.abgebautSeit(beginn).length > 0 ? `erster Stamm nach ${((b.abgebautSeit(beginn)[0].t - beginn) / 1000).toFixed(0)} s` : 'nach 30 s noch nichts abgebaut')
    await warte(1000) // mitten im nächsten Stamm
    ben.sage('Bernard, stopp')
    await warte(1500)
    const stoppZeit = b.jetzt
    const stoppPos = b.position('Bernard')
    await warte(6000)
    const bewegt = abstand(stoppPos, b.position('Bernard'))
    const nachStopp = b.abgebautSeit(stoppZeit)
    b.pruefe('Nach „stopp“ hört Bernard auf', bewegt < 1 && nachStopp.length === 0,
      `nach „stopp“ ${bewegt.toFixed(1)} Blöcke bewegt, ${nachStopp.length} Blöcke abgebaut`)
    const spaeteMeldung = vonBernard(stoppZeit).find(c => /fertig|finde/i.test(c.text))
    b.pruefe('Keine Meldung zur abgebrochenen Aufgabe', !spaeteMeldung,
      spaeteMeldung ? `sagt trotzdem: „${spaeteMeldung.text}“` : 'still')
    b.karte('2 – Abbrechen', beginn)

    // 3. Stein ohne Spitzhacke
    b.setzePhase('Stein ohne Spitzhacke')
    beginn = b.jetzt
    const vorher = b.position('Bernard')
    ben.sage('Bernard, hol 5 Stein')
    const hinweis = await warteAufChat(beginn, /spitzhacke/i, 3000)
    await warte(2000)
    b.pruefe('Bernard sagt, dass ihm die Spitzhacke fehlt', !!hinweis, hinweis ? `„${hinweis.text}“` : 'kein Hinweis')
    b.pruefe('Bernard gräbt nicht mit der Hand nach Stein', b.abgebautSeit(beginn).length === 0 && abstand(vorher, b.position('Bernard')) < 1,
      `${b.abgebautSeit(beginn).length} Blöcke abgebaut`)
  },
}

function zaehleGesetzteBlaetter(welt: Bot) {
  let anzahl = 0
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 0; dy <= 1; dy++) {
    const p = new Vec3(FALSCHER_BAUM.x + dx, BODEN + FALSCHER_BAUM.hoehe + dy, FALSCHER_BAUM.z + dz)
    if (welt.blockAt(p)?.name === 'oak_leaves') anzahl++
  }
  return anzahl
}

/** Fragt den Server, wo herumliegende Stämme wirklich sind (Position und Stückzahl). */
async function liegendeStaemme(rcon: Rcon) {
  const auswahl = '@e[type=item,nbt={Item:{id:"minecraft:oak_log"}},tag=!gezaehlt,limit=1,sort=arbitrary]'
  const liste: string[] = []
  for (let i = 0; i < 20; i++) {
    const pos = await rcon.send(`data get entity ${auswahl} Pos`)
    if (/no entity/i.test(pos)) break
    const zahlen = (pos.match(/-?[\d.]+(?=d)/g) ?? []).map(z => Number(z).toFixed(2))
    const menge = (await rcon.send(`data get entity ${auswahl} Item.count`)).match(/(\d+)\s*$/)?.[1] ?? '?'
    const alter = Number((await rcon.send(`data get entity ${auswahl} Age`)).match(/(-?\d+)s?\s*$/)?.[1] ?? NaN)
    liste.push(`${menge}× bei ${zahlen.join('/')} (seit ${Math.round(alter / 20)} s)`)
    await rcon.send(`tag ${auswahl} add gezaehlt`)
  }
  await rcon.send('tag @e[type=item] remove gezaehlt')
  return liste
}

/** Stämme, die über einer Stelle stehen geblieben sind, an der Bernard schon Holz abgebaut hat. */
function schwebendeStaemme(welt: Bot, abgebaut: Position[]) {
  const saeulen = new Map(abgebaut.map(p => [`${p.x}/${p.z}`, p]))
  const reste: string[] = []
  for (const p of saeulen.values()) {
    for (let y = BODEN; y < BODEN + 16; y++) {
      const block = welt.blockAt(new Vec3(p.x, y, p.z))
      if (block?.name.endsWith('_log')) reste.push(`${block.name} bei ${p.x}/${y}/${p.z}`)
    }
  }
  return reste
}
