// Die Stufen auf dem Weg zum Enderdrachen und was Bernard für jede besitzen muss (Soll-Inventar).
import { DINGE, type Ding, type DingName } from './dinge'

/** Was Bernard besitzt: Minecraft-Gegenstand → Anzahl. */
export type Inventar = Readonly<Record<string, number>>

export type Soll = { ding: DingName; menge: number }

export type Stufe = {
  nummer: number
  name: string
  /** In dieser Reihenfolge besorgt Bernard die Dinge. Leer: Stufe noch nicht umgesetzt. */
  soll: Soll[]
}

export const STUFEN: Stufe[] = [
  {
    nummer: 1,
    name: 'Steinzeit',
    soll: [
      { ding: 'steinspitzhacke', menge: 1 },
      { ding: 'werkbank', menge: 1 },
      { ding: 'steinaxt', menge: 1 },
      { ding: 'steinschwert', menge: 1 },
      { ding: 'ofen', menge: 1 },
      { ding: 'stein', menge: 16 },
      { ding: 'holz', menge: 16 },
    ],
  },
  { nummer: 2, name: 'Eisenzeit', soll: [] },
  { nummer: 3, name: 'Diamantzeit', soll: [] },
  { nummer: 4, name: 'Nether', soll: [] },
  { nummer: 5, name: 'End', soll: [] },
]

/** Werkzeugmaterialien von schlecht nach gut. Gold baut nur so viel ab wie Holz. */
const WERKZEUGRANG: Record<string, number> = { wooden: 0, golden: 0, stone: 1, iron: 2, diamond: 3, netherite: 4 }

/** Ob ein Gegenstand für ein Ding zählt: das Ding selbst oder ein Werkzeug derselben Art aus besserem Material. */
function zaehltFuer(ding: DingName, gegenstand: string): boolean {
  if (DINGE[ding].passt(gegenstand)) return true
  const soll = (DINGE[ding] as Ding).herstellen?.[0]?.match(/^([a-z]+)_(pickaxe|axe|sword|shovel|hoe)$/)
  const hat = gegenstand.match(/^([a-z]+)_(pickaxe|axe|sword|shovel|hoe)$/)
  if (!soll || !hat || soll[2] !== hat[2]) return false
  return (WERKZEUGRANG[hat[1]] ?? -1) > WERKZEUGRANG[soll[1]]
}

/** Wie viele Stück von einem Ding Bernard hat (bessere Werkzeuge zählen mit). */
export function anzahl(inventar: Inventar, ding: DingName): number {
  let summe = 0
  for (const [gegenstand, n] of Object.entries(inventar)) if (zaehltFuer(ding, gegenstand)) summe += n
  return summe
}

/** Was von einer Stufe noch fehlt, in der Reihenfolge der Stufe. */
export function fehlendes(stufe: Stufe, inventar: Inventar): Soll[] {
  return stufe.soll
    .map(s => ({ ding: s.ding, menge: s.menge - anzahl(inventar, s.ding) }))
    .filter(s => s.menge > 0)
}

/** Die höchste Stufe, deren Soll-Inventar (und das aller Stufen davor) Bernard erfüllt. 0: noch keine. */
export function aktuelleStufe(inventar: Inventar): number {
  let erreicht = 0
  for (const stufe of STUFEN) {
    if (stufe.soll.length === 0 || fehlendes(stufe, inventar).length > 0) break
    erreicht = stufe.nummer
  }
  return erreicht
}

/** „zur Steinzeit“, „zum Nether“ */
export function bisZu(nummer: number): string {
  const stufe = STUFEN[nummer - 1]
  return `${stufe.name.endsWith('zeit') ? 'zur' : 'zum'} ${stufe.name}`
}
