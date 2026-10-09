import { describe, expect, it } from 'vitest'
import { aktuelleStufe, anzahl, rueckfall } from './stufen'

/** Soll-Inventar der Steinzeit, ohne Vorrat */
const STEINZEIT = { stone_pickaxe: 1, stone_sword: 1, stone_axe: 1, crafting_table: 1, furnace: 1 }
/** Soll-Inventar der Eisenzeit, ohne Vorrat */
const EISENZEIT = { iron_pickaxe: 1, iron_sword: 1, shield: 1, bucket: 1 }

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

  it('lässt Eisenwerkzeuge für die Steinwerkzeuge gelten', () => {
    expect(aktuelleStufe({ crafting_table: 1, furnace: 1, iron_pickaxe: 1, iron_axe: 1, iron_sword: 1 })).toBe(1)
  })

  it('ist 2 mit dem Soll-Inventar der Steinzeit und der Eisenzeit', () => {
    expect(aktuelleStufe({ ...STEINZEIT, ...EISENZEIT })).toBe(2)
  })

  it('ist 2, wenn Eisenspitzhacke und Eisenschwert die Steinwerkzeuge ersetzen', () => {
    expect(aktuelleStufe({ stone_axe: 1, crafting_table: 1, furnace: 1, ...EISENZEIT })).toBe(2)
  })

  it('ist 1, wenn ein Ding der Eisenzeit fehlt', () => {
    expect(aktuelleStufe({ ...STEINZEIT, ...EISENZEIT, shield: 0 })).toBe(1)
    expect(aktuelleStufe({ ...STEINZEIT, ...EISENZEIT, bucket: 0 })).toBe(1)
  })

  it('ist 0 mit der Eisenzeit allein, wenn die Steinzeit nicht erfüllt ist', () => {
    expect(aktuelleStufe(EISENZEIT)).toBe(0)
  })

  it('braucht keinen Vorrat der Eisenzeit für die Stufe', () => {
    expect(aktuelleStufe({ ...STEINZEIT, ...EISENZEIT, torch: 0, coal: 0 })).toBe(2)
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

  it('erkennt den Rückfall von der Eisenzeit auf die Steinzeit', () => {
    expect(rueckfall({ ...STEINZEIT, ...EISENZEIT }, { ...STEINZEIT, ...EISENZEIT, iron_sword: 0 })).toEqual({ von: 2, nach: 1 })
  })

  it('ist kein Rückfall, wenn nur Fackeln und Kohle der Eisenzeit verbraucht sind', () => {
    expect(rueckfall({ ...STEINZEIT, ...EISENZEIT, torch: 32, coal: 8 }, { ...STEINZEIT, ...EISENZEIT, torch: 2 })).toBeNull()
  })

  it('ist kein Rückfall, wenn die Stufe bleibt (Tod auf Stufe 0)', () => {
    expect(rueckfall({ stone_pickaxe: 1, oak_log: 4 }, {})).toBeNull()
  })

  it('ist kein Rückfall, wenn nichts verloren geht', () => {
    expect(rueckfall(STEINZEIT, STEINZEIT)).toBeNull()
  })
})
