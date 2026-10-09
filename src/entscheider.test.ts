import { describe, expect, it } from 'vitest'
import { MAX_FEHLSCHLAEGE, naechsterSchritt, weiterziehZiel, zaehleFehlschlag, WEITERZIEH_STRECKE } from './entscheider'
import type { Stufe } from './stufen'

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

  it('besorgt den Vorrat erst, wenn das Soll-Inventar der Stufe da ist', () => {
    const inventar = { stone_pickaxe: 1, crafting_table: 1, stone_axe: 1, stone_sword: 1, cobblestone: 0 }
    expect(naechsterSchritt({ inventar, zielstufe: 1 })).toEqual({ art: 'besorge', ding: 'ofen', menge: 1 })
  })

  it('füllt den Vorrat der Zielstufe vor dem Ende ganz auf, auch wenn er über der Hälfte liegt', () => {
    const inventar = { ...STEINZEIT, cobblestone: 12 }
    expect(naechsterSchritt({ inventar, zielstufe: 1 })).toEqual({ art: 'besorge', ding: 'stein', menge: 16 })
  })

  describe('Vorrat unterwegs (mit einer erfundenen zweiten Stufe)', () => {
    const stufen: Stufe[] = [
      { nummer: 1, name: 'Steinzeit', soll: [{ ding: 'steinspitzhacke', menge: 1 }], vorrat: [{ ding: 'fackeln', menge: 16 }] },
      { nummer: 2, name: 'Eisenzeit', soll: [{ ding: 'ofen', menge: 1 }, { ding: 'truhe', menge: 1 }], vorrat: [] },
    ]

    it('füllt einen Vorrat unter der Hälfte vor dem nächsten Soll-Ding auf', () => {
      expect(naechsterSchritt({ inventar: { stone_pickaxe: 1, torch: 7 }, zielstufe: 2 }, stufen))
        .toEqual({ art: 'besorge', ding: 'fackeln', menge: 16 })
    })

    it('lässt einen Vorrat ab der Hälfte in Ruhe und arbeitet an der nächsten Stufe', () => {
      expect(naechsterSchritt({ inventar: { stone_pickaxe: 1, torch: 8 }, zielstufe: 2 }, stufen))
        .toEqual({ art: 'besorge', ding: 'ofen', menge: 1 })
    })

    it('füllt den Vorrat einer niedrigeren Stufe auch nach Erreichen der Zielstufe nur unter der Hälfte auf', () => {
      expect(naechsterSchritt({ inventar: { stone_pickaxe: 1, torch: 8, furnace: 1, chest: 1 }, zielstufe: 2 }, stufen))
        .toEqual({ art: 'fertig', grund: 'zielErreicht', stufe: 2 })
    })
  })

  it('besorgt nichts für ein Werkzeug, für das ein besseres da ist', () => {
    const inventar = { ...STEINZEIT, stone_pickaxe: 0, iron_pickaxe: 1, oak_log: 2 }
    expect(naechsterSchritt({ inventar, zielstufe: 1 })).toEqual({ art: 'besorge', ding: 'holz', menge: 16 })
  })

  it('ist fertig, wenn das Soll-Inventar der Zielstufe erfüllt ist', () => {
    expect(naechsterSchritt({ inventar: STEINZEIT, zielstufe: 1 })).toEqual({ art: 'fertig', grund: 'zielErreicht', stufe: 1 })
  })

  it('arbeitet nach der Steinzeit an der Eisenzeit, auch beim Enderdrachen', () => {
    expect(naechsterSchritt({ inventar: STEINZEIT, zielstufe: 5 })).toEqual({ art: 'besorge', ding: 'eisenspitzhacke', menge: 1 })
    expect(naechsterSchritt({ inventar: STEINZEIT, zielstufe: 2 })).toEqual({ art: 'besorge', ding: 'eisenspitzhacke', menge: 1 })
  })

  it('besorgt die Eisenzeit in der Reihenfolge Eisenspitzhacke, Eisenschwert, Schild, Eimer', () => {
    expect(naechsterSchritt({ inventar: { ...STEINZEIT, iron_pickaxe: 1 }, zielstufe: 2 })).toEqual({ art: 'besorge', ding: 'eisenschwert', menge: 1 })
    expect(naechsterSchritt({ inventar: { ...STEINZEIT, iron_pickaxe: 1, iron_sword: 1 }, zielstufe: 2 })).toEqual({ art: 'besorge', ding: 'schild', menge: 1 })
    expect(naechsterSchritt({ inventar: { ...STEINZEIT, iron_pickaxe: 1, iron_sword: 1, shield: 1 }, zielstufe: 2 })).toEqual({ art: 'besorge', ding: 'eimer', menge: 1 })
  })

  it('hört nach der Eisenzeit auf, wenn die nächste Stufe noch nicht umgesetzt ist', () => {
    const inventar = { ...STEINZEIT, iron_pickaxe: 1, iron_sword: 1, shield: 1, bucket: 1, torch: 32, cobblestone: 32, coal: 8 }
    expect(naechsterSchritt({ inventar, zielstufe: 5 })).toEqual({ art: 'fertig', grund: 'stufeNichtUmgesetzt', stufe: 2 })
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

  describe('Fehlschläge', () => {
    const start = { x: 0, z: 0 }

    it('zieht nach einem „nicht gefunden“ weiter', () => {
      const aktion = naechsterSchritt({ inventar: {}, zielstufe: 1, position: start, besucht: [start], fehlschlag: { ding: 'holz', wo: start, anzahl: 1 } })
      expect(aktion.art).toBe('weiterziehen')
      if (aktion.art !== 'weiterziehen') return
      expect(aktion.ding).toBe('holz')
      expect(Math.hypot(aktion.nach.x, aktion.nach.z)).toBeCloseTo(WEITERZIEH_STRECKE, 0)
    })

    it('versucht es nach dem Weiterziehen am neuen Ort erneut', () => {
      const dort = { x: WEITERZIEH_STRECKE, z: 0 }
      expect(naechsterSchritt({ inventar: {}, zielstufe: 1, position: dort, besucht: [start, dort], fehlschlag: { ding: 'holz', wo: start, anzahl: 1 } }))
        .toEqual({ art: 'besorge', ding: 'steinspitzhacke', menge: 1 })
    })

    it('meidet beim Weiterziehen schon besuchte Gegenden', () => {
      const osten = { x: WEITERZIEH_STRECKE, z: 0 }
      const ziel = weiterziehZiel(start, [start, osten])
      expect(ziel.x).toBeLessThan(0)
      expect(Math.abs(ziel.z)).toBeLessThan(WEITERZIEH_STRECKE / 2)
    })

    it('zieht von schon besuchten Orten weg nach außen weiter', () => {
      const osten = { x: WEITERZIEH_STRECKE, z: 0 }
      const ziel = weiterziehZiel(osten, [start, osten])
      expect(ziel.x).toBeGreaterThan(osten.x)
    })

    it('meldet nach mehrmaligem Fehlschlag desselben Dings und wartet dann', () => {
      const hier = { x: 80, z: 0 }
      expect(naechsterSchritt({ inventar: {}, zielstufe: 1, position: hier, besucht: [start, hier], fehlschlag: { ding: 'stein', wo: hier, anzahl: MAX_FEHLSCHLAEGE } }))
        .toEqual({ art: 'melden', ding: 'stein', anzahl: MAX_FEHLSCHLAEGE })
    })

    it('zählt Fehlschläge desselben Dings hintereinander', () => {
      const erster = zaehleFehlschlag(undefined, { art: 'nichtGefunden', ding: 'stein', wo: start })
      expect(erster).toEqual({ ding: 'stein', wo: start, anzahl: 1 })
      const zweiter = zaehleFehlschlag(erster, { art: 'nichtGefunden', ding: 'stein', wo: { x: 40, z: 0 } })
      expect(zweiter).toEqual({ ding: 'stein', wo: { x: 40, z: 0 }, anzahl: 2 })
    })

    it('fängt bei einem anderen Ding von vorn an zu zählen', () => {
      const bisher = { ding: 'holz' as const, wo: start, anzahl: 2 }
      expect(zaehleFehlschlag(bisher, { art: 'nichtGefunden', ding: 'stein', wo: start })).toEqual({ ding: 'stein', wo: start, anzahl: 1 })
    })

    it('setzt den Zähler nach einem Erfolg zurück', () => {
      expect(zaehleFehlschlag({ ding: 'holz', wo: start, anzahl: 2 }, { art: 'erfolg' })).toBeUndefined()
    })

    it('wartet auch mit Fehlschlägen, solange ein Befehl läuft', () => {
      expect(naechsterSchritt({ inventar: {}, zielstufe: 1, befehlLaeuft: true, position: start, besucht: [start], fehlschlag: { ding: 'holz', wo: start, anzahl: 1 } }))
        .toEqual({ art: 'warten' })
    })
  })
})
