// Bernard sammelt Material: hinlaufen, abbauen, aufheben, bis die Menge erreicht ist.
import type { Bot } from 'mineflayer'
import type { Block } from 'prismarine-block'
import pathfinderPkg from 'mineflayer-pathfinder'
import { Vec3 } from 'vec3'
import type { Material } from './befehle'
import { halteAn, type Abbruch } from './auftrag'
import { baueAb as baueAbZentral, bewegungen, warumNichtAbbauen } from './eingriffe'

const { goals } = pathfinderPkg

type MaterialArt = {
  block: (name: string) => boolean
  gegenstand: (name: string) => boolean
  /** Nur Stämme natürlich gewachsener Bäume, nie Gebautes. */
  nurBaeume?: boolean
  /** Werkzeug, ohne das der Block nichts fallen lässt. */
  werkzeug?: { name: string; passt: (gegenstand: string) => boolean }
}

const istStamm = (n: string) => /_(log|stem)$/.test(n) && !n.startsWith('stripped_')
const SPITZHACKE = { name: 'eine Spitzhacke', passt: (n: string) => n.endsWith('_pickaxe') }

export const MATERIALIEN: Record<Material, MaterialArt> = {
  holz: { block: istStamm, gegenstand: istStamm, nurBaeume: true },
  eichenholz: { block: n => n === 'oak_log', gegenstand: n => n === 'oak_log', nurBaeume: true },
  birkenholz: { block: n => n === 'birch_log', gegenstand: n => n === 'birch_log', nurBaeume: true },
  fichtenholz: { block: n => n === 'spruce_log', gegenstand: n => n === 'spruce_log', nurBaeume: true },
  stein: { block: n => n === 'stone' || n === 'cobblestone', gegenstand: n => n === 'cobblestone', werkzeug: SPITZHACKE },
  erde: { block: n => n === 'dirt' || n === 'grass_block', gegenstand: n => n === 'dirt' },
  sand: { block: n => n === 'sand', gegenstand: n => n === 'sand' },
}

const SUCHRADIUS = 48
const ZEITLIMIT_PRO_BLOCK_MS = 20000

export type Sammelergebnis =
  | { art: 'fertig'; anzahl: number }
  | { art: 'nichtsGefunden'; anzahl: number }
  | { art: 'werkzeugFehlt'; werkzeug: string }
  | { art: 'abgebrochen'; anzahl: number }


export function zaehle(bot: Bot, art: MaterialArt) {
  return bot.inventory.items().filter(i => art.gegenstand(i.name)).reduce((summe, i) => summe + i.count, 0)
}

/** Sammelt, bis `menge` Stück mehr im Inventar sind als beim Start. Angefangene Bäume fällt er ganz. */
export async function sammle(bot: Bot, material: Material, menge: number, abbruch: Abbruch,
  protokoll: (text: string) => void = () => {}): Promise<Sammelergebnis> {
  const art = MATERIALIEN[material]
  if (art.werkzeug && !bot.inventory.items().some(i => art.werkzeug!.passt(i.name))) {
    return { art: 'werkzeugFehlt', werkzeug: art.werkzeug.name }
  }
  const startbestand = zaehle(bot, art)
  const gesammelt = () => zaehle(bot, art) - startbestand
  const unerreichbar = new Set<string>()

  while (gesammelt() < menge) {
    if (abbruch.abgebrochen) return { art: 'abgebrochen', anzahl: gesammelt() }
    const block = naechsterBlock(bot, art, unerreichbar)
    if (!block) {
      await hebeAuf(bot, bot.entity.position, art, abbruch, 10)
      return { art: 'nichtsGefunden', anzahl: gesammelt() }
    }
    protokoll(`Sammeln: nehme ${block.name} bei ${block.position}`)
    try {
      if (art.nurBaeume) await faelleBaum(bot, block, art, abbruch, protokoll)
      else {
        await mitZeitlimit(baueAb(bot, block, art), ZEITLIMIT_PRO_BLOCK_MS)
        await hebeAuf(bot, block.position, art, abbruch)
      }
    } catch (fehler) {
      halteAn(bot, abbruch)
      if (bot.targetDigBlock && !abbruch.abgebrochen) bot.stopDigging()
      if (abbruch.abgebrochen) return { art: 'abgebrochen', anzahl: gesammelt() }
      protokoll(`Sammeln: ${block.position} klappt nicht (${fehler instanceof Error ? fehler.message : fehler}), überspringe`)
      unerreichbar.add(block.position.toString())
    }
  }
  return { art: 'fertig', anzahl: gesammelt() }
}

