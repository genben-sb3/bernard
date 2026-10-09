// Der Entscheider: wählt aus Bernards Zustand den nächsten Schritt für sein Vorhaben.
// Pur und ohne Mineflayer, damit er ohne Bot testbar ist und später durch einen KI-Plan ersetzt werden kann.
import type { DingName } from './dinge'
import { aktuelleStufe, anzahl, fehlendes, STUFEN, type Inventar, type Stufe } from './stufen'

export type Zustand = {
  inventar: Inventar
  /** Bis zu welcher Stufe das Vorhaben geht (5: Enderdrache). */
  zielstufe: number
  /** Ein Befehl eines Kumpels läuft gerade: Das Vorhaben wartet darunter. */
  befehlLaeuft?: boolean
  /** Ein Kumpel hat das Vorhaben angehalten („stopp“, „bleib“). */
  pausiert?: boolean
  /** Wo Bernard gerade steht. */
  position?: Ort
  /** Wo Bernard schon gesucht hat oder hingezogen ist. */
  besucht?: Ort[]
  /** Der jüngste Fehlschlag: was Bernard nicht gefunden hat, wo zuletzt und wie oft hintereinander. */
  fehlschlag?: Fehlschlag
}

export type Ort = { x: number; z: number }
export type Fehlschlag = { ding: DingName; wo: Ort; anzahl: number }

/** So oft hintereinander darf dasselbe Ding unauffindbar sein, dann meldet Bernard sich und wartet. */
export const MAX_FEHLSCHLAEGE = 3
/** So weit zieht Bernard weiter (Blöcke). Etwas weniger als der Suchradius, damit keine Lücken bleiben. */
export const WEITERZIEH_STRECKE = 40

export type Aktion =
  /** Sorgen, dass Bernard danach `menge` Stück von `ding` besitzt (Gesamtzahl, nicht zusätzlich). */
  | { art: 'besorge'; ding: DingName; menge: number }
  /** Das Vorhaben endet: Zielstufe erreicht, oder die nächste Stufe kann Bernard noch nicht. */
  | { art: 'fertig'; grund: 'zielErreicht' | 'stufeNichtUmgesetzt'; stufe: number }
  /** `ding` war hier nicht zu finden: woanders hinziehen und es dort erneut versuchen. */
  | { art: 'weiterziehen'; ding: DingName; nach: Ort }
  /** `ding` war mehrmals hintereinander nicht zu finden: dem Kumpel sagen und auf ihn warten. */
  | { art: 'melden'; ding: DingName; anzahl: number }
  /** Gerade nichts tun (Befehl läuft oder pausiert). */
  | { art: 'warten' }

export function naechsterSchritt(zustand: Zustand, stufen: Stufe[] = STUFEN): Aktion {
  if (zustand.befehlLaeuft || zustand.pausiert) return { art: 'warten' }
  const { fehlschlag, position } = zustand
  if (fehlschlag && fehlschlag.anzahl >= MAX_FEHLSCHLAEGE) return { art: 'melden', ding: fehlschlag.ding, anzahl: fehlschlag.anzahl }
  if (fehlschlag && position && abstand(position, fehlschlag.wo) < WEITERZIEH_STRECKE / 2) {
    return { art: 'weiterziehen', ding: fehlschlag.ding, nach: weiterziehZiel(position, zustand.besucht ?? [fehlschlag.wo]) }
  }
  const { inventar, zielstufe } = zustand
  const erreicht = Math.min(aktuelleStufe(inventar, stufen), zielstufe)
  // Vorrat der erreichten Stufen: auffüllen, sobald er unter die Hälfte fällt
  for (const stufe of stufen.slice(0, erreicht)) {
    const knapp = stufe.vorrat.find(v => anzahl(inventar, v.ding) < v.menge / 2)
    if (knapp) return { art: 'besorge', ding: knapp.ding, menge: knapp.menge }
  }
  if (erreicht < zielstufe) {
    const naechste = stufen[erreicht]
    if (naechste.soll.length === 0) return { art: 'fertig', grund: 'stufeNichtUmgesetzt', stufe: erreicht }
    const fehlt = fehlendes(naechste, inventar)[0]
    const soll = naechste.soll.find(s => s.ding === fehlt.ding)!
    return { art: 'besorge', ding: fehlt.ding, menge: soll.menge }
  }
  // Zielstufe erreicht: deren Vorrat einmal ganz auffüllen, dann ist das Vorhaben fertig
  const offen = stufen[zielstufe - 1].vorrat.find(v => anzahl(inventar, v.ding) < v.menge)
  if (offen) return { art: 'besorge', ding: offen.ding, menge: offen.menge }
  return { art: 'fertig', grund: 'zielErreicht', stufe: zielstufe }
}

/** Führt den Fehlschlag-Zähler nach einem Versuch fort. Ein Erfolg setzt ihn zurück. */
export function zaehleFehlschlag(bisher: Fehlschlag | undefined,
  ergebnis: { art: 'erfolg' } | { art: 'nichtGefunden'; ding: DingName; wo: Ort }): Fehlschlag | undefined {
  if (ergebnis.art === 'erfolg') return undefined
  const anzahl = bisher?.ding === ergebnis.ding ? bisher.anzahl + 1 : 1
  return { ding: ergebnis.ding, wo: ergebnis.wo, anzahl }
}

/**
 * Wohin Bernard weiterzieht: eine der acht Himmelsrichtungen, möglichst weit weg von allem, wo er schon war
 * (Summe der Abstände). Bei Gleichstand gewinnt die erste Richtung (Osten, Süden, Westen, Norden, dann schräg).
 */
export function weiterziehZiel(position: Ort, besucht: Ort[]): Ort {
  const s = Math.SQRT1_2
  const richtungen = [[1, 0], [0, 1], [-1, 0], [0, -1], [s, s], [-s, s], [-s, -s], [s, -s]]
  let bestes: Ort = position
  let bestePunkte = -Infinity
  for (const [dx, dz] of richtungen) {
    const ziel = { x: Math.round(position.x + dx * WEITERZIEH_STRECKE), z: Math.round(position.z + dz * WEITERZIEH_STRECKE) }
    const punkte = besucht.reduce((summe, ort) => summe + abstand(ziel, ort), 0)
    if (punkte > bestePunkte + 0.5) {
      bestes = ziel
      bestePunkte = punkte
    }
  }
  return bestes
}

function abstand(a: Ort, b: Ort) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}
