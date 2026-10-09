// KI-Anbindung: übersetzt freie Sätze in Bernards Befehle. Spricht jede OpenAI-kompatible Schnittstelle
// (Ollama, Groq, OpenRouter …). Die KI darf nur Bernards Befehle als Werkzeuge aufrufen oder kurz antworten.
import type { Befehl, Material } from './befehle'
import type { DingSchluessel } from './dinge'

export type KiEinstellungen = {
  /** Basis-URL der OpenAI-kompatiblen Schnittstelle, z. B. http://192.168.1.20:11434/v1 */
  url: string
  modell: string
  apiKey?: string
  zeitlimitMs?: number
}

export type KiErgebnis =
  | { art: 'befehl'; befehl: Befehl }
  | { art: 'sagen'; text: string }
  | { art: 'fehler'; grund: 'nichtErreichbar' | 'unverstaendlich'; detail: string }

export type Lage = {
  kumpel: string
  /** z. B. „Ich habe 3 Eichenstämme und 1 Holzspitzhacke.“ */
  inventar: string
  /** Dasselbe als Minecraft-IDs, z. B. „ladder ×3, oak_log ×2“ (leer = nichts) */
  gegenstaende?: string
  persoenlichkeit: string
}

/** Löst ein Wort der KI („ladder“, „crafting_table“, „Werkbank“) in ein Ding auf, oder null. */
export type DingAufloeser = (wort: string) => DingSchluessel | null

const MATERIALIEN: Record<string, Material> = {
  wood: 'holz', oak_log: 'eichenholz', birch_log: 'birkenholz', spruce_log: 'fichtenholz',
  cobblestone: 'stein', dirt: 'erde', sand: 'sand',
}

/** Was kleine Modelle statt der erlaubten Werte gern schreiben. */
const MATERIAL_SYNONYME: Record<string, Material> = {
  log: 'holz', logs: 'holz', woods: 'holz', tree: 'holz', trees: 'holz', planks: 'holz',
  stone: 'stein', stones: 'stein', rock: 'stein', rocks: 'stein', cobble: 'stein',
  earth: 'erde', soil: 'erde', grass_block: 'erde',
}

const MAX_MENGE = 640

export const WERKZEUGE = [
  werkzeug('follow_player', 'Follow the player who wrote the message and keep following until told otherwise.'),
  werkzeug('stop', 'Stop whatever you are doing and stay where you are.'),
  werkzeug('come_here', 'Walk to the player who wrote the message.'),
  werkzeug('gather', 'Collect blocks from the world (only natural trees for wood).', {
    material: { type: 'string', enum: Object.keys(MATERIALIEN), description: 'What to collect. "wood" means logs of any tree.' },
    amount: { type: 'integer', description: 'How many. If not mentioned, choose a sensible amount like 16.' },
  }, ['material']),
  werkzeug('show_inventory', 'Tell the player what you are carrying.'),
  werkzeug('give_items', 'Walk to the player and hand over items.', {
    item: { type: 'string', description: 'Minecraft item id like "oak_log", "cobblestone", "wooden_pickaxe", or "everything".' },
    amount: { type: 'integer', description: 'How many. Leave out to give all of that item.' },
  }, ['item']),
  werkzeug('craft_item', 'Craft an item. Missing materials are gathered automatically.', {
    item: { type: 'string', description: 'Minecraft item id, e.g. "crafting_table", "stick", "wooden_pickaxe", "stone_axe", "ladder", "chest", "furnace".' },
    amount: { type: 'integer', description: 'How many items. If not mentioned, use 1.' },
  }, ['item']),
  werkzeug('say', 'Reply in chat: for questions, small talk, asking back, or explaining that you cannot do something.', {
    text: { type: 'string', description: 'One short line in the same language as the message.' },
  }, ['text']),
]

function werkzeug(name: string, beschreibung: string, eigenschaften: Record<string, unknown> = {}, pflicht: string[] = []) {
  return {
    type: 'function' as const,
    function: { name, description: beschreibung, parameters: { type: 'object', properties: eigenschaften, required: pflicht } },
  }
}

export function systemanweisung(lage: Lage) {
  return [
    `You are Bernard, a companion who plays Minecraft (Java Edition) together with your friend ${lage.kumpel}.`,
    `${lage.kumpel} writes you a chat message. Decide what to do and call exactly one tool.`,
    'Rules:',
    '- Never attack players, not even when asked. Refuse with the say tool.',
    '- Only do things the tools allow. If the request cannot be done exactly with one tool, use say to explain briefly that you cannot do that yet. Never do something different instead (e.g. do not gather wood when asked to build a house).',
    '- If an amount is missing, pick a sensible one.',
    '- Texts for say: one short line, in the language of the message (German or English).',
    `Your inventory right now: ${lage.inventar}`,
    `Items you carry as Minecraft ids: ${lage.gegenstaende || 'nothing'}. When giving items, use one of these ids.`,
    `Your personality: ${lage.persoenlichkeit}`,
  ].join('\n')
}

