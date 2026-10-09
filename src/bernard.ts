// Bernard: verbindet sich als Spieler mit dem Server und führt Befehle seiner Kumpel aus.
import mineflayer, { type Bot } from 'mineflayer'
import pathfinderPkg from 'mineflayer-pathfinder'
import { GoalHinterher } from './ziele'
import { anBernard, erkenneBefehl, istKumpel, type Befehl, type Material, type Nachricht } from './befehle'
import { halteAn, type Abbruch } from './auftrag'
import { besorge } from './besorgen'
import { bewegungen } from './eingriffe'
import { DINGE, dingAufloeser, dingFuer, mitMenge } from './dinge'
import { antwortZumGeben, beschreibeInventar, gib, type Geben } from './inventar'
import { verstehe, type KiEinstellungen } from './ki'
import { sammle, type Sammelergebnis } from './sammeln'
import { aktuelleStufe, bisZu, STUFEN } from './stufen'
import { inventarVon, Vorhaben } from './vorhaben'
import { erstelleLaufbericht } from './laufbericht'
import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const { pathfinder, goals } = pathfinderPkg

export type BernardOptionen = {
  host: string
  port: number
  version: string
  name: string
  kumpel: string[]
  /** Optional: bekommt interne Abläufe mit (z. B. für die Simulation). */
  protokoll?: (text: string) => void
  /** Optional: KI für Sätze, die der Schnellweg nicht kennt. */
  ki?: KiEinstellungen
  /** Bernards Persönlichkeit für die KI (aus config/persoenlichkeit.md). */
  persoenlichkeit?: string
  /** Ordner für Laufberichte (eine Datei pro Vorhaben). Ohne: kein Laufbericht. */
  laufberichtOrdner?: string
  /** Optional: Nach so vielen Millisekunden Echtzeit endet jedes Vorhaben („Zeitlimit“). */
  zeitlimitMs?: number
}

/** Befehle, die als Auftrag laufen und ein Vorhaben unterbrechen. */
type Auftragsbefehl = Exclude<Befehl, { art: 'status' | 'weiter' | 'vergessen' | 'stopp' | 'vorhaben' }>

const TASTEN = ['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak'] as const
const KI_DENKPAUSE_MS = 3000
const KI_MELDEN_HOECHSTENS_MS = 5 * 60 * 1000


