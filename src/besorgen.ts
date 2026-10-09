// Besorgt fehlendes Grundmaterial fürs Craften selbst: sammeln, nötige Werkzeuge craften, dann craften oder schmelzen.
import type { Bot } from 'mineflayer'
import type { Material } from './befehle'
import { crafte } from './craften'
import { DINGE, dingFuer, kein, mehrzahl, mitMenge, type DingName, type DingSchluessel } from './dinge'
import { aufzaehlung, texte, type Sprache } from './texte'
import type { Abbruch } from './auftrag'
import { MATERIALIEN, sammle } from './sammeln'
import { schmelze } from './schmelzen'

export type Sammelauftrag = { material: Material; menge: number }

function istSammelbar(ding: DingSchluessel): ding is Material {
  return ding in MATERIALIEN
}

/** Welches sammelbare Material einen fehlenden Gegenstand liefert (oder null). */
function materialFuer(gegenstand: string): Material | null {
  if (/_(log|stem)$/.test(gegenstand) && !gegenstand.startsWith('stripped_')) return 'holz' // jede Sorte, die in der Nähe wächst
  if (gegenstand === 'cobblestone') return 'stein'
  if (gegenstand === 'dirt') return 'erde'
  if (gegenstand === 'sand') return 'sand'
  return null
}

/** Teilt Fehlendes (Gegenstandsname, Anzahl) in Sammelaufträge und Unsammelbares. */
export function sammelauftraege(fehlt: Array<[string, number]>) {
  const auftraege: Sammelauftrag[] = []
  const unsammelbar: Array<[string, number]> = []
  for (const [gegenstand, menge] of fehlt) {
    const material = materialFuer(gegenstand)
    if (!material) {
      unsammelbar.push([gegenstand, menge])
      continue
    }
    const bisher = auftraege.find(a => a.material === material)
    if (bisher) bisher.menge += menge
    else auftraege.push({ material, menge })
  }
  return { auftraege, unsammelbar }
}

export type Besorgergebnis =
  | { art: 'fertig'; anzahl: number; unterwegs: boolean }
  /** Nicht sammelbar oder gar nicht herstellbar */
  | { art: 'fehlt'; text: string }
  /** Sammelbar, aber in der Nähe nicht (mehr) zu finden */
  | { art: 'nichtGefunden'; material: Material; /** was fürs Craften noch fehlt, schon als Text */ fehlt?: string }
  | { art: 'keinPlatz' }
  | { art: 'abgebrochen' }

export type Besorgkontext = {
  abbruch: Abbruch
  /** Ansagen im Chat („Dafür hole ich erst 3 Holz.“) */
  melde: (text: string) => void
  protokoll?: (text: string) => void
  /** Sprache für Ansagen und Ergebnistexte (Standard: Deutsch) */
  sprache?: Sprache
}

const MAX_RUNDEN = 6
const MAX_TIEFE = 4

/**
 * Sorgt dafür, dass Bernard danach mindestens `gesamt` Stück von `ding` im Inventar hat.
 * Sammelbares sammelt er (und besorgt vorher ein nötiges Werkzeug), alles andere craftet er und
 * besorgt fehlende Zutaten dafür rekursiv auf dieselbe Weise.
 * Wiederverwendbar für Befehle und später für selbstständiges Spielen.
 */
export async function besorge(bot: Bot, ding: DingSchluessel, gesamt: number, k: Besorgkontext, tiefe = 0): Promise<Besorgergebnis> {
  const zaehle = () => bot.inventory.items().filter(i => dingFuer(ding).passt(i.name)).reduce((s, i) => s + i.count, 0)
  const start = zaehle()
  if (start >= gesamt) return { art: 'fertig', anzahl: 0, unterwegs: false }
  if (tiefe > MAX_TIEFE) return { art: 'fehlt', text: mitMenge(ding, gesamt - start, k.sprache) }
  if (istSammelbar(ding)) return sammleMitWerkzeug(bot, ding, gesamt - start, k, tiefe)
  const ergebnis = dingFuer(ding).schmelzen
  return ergebnis
    ? schmelzeMitZutaten(bot, ergebnis, gesamt, k, tiefe, zaehle, start)
    : crafteMitZutaten(bot, ding, gesamt, k, tiefe, zaehle, start)
}

