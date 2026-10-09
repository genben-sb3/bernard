// Besorgt fehlendes Grundmaterial fürs Craften selbst: sammeln, nötige Werkzeuge craften, dann craften.
import type { Bot } from 'mineflayer'
import type { Material } from './befehle'
import { crafte } from './craften'
import { DINGE, dingFuer, mitMenge, type DingSchluessel } from './dinge'
import type { Abbruch } from './auftrag'
import { MATERIALIEN, sammle } from './sammeln'

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
  | { art: 'nichtGefunden'; text: string; material: Material }
  | { art: 'keinPlatz' }
  | { art: 'abgebrochen' }

export type Besorgkontext = {
  abbruch: Abbruch
  /** Ansagen im Chat („Dafür hole ich erst 3 Holz.“) */
  melde: (text: string) => void
  protokoll?: (text: string) => void
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
  if (tiefe > MAX_TIEFE) return { art: 'fehlt', text: mitMenge(ding, gesamt - start) }
  return istSammelbar(ding)
    ? sammleMitWerkzeug(bot, ding, gesamt - start, k, tiefe)
    : crafteMitZutaten(bot, ding, gesamt, k, tiefe, zaehle, start)
}

async function sammleMitWerkzeug(bot: Bot, material: Material, menge: number, k: Besorgkontext, tiefe: number): Promise<Besorgergebnis> {
  let ergebnis = await sammle(bot, material, menge, k.abbruch, k.protokoll)
  if (ergebnis.art === 'werkzeugFehlt') {
    k.melde(`Für ${DINGE[material].mehrzahl} brauche ich erst eine Holzspitzhacke.`)
    const werkzeug = await besorge(bot, 'holzspitzhacke', 1, k, tiefe + 1)
    if (werkzeug.art !== 'fertig') return werkzeug
    ergebnis = await sammle(bot, material, menge, k.abbruch, k.protokoll)
  }
  if (ergebnis.art === 'abgebrochen' || k.abbruch.abgebrochen) return { art: 'abgebrochen' }
  if (ergebnis.art === 'werkzeugFehlt') return { art: 'fehlt', text: `${ergebnis.werkzeug} für ${DINGE[material].mehrzahl}` }
  if (ergebnis.art === 'nichtsGefunden') return { art: 'nichtGefunden', text: `Ich finde hier ${DINGE[material].kein}.`, material }
  return { art: 'fertig', anzahl: ergebnis.anzahl, unterwegs: true }
}

async function crafteMitZutaten(bot: Bot, ding: DingSchluessel, gesamt: number, k: Besorgkontext, tiefe: number,
  zaehle: () => number, start: number): Promise<Besorgergebnis> {
  let unterwegs = false
  let letzterText = ''
  for (let runde = 0; runde < MAX_RUNDEN; runde++) {
    if (k.abbruch.abgebrochen) return { art: 'abgebrochen' }
    const versuch = await crafte(bot, ding, gesamt - zaehle(), k.abbruch, k.melde, k.protokoll)
    if (versuch.art === 'fertig') return { art: 'fertig', anzahl: zaehle() - start, unterwegs }
    if (versuch.art !== 'fehlt') return versuch
    letzterText = versuch.text

    const fehlt = [...versuch.fehlt].map(([id, n]) => [bot.registry.items[id].name, n] as [string, number])
    const { auftraege, unsammelbar } = sammelauftraege(fehlt)
    k.protokoll?.(`Besorgen: ${ding}, Runde ${runde + 1}, fehlt ${fehlt.map(([n, a]) => `${a} ${n}`).join(', ')}`)
    if (unsammelbar.length > 0) return { art: 'fehlt', text: versuch.text }

    k.melde(`Dafür hole ich erst ${aufzaehlung(auftraege.map(a => mitMenge(a.material, a.menge)))}.`)
    for (const auftrag of auftraege) {
      const bestand = bot.inventory.items().filter(i => DINGE[auftrag.material].passt(i.name)).reduce((s, i) => s + i.count, 0)
      const teil = await besorge(bot, auftrag.material, bestand + auftrag.menge, k, tiefe + 1)
      if (teil.art === 'nichtGefunden') return { ...teil, text: `${teil.text} Mir fehlen noch ${versuch.text}.` }
      if (teil.art !== 'fertig') return teil
      unterwegs = unterwegs || teil.unterwegs
    }
  }
  k.protokoll?.(`Besorgen: ${ding} nach ${MAX_RUNDEN} Runden aufgegeben`)
  return { art: 'fehlt', text: letzterText }
}

function aufzaehlung(teile: string[]) {
  return teile.length === 1 ? teile[0] : `${teile.slice(0, -1).join(', ')} und ${teile.at(-1)}`
}