export function starteBernard(optionen: BernardOptionen): Bot {
  const bot = mineflayer.createBot({
    host: optionen.host,
    port: optionen.port,
    username: optionen.name,
    version: optionen.version,
  })
  bot.loadPlugin(pathfinder)

  bot.once('spawn', () => {
    bot.pathfinder.setMovements(bewegungen(bot)) // unterwegs nichts abbauen, nichts platzieren
  })

  const protokoll = optionen.protokoll
  if (protokoll) {
    const pos = () => bot.entity.position.floored().toString()
    bot.on('path_update', r => protokoll(`Weg: ${r.status}, ${r.path.length} Schritte, ${Math.round(r.time)} ms, von ${pos()}`))
    bot.on('path_reset', grund => protokoll(`Weg zurückgesetzt: ${grund} bei ${pos()}`))
    bot.on('path_stop', () => protokoll(`Weg gestoppt bei ${pos()}`))
    bot.on('goal_reached', () => protokoll(`Ziel erreicht bei ${pos()}`))
    bot.on('forcedMove', () => protokoll(`Server-Korrektur auf ${bot.entity.position.toString()}`))
    setInterval(() => {
      if (!bot.entity) return
      const v = bot.entity.velocity
      const tasten = TASTEN.filter(t => bot.getControlState(t)).join('+') || '-'
      protokoll(`Zustand: pos ${bot.entity.position.toString()}, boden ${bot.entity.onGround}, ` +
        `v ${v.x.toFixed(2)}/${v.y.toFixed(2)}/${v.z.toFixed(2)}, tasten ${tasten}, ` +
        `bewegt ${bot.pathfinder.isMoving()}, ziel ${bot.pathfinder.goal?.constructor.name ?? '-'}`)
    }, 1000)
  }

  let laufendeAufgabe: Abbruch | null = null
  let vorhaben: Vorhaben | null = null
  const brichAb = () => {
    if (laufendeAufgabe) laufendeAufgabe.abgebrochen = true
    laufendeAufgabe = null
    bot.pathfinder.setGoal(null)
    if (bot.targetDigBlock) bot.stopDigging()
  }

  /** Führt einen gewöhnlichen Befehl aus. Liefert, wann er erledigt ist (undefined: läuft dauerhaft, wie Folgen). */
  const fuehreAus = (befehl: Auftragsbefehl, nachricht: Nachricht, aufgabe: Abbruch): Promise<unknown> | undefined => {
    const kumpel = nachricht.absender
    const ziel = bot.players[kumpel]?.entity
    switch (befehl.art) {
      case 'folgen':
        if (!ziel) return Promise.resolve(keinSichtkontakt(bot, kumpel))
        bot.pathfinder.setGoal(new GoalHinterher(ziel), true)
        antworte(bot, nachricht, 'Bin dabei, ich folge dir!')
        return undefined
      case 'kommHer':
        if (!ziel) return Promise.resolve(keinSichtkontakt(bot, kumpel))
        antworte(bot, nachricht, 'Bin unterwegs!')
        return bot.pathfinder.goto(new goals.GoalNear(ziel.position.x, ziel.position.y, ziel.position.z, 2)).catch(() => halteAn(bot, aufgabe))
      case 'sammeln':
        antworte(bot, nachricht, `Okay, ich hole ${mitMenge(befehl.material, befehl.menge)}.`)
        return sammleUndMelde(bot, befehl.material, befehl.menge, aufgabe, nachricht, optionen.protokoll)
      case 'inventar':
        return Promise.resolve(antworte(bot, nachricht, beschreibeInventar(bot)))
      case 'geben': {
        if (!ziel) return Promise.resolve(keinSichtkontakt(bot, kumpel))
        const sag = (ergebnis: Geben) => { if (!aufgabe.abgebrochen) antworte(bot, nachricht, antwortZumGeben(ergebnis, befehl.ding, befehl.menge)) }
        return gib(bot, ziel, befehl.ding, befehl.menge, aufgabe, sag, optionen.protokoll)
          .then(ergebnis => { if (ergebnis.art !== 'gegeben') sag(ergebnis) })
          .catch(fehler => meldeFehler(bot, nachricht, aufgabe, 'Beim Geben', fehler, optionen.protokoll))
      }
      case 'craften': {
        const vorher = bot.inventory.items().filter(i => dingFuer(befehl.ding).passt(i.name)).reduce((s, i) => s + i.count, 0)
        return besorge(bot, befehl.ding, vorher + befehl.menge,
          { abbruch: aufgabe, melde: text => antworte(bot, nachricht, text), protokoll: optionen.protokoll })
          .then(async ergebnis => {
            if (aufgabe.abgebrochen) return
            if (ergebnis.art === 'fertig') {
              if (ergebnis.unterwegs) await zurueckZu(bot, nachricht.absender, aufgabe)
              if (!aufgabe.abgebrochen) antworte(bot, nachricht, `Fertig: ${mitMenge(befehl.ding, ergebnis.anzahl)}!`)
            } else if (ergebnis.art === 'fehlt') antworte(bot, nachricht, `Dafür fehlen mir ${ergebnis.text}.`)
            else if (ergebnis.art === 'nichtGefunden') antworte(bot, nachricht, ergebnis.text)
            else if (ergebnis.art === 'keinPlatz') antworte(bot, nachricht, 'Ich finde keinen Platz für die Werkbank.')
          })
          .catch(fehler => meldeFehler(bot, nachricht, aufgabe, 'Beim Craften', fehler, optionen.protokoll))
      }
    }
  }

  const starteVorhaben = (zielstufe: number, nachricht: Nachricht) => {
    if (aktuelleStufe(inventarVon(bot)) >= zielstufe) return antworte(bot, nachricht, `Bis ${bisZu(zielstufe)} bin ich schon.`)
    brichAb()
    vorhaben?.beende('abgebrochen')
    antworte(bot, nachricht, zielstufe === STUFEN.length ? 'Okay, auf zum Enderdrachen!' : `Okay, ich spiele bis ${bisZu(zielstufe)}.`)
    const neues: Vorhaben = new Vorhaben(bot, zielstufe, {
      melde: text => antworte(bot, nachricht, text),
      protokoll: optionen.protokoll,
      laufbericht: starteLaufbericht(bot, zielstufe, optionen),
      zeitlimitMs: optionen.zeitlimitMs,
      beiEnde: () => { if (vorhaben === neues) vorhaben = null },
    })
    vorhaben = neues
    neues.starte()
  }

  const verarbeite = (nachricht: Nachricht) => {
    if (nachricht.absender === bot.username) return
    const text = anBernard(nachricht, optionen.name)
    if (text === null) return
    if (!istKumpel(nachricht.absender, optionen.kumpel)) return
    nachrichtNr++ // macht noch laufende KI-Anfragen ungültig
    const befehl = erkenneBefehl(text)
    if (!befehl) {
      void frageKi(text, nachricht, nachrichtNr)
      return
    }
    behandle(befehl, nachricht)
  }

  let nachrichtNr = 0
  let kiZuletztGemeldet = 0
  /** Sätze, die der Schnellweg nicht kennt, versteht die KI (wenn eingerichtet). */
  const frageKi = async (text: string, nachricht: Nachricht, nr: number) => {
    if (!optionen.ki) return antworte(bot, nachricht, 'Das verstehe ich noch nicht.')
    const start = Date.now()
    const denkt = setTimeout(() => { if (nr === nachrichtNr) antworte(bot, nachricht, 'Hmm, Moment …') }, KI_DENKPAUSE_MS)
    const lage = {
      kumpel: nachricht.absender,
      inventar: beschreibeInventar(bot),
      gegenstaende: gegenstaendeAlsIds(bot),
      persoenlichkeit: optionen.persoenlichkeit ?? 'Freundlich, hilfsbereit, antwortet kurz.',
    }
    const ergebnis = await verstehe(text, lage, optionen.ki, dingAufloeser(bot))
    clearTimeout(denkt)
    optionen.protokoll?.(`KI: „${text}“ → ${JSON.stringify(ergebnis)} nach ${Date.now() - start} ms`)
    if (nr !== nachrichtNr) return // inzwischen kam eine neuere Nachricht
    switch (ergebnis.art) {
      case 'befehl':
        return behandle(ergebnis.befehl, nachricht)
      case 'sagen':
        return antworte(bot, nachricht, ergebnis.text)
      case 'fehler':
        if (ergebnis.grund === 'nichtErreichbar' && Date.now() - kiZuletztGemeldet > KI_MELDEN_HOECHSTENS_MS) {
          kiZuletztGemeldet = Date.now()
          return antworte(bot, nachricht, 'Mein KI-Kopf ist gerade nicht erreichbar. Einfache Befehle wie „folge mir“ gehen aber.')
        }
        return antworte(bot, nachricht, 'Das verstehe ich noch nicht.')
    }
  }

  /** Verteilt einen erkannten Befehl (vom Schnellweg oder von der KI). */
  const behandle = (befehl: Befehl, nachricht: Nachricht) => {
    switch (befehl.art) {
      case 'status': // unterbricht nichts
        return antworte(bot, nachricht, vorhaben ? vorhaben.beschreibe() : 'Ich hab gerade nichts vor.')
      case 'weiter':
        if (!vorhaben) return antworte(bot, nachricht, 'Ich hab gerade nichts vor.')
        brichAb()
        antworte(bot, nachricht, `Okay, ich mach weiter bis ${bisZu(vorhaben.zielstufe)}.`)
        return vorhaben.setzeFort()
      case 'vergessen':
        if (!vorhaben) return antworte(bot, nachricht, 'Ich hab gerade nichts vor.')
        antworte(bot, nachricht, 'Okay, ich vergesse das Vorhaben.')
        return vorhaben.beende('vergessen')
      case 'stopp':
        brichAb()
        bot.clearControlStates()
        vorhaben?.pausiere()
        return antworte(bot, nachricht, vorhaben ? 'Okay, ich bleib hier, bis du „mach weiter“ sagst.' : 'Okay, ich bleib hier.')
      case 'vorhaben':
        return starteVorhaben(befehl.zielstufe, nachricht)
      default: {
        brichAb() // ein neuer Befehl ersetzt den laufenden
        vorhaben?.unterbrich() // und das Vorhaben wartet darunter
        const aufgabe: Abbruch = { abgebrochen: false }
        laufendeAufgabe = aufgabe
        void fuehreAus(befehl, nachricht, aufgabe)?.finally(() => {
          if (laufendeAufgabe !== aufgabe || aufgabe.abgebrochen) return // ein neuerer Befehl hat übernommen
          laufendeAufgabe = null
          vorhaben?.nachBefehl()
        })
      }
    }
  }

  bot.on('chat', (absender, text) => verarbeite({ absender, text, privat: false }))
  bot.on('whisper', (absender, text) => verarbeite({ absender, text, privat: true }))
  bot.on('death', () => {
    brichAb()
    vorhaben?.beende('abgebrochen')
    bot.chat('Autsch, ich bin gestorben. Ich warte am Spawn auf neue Befehle.')
  })
  return bot
}

