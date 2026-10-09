// Szenario (Ticket 003): Bernard antwortet in der Sprache des Befehls.
// Englische Befehle → englische Antworten mit Minecraft-Namen; ein deutscher Befehl dazwischen → Deutsch.
import type { Rcon } from 'rcon-client'
import { starteAttrappe, type Attrappe } from '../ki-attrappe'
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'

const BODEN = -60
let attrappe: Attrappe | undefined

async function anzahl(rcon: Rcon, wer: string, gegenstand: string) {
  return Number((await rcon.send(`clear ${wer} ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

export const englisch: Szenario = {
  name: 'englisch',
  beschreibung: 'Englische Befehle (Schnellweg und KI) bekommen englische Antworten, ein deutscher Befehl dazwischen eine deutsche.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [`place feature minecraft:oak 10 ${BODEN} -6`],
  start: { Bernard: [-2, 0], Ben: [0, 0], Beobachter: [4, -2] },

  async vorbereiten() {
    attrappe = await starteAttrappe([
      { satz: /crafting table/i, antwort: { werkzeug: 'craft_item', argumente: { item: 'crafting_table' } } },
    ])
    return { ki: { url: attrappe.url, modell: 'attrappe', zeitlimitMs: 10000 }, aufraeumen: () => attrappe!.beende() }
  },

  async ablauf({ rcon, beobachter: b, spieler }) {
    const ben = spieler.Ben
    const vonBernard = (seit: number) => b.chatSeit(seit).filter(c => c.von === 'Bernard')
    const warteAufChat = async (seit: number, muster: RegExp, maxMs: number) => {
      for (let t = 0; t < maxMs; t += 250) {
        const zeile = vonBernard(seit).find(c => muster.test(c.text))
        if (zeile) return zeile
        await warte(250)
      }
      return undefined
    }
    const zitat = (seit: number) => vonBernard(seit).map(c => `„${c.text}“`).join(' ') || 'nichts'
    const frage = async (phase: string, satz: string, erwartet: RegExp, maxMs = 4000) => {
      b.setzePhase(phase)
      const beginn = b.jetzt
      ben.sage(`Bernard, ${satz}`)
      const antwort = await warteAufChat(beginn, erwartet, maxMs)
      b.pruefe(`„${satz}“ → ${erwartet.source}`, !!antwort, zitat(beginn))
      return beginn
    }

    await frage('follow me', 'follow me', /^On it, I'm following you!$/)
    await ben.geheZu(6, 4)
    await warte(2000)
    const nah = abstand(b.position('Ben'), b.position('Bernard'))
    b.pruefe('… und folgt auch', nah <= 4, `Abstand ${nah.toFixed(1)}`)

    await frage('stop', 'stop', /^Okay, I'll stay here\.$/)
    await frage('inventory', 'what do you have', /^My pockets are empty\.$/)

    let beginn = await frage('get wood', 'get 3 wood', /^Okay, I'll get 3 Wood\.$/)
    const fertig = await warteAufChat(beginn, /^Done, I have \d+ Wood!$/, 90000)
    b.pruefe('… und meldet sich auf Englisch fertig', !!fertig, zitat(beginn))

    await frage('Deutsch dazwischen', 'was hast du dabei?', /^Ich habe \d+ Eichenstämme/)

    beginn = await frage('KI auf Englisch', 'could you make me a crafting table please?', /^Done: 1 Crafting Table!$/, 30000)
    b.pruefe('… und hat die Werkbank', await anzahl(rcon, 'Bernard', 'crafting_table') === 1, zitat(beginn))

    await frage('nichts da', 'give me 5 sand', /^I have no sand\.$/)
    await frage('alles geben', 'give me everything', /^Here, everything I have!$/, 15000)
    await frage('leer', 'what do you have', /^My pockets are empty\.$/, 6000)
  },
}
