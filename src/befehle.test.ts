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

  it.each([
    ['gib mir 3 Eisenerz', 'eisenerz', 3],
    ['give me 3 iron ore', 'eisenerz', 3],
    ['gib mir 5 Kohleerz', 'kohleerz', 5],
    ['give me 5 coal ore', 'kohleerz', 5],
    ['gib mir den Eimer', 'eimer', 'alle'],
    ['give me the shield', 'schild', 'alle'],
    ['gib mir die Eisenspitzhacke', 'eisenspitzhacke', 'alle'],
  ])('kennt die Dinge der Eisenzeit: %s → %s × %s', (text, ding, menge) => {
    expect(erkenneBefehl(text)).toEqual({ art: 'geben', ding, menge })
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
    ['make me a crafting table', 'werkbank', 1],
    ['mach stöcke', 'stoecke', 1],
    ['stell einen ofen her', 'ofen', 1],
  ])('%s → %s × %i', (text, ding, menge) => {
    expect(erkenneBefehl(text)).toEqual({ art: 'craften', ding, menge })
  })

  it.each([
    ['mach eine Eisenspitzhacke', 'eisenspitzhacke'],
    ['craft an iron pickaxe', 'eisenspitzhacke'],
    ['crafte ein Eisenschwert', 'eisenschwert'],
    ['make an iron sword', 'eisenschwert'],
    ['mach eine Eisenaxt', 'eisenaxt'],
    ['craft an iron axe', 'eisenaxt'],
    ['bau mir einen Schild', 'schild'],
    ['make a shield', 'schild'],
    ['mach einen Eimer', 'eimer'],
    ['craft a bucket', 'eimer'],
  ])('kennt die Dinge der Eisenzeit: %s → %s', (text, ding) => {
    expect(erkenneBefehl(text)).toEqual({ art: 'craften', ding, menge: 1 })
  })

  it('craftet nur, was man herstellen kann', () => {
    expect(erkenneBefehl('mach 3 holz')).toBeNull()
  })
})

describe('erkenneBefehl – bauen', () => {
  it.each([
    ['bau mir eine Holzspitzhacke', 'holzspitzhacke', 1],
    ['baue eine Werkbank', 'werkbank', 1],
    ['bau mir 2 öfen', 'ofen', 2],
    ['build me a crafting table', 'werkbank', 1],
  ])('„%s“ craftet, weil es ein Gegenstand ist → %s × %i', (text, ding, menge) => {
    expect(erkenneBefehl(text)).toEqual({ art: 'craften', ding, menge })
  })

  it.each([
    'bau eine Hütte',
    'bau mir ein Haus',
    'baue eine Mauer um das Dorf',
    'bau mir 3 holz',
    'build a house',
    'build me a bridge',
  ])('„%s“ ist Bauen, das Bernard noch nicht kann', text => {
    expect(erkenneBefehl(text)).toEqual({ art: 'bauen' })
  })

  it('lässt „mach“ mit Unbekanntem weiter an die KI gehen', () => {
    expect(erkenneBefehl('mach mir eine Hütte')).toBeNull()
  })
})

describe('erkenneBefehl – schmelzen', () => {
  it.each([
    ['schmelz 5 eisen', 'eisenbarren', 5],
    ['mach 4 holzkohle', 'holzkohle', 4],
    ['schmilz mir 3 glas', 'glas', 3],
    ['smelt 2 iron ingots', 'eisenbarren', 2],
    ['brenn 8 holzkohle', 'holzkohle', 8],
    ['schmelz gold', 'goldbarren', 1],
    ['brenn 8 kohle', 'kohle', 8],
  ])('%s → %s × %i', (text, ding, menge) => {
    expect(erkenneBefehl(text)).toEqual({ art: 'craften', ding, menge })
  })

  it('schmilzt nur, was im Ofen entsteht', () => {
    expect(erkenneBefehl('schmelz 3 sand')).toBeNull()
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

describe('erkenneBefehl – Vorhaben', () => {
  it.each([
    ['spiel bis zur Steinzeit', 1],
    ['spiel bis zur eisenzeit', 2],
    ['spiele bis zur Diamantzeit', 3],
    ['spiel bis zum Nether', 4],
    ['spiel bis zum End', 5],
    ['spiel bis stufe 2', 2],
    ['play until the stone age', 1],
    ['play until stage 3', 3],
    ['besieg den Enderdrachen', 5],
    ['besiege den enderdrachen!', 5],
    ['töte den Enderdrachen', 5],
    ['kill the ender dragon', 5],
    ['beat the game', 5],
    ['spiel minecraft durch', 5],
  ])('%s → Zielstufe %i', (text, zielstufe) => {
    expect(erkenneBefehl(text)).toEqual({ art: 'vorhaben', zielstufe })
  })

  it.each(['spiel bis stufe 6', 'spiel bis zur bronzezeit', 'spiel mit mir', 'besieg den zombie'])('kennt „%s“ nicht', text => {
    expect(erkenneBefehl(text)).toBeNull()
  })
})

describe('erkenneBefehl – Vorhaben steuern', () => {
  it.each([
    ['mach weiter', 'weiter'],
    ['Mach mit dem Vorhaben weiter!', 'weiter'],
    ['weiter', 'weiter'],
    ['continue', 'weiter'],
    ['keep going', 'weiter'],
    ['vergiss das Vorhaben', 'vergessen'],
    ['vergiss es', 'vergessen'],
    ['hör auf mit dem Vorhaben', 'vergessen'],
    ['forget the plan', 'vergessen'],
    ['was machst du?', 'status'],
    ['was tust du gerade', 'status'],
    ['wie weit bist du?', 'status'],
    ['what are you doing?', 'status'],
    ['how far are you', 'status'],
    ['stopp', 'stopp'],
    ['bleib', 'stopp'],
  ])('%s → %s', (text, art) => {
    expect(erkenneBefehl(text)?.art).toBe(art)
  })

  it.each(['mach weiter so', 'vergiss den zombie', 'was machst du mit dem holz'])('kennt „%s“ nicht', text => {
    expect(erkenneBefehl(text)).toBeNull()
  })
})
