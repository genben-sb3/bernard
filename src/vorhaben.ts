// Bernard verfolgt ein Vorhaben: Zustand lesen, den Entscheider fragen, die Aktion ausführen, von vorn.
// Das Vorhaben läuft unter den Befehlen der Kumpel weiter: Ein Befehl unterbricht es, danach macht es weiter.
import type { Bot } from 'mineflayer'
import type { Abbruch } from './auftrag'
import { besorge } from './besorgen'
import { naechsterSchritt, type Aktion } from './entscheider'
import { mitMenge } from './dinge'
import type { Endgrund, Laufbericht } from './laufbericht'
import { aktuelleStufe, bisZu, fehlendes, STUFEN, type Inventar } from './stufen'

/** So oft hintereinander darf dieselbe Aktion „fertig“ melden, ohne dass sich etwas tut. */
const MAX_WIEDERHOLUNGEN = 3
/** So lange wartet Bernard nach der Ansage, bevor er nach einem Befehl weitermacht (Zeit für „bleib“). */
export const ANSAGE_PAUSE_MS = 3000

export function inventarVon(bot: Bot): Inventar {
  const inventar: Record<string, number> = {}
  for (const item of bot.inventory.items()) inventar[item.name] = (inventar[item.name] ?? 0) + item.count
  return inventar
}

/** aktiv: arbeitet daran · unterbrochen: ein Befehl läuft · pausiert: wartet auf „mach weiter“ */
export type Vorhabenstatus = 'aktiv' | 'unterbrochen' | 'pausiert' | 'beendet'

export type Vorhabenoptionen = {
  /** Meldungen an den Kumpel, der das Vorhaben gegeben hat. */
  melde: (text: string) => void
  protokoll?: (text: string) => void
  laufbericht?: Laufbericht
  /** Nach so vielen Millisekunden Echtzeit endet das Vorhaben („Zeitlimit“). */
  zeitlimitMs?: number
  /** Wird einmal aufgerufen, wenn das Vorhaben endet, egal warum. */
  beiEnde?: (grund: Endgrund) => void
}

type Schrittende = { grund: Endgrund; text?: string } | null

export class Vorhaben {
  status: Vorhabenstatus = 'aktiv'
  /** Der laufende Durchgang der Schleife (null: keiner). */
  private durchgang: Abbruch | null = null
  private aktion: Aktion | null = null
  private letzte = ''
  private wiederholungen = 0
  private zeitlimit?: ReturnType<typeof setTimeout>
  private ansage?: ReturnType<typeof setTimeout>

  constructor(private readonly bot: Bot, readonly zielstufe: number, private readonly o: Vorhabenoptionen) {}

  starte() {
    if (this.o.zeitlimitMs !== undefined) {
      this.zeitlimit = setTimeout(() => {
        if (this.status === 'beendet') return
        this.o.melde('Die Zeit ist um, ich höre mit dem Vorhaben auf.')
        this.beende('zeitlimit')
      }, this.o.zeitlimitMs)
    }
    void this.laufe()
  }

  /** Ein Befehl übernimmt: Das Vorhaben wartet darunter. */
  unterbrich() {
    if (this.status !== 'aktiv' && this.status !== 'unterbrochen') return
    this.status = 'unterbrochen'
    this.halteDurchgangAn(false) // Wegfindung und Abbauen stoppt der neue Befehl selbst
  }

  /** Der Befehl ist erledigt: ansagen, kurz warten, dann weitermachen (außer jemand sagt „bleib“). */
  nachBefehl() {
    if (this.status !== 'unterbrochen') return
    const naechstes = this.naechstesFehlendes()
    this.o.melde(`Ich mach dann weiter bis ${bisZu(this.zielstufe)}${naechstes ? `, mir fehlt noch ${naechstes}` : ''}.`)
    clearTimeout(this.ansage)
    this.ansage = setTimeout(() => { if (this.status === 'unterbrochen') this.setzeFort() }, ANSAGE_PAUSE_MS)
  }

  /** „stopp“, „bleib“: anhalten, bis jemand „mach weiter“ sagt. */
  pausiere() {
    if (this.status === 'beendet') return
    this.halteDurchgangAn(true) // vor dem Statuswechsel: hält nur an, wenn das Vorhaben gerade selbst lief
    this.status = 'pausiert'
  }

  setzeFort() {
    if (this.status === 'beendet') return
    this.status = 'aktiv'
    clearTimeout(this.ansage)
    void this.laufe()
  }

  beende(grund: Endgrund) {
    if (this.status === 'beendet') return
    this.halteDurchgangAn(true)
    this.status = 'beendet'
    clearTimeout(this.zeitlimit)
    this.o.laufbericht?.ende(grund, inventarVon(this.bot))
    this.o.protokoll?.(`Vorhaben: beendet (${grund})`)
    this.o.beiEnde?.(grund)
  }

