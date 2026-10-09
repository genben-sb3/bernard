// Bernard craftet: plant mit dem Craft-Planer, stellt bei Bedarf eine Werkbank auf und nimmt sie wieder mit.
import type { Bot } from 'mineflayer'
import type { Block } from 'prismarine-block'
import pathfinderPkg from 'mineflayer-pathfinder'
import { Vec3 } from 'vec3'
import { halteAn, type Abbruch } from './auftrag'
import { erstellePlanner, type Bestand } from './craftplan'
import { baueAb, platziere, warumNichtPlatzieren } from './eingriffe'
import { DINGE, nameFuer, type DingName } from './dinge'
import { warteAufInventarRuhe } from './ruhe'

const { goals } = pathfinderPkg

export type Craftergebnis =
  | { art: 'fertig'; anzahl: number }
  /** fehlt: Gegenstands-ID → Anzahl an Grundmaterial */
  | { art: 'fehlt'; text: string; fehlt: Bestand }
  | { art: 'keinPlatz' }
  | { art: 'abgebrochen' }

const WERKBANK_REICHWEITE = 4

export async function crafte(bot: Bot, ding: DingName, menge: number, abbruch: Abbruch,
  melde: (text: string) => void = () => {}, protokoll: (text: string) => void = () => {}): Promise<Craftergebnis> {
  const d = DINGE[ding]
  const ziele = ('herstellen' in d ? d.herstellen : []).map(n => bot.registry.itemsByName[n]?.id).filter((i): i is number => i !== undefined)
  const zaehle = () => bot.inventory.items().filter(i => d.passt(i.name)).reduce((s, i) => s + i.count, 0)
  const vorher = zaehle()

  let werkbank = werkbankInDerNaehe(bot)
  const bekannt = (id: number) => Object.values(DINGE).some(x => x.passt(bot.registry.items[id].name))
  const plan = erstellePlanner(bot.registry, bekannt).plane(ziele, menge, bestand(bot), !!werkbank)
  if (plan.art === 'fehlt') return { art: 'fehlt', text: beschreibeFehlendes(bot, plan.fehlt), fehlt: plan.fehlt }
  if (plan.brauchtWerkbank && !werkbank) melde('Moment, ich stelle kurz eine Werkbank auf.')
  protokoll(`Craften: Plan ${plan.schritte.map(s => `${s.mal}× ${bot.registry.items[s.rezept.result.id].name}`).join(', ')}`)

  let aufgestellt: Block | null = null
  try {
    for (const schritt of plan.schritte) {
      if (abbruch.abgebrochen) return { art: 'abgebrochen' }
      if (schritt.rezept.requiresTable && !werkbank) {
        aufgestellt = await stelleWerkbankAuf(bot)
        if (!aufgestellt) return { art: 'keinPlatz' }
        werkbank = aufgestellt
        protokoll(`Craften: Werkbank aufgestellt bei ${werkbank.position}`)
      }
      if (werkbank && schritt.rezept.requiresTable && bot.entity.position.distanceTo(werkbank.position) > WERKBANK_REICHWEITE) {
        await bot.pathfinder.goto(new goals.GoalNear(werkbank.position.x, werkbank.position.y, werkbank.position.z, 2))
      }
      const ergebnisId = schritt.rezept.result.id
      const erwartet = anzahlVon(bot, ergebnisId) + schritt.mal * schritt.rezept.result.count
      // Ignoriert der Server Klicks (veralteter Zähler, siehe sim/LIESMICH.md), fehlt das Ergebnis: dann einmal neu versuchen
      for (let versuch = 1; anzahlVon(bot, ergebnisId) < erwartet; versuch++) {
        if (versuch > 2) throw new Error(`${bot.registry.items[ergebnisId].name} kam nach zwei Versuchen nicht im Inventar an`)
        if (versuch > 1) protokoll(`Craften: ${bot.registry.items[ergebnisId].name} kam nicht an, neuer Versuch`)
        await warteAufInventarRuhe(bot)
        const mal = Math.ceil((erwartet - anzahlVon(bot, ergebnisId)) / schritt.rezept.result.count)
        await bot.craft(schritt.rezept, mal, schritt.rezept.requiresTable ? werkbank! : undefined)
        await warteBisImInventar(bot, ergebnisId, erwartet)
      }
    }
  } finally {
    if (aufgestellt) await nimmWerkbankMit(bot, aufgestellt, abbruch, protokoll)
  }
  return { art: 'fertig', anzahl: zaehle() - vorher }
}

function anzahlVon(bot: Bot, id: number) {
  return bot.inventory.items().filter(i => i.type === id).reduce((s, i) => s + i.count, 0)
}

