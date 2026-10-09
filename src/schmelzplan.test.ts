import { describe, expect, it } from 'vitest'
import { istSchmelzbar, planeSchmelzen } from './schmelzplan'

describe('planeSchmelzen', () => {
  it('schmilzt Roheisen mit Kohle', () => {
    expect(planeSchmelzen('iron_ingot', 3, { raw_iron: 5, coal: 2 })).toEqual({
      art: 'plan', eingabe: [{ name: 'raw_iron', anzahl: 3 }], brennstoff: [{ name: 'coal', anzahl: 1 }], sekunden: 30,
    })
  })

  it('nimmt auch Eisenerz, wenn kein Roheisen da ist', () => {
    const plan = planeSchmelzen('iron_ingot', 2, { iron_ore: 1, deepslate_iron_ore: 1, coal: 1 })
    expect(plan).toMatchObject({ art: 'plan', eingabe: [{ name: 'iron_ore', anzahl: 1 }, { name: 'deepslate_iron_ore', anzahl: 1 }] })
  })

  it('heizt ohne Kohle mit Brettern, 1,5 Stück pro Brett', () => {
    expect(planeSchmelzen('glass', 4, { sand: 4, oak_planks: 10 })).toMatchObject({
      art: 'plan', brennstoff: [{ name: 'oak_planks', anzahl: 3 }],
    })
  })

  it('verheizt Kohle vor Holzkohle vor Brettern vor Stämmen', () => {
    expect(planeSchmelzen('glass', 10, { sand: 10, oak_log: 9, oak_planks: 9, charcoal: 1, coal: 1 })).toMatchObject({
      brennstoff: [{ name: 'coal', anzahl: 1 }, { name: 'charcoal', anzahl: 1 }],
    })
  })

  it('verheizt keine Stämme, die selbst zu Holzkohle werden sollen', () => {
    expect(planeSchmelzen('charcoal', 1, { oak_log: 2 })).toMatchObject({
      art: 'plan', eingabe: [{ name: 'oak_log', anzahl: 1 }], brennstoff: [{ name: 'oak_log', anzahl: 1 }],
    })
    expect(planeSchmelzen('charcoal', 3, { oak_log: 3 })).toEqual({ art: 'fehlt', eingabe: 0, brennstoff: 3 })
  })

  it('sagt, wie viel Zutat und Brennstoff fehlt (Brennstoff in Schmelzvorgängen)', () => {
    expect(planeSchmelzen('iron_ingot', 4, { raw_iron: 1 })).toEqual({ art: 'fehlt', eingabe: 3, brennstoff: 4 })
    expect(planeSchmelzen('glass', 3, { sand: 3, stick: 2 })).toEqual({ art: 'fehlt', eingabe: 0, brennstoff: 2 })
  })

  it('kennt, was sich schmelzen lässt', () => {
    expect(istSchmelzbar('iron_ingot')).toBe(true)
    expect(istSchmelzbar('charcoal')).toBe(true)
    expect(istSchmelzbar('stick')).toBe(false)
  })
})
