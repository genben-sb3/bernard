// Der Beobachter: fliegt unsichtbar (Zuschauermodus) über dem Geschehen und sammelt alles,
// was während eines Testlaufs passiert. Am Ende schreibt er den Bericht in einen Ergebnisordner.
import mineflayer, { type Bot } from 'mineflayer'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { zeichneKarte } from './karte'
import type { Bericht, Bild, ChatZeile, Ereignis, Position, Probe, Pruefung } from './protokoll'

const PROBEN_ABSTAND_MS = 250

export class Beobachter {
  readonly bot: Bot
  private readonly beginn = Date.now()
  private phase = 'Vorbereitung'
  private readonly proben: Probe[] = []
  private readonly chat: ChatZeile[] = []
  private readonly ereignisse: Ereignis[] = []
  private readonly pruefungen: Pruefung[] = []
  private readonly bilder: Bild[] = []
  private takt?: NodeJS.Timeout

  constructor(
    verbindung: { host: string; port: number; version: string },
    private readonly beobachtete: string[],
    private readonly ordner: string,
  ) {
    mkdirSync(ordner, { recursive: true })
    this.bot = mineflayer.createBot({ ...verbindung, username: 'Beobachter' })
    this.bot.on('chat', (von, text) => this.notiereChat({ von, text }))
    this.bot.on('entityDead', e => {
      if (e.type === 'player' && e.username) this.notiere(`${e.username} ist gestorben`)
    })
    this.bot.on('entityHurt', e => {
      if (e.type === 'player' && e.username && this.beobachtete.includes(e.username)) {
        this.notiere(`${e.username} hat Schaden genommen`)
      }
    })
  }

  get jetzt() {
    return Date.now() - this.beginn
  }

  bereit() {
    return new Promise<void>(resolve => this.bot.once('spawn', () => resolve()))
  }

  starteAufzeichnung() {
    this.takt = setInterval(() => this.probe(), PROBEN_ABSTAND_MS)
  }

  setzePhase(phase: string) {
    this.phase = phase
    this.notiere(`Phase: ${phase}`)
  }

  notiere(text: string) {
    this.ereignisse.push({ t: this.jetzt, text })
  }

  /** Für Flüsternachrichten, die nur der Empfänger sieht: andere Testbots melden sie hier. */
  notiereChat(zeile: Omit<ChatZeile, 't'>) {
    this.chat.push({ t: this.jetzt, ...zeile })
  }

  pruefe(name: string, bestanden: boolean, details: string) {
    this.pruefungen.push({ phase: this.phase, name, bestanden, details })
  }

  position(name: string): Position | undefined {
    const p = this.bot.players[name]?.entity?.position
    return p ? { x: p.x, y: p.y, z: p.z } : undefined
  }

  /** Alle Proben seit einem Zeitpunkt (z. B. Phasenbeginn). */
  probenSeit(t: number) {
    return this.proben.filter(p => p.t >= t)
  }

  /** Neue Chatzeilen seit einem Zeitpunkt. */
  chatSeit(t: number) {
    return this.chat.filter(c => c.t >= t)
  }

  karte(titel: string, nurSeit?: number) {
    const datei = `${String(this.bilder.length + 1).padStart(2, '0')}-${dateiname(titel)}.png`
    const proben = nurSeit === undefined ? this.proben : this.probenSeit(nurSeit)
    if (proben.length === 0) return
    zeichneKarte({ welt: this.bot, proben, titel, datei: join(this.ordner, datei) })
    this.bilder.push({ datei, titel })
  }

  beende(meta: { szenario: string; beschreibung: string; abbruch?: string }): Bericht {
    clearInterval(this.takt)
    const bericht: Bericht = {
      ...meta,
      gestartet: new Date(this.beginn).toISOString(),
      dauerSekunden: Math.round(this.jetzt / 1000),
      bestanden: !meta.abbruch && this.pruefungen.length > 0 && this.pruefungen.every(p => p.bestanden),
      pruefungen: this.pruefungen,
      chat: this.chat,
      ereignisse: this.ereignisse,
      bilder: this.bilder,
      proben: this.proben.filter((_, i) => i % 4 === 0), // eine Probe pro Sekunde reicht im Bericht
    }
    writeFileSync(join(this.ordner, 'bericht.json'), JSON.stringify(bericht, null, 2))
    this.bot.quit()
    return bericht
  }

  private probe() {
    const positionen: Record<string, Position> = {}
    for (const name of this.beobachtete) {
      const p = this.position(name)
      if (p) positionen[name] = { x: runde(p.x), y: runde(p.y), z: runde(p.z) }
    }
    this.proben.push({ t: this.jetzt, phase: this.phase, positionen })
  }
}

function runde(n: number) {
  return Math.round(n * 100) / 100
}

function dateiname(titel: string) {
  return titel
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
