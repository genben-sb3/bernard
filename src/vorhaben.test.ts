import { describe, expect, it } from 'vitest'
import { todesansage } from './vorhaben'

const STEINZEIT = {
  stone_pickaxe: 1, stone_sword: 1, stone_axe: 1, crafting_table: 1, furnace: 1, cobblestone: 16, oak_log: 16,
}

describe('todesansage', () => {
  it('sagt einen Rückfall mit der neuen Stufe an', () => {
    expect(todesansage(STEINZEIT, {}, 2)).toBe('Ich bin gestorben, zurück auf Stufe 0.')
  })

  it('sagt ohne Rückfall nur, dass er weitermacht', () => {
    expect(todesansage({ stone_pickaxe: 1 }, {}, 1)).toBe('Ich bin gestorben, ich mach weiter bis zur Steinzeit.')
  })
})
