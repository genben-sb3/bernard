// Bernard: verbindet sich als Spieler mit dem Server und führt Befehle seiner Kumpel aus.
import mineflayer, { type Bot } from 'mineflayer'
import pathfinderPkg from 'mineflayer-pathfinder'
import { GoalHinterher } from './ziele'
import { anBernard, erkenneBefehl, istKumpel, type Material, type Nachricht } from './befehle'
import { MATERIALIEN, sammle, type Abbruch, type Sammelergebnis } from './sammeln'

const { pathfinder, Movements, goals } = pathfinderPkg

export type BernardOptionen = {
  host: string
  port: number
  version: string
  name: string
  kumpel: string[]
  /** Optional: bekommt interne Abläufe mit (z. B. für die Simulation). */
  protokoll?: (text: string) => void
}

const TASTEN = ['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak'] as const


export function starteBernard(optionen: BernardOptionen): Bot {
  const bot = mineflayer.createBot({
    host: optionen.host,
    port: optionen.port,
    username: optionen.name,
    version: optionen.version,
  })
  bot.loadPlugin(pathfinder)

  bot.once('spawn', () => {
    const bewegungen = new Movements(bot)
    bewegungen.canDig = false // Version 1: beim Laufen nichts abbauen
    bewegungen.allow1by1towers = false
    bot.pathfinder.setMovements(bewegungen)
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
    const befehl = erkenneBefehl(text)
    if (!befehl) {
      antworte(bot, nachricht, 'Das verstehe ich noch nicht.')
      return
    }
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
        const name = MATERIALIEN[befehl.material].name
        antworte(bot, nachricht, `Okay, ich hole ${befehl.menge} ${name}.`)
        void sammleUndMelde(bot, befehl.material, befehl.menge, aufgabe, nachricht, optionen.protokoll)
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
  const name = MATERIALIEN[material].name
  let ergebnis: Sammelergebnis
  try {
    ergebnis = await sammle(bot, material, menge, aufgabe, protokoll)
  } catch (fehler) {
    protokoll?.(`Sammeln fehlgeschlagen: ${fehler instanceof Error ? fehler.stack : fehler}`)
    if (!aufgabe.abgebrochen) antworte(bot, nachricht, `Beim Sammeln ist etwas schiefgegangen.`)
    return
  }
  if (aufgabe.abgebrochen || ergebnis.art === 'abgebrochen') return
  if (ergebnis.art === 'werkzeugFehlt') return antworte(bot, nachricht, `Für ${name} brauche ich ${ergebnis.werkzeug}.`)

  // Zurück zum Kumpel, dann melden
  const kumpel = bot.players[nachricht.absender]?.entity
  if (kumpel) {
    await bot.pathfinder.goto(new goals.GoalNear(kumpel.position.x, kumpel.position.y, kumpel.position.z, 2)).catch(() => {})
  }
  if (aufgabe.abgebrochen) return
  if (ergebnis.art === 'fertig') antworte(bot, nachricht, `Fertig, ich habe ${ergebnis.anzahl} ${name}!`)
  else antworte(bot, nachricht, `Ich finde hier kein ${name} mehr. Ich habe ${ergebnis.anzahl} Stück.`)
}

function keinSichtkontakt(bot: Bot, kumpel: string) {
  bot.chat(`${kumpel}, ich kann dich nicht sehen. Wo bist du?`)
}

function antworte(bot: Bot, nachricht: Nachricht, text: string) {
  if (nachricht.privat) bot.whisper(nachricht.absender, text)
  else bot.chat(text)
}
