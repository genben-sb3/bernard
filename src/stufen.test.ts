import { describe, expect, it } from 'vitest'
import { aktuelleStufe } from './stufen'

const STEINZEIT = {
  stone_pickaxe: 1, stone_sword: 1, stone_axe: 1, crafting_table: 1, furnace: 1, cobblestone: 16, oak_log: 16,
}

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

  it('zählt alle Holzsorten zusammen', () => {
    expect(aktuelleStufe({ ...STEINZEIT, oak_log: 6, birch_log: 6, spruce_log: 4 })).toBe(1)
  })

  it('lässt ein besseres Werkzeug für ein schlechteres gelten', () => {
    expect(aktuelleStufe({ ...STEINZEIT, stone_pickaxe: 0, iron_pickaxe: 1 })).toBe(1)
    expect(aktuelleStufe({ ...STEINZEIT, stone_sword: 0, diamond_sword: 1 })).toBe(1)
  })

  it('lässt ein Holz- oder Goldwerkzeug nicht für ein Steinwerkzeug gelten', () => {
    expect(aktuelleStufe({ ...STEINZEIT, stone_axe: 0, wooden_axe: 1, golden_axe: 1 })).toBe(0)
  })
})
