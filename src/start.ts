// Startet Bernard mit der Konfiguration aus config/bernard.json.
import { readFileSync } from 'node:fs'
import { starteBernard, type BernardOptionen } from './bernard'

const pfad = new URL('../config/bernard.json', import.meta.url)
const optionen: BernardOptionen = JSON.parse(readFileSync(pfad, 'utf8'))
const bot = starteBernard(optionen)
bot.once('spawn', () => console.log(`${optionen.name} ist da. Kumpel: ${optionen.kumpel.join(', ')}`))
bot.on('kicked', grund => console.error('Rausgeworfen:', grund))
bot.on('error', fehler => console.error('Fehler:', fehler.message))
