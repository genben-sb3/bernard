import { describe, expect, it } from 'vitest'
import { aktuelleStufe, anzahl, rueckfall } from './stufen'

/** Soll-Inventar der Steinzeit, ohne Vorrat */
const STEINZEIT = { stone_pickaxe: 1, stone_sword: 1, stone_axe: 1, crafting_table: 1, furnace: 1 }

describe('aktuelleStufe', () => {
  it('ist 0 mit leerem Inventar', () => {
    expect(aktuelleStufe({})).toBe(0)
  })

  it('ist 1 mit vollem Soll-Inventar der Steinzeit', () => {
    expect(aktuelleStufe(STEINZEIT)).toBe(1)
  })

  it('ist 0, wenn ein Ding der Steinzeit fehlt', () => {
    expect(aktuelleStufe({ ...STEINZEIT, furnace: 0 })).toBe(0)
  })

  it('braucht keinen Vorrat für die Stufe', () => {
    expect(aktuelleStufe({ ...STEINZEIT, cobblestone: 0, oak_log: 0 })).toBe(1)
  })

  it('zählt alle Holzsorten zusammen', () => {
    expect(anzahl({ oak_log: 6, birch_log: 6, spruce_log: 4 }, 'holz')).toBe(16)
  })

  it('lässt ein besseres Werkzeug für ein schlechteres gelten', () => {
    expect(aktuelleStufe({ ...STEINZEIT, stone_pickaxe: 0, iron_pickaxe: 1 })).toBe(1)
    expect(aktuelleStufe({ ...STEINZEIT, stone_sword: 0, diamond_sword: 1 })).toBe(1)
  })

  it('lässt ein Holz- oder Goldwerkzeug nicht für ein Steinwerkzeug gelten', () => {
    expect(aktuelleStufe({ ...STEINZEIT, stone_axe: 0, wooden_axe: 1, golden_axe: 1 })).toBe(0)
  })
})

describe('rueckfall', () => {
  it('erkennt, dass die Stufe nach einem Inventarverlust sinkt', () => {
    expect(rueckfall(STEINZEIT, {})).toEqual({ von: 1, nach: 0 })
  })

  it('erkennt auch einen teilweisen Verlust, der die Stufe kostet', () => {
    expect(rueckfall(STEINZEIT, { ...STEINZEIT, stone_axe: 0 })).toEqual({ von: 1, nach: 0 })
  })

  it('ist kein Rückfall, wenn nur Vorrat verbraucht ist', () => {
    expect(rueckfall({ ...STEINZEIT, cobblestone: 16, oak_log: 16 }, { ...STEINZEIT, cobblestone: 3 })).toBeNull()
  })

  it('ist kein Rückfall, wenn die Stufe bleibt (Tod auf Stufe 0)', () => {
    expect(rueckfall({ stone_pickaxe: 1, oak_log: 4 }, {})).toBeNull()
  })

  it('ist kein Rückfall, wenn nichts verloren geht', () => {
    expect(rueckfall(STEINZEIT, STEINZEIT)).toBeNull()
  })
})
