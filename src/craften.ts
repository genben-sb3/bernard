// Bernard craftet: plant mit dem Craft-Planer, stellt bei Bedarf eine Werkbank auf und nimmt sie wieder mit.
import type { Bot } from 'mineflayer'
import type { Block } from 'prismarine-block'
import pathfinderPkg from 'mineflayer-pathfinder'
import { Vec3 } from 'vec3'
import { halteAn, type Abbruch } from './auftrag'
import type { Recipe } from 'prismarine-recipe'
import { erstellePlanner, type Bestand } from './craftplan'
import { baueAb, platziere, warumNichtAbbauen, warumNichtPlatzieren } from './eingriffe'
import { DINGE, dingAufloeser, dingFuer, mitMenge, type DingSchluessel } from './dinge'
import { aufzaehlung, texte, type Sprache } from './texte'
import { warteAufInventarRuhe } from './ruhe'

const { goals } = pathfinderPkg

export type Craftergebnis =
  | { art: 'fertig'; anzahl: number }
  /** fehlt: Gegenstands-ID → Anzahl an Grundmaterial */
  | { art: 'fehlt'; text: string; fehlt: Bestand }
  | { art: 'keinPlatz' }
  | { art: 'abgebrochen' }

const WERKBANK_REICHWEITE = 4

export async function crafte(bot: Bot, ding: DingSchluessel, menge: number, abbruch: Abbruch,
  melde: (text: string) => void = () => {}, protokoll: (text: string) => void = () => {}, sprache: Sprache = 'de'): Promise<Craftergebnis> {
  const d = dingFuer(ding)
  const ziele = (d.herstellen ?? []).map(n => bot.registry.itemsByName[n]?.id).filter((i): i is number => i !== undefined)
  const zaehle = () => bot.inventory.items().filter(i => d.passt(i.name)).reduce((s, i) => s + i.count, 0)
  const vorher = zaehle()

  let werkbank = werkbankInDerNaehe(bot)
  const bekannt = (id: number) => Object.values(DINGE).some(x => x.passt(bot.registry.items[id].name))
  const plan = erstellePlanner(bot.registry, bekannt).plane(ziele, menge, bestand(bot), !!werkbank)
  if (plan.art === 'fehlt') return { art: 'fehlt', text: beschreibeFehlendes(bot, plan.fehlt, sprache), fehlt: plan.fehlt }
  if (plan.brauchtWerkbank && !werkbank) melde(texte(sprache).werkbankAufstellen)
  protokoll(`Craften: Plan ${plan.schritte.map(s => `${s.mal}× ${bot.registry.items[s.rezept.result.id].name}`).join(', ')}`)

  let aufgestellt: Block | null = null
  try {
    for (const schritt of plan.schritte) {
      if (abbruch.abgebrochen) return { art: 'abgebrochen' }
      if (schritt.rezept.requiresTable && !werkbank) {
        aufgestellt = await stelleAuf(bot, 'crafting_table', protokoll)
        if (!aufgestellt) return { art: 'keinPlatz' }
        werkbank = aufgestellt
        protokoll(`Craften: Werkbank aufgestellt bei ${werkbank.position}`)
      }
      if (werkbank && schritt.rezept.requiresTable && bot.entity.position.distanceTo(werkbank.position) > WERKBANK_REICHWEITE) {
        await bot.pathfinder.goto(new goals.GoalNear(werkbank.position.x, werkbank.position.y, werkbank.position.z, 2))
      }
      // Einzeln craften und jedes Mal warten: bot.craft(rezept, 2) wiederholt intern sofort und findet dann
      // im noch nicht aktualisierten Inventar die Zutaten nicht („missing ingredient“)
      for (let i = 0; i < schritt.mal; i++) {
        if (abbruch.abgebrochen) return { art: 'abgebrochen' }
        await crafteEinmal(bot, schritt.rezept, schritt.rezept.requiresTable ? werkbank! : undefined, protokoll)
      }
    }
  } finally {
    if (aufgestellt) await nimmMit(bot, aufgestellt, abbruch, protokoll)
  }
  return { art: 'fertig', anzahl: zaehle() - vorher }
}

