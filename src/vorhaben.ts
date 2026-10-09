// Bernard verfolgt ein Vorhaben: Zustand lesen, den Entscheider fragen, die Aktion ausführen, von vorn.
// Das Vorhaben läuft unter den Befehlen der Kumpel weiter: Ein Befehl unterbricht es, danach macht es weiter.
import type { Bot } from 'mineflayer'
import pathfinderPkg from 'mineflayer-pathfinder'
import type { Abbruch } from './auftrag'
import { besorge, nichtGefundenText } from './besorgen'
import { naechsterSchritt, WEITERZIEH_STRECKE, zaehleFehlschlag, type Aktion, type Fehlschlag, type Ort } from './entscheider'
import { DINGE, mitMenge } from './dinge'
import type { Endgrund, Laufbericht } from './laufbericht'
import { aktuelleStufe, bisZu, fehlendes, rueckfall, STUFEN, type Inventar } from './stufen'

const { goals } = pathfinderPkg

/** So oft hintereinander darf dieselbe Aktion „fertig“ melden, ohne dass sich etwas tut. */
const MAX_WIEDERHOLUNGEN = 3
/** So lange wartet Bernard nach der Ansage, bevor er nach einem Befehl weitermacht (Zeit für „bleib“). */
export const ANSAGE_PAUSE_MS = 3000

export function inventarVon(bot: Bot): Inventar {
  const inventar: Record<string, number> = {}
  for (const item of bot.inventory.items()) inventar[item.name] = (inventar[item.name] ?? 0) + item.count
  return inventar
}

/** So oft merkt sich Bernard sein Inventar, damit er nach einem Tod weiß, was er hatte. */
const INVENTAR_MERKEN_MS = 500
/** So lange wartet Bernard nach dem Respawn, bis die Welt um ihn herum geladen ist. */
const NACH_RESPAWN_MS = 1000

/**
 * Merkt sich laufend das Inventar, solange Bernard lebt. Der Server leert das Inventar beim Tod, bevor er den
 * Tod meldet: Wer erst beim Tod nachschaut, sieht schon nichts mehr.
 */
export function merkeInventar(bot: Bot): () => Inventar {
  let gemerkt: Inventar = {}
  const merke = () => { if (bot.entity && bot.health > 0) gemerkt = inventarVon(bot) }
  const takt = setInterval(merke, INVENTAR_MERKEN_MS)
  bot.once('end', () => clearInterval(takt))
  return () => gemerkt
}

