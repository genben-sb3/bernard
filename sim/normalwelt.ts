// Die Normalwelt: ein zweiter Testserver mit normal generierter Welt, festem Seed und Schwierigkeit „normal“.
// Er läuft neben dem flachen Testserver auf eigenen Ports und wird für jeden Lauf mit frischer Welt gestartet.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Rcon } from 'rcon-client'

/** Seed der Normalwelt. Vom Spawn aus sind Bäume und Stein in Reichweite (siehe sim/LIESMICH.md). */
export const SEED = '42'
/** Wo man bei diesem Seed die Welt betritt (Weltspawn, ohne Streuung). */
export const SPAWN = { x: -32, y: 71, z: 0 }
export const PORT = 25566
export const RCON_PORT = 25576
export const RCON_PASSWORT = 'bernard-test'

const ORDNER = 'server-normal'
const WELT = 'welt'
const START_ZEITLIMIT_MS = 180000

export type Normalwelt = { stoppe: () => Promise<void> }

/** Löscht die alte Welt, startet den Server mit frischer Welt und wartet, bis er Spieler annimmt. */
export async function starteNormalwelt(seed = SEED): Promise<Normalwelt> {
  richteOrdnerEin(seed)
  for (const eintrag of readdirSync(ORDNER)) {
    if (eintrag.startsWith(WELT)) rmSync(join(ORDNER, eintrag), { recursive: true, force: true })
  }

  const java = resolve('.tools', 'java', 'bin', 'java')
  const server = spawn(java, ['-Xmx2G', '-jar', resolve('server', 'paper.jar'), '--nogui'], { cwd: ORDNER, stdio: ['pipe', 'pipe', 'pipe'] })
  const beendet = new Promise<void>(fertig => server.once('exit', () => fertig()))
  const aufraeumen = () => server.kill('SIGKILL') // Bricht der Lauf ab, darf der Server nicht weiterlaufen
  process.once('exit', aufraeumen)
  let ausgabe = ''
  await new Promise<void>((bereit, fehler) => {
    const timer = setTimeout(() => fehler(new Error(`Normalwelt-Server startet nicht in ${START_ZEITLIMIT_MS / 1000} s`)), START_ZEITLIMIT_MS)
    server.stdout.on('data', (teil: Buffer) => {
      ausgabe += teil.toString()
      if (/Done \(/.test(ausgabe)) { clearTimeout(timer); bereit() }
    })
    server.once('exit', code => {
      clearTimeout(timer)
      fehler(new Error(`Normalwelt-Server beendet sich beim Start (Code ${code}). Läuft noch einer auf Port ${PORT}?\n${ausgabe.slice(-1500)}`))
    })
  })

  const rcon = await Rcon.connect({ host: 'localhost', port: RCON_PORT, password: RCON_PASSWORT })
  // Ohne Streuung landet jeder Beitretende genau am Spawn: gleicher Start in jedem Lauf
  await rcon.send('gamerule respawn_radius 0')
  await rcon.end()

  return {
    async stoppe() {
      server.stdin.write('stop\n')
      const notbremse = setTimeout(() => server.kill('SIGKILL'), 30000)
      await beendet
      clearTimeout(notbremse)
      process.off('exit', aufraeumen)
    },
  }
}

function richteOrdnerEin(seed: string) {
  mkdirSync(ORDNER, { recursive: true })
  // Bibliotheken und Spieldateien teilt die Normalwelt mit dem flachen Server
  for (const geteilt of ['libraries', 'cache', 'versions']) {
    if (!existsSync(join(ORDNER, geteilt))) symlinkSync(resolve('server', geteilt), join(ORDNER, geteilt))
  }
  writeFileSync(join(ORDNER, 'eula.txt'), 'eula=true\n')
  writeFileSync(join(ORDNER, 'server.properties'), [
    `level-name=${WELT}`,
    `level-seed=${seed}`,
    'level-type=minecraft\\:normal',
    'difficulty=normal',
    'spawn-monsters=true',
    'generate-structures=true',
    `server-port=${PORT}`,
    'enable-rcon=true',
    `rcon.port=${RCON_PORT}`,
    `rcon.password=${RCON_PASSWORT}`,
    'online-mode=false',
    'enforce-secure-profile=false',
    'allow-flight=true',
    'spawn-protection=0',
    'view-distance=6',
    'simulation-distance=6',
    'max-tick-time=60000',
    'pause-when-empty-seconds=-1',
    'player-idle-timeout=0',
    '',
  ].join('\n'))
}
