// Alles, was Bernard im Chat sagt, auf Deutsch und Englisch. Er antwortet in der Sprache des Befehls
// (oder fest in einer Sprache, siehe config/bernard.json → "sprache").

export type Sprache = 'de' | 'en'
export type Spracheinstellung = Sprache | 'wie-befehl'

const DEUTSCH = new Set([
  'folge', 'folg', 'mir', 'mich', 'komm', 'her', 'stopp', 'halt', 'bleib', 'hier', 'gib', 'hol', 'hole', 'sammle', 'sammel',
  'mach', 'mache', 'bau', 'baue', 'crafte', 'craften', 'was', 'hast', 'du', 'dabei', 'alles', 'bitte', 'kannst', 'könntest',
  'ein', 'eine', 'einen', 'der', 'das', 'mal', 'holz', 'stein', 'steine', 'und', 'ich', 'zwei', 'drei', 'vier', 'fünf',
  'dein', 'deine', 'inventar', 'wirf', 'besorg', 'besorge', 'lauf', 'nicht', 'stehen', 'warte', 'wie', 'geht', 'dir',
])

const ENGLISCH = new Set([
  'follow', 'me', 'come', 'here', 'stop', 'stay', 'give', 'get', 'collect', 'gather', 'craft', 'make', 'build',
  'what', 'do', 'you', 'have', 'everything', 'please', 'could', 'can', 'some', 'the', 'my', 'your', 'i', 'is', 'are',
  'inventory', 'wood', 'stone', 'logs', 'sticks', 'two', 'three', 'four', 'five', 'throw', 'run', 'wait', 'how', "what's",
])

