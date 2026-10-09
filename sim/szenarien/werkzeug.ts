// Szenario: Inventar zeigen, Bretter und eine Holzspitzhacke craften (Werkbank aufstellen und
// wieder mitnehmen), damit Stein abbauen, Fehlendes melden und Sachen an Ben geben.
import type { Bot } from 'mineflayer'
import type { Rcon } from 'rcon-client'
import { Vec3 } from 'vec3'
import { type Szenario } from '../szenario'
import { warte } from '../testspieler'

const BODEN = -60

/** Wie viele Stück von `gegenstand` `wer` hat (laut Server). */
async function anzahl(rcon: Rcon, wer: string, gegenstand: string) {
  const antwort = await rcon.send(`clear ${wer} ${gegenstand} 0`)
  return Number(antwort.match(/(\d+)/)?.[1] ?? 0)
}

function werkbaenkeImUmkreis(welt: Bot, mitte: Vec3, radius: number) {
  return welt.findBlocks({ matching: welt.registry.blocksByName.crafting_table.id, point: mitte, maxDistance: radius, count: 10 })
}

export const werkzeug: Szenario = {
  name: 'werkzeug',
  beschreibung:
    'Bernard zeigt sein Inventar, craftet Bretter und eine Holzspitzhacke (Werkbank aufstellen und mitnehmen), ' +
    'baut damit Stein ab, sagt, was ihm für einen Ofen fehlt, und gibt Ben 3 Stein und dann alles.',
  spieler: ['Ben'],
  kumpel: ['Ben'],
  aufbau: [`fill 6 ${BODEN} -5 8 ${BODEN} -5 stone`], // genau 3 Stein: für den Ofen reicht es nicht
  start: {
    Bernard: [-2, 0],
    Ben: [0, 0],
    Beobachter: [3, -1],
  },

  async ablauf({ rcon, beobachter: b, spieler }) {
    const ben = spieler.Ben
    const warteAufChat = async (seit: number, muster: RegExp, maxMs: number) => {
      for (let t = 0; t < maxMs; t += 250) {
        const zeile = b.chatSeit(seit).find(c => c.von === 'Bernard' && muster.test(c.text))
        if (zeile) return zeile
        await warte(250)
      }
      return undefined
    }
    const letzteVonBernard = (seit: number) => b.chatSeit(seit).filter(c => c.von === 'Bernard').at(-1)?.text ?? '–'
    await rcon.send('give Bernard oak_log 6')
    await warte(500)

    // 1. Inventar
    b.setzePhase('Inventar')
    let beginn = b.jetzt
    ben.sage('Bernard, was hast du dabei?')
    const inventar = await warteAufChat(beginn, /ich habe|taschen/i, 3000)
    b.pruefe('Bernard nennt sein Inventar', !!inventar && /6 Eichenstämme/.test(inventar.text), inventar ? `„${inventar.text}“` : 'keine Antwort')

    // 2. Bretter
    b.setzePhase('Bretter craften')
    beginn = b.jetzt
    ben.sage('Bernard, mach 4 Bretter')
    const bretter = await warteAufChat(beginn, /fertig|fehlen|schief/i, 10000)
    const planken = await anzahl(rcon, 'Bernard', 'oak_planks')
    const staemme = await anzahl(rcon, 'Bernard', 'oak_log')
    b.pruefe('Bernard craftet 4 Bretter aus einem Stamm', planken === 4 && staemme === 5,
      `Antwort „${bretter?.text ?? letzteVonBernard(beginn)}“; ${planken} Bretter, ${staemme} Stämme`)

    // 3. Holzspitzhacke: braucht eine Werkbank
    b.setzePhase('Holzspitzhacke craften')
    beginn = b.jetzt
    ben.sage('Bernard, mach eine Holzspitzhacke')
    const hacke = await warteAufChat(beginn, /fertig|fehlen|schief|platz/i, 30000)
    await warte(1000)
    const spitzhacken = await anzahl(rcon, 'Bernard', 'wooden_pickaxe')
    b.pruefe('Bernard craftet eine Holzspitzhacke', spitzhacken === 1,
      `Antwort „${hacke?.text ?? letzteVonBernard(beginn)}“; ${spitzhacken} Spitzhacke(n)`)
    const bernard = b.position('Bernard')
    const stehen = bernard ? werkbaenkeImUmkreis(b.bot, new Vec3(bernard.x, bernard.y, bernard.z), 8) : []
    let bankImInventar = 0
    for (let i = 0; i < 12 && bankImInventar === 0; i++) {
      bankImInventar = await anzahl(rcon, 'Bernard', 'crafting_table')
      if (bankImInventar === 0) await warte(250)
    }
    const liegt = bankImInventar === 1 ? '' : (await rcon.send('data get entity @e[type=item,nbt={Item:{id:"minecraft:crafting_table"}},limit=1] Pos'))
    const inventarLautServer = bankImInventar === 1 ? '' : (await rcon.send('data get entity Bernard Inventory')).slice(0, 400)
    b.pruefe('Bernard nimmt die Werkbank wieder mit', stehen.length === 0 && bankImInventar === 1,
      `${stehen.length} Werkbank(en) stehen noch, ${bankImInventar} im Inventar` +
      (liegt ? `; liegt: ${liegt}; Ben hat ${await anzahl(rcon, 'Ben', 'crafting_table')}; Inventar laut Server: ${inventarLautServer}` : ''))

    // 4. Mit der Spitzhacke Stein holen
    b.setzePhase('Stein holen')
    beginn = b.jetzt
    ben.sage('Bernard, hol 3 Stein')
    const stein = await warteAufChat(beginn, /fertig|finde|brauche|schief/i, 60000)
    const bruchstein = await anzahl(rcon, 'Bernard', 'cobblestone')
    b.pruefe('Bernard baut mit der Spitzhacke 3 Stein ab', bruchstein >= 3,
      `Antwort „${stein?.text ?? letzteVonBernard(beginn)}“; ${bruchstein} Bruchstein`)
    b.karte('4 – Stein holen', beginn)

    // 5. Ofen: dafür reicht der Stein nicht
    b.setzePhase('Ofen (zu wenig Stein)')
    beginn = b.jetzt
    ben.sage('Bernard, mach einen Ofen')
    // Seit Ticket 001 versucht er erst, den Stein selbst zu holen; in der Nähe gibt es aber keinen mehr
    const ofen = await warteAufChat(beginn, /finde|fehlen|fertig|schief/i, 30000)
    const erwartet = `${8 - bruchstein} Bruchstein`
    const holtErst = b.chatSeit(beginn).some(c => c.von === 'Bernard' && /hole ich erst/.test(c.text))
    b.pruefe('Bernard versucht, den Stein für den Ofen zu holen, und sagt, wie viel fehlt',
      holtErst && !!ofen && /keinen Bruchstein/.test(ofen.text) && ofen.text.includes(erwartet),
      ofen ? `„${ofen.text}“ (erwartet: ${erwartet}${holtErst ? '' : '; keine Ansage „hole ich erst“'})` : 'keine Antwort')

    // 6. Geben
    b.setzePhase('3 Stein geben')
    beginn = b.jetzt
    ben.sage('Bernard, gib mir 3 Stein')
    const hier = await warteAufChat(beginn, /hier|keine|komme nicht|schief/i, 15000)
    // „Hier“ kommt beim Werfen; aufheben kann Ben erst nach 2 s
    let beiBen = 0
    for (let i = 0; i < 20 && beiBen < 3; i++) {
      await warte(250)
      beiBen = await anzahl(rcon, 'Ben', 'cobblestone')
    }
    b.pruefe('Ben bekommt 3 Stein', beiBen === 3, `Antwort „${hier?.text ?? letzteVonBernard(beginn)}“; Ben hat ${beiBen} Bruchstein`)

    b.setzePhase('Alles geben')
    beginn = b.jetzt
    ben.sage('Bernard, gib mir alles')
    const alles = await warteAufChat(beginn, /hier|leer|schief/i, 15000)
    await warte(3500)
    const restBeiBernard = await rcon.send('data get entity Bernard Inventory')
    const leer = /\[\]\s*$/.test(restBeiBernard)
    const hackeBeiBen = await anzahl(rcon, 'Ben', 'wooden_pickaxe')
    b.pruefe('Bernard gibt alles her, Ben bekommt es', leer && hackeBeiBen === 1,
      `Antwort „${alles?.text ?? letzteVonBernard(beginn)}“; Bernards Inventar ${leer ? 'leer' : 'nicht leer'}, Ben hat ${hackeBeiBen} Spitzhacke`)
    await warte(1500)
    const liegen = await rcon.send('execute positioned 0.5 -60 0.5 if entity @e[type=item,distance=..10]')
    const anzahlLiegend = Number(liegen.match(/Count: (\d+)/)?.[1] ?? 0)
    b.pruefe('Nach der Übergabe liegt nichts mehr herum', anzahlLiegend === 0,
      anzahlLiegend === 0 ? 'Ben hat alles aufgehoben' : `${anzahlLiegend} Gegenstände liegen am Boden`)
    ben.sage('Bernard, was hast du dabei?')
    const leerAntwort = await warteAufChat(b.jetzt - 100, /taschen|ich habe/i, 3000)
    b.pruefe('Danach sagt Bernard, dass er nichts mehr hat', !!leerAntwort && /leer/.test(leerAntwort.text),
      leerAntwort ? `„${leerAntwort.text}“` : 'keine Antwort')
    b.karte('Gesamt – Geben', beginn)
  },
}
