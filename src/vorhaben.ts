// Bernard verfolgt ein Vorhaben: Zustand lesen, den Entscheider fragen, die Aktion ausführen, von vorn.
import type { Bot } from 'mineflayer'
import { besorge, type Besorgkontext } from './besorgen'
import { naechsterSchritt, type Aktion } from './entscheider'
import { mitMenge } from './dinge'
import { aktuelleStufe, STUFEN, type Inventar } from './stufen'

export type Vorhabenende =
  | Extract<Aktion, { art: 'fertig' }>
  | { art: 'gescheitert'; text: string }
  | { art: 'abgebrochen' }

/** So oft hintereinander darf dieselbe Aktion „fertig“ melden, ohne dass sich etwas tut. */
const MAX_WIEDERHOLUNGEN = 3

export function inventarVon(bot: Bot): Inventar {
  const inventar: Record<string, number> = {}
  for (const item of bot.inventory.items()) inventar[item.name] = (inventar[item.name] ?? 0) + item.count
  return inventar
}

export async function verfolgeVorhaben(bot: Bot, zielstufe: number, k: Besorgkontext): Promise<Vorhabenende> {
  let letzte = ''
  let wiederholungen = 0
  for (;;) {
    if (k.abbruch.abgebrochen) return { art: 'abgebrochen' }
    const vorher = aktuelleStufe(inventarVon(bot))
    const aktion = naechsterSchritt({ inventar: inventarVon(bot), zielstufe })
    k.protokoll?.(`Vorhaben: Stufe ${vorher}, nächster Schritt ${JSON.stringify(aktion)}`)
    if (aktion.art === 'fertig') return aktion

    const schluessel = `${aktion.ding}/${aktion.menge}`
    wiederholungen = schluessel === letzte ? wiederholungen + 1 : 0
    letzte = schluessel
    if (wiederholungen >= MAX_WIEDERHOLUNGEN) {
      return { art: 'gescheitert', text: `Ich komme bei ${mitMenge(aktion.ding, aktion.menge)} nicht weiter.` }
    }

    const ergebnis = await besorge(bot, aktion.ding, aktion.menge, k)
    if (k.abbruch.abgebrochen || ergebnis.art === 'abgebrochen') return { art: 'abgebrochen' }
    if (ergebnis.art === 'fehlt') return { art: 'gescheitert', text: `Mir fehlen ${ergebnis.text}.` }
    if (ergebnis.art === 'nichtGefunden') return { art: 'gescheitert', text: ergebnis.text }
    if (ergebnis.art === 'keinPlatz') return { art: 'gescheitert', text: 'Ich finde keinen Platz für die Werkbank.' }

    const nachher = aktuelleStufe(inventarVon(bot))
    if (nachher > vorher) k.melde(`${STUFEN[nachher - 1].name} geschafft!`)
  }
}
