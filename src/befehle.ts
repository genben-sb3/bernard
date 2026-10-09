// Erkennt Befehle im Chat (Schnellweg ohne KI).

export type Befehl =
  | { art: 'folgen' }
  | { art: 'stopp' }
  | { art: 'kommHer' }
  | { art: 'sammeln'; menge: number; material: Material; mengeGeraten: boolean }

export type Material = 'holz' | 'eichenholz' | 'birkenholz' | 'fichtenholz' | 'stein' | 'erde' | 'sand'

/** Wörter im Chat → Material. */
const MATERIAL_WOERTER: Record<string, Material> = {
  holz: 'holz', wood: 'holz', log: 'holz', logs: 'holz', stamm: 'holz', 'stämme': 'holz',
  eichenholz: 'eichenholz', eiche: 'eichenholz', oak: 'eichenholz',
  birkenholz: 'birkenholz', birke: 'birkenholz', birch: 'birkenholz',
  fichtenholz: 'fichtenholz', fichte: 'fichtenholz', spruce: 'fichtenholz',
  stein: 'stein', steine: 'stein', bruchstein: 'stein', stone: 'stein', cobblestone: 'stein',
  erde: 'erde', dirt: 'erde',
  sand: 'sand',
}

/** Menge, wenn der Kumpel keine nennt (Bernard rät und sagt es an). */
export const STANDARDMENGE = 16

const SAMMELN = /^(hol|hole|sammle|sammel|bring|get|collect|gather)( mir| me)? (?:(\d+) )?(?:(?:stück|stueck|stk) )?(\S+)$/

export type Nachricht = {
  absender: string
  text: string
  privat: boolean
}

const MUSTER: Array<[RegExp, Befehl]> = [
  [/^(folge?|folg) mir$|^follow me$/, { art: 'folgen' }],
  [/^(stopp?|halt|bleib( hier| stehen)?|stay)$/, { art: 'stopp' }],
  [/^(komm( her| zu mir)?|come( here)?)$/, { art: 'kommHer' }],
]

/** Liefert den Text ohne Anrede, wenn die Nachricht an Bernard gerichtet ist, sonst null. */
export function anBernard(nachricht: Nachricht, name = 'Bernard'): string | null {
  const text = nachricht.text.trim()
  if (nachricht.privat) return text
  const anrede = new RegExp(`^(hey |hi |hallo )?${name}\\b[\\s,:!]*`, 'i')
  const treffer = text.match(anrede)
  if (!treffer) return null
  return text.slice(treffer[0].length)
}

/** Erkennt einen Befehl im Text (ohne Anrede). Liefert null, wenn der Schnellweg ihn nicht kennt. */
export function erkenneBefehl(text: string): Befehl | null {
  const normal = text.toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ').trim()
  const sammeln = normal.match(SAMMELN)
  if (sammeln) {
    const material = MATERIAL_WOERTER[sammeln[4]]
    if (!material) return null
    const menge = sammeln[3] ? Number(sammeln[3]) : STANDARDMENGE
    return { art: 'sammeln', menge, material, mengeGeraten: !sammeln[3] }
  }
  for (const [muster, befehl] of MUSTER) {
    if (muster.test(normal)) return befehl
  }
  return null
}

/** Ob ein Spieler ein Kumpel ist (Groß-/Kleinschreibung egal, wie bei Minecraft-Namen). */
export function istKumpel(spieler: string, kumpel: readonly string[]): boolean {
  return kumpel.some(k => k.toLowerCase() === spieler.toLowerCase())
}
