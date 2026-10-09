// Gemeinsames für laufende Aufträge (Sammeln, Craften, Geben …).
import type { Bot } from 'mineflayer'

/** Wird auf abgebrochen gesetzt, sobald ein neuer Befehl den Auftrag ersetzt. */
export type Abbruch = { abgebrochen: boolean }

/**
 * Stoppt die Wegfindung, aber nur, solange der Auftrag noch läuft. Ein abgebrochener Auftrag darf sie
 * nicht mehr anfassen: Sie gehört dann schon dem neuen Auftrag, dessen Weg sonst mitgestoppt würde.
 */
export function halteAn(bot: Bot, abbruch: Abbruch) {
  if (!abbruch.abgebrochen) bot.pathfinder.setGoal(null)
}
