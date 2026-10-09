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
    expect(erkenneBefehl('hol mir bitte 10 Holz')).toBeNull()
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
