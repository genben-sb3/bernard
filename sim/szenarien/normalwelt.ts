// Szenario (Vorhaben-Ticket 02): Die Normalwelt ist frisch, normal generiert und schwer genug, dass Monster spawnen.
// Bernard betritt sie am erwarteten Spawn, und von dort ist ein natürlicher Baum in Reichweite.
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'
import { SEED, SPAWN } from '../normalwelt'

const BAUM_REICHWEITE = 16
const MONSTER = ['zombie', 'skeleton', 'creeper', 'spider']

export const normalwelt: Szenario = {
  name: 'normalwelt',
  beschreibung: `Frische Normalwelt (Seed ${SEED}, Schwierigkeit „normal“): Bernard steht am Spawn, ein Baum ist in Reichweite, Monster spawnen.`,
  welt: 'normal',
  spieler: [],
  kumpel: ['Ben'],
  aufbau: [],
  start: {},

  async ablauf({ rcon, beobachter: b, bernard }) {
    b.setzePhase('Welt prüfen')
    const seed = await rcon.send('seed')
    b.pruefe(`Die Welt hat den Seed ${SEED}`, seed.includes(`[${SEED}]`), seed)
    const spielzeit = Number((await rcon.send('time query gametime')).match(/-?\d+/)?.[0] ?? NaN)
    b.pruefe('Die Welt ist frisch (höchstens 5 Minuten Spielzeit)', spielzeit <= 6000, `${spielzeit} Ticks`)
    const schwierigkeit = await rcon.send('difficulty')
    b.pruefe('Die Schwierigkeit ist „normal“', /normal/i.test(schwierigkeit), schwierigkeit)

    b.setzePhase('Am Spawn')
    const mitte = { x: SPAWN.x + 0.5, y: SPAWN.y, z: SPAWN.z + 0.5 }
    const pos = b.position('Bernard')
    b.pruefe('Bernard betritt die Welt am erwarteten Spawn', abstand(pos, mitte) < 1.5 && Math.abs((pos?.y ?? NaN) - SPAWN.y) < 2,
      `bei ${JSON.stringify(pos)}, erwartet ${JSON.stringify(SPAWN)}`)
    const baum = bernard.findBlock({ matching: block => block.name.endsWith('_log'), maxDistance: BAUM_REICHWEITE })
    b.pruefe(`Vom Spawn aus ist ein natürlicher Baum in Reichweite (≤ ${BAUM_REICHWEITE} Blöcke)`, baum !== null,
      baum ? `${baum.name} bei ${baum.position}, ${baum.position.distanceTo(bernard.entity.position).toFixed(1)} Blöcke` : 'kein Stamm gefunden')

    b.setzePhase('Monster')
    let gefunden: string[] = []
    for (let t = 0; t < 60000 && gefunden.length === 0; t += 2000) {
      for (const art of MONSTER) {
        if (/passed/i.test(await rcon.send(`execute if entity @e[type=minecraft:${art}]`))) gefunden.push(art)
      }
      if (gefunden.length === 0) await warte(2000)
    }
    b.pruefe('Monster spawnen', gefunden.length > 0, gefunden.length ? `gefunden: ${gefunden.join(', ')}` : 'in 60 s keine Monster')
  },
}
