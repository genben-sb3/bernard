// Bernard schmilzt im Ofen: nimmt einen Ofen in der Nähe oder stellt seinen eigenen auf und nimmt ihn wieder mit.
import type { Bot } from 'mineflayer'
import type { Block } from 'prismarine-block'
import pathfinderPkg from 'mineflayer-pathfinder'
import type { Abbruch } from './auftrag'
import { nimmMit, stelleAuf } from './craften'
import { warteAufInventarRuhe } from './ruhe'
import { planeSchmelzen, type Posten } from './schmelzplan'

const { goals } = pathfinderPkg

export type Schmelzergebnis =
  | { art: 'fertig'; anzahl: number }
  /** eingabe: fehlende Zutaten (Stück) · brennstoff: Schmelzvorgänge ohne Brennstoff · ofen: kein Ofen da */
  | { art: 'fehlt'; eingabe: number; brennstoff: number; ofen: boolean }
  | { art: 'keinPlatz' }
  | { art: 'abgebrochen' }

const OFEN_REICHWEITE = 4
/** Puffer über die reine Schmelzzeit hinaus, bevor Bernard aufgibt. */
const PUFFER_MS = 20000

export function inventarNamen(bot: Bot): Record<string, number> {
  const inventar: Record<string, number> = {}
  for (const item of bot.inventory.items()) inventar[item.name] = (inventar[item.name] ?? 0) + item.count
  return inventar
}

export function ofenInDerNaehe(bot: Bot): Block | null {
  return bot.findBlock({ matching: bot.registry.blocksByName.furnace.id, maxDistance: OFEN_REICHWEITE })
}

/** Schmilzt `menge` Stück `ergebnis` (Gegenstandsname, z. B. iron_ingot) aus dem, was Bernard dabeihat. */
export async function schmelze(bot: Bot, ergebnis: string, menge: number, abbruch: Abbruch,
  melde: (text: string) => void = () => {}, protokoll: (text: string) => void = () => {}): Promise<Schmelzergebnis> {
  const plan = planeSchmelzen(ergebnis, menge, inventarNamen(bot))
  let ofen = ofenInDerNaehe(bot)
  const ofenDa = !!ofen || bot.inventory.items().some(i => i.name === 'furnace')
  if (plan.art === 'fehlt' || !ofenDa) {
    return plan.art === 'fehlt' ? { ...plan, ofen: !ofenDa } : { art: 'fehlt', eingabe: 0, brennstoff: 0, ofen: true }
  }
  protokoll(`Schmelzen: ${menge} ${ergebnis} aus ${posten(plan.eingabe)}, heizen mit ${posten(plan.brennstoff)}`)

  let aufgestellt: Block | null = null
  try {
    if (!ofen) {
      aufgestellt = await stelleAuf(bot, 'furnace')
      if (!aufgestellt) return { art: 'keinPlatz' }
      ofen = aufgestellt
      protokoll(`Schmelzen: Ofen aufgestellt bei ${ofen.position}`)
    }
    if (bot.entity.position.distanceTo(ofen.position) > OFEN_REICHWEITE) {
      await bot.pathfinder.goto(new goals.GoalNear(ofen.position.x, ofen.position.y, ofen.position.z, 2))
    }
    melde(`Das dauert etwa ${plan.sekunden} Sekunden.`)
    const anzahl = await bediene(bot, ofen, ergebnis, menge, plan.eingabe, plan.brennstoff, abbruch, protokoll)
    if (abbruch.abgebrochen) return { art: 'abgebrochen' }
    if (anzahl < menge) throw new Error(`Nach ${plan.sekunden + PUFFER_MS / 1000} s erst ${anzahl} von ${menge} ${ergebnis}`)
    return { art: 'fertig', anzahl }
  } finally {
    if (aufgestellt) await nimmMit(bot, aufgestellt, abbruch, protokoll)
  }
}

/** Füllt den Ofen nach (je ein Fach für Zutat und Brennstoff), nimmt Fertiges heraus und am Ende Reste zurück. */
async function bediene(bot: Bot, ofenBlock: Block, ergebnis: string, menge: number, eingabe: Posten[], brennstoff: Posten[],
  abbruch: Abbruch, protokoll: (text: string) => void): Promise<number> {
  const id = (name: string) => bot.registry.itemsByName[name].id
  const zutaten = [...eingabe]
  const heizen = [...brennstoff]
  let fertig = 0
  await warteAufInventarRuhe(bot)
  const ofen = await bot.openFurnace(ofenBlock)
  try {
    const ende = Date.now() + menge * 10000 + PUFFER_MS
    while (fertig < menge && Date.now() < ende && !abbruch.abgebrochen) {
      const raus = ofen.outputItem()
      if (raus?.name === ergebnis) {
        await ofen.takeOutput()
        fertig += raus.count
        continue
      }
      if (!ofen.inputItem() && zutaten.length > 0) {
        const p = zutaten.shift()!
        await ofen.putInput(id(p.name), null, p.anzahl)
        continue
      }
      if (!ofen.fuelItem() && heizen.length > 0) {
        const p = heizen.shift()!
        await ofen.putFuel(id(p.name), null, p.anzahl)
        continue
      }
      await Promise.race([new Promise<void>(r => ofen.once('update', () => r())), new Promise(r => setTimeout(r, 1000))])
    }
    // Nicht Verbrauchtes zurücknehmen, sonst landet es beim Abbauen des Ofens auf dem Boden
    if (ofen.fuelItem()) await ofen.takeFuel()
    if (ofen.inputItem()) await ofen.takeInput()
    if (ofen.outputItem()?.name === ergebnis) {
      fertig += ofen.outputItem()!.count
      await ofen.takeOutput()
    }
  } catch (fehler) {
    protokoll(`Schmelzen: Ofen bedienen klappt nicht (${fehler instanceof Error ? fehler.message : fehler})`)
    throw fehler
  } finally {
    ofen.close()
  }
  return fertig
}

function posten(liste: Posten[]) {
  return liste.map(p => `${p.anzahl} ${p.name}`).join(', ')
}
