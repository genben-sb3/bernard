// KI-Attrappe für die Simulation: eine OpenAI-kompatible Schnittstelle mit festen Antworten.
// So lässt sich Bernards Umgang mit KI-Antworten im Spiel prüfen, unabhängig davon, wie gut oder schnell
// ein echtes Modell ist.
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export type Antwort =
  | { werkzeug: string; argumente?: Record<string, unknown> }
  | { text: string }

export type Regel = { satz: RegExp; antwort: Antwort; verzoegerungMs?: number }

export type Attrappe = {
  url: string
  /** Simuliert einen Ausfall: Anfragen bekommen HTTP 503. */
  setzeAusgefallen(aus: boolean): void
  anfragen: string[]
  beende(): Promise<void>
}

export async function starteAttrappe(regeln: Regel[]): Promise<Attrappe> {
  let ausgefallen = false
  const anfragen: string[] = []
  const server: Server = createServer((req, res) => {
    let body = ''
    req.on('data', teil => { body += teil })
    req.on('end', async () => {
      if (ausgefallen) {
        res.writeHead(503).end('ausgefallen')
        return
      }
      const nachrichten = (JSON.parse(body) as { messages: Array<{ role: string; content: string }> }).messages
      const satz = nachrichten.filter(n => n.role === 'user').at(-1)?.content ?? ''
      anfragen.push(satz)
      const regel = regeln.find(r => r.satz.test(satz))
      if (regel?.verzoegerungMs) await new Promise(r => setTimeout(r, regel.verzoegerungMs))
      const antwort = regel?.antwort ?? { text: 'Hä?' }
      const nachricht = 'werkzeug' in antwort
        ? { role: 'assistant', content: '', tool_calls: [{ id: 'a1', type: 'function', function: { name: antwort.werkzeug, arguments: JSON.stringify(antwort.argumente ?? {}) } }] }
        : { role: 'assistant', content: antwort.text }
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ choices: [{ message: nachricht }] }))
    })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}/v1`,
    setzeAusgefallen: aus => { ausgefallen = aus },
    anfragen,
    beende: () => new Promise(resolve => server.close(() => resolve())),
  }
}
