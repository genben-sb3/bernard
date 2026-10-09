// Erkennt Befehle im Chat (Schnellweg ohne KI).
import { DINGE, dingAusWort, type DingName, type DingSchluessel } from './dinge'

export type Befehl =
  | { art: 'folgen' }
  | { art: 'stopp' }
  | { art: 'kommHer' }
  | { art: 'sammeln'; menge: number; material: Material; mengeGeraten: boolean }
  | { art: 'inventar' }
  /** ding null = alles; menge 'alle' = alles von diesem Ding */
  | { art: 'geben'; ding: DingSchluessel | null; menge: number | 'alle' }
  | { art: 'craften'; ding: DingSchluessel; menge: number }
  /** Ein Vorhaben starten: selbstständig bis zu dieser Stufe spielen (5: Enderdrache). */
  | { art: 'vorhaben'; zielstufe: number }
  /** Pausiertes oder unterbrochenes Vorhaben fortsetzen. */
  | { art: 'weiter' }
  /** Das Vorhaben ganz beenden. */
  | { art: 'vergessen' }
  /** Fragen, was Bernard gerade tut und wie weit er ist. */
  | { art: 'status' }

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

const ZAHLWOERTER: Record<string, number> = {
  ein: 1, eine: 1, einen: 1, einem: 1, a: 1, an: 1, one: 1,
  zwei: 2, two: 2, drei: 3, three: 3, vier: 4, four: 4, 'fünf': 5, fuenf: 5, five: 5,
  sechs: 6, six: 6, sieben: 7, seven: 7, acht: 8, eight: 8, neun: 9, nine: 9, zehn: 10, ten: 10,
}
const ARTIKEL = /^(die|den|das|der|dein|deine|deinen|the|your|some)$/

/** Zerlegt „5 holz“, „eine werkbank“, „die holzspitzhacke“ in Menge (oder null) und Ding. */
function mengeUndDing(rest: string): { menge: number | null; ding: DingName } | null {
  const woerter = rest.split(' ')
  let menge: number | null = null
  if (/^\d+$/.test(woerter[0])) menge = Number(woerter.shift())
  else if (ZAHLWOERTER[woerter[0]] !== undefined) menge = ZAHLWOERTER[woerter.shift()!]
  else if (ARTIKEL.test(woerter[0])) woerter.shift()
  if (/^(stück|stueck|stk)$/.test(woerter[0])) woerter.shift()
  const ding = dingAusWort(woerter.join(' '))
  return ding ? { menge, ding } : null
}

const INVENTAR = /^(was hast du( dabei| bei dir| im inventar)?|(zeig )?(dein |mir dein )?inventar|inventory|what do you have|what('s| is) in your inventory)$/
const GEBEN = /^(gib|give)( mir| me) (.+)$/
const ALLES = /^(alles|everything|all deine sachen|all your stuff|all your items)$/
const CRAFTEN = /^(mach|mache|crafte|craft|bau|baue|stell)( mir| me)? (.+?)( her)?$/

/** Wörter für Stufen → Nummer. */
const STUFEN_WOERTER: Record<string, number> = {
  steinzeit: 1, 'stone age': 1, eisenzeit: 2, 'iron age': 2, diamantzeit: 3, 'diamond age': 3,
  nether: 4, end: 5, 'the end': 5,
}
const SPIEL_BIS = /^(spiel|spiele|play)( minecraft)? (bis|until)( zur| zum| the)? (.+)$/
const SPIELENDE = /^((besieg|besiege|töte|toete|kill|defeat|beat)( den| the)? (enderdrachen|ender ?dragon)|beat (the game|minecraft)|spiel (minecraft )?durch)$/

/** „steinzeit“, „stufe 2“, „stage 3“ → Stufe 1 bis 5 (oder null). */
function stufeAusWort(wort: string): number | null {
  const nummer = wort.match(/^(stufe|stage) ([1-5])$/)
  if (nummer) return Number(nummer[2])
  return STUFEN_WOERTER[wort] ?? null
}

const SAMMELN = /^(hol|hole|sammle|sammel|bring|get|collect|gather)( mir| me)? (?:(\d+) )?(?:(?:stück|stueck|stk) )?(\S+)$/

export type Nachricht = {
  absender: string
  text: string
  privat: boolean
}

/** Wörter, die nichts am Befehl ändern („bleib mal da stehen“, „folg mir bitte“). */
const FUELLWOERTER = new Set(['mal', 'bitte', 'doch', 'eben', 'kurz', 'denn', 'ja', 'jetzt', 'please', 'just'])

const MUSTER: Array<[RegExp, Befehl]> = [
  [/^(mach( mit dem vorhaben)? weiter|weiter|continue|keep going|go on|resume)$/, { art: 'weiter' }],
  [/^(vergiss (das vorhaben|es)|hör auf mit dem vorhaben|hoer auf mit dem vorhaben|forget (the plan|it))$/, { art: 'vergessen' }],
  [/^(was (machst|tust) du( gerade| da)?|wie weit bist du|what are you doing|how far are you( along)?|status)$/, { art: 'status' }],
  [/^(folge?|folg) mir$|^follow me$/, { art: 'folgen' }],
  [/^(stopp?|halt|bleib( hier| stehen| da| da stehen| hier stehen)?|stay( here)?)$/, { art: 'stopp' }],
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
  const normal = text.toLowerCase().replace(/[.!?,]+/g, ' ').split(/\s+/).filter(w => w && !FUELLWOERTER.has(w)).join(' ')
  // Feste Sätze zuerst: „mach weiter“ ist kein Craften
  for (const [muster, befehl] of MUSTER) {
    if (muster.test(normal)) return befehl
  }
  if (INVENTAR.test(normal)) return { art: 'inventar' }
  if (SPIELENDE.test(normal)) return { art: 'vorhaben', zielstufe: 5 }
  const spielBis = normal.match(SPIEL_BIS)
  if (spielBis) {
    const zielstufe = stufeAusWort(spielBis[5])
    return zielstufe ? { art: 'vorhaben', zielstufe } : null
  }
  const geben = normal.match(GEBEN)
  if (geben) {
    if (ALLES.test(geben[3])) return { art: 'geben', ding: null, menge: 'alle' }
    const was = mengeUndDing(geben[3])
    return was ? { art: 'geben', ding: was.ding, menge: was.menge ?? 'alle' } : null
  }
  const craften = normal.match(CRAFTEN)
  if (craften) {
    const was = mengeUndDing(craften[3])
    if (!was || !('herstellen' in DINGE[was.ding])) return null
    return { art: 'craften', ding: was.ding, menge: was.menge ?? 1 }
  }
  const sammeln = normal.match(SAMMELN)
  if (sammeln) {
    const material = MATERIAL_WOERTER[sammeln[4]]
    if (!material) return null
    const menge = sammeln[3] ? Number(sammeln[3]) : STANDARDMENGE
    return { art: 'sammeln', menge, material, mengeGeraten: !sammeln[3] }
  }
  return null
}

/** Ob ein Spieler ein Kumpel ist (Groß-/Kleinschreibung egal, wie bei Minecraft-Namen). */
export function istKumpel(spieler: string, kumpel: readonly string[]): boolean {
  return kumpel.some(k => k.toLowerCase() === spieler.toLowerCase())
}
