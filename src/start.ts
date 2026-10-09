// Startet Bernard mit der Konfiguration aus config/bernard.json und der Persönlichkeit aus config/persoenlichkeit.md.
// Ohne Abschnitt "ki" versteht Bernard nur die festen Befehle.
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { starteBernard, type BernardOptionen } from './bernard'

const datei = (name: string) => new URL(`../config/${name}`, import.meta.url)
const optionen: BernardOptionen = JSON.parse(readFileSync(datei('bernard.json'), 'utf8'))
if (existsSync(datei('persoenlichkeit.md'))) optionen.persoenlichkeit = readFileSync(datei('persoenlichkeit.md'), 'utf8').trim()
// API-Schlüssel (z. B. für Groq) nie in die Datei schreiben, sondern als Umgebungsvariable setzen
if (optionen.ki && process.env.BERNARD_KI_KEY) optionen.ki.apiKey = process.env.BERNARD_KI_KEY
optionen.protokoll ??= process.env.BERNARD_PROTOKOLL ? text => console.log(text) : undefined
// Laufberichte landen neben der Konfiguration, wenn dort nichts anderes steht
optionen.laufberichtOrdner ??= fileURLToPath(datei('laufberichte'))

const bot = starteBernard(optionen)
bot.once('spawn', () => console.log(`${optionen.name} ist da. Kumpel: ${optionen.kumpel.join(', ')}. ` +
  (optionen.ki ? `KI: ${optionen.ki.modell} unter ${optionen.ki.url}` : 'Ohne KI.')))
bot.on('kicked', grund => console.error('Rausgeworfen:', grund))
bot.on('error', fehler => console.error('Fehler:', fehler.message))
