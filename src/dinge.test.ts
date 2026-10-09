import { describe, expect, it } from 'vitest'
import registryLoader from 'prismarine-registry'
import { dingAufloeser, dingFuer, mitMenge } from './dinge'

const aufloesen = dingAufloeser({ registry: registryLoader('26.1') as never })

describe('dingAufloeser', () => {
  it('kennt Wörter aus der Wortliste', () => {
    expect(aufloesen('Werkbank')).toBe('werkbank')
    expect(aufloesen('wooden pickaxe')).toBe('holzspitzhacke')
  })

  it('ordnet Minecraft-IDs bekannten Dingen zu, damit Bernard deutsche Namen nennt', () => {
    expect(aufloesen('crafting_table')).toBe('werkbank')
    expect(aufloesen('minecraft:cobblestone')).toBe('stein')
    expect(aufloesen('oak_log')).toBe('eichenholz')
    expect(aufloesen('acacia_log')).toBe('holz')
    expect(aufloesen('oak_planks')).toBe('bretter')
  })

  it('macht unbekannte Minecraft-Gegenstände zu Dingen mit ihrem Spielnamen', () => {
    const leiter = aufloesen('ladder')
    expect(leiter).toBe('mc:ladder')
    expect(dingFuer(leiter!).passt('ladder')).toBe(true)
    expect(dingFuer(leiter!).herstellen).toEqual(['ladder'])
    expect(mitMenge(leiter!, 3)).toBe('3 Ladder')
  })

  it('kennt Erfundenes nicht', () => {
    expect(aufloesen('spaceship')).toBeNull()
  })
})
