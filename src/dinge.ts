// Gegenstände, über die Bernard spricht: Wörter im Chat, deutsche und englische Namen, passende Minecraft-Gegenstände.
import type { Sprache } from './texte'

export type Ding = {
  /** Einzahl und Mehrzahl für Bernards Antworten. */
  einzahl: string
  mehrzahl: string
  /** „kein Holz“, „keinen Bruchstein“, „keine Bretter“ */
  kein: string
  /** Englisch wie im Spiel: Einzahl, Mehrzahl, „no …“ */
  en: [einzahl: string, mehrzahl: string, kein: string]
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
  holz: { einzahl: 'Holz', mehrzahl: 'Holz', kein: 'kein Holz', en: ['Wood', 'Wood', 'no wood'], passt: istStamm },
  eichenholz: { einzahl: 'Eichenstamm', mehrzahl: 'Eichenstämme', kein: 'keine Eichenstämme', en: ['Oak Log', 'Oak Logs', 'no oak logs'], passt: genau('oak_log') },
  birkenholz: { einzahl: 'Birkenstamm', mehrzahl: 'Birkenstämme', kein: 'keine Birkenstämme', en: ['Birch Log', 'Birch Logs', 'no birch logs'], passt: genau('birch_log') },
  fichtenholz: { einzahl: 'Fichtenstamm', mehrzahl: 'Fichtenstämme', kein: 'keine Fichtenstämme', en: ['Spruce Log', 'Spruce Logs', 'no spruce logs'], passt: genau('spruce_log') },
  stein: { einzahl: 'Bruchstein', mehrzahl: 'Bruchstein', kein: 'keinen Bruchstein', en: ['Cobblestone', 'Cobblestone', 'no cobblestone'], passt: genau('cobblestone') },
  erde: { einzahl: 'Erde', mehrzahl: 'Erde', kein: 'keine Erde', en: ['Dirt', 'Dirt', 'no dirt'], passt: genau('dirt') },
  sand: { einzahl: 'Sand', mehrzahl: 'Sand', kein: 'keinen Sand', en: ['Sand', 'Sand', 'no sand'], passt: genau('sand') },
  bretter: { einzahl: 'Brett', mehrzahl: 'Bretter', kein: 'keine Bretter', en: ['Plank', 'Planks', 'no planks'], passt: n => n.endsWith('_planks'), herstellen: HOLZARTEN.map(h => `${h}_planks`) },
  stoecke: { einzahl: 'Stock', mehrzahl: 'Stöcke', kein: 'keine Stöcke', en: ['Stick', 'Sticks', 'no sticks'], passt: genau('stick'), herstellen: ['stick'] },
  werkbank: { einzahl: 'Werkbank', mehrzahl: 'Werkbänke', kein: 'keine Werkbank', en: ['Crafting Table', 'Crafting Tables', 'no crafting table'], passt: genau('crafting_table'), herstellen: ['crafting_table'] },
  truhe: { einzahl: 'Truhe', mehrzahl: 'Truhen', kein: 'keine Truhe', en: ['Chest', 'Chests', 'no chest'], passt: genau('chest'), herstellen: ['chest'] },
  ofen: { einzahl: 'Ofen', mehrzahl: 'Öfen', kein: 'keinen Ofen', en: ['Furnace', 'Furnaces', 'no furnace'], passt: genau('furnace'), herstellen: ['furnace'] },
  fackeln: { einzahl: 'Fackel', mehrzahl: 'Fackeln', kein: 'keine Fackeln', en: ['Torch', 'Torches', 'no torches'], passt: genau('torch'), herstellen: ['torch'] },
  // Ohne Mine entsteht Kohle im Ofen: als Holzkohle aus Holz
  kohle: { einzahl: 'Kohle', mehrzahl: 'Kohle', kein: 'keine Kohle', en: ['Coal', 'Coal', 'no coal'], passt: genau('coal', 'charcoal'), schmelzen: 'charcoal' },
  holzkohle: { einzahl: 'Holzkohle', mehrzahl: 'Holzkohle', kein: 'keine Holzkohle', en: ['Charcoal', 'Charcoal', 'no charcoal'], passt: genau('charcoal'), schmelzen: 'charcoal' },
  eisenbarren: { einzahl: 'Eisenbarren', mehrzahl: 'Eisenbarren', kein: 'keine Eisenbarren', en: ['Iron Ingot', 'Iron Ingots', 'no iron ingots'], passt: genau('iron_ingot'), schmelzen: 'iron_ingot' },
  goldbarren: { einzahl: 'Goldbarren', mehrzahl: 'Goldbarren', kein: 'keine Goldbarren', en: ['Gold Ingot', 'Gold Ingots', 'no gold ingots'], passt: genau('gold_ingot'), schmelzen: 'gold_ingot' },
  kupferbarren: { einzahl: 'Kupferbarren', mehrzahl: 'Kupferbarren', kein: 'keine Kupferbarren', en: ['Copper Ingot', 'Copper Ingots', 'no copper ingots'], passt: genau('copper_ingot'), schmelzen: 'copper_ingot' },
  glas: { einzahl: 'Glas', mehrzahl: 'Glas', kein: 'kein Glas', en: ['Glass', 'Glass', 'no glass'], passt: genau('glass'), schmelzen: 'glass' },
  roheisen: { einzahl: 'Roheisen', mehrzahl: 'Roheisen', kein: 'kein Roheisen', en: ['Raw Iron', 'Raw Iron', 'no raw iron'], passt: genau('raw_iron') },
  eisenerz: { einzahl: 'Eisenerz', mehrzahl: 'Eisenerz', kein: 'kein Eisenerz', en: ['Iron Ore', 'Iron Ore', 'no iron ore'], passt: genau('iron_ore', 'deepslate_iron_ore') },
  kohleerz: { einzahl: 'Kohleerz', mehrzahl: 'Kohleerz', kein: 'kein Kohleerz', en: ['Coal Ore', 'Coal Ore', 'no coal ore'], passt: genau('coal_ore', 'deepslate_coal_ore') },
  setzlinge: { einzahl: 'Setzling', mehrzahl: 'Setzlinge', kein: 'keine Setzlinge', en: ['Sapling', 'Saplings', 'no saplings'], passt: n => n.endsWith('_sapling') },
  holzspitzhacke: { einzahl: 'Holzspitzhacke', mehrzahl: 'Holzspitzhacken', kein: 'keine Holzspitzhacke', en: ['Wooden Pickaxe', 'Wooden Pickaxes', 'no wooden pickaxe'], passt: genau('wooden_pickaxe'), herstellen: ['wooden_pickaxe'] },
  holzaxt: { einzahl: 'Holzaxt', mehrzahl: 'Holzäxte', kein: 'keine Holzaxt', en: ['Wooden Axe', 'Wooden Axes', 'no wooden axe'], passt: genau('wooden_axe'), herstellen: ['wooden_axe'] },
  holzschaufel: { einzahl: 'Holzschaufel', mehrzahl: 'Holzschaufeln', kein: 'keine Holzschaufel', en: ['Wooden Shovel', 'Wooden Shovels', 'no wooden shovel'], passt: genau('wooden_shovel'), herstellen: ['wooden_shovel'] },
  holzschwert: { einzahl: 'Holzschwert', mehrzahl: 'Holzschwerter', kein: 'kein Holzschwert', en: ['Wooden Sword', 'Wooden Swords', 'no wooden sword'], passt: genau('wooden_sword'), herstellen: ['wooden_sword'] },
  steinspitzhacke: { einzahl: 'Steinspitzhacke', mehrzahl: 'Steinspitzhacken', kein: 'keine Steinspitzhacke', en: ['Stone Pickaxe', 'Stone Pickaxes', 'no stone pickaxe'], passt: genau('stone_pickaxe'), herstellen: ['stone_pickaxe'] },
  steinaxt: { einzahl: 'Steinaxt', mehrzahl: 'Steinäxte', kein: 'keine Steinaxt', en: ['Stone Axe', 'Stone Axes', 'no stone axe'], passt: genau('stone_axe'), herstellen: ['stone_axe'] },
  steinschaufel: { einzahl: 'Steinschaufel', mehrzahl: 'Steinschaufeln', kein: 'keine Steinschaufel', en: ['Stone Shovel', 'Stone Shovels', 'no stone shovel'], passt: genau('stone_shovel'), herstellen: ['stone_shovel'] },
  steinschwert: { einzahl: 'Steinschwert', mehrzahl: 'Steinschwerter', kein: 'kein Steinschwert', en: ['Stone Sword', 'Stone Swords', 'no stone sword'], passt: genau('stone_sword'), herstellen: ['stone_sword'] },
  eisenspitzhacke: { einzahl: 'Eisenspitzhacke', mehrzahl: 'Eisenspitzhacken', kein: 'keine Eisenspitzhacke', en: ['Iron Pickaxe', 'Iron Pickaxes', 'no iron pickaxe'], passt: genau('iron_pickaxe'), herstellen: ['iron_pickaxe'] },
  eisenaxt: { einzahl: 'Eisenaxt', mehrzahl: 'Eisenäxte', kein: 'keine Eisenaxt', en: ['Iron Axe', 'Iron Axes', 'no iron axe'], passt: genau('iron_axe'), herstellen: ['iron_axe'] },
  eisenschwert: { einzahl: 'Eisenschwert', mehrzahl: 'Eisenschwerter', kein: 'kein Eisenschwert', en: ['Iron Sword', 'Iron Swords', 'no iron sword'], passt: genau('iron_sword'), herstellen: ['iron_sword'] },
  schild: { einzahl: 'Schild', mehrzahl: 'Schilde', kein: 'keinen Schild', en: ['Shield', 'Shields', 'no shield'], passt: genau('shield'), herstellen: ['shield'] },
  eimer: { einzahl: 'Eimer', mehrzahl: 'Eimer', kein: 'keinen Eimer', en: ['Bucket', 'Buckets', 'no bucket'], passt: genau('bucket'), herstellen: ['bucket'] },
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
      en: [anzeigename, anzeigename, `no ${anzeigename}`],
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
  eisenspitzhacke: 'eisenspitzhacke', 'iron pickaxe': 'eisenspitzhacke',
  eisenaxt: 'eisenaxt', 'iron axe': 'eisenaxt',
  eisenschwert: 'eisenschwert', 'iron sword': 'eisenschwert',
  schild: 'schild', schilde: 'schild', shield: 'schild', shields: 'schild',
  eimer: 'eimer', bucket: 'eimer', buckets: 'eimer',
  eisenerz: 'eisenerz', 'iron ore': 'eisenerz',
  kohleerz: 'kohleerz', 'coal ore': 'kohleerz',
}

