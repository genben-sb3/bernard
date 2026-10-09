// Szenario (Ticket 002): Bernard setzt KI-Antworten im Spiel um. Eine KI-Attrappe liefert feste Antworten,
// damit das Zusammenspiel geprüft wird, nicht die Sprachfähigkeit eines Modells (dafür: sim/diagnose-ki.ts).
import type { Rcon } from 'rcon-client'
import { starteAttrappe, type Attrappe } from '../ki-attrappe'
import { abstand, type Szenario } from '../szenario'
import { warte } from '../testspieler'

const BODEN = -60
let attrappe: Attrappe | undefined

async function anzahl(rcon: Rcon, wer: string, gegenstand: string) {
  return Number((await rcon.send(`clear ${wer} ${gegenstand} 0`)).match(/(\d+)/)?.[1] ?? 0)
}

export const ki: Szenario = {
  name: 'ki',
  beschreibung:
    'Freie Sätze gehen an eine KI (Attrappe) und werden im Spiel umgesetzt: folgen, stehen bleiben, Inventar, ' +
    'Leitern craften (Gegenstand außerhalb der Wortliste) und hergeben, ablehnen, langsame und überholte Antworten, KI-Ausfall.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [`place feature minecraft:oak 12 ${BODEN} -8`, `place feature minecraft:oak 16 ${BODEN} 6`],
  start: { Bernard: [-2, 0], Ben: [0, 0], Beobachter: [5, 0] },

  async vorbereiten() {
    attrappe = await starteAttrappe([
      { satz: /hinterher/, antwort: { werkzeug: 'follow_player' } },
      { satz: /stehen/, antwort: { werkzeug: 'stop' } },
      { satz: /schleppst/, antwort: { werkzeug: 'show_inventory' } },
      { satz: /leitern craften/i, antwort: { werkzeug: 'craft_item', argumente: { item: 'ladder', amount: 2 } } },
      { satz: /leitern rüber/i, antwort: { werkzeug: 'give_items', argumente: { item: 'ladder' } } },
      { satz: /hau mal/, antwort: { werkzeug: 'say', argumente: { text: 'Nein, auf Spieler hau ich nicht.' } } },
      { satz: /witz/i, antwort: { text: 'Warum nehmen Creeper nie ab? Weil sie immer explodieren!' }, verzoegerungMs: 4500 },
      { satz: /schlaues/i, antwort: { text: 'DIESE ANTWORT KOMMT ZU SPÄT' }, verzoegerungMs: 4000 },
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

    // 1. Folgen per freiem Satz
    b.setzePhase('KI: folgen')
    let beginn = b.jetzt
    ben.sage('Bernard, lauf mir mal hinterher')
    await warteAufChat(beginn, /folge/, 3000)
    await ben.geheZu(10, 4)
    await warte(2500)
    const nah = abstand(b.position('Ben'), b.position('Bernard'))
    b.pruefe('„lauf mir mal hinterher“ → Bernard folgt', nah <= 4, `Abstand ${nah.toFixed(1)}; ${zitat(beginn)}`)

    // 2. Stehen bleiben
    b.setzePhase('KI: stehen bleiben')
    beginn = b.jetzt
    ben.sage('Bernard, bleib mal da stehen')
    await warteAufChat(beginn, /bleib/, 3000)
    await warte(1000)
    const stand = b.position('Bernard')
    await ben.geheZu(-6, -4)
    await warte(1500)
    const bewegt = abstand(stand, b.position('Bernard'))
    b.pruefe('„bleib mal da stehen“ → Bernard bleibt', bewegt < 1, `${bewegt.toFixed(1)} Blöcke bewegt; ${zitat(beginn)}`)

    // 3. Inventar
    b.setzePhase('KI: Inventar')
    beginn = b.jetzt
    ben.sage('Bernard, was schleppst du so mit dir rum?')
    const inv = await warteAufChat(beginn, /taschen|ich habe/i, 3000)
    b.pruefe('„was schleppst du …“ → Bernard nennt sein Inventar', !!inv, zitat(beginn))

    // 4. Gegenstand außerhalb der Wortliste craften (Holz muss er dafür selbst holen)
    b.setzePhase('KI: Leitern craften')
    beginn = b.jetzt
    ben.sage('Bernard, kannst du mir zwei Leitern craften?')
    const leitern = await warteAufChat(beginn, /fertig|fehlen|finde|schief/i, 150000)
    const hatLeitern = await anzahl(rcon, 'Bernard', 'ladder')
    b.pruefe('„zwei Leitern craften“ → Bernard hat mindestens 2 Leitern', hatLeitern >= 2 && /fertig/i.test(leitern?.text ?? ''),
      `${hatLeitern} Leitern; ${zitat(beginn)}`)

    // 5. Hergeben
    b.setzePhase('KI: Leitern hergeben')
    beginn = b.jetzt
    ben.sage('Bernard, wirf mir mal die Leitern rüber')
    let beiBen = 0
    for (let i = 0; i < 60 && beiBen < 2; i++) {
      await warte(250)
      beiBen = await anzahl(rcon, 'Ben', 'ladder')
    }
    b.pruefe('„wirf mir die Leitern rüber“ → Ben bekommt sie', beiBen >= 2, `Ben hat ${beiBen} Leitern; ${zitat(beginn)}`)

    // 6. Ablehnen
    b.setzePhase('KI: ablehnen')
    beginn = b.jetzt
    ben.sage('Bernard, hau mal Ben')
    const nein = await warteAufChat(beginn, /nein/i, 3000)
    await warte(1500)
    const schaden = b.ereignisseSeit(beginn).filter(e => /Ben hat Schaden/.test(e.text)).length
    b.pruefe('„hau mal Ben“ → Bernard lehnt ab, Ben nimmt keinen Schaden', !!nein && schaden === 0, `${zitat(beginn)}; ${schaden}× Schaden`)

    // 7. Langsame Antwort: Bernard sagt „Moment“
    b.setzePhase('KI: langsame Antwort')
    beginn = b.jetzt
    ben.sage('Bernard, erzähl mal einen Witz')
    const witz = await warteAufChat(beginn, /creeper/i, 8000)
    const moment = vonBernard(beginn).find(c => /moment/i.test(c.text))
    b.pruefe('Bei langsamer KI sagt Bernard erst „Moment“, dann die Antwort',
      !!moment && !!witz && moment.t < witz.t, zitat(beginn))

    // 8. Überholt: Ein neuer Befehl macht die alte KI-Anfrage ungültig
    b.setzePhase('KI: überholte Antwort')
    beginn = b.jetzt
    ben.sage('Bernard, sag mal was Schlaues')
    await warte(800)
    ben.sage('Bernard, folge mir')
    await warte(6000)
    const zuSpaet = vonBernard(beginn).find(c => /ZU SPÄT/.test(c.text))
    const folgt = vonBernard(beginn).find(c => /folge/i.test(c.text))
    const kamAn = attrappe!.anfragen.some(a => /schlaues/i.test(a))
    b.pruefe('Eine überholte KI-Antwort wird verworfen', kamAn && !zuSpaet && !!folgt,
      `${kamAn ? 'KI hat die Anfrage bekommen' : 'KI hat die Anfrage NICHT bekommen'}; ${zitat(beginn)}`)
    ben.sage('Bernard, stopp')
    await warte(500)

    // 9. KI fällt aus: einmal Bescheid sagen, Schnellweg geht weiter
    b.setzePhase('KI: Ausfall')
    attrappe!.setzeAusgefallen(true)
    beginn = b.jetzt
    ben.sage('Bernard, tanz mal')
    const ausfall = await warteAufChat(beginn, /nicht erreichbar/, 5000)
    ben.sage('Bernard, folge mir')
    const schnell = await warteAufChat(beginn, /folge/i, 3000)
    const zweite = b.jetzt
    ben.sage('Bernard, spring mal')
    await warte(2000)
    const wiederholt = vonBernard(zweite).some(c => /nicht erreichbar/.test(c.text))
    const verstehtNicht = vonBernard(zweite).some(c => /verstehe ich noch nicht/.test(c.text))
    b.pruefe('Bei KI-Ausfall: einmal Bescheid sagen, Schnellweg funktioniert', !!ausfall && !!schnell && !wiederholt && verstehtNicht,
      zitat(beginn))

    const ueberSchnellweg = attrappe!.anfragen.filter(a => /folge mir|stopp/.test(a))
    b.pruefe('Feste Befehle gehen nie an die KI', ueberSchnellweg.length === 0,
      `KI bekam ${attrappe!.anfragen.length} Anfragen${ueberSchnellweg.length ? `, darunter: ${ueberSchnellweg.join(', ')}` : ''}`)
    b.karte('Gesamt – KI', 0)
  },
}
