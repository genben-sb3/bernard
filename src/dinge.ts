// Gegenstände, über die Bernard spricht: Wörter im Chat, deutsche Namen, passende Minecraft-Gegenstände.

export type Ding = {
  /** Einzahl und Mehrzahl für Bernards Antworten. */
  einzahl: string
  mehrzahl: string
  /** „kein Holz“, „keinen Bruchstein“, „keine Bretter“ */
  kein: string
  /** Welche Minecraft-Gegenstände dazugehören. */
  passt: (gegenstand: string) => boolean
  /** Was Bernard herstellt, wenn er es craften soll (bei Brettern: passend zum vorhandenen Holz). */
  herstellen?: string[]
  /** Was im Ofen entsteht, wenn Bernard es herstellen soll (Gegenstandsname). */
  schmelzen?: string
}

const genau = (...namen: string[]) => (n: string) => namen.includes(n)
const istStamm = (n: string) => /_(log|stem)$/.test(n) && !n.startsWith('stripped_')
const HOLZARTEN = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak']

export const DINGE = {
  holz: { einzahl: 'Holz', mehrzahl: 'Holz', kein: 'kein Holz', passt: istStamm },
  eichenholz: { einzahl: 'Eichenstamm', mehrzahl: 'Eichenstämme', kein: 'keine Eichenstämme', passt: genau('oak_log') },
  birkenholz: { einzahl: 'Birkenstamm', mehrzahl: 'Birkenstämme', kein: 'keine Birkenstämme', passt: genau('birch_log') },
  fichtenholz: { einzahl: 'Fichtenstamm', mehrzahl: 'Fichtenstämme', kein: 'keine Fichtenstämme', passt: genau('spruce_log') },
  stein: { einzahl: 'Bruchstein', mehrzahl: 'Bruchstein', kein: 'keinen Bruchstein', passt: genau('cobblestone') },
  erde: { einzahl: 'Erde', mehrzahl: 'Erde', kein: 'keine Erde', passt: genau('dirt') },
  sand: { einzahl: 'Sand', mehrzahl: 'Sand', kein: 'keinen Sand', passt: genau('sand') },
  bretter: { einzahl: 'Brett', mehrzahl: 'Bretter', kein: 'keine Bretter', passt: n => n.endsWith('_planks'), herstellen: HOLZARTEN.map(h => `${h}_planks`) },
  stoecke: { einzahl: 'Stock', mehrzahl: 'Stöcke', kein: 'keine Stöcke', passt: genau('stick'), herstellen: ['stick'] },
  werkbank: { einzahl: 'Werkbank', mehrzahl: 'Werkbänke', kein: 'keine Werkbank', passt: genau('crafting_table'), herstellen: ['crafting_table'] },
  truhe: { einzahl: 'Truhe', mehrzahl: 'Truhen', kein: 'keine Truhe', passt: genau('chest'), herstellen: ['chest'] },
  ofen: { einzahl: 'Ofen', mehrzahl: 'Öfen', kein: 'keinen Ofen', passt: genau('furnace'), herstellen: ['furnace'] },
  fackeln: { einzahl: 'Fackel', mehrzahl: 'Fackeln', kein: 'keine Fackeln', passt: genau('torch'), herstellen: ['torch'] },
  kohle: { einzahl: 'Kohle', mehrzahl: 'Kohle', kein: 'keine Kohle', passt: genau('coal', 'charcoal') },
  holzkohle: { einzahl: 'Holzkohle', mehrzahl: 'Holzkohle', kein: 'keine Holzkohle', passt: genau('charcoal'), schmelzen: 'charcoal' },
  eisenbarren: { einzahl: 'Eisenbarren', mehrzahl: 'Eisenbarren', kein: 'keine Eisenbarren', passt: genau('iron_ingot'), schmelzen: 'iron_ingot' },
  goldbarren: { einzahl: 'Goldbarren', mehrzahl: 'Goldbarren', kein: 'keine Goldbarren', passt: genau('gold_ingot'), schmelzen: 'gold_ingot' },
  kupferbarren: { einzahl: 'Kupferbarren', mehrzahl: 'Kupferbarren', kein: 'keine Kupferbarren', passt: genau('copper_ingot'), schmelzen: 'copper_ingot' },
  glas: { einzahl: 'Glas', mehrzahl: 'Glas', kein: 'kein Glas', passt: genau('glass'), schmelzen: 'glass' },
  roheisen: { einzahl: 'Roheisen', mehrzahl: 'Roheisen', kein: 'kein Roheisen', passt: genau('raw_iron') },
  setzlinge: { einzahl: 'Setzling', mehrzahl: 'Setzlinge', kein: 'keine Setzlinge', passt: n => n.endsWith('_sapling') },
  holzspitzhacke: { einzahl: 'Holzspitzhacke', mehrzahl: 'Holzspitzhacken', kein: 'keine Holzspitzhacke', passt: genau('wooden_pickaxe'), herstellen: ['wooden_pickaxe'] },
  holzaxt: { einzahl: 'Holzaxt', mehrzahl: 'Holzäxte', kein: 'keine Holzaxt', passt: genau('wooden_axe'), herstellen: ['wooden_axe'] },
  holzschaufel: { einzahl: 'Holzschaufel', mehrzahl: 'Holzschaufeln', kein: 'keine Holzschaufel', passt: genau('wooden_shovel'), herstellen: ['wooden_shovel'] },
  holzschwert: { einzahl: 'Holzschwert', mehrzahl: 'Holzschwerter', kein: 'kein Holzschwert', passt: genau('wooden_sword'), herstellen: ['wooden_sword'] },
  steinspitzhacke: { einzahl: 'Steinspitzhacke', mehrzahl: 'Steinspitzhacken', kein: 'keine Steinspitzhacke', passt: genau('stone_pickaxe'), herstellen: ['stone_pickaxe'] },
  steinaxt: { einzahl: 'Steinaxt', mehrzahl: 'Steinäxte', kein: 'keine Steinaxt', passt: genau('stone_axe'), herstellen: ['stone_axe'] },
  steinschaufel: { einzahl: 'Steinschaufel', mehrzahl: 'Steinschaufeln', kein: 'keine Steinschaufel', passt: genau('stone_shovel'), herstellen: ['stone_shovel'] },
  steinschwert: { einzahl: 'Steinschwert', mehrzahl: 'Steinschwerter', kein: 'kein Steinschwert', passt: genau('stone_sword'), herstellen: ['stone_sword'] },
} satisfies Record<string, Ding>

