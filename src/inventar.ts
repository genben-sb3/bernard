// Bernards Inventar: beschreiben und Sachen an einen Kumpel geben.
import type { Bot } from 'mineflayer'
import type { Entity } from 'prismarine-entity'
import pathfinderPkg from 'mineflayer-pathfinder'
import { DINGE, nameFuer, mitMenge, type DingName } from './dinge'
import { warteAufInventarRuhe } from './ruhe'

const { goals } = pathfinderPkg

const MAX_EINTRAEGE = 8

/** Eine Zeile wie „Ich habe 12 Eichenholz, 1 Holzspitzhacke und 3 Setzlinge.“ */
export function beschreibeInventar(bot: Bot): string {
  const summen = new Map<string, { anzahl: number; englisch: string }>()
  for (const item of bot.inventory.items()) {
    const bisher = summen.get(item.name)
    summen.set(item.name, { anzahl: (bisher?.anzahl ?? 0) + item.count, englisch: item.displayName })
  }
  if (summen.size === 0) return 'Meine Taschen sind leer.'
  const teile = [...summen.entries()]
    .sort((a, b) => b[1].anzahl - a[1].anzahl)
    .map(([name, { anzahl, englisch }]) => nameFuer(name, anzahl, englisch))
  const gezeigt = teile.slice(0, MAX_EINTRAEGE)
  if (teile.length > MAX_EINTRAEGE) gezeigt.push(`${teile.length - MAX_EINTRAEGE} weitere Sachen`)
  return `Ich habe ${aufzaehlung(gezeigt)}.`
}

export type Geben =
  | { art: 'gegeben'; anzahl: number; alles: boolean }
  | { art: 'nichtDa' }
  | { art: 'nichtErreicht' }

/**
 * Läuft zum Kumpel und wirft ihm Sachen zu. `ding` null = alles; `menge` 'alle' = alles von diesem Ding.
 * Hat Bernard weniger als verlangt, gibt er, was er hat.
 */
export async function gib(bot: Bot, kumpel: Entity, ding: DingName | null, menge: number | 'alle',
  beimWerfen: (ergebnis: Geben) => void = () => {}, protokoll: (text: string) => void = () => {}): Promise<Geben> {
  const passt = ding ? DINGE[ding].passt : () => true
  const vorrat = bot.inventory.items().filter(i => passt(i.name))
  const vorhanden = vorrat.reduce((s, i) => s + i.count, 0)
  if (vorhanden === 0) return { art: 'nichtDa' }
  const ziel = menge === 'alle' ? vorhanden : Math.min(menge, vorhanden)

  // Direkt vor die Füße fallen lassen und sofort zurücktreten: Geworfenes kann erst nach 2 s
  // aufgehoben werden, dann ist nur noch der Kumpel nah genug. (Aus der Ferne geworfen streut es zu stark,
  // zu nah ohne Zurücktreten hebt Bernard es selbst wieder auf.)
  try {
    await bot.pathfinder.goto(new goals.GoalNear(kumpel.position.x, kumpel.position.y, kumpel.position.z, 1.5))
  } catch {
    bot.pathfinder.setGoal(null)
    return { art: 'nichtErreicht' }
  }
  await bot.lookAt(kumpel.position, true)
  // Die Blickrichtung erfährt der Server erst mit dem nächsten Bewegungspaket (alle 50 ms).
  // Ohne Warten fliegt alles in die alte Laufrichtung.
  await bot.waitForTicks(3)
  await warteAufInventarRuhe(bot)

  let uebrig = ziel
  for (const item of vorrat) {
    if (uebrig <= 0) break
    const anzahl = Math.min(uebrig, item.count)
    protokoll(`Geben: werfe ${anzahl} ${item.name}`)
    await bot.toss(item.type, null, anzahl)
    uebrig -= anzahl
  }
  const ergebnis: Geben = { art: 'gegeben', anzahl: ziel - uebrig, alles: ziel === vorhanden && ding === null }
  beimWerfen(ergebnis)
  const weg = new goals.GoalInvert(new goals.GoalNear(kumpel.position.x, kumpel.position.y, kumpel.position.z, ABSTAND_NACH_WURF))
  await mitZeitlimit(bot.pathfinder.goto(weg), 1800).catch(() => bot.pathfinder.setGoal(null))
  await new Promise(r => setTimeout(r, 500)) // Server-Antwort abwarten, damit das Inventar stimmt
  protokoll(`Geben: danach im Inventar ${bot.inventory.items().map(i => `${i.count} ${i.name}`).join(', ') || 'nichts'}`)
  return ergebnis
}

const ABSTAND_NACH_WURF = 3

async function mitZeitlimit<T>(versprechen: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const ablauf = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`Zeitlimit ${ms} ms`)), ms) })
  try {
    return await Promise.race([versprechen, ablauf])
  } finally {
    clearTimeout(timer)
  }
}

/** Antworttext zu einem Geben-Ergebnis. */
export function antwortZumGeben(ergebnis: Geben, ding: DingName | null, verlangt: number | 'alle'): string {
  switch (ergebnis.art) {
    case 'nichtDa':
      return ding ? `Ich habe ${DINGE[ding].kein}.` : 'Meine Taschen sind leer.'
    case 'nichtErreicht':
      return 'Ich komme nicht zu dir durch.'
    case 'gegeben':
      if (!ding) return 'Hier, alles was ich habe!'
      if (verlangt !== 'alle' && ergebnis.anzahl < verlangt) return `Ich habe nur ${mitMenge(ding, ergebnis.anzahl)}, hier!`
      return `Hier, ${mitMenge(ding, ergebnis.anzahl)}!`
  }
}

function aufzaehlung(teile: string[]) {
  return teile.length === 1 ? teile[0] : `${teile.slice(0, -1).join(', ')} und ${teile.at(-1)}`
}
