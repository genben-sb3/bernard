// Plant, was Bernard in welcher Reihenfolge craften muss, um etwas herzustellen,
// inklusive Zwischenprodukten (Bretter → Stöcke → Spitzhacke). Rein rechnerisch, ohne Bot.
import type { Registry } from 'prismarine-registry'
import recipeLoader, { type Recipe } from 'prismarine-recipe'

export type Schritt = { rezept: Recipe; mal: number }

/** Gegenstands-ID → Anzahl */
export type Bestand = Map<number, number>

export type Plan =
  | { art: 'plan'; schritte: Schritt[]; brauchtWerkbank: boolean }
  /** Was an Grundmaterial fehlt (Gegenstands-ID → Anzahl), für den Weg mit dem wenigsten Fehlenden. */
  | { art: 'fehlt'; fehlt: Bestand }

const MAX_TIEFE = 5

/**
 * `bevorzugt`: Gegenstände, die Bernard beim Namen kennt. Fehlt bei mehreren Rezepten gleich viel,
 * nennt er lieber diese (Bruchstein statt Tiefenschiefer-Bruchstein).
 */
export function erstellePlanner(registry: Registry, bevorzugt: (id: number) => boolean = () => true) {
  const { Recipe } = recipeLoader(registry as never) // die Typen kennen nur den Versionsnamen
  const rezepteFuer = (id: number) => Recipe.find(id, null) as Recipe[]
  const werkbank = registry.itemsByName.crafting_table.id

  /**
   * Plant `anzahl` Stück eines der Gegenstände `ziele` (z. B. irgendeine Brettsorte).
   * `werkbankDa`: Eine Werkbank steht schon in der Nähe.
   */
  function plane(ziele: number[], anzahl: number, bestand: Bestand, werkbankDa: boolean): Plan {
    let besterFehlt: Bestand | null = null
    for (const ziel of ziele) {
      const ergebnis = planeMitWerkbank(ziel, anzahl, new Map(bestand), werkbankDa)
      if (ergebnis.art === 'plan') return ergebnis
      if (!besterFehlt || besser(ergebnis.fehlt, besterFehlt)) besterFehlt = ergebnis.fehlt
    }
    return { art: 'fehlt', fehlt: besterFehlt ?? new Map() }
  }

  function planeMitWerkbank(ziel: number, anzahl: number, bestand: Bestand, werkbankDa: boolean): Plan {
    const ohne = new Map(bestand)
    const versuch = besorge(ziel, anzahl, ohne, 0, null)
    if (versuch === null) {
      const fehlt = new Map<number, number>()
      const ungefaehr = besorge(ziel, anzahl, new Map(bestand), 0, fehlt)!
      if (werkbankDa || !ungefaehr.some(s => s.rezept.requiresTable)) return { art: 'fehlt', fehlt }
      // Die Werkbank kommt noch dazu
      const mitBank = new Map<number, number>()
      const rest = new Map(bestand)
      besorge(werkbank, 1, rest, 0, mitBank)
      besorge(ziel, anzahl, rest, 0, mitBank)
      return { art: 'fehlt', fehlt: mitBank }
    }
    const brauchtWerkbank = versuch.some(s => s.rezept.requiresTable)
    if (!brauchtWerkbank || werkbankDa) return { art: 'plan', schritte: versuch, brauchtWerkbank }

    // Erst eine Werkbank besorgen (sie wird aufgestellt, also verbraucht), dann das Ziel
    const mitBank = new Map(bestand)
    const fehlt = new Map<number, number>()
    const bank = besorge(werkbank, 1, mitBank, 0, null)
    const rest = bank && besorge(ziel, anzahl, mitBank, 0, null)
    if (bank && rest) return { art: 'plan', schritte: [...bank, ...rest], brauchtWerkbank: true }
    const nochmal = new Map(bestand)
    besorge(werkbank, 1, nochmal, 0, fehlt)
    besorge(ziel, anzahl, nochmal, 0, fehlt)
    return { art: 'fehlt', fehlt }
  }

  /**
   * Nimmt `anzahl` Stück aus dem Bestand und craftet, was fehlt. Liefert die Schritte oder null.
   * Mit `fehlt` statt null wird nie aufgegeben: Fehlendes Grundmaterial wird dort notiert.
   */
  function besorge(id: number, anzahl: number, bestand: Bestand, tiefe: number, fehlt: Bestand | null): Schritt[] | null {
    const vorhanden = bestand.get(id) ?? 0
    if (vorhanden >= anzahl) {
      bestand.set(id, vorhanden - anzahl)
      return []
    }
    const noetig = anzahl - vorhanden
    bestand.set(id, 0)
    const rezepte = tiefe < MAX_TIEFE ? rezepteFuer(id) : []

    for (const rezept of rezepte) {
      const versuch = new Map(bestand)
      const schritte = mitRezept(rezept, id, noetig, versuch, tiefe, null)
      if (schritte) {
        uebernehme(bestand, versuch)
        return schritte
      }
    }
    if (!fehlt) return null

    // Nichts klappt: den Weg mit dem wenigsten fehlenden Grundmaterial notieren
    let bester: { schritte: Schritt[]; bestand: Bestand; fehlt: Bestand } | null = null
    for (const rezept of rezepte) {
      const versuch = new Map(bestand)
      const versuchFehlt = new Map<number, number>()
      const schritte = mitRezept(rezept, id, noetig, versuch, tiefe, versuchFehlt)!
      if (!bester || besser(versuchFehlt, bester.fehlt)) bester = { schritte, bestand: versuch, fehlt: versuchFehlt }
    }
    if (!bester) {
      fehlt.set(id, (fehlt.get(id) ?? 0) + noetig) // Grundmaterial
      return []
    }
    uebernehme(bestand, bester.bestand)
    for (const [f, n] of bester.fehlt) fehlt.set(f, (fehlt.get(f) ?? 0) + n)
    return bester.schritte
  }

  function mitRezept(rezept: Recipe, id: number, noetig: number, bestand: Bestand, tiefe: number,
    fehlt: Bestand | null): Schritt[] | null {
    const proMal = rezept.result.count
    const mal = Math.ceil(noetig / proMal)
    const schritte: Schritt[] = []
    for (const zutat of rezept.delta) {
      if (zutat.count >= 0 || zutat.id < 0) continue
      const teil = besorge(zutat.id, -zutat.count * mal, bestand, tiefe + 1, fehlt)
      if (teil === null) return null
      schritte.push(...teil)
    }
    schritte.push({ rezept, mal })
    bestand.set(id, (bestand.get(id) ?? 0) + mal * proMal - noetig) // Überschuss
    return schritte
  }

  /** Weniger Fehlendes ist besser; bei Gleichstand das mit weniger unbekannten Gegenständen. */
  function besser(a: Bestand, b: Bestand) {
    if (summe(a) !== summe(b)) return summe(a) < summe(b)
    const unbekannt = (x: Bestand) => [...x.keys()].filter(i => !bevorzugt(i)).length
    return unbekannt(a) < unbekannt(b)
  }

  return { plane }
}

function uebernehme(ziel: Bestand, quelle: Bestand) {
  ziel.clear()
  for (const [k, v] of quelle) ziel.set(k, v)
}

function summe(b: Bestand) {
  let s = 0
  for (const n of b.values()) s += n
  return s
}