/** Was Bernard für ein Ofenergebnis selbst sammeln kann (Erze kann er noch nicht abbauen). */
const OFEN_ZUTAT: Record<string, Material> = { glass: 'sand', stone: 'stein', charcoal: 'holz' }
/** Wie Bernard eine fehlende Zutat nennt, die er nicht selbst sammeln kann. */
const OFEN_ZUTAT_NAME: Record<string, Record<Sprache, [string, string]>> = {
  iron_ingot: { de: ['Roheisen', 'Roheisen'], en: ['Raw Iron', 'Raw Iron'] },
  gold_ingot: { de: ['Rohgold', 'Rohgold'], en: ['Raw Gold', 'Raw Gold'] },
  copper_ingot: { de: ['Rohkupfer', 'Rohkupfer'], en: ['Raw Copper', 'Raw Copper'] },
  smooth_stone: { de: ['Stein', 'Steine'], en: ['Stone', 'Stone'] },
}
/** Schmelzvorgänge pro Stamm als Brennstoff */
const STAMM_BRENNT = 1.5

/** Welches Ding im Ofen entsteht und einen fehlenden Gegenstand liefert (Kohle ersetzt Holzkohle). */
function schmelzDingFuer(gegenstand: string): DingName | null {
  const name = gegenstand === 'coal' ? 'charcoal' : gegenstand
  return (Object.keys(DINGE) as DingName[]).find(d => dingFuer(d).schmelzen === name) ?? null
}

async function schmelzeMitZutaten(bot: Bot, ergebnis: string, gesamt: number, k: Besorgkontext, tiefe: number,
  zaehle: () => number, start: number): Promise<Besorgergebnis> {
  let unterwegs = false
  for (let runde = 0; runde < MAX_RUNDEN; runde++) {
    if (k.abbruch.abgebrochen) return { art: 'abgebrochen' }
    const versuch = await schmelze(bot, ergebnis, gesamt - zaehle(), k.abbruch, k.melde, k.protokoll)
    if (versuch.art === 'fertig') return { art: 'fertig', anzahl: zaehle() - start, unterwegs }
    if (versuch.art !== 'fehlt') return versuch
    k.protokoll?.(`Besorgen: ${ergebnis}, Runde ${runde + 1}, fehlt ${versuch.eingabe} Zutaten, Brennstoff für ${versuch.brennstoff}${versuch.ofen ? ', ein Ofen' : ''}`)

    const auftraege: Auftrag[] = []
    let holz = Math.ceil(versuch.brennstoff / STAMM_BRENNT)
    if (versuch.eingabe > 0) {
      const zutat = OFEN_ZUTAT[ergebnis]
      if (!zutat) {
        const sprache = k.sprache ?? 'de'
        const [eins, viele] = OFEN_ZUTAT_NAME[ergebnis]?.[sprache] ?? (sprache === 'en' ? ['ingredient', 'ingredients'] : ['Zutat', 'Zutaten'])
        return { art: 'fehlt', text: `${versuch.eingabe} ${versuch.eingabe === 1 ? eins : viele}` }
      }
      if (zutat === 'holz') holz += versuch.eingabe
      else auftraege.push({ ding: zutat, menge: versuch.eingabe })
    }
    if (holz > 0) auftraege.push({ ding: 'holz', menge: holz })
    if (versuch.ofen) auftraege.push({ ding: 'ofen', menge: 1 })
    const geholt = await holeAlles(bot, auftraege, k, tiefe)
    if (geholt.art !== 'fertig') return geholt
    unterwegs = unterwegs || geholt.unterwegs
  }
  k.protokoll?.(`Besorgen: ${ergebnis} nach ${MAX_RUNDEN} Runden aufgegeben`)
  return { art: 'fehlt', text: mitMenge(schmelzDingFuer(ergebnis) ?? 'kohle', gesamt - zaehle(), k.sprache) }
}

type Auftrag = { ding: DingSchluessel; menge: number }

