// Erkennt Befehle im Chat (Schnellweg ohne KI).

export type Befehl =
  | { art: 'folgen' }
  | { art: 'stopp' }
  | { art: 'kommHer' }

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
  for (const [muster, befehl] of MUSTER) {
    if (muster.test(normal)) return befehl
  }
  return null
}

/** Ob ein Spieler ein Kumpel ist (Groß-/Kleinschreibung egal, wie bei Minecraft-Namen). */
export function istKumpel(spieler: string, kumpel: readonly string[]): boolean {
  return kumpel.some(k => k.toLowerCase() === spieler.toLowerCase())
}
