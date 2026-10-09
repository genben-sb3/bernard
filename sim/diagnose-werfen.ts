// Diagnose: Unter welchen Umständen kann Bernard Gegenstände fallen lassen? Prüft nach jedem Schritt
// per RCON, was der Server im Inventar sieht.
import { readFileSync } from 'node:fs'
import { Rcon } from 'rcon-client'
import { Vec3 } from 'vec3'
import mineflayer from 'mineflayer'
import pathfinderPkg from 'mineflayer-pathfinder'
import { crafte } from '../src/craften'
import { sammle } from '../src/sammeln'

const pw = readFileSync('server/server.properties', 'utf8').match(/^rcon\.password=(.*)$/m)![1]
const rcon = await Rcon.connect({ host: 'localhost', port: 25575, password: pw })
const warte = (ms: number) => new Promise(r => setTimeout(r, ms))
const bot = mineflayer.createBot({ host: 'localhost', port: 25565, username: 'Bernard', version: '26.1' })
bot.loadPlugin(pathfinderPkg.pathfinder)
const server = async (item: string) => Number((await rcon.send(`clear Bernard ${item} 0`)).match(/(\d+)/)?.[1] ?? 0)
const client = (item: string) => bot.inventory.items().filter(i => i.name === item).reduce((s, i) => s + i.count, 0)
const zeige = async (schritt: string, item: string) =>
  console.log(`${schritt.padEnd(48)} Server ${await server(item)}  Bernard glaubt ${client(item)}  Fenster ${bot.currentWindow?.type ?? 'Inventar'}`)

bot.once('spawn', async () => {
  await rcon.send('clear Bernard')
  await rcon.send('tp Bernard 0.5 -60 0.5')
  await rcon.send('give Bernard cobblestone 10')
  await rcon.send('give Bernard oak_log 10')
  await warte(1500)
  await zeige('Start', 'cobblestone')

  await bot.toss(bot.registry.itemsByName.cobblestone.id, null, 2)
  await warte(800)
  await zeige('bot.toss 2 Bruchstein', 'cobblestone')

  const item = bot.inventory.items().find(i => i.name === 'cobblestone')!
  await bot.equip(item, 'hand')
  await warte(300)
  console.log('   in der Hand laut Bernard:', bot.heldItem?.name, 'Hotbar-Slot', bot.quickBarSlot)
  bot._client.write('block_dig', { status: 4, location: new Vec3(0, 0, 0), face: 0, sequence: 0 })
  await warte(800)
  await zeige('Q (eins fallen lassen)', 'cobblestone')
  bot._client.write('block_dig', { status: 3, location: new Vec3(0, 0, 0), face: 0, sequence: 0 })
  await warte(800)
  await zeige('Strg+Q (Stapel fallen lassen)', 'cobblestone')

  // Wie im Szenario: erst craften (2×2), dann werfen
  const bretter = bot.recipesFor(bot.registry.itemsByName.oak_planks.id, null, 1, null)[0]
  await bot.craft(bretter, 1)
  await warte(800)
  await zeige('nach dem Craften: Bretter', 'oak_planks')
  await bot.toss(bot.registry.itemsByName.oak_log.id, null, 2)
  await warte(800)
  await zeige('nach dem Craften: bot.toss 2 Stämme', 'oak_log')

  // Wie im Szenario: Spitzhacke mit Werkbank craften, Stein abbauen, dann werfen
  bot.pathfinder.setMovements(new pathfinderPkg.Movements(bot))
  await rcon.send('fill 3 -60 -2 5 -60 0 stone')
  const kein = { abgebrochen: false }
  console.log('   craften:', JSON.stringify(await crafte(bot, 'holzspitzhacke', 1, kein, t => console.log('   sagt:', t), t => console.log('     ', t))))
  await warte(800)
  await zeige('nach Spitzhacke: Stämme', 'oak_log')
  await bot.toss(bot.registry.itemsByName.oak_log.id, null, 1)
  await warte(800)
  await zeige('nach Spitzhacke: bot.toss 1 Stamm', 'oak_log')
  console.log('   sammeln:', JSON.stringify(await sammle(bot, 'stein', 2, kein)))
  await warte(800)
  await zeige('nach Stein: Bruchstein', 'cobblestone')
  await bot.toss(bot.registry.itemsByName.cobblestone.id, null, 1)
  await warte(800)
  await zeige('nach Stein: bot.toss 1 Bruchstein', 'cobblestone')
  bot.quit(); await rcon.end(); process.exit(0)
})