async function sammleUndMelde(bot: Bot, material: Material, menge: number, aufgabe: Abbruch,
  nachricht: Nachricht, protokoll?: (text: string) => void) {
  const ding = DINGE[material]
  let ergebnis: Sammelergebnis
  try {
    ergebnis = await sammle(bot, material, menge, aufgabe, protokoll)
  } catch (fehler) {
    protokoll?.(`Sammeln fehlgeschlagen: ${fehler instanceof Error ? fehler.stack : fehler}`)
    if (!aufgabe.abgebrochen) antworte(bot, nachricht, `Beim Sammeln ist etwas schiefgegangen.`)
    return
  }
  if (aufgabe.abgebrochen || ergebnis.art === 'abgebrochen') return
  if (ergebnis.art === 'werkzeugFehlt') return antworte(bot, nachricht, `Für ${ding.mehrzahl} brauche ich ${ergebnis.werkzeug}.`)

  // Zurück zum Kumpel, dann melden
  const kumpel = bot.players[nachricht.absender]?.entity
  if (kumpel) {
    await bot.pathfinder.goto(new goals.GoalNear(kumpel.position.x, kumpel.position.y, kumpel.position.z, 2)).catch(() => {})
  }
  if (aufgabe.abgebrochen) return
  if (ergebnis.art === 'fertig') antworte(bot, nachricht, `Fertig, ich habe ${mitMenge(material, ergebnis.anzahl)}!`)
  else antworte(bot, nachricht, `Ich finde hier ${ding.kein} mehr. Ich habe ${mitMenge(material, ergebnis.anzahl)}.`)
}

