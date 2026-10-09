// Bernard: verbindet sich als Spieler mit dem Server und führt Befehle seiner Kumpel aus.
import mineflayer, { type Bot } from 'mineflayer'
import pathfinderPkg from 'mineflayer-pathfinder'
import { GoalHinterher } from './ziele'
import { anBernard, erkenneBefehl, istKumpel, type Befehl, type Nachricht } from './befehle'

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

const ANTWORTEN: Record<Befehl['art'], string> = {
  folgen: 'Bin dabei, ich folge dir!',
  stopp: 'Okay, ich bleib hier.',
  kommHer: 'Bin unterwegs!',
}

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
    if (fuehreAus(bot, befehl, nachricht.absender)) antworte(bot, nachricht, ANTWORTEN[befehl.art])
  }

  bot.on('chat', (absender, text) => verarbeite({ absender, text, privat: false }))
  bot.on('whisper', (absender, text) => verarbeite({ absender, text, privat: true }))
  bot.on('death', () => bot.chat('Autsch, ich bin gestorben. Ich warte am Spawn auf neue Befehle.'))
  return bot
}

/** Führt einen Befehl aus. Ein neuer Befehl ersetzt den laufenden. Liefert false, wenn es nicht geht. */
function fuehreAus(bot: Bot, befehl: Befehl, kumpel: string): boolean {
  const ziel = bot.players[kumpel]?.entity
  switch (befehl.art) {
    case 'folgen':
      if (!ziel) return keinSichtkontakt(bot, kumpel)
      bot.pathfinder.setGoal(new GoalHinterher(ziel), true)
      return true
    case 'kommHer':
      if (!ziel) return keinSichtkontakt(bot, kumpel)
      bot.pathfinder.setGoal(new goals.GoalNear(ziel.position.x, ziel.position.y, ziel.position.z, 2))
      return true
    case 'stopp':
      bot.pathfinder.setGoal(null)
      bot.clearControlStates()
      return true
  }
}

function keinSichtkontakt(bot: Bot, kumpel: string): false {
  bot.chat(`${kumpel}, ich kann dich nicht sehen. Wo bist du?`)
  return false
}

function antworte(bot: Bot, nachricht: Nachricht, text: string) {
  if (nachricht.privat) bot.whisper(nachricht.absender, text)
  else bot.chat(text)
}