/** Was Bernard nach einem Tod sagt: den Rückfall, wenn die Stufe gesunken ist, sonst dass er weitermacht. */
export function todesansage(vorher: Inventar, nachher: Inventar, zielstufe: number): string {
  const r = rueckfall(vorher, nachher)
  return r ? `Ich bin gestorben, zurück auf Stufe ${r.nach}.` : `Ich bin gestorben, ich mach weiter bis ${bisZu(zielstufe)}.`
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
  private fehlschlag?: Fehlschlag
  /** Wo Bernard schon gesucht hat oder hingezogen ist (die jüngsten zuerst vergessen). */
  private besucht: Ort[] = []
  private ansage?: ReturnType<typeof setTimeout>

  constructor(private readonly bot: Bot, readonly zielstufe: number, private readonly o: Vorhabenoptionen) {}

  starte() {
    this.besucht = [this.position()]
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
    this.fehlschlag = undefined // der Kumpel hat vielleicht geholfen: neu versuchen
    this.letzte = ''
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

  /**
   * Bernard ist gestorben (respawnt von selbst): Tod und Rückfall festhalten, ansagen und nach dem Respawn
   * weitermachen. Ein laufender Befehl ist mit dem Tod vorbei, ein pausiertes Vorhaben bleibt pausiert.
   */
  nachTod(vorher: Inventar) {
    if (this.status === 'beendet') return
    this.halteDurchgangAn(true)
    const nachher = inventarVon(this.bot)
    this.o.laufbericht?.tod(vorher, nachher)
    const r = rueckfall(vorher, nachher)
    this.o.protokoll?.(`Vorhaben: gestorben auf Stufe ${aktuelleStufe(vorher)}${r ? `, Rückfall auf Stufe ${r.nach}` : ''}`)
    this.o.melde(todesansage(vorher, nachher, this.zielstufe))
    if (this.status === 'unterbrochen') this.status = 'aktiv'
    this.bot.once('spawn', () => {
      setTimeout(() => { if (this.status === 'aktiv') void this.laufe() }, NACH_RESPAWN_MS)
    })
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
    else if (this.aktion?.art === 'weiterziehen') teile.push(`Gerade suche ich woanders, weil ich hier ${DINGE[this.aktion.ding].kein} finde.`)
    return teile.join(' ')
  }

  private naechstesFehlendes(): string | null {
    const inventar = inventarVon(this.bot)
    const stufe = aktuelleStufe(inventar)
    if (stufe >= STUFEN.length) return null
    const s = fehlendes(STUFEN[stufe], inventar)[0]
    return s ? mitMenge(s.ding, s.menge) : null
  }

  private position(): Ort {
    const p = this.bot.entity.position
    return { x: Math.round(p.x), z: Math.round(p.z) }
  }

  private besuche(ort: Ort) {
    this.besucht.push(ort)
    if (this.besucht.length > 30) this.besucht.shift()
  }

  /** Läuft zum Ziel. Kommt Bernard nicht einmal halb so weit, zählt das als weiterer Fehlschlag. */
  private async ziehWeiter(aktion: Extract<Aktion, { art: 'weiterziehen' }>, abbruch: Abbruch) {
    const von = this.position()
    this.o.melde(`Hier finde ich ${DINGE[aktion.ding].kein}, ich schau mich weiter weg um.`)
    this.o.laufbericht?.weiterziehen(aktion.ding, von, aktion.nach)
    this.besuche(aktion.nach)
    await this.bot.pathfinder.goto(new goals.GoalNearXZ(aktion.nach.x, aktion.nach.z, 3)).catch(fehler => {
      if (!abbruch.abgebrochen) this.o.protokoll?.(`Vorhaben: Weiterziehen klappt nicht (${fehler instanceof Error ? fehler.message : fehler})`)
    })
    if (abbruch.abgebrochen) return
    const hier = this.position()
    if (Math.hypot(hier.x - von.x, hier.z - von.z) < WEITERZIEH_STRECKE / 2) {
      this.fehlschlag = zaehleFehlschlag(this.fehlschlag, { art: 'nichtGefunden', ding: aktion.ding, wo: hier })
    }
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
        position: this.position(), besucht: this.besucht, fehlschlag: this.fehlschlag,
      })
      this.aktion = aktion
      this.o.protokoll?.(`Vorhaben: Stufe ${vorher}, nächster Schritt ${JSON.stringify(aktion)}`)
      if (aktion.art === 'warten') return null
      if (aktion.art === 'fertig') {
        return aktion.grund === 'stufeNichtUmgesetzt'
          ? { grund: aktion.grund, text: `Weiter als bis ${bisZu(aktion.stufe)} kann ich noch nicht.` }
          : { grund: aktion.grund }
      }
      if (aktion.art === 'melden') {
        this.o.melde(`Ich finde ${DINGE[aktion.ding].kein}, auch nicht an ${aktion.anzahl} verschiedenen Stellen. ` +
          'Ich komme nicht weiter und warte, bis du „mach weiter“ sagst.')
        this.o.laufbericht?.aufgeben(aktion.ding, aktion.anzahl)
        this.status = 'pausiert'
        return null
      }
      if (aktion.art === 'weiterziehen') {
        await this.ziehWeiter(aktion, abbruch)
        continue
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
      if (ergebnis.art === 'nichtGefunden') {
        this.o.protokoll?.(`Vorhaben: ${nichtGefundenText(ergebnis)}`)
        const hier = this.position()
        this.besuche(hier)
        this.fehlschlag = zaehleFehlschlag(this.fehlschlag, { art: 'nichtGefunden', ding: ergebnis.material, wo: hier })
        this.letzte = '' // zählt als Fehlschlag, nicht als Wiederholung
        continue
      }
      if (ergebnis.art === 'fertig') this.fehlschlag = zaehleFehlschlag(this.fehlschlag, { art: 'erfolg' })
      const scheitern = ergebnis.art === 'fehlt' ? `Mir fehlen ${ergebnis.text}.`
        : ergebnis.art === 'keinPlatz' ? 'Ich finde keinen Platz für die Werkbank.'
        : null
      if (scheitern) return { grund: 'gescheitert', text: `${scheitern} Ich höre mit dem Vorhaben auf.` }

      const nachher = aktuelleStufe(inventarVon(this.bot))
      if (nachher > vorher) this.o.melde(`${STUFEN[nachher - 1].name} geschafft!`)
    }
  }
}