function gegenstaendeAlsIds(bot: Bot) {
  const summen = new Map<string, number>()
  for (const item of bot.inventory.items()) summen.set(item.name, (summen.get(item.name) ?? 0) + item.count)
  return [...summen].map(([name, anzahl]) => `${name} ×${anzahl}`).join(', ')
}

/** Legt den Laufbericht eines Vorhabens an: eine Datei mit einem JSON-Eintrag pro Zeile. */
function starteLaufbericht(bot: Bot, zielstufe: number, optionen: BernardOptionen) {
  const ordner = optionen.laufberichtOrdner
  if (!ordner) return undefined
  mkdirSync(ordner, { recursive: true })
  const datei = join(ordner, `laufbericht-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}-stufe${zielstufe}.jsonl`)
  optionen.protokoll?.(`Laufbericht: ${datei}`)
  const laufbericht = erstelleLaufbericht(eintrag => appendFileSync(datei, JSON.stringify(eintrag) + '\n'),
    () => ({ spielzeit: Number(bot.time.age), echtzeit: new Date() }))
  laufbericht.start(zielstufe, inventarVon(bot))
  return laufbericht
}

/** Zurück zum Kumpel, z. B. bevor Bernard meldet, dass er fertig ist. */
async function zurueckZu(bot: Bot, kumpel: string, aufgabe: Abbruch) {
  const ziel = bot.players[kumpel]?.entity
  if (!ziel) return
  await bot.pathfinder.goto(new goals.GoalNear(ziel.position.x, ziel.position.y, ziel.position.z, 2)).catch(() => halteAn(bot, aufgabe))
}

function meldeFehler(bot: Bot, nachricht: Nachricht, aufgabe: Abbruch, wobei: string, fehler: unknown,
  protokoll?: (text: string) => void) {
  protokoll?.(`${wobei} fehlgeschlagen: ${fehler instanceof Error ? fehler.stack : fehler}`)
  if (!aufgabe.abgebrochen) antworte(bot, nachricht, `${wobei} ist etwas schiefgegangen.`)
}

function keinSichtkontakt(bot: Bot, kumpel: string) {
  bot.chat(`${kumpel}, ich kann dich nicht sehen. Wo bist du?`)
}

function antworte(bot: Bot, nachricht: Nachricht, text: string) {
  if (nachricht.privat) bot.whisper(nachricht.absender, text)
  else bot.chat(text)
}
