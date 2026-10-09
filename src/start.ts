// Startet Bernard mit der Konfiguration aus config/bernard.json.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { starteBernard, type BernardOptionen } from './bernard'

const pfad = new URL('../config/bernard.json', import.meta.url)
const optionen: BernardOptionen = JSON.parse(readFileSync(pfad, 'utf8'))
// Laufberichte landen neben der Konfiguration, wenn dort nichts anderes steht
const laufberichtOrdner = fileURLToPath(new URL('../config/laufberichte', import.meta.url))
const bot = starteBernard({ laufberichtOrdner, ...optionen })
bot.once('spawn', () => console.log(`${optionen.name} ist da. Kumpel: ${optionen.kumpel.join(', ')}`))
bot.on('kicked', grund => console.error('Rausgeworfen:', grund))
bot.on('error', fehler => console.error('Fehler:', fehler.message))
