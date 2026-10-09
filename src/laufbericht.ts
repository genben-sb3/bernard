// Der Laufbericht: Meilensteine eines Vorhabens mit Spiel- und Echtzeit, für Experimente und zum Vergleichen.
// Pur: bekommt Inventare und schreibt Einträge, woanders landen sie in einer Datei.
import type { DingName } from './dinge'
import type { Ort } from './entscheider'
import { aktuelleStufe, anzahl, STUFEN, type Inventar } from './stufen'

export type Endgrund = 'zielErreicht' | 'stufeNichtUmgesetzt' | 'vergessen' | 'abgebrochen' | 'gescheitert' | 'zeitlimit'

export type Eintrag = {
  /** Alter der Welt in Ticks. */
  spielzeit: number
  /** Zeitpunkt als ISO-Text. */
  echtzeit: string
  /** Echtzeit seit dem Start in ganzen Sekunden. */
  sekunden: number
} & (
  | { art: 'start'; zielstufe: number; stufe: number }
  /** Ein Ding des Soll-Inventars ist zum ersten Mal in der verlangten Menge da. */
  | { art: 'erfuellt'; ding: DingName; menge: number }
  | { art: 'stufe'; von: number; nach: number }
  /** `ding` war in der Nähe nicht zu finden, Bernard sucht woanders. */
  | { art: 'weiterziehen'; ding: DingName; von: Ort; nach: Ort }
  /** `ding` war mehrmals hintereinander nicht zu finden: Bernard meldet sich und pausiert das Vorhaben. */
  | { art: 'aufgeben'; ding: DingName; fehlschlaege: number }
  | { art: 'ende'; grund: Endgrund; stufe: number }
)

export type Uhr = () => { spielzeit: number; echtzeit: Date }

type Inhalt<E = Eintrag> = E extends unknown ? Omit<E, 'spielzeit' | 'echtzeit' | 'sekunden'> : never

export function erstelleLaufbericht(schreibe: (eintrag: Eintrag) => void, uhr: Uhr) {
  let beginn = 0
  let stufe = 0
  const erfuellt = new Set<string>()

  const eintragen = (inhalt: Inhalt) => {
    const { spielzeit, echtzeit } = uhr()
    if (inhalt.art === 'start') beginn = echtzeit.getTime()
    schreibe({ spielzeit, echtzeit: echtzeit.toISOString(), sekunden: Math.round((echtzeit.getTime() - beginn) / 1000), ...inhalt } as Eintrag)
  }

  /** Soll-Dinge, die jetzt erfüllt sind und es vorher nie waren. */
  const neuErfuellt = (inventar: Inventar) => {
    const neu: Array<{ ding: DingName; menge: number }> = []
    for (const s of STUFEN) {
      for (const soll of s.soll) {
        const schluessel = `${s.nummer}/${soll.ding}`
        if (erfuellt.has(schluessel) || anzahl(inventar, soll.ding) < soll.menge) continue
        erfuellt.add(schluessel)
        neu.push(soll)
      }
    }
    return neu
  }

  return {
    start(zielstufe: number, inventar: Inventar) {
      stufe = aktuelleStufe(inventar)
      neuErfuellt(inventar)
      eintragen({ art: 'start', zielstufe, stufe })
    },
    beobachte(inventar: Inventar) {
      for (const { ding, menge } of neuErfuellt(inventar)) eintragen({ art: 'erfuellt', ding, menge })
      const neu = aktuelleStufe(inventar)
      if (neu !== stufe) eintragen({ art: 'stufe', von: stufe, nach: neu })
      stufe = neu
    },
    weiterziehen(ding: DingName, von: Ort, nach: Ort) {
      eintragen({ art: 'weiterziehen', ding, von, nach })
    },
    aufgeben(ding: DingName, fehlschlaege: number) {
      eintragen({ art: 'aufgeben', ding, fehlschlaege })
    },
    ende(grund: Endgrund, inventar: Inventar) {
      eintragen({ art: 'ende', grund, stufe: aktuelleStufe(inventar) })
    },
  }
}

export type Laufbericht = ReturnType<typeof erstelleLaufbericht>