export type DingName = keyof typeof DINGE

/** Ein Ding aus der Wortliste oder ein beliebiger Minecraft-Gegenstand („mc:ladder“), z. B. von der KI. */
export type DingSchluessel = DingName | `mc:${string}`

const minecraftDinge = new Map<string, Ding>()

/** Macht einen beliebigen Minecraft-Gegenstand zum Ding (Name wie im Spiel, englisch). */
export function minecraftDing(gegenstand: string, anzeigename: string): DingSchluessel {
  const schluessel = `mc:${gegenstand}` as const
  if (!minecraftDinge.has(schluessel)) {
    minecraftDinge.set(schluessel, {
      einzahl: anzeigename, mehrzahl: anzeigename, kein: `kein ${anzeigename}`,
      passt: n => n === gegenstand, herstellen: [gegenstand],
    })
  }
  return schluessel
}

export function dingFuer(schluessel: DingSchluessel): Ding {
  const d = schluessel.startsWith('mc:') ? minecraftDinge.get(schluessel) : (DINGE as Record<string, Ding>)[schluessel]
  if (!d) throw new Error(`Unbekanntes Ding ${schluessel}`)
  return d
}

/** Wörter im Chat (klein geschrieben) → Ding. */
const WOERTER: Record<string, DingName> = {
  holz: 'holz', wood: 'holz', log: 'holz', logs: 'holz', stamm: 'holz', 'stämme': 'holz',
  eichenholz: 'eichenholz', eiche: 'eichenholz', eichenstamm: 'eichenholz', 'eichenstämme': 'eichenholz', oak: 'eichenholz',
  birkenholz: 'birkenholz', birke: 'birkenholz', birkenstamm: 'birkenholz', 'birkenstämme': 'birkenholz', birch: 'birkenholz',
  fichtenholz: 'fichtenholz', fichte: 'fichtenholz', fichtenstamm: 'fichtenholz', 'fichtenstämme': 'fichtenholz', spruce: 'fichtenholz',
  stein: 'stein', steine: 'stein', bruchstein: 'stein', stone: 'stein', cobblestone: 'stein',
  erde: 'erde', dirt: 'erde',
  sand: 'sand',
  brett: 'bretter', bretter: 'bretter', planke: 'bretter', planken: 'bretter', plank: 'bretter', planks: 'bretter',
  stock: 'stoecke', 'stöcke': 'stoecke', stoecke: 'stoecke', stick: 'stoecke', sticks: 'stoecke',
  werkbank: 'werkbank', 'werkbänke': 'werkbank', 'crafting table': 'werkbank', craftingtable: 'werkbank',
  truhe: 'truhe', truhen: 'truhe', kiste: 'truhe', chest: 'truhe',
  ofen: 'ofen', 'öfen': 'ofen', furnace: 'ofen',
  fackel: 'fackeln', fackeln: 'fackeln', torch: 'fackeln', torches: 'fackeln',
  kohle: 'kohle', coal: 'kohle',
  holzkohle: 'holzkohle', charcoal: 'holzkohle',
  eisen: 'eisenbarren', eisenbarren: 'eisenbarren', iron: 'eisenbarren', 'iron ingot': 'eisenbarren', 'iron ingots': 'eisenbarren',
  gold: 'goldbarren', goldbarren: 'goldbarren', 'gold ingot': 'goldbarren', 'gold ingots': 'goldbarren',
  kupfer: 'kupferbarren', kupferbarren: 'kupferbarren', copper: 'kupferbarren', 'copper ingot': 'kupferbarren', 'copper ingots': 'kupferbarren',
  glas: 'glas', glass: 'glas',
  roheisen: 'roheisen', 'raw iron': 'roheisen',
  setzling: 'setzlinge', setzlinge: 'setzlinge', sapling: 'setzlinge', saplings: 'setzlinge',
  holzspitzhacke: 'holzspitzhacke', 'wooden pickaxe': 'holzspitzhacke',
  holzaxt: 'holzaxt', 'wooden axe': 'holzaxt',
  holzschaufel: 'holzschaufel', 'wooden shovel': 'holzschaufel',
  holzschwert: 'holzschwert', 'wooden sword': 'holzschwert',
  steinspitzhacke: 'steinspitzhacke', 'stone pickaxe': 'steinspitzhacke',
  steinaxt: 'steinaxt', 'stone axe': 'steinaxt',
  steinschaufel: 'steinschaufel', 'stone shovel': 'steinschaufel',
  steinschwert: 'steinschwert', 'stone sword': 'steinschwert',
}

