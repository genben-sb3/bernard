// Plant das Schmelzen im Ofen: welche Zutaten, wie viel Brennstoff, wie lange. Rein rechnerisch, ohne Bot.
// minecraft-data kennt keine Ofenrezepte, deshalb eine eigene kleine Tabelle.

const istStammOderHolz = (n: string) => /_(log|wood|stem|hyphae)$/.test(n)

/** Ergebnis → Zutaten (in dieser Reihenfolge bevorzugt). */
const REZEPTE: Record<string, (name: string) => number | false> = {
  iron_ingot: rang('raw_iron', 'iron_ore', 'deepslate_iron_ore'),
  gold_ingot: rang('raw_gold', 'gold_ore', 'deepslate_gold_ore', 'nether_gold_ore'),
  copper_ingot: rang('raw_copper', 'copper_ore', 'deepslate_copper_ore'),
  charcoal: n => istStammOderHolz(n) ? 0 : false,
  glass: rang('sand', 'red_sand'),
  stone: rang('cobblestone'),
  smooth_stone: rang('stone'),
}

/** Wie viele Schmelzvorgänge ein Stück Brennstoff hält, in der Reihenfolge, in der Bernard verheizt. */
const BRENNSTOFFE: Array<[(name: string) => boolean, number]> = [
  [n => n === 'coal', 8],
  [n => n === 'charcoal', 8],
  [n => n.endsWith('_planks'), 1.5],
  [istStammOderHolz, 1.5],
  [n => n === 'stick', 0.5],
]

/** Sekunden pro Schmelzvorgang. */
export const SEKUNDEN_PRO_STUECK = 10

export type Posten = { name: string; anzahl: number }

export type Schmelzplan =
  | { art: 'plan'; eingabe: Posten[]; brennstoff: Posten[]; sekunden: number }
  /** eingabe: fehlende Zutaten (Stück) · brennstoff: Schmelzvorgänge, für die Brennstoff fehlt */
  | { art: 'fehlt'; eingabe: number; brennstoff: number }

export function istSchmelzbar(ergebnis: string) {
  return ergebnis in REZEPTE
}

/** Ob `name` eine Zutat für `ergebnis` ist. */
export function istZutat(ergebnis: string, name: string) {
  return REZEPTE[ergebnis]?.(name) !== false
}

/** Plant `menge` Stück `ergebnis` aus dem Inventar (Gegenstandsname → Anzahl). */
export function planeSchmelzen(ergebnis: string, menge: number, inventar: Record<string, number>): Schmelzplan {
  const rezept = REZEPTE[ergebnis]
  if (!rezept) throw new Error(`Kein Ofenrezept für ${ergebnis}`)
  const rest = { ...inventar }

  const eingabe: Posten[] = []
  let offen = menge
  const zutaten = Object.keys(rest).filter(n => rezept(n) !== false && rest[n] > 0)
    .sort((a, b) => (rezept(a) as number) - (rezept(b) as number))
  for (const name of zutaten) {
    if (offen === 0) break
    const anzahl = Math.min(offen, rest[name])
    eingabe.push({ name, anzahl })
    rest[name] -= anzahl
    offen -= anzahl
  }

  const brennstoff: Posten[] = []
  let vorgaenge = menge
  for (const [passt, wert] of BRENNSTOFFE) {
    for (const name of Object.keys(rest).filter(n => passt(n) && rest[n] > 0)) {
      if (vorgaenge <= 0) break
      const anzahl = Math.min(rest[name], Math.ceil(vorgaenge / wert))
      brennstoff.push({ name, anzahl })
      rest[name] -= anzahl
      vorgaenge -= anzahl * wert
    }
  }

  if (offen > 0 || vorgaenge > 0) return { art: 'fehlt', eingabe: offen, brennstoff: Math.max(0, Math.ceil(vorgaenge)) }
  return { art: 'plan', eingabe, brennstoff, sekunden: menge * SEKUNDEN_PRO_STUECK }
}

function rang(...namen: string[]) {
  return (name: string) => namen.includes(name) ? namen.indexOf(name) : false
}
