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
}

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
  const brichAb = () => {
    if (laufendeAufgabe) laufendeAufgabe.abgebrochen = true
    laufendeAufgabe = null
    bot.pathfinder.setGoal(null)
    if (bot.targetDigBlock) bot.stopDigging()
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
    fuehreAus(befehl, nachricht)
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
        return fuehreAus(ergebnis.befehl, nachricht)
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

  const fuehreAus = (befehl: Befehl, nachricht: Nachricht) => {
    brichAb() // ein neuer Befehl ersetzt den laufenden
    const kumpel = nachricht.absender
    const ziel = bot.players[kumpel]?.entity
    switch (befehl.art) {
      case 'folgen':
        if (!ziel) return keinSichtkontakt(bot, kumpel)
        bot.pathfinder.setGoal(new GoalHinterher(ziel), true)
        return antworte(bot, nachricht, 'Bin dabei, ich folge dir!')
      case 'kommHer':
        if (!ziel) return keinSichtkontakt(bot, kumpel)
        bot.pathfinder.setGoal(new goals.GoalNear(ziel.position.x, ziel.position.y, ziel.position.z, 2))
        return antworte(bot, nachricht, 'Bin unterwegs!')
      case 'stopp':
        bot.clearControlStates()
        return antworte(bot, nachricht, 'Okay, ich bleib hier.')
      case 'sammeln': {
        const aufgabe: Abbruch = { abgebrochen: false }
        laufendeAufgabe = aufgabe
        antworte(bot, nachricht, `Okay, ich hole ${mitMenge(befehl.material, befehl.menge)}.`)
        void sammleUndMelde(bot, befehl.material, befehl.menge, aufgabe, nachricht, optionen.protokoll)
        return
      }
      case 'inventar':
        return antworte(bot, nachricht, beschreibeInventar(bot))
      case 'geben': {
        if (!ziel) return keinSichtkontakt(bot, kumpel)
        const aufgabe: Abbruch = { abgebrochen: false }
        laufendeAufgabe = aufgabe
        const sag = (ergebnis: Geben) => { if (!aufgabe.abgebrochen) antworte(bot, nachricht, antwortZumGeben(ergebnis, befehl.ding, befehl.menge)) }
        void gib(bot, ziel, befehl.ding, befehl.menge, aufgabe, sag, optionen.protokoll)
          .then(ergebnis => { if (ergebnis.art !== 'gegeben') sag(ergebnis) })
          .catch(fehler => meldeFehler(bot, nachricht, aufgabe, 'Beim Geben', fehler, optionen.protokoll))
        return
      }
      case 'craften': {
        const aufgabe: Abbruch = { abgebrochen: false }
        laufendeAufgabe = aufgabe
        const vorher = bot.inventory.items().filter(i => dingFuer(befehl.ding).passt(i.name)).reduce((s, i) => s + i.count, 0)
        void besorge(bot, befehl.ding, vorher + befehl.menge,
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
        return
      }
    }
  }

  bot.on('chat', (absender, text) => verarbeite({ absender, text, privat: false }))
  bot.on('whisper', (absender, text) => verarbeite({ absender, text, privat: true }))
  bot.on('death', () => {
    brichAb()
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

/** Zurück zum Kumpel, z. B. bevor Bernard meldet, dass er fertig ist. */
async function zurueckZu(bot: Bot, kumpel: string, aufgabe: Abbruch) {
  const ziel = bot.players[kumpel]?.entity
  if (!ziel) return
  await bot.pathfinder.goto(new goals.GoalNear(ziel.position.x, ziel.position.y, ziel.position.z, 2)).catch(() => halteAn(bot, aufgabe))
}

function gegenstaendeAlsIds(bot: Bot) {
  const summen = new Map<string, number>()
  for (const item of bot.inventory.items()) summen.set(item.name, (summen.get(item.name) ?? 0) + item.count)
  return [...summen].map(([name, anzahl]) => `${name} ×${anzahl}`).join(', ')
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
