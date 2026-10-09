// Was ein Testszenario festlegt und womit es arbeiten kann.
import type { Bot } from 'mineflayer'
import type { Rcon } from 'rcon-client'
import type { Beobachter } from './beobachter'
import type { Position } from './protokoll'
import type { Testspieler } from './testspieler'

export type Kontext = {
  /** Ergebnisordner dieses Laufs (dort liegen auch Bernards Laufberichte). */
  ordner: string
  rcon: Rcon
  beobachter: Beobachter
  bernard: Bot
  spieler: Record<string, Testspieler>
}

/** flach: flache, friedliche Welt des Testservers (Standard). normal: frisch generierte Welt mit festem Seed, Schwierigkeit „normal“ (sim/normalwelt.ts). */
export type Weltart = 'flach' | 'normal'

export type Szenario = {
  name: string
  beschreibung: string
  /** In welcher Welt das Szenario läuft (Standard: flach). */
  welt?: Weltart
  /** Testspieler, die außer Bernard und dem Beobachter mitspielen. */
  spieler: string[]
  /** Kumpel, auf die Bernard in diesem Szenario hört. */
  kumpel: string[]
  /** Server-Befehle, die die Testumgebung bauen (läuft vor dem Beitritt der Bots fertig). */
  aufbau: string[]
  /** Startpositionen (x, z) nach dem Aufbau. Nur in der flachen Welt; in der normalen starten alle am Spawn. */
  start: Record<string, [number, number]>
  /** Optional: Zeitlimit für Vorhaben in diesem Szenario (Millisekunden Echtzeit). */
  zeitlimitMs?: number
  ablauf: (k: Kontext) => Promise<void>
}

export function abstand(a?: Position, b?: Position) {
  if (!a || !b) return Infinity
  return Math.hypot(a.x - b.x, a.z - b.z)
}