  /** Antwort auf „was machst du?“: Vorhaben, Stufe, was fehlt, was gerade passiert. */
  beschreibe(): string {
    const inventar = inventarVon(this.bot)
    const stufe = aktuelleStufe(inventar)
    const fehlt = stufe < STUFEN.length ? fehlendes(STUFEN[stufe], inventar).map(s => mitMenge(s.ding, s.menge)) : []
    const teile = [`Ich spiele bis ${bisZu(this.zielstufe)} und bin auf Stufe ${stufe}.`]
    if (fehlt.length > 0) teile.push(`Mir fehlen noch ${fehlt.join(', ')}.`)
    if (this.status === 'pausiert') teile.push('Gerade warte ich, bis du „mach weiter“ sagst.')
    else if (this.status === 'unterbrochen') teile.push('Gerade mache ich, was du gesagt hast.')
    else if (this.aktion?.art === 'besorge') teile.push(`Gerade besorge ich ${mitMenge(this.aktion.ding, this.aktion.menge)}.`)
    return teile.join(' ')
  }

  private naechstesFehlendes(): string | null {
    const inventar = inventarVon(this.bot)
    const stufe = aktuelleStufe(inventar)
    if (stufe >= STUFEN.length) return null
    const s = fehlendes(STUFEN[stufe], inventar)[0]
    return s ? mitMenge(s.ding, s.menge) : null
  }

  /** Bricht den laufenden Durchgang ab. Mit `stehenbleiben` hält Bernard auch sofort an. */
  private halteDurchgangAn(stehenbleiben: boolean) {
    clearTimeout(this.ansage)
    const lief = this.durchgang && !this.durchgang.abgebrochen && this.status === 'aktiv'
    if (this.durchgang) this.durchgang.abgebrochen = true
    this.durchgang = null
    if (stehenbleiben && lief) {
      this.bot.pathfinder.setGoal(null)
      if (this.bot.targetDigBlock) this.bot.stopDigging()
    }
  }

  private async laufe() {
    if (this.durchgang) return // läuft schon
    const abbruch: Abbruch = { abgebrochen: false }
    this.durchgang = abbruch
    try {
      const ende = await this.verfolge(abbruch)
      if (this.durchgang === abbruch) this.durchgang = null
      if (!ende || abbruch.abgebrochen) return
      if (ende.text) this.o.melde(ende.text)
      this.beende(ende.grund)
    } catch (fehler) {
      if (this.durchgang === abbruch) this.durchgang = null
      this.o.protokoll?.(`Vorhaben fehlgeschlagen: ${fehler instanceof Error ? fehler.stack : fehler}`)
      if (abbruch.abgebrochen) return
      this.o.melde('Beim Vorhaben ist etwas schiefgegangen. Ich höre damit auf.')
      this.beende('gescheitert')
    }
  }

  /** Arbeitet Schritte ab, bis das Vorhaben endet (Ende) oder warten soll bzw. abgebrochen ist (null). */
  private async verfolge(abbruch: Abbruch): Promise<Schrittende> {
    for (;;) {
      if (abbruch.abgebrochen) return null
      const vorher = aktuelleStufe(inventarVon(this.bot))
      const aktion = naechsterSchritt({
        inventar: inventarVon(this.bot), zielstufe: this.zielstufe,
        befehlLaeuft: this.status === 'unterbrochen', pausiert: this.status === 'pausiert',
      })
      this.aktion = aktion
      this.o.protokoll?.(`Vorhaben: Stufe ${vorher}, nächster Schritt ${JSON.stringify(aktion)}`)
      if (aktion.art === 'warten') return null
      if (aktion.art === 'fertig') {
        return aktion.grund === 'stufeNichtUmgesetzt'
          ? { grund: aktion.grund, text: `Weiter als bis ${bisZu(aktion.stufe)} kann ich noch nicht.` }
          : { grund: aktion.grund }
      }

      const schluessel = `${aktion.ding}/${aktion.menge}`
      this.wiederholungen = schluessel === this.letzte ? this.wiederholungen + 1 : 0
      this.letzte = schluessel
      if (this.wiederholungen >= MAX_WIEDERHOLUNGEN) {
        return { grund: 'gescheitert', text: `Ich komme bei ${mitMenge(aktion.ding, aktion.menge)} nicht weiter. Ich höre mit dem Vorhaben auf.` }
      }

      const ergebnis = await besorge(this.bot, aktion.ding, aktion.menge, { abbruch, melde: this.o.melde, protokoll: this.o.protokoll })
      this.o.laufbericht?.beobachte(inventarVon(this.bot))
      if (abbruch.abgebrochen || ergebnis.art === 'abgebrochen') return null
      const scheitern = ergebnis.art === 'fehlt' ? `Mir fehlen ${ergebnis.text}.`
        : ergebnis.art === 'nichtGefunden' ? ergebnis.text
        : ergebnis.art === 'keinPlatz' ? 'Ich finde keinen Platz für die Werkbank.'
        : null
      if (scheitern) return { grund: 'gescheitert', text: `${scheitern} Ich höre mit dem Vorhaben auf.` }

      const nachher = aktuelleStufe(inventarVon(this.bot))
      if (nachher > vorher) this.o.melde(`${STUFEN[nachher - 1].name} geschafft!`)
    }
  }
}
