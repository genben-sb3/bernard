// Zentrale Stelle für alles, was Bernard an der Welt verändert: Abbauen und Platzieren.
// Jede Veränderung, auch die der Wegfindung, läuft über die Regeln hier. Weitere Regeln
// (z. B. geschützte Bereiche) werden mit erlaubeAbbauenNur / erlaubePlatzierenNur angehängt.
import type { Bot } from 'mineflayer'
import type { Block } from 'prismarine-block'
import pathfinderPkg from 'mineflayer-pathfinder'
import type { Vec3 } from 'vec3'

const { Movements } = pathfinderPkg

/** Liefert einen Grund, warum der Eingriff nicht erlaubt ist, oder null, wenn er erlaubt ist. */
export type Regel = (position: Vec3, block: Block | null) => string | null

type Regeln = { abbauen: Regel[]; platzieren: Regel[] }
const regelnJeBot = new WeakMap<Bot, Regeln>()

function regeln(bot: Bot): Regeln {
  let r = regelnJeBot.get(bot)
  if (!r) {
    r = { abbauen: [], platzieren: [] }
    regelnJeBot.set(bot, r)
  }
  return r
}

export function erlaubeAbbauenNur(bot: Bot, regel: Regel) {
  regeln(bot).abbauen.push(regel)
}

export function erlaubePlatzierenNur(bot: Bot, regel: Regel) {
  regeln(bot).platzieren.push(regel)
}

export function warumNichtAbbauen(bot: Bot, position: Vec3, block: Block | null = bot.blockAt(position)): string | null {
  for (const regel of regeln(bot).abbauen) {
    const grund = regel(position, block)
    if (grund) return grund
  }
  return null
}

export function warumNichtPlatzieren(bot: Bot, position: Vec3): string | null {
  for (const regel of regeln(bot).platzieren) {
    const grund = regel(position, bot.blockAt(position))
    if (grund) return grund
  }
  return null
}

export class EingriffVerboten extends Error {
  constructor(readonly grund: string) {
    super(grund)
  }
}

/** Baut einen Block ab, wenn die Regeln es erlauben. Wirft sonst EingriffVerboten. */
export async function baueAb(bot: Bot, block: Block) {
  const grund = warumNichtAbbauen(bot, block.position, block)
  if (grund) throw new EingriffVerboten(grund)
  await bot.dig(block, true)
}

/** Setzt den gehaltenen Block auf `referenz` in Richtung `flaeche`, wenn die Regeln es erlauben. */
export async function platziere(bot: Bot, referenz: Block, flaeche: Vec3) {
  const ziel = referenz.position.plus(flaeche)
  const grund = warumNichtPlatzieren(bot, ziel)
  if (grund) throw new EingriffVerboten(grund)
  await bot.placeBlock(referenz, flaeche)
}

const VERBOTEN = 1_000_000

/**
 * Bewegungseinstellungen für die Wegfindung. Standard: unterwegs nichts abbauen, nichts platzieren.
 * `abbauenErlaubt`: was die Wegfindung unterwegs wegschlagen darf (z. B. natürliche Blätter beim Baumfällen);
 * die Regeln gelten trotzdem.
 */
export function bewegungen(bot: Bot, optionen: { abbauenErlaubt?: (block: Block) => boolean } = {}) {
  const b = new Movements(bot)
  b.allow1by1towers = false
  b.scafoldingBlocks = [] // keine Gerüstblöcke setzen: Bernard verändert die Welt nur, wenn er soll
  b.canDig = !!optionen.abbauenErlaubt
  b.exclusionAreasBreak = [(block: Block) =>
    optionen.abbauenErlaubt?.(block) && !warumNichtAbbauen(bot, block.position, block) ? 0 : VERBOTEN]
  b.exclusionAreasPlace = [(block: Block) => (warumNichtPlatzieren(bot, block.position) ? VERBOTEN : 0)]
  return b
}

