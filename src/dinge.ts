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
export function mitMenge(ding: DingName, anzahl: number) {
  const d = DINGE[ding]
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