/**
 * Fällt einen Baum von unten nach oben: neben den Stamm stellen, unterste Stämme abbauen,
 * dann in die freie Stammsäule treten und den Rest über sich abbauen. So bleiben keine
 * schwebenden Stämme stehen, und alles fällt dorthin, wo Bernard steht.
 */
async function faelleBaum(bot: Bot, stamm: Block, art: MaterialArt, abbruch: Abbruch, protokoll: (text: string) => void) {
  const { x, z } = stamm.position
  let unten = stamm.position
  while (bot.blockAt(unten.offset(0, -1, 0))?.name === stamm.name) unten = unten.offset(0, -1, 0)
  const boden = unten.y

  const vorher = bot.pathfinder.movements
  bot.pathfinder.setMovements(holzfaellerBewegungen(bot))
  try {
    await faelleSaeule(bot, stamm, x, boden, z, art, abbruch, protokoll)
  } finally {
    bot.pathfinder.setMovements(vorher)
  }
}

/**
 * Bewegungen beim Baumfällen: wie sonst, aber natürliche Blätter dürfen weggeschlagen werden.
 * Bei kleinen Bäumen hängen die untersten Blätter auf Kopfhöhe direkt neben dem Stamm.
 */
function holzfaellerBewegungen(bot: Bot) {
  return bewegungen(bot, { abbauenErlaubt: istNatuerlichesBlatt })
}

function istNatuerlichesBlatt(b: Block) {
  if (!b.name.endsWith('_leaves')) return false
  const persistent = b.getProperties().persistent
  return persistent === false || persistent === 'false'
}

async function faelleSaeule(bot: Bot, stamm: Block, x: number, boden: number, z: number, art: MaterialArt,
  abbruch: Abbruch, protokoll: (text: string) => void) {
  await zumStamm(bot, x, boden, z, abbruch, protokoll)
  for (let y = boden; y < boden + 16; y++) {
    if (abbruch.abgebrochen) return
    const block = bot.blockAt(new Vec3(x, y, z))
    if (!block || block.name !== stamm.name) {
      if (y - boden >= 2) break // Säule zu Ende
      continue
    }
    if (!inReichweite(bot, block)) {
      // In die Säule treten, die unten schon frei ist
      await mitZeitlimit(bot.pathfinder.goto(new goals.GoalBlock(x, boden, z)), ZEITLIMIT_PRO_BLOCK_MS)
    }
    if (!inReichweite(bot, block)) {
      protokoll(`Sammeln: Stamm bei ${block.position} ist zu hoch, lasse ihn stehen`)
      break
    }
    await mitZeitlimit(baueAb(bot, block, art, false), ZEITLIMIT_PRO_BLOCK_MS)
  }
  if (abbruch.abgebrochen) return
  // In die freie Stammsäule treten: dort landen die meisten Stämme
  await mitZeitlimit(bot.pathfinder.goto(new goals.GoalBlock(x, boden, z)), 8000).catch(() => halteAn(bot, abbruch))
  await hebeAuf(bot, new Vec3(x, boden, z), art, abbruch, 6, protokoll)
}

/** Neben den Stamm stellen. Die Wegsuche bricht gelegentlich ohne Grund ab; ein zweiter Versuch klappt dann. */
async function zumStamm(bot: Bot, x: number, y: number, z: number, abbruch: Abbruch, protokoll: (text: string) => void) {
  for (let versuch = 1; ; versuch++) {
    try {
      return await mitZeitlimit(bot.pathfinder.goto(new goals.GoalGetToBlock(x, y, z)), ZEITLIMIT_PRO_BLOCK_MS)
    } catch (fehler) {
      halteAn(bot, abbruch)
      if (versuch >= 2 || abbruch.abgebrochen) throw fehler
      protokoll(`Sammeln: Weg zum Stamm bei ${x}/${y}/${z} klappt nicht (${fehler instanceof Error ? fehler.message : fehler}), neuer Versuch`)
    }
  }
}

const REICHWEITE = 4.5

