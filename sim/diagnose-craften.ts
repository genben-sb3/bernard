// Diagnose: Warum kommt die Holzspitzhacke manchmal nicht an? Lässt Bernard mehrmals hintereinander aus
// Stämmen eine Holzspitzhacke craften (Bretter, Werkbank, Stöcke im 2×2-Raster, dann an der Werkbank) und
// zeichnet dabei alle Fenster-Pakete mit. Bei einem Fehlschlag wird die Paketspur ausgegeben.
import { readFileSync } from 'node:fs'
import { Rcon } from 'rcon-client'
import mineflayer from 'mineflayer'
import pathfinderPkg from 'mineflayer-pathfinder'
import { crafte } from '../src/craften'
import { bewegungen } from '../src/eingriffe'

const RUNDEN = Number(process.argv[2] ?? 8)
const pw = readFileSync('server/server.properties', 'utf8').match(/^rcon\.password=(.*)$/m)![1]
const rcon = await Rcon.connect({ host: 'localhost', port: 25575, password: pw })
const warte = (ms: number) => new Promise(r => setTimeout(r, ms))
const bot = mineflayer.createBot({ host: 'localhost', port: 25565, username: 'Bernard', version: '26.1' })
bot.loadPlugin(pathfinderPkg.pathfinder)
const server = async (item: string) => Number((await rcon.send(`clear Bernard ${item} 0`)).match(/(\d+)/)?.[1] ?? 0)

let spur: string[] = []
let t0 = Date.now()
const notiere = (text: string) => spur.push(`${String(Date.now() - t0).padStart(6)} ${text}`)
const kurz = (item: any) => item && item.itemCount ? `${item.itemCount}×${bot.registry.items[item.itemId]?.name ?? item.itemId}` : '-'
for (const name of ['window_items', 'set_slot', 'open_window', 'close_window', 'set_player_inventory', 'set_cursor_item']) {
  bot._client.on(name, (p: any) => {
    const teile = [`<- ${name}`]
    if ('windowId' in p) teile.push(`fenster ${p.windowId}`)
    if ('stateId' in p) teile.push(`state ${p.stateId}`)
    if ('slot' in p) teile.push(`slot ${p.slot} ${kurz(p.item ?? p.contents)}`)
    if (name === 'open_window') teile.push(JSON.stringify(p.windowType ?? p.inventoryType))
    notiere(teile.join(' '))
  })
}
const schreibe = bot._client.write.bind(bot._client)
bot._client.write = (name: string, p: any) => {
  if (name === 'window_click') notiere(`-> window_click fenster ${p.windowId} state ${p.stateId} slot ${p.slot} taste ${p.mouseButton} modus ${p.mode} geändert [${p.changedSlots.map((s: any) => `${s.location}:${kurz(s.item)}`).join(' ')}] cursor ${kurz(p.cursorItem)}`)
  if (name === 'close_window') notiere(`-> close_window fenster ${p.windowId}`)
  if (name === 'block_place' || name === 'use_item_on') notiere(`-> ${name}`)
  return schreibe(name, p)
}

bot.once('spawn', async () => {
  bot.pathfinder.setMovements(bewegungen(bot))
  let fehler = 0
  for (let runde = 1; runde <= RUNDEN; runde++) {
    await rcon.send('clear Bernard')
    await rcon.send('fill -10 -60 -10 10 -55 10 air')
    await rcon.send('kill @e[type=item]')
    await rcon.send('tp Bernard 0.5 -60 0.5')
    await rcon.send('give Bernard oak_log 3')
    await warte(1500)
    spur = []; t0 = Date.now()
    const protokoll: string[] = []
    let ergebnis: unknown
    try {
      ergebnis = await crafte(bot, 'holzspitzhacke', 1, { abgebrochen: false }, () => {}, t => { notiere(`   ${t}`); protokoll.push(t) })
    } catch (e) {
      ergebnis = String(e)
    }
    await warte(800)
    const s = await server('wooden_pickaxe')
    const ok = s === 1
    if (!ok) fehler++
    console.log(`Runde ${runde}: ${ok ? 'ok    ' : 'FEHLER'} Server ${s} Spitzhacke(n), Bernard glaubt ${bot.inventory.items().filter(i => i.name === 'wooden_pickaxe').length}; ${JSON.stringify(ergebnis)}`)
    if (!ok || process.argv.includes('--spur')) console.log(spur.join('\n'))
  }
  console.log(`\n${fehler} von ${RUNDEN} Runden fehlgeschlagen`)
  bot.quit(); await rcon.end(); process.exit(0)
})
