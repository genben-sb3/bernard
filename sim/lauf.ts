// Führt ein Testszenario auf dem lokalen Testserver aus.
// Aufruf: npm run sim -- <szenario>   (z. B. npm run sim -- folgen)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Rcon } from 'rcon-client'
import { starteBernard } from '../src/bernard'
import { Beobachter } from './beobachter'
import type { Szenario } from './szenario'
import { folgen } from './szenarien/folgen'
import { Testspieler, warte } from './testspieler'

const SZENARIEN: Record<string, Szenario> = { folgen }

const VERBINDUNG = { host: 'localhost', port: 25565, version: '26.1' }
const BODEN = -60

const name = process.argv[2]
const szenario = SZENARIEN[name]
if (!szenario) {
  console.error(`Unbekanntes Szenario „${name ?? ''}“. Vorhanden: ${Object.keys(SZENARIEN).join(', ')}`)
  process.exit(2)
}

const zeitstempel = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
const ordner = join('sim', 'ergebnisse', `${zeitstempel}-${szenario.name}`)

const rcon = await Rcon.connect({ host: 'localhost', port: 25575, password: rconPasswort() })
const befehl = async (b: string) => {
  const antwort = await rcon.send(b)
  if (/unknown|incorrect|error|expected/i.test(antwort)) throw new Error(`Server-Befehl „${b}“ fehlgeschlagen: ${antwort}`)
  return antwort
}

const beobachter = new Beobachter(VERBINDUNG, ['Bernard', ...szenario.spieler], ordner)
let abbruch: string | undefined
const bots = [beobachter.bot]

try {
  await beobachter.bereit()
  await befehl('gamemode spectator Beobachter')
  await befehl('time set day')
  await befehl('weather clear')
  for (const b of szenario.aufbau) await befehl(b)

  const bernard = starteBernard({ ...VERBINDUNG, name: 'Bernard', kumpel: szenario.kumpel,
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

  for (const [wer, [x, z]] of Object.entries(szenario.start)) {
    const hoehe = wer === 'Beobachter' ? BODEN + 30 : BODEN
    await befehl(`tp ${wer} ${x + 0.5} ${hoehe} ${z + 0.5} 0 ${wer === 'Beobachter' ? 90 : 0}`)
  }
  for (const n of ['Bernard', ...szenario.spieler]) await befehl(`gamemode survival ${n}`)
  await warte(2000) // Positionen und Chunks ankommen lassen
  beobachter.starteAufzeichnung()
  await warte(500)

  await szenario.ablauf({ rcon, beobachter, bernard, spieler })
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

console.log(`${bericht.bestanden ? 'BESTANDEN' : 'NICHT BESTANDEN'}: ${szenario.name}`)
for (const p of bericht.pruefungen) console.log(`  ${p.bestanden ? '✓' : '✗'} ${p.name} — ${p.details}`)
if (abbruch) console.log(`  Abbruch: ${abbruch}`)
console.log(`Ergebnisse: ${ordner}`)
setTimeout(() => process.exit(bericht.bestanden ? 0 : 1), 500)

function rconPasswort() {
  const eigenschaften = readFileSync(join('server', 'server.properties'), 'utf8')
  return eigenschaften.match(/^rcon\.password=(.*)$/m)?.[1] ?? ''
}