/** Erkennt Deutsch oder Englisch an typischen Wörtern; null, wenn es nicht eindeutig ist. */
export function erkenneSprache(text: string): Sprache | null {
  let de = 0
  let en = 0
  for (const wort of text.toLowerCase().replace(/[.!?,„“"]+/g, ' ').split(/\s+/)) {
    if (DEUTSCH.has(wort)) de++
    if (ENGLISCH.has(wort)) en++
  }
  if (de === en) return null
  return de > en ? 'de' : 'en'
}

/** Die Sprache für eine Antwort auf `text`. Ist sie nicht erkennbar, Deutsch. */
export function waehleSprache(einstellung: Spracheinstellung, text: string): Sprache {
  if (einstellung !== 'wie-befehl') return einstellung
  return erkenneSprache(text) ?? 'de'
}

export type Werkzeugbedarf = 'spitzhacke'
export type Wobei = 'craften' | 'geben' | 'sammeln'

const DE = {
  folgen: 'Bin dabei, ich folge dir!',
  kommHer: 'Bin unterwegs!',
  stopp: 'Okay, ich bleib hier.',
  verstehNicht: 'Das verstehe ich noch nicht.',
  bauenNochNicht: 'Bauen kann ich noch nicht.',
  moment: 'Hmm, Moment …',
  kiWeg: 'Mein KI-Kopf ist gerade nicht erreichbar. Einfache Befehle wie „folge mir“ gehen aber.',
  keinSichtkontakt: (kumpel: string) => `${kumpel}, ich kann dich nicht sehen. Wo bist du?`,
  gestorben: 'Autsch, ich bin gestorben. Ich warte am Spawn auf neue Befehle.',
  schief: (wobei: Wobei) => `${{ craften: 'Beim Craften', geben: 'Beim Geben', sammeln: 'Beim Sammeln' }[wobei]} ist etwas schiefgegangen.`,
  // Sammeln
  holeAnsage: (was: string) => `Okay, ich hole ${was}.`,
  fertigGesammelt: (was: string) => `Fertig, ich habe ${was}!`,
  nichtsMehrDa: (kein: string, was: string) => `Ich finde hier ${kein} mehr. Ich habe ${was}.`,
  brauchtWerkzeug: (fuer: string, werkzeug: Werkzeugbedarf) => `Für ${fuer} brauche ich ${{ spitzhacke: 'eine Spitzhacke' }[werkzeug]}.`,
  // Craften und Besorgen
  fertigGecraftet: (was: string) => `Fertig: ${was}!`,
  fehlenMir: (was: string) => `Dafür fehlen mir ${was}.`,
  keinPlatzAufstellen: 'Ich finde keinen Platz zum Aufstellen.',
  werkbankAufstellen: 'Moment, ich stelle kurz eine Werkbank auf.',
  holeErst: (was: string) => `Dafür hole ich erst ${was}.`,
  erstHolzspitzhacke: (fuer: string) => `Für ${fuer} brauche ich erst eine Holzspitzhacke.`,
  findeNicht: (kein: string, fehlt: string) => `Ich finde hier ${kein}. Mir fehlen noch ${fehlt}.`,
  findeNichtKurz: (kein: string) => `Ich finde hier ${kein}.`,
  werkzeugFuer: (werkzeug: Werkzeugbedarf, fuer: string) => `${{ spitzhacke: 'eine Spitzhacke' }[werkzeug]} für ${fuer}`,
  // Inventar und Geben
  taschenLeer: 'Meine Taschen sind leer.',
  ichHabe: (liste: string) => `Ich habe ${liste}.`,
  weitere: (n: number) => `${n} weitere Sachen`,
  und: 'und',
  habeKein: (kein: string) => `Ich habe ${kein}.`,
  nichtErreicht: 'Ich komme nicht zu dir durch.',
  hierAlles: 'Hier, alles was ich habe!',
  nurSoViel: (was: string) => `Ich habe nur ${was}, hier!`,
  hier: (was: string) => `Hier, ${was}!`,
}

export type Texte = typeof DE

const EN: Texte = {
  folgen: "On it, I'm following you!",
  kommHer: 'On my way!',
  stopp: "Okay, I'll stay here.",
  verstehNicht: "I don't understand that yet.",
  bauenNochNicht: "I can't build things yet.",
  moment: 'Hmm, one moment …',
  kiWeg: 'My AI brain is not reachable right now. Simple commands like "follow me" still work.',
  keinSichtkontakt: kumpel => `${kumpel}, I can't see you. Where are you?`,
  gestorben: "Ouch, I died. I'll wait at spawn for new orders.",
  schief: wobei => `Something went wrong while ${{ craften: 'crafting', geben: 'handing things over', sammeln: 'gathering' }[wobei]}.`,
  holeAnsage: was => `Okay, I'll get ${was}.`,
  fertigGesammelt: was => `Done, I have ${was}!`,
  nichtsMehrDa: (kein, was) => `There's ${kein} left around here. I have ${was}.`,
  brauchtWerkzeug: (fuer, werkzeug) => `I need ${{ spitzhacke: 'a pickaxe' }[werkzeug]} for ${fuer}.`,
  fertigGecraftet: was => `Done: ${was}!`,
  fehlenMir: was => `I'm missing ${was} for that.`,
  keinPlatzAufstellen: "I can't find a spot to set it up.",
  werkbankAufstellen: 'One moment, setting up a crafting table.',
  holeErst: was => `First I'll get ${was}.`,
  erstHolzspitzhacke: fuer => `I need a wooden pickaxe for ${fuer} first.`,
  findeNicht: (kein, fehlt) => `There's ${kein} around here. I'm still missing ${fehlt}.`,
  findeNichtKurz: kein => `There's ${kein} around here.`,
  werkzeugFuer: (werkzeug, fuer) => `${{ spitzhacke: 'a pickaxe' }[werkzeug]} for ${fuer}`,
  taschenLeer: 'My pockets are empty.',
  ichHabe: liste => `I have ${liste}.`,
  weitere: n => `${n} more things`,
  und: 'and',
  habeKein: kein => `I have ${kein}.`,
  nichtErreicht: "I can't get to you.",
  hierAlles: 'Here, everything I have!',
  nurSoViel: was => `I only have ${was}, here!`,
  hier: was => `Here, ${was}!`,
}

export function texte(sprache: Sprache): Texte {
  return sprache === 'en' ? EN : DE
}

/** „a, b und c“ / „a, b and c“ */
export function aufzaehlung(teile: string[], sprache: Sprache) {
  return teile.length === 1 ? teile[0] : `${teile.slice(0, -1).join(', ')} ${texte(sprache).und} ${teile.at(-1)}`
}