export function dingAusWort(wort: string): DingName | null {
  return WOERTER[wort.toLowerCase().trim()] ?? null
}

/** „1 Werkbank“, „4 Bretter“, „12 Holz“. */
export function mitMenge(ding: DingSchluessel, anzahl: number, sprache: Sprache = 'de') {
  const d = dingFuer(ding)
  if (sprache === 'en') return `${anzahl} ${anzahl === 1 ? d.en[0] : d.en[1]}`
  return `${anzahl} ${anzahl === 1 ? d.einzahl : d.mehrzahl}`
}

/** Mehrzahl ohne Menge („Bruchstein“, „Oak Logs“). */
export function mehrzahl(ding: DingSchluessel, sprache: Sprache = 'de') {
  const d = dingFuer(ding)
  return sprache === 'en' ? d.en[1] : d.mehrzahl
}

/** „kein Holz“ / „no wood“ */
export function kein(ding: DingSchluessel, sprache: Sprache = 'de') {
  const d = dingFuer(ding)
  return sprache === 'en' ? d.en[2] : d.kein
}

/** Deutscher Name für einen beliebigen Minecraft-Gegenstand (oder der englische, wenn keiner bekannt ist). */
export function nameFuer(gegenstand: string, anzahl: number, englisch: string, sprache: Sprache = 'de'): string {
  if (sprache === 'en') return `${anzahl} ${englisch}` // so heißt es im Spiel
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