export function dingAusWort(wort: string): DingName | null {
  return WOERTER[wort.toLowerCase().trim()] ?? null
}

/** „1 Werkbank“, „4 Bretter“, „12 Holz“. */
export function mitMenge(ding: DingSchluessel, anzahl: number) {
  const d = dingFuer(ding)
  return `${anzahl} ${anzahl === 1 ? d.einzahl : d.mehrzahl}`
}

/** Deutscher Name für einen beliebigen Minecraft-Gegenstand (oder der englische, wenn keiner bekannt ist). */
export function nameFuer(gegenstand: string, anzahl: number, englisch: string): string {
  for (const [name, d] of Object.entries(DINGE) as Array<[DingName, Ding]>) {
    if (name !== 'holz' && d.passt(gegenstand)) return mitMenge(name, anzahl)
  }
  if (DINGE.holz.passt(gegenstand)) return mitMenge('holz', anzahl)
  return `${anzahl} ${englisch}`
}

/**
 * Löst ein Wort in ein Ding auf: deutsches/englisches Wort aus der Wortliste, Schlüssel der Wortliste oder
 * Minecraft-Gegenstands-ID („oak_log“, „minecraft:ladder“). Bekannte Gegenstände bekommen ihren deutschen Namen.
 */
export function dingAufloeser(bot: { registry: { itemsByName: Record<string, { name: string; displayName: string } | undefined> } }) {
  return (wort: string): DingSchluessel | null => {
    const bekannt = dingAusWort(wort) ?? (wort in DINGE ? (wort as DingName) : null)
    if (bekannt) return bekannt
    const id = wort.toLowerCase().trim().replace(/^minecraft:/, '').replace(/\s+/g, '_')
    const item = bot.registry.itemsByName[id]
    if (!item) return null
    const passend = (Object.entries(DINGE) as Array<[DingName, Ding]>)
      .find(([name, d]) => name !== 'holz' && (d.herstellen?.includes(id) || d.passt(id)))
    if (passend) return passend[0]
    if (DINGE.holz.passt(id)) return 'holz'
    return minecraftDing(id, item.displayName)
  }
}