function inReichweite(bot: Bot, block: Block) {
  const augen = bot.entity.position.offset(0, 1.62, 0)
  return augen.distanceTo(block.position.offset(0.5, 0.5, 0.5)) <= REICHWEITE
}

function naechsterBlock(bot: Bot, art: MaterialArt, unerreichbar: Set<string>): Block | null {
  const positionen = bot.findBlocks({
    matching: b => art.block(b.name),
    maxDistance: SUCHRADIUS,
    count: 200,
  })
  for (const pos of positionen) { // nach Entfernung sortiert
    if (unerreichbar.has(pos.toString())) continue
    const block = bot.blockAt(pos)
    if (!block) continue
    if (art.nurBaeume && !istNatuerlicherBaum(bot, block)) continue
    if (warumNichtAbbauen(bot, pos, block)) continue
    return block
  }
  return null
}

/**
 * Ein Stamm gehört zu einem natürlich gewachsenen Baum, wenn oben auf seiner Säule Blätter sitzen,
 * die nicht von Spielern gesetzt wurden (natürliche Blätter haben persistent=false).
 * So bleiben gebaute Holzhäuser und -zäune verschont.
 */
export function istNatuerlicherBaum(bot: Bot, stamm: Block): boolean {
  let oben = stamm.position
  for (let i = 0; i < 16; i++) {
    const darueber = bot.blockAt(oben.offset(0, 1, 0))
    if (!darueber || darueber.name !== stamm.name) break
    oben = oben.offset(0, 1, 0)
  }
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -1; dy <= 2; dy++) {
      for (let dz = -2; dz <= 2; dz++) {
        const b = bot.blockAt(oben.offset(dx, dy, dz))
        if (b && istNatuerlichesBlatt(b)) return true
      }
    }
  }
  return false
}

async function baueAb(bot: Bot, block: Block, art: MaterialArt, hinlaufen = true) {
  if (hinlaufen) await bot.pathfinder.goto(new goals.GoalGetToBlock(block.position.x, block.position.y, block.position.z))
  const aktuell = bot.blockAt(block.position)
  if (!aktuell || !art.block(aktuell.name)) return // inzwischen weg
  const werkzeug = bot.inventory.items().find(i => art.werkzeug?.passt(i.name) || (art.nurBaeume && i.name.endsWith('_axe')))
  if (werkzeug) await bot.equip(werkzeug, 'hand')
  await baueAbZentral(bot, aktuell)
}

/**
 * Hebt fallengelassene Gegenstände in der Nähe einer Stelle auf. Gegenstände aus der Höhe brauchen
 * etwa eine Sekunde, bis sie liegen; angesteuert wird nur ihre Position am Boden (x/z).
 */
async function hebeAuf(bot: Bot, stelle: Vec3, art: MaterialArt, abbruch: Abbruch, radius = 6,
  protokoll: (text: string) => void = () => {}) {
  // Stämme fallen aus bis zu 5 Blöcken Höhe, alles andere liegt fast sofort
  await new Promise(r => setTimeout(r, art.nurBaeume ? 1200 : 400))
  const versuche = new Map<number, number>()
  for (let i = 0; i < 16 && !abbruch.abgebrochen; i++) {
    const gegenstand = bot.nearestEntity(e =>
      e.name === 'item' && (versuche.get(e.id) ?? 0) < 2 &&
      e.position.distanceTo(stelle) < radius && art.gegenstand(itemName(e) ?? ''))
    if (!gegenstand) return
    versuche.set(gegenstand.id, (versuche.get(gegenstand.id) ?? 0) + 1)
    const p = gegenstand.position
    protokoll(`Aufheben: ${itemName(gegenstand)} bei ${p.floored()}`)
    // Pfad-Knoten sind ganze Blöcke: in den Block stellen, in dem der Gegenstand liegt
    await mitZeitlimit(bot.pathfinder.goto(new goals.GoalXZ(Math.floor(p.x), Math.floor(p.z))), 6000).catch(() => halteAn(bot, abbruch))
    await new Promise(r => setTimeout(r, 300))
  }
}

function itemName(entity: { getDroppedItem?: () => { name: string } | null }) {
  return entity.getDroppedItem?.()?.name
}

async function mitZeitlimit<T>(versprechen: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const ablauf = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`Zeitlimit ${ms} ms`)), ms) })
  try {
    return await Promise.race([versprechen, ablauf])
  } finally {
    clearTimeout(timer)
  }
}
