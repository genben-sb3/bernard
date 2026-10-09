import { describe, expect, it } from 'vitest'
import { naechsterSchritt } from './entscheider'

const STEINZEIT = {
  stone_pickaxe: 1, stone_sword: 1, stone_axe: 1, crafting_table: 1, furnace: 1, cobblestone: 16, oak_log: 16,
}

describe('naechsterSchritt', () => {
  it('besorgt mit leerem Inventar zuerst die Steinspitzhacke', () => {
    expect(naechsterSchritt({ inventar: {}, zielstufe: 1 })).toEqual({ art: 'besorge', ding: 'steinspitzhacke', menge: 1 })
  })

  it('besorgt das erste fehlende Ding in der Reihenfolge der Stufe', () => {
    const inventar = { stone_pickaxe: 1, crafting_table: 1, stone_axe: 1, cobblestone: 3 }
    expect(naechsterSchritt({ inventar, zielstufe: 1 })).toEqual({ art: 'besorge', ding: 'steinschwert', menge: 1 })
  })

  it('besorgt den Vorrat als Gesamtmenge', () => {
    const inventar = { ...STEINZEIT, cobblestone: 5 }
    expect(naechsterSchritt({ inventar, zielstufe: 1 })).toEqual({ art: 'besorge', ding: 'stein', menge: 16 })
  })

  it('besorgt nichts für ein Werkzeug, für das ein besseres da ist', () => {
    const inventar = { ...STEINZEIT, stone_pickaxe: 0, iron_pickaxe: 1, oak_log: 2 }
    expect(naechsterSchritt({ inventar, zielstufe: 1 })).toEqual({ art: 'besorge', ding: 'holz', menge: 16 })
  })

  it('ist fertig, wenn das Soll-Inventar der Zielstufe erfüllt ist', () => {
    expect(naechsterSchritt({ inventar: STEINZEIT, zielstufe: 1 })).toEqual({ art: 'fertig', grund: 'zielErreicht', stufe: 1 })
  })

  it('hört nach der Steinzeit auf, wenn die Zielstufe noch nicht umgesetzt ist', () => {
    expect(naechsterSchritt({ inventar: STEINZEIT, zielstufe: 5 })).toEqual({ art: 'fertig', grund: 'stufeNichtUmgesetzt', stufe: 1 })
  })

  it('arbeitet auch bei hoher Zielstufe zuerst die Steinzeit ab', () => {
    expect(naechsterSchritt({ inventar: {}, zielstufe: 5 })).toEqual({ art: 'besorge', ding: 'steinspitzhacke', menge: 1 })
  })

  it('wartet, solange ein Befehl läuft', () => {
    expect(naechsterSchritt({ inventar: {}, zielstufe: 1, befehlLaeuft: true })).toEqual({ art: 'warten' })
  })

  it('wartet, solange das Vorhaben pausiert ist', () => {
    expect(naechsterSchritt({ inventar: {}, zielstufe: 1, pausiert: true })).toEqual({ art: 'warten' })
  })

  it('macht weiter, wenn kein Befehl läuft und nichts pausiert ist', () => {
    expect(naechsterSchritt({ inventar: {}, zielstufe: 1, befehlLaeuft: false, pausiert: false }))
      .toEqual({ art: 'besorge', ding: 'steinspitzhacke', menge: 1 })
  })
})
