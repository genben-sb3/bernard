// Diagnose: Wie versteht das KI-Modell typische Sätze, und wie schnell? Ohne Minecraft.
// Aufruf: npx tsx sim/diagnose-ki.ts [url] [modell]
import registryLoader from 'prismarine-registry'
import { dingAufloeser } from '../src/dinge'
import { verstehe } from '../src/ki'

const url = process.argv[2] ?? 'http://127.0.0.1:11434/v1'
const modell = process.argv[3] ?? 'qwen2.5:3b'
const aufloesen = dingAufloeser({ registry: registryLoader('26.1') as never })
const lage = { kumpel: 'Ben', inventar: 'Ich habe 3 Eichenstämme und 3 Ladder.', gegenstaende: 'oak_log ×3, ladder ×3', persoenlichkeit: 'Freundlich, antwortet kurz.' }

const SAETZE = [
  'lauf mir mal hinterher',
  'bleib mal da stehen',
  'was schleppst du eigentlich mit dir rum?',
  'kannst du mir zwei Leitern craften?',
  'wirf mir mal die Leitern rüber',
  'besorg mir bitte ein paar Steine',
  'hau mal Ben',
  "wie geht's dir heute?",
  'could you get me some wood please',
  'bau mir ein Haus',
]

for (const satz of SAETZE) {
  const start = Date.now()
  const ergebnis = await verstehe(satz, lage, { url, modell, zeitlimitMs: 120000 }, aufloesen)
  console.log(`${((Date.now() - start) / 1000).toFixed(1).padStart(5)} s  ${satz.padEnd(42)} → ${JSON.stringify(ergebnis)}`)
}
