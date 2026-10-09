import { describe, expect, it } from 'vitest'
import { erkenneSprache, waehleSprache } from './texte'
import { mitMenge } from './dinge'

describe('erkenneSprache', () => {
  it.each([
    ['folge mir', 'de'], ['follow me', 'en'],
    ['stopp', 'de'], ['stop', 'en'],
    ['komm her', 'de'], ['come here', 'en'],
    ['hol 10 holz', 'de'], ['get 10 wood', 'en'],
    ['was hast du dabei', 'de'], ['what do you have', 'en'],
    ['gib mir alles', 'de'], ['give me everything', 'en'],
    ['mach eine werkbank', 'de'], ['craft 2 sticks', 'en'],
    ['bau eine Hütte', 'de'], ['build a house', 'en'],
    ['kannst du mir zwei Leitern craften?', 'de'], ['could you get me some wood please', 'en'],
  ] as const)('%s → %s', (text, sprache) => {
    expect(erkenneSprache(text)).toBe(sprache)
  })

  it('weiß es bei zu wenig Hinweisen nicht', () => {
    expect(erkenneSprache('ok')).toBeNull()
  })
})

describe('waehleSprache', () => {
  it('nimmt bei „wie-befehl“ die Sprache des Satzes, sonst Deutsch', () => {
    expect(waehleSprache('wie-befehl', 'follow me')).toBe('en')
    expect(waehleSprache('wie-befehl', 'ok')).toBe('de')
  })

  it('nimmt eine feste Einstellung immer', () => {
    expect(waehleSprache('en', 'folge mir')).toBe('en')
    expect(waehleSprache('de', 'follow me')).toBe('de')
  })
})

describe('mitMenge auf Englisch', () => {
  it('nennt Minecraft-Namen', () => {
    expect(mitMenge('eichenholz', 3, 'en')).toBe('3 Oak Logs')
    expect(mitMenge('eichenholz', 1, 'en')).toBe('1 Oak Log')
    expect(mitMenge('stein', 5, 'en')).toBe('5 Cobblestone')
    expect(mitMenge('werkbank', 1, 'en')).toBe('1 Crafting Table')
    expect(mitMenge('holz', 4, 'en')).toBe('4 Wood')
  })

  it('bleibt ohne Angabe Deutsch', () => {
    expect(mitMenge('eichenholz', 3)).toBe('3 Eichenstämme')
  })
})

describe('beschreibeFehlendes', () => {
  it('fasst Holzsorten zusammen und spricht beide Sprachen', async () => {
    const registryLoader = (await import('prismarine-registry')).default
    const { beschreibeFehlendes } = await import('./craften')
    const registry = registryLoader('26.1')
    const bot = { registry } as never
    const id = (n: string) => registry.itemsByName[n].id
    const fehlt = new Map([[id('cherry_log'), 1], [id('oak_log'), 1], [id('cobblestone'), 3]])
    expect(beschreibeFehlendes(bot, fehlt, 'de')).toBe('2 Holz und 3 Bruchstein')
    expect(beschreibeFehlendes(bot, fehlt, 'en')).toBe('2 Wood and 3 Cobblestone')
  })
})
