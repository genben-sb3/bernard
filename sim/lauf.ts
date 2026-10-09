// Führt ein Testszenario auf dem lokalen Testserver aus.
// Aufruf: npm run sim -- <szenario>   (z. B. npm run sim -- folgen)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Rcon } from 'rcon-client'
import { starteBernard } from '../src/bernard'
import { Beobachter } from './beobachter'
import { PORT as NORMAL_PORT, RCON_PASSWORT as NORMAL_RCON_PASSWORT, RCON_PORT as NORMAL_RCON_PORT, starteNormalwelt } from './normalwelt'
import type { Szenario } from './szenario'
import { folgen } from './szenarien/folgen'
import { sammeln } from './szenarien/sammeln'
import { besorgen } from './szenarien/besorgen'
import { ki } from './szenarien/ki'
import { werkzeug } from './szenarien/werkzeug'
import { vorhaben } from './szenarien/vorhaben'
import { zeitlimit } from './szenarien/zeitlimit'
import { weiterziehen } from './szenarien/weiterziehen'
import { schmelzen } from './szenarien/schmelzen'
import { unterbrechen } from './szenarien/unterbrechen'
import { normalwelt } from './szenarien/normalwelt'
import { Testspieler, warte } from './testspieler'

const SZENARIEN: Record<string, Szenario> = { folgen, sammeln, werkzeug, besorgen, ki, vorhaben, zeitlimit, unterbrechen, weiterziehen, schmelzen, normalwelt }

const BODEN = -60

const name = process.argv[2]
const szenario = SZENARIEN[name]
if (!szenario) {
  console.error(`Unbekanntes Szenario „${name ?? ''}“. Vorhanden: ${Object.keys(SZENARIEN).join(', ')}`)
  process.exit(2)
}
const normal = szenario.welt === 'normal'
const VERBINDUNG = { host: 'localhost', port: normal ? NORMAL_PORT : 25565, version: '26.1' }

const zeitstempel = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
const ordner = join('sim', 'ergebnisse', `${zeitstempel}-${szenario.name}`)

if (normal) console.log('Starte die Normalwelt frisch …')
const normalServer = normal ? await starteNormalwelt() : undefined
const rcon = normal
  ? await Rcon.connect({ host: 'localhost', port: NORMAL_RCON_PORT, password: NORMAL_RCON_PASSWORT })
  : await Rcon.connect({ host: 'localhost', port: 25575, password: rconPasswort() })
const befehl = async (b: string) => {
  const antwort = await rcon.send(b)
  if (/unknown|incorrect|error|expected|too many|not loaded|no player|could not|failed|invalid/i.test(antwort)) throw new Error(`Server-Befehl „${b}“ fehlgeschlagen: ${antwort}`)
  return antwort
}

const beobachter = new Beobachter(VERBINDUNG, ['Bernard', ...szenario.spieler], ordner)
let abbruch: string | undefined
let vorbereitung: Awaited<ReturnType<NonNullable<Szenario['vorbereiten']>>> | undefined
const bots = [beobachter.bot]

try {
  await beobachter.bereit()
  await befehl('gamemode spectator Beobachter')
  await befehl('time set day')
  await befehl('weather clear')
  if (!normal) await leereArena()
  for (const b of szenario.aufbau) await befehl(b)

  const persoenlichkeit = readFileSync(join('config', 'persoenlichkeit.md'), 'utf8').trim()
  vorbereitung = await szenario.vorbereiten?.()
  const ki = vorbereitung?.ki ?? szenario.ki
  const bernard = starteBernard({ ...VERBINDUNG, name: 'Bernard', kumpel: szenario.kumpel, ki, persoenlichkeit,
    laufberichtOrdner: ordner, zeitlimitMs: szenario.zeitlimitMs,
    protokoll: text => beobachter.notiere(`[Bernard intern] ${text}`) })
  bots.push(bernard)
  bernard.on('kicked', grund => beobachter.notiere(`Bernard wurde rausgeworfen: ${JSON.stringify(grund)}`))
  bernard.on('error', fehler => beobachter.notiere(`Fehler bei Bernard: ${fehler.message}`))
  const spieler = Object.fromEntries(szenario.spieler.map(n => [n, new Testspieler(n, VERBINDUNG, beobachter)]))
  bots.push(...Object.values(spieler).map(s => s.bot))
  await Promise.all([
    new Promise<void>(resolve => bernard.once('spawn', () => resolve())),
    ...Object.values(spieler).map(s => s.bereit()),
  ])

  if (normal) {
    // Alle stehen am Spawn; der Beobachter schwebt darüber
    await befehl('tp Beobachter Bernard')
    await befehl('execute as Beobachter at @s run tp @s ~ ~30 ~ 0 90')
  } else {
    for (const [wer, [x, z]] of Object.entries(szenario.start)) {
      const hoehe = wer === 'Beobachter' ? BODEN + 30 : BODEN
      await befehl(`tp ${wer} ${x + 0.5} ${hoehe} ${z + 0.5} 0 ${wer === 'Beobachter' ? 90 : 0}`)
    }
  }
  for (const n of ['Bernard', ...szenario.spieler]) {
    await befehl(`gamemode survival ${n}`)
    await rcon.send(`clear ${n}`) // Inventar vom letzten Lauf leeren (meldet Fehler, wenn schon leer)
    await befehl(`effect clear ${n}`).catch(() => {})
  }
  await warte(2000) // Positionen und Chunks ankommen lassen
  beobachter.starteAufzeichnung()
  await warte(500)

  await szenario.ablauf({ ordner, rcon, beobachter, bernard, spieler })
  await warte(500)
  beobachter.karte('Gesamter Lauf')
} catch (fehler) {
  abbruch = fehler instanceof Error ? fehler.message : String(fehler)
  beobachter.notiere(`ABBRUCH: ${abbruch}`)
  try { beobachter.karte('Stand beim Abbruch') } catch {}
}

const bericht = beobachter.beende({ szenario: szenario.name, beschreibung: szenario.beschreibung, abbruch })
for (const bot of bots.slice(1)) bot.quit()
await rcon.end()
await vorbereitung?.aufraeumen()
await normalServer?.stoppe()

console.log(`${bericht.bestanden ? 'BESTANDEN' : 'NICHT BESTANDEN'}: ${szenario.name}`)
for (const p of bericht.pruefungen) console.log(`  ${p.bestanden ? '✓' : '✗'} ${p.name} — ${p.details}`)
if (abbruch) console.log(`  Abbruch: ${abbruch}`)
console.log(`Ergebnisse: ${ordner}`)
setTimeout(() => process.exit(bericht.bestanden ? 0 : 1), 500)

/** Räumt die Testfläche (-30..40 in x und z) bis 14 Blöcke über dem Boden leer. */
async function leereArena() {
  await befehl('forceload add -48 -48 63 63')
  for (let y = BODEN; y < BODEN + 14; y += 6) {
    await befehl(`fill -30 ${y} -30 40 ${y + 5} 40 air`)
  }
  await befehl('fill -30 -61 -30 40 -61 40 grass_block')
  await rcon.send('kill @e[type=item]') // meldet einen Fehler, wenn nichts herumliegt
}

function rconPasswort() {
  const eigenschaften = readFileSync(join('server', 'server.properties'), 'utf8')
  return eigenschaften.match(/^rcon\.password=(.*)$/m)?.[1] ?? ''
}