/**
 * Ein Rezept einmal craften. Fehlen die Zutaten in Bernards Sicht noch („missing ingredient“) oder ignoriert
 * der Server den Klick (veralteter Zähler, siehe sim/LIESMICH.md) und das Ergebnis kommt nicht an,
 * nach einer Pause ein zweites Mal.
 */
async function crafteEinmal(bot: Bot, rezept: Recipe, werkbank: Block | undefined, protokoll: (text: string) => void) {
  const ergebnisId = rezept.result.id
  const name = bot.registry.items[ergebnisId].name
  const erwartet = anzahlVon(bot, ergebnisId) + rezept.result.count
  for (let versuch = 1; ; versuch++) {
    await warteAufInventarRuhe(bot)
    try {
      await bot.craft(rezept, 1, werkbank)
    } catch (fehler) {
      if (versuch >= 2 || !/missing ingredient/.test(String(fehler))) throw fehler
      protokoll(`Craften: ${name} – Zutaten noch nicht da, neuer Versuch`)
      await new Promise(r => setTimeout(r, 1000))
      continue
    }
    await warteBisImInventar(bot, ergebnisId, erwartet)
    if (anzahlVon(bot, ergebnisId) >= erwartet) return
    if (versuch >= 2) throw new Error(`${name} kam nach zwei Versuchen nicht im Inventar an`)
    protokoll(`Craften: ${name} kam nicht an, neuer Versuch`)
  }
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

/** Abbauzeit, bis zu der Bernard sich einen Platz freigräbt (Erde, Stein, Tiefenschiefer, nicht Obsidian) */
const FREIGRABEN_MAX_MS = 5000
const FLUESSIG = new Set(['water', 'lava'])

/**
 * Stellt einen Block aus dem Inventar (Werkbank, Ofen) auf einen Platz neben Bernard: zuerst auf Fußhöhe,
 * sonst eine Ebene höher (Stufe am Rand eines Lochs), sonst gräbt er sich einen Platz auf Fußhöhe frei.
 */
export async function stelleAuf(bot: Bot, name: string, protokoll: (text: string) => void = () => {}): Promise<Block | null> {
  const item = bot.inventory.items().find(i => i.name === name)
  if (!item) return null
  const fuesse = bot.entity.position.floored()
  // Auf die Seite weg von anderen Spielern: wer neben der Werkbank steht, schnappt sich sonst beim
  // Abbauen den Drop
  const andere = Object.values(bot.players).filter(p => p.entity && p.username !== bot.username).map(p => p.entity.position)
  const abstandZuAnderen = (p: Vec3) => Math.min(Infinity, ...andere.map(a => a.distanceTo(p)))
  const nachbarn = (dy: number, nurGerade = false) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
    .slice(0, nurGerade ? 4 : 8)
    .map(([dx, dz]) => fuesse.offset(dx, dy, dz))
    .sort((a, b) => abstandZuAnderen(b) - abstandZuAnderen(a))
  const frei = (platz: Vec3) => {
    const unten = bot.blockAt(platz.offset(0, -1, 0))
    return bot.blockAt(platz)?.name === 'air' && unten?.boundingBox === 'block' && !warumNichtPlatzieren(bot, platz)
  }
  const setze = async (platz: Vec3) => {
    await bot.equip(item, 'hand')
    await platziere(bot, bot.blockAt(platz.offset(0, -1, 0))!, new Vec3(0, 1, 0))
    const gesetzt = bot.blockAt(platz)
    return gesetzt?.name === name ? gesetzt : null
  }

  for (const platz of [...nachbarn(0), ...nachbarn(1)]) {
    if (!frei(platz)) continue
    const gesetzt = await setze(platz)
    if (gesetzt) return gesetzt
  }

  // Kein Platz (z. B. in einem selbst gegrabenen Loch): eine Nische auf Fußhöhe freigraben, zwei Blöcke hoch,
  // damit Bernard den Block danach wieder erreicht und aufheben kann
  const grabbar = (platz: Vec3) => {
    const block = bot.blockAt(platz)
    if (!block || block.name === 'air') return 'frei'
    if (block.boundingBox !== 'block' || !bot.canDigBlock(block) || bot.digTime(block) > FREIGRABEN_MAX_MS) return null
    if (warumNichtAbbauen(bot, platz, block)) return null
    const umgebung = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]].map(([dx, dy, dz]) => bot.blockAt(platz.offset(dx, dy, dz))?.name ?? '')
    return umgebung.some(n => FLUESSIG.has(n)) ? null : block
  }
  for (const platz of nachbarn(0, true)) {
    if (bot.blockAt(platz.offset(0, -1, 0))?.boundingBox !== 'block') continue
    const fuss = grabbar(platz)
    const kopf = grabbar(platz.offset(0, 1, 0))
    if (!fuss || !kopf) continue
    protokoll(`Aufstellen: kein Platz für ${name}, grabe eine Nische bei ${platz}`)
    for (const block of [kopf, fuss]) if (typeof block !== 'string') await baueAb(bot, block)
    if (!frei(platz)) continue
    const gesetzt = await setze(platz)
    if (gesetzt) return gesetzt
  }
  return null
}

