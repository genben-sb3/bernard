// Der Entscheider: wählt aus Bernards Zustand den nächsten Schritt für sein Vorhaben.
// Pur und ohne Mineflayer, damit er ohne Bot testbar ist und später durch einen KI-Plan ersetzt werden kann.
import type { DingName } from './dinge'
import { fehlendes, STUFEN, type Inventar } from './stufen'

export type Zustand = {
  inventar: Inventar
  /** Bis zu welcher Stufe das Vorhaben geht (5: Enderdrache). */
  zielstufe: number
}

export type Aktion =
  /** Sorgen, dass Bernard danach `menge` Stück von `ding` besitzt (Gesamtzahl, nicht zusätzlich). */
  | { art: 'besorge'; ding: DingName; menge: number }
  /** Das Vorhaben endet: Zielstufe erreicht, oder die nächste Stufe kann Bernard noch nicht. */
  | { art: 'fertig'; grund: 'zielErreicht' | 'stufeNichtUmgesetzt'; stufe: number }

export function naechsterSchritt(zustand: Zustand): Aktion {
  for (const stufe of STUFEN) {
    if (stufe.nummer > zustand.zielstufe) break
    if (stufe.soll.length === 0) return { art: 'fertig', grund: 'stufeNichtUmgesetzt', stufe: stufe.nummer - 1 }
    const fehlt = fehlendes(stufe, zustand.inventar)[0]
    if (fehlt) {
      const soll = stufe.soll.find(s => s.ding === fehlt.ding)!
      return { art: 'besorge', ding: fehlt.ding, menge: soll.menge }
    }
  }
  return { art: 'fertig', grund: 'zielErreicht', stufe: zustand.zielstufe }
}
