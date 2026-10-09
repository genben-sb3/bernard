import { describe, expect, it } from 'vitest'
import { anBernard, erkenneBefehl, istKumpel } from './befehle'

describe('anBernard', () => {
  it('erkennt die Anrede mit Namen im öffentlichen Chat', () => {
    expect(anBernard({ absender: 'Ben', text: 'Bernard, folge mir', privat: false })).toBe('folge mir')
    expect(anBernard({ absender: 'Ben', text: 'bernard: stopp', privat: false })).toBe('stopp')
    expect(anBernard({ absender: 'Ben', text: 'hey Bernard komm her', privat: false })).toBe('komm her')
  })

  it('ignoriert öffentliche Nachrichten ohne Anrede', () => {
    expect(anBernard({ absender: 'Ben', text: 'folge mir', privat: false })).toBeNull()
    expect(anBernard({ absender: 'Ben', text: 'Bernardo, folge mir', privat: false })).toBeNull()
  })

  it('nimmt private Nachrichten ohne Anrede an', () => {
    expect(anBernard({ absender: 'Ben', text: ' folge mir ', privat: true })).toBe('folge mir')
  })
})

describe('erkenneBefehl', () => {
  it.each([
    ['folge mir', 'folgen'],
    ['Folg mir!', 'folgen'],
    ['follow me', 'folgen'],
    ['stopp', 'stopp'],
    ['Bleib hier.', 'stopp'],
    ['komm her', 'kommHer'],
    ['come here', 'kommHer'],
  ])('%s → %s', (text, art) => {
    expect(erkenneBefehl(text)?.art).toBe(art)
  })

  it('kennt freie Sätze nicht (die gehen später an die KI)', () => {
    expect(erkenneBefehl('könntest du mir vielleicht etwas Holz besorgen')).toBeNull()
  })
})

describe('istKumpel', () => {
  it('vergleicht Namen ohne Groß-/Kleinschreibung', () => {
    expect(istKumpel('ben', ['Ben'])).toBe(true)
    expect(istKumpel('Fremder', ['Ben'])).toBe(false)
  })
})

describe('erkenneBefehl – sammeln', () => {
  it.each([
    ['hol 10 holz', 10, 'holz'],
    ['hol mir 5 Stück Holz', 5, 'holz'],
    ['sammle 20 Eichenholz', 20, 'eichenholz'],
    ['bring mir 3 stein', 3, 'stein'],
    ['get 8 wood', 8, 'holz'],
    ['collect 12 logs', 12, 'holz'],
  ])('%s → %i × %s', (text, menge, material) => {
    expect(erkenneBefehl(text)).toEqual({ art: 'sammeln', menge, material, mengeGeraten: false })
  })

  it('rät 16 Stück, wenn keine Menge genannt ist', () => {
    expect(erkenneBefehl('hol holz')).toEqual({ art: 'sammeln', menge: 16, material: 'holz', mengeGeraten: true })
  })

  it('kennt unbekannte Materialien nicht', () => {
    expect(erkenneBefehl('hol 5 diamanten')).toBeNull()
  })
})

describe('erkenneBefehl – Inventar', () => {
  it.each(['was hast du dabei', 'Was hast du?', 'inventar', 'zeig dein inventar', 'inventory', 'what do you have'])('%s', text => {
    expect(erkenneBefehl(text)).toEqual({ art: 'inventar' })
  })
})

describe('erkenneBefehl – geben', () => {
  it.each([
    ['gib mir 5 holz', 'holz', 5],
    ['gib mir eine Werkbank', 'werkbank', 1],
    ['gib mir die Holzspitzhacke', 'holzspitzhacke', 'alle'],
    ['gib mir holz', 'holz', 'alle'],
    ['give me 3 stone', 'stein', 3],
    ['gib mir zwei stöcke', 'stoecke', 2],
  ])('%s → %s × %s', (text, ding, menge) => {
    expect(erkenneBefehl(text)).toEqual({ art: 'geben', ding, menge })
  })

  it.each(['gib mir alles', 'give me everything', 'gib mir all deine sachen'])('%s → alles', text => {
    expect(erkenneBefehl(text)).toEqual({ art: 'geben', ding: null, menge: 'alle' })
  })

  it('kennt unbekannte Dinge nicht', () => {
    expect(erkenneBefehl('gib mir 3 diamanten')).toBeNull()
  })
})

describe('erkenneBefehl – craften', () => {
  it.each([
    ['mach 4 bretter', 'bretter', 4],
    ['crafte eine Werkbank', 'werkbank', 1],
    ['bau mir eine Holzspitzhacke', 'holzspitzhacke', 1],
    ['craft 2 sticks', 'stoecke', 2],
    ['mach stöcke', 'stoecke', 1],
    ['stell einen ofen her', 'ofen', 1],
  ])('%s → %s × %i', (text, ding, menge) => {
    expect(erkenneBefehl(text)).toEqual({ art: 'craften', ding, menge })
  })

  it('craftet nur, was man herstellen kann', () => {
    expect(erkenneBefehl('mach 3 holz')).toBeNull()
  })
})

describe('erkenneBefehl – Füllwörter', () => {
  it.each([
    ['bleib mal da stehen', 'stopp'],
    ['folg mir bitte', 'folgen'],
    ['komm doch mal her', 'kommHer'],
    ['bitte stopp', 'stopp'],
    ['was hast du denn dabei', 'inventar'],
    ['bleib da', 'stopp'],
  ])('%s → %s', (text, art) => {
    expect(erkenneBefehl(text)?.art).toBe(art)
  })

  it('lässt Mengen und Dinge in Ruhe', () => {
    expect(erkenneBefehl('hol mir bitte mal 5 holz')).toEqual({ art: 'sammeln', menge: 5, material: 'holz', mengeGeraten: false })
    expect(erkenneBefehl('gib mir doch mal 2 stöcke')).toEqual({ art: 'geben', ding: 'stoecke', menge: 2 })
  })
})
