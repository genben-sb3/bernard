import { describe, expect, it } from 'vitest'
import { MAX_FEHLSCHLAEGE, naechsterSchritt, weiterziehZiel, zaehleFehlschlag, WEITERZIEH_STRECKE } from './entscheider'

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
