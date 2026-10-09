import { describe, expect, it } from 'vitest'
import registryLoader from 'prismarine-registry'
import { erstellePlanner, type Bestand, type Plan } from './craftplan'

const registry = registryLoader('26.1')
const id = (name: string) => registry.itemsByName[name].id
const name = (i: number) => registry.items[i].name
const bestand = (eintraege: Record<string, number>): Bestand => new Map(Object.entries(eintraege).map(([n, a]) => [id(n), a]))
const bekannt = new Set(['cobblestone', 'oak_log', 'oak_planks', 'stick'])
const { plane } = erstellePlanner(registry, i => bekannt.has(registry.items[i].name))

function schritte(plan: Plan) {
  if (plan.art !== 'plan') throw new Error(`kein Plan, es fehlt: ${[...plan.fehlt].map(([i, n]) => `${n} ${name(i)}`)}`)
  return plan.schritte.map(s => `${s.mal}× ${name(s.rezept.result.id)}`)
}

function fehlt(plan: Plan) {
  if (plan.art !== 'fehlt') throw new Error('es fehlt nichts')
  return Object.fromEntries([...plan.fehlt].map(([i, n]) => [name(i), n]))
}

describe('Craft-Planer', () => {
  it('macht Bretter aus Stämmen', () => {
    const plan = plane([id('oak_planks')], 4, bestand({ oak_log: 3 }), false)
    expect(schritte(plan)).toEqual(['1× oak_planks'])
  })

  it('nimmt die Brettsorte, für die Holz da ist', () => {
    const ziele = ['oak_planks', 'spruce_planks', 'birch_planks'].map(id)
    const plan = plane(ziele, 4, bestand({ birch_log: 1 }), false)
    expect(schritte(plan)).toEqual(['1× birch_planks'])
  })

  it('macht eine Werkbank ohne Werkbank (2×2-Rezept)', () => {
    const plan = plane([id('crafting_table')], 1, bestand({ oak_log: 1 }), false)
    expect(schritte(plan)).toEqual(['1× oak_planks', '1× crafting_table'])
    expect(plan.art === 'plan' && plan.brauchtWerkbank).toBe(false)
  })

  it('macht eine Holzspitzhacke aus Stämmen: Werkbank zuerst, dann Bretter und Stöcke', () => {
    const plan = plane([id('wooden_pickaxe')], 1, bestand({ oak_log: 3 }), false)
    expect(plan.art === 'plan' && plan.brauchtWerkbank).toBe(true)
    // 4 Bretter für die Werkbank; 3 für die Spitzhacke und 2 für die Stöcke brauchen zwei weitere Stämme
    expect(schritte(plan)).toEqual(['1× oak_planks', '1× crafting_table', '1× oak_planks', '1× oak_planks', '1× stick', '1× wooden_pickaxe'])
  })

  it('braucht keine neue Werkbank, wenn eine in der Nähe steht', () => {
    const plan = plane([id('wooden_pickaxe')], 1, bestand({ oak_log: 2 }), true)
    expect(schritte(plan)).toEqual(['1× oak_planks', '1× oak_planks', '1× stick', '1× wooden_pickaxe'])
  })

  it('nimmt Vorhandenes, statt es neu zu craften', () => {
    const plan = plane([id('wooden_pickaxe')], 1, bestand({ oak_planks: 3, stick: 2 }), true)
    expect(schritte(plan)).toEqual(['1× wooden_pickaxe'])
  })

  it('sagt, wie viel Grundmaterial fehlt', () => {
    expect(fehlt(plane([id('furnace')], 1, bestand({ cobblestone: 5 }), true))).toEqual({ cobblestone: 3 })
  })

  it('nennt bei Gleichstand das bekannte Material (Bruchstein statt Tiefenschiefer)', () => {
    expect(fehlt(plane([id('furnace')], 1, bestand({}), true))).toEqual({ cobblestone: 8 })
  })

  it('zählt beim Fehlen auch die Werkbank mit', () => {
    // Werkbank: 1 Stamm, Spitzhacke: 3 Bretter + 2 Stöcke = 2 Stämme (mit Überschuss)
    const plan = plane([id('wooden_pickaxe')], 1, bestand({}), false)
    expect(Object.values(fehlt(plan)).reduce((a, b) => a + b, 0)).toBe(3)
  })
})