/** Baut einen selbst aufgestellten Block (Werkbank, Ofen) wieder ab und hebt ihn auf. */
export async function nimmMit(bot: Bot, werkbank: Block, abbruch: Abbruch, protokoll: (text: string) => void) {
  const name = werkbank.name
  const id = bot.registry.itemsByName[name].id
  try {
    const aktuell = bot.blockAt(werkbank.position)
    if (aktuell?.name !== name) return
    // Ohne passendes Werkzeug fiele ein Ofen nicht als Gegenstand heraus
    const werkzeuge = aktuell.harvestTools
    const werkzeug = werkzeuge ? bot.inventory.items().find(i => werkzeuge[i.type]) : null
    if (werkzeuge && !werkzeug) {
      protokoll(`Craften: ${name} bleibt stehen, mir fehlt das Werkzeug zum Abbauen`)
      return
    }
    if (werkzeug) await bot.equip(werkzeug, 'hand')
    const vorher = anzahlVon(bot, id)
    await baueAb(bot, aktuell)
    for (let versuch = 0; versuch < 4 && anzahlVon(bot, id) <= vorher; versuch++) {
      await new Promise(r => setTimeout(r, 700)) // fallen und liegen lassen
      const drop = bot.nearestEntity(e => e.name === 'item' && e.position.distanceTo(werkbank.position) < 5)
      if (!drop) continue
      await bot.pathfinder.goto(new goals.GoalXZ(Math.floor(drop.position.x), Math.floor(drop.position.z))).catch(() => halteAn(bot, abbruch))
    }
    if (anzahlVon(bot, id) <= vorher) protokoll(`Craften: ${name} liegt noch herum`)
  } catch (fehler) {
    protokoll(`Craften: ${name} mitnehmen klappt nicht (${fehler instanceof Error ? fehler.message : fehler})`)
  }
}

/** „3 Holz und 2 Bruchstein“ / „3 Wood and 2 Cobblestone“. Alle Holzsorten zählen zusammen als Holz. */
export function beschreibeFehlendes(bot: Bot, fehlt: Bestand, sprache: Sprache = 'de') {
  const aufloesen = dingAufloeser(bot)
  const zusammen = new Map<DingSchluessel, number>()
  for (const [id, anzahl] of fehlt) {
    const name = bot.registry.items[id].name
    const ding = DINGE.holz.passt(name) ? 'holz' : aufloesen(name)
    if (!ding) continue
    zusammen.set(ding, (zusammen.get(ding) ?? 0) + anzahl)
  }
  return aufzaehlung([...zusammen].map(([ding, anzahl]) => mitMenge(ding, anzahl, sprache)), sprache)
}