/**
 * Nach dem Craften hinkt Bernards Sicht aufs Inventar dem Server kurz hinterher. Der nächste Schritt
 * fände sonst seine Zutaten nicht („missing ingredient“).
 */
async function warteBisImInventar(bot: Bot, id: number, anzahl: number, maxMs = 3000) {
  for (let t = 0; t < maxMs && anzahlVon(bot, id) < anzahl; t += 50) await new Promise(r => setTimeout(r, 50))
}

function bestand(bot: Bot): Bestand {
  const b: Bestand = new Map()
  for (const item of bot.inventory.items()) b.set(item.type, (b.get(item.type) ?? 0) + item.count)
  return b
}

function werkbankInDerNaehe(bot: Bot): Block | null {
  return bot.findBlock({ matching: bot.registry.blocksByName.crafting_table.id, maxDistance: WERKBANK_REICHWEITE })
}

/** Stellt die Werkbank aus dem Inventar auf einen freien Platz neben Bernard. */
async function stelleWerkbankAuf(bot: Bot): Promise<Block | null> {
  const item = bot.inventory.items().find(i => i.name === 'crafting_table')
  if (!item) return null
  const fuesse = bot.entity.position.floored()
  // Auf die Seite weg von anderen Spielern: wer neben der Werkbank steht, schnappt sich sonst beim
  // Abbauen den Drop
  const andere = Object.values(bot.players).filter(p => p.entity && p.username !== bot.username).map(p => p.entity.position)
  const abstandZuAnderen = (p: Vec3) => Math.min(Infinity, ...andere.map(a => a.distanceTo(p)))
  const plaetze = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
    .map(([dx, dz]) => fuesse.offset(dx, 0, dz))
    .sort((a, b) => abstandZuAnderen(b) - abstandZuAnderen(a))
  for (const platz of plaetze) {
    const unten = bot.blockAt(platz.offset(0, -1, 0))
    if (bot.blockAt(platz)?.name !== 'air' || !unten || unten.boundingBox !== 'block') continue
    if (warumNichtPlatzieren(bot, platz)) continue
    await bot.equip(item, 'hand')
    await platziere(bot, unten, new Vec3(0, 1, 0))
    const gesetzt = bot.blockAt(platz)
    if (gesetzt?.name === 'crafting_table') return gesetzt
  }
  return null
}

/** Baut die selbst aufgestellte Werkbank wieder ab und hebt sie auf. */
async function nimmWerkbankMit(bot: Bot, werkbank: Block, abbruch: Abbruch, protokoll: (text: string) => void) {
  try {
    const aktuell = bot.blockAt(werkbank.position)
    if (aktuell?.name !== 'crafting_table') return
    const vorher = anzahlVon(bot, bot.registry.itemsByName.crafting_table.id)
    await baueAb(bot, aktuell)
    for (let versuch = 0; versuch < 4 && anzahlVon(bot, bot.registry.itemsByName.crafting_table.id) <= vorher; versuch++) {
      await new Promise(r => setTimeout(r, 700)) // fallen und liegen lassen
      const drop = bot.nearestEntity(e => e.name === 'item' && e.position.distanceTo(werkbank.position) < 5)
      if (!drop) continue
      await bot.pathfinder.goto(new goals.GoalXZ(Math.floor(drop.position.x), Math.floor(drop.position.z))).catch(() => halteAn(bot, abbruch))
    }
    if (anzahlVon(bot, bot.registry.itemsByName.crafting_table.id) <= vorher) protokoll('Craften: Werkbank liegt noch herum')
  } catch (fehler) {
    protokoll(`Craften: Werkbank mitnehmen klappt nicht (${fehler instanceof Error ? fehler.message : fehler})`)
  }
}

function beschreibeFehlendes(bot: Bot, fehlt: Bestand) {
  // Alle Holzsorten zusammen als „Holz“
  const zusammen = new Map<string, number>()
  for (const [id, anzahl] of fehlt) {
    const item = bot.registry.items[id]
    const text = nameFuer(item.name, 1, item.displayName).replace(/^1 /, '')
    zusammen.set(text, (zusammen.get(text) ?? 0) + anzahl)
  }
  const teile = [...zusammen].map(([name, anzahl]) => `${anzahl} ${anzahl === 1 ? name : mehrzahl(name)}`)
  return teile.length === 1 ? teile[0] : `${teile.slice(0, -1).join(', ')} und ${teile.at(-1)}`
}

function mehrzahl(einzahl: string) {
  const d = Object.values(DINGE).find(x => x.einzahl === einzahl)
  return d ? d.mehrzahl : einzahl
}
