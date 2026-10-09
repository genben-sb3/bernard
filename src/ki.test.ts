import { describe, expect, it } from 'vitest'
import { verstehe, werteAus, type DingAufloeser, type Lage } from './ki'

const aufloesen: DingAufloeser = wort =>
  ({ crafting_table: 'werkbank', wooden_pickaxe: 'holzspitzhacke', cobblestone: 'stein', ladder: 'mc:ladder' } as const)[wort] ?? null

const mitWerkzeug = (name: string, args: unknown) => ({
  choices: [{ message: { content: '', tool_calls: [{ function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args) } }] } }],
})
const mitText = (content: string) => ({ choices: [{ message: { content } }] })

describe('werteAus', () => {
  it('übersetzt Werkzeugaufrufe in Befehle', () => {
    expect(werteAus(mitWerkzeug('follow_player', {}), aufloesen)).toEqual({ art: 'befehl', befehl: { art: 'folgen' } })
    expect(werteAus(mitWerkzeug('stop', '{}'), aufloesen)).toEqual({ art: 'befehl', befehl: { art: 'stopp' } })
    expect(werteAus(mitWerkzeug('show_inventory', {}), aufloesen)).toEqual({ art: 'befehl', befehl: { art: 'inventar' } })
  })

  it('löst Gegenstände auf, auch solche außerhalb der Wortliste', () => {
    expect(werteAus(mitWerkzeug('craft_item', { item: 'ladder', amount: 3 }), aufloesen))
      .toEqual({ art: 'befehl', befehl: { art: 'craften', ding: 'mc:ladder', menge: 3 } })
    expect(werteAus(mitWerkzeug('give_items', { item: 'cobblestone', amount: 2 }), aufloesen))
      .toEqual({ art: 'befehl', befehl: { art: 'geben', ding: 'stein', menge: 2 } })
  })

  it('gibt ohne Menge alles von dem Ding, bei „everything“ alles überhaupt', () => {
    expect(werteAus(mitWerkzeug('give_items', { item: 'wooden_pickaxe' }), aufloesen))
      .toEqual({ art: 'befehl', befehl: { art: 'geben', ding: 'holzspitzhacke', menge: 'alle' } })
    expect(werteAus(mitWerkzeug('give_items', { item: 'everything' }), aufloesen))
      .toEqual({ art: 'befehl', befehl: { art: 'geben', ding: null, menge: 'alle' } })
  })

  it('setzt sinnvolle Mengen und begrenzt Unsinn', () => {
    expect(werteAus(mitWerkzeug('gather', { material: 'wood' }), aufloesen))
      .toEqual({ art: 'befehl', befehl: { art: 'sammeln', material: 'holz', menge: 16, mengeGeraten: true } })
    expect(werteAus(mitWerkzeug('gather', { material: 'cobblestone', amount: 99999 }), aufloesen))
      .toEqual({ art: 'befehl', befehl: { art: 'sammeln', material: 'stein', menge: 640, mengeGeraten: false } })
    expect(werteAus(mitWerkzeug('craft_item', { item: 'crafting_table', amount: -2 }), aufloesen))
      .toEqual({ art: 'befehl', befehl: { art: 'craften', ding: 'werkbank', menge: 1 } })
  })

  it('versteht übliche Synonyme für Materialien', () => {
    expect(werteAus(mitWerkzeug('gather', { material: 'stone', amount: 4 }), aufloesen))
      .toEqual({ art: 'befehl', befehl: { art: 'sammeln', material: 'stein', menge: 4, mengeGeraten: false } })
    expect(werteAus(mitWerkzeug('gather', { material: 'minecraft:logs' }), aufloesen))
      .toMatchObject({ befehl: { material: 'holz' } })
  })

  it('antwortet statt zu raten, wenn ein Gegenstand unbekannt ist', () => {
    expect(werteAus(mitWerkzeug('craft_item', { item: 'spaceship' }), aufloesen).art).toBe('sagen')
    expect(werteAus(mitWerkzeug('gather', { material: 'diamond' }), aufloesen).art).toBe('sagen')
  })

  it('findet Werkzeugaufrufe, die als JSON im Text stehen', () => {
    const antwort = mitText('<tool_call>\n{"name": "craft_item", "arguments": {"item": "wooden_pickaxe"}}\n</tool_call>')
    expect(werteAus(antwort, aufloesen)).toEqual({ art: 'befehl', befehl: { art: 'craften', ding: 'holzspitzhacke', menge: 1 } })
  })

  it('nimmt reinen Text als Antwort, in einer Zeile', () => {
    expect(werteAus(mitText('„Mir geht\'s gut,\ndanke!“'), aufloesen)).toEqual({ art: 'sagen', text: 'Mir geht\'s gut, danke!' })
    expect(werteAus(mitWerkzeug('say', { text: 'Nein, Spieler greife ich nicht an.' }), aufloesen))
      .toEqual({ art: 'sagen', text: 'Nein, Spieler greife ich nicht an.' })
  })

  it('erkennt unbrauchbare Antworten', () => {
    expect(werteAus({}, aufloesen).art).toBe('fehler')
    expect(werteAus(mitText(''), aufloesen).art).toBe('fehler')
    expect(werteAus(mitWerkzeug('fly_to_moon', {}), aufloesen).art).toBe('fehler')
  })
})