/** Sagt an, was Bernard erst holt, und besorgt es nacheinander (`menge` zusätzlich zum Bestand). */
async function holeAlles(bot: Bot, auftraege: Auftrag[], k: Besorgkontext, tiefe: number, fehltNoch?: string): Promise<Besorgergebnis> {
  let unterwegs = false
  k.melde(texte(k.sprache ?? 'de').holeErst(aufzaehlung(auftraege.map(a => mitMenge(a.ding, a.menge, k.sprache)), k.sprache ?? 'de')))
  for (const auftrag of auftraege) {
    const bestand = bot.inventory.items().filter(i => dingFuer(auftrag.ding).passt(i.name)).reduce((s, i) => s + i.count, 0)
    const teil = await besorge(bot, auftrag.ding, bestand + auftrag.menge, k, tiefe + 1)
    if (teil.art === 'nichtGefunden') return { ...teil, fehlt: teil.fehlt ?? fehltNoch }
    if (teil.art !== 'fertig') return teil
    unterwegs = unterwegs || teil.unterwegs
  }
  return { art: 'fertig', anzahl: 0, unterwegs }
}

async function sammleMitWerkzeug(bot: Bot, material: Material, menge: number, k: Besorgkontext, tiefe: number): Promise<Besorgergebnis> {
  let ergebnis = await sammle(bot, material, menge, k.abbruch, k.protokoll)
  if (ergebnis.art === 'werkzeugFehlt') {
    k.melde(texte(k.sprache ?? 'de').erstHolzspitzhacke(mehrzahl(material, k.sprache)))
    const werkzeug = await besorge(bot, 'holzspitzhacke', 1, k, tiefe + 1)
    if (werkzeug.art !== 'fertig') return werkzeug
    ergebnis = await sammle(bot, material, menge, k.abbruch, k.protokoll)
  }
  if (ergebnis.art === 'abgebrochen' || k.abbruch.abgebrochen) return { art: 'abgebrochen' }
  if (ergebnis.art === 'werkzeugFehlt') {
    return { art: 'fehlt', text: texte(k.sprache ?? 'de').werkzeugFuer(ergebnis.werkzeug, mehrzahl(material, k.sprache)) }
  }
  if (ergebnis.art === 'nichtsGefunden') return { art: 'nichtGefunden', material }
  return { art: 'fertig', anzahl: ergebnis.anzahl, unterwegs: true }
}

async function crafteMitZutaten(bot: Bot, ding: DingSchluessel, gesamt: number, k: Besorgkontext, tiefe: number,
  zaehle: () => number, start: number): Promise<Besorgergebnis> {
  let unterwegs = false
  let letzterText = ''
  for (let runde = 0; runde < MAX_RUNDEN; runde++) {
    if (k.abbruch.abgebrochen) return { art: 'abgebrochen' }
    const versuch = await crafte(bot, ding, gesamt - zaehle(), k.abbruch, k.melde, k.protokoll, k.sprache)
    if (versuch.art === 'fertig') return { art: 'fertig', anzahl: zaehle() - start, unterwegs }
    if (versuch.art !== 'fehlt') return versuch
    letzterText = versuch.text

    const fehlt = [...versuch.fehlt].map(([id, n]) => [bot.registry.items[id].name, n] as [string, number])
    const { auftraege, unsammelbar } = sammelauftraege(fehlt)
    k.protokoll?.(`Besorgen: ${ding}, Runde ${runde + 1}, fehlt ${fehlt.map(([n, a]) => `${a} ${n}`).join(', ')}`)
    // Was im Ofen entsteht (Holzkohle für Fackeln), schmilzt Bernard selbst
    const schmelzbar = unsammelbar.map(([name, menge]) => ({ ding: schmelzDingFuer(name), menge }))
    if (schmelzbar.some(a => !a.ding)) return { art: 'fehlt', text: versuch.text }

    const geholt = await holeAlles(bot, [
      ...auftraege.map(a => ({ ding: a.material, menge: a.menge })),
      ...schmelzbar.map(a => ({ ding: a.ding!, menge: a.menge })),
    ], k, tiefe, versuch.text)
    if (geholt.art !== 'fertig') return geholt
    unterwegs = unterwegs || geholt.unterwegs
  }
  k.protokoll?.(`Besorgen: ${ding} nach ${MAX_RUNDEN} Runden aufgegeben`)
  return { art: 'fehlt', text: letzterText }
}

/** Text für „nicht gefunden“: „Ich finde hier keinen Bruchstein. Mir fehlen noch 8 Bruchstein.“ */
export function nichtGefundenText(ergebnis: { material: Material; fehlt?: string }, sprache: Sprache = 'de') {
  const t = texte(sprache)
  const nichts = kein(ergebnis.material, sprache)
  return ergebnis.fehlt ? t.findeNicht(nichts, ergebnis.fehlt) : t.findeNichtKurz(nichts)
}
