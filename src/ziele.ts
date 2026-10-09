// Eigene Wegfindungs-Ziele für Bernard.
import type { Entity } from 'prismarine-entity'
import pathfinderPkg from 'mineflayer-pathfinder'

const { goals } = pathfinderPkg

/**
 * Hinter einem Spieler herlaufen. Anders als GoalFollow aus mineflayer-pathfinder misst dieses Ziel
 * immer gegen die aktuelle Position des Spielers, nicht gegen einen alten Punkt. GoalFollow kann
 * dadurch bis zu doppelt so weit zurückhängen wie eingestellt.
 */
export class GoalHinterher extends goals.Goal {
  private zielX: number
  private zielY: number
  private zielZ: number

  constructor(
    private readonly spieler: Entity,
    /** Ab diesem Abstand gilt Bernard als angekommen. */
    private readonly abstand = 2,
    /** So weit darf sich der Spieler bewegen, bevor der Weg neu geplant wird. */
    private readonly neuPlanenAb = 0.75,
  ) {
    super()
    this.zielX = spieler.position.x
    this.zielY = spieler.position.y
    this.zielZ = spieler.position.z
  }

  heuristic(knoten: { x: number; y: number; z: number }) {
    const p = this.spieler.position.floored()
    return Math.hypot(p.x - knoten.x, p.z - knoten.z) + Math.abs(p.y - knoten.y)
  }

  isEnd(knoten: { x: number; y: number; z: number }) {
    const p = this.spieler.position.floored()
    return (p.x - knoten.x) ** 2 + (p.y - knoten.y) ** 2 + (p.z - knoten.z) ** 2 <= this.abstand ** 2
  }

  hasChanged() {
    const p = this.spieler.position // ungerundet: auch Bewegungen innerhalb eines Blocks zählen
    const bewegt = (p.x - this.zielX) ** 2 + (p.y - this.zielY) ** 2 + (p.z - this.zielZ) ** 2
    if (bewegt < this.neuPlanenAb ** 2) return false
    this.zielX = p.x
    this.zielY = p.y
    this.zielZ = p.z
    return true
  }

  isValid() {
    return this.spieler.isValid
  }
}