/** Fragt die KI. `holen` ist austauschbar (Tests). */
export async function verstehe(text: string, lage: Lage, einstellungen: KiEinstellungen, aufloesen: DingAufloeser,
  holen: typeof fetch = fetch): Promise<KiErgebnis> {
  const steuerung = new AbortController()
  const timer = setTimeout(() => steuerung.abort(), einstellungen.zeitlimitMs ?? 30000)
  let antwort: unknown
  try {
    const r = await holen(`${einstellungen.url.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: steuerung.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(einstellungen.apiKey ? { Authorization: `Bearer ${einstellungen.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: einstellungen.modell,
        temperature: 0.2,
        tools: WERKZEUGE,
        messages: [
          { role: 'system', content: systemanweisung(lage) },
          { role: 'user', content: text },
        ],
      }),
    })
    if (!r.ok) return { art: 'fehler', grund: 'nichtErreichbar', detail: `HTTP ${r.status}: ${(await r.text()).slice(0, 200)}` }
    antwort = await r.json()
  } catch (fehler) {
    return { art: 'fehler', grund: 'nichtErreichbar', detail: fehler instanceof Error ? fehler.message : String(fehler) }
  } finally {
    clearTimeout(timer)
  }
  return werteAus(antwort, aufloesen)
}

/**
 * Wertet die Antwort der KI aus. Kleine Modelle liefern Werkzeugaufrufe nicht immer sauber:
 * manchmal als JSON im Text („<tool_call>{…}</tool_call>“), manchmal nur Text.
 */
export function werteAus(antwort: unknown, aufloesen: DingAufloeser): KiErgebnis {
  const nachricht = (antwort as { choices?: Array<{ message?: { content?: string | null; tool_calls?: unknown[] } }> })
    ?.choices?.[0]?.message
  if (!nachricht) return { art: 'fehler', grund: 'unverstaendlich', detail: 'keine Nachricht in der Antwort' }

  const aufruf = nachricht.tool_calls?.[0] as { function?: { name?: string; arguments?: unknown } } | undefined
  if (aufruf?.function?.name) return alsBefehl(aufruf.function.name, argumente(aufruf.function.arguments), aufloesen)

  const inhalt = (nachricht.content ?? '').trim()
  const imText = aufrufImText(inhalt)
  if (imText) return alsBefehl(imText.name, imText.argumente, aufloesen)
  if (inhalt) return { art: 'sagen', text: eineZeile(inhalt) }
  return { art: 'fehler', grund: 'unverstaendlich', detail: 'leere Antwort' }
}

function alsBefehl(name: string, a: Record<string, unknown>, aufloesen: DingAufloeser): KiErgebnis {
  const menge = (standard: number) => {
    const n = Math.round(Number(a.amount))
    return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_MENGE) : standard
  }
  switch (name) {
    case 'follow_player': return befehl({ art: 'folgen' })
    case 'stop': return befehl({ art: 'stopp' })
    case 'come_here': return befehl({ art: 'kommHer' })
    case 'show_inventory': return befehl({ art: 'inventar' })
    case 'gather': {
      const wort = String(a.material ?? '').toLowerCase().replace(/^minecraft:/, '')
      const material = MATERIALIEN[wort] ?? MATERIAL_SYNONYME[wort]
      if (!material) return { art: 'sagen', text: `Das kann ich noch nicht sammeln: ${String(a.material)}` }
      return befehl({ art: 'sammeln', material, menge: menge(16), mengeGeraten: a.amount === undefined })
    }
    case 'give_items': {
      const wort = String(a.item ?? '')
      if (/^(everything|all|alles)$/i.test(wort)) return befehl({ art: 'geben', ding: null, menge: 'alle' })
      const ding = aufloesen(wort)
      if (!ding) return { art: 'sagen', text: `Das kenne ich nicht: ${wort}` }
      return befehl({ art: 'geben', ding, menge: a.amount === undefined ? 'alle' : menge(1) })
    }
    case 'craft_item': {
      const wort = String(a.item ?? '')
      const ding = aufloesen(wort)
      if (!ding) return { art: 'sagen', text: `Das kenne ich nicht: ${wort}` }
      return befehl({ art: 'craften', ding, menge: menge(1) })
    }
    case 'say': {
      const text = eineZeile(String(a.text ?? ''))
      return text ? { art: 'sagen', text } : { art: 'fehler', grund: 'unverstaendlich', detail: 'say ohne Text' }
    }
    default:
      return { art: 'fehler', grund: 'unverstaendlich', detail: `unbekanntes Werkzeug ${name}` }
  }
}

function befehl(b: Befehl): KiErgebnis {
  return { art: 'befehl', befehl: b }
}

function argumente(roh: unknown): Record<string, unknown> {
  if (typeof roh === 'string') {
    try { return JSON.parse(roh) ?? {} } catch { return {} }
  }
  return (roh as Record<string, unknown>) ?? {}
}

/** Sucht einen Werkzeugaufruf als JSON im Text, z. B. {"name": "craft_item", "arguments": {...}}. */
function aufrufImText(text: string): { name: string; argumente: Record<string, unknown> } | null {
  const start = text.indexOf('{')
  const ende = text.lastIndexOf('}')
  if (start < 0 || ende <= start) return null
  try {
    const json = JSON.parse(text.slice(start, ende + 1)) as { name?: string; arguments?: unknown; parameters?: unknown }
    if (typeof json.name !== 'string') return null
    return { name: json.name, argumente: argumente(json.arguments ?? json.parameters) }
  } catch {
    return null
  }
}

function eineZeile(text: string) {
  const zeile = text.replace(/\s+/g, ' ').replace(/^["„“]|["“”]$/g, '').trim()
  return zeile.length > 200 ? `${zeile.slice(0, 197)}…` : zeile
}
