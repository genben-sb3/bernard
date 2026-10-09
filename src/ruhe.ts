// Wartet, bis der Server mit Inventar-Updates fertig ist.
import type { Bot } from 'mineflayer'

/**
 * Ab 26.x trägt jeder Inventar-Klick einen Zähler des Servers mit. Klickt Bernard, während noch Updates vom
 * letzten Schritt eintreffen, ist der Zähler veraltet und der Server ignoriert den Klick stillschweigend
 * (Craften hängt dann bis zum Zeitlimit). Deshalb vor Inventar-Aktionen warten, bis eine Weile Ruhe ist.
 */
export async function warteAufInventarRuhe(bot: Bot, ruheMs = 300, maxMs = 3000) {
  let letztes = Date.now()
  const merke = () => { letztes = Date.now() }
  bot.inventory.on('updateSlot', merke)
  try {
    const start = Date.now()
    while (Date.now() - letztes < ruheMs && Date.now() - start < maxMs) {
      await new Promise(r => setTimeout(r, 50))
    }
  } finally {
    bot.inventory.off('updateSlot', merke)
  }
}