describe('verstehe', () => {
  const lage: Lage = { kumpel: 'Ben', inventar: 'Ich habe 3 Ladder.', gegenstaende: 'ladder ×3', persoenlichkeit: 'freundlich' }
  const einstellungen = { url: 'http://ki.test/v1/', modell: 'test' }

  it('schickt Werkzeuge und Anweisung an die Schnittstelle', async () => {
    let anfrage: { url: string; body: { model: string; tools: unknown[]; messages: Array<{ role: string; content: string }> } } | undefined
    const holen = (async (url: string, init: RequestInit) => {
      anfrage = { url, body: JSON.parse(String(init.body)) }
      return new Response(JSON.stringify(mitWerkzeug('come_here', {})))
    }) as typeof fetch
    expect(await verstehe('komm mal her', lage, einstellungen, aufloesen, holen)).toEqual({ art: 'befehl', befehl: { art: 'kommHer' } })
    expect(anfrage?.url).toBe('http://ki.test/v1/chat/completions')
    expect(anfrage?.body.model).toBe('test')
    expect(anfrage?.body.tools.length).toBeGreaterThan(5)
    expect(anfrage?.body.messages[0].content).toContain('Never attack players')
    expect(anfrage?.body.messages[0].content).toContain('ladder ×3')
    expect(anfrage?.body.messages[1]).toEqual({ role: 'user', content: 'komm mal her' })
  })

  it('meldet „nicht erreichbar“ bei Netzfehlern und HTTP-Fehlern', async () => {
    const kaputt = (async () => { throw new Error('ECONNREFUSED') }) as typeof fetch
    expect((await verstehe('hallo', lage, einstellungen, aufloesen, kaputt))).toMatchObject({ art: 'fehler', grund: 'nichtErreichbar' })
    const fehler500 = (async () => new Response('kaputt', { status: 500 })) as typeof fetch
    expect((await verstehe('hallo', lage, einstellungen, aufloesen, fehler500))).toMatchObject({ art: 'fehler', grund: 'nichtErreichbar' })
  })

  it('bricht nach dem Zeitlimit ab', async () => {
    const langsam = ((_: string, init: RequestInit) => new Promise((_, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('abgebrochen')))
    })) as typeof fetch
    const ergebnis = await verstehe('hallo', lage, { ...einstellungen, zeitlimitMs: 50 }, aufloesen, langsam)
    expect(ergebnis).toMatchObject({ art: 'fehler', grund: 'nichtErreichbar' })
  })
})
