import { describe, expect, it } from 'vitest'
import { erstelleLaufbericht, type Eintrag } from './laufbericht'

const STEINZEIT = {
  stone_pickaxe: 1, stone_sword: 1, stone_axe: 1, crafting_table: 1, furnace: 1, cobblestone: 16, oak_log: 16,
}

/** Laufbericht mit einer Uhr, die bei jedem Eintrag 20 Ticks und 1 Sekunde weitergeht. */
function bericht() {
  const eintraege: Eintrag[] = []
  let tick = 1000
  let ms = Date.parse('2026-10-09T10:00:00Z')
  const uhr = () => ({ spielzeit: (tick += 20), echtzeit: new Date((ms += 1000)) })
  return { eintraege, laufbericht: erstelleLaufbericht(e => eintraege.push(e), uhr) }
}

const ohneZeit = (e: Eintrag) => {
  const { spielzeit, echtzeit, sekunden, ...rest } = e
  return rest
}

describe('Laufbericht', () => {
  it('beginnt mit Zielstufe und aktueller Stufe', () => {
    const { eintraege, laufbericht } = bericht()
    laufbericht.start(1, {})
    expect(eintraege.map(ohneZeit)).toEqual([{ art: 'start', zielstufe: 1, stufe: 0 }])
  })

  it('hält jedes Ding des Soll-Inventars fest, sobald es erfüllt ist, und nur einmal', () => {
    const { eintraege, laufbericht } = bericht()
    laufbericht.start(1, {})
    laufbericht.beobachte({ stone_pickaxe: 1, oak_log: 3 })
    laufbericht.beobachte({ stone_pickaxe: 1, oak_log: 5 })
    laufbericht.beobachte({ stone_pickaxe: 1, oak_log: 16, crafting_table: 1 })
    expect(eintraege.slice(1).map(ohneZeit)).toEqual([
      { art: 'erfuellt', ding: 'steinspitzhacke', menge: 1 },
      { art: 'erfuellt', ding: 'werkbank', menge: 1 },
      { art: 'erfuellt', ding: 'holz', menge: 16 },
    ])
  })

  it('hält nichts fest, was schon beim Start da war', () => {
    const { eintraege, laufbericht } = bericht()
    laufbericht.start(1, { stone_pickaxe: 1 })
    laufbericht.beobachte({ stone_pickaxe: 1 })
    expect(eintraege).toHaveLength(1)
  })

  it('hält den Stufenwechsel fest', () => {
    const { eintraege, laufbericht } = bericht()
    laufbericht.start(1, { ...STEINZEIT, furnace: 0 })
    laufbericht.beobachte(STEINZEIT)
    expect(eintraege.slice(1).map(ohneZeit)).toEqual([
      { art: 'erfuellt', ding: 'ofen', menge: 1 },
      { art: 'stufe', von: 0, nach: 1 },
    ])
  })

  it('endet mit Grund und Stufe', () => {
    const { eintraege, laufbericht } = bericht()
    laufbericht.start(1, {})
    laufbericht.ende('zeitlimit', { stone_pickaxe: 1 })
    expect(eintraege.map(ohneZeit).at(-1)).toEqual({ art: 'ende', grund: 'zeitlimit', stufe: 0 })
  })

  it('versieht jeden Eintrag mit Spielzeit, Echtzeit und Sekunden seit dem Start', () => {
    const { eintraege, laufbericht } = bericht()
    laufbericht.start(1, {})
    laufbericht.ende('vergessen', {})
    expect(eintraege[0]).toMatchObject({ spielzeit: 1020, echtzeit: '2026-10-09T10:00:01.000Z', sekunden: 0 })
    expect(eintraege[1]).toMatchObject({ spielzeit: 1040, echtzeit: '2026-10-09T10:00:02.000Z', sekunden: 1 })
  })

  it('hält Weiterziehen und Aufgeben fest', () => {
    const { eintraege, laufbericht } = bericht()
    laufbericht.start(1, {})
    laufbericht.weiterziehen('holz', { x: 1, z: 2 }, { x: 41, z: 2 })
    laufbericht.aufgeben('stein', 3)
    expect(eintraege.slice(1).map(ohneZeit)).toEqual([
      { art: 'weiterziehen', ding: 'holz', von: { x: 1, z: 2 }, nach: { x: 41, z: 2 } },
      { art: 'aufgeben', ding: 'stein', fehlschlaege: 3 },
    ])
  })
})
