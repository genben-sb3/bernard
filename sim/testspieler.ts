// Testspieler wie Ben oder Fremder: Bots, die die Rolle von Menschen übernehmen.
import mineflayer, { type Bot } from 'mineflayer'
import pathfinderPkg from 'mineflayer-pathfinder'
import type { Beobachter } from './beobachter'

const { pathfinder, Movements, goals } = pathfinderPkg

export class Testspieler {
  readonly bot: Bot

  constructor(
    readonly name: string,
    verbindung: { host: string; port: number; version: string },
    private readonly beobachter: Beobachter,
  ) {
    this.bot = mineflayer.createBot({ ...verbindung, username: name })
    this.bot.loadPlugin(pathfinder)
    this.bot.once('spawn', () => {
      const bewegungen = new Movements(this.bot)
      bewegungen.canDig = false
      this.bot.pathfinder.setMovements(bewegungen)
    })
    // Flüsternachrichten an diesen Spieler sieht der Beobachter nicht, also melden wir sie
    this.bot.on('whisper', (von, text) => this.beobachter.notiereChat({ von, an: name, text }))
  }

  bereit() {
    return new Promise<void>(resolve => this.bot.once('spawn', () => resolve()))
  }

  sage(text: string) {
    this.bot.chat(text)
  }

  fluestere(an: string, text: string) {
    this.beobachter.notiereChat({ von: this.name, an, text })
    this.bot.whisper(an, text)
  }

  /** Läuft zu einem Punkt auf dem Boden. Wirft, wenn der Weg nicht in der Zeit klappt. */
  async geheZu(x: number, z: number, zeitlimitMs = 30000) {
    const y = Math.floor(this.bot.entity.position.y)
    await mitZeitlimit(this.bot.pathfinder.goto(new goals.GoalNear(x, y, z, 1)), zeitlimitMs, `${this.name} kommt nicht nach ${x}/${z}`)
  }
}

export function warte(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function mitZeitlimit<T>(versprechen: Promise<T>, ms: number, meldung: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const ablauf = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(meldung)), ms) })
  try {
    return await Promise.race([versprechen, ablauf])
  } finally {
    clearTimeout(timer)
  }
}
