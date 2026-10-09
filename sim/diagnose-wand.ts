// Diagnose: Welche Bewegungen an einer Mauer lehnt der Server ab? Erwartet überall 0 Server-Korrekturen
// (siehe patches/prismarine-physics: 26.x-Server lehnen bündiges Anliegen an Wänden ab).
import { readFileSync } from 'node:fs'
import { Rcon } from 'rcon-client'
import { starteBernard } from '../src/bernard'

const pw = readFileSync('server/server.properties', 'utf8').match(/^rcon\.password=(.*)$/m)![1]
const rcon = await Rcon.connect({ host: 'localhost', port: 25575, password: pw })
await rcon.send('fill -30 -60 -30 40 -50 40 air')
await rcon.send('fill 8 -60 -6 8 -58 10 stone_bricks')
const bot = starteBernard({ host: 'localhost', port: 25565, version: '26.1', name: 'Bernard', kumpel: [] })
const warte = (ms: number) => new Promise(r => setTimeout(r, ms))

async function versuch(name: string, start: [number, number], yaw: number, abstandZurMauer = '') {
  await rcon.send(`tp Bernard ${start[0]} -60 ${start[1]} 0 0`)
  await warte(1000)
  let korrekturen = 0
  const zaehle = () => { korrekturen++ }
  bot.on('forcedMove', zaehle)
  const vorher = bot.entity.position.clone()
  await bot.look(yaw, 0, true)
  bot.setControlState('forward', true)
  await warte(1500)
  bot.setControlState('forward', false)
  await warte(300)
  bot.off('forcedMove', zaehle)
  console.log(`${name.padEnd(42)} start ${start} ${abstandZurMauer} bewegt ${vorher.distanceTo(bot.entity.position).toFixed(2)} Blöcke, Server-Korrekturen ${korrekturen}`)
}

bot.once('spawn', async () => {
  await warte(1500)
  // yaw: 0 = nach -z (Norden), Math.PI/2 = nach -x (Westen), Math.PI = +z (Süden), -Math.PI/2 = +x (Osten)
  await versuch('frei, nach Süden', [14.5, 0.5], Math.PI)
  await versuch('frei, nach Westen gegen die Mauer', [12.5, 0.5], Math.PI / 2)
  await versuch('an der Mauer, nach Süden (entlang)', [9.3, 0.5], Math.PI)
  await versuch('an der Mauer, nach Osten (weg)', [9.3, 0.5], -Math.PI / 2)
  await versuch('0,1 neben der Mauer, nach Süden', [9.4, 0.5], Math.PI)
  bot.quit(); await rcon.end(); process.exit(0)
})
